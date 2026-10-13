/* ================= REPORT FLOP (aggregati ================= */
const GW_REPSPOT = f => {
  if (!f) return null;
  if (f.kind === "SRP") return { "BTN>BB": "btn_bb", "CO>BB": "co_bb", "SB>BB": "sb_bb" }[f.a + ">" + f.b] || null;
  if (f.kind === "4-bet pot") return { "CO>BTN": "btn_co4" }[f.a + ">" + f.b] || null;
  return { "BTN>BB": "bb_btn3", "CO>BTN": "btn_co3", "CO>BB": "bb_co3", "BTN>SB": "sb_btn3" }[f.a + ">" + f.b] || null;
};
const gwRepKey = f => `${f.kind}|${f.a}|${f.b}`;
function gwRepData(f) {
  const id = GW_REPSPOT(f);
  if (id && GW_REPORTS[id]) return GW_REPORTS[id];
  return GW.rep[gwRepKey(f)] || (() => { try { const x = JSON.parse(localStorage.getItem("orca-rep-" + gwRepKey(f)) || "null"); if (x) GW.rep[gwRepKey(f)] = x; return x; } catch (e) { return null; } })();
}
const gwRepLab = a => a[0] === "check" ? "Check" : a[0] === "allin" ? "All-in" : a[0] === "bet" ? `Bet ${Math.round(a[1] * 100)}%` : a[0];
const gwRepCol = a => gwCol({ kind: a[0], frac: a[1] });
const GW_REPGRP = {
  none: { n: "Nessuno" },
  hc: { n: "Carta alta", f: r => r.hc === "9-" ? "9 o meno" : r.hc + "-high", ord: ["A-high", "K-high", "Q-high", "J-high", "T-high", "9 o meno"] },
  tone: { n: "Colori", f: r => ({ r: "Rainbow", tt: "Two-tone", mono: "Monotone" })[r.tone], ord: ["Rainbow", "Two-tone", "Monotone"] },
  paired: { n: "Accoppiati", f: r => r.paired ? "Accoppiati" : "Non accoppiati", ord: ["Non accoppiati", "Accoppiati"] },
  conn: { n: "Connessione", f: r => r.paired ? "Accoppiati" : r.conn === "conn" ? "Connessi (scala possibile)" : "Scollegati", ord: ["Scollegati", "Connessi (scala possibile)", "Accoppiati"] },
};
function gwRepMain(P) {
  const f = P.flop, D = gwRepData(f);
  if (!D) {
    const live = GW.repLive;
    return `<div class="gwpanel"><div class="gwhead"><b>Report flop · ${f.oop} contro ${f.ip}</b><span>${f.kind}</span></div>
      <p>Per questo spot non c'è un report già calcolato (ci sono per BTN vs BB, CO vs BB, SB vs BB e i 3-bet pot BB vs BTN e BTN vs CO).</p>
      ${live ? `<div class="gwprog"><i style="width:${Math.round(live.done / live.tot * 100)}%"></i></div><p class="gwmuted">${live.done}/${live.tot} flop · ${esc(live.cur || "")}</p>` : `<button class="gwbtn" data-grep="gen">Genera il report (24 flop, qualche minuto)</button>`}
      <p class="gwmuted">Il report risolve una serie di flop rappresentativi con lo stesso albero dello Study e poi li aggrega pesandoli per la loro frequenza reale.</p></div>`;
  }
  const rows0 = Object.entries(D.rows).map(([b, r]) => ({ b, ...r }));
  const trivial = rows0.every(r => (r.f0[0] || 0) > 0.97);
  const node = GW.repNode != null ? GW.repNode : trivial ? 1 : 0, grp = GW.repGroup || "none", sort = GW.repSort || "";
  const fk0 = node ? "f1" : "f0", A0 = rows0[0][node ? "a1" : "a0"];
  const keep = A0.map((_, i) => i).filter(i => rows0.some(r => (r[fk0][i] || 0) >= 0.01));
  const A = keep.map(i => A0[i]), fk = "_f";
  const rows = rows0.map(r => ({ ...r, _f: keep.map(i => r[fk0][i] || 0) }));
  const eqr = r => r.eq[0] > 0 ? r.ev[0] / (r.eq[0] * (D.pot)) : 0;
  const wavg = (rs, fn) => { let s = 0, W = 0; rs.forEach(r => { s += r.w * fn(r); W += r.w; }); return W ? s / W : 0; };
  const avgF = rs => A.map((_, i) => wavg(rs, r => r[fk][i] || 0));
  const barH = fr => `<div class="gwrbar">${A.map((a, i) => `<i style="width:${fr[i] * 100}%;background:${gwRepCol(a)}" title="${gwRepLab(a)} ${fmt(fr[i] * 100, 1)}%"></i>`).join("")}</div>`;
  const tot = avgF(rows);
  let h = `<div class="gwpanel"><div class="gwhead"><b>Report flop · ${f.oop} contro ${f.ip}</b><span>${esc(D.label)} · piatto ${fmtN(D.pot)}bb · ${rows.length} flop pesati su 1755 · ${D.it} iterazioni per flop</span></div>${D.model !== 3 ? `<p class="gwmuted">${D.model === 2 ? "Report calcolato con puntate su tutte le street ma senza raise normali (solo all-in): lo sto ricalcolando con i raise." : "Report calcolato con il modello precedente (river a showdown): lo sto ricalcolando con il nuovo modello e i raise."}</p>` : ""}${trivial && node === 0 ? `<p class="gwmuted">${f.oop} non ha l'iniziativa: nell'albero non fa donk bet, quindi al flop checka sempre. Guarda la risposta di ${f.ip} dopo il check.</p>` : ""}
    <div class="gwrow"><div class="gwseg">${[[0, `${f.oop} prima azione`], [1, `${f.ip} dopo il check`]].map(([v, l]) => `<button class="${node === v ? "on" : ""}" data-grep="node:${v}">${l}</button>`).join("")}</div>
    <div class="gwseg">${Object.entries(GW_REPGRP).map(([k, g]) => `<button class="${grp === k ? "on" : ""}" data-grgrp="${k}">${g.n}</button>`).join("")}</div></div>
    <div class="gwrsum">${A.map((a, i) => `<div class="gwrs" style="border-color:${gwRepCol(a)}"><span>${gwRepLab(a)}</span><b>${fmt(tot[i] * 100, 1)}%</b></div>`).join("")}<div class="gwrs"><span>EV ${f.oop}</span><b>${fmt(wavg(rows, r => r.ev[0]), 2)}</b></div><div class="gwrs"><span>EV ${f.ip}</span><b>${fmt(wavg(rows, r => r.ev[1]), 2)}</b></div><div class="gwrs"><span>Equity ${f.oop}</span><b>${fmt(wavg(rows, r => r.eq[0]) * 100, 1)}%</b></div><div class="gwrs"><span>EQR ${f.oop}</span><b>${fmt(wavg(rows, eqr) * 100, 0)}%</b></div></div>`;
  /* grafico a colonne (Manhattan) */
  const sorted = rows.slice().sort((x, y) => (y[fk][0] || 0) - (x[fk][0] || 0));
  h += `<div class="gwman">${sorted.map(r => `<button class="gwmc" data-grow="${r.b}" title="${r.b}: ${A.map((a, i) => gwRepLab(a) + " " + Math.round((r[fk][i] || 0) * 100) + "%").join(", ")}">${A.map((a, i) => `<i style="height:${(r[fk][i] || 0) * 100}%;background:${gwRepCol(a)}"></i>`).join("")}</button>`).join("")}</div><p class="gwmuted" style="margin:2px 0 10px">Ogni colonna è un flop, ordinati per frequenza di check. Tocca una colonna per aprire quel flop nello Study.</p></div>`;
  /* tabella o gruppi */
  const cols = [["b", "Flop"], ...A.map((a, i) => ["a" + i, gwRepLab(a)]), ["ev0", "EV " + f.oop], ["ev1", "EV " + f.ip], ["eq0", "EQ " + f.oop], ["eqr", "EQR " + f.oop]];
  const val = (r, k) => k === "b" ? r.b : k === "ev0" ? r.ev[0] : k === "ev1" ? r.ev[1] : k === "eq0" ? r.eq[0] : k === "eqr" ? eqr(r) : r[fk][+k.slice(1)] || 0;
  const avgRow = { ev: [wavg(rows, r => r.ev[0]), wavg(rows, r => r.ev[1])], eq: [wavg(rows, r => r.eq[0])], freq: tot };
  const hi = (k, v) => { if (k === "b") return ""; const m = k === "ev0" ? avgRow.ev[0] : k === "ev1" ? avgRow.ev[1] : k === "eq0" ? avgRow.eq[0] : k === "eqr" ? wavg(rows, eqr) : tot[+k.slice(1)]; return v > m * 1.08 ? " up" : v < m * 0.92 ? " dn" : ""; };
  const fmtV = (k, v) => k === "b" ? "" : k.startsWith("ev") ? fmt(v, 2) : fmt(v * 100, 1) + "%";
  if (grp === "none") {
    let rs = rows.slice();
    if (sort) { const d = sort[0] === "-" ? -1 : 1, k = sort.replace("-", ""); rs.sort((x, y) => k === "b" ? d * x.b.localeCompare(y.b) : d * (val(y, k) - val(x, k))); }
    h += `<div class="gwpanel"><div class="gwtable"><table><thead><tr>${cols.map(([k, l]) => `<th data-grsort="${k}" class="${sort.replace("-", "") === k ? "on" : ""}">${esc(l)}</th>`).join("")}<th>Strategia</th></tr></thead><tbody>${rs.map(r => `<tr data-grow="${r.b}"><td class="gwtb">${(r.b.match(/../g)).map(c => gwCardS(c)).join("")}</td>${cols.slice(1).map(([k]) => { const v = val(r, k); return `<td class="mono${hi(k, v)}">${fmtV(k, v)}</td>`; }).join("")}<td style="min-width:120px">${barH(A.map((_, i) => r[fk][i] || 0))}</td></tr>`).join("")}</tbody></table></div><p class="gwmuted">Verde: sopra la media, rosso: sotto. Tocca una riga per aprire il flop nello Study. Tocca l'intestazione per ordinare.</p></div>`;
  } else {
    const G = GW_REPGRP[grp], groups = new Map();
    rows.forEach(r => { const k = G.f(r); (groups.get(k) || groups.set(k, []).get(k)).push(r); });
    const keys = G.ord.filter(k => groups.has(k));
    h += `<div class="gwpanel"><div class="gwtable"><table><thead><tr><th>${G.n}</th><th>Peso</th>${A.map(a => `<th>${gwRepLab(a)}</th>`).join("")}<th>EV ${f.oop}</th><th>EV ${f.ip}</th><th>EQ ${f.oop}</th><th>EQR ${f.oop}</th><th>Strategia</th></tr></thead><tbody>${keys.map(k => { const rs = groups.get(k), fr = avgF(rs), W = rs.reduce((s, r) => s + r.w, 0); return `<tr><td><b>${k}</b></td><td class="mono">${fmt(W / 22100 * 100, 1)}%</td>${fr.map((x, i) => `<td class="mono${hi("a" + i, x)}">${fmt(x * 100, 1)}%</td>`).join("")}<td class="mono">${fmt(wavg(rs, r => r.ev[0]), 2)}</td><td class="mono">${fmt(wavg(rs, r => r.ev[1]), 2)}</td><td class="mono">${fmt(wavg(rs, r => r.eq[0]) * 100, 1)}%</td><td class="mono">${fmt(wavg(rs, eqr) * 100, 0)}%</td><td style="min-width:140px">${barH(fr)}</td></tr>`; }).join("")}</tbody></table></div><p class="gwmuted">Medie pesate per la frequenza reale di ogni tipo di flop.</p></div>`;
  }
  return h;
}
function gwRepAction(P, a) {
  if (a.startsWith("node:")) { GW.repNode = +a.slice(5); renderStudy(); return; }
  if (a === "gen") gwRepGenerate(P.flop);
}
/* generazione dal vivo: 24 flop con peso maggiore, precisione ridotta */
function gwRepGenerate(f) {
  if (GW.repLive || GW.busy) return;
  const list = GW_FLOPSUB.slice().sort((x, y) => y.w - x.w).slice(0, 24);
  const res = { label: `${f.a} apre${f.kind === "SRP" ? `, ${f.b} chiama` : `, ${f.b} 3-betta, ${f.a} chiama`}`, pot: f.pot, stack: f.stack, it: 25, rows: {} };
  GW.repLive = { done: 0, tot: list.length, cur: "" };
  const ranges = [gwRangeFromReach(f.reach[0]), gwRangeFromReach(f.reach[1])];
  const step = i => {
    if (i >= list.length) { GW.repLive = null; GW.rep[gwRepKey(f)] = res; try { localStorage.setItem("orca-rep-" + gwRepKey(f), JSON.stringify(res)); } catch (e) {} if (tab === "solver") renderStudy(); return; }
    const fl = list[i]; GW.repLive.cur = fl.b;
    if (tab === "solver" && SVMODE === "study" && GW.tab === "rep") renderStudy();
    const o = gwSolve(hsplit(fl.b), f.pot, f.stack, ranges, "flop", f.agg === f.oop);
    const E = msInit(o, null, true);
    msSolveAuto(E, 25, null, E2 => {
      const G = E2.G, root = E2.tree.root, I0 = msNodeInfo(E2, [], false), I1 = msNodeInfo(E2, [0], false);
      const eq = [0, 1].map(p => msEqVec(E2, [], p, G.w[1 - p])), ev = [0, 1].map(p => msEvVec(E2, root, p, G.w[p], G.w[1 - p]));
      const avg = (p, v) => { let s = 0, W = 0; for (let k = 0; k < G.n[p]; k++) { s += G.w[p][k] * v[k]; W += G.w[p][k]; } return s / W; };
      res.rows[fl.b] = { w: fl.w, hc: fl.hc, tone: fl.tone, paired: fl.paired, conn: fl.conn, a0: I0.node.acts.map(a => [a.kind, a.frac || 0]), f0: I0.freq, a1: I1.node.acts.map(a => [a.kind, a.frac || 0]), f1: I1.freq, ev: [avg(0, ev[0]), avg(1, ev[1])], eq: [avg(0, eq[0]), avg(1, eq[1])] };
      GW.repLive.done = i + 1;
      setTimeout(() => step(i + 1), 0);
    });
  };
  step(0);
  renderStudy();
}

/* il Solver (Study) si apre da NL25 in poi, come le tabelle NL25-NL200 */
const solverOk = () => pre25Ok();
function renderSolverLock() {
  const L = LEVELS.find(x => x.id === "nl25"), ci = curLevelIdx();
  $("#view").innerHTML = `<section class="panel sv-lock"><span class="pchip big" style="--c:${L.col};--ink:${L.ink};--sz:96px"><i></i><b style="font-size:calc(var(--sz)*.24)">25</b><em>NL</em></span>
    <span class="sv-lock-eye">🔒 Si sblocca a NL25</span><h2>Il Solver arriva quando sei pronto</h2>
    <p>Lo Study calcola strategie di equilibrio flop, turn e river, il nodelock contro gli avversari, i report dei flop e i problemi del giorno. Rende di più quando le basi sono solide: per questo si apre quando arrivi a <b>NL25</b>.</p>
    <ul class="sv-lock-l"><li>Risolvi uno spot e guarda la strategia mano per mano</li><li>Blocca l'avversario sulle sue frequenze reali (nodelock)</li><li>Report dei flop e problemi del giorno già impostati</li></ul>
    <p class="car-small">Sei a <b>${LEVELS[ci].stake}</b>: supera gli esami fino a NL10 per sbloccarlo. Nel frattempo i drill del livello e il Sonar ti preparano allo Study.</p>
    <div class="sv-lock-b"><button class="btn primary" data-tabgo2="program">Vai al Programma</button><button class="btn" data-tabgo2="equity">Apri il Sonar</button></div></section>`;
  document.querySelectorAll("[data-tabgo2]").forEach(b => b.onclick = () => setTab(b.dataset.tabgo2));
}
function renderSolver() {
  return renderStudy();
  const c = SV.form || (SV.form = svDefaultForm());
  ["oopS", "ipS", "rzS"].forEach(k => { if (!Array.isArray(c[k])) c[k] = svPct(c[k === "oopS" ? "oopB" : k === "ipS" ? "ipB" : "rz"] || "33 75 150").map(x => Math.round(x * 100)); });
  const oppOpts = Object.entries(OPPS).map(([id, o]) => `<option value="opp:${esc(id)}" ${c.lock === "opp:" + id ? "selected" : ""}>${esc(o.name)} (voto ${fmtN(o.out.vote)})</option>`).join("");
  const chips = (k, list) => list.map(x => `<button class="szchip ${c[k].includes(x) ? "on" : ""}" data-sz="${k}:${x}">${x}%</button>`).join("");
  const step = (n, t, d, body, extra) => `<section class="svstep ${extra || ""}"><div class="svstep-h"><span class="svn">${n}</span><div><h3>${t}</h3><p>${d}</p></div></div>${body}</section>`;
  let h = svModeBar() + `<div class="svhead"><div><h2>Solver del river</h2><p>Calcola la strategia GTO combo per combo (CFR+, blocker inclusi). Con il nodelock blocchi l'avversario sulle sue frequenze reali e trovi la tua risposta migliore.</p></div>${SV.E0 ? `<button class="btn" id="svToggle">${SV.showSetup ? "Nascondi impostazioni" : "Modifica lo spot"}</button>` : ""}</div>`;
  const show = !SV.E0 || SV.showSetup;
  if (show) {
    h += `<div class="svsetup">`;
    h += step(1, "Scegli lo spot", "Uno spot tipico riempie range, piatto e stack con le tabelle GTO. Poi puoi modificare tutto.", `<div class="qspots">${SV_QUICK.map(q => `<button class="qspot ${c.quick === q.id ? "on" : ""}" data-qs="${q.id}"><b>${q.n}</b><span>${q.d}</span></button>`).join("")}</div>`);
    h += step(2, "Board", "Le 5 carte sul tavolo al river.", `<div id="svBoardBox">${svBoardHTML(c)}</div>`);
    h += step(3, "Range dei due giocatori", "Tocca o trascina sulle celle per aggiungere o togliere mani. Il peso del pennello serve per le mani giocate solo in parte.", `<div class="retabs"><button class="retab ${c.edit === 0 ? "on" : ""}" data-retab="0"><b>OOP</b> · parla per primo <span class="rcount"></span></button><button class="retab ${c.edit === 1 ? "on" : ""}" data-retab="1"><b>IP</b> · parla per secondo <span class="rcount"></span></button></div><div id="svRE"></div>`);
    h += step(4, "Piatto, stack e chi sei", "Il piatto a inizio river e lo stack che resta dietro.", `<div class="ogrid"><label class="of">Piatto (bb)<input id="svPot" type="number" step="0.5" min="1" value="${c.pot}"></label><label class="of">Stack effettivo (bb)<input id="svStack" type="number" step="0.5" min="1" value="${c.stack}"></label><div class="of">Tu sei<div class="segm"><button class="${c.hero == 0 ? "on" : ""}" data-hero="0">OOP</button><button class="${c.hero == 1 ? "on" : ""}" data-hero="1">IP</button></div></div></div>`);
    h += step(5, "Size da provare", "Il solver sceglie tra le size che attivi. Meno size = soluzione più veloce e più semplice da giocare.", `<div class="szrow"><span>Bet OOP</span>${chips("oopS", SV_SIZES)}</div><div class="szrow"><span>Bet IP</span>${chips("ipS", SV_SIZES)}</div><div class="szrow"><span>Raise</span>${chips("rzS", [50, 75, 100, 150])}</div><div class="szrow"><span>Opzioni</span><button class="szchip ${c.allin ? "on" : ""}" data-opt="allin">All-in</button><span class="muted" style="font-size:13px">Raise massimi</span><div class="segm small">${[0, 1, 2].map(x => `<button class="${c.maxR == x ? "on" : ""}" data-mr="${x}">${x}</button>`).join("")}</div><span class="muted" style="font-size:13px">Precisione</span><div class="segm small">${[[300, "Veloce"], [600, "Normale"], [1500, "Alta"]].map(([x, l]) => `<button class="${c.iters == x ? "on" : ""}" data-it="${x}">${l}</button>`).join("")}</div></div>`);
    h += step(6, "Avversario (facoltativo)", "Nodelock: il solver blocca l'avversario sulle sue frequenze reali di fold contro le tue bet.", `<select id="svLock" class="svsel"><option value="none">Nessuno: solo GTO</option><option value="pool" ${c.lock === "pool" ? "selected" : ""}>Pool NL (dati di riferimento)</option>${oppOpts}</select><p class="muted" id="svLockInfo" style="font-size:13px;margin:6px 0 0"></p>`);
    h += `<div class="svgo"><button class="btn3d" id="svGo">Risolvi</button><span id="svMsg" class="muted" style="font-size:14px"></span></div></div>`;
  }
  h += `<div id="svOut"></div>`;
  $("#view").innerHTML = h;
  svModeBind();
  if ($("#svToggle")) $("#svToggle").onclick = () => { SV.showSetup = !SV.showSetup; renderSolver(); };
  if (show) {
    const bindBoard = () => {
      const bb = $("#svBoardBox"); bb.innerHTML = svBoardHTML(c);
      bb.querySelectorAll("[data-bc]").forEach(b => b.onclick = () => { const k = b.dataset.bc, sel = c.board.match(/../g) || []; c.board = (sel.includes(k) ? sel.filter(x => x !== k) : sel.length < 5 ? [...sel, k] : sel).join(""); bindBoard(); });
      bb.querySelectorAll("[data-bs]").forEach(b => b.onclick = () => { c.board = (c.board.match(/../g) || []).filter(x => x !== b.dataset.bs).join(""); bindBoard(); });
      bb.querySelector('[data-bact="rnd"]').onclick = () => { c.board = dealCards(5).join(""); bindBoard(); };
      bb.querySelector('[data-bact="clr"]').onclick = () => { c.board = ""; bindBoard(); };
    };
    bindBoard();
    const edit = () => { document.querySelectorAll("[data-retab]").forEach(b => b.classList.toggle("on", +b.dataset.retab === c.edit)); svRangeEditor($("#svRE"), c, c.edit); };
    [1, 0].forEach(k => { const n = reCombos(svParseRange(c[k ? "ip" : "oop"])); const t = document.querySelector(`[data-retab="${k}"] .rcount`); if (t) t.textContent = `${fmtN(Math.round(n / 1326 * 1000) / 10)}%`; });
    edit();
    document.querySelectorAll("[data-retab]").forEach(b => b.onclick = () => { c.edit = +b.dataset.retab; edit(); });
    document.querySelectorAll("[data-qs]").forEach(b => b.onclick = () => { const q = SV_QUICK.find(x => x.id === b.dataset.qs); Object.assign(c, { quick: q.id, oop: q.oop.startsWith("raw:") ? q.oop.slice(4) : svPresetStr(q.oop), ip: q.ip.startsWith("raw:") ? q.ip.slice(4) : svPresetStr(q.ip), pot: q.pot, stack: q.stack }); renderSolver(); });
    $("#svPot").onchange = e => c.pot = +e.target.value; $("#svStack").onchange = e => c.stack = +e.target.value;
    const seg = (sel, f) => document.querySelectorAll(sel).forEach(b => b.onclick = () => { f(b); b.parentElement.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); });
    seg("[data-hero]", b => { c.hero = +b.dataset.hero; lockInfo(); }); seg("[data-mr]", b => c.maxR = +b.dataset.mr); seg("[data-it]", b => c.iters = +b.dataset.it);
    document.querySelectorAll("[data-sz]").forEach(b => b.onclick = () => { const [k, x] = b.dataset.sz.split(":"); const v = +x; c[k] = c[k].includes(v) ? c[k].filter(y => y !== v) : [...c[k], v].sort((a, b2) => a - b2); b.classList.toggle("on"); lockInfo(); });
    document.querySelector("[data-opt=allin]").onclick = e => { c.allin = !c.allin; e.currentTarget.classList.toggle("on", c.allin); };
    const lockInfo = () => { const v = $("#svLock").value; c.lock = v; const fn = v === "pool" ? svLockFn("pool") : v.startsWith("opp:") ? svLockFn("opp", OPPS[v.slice(4)]) : null; $("#svLockInfo").textContent = v === "none" ? "" : fn ? `Contro le tue bet folda: ${svLockSummary(fn, (c.hero == 0 ? c.oopS : c.ipS).map(x => x / 100))}. Il resto si divide tra call e raise come dice il solver.` : "Questo avversario non ha Fold river bet né check-raise river utilizzabili: nessun blocco."; };
    $("#svLock").onchange = lockInfo; lockInfo();
    $("#svGo").onclick = () => svStartFromForm();
  }
  if (SV.E0) svRenderOut();
}
function svStartFromForm() {
  const f = SV.form, msg = t => { const m = $("#svMsg"); if (m) m.textContent = t; };
  const b = (f.board || "").replace(/\s+/g, "");
  if (!/^([2-9TJQKA][shdc]){5}$/.test(b) || new Set(b.match(/../g)).size !== 5) return msg("Scegli 5 carte per il board (passo 2).");
  if (!(f.pot > 0) || !(f.stack > 0)) return msg("Piatto e stack devono essere positivi (passo 4).");
  const r0 = svCombos(svParseRange(f.oop)), r1 = svCombos(svParseRange(f.ip));
  if (!r0.length || !r1.length) return msg("Uno dei due range è vuoto (passo 3).");
  if (!f.oopS.length && !f.ipS.length && !f.allin) return msg("Attiva almeno una size (passo 5).");
  const cfg = { board: hsplit(b), boardS: b, pot: f.pot, stack: f.stack, oopBets: f.oopS.map(x => x / 100), ipBets: f.ipS.map(x => x / 100), raises: f.rzS.map(x => x / 100), allin: f.allin, maxRaises: f.maxR, ranges: [r0, r1], heroPl: f.hero, iters: f.iters, src: "spot manuale" };
  const lock = f.lock === "pool" ? svLockFn("pool") : f.lock.startsWith("opp:") ? svLockFn("opp", OPPS[f.lock.slice(4)]) : null;
  SV.showSetup = false;
  svStart(cfg, lock, f.lock);
}
function svStart(cfg, lock, lockName) {
  if (SV.busy) return;
  SV = { ...SV, cfg, E0: null, E1: null, lock, lockName, view: lock ? "lock" : "gto", sel: null, busy: true };
  const msg = t => { const m = $("#svMsg") || $("#svSolveMsg"); if (m) m.textContent = t; };
  msg("Risolvo...");
  svSolveAsync(cfg, lock, (stg, fr) => msg(`${stg === 0 ? "Soluzione GTO" : "Soluzione contro l'avversario bloccato"}: ${Math.round(fr * 100)}%`), (E0, E1) => {
    SV.E0 = E0; SV.E1 = E1; SV.busy = false;
    SV.st0 = svStats(E0); SV.st1 = E1 ? svStats(E1) : null; gQuestEv("solver", 1); persist();
    SV.gain = E1 ? SV.st1.ev[cfg.heroPl] - svGtoVsLocked(E0, cfg.heroPl, lock) : null;
    SV.nodeByView = { gto: cfg.path ? svWalk(E0, cfg.path) : E0.tree.root, lock: E1 ? (cfg.path ? svWalk(E1, cfg.path) : E1.tree.root) : null };
    msg("");
    if (tab === "solver" && !run) renderSolver();
  });
}
function svCurE() { return SV.view === "lock" && SV.E1 ? SV.E1 : SV.E0; }
function svRenderOut() {
  const E = svCurE(), cfg = SV.cfg, el = $("#svOut"); if (!el || !E) return;
  let node = SV.nodeByView[SV.view] || E.tree.root;
  const hp = cfg.heroPl, who = p => p === hp ? "Tu" : "Lui";
  const st = SV.view === "lock" ? SV.st1 : SV.st0;
  let h = `<section class="panel" style="margin-top:14px"><div class="hverd"><div><span class="muted">Board</span><b>${cardsHtml(cfg.boardS, true)}</b></div><div><span class="muted">Il tuo EV</span><b class="mono">${fmtN(st.ev[hp])}bb</b><span class="muted" style="font-size:12px">su ${fmtN(cfg.pot)}bb di piatto</span></div>`;
  h += SV.view === "gto" ? `<div><span class="muted">Precisione (sfruttabilità)</span><b class="mono">${fmtN(Math.round(st.expl * 100) / 100)}% pot</b><span class="muted" style="font-size:12px">${E.it} iterazioni</span></div>` : `<div><span class="muted">Guadagno dell'exploit</span><b class="mono">${SV.gain >= 0 ? "+" : ""}${fmtN(Math.round(SV.gain * 100) / 100)}bb</b><span class="muted" style="font-size:12px">rispetto a giocare GTO contro di lui</span></div>`;
  h += `</div>`;
  if (SV.E1) h += `<div class="svtabs"><button class="btn ${SV.view === "gto" ? "primary" : ""}" data-svv="gto">GTO</button><button class="btn ${SV.view === "lock" ? "primary" : ""}" data-svv="lock">Contro l'avversario (nodelock)</button></div>`;
  // percorso
  const trail = []; { let n = E.tree.root; const target = node; const find = (x, acc) => { if (x === target) { trail.push(...acc); return true; } if (x.t !== "a") return false; for (let k = 0; k < x.acts.length; k++) if (find(x.ch[k], [...acc, { n: x, k }])) return true; return false; }; find(n, []); }
  h += `<div class="svtrail"><button class="svcrumb" data-svroot="1">River</button>${trail.map((t, i) => `<span>›</span><button class="svcrumb" data-svtr="${i}">${who(t.n.pl)}: ${esc(t.n.acts[t.k].lab)}</button>`).join("")}</div>`;
  if (node.t !== "a") { h += `<p>Fine della mano (${node.t === "f" ? "fold" : "showdown"}).</p></section>`; el.innerHTML = h; svBind(E, trail); return; }
  const I = svNodeInfo(E, node), pot = cfg.pot + node.inv[0] + node.inv[1], facing = node.inv[1 - node.pl] - node.inv[node.pl];
  h += `<p style="margin:10px 0 6px;font-size:14.5px"><b>Tocca a ${node.pl === hp ? "te" : "lui"}</b> (${node.pl === 0 ? "OOP" : "IP"}) · piatto ${fmtN(pot)}bb${facing > 0 ? ` · deve chiamare ${fmtN(facing)}bb` : ""}${node.lock ? ` · <span class="pill mid">bloccato: folda ${Math.round((node.lock.fold || 0) * 100)}%</span>` : ""}</p>`;
  h += `<div class="svacts">${node.acts.map((a, k) => `<button class="svact" data-svk="${k}" style="--c:${svColor(a)}"><b>${esc(a.lab)}</b><span class="mono">${fmtN(Math.round(I.freq[k] * 1000) / 10)}%</span></button>`).join("")}</div>`;
  h += `<div class="svbar">${node.acts.map((a, k) => I.freq[k] > 0.004 ? `<span style="width:${I.freq[k] * 100}%;background:${svColor(a)}"></span>` : "").join("")}</div>`;
  // griglia
  const G = {}; I.combos.forEach((x, i) => { const g = G[x.key] || (G[x.key] = { w: 0, f: new Array(node.acts.length).fill(0), ev: 0, evw: 0 }); const r = I.rp[i]; g.w += r; node.acts.forEach((_, k) => g.f[k] += r * I.st[k * I.np + i]); let e = 0; node.acts.forEach((_, k) => { const v = I.evA[k][i]; if (v != null) e += I.st[k * I.np + i] * v; }); g.ev += r * e; });
  const maxW = Math.max(...Object.values(G).map(g => g.w), 1e-9);
  h += `<div class="svgrid">`;
  for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) {
    const k = handAt(i, j), g = G[k];
    if (!g || g.w < 1e-9) { h += `<button class="svc" disabled>${k}</button>`; continue; }
    let acc = 0; const seg = node.acts.map((a, q) => { const f = g.f[q] / g.w * 100; const s = `${svColor(a)} ${acc}% ${acc + f}%`; acc += f; return s; }).join(",");
    h += `<button class="svc on${SV.sel === k ? " sel" : ""}" data-svh="${k}" style="background:linear-gradient(to right,${seg});opacity:${0.45 + 0.55 * Math.min(1, g.w / maxW * 3)}" title="${k}: ${node.acts.map((a, q) => `${a.lab} ${Math.round(g.f[q] / g.w * 100)}%`).join(", ")} · EV ${fmtN(Math.round(g.ev / g.w * 10) / 10)}bb">${k}</button>`;
  }
  h += `</div><div class="legend">${node.acts.map(a => `<span><i style="background:${svColor(a)}"></i>${esc(a.lab)}</span>`).join("")}<span class="muted">tocca una mano per il dettaglio combo per combo</span></div>`;
  // dettaglio combo (mano selezionata o la tua)
  const hc = cfg.heroCombo, heroIdx = hc && node.pl === hp ? I.combos.findIndex(x => (x.c[0] === hc[0] && x.c[1] === hc[1]) || (x.c[0] === hc[1] && x.c[1] === hc[0])) : -1;
  const rows = SV.sel ? I.combos.map((x, i) => [x, i]).filter(([x]) => x.key === SV.sel) : heroIdx >= 0 ? [[I.combos[heroIdx], heroIdx]] : [];
  if (rows.length) {
    h += `<div class="otable"><table><thead><tr><th>Combo</th>${node.acts.map(a => `<th>${esc(a.lab)}</th>`).join("")}<th>Migliore</th></tr></thead><tbody>${rows.map(([x, i]) => { const evs = node.acts.map((_, k) => I.evA[k][i]); const bi = evs.reduce((b, v, k) => v != null && (b < 0 || v > evs[b]) ? k : b, -1); return `<tr${i === heroIdx ? ' class="hi"' : ""}><th>${icHand(hcstr(x.c[0]) + hcstr(x.c[1]))}</th>${node.acts.map((a, k) => `<td class="mono">${Math.round(I.st[k * I.np + i] * 100)}%<br><span class="muted">${evs[k] == null ? "-" : fmtN(Math.round(evs[k] * 10) / 10) + "bb"}</span></td>`).join("")}<td>${bi >= 0 ? esc(node.acts[bi].lab) : "-"}</td></tr>`; }).join("")}</tbody></table></div><p class="muted" style="font-size:12.5px;margin:0">Percentuale = frequenza della strategia, sotto l'EV in bb di ogni azione per quella combo (quanto incassi dal piatto meno quanto metti al river).</p>`;
  }
  h += `</section>`;
  el.innerHTML = h;
  svBind(E, trail);
}
function svBind(E, trail) {
  document.querySelectorAll("[data-svv]").forEach(b => b.onclick = () => { SV.view = b.dataset.svv; svRenderOut(); });
  document.querySelectorAll("[data-svk]").forEach(b => b.onclick = () => { const cur = SV.nodeByView[SV.view] || E.tree.root; const ch = cur.ch[+b.dataset.svk]; SV.nodeByView[SV.view] = ch; SV.sel = null; svRenderOut(); });
  document.querySelectorAll("[data-svh]").forEach(b => b.onclick = () => { SV.sel = SV.sel === b.dataset.svh ? null : b.dataset.svh; svRenderOut(); });
  const root = document.querySelector("[data-svroot]"); if (root) root.onclick = () => { SV.nodeByView[SV.view] = E.tree.root; svRenderOut(); };
  document.querySelectorAll("[data-svtr]").forEach(b => b.onclick = () => { const t = trail[+b.dataset.svtr]; SV.nodeByView[SV.view] = t.n.ch[t.k]; svRenderOut(); });
}
function svFormFromCfg(cfg) {
  const agg = r => { const m = {}; r.forEach(x => { const g = m[x.key] || (m[x.key] = [0, 0]); g[0] += x.w; g[1]++; }); const w = {}; Object.entries(m).forEach(([k, [s2]]) => { w[k] = Math.min(1, s2 / hExpand(k).length); }); return svRangeStr(w); };
  const P = a => a.map(x => Math.round(x * 100));
  return { board: cfg.boardS, pot: cfg.pot, stack: cfg.stack, oop: agg(cfg.ranges[0]), ip: agg(cfg.ranges[1]), oopS: P(cfg.oopBets), ipS: P(cfg.ipBets), rzS: P(cfg.raises), allin: cfg.allin !== false, maxR: cfg.maxRaises, hero: cfg.heroPl, iters: cfg.iters || 600, lock: cfg.lockName || "none", quick: null, edit: cfg.heroPl, brush: 100 };
}
function svAdopt(cfg, E0, E1, lock) {
  const st0 = svStats(E0), st1 = E1 ? svStats(E1) : null;
  SV = { ...SV, cfg, E0, E1, lock, lockName: cfg.lockName, view: E1 ? "lock" : "gto", sel: null, busy: false, st0, st1, gain: E1 ? st1.ev[cfg.heroPl] - svGtoVsLocked(E0, cfg.heroPl, lock) : null,
    nodeByView: { gto: cfg.path ? svWalk(E0, cfg.path) || E0.tree.root : E0.tree.root, lock: E1 ? (cfg.path ? svWalk(E1, cfg.path) || E1.tree.root : E1.tree.root) : null } };
}
/* verdetto del solver dentro l'analisi della mano (river) */
let svGen = 0;
function svHandVerdict(h, d, el) {
  const cfg = svFromHand(h, d);
  if (!cfg || !el) { if (el) el.innerHTML = ""; return; }
  cfg.iters = 400;
  const o = cfg.vname ? Object.values(OPPS).find(x => x.name === cfg.vname) : null;
  const lock = o ? svLockFn("opp", o) : null;
  if (o) cfg.lockName = "opp:" + oppSlug(o.name);
  const gen = ++svGen, title = `<h4 class="hsub">Solver del river (GTO${lock ? ` e nodelock su ${esc(o.name)}` : ""})</h4>`;
  el.innerHTML = title + `<p class="muted" style="font-size:13.5px" id="svHMsg">Risolvo lo spot...</p>`;
  svSolveAsync(cfg, lock, (stg, fr) => { const m = document.getElementById("svHMsg"); if (m && gen === svGen) m.textContent = `${stg === 0 ? "Soluzione GTO" : "Soluzione contro " + (o ? o.name : "l'avversario")}: ${Math.round(fr * 100)}%`; }, (E0, E1) => {
    if (gen !== svGen || !document.body.contains(el)) return;
    const pieces = [];
    [["gto", E0], ["lock", E1]].forEach(([vw, E]) => {
      if (!E) return;
      const node = svWalk(E, cfg.path); if (!node || node.t !== "a" || node.pl !== cfg.heroPl) return;
      const I = svNodeInfo(E, node), hi = I.combos.findIndex(x => (x.c[0] === cfg.heroCombo[0] && x.c[1] === cfg.heroCombo[1]) || (x.c[0] === cfg.heroCombo[1] && x.c[1] === cfg.heroCombo[0]));
      if (hi < 0) return;
      const evs = node.acts.map((_, k) => I.evA[k][hi]), bi = evs.reduce((b, v, k) => v != null && (b < 0 || v > evs[b]) ? k : b, -1), ti = svActIdx(node, cfg.tableAct);
      const loss = ti >= 0 && bi >= 0 ? evs[bi] - evs[ti] : null;
      pieces.push(`<div class="${loss != null && loss > 0.05 * cfg.pot ? "herr" : "hok"}"><b>${vw === "gto" ? "GTO" : `Contro ${esc(o.name)} (nodelock)`}</b>: ${node.acts.map((a, k) => `${esc(a.lab)} ${Math.round(I.st[k * I.np + hi] * 100)}% <span class="muted">(${evs[k] == null ? "-" : fmtN(Math.round(evs[k] * 10) / 10) + "bb"})</span>`).join(" · ")}.<br>${ti >= 0 ? `Al tavolo: <b>${esc(node.acts[ti].lab)}</b>${loss != null ? (loss > 0.03 * cfg.pot ? `, perdi <b>${fmtN(Math.round(loss * 10) / 10)}bb</b> rispetto a ${esc(node.acts[bi].lab)}.` : loss > 0.05 ? `: quasi come la migliore (${esc(node.acts[bi].lab)}, differenza ${fmtN(Math.round(loss * 10) / 10)}bb).` : ": è la scelta migliore.") : "."}` : ""}</div>`);
    });
    el.innerHTML = title + (pieces.join("") || `<p class="muted">Non riesco a ritrovare la tua decisione nell'albero del solver.</p>`) + `<p class="muted" style="font-size:12.5px">Range dal preflop GTO ristretti da flop e turn; size provate: le tue, 33%, 75%, 150% e all-in; tra parentesi l'EV di ogni azione con la tua mano. ${cfg.vname && !o ? `Analizza ${esc(cfg.vname)} nella scheda Avversari per avere anche il nodelock. ` : ""}<button class="btn ghost" id="svOpen" style="padding:3px 8px;font-size:12.5px">Apri nel solver</button></p>`;
    const b = document.getElementById("svOpen"); if (b) b.onclick = () => gwOpenHand(cfg, cfg.lockName);
  });
}


