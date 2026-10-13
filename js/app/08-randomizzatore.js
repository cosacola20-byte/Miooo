/* ================= RANDOMIZZATORE (RNG 1-100) =================
   Con una strategia mista il numero decide quale azione giocare: le azioni più aggressive prendono i numeri bassi.
   Esempio: open 30% e fold 70% -> con RNG da 1 a 30 si apre, da 31 a 100 si folda.
   f: frequenze nell'ordine delle azioni della tabella (fold per prima, la più aggressiva per ultima). */
const rngRoll = () => 1 + Math.floor(Math.random() * 100);
function rngBands(f) {
  const out = f.map(() => null); let acc = 0;
  for (let i = f.length - 1; i >= 0; i--) { if (f[i] <= 0) continue; const lo = Math.round(acc * 100) + 1; acc += f[i]; const hi = i === f.findIndex(x => x > 0) ? 100 : Math.min(100, Math.round(acc * 100)); if (hi >= lo) out[i] = [lo, hi]; }
  return out;
}
function rngAction(f, rng) { const b = rngBands(f); for (let i = 0; i < b.length; i++) if (b[i] && rng >= b[i][0] && rng <= b[i][1]) return i; return f.indexOf(Math.max(...f)); }
const rngPill = rng => `<span class="rngpill" title="Randomizzatore: con le mani miste decide quale azione giocare">RNG <b>${rng}</b></span>`;
function rngExpl(acts, f, rng) {
  const b = rngBands(f), live = f.map((x, i) => i).filter(i => b[i]);
  if (live.length < 2) return "";
  const a = rngAction(f, rng);
  return `RNG <b>${rng}</b>: ${live.map(i => `${acts[i]} ${Math.round(f[i] * 100)}% (numeri ${b[i][0]}-${b[i][1]})`).join(", ")}. Con ${rng} si gioca <b>${acts[a]}</b>.`;
}
function preGrid(sp, mark) {
  let h = `<div class="pgrid13">`;
  for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) {
    const hn = handAt(i, j), f = sp.f[hn];
    let bg = "var(--surface2)";
    if (f) { let acc = 0; const st = []; f.forEach((x, k) => { if (x <= 0) return; const cols = sp.acts.length === 2 ? ["var(--c-aria)", "var(--c-draw)"] : ACT_COL; st.push(`${cols[k]} ${acc * 100}% ${(acc + x) * 100}%`); acc += x; }); bg = `linear-gradient(90deg, ${st.join(", ")})`; }
    h += `<span class="pc13${hn === mark ? " mk" : ""}${f ? "" : " off"}" style="background:${bg}" title="${hn}${f ? ": " + sp.acts.map((a, k) => a + " " + Math.round(f[k] * 100) + "%").join(", ") : " (non nel range)"}">${hn}</span>`;
  }
  const cols = sp.acts.length === 2 ? ["var(--c-aria)", "var(--c-draw)"] : ACT_COL;
  return h + `</div><div class="legend">${sp.acts.map((a, k) => `<span><i style="background:${cols[k]}"></i>${a}</span>`).join("")}</div>`;
}
function preBorder(sp) {
  const out = [];
  for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) {
    const hn = handAt(i, j), f = sp.f[hn]; if (!f) continue;
    const am = f.indexOf(Math.max(...f));
    let b = Math.max(...f) < 0.85;
    for (const [di, dj] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) { const n = sp.f[handAt(i + di, j + dj)] ; if (i + di < 0 || j + dj < 0 || i + di > 12 || j + dj > 12 || !n) continue; if (n.indexOf(Math.max(...n)) !== am) b = true; }
    if (b) out.push(hn);
  }
  return out;
}
function randCardsFor(hn) {
  const s = shuffle(SUITS.split(""));
  if (hn.length === 2) return hn[0] + s[0] + hn[1] + s[1];
  return hn[2] === "s" ? hn[0] + s[0] + hn[1] + s[0] : hn[0] + s[0] + hn[1] + s[1];
}
DRILLS.preflop = {
  name: "Preflop GTO", short: "Preflop", time: 12,
  desc: "Open, difese e 3-bet con i range GTO delle tue tabelle: la mano esce, tu decidi.",
  get rule() { return preLvMicro() ? "Tabelle dei micro limiti (NL2, NL5, NL10): range semplici, ogni mano si gioca sempre o mai. Open 2,5bb (3bb dalla SB), 3-bet circa 3 volte in posizione e circa 4 volte fuori, squeeze con 1 volta in più per ogni caller." : "Tabelle da NL25 a NL200, calcolate a rake NL200. Le mani miste si giocano con il randomizzatore (RNG da 1 a 100): le azioni più aggressive prendono i numeri bassi. Con 44 che apre il 30%, da 1 a 30 apri e da 31 a 100 foldi."; },
  sample(ctx) {
    const ids = (ctx.opt && ctx.opt.spots) || PRE.map(s => s.id);
    const sp = preFor(pick(ids));
    const keys = Object.keys(sp.f);
    let hn;
    if (Math.random() < 0.55) { const b = preBorder(sp); hn = pick(b.length ? b : keys); }
    else { const tot = keys.reduce((a, k) => a + combosOf(k), 0); let r = Math.random() * tot; for (const k of keys) { r -= combosOf(k); if (r <= 0) { hn = k; break; } } hn = hn || keys[0]; }
    return { id: sp.id, h: hn, c: randCardsFor(hn), rng: rngRoll() };
  },
  build({ id, h, c, rng }) {
    const sp = PRE_BY[id], f = sp.f[h];
    if (!rng) rng = rngRoll();
    return {
      title: "Preflop · " + sp.label,
      body: `<p class="ctx">${sp.micro ? `<span class="micro-tag">Tabelle NL2-NL10</span> ` : ""}${sp.label}. NL cash 6-max, 100bb. Cosa fai? ${f && f.some(x => x > 0.001 && x < 0.999) ? rngPill(rng) : ""}</p>` + (pf6Table(sp, c) || tableHtml([{ hero: 1, lbl: "La tua mano", cards: c }])),
      layout: sp.acts.length === 3 ? "cols3" : "cols2", center: true, opts: sp.acts.map((a, k) => ({ label: a, v: k })), timed: true,
      check(v) {
        const best = rngAction(f, rng), me = v == null ? 0 : f[v];
        const score = v == null ? 0 : v === best ? 100 : me >= 0.2 ? 40 : 0;
        const rx = rngExpl(sp.acts, f, rng);
        return { score, correct: best, expl: `<p><b>${h}</b>: ${sp.acts.map((a, k) => `${a} <b class="mono">${Math.round(f[k] * 100)}%</b>`).join(" · ")}.</p>${rx ? `<p>${rx}${v != null && v !== best && me >= 0.2 ? ` ${sp.acts[v]} fa parte della strategia, ma non con questo numero: mezzo errore.` : ""}</p>` : ""}${preGrid(sp, h)}<p class="muted" style="font-size:13px;margin-top:6px">${sp.est ? "Range di riferimento stimato da soluzioni solver a 100bb: non ci sono tabelle per questo spot." : "Tabella GTO (rake NL200). Ai micro limiti adatta contro chi riaggredisce poco."}</p>` };
      },
    };
  },
};

