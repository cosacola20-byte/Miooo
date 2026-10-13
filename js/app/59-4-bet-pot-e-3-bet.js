/* ================= 4-BET POT E 3-BET POT BvB (postflop) ================= */
/* range di chi chiama il 4-bet: stime di riferimento (nessuna tabella di riferimento) */
const CALL4 = {
  bb_vs_btn: "QQ:0.5,JJ,TT:0.7,99:0.3,AKs:0.5,AKo:0.6,AQs,AJs:0.5,KQs:0.6,AQo:0.3,A5s:0.2",
  btn_vs_co: "QQ:0.5,JJ,TT:0.6,AKs:0.5,AKo:0.6,AQs,AJs:0.4,KQs:0.5",
  bb_vs_sb: "QQ:0.4,JJ,TT,99:0.6,88:0.3,AKs:0.4,AKo:0.6,AQs,AQo:0.5,AJs,ATs:0.5,KQs,KJs:0.5,QJs:0.4",
};
const P4 = [
  { id: "btn_bb", t: "BB 3-betta, il BTN 4-betta a 26,4bb, il BB chiama", four: { pos: "BTN", ip: true, r: () => hPreW("btn_vs_bb3", 2) }, call: { pos: "BB", ip: false, r: () => svParseRange(CALL4.bb_vs_btn) }, pot: 53.3, stack: 73.6 },
  { id: "co_btn", t: "Il BTN 3-betta, il CO 4-betta a 19,2bb, il BTN chiama", four: { pos: "CO", ip: false, r: () => hPreW("co_vs_btn3", 2) }, call: { pos: "BTN", ip: true, r: () => svParseRange(CALL4.btn_vs_co) }, pot: 39.9, stack: 80.8 },
  { id: "sb_bb", t: "Il BB 3-betta, la SB 4-betta a 22bb, il BB chiama", four: { pos: "SB", ip: false, r: () => hPreW("sb_vs_bb3", 2) }, call: { pos: "BB", ip: true, r: () => svParseRange(CALL4.bb_vs_sb) }, pot: 44, stack: 78 },
];
function hPreW(id, i) { const sp = preT(id), w = {}; if (sp) Object.entries(sp.f).forEach(([k, f]) => { if (f[i] > 0.01) w[k] = f[i]; }); return w; }
/* combo a caso da un range pesato, evitando le carte morte */
function drawCombo(w, dead) {
  const L = []; Object.entries(w).forEach(([k, v]) => hExpand(k).forEach(c => { if (!dead.has(c[0]) && !dead.has(c[1])) L.push([c, v]); }));
  const tot = L.reduce((a, x) => a + x[1], 0); let r = Math.random() * tot;
  for (const [c, v] of L) { r -= v; if (r <= 0) return c; }
  return L.length ? L[L.length - 1][0] : null;
}
function rangeCombos(w, dead, mult) { const out = []; Object.entries(w).forEach(([k, v]) => hExpand(k).forEach(c => { if (!dead.has(c[0]) && !dead.has(c[1])) out.push({ c, w: v, key: k }); })); return out; }
const HKN = { M: "mano forte (doppia coppia o meglio)", T: "top pair buona o overpair", P: "coppia media o top pair con kicker debole", D: "coppia bassa", S: "progetto forte", g: "progetto debole", A: "aria" };
function eqVsRange(hero, board, combos, N) { hEquity(hero, board, combos, N || 160); const t = combos.reduce((a, o) => a + o.w, 0); return t ? combos.reduce((a, o) => a + o.w * o.e, 0) / t : 0.5; }
const bstr = a => a.map(hcstr).join("");
DRILLS.p4bet = {
  name: "4-bet pot", short: "4-bet pot", time: 40,
  desc: "Piatti 4-bet al flop con SPR tra 1 e 2: quando puntare piccolo, quando andare all-in, quando mollare. L'equity è calcolata contro il range avversario.",
  rule: "Con SPR sotto 2 lo stack è quasi già in mezzo: chi ha il vantaggio di range punta piccolo (25%) e prepara l'all-in al turn. Chi difende va all-in o chiama con coppia buona e progetti forti, folda l'aria.",
  sample() {
    const S = pick(P4), role = Math.random() < 0.5 ? "four" : "call";
    for (let k = 0; k < 20; k++) { const b = dealCards(3).map(hcid), dead = new Set(b); const hc = drawCombo((role === "four" ? S.four : S.call).r(), dead); if (hc) return { s: S.id, role, b: bstr(b), h: bstr(hc) }; }
    return null;
  },
  build({ s, role, b, h }) {
    const S = P4.find(x => x.id === s), me = S[role], op = S[role === "four" ? "call" : "four"];
    const board = hsplit(b), hero = hsplit(h), dead = new Set([...board, ...hero]);
    const combos = rangeCombos(op.r(), dead);
    combos.forEach(o => o.cl = hClassify(o.c, board));
    const eq = eqVsRange(hero, board, combos, 160), cl = hClassify(hero, board), spr = S.stack / S.pot;
    const hi = Math.max(...board.map(c => c >> 2)), highBoard = hi >= 10, fv = feat(b.match(/../g));
    let opts, best, why, ctx, evsC = null;
    if (role === "four") {
      ctx = `Sei il 4-bettor (${me.pos}). ${op.ip ? "Tocca a te per primo." : `Il ${op.pos} fa check.`}`;
      opts = [{ label: "Check", v: "x" }, { label: "Bet 25%", v: "b" }, { label: "All-in", v: "j" }];
      const strong = ["M", "T", "S"].includes(cl.k) || (cl.bk === "P" && eq >= 0.55);
      const vals = board.map(c => c >> 2).sort((x, y) => y - x), midConn = fv.straight && hi <= 9 && hi >= 6;
      if (!midConn) { best = "b"; why = `${highBoard ? `Board alto (${RN(hi + 2)}-high)` : fv.paired ? "Board accoppiato" : "Board basso e poco connesso"}: il range del 4-bettor (AA, KK, QQ, AK) domina quello di chi chiama (QQ-99, AQ, AJ, KQ), che qui ha poche doppie e pochi set. Si punta piccolo con tutto il range: 25% bastano, con SPR ${fmtN(Math.round(spr * 10) / 10)} lo stack entra al turn.`; }
      else if (strong) { best = "b"; why = `Board medio connesso (${RN(vals[0] + 2)}${RN(vals[1] + 2)}${RN(vals[2] + 2)}) che colpisce i JJ-99 e i suited di chi chiama, ma la tua mano (${HKN[cl.k]}) ha il ${pct(eq)}%: punta 25% per valore e protezione, l'all-in arriva al turn.`; }
      else { best = "x"; why = `Board medio connesso (${RN(vals[0] + 2)}${RN(vals[1] + 2)}${RN(vals[2] + 2)}): è quello che colpisce di più chi chiama (set, doppie, progetti). Con ${HKN[cl.k]} e il ${pct(eq)}% fai check: puntare fa foldare le mani peggiori e ti fa check-raisare da quelle migliori.`; }
      why += " L'all-in al flop con SPR così basso non serve: fa foldare proprio le mani che vuoi far pagare.";
    } else {
      const bet = Math.round(S.pot * 0.3 * 10) / 10, need = bet / (S.pot + 2 * bet);
      ctx = `Hai chiamato il 4-bet (${me.pos}). ${me.ip ? `Il ${op.pos} punta ${bb(bet)} (30%).` : `Fai check, il ${op.pos} punta ${bb(bet)} (30%).`}`;
      opts = [{ label: "Fold", v: "f" }, { label: `Call ${bb(bet)}`, v: "c" }, { label: "All-in", v: "j" }];
      // chi punta: range quasi intero; all-in: lui chiama con coppie buone e progetti
      const callJ = combos.map(o => ["M", "T", "S"].includes(o.cl.k) || (o.cl.bk === "P" && (o.c[0] >> 2) === (o.c[1] >> 2)) ? 1 : o.cl.bk === "P" ? 0.5 : 0);
      let tw = 0, cw = 0, ce = 0; combos.forEach((o, i) => { tw += o.w; cw += o.w * callJ[i]; ce += o.w * callJ[i] * o.e; });
      const F = tw ? 1 - cw / tw : 0, eqC = cw ? ce / cw : eq;
      const evJ = F * (S.pot + bet) + (1 - F) * (eqC * (S.pot + 2 * S.stack) - S.stack), evC = eq * 0.95 * (S.pot + 2 * bet) - bet;
      const evs = { f: 0, c: evC, j: evJ };
      best = Object.entries(evs).reduce((a, x) => x[1] > a[1] ? x : a)[0];
      why = `Contro il range del 4-bettor hai il <b>${pct(eq)}%</b> di equity; per chiamare ne serve il ${pct(need)}%. All-in: folda il ${pct(F)}% del suo range e contro chi chiama hai il ${pct(eqC)}%. EV stimati: fold 0, call ${fmtN(Math.round(evC * 10) / 10)}bb, all-in ${fmtN(Math.round(evJ * 10) / 10)}bb.`;
      why += best === "j" ? " Con SPR basso la mano forte va messa dentro subito: prendi valore e togli equity ai suoi overcard." : best === "c" ? " Chiamare tiene dentro i suoi bluff e le mani peggiori; sul turn decidi con più informazioni." : " Non hai abbastanza equity: il 4-bet pot non si difende con l'aria.";
      evsC = evs;
    }
    return {
      title: `4-bet pot · ${role === "four" ? "4-bettor" : "difesa"}`,
      body: `<p class="ctx">${esc(S.t)}. Piatto ${bb(S.pot)}, stack ${bb(S.stack)} (SPR ${fmtN(Math.round(spr * 10) / 10)}). ${esc(ctx)}</p>` + tableHtml([{ lbl: "Flop", cards: b }, { hero: 1, lbl: "La tua mano", cards: h }]),
      layout: "cols3", center: true, opts, timed: false,
      check(v) {
        const ok = v === best, alt = evsC && Math.abs((evsC[v] ?? -99) - evsC[best]) < 0.5;
        return { score: ok ? 100 : alt ? 60 : 0, correct: best, expl: `<p><b>${opts.find(o => o.v === best).label}.</b> ${why}</p><p class="muted" style="font-size:13px">La tua mano: ${HKN[cl.k]}. Range di chi chiama il 4-bet: stime di riferimento (le tabelle non coprono questo spot).</p>` };
      },
    };
  },
};
DRILLS.bvb3 = {
  name: "3-bet pot BvB fuori posizione", short: "BvB 3bp", time: 40,
  desc: "Hai aperto dalla SB, il BB ti 3-betta e chiami: fuori posizione in un 3-bet pot. Contro la c-bet decidi fold, call o check-raise con l'equity contro il suo range.",
  rule: "Fuori posizione realizzi meno equity: al call serve un margine. Check-raise con mani forti (doppia coppia o meglio) e progetti forti con tanta equity; call con coppie e progetti decenti; fold l'aria senza backdoor. Size del check-raise al flop: 25% (raddoppio) sui board senza connessioni, 35% con connessioni basse, 55% sui board con doppia broadway o alti e connessi.",
  sample() {
    const turn = Math.random() < 0.4;
    for (let k = 0; k < 20; k++) { const b = dealCards(turn ? 4 : 3).map(hcid), dead = new Set(b); const hc = drawCombo(hPreW("sb_vs_bb3", 1), dead); if (hc) return { b: bstr(b), h: bstr(hc), big: !turn && Math.random() < 0.3 }; }
    return null;
  },
  xrSize(b) {
    const rs = (b.match(/../g) || []).slice(0, 3).map(c => "23456789TJQKA".indexOf(c[0]) + 2).sort((x, y) => y - x);
    const su = (b.match(/../g) || []).slice(0, 3).map(c => c[1]);
    const [hi, mid, lo] = rs, paired = new Set(rs).size < 3;
    const tt = new Set(su).size <= 2, highConn = hi >= 9 && hi - mid <= 2 && (tt || hi - lo <= 4);
    if (!paired && (rs.filter(r => r >= 10).length >= 2 || highConn)) return { s: 0.55, why: "board con doppia broadway o alto e connesso: ti polarizzi" };
    if (!paired && ((mid <= 8 && mid - lo <= 2) || (hi <= 9 && hi - mid <= 2))) return { s: 0.35, why: "connessioni basse: rilancio più grande per proteggere il valore" };
    return { s: 0.25, why: "board senza connessioni particolari: raddoppio, per rilanciare anche il valore più sottile" };
  },
  build({ b, h, big }) {
    const board = hsplit(b), hero = hsplit(h), dead = new Set([...board, ...hero]), turn = board.length === 4;
    const pot0 = 18, flopB = big ? 0.66 : 0.33;
    let pot = pot0, bet;
    let combos = rangeCombos(hPreW("bb_sb", 2), dead);
    const fl = board.slice(0, 3);
    combos.forEach(o => { o.cl = hClassify(o.c, fl); const m = { M: 1, T: 1, P: 0.75, D: 0.6, S: 0.95, g: 0.7, A: 0.6 }[o.cl.k]; o.w *= m; });
    if (turn) { const fb = Math.round(pot0 * 0.33 * 10) / 10; pot = pot0 + 2 * fb; combos.forEach(o => { o.cl = hClassify(o.c, board); o.w *= HW.bet[o.cl.k] ?? 0.35; }); bet = Math.round(pot * 0.66 * 10) / 10; }
    else { combos.forEach(o => o.cl = hClassify(o.c, board)); bet = Math.round(pot0 * flopB * 10) / 10; }
    combos = combos.filter(o => o.w > 0.01);
    const eq = eqVsRange(hero, board, combos, turn ? null : 160), cl = hClassify(hero, board);
    const need = bet / (pot + 2 * bet), R = turn ? 0.9 : 0.8;
    const xr = turn ? null : DRILLS.bvb3.xrSize(b);
    const raiseTo = turn ? Math.round(bet * 3.5 * 10) / 10 : Math.round((bet + xr.s * (pot + 2 * bet)) * 10) / 10;
    let best;
    if (cl.k === "M" && eq >= 0.55) best = "r";
    else if (cl.dr === 2 && eq >= (turn ? 0.45 : 0.42)) best = "r";
    else if (eq * R >= need) best = "c";
    else best = "f";
    const beat = combos.reduce((a, o) => a + (o.e < 0.5 ? o.w : 0), 0) / combos.reduce((a, o) => a + o.w, 0);
    const sizeTxt = xr ? ` Size ${Math.round(xr.s * 100)}% (a ${bb(raiseTo)}): ${xr.why}.` : "";
    const why = best === "r" ? `${cl.k === "M" ? "Mano forte" : "Progetto forte"} con il ${pct(eq)}% contro il suo range: check-raise. ${cl.k === "M" ? "Prendi valore dalle sue top pair e overpair, che non foldano." : "Tanta equity più fold equity: il semi-bluff migliore."}${sizeTxt}` : best === "c" ? `Hai il ${pct(eq)}% di equity e, fuori posizione, ne realizzi circa il ${pct(R)}%: ${pct(eq * R)}% contro il ${pct(need)}% che serve. Call: la mano è troppo buona per foldare e non abbastanza per il raise.` : `Hai il ${pct(eq)}% di equity, fuori posizione ne realizzi circa ${pct(eq * R)}%, ma per chiamare serve il ${pct(need)}%. Fold: contro un range da 3-bet l'aria senza equity non si difende.`;
    return {
      title: `BvB 3-bet pot · ${turn ? "turn" : "flop"}`,
      body: `<p class="ctx">Hai aperto 3bb dalla SB, il BB ha 3-bettato a 9bb e hai chiamato. ${turn ? `Al flop hai fatto check-call di una c-bet del 33%. Turn: fai check, il BB punta ${bb(bet)} (66%) in un piatto di ${bb(pot)}.` : `Flop: fai check, il BB punta ${bb(bet)} (${Math.round(flopB * 100)}%) in un piatto di ${bb(pot)}.`}</p>` + tableHtml([{ lbl: turn ? "Board" : "Flop", cards: b }, { hero: 1, lbl: "La tua mano", cards: h }], { hero: "SB", vil: "BB", pot, inv: turn ? 9 + (pot - pot0) / 2 : 9, bets: { BB: bet }, tags: { BB: "Bet" } }),
      layout: "cols3", center: true, opts: [{ label: "Fold", v: "f" }, { label: `Call ${bb(bet)}`, v: "c" }, { label: `Check-raise a ${bb(raiseTo)}`, v: "r" }], timed: false,
      check(v) {
        const close = Math.abs(eq * R - need) < 0.03 && ["f", "c"].includes(v) && ["f", "c"].includes(best);
        return { score: v === best ? 100 : close ? 60 : 0, correct: best, expl: `<p><b>${best === "r" ? "Check-raise" : best === "c" ? "Call" : "Fold"}.</b> ${why}</p><p class="muted" style="font-size:13px">La tua mano: ${HKN[cl.k]}. Il suo range di ${turn ? "barrel" : "c-bet"} ti batte il ${pct(beat)}% delle volte. Range: 3-bet del BB vs SB dalle tabelle GTO, ristretto dalle sue puntate.</p>` };
      },
    };
  },
};

/* ---- I miei dati: import mani + pool ---- */
function renderData() {
  const n = HANDS.hands.length, nd = HANDS.hands.reduce((a, h) => a + (h.dec || []).length, 0);
  const f = POOL?.f || {};
  const mdf = s => Math.round(s / (1 + s) * 100);
  let h = `<div class="two"><section class="panel"><div class="eyebrow">Le tue mani</div><h3 style="margin:4px 0 8px">Importa hand history</h3>
  <p style="margin:0 0 8px;font-size:15px;color:var(--ink2)">Carica i file .txt delle hand history di <b>GGPoker</b> o <b>PokerStars</b> (in inglese; puoi selezionarne molti insieme) oppure incolla il testo delle mani esportate da HM3. Ogni tua decisione dal flop in poi diventa un esercizio.</p>
  <input type="file" id="hhFile" accept=".txt,text/plain" multiple aria-label="File delle hand history (.txt)" style="margin:6px 0 10px">
  <textarea id="hhText" placeholder="PokerStars Hand #...: Hold'em No Limit ($0.10/$0.25 USD) ..."></textarea>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn primary" id="hhImport">Importa</button>${n ? `<button class="btn" data-free="hands">Allena sulle tue mani</button>` : ""}</div>
  <p id="hhMsg" style="font-size:14px;margin:10px 0 0">${n ? `<b>${n}</b> mani salvate, <b>${nd}</b> decisioni da rivedere.` : "Nessuna mano importata."}</p>
  ${n ? `${(() => { const vs = HANDS.hands.slice(-10).map(x => hVote(x)).filter(Boolean); return vs.length ? `<p class="hv-avg">Voto medio delle ultime mani: <b class="${hVoteTier(Math.round(vs.reduce((a, b) => a + b.v, 0) / vs.length))}">${fmt(vs.reduce((a, b) => a + b.v, 0) / vs.length, 1)}/10</b> <span class="muted">(${vs.length} mani con decisioni postflop)</span></p>` : ""; })()}<div class="list-hands">${HANDS.hands.map((x, i) => [x, i]).slice(-10).reverse().map(([x, i]) => `<div class="lh"><span>${icHand(x.hero)} · ${esc(x.pos)} · ${esc(x.stakes)}</span><span class="lh-r"><span class="mono muted">${(x.dec || []).length} decisioni</span>${hVoteBadge(hVote(x), i)}</span></div>`).join("")}</div><p style="margin-top:10px"><button class="btn ghost" id="hhClear" style="padding:5px 10px;font-size:13px">Cancella le mani</button> <span id="hhClearC"></span></p>` : ""}
  <p class="note">Nel client PokerStars la lingua delle hand history si imposta nelle opzioni di storico mani. Le mani restano salvate con questa pagina e servono solo al tuo allenamento.</p></section>
  <section class="panel"><div class="eyebrow">Il tuo pool</div><h3 style="margin:4px 0 8px">Taratura NL25</h3>
  <p style="margin:0 0 10px;font-size:15px;color:var(--ink2)">Dal report di popolazione del tuo tracker, inserisci quanto spesso il pool folda al river contro ogni size. Con almeno 3 valori nel Laboratorio size compare il profilo <b>Il tuo pool NL25</b>.</p>
  <div class="formgrid">${[[0.33, "1/3 pot"], [0.5, "1/2 pot"], [0.75, "3/4 pot"], [1, "Pot"], [1.5, "Overbet"]].map(([s, l]) => `<label for="pf-${String(s).replace(".", "_")}">${l}<input type="number" id="pf-${String(s).replace(".", "_")}" min="0" max="100" step="1" value="${f[s] ?? ""}" placeholder="${mdf(s)}"><small>fold % · teoria ${mdf(s)}%</small></label>`).join("")}</div>
  <div style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap"><button class="btn primary" id="poolSave">Salva il pool</button><span id="poolMsg" class="muted" style="font-size:14px">${poolReady() ? "Profilo pool attivo." : "Profilo pool non ancora attivo."}</span></div>
  <p class="note">Il placeholder mostra quanto folderebbe un avversario teorico (break-even del bluff). Se il tuo pool folda di più, i bluff grandi rendono; se folda di meno, punta più value e meno bluff.</p>
  <div class="rule" style="margin-top:10px"><b>Riferimento</b> (REG NL50, BB contro il terzo barrel): folda il 31% contro 30% pot, il 55% contro 70% e il 69% contro 150%. <button class="btn" id="poolCourse" style="margin-left:6px;padding:4px 10px;font-size:13px">Usa questi valori</button></div></section></div>` + bkPanel() + (tlSite() ? "" : `<section class="panel" style="margin-top:14px"><div class="eyebrow">Modalità test</div><h3 style="margin:4px 0 6px">${tlTest() ? "🔓 Tutto sbloccato" : "Sblocca tutto per provare"}</h3><p style="margin:0 0 10px;color:var(--ink2);font-size:14.5px">${tlTest() ? "Livelli, lezioni extra, NL1000 e drill liberi sono aperti. I progressi restano quelli veri." : "Inserisci il codice per aprire tutti i livelli, le lezioni extra e i drill senza superare gli esami."}</p><div style="display:flex;gap:8px;flex-wrap:wrap">${tlTest() ? `<button class="btn ghost" id="tlTestOff">Disattiva la modalità test</button>` : `<input id="tlTestCode" type="password" placeholder="Codice" autocomplete="off" style="font:inherit;padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink);width:160px"><button class="btn" id="tlTestOn">Sblocca</button>`}</div><p id="tlTestMsg" class="muted" style="margin:8px 0 0;font-size:13.5px"></p></section>`);
  $("#view").innerHTML = h;
  bkBind();
  if ($("#tlTestOn")) { const go = () => { if ($("#tlTestCode").value.trim().toLowerCase() === ORCA_TEST_CODE) { lsSet("orca_test", 1); DRILL_LVL = null; renderData(); gToast("🔓 Modalità test attiva: tutto sbloccato."); } else $("#tlTestMsg").textContent = "Codice non valido."; }; $("#tlTestOn").onclick = go; $("#tlTestCode").onkeydown = e => { if (e.key === "Enter") go(); }; }
  if ($("#tlTestOff")) $("#tlTestOff").onclick = () => { lsSet("orca_test", 0); renderData(); gToast("Modalità test disattivata."); };
  $("#hhImport").onclick = importHands;
  $("#poolCourse").onclick = () => { [[0.33, 31], [0.5, 44], [0.75, 56], [1, 61], [1.5, 69]].forEach(([s, v]) => $("#pf-" + String(s).replace(".", "_")).value = v); $("#poolMsg").textContent = "Valori di riferimento inseriti: premi Salva il pool."; };
  $("#poolSave").onclick = () => {
    const nf = {}; let bad = false;
    [0.33, 0.5, 0.75, 1, 1.5].forEach(s => { const v = $("#pf-" + String(s).replace(".", "_")).value.trim(); if (v === "") return; const x = +v; if (!(x >= 0 && x <= 100)) bad = true; else nf[s] = x; });
    if (bad) { $("#poolMsg").textContent = "Inserisci percentuali tra 0 e 100."; return; }
    POOL = { f: nf, updated: today() }; persistPool();
    $("#poolMsg").textContent = poolReady() ? "Salvato. Il profilo pool è attivo nel Laboratorio size." : "Salvato. Servono almeno 3 valori per attivare il profilo.";
  };
  if ($("#hhClear")) $("#hhClear").onclick = () => { $("#hhClearC").innerHTML = `Sicuro? <button class="btn" id="hhClearY" style="padding:4px 10px;font-size:13px">Sì, cancella</button>`; $("#hhClearY").onclick = () => { HANDS = { hands: [], _reset: Date.now() }; persistHands(); renderData(); }; };
}
async function importHands() {
  let text = $("#hhText").value || "";
  const files = $("#hhFile").files;
  for (const f of files || []) { try { text += "\n\n" + await f.text(); } catch (e) {} }
  const parsed = parseHH(text);
  if (!parsed.length) { $("#hhMsg").innerHTML = `Nessuna mano riconosciuta. Servono hand history in inglese di GGPoker ("Poker Hand #…") o PokerStars ("PokerStars Hand #…"), con la riga "Dealt to" delle tue carte.`; return; }
  const ids = new Set(HANDS.hands.map(h => h.id));
  const fresh = parsed.filter(h => !ids.has(h.id));
  HANDS.hands = [...HANDS.hands, ...fresh].slice(-300);
  persistHands();
  renderData();
  $("#hhMsg").innerHTML = `Importate <b>${fresh.length}</b> mani nuove (${parsed.length - fresh.length} già presenti). Decisioni postflop totali: <b>${HANDS.hands.reduce((a, h) => a + h.dec.length, 0)}</b>. <span id="errProg"></span> Gli errori li trovi nella scheda <b>Errori</b>.`;
  analyzeAllAsync(() => { const el = $("#errProg"); if (el) { const n = hErrList().length; const vs = fresh.map(x => hVote(x)).filter(Boolean); el.innerHTML = `Analisi completata: ${n} errori o imprecisioni.${vs.length ? ` Voto medio delle mani importate: <b>${fmt(vs.reduce((a, b) => a + b.v, 0) / vs.length, 1)}/10</b>.` : ""}`; } });
}
function parseHH(text) {
  /* PokerStars ("PokerStars Hand #123") e GGPoker ("Poker Hand #RC123", "GGPoker Hand #...") */
  const chunks = text.split(/(?=(?:PokerStars (?:Zoom |Home Game )?|GGPoker |Poker )Hand #)/).filter(c => /Dealt to .+? \[/.test(c));
  const out = [];
  const num = s => parseFloat(String(s).replace(/[^\d.]/g, ""));
  for (const c of chunks) {
    try {
      const lines = c.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const hm = lines[0].match(/Hand #([A-Z]*\d+).*?\(([$€£]?)([\d.]+)\/([$€£]?)([\d.]+)/);
      if (!hm) continue;
      const BB = parseFloat(hm[5]);
      const btn = +(c.match(/Seat #(\d+) is the button/) || [])[1];
      const seats = [];
      for (const l of lines) { const m = l.match(/^Seat (\d+): (.+?) \([$€£]?([\d.]+) in chips/); if (m) seats.push({ seat: +m[1], name: m[2], stack: num(m[3]) }); }
      const dm = c.match(/Dealt to (.+?) \[(\w\w) (\w\w)\]/); if (!dm) continue;
      const heroName = dm[1], hero = dm[2] + dm[3];
      seats.sort((a, b) => a.seat - b.seat);
      const bi = seats.findIndex(s => s.seat === btn);
      const order = { 2: ["BTN", "BB"], 3: ["BTN", "SB", "BB"], 4: ["BTN", "SB", "BB", "CO"], 5: ["BTN", "SB", "BB", "HJ", "CO"], 6: ["BTN", "SB", "BB", "UTG", "HJ", "CO"] }[seats.length] || [];
      const pos = {}; seats.forEach((s, i) => { pos[s.name] = order[(i - bi + seats.length) % seats.length] || ("Seat " + s.seat); });
      const P = n => n === heroName ? "Tu" : pos[n] || n;
      let st = 0, board = "", pot = 0, street = {}, maxC = 0;
      const stack = {}; seats.forEach(s => stack[s.name] = s.stack);
      const hist = [[], [], [], []]; const dec = []; const SN = ["Preflop", "Flop", "Turn", "River"];
      const newStreet = () => { street = {}; maxC = 0; };
      const potNow = () => pot + Object.values(street).reduce((a, b) => a + b, 0);
      const histLines = () => hist.map((a, i) => a.length ? `${SN[i]}: ${a.join(" · ")}` : null).filter(Boolean);
      for (const l of lines) {
        let m;
        if (/^\*\*\* (HOLE CARDS)/.test(l)) continue;
        if ((m = l.match(/^\*\*\* (FLOP|TURN|RIVER) \*\*\* \[([^\]]+)\](?: \[([^\]]+)\])?/))) {
          pot = potNow(); newStreet(); st = { FLOP: 1, TURN: 2, RIVER: 3 }[m[1]];
          board = (m[2] + (m[3] ? " " + m[3] : "")).replace(/\s+/g, "");
          continue;
        }
        if (/^\*\*\* (SHOW DOWN|SUMMARY)/.test(l)) break;
        if ((m = l.match(/^(.+?): posts (?:small blind|big blind|the ante|small & big blinds) [$€£]?([\d.]+)/))) { const a = num(m[2]); if (/ante/.test(l)) { pot += a; } else { street[m[1]] = (street[m[1]] || 0) + a; maxC = Math.max(maxC, street[m[1]]); } stack[m[1]] -= a; continue; }
        if ((m = l.match(/^(.+?): (folds|checks|calls|bets|raises)(?: [$€£]?([\d.]+))?(?: to [$€£]?([\d.]+))?/))) {
          const [, who, act] = m;
          if (who === heroName && st >= 1) {
            const toCall = Math.max(0, maxC - (street[who] || 0));
            const p = potNow();
            let amt = 0;
            if (act === "bets") amt = num(m[3]); if (act === "raises") amt = num(m[4]); if (act === "calls") amt = num(m[3]);
            dec.push({ st, board, pot: p / BB, toCall: toCall / BB, stack: stack[who] / BB, hist: histLines(), act: act === "bets" ? "bet" : act === "raises" ? "raise" : act === "calls" ? "call" : act === "checks" ? "check" : "fold", amt: amt / BB, ratio: act === "bets" ? num(m[3]) / p : act === "raises" ? num(m[4]) / (p + toCall) : 0 });
          }
          let txt = act === "folds" ? "fold" : act === "checks" ? "check" : act === "calls" ? `call ${fmt(num(m[3]) / BB, 1)}` : act === "bets" ? `punta ${fmt(num(m[3]) / BB, 1)}` : `rilancia a ${fmt(num(m[4]) / BB, 1)}`;
          if (act !== "folds" || who === heroName || st > 0) hist[st].push(`${P(who)} ${txt}`);
          if (act === "calls") { const a = num(m[3]); street[who] = (street[who] || 0) + a; stack[who] -= a; }
          if (act === "bets") { const a = num(m[3]); street[who] = (street[who] || 0) + a; stack[who] -= a; maxC = Math.max(maxC, street[who]); }
          if (act === "raises") { const to = num(m[4]); stack[who] -= to - (street[who] || 0); street[who] = to; maxC = to; }
          continue;
        }
        if ((m = l.match(/^Uncalled bet \([$€£]?([\d.]+)\) returned to (.+)$/))) { const a = num(m[1]); street[m[2]] = (street[m[2]] || 0) - a; }
      }
      dec.forEach(d => { d.pot = Math.round(d.pot * 10) / 10; d.toCall = Math.round(d.toCall * 10) / 10; d.stack = Math.round(d.stack * 10) / 10; d.amt = Math.round(d.amt * 10) / 10; d.ratio = Math.round(d.ratio * 100) / 100; });
      const shown = {}; for (const l of lines) { const sm = l.match(/^(.+?): shows \[(\w\w) (\w\w)\]/); if (sm && sm[1] !== heroName) shown[pos[sm[1]] || sm[1]] = sm[2] + sm[3]; }
      const names = {}; seats.forEach(s => { if (s.name !== heroName) names[pos[s.name]] = s.name; });
      if (dec.length) out.push({ id: hm[1], shown, names, stakes: `NL${Math.round(BB * 100)} (${hm[2] || hm[4] || ""}${hm[3]}/${hm[5]})`, pos: pos[heroName] || "?", hero, dec });
    } catch (e) { /* mano non leggibile: saltata */ }
  }
  return out;
}

function lineChart(vals) {
  const W = 560, H = 170, pl = 34, pr = 10, pt = 14, pb = 26;
  if (!vals.length) return `<p class="muted">Completa una sessione per vedere l'andamento.</p>`;
  const n = vals.length, x = i => pl + (n === 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (n - 1)), y = v => pt + (100 - v) * (H - pt - pb) / 100;
  let g = ""; [0, 50, 80, 100].forEach(v => { g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1" ${v === 80 ? 'stroke-dasharray="4 4"' : ""}/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="JetBrains Mono,monospace">${v}</text>`; });
  const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const last = vals[n - 1];
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Punteggio delle ultime sessioni">${g}${n > 1 ? `<polygon points="${x(0)},${y(0)} ${pts} ${x(n - 1)},${y(0)}" fill="var(--acc)" opacity=".10"/>` : ""}<polyline points="${pts}" fill="none" stroke="var(--acc)" stroke-width="2"/>${vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="${i === n - 1 ? 5 : 3.5}" fill="var(--acc)" stroke="var(--surface)" stroke-width="2"><title>${v}%</title></circle>`).join("")}<text x="${x(n - 1)}" y="${y(last) - 10}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)" font-family="JetBrains Mono,monospace">${last}%</text><text x="${W - pr}" y="${H - 6}" text-anchor="end" font-size="11" fill="var(--muted)">tratteggio: soglia 80%</text></svg>`;
}
