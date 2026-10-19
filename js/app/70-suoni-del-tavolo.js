/* ================= SUONI DEL TAVOLO E VIBRAZIONE =================
   Suoni sintetizzati come quelli delle risposte (niente file audio): carte distribuite, carta girata,
   fiches, il «toc toc» del check e il fold. Si spengono con l'interruttore dei suoni.
   La vibrazione (telefoni che la supportano) si regola nelle Impostazioni. */
let tNoiseBuf = null;
function tNoise(dur, { f = 2500, q = 1, type = "bandpass", vol = 0.18, st = 0, sweep = 0 } = {}) {
  if (!gS().sound) return;
  try {
    gAC = gAC || new (window.AudioContext || window.webkitAudioContext)();
    if (!tNoiseBuf) { tNoiseBuf = gAC.createBuffer(1, gAC.sampleRate * 0.5, gAC.sampleRate); const d = tNoiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t0 = gAC.currentTime + 0.01 + st, src = gAC.createBufferSource(), fl = gAC.createBiquadFilter(), g = gAC.createGain();
    src.buffer = tNoiseBuf; fl.type = type; fl.frequency.setValueAtTime(f, t0); if (sweep) fl.frequency.exponentialRampToValueAtTime(sweep, t0 + dur); fl.Q.value = q;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.012, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(fl); fl.connect(g); g.connect(gAC.destination); src.start(t0); src.stop(t0 + dur + 0.02);
  } catch (e) {}
}
const tSnd = {
  deal: (st = 0) => tNoise(0.09, { f: 3200, q: 0.8, vol: 0.12, st, sweep: 1400 }),
  flip: (st = 0) => { tNoise(0.035, { f: 4200, type: "highpass", vol: 0.16, st }); tNoise(0.06, { f: 900, q: 2, vol: 0.06, st: st + 0.02 }); },
  chips: (n = 3, st = 0) => { for (let i = 0; i < n; i++) { const s = st + i * 0.055 + Math.random() * 0.02; gTone([[2300 + Math.random() * 900, 0.07, s, "triangle", 0.05], [3900 + Math.random() * 600, 0.05, s + 0.005, "sine", 0.025]]); } },
  check: (st = 0) => { [0, 0.13].forEach(d => { gTone([[150, 0.07, st + d, "sine", 0.22]]); tNoise(0.05, { f: 600, q: 1.5, vol: 0.1, st: st + d }); }); },
  fold: (st = 0) => tNoise(0.2, { f: 1800, type: "lowpass", vol: 0.1, st, sweep: 300 }),
  allin: (st = 0) => { tSnd.chips(8, st); gTone([[196, 0.25, st + 0.05, "sine", 0.08]]); },
};
/* il suono di un'azione scritta: «Fold», «Check», «Call», «Punta 2/3», «All-in»... */
function tActSound(label, st) {
  const k = typeof actKind === "function" ? actKind(label) : "";
  if (k === "act-fold") tSnd.fold(st); else if (k === "act-check") tSnd.check(st); else if (k === "act-allin") tSnd.allin(st);
  else if (k === "act-call") tSnd.chips(2, st); else if (k === "act-bet" || k === "act-raise") tSnd.chips(4, st);
}
/* carte distribuite al tavolo 6-max delle domande: un fruscio per carta, con i tempi dell'animazione (0,14 s a posto) */
function tDealSounds(root) {
  if (!root || typeof calmMotion === "function" && calmMotion()) return;
  const t = root.querySelector(".qcard .p6"); if (!t) return;
  const n = t.querySelectorAll(".p6-back").length + (t.querySelector(".p6-hc") ? 1 : 0);
  const k = animK(); for (let i = 0; i < Math.min(n, 6); i++) { tSnd.deal(i * 0.14 * k); tSnd.deal((i * 0.14 + 0.07) * k); }
}

/* ---------- vibrazione ---------- */
const vibOk = () => PREF.vib !== false && typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
function vib(p) { if (!vibOk()) return; try { navigator.vibrate(p); } catch (e) {} }
/* risposta giusta, sbagliata, combo e festeggiamenti: niente negli esami */
const _gOnAnswerV = gOnAnswer;
gOnAnswer = function (q, res, ms) {
  const out = _gOnAnswerV.apply(this, arguments);
  try { if (!isExamRun() && res && res.score != null) vib(res.score >= 100 ? ((run && run.combo) >= 5 ? [20, 40, 20, 40, 40] : (run && run.combo) >= 3 ? [20, 40, 30] : 18) : res.score > 0 ? 25 : [40, 60, 40]); } catch (e) {}
  return out;
};
const _gConfettiV = gConfetti;
gConfetti = function (ms) { vib([40, 30, 80]); return _gConfettiV.apply(this, arguments); };
