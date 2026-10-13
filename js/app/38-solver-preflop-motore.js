/* ================= SOLVER PREFLOP: motore ================= */
const PF_POS = ["EP", "MP", "CO", "BTN", "SB", "BB"];
const PF_POST = { SB: 0, BB: 1, EP: 2, MP: 3, CO: 4, BTN: 5 };
const PF_BLIND = { SB: 0.5, BB: 1 };
const PF_N = 169;
let PFEQ = null, PFCNT = null, PFM = null;
const pfName = k => handAt(Math.floor(k / 13), k % 13);
const pfCombos = k => combosOf(pfName(k));
function pfLoad() {
  if (PFEQ) return;
  const bin = atob(PF_B64), n = PF_N, T = n * (n + 1) / 2;
  PFEQ = new Float32Array(n * n); PFCNT = new Float32Array(n * n);
  let k = 0;
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) {
    const v = (bin.charCodeAt(2 * k) | (bin.charCodeAt(2 * k + 1) << 8)) / 10000, c = bin.charCodeAt(2 * T + k);
    PFEQ[i * n + j] = v; PFEQ[j * n + i] = i === j ? 0.5 : 1 - v;
    PFCNT[i * n + j] = PFCNT[j * n + i] = c; k++;
  }
  /* giocabilità postflop: quanto la mano realizza della sua equity */
  PFM = new Float32Array(n);
  const rv2 = ch => 14 - GRID_RANKS.indexOf(ch);
  for (let h = 0; h < n; h++) {
    const nm = pfName(h), a = rv2(nm[0]), b = rv2(nm[1]);
    let m = 1;
    if (nm.length === 2) m = a >= 7 ? 1.03 : 1.0;
    else {
      const gap = a - b - 1, suited = nm[2] === "s";
      if (suited) m += 0.05;
      if (gap === 0) m += 0.03; else if (gap === 1) m += 0.015; else if (gap >= 3) m -= suited ? 0.02 : 0.05;
      if (b >= 10) m += 0.02;
      if (!suited && b <= 7 && a <= 11) m -= 0.03;
    }
    PFM[h] = m;
  }
}
let PF_K = [0.12, 0.10];
function pfRealG(spr) { return spr >= 6 ? PF_G[0] : spr >= 3 ? PF_G[1] : spr >= 1.5 ? PF_G[2] : 1.02; }
let PF_G = [1.45, 1.25, 1.08];
function pfRealK(spr) { return spr >= 6 ? PF_K[0] : spr >= 3 ? PF_K[1] : spr >= 1.5 ? 0.05 : 0.02; }

/* Costruisce l'albero heads-up: A apre, B risponde (gli altri hanno foldato). */
function pfBuildTree(cfg) {
  const S = cfg.stack, bA = PF_BLIND[cfg.a] || 0, bB = PF_BLIND[cfg.b] || 0;
  const dead = 1.5 - bA - bB;
  const ipA = PF_POST[cfg.a] > PF_POST[cfg.b];
  const jamAll = cfg.jam === "all" || (cfg.jam === "auto" && S <= 50);
  const nodes = [], terms = [];
  const term = (t, iA, iB, extra) => { const o = { t, iA, iB, pot: iA + iB + dead, ...extra }; o.id = terms.length; terms.push(o); return o; };
  const lbl = (pre, to) => to >= S - 1e-9 ? "All-in " + fmtN(S) + "bb" : pre + " " + fmtN(Math.round(to * 10) / 10) + "bb";
  function dec(pl, iA, iB, depth, facing) {
    const node = { pl, iA, iB, acts: [], depth }; node.id = nodes.length; nodes.push(node);
    const me = pl ? iB : iA, op = pl ? iA : iB;
    const add = (lb, kind, child) => node.acts.push({ lb, kind, child });
    if (facing === "open0") {
      add("Fold", "fold", term("fold", iA, iB, { win: 1 }));
      add(lbl("Raise", cfg.open), "raise", dec(1, cfg.open, iB, 1, "open"));
      return node;
    }
    add("Fold", "fold", term("fold", iA, iB, { win: pl ? 0 : 1 }));
    const allinFacing = op >= S - 1e-9;
    const canFlat = allinFacing || (facing === "open" ? cfg.flatB : facing === "3bet" ? cfg.flatA : facing === "4bet" ? cfg.flatB4 : true);
    if (canFlat) add(allinFacing ? "Call all-in" : "Call", "call", term("call", op, op, { allin: allinFacing }));
    if (allinFacing) return node;
    const nextTo = facing === "open" ? cfg.x3 : facing === "3bet" ? cfg.x4 : S;
    const nextF = facing === "open" ? "3bet" : facing === "3bet" ? "4bet" : "5bet";
    const name = facing === "open" ? "3-bet" : facing === "3bet" ? "4-bet" : "5-bet";
    const to = nextTo >= S * 0.45 ? S : nextTo;
    const iA2 = pl ? iA : to, iB2 = pl ? to : iB;
    add(to >= S ? "All-in " + fmtN(S) + "bb" : name + " " + fmtN(to) + "bb", to >= S ? "allin" : "raise", dec(1 - pl, iA2, iB2, depth + 1, to >= S ? "allin" : nextF));
    if (to < S && (jamAll || facing === "4bet")) add("All-in " + fmtN(S) + "bb", "allin", dec(1 - pl, pl ? iA : S, pl ? S : iB, depth + 1, "allin"));
    return node;
  }
  const root = cfg.openMode === "solve" ? dec(0, bA, bB, 0, "open0") : null;
  const start = root || dec(1, cfg.open, bB, 1, "open");
  /* matrici di payoff per i terminali di call */
  pfLoad();
  const n = PF_N;
  pfTermMats(terms, cfg, S, ipA);
  return { cfg, nodes, terms, root: start, dead, ipA, openFixed: !root };
}
function pfTermMats(terms, cfg, S, ipA) {
  const n = PF_N;
  terms.forEach(t => {
    t.rake = t.t === "call" ? Math.min(t.pot * cfg.rake, cfg.cap) : 0;
    if (t.t !== "call") return;
    const MA = new Float32Array(n * n), MB = new Float32Array(n * n);
    const spr = (S - t.iA) / t.pot, k = t.allin ? 0 : pfRealK(spr), g = t.allin ? 1 : pfRealG(spr);
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
      const c = PFCNT[a * n + b]; if (!c) continue;
      const e = PFEQ[a * n + b];
      let sh = e;
      if (k) { const RA = (ipA ? 1 + k : 1 - k) * PFM[a], RB = (ipA ? 1 - k : 1 + k) * PFM[b], ea = Math.pow(e, g), eb = Math.pow(1 - e, g); sh = ea * RA / (ea * RA + eb * RB); }
      MA[a * n + b] = c * sh; MB[b * n + a] = c * (1 - sh);
    }
    t.MA = MA; t.MB = MB;
  });
}
function pfMatVec(M, r, out) {
  const n = PF_N;
  for (let a = 0; a < n; a++) { let s = 0; const o = a * n; for (let b = 0; b < n; b++) s += M[o + b] * r[b]; out[a] = s; }
  return out;
}
function pfCntVec(r) { return pfMatVec(PFCNT, r, new Float64Array(PF_N)); }
/* valore controfattuale del giocatore p in un terminale */
function pfTermVal(T, t, p, rOpp) {
  const n = PF_N, v = new Float64Array(n), cr = pfCntVec(rOpp);
  const inv = p ? t.iB : t.iA;
  if (t.t === "fold") { const gain = (t.win === p ? t.pot : 0) - inv; for (let h = 0; h < n; h++) v[h] = gain * cr[h]; return v; }
  const w = pfMatVec(p ? t.MB : t.MA, rOpp, new Float64Array(n)), net = t.pot - t.rake;
  for (let h = 0; h < n; h++) v[h] = net * w[h] - inv * cr[h];
  return v;
}
function pfInitSolve(T, openFreq) {
  const n = PF_N;
  T.nodes.forEach(nd => { const m = nd.acts.length; nd.reg = new Float64Array(m * n); nd.sum = new Float64Array(m * n); });
  T.r0 = new Float64Array(n).fill(1);
  if (T.openFixed) for (let h = 0; h < n; h++) T.r0[h] = openFreq ? openFreq[h] : 1;
  T.it = 0;
}
function pfStrat(nd, out) {
  const n = PF_N, m = nd.acts.length;
  for (let h = 0; h < n; h++) {
    let s = 0; for (let a = 0; a < m; a++) s += nd.reg[a * n + h];
    for (let a = 0; a < m; a++) out[a * n + h] = s > 0 ? nd.reg[a * n + h] / s : 1 / m;
  }
  return out;
}
function pfAvg(nd) {
  const n = PF_N, m = nd.acts.length, out = new Float64Array(m * n);
  for (let h = 0; h < n; h++) {
    let s = 0; for (let a = 0; a < m; a++) s += nd.sum[a * n + h];
    for (let a = 0; a < m; a++) out[a * n + h] = s > 0 ? nd.sum[a * n + h] / s : 1 / m;
  }
  return out;
}
function pfWalk(T, nd, p, rA, rB, w) {
  const n = PF_N;
  if (nd.t) return pfTermVal(T, nd, p, p ? rA : rB);
  const m = nd.acts.length, sg = pfStrat(nd, new Float64Array(m * n));
  const v = new Float64Array(n);
  if (nd.pl === p) {
    const rMe = p ? rB : rA, vs = [];
    for (let a = 0; a < m; a++) {
      const r2 = new Float64Array(n); for (let h = 0; h < n; h++) r2[h] = rMe[h] * sg[a * n + h];
      const va = pfWalk(T, nd.acts[a].child, p, p ? rA : r2, p ? r2 : rB, w);
      vs.push(va); for (let h = 0; h < n; h++) v[h] += sg[a * n + h] * va[h];
    }
    for (let a = 0; a < m; a++) for (let h = 0; h < n; h++) {
      const i = a * n + h;
      nd.reg[i] = Math.max(0, nd.reg[i] + vs[a][h] - v[h]);
      nd.sum[i] += w * rMe[h] * sg[i];
    }
  } else {
    const rOp = nd.pl ? rB : rA;
    for (let a = 0; a < m; a++) {
      const r2 = new Float64Array(n); for (let h = 0; h < n; h++) r2[h] = rOp[h] * sg[a * n + h];
      const va = pfWalk(T, nd.acts[a].child, p, nd.pl ? rA : r2, nd.pl ? r2 : rB, w);
      for (let h = 0; h < n; h++) v[h] += va[h];
    }
  }
  return v;
}
function pfIter(T) {
  T.it++;
  const w = T.it, ones = new Float64Array(PF_N).fill(1);
  const rootA = T.root.pl === 0 ? T.r0 : T.r0; // A usa r0 (range di apertura), B parte da 1
  const rB = T.rB0 || ones;
  if (T.openFixed) { pfWalk(T, T.root, 0, rootA, rB, w); pfWalk(T, T.root, 1, rootA, rB, w); }
  else { pfWalk(T, T.root, 0, ones, ones, w); pfWalk(T, T.root, 1, ones, ones, w); }
}
/* valutazione con la strategia media: EV, reach, equity in ogni nodo; best response per l'exploitability */
function pfEval(T, br) {
  const n = PF_N;
  const go = (nd, p, rA, rB) => {
    if (nd.t) return pfTermVal(T, nd, p, p ? rA : rB);
    const m = nd.acts.length, sg = nd.avg || (nd.avg = pfAvg(nd));
    const v = new Float64Array(n).fill(br === p && nd.pl === p ? -Infinity : 0);
    const rMe = nd.pl ? rB : rA;
    const vs = [];
    for (let a = 0; a < m; a++) {
      const r2 = new Float64Array(n); for (let h = 0; h < n; h++) r2[h] = rMe[h] * (br === nd.pl && nd.pl === p ? 1 : sg[a * n + h]);
      const va = go(nd.acts[a].child, p, nd.pl ? rA : r2, nd.pl ? r2 : rB);
      vs.push(va);
      if (nd.pl === p) { if (br === p) for (let h = 0; h < n; h++) v[h] = Math.max(v[h], va[h]); else for (let h = 0; h < n; h++) v[h] += sg[a * n + h] * va[h]; }
      else for (let h = 0; h < n; h++) v[h] += va[h];
    }
    if (br == null && nd.pl === p) {
      const rOp = nd.pl ? rA : rB, cr = pfCntVec(rOp);
      const eqN = new Float64Array(n); for (let h = 0; h < n; h++) { let s = 0; for (let b = 0; b < n; b++) s += PFCNT[h * n + b] * PFEQ[h * n + b] * rOp[b]; eqN[h] = cr[h] > 0 ? s / cr[h] : 0; }
      nd.reach = Float64Array.from(rMe); nd.cr = cr; nd.eq = eqN;
      nd.ev = new Float64Array(n); nd.evA = vs.map(va => { const e = new Float64Array(n); for (let h = 0; h < n; h++) e[h] = cr[h] > 0 ? va[h] / cr[h] : 0; return e; });
      for (let h = 0; h < n; h++) nd.ev[h] = cr[h] > 0 ? v[h] / cr[h] : 0;
    }
    return v;
  };
  const ones = new Float64Array(n).fill(1), rA0 = T.openFixed ? T.r0 : ones, rB0 = T.rB0 || ones;
  const out = [0, 1].map(p => go(T.root, p, rA0, rB0));
  const tot = [0, 1].map(p => { let s = 0; for (let h = 0; h < n; h++) s += out[p][h] * (p ? rB0[h] : rA0[h]); return s; });
  return { v: out, tot };
}
function pfExploit(T) {
  T.nodes.forEach(nd => nd.avg = pfAvg(nd));
  const base = pfEval(T, null), b0 = pfEval(T, 0), b1 = pfEval(T, 1);
  const n = PF_N, ones = new Float64Array(n).fill(1), rA0 = T.openFixed ? T.r0 : ones;
  /* normalizzo per le coppie di combo che arrivano alla radice */
  let W = 0; const cr = pfCntVec(T.rB0 || ones); for (let h = 0; h < n; h++) W += rA0[h] * cr[h];
  const g0 = (b0.tot[0] - base.tot[0]) / W, g1 = (b1.tot[1] - base.tot[1]) / W;
  T.expl = (g0 + g1) / 2; T.evA = base.tot[0] / W; T.evB = base.tot[1] / W;
  return T.expl;
}
function pfSolveAsync(T, iters, onProg, onDone) {
  let stop = false;
  const step = () => {
    if (stop) return;
    const t0 = Date.now();
    while (T.it < iters && Date.now() - t0 < 60) pfIter(T);
    onProg && onProg(T.it / iters);
    if (T.it < iters) setTimeout(step, 0); else { pfExploit(T); onDone && onDone(T); }
  };
  setTimeout(step, 0);
  return () => { stop = true; };
}

