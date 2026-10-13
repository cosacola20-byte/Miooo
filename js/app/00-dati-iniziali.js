const FLOPS=[];
const BLOCKERS=[{"id":"b2","board":"JcTc5h2d8s","story":"BTN vs BB. Al river l'8 chiude Q9 e 97 e il BB fa check.","callsDesc":"AJ,KJ,QJ,JT,J9s,J8s,T8s,TT,55,88,Q9,97s,98s","foldsDesc":"AcKc,AcQc,Ac9c,Ac7c,Ac6c,Ac5c,Ac4c,Ac3c,KcQc,Kc9c,7c6c,KQ,A9s,K9s,AT,KT,QT","calls0":84,"folds0":68,"foldPct0":44.7,"cands":[{"hand":"KcQc","calls":74,"folds":52,"foldPct":41.3},{"hand":"AhQd","calls":74,"folds":57,"foldPct":43.5},{"hand":"7h6h","calls":83,"folds":68,"foldPct":45.0}],"cfg":"srp","line":{"pre":5.5,"fs":30,"fb":1.7,"pf":8.9,"ts":75,"tb":6.7,"pr":22.3}},{"id":"b3","board":"9h7h3c2s6d","story":"Hai 3-bettato dal BTN e il CO ha chiamato. Al river il colore a cuori non è arrivato, il 6 chiude 85 e T8, e il CO fa check.","callsDesc":"AA,KK,QQ,JJ,TT,99,77,A9s,K9s,Q9s,J9s,T9s,98s,97s,87s,85s,T8s,54s","foldsDesc":"AhKh,AhQh,AhJh,AhTh,Ah5h,Ah4h,KhQh,KhJh,QhJh,QhTh,JhTh,AKo,AK,AQs,KQs","calls0":72,"folds0":32,"foldPct0":30.8,"cands":[{"hand":"AhQc","calls":65,"folds":21,"foldPct":24.4},{"hand":"KsQs","calls":64,"folds":26,"foldPct":28.9},{"hand":"AcKd","calls":64,"folds":23,"foldPct":26.4}],"cfg":"3bp","line":{"pre":18.5,"fs":30,"fb":5.6,"pf":29.7,"ts":50,"tb":14.9,"pr":59.5}}];
/* BANK: i dati sono in js/data/bank.js */
/* GBLK: i dati sono in js/data/gblk.js */
/* MRANGES: i dati sono in js/data/mranges.js */
/* PRE: i dati sono in js/data/pre.js */
const SPOTS = [
  { ctx: "NL25 · BTN apre, BB chiama. Il BB fa check.", board: "Ks7d2c", hero: "AhKd", street: "Flop",
    opts: ["Value, 1/3 pot: pagano 7x, 2x, KQ-K8 e coppie medie", "Value, overbet: pagano solo le Kx", "Check: nessuna mano peggiore paga", "Bluff: vuoi far foldare mani migliori"], a: 0,
    ex: "Nella strategia di riferimento su tutti i board K, Q e J-high si gioca range bet 30%, anche con AK. L'overbet 120% lo riservi ai board AKx e AQx, dove il BB è davvero cappato. Su K72 il BB ha ancora tante Kx deboli (K8-K2, KT, KJ) e un range pieno di 7x, 2x e coppie medie: con 1/3 pagano tutte queste mani peggiori, con l'overbet restano solo le Kx e le mani che ti battono (77, 22, K7, K2)." },
  { ctx: "NL25 · BTN apre, BB chiama. Il BB fa check.", board: "8h7h5c", hero: "AcQd", street: "Flop",
    opts: ["Bet 1/3: foldano le mani migliori", "Bet 3/4: value contro i draw", "Check: non c'è un bersaglio affidabile", "Overbet: il suo range è cappato"], a: 2,
    ex: "Il vantaggio di nuts è del BB (96, 64, set bassi, tanti draw). Se punti foldano le mani che batti e restano coppie e draw con equity. Check e decidi al turn." },
  { ctx: "River. Turn check-check. Lo station fa check.", board: "KcQs6d3h2c", hero: "QhJh", street: "River",
    opts: ["Value 1/3-1/2: pagano Qx peggiori, 6x, 77-JJ", "Check: sei solo un bluff-catcher", "Bluff: fai foldare le Kx", "Overbet: pagano le Kx"], a: 0,
    ex: "Lo station chiama con qualsiasi coppia. Quando paga vinci più del 50% delle volte: value thin corretto, con una size che le coppie deboli pagano." },
  { ctx: "River. Hai puntato flop e turn, il reg ha chiamato due volte e fa check. Picche mancate.", board: "KsQd7s4c2d", hero: "6h5h", street: "River",
    opts: ["Check: arrenditi", "Bluff: foldano i draw mancati che battono 6-high (AJ, JT, T9, picche)", "Value: pagano i draw mancati", "Bluff: foldano Kx e Qx"], a: 1,
    ex: "Kx e Qx pagano quasi sempre una bet. Il bersaglio reale sono i draw mancati con carta alta migliore della tua: con 6-high perdi contro tutti a showdown, quindi il bluff ha un target." },
  { ctx: "River. Hai puntato flop e turn, lui ha chiamato e fa check. Picche mancate.", board: "KsQd7s4c2d", hero: "9c9d", street: "River",
    opts: ["Value: pagano i draw mancati", "Check: se punti foldano le peggiori e pagano le migliori", "Bluff: foldano le Kx deboli", "Value piccolo: pagano 77 e 44"], a: 1,
    ex: "99 batte i draw mancati, che però non pagano mai. Chiamano Kx, Qx e set. Puntare trasforma la tua mano in un bluff: check e showdown." },
  { ctx: "Turn. BTN vs BB, c-bet 1/3 al flop e call. Il reg fa check.", board: "9s6d2cAh", hero: "QsJs", street: "Turn",
    opts: ["Bluff grande (3/4 - overbet): foldano 9x, 6x, 77-88", "Check: non hai equity", "Bluff 1/4: foldano gli A-high", "Value: pagano i draw"], a: 0,
    ex: "L'asso favorisce il tuo range (AK, AQ, AA). Il BB è pieno di 9x, 6x e coppie che non reggono una size grande. Contro uno station, invece, check." },
  { ctx: "River. Il nit ha fatto check/call su flop e turn, ora fa check.", board: "AdJc8s4h2c", hero: "KdKc", street: "River",
    opts: ["Value: pagano le Jx", "Check: sei un bluff-catcher, il nit paga solo con Ax", "Bluff: fai foldare le Ax", "Overbet: il suo range è cappato"], a: 1,
    ex: "Un nit che chiama due volte su un board con l'asso ha soprattutto Ax. Se punti, le Jx foldano e le Ax pagano. Check." },
  { ctx: "Piatto 3-bet. Hai 3-bettato in posizione, il CO ha chiamato e fa check.", board: "Js7h3d", hero: "QcQd", street: "Flop",
    opts: ["Value 1/3: pagano Jx (KJ, QJ, JT), TT-88, 7x e draw", "Check: l'overpair è vulnerabile", "Overbet: foldano le Jx", "Bluff: foldano AK e AQ"], a: 0,
    ex: "Il range di chi chiama un 3-bet è condensato: Jx, coppie medie, broadway. La size piccola fa pagare tutte queste mani peggiori." },
  { ctx: "River. Il BB ha fatto check/call su flop e turn, ora fa check. Il colore è arrivato.", board: "Th9h4c2d3h", hero: "Ah5h", street: "River",
    opts: ["Value piccolo per non spaventarlo", "Value grande / overbet: pagano colori più bassi, set, 2 coppie e Tx forte", "Check per indurre un bluff", "Bluff: foldano i colori"], a: 1,
    ex: "Hai le nuts e lui ha colori più bassi e mani forti che non foldano facilmente. Con le nuts la size grande massimizza l'EV." },
  { ctx: "Turn. BTN vs BB, c-bet al flop e call. Il BB fa check.", board: "Qs8s3d2c", hero: "As5s", street: "Turn",
    opts: ["Semi-bluff 2/3: foldano 8x, 3x, coppie 44-77; se chiama hai 9 outs + asso", "Check: aspetta di chiudere il colore", "Value: pagano le Qx", "Bluff 1/4: foldano le Qx"], a: 0,
    ex: "Il semi-bluff vince in due modi: fold immediato delle mani medie o colore al river. Blocchi anche il colore nuts." },
  { ctx: "Turn. BTN vs BB, c-bet al flop e call. Il BB fa check.", board: "Jh9h4c2s", hero: "JsTc", street: "Turn",
    opts: ["Value 2/3-3/4: fai pagare colore, QT, T8, 87 e le 9x", "Value 1/4: pagano tutti", "Check: la top pair è un bluff-catcher", "Overbet: range cappato"], a: 0,
    ex: "Un progetto colore ha il 19,6% al turn. Con 2/3 pot deve pagare il 28,6%: la size fa pagare caro i draw e prende value dalle 9x." },
  { ctx: "River. Lo station ha chiamato flop e turn, ora fa check.", board: "KcJd4s2h9c", hero: "7h6h", street: "River",
    opts: ["Bluff pot: lo station folda le coppie", "Check: lo station non folda, nessun bersaglio", "Bluff 1/3: foldano gli A-high", "Value: pagano i draw mancati"], a: 1,
    ex: "Contro chi non folda il bluff non ha bersaglio, qualunque size. Rinuncia." },
  { ctx: "Flop. BTN apre, BB chiama e fa check.", board: "Kd7s7c", hero: "Ah4h", street: "Flop",
    opts: ["Bet 1/3 con quasi tutto il range: foldano overcard e coppie basse (QJ, T9, 22-55)", "Check: l'A-high ha showdown", "Overbet: il suo range è cappato", "Value: pagano i 7x"], a: 0,
    ex: "Il board accoppiato colpisce poco entrambi, il vantaggio è del BTN. Con 1/3 pot bastano il 25% di fold." },
];

