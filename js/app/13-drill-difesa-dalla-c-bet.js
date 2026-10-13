/* ================= DRILL: DIFESA DALLA C-BET (lezione 10.12) =================
   BB contro BTN, piatto singolo rilanciato: open 2,5bb, call del BB, piatto 5,5bb al flop.
   Il BB fa check (niente donk bet), il BTN punta 33% (1,8bb) o 75% (4,1bb). */
const CBD_RANGE = "22+, A2s+, K2s+, Q5s+, J7s+, T7s+, 96s+, 86s+, 75s+, 64s+, 54s, 43s, A2o+, K9o+, Q9o+, J9o+, T9o, 98o, 87o";
const CBD_SIZES = { s: { n: "33%", b: 1.8, eq: 20, def: 75 }, l: { n: "75%", b: 4.1, eq: 30, def: 57 } };
let CBD_COMBOS = null;
function cbdStraight(set) { const has = r => set.has(r) || (r === 1 && set.has(14)); for (let lo = 1; lo <= 10; lo++) { let ok = true; for (let r = lo; r < lo + 5; r++) if (!has(r)) { ok = false; break; } if (ok) return true; } return false; }
function cbdClass(hand, board) {
  const h = hand.map(c => ({ r: rv(c[0]), s: c[1] })), b = board.map(c => ({ r: rv(c[0]), s: c[1] }));
  const u = [...new Set(b.map(x => x.r))].sort((x, y) => y - x);
  const cnt = r => b.filter(x => x.r === r).length;
  const pp = h[0].r === h[1].r, hv = h.map(x => x.r);
  const v = djEval([...hand, ...board].map(djC)), cat = djCat(v);
  const set = pp && cnt(hv[0]) >= 1, trips = !pp && hv.some(r => cnt(r) === 2), two = !pp && hv[0] !== hv[1] && cnt(hv[0]) === 1 && cnt(hv[1]) === 1 && u.length === 3;
  const monster = set || trips || two || cat >= 4;
  let pair = null;
  if (!monster) {
    if (pp) pair = hv[0] > u[0] ? "top" : u[1] != null && hv[0] > u[1] ? "mid" : "weak";
    else { const m = hv.filter(r => cnt(r) === 1).sort((x, y) => y - x)[0]; if (m != null) pair = m === u[0] ? "top" : m === u[1] ? "mid" : "weak"; }
  }
  /* progetti */
  const suitN = s => [...h, ...b].filter(x => x.s === s).length;
  const fd = cat < 5 && h.some(x => suitN(x.s) === 4);
  const bdfd = h[0].s === h[1].s && b.filter(x => x.s === h[0].s).length === 1;
  const all = new Set([...hv, ...b.map(x => x.r)]), bs = new Set(b.map(x => x.r));
  let outsR = 0;
  if (cat < 4) for (let x = 2; x <= 14; x++) { if (all.has(x)) continue; const a = new Set([...all, x]), o = new Set([...bs, x]); if (cbdStraight(a) && !cbdStraight(o)) outsR++; }
  const oesd = outsR >= 2, gut = outsR === 1;
  /* backdoor di scala: almeno due finestre di cinque ranghi con tre carte diverse, entrambe le tue dentro */
  const lowA = r => (r === 14 ? [14, 1] : [r]);
  let bdsd = false;
  if (!oesd && !gut && !pp && cat < 4) { let w = 0; for (let lo = 1; lo <= 10; lo++) { const inW = r => lowA(r).some(x => x >= lo && x <= lo + 4); if (hv.every(inW) && [...all].filter(inW).length >= 3) w++; } bdsd = w >= 2; }
  const over = !pp && hv.every(r => r > u[0]);
  const ace = !pp && hv.includes(14);
  return { monster, pair, fd, oesd, gut, bdfd, bdsd, over, ace, combo: fd && oesd, cat, name: djName(v) };
}
/* risposta di riferimento: [migliore, { alternativa: punteggio parziale }, motivo] */
function cbdAnswer(k, sz) {
  const big = sz === "l";
  if (k.monster) return ["raise", { call: 50 }, "Mano fortissima (set, doppia, scala, colore): vuole un piatto grande e protezione. È la mano da check-raise."];
  if (k.combo) return ["raise", { call: 60 }, "Progetto colore più progetto di scala aperto: tanta equity, e quando rilanci vinci anche subito se lui folda. È uno dei progetti da check-raise."];
  if (k.pair === "top") return ["call", { raise: 30 }, "Top pair o overpair: davanti a quasi tutto il range con cui punta, ma non abbastanza forte da rilanciare. Paghi e decidi al turn."];
  if (k.pair === "mid") return ["call", { fold: big ? 20 : 0 }, `Coppia media: ${big ? "contro il 75% regge ancora il prezzo del 30%" : "contro la size piccola è un call facile"}.`];
  if (k.pair === "weak") {
    if (k.fd || k.oesd) return ["call", { fold: 30 }, "Coppia bassa più un progetto: abbastanza equity anche contro la size grande."];
    return big ? ["fold", { call: 40 }, "Coppia bassa senza aiuti contro la size grande: serve il 30% e al turn soffre quasi ogni carta. Si folda spesso."] : ["call", { fold: 20 }, "Coppia bassa contro la size piccola: serve solo il 20%, la tieni."];
  }
  if (k.fd || k.oesd) return ["call", { raise: big ? 30 : 50, fold: 0 }, `${k.fd ? "Progetto colore" : "Progetto di scala aperto"}: circa un terzo di equity con due carte da vedere, più del prezzo che ti serve.`];
  if (k.gut) {
    if (!big) return ["call", { fold: 30 }, "Gutshot contro la size piccola: ti serve il 20%, il progetto più le carte alte bastano."];
    if (k.over) return ["call", { fold: 40 }, "Gutshot con due overcard: contro il 75% raggiungi il prezzo grazie alle carte che ti danno anche la top pair."];
    return ["fold", { call: 40 }, "Gutshot da solo contro la size grande: circa 4 outs per carta non bastano per il 30% di equity."];
  }
  if (k.over || k.bdfd || k.bdsd) { const w = k.over ? "Due overcard" : k.bdfd && k.bdsd ? "Backdoor di colore e di scala" : k.bdfd ? "Backdoor di colore" : "Backdoor di scala"; return big ? ["fold", { call: 30 }, `${w} contro la size grande: serve il 30% di equity e la mano non lo ha.`] : ["call", { fold: 30 }, `${w}: contro la size piccola basta il 20% e la mano ci arriva, contando anche le volte che accoppi una carta.`]; }
  if (k.ace && !big) return ["fold", { call: 50 }, "Asso alto senza progetti: al limite contro la size piccola. Con altre mani migliori da difendere, qui si folda."];
  return ["fold", {}, "Aria senza progetti: nessuna coppia, niente da migliorare. Il fold è facile anche contro la size piccola."];
}
DRILLS.cbdef = {
  name: "Difesa dalla c-bet", short: "Difesa c-bet", time: 25,
  desc: "Sei nel BB contro l'open del BTN, fai check e lui c-betta: fold, call o check-raise?",
  rule: "Piatto 5,5bb. Contro il 33% (1,8bb) ti serve il 20% di equity e difendi circa il 75% del range; contro il 75% (4,1bb) ti serve il 30% e difendi circa il 57%. Raise: set, doppie e progetti combinati. Call: coppie, progetti e backdoor che hanno il prezzo. Fold: aria senza progetti, e contro la size grande anche le coppie basse senza aiuti. Dal BB niente donk bet: check e decidi dopo.",
  sample(ctx) {
    if (!CBD_COMBOS) CBD_COMBOS = djRange(CBD_RANGE);
    const sz = (ctx.opt && ctx.opt.size) || (Math.random() < 0.5 ? "s" : "l");
    for (let k = 0; k < 40; k++) {
      const c = pick(CBD_COMBOS), hand = c.map(djS), board = dealCards(3, hand);
      const cl = cbdClass(hand, board);
      /* meno aria pura: è la decisione più facile */
      if (!cl.monster && !cl.pair && !cl.fd && !cl.oesd && !cl.gut && !cl.over && !cl.bdfd && !cl.bdsd && Math.random() < 0.5) continue;
      return { h: hand.join(""), b: board.join(""), sz };
    }
    return { h: "9s8s", b: "Ks7d2c", sz };
  },
  build({ h, b, sz }) {
    const hand = h.match(/../g), board = b.match(/../g), S = CBD_SIZES[sz], k = cbdClass(hand, board), [best, part, why] = cbdAnswer(k, sz);
    const lab = { fold: "Fold", call: "Call", raise: "Check-raise" };
    const tags = [k.monster || k.pair ? k.name : null, k.fd ? "progetto colore" : null, k.oesd ? "progetto di scala aperto" : null, k.gut ? "gutshot" : null, k.over ? "due overcard" : null, k.bdfd && !k.fd ? "backdoor di colore" : null, k.bdsd ? "backdoor di scala" : null].filter(Boolean);
    return {
      title: "BB contro BTN · c-bet " + S.n,
      body: `<p class="ctx">Il BTN apre a 2,5bb, paghi dal BB. Al flop fai check e il BTN punta <b>${bb(S.b)}</b> in un piatto di <b>5,5bb</b> (${S.n}). Cosa fai?</p><div style="display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px"><span class="pill acc">Piatto 5,5bb</span><span class="pill bad">C-bet ${bb(S.b)} · ${S.n}</span><span class="pill mid">Equity che serve: ${S.eq}%</span></div>` + tableHtml([{ lbl: "Flop", cards: b }, { hero: 1, lbl: "La tua mano", cards: h }]),
      layout: "cols3", center: true, opts: ["fold", "call", "raise"].map(v => ({ label: lab[v], v })), timed: false,
      check(v) {
        const sc = v === best ? 100 : (part[v] || 0);
        return { score: sc, correct: best, expl: `<p><b>${lab[best]}</b>${tags.length ? ` · ${tags.join(", ")}` : ""}.</p><p>${why}</p><p class="muted" style="font-size:13px">Prezzo: ${bb(S.b)} da pagare per vincere 5,5 + ${fmt(S.b, 1)} = ${fmt(5.5 + S.b, 1)}bb, quindi ti serve circa il ${S.eq}% di equity; contro questa size difendi circa il ${S.def}% del range. Strategia semplificata per i micro, non l'equilibrio del solver.</p>` };
      },
    };
  },
};

