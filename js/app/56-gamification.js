/* ================= GAMIFICATION (XP, serie, missioni, maestria, ranghi) ================= */
const G0 = () => ({ frV: 2, xp: 0, xpDays: {}, goal: 50, gems: 20, freezes: 0, frozen: [], quests: null, badges: {}, sound: true, bestCombo: 0, perfect: 0, lessons: 0, answers: 0, correct: 0, rankSeen: 0 });
function gS() { if (!S.g) S.g = G0(); else { const d = G0(); for (const k in d) if (S.g[k] === undefined) S.g[k] = d[k]; } return S.g; }
const GIC = {
  flame: '<svg viewBox="0 0 24 24" class="gic"><path d="M12 2c1 3.5 5 5.8 5 11a5 5 0 0 1-10 0c0-2.3 1-4 2.3-5.2.2 1.7 1 2.8 2.2 3.3C11 8.4 11.6 5 12 2z" fill="#ff8a1f"/><path d="M12 12c.6 1.6 2.3 2.4 2.3 4.4a2.3 2.3 0 0 1-4.6 0c0-1.3.8-2.2 1.6-2.8.1.8.4 1.3.9 1.6-.2-1.2-.2-2.2-.2-3.2z" fill="#ffd23f"/></svg>',
  flameOff: '<svg viewBox="0 0 24 24" class="gic"><path d="M12 2c1 3.5 5 5.8 5 11a5 5 0 0 1-10 0c0-2.3 1-4 2.3-5.2.2 1.7 1 2.8 2.2 3.3C11 8.4 11.6 5 12 2z" fill="#b9c2be"/></svg>',
  chip: '<svg viewBox="0 0 24 24" class="gic"><circle cx="12" cy="12" r="10" fill="#1e88e5"/><circle cx="12" cy="12" r="6.2" fill="#fff"/><circle cx="12" cy="12" r="4.6" fill="#1e88e5"/><g fill="#fff"><rect x="11" y="1.6" width="2" height="3.6" rx=".6"/><rect x="11" y="18.8" width="2" height="3.6" rx=".6"/><rect x="1.6" y="11" width="3.6" height="2" rx=".6"/><rect x="18.8" y="11" width="3.6" height="2" rx=".6"/></g></svg>',
  bolt: '<svg viewBox="0 0 24 24" class="gic"><path d="M13.5 2 4 14h6.5L9 22l11-13h-6.8z" fill="#f5b700"/></svg>',
  crown: '<svg viewBox="0 0 24 24" class="gic"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="#f5b700"/><rect x="5" y="19" width="14" height="2.4" rx="1" fill="#d99a00"/></svg>',
  star: '<svg viewBox="0 0 24 24" class="gic"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="#f5b700"/></svg>',
  starOff: '<svg viewBox="0 0 24 24" class="gic"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="#cdd5d1"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" class="gic"><path d="M7 3h10v4a5 5 0 0 1-10 0z" fill="#f5b700"/><path d="M4 4h3v3a3 3 0 0 1-3-3zm13 0h3a3 3 0 0 1-3 3z" fill="#e0a100"/><rect x="10.5" y="11.5" width="3" height="5" fill="#e0a100"/><rect x="7" y="16.5" width="10" height="3.5" rx="1" fill="#b37f00"/></svg>',
  target: '<svg viewBox="0 0 24 24" class="gic"><circle cx="12" cy="12" r="10" fill="#e53935"/><circle cx="12" cy="12" r="7" fill="#fff"/><circle cx="12" cy="12" r="4" fill="#e53935"/><circle cx="12" cy="12" r="1.6" fill="#fff"/></svg>',
  sound: '<svg viewBox="0 0 24 24" class="gic"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 24 24" class="gic"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5m0-5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  lock: '<svg viewBox="0 0 24 24" class="gic"><rect x="5" y="10" width="14" height="11" rx="2.5" fill="currentColor"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" stroke-width="2.2" fill="none"/></svg>',
  book: '<svg viewBox="0 0 24 24" class="gic"><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H11v17H5.5A1.5 1.5 0 0 1 4 18.5zM20 4.5A1.5 1.5 0 0 0 18.5 3H13v17h5.5a1.5 1.5 0 0 0 1.5-1.5z" fill="currentColor"/></svg>',
  ice: '<svg viewBox="0 0 24 24" class="gic"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7" stroke="#4fc3f7" stroke-width="2.4" stroke-linecap="round"/></svg>',
};
/* mascotte originale: Orki, un'orca con la sua fiche */
function gMascot(mood, size) {
  const s = size || 96, id = "o" + Math.random().toString(36).slice(2, 7);
  const eyeL = 40, eyeR = 60, ey = 58;
  const eye = (x, flip) => mood === "sad"
    ? `<path d="M${x - 5} ${ey - 1}q5 4 10 0" stroke="#0e1620" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : mood === "wow"
    ? `<circle cx="${x}" cy="${ey}" r="6.2" fill="#0e1620"/><circle cx="${x + 2}" cy="${ey - 2.4}" r="2.4" fill="#fff"/><circle cx="${x - 2}" cy="${ey + 2.2}" r="1" fill="#fff"/>`
    : mood === "think"
    ? `<circle cx="${x}" cy="${ey}" r="5" fill="#0e1620"/><circle cx="${x + 1.8}" cy="${ey - 2.6}" r="1.9" fill="#fff"/>`
    : `<path d="M${x - 5} ${ey + 1}q5 -6 10 0" stroke="#0e1620" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  const mouth = mood === "sad" ? `<path d="M45 72q5 -4 10 0" stroke="#0e1620" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : mood === "wow" ? `<ellipse cx="50" cy="71" rx="4.2" ry="5" fill="#0e1620"/><ellipse cx="50" cy="73.1" rx="2.6" ry="1.8" fill="#ff8fa3"/>`
    : mood === "think" ? `<path d="M46 71q3 1.6 8 -0.6" stroke="#0e1620" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : `<path d="M43.5 68q6.5 7 13 0" stroke="#0e1620" stroke-width="2.6" fill="#ff8fa3" stroke-linecap="round" stroke-linejoin="round"/>`;
  const extra = mood === "sad" ? `<path d="M${eyeR + 5} ${ey + 3}q2.4 4 0 6q-2.4-2 0-6z" fill="#7cc7ff"/>`
    : mood === "think" ? `<circle cx="84" cy="22" r="3" fill="#fff" stroke="#c9d6e2"/><circle cx="90" cy="13" r="4.5" fill="#fff" stroke="#c9d6e2"/>` : "";
  return `<svg viewBox="0 0 100 100" width="${s}" height="${s}" class="mascot ${mood || "happy"}" aria-hidden="true">
  <defs><linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3b4f"/><stop offset="1" stop-color="#141d28"/></linearGradient></defs>
  <path d="M74 70q14-2 20-14q-3 12-10 18q9 2 14 10q-12-3-24-6z" fill="#1a2533"/>
  <path d="M43 27q4-19 13-23q-1 12 5 23z" fill="url(#${id}b)"/>
  <ellipse cx="50" cy="58" rx="37" ry="33" fill="url(#${id}b)"/>
  <path d="M27 66q23 24 46 0q-3 20-23 22q-20-2-23-22z" fill="#f5f8fc"/>
  <ellipse cx="50" cy="67" rx="25" ry="19" fill="#f5f8fc"/>
  <ellipse cx="29" cy="44" rx="8.5" ry="4.8" transform="rotate(-28 29 44)" fill="#f5f8fc"/>
  <ellipse cx="71" cy="44" rx="8.5" ry="4.8" transform="rotate(28 71 44)" fill="#f5f8fc"/>
  <path d="M15 64q-9 6-8 15q8-2 14-10z" fill="#1a2533"/>
  <path d="M85 64q9 6 8 15q-8-2-14-10z" fill="#1a2533"/>
  <ellipse cx="33" cy="66" rx="4.4" ry="2.8" fill="#ff9fb3" opacity=".75"/>
  <ellipse cx="67" cy="66" rx="4.4" ry="2.8" fill="#ff9fb3" opacity=".75"/>
  <ellipse cx="40" cy="35" rx="9" ry="4" fill="#fff" opacity=".12"/>
  ${eye(eyeL)}${eye(eyeR)}${mouth}${extra}
  <g transform="translate(80 78)"><circle r="8" fill="#15925f"/>${[0,60,120,180,240,300].map(a => `<rect x="-1.4" y="-8" width="2.8" height="3.4" rx=".8" fill="#fff" transform="rotate(${a})"/>`).join("")}<circle r="4.6" fill="#e8f7ef"/></g>
  </svg>`;
}
/* suoni sintetizzati */
let gAC = null;
function gTone(seq) {
  if (!gS().sound) return;
  try { gAC = gAC || new (window.AudioContext || window.webkitAudioContext)(); const t0 = gAC.currentTime + 0.01;
    seq.forEach(([f, d, st, type, vol]) => { const o = gAC.createOscillator(), g = gAC.createGain(); o.type = type || "triangle"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0 + st); g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + st + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + st + d); o.connect(g); g.connect(gAC.destination); o.start(t0 + st); o.stop(t0 + st + d + 0.05); });
  } catch (e) {}
}
const gSnd = {
  ok: () => gTone([[784, 0.12, 0], [1175, 0.2, 0.09]]),
  bad: () => gTone([[220, 0.22, 0, "sawtooth", 0.05], [175, 0.28, 0.12, "sawtooth", 0.05]]),
  combo: () => gTone([[988, 0.1, 0], [1319, 0.1, 0.07], [1568, 0.18, 0.14]]),
  done: () => gTone([[523, 0.14, 0], [659, 0.14, 0.12], [784, 0.14, 0.24], [1047, 0.35, 0.36]]),
  rank: () => gTone([[392, 0.16, 0], [523, 0.16, 0.14], [659, 0.16, 0.28], [784, 0.16, 0.42], [1047, 0.5, 0.56, "square", 0.06]]),
};
/* coriandoli */
function gConfetti(ms) {
  try {
    const c = document.createElement("canvas"); c.className = "confetti"; document.body.appendChild(c);
    const W = c.width = innerWidth, H = c.height = innerHeight, x = c.getContext("2d");
    const cols = ["#15925f", "#f5b700", "#1e88e5", "#e53935", "#ff8a1f", "#8e44ad"];
    const P = Array.from({ length: 140 }, () => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 13 - 4, r: Math.random() * 6 + 4, c: cols[Math.floor(Math.random() * cols.length)], a: Math.random() * 6, va: (Math.random() - .5) * .3 }));
    const t0 = performance.now();
    const f = t => { x.clearRect(0, 0, W, H); P.forEach(p => { p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); }); if (t - t0 < (ms || 2200)) requestAnimationFrame(f); else c.remove(); };
    requestAnimationFrame(f);
  } catch (e) {}
}
/* maestria per abilità */
const MASTERY = [
  { n: "Da iniziare", c: "#b9c2be" }, { n: "Bronzo", c: "#c07a3a", min: 10, acc: 50 }, { n: "Argento", c: "#8fa3ad", min: 25, acc: 65 }, { n: "Oro", c: "#e0a100", min: 50, acc: 78 }, { n: "Platino", c: "#3aa6b9", min: 100, acc: 86 }, { n: "Leggenda", c: "#8e44ad", min: 150, acc: 93 },
];
const CORE = () => Object.keys(DRILLS).filter(id => !["review", "herr", "hands"].includes(id));
function gMastery(id) {
  const s = S.skills[id]; if (!s) return 0;
  const a = skillAcc(id) || 0, d = DRILLS[id];
  let lv = 0;
  for (let k = 1; k < MASTERY.length; k++) if (s.n >= MASTERY[k].min && a >= MASTERY[k].acc) lv = k;
  if (lv === 5 && d && d.time) { const t = skillTime(id); if (t != null && t > d.time * 0.6) lv = 4; }
  return lv;
}
const gMasteryAvg = () => { const c = CORE(); return c.reduce((a, id) => a + gMastery(id), 0) / c.length; };
function gNextMastery(id) { const lv = gMastery(id); if (lv >= 5) return "Livello massimo raggiunto."; const M = MASTERY[lv + 1], s = S.skills[id] || { n: 0 }; const a = skillAcc(id); const need = []; if (s.n < M.min) need.push(`${M.min - s.n} risposte in più`); if ((a || 0) < M.acc) need.push(`precisione ${M.acc}% sulle ultime 40 (ora ${a == null ? 0 : Math.round(a)}%)`); if (lv + 1 === 5 && DRILLS[id].time) need.push(`tempo medio sotto ${Math.round(DRILLS[id].time * 0.6)} s`); return `Per ${M.n}: ${need.join(", ") || "ci sei quasi"}.`; }
/* ranghi: servono XP E maestria, non solo volume */
