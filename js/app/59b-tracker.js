/* ================= TRACKER E CERCA LEAK =================
   Le hand history importate (GGPoker, PokerStars, export di HM3 in formato Stars) diventano record compatti,
   salvati in IndexedDB su questo dispositivo: non vanno nella sincronizzazione, che ha documenti piccoli.
   Da qui escono le statistiche come in un tracker, il grafico dei risultati, i risultati per posizione e per giorno,
   e il cerca leak: le scelte preflop si confrontano mano per mano con le tabelle della scuola, con le stesse carte,
   e le statistiche postflop con i valori tipici di un regular vincente. */

/* ---------- archivio ---------- */
const TRK = { hands: [], ready: false, demo: null, db: null, busy: false };
const TRK_MAX = 60000;
function trkDb() {
  if (TRK.db) return Promise.resolve(TRK.db);
  return new Promise(res => {
    try { const rq = indexedDB.open("orca-tracker", 1);
      rq.onupgradeneeded = () => { if (!rq.result.objectStoreNames.contains("kv")) rq.result.createObjectStore("kv"); };
      rq.onsuccess = () => { TRK.db = rq.result; res(TRK.db); }; rq.onerror = () => res(null);
    } catch (e) { res(null); }
  });
}
async function trkLoad() {
  const db = await trkDb();
  if (db) await new Promise(res => { try { const g = db.transaction("kv").objectStore("kv").get("hands"); g.onsuccess = () => { if (Array.isArray(g.result)) TRK.hands = g.result; res(); }; g.onerror = () => res(); } catch (e) { res(); } });
  TRK.ready = true;
}
async function trkSave() {
  const db = await trkDb(); if (!db) return false;
  return new Promise(res => { try { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").put(TRK.hands, "hands"); t.oncomplete = () => res(true); t.onerror = () => res(false); } catch (e) { res(false); } });
}
trkLoad().then(() => { if (typeof tab !== "undefined" && tab === "data" && !run) renderData(); });

/* ---------- lettura delle hand history ---------- */
const trkPosList = n => ({ 2: ["BTN", "BB"], 3: ["BTN", "SB", "BB"], 4: ["BTN", "SB", "BB", "CO"], 5: ["BTN", "SB", "BB", "HJ", "CO"], 6: ["BTN", "SB", "BB", "UTG", "HJ", "CO"] })[n] || (n > 6 ? ["BTN", "SB", "BB", ...Array(n - 5).fill("UTG"), "HJ", "CO"] : []);
const trkNum = s => parseFloat(String(s).replace(/,/g, ""));
const trkSplit = text => String(text).split(/(?=(?:PokerStars (?:Zoom |Home Game )?|GGPoker |Poker )Hand #)/).filter(c => /Dealt to .+? \[\w\w \w\w\]/.test(c));
function trkHand(c) {
  const L = c.split(/\r?\n/).map(l => l.trim()).filter(Boolean), head = L[0] || "";
  if (/Tournament|Omaha|Pot Limit|Fixed Limit|Play Money/i.test(head) || !/Hold'em No Limit/i.test(head)) return null;
  const hm = head.match(/Hand #([A-Z]*\d+).*?\(([$€£]?)([\d.,]+)\/([$€£]?)([\d.,]+)/); if (!hm) return null;
  const site = /^PokerStars/.test(head) ? "PS" : "GG", BB = trkNum(hm[5]), cur = hm[2] || hm[4] || "";
  if (!(BB > 0)) return null;
  const dm = head.match(/(\d{4})\/(\d{1,2})\/(\d{1,2}) (\d{1,2}):(\d{2})/), date = dm ? `${dm[1]}-${dm[2].padStart(2, "0")}-${dm[3].padStart(2, "0")} ${dm[4].padStart(2, "0")}:${dm[5]}` : "";
  const btn = +(c.match(/Seat #(\d+) is the button/) || [])[1];
  const hi = L.findIndex(l => /^\*\*\* HOLE CARDS/.test(l)); if (hi < 0) return null;
  const seats = [];
  for (const l of L.slice(1, hi)) { const m = l.match(/^Seat (\d+): (.+?) \([$€£]?([\d.,]+) in chips/); if (m && !/sitting out|out of hand/i.test(l)) seats.push({ seat: +m[1], name: m[2] }); }
  const dl = c.match(/Dealt to (.+?) \[(\w\w) (\w\w)\]/); if (!dl || seats.length < 2) return null;
  const hero = dl[1], cards = dl[2] + dl[3];
  seats.sort((a, b) => a.seat - b.seat);
  let bi = seats.findIndex(s => s.seat === btn); if (bi < 0) bi = 0;
  const n = seats.length, PL = trkPosList(n), pos = {}, ord = {};
  seats.forEach((s, i) => { const k = (i - bi + n) % n; pos[s.name] = PL[k] || "?"; ord[s.name] = k === 0 ? n : k; });
  if (!pos[hero]) return null;
  const P = w => w === hero ? "Tu" : pos[w] || w;
  let st = 0, board = "", sd = false, coll = 0, inv = 0;
  const str = {}, folded = new Set(), ev = [[], [], [], []], hist = [[], [], [], []];
  const put = (w, a) => { str[w] = (str[w] || 0) + a; if (w === hero) inv += a; };
  const maxS = () => Math.max(0, ...Object.values(str));
  let atFlop = null;
  for (const l of L.slice(1)) {
    let m;
    if ((m = l.match(/^\*\*\* (?:FIRST |SECOND )?(FLOP|TURN|RIVER) \*\*\* \[([^\]]+)\](?: \[([^\]]+)\])?/))) {
      const ns = { FLOP: 1, TURN: 2, RIVER: 3 }[m[1]];
      if (ns > st) { st = ns; for (const k in str) delete str[k]; }
      board = (m[2] + (m[3] ? " " + m[3] : "")).replace(/\s+/g, "");
      if (st === 1 && !atFlop) atFlop = seats.map(s => s.name).filter(w => !folded.has(w));
      continue;
    }
    if (/^\*\*\* (SHOW ?DOWN|FIRST SHOW ?DOWN)/.test(l)) { sd = true; continue; }
    if (/^\*\*\* SUMMARY/.test(l)) break;
    if ((m = l.match(/^(.+?): posts (?:small blind|big blind|the ante|small & big blinds|straddle|missing blind|missed blind|dead blind)[^\d]*([\d.,]+)/))) { put(m[1], trkNum(m[2])); continue; }
    if ((m = l.match(/^(.+?): (folds|checks|calls|bets|raises)(?: [$€£]?([\d.,]+))?(?: to [$€£]?([\d.,]+))?/))) {
      const [, w, act] = m, a = { folds: "f", checks: "x", calls: "c", bets: "b", raises: "r" }[act];
      if (a === "c") put(w, trkNum(m[3]));
      if (a === "b") put(w, trkNum(m[3]));
      if (a === "r") { const to = trkNum(m[4]); put(w, to - (str[w] || 0)); }
      if (a === "f") folded.add(w);
      ev[st].push([w, a]);
      const bb = v => fmt(trkNum(v) / BB, 1).replace(/,0$/, "");
      const t = a === "f" ? "fold" : a === "x" ? "check" : a === "c" ? `call ${bb(m[3])}` : a === "b" ? `punta ${bb(m[3])}` : `rilancia a ${bb(m[4])}`;
      if (a !== "f" || w === hero || st > 0) hist[st].push(`${P(w)} ${t}`);
      continue;
    }
    if ((m = l.match(/^Uncalled bet \([$€£]?([\d.,]+)\) returned to (.+)$/))) { const a = trkNum(m[1]); str[m[2]] = (str[m[2]] || 0) - a; if (m[2] === hero) inv -= a; continue; }
    if ((m = l.match(/^(.+?) collected [$€£]?([\d.,]+) from/))) { if (m[1] === hero) coll += trkNum(m[2]); continue; }
    if ((m = l.match(/^(.+?): Receives Cashout \([$€£]?([\d.,]+)\)/))) { if (m[1] === hero) coll += trkNum(m[2]); continue; }
  }
  void maxS;
  const x = trkFlags(ev, hero, pos, ord, folded, atFlop);
  if (sd && !folded.has(hero)) x.sd = 1;
  if (coll > 0) x.w = 1;
  const SN = ["Preflop", "Flop", "Turn", "River"];
  return { i: site + hm[1], d: date, b: BB, c: cur, n, p: pos[hero], k: cards, r: Math.round((coll - inv) / BB * 100) / 100, bd: board, x, h: hist.map((a, i) => a.length ? `${SN[i]}: ${a.join(" · ")}` : "").filter(Boolean) };
}
/* le situazioni di ogni mano: chi apre, chi rilancia, chi fa la c-bet e cosa fai tu */
function trkFlags(ev, hero, pos, ord, folded, atFlop) {
  const x = {}, act3 = a => a === "r" ? "r" : a === "c" ? "c" : "f", hp = pos[hero];
  let nr = 0, limp = 0, nc = 0, opener = null, r3 = null, last = null, first = true, opened = false, did3 = false;
  for (const [w, a] of ev[0]) {
    if (w === hero) {
      if (a === "c" || a === "r") x.v = 1; if (a === "r") x.p = 1;
      if (first) { first = false;
        if (nr === 0) { if (limp === 0) { if (hp !== "BB") x.o = act3(a); } else if (hp !== "BB" || a === "r") x.l = act3(a); if (a === "c") x.lp = 1; }
        else if (nr === 1) x.s = [pos[opener], nc, act3(a)];
        else x.k = act3(a);
        if (a === "r" && nr === 0) opened = true; if (a === "r" && nr === 1) did3 = true;
      } else if (opened && nr === 2 && !x.t && r3 !== hero) x.t = [pos[r3], act3(a)];
      else if (did3 && nr === 3 && !x.q) x.q = act3(a);
    }
    if (a === "r") { nr++; if (nr === 1) opener = w; if (nr === 2) r3 = w; nc = 0; last = w; }
    else if (a === "c") { if (nr === 0) limp++; else nc++; }
  }
  const pfa = last;
  if (pfa === hero) x.a = 1;
  if (!atFlop || !atFlop.includes(hero)) return x;
  x.sf = 1; x.m = atFlop.length;
  if (Math.max(...atFlop.map(w => ord[w])) === ord[hero]) x.ip = 1;
  let A = 0, C = 0, F = 0;
  /* flop, turn e river: c-bet, risposta alla c-bet, check-raise */
  const KEYS = [null, ["cf", "ff"], ["ct", "ft"], ["cr", "fr"]];
  for (let s = 1; s <= 3; s++) {
    let bets = 0, fb = null, hFirst = true, hChk = false;
    const [kc, kf] = KEYS[s];
    const canC = s === 1 ? pfa === hero : x[KEYS[s - 1][0]] === "b";
    const canF = s === 1 ? pfa && pfa !== hero : x[KEYS[s - 1][1]] === "c";
    for (const [w, a] of ev[s]) {
      if (w === hero) {
        if (a === "b" || a === "r") A++; else if (a === "c") C++; else if (a === "f") F++;
        if (hFirst) { hFirst = false; if (canC && bets === 0) x[kc] = a === "b" ? "b" : "x"; if (canF && bets === 1 && fb === pfa) x[kf] = act3(a); }
        else { if (canF && x[kf] === undefined && bets === 1 && fb === pfa) x[kf] = act3(a); if (s === 1 && hChk && bets === 1 && x.xr === undefined && fb !== hero) x.xr = act3(a); }
        if (a === "x") hChk = true;
      }
      if (a === "b") { bets = 1; fb = w; } else if (a === "r") bets++;
    }
  }
  if (A) x.A = A; if (C) x.C = C; if (F) x.F = F;
  return x;
}
/* lettura a pezzi, per non bloccare la pagina con migliaia di mani */
function trkParseAsync(text, prog) {
  const ch = trkSplit(text), out = [];
  return new Promise(res => { let i = 0; const step = () => { const e = Math.min(ch.length, i + 400); for (; i < e; i++) { try { const h = trkHand(ch[i]); if (h) out.push(h); } catch (er) {} } if (prog) prog(i, ch.length); if (i < ch.length) setTimeout(step, 0); else res(out); }; step(); });
}
async function trkAdd(text, prog) {
  const got = await trkParseAsync(text, prog), ids = new Set(TRK.hands.map(h => h.i)), fresh = got.filter(h => !ids.has(h.i));
  TRK.hands = [...TRK.hands, ...fresh].sort((a, b) => (a.d || "") < (b.d || "") ? -1 : (a.d || "") > (b.d || "") ? 1 : 0).slice(-TRK_MAX);
  const ok = await trkSave();
  return { got: got.length, fresh: fresh.length, ok };
}

/* ---------- statistiche ---------- */
const TRK_PK = { UTG: "ep", HJ: "mp", CO: "co", BTN: "btn", SB: "sb", BB: "bb" };
const trkLim = b => "NL" + String(Math.round(b * 100));
const trkKey = k => { const R = "AKQJT98765432", a = k[0], b = k[2]; if (a === b) return a + b; const [h, l] = R.indexOf(a) < R.indexOf(b) ? [a, b] : [b, a]; return h + l + (k[1] === k[3] ? "s" : "o"); };
const trkCard = s => String(s || "").replace(/(.)([shdc])/g, (_, r, su) => r + { s: "♠", h: "♥", d: "♦", c: "♣" }[su]);
const trkPct = (a, b) => b ? a / b * 100 : null;
const trkF1 = v => v == null ? "–" : fmt(v, 1);
function trkStats(H) {
  const S = { n: H.length, r: 0, sdR: 0, nsdR: 0 }, cnt = (f, g) => { let a = 0, b = 0; for (const h of H) { const o = f(h.x || {}, h); if (o == null) continue; b++; if (g(o, h.x || {}, h)) a++; } return [a, b]; };
  for (const h of H) { S.r += h.r; if ((h.x || {}).sd) S.sdR += h.r; else S.nsdR += h.r; }
  const st = {
    vpip: cnt(x => x.o || x.l || x.s || x.k || x.t ? 1 : (x.v ? 1 : null), (o, x) => x.v),
    pfr: cnt(x => x.o || x.l || x.s || x.k || x.t ? 1 : (x.v ? 1 : null), (o, x) => x.p),
    rfi: cnt(x => x.o, o => o === "r"),
    limp: cnt(x => x.o || x.l, o => o === "c"),
    tb: cnt(x => x.s, o => o[2] === "r"),
    cc: cnt((x, h) => x.s && h.p !== "BB" ? x.s : null, o => o[2] === "c"),
    steal: cnt((x, h) => ["CO", "BTN", "SB"].includes(h.p) ? x.o : null, o => o === "r"),
    bbst: cnt((x, h) => h.p === "BB" && x.s && ["CO", "BTN", "SB"].includes(x.s[0]) && !x.s[1] ? x.s : null, o => o[2] === "f"),
    f3: cnt(x => x.t, o => o[1] === "f"),
    fb4: cnt(x => x.t, o => o[1] === "r"),
    f4: cnt(x => x.q, o => o === "f"),
    cf: cnt(x => x.m === 2 ? x.cf : null, o => o === "b"),
    cfm: cnt(x => x.m > 2 ? x.cf : null, o => o === "b"),
    cfip: cnt(x => x.m === 2 && x.ip ? x.cf : null, o => o === "b"),
    cfop: cnt(x => x.m === 2 && !x.ip ? x.cf : null, o => o === "b"),
    ff: cnt(x => x.m === 2 ? x.ff : null, o => o === "f"),
    rf: cnt(x => x.m === 2 ? x.ff : null, o => o === "r"),
    xr: cnt(x => x.xr, o => o === "r"),
    ct: cnt(x => x.m === 2 ? x.ct : null, o => o === "b"),
    ft: cnt(x => x.m === 2 ? x.ft : null, o => o === "f"),
    cr: cnt(x => x.m === 2 ? x.cr : null, o => o === "b"),
    fr: cnt(x => x.m === 2 ? x.fr : null, o => o === "f"),
    wtsd: cnt(x => x.sf, (o, x) => x.sd),
    wsd: cnt(x => x.sd, (o, x) => x.w),
    wwsf: cnt(x => x.sf, (o, x) => x.w),
  };
  /* VPIP e PFR si contano su tutte le mani, come nei tracker */
  st.vpip = [H.filter(h => (h.x || {}).v).length, H.length]; st.pfr = [H.filter(h => (h.x || {}).p).length, H.length]; st.limp = [st.limp[0], H.length];
  let A = 0, C = 0, F = 0; for (const h of H) { const x = h.x || {}; A += x.A || 0; C += x.C || 0; F += x.F || 0; }
  st.af = [A, C]; st.afq = [A, A + C + F];
  S.st = st; S.bb100 = H.length ? S.r / H.length * 100 : 0;
  return S;
}
const TRK_ST = [
  ["Preflop", [["vpip", "VPIP", "Mani in cui metti soldi volontariamente preflop"], ["pfr", "PFR", "Mani in cui rilanci preflop"], ["rfi", "Open (RFI)", "Quando tutti hanno foldato fino a te, quante volte apri"], ["steal", "Steal", "Open da CO, BTN e SB quando tutti hanno foldato"], ["tb", "3-bet", "Contro un open, quante volte rilanci"], ["cc", "Cold call", "Contro un open, quante volte fai call fuori dal BB"], ["f3", "Fold al 3-bet", "Dopo il tuo open, quante volte foldi al 3-bet"], ["fb4", "4-bet", "Dopo il tuo open, quante volte rispondi al 3-bet con un 4-bet"], ["bbst", "Fold BB allo steal", "Dal BB, contro un open di CO, BTN o SB"], ["limp", "Limp", "Mani in cui entri con un call senza rilancio, su tutte le mani"]]],
  ["Postflop", [["cf", "C-bet flop", "Testa a testa, da aggressore preflop"], ["cfip", "C-bet flop in posizione", ""], ["cfop", "C-bet flop fuori posizione", ""], ["cfm", "C-bet flop multiway", "Con tre o più giocatori"], ["ct", "C-bet turn", "Dopo la c-bet al flop"], ["cr", "C-bet river", "Dopo le c-bet al flop e al turn"], ["ff", "Fold alla c-bet flop", "Testa a testa"], ["rf", "Raise alla c-bet flop", "Testa a testa"], ["ft", "Fold alla c-bet turn", "Dopo aver fatto call al flop"], ["fr", "Fold al river", "Dopo aver fatto call al flop e al turn"], ["xr", "Check-raise flop", "Hai fatto check e qualcuno ha puntato"]]],
  ["Showdown e aggressività", [["wtsd", "WTSD", "Vai allo showdown, sulle mani in cui vedi il flop"], ["wsd", "W$SD", "Vinci allo showdown"], ["wwsf", "WWSF", "Vinci soldi quando vedi il flop"], ["afq", "AFq", "Puntate e rilanci sul totale delle azioni postflop"], ["af", "AF", "Puntate e rilanci diviso i call, postflop"]]],
];

/* ---------- cerca leak ---------- */
/* tabella della scuola per lo spot: NL2-NL10 per i micro, NL25-NL200 da NL25 in su */
const trkTab = (id, b) => (b <= 0.1 + 1e-9 ? PRE_BY["m_" + id] : null) || PRE_BY[id];
/* frequenze della tabella per la mano: { f: fold, c: call, r: rilancio } */
function trkTabF(sp, key) { const f = sp && sp.f[key]; if (!f) return { f: 1, c: 0, r: 0 }; const a = sp.acts.map(s => s.toLowerCase()); const o = { f: 0, c: 0, r: 0 }; f.forEach((v, i) => { const s = a[i]; o[/^fold/.test(s) ? "f" : /^call/.test(s) ? "c" : "r"] += v; }); return o; }
function trkSpots(H) {
  const G = {}, add = (g, lab, h, a, sp) => { if (!sp) return; const F = trkTabF(sp, trkKey(h.k)); (G[g] = G[g] || {}); const R = G[g][lab] = G[g][lab] || { n: 0, play: 0, exp: 0, raise: 0, expR: 0, fold: 0, expF: 0, dev: [] };
    R.n++; R.play += a !== "f" ? 1 : 0; R.exp += 1 - F.f; R.raise += a === "r" ? 1 : 0; R.expR += F.r; R.fold += a === "f" ? 1 : 0; R.expF += F.f;
    if (F[a] < 0.25) R.dev.push({ h, a, F, kind: a !== "f" && F.f >= 0.75 ? "largo" : a === "f" && F.f < 0.25 ? "stretto" : "azione" }); };
  for (const h of H) {
    const x = h.x || {}, pk = TRK_PK[h.p]; if (!pk || h.n < 3) continue;
    if (x.o && pk !== "bb") add("rfi", h.p, h, x.o === "c" ? "c" : x.o, trkTab("rfi_" + pk, h.b));
    if (x.s && !x.s[1]) { const ok = TRK_PK[x.s[0]]; if (ok) { if (pk === "bb") add("bb", `contro ${x.s[0]}`, h, x.s[2], trkTab("bb_" + ok, h.b)); else add("tb", `${h.p} contro ${x.s[0]}`, h, x.s[2], trkTab(pk + "_" + ok, h.b)); } }
    if (x.t) { const tk = TRK_PK[x.t[0]]; if (tk) add("v3", `${h.p} contro ${x.t[0]}`, h, x.t[1], trkTab(pk + "_vs_" + tk + "3", h.b)); }
  }
  return G;
}
/* valori tipici di un regular vincente 6-max nei micro: una base, non una legge. Contro tavoli diversi cambiano */
const TRK_BANDS = [
  { k: "cf", t: "C-bet al flop testa a testa", lo: 45, hi: 75, les: "n25cbet", hiTxt: "Punti quasi sempre: chi ti conosce rilancia e fa call più largo, e le tue c-bet perdono valore sui flop che aiutano lui.", loTxt: "Rinunci a tanti piatti in cui il vantaggio di range è tuo: sui flop alti e secchi la c-bet piccola con tutto il range guadagna.", hiDo: "Sui flop bassi e collegati, che aiutano chi ha fatto call, fai più check.", loDo: "Sui flop alti e secchi punta 1/3 del piatto con quasi tutto il range." },
  { k: "cfm", t: "C-bet al flop multiway", lo: 20, hi: 50, les: "post", hiTxt: "In tre o più qualcuno ha colpito spesso: le c-bet senza mano trovano troppi call.", loTxt: "Anche nei piatti multiway le mani forti e i progetti buoni vanno puntati.", hiDo: "Nei piatti multiway punta quasi solo con una mano o un progetto forte.", loDo: "Punta per valore le mani forti: in tanti, qualcuno fa call con mani peggiori." },
  { k: "ct", t: "Secondo barrel al turn", lo: 38, hi: 65, les: "n25barrel", hiTxt: "Continui troppo spesso: al turn chi ha fatto call al flop ha già una mano e folda meno.", loTxt: "Ti fermi troppo dopo la c-bet: le carte di turn che ti aiutano e i progetti vanno puntati.", hiDo: "Al turn continua con valore, progetti e carte che cambiano il board a tuo favore.", loDo: "Scegli 2-3 tipi di turn su cui continuare sempre: carte alte, progetti, mani migliorate." },
  { k: "ff", t: "Fold alla c-bet al flop", lo: 35, hi: 55, les: "n10def", hiTxt: "Foldi troppo: chi fa c-bet con tutto il range guadagna contro di te anche senza mano.", loTxt: "Difendi troppo: arrivi al turn con mani che poi non sanno cosa fare.", hiDo: "Contro le c-bet piccole difendi coppie, progetti e carte alte con backdoor.", loDo: "Folda le mani senza coppia e senza progetto, soprattutto contro le puntate grandi." },
  { k: "rf", t: "Raise alla c-bet al flop", lo: 6, hi: 16, les: "n50xr", hiTxt: "Rilanci molto: va bene contro chi folda, ma i rilanci troppo larghi bruciano soldi contro chi fa call.", loTxt: "Rilanci quasi mai: i tuoi call sono facili da leggere e le mani forti vengono pagate poco.", hiDo: "Rilancia per valore e con i progetti migliori, non con le mani medie.", loDo: "Aggiungi il check-raise con set, doppie e progetti forti." },
  { k: "ft", t: "Fold al secondo barrel", lo: 35, hi: 55, les: "n10def", hiTxt: "Foldi troppo al turn dopo aver fatto call al flop: i call al flop diventano soldi persi.", loTxt: "Fai call troppo al turn: contro le seconde puntate dei passivi le mani medie sono dietro.", hiDo: "Al flop fai call solo con mani che possono continuare al turn.", loDo: "Al turn folda le mani medie contro chi punta di rado." },
  { k: "fr", t: "Fold al river dopo due call", lo: 30, hi: 55, les: "n50river", hiTxt: "Arrivi al river e foldi troppo spesso: le prime due call erano troppo larghe.", loTxt: "Al river fai call troppo spesso: contro le puntate grandi dei passivi il call perde.", hiDo: "Rivedi i call al flop e al turn: ogni call deve avere un piano per il river.", loDo: "Al river chiediti quali bluff può avere: se sono pochi, folda." },
  { k: "wtsd", t: "Vai allo showdown (WTSD)", lo: 24, hi: 32, les: "n50river", hiTxt: "Vai allo showdown troppo spesso: probabilmente fai call al river con mani che battono solo i bluff.", loTxt: "Arrivi poco allo showdown: lasci troppi piatti quando l'avversario continua a puntare.", hiDo: "Al river folda di più contro chi bluffa poco.", loDo: "Difendi di più al flop e al turn le mani con showdown value." },
  { k: "wsd", t: "Vinci allo showdown (W$SD)", lo: 48, hi: 58, les: "n50river", hiTxt: "Vinci quasi sempre allo showdown: ci arrivi solo con mani fortissime, e fuori showdown lasci piatti.", loTxt: "Allo showdown perdi spesso: ci arrivi con mani troppo deboli.", hiDo: "Difendi un po' di più: alcune mani medie meritano lo showdown.", loDo: "Folda di più al turn e al river con le mani medie." },
  { k: "afq", t: "Aggressività postflop (AFq)", lo: 35, hi: 52, les: "post", hiTxt: "Punti e rilanci moltissimo: contro chi fa sempre call i bluff perdono.", loTxt: "Giochi passivo: fai call più che puntare, e vinci meno piatti senza showdown.", hiDo: "Contro le calling station punta per valore e bluffa meno.", loDo: "Quando sei tu a puntare, guadagni in due modi: punta di più al posto del call." },
];
function trkBand(B, v) {
  const [a, n] = v, p = trkPct(a, n);
  if (n < 30) return { st: "few", p, n };
  if (p >= B.lo && p <= B.hi) return { st: "ok", p, n };
  const e = p > B.hi ? B.hi : B.lo, z = Math.abs(p - e) / 100 / Math.sqrt(e / 100 * (1 - e / 100) / n);
  return { st: z >= 2 ? "bad" : "warn", p, n, dir: p > B.hi ? "hi" : "lo" };
}
function trkLeaks(H) {
  const S = trkStats(H), G = trkSpots(H), L = [];
  const pp = (a, b) => b ? a / b * 100 : 0;
  /* preflop: stesse carte, tabella della scuola */
  const pre = (g, tit, les, fmtRow, exp) => { const rows = Object.entries(G[g] || {}).sort((a, b) => b[1].n - a[1].n); if (!rows.length) return;
    let n = 0, dev = 0; rows.forEach(([, R]) => { n += R.n; dev += R.dev.length; });
    const worst = rows.map(([lab, R]) => ({ lab, R, d: Math.abs(pp(R.play, R.n) - pp(R.exp, R.n)) })).filter(o => o.R.n >= 8).sort((a, b) => b.d - a.d)[0];
    const rate = R => R.dev.length / R.n, big = rows.filter(([, R]) => R.n >= 15);
    const diff = R => Math.abs(R.play - R.exp) / R.n;
    const st = n < 15 ? "few" : big.some(([, R]) => diff(R) >= 0.07 && rate(R) > 0.08) ? "bad" : big.some(([, R]) => rate(R) > 0.08 || diff(R) >= 0.04) || dev / n > 0.08 ? "warn" : "ok";
    void worst;
    L.push({ g, t: tit, les, st, n, dev, ok: Math.round((1 - dev / n) * 100), rows, fmtRow, exp, w: dev, pre: 1 }); };
  pre("rfi", "Open quando tutti foldano fino a te", "pos", "open", "Con le stesse carte, la tabella della scuola avrebbe aperto");
  pre("bb", "Difesa del BB", "n5bb", "difendi", "Con le stesse carte, la tabella avrebbe difeso (call o 3-bet)");
  pre("tb", "3-bet o fold contro un open", "n5three", "giochi", "Con le stesse carte, la tabella avrebbe fatto 3-bet");
  pre("v3", "Contro il 3-bet, dopo il tuo open", "n5vs3", "continui", "Con le stesse carte, la tabella avrebbe continuato (call o 4-bet)");
  const lp = S.st.limp; if (lp[1] >= 50 && lp[0]) L.push({ t: "Limp", les: "nolimp", st: pp(lp[0], lp[1]) >= 2 ? "bad" : "warn", p: pp(lp[0], lp[1]), n: lp[1], limp: H.filter(h => (h.x || {}).lp && h.p !== "BB").slice(-12).reverse(), w: lp[0] * 2 });
  const gap = pp(S.st.vpip[0], S.st.vpip[1]) - pp(S.st.pfr[0], S.st.pfr[1]);
  if (S.n >= 200) L.push({ t: "Differenza VPIP − PFR", les: "n5three", gapv: gap, st: gap > 9 ? "bad" : gap > 6 ? "warn" : "ok", n: S.n, w: Math.max(0, gap - 6) * S.n / 100 });
  /* postflop: valori tipici */
  for (const B of TRK_BANDS) { const r = trkBand(B, S.st[B.k]); L.push({ t: B.t, les: B.les, B, ...r, w: r.st === "bad" || r.st === "warn" ? Math.abs(r.p - (r.dir === "hi" ? B.hi : B.lo)) * r.n / 100 : 0 }); }
  const rank = { bad: 0, warn: 1, ok: 2, few: 3 };
  L.sort((a, b) => rank[a.st] - rank[b.st] || (b.w || 0) - (a.w || 0));
  return { S, L };
}

/* ---------- filtri ---------- */
const TRK_F = { lim: "all", per: "all" };
function trkPool() { return TRK.demo || TRK.hands; }
function trkFiltered() {
  let H = trkPool();
  if (TRK_F.lim !== "all") H = H.filter(h => trkLim(h.b) === TRK_F.lim);
  if (TRK_F.per === "1000") H = H.slice(-1000);
  else if (TRK_F.per === "7" || TRK_F.per === "30") { const last = H.length ? H[H.length - 1].d.slice(0, 10) : ""; const t = new Date(last.replace(/-/g, "/")); t.setDate(t.getDate() - (+TRK_F.per - 1)); const from = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; H = H.filter(h => h.d.slice(0, 10) >= from); }
  return H;
}
function trkFilters() {
  const lims = [...new Set(trkPool().map(h => trkLim(h.b)))].sort((a, b) => +a.slice(2) - +b.slice(2));
  const sel = (id, lab, opts, v) => `<label class="trk-fl"><span>${lab}</span><select data-trkf="${id}">${opts.map(([k, t]) => `<option value="${k}"${k === v ? " selected" : ""}>${t}</option>`).join("")}</select></label>`;
  return `<div class="trk-fls">${sel("lim", "Limite", [["all", "Tutti"], ...lims.map(l => [l, l])], TRK_F.lim)}${sel("per", "Periodo", [["all", "Tutte le mani"], ["30", "Ultimi 30 giorni"], ["7", "Ultimi 7 giorni"], ["1000", "Ultime 1.000 mani"]], TRK_F.per)}</div>`;
}

/* ---------- grafico dei risultati ---------- */
function trkGraph(H) {
  if (H.length < 2) return "";
  const W = 640, Ht = 240, l = 56, r = 14, t = 14, b = 30, n = H.length, step = Math.max(1, Math.ceil(n / 500));
  const tot = [0], sdl = [0], nsd = [0]; let a = 0, s = 0, u = 0;
  H.forEach((h, i) => { a += h.r; if ((h.x || {}).sd) s += h.r; else u += h.r; if ((i + 1) % step === 0 || i === n - 1) { tot.push(a); sdl.push(s); nsd.push(u); } });
  const all = [...tot, ...sdl, ...nsd], mn = Math.min(0, ...all), mx = Math.max(0, ...all), sp = mx - mn || 1;
  const X = i => l + i / (tot.length - 1) * (W - l - r), Y = v => t + (mx - v) / sp * (Ht - t - b);
  const nice = (() => { const raw = sp / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; })();
  let g = ""; for (let v = Math.ceil(mn / nice) * nice; v <= mx + 1e-9; v += nice) g += `<line class="${Math.abs(v) < 1e-9 ? "z" : "g"}" x1="${l}" x2="${W - r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="yl" x="${l - 6}" y="${(Y(v) + 4).toFixed(1)}">${fmt(v, 0)}</text>`;
  [0, 0.5, 1].forEach(f => { g += `<text class="xl" x="${(l + f * (W - l - r)).toFixed(1)}" y="${Ht - 8}" text-anchor="${f === 0 ? "start" : f === 1 ? "end" : "middle"}">${Math.round(f * n).toLocaleString("it-IT")}</text>`; });
  const line = (arr, c) => `<polyline class="ln ${c}" points="${arr.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ")}"/>`;
  return `<div class="trk-g"><svg viewBox="0 0 ${W} ${Ht}" class="trk-svg" role="img" aria-label="Risultati cumulati in big blind: totale ${fmt(a, 0)}, showdown ${fmt(s, 0)}, senza showdown ${fmt(u, 0)}">${g}${line(nsd, "r")}${line(sdl, "b")}${line(tot, "g")}</svg>
    <div class="trk-leg"><span class="g"><i></i>Totale <b>${fmt(a, 1)} bb</b></span><span class="b"><i></i>Allo showdown <b>${fmt(s, 1)} bb</b></span><span class="r"><i></i>Senza showdown <b>${fmt(u, 1)} bb</b></span></div><p class="trk-gx">Mani giocate · big blind vinti o persi</p></div>`;
}

/* ---------- schermate ---------- */
let DATA_SUB = null;
const trkMoney = (H, v) => { const cs = [...new Set(H.map(h => h.c))]; if (cs.length !== 1) return ""; const m = H.reduce((s, h) => s + h.r * h.b, 0); return `${m < 0 ? "−" : ""}${cs[0]}${fmt(Math.abs(m), 2)}`; };
const trkSign = v => `<b class="${v > 0 ? "pos" : v < 0 ? "neg" : ""}">${v > 0 ? "+" : v < 0 ? "−" : ""}${fmt(Math.abs(v), 1)}</b>`;
function trkSubBar() {
  const n = trkPool().length, it = [["trk", "Tracker"], ["leak", "Cerca leak"], ["imp", "Importa"]];
  return `<div class="trk-sub" role="tablist" aria-label="I miei dati">${it.map(([k, t]) => `<button type="button" role="tab" data-dsub="${k}" aria-selected="${DATA_SUB === k}">${t}${k !== "imp" && n ? ` <small>${n.toLocaleString("it-IT")}</small>` : ""}</button>`).join("")}</div>${TRK.demo ? `<div class="trk-demo"><span>👀 Stai guardando <b>${TRK.demo.length.toLocaleString("it-IT")} mani di esempio</b>, inventate per mostrarti il tracker. Non sono salvate.</span><button class="btn" data-trkdemo="0">Esci dall'esempio</button></div>` : ""}`;
}
function trkEmpty() {
  return `<section class="panel trk-empty"><div class="eyebrow">Tracker</div><h3>Ancora nessuna mano</h3><p>Importa le hand history di GGPoker o PokerStars: qui trovi VPIP, PFR, 3-bet, c-bet, il grafico dei risultati, come vai in ogni posizione e il cerca leak, che confronta ogni tua scelta preflop con le tabelle della scuola.</p>
    <div class="trk-row"><button class="btn primary" data-dsub="imp">Importa le tue mani</button><button class="btn" data-trkdemo="1">Prova con 3.000 mani di esempio</button></div>${TRK.ready ? "" : `<p class="muted">Sto leggendo l'archivio…</p>`}</section>`;
}
function trkRenderTracker() {
  const H = trkFiltered(); if (!trkPool().length) return trkEmpty();
  if (!H.length) return trkFilters() + `<p class="muted">Nessuna mano con questi filtri.</p>`;
  const S = trkStats(H), st = S.st, pc = k => trkF1(trkPct(...st[k]));
  const money = trkMoney(H);
  const top = `<div class="trk-kpi"><div><small>Mani</small><b>${S.n.toLocaleString("it-IT")}</b></div><div><small>bb/100</small>${trkSign(S.bb100)}</div><div><small>Big blind vinti</small>${trkSign(S.r)}</div>${money ? `<div><small>Soldi</small><b class="${S.r > 0 ? "pos" : S.r < 0 ? "neg" : ""}">${money}</b></div>` : ""}<div><small>VPIP / PFR</small><b>${pc("vpip")} / ${pc("pfr")}</b></div><div><small>3-bet</small><b>${pc("tb")}</b></div></div>`;
  const small = S.n < 1000 ? `<p class="trk-note">Con ${S.n.toLocaleString("it-IT")} mani i risultati dipendono ancora molto dalla fortuna: le statistiche preflop si stabilizzano prima, il bb/100 servono decine di migliaia di mani.</p>` : "";
  const tables = TRK_ST.map(([g, rows]) => `<div class="trk-card"><h4>${g}</h4><table class="trk-t"><tbody>${rows.map(([k, lab, d]) => { const [a, n] = st[k]; const v = k === "af" ? (n ? fmt(a / n, 1) : "–") : trkF1(trkPct(a, n)); return `<tr${n < 20 ? ' class="few"' : ""}><th>${lab}${d ? `<small>${d}</small>` : ""}</th><td>${v}${k === "af" ? "" : n ? "%" : ""}</td><td class="n">${k === "af" ? "" : n.toLocaleString("it-IT")}</td></tr>`; }).join("")}</tbody></table></div>`).join("");
  const POS = ["UTG", "HJ", "CO", "BTN", "SB", "BB"], byP = POS.map(p => { const Hp = H.filter(h => h.p === p); if (!Hp.length) return ""; const s = trkStats(Hp); return `<tr><th>${p}</th><td>${Hp.length.toLocaleString("it-IT")}</td><td>${trkF1(trkPct(...s.st.vpip))}</td><td>${trkF1(trkPct(...s.st.pfr))}</td><td>${p === "BB" ? "–" : trkF1(trkPct(...s.st.rfi))}</td><td>${trkSign(s.r)}</td><td>${trkSign(s.bb100)}</td></tr>`; }).join("");
  const days = {}; H.forEach(h => { const d = h.d.slice(0, 10) || "senza data"; (days[d] = days[d] || []).push(h); });
  const dayRows = Object.entries(days).sort((a, b) => a[0] < b[0] ? 1 : -1).slice(0, 10).map(([d, Hd]) => { const r = Hd.reduce((s, h) => s + h.r, 0); return `<tr><th>${d.split("-").reverse().join("/")}</th><td>${Hd.length.toLocaleString("it-IT")}</td><td>${trkSign(r)}</td><td>${trkSign(r / Hd.length * 100)}</td><td>${trkMoney(Hd)}</td></tr>`; }).join("");
  const big = [...H].sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 10);
  return trkFilters() + top + small + `<div class="trk-card"><h4>Risultati</h4>${trkGraph(H)}<p class="trk-note">La linea <b class="tb">blu</b> sono i piatti decisi allo showdown, la <b class="tr">rossa</b> quelli vinti o persi prima, con un fold. Se la rossa scende molto, lasci troppi piatti quando l'avversario punta; come leggere il grafico lo trovi nella lezione <a href="#" data-lespre="tracker">Tracker e HUD</a>.</p></div>
    <div class="trk-cols">${tables}</div>
    <div class="trk-card"><h4>Per posizione</h4><div class="trk-tw"><table class="trk-t pos"><thead><tr><th>Posizione</th><th>Mani</th><th>VPIP</th><th>PFR</th><th>Open</th><th>bb</th><th>bb/100</th></tr></thead><tbody>${byP}</tbody></table></div><p class="trk-note">Dai bui si perde quasi sempre, perché a ogni giro metti i bui. Conta quanto poco perdi lì e quanto vinci da CO e BTN.</p></div>
    <div class="trk-card"><h4>Per giorno</h4><div class="trk-tw"><table class="trk-t pos"><thead><tr><th>Giorno</th><th>Mani</th><th>bb</th><th>bb/100</th><th>Soldi</th></tr></thead><tbody>${dayRows}</tbody></table></div></div>
    <div class="trk-card"><h4>I piatti più grandi</h4><div class="trk-hl">${big.map(trkHandRow).join("")}</div></div>`;
}
const trkHandRow = h => `<button type="button" class="trk-h" data-trkh="${esc(h.i)}"><span class="c">${UI.c(trkCard(h.k))}</span><span class="p">${h.p}</span><span class="bd">${h.bd ? UI.c(trkCard(h.bd)) : "<em>preflop</em>"}</span>${trkSign(h.r)}</button>`;
function trkShowHand(id) {
  const h = trkPool().find(x => x.i === id); if (!h) return;
  gModal(`<div class="trk-hv"><div class="eyebrow">${esc(trkLim(h.b))} · ${esc(h.d.split(" ")[0].split("-").reverse().join("/"))} ${esc(h.d.split(" ")[1] || "")} · ${h.n} giocatori</div><h3>${UI.c(trkCard(h.k))} da ${h.p} ${trkSign(h.r)} bb</h3>${h.bd ? `<p>Board ${UI.c(trkCard(h.bd))}</p>` : ""}<ol>${(h.h || []).map(l => `<li>${esc(l).replace(/^(Preflop|Flop|Turn|River):/, "<b>$1</b>")}</li>`).join("")}</ol><p class="muted">Mano ${esc(h.i.slice(2))}${(h.x || {}).sd ? " · arrivata allo showdown" : ""}</p></div>`);
}
function trkRenderLeaks() {
  const H = trkFiltered(); if (!trkPool().length) return trkEmpty();
  if (H.length < 50) return trkFilters() + `<section class="panel"><p>Per cercare i leak servono almeno 50 mani: ne hai ${H.length}. Le scelte preflop si confrontano già bene dopo qualche centinaio di mani, le statistiche postflop dopo qualche migliaio.</p></section>`;
  const { L } = trkLeaks(H), cnt = s => L.filter(x => x.st === s).length;
  const lab = { bad: "Leak", warn: "Da tenere d'occhio", ok: "In linea", few: "Poche mani" };
  const card = (o, i) => {
    let body = "";
    if (o.pre) {
      const rows = o.rows.map(([l, R]) => `<tr><th>${l}</th><td>${R.n}</td><td>${fmt(R.play / R.n * 100, 0)}%</td><td>${fmt(R.exp / R.n * 100, 0)}%</td><td class="${R.dev.length / R.n > 0.15 ? "neg" : ""}">${R.dev.length}</td></tr>`).join("");
      const dev = o.rows.flatMap(([l, R]) => R.dev.map(d => ({ ...d, l }))), gr = {};
      dev.forEach(d => { const k = `${d.l}|${trkKey(d.h.k)}|${d.a}`; (gr[k] = gr[k] || { ...d, c: 0, hs: [] }).c++; gr[k].hs.push(d.h); });
      const AN = { f: "fold", c: "call", r: o.g === "rfi" ? "open" : o.g === "v3" ? "4-bet" : "3-bet" };
      const tabTxt = F => [["f", "fold"], ["c", "call"], ["r", o.g === "rfi" ? "open" : o.g === "v3" ? "4-bet" : "3-bet"]].filter(([k]) => F[k] >= 0.25).map(([k, t]) => t).join(" o ");
      const list = Object.values(gr).sort((a, b) => b.c - a.c).slice(0, 12).map(d => `<button type="button" class="trk-dv ${d.kind}" data-trkh="${esc(d.hs[d.hs.length - 1].i)}"><b>${trkKey(d.h.k)}</b><span>${d.l}</span><span>tu: <em>${AN[d.a]}</em> · tabella: <em>${tabTxt(d.F)}</em></span>${d.c > 1 ? `<i>×${d.c}</i>` : ""}</button>`).join("");
      body = `<p>Per ogni decisione guardo cosa fa la tabella della scuola con le tue stesse carte. Hai giocato come la tabella nel <b>${o.ok}%</b> delle ${o.n.toLocaleString("it-IT")} decisioni.</p><div class="trk-tw"><table class="trk-t pos"><thead><tr><th>Spot</th><th>Volte</th><th>Tu ${o.fmtRow}</th><th>Tabella</th><th>Fuori tabella</th></tr></thead><tbody>${rows}</tbody></table></div><p class="trk-note">${o.exp}: è la colonna Tabella.</p>${list ? `<h5>Le mani giocate fuori tabella</h5><p class="trk-note"><i class="trk-k largo"></i>giocata dove la tabella folda · <i class="trk-k stretto"></i>foldata dove la tabella gioca · <i class="trk-k azione"></i>azione diversa. Tocca una mano per rivederla.</p><div class="trk-dvs">${list}</div>` : ""}`;
    } else if (o.limp) {
      body = `<p>Entri con un limp nel <b>${fmt(o.p, 1)}%</b> delle mani. Le tabelle della scuola non limpano mai: quando entri per primo rilancia o folda, e contro chi limpa isola o folda.</p><div class="trk-hl">${o.limp.map(trkHandRow).join("")}</div>`;
    } else if (o.gapv != null) {
      body = `<p>VPIP e PFR distano <b>${fmt(o.gapv, 1)} punti</b>. Più la distanza è grande, più entri nei piatti con un call invece che con un rilancio: senza iniziativa, fuori posizione e spesso contro range più forti. Per un regular 6-max la distanza tipica è 3-6 punti.</p>`;
    } else {
      const B = o.B;
      body = `<p>Tu: <b>${trkF1(o.p)}%</b> su ${o.n.toLocaleString("it-IT")} occasioni. Valori tipici: <b>${B.lo}-${B.hi}%</b>.</p>${o.st === "few" ? `<p class="muted">Servono almeno 30 occasioni per giudicare.</p>` : o.st === "ok" ? "" : `<p>${o.dir === "hi" ? B.hiTxt : B.loTxt}</p><p class="trk-do"><b>Cosa fare</b> ${o.dir === "hi" ? B.hiDo : B.loDo}</p>`}`;
    }
    return `<details class="trk-lk ${o.st}"${i < 3 && o.st !== "ok" && o.st !== "few" ? " open" : ""}><summary><span class="trk-st">${lab[o.st]}</span><b>${o.t}</b>${o.pre ? `<span class="v">${o.ok}% come la tabella</span>` : o.gapv != null ? `<span class="v">${fmt(o.gapv, 1)} punti</span>` : o.p != null ? `<span class="v">${trkF1(o.p)}%</span>` : ""}</summary><div class="trk-lb">${body}<p class="trk-les">Ripassa: <a href="#" data-lespre="${o.les}">${esc((LESSONS[o.les] || {}).t || "")}</a></p></div></details>`;
  };
  return trkFilters() + `<div class="trk-kpi"><div class="bad"><small>Leak</small><b>${cnt("bad")}</b></div><div class="warn"><small>Da tenere d'occhio</small><b>${cnt("warn")}</b></div><div class="ok"><small>In linea</small><b>${cnt("ok")}</b></div><div><small>Mani analizzate</small><b>${H.length.toLocaleString("it-IT")}</b></div></div>
    <p class="trk-note">Il preflop si confronta con le tabelle della scuola sulle <b>stesse carte</b> che avevi: non conta la fortuna, conta cosa hai scelto. Il postflop si confronta con i valori tipici di un regular vincente 6-max nei micro: sono una base, non una legge. Contro un tavolo di calling station, per esempio, è giusto bluffare meno e foldare di più al river.</p>
    <div class="trk-lks">${L.map(card).join("")}</div>`;
}
/* nella sezione Importa: quante mani ha il tracker e come svuotarlo */
const trkImpBox = () => TRK.hands.length ? `<p class="trk-imp" id="trkImp">Nel tracker: <b>${TRK.hands.length.toLocaleString("it-IT")}</b> mani su questo dispositivo. <button class="btn ghost" data-trkclr="1" style="padding:4px 10px;font-size:13px">Svuota il tracker</button></p>` : "";
/* la vecchia scheda (import, pool, backup, modalità test) è ora la terza sezione */
function trkBindSub() {
  document.querySelectorAll("[data-trkf]").forEach(s => s.onchange = () => { TRK_F[s.dataset.trkf] = s.value; renderData(); });
}
document.addEventListener("click", e => {
  const t = e.target.closest && e.target.closest("[data-dsub],[data-trkdemo],[data-trkh],[data-trkclr]"); if (!t) return;
  if (t.dataset.trkclr === "1") { t.outerHTML = `Sicuro? Le mani del tracker si cancellano da questo dispositivo. <button class="btn" data-trkclr="2" style="padding:4px 10px;font-size:13px">Sì, svuota</button>`; return; }
  if (t.dataset.trkclr === "2") { TRK.hands = []; trkSave().then(() => renderData()); return; }
  if (t.dataset.dsub) { DATA_SUB = t.dataset.dsub; renderData(); return; }
  if (t.dataset.trkdemo) { if (t.dataset.trkdemo === "1") { t.disabled = true; t.textContent = "Preparo le mani…"; setTimeout(async () => { TRK.demo = await trkParseAsync(trkDemoText(3000)); DATA_SUB = "trk"; TRK_F.lim = "all"; TRK_F.per = "all"; renderData(); }, 30); } else { TRK.demo = null; renderData(); } return; }
  if (t.dataset.trkh) { e.preventDefault(); trkShowHand(t.dataset.trkh); }
});

const trkCollected = (L, nm) => L.reduce((a, l) => { const m = l.match(/^(.+?) collected \$([\d.]+) from/); return a + (m && m[1] === nm ? +m[2] : 0); }, 0);
/* ---------- mani di esempio ----------
   Un tavolo 6-max NL10 inventato: cinque avversari e un Hero che gioca quasi come le tabelle, ma con qualche leak voluto
   (open larghi da UTG, BB che folda troppo, call ai 3-bet, limp con le coppie basse dallo SB, c-bet quasi sempre,
   troppi fold alla c-bet). Le mani escono come hand history PokerStars e passano dallo stesso lettore delle tue. */
function trkDemoText(N, chk) {
  let sd = 20260101; const rnd = () => { sd = (sd + 0x6D2B79F5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const NAMES = ["OrcaHero", "Delfino88", "SqualoBlu", "Medusa77", "PolpoRe", "Tonno99"], BB = 0.1, R = "23456789TJQKA", SU = "shdc";
  const m2 = v => "$" + (Math.round(v * 100) / 100).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  const tf = (id, k) => trkTabF(PRE_BY["m_" + id] || PRE_BY[id], k);
  const out = []; let t0 = new Date(2026, 8, 1, 20, 0).getTime();
  for (let hn = 0; hn < N; hn++) {
    if (hn % 250 === 0 && hn) t0 += 86400000 * (1 + Math.floor(rnd() * 2)) - 250 * 40000;
    t0 += 40000;
    const deck = []; for (const r of R) for (const s of SU) deck.push(r + s);
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    const btn = hn % 6, seat = i => (btn + i) % 6, P6 = ["BTN", "SB", "BB", "UTG", "HJ", "CO"];
    const pl = NAMES.map((nm, i) => ({ nm, seat: i + 1, pos: P6[(i - btn + 6) % 6], cards: [deck[i * 2], deck[i * 2 + 1]], st: 10, inv: 0, cur: 0, out: false }));
    const board = deck.slice(12, 17), L = [], d = new Date(t0), p2 = v => String(v).padStart(2, "0");
    L.push(`PokerStars Hand #${2600000000 + hn}:  Hold'em No Limit ($0.05/$0.10 USD) - ${d.getFullYear()}/${p2(d.getMonth() + 1)}/${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())} CET`);
    L.push(`Table 'Orca Demo' 6-max Seat #${btn + 1} is the button`);
    pl.forEach(p => L.push(`Seat ${p.seat}: ${p.nm} ($10 in chips)`));
    const by = ps => pl.find(p => p.pos === ps), bet = (p, to) => { const a = Math.min(to, p.cur + p.st) - p.cur; p.st -= a; p.inv += a; p.cur += a; return a; };
    const sb = by("SB"), bbp = by("BB"); bet(sb, 0.05); bet(bbp, 0.1);
    L.push(`${sb.nm}: posts small blind $0.05`, `${bbp.nm}: posts big blind $0.10`, "*** HOLE CARDS ***");
    const hero = pl[0]; L.push(`Dealt to ${hero.nm} [${hero.cards.join(" ")}]`);
    const key = p => trkKey(p.cards[0] + p.cards[1]), PK = { UTG: "ep", HJ: "mp", CO: "co", BTN: "btn", SB: "sb", BB: "bb" };
    /* preflop */
    let maxC = 0.1, nr = 0, opener = null, r3 = null, last = null; const order = ["UTG", "HJ", "CO", "BTN", "SB", "BB"].map(by);
    const decide = p => {
      const k = key(p), isH = p === hero, pk = PK[p.pos], r = rnd();
      if (nr === 0) { if (p.pos === "BB") return "x"; const F = tf("rfi_" + pk, k); let o = F.r;
        if (isH && pk === "ep" && /^(K[2-9T]s|Q[5-9]s|J[7-8]s|A[2-9]o|KTo|QTo|JTo)$/.test(k)) o = 1;
        if (isH && pk === "sb" && F.r < 0.5 && /^(\d\d|[2-9TJQK][2-9T]s|[KQJ][2-9]o)$/.test(k) && r < 0.4) return "c";
        if (!isH) o = Math.min(1, o + (p.nm === "Medusa77" ? 0.25 : 0.03));
        return r < o ? "r" : "f"; }
      if (nr === 1) { const ok = PK[opener.pos];
        if (pk === "bb") { const F = tf("bb_" + ok, k); if (isH) { if (F.r > 0.5) return "r"; return F.c > 0.5 && r < 0.55 ? "c" : "f"; } return r < F.r ? "r" : r < F.r + F.c + (p.nm === "Medusa77" ? 0.2 : 0) ? "c" : "f"; }
        const sp = PRE_BY["m_" + pk + "_" + ok]; const F = sp ? trkTabF(sp, k) : { f: 1, c: 0, r: 0 };
        if (!isH && p.nm === "Medusa77" && F.f > 0.5 && /^[AKQJT]|\d\d$/.test(k) && r < 0.3) return "c";
        return r < F.r ? "r" : "f"; }
      if (nr === 2 && p === opener) { const sp = PRE_BY["m_" + PK[p.pos] + "_vs_" + PK[r3.pos] + "3"]; const F = sp ? trkTabF(sp, k) : { f: 0.7, c: 0.2, r: 0.1 };
        if (isH && F.f > 0.5 && /^(A[2-9TJ]o|K[TJQ]o|QJo|[2-9]{2}|A[2-9]s)$/.test(k)) return "c";
        return F.r > 0.5 ? "r" : r < F.c + F.r ? "c" : "f"; }
      if (nr >= 2) { const s = /^(AA|KK|QQ|AKs)$/.test(k); if (nr === 3 && p === r3) return s ? "c" : /^(JJ|AKo|TT)$/.test(k) ? "c" : "f"; return s && nr === 2 ? "r" : "f"; }
      return "f";
    };
    let q = [...order], acted = new Set(), guard = 0;
    while (q.length && guard++ < 30) {
      const p = q.shift(); if (p.out || p.st <= 0) continue;
      if (acted.has(p) && p.cur >= maxC) continue;
      let a = decide(p); if (a === "x" && p.cur < maxC) a = "f"; if (a === "c" && p.cur >= maxC) a = "x";
      acted.add(p);
      if (a === "f") { p.out = true; L.push(`${p.nm}: folds`); }
      else if (a === "x") L.push(`${p.nm}: checks`);
      else if (a === "c") { const x = bet(p, maxC); L.push(`${p.nm}: calls ${m2(x)}`); }
      else { const ip = !["SB", "BB"].includes(p.pos); const to = nr === 0 ? (p.pos === "SB" ? 0.3 : 0.25) : nr === 1 ? (ip ? maxC * 3 : maxC * 4) : nr === 2 ? 2.2 : 10; const prev = maxC; bet(p, to); maxC = p.cur; nr++; if (nr === 1) opener = p; if (nr === 2) r3 = p; last = p;
        L.push(`${p.nm}: raises ${m2(maxC - prev)} to ${m2(maxC)}`); q = [...order.slice(order.indexOf(p) + 1), ...order.slice(0, order.indexOf(p))].filter(o => !o.out && o !== p); }
      const live = pl.filter(o => !o.out); if (live.length === 1) break;
    }
    const finish = () => { const live = pl.filter(o => !o.out);
      if (live.length === 1) { const w = live[0], mx2 = Math.max(...pl.filter(o => o !== w).map(o => o.cur)); if (w.cur > mx2) { const back = w.cur - mx2; w.cur -= back; w.inv -= back; w.st += back; L.push(`Uncalled bet (${m2(back)}) returned to ${w.nm}`); }
        const pot = pl.reduce((s, o) => s + o.inv, 0), rake = sawFlop ? Math.min(0.3, Math.floor(pot * 0.05 * 100) / 100) : 0; L.push(`${w.nm} collected ${m2(pot - rake)} from pot`); L.push("*** SUMMARY ***", `Total pot ${m2(pot)} | Rake ${m2(rake)}`); return true; }
      return false; };
    let sawFlop = false;
    if (finish()) { out.push(L.join("\n")); if (chk) chk.push([2600000000 + hn, Math.round((trkCollected(L, hero.nm) - hero.inv) / BB * 100) / 100]); continue; }
    sawFlop = true;
    /* postflop: forza della mano con il motore della scuola */
    const strength = (p, n) => { const bd = board.slice(0, n), v = djEval(djCs([...p.cards, ...bd].join(""))), bv = djEval(djCs(bd.join(""))), c = djCat(v), bc = djCat(bv);
      if (c >= 2 && c > bc) return 3; if (c === 1 && bc === 0) { const pr = Math.floor(v / 4096) % 16, top = Math.max(...bd.map(x => R.indexOf(x[0]))); return pr >= top ? 2 : 1; }
      const fl = SU.split("").some(s => [...p.cards, ...bd].filter(x => x[1] === s).length === 4 && p.cards.some(x => x[1] === s)); return fl && n < 5 ? 1 : 0; };
    const SN = ["FLOP", "TURN", "RIVER"], postOrd = ["SB", "BB", "UTG", "HJ", "CO", "BTN"];
    let aggr = last;
    for (let s = 0; s < 3; s++) {
      const n = 3 + s; pl.forEach(o => { o.cur = 0; }); maxC = 0;
      L.push(s === 0 ? `*** FLOP *** [${board.slice(0, 3).join(" ")}]` : `*** ${SN[s]} *** [${board.slice(0, n - 1).join(" ")}] [${board[n - 1]}]`);
      const live = postOrd.map(by).filter(o => !o.out); let qq = [...live], did = new Set(), better = null, raises = 0, g2 = 0;
      while (qq.length && g2++ < 20) {
        const p = qq.shift(); if (p.out || p.st <= 0) continue; if (did.has(p) && p.cur >= maxC) continue; did.add(p);
        const st = strength(p, n), r = rnd(), isH = p === hero, pot = pl.reduce((a, o) => a + o.inv, 0);
        let a;
        if (maxC === 0) { if (p === aggr) a = isH ? (r < (s === 0 ? 0.9 : s === 1 ? 0.45 : 0.4) || st >= 2 ? "b" : "x") : (r < (s === 0 ? 0.6 : 0.45) || st >= 2 ? "b" : "x"); else a = st >= 3 && r < 0.4 ? "b" : "x"; }
        else { const big = maxC > pot * 0.6; if (st >= 3) a = r < 0.3 && raises === 0 ? "r" : "c"; else if (st === 2) a = r < (big ? 0.7 : 0.9) ? "c" : "f"; else if (st === 1) a = isH ? (r < (s === 2 ? 0.75 : 0.65) ? "c" : "f") : (r < (big ? 0.35 : 0.6) ? "c" : "f"); else a = isH ? (s === 0 && r < 0.12 ? "c" : "f") : (r < 0.25 ? "c" : r < 0.3 && raises === 0 ? "r" : "f"); }
        if (a === "x") L.push(`${p.nm}: checks`);
        else if (a === "f") { p.out = true; L.push(`${p.nm}: folds`); }
        else if (a === "c") { const x = bet(p, maxC); L.push(`${p.nm}: calls ${m2(x)}${p.st <= 0 ? " and is all-in" : ""}`); }
        else if (a === "b") { const amt = Math.max(0.1, Math.round(pot * (s === 0 ? 0.4 : 0.6) * 100) / 100); bet(p, amt); maxC = p.cur; better = p; aggr = p; L.push(`${p.nm}: bets ${m2(p.cur)}${p.st <= 0 ? " and is all-in" : ""}`); qq = live.filter(o => o !== p && !o.out); qq = [...qq.filter(o => postOrd.indexOf(o.pos) > postOrd.indexOf(p.pos)), ...qq.filter(o => postOrd.indexOf(o.pos) < postOrd.indexOf(p.pos))]; did = new Set([p]); }
        else { const prev = maxC; bet(p, maxC * 3); maxC = p.cur; raises++; aggr = p; L.push(`${p.nm}: raises ${m2(maxC - prev)} to ${m2(maxC)}${p.st <= 0 ? " and is all-in" : ""}`); qq = live.filter(o => o !== p && !o.out); qq = [...qq.filter(o => postOrd.indexOf(o.pos) > postOrd.indexOf(p.pos)), ...qq.filter(o => postOrd.indexOf(o.pos) < postOrd.indexOf(p.pos))]; did = new Set([p]); }
        if (pl.filter(o => !o.out).length === 1) break;
      }
      void better;
      if (pl.filter(o => !o.out).length === 1) break;
    }
    if (finish()) { out.push(L.join("\n")); if (chk) chk.push([2600000000 + hn, Math.round((trkCollected(L, hero.nm) - hero.inv) / BB * 100) / 100]); continue; }
    /* showdown */
    L.push("*** SHOW DOWN ***");
    const live = pl.filter(o => !o.out), val = o => djEval(djCs([...o.cards, ...board].join("")));
    { const s2 = [...live].sort((a, b) => b.inv - a.inv), back = s2[0].inv - s2[1].inv; if (back > 0.001) { s2[0].inv -= back; L.splice(L.length - 1, 0, `Uncalled bet (${m2(back)}) returned to ${s2[0].nm}`); } }
    live.forEach(o => L.push(`${o.nm}: shows [${o.cards.join(" ")}]`));
    const best = Math.max(...live.map(val)), win = live.filter(o => val(o) === best);
    const pot = pl.reduce((s, o) => s + o.inv, 0), rake = Math.min(0.3, Math.floor(pot * 0.05 * 100) / 100), share = Math.floor((pot - rake) / win.length * 100) / 100;
    win.forEach(o => L.push(`${o.nm} collected ${m2(share)} from pot`));
    L.push("*** SUMMARY ***", `Total pot ${m2(pot)} | Rake ${m2(rake)}`);
    out.push(L.join("\n")); if (chk) chk.push([2600000000 + hn, Math.round((trkCollected(L, hero.nm) - hero.inv) / BB * 100) / 100]);
  }
  return out.join("\n\n\n");
}
