/* ================= MEMORIA DELLE SOLUZIONI (RAM + IndexedDB) ================= */
/* ogni soluzione è identificata da board, piatto, stack, range, albero, rake e precisione */
const GW_MEM = { ram: new Map(), db: null, list: null };
function gwHash(s) { let h1 = 0x811c9dc5, h2 = 0x1234567; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 ^ c, 2246822519); } return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36); }
function gwSolKey(o, iters) {
  const rg = o.ranges.map(r => r.map(x => x.c[0] + "." + x.c[1] + ":" + Math.round(x.w * 1000)).join(",")).join("|");
  return gwHash("v3" + JSON.stringify([o.board, o.pot, o.stack, o.sz, o.allin, o.maxR, o.rake, o.cap, o.sample || null, o.flopOnly || false, iters]) + rg);
}
function gwDb() {
  if (GW_MEM.db) return Promise.resolve(GW_MEM.db);
  return new Promise(res => {
    try {
      const rq = indexedDB.open("orca-solutions", 1);
      rq.onupgradeneeded = () => { const d = rq.result; if (!d.objectStoreNames.contains("sol")) d.createObjectStore("sol", { keyPath: "key" }); if (!d.objectStoreNames.contains("meta")) d.createObjectStore("meta", { keyPath: "key" }); };
      rq.onsuccess = () => { GW_MEM.db = rq.result; gwDbMigrate(GW_MEM.db).then(() => res(GW_MEM.db)); };
      rq.onerror = () => res(null);
    } catch (e) { res(null); }
  });
}
/* una tantum: copia le soluzioni salvate dal database della versione precedente e lo elimina */
function gwDbMigrate(nd) {
  if (lsGet("orca_idb_mig")) return Promise.resolve();
  return new Promise(done => {
    const fin = () => { lsSet("orca_idb_mig", 1); done(); };
    try {
      const rq = indexedDB.open("targetlab-solutions");
      rq.onupgradeneeded = () => { try { rq.transaction.abort(); } catch (e) {} }; /* non esisteva: niente da copiare */
      rq.onerror = () => { try { indexedDB.deleteDatabase("targetlab-solutions"); } catch (e) {} fin(); };
      rq.onsuccess = () => {
        const od = rq.result, st = ["sol", "meta"].filter(n => od.objectStoreNames.contains(n));
        if (!st.length) { od.close(); try { indexedDB.deleteDatabase("targetlab-solutions"); } catch (e) {} return fin(); }
        const tx = od.transaction(st, "readonly"), got = {};
        st.forEach(n => { const r = tx.objectStore(n).getAll(); r.onsuccess = () => { got[n] = r.result || []; }; });
        tx.oncomplete = () => {
          od.close();
          const wt = nd.transaction(st, "readwrite"); st.forEach(n => { const o = wt.objectStore(n); (got[n] || []).forEach(v => { try { o.put(v); } catch (e) {} }); });
          wt.oncomplete = () => { try { indexedDB.deleteDatabase("targetlab-solutions"); } catch (e) {} fin(); };
          wt.onerror = wt.onabort = () => done(); /* riprova alla prossima apertura */
        };
        tx.onerror = () => { od.close(); done(); };
      };
    } catch (e) { fin(); }
  });
}
function gwDbReq(store, mode, fn) { return gwDb().then(d => d ? new Promise(res => { try { const tx = d.transaction(store, mode), st = tx.objectStore(store), r = fn(st); tx.oncomplete = () => res(r && r.result !== undefined ? r.result : true); tx.onerror = () => res(null); tx.onabort = () => res(null); } catch (e) { res(null); } }) : null); }
/* la strategia media di ogni nodo, normalizzata e compressa in un byte per frequenza */
function gwSerialize(E) {
  const G = E.G; let tot = 0;
  E.tree.nodes.forEach(n => { if (n.t === "a") tot += n.acts.length * G.n[n.pl]; });
  const buf = new Uint8Array(tot); let o = 0;
  E.tree.nodes.forEach(n => { if (n.t !== "a") return; const np = G.n[n.pl], st = msAvg(n, np); for (let k = 0; k < st.length; k++) buf[o + k] = Math.round(Math.max(0, Math.min(1, st[k])) * 255); o += st.length; });
  return buf;
}
function gwDeserialize(o, buf, meta) {
  const E = msInit(o, null, true), G = E.G; let p = 0;
  E.tree.nodes.forEach(n => {
    if (n.t !== "a") return; const np = G.n[n.pl], A = n.acts.length, L = A * np, avg = new Float32Array(L);
    for (let k = 0; k < L; k++) avg[k] = buf[p + k] / 255;
    for (let i = 0; i < np; i++) { let s = 0; for (let a = 0; a < A; a++) s += avg[a * np + i]; if (s > 0) for (let a = 0; a < A; a++) avg[a * np + i] /= s; }
    n.avg = avg; n.reg = null; p += L;
  });
  E.it = meta.it; E.ms = meta.ms; E.stats = meta.stats; E.par = meta.par; E.fromCache = true;
  return E;
}
async function gwMemGet(key, o) {
  if (GW_MEM.ram.has(key)) { const E = GW_MEM.ram.get(key); GW_MEM.ram.delete(key); GW_MEM.ram.set(key, E); return E; }
  const rec = await gwDbReq("sol", "readonly", st => st.get(key));
  if (!rec || !rec.buf) return null;
  const E = gwDeserialize(o, new Uint8Array(rec.buf), rec.meta);
  gwMemRam(key, E);
  gwDbReq("meta", "readwrite", st => st.get(key)).then(m => { if (m) { m.used = Date.now(); gwDbReq("meta", "readwrite", st => st.put(m)); } });
  return E;
}
function gwMemRam(key, E) { GW_MEM.ram.set(key, E); while (GW_MEM.ram.size > 4) GW_MEM.ram.delete(GW_MEM.ram.keys().next().value); }
async function gwMemPut(key, E, ctx) {
  gwMemRam(key, E);
  try {
    const buf = gwSerialize(E);
    const meta = { it: E.it, ms: E.ms, stats: E.stats, par: E.par };
    const info = { key, title: ctx.title, kind: E.o.board.length === 3 ? "flop" : E.o.board.length === 4 ? "turn" : "river", board: E.o.board.map(hcstr).join(""), size: buf.length, used: Date.now(), created: Date.now(), root: !!ctx.root, ctx: ctx.root ? ctx.state : null, o: { ...E.o, ranges: E.o.ranges.map(r => r.map(x => ({ c: x.c, w: x.w, key: x.key }))) } };
    await gwDbReq("sol", "readwrite", st => st.put({ key, buf: buf.buffer, meta }));
    await gwDbReq("meta", "readwrite", st => st.put(info));
    GW_MEM.list = null;
    /* tengo al massimo 40 soluzioni o circa 600 MB */
    const all = (await gwDbReq("meta", "readonly", st => st.getAll())) || [];
    all.sort((a, b) => b.used - a.used);
    let size = 0; const drop = [];
    all.forEach((m, i) => { size += m.size; if (i >= 40 || size > 600e6) drop.push(m.key); });
    for (const k of drop) { await gwDbReq("sol", "readwrite", st => st.delete(k)); await gwDbReq("meta", "readwrite", st => st.delete(k)); }
  } catch (e) { console.warn("memoria soluzioni", e); }
}
async function gwMemList() { const all = (await gwDbReq("meta", "readonly", st => st.getAll())) || []; return all.sort((a, b) => b.used - a.used); }
async function gwMemDel(key) { GW_MEM.ram.delete(key); await gwDbReq("sol", "readwrite", st => st.delete(key)); await gwDbReq("meta", "readwrite", st => st.delete(key)); }
/* contesto dello Study per riaprire una soluzione dalla libreria */
function gwMemCtx(o) {
  const P = GW.direct ? null : gwPre(), f = P && P.flop;
  const title = GW.direct ? `${GW.direct.oop} vs ${GW.direct.ip} · ${GW.direct.title}` : f ? `${f.oop} vs ${f.ip} · ${f.kind}` : "Spot";
  const root = !GW.layers.length;
  return { title, root, state: root ? { line: GW.line.slice(), board: GW.board, direct: GW.direct ? { ...GW.direct } : null, cf: GW.cf ? { ...GW.cf } : null, names: GW.direct ? [GW.direct.oop, GW.direct.ip] : f ? [f.oop, f.ip] : ["OOP", "IP"] } : null };
}
function gwLibModal() {
  const L = GW_MEM.list;
  const rows = !L ? `<p class="gwmuted">Carico...</p>` : !L.length ? `<p class="gwmuted">Nessuna soluzione salvata. Ogni spot che risolvi viene salvato qui in automatico.</p>` : `<div class="gwtable"><table><thead><tr><th>Spot</th><th>Board</th><th>Street</th><th>Precisione</th><th>Usata</th><th></th></tr></thead><tbody>${L.map(m => `<tr><td>${esc(m.title)}${m.root ? "" : ' <span class="gwmuted">(da uno spot più ampio)</span>'}</td><td class="gwtb">${(m.board.match(/../g) || []).map(c => gwCardS(c)).join("")}</td><td>${m.kind}</td><td class="mono">${m.o && m.o.sample ? m.o.sample.t + "x" + m.o.sample.r : "completa"}</td><td class="mono">${new Date(m.used).toLocaleDateString("it-IT")}</td><td style="white-space:nowrap">${m.root ? `<button class="gwbtn" data-glo="${m.key}">Apri</button> ` : ""}<button class="gwbtn ghost" data-gld="${m.key}">Elimina</button></td></tr>`).join("")}</tbody></table></div>`;
  const tot = L ? L.reduce((s, m) => s + m.size, 0) : 0;
  return `<div class="gwmodal"><div class="gwmodal-b" style="max-width:820px"><div class="gwhead"><b>💾 Soluzioni salvate</b><button class="gwbtn ghost" data-glib="0">Chiudi</button></div><p class="gwmuted" style="margin:0 0 8px">Salvate in questo browser (${fmt(tot / 1e6, 0)} MB). Quando rifai lo stesso spot con le stesse impostazioni la soluzione si apre subito, senza ricalcolare. Tengo le 40 più recenti.</p>${rows}</div></div>`;
}
async function gwLibOpen(key) {
  const all = await gwMemList(), m = all.find(x => x.key === key); if (!m || !m.ctx) return;
  const E = await gwMemGet(key, m.o); if (!E) return;
  const c = m.ctx;
  GW.line = c.line || []; GW.board = c.board || ""; GW.direct = c.direct || null; if (c.cf) GW.cf = c.cf; GW.customOpen = false; GW.showLib = false;
  GW.layers = [{ E, steps: [], oop: c.names[0], ip: c.names[1] }]; GW.cache = new Map(); GW.tab = "strat"; GW.sel = null; GW.filter = null;
  renderStudy();
}

