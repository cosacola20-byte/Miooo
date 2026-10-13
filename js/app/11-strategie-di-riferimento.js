/* ================= STRATEGIE DI RIFERIMENTO ================= */
function dealCards(n, exclude) {
  const deck = []; for (const r of RANKS) for (const s of SUITS) if (!(exclude || []).includes(r + s)) deck.push(r + s);
  return shuffle(deck).slice(0, n);
}
function feat(cards3) {
  const cs = cards3.map(c => ({ r: rv(c[0]), s: c[1] })).sort((a, b) => b.r - a.r);
  const rs = cs.map(c => c.r), su = cs.map(c => c.s);
  const cnt = {}; su.forEach(x => cnt[x] = (cnt[x] || 0) + 1);
  const maxSuit = Math.max(...Object.values(cnt));
  const uniq = [...new Set(rs)];
  const paired = uniq.length < rs.length;
  let pairRank = null, kicker = null;
  if (paired && uniq.length === 2) { pairRank = rs.find((r, i) => rs.indexOf(r) !== i); kicker = uniq.find(r => r !== pairRank); }
  const lowAce = uniq.map(r => r === 14 ? 1 : r);
  const spanOk = arr => arr.length === 3 && Math.max(...arr) - Math.min(...arr) <= 4;
  const straight = !paired && (spanOk(uniq) || spanOk(lowAce));
  return { _cards: cards3, rs, su, high: rs[0], mid: rs[1], low: rs[2], mono: maxSuit === 3, twotone: maxSuit === 2, rainbow: maxSuit === 1, paired, trips: uniq.length === 1, pairRank, kicker, straight };
}
const RN = r => ({ 14: "A", 13: "K", 12: "Q", 11: "J", 10: "T" }[r] || String(r));
const bw = (f, min = 10) => f.rs.filter(r => r >= min).length;

/* Spot 1: SRP BTN vs BB, BTN c-bet (Aggressore) */
function ruleS1(f) {
  if (f.mono || f.trips) return null;
  if (f.high === 14) {
    if (f.paired) return null;
    if (f.mid <= 5) return { a: ["check"], cat: "A-high con scala bassa (A + due carte fino al 5)", why: "Full check: il BB ha troppe scale e progetti a scala sotto l'asso." };
    if (bw(f) === 3) return { a: ["r30"], cat: "A-high tripla broadway", why: "Tripla broadway: range bet 30%." };
    if (bw(f) === 2) {
      if (f.mid >= 12) return { a: ["ob"], cat: "A-high doppia broadway con K o Q (AKx, AQx)", why: "AKx e AQx: overbet 120% in mix." };
      return f.twotone ? { a: ["m100"], cat: "AJx / ATx con progetto colore", why: "AJx e ATx two-tone: 100% in mix." } : { a: ["r30"], cat: "AJx / ATx rainbow", why: "AJx e ATx senza colore: range bet 30%." };
    }
    if (f.mid === 9 && f.low >= 6) return { a: ["m75"], cat: "A98, A97, A96", why: "Gli unici A9x da mixare con size 75%." };
    const conn = f.twotone || f.mid - f.low <= 2;
    return conn ? { a: ["m50"], cat: "A9x o più basso, con connessioni", why: "All'aumentare delle connessioni si mixa con size 50% (75% solo su A98, A97, A96)." } : { a: ["r30", "m50"], cat: "A9x o più basso, secco", why: "Sui board secchi, e contro chi folda il 40% o più, si può giocare bet 30% range (altrimenti mix 50%)." };
  }
  if (f.high >= 11) return f.paired ? { a: ["r25"], cat: `${RN(f.high)}-high accoppiato`, why: "K, Q e J-high accoppiati: range bet 25%." } : { a: ["r30"], cat: `${RN(f.high)}-high`, why: "Tutti i K, Q e J-high: range bet 30%." };
  if (f.paired) {
    const superConn = f.pairRank && f.kicker && Math.abs(f.pairRank - f.kicker) <= 2 && f.twotone;
    return superConn ? { a: ["m50", "r25"], cat: "T-high o più basso accoppiato e super connesso (tipo 977s)", why: "Super connessi: in teoria mix; in exploit si possono giocare range 25% perché manca il check-raise, ma attenzione al turn." } : { a: ["r25"], cat: "T-high o più basso accoppiato", why: "Accoppiati bassi: range bet 25%." };
  }
  if (f.straight) return { a: ["m50"], cat: "Board a scala (scala possibile)", why: "Board a scala: 50% in mix." };
  if (f.high === 10 && f.mid === 9) return { a: ["m100"], cat: "T9x senza scale possibili", why: "T9x senza scale possibili: 100% in mix." };
  return { a: ["m75"], cat: "T8x o più basso senza scale possibili", why: "T8x o peggio senza scale possibili: 75% in mix." };
}
/* Spot 2: BvB SRP, SB c-bet */
function ruleS2(f) {
  const lows = [...new Set(f.rs)].filter(r => r <= 8);
  let two = false;
  for (let i = 0; i < lows.length; i++) for (let j = i + 1; j < lows.length; j++) if (Math.abs(lows[i] - lows[j]) <= 4) two = true;
  if (f.mono) return f.high <= 11 && f.high - f.low <= 4 ? { a: ["check"], cat: "Monotone connesso a scala medio-basso", why: "Board troppo dinamici: check range." } : { a: ["b1"], cat: "Monotone", why: "Tutti gli altri monotone: bet 1bb con tutto il range." };
  if (f.paired) {
    if (f.pairRank >= 9) return { a: ["b25"], cat: "Accoppiato 99x o superiore", why: "Paired alti: B25, il pool overfolda al cbet piccolo." };
    if (f.pairRank <= 3) return { a: ["b25", "check"], cat: "Accoppiato 22x o 33x", why: "Il BB non ha quasi 2x e 3x offsuit (A2 e A3 li 3-betta o li folda): si può puntare 25% con tutto il range; anche il check range va bene." };
    return { a: ["check"], cat: "Accoppiato dal 44x all'88x", why: "Paired bassi: il BB ha tanti trips offsuit e flotta troppo, meglio check range." };
  }
  const dbl = f.twotone && bw(f) >= 2 && (f.mid - f.low <= 2 || (f.high === 14 && f.mid >= 12 && f.low <= 3));
  if (dbl) return { a: ["b1", "b25"], cat: "Doppia broadway two-tone connessa", why: "Raffinamento: 1bb con tutto il range (KT8, QJ9, AK2 two-tone). Il B25 resta una semplificazione valida." };
  if (f.high === 14) return two && f.twotone ? { a: ["check"], cat: "A-high con due carte fino all'8 connesse + progetto colore", why: "Q9, Q8, J9, J8 diventerebbero combo scomode al turn: check range." } : { a: ["b25"], cat: "A-high", why: "Tutti gli altri A-high: B25 range." };
  if (two) return { a: ["check"], cat: `${RN(f.high)}-high con due carte fino all'8 connesse a scala`, why: "Due carte fino all'8 che possono stare nella stessa scala (distanza fino a 4, come 7-3 o 8-4): checkando range togliamo le combo con frequenze miste al turn." };
  return { a: ["b25"], cat: `${RN(f.high)}-high senza doppio connettore basso`, why: "Board che restano puliti al turn: B25 range." };
}
/* Spot 3: 3-bet pot IP, BTN vs CO, range lineare */
function ruleS3(f) {
  if (f.mono) return { a: ["b1"], cat: "Monotone", why: "Mini-bet 1bb (circa 10%) con tutto il range." };
  const drawy = f.twotone || f.mid - f.low <= 2 || f.high - f.mid <= 2;
  if (f.high === 14) {
    if (!f.paired && f.mid <= 5) return { a: ["m30", "check"], cat: "A-high con scala bassa", why: "Mix 30% o check: il CO ha tante scale su questi board." };
    return { a: ["r30"], cat: "A-high", why: "Tutti gli A-high (broadway, drawy, paired, dry): range bet 30%." };
  }
  if (f.paired) {
    if (f.high <= 9) return { a: ["r50"], cat: "9-high o più basso accoppiato", why: "Accoppiati bassi: r50, il CO ha poche mani che reggono la size grande." };
    const low = f.kicker > f.pairRank ? f.pairRank : null;
    if (low != null && low >= 5 && low <= 9) return { a: ["r30"], cat: `${RN(f.high)}-high con coppia bassa sotto (es. ${RN(f.high)}55, ${RN(f.high)}88)`, why: "r30: con coppie medie e suited connector il CO ha più trips di quanto sembri." };
    const pairAdv = f.kicker != null && Math.abs(f.pairRank - f.kicker) >= 3;
    return pairAdv ? { a: ["r50"], cat: `${RN(f.high)}-high accoppiato con vantaggio di trips e poche connessioni`, why: "Paired con vantaggio di trips (es. KKx secco): r50, lo SPR basso rende i trips molto forti." } : { a: ["r30"], cat: "Accoppiato connesso", why: "Paired con connessioni a scala (KKQ, KQQ, KJJ): r30." };
  }
  const b = bw(f);
  if (f.high === 13) {
    if (b >= 2) return { a: ["r30"], cat: "K-high doppia o tripla broadway", why: "Broadway: range bet 30%." };
    if (f.straight) return { a: ["r30"], cat: "K-high a scala", why: "Scala: r30." };
    if (f.mid - f.low <= 2) return { a: ["r40", "r50"], cat: "K-high drawy (K8x o più basso con le due basse connesse)", why: "Drawy tipo K87, K76, K75: r40, giocabile anche r50 perché il field non rilancia abbastanza." };
    return { a: ["r50"], cat: f.twotone ? "K-high secco con due carte dello stesso seme" : "K-high secco", why: "Secco (anche two-tone senza connessioni): r50, sfruttiamo il forte vantaggio di range." };
  }
  if (f.high === 12) {
    if (b >= 2 || f.straight) return { a: ["r30"], cat: "Q-high broadway o a scala", why: "r30." };
    if (drawy) return { a: ["r30", "r40", "r50"], cat: "Q-high drawy", why: "r30; contro chi paga troppo le coppie medie e non rilancia giocabile r40 o anche r50 in exploit." };
    return { a: ["r40", "r50"], cat: "Q-high secco", why: "r40, giocabile r50 in exploit." };
  }
  if (f.high === 11) {
    if (b >= 2 || f.straight) return { a: ["r30"], cat: "J-high doppia broadway o a scala", why: "r30." };
    if (drawy) return { a: ["r40", "r50"], cat: "J-high drawy", why: "r40, giocabile anche r50." };
    return { a: ["r50"], cat: "J-high secco", why: "r50." };
  }
  if (f.high === 10) {
    if (f.straight) return { a: ["m30", "r30"], cat: "T-high a scala", why: "Mix 30%; nel field si può anche giocare r30 con tutto." };
    if (drawy) return { a: ["m50", "r50"], cat: "T-high drawy", why: "Mix 50%; r50 se il check-raise avversario è basso." };
    return { a: ["r50"], cat: "T-high secco", why: "r50." };
  }
  if (f.straight) return { a: f.high >= 9 ? ["check", "r30"] : ["check"], cat: "9-high o più basso a scala", why: f.high >= 9 ? "Check di default; i più alti (tipo 987) anche r30 per il mancato check-raise." : "Check di default." };
  if (drawy) return { a: ["m50", "r50"], cat: "9-high o più basso drawy", why: "Mix 50% (r50 se il check-raise è basso)." };
  return { a: ["r50"], cat: "9-high o più basso secco", why: "r50." };
}
/* Spot 4: 3-bet pot OOP, SB vs BTN, range depolarizzato */
function ruleS4(f) {
  if (f.mono) {
    // monotone a scala intermedia (tre carte entro 5 ranghi, dal 4 al T): full check
    if (f.high <= 10 && f.low >= 4 && f.high - f.low <= 4) return { a: ["check"], cat: "Monotone a scala intermedia", why: "Full check: su questi monotone lo spot diventa ingestibile, il BTN ha colori e scale." };
    return { a: ["r10"], cat: "Monotone", why: "Range 10% e quasi full check al turn, tranne la quarta carta a colore (range 20%)." };
  }
  const lowConn = Math.abs(f.mid - f.low) <= 2 && f.mid <= 8;
  if (f.high === 14) {
    if (f.paired) return { a: ["r30"], cat: "A-high accoppiato", why: "Range 30%: forte vantaggio di nuts con AA e Ax." };
    if (f.mid <= 5) return { a: ["check"], cat: "A-high con scala bassa (A + due carte fino al 5)", why: "Full check: il BTN ha forte concentrazione di scale e progetti sotto l'asso." };
    if (lowConn && f.twotone) return { a: ["m30", "r30"], cat: "A-high drawy medio-basso (A76, A65 two-tone)", why: "Mix 30%, semplificabile a range 30%: il BTN non rilancia e la differenza di EV è minima." };
    return { a: ["r30"], cat: "A-high (tutti gli altri)", why: "Range bet 30%: il field quasi non rilancia in posizione." };
  }
  if (f.high === 13) {
    if (f.paired) {
      if (f.pairRank === 13 && f.kicker <= 8) return { a: ["r50"], cat: "KKx con terza carta bassa", why: "Accoppiato secco con trips a favore dello SB (AK, KQ): range 50%." };
      return { a: ["r30"], cat: "K accoppiato connesso o con coppia sotto (K66, K88, K99, KKJ)", why: "Il 9 conta come broadway e i pairing bassi connettono: range 30%." };
    }
    if (f.mid <= 8) {
      if (f.twotone && lowConn) return { a: ["r30"], cat: "K + due basse connesse con colore (K76, K87 two-tone)", why: "Colore e scala insieme: la size scende a 30% con tutto il range." };
      if (f.twotone) return { a: ["r40"], cat: "K + due basse con progetto colore", why: "Con il solo progetto colore la size scende a 40% con tutto il range." };
      return { a: ["r50"], cat: "K + due basse senza colore", why: "Forte vantaggio di nuts contro un range BTN debole su board basso: range 50%." };
    }
    return { a: ["r30"], cat: "K-high con doppia broadway (il 9 conta come broadway)", why: "Range 30%." };
  }
  if (f.high === 12) {
    if (!f.paired && f.mid <= 8 && lowConn && f.twotone) return { a: ["m50"], cat: "Q-high hyper drawy (Q + due basse connesse con colore)", why: "Mix 50%: troppa equity per il BTN, che ha anche QJo e KQo." };
    if (!f.paired && f.mid <= 6 && f.rainbow && (f.low <= 3 || f.mid - f.low >= 2)) return { a: ["r50"], cat: "Q-high super secco (Q32, Q52, Q62...)", why: "Range 50%: pochissimi progetti e il BTN difende poco." };
    return { a: ["r30"], cat: "Q-high (tutti gli altri)", why: "Range 30%." };
  }
  if (f.high === 11) {
    if (f.paired) return f.pairRank === 11 ? { a: ["r50"], cat: "JJx", why: "Range 50%: vantaggio di nuts con JJ, AJ, KJ." } : { a: ["r30"], cat: "J con coppia sotto (JTT, J99, J88, J77)", why: "Più connessione, meno vantaggio: range 30%." };
    if (f.straight && f.mid >= 9) return { a: ["r30"], cat: "J-high a scala (JT7, JT8, J98, J97)", why: "Troppi progetti per size grandi: range 30%." };
    if (f.rainbow && f.mid <= 6 && f.low <= 3) return { a: ["r70", "r50"], cat: "J-high secchissimo (J62, J53...)", why: "Range 70% possibile (massimo vantaggio di nuts), ma al turn lascia SPR circa 1,5: range 50% è più facile da gestire." };
    if (f.mid <= 7 && lowConn) return { a: ["m50"], cat: "J-high hyper drawy (J76, J75, J65)", why: "Mix 50%: il BTN ha connessioni dirette nella parte bassa che lo SB non ha." };
    if (f.mid === 8 && lowConn) return { a: ["r50", "m50"], cat: "J8x connesso (J87, J86)", why: "Range 50%: con il mix si punterebbe comunque quasi tutto, e il BTN non rilancia." };
    return { a: ["r50"], cat: "J-high standard (J82, JT2, J92)", why: "Range 50%." };
  }
  if (f.high === 10) {
    if (f.paired) return { a: ["r50"], cat: "T-high accoppiato", why: "Range 50% in exploit: il field non rilancia." };
    if (f.mid === 9 && !f.straight) return { a: f.twotone ? ["r50", "m67"] : ["r50"], cat: "T9x (connette con le broadway)", why: "Range 50%: il range dello SB è costruito su quella connessione e può ribarrellare tanto al turn." };
    if (f.mid >= 7 || f.twotone || f.straight) return { a: ["m67"], cat: "T-high drawy (T8x, T7x o two-tone)", why: "Mix con size grande (circa 67%): bet con i vettori di colore e di scala, check-fold il resto." };
    return { a: ["r50"], cat: "T-high secco (T53, T42, T64, T65)", why: "Range 50% sui più secchi: il field non rilancia." };
  }
  if (f.paired) return { a: ["r50"], cat: "9-high o più basso accoppiato", why: "Range 50% in exploit." };
  if (f.straight && f.rainbow) return { a: ["m50"], cat: "9-high o più basso a scala", why: "Mix 50%." };
  return { a: ["m67"], cat: "9-high o più basso", why: "Mix con size grande (67-75%): bet con i vettori, check-fold le overcard senza backdoor." };
}
const V7MAP = { CHECK: "check", "25r": "r25", "30": "r30", M50: "m50", M75: "m75", M100: "m100", M120: "ob", "1BB": "b1" };
function ruleS1v7(f) {
  const s = v7(f._cards);
  return { a: s.sols.map(x => V7MAP[x]), cat: `${s.bucket} / ${s.cat} / ${s.tone}`, why: s.exp + "." + (s.mixed ? " Strategia mista: conta la size principale." : "") };
}
const CB_SPOTS = {
  S1: { n: "SRP · BTN vs BB (tu BTN, c-bet)", src: "SRP BTN vs BB · Aggressore", rule: f => ruleS1v7(f), opts: [["check", "Check con tutto il range"], ["r25", "Bet 25% con tutto il range"], ["r30", "Bet 30% con tutto il range"], ["m50", "Mix 50%"], ["m75", "Mix 75%"], ["m100", "Mix 100%"], ["ob", "Mix overbet 120%"], ["b1", "Bet 1bb (circa 10%) range"]] },
  S2: { n: "BvB · SB vs BB (tu SB, c-bet)", src: "Small Blind contro Big Blind", rule: f => { const s = bvbStrat(f._cards); return { a: s.sols.map(x => ({ CHECK: "check", B25: "b25", "1BB": "b1" })[x]), cat: `${s.bucket} / ${s.cat} / ${s.tone}`, why: s.exp }; }, opts: [["check", "Check con tutto il range"], ["b25", "Bet 25% con tutto il range"], ["b1", "Bet 1bb con tutto il range"]] },
  S3: { n: "3-bet pot IP · BTN vs CO (tu BTN 3-bettor)", src: "3-bet IP · range lineare", rule: ruleS3, opts: [["check", "Check"], ["b1", "Bet 1bb (circa 10%) range"], ["r30", "Range bet 30%"], ["r40", "Range bet 40%"], ["r50", "Range bet 50%"], ["m30", "Mix 30%"], ["m50", "Mix 50%"]] },
  S4: { n: "3-bet pot OOP · SB vs BTN (tu SB, range depolarizzato)", src: "3-bet OOP", rule: ruleS4, opts: [["check", "Check"], ["r10", "Range 10%"], ["r30", "Range 30%"], ["r40", "Range 40%"], ["r50", "Range 50%"], ["r70", "Range 70%"], ["m30", "Mix 30%"], ["m50", "Mix 50%"], ["m67", "Mix 67%"]] },
}
DRILLS.cbet = {
  name: "Piano c-bet", short: "C-bet piano", time: 25,
  desc: "Dato lo spot e il flop, scegli la strategia: range bet, mix o check, e con che size.",
  rule: "Regola generale: board alto e secco → size più grande; board connesso o drawy → size piccola, mix o check. Le scale basse sotto l'asso si checkano.",
  sample(ctx) {
    const sk = (ctx.opt && ctx.opt.spot) || pick(Object.keys(CB_SPOTS));
    for (let k = 0; k < 60; k++) { const b = dealCards(3); const r = CB_SPOTS[sk].rule(feat(b)); if (r) return { sk, b: b.join("") }; }
    return { sk: "S2", b: "Ks7d2c" };
  },
  build({ sk, b }) {
    const sp = CB_SPOTS[sk], r = sp.rule(feat(b.match(/../g)));
    return {
      title: sp.n,
      body: `<p class="ctx">${sp.n}. Preflop standard, sei tu l'aggressore. Quale strategia al flop indica la strategia di riferimento?</p>` + tableHtml([{ lbl: "Flop", cards: b }]),
      layout: sp.opts.length > 4 ? "cols2" : "", opts: sp.opts.map(([v, l]) => ({ label: l, v })), timed: false,
      check(v) {
        const ok = r.a.includes(v);
        const lab = x => sp.opts.find(o => o[0] === x)[1];
        return { score: ok ? 100 : 0, correct: r.a[0], expl: `<p><b>${r.cat}</b> → ${r.a.map(lab).join(" oppure ")}.</p><p>${r.why}</p><p class="muted" style="font-size:13px">Fonte: ${sp.src}. Strategia semplificata ed exploitativa contro il field, non l'equilibrio del solver.</p>` };
      },
    };
  },
};

