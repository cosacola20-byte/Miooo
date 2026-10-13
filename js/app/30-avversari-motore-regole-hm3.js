/* ================= AVVERSARI: motore regole HM3 (spec v1.0) ================= */
const OPP_K = 0.12; // tarato sui 16 giocatori di riferimento (dati parziali): 12/16 entro ±1
/* stat: [chiave, etichetta, lo, hi, s, direzione, lato aggressivo, peso, dimensione] */
const OPP_T = [
  ["vpip", "VPIP", 20, 27, 4, "entrambe", null, 4, "pre"],
  ["pfr", "PFR", 16, 22, 3, "entrambe", "alto", 2, "pre"],
  ["gap", "Gap VPIP-PFR", 2, 6, 3, "alto", null, 3, "pre"],
  ["wtsd", "WTSD", 25, 30, 3, "entrambe", null, 3, "sd"],
  ["wsd", "W$SD", 49, 55, 3, "basso", null, 4, "sd"],
  ["aggr", "Aggr Freq totale", 30, 40, 5, "entrambe", "alto", 2, "att"],
  ["open_ep", "Open EP", 16, 22, 3, "entrambe", "alto", 1, "pre"],
  ["open_mp", "Open MP", 20, 26, 3, "entrambe", "alto", 1, "pre"],
  ["open_co", "Open CO", 27, 33, 3, "entrambe", "alto", 1, "pre"],
  ["open_btn", "Open BTN", 39, 47, 4, "entrambe", "alto", 1, "pre"],
  ["open_sb", "Open SB", 39, 49, 4, "entrambe", "alto", 1, "pre"],
  ["limp", "Limp", 0, 4, 4, "alto", null, 3, "pre"],
  ["threebet", "3bet", 5, 10, 3, "entrambe", "alto", 2, "pre"],
  ["fold3b", "Fold vs 3bet", 40, 52, 5, "entrambe", null, 2, "pre"],
  ["fourbet", "4bet", 2, 5, 2, "entrambe", "alto", 1, "pre"],
  ["fold4b", "Fold vs 4bet", 40, 57, 8, "entrambe", null, 1, "pre"],
  ["squeeze", "Squeeze", 4, 9, 3, "entrambe", "alto", 1, "pre"],
  ["foldsq", "Fold vs squeeze", 40, 57, 8, "entrambe", null, 1, "pre"],
  ["bb_btn", "Fold BB vs BTN", 40, 52, 7, "entrambe", null, 3, "blind"],
  ["bvb", "Fold BvB (BB vs SB)", 35, 47, 7, "entrambe", null, 2, "blind"],
  ["sb_steal", "Fold SB vs steal", 52, 68, 8, "entrambe", null, 1, "blind"],
  ["cb_flop", "CB flop", 55, 70, 7, "entrambe", "alto", 2, "att"],
  ["cb_turn", "CB turn", 45, 60, 7, "entrambe", "alto", 2, "att"],
  ["cb_river", "CB river", 30, 45, 7, "entrambe", "alto", 1, "att"],
  ["cb_mw", "CB multiway (vs 2)", 30, 52, 8, "entrambe", "alto", 1, "att"],
  ["raise_cb", "Raise cbet (IP+OOP)", 7, 15, 5, "entrambe", "alto", 1, "att"],
  ["cr_flop", "Check-raise flop", 6, 13, 4, "entrambe", "alto", 1, "att"],
  ["donk", "Donk bet flop", 0, 8, 5, "alto", "alto", 1, "att"],
  ["bvm", "Bet vs missed cbet", 30, 50, 10, "entrambe", "alto", 1, "att"],
  ["riverbet", "Riverbet%", 28, 42, 7, "entrambe", "alto", 1, "sd"],
  ["wsd_river", "W$SD B River", 48, 68, 8, "entrambe", null, 1, "sd"],
  ["fold_cb_flop", "Fold vs CB flop", 40, 50, 6, "entrambe", null, 3, "def"],
  ["fold_cb_turn", "Fold vs CB turn", 40, 50, 7, "entrambe", null, 2, "def"],
  ["fold_cb_river", "Fold vs CB river", 45, 55, 8, "entrambe", null, 1, "def"],
  ["cf_flop", "Check-fold flop", 45, 57, 6, "entrambe", null, 2, "def"],
  ["cf_turn", "Check-fold turn", 45, 57, 6, "entrambe", null, 2, "def"],
  ["cf_river", "Check-fold river", 45, 58, 7, "entrambe", null, 1, "def"],
  ["skip_cf", "Skip CB + fold", 45, 56, 6, "entrambe", null, 1, "def"],
  ["fold_cr", "Fold vs check-raise", 40, 55, 8, "entrambe", null, 2, "def"],
  ["cb_fold", "Fold vs raise cbet (cb-fold)", 35, 47, 8, "entrambe", null, 1, "def"],
  ["fold_rb", "Fold river bet", 45, 57, 8, "entrambe", null, 2, "sd"],
];
const OPP_TBY = Object.fromEntries(OPP_T.map(r => [r[0], r]));
const OPP_DIM = { pre: "Preflop", blind: "Blind", att: "Postflop attacco", def: "Postflop difesa", sd: "Showdown/river" };
const OPP_LP = { 0: 0, 1: 1, 2: 2, 3: 4 };

/* ---------- parsing ---------- */
/* "39 (23/59)" -> {value:39,n:23,tot:59}; "55" -> {value:55,n:null,tot:null}; "-" o "" -> null */
function oppCell(s) {
  if (s == null) return null;
  if (typeof s === "number") return { value: s, n: null, tot: null };
  if (typeof s === "object") return s.value == null ? null : { value: +s.value, n: s.n == null ? null : +s.n, tot: s.tot == null ? null : +s.tot };
  const t = String(s).trim().replace(",", ".");
  if (!t || t === "-" || t === "—") return null;
  const m = t.match(/^(-?\d+(?:\.\d+)?)\s*%?\s*(?:\(\s*(\d+)\s*\/\s*(\d+)\s*\))?$/);
  if (!m) return { value: NaN, n: null, tot: null, raw: t };
  return { value: +m[1], n: m[2] == null ? null : +m[2], tot: m[3] == null ? null : +m[3] };
}
const oppFmtCell = c => c == null ? "" : `${c.value}${c.tot != null ? ` (${c.n}/${c.tot})` : ""}`;
/* riga HUD -> gruppi di numeri separati da "/" */
function oppRow(s) {
  if (s == null || !String(s).trim()) return null;
  const groups = String(s).replace(/,/g, ".").split("/").map(g => g.trim().split(/\s+/).filter(Boolean));
  const vals = groups.flat().map(x => x === "-" ? null : +x);
  return { groups: groups.map(g => g.length), vals, bad: vals.some(v => v !== null && Number.isNaN(v)) };
}
const OPP_ROWS = [
  { n: 4, g: [3, 1], k: ["hands", "vpip", "pfr", "wtsd"], lab: "Mani, VPIP, PFR / WTSD" },
  { n: 6, g: [5, 1], k: ["open_ep", "open_mp", "open_co", "open_btn", "open_sb", "last"], lab: "Open EP, MP, CO, BTN, SB / Aggr Freq (o AF)" },
  { n: 6, g: [3, 3], k: ["cb_flop", "cb_turn", "cb_river", "fold_cb_flop", "fold_cb_turn", "fold_cb_river"], lab: "CB flop, turn, river / Fold vs CB flop, turn, river" },
  { n: 6, g: [2, 2, 2], k: ["threebet", "fold_vs_3bet", "fourbet", "fold_vs_4bet", "squeeze", "fold_vs_squeeze"], lab: "3bet, Fold vs 3bet / 4bet, Fold vs 4bet / Squeeze, Fold vs squeeze" },
  { n: 6, g: [2, 2, 1, 1], k: ["cr", "fold_vs_cr", "limp", "limp_fold", "donk_flop", "skip_cb_fold"], lab: "C/R, Fold vs C/R / Limp, Limp-fold / Donk flop / Skip CB + fold" },
  { n: 5, g: [1, 4], k: ["fold_to_steal", "fold_bvb", "fold_sb_vs_hero", "fold_bb_vs_btn", "fold_bb_vs_btn_hero"], lab: "Fold to steal / BvB, SB vs hero, BB vs BTN, BB vs BTN di hero" },
];
/* ---------- validazione (sezione 6) ---------- */
function oppValidate(D) {
  const iss = []; // {lvl:"err"|"doubt", f, msg}
  const E = (f, msg) => iss.push({ lvl: "err", f, msg }), Q = (f, msg) => iss.push({ lvl: "doubt", f, msg });
  const hud = {};
  if (!D.name || !String(D.name).trim()) E("name", "Manca il nome del giocatore (lo prendo dall'header del profilo).");
  (D.rows || []).forEach((raw, i) => {
    const R = OPP_ROWS[i], r = oppRow(raw);
    if (!r) { E("row" + (i + 1), `Riga ${i + 1} dell'HUD mancante. Attesi ${R.n} valori: ${R.lab}.`); return; }
    if (r.bad) { E("row" + (i + 1), `Riga ${i + 1}: c'è un valore che non è un numero ("${raw}").`); return; }
    if (r.vals.length !== R.n) { E("row" + (i + 1), `Riga ${i + 1}: leggo ${r.vals.length} valori (${raw}) ma ne attendo ${R.n}. Mi confermi i valori in ordine ${R.lab}?`); return; }
    if (r.groups.length > 1 && r.groups.join(",") !== R.g.join(",")) Q("row" + (i + 1), `Riga ${i + 1}: i gruppi separati da "/" sono ${r.groups.join("-")}, attesi ${R.g.join("-")}. Controlla che i valori siano nell'ordine giusto: ${R.lab}.`);
    R.k.forEach((k, j) => hud[k] = r.vals[j]);
  });
  if ((D.rows || []).length < 6) for (let i = (D.rows || []).length; i < 6; i++) E("row" + (i + 1), `Riga ${i + 1} dell'HUD mancante.`);
  // versione HUD
  let version = null;
  if (hud.last != null) version = hud.last < 8 ? "af" : hud.last >= 10 ? "aggr_freq" : null;
  if (hud.last != null && version == null) Q("row2", `Riga 2: l'ultimo valore (${hud.last}) è tra 8 e 10, non capisco se è AF o Aggr Freq. Confermalo con il pop-up Aggression.`);
  const H = D.header || {}, C = D.cbet || {}, A = D.aggr || {}, B = D.tb || {};
  const hands = +H.hands || hud.hands || null;
  const cells = [];
  const eachCell = (obj, path) => Object.entries(obj || {}).forEach(([k, v]) => { if (k === "detail" || k === "his_pos" || k === "vs" || k === "name_short") return; const p = path + "." + k; if (v && typeof v === "object" && !("value" in v)) eachCell(v, p); else cells.push([p, oppCell(v)]); });
  eachCell(H, "header"); eachCell(C, "cbet"); eachCell(A, "aggr"); eachCell(B, "tb");
  cells.forEach(([p, c]) => {
    if (!c) return;
    if (Number.isNaN(c.value)) { E(p, `${oppFieldName(p)}: formato non valido ("${c.raw}"). Scrivi ad esempio 39 (23/59).`); return; }
    if (c.tot != null) {
      if (c.n > c.tot) E(p, `${oppFieldName(p)}: ${c.n}/${c.tot}, il numeratore supera il totale.`);
      else if (c.tot > 0 && Math.abs(100 * c.n / c.tot - c.value) > 1.01 && !/af\b|af\./.test(p)) E(p, `${oppFieldName(p)}: leggo ${c.value} (${c.n}/${c.tot}), ma ${c.n}/${c.tot} fa ${Math.round(100 * c.n / c.tot)}%. Forse il ${c.value} è il numeratore o una cifra è letta male: mi confermi la cella?`);
    }
  });
  if (!(+H.hands > 0) && !hud.hands) E("header.hands", "Mancano le mani totali (header Hands).");
  const wsd = oppCell(H.wsd), wsdr = oppCell(H.wsd_river_bet);
  if (!wsd) E("header.wsd", "Manca il W$SD (header): serve per la catena di showdown.");
  if (!wsdr) E("header.wsd_river_bet", "Manca il W$SD B River (header): serve per leggere le sue river bet.");
  // cross-check 6.2
  const near = (a, b, t) => a == null || b == null || Math.abs(a - b) <= t;
  const cv = x => { const c = oppCell(x); return c ? c.value : null; };
  if (H.hands && hud.hands != null && +H.hands !== hud.hands) Q("row1", `Mani: riga 1 dice ${hud.hands}, l'header ${H.hands}. Quale è giusto?`);
  const wt = cv(H.wtsd), wtp = C.wtsd != null ? +C.wtsd : null;
  if (!near(hud.wtsd, wt, 1)) Q("row1", `WTSD: riga 1 ${hud.wtsd}, header ${wt}. Rileggi la cifra.`);
  if (!near(hud.wtsd, wtp, 1)) Q("cbet.wtsd", `WTSD: riga 1 ${hud.wtsd}, pop-up CBET ${wtp}.`);
  const aft = A.agg_freq ? cv(A.agg_freq.total) : null;
  if (version === "aggr_freq" && !near(hud.last, aft, 1)) Q("row2", `Aggr Freq: riga 2 ${hud.last}, pop-up Aggression ${aft}.`);
  if (version === "af" && A.af && cv(A.af.total) != null && Math.abs(cv(A.af.total) - hud.last) > 0.5) Q("row2", `AF: riga 2 ${hud.last}, pop-up Aggression ${cv(A.af.total)}.`);
  ["flop", "turn", "river"].forEach((s, i) => {
    const cg = C.cb_general && cv(C.cb_general[s]), fc = C.fold_cb && cv(C.fold_cb[s]);
    if (!near(hud[["cb_flop", "cb_turn", "cb_river"][i]], cg, 1)) Q("row3", `CB ${s}: riga 3 ${hud[["cb_flop", "cb_turn", "cb_river"][i]]}, pop-up ${cg}.`);
    if (!near(hud[["fold_cb_flop", "fold_cb_turn", "fold_cb_river"][i]], fc, 1)) Q("row3", `Fold vs CB ${s}: riga 3 ${hud[["fold_cb_flop", "fold_cb_turn", "fold_cb_river"][i]]}, pop-up ${fc}.`);
  });
  if (B.by_pos && !near(hud.threebet, cv(B.by_pos.total), 1)) Q("row4", `3bet: riga 4 ${hud.threebet}, pop-up 3Bet ${cv(B.by_pos.total)}.`);
  if (B.vs_4bet && !near(hud.fold_vs_4bet, cv(B.vs_4bet.total_fold), 1)) Q("row4", `Fold vs 4bet: riga 4 ${hud.fold_vs_4bet}, pop-up VS 4BET ${cv(B.vs_4bet.total_fold)}.`);
  if (A.check_raise && !near(hud.cr, cv(A.check_raise.flop), 1)) Q("row5", `Check-raise: riga 5 ${hud.cr}, pop-up Aggression flop ${cv(A.check_raise.flop)}.`);
  const fcf = C.fold_cb && oppCell(C.fold_cb.flop), fip = C.grid && C.grid.fold_to_cbet && oppCell(C.grid.fold_to_cbet.flop_ip), fop = C.grid && C.grid.fold_to_cbet && oppCell(C.grid.fold_to_cbet.flop_oop);
  if (fcf && fip && fop && fcf.tot != null && fip.tot != null && fop.tot != null && fcf.tot !== fip.tot + fop.tot) Q("cbet.fold_cb.flop", `FOLD CB flop: totale ${fcf.tot}, ma FlopIP + FlopOOP fanno ${fip.tot + fop.tot}. Una cella è letta male.`);
  ["flop", "turn", "river"].forEach(s => { const a = C.check_fold && oppCell(C.check_fold[s]), b = A.check_raise && oppCell(A.check_raise[s]); if (a && b && a.tot != null && b.tot != null && Math.abs(a.tot - b.tot) > 2) Q("cbet.check_fold." + s, `Check fold ${s}: totale ${a.tot}, check-raise ${s}: totale ${b.tot}. Dovrebbero coincidere (±2).`); });
  // plausibilità 6.3
  const P = k => hud[k];
  if (P("pfr") != null && P("vpip") != null && P("pfr") > P("vpip")) E("row1", `PFR (${P("pfr")}) maggiore del VPIP (${P("vpip")}): rileggi la riga 1.`);
  if (P("threebet") != null && P("pfr") != null && P("threebet") > P("pfr")) E("row4", `3bet (${P("threebet")}) maggiore del PFR (${P("pfr")}): rileggi.`);
  Object.entries(hud).forEach(([k, v]) => { if (k !== "hands" && k !== "last" && v != null && (v < 0 || v > 100)) E("hud." + k, `${k}: ${v} è fuori da 0-100.`); });
  if (P("fold_bb_vs_btn") != null && P("fold_to_steal") != null && Math.abs(P("fold_bb_vs_btn") - P("fold_to_steal")) > 25) Q("row6", `Fold BB vs BTN ${P("fold_bb_vs_btn")} contro fold to steal ${P("fold_to_steal")}: oltre 25 punti di differenza. Rileggi la cifra (26 e 56 si confondono).`);
  const gap = P("vpip") - P("pfr");
  if (gap < 8 && (P("donk_flop") > 20 || P("limp") > 15)) Q("row5", `Riga 5: donk ${P("donk_flop")}% o limp ${P("limp")}% troppo alti per un gap VPIP-PFR di ${gap}. Probabile mappatura sbagliata: rileggi la riga 5 (6 valori).`);
  if (P("fold_bb_vs_btn") != null && P("fold_bb_vs_btn_hero") != null && Math.abs(P("fold_bb_vs_btn") - P("fold_bb_vs_btn_hero")) > 30) Q("row6", `Fold BB vs BTN ${P("fold_bb_vs_btn")} e vs hero ${P("fold_bb_vs_btn_hero")}: oltre 30 punti. Controlla la lettura.`);
  (D.flags || []).forEach(f => Q(f.field, `${oppFieldName(f.field)}: ${f.reason}. Rileggi e conferma.`));
  return { issues: iss, hud, version, hands };
}
function oppFieldName(p) {
  const L = { "header.wsd": "W$SD", "header.wsd_river_bet": "W$SD B River", "header.wtsd": "WTSD (header)", "header.hands": "Mani", "header.winrate_ev": "Winrate EV" };
  if (L[p]) return L[p];
  if (/^row\d/.test(p)) return "Riga " + p.slice(3);
  return p.replace(/^(cbet|aggr|tb|header|hud)\./, m => ({ "cbet.": "CBET ", "aggr.": "Aggression ", "tb.": "3Bet ", "header.": "Header ", "hud.": "HUD " })[m]).replace(/[._]/g, " ");
}
/* ---------- statistiche per il voto ---------- */
function oppAgg(...cs) { cs = cs.filter(c => c && c.tot != null); if (!cs.length) return null; const n = cs.reduce((a, c) => a + c.n, 0), t = cs.reduce((a, c) => a + c.tot, 0); return t ? { value: Math.round(100 * n / t), n, tot: t } : null; }
function oppStats(D, V) {
  const hud = V.hud, H = D.header || {}, C = D.cbet || {}, A = D.aggr || {}, B = D.tb || {}, G = C.grid || {};
  const hands = V.hands || 0;
  const c = x => oppCell(x), g = (o, ...ks) => { let x = o; for (const k of ks) { if (!x) return null; x = x[k]; } return c(x); };
  const hudv = (v, extra) => v == null ? null : { value: v, n: null, tot: null, src: "hud", ...extra };
  const S = {};
  S.vpip = hudv(hud.vpip); S.pfr = hudv(hud.pfr);
  S.gap = hud.vpip != null && hud.pfr != null ? hudv(Math.round((hud.vpip - hud.pfr) * 10) / 10) : null;
  S.wtsd = g(H, "wtsd") || hudv(hud.wtsd);
  S.wsd = g(H, "wsd");
  S.aggr = g(A, "agg_freq", "total") ? { ...g(A, "agg_freq", "total"), tot: null, n: null } : V.version === "aggr_freq" ? hudv(hud.last) : null;
  ["ep", "mp", "co", "btn", "sb"].forEach(p => S["open_" + p] = hudv(hud["open_" + p]));
  S.limp = hudv(hud.limp);
  S.threebet = hudv(hud.threebet);
  S.fold3b = hud.fold_vs_3bet == null ? null : { value: hud.fold_vs_3bet, n: null, tot: Math.round(hands * (hud.pfr || 0) / 100 * 0.11), est: true };
  S.fourbet = hudv(hud.fourbet);
  S.fold4b = g(B, "vs_4bet", "total_fold") && g(B, "vs_4bet", "total_fold").tot != null ? g(B, "vs_4bet", "total_fold") : hud.fold_vs_4bet == null ? null : { value: hud.fold_vs_4bet, n: null, tot: Math.round(hands * (hud.threebet || 0) / 100 * 0.055), est: true };
  S.squeeze = g(B, "squeeze", "total") || hudv(hud.squeeze);
  S.foldsq = hud.fold_vs_squeeze == null ? null : { value: hud.fold_vs_squeeze, n: null, tot: Math.round(hands * 0.008), est: true };
  S.bb_btn = hudv(hud.fold_bb_vs_btn); S.bvb = hudv(hud.fold_bvb); S.sb_steal = null;
  S.cb_flop = g(C, "cb_general", "flop") || hudv(hud.cb_flop);
  S.cb_turn = g(C, "cb_general", "turn") || hudv(hud.cb_turn);
  S.cb_river = g(C, "cb_general", "river") || hudv(hud.cb_river);
  S.cb_mw = g(C, "cb_vs_2");
  S.raise_cb = oppAgg(g(G, "raise_cbet", "flop_ip"), g(G, "raise_cbet", "flop_oop"));
  S.cr_flop = g(A, "check_raise", "flop") || hudv(hud.cr);
  S.donk = hudv(hud.donk_flop);
  S.bvm = g(C, "bet_vs_missed", "flop") || oppAgg(g(C, "bet_vs_missed", "turn_ip"), g(C, "bet_vs_missed", "turn_oop"));
  S.riverbet = g(C, "riverbet_pct") || g(C, "river_bet_srp");
  S.wsd_river = g(H, "wsd_river_bet");
  S.fold_cb_flop = g(C, "fold_cb", "flop") || hudv(hud.fold_cb_flop);
  // turn e river: solo con il denominatore del pop-up (sezione 3)
  S.fold_cb_turn = g(C, "fold_cb", "turn") || (hud.fold_cb_turn == null ? null : { value: hud.fold_cb_turn, n: null, tot: 0, nodenom: true });
  S.fold_cb_river = g(C, "fold_cb", "river") || (hud.fold_cb_river == null ? null : { value: hud.fold_cb_river, n: null, tot: 0, nodenom: true });
  S.cf_flop = g(C, "check_fold", "flop"); S.cf_turn = g(C, "check_fold", "turn"); S.cf_river = g(C, "check_fold", "river");
  S.skip_cf = hudv(hud.skip_cb_fold);
  S.fold_cr = hudv(hud.fold_vs_cr);
  S.cb_fold = oppAgg(g(G, "cb_fold", "flop_ip"), g(G, "cb_fold", "flop_oop")) || g(C, "fold_vs_raise_cb");
  S.fold_rb = g(C, "fold_river_bet");
  Object.keys(S).forEach(k => { if (S[k] && (S[k].value == null || Number.isNaN(S[k].value))) S[k] = null; });
  return S;
}
function oppConf(st, hands) {
  if (!st) return 0;
  if (st.nodenom) return 0;
  if (st.tot == null) return hands >= 1000 ? 1 : 0.6;
  const t = st.tot; let c = t >= 100 ? 1 : t >= 50 ? 0.8 : t >= 30 ? 0.6 : t >= 20 ? 0.4 : 0;
  return st.est ? Math.min(c, 0.6) : c;
}
function oppDev(v, lo, hi, dir) {
  if (v < lo && (dir === "entrambe" || dir === "basso")) return [lo - v, "basso"];
  if (v > hi && (dir === "entrambe" || dir === "alto")) return [v - hi, "alto"];
  return [0, null];
}
const oppLvl = (d, s) => d === 0 ? 0 : d <= s ? 1 : d <= 2 * s ? 2 : 3;
/* ---------- voto (sezione 11) ---------- */
function oppScore(D, V, S, k) {
  k = k || OPP_K;
  const hands = V.hands || 0;
  const rows = []; let P = 0; const dimP = { pre: 0, blind: 0, att: 0, def: 0, sd: 0 };
  OPP_T.forEach(([key, lab, lo, hi, s, dir, aggr, w, dim]) => {
    const st = S[key]; if (!st) return;
    const [d, side] = oppDev(st.value, lo, hi, dir), lvl = oppLvl(d, s);
    let pts = OPP_LP[lvl]; if (side && side === aggr) pts *= 0.5;
    const conf = oppConf(st, hands), pen = pts * w * conf;
    P += pen; dimP[dim] += pen;
    rows.push({ key, lab, v: st.value, n: st.n, tot: st.tot, est: !!st.est, nodenom: !!st.nodenom, lo, hi, d, side, lvl, w, conf, pen, dim });
  });
  const tech = 10 - k * P;
  const wr = +((D.header || {}).winrate_ev);
  let wadj = 0;
  if (!Number.isNaN(wr) && (D.header || {}).winrate_ev !== "" && (D.header || {}).winrate_ev != null) {
    if (hands >= 3000 && hands < 6000) wadj = wr >= 10 ? 0.5 : wr <= -10 ? -0.5 : 0;
    else if (hands >= 6000) wadj = wr >= 10 ? 1 : wr >= 5 ? 0.5 : wr <= -10 ? -1 : wr <= -5 ? -0.5 : 0;
  }
  return { rows, P, dimP, tech, wadj, k };
}
function oppFinal(sc, S, V, rev) {
  rev = Math.max(-1, Math.min(1, +rev || 0));
  let v = sc.tech + sc.wadj + rev;
  const caps = [];
  const vp = S.vpip ? S.vpip.value : 0, lp = S.limp ? S.limp.value : 0, gp = S.gap ? S.gap.value : 0;
  const cap = (m, why) => { if (v > m) { v = m; caps.push(`${why}: massimo ${m}`); } };
  if (vp >= 50 || lp >= 20) cap(2, `VPIP ${vp} / limp ${lp}`);
  if (vp >= 35 || gp >= 12 || lp >= 10) cap(3.5, `VPIP ${vp}, gap ${gp}, limp ${lp}`);
  if (S.wtsd && S.wsd && S.wtsd.value >= 33 && S.wsd.value <= 46 && (S.wsd.tot || 0) >= 100) cap(3.5, `calling station perdente (WTSD ${S.wtsd.value}, W$SD ${S.wsd.value})`);
  const heavy = sc.rows.some(r => r.w >= 2 && r.lvl >= 2 && r.conf > 0);
  if (v > 8.5 && ((V.hands || 0) < 5000 || heavy)) cap(8.5, "sopra 8,5 servono 5000+ mani e nessuna stat pesante a livello 2");
  v = Math.max(1, Math.min(10, v));
  v = Math.round(v * 2) / 2;
  const h = V.hands || 0;
  let conf = h < 1500 ? 0 : h <= 4000 ? 1 : 2;
  const present = sc.rows.length, zero = sc.rows.filter(r => r.conf === 0).length;
  if (present && zero / present > 0.3) conf = Math.max(0, conf - 1);
  const band = v <= 2 ? "Megafish" : v < 4 ? "Fish / loose perdente" : v < 5.5 ? "Reg debole" : v < 7 ? "Reg medio" : v <= 8 ? "Reg solido" : "Reg forte / bilanciato";
  return { vote: v, rev, caps, band, conf: ["bassa", "media", "alta"][conf] };
}
/* ---------- nota deterministica (sezioni 9, 10, 12) ---------- */
function oppNote(D, V, S, sc) {
  const hands = V.hands || 0, R = Object.fromEntries(sc.rows.map(r => [r.key, r]));
  const cf = k => R[k] ? R[k].conf : 0;
  const v = k => S[k] ? S[k].value : null;
  const ok = (k, min) => S[k] && cf(k) >= (min == null ? 0.6 : min);
  const smp = k => { const s = S[k]; if (!s) return ""; if (s.tot != null && s.n != null && (cf(k) < 1 || s.tot < 100)) return ` (${s.n}/${s.tot})`; if (s.est && s.tot) return ` (~${s.tot} spot stimati)`; return ""; };
  const st = (k, lab) => `${lab || OPP_TBY[k][1]} ${fmtN(v(k))}%${smp(k)}`;
  const C = D.cbet || {}, A = D.aggr || {}, G = C.grid || {}, B = D.tb || {};
  const cell = (...p) => { let x = D; for (const k of p) { if (!x) return null; x = x[k]; } return oppCell(x); };
  const hud = V.hud;
  const pts = [], no = [], used = new Set(), combos = [], patterns = [];
  const add = (p, keys) => { pts.push(p); (keys || []).forEach(k => used.add(k)); };
  const lvl = k => R[k] ? R[k].lvl : 0;
  const fish = (v("vpip") || 0) > 35 || (v("gap") || 0) > 10 || (v("limp") || 0) > 10;
  // --- catena 9.1 / 9.2
  const wt = v("wtsd"), ws = v("wsd"), wr = ok("wsd_river", 0.6) ? v("wsd_river") : null, rb = v("riverbet");
  const wtH = wt != null && wt > 30, wtL = wt != null && wt < 25, wsH = ws != null && ws > 55, wsL = ws != null && ws < 49;
  if (wtH && wsL) add({ id: "station", prio: 30, title: "CALLING STATION", text: `WTSD ${wt} / W$SD ${ws}: arriva spesso allo showdown e perde. Value bet largo e sottile, niente bluff senza equity.` }, ["wtsd", "wsd"]);
  else if (wtH && wsH) { add({ id: "sdstrong", prio: 22, title: "ARRIVA ALLO SHOWDOWN FORTE", text: `WTSD ${wt} / W$SD ${ws}: non è una station, porta allo showdown un range forte. Riduci i bluff, value solo con mani solide.` }, ["wtsd", "wsd"]); }
  else if (wtL && wsH) add({ id: "selective", prio: 18, title: "SELETTIVO: FOLDA PRIMA", text: `WTSD ${wt} / W$SD ${ws}: arriva poco allo showdown ma con mani buone. I bluff funzionano di più, i value thin meno.` }, ["wtsd", "wsd"]);
  if (ws != null && ws > 55) no.push(`call down light (W$SD ${ws})`);
  if (wr != null) {
    const rbTxt = rb != null ? `, riverbet ${rb}%` : "";
    if (wr < 40) add({ id: "rivbluff", prio: 20, title: "LE SUE RIVER BET SONO LEGGERE", text: `W$SD B River ${wr}%${smp("wsd_river")}${rbTxt}: quando betta il river ha spesso bluff o thin value. Hero call più largo con bluff catcher decenti.` }, ["wsd_river", "riverbet"]);
    else if (wr > 55 || (rb != null && rb < 25)) add({ id: "rivvalue", prio: 16, title: "RIVER BET = VALUE", text: `W$SD B River ${wr}%${smp("wsd_river")}${rbTxt}: quando attacca il river è value. Folda i marginali, nessun hero call light.` }, ["wsd_river", "riverbet"]);
    if (wr > 58) no.push(`hero call sulle sue river bet (W$SD river ${wr})`);
    if (rb != null && rb > 42 && wr < 45) combos.push({ prio: 18, title: "CHIAMA FINO AL RIVER", text: `Betta tanto il river (${rb}%) e vince poco (W$SD river ${wr}%): chiama fino al river e fai hero call sulle sue river bet.` });
  }
  const rsrp = cell("cbet", "river_bet_srp");
  if (rsrp && rsrp.tot >= 30 && rsrp.value < 25) no.push(`pensare al bluff quando betta il river SRP (${rsrp.value}%): ha mano`);
  // --- preflop e blind
  const bbh = hud.fold_bb_vs_btn_hero, sbh = hud.fold_sb_vs_hero, fts = hud.fold_to_steal;
  if (ok("bb_btn") && v("bb_btn") > 60) {
    if (bbh != null && bbh <= 52) add({ id: "bbbtn", prio: 3 * (1 + lvl("bb_btn")), title: "BB: OVERFOLDA MA NON CONTRO DI TE", text: `Fold BB vs BTN ${v("bb_btn")}% in generale, solo ${bbh}% contro di te: ti ha letto. Da BTN gioca il tuo range standard contro di lui.` }, ["bb_btn"]);
    else add({ id: "bbbtn", prio: 3 * (1 + lvl("bb_btn")), title: "BB OVERFOLDA VS BTN", text: `Fold BB vs BTN ${v("bb_btn")}%${bbh != null ? ` (${bbh}% contro di te)` : ""}: apri qualsiasi mano da BTN quando è di BB.` }, ["bb_btn"]);
  }
  if (ok("bvb") && v("bvb") > 55) add({ id: "bvb", prio: 2 * (1 + lvl("bvb")), title: "BvB: OVERFOLDA", text: `Fold BB vs SB ${v("bvb")}%: apri largo da SB quando è di BB.` }, ["bvb"]);
  if (sbh != null && sbh > 70) add({ id: "sbh", prio: 3, title: "SB MOLLA I TUOI STEAL", text: `Folda ${sbh}% da SB contro i tuoi open: apri largo da CO e BTN quando è di SB.` });
  if (sbh != null && fts != null && sbh < 45 && fts >= 65) no.push(`steal light quando è di SB (contro di te folda solo ${sbh}%, in generale ${fts}%)`);
  if (bbh != null && bbh < 40 && (v("bb_btn") || 0) >= 55) no.push(`steal light da BTN quando è di BB (contro di te difende: fold ${bbh}%)`);
  const pre = [];
  if (ok("fold3b", 0.4) && v("fold3b") > 55) pre.push({ k: "fold3b", t: `fold vs 3bet ${v("fold3b")}%${smp("fold3b")}: 3bet bluff contro i suoi open (meglio quando apre OOP, combo con blocker)` });
  if (ok("foldsq", 0.4) && v("foldsq") > 60) pre.push({ k: "foldsq", t: `fold vs squeeze ${v("foldsq")}%${smp("foldsq")}: squeeze largo su open + caller` });
  if (ok("fold4b", 0.6) && v("fold4b") > 60) pre.push({ k: "fold4b", t: `fold vs 4bet ${v("fold4b")}%${smp("fold4b")}: 4bet bluff selettivo con blocker (AhXh, KhQh)` });
  if (pre.length >= 2) add({ id: "predeb", prio: 2 + 2 * pre.length, title: "PREFLOP DEBOLE", text: pre.map(p => p.t).join("; ") + "." }, pre.map(p => p.k));
  else if (pre.length) add({ id: pre[0].k, prio: 4, title: pre[0].k === "fold3b" ? "FOLDA TROPPO ALLE 3BET" : pre[0].k === "foldsq" ? "FOLDA TROPPO ALLE SQUEEZE" : "FOLDA TROPPO ALLE 4BET", text: pre[0].t[0].toUpperCase() + pre[0].t.slice(1) + "." }, [pre[0].k]);
  if (v("fold3b") != null && v("fold3b") < 38) no.push(`3bet bluff (fold vs 3bet ${v("fold3b")}%)`);
  if (v("fold4b") != null && v("fold4b") < 30 && cf("fold4b") > 0) no.push(`4bet bluff (fold vs 4bet ${v("fold4b")}%)`);
  if (v("threebet") != null && v("threebet") < 4 && ok("threebet")) add({ id: "no3b", prio: 2, title: "NESSUNA PRESSIONE PREFLOP", text: `3bet ${v("threebet")}%: apri tranquillo davanti a lui, quando 3betta ha il top del range.` }, ["threebet"]);
  if (v("limp") != null && v("limp") > 10) add({ id: "iso", prio: 25, title: "ISOLA I LIMP", text: `Limp ${v("limp")}%${hud.limp_fold != null ? `, limp-fold ${hud.limp_fold}%` : ""}: raise 5-6x IP, 6-8x OOP con value largo (66+, A9s+, KTs+, QJs, AJo+, KQo).${hud.limp_fold != null && hud.limp_fold < 45 ? " Nessun iso bluff: il limp-fold è basso." : ""}` }, ["limp"]);
  if (fish && v("fold3b") != null && v("fold3b") < 30) add({ id: "3bval", prio: 20, title: "3BET VALUE LARGO", text: `Fold vs 3bet ${v("fold3b")}%: 3bet 3,5-4x con 66+, A9s+, KTs+, QTs+, JTs, AJo+, KQo e zero bluff. L'EV viene dal dominio, non dalla fold equity.` }, ["fold3b"]);
  if ((v("open_ep") || 0) > 25 || (v("open_mp") || 0) > 29) add({ id: "openlarge", prio: 6, title: "OPEN LARGHI DA EP/MP", text: `Open EP ${v("open_ep")}% / MP ${v("open_mp")}%: range early troppo largo. 3bet value più largo e difendi di più contro le sue open early.` }, ["open_ep", "open_mp"]);
  // --- quando checka
  const cfs = [["cf_flop", "flop"], ["cf_turn", "turn"], ["cf_river", "river"]].filter(([k]) => ok(k) && v(k) > 60);
  const crR = cell("aggr", "check_raise", "river");
  if (cfs.length >= 2) add({ id: "resa", prio: 8 + 3 * cfs.length, title: "CHECK = RESA", text: `Check-fold ${cfs.map(([k, s]) => `${s} ${v(k)}%${smp(k)}`).join(", ")}: betta sempre quando checka, 33% pot basta.` }, cfs.map(c => c[0]));
  else if (cfs.length) add({ id: "resa", prio: 7, title: `CHECK-FOLD ${cfs[0][1].toUpperCase()}`, text: `Check-fold ${cfs[0][1]} ${v(cfs[0][0])}%${smp(cfs[0][0])}: quando checka al ${cfs[0][1]} betta sempre, 33% pot basta.` }, [cfs[0][0]]);
  if (crR && crR.tot >= 30 && crR.value <= 1 && ok("cf_river") && v("cf_river") > 55) combos.push({ keys: ["cf_river"], prio: 14, title: "BLUFF RIVER SU OGNI SUO CHECK", text: `Check-fold river ${v("cf_river")}% e check-raise river ${crR.value}% (${crR.n}/${crR.tot}): al river il rischio raise è nullo, bluffa quando checka.` });
  // --- quando betta
  if (ok("cb_fold") && v("cb_fold") > 55) add({ id: "cbfold", prio: 6, title: "RAISA I SUOI CBET", text: `Cb-fold ${v("cb_fold")}%${smp("cb_fold")}: quando raisi il suo cbet molla. Raise sui board che favoriscono il tuo range.` }, ["cb_fold"]);
  if (ok("aggr") && v("aggr") < 25) add({ id: "passive", prio: 8, title: "PASSIVO: QUANDO BETTA HA MANO", text: `Aggr Freq ${v("aggr")}%: punta raramente, quando lo fa rispetta.` }, ["aggr"]);
  const rco = cell("cbet", "grid", "raise_cbet", "flop_oop"), rci = cell("cbet", "grid", "raise_cbet", "flop_ip");
  [["OOP", rco], ["IP", rci]].forEach(([p, c]) => { if (c && c.tot >= 30 && c.value > 18) no.push(`cbet light quando lui è ${p} (raise cbet ${c.value}% su ${c.tot}): polarizza`); });
  const foo = cell("cbet", "grid", "fold_to_cbet", "flop_oop");
  if (foo && rco && foo.tot >= 30 && foo.value > 45 && rco.value > 18) {
    const call = Math.max(0, 100 - foo.value - rco.value);
    if (call < 35) { combos.push({ prio: 13, title: "VS CBET OOP RISPONDE POLARIZZATO", text: `Contro il cbet quando è OOP: fold ${foo.value} / raise ${rco.value} / call ${call} (${foo.tot} spot). Cbetta le mani forti per farti raisare e l'aria con size piccola, check back le mani medie.` }); patterns.push(`Vs cbet OOP: fold ${foo.value} / raise ${rco.value} / call ${call}`); }
  }
  // --- difesa
  if (ok("fold_cb_flop") && v("fold_cb_flop") > 56) add({ id: "fcbf", prio: 3 * (1 + lvl("fold_cb_flop")), title: "OVERFOLDA AL CBET FLOP", text: `Fold vs CB flop ${v("fold_cb_flop")}%${smp("fold_cb_flop")}: cbet con tutto il range e size piccola.` }, ["fold_cb_flop"]);
  if (ok("fold_cb_flop") && v("fold_cb_flop") < 34) add({ id: "fcbf", prio: 3 * (1 + lvl("fold_cb_flop")), title: "NON MOLLA IL FLOP", text: `Fold vs CB flop ${v("fold_cb_flop")}%${smp("fold_cb_flop")}: niente cbet bluff senza equity, cbetta value più largo.` }, ["fold_cb_flop"]);
  if (ok("fold_cb_turn", 0.4) && v("fold_cb_turn") < 30) no.push(`barrel bluff al turn (fold vs CB turn ${v("fold_cb_turn")}%${smp("fold_cb_turn")})`);
  if (ok("fold_cb_river", 0.4) && v("fold_cb_river") < 25) no.push(`barrel bluff al river (fold vs CB river ${v("fold_cb_river")}%${smp("fold_cb_river")})`);
  if (ok("fold_rb") && v("fold_rb") > 57) add({ id: "rbluff", prio: 2 * (1 + lvl("fold_rb")) + 2, title: "BLUFF RIVER POLARIZZATO", text: `Fold river bet ${v("fold_rb")}%${smp("fold_rb")}: bluffa il river 60-100% pot con draw mancati e blocker.` }, ["fold_rb"]);
  if (ok("fold_rb") && v("fold_rb") < 40) add({ id: "rbvalue", prio: 5, title: "PAGA IL RIVER", text: `Fold river bet ${v("fold_rb")}%${smp("fold_rb")}: al river value thin, niente bluff.` }, ["fold_rb"]);
  if (ok("fold_cb_turn", 0.4) && v("fold_cb_turn") < 35 && ok("fold_rb") && v("fold_rb") > 57) combos.push({ keys: ["fold_cb_turn", "fold_rb"], drop: "rbluff", prio: 12, title: "TURN STICKY, RIVER MOLLA", text: `Fold vs CB turn ${v("fold_cb_turn")}%${smp("fold_cb_turn")} ma fold river bet ${v("fold_rb")}%: al turn solo semi-bluff con draw, bluffa il river quando il draw manca.` });
  if (ok("fold_cr") && v("fold_cr") > 60) add({ id: "crbluff", prio: 5, title: "CHECK-RAISE BLUFF", text: `Fold vs check-raise ${v("fold_cr")}%: check-raise bluff sui suoi cbet con backdoor e blocker.` }, ["fold_cr"]);
  if (v("fold_cr") != null && v("fold_cr") < 30) { no.push(`check-raise bluff (fold vs c/r ${v("fold_cr")}%)`); add({ id: "crvalue", prio: 4, title: "CHECK-RAISE VALUE LARGO", text: `Fold vs check-raise ${v("fold_cr")}%: non molla dopo il c/r, fai c/r per value anche con top pair buona e doppie.` }, ["fold_cr"]); }
  // --- probe
  const bvmT = oppAgg(cell("cbet", "bet_vs_missed", "turn_ip"), cell("cbet", "bet_vs_missed", "turn_oop"));
  if (ok("bvm") && v("bvm") > 60) no.push(`skip cbet senza piano (bet vs missed cbet ${v("bvm")}%)`);
  if (ok("bvm") && v("bvm") < 25) add({ id: "skip", prio: 3, title: "PUOI SKIPPARE IL CBET", text: `Bet vs missed cbet ${v("bvm")}%: quando non cbetti raramente attacca, check back sicuro con le mani medie.` }, ["bvm"]);
  const probeHi = (bvmT && bvmT.tot >= 30 && bvmT.value > 55) || (ok("bvm") && v("bvm") > 60);
  if (probeHi && v("fold_cr") != null && v("fold_cr") < 35) combos.push({ keys: ["bvm", "fold_cr"], prio: 13, title: "SKIPPA IL CBET CON LE MANI FORTI", text: `Proba tanto quando non cbetti (${bvmT && bvmT.tot >= 30 ? `turn ${bvmT.value}%` : `${v("bvm")}%`}) e folda poco al check-raise (${v("fold_cr")}%): check con mani forti, lui punta, check-raise value largo.` });
  // --- combo di linea
  if (ok("cb_flop") && ok("cb_turn") && v("cb_flop") > 65 && v("cb_turn") < 45) combos.push({ keys: ["cb_flop", "cb_turn"], prio: 11, title: "FLOAT FLOP IP", text: `CB flop ${v("cb_flop")}% ma turn ${v("cb_turn")}%${smp("cb_turn")}: float il flop in posizione e betta il turn quando checka.` });
  if (ok("cb_flop") && ok("cb_turn") && v("cb_flop") < 50 && v("cb_turn") > 60) combos.push({ prio: 8, title: "DELAYED CBET", text: `CB flop ${v("cb_flop")}% e turn ${v("cb_turn")}%: float il flop va bene, ma aspettati il barrel al turn.` });
  const cvh = cell("cbet", "cb_vs_hero");
  if (cvh && cvh.tot >= 30 && cvh.value > 60 && ok("cb_fold") && v("cb_fold") > 50) combos.push({ prio: 9, title: "CONTRO DI TE CBETTA TROPPO", text: `Cbetta ${cvh.value}% contro di te (${cvh.n}/${cvh.tot}) e molla ai raise (${v("cb_fold")}%): float o raise cbet sui board buoni per te.` });
  if (fish) {
    add({ id: "fishpost", prio: 19, title: "VALUE BET GRANDE", text: `Contro di lui value bet 75% pot o più su flop e turn con top pair debole kicker, seconda coppia top kicker e overpair. Niente bluff senza equity prima del river.` });
    if (ok("fold_rb") && v("fold_rb") > 55) combos.push({ prio: 10, title: "BLUFF SOLO AL RIVER", text: `Paga flop e turn ma molla il river (fold river bet ${v("fold_rb")}%): bluff polarizzato solo al river.` });
  }
  // pattern check: quando checka
  const cff = cell("cbet", "check_fold", "flop"), crf = cell("aggr", "check_raise", "flop");
  if (cff && crf && cff.tot != null) patterns.push(`Quando checka il flop: fold ${cff.value} / check-raise ${crf.value} / call ${Math.max(0, 100 - cff.value - crf.value)} (${cff.tot} spot)`);
  // --- sintesi, priorità, bilanciato
  combos.sort((a, b) => b.prio - a.prio);
  const csel = combos.slice(0, 3);
  csel.forEach(c => (c.keys || []).forEach(k => used.add(k)));
  const drops = new Set(csel.map(c => c.drop).filter(Boolean));
  let all = pts.filter(p => !drops.has(p.id)).concat(csel.map(c => ({ ...c, id: "combo", combo: true })));
  all.sort((a, b) => b.prio - a.prio);
  const serious = sc.rows.filter(r => r.lvl >= 2 && r.conf >= 0.6 && r.w >= 2);
  const balanced = !fish && serious.length === 0 && all.filter(p => p.prio >= 8).length === 0 && ws != null && ws >= 49 && ws <= 57 && wt != null && wt >= 24 && wt <= 32;
  if (balanced) {
    const micro = all.slice(0, 3);
    all = [{ id: "bal", prio: 99, title: "NESSUN LEAK EVIDENTE", text: "Profilo bilanciato su un sample affidabile: gioca standard, non forzare exploit." }, ...micro];
  }
  if (!all.some(p => p.combo) && combos.length) all.push({ ...combos[0], id: "combo", combo: true });
  all = all.slice(0, 10);
  // scartate
  const disc = [];
  sc.rows.forEach(r => {
    if (r.lvl === 0) return;
    if (r.conf === 0) disc.push(`${r.lab} ${fmtN(r.v)}%${r.tot ? ` (${r.n != null ? r.n + "/" : "~"}${r.tot})` : ""}: ${r.nodenom ? "manca il denominatore del pop-up CBET, non la uso" : "sample sotto 20"}`);
    else if (r.conf <= 0.4 && !used.has(r.key)) disc.push(`${r.lab} ${fmtN(r.v)}% (${r.n != null ? r.n + "/" : "~"}${r.tot}): sample 20-29, solo direzione`);
    else if (!used.has(r.key) && r.lvl >= 2 && r.w >= 1) disc.push(`${r.lab} ${fmtN(r.v)}%: deviazione di livello ${r.lvl} non trasformata in un punto operativo`);
  });
  // label
  const vp = v("vpip") || 0, lp = v("limp") || 0, gp = v("gap") || 0;
  const wrEV = +(D.header || {}).winrate_ev;
  let label;
  if (vp >= 50 || lp >= 20) label = "MEGAFISH LIMP/CALL";
  else if (wtH && wsL && (ws || 0) <= 46) label = fish ? "FISH LOOSE / CALLING STATION" : "CALLING STATION PERDENTE";
  else if (fish) label = "FISH LOOSE PASSIVO";
  else if (balanced) label = "REG BILANCIATO / GIOCA STANDARD";
  else {
    const winning = hands >= 3000 && wrEV >= 10;
    const agg = (v("aggr") || 0) > 38 || (v("pfr") || 0) > 22;
    const tag = { resa: "QUANDO CHECKA SI ARRENDE", bbbtn: "BLIND OVERFOLD", bvb: "BLIND OVERFOLD", predeb: "OVERFOLD PREFLOP", fold3b: "OVERFOLD SU AGGRESSIONE", rbluff: "MOLLA IL RIVER", rivvalue: "RIVER = VALUE", rivbluff: "RIVER LEGGERO", sdstrong: "SHOWDOWN FORTE", passive: "PASSIVO", fcbf: "OVERFOLD AL CBET", crbluff: "OVERFOLD SU AGGRESSIONE", openlarge: "OPEN LARGHI" };
    const top = all.find(p => tag[p.id]);
    label = `${(v("vpip") || 0) - (v("pfr") || 0) <= 5 ? "TAG" : "REG"}${winning ? " VINCENTE" : ""}${agg ? " AGGRESSIVO" : ""}${top ? " / " + tag[top.id] : ""}`;
  }
  // concetto chiave
  const lead = all[0], sec = all.find(p => p !== lead && !p.combo) || all[1];
  const KC = {
    station: "Value largo e grande, zero bluff: la sua mano peggiore paga.", resa: "Attaccalo ogni volta che checka: la sua linea di check è quasi sempre resa.", bbbtn: "Rubagli i blind senza pietà dal BTN.", predeb: "Metti pressione preflop: folda troppo alle rilanci.",
    rivbluff: "Non foldare i bluff catcher alle sue river bet.", rivvalue: "Rispetta le sue river bet, folda i marginali.", rbluff: "Il river è la street dove vince il tuo bluff.", sdstrong: "Meno bluff: arriva allo showdown con mani vere.", iso: "Isola e fai value grande: l'EV sta nei piatti che gli fai giocare fuori posizione e dominato.",
    bal: "Gioca standard: il tuo edge viene dagli altri al tavolo.", passive: "Quando si sveglia ha mano: bluff sui suoi check, fold ai suoi bet.", fcbf: "Cbetta tanto con size piccola.", crvalue: "Non bluffare di check-raise, fallo per value largo.",
  };
  const concept = (KC[lead && lead.id] || (lead ? lead.text.split(":")[0] + "." : "Gioca standard.")) + (sec && KC[sec.id] && sec.id !== lead.id ? " " + KC[sec.id] : "");
  // catena
  const chain = [
    `Range: VPIP/PFR ${fmtN(v("vpip"))}/${fmtN(v("pfr"))}, gap ${fmtN(gp)}${gp > 10 ? ": range largo e passivo" : gp <= 4 ? ": range pulito e aggressivo" : ""}${lp > 4 ? `, limp ${lp}%` : ""}.`,
    `Frequenza: WTSD ${fmtN(wt)}%${wtH ? " (alto)" : wtL ? " (basso)" : " (norma)"}.`,
    `Qualità: W$SD ${fmtN(ws)}%${S.wsd && S.wsd.tot ? ` su ${S.wsd.tot} showdown` : ""}${wtH && wsH ? ": arriva spesso e forte" : wtH && wsL ? ": arriva spesso e perde" : wtL && wsH ? ": selettivo" : wtL && wsL ? ": incoerente o sample debole" : ""}.`,
    `River: W$SD B River ${S.wsd_river ? fmtN(S.wsd_river.value) + "%" + smp("wsd_river") : "n/d"}${rb != null ? `, riverbet ${rb}%` : ""}${wr == null ? " (sample troppo piccolo)" : wr < 40 ? ": attacca leggero" : wr > 55 ? ": attacca con value" : ": nella norma"}.`,
  ];
  // 3bet posizionale (solo analisi)
  const tbp = [];
  (B.detail || []).forEach(dd => { const c = oppCell(dd.all); if (!c) return; if (dd.his_pos === "bb" && dd.vs === "sb" && c.value > 20) tbp.push(`3bet BB vs SB ${c.value}%`); if (dd.his_pos === "bb" && dd.vs === "btn" && c.value > 15) tbp.push(`3bet BB vs BTN ${c.value}%`); if (dd.his_pos === "btn" && dd.vs === "co" && c.value > 20) tbp.push(`3bet BTN vs CO ${c.value}%`); });
  if (tbp.length) patterns.push("3bet posizionale alto: " + tbp.join(", "));
  const warn = hands < 1000 ? "SAMPLE BASSO: " : "";
  return { points: all, no: [...new Set(no)], concept, label: warn + label, chain, patterns, discarded: disc, balanced, fish };
}
const fmtN = x => x == null ? "n/d" : String(Math.round(x * 10) / 10).replace(".", ",");
function oppNoteText(name, D, V, S, note) {
  const hands = V.hands || 0, g = k => S[k] ? fmtN(S[k].value) : "n/d";
  let t = `**${name} | ${note.label} | ${g("vpip")}/${g("pfr")} | ${hands} mani | WTSD ${g("wtsd")} / W$SD ${g("wsd")} / W$SD river ${g("wsd_river")} / Aggr Freq ${g("aggr")}%**\n\n`;
  note.points.forEach((p, i) => { t += `**${i + 1}. ${p.title}**: ${p.text}\n`; });
  if (note.no.length) t += `\n**NO:** ${note.no.join(", ")}\n`;
  t += `\n**Concetto chiave:** ${note.concept}`;
  return t;
}
function oppAnalyze(D, k) {
  const V = oppValidate(D);
  const S = oppStats(D, V);
  const sc = oppScore(D, V, S, k);
  const note = oppNote(D, V, S, sc);
  const fin = oppFinal(sc, S, V, 0);
  return { V, S, sc, note, fin };
}


