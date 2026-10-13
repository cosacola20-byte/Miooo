/* ================= SOLVER: range dei giocatori da una mano ================= */
function hPreFor(g, pl, plPos, op, opPos) {
  const R = g.raisers, vk = HPK[plPos], hk = HPK[opPos];
  let r = null;
  if (!R.length) r = hFB("limp");
  else if (R.length === 1 && R[0] === pl) r = vk && vk !== "bb" ? hPre("rfi_" + vk, 1) : hFB("limp");
  else if (R.length === 1 && R[0] === op) r = vk === "bb" ? hPre("bb_" + hk, 1) : hFB("flat");
  else if (R.length === 2 && R[0] === op && R[1] === pl) r = vk === "bb" ? hPre("bb_" + hk, 2) : hPre(vk + "_" + hk, 1);
  else if (R.length === 2 && R[0] === pl && R[1] === op) r = hPre(vk + "_vs_" + hk + "3", 1);
  else if (R.length === 3 && R[0] === pl && R[1] === op && R[2] === pl) r = hPre(vk + "_vs_" + hk + "3", 2);
  else if (R.length >= 3 && R[R.length - 1] === op) r = hFB("four");
  if (!r) r = R.includes(pl) ? hFB("tb") : hFB("flat");
  return r;
}
/* range di un giocatore ristretto dalle sue azioni fino allo street "last" (solo carte del board escluse) */
function hNarrowP(g, d, pr, who, last) {
  const dead = new Set(hsplit(d.board));
  let combos = [];
  Object.entries(pr.w).forEach(([k, w]) => hExpand(k).forEach(c => { if (!dead.has(c[0]) && !dead.has(c[1])) combos.push({ c, w, key: k }); }));
  for (let s = 1; s <= last; s++) {
    const b = hsplit(boardAt(d, s)), T = s === 3 ? HWR : HW;
    const vt = (g.streets[s] || []).filter(t => t.who === who);
    if (!vt.length) continue;
    combos.forEach(o => o.cl = hClassify(o.c, b));
    vt.forEach(t => {
      let key;
      if (t.a === "check") key = who === "Tu" ? ((g.streets[s] || []).some(x => x.who !== "Tu" && x.a === "check" && (g.streets[s] || []).indexOf(x) < (g.streets[s] || []).indexOf(t)) ? "chkIP" : "chkOOP") : (t.heroChk ? "chkIP" : "chkOOP");
      else if (t.a === "bet") key = "bet"; else if (t.a === "raise") key = "raise";
      else if (t.a === "call") { const r = t.toCall / Math.max(0.1, t.pot - t.toCall); key = r <= 0.5 ? "callS" : r <= 0.85 ? "callM" : "callB"; }
      else return;
      combos.forEach(o => { const tb = T[key]; let m = tb[o.cl.k] ?? tb.A; if (o.cl.dr === 2 && tb.S != null) m = Math.max(m, tb.S); o.w *= m; });
    });
  }
  return combos.filter(o => o.w > 0.003).map(o => ({ c: o.c, w: o.w, key: o.key }));
}
/* configurazione del solver per una decisione al river di una tua mano */
function svFromHand(h, d) {
  if (d.st !== 3) return null;
  const g = hGame(h, d); if (!g.v || g.multi) return null;
  const heroPl = g.heroIP ? 1 : 0, P = g.potAt[3];
  const riv = g.streets[3] || [];
  let heroInv = 0, vilInv = 0;
  riv.forEach(t => { const add = t.a === "call" ? t.x : t.a === "bet" ? t.x : t.a === "raise" ? t.x - (t.who === "Tu" ? heroInv : vilInv) : 0; if (t.who === "Tu") heroInv += add; else if (t.who === g.v) vilInv += add; });
  const stack = Math.max(1, Math.round((d.stack + heroInv) * 10) / 10);
  const hr = hNarrowP(g, d, hPreFor(g, "Tu", h.pos, g.v, g.vpos), "Tu", 2);
  const vr = hNarrowP(g, d, hPreFor(g, g.v, g.vpos, "Tu", h.pos), g.v, 2);
  const hc = hsplit(h.hero), same = x => (x.c[0] === hc[0] && x.c[1] === hc[1]) || (x.c[0] === hc[1] && x.c[1] === hc[0]);
  const hx = hr.find(same); if (hx) hx.w = Math.max(hx.w, 0.05); else hr.push({ c: hc, w: 0.05, key: HKEY(hc) });
  const bets = [[0.33, 0.75, 1.5], [0.33, 0.75, 1.5]], raises = [0.75];
  let inv = { Tu: 0 }; inv[g.v] = 0;
  const path = [];
  riv.forEach(t => {
    const pl = t.who === "Tu" ? heroPl : 1 - heroPl, other = t.who === "Tu" ? g.v : "Tu";
    if (t.a === "bet") { const f = Math.round(t.x / P * 100) / 100; if (!bets[pl].some(x => Math.abs(x - f) < 0.03)) bets[pl].push(f); inv[t.who] = t.x; path.push({ kind: "bet", amt: t.x }); }
    else if (t.a === "raise") { const F = inv[other], f = Math.round((t.x - F) / (P + 2 * F) * 100) / 100; if (!raises.some(x => Math.abs(x - f) < 0.03)) raises.push(f); inv[t.who] = t.x; path.push({ kind: "raise", amt: t.x }); }
    else if (t.a === "call") path.push({ kind: "call" }); else if (t.a === "check") path.push({ kind: "check" });
  });
  let tableAct = null;
  if (d.act === "bet") { const f = Math.round(d.amt / P * 100) / 100; if (!bets[heroPl].some(x => Math.abs(x - f) < 0.03)) bets[heroPl].push(f); tableAct = { kind: "bet", amt: d.amt }; }
  else if (d.act === "raise") { const F = inv[g.v], f = Math.round((d.amt - F) / (P + 2 * F) * 100) / 100; if (!raises.some(x => Math.abs(x - f) < 0.03)) raises.push(f); tableAct = { kind: "raise", amt: d.amt }; }
  else tableAct = { kind: d.act };
  const ranges = heroPl === 0 ? [hr, vr] : [vr, hr];
  return { board: hsplit(d.board), boardS: d.board, pot: Math.round(P * 10) / 10, stack, oopBets: bets[0].sort((a, b) => a - b), ipBets: bets[1].sort((a, b) => a - b), raises: raises.sort((a, b) => a - b), maxRaises: 1, ranges, heroPl, path, tableAct, heroCombo: hc, vpos: g.vpos, vname: (h.names || {})[g.vpos] || null, src: `Mano #${h.id}` };
}
function svFromHandSt(h, d) {
  if (d.st < 1 || d.st > 3) return null;
  const ST = d.st;
  const g = hGame(h, d); if (!g.v || g.multi) return null;
  const heroPl = g.heroIP ? 1 : 0, P = g.potAt[ST];
  const riv = g.streets[ST] || [];
  let heroInv = 0, vilInv = 0;
  riv.forEach(t => { const add = t.a === "call" ? t.x : t.a === "bet" ? t.x : t.a === "raise" ? t.x - (t.who === "Tu" ? heroInv : vilInv) : 0; if (t.who === "Tu") heroInv += add; else if (t.who === g.v) vilInv += add; });
  const stack = Math.max(1, Math.round((d.stack + heroInv) * 10) / 10);
  const hr = hNarrowP(g, d, hPreFor(g, "Tu", h.pos, g.v, g.vpos), "Tu", ST - 1);
  const vr = hNarrowP(g, d, hPreFor(g, g.v, g.vpos, "Tu", h.pos), g.v, ST - 1);
  const hc = hsplit(h.hero), same = x => (x.c[0] === hc[0] && x.c[1] === hc[1]) || (x.c[0] === hc[1] && x.c[1] === hc[0]);
  const hx = hr.find(same); if (hx) hx.w = Math.max(hx.w, 0.05); else hr.push({ c: hc, w: 0.05, key: HKEY(hc) });
  const lastR = g.raisers[g.raisers.length - 1], aggPl = lastR == null ? -1 : (lastR === "Tu" ? heroPl : 1 - heroPl);
  const bets = ST === 3 ? [[0.33, 0.75, 1.5], [0.33, 0.75, 1.5]] : ST === 2 ? [[0.75], [0.75]] : [aggPl === 0 ? [0.33, 1] : [], [0.33, 1]], raises = ST === 3 ? [0.75] : [];
  let inv = { Tu: 0 }; inv[g.v] = 0;
  const path = [];
  riv.forEach(t => {
    const pl = t.who === "Tu" ? heroPl : 1 - heroPl, other = t.who === "Tu" ? g.v : "Tu";
    if (t.a === "bet") { const f = Math.round(t.x / P * 100) / 100; if (!bets[pl].some(x => Math.abs(x - f) < 0.03)) bets[pl].push(f); inv[t.who] = t.x; path.push({ kind: "bet", amt: t.x }); }
    else if (t.a === "raise") { const F = inv[other], f = Math.round((t.x - F) / (P + 2 * F) * 100) / 100; if (!raises.some(x => Math.abs(x - f) < 0.03)) raises.push(f); inv[t.who] = t.x; path.push({ kind: "raise", amt: t.x }); }
    else if (t.a === "call") path.push({ kind: "call" }); else if (t.a === "check") path.push({ kind: "check" });
  });
  let tableAct = null;
  if (d.act === "bet") { const f = Math.round(d.amt / P * 100) / 100; if (!bets[heroPl].some(x => Math.abs(x - f) < 0.03)) bets[heroPl].push(f); tableAct = { kind: "bet", amt: d.amt }; }
  else if (d.act === "raise") { const F = inv[g.v], f = Math.round((d.amt - F) / (P + 2 * F) * 100) / 100; if (!raises.some(x => Math.abs(x - f) < 0.03)) raises.push(f); tableAct = { kind: "raise", amt: d.amt }; }
  else tableAct = { kind: d.act };
  const ranges = heroPl === 0 ? [hr, vr] : [vr, hr];
  return { board: hsplit(d.board), boardS: d.board, pot: Math.round(P * 10) / 10, stack, oopBets: bets[0].sort((a, b) => a - b), ipBets: bets[1].sort((a, b) => a - b), raises: raises.sort((a, b) => a - b), maxRaises: 1, ranges, heroPl, path, tableAct, heroCombo: hc, vpos: g.vpos, vname: (h.names || {})[g.vpos] || null, src: `Mano #${h.id}` };
}
function svWalk(E, path) {
  let n = E.tree.root;
  for (const t of path) {
    if (!n || n.t !== "a") return null;
    let best = -1, bd = 1e9;
    n.acts.forEach((a, k) => { if (t.kind === "check" && a.kind === "check") { best = k; bd = 0; } else if (t.kind === "call" && a.kind === "call") { best = k; bd = 0; } else if (t.kind === "fold" && a.kind === "fold") { best = k; bd = 0; } else if ((t.kind === "bet" || t.kind === "raise") && (a.kind === "bet" || a.kind === "raise" || a.kind === "allin")) { const dd = Math.abs(a.amt - t.amt); if (dd < bd) { bd = dd; best = k; } } });
    if (best < 0) return null;
    n = n.ch[best];
  }
  return n;
}
const svActIdx = (n, t) => { if (!t) return -1; let best = -1, bd = 1e9; n.acts.forEach((a, k) => { if (a.kind === t.kind || (t.kind === "bet" && a.kind === "allin") || (t.kind === "raise" && a.kind === "allin")) { const dd = t.amt != null && a.amt != null ? Math.abs(a.amt - t.amt) : 0; if (dd < bd) { bd = dd; best = k; } } }); return best; };
/* nodelock da un profilo avversario (scheda Avversari) o dal pool di riferimento */
function svLockFn(kind, o) {
  if (kind === "pool") return fr => ({ fold: courseFold(fr, null) / 100, raise: null });
  if (kind === "opp" && o) {
    const A = oppRun(oppPrep(o.D), OPPK, 0), F = A.S.fold_rb && oppConf(A.S.fold_rb, A.out.hands) > 0 ? A.S.fold_rb.value : null;
    const cr = oppCell(oget(o.D, "aggr.check_raise.river"));
    if (F == null && !cr) return null;
    return (fr, vChecked) => ({ fold: F == null ? null : Math.max(0.03, Math.min(0.95, (F + courseFold(fr, null) - courseFold(0.7, null)) / 100)), raise: vChecked && cr && cr.tot >= 20 ? cr.value / 100 : null });
  }
  return null;
}
function svLockSummary(fn, sizes) { return sizes.map(s => { const L = fn(s, false); return L && L.fold != null ? `${Math.round(s * 100)}%: folda ${Math.round(L.fold * 100)}%` : null; }).filter(Boolean).join(" · "); }
/* risolve (in blocchi, senza bloccare la pagina) */
function svSolveAsync(cfg, lock, onProg, done) {
  const mk = () => svInit(cfg);
  const E0 = mk(); let E1 = null, stage = 0, target = cfg.iters || 600;
  const vPl = 1 - cfg.heroPl;
  const step = () => {
    const E = stage === 0 ? E0 : E1;
    const t0 = Date.now();
    while (E.it < target && Date.now() - t0 < 60) svRun(E, 5);
    if (E.it < target) { onProg(stage, E.it / target); return setTimeout(step, 0); }
    if (stage === 0 && lock) { E1 = mk(); svApplyLocks(E1, vPl, lock); stage = 1; onProg(1, 0); return setTimeout(step, 0); }
    done(E0, E1);
  };
  setTimeout(step, 0);
}
/* EV del tuo lato: GTO contro il villain bloccato (per misurare il guadagno dell'exploit) */
function svHeroEV(E, heroPl) { const s = svStats(E); return s.ev[heroPl]; }
function svGtoVsLocked(E0, heroPl, lock) {
  svApplyLocks(E0, 1 - heroPl, lock);
  // il lato hero resta la strategia media GTO, il villain segue il blocco
  const G = E0.G, Z = E0.Z || (E0.Z = svPairs(E0));
  const v = svVal(E0, E0.tree.root, heroPl, G.w[heroPl], G.w[1 - heroPl], false);
  let s = 0; for (let i = 0; i < v.length; i++) s += G.w[heroPl][i] * v[i];
  E0.tree.nodes.forEach(n => n.lock = null);
  return s / Z;
}
