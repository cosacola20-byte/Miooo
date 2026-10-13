/* ================= SOLVER IN PARALLELO (Web Worker su più core) ================= */
/* il flop/turn viene diviso per carta del turn (o del river): ogni worker risolve la sua parte, il thread principale le street in alto */
const MSPAR = { ws: null, ok: null, n: 0 };
function msWorkerSrc() {
  const fns = [hStr, hEval, msPrep, msRanks, msSweep, msBuildTree, msStrat, msAvg, msTerm, msEqMat, msEqFlop, msQMat, msQM, msQuickMats, msCompat, msMask, msCfr, msVal, msSampleCards, msQ4, msPerms, msPermCard, msStabH, msIsoMap, msIsoVal, msChance];
  const main = `
let E = null, A = null;
onmessage = ev => {
  const m = ev.data;
  if (m.type === "ping") { postMessage({ type: "pong" }); return; }
  if (m.type === "init") {
    const G = msPrep(m.o), tree = msBuildTree(m.o);
    E = { o: m.o, G, tree, P: m.o.pot, it: 0, iso: !!m.iso }; A = m.assign;
    const locks = new Map(m.locks || []);
    const mark = n => { if (n.t === "a") { const L = n.acts.length * G.n[n.pl]; n.reg = new Float32Array(L); n.avg = new Float32Array(L); if (locks.has(n.path)) n.lockSt = Float64Array.from(locks.get(n.path)); } if (n.ch) n.ch.forEach(mark); };
    for (const cid in A) { const c = tree.nodes[cid]; A[cid].forEach(k => mark(c.ch[k])); }
    postMessage({ type: "ready" }); return;
  }
  if (m.type === "run") {
    const G = E.G, p = m.p, np0 = G.n[p];
    const out = m.reqs.map(r => {
      const c = E.tree.nodes[r.cid], v = new Float64Array(np0);
      const mine = A[r.cid] || [], put = (k, va) => { const ix = G.byCard[p][c.deal[k]]; for (let i = 0; i < np0; i++) v[i] += va[i]; for (let q = 0; q < ix.length; q++) v[ix[q]] -= va[ix[q]]; };
      const got = new Map();
      for (const k of mine) {
        const card = c.deal[k], a = msMask(G, p, r.rp, card), b = msMask(G, 1 - p, r.ro, card);
        const va = m.mode === "cfr" ? msCfr(E, c.ch[k], p, a, b, m.t) : msVal(E, c.ch[k], p, a, b, m.br);
        put(k, va); if (E.iso && c.iso) got.set(k, va);
      }
      /* carte gemelle delle mie rappresentative: valore permutato, senza ricalcolare */
      if (E.iso && c.iso) for (let k = 0; k < c.deal.length; k++) { const kr = c.iso[k]; if (kr >= 0 && got.has(kr)) put(k, msIsoVal(G, p, got.get(kr), c.isoP[k])); }
      return { cid: r.cid, v };
    });
    postMessage({ type: "res", out }, out.map(x => x.v.buffer)); return;
  }
  if (m.type === "collect") {
    const nodes = [], bufs = [];
    for (const cid in A) { const c = E.tree.nodes[cid]; const walk = n => { if (n.t === "a") { nodes.push([n.id, n.reg, n.avg]); bufs.push(n.reg.buffer, n.avg.buffer); } if (n.ch) n.ch.forEach(walk); }; A[cid].forEach(k => walk(c.ch[k])); }
    E = null; A = null;
    postMessage({ type: "nodes", nodes }, bufs); return;
  }
};`;
  return `const HK = ${HK}; const _RC = new Int8Array(13), _SC = new Int8Array(4), _SM = new Int32Array(4); let MS_BUF = null; const MS_MINBET = ${MS_MINBET}; const fmtSv = ${fmtSv.toString()};\n` + fns.map(f => f.toString()).join("\n") + "\n" + main;
}
function msParCall(w, msg, want, transfer) {
  return new Promise((res, rej) => { w.onmessage = e => { if (e.data.type === want) res(e.data); }; w.onerror = e => rej(e); w.postMessage(msg, transfer || []); });
}
async function msParPool() {
  if (MSPAR.ok === false) return null;
  if (MSPAR.ws) return MSPAR.ws;
  try {
    const n = Math.max(1, Math.min(8, (navigator.hardwareConcurrency || 2) - 1));
    /* anche con 2 core uso un worker: così la pagina non si blocca durante il calcolo */
    const url = URL.createObjectURL(new Blob([msWorkerSrc()], { type: "text/javascript" }));
    const ws = []; for (let i = 0; i < n; i++) ws.push(new Worker(url));
    await Promise.race([Promise.all(ws.map(w => msParCall(w, { type: "ping" }, "pong"))), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000))]);
    MSPAR.ws = ws; MSPAR.ok = true; MSPAR.n = n; return ws;
  } catch (e) { MSPAR.ok = false; return null; }
}
/* nodi in alto (prima della prima carta) e nodi chance di primo livello */
function msTopChance(E) {
  const C = [];
  const go = n => { if (n.t === "c") { C.push(n); return; } if (n.ch) n.ch.forEach(go); };
  go(E.tree.root); return C;
}
function msAllocTop(E, all) {
  let mem = 0; const G = E.G;
  const go = n => { if (n.t === "a" && !n.reg) { const m = n.acts.length * G.n[n.pl]; n.reg = new Float32Array(m); n.avg = new Float32Array(m); mem += m * 8; } if (n.ch && (all || n.t !== "c")) n.ch.forEach((c, k) => { if (!(E.iso && n.t === "c" && n.iso && n.iso[k] >= 0)) go(c); }); };
  go(E.tree.root); return mem;
}
/* una passata (cfr o valore) in parallelo: prima i reach verso le chance, poi i worker, poi la risalita */
async function msParPass(E, ws, p, mode, br) {
  const G = E.G, reqs = [];
  const collect = (n, rp, ro) => {
    if (n.t === "c") { reqs.push({ cid: n.id, rp, ro }); return; }
    if (n.t !== "a") return;
    const pl = n.pl, np = G.n[pl], A = n.acts.length;
    const st = mode === "cfr" ? (n.lockSt || msStrat(n, np, new Float64Array(A * np))) : msAvg(n, np);
    if (pl === p) { for (let a = 0; a < A; a++) { const r2 = new Float64Array(np); for (let i = 0; i < np; i++) r2[i] = (mode === "val" && br && !n.lockSt) ? rp[i] : rp[i] * st[a * np + i]; collect(n.ch[a], r2, ro); } }
    else { for (let a = 0; a < A; a++) { const r2 = new Float64Array(np); let any = false; for (let i = 0; i < np; i++) { r2[i] = ro[i] * st[a * np + i]; if (r2[i]) any = true; } if (any) collect(n.ch[a], rp, r2); } }
  };
  collect(E.tree.root, G.w[p], G.w[1 - p]);
  const res = await Promise.all(ws.map(w => msParCall(w, { type: "run", mode, p, t: E.it, br, reqs }, "res")));
  const cv = new Map();
  reqs.forEach((r, q) => {
    const c = E.tree.nodes[r.cid], np0 = G.n[p], v = new Float64Array(np0);
    res.forEach(R => { const x = R.out[q].v; for (let i = 0; i < np0; i++) v[i] += x[i]; });
    if (c.samp) { const K = c.deal.length, base = K - 2 * K / c.nRem, cnt = new Float64Array(np0).fill(base); c.deal.forEach(card => { const ix = G.byCard[p][card]; for (let m = 0; m < ix.length; m++) cnt[ix[m]] -= 1; }); for (let i = 0; i < np0; i++) v[i] /= Math.max(1, cnt[i]); }
    else { const sc = 1 / (c.deal.length - 4); for (let i = 0; i < np0; i++) v[i] *= sc; }
    cv.set(r.cid + ":" + q, v);
  });
  /* risalita con gli stessi reach: le chance usano i valori dei worker nello stesso ordine */
  let qi = 0;
  const up = (n, rp, ro) => {
    if (n.t === "c") return cv.get(n.id + ":" + (qi++));
    if (n.t !== "a") return msTerm(E, n, p, ro);
    const pl = n.pl, np = G.n[pl], A = n.acts.length, np0 = G.n[p];
    if (mode === "cfr") {
      const st = n.lockSt || msStrat(n, np, new Float64Array(A * np));
      if (pl === p) {
        const vals = [], v = new Float64Array(np);
        for (let a = 0; a < A; a++) { const r2 = new Float64Array(np); for (let i = 0; i < np; i++) r2[i] = rp[i] * st[a * np + i]; const va = up(n.ch[a], r2, ro); vals.push(va); for (let i = 0; i < np; i++) v[i] += st[a * np + i] * va[i]; }
        if (n.lockSt) return v;
        const t = E.it, ta = Math.pow(t, 1.5), pos = ta / (ta + 1), neg = 0.5, g = Math.pow(t / (t + 1), 2), reg = n.reg, avg = n.avg;
        for (let a = 0; a < A; a++) { const va = vals[a]; for (let i = 0; i < np; i++) { const k = a * np + i; let r = reg[k]; r = (r > 0 ? r * pos : r * neg) + va[i] - v[i]; reg[k] = r; avg[k] = avg[k] * g + rp[i] * st[k]; } }
        return v;
      }
      const v = new Float64Array(np0);
      for (let a = 0; a < A; a++) { const r2 = new Float64Array(np); let any = false; for (let i = 0; i < np; i++) { r2[i] = ro[i] * st[a * np + i]; if (r2[i]) any = true; } if (!any) continue; const va = up(n.ch[a], rp, r2); for (let i = 0; i < np0; i++) v[i] += va[i]; }
      return v;
    }
    const st = msAvg(n, np);
    if (pl === p) {
      const bb = br && !n.lockSt, v = new Float64Array(np); if (bb) v.fill(-Infinity);
      for (let a = 0; a < A; a++) { const r2 = new Float64Array(np); for (let i = 0; i < np; i++) r2[i] = bb ? rp[i] : rp[i] * st[a * np + i]; const va = up(n.ch[a], r2, ro); for (let i = 0; i < np; i++) { if (bb) v[i] = Math.max(v[i], va[i]); else v[i] += st[a * np + i] * va[i]; } }
      return v;
    }
    const v = new Float64Array(np0);
    for (let a = 0; a < A; a++) { const r2 = new Float64Array(np); let any = false; for (let i = 0; i < np; i++) { r2[i] = ro[i] * st[a * np + i]; if (r2[i]) any = true; } if (!any) continue; const va = up(n.ch[a], rp, r2); for (let i = 0; i < np0; i++) v[i] += va[i]; }
    return v;
  };
  return up(E.tree.root, G.w[p], G.w[1 - p]);
}
/* risolve in parallelo se possibile, altrimenti sul thread principale */
let MS_PAR_LOCK = Promise.resolve();
function msSolveAuto(E, iters, onProg, onDone) {
  let release; const prev = MS_PAR_LOCK; MS_PAR_LOCK = new Promise(r => release = r);
  (async () => {
    await prev; /* un calcolo annullato finisce il passo in corso prima che parta il nuovo */
    if (E.cancel) return;
    E.iso = !!E.G.symOK && !E.tree.nodes.some(n => n.lockSt);
    const C = msTopChance(E), t0 = Date.now();
    const ws = C.length && C.some(c => c.deal.length >= 4) ? await msParPool() : null;
    if (!ws) { msAllocTop(E, true); E.par = 1; msSolveAsync(E, iters, onProg, onDone); return; }
    E.par = ws.length;
    msAllocTop(E, false);
    /* assegno le carte ai worker a rotazione, i blocchi del nodelock seguono i loro nodi */
    const assign = ws.map(() => ({})), locks = ws.map(() => []);
    C.forEach(c => { let q = 0; c.deal.forEach((_, k) => { if (E.iso && c.iso && c.iso[k] >= 0) return; const wi = (q++) % ws.length; (assign[wi][c.id] = assign[wi][c.id] || []).push(k); }); });
    const lockOf = (n, wi) => { if (n.t === "a" && n.lockSt) locks[wi].push([n.path, Array.from(n.lockSt)]); if (n.ch) n.ch.forEach(ch => lockOf(ch, wi)); };
    ws.forEach((w, wi) => { for (const cid in assign[wi]) assign[wi][cid].forEach(k => lockOf(E.tree.nodes[cid].ch[k], wi)); });
    const oo = { ...E.o, ranges: E.o.ranges.map(r => r.map(x => ({ c: x.c, w: x.w, key: x.key }))) };
    await Promise.all(ws.map((w, wi) => msParCall(w, { type: "init", o: oo, assign: assign[wi], locks: locks[wi], iso: E.iso }, "ready")));
    let last = 0;
    while (E.it < iters) {
      if (E.cancel) return;
      E.it++;
      await msParPass(E, ws, 0, "cfr"); await msParPass(E, ws, 1, "cfr");
      if (onProg && Date.now() - last > 250) { last = Date.now(); onProg(E.it / iters, Date.now() - t0); }
    }
    /* statistiche in parallelo, poi riporto le strategie dei worker nell'albero principale */
    if (E.cancel) return;
    const Z = msPairs(E); E.Z = Z;
    const tot = async br => { const out = []; for (const p of [0, 1]) { const v = await msParPass(E, ws, p, "val", br); let s = 0; for (let i = 0; i < v.length; i++) s += E.G.w[p][i] * v[i]; out.push(s / Z); } return out; };
    const ev = await tot(false), bv = await tot(true);
    E.stats = { ev, br: bv, expl: Math.max(0, (bv[0] - ev[0] + bv[1] - ev[1]) / 2) / E.P * 100 };
    const got = await Promise.all(ws.map(w => msParCall(w, { type: "collect" }, "nodes")));
    got.forEach(g => g.nodes.forEach(([id, reg, avg]) => { const n = E.tree.nodes[id]; n.reg = reg; n.avg = avg; }));
    if (E.iso) msIsoFill(E);
    E.ms = Date.now() - t0;
    onDone && onDone(E);
  })().then(() => release(), err => { release(); throw err; }).catch(err => { console.error(err); MSPAR.ok = false; MSPAR.ws = null; E.it = 0; E.tree.nodes.forEach(n => { if (n.t === "a") { n.reg = null; n.avg = null; } }); msAllocTop(E, true); msSolveAsync(E, iters, onProg, onDone); });
}

/* GW_FLOPSUB: i dati sono in js/data/gw-flopsub.js */
/* GW_BENCH: i dati sono in js/data/gw-bench.js */
/* GW_REPORTS: i dati sono in js/data/gw-reports.js */
