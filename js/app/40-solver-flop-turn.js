/* ================= SOLVER FLOP / TURN (DCFR vettoriale multi-street) ================= */
/* o: { board:[int], pot, stack, ranges:[[{c,w,key}],[...]], sz:{3:{oop,ip,rz},4:{...},5:{...}}, allin, maxR, iters } */
function msPrep(o) {
  const board = o.board, bset = new Set(board);
  const R = [0, 1].map(p => o.ranges[p].filter(x => !bset.has(x.c[0]) && !bset.has(x.c[1]) && x.w > 0));
  const n = R.map(r => r.length);
  const c0 = R.map(r => Int32Array.from(r.map(x => x.c[0]))), c1 = R.map(r => Int32Array.from(r.map(x => x.c[1])));
  const same = [0, 1].map(p => { const q = 1 - p, m = new Map(); R[q].forEach((x, j) => m.set(Math.min(x.c[0], x.c[1]) * 64 + Math.max(x.c[0], x.c[1]), j)); return Int32Array.from(R[p].map(x => { const j = m.get(Math.min(x.c[0], x.c[1]) * 64 + Math.max(x.c[0], x.c[1])); return j == null ? -1 : j; })); });
  /* combo che contengono ogni carta */
  const byCard = [0, 1].map(p => { const a = Array.from({ length: 52 }, () => []); for (let i = 0; i < n[p]; i++) { a[c0[p][i]].push(i); a[c1[p][i]].push(i); } return a.map(x => Int32Array.from(x)); });
  const deck = []; for (let c = 0; c < 52; c++) if (!bset.has(c)) deck.push(c);
  const G = { R, n, c0, c1, same, byCard, deck, board, w: R.map(r => Float64Array.from(r.map(x => x.w))), ranks: new Map(), pm: [new Map(), new Map()] };
  /* simmetria dei semi: i range devono essere uguali sotto ogni permutazione che lascia fermo il board */
  G.H0 = msStabH(board, []); G.symOK = G.H0.length > 1;
  for (const h of G.H0) { if (!G.symOK) break; for (let p = 0; p < 2 && G.symOK; p++) { const mp = msIsoMap(G, p, h), w = G.w[p]; for (let i = 0; i < n[p]; i++) { const j = mp[i]; if (j < 0 || Math.abs(w[j] - w[i]) > 1e-6 * Math.max(1, w[i])) { G.symOK = false; break; } } } }
  return G;
}
/* le 24 permutazioni dei semi (carta = rango*4 + seme) */
function msPerms() {
  if (msPerms.c) return msPerms.c;
  const out = [], rec = (a, rest) => { if (!rest.length) { out.push(a); return; } rest.forEach((x, i) => rec([...a, x], rest.filter((_, j) => j !== i))); };
  rec([], [0, 1, 2, 3]);
  const inv = out.map(pm => { const q = [0, 0, 0, 0]; pm.forEach((t, s) => q[t] = s); return out.findIndex(o => o.every((v, i) => v === q[i])); });
  return (msPerms.c = { P: out, inv });
}
function msPermCard(h, c) { return (c & ~3) | msPerms().P[h][c & 3]; }
/* permutazioni che lasciano fermo il board iniziale (come insieme) e ogni carta uscita dopo */
function msStabH(board, cards) {
  const key = board.join(",") + "|" + cards.join(","), C = msStabH.cache || (msStabH.cache = new Map());
  if (C.has(key)) return C.get(key);
  const bs = new Set(board), out = [];
  msPerms().P.forEach((pm, h) => { if (board.every(c => bs.has(msPermCard(h, c))) && cards.every(c => msPermCard(h, c) === c)) out.push(h); });
  C.set(key, out); return out;
}
/* combo di p -> indice della combo permutata con h (-1 se non c'è nel range) */
function msIsoMap(G, p, h) {
  let m = G.pm[p].get(h); if (m) return m;
  if (!G.keyIx) G.keyIx = [0, 1].map(q => { const mm = new Map(); for (let i = 0; i < G.n[q]; i++) { const a = G.c0[q][i], b = G.c1[q][i]; mm.set(Math.min(a, b) * 64 + Math.max(a, b), i); } return mm; });
  const np = G.n[p], K = G.keyIx[p]; m = new Int32Array(np);
  for (let i = 0; i < np; i++) { const a = msPermCard(h, G.c0[p][i]), b = msPermCard(h, G.c1[p][i]), j = K.get(Math.min(a, b) * 64 + Math.max(a, b)); m[i] = j == null ? -1 : j; }
  G.pm[p].set(h, m); return m;
}
/* valore di una carta "gemella": permuto il vettore della carta rappresentativa */
function msIsoVal(G, p, src, h) { const mp = msIsoMap(G, p, msPerms().inv[h]), out = new Float64Array(G.n[p]); for (let i = 0; i < out.length; i++) { const j = mp[i]; out[i] = j >= 0 ? src[j] : 0; } return out; }
/* dopo il calcolo: le carte gemelle prendono la strategia della rappresentativa, con i semi permutati */
function msIsoFill(E) {
  const G = E.G;
  const copy = (s, d, h) => {
    if (d.t === "a") { const np = G.n[d.pl], A = d.acts.length, mp = msIsoMap(G, d.pl, msPerms().inv[h]); const cp = src => { if (!src) return null; const out = new Float32Array(A * np); for (let a = 0; a < A; a++) for (let i = 0; i < np; i++) { const j = mp[i]; out[a * np + i] = j >= 0 ? src[a * np + j] : 0; } return out; }; d.avg = cp(s.avg); d.reg = cp(s.reg) || new Float32Array(A * np); }
    if (d.ch) d.ch.forEach((c, k) => copy(s.ch[k], c, h));
  };
  const fill = n => { if (!n.ch) return; if (n.t === "c" && n.iso) { n.ch.forEach((c, k) => { if (n.iso[k] < 0) fill(c); }); n.ch.forEach((c, k) => { if (n.iso[k] >= 0) copy(n.ch[n.iso[k]], c, n.isoP[k]); }); } else n.ch.forEach(fill); };
  fill(E.tree.root);
}
/* forza di tutte le combo su un board completo (cache) */
function msRanks(G, b5) {
  const key = b5.slice().sort((a, b) => a - b).join(",");
  let e = G.ranks.get(key);
  if (e) return e;
  const bs = new Set(b5);
  e = [0, 1].map(p => {
    const np = G.n[p], rk = new Int32Array(np);
    for (let i = 0; i < np; i++) { const a = G.c0[p][i], b = G.c1[p][i]; rk[i] = bs.has(a) || bs.has(b) ? -1 : hEval([a, b, ...b5]); }
    const ord = Int32Array.from(Array.from(rk.keys()).sort((x, y) => rk[x] - rk[y]));
    return { rk, ord };
  });
  G.ranks.set(key, e);
  return e;
}
/* showdown su un board completo: aggiunge a out i valori di p (scala sc), escludendo le combo con carte "dead" */
let MS_BUF = null;
function msSweep(G, b5, p, ro, uW, uL, sc, out, R5) {
  const q = 1 - p, E = R5 || msRanks(G, b5), rp = E[p].rk, rq = E[q].rk, op = E[p].ord, oq = E[q].ord;
  const np = G.n[p], nq = G.n[q], pc0 = G.c0[p], pc1 = G.c1[p], qc0 = G.c0[q], qc1 = G.c1[q], sm = G.same[p];
  const mx = Math.max(G.n[0], G.n[1]);
  if (!MS_BUF || MS_BUF.W.length < mx) MS_BUF = { cw: new Float64Array(52), cardT: new Float64Array(52), W: new Float64Array(mx), L: new Float64Array(mx) };
  const cw = MS_BUF.cw, cardT = MS_BUF.cardT, W = MS_BUF.W, L = MS_BUF.L;
  cw.fill(0); cardT.fill(0);
  let T = 0;
  for (let j = 0; j < nq; j++) { const r = ro[j]; if (!r || rq[j] < 0) continue; T += r; cardT[qc0[j]] += r; cardT[qc1[j]] += r; }
  let S = 0, k = 0;
  for (let a = 0; a < np; a++) { const i = op[a], ri = rp[i]; if (ri < 0) continue; while (k < nq && rq[oq[k]] < ri) { const j = oq[k], r = ro[j]; if (r && rq[j] >= 0) { S += r; cw[qc0[j]] += r; cw[qc1[j]] += r; } k++; } W[i] = S - cw[pc0[i]] - cw[pc1[i]]; }
  cw.fill(0); S = 0; k = nq - 1;
  for (let a = np - 1; a >= 0; a--) { const i = op[a], ri = rp[i]; if (ri < 0) break; while (k >= 0 && rq[oq[k]] > ri) { const j = oq[k], r = ro[j]; if (r && rq[j] >= 0) { S += r; cw[qc0[j]] += r; cw[qc1[j]] += r; } k--; } L[i] = S - cw[pc0[i]] - cw[pc1[i]]; }
  const uT = (uW + uL) / 2;
  for (let i = 0; i < np; i++) { if (rp[i] < 0) continue; const s = sm[i]; const tot = T - cardT[pc0[i]] - cardT[pc1[i]] + (s >= 0 && rq[s] >= 0 ? ro[s] : 0); out[i] += sc * (uW * W[i] + uL * L[i] + uT * (tot - W[i] - L[i])); }
}
function msBuildTree(o) {
  const P = o.pot, S = o.stack, lastBet = o.flopOnly ? 3 : o.sample ? 5 : o.board.length === 3 ? 4 : 5;
  const nodes = [];
  const mk = n => { n.id = nodes.length; nodes.push(n); return n; };
  const lab = f => `Bet ${Math.round(f * 100)}%`;
  function closeLine(inv, st, cards, path) {
    if (inv[0] >= S - 1e-9 || st >= lastBet) {
      const known = o.board.length + cards.length;
      return mk({ t: known >= 5 ? "s" : "q", inv: inv.slice(), cards: cards.slice(), path, st });
    }
    return chance(inv, st + 1, cards, path);
  }
  function chance(inv, st, cards, path) {
    const used = new Set([...o.board, ...cards]);
    const n = mk({ t: "c", inv: inv.slice(), st, cards: cards.slice(), path, deal: [], ch: [] });
    let list = []; for (let c = 0; c < 52; c++) if (!used.has(c)) list.push(c);
    n.nRem = list.length;
    /* carte equivalenti per simmetria dei semi: raggruppate in orbite, ognuna con una carta rappresentativa */
    const H = o.noIso ? [] : msStabH(o.board, cards); let rep = null;
    if (H.length > 1) { rep = new Map(); for (const c of list) { let r = c; for (const h of H) { const x = msPermCard(h, c); if (x < r) r = x; } rep.set(c, r); } }
    if (o.sample && o.board.length === 3) {
      const K = st === 4 ? o.sample.t : o.sample.r;
      if (rep) { const reps = [...new Set(list.map(c => rep.get(c)))].sort((a, b) => a - b); if (K < reps.length) { const pick = new Set(msSampleCards(reps, K, cards.length ? cards[0] : 0)); list = list.filter(c => pick.has(rep.get(c))); n.samp = true; } }
      else if (K < list.length) { list = msSampleCards(list, K, cards.length ? cards[0] : 0); n.samp = true; }
    }
    n.deal = list.slice(); n.ch = new Array(list.length);
    const kOf = new Map(); list.forEach((c, k) => kOf.set(c, k));
    list.forEach((c, k) => { if (!rep || rep.get(c) === c) n.ch[k] = act(0, inv, 0, false, st, [...cards, c], path + "|" + c + ":"); });
    if (rep && list.some(c => rep.get(c) !== c)) {
      n.iso = new Int32Array(list.length).fill(-1); n.isoP = new Int8Array(list.length).fill(-1);
      list.forEach((c, k) => { const r = rep.get(c); if (r === c) return; const kr = kOf.get(r), h = H.find(x => msPermCard(x, r) === c); n.iso[k] = kr; n.isoP[k] = h; n.ch[k] = clone(n.ch[kr], h, path + "|" + r + ":", path + "|" + c + ":"); });
    }
    return n;
  }
  /* copia strutturale di un sottoalbero con i semi permutati (per le carte gemelle) */
  function clone(s, h, pre0, pre1) {
    const pc = c => msPermCard(h, c);
    const d = { ...s }; delete d.id;
    d.cards = s.cards.map(pc); if (s.inv) d.inv = s.inv.slice();
    d.path = pre1 + s.path.slice(pre0.length).replace(/\|(\d+):/g, (m, x) => "|" + pc(+x) + ":");
    if (s.t === "c") { d.deal = s.deal.map(pc); d.iso = null; d.isoP = null; }
    mk(d);
    if (s.ch) d.ch = s.ch.map(c => clone(c, h, pre0, pre1));
    return d;
  }
  function act(pl, inv, nR, afterCheck, st, cards, path) {
    const opp = 1 - pl, base = Math.min(inv[0], inv[1]), potS = P + 2 * base;
    const cfg = o.sz[st] || { oop: [], ip: [], rz: [] };
    const n = mk({ t: "a", pl, inv: inv.slice(), st, cards: cards.slice(), path, acts: [], ch: [] });
    const push = (a, child) => { n.acts.push(a); n.ch.push(child); };
    const facing = inv[opp] - inv[pl];
    if (facing <= 0) {
      push({ kind: "check", lab: "Check" }, afterCheck ? closeLine(inv, st, cards, path + "x") : act(opp, inv, nR, true, st, cards, path + "x"));
      const seen = new Set();
      (pl === 0 ? cfg.oop : cfg.ip).forEach(f => { /* puntata minima: 1bb */ const bet = Math.max(f * potS, MS_MINBET); let to = Math.round((base + bet) * 100) / 100; if (to >= S * 0.97) to = S; if (to <= base || seen.has(to)) return; seen.add(to); const ni = inv.slice(); ni[pl] = to; const fr = bet > f * potS ? (to - base) / potS : f; push({ kind: to >= S ? "allin" : "bet", amt: to, lab: to >= S ? "All-in" : lab(fr), frac: fr }, act(opp, ni, nR, false, st, cards, path + "b" + f)); });
      if (o.allin !== false && !seen.has(S) && S > base && (pl === 0 ? cfg.oop : cfg.ip).length && (st === 5 || S - base <= 3 * potS)) /* al river l'all-in c'è sempre, al posto delle overbet enormi */ { const ni = inv.slice(); ni[pl] = S; push({ kind: "allin", amt: S, lab: "All-in", frac: (S - base) / potS }, act(opp, ni, nR, false, st, cards, path + "A")); }
    } else {
      push({ kind: "fold", lab: "Fold" }, mk({ t: "f", folder: pl, inv: inv.slice(), st, cards: cards.slice(), path: path + "f" }));
      const ci = inv.slice(); ci[pl] = Math.min(S, inv[opp]);
      push({ kind: "call", lab: "Call" }, closeLine(ci, st, cards, path + "c"));
      if (nR < (o.maxR ?? 1) && inv[opp] < S) {
        const seen = new Set(), so = inv[opp] - base;
        (nR === 0 ? (cfg.rz || []) : (cfg.rz2 || [])).forEach(f => { /* primo raise con rz, re-raise con rz2; rilancio minimo: almeno quanto la puntata, e mai meno di 1bb */ let to = Math.round((base + so + Math.max(f * (potS + 2 * so), so, MS_MINBET)) * 100) / 100; if (to >= S * 0.97) to = S; if (seen.has(to)) return; seen.add(to); const ni = inv.slice(); ni[pl] = to; push({ kind: to >= S ? "allin" : "raise", amt: to, lab: to >= S ? "All-in" : `Raise a ${fmtSv(to - base)}` }, act(opp, ni, nR + 1, false, st, cards, path + "r" + f)); });
        if (o.allin !== false && !seen.has(S)) { const ni = inv.slice(); ni[pl] = S; push({ kind: "allin", amt: S, lab: "All-in" }, act(opp, ni, nR + 1, false, st, cards, path + "rA")); }
      }
    }
    return n;
  }
  const root = act(0, [0, 0], 0, false, o.board.length, [], "");
  return { root, nodes, lastBet };
}
const MS_MINBET = 1;
function msInit(o, G0, lazy) {
  const G = G0 || msPrep(o), tree = msBuildTree(o);
  let mem = 0;
  tree.nodes.forEach(n => { if (n.t !== "a") return; const m = n.acts.length * G.n[n.pl]; if (!lazy) { n.reg = new Float32Array(m); n.avg = new Float32Array(m); } mem += m * 8; });
  return { o, G, tree, it: 0, P: o.pot, mem, nAct: tree.nodes.filter(n => n.t === "a").length };
}
function msStrat(n, np, out) {
  const A = n.acts.length, reg = n.reg;
  for (let i = 0; i < np; i++) { let s = 0; for (let a = 0; a < A; a++) { const r = reg[a * np + i]; if (r > 0) s += r; } if (s > 0) for (let a = 0; a < A; a++) { const r = reg[a * np + i]; out[a * np + i] = r > 0 ? r / s : 0; } else for (let a = 0; a < A; a++) out[a * np + i] = 1 / A; }
  return out;
}
function msAvg(n, np) {
  if (n.lockSt) return n.lockSt;
  const A = n.acts.length, out = new Float64Array(A * np);
  for (let i = 0; i < np; i++) { let s = 0; for (let a = 0; a < A; a++) s += n.avg[a * np + i]; for (let a = 0; a < A; a++) out[a * np + i] = s > 0 ? n.avg[a * np + i] / s : 1 / A; }
  return out;
}
/* valore terminale per p */
function msTerm(E, n, p, ro) {
  const G = E.G, q = 1 - p, np = G.n[p], out = new Float64Array(np), inv = n.inv, P = E.P;
  if (n.t === "f") {
    const cardT = new Float64Array(52), qc0 = G.c0[q], qc1 = G.c1[q]; let T = 0;
    for (let j = 0; j < G.n[q]; j++) { const r = ro[j]; if (!r) continue; T += r; cardT[qc0[j]] += r; cardT[qc1[j]] += r; }
    const rk = E.o.rake ? Math.min((P + inv[0] + inv[1]) * E.o.rake, E.o.cap ?? 99) : 0;
    const u = n.folder === p ? -inv[p] : P + inv[q] - rk, sm = G.same[p], pc0 = G.c0[p], pc1 = G.c1[p];
    for (let i = 0; i < np; i++) { const s = sm[i]; out[i] = u * (T - cardT[pc0[i]] - cardT[pc1[i]] + (s >= 0 ? ro[s] : 0)); }
    return out;
  }
  const rk2 = E.o.rake ? Math.min((P + inv[0] + inv[1]) * E.o.rake, E.o.cap ?? 99) : 0;
  const uW = P + inv[q] - rk2, uL = -inv[p], b = [...G.board, ...n.cards];
  if (n.t === "s") { msSweep(G, b, p, ro, uW, uL, 1, out, n._rk || (n._rk = msRanks(G, b))); return out; }
  if (E.o.flopOnly) return msQM(E, n.inv[0] >= E.o.stack - 1e-9, p, ro, uW, uL, out);
  /* "q": media su tutte le carte mancanti (runout), con le matrici di equity del turn */
  if (b.length === 4) return msQMat(E, n._M || (n._M = msEqMat(G, b)), p, ro, uW, uL, out);
  return msQMat(E, msEqFlop(G), p, ro, uW, uL, out);
}
function msCompat(G, p, ro) {
  const q = 1 - p, np = G.n[p], out = new Float64Array(np), cardT = new Float64Array(52), qc0 = G.c0[q], qc1 = G.c1[q]; let T = 0;
  for (let j = 0; j < G.n[q]; j++) { const r = ro[j]; if (!r) continue; T += r; cardT[qc0[j]] += r; cardT[qc1[j]] += r; }
  const sm = G.same[p], pc0 = G.c0[p], pc1 = G.c1[p];
  for (let i = 0; i < np; i++) { const s = sm[i]; out[i] = T - cardT[pc0[i]] - cardT[pc1[i]] + (s >= 0 ? ro[s] : 0); }
  return out;
}
/* matrice di equity (OOP contro IP) su un board di 4 carte, media sui river */
function msEqMat(G, b4) {
  const key = b4.slice().sort((a, b) => a - b).join(",");
  G.eqm = G.eqm || new Map();
  let M = G.eqm.get(key); if (M) return M;
  const n0 = G.n[0], n1 = G.n[1];
  if (!G.V) { G.V = new Uint8Array(n0 * n1); for (let i = 0; i < n0; i++) { const a = G.c0[0][i], b = G.c1[0][i]; for (let j = 0; j < n1; j++) { const c = G.c0[1][j], d = G.c1[1][j]; G.V[i * n1 + j] = a !== c && a !== d && b !== c && b !== d ? 1 : 0; } } }
  M = new Float32Array(n0 * n1);
  const used = new Set(b4);
  for (let r = 0; r < 52; r++) {
    if (used.has(r)) continue;
    const R5 = msRanks(G, [...b4, r]), r0 = R5[0].rk, r1 = R5[1].rk;
    for (let i = 0; i < n0; i++) { const ri = r0[i]; if (ri < 0) continue; const o = i * n1; for (let j = 0; j < n1; j++) { const rj = r1[j]; if (rj < 0) continue; M[o + j] += ri > rj ? 1 : ri === rj ? 0.5 : 0; } }
  }
  const V = G.V; for (let k = 0; k < M.length; k++) M[k] = V[k] ? M[k] / 44 : 0;
  G.eqm.set(key, M);
  return M;
}
function msQ4(E, b4, p, ro, uW, uL, sc, out, dead) {
  const G = E.G, M = msEqMat(G, b4), n0 = G.n[0], n1 = G.n[1], C = msCompat(G, p, ro);
  const np = G.n[p], d = uW - uL;
  const skip = dead != null ? G.byCard[p][dead] : null;
  const wv = new Float64Array(np);
  if (p === 0) { for (let i = 0; i < n0; i++) { let s = 0; const o = i * n1; for (let j = 0; j < n1; j++) s += M[o + j] * ro[j]; wv[i] = s; } }
  else { const acc = new Float64Array(n1); for (let i = 0; i < n0; i++) { const r = ro[i]; if (!r) continue; const o = i * n1; for (let j = 0; j < n1; j++) acc[j] += M[o + j] * r; } for (let j = 0; j < n1; j++) wv[j] = C[j] - acc[j]; }
  if (skip) { const tmp = new Float64Array(np); for (let i = 0; i < np; i++) tmp[i] = uL * C[i] + d * wv[i]; for (let k = 0; k < skip.length; k++) tmp[skip[k]] = 0; for (let i = 0; i < np; i++) out[i] += sc * tmp[i]; }
  else for (let i = 0; i < np; i++) out[i] += sc * (uL * C[i] + d * wv[i]);
  return out;
}
function msMask(G, p, r, card) { const out = Float64Array.from(r); const ix = G.byCard[p][card]; for (let k = 0; k < ix.length; k++) out[ix[k]] = 0; return out; }
/* nodo chance: media sulle carte; con la simmetria calcolo solo le rappresentative e permuto il loro valore */
function msChance(E, n, p, rec, rp, ro) {
  const G = E.G, np0 = G.n[p], v = new Float64Array(np0), sc = n.samp ? 1 : 1 / (n.deal.length - 4), cnt = n.samp ? new Float64Array(np0).fill(n.deal.length - 2 * n.deal.length / n.nRem) : null;
  const iso = E.iso && n.iso, vr = iso ? new Array(n.deal.length) : null;
  const add = (k, va) => { const ix = G.byCard[p][n.deal[k]]; for (let i = 0; i < np0; i++) v[i] += sc * va[i]; for (let m = 0; m < ix.length; m++) { v[ix[m]] -= sc * va[ix[m]]; if (cnt) cnt[ix[m]] -= 1; } };
  for (let k = 0; k < n.deal.length; k++) { if (iso && n.iso[k] >= 0) continue; const c = n.deal[k]; const va = rec(n.ch[k], msMask(G, p, rp, c), msMask(G, 1 - p, ro, c)); if (iso) vr[k] = va; add(k, va); }
  if (iso) for (let k = 0; k < n.deal.length; k++) if (n.iso[k] >= 0) add(k, msIsoVal(G, p, vr[n.iso[k]], n.isoP[k]));
  if (cnt) for (let i = 0; i < np0; i++) v[i] /= Math.max(1, cnt[i]);
  return v;
}
function msCfr(E, n, p, rp, ro, t) {
  const G = E.G;
  if (n.t === "f" || n.t === "s" || n.t === "q") return msTerm(E, n, p, ro);
  const np0 = G.n[p];
  if (n.t === "c") return msChance(E, n, p, (ch, a, b) => msCfr(E, ch, p, a, b, t), rp, ro);
  const pl = n.pl, np = G.n[pl], A = n.acts.length, st = n.lockSt || msStrat(n, np, new Float64Array(A * np));
  if (pl === p) {
    const vals = [], v = new Float64Array(np);
    for (let a = 0; a < A; a++) { const r2 = new Float64Array(np); for (let i = 0; i < np; i++) r2[i] = rp[i] * st[a * np + i]; const va = msCfr(E, n.ch[a], p, r2, ro, t); vals.push(va); for (let i = 0; i < np; i++) v[i] += st[a * np + i] * va[i]; }
    if (n.lockSt) return v;
    /* DCFR: alfa 1,5, beta 0, gamma 2 */
    const ta = Math.pow(t, 1.5), pos = ta / (ta + 1), neg = 0.5, g = Math.pow(t / (t + 1), 2);
    const reg = n.reg, avg = n.avg;
    for (let a = 0; a < A; a++) { const va = vals[a]; for (let i = 0; i < np; i++) { const k = a * np + i; let r = reg[k]; r = (r > 0 ? r * pos : r * neg) + va[i] - v[i]; reg[k] = r; avg[k] = avg[k] * g + rp[i] * st[k]; } }
    return v;
  }
  const v = new Float64Array(np0);
  for (let a = 0; a < A; a++) { const r2 = new Float64Array(np); let any = false; for (let i = 0; i < np; i++) { r2[i] = ro[i] * st[a * np + i]; if (r2[i]) any = true; } if (!any) continue; const va = msCfr(E, n.ch[a], p, rp, r2, t); for (let i = 0; i < np0; i++) v[i] += va[i]; }
  return v;
}
/* valore con strategie medie; br = miglior risposta di p */
function msVal(E, n, p, rp, ro, br) {
  const G = E.G;
  if (n.t === "f" || n.t === "s" || n.t === "q") return msTerm(E, n, p, ro);
  const np0 = G.n[p];
  if (n.t === "c") return msChance(E, n, p, (ch, a, b) => msVal(E, ch, p, a, b, br), rp, ro);
  const pl = n.pl, np = G.n[pl], A = n.acts.length, st = msAvg(n, np);
  if (pl === p) {
    const bb = br && !n.lockSt, v = new Float64Array(np); if (bb) v.fill(-Infinity);
    for (let a = 0; a < A; a++) { const r2 = new Float64Array(np); for (let i = 0; i < np; i++) r2[i] = rp[i] * st[a * np + i]; const va = msVal(E, n.ch[a], p, bb ? rp : r2, ro, br); for (let i = 0; i < np; i++) { if (bb) v[i] = Math.max(v[i], va[i]); else v[i] += st[a * np + i] * va[i]; } }
    return v;
  }
  const v = new Float64Array(np0);
  for (let a = 0; a < A; a++) { const r2 = new Float64Array(np); let any = false; for (let i = 0; i < np; i++) { r2[i] = ro[i] * st[a * np + i]; if (r2[i]) any = true; } if (!any) continue; const va = msVal(E, n.ch[a], p, rp, r2, br); for (let i = 0; i < np0; i++) v[i] += va[i]; }
  return v;
}
function msIter(E) { E.it++; const G = E.G; for (let p = 0; p < 2; p++) msCfr(E, E.tree.root, p, G.w[p], G.w[1 - p], E.it); }
/* coppie di mani compatibili (senza rake: la rake non deve entrare nella normalizzazione) */
function msPairs(E) { const G = E.G, v = msCompat(G, 0, G.w[1]); let Z = 0; for (let i = 0; i < G.n[0]; i++) Z += G.w[0][i] * v[i]; return Z; }
function msStats(E) {
  const G = E.G, Z = E.Z || (E.Z = msPairs(E));
  const tot = br => [0, 1].map(p => { const v = msVal(E, E.tree.root, p, G.w[p], G.w[1 - p], br); let s = 0; for (let i = 0; i < v.length; i++) s += G.w[p][i] * v[i]; return s / Z; });
  const ev = tot(false), bv = tot(true);
  return { ev, br: bv, expl: Math.max(0, (bv[0] - ev[0] + bv[1] - ev[1]) / 2) / E.P * 100 };
}
/* reach fino a un nodo seguendo il percorso salvato (lista di passi {k}) */
function msReach(E, steps) {
  const G = E.G; let n = E.tree.root, r = [Float64Array.from(G.w[0]), Float64Array.from(G.w[1])];
  for (const k of steps) {
    if (n.t === "c") { const c = n.deal[k]; r = [msMask(G, 0, r[0], c), msMask(G, 1, r[1], c)]; n = n.ch[k]; continue; }
    const np = G.n[n.pl], st = msAvg(n, np), r2 = new Float64Array(np);
    for (let i = 0; i < np; i++) r2[i] = r[n.pl][i] * st[k * np + i];
    r[n.pl] = r2; n = n.ch[k];
  }
  return { n, r };
}
function msNodeInfo(E, steps, withEV) {
  const G = E.G, { n: node, r } = msReach(E, steps), pl = node.pl, q = 1 - pl, np = G.n[pl], A = node.acts.length;
  const rp = r[pl], ro = r[q], st = msAvg(node, np);
  let evA = null;
  if (withEV) {
    const norm = msCompat(G, pl, ro); /* somma della reach avversaria compatibile, senza rake */
    evA = node.ch.map(ch => { const v = msVal(E, ch, pl, rp, ro, false); return Array.from(v, (x, i) => norm[i] > 1e-12 ? x / norm[i] + node.inv[pl] : null); }); /* scala standard dei solver: il fold vale 0, conta solo ciò che vinci da qui */
  }
  const freq = node.acts.map((_, a) => { let s = 0, t = 0; for (let i = 0; i < np; i++) { s += rp[i] * st[a * np + i]; t += rp[i]; } return t > 0 ? s / t : 0; });
  return { node, pl, st, evA, rp, ro, freq, np, combos: G.R[pl] };
}
function msSolveAsync(E, iters, onProg, onDone) {
  let stop = false; const t0 = Date.now();
  const step = () => {
    if (stop || E.cancel) return;
    const s = Date.now();
    do { msIter(E); } while (E.it < iters && Date.now() - s < 120);
    onProg && onProg(E.it / iters, Date.now() - t0);
    if (E.it < iters) setTimeout(step, 0); else { E.ms = Date.now() - t0; E.stats = msStats(E); if (E.iso) msIsoFill(E); onDone && onDone(E); }
  };
  setTimeout(step, 0);
  return () => { stop = true; };
}

/* equity di ogni combo di p contro il reach ro, sul board del nodo (media sulle carte mancanti) */
function msEqVec(E, cards, p, ro) {
  const G = E.G, np = G.n[p], out = new Float64Array(np), b = [...G.board, ...cards];
  if (b.length >= 5) msSweep(G, b, p, ro, 1, 0, 1, out);
  else if (b.length === 4) msQ4(E, b, p, ro, 1, 0, 1, out);
  else msQMat(E, msEqFlop(G), p, ro, 1, 0, out);
  const C = msCompat(G, p, ro);
  for (let i = 0; i < np; i++) out[i] = C[i] > 1e-12 ? out[i] / C[i] : 0;
  return out;
}
/* EV (quota del piatto) di ogni combo di p al nodo, date le strategie medie */
function msEvVec(E, node, p, rp, ro) {
  const G = E.G, v = msVal(E, node, p, rp, ro, false), C = msCompat(G, p, ro), out = new Float64Array(G.n[p]);
  for (let i = 0; i < out.length; i++) out[i] = C[i] > 1e-12 ? v[i] / C[i] + node.inv[p] : 0;
  return out;
}

/* report rapido: equity del flop con runout campionati e realizzazione (IP realizza di più) */
function msQuickMats(E) {
  if (E.qm) return E.qm;
  const G = E.G, n0 = G.n[0], n1 = G.n[1], b = G.board, used = new Set(b), deck = [];
  for (let c = 0; c < 52; c++) if (!used.has(c)) deck.push(c);
  const M = new Float32Array(n0 * n1), C = new Uint8Array(n0 * n1), N = E.o.samples || 60;
  let seed = 7 + b.reduce((a, c) => a * 53 + c, 0) % 100000;
  const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296; };
  const key = new Set();
  for (let s = 0, guard = 0; s < N && guard < N * 20; guard++) {
    const x = deck[Math.floor(rnd() * deck.length)], y = deck[Math.floor(rnd() * deck.length)]; if (x === y) continue;
    const kk = Math.min(x, y) * 64 + Math.max(x, y); if (key.has(kk)) continue; key.add(kk); s++;
    const R5 = msRanks(G, [...b, x, y]), r0 = R5[0].rk, r1 = R5[1].rk;
    for (let i = 0; i < n0; i++) { const ri = r0[i]; if (ri < 0) continue; const o = i * n1; for (let j = 0; j < n1; j++) { const rj = r1[j]; if (rj < 0) continue; M[o + j] += ri > rj ? 1 : ri === rj ? 0.5 : 0; C[o + j]++; } }
  }
  if (!G.V) { G.V = new Uint8Array(n0 * n1); for (let i = 0; i < n0; i++) { const a = G.c0[0][i], bb = G.c1[0][i]; for (let j = 0; j < n1; j++) { const c = G.c0[1][j], d = G.c1[1][j]; G.V[i * n1 + j] = a !== c && a !== d && bb !== c && bb !== d ? 1 : 0; } } }
  const Sh = new Float32Array(n0 * n1), k = E.o.realK ?? 0.1, g = E.o.realG ?? 1.25;
  for (let q = 0; q < M.length; q++) {
    if (!G.V[q] || !C[q]) { M[q] = 0; continue; }
    const e = M[q] / C[q]; M[q] = e;
    const ea = Math.pow(e, g) * (1 - k), eb = Math.pow(1 - e, g) * (1 + k); Sh[q] = ea + eb > 0 ? ea / (ea + eb) : e;
  }
  E.qm = { Eq: M, Sh };
  return E.qm;
}
function msQM(E, allin, p, ro, uW, uL, out) {
  const G = E.G, Q = msQuickMats(E), M = allin ? Q.Eq : Q.Sh, n0 = G.n[0], n1 = G.n[1], C = msCompat(G, p, ro), np = G.n[p], d = uW - uL, wv = new Float64Array(np);
  if (p === 0) { for (let i = 0; i < n0; i++) { let s = 0; const o = i * n1; for (let j = 0; j < n1; j++) s += M[o + j] * ro[j]; wv[i] = s; } }
  else { const acc = new Float64Array(n1); for (let i = 0; i < n0; i++) { const r = ro[i]; if (!r) continue; const o = i * n1; for (let j = 0; j < n1; j++) acc[j] += M[o + j] * r; } for (let j = 0; j < n1; j++) wv[j] = C[j] - acc[j]; }
  for (let i = 0; i < np; i++) out[i] += uL * C[i] + d * wv[i];
  return out;
}

/* visita tutti i nodi decisionali con il reach dei due giocatori (strategie medie) */
function msForEachDec(E, cb) {
  const G = E.G;
  const go = (n, r) => {
    if (n.t === "c") { n.deal.forEach((c, k) => go(n.ch[k], [msMask(G, 0, r[0], c), msMask(G, 1, r[1], c)])); return; }
    if (n.t !== "a") return;
    cb(n, r);
    const np = G.n[n.pl], st = msAvg(n, np);
    for (let a = 0; a < n.acts.length; a++) { const r2 = new Float64Array(np); let any = false; for (let i = 0; i < np; i++) { r2[i] = r[n.pl][i] * st[a * np + i]; if (r2[i] > 1e-12) any = true; } if (!any) continue; const rr = n.pl ? [r[0], r2] : [r2, r[1]]; go(n.ch[a], rr); }
  };
  go(E.tree.root, [Float64Array.from(G.w[0]), Float64Array.from(G.w[1])]);
}
/* nodelock con frequenze scelte: scala le azioni in proporzione (come "set frequency") */
function msLockScale(n, np, base, rp, targets) {
  const A = n.acts.length, lam = new Float64Array(A).fill(1), b = new Float64Array(A * np), out = new Float64Array(A * np);
  for (let a = 0; a < A; a++) for (let i = 0; i < np; i++) b[a * np + i] = targets[a] > 0 ? Math.max(base[a * np + i], 0.002) : 0;
  let T = 0; for (let i = 0; i < np; i++) T += rp[i];
  for (let it = 0; it < 80; it++) {
    for (let i = 0; i < np; i++) { let s = 0; for (let a = 0; a < A; a++) s += lam[a] * b[a * np + i]; for (let a = 0; a < A; a++) out[a * np + i] = s > 0 ? lam[a] * b[a * np + i] / s : 1 / A; }
    let done = true;
    for (let a = 0; a < A; a++) { if (!(targets[a] > 0)) { lam[a] = 0; continue; } let f = 0; for (let i = 0; i < np; i++) f += rp[i] * out[a * np + i]; f = T > 0 ? f / T : 0; if (f > 0) { const k = targets[a] / f; if (Math.abs(k - 1) > 0.002) done = false; lam[a] *= Math.pow(k, 0.8); } }
    if (done) break;
  }
  return out;
}
/* nodelock da profilo: folda le mani con meno equity fino alla frequenza F, raise delle più forti se richiesto */
function msLockFold(n, np, base, rp, eq, F, R) {
  const A = n.acts.length, out = new Float64Array(A * np);
  const fi = n.acts.findIndex(a => a.kind === "fold"), ci = n.acts.findIndex(a => a.kind === "call");
  const ri = n.acts.map((a, k) => a.kind === "raise" || a.kind === "allin" ? k : -1).filter(k => k >= 0);
  const ord = Array.from({ length: np }, (_, i) => i).sort((x, y) => eq[x] - eq[y]);
  let T = 0; for (let i = 0; i < np; i++) T += rp[i];
  let need = (F || 0) * T;
  for (const i of ord) {
    const r = rp[i]; let f = 0;
    if (need > 1e-12) { f = r > 0 ? Math.min(1, need / r) : 1; need -= f * r; }
    out[fi * np + i] = f; const rest = 1 - f;
    let s = base[ci * np + i]; ri.forEach(k => s += base[k * np + i]);
    if (R != null) out[ci * np + i] = rest;
    else if (s <= 1e-12) out[ci * np + i] = rest;
    else { out[ci * np + i] = rest * base[ci * np + i] / s; ri.forEach(k => out[k * np + i] = rest * base[k * np + i] / s); }
  }
  if (R != null && R > 0 && ri.length) { let rn = R * T; const k0 = ri[0]; for (let a = ord.length - 1; a >= 0 && rn > 1e-12; a--) { const i = ord[a], r = rp[i], c = out[ci * np + i]; if (c <= 0) continue; const x = r > 0 ? Math.min(c, rn / r) : c; out[ci * np + i] -= x; out[k0 * np + i] += x; rn -= x * r; } }
  return out;
}

/* campione stratificato di carte (turn o river): stessa proporzione di semi, ranghi distribuiti */
function msSampleCards(list, K, salt) {
  if (K >= list.length) return list;
  const by = [[], [], [], []]; list.forEach(c => by[c & 3].push(c)); by.forEach(a => a.sort((x, y) => y - x));
  const tot = list.length, raw = by.map(a => a.length * K / tot), q = raw.map(Math.floor);
  let rem = K - q.reduce((s, x) => s + x, 0);
  raw.map((x, s) => [x - Math.floor(x), s]).sort((a, b) => b[0] - a[0]).forEach(([_, s]) => { if (rem > 0 && q[s] < by[s].length) { q[s]++; rem--; } });
  const out = [];
  by.forEach((a, s) => { const n = q[s]; if (!n) return; const step = a.length / n, off = (((salt >> 2) + s) % 4) / 4 * step; for (let k = 0; k < n; k++) out.push(a[Math.min(a.length - 1, Math.floor(off + k * step))]); });
  return out;
}

/* equity del flop (media esatta su tutti i turn e river) come matrice unica */
function msEqFlop(G) {
  if (G.eqF) return G.eqF;
  const n0 = G.n[0], n1 = G.n[1], M = new Float32Array(n0 * n1), used = new Set(G.board);
  for (let t = 0; t < 52; t++) { if (used.has(t)) continue; const Mt = msEqMat(G, [...G.board, t]); for (let k = 0; k < M.length; k++) M[k] += Mt[k]; }
  for (let k = 0; k < M.length; k++) M[k] /= 45;
  G.eqF = M; return M;
}
function msQMat(E, M, p, ro, uW, uL, out) {
  const G = E.G, n0 = G.n[0], n1 = G.n[1], C = msCompat(G, p, ro), np = G.n[p], d = uW - uL;
  if (p === 0) { for (let i = 0; i < n0; i++) { let s = 0; const o = i * n1; for (let j = 0; j < n1; j++) s += M[o + j] * ro[j]; out[i] += uL * C[i] + d * s; } }
  else { const acc = new Float64Array(n1); for (let i = 0; i < n0; i++) { const r = ro[i]; if (!r) continue; const o = i * n1; for (let j = 0; j < n1; j++) acc[j] += M[o + j] * r; } for (let j = 0; j < n1; j++) out[j] += uL * C[j] + d * (C[j] - acc[j]); }
  return out;
}

