/* ================= STATO ================= */
const EMPTY = () => ({ v: 2, sessions: {}, skills: {}, history: [], days: [], review: [] });
let S = EMPTY();
let HANDS = { hands: [] };
let POOL = null; // {f: {0.33:..,0.5:..,0.75:..,1:..,1.5:..}}
let REPORT = null;
let db = null, docRef = null, sample = null, SAMPLE_P = null;
const LS = "orca-progress-v1", LSH = "orca-hands-v1", LSP = "orca-pool-v1";
/* migrazione una tantum dai nomi della versione precedente (targetlab-*, tl_*) */
(function lsMigrate() {
  try {
    const old = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && (k.startsWith("targetlab-") || k === "tl_test" || k === "tl_solves")) old.push(k); }
    old.forEach(k => { const nk = k.startsWith("targetlab-") ? "orca-" + k.slice(10) : "orca_" + k.slice(3); if (localStorage.getItem(nk) == null) localStorage.setItem(nk, localStorage.getItem(k)); localStorage.removeItem(k); });
  } catch (e) {}
})();
/* piattaforma: nel sito c'è ORCA_HOST (platform.js), nell'anteprima quella del visualizzatore */
const HOST = () => window.ORCA_HOST || window.claude || null;
const hostUse = n => { const h = HOST(); return h && typeof h.use === "function" ? h.use(n) : Promise.resolve(null); };
const lsGet = k => { try { const t = localStorage.getItem(k); return t ? JSON.parse(t) : null; } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
function normalize(x) { const e = EMPTY(); if (!x || typeof x !== "object") return e; return { ...e, ...x, sessions: x.sessions && typeof x.sessions === "object" ? x.sessions : {}, skills: x.skills && typeof x.skills === "object" ? x.skills : {}, history: Array.isArray(x.history) ? x.history.filter(h => h && typeof h === "object") : [], days: Array.isArray(x.days) ? x.days : [], review: Array.isArray(x.review) ? x.review : [], g: normG(x.g) }; }
/* stato di gioco: i campi con tipo sbagliato (file vecchi o manomessi) tornano al valore iniziale */
const isObj = v => !!v && typeof v === "object" && !Array.isArray(v);
function normG(g) {
  const d = G0(); if (!g || typeof g !== "object" || Array.isArray(g)) return d;
  const oldScale = g.frV !== 2, o = { ...d, ...g };
  for (const k in d) { const t = d[k] === null ? null : Array.isArray(d[k]) ? "array" : typeof d[k]; const v = o[k];
    if (t === "number" && !(typeof v === "number" && isFinite(v))) o[k] = d[k];
    else if (t === "boolean" && typeof v !== "boolean") o[k] = d[k];
    else if (t === "array" && !Array.isArray(v)) o[k] = d[k];
    else if (t === "object" && (!v || typeof v !== "object" || Array.isArray(v))) o[k] = d[k]; }
  ["br", "brMax"].forEach(k => { if (k in o && !(typeof o[k] === "number" && isFinite(o[k]))) delete o[k]; });
  ["xpC", "brC"].forEach(k => { if (k in o && !isObj(o[k])) delete o[k]; }); ["xpBase", "brBase"].forEach(k => { if (k in o && !(typeof o[k] === "number" && isFinite(o[k]))) delete o[k]; });
  if ("brDays" in o && (!o.brDays || typeof o.brDays !== "object" || Array.isArray(o.brDays))) delete o.brDays;
  /* fiches, nuova scala (1 buy-in di NL2 = 4 fiches, si parte con 120): le vecchie cifre si convertono una volta */
  if (oldScale) {
    if (typeof o.br === "number") o.br = Math.max(BR_START, Math.round(o.br * 2));
    if (typeof o.brMax === "number") o.brMax = Math.max(o.br || BR_START, Math.round(o.brMax * 2));
    if (o.brDays) { const b = {}; Object.entries(o.brDays).forEach(([k, v]) => { b[k] = Math.round((+v || 0) * 2); }); o.brDays = b; }
    delete o.brC; delete o.brBase; o.frV = 2;
  }
  return o;
}
const queues = {};
