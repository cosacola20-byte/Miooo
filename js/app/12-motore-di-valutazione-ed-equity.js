/* ================= MOTORE DI VALUTAZIONE ED EQUITY (Texas Hold'em) =================
   Carte interne: intero 0..51, rango = c >> 2 (0 = 2 ... 12 = asso), seme = c & 3.
   djEval(cards) valuta da 5 a 7 carte e restituisce un numero: più alto = mano migliore,
   uguale = pareggio esatto (kicker compresi). */
const DJ_STR = (() => { const t = new Int8Array(8192).fill(-1); for (let m = 0; m < 8192; m++) { for (let hi = 12; hi >= 4; hi--) { const w = 31 << (hi - 4); if ((m & w) === w) { t[m] = hi; break; } } if (t[m] < 0 && (m & 0x100F) === 0x100F) t[m] = 3; } return t; })();
const djRC = new Uint8Array(13), djSC = new Uint8Array(4), djSM = new Uint16Array(4);
function djTop(mask, n) { let v = 0, k = 0; for (let r = 12; r >= 0 && k < n; r--) if (mask & (1 << r)) { v = v * 16 + r; k++; } while (k < n) { v *= 16; k++; } return v; }
function djEval(cs) {
  djRC.fill(0); djSC.fill(0); djSM.fill(0);
  let all = 0;
  for (let i = 0; i < cs.length; i++) { const c = cs[i], r = c >> 2, s = c & 3; djRC[r]++; djSC[s]++; djSM[s] |= 1 << r; all |= 1 << r; }
  const B = 1048576; /* 16^5: spazio per 5 kicker */
  for (let s = 0; s < 4; s++) if (djSC[s] >= 5) { const sf = DJ_STR[djSM[s]]; if (sf >= 0) return 8 * B + sf; return 5 * B + djTop(djSM[s], 5); }
  let q = -1, t1 = -1, t2 = -1, p1 = -1, p2 = -1;
  for (let r = 12; r >= 0; r--) { const n = djRC[r]; if (n === 4) q = r; else if (n === 3) { if (t1 < 0) t1 = r; else if (t2 < 0) t2 = r; } else if (n === 2) { if (p1 < 0) p1 = r; else if (p2 < 0) p2 = r; } }
  if (q >= 0) return 7 * B + q * 16 + djTop(all & ~(1 << q), 1);
  if (t1 >= 0 && (t2 >= 0 || p1 >= 0)) return 6 * B + t1 * 16 + Math.max(t2, p1);
  const st = DJ_STR[all]; if (st >= 0) return 4 * B + st;
  if (t1 >= 0) return 3 * B + t1 * 256 + djTop(all & ~(1 << t1), 2);
  if (p1 >= 0 && p2 >= 0) return 2 * B + p1 * 256 + p2 * 16 + djTop(all & ~(1 << p1) & ~(1 << p2), 1);
  if (p1 >= 0) return 1 * B + p1 * 4096 + djTop(all & ~(1 << p1), 3);
  return djTop(all, 5);
}
const djCat = v => Math.floor(v / 1048576);
const DJ_RN = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const DJ_PL = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "assi"];
const djArt = r => (r === 12 ? "all'asso" : r === 6 ? "all'8" : `al ${DJ_RN[r]}`);
/* nome italiano della combinazione */
function djName(v) {
  const c = djCat(v), d = k => Math.floor(v / Math.pow(16, k)) % 16;
  if (c === 8) return d(0) === 12 ? "Scala reale" : `Scala colore ${djArt(d(0))}`;
  if (c === 7) return `Poker di ${DJ_PL[d(1)]}`;
  if (c === 6) return `Full di ${DJ_PL[d(1)]} con ${DJ_PL[d(0)]}`;
  if (c === 5) return `Colore ${djArt(d(4))}`;
  if (c === 4) return `Scala ${djArt(d(0))}`;
  if (c === 3) return `Tris di ${DJ_PL[d(2)]}`;
  if (c === 2) return `Doppia coppia, ${DJ_PL[d(2)]} e ${DJ_PL[d(1)]}`;
  if (c === 1) return `Coppia di ${DJ_PL[d(3)]}`;
  return `Carta alta ${DJ_RN[d(4)] === "A" ? "asso" : DJ_RN[d(4)]}`;
}
const djC = s => RANKS.indexOf(s[0]) * 4 + SUITS.indexOf(s[1]);
const djS = c => RANKS[c >> 2] + SUITS[c & 3];
const djCs = str => (str.match(/../g) || []).map(djC);
/* equity di più mani contro tutte le altre: esatta se mancano al massimo 2 carte di board, altrimenti simulazione */
function djEquity(hands, board, iters) {
  const n = hands.length, used = new Set([...hands.flat(), ...board]);
  const deck = []; for (let c = 0; c < 52; c++) if (!used.has(c)) deck.push(c);
  const need = 5 - board.length, eq = new Float64Array(n), win = new Float64Array(n), tie = new Float64Array(n);
  const cs = hands.map(h => [h[0], h[1], ...board, 0, 0, 0, 0, 0].slice(0, 7));
  let tot = 0;
  const score = extra => {
    let best = -1, nb = 0; const sc = [];
    for (let i = 0; i < n; i++) { const a = cs[i]; for (let k = 0; k < need; k++) a[2 + board.length + k] = extra[k]; const v = djEval(a); sc.push(v); if (v > best) { best = v; nb = 1; } else if (v === best) nb++; }
    for (let i = 0; i < n; i++) if (sc[i] === best) { eq[i] += 1 / nb; if (nb === 1) win[i]++; else tie[i]++; }
    tot++;
  };
  let exact = true;
  if (need === 0) score([]);
  else if (need === 1) for (const a of deck) score([a]);
  else if (need === 2) for (let i = 0; i < deck.length; i++) for (let j = i + 1; j < deck.length; j++) score([deck[i], deck[j]]);
  else {
    exact = false; const it = iters || 30000, d = deck.slice(), ex = new Array(need);
    for (let t = 0; t < it; t++) { for (let k = 0; k < need; k++) { const j = k + Math.floor(Math.random() * (d.length - k)); const x = d[k]; d[k] = d[j]; d[j] = x; ex[k] = d[k]; } score(ex); }
  }
  return { eq: [...eq].map(x => x / tot * 100), win: [...win].map(x => x / tot * 100), tie: [...tie].map(x => x / tot * 100), exact, n: tot };
}
/* range: "22+, A2s+, KTs+, AJo+, KQ" -> lista di combinazioni [c1, c2] */
function djRange(str) {
  const out = [], R = "23456789TJQKA";
  const pairs = (a, b) => { for (let s1 = 0; s1 < 4; s1++) for (let s2 = s1 + 1; s2 < 4; s2++) out.push([a * 4 + s1, b * 4 + s2]); };
  const suited = (a, b) => { for (let s = 0; s < 4; s++) out.push([a * 4 + s, b * 4 + s]); };
  const off = (a, b) => { for (let s1 = 0; s1 < 4; s1++) for (let s2 = 0; s2 < 4; s2++) if (s1 !== s2) out.push([a * 4 + s1, b * 4 + s2]); };
  str.split(",").map(x => x.trim()).filter(Boolean).forEach(t => {
    const a = R.indexOf(t[0]), b = R.indexOf(t[1]), plus = t.endsWith("+"), ty = t[2] === "s" ? "s" : t[2] === "o" ? "o" : "";
    if (a === b) { for (let r = a; r <= (plus ? 12 : a); r++) pairs(r, r); return; }
    for (let k = b; k <= (plus ? a - 1 : b); k++) { if (ty !== "o") suited(a, k); if (ty !== "s") off(a, k); }
  });
  return out;
}
/* equity di una mano contro un range (le combinazioni bloccate dalle carte note sono escluse) */
function djEqRange(hero, combos, board, iters) {
  const used = new Set([...hero, ...board]);
  const live = combos.filter(c => !used.has(c[0]) && !used.has(c[1]));
  const need = 5 - board.length;
  let tot = 0, eq = 0;
  const a = [hero[0], hero[1], ...board], b = [0, 0, ...board];
  const run1 = (v, extra) => { for (let k = 0; k < need; k++) { a[2 + board.length + k] = extra[k]; b[2 + board.length + k] = extra[k]; } b[0] = v[0]; b[1] = v[1]; const x = djEval(a), y = djEval(b); eq += x > y ? 1 : x === y ? 0.5 : 0; tot++; };
  const runs = need === 0 ? 1 : need === 1 ? 44 : 990;
  if (need <= 2 && live.length * runs <= 150000) {
    for (const v of live) {
      const deck = []; for (let c = 0; c < 52; c++) if (!used.has(c) && c !== v[0] && c !== v[1]) deck.push(c);
      if (need === 0) run1(v, []); else if (need === 1) for (const x of deck) run1(v, [x]); else for (let i = 0; i < deck.length; i++) for (let j = i + 1; j < deck.length; j++) run1(v, [deck[i], deck[j]]);
    }
    return { eq: eq / tot * 100, exact: true, combos: live.length };
  }
  const it = iters || 30000, ex = new Array(need);
  for (let t = 0; t < it; t++) {
    const v = live[Math.floor(Math.random() * live.length)];
    const deck = []; for (let c = 0; c < 52; c++) if (!used.has(c) && c !== v[0] && c !== v[1]) deck.push(c);
    for (let k = 0; k < need; k++) { const j = k + Math.floor(Math.random() * (deck.length - k)); const x = deck[k]; deck[k] = deck[j]; deck[j] = x; ex[k] = deck[k]; }
    run1(v, ex);
  }
  return { eq: eq / tot * 100, exact: false, combos: live.length };
}

