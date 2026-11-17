/* ================= LABORATORIO DEL RANDOMIZZATORE =================
   UI.rngLab(): scegli una mano mista, guarda le fasce da 1 a 100 e tira il numero.
   Regola della scuola (la stessa di js/app/08-randomizzatore.js): l'azione più aggressiva prende i numeri bassi.
   «Tira 100 volte» mostra che, seguendo il numero, le frequenze vengono giuste da sole. */
const RG_P = [
  { k: "b30", n: "Bet 30% · Check 70%", a: [["Bet", 30, "a"], ["Check", 70, "p"]] },
  { k: "r3", n: "Raise 15% · Call 50% · Fold 35%", a: [["Raise", 15, "a"], ["Call", 50, "m"], ["Fold", 35, "p"]] },
  { k: "c40", n: "Call 40% · Fold 60%", a: [["Call", 40, "m"], ["Fold", 60, "p"]] },
  { k: "q", n: "Bet 50% · Check 50%", a: [["Bet", 50, "a"], ["Check", 50, "p"]] },
];
/* fasce [da, a] nell'ordine delle azioni, dalla più aggressiva */
const rgBands = P => { let lo = 1; return P.a.map(([, f]) => { const b = [lo, lo + f - 1]; lo += f; return b; }); };
const rgPick = (P, n) => rgBands(P).findIndex(([lo, hi]) => n >= lo && n <= hi);
function rgOut(k, roll, tally) {
  const P = RG_P.find(p => p.k === k) || RG_P[0], B = rgBands(P), i = roll ? rgPick(P, roll) : -1, tot = tally ? tally.reduce((a, b) => a + b, 0) : 0;
  const bar = P.a.map(([n, f, t], j) => `<i class="${t}${j === i ? " on" : ""}" style="flex:${f}"><b>${B[j][0]}-${B[j][1]}</b><small>${n}</small></i>`).join("");
  const mark = roll ? `<u style="left:${roll - .5}%"></u>` : "";
  const res = roll ? `<div class="lx-rnd-n"><b>${roll}</b><span>${roll >= B[i][0] && roll <= B[i][1] ? `è tra ${B[i][0]} e ${B[i][1]}: <em class="${P.a[i][2]}">${P.a[i][0]}</em>` : ""}</span></div>` : `<div class="lx-rnd-n"><b>?</b><span>tira il numero per decidere</span></div>`;
  const tl = tot ? `<p class="lx-rnd-t">Su ${tot} ${tot === 1 ? "tiro" : "tiri"}: ${P.a.map(([n, f], j) => `${n} <b>${Math.round(tally[j] / tot * 100)}%</b> <small>(teoria ${f}%)</small>`).join(" · ")}</p>` : "";
  return `<div class="lx-rnd-bar">${bar}${mark}</div><div class="lx-rnd-sc"><span>1</span><span>numero del randomizzatore</span><span>100</span></div>${res}${tl}`;
}
UI.rngLab = () => `<div class="lx-rnd" data-rg data-rgk="${RG_P[0].k}"><div class="lx-rnd-b" role="group" aria-label="Mano mista">${RG_P.map((p, i) => `<button type="button" class="${i ? "" : "on"}" data-rgk="${p.k}" aria-pressed="${i ? "false" : "true"}">${p.n}</button>`).join("")}</div><div class="lx-rnd-o" data-rgo aria-live="polite">${rgOut(RG_P[0].k)}</div><div class="lx-rnd-a"><button type="button" class="btn primary" data-rgroll="1">Tira il numero</button><button type="button" class="btn" data-rgroll="100">Tira 100 volte</button></div></div>`;
document.addEventListener("click", e => {
  const t = e.target.closest && e.target.closest("[data-rg] [data-rgk],[data-rgroll]"); if (!t) return;
  const box = t.closest("[data-rg]"), o = box.querySelector("[data-rgo]");
  if (t.dataset.rgk) { box.dataset.rgk = t.dataset.rgk; delete box.dataset.rgt; box.querySelectorAll(".lx-rnd-b [data-rgk]").forEach(x => { x.classList.toggle("on", x === t); x.setAttribute("aria-pressed", x === t ? "true" : "false"); }); o.innerHTML = rgOut(box.dataset.rgk); return; }
  const P = RG_P.find(p => p.k === box.dataset.rgk) || RG_P[0], tally = box.dataset.rgt ? JSON.parse(box.dataset.rgt) : P.a.map(() => 0);
  let roll = 0; for (let i = 0; i < +t.dataset.rgroll; i++) { roll = typeof rngRoll === "function" ? rngRoll() : 1 + Math.floor(Math.random() * 100); tally[rgPick(P, roll)]++; }
  box.dataset.rgt = JSON.stringify(tally); o.innerHTML = rgOut(P.k, roll, tally);
});
