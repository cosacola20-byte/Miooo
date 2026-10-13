/* ================= ALLENATI (Practice ================= */
const GW_GRADE = [[0.005, "Mossa migliore", "#3fd07a", "✔✔"], [0.02, "Mossa corretta", "#8fdc6e", "✔"], [0.05, "Imprecisione", "#f0c24b", "!"], [0.12, "Mossa sbagliata", "#f08a4b", "!!"], [9, "Errore grave", "#ff5c5c", "▲"]];
function gwPracState() {
  return GW.prac || (GW.prac = { mode: "hand", diff: "std", input: "act", pause: "mistake", side: 1, showStrat: false, st: { hands: 0, moves: 0, grades: [0, 0, 0, 0, 0], loss: 0, lossPot: 0 }, hist: [], hand: null, fv: null });
}
/* gruppi di azioni secondo la difficoltà */
function gwPracGroups(n, E, diff) {
  const acts = n.acts.map((a, k) => ({ a, k }));
  if (diff === "std") return acts.map(x => ({ lab: gwLab(x.a, E, n), col: gwCol(x.a), ks: [x.k] }));
  const G = [], add = (key, lab, col, k) => { let g = G.find(x => x.key === key); if (!g) { g = { key, lab, col, ks: [] }; G.push(g); } g.ks.push(k); };
  acts.forEach(({ a, k }) => {
    if (a.kind === "fold") add("f", "Fold", gwCol(a), k);
    else if (a.kind === "check") add("x", "Check", gwCol(a), k);
    else if (a.kind === "call") add("c", "Call", gwCol(a), k);
    else if (diff === "simple") add("agg", n.acts.some(b => b.kind === "call") ? "Raise" : "Bet", "#c43b2c", k);
    else if (a.kind === "raise" || (a.kind === "allin" && n.acts.some(b => b.kind === "call"))) add("r", a.kind === "allin" ? "Raise (all-in)" : "Raise", gwCol(a), k);
    else { const f = a.frac || 9; const c = a.kind === "allin" ? ["ai", "All-in"] : f <= 0.4 ? ["s", "Bet piccola"] : f <= 0.8 ? ["m", "Bet media"] : f <= 1.2 ? ["l", "Bet grande"] : ["o", "Overbet"]; add(c[0], c[1], gwCol(a), k); }
  });
  return G;
}
function gwPracNode(H) { let n = H.L.E.tree.root; for (const k of H.steps) n = n.ch[k]; return n; }
function gwPracNew() {
  const PR = gwPracState();
  /* prova: ogni tot decisioni si cambia spot; lato a caso se richiesto */
  if (PR.prova && !PR.prova.done) { if (PR.prova.next) { gwProvaLoad(gwProvaById(PR.prova.id)); return; } const PP = gwProvaById(PR.prova.id); if (PP && PP.side === "rand") PR.side = Math.random() < 0.5 ? 0 : 1; }
  const L = gwLayer(), E = L.E, G = E.G;
  let steps = [], hero = PR.side;
  if (PR.mode === "spot") { let n = E.tree.root; const ok = []; for (const k of L.steps) { if (n.t !== "a" && n.t !== "c") break; ok.push(k); n = n.ch[k]; } if (n.t === "a") { steps = ok; hero = n.pl; } }
  const { r } = msReach(E, steps);
  const pick = (p, avoid) => { let tot = 0; for (let i = 0; i < G.n[p]; i++) { if (avoid && (avoid.has(G.c0[p][i]) || avoid.has(G.c1[p][i]))) continue; tot += r[p][i]; } let x = Math.random() * tot; for (let i = 0; i < G.n[p]; i++) { if (avoid && (avoid.has(G.c0[p][i]) || avoid.has(G.c1[p][i]))) continue; x -= r[p][i]; if (x <= 0) return i; } return -1; };
  const F = PR.fixed && PR.fixed.L === L ? PR.fixed : null;
  if (F) { hero = F.hero; steps = (F.steps || []).slice(); }
  const h = F ? gwProbHeroIdx(G, F) : pick(hero, null); if (h < 0) return;
  const v = pick(1 - hero, new Set([G.c0[hero][h], G.c1[hero][h]])); if (v < 0) return;
  PR.hand = { L, hero, h, v, steps: steps.slice(), start: steps.length, fb: null, done: null, busy: false, h0: PR.hist.length };
  PR.fv = null; PR.st.hands++;
  gwPracAdvance();
}
function gwPracAdvance() {
  const PR = GW.prac, H = PR.hand; if (!H) return;
  const E = H.L.E, G = E.G, hero = H.hero;
  let n = gwPracNode(H);
  for (let guard = 0; guard < 60; guard++) {
    if (n.t === "a" && n.pl === hero) return;
    const ri = H.steps.length, same = H.replay && H.replay.length > ri && H.replay.slice(0, ri).every((x, q) => x === H.steps[q]);
    if (n.t === "a") { let k = 0; if (same) k = H.replay[ri]; else { const np = G.n[n.pl], st = msAvg(n, np); let x = Math.random(); for (; k < n.acts.length - 1; k++) { x -= st[k * np + H.v]; if (x <= 0) break; } } H.steps.push(k); H.rec = H.steps.slice(); n = n.ch[k]; continue; }
    if (n.t === "c") {
      if (PR.mode === "street") { H.done = { type: "street" }; return; }
      const dead = new Set([G.c0[hero][H.h], G.c1[hero][H.h], G.c0[1 - hero][H.v], G.c1[1 - hero][H.v]]);
      const ok = n.deal.map((c, k) => [c, k]).filter(([c]) => !dead.has(c));
      if (!ok.length) { H.done = { type: "street" }; return; }
      const k = same && ok.some(x => x[1] === H.replay[ri]) ? H.replay[ri] : ok[Math.floor(Math.random() * ok.length)][1]; H.steps.push(k); H.rec = H.steps.slice(); n = n.ch[k]; continue;
    }
    const pot = E.o.pot + n.inv[0] + n.inv[1];
    if (n.t === "f") { H.done = { type: "fold", heroWins: n.folder !== hero, pot }; return; }
    const bd = [...G.board, ...n.cards];
    if (bd.length < 5) { H.done = { type: n.inv[0] >= E.o.stack - 1e-9 ? "allin" : "street", pot }; return; }
    const a = hEval([G.c0[hero][H.h], G.c1[hero][H.h], ...bd]), b = hEval([G.c0[1 - hero][H.v], G.c1[1 - hero][H.v], ...bd]);
    H.done = { type: "sd", res: a > b ? 1 : a < b ? -1 : 0, pot }; return;
  }
}
function gwPracMain() {
  const PR = gwPracState(), L = gwLayer(), E = L.E, G = E.G, names = [L.oop, L.ip];
  if (PR.hand && PR.hand.L !== L) PR.hand = null;
  const H = PR.hand, S = PR.st;
  const seg = (k, opts) => `<div class="gwseg">${opts.map(([v, l]) => `<button class="${PR[k] === v ? "on" : ""}" data-gpo="${k}:${v}">${l}</button>`).join("")}</div>`;
  const good = S.grades[0] + S.grades[1], bad = S.moves - good;
  const score = S.moves ? Math.max(0, 100 - S.lossPot / S.moves * 400) : 0;
  /* colonna sinistra: controlli e statistiche */
  const nDue = gwRevDue().length, canRand = !GW.direct && (() => { try { return !!gwPre().flop; } catch (e) { return false; } })();
  let left = `${nDue || canRand ? `<div class="gwpanel gwtrain">${canRand ? `<button class="gwbtn" data-grandflop="1">🎲 Flop casuale</button><p class="gwmuted" style="margin:4px 0 8px">Stesso spot preflop, un flop nuovo scelto con la frequenza reale dei board.</p>` : ""}${nDue ? `<button class="gwbtn ghost" data-grevgo="1">🔁 Ripasso errori (${nDue})</button>` : ""}</div>` : ""}<div class="gwpanel"><div class="gwhead"><b>⚙ Controlli</b></div>
    <p class="gwmuted" style="margin:0 0 6px">${esc(names[0])} vs ${esc(names[1])}</p>
    <div class="gwrow" style="margin:0 0 8px;gap:4px"><button class="gwico" data-gpn="1" title="Nuova mano">⏭</button><button class="gwico" data-gpr="1" title="Rigioca la mano">↺</button><button class="gwico" data-gpz="1" title="Azzera le statistiche">⏹</button></div>
    <div class="gwpl">Modalità</div>${seg("mode", [["hand", "Mano intera"], ["street", "Street"], ["spot", "Spot"]])}
    <div class="gwpl">Difficoltà</div>${seg("diff", [["std", "Standard"], ["grp", "Raggruppata"], ["simple", "Semplice"]])}
    <div class="gwpl">Come rispondi</div>${seg("input", [["act", "Azioni"], ["freq", "Frequenze"]])}
    <div class="gwpl">Pausa dopo</div>${seg("pause", [["off", "Mai"], ["mistake", "Errore"], ["action", "Ogni azione"]])}
    ${PR.mode === "spot" ? `<p class="gwmuted" style="margin:6px 0 0">Spot: parti dal nodo aperto in Strategia, con la mano del giocatore che deve agire.</p>` : `<div class="gwpl">Giochi come</div><div class="gwseg">${[0, 1].map(p => `<button class="${PR.side === p ? "on" : ""}" data-gps="${p}">${esc(names[p])}</button>`).join("")}</div>`}</div>
    <div class="gwpanel"><div class="gwhead"><b>📊 Statistiche</b></div>
    <div class="gwstat3"><div><span>Mani</span><b>${S.hands}</b></div><div><span>Mosse</span><b>${S.moves}</b></div><div><span>Punteggio GTO</span><b>${S.moves ? fmt(score, 0) + "%" : "0%"}</b></div></div>
    <div class="gwgb"><span style="color:#3fd07a">✔ ${good}</span><div class="gwtrk"><i style="width:${S.moves ? good / S.moves * 100 : 0}%;background:#3fd07a"></i></div></div>
    <div class="gwgb"><span style="color:#ff5c5c">! ${bad}</span><div class="gwtrk"><i style="width:${S.moves ? bad / S.moves * 100 : 0}%;background:#ff5c5c"></i></div></div>
    ${GW_GRADE.map((g, i) => `<div class="gwgr"><i style="color:${g[2]}">${g[3]}</i><b>${S.grades[i]}</b><span>${g[1]}</span></div>`).join("")}
    <div class="gwstat3" style="margin-top:8px"><div><span>EV perso totale</span><b>${fmt(S.loss, 2)}</b></div><div><span>EV perso / mano</span><b>${S.hands ? fmt(S.loss / S.hands, 2) : "0"}</b></div></div></div>`;
  /* colonna centrale: tavolo */
  let center = (PR.prova ? gwProvaBanner(PR) : "") + (PR.fixed && PR.fixed.L === L ? (PR.fixed.rev ? gwRevBanner(PR, H) : gwProbBanner(PR, H)) : "");
  if (!H) center += `<div class="gwtable gwtable-empty"><div class="gwfelt"><div class="gwtmid"><b>${fmtN(E.o.pot)} bb</b><div class="gwbd">${G.board.map(c => gwCardI(c, true)).join("")}</div></div></div><button class="gwbtn gwgo" data-gpn="1">▶ Inizia</button><p class="gwmuted">Il solver gioca l'avversario con la sua strategia; tu decidi e ricevi il voto in EV perso.${E.o.sample ? " Nella soluzione del flop turn e river escono tra le carte risolte." : ""}</p></div>`;
  else {
    const n = gwPracNode(H), hero = H.hero;
    /* replayer: le azioni dell'avversario e le carte arrivano una alla volta */
    if (PR.showH !== H) { PR.showH = H; PR.shown = Math.min(H.start, H.steps.length); PR.replaying = false; }
    if (PR.shown > H.steps.length) PR.shown = H.steps.length;
    const shown = PR.shown, live = shown >= H.steps.length;
    const T = gwPracTable(PR, H, L, names, shown);
    center += T.html;
    if (!live) center += `<div class="gwrp-bar"><span>${PR.replaying ? "▶ Rivedo la mano" : "L'avversario sta giocando..."}</span><button class="gwbtn ghost" data-gpskip="1">Salta ⏭</button></div>`;
    else if (H.fb) {
      const F = H.fb;
      center += `<div class="gwfb3">${gwCoachHtml(H, T.hc)}
        <div class="gwfbrows">${F.rows.map(r => `<div class="gwdet-r ${r.mine ? "mine" : ""}"><span><i style="background:${r.col}"></i>${esc(r.lab)}${r.mine ? " · tua" : ""}</span><div class="gwtrk"><i style="width:${r.f * 100}%;background:${r.col}"></i></div><b>${Math.round(r.f * 100)}%</b><em class="gwmuted">${fmt(r.ev, 2)}</em></div>`).join("")}</div>
        <div class="gwrow" style="justify-content:center"><button class="gwbtn ghost" data-gpr="1">↺ Rigioca la mano</button><button class="gwbtn gwgo" data-gpc2="1">» Continua</button></div></div>`;
    } else if (H.done) {
      const D = H.done;
      const txt = D.type === "fold" ? (D.heroWins ? `L'avversario folda: vinci ${fmtN(D.pot)}bb.` : `Hai foldato.`) : D.type === "sd" ? `Showdown: ${D.res > 0 ? "vinci" : D.res < 0 ? "perdi" : "pareggio"} (piatto ${fmtN(D.pot)}bb).` : D.type === "allin" ? `All-in chiamato: si gira il resto del board.` : `Fine della ${PR.mode === "street" ? "street" : "soluzione"}.`;
      center += `<div class="gwend">${gwHandSummary(PR, H)}<p class="gwend-t">${txt}</p><div class="gwrow" style="justify-content:center"><button class="gwbtn ghost" data-gpr="1">↺ Rigioca</button><button class="gwbtn ghost" data-gprev="1">▶ Rivedi la mano</button><button class="gwbtn gwgo" data-gpn="1">» Mano successiva</button></div><label class="gwauto"><input type="checkbox" data-gpauto="1" ${PR.auto ? "checked" : ""}> Mano successiva automatica${PR.auto ? `<span class="gwauto-bar"><i></i></span>` : ""}</label></div>`;
    } else if (n.t === "a") {
      const Gs = gwPracGroups(n, E, PR.diff);
      const TL = PR.prova && !PR.prova.done && (gwProvaById(PR.prova.id) || {}).tlim;
      if (TL && !H.busy) center += `<div class="gwtimer"><i style="animation-duration:${TL}s"></i></div>`;
      if (H.busy) center += `<p class="gwmuted" style="text-align:center">Calcolo l'EV delle azioni...</p>`;
      else if (PR.input === "act") center += `<div class="gwpacts2">${Gs.map((g, i) => `<button class="gwpa2" data-gpa="${i}" style="--bc:${g.col}"><span>${esc(g.lab.replace(/ \(.*\)$/, ""))}</span>${/\(/.test(g.lab) ? `<small>${esc((g.lab.match(/\((.*)\)/) || [])[1] || "")}</small>` : ""}</button>`).join("")}</div>`;
      else {
        const fv = PR.fv && PR.fv.length === Gs.length ? PR.fv : (PR.fv = Gs.map(() => Math.round(100 / Gs.length)));
        center += gwMultiSlider(Gs, fv);
        center += `<div class="gwrow" style="justify-content:center"><button class="gwbtn gwgo" data-gpfc="1">» Conferma</button></div>`;
      }
    }
  }
  /* colonna destra: info e storico */
  let right = `<div class="gwpanel"><div class="gwhead"><b>ⓘ Info</b></div>
    <label class="gwtog"><input type="checkbox" data-gpss="1" ${PR.showStrat ? "checked" : ""}> Mostra la strategia prima di rispondere</label>`;
  if (H && !H.done && !H.fb) {
    const n = gwPracNode(H);
    if (n.t === "a") {
      const bd = [...G.board, ...n.cards], hc = [G.c0[H.hero][H.h], G.c1[H.hero][H.h]];
      const cat = Math.floor(hEval([...hc, ...bd]) / HK);
      let cls = null; try { cls = hClassify(hc, bd); } catch (e) {}
      right += `<div class="gwpl">La tua mano</div><p style="margin:0">${HCATN[cat]}${cls && HKN[cls.k] ? ` · ${HKN[cls.k]}` : ""}</p>`;
      if (PR.showStrat) { const np = G.n[n.pl], st = msAvg(n, np); right += `<div class="gwpl">Strategia GTO con questa mano</div>` + gwPracGroups(n, E, PR.diff).map(g => { const f = g.ks.reduce((s, k) => s + st[k * np + H.h], 0); return `<div class="gwdet-r"><span><i style="background:${g.col}"></i>${esc(g.lab)}</span><div class="gwtrk"><i style="width:${f * 100}%;background:${g.col}"></i></div><b>${Math.round(f * 100)}%</b></div>`; }).join(""); }
    }
  }
  const hs = PR.hist.map((x, i) => ({ x, i })).filter(({ x }) => PR.hf !== "err" || x.grade >= 2).slice(-40).reverse(), nErr = PR.hist.filter(x => x.grade >= 2).length;
  right += `</div><div class="gwpanel"><div class="gwhead"><b>🕘 Storico</b><div class="gwseg"><button class="${PR.hf !== "err" ? "on" : ""}" data-gph="all">Tutte</button><button class="${PR.hf === "err" ? "on" : ""}" data-gph="err">Errori (${nErr})</button></div></div>${hs.length ? hs.map(({ x, i }) => { const g = GW_GRADE[x.grade]; const open = PR.hopen === i; return `<div class="gwhist${open ? " open" : ""}" data-gpho="${i}"><i style="color:${g[2]}">${g[3]}</i><span class="gwbd">${x.hand.map(c => gwCardI(c)).join("")}</span><span>${esc(x.street)} · ${esc(x.lab)}</span><em>${x.loss > 0.004 ? "-" + fmt(x.loss, 2) : "0"}</em></div>${open && x.rows ? `<div class="gwhdet"><div class="gwrow" style="margin:0 0 6px;gap:10px"><span class="gwbd">${x.board.map(c => gwCardI(c)).join("")}</span><span class="gwmuted">piatto ${fmtN(x.pot)}bb${x.facing > 0 ? ` · da chiamare ${fmtN(x.facing)}bb` : ""}</span></div><b style="color:${g[2]}">${g[1]}</b>${x.loss > 0.004 ? ` <span class="gwmuted">perdi ${fmt(x.loss, 2)}bb (${fmt(x.lossPot * 100, 1)}% del piatto)</span>` : ""}${x.rows.map(r => `<div class="gwdet-r"><span><i style="background:${r.col}"></i>${esc(r.lab)}${r.mine ? " ←" : ""}</span><div class="gwtrk"><i style="width:${r.f * 100}%;background:${r.col}"></i></div><b>${Math.round(r.f * 100)}%</b></div>`).join("")}<p class="gwmuted" style="margin:4px 0 0">Barre: frequenze del solver con quella mano. Freccia: la tua scelta.</p></div>` : ""}`; }).join("") : `<p class="gwmuted">${PR.hf === "err" ? "Nessun errore finora." : "Ancora nessuna decisione."}</p>`}</div>`;
  right += gwTexHtml();
  return `<div class="gwpr"><div class="gwpr-l">${left}</div><div class="gwpr-c">${center}</div><div class="gwpr-r">${right}</div></div>`;
}
function gwPracAnswer(dist) {
  const PR = GW.prac, H = PR.hand, E = H.L.E; if (!H || H.busy) return;
  H.busy = true; renderStudy();
  setTimeout(() => {
    const I = msNodeInfo(E, H.steps, true), np = I.np, n = I.node, i = H.h, Gs = gwPracGroups(n, E, PR.diff);
    const evA = n.acts.map((_, a) => I.evA[a][i] ?? 0);
    const gEv = Gs.map(g => Math.max(...g.ks.map(k => evA[k]))), gBest = Gs.map(g => g.ks.reduce((b, k) => evA[k] > evA[b] ? k : b, g.ks[0]));
    const gF = Gs.map(g => g.ks.reduce((s, k) => s + I.st[k * np + i], 0));
    const best = Math.max(...gEv), my = dist.reduce((s, f, q) => s + f * gEv[q], 0);
    const pot = E.o.pot + n.inv[0] + n.inv[1], loss = Math.max(0, best - my), lossPot = loss / pot;
    const grade = GW_GRADE.findIndex(g => lossPot <= g[0]);
    /* azione che si gioca: quella scelta, o estratta dalla tua distribuzione */
    let x = Math.random(), gi = 0; for (; gi < dist.length - 1; gi++) { x -= dist[gi]; if (x <= 0) break; }
    const k = gBest[gi], bd = [...E.G.board, ...n.cards];
    H.fb = { k, loss, lossPot, grade, rows: Gs.map((g, q) => ({ lab: g.lab, col: g.col, f: gF[q], ev: gEv[q], mine: dist[q] > 0 })) };
    const S = PR.st; S.moves++; S.loss += loss; S.lossPot += Math.min(lossPot, 0.25); S.grades[grade]++;
    PR.hist.push({ board: bd.slice(), pot, facing: n.inv[1 - H.hero] - n.inv[H.hero], lossPot, rows: H.fb.rows.map(r => ({ ...r })), grade, loss, lab: PR.input === "freq" ? Gs.map((g, q) => dist[q] > 0 ? `${g.lab} ${Math.round(dist[q] * 100)}%` : "").filter(Boolean).join(", ") : Gs[gi].lab, hand: [E.G.c0[H.hero][i], E.G.c1[H.hero][i]], street: ["", "", "", "Flop", "Turn", "River"][bd.length] });
    /* combo di giocate perfette: moltiplicatore da 1X a 5X sugli XP */
    const m0 = Math.min(5, 1 + Math.floor((PR.combo || 0) / 5));
    PR.combo = grade <= 1 ? (PR.combo || 0) + 1 : 0;
    const m1 = Math.min(5, 1 + Math.floor(PR.combo / 5)), xp = grade <= 1 ? 2 * m1 + 1 : 1;
    PR.coins = (PR.coins || 0) + xp; PR.lastXp = xp;
    /* fiches: risultato della decisione (EV perso), separato dagli XP */
    try { const bd = brGrade(grade); PR.lastBr = bd; PR.brSess = (PR.brSess || 0) + bd; gAddXP(xp); if (bd) brAdd(bd); persistSoon(); } catch (e) {}
    try { if (m1 > m0) { gSnd.combo(); gConfetti(1400); } else if (grade <= 1) gSnd.ok(); else gSnd.bad(); } catch (e) {}
    /* texture, ripasso: la prima decisione di uno spot da ripassare aggiorna il suo intervallo, gli errori nuovi entrano nel ripasso */
    try {
      gwTexRec(E, lossPot);
      if (PR.prova) gwProvaTick(grade, lossPot, E);
      const F = PR.fixed && PR.fixed.L === H.L ? PR.fixed : null;
      if (F && F.rev) { if (H.revGraded == null && H.steps.length === (F.steps || []).length) { H.revGraded = grade; gwRevGrade(F.rev, grade); } }
      else if (grade >= 2) gwRevAdd(H, n, grade, PR.hist[PR.hist.length - 1].lab, loss);
    } catch (e) {}
    H.busy = false;
    const pause = PR.pause === "action" || (PR.pause === "mistake" && grade >= 2);
    if (!pause) { const kk = H.fb.k; H.fb = null; H.steps.push(kk); gwPracAdvance(); }
    renderStudy();
  }, 20);
}
/* il passo i della mano è una tua azione? (così non aspetto il replayer) */
function gwStepKind(H, i) { let n = H.L.E.tree.root; for (let k = 0; k < i; k++) n = n.ch[H.steps[k]]; return n.t === "c" ? "card" : n.t === "a" && n.pl === H.hero ? "hero" : "vil"; }
function gwPracBind() {
  const Q = s => document.querySelectorAll(s), PR = GW.prac; if (!PR) return;
  gwTableAnim(); gwTypewriter();
  const H = PR.hand;
  clearTimeout(PR.tmr);
  if (H && PR.showH === H && PR.shown < H.steps.length) {
    const kd = gwStepKind(H, PR.shown), dl = kd === "hero" && !PR.replaying ? 60 : PR.replaying ? 950 : kd === "card" ? 700 : 750;
    PR.tmr = setTimeout(() => { if (GW.prac.hand !== H || GW.tab !== "prac") return; PR.shown++; if (PR.shown >= H.steps.length) PR.replaying = false; renderStudy(); }, dl);
  }
  clearTimeout(PR.autoT); clearTimeout(PR.tlT);
  /* prova a tempo: se non rispondi in tempo la decisione conta come la peggiore */
  const TL = PR.prova && !PR.prova.done && (gwProvaById(PR.prova.id) || {}).tlim;
  if (TL && H && !H.fb && !H.done && !H.busy && PR.shown >= H.steps.length && document.querySelector("[data-gpa],[data-gpfc]")) {
    const key = H.steps.length;
    PR.tlT = setTimeout(() => { if (GW.prac.hand !== H || H.fb || H.steps.length !== key || H.busy) return; const n = gwPracNode(H), Gs = gwPracGroups(n, H.L.E, PR.diff), I = msNodeInfo(H.L.E, H.steps, true); let w = 0, wv = 1e9; Gs.forEach((g, q) => { const v = Math.max(...g.ks.map(k => I.evA[k][H.h] ?? 0)); if (v < wv) { wv = v; w = q; } }); gwPracAnswer(Gs.map((_, q) => q === w ? 1 : 0)); }, TL * 1000);
  }
  if (H && H.done && PR.auto && PR.shown >= H.steps.length && !PR.replaying) PR.autoT = setTimeout(() => { if (GW.prac.hand === H && GW.tab === "prac") { gwPracNew(); renderStudy(); } }, 4000);
  Q("[data-gpskip]").forEach(b => b.onclick = () => { PR.shown = H.steps.length; PR.replaying = false; renderStudy(); });
  Q("[data-gprev]").forEach(b => b.onclick = () => { PR.shown = H.start; PR.replaying = true; PR.anim = null; renderStudy(); });
  Q("[data-gpauto]").forEach(b => b.onchange = () => { PR.auto = b.checked; renderStudy(); });
  Q("[data-gpo]").forEach(b => b.onclick = () => { const [k, v] = b.dataset.gpo.split(":"); PR[k] = v; if (k === "mode" || k === "diff") { PR.hand = null; PR.fv = null; } renderStudy(); });
  Q("[data-gps]").forEach(b => b.onclick = () => { PR.side = +b.dataset.gps; PR.hand = null; renderStudy(); });
  Q("[data-gpn]").forEach(b => b.onclick = () => { gwPracNew(); renderStudy(); });
  Q("[data-gprobgen]").forEach(b => b.onclick = () => gwProbGen());
  Q("[data-gtabgo]").forEach(b => b.onclick = () => setTab(b.dataset.tabgo || b.dataset.gtabgo));
  Q("[data-gpr]").forEach(b => b.onclick = () => { const H = PR.hand; if (H) { H.replay = (H.rec || H.steps).slice(); H.steps = H.steps.slice(0, H.start); H.fb = null; H.done = null; H.probRec = false; H.h0 = PR.hist.length; PR.st.hands++; gwPracAdvance(); renderStudy(); } });
  Q("[data-gpz]").forEach(b => b.onclick = () => { PR.st = { hands: 0, moves: 0, grades: [0, 0, 0, 0, 0], loss: 0, lossPot: 0 }; PR.coins = 0; PR.brSess = 0; PR.hist = []; PR.hand = null; renderStudy(); });
  Q("[data-gpss]").forEach(b => b.onchange = () => { PR.showStrat = b.checked; renderStudy(); });
  Q("[data-gpc2]").forEach(b => b.onclick = () => { const H = PR.hand; H.steps.push(H.fb.k); H.fb = null; gwPracAdvance(); renderStudy(); });
  Q("[data-gpa]").forEach(b => b.onclick = () => { const H = PR.hand, n = gwPracNode(H), Gs = gwPracGroups(n, H.L.E, PR.diff), i = +b.dataset.gpa; gwPracAnswer(Gs.map((_, q) => q === i ? 1 : 0)); });
  Q("[data-gph]").forEach(b => b.onclick = () => { PR.hf = b.dataset.gph; PR.hopen = null; renderStudy(); });
  Q("[data-gpho]").forEach(b => b.onclick = () => { const i = +b.dataset.gpho; PR.hopen = PR.hopen === i ? null : i; renderStudy(); });
  gwMultiBind();
  Q("[data-gpfc]").forEach(b => b.onclick = () => { const s = PR.fv.reduce((a, c) => a + c, 0); if (!(s > 0)) return; gwPracAnswer(PR.fv.map(x => x / s)); });
}

/* slider unico con una maniglia tra ogni coppia di azioni  */
function gwMultiSlider(Gs, fv) {
  let acc = 0;
  const segs = Gs.map((g, i) => { const s = `<i class="gwms-s" style="left:${acc}%;width:${fv[i]}%;background:${g.col}"></i>`; acc += fv[i]; return s; }).join("");
  acc = 0;
  const hs = Gs.slice(0, -1).map((_, i) => { acc += fv[i]; return `<b class="gwms-h" data-gmh="${i}" style="left:${acc}%"></b>`; }).join("");
  return `<div class="gwms"><div class="gwms-l">${Gs.map((g, i) => `<span><b style="color:${g.col === "#6d1111" ? "#ff6b6b" : g.col}">${esc(g.lab)}</b><em data-gmv="${i}">${fv[i]}</em></span>`).join("")}</div><div class="gwms-bar" id="gwMs">${segs}${hs}</div><p class="gwmuted" style="text-align:center;margin:4px 0 0">Trascina le maniglie per dividere il 100% tra le azioni.</p></div>`;
}
function gwMultiBind() {
  const bar = document.getElementById("gwMs"), PR = GW.prac; if (!bar || !PR || !PR.fv) return;
  const redraw = () => {
    let acc = 0; bar.querySelectorAll(".gwms-s").forEach((s, i) => { s.style.left = acc + "%"; s.style.width = PR.fv[i] + "%"; acc += PR.fv[i]; });
    acc = 0; bar.querySelectorAll(".gwms-h").forEach((h, i) => { acc += PR.fv[i]; h.style.left = acc + "%"; });
    document.querySelectorAll("[data-gmv]").forEach(e => e.textContent = PR.fv[+e.dataset.gmv]);
  };
  bar.querySelectorAll(".gwms-h").forEach(h => {
    h.onpointerdown = e => {
      e.preventDefault(); h.setPointerCapture(e.pointerId);
      const i = +h.dataset.gmh;
      const move = ev => {
        const r = bar.getBoundingClientRect(); let x = Math.round(((ev.clientX - r.left) / r.width * 100) / 5) * 5;
        const cum = []; let a = 0; PR.fv.forEach(v => { a += v; cum.push(a); });
        const lo = i > 0 ? cum[i - 1] : 0, hi = cum[i + 1] != null ? cum[i + 1] : 100;
        x = Math.max(lo, Math.min(hi, x)); cum[i] = x;
        PR.fv = cum.map((c, k) => c - (k ? cum[k - 1] : 0)); PR.fv[PR.fv.length - 1] = 100 - (cum[cum.length - 2] || 0);
        redraw();
      };
      h.onpointermove = move; h.onpointerup = () => { h.onpointermove = null; };
    };
  });
  /* clic sulla barra: sposta la maniglia più vicina */
  bar.onpointerdown = e => { if (e.target.classList.contains("gwms-h")) return; const r = bar.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 100; let best = null, bd = 1e9; bar.querySelectorAll(".gwms-h").forEach(h => { const d = Math.abs(parseFloat(h.style.left) - x); if (d < bd) { bd = d; best = h; } }); if (best) { best.onpointerdown(e); best.onpointermove && best.onpointermove(e); } };
}

