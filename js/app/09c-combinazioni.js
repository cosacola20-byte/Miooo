/* ================= COMBINAZIONI: LABORATORIO E DIVISIONE DELLE 1.326 MANI =================
   UI.comboLab(): scegli una situazione e vedi tutte le combinazioni di una mano, carta per carta.
   Quelle che contengono una carta che vedi (in mano o sul board) sono barrate, con la carta che le blocca cerchiata.
   UI.share1326(): le 169 mani senza i semi e le 1.326 combinazioni, divise tra coppie, suited e offsuit. */
const CL_SU = ["♠", "♥", "♦", "♣"];
const clCards = s => (String(s).replace(/10/g, "T").match(/[2-9TJQKA][♠♥♦♣]/g) || []);
/* tutte le combinazioni di «KK», «AK», «KQs», «KQo»: [prima carta, seconda carta, suited] */
function clCombos(t) {
  const a = t[0], b = t[1], k = t[2] || "", out = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    if (a === b) { if (i < j) out.push([a + CL_SU[i], b + CL_SU[j], false]); continue; }
    const s = i === j; if (k === "s" && !s || k === "o" && s) continue;
    out.push([a + CL_SU[i], b + CL_SU[j], s]);
  }
  return out;
}
/* le situazioni, nell'ordine in cui conviene guardarle: prima i conti di partenza, poi una carta alla volta */
const CL_P = [
  { k: "aa", t: "AA", n: "conto di partenza", hero: "", board: "", f: "4 assi, ne servono 2: 4 × 3 / 2 = <b>6</b>" },
  { k: "ak", t: "AK", n: "conto di partenza", hero: "", board: "", f: "4 assi × 4 re = <b>16</b>: le 4 suited, con il bordo d'oro, e 12 offsuit" },
  { k: "akh", t: "AK", n: "hai un re", hero: "K♠Q♥", board: "", f: `4 assi × 3 re = <b>12</b>: il tuo ${UI.c("K♠")} toglie le 4 AK con il re di picche` },
  { k: "kkb", t: "KK", n: "un re sul board", hero: "A♠Q♦", board: "K♠7♦2♣", f: "3 re rimasti: 3 × 2 / 2 = <b>3</b>" },
  { k: "kkhb", t: "KK", n: "re in mano e sul board", hero: "A♠K♦", board: "K♠7♦2♣", f: "2 re rimasti: 2 × 1 / 2 = <b>1</b>" },
  { k: "akhb", t: "AK", n: "hai AK, re sul board", hero: "A♠K♦", board: "K♠7♦2♣", f: "3 assi × 2 re = <b>6</b>" },
  { k: "kqs", t: "KQs", n: "solo suited, hai un re", hero: "K♠J♠", board: "", f: `una per seme, ma ${UI.c("K♠Q♠")} non c'è più: <b>3</b>` },
];
const clName = t => t.replace("T", "10");
function clOut(k) {
  const P = CL_P.find(p => p.k === k) || CL_P[0], dead = new Set([...clCards(P.hero), ...clCards(P.board)]);
  const all = clCombos(P.t), left = all.filter(c => !dead.has(c[0]) && !dead.has(c[1])).length, out = all.length - left;
  const seen = P.hero || P.board
    ? `<div class="lx-cl-seen"><div><small>In mano</small>${UI.c(P.hero)}</div><div><small>Board</small>${P.board ? UI.c(P.board) : "<em>preflop</em>"}</div></div>`
    : `<p class="lx-cl-seen none">Nessuna carta vista: è il conto di partenza</p>`;
  let nx = 0;
  const cells = all.map(([x, y, s]) => { const dx = dead.has(x), dy = dead.has(y), bl = dx || dy, card = (c, d) => d ? `<s>${UI.c(c)}</s>` : UI.c(c);
    return `<span class="lx-cl-c${bl ? " x" : ""}${s ? " su" : ""}"${bl ? ` style="--d:${(0.25 + nx++ * 0.05).toFixed(2)}s" title="Bloccata dalla carta ${dx ? x : y}"` : ""}>${card(x, dx)}${card(y, dy)}</span>`; }).join("");
  const note = !out ? "nessuna bloccata" : `${out} su ${all.length} ${out === 1 ? "bloccata" : "bloccate"} dalle carte che vedi`;
  return `${seen}<div class="lx-cl-g${P.t[0] === P.t[1] ? " p" : ""}">${cells}</div><div class="lx-cl-n"><b data-cln="${all.length}">${left}</b><span><span><em data-clw>${left === 1 ? "combinazione" : "combinazioni"}</em> di ${clName(P.t)}</span><small>${note}</small></span></div><p class="lx-cl-f">${P.f}</p>`;
}
UI.comboLab = () => `<div class="lx-cl" data-cl><div class="lx-cl-b" role="group" aria-label="Situazione">${CL_P.map((p, i) => `<button type="button" class="${i ? "" : "on"}" data-clk="${p.k}" aria-pressed="${i ? "false" : "true"}"><b>${clName(p.t)}</b><small>${p.n}</small></button>`).join("")}</div><div class="lx-cl-o" data-clo aria-live="polite">${clOut(CL_P[0].k)}</div><p class="lx-cl-leg"><span><i class="su"></i>suited</span><span><i class="x"></i>bloccata da una carta che vedi</span></p></div>`;
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-clk]"); if (!b) return;
  const box = b.closest("[data-cl]"); box.querySelectorAll("[data-clk]").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
  const o = box.querySelector("[data-clo]"); o.innerHTML = clOut(b.dataset.clk); o.classList.remove("in"); void o.offsetWidth; o.classList.add("in");
  /* il contatore scende da tutte le combinazioni a quelle rimaste, mentre le bloccate si barrano */
  const n = o.querySelector("[data-cln]"), w = o.querySelector("[data-clw]"), to = +n.textContent, from = +n.dataset.cln;
  const calm = typeof calmMotion === "function" ? calmMotion() : matchMedia("(prefers-reduced-motion: reduce)").matches, sp = typeof animK === "function" ? animK() : 1;
  if (to < from && !calm) { const show = v => { n.textContent = v; w.textContent = v === 1 ? "combinazione" : "combinazioni"; }; show(from); const t0 = performance.now() + 250 * sp, dur = 500 * sp;
    const step = t => { if (!n.isConnected) return; const k = Math.min(1, Math.max(0, (t - t0) / dur)); show(Math.round(from - (from - to) * k)); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step); }
});
/* le 169 mani senza i semi e le 1.326 combinazioni: 13 coppie × 6, 78 suited × 4, 78 offsuit × 12 */
UI.share1326 = () => {
  const S = [["Coppie", 13, 6, "p"], ["Suited", 78, 4, "s"], ["Offsuit", 78, 12, "o"]];
  const pc = n => String(Math.round(n / 1326 * 1000) / 10).replace(".", ",");
  const bar = (lab, f, d0) => `<div class="lx-sh-row"><small>${lab}</small><div class="lx-sh-bar">${S.map(([n, m, k, c], i) => `<i class="${c}" style="flex:${f(m, k)};--d:${(d0 + i * 0.15).toFixed(2)}s" title="${n}: ${f(m, k)}"><b>${f(m, k)}</b></i>`).join("")}</div></div>`;
  return `<div class="lx-sh lx-anim">${bar("169 mani, senza contare i semi", m => m, 0)}${bar("1.326 combinazioni, contando i semi", (m, k) => m * k, 0.5)}<div class="lx-sh-leg">${S.map(([n, m, k, c]) => `<div class="${c}"><span></span><b>${n}</b><em>${m} mani × ${k} = ${m * k}</em><small>${pc(m * k)}%</small></div>`).join("")}</div><p class="lx-sh-cap">Le percentuali sono sulle 1.326 combinazioni.</p></div>`;
};
