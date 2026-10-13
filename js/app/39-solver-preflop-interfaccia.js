/* ================= SOLVER PREFLOP: interfaccia ================= */
let SVMODE = "study";
let PF = { mode: "course", line: [], view: "strat", filter: null, sel: null, path: [], cmp: "solver", busy: false };
const PF_COL = { fold: "var(--sv-fold)", call: "var(--sv-check)", raise: "var(--sv-b3)", raise2: "#9e2f3b", allin: "var(--sv-allin)" };
const pfKind = lb => /^fold/i.test(lb) ? "fold" : /^call/i.test(lb) ? "call" : /all-in/i.test(lb) ? "allin" : /4-bet|5-bet|cold 4/i.test(lb) ? "raise2" : "raise";
const pfNum = lb => { const m = String(lb).match(/([\d]+(?:,\d+)?)\s*bb/); return m ? +m[1].replace(",", ".") : null; };
const pfLow = p => p.toLowerCase();
function svModeBar() { return ""; }
function svModeBind() { document.querySelectorAll("[data-svm]").forEach(b => b.onclick = () => { SVMODE = b.dataset.svm; renderSolver(); }); }

/* ---------- navigazione nelle tabelle GTO ---------- */
function pfSpotFor(pos, op) { return preT(pos === "BB" ? "bb_" + pfLow(op) : pfLow(pos) + "_" + pfLow(op)); }
function pfCourseState(line) {
  const seats = PF_POS.map(p => ({ pos: p, st: "wait", lb: "" }));
  const seat = p => seats[PF_POS.indexOf(p)];
  const reach = Object.fromEntries(PF_POS.map(p => [p, new Float64Array(PF_N).fill(1)]));
  let li = 0, opener = null, tb = null, cur = null, end = null, pot = 1.5;
  const take = (pos, sp) => {
    if (li >= line.length) { cur = { pos, sp }; seat(pos).st = "cur"; return null; }
    const a = line[li++], lb = sp.acts[a];
    for (let k = 0; k < PF_N; k++) { const f = sp.f[pfName(k)]; reach[pos][k] *= f ? f[a] : 0; }
    seat(pos).st = pfKind(lb) === "fold" ? "fold" : "done"; seat(pos).lb = lb; seat(pos).kind = pfKind(lb); seat(pos).back = li - 1;
    return a;
  };
  for (const p of PF_POS) {
    if (p === "BB") { seat(p).st = "done"; seat(p).lb = "Walk"; end = "Tutti foldano: il BB vince i bui."; break; }
    const a = take(p, preT("rfi_" + pfLow(p)));
    if (a == null) break;
    if (a === 1) { opener = p; pot += pfNum(preT("rfi_" + pfLow(p)).acts[1]) - (PF_BLIND[p] || 0); break; }
  }
  if (opener && !cur && !end) {
    const after = PF_POS.slice(PF_POS.indexOf(opener) + 1);
    for (const p of after) {
      const sp = pfSpotFor(p, opener);
      const a = take(p, sp);
      if (a == null) break;
      const k = pfKind(sp.acts[a]);
      if (k === "call") { end = `Il ${p} chiama: si va al flop in un single raised pot.`; after.slice(after.indexOf(p) + 1).forEach(q => seat(q).st = "out"); break; }
      if (k !== "fold") { tb = p; after.slice(after.indexOf(p) + 1).forEach(q => { seat(q).st = "fold"; seat(q).lb = "Fold"; seat(q).kind = "fold"; }); break; }
    }
    if (!cur && !end && !tb) end = `Tutti foldano: il ${opener} vince i bui.`;
  }
  if (tb && !cur && !end) {
    const sp = preT(pfLow(opener) + "_vs_" + pfLow(tb) + "3");
    if (!sp) end = "Non c'è una tabella per questa risposta al 3-bet.";
    else {
      const a = take(opener, sp);
      if (a != null) {
        const k = pfKind(sp.acts[a]);
        end = k === "fold" ? `Il ${opener} folda: il ${tb} vince il piatto.` : k === "call" ? `Il ${opener} chiama: si va al flop in un 3-bet pot.` : `4-bet del ${opener}: non ci sono tabelle per la risposta del ${tb}.`;
        if (k !== "fold" && k !== "call") PF.solveHint = { a: opener, b: tb };
      }
    }
  }
  return { seats, cur, end, reach, opener, tb };
}
function pfCourseNode(st) {
  const sp = st.cur.sp, r = st.reach[st.cur.pos];
  return { title: `${st.cur.pos} · ${sp.label}`, acts: sp.acts.map(lb => ({ lb, kind: pfKind(lb) })), freq: (h, a) => { const f = sp.f[pfName(h)]; return f ? f[a] : (a === 0 ? 1 : 0); }, reach: h => r[h], est: sp.est };
}

/* ---------- griglia ---------- */
function pfGridHTML(nd) {
  const n = PF_N, view = PF.view;
  let evMax = 0.5; if (view === "ev" && nd.ev) for (let h = 0; h < n; h++) if (nd.reach(h) > 0.001) evMax = Math.max(evMax, Math.abs(nd.ev(h)));
  let h = `<div class="pfgrid${view !== "strat" || PF.filter != null ? " hasv" : ""}">`;
  for (let k = 0; k < n; k++) {
    const r = nd.reach(k), name = pfName(k);
    let inner = "", sub = "";
    if (r > 0.001) {
      if (view === "strat") {
        let acc = 0; const st = [];
        nd.acts.forEach((a, i) => { let f = nd.freq(k, i); if (PF.filter != null && PF.filter !== i) f = 0; if (f <= 0.001) return; st.push(`${PF_COL[a.kind]} ${acc * 100}% ${(acc + f) * 100}%`); acc += f; });
        if (PF.filter != null) st.push(`transparent ${acc * 100}% 100%`);
        inner = `<i class="pff" style="height:${Math.max(8, r * 100)}%;background:${st.length ? `linear-gradient(90deg,${st.join(",")})` : "transparent"}"></i>`;
        if (PF.filter != null) sub = `<em>${Math.round(nd.freq(k, PF.filter) * 100)}</em>`;
      } else if (view === "ev" && nd.ev) {
        const e = nd.ev(k), t = Math.min(1, Math.abs(e) / evMax);
        const z = Math.abs(e) < 0.05;
        inner = `<i class="pff" style="height:100%;background:${z ? "var(--surface2)" : e > 0 ? `rgba(63,163,107,${0.18 + 0.72 * t})` : `rgba(208,73,63,${0.18 + 0.72 * t})`}"></i>`;
        sub = `<em>${z ? "0" : (e > 0 ? "+" : "") + fmt(e, Math.abs(e) < 10 ? 1 : 0)}</em>`;
      } else if (view === "eq" && nd.eq) {
        const e = nd.eq(k);
        inner = `<i class="pff" style="height:100%;background:rgba(111,143,207,${Math.max(0.1, Math.min(1, (e - 0.2) / 0.6))})"></i>`;
        sub = `<em>${Math.round(e * 100)}</em>`;
      }
    }
    h += `<div class="pfc${r > 0.001 ? "" : " off"}${PF.sel === k ? " sel" : ""}" data-h="${k}">${inner}<span>${name}</span>${sub}</div>`;
  }
  return h + `</div>`;
}
function pfSummary(nd) {
  const n = PF_N, m = nd.acts.length, tot = new Array(m).fill(0); let W = 0;
  for (let k = 0; k < n; k++) { const c = pfCombos(k) * nd.reach(k); if (!c) continue; W += c; for (let a = 0; a < m; a++) tot[a] += c * nd.freq(k, a); }
  return { W, tot };
}
function pfSideHTML(nd) {
  const { W, tot } = pfSummary(nd);
  let h = `<div class="pfsum"><div class="pfsum-h"><b>${nd.who || "Range"}</b><span>${fmt(W, 0)} combo · ${fmt(W / 1326 * 100, 1)}% delle mani</span></div>`;
  h += `<div class="pfbar">${nd.acts.map((a, i) => `<i style="width:${W ? tot[i] / W * 100 : 0}%;background:${PF_COL[a.kind]}"></i>`).join("")}</div>`;
  h += nd.acts.map((a, i) => `<button class="pfact ${PF.filter === i ? "on" : ""}" data-flt="${i}"><i style="background:${PF_COL[a.kind]}"></i><b>${esc(a.lb)}</b><span>${fmt(W ? tot[i] / W * 100 : 0, 1)}%</span><small>${fmt(tot[i], 0)} combo</small></button>`).join("");
  h += `<p class="muted pfnote">Tocca un'azione per vedere solo quella nella griglia.</p></div>`;
  h += `<div class="pfdet" id="pfDet">${pfDetHTML(nd, PF.sel)}</div>`;
  return h;
}
function pfDetHTML(nd, k) {
  if (k == null) return `<p class="muted" style="margin:0">Passa sopra una mano (o toccala) per vedere frequenze${nd.ev ? ", EV ed equity" : ""}.</p>`;
  const r = nd.reach(k), name = pfName(k);
  if (r <= 0.001) return `<div class="pfdet-h"><b>${name}</b><span>non è nel range a questo punto</span></div>`;
  let h = `<div class="pfdet-h"><b>${name}</b><span>${fmt(pfCombos(k) * r, 1)} combo${r < 0.999 ? ` (peso ${Math.round(r * 100)}%)` : ""}${nd.eq ? ` · equity ${fmt(nd.eq(k) * 100, 1)}%` : ""}</span></div>`;
  h += nd.acts.map((a, i) => { const f = nd.freq(k, i); return `<div class="pfdet-r"><span><i style="background:${PF_COL[a.kind]}"></i>${esc(a.lb)}</span><div class="pftrack"><i style="width:${f * 100}%;background:${PF_COL[a.kind]}"></i></div><b>${Math.round(f * 100)}%</b>${nd.evA ? `<em>${nd.evA(k, i) >= 0 ? "+" : ""}${fmt(nd.evA(k, i), 2)}bb</em>` : ""}</div>`; }).join("");
  if (nd.ev) h += `<p class="muted" style="margin:6px 0 0;font-size:12px">EV rispetto al fold: <b>${nd.ev(k) >= 0 ? "+" : ""}${fmt(nd.ev(k), 2)}bb</b>. Contando dall'inizio della mano, bui compresi, vale ${nd.evAbs(k) >= 0 ? "+" : ""}${fmt(nd.evAbs(k), 2)}bb.</p>`;
  return h;
}
function pfBindGrid(nd, rerender) {
  const det = $("#pfDet");
  document.querySelectorAll(".pfc").forEach(c => {
    c.onmouseenter = () => { if (PF.sel == null && det) det.innerHTML = pfDetHTML(nd, +c.dataset.h); };
    c.onclick = () => { PF.sel = PF.sel === +c.dataset.h ? null : +c.dataset.h; rerender(); };
  });
  const g = document.querySelector(".pfgrid"); if (g) g.onmouseleave = () => { if (PF.sel == null && det) det.innerHTML = pfDetHTML(nd, null); };
  document.querySelectorAll("[data-flt]").forEach(b => b.onclick = () => { const i = +b.dataset.flt; PF.filter = PF.filter === i ? null : i; rerender(); });
  document.querySelectorAll("[data-pfv]").forEach(b => b.onclick = () => { PF.view = b.dataset.pfv; rerender(); });
}
function pfSeatsHTML(seats, clickable) {
  return `<div class="pfseats">${seats.map((s, i) => `<button class="pfseat st-${s.st}" ${clickable && (s.st === "done" || s.st === "fold") && s.back != null ? `data-back="${s.back}"` : "disabled"}><b>${s.pos}</b><span${s.kind ? ` style="color:${PF_COL[s.kind]}"` : ""}>${s.st === "cur" ? "decide" : s.st === "wait" ? "" : s.st === "out" ? "" : esc(s.lb)}</span></button>`).join("")}</div>`;
}

/* ---------- pagina ---------- */
function renderPF() {
  pfLoad();
  let h = svModeBar();
  h += `<div class="svhead"><div><h2>Preflop</h2><p>Esplora le tabelle GTO passo per passo, oppure risolvi uno spot heads-up con il solver preflop (CFR+ su tutte le 169 mani, card removal incluso).</p></div></div>`;
  h += `<div class="segm pfsub"><button class="${PF.mode === "course" ? "on" : ""}" data-pfm="course">Tabelle GTO</button><button class="${PF.mode === "solve" ? "on" : ""}" data-pfm="solve">Risolvi uno spot</button></div>`;
  h += `<div id="pfBody"></div>`;
  $("#view").innerHTML = h;
  svModeBind();
  document.querySelectorAll("[data-pfm]").forEach(b => b.onclick = () => { PF.mode = b.dataset.pfm; PF.filter = null; PF.sel = null; renderPF(); });
  PF.mode === "course" ? pfRenderCourse() : pfRenderSolve();
}
function pfRenderCourse() {
  const box = $("#pfBody"); PF.solveHint = null;
  const st = pfCourseState(PF.line);
  let h = `<div class="pfline">${pfSeatsHTML(st.seats, true)}<button class="btn small" id="pfReset" ${PF.line.length ? "" : "disabled"}>Ricomincia</button></div>`;
  if (st.cur) {
    const nd = pfCourseNode(st); nd.who = st.cur.pos;
    const { W, tot } = pfSummary(nd);
    h += `<div class="pfacts">${nd.acts.map((a, i) => `<button class="pfgo" data-go="${i}" style="--c:${PF_COL[a.kind]}"><b>${esc(a.lb)}</b><span>${fmt(W ? tot[i] / W * 100 : 0, 1)}%</span></button>`).join("")}</div>`;
    h += `<p class="pftitle">${esc(nd.title)}${nd.est ? ` <span class="pill mid">stima</span>` : ""}</p>`;
    h += `<div class="pfmain"><div>${pfGridHTML(nd)}</div><div class="pfside">${pfSideHTML(nd)}</div></div>`;
    box.innerHTML = h;
    document.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { PF.line = [...PF.line, +b.dataset.go]; PF.filter = null; PF.sel = null; pfRenderCourse(); });
    pfBindGrid(nd, pfRenderCourse);
  } else {
    h += `<div class="pfend"><p><b>${esc(st.end || "")}</b></p>${PF.solveHint ? `<button class="btn3d" id="pfToSolve">Risolvi la risposta al 4-bet con il solver</button>` : ""}</div>`;
    box.innerHTML = h;
    if ($("#pfToSolve")) $("#pfToSolve").onclick = () => { PF.mode = "solve"; PF.form = pfDefaultForm(PF.solveHint.a, PF.solveHint.b); PF.T = null; renderPF(); };
  }
  document.querySelectorAll("[data-back]").forEach(b => b.onclick = () => { PF.line = PF.line.slice(0, +b.dataset.back); PF.filter = null; PF.sel = null; pfRenderCourse(); });
  $("#pfReset").onclick = () => { PF.line = []; PF.filter = null; PF.sel = null; pfRenderCourse(); };
}

/* ---------- solver ---------- */
function pfDefaultForm(a, b) {
  a = a || "BTN"; b = b || "BB";
  const rfi = preT("rfi_" + pfLow(a)), d3 = pfSpotFor(b, a), v3 = preT(pfLow(a) + "_vs_" + pfLow(b) + "3");
  const open = rfi ? pfNum(rfi.acts[1]) : 2.5;
  const x3 = d3 ? pfNum(d3.acts[d3.acts.length - 1]) : (b === "SB" || b === "BB" ? open * 4.2 : open * 3.2);
  const x4 = v3 ? pfNum(v3.acts[2]) : x3 * 2.3;
  return { a, b, stack: 100, open, x3: Math.round(x3 * 10) / 10, x4: Math.round(x4 * 10) / 10, flatB: b === "BB", flatA: true, flatB4: true, jam: "auto", rake: (typeof gwSetInit === "function" ? gwSetInit().rake : 5), cap: (typeof gwSetInit === "function" ? gwSetInit().cap : 3), openMode: "course", iters: 1500 };
}
/* tavolo per scegliere lo spot: tocca chi apre e chi risponde */
function pfPickTable(f) {
  const slots = { EP: [14, 8], MP: [50, -2], CO: [86, 8], BTN: [94, 76], SB: [50, 100], BB: [6, 76] };
  const ia = PF_POS.indexOf(f.a), ib = PF_POS.indexOf(f.b);
  const seat = p => {
    const i = PF_POS.indexOf(p), role = p === f.a ? "open" : p === f.b ? "resp" : i < ia || (i > ia && i < ib) || i > ib ? "fold" : "";
    const [x, y] = slots[p];
    const tag = role === "open" ? `Apre ${fmtN(f.open)}bb` : role === "resp" ? "Risponde" : "Fold";
    return `<button class="pfseat ${role}" data-pfseat="${p}" style="left:${x}%;top:${y}%"><b>${p}</b><em>${tag}</em></button>`;
  };
  return `<div class="pfpick"><p class="pfpick-h">Tocca <b class="o">chi apre</b>, poi <b class="r">chi risponde</b>. Gli altri foldano.</p>
    <div class="p6"><div class="p6-felt"><div class="qrail"></div>
      <div class="p6-mid"><span class="ptbl-pre">Preflop</span><span class="p6-pot"><b>${f.a}</b> apre, <b>${f.b}</b> risponde · ${f.stack}bb</span></div>
      ${PF_POS.map(seat).join("")}
    </div></div></div>`;
}
function pfRenderSolve() {
  const box = $("#pfBody"), f = PF.form || (PF.form = pfDefaultForm());
  const posOpt = (list, v) => list.map(p => `<option ${p === v ? "selected" : ""}>${p}</option>`).join("");
  const bList = PF_POS.slice(PF_POS.indexOf(f.a) + 1);
  const tog = (k, l) => `<button class="szchip ${f[k] ? "on" : ""}" data-tg="${k}">${l}</button>`;
  let h = "";
  const showSet = !PF.T || PF.showSet;
  if (PF.T) h += `<div class="pfres-h"><div><b>${PF.T.cfg.a} apre, ${PF.T.cfg.b} risponde</b><span>${fmtN(PF.T.cfg.stack)}bb · open ${fmtN(PF.T.cfg.open)} · 3-bet ${fmtN(PF.T.cfg.x3)} · 4-bet ${fmtN(PF.T.cfg.x4)} · rake ${fmtN(PF.T.cfg.rake * 100)}% cap ${fmtN(PF.T.cfg.cap)}bb</span></div><button class="btn small" id="pfSet">${showSet ? "Nascondi impostazioni" : "Modifica lo spot"}</button></div>`;
  if (showSet) {
    h += `<div class="pfform pfsimple">
      ${pfPickTable(f)}
      <div class="pfstk"><span>Stack effettivo</span><div class="segm small">${[40, 60, 100, 150, 200].map(s => `<button class="${f.stack == s ? "on" : ""}" data-stk="${s}">${s}bb</button>`).join("")}</div></div>
      <div class="svgo"><button class="btn3d" id="pfGo">Risolvi ${f.a} contro ${f.b}</button><span id="pfMsg" class="muted" style="font-size:14px"></span></div>
      <details class="pfadv"><summary>⚙ Impostazioni avanzate (size, rake, azioni, precisione)</summary>
      <div class="pfrow"><label class="of">Open (bb)<input id="pfO" type="number" step="0.1" min="2" value="${f.open}"></label><label class="of">3-bet a (bb)<input id="pfX3" type="number" step="0.5" min="4" value="${f.x3}"></label><label class="of">4-bet a (bb)<input id="pfX4" type="number" step="0.5" min="8" value="${f.x4}"></label><label class="of">Rake %<input id="pfRk" type="number" step="0.5" min="0" max="10" value="${f.rake}"></label><label class="of">Cap rake (bb)<input id="pfCap" type="number" step="0.5" min="0" value="${f.cap}"></label></div>
      <div class="pfrow"><span class="muted" style="font-size:13px">Azioni permesse</span>${tog("flatB", `Flat di ${f.b} contro l'open`)}${tog("flatA", `Call di ${f.a} contro il 3-bet`)}${tog("flatB4", `Call di ${f.b} contro il 4-bet`)}</div>
      <div class="pfrow"><span class="muted" style="font-size:13px">All-in</span><div class="segm small">${[["auto", "Auto"], ["all", "In ogni nodo"], ["end", "Solo dopo il 4-bet"]].map(([v, l]) => `<button class="${f.jam === v ? "on" : ""}" data-jam="${v}">${l}</button>`).join("")}</div>
      <span class="muted" style="font-size:13px">Range di ${f.a}</span><div class="segm small"><button class="${f.openMode === "course" ? "on" : ""}" data-om="course">Tabella GTO</button><button class="${f.openMode === "solve" ? "on" : ""}" data-om="solve" ${f.a === "SB" && f.b === "BB" ? "" : "disabled title=\"Solo SB contro BB: con altri giocatori dietro l'open heads-up sarebbe troppo largo\""}>Risolvi anche l'open</button></div>
      <span class="muted" style="font-size:13px">Precisione</span><div class="segm small">${[[600, "Veloce"], [1500, "Normale"], [4000, "Alta"]].map(([v, l]) => `<button class="${f.iters == v ? "on" : ""}" data-pit="${v}">${l}</button>`).join("")}</div></div>
      ${f.b !== "BB" && f.flatB ? `<p class="warnbox">Il modello è heads-up: i bui dietro non entrano nel piatto. Con il flat attivo per ${f.b} il solver chiama più largo del reale, perché non conta squeeze e multiway.</p>` : ""}
      </details>
      <details class="pfhow"><summary>Come funziona</summary><p>CFR+ sulle 169 mani con le equity preflop reali (card removal incluso) e un modello di realizzazione dell'equity postflop: chi è in posizione realizza di più, le mani suited e connesse realizzano più delle offsuit scollegate, e più lo SPR è basso più si va verso l'equity pura. La rake si paga solo se si vede il flop (no flop no drop). Non è una soluzione postflop completa come quella dei solver commerciali: le frequenze sono una buona guida, gli EV sono stime.</p></details>
    </div>`;
  }
  h += `<div id="pfOut"></div>`;
  box.innerHTML = h;
  if ($("#pfSet")) $("#pfSet").onclick = () => { PF.showSet = !PF.showSet; pfRenderSolve(); };
  if (showSet) {
    const refill = (a, b) => { const d = pfDefaultForm(a, b); Object.assign(f, { a, b, open: d.open, x3: d.x3, x4: d.x4, flatB: d.flatB, openMode: a === "SB" && b === "BB" ? f.openMode : "course" }); pfRenderSolve(); };
    document.querySelectorAll("[data-pfseat]").forEach(b => b.onclick = () => {
      const p = b.dataset.pfseat, i = PF_POS.indexOf(p), ia = PF_POS.indexOf(f.a);
      if (p === f.a || p === f.b) return;
      if (i > ia) return refill(f.a, p);                       /* dopo chi apre: diventa chi risponde */
      if (p === "BB") return;                                  /* il BB non può aprire */
      const bl = PF_POS.slice(i + 1); refill(p, bl.includes(f.b) ? f.b : "BB");
    });
    [["pfO", "open"], ["pfX3", "x3"], ["pfX4", "x4"], ["pfRk", "rake"], ["pfCap", "cap"]].forEach(([id, k]) => $("#" + id).onchange = e => f[k] = +e.target.value);
    document.querySelectorAll("[data-stk]").forEach(b => b.onclick = () => { f.stack = +b.dataset.stk; pfRenderSolve(); });
    document.querySelectorAll("[data-tg]").forEach(b => b.onclick = () => { f[b.dataset.tg] = !f[b.dataset.tg]; pfRenderSolve(); });
    document.querySelectorAll("[data-jam]").forEach(b => b.onclick = () => { f.jam = b.dataset.jam; pfRenderSolve(); });
    document.querySelectorAll("[data-om]").forEach(b => b.onclick = () => { if (!b.disabled) { f.openMode = b.dataset.om; pfRenderSolve(); } });
    document.querySelectorAll("[data-pit]").forEach(b => b.onclick = () => { f.iters = +b.dataset.pit; pfRenderSolve(); });
    $("#pfGo").onclick = pfGo;
  }
  if (PF.T) pfRenderOut();
}
function pfGo() {
  const f = PF.form, msg = t => { const m = $("#pfMsg"); if (m) m.textContent = t; };
  if (PF.busy) return;
  if (!(f.open >= 2) || !(f.x3 > f.open) || !(f.x4 > f.x3)) return msg("Le size devono crescere: open < 3-bet < 4-bet.");
  if (!(f.stack > f.x3)) return msg("Lo stack deve essere più grande del 3-bet.");
  const cfg = { ...f, rake: f.rake / 100, openMode: f.a === "SB" && f.b === "BB" ? f.openMode : "course" };
  const T = pfBuildTree(cfg);
  let of = null;
  if (T.openFixed) { const sp = preT("rfi_" + pfLow(cfg.a)); of = new Float64Array(PF_N); for (let k = 0; k < PF_N; k++) { const x = sp.f[pfName(k)]; of[k] = x ? x[x.length - 1] : 0; } }
  pfInitSolve(T, of);
  PF.busy = true; const t0 = Date.now();
  pfSolveAsync(T, f.iters, fr => msg(`Risolvo... ${Math.round(fr * 100)}%`), T2 => {
    PF.busy = false; T2.ms = Date.now() - t0; PF.T = T2; PF.path = []; PF.filter = null; PF.sel = null; PF.showSet = false; PF.cmp = "solver";
    pfRenderSolve();
  });
}
function pfNodeAt(path) { let nd = PF.T.root; for (const i of path) { const c = nd.acts[i].child; if (c.t) return { nd, term: c, i }; nd = c; } return { nd }; }
function pfSolverNode(nd) {
  const T = PF.T, n = PF_N, who = nd.pl ? T.cfg.b : T.cfg.a;
  return { who, acts: nd.acts.map(a => ({ lb: a.lb, kind: pfKind(a.lb) })), freq: (h, a) => nd.avg[a * n + h], reach: h => nd.reach[h], ev: h => nd.ev[h] - nd.evA[0][h], evA: (h, a) => nd.evA[a][h] - nd.evA[0][h], evAbs: h => nd.ev[h], eq: h => nd.eq[h] };
}
function pfCourseAt(nd) {
  const T = PF.T, c = T.cfg;
  if (nd.depth === 1 && nd.pl === 1) return pfSpotFor(c.b, c.a);
  if (nd.depth === 2 && nd.pl === 0) return preT(pfLow(c.a) + "_vs_" + pfLow(c.b) + "3");
  if (nd.depth === 0) return preT("rfi_" + pfLow(c.a));
  return null;
}
function pfRenderOut() {
  const out = $("#pfOut"), T = PF.T, c = T.cfg;
  const at = pfNodeAt(PF.path), nd = at.nd;
  /* linea: posti A e B con la storia delle azioni */
  let hist = [], cur = T.root;
  PF.path.forEach((i, k) => { const a = cur.acts[i]; hist.push({ who: cur.pl ? c.b : c.a, lb: a.lb, kind: pfKind(a.lb), back: k }); cur = a.child.t ? cur : a.child; });
  let h = `<div class="pfstats"><span>Exploitability <b>${fmt(Math.max(0, T.expl) * 1000, 1)} mbb/mano</b></span><span>EV ${c.a} <b>${T.evA >= 0 ? "+" : ""}${fmt(T.evA, 2)}bb</b></span><span>EV ${c.b} <b>${T.evB >= 0 ? "+" : ""}${fmt(T.evB, 2)}bb</b></span><span>${T.it} iterazioni · ${fmt(T.ms / 1000, 1)}s</span></div>`;
  h += `<div class="pfline"><div class="pfseats">${T.openFixed ? `<button class="pfseat st-done" data-pback="-1"><b>${c.a}</b><span style="color:${PF_COL.raise}">Raise ${fmtN(c.open)} (GTO)</span></button>` : ""}${hist.map(x => `<button class="pfseat st-done" data-pback="${x.back}"><b>${x.who}</b><span style="color:${PF_COL[x.kind]}">${esc(x.lb)}</span></button>`).join("")}${at.term ? "" : `<button class="pfseat st-cur" disabled><b>${nd.pl ? c.b : c.a}</b><span>decide</span></button>`}</div>${PF.path.length ? `<button class="btn small" id="pfRoot">Dall'inizio</button>` : ""}</div>`;
  if (at.term) {
    const t = at.term, net = t.pot - t.rake;
    h += `<div class="pfend"><p><b>${t.t === "fold" ? `${t.win ? c.b : c.a} vince il piatto di ${fmtN(t.pot)}bb.` : t.allin ? `All-in chiamato: piatto ${fmtN(t.pot)}bb, si gira il board.` : `Si va al flop: piatto ${fmtN(t.pot)}bb${t.rake ? ` (rake ${fmtN(t.rake)}bb)` : ""}, stack dietro ${fmtN(c.stack - t.iA)}bb, SPR ${fmtN((c.stack - t.iA) / t.pot)}.`}</b></p><button class="btn" id="pfUp">Torna indietro</button></div>`;
    out.innerHTML = h;
  } else {
    const course = pfCourseAt(nd);
    const useCourse = PF.cmp === "course" && course;
    const vn = useCourse ? { ...pfCourseNode({ cur: { pos: nd.pl ? c.b : c.a, sp: course }, reach: { [nd.pl ? c.b : c.a]: nd.reach } }), who: (nd.pl ? c.b : c.a) + " · tabella GTO" } : pfSolverNode(nd);
    if (useCourse && PF.view !== "strat") PF.view = "strat";
    const sn = pfSolverNode(nd), { W, tot } = pfSummary(sn);
    h += `<div class="pfacts">${nd.acts.map((a, i) => `<button class="pfgo" data-sgo="${i}" style="--c:${PF_COL[pfKind(a.lb)]}"><b>${esc(a.lb)}</b><span>${fmt(W ? tot[i] / W * 100 : 0, 1)}%</span></button>`).join("")}</div>`;
    h += `<div class="pftabs"><div class="segm small">${[["strat", "Strategia"], ["ev", "EV vs fold"], ["eq", "Equity"]].map(([v, l]) => `<button class="${PF.view === v ? "on" : ""}" data-pfv="${v}" ${useCourse && v !== "strat" ? "disabled" : ""}>${l}</button>`).join("")}</div>${course ? `<div class="segm small"><button class="${PF.cmp === "solver" ? "on" : ""}" data-cmp="solver">Solver</button><button class="${PF.cmp === "course" ? "on" : ""}" data-cmp="course">Tabelle</button></div>` : ""}</div>`;
    if (useCourse) h += `<p class="muted" style="font-size:13px;margin:4px 0 8px">Tabella GTO ${esc(course.label)}${course.est ? " (stima)" : ""}, sullo stesso range che arriva qui.</p>`;
    h += `<div class="pfmain"><div>${pfGridHTML(vn)}</div><div class="pfside">${pfSideHTML(vn)}</div></div>`;
    out.innerHTML = h;
    document.querySelectorAll("[data-sgo]").forEach(b => b.onclick = () => { PF.path = [...PF.path, +b.dataset.sgo]; PF.filter = null; PF.sel = null; pfRenderOut(); });
    document.querySelectorAll("[data-cmp]").forEach(b => b.onclick = () => { PF.cmp = b.dataset.cmp; PF.filter = null; pfRenderOut(); });
    pfBindGrid(vn, pfRenderOut);
  }
  document.querySelectorAll("[data-pback]").forEach(b => b.onclick = () => { const k = +b.dataset.pback; PF.path = k < 0 ? [] : PF.path.slice(0, k); PF.filter = null; PF.sel = null; pfRenderOut(); });
  if ($("#pfRoot")) $("#pfRoot").onclick = () => { PF.path = []; PF.filter = null; PF.sel = null; pfRenderOut(); };
  if ($("#pfUp")) $("#pfUp").onclick = () => { PF.path = PF.path.slice(0, -1); pfRenderOut(); };
}

