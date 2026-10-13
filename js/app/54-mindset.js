/* ================= MINDSET (Poker Training OS v7) ================= */
const LSM = "orca-mindset-v1";
const MS0 = () => ({ sessions: [], active: null, triggers: [], rule: "", ii: ["", "", ""], bank: { level: "NL25", br: "", fund: "", personal: "", spese: "", wr: "", hands: "", sd: 90 }, days: {}, sub: "sessione" });
let MS = MS0(), msTimer = null;
function msLoad() { try { const x = JSON.parse(localStorage.getItem(LSM) || "null"); if (x) MS = { ...MS0(), ...x }; } catch (e) {} }
function msSave() { const X = { ...MS }; delete X.editId; delete X.delId; delete X.newId; try { localStorage.setItem(LSM, JSON.stringify(X)); } catch (e) {} if (db) { const d = { ...X, sessions: MS.sessions.slice(-250) }; syncStamp(MS); d._u = MS._u; d._dev = DEV; writeDoc("mindset/main", d, "Diario salvato"); } }
async function msLoadDb() { if (!db) return; try { const s = await db.doc("mindset/main").get(); if (s.exists) { const r = s.data(); if (isObj(r)) { SYNC["mindset/main"].apply(r); SEEN["mindset/main"] = r._u || 0; if (r._dev !== DEV) msSave(); } } else if (MS.sessions.length) msSave(); if (tab === "mind" && !run) renderMind(); } catch (e) {} }
const MS_LEVELS = { NL10: { bi: 10, min: 40, down: 25, up: [30, 8, 50000] }, NL25: { bi: 25, min: 50, down: 30, up: [40, 7, 100000] }, NL50: { bi: 50, min: 40, down: 25, up: [30, 5, 50000] }, NL100: { bi: 100, min: 30, down: 20, up: [25, 4, 50000] }, NL200: { bi: 200, min: 30, down: 20, up: [25, 3, 30000] }, NL500: { bi: 500, min: 30, down: 20, up: [25, 2.5, 30000] } };
const MS_GATE = { NL25: { next: "NL50", hands: 100000, wr: 7, acc: 72 }, NL50: { next: "NL100", hands: 50000, wr: 5, acc: 70 }, NL100: { next: "NL200", hands: 50000, wr: 4, acc: 80 }, NL200: { next: "NL500", hands: 80000, wr: 3, acc: 85 } };
const MS_CHECK = [
  ["focus", "Focus", "Le decisioni sono ragionate o impulsive?", "Ragionate, uso il tempo", "Impulsive, autopilota"],
  ["tavoli", "Tavoli", "Ci sono ancora fish o solo reg?", "Almeno un fish per tavolo", "Solo reg, tavoli duri"],
  ["stato", "Stato", "Come sto fisicamente e mentalmente?", "Sveglio, neutrale o positivo", "Stanco, frustrato, annoiato"],
  ["spr", "SPR mentale", "Gioco la mano di adesso o penso ancora a quelle vecchie?", "Ogni mano è fresca", "Rumino su una mano di prima"],
];
const MS_TAGS = ["LEAK-FOLD", "LEAK-SIZING", "LEAK-RANGE", "TILT-", "REG-", "EXP-"];
const msNow = () => Date.now();
const msMin = ms => Math.floor(ms / 60000);
const msClock = ms => { ms = Math.max(0, ms); const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60; return `${m}:${String(s).padStart(2, "0")}`; };
function msBeep() { try { const C = window.AudioContext || window.webkitAudioContext; const c = new C(); const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 880; g.gain.value = 0.08; o.connect(g); g.connect(c.destination); o.start(); setTimeout(() => { o.stop(); c.close(); }, 450); } catch (e) {} }
function msTick() {
  const A = MS.active; if (!A) return;
  const el = $("#msClock"); const now = msNow();
  if (A.phase === "on") {
    const left = A.phaseStart + A.onMin * 60000 - now;
    if (left <= 0 && !A.beeped) { A.beeped = true; msBeep(); document.title = "Pausa! · Orca School Poker"; msSave(); if (tab === "mind" && MS.sub === "sessione") renderMind(); return; }
    if (el) el.textContent = left > 0 ? msClock(left) : "Tempo scaduto: vai in pausa";
  } else if (A.phase === "off" || A.phase === "forced") {
    const dur = A.phase === "forced" ? 15 : A.offMin, left = A.phaseStart + dur * 60000 - now;
    if (left <= 0 && !A.beeped) { A.beeped = true; msBeep(); document.title = "Check condizioni · Orca School Poker"; msSave(); }
    if (el) el.textContent = left > 0 ? msClock(left) : "Pausa finita: fai il check";
  }
}
function msStartTimer() { if (msTimer) return; msTimer = setInterval(msTick, 1000); }
/* esito del check a 4 parametri */
function msVerdict(ch, A) {
  const neg = MS_CHECK.filter(([k]) => ch[k] === "neg").length;
  const prev = (A.checks || []).slice(-1)[0];
  const sprTwice = ch.spr === "neg" && prev && prev.spr === "neg";
  if (neg >= 2) return { close: true, why: `${neg} parametri su 4 negativi: chiudi la sessione, non negoziare.` };
  if (sprTwice) return { close: true, why: "SPR mentale negativo per due pomodori di fila: stai ruminando, il cervello non elabora le mani nuove. Chiudi." };
  return { close: false, why: neg === 1 ? "3 su 4 positivi: continua con il prossimo pomodoro, con attenzione al parametro negativo." : "4 su 4 positivi: continua." };
}
function renderMind() {
  msStartTimer();
  const subs = [["sessione", "Sessione"], ["giornata", "Giornata"], ["diario", "Diario e dashboard"], ["tilt", "Tilt e regole"], ["bank", "Bankroll"], ["var", "Varianza"], ["principi", "Principi"]];
  let h = `<div class="mstabs">${subs.map(([k, l]) => `<button class="btn ${MS.sub === k ? "primary" : ""}" data-ms="${k}">${l}</button>`).join("")}</div><div id="msBody"></div>`;
  $("#view").innerHTML = h;
  document.querySelectorAll("[data-ms]").forEach(b => b.onclick = () => { MS.sub = b.dataset.ms; try { localStorage.setItem(LSM, JSON.stringify(MS)); } catch (e) {} renderMind(); });
  ({ sessione: msSession, giornata: msDay, diario: msDiary, tilt: msTilt, bank: msBank, var: msVar, principi: msPrinciples })[MS.sub]();
}
/* ---------- sessione a pomodori ---------- */
function msSession() {
  const A = MS.active, B = $("#msBody");
  if (!A) {
    const wk = [5, 6].includes(new Date().getDay());
    B.innerHTML = `<section class="panel"><div class="eyebrow">Prima di giocare</div><h3 style="margin:4px 0 10px">Prepara la sessione</h3>
    <div class="ogrid"><label class="of">Ore di sonno stanotte<input type="number" id="msSleep" min="0" max="14" step="0.5" value="8"></label><label class="of">Pomodori previsti<input type="number" id="msPlan" min="1" max="10" value="3"></label><label class="of">Minuti ON<input type="number" id="msOn" min="20" max="90" value="50"></label><label class="of">Minuti OFF<input type="number" id="msOff" min="5" max="20" value="10"></label><label class="of">Tavoli<input type="number" id="msTables" min="1" max="12" value="4"></label></div>
    <p id="msSleepW" class="owarn" hidden></p>
    <label class="of" for="msPM" style="margin-top:6px">Pre-mortem (2 minuti)${wk ? " · consigliato stasera: è weekend" : ""}: se questa sessione finisse male, cosa l'avrebbe causato?</label><textarea id="msPM" placeholder="es. ho ignorato il check condizioni, ho esteso per recuperare, ho giocato stanco"></textarea>
    <label class="of" for="msRule" style="margin-top:8px">Regola operativa del giorno: situazione → azione → sizing</label><input type="text" id="msRule" value="${esc(MS.rule || "")}" placeholder="es. Board dry con asso, BB checka turn → betto → 2/3 pot">
    <div class="rule" style="margin-top:10px">Le decisioni su quando giocare e quando smettere si basano sulle condizioni, non sul portafogli. Nessun target di profitto: il target è il volume settimanale.</div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn primary" id="msGo">Telefono in aereo: inizia il primo pomodoro</button></div></section>`;
    const sw = () => { const s = +$("#msSleep").value, w = $("#msSleepW"); if (s <= 6) { w.hidden = false; w.textContent = `Con ${s} ore di sonno la qualità delle decisioni cala di circa il 20%: mai giocare con 6 ore. Se proprio giochi, semi-deload: massimo 3 pomodori.`; $("#msPlan").value = Math.min(3, +$("#msPlan").value); } else if (s < 7.5) { w.hidden = false; w.textContent = "Sonno sotto le 8 ore: monitora il parametro Stato a ogni pausa."; } else w.hidden = true; };
    $("#msSleep").oninput = sw; sw();
    $("#msGo").onclick = () => {
      MS.rule = $("#msRule").value.trim();
      MS.active = { start: msNow(), sleep: +$("#msSleep").value, plan: Math.max(1, +$("#msPlan").value || 3), onMin: +$("#msOn").value || 50, offMin: +$("#msOff").value || 10, tables: +$("#msTables").value || 4, premortem: $("#msPM").value.trim(), rule: MS.rule, phase: "on", phaseStart: msNow(), pomo: 1, extra: 0, checks: [], events: [], overrides: 0 };
      document.title = "Orca School Poker"; msSave(); renderMind();
    };
    return;
  }
  const now = msNow(), ph = A.phase;
  let h = `<section class="panel ms-live"><div class="rbar" style="margin:0 0 8px"><div><div class="eyebrow">Sessione in corso · ${msMin(now - A.start)} min · pomodoro ${A.pomo}${A.pomo > A.plan ? ` (estensione ${A.pomo - A.plan})` : ` di ${A.plan}`}</div></div><button class="btn ghost" id="msEnd">Chiudi la sessione</button></div>`;
  if (ph === "on") {
    const over = now - A.phaseStart >= A.onMin * 60000;
    h += `<div class="ms-big ${over ? "warn" : ""}"><span>${over ? "PAUSA" : "ON"}</span><b id="msClock">${over ? "Tempo scaduto" : msClock(A.phaseStart + A.onMin * 60000 - now)}</b></div><p class="muted" style="text-align:center;margin:0 0 10px">${over ? "Alzati fisicamente, bevi 200-300 ml d'acqua, niente schermi poker e niente bankroll." : "Focus totale: zero distrazioni, ogni decisione ragionata."}</p>
    ${A.rule ? `<div class="rule">Regola del giorno: <b>${esc(A.rule)}</b></div>` : ""}
    <div style="display:flex;gap:8px;justify-content:center;margin:10px 0;flex-wrap:wrap"><button class="btn ${over ? "primary" : ""}" id="msPause">Inizia la pausa di ${A.offMin} min</button></div>`;
  } else if (ph === "off" || ph === "forced") {
    const dur = ph === "forced" ? 15 : A.offMin, left = A.phaseStart + dur * 60000 - now;
    h += `<div class="ms-big off"><span>${ph === "forced" ? "PAUSA OBBLIGATORIA" : "OFF"}</span><b id="msClock">${left > 0 ? msClock(left) : "Pausa finita"}</b></div><p class="muted" style="text-align:center;margin:0 0 10px">Alzati, bevi, stretching, guarda fuori. Tre respiri profondi. Non guardare mani né bankroll.</p>
    ${A.rule ? `<div class="rule">Priming, leggila ad alta voce: <b>${esc(A.rule)}</b></div>` : ""}`;
    const finalCheck = A.pomo >= A.plan;
    h += `<h4 class="hsub">${finalCheck ? "Check finale: estendo o chiudo?" : "Check condizioni (30 secondi)"}</h4><div class="mscheck">${MS_CHECK.map(([k, l, q, p, n]) => `<div class="msrow"><div><b>${l}</b><br><span class="muted" style="font-size:13px">${q}</span></div><div class="msbtns"><button class="btn" data-chk="${k}:pos">+ ${p}</button><button class="btn" data-chk="${k}:neg">− ${n}</button></div></div>`).join("")}</div><div id="msVerd"></div>`;
  }
  h += `</section>`;
  h += `<section class="panel" style="margin-top:14px"><div class="eyebrow">Eventi durante il gioco</div><div class="msev">
  <button class="btn" data-ev="badbeat">Bad beat / cooler</button><button class="btn" data-ev="errore">Ho fatto un errore</button><button class="btn" data-ev="3bi">Sono sotto di 3 BI</button><button class="btn" data-ev="2bi45">Ho perso 2 BI in meno di 45 min</button><button class="btn" data-ev="recupero">Sto giocando per recuperare</button><button class="btn" data-ev="noia">Noia / autopilota</button></div>
  <div id="msEvMsg"></div>${A.events.length ? `<p class="muted" style="font-size:13px;margin:8px 0 0">Registrati: ${A.events.map(e => `${esc(e.lab)} (${new Date(e.t).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })})`).join(", ")}</p>` : ""}</section>`;
  $("#msBody").innerHTML = h;
  msTick();
  if ($("#msPause")) $("#msPause").onclick = () => { A.phase = "off"; A.phaseStart = msNow(); A.beeped = false; document.title = "Orca School Poker"; msSave(); renderMind(); };
  const ch = {};
  document.querySelectorAll("[data-chk]").forEach(b => b.onclick = () => {
    const [k, v] = b.dataset.chk.split(":"); ch[k] = v;
    b.parentElement.querySelectorAll("button").forEach(x => x.classList.toggle("primary", x === b));
    if (Object.keys(ch).length < 4) return;
    const V = msVerdict(ch, A), pos = MS_CHECK.filter(([k]) => ch[k] === "pos").length, finalCheck = A.pomo >= A.plan;
    let x = "";
    if (V.close) x = `<div class="herr"><b>Chiudi la sessione.</b> ${V.why}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn primary" id="msClose">Chiudo: vai alla review rapida</button><button class="btn ghost" id="msOver">Continuo lo stesso (viene registrato come violazione)</button></div>`;
    else if (finalCheck) {
      const ext = pos >= 3 && ch.tavoli === "pos" && ch.focus === "pos" && A.extra < 2;
      x = ext ? `<div class="hok"><b>Condizioni ottime: puoi estendere.</b> Fish ai tavoli e focus alto: aggiungi un pomodoro (massimo 2 extra). Mai per recuperare.</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn primary" id="msNext">Estendo: pomodoro extra</button><button class="btn" id="msClose">Chiudo qui</button></div>` : `<div class="hok"><b>Sessione completata.</b> ${A.extra >= 2 ? "Hai già fatto 2 pomodori extra: basta per oggi." : "Per estendere servono fish ai tavoli, focus alto e almeno 3 parametri positivi."}</div><div style="margin-top:8px"><button class="btn primary" id="msClose">Vai alla review rapida</button></div>`;
    } else x = `<div class="hok">${V.why}</div><div style="margin-top:8px"><button class="btn primary" id="msNext">Inizia il pomodoro ${A.pomo + 1}</button></div>`;
    $("#msVerd").innerHTML = x;
    const rec = over => { A.checks.push({ ...ch, t: msNow(), pomo: A.pomo, close: V.close, over: !!over }); };
    if ($("#msNext")) $("#msNext").onclick = () => { rec(); if (A.pomo >= A.plan) A.extra++; A.pomo++; A.phase = "on"; A.phaseStart = msNow(); A.beeped = false; document.title = "Orca School Poker"; msSave(); renderMind(); };
    if ($("#msOver")) $("#msOver").onclick = () => { rec(true); A.overrides++; A.pomo++; A.phase = "on"; A.phaseStart = msNow(); A.beeped = false; msSave(); renderMind(); };
    if ($("#msClose")) $("#msClose").onclick = () => { rec(); A.closeWhy = V.close ? "condizioni" : finalCheck ? "fine piano" : "scelta"; msEndForm(); };
  });
  document.querySelectorAll("[data-ev]").forEach(b => b.onclick = () => {
    const k = b.dataset.ev, lab = b.textContent;
    A.events.push({ k, lab, t: msNow() });
    const M = {
      badbeat: "Registrato. Tre respiri. Se tra 5 mani ci stai ancora pensando, il tuo SPR mentale è negativo: segnalo alla prossima pausa.",
      errore: "Registrato. Decidi dopo, a mente fresca, se è LEAK (non sapevi) o TILT (sapevi e hai sbagliato). Adesso: mano successiva.",
      "3bi": "Check condizioni immediato: se 2 su 4 sono negativi chiudi, se 3 su 4 sono positivi continua con cautela. La perdita da sola può essere varianza.",
      "2bi45": "Perdita rapida: possibile tilt. Pausa obbligatoria di 15 minuti, poi check condizioni.",
      recupero: "STOP immediato. Giocare per recuperare è l'effetto tassista al suo peggio. Chiudi la sessione.",
      noia: "La noia porta all'autopilota: è tilt cognitivo. Alla prossima pausa il Focus probabilmente è negativo.",
    };
    if (k === "2bi45" || k === "3bi") { A.phase = k === "2bi45" ? "forced" : "off"; A.phaseStart = msNow(); A.beeped = false; }
    msSave();
    if (k === "recupero") { A.closeWhy = "recupero"; msEndForm(M[k]); return; }
    renderMind(); const m = $("#msEvMsg"); if (m) m.innerHTML = `<div class="${k === "badbeat" || k === "errore" || k === "noia" ? "hok" : "herr"}" style="margin-top:8px">${M[k]}</div>`;
  });
  $("#msEnd").onclick = () => { A.closeWhy = A.closeWhy || "scelta"; msEndForm(); };
}
function msEndForm(banner) {
  const A = MS.active; A.phase = "end"; A.end = A.end || msNow(); msSave();
  let h = `<section class="panel">${banner ? `<div class="herr">${esc(banner)}</div>` : ""}<div class="eyebrow">Review rapida (10-15 minuti, livello 1)</div><h3 style="margin:4px 0 6px">Salva il contesto, non analizzare</h3><p style="margin:0 0 10px;font-size:14px;color:var(--ink2)">Le 3 mani con l'EV loss più alto: tag e una riga di nota. L'analisi vera la fai domani mattina a mente fresca (Le tue mani, Solver).</p>`;
  h += [0, 1, 2].map(i => `<div class="msrev"><input type="text" id="msH${i}" placeholder="Mano ${i + 1}: es. KQ su K72, river call, pensavo che bluffasse"><select id="msT${i}"><option value="">Tag</option>${MS_TAGS.map(t => `<option>${t}</option>`).join("")}</select></div>`).join("");
  h += `<div class="ogrid" style="margin-top:10px"><label class="of">Mani giocate<input type="number" id="msHands" min="0" placeholder="es. 750"></label><label class="of">Risultato (bb)<input type="number" id="msRes" step="0.1" placeholder="es. -85"></label><label class="of">Risultato EV-adj (bb)<input type="number" id="msEV" step="0.1" placeholder="facoltativo"></label><label class="of">SQS: qualità delle decisioni 1-10<input type="number" id="msSQS" min="1" max="10" step="1" placeholder="solo il processo"></label></div>
  <label class="of" for="msDiary">Diario (3-4 righe): cosa è andato bene, tilt, decisione difficile</label><textarea id="msDiary"></textarea>
  <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn primary" id="msSaveS">Salva e chiudi</button><button class="btn ghost" id="msResume">Torna alla sessione</button></div><p id="msSErr" class="muted" style="font-size:13px"></p></section>`;
  $("#msBody").innerHTML = h;
  $("#msResume").onclick = () => { A.phase = "off"; A.phaseStart = msNow(); delete A.end; msSave(); renderMind(); };
  $("#msSaveS").onclick = () => {
    const sqs = parseInt($("#msSQS").value, 10);
    if (!(sqs >= 1 && sqs <= 10)) { $("#msSErr").textContent = "Dai un voto SQS da 1 a 10: separa il processo dal risultato."; return; }
    const num = id => { const v = $(id).value.trim(); return v === "" ? null : +v; };
    const S = { id: A.start, date: dstr(new Date(A.start)), start: A.start, end: A.end, min: msMin(A.end - A.start), pomos: A.pomo, plan: A.plan, extra: A.extra, sleep: A.sleep, tables: A.tables, premortem: A.premortem, rule: A.rule, checks: A.checks, events: A.events, overrides: A.overrides, closeWhy: A.closeWhy,
      hands: num("#msHands"), res: num("#msRes"), ev: num("#msEV"), sqs, diary: $("#msDiary").value.trim(), review: [0, 1, 2].map(i => ({ txt: $("#msH" + i).value.trim(), tag: $("#msT" + i).value })).filter(r => r.txt || r.tag) };
    MS.sessions = [...MS.sessions, S].slice(-400); MS.active = null; document.title = "Orca School Poker"; if ((S.checks || []).length) { gQuestEv("mind", 1); persist(); }
    msSave(); MS.sub = "diario"; renderMind();
  };
}
/* ---------- giornata (checklist + sonno flessibile) ---------- */
const MS_DAY = [["12:00", "Sveglia, 500 ml d'acqua, stretching"], ["12:15", "Meditazione 10 min e obiettivo del giorno"], ["12:30", "Ripasso adattivo: Ripasso errori di Orca School Poker, max 3 spot"], ["12:50", "Retrieval practice: 5 domande senza riferimenti"], ["13:10", "Fase A: previsione scritta 5 min"], ["13:15", "Fase B: blocco 1 (40 min), pausa 5, blocco 2 (30 min)"], ["14:30", "Fase C (5 errori, LEAK o TILT) e Fase D (correzione)"], ["14:55", "Regola operativa e SE-ALLORA del giorno"], ["15:00", "Calisthenics (se in programma)"], ["16:15", "Studio approfondito e review profonda delle mani di ieri"], ["17:00", "Pre-mortem, prep sessione, telefono in aereo"], ["17:30", "Sessione 1: 3 pomodori con check"], ["20:00", "Pausa cena: zero poker"], ["21:00", "Sessione 2 (peak hours): 3 pomodori con check"], ["00:00", "Check finale: estendo solo se le condizioni sono ottime"], ["dopo", "Review rapida 10-15 min, diario e SQS"], ["04:00", "A letto: 8 ore, niente schermi 30 min prima"]];
function msDay() {
  const d = today(), D = MS.days[d] || (MS.days[d] = { done: {} });
  const last = MS.sessions[MS.sessions.length - 1];
  let shift = 0, note = "";
  if (last) { const e = new Date(last.end), hr = e.getHours() + e.getMinutes() / 60, sameNight = (Date.now() - last.end) < 20 * 3600000; if (sameNight && hr >= 2 && hr < 12) { shift = hr < 4 ? 2 : 4; note = `Ieri hai chiuso alle ${e.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}: oggi tutto scala di ${shift} ore (sonno flessibile). ${shift === 4 ? "Oltre le 4: giornata di semi-deload, massimo 3 pomodori." : ""}`; } else if (sameNight && hr >= 0.5 && hr < 2) { shift = 1.5; note = "Ieri hai chiuso dopo mezzanotte e mezza: schedule spostata di 1,5 ore."; } }
  const sh = t => { if (!/^\d/.test(t) || !shift) return t; const [H, M] = t.split(":").map(Number); const x = (H * 60 + M + shift * 60) % 1440; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };
  const isMon = new Date().getDay() === 1;
  let h = `<section class="panel"><div class="eyebrow">Checklist di oggi · ${d}</div>${note ? `<p class="owarn">${esc(note)}</p>` : ""}${isMon ? `<p class="hok">Lunedì: giorno di riposo. Rileggi le note, niente drill, zero poker.</p>` : ""}<div class="msday">${MS_DAY.map(([t, l], i) => `<label class="msdi ${D.done[i] ? "done" : ""}"><input type="checkbox" data-dd="${i}" ${D.done[i] ? "checked" : ""}><span class="mono">${sh(t)}</span><span>${esc(l)}</span></label>`).join("")}</div><p class="muted" style="font-size:13px;margin:8px 0 0">${Object.values(D.done).filter(Boolean).length}/${MS_DAY.length} fatte. MAI saltare le pause, la cena, il check condizioni. MAI estendere per recuperare, MAI sacrificare il sonno.</p></section>`;
  $("#msBody").innerHTML = h;
  document.querySelectorAll("[data-dd]").forEach(c => c.onchange = () => { D.done[c.dataset.dd] = c.checked; c.closest(".msdi").classList.toggle("done", c.checked); msSave(); });
}
/* ---------- diario e dashboard ---------- */
function msDiary() {
  const L = MS.sessions.slice().reverse(), wk = MS.sessions.filter(s => Date.now() - s.start < 7 * 86400000);
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const sqsW = avg(wk.map(s => s.sqs)), checks = wk.flatMap(s => s.checks || []), sprNeg = checks.length ? checks.filter(c => c.spr === "neg").length / checks.length : null;
  const tags = wk.flatMap(s => (s.review || []).map(r => r.tag)).filter(Boolean), tiltP = tags.length ? tags.filter(t => t === "TILT-").length / tags.length : null;
  const ext = wk.reduce((a, s) => a + (s.extra || 0), 0), early = wk.filter(s => s.closeWhy === "condizioni").length, viol = wk.reduce((a, s) => a + (s.overrides || 0), 0) + wk.filter(s => s.closeWhy === "recupero").length;
  const hands = wk.reduce((a, s) => a + (s.hands || 0), 0), sleep = avg(wk.map(s => s.sleep).filter(x => x != null));
  const res = wk.filter(s => s.res != null), bbW = res.reduce((a, s) => a + s.res, 0), hW = res.reduce((a, s) => a + (s.hands || 0), 0), wr = hW ? bbW / hW * 100 : null;
  const light = (v, g, y) => v == null ? "" : v >= g ? "good" : v >= y ? "mid" : "bad";
  const lightR = (v, g, y) => v == null ? "" : v <= g ? "good" : v <= y ? "mid" : "bad";
  let h = `<section class="panel"><div class="eyebrow">Dashboard ultimi 7 giorni</div><div class="msdash">
  <div class="${light(sqsW, 7, 5.5)}"><span>SQS medio</span><b>${sqsW == null ? "-" : fmtN(Math.round(sqsW * 10) / 10)}</b></div>
  <div><span>Sessioni / pomodori</span><b>${wk.length} / ${wk.reduce((a, s) => a + (s.pomos || 0), 0)}</b></div>
  <div><span>Mani</span><b>${hands.toLocaleString("it-IT")}</b><small>target settimana 9.500-10.000</small></div>
  <div><span>WR (bb/100)</span><b>${wr == null ? "-" : fmtN(Math.round(wr * 10) / 10)}</b></div>
  <div class="${lightR(sprNeg == null ? null : sprNeg * 100, 15, 30)}"><span>SPR mentale negativo</span><b>${sprNeg == null ? "-" : Math.round(sprNeg * 100) + "%"}</b><small>dei check</small></div>
  <div class="${lightR(tiltP == null ? null : tiltP * 100, 15, 30)}"><span>Mani TILT- sul totale taggate</span><b>${tiltP == null ? "-" : Math.round(tiltP * 100) + "%"}</b><small>oltre 30% il problema non è tecnico</small></div>
  <div><span>Estensioni / chiusure anticipate</span><b>${ext} / ${early}</b></div>
  <div class="${lightR(viol, 0, 1)}"><span>Violazioni anti-tassista</span><b>${viol}</b></div>
  <div class="${light(sleep, 7.5, 6.5)}"><span>Sonno medio</span><b>${sleep == null ? "-" : fmtN(Math.round(sleep * 10) / 10) + "h"}</b></div></div>`;
  // SQS vs risultato
  if (sqsW != null && wr != null) h += `<p style="margin:10px 0 0;font-size:14.5px">${sqsW >= 7 && wr < 0 ? "<b>SQS alto e winrate negativo: è varianza.</b> Continua così, non cambiare niente." : sqsW <= 5 && wr > 0 ? "<b>SQS basso e winrate positivo: stai vincendo per fortuna.</b> È il momento più pericoloso: rientra nei protocolli." : sqsW >= 7 ? "<b>Processo solido.</b> Il risultato seguirà." : "<b>Qualità delle decisioni da alzare.</b> Più rigore nel check condizioni e nelle pause."}</p>`;
  // effetto tassista: durata sessioni vincenti vs perdenti
  const won = MS.sessions.filter(s => s.res != null && s.res > 0), lost = MS.sessions.filter(s => s.res != null && s.res < 0);
  if (won.length >= 3 && lost.length >= 3) { const dw = avg(won.map(s => s.min)), dl = avg(lost.map(s => s.min)); h += `<p style="margin:8px 0 0;font-size:14.5px">Durata media: sessioni vincenti ${Math.round(dw)} min, perdenti ${Math.round(dl)} min. ${dl > dw * 1.2 ? "<b>Segnale di effetto tassista:</b> giochi di più quando perdi." : dw > dl * 1.2 ? "Giochi di più quando vinci: è l'anti-tassista giusto, se le condizioni erano buone." : "Nessun effetto tassista evidente."}</p>`; }
  h += `</section>`;
  h += `<section class="panel" style="margin-top:14px"><div class="eyebrow">Diario delle sessioni</div>${L.length ? `<div class="list-hands">${L.slice(0, 60).map(s => `<details class="msses" ${MS.editId === msSid(s) || MS.delId === msSid(s) ? "open" : ""}><summary><span class="mono">${esc(s.date)}</span> · ${s.min} min · ${s.pomos} pomodori${s.extra ? ` (+${s.extra} ext)` : ""} · SQS <b>${s.sqs}</b>${s.res != null ? ` · ${s.res >= 0 ? "+" : ""}${fmtN(s.res)}bb` : ""}${s.closeWhy === "condizioni" ? ' · <span class="pill mid">chiusa per condizioni</span>' : s.closeWhy === "recupero" ? ' · <span class="pill bad">stop recupero</span>' : ""}${s.overrides ? ' · <span class="pill bad">violazione</span>' : ""}</summary>
    ${s.premortem ? `<p><b>Pre-mortem:</b> ${esc(s.premortem)}</p>` : ""}${s.rule ? `<p><b>Regola:</b> ${esc(s.rule)}</p>` : ""}${(s.checks || []).length ? `<p><b>Check:</b> ${s.checks.map(c => MS_CHECK.map(([k]) => c[k] === "neg" ? "−" : "+").join("")).join(" · ")} <span class="muted">(focus, tavoli, stato, SPR)</span></p>` : ""}${(s.events || []).length ? `<p><b>Eventi:</b> ${s.events.map(e => esc(e.lab)).join(", ")}</p>` : ""}${(s.review || []).length ? `<ul>${s.review.map(r => `<li>${r.tag ? `<span class="pill ${r.tag === "TILT-" ? "bad" : "mid"}">${esc(r.tag)}</span> ` : ""}${esc(r.txt)}</li>`).join("")}</ul>` : ""}${s.diary ? `<p><b>Diario:</b> ${esc(s.diary)}</p>` : ""}${msSesActions(s)}</details>`).join("")}</div>` : `<p class="muted">Nessuna sessione registrata. Avviane una dalla scheda Sessione, oppure aggiungila a mano.</p>`}<div class="msadd"><button class="btn ghost" data-msnew="1">+ Aggiungi una sessione a mano</button>${MS.sessions.length > 60 ? `<span class="muted">Mostro le 60 più recenti.</span>` : ""}</div></section>`;
  $("#msBody").innerHTML = h;
  msDiaryBind();
}
/* modifica ed eliminazione delle sessioni del diario */
const msSid = s => String(s.id != null ? s.id : s.start);
function msSesActions(s) {
  const id = msSid(s);
  if (MS.editId === id) {
    const f = (k, lab, type, v, extra) => `<label class="msef"><span>${lab}</span><input type="${type}" data-msf="${k}" value="${v == null ? "" : esc(String(v))}" ${extra || ""}></label>`;
    return `<div class="msedit">
      <div class="msegrid">${f("date", "Data", "date", s.date)}${f("min", "Durata (min)", "number", s.min, 'min="0" step="1"')}${f("pomos", "Pomodori", "number", s.pomos, 'min="0" step="1"')}${f("hands", "Mani giocate", "number", s.hands, 'min="0" step="1"')}${f("res", "Risultato (bb)", "number", s.res, 'step="0.1"')}${f("ev", "EV (bb)", "number", s.ev, 'step="0.1"')}${f("sqs", "SQS (1-10)", "number", s.sqs, 'min="1" max="10" step="1"')}${f("sleep", "Sonno (ore)", "number", s.sleep, 'min="0" max="14" step="0.5"')}
      <label class="msef"><span>Chiusura</span><select data-msf="closeWhy"><option value="" ${!s.closeWhy ? "selected" : ""}>Normale</option><option value="condizioni" ${s.closeWhy === "condizioni" ? "selected" : ""}>Chiusa per condizioni</option><option value="recupero" ${s.closeWhy === "recupero" ? "selected" : ""}>Stop recupero</option></select></label>
      <label class="msef"><span>Violazioni</span><input type="number" data-msf="overrides" min="0" step="1" value="${s.overrides || 0}"></label></div>
      <label class="msef wide"><span>Pre-mortem</span><input type="text" data-msf="premortem" value="${esc(s.premortem || "")}"></label>
      <label class="msef wide"><span>Regola</span><input type="text" data-msf="rule" value="${esc(s.rule || "")}"></label>
      <label class="msef wide"><span>Diario</span><textarea data-msf="diary" rows="3">${esc(s.diary || "")}</textarea></label>
      <div class="msact"><button class="btn primary" data-mssave="${id}">Salva</button><button class="btn ghost" data-msex="1">Annulla</button><span class="muted" id="msEMsg"></span></div></div>`;
  }
  return `<div class="msact"><button class="btn ghost small" data-mse="${id}">✎ Modifica</button>${MS.delId === id ? `<span class="msdelq">Eliminare questa sessione? Non si può annullare.</span><button class="btn small msdanger" data-msdy="${id}">Sì, elimina</button><button class="btn ghost small" data-msdn="1">No</button>` : `<button class="btn ghost small" data-msd="${id}">🗑 Elimina</button>`}</div>`;
}
function msDiaryBind() {
  const Q = q => document.querySelectorAll(q), rer = () => { msDiary(); };
  Q("[data-mse]").forEach(b => b.onclick = e => { e.preventDefault(); MS.editId = b.dataset.mse; MS.delId = null; rer(); });
  Q("[data-msex]").forEach(b => b.onclick = e => { e.preventDefault(); if (MS.newId === MS.editId) MS.sessions = MS.sessions.filter(x => msSid(x) !== MS.newId); MS.editId = null; MS.newId = null; rer(); });
  Q("[data-msd]").forEach(b => b.onclick = e => { e.preventDefault(); MS.delId = b.dataset.msd; MS.editId = null; rer(); });
  Q("[data-msdn]").forEach(b => b.onclick = e => { e.preventDefault(); MS.delId = null; rer(); });
  Q("[data-msdy]").forEach(b => b.onclick = e => { e.preventDefault(); const id = b.dataset.msdy; MS.sessions = MS.sessions.filter(x => msSid(x) !== id); MS._del = { ...(MS._del || {}), [id]: Date.now() }; MS.delId = null; msSave(); rer(); });
  Q("[data-msnew]").forEach(b => b.onclick = () => { const t = Date.now(), d = new Date(); d.setHours(20, 0, 0, 0); const S0 = { id: t, date: today(), start: d.getTime(), end: d.getTime() + 90 * 60000, min: 90, pomos: 3, extra: 0, sleep: null, hands: null, res: null, ev: null, sqs: 7, diary: "", review: [], checks: [], events: [], overrides: 0, closeWhy: "", manual: true }; MS.sessions = [...MS.sessions, S0]; MS.editId = String(t); MS.newId = String(t); MS.delId = null; rer(); });
  Q("[data-mssave]").forEach(b => b.onclick = e => {
    e.preventDefault();
    const id = b.dataset.mssave, s = MS.sessions.find(x => msSid(x) === id); if (!s) return;
    const box = b.closest(".msedit"), val = k => { const el = box.querySelector(`[data-msf="${k}"]`); return el ? el.value : ""; };
    const num = (k, lo, hi, int) => { const v = val(k).trim().replace(",", "."); if (v === "") return null; let n = +v; if (!isFinite(n)) return undefined; if (int) n = Math.round(n); if (lo != null) n = Math.max(lo, n); if (hi != null) n = Math.min(hi, n); return n; };
    const msg = t => { const m = $("#msEMsg"); if (m) m.textContent = t; };
    const date = val("date"); if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return msg("Data non valida.");
    const F = { min: num("min", 0, 1440, true), pomos: num("pomos", 0, 40, true), hands: num("hands", 0, 100000, true), res: num("res"), ev: num("ev"), sqs: num("sqs", 1, 10, true), sleep: num("sleep", 0, 14), overrides: num("overrides", 0, 50, true) };
    if (Object.values(F).some(v => v === undefined)) return msg("Controlla i numeri: c'è un valore non valido.");
    if (F.sqs == null) return msg("Serve l'SQS da 1 a 10.");
    const old = new Date(s.start), [y, mo, dd] = date.split("-").map(Number), st = new Date(y, mo - 1, dd, old.getHours(), old.getMinutes()).getTime();
    Object.assign(s, F, { date, start: st, end: st + (F.min || 0) * 60000, pomos: F.pomos || 0, min: F.min || 0, overrides: F.overrides || 0, closeWhy: val("closeWhy") || null, premortem: val("premortem").trim(), rule: val("rule").trim(), diary: val("diary").trim(), edited: Date.now() });
    MS.sessions.sort((a, c) => a.start - c.start);
    MS.editId = null; MS.newId = null; msSave(); rer();
  });
}
/* ---------- tilt mapping e regole ---------- */
function msTilt() {
  const T = MS.triggers.length ? MS.triggers : (MS.triggers = [0, 1, 2, 3, 4].map(() => ({ sit: "", int: 5, body: "", thought: "", cure: "", pausa: "" })));
  const evc = {}; MS.sessions.forEach(s => (s.events || []).forEach(e => evc[e.lab] = (evc[e.lab] || 0) + 1));
  let h = `<section class="panel"><div class="eyebrow">Implementation intentions della settimana</div><p style="margin:4px 0 8px;font-size:14px;color:var(--ink2)">Tre regole SE → ALLORA specifiche, scritte la domenica. Più sono concrete, più le applichi.</p>${MS.ii.map((r, i) => `<input type="text" data-ii="${i}" value="${esc(r)}" placeholder="${["SE al check della quinta pausa mi accorgo di 2 call borderline impulsivi → ALLORA chiudo la sessione", "SE l'SPR mentale è negativo → ALLORA 5 minuti extra di respirazione prima di decidere", "SE perdo un piatto grosso con una bad beat → ALLORA 3 respiri e mi siedo out una mano"][i]}" style="margin-bottom:6px">`).join("")}
  <label class="of" for="msRuleT" style="margin-top:6px">Regola operativa del giorno</label><input type="text" id="msRuleT" value="${esc(MS.rule || "")}"></section>`;
  h += `<section class="panel" style="margin-top:14px"><div class="eyebrow">Tilt mapping: i tuoi 5 trigger</div><p style="margin:4px 0 8px;font-size:14px;color:var(--ink2)">Situazione, intensità, cosa senti nel corpo, pensiero automatico, cura. Il tilt cognitivo (ruminazione, autopilota) è invisibile e costa più di quello emotivo.</p>${T.map((t, i) => `<details class="msses" ${i === 0 ? "open" : ""}><summary>Trigger ${i + 1}${t.sit ? `: ${esc(t.sit)}` : ""}${t.sit ? ` · intensità ${t.int}` : ""}</summary><div class="ogrid"><label class="of" style="grid-column:span 2">Situazione<input type="text" data-tr="${i}:sit" value="${esc(t.sit)}" placeholder="es. bad beat al river in un piatto grosso"></label><label class="of">Intensità 1-10<input type="number" min="1" max="10" data-tr="${i}:int" value="${t.int}"></label><label class="of" style="grid-column:span 2">Cosa sento nel corpo<input type="text" data-tr="${i}:body" value="${esc(t.body)}" placeholder="es. calore al viso, mascella serrata"></label><label class="of" style="grid-column:span 2">Pensiero automatico<input type="text" data-tr="${i}:thought" value="${esc(t.thought)}" placeholder="es. succede sempre a me"></label><label class="of" style="grid-column:span 2">Cura<input type="text" data-tr="${i}:cure" value="${esc(t.cure)}" placeholder="es. 3 respiri, sit out una mano, rileggo la regola"></label><label class="of" style="grid-column:span 2">La pausa pomodoro avrebbe aiutato? Come?<input type="text" data-tr="${i}:pausa" value="${esc(t.pausa)}"></label></div></details>`).join("")}</section>`;
  if (Object.keys(evc).length) h += `<section class="panel" style="margin-top:14px"><div class="eyebrow">Eventi registrati in tutte le sessioni</div><div class="list-hands">${Object.entries(evc).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<div class="lh"><span>${esc(k)}</span><b class="mono">${n}</b></div>`).join("")}</div></section>`;
  $("#msBody").innerHTML = h;
  document.querySelectorAll("[data-ii]").forEach(i => i.onchange = () => { MS.ii[+i.dataset.ii] = i.value.trim(); msSave(); });
  $("#msRuleT").onchange = e => { MS.rule = e.target.value.trim(); msSave(); };
  document.querySelectorAll("[data-tr]").forEach(i => i.onchange = () => { const [k, f] = i.dataset.tr.split(":"); MS.triggers[+k][f] = f === "int" ? Math.max(1, Math.min(10, +i.value || 5)) : i.value.trim(); msSave(); });
}
/* ---------- bankroll e varianza ---------- */
function msNorm(x) { const t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp(-x * x / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; }
function msBank() {
  const K = MS.bank, acc = overall();
  let h = `<section class="panel"><div class="eyebrow">Bankroll</div><div class="ogrid">
  <label class="of">Livello<select id="mbL">${Object.keys(MS_LEVELS).map(l => `<option ${K.level === l ? "selected" : ""}>${l}</option>`).join("")}</select></label>
  <label class="of">Bankroll poker (€)<input type="number" id="mbBR" value="${esc(K.br)}" placeholder="es. 2400"></label>
  <label class="of">Fondo emergenza (€)<input type="number" id="mbF" value="${esc(K.fund)}" placeholder="es. 400"></label>
  <label class="of">Conto personale (€)<input type="number" id="mbP" value="${esc(K.personal)}" placeholder="es. 600"></label>
  <label class="of">Spese mensili (€)<input type="number" id="mbS" value="${esc(K.spese)}"></label>
  <label class="of">WR EV-adj (bb/100)<input type="number" id="mbWR" step="0.1" value="${esc(K.wr)}" placeholder="es. 10"></label>
  <label class="of">Mani al livello<input type="number" id="mbH" value="${esc(K.hands)}" placeholder="es. 100000"></label>
  <label class="of">Deviazione standard (bb/100)<input type="number" id="mbSD" value="${esc(K.sd)}"></label></div><div id="mbOut"></div></section>`;
  $("#msBody").innerHTML = h;
  const calc = () => {
    Object.assign(K, { level: $("#mbL").value, br: $("#mbBR").value, fund: $("#mbF").value, personal: $("#mbP").value, spese: $("#mbS").value, wr: $("#mbWR").value, hands: $("#mbH").value, sd: $("#mbSD").value }); msSave();
    const L = MS_LEVELS[K.level], br = +K.br, bi = br > 0 ? br / L.bi : null, f = +K.fund, sp = +K.spese || 0, wr = K.wr === "" ? null : +K.wr, n = +K.hands || 0, sd = +K.sd || 90;
    let o = "";
    if (bi != null) {
      const st = bi >= L.min ? ["good", `${fmtN(Math.round(bi))} BI: sopra il minimo di ${L.min} BI.`] : bi >= L.down ? ["mid", `${fmtN(Math.round(bi))} BI: sotto il minimo di ${L.min} BI, zero prelievi finché non torni a ${L.min} BI.`] : ["bad", `${fmtN(Math.round(bi))} BI: sotto ${L.down} BI, scendi di livello automaticamente. Non è un fallimento, è gestione del rischio.`];
      o += `<div class="${st[0] === "bad" ? "herr" : "hok"}" style="margin-top:10px"><b>${K.level}</b> · ${st[1]}</div>`;
      const pressure = bi < L.down + 5 && f > 0 && sp > 0 && f < sp;
      if (pressure) o += `<div class="herr"><b>Protocollo bankroll sotto pressione.</b> Stop al gioco per 24 ore, niente decisioni finanziarie sotto stress. Ricostituisci il fondo emergenza prima di tornare al tavolo, poi scendi di livello se serve. Scrivi nel diario: le prossime 48 ore di gioco decidono se la spirale si ferma.</div>`;
    }
    if (f > 0 && sp > 0) o += `<p style="font-size:14.5px;margin:8px 0">Fondo emergenza: <b>${fmtN(Math.round(f / sp * 10) / 10)} mesi</b> di spese (${fmtN(f)} € con ${fmtN(sp)} € al mese).${f < sp ? " <b>Meno di un mese di spese: è la priorità, prima del poker.</b>" : ""}</p>`;
    const G = MS_GATE[K.level];
    if (G) { const ok1 = n >= G.hands, ok2 = wr != null && wr >= G.wr, ok3 = acc != null && acc >= G.acc, biN = br > 0 && MS_LEVELS[G.next] ? br / MS_LEVELS[G.next].bi : null, ok4 = biN != null && biN >= 30; o += `<h4 class="hsub">Gate per ${G.next} (non negoziabile)</h4><ul class="msgate"><li class="${ok1 ? "ok" : ""}">Mani al livello ≥ ${G.hands.toLocaleString("it-IT")}: ${n.toLocaleString("it-IT")}</li><li class="${ok2 ? "ok" : ""}">WR EV-adj ≥ ${String(G.wr).replace(".", ",")} bb/100: ${wr == null ? "-" : fmtN(wr)}</li><li class="${ok3 ? "ok" : ""}">Precisione nei drill ≥ ${G.acc}%: ${acc == null ? "-" : Math.round(acc) + "%"} (da Orca School Poker)</li><li class="${ok4 ? "ok" : ""}">Bankroll ≥ 30 buy-in di ${G.next} senza prelevare: ${biN == null ? "-" : fmtN(Math.round(biN * 10) / 10)}</li></ul><p style="font-size:14px;margin:4px 0">${ok1 && ok2 && ok3 && ok4 ? "<b>Gate superato: shot-taking.</b> 20% delle sessioni al livello superiore per 2 settimane; WR positivo su 5k mani → 50%; negativo → torni al 100% qui." : "Non ancora: sali solo quando tutti i numeri sono verdi."}</p>`; }
    if (wr != null) {
      const N = Math.max(1000, n || 30000), mu = wr * N / 100, sig = sd * Math.sqrt(N / 100), lo = mu - 1.96 * sig, hi = mu + 1.96 * sig, pl = msNorm(-mu / sig);
      const brbb = br > 0 ? br / L.bi * 100 : null, ror = brbb && wr > 0 ? Math.exp(-2 * wr * brbb / (sd * sd)) : null;
      o += `<h4 class="hsub">Varianza</h4><p style="font-size:14.5px;margin:4px 0">Su ${N.toLocaleString("it-IT")} mani con ${fmtN(wr)} bb/100 e deviazione standard ${sd}: risultato atteso <b>${fmtN(Math.round(mu))}bb</b>, intervallo al 95% da <b>${fmtN(Math.round(lo))}</b> a <b>${fmtN(Math.round(hi))}bb</b> (${fmtN(Math.round(lo / 100 * 10) / 10)} / ${fmtN(Math.round(hi / 100 * 10) / 10)} BI). Probabilità di essere in perdita: <b>${Math.round(pl * 100)}%</b>.${ror != null ? ` Risk of ruin con il bankroll attuale: <b>${ror < 0.001 ? "sotto 0,1%" : fmtN(Math.round(ror * 1000) / 10) + "%"}</b>.` : ""}</p>`;
      o += `<p class="muted" style="font-size:13px;margin:0">Quando stai perdendo: confronta WR reale ed EV-adj in HM3. Differenza sotto 2 bb/100 = sfortuna, continua. Sopra 3 bb/100 = problema tecnico. Perdi 5-10 BI a settimana: 70% studio e 30% gioco per 7 giorni. 10-15 BI: 80/20, massimo 2 tavoli e 3 pomodori.</p>`;
    }
    $("#mbOut").innerHTML = o;
  };
  document.querySelectorAll("#msBody input, #msBody select").forEach(i => i.oninput = calc); calc();
}
/* ---------- principi ---------- */
function msPrinciples() {
  const sec = (t, body) => `<details class="panel osec" style="margin-bottom:10px"><summary>${t}</summary>${body}</details>`;
  let h = sec("Pomodoro di grinding (50/10)", `<p>Dopo 45-60 minuti di decisioni sotto pressione la qualità cala senza che te ne accorga. Blocchi da 50 minuti di focus totale, 10 di pausa vera: in piedi, acqua, stretching, niente schermi poker, niente bankroll. Il primo pomodoro è il più lucido, l'ultimo è dove si nasconde il tilt. A ogni pausa: check a 4 parametri e rilettura della regola del giorno ad alta voce.</p>`)
    + sec("Anti-tassista: le 5 regole", `<ol><li>Mai un target di profitto giornaliero.</li><li>Continuare o smettere dipende solo dalle condizioni (focus, tavoli, stato, SPR mentale), mai dal risultato.</li><li>Stai vincendo e le condizioni sono buone: continua. Non esiste una cifra che non puoi sopportare di vincere.</li><li>Stai perdendo e le condizioni sono cattive: smetti subito. Domani il poker è ancora lì.</li><li>Il target è il volume settimanale di mani, non il profitto.</li></ol>`)
    + sec("Check condizioni a 4 parametri", `<div class="otable"><table><thead><tr><th>Parametro</th><th>Domanda</th><th>Positivo</th><th>Negativo</th></tr></thead><tbody>${MS_CHECK.map(([, l, q, p, n]) => `<tr><th>${l}</th><td>${q}</td><td>${p}</td><td>${n}</td></tr>`).join("")}</tbody></table></div><p>2 su 4 negativi: chiudi, non negoziare. 3 su 4 positivi: prossimo pomodoro. Il check non contiene mai quanto hai vinto o perso.</p>`)
    + sec("Stop-loss con il principio anti-tassista", `<ul><li><b>Sotto di 3 BI:</b> check immediato. 2/4 negativi chiudi, 3/4 positivi continua con cautela.</li><li><b>2 BI persi in meno di 45 minuti:</b> pausa obbligatoria di 15 minuti, poi check.</li><li><b>Giochi per recuperare:</b> stop immediato.</li><li><b>2/4 negativi per 2 pause:</b> chiudi anche se stai vincendo.</li><li><b>SPR mentale negativo per 2+ pomodori:</b> chiudi, è tilt cognitivo.</li><li><b>-10 BI in una settimana:</b> la settimana dopo 80% studio e 20% gioco.</li><li><b>Vinci e le condizioni sono ottime:</b> continua, aggiungi pomodori.</li></ul>`)
    + sec("Sonno flessibile", `<ul><li>Chiudi entro le 02:00: a letto entro le 02:30, schedule spostata di 1,5 ore.</li><li>Chiudi tra le 02:00 e le 04:00: a letto subito, sveglia naturale dopo 8 ore, tutto scala di 2-4 ore.</li><li>Dopo le 04:00: il giorno dopo è semi-deload, massimo 3 pomodori.</li><li>2 giorni di fila con shift: il terzo torni all'orario standard.</li><li>Con 6 ore di sonno la qualità decisionale cala di circa il 20%: vale più di qualsiasi pomodoro.</li></ul>`)
    + sec("Review a due livelli e SQS", `<p><b>Livello 1 (a caldo, 10-15 min):</b> solo le 3 mani con più EV loss, tag e una riga. Non analizzare, vai a dormire. <b>Livello 2 (il mattino dopo, 45 min):</b> analisi vera a mente fresca con Le tue mani e il Solver. Per le mani TILT- non serve il solver: sapevi la risposta, la domanda è perché non l'hai applicata.</p><p><b>SQS</b> = voto 1-10 alla qualità delle decisioni, non al risultato. SQS medio ≥ 7 con WR negativo = varianza. SQS ≤ 5 con WR positivo = stai vincendo per fortuna.</p>`)
    + sec("Tilt emotivo e tilt cognitivo", `<p>Il tilt emotivo (rabbia, frustrazione) si riconosce. Quello cognitivo (ruminazione, distrazione, autopilota) è invisibile e costa di più. Nella review: <b>LEAK-FOLD / LEAK-SIZING / LEAK-RANGE</b> se non sapevi la risposta (si corregge studiando), <b>TILT-</b> se la sapevi e hai agito diversamente (si corregge con pause, sonno, check). Oltre il 30% di TILT- in una sessione: il problema non è tecnico.</p>`)
    + sec("Tecniche cognitive", `<ul><li><b>Pre-mortem:</b> prima delle sessioni del weekend, 2 minuti: se finisse male, cosa l'avrebbe causato?</li><li><b>Implementation intentions:</b> 3 regole SE → ALLORA ogni domenica.</li><li><b>Interleaved practice:</b> in consolidamento (70-84%) mescola le texture; in acquisizione un board alla volta.</li><li><b>Retrieval practice:</b> 5 domande a memoria prima di studiare.</li><li><b>Priming:</b> regola del giorno ad alta voce a ogni pausa.</li><li><b>Pareto mensile:</b> riordina le priorità in base all'EV perso reale (scheda Errori).</li></ul>`)
    + sec("I sei pilastri", `<p>Base GTO solida, exploit calibrato con il nodelock, mental game robusto, grinding a pomodori, condizioni e non portafogli, sonno e recupero protetti. Nessun pilastro compensa la mancanza degli altri.</p>`);
  $("#msBody").innerHTML = h;
}
/* ---------- drill mindset ---------- */
const MIND_Q = [
  { q: "Sei sotto di 3 buy-in dopo 2 pomodori. Focus buono, tavoli con due fish, ti senti bene, non rumini. Cosa fai?", o: ["Continui: il check dice 4 su 4 positivi", "Chiudi: 3 BI è lo stop-loss", "Alzi i tavoli per recuperare"], c: 0, e: "La perdita da sola può essere varianza. Decide il check a 4 parametri, non il portafogli: 4 su 4 positivi, continui con cautela." },
  { q: "Sei sopra di 5 buy-in, ma sei stanco, i fish se ne sono andati e pensi ancora a una mano di un'ora fa. Cosa fai?", o: ["Chiudi la sessione", "Continui finché sei in vincita", "Fai un pomodoro in più per arrotondare"], c: 0, e: "Stato, tavoli e SPR mentale negativi: 3 su 4. Chiudi anche se stai vincendo: stai vincendo per fortuna, non per abilità in quel momento." },
  { q: "È mezzanotte, fine delle sessioni previste. Tavoli pieni di fish, focus alto, stai bene, sei sotto di 2 BI. Cosa fai?", o: ["Estendi di un pomodoro perché le condizioni sono ottime", "Estendi per recuperare i 2 BI", "Chiudi perché sei in perdita"], c: 0, e: "Estendi per le condizioni, mai per recuperare. Il motivo conta: se nella testa c'è 'recuperare', è effetto tassista." },
  { q: "Hai perso 2 buy-in in 35 minuti. Cosa prevede il protocollo?", o: ["Pausa obbligatoria di 15 minuti, poi check condizioni", "Chiudere subito", "Continuare, è varianza"], c: 0, e: "Perdita rapida = possibile tilt. La pausa di 15 minuti ti fa valutare lucidamente con il check." },
  { q: "Ti accorgi che stai chiamando più largo per 'riprenderti' i soldi di prima. Cosa fai?", o: ["Stop immediato", "Pausa di 10 minuti e poi riparti", "Riduci i tavoli"], c: 0, e: "Giocare per recuperare è l'effetto tassista al suo peggio: stop immediato, senza negoziare." },
  { q: "Al check il parametro SPR mentale è negativo per il secondo pomodoro di fila, gli altri tre sono positivi. Cosa fai?", o: ["Chiudi: è tilt cognitivo", "Continui: 3 su 4 sono positivi", "Fai una pausa di 5 minuti in più e continui"], c: 0, e: "SPR mentale negativo per 2+ pomodori: chiudi. Il tilt cognitivo non si vede come rabbia ma come ruminazione cronica." },
  { q: "Hai dormito 6 ore. Qual è la scelta giusta?", o: ["Non giocare, o semi-deload con massimo 3 pomodori", "Giocare normalmente con un caffè in più", "Giocare di più per compensare il tempo perso"], c: 0, e: "Con 6 ore la qualità decisionale cala di circa il 20%: costa più del volume che guadagni." },
  { q: "Ieri hai chiuso alle 03:00. A che ora riparti oggi?", o: ["Tutto scala di circa 2 ore rispetto allo standard", "Sveglia alle 12:00 come sempre", "Salti lo studio e giochi di più"], c: 0, e: "Sonno flessibile: se chiudi tra le 2 e le 4 dormi 8 ore piene e tutto il giorno dopo si sposta." },
  { q: "Settimana con SQS medio 8 e winrate -6 bb/100. Come la leggi?", o: ["Varianza: il processo è buono, continua", "Problema tecnico: ferma tutto e studia", "Devi giocare più tavoli"], c: 0, e: "SQS alto e risultato negativo = varianza. Cambia qualcosa solo se l'EV-adj conferma un problema." },
  { q: "Settimana con SQS medio 4 e winrate +12 bb/100. Come la leggi?", o: ["Pericolo: stai vincendo per fortuna", "Ottimo, stai giocando bene", "È il momento di salire di livello"], c: 0, e: "SQS basso con risultato positivo è la situazione più pericolosa: rinforza abitudini sbagliate." },
  { q: "Nella review trovi una mano in cui sapevi che la risposta era fold ma hai chiamato. Che tag metti?", o: ["TILT-", "LEAK-FOLD", "REG-"], c: 0, e: "Sapevi la risposta e hai agito diversamente: è un leak mentale. Si corregge con pause, sonno e check, non studiando lo spot." },
  { q: "Nella review trovi un fold al river che il solver chiama al 90%, e non sapevi che fosse un call. Che tag metti?", o: ["LEAK-FOLD", "TILT-", "EXP-"], c: 0, e: "Non sapevi la risposta: leak tecnico. Va nello studio dello spot (Fase D)." },
  { q: "Quando fai la review profonda delle mani della sessione?", o: ["Il mattino dopo, a mente fresca", "Subito dopo la sessione, per un'ora", "Solo la domenica"], c: 0, e: "A caldo sei esausto: 10-15 minuti per salvare il contesto. L'analisi vera la fai il giorno dopo." },
  { q: "Durante la pausa di 10 minuti cosa NON devi fare?", o: ["Guardare il bankroll e le mani appena giocate", "Bere un bicchiere d'acqua", "Rileggere la regola del giorno ad alta voce"], c: 0, e: "La pausa resetta i circuiti decisionali: niente poker, niente bankroll. Acqua, stretching e priming della regola sì." },
  { q: "Il bankroll è sceso a 28 buy-in di NL25. Cosa fai?", o: ["Scendi a NL10 automaticamente", "Resti a NL25 e giochi di più", "Sali a NL50 per recuperare in fretta"], c: 0, e: "Sotto 30 BI di NL25 si scende: è gestione del rischio, non un fallimento." },
  { q: "Downswing di 15 BI e una spesa imprevista: fondo emergenza a 250 EUR. Primo passo?", o: ["Stop al gioco per 24 ore", "Sessione lunga stasera", "Shot a un livello più alto"], c: 0, e: "Protocollo bankroll sotto pressione: niente decisioni sotto stress. Poi ricalcoli i numeri e riporti il fondo a 400 EUR." },
  { q: "Quale obiettivo è coerente con il principio anti-tassista?", o: ["Giocare 10.000 mani questa settimana", "Vincere 100 EUR al giorno", "Smettere appena vinco 2 buy-in"], c: 0, e: "Il target è il volume, mai il profitto. Il profitto è una conseguenza della qualità delle decisioni." },
  { q: "Prima della sessione del venerdì sera, cosa aggiungi?", o: ["Un pre-mortem di 2 minuti", "Un target di vincita più alto", "Più tavoli del solito"], c: 0, e: "Weekend = più fish e più tentazione di esagerare. Il pre-mortem riduce l'ottimismo cognitivo." },
  { q: "Quale regola è scritta come implementation intention?", o: ["SE all'ultima pausa ho fatto 2 call impulsivi ALLORA chiudo", "Devo giocare meglio", "Oggi niente tilt"], c: 0, e: "Formato SE situazione → ALLORA azione: specifico e applicabile. Le regole generiche si seguono molto meno." },
  { q: "Ti accorgi che le tue sessioni perdenti durano in media il doppio di quelle vincenti. Cosa indica?", o: ["Effetto tassista", "Varianza normale", "Tavoli sbagliati"], c: 0, e: "Giocare di più quando perdi è il segno tipico dell'effetto tassista: non si vede nelle stat di HM3, solo nel pattern delle sessioni." },
];
DRILLS.mindset = {
  name: "Mindset", short: "Mindset", time: 30,
  desc: "Scenari di sessione reali: check condizioni, anti-tassista, stop-loss, sonno, tag LEAK e TILT, bankroll.",
  rule: "Decidi con le condizioni, mai con il portafogli. Il check a 4 parametri è focus, tavoli, stato, SPR mentale: 2 negativi = chiudi.",
  sample(ctx) { ctx.mBag = ctx.mBag && ctx.mBag.length ? ctx.mBag : shuffle(MIND_Q.map((_, i) => i)); return { i: ctx.mBag.pop() }; },
  build({ i }) {
    const Q = MIND_Q[i], ord = shuffle(Q.o.map((_, k) => k));
    return { title: "Mindset", body: `<p class="ctx" style="font-size:16px">${esc(Q.q)}</p>`, opts: ord.map(k => ({ label: esc(Q.o[k]), v: k })), timed: false,
      check(v) { return { score: v === Q.c ? 100 : 0, correct: Q.c, expl: `<p>${esc(Q.e)}</p>` }; } };
  },
};


