/* ================= RISOLVI CON IA (Solution Builder ================= */
const GW_STN = { 3: "flop", 4: "turn", 5: "river" };
const GW_STN2 = { 3: "Flop", 4: "Turn", 5: "River" };
function gwClassStr(E, r, p) {
  const G = E.G, m = {}, n = {};
  G.R[p].forEach((x, i) => { m[x.key] = (m[x.key] || 0) + r[p][i]; n[x.key] = (n[x.key] || 0) + 1; });
  const w = {}; Object.keys(m).forEach(k => { const v = m[k] / n[k]; if (v > 0.005) w[k] = Math.min(1, Math.round(v * 100) / 100); });
  return svRangeStr(w);
}
function gwBldOpen(L) {
  const li = GW.layers.indexOf(L), ss = gwStreetStart(L), E = L.E, base = ss.node.inv[0];
  const { r } = msReach(E, L.steps.slice(0, ss.idx));
  const norm = s => svRangeStr(svParseRange(s));
  const cf = { oop: norm(gwClassStr(E, r, 0)), ip: norm(gwClassStr(E, r, 1)), edit: 0, brush: 100 };
  GW.bld = { open: true, li, st0: ss.node.st, last: Math.max(E.tree.lastBet, ss.node.st), sets: gwSetsFromO(E.o, ss.node.st), mode: "auto", dynN: 1, dynWho: 2, ftab: ss.node.st, fpl: 1, cf, cf0: { oop: cf.oop, ip: cf.ip }, redit: null, pot: Math.round((E.o.pot + 2 * base) * 100) / 100, stack: Math.round((E.o.stack - base) * 100) / 100, pot0: E.o.pot + 2 * base, stack0: E.o.stack - base, board: [...E.G.board, ...ss.node.cards].map(hcstr).join(""), run: null };
}
function gwMiniRange(str) {
  const w = svParseRange(str), cells = [];
  Object.entries(w).forEach(([k, v]) => { cells[gwKeyIdx(k)] = { w: v, seg: [["#5ab966", 1]] }; });
  let n = 0; Object.entries(w).forEach(([k, v]) => n += v * combosOf(k));
  return { html: gwGrid(cells, { sm: true }).replace('class="gwgrid', 'class="gwgrid mini'), n };
}
function gwBldModal() {
  const B = GW.bld, L = GW.layers[B.li]; if (!L) return "";
  const names = [L.oop, L.ip];
  const running = B.run && B.run.active;
  let body = "";
  if (B.redit != null) {
    body = `<div class="gwhead"><b>Range di ${names[B.redit]}</b><button class="gwbtn" data-gbre="-1">Fatto</button></div><div class="gwlight"><div id="gwBldRE"></div></div>`;
  } else {
    const r0 = gwMiniRange(B.cf.oop), r1 = gwMiniRange(B.cf.ip);
    body += `<div class="gwbldr"><button class="gwbldrg" data-gbre="0"><div class="gwhead"><b>${esc(names[0])}</b><span>OOP · ${fmt(r0.n, 0)} combo · ✎</span></div>${r0.html}</button><button class="gwswap" data-gbsw="1" title="Scambia i range">⇄</button><button class="gwbldrg" data-gbre="1"><div class="gwhead"><b>${esc(names[1])}</b><span>IP · ${fmt(r1.n, 0)} combo · ✎</span></div>${r1.html}</button></div>`;
    body += `<div class="gwrow"><label class="gwlab">Piatto (bb)<input id="gwBpot" type="number" step="0.1" min="0.5" value="${B.pot}"></label><label class="gwlab">Stack effettivo (bb)<input id="gwBst" type="number" step="0.1" min="0.5" value="${B.stack}"></label><label class="gwlab">Board<span class="gwbd" style="margin:0">${(B.board.match(/../g) || []).map(c => gwCardS(c)).join("")}</span></label></div>`;
    body += `<div class="gwsub">Size delle puntate</div><div class="gwseg gwbig">${[["auto", "Automatica"], ["dyn", "Dinamica"], ["fix", "Fissa"]].map(([v, l]) => `<button class="${B.mode === v ? "on" : ""}" data-gbm="${v}">${l}</button>`).join("")}</div>`;
    if (B.mode === "auto") body += `<p class="gwmuted">Il solver usa un albero ricco (${B.st0 === 3 ? "33, 75 e 125%" : "25, 50, 75 e 125%"} al ${GW_STN[B.st0]}) e decide da solo quanto usare ogni size. Le street dopo usano le size delle impostazioni.</p>`;
    else if (B.mode === "dyn") body += `<p class="gwmuted">Scegli quante size vuoi usare in gioco e il solver prova le combinazioni, tiene quelle che perdono meno EV rispetto all'albero completo e ti dice quanto costa semplificare.</p>
      <div class="gwrow"><span class="gwmuted">Quante size al ${GW_STN[B.st0]}</span><div class="gwseg">${[1, 2].map(x => `<button class="${B.dynN === x ? "on" : ""}" data-gbdn="${x}">${x === 1 ? "1 size (monosize)" : "2 size"}</button>`).join("")}</div></div>
      <div class="gwrow"><span class="gwmuted">Per chi</span><div class="gwseg">${[[1, names[1]], [0, names[0]], [2, "Tutti e due"]].map(([v, l]) => `<button class="${B.dynWho === v ? "on" : ""}" data-gbdw="${v}">${esc(l)}</button>`).join("")}</div></div>`;
    else {
      const st = B.ftab, pl = B.fpl, s = B.sets[st] || (B.sets[st] = { oop: [], ip: [] }), list = s[pl ? "ip" : "oop"];
      body += `<div class="gwrow"><div class="gwseg">${Array.from({ length: B.last - B.st0 + 1 }, (_, k) => B.st0 + k).map(x => `<button class="${st === x ? "on" : ""}" data-gbft="${x}">${GW_STN2[x]}</button>`).join("")}</div><div class="gwseg">${[1, 0].map(x => `<button class="${pl === x ? "on" : ""}" data-gbfp="${x}">${esc(names[x])} ${x ? "(IP)" : "(OOP)"}</button>`).join("")}</div></div>
        <div class="gwsizes">${list.length ? list.map(x => `<span class="gwsz">${x}%<button data-gbfx="${x}">×</button></span>`).join("") : `<span class="gwmuted">${esc(names[pl])} non punta per primo al ${GW_STN[st]} (solo check, call, fold o raise)</span>`}<span class="gwadd"><input id="gwBadd" type="number" min="5" max="500" step="1" placeholder="%"><button class="gwbtn ghost" data-gbfa="1">+ Aggiungi</button></span></div>
        <div class="gwrow" style="gap:4px">${[25, 33, 50, 75, 100, 125, 150, 200].map(x => `<button class="gwchip ${list.includes(x) ? "on" : ""}" data-gbfq="${x}">${x}%</button>`).join("")}</div>
        <div class="gwsub">Raise (per tutti e due, su tutte le street)</div><div class="gwrow" style="gap:4px">${[50, 75, 100].map(x => `<button class="gwchip ${(B.sets.rz || []).includes(x) ? "on" : ""}" data-gbfr="${x}">${x}%</button>`).join("")}<button class="gwchip ${B.sets.allin ? "on" : ""}" data-gbfall="1">All-in</button></div>`;
    }
    if (running || (B.run && B.run.log && B.run.log.length)) {
      const R = B.run;
      body += `<div class="gwpanel" style="margin-top:8px">${running ? `<div class="gwprog"><i style="width:${Math.round(R.done / R.tot * 100)}%"></i></div><p class="gwmuted">${R.done}/${R.tot} alberi · ${esc(R.cur || "")}</p>` : ""}${R.log && R.log.length ? `<div class="gwtable"><table><thead><tr><th>Chi</th><th>Size</th><th>EV</th><th>Perde</th></tr></thead><tbody>${R.log.map(x => `<tr class="${x.best ? "best" : ""}"><td>${esc(x.who)}</td><td>${x.full ? "Completo: " : ""}${x.sizes.join("+")}%</td><td class="mono">${fmt(x.ev, 3)}</td><td class="mono">${x.full ? "-" : fmt(Math.max(0, x.loss), 3) + "bb"}</td></tr>`).join("")}</tbody></table></div>` : ""}</div>`;
    }
  }
  const edited = B.cf.oop !== B.cf0.oop || B.cf.ip !== B.cf0.ip;
  return `<div class="gwmodal"><div class="gwmodal-b gwbld"><div class="gwhead"><b>✦ Risolvi con IA · dal ${GW_STN[B.st0]}</b><button class="gwbtn ghost" data-gbx="1" ${running ? "disabled" : ""}>Chiudi</button></div>
    ${body}
    ${B.redit == null ? `<div class="gwrow" style="margin-top:10px"><button class="gwbtn gwgo" data-gbgo="1" ${running ? "disabled" : ""}>${B.mode === "dyn" ? "Trova le size e risolvi" : "Risolvi"}</button><span class="gwmuted">${edited ? "Range modificati: il solver userà le tue combo. " : ""}${B.mode === "dyn" ? `Circa ${B.st0 === 3 ? "1-3 minuti" : "20-60 secondi"}.` : B.st0 === 3 ? "Circa 20-60 secondi." : "Pochi secondi."}</span></div>` : ""}</div></div>`;
}
/* dialog della matita: size di un giocatore su una street */
function gwNedOpen(li, si) {
  const L = GW.layers[li]; if (!L) return;
  let n = L.E.tree.root; for (const k of L.steps.slice(0, si)) n = n.ch[k];
  if (!n || n.t !== "a") return;
  const x = L.E.o.sz[n.st] || { oop: [], ip: [], rz: [] };
  GW.ned = { li, si, st: n.st, pl: n.pl, bets: (n.pl ? x.ip : x.oop).map(v => Math.round(v * 100)), rz: (x.rz || []).map(v => Math.round(v * 100)), allin: L.E.o.allin !== false };
}
function gwNedModal() {
  const D = GW.ned, L = GW.layers[D.li]; if (!L) return "";
  const who = D.pl ? L.ip : L.oop;
  const chipRow = (arr, k) => `${arr.length ? arr.map(x => `<span class="gwsz">${x}%<button data-gnx="${k}:${x}">×</button></span>`).join("") : `<span class="gwmuted">nessuna</span>`}`;
  return `<div class="gwmodal"><div class="gwmodal-b" style="max-width:520px"><div class="gwhead"><b>✎ Size di ${esc(who)} al ${GW_STN[D.st]}</b><button class="gwbtn ghost" data-gnc="1">Annulla</button></div>
    <div class="gwsub">Puntate (% del piatto)</div><div class="gwsizes">${chipRow(D.bets, "b")}<span class="gwadd"><input id="gwNb" type="number" min="5" max="500" placeholder="%"><button class="gwbtn ghost" data-gna="b">+</button></span></div>
    <div class="gwrow" style="gap:4px">${[25, 33, 50, 75, 100, 125, 150, 200].map(x => `<button class="gwchip ${D.bets.includes(x) ? "on" : ""}" data-gnq="b:${x}">${x}%</button>`).join("")}</div>
    <div class="gwsub">Raise (% del piatto dopo il call)</div><div class="gwsizes">${chipRow(D.rz, "r")}<span class="gwadd"><input id="gwNr" type="number" min="20" max="500" placeholder="%"><button class="gwbtn ghost" data-gna="r">+</button></span></div>
    <div class="gwrow" style="gap:4px"><button class="gwchip ${D.allin ? "on" : ""}" data-gnall="1">All-in</button></div>
    <p class="gwmuted">Le size valgono per tutte le puntate di ${esc(who)} al ${GW_STN[D.st]}; i raise valgono per tutti e due. Il solver ricalcola dall'inizio del ${GW_STN[D.st]} con i range che arrivano lì.</p>
    <div class="gwrow"><button class="gwbtn gwgo" data-gngo="1">Risolvi da qui</button></div></div></div>`;
}
function gwAiBind(L, node) {
  const Q = s => document.querySelectorAll(s), re = () => renderStudy();
  Q("[data-gbld]").forEach(b => b.onclick = () => { if (L) { gwBldOpen(L); re(); } });
  Q("[data-gned]").forEach(b => b.onclick = ev => { ev.stopPropagation(); const [li, si] = b.dataset.gned.split(":").map(Number); gwNedOpen(li, si); re(); });
  /* dialog matita */
  const D = GW.ned;
  if (D) {
    const toggle = (k, v) => { const a = k === "b" ? D.bets : D.rz; const i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else { a.push(v); a.sort((x, y) => x - y); } };
    Q("[data-gnx]").forEach(b => b.onclick = () => { const [k, v] = b.dataset.gnx.split(":"); toggle(k, +v); re(); });
    Q("[data-gnq]").forEach(b => b.onclick = () => { const [k, v] = b.dataset.gnq.split(":"); toggle(k, +v); re(); });
    Q("[data-gna]").forEach(b => b.onclick = () => { const k = b.dataset.gna, inp = $(k === "b" ? "#gwNb" : "#gwNr"), v = Math.round(+inp.value); if (v > 0) { const a = k === "b" ? D.bets : D.rz; if (!a.includes(v)) { a.push(v); a.sort((x, y) => x - y); } } re(); });
    Q("[data-gnall]").forEach(b => b.onclick = () => { D.allin = !D.allin; re(); });
    Q("[data-gnc]").forEach(b => b.onclick = () => { GW.ned = null; re(); });
    Q("[data-gngo]").forEach(b => b.onclick = () => {
      const Ly = GW.layers[D.li]; GW.layers = GW.layers.slice(0, D.li + 1); Ly.steps = Ly.steps.slice(0, D.si);
      const sets = gwSetsFromO(Ly.E.o, D.st); sets[D.st] = sets[D.st] || { oop: [], ip: [] }; sets[D.st][D.pl ? "ip" : "oop"] = D.bets.slice(); sets.rz = D.rz.slice(); sets.allin = D.allin;
      GW.ned = null;
      gwReSolve(Ly, sets, null, `Ricalcolo il ${GW_STN[D.st]} con le nuove size`);
    });
  }
  /* solution builder */
  const B = GW.bld;
  if (!B || !B.open) return;
  const Lb = GW.layers[B.li];
  Q("[data-gbx]").forEach(b => b.onclick = () => { B.open = false; re(); });
  Q("[data-gbm]").forEach(b => b.onclick = () => { B.mode = b.dataset.gbm; re(); });
  Q("[data-gbdn]").forEach(b => b.onclick = () => { B.dynN = +b.dataset.gbdn; re(); });
  Q("[data-gbdw]").forEach(b => b.onclick = () => { B.dynWho = +b.dataset.gbdw; re(); });
  Q("[data-gbft]").forEach(b => b.onclick = () => { B.ftab = +b.dataset.gbft; re(); });
  Q("[data-gbfp]").forEach(b => b.onclick = () => { B.fpl = +b.dataset.gbfp; re(); });
  const cur = () => { const s = B.sets[B.ftab] || (B.sets[B.ftab] = { oop: [], ip: [] }); return s[B.fpl ? "ip" : "oop"]; };
  const tog = (a, v) => { const i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else { a.push(v); a.sort((x, y) => x - y); } };
  Q("[data-gbfx]").forEach(b => b.onclick = () => { tog(cur(), +b.dataset.gbfx); re(); });
  Q("[data-gbfq]").forEach(b => b.onclick = () => { tog(cur(), +b.dataset.gbfq); re(); });
  Q("[data-gbfa]").forEach(b => b.onclick = () => { const v = Math.round(+$("#gwBadd").value); if (v > 0 && !cur().includes(v)) tog(cur(), v); re(); });
  Q("[data-gbfr]").forEach(b => b.onclick = () => { B.sets.rz = B.sets.rz || []; tog(B.sets.rz, +b.dataset.gbfr); re(); });
  Q("[data-gbfall]").forEach(b => b.onclick = () => { B.sets.allin = !B.sets.allin; re(); });
  Q("[data-gbre]").forEach(b => b.onclick = () => { const v = +b.dataset.gbre; B.redit = v < 0 ? null : v; if (v >= 0) B.cf.edit = v; re(); });
  Q("[data-gbsw]").forEach(b => b.onclick = () => { const x = B.cf.oop; B.cf.oop = B.cf.ip; B.cf.ip = x; re(); });
  if (B.redit != null && $("#gwBldRE")) svRangeEditor($("#gwBldRE"), B.cf, B.redit);
  if ($("#gwBpot")) { $("#gwBpot").onchange = e => B.pot = +e.target.value; $("#gwBst").onchange = e => B.stack = +e.target.value; }
  Q("[data-gbgo]").forEach(b => b.onclick = () => gwBldGo());
}
function gwBldRanges() {
  const B = GW.bld;
  if (B.cf.oop === B.cf0.oop && B.cf.ip === B.cf0.ip) return null;
  return [svCombos(svParseRange(B.cf.oop)), svCombos(svParseRange(B.cf.ip))];
}
function gwBldGo() {
  const B = GW.bld, L = GW.layers[B.li]; if (!L || GW.busy) return;
  GW.layers = GW.layers.slice(0, B.li + 1);
  const ov = Math.abs(B.pot - B.pot0) > 0.01 || Math.abs(B.stack - B.stack0) > 0.01 ? { pot: B.pot, stack: B.stack } : null;
  const ranges = gwBldRanges();
  const sets = JSON.parse(JSON.stringify(B.sets));
  if (B.mode === "fix") { B.open = false; gwReSolve(L, sets, ranges, `Risolvo il ${GW_STN[B.st0]} con le tue size`, null, ov); return; }
  const rich = B.st0 === 3 ? [33, 75, 125] : [25, 50, 75, 125];
  const s0 = sets[B.st0] || (sets[B.st0] = { oop: [], ip: [] });
  if (B.mode === "auto") { if (s0.oop.length) s0.oop = rich.slice(); s0.ip = rich.slice(); B.open = false; GW.dynInfo = null; gwReSolve(L, sets, ranges, `Risolvo il ${GW_STN[B.st0]} con size automatiche`, null, ov); return; }
  gwDynamic(L, sets, ranges, ov);
}
/* Dynamic sizing: per ogni giocatore scelto prova le combinazioni di size e tiene quella con più EV */
function gwDynamic(L, sets, ranges, ov) {
  const B = GW.bld, st = B.st0, names = [L.oop, L.ip];
  const s0 = sets[st] || (sets[st] = { oop: [], ip: [] });
  const who = B.dynWho === 2 ? [1, 0].filter(p => p === 1 || s0.oop.length) : [B.dynWho];
  const flop = st === 3;
  const mono = flop ? [33, 50, 75, 125] : [25, 33, 50, 75, 100, 125];
  const duo = flop ? [[33, 75], [33, 125], [50, 125]] : [[25, 75], [33, 75], [33, 125], [50, 100], [50, 125]];
  const full = flop ? [33, 75, 125] : [25, 50, 75, 125];
  const cands = B.dynN === 1 ? mono.map(x => [x]) : duo;
  const iters = flop ? 30 : st === 4 ? 60 : 150;
  const ss = gwStreetStart(L), E = L.E, G = E.G, base = ss.node.inv[0];
  const { r } = msReach(E, L.steps.slice(0, ss.idx));
  const rg = ranges || [0, 1].map(p => G.R[p].map((x, i) => ({ c: x.c, w: r[p][i], key: x.key })).filter(x => x.w > 1e-4));
  const board = [...G.board, ...ss.node.cards], pot = ov ? ov.pot : E.o.pot + 2 * base, stack = ov ? ov.stack : E.o.stack - base;
  const jobs = []; who.forEach(p => { jobs.push({ p, sizes: full, full: true }); cands.forEach(c => jobs.push({ p, sizes: c })); });
  B.run = { active: true, done: 0, tot: jobs.length, cur: "", log: [] };
  renderStudy();
  let G0 = null; const res = {};
  const step = i => {
    if (i >= jobs.length) {
      B.run.active = false;
      const info = [];
      who.forEach(p => { const rs = B.run.log.filter(x => x.pp === p && !x.full).sort((a, b) => b.ev - a.ev); if (rs.length) { rs[0].best = true; s0[p ? "ip" : "oop"] = rs[0].sizes.slice(); info.push(`${names[p]} ${rs[0].sizes.join("% + ")}% (perdi ${fmt(Math.max(0, rs[0].loss), 3)}bb, ${fmt(Math.max(0, rs[0].loss) / pot * 100, 2)}% del piatto)`); } });
      GW.dynInfo = `Size dinamiche scelte al ${GW_STN[st]}: ${info.join(" · ")}.`;
      B.open = false;
      gwReSolve(L, sets, ranges, `Risolvo con le size scelte`, null, ov);
      return;
    }
    const j = jobs[i], ss2 = JSON.parse(JSON.stringify(sets)); ss2[st] = ss2[st] || { oop: [], ip: [] };
    who.forEach(p => { if (p !== j.p && res[p]) ss2[st][p ? "ip" : "oop"] = res[p]; });
    ss2[st][j.p ? "ip" : "oop"] = j.sizes;
    B.run.cur = `${names[j.p]}: ${j.full ? "albero completo" : j.sizes.join("% + ") + "%"}`;
    if (tab === "solver") renderStudy();
    const o = gwSolve(board, pot, stack, rg, "x", false, ss2);
    const E2 = msInit(o, G0, true); G0 = E2.G;
    msSolveAuto(E2, iters, null, E3 => {
      const ev = E3.stats.ev[j.p], fullRow = B.run.log.find(x => x.pp === j.p && x.full);
      B.run.log.push({ pp: j.p, who: names[j.p], sizes: j.sizes, full: !!j.full, ev, loss: fullRow ? fullRow.ev - ev : 0 });
      /* quando finiscono i candidati di un giocatore fisso la sua scelta per il successivo */
      const mine = B.run.log.filter(x => x.pp === j.p && !x.full);
      if (mine.length === cands.length) res[j.p] = mine.slice().sort((a, b) => b.ev - a.ev)[0].sizes;
      B.run.done = i + 1;
      setTimeout(() => step(i + 1), 0);
    });
  };
  step(0);
}

