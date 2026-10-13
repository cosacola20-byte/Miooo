/* ================= STUDY: preflop + postflop in un unico albero ================= */
let GW = { line: [], board: "", layers: [], sel: null, tab: "strat", rview: "ev", filter: null, busy: false, pick: null, set: null, cache: new Map(), rep: {} };
/* rake PokerStars cash NL per livello: % e cap in € per 2, 3-4 e 5+ giocatori seduti nella mano */
const RAKE_PS = {
  NL2: { bb: 0.02, pct: 5.5, cap: [1, 1.5, 2] }, NL5: { bb: 0.05, pct: 6, cap: [1, 1.5, 2] }, NL10: { bb: 0.10, pct: 6, cap: [1, 1.5, 2.5] },
  NL25: { bb: 0.25, pct: 6, cap: [1, 1.5, 2.5] }, NL50: { bb: 0.50, pct: 6, cap: [1.5, 2, 3] }, NL100: { bb: 1, pct: 5.5, cap: [1.5, 2.5, 3.5] },
  NL200: { bb: 2, pct: 5.5, cap: [1.5, 2.5, 3.5] }, NL500: { bb: 5, pct: 5.5, cap: [1.5, 2.5, 3.5] }, NL1000: { bb: 10, pct: 5.5, cap: [1.5, 2.5, 3.5] },
};
/* 6-max con il tavolo pieno: si usa il cap per 5-10 giocatori */
function rakePS(stake, players) { const R = RAKE_PS[stake]; if (!R) return null; const c = R.cap[players <= 2 ? 0 : players <= 4 ? 1 : 2]; return { rake: R.pct, cap: Math.round(c / R.bb * 100) / 100, capEur: c }; }
function rakeDefaultStake() { try { return LEVELS[curLevelIdx()].stake; } catch (e) { return "NL25"; } }
const GW_SET0 = () => ({ f: [33, 100], t: [75], r: [75], rz: [75], rz2: [], maxR: 2, oopSep: false, fo: [33], to: [75], ro: [75], allin: true, lead: true, donk: false, it: 100, itT: 200, rake: 5, cap: 3 });
/* size di OOP (lead e donk): uguali a IP o separate */
function gwSetSave() { if (typeof S === "undefined") return; const s = GW.set; S.gwSet = { f: s.f, t: s.t, r: s.r, rz: s.rz, rz2: s.rz2 || [], maxR: s.maxR ?? 2, oopSep: !!s.oopSep, fo: s.fo, to: s.to, ro: s.ro, allin: s.allin, donk: s.donk, lead: s.lead, it: s.it, itT: s.itT, rake: s.rake, cap: s.cap, rakeLvl: s.rakeLvl || "" }; persistSoon(); }
const gwOopSz = (s, k) => s.oopSep && s[k + "o"] && s[k + "o"].length ? s[k + "o"] : s[k];
const GW_SUIT = { s: ["♠", "#4b4f57"], h: ["♥", "#c62f35"], d: ["♦", "#2a6fc2"], c: ["♣", "#2d9148"] };
const gwCardS = (c, big) => { const r = c[0] === "T" ? "T" : c[0], s = GW_SUIT[c[1]]; return `<span class="gwcard${big ? " big" : ""}" style="background:${s[1]}"><b>${r}</b><i>${s[0]}</i></span>`; };
const gwCardI = (i, big) => gwCardS(hcstr(i), big);
function gwCol(a) {
  if (a.kind === "fold") return "#4f86c6";
  if (a.kind === "check" || a.kind === "call") return "#5ab966";
  if (a.kind === "allin") return "#6d1111";
  if (a.kind === "raise" || a.kind === "raise2") return "#a52a2a";
  const f = a.frac || 0.5;
  return f <= 0.4 ? "#e8927c" : f <= 0.7 ? "#e0654e" : f <= 1.05 ? "#c43b2c" : "#8e1f1a";
}
const gwPreCol = k => ({ fold: "#4f86c6", call: "#5ab966", raise: "#e0654e", raise2: "#b0302a", allin: "#6d1111" })[k];

/* ---------- stato preflop (tabelle GTO) ---------- */
function gwPre() {
  const line = GW.line, dec = [];
  const reach = Object.fromEntries(PF_POS.map(p => [p, new Float64Array(PF_N).fill(1)]));
  let li = 0, opener = null, tb = null, cur = null, end = null, flop = null;
  const take = (pos, sp) => {
    if (li >= line.length) { cur = { pos, sp }; return null; }
    const a = line[li];
    const SF = gwSpF(sp); for (let k = 0; k < PF_N; k++) { const f = SF[pfName(k)]; reach[pos][k] *= f ? f[a] : 0; }
    dec.push({ pos, sp, a, back: li }); li++;
    return a;
  };
  for (const p of PF_POS) {
    if (p === "BB") { end = "Tutti foldano: il BB vince i bui."; break; }
    const a = take(p, preT("rfi_" + pfLow(p)));
    if (a == null) break;
    if (a === 1) { opener = p; break; }
  }
  if (opener && !cur && !end) {
    const after = PF_POS.slice(PF_POS.indexOf(opener) + 1);
    for (const p of after) {
      const sp = pfSpotFor(p, opener), a = take(p, sp);
      if (a == null) break;
      const k = pfKind(sp.acts[a]);
      if (k === "call") { flop = { a: opener, b: p, amt: pfNum(preT("rfi_" + pfLow(opener)).acts[1]), agg: opener, kind: "SRP" }; break; }
      if (k !== "fold") { tb = p; break; }
    }
    if (!cur && !flop && !tb) end = `Tutti foldano: il ${opener} vince i bui.`;
  }
  if (tb && !cur && !end && !flop) {
    const sp = preT(pfLow(opener) + "_vs_" + pfLow(tb) + "3");
    if (!sp) end = "Non c'è una tabella per questa risposta al 3-bet.";
    else {
      const a = take(opener, sp);
      if (a != null) {
        const k = pfKind(sp.acts[a]), d3 = pfSpotFor(tb, opener);
        if (k === "fold") end = `Il ${opener} folda: il ${tb} vince il piatto.`;
        else if (k === "call") flop = { a: opener, b: tb, amt: pfNum(d3.acts[d3.acts.length - 1]), agg: tb, kind: "3-bet pot" };
        else {
          /* le tabelle finiscono qui: il solver preflop continua l'albero (4-bet, 5-bet all-in) */
          const x3 = pfNum(d3.acts[d3.acts.length - 1]), x4 = pfNum(sp.acts[a]);
          const T4 = gwPf4(opener, tb, x3, x4, reach[opener], reach[tb]);
          const spB = gwPf4Spot(T4, T4.nodes[0], `${tb} contro il 4-bet a ${fmtN(x4)}bb del ${opener}`);
          const b2 = take(tb, spB);
          if (b2 != null) {
            const kb = T4.nodes[0].acts[b2].kind;
            if (kb === "fold") end = `Il ${tb} folda: il ${opener} vince il piatto.`;
            else if (kb === "call") flop = { a: opener, b: tb, amt: x4, agg: opener, kind: "4-bet pot" };
            else {
              const spA = gwPf4Spot(T4, T4.nodes[1], `${opener} contro il 5-bet all-in del ${tb}`);
              const a3 = take(opener, spA);
              if (a3 != null) end = T4.nodes[1].acts[a3].kind === "fold" ? `Il ${opener} folda: il ${tb} vince il piatto.` : `All-in preflop chiamato: piatto ${fmtN(200 + (opener !== "SB" && tb !== "SB" ? 0.5 : 0) + (opener !== "BB" && tb !== "BB" ? 1 : 0))}bb, si gira il board.`;
            }
          }
        }
      }
    }
  }
  if (flop) {
    const pr = [flop.a, flop.b].sort((x, y) => PF_POST[x] - PF_POST[y]);
    flop.oop = pr[0]; flop.ip = pr[1];
    const dead = (flop.a !== "SB" && flop.b !== "SB" ? 0.5 : 0) + (flop.a !== "BB" && flop.b !== "BB" ? 1 : 0);
    flop.pot = Math.round((2 * flop.amt + dead) * 100) / 100; flop.stack = Math.round((100 - flop.amt) * 100) / 100;
    flop.reach = [reach[flop.oop], reach[flop.ip]];
  }
  return { dec, cur, end, flop, reach };
}
function gwRangeFromReach(r) {
  const out = [];
  for (let k = 0; k < PF_N; k++) { const w = r[k]; if (w < 0.004) continue; const nm = pfName(k); hExpand(nm).forEach(c => out.push({ c, w, key: nm })); }
  return out;
}
/* nodi oltre le tabelle GTO: risposta al 4-bet risolta al volo (CFR sulle 169 mani) */
function gwPf4(a, b, x3, x4, rA, rB) {
  GW.pf4c = GW.pf4c || new Map();
  const key = [a, b, x3, x4, GW.set ? GW.set.rake + "/" + GW.set.cap : "", Array.from(rA).reduce((s, x) => s + x, 0).toFixed(3), Array.from(rB).reduce((s, x) => s + x, 0).toFixed(3)].join("|");
  if (GW.pf4c.has(key)) return GW.pf4c.get(key);
  pfLoad();
  const S = 100, dead = 1.5 - (PF_BLIND[a] || 0) - (PF_BLIND[b] || 0), ipA = PF_POST[a] > PF_POST[b];
  const cfg = { rake: (GW.set ? GW.set.rake : 5) / 100, cap: GW.set ? GW.set.cap : 3, stack: S };
  const terms = [], term = (t, iA, iB, extra) => { const o = { t, iA, iB, pot: iA + iB + dead, ...extra }; o.id = terms.length; terms.push(o); return o; };
  const nA = { pl: 0, iA: x4, iB: S, depth: 3, acts: [{ lb: "Fold", kind: "fold", child: term("fold", x4, S, { win: 1 }) }, { lb: "Call all-in", kind: "call", child: term("call", S, S, { allin: true }) }] };
  const nB = { pl: 1, iA: x4, iB: x3, depth: 2, acts: [{ lb: "Fold", kind: "fold", child: term("fold", x4, x3, { win: 0 }) }, { lb: "Call", kind: "call", child: term("call", x4, x4, { allin: false }) }, { lb: `All-in ${S}bb`, kind: "allin", child: nA }] };
  nB.id = 0; nA.id = 1;
  pfTermMats(terms, cfg, S, ipA);
  const T = { cfg, nodes: [nB, nA], terms, root: nB, dead, ipA, openFixed: true };
  pfInitSolve(T, Float64Array.from(rA)); T.rB0 = Float64Array.from(rB);
  for (let i = 0; i < 1000; i++) pfIter(T);
  pfExploit(T);
  GW.pf4c.set(key, T);
  return T;
}
function gwPf4Spot(T, nd, label) {
  const f = {}; for (let k = 0; k < PF_N; k++) f[pfName(k)] = nd.acts.map((_, a) => nd.avg[a * PF_N + k]);
  return { acts: nd.acts.map(x => x.lb), f, label: label + " · risolto dal solver", solver: true };
}
/* ---------- postflop ---------- */
const gwLayer = () => GW.layers[GW.layers.length - 1];
function gwWalk(L, steps) {
  let n = L.E.tree.root; const out = [];
  for (const k of steps) { out.push({ n, k }); n = n.ch[k]; }
  return { n, trail: out };
}
function gwSolve(board, pot, stack, ranges, kind, oopAgg, S2) {
  const s = GW.set, pc = x => x.map(v => v / 100);
  const lead = s.lead ? 1 : 0;
  const samp = board.length === 3 ? gwSampFor(s.it) : null;
  const mR = x => x == null ? (s.maxR ?? 2) : x;
  if (S2) { const rz2 = pc(S2.rz2 || s.rz2 || []), sz = {}; [3, 4, 5].forEach(k => { const x = S2[k]; sz[k] = x ? { oop: pc(x.oop), ip: pc(x.ip), rz: pc(S2.rz || []), rz2 } : null; }); if (samp && !sz[5]) sz[5] = { oop: s.lead ? pc(gwOopSz(s, "r")) : [], ip: pc(s.r), rz: pc(S2.rz || []), rz2 }; return { board, pot, stack, ranges, sz, allin: S2.allin !== false, maxR: mR(S2.maxR), rake: s.rake / 100, cap: s.cap, kind, sample: samp }; }
  const sz = {
    3: { oop: oopAgg || s.donk ? pc(oopAgg ? s.f : gwOopSz(s, "f")) : [], ip: pc(s.f), rz: pc(s.rz), rz2: pc(s.rz2 || []) },
    4: { oop: lead || oopAgg ? pc(gwOopSz(s, "t")) : [], ip: pc(s.t), rz: pc(s.rz), rz2: pc(s.rz2 || []) },
    5: { oop: lead || oopAgg ? pc(gwOopSz(s, "r")) : [], ip: pc(s.r), rz: pc(s.rz), rz2: pc(s.rz2 || []) },
  };
  return { board, pot, stack, ranges, sz, allin: s.allin, maxR: mR(null), rake: s.rake / 100, cap: s.cap, kind, sample: samp };
}
/* precisione del flop: turn e river campionati in modo stratificato, con le puntate su tutte le street */
function gwSampFor(it) { return it <= 50 ? { t: 12, r: 6 } : it <= 100 ? { t: 16, r: 8 } : { t: 24, r: 12 }; }
function gwStartSolve(o, label, onDone, E0) {
  if (GW.busy) return;
  if (!E0) {
    const iters0 = o.iters || (o.board.length === 3 ? GW.set.it : GW.set.itT), key = gwSolKey(o, iters0), ctx = gwMemCtx(o), tok = GW.solveTok = (GW.solveTok || 0) + 1;
    GW.busy = true; GW.prog = { fr: 0, ms: 0, label: "Cerco lo spot nella memoria...", nodes: 0, mem: 0 }; renderStudy();
    gwMemGet(key, o).then(Ec => {
      if (tok !== GW.solveTok) return;
      GW.busy = false;
      if (Ec) { GW.evAuto = null; GW.cache = new Map(); GW.fromMem = true; Ec.fromCache = true; onDone(Ec); renderStudy(); return; }
      if (typeof tlSolveAllowed === "function" && !tlSolveAllowed()) { renderStudy(); return; }
      GW.fromMem = false; gwRunSolve(o, label, onDone, null, key, ctx);
    }).catch(() => { if (tok !== GW.solveTok) return; GW.busy = false; gwRunSolve(o, label, onDone, null); });
    return;
  }
  gwRunSolve(o, label, onDone, E0);
}
function gwRunSolve(o, label, onDone, E0, key, ctx) {
  const E = E0 || msInit(o, null, true);
  E.cancel = false; GW.solveE = E;
  GW.busy = true; GW.prog = { fr: 0, ms: 0, label, nodes: E.nAct, mem: E.mem };
  renderStudy();
  const iters = o.iters || (o.board.length === 3 ? GW.set.it : GW.set.itT);
  msSolveAuto(E, iters, (fr, ms) => { GW.prog.fr = fr; GW.prog.ms = ms; const b = $("#gwProg"); if (b) { b.style.width = Math.round(fr * 100) + "%"; const t = $("#gwProgT"); if (t) t.textContent = `${Math.round(fr * 100)}% · ${fmt(ms / 1000, 0)}s · ${E.par > 1 ? E.par + " core in parallelo" : "1 core"}`; } }, E2 => { if (E2.cancel) return; GW.busy = false; GW.solveE = null; GW.evAuto = null; GW.cache = new Map(); if (!E0 && E2.ms > 500 && E2.mem > 0) (GW.rateK = GW.rateK || {})[o.board.length === 3 ? 3 : 4] = E2.ms / 1000 / (E2.mem / 8 * iters); onDone(E2); renderStudy(); if (key) gwMemPut(key, E2, ctx); });
}

/* ---------- componenti grafici ---------- */
function gwGrid(cells, opts) {
  /* cells[k] = { w: 0..1, seg: [[col, frac]], ev, txt } */
  let h = `<div class="gwgrid${opts && opts.sm ? " sm" : ""}">`;
  for (let k = 0; k < PF_N; k++) {
    const c = cells[k], nm = pfName(k);
    if (!c || c.w < 0.002) { h += `<div class="gwc off" data-gh="${k}"><span>${nm}</span></div>`; continue; }
    let acc = 0; const st = c.seg.filter(s => s[1] > 0.001).map(([col, f]) => { const s = `${col} ${acc * 100}% ${(acc + f) * 100}%`; acc += f; return s; });
    if (acc < 0.999) st.push(`transparent ${acc * 100}% 100%`);
    const bg = c.bg ? c.bg : `linear-gradient(90deg,${st.join(",")})`;
    h += `<div class="gwc${GW.sel === k ? " sel" : ""}" data-gh="${k}"><i style="height:${c.full ? 100 : Math.max(6, c.w * 100)}%;background:${bg}"></i><span>${nm}</span>${c.txt != null ? `<em>${c.txt}</em>` : ""}</div>`;
  }
  return h + `</div>`;
}
function gwActBoxes(acts, tot, W, clickable, gto) {
  return `<div class="gwboxes${acts.length > 3 ? " many" : ""}">${acts.map((a, i) => `<button class="gwbox${GW.filter === i ? " on" : ""}" data-gf="${i}" style="background:${a.col}"><span class="gwbox-l">${esc(a.lab)}${a.sub ? `<small>${a.sub}</small>` : ""}${gto ? `<small class="gwgto">GTO ${fmt(gto[i] * 100, 1)}%</small>` : ""}</span><span class="gwbox-f"><span class="gwbox-p">${fmt(W ? tot[i] / W * 100 : 0, 1)}%</span><span class="gwbox-c">${fmt(tot[i], 1)}<small>combo</small></span></span></button>`).join("")}</div><div class="gwbar">${acts.map((a, i) => `<i style="width:${W ? tot[i] / W * 100 : 0}%;background:${a.col}"></i>`).join("")}</div>`;
}
function gwStrip(items) {
  return `<div class="gwstrip">${items.map(it => {
    if (it.type === "info") return `<div class="gwsc info"><div class="gwsc-h"><b>${esc(it.title)}</b></div><ul>${it.lines.map(l => `<li>${l}</li>`).join("")}</ul><div class="gwrow" style="margin:2px 0 0;gap:4px"><button class="gwmini gwnew" data-gnew="1" title="Cancella la mano che stai analizzando e torna all'inizio del preflop">⟲ Nuova mano</button><button class="gwmini" data-gset="1">⚙ Albero</button>${it.direct ? `<button class="gwmini" data-gpre="1">↩ Preflop</button>` : ""}</div></div>`;
    if (it.type === "street") return `<button class="gwsc street" ${it.click ? `data-gstreet="${it.click}"` : "disabled"}><div class="gwsc-h"><b>${it.name}</b><span>${it.pot != null ? fmtN(it.pot) : ""}</span></div><div class="gwsc-cards">${it.cards.length ? it.cards.map(c => gwCardS(c, true)).join("") : `<span class="gwpick">Scegli</span>`}</div></button>`;
    return `<div class="gwsc dec${it.cur ? " cur" : ""}"><div class="gwsc-h"><b>${it.lock ? "🔒 " : ""}${it.pos}</b><span>${it.stack != null ? fmtN(it.stack) : ""}${it.edit ? `<button class="gwpen" data-gned="${it.edit}" title="Modifica le size">✎</button>` : ""}</span></div><div class="gwsc-a">${it.acts.map((a, i) => `<button ${it.cur ? `data-gact="${i}"` : it.back != null ? `data-gback="${it.back}" data-gbk="${i}"` : "disabled"} class="${it.sel === i ? "on" : ""}" style="${it.sel === i ? `color:${a.col}` : ""}">${esc(a.lab)}</button>`).join("")}</div></div>`;
  }).join("")}</div>`;
}
function gwCardPicker(sel, used, max) {
  const R = "AKQJT98765432";
  let h = `<div class="gwpickgrid">`;
  for (const s of "shdc") for (const r of R) { const c = r + s, on = sel.includes(c), dis = used.has(c); h += `<button class="gwpc${on ? " on" : ""}" data-gpc="${c}" ${dis ? "disabled" : ""} style="--sc:${GW_SUIT[s][1]}"><b>${r}</b><i>${GW_SUIT[s][0]}</i></button>`; }
  return h + `</div>`;
}

/* ---------- pagina ---------- */
function renderStudy() {
  pfLoad();
  gwSetInit();
  const D = GW.direct;
  const P = D ? { dec: [], cur: null, end: null, flop: { oop: D.oop, ip: D.ip, pot: D.pot, stack: D.stack, kind: D.title, agg: D.oop }, reach: {} } : gwPre();
  const items = [];
  const f = P.flop;
  items.push({ type: "info", title: D ? D.title : f ? `${f.oop} vs ${f.ip}` : "Preflop 6-max", lines: f ? [`Stack ${fmtN(f.stack)}bb`, `Piatto ${fmtN(f.pot)}bb`, `Rake ${fmtN(GW.set.rake)}% cap ${fmtN(GW.set.cap)}bb${GW.set.rakeLvl ? ` (rake ${GW.set.rakeLvl})` : ""}`, f.kind] : ["Stack 100bb", "Tabelle GTO", `Rake ${fmtN(GW.set.rake)}% cap ${fmtN(GW.set.cap)}bb${GW.set.rakeLvl ? ` (rake ${GW.set.rakeLvl})` : ""}`], direct: !!D });
  const stackOf = {}; PF_POS.forEach(p => stackOf[p] = 100 - (PF_BLIND[p] || 0));
  P.dec.forEach(d => { const lb = d.sp.acts[d.a], n = pfNum(lb); items.push({ type: "dec", pos: d.pos, stack: stackOf[d.pos], acts: d.sp.acts.map(x => ({ lab: x, col: gwPreCol(pfKind(x)) })), sel: d.a, back: "p" + d.back }); if (n && pfKind(lb) !== "fold") stackOf[d.pos] = 100 - n; });
  if (P.cur) items.push({ type: "dec", pos: P.cur.pos, stack: stackOf[P.cur.pos], acts: P.cur.sp.acts.map(x => ({ lab: x, col: gwPreCol(pfKind(x)) })), sel: null, cur: true });
  let main = "", node = null, L = null;
  if (f) {
    const bc = GW.board.match(/../g) || [];
    items.push({ type: "street", name: "FLOP", pot: f.pot, cards: bc.slice(0, 3), click: D ? "custom" : "flop" });
    if (D && bc.length >= 4) items.push({ type: "street", name: "TURN", pot: f.pot, cards: [bc[3]], click: "custom" });
    if (D && bc.length >= 5) items.push({ type: "street", name: "RIVER", pot: f.pot, cards: [bc[4]], click: "custom" });
    GW.layers.forEach((Ly, li) => {
      let n = Ly.E.tree.root; const S = Ly.E.o.stack, names = [Ly.oop, Ly.ip];
      if (Ly.turnCard != null) items.push({ type: "street", name: "TURN", pot: Ly.E.o.pot, cards: [hcstr(Ly.turnCard)], click: `t${li}` });
      Ly.steps.forEach((k, si) => {
        if (n.t === "c") { items.push({ type: "street", name: n.st === 4 ? "TURN" : "RIVER", pot: Ly.E.o.pot + n.inv[0] + n.inv[1], cards: [hcstr(n.deal[k])], click: `c${li}:${si}` }); n = n.ch[k]; return; }
        items.push({ type: "dec", pos: names[n.pl], stack: S - n.inv[n.pl], acts: n.acts.map(a => ({ lab: gwLab(a, Ly.E, n), col: gwCol(a) })), sel: k, back: `l${li}:${si}`, lock: !!n.lockSt, edit: `${li}:${si}` });
        n = n.ch[k];
      });
      if (li === GW.layers.length - 1) { node = n; L = Ly; if (n.t === "a") items.push({ type: "dec", pos: names[n.pl], stack: S - n.inv[n.pl], acts: n.acts.map(a => ({ lab: gwLab(a, Ly.E, n), col: gwCol(a) })), sel: null, cur: true, lock: !!n.lockSt, edit: `${li}:${Ly.steps.length}` }); else if (n.t === "c") items.push({ type: "street", name: n.st === 4 ? "TURN" : "RIVER", pot: Ly.E.o.pot + n.inv[0] + n.inv[1], cards: [], click: null }); }
    });
  }
  let h = svModeBar() + `<div class="gw">` + gwStrip(items);
  const tabs = (dis) => `<div class="gwtabsrow"><div class="gwtabs">${[["strat", "Strategia + EV"], ["ranges", "Range"], ["rep", "Report flop"], ["prac", "Allenati"], ["pf", "Solver preflop"]].map(([v, l]) => `<button class="${GW.tab === v ? "on" : ""}" data-gtab="${v}" ${dis.includes(v) || (v === "prac" && !GW.layers.length) ? "disabled" : ""}>${l}</button>`).join("")}${GW.line.length || GW.board || GW.direct || GW.layers.length ? `<button class="gwtabnew" data-gnew="1" title="Cancella la mano che stai analizzando e torna all'inizio del preflop">⟲ Nuova mano</button>` : ""}</div><div class="gwmenuw"><button class="gwtabmenu ${GW.menuOpen ? "on" : ""}" data-gmenu="1" aria-haspopup="true" aria-expanded="${GW.menuOpen ? "true" : "false"}">⋯ Strumenti</button>${GW.menuOpen ? `<div class="gwmenu" role="menu"><button role="menuitem" data-gcustom="1"><span>✎</span><div><b>Spot personalizzato</b><small>Posizioni, piatto e range scelti da te</small></div></button><button role="menuitem" data-glib="1"><span>💾</span><div><b>Soluzioni salvate</b><small>Riapri gli spot già calcolati</small></div></button><button role="menuitem" data-gtabs="1"><span>📋</span><div><b>Tabelle preflop</b><small>Le tabelle GTO e le tue personali</small></div></button><button role="menuitem" data-gset="1"><span>⚙</span><div><b>Impostazioni dell'albero</b><small>Size, raise, iterazioni e rake</small></div></button><button role="menuitem" data-gbench="1"><span>📐</span><div><b>Precisione del solver</b><small>Quanto si scosta dalla soluzione completa</small></div></button><button role="menuitem" data-gguide="1"><span>❓</span><div><b>Guida</b><small>Come usare il solver, passo per passo</small></div></button></div>` : ""}</div></div>`;
  if (GW.sq && !GW.busy) {
    main = gwSizeQuizHtml();
  } else if (GW.rev && GW.rev.end && !GW.busy) {
    main = gwRevEndHtml();
  } else if (GW.busy) {
    main = `<div class="gwpanel gwsolving"><b>${esc(GW.prog.label)}</b><div class="gwprog"><i id="gwProg" style="width:${Math.round(GW.prog.fr * 100)}%"></i></div><span id="gwProgT" class="gwmuted">${Math.round(GW.prog.fr * 100)}%</span><p class="gwmuted">${fmt(GW.prog.nodes, 0)} nodi decisionali, ${fmt(GW.prog.mem / 1e6, 0)} MB di strategie. Il primo passo prepara le equity di tutti i turn e river.</p><div class="gwrow" style="margin:4px 0 0"><button class="gwbtn ghost" data-gnew="1">Annulla il calcolo e nuova mano</button></div></div>`;
  } else if (GW.tab === "prac" && GW.layers.length) {
    main = tabs([]) + gwPracMain();
  } else if (GW.tab === "pf") {
    main = tabs([]) + `<div class="gwlight"><div id="pfBody"></div></div>`;
  } else if (GW.customOpen) {
    main = tabs(["ranges", "rep"]) + gwCustomMain();
  } else if (P.cur) {
    main = tabs(["ranges"]) + (GW.tab === "rep" ? gwRepNeedFlop() : gwPreMain(P));
  } else if (!f) {
    main = tabs(["ranges", "rep"]) + `<div class="gwpanel"><p><b>${esc(P.end || "")}</b></p><div class="gwrow"><button class="gwbtn ghost" data-gback="p${Math.max(0, GW.line.length - 1)}" data-gbk="-1">Torna indietro</button>${/4-bet/.test(P.end || "") ? `<button class="gwbtn" data-gpf4="1">Risolvi la risposta al 4-bet</button>` : ""}</div></div>`;
  } else if (GW.tab === "rep") {
    main = tabs([]) + (D ? `<div class="gwpanel"><p>I report flop partono dal preflop: torna al preflop per aprirli.</p></div>` : gwRepMain(P));
  } else if (!GW.layers.length) {
    main = tabs(["ranges"]) + (D ? gwCustomMain() : gwFlopPick(P));
  } else if (node.t === "a") {
    main = tabs([]) + (GW.tab === "ranges" ? gwRangesMain(L, node) : gwPostMain(L, node));
  } else if (node.t === "c") {
    main = tabs(["ranges"]) + gwChanceMain(L, node);
  } else {
    main = tabs(["ranges"]) + gwTermMain(L, node);
  }
  h += main + `</div>`;
  if (GW.showSet) h += gwSetModal();
  if (GW.bld && GW.bld.open) h += gwBldModal();
  if (GW.ned) h += gwNedModal();
  if (GW.showLib) h += gwLibModal();
  if (GW.showTabs) h += gwTabsModal();
  if (GW.pfOv) h += gwPfOvModal();
  if (GW.showBench) h += gwBenchModal();
  if (GW.showGuide) h += gwGuideModal();
  if (GW.ask && !GW.busy) h += gwAskModal();
  $("#view").innerHTML = h;
  gwBind(P, L, node);
  if (GW.ask && !GW.busy) gwAskBind();
  if (GW.showTabs) gwTabsBind();
  gwTrainBind(); gwProveBind();
  if (GW.tab === "prac") gwPracBind();
  if (GW.tab === "pf" && !GW.busy) { PF.mode = "solve"; pfRenderSolve(); }
  if (GW.customOpen || (D && !GW.layers.length && !GW.busy && GW.tab !== "pf")) gwCustomBind();
  const sb = document.querySelector(".gwstrip"); if (sb) { const cur = sb.querySelector(".gwsc.cur") || sb.lastElementChild; if (cur) sb.scrollLeft = Math.max(0, cur.offsetLeft + cur.offsetWidth - sb.clientWidth + 8); }
}
function gwLab(a, E, n) {
  const pot = E.o.pot + n.inv[0] + n.inv[1];
  if (a.kind === "bet") return `Bet ${fmtN(a.amt - Math.min(n.inv[0], n.inv[1]))} (${Math.round(a.frac * 100)}%)`;
  if (a.kind === "allin") return `All-in ${fmtN(E.o.stack - Math.min(n.inv[0], n.inv[1]))}`;
  if (a.kind === "raise") return a.lab;
  return a.lab;
}
/* --- preflop: strategia della tabella --- */
function gwPreMain(P) {
  const sp = P.cur.sp, r = P.reach[P.cur.pos], SF = gwSpF(sp), mine = SF !== sp.f;
  const acts = sp.acts.map(x => ({ lab: x, col: gwPreCol(pfKind(x)) }));
  const cells = [], tot = acts.map(() => 0); let W = 0;
  for (let k = 0; k < PF_N; k++) {
    const f = SF[pfName(k)] || acts.map((_, i) => i === 0 ? 1 : 0), w = r[k];
    const seg = acts.map((a, i) => [a.col, GW.filter == null || GW.filter === i ? f[i] : 0]);
    cells[k] = { w, seg, txt: GW.filter != null && w > 0.002 ? Math.round(f[GW.filter] * 100) : null };
    const c = pfCombos(k) * w; W += c; acts.forEach((_, i) => tot[i] += c * f[i]);
  }
  const k = GW.sel;
  let det = `<p class="gwmuted">Tocca una mano per il dettaglio.</p>`;
  if (k != null) { const f = SF[pfName(k)] || acts.map((_, i) => i === 0 ? 1 : 0); det = `<div class="gwdet-h"><b>${pfName(k)}</b><span>${fmt(pfCombos(k) * r[k], 1)} combo</span></div>` + acts.map((a, i) => `<div class="gwdet-r"><span><i style="background:${a.col}"></i>${esc(a.lab)}</span><div class="gwtrk"><i style="width:${f[i] * 100}%;background:${a.col}"></i></div><b>${Math.round(f[i] * 100)}%</b></div>`).join(""); }
  return `<div class="gwmain"><div class="gwleft"><div class="gwhead"><b>${esc(P.cur.pos)}</b><span>${esc(sp.label)}${sp.est ? " · stima" : ""}${mine ? ` · <b class="gwmine">tabella personale</b>` : ""} · <button class="gwlink" data-gpfov="1">✎ Tabelle personali</button></span></div>${gwGrid(cells)}</div><div class="gwright"><div class="gwpanel"><div class="gwpot"><b>${P.cur.pos}</b><span>${fmt(W, 0)} combo · ${fmt(W / 13.26, 1)}% delle mani</span></div><div class="gwsub">Azioni</div>${gwActBoxes(acts, tot, W)}</div><div class="gwpanel">${det}</div></div></div>`;
}
function gwRepNeedFlop() { return `<div class="gwpanel"><p>Il report flop si apre quando la mano arriva al flop: scegli le azioni preflop fino a un call (per esempio BTN apre, BB chiama).</p></div>`; }
/* --- scelta del flop --- */
function gwFlopPick(P) {
  const sel = GW.board.match(/../g) || [], f = P.flop;
  return `<div class="gwpanel"><div class="gwhead"><b>Flop</b><span>${f.oop} (OOP) contro ${f.ip} (IP) · piatto ${fmtN(f.pot)}bb · stack ${fmtN(f.stack)}bb · ${f.kind}</span></div>
    <div class="gwsel">${sel.map(c => gwCardS(c, true)).join("") || `<span class="gwmuted">Scegli 3 carte</span>`}</div>
    ${gwCardPicker(sel, new Set(), 3)}
    <div class="gwrow"><button class="gwbtn ghost" data-gflop="rnd">Casuale</button><button class="gwbtn ghost" data-gflop="clr">Cancella</button><button class="gwbtn" data-gflop="go" ${sel.length === 3 ? "" : "disabled"}>Risolvi il flop</button><button class="gwbtn ghost" data-grandflop="1" title="Flop scelto con la frequenza reale dei board, poi subito in Allenati">🎲 Allenati su un flop casuale</button></div>
    <p class="gwmuted">Albero: flop ${GW.set.f.join("/")}% · turn ${GW.set.t.join("/")}% ${GW.set.allin ? "· all-in" : ""}${GW.set.rz.length ? " · raise " + GW.set.rz.join("/") + "%" : ""}. Il solver gioca flop, turn e river con le puntate su tutte le street (turn e river campionati in modo stratificato per la strategia del flop). Quando scegli il turn, turn e river vengono risolti di nuovo in modo completo. Tempo indicativo: circa 40 secondi in Veloce, 2 minuti in Normale, 8-12 minuti in Alta; dipende dal computer.</p></div>`;
}
/* --- nodo decisionale postflop --- */
function gwInfo(L, node, withEV) {
  const key = GW.layers.indexOf(L) + "|" + L.steps.join(",") + (withEV ? "|ev" : "");
  let I = GW.cache.get(key); if (I) return I;
  I = msNodeInfo(L.E, L.steps, withEV); GW.cache.set(key, I);
  return I;
}
const gwKeyIdx = key => { const a = GRID_RANKS.indexOf(key[0]), b = GRID_RANKS.indexOf(key[1]); return key.length === 2 ? a * 13 + a : key[2] === "s" ? a * 13 + b : b * 13 + a; };
function gwClassAgg(L, I, node) {
  const G = L.E.G, np = I.np, A = node.acts.length, cls = new Map();
  const bset = new Set([...G.board, ...node.cards]);
  for (let i = 0; i < np; i++) {
    const x = I.combos[i]; if (bset.has(x.c[0]) || bset.has(x.c[1])) continue;
    const kk = gwKeyIdx(x.key);
    let g = cls.get(kk); if (!g) { g = { r: 0, f: new Float64Array(A), ev: 0, n: 0, idx: [] }; cls.set(kk, g); }
    const r = I.rp[i]; g.r += r; g.idx.push(i);
    for (let a = 0; a < A; a++) g.f[a] += r * I.st[a * np + i];
    if (I.evA) { let e = 0; for (let a = 0; a < A; a++) e += I.st[a * np + i] * (I.evA[a][i] || 0); g.ev += r * e; }
  }
  /* combo disponibili per classe (board escluso) */
  cls.forEach((g, k) => { const nm = pfName(k); g.n = hExpand(nm).filter(c => !bset.has(c[0]) && !bset.has(c[1])).length || 1; });
  return cls;
}
function gwPostMain(L, node) {
  const I = gwInfo(L, node, false), E = L.E, A = node.acts.length, np = I.np;
  const Iev = GW.cache.get(GW.layers.indexOf(L) + "|" + L.steps.join(",") + "|ev");
  const acts = node.acts.map(a => ({ lab: gwLab(a, E, node), col: gwCol(a), sub: a.kind === "bet" ? `${Math.round(a.frac * 100)}% pot` : "" }));
  const cls = gwClassAgg(L, Iev || I, node), cells = [], tot = new Array(A).fill(0); let W = 0;
  cls.forEach((g, k) => {
    const w = g.r / g.n; if (g.r <= 1e-9) return;
    const seg = acts.map((a, i) => [a.col, GW.filter == null || GW.filter === i ? g.f[i] / g.r : 0]);
    cells[k] = { w: Math.min(1, w), seg, txt: GW.filter != null ? Math.round(g.f[GW.filter] / g.r * 100) : Iev ? fmt(g.ev / g.r, Math.abs(g.ev / g.r) < 10 ? 2 : 1) : null };
    W += g.r; for (let a = 0; a < A; a++) tot[a] += g.f[a];
  });
  const names = [L.oop, L.ip], pot = E.o.pot + node.inv[0] + node.inv[1], bstr = [...E.G.board, ...node.cards].map(hcstr);
  const facing = node.inv[1 - node.pl] - node.inv[node.pl];
  const st = E.stats;
  const canRes = L.E.o.board.length === 3 && node.st === 4 && /:$/.test(node.path) && !L.gto;
  let h = gwLockBanner(L) + (GW.dynInfo && L === gwLayer() ? `<div class="gwbanner"><span>✦ ${esc(GW.dynInfo)}</span></div>` : "");
  h += canRes ? `<div class="gwbanner"><span>Questa è la soluzione del flop: al river il solver va a showdown. Per giocare anche il river risolvi turn e river da questa carta, con i range che arrivano qui.</span><button class="gwbtn" data-gresolve="1">Risolvi turn e river</button></div>` : "";
  h += `<div class="gwmain"><div class="gwleft"><div class="gwhead"><b>${names[node.pl]}</b><span>${facing > 0 ? `deve chiamare ${fmtN(facing)}bb · ` : ""}piatto ${fmtN(pot)}bb${Iev ? "" : ` · <button class="gwlink" data-gev="1">Calcola EV</button>`} · <button class="gwlink" data-gcombo="1">✎ Modifica combo</button></span></div>${gwGrid(cells)}</div>`;
  h += `<div class="gwright"><div class="gwpanel"><div class="gwpot"><span class="gwpp"><b>${L.oop}</b>${fmtN(E.o.stack - node.inv[0])}</span><span class="gwpp"><b>${L.ip}</b>${fmtN(E.o.stack - node.inv[1])}</span><span class="gwpp"><b>${fmtN(pot)} BB</b>piatto</span><span class="gwbd">${bstr.map(c => gwCardS(c)).join("")}</span></div>`;
  let gtoF = null;
  if (L.gto && L.gto !== L.E) { const kg = GW.layers.indexOf(L) + "|" + L.steps.join(",") + "|gto"; let Ig = GW.cache.get(kg); if (!Ig) { try { Ig = msNodeInfo(L.gto, L.steps, false); GW.cache.set(kg, Ig); } catch (e) { Ig = null; } } if (Ig) gtoF = Ig.freq; }
  h += `<div class="gwsub">Azioni${gtoF ? ` <span class="gwmuted">(sotto: frequenze GTO senza nodelock)</span>` : ""}</div>${gwActBoxes(acts, tot, W, false, gtoF)}</div>`;
  h += `<div class="gwpanel"><div class="gwsubtabs"><span class="on">Mani</span><span class="gwmuted" style="margin-left:auto;font-size:12px">${E.fromCache ? "💾 dalla memoria · " : ""}Precisione ${fmtN(st.expl)}% pot · ${E.it} iter · ${fmt(E.ms / 1000, 0)}s</span></div>${gwHands(L, node, Iev || I, acts)}</div>`;
  h += `<div class="gwrow" style="margin:0"><button class="gwbtn" data-gbld="1">✦ Risolvi con IA</button><button class="gwbtn ghost" data-gned="${GW.layers.indexOf(L)}:${L.steps.length}">✎ Modifica le size di ${names[node.pl]}</button></div>`;
  h += gwLockPanel(L, node, acts, W ? tot.map(x => x / W) : tot);
  h += `</div></div>`;
  const evKey = GW.layers.indexOf(L) + "|" + L.steps.join(",");
  if (!Iev && GW.evAuto !== evKey) { GW.evAuto = evKey; setTimeout(() => { if (GW.busy || gwLayer() !== L || L.steps.join(",") + "" !== evKey.split("|")[1]) return; gwInfo(L, node, true); if (tab === "solver" && SVMODE === "study") renderStudy(); }, 80); }
  return h;
}
function gwHands(L, node, I, acts) {
  const k = GW.sel;
  if (k == null) return `<p class="gwmuted">Tocca una mano nella griglia per vedere le sue combo, con frequenze ed EV di ogni azione.</p>`;
  const nm = pfName(k), np = I.np, bset = new Set([...L.E.G.board, ...node.cards]);
  const rows = I.combos.map((x, i) => [x, i]).filter(([x, i]) => x.key === nm && !bset.has(x.c[0]) && !bset.has(x.c[1]) && I.rp[i] > 1e-9);
  if (!rows.length) return `<p class="gwmuted"><b>${nm}</b> non è nel range a questo punto.</p>`;
  /* equity di ogni combo contro il range avversario che arriva a questo nodo */
  const ek = GW.layers.indexOf(L) + "|" + L.steps.join(",") + "|eqh";
  let EQ = GW.cache.get(ek); if (!EQ) { try { EQ = msEqVec(L.E, node.cards, I.pl, I.ro); } catch (e) { EQ = null; } GW.cache.set(ek, EQ); }
  const eqAvg = EQ ? rows.reduce((s, [x, i]) => s + EQ[i] * I.rp[i], 0) / rows.reduce((s, [x, i]) => s + I.rp[i], 0) : null;
  return `${EQ ? `<p class="gwmuted gweqh"><b>${nm}</b> · equity media ${fmt(eqAvg * 100, 1)}% contro il range che arriva qui</p>` : ""}<div class="gwcombos">${rows.map(([x, i]) => {
    let acc = 0; const seg = acts.map((a, q) => { const f = I.st[q * np + i]; const s = `${a.col} ${acc * 100}% ${(acc + f) * 100}%`; acc += f; return s; }).join(",");
    return `<div class="gwcombo"><div class="gwcombo-bg" style="background:linear-gradient(90deg,${seg})"></div><div class="gwcombo-h">${gwCardI(x.c[0])}${gwCardI(x.c[1])}${EQ ? `<i class="gweq" title="Equity contro il range avversario a questo nodo">Eq ${fmt(EQ[i] * 100, 1)}%</i>` : ""}<span>${I.evA ? "EV" : ""}</span></div>${acts.map((a, q) => `<div class="gwcombo-r"><span>${esc(a.lab)}</span><b>${Math.round(I.st[q * np + i] * 100)}%</b>${I.evA ? `<em>${I.evA[q][i] == null ? "-" : fmt(I.evA[q][i], 2)}</em>` : ""}</div>`).join("")}</div>`;
  }).join("")}</div>`;
}
/* --- carta del turn/river --- */
function gwChanceMain(L, node) {
  const used = new Set([...L.E.G.board, ...node.cards].map(hcstr));
  return `<div class="gwpanel"><div class="gwhead"><b>${node.st === 4 ? "Turn" : "River"}</b><span>Scegli la carta${L.E.o.sample && node.st === 4 ? ": il solver risolve turn e river completi (tutte le 48 carte del river) con i range che arrivano qui" : ""}</span></div>${gwCardPicker([], used, 1)}<div class="gwrow"><button class="gwbtn ghost" data-gchance="rnd">Carta casuale</button></div></div>`;
}
function gwTermMain(L, node) {
  const E = L.E, pot = E.o.pot + node.inv[0] + node.inv[1], names = [L.oop, L.ip];
  const cont = node.t === "q" && node.inv[0] < E.o.stack - 1e-9 && E.o.board.length === 3 && !E.o.sample;
  if (cont && !GW.busy && GW.contKey !== L.steps.join(",")) { GW.contKey = L.steps.join(","); setTimeout(() => gwContinueRiver(L), 0); }
  const txt = node.t === "f" ? `${names[1 - node.folder]} vince il piatto di ${fmtN(pot)}bb.` : node.t === "s" ? `Showdown: piatto ${fmtN(pot)}bb.` : node.inv[0] >= E.o.stack - 1e-9 ? `All-in chiamato: piatto ${fmtN(pot)}bb, si gira il resto del board.` : `Il turn è chiuso: preparo il river risolvendo turn e river con i range che arrivano qui.`;
  return `<div class="gwpanel"><p><b>${txt}</b></p><button class="gwbtn ghost" data-gup="1">Torna indietro</button></div>`;
}
/* --- range: confronto tra i due giocatori --- */
function gwRangesMain(L, node) {
  const E = L.E, G = E.G, key = GW.layers.indexOf(L) + "|" + L.steps.join(",") + "|rg";
  let R = GW.cache.get(key);
  if (!R) {
    const { r } = msReach(E, L.steps);
    const eq = [0, 1].map(p => msEqVec(E, node.cards, p, r[1 - p]));
    const ev = [0, 1].map(p => msEvVec(E, node, p, r[p], r[1 - p]));
    R = { r, eq, ev }; GW.cache.set(key, R);
  }
  const pot = E.o.pot + node.inv[0] + node.inv[1], bset = new Set([...G.board, ...node.cards]);
  const S = [0, 1].map(p => {
    let W = 0, e = 0, v = 0; const b = [0, 0, 0, 0], pts = [];
    for (let i = 0; i < G.n[p]; i++) { const w = R.r[p][i]; if (w < 1e-9) continue; const x = G.R[p][i]; if (bset.has(x.c[0]) || bset.has(x.c[1])) continue; W += w; e += w * R.eq[p][i]; v += w * R.ev[p][i]; const q = R.eq[p][i]; b[q >= 0.8 ? 0 : q >= 0.6 ? 1 : q >= 0.4 ? 2 : 3] += w; pts.push([q, w]); }
    return { W, eq: W ? e / W : 0, ev: W ? v / W : 0, b: b.map(x => W ? x / W : 0), pts };
  });
  const evSum = S[0].ev + S[1].ev || 1;
  const bar = (a, b, lab, fa, fb) => `<div class="gwcmp"><span class="l">${fa}</span><b>${lab}</b><span class="r">${fb}</span><div class="gwcmpbar"><i class="a" style="width:${a * 50}%"></i><i class="b" style="width:${b * 50}%"></i></div></div>`;
  const mx = (x, y) => Math.max(x, y) || 1;
  let mid = `<div class="gwmid">`;
  mid += bar(S[0].W / mx(S[0].W, S[1].W), S[1].W / mx(S[0].W, S[1].W), "Combo", fmt(S[0].W, 1), fmt(S[1].W, 1));
  mid += bar(S[0].ev / evSum, S[1].ev / evSum, "EV", `${fmt(S[0].ev, 2)} <small>${fmt(S[0].ev / evSum * 100, 1)}%</small>`, `<small>${fmt(S[1].ev / evSum * 100, 1)}%</small> ${fmt(S[1].ev, 2)}`);
  mid += bar(S[0].eq, S[1].eq, "Equity", fmt(S[0].eq * 100, 1) + "%", fmt(S[1].eq * 100, 1) + "%");
  const eqr = p => S[p].eq > 0 ? S[p].ev / (S[p].eq * pot) : 0;
  mid += bar(Math.min(1, eqr(0) / 1.5), Math.min(1, eqr(1) / 1.5), "EQR", fmt(eqr(0) * 100, 1) + "%", fmt(eqr(1) * 100, 1) + "%");
  mid += `<div class="gwsub" style="text-align:center">Fasce di equity</div>`;
  ["Mani migliori (80%+)", "Mani buone (60-80%)", "Mani deboli (40-60%)", "Mani spazzatura (sotto 40%)"].forEach((lab, k) => mid += bar(S[0].b[k], S[1].b[k], lab, fmt(S[0].b[k] * 100, 1) + "%", fmt(S[1].b[k] * 100, 1) + "%"));
  mid += `</div>`;
  /* griglie: sinistra range OOP, destra range IP, colorate per EV o equity */
  const gridFor = p => {
    const cls = new Map();
    for (let i = 0; i < G.n[p]; i++) { const w = R.r[p][i]; const x = G.R[p][i]; if (bset.has(x.c[0]) || bset.has(x.c[1])) continue; const a = GRID_RANKS.indexOf(x.key[0]), b = GRID_RANKS.indexOf(x.key[1]); const k = x.key.length === 2 ? a * 13 + a : x.key[2] === "s" ? a * 13 + b : b * 13 + a; let g = cls.get(k); if (!g) { g = { r: 0, e: 0, v: 0, n: 0 }; cls.set(k, g); } g.n++; g.r += w; g.e += w * R.eq[p][i]; g.v += w * R.ev[p][i]; }
    const cells = []; let vmax = -1e9, vmin = 1e9; cls.forEach(g => { if (g.r > 1e-9) { vmax = Math.max(vmax, g.v / g.r); vmin = Math.min(vmin, g.v / g.r); } });
    cls.forEach((g, k) => { if (g.r < 1e-9) return; const e = g.e / g.r, v = g.v / g.r; const t = GW.rview === "ev" ? (v - vmin) / ((vmax - vmin) || 1) : e; const col = gwHeat(t); cells[k] = { w: Math.min(1, g.r / g.n), seg: [[col, 1]], txt: GW.rview === "ev" ? fmt(v, 1) : Math.round(e * 100) }; });
    return gwGrid(cells, { sm: true });
  };
  const chart = gwEqChart(S);
  return `<div class="gwrow" style="margin:0 0 8px"><div class="gwseg">${[["ev", "Colora per EV"], ["eq", "Colora per equity"]].map(([v, l]) => `<button class="${GW.rview === v ? "on" : ""}" data-grv="${v}">${l}</button>`).join("")}</div></div>
    <div class="gwranges"><div><div class="gwhead"><b>${L.oop}</b><span>OOP</span></div>${gridFor(0)}</div>${mid}<div><div class="gwhead"><b>${L.ip}</b><span>IP</span></div>${gridFor(1)}</div></div>
    <div class="gwpanel"><div class="gwhead"><b>Grafico dell'equity</b><span><i class="gwdot" style="background:#7fd3f7"></i>${L.oop} <i class="gwdot" style="background:#3fbf5a"></i>${L.ip}</span></div>${chart}</div>`;
}
function gwHeat(t) {
  t = Math.max(0, Math.min(1, t));
  const stops = [[0, [214, 69, 65]], [0.35, [236, 140, 60]], [0.6, [232, 196, 72]], [1, [90, 185, 102]]];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) if (t >= stops[i][0] && t <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; }
  const u = (t - a[0]) / ((b[0] - a[0]) || 1), c = a[1].map((x, k) => Math.round(x + (b[1][k] - x) * u));
  return `rgb(${c.join(",")})`;
}
function gwEqChart(S) {
  const Wd = 1000, Ht = 260, pad = 30;
  const line = (pts, col) => {
    const s = pts.slice().sort((x, y) => x[0] - y[0]); const W = s.reduce((a, p) => a + p[1], 0) || 1;
    let acc = 0; const P = [];
    s.forEach(([q, w]) => { acc += w; P.push([pad + (acc / W) * (Wd - 2 * pad), Ht - pad - q * (Ht - 2 * pad)]); });
    let med = null; acc = 0; for (const [q, w] of s) { acc += w; if (acc / W >= 0.5) { med = [pad + 0.5 * (Wd - 2 * pad), Ht - pad - q * (Ht - 2 * pad)]; break; } }
    return `<polyline fill="none" stroke="${col}" stroke-width="3" points="${P.map(p => p.map(x => x.toFixed(1)).join(",")).join(" ")}"/>${med ? `<circle cx="${med[0]}" cy="${med[1]}" r="7" fill="#f5b400" stroke="#1b1b1b" stroke-width="2"/>` : ""}`;
  };
  let grid = ""; [0, 25, 50, 75, 100].forEach(v => { const x = pad + v / 100 * (Wd - 2 * pad), y = Ht - pad - v / 100 * (Ht - 2 * pad); grid += `<line x1="${x}" y1="${pad}" x2="${x}" y2="${Ht - pad}" stroke="#333" /><text x="${x}" y="${Ht - 8}" fill="#888" font-size="14" text-anchor="middle">${v}</text><line x1="${pad}" y1="${y}" x2="${Wd - pad}" y2="${y}" stroke="#2a2a2a"/><text x="4" y="${y + 4}" fill="#888" font-size="14">${v}</text>`; });
  return `<svg viewBox="0 0 ${Wd} ${Ht}" class="gweqc" preserveAspectRatio="none">${grid}${line(S[0].pts, "#7fd3f7")}${line(S[1].pts, "#3fbf5a")}</svg><p class="gwmuted" style="margin:4px 0 0">Asse orizzontale: percentile del range (mani ordinate dalla più debole alla più forte). Asse verticale: equity contro il range avversario. Il punto giallo è la mano mediana.</p>`;
}
/* --- impostazioni --- */
function gwSetModal() {
  const s = GW.set, X = GW.setX || (GW.setX = {});
  const add = k => `<span class="gwask-add"><input type="number" inputmode="numeric" min="5" max="500" step="1" placeholder="altra %" data-gszin="${k}"><button class="gwchip" data-gszadd="${k}" title="Aggiungi una size personalizzata">+</button></span>`;
  const chips = (k, list) => [...new Set([...list, ...s[k], ...(X[k] || [])])].sort((a, b) => a - b).map(x => `<button class="gwchip ${s[k].includes(x) ? "on" : ""}" data-gsz="${k}:${x}">${x}%</button>`).join("") + add(k);
  return `<div class="gwmodal"><div class="gwmodal-b"><div class="gwhead"><b>Impostazioni dell'albero</b><button class="gwbtn ghost" data-gset="0">Chiudi</button></div>
    <div class="gwsetrow"><span>Bet flop</span>${chips("f", [25, 33, 50, 75, 100, 125])}</div>
    <div class="gwsetrow"><span>Bet turn</span>${chips("t", [33, 50, 75, 100, 150])}</div>
    <div class="gwsetrow"><span>Bet river</span>${chips("r", [33, 50, 75, 100, 150])}<button class="gwchip ${s.allin ? "on" : ""}" data-gtg="allin">All-in</button></div>
    <div class="gwsetrow"><span>Raise</span>${chips("rz", [30, 50, 75, 100])}<button class="gwchip ${s.allin ? "on" : ""}" data-gtg="allin">All-in</button></div>
    <div class="gwsetrow"><span>Raise per street</span>${[1, 2].map(v => `<button class="gwchip ${(s.maxR ?? 2) === v ? "on" : ""}" data-git="maxR:${v}">${v === 1 ? "1 (solo raise)" : "2 (raise e re-raise)"}</button>`).join("")}</div>
    ${(s.maxR ?? 2) === 2 ? `<div class="gwsetrow"><span>Re-raise</span>${chips("rz2", [50, 75, 100])}<span class="gwmuted" style="font-size:12px">${(s.rz2 || []).length ? "più l'all-in" : "nessuna size: solo all-in"}</span></div>` : ""}
    <div class="gwsetrow"><span>OOP</span><button class="gwchip ${s.donk ? "on" : ""}" data-gtg="donk">Donk bet al flop</button><button class="gwchip ${s.lead ? "on" : ""}" data-gtg="lead">Lead/probe su turn e river</button><button class="gwchip ${s.oopSep ? "on" : ""}" data-gtg="oopSep">Size OOP diverse da IP</button></div>
    ${s.oopSep ? `<div class="gwsetrow"><span>Donk flop OOP</span>${chips("fo", [25, 33, 50, 75, 100])}</div><div class="gwsetrow"><span>Lead turn OOP</span>${chips("to", [33, 50, 75, 100, 125])}</div><div class="gwsetrow"><span>Lead river OOP</span>${chips("ro", [33, 50, 75, 100, 125])}</div>` : ""}
    <div class="gwsetrow"><span>Precisione flop</span>${[[50, "Veloce"], [100, "Normale"], [200, "Alta"]].map(([v, l]) => `<button class="gwchip ${s.it === v ? "on" : ""}" data-git="it:${v}">${l}</button>`).join("")}</div>
    <div class="gwsetrow"><span>Precisione turn</span>${[[100, "Veloce"], [200, "Normale"], [400, "Alta"]].map(([v, l]) => `<button class="gwchip ${s.itT === v ? "on" : ""}" data-git="itT:${v}">${l}</button>`).join("")}</div>
    <div class="gwsetrow"><span>Rake</span><select id="gwRkLvl" class="gwsel"><option value="">Personalizzata</option>${Object.keys(RAKE_PS).map(k => `<option value="${k}" ${s.rakeLvl === k ? "selected" : ""}>Rake ${k}</option>`).join("")}</select><label>% <input id="gwRk" type="number" step="0.5" min="0" value="${s.rake}"></label><label>cap bb <input id="gwCap" type="number" step="0.05" min="0" value="${s.cap}"></label></div>
    ${s.rakeLvl && RAKE_PS[s.rakeLvl] ? `<p class="gwmuted" style="margin:-2px 0 6px">Rake ${s.rakeLvl}: ${fmtN(RAKE_PS[s.rakeLvl].pct)}% con cap ${fmtN(rakePS(s.rakeLvl, 6).capEur)}€ = <b>${fmtN(rakePS(s.rakeLvl, 6).cap)}bb</b> (tavolo 6-max con 5-6 giocatori).</p>` : ""}
    ${GW.setMsg ? `<p class="gwask-msg">${esc(GW.setMsg)}</p>` : ""}<p class="gwmuted">Con <b>+</b> aggiungi una size personalizzata (da 5% a 500% del piatto, puntata minima 1bb). Più size mettete, più l'albero cresce e il calcolo si allunga. Le modifiche valgono per la prossima soluzione.</p></div></div>`;
}
function gwBind(P, L, node) {
  const Q = s => document.querySelectorAll(s);
  const reset = () => { GW.sel = null; GW.filter = null; };
  Q("[data-gtab]").forEach(b => b.onclick = () => { GW.tab = b.dataset.gtab; renderStudy(); });
  Q("[data-grv]").forEach(b => b.onclick = () => { GW.rview = b.dataset.grv; renderStudy(); });
  Q("[data-gf]").forEach(b => b.onclick = () => { const i = +b.dataset.gf; GW.filter = GW.filter === i ? null : i; renderStudy(); });
  Q("[data-gh]").forEach(c => c.onclick = () => { const k = +c.dataset.gh; GW.sel = GW.sel === k ? null : k; renderStudy(); });
  Q("[data-gset]").forEach(b => b.onclick = () => { GW.showSet = b.dataset.gset === "1"; GW.setMsg = ""; renderStudy(); });
  Q("[data-gsz]").forEach(b => b.onclick = () => { const [k, x] = b.dataset.gsz.split(":"), v = +x, s = GW.set; s[k] = s[k] || []; s[k] = s[k].includes(v) ? s[k].filter(y => y !== v) : [...s[k], v].sort((a, c) => a - c); gwSetSave(); renderStudy(); });
  Q("[data-gtg]").forEach(b => b.onclick = () => { GW.set[b.dataset.gtg] = !GW.set[b.dataset.gtg]; gwSetSave(); renderStudy(); });
  const gszAdd = (k, raw) => {
    const v = Math.round(+String(raw).replace(",", ".")), s = GW.set, max = k === "rz" ? 3 : k === "rz2" ? 2 : 5; s[k] = s[k] || [];
    if (!(v >= 5 && v <= 500)) { GW.setMsg = "Scrivi una percentuale del piatto tra 5 e 500."; return renderStudy(); }
    if (!s[k].includes(v)) { if (s[k].length >= max) { GW.setMsg = `Al massimo ${max} size su questa riga: togline una prima.`; return renderStudy(); } s[k] = [...s[k], v].sort((a, c) => a - c); }
    (GW.setX = GW.setX || {})[k] = [...new Set([...(GW.setX[k] || []), v])]; GW.setMsg = "";
    gwSetSave();
    renderStudy();
  };
  Q("[data-gszadd]").forEach(b => b.onclick = () => { const k = b.dataset.gszadd, i = document.querySelector(`[data-gszin="${k}"]`); gszAdd(k, i ? i.value : ""); });
  Q("[data-gszin]").forEach(i => i.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); gszAdd(i.dataset.gszin, i.value); } });
  Q("[data-git]").forEach(b => b.onclick = () => { const [k, v] = b.dataset.git.split(":"); GW.set[k] = +v; gwSetSave(); renderStudy(); });
  if ($("#gwRk")) { $("#gwRk").onchange = e => { GW.set.rake = +e.target.value; GW.set.rakeLvl = ""; gwSetSave(); renderStudy(); }; $("#gwCap").onchange = e => { GW.set.cap = +e.target.value; GW.set.rakeLvl = ""; gwSetSave(); renderStudy(); }; }
  if ($("#gwRkLvl")) $("#gwRkLvl").onchange = e => { const k = e.target.value, r = rakePS(k, 6); GW.set.rakeLvl = k; if (r) { GW.set.rake = r.rake; GW.set.cap = r.cap; } gwSetSave(); renderStudy(); };
  /* preflop */
  Q("[data-gact]").forEach(b => b.onclick = () => {
    const i = +b.dataset.gact;
    if (P.cur && !L) { GW.line = [...GW.line, i]; reset(); renderStudy(); return; }
    if (L && node && node.t === "a") { L.steps = [...L.steps, i]; reset(); renderStudy(); }
  });
  Q("[data-gback]").forEach(b => b.onclick = () => {
    const bk = b.dataset.gback, i = +b.dataset.gbk;
    if (bk[0] === "p") { const li = +bk.slice(1); GW.line = i >= 0 ? [...GW.line.slice(0, li), i] : GW.line.slice(0, li); GW.layers = []; GW.board = GW.board; reset(); renderStudy(); return; }
    const [li, si] = bk.slice(1).split(":").map(Number);
    GW.layers = GW.layers.slice(0, li + 1); const Ly = GW.layers[li]; Ly.steps = [...Ly.steps.slice(0, si), i]; reset(); renderStudy();
  });
  Q("[data-gstreet]").forEach(b => b.onclick = () => {
    const k = b.dataset.gstreet;
    if (k === "flop") { GW.layers = []; GW.tab = "strat"; reset(); renderStudy(); return; }
    if (k === "custom") { gwCustomInit(); GW.customOpen = true; reset(); renderStudy(); return; }
    if (k[0] === "t") { GW.layers = GW.layers.slice(0, +k.slice(1)); reset(); renderStudy(); return; }
    const [li, si] = k.slice(1).split(":").map(Number); GW.layers = GW.layers.slice(0, li + 1); GW.layers[li].steps = GW.layers[li].steps.slice(0, si); reset(); renderStudy();
  });
  /* scelta del flop */
  Q("[data-gpc]").forEach(b => b.onclick = () => {
    const c = b.dataset.gpc;
    if (L && node && node.t === "c") { if (L.E.o.sample && node.st === 4) { gwTurnFromFlop(L, node, hsplit(c)[0]); return; } const ci = node.deal.findIndex(x => hcstr(x) === c); if (ci >= 0) { L.steps = [...L.steps, ci]; reset(); renderStudy(); } return; }
    const sel = GW.board.match(/../g) || []; GW.board = (sel.includes(c) ? sel.filter(x => x !== c) : sel.length < 3 ? [...sel, c] : sel).join(""); renderStudy();
  });
  Q("[data-gflop]").forEach(b => b.onclick = () => {
    const a = b.dataset.gflop;
    if (a === "rnd") { GW.board = dealCards(3).join(""); renderStudy(); return; }
    if (a === "clr") { GW.board = ""; renderStudy(); return; }
    gwSolveFlop(P);
  });
  Q("[data-gchance]").forEach(b => b.onclick = () => { if (!(L && node && node.t === "c")) return; if (L.E.o.sample && node.st === 4) { const used = new Set([...L.E.G.board, ...node.cards]); const pool = []; for (let c = 0; c < 52; c++) if (!used.has(c)) pool.push(c); gwTurnFromFlop(L, node, pool[Math.floor(Math.random() * pool.length)]); return; } L.steps = [...L.steps, Math.floor(Math.random() * node.deal.length)]; reset(); renderStudy(); });
  Q("[data-gup]").forEach(b => b.onclick = () => { if (L) { L.steps = L.steps.slice(0, -1); reset(); renderStudy(); } });
  Q("[data-gev]").forEach(b => b.onclick = () => { gwInfo(L, node, true); renderStudy(); });
  Q("[data-gresolve]").forEach(b => b.onclick = () => gwResolveTurn(L, node));
  Q("[data-glib]").forEach(b => b.onclick = () => { GW.showLib = b.dataset.glib === "1"; if (GW.showLib) { GW_MEM.list = null; gwMemList().then(l => { GW_MEM.list = l; if (GW.showLib) renderStudy(); }); } renderStudy(); });
  Q("[data-glo]").forEach(b => b.onclick = () => gwLibOpen(b.dataset.glo));
  Q("[data-gld]").forEach(b => b.onclick = () => gwMemDel(b.dataset.gld).then(() => gwMemList()).then(l => { GW_MEM.list = l; renderStudy(); }));
  Q("[data-gcustom]").forEach(b => b.onclick = () => { gwCustomInit(); GW.customOpen = true; GW.tab = "strat"; renderStudy(); });
  Q("[data-gnew]").forEach(b => b.onclick = () => gwNewHand());
  Q("[data-gbench]").forEach(b => b.onclick = () => { GW.showBench = b.dataset.gbench === "1"; renderStudy(); });
  Q("[data-gguide]").forEach(b => b.onclick = () => { GW.showGuide = b.dataset.gguide === "1"; renderStudy(); });
  Q(".gwmenu").forEach(m => m.addEventListener("click", () => { GW.menuOpen = false; }, true));
  Q("[data-gmenu]").forEach(b => b.onclick = e => { e.stopPropagation(); GW.menuOpen = !GW.menuOpen; renderStudy(); });
  if (GW.menuOpen && !GW._menuDoc) { GW._menuDoc = e => { if (!e.target.closest(".gwmenuw") && GW.menuOpen) { GW.menuOpen = false; document.removeEventListener("click", GW._menuDoc); GW._menuDoc = null; renderStudy(); } }; setTimeout(() => document.addEventListener("click", GW._menuDoc), 0); }
  Q(".gwguide").forEach(m => m.onclick = e => { if (e.target === m) { GW.showGuide = false; renderStudy(); } });
  Q("[data-gtabs]").forEach(b => b.onclick = () => { GW.showTabs = b.dataset.gtabs === "1"; renderStudy(); });
  Q("[data-gpre]").forEach(b => b.onclick = () => { GW.direct = null; GW.layers = []; GW.customOpen = false; GW.board = ""; GW.cache = new Map(); renderStudy(); });
  Q("[data-gpf4]").forEach(b => b.onclick = () => { const x = GW.pf4; if (x) PF.form = pfDefaultForm(x.a, x.b); PF.T = null; GW.tab = "pf"; renderStudy(); });
  Q("[data-glockt]").forEach(b => b.onclick = () => { GW.lockOpen = !GW.lockOpen; renderStudy(); });
  gwAiBind(L, node);
  Q("[data-glnode]").forEach(b => b.onclick = () => {
    const vals = [...document.querySelectorAll("[data-glv]")].map(x => Math.max(0, +x.value || 0)), s = vals.reduce((a, c) => a + c, 0);
    if (!(s > 0)) return;
    L.locks = L.locks || { nodes: {}, prof: null }; L.locks.nodes[node.path] = vals.map(v => v / s); gwApplyLocks(L);
  });
  Q("[data-glprof]").forEach(b => b.onclick = () => {
    const v = $("#gwLockOpp").value, pl = +$("#gwLockPl").value;
    L.locks = L.locks || { nodes: {}, prof: null };
    L.locks.prof = v === "none" ? null : { kind: v === "pool" ? "pool" : "opp", id: v.startsWith("opp:") ? v.slice(4) : null, pl };
    gwApplyLocks(L);
  });
  Q("[data-glclr]").forEach(b => b.onclick = () => { if (L.gto) { L.E = L.gto; L.gto = null; } L.locks = { nodes: {}, prof: null }; GW.cache = new Map(); renderStudy(); });
  Q("[data-glone]").forEach(b => b.onclick = () => { const i = +b.dataset.glone; L.locks = L.locks || { nodes: {}, prof: null }; L.locks.nodes[node.path] = node.acts.map((_, k) => k === i ? 1 : 0); gwApplyLocks(L); });
  Q("[data-gcombo]").forEach(b => b.onclick = () => { gwBldOpen(L); GW.bld.redit = 0; renderStudy(); });
  Q("[data-glunode]").forEach(b => b.onclick = () => { if (L.locks) { delete L.locks.nodes[node.path]; gwApplyLocks(L); } });
  Q("[data-grep]").forEach(b => b.onclick = () => gwRepAction(P, b.dataset.grep));
  Q("[data-grow]").forEach(b => b.onclick = () => { if (GW.busy) return; GW.board = b.dataset.grow; GW.layers = []; GW.tab = "strat"; reset(); gwSolveFlop(P); });
  Q("[data-grsort]").forEach(b => b.onclick = () => { const k = b.dataset.grsort; GW.repSort = GW.repSort === k ? "-" + k : k; renderStudy(); });
  Q("[data-grgrp]").forEach(b => b.onclick = () => { GW.repGroup = b.dataset.grgrp; renderStudy(); });
}
function gwSolveFlop(P, go) {
  const f = P.flop, board = hsplit(GW.board);
  const mk = () => gwSolve(board, f.pot, f.stack, [gwRangeFromReach(f.reach[0]), gwRangeFromReach(f.reach[1])], "flop", f.agg === f.oop);
  if (!go && gwAskOn()) return gwAskOpen({ st0: 3, title: `Flop ${GW.board}, ${f.oop} contro ${f.ip}`, mk, go: () => gwSolveFlop(P, true) });
  const o = mk();
  GW.cache = new Map(); GW.dynInfo = null;
  gwStartSolve(o, `Risolvo il flop ${GW.board}: ${f.oop} contro ${f.ip}`, E => { GW.layers = [{ E, steps: [], oop: f.oop, ip: f.ip }]; GW.tab = "strat"; GW.sel = null; GW.filter = null; if (GW.autoPrac) { GW.autoPrac = false; GW.tab = "prac"; const PR = gwPracState(); PR.fixed = null; PR.hand = null; setTimeout(() => { gwPracNew(); renderStudy(); }, 0); } });
}
/* risolvi turn e river partendo dal nodo corrente (primo nodo del turn) */
function gwResolveTurn(L, node) {
  const E = L.E, G = E.G, { r } = msReach(E, L.steps);
  const ranges = [0, 1].map(p => G.R[p].map((x, i) => ({ c: x.c, w: r[p][i], key: x.key })).filter(x => x.w > 1e-4));
  const board = [...G.board, ...node.cards];
  const o = gwSolve(board, E.o.pot + node.inv[0] + node.inv[1], E.o.stack - node.inv[0], ranges, "turn", false);
  o.sz[3] = null;
  gwStartSolve(o, `Risolvo turn e river su ${board.map(hcstr).join("")}`, E2 => { GW.layers.push({ E: E2, steps: [], oop: L.oop, ip: L.ip }); GW.sel = null; GW.filter = null; });
}

/* ---------- nodelock ---------- */
function gwLockBanner(L) {
  if (!L.gto || L.gto === L.E) return "";
  const a = L.gto.stats, b = L.E.stats, n = L.E.tree.nodes.filter(x => x.lockSt).length;
  const d = p => { const x = b.ev[p] - a.ev[p]; return `<b style="color:${x >= 0 ? "#5ad17a" : "#ff7b72"}">${x >= 0 ? "+" : ""}${fmt(x, 2)}bb</b>`; };
  return `<div class="gwbanner lock"><span>🔒 Nodelock attivo su ${n} nodi${L.locks && L.locks.prof ? ` (avversario bloccato: ${L.locks.prof.pl ? L.ip : L.oop})` : ""}. EV ${L.oop}: ${fmt(a.ev[0], 2)} → ${fmt(b.ev[0], 2)} (${d(0)}) · EV ${L.ip}: ${fmt(a.ev[1], 2)} → ${fmt(b.ev[1], 2)} (${d(1)}). Chi non è bloccato gioca la miglior risposta.</span><button class="gwbtn ghost" data-glclr="1">Torna a GTO</button></div>`;
}
function gwLockPanel(L, node, acts, freq) {
  if (!GW.lockOpen) return `<button class="gwbtn ghost" data-glockt="1" style="align-self:flex-start">🔒 Nodelock</button>`;
  const locked = L.locks && L.locks.nodes[node.path];
  const oppOpts = Object.entries(typeof OPPS !== "undefined" ? OPPS : {}).map(([id, o]) => `<option value="opp:${esc(id)}">${esc(o.name)}</option>`).join("");
  const cur = L.locks && L.locks.prof;
  return `<div class="gwpanel gwlockp"><div class="gwhead"><b>🔒 Nodelock</b><button class="gwlink" data-glockt="1">chiudi</button></div>
    <div class="gwsub">Blocca questo nodo (${node.pl ? L.ip : L.oop})</div>
    <div class="gwlockrows">${acts.map((a, i) => `<label class="gwlr"><i style="background:${a.col}"></i><span>${esc(a.lab)}</span><input type="number" min="0" max="100" step="1" data-glv="${i}" value="${Math.round((locked ? locked[i] : freq[i]) * 100)}">%</label>`).join("")}</div>
    <div class="gwrow" style="gap:4px">${acts.map((a, i) => `<button class="gwchip" data-glone="${i}">100% ${esc(a.lab)}</button>`).join("")}</div>
    <div class="gwrow"><button class="gwbtn" data-glnode="1">Blocca e ricalcola</button>${locked ? `<button class="gwbtn ghost" data-glunode="1">Sblocca questo nodo</button>` : ""}</div>
    <p class="gwmuted">Le frequenze si applicano scalando la strategia mano per mano,. Poi il solver ricalcola tutto il resto dell'albero.</p>
    <div class="gwsub">Blocca un avversario su tutto l'albero</div>
    <div class="gwrow"><select id="gwLockPl" class="gwselect"><option value="1" ${cur && cur.pl === 0 ? "" : "selected"}>${L.ip} (IP)</option><option value="0" ${cur && cur.pl === 0 ? "selected" : ""}>${L.oop} (OOP)</option></select>
    <select id="gwLockOpp" class="gwselect"><option value="none">Nessuno</option><option value="pool" ${cur && cur.kind === "pool" ? "selected" : ""}>Pool NL (dati di riferimento)</option>${oppOpts}</select><button class="gwbtn" data-glprof="1">Applica</button></div>
    <p class="gwmuted">Contro ogni bet folda con la frequenza reale del profilo (le mani con meno equity per prime) e fa check-raise quanto dicono le sue statistiche. Gli avversari arrivano dalla scheda Avversari.</p></div>`;
}
function gwApplyLocks(L) {
  const B = L.gto || L.E; L.gto = B;
  const lk = L.locks || { nodes: {}, prof: null }, map = new Map();
  const pr = lk.prof, fn = pr ? (pr.kind === "pool" ? svLockFn("pool") : svLockFn("opp", OPPS[pr.id])) : null;
  msForEachDec(B, (n, r) => {
    const np = B.G.n[n.pl], base = msAvg(n, np), rp = r[n.pl];
    if (lk.nodes[n.path]) { map.set(n.path, msLockScale(n, np, base, rp, lk.nodes[n.path])); return; }
    if (fn && n.pl === pr.pl) {
      const facing = n.inv[1 - n.pl] - n.inv[n.pl]; if (facing <= 0) return;
      const fr = facing / (B.o.pot + n.inv[0] + n.inv[1] - facing);
      const seg = n.path.split(":").pop(), vChecked = n.pl === 0 && seg.startsWith("x");
      const x = fn(fr, vChecked); if (!x || x.fold == null) return;
      const eq = msEqVec(B, n.cards, n.pl, r[1 - n.pl]);
      map.set(n.path, msLockFold(n, np, base, rp, eq, x.fold, x.raise));
    }
  });
  GW.cache = new Map();
  if (!map.size) { L.E = B; L.gto = null; renderStudy(); return; }
  const E = msInit(B.o, B.G, true);
  E.tree.nodes.forEach(n => { if (n.t === "a" && map.has(n.path)) n.lockSt = map.get(n.path); });
  gwStartSolve(B.o, `Nodelock: ricalcolo con ${map.size} nodi bloccati`, E2 => { L.E = E2; }, E);
}
/* ---------- spot personalizzato (board di 3, 4 o 5 carte) ---------- */
function gwCustomInit() {
  if (GW.cf) return;
  const q = SV_QUICK[0];
  GW.cf = { oop: svPresetStr(q.oop), ip: svPresetStr(q.ip), edit: 0, brush: 100, board: GW.board || "", pot: 5.5, stack: 97.5, names: ["BB", "BTN"] };
}
function gwCustomMain() {
  gwCustomInit();
  const c = GW.cf, sel = c.board.match(/../g) || [];
  return `<div class="gwpanel"><div class="gwhead"><b>Spot personalizzato</b><span>Board da 3, 4 o 5 carte: il solver parte da quella street</span></div>
    <div class="gwsub">Spot tipici (riempiono i range)</div><div class="gwrow">${SV_QUICK.map(q => `<button class="gwchip" data-gcq="${q.id}">${esc(q.n)}</button>`).join("")}</div>
    <div class="gwsub">Board</div><div class="gwsel">${sel.map(x => gwCardS(x, true)).join("") || `<span class="gwmuted">Scegli da 3 a 5 carte</span>`}</div>${gwCardPicker(sel, new Set(), 5).replace(/data-gpc=/g, "data-gcc=")}
    <div class="gwrow"><button class="gwbtn ghost" data-gcb="rnd3">Flop casuale</button><button class="gwbtn ghost" data-gcb="rnd4">Turn casuale</button><button class="gwbtn ghost" data-gcb="rnd5">River casuale</button><button class="gwbtn ghost" data-gcb="clr">Cancella</button></div>
    <div class="gwrow"><label class="gwlab">Nome OOP <input id="gwCn0" value="${esc(c.names[0])}"></label><label class="gwlab">Nome IP <input id="gwCn1" value="${esc(c.names[1])}"></label><label class="gwlab">Piatto (bb) <input id="gwCpot" type="number" step="0.5" min="1" value="${c.pot}"></label><label class="gwlab">Stack (bb) <input id="gwCst" type="number" step="0.5" min="1" value="${c.stack}"></label></div>
    <div class="gwsub">Range</div><div class="gwseg"><button class="${c.edit === 0 ? "on" : ""}" data-gce="0">OOP · ${esc(c.names[0])}</button><button class="${c.edit === 1 ? "on" : ""}" data-gce="1">IP · ${esc(c.names[1])}</button></div>
    <div class="gwlight" style="margin-top:8px"><div id="gwRE"></div></div>
    <div class="gwrow"><button class="gwbtn" data-gcgo="1" ${sel.length >= 3 ? "" : "disabled"}>Risolvi</button>${GW.layers.length || GW.direct ? `<button class="gwbtn ghost" data-gcx="1">Annulla</button>` : ""}<span class="gwmuted" id="gwCmsg"></span></div>
    <p class="gwmuted">Le size vengono dalle impostazioni dell'albero (⚙ Albero). Con 5 carte è il solver del river, con 4 turn e river completi, con 3 flop e turn (river a showdown).</p></div>`;
}
function gwCustomBind() {
  const c = GW.cf; if (!c || !document.querySelector("#gwRE")) return;
  const Q = s => document.querySelectorAll(s);
  svRangeEditor($("#gwRE"), c, c.edit);
  Q("[data-gce]").forEach(b => b.onclick = () => { c.edit = +b.dataset.gce; renderStudy(); });
  Q("[data-gcq]").forEach(b => b.onclick = () => { const q = SV_QUICK.find(x => x.id === b.dataset.gcq); c.oop = q.oop.startsWith("raw:") ? q.oop.slice(4) : svPresetStr(q.oop); c.ip = q.ip.startsWith("raw:") ? q.ip.slice(4) : svPresetStr(q.ip); c.names = ({ srp_btn_bb: ["BB", "BTN"], srp_co_bb: ["BB", "CO"], bvb: ["SB", "BB"], "3bp_btn_co": ["CO", "BTN"], "3bp_sb_btn": ["SB", "BTN"], "3bp_bvb": ["SB", "BB"], "4bp_btn_bb": ["BB", "BTN"] })[q.id] || c.names; renderStudy(); });
  Q("[data-gcc]").forEach(b => b.onclick = () => { const x = b.dataset.gcc, sel = c.board.match(/../g) || []; c.board = (sel.includes(x) ? sel.filter(y => y !== x) : sel.length < 5 ? [...sel, x] : sel).join(""); renderStudy(); });
  Q("[data-gcb]").forEach(b => b.onclick = () => { const a = b.dataset.gcb; c.board = a === "clr" ? "" : dealCards(+a.slice(3)).join(""); renderStudy(); });
  [["gwCn0", v => c.names[0] = v || "OOP"], ["gwCn1", v => c.names[1] = v || "IP"], ["gwCpot", v => c.pot = +v], ["gwCst", v => c.stack = +v]].forEach(([id, f]) => { const e = $("#" + id); if (e) e.onchange = ev => f(ev.target.value); });
  Q("[data-gcx]").forEach(b => b.onclick = () => { GW.customOpen = false; renderStudy(); });
  Q("[data-gcgo]").forEach(b => b.onclick = () => {
    const msg = x => { const m = $("#gwCmsg"); if (m) m.textContent = x; };
    const r0 = svCombos(svParseRange(c.oop)), r1 = svCombos(svParseRange(c.ip));
    if (!r0.length || !r1.length) return msg("Uno dei due range è vuoto.");
    if (!(c.pot > 0 && c.stack > 0)) return msg("Piatto e stack devono essere positivi.");
    const board = hsplit(c.board);
    const mk = () => gwSolve(board, c.pot, c.stack, [r0, r1], board.length === 3 ? "flop" : board.length === 4 ? "turn" : "river", true);
    const go = () => {
      GW.direct = { oop: c.names[0], ip: c.names[1], pot: c.pot, stack: c.stack, title: "Spot personalizzato" };
      GW.board = c.board; GW.layers = []; GW.customOpen = false; GW.cache = new Map();
      gwStartSolve(mk(), `Risolvo lo spot ${c.board}`, E => { GW.layers = [{ E, steps: [], oop: c.names[0], ip: c.names[1] }]; GW.sel = null; GW.filter = null; });
    };
    if (gwAskOn()) return gwAskOpen({ st0: board.length, title: `Spot ${c.board}, ${c.names[0]} contro ${c.names[1]}`, mk, go });
    go();
  });
}
/* apre nello Study lo spot di river di una mano importata (con nodelock se l'avversario è analizzato) */
function gwOpenHand(cfg, lockName, go) {
  const names = cfg.heroPl === 0 ? ["Tu", cfg.vname || "Villain"] : [cfg.vname || "Villain", "Tu"];
  gwSetInit();
  GW.direct = { oop: names[0], ip: names[1], pot: cfg.pot, stack: cfg.stack, title: cfg.src || "Mano importata" };
  GW.board = cfg.boardS; GW.layers = []; GW.customOpen = false; GW.cache = new Map(); GW.tab = "strat";
  const agg = r => { const m = {}; r.forEach(x => { m[x.key] = (m[x.key] || 0) + x.w; }); const w = {}; Object.entries(m).forEach(([k, s]) => w[k] = Math.min(1, s / hExpand(k).length)); return svRangeStr(w); };
  GW.cf = { oop: agg(cfg.ranges[0]), ip: agg(cfg.ranges[1]), edit: cfg.heroPl, brush: 100, board: cfg.boardS, pot: cfg.pot, stack: cfg.stack, names };
  const st0 = cfg.board.length, P100 = a => a.map(x => Math.round(x * 100)), sets = { rz: P100(cfg.raises || []), allin: true };
  for (let s = st0; s <= 5; s++) sets[s] = s === st0 ? { oop: P100(cfg.oopBets), ip: P100(cfg.ipBets) } : { oop: GW.set.lead ? gwOopSz(GW.set, s === 4 ? "t" : "r").slice() : [], ip: (s === 4 ? GW.set.t : GW.set.r).slice() };
  const mkSets = D => { const x = { rz: D ? D.rz.slice() : sets.rz, allin: D ? D.allin : true }; for (let s = st0; s <= 5; s++) x[s] = s === st0 ? (D && D.first ? { oop: D.first.oop.slice(), ip: D.first.ip.slice() } : sets[s]) : { oop: GW.set.lead ? gwOopSz(GW.set, s === 4 ? "t" : "r").slice() : [], ip: (s === 4 ? GW.set.t : GW.set.r).slice() }; return x; };
  if (!go && gwAskOn()) {
    setTab("solver");
    return gwAskOpen({ st0, title: `${cfg.src || "Mano importata"} sul ${["", "", "", "flop", "turn", "river"][st0]} ${cfg.boardS}`, first: sets[st0], rz: sets.rz, mk: D => gwSolve(cfg.board, cfg.pot, cfg.stack, cfg.ranges, st0 === 3 ? "flop" : st0 === 4 ? "turn" : "river", false, mkSets(D)), go: D => { GW._handD = D; gwOpenHand(cfg, lockName, true); } });
  }
  const o = gwSolve(cfg.board, cfg.pot, cfg.stack, cfg.ranges, st0 === 3 ? "flop" : st0 === 4 ? "turn" : "river", false, mkSets(go ? GW._handD : null));
  GW._handD = null;
  setTab("solver");
  gwStartSolve(o, `Risolvo il ${["", "", "", "flop", "turn", "river"][st0]} della mano`, E => {
    const L = { E, steps: [], oop: names[0], ip: names[1] };
    let n = E.tree.root;
    for (const s of cfg.path || []) { if (!n || n.t !== "a") break; let best = -1, bd = 1e9; n.acts.forEach((a, k) => { if (a.kind === s.kind && (s.amt == null || a.amt == null)) { best = k; bd = 0; } else if ((s.kind === "bet" || s.kind === "raise") && (a.kind === "bet" || a.kind === "raise" || a.kind === "allin")) { const dd = Math.abs(a.amt - s.amt); if (dd < bd) { bd = dd; best = k; } } }); if (best < 0) break; L.steps.push(best); n = n.ch[best]; }
    GW.layers = [L];
    if (cfg.after) cfg.after(L);
    if (lockName && lockName.startsWith("opp:")) { L.locks = { nodes: {}, prof: { kind: "opp", id: lockName.slice(4), pl: 1 - cfg.heroPl } }; setTimeout(() => gwApplyLocks(L), 0); }
  });
}

/* ---------- continua al river dopo una soluzione del flop ---------- */
function gwStreetStart(L) {
  let n = L.E.tree.root, idx = 0, start = n;
  L.steps.forEach((k, i) => { if (n.t === "c") { n = n.ch[k]; idx = i + 1; start = n; return; } n = n.ch[k]; });
  return { node: start, idx };
}
function gwReplay(NL, hist, base) {
  let m = NL.E.tree.root;
  for (const h of hist) {
    if (!m || m.t !== "a") break;
    let best = -1, bd = 1e9;
    m.acts.forEach((a, k) => { if (a.kind === h.kind && (h.amt == null || a.amt == null)) { best = k; bd = 0; } else if (h.amt != null && a.amt != null && (a.kind === h.kind || a.kind === "allin" || h.kind === "allin" || (a.kind === "bet") === (h.kind === "bet"))) { const dd = Math.abs(a.amt - (h.amt - base)); if (dd < bd) { bd = dd; best = k; } } });
    if (best < 0) break;
    NL.steps.push(best); m = m.ch[best];
  }
}
function gwReSolve(L, sets, ranges, label, after, ov) {
  const ss = gwStreetStart(L), E = L.E, G = E.G, { r } = msReach(E, L.steps.slice(0, ss.idx));
  if (!after) { const hist = []; let n = ss.node; for (const k of L.steps.slice(ss.idx)) { const a = n.acts[k]; hist.push({ kind: a.kind, amt: a.amt }); n = n.ch[k]; } after = (NL, b0) => gwReplay(NL, hist, b0); }
  const rg = ranges || [0, 1].map(p => G.R[p].map((x, i) => ({ c: x.c, w: r[p][i], key: x.key })).filter(x => x.w > 1e-4));
  const board = [...G.board, ...ss.node.cards], base = ss.node.inv[0];
  const o = gwSolve(board, ov ? ov.pot : E.o.pot + 2 * base, ov ? ov.stack : E.o.stack - base, rg, board.length === 3 ? "flop" : board.length === 4 ? "turn" : "river", false, sets);
  const li = GW.layers.indexOf(L);
  gwStartSolve(o, label, E2 => {
    if (ss.idx === 0) GW.layers = GW.layers.slice(0, li); else { GW.layers = GW.layers.slice(0, li + 1); L.steps = L.steps.slice(0, ss.idx); }
    const NL = { E: E2, steps: [], oop: L.oop, ip: L.ip };
    GW.layers.push(NL); GW.sel = null; GW.filter = null;
    if (after) after(NL, base);
  });
}
function gwSetsFromO(o, st0) {
  const s = { rz: [], rz2: [], allin: o.allin !== false, maxR: o.maxR };
  [3, 4, 5].forEach(k => { const x = o.sz[k]; if (k >= st0 && x) { s[k] = { oop: (x.oop || []).map(v => Math.round(v * 100)), ip: (x.ip || []).map(v => Math.round(v * 100)) }; if (x.rz && x.rz.length) s.rz = x.rz.map(v => Math.round(v * 100)); if (x.rz2 && x.rz2.length) s.rz2 = x.rz2.map(v => Math.round(v * 100)); } });
  if (st0 === 4 && !s[5]) s[5] = { oop: GW.set.lead ? gwOopSz(GW.set, "r").slice() : [], ip: GW.set.r.slice() };
  return s;
}
function gwContinueRiver(L) {
  if (GW.busy) return;
  const ss = gwStreetStart(L);
  const hist = []; let n = ss.node;
  for (const k of L.steps.slice(ss.idx)) { const a = n.acts[k]; hist.push({ kind: a.kind, amt: a.amt }); n = n.ch[k]; }
  const sets = gwSetsFromO(L.E.o, 4);
  gwReSolve(L, sets, null, "Preparo il river: risolvo turn e river", (NL, base) => gwReplay(NL, hist, base));
}

function gwTurnFromFlop(L, node, card) {
  if (GW.busy) return;
  const E = L.E, G = E.G, { r } = msReach(E, L.steps), li = GW.layers.indexOf(L);
  const rr = [0, 1].map(p => msMask(G, p, r[p], card));
  const ranges = [0, 1].map(p => G.R[p].map((x, i) => ({ c: x.c, w: rr[p][i], key: x.key })).filter(x => x.w > 1e-4));
  const board = [...G.board, card], sets = gwSetsFromO(E.o, 4);
  const o = gwSolve(board, E.o.pot + node.inv[0] + node.inv[1], E.o.stack - node.inv[0], ranges, "turn", false, sets);
  gwStartSolve(o, `Risolvo turn e river su ${board.map(hcstr).join(" ")}`, E2 => { GW.layers = GW.layers.slice(0, li + 1); GW.layers.push({ E: E2, steps: [], oop: L.oop, ip: L.ip, turnCard: card }); GW.sel = null; GW.filter = null; });
}

/* cancella la mano in analisi e torna all'inizio del preflop (le soluzioni già calcolate restano in memoria) */
function gwNewHand() {
  if (GW.solveE) { GW.solveE.cancel = true; GW.solveE = null; }
  GW.solveTok = (GW.solveTok || 0) + 1;
  if (GW.prac) GW.prac.prova = null;
  Object.assign(GW, { sq: null, rev: null, autoPrac: false, busy: false, line: [], board: "", direct: null, layers: [], customOpen: false, ask: null, cache: new Map(), tab: "strat", sel: null, filter: null, pick: null, dynInfo: null, evAuto: null, fromMem: false, showSet: false, showLib: false, ned: null });
  if (GW.bld) GW.bld.open = false;
  if (GW.prac) { GW.prac.hand = null; GW.prac.fixed = null; }
  renderStudy(); window.scrollTo({ top: 0 });
}

/* ---------- le mie tabelle: crea, modifica e salva range personalizzati ---------- */
function gwTabsModal() {
  const L = myRanges(), T = GW.te || (GW.te = { oop: "", ip: "", brush: 100, myId: {}, sel: null, del: null });
  const pct = r => { try { return fmt(reCombos(svParseRange(r.range)) / 1326 * 100, 1); } catch (e) { return "-"; } };
  const list = L.length ? L.slice().sort((a, b) => a.name.localeCompare(b.name, "it")).map(r => `<div class="gwtl ${T.sel === r.id ? "on" : ""}"><button class="gwtl-n" data-gtl="${r.id}"><b>${esc(r.name)}</b><small>${pct(r)}% delle mani · ${new Date(r.upd).toLocaleDateString("it-IT")}</small></button>${T.del === r.id ? `<span class="gwtl-q"><button class="gwbtn gwdanger" data-gtdy="${r.id}">Elimina</button><button class="gwbtn ghost" data-gtdn="1">No</button></span>` : `<button class="gwico" data-gtd="${r.id}" title="Elimina">🗑</button>`}</div>`).join("") : `<p class="gwmuted">Nessuna tabella salvata. Dipingi un range a destra, dagli un nome e premi "Salva come nuova".</p>`;
  return `<div class="gwmodal"><div class="gwmodal-b" style="max-width:1080px"><div class="gwhead"><b>📋 Le mie tabelle</b><button class="gwbtn ghost" data-gtabs="0">Chiudi</button></div>
    <p class="gwmuted" style="margin:0 0 10px">Crea i tuoi range (open, difese, 3-bet, range degli avversari), salvali con un nome e caricali quando imposti uno spot: li trovi in "Carica una tabella" in ogni editor di range. Sono salvate con i tuoi progressi.</p>
    <div class="gwtabs2"><div class="gwtl-list"><button class="gwbtn" data-gtn="1">+ Nuova tabella</button>${list}</div><div class="gwlight"><div class="gwsub" style="margin:0 0 6px;color:#1f2a24;font-size:14px">${T.sel && myRangeGet(T.sel) ? "Modifica: " + esc(myRangeGet(T.sel).name) : "Nuova tabella"}</div><div id="gwTE"></div></div></div></div></div>`;
}
function gwTabsBind() {
  const T = GW.te, Q = q => document.querySelectorAll(q), el = $("#gwTE");
  if (el) svRangeEditor(el, T, 0, id => { T.sel = id; renderStudy(); const m = document.querySelector("#gwTE .remym"); if (m) m.textContent = "Salvata ✔"; });
  Q("[data-gtn]").forEach(b => b.onclick = () => { Object.assign(T, { oop: "", sel: null, del: null, myId: {} }); renderStudy(); });
  Q("[data-gtl]").forEach(b => b.onclick = () => { const r = myRangeGet(b.dataset.gtl); if (!r) return; Object.assign(T, { oop: r.range, sel: r.id, del: null, myId: { oop: r.id } }); renderStudy(); });
  Q("[data-gtd]").forEach(b => b.onclick = () => { T.del = b.dataset.gtd; renderStudy(); });
  Q("[data-gtdn]").forEach(b => b.onclick = () => { T.del = null; renderStudy(); });
  Q("[data-gtdy]").forEach(b => b.onclick = () => { const id = b.dataset.gtdy; myRangeDel(id); if (T.sel === id) Object.assign(T, { oop: "", sel: null, myId: {} }); T.del = null; renderStudy(); });
}

