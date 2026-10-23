/* ================= LA MANO DELLA DOMANDA, AZIONE PER AZIONE (thPlan, thHand) =================
   Dalle domande delle lezioni scritte a parole ricava la mano dall'inizio: bui, fold, open (o 3-bet),
   call, e street per street check, puntate, call e check-raise, fino al momento in cui tocca a te.
   La mano si gioca una volta sola sul tavolo animato delle lezioni (UI.hand) e resta ferma su «Tocca a te».
   Se il testo non basta per ricostruire ogni azione (limp, 4-bet, frasi ambigue) thPlan restituisce null
   e la domanda tiene il tavolo fermo a 6 posti. */
const TH_PRE = ["UTG", "HJ", "CO", "BTN", "SB", "BB"], TH_POST = ["SB", "BB", "UTG", "HJ", "CO", "BTN"];
const thN = s => parseFloat(String(s).replace(",", "."));
const thF = x => String(Math.round(x * 100) / 100).replace(".", ",");
const thR1 = x => Math.round(x * 10) / 10;
const TH_C = "(?:10|[2-9TJQKA])[♠♥♦♣]";
function thPlan(t, seats) {
  if (!seats) return null;
  if (/\blimp|4-bet|4-bett|5-bet|all-in/i.test(t)) return null;
  const NM = { EP: "UTG", MP: "HJ" }, hero = NM[seats.hero] || seats.hero, vils = seats.vils.map(p => NM[p] || p), inP = [hero, ...vils];
  const R = "(UTG|HJ|CO|BTN|SB|BB)", pre = p => TH_PRE.indexOf(p);
  let m;
  /* ---------- preflop ---------- */
  const three = /3-bet pot|\b3BP\b|3-bettato|hai fatto 3-bet|fai 3-bet|\b3-betta\b/i.test(t);
  if (three && inP.length !== 2) return null;
  let opener = null, tb = null;
  if (three) {
    if (/hai 3-bettato|hai fatto 3-bet|\bfai 3-bet/i.test(t)) tb = hero;
    else if ((m = t.match(new RegExp("\\b" + R + " 3-betta\\b")))) tb = m[1];
    else tb = inP.slice().sort((a, b) => pre(b) - pre(a))[0];
    opener = inP.find(p => p !== tb);
    if (pre(opener) > pre(tb)) return null;
  } else {
    if ((m = t.match(new RegExp("contro l'open(?: a [\\d,]+ ?bb)?(?: [\\d,]+ ?bb)? (?:del|dello|di un \\w+ al) " + R)))) opener = m[1];
    else if ((m = t.match(new RegExp("\\b" + R + " (?:apre|ha aperto)\\b")))) opener = m[1];
    else if ((m = t.match(new RegExp("\\bapre dal(?:lo)? " + R)))) opener = m[1];
    else if (/\b(hai aperto|apri)\b/i.test(t)) opener = hero;
    if (!opener || !inP.includes(opener)) { const nb = inP.filter(p => p !== "SB" && p !== "BB").sort((a, b) => pre(a) - pre(b)); opener = nb.length ? nb[0] : "SB"; }
    if (inP.some(p => pre(p) < pre(opener))) return null;
  }
  /* finestre di testo: il flop parte dalla frase con le carte del flop; turn e river da «turn X», «river X» */
  const board = seats.board || "", nSt = Math.max(1, (board.length / 2) - 2);
  const iF0 = t.search(new RegExp("(?:flop|su|board)\\s+(?:è\\s+)?" + TH_C, "i")), iF = iF0 < 0 ? 0 : Math.max(0, ...[".", ":", ";", "?", "!"].map(c => t.lastIndexOf(c, iF0) + 1));
  const iT = t.search(new RegExp("\\bturn\\s+(?:è\\s+)?(?:il |l')?" + TH_C, "i")), iR = t.search(new RegExp("\\briver\\s+(?:è\\s+)?(?:il |l')?" + TH_C, "i"));
  const win = [t.slice(iF, iT > 0 ? iT : iR > 0 ? iR : t.length), iT > 0 ? t.slice(iT, iR > iT ? iR : t.length) : "", iR > 0 ? t.slice(iR) : ""];
  const potIn = w => { const mm = w.match(/\bpiatto(?: di| da| è)? ([\d,]+) ?bb/i); return mm ? thN(mm[1]) : null; };
  /* dimensioni preflop: open e 3-bet; se il testo dichiara il piatto del flop, le dimensioni si adeguano */
  let open = opener === "SB" ? 3 : 2.5;
  if ((m = t.match(/\b(?:apr[eio]\w*|aperto|open)(?: dal(?:lo)? \w+| da \w+)? (?:a )?([\d,]+) ?bb/i))) open = thN(m[1]);
  let b3 = 0;
  if (three) { b3 = tb === "SB" || tb === "BB" ? open * 4 : open * 3; if ((m = t.match(/3-bet\w* (?:dal(?:lo)? \w+ )?a ([\d,]+) ?bb/i))) b3 = thN(m[1]); }
  const dead = (inP.includes("SB") ? 0 : 0.5) + (inP.includes("BB") ? 0 : 1), fp = potIn(t.slice(0, iT > 0 ? iT : iR > 0 ? iR : t.length));
  if (fp != null) {
    if (three) { const x = (fp - dead) / 2; if (Math.abs(x - b3) > 0.15) b3 = thR1(x); }
    else { const x = (fp - dead) / inP.length; if (Math.abs(x - open) > 0.15) { if (x < 2 || x > 4) return null; open = Math.round(x * 100) / 100; } }
  }
  const put = { SB: 0.5, BB: 1 }, acts = [["pre"]];
  let pot = 1.5;
  const agg = three ? tb : opener;
  const P = (p, k, lbl, amt) => { const prev = put[p] || 0; if (amt != null) { pot += amt - prev; put[p] = amt; } acts.push([p, k, lbl, amt != null ? thF(amt) : ""]); };
  let opened = false;
  TH_PRE.forEach(p => {
    if (p === opener) { P(p, "raise", "Raise " + thF(open) + "bb", open); opened = true; }
    else if (three && p === tb) P(p, "raise", "3-bet " + thF(b3) + "bb", b3);
    else if (!three && opened && inP.includes(p)) P(p, "call", "Call", open);
    else P(p, "fold", "Fold");
  });
  if (three) P(opener, "call", "Call", b3);
  /* ---------- dopo il flop ---------- */
  const order = TH_POST.filter(p => inP.includes(p)), heroAt = order.indexOf(hero), nonAgg = order.find(p => p !== agg);
  const after = (a, b) => TH_POST.indexOf(a) > TH_POST.indexOf(b);
  const NAMED = "(?:[Ii]l|[Ll]o) (UTG|HJ|CO|BTN|SB|BB)(?:,[^,.]*,| \\w+){0,3} (?:punta|c-betta|fa c-bet)\\b";
  const BETW = "(?:c-bet|c-betti|c-betta|range bet|(?<![\\w-])bet|punti|puntato|\\bpunta)";
  const sizeIn = (w, base) => { let mm;
    if ((mm = w.match(new RegExp(BETW + "(?: di| del)? (?:il )?([\\d,]+) ?bb", "i")))) return thN(mm[1]);
    if ((mm = w.match(new RegExp(BETW + "[^.;]*?\\(?(\\d+)%", "i")))) return thR1(base * +mm[1] / 100);
    if (/1\/3/.test(w)) return thR1(base / 3);
    return null; };
  const isXRC = w => /\b(?:fa|fai) check-raise\b[^.]*?\b(?:paga|paghi|call|chiama|chiami)\b/i.test(w);
  const isBC = w => new RegExp(BETW + "[^?]*?\\b(?:(?<!il )call|pagata|paga(?! con gli)|pagato|chiama|chiamato|(?<!se )paghi)\\b", "i").test(w) || /ha pagato la tua c-bet|check-call al/i.test(w);
  const isCC = w => /check-check|\bcheckat[oa]\b(?! col)|check dietro|checka dietro|check, check dietro|checkato dietro/i.test(w);
  const st = { put: {} };
  const SP = (p, k, lbl, amt) => { if (amt != null) { pot += amt - (st.put[p] || 0); st.put[p] = amt; } acts.push([p, k, lbl, amt != null ? thF(amt) : ""]); };
  const betCall = (bettor, bet) => { order.forEach(p => { if (p === bettor) SP(p, "bet", "Bet " + thF(bet) + "bb", bet); else if (!after(p, bettor)) SP(p, "check", "Check"); }); order.filter(p => p !== bettor).forEach(p => SP(p, "call", "Call", bet)); };
  const bettorIn = w => { let mm; if ((mm = w.match(new RegExp(NAMED)))) return mm[1]; if (/\b(?:lui|lei) punta\b/i.test(w)) return order.find(p => p !== hero); if (/\bpunti\b|hai puntato|c-betti\b/i.test(w)) return hero; return agg; };
  let done = false;
  for (let s = 0; s < nSt; s++) {
    acts.push(["board", s]); st.put = {};
    const nm = ["flop", "turn", "river"][s], last = s === nSt - 1, base = pot;
    /* senza «turn X» o «river X» nel testo (board scritto tutto insieme) si guardano le frasi che nominano la street */
    let w = win[s];
    if (!w) w = t.split(/[.;:!?]|,(?= |$)/).filter(c => new RegExp("\\b" + nm + "\\b", "i").test(c) || (s === 1 && /flop e (?:il |al )?turn/i.test(c))).join(". ");
    if (s === 1 && /check-check al flop[^.]*? e al turn/i.test(t)) w = "check-check";
    const nextPot = potIn(win[s + 1] || ""), unknown = n => nextPot != null ? thR1((nextPot - base) / n) : thR1(base * (s ? 0.66 : 0.33));
    const vRaise = /(?:check-raisa|\bfa check-raise)(?: a ([\d,]+) ?bb)?/i.exec(w);
    /* nella street finale contano solo le azioni della prima frase: il resto spesso descrive abitudini o ipotesi */
    const w1 = last ? w.split(/[.?](?!\d)/)[0] : w;
    if (isXRC(w1)) {
      const bet = (/check-raise[^.]*\d+%/i.test(w) ? null : sizeIn(w, base)) || thR1(base * 0.33), pm = w.match(/check-raise (\d+)%/i);
      const rz = (m = w.match(/check-rais\w* a ([\d,]+) ?bb/i)) ? thN(m[1]) : pm ? thR1(bet + +pm[1] / 100 * (base + 2 * bet)) : thR1(bet * 3);
      SP(nonAgg, "check", "Check"); SP(agg, "bet", "Bet " + thF(bet) + "bb", bet); SP(nonAgg, "raise", "Raise " + thF(rz) + "bb", rz); SP(agg, "call", "Call", rz);
      if (last) done = true; continue;
    }
    if (last && vRaise && agg === hero) {
      const bet = sizeIn(w, base) || thR1(base * 0.33), rz = vRaise[1] ? thN(vRaise[1]) : thR1(bet * 3);
      if (after(hero, nonAgg)) SP(nonAgg, "check", "Check"); SP(hero, "bet", "Bet " + thF(bet) + "bb", bet); SP(nonAgg, "raise", "Raise " + thF(rz) + "bb", rz); break;
    }
    if (isBC(w1)) { const by = bettorIn(w1); betCall(by, sizeIn(w1, base) || unknown(order.length)); if (last) done = true; continue; }
    if (isCC(w1) || (!last && new RegExp("check\\w*(?: dietro)? (?:al |il )?(?:flop e (?:al |il )?turn|" + nm + ")\\b", "i").test(w))) { order.forEach(p => SP(p, "check", "Check")); if (last) done = true; continue; }
    if (!last) {
      if (new RegExp("(?:punta|puntato|punti) (?:il )?(?:flop e (?:il )?turn|" + nm + ")\\b", "i").test(w)) { betCall(bettorIn(w), unknown(order.length)); continue; }
      return null;
    }
    /* street finale: le azioni fino a quando tocca a te */
    const vBet = new RegExp(NAMED + "|\\b(?:lui|lei)\\s+punta\\b|\\bc-bet(?:ta)? del \\d+%|\\bc-betta\\b|\\bpunta (?:il )?\\d+%|\\bpunta [\\d,]+ ?bb", "i").test(w) || (agg !== hero && /\bc-bet (?:del )?\d+%/i.test(w));
    if (vBet) {
      const named = (m = w.match(new RegExp(NAMED))) ? m[1] : /\b(?:lui|lei)\s+punta\b/i.test(w) ? order.find(p => p !== hero) : null;
      let by = named || (agg !== hero ? agg : null);
      if (by === hero) by = order.find(p => p !== hero);
      const bet = sizeIn(w, base) || thR1(base * 0.33);
      if (!by) { order.slice(0, heroAt).forEach(p => SP(p, "check", "Check")); continue; }
      for (const p of order) { if (p === by) { SP(p, "bet", "Bet " + thF(bet) + "bb", bet); break; } SP(p, "check", "Check"); }
      order.slice(order.indexOf(by) + 1, heroAt > order.indexOf(by) ? heroAt : order.indexOf(by) + 1).forEach(p => SP(p, "fold", "Fold"));
    } else order.slice(0, heroAt).forEach(p => SP(p, "check", "Check"));
  }
  return { hero, inP, acts, pot, done };
}
/* dal piano alle opzioni di UI.hand: tempi brevi, una sola volta, fermo su «Tocca a te» */
function thHand(plan, heroCards, board) {
  const ev = [], pots = [], bd = [], cards = (board.match(/../g) || []).map(c => c[0].replace("T", "10") + ({ s: "♠", h: "♥", d: "♦", c: "♣" })[c[1]]);
  let t = 0.2, pot = 0;
  const put = {}, addPot = (p, amt) => { pot += amt - (put[p] || 0); put[p] = amt; pots.push([t, thF(pot) + "bb"]); };
  plan.acts.forEach(a => {
    if (a[0] === "pre") { ev.push([t, "SB", "post", "", "0,5"]); put.SB = 0.5; t += 0.2; ev.push([t, "BB", "post", "", "1"]); put.BB = 1; pot = 1.5; pots.push([t, "1,5bb"]); t += 0.5; return; }
    if (a[0] === "board") { t += 0.35; const s = a[1], c = s === 0 ? cards.slice(0, 3) : [cards[s + 2]]; bd.push([t, c.join("")]); Object.keys(put).forEach(k => delete put[k]); t += 0.65; return; }
    const [p, k, lbl, amt] = a; ev.push([t, p, k, lbl, amt]); if (amt) addPot(p, thN(amt)); t += k === "fold" ? 0.28 : 0.55;
  });
  const end = t + 0.15;
  return { cycle: +(end + 1).toFixed(2), once: 1, quiz: 1, hero: { pos: plan.hero, cards: heroCards || "" }, deal: 0.5, hcards: 0.9, ev, board: bd, pot: pots, end: plan.done ? null : { t: end, testo: "Tocca a <em>te</em>" } };
}
