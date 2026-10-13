/* ================= MINIGIOCO: LA MANO PIÙ FORTE (10 round) ================= */
const SH_CFG = { rounds: 10, pts: 250, hard: 125, streak: 50, win: 150, secs: 10 };
let SHG = null;
function shStart(st) {
  clearTimer();
  run = { kind: "shgame", id: "strongest", label: "La mano più forte", plan: [["strongest", 1]], di: 0, qi: 0, stage: "shgame", scores: [], results: [], ctx: {} };
  SHG = { st: st || "", secs: SH_CFG.secs, stage: "intro" };
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-selected", "false"));
  render(); window.scrollTo({ top: 0 });
}
function shNewGame() { SHG = { st: SHG.st, secs: SH_CFG.secs, stage: "round", round: 0, pts: 0, marks: [], sdMarks: [], streak: 0, best: 0, ok: 0, sdWon: 0 }; shNext(); }
function shNext() {
  const G = SHG; G.round++; G.pick = null; G.R = null; G.stage = "round"; G.phase = "pick"; G.sd = null; G.gainD = 0;
  G.p = DRILLS.strongest.sample({ opt: { mode: "A", st: G.st || undefined } });
  const nb = DJ_ST[G.p.st][1], used = [...G.p.h.join("").match(/../g), ...(G.p.b.match(/../g) || [])];
  /* le carte che mancano escono dal mazzo rimasto, a caso: come al tavolo */
  G.full = [...(G.p.b.match(/../g) || []), ...dealCards(5 - nb, used)];
  G.dealt = nb; G.newFrom = 99; G.timeout = false;
  G.J = eqJob(G.p.h, G.p.b);
  G.deadline = Date.now() + G.secs * 1000;
  renderRun();
}
function shTable(G) {
  const p = G.p, hs = p.h, sd = G.sd;
  const slots = G.full.map((c, i) => `<span class="sh2-slot ${i >= G.newFrom && i < G.dealt ? "deal" : ""}">${i < G.dealt ? card(c) : ""}</span>`).join("");
  const name = G.dealt >= 3 ? hs.map(h => AOF_CAT[djCat(djEval(djCs(h + G.full.slice(0, G.dealt).join(""))))]) : null;
  const hand = i => `<button type="button" class="sh2-hand p${i} ${sd ? (sd.win.includes(i) ? "sdwin" : "sdlose") : ""}" data-sh="${i}" aria-label="Mano ${i + 1}"><span class="sh2-cards">${hs[i].match(/../g).map(c => card(c)).join("")}</span><span class="sh2-badge" data-shb="${i}"></span>${name ? `<span class="sh2-name ${sd && sd.win.includes(i) ? "win" : ""}">${sd && sd.win.includes(i) ? "Vince · " : ""}${name[i]}</span>` : ""}</button>`;
  const street = G.dealt >= 5 ? "River" : G.dealt === 4 ? "Turn" : G.dealt === 3 ? "Flop" : "Preflop";
  return `<div class="sh2-felt"><span class="sh2-st">${street}</span><div class="sh2-board">${slots}</div></div><div class="sh2-hands">${hand(0)}${hand(1)}<div class="sh2-row2">${hand(2)}</div></div>`;
}
function shRender() {
  clearTimer();
  const G = SHG;
  let h = `<div class="runner aof2-run"><div class="rbar"><div class="where"><b>La mano più forte</b> · minigioco</div><div style="display:flex;gap:6px;align-items:center"><button class="gmute" data-mute="1" aria-label="Suoni">${gS().sound ? GIC.sound : GIC.mute}</button><button class="btn ghost" id="quit">Esci</button></div></div>`;
  if (G.stage === "intro") {
    h += `<div class="aof2 sh2"><div class="aof2-intro"><h2>La mano più forte</h2><p>Tre giocatori vanno all-in. Guarda il board e tocca la mano con <b>più equity</b>, cioè quella che vince più spesso con le carte che devono ancora uscire. Poi escono le carte che mancano e allo showdown si vede chi vince davvero.</p>
      <ul><li>${SH_CFG.rounds} round, ${SH_CFG.secs} secondi per ogni scelta: se il tempo scade, il round conta come sbagliato.</li><li><b>Scelta giusta</b> (la mano con più equity): ${SH_CFG.pts} punti, ${SH_CFG.hard} in più se la domanda è difficile e ${SH_CFG.streak} in più per ogni scelta giusta di fila.</li><li><b>La tua mano vince allo showdown</b>: altri ${SH_CFG.win} punti (metà se pareggia). Qui conta anche la fortuna: la mano più forte non vince sempre.</li></ul>
      <div class="aof2-dur">${[["", "Tutte"], ["pre", "Preflop"], ["post", "Flop e turn"], ["river", "River"]].map(([v, l]) => `<button class="${v === G.st ? "on" : ""}" data-shs="${v}">${l}</button>`).join("")}</div>
      ${recGet(shKeyLb(G.st)) ? `<p class="aof2-rec">Il tuo record qui: <b>${fmt(recGet(shKeyLb(G.st)))}</b> punti</p>` : ""}<button class="aof2-go" id="go">Gioca</button>${lbBox(shKeyLb(G.st))}</div></div>`;
  } else if (G.stage === "over") {
    h += `<div class="aof2 sh2"><div class="aof2-over"><span class="aof2-why">Partita finita</span><div class="aof2-big">${fmt(G.pts)}<small>punti${G.rec ? " · nuovo record!" : ""}</small></div>
      <div class="sh2-dots big">${G.marks.map(m => `<i class="${m ? "ok" : "no"}">${m ? "✓" : "✕"}</i>`).join("")}</div>
      <div class="aof2-grid"><div><b>${G.ok}/${SH_CFG.rounds}</b><span>scelte giuste</span></div><div><b>${G.sdWon}/${SH_CFG.rounds}</b><span>showdown vinti</span></div><div><b>${G.best}</b><span>serie migliore</span></div><div><b>${fmt(recGet(shKeyLb(G.st)))}</b><span>record</span></div></div>
      <p class="aof2-acc">Le scelte giuste misurano la tua lettura delle equity; gli showdown vinti dipendono anche dalla fortuna.</p>
      <div class="lb-offer" data-lbo="${shKeyLb(G.st)}"></div>
      <div class="aof2-btns"><button class="aof2-go" id="go">Gioca ancora</button><button class="btn ghost" id="shBack">Torna ai drill</button></div>${lbBox(shKeyLb(G.st))}</div></div>`;
  } else {
    const p = G.p, R = G.R, sd = G.sd;
    const dots = Array.from({ length: SH_CFG.rounds }, (_, i) => `<i class="${i < G.marks.length ? (G.marks[i] ? "ok" : "no") : i === G.marks.length ? "cur" : ""}">${i < G.marks.length ? (G.marks[i] ? "✓" : "✕") : ""}</i>`).join("");
    const okD = R && R.win.includes(G.pick);
    const msg1 = !R ? `${DJ_ST[p.st][0]}: tocca la mano con più equity` : G.timeout ? `Tempo scaduto: la mano più forte aveva il ${eqShow(R.o.eq[R.win[0]], 1)}` : okD ? `Scelta giusta! La mano più forte ha il ${eqShow(R.o.eq[R.win[0]], 1)} · +${fmt(G.gainD)}` : `Scelta sbagliata: la mano più forte aveva il ${eqShow(R.o.eq[R.win[0]], 1)}`;
    const msg2 = !sd ? (R ? "Escono le carte..." : "") : sd.mine ? (sd.win.length > 1 ? `Showdown: la tua mano pareggia con ${AOF_WON[sd.cat].replace(/^con /, "")} · +${fmt(sd.gain)}` : `Showdown: la tua mano vince ${AOF_WON[sd.cat]} · +${fmt(sd.gain)}`) : `Showdown: vince ${icHand(p.h[sd.win[0]])} ${AOF_WON[sd.cat]}${okD ? ": la mano più forte non vince sempre" : ""}`;
    const tl = R ? 0 : Math.max(0, G.deadline - Date.now()) / 1000;
    h += `<div class="aof2 sh2"><div class="aof2-top"><div class="aof2-score"><small>Punti</small><b>${fmt(G.pts)}</b></div><div class="aof2-rd"><small>Round</small><b>${G.round}</b></div><div class="aof2-clock ${!R && tl <= 5 ? "low" : ""}"><small>Secondi</small><b id="shClock">${R ? "-" : fmt(tl, 1)}</b></div></div>
      ${R ? "" : `<div class="sh2-tbar"><i id="shBar" style="width:${tl / G.secs * 100}%"></i></div>`}
      <div class="sh2-dots">${dots}</div>
      <div class="aof2-msg ${R ? (okD ? "" : "lose") : ""}">${msg1}</div>
      ${R ? `<div class="sh2-msg2 ${sd ? (sd.mine ? "win" : "lose") : ""}">${msg2}</div>` : ""}
      ${shTable(G)}
      <div class="aof2-act">${sd ? `<p class="aof2-eq sh2-why">${R.why} ${eqBtn(p.h, p.b, "Verifica")}</p><button class="aof2-go" id="go">${G.round >= SH_CFG.rounds ? "Vedi il risultato" : "Distribuisci"}</button>` : ""}</div></div>`;
  }
  $("#view").innerHTML = h + `</div>`;
  $("#quit").onclick = () => { SHG = null; setTab("free"); };
  document.querySelectorAll("[data-shs]").forEach(b => b.onclick = () => { G.st = b.dataset.shs; shRender(); });
  if (G.stage === "intro") { $("#go").onclick = shNewGame; lbFill(shKeyLb(G.st)); }
  if (G.stage === "over") { const k = shKeyLb(G.st); $("#go").onclick = shNewGame; $("#shBack").onclick = () => { SHG = null; setTab("free"); }; lbFill(k).then(() => lbOffer(k, G.pts, G.ok)); }
  if (G.stage === "round") {
    const root = document.querySelector(".sh2");
    if (G.R) { djMark2(root, G.R, G.pick); const go = $("#go"); if (go) { go.onclick = () => G.round >= SH_CFG.rounds ? shOver() : shNext(); go.focus({ preventScroll: true }); } }
    else {
      eqBackground(G.J); root.querySelectorAll("[data-sh]").forEach(el => el.onclick = () => shPick(+el.dataset.sh));
      timerId = setInterval(() => {
        if (!run || run.kind !== "shgame" || SHG !== G || G.R) { clearTimer(); return; }
        const l = G.deadline - Date.now(), el = $("#shClock"), bar = $("#shBar");
        if (el) { el.textContent = fmt(Math.max(0, l) / 1000, 1); el.parentElement.classList.toggle("low", l <= 5000); }
        if (bar) bar.style.width = Math.max(0, l / (G.secs * 1000) * 100) + "%";
        if (l <= 0) { clearTimer(); shPick(-1); }
      }, 100);
    }
  }
}
function shPick(i) {
  const G = SHG; if (!G || G.stage !== "round" || G.R) return;
  clearTimer();
  G.pick = i; G.timeout = i < 0; G.R = djSolveA(G.p); G.phase = "deal";
  const ok = G.R.win.includes(i);
  if (ok) { G.streak++; G.ok++; G.gainD = SH_CFG.pts + (G.R.hard ? SH_CFG.hard : 0) + SH_CFG.streak * (G.streak - 1); G.pts += G.gainD; G.best = Math.max(G.best, G.streak); } else { G.streak = 0; G.gainD = 0; }
  G.marks.push(ok);
  recordAnswer("strongest", ok ? 100 : 0, 0);
  try { if (ok) gSnd.ok(); else gSnd.bad(); } catch (e) {}
  shRender();
  const slow = !matchMedia("(prefers-reduced-motion: reduce)").matches, rnd = G.round;
  const step = () => {
    if (SHG !== G || G.round !== rnd || !run || run.kind !== "shgame") return;
    if (G.dealt < 5) { G.newFrom = G.dealt; G.dealt = G.dealt < 3 ? 3 : G.dealt + 1; shRender(); setTimeout(step, slow ? 420 : 0); return; }
    /* showdown sulle 5 carte */
    const sc = G.p.h.map(h => djEval(djCs(h + G.full.join("")))), mx = Math.max(...sc), win = sc.map((v, k) => k).filter(k => sc[k] === mx);
    const mine = win.includes(G.pick), gain = mine ? Math.round(SH_CFG.win / win.length) : 0;
    if (mine) { G.pts += gain; G.sdWon++; }
    G.sdMarks.push(mine);
    G.sd = { win, mine, gain, cat: djCat(mx) }; G.phase = "done"; G.newFrom = 99;
    try { if (mine) gSnd.ok(); } catch (e) {}
    shRender();
  };
  setTimeout(step, slow ? (G.dealt >= 5 ? 250 : 380) : 0);
}
function shOver() {
  const G = SHG; G.stage = "over";
  const rk = shKeyLb(G.st); G.rec = G.pts > recGet(rk); if (G.rec) recSet(rk, G.pts);
  try { gAddXP(Math.min(40, 4 + G.ok * 3)); } catch (e) {}
  S.history = [...S.history, { date: today(), label: "Minigioco · La mano più forte", drills: [{ d: "strongest", n: SH_CFG.rounds, score: Math.round(G.ok / SH_CFG.rounds * 100) }], score: Math.round(G.ok / SH_CFG.rounds * 100) }].slice(-300);
  persist(); shRender(); window.scrollTo({ top: 0, behavior: "smooth" });
}
document.addEventListener("keydown", e => {
  if (!run || run.kind !== "shgame" || !SHG || SHG.stage !== "round" || SHG.R) return;
  if (/^[123]$/.test(e.key)) { e.preventDefault(); shPick(+e.key - 1); }
});

const EQ_RND = {"22":50.4,"33":53.7,"44":57,"55":60.3,"66":63.3,"77":66.2,"88":69.1,"99":72,"AA":85.2,"AKs":67,"AKo":65.4,"AQs":66.2,"AQo":64.4,"AJs":65.4,"AJo":63.5,"ATs":64.6,"ATo":62.8,"A9s":62.8,"A9o":60.8,"A8s":61.9,"A8o":59.9,"A7s":61,"A7o":58.8,"A6s":59.9,"A6o":57.7,"A5s":59.9,"A5o":57.7,"A4s":59.1,"A4o":56.8,"A3s":58.2,"A3o":55.9,"A2s":57.4,"A2o":54.9,"KK":82.4,"KQs":63.4,"KQo":61.4,"KJs":62.6,"KJo":60.5,"KTs":61.8,"KTo":59.7,"K9s":60,"K9o":57.8,"K8s":58.3,"K8o":56,"K7s":57.5,"K7o":55.2,"K6s":56.6,"K6o":54.2,"K5s":55.8,"K5o":53.3,"K4s":54.8,"K4o":52.3,"K3s":54.1,"K3o":51.4,"K2s":53.2,"K2o":50.5,"QQ":79.9,"QJs":60.2,"QJo":58.1,"QTs":59.5,"QTo":57.3,"Q9s":57.7,"Q9o":55.4,"Q8s":56,"Q8o":53.6,"Q7s":54.3,"Q7o":51.7,"Q6s":53.6,"Q6o":51,"Q5s":52.7,"Q5o":50.1,"Q4s":51.9,"Q4o":49.1,"Q3s":51,"Q3o":48.2,"Q2s":50.2,"Q2o":47.2,"JJ":77.5,"JTs":57.5,"JTo":55.2,"J9s":55.7,"J9o":53.2,"J8s":54,"J8o":51.4,"J7s":52.3,"J7o":49.7,"J6s":50.6,"J6o":47.8,"J5s":50,"J5o":47.2,"J4s":49.1,"J4o":46.2,"J3s":48.2,"J3o":45.3,"J2s":47.4,"J2o":44.3,"TT":75,"T9s":54,"T9o":51.5,"T8s":52.3,"T8o":49.8,"T7s":50.6,"T7o":47.8,"T6s":48.9,"T6o":46.1,"T5s":47.2,"T5o":44.2,"T4s":46.5,"T4o":43.6,"T3s":45.6,"T3o":42.6,"T2s":44.9,"T2o":41.7,"98s":50.8,"98o":48.1,"97s":49.1,"97o":46.3,"96s":47.4,"96o":44.5,"95s":45.7,"95o":42.7,"94s":43.8,"94o":40.6,"93s":43.3,"93o":40,"92s":42.4,"92o":39,"87s":47.9,"87o":45,"86s":46.2,"86o":43.3,"85s":44.6,"85o":41.5,"84s":42.6,"84o":39.5,"83s":40.9,"83o":37.5,"82s":40.3,"82o":36.8,"76s":45.4,"76o":42.3,"75s":43.6,"75o":40.5,"74s":41.8,"74o":38.6,"73s":40,"73o":36.6,"72s":38.2,"72o":34.6,"65s":43.2,"65o":39.9,"64s":41.3,"64o":38,"63s":39.6,"63o":36.1,"62s":37.7,"62o":34.1,"54s":41.4,"54o":38.2,"53s":39.7,"53o":36.2,"52s":37.8,"52o":34.4,"43s":38.6,"43o":35.2,"42s":36.8,"42o":33.2,"32s":36,"32o":32.3}; /* equity contro una mano casuale per le 169 mani iniziali (simulazione da 3 milioni di mani ciascuna, margine circa ±0,06) */
function aofKey(h) { const a = h.match(/../g), r1 = rv(a[0][0]), r2 = rv(a[1][0]), hi = r1 >= r2 ? a[0] : a[1], lo = r1 >= r2 ? a[1] : a[0]; return hi[0] + lo[0] + (hi[0] === lo[0] ? "" : hi[1] === lo[1] ? "s" : "o"); }
