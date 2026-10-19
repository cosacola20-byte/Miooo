/* ================= MINIGIOCO: ALL-IN O FOLD =================
   Un orologio unico per tutta la partita. Ogni mano parte preflop, al flop o al turn: vedi le tue carte,
   quelle coperte dell'avversario e il board. Fold: mano dopo. All-in: l'avversario scopre una mano casuale,
   escono le carte che mancano e c'è lo showdown, come al tavolo. Vinci: avanti. Perdi: partita finita.
   L'orologio scorre solo mentre decidi. */
const AOF_CFG = { secs: 60, win: 1000, streak: 250, split: 500, ref: 60, grey: 2, maxFold: 10 };
const AOF_CAT = ["Carta alta", "Coppia", "Doppia coppia", "Tris", "Scala", "Colore", "Full", "Poker", "Scala colore"];
const AOF_WON = ["con la carta alta", "con una coppia", "con una doppia coppia", "con un tris", "con una scala", "con un colore", "con un full", "con un poker", "con una scala colore"];
const AOF_ST = { pre: ["Preflop", 0], flop: ["Flop", 3], turn: ["Turn", 4] };
let AOFG = null;
function aofBest5(cs) { if (cs.length === 5) return [0, 1, 2, 3, 4]; let best = -1, bi = null; for (let a = 0; a < cs.length; a++) for (let b = a + 1; b < cs.length; b++) { const idx = cs.map((_, i) => i).filter(i => i !== a && i !== b); const v = djEval(idx.map(i => cs[i])); if (v > best) { best = v; bi = idx; } } return bi; }
const aofCatOf = cs => cs.length >= 5 ? AOF_CAT[djCat(djEval(cs))] : (cs[0] >> 2) === (cs[1] >> 2) ? "Coppia" : "Carta alta";
const aofBack = b => `<span class="aof2-back bk-${b || (typeof curBack === "function" ? curBack() : "rosso")}"><i></i></span>`;
DRILLS.allin = {
  name: "All-in o fold", short: "All-in o fold", time: 60, lvl: 1, noReview: true, noMix: true, noBr: true, game: true,
  desc: "Minigioco a tempo: le tue carte, quelle coperte dell'avversario e a volte il flop o il turn. Fold o all-in: se perdi lo showdown la partita finisce.",
  rule: "",
  sample() { return null; }, build() { return null; },
};
function aofStart(secs) {
  clearTimer();
  run = { kind: "aof", id: "allin", label: "All-in o fold", plan: [["allin", 1]], di: 0, qi: 0, stage: "aof", scores: [], results: [], ctx: {} };
  AOFG = { secs: secs != null && !isNaN(secs) ? secs : (AOFG && AOFG.secs != null ? AOFG.secs : AOF_CFG.secs), stage: "intro" };
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-selected", "false"));
  render(); window.scrollTo({ top: 0 });
}
function aofNewGame() {
  const s = AOFG.secs;
  AOFG = { secs: s, left: s ? s * 1000 : 0, pts: 0, won: 0, split: 0, folded: 0, shoves: 0, streak: 0, bestStreak: 0, hands: 0, good: 0, dec: 0, over: null, stage: "hand", hand: null };
  aofDeal();
}
function aofDeal() {
  const r = Math.random(), st = r < 0.5 ? "pre" : r < 0.8 ? "flop" : "turn";
  const c = dealCards(9); /* mazzo mescolato una volta: le tue carte, quelle dell'avversario e le 5 comuni sono già decise */
  const nb = AOF_ST[st][1], H = djCs(c.slice(0, 2).join("")), V = djCs(c.slice(2, 4).join("")), B = djCs(c.slice(4, 9).join(""));
  AOFG.hand = { h: c.slice(0, 2).join(""), v: c.slice(2, 4).join(""), b5: c.slice(4, 9), st, nb, H, V, B, shown: c.slice(4, 4 + nb).join("") };
  AOFG.hand.refJ = st === "pre" ? null : eqJob([AOFG.hand.h, "casuale"], AOFG.hand.shown);
  /* senza tempo: dopo 10 fold di fila la mano dopo va all-in qualunque sia */
  AOFG.hand.forced = !AOFG.secs && (AOFG.foldRun || 0) >= AOF_CFG.maxFold;
  AOFG.stage = "hand"; AOFG.res = null;
  renderRun();
}
function aofTop() {
  const G = AOFG, left = Math.max(0, G.left) / 1000;
  return `<div class="aof2-top"><div class="aof2-score"><small>Punti</small><b>${fmt(G.pts)}</b></div><div class="aof2-rd"><small>Mano</small><b>${G.hands + (G.stage === "hand" ? 1 : 0)}</b></div>${G.secs ? `<div class="aof2-clock ${left <= 10 ? "low" : ""}"><small>Secondi</small><b id="aofClock">${fmt(left, 1)}</b></div>` : `<div class="aof2-clock"><small>Tempo</small><b>∞</b></div>`}</div>
  <div class="aof2-stats"><span>All-in vinti <b>${G.won}</b></span><span>Serie <b>${G.streak}</b></span><span>Fold <b>${G.folded}</b></span>${G.secs ? "" : `<span class="${(G.foldRun || 0) >= AOF_CFG.maxFold - 2 ? "aof2-warn" : ""}">Fold di fila <b>${G.foldRun || 0}/${AOF_CFG.maxFold}</b></span>`}</div>`;
}
function aofRender() {
  clearTimer();
  const G = AOFG;
  let h = `<div class="runner aof2-run"><div class="rbar"><div class="where"><b>All-in o fold</b> · minigioco</div><div style="display:flex;gap:6px;align-items:center"><button class="gmute" data-mute="1" aria-label="Suoni">${gS().sound ? GIC.sound : GIC.mute}</button><button class="btn ghost" id="quit">Esci</button></div></div>`;
  if (G.stage === "intro") {
    h += `<div class="aof2"><div class="aof2-intro"><span class="aof2-logo">${aofBack()}${aofBack()}</span><h2>All-in o fold</h2><p>Ti arrivano due carte. L'avversario ha due carte coperte e a volte c'è già il flop o il turn. <b>Fold</b> e passi alla mano dopo, oppure <b>all-in</b>: lui scopre le carte, escono quelle che mancano e c'è lo showdown. Vinci e vai avanti, perdi e la partita finisce. Puoi perdere anche da favorito: è il poker.</p>
      <ul><li>Un solo orologio per tutta la partita: scorre mentre decidi, si ferma durante lo showdown. Con «Senza tempo» non c'è orologio: giochi finché non perdi uno showdown.</li><li>All-in vinto: ${fmt(AOF_CFG.win)} punti, più ${fmt(AOF_CFG.streak)} per ogni showdown di fila già superato. Pareggio: ${fmt(AOF_CFG.split)} punti e sopravvivi.</li><li>La mano dell'avversario è casuale: ogni combinazione ha la stessa probabilità.</li><li>Senza tempo puoi foldare al massimo ${AOF_CFG.maxFold} mani di seguito: l'undicesima va all-in qualunque sia.</li></ul>
      <div class="aof2-dur">${[30, 60, 90, 0].map(x => `<button class="${x === G.secs ? "on" : ""}" data-aofs="${x}">${aofDurLbl(x)}</button>`).join("")}</div>
      ${recGet(aofKeyLb(G.secs)) ? `<p class="aof2-rec">Il tuo record ${G.secs ? `a ${G.secs} secondi` : "senza tempo"}: <b>${fmt(recGet(aofKeyLb(G.secs)))}</b> punti</p>` : ""}
      <button class="aof2-go" id="go">Gioca</button>${lbBox(aofKeyLb(G.secs))}</div></div>`;
  } else if (G.stage === "over") {
    const why = G.over === "time" ? "Tempo scaduto" : G.over === "lose" ? "Showdown perso" : "Partita finita";
    h += `<div class="aof2"><div class="aof2-over"><span class="aof2-why">${why}</span><div class="aof2-big">${fmt(G.pts)}<small>punti${G.rec ? " · nuovo record!" : ""}</small></div>
      <div class="aof2-grid"><div><b>${G.won}</b><span>all-in vinti</span></div><div><b>${G.bestStreak}</b><span>serie migliore</span></div><div><b>${G.folded}</b><span>mani foldate</span></div><div><b>${G.split}</b><span>pareggi</span></div><div><b>${fmt(recGet(aofKeyLb(G.secs)))}</b><span>record</span></div><div><b>${G.secs ? fmt(Math.max(0, G.left) / 1000, 1) + "s" : G.hands}</b><span>${G.secs ? "tempo rimasto" : "mani giocate"}</span></div></div>
      ${G.dec ? `<p class="aof2-acc">Scelte giuste: <b>${G.good} su ${G.dec}</b>. Il conto non guarda la fortuna: una scelta è giusta se l'all-in ha almeno il ${AOF_CFG.ref}% di equity contro una mano casuale (zona grigia ${AOF_CFG.ref - AOF_CFG.grey}-${AOF_CFG.ref + AOF_CFG.grey}%).</p>` : ""}
      <div class="lb-offer" data-lbo="${aofKeyLb(G.secs)}"></div>
      <div class="aof2-btns"><button class="aof2-go" id="go">Gioca ancora</button><button class="btn ghost" id="aofBack">Torna ai drill</button></div>${lbBox(aofKeyLb(G.secs))}</div></div>`;
  } else {
    const H = G.hand, show = G.stage !== "hand";
    const slots = H.b5.map((c, i) => `<span class="aof2-slot" data-ab="${i}">${i < H.nb || (show && G.dealt > i) ? card(c) : ""}</span>`).join("");
    h += `<div class="aof2">${aofTop()}<div class="aof2-msg" id="aofMsg">${G.stage === "hand" ? (H.forced ? `Hai foldato ${AOF_CFG.maxFold} mani di seguito: questa va all-in` : `${AOF_ST[H.st][0]}: fold o all-in?`) : G.msg || ""}</div>
      <div class="aof2-table"><div class="aof2-vil"><div class="aof2-hand" id="aofVil">${aofBack()}${aofBack()}</div><span class="aof2-tag" id="aofVilTag">Avversario</span></div>
      <div class="aof2-felt"><span class="aof2-street" id="aofStreet">${AOF_ST[H.st][0]}</span><div class="aof2-board">${slots}</div></div>
      <div class="aof2-me"><div class="aof2-hand big" id="aofMe">${H.h.match(/../g).map(c => card(c)).join("")}</div><span class="aof2-ribbon" id="aofMeTag">${aofCatOf([...H.H, ...H.B.slice(0, H.nb)])}</span></div></div>
      <div class="aof2-act" id="aofAct">${G.stage === "hand" ? (H.forced ? `<button class="aof2-allin" data-aof="allin"><span>All-in obbligato</span></button>` : `<button class="aof2-fold" data-aof="fold"><span>Fold</span></button><button class="aof2-allin" data-aof="allin"><span>All-in</span></button>`) : ""}</div></div>`;
  }
  $("#view").innerHTML = h + `</div>`;
  $("#quit").onclick = () => { AOFG = null; setTab("free"); };
  document.querySelectorAll("[data-aofs]").forEach(b => b.onclick = () => { G.secs = +b.dataset.aofs; aofRender(); });
  if (G.stage === "intro") { $("#go").onclick = aofNewGame; lbFill(aofKeyLb(G.secs)); }
  if (G.stage === "over") { const k = aofKeyLb(G.secs); $("#go").onclick = () => { aofNewGame(); }; $("#aofBack").onclick = () => { AOFG = null; setTab("free"); }; lbFill(k).then(() => lbOffer(k, G.pts, G.won)); }
  if (G.stage === "hand") {
    document.querySelectorAll("[data-aof]").forEach(b => b.onclick = () => aofChoose(b.dataset.aof));
    if (G.hand.forced) { const hh = G.hand; setTimeout(() => { if (AOFG === G && G.stage === "hand" && G.hand === hh) aofChoose("allin"); }, 1500); }
    if (G.hand.refJ) eqBackground(G.hand.refJ);
    G.qStart = Date.now();
    if (G.secs) timerId = setInterval(() => {
      if (!run || run.kind !== "aof" || !AOFG || AOFG.stage !== "hand") return;
      const l = AOFG.left - (Date.now() - AOFG.qStart), el = $("#aofClock");
      if (el) { el.textContent = fmt(Math.max(0, l) / 1000, 1); el.parentElement.classList.toggle("low", l <= 10000); }
      if (l <= 0) { clearTimer(); AOFG.left = 0; aofOver("time"); }
    }, 100);
  }
}
/* scelta: il riferimento (equity contro una mano casuale) misura la decisione, non il risultato */
function aofChoose(choice) {
  if (AOFG && AOFG.hand && AOFG.hand.forced && choice !== "allin") return;
  const G = AOFG; if (!G || G.stage !== "hand") return;
  clearTimer();
  if (G.secs) G.left = Math.max(0, G.left - (Date.now() - G.qStart));
  const H = G.hand; G.hands++;
  const eqR = H.st === "pre" ? EQ_RND[aofKey(H.h)] : eqFinish(H.refJ).eq[0];
  const ref = eqR >= AOF_CFG.ref + AOF_CFG.grey ? "allin" : eqR < AOF_CFG.ref - AOF_CFG.grey ? "fold" : "both";
  const ok = ref === "both" || ref === choice;
  if (!H.forced) { G.dec++; if (ok) G.good++; recordAnswer("allin", ok ? 100 : 0, 0); }
  G.foldRun = choice === "fold" ? (G.foldRun || 0) + 1 : 0;
  if (choice === "fold") {
    G.folded++;
    const tb = document.querySelector(".aof2-me"); if (tb) tb.classList.add("folded");
    G.stage = "fold"; setTimeout(() => { if (AOFG === G && G.stage === "fold") aofDeal(); }, 380);
    return;
  }
  G.shoves++;
  const a = djEval([...H.H, ...H.B]), bv = djEval([...H.V, ...H.B]), res = a > bv ? "win" : a === bv ? "split" : "lose";
  let gain = 0;
  if (res === "win") { gain = AOF_CFG.win + AOF_CFG.streak * G.streak; G.streak++; G.won++; }
  else if (res === "split") { gain = AOF_CFG.split; G.split++; }
  G.pts += gain; G.bestStreak = Math.max(G.bestStreak, G.streak);
  G.res = res; G.stage = "show"; G.dealt = H.nb;
  const EJ = eqJob([H.h, H.v], H.shown); eqBackground(EJ);
  G.msg = res === "win" ? `Hai vinto ${AOF_WON[djCat(a)]}! +${fmt(gain)}` : res === "split" ? `Pareggio: piatto diviso, +${fmt(gain)}` : `Hai perso: l'avversario vince ${AOF_WON[djCat(bv)]}`;
  const act = $("#aofAct"); if (act) act.innerHTML = "";
  const slow = !calmMotion();
  const steps = [];
  steps.push(() => { const el = $("#aofVil"); if (el) { el.innerHTML = H.v.match(/../g).map(c => card(c)).join(""); el.classList.add("flip"); } const t = $("#aofVilTag"); if (t) t.textContent = aofCatOf([...H.V, ...H.B.slice(0, H.nb)]); const m = $("#aofMsg"); if (m) m.textContent = "All-in! L'avversario scopre le carte"; });
  const deal = (from, to, name) => steps.push(() => { for (let i = from; i < to; i++) { const s = document.querySelector(`[data-ab="${i}"]`); if (s) { s.innerHTML = card(H.b5[i]); s.classList.add("deal"); } } G.dealt = to; const z = $("#aofStreet"); if (z) z.textContent = name; const t1 = $("#aofMeTag"), t2 = $("#aofVilTag"); if (t1) t1.textContent = aofCatOf([...H.H, ...H.B.slice(0, to)]); if (t2) t2.textContent = aofCatOf([...H.V, ...H.B.slice(0, to)]); });
  if (H.nb < 3) deal(0, 3, "Flop");
  if (H.nb < 4) deal(3, 4, "Turn");
  deal(4, 5, "River");
  steps.push(() => {
    const win = res === "lose" ? "vil" : "me", cs = win === "me" ? [...H.H, ...H.B] : [...H.V, ...H.B], best = aofBest5(cs);
    document.querySelectorAll(`${win === "me" ? "#aofMe" : "#aofVil"} .pc`).forEach((e, i) => e.classList.toggle("dim", !best.includes(i)));
    document.querySelectorAll(".aof2-board .pc").forEach((e, i) => e.classList.toggle("dim", !best.includes(i + 2)));
    const me = $("#aofMeTag"), vt = $("#aofVilTag");
    if (me) { me.textContent = AOF_CAT[djCat(a)]; me.classList.add(res === "lose" ? "lose" : "win"); }
    if (vt) { vt.textContent = AOF_CAT[djCat(bv)]; if (res !== "win") vt.classList.add("win"); }
    const m = $("#aofMsg"); if (m) { m.textContent = G.msg; m.className = "aof2-msg " + res; }
    try { if (res === "lose") gSnd.bad(); else gSnd.ok(); } catch (e) {}
    const o = eqFinish(EJ), e0 = o && o.eq ? o.eq[0] : null;
    const luck = e0 == null ? "" : res === "lose" && e0 >= 50 ? " Eri favorito: è la varianza." : res === "win" && e0 < 50 ? " Eri sfavorito: questa volta è andata bene." : "";
    const act2 = $("#aofAct");
    if (act2) act2.innerHTML = `<p class="aof2-eq">All'all-in avevi il <b>${e0 == null ? "-" : eqPct(e0)}</b> contro ${icHand(H.v)}.${luck} ${eqBtn([H.h, H.v], H.shown, "Verifica")}</p><button class="aof2-go" id="go">${res === "lose" ? "Vedi il risultato" : "Mano successiva"}</button>`;
    if (res === "lose") G.over = "lose";
    const go = $("#go"); if (go) { go.onclick = () => res === "lose" ? aofOver("lose") : aofDeal(); go.focus({ preventScroll: true }); }
    G.stage = "after";
  });
  let k = 0; const nx = () => { if (AOFG !== G || !run || run.kind !== "aof") return; steps[k++](); if (k < steps.length) setTimeout(nx, slow ? (k === 1 ? 450 : 450) : 0); };
  nx();
}
function aofOver(why) {
  const G = AOFG; if (!G) return;
  clearTimer();
  G.over = why; G.stage = "over";
  const rk = aofKeyLb(G.secs); G.rec = G.pts > recGet(rk); if (G.rec) recSet(rk, G.pts);
  const xp = Math.min(40, 2 + G.won * 3);
  try { gAddXP(xp); } catch (e) {}
  S.history = [...S.history, { date: today(), label: "Minigioco · All-in o fold", drills: [{ d: "allin", n: G.dec, score: G.dec ? Math.round(G.good / G.dec * 100) : null }], score: G.dec ? Math.round(G.good / G.dec * 100) : null }].slice(-300);
  persist();
  aofRender(); window.scrollTo({ top: 0, behavior: "smooth" });
}
document.addEventListener("keydown", e => {
  if (!run || run.kind !== "aof" || !AOFG || AOFG.stage !== "hand") return;
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  if (e.key === "1" || e.key === "f" || e.key === "F") { e.preventDefault(); aofChoose("fold"); }
  else if (e.key === "2" || e.key === "a" || e.key === "A") { e.preventDefault(); aofChoose("allin"); }
});

