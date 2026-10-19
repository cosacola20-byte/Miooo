/* ================= RUNNER ================= */
function examTriedToday(id) { return !tlTest() && ((S.examTry || {})[id] === today()); }
function startSession(id) {
  const s = sessById(id);
  if (s && s.exam && !tlTest()) {
    const L = LEVELS[s.level], miss = L ? lvlSess(L).filter(x => !x.exam && !x.f0 && gStars(x.id) < 2) : [];
    if (miss.length) { gToast(`📚 Prima dell'esame completa tutte le lezioni di ${L.stake} con almeno l'80% (★★). Ne mancano ${miss.length}: la prossima è <b>${esc(miss[0].t)}</b>.`); return; }
  }
  if (s && s.exam) {
    if (examTriedToday(id)) { gToast(`⏳ Hai già provato l'esame <b>${esc(s.t)}</b> oggi. Un tentativo al giorno: riprova domani.`); return; }
    S.examTry = { ...(S.examTry || {}), [id]: today() }; persist();
  }
  const ap = adaptPlan(s.plan);
  if (ap.plan[0] && ap.plan[0][0] === "review") { S.revDay = today(); persist(); }
  run = { kind: "session", id, label: `${(sessLevel(id) || { stake: "" }).stake} · ${s.t}`, plan: ap.plan, di: 0, qi: 0, stage: "intro", scores: [], results: [], ctx: {} };
  render(); window.scrollTo({ top: 0 });
}
/* test di piazzamento: tre blocchi (NL2, NL5, NL10). Ogni blocco superato con almeno il 75% sblocca il livello dopo, fino a NL25 */
const PLACE_PLAN = [["lez", 8, { lv: "nl2" }], ["lez", 8, { lv: "nl5" }], ["size", 8]];
const PLACE_PASS = 75;
const placeAvail = () => curLevelIdx() < PLACE_PLAN.length && !(tlSite() && tlPlan() === "premium");
function startPlacement() {
  if (!tlTest() && S.placeTry === today()) return gToast("⏳ Il test di piazzamento si può fare una volta al giorno: riprova domani.");
  S.placeTry = today(); persist();
  run = { kind: "place", id: "place", label: "Test di piazzamento", plan: PLACE_PLAN.map(x => [x[0], x[1], { ...x[2] }]), di: 0, qi: 0, stage: "intro", scores: [], results: [], ctx: {} };
  render(); window.scrollTo({ top: 0 });
}
function placeApply() {
  let n = 0; for (const r of run.results) { if (r.score != null && r.score >= PLACE_PASS) n++; else break; }
  run.placeN = n;
  const before = curLevelIdx();
  if (n > before && n > (S.place || 0)) {
    S.place = n; const L = LEVELS[n], need = BR_UP[LEVELS[n - 1].id] * BR_BI[L.id], br0 = run.brRun || 0;
    if (brGet() < need) brAdd(need - brGet());
    run.brRun = br0;
    run.placeUp = true;
  }
  persist();
}
function gF0Verdict() {
  if (!run || run.kind !== "session" || !(sessById(run.id) || {}).f0test || run.final == null) return "";
  if (run.f0ok) return `<div class="exv up"><span class="exv-eye">Test d'ingresso superato</span><h2>Le regole le sai già</h2><p>Hai fatto <b>${run.final}%</b> (serve ${F0_PASS}%): le 5 lezioni della fase 0 sono saltate e parti dalla prima lezione del NL2. Se vuoi ripassarle, le ritrovi sotto le carte del livello.</p></div>`;
  return `<div class="exv half"><span class="exv-eye">Test d'ingresso</span><h2>Meglio partire dalle regole</h2><p>Hai fatto <b>${run.final}%</b>, serve <b>${F0_PASS}%</b>. Le 5 lezioni della fase 0 sono brevi: falle una alla volta, poi passi al NL2. Puoi rifare il test quando vuoi.</p></div>`;
}
function gPlaceVerdict() {
  if (!run || run.kind !== "place") return "";
  const n = run.placeN || 0, L = LEVELS[Math.max(n, 0)], names = ["NL2", "NL5", "NL10"];
  const rows = run.results.map((r, i) => `<li class="${r.score >= PLACE_PASS ? "ok" : ""}">${r.score >= PLACE_PASS ? "✔" : "✖"} Blocco ${names[i]}: ${r.score == null ? "-" : r.score + "%"} (serve ${PLACE_PASS}%)</li>`).join("");
  if (run.placeUp) return `<div class="exv up"><span class="exv-eye">Test di piazzamento superato</span><h2>Parti da ${L.stake}</h2><p>I livelli precedenti sono sbloccati e hai ${fmtFi(brGet())}, come un bankroll da ${L.stake}. Un ripasso veloce delle lezioni precedenti resta consigliato.</p><ul class="lvreq">${rows}</ul></div>`;
  return `<div class="exv half"><span class="exv-eye">Test di piazzamento</span><h2>${n ? `Livello confermato: ${LEVELS[Math.max(n, curLevelIdx())].stake}` : "Meglio partire dalle basi"}</h2><p>${n ? "Non hai superato il livello in cui già ti trovi o oltre." : "Il blocco NL2 non è superato: segui le lezioni di NL2, sono brevi e si possono saltare facendo il test di ogni lezione."}</p><ul class="lvreq">${rows}</ul></div>`;
}
function startFree(d) {
  if (d === "silent") return silentStart();
  if (!drillAccess(d).ok) return drillLockMsg(d);
  PRE_CAT = PCAT_DRILLS.includes(d) ? pcatGet(d) : null;
  if (d === "allin") { const sel = $("#fs-allin"); AOFG = null; return aofStart(sel ? +sel.value : AOF_CFG.secs); }
  if (d === "openfold") { OFG = null; return ofStart(""); }
  if (d === "battle") return btStart();
  if (d === "strongest") { const sel = $("#fs-strongest"); SHG = null; return shStart(sel && sel.value ? sel.value.split(":")[1] : ""); }
  const n = d === "review" ? Math.min(10, reviewDue().length) : d === "hands" ? 5 : ["flopbtn", "flopbvb", "bbdef", "preflop"].includes(d) ? 25 : 10;
  if (!n) return;
  let opt = null;
  if (d === "bbdef" && $("#fm-bbdef")) { const m = $("#fm-bbdef").value, f = $("#ff-bbdef").value; opt = { mode: m || undefined, filter: f }; }
  if (d === "allin" && $("#fs-allin")) opt = { secs: +$("#fs-allin").value || AOF_CFG.secs };

  if (d === "preflop" && $("#fs-preflop") && $("#fs-preflop").value) { const v = $("#fs-preflop").value; opt = { spots: v.startsWith("g:") ? PRE.filter(p => p.g === v.slice(2)).map(p => p.id) : [v] }; }
  run = { kind: "free", id: d, label: `Drill libero · ${DRILLS[d].name}`, plan: [opt ? [d, n, opt] : [d, n]], di: 0, qi: 0, stage: "intro", scores: [], results: [], ctx: {} };
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-selected", "false"));
  render(); window.scrollTo({ top: 0 });
}
function makeQ(did) {
  for (let k = 0; k < 5; k++) {
    const p = DRILLS[did].sample(run.ctx);
    if (!p) return null;
    try { const q = DRILLS[did].build(p); q.params = p; q.skill = q.skill || did; return q; } catch (e) { console.error(e); }
  }
  return null;
}
/* nei drill i riquadri piatto/puntata diventano un tavolo da poker con le fiches */
function tlTableize(root) {
  (root || document).querySelectorAll(".potviz").forEach(pv => {
    const items = [...pv.querySelectorAll(".pv")].map(x => ({ lab: (x.querySelector("span") || {}).textContent || "", val: (x.querySelector("b") || {}).textContent || "", cls: x.className }));
    const pot = items.find(x => /\bk-pot\b/.test(x.cls)), bet = items.find(x => /\bk-bet\b/.test(x.cls)), win = items.find(x => /\bk-win\b/.test(x.cls));
    if (!pot) return;
    const mine = bet && /\bk-mine\b/.test(bet.cls), chips = n => `<span class="qchips">${Array.from({ length: n }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</span>`;
    /* se la domanda ha già un tavolo (board e mano, o il 6-max), piatto e puntata vanno su quel tavolo: mai un secondo tavolo */
    const host = pv.closest(".qcard, .bt-prob") || root || document, felt = host.querySelector(".ptbl-felt .ptbl-board"), six = host.querySelector(".p6-felt");
    if (felt || six) {
      const row = document.createElement("div"); row.className = "ptbl-potrow";
      row.innerHTML = `${chips(4)}<span class="qpot">Piatto <b>${esc(pot.val)}</b></span>${bet ? `<span class="qbet2 ${mine ? "me" : "vil"}">${chips(2)}${esc(mine ? "La tua puntata" : "Puntata")} <b>${esc(bet.val)}</b></span>` : ""}${win ? `<span class="qwin">${esc(win.lab || "Se chiami")}: ${esc(win.val)}</span>` : ""}${items.filter(x => x !== pot && x !== bet && x !== win).map(x => `<span class="qpot">${esc(x.lab)} <b>${esc(x.val)}</b></span>`).join("")}`;
      if (felt) { felt.parentElement.appendChild(row); pv.remove(); } else pv.replaceWith(row);
      return;
    }
    const betHtml = bet ? `<div class="qbet ${mine ? "me" : "vil"}">${chips(3)}<b>${esc(bet.val)}</b><small>${esc(mine ? "la tua puntata" : "puntata")}</small></div>` : "";
    const el = document.createElement("div"); el.className = "qtable";
    el.innerHTML = `<div class="qfelt"><div class="qrail"></div>
      <div class="qseat vil">${typeof gwAv === "function" ? gwAv("Avversario", true) : ""}<div><b>Avversario</b><span>${mine ? "deve decidere" : bet ? "ha puntato" : "in attesa"}</span></div></div>
      ${!mine ? betHtml : ""}
      <div class="qmid">${chips(5)}<span class="qpot">Piatto <b>${esc(pot.val)}</b></span>${win ? `<span class="qwin">Se chiami: ${esc(win.val)}</span>` : ""}</div>
      ${mine ? betHtml : ""}
      <div class="qseat hero">${typeof gMascot === "function" ? gMascot("think", 40) : ""}<div><b>Tu</b><span>${mine ? "hai puntato" : "tocca a te"}</span></div></div>
    </div>`;
    pv.replaceWith(el);
  });
}
function renderRun() {
  if (run && run.kind === "aof") return aofRender();
  if (run && run.kind === "shgame") return shRender();
  if (run && run.kind === "ofgame") return ofRender();
  if (run && run.kind === "btgame") return btRender();
  clearTimer();
  const [did, count] = run.plan[run.di] || [];
  const totalQ = run.plan.reduce((a, [, n]) => a + n, 0);
  const dpr = did && DRILLS[did].progress && (run.stage === "q" || run.stage === "fb") ? DRILLS[did].progress(run.ctx) : null;
  const doneQ = run.plan.slice(0, run.di).reduce((a, [, n]) => a + n, 0) + (dpr != null ? Math.min(1, Math.max(0, dpr)) * count : run.stage === "q" || run.stage === "fb" ? run.qi : run.stage === "dsum" ? count : 0);
  let h = `<div class="runner ${isExamRun() ? "examrun" : ""}"><div class="rbar"><div class="where"><b>${esc(run.label)}</b>${did ? (isExamRun() ? ` · Parte ${run.di + 1}/${run.plan.length}: ${did === "lez" ? "Teoria del livello" : DRILLS[did].name}` : ` · Drill ${run.di + 1}/${run.plan.length}: ${did === "lez" && run.kind === "place" ? "Teoria" : DRILLS[did].name}`) : ""}</div><div style="display:flex;gap:6px;align-items:center"><button class="gmute" data-mute="1" title="${gS().sound ? "Disattiva i suoni" : "Attiva i suoni"}" aria-label="Suoni">${gS().sound ? GIC.sound : GIC.mute}</button><button class="btn ghost" id="quit">Esci</button></div></div><div class="gbar"><div class="progress"><i style="width:${run.stage === "end" ? 100 : doneQ / totalQ * 100}%"></i></div>${fxComboPill()}<span class="xprun">${GIC.bolt}${run.xpRun || 0}</span></div>`;
  if (run.stage === "intro" && did === "lez" && run.plan[run.di][2] && run.plan[run.di][2].id && LESSONS[run.plan[run.di][2].id]) {
    const LZ = LESSONS[run.plan[run.di][2].id];
    const SV = run.kind === "session" ? SESS.filter(x => !isSkipped(x)) : [], si = SV.findIndex(x => x.id === run.id), nxs = si >= 0 ? SV[si + 1] : null;
    h += `<div class="qcard intro lescard"><div class="eyebrow">Lezione · poi ${count} domande</div><h2 style="font-size:24px">${lesNum(LZ.id) ? `<span class="lesnum">${lesNum(LZ.id)}</span> ` : ""}${esc(LZ.t)}</h2>${lesPre(LZ.id)}<div class="lesbody">${lesGloss(LZ.id, LZ.card)}</div><div class="lesgo"><button class="btn primary" id="go">Ho letto: inizia il quiz</button> <span class="kbd">Invio</span> <button class="btn ghost" id="goSkip">Lo so già: vai al test</button>${nxs ? ` <button class="btn ghost" id="goNext" title="${esc(nxs.t)}">Vai alla lezione seguente ›</button>` : ""}</div><p class="muted" style="font-size:13px;margin:8px 0 0">La lezione è completa con almeno l'80% di risposte giuste (★★). Durante il quiz puoi riaprire la scheda.</p></div>`;
    $("#view").innerHTML = h + `</div>`;
    const goL = () => { run.startedAt = run.startedAt || Date.now(); run.ctx.opt = run.plan[run.di][2] || null; const q = makeQ(did); if (!q) { skipDrill(); return; } run.q = q; run.stage = "q"; renderRun(); };
    $("#go").onclick = goL; $("#goSkip").onclick = goL;
    if ($("#goNext")) $("#goNext").onclick = () => { const a = levelAccess(nxs.level); if (!a.ok) return tlLockMsg(a, nxs.level); startSession(nxs.id); };
  } else if (run.stage === "intro" && isExamRun()) {
    /* esame: schermata d'ingresso dedicata (prima parte) e passaggio tra una parte e l'altra */
    const d = DRILLS[did], sX = SESS.find(x => x.id === run.id), Lx = LEVELS.find(L => L.s.some(x => x.id === run.id)) || LEVELS[0], li = LEVELS.indexOf(Lx), nx0 = LEVELS[li + 1], nx = nx0 && !nx0.secret ? nx0 : null;
    const need = examPass(Lx), totQ = run.plan.reduce((a, p) => a + p[1], 0), RQ = (typeof LVL_REQ !== "undefined" && LVL_REQ[Lx.id]) || {};
    const partName = p => p[0] === "lez" ? "Teoria del livello" : DRILLS[p[0]].name;
    if (run.di === 0 && run.qi === 0) {
      h += `<div class="exam-intro"><div class="exi-top"><span class="exam-badge">🏆 Esame</span><span class="exi-lv" style="--c:${Lx.col || "#f5c542"}">${esc(Lx.stake)}</span></div>
        <h2>${esc(sX ? sX.t : "Esame")}</h2><p class="exi-sub">${nx ? `Superalo per salire a <b>${esc(nx.stake)}</b>.` : "L'ultimo esame della scalata: superalo per completare il percorso fino a NL1000."} Niente lezioni né spiegazioni a metà: rispondi, il risultato arriva alla fine.</p>
        <div class="exi-stats"><div><b>${totQ}</b><small>domande</small></div><div><b>${run.plan.length}</b><small>parti</small></div><div><b>${need}%</b><small>per superarlo</small></div><div><b>20-60 s</b><small>a domanda</small></div></div>
        <ol class="exi-parts">${run.plan.map((p, i) => `<li><span>${i + 1}</span><b>${esc(partName(p))}</b><em>${p[1]} domande</em></li>`).join("")}</ol>
        <ul class="exi-rules"><li>⏱ Ogni domanda ha un tempo in base a quanto c'è da leggere (circa 30 secondi). Se finisce, conta come sbagliata.</li><li>🎯 Serve almeno il ${need}% di risposte giuste${RQ.twice ? ", in 2 giorni diversi," : ""} per superarlo.</li><li>🔁 Puoi ripeterlo quando vuoi: conta il risultato migliore.</li></ul>
        <div class="exi-go"><button class="btn primary exi-btn" id="go">Inizia l'esame</button><span class="kbd">Invio</span></div></div>`;
    } else {
      h += `<div class="exam-intro small"><div class="exi-top"><span class="exam-badge">🏆 Esame</span><span class="exi-step">Parte ${run.di + 1} di ${run.plan.length}</span></div>
        <h2>${esc(partName(run.plan[run.di]))}</h2><p class="exi-sub">${count} domande · ${esc(d.rule ? String(d.rule).replace(/<[^>]+>/g, "") : d.desc)}</p>
        <div class="exi-prog">${run.plan.map((p, i) => `<i class="${i < run.di ? "done" : i === run.di ? "cur" : ""}"></i>`).join("")}</div>
        <div class="exi-go"><button class="btn primary exi-btn" id="go">Continua l'esame</button><span class="kbd">Invio</span></div></div>`;
    }
    $("#view").innerHTML = h + `</div>`;
    $("#go").onclick = () => { run.startedAt = run.startedAt || Date.now(); run.ctx.opt = run.plan[run.di][2] || null; const q = makeQ(did); if (!q) { skipDrill(); return; } run.q = q; run.stage = "q"; renderRun(); };
  } else if (run.stage === "intro") {
    const d = DRILLS[did];
    h += `<div class="qcard intro ${isExamRun() ? "examq" : ""}">${typeof gMascot === "function" ? `<div class="dri-m">${gMascot(d.timed || d.time <= 25 ? "wow" : "think", 76)}</div>` : ""}<div class="eyebrow">${isExamRun() ? `<span class="exam-badge">🏆 Esame</span> ` : ""}Drill ${run.di + 1} di ${run.plan.length} · ${count} esercizi</div>${run.plan.length > 1 ? `<div class="dri-steps">${run.plan.map((p, i) => `<i class="${i < run.di ? "done" : i === run.di ? "cur" : ""}" title="${esc((DRILLS[p[0]] || {}).name || "")}"></i>`).join("")}</div>` : ""}<h2 style="font-size:24px">${did === "lez" && run.kind === "place" ? "Domande di teoria" : d.name}</h2><p style="margin:0;color:var(--ink2)">${did === "lez" && run.kind === "place" ? "Situazioni da risolvere, calcoli e ragionamenti presi dalle lezioni dei livelli." : d.desc}</p><div class="rule">${d.rule}</div>${isExamRun() ? `<p class="exam-tnote">⏱ Esame a tempo: ogni domanda ha da ${EXAM_T.min} a ${EXAM_T.max} secondi, in base a quanto c'è da leggere (circa 30 per una domanda normale). Se il tempo finisce, la risposta conta come sbagliata.</p>` : did === "math" || did === "combo" ? `<p class="muted" style="margin:0">Drill a tempo: ${d.time} secondi per risposta.</p>` : ""}<div><button class="btn primary" id="go">Inizia il drill</button> <span class="kbd">Invio</span></div></div>`;
    $("#view").innerHTML = h + `</div>`;
    $("#go").onclick = () => { run.startedAt = run.startedAt || Date.now(); run.ctx.opt = run.plan[run.di][2] || null; const q = makeQ(did); if (!q) { skipDrill(); return; } run.q = q; run.stage = "q"; renderRun(); };
    /* il ripasso errori è facoltativo: si può saltare */
    if (did === "review" && run.plan.length > 1 && $("#go")) {
      $("#go").insertAdjacentHTML("afterend", `<button class="btn ghost" id="skipRev" style="margin-left:8px">Salta il ripasso</button><p class="muted" style="font-size:13px;margin:8px 0 0">Il ripasso è facoltativo e compare solo nella prima sessione del giorno.</p>`);
      $("#skipRev").onclick = () => { run.plan.splice(run.di, 1); run.qi = 0; run.stage = "intro"; renderRun(); };
    }
  } else if (run.stage === "q" || run.stage === "fb") {
    const q = run.q, d = DRILLS[did];
    if (run.stage === "q" && isExamRun() && !q.examT) q.examT = examSecs(q);
    const TT = q.examT || d.time, timedQ = q.timed || !!q.examT;
    h += `<div class="qcard ${isExamRun() ? "examq" : ""}"><div class="qhead">${isExamRun() ? `<span class="exam-badge">🏆 Esame</span>` : ""}<span class="eyebrow">${isExamRun() ? `Domanda ${run.plan.slice(0, run.di).reduce((a, p) => a + p[1], 0) + run.qi + 1} di ${run.plan.reduce((a, p) => a + p[1], 0)}` : `${esc(q.title)}${q.noCount ? "" : ` · ${run.qi + 1}/${count}`}`}</span>${q.lesId && LESSONS[q.lesId] && !isExamRun() ? `<button class="lesrev" id="lesRev" title="Rileggi la scheda">📖 Scheda</button>` : ""}${timedQ && run.stage === "q" ? `<span class="timer ${q.examT ? "exam" : ""}" id="timer" title="${q.examT ? "Esame: tempo in base alla lunghezza della domanda" : ""}">${TT}s</span>` : ""}</div>${q.body}`;
    if (q.layout === "sliders") h += `<div style="margin-top:14px"><button class="btn primary" id="submitSl">Conferma la stima</button></div>`;
    else h += `<div class="opts ${q.layout || ""}">${q.opts.map((o, k) => `<button class="opt ${q.center ? "center" : ""}" data-k="${k}">${q.center ? "" : `<span class="k">${k + 1}</span>`}<span>${o.label}</span></button>`).join("")}</div>`;
    h += `<div id="fb"></div></div>`;
    $("#view").innerHTML = h + `</div>`;
    tlTableize($("#view")); qvApply($("#view"), q);
    if ($("#lesRev")) $("#lesRev").onclick = () => gModal(`<div class="lesbody"><h3 style="margin:0 0 8px">${esc(LESSONS[q.lesId].t)}</h3>${lesGloss(q.lesId, LESSONS[q.lesId].card)}</div>`);
    if (q.mount) q.mount();
    run.t0 = Date.now();
    if (q.layout === "sliders") $("#submitSl").onclick = () => answer(q.read());
    else document.querySelectorAll(".opt").forEach(b => b.onclick = () => answer(q.opts[+b.dataset.k].v, +b.dataset.k));
    if (timedQ) {
      const t0 = Date.now();
      timerId = setInterval(() => { const left = TT - Math.floor((Date.now() - t0) / 1000); const el = $("#timer"); if (el) { el.textContent = Math.max(0, left) + "s"; el.classList.toggle("low", left <= 5); } if (left <= 0) { clearTimer(); answer(undefined, -1, true); } }, 250);
    }
  } else if (run.stage === "dsum") {
    const r = run.results[run.results.length - 1], isLast = run.di >= run.plan.length - 1;
    h += `<div class="qcard"><div class="eyebrow">Drill completato</div><h2 style="font-size:22px;margin:4px 0 10px">${DRILLS[r.d].name}</h2>${r.extra || ""}${lbdOn(r.d) ? `<div class="lbd-sum"><span>Questa settimana su ${r.d === "lez" ? "quiz delle lezioni" : "questo drill"}: <b>${fmt((lbdState().w[lbdKey(r.d)]) || 0)}</b> punti</span><button class="btn small" data-lbd="${lbdKey(r.d)}">🏆 Classifica</button></div>` : ""}<div class="sumgrid"><div class="panel"><div class="big">${r.score == null ? "-" : r.score + "%"}</div><div class="muted">${r.score == null ? "decisioni rivista" : "punteggio medio"}</div></div><div class="panel"><div class="big">${r.ok}/${r.n}</div><div class="muted">risposte corrette</div></div></div>${fxTiles(r)}<p>${DRILLS[r.d].noReview && r.score != null ? "Il punteggio misura le scelte rispetto al riferimento del drill, non i risultati degli showdown." : r.score == null ? "Le decisioni senza analisi di Claude non contano nel punteggio." : r.score >= 80 ? "Ottimo: questa abilità è solida." : r.score >= 60 ? "Buono. Gli errori tornano nel ripasso nei prossimi giorni." : "Da rinforzare: gli errori tornano nel ripasso e la prossima sessione su questa abilità sarà più lunga."}</p><button class="btn primary" id="cont">${isLast ? "Vedi il riepilogo" : "Prossimo drill"}</button> <span class="kbd">Invio</span>${r.score === 100 && r.n >= 5 && !run.silent && !isExamRun() && !eggHas("ivey") ? (() => { S.eggOffer = { ...(S.eggOffer || {}), ivey: S.eggOffer && S.eggOffer.ivey || today() }; persist(); return silentOfferHtml(); })() : ""}</div>`;
    $("#view").innerHTML = h + `</div>`;
    fxSumRun(r);
    $("#cont").onclick = () => { if (isLast) finishRun(); else { run.di++; run.qi = 0; run.stage = "intro"; renderRun(); } };
  } else if (run.stage === "end") {
    h += gExamVerdict() + gPlaceVerdict() + gF0Verdict() + gEndScreen();
    $("#view").innerHTML = h + `</div>`;
    const rid = run.id, kind = run.kind;
    $("#back").onclick = () => setTab(kind === "session" || kind === "place" ? "program" : "free");
    if ($("#again")) $("#again").onclick = () => startSession(rid);
    if ($("#againF")) $("#againF").onclick = () => startFree(rid);
    if ($("#exAgain")) $("#exAgain").onclick = () => startSession(rid);
    if ($("#exProve")) $("#exProve").onclick = () => { const i = LEVELS.findIndex(L => L.s.some(x => x.id === rid)); PROG_SEL = i >= 0 ? i : null; setTab("program"); };
    gEndFx();
  }
  $("#quit").onclick = () => setTab(run?.kind === "free" ? "free" : "program");
}
function skipDrill() {
  run.results.push({ d: run.plan[run.di][0], n: 0, ok: 0, score: null });
  if (run.di >= run.plan.length - 1) finishRun(); else { run.di++; run.qi = 0; run.stage = "intro"; renderRun(); }
}
function answer(v, k, timeout) {
  if (run.stage !== "q") return;
  if (run.q && run.q.hold && !timeout) return;
  clearTimer();
  const q = run.q, ms = Date.now() - run.t0;
  let res;
  if (timeout) {
    /* tempo scaduto: conta come sbagliata; la spiegazione e la risposta giusta vengono da un'opzione corretta */
    let base = null; try { const ok = (q.opts || []).find(o => { try { return q.check(o.v).score >= 100; } catch (e) { return false; } }); base = ok ? q.check(ok.v) : q.check(v); } catch (e) { base = null; }
    res = { ...(base || { expl: "" }), score: 0, expl: `<p class="tout">⏱ <b>Tempo scaduto.</b></p>` + ((base && base.expl) || "") };
  } else res = q.check(v);
  run.stage = "fb";
  eggOnAnswer(q, res);
  if (res.score != null) {
    run.scores.push(res.score); run.lastScoreIdx = null;
    recordAnswer(q.skill, res.score, q.timed || q.skill === "math" || q.skill === "combo" ? ms : ms);
    try { lbdAdd(q.skill, res.score); } catch (e) {}
    if (q.reviewItem) reviewAnswered(q.reviewItem, res.score);
    else if (res.score < 60 && !(DRILLS[q.skill] || {}).noReview) addReview(q.skill, q.params);
  } else { run.scores.push(null); run.lastScoreIdx = run.scores.length - 1; }
  document.querySelectorAll(".opt").forEach((b, i) => {
    b.disabled = true;
    const ov = q.opts[i].v;
    if (res.correct != null && (ov === res.correct || (res.correctAll || []).includes(ov))) b.classList.add("correct");
    if (i === k && res.score != null && res.score < 100) b.classList.add(res.score > 0 ? "partial" : "wrong");
    if (i === k && res.score == null) b.classList.add("partial");
  });
  if ($("#submitSl")) $("#submitSl").hidden = true;
  if ($("#timer")) $("#timer").remove();
  const cls = res.score == null ? "mid" : res.score >= 100 ? "good" : res.score > 0 ? "mid" : "bad";
  const head = timeout ? "Tempo scaduto" : res.score == null ? "Confronto con il tavolo" : res.scoreLabel ? `Punteggio ${res.scoreLabel}` : res.score >= 100 ? gPick(GOOD_MSG) : res.score > 0 ? "Quasi" : gPick(BAD_MSG);
  /* in esame niente suoni o avvisi che rivelino se la risposta è giusta */
  let gx; if (isExamRun()) { const sv = { ok: gSnd.ok, bad: gSnd.bad, combo: gSnd.combo }, tst = gToast; gSnd.ok = gSnd.bad = gSnd.combo = () => {}; gToast = () => {}; try { gx = gOnAnswer(q, res, ms); } finally { Object.assign(gSnd, sv); gToast = tst; } } else gx = gOnAnswer(q, res, ms);
  const [, count] = run.plan[run.di];
  const last = run.qi >= count - 1 || !!q.stop;
  if (isExamRun()) {
    /* esame: nessuna correzione domanda per domanda, solo «risposta registrata»; il risultato arriva alla fine */
    document.querySelectorAll(".opt").forEach(b => { b.classList.remove("correct", "wrong", "partial"); b.disabled = true; });
    const ch = k != null && k >= 0 ? document.querySelector(`.opt[data-k="${k}"]`) : null; if (ch) ch.classList.add("examsel");
    $("#fb").innerHTML = `<div class="exam-fb ${timeout ? "tout" : ""}"><b>${timeout ? "⏱ Tempo scaduto" : "✓ Risposta registrata"}</b><small>${last ? "Fine di questa parte" : "Prossima domanda..."}</small><button class="btn small" id="nextQ">Avanti</button></div>`;
    $("#nextQ").onclick = nextQ;
    const stamp = run.qi + ":" + run.di; setTimeout(() => { if (run && run.stage === "fb" && run.qi + ":" + run.di === stamp) nextQ(); }, timeout ? 1200 : 700);
    persistSoon(); return;
  }
  fxAnswer(k, res);
  $("#fb").innerHTML = `<div class="feedback ${cls}"><div class="fbhead">${gMascot(res.score == null ? "think" : res.score >= 100 ? "happy" : res.score > 0 ? "think" : "sad", 44)}<h4>${head} <span class="muted" style="font-weight:400;font-size:13px">· ${fmt(ms / 1000, 1)} s</span></h4><span class="fbx">${gx}</span></div>${res.expl}${res.score != null && res.score < 60 && !q.reviewItem && !(DRILLS[q.skill] || {}).noReview ? `<p class="muted" style="margin-top:6px;font-size:13px">${q.skill === "hands" ? "La trovi nella scheda Errori finché non la giochi giusta." : "Tornerà nel ripasso domani e resta nella scheda Errori."}</p>` : ""}</div><div class="nextrow"><span class="kbd">Invio per continuare</span><button class="btn3d" id="nextQ">${last ? "Fine drill" : "Avanti"}</button></div>`;
  if (q.after) q.after();
  $("#nextQ").onclick = nextQ;
  if ((q.autoNext && res.score >= 100) || res.auto) { const stamp = run.qi + ":" + run.di; setTimeout(() => { if (run && run.stage === "fb" && run.qi + ":" + run.di === stamp) nextQ(); }, res.autoMs || 900); }
  if (!$("#htarget")) $("#nextQ").focus({ preventScroll: true });
  persistSoon();
}
let psT = null;
function persistSoon() { clearTimeout(psT); psT = setTimeout(persist, 1500); }
function nextQ() {
  const [did, count] = run.plan[run.di];
  run.qi++;
  if (run.qi >= count || (run.q && run.q.stop)) { closeDrill(did); return; }
  const q = makeQ(did);
  if (!q) { closeDrill(did); return; }
  run.q = q; run.stage = "q"; renderRun();
}
function closeDrill(did) {
  gOnDrillEnd(did, run.scores);
  const sc = run.scores.filter(x => x != null);
  const extra = DRILLS[did] && DRILLS[did].onEnd ? DRILLS[did].onEnd(run.ctx) : "";
  run.results.push({ d: did, n: run.scores.length, sc: run.scores.slice(), ok: sc.filter(x => x >= 100).length, score: sc.length ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length) : null, extra });
  run.scores = [];
  clearTimeout(psT); persist(); try { lbdSync(true); } catch (e) {}
  /* esame: niente riepilogo a metà (rivelerebbe il punteggio); si passa alla parte dopo, il risultato arriva alla fine */
  if (isExamRun()) { if (run.di >= run.plan.length - 1) { finishRun(); return; } run.di++; run.qi = 0; run.stage = "intro"; renderRun(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  run.stage = "dsum"; renderRun(); window.scrollTo({ top: 0, behavior: "smooth" });
}
function saveResults(partial) {
  const rs = run.results.filter(r => r.score != null && r.n);
  if (run.saved) return;
  run.saved = true;
  const n = rs.reduce((a, r) => a + r.n, 0);
  const score = n ? Math.round(rs.reduce((a, r) => a + r.score * r.n, 0) / n) : null;
  run.final = score;
  if (!run.results.length) return;
  S.history = [...S.history, { date: today(), label: run.label + (partial ? " (interrotto)" : ""), drills: run.results.map(r => ({ d: r.d, n: r.n, score: r.score })), score }].slice(-300);
  if (run.prova && !partial && score != null) { const P = gwProvaById(run.prova); if (P) gwProvaRec(P.id, score, score >= P.need); }
  if (run.kind === "place" && !partial) placeApply();
  if (run.kind === "session" && !partial && (sessById(run.id) || {}).f0test) run.f0ok = f0Apply(score);
  if (run.kind === "session" && !partial && score != null) {
    const prev = S.sessions[run.id];
    S.sessions[run.id] = { best: Math.max(prev?.best || 0, score), last: score, date: today(), attempts: (prev?.attempts || 0) + 1 };
  }
  persist();
  if (!partial) { eggCheckChan(); eggCheckUngar(); if (run.silent && score != null && score >= 80) eggUnlock("ivey", 2400); }
}
/* salta una lezione base: la carta si dissolve in polvere dorata e sparisce */
function skipLesson(id, el) {
  if ((S.skipped || {})[id]) return;
  const done = () => { S.skipped = { ...(S.skipped || {}), [id]: true }; persist(); renderProgram(); gToast("Lezione saltata. Se cambi idea, la ritrovi sotto le carte del livello."); };
  if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
  const r = el.getBoundingClientRect(), layer = document.createElement("div"); layer.className = "skip-dust"; document.body.appendChild(layer);
  const cols = ["#f5d06b", "#fff4cf", "#e9b949", "#ffffff", "#c9a227"];
  for (let i = 0; i < 80; i++) {
    const d = document.createElement("i"), x = r.left + Math.random() * r.width, y = r.top + Math.random() * r.height, sz = 4 + Math.random() * 8;
    d.style.cssText = `left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;background:${cols[i % cols.length]}`;
    layer.appendChild(d);
    const ang = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 140;
    d.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist - 60 - Math.random() * 80}px) scale(0)`, opacity: 0 }], { duration: 700 + Math.random() * 700, delay: Math.random() * 250, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
  }
  el.classList.add("car-vanish"); el.style.pointerEvents = "none";
  setTimeout(() => { layer.remove(); done(); }, 1250);
}
/* salta tutta la fase 0 in un colpo: le carte delle regole si dissolvono insieme */
function skipF0() {
  if (!f0Open()) return;
  const done = () => { S.skipped = { ...(S.skipped || {}) }; f0Sess().forEach(s => { S.skipped[s.id] = true; }); persist(); renderProgram(); gToast("Fase 0 saltata: parti dalla prima lezione del NL2. Se cambi idea, le regole le ritrovi sotto le carte del livello."); };
  const els = [...document.querySelectorAll(".car-card.zero, .car-phase.f0")];
  if (!els.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
  const layer = document.createElement("div"); layer.className = "skip-dust"; document.body.appendChild(layer);
  const cols = ["#f5d06b", "#fff4cf", "#e9b949", "#ffffff", "#c9a227"];
  els.forEach(el => {
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 36; i++) {
      const d = document.createElement("i"), x = r.left + Math.random() * r.width, y = r.top + Math.random() * r.height, sz = 4 + Math.random() * 7;
      d.style.cssText = `left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;background:${cols[i % cols.length]}`;
      layer.appendChild(d);
      const ang = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 120;
      d.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist - 60 - Math.random() * 80}px) scale(0)`, opacity: 0 }], { duration: 700 + Math.random() * 700, delay: Math.random() * 250, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
    }
    el.classList.add("car-vanish"); el.style.pointerEvents = "none";
  });
  setTimeout(() => { layer.remove(); done(); }, 1250);
}
function finishRun() { saveResults(false); run.stage = "end"; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }

