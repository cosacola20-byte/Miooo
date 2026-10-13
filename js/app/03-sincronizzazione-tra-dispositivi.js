/* ================= SINCRONIZZAZIONE TRA DISPOSITIVI =================
   Ogni documento porta _u (quando è stato scritto) e _dev (da quale dispositivo). Prima di scrivere si rilegge
   la copia online: se nel frattempo un altro dispositivo l'ha cambiata, le due versioni si uniscono
   (storico, giorni, esami, traguardi, mani e sessioni si sommano; per il resto vince la modifica più recente).
   _reset segna un azzeramento voluto (azzera progressi, importa backup): in quel caso non si unisce niente. */
const DEV = (() => { let d = lsGet("orca_dev"); if (!d || typeof d !== "string") { d = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); lsSet("orca_dev", d); } return d; })();
const SEEN = {};
const syncStamp = x => { if (x && typeof x === "object") { x._u = Date.now(); x._dev = DEV; } return x; };
const uniqBy = (arr, key) => { const m = new Map(); arr.forEach(x => { if (!x || typeof x !== "object") return; const k = key(x); if (!m.has(k)) m.set(k, x); }); return [...m.values()]; };
function syncPick(L, R) { const n = (R._u || 0) > (L._u || 0) ? R : L, o = n === R ? L : R; return { n, o, reset: !!(n._reset && n._reset >= (o._u || 0)) }; }
/* contatori per dispositivo (XP e fiches): ogni dispositivo scrive solo il suo, così sommando non si perde niente */
const r2 = x => Math.round(x * 100) / 100;
const ctrSum = c => Object.values(isObj(c) ? c : {}).reduce((a, x) => a + (isObj(x) ? +x.v || 0 : 0), 0);
function ctrAdd(g, key, amt) {
  if (!isObj(g[key])) g[key] = {};
  const c = isObj(g[key][DEV]) ? g[key][DEV] : { v: 0, n: 0, d: {} }, d = today();
  c.v = r2((+c.v || 0) + amt); c.n = (c.n || 0) + 1; c.d = isObj(c.d) ? c.d : {}; c.d[d] = r2((+c.d[d] || 0) + amt);
  const ks = Object.keys(c.d).sort(); if (ks.length > 60) delete c.d[ks[0]];
  g[key][DEV] = c;
}
const ctrMerge = (a, b) => { const out = { ...(isObj(b) ? b : {}) }; Object.entries(isObj(a) ? a : {}).forEach(([k, c]) => { if (!isObj(c)) return; if (!isObj(out[k]) || (c.n || 0) > (out[k].n || 0)) out[k] = c; }); return out; };
const ctrDays = c => { const t = {}; Object.values(isObj(c) ? c : {}).forEach(x => Object.entries(isObj(x) && isObj(x.d) ? x.d : {}).forEach(([d, v]) => { t[d] = r2((t[d] || 0) + (+v || 0)); })); return t; };
function mergeG(n, o) {
  n = isObj(n) ? n : {}; o = isObj(o) ? o : {};
  const g = { ...o, ...n }, mx = k => { if (typeof n[k] === "number" || typeof o[k] === "number") g[k] = Math.max(+n[k] || 0, +o[k] || 0); };
  ["xp", "bestCombo", "perfect", "lessons", "answers", "correct", "brMax", "rankSeen"].forEach(mx);
  g.xpDays = { ...(o.xpDays || {}) }; Object.entries(n.xpDays || {}).forEach(([d, v]) => { g.xpDays[d] = Math.max(+v || 0, +g.xpDays[d] || 0); });
  g.badges = { ...(n.badges || {}) }; Object.entries(o.badges || {}).forEach(([k, d]) => { if (!g.badges[k] || d < g.badges[k]) g.badges[k] = d; });
  if (o.quests && n.quests && o.quests.date > n.quests.date) g.quests = o.quests;
  g.frozen = [...new Set([...(o.frozen || []), ...(n.frozen || [])])].sort().slice(-30);
  g.xpC = ctrMerge(n.xpC, o.xpC); g.brC = ctrMerge(n.brC, o.brC);
  g.xpBase = n.xpBase != null ? n.xpBase : o.xpBase; g.brBase = n.brBase != null ? n.brBase : o.brBase;
  if (g.xpBase != null) g.xp = Math.round(g.xpBase + ctrSum(g.xpC));
  Object.entries(ctrDays(g.xpC)).forEach(([d, v]) => { g.xpDays[d] = Math.max(+g.xpDays[d] || 0, v); });
  if (g.brBase != null) { g.br = Math.max(BR_FLOOR, r2(g.brBase + ctrSum(g.brC))); g.brMax = Math.max(g.brMax || 0, g.br); }
  g.brDays = { ...(o.brDays || {}), ...(n.brDays || {}), ...ctrDays(g.brC) };
  return g;
}
function mergeS(L, R) {
  if (!isObj(L)) return R; if (!isObj(R)) return L;
  const { n, o, reset } = syncPick(L, R); if (reset) return { ...n };
  const x = { ...o, ...n }, hk = h => JSON.stringify([h.date, h.label, h.score, h.drills]);
  x.history = uniqBy([...(o.history || []), ...(n.history || [])], hk).map((h, i) => [h, i]).sort((a, b) => (a[0].date || "") < (b[0].date || "") ? -1 : (a[0].date || "") > (b[0].date || "") ? 1 : a[1] - b[1]).map(a => a[0]).slice(-300);
  x.days = [...new Set([...(o.days || []), ...(n.days || [])])].sort();
  x.sessions = { ...(o.sessions || {}) }; Object.entries(n.sessions || {}).forEach(([id, a]) => { const b = x.sessions[id]; x.sessions[id] = !isObj(b) || !isObj(a) ? a : { ...b, ...a, best: Math.max(a.best || 0, b.best || 0), attempts: Math.max(a.attempts || 0, b.attempts || 0) }; });
  x.examOk = { ...(o.examOk || {}) }; Object.entries(n.examOk || {}).forEach(([id, d]) => { x.examOk[id] = [...new Set([...(x.examOk[id] || []), ...(d || [])])].sort().slice(-10); });
  x.examTry = { ...(o.examTry || {}) }; Object.entries(n.examTry || {}).forEach(([id, d]) => { if (!x.examTry[id] || d > x.examTry[id]) x.examTry[id] = d; });
  if (o.genProbs || n.genProbs) x.genProbs = uniqBy([...(n.genProbs || []), ...(o.genProbs || [])], p => String(p.id)).slice(0, 30);
  x.g = mergeG(n.g, o.g);
  x._u = Math.max(L._u || 0, R._u || 0); delete x._reset;
  return x;
}
function mergeList(L, R, field, key, max) { /* liste con id e cancellazioni (_del) */
  if (!isObj(L)) return R; if (!isObj(R)) return L;
  const { n, o, reset } = syncPick(L, R); if (reset) return { ...n };
  const del = { ...(o._del || {}), ...(n._del || {}) }, x = { ...o, ...n, _del: del };
  x[field] = uniqBy([...(o[field] || []), ...(n[field] || [])].reverse(), key).reverse().filter(it => !del[key(it)]).slice(-max);
  const ks = Object.keys(del); if (ks.length > 500) ks.sort((a, b) => del[a] - del[b]).slice(0, ks.length - 500).forEach(k => delete x._del[k]);
  x._u = Math.max(L._u || 0, R._u || 0); delete x._reset;
  return x;
}
const mergeHands = (L, R) => mergeList(L, R, "hands", h => String(h.id), 300);
const mergeMS = (L, R) => { const x = mergeList(L, R, "sessions", s => msSid(s), 400); if (x && Array.isArray(x.sessions)) x.sessions.sort((a, b) => (a.start || 0) - (b.start || 0)); return x; };
const SYNC = {
  "progress/main": { merge: mergeS, apply: m => { S = normalize(mergeS(S, m)); lsSet(LS, S); } },
  "myhands/list": { merge: mergeHands, apply: m => { const x = mergeHands(HANDS, m); HANDS = { ...x, hands: Array.isArray(x.hands) ? x.hands : [] }; lsSet(LSH, HANDS); } },
  "mindset/main": { merge: mergeMS, apply: m => { const X = mergeMS(MS, m); MS = { ...MS0(), ...X, editId: MS.editId, delId: MS.delId, newId: MS.newId }; try { localStorage.setItem(LSM, JSON.stringify(X)); } catch (e) {} } },
};
function writeDoc(path, data, okMsg) {
  if (!db) { setSave("Salvato in questo browser"); return; }
  const sy = SYNC[path]; if (sy) syncStamp(data);
  const snap = JSON.parse(JSON.stringify(data));
  queues[path] = (queues[path] || Promise.resolve()).then(async () => {
    let out = snap;
    if (sy) {
      try { const r = await db.doc(path).get(); const R = r.exists ? r.data() : null;
        if (isObj(R) && R._dev && R._dev !== DEV && (R._u || 0) > (SEEN[path] || 0)) { out = sy.merge(snap, R); sy.apply(out); SEEN[path] = R._u || 0; syncMsg(); }
      } catch (e) {}
      out = { ...out, _u: Date.now(), _dev: DEV };
    }
    await db.doc(path).set(out); if (sy) SEEN[path] = out._u;
  }).then(() => setSave(okMsg || "Progressi salvati")).catch(() => setSave("Salvataggio online non riuscito: dati tenuti in questo browser"));
}
let syncMsgT = null;
function syncMsg() { clearTimeout(syncMsgT); syncMsgT = setTimeout(() => { if (!run || run.stage === "intro" || run.stage === "end") render(); else renderStats(); }, 50); }
/* quando torni sulla pagina (cambio scheda o dispositivo), prende le novità dagli altri dispositivi */
async function syncPull() {
  if (!db) return; let ch = false;
  for (const path of Object.keys(SYNC)) {
    try { const r = await db.doc(path).get(); const R = r.exists ? r.data() : null;
      if (isObj(R) && R._dev && R._dev !== DEV && (R._u || 0) > (SEEN[path] || 0)) { SYNC[path].apply(R); SEEN[path] = R._u || 0; ch = true; }
    } catch (e) {}
  }
  if (ch) { syncMsg(); setSave("Progressi sincronizzati"); }
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") syncPull(); });
function persist() { lsSet(LS, S); writeDoc("progress/main", S); try { if (typeof xpLbSync === "function") xpLbSync(); } catch (e) {} }
function persistHands() { lsSet(LSH, HANDS); writeDoc("myhands/list", HANDS, "Mani salvate"); }
function persistPool() { lsSet(LSP, POOL); writeDoc("config/pool", POOL || { f: null }, "Pool salvato"); }
function setSave(t) { const el = $("#savestate"); if (el) el.textContent = t; }

function recordAnswer(drillId, score, ms) {
  const sk = S.skills[drillId] || { n: 0, sum: 0, last: [], lastT: [] };
  sk.lastT = sk.lastT || [];
  sk.n += 1; sk.sum += score; sk.last = [...sk.last, score].slice(-40);
  if (ms) sk.lastT = [...sk.lastT, Math.round(ms)].slice(-40);
  S.skills[drillId] = sk;
  const d = today(); if (!S.days.includes(d)) { S.days = [...S.days, d].slice(-400); gFreezeCheck(); }
}
/* congela serie: se ne guadagna uno ogni 7 giorni di serie (massimo 2 da parte) */
function gFreezeCheck() { try { const g = gS(), st = streak(); if (st > 0 && st % 7 === 0 && g.frzAt !== today() && (g.freezes || 0) < 2) { g.freezes = (g.freezes || 0) + 1; g.frzAt = today(); gToast(`${GIC.ice} ${st} giorni di serie: hai guadagnato un congela serie!`); } } catch (e) {} }
function streak() {
  const set = new Set(S.days); let n = 0; const d = new Date();
  if (!set.has(today())) d.setDate(d.getDate() - 1);
  while (set.has(dstr(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
const skillAcc = id => { const s = S.skills[id]; if (!s || !s.last.length) return null; return s.last.reduce((a, b) => a + b, 0) / s.last.length; };
const skillTime = id => { const s = S.skills[id]; if (!s || !s.lastT || !s.lastT.length) return null; return s.lastT.reduce((a, b) => a + b, 0) / s.lastT.length / 1000; };
function overall() { const all = Object.entries(S.skills).filter(([k]) => k !== "hands").flatMap(([, s]) => s.last || []); return all.length ? all.reduce((a, b) => a + b, 0) / all.length : null; }

/* ---- ripasso errori (ripetizione dilazionata) ---- */
const GAPS = [1, 3, 7, 14];
function addReview(d, p) {
  if (!p || d === "hands" || d === "review") return;
  const key = d + ":" + JSON.stringify(p);
  const ex = S.review.find(r => r.key === key);
  if (ex) { ex.step = 0; ex.due = addDays(1); return; }
  S.review = [...S.review, { key, d, p, step: 0, due: addDays(1) }].slice(-150);
}
function reviewDue() { const t = today(); if (S.review.some(r => r.d === "strongest" && r.p && r.p.m === "B")) S.review = S.review.filter(r => !(r.d === "strongest" && r.p && r.p.m === "B")); return S.review.filter(r => r.due <= t); }
function reviewAnswered(item, score) {
  const r = S.review.find(x => x.key === item.key); if (!r) return;
  if (score >= 100) { r.step++; if (r.step >= GAPS.length) S.review = S.review.filter(x => x !== r); else r.due = addDays(GAPS[r.step]); }
  else { r.step = 0; r.due = addDays(1); }
}

