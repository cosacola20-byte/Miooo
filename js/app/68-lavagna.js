/* ================= LAVAGNA: il riepilogo a fine lezione =================
   Scritta a gesso su una lavagna verde con la cornice di legno, una riga alla volta.
   Il contenuto viene solo dalla scheda della lezione, niente di nuovo:
   «Le tre regole» se la lezione le ha, altrimenti i titoli delle sezioni; poi la «Regola d'oro»,
   la «Trappola classica» e la sintesi finale, se ci sono. */
function lavData(id) {
  const L = LESSONS[id]; if (!L) return null;
  const d = document.createElement("div"); d.innerHTML = L.card;
  const txt = el => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  const box = tag => { const t = [...d.querySelectorAll(".lx-box .lx-tag")].find(x => txt(x) === tag); return t ? txt(t.parentElement.querySelector("p")) : ""; };
  const h3 = [...d.querySelectorAll("h4")].find(h => /^Le tre regole/i.test(txt(h)));
  let head = "Oggi hai visto", items = [];
  if (h3) {
    head = txt(h3); let ol = h3.nextElementSibling; while (ol && ol.tagName !== "OL") ol = ol.nextElementSibling;
    items = ol ? [...ol.querySelectorAll(":scope > li")].map(li => txt(li.querySelector("b")) || txt(li)) : [];
  }
  if (!items.length) { head = "Oggi hai visto"; items = [...d.querySelectorAll("h4")].map(txt).filter(x => x && !/^(Le tre regole|Prova tu|Esercizio|Un esempio)/i.test(x)).slice(0, 5); }
  /* senza «Regola d'oro» si usa il primo riquadro della lezione, con il suo titolo */
  let goldT = "Regola d'oro", gold = box(goldT);
  if (!gold) { const t = [...d.querySelectorAll(".lx-box .lx-tag")].find(x => txt(x) !== "Trappola classica" && txt(x.parentElement.querySelector("p"))); if (t) { goldT = txt(t); gold = txt(t.parentElement.querySelector("p")); } }
  return { t: L.t, n: typeof lesNum === "function" ? lesNum(id) : "", head, items, goldT, gold, trap: box("Trappola classica"), end: txt(d.querySelector(".lx-end b")) };
}
/* le carte scritte nel testo («A♠») prendono il colore del seme, come il gesso colorato */
const lavSuits = s => esc(s).replace(/(10|[2-9JQKA])([♠♥♦♣])/g, (m, r, su) => `<span class="lv-s ${({ "♠": "s", "♥": "h", "♦": "d", "♣": "c" })[su]}">${r}${su}</span>`);
function lavagnaHtml(id) {
  const D = lavData(id); if (!D || (!D.items.length && !D.gold && !D.trap)) return "";
  let i = 0; const line = (cls, html) => `<div class="lv-l ${cls}" style="--i:${i++}">${html}</div>`;
  let h = line("lv-t", `${D.n ? `<span class="lv-n">${esc(D.n)}</span> ` : ""}${esc(D.t)}`);
  if (D.items.length) h += line("lv-h", esc(D.head)) + D.items.map((x, k) => line("lv-i", `<b>${k + 1}.</b> ${lavSuits(x)}`)).join("");
  if (D.gold) h += line("lv-gold", `<b>${esc(D.goldT)}</b> ${lavSuits(D.gold)}`);
  if (D.trap) h += line("lv-trap", `<b>Attento</b> ${lavSuits(D.trap)}`);
  if (D.end && !D.gold) h += line("lv-end", `<b>In sintesi</b> ${lavSuits(D.end)}`);
  return `<section class="lav" aria-label="Riepilogo della lezione"><div class="lav-eye">Riepilogo alla lavagna</div><div class="lav-frame"><div class="lav-board">${h}</div><div class="lav-tray" aria-hidden="true"><i class="lv-chalk"></i><i class="lv-chalk y"></i><i class="lv-eraser"></i></div></div>${typeof gMascot === "function" ? `<div class="lav-orki" aria-hidden="true">${gMascot("happy", 64)}</div>` : ""}</section>`;
}
/* a fine sessione: la lavagna della lezione appena fatta (non negli esami e nei test) */
function lavagnaEnd() {
  if (!run || run.kind !== "session" || isExamRun()) return "";
  const p = run.plan.find(x => x[0] === "lez" && x[2] && x[2].id); return p ? lavagnaHtml(p[2].id) : "";
}
