/* ================= COLLEZIONE: cornici di Orki e tavoli da sbloccare =================
   Si sbloccano con i traguardi: lezioni, esami, serie di giorni, risposte giuste e fiches raggiunte.
   Le fiches non si spendono: sono il bankroll che serve per salire di livello, quindi conta solo arrivarci.
   Una volta sbloccato, un premio resta tuo. La cornice scelta va attorno a Orki: in alto, al tavolo e nel fumetto. */
const fiNow = () => Math.round(brGet() * FI);
const lesDone = () => Object.keys(S.sessions || {}).filter(id => { const s = sessById(+id); return s && !s.exam; }).length;
const FRAMES = [
  ["argento", "Argento", () => lesDone() >= 5, "Completa 5 lezioni"],
  ["oro", "Oro", () => prizeHas("nl2"), "Supera l'esame NL2"],
  ["smeraldo", "Smeraldo", () => streak() >= 7, "Allenati 7 giorni di fila"],
  ["zaffiro", "Zaffiro", () => gS().correct >= 500, "Arriva a 500 risposte giuste"],
  ["rubino", "Rubino", () => fiNow() >= 1000, "Arriva a 1.000 fiches"],
  ["ametista", "Ametista", () => prizeHas("nl25"), "Supera l'esame NL25"],
  ["onice", "Onice", () => streak() >= 30, "Allenati 30 giorni di fila"],
  ["reale", "Orca reale", () => prizeHas("nl1000"), "Supera l'esame NL1000"],
];
/* tavoli da collezione: [valore, nome, condizione, come si sblocca, colori dell'anteprima] */
const TAV_X = [
  ["corallo", "Corallo e oro", () => fiNow() >= 500, "Arriva a 500 fiches", "#e2674f", "#9c3a2a", "#d4a24c"],
  ["abisso", "Abisso", () => prizeHas("nl10"), "Supera l'esame NL10", "#0f6e7e", "#06262e", "#39d0e0"],
  ["aurora", "Aurora", () => streak() >= 14, "Allenati 14 giorni di fila", "#5b3fa8", "#24164a", "#9be7c4"],
];
const collHas = (k, id) => !!(((S.coll || {})[k] || {})[id]);
const tavOk = v => !TAV_X.some(t => t[0] === v) || collHas("t", v);
const tavWhy = v => { const t = TAV_X.find(x => x[0] === v); return t ? t[3] : ""; };
function collApply() {
  const R = document.documentElement, f = S.frame && collHas("f", S.frame) ? S.frame : "";
  if (f) R.dataset.cornice = f; else delete R.dataset.cornice;
}
/* controlla i traguardi: un avviso per ogni premio nuovo (non durante un esame) */
function collCheck() {
  if (typeof S === "undefined" || !S || (run && isExamRun())) return collApply();
  const got = [];
  const unlock = (k, id, msg, n) => { S.coll = S.coll || {}; S.coll[k] = { ...(S.coll[k] || {}), [id]: today() }; got.push([msg, n]); };
  FRAMES.forEach(([id, n, ok]) => { try { if (!collHas("f", id) && ok()) unlock("f", id, `🎁 Nuova cornice per Orki: <b>${n}</b>. La scegli in Progressi.`, n); } catch (e) {} });
  TAV_X.forEach(([id, n, ok]) => { try { if (!collHas("t", id) && ok()) unlock("t", id, `🎁 Nuovo tavolo sbloccato: <b>${n}</b>. Lo scegli nelle Impostazioni o in Progressi.`, n); } catch (e) {} });
  /* più premi insieme: un solo avviso */
  if (got.length) { persistSoon(); const msg = got.length === 1 ? got[0][0] : `🎁 ${got.length} nuovi premi sbloccati: <b>${got.map(g => g[1]).join(", ")}</b>. Li trovi in Progressi.`; setTimeout(() => gToast(msg), 400); }
  collApply();
}
const _renderStatsC = renderStats;
renderStats = function () { const out = _renderStatsC.apply(this, arguments); try { collCheck(); } catch (e) {} return out; };
/* sezione della bacheca in Progressi */
function collHtml() {
  const fr = [["", "Nessuna", null, "Sempre disponibile"], ...FRAMES], cur = S.frame && collHas("f", S.frame) ? S.frame : "";
  const nF = FRAMES.filter(f => collHas("f", f[0])).length, nT = TAV_X.filter(t => collHas("t", t[0])).length;
  const orki = typeof gMascot === "function" ? gMascot("happy", 40) : "";
  let h = `<div class="coll"><span class="eyebrow">Cornici di Orki · ${nF} su ${FRAMES.length}</span><div class="coll-g">${fr.map(([id, n, , why]) => {
    const ok = !id || collHas("f", id);
    return `<button type="button" class="coll-f ${cur === id ? "on" : ""} ${ok ? "" : "lock"}" ${ok ? `data-cframe="${id}"` : "disabled"} aria-pressed="${cur === id}" title="${esc(ok ? n : why)}"><span class="coll-av" data-fr="${id}">${orki}</span><b>${esc(n)}</b><small>${ok ? (cur === id ? "In uso" : "Sbloccata") : "🔒 " + esc(why)}</small></button>`;
  }).join("")}</div></div>`;
  h += `<div class="coll"><span class="eyebrow">Tavoli da collezione · ${nT} su ${TAV_X.length}</span><div class="coll-g">${TAV_X.map(([id, n, , why, c1, c2, c3]) => {
    const ok = collHas("t", id), on = PREF.felt === id;
    return `<button type="button" class="coll-f tav ${on ? "on" : ""} ${ok ? "" : "lock"}" ${ok ? `data-ctav="${id}"` : "disabled"} aria-pressed="${on}" title="${esc(ok ? n : why)}"><span class="coll-tav" style="--c1:${c1};--c2:${c2};--c3:${c3}"></span><b>${esc(n)}</b><small>${ok ? (on ? "In uso" : "Sbloccato") : "🔒 " + esc(why)}</small></button>`;
  }).join("")}</div></div>`;
  return h;
}
document.addEventListener("click", e => {
  if (!e.target.closest) return;
  const f = e.target.closest("button[data-cframe]");
  if (f) { const id = f.dataset.cframe; if (id && !collHas("f", id)) return; S.frame = id; persistSoon(); collApply(); if (tab === "progress" && !run) renderProgress(); return; }
  const t = e.target.closest("button[data-ctav]");
  if (t) { const id = t.dataset.ctav; if (!tavOk(id)) return; prefSet("felt", PREF.felt === id ? "verde" : id); if (tab === "progress" && !run) renderProgress(); }
});
collApply();
