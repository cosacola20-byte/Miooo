/* ================= MINIGIOCO: OPEN O FOLD (scorri la carta) =================
   30 mani, 5 secondi ciascuna. Tutti hanno foldato fino a te: scorri a sinistra per aprire, a destra per foldare.
   Il riferimento sono le tabelle preflop dell'app (open se la tabella apre almeno il 65% delle volte,
   fold sotto il 35%, in mezzo vanno bene entrambe). */
const OF_CFG = { hands: 30, secs: 5, pts: 100, speed: 50, streak: 10 };
const OF_POS = ["EP", "MP", "CO", "BTN", "SB"];
const OF_SEATS = ["EP", "MP", "CO", "BTN", "SB", "BB"];
const OF_SP = { EP: "rfi_ep", MP: "rfi_mp", CO: "rfi_co", BTN: "rfi_btn", SB: "rfi_sb" };
let OFG = null;
const ofKeyLb = pos => "of" + (pos ? pos.toLowerCase() : "");
Object.assign(LB_TITLE, { of: "Classifica · tutte le posizioni", ofep: "Classifica · EP", ofmp: "Classifica · MP", ofco: "Classifica · CO", ofbtn: "Classifica · BTN", ofsb: "Classifica · SB" });
DRILLS.openfold = {
  name: "Open o fold", short: "Open o fold", time: 5, lvl: 0, noReview: true, noMix: true, noBr: true, game: true,
  desc: "Minigioco: tutti foldano fino a te. Scorri la carta a sinistra per aprire o a destra per foldare, 30 mani da 5 secondi.",
  rule: "", sample() { return null; }, build() { return null; },
};
const ofOpenFreq = (pos, k) => { const sp = preFor(OF_SP[pos]), f = sp && sp.f[k]; return f ? 1 - f[0] : 0; };
const ofRef = (fr, rng) => rngAction([1 - fr, fr], rng) === 1 ? "open" : "fold";
/* mani: un po' dal range, molte vicino al confine (le più utili), qualche mano a caso */
function ofPickHand(pos) {
  const sp = preFor(OF_SP[pos]), grid = [];
  for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) grid.push([i, j, handAt(i, j)]);
  const op = k => ofOpenFreq(pos, k) >= 0.5;
  const near = grid.filter(([i, j, k]) => { const o = op(k); for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a > 12 || b > 12) continue; if (op(handAt(a, b)) !== o) return true; } return false; }).map(g => g[2]);
  const inR = grid.filter(g => op(g[2])).map(g => g[2]);
  const r = Math.random(), k = r < 0.5 && near.length ? pick(near) : r < 0.75 && inR.length ? pick(inR) : null;
  if (!k) { const c = dealCards(2); return { cards: c.join(""), key: aofKey(c.join("")) }; }
  /* semi concreti per la mano scelta */
  const s = shuffle(["s", "h", "d", "c"]), r1 = k[0], r2 = k[1];
  const cards = k.length === 2 ? r1 + s[0] + r2 + s[1] : k[2] === "s" ? r1 + s[0] + r2 + s[0] : r1 + s[0] + r2 + s[1];
  return { cards, key: k };
}
function ofStart(pos) {
  clearTimer();
  run = { kind: "ofgame", id: "openfold", label: "Open o fold", plan: [["openfold", 1]], di: 0, qi: 0, stage: "ofgame", scores: [], results: [], ctx: {} };
  OFG = { pos: pos || "", stage: "intro" };
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-selected", "false"));
  render(); window.scrollTo({ top: 0 });
}
function ofNewGame() { OFG = { pos: OFG.pos, stage: "play", n: 0, pts: 0, ok: 0, streak: 0, best: 0, errs: [], times: [], last: null }; ofNext(); }
function ofNext() {
  const G = OFG; if (!G) return;
  if (G.n >= OF_CFG.hands) return ofOver();
  G.n++; const pos = G.pos || pick(OF_POS), hand = ofPickHand(pos);
  G.cur = { pos, ...hand, fr: ofOpenFreq(pos, hand.key), rng: rngRoll() }; G.cur.ref = ofRef(G.cur.fr, G.cur.rng); G.lock = false;
  G.deadline = Date.now() + OF_CFG.secs * 1000;
  ofRender();
}
function ofSeats(pos) {
  const hi = OF_SEATS.indexOf(pos);
  return `<div class="of-seats">${OF_SEATS.map((p, i) => `<span class="${i < hi ? "fold" : i === hi ? "me" : ""}">${p}</span>`).join("")}</div>`;
}
function ofRender() {
  clearTimer();
  const G = OFG;
  let h = `<div class="runner aof2-run"><div class="rbar"><div class="where"><b>Open o fold</b> · minigioco</div><div style="display:flex;gap:6px;align-items:center"><button class="gmute" data-mute="1" aria-label="Suoni">${gS().sound ? GIC.sound : GIC.mute}</button><button class="btn ghost" id="quit">Esci</button></div></div>`;
  if (G.stage === "intro") {
    h += `<div class="aof2 of2"><div class="aof2-intro"><div class="of-demo"><span class="of-dr">✓ Open</span><span class="of-dc">${card("As")}${card("Kd")}</span><span class="of-dl">Fold ✕</span></div><h2>Open o fold</h2><p>Tutti hanno foldato fino a te. Guarda la mano e la posizione e decidi in fretta: <b>scorri a sinistra per aprire</b>, <b>a destra per foldare</b>. Puoi anche usare i pulsanti o le frecce della tastiera.</p>
      <ul><li>${OF_CFG.hands} mani, ${OF_CFG.secs} secondi per ognuna: se il tempo scade, la mano conta come sbagliata.</li><li>Risposta giusta: ${OF_CFG.pts} punti, fino a ${OF_CFG.speed} in più se sei veloce e ${OF_CFG.streak} in più per ogni risposta giusta di fila.</li><li>Il riferimento sono le tabelle preflop dell'app. Ogni carta ha un randomizzatore (RNG da 1 a 100) per le mani miste: se 44 apre il 30%, con RNG da 1 a 30 apri, da 31 a 100 foldi.</li></ul>
      <div class="aof2-dur">${[["", "Tutte"], ...OF_POS.map(p => [p, p])].map(([v, l]) => `<button class="${v === G.pos ? "on" : ""}" data-ofp="${v}">${l}</button>`).join("")}</div>
      ${recGet(ofKeyLb(G.pos)) ? `<p class="aof2-rec">Il tuo record qui: <b>${fmt(recGet(ofKeyLb(G.pos)))}</b> punti</p>` : ""}<button class="aof2-go" id="go">Gioca</button>${lbBox(ofKeyLb(G.pos))}</div></div>`;
  } else if (G.stage === "over") {
    const avg = G.times.length ? G.times.reduce((a, b) => a + b, 0) / G.times.length / 1000 : 0;
    h += `<div class="aof2 of2"><div class="aof2-over"><span class="aof2-why">Partita finita</span><div class="aof2-big">${fmt(G.pts)}<small>punti${G.rec ? " · nuovo record!" : ""}</small></div>
      <div class="aof2-grid"><div><b>${G.ok}/${OF_CFG.hands}</b><span>risposte giuste</span></div><div><b>${G.best}</b><span>serie migliore</span></div><div><b>${fmt(avg, 1)}s</b><span>tempo medio</span></div><div><b>${fmt(recGet(ofKeyLb(G.pos)))}</b><span>record</span></div></div>
      ${G.errs.length ? `<div class="of-errs"><h3>Gli errori</h3>${G.errs.map((e, i) => `<div class="of-err"><span class="of-ec">${cardsHtml(e.cards, true)}</span><span class="of-et"><span><b>${e.pos}</b> · ${e.key}</span><small>${e.you === "time" ? "tempo scaduto" : e.you === "open" ? "hai aperto" : "hai foldato"}: ${ofMixed(e.fr) ? `open ${Math.round(e.fr * 100)}%, con RNG ${e.rng} si ${e.ref === "open" ? "apre" : "folda"}` : `la tabella ${e.ref === "open" ? "apre sempre" : "folda sempre"}`}</small></span><button class="btn small" data-ofr="${i}">Range</button></div>`).join("")}</div>` : `<p class="aof2-acc">Nessun errore: tabelle perfette!</p>`}
      <div class="lb-offer" data-lbo="${ofKeyLb(G.pos)}"></div>
      <div class="aof2-btns"><button class="aof2-go" id="go">Gioca ancora</button><button class="btn ghost" id="ofBack">Torna ai drill</button></div>${lbBox(ofKeyLb(G.pos))}</div></div>`;
  } else {
    const c = G.cur, tl = Math.max(0, G.deadline - Date.now()) / 1000, L = G.last;
    const msg = !L ? "Scorri: sinistra apri, destra folda" : ofMsgTxt(L);
    h += `<div class="aof2 of2"><div class="aof2-top"><div class="aof2-score"><small>Punti</small><b>${fmt(G.pts)}</b></div><div class="aof2-rd"><small>Mano</small><b>${G.n}/${OF_CFG.hands}</b></div><div class="aof2-clock ${tl <= 2 ? "low" : ""}"><small>Secondi</small><b id="ofClock">${fmt(tl, 1)}</b></div></div>
      <div class="sh2-tbar"><i id="ofBar" style="width:${tl / OF_CFG.secs * 100}%"></i></div>
      <div class="aof2-msg ${L && !L.ok ? "lose" : ""}" id="ofMsg">${msg}</div>
      <div class="of-stage"><div class="of-card of-under"></div>
        <div class="of-card" id="ofCard"><span class="of-stamp open">OPEN</span><span class="of-stamp fold">FOLD</span>
          <span class="of-rng">RNG <b>${c.rng}</b></span>
          <div class="of-pos"><b>${c.pos}</b><small>Tutti foldano fino a te</small></div>${ofSeats(c.pos)}
          <div class="of-hand">${c.cards.match(/../g).map(x => card(x)).join("")}</div><div class="of-key">${c.key}</div></div></div>
      <div class="of-btns"><button class="of-yes" data-of="open" aria-label="Open">✓<span>Open</span></button><button class="of-no" data-of="fold" aria-label="Fold">✕<span>Fold</span></button></div>
      <p class="of-hint">Scorri la carta o usa le frecce ← →</p></div>`;
  }
  $("#view").innerHTML = h + `</div>`;
  $("#quit").onclick = () => { OFG = null; setTab("free"); };
  document.querySelectorAll("[data-ofp]").forEach(b => b.onclick = () => { G.pos = b.dataset.ofp; ofRender(); });
  if (G.stage === "intro") { $("#go").onclick = ofNewGame; lbFill(ofKeyLb(G.pos)); }
  if (G.stage === "over") {
    const k = ofKeyLb(G.pos); $("#go").onclick = ofNewGame; $("#ofBack").onclick = () => { OFG = null; setTab("free"); };
    document.querySelectorAll("[data-ofr]").forEach(b => b.onclick = () => { const e = G.errs[+b.dataset.ofr], sp = preFor(OF_SP[e.pos]); gModal(`<span class="eyebrow">Tabella preflop</span><h3 style="margin:4px 0 8px">${esc(sp.label)}</h3>${preGrid(sp, e.key)}<p class="muted" style="font-size:13px;margin:8px 0 0">La cella evidenziata è ${e.key}: open ${Math.round(e.fr * 100)}%.</p>`); });
    lbFill(k).then(() => lbOffer(k, G.pts, G.ok));
  }
  if (G.stage === "play") ofBind();
}
/* trascinamento della carta con dito o mouse */
function ofBind() {
  const G = OFG, el = $("#ofCard");
  document.querySelectorAll("[data-of]").forEach(b => b.onclick = () => ofDecide(b.dataset.of));
  let x0 = null, dx = 0, t0 = 0;
  const so = el.querySelector(".of-stamp.open"), sf = el.querySelector(".of-stamp.fold");
  const move = d => { dx = d; el.style.transform = `translateX(${d}px) rotate(${d / 18}deg)`; const a = Math.min(1, Math.abs(d) / 90); so.style.opacity = d < 0 ? a : 0; sf.style.opacity = d > 0 ? a : 0; };
  el.addEventListener("pointerdown", e => { if (G.lock) return; x0 = e.clientX; t0 = Date.now(); el.setPointerCapture(e.pointerId); el.classList.add("drag"); });
  el.addEventListener("pointermove", e => { if (x0 == null) return; move(e.clientX - x0); });
  const end = () => { if (x0 == null) return; x0 = null; el.classList.remove("drag"); const v = Math.abs(dx) / Math.max(1, Date.now() - t0); if (Math.abs(dx) > 90 || (Math.abs(dx) > 40 && v > 0.6)) ofDecide(dx < 0 ? "open" : "fold"); else move(0); };
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  timerId = setInterval(() => {
    if (!run || run.kind !== "ofgame" || OFG !== G || G.stage !== "play" || G.lock) return;
    const l = G.deadline - Date.now(), c = $("#ofClock"), bar = $("#ofBar");
    if (c) { c.textContent = fmt(Math.max(0, l) / 1000, 1); c.parentElement.classList.toggle("low", l <= 2000); }
    if (bar) bar.style.width = Math.max(0, l / (OF_CFG.secs * 1000) * 100) + "%";
    if (l <= 0) ofDecide("time");
  }, 100);
}
const ofMixed = fr => fr > 0.005 && fr < 0.995;
function ofMsgTxt(L) {
  const mix = ofMixed(L.fr), why = mix ? `open ${Math.round(L.fr * 100)}% e RNG ${L.rng}: si ${L.ref === "open" ? "apre" : "folda"}` : `${L.ref === "open" ? "si apre sempre" : "si folda sempre"}`;
  if (L.ok) return `Giusto! +${fmt(L.gain)}${mix ? ` (open ${Math.round(L.fr * 100)}%, RNG ${L.rng})` : ""}`;
  return `${L.you === "time" ? "Tempo scaduto" : "Sbagliato"}: ${L.key} da ${L.pos}, ${why}`;
}
function ofDecide(you) {
  const G = OFG; if (!G || G.stage !== "play" || G.lock) return;
  G.lock = true; clearTimer();
  const c = G.cur, used = Math.min(OF_CFG.secs * 1000, Date.now() - (G.deadline - OF_CFG.secs * 1000));
  const ok = you !== "time" && c.ref === you;
  let gain = 0;
  if (ok) { G.streak++; G.ok++; G.best = Math.max(G.best, G.streak); gain = OF_CFG.pts + Math.round(OF_CFG.speed * Math.max(0, 1 - used / (OF_CFG.secs * 1000))) + OF_CFG.streak * (G.streak - 1); G.pts += gain; }
  else { G.streak = 0; G.errs.push({ pos: c.pos, key: c.key, cards: c.cards, fr: c.fr, you, rng: c.rng, ref: c.ref }); }
  G.times.push(used);
  recordAnswer("openfold", ok ? 100 : 0, used);
  try { if (ok) gSnd.ok(); else gSnd.bad(); } catch (e) {}
  G.last = { ok, gain, you, pos: c.pos, key: c.key, fr: c.fr, ref: c.ref, rng: c.rng };
  const el = $("#ofCard"), dir = you === "open" ? -1 : you === "fold" ? 1 : 0;
  if (el) {
    el.classList.add(ok ? "good" : "bad");
    const s = el.querySelector(`.of-stamp.${you === "open" ? "open" : "fold"}`); if (s && you !== "time") s.style.opacity = 1;
    el.style.transition = "transform .28s ease-in, opacity .28s ease-in";
    el.style.transform = dir ? `translateX(${dir * 520}px) rotate(${dir * 24}deg)` : "translateY(30px) scale(.9)"; el.style.opacity = "0";
  }
  const m = $("#ofMsg"); if (m) { m.textContent = ofMsgTxt(G.last); m.className = "aof2-msg " + (ok ? "" : "lose"); }
  setTimeout(() => { if (OFG === G) ofNext(); }, ok ? 300 : 1200);
}
function ofOver() {
  const G = OFG; clearTimer(); G.stage = "over";
  const rk = ofKeyLb(G.pos); G.rec = G.pts > recGet(rk); if (G.rec) recSet(rk, G.pts);
  try { gAddXP(Math.min(40, 4 + Math.round(G.ok * 1.2))); } catch (e) {}
  S.history = [...S.history, { date: today(), label: "Minigioco · Open o fold", drills: [{ d: "openfold", n: OF_CFG.hands, score: Math.round(G.ok / OF_CFG.hands * 100) }], score: Math.round(G.ok / OF_CFG.hands * 100) }].slice(-300);
  persist(); ofRender(); window.scrollTo({ top: 0, behavior: "smooth" });
}
document.addEventListener("keydown", e => {
  if (!run || run.kind !== "ofgame" || !OFG || OFG.stage !== "play") return;
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  if (e.key === "ArrowLeft") { e.preventDefault(); ofDecide("open"); }
  else if (e.key === "ArrowRight") { e.preventDefault(); ofDecide("fold"); }
});

