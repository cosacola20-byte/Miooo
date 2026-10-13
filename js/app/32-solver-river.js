/* ================= SOLVER RIVER (CFR+ vettoriale con blocker) ================= */
/* range: array di {c:[c1,c2], w, key}; carte come interi 0..51 (rank*4+seme) */
function svBuildTree(o) {
  const P = o.pot, S = o.stack, maxR = o.maxRaises ?? 1;
  let id = 0; const nodes = [];
  const mk = n => { n.id = id++; nodes.push(n); return n; };
  const betActs = (fracs, inv, pl) => {
    const out = [], seen = new Set();
    fracs.forEach(f => { let amt = Math.round(f * P * 100) / 100; if (amt >= S * 0.97) amt = S; if (amt <= 0 || seen.has(amt)) return; seen.add(amt); out.push({ kind: amt >= S ? "allin" : "bet", amt, lab: amt >= S ? "All-in" : `Bet ${Math.round(f * 100)}%`, frac: f }); });
    if (o.allin !== false && !seen.has(S)) out.push({ kind: "allin", amt: S, lab: "All-in", frac: S / P });
    return out;
  };
  function act(pl, inv, nR, afterCheck, path) {
    const opp = 1 - pl, facing = inv[opp] - inv[pl];
    const n = mk({ t: "a", pl, inv: inv.slice(), path, acts: [], ch: [] });
    const push = (a, child) => { n.acts.push(a); n.ch.push(child); };
    if (facing <= 0) {
      push({ kind: "check", lab: "Check" }, afterCheck ? mk({ t: "s", inv: inv.slice(), path: path + "x" }) : act(opp, inv, nR, true, path + "x"));
      betActs(pl === 0 ? o.oopBets : o.ipBets, inv, pl).forEach(b => { const ni = inv.slice(); ni[pl] = b.amt; push(b, act(opp, ni, nR, false, path + "b" + b.amt)); });
    } else {
      push({ kind: "fold", lab: "Fold" }, mk({ t: "f", folder: pl, inv: inv.slice(), path: path + "f" }));
      const ci = inv.slice(); ci[pl] = Math.min(S, inv[opp]);
      push({ kind: "call", lab: "Call" }, mk({ t: "s", inv: ci, path: path + "c" }));
      if (nR < maxR && inv[opp] < S) {
        const seen = new Set();
        (o.raises || []).forEach(f => { let to = Math.round((inv[opp] + f * (P + 2 * inv[opp])) * 100) / 100; if (to >= S * 0.97) to = S; if (seen.has(to)) return; seen.add(to); const ni = inv.slice(); ni[pl] = to; push({ kind: to >= S ? "allin" : "raise", amt: to, lab: to >= S ? "All-in" : `Raise a ${fmtSv(to)}` }, act(opp, ni, nR + 1, false, path + "r" + to)); });
        if (o.allin !== false && !seen.has(S)) { const ni = inv.slice(); ni[pl] = S; push({ kind: "allin", amt: S, lab: "All-in" }, act(opp, ni, nR + 1, false, path + "r" + S)); }
      }
    }
    return n;
  }
  const root = act(0, [0, 0], 0, false, "");
  return { root, nodes };
}
const fmtSv = x => String(Math.round(x * 10) / 10).replace(".", ",") + "bb";
function svPrep(o) {
  const board = o.board, bset = new Set(board);
  const R = [0, 1].map(p => o.ranges[p].filter(x => !bset.has(x.c[0]) && !bset.has(x.c[1]) && x.w > 0));
  const rank = R.map(r => r.map(x => hEval(x.c.concat(board))));
  const ord = rank.map(rk => rk.map((_, i) => i).sort((a, b) => rk[a] - rk[b]));
  // combo identici tra i due range
  const same = [0, 1].map(p => { const q = 1 - p, m = new Map(); R[q].forEach((x, j) => m.set(Math.min(x.c[0], x.c[1]) * 64 + Math.max(x.c[0], x.c[1]), j)); return R[p].map(x => { const j = m.get(Math.min(x.c[0], x.c[1]) * 64 + Math.max(x.c[0], x.c[1])); return j == null ? -1 : j; }); });
  return { R, rank, ord, same, n: R.map(r => r.length), w: R.map(r => Float64Array.from(r.map(x => x.w))) };
}
/* valori di showdown / fold per il giocatore p, dato il reach avversario ro */
function svTerminal(G, node, p, ro, P) {
  const q = 1 - p, Rp = G.R[p], Rq = G.R[q], np = G.n[p], out = new Float64Array(np);
  const cardT = new Float64Array(52); let T = 0;
  for (let j = 0; j < Rq.length; j++) { const r = ro[j]; if (!r) continue; T += r; cardT[Rq[j].c[0]] += r; cardT[Rq[j].c[1]] += r; }
  const inv = node.inv;
  if (node.t === "f") {
    const u = node.folder === p ? -inv[p] : P + inv[q];
    for (let i = 0; i < np; i++) { const c = Rp[i].c, s = G.same[p][i]; out[i] = u * (T - cardT[c[0]] - cardT[c[1]] + (s >= 0 ? ro[s] : 0)); }
    return out;
  }
  const I = inv[p], uW = P + inv[q], uL = -I, uT = (P + inv[q] - inv[p]) / 2;
  const rp = G.rank[p], rq = G.rank[q], op = G.ord[p], oq = G.ord[q];
  const cw = new Float64Array(52), W = new Float64Array(np), L = new Float64Array(np);
  let S = 0, k = 0;
  for (let a = 0; a < np; a++) { const i = op[a], ri = rp[i]; while (k < oq.length && rq[oq[k]] < ri) { const j = oq[k], r = ro[j]; if (r) { S += r; cw[Rq[j].c[0]] += r; cw[Rq[j].c[1]] += r; } k++; } const c = Rp[i].c; W[i] = S - cw[c[0]] - cw[c[1]]; }
  cw.fill(0); S = 0; k = oq.length - 1;
  for (let a = np - 1; a >= 0; a--) { const i = op[a], ri = rp[i]; while (k >= 0 && rq[oq[k]] > ri) { const j = oq[k], r = ro[j]; if (r) { S += r; cw[Rq[j].c[0]] += r; cw[Rq[j].c[1]] += r; } k--; } const c = Rp[i].c; L[i] = S - cw[c[0]] - cw[c[1]]; }
  for (let i = 0; i < np; i++) { const c = Rp[i].c, s = G.same[p][i]; const tot = T - cardT[c[0]] - cardT[c[1]] + (s >= 0 ? ro[s] : 0); const Ti = tot - W[i] - L[i]; out[i] = uW * W[i] + uL * L[i] + uT * Ti; }
  return out;
}
function svInit(o) {
  const G = svPrep(o), tree = svBuildTree(o);
  tree.nodes.forEach(n => { if (n.t !== "a") return; const m = n.acts.length * G.n[n.pl]; n.reg = new Float64Array(m); n.avg = new Float64Array(m); });
  // per il nodelock: ordine di forza del giocatore bloccato
  return { o, G, tree, it: 0, P: o.pot };
}
function svStrat(n, np, out) {
  const A = n.acts.length;
  for (let i = 0; i < np; i++) { let s = 0; for (let a = 0; a < A; a++) { const r = n.reg[a * np + i]; if (r > 0) s += r; } for (let a = 0; a < A; a++) { const r = n.reg[a * np + i]; out[a * np + i] = s > 0 ? (r > 0 ? r / s : 0) : 1 / A; } }
  return out;
}
/* strategia bloccata (nodelock): fold dei più deboli fino alla frequenza richiesta; raise dei più forti se richiesto,
   altrimenti la parte che non folda si divide tra call e raise come dice il CFR */
function svLocked(E, n, reach, out) {
  const L = n.lock, p = n.pl, G = E.G, np = G.n[p], A = n.acts.length, ord = G.ord[p];
  const base = svStrat(n, np, new Float64Array(A * np));
  out.fill(0);
  let T = 0; for (let i = 0; i < np; i++) T += reach[i];
  const fi = n.acts.findIndex(a => a.kind === "fold"), ci = n.acts.findIndex(a => a.kind === "call");
  const rIdx = n.acts.map((a, k) => a.kind === "raise" || a.kind === "allin" ? k : -1).filter(k => k >= 0);
  let fNeed = (L.fold || 0) * T;
  for (let a = 0; a < np; a++) {
    const i = ord[a], r = reach[i];
    let f = 0; if (fNeed > 1e-12) { f = r > 0 ? Math.min(1, fNeed / r) : 1; fNeed -= f * r; }
    out[fi * np + i] = f;
    const rest = 1 - f;
    if (L.raise != null) { out[ci * np + i] = rest; }
    else { let s = base[ci * np + i]; rIdx.forEach(k => s += base[k * np + i]); if (s <= 1e-12) out[ci * np + i] = rest; else { out[ci * np + i] = rest * base[ci * np + i] / s; rIdx.forEach(k => out[k * np + i] = rest * base[k * np + i] / s); } }
  }
  if (L.raise != null && L.raise > 0 && rIdx.length) { let rNeed = L.raise * T; const k0 = rIdx[0]; for (let a = np - 1; a >= 0 && rNeed > 1e-12; a--) { const i = ord[a], r = reach[i], c = out[ci * np + i]; if (c <= 0) continue; const x = r > 0 ? Math.min(c, rNeed / r) : c; out[ci * np + i] -= x; out[k0 * np + i] += x; rNeed -= x * r; } }
  return out;
}
/* applica il nodelock al giocatore v: fn(frazione della bet affrontata, lui ha già checkato?) -> {fold, raise} o null */
function svApplyLocks(E, v, fn) {
  E.tree.nodes.forEach(n => { n.lock = null; if (n.t !== "a" || n.pl !== v) return; const q = 1 - v; if (n.inv[v] !== 0 || n.inv[q] <= 0) return; const fr = n.inv[q] / E.P; const L = fn(fr, n.path.startsWith("x") ? v === 0 : false); if (L) n.lock = L; });
}
function svCfr(E, n, p, rp, ro, t) {
  const G = E.G;
  if (n.t !== "a") return svTerminal(G, n, p, ro, E.P);
  const pl = n.pl, np = G.n[pl], A = n.acts.length;
  const st = new Float64Array(A * np);
  if (n.lock) svLocked(E, n, pl === p ? rp : ro, st); else svStrat(n, np, st);
  if (pl === p) {
    const vals = [], v = new Float64Array(np);
    for (let a = 0; a < A; a++) { const r2 = new Float64Array(np); for (let i = 0; i < np; i++) r2[i] = rp[i] * st[a * np + i]; const va = svCfr(E, n.ch[a], p, r2, ro, t); vals.push(va); for (let i = 0; i < np; i++) v[i] += st[a * np + i] * va[i]; }
    for (let a = 0; a < A; a++) for (let i = 0; i < np; i++) { const k = a * np + i; const r = n.reg[k] + vals[a][i] - v[i]; n.reg[k] = r > 0 ? r : 0; n.avg[k] += t * rp[i] * st[k]; }
    return v;
  }
  const v = new Float64Array(G.n[p]);
  for (let a = 0; a < A; a++) { const r2 = new Float64Array(np); let any = false; for (let i = 0; i < np; i++) { r2[i] = ro[i] * st[a * np + i]; if (r2[i]) any = true; } if (!any) continue; const va = svCfr(E, n.ch[a], p, rp, r2, t); for (let i = 0; i < va.length; i++) v[i] += va[i]; }
  return v;
}
function svRun(E, iters) {
  const G = E.G;
  for (let k = 0; k < iters; k++) { E.it++; const t = E.it; for (let p = 0; p < 2; p++) svCfr(E, E.tree.root, p, G.w[p], G.w[1 - p], t); }
}
/* strategia media di un nodo (per combo) */
function svAvg(E, n) {
  const np = E.G.n[n.pl], A = n.acts.length, out = new Float64Array(A * np);
  for (let i = 0; i < np; i++) { let s = 0; for (let a = 0; a < A; a++) s += n.avg[a * np + i]; for (let a = 0; a < A; a++) out[a * np + i] = s > 0 ? n.avg[a * np + i] / s : 1 / A; }
  return out;
}
/* valore del giocatore p con strategie medie (br = true: miglior risposta di p) */
function svVal(E, n, p, rp, ro, br) {
  const G = E.G;
  if (n.t !== "a") return svTerminal(G, n, p, ro, E.P);
  const pl = n.pl, np = G.n[pl], A = n.acts.length;
  const st = n.lock ? svLocked(E, n, pl === p ? rp : ro, new Float64Array(A * np)) : svAvg(E, n);
  if (pl === p) {
    const v = new Float64Array(np); if (br && !n.lock) v.fill(-Infinity);
    for (let a = 0; a < A; a++) { const r2 = new Float64Array(np); for (let i = 0; i < np; i++) r2[i] = rp[i] * st[a * np + i]; const va = svVal(E, n.ch[a], p, br ? rp : r2, ro, br); for (let i = 0; i < np; i++) { if (br && !n.lock) v[i] = Math.max(v[i], va[i]); else v[i] += st[a * np + i] * va[i]; } }
    return v;
  }
  const v = new Float64Array(G.n[p]);
  for (let a = 0; a < A; a++) { const r2 = new Float64Array(np); let any = false; for (let i = 0; i < np; i++) { r2[i] = ro[i] * st[a * np + i]; if (r2[i]) any = true; } if (!any) continue; const va = svVal(E, n.ch[a], p, rp, r2, br); for (let i = 0; i < va.length; i++) v[i] += va[i]; }
  return v;
}
function svPairs(E) { const G = E.G; const ones = G.w[1]; const v = svTerminal(G, { t: "f", folder: 1, inv: [0, 0] }, 0, ones, 1); let Z = 0; for (let i = 0; i < G.n[0]; i++) Z += G.w[0][i] * v[i]; return Z; }
/* EV medi e sfruttabilità (in % del piatto) */
function svStats(E) {
  const G = E.G, Z = E.Z || (E.Z = svPairs(E));
  const ev = [0, 1].map(p => { const v = svVal(E, E.tree.root, p, G.w[p], G.w[1 - p], false); let s = 0; for (let i = 0; i < v.length; i++) s += G.w[p][i] * v[i]; return s / Z; });
  const br = [0, 1].map(p => { const v = svVal(E, E.tree.root, p, G.w[p], G.w[1 - p], true); let s = 0; for (let i = 0; i < v.length; i++) s += G.w[p][i] * v[i]; return s / Z; });
  return { ev, br, expl: Math.max(0, (br[0] + br[1] - E.P) / 2) / E.P * 100 };
}
/* reach dei due giocatori fino a un nodo (strategie medie) */
function svReachTo(E, node) {
  const G = E.G, r = [Float64Array.from(G.w[0]), Float64Array.from(G.w[1])];
  const walk = (n) => {
    if (n === node) return true;
    if (n.t !== "a") return false;
    const np = G.n[n.pl], st = n.lock ? svLocked(E, n, r[n.pl], new Float64Array(n.acts.length * np)) : svAvg(E, n);
    for (let a = 0; a < n.acts.length; a++) {
      const save = Float64Array.from(r[n.pl]);
      for (let i = 0; i < np; i++) r[n.pl][i] = save[i] * st[a * np + i];
      if (walk(n.ch[a])) return true;
      r[n.pl] = save;
    }
    return false;
  };
  walk(E.tree.root);
  return r;
}
/* per il giocatore che agisce al nodo: strategia, EV per azione e reach, combo per combo */
function svNodeInfo(E, node) {
  const G = E.G, pl = node.pl, q = 1 - pl, np = G.n[pl], A = node.acts.length;
  const [r0, r1] = svReachTo(E, node), rp = pl === 0 ? r0 : r1, ro = pl === 0 ? r1 : r0;
  const st = node.lock ? svLocked(E, node, rp, new Float64Array(A * np)) : svAvg(E, node);
  const norm = svTerminal(G, { t: "f", folder: q, inv: [0, 0] }, pl, ro, 1); // somma reach avversario non bloccata
  const evA = node.ch.map(ch => { const v = svVal(E, ch, pl, rp, ro, false); return Array.from(v, (x, i) => norm[i] > 1e-12 ? x / norm[i] : null); });
  const freq = node.acts.map((_, a) => { let s = 0, t = 0; for (let i = 0; i < np; i++) { s += rp[i] * st[a * np + i]; t += rp[i]; } return t > 0 ? s / t : 0; });
  return { pl, st, evA, rp, ro, freq, np, combos: G.R[pl] };
}


