/* ================= GAMIFICATION: interfaccia ================= */
function gModal(html, onMount) {
  let m = $("#gmodal"); if (m) m.remove();
  m = document.createElement("div"); m.id = "gmodal"; m.className = "gmodal";
  m.innerHTML = `<div class="gmbox" role="dialog" aria-modal="true"><button class="gmx" aria-label="Chiudi">×</button>${html}</div>`;
  document.body.appendChild(m);
  const close = () => m.remove();
  m.querySelector(".gmx").onclick = close; m.onclick = e => { if (e.target === m) close(); };
  if (onMount) onMount(m, close);
}
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-mute]"); if (!b) return; const g = gS(); g.sound = !g.sound; persistSoon(); document.querySelectorAll("[data-mute]").forEach(x => { x.innerHTML = g.sound ? GIC.sound : GIC.mute; x.title = g.sound ? "Disattiva i suoni" : "Attiva i suoni"; }); const hs = $("#gSound"); if (hs) hs.innerHTML = g.sound ? GIC.sound : GIC.mute; });
function gBindHeader() {
  document.querySelectorAll("[data-gp]").forEach(b => b.onclick = () => {
    const k = b.dataset.gp, g = gS();
    if (k === "fiches") { const L = brLevel(), bi = brBI(L), td = (g.brDays || {})[today()] || 0, up = brNeedUp(LEVELS[curLevelIdx()]); gModal(`<div style="text-align:center">${GIC.chip.replace('class="gic"', 'class="gic" style="width:52px;height:52px"')}<h3>${fmtFi(brGet())}</h3><p class="muted">${fmt(brGet() / bi, 1)} buy-in di ${L.stake} (1 buy-in = ${fmtFi(bi)}) · oggi ${fiSign(td)}${fmtFi(Math.abs(td))}</p><p style="font-size:14px;margin:6px 0 0">Le fiches misurano quanto sei bravo: le vinci con le decisioni giuste e le perdi con gli errori, come al tavolo. A ${L.stake}: risposta giusta <b>+${fmtFi(brAmt("win", bi))}</b>, imprecisa <b>${brAmt("imp", bi) ? "−" + fmtFi(-brAmt("imp", bi)) : "0 fiches"}</b>, sbagliata <b>−${fmtFi(-brAmt("loss", bi))}</b>.</p><p style="font-size:14px;margin:6px 0 0">${up ? `Per salire di limite servono <b>${fmtFi(up)}</b>. ` : ""}Sotto i ${BR_MIN} buy-in di un livello, quel livello si chiude finché non le recuperi.</p></div>`); }
    else if (k === "goal") { gModal(`<div style="text-align:center">${gMascot(gToday() >= g.goal ? "happy" : "think", 80)}<h3>${gToday()} / ${g.goal} XP oggi</h3><p style="font-size:14px;margin:6px 0 0">Gli XP misurano quanto ti alleni: li guadagni con ogni risposta, anche sbagliata, e con le missioni del giorno. Non si perdono mai.</p><p style="font-size:14px;margin:6px 0 0">${GIC.ice} Ogni 7 giorni di serie guadagni un congela serie (massimo 2): se salti un giorno, la serie non si azzera.${g.freezes ? ` Ora ne hai ${g.freezes}.` : ""}</p></div><h4 style="margin:14px 0 6px">Obiettivo di oggi</h4><div class="goalopts">${[[30, "Leggero", 5], [50, "Regolare", 10], [100, "Serio", 20], [150, "Intenso", 30], [250, "Da pro", "45+"]].map(([x, l, t]) => `<button class="goalopt ${g.goal === x ? "on" : ""}" data-goal="${x}"><b>${l}</b><span>${x} XP al giorno · ${t} minuti</span></button>`).join("")}</div>`, (m, close) => m.querySelectorAll("[data-goal]").forEach(x => x.onclick = () => { g.goal = +x.dataset.goal; persist(); close(); renderStats(); if (tab === "program" && !run) renderProgram(); })); }
    else if (k === "streak") gStreakModal();
    else if (k === "rank") setTab("progress");
    else if (k === "review") startFree("review");
  });
}
function gStreakModal() {
  const set = new Set(S.days), fr = new Set(gS().frozen || []), cells = [];
  const d = new Date(); d.setDate(d.getDate() - 27);
  for (let i = 0; i < 28; i++) { const k = dstr(d); cells.push(`<span class="scell ${set.has(k) ? (fr.has(k) ? "fz" : "on") : ""} ${k === today() ? "td" : ""}" title="${k}">${d.getDate()}</span>`); d.setDate(d.getDate() + 1); }
  gModal(`<div style="text-align:center">${GIC.flame.replace('class="gic"', 'class="gic" style="width:56px;height:56px"')}<h3>${streak()} giorni di fila</h3><p class="muted">Basta un allenamento al giorno per tenere viva la serie. Ogni 7 giorni di fila guadagni un congela serie (massimo 2).${gS().freezes ? ` Ne hai ${gS().freezes} che la proteggono.` : ""}</p></div><div class="scal">${cells.join("")}</div>`);
}
/* percorso stile Duolingo */
const UNIT_COL = ["#15925f", "#1e88e5", "#8e44ad", "#e67e22", "#c0392b", "#0f7c8a"];
function renderProgram() {
  const g = gS(), nx = nextSession(), R = gRank(), Q = gQuests(), dp = gDailyPlan(), tx = gToday();
  const ci = curLevelIdx(), sel = PROG_SEL != null && LEVELS[PROG_SEL] && lvVisible(LEVELS[PROG_SEL]) ? PROG_SEL : ci, L = LEVELS[sel], P = levelProg(L), acc = levelAccess(sel);
  const SESSV = SESS.filter(s => !isSkipped(s) && sessVisible(s)), doneAll = SESSV.filter(s => S.sessions[s.id]).length, nxL = sessLevel(nx.id);
  const chip = (lv, size, extra) => `<span class="pchip ${extra || ""}${lv.gold ? " gold" : ""}${lv.secret ? " secret" : ""}" style="--c:${lv.col};--ink:${lv.ink};--sz:${size}px"><i></i><b style="font-size:calc(var(--sz)*${lv.secret ? .2 : [.3, .3, .28, .24, .19][lv.stake.length - 2]})">${lv.stake.replace("NL", "")}</b><em>${lv.secret ? "♠" : "NL"}</em></span>`;
  /* testata */
  let h = `<div class="car"><section class="car-hero"><div class="car-hero-l"><span class="car-eye">La tua scalata</span><h2>Da NL2 a NL1000</h2>
    <p class="car-sub">Sei a <b>${LEVELS[ci].stake}</b> · livello ${ci + 1} di ${LV_MAIN} · rango <b>${esc(R.R.n)}</b></p>
    <div class="car-bar"><i style="width:${doneAll / SESSV.length * 100}%"></i></div><p class="car-small">${doneAll} sessioni su ${SESSV.length} · ${fmtFi(brGet())} · serie di ${streak()} ${streak() === 1 ? "giorno" : "giorni"}</p>
    <div class="car-cta"><button class="car-play" data-start="${nx.id}"><span>▶</span><div><small>Continua</small><b>${esc(nxL ? nxL.stake : "")} · ${esc(nx.t)}</b></div></button><button class="car-daily" id="gDaily"><small>Sessione del giorno</small><b>${planMin(dp)} min · punti deboli</b></button>${(() => { const P = gwProbToday(), r = (S.daily || {})[today() + "|" + P.id]; return `<button class="car-prob" data-gprob="${P.id}"><span>🧩</span><div><small>Problema del giorno${r && r.pid === P.id ? ` · ✔ ${r.best}/100` : ""}</small><b>${esc(P.t)}</b></div></button>`; })()}</div>${placeAvail() ? `<button class="car-place" id="gPlace"><span>🎯</span><div><small>Giochi già da tempo?</small><b>Test di piazzamento: 24 domande, sblocca fino a NL25</b></div></button>` : ""}</div>
    <div class="car-hero-r">${chip(LEVELS[ci], 150, "big")}</div></section>`;
  /* scala dei limiti */
  h += `<section class="car-ladder">${LEVELS.map((lv, i) => { if (!lvVisible(lv)) return ""; const p = levelProg(lv); return `<button class="car-step ${i === sel ? "sel" : ""} ${i === ci ? "cur" : ""} ${p.passed ? "passed" : ""} ${i > ci + 1 && !lv.secret ? "far" : ""} ${lv.secret ? "secret" + (S.liveSeen ? "" : " reveal") : ""} ${levelAccess(i).ok ? "" : "locked lk-" + levelAccess(i).why}" data-lvl="${i}" style="--p:${p.done / p.tot * 100}%;--c:${lv.col}">${chip(lv, 58)}<span class="car-step-l">${lv.stake}</span><span class="car-step-s">${p.passed ? "✔" : i === ci ? "in corso" : `${p.done}/${p.tot}`}</span></button>`; }).join(`<span class="car-link"></span>`)}</section>`;
  /* livello selezionato */
  const lvlStars = `${P.stars}/${P.max}`;
  const LS0 = lvlSess(L), Z0 = L.s.filter(x => x.zero), N0 = L.s.filter(x => !x.zero && !x.exam);
  const f0Head = `<div class="car-phase f0"><div><span class="car-eye">Fase 0 · le regole</span><b>Mai giocato? Parti da qui</b><span>5 lezioni brevi: il gioco, i punti, il tavolo, una mano dall'inizio alla fine, la notazione.</span></div><div class="car-f0btns"><button type="button" class="car-f0skip" data-f0skip="1"><small>Le conosci già?</small><b>Salta la fase 0 ›</b></button><button type="button" class="car-f0test" data-start="${F0_TEST}"><small>Non sei sicuro?</small><b>Test d'ingresso: 10 domande ›</b></button></div></div>`;
  const nlHead = `<div class="car-phase"><div><span class="car-eye">${L.stake} · il livello</span><b>${esc(L.t)}</b></div></div>`;
  let cards = LS0.map((s, k) => {
    const head = s.zero && k === 0 ? f0Head : !s.zero && LS0[k - 1] && LS0[k - 1].zero ? nlHead : "";
    const st = gStars(s.id), done = !!S.sessions[s.id], cur = s.id === nx.id;
    const drills = [...new Set(s.plan.map(([d]) => DRILLS[d] ? DRILLS[d].short : d))].slice(0, 4);
    return `${head}<button class="car-card ${done ? "done" : ""} ${cur ? "cur" : ""} ${s.exam ? "exam" : ""} ${s.zero ? "zero" : ""} ${acc.ok ? "" : "locked"}" data-start="${s.id}">
      <span class="car-card-top"><span class="car-card-n">${s.exam ? "🏆" : s.zero ? "0." + (Z0.indexOf(s) + 1) : N0.indexOf(s) + 1}</span><span class="car-card-st">${[1, 2, 3].map(q => `<i class="${q <= st ? "on" : ""}"></i>`).join("")}</span></span>
      <b class="car-card-t">${esc(s.t)}</b>
      <span class="car-card-d">${drills.map(d => `<em>${esc(d)}</em>`).join("")}</span>
      <span class="car-card-f">${s.exam ? (examTriedToday(s.id) ? "Riprova domani" : "Final table") : done ? "Completata" : cur ? "Prossima" : "Da fare"} · ${planMin(s.plan)} min</span>${s.skip && !done ? `<span class="car-skip" role="button" tabindex="0" data-skip="${s.id}" title="La conosci già? Saltala">Skip ›</span>` : ""}</button>`;
  }).join("");
  h += `<div class="car-grid"><section class="car-level" style="--c:${L.col};--ink:${L.ink}"><div class="car-lh">${chip(L, 74)}<div><span class="car-eye">Livello ${sel + 1} · ${L.stake}</span><h3>${esc(L.t)}</h3><p>${esc(L.d)}</p></div><span class="car-lstars">★ ${lvlStars}</span></div>
    ${acc.ok ? "" : tlLockBanner(acc, sel)}${L.soon ? `<div class="car-soon">🛠️ <b>Lezioni in preparazione.</b> Gli argomenti avanzati di ${L.stake} arriveranno presto; per ora trovi l'esame e le lezioni extra.</div>` : ""}<div class="car-felt"><div class="car-cards">${cards}</div></div>${(() => { const sk = L.s.filter(isSkipped); return sk.length ? `<p class="car-unskip"><button type="button" data-unskip="${sel}">Mostra di nuovo ${sk.length === 1 ? "la lezione saltata" : `le ${sk.length} lezioni saltate`}</button></p>` : ""; })()}${L.x ? (() => { const xa = xAccess(sel); return `<div class="car-extra"><h4>⭐ Lezioni extra <small>${tlSite() ? "Premium · " : ""}non servono per salire di livello</small></h4><div class="car-xgrid">${L.x.map(x => { const st = S.sessions[x.id]; return `<button class="car-xcard ${xa.ok ? "" : "locked"} ${st ? "done" : ""}" data-start="${x.id}"><b>${esc(x.t)}</b><span>${esc(x.d)}</span><em>${xa.ok ? (st ? `Migliore: ${st.best || 0}%` : "Da fare") : "🔒"} · ${planMin(x.plan)} min</em></button>`; }).join("")}</div></div>`; })() : ""}
    <div class="car-info"><div><h4>Cosa impari</h4><ul>${L.learn.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div><div><h4>Come usare lo Study</h4>${solverOk() ? `<ul>${L.study.map(x => `<li>${esc(x)}</li>`).join("")}</ul><button class="car-link-btn" data-tabgo="solver">Apri lo Study ›</button>` : `<p class="car-small">🔒 Lo Study (il Solver) si sblocca a <b>NL25</b>. Fino ad allora allenati con le lezioni e i drill del livello: sono la base per usarlo bene.</p>`}</div><div><h4>Per salire di limite</h4>${levelReqHtml(L, P)}<p class="car-small">${esc(levelGate(L))}</p>${P.passed ? `<p class="car-ok">✔ Livello superato</p>` : ""}</div></div>${acc.ok ? gwProveHtml(L) : ""}</section>`;
  /* colonna laterale */
  h += `<aside class="car-side"><section class="car-box"><span class="car-eye">Obiettivo di oggi</span><div class="car-goal"><i style="width:${Math.min(100, tx / g.goal * 100)}%"></i></div><p class="car-small">${tx} / ${g.goal} XP${tx >= g.goal ? " · obiettivo raggiunto" : ""}</p></section>
    <section class="car-box"><span class="car-eye">Missioni</span>${Q.list.map(it => { const q = QPOOL.find(x => x.id === it.id), T = q.target(g); return `<div class="car-q ${it.done ? "done" : ""}"><span>${esc(q.t(g))}</span><div class="car-goal sm"><i style="width:${Math.min(100, it.p / T * 100)}%"></i></div><b>${Math.min(it.p, T)}/${T}</b></div>`; }).join("")}</section>
    <section class="car-box"><span class="car-eye">Rango</span><div class="car-rank">${GIC.crown}<b>${esc(R.R.n)}</b></div>${R.next ? `<p class="car-small">Prossimo: <b>${esc(R.next.n)}</b> · record di ${fmtFi(R.next.xp)} (il tuo: ${fmtFi(g.brMax || brGet())}) e maestria ${String(R.next.m).replace(".", ",")} (ora ${fmtN(Math.round(R.m * 10) / 10)})</p>` : `<p class="car-small">Rango massimo.</p>`}</section>
    ${(() => { const nd = gwRevDue().length, tot = gwRevCards().length; return `<section class="car-box"><span class="car-eye">🔁 Ripasso errori</span><p class="car-small" style="margin-top:4px">${tot ? `${nd ? `<b>${nd}</b> spot da rivedere oggi` : "Niente da rivedere oggi"} · ${tot} in lista${S.revDone ? ` · ${S.revDone} imparati` : ""}.` : "Gli errori che fai in Allenati tornano qui dopo 1, 3, 7, 14 e 30 giorni, finché non li giochi giusti."}</p>${nd ? `<button class="car-gen" data-grevgo="1">Ripassa ora (${nd})</button>` : ""}</section>`; })()}
    <section class="car-box"><span class="car-eye">🧩 Problemi</span><p class="car-small" style="margin-top:4px">Una mano difficile al giorno, già impostata: il solver gioca l'avversario. Puoi generarne di nuovi quando vuoi, oppure rigiocare le tue mani da "I miei dati" con "Rigioca come problema".</p><button class="car-gen" data-gprobgen="1">✨ Genera un problema nuovo</button>${(S.genProbs || []).length ? `<span class="car-eye" style="margin-top:10px">Generati</span><div class="car-probs">${S.genProbs.slice(0, 8).map((P, k) => { const r = gwProbRes(P.id); return `<button class="car-pb ${r ? "done" : ""}" data-gprob="${P.id}" title="${esc(P.t)}"><b>✨</b><span>${esc(P.t)} · ${esc(P.board)}</span><em>${r ? r.best : ""}</em></button>`; }).join("")}</div><span class="car-eye" style="margin-top:10px">Del giorno</span>` : ""}<div class="car-probs">${GW_PROBS.map((P, k) => { const r = gwProbRes(P.id), td = P.id === gwProbToday().id; return `<button class="car-pb ${td ? "td" : ""} ${r ? "done" : ""}" data-gprob="${P.id}" title="${esc(P.t)}"><b>${k + 1}</b><span>${esc(P.t)}</span><em>${r ? r.best : td ? "oggi" : ""}</em></button>`; }).join("")}</div></section>
    <section class="car-box"><span class="car-eye">Sessione del giorno</span><div class="chips">${planChips(dp)}</div></section></aside></div></div>`;
  $("#view").innerHTML = h;
  if ($("#gPlace")) $("#gPlace").onclick = startPlacement;
  $("#gDaily").onclick = () => { const pl = gDailyPlan(); if (pl[0] && pl[0][0] === "review") { S.revDay = today(); persist(); } startCustom("Sessione del giorno", pl); };
  document.querySelectorAll("[data-lvl]").forEach(b => b.onclick = () => { PROG_SEL = +b.dataset.lvl; if (isSecretLv(PROG_SEL) && !S.liveSeen) { S.liveSeen = today(); persist(); } renderProgram(); });
  if (!solverOk()) { document.querySelectorAll(".car-prob").forEach(x => x.remove()); document.querySelectorAll("[data-gprobgen]").forEach(x => { const box = x.closest(".car-box"); if (box) box.remove(); }); }
  document.querySelectorAll("[data-tabgo]").forEach(b => b.onclick = () => setTab(b.dataset.tabgo));
  document.querySelectorAll("[data-gprob]").forEach(b => b.onclick = () => gwDailyStart(b.dataset.gprob));
  document.querySelectorAll("[data-gprobgen]").forEach(b => b.onclick = () => gwProbGen());
  document.querySelectorAll("[data-grevgo]").forEach(b => b.onclick = () => gwRevStart());
  document.querySelectorAll("[data-gpvgo]").forEach(b => b.onclick = () => gwProvaStart(b.dataset.gpvgo));
  document.querySelectorAll("[data-upgrade]").forEach(b => b.onclick = () => tlLockMsg({ why: "plan" }, +b.dataset.upgrade));
  const cs = document.querySelector(".car-step.sel"); if (cs && cs.scrollIntoView) cs.parentElement.scrollLeft = Math.max(0, cs.offsetLeft - cs.parentElement.clientWidth / 2 + 40);
  if (typeof resumeBanner === "function") resumeBanner();
}
let PROG_SEL = null;

/* schermata di fine */
function gEndScreen() {
  const g = gS(), tot = run.final, xp = run.xpRun || 0, mc = run.maxCombo || 0, secs = run.startedAt ? Math.round((Date.now() - run.startedAt) / 1000) : null;
  const st = run.kind === "session" ? gStars(run.id) : null;
  const mood = tot == null ? "happy" : tot >= 80 ? "wow" : tot >= 60 ? "happy" : "think";
  const title = run.kind === "place" ? "Test completato" : tot == null ? "Allenamento completato" : tot >= 95 ? "Lezione perfetta!" : tot >= 80 ? "Ottimo lavoro!" : tot >= 60 ? "Lezione completata" : "Completata: ripetila presto";
  let h = `<div class="endcard"><div class="endmascot">${gMascot(mood, 120)}</div><h2>${title}</h2><p class="muted" style="margin:0 0 14px">${esc(run.label)}</p>
  ${st != null ? `<div class="endstars">${[1, 2, 3].map(k => k <= st ? GIC.star : GIC.starOff).join("")}</div>` : ""}
  <div class="endtiles"><div class="et xp"><span>XP guadagnati</span><b id="xpCount">+${xp}</b></div><div class="et br ${(run.brRun || 0) < 0 ? "neg" : ""}"><span>Fiches in sessione</span><b id="brCount">${fiSign(run.brRun || 0)}${fmtFi(Math.abs(run.brRun || 0))}</b></div><div class="et acc"><span>Precisione</span><b>${tot == null ? "-" : tot + "%"}</b></div><div class="et cmb"><span>Combo massima</span><b>${mc}</b></div><div class="et tm"><span>Tempo</span><b>${secs == null ? "-" : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`}</b></div></div>
  <div class="endsk">${run.results.map(r => `<div><span>${DRILLS[r.d].short}</span><div class="meter"><i style="width:${r.score || 0}%"></i></div><b class="mono">${r.score == null ? "rivista" : r.score + "%"}</b></div>`).join("")}</div>
  <p style="margin:10px 0 0">${gToday() >= g.goal ? `${GIC.star} Obiettivo di oggi raggiunto (${gToday()} XP).` : `Oggi ${gToday()} / ${g.goal} XP.`} ${GIC.flame} Serie: <b>${streak()}</b> ${streak() === 1 ? "giorno" : "giorni"}.</p>
  ${(() => { const ds = [...new Set(run.results.map(r => lbdKey(r.d)))].filter(d => lbdOn(d)); if (!ds.length) return ""; const L = lbdState(); return `<div class="lbd-end">${ds.map(d => `<div class="lbd-sum"><span>${ds.length > 1 ? `${esc(DRILLS[d].short)} · ` : ""}questa settimana <b>${fmt(L.w[d] || 0)}</b> punti${L.s[d] ? ` · in totale ${fmt(L.s[d])}` : ""}</span><button class="btn small" data-lbd="${d}">🏆 Classifica</button></div>`).join("")}</div>`; })()}
  <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:16px"><button class="btn3d" id="back">Continua</button>${run.kind === "session" ? `<button class="btn3d alt" id="again">Ripeti per le 3 stelle</button>` : run.kind === "place" ? "" : `<button class="btn3d alt" id="againF">Ancora</button>`}</div></div>`;
  return h;
}
function gEndFx() {
  const el = $("#xpCount"), eb = $("#brCount"), target = run.xpRun || 0, tb = run.brRun || 0; if (!el) return;
  const t0 = performance.now(); const f = t => { const k = Math.min(1, (t - t0) / 900); el.textContent = "+" + Math.round(target * k); if (eb) eb.textContent = fiSign(tb * k) + fmtFi(Math.abs(tb * k)); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f);
  gSnd.done(); if ((run.final ?? 100) >= 80) gConfetti();
  const g = gS(), R = gRank();
  if (R.i > (g.rankSeen || 0)) { g.rankSeen = R.i; persist(); setTimeout(() => { gSnd.rank(); gConfetti(3000); gModal(`<div style="text-align:center">${gMascot("wow", 110)}<div class="eyebrow">Nuovo rango</div><h2 style="margin:6px 0">${esc(R.R.n)}</h2><p class="muted">${R.next ? `Prossimo traguardo: ${esc(R.next.n)}. Servono fiches e maestria: il volume da solo non basta.` : "Hai raggiunto il rango massimo."}</p></div>`); }, 1200); }
}
/* progressi: rango, XP, maestria, traguardi */
function gProgressTop() {
  const g = gS(), R = gRank();
  const days = []; const d = new Date(); d.setDate(d.getDate() - 13); for (let i = 0; i < 14; i++) { const k = dstr(d); days.push([k, g.xpDays[k] || 0, d.getDay(), (g.brDays || {})[k] || 0]); d.setDate(d.getDate() + 1); }
  const gG = g.goal, mx = Math.max(gG, ...days.map(x => x[1]));
  const wk = days.slice(7).reduce((a, x) => a + x[1], 0), pw = days.slice(0, 7).reduce((a, x) => a + x[1], 0), bw = Math.round(days.slice(7).reduce((a, x) => a + x[3], 0) * 100) / 100;
  const dn = ["D", "L", "M", "M", "G", "V", "S"];
  const bmx = g.brMax || brGet(), xpP = R.next ? Math.max(0, Math.min(1, (bmx - R.R.xp) / (R.next.xp - R.R.xp))) : 1, mP = R.next ? Math.min(1, R.m / R.next.m) : 1;
  let h = `<div class="pgrid" style="margin-bottom:16px"><section class="panel rankcard"><div class="eyebrow">Rango</div><div class="rankbig">${GIC.crown}<div><b>${esc(R.R.n)}</b><span class="muted">${(R.i + 1)}/${GRANKS.length} · ${fmtFi(brGet())} · record ${fmtFi(bmx)}</span></div></div>
  ${R.next ? `<p style="margin:10px 0 4px;font-size:14px">Verso <b>${esc(R.next.n)}</b>: servono entrambe le barre.</p><div class="goalbar"><i style="width:${xpP * 100}%"></i><span>Record di fiches ${fmtFi(bmx)} / ${fmtFi(R.next.xp)}</span></div><div class="goalbar m"><i style="width:${mP * 100}%"></i><span>Maestria media ${fmtN(Math.round(R.m * 10) / 10)} / ${String(R.next.m).replace(".", ",")}</span></div>` : `<p>Rango massimo raggiunto.</p>`}
  <div class="ranklad">${GRANKS.map((x, i) => `<span class="${i <= R.i ? "on" : ""} ${i === R.i ? "cur" : ""}" title="${esc(x.n)}: record di ${fmtFi(x.xp)}, maestria ${String(x.m).replace(".", ",")}"></span>`).join("")}</div></section>
  <section class="panel"><div class="eyebrow">XP degli ultimi 14 giorni</div><div class="xpbars">${days.map(([k, v, wd, b]) => `<div class="xb ${v >= gG ? "hit" : ""}" title="${k}: ${v} XP · ${fiSign(b)}${fmtFi(Math.abs(b))}"><i style="height:${Math.max(2, v / mx * 100)}%"></i><span>${dn[wd]}</span></div>`).join("")}<div class="xgoal" style="bottom:calc(${gG / mx * 100}% * .82 + 18px)"></div></div><p style="margin:8px 0 0;font-size:14px">Questa settimana <b>${wk} XP</b>, la scorsa ${pw} XP. ${wk > pw ? "Stai battendo la tua settimana scorsa." : pw ? `Ti mancano ${pw - wk} XP per batterla.` : ""} Fiches negli ultimi 7 giorni: <b class="${bw < 0 ? "neg" : ""}">${fiSign(bw)}${fmtFi(Math.abs(bw))}</b> (netto).</p><p class="muted" style="font-size:12.5px;margin:2px 0 0">Barra dorata: obiettivo del giorno raggiunto. Combo migliore: ${g.bestCombo}. Drill perfetti: ${g.perfect}.</p></section></div>`;
  h += `<section class="panel" style="margin-bottom:16px"><div class="eyebrow">Maestria delle abilità</div><p style="margin:4px 0 10px;font-size:14px;color:var(--ink2)">Bronzo, Argento, Oro, Platino, Leggenda: servono volume e precisione sulle ultime 40 risposte. Leggenda richiede il 93% e, nei drill a tempo, velocità da tavolo.</p>${(() => { const ids = CORE(), z = ids.filter(id => gMastery(id) === 0), cnt = {}; z.forEach(id => { const t = gNextMastery(id); cnt[t] = (cnt[t] || 0) + 1; }); const gen = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0], zz = gen && cnt[gen] >= 3 ? z.filter(id => gNextMastery(id) === gen) : [];
    return zz.length ? `<div class="mzero"><div class="mzero-h"><span class="mbadge" style="--m:${MASTERY[0].c}">0</span><div><b>Da iniziare · ${zz.length}</b><br><span class="muted" style="font-size:12.5px">${esc(gen.replace(/\s*\(ora 0%\)\.?$/, "."))}</span></div></div><div class="mzero-l">${zz.map(id => `<span>${esc(DRILLS[id].short)}</span>`).join("")}</div></div>` + (ids.length > zz.length ? `<div class="mgrid">${ids.filter(id => !zz.includes(id)).map(mcellH).join("")}</div>` : "") : `<div class="mgrid">${ids.map(mcellH).join("")}</div>`; })()}</section>`;
  h += `<section class="panel" style="margin-bottom:16px"><div class="eyebrow">Traguardi · ${Object.keys(g.badges).length}/${BADGES.length}</div><div class="bgrid">${BADGES.map(b => `<div class="badge ${g.badges[b.id] ? "on" : ""}" title="${esc(b.d)}">${g.badges[b.id] ? GIC.crown : GIC.lock}<b>${esc(b.n)}</b><span>${esc(b.d)}</span></div>`).join("")}</div></section>`;
  return h;
}
function mcellH(id) { const lv = gMastery(id), M = MASTERY[lv]; return `<div class="mcell" title="${esc(gNextMastery(id))}"><span class="mbadge" style="--m:${M.c}">${lv === 5 ? GIC.crown : lv}</span><div><b>${esc(DRILLS[id].short)}</b><br><span style="color:${M.c};font-weight:700;font-size:12.5px">${M.n}</span><div class="mpips">${[1, 2, 3, 4, 5].map(k => `<i class="${k <= lv ? "on" : ""}" style="--m:${MASTERY[k].c}"></i>`).join("")}</div><span class="muted" style="font-size:11.5px">${esc(gNextMastery(id))}</span></div></div>`; }


