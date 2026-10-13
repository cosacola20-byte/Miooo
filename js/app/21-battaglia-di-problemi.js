/* ================= BATTAGLIA DI PROBLEMI =================
   Due giocatori, gli stessi problemi nello stesso ordine, 3 minuti e 3 errori al massimo.
   Vince chi ne risolve di più. Avversario: una persona in diretta se ce n'è una che cerca nello stesso momento
   (capability room), altrimenti la partita registrata di un giocatore del tuo livello (fantasma), altrimenti un bot.
   I problemi nascono da un seme comune: con lo stesso seme i due giocatori vedono gli stessi problemi. */
const BT_CFG = { secs: 180, strikes: 3, k: 32, elo0: 1000, wait: 7000, probs: 45 };
const BT_TOPICS = { mix: ["Misto", ["preflop", "strongest", "cbdef", "outs"]], preflop: ["Preflop", ["preflop"]], strongest: ["Mano più forte", ["strongest"]], cbdef: ["Difesa dalla c-bet", ["cbdef"]] };
let BTG = null;
/* ogni modalità ha il suo punteggio, la sua classifica e le sue partite registrate */
const btTopic = () => (BTG && BT_TOPICS[BTG.topic]) ? BTG.topic : "mix";
const btKey = t => "bt" + (t || btTopic());
Object.entries(BT_TOPICS).forEach(([k, v]) => { LB_TITLE["bt" + k] = "Classifica battaglie · " + v[0]; });
DRILLS.battle = { name: "Battaglia di problemi", short: "Battaglia", time: 180, lvl: 0, noReview: true, noMix: true, noBr: true, game: true, desc: "Sfida un avversario del tuo livello: stessi problemi, 3 minuti, 3 errori. Vince chi ne risolve di più.", rule: "", sample() { return null; }, build() { return null; } };
const btElo = t => { const k = t || btTopic(), e = (S.btElos || {})[k]; return Math.round(e != null ? e : (k === "mix" && S.btElo) || BT_CFG.elo0); };
const btStatsOf = t => ((S.btStatsT || {})[t || btTopic()]) || (((t || btTopic()) === "mix" && S.btStats) || {});
/* generatore casuale con seme: durante la creazione dei problemi sostituisce Math.random */
function btRng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function btProblems(seed, topic, n) {
  const R = btRng(seed), keep = Math.random, out = [];
  Math.random = R;
  try { const list = BT_TOPICS[topic][1]; for (let i = 0; i < n; i++) { const d = list[Math.floor(R() * list.length)]; let p = null; for (let k = 0; k < 4 && !p; k++) { try { p = DRILLS[d].sample(d === "outs" ? { } : d === "strongest" ? { opt: { mode: "A" } } : {}); } catch (e) { p = null; } } if (p) out.push({ d, p }); } }
  finally { Math.random = keep; }
  return out;
}
/* ---------- avvio ---------- */
function btStart() {
  clearTimer();
  run = { kind: "btgame", id: "battle", label: "Battaglia di problemi", plan: [["battle", 1]], di: 0, qi: 0, stage: "btgame", scores: [], results: [], ctx: {} };
  BTG = { stage: "lobby", topic: (BTG && BTG.topic) || "mix" };
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-selected", "false"));
  render(); window.scrollTo({ top: 0 });
  btRoomInit();
}
/* ---------- stanza in diretta ---------- */
const BTR = { room: null, ready: null, offs: [] };
function btRoomInit() {
  if (BTR.ready) return BTR.ready;
  BTR.ready = (async () => {
    try { BTR.room = await hostUse("room"); } catch (e) { BTR.room = null; }
    if (BTR.room) {
      BTR.offs.push(BTR.room.on("bt", m => btOnMsg(m), () => {}));
      BTR.offs.push(BTR.room.onPeers(ch => btOnPeers(ch), () => {}));
    }
    return BTR;
  })();
  return BTR.ready;
}
function btPresence(obj) { if (BTR.room) BTR.room.presence({ bt: obj }).catch(() => {}); }
function btOnPeers(ch) {
  const G = BTG; if (!G) return;
  if (G.stage === "search" && !G.match) btTryPair(ch.peers);
  if (G.stage === "play" && G.mode === "live" && G.opp && ch.left.some(p => p.peer === G.opp.peer)) { G.opp.gone = true; G.opp.done = true; btCheckEnd(); btPaint(); }
}
function btTryPair(peers) {
  const G = BTG, me = peers.find(p => p.sameTab); if (!me) return;
  const cand = peers.filter(p => !p.isMe && p.kind === "viewer" && p.presence && p.presence.bt && p.presence.bt.seek === G.topic && Date.now() - (p.presence.bt.t || 0) < 60000);
  if (!cand.length) return;
  cand.sort((a, b) => Math.abs((a.presence.bt.elo || 1000) - btElo()) - Math.abs((b.presence.bt.elo || 1000) - btElo()));
  const o = cand[0];
  /* chi ha l'etichetta più piccola fa da padrone di casa e manda il via */
  if (me.peer < o.peer) {
    const seed = Math.floor(Math.random() * 2 ** 31), id = "m" + Date.now().toString(36) + Math.floor(Math.random() * 1e4), startAt = Date.now() + 3500;
    BTR.room.emit("bt", { type: "start", id, to: o.peer, seed, topic: G.topic, startAt, name: btName(), elo: btElo() }).catch(() => {});
    btBeginLive({ id, seed, startAt, opp: { peer: o.peer, name: lbName(o.presence.bt.name) || "Avversario", elo: Math.round(+o.presence.bt.elo || 1000) } });
  }
}
function btOnMsg(m) {
  const G = BTG; if (!G || m.sameTab || !m.data || typeof m.data !== "object") return;
  const d = m.data;
  if (d.type === "start" && G.stage === "search" && !G.match) {
    const me = (BTR.room.peers() || []).find(p => p.sameTab);
    if (!me || d.to !== me.peer || d.topic !== G.topic) return;
    btBeginLive({ id: String(d.id), seed: +d.seed >>> 0, startAt: Math.min(Date.now() + 5000, +d.startAt || Date.now() + 3000), opp: { peer: m.peer, name: lbName(d.name) || "Avversario", elo: Math.round(+d.elo || 1000) } });
  }
  if (G.match && d.id === G.match && m.peer === (G.opp && G.opp.peer)) {
    if (d.type === "prog") { const mk = Array.isArray(d.marks) ? d.marks.slice(0, 200).map(x => !!x) : []; G.opp.marks = mk; G.opp.score = mk.filter(Boolean).length; G.opp.strikes = mk.filter(x => !x).length; G.opp.done = !!d.done || G.opp.strikes >= BT_CFG.strikes; btCheckEnd(); btPaint(); }
    if (d.type === "quit") { G.opp.gone = true; G.opp.done = true; btCheckEnd(); btPaint(); }
  }
}
const btName = () => lbName(S.btName || S.nick || "") || "Giocatore";
function btBeginLive({ id, seed, startAt, opp }) {
  const G = BTG; G.match = id; G.mode = "live"; G.seed = seed; G.opp = { ...opp, marks: [], score: 0, strikes: 0, done: false };
  btPresence({ match: id, name: btName(), elo: btElo() });
  btSetup(startAt);
}
/* ---------- ricerca: diretta, poi fantasma, poi bot ---------- */
function btSearch() {
  const G = BTG; G.stage = "search"; G.match = null; G.searchT0 = Date.now(); btRender();
  btRoomInit().then(() => {
    if (BTG !== G || G.stage !== "search") return;
    if (BTR.room) { btPresence({ seek: G.topic, elo: btElo(), name: btName(), t: Date.now() }); btTryPair(BTR.room.peers() || []); }
    setTimeout(async () => {
      if (BTG !== G || G.stage !== "search" || G.match) return;
      btPresence(null);
      const gh = await btFindGhost(G.topic);
      if (BTG !== G || G.stage !== "search" || G.match) return;
      if (gh) { G.mode = "ghost"; G.seed = gh.seed >>> 0; G.opp = { name: gh.name, elo: gh.elo, ghost: gh.ev, marks: [], score: 0, strikes: 0, done: false }; }
      else { const e = btElo(); G.mode = "bot"; G.seed = Math.floor(Math.random() * 2 ** 31); G.opp = { name: "Bot Orca", elo: e, bot: true, marks: [], score: 0, strikes: 0, done: false }; }
      G.match = "solo" + Date.now(); btSetup(Date.now() + 2500);
    }, BTR.room ? BT_CFG.wait : 900);
  });
}
async function btFindGhost(topic) {
  await lbInit(); if (!LB.db) return null;
  try {
    const qs = await LB.db.collection("bt_g" + topic).limit(200).get();
    const me = btElo();
    const L = qs.docs.map(d => ({ id: d.id, ...(d.data() || {}) })).filter(g => g.id !== LB.uid && g.topic === topic && Array.isArray(g.ev) && g.ev.length && Number.isFinite(+g.seed))
      .map(g => ({ name: lbName(g.name) || "Giocatore", elo: Math.round(+g.elo || 1000), seed: +g.seed, ev: g.ev.slice(0, 200).map(x => [Math.max(0, Math.min(BT_CFG.secs * 1000, +x[0] || 0)), !!x[1]]).sort((a, b) => a[0] - b[0]) }));
    if (!L.length) return null;
    L.sort((a, b) => Math.abs(a.elo - me) - Math.abs(b.elo - me));
    return pick(L.slice(0, 3));
  } catch (e) { return null; }
}
function btSetup(startAt) {
  const G = BTG;
  G.probs = btProblems(G.seed, G.topic, BT_CFG.probs);
  G.i = 0; G.marks = []; G.ev = []; G.startAt = startAt; G.stage = "count"; G.over = null;
  if (G.opp.bot) { const acc = Math.max(0.45, Math.min(0.92, 0.66 + (G.opp.elo - 1000) / 1600)); let t = 2500; G.opp.ghost = []; for (let k = 0; k < 60 && t < BT_CFG.secs * 1000; k++) { t += 3500 + Math.random() * 6000; G.opp.ghost.push([t, Math.random() < acc]); } }
  btRender();
  clearTimer();
  timerId = setInterval(btTick, 100);
}
/* ---------- partita ---------- */
function btTick() {
  const G = BTG; if (!G || !run || run.kind !== "btgame") { clearTimer(); return; }
  const now = Date.now();
  if (G.stage === "count") { const el = $("#btCount"); const s = Math.ceil((G.startAt - now) / 1000); if (el) el.textContent = s > 0 ? s : "Via!"; if (now >= G.startAt) { G.stage = "play"; btRender(); } return; }
  if (G.stage !== "play") return;
  const el = now - G.startAt, left = Math.max(0, BT_CFG.secs * 1000 - el);
  const c = $("#btClock"); if (c) { c.textContent = Math.floor(left / 60000) + ":" + String(Math.floor(left / 1000) % 60).padStart(2, "0"); c.classList.toggle("low", left <= 20000); }
  /* fantasma e bot: le loro risposte arrivano ai tempi registrati */
  if (G.opp.ghost && !G.opp.done) { let ch = false; while (G.opp.marks.length < G.opp.ghost.length && G.opp.ghost[G.opp.marks.length][0] <= el) { G.opp.marks.push(G.opp.ghost[G.opp.marks.length][1]); ch = true; } if (ch) { G.opp.score = G.opp.marks.filter(Boolean).length; G.opp.strikes = G.opp.marks.filter(x => !x).length; if (G.opp.strikes >= BT_CFG.strikes || G.opp.marks.length >= G.opp.ghost.length) G.opp.done = true; btPaint(); btCheckEnd(); } }
  if (left <= 0) btFinish("time");
}
function btAnswer(v) {
  const G = BTG; if (!G || G.stage !== "play" || G.lock) return;
  const q = G.q; if (!q) return;
  let ok = false; try { const r = q.check(v); ok = r.score >= 100; } catch (e) { ok = false; }
  G.lock = true; G.marks.push(ok); G.ev.push([Date.now() - G.startAt, ok]);
  try { if (ok) gSnd.ok(); else gSnd.bad(); } catch (e) {}
  recordAnswer(G.probs[G.i].d, ok ? 100 : 0, 0);
  if (G.mode === "live" && BTR.room) BTR.room.emit("bt", { type: "prog", id: G.match, marks: G.marks, done: G.marks.filter(x => !x).length >= BT_CFG.strikes }).catch(() => {});
  const box = document.querySelector(".bt-prob"); if (box) box.classList.add(ok ? "ok" : "no");
  btPaint();
  setTimeout(() => {
    if (BTG !== G || G.stage !== "play") return;
    G.lock = false;
    if (G.marks.filter(x => !x).length >= BT_CFG.strikes) { G.meDone = true; btCheckEnd(); if (G.stage === "play") btRender(); return; }
    G.i++; if (G.i >= G.probs.length) { G.meDone = true; btCheckEnd(); if (G.stage === "play") btRender(); return; }
    btRender();
  }, ok ? 250 : 600);
}
function btCheckEnd() {
  const G = BTG; if (!G || G.stage !== "play") return;
  const my = G.marks.filter(Boolean).length, op = G.opp.score, meOut = !!G.meDone, opOut = !!G.opp.done;
  if (meOut && opOut) return btFinish("both");
  if (meOut && op > my) return btFinish("pass");
  if (opOut && my > op) return btFinish("pass");
}
function btFinish(why) {
  const G = BTG; if (!G || G.stage === "over") return;
  clearTimer(); G.stage = "over"; G.over = why;
  const my = G.marks.filter(Boolean).length, op = G.opp.score;
  const res = my > op ? 1 : my < op ? 0 : 0.5;
  const exp = 1 / (1 + Math.pow(10, (G.opp.elo - btElo()) / 400));
  G.delta = Math.round(BT_CFG.k * (res - exp)); G.res = res; G.my = my;
  const T = G.topic, st0 = btStatsOf(T);
  S.btElos = { ...(S.btElos || {}), [T]: Math.max(100, btElo(T) + G.delta) };
  S.btStatsT = { ...(S.btStatsT || {}), [T]: { w: (st0.w || 0) + (res === 1 ? 1 : 0), l: (st0.l || 0) + (res === 0 ? 1 : 0), d: (st0.d || 0) + (res === 0.5 ? 1 : 0) } };
  try { gAddXP(Math.min(40, 5 + my * 2 + (res === 1 ? 10 : 0))); } catch (e) {}
  S.history = [...S.history, { date: today(), label: "Battaglia di problemi", drills: [{ d: "battle", n: G.marks.length, score: G.marks.length ? Math.round(my / G.marks.length * 100) : null }], score: G.marks.length ? Math.round(my / G.marks.length * 100) : null }].slice(-300);
  persist();
  if (G.mode === "live" && BTR.room) { BTR.room.emit("bt", { type: "prog", id: G.match, marks: G.marks, done: true }).catch(() => {}); btPresence(null); }
  /* la tua partita diventa il fantasma che altri potranno sfidare, e l'Elo va in classifica */
  lbInit().then(async () => {
    if (!LB.db || !LB.uid) return;
    try { if (G.ev.length) await LB.db.doc("bt_g" + T + "/" + LB.uid).set({ name: btName(), elo: btElo(), topic: G.topic, seed: G.seed, ev: G.ev.slice(0, 200), score: my, date: today() }); } catch (e) {}
    try { if (S.btName) { await LB.db.doc("lb_" + btKey(T) + "/" + LB.uid).set({ name: lbName(S.btName), score: btElo(T), date: today() }); lbFill(btKey(T)); } } catch (e) {}
  });
  btRender(); window.scrollTo({ top: 0, behavior: "smooth" });
}
function btQuit() {
  const G = BTG;
  if (G && G.mode === "live" && G.stage === "play" && BTR.room) BTR.room.emit("bt", { type: "quit", id: G.match }).catch(() => {});
  btPresence(null); clearTimer(); BTG = null; setTab("free");
}
/* ---------- disegno ---------- */
const btMarks = (mk, n) => { let h = ""; for (let i = 0; i < Math.max(n, mk.length); i++) h += `<i class="${i < mk.length ? (mk[i] ? "ok" : "no") : ""}">${i < mk.length ? (mk[i] ? "✓" : "✕") : ""}</i>`; return h; };
const btStrikes = s => [0, 1, 2].map(i => `<i class="${i < s ? "on" : ""}">✕</i>`).join("");
function btHead() {
  const G = BTG, my = G.marks.filter(Boolean).length, ms = G.marks.filter(x => !x).length, op = G.opp;
  const left = G.stage === "play" ? Math.max(0, BT_CFG.secs * 1000 - (Date.now() - G.startAt)) : BT_CFG.secs * 1000;
  const tag = G.mode === "live" ? "in diretta" : G.mode === "ghost" ? "partita registrata" : "bot";
  return `<div class="bt-head"><div class="bt-pl me"><b>${esc(btName())}</b><small>${btElo()}</small><div class="bt-str">${btStrikes(ms)}</div><div class="bt-sc">${my}</div></div>
    <div class="bt-mid"><span class="bt-bolt">⚡</span><b id="btClock">${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, "0")}</b><small>${tag}</small></div>
    <div class="bt-pl op"><b>${esc(op.name)}</b><small>${op.elo}${op.gone ? " · uscito" : ""}</small><div class="bt-str">${btStrikes(op.strikes)}</div><div class="bt-sc">${op.score}</div></div></div>
    <div class="bt-cols"><div class="bt-col">${btMarks(G.marks, 10)}</div><div class="bt-col op">${btMarks(op.marks, 10)}</div></div>`;
}
function btPaint() { const h = document.querySelector(".bt-headwrap"); if (h && BTG && BTG.opp) h.innerHTML = btHead(); }
function btRender() {
  const G = BTG;
  let h = `<div class="runner aof2-run"><div class="rbar"><div class="where"><b>Battaglia di problemi</b></div><div style="display:flex;gap:6px;align-items:center"><button class="gmute" data-mute="1" aria-label="Suoni">${gS().sound ? GIC.sound : GIC.mute}</button><button class="btn ghost" id="quit">Esci</button></div></div>`;
  if (G.stage === "lobby") {
    const st = btStatsOf(G.topic);
    h += `<div class="aof2 bt2"><div class="aof2-intro"><div class="bt-logo">⚔</div><h2>Battaglia di problemi</h2><p>Tu contro un avversario del tuo livello: gli stessi problemi nello stesso ordine, <b>3 minuti</b> e <b>3 errori</b> al massimo. Vince chi ne risolve di più.</p>
      <ul><li>Se un altro giocatore cerca una battaglia nello stesso momento, giocate in diretta.</li><li>Altrimenti sfidi la partita registrata di un giocatore con un punteggio vicino al tuo (i suoi errori e i suoi tempi sono quelli veri), o un bot se non ce ne sono.</li><li>Ogni modalità ha il suo punteggio battaglia e la sua classifica. Parte da ${BT_CFG.elo0}: sale se vinci, scende se perdi, di più contro chi è più forte di te.</li></ul>
      <div class="bt-me"><div><small>Punteggio</small><b>${btElo()}</b></div><div><small>Vittorie</small><b>${st.w || 0}</b></div><div><small>Pareggi</small><b>${st.d || 0}</b></div><div><small>Sconfitte</small><b>${st.l || 0}</b></div></div>
      <div class="aof2-dur">${Object.entries(BT_TOPICS).map(([k, v]) => `<button class="${k === G.topic ? "on" : ""}" data-btt="${k}">${v[0]}</button>`).join("")}</div>
      ${S.btName ? `<p class="aof2-rec">Giochi come <b>${esc(lbName(S.btName))}</b></p>` : `<div class="lb-form"><p>Scegli il nome che vedrà l'avversario:</p><div class="lb-row"><input type="text" id="btName" maxlength="14" placeholder="Il tuo nome" value="${esc(S.nick || "")}"></div></div>`}
      <button class="aof2-go" id="go">Cerca avversario</button>${lbBox(btKey(G.topic))}</div></div>`;
  } else if (G.stage === "search") {
    h += `<div class="aof2 bt2"><div class="aof2-intro"><div class="bt-logo spin">⚔</div><h2>Cerco un avversario...</h2><p>${BT_TOPICS[G.topic][0]} · punteggio ${btElo()}</p><p class="muted" style="font-size:13px">Se nessuno è in linea, sfidi una partita registrata del tuo livello.</p></div></div>`;
  } else if (G.stage === "count") {
    h += `<div class="aof2 bt2"><div class="bt-headwrap">${btHead()}</div><div class="bt-count"><small>Si parte tra</small><b id="btCount">3</b><p>${G.mode === "live" ? "Avversario in diretta trovato" : G.mode === "ghost" ? "Sfidi la partita registrata di " + esc(G.opp.name) : "Sfidi il bot del tuo livello"}</p></div></div>`;
  } else if (G.stage === "play") {
    let body = "";
    if (G.meDone) body = `<div class="bt-wait"><b>${G.marks.filter(x => !x).length >= BT_CFG.strikes ? "Tre errori: sei fuori" : "Problemi finiti"}</b><p>Aspetta che finisca anche ${esc(G.opp.name)}.</p></div>`;
    else {
      const P = G.probs[G.i]; let q = null;
      try { q = DRILLS[P.d].build(P.p); } catch (e) { q = null; }
      G.q = q;
      if (!q) { G.i++; return btRender(); }
      body = `<div class="bt-prob"><div class="bt-pn">Problema ${G.i + 1} · ${esc(DRILLS[P.d].short)}</div><div class="bt-qb">${q.body}</div><div class="opts ${q.layout || ""}">${q.opts.map((o, k) => `<button class="opt ${q.center ? "center" : ""}" data-k="${k}"><span>${o.label}</span></button>`).join("")}</div></div>`;
    }
    h += `<div class="aof2 bt2"><div class="bt-headwrap">${btHead()}</div>${body}</div>`;
  } else if (G.stage === "over") {
    const r = G.res, op = G.opp;
    h += `<div class="aof2 bt2"><div class="bt-headwrap">${btHead()}</div><div class="aof2-over"><span class="aof2-why">${G.over === "time" ? "Tempo scaduto" : "Battaglia finita"}</span><h2 class="bt-res ${r === 1 ? "w" : r === 0 ? "l" : "d"}">${r === 1 ? "Vittoria!" : r === 0 ? "Sconfitta" : "Pareggio"}</h2>
      <p class="bt-final"><b>${G.my}</b> a <b>${op.score}</b> contro ${esc(op.name)}</p><p class="bt-elo">Punteggio battaglia: <b>${btElo()}</b> <span class="${G.delta >= 0 ? "up" : "dn"}">${G.delta >= 0 ? "+" : ""}${G.delta}</span></p>
      <div class="aof2-btns"><button class="aof2-go" id="go">Nuova battaglia</button><button class="btn ghost" id="btBack">Torna ai drill</button></div>${lbBox(btKey(G.topic))}</div></div>`;
  }
  $("#view").innerHTML = h + `</div>`;
  $("#quit").onclick = btQuit;
  document.querySelectorAll("[data-btt]").forEach(b => b.onclick = () => { G.topic = b.dataset.btt; btRender(); });
  if (G.stage === "lobby") {
    lbFill(btKey(G.topic));
    const ni = $("#btName"); if (ni) ni.addEventListener("keydown", e => e.stopPropagation());
    $("#go").onclick = () => { if (ni) { const nm = lbName(ni.value); if (!nm) { ni.focus(); ni.placeholder = "Scrivi un nome"; return; } S.btName = nm; S.nick = S.nick || nm; persistSoon(); } btSearch(); };
  }
  if (G.stage === "over") { lbFill(btKey(G.topic)); $("#go").onclick = () => { G.stage = "lobby"; G.match = null; btRender(); }; $("#btBack").onclick = () => { BTG = null; setTab("free"); }; }
  if (G.stage === "play" && !G.meDone && G.q) {
    document.querySelectorAll(".bt-prob .opt").forEach(b => b.onclick = () => btAnswer(G.q.opts[+b.dataset.k].v));
    if (G.q.mount) { try { G.q.mount(); } catch (e) {} }
  }
}
document.addEventListener("keydown", e => {
  if (!run || run.kind !== "btgame" || !BTG || BTG.stage !== "play" || BTG.meDone || !BTG.q) return;
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  if (/^[1-9]$/.test(e.key)) { const o = BTG.q.opts[+e.key - 1]; if (o) { e.preventDefault(); btAnswer(o.v); } }
});

