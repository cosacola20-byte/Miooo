/* ================= PROVE DEI LIVELLI ================= */
/* ogni limite ha prove verificabili: al tavolo col solver, drill, problemi, ripasso, mani vere, mindset */
const RFI_ALL = ["rfi_ep", "rfi_mp", "rfi_co", "rfi_btn", "rfi_sb"];
const PV_LINE = { btn_bb: [0, 0, 0, 1, 0, 1], co_bb: [0, 0, 1, 0, 0, 1] };
/* spot al tavolo: flop dal preflop GTO, oppure i turn e river già impostati dei problemi */
const PVS = { flopBB: { type: "flop", line: "btn_bb" }, flopCO: { type: "flop", line: "co_bb" }, riv7: { type: "prob", pid: "p7" }, riv4: { type: "prob", pid: "p4" }, riv8: { type: "prob", pid: "p8" }, t6: { type: "prob", pid: "p6" }, t2: { type: "prob", pid: "p2" }, t10: { type: "prob", pid: "p10" }, t9: { type: "prob", pid: "p9" }, t1: { type: "prob", pid: "p1" }, t5: { type: "prob", pid: "p5" }, t3: { type: "prob", pid: "p3" } };
const GW_PROVE = {
  nl2: [
    { id: "nl2a", kind: "drill", t: "Aperture preflop", d: "20 domande sugli open da ogni posizione.", need: 85, plan: [["preflop", 20, { spots: RFI_ALL }]] },
    { id: "nl2c", kind: "drill", t: "Contro i limper", d: "20 decisioni contro uno o più limper.", need: 80, plan: [["vslimp", 20]] },
    { id: "nl2d", kind: "drill", t: "Teoria di base", d: "16 domande di teoria: posizione, limper, fish, postflop.", need: 80, plan: [["teoria", 16]] },
    { id: "nl2b", kind: "table", t: "Primo flop al tavolo", d: "20 decisioni al flop BTN contro BB, modalità Semplice.", need: 70, n: 20, spots: ["flopBB"], side: 1, mode: "street", diff: "simple" },
  ],
  nl5: [
    { id: "nl5a", kind: "drill", t: "Difesa e 3-bet", d: "24 domande su difesa del BB e risposta al 3-bet.", need: 85, plan: [["preflop", 12, { spots: ["bb_btn", "bb_sb", "bb_co", "bb_mp", "bb_ep"] }], ["preflop", 12, { spots: ["btn_vs_bb3", "btn_vs_sb3", "co_vs_btn3", "co_vs_bb3", "sb_vs_bb3", "mp_vs_btn3"] }]] },
    { id: "nl5b", kind: "table", t: "Difendere il BB al flop", d: "30 decisioni al flop come BB contro l'open del BTN.", need: 75, n: 30, spots: ["flopBB"], side: 0, mode: "street", diff: "grp" },
    { id: "nl5c", kind: "probs", t: "Primo problema", d: "Risolvi 1 problema con almeno 70.", need: 70, count: 1 },
  ],
  nl10: [
    { id: "nl10a", kind: "table", t: "Decisioni al river", d: "30 decisioni al river, un po' da IP e un po' da OOP.", need: 80, n: 30, spots: ["riv7", "riv4"], chunk: 15, side: "rand", mode: "hand", diff: "std" },
    { id: "nl10b", kind: "size", t: "Trova la size al river", d: "5 river: scegli la size singola che rende di più. Ne servono 3 giuste.", need: 3, n: 5, fam: ["p6", "p2", "p9", "p3"] },
    { id: "nl10c", kind: "hands", t: "Le tue prime mani", d: "Importa almeno 5 mani in I miei dati.", hands: 5 },
  ],
  nl25: [
    { id: "nl25a", kind: "table", t: "Flop casuali", d: "50 decisioni al flop su 5 flop diversi: almeno 75% su ogni tipo di colore (rainbow, two-tone, monotone).", need: 75, n: 50, spots: ["flopBB"], chunk: 10, side: 1, mode: "street", diff: "std", tex: true },
    { id: "nl25b", kind: "probs", t: "Tre problemi", d: "Risolvi 3 problemi diversi con almeno 75.", need: 75, count: 3 },
    { id: "nl25c", kind: "review", t: "Ripasso a zero", d: "Nessun errore da ripassare in ritardo e almeno 3 errori imparati.", learned: 3 },
  ],
  nl50: [
    { id: "nl50a", kind: "table", t: "Decisioni al turn", d: "40 decisioni al turn in modalità Standard.", need: 85, n: 40, spots: ["t6", "t10"], chunk: 20, side: "rand", mode: "hand", diff: "std" },
    { id: "nl50b", kind: "exploit", t: "Exploit: il BB folda troppo", d: "20 decisioni da CO al river contro un BB che folda il 60% alle puntate. Il voto è contro il suo difetto.", need: 85, n: 20, spots: ["riv7"], side: 1, lock: { pl: 0, fold: 0.6, name: "BB che folda troppo" } },
    { id: "nl50c", kind: "size", t: "Trova la size nei 3-bet pot", d: "5 river nei 3-bet pot: ne servono 4 giuste.", need: 4, n: 5, fam: ["p1", "p5", "p10"] },
  ],
  nl100: [
    { id: "nl100a", kind: "hands", t: "50 mani vere analizzate", d: "Almeno 50 mani importate e punteggio medio delle tue decisioni di almeno 85.", hands: 50, avg: 85 },
    { id: "nl100b", kind: "exploit", t: "Exploit sul tuo avversario", d: "20 decisioni al river contro il profilo di un avversario analizzato (se non ne hai, una calling station).", need: 88, n: 20, spots: ["riv7"], side: 1, lock: { pl: 0, opp: true, fold: 0.2, name: "calling station" } },
    { id: "nl100c", kind: "mind", t: "Dieci sessioni di qualità", d: "10 sessioni nel diario con SQS di almeno 7 e senza violazioni.", sess: 10 },
  ],
  nl200: [
    { id: "nl200a", kind: "table", t: "3-bet pot al turn", d: "40 decisioni nel 3-bet pot.", need: 88, n: 40, spots: ["t1", "riv8"], chunk: 20, side: "rand", mode: "hand", diff: "std" },
    { id: "nl200b", kind: "probs", t: "Problemi difficili", d: "Risolvi 5 problemi diversi con almeno 85.", need: 85, count: 5 },
    { id: "nl200c", kind: "table", t: "Rispondi a frequenze", d: "20 decisioni nel 3-bet pot rispondendo con le frequenze.", need: 82, n: 20, spots: ["riv4"], side: "rand", mode: "hand", diff: "std", input: "freq" },
  ],
  nl500: [
    { id: "nl500a", kind: "table", t: "Pot 4-bet, SPR basso", d: "30 decisioni nel pot 4-bet, precisione Alta.", need: 90, n: 30, spots: ["t5"], side: "rand", mode: "hand", diff: "std", itT: 400 },
    { id: "nl500b", kind: "drill", t: "Squeeze e cold 4-bet", d: "20 domande su squeeze e cold 4-bet.", need: 92, plan: [["preflop", 20, { spots: ["sq_bb_co", "sq_sb_co", "sq_bb_btn", "sq_btn_mp", "c4_btn_mp", "c4_sb_co", "c4_bb_btn"] }]] },
  ],
  nl1000: [
    { id: "nl1000a", kind: "table", t: "Cento decisioni a tempo", d: "100 decisioni miste su 5 spot con 10 secondi per decisione.", need: 92, n: 100, spots: ["t1", "t2", "t5", "riv7", "riv8"], chunk: 20, side: "rand", mode: "hand", diff: "std", tlim: 10 },
    { id: "nl1000b", kind: "probs", t: "Problemi da professionista", d: "Risolvi 5 problemi generati dal solver con almeno 92.", need: 92, count: 5, gen: true },
    { id: "nl1000c", kind: "table", t: "Flop casuali élite", d: "60 decisioni su 6 flop: almeno 90% su ogni tipo di colore.", need: 90, n: 60, spots: ["flopCO"], chunk: 10, side: 1, mode: "street", diff: "std", tex: true },
  ],
};
const gwProvaAll = () => Object.values(GW_PROVE).flat();
const gwProvaById = id => gwProvaAll().find(p => p.id === id);
function gwProvaRes(id) { return (S.prove || {})[id] || null; }
function gwProvaRec(id, score, pass) {
  S.prove = S.prove || {}; const p = S.prove[id] || { best: 0, tries: 0 };
  p.best = Math.max(p.best || 0, score); p.last = score; p.tries = (p.tries || 0) + 1; p.date = today(); if (pass) p.passed = true;
  S.prove[id] = p; persistSoon();
}
/* prove che si verificano da sole guardando i tuoi dati */
function gwProvaCheck(P) {
  if (P.kind === "probs") {
    const all = Object.values(S.daily || {}), ok = new Set(all.filter(x => x.best >= P.need && (!P.gen || String(x.pid)[0] === "g")).map(x => x.pid));
    return { v: ok.size, of: P.count, pass: ok.size >= P.count, txt: `${ok.size} su ${P.count} problemi con almeno ${P.need}` };
  }
  if (P.kind === "review") { const due = gwRevDue().length, lr = S.revDone || 0; return { v: lr, of: P.learned, pass: due === 0 && lr >= P.learned, txt: `${due} in ritardo · ${lr} imparati su ${P.learned}` }; }
  if (P.kind === "hands") {
    const n = HANDS.hands.length; let avg = null;
    if (P.avg) { const sc = []; HANDS.hands.forEach(h => (h.dec || []).forEach(d => { const a = d.an; if (a && a.sc != null) sc.push(a.sc); })); avg = sc.length ? sc.reduce((a, b) => a + b, 0) / sc.length : null; }
    return { v: n, of: P.hands, pass: n >= P.hands && (!P.avg || (avg != null && avg >= P.avg)), txt: `${n} mani su ${P.hands}${P.avg ? ` · media ${avg == null ? "-" : Math.round(avg)} su ${P.avg}` : ""}` };
  }
  if (P.kind === "mind") { const ok = MS.sessions.filter(s => s.sqs >= 7 && !s.overrides && s.closeWhy !== "recupero").length; return { v: ok, of: P.sess, pass: ok >= P.sess, txt: `${ok} sessioni buone su ${P.sess}` }; }
  return null;
}
function gwProvaPassed(P) { const c = gwProvaCheck(P); if (c) { if (c.pass && !(gwProvaRes(P.id) || {}).passed) gwProvaRec(P.id, 100, true); return c.pass; } return !!(gwProvaRes(P.id) || {}).passed; }
function gwLevelProve(L) { const A = GW_PROVE[L.id] || []; return { list: A, done: A.filter(gwProvaPassed).length, tot: A.length }; }
/* avvio */
function gwProvaStart(id) {
  const P = gwProvaById(id); if (!P) return;
  if (P.kind === "drill") { startCustom(`Prova · ${P.t}`, P.plan); if (run) run.prova = P.id; return; }
  if (P.kind === "probs") { const tried = new Set(Object.values(S.daily || {}).filter(x => x.best >= P.need).map(x => x.pid)); const nx = !P.gen && GW_PROBS.find(x => !tried.has(x.id)); if (nx) gwDailyStart(nx.id); else gwProbGen(); return; }
  if (P.kind === "review") { if (gwRevDue().length) gwRevStart(); else setTab("solver"); return; }
  if (P.kind === "hands") { setTab("data"); return; }
  if (P.kind === "mind") { MS.sub = "sessione"; setTab("mind"); return; }
  if (P.kind === "size") { gwSizeQuizStart(P); return; }
  if (P.kind === "table" || P.kind === "exploit") {
    if (typeof run !== "undefined" && run) run = null;
    setTab("solver"); gwSetInit();
    const PR = gwPracState();
    Object.assign(PR, { mode: P.mode || "hand", diff: P.diff || "std", input: P.input || "act", pause: "mistake", fixed: null, hand: null, fv: null });
    PR.prova = { id: P.id, need: P.need, n: P.n, moves: 0, lp: 0, k: 0, chunk: P.chunk || P.n, tex: {}, done: null, next: false };
    gwProvaLoad(P);
  }
}
/* carica lo spot k della prova e poi riprende ad allenarti */
function gwProvaLoad(P) {
  const PR = gwPracState(), V = PR.prova, sp = PVS[P.spots[V.k % P.spots.length]];
  const after = E => {
    const nm = sp.type === "prob" ? gwProbFind(sp.pid).names : sp.names;
    const L = { E, steps: [], oop: nm[0], ip: nm[1] };
    GW.layers = [L]; GW.tab = "prac"; GW.sel = null; GW.filter = null;
    PR.side = P.side === "rand" ? (Math.random() < 0.5 ? 0 : 1) : P.side; PR.hand = null; V.next = false;
    gwPracNew(); renderStudy();
  };
  const withLock = E => {
    if (!P.lock) return after(E);
    const pl = P.lock.pl; let fn = () => ({ fold: P.lock.fold, raise: 0 }); V.lockName = P.lock.name;
    if (P.lock.opp) { const o = Object.values(OPPS || {}).find(x => x && x.D); if (o) { const f = svLockFn("opp", o); if (f) { fn = f; V.lockName = o.name; } } }
    const map = new Map();
    msForEachDec(E, (n, r) => { if (n.pl !== pl) return; const facing = n.inv[1 - n.pl] - n.inv[n.pl]; if (facing <= 0) return; const fr = facing / (E.o.pot + n.inv[0] + n.inv[1] - facing); const x = fn(fr, false); if (!x || x.fold == null) return; const np = E.G.n[n.pl], eq = msEqVec(E, n.cards, n.pl, r[1 - n.pl]); map.set(n.path, msLockFold(n, np, msAvg(n, np), r[n.pl], eq, x.fold, x.raise)); });
    const E2 = msInit(E.o, E.G, true); E2.tree.nodes.forEach(n => { if (n.t === "a" && map.has(n.path)) n.lockSt = map.get(n.path); });
    gwStartSolve(E.o, `Prova exploit: blocco ${V.lockName} (${map.size} nodi)`, after, E2);
  };
  if (sp.type === "prob") {
    const B = gwProbFind(sp.pid), Q = { ...B, hand: null };
    Object.assign(GW, { direct: { oop: B.names[0], ip: B.names[1], pot: B.pot, stack: B.stack, title: "Prova" }, board: B.board, layers: [], customOpen: false, cache: new Map(), ask: null });
    const o = gwProbO(Q); if (P.itT) o.iters = P.itT;
    gwStartSolve(o, `Prova: preparo lo spot ${V.k + 1}`, withLock);
  } else {
    GW.direct = null; GW.line = PV_LINE[sp.line].slice(); GW.layers = []; GW.cache = new Map(); GW.ask = null;
    const Pp = gwPre(), f = Pp.flop;
    const tot = GW_FLOPSUB.reduce((s, x) => s + (x.w || 1), 0); let x = Math.random() * tot, fl = GW_FLOPSUB[0].b;
    for (const q of GW_FLOPSUB) { x -= q.w || 1; if (x <= 0) { fl = q.b; break; } }
    const pm = msPerms().P[Math.floor(Math.random() * 24)]; fl = hsplit(fl).map(c => hcstr((c & ~3) | pm[c & 3])).join("");
    GW.board = fl;
    const it0 = GW.set.it; GW.set.it = 50;
    const o = gwSolve(hsplit(fl), f.pot, f.stack, [gwRangeFromReach(f.reach[0]), gwRangeFromReach(f.reach[1])], "flop", f.agg === f.oop); o.iters = 50;
    GW.set.it = it0;
    sp.names = [f.oop, f.ip];
    gwStartSolve(o, `Prova: flop ${V.k + 1} (${fl})`, withLock);
  }
}
/* ogni decisione della prova: punteggio, texture, cambio spot, fine */
function gwProvaTick(grade, lossPot, E) {
  const PR = GW.prac, V = PR && PR.prova; if (!V || V.done) return;
  V.moves++; V.lp += Math.min(lossPot, 0.25);
  if (E && E.G.board.length >= 3) { const t = gwTex(E.G.board.slice(0, 3)).tone, e = V.tex[t] || (V.tex[t] = { m: 0, lp: 0 }); e.m++; e.lp += Math.min(lossPot, 0.25); }
  if (V.moves >= V.n) {
    const P = gwProvaById(V.id), sc = Math.max(0, Math.round(100 - V.lp / V.moves * 400));
    const texOk = !P.tex || Object.values(V.tex).every(e => 100 - e.lp / e.m * 400 >= P.need);
    V.done = { score: sc, pass: sc >= P.need && texOk, texOk };
    gwProvaRec(V.id, sc, V.done.pass);
    try { if (V.done.pass) { gSnd.done(); gConfetti(1600); } else gSnd.bad(); } catch (e) {}
  } else if (V.moves % V.chunk === 0) { V.k++; V.next = true; }
}
function gwProvaBanner(PR) {
  const V = PR.prova; if (!V) return "";
  const P = gwProvaById(V.id), sc = V.moves ? Math.max(0, Math.round(100 - V.lp / V.moves * 400)) : null;
  const tex = P.tex ? `<div class="gwpv-tex">${["Rainbow", "Two-tone", "Monotone"].map(t => { const e = V.tex[t]; return e ? `<span>${t}: <b>${Math.max(0, Math.round(100 - e.lp / e.m * 400))}%</b></span>` : ""; }).join("")}</div>` : "";
  if (V.done) return `<div class="gwpv ${V.done.pass ? "ok" : "ko"}"><div class="gwpv-h"><span>🎯 Prova</span><b>${esc(P.t)}</b></div><p class="gwpv-big">${V.done.pass ? "✔ Superata" : "✖ Non superata"} · punteggio <b>${V.done.score}%</b> (serve ${P.need}%)${P.tex && !V.done.texOk ? " · un tipo di flop è sotto la soglia" : ""}</p>${tex}<div class="gwrow"><button class="gwbtn ghost" data-gpvgo="${P.id}">↺ Riprova</button><button class="gwbtn ghost" data-gpvx="1">Continua ad allenarti</button><button class="gwbtn" data-gtabgo="program">Torna al Programma</button></div></div>`;
  return `<div class="gwpv"><div class="gwpv-h"><span>🎯 Prova in corso${V.lockName ? ` · contro ${esc(V.lockName)}` : ""}</span><b>${esc(P.t)}</b></div><div class="gwpv-row"><div class="gwpv-bar"><i style="width:${V.moves / V.n * 100}%"></i></div><span><b>${V.moves}</b>/${V.n} decisioni</span><span>punteggio <b style="color:${sc == null ? "#ddd" : sc >= P.need ? "#5fdca3" : "#ff8a80"}">${sc == null ? "-" : sc + "%"}</b> · serve ${P.need}%</span></div>${tex}${V.next ? `<p class="gwmuted" style="margin:4px 0 0">Alla prossima mano si passa allo spot successivo.</p>` : ""}</div>`;
}
/* ---------- Trova la size ---------- */
async function gwSizeQuizStart(P) {
  if (typeof run !== "undefined" && run) run = null;
  setTab("solver"); gwSetInit();
  GW.sq = { id: P.id, n: P.n, need: P.need, q: 0, ok: 0, cur: null, busy: false, fam: P.fam };
  Object.assign(GW, { layers: [], direct: { oop: "OOP", ip: "IP", pot: 0, stack: 0, title: "Trova la size" }, board: "", customOpen: false, ask: null });
  gwSizeQuizNext();
}
function gwSizeQuizNext() {
  const Q = GW.sq; if (!Q) return;
  const B = gwProbFind(Q.fam[Math.floor(Math.random() * Q.fam.length)]);
  const used = new Set(hsplit(B.board)); let rc; do { rc = Math.floor(Math.random() * 52); } while (used.has(rc));
  const board = B.board.length === 8 ? B.board + hcstr(rc) : B.board, bd = hsplit(board);
  const r0 = svCombos(svParseRange(B.oop)), r1 = svCombos(svParseRange(B.ip));
  const pot = B.pot, stack = B.stack, cands = [33, 75, 150, Math.round(stack / pot * 100)];
  Q.cur = { board, names: B.names, pot, stack, cands, evs: [], choice: null };
  GW.board = board; GW.direct = { oop: B.names[0], ip: B.names[1], pot, stack, title: "Trova la size" };
  Q.busy = true; renderStudy();
  const solveOne = k => {
    if (!GW.sq || GW.sq !== Q) return;
    if (k >= cands.length) { Q.busy = false; renderStudy(); return; }
    const o = gwSolve(bd, pot, stack, [r0, r1], "river", false, { 5: { oop: [], ip: [cands[k]] }, rz: [], allin: false, maxR: 0 }); o.iters = 150; o.noIso = false;
    const E = msInit(o, null, true);
    GW.sqProg = `Calcolo la size ${k + 1} di ${cands.length}...`; const el = $("#gwSqProg"); if (el) el.textContent = GW.sqProg;
    msSolveAuto(E, 150, null, E2 => { Q.cur.evs[k] = E2.stats.ev[1]; setTimeout(() => solveOne(k + 1), 0); });
  };
  setTimeout(() => solveOne(0), 30);
}
function gwSizeQuizHtml() {
  const Q = GW.sq, C = Q.cur, P = gwProvaById(Q.id);
  const lab = (s, i) => i === 3 ? "All-in" : `${s}% del piatto`;
  let h = `<div class="gwpanel gwsq"><div class="gwpv-h"><span>🎯 Prova · Trova la size · domanda ${Math.min(Q.q + 1, Q.n)} di ${Q.n} · giuste ${Q.ok} (servono ${Q.need})</span><b>${esc(P.t)}</b></div>`;
  if (Q.end) return h + `<p class="gwpv-big">${Q.ok >= Q.need ? "✔ Superata" : "✖ Non superata"}: ${Q.ok} giuste su ${Q.n}.</p><div class="gwrow"><button class="gwbtn ghost" data-gpvgo="${P.id}">↺ Riprova</button><button class="gwbtn" data-gtabgo="program">Torna al Programma</button></div></div>`;
  h += `<div class="gwsq-spot"><div class="gwboard2">${hsplit(C.board).map(c => gwCardI(c, true)).join("")}</div><p>River, piatto <b>${fmtN(C.pot)}bb</b>, stack <b>${fmtN(C.stack)}bb</b>. ${esc(C.names[0])} fa check. Quale <b>size singola</b> fa guadagnare di più a ${esc(C.names[1])}, se potesse usare solo quella (oltre al check)?</p></div>`;
  if (Q.busy) h += `<p class="gwmuted" id="gwSqProg">${esc(GW.sqProg || "Calcolo...")}</p><p class="gwmuted">Intanto pensa: range polarizzato o lineare? Quante mani forti ha ${esc(C.names[1])} rispetto a ${esc(C.names[0])}?</p>`;
  const best = C.evs.length === C.cands.length ? C.evs.indexOf(Math.max(...C.evs)) : -1;
  h += `<div class="gwsq-opts">${C.cands.map((s, i) => { const st = C.choice == null ? "" : i === best ? "best" : i === C.choice ? "bad" : ""; return `<button class="gwsq-o ${st}" data-gsq="${i}" ${Q.busy || C.choice != null ? "disabled" : ""}><b>${lab(s, i)}</b>${C.choice != null ? `<small>EV ${fmt(C.evs[i], 2)}bb</small>` : ""}</button>`; }).join("")}</div>`;
  if (C.choice != null) { const good = Math.abs(C.evs[C.choice] - C.evs[best]) <= 0.03; h += `<p class="gwpv-big" style="color:${good ? "#5fdca3" : "#ff8a80"}">${good ? "✔ Giusta" : `✖ La migliore era ${lab(C.cands[best], best)}`} · differenza ${fmt(C.evs[best] - C.evs[C.choice], 2)}bb</p><div class="gwrow"><button class="gwbtn" data-gsqn="1">${Q.q + 1 < Q.n ? "Prossima »" : "Fine"}</button></div>`; }
  return h + `<p class="gwmuted" style="margin:8px 0 0">Il solver risolve il river una volta per ogni size, con i range dello spot. Vale come giusta anche una size a meno di 0,03bb dalla migliore.</p></div>`;
}
function gwProveBind() {
  const Q = s => document.querySelectorAll(s);
  Q("[data-gpvgo]").forEach(b => b.onclick = () => gwProvaStart(b.dataset.gpvgo));
  Q("[data-gpvx]").forEach(b => b.onclick = () => { if (GW.prac) GW.prac.prova = null; renderStudy(); });
  Q("[data-gsq]").forEach(b => b.onclick = () => { const S2 = GW.sq, C = S2.cur, i = +b.dataset.gsq, best = C.evs.indexOf(Math.max(...C.evs)); C.choice = i; if (Math.abs(C.evs[i] - C.evs[best]) <= 0.03) { S2.ok++; try { gSnd.ok(); } catch (e) {} } else { try { gSnd.bad(); } catch (e) {} } renderStudy(); });
  Q("[data-gsqn]").forEach(b => b.onclick = () => { const S2 = GW.sq; S2.q++; if (S2.q >= S2.n) { S2.end = true; gwProvaRec(S2.id, Math.round(S2.ok / S2.n * 100), S2.ok >= S2.need); try { if (S2.ok >= S2.need) { gSnd.done(); gConfetti(1400); } } catch (e) {} renderStudy(); } else gwSizeQuizNext(); });
}
/* sezione del Programma */
function gwProveHtml(L) {
  const A = GW_PROVE[L.id] || []; if (!A.length) return "";
  const ic = { drill: "🧠", table: "🃏", exploit: "🎭", size: "📏", probs: "🧩", review: "🔁", hands: "📥", mind: "🧘" };
  return `<div class="car-prove"><h4>🎯 Prove del livello</h4><div class="car-pv-grid">${A.map(P => { const c = gwProvaCheck(P), r = gwProvaRes(P.id), ok = gwProvaPassed(P); const st = ok ? "✔ Superata" : c ? c.txt : r ? `Migliore: ${r.best}${P.kind === "size" ? "% giuste" : "%"}` : "Da fare"; const crit = P.kind === "table" || P.kind === "exploit" || P.kind === "drill" ? `Serve ${P.need}%` : P.kind === "size" ? `Servono ${P.need} su ${P.n}` : ""; return `<div class="car-pv ${ok ? "ok" : ""}"><span class="car-pv-i">${ic[P.kind] || "🎯"}</span><div><b>${esc(P.t)}</b><p>${esc(P.d)}</p><small>${crit ? crit + " · " : ""}${esc(st)}</small></div><button class="car-link-btn" data-gpvgo="${P.id}">${ok ? "Rifai" : "Avvia"}</button></div>`; }).join("")}</div></div>`;
}

