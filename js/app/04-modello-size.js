/* ================= MODELLO SIZE (spot calcolati) ================= */
const PROFILES = {
  course: { n: "Pool NL (dati di riferimento)", d: "folda quanto misurato nel field REG NL50: più la size è grande, più folda, anche oltre la teoria", fold: (s, sp) => courseFold(s, sp) },
  reg: { n: "Reg teorico (MDF)", d: "difende esattamente la MDF con le sue mani migliori: contro di lui un bluff puro vale zero a qualsiasi size", frac: s => 1 / (1 + s) },
  station: { n: "Calling station", d: "paga con qualsiasi coppia fino a 3/4 pot; contro size grandi solo con le coppie migliori", station: true },
  nit: { n: "Nit", d: "folda troppo, soprattutto contro le size grandi", frac: s => 0.75 / Math.pow(1 + s, 1.35) },
  pool: { n: "Il tuo pool NL25", d: "chiama quanto dicono le tue statistiche di popolazione", frac: s => 1 - poolFold(s) / 100 },
};
const theo = s => 100 * s / (1 + s);
function courseFold(s, sp) {
  const line = sp ? sp.cfg + "-" + sp.line : "srp-A";
  if (line === "3bp-A") return Math.max(5, theo(s) - 6);
  const pts = line === "srp-B" ? [[0.33, 38], [0.7, 58], [1.5, 85]] : [[0.33, 31], [0.7, 55], [1.5, 69]];
  let f;
  if (s <= pts[0][0]) f = theo(s) + (pts[0][1] - theo(pts[0][0]));
  else if (s >= pts[2][0]) f = theo(s) + (pts[2][1] - theo(pts[2][0]));
  else { const i = s <= pts[1][0] ? 0 : 1; const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; f = y0 + (y1 - y0) * (s - x0) / (x1 - x0); }
  return Math.max(5, Math.min(92, f));
}
const COURSE_NOTE = {
  "srp-A": "Dati di riferimento (REG NL50, BB contro il terzo barrel): folda il 31% contro 30% pot, il 55% contro 70% e il 69% contro 150%, sempre più della teoria (23%, 41%, 60%).",
  "sb-A": "Uso i dati di riferimento di BTN vs BB contro il terzo barrel: 31% di fold contro 30% pot, 55% contro 70%, 69% contro 150%.",
  "srp-B": "Dati di riferimento (REG NL50, BB che ha chiamato il flop e visto il turn check-check): folda il 38% contro 30% pot, il 58% contro 70% e l'85% contro 150%.",
  "3bp-A": "Dati di riferimento: nei 3-bet pot IP il field chiama troppo (under fold): qui folda circa 6 punti meno della teoria, quindi pochi bluff al river.",
};
const PROFILES_END = {
};
function poolFold(s) {
  const pts = [0.33, 0.5, 0.75, 1, 1.5].map(x => [x, POOL.f[x]]).filter(p => p[1] != null && p[1] !== "");
  if (!pts.length) return 100 * s / (1 + s);
  if (s <= pts[0][0]) return +pts[0][1];
  for (let i = 1; i < pts.length; i++) if (s <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return +y0 + (+y1 - +y0) * (s - x0) / (x1 - x0); }
  return +pts[pts.length - 1][1];
}
const poolReady = () => POOL && POOL.f && [0.33, 0.5, 0.75, 1, 1.5].filter(x => POOL.f[x] != null && POOL.f[x] !== "").length >= 3;
function parseSpot(sp) {
  if (sp._p) return sp._p;
  const cats = sp.runs.map(r => r[1]), ws = sp.runs.map(r => r[2]), zs = sp.runs.map(r => r[0]);
  const tot = ws.reduce((a, b) => a + b, 0);
  sp._p = { cats, ws, zs, tot };
  return sp._p;
}
function spotSizes(sp) {
  const r = sp.stack / sp.pot;
  const out = [0, 0.33, 0.5, 0.75, 1, 1.5].filter(s => s <= r + 1e-9);
  if (r < 1.5 && !out.includes(r)) out.push(Math.round(r * 100) / 100);
  return out;
}
function spotEV(sp, s, pk) {
  const { cats, ws, zs, tot } = parseSpot(sp);
  let B = 0, T = 0, W = 0, Ball = 0, Tall = 0, Wall = 0;
  const zone = i => ["B", "T", "W"][zs[i]];
  cats.forEach((c, i) => { const z = zone(i); if (z === "B") Ball += ws[i]; else if (z === "T") Tall += ws[i]; else Wall += ws[i]; });
  const evCheck = (Wall + Tall / 2) / tot;
  if (s === 0) return { ev: 0, call: 0, B: 0, W: 0, T: 0, evCheck, catsW: {} };
  const prof = PROFILES[pk];
  const callW = new Array(cats.length).fill(0);
  if (prof.station) {
    const mTot = cats.reduce((a, c, i) => a + (c === "M" ? ws[i] : 0), 0);
    let mAcc = 0;
    cats.forEach((c, i) => {
      if (c === "F" || c === "T") callW[i] = ws[i];
      else if (c === "M") {
        if (s <= 0.75) callW[i] = ws[i];
        else if (s <= 1.01) { const room = Math.max(0, 0.6 * mTot - mAcc); callW[i] = Math.min(ws[i], room); mAcc += ws[i]; }
      }
    });
  } else {
    let need = (prof.fold ? 1 - prof.fold(s, sp) / 100 : prof.frac(s)) * tot;
    for (let i = 0; i < cats.length && need > 1e-9; i++) { const t = Math.min(ws[i], need); callW[i] = t; need -= t; }
  }
  const catsW = {};
  callW.forEach((w, i) => { if (!w) return; const z = zone(i); if (z === "B") B += w; else if (z === "T") T += w; else { W += w; catsW[cats[i]] = (catsW[cats[i]] || 0) + w; } });
  const call = B + T + W;
  const F = tot - call;
  const evBet = (F + W * (1 + s) + T * 0.5 - B * s) / tot;
  return { ev: evBet - evCheck, call: call / tot, B: B / tot, W: W / tot, T: T / tot, evCheck, catsW };
}
const LINE_TXT = {
  "srp-A": "BTN apre, il BB chiama. Hai puntato 1/3 al flop e 2/3 al turn: il BB ha chiamato entrambe le volte e al river fa check.",
  "srp-B": "BTN apre, il BB chiama. Hai puntato 1/3 al flop (call), al turn check-check. Al river il BB fa check.",
  "sb-A": "Hai aperto da SB, il BB ha chiamato (è in posizione). Hai puntato 1/3 al flop e 2/3 al turn, lui ha chiamato. River: tocca a te.",
  "3bp-A": "Il CO apre a 2,2bb, tu 3-betti a 7bb da BTN e il CO chiama. Hai puntato 1/3 al flop e 2/3 al turn, lui ha chiamato e al river fa check.",
};
const VIL = { srp: "BB", sb: "BB", "3bp": "CO" };
function spotBody(sp, pk) {
  const prof = PROFILES[pk];
  return `<p class="ctx">${LINE_TXT[sp.cfg + "-" + sp.line]}</p>` + tableHtml([{ lbl: "Board", cards: sp.board }, { hero: 1, lbl: "La tua mano", cards: sp.hero }]) +
    `<div class="potviz"><div class="pv k-pot"><span>Piatto al river</span><b>${bb(sp.pot)}</b></div><div class="pv"><span>Stack dietro</span><b>${bb(sp.stack)}</b></div><div class="pv win"><span>Batti il suo range</span><b>${Math.round(sp.eq * 100)}%</b></div></div>` +
    `<p class="hint">Avversario: <b>${prof.n}</b>, ${prof.d}.${pk === "course" ? " " + COURSE_NOTE[sp.cfg + "-" + sp.line] : ""} Ecco con cosa è arrivato al river (${VIL[sp.cfg]}):</p>${stackHtml(sp.comp)}${legendHtml(sp.comp)}`;
}
function evTable(sp, pk, chosen) {
  const sizes = spotSizes(sp);
  const evs = sizes.map(s => ({ s, ...spotEV(sp, s, pk) })).map(e => ({ ...e, bbv: e.ev * sp.pot }));
  const best = evs.reduce((a, b) => b.bbv > a.bbv + 1e-9 ? b : a);
  const max = Math.max(...evs.map(e => Math.abs(e.bbv)), 0.5);
  const rows = evs.map(e => { const w = Math.abs(e.bbv) / max * 50; const left = e.bbv >= 0 ? 50 : 50 - w; return `<div class="evrow"><b>${sizeName(e.s)}</b><div class="evtrack"><div class="zero"></div><i style="left:${left}%;width:${w}%;background:${e === best ? "var(--good)" : e.bbv < 0 ? "var(--bad)" : "var(--c-top)"}"></i></div><span class="mono">${e.bbv >= 0 ? "+" : ""}${fmt(e.bbv, 1)}bb</span></div>`; }).join("");
  return { evs, best, html: `<div class="evbars">${rows}</div>` };
}
function whyText(sp, best, evs) {
  if (best.s === 0) {
    if (sp.eq < 0.35) return "I suoi fold non bastano a ripagare il rischio: questo bluff non ha bersaglio.";
    const bets = (evs || []).filter(e => e.s > 0);
    const top = bets.length ? bets.reduce((a, b) => b.bbv > a.bbv ? b : a) : null;
    if (top && top.call > 0) {
      const tie = top.bbv > -Math.max(0.6, 0.01 * sp.pot);
      return `Con ${sizeName(top.s)} chiama il ${Math.round(top.call * 100)}% del suo range: il ${Math.round(top.B * 100)}% ti batte e solo il ${Math.round(top.W * 100)}% è peggiore. ` +
        (tie ? `Guadagni con le mani peggiori quanto perdi con quelle migliori: puntare ${sizeName(top.s)} e fare check valgono quasi uguale (${fmt(top.bbv, 1)}bb), quindi vanno bene tutte e due.${sp.stack / sp.pot < 2 ? " Con SPR così basso il check evita anche il check-raise all-in delle sue mani forti." : ""}` :
          "Le mani migliori pagano più di quelle peggiori: la tua mano vale di più a showdown.");
    }
    return "Qualsiasi puntata viene pagata più da mani migliori che da mani peggiori: la tua mano vale di più a showdown.";
  }
  const cw = Object.entries(best.catsW).sort((a, b) => b[1] - a[1]).map(([L]) => CATL[L].n.toLowerCase()).slice(0, 2).join(" e ");
  if (sp.eq >= 0.5) return `Con ${sizeName(best.s)} chiama il ${Math.round(best.call * 100)}% del suo range: il ${Math.round(best.W * 100)}% sono mani peggiori della tua (${cw || "mani deboli"}), solo il ${Math.round(best.B * 100)}% ti batte.`;
  return `Con ${sizeName(best.s)} folda il ${Math.round((1 - best.call) * 100)}% del suo range, mentre per andare in pari ne servono il ${Math.round(best.s / (1 + best.s) * 100)}%. Più grande è la size, più deve foldare: qui i fold crescono abbastanza da ripagarla.`;
}
const profilesAvail = () => ["course", "course", "reg", "station", "nit", ...(poolReady() ? ["pool", "pool"] : [])];

