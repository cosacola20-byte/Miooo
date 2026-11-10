/* ================= RENDER ================= */
let tab = "program", run = null, timerId = null;
/* esami a tempo: il tempo di ogni domanda dipende da quanto c'è da leggere (circa 30 secondi per una domanda normale) */
const EXAM_T = { base: 12, wps: 3.5, min: 20, max: 60 };
const isExamRun = () => !!(run && run.kind === "session" && (SESS.find(x => x.id === run.id) || {}).exam);
function examSecs(q) {
  const txt = (String(q.body || "") + " " + (q.opts || []).map(o => o.label).join(" ")).replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ");
  const words = (txt.match(/[^\s]+/g) || []).length, visual = /ptbl|p6-felt|qtable|potviz|regrid/.test(q.body || "") ? 5 : 0;
  return Math.max(EXAM_T.min, Math.min(EXAM_T.max, Math.round(EXAM_T.base + words / EXAM_T.wps + visual)));
}
function clearTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
function renderStats() {
  $("#stats").innerHTML = gHeader(); gBindHeader();
}
function setTab(t) {
  clearTimer(); PRE_CAT = null;
  if (run && run.results.length && !run.saved) saveResults(true);
  if (run) runSnapClear();
  tab = t; run = null;
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === t ? "true" : "false"));
  render(); tabsReveal();
}
/* su telefono la barra delle schede scorre: la scheda aperta resta sempre in vista e i bordi sfumano dove c'è altro */
function tabsEdge() { const T = document.getElementById("tabs"); if (!T) return; const m = T.scrollWidth - T.clientWidth; T.classList.toggle("fl", T.scrollLeft > 4); T.classList.toggle("fr", m > 4 && T.scrollLeft < m - 4); }
function tabsReveal() { const T = document.getElementById("tabs"); if (!T) return; const b = T.querySelector('button[aria-selected="true"]');
  if (b && T.scrollWidth > T.clientWidth) { const l = b.offsetLeft - T.offsetLeft, want = l - (T.clientWidth - b.offsetWidth) / 2; try { T.scrollTo({ left: Math.max(0, want), behavior: "smooth" }); } catch (e) { T.scrollLeft = Math.max(0, want); } }
  setTimeout(tabsEdge, 350); if (!T.dataset.edge) { T.dataset.edge = "1"; T.addEventListener("scroll", tabsEdge, { passive: true }); window.addEventListener("resize", tabsEdge); } tabsEdge(); }
setTimeout(() => { try { tabsReveal(); } catch (e) {} }, 300);
function render() {
  try { document.body.classList.toggle("felt-oro", typeof goldFelt === "function" && goldFelt()); document.body.classList.toggle("silent-run", !!(run && run.silent)); document.body.classList.toggle("theme-silent", eggTheme()); } catch (e) {}
  setTimeout(eggDecor, 0);
  try { const tb = document.querySelector('#tabs [data-tab="solver"]'); if (tb) tb.classList.toggle("tlock", !solverOk()); } catch (e) {}
  renderStats();
  if (run) return renderRun();
  ({ program: renderProgram, free: renderFree, data: renderData, err: renderErrors, opp: renderOpp, solver: () => solverOk() ? renderSolver() : renderSolverLock(), equity: renderEquity, coach: renderCoach, mind: renderMind, progress: renderProgress, ref: renderRef })[tab]();
  resumeBanner();
}
/* icona e colore di ogni drill nella scheda Drill liberi */
const DC_IC = {
  calc: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/>',
  cards: '<rect x="4" y="6.5" width="9.5" height="13.5" rx="2" transform="rotate(-9 8.75 13.25)"/><rect x="10.5" y="4" width="9.5" height="13.5" rx="2" transform="rotate(9 15.25 10.75)"/>',
  target: '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>',
  slider: '<path d="M4 8h9.5M18.5 8H20M4 16h2.500M11.500 16H20"/><circle cx="16" cy="8" r="2.300"/><circle cx="9" cy="16" r="2.300"/>',
  grid: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16"/>',
  shield: '<path d="M12 3.500l7 2.600v5.400c0 4.200-2.900 7.400-7 9-4.100-1.600-7-4.800-7-9V6.100z"/><path d="M9 12l2.200 2.200L15.200 10"/>',
  user: '<circle cx="12" cy="8.500" r="3.600"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  users: '<circle cx="9" cy="8" r="3.400"/><path d="M2.800 19.500a6.200 6.200 0 0 1 12.400 0"/><path d="M15.800 4.900a3.400 3.400 0 0 1 0 6.200M17.900 14.300a6.200 6.200 0 0 1 3.300 5.200"/>',
  book: '<path d="M12 6.500C9.500 5 7 5 4.500 6v13c2.500-1 5-1 7.500.500 2.500-1.500 5-1.500 7.500-.500V6c-2.500-1-5-1-7.500.500zM12 6.500v13"/>',
  bolt: '<path d="M13 3L5.500 13.500H11L10 21l8.500-11H13z"/>',
  crown: '<path d="M4 8.500l4 3.500 4-6.500 4 6.500 4-3.500-1.500 9.500h-13z"/>',
  flame: '<path d="M12 3.500c.500 3 3.200 4.600 4.600 7.100a5.600 5.600 0 1 1-10.200 2c0-1.200.500-2.200 1.200-3 .300 1.300 1 2 1.900 2.200C9.100 9 10 6 12 3.500z"/>',
  swords: '<path d="M4.500 4.500l10 10M4.500 4.500V8M4.500 4.500H8M19.500 4.500l-10 10M19.500 4.500V8M19.500 4.500H16M6 18l3-3M18 18l-3-3M5 19l1-1M19 19l-1-1"/>',
  table: '<ellipse cx="12" cy="12" rx="9" ry="6"/><ellipse cx="12" cy="12" rx="5.200" ry="2.800"/><circle cx="12" cy="3.600" r=".900" fill="currentColor"/><circle cx="12" cy="20.400" r=".900" fill="currentColor"/>',
  bulb: '<path d="M9.300 17.800h5.400M10.300 20.500h3.400M12 3.500a6 6 0 0 0-3.600 10.800c.600.500.900 1.100.900 1.700h5.400c0-.600.300-1.200.900-1.700A6 6 0 0 0 12 3.500z"/>',
  history: '<path d="M4 4.800v5h5"/><path d="M4.600 14.200a7.600 7.600 0 1 0 1.500-7.300L4 9.800"/><path d="M12 9v3.400l2.300 1.500"/>',
  brain: '<path d="M12 5.200A3.200 3.200 0 0 0 6.200 6.900a3.300 3.300 0 0 0-2 5.500 3.300 3.300 0 0 0 2.300 5.300A3.200 3.200 0 0 0 12 18.300z"/><path d="M12 5.200a3.200 3.200 0 0 1 5.800 1.700 3.300 3.300 0 0 1 2 5.500 3.300 3.300 0 0 1-2.300 5.300A3.200 3.200 0 0 1 12 18.300"/>',
  layers: '<path d="M12 4l8.500 4.300L12 12.600 3.500 8.300zM3.500 12.300l8.500 4.300 8.500-4.300M3.500 16l8.500 4.300 8.500-4.300"/>',
  euro: '<path d="M18 6.800a6.600 6.600 0 1 0 0 10.400M4 10.500h9M4 13.500h9"/>',
  swipe: '<rect x="7.500" y="4" width="9" height="16" rx="2"/><path d="M2.500 12h2.500M19 12h2.500M4 10.300L2.300 12 4 13.700M20 10.300l1.700 1.700-1.700 1.700"/>',
  clip: '<rect x="5.500" y="5" width="13" height="15.500" rx="2"/><path d="M9 5V3.500h6V5M8.500 10.500h7M8.500 14h7M8.500 17.500h4"/>',
};
const DC_COL = { g: "#17996a", b: "#3b86e3", p: "#8f5ad8", o: "#e8733f", y: "#c3912a", r: "#dc4a4a", t: "#16a09a" };
const DC_LOOK = { math: ["calc", "b"], combo: ["cards", "p"], outs: ["cards", "t"], target: ["target", "g"], size: ["slider", "y"], range: ["grid", "p"], blocker: ["shield", "r"], profile: ["user", "o"], preflop: ["grid", "g"], vslimp: ["users", "o"], lez: ["book", "b"], teoria: ["book", "t"], cbet: ["bolt", "g"], cbdef: ["shield", "b"], strongest: ["crown", "y"], allin: ["flame", "r"], openfold: ["swipe", "t"], battle: ["swords", "r"], flopbtn: ["table", "g"], flopbvb: ["table", "t"], bbdef: ["shield", "p"], turn: ["bolt", "o"], live: ["users", "r"], concetti: ["bulb", "y"], hands: ["clip", "b"], herr: ["history", "r"], review: ["history", "y"], mindset: ["brain", "p"], p4bet: ["layers", "o"], bvb3: ["layers", "t"], seat: ["table", "b"], best: ["cards", "g"], betsize: ["slider", "o"], bbeuro: ["euro", "y"] };
const dcLook = id => { const [ic, c] = DC_LOOK[id] || ["target", "g"]; return { col: DC_COL[c], svg: `<span class="dc-ic" aria-hidden="true"><svg viewBox="0 0 24 24">${DC_IC[ic].replace(/(\.\d)00(?!\d)/g, "$1")}</svg></span>` }; };
const dcHead = (id, name, tag) => `<div class="dc-h">${dcLook(id).svg}<div><h3>${name}</h3>${tag ? `<span class="dc-tag">${tag}</span>` : ""}</div></div>`;
function renderFree() {
  const due = reviewDue().length;
  let h = `<div class="lbd-top"><div><b>Classifiche dei drill</b><span>Ogni risposta giusta vale 10 punti: scala la classifica della settimana e quella generale di ogni drill.</span></div><button class="btn" data-lbd="all">🏆 Classifica di tutti i drill</button></div><p style="margin:0 0 14px;color:var(--ink2)">Allena una singola abilità, 10 esercizi alla volta. Contano per i progressi ma non completano le sessioni del programma. Ogni drill si sblocca al livello del programma in cui lo impari.</p><div class="drill-grid">`;
  h += `<div class="dgroup">Sempre disponibili</div>`;
  if ((S.eggOffer || {}).nolook) h += `<div class="dcard egg-dcard"><h3>${eggIcon("obrestad", 30)} No-Look Challenge</h3><p>Sfida segreta: cinque mani con le carte coperte. Decidi solo con posizione, azioni e avversari, poi le carte si scoprono.</p><div class="row"><span class="muted" style="font-size:13px">${eggHas("obrestad") ? "Badge NO-LOOK ottenuto" : "Serve 4 su 5 per il badge"}</span><button class="btn" data-nolook="1">Gioca</button></div></div>`;
  h += `<div class="dcard dc-rev" style="--dc:${dcLook("review").col}">${dcHead("review", "Ripasso errori")}<p>${DRILLS.review.desc}</p><div class="row"><span class="muted" style="font-size:13px">${due ? due + " da ripassare oggi" : S.review.length ? S.review.length + " in coda, nessuno per oggi" : "Nessun errore in coda"}</span><button class="btn" data-free="review" ${due ? "" : "disabled"}>Ripassa</button></div></div>`;
  /* in ordine di livello di sblocco: prima quelli sempre aperti, poi NL2, NL5... con un'intestazione per livello */
  const lvOf = id => DRILL_ALWAYS.has(id) ? -1 : (drillLvl(id) ?? -1);
  let lastLv = -1;
  Object.entries(DRILLS).filter(([id, d]) => id !== "review" && !d.hidden && !(isSecretLv(lvOf(id)) && !liveOpen())).map(([id, d], k) => [id, d, k]).sort((a, b) => lvOf(a[0]) - lvOf(b[0]) || a[2] - b[2]).forEach(([id, d]) => {
    const lv = lvOf(id);
    if (lv !== lastLv) { lastLv = lv; h += `<div class="dgroup">${lv < 0 ? "Sempre disponibili" : `${LEVELS[lv].stake} · ${esc(LEVELS[lv].t)}`}</div>`; }
    const a = skillAcc(id), off = !!d.avail && !d.avail(), dl = drillAccess(id);
    const SEL = 'style="font:inherit;font-size:13px;padding:4px 6px;border-radius:6px;border:1px solid var(--line);background:var(--surface);color:var(--ink);max-width:100%"';
    const extra = id === "allin" ? `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><select id="fs-allin" aria-label="Durata" ${SEL}>${[30, 60, 90, 0].map(x => `<option value="${x}" ${x === AOF_CFG.secs ? "selected" : ""}>${aofDurLbl(x)}</option>`).join("")}</select>${[30, 60, 90, 0].some(x => recGet(aofKeyLb(x))) ? `<span class="muted" style="font-size:13px">Record: ${[30, 60, 90, 0].filter(x => recGet(aofKeyLb(x))).map(x => `${x ? x + "s" : "∞"} ${fmt(recGet(aofKeyLb(x)))}`).join(" · ")}</span>` : ""}</div>` : id === "strongest" ? `<select id="fs-strongest" aria-label="Street" ${SEL}><option value="">Tutte le street</option><option value="A:pre">Preflop</option><option value="A:post">Flop e turn</option><option value="A:river">River</option></select>` : id === "bbdef" ? `<div style="display:flex;gap:6px;flex-wrap:wrap"><select id="fm-bbdef" aria-label="Modalità" style="font:inherit;font-size:13px;padding:4px 6px;border-radius:6px;border:1px solid var(--line);background:var(--surface);color:var(--ink);max-width:100%"><option value="">Tutte le modalità</option>${Object.entries(BBD_MODES).map(([k, m]) => `<option value="${k}">${m.n}</option>`).join("")}</select><select id="ff-bbdef" aria-label="Filtro board" style="font:inherit;font-size:13px;padding:4px 6px;border-radius:6px;border:1px solid var(--line);background:var(--surface);color:var(--ink);max-width:100%">${Object.entries(BBD_FILTERS).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></div>` : id === "preflop" ? `${pcatHtml("preflop")}<select id="fs-preflop" aria-label="Spot" style="font:inherit;font-size:13px;padding:4px 6px;border-radius:6px;border:1px solid var(--line);background:var(--surface);color:var(--ink);max-width:100%"><option value="">Tutti gli spot</option><option value="g:Open">Tutti gli open</option><option value="g:Difesa del BB">Tutte le difese del BB</option><option value="g:3-bet">Tutti i 3-bet</option><option value="g:Contro un 3-bet">Tutte le difese contro 3-bet</option><option value="g:Squeeze e cold 4-bet">Tutti gli squeeze e cold 4-bet</option>${preDrillOptions(pcatGet("preflop"))}</select>` : id === "openfold" || id === "vslimp" ? pcatHtml(id) : "";
    h += `<div class="dcard ${dl.ok ? "" : "locked"}" style="--dc:${dcLook(id).col}">${dcHead(id, d.name, d.game || d.gameFree ? "Minigioco" : "")}<p>${d.desc}</p>${extra}<div class="meter"><i style="width:${a == null ? 0 : a}%"></i></div><div class="row"><span class="muted" style="font-size:13px">${off ? (id === "herr" ? "Nessun errore nelle tue mani" : "Importa prima le tue mani") : a == null ? "Mai allenato" : "Precisione " + Math.round(a) + "%"}</span><span class="drow-r">${lbdOn(id) ? `<button class="btn ghost lbd-btn" data-lbd="${id}" title="Classifica settimanale e generale" aria-label="Classifica">🏆</button>` : ""}${dl.ok ? `<button class="btn" data-free="${id}" ${off ? "disabled" : ""}>${d.game || d.gameFree ? "Gioca" : "Allena"}</button>` : `<button class="btn ghost dlock" data-flock="${id}">🔒 ${LEVELS[dl.lvl].stake}</button>`}</span></div></div>`;
  });
  $("#view").innerHTML = h + `</div>`;
}


/* ---- scheda Errori: tutti gli errori da rifare ---- */
let errBusy = false;
function hPending() { const out = []; HANDS.hands.forEach(h => (h.dec || []).forEach(d => { if (!d.an || d.an.v !== AV) out.push([h, d]); })); return out; }
function analyzeAllAsync(done) {
  if (errBusy) return; errBusy = true;
  const todo = hPending(), tot = todo.length; let i = 0;
  const step = () => {
    const t0 = Date.now();
    while (i < tot && Date.now() - t0 < 40) { hQuick(todo[i][0], todo[i][1]); i++; }
    const el = $("#errProg"); if (el) el.textContent = `Analizzo le tue mani: ${i}/${tot}`;
    if (i < tot) setTimeout(step, 0); else { errBusy = false; persistHands(); if (done) done(); }
  };
  if (tot) step(); else { errBusy = false; if (done) done(); }
}
function startCustom(label, plan) {
  if (!plan.length) return;
  run = { kind: "free", id: plan[0][0], label, plan, di: 0, qi: 0, stage: "intro", scores: [], results: [], ctx: {} };
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-selected", "false"));
  render(); window.scrollTo({ top: 0 });
}
const HSTN = ["Preflop", "Flop", "Turn", "River"];
function renderErrors() {
  const pend = hPending().length;
  const errs = hErrList(), all = HANDS.hands.reduce((a, h) => a + (h.dec || []).filter(d => d.an && d.an.v === AV && d.an.sc != null).length, 0);
  const hard = errs.filter(e => e.a.sc === 0).length, lost = errs.reduce((a, e) => a + (e.a.loss || 0), 0);
  const byType = {}; errs.forEach(e => { const k = e.a.type || "altro"; byType[k] = (byType[k] || 0) + 1; });
  const rv = {}; S.review.forEach(r => { rv[r.d] = (rv[r.d] || 0) + 1; });
  const nRev = S.review.length;
  let h = `<p style="margin:0 0 14px;color:var(--ink2)">Qui finiscono tutti gli errori: le decisioni sbagliate delle mani che hai importato e gli esercizi sbagliati nei drill. Rifalli finché li risolvi.</p>`;
  h += `<section class="next" style="margin-bottom:16px"><div><div class="eyebrow">Rifai tutto</div><h2>${errs.length + nRev ? `${errs.length + nRev} errori da rifare` : "Nessun errore in coda"}</h2><p>${errs.length} decisioni delle tue mani, ${nRev} esercizi dei drill.</p></div><div><button class="btn primary" id="errAll" ${errs.length + nRev ? "" : "disabled"}>Rifai tutti gli errori</button></div></section>`;
  h += `<div class="two"><section class="panel"><div class="eyebrow">Le tue mani</div><h3 style="margin:4px 0 8px">Errori di targetizzazione</h3>`;
  if (!HANDS.hands.length) h += `<p class="muted">Importa le tue mani nella scheda I miei dati: le analizzo e qui trovi gli errori.</p>`;
  else {
    h += pend ? `<p id="errProg" class="muted">Analizzo le tue mani: 0/${pend}</p>` : "";
    h += `<div class="hverd" style="margin:4px 0 12px"><div><span class="muted">Decisioni analizzate</span><b>${all}</b></div><div><span class="muted">Errori</span><b>${hard}</b></div><div><span class="muted">Imprecisioni</span><b>${errs.length - hard}</b></div><div><span class="muted">EV perso stimato</span><b>${bb(lost)}</b></div><div><span class="muted">Già risolti</span><b>${HANDS.hands.reduce((a, h) => a + (h.dec || []).filter(d => d.fixed).length, 0)}</b></div></div>`;
    if (errs.length) {
      h += `<div class="errtypes">${Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<div class="lh"><span>${esc(HERR[k] || "Altro")}</span><span style="display:flex;gap:8px;align-items:center"><b class="mono">${n}</b><button class="btn" data-herr="${k}" style="padding:4px 10px;font-size:13px">Rifai</button></span></div>`).join("")}</div>`;
      h += `<div style="margin-top:10px"><button class="btn primary" data-herr="">Rifai tutti gli errori delle mani (${errs.length})</button></div>`;
      const worst = errs.slice().sort((a, b) => (b.a.loss || 0) - (a.a.loss || 0)).slice(0, 8);
      h += `<h4 class="hsub">I più costosi</h4><div class="list-hands">${worst.map(e => `<div class="lh"><span>${icHand(e.h.hero)} · ${esc(e.h.pos)} · ${HSTN[e.d.st]} ${icHand(e.d.board)}<br><span class="muted" style="font-size:12.5px">${esc(HERR[e.a.type] || "")}: al tavolo ${esc(actLabel(actClass(e.d)))}${e.d.act === "bet" ? " " + pct(e.d.ratio) + "%" : ""}, meglio ${esc(e.a.best)}</span></span><span class="mono ${e.a.sc === 0 ? "" : "muted"}" style="white-space:nowrap">-${bb(e.a.loss || 0)}</span></div>`).join("")}</div>`;
    } else if (!pend) h += `<p>Nessun errore trovato nelle decisioni analizzate.</p>`;
  }
  h += `</section><section class="panel"><div class="eyebrow">I drill</div><h3 style="margin:4px 0 8px">Esercizi sbagliati</h3>`;
  if (!nRev) h += `<p class="muted">Nessun esercizio sbagliato in coda. Quando sbagli un esercizio in un drill, finisce qui.</p>`;
  else {
    h += `<p style="margin:0 0 10px;font-size:14px;color:var(--ink2)">Tutti gli esercizi sbagliati, anche quelli non ancora in scadenza nel ripasso. Una risposta giusta li fa avanzare nel ripasso dilazionato (1, 3, 7, 14 giorni).</p><div class="errtypes">`;
    h += Object.entries(rv).sort((a, b) => b[1] - a[1]).map(([d, n]) => `<div class="lh"><span>${esc(DRILLS[d] ? DRILLS[d].name : d)}</span><span style="display:flex;gap:8px;align-items:center"><b class="mono">${n}</b><button class="btn" data-rev="${d}" style="padding:4px 10px;font-size:13px">Rifai</button></span></div>`).join("");
    h += `</div><div style="margin-top:10px"><button class="btn primary" data-rev="">Rifai tutti gli esercizi sbagliati (${nRev})</button></div>`;
  }
  h += `</section></div>`;
  $("#view").innerHTML = h;
  document.querySelectorAll("[data-herr]").forEach(b => b.onclick = () => { const t = b.dataset.herr; const n = Math.min(40, hErrList(t || null).length); startCustom(`Errori · ${t ? HERR[t] : "tutte le mani"}`, [["herr", n, t ? { type: t } : {}]]); });
  document.querySelectorAll("[data-rev]").forEach(b => b.onclick = () => { const d = b.dataset.rev; const n = Math.min(40, S.review.filter(r => !d || r.d === d).length); startCustom(`Errori · ${d ? DRILLS[d].name : "tutti i drill"}`, [["review", n, { all: true, d: d || null }]]); });
  $("#errAll").onclick = () => { const p = []; if (errs.length) p.push(["herr", Math.min(40, errs.length), {}]); if (nRev) p.push(["review", Math.min(40, nRev), { all: true }]); startCustom("Rifai tutti gli errori", p); };
  if (pend && !errBusy) analyzeAllAsync(() => { if (tab === "err" && !run) renderErrors(); });
}

