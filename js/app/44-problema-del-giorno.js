/* ================= PROBLEMA DEL GIORNO ================= */
/* ogni giorno una mano difficile, già impostata: il solver gioca l'avversario, tu giochi la mano fino al river */
const SZ2 = (o4, i4, o5, i5) => ({ 4: { oop: o4, ip: i4 }, 5: { oop: o5, ip: i5 } });
const GW_PROBS = [
  { id: "p1", t: "3-bet pot: nut flush draw in posizione", names: ["BB", "BTN"], hero: 1, hand: "Ad5d", board: "Ks7d4d2c", pot: 37.3, stack: 81.6,
    story: "BTN apre, BB 3-betta a 11bb e tu chiami. Flop K♠7♦4♦: BB punta 33% e chiami. Turn 2♣. Hai A♦5♦: progetto colore al nuts e gutshot per la ruota.",
    tema: "Quando rilanciare un progetto forte e quando realizzare l'equity chiamando, contro un range che polarizza sul turn.",
    key: "Contro la size piccola di BB il solver rilancia A♦5♦ quasi sempre, e contro il bet grande va direttamente all-in: con tante outs e il blocker dell'asso di quadri il raise vince subito spesso e resta forte quando viene chiamato. Se BB fa check, però, prende soprattutto la carta gratis e punta solo a volte. Contro un all-in diretto il prezzo è al limite: fold e call si alternano.",
    oop: "AA,KK,QQ,JJ:0.6,AKs,AKo,AQs,KQs,KJs,AJs:0.5,A5s:0.5,A4s:0.5,76s:0.5,65s:0.5,QJs:0.4,KTs",
    ip: "QQ:0.4,JJ,TT,99,88,77,66:0.5,55:0.5,44,AQs:0.5,KQs,KJs,KTs,K9s,QJs:0.3,JTs:0.3,98s:0.5,87s,76s,65s,A5s,A4s,A3s:0.5",
    sz: SZ2([33, 100], [50, 100], [50, 125], [50, 100]) },
  { id: "p2", t: "Check-raise al flop, poi il combo draw", names: ["BB", "BTN"], hero: 0, hand: "QsTs", board: "Js9s4h2d", pot: 20.5, stack: 90,
    story: "BTN apre, tu chiami dal BB. Flop J♠9♠4♥: BTN punta 1,8bb, fai check-raise a 7,5bb e lui chiama. Turn 2♦. Hai Q♠T♠: scala aperta e progetto colore.",
    tema: "Continuare l'aggressione col draw più forte, e scegliere la size giusta per non isolarti contro le mani migliori.",
    key: "Q♠T♠ continua quasi sempre al turn, soprattutto con la size media e a volte in overbet. Se invece fai check e BTN punta, il check-raise è quasi obbligato. Dopo aver puntato 50% contro l'all-in di BTN il solver folda quasi sempre (stack ancora profondi, BTN ha tanti set e doppie coppie); dopo l'overbet invece sei impegnato e chiami.",
    oop: "99,44,J9s,J9o:0.5,QTs,QTo:0.5,T8s,T8o:0.4,87s:0.5,KQs:0.4,KTs:0.5,Q8s:0.4,AJs:0.3,A5s:0.3,A4s:0.3,76s:0.3,JTs:0.4,KJs:0.3",
    ip: "JJ,99:0.5,AJs,AJo,KJs,KJo,QJs,QJo:0.7,JTs,J8s,T9s,98s,A9s,K9s,Q9s,AKs:0.5,AQs:0.5,KQs:0.5,QQ:0.4,KK:0.4,AA:0.4,TT:0.6,A5s:0.3,87s:0.5",
    sz: SZ2([50, 125], [50, 100], [50, 125], [50, 100]) },
  { id: "p3", t: "BvB: difendere col progetto in posizione", names: ["SB", "BB"], hero: 1, hand: "7c6c", board: "Ah8c3c5h", pot: 10, stack: 95,
    story: "SB apre a 3bb, tu chiami dal BB. Flop A♥8♣3♣: SB punta 2bb e chiami. Turn 5♥. Hai 7♣6♣: progetto colore e scala a un buco (serve il 4).",
    tema: "Giocare un draw in posizione contro un range largo: float, raise o fold contro il secondo barrel.",
    key: "7♣6♣ in posizione non passa mai: se SB fa check punta sempre (metà del piatto o piatto intero), e contro le bet di SB rilancia quasi sempre invece di chiamare. In BvB il range di SB è largo e poco protetto, e il progetto ha abbastanza equity per spingere fold dalle mani medie.",
    oop: "22+,A2s+,A2o+,K5s+,K9o+,Q8s+,QTo+,J8s+,JTo,T8s+,97s+,86s+,75s+,65s,54s",
    ip: "A2o+,A2s+,88:0.5,33:0.5,98s,87s,86s,76s,65s,54s,T8s,97s,KQs:0.4,KJs:0.4,QJs:0.4,JTs:0.5,T9s:0.5,K8s:0.5,Q8s:0.5,J8s:0.5,44:0.5,55:0.5,66:0.5,77:0.5,99:0.5,TT:0.5",
    sz: SZ2([33, 75], [50, 100], [33, 125], [50, 100]) },
  { id: "p4", t: "River: colore chiuso con top pair", names: ["CO", "BTN"], hero: 0, hand: "AsQd", board: "Qh9h5c3s2h", pot: 29.1, stack: 86.2,
    story: "Apri dal CO, BTN 3-betta a 8bb e chiami. Flop Q♥9♥5♣: check, BTN punta 33% e chiami. Turn 3♠, check check. River 2♥: il colore è chiuso. Hai A♠Q♦.",
    tema: "Bluff catch contro un range polarizzato: quando chiudi il colore, quanto spesso l'avversario bluffa davvero?",
    key: "Al river si fa check quasi sempre: puntare non fa foldare niente di peggio. Contro la size media e il piatto intero A♠Q♦ chiama sempre, e chiama quasi sempre anche contro l'overbet 150%: i progetti mancati e i bluff di BTN sono abbastanza. Solo contro l'all-in (tre volte il piatto) diventa un misto tra fold e call.",
    oop: "TT,JJ:0.6,88,77,66,AQs,AQo:0.7,KQs,QJs,QTs,JTs,T9s,98s,AJs:0.5,ATs:0.5,KJs:0.5,A5s:0.3",
    ip: "AA:0.2,KK:0.3,QQ:0.2,JJ:0.5,TT:0.5,AQs,AQo:0.5,AKs:0.5,AKo:0.5,AJs,KQs,KJs,QJs:0.5,JTs,A5s,A4s,A3s:0.5,T8s:0.5,87s:0.5,76s:0.5,KTs:0.5,ATs",
    sz: { 5: { oop: [33, 75], ip: [50, 100, 150] } } },
  { id: "p5", t: "Pot 4-bet con SPR basso", names: ["CO", "BTN"], hero: 1, hand: "JsJc", board: "Th6c2d9s", pot: 62.3, stack: 69.6,
    story: "CO apre, tu 3-betti dal BTN, CO 4-betta a 20bb e chiami. Flop T♥6♣2♦: CO punta 25% e chiami. Turn 9♠. Hai J♠J♣ con poco più di uno stack pari al piatto.",
    tema: "Con SPR sotto 1,5 ogni decisione vale lo stack: quando mettere i soldi dentro con una overpair debole.",
    key: "Se CO fa check, J♠J♣ fa quasi sempre check dietro per controllare il piatto. Contro la size piccola si chiama sempre, mai all-in: il raise fa foldare le mani peggiori e fa chiamare solo le overpair. Contro l'all-in del CO è un misto tra call e fold: JJ batte AK e i bluff con l'asso, ma perde contro AA, KK e QQ.",
    oop: "AA,KK,QQ,JJ:0.5,AKs,AKo,A5s,A4s:0.5,AQs:0.3,KQs:0.2",
    ip: "QQ,JJ,TT,99:0.5,AKs,AKo,AQs,AQo:0.3,KQs:0.5,AJs:0.3,66:0.3,22:0.2,88:0.3,77:0.3",
    sz: SZ2([33], [50], [50], [50]) },
  { id: "p6", t: "Asso al turn: come barrellare il combo draw", names: ["BB", "BTN"], hero: 1, hand: "9s7s", board: "8s6d2cAs", pot: 9.1, stack: 95.7,
    story: "Apri dal BTN, BB chiama. Flop 8♠6♦2♣: punti 33% e BB chiama. Turn A♠. Hai 9♠7♠: scala bilaterale e ora anche progetto colore.",
    tema: "Le carte che favoriscono chi ha aperto: quale size usare con un draw forte quando il tuo range ha gli assi.",
    key: "9♠7♠ punta sempre quando BB fa check, ma soprattutto piccolo o medio: l'overbet è solo una piccola parte. Il progetto ha tanta equity e non ha bisogno di massimizzare i fold. Se BB fa lead, il raise è sempre la scelta: blocca il suo range e ti prende il piatto o ti tiene dentro con 15 outs.",
    oop: "99,88,77,66,55,44,33,22,A8s,A7s,A6s,A5s,A4s,A3s,A2s,K8s,Q8s,J8s,T8s,98s,97s,87s,86s,76s,75s,65s,64s,54s,A8o,K8o:0.5,Q8o:0.5,J8o:0.5,T8o,98o,97o,87o,86o,76o,65o,K6s,Q6s:0.5,J9s,T9s,JTs:0.5,QJs:0.4,KTs:0.4,43s:0.5,53s:0.5",
    ip: "22+,A2s+,K2s+,Q5s+,J7s+,T7s+,96s+,85s+,74s+,64s+,53s+,43s,A2o+,K8o+,Q9o+,J9o+,T9o,98o",
    sz: SZ2([33], [33, 75, 150], [50], [33, 75, 150]) },
  { id: "p7", t: "River: quanto value con top pair debole?", names: ["BB", "CO"], hero: 1, hand: "Kh9h", board: "KdTc6h4s2d", pot: 9.1, stack: 95.7,
    story: "Apri dal CO, BB chiama. Flop K♦T♣6♥: punti 33% e BB chiama. Turn 4♠: check check. River 2♦. Hai K♥9♥, top pair con kicker debole.",
    tema: "Il value thin: quali mani peggiori ti pagano dopo che hai mostrato debolezza al turn?",
    key: "Quando BB fa check, K♥9♥ punta quasi sempre, con la size piccola o media e a volte in overbet: il check al turn di BB e il suo range pieno di Tx, 6x e Kx peggiori pagano spesso. Contro il lead piccolo di BB il solver rilancia per value, contro il lead grande chiama: la size di chi punta cambia il suo range.",
    oop: "TT:0.5,66:0.5,KQo:0.6,KJo:0.6,KQs:0.3,KJs:0.4,K6s:0.5,KTo:0.3,K8s,K7s,K5s,K4s:0.5,K9o:0.5,K8o,K7o:0.5,QTs,JTs,T9s,T8s,T7s,QTo,JTo,T9o,A6s,76s,65s,86s,QJs,QJo,J9s,Q9s,98s,97s,A5s:0.5,A4s:0.5,A3s:0.5,A2s:0.5,44:0.5,55,77,88,99,33:0.4",
    ip: "KQo:0.3,KJo:0.5,KTo:0.3,K9s,K8s:0.5,KJs:0.3,QTs,JTs,T9s,TT:0.2,QQ,JJ,99,88,77,A5s,A4s,QJs,QJo,J9s,98s,87s,AQo,AJo,ATs:0.5",
    sz: { 5: { oop: [33, 75], ip: [33, 75, 150] } } },
  { id: "p8", t: "KK nel 3-bet pot su board con l'asso", names: ["SB", "BTN"], hero: 0, hand: "KsKh", board: "AcJd6s6d3h", pot: 37.5, stack: 81.8,
    story: "BTN apre, tu 3-betti dallo SB a 12bb e chiama. Flop A♣J♦6♠: punti 25% e chiama. Turn 6♦: check check. River 3♥. Hai K♠K♥.",
    tema: "Fuori posizione con un bluff catcher forte: check-call, check-fold o puntare per protezione e value?",
    key: "Si alterna check e bet piccola. Dopo il check, contro la size media K♠K♥ chiama spesso; contro il piatto intero o l'overbet il solver folda quasi sempre: con il flush impossibile BTN arriva al river con pochi bluff, e le sue size grandi sono quasi tutte Ax e J. Una mano forte non basta se l'avversario non ha abbastanza bluff.",
    oop: "KK,QQ,JJ:0.3,TT,99,AKs:0.5,AKo:0.5,AQs,AQo,AJs:0.5,KQs,KJs,QJs,JTs,A5s:0.5,A4s:0.5,T9s,98s:0.5,88,77",
    ip: "AQs,AQo,AJs,AJo,ATs,A9s,A5s:0.5,KJs,QJs,JTs,J9s,99,88,77,TT,QQ:0.5,KQs:0.5,T9s:0.5,98s:0.5,66:0.3,65s:0.4",
    sz: { 5: { oop: [33, 75], ip: [50, 100, 150] } } },
  { id: "p9", t: "Flop monotono: l'asso di cuori senza coppia", names: ["BB", "BTN"], hero: 0, hand: "Ah4c", board: "9h6h3hKc", pot: 9.1, stack: 95.7,
    story: "BTN apre, chiami dal BB. Flop 9♥6♥3♥: BTN punta 33% e chiami. Turn K♣. Hai A♥4♣: nessuna coppia, ma il blocker del colore al nuts.",
    tema: "Bluffare con il blocker giusto: il check-raise sul turn quando l'avversario non può avere il colore al nuts.",
    key: "A♥4♣ alterna check e bet piccola. Dopo il check, contro qualsiasi bet di BTN il check-raise è quasi sempre la scelta: l'A♥ toglie i colori al nuts e BTN non può difendersi bene. Dopo il check-raise, però, contro l'all-in di BTN si folda sempre: il blocker non ti fa vincere lo showdown.",
    oop: "99:0.5,66:0.5,33:0.5,88,77,55,44,22,TT,JJ,A9s,A9o,A6s,A6o:0.5,A4o:0.6,A5o:0.6,K9s,Q9s,J9s,T9s,98s,97s,87s,86s,76s,75s,65s,64s,54s,KQs,KJs,QJs,JTs,KTs,T8s,A2s,A3s,A4s,A5s,A7s,A8s,K6s,Q6s",
    ip: "22+,A2s+,K5s+,Q8s+,J8s+,T8s+,97s+,86s+,75s+,65s,54s,A5o+,KTo+,QTo+,JTo",
    sz: SZ2([33, 100], [50, 100], [50, 125], [50, 100]) },
  { id: "p10", t: "AA quando la scala entra", names: ["SB", "BB"], hero: 0, hand: "AhAd", board: "Th8h5c7s", pot: 12, stack: 94,
    story: "Apri dallo SB a 3bb, BB chiama. Flop T♥8♥5♣: punti 50% e BB chiama. Turn 7♠: chiude tutte le scale con il 9 e il 6. Hai A♥A♦.",
    tema: "Una overpair su un turn che cambia le nut: proteggere, controllare il piatto o giocare contro il check-raise.",
    key: "A♥A♦ alterna check e bet piccola. Contro la bet di BB dopo il check chiama spesso e rilancia solo a volte. Il punto chiave: contro il check-raise all-in AA folda quasi sempre, e anche contro il check-raise normale dopo una bet grande folda spesso. Su questo turn BB ha troppe scale e doppie coppie.",
    oop: "22:0.6,33:0.6,44:0.6,66:0.6,AA,KK,QQ,JJ,TT,99,88,77,55,AKs,AQs,AJs,ATs,A9s,A5s,A4s,KQs,KJs,KTs,QJs,QTs,JTs,J9s,T9s,98s,87s,76s,65s,AKo,AQo,AJo,ATo,KQo,KTo,QTo,JTo,T9o,98o:0.5,A8s:0.5,K9s:0.5",
    ip: "99,88:0.5,77,66,55:0.5,ATo:0.5,KTs,QTs,JTs,T9s,T7s,T6s,98s,97s,96s,87s,86s,76s,75s,65s,64s,A5s,A4s,A3s,A2s,A7s,A6s,KTo,QTo,JTo,T9o,98o,97o,87o,76o,65o,J9s,Q9s,K9s,J8s,Q8s,K8s,54s",
    sz: SZ2([33, 100], [50, 100], [50, 125], [50, 100]) },
];
const gwDayNum = () => Math.floor(Date.parse(today() + "T12:00:00Z") / 864e5);
const gwProbToday = () => GW_PROBS[((gwDayNum() % GW_PROBS.length) + GW_PROBS.length) % GW_PROBS.length];
const gwProbCards = s => (s.match(/../g) || []).map(c => gwCardS(c)).join("");
function gwProbRes(pid) { const all = (S.daily || {}); return Object.values(all).filter(x => x.pid === pid).sort((a, b) => b.best - a.best)[0] || null; }
/* problemi: quelli scritti a mano, quelli generati dal solver e quello della tua mano aperta ora */
function gwProbFind(pid) { return GW_PROBS.find(x => x.id === pid) || (S.genProbs || []).find(x => x.id === pid) || (GW.probTmp && GW.probTmp.id === pid ? GW.probTmp : null); }
function gwProbO(P) {
  const board = hsplit(P.board), r0 = svCombos(svParseRange(P.oop)), r1 = svCombos(svParseRange(P.ip));
  const hc = P.hand ? hsplit(P.hand) : null, R = P.hero ? r1 : r0;
  if (hc && !R.some(x => (x.c[0] === hc[0] && x.c[1] === hc[1]) || (x.c[0] === hc[1] && x.c[1] === hc[0]))) R.push({ c: hc, w: 1, key: "" });
  const sets = { rz: P.rz || [75], allin: true, maxR: P.maxR || 1 }; for (let s = board.length; s <= 5; s++) sets[s] = P.sz[s];
  return gwSolve(board, P.pot, P.stack, [r0, r1], board.length === 4 ? "turn" : "river", false, sets);
}
function gwProbPlay(P, E) {
  const L = { E, steps: [], oop: P.names[0], ip: P.names[1] };
  GW.layers = [L]; GW.tab = "prac"; GW.sel = null; GW.filter = null;
  const PR = gwPracState();
  Object.assign(PR, { mode: "hand", diff: "std", input: "act", pause: "action", side: P.hero, hand: null, fv: null });
  PR.fixed = { L, hero: P.hero, cards: hsplit(P.hand), pid: P.id, steps: (P.steps || []).slice() };
  gwPracNew();
}
function gwDailyStart(pid) {
  if (!solverOk()) { gToast("🔒 I problemi del giorno usano il Solver, che si sblocca a <b>NL25</b>."); return; }
  const P = gwProbFind(pid) || gwProbToday();
  if (typeof run !== "undefined" && run) run = null;
  setTab("solver");
  gwSetInit();
  const board = hsplit(P.board), r0 = svCombos(svParseRange(P.oop)), r1 = svCombos(svParseRange(P.ip));
  const hc = hsplit(P.hand), R = P.hero ? r1 : r0;
  if (!R.some(x => (x.c[0] === hc[0] && x.c[1] === hc[1]) || (x.c[0] === hc[1] && x.c[1] === hc[0]))) R.push({ c: hc, w: 1, key: "" });
  GW.direct = { oop: P.names[0], ip: P.names[1], pot: P.pot, stack: P.stack, title: "Problema del giorno" };
  GW.board = P.board; GW.layers = []; GW.customOpen = false; GW.cache = new Map(); GW.ask = null; GW.showSet = false; GW.showLib = false;
  GW.cf = { oop: P.oop, ip: P.ip, edit: P.hero, brush: 100, board: P.board, pot: P.pot, stack: P.stack, names: P.names.slice() };
  gwStartSolve(gwProbO(P), `Preparo il problema: ${P.t}`, E => gwProbPlay(P, E));
}
/* ---------- problemi generati dal solver ---------- */
const GW_GENT = [
  { names: ["BB", "BTN"], oop: "bb_btn|1", ip: "rfi_btn|1", pot: 5.5, stack: 97.5, agg: 1, pre: "BTN apre, BB chiama" },
  { names: ["BB", "CO"], oop: "bb_co|1", ip: "rfi_co|1", pot: 4.9, stack: 97.8, agg: 1, pre: "CO apre, BB chiama" },
  { names: ["SB", "BB"], oop: "rfi_sb|1", ip: "bb_sb|1", pot: 6, stack: 97, agg: 0, pre: "SB apre, BB chiama" },
];
/* range per classe di mano dai reach delle combo */
function gwReachStr(G, p, r) { const s = {}, c = {}; for (let i = 0; i < G.n[p]; i++) { const k = G.R[p][i].key; s[k] = (s[k] || 0) + r[i]; c[k] = (c[k] || 0) + 1; } const w = {}; Object.keys(s).forEach(k => { const v = s[k] / c[k]; if (v > 0.01) w[k] = Math.min(1, v); }); return svRangeStr(w); }
/* la combo più difficile: la più giocata tra quelle con due azioni quasi uguali in EV */
function gwProbPick(E, steps, hero) {
  const I = msNodeInfo(E, steps, true), np = I.np, n = I.node, pot = E.o.pot + n.inv[0] + n.inv[1];
  let mx = 0; for (let i = 0; i < np; i++) mx = Math.max(mx, I.rp[i]);
  let best = null;
  for (let i = 0; i < np; i++) {
    if (I.rp[i] < 0.3 * mx) continue;
    const ev = n.acts.map((_, a) => I.evA[a][i]).filter(x => x != null).sort((a, b) => b - a); if (ev.length < 2) continue;
    const gap = (ev[0] - ev[1]) / pot; if (!best || gap < best.gap) best = { i, gap };
  }
  if (!best) return null;
  return { i: best.i, cards: [E.G.c0[hero][best.i], E.G.c1[hero][best.i]].map(hcstr).join("") };
}
function gwProbKeyAuto(E, steps, hero, cards) {
  try {
    const I = msNodeInfo(E, steps, true), n = I.node, np = I.np, hc = hsplit(cards);
    let i = -1; for (let k = 0; k < np; k++) { const a = E.G.c0[hero][k], b = E.G.c1[hero][k]; if ((a === hc[0] && b === hc[1]) || (a === hc[1] && b === hc[0])) i = k; }
    if (i < 0) return "";
    const rows = n.acts.map((a, k) => ({ lab: gwLab(a, E, n), f: I.st[k * np + i], ev: I.evA[k][i] })).filter(r => r.ev != null);
    const top = rows.slice().sort((a, b) => b.ev - a.ev);
    return `Con ${cards.match(/../g).join(" ")} il solver gioca: ${rows.filter(r => r.f > 0.005).map(r => `${r.lab} ${Math.round(r.f * 100)}%`).join(", ")}. In EV: ${rows.map(r => `${r.lab} ${fmt(r.ev, 2)}bb`).join(", ")}. ${top.length > 1 ? `Tra la migliore (${top[0].lab}) e la seconda (${top[1].lab}) ci sono ${fmt(top[0].ev - top[1].ev, 2)}bb: ${top[0].ev - top[1].ev < 0.15 ? "sono quasi uguali, per questo il solver mescola" : "la differenza è netta"}.` : ""}`;
  } catch (e) { return ""; }
}
function gwProbGen() {
  if (!solverOk()) { gToast("🔒 I problemi usano il Solver, che si sblocca a <b>NL25</b>."); return; }
  if (GW.busy) return;
  if (typeof run !== "undefined" && run) run = null;
  setTab("solver"); gwSetInit();
  const T = GW_GENT[Math.floor(Math.random() * GW_GENT.length)];
  const fl = GW_FLOPSUB[Math.floor(Math.random() * GW_FLOPSUB.length)].b, board = hsplit(fl);
  const r0 = svCombos(svParseRange(svPresetStr(T.oop))), r1 = svCombos(svParseRange(svPresetStr(T.ip)));
  Object.assign(GW, { direct: { oop: T.names[0], ip: T.names[1], pot: T.pot, stack: T.stack, title: "Problema generato" }, board: fl, layers: [], customOpen: false, cache: new Map(), ask: null, showSet: false, showLib: false });
  const it0 = GW.set.it; GW.set.it = 50;
  const o = gwSolve(board, T.pot, T.stack, [r0, r1], "flop", T.agg === 0, { 3: { oop: T.agg === 0 ? [33] : [], ip: [33] }, 4: { oop: [75], ip: [75] }, 5: { oop: [75], ip: [75] }, rz: [75], allin: true, maxR: 1 });
  GW.set.it = it0; o.iters = 50;
  gwStartSolve(o, `Genero un problema (1/2): flop ${fl}, ${T.pre}`, E => {
    /* linea del flop: chi ha aperto punta 33% e l'altro chiama */
    const root = E.tree.root, steps = [];
    let n = root;
    if (T.agg === 1) { steps.push(n.acts.findIndex(a => a.kind === "check")); n = n.ch[steps[0]]; }
    const bi = n.acts.findIndex(a => a.kind === "bet"); steps.push(bi); n = n.ch[bi];
    const ci = n.acts.findIndex(a => a.kind === "call"); steps.push(ci); n = n.ch[ci];
    if (!n || n.t !== "c") { GW.layers = [{ E, steps: [], oop: T.names[0], ip: T.names[1] }]; return; }
    const { r } = msReach(E, steps);
    const used = new Set(board); let tc; do { tc = Math.floor(Math.random() * 52); } while (used.has(tc));
    const P = { id: "g" + Date.now().toString(36), gen: true, names: T.names.slice(), board: fl + hcstr(tc), pot: Math.round((E.o.pot + n.inv[0] + n.inv[1]) * 10) / 10, stack: Math.round((E.o.stack - n.inv[0]) * 10) / 10, oop: gwReachStr(E.G, 0, r[0]), ip: gwReachStr(E.G, 1, r[1]), sz: SZ2([50, 100], [50, 100], [50, 100], [50, 100]), maxR: 1 };
    const line = T.agg === 1 ? `${T.names[0]} fa check, ${T.names[1]} punta 33% e ${T.names[0]} chiama` : `${T.names[0]} punta 33% e ${T.names[1]} chiama`;
    GW.board = P.board; GW.direct = { oop: P.names[0], ip: P.names[1], pot: P.pot, stack: P.stack, title: "Problema generato" };
    setTimeout(() => gwStartSolve(gwProbO(P), `Genero un problema (2/2): turn ${hcstr(tc)}`, E2 => {
      const hero = Math.random() < 0.5 ? 0 : 1, root2 = E2.tree.root;
      let st2 = [];
      if (hero === 1) { const I0 = msNodeInfo(E2, [], false); let k = 0; I0.freq.forEach((f, a) => { if (f > I0.freq[k]) k = a; }); if (root2.ch[k] && root2.ch[k].t === "a") st2 = [k]; }
      let pick = gwProbPick(E2, st2, hero), h2 = hero;
      if (!pick) { h2 = 0; st2 = []; pick = gwProbPick(E2, [], 0); }
      if (!pick) return;
      const first = st2.length ? ` ${P.names[0]} ${gwLab(root2.acts[st2[0]], E2, root2).toLowerCase()}.` : "";
      Object.assign(P, { hero: h2, hand: pick.cards, steps: st2, t: `${P.names[h2]} con ${pick.cards.match(/../g).join(" ")} sul turn`, story: `${T.pre}. Flop ${fl.match(/../g).join(" ")}: ${line}. Turn ${hcstr(tc)}.${first} Hai ${pick.cards.match(/../g).join(" ")}.`, tema: "Problema generato dal solver: tra le tue mani più giocate in questo spot è quella con due scelte quasi uguali in EV, cioè la decisione più difficile." });
      P.key = gwProbKeyAuto(E2, st2, h2, pick.cards);
      S.genProbs = [P, ...(S.genProbs || [])].slice(0, 30); persistSoon();
      gwProbPlay(P, E2);
    }), 0);
  });
}
/* ---------- rigioca una tua mano come problema ---------- */
function gwHandProblem(cfg, lockName) {
  cfg.after = L => {
    const hero = cfg.heroPl, cards = cfg.heroCombo.map(hcstr).join("");
    const P = { id: "h" + Date.now().toString(36), hand: cards, hero, names: [L.oop, L.ip], t: `La tua mano: ${cfg.src || "mano importata"}`, story: `Board ${cfg.boardS.match(/../g).join(" ")}, piatto ${fmtN(cfg.pot)}bb, stack ${fmtN(cfg.stack)}bb. Rigioca la decisione che hai preso al tavolo, con le stesse size: il solver gioca l'avversario${lockName ? " con il profilo che hai analizzato" : ""}.`, tema: "Le tue mani vere: rigiocale finché la decisione non diventa automatica.", steps: L.steps.slice() };
    P.key = gwProbKeyAuto(L.E, L.steps, hero, cards);
    GW.probTmp = P;
    GW.tab = "prac"; const PR = gwPracState();
    Object.assign(PR, { mode: "hand", diff: "std", input: "act", pause: "action", side: hero, hand: null, fv: null });
    PR.fixed = { L, hero, cards: cfg.heroCombo.slice(), pid: P.id, steps: L.steps.slice() };
    gwPracNew();
  };
  gwOpenHand(cfg, lockName);
}
/* il combo fisso dell'eroe nel problema */
function gwProbHeroIdx(G, F) { for (let i = 0; i < G.n[F.hero]; i++) { const a = G.c0[F.hero][i], b = G.c1[F.hero][i]; if ((a === F.cards[0] && b === F.cards[1]) || (a === F.cards[1] && b === F.cards[0])) return i; } return -1; }
/* testata e risultato nella schermata Allenati */
function gwProbBanner(PR, H) {
  const F = PR.fixed, P = gwProbFind(F.pid); if (!P) return "";
  if (!P.key) P.key = gwProbKeyAuto(F.L.E, F.steps || [], F.hero, P.hand);
  let h = `<div class="gwprob"><div class="gwprob-h"><span>🧩 ${P.gen ? "Problema generato" : P.id[0] === "h" ? "La tua mano" : "Problema del giorno"}</span><b>${esc(P.t)}</b></div><p>${esc(P.story)}</p><p class="gwprob-t"><b>Tema:</b> ${esc(P.tema)}</p>`;
  if (H && H.done) {
    const hs = PR.hist.slice(H.h0 || 0), loss = hs.reduce((s, x) => s + x.loss, 0), lp = hs.reduce((s, x) => s + Math.min(x.lossPot, 0.25), 0);
    const score = Math.max(0, Math.round(100 - lp * 300)), g = score >= 95 ? ["#3fd07a", "Da professionista"] : score >= 80 ? ["#8fdc6e", "Molto bene"] : score >= 60 ? ["#f0c24b", "Qualche imprecisione"] : ["#ff5c5c", "Da rivedere"];
    if (!H.probRec) {
      H.probRec = true;
      S.daily = S.daily || {}; const d = today() + "|" + P.id, prev = S.daily[d];
      const same = prev && prev.pid === P.id;
      S.daily[d] = { pid: P.id, first: same ? prev.first : score, best: same ? Math.max(prev.best, score) : score, tries: same ? prev.tries + 1 : 1 };
      if (!same && P.id === gwProbToday().id) { try { gAddXP(20 + Math.round(score / 5)); } catch (e) {} }
      persistSoon();
    }
    h += `<div class="gwprob-r" style="border-color:${g[0]}"><div><span>Punteggio</span><b style="color:${g[0]}">${score}</b><em>${g[1]}</em></div><div><span>Decisioni</span><b>${hs.length}</b></div><div><span>EV perso</span><b>${fmt(loss, 2)} bb</b></div></div>
      <div class="gwprob-k"><b>Cosa dice il solver</b><p>${esc(P.key)}</p></div>
      <div class="gwrow" style="margin:8px 0 0"><button class="gwbtn ghost" data-gpr="1">↺ Rigioca la stessa mano</button><button class="gwbtn ghost" data-gpn="1">Nuove carte all'avversario</button><button class="gwbtn ghost" data-gprobgen="1">✨ Genera un altro problema</button><button class="gwbtn ghost" data-gtabgo="program">Torna al Programma</button></div>`;
  } else h += `<p class="gwmuted" style="margin:6px 0 0">Il solver gioca l'avversario con la sua strategia, tu hai sempre ${gwProbCards(P.hand)}. Dopo ogni decisione vedi il voto e le frequenze giuste.</p>`;
  return h + `</div>`;
}

