/* ================= CALCOLATORE DI EQUITY (stile Equilab / Flopzilla) =================
   Da 2 a 6 giocatori, come nei tavoli 6-max, ognuno con una mano precisa (AhKd) o un range (QQ+,AKs,AJo:0.5).
   Equity esatta quando il conto è piccolo, altrimenti simulazione Monte Carlo a tempo.
   Sotto: cosa colpisce un range sul board (mani fatte e progetti). */
let EQF = null, EQJOB = null;
const EQ_MAX = 6;
function eqDefault() { return { p: ["AhKh", "QQ+,AKs,AKo"], board: "", fz: 1, res: null }; }
/* testo -> combinazioni [c1, c2, peso] (escluse quelle che usano carte del board) */
function eqParse(txt, board) {
  const out = [], seen = new Set(), bad = [], used = new Set(board || []);
  const add = (a, b, w) => { if (a === b) return; const k = a < b ? a * 64 + b : b * 64 + a; if (seen.has(k)) return; seen.add(k); if (!used.has(a) && !used.has(b)) out.push([a, b, w]); };
  const rest = [];
  String(txt || "").split(/[,\s]+/).map(t => t.trim()).filter(Boolean).forEach(t => {
    const m = t.match(/^([2-9TJQKA])([shdc])([2-9TJQKA])([shdc])(?::([\d.]+))?$/i);
    if (m) { const a = djC(m[1].toUpperCase() + m[2].toLowerCase()), b = djC(m[3].toUpperCase() + m[4].toLowerCase()); if (a === b) bad.push(t); else add(a, b, m[5] != null ? Math.max(0.01, Math.min(1, parseFloat(m[5]) || 1)) : 1); return; }
    if (/^(casuale|random|tutte)$/i.test(t)) { rest.push("22+,A2+,K2+,Q2+,J2+,T2+,92+,82+,72+,62+,52+,42+,32"); return; }
    const base = t.split(":")[0].toUpperCase().replace(/([2-9TJQKA]{2})([SO])/g, (x, y, z) => y + z.toLowerCase());
    if (!Object.keys(hParseRange(base)).length) bad.push(t); else rest.push(base + (t.includes(":") ? ":" + t.split(":")[1] : ""));
  });
  const w = svParseRange(rest.join(","));
  Object.entries(w).forEach(([k, f]) => hExpand(k).forEach(([a, b]) => add(a, b, f)));
  return { cs: out, bad };
}
const eqNComb = cs => cs.reduce((a, c) => a + c[2], 0);
/* lavoro di calcolo: generatore che si ferma ogni tanto per non bloccare la pagina */
function* eqWork(P, board) {
  const n = P.length, need = 5 - board.length, ev = new Array(7);
  const acc = { eq: new Float64Array(n), win: new Float64Array(n), tie: new Float64Array(n), tot: 0, it: 0, exact: false, done: false };
  const cs = P.map(() => new Array(7).fill(0)), sc = new Array(n);
  const score = (hands, extra, w) => {
    let best = -1, nb = 0;
    for (let i = 0; i < n; i++) { const a = cs[i]; a[0] = hands[i][0]; a[1] = hands[i][1]; for (let k = 0; k < board.length; k++) a[2 + k] = board[k]; for (let k = 0; k < need; k++) a[2 + board.length + k] = extra[k]; const v = djEval(a); sc[i] = v; if (v > best) { best = v; nb = 1; } else if (v === best) nb++; }
    for (let i = 0; i < n; i++) if (sc[i] === best) { acc.eq[i] += w / nb; if (nb === 1) acc.win[i] += w; else acc.tie[i] += w; }
    acc.tot += w; acc.it++;
  };
  /* stima del lavoro esatto */
  const runs = [1, 46, 1035, 15180, 178365, 1712304][need] || 1;
  let tuples = 1; P.forEach(p => tuples *= p.length);
  if (tuples <= 200000 && tuples * runs * n <= 4.5e6) {
    acc.exact = true;
    const T = [], cur = [], usedB = new Set(board);
    const rec = (i, used, w) => { if (i === n) { T.push([cur.slice(), w]); return; } for (const c of P[i]) { if (used.has(c[0]) || used.has(c[1])) continue; cur[i] = c; used.add(c[0]); used.add(c[1]); rec(i + 1, used, w * c[2]); used.delete(c[0]); used.delete(c[1]); } };
    rec(0, usedB, 1);
    if (!T.length) { acc.err = "Nessuna combinazione possibile: le mani si bloccano a vicenda."; acc.done = true; return acc; }
    let cnt = 0;
    for (const [hs, w] of T) {
      const used = new Set(board); hs.forEach(h => { used.add(h[0]); used.add(h[1]); });
      const deck = []; for (let c = 0; c < 52; c++) if (!used.has(c)) deck.push(c);
      const L = deck.length, idx = [];
      for (let k = 0; k < need; k++) idx.push(k);
      if (need === 0) { score(hs, ev, w); continue; }
      for (;;) {
        for (let k = 0; k < need; k++) ev[k] = deck[idx[k]];
        score(hs, ev, w);
        if (++cnt % 25000 === 0) yield acc;
        let k = need - 1; while (k >= 0 && idx[k] === L - need + k) k--; if (k < 0) break; idx[k]++; for (let j = k + 1; j < need; j++) idx[j] = idx[j - 1] + 1;
      }
    }
    acc.done = true; return acc;
  }
  /* Monte Carlo: ogni giocatore pesca una combinazione secondo i pesi; se due si bloccano si ripesca tutto */
  const cum = P.map(p => { const a = []; let s = 0; for (const c of p) { s += c[2]; a.push(s); } return a; });
  const draw = i => { const a = cum[i], r = Math.random() * a[a.length - 1]; let lo = 0, hi = a.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < r) lo = m + 1; else hi = m; } return P[i][lo]; };
  const hs = new Array(n), mark = new Uint8Array(52), deck = new Array(52);
  let fails = 0;
  for (;;) {
    let ok = false;
    for (let t = 0; t < 200 && !ok; t++) {
      mark.fill(0); board.forEach(c => mark[c] = 1); ok = true;
      for (let i = 0; i < n; i++) { const c = draw(i); if (mark[c[0]] || mark[c[1]]) { ok = false; break; } mark[c[0]] = mark[c[1]] = 1; hs[i] = c; }
    }
    if (!ok) { if (++fails > 20) { acc.err = "Le mani si bloccano quasi sempre a vicenda: controlla i range."; acc.done = true; return acc; } continue; }
    let L = 0; for (let c = 0; c < 52; c++) if (!mark[c]) deck[L++] = c;
    for (let k = 0; k < need; k++) { const j = k + Math.floor(Math.random() * (L - k)); const x = deck[k]; deck[k] = deck[j]; deck[j] = x; ev[k] = deck[k]; }
    score(hs, ev, 1);
    if (acc.it % 4000 === 0) yield acc;
  }
}
/* ---------- motore unico: lo usano il calcolatore e i drill (stesse regole, stessi numeri) ----------
   Esatto quando il conto è piccolo; altrimenti simulazione: almeno EQ_MC_MIN mani, e in sottofondo fino a 2,5 secondi. */
const EQ_MC_MIN = 400000, EQ_MC_MS = 2500;
const EQ_JOBS = new Map();
function eqJob(texts, boardStr) {
  const key = texts.join("|") + "|" + (boardStr || "");
  if (EQ_JOBS.has(key)) return EQ_JOBS.get(key);
  const board = djCs(boardStr || ""), P = texts.map(t => eqParse(t, board));
  const J = { key, texts: texts.slice(), board: boardStr || "", gen: P.some(p => p.bad.length || !p.cs.length) ? null : eqWork(P.map(p => p.cs), board), r: null, done: false, t0: null, t: null };
  if (!J.gen) J.done = true;
  EQ_JOBS.set(key, J); if (EQ_JOBS.size > 40) { const k0 = EQ_JOBS.keys().next().value; const J0 = EQ_JOBS.get(k0); clearTimeout(J0.t); EQ_JOBS.delete(k0); }
  return J;
}
function eqStep(J, ms) { if (J.done) return J; const s = Date.now(); while (Date.now() - s < ms) { const v = J.gen.next().value; if (!v) { J.done = true; break; } J.r = v; if (v.done) { J.done = true; break; } } return J; }
function eqOut(J) {
  const r = J.r; if (!r || !r.tot) return r && r.err ? { err: r.err } : null;
  const eq = [...r.eq].map(x => x / r.tot * 100);
  return { eq, win: [...r.win].map(x => x / r.tot * 100), tie: [...r.tie].map(x => x / r.tot * 100), exact: r.exact, it: r.it, done: J.done || (!r.exact && r.it >= EQ_MC_MIN), se: r.exact ? 0 : Math.max(...eq.map(e => Math.sqrt(e / 100 * (1 - e / 100) / r.it))) * 200, err: r.err };
}
/* risultato subito (blocca la pagina il minimo: esatto fino in fondo, simulazione fino a EQ_MC_MIN) */
function eqFinish(J) { while (!J.done && (!J.r || J.r.exact || J.r.it < EQ_MC_MIN)) eqStep(J, 60); return eqOut(J); }
/* calcolo in sottofondo mentre lo studente pensa */
function eqBackground(J, onUpd) {
  if (J.done || J.t) return; J.t0 = J.t0 || Date.now();
  const tick = () => { J.t = null; eqStep(J, 30); if (onUpd) onUpd(eqOut(J)); if (!J.done && (!J.r || J.r.exact || Date.now() - J.t0 < EQ_MC_MS)) J.t = setTimeout(tick, 0); };
  J.t = setTimeout(tick, 0);
}
const eqNote = o => !o ? "" : o.exact ? `Calcolo esatto: ${fmt(o.it)} situazioni, lo stesso conto del Sonar.` : `Simulazione: ${fmt(o.it)} mani, margine circa ±${fmt(o.se, 2)} punti (come nel Sonar).`;
/* percentuale senza arrotondare a 100 o a 0 quando non è certo */
const eqShow = (x, d) => { const m = Math.pow(10, d); if (x < 100 && Math.round(x * m) / m >= 100) return ">" + fmt(100 - 1 / m, d) + "%"; if (x > 0 && Math.round(x * m) / m <= 0) return "<" + fmt(1 / m, d) + "%"; return fmt(x, d) + "%"; };
const eqPct = (x, o) => eqShow(x, 2);
/* apre uno spot nel calcolatore, in una finestra sopra il drill */
function eqOpen(players, board) {
  EQF = { p: players.slice(0, EQ_MAX), board: board || "", fz: 1, res: null };
  gModal(`<div id="eqModalRoot"></div>`, m => { m.querySelector(".gmbox").classList.add("eqwide"); renderEquity(m.querySelector("#eqModalRoot")); eqRun(); });
}
const eqBtn = (players, board, label) => `<button type="button" class="btn small eqopen" data-eqopen="${esc(JSON.stringify({ p: players, b: board || "" }))}">${label || "Verifica con il Sonar"}</button>`;
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-eqopen]"); if (!b) return; e.preventDefault(); e.stopPropagation(); try { const d = JSON.parse(b.dataset.eqopen); eqOpen(d.p, d.b); } catch (er) {} }, true);
/* ---------- Flopzilla: cosa colpisce il range ---------- */
const FZ_MADE = ["Scala colore", "Poker", "Full", "Colore", "Scala", "Set", "Tris", "Doppia coppia", "Overpair", "Top pair", "Coppia sotto la top", "Seconda coppia", "Coppia bassa", "Asso alto", "Niente"];
const FZ_DRAW = ["Progetto colore", "Scala bilaterale", "Gutshot", "Colore e scala insieme", "Backdoor colore"];
function fzClass(h, b) {
  const v = djEval([h[0], h[1], ...b]), cat = djCat(v);
  const hr = [h[0] >> 2, h[1] >> 2], br = b.map(c => c >> 2), pp = hr[0] === hr[1];
  const u = [...new Set(br)].sort((x, y) => y - x), cnt = r => br.filter(x => x === r).length;
  let made;
  if (cat >= 4) made = FZ_MADE[8 - cat];
  else if (pp && cnt(hr[0]) >= 1) made = "Set";
  else if (!pp && hr.some(r => cnt(r) >= 2)) made = "Tris";
  else if (!pp && hr[0] !== hr[1] && cnt(hr[0]) === 1 && cnt(hr[1]) === 1) made = "Doppia coppia";
  else if (pp) made = hr[0] > u[0] ? "Overpair" : u[1] != null && hr[0] > u[1] ? "Coppia sotto la top" : "Coppia bassa";
  else { const m = hr.filter(r => cnt(r) === 1).sort((x, y) => y - x)[0]; made = m == null ? (hr.includes(12) ? "Asso alto" : "Niente") : m === u[0] ? "Top pair" : m === u[1] ? "Seconda coppia" : "Coppia bassa"; }
  const draws = [];
  if (b.length < 5) {
    const all = [h[0], h[1], ...b], suitN = s => all.filter(c => (c & 3) === s).length;
    const fd = cat < 5 && [h[0] & 3, h[1] & 3].some(s => suitN(s) === 4);
    const rs = new Set([...hr, ...br].map(r => r + 2)), bs = new Set(br.map(r => r + 2));
    let outs = 0;
    if (cat < 4) for (let x = 2; x <= 14; x++) { if (rs.has(x)) continue; if (cbdStraight(new Set([...rs, x])) && !cbdStraight(new Set([...bs, x]))) outs++; }
    if (fd) draws.push("Progetto colore");
    if (outs >= 2) draws.push("Scala bilaterale"); else if (outs === 1) draws.push("Gutshot");
    if (fd && outs >= 1) draws.push("Colore e scala insieme");
    if (b.length === 3 && cat < 5 && !fd && [h[0] & 3, h[1] & 3].some(s => suitN(s) === 3 && b.filter(c => (c & 3) === s).length < 3)) draws.push("Backdoor colore");
  }
  return { made, draws };
}
function fzTable(cs, b) {
  const M = {}, D = {}; let tot = 0, nada = 0;
  for (const c of cs) { const k = fzClass(c, b); M[k.made] = (M[k.made] || 0) + c[2]; k.draws.forEach(d => D[d] = (D[d] || 0) + c[2]); if (!k.draws.length && (k.made === "Niente" || k.made === "Asso alto")) nada += c[2]; tot += c[2]; }
  return { M, D, tot, nada };
}
/* ---------- pagina ---------- */
function eqPlayerStat(i) {
  const c = EQF, board = djCs(c.board), r = eqParse(c.p[i], board), n = eqNComb(r.cs);
  if (r.bad.length) return `<span class="eqbad">Non capisco: ${esc(r.bad.slice(0, 3).join(", "))}</span>`;
  if (!r.cs.length) return `<span class="eqbad">Vuoto: scrivi una mano o un range</span>`;
  if (eqFzF(i) && board.length >= 3) { const nf = eqNComb(eqFilt(i, r.cs, board)); return `<b class="eqfilt">Filtrato dal Sonar:</b> ${fmtN(Math.round(nf * 10) / 10)} di ${fmtN(Math.round(n * 10) / 10)} combo`; }
  return r.cs.length === 1 ? `mano precisa` : `${fmtN(Math.round(n * 10) / 10)} combo · ${fmtN(Math.round(n / 1326 * 1000) / 10)}% delle mani`;
}
let EQROOT = null;
function renderEquity(root) {
  if (root !== undefined) EQROOT = root || null; else EQROOT = null;
  const R = EQROOT && document.body.contains(EQROOT) ? EQROOT : $("#view"), inModal = R !== $("#view");
  const c = EQF || (EQF = eqDefault());
  const col = ["var(--eq1)", "var(--eq2)", "var(--eq3)", "var(--eq4)", "var(--eq5)", "var(--eq6)"];
  let h = `<div class="svhead"><div><h2>Sonar</h2><p>Il calcolatore di equity dell'Orca: come un'orca che scandaglia il mare, il Sonar mette mani precise o range uno contro l'altro, con il board che vuoi, e ti mostra chi è avanti. Sotto vedi cosa colpisce un range sul flop, sul turn o sul river.</p></div></div>`;
  if (!inModal) h += `<div class="eqmode segm"><button class="${c.mode !== "train" ? "on" : ""}" data-eqmode="calc">Calcolatore</button><button class="${c.mode === "train" ? "on" : ""}" data-eqmode="train">Allenamento equity</button></div>`;
  if (!inModal && c.mode === "train") {
    R.innerHTML = h + `<div id="etRoot"></div>`;
    R.querySelectorAll("[data-eqmode]").forEach(b => b.onclick = () => { c.mode = b.dataset.eqmode; renderEquity(); });
    etRender(); return;
  }
  h += `<section class="eqbox"><h3>Giocatori</h3><div class="eqplayers">${c.p.map((t, i) => `<div class="eqp" style="--pc:${col[i]}"><span class="eqpn">G${i + 1}</span><div class="eqpin"><input type="text" class="mono" data-eqp="${i}" value="${esc(t)}" spellcheck="false" autocomplete="off" aria-label="Mano o range del giocatore ${i + 1}" placeholder="AhKd oppure QQ+,AKs"><small data-eqs="${i}">${eqPlayerStat(i)}</small></div><button class="btn small" data-eqr="${i}">Range</button>${c.p.length > 2 ? `<button class="btn small ghost" data-eqx="${i}" aria-label="Togli il giocatore ${i + 1}">×</button>` : ""}</div>`).join("")}</div>
  <div class="svrow">${c.p.length < EQ_MAX ? `<button class="btn ghost" id="eqAdd">+ Aggiungi giocatore</button>` : ""}<span class="muted" style="font-size:13px">Formato: AhKd per una mano precisa; QQ+, AKs, ATs+, 76s-54s, AJo:0.5 per un range (dopo i due punti il peso); "casuale" per tutte le mani.</span></div></section>`;
  h += `<section class="eqbox"><h3>Board</h3><div id="eqBoard"></div></section>`;
  h += `<div class="svgo"><button class="btn3d" id="eqGo">Calcola l'equity</button><span id="eqMsg" class="muted" style="font-size:14px"></span></div><div id="eqOut"></div>`;
  h += `<section class="eqbox"><h3>Cosa colpisce il range</h3><div id="eqFz"></div></section>`;
  R.innerHTML = h;
  R.querySelectorAll("[data-eqmode]").forEach(b => b.onclick = () => { eqStop(); c.mode = b.dataset.eqmode; renderEquity(); });
  if (inModal) { R.querySelectorAll("[data-eqr]").forEach(b => b.remove()); const hd = R.querySelector(".svhead p"); if (hd) hd.textContent = "Lo spot del drill è già caricato. Puoi cambiare mani, range e board e ricalcolare: per la griglia dei range apri la scheda Sonar."; }
  const rer = () => renderEquity(inModal ? R : undefined);
  const bindBoard = () => {
    const bb = $("#eqBoard"); bb.innerHTML = svBoardHTML(c);
    const set = v => { c.board = v; eqStop(); c.res = null; bindBoard(); refreshStats(); eqResults(); eqFz(); };
    bb.querySelectorAll("[data-bc]").forEach(b => b.onclick = () => { const k = b.dataset.bc, sel = c.board.match(/../g) || []; set((sel.includes(k) ? sel.filter(x => x !== k) : sel.length < 5 ? [...sel, k] : sel).join("")); });
    bb.querySelectorAll("[data-bs]").forEach(b => b.onclick = () => set((c.board.match(/../g) || []).filter(x => x !== b.dataset.bs).join("")));
    bb.querySelector('[data-bact="rnd"]').onclick = () => set(dealCards(3).join(""));
    bb.querySelector('[data-bact="clr"]').onclick = () => set("");
    bb.querySelector('[data-bact="rnd"]').textContent = "Flop casuale";
    const tip = bb.querySelector(".svrow .muted"); if (tip) tip.textContent = "Da 0 a 5 carte. Senza board l'equity è quella preflop.";
  };
  const refreshStats = () => c.p.forEach((t, i) => { const el = document.querySelector(`[data-eqs="${i}"]`); if (el) el.innerHTML = eqPlayerStat(i); });
  bindBoard();
  document.querySelectorAll("[data-eqp]").forEach(inp => inp.oninput = () => { c.p[+inp.dataset.eqp] = inp.value; c.res = null; eqStop(); refreshStats(); eqResults(); eqFz(); });
  document.querySelectorAll("[data-eqx]").forEach(b => b.onclick = () => { eqStop(); c.p.splice(+b.dataset.eqx, 1); c.fzf = {}; c.res = null; c.fz = Math.min(c.fz, c.p.length) || 1; rer(); });
  if ($("#eqAdd")) $("#eqAdd").onclick = () => { eqStop(); c.p.push("casuale"); c.res = null; rer(); };
  document.querySelectorAll("[data-eqr]").forEach(b => b.onclick = () => {
    const i = +b.dataset.eqr, tmp = { oop: c.p[i].split(/[,\s]+/).filter(t => !/^[2-9TJQKA][shdc][2-9TJQKA][shdc](:[\d.]+)?$/i.test(t) && !/^(casuale|random|tutte)$/i.test(t)).join(","), brush: 100 };
    if (/^(casuale|random|tutte)$/i.test(c.p[i].trim())) tmp.oop = "22+,A2s+,K2s+,Q2s+,J2s+,T2s+,92s+,82s+,72s+,62s+,52s+,42s+,32s,A2o+,K2o+,Q2o+,J2o+,T2o+,92o+,82o+,72o+,62o+,52o+,42o+,32o";
    tmp.cx = reParseCombos(c.p[i]);
    gModal(`<h3 style="margin:0 0 4px">Range del giocatore ${i + 1}</h3><p class="muted" style="font-size:13px;margin:0 0 10px">Tocca o trascina sulle celle. Per tenere solo alcuni semi di una mano (per esempio AKs solo a cuori) usa «Scegli i semi».</p><div class="eqre"></div><div class="svrow" style="margin-top:12px"><button class="btn3d" id="eqUse">Usa questo range</button></div>`, (m, close) => {
      m.querySelector(".gmbox").classList.add("eqwide");
      svRangeEditor(m.querySelector(".eqre"), tmp, 0, null, { suits: true });
      m.querySelector("#eqUse").onclick = () => { c.p[i] = [tmp.oop, reCombosStr(tmp.cx || {})].filter(Boolean).join(","); c.res = null; eqStop(); close(); renderEquity(); };
    });
  });
  $("#eqGo").onclick = eqRun;
  eqResults(); eqFz();
}
function eqStop() { if (EQJOB) { clearTimeout(EQJOB.t); EQJOB = null; } const g = $("#eqGo"); if (g) g.textContent = "Calcola l'equity"; }
function eqRun() {
  const c = EQF;
  if (EQJOB) { eqStop(); return; }
  const board = djCs(c.board);
  if (board.length > 5) return;
  const P = c.p.map((t, i) => { const r = eqParse(t, board); r.cs = eqFilt(i, r.cs, board); return r; });
  const msg = $("#eqMsg");
  const bi = P.findIndex(p => p.bad.length || !p.cs.length);
  if (bi >= 0) { msg.textContent = P[bi].bad.length || !eqParse(c.p[bi], board).cs.length ? `Controlla il giocatore ${bi + 1}: mano o range non valido.` : `Il filtro del giocatore ${bi + 1} ha tolto tutte le combo: togli qualche filtro.`; return; }
  const gen = eqWork(P.map(p => p.cs), board), t0 = Date.now(), LIMIT = 2500;
  const job = EQJOB = { t: null };
  $("#eqGo").textContent = "Ferma";
  const tick = () => {
    if (EQJOB !== job) return;
    const s = Date.now(); let r;
    while (Date.now() - s < 45) { r = gen.next().value; if (!r || r.done) break; }
    if (!r) { EQJOB = null; return; }
    c.res = { ...r, eq: [...r.eq], win: [...r.win], tie: [...r.tie], n: c.p.length, ms: Date.now() - t0, labels: c.p.slice() };
    const left = r && !r.done && !r.err && (r.exact || Date.now() - t0 < LIMIT);
    if (!left) EQJOB = null;
    eqResults();
    if (left) job.t = setTimeout(tick, 0); else { const g = $("#eqGo"); if (g) g.textContent = "Calcola l'equity"; const mm = $("#eqMsg"); if (mm) mm.textContent = r && r.err ? r.err : ""; }
  };
  msg.textContent = "Calcolo in corso...";
  tick();
}
function eqResults() {
  const out = $("#eqOut"); if (!out) return;
  const r = EQF.res;
  if (!r || !r.tot) { out.innerHTML = ""; return; }
  const col = ["var(--eq1)", "var(--eq2)", "var(--eq3)", "var(--eq4)", "var(--eq5)", "var(--eq6)"], pc = x => eqShow(x / r.tot * 100, 2);
  const busy = !!EQJOB;
  const se = r.exact ? 0 : Math.max(...r.eq.map(e => { const p = e / r.tot; return Math.sqrt(p * (1 - p) / r.it); })) * 100 * 2;
  const short = t => { const s = String(t).trim(); return s.length > 34 ? esc(s.slice(0, 32)) + "…" : esc(s); };
  out.innerHTML = `<section class="eqbox eqres"><div class="eqbar">${r.eq.map((e, i) => `<i style="width:${e / r.tot * 100}%;background:${col[i]}" title="G${i + 1}"></i>`).join("")}</div>
  <div class="eqtw"><table class="eqtab"><thead><tr><th>Giocatore</th><th class="num">Equity</th><th class="num">Vince</th><th class="num">Pareggia</th></tr></thead><tbody>${r.eq.map((e, i) => `<tr><td><span class="eqdot" style="background:${col[i]}"></span><b>G${i + 1}</b> <span class="mono eqlab">${short(r.labels[i])}</span></td><td class="num"><b>${pc(e)}</b></td><td class="num">${pc(r.win[i])}</td><td class="num">${pc(r.tie[i])}</td></tr>`).join("")}</tbody></table></div>
  <p class="muted" style="font-size:13px;margin:8px 0 0">${busy ? (r.exact ? "Calcolo esatto in corso..." : "Simulazione in corso...") : r.exact ? `Calcolo esatto: ${fmt(r.it)} situazioni (tutte le combinazioni di mani e di carte).` : `Simulazione Monte Carlo: ${fmt(r.it)} mani giocate, margine circa ±${fmt(se, 2)} punti.`} I pareggi valgono una parte del piatto: l'equity conta vittorie più pareggi divisi.</p></section>`;
}
