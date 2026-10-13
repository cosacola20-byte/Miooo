/* ================= SONAR · ALLENAMENTO EQUITY =================
   Scegli il range dell'avversario e da quali mani pescare la tua. Il Sonar distribuisce board e mano,
   tu stimi l'equity con lo slider, poi vedi quella vera (stesso motore del calcolatore) e quanto ti sei avvicinato. */
const ET_STREETS = [["pre", "Preflop", 0], ["flop", "Flop", 3], ["turn", "Turn", 4], ["river", "River", 5]];
function etCfg() { return S.etCfg || (S.etCfg = { vil: "77+,A8s+,KTs+,QTs+,JTs,ATo+,KJo+", hero: "casuale", st: "flop", n: 10, keep: false }); }
let ET = null;
/* finestra con la griglia del range (anche con i semi precisi) */
function eqRangeModal(title, text, onUse) {
  const tmp = { oop: String(text || "").split(/[,\s]+/).filter(t => !/^[2-9TJQKA][shdc][2-9TJQKA][shdc](:[\d.]+)?$/i.test(t) && !/^(casuale|random|tutte)$/i.test(t)).join(","), brush: 100, cx: reParseCombos(text) };
  if (/^(casuale|random|tutte)$/i.test(String(text || "").trim())) tmp.oop = "22+,A2s+,K2s+,Q2s+,J2s+,T2s+,92s+,82s+,72s+,62s+,52s+,42s+,32s,A2o+,K2o+,Q2o+,J2o+,T2o+,92o+,82o+,72o+,62o+,52o+,42o+,32o";
  gModal(`<h3 style="margin:0 0 4px">${esc(title)}</h3><p class="muted" style="font-size:13px;margin:0 0 10px">Tocca o trascina sulle celle. Con «Scegli i semi» tieni solo alcune combinazioni.</p><div class="eqre"></div><div class="svrow" style="margin-top:12px"><button class="btn3d" id="eqUse">Usa questo range</button></div>`, (m, close) => {
    m.querySelector(".gmbox").classList.add("eqwide");
    svRangeEditor(m.querySelector(".eqre"), tmp, 0, null, { suits: true });
    m.querySelector("#eqUse").onclick = () => { onUse([tmp.oop, reCombosStr(tmp.cx || {})].filter(Boolean).join(",")); close(); };
  });
}
const etName = x => "23456789TJQKA"[x >> 2] + "cdhs"[x & 3];
function etDeal() {
  const C = etCfg(), nb = (ET_STREETS.find(s => s[0] === C.st) || ET_STREETS[1])[2];
  for (let tries = 0; tries < 60; tries++) {
    let hero = C.keep && ET.cur ? ET.cur.hero : null;
    const used = new Set(hero ? djCs(hero) : []), deck = []; for (let k = 0; k < 52; k++) if (!used.has(k)) deck.push(k);
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    const board = deck.slice(0, nb);
    if (!hero) {
      const pool = eqParse(C.hero, board).cs; if (!pool.length) return null;
      const tot = pool.reduce((a, c) => a + c[2], 0); let x = Math.random() * tot, pick = pool[0];
      for (const c of pool) { x -= c[2]; if (x <= 0) { pick = c; break; } }
      hero = etName(pick[0]) + etName(pick[1]);
    }
    const bs = board.map(etName).join("");
    if (!eqParse(C.vil, djCs(bs)).cs.filter(c => !djCs(hero).includes(c[0]) && !djCs(hero).includes(c[1])).length) continue;
    return { hero, board: bs, est: 50 };
  }
  return null;
}
function etStart() {
  const C = etCfg(), v = eqParse(C.vil, []), h = eqParse(C.hero, []);
  if (v.bad.length || !v.cs.length) return gToast("Controlla il range dell'avversario.");
  if (h.bad.length || !h.cs.length) return gToast("Controlla le mani da cui pescare la tua.");
  ET = { stage: "q", qs: [], cur: null, i: 0 };
  etNext();
}
function etNext() {
  const C = etCfg();
  if (ET.qs.length >= C.n && C.n) { ET.stage = "end"; return etRender(); }
  const q = etDeal(); if (!q) { gToast("Non riesco a distribuire una mano con questi range."); ET.stage = "setup"; return etRender(); }
  ET.cur = q; ET.stage = "q";
  q.job = eqJob([q.hero, C.vil], q.board); eqBackground(q.job);
  etRender();
}
function etReveal() {
  const q = ET.cur; if (!q || ET.stage !== "q") return;
  const o = eqFinish(q.job); if (!o) return gToast("Non sono riuscito a calcolare l'equity.");
  q.real = o.eq[0]; q.note = eqNote(o); q.err = Math.abs(q.est - q.real);
  q.pts = Math.max(0, Math.round(100 - q.err * 6));
  ET.qs.push({ hero: q.hero, board: q.board, est: q.est, real: q.real, err: q.err, pts: q.pts });
  ET.stage = "rev"; etRender();
}
const etGrade = e => e <= 2 ? ["Perfetto", "g3"] : e <= 5 ? ["Ottimo", "g2"] : e <= 10 ? ["Vicino", "g1"] : ["Lontano", "g0"];
function etRender() {
  const root = $("#etRoot"); if (!root) return;
  const C = etCfg(), st = (ET_STREETS.find(s => s[0] === C.st) || ET_STREETS[1]);
  const vN = eqNComb(eqParse(C.vil, []).cs), hN = eqNComb(eqParse(C.hero, []).cs);
  const short = t => { const s2 = String(t).trim(); return s2.length > 60 ? s2.slice(0, 58) + "…" : s2; };
  const setup = `<section class="eqbox et-setup ${ET && ET.stage !== "setup" ? "mini" : ""}"><div class="et-sh"><h3>Impostazioni</h3><button type="button" class="btn small ghost" id="etReset" title="Torna alle impostazioni iniziali e azzera l'allenamento">↺ Reset</button></div>
    <div class="et-rng"><label>Il range dell'avversario</label><div class="et-in"><input type="text" class="mono" id="etVil" value="${esc(C.vil)}" spellcheck="false"><button class="btn small" data-etr="vil">Range</button></div><small class="muted">${fmtN(Math.round(vN))} combo · ${fmtN(Math.round(vN / 1326 * 1000) / 10)}% delle mani</small></div>
    <div class="et-rng"><label>Le tue carte vengono pescate da</label><div class="et-in"><input type="text" class="mono" id="etHero" value="${esc(C.hero)}" spellcheck="false"><button class="btn small" data-etr="hero">Range</button></div><small class="muted">${fmtN(Math.round(hN))} combo${/^casuale$/i.test(C.hero.trim()) ? " (tutte le mani)" : ""}</small></div>
    <div class="et-opts"><div><label>Strada</label><div class="segm small">${ET_STREETS.map(([k, l]) => `<button class="${C.st === k ? "on" : ""}" data-ets="${k}">${l}</button>`).join("")}</div></div>
      <div><label>Domande</label><div class="segm small">${[10, 20, 0].map(n => `<button class="${C.n === n ? "on" : ""}" data-etn="${n}">${n || "∞"}</button>`).join("")}</div></div>
      <label class="et-keep"><input type="checkbox" id="etKeep" ${C.keep ? "checked" : ""}> Tieni la mia mano per la prossima domanda</label></div>
    ${!ET || ET.stage === "setup" || ET.stage === "end" ? `<div class="svgo" style="margin:12px 0 0"><button class="btn3d" id="etGo">${ET && ET.stage === "end" ? "Ricomincia" : "Inizia l'allenamento"}</button></div>` : `<div class="svgo" style="margin:10px 0 0"><button class="btn small ghost" id="etRestart">Ricomincia con queste impostazioni</button></div>`}</section>`;
  let main = "";
  if (ET && (ET.stage === "q" || ET.stage === "rev")) {
    const q = ET.cur, n = ET.qs.length + (ET.stage === "q" ? 1 : 0), tot = C.n;
    const parts = [...(q.board ? [{ lbl: st[1], cards: q.board }] : []), { hero: 1, lbl: "La tua mano", cards: q.hero }];
    const avg = ET.qs.length ? ET.qs.reduce((a, x) => a + x.err, 0) / ET.qs.length : null;
    main = `<section class="eqbox et-q"><div class="et-head"><span class="eyebrow">Domanda ${n}${tot ? " di " + tot : ""}</span>${avg != null ? `<span class="et-avg">Errore medio <b>${fmt(avg, 1)}</b> punti</span>` : ""}<button type="button" class="btn small ghost et-rst" data-etrst title="Azzera l'allenamento">↺ Reset</button></div>
      ${tableHtml(parts)}
      <div class="et-vil"><span>Contro il range</span><b class="mono">${esc(short(C.vil))}</b></div>
      ${ET.stage === "q" ? `<div class="et-est"><div class="et-big"><b id="etVal">${q.est}</b><span>%</span></div><p class="muted">Quanta equity ha la tua mano contro il suo range${q.board ? "" : " (preflop)"}?</p>
        <input type="range" id="etSl" min="0" max="100" step="1" value="${q.est}" aria-label="Equity stimata">
        <div class="et-scale"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
        <div class="et-step"><button class="btn small ghost" data-etd="-5">−5</button><button class="btn small ghost" data-etd="-1">−1</button><button class="btn small ghost" data-etd="1">+1</button><button class="btn small ghost" data-etd="5">+5</button></div>
        <button class="btn primary et-go" id="etRev">Mostra l'equity vera</button></div>`
      : (() => { const g = etGrade(q.err); return `<div class="et-rev"><div class="et-res"><div><small>La tua stima</small><b>${q.est}%</b></div><div class="real"><small>Equity vera</small><b>${eqShow(q.real, 1)}</b></div><div class="${g[1]}"><small>${g[0]}</small><b>${q.err < 0.05 ? "0" : fmt(q.err, 1)}</b><small>punti di distanza</small></div></div>
        <div class="et-gauge"><i class="r" style="left:${q.real}%"><span>vera</span></i><i class="e" style="left:${q.est}%"><span>tu</span></i></div>
        <p class="muted" style="font-size:12.5px;margin:8px 0 0">${q.note}</p>
        <div class="et-acts"><button class="btn primary et-go" id="etNext">${tot && ET.qs.length >= tot ? "Vedi i risultati" : "Prossima domanda"}</button>${eqBtn([q.hero, C.vil], q.board, "Apri nel Sonar")}${!tot ? `<button class="btn ghost" id="etStop">Fine allenamento</button>` : ""}</div></div>`; })()}
    </section>`;
  } else if (ET && ET.stage === "end") {
    const Q = ET.qs, avg = Q.reduce((a, x) => a + x.err, 0) / Q.length, pts = Math.round(Q.reduce((a, x) => a + x.pts, 0) / Q.length), best = Q.filter(x => x.err <= 5).length;
    main = `<section class="eqbox et-end"><span class="eyebrow">Risultati</span><div class="et-endk"><div><b>${fmt(avg, 1)}</b><small>errore medio (punti)</small></div><div><b>${pts}</b><small>punteggio su 100</small></div><div><b>${best}/${Q.length}</b><small>stime entro 5 punti</small></div></div>
      <div class="eqtw"><table class="eqtab et-tab"><thead><tr><th>#</th><th>Mano</th><th>Board</th><th class="num">Tu</th><th class="num">Vera</th><th class="num">Errore</th></tr></thead><tbody>${Q.map((x, k) => `<tr><td>${k + 1}</td><td>${cardsHtml(x.hero, true)}</td><td>${x.board ? cardsHtml(x.board, true) : '<span class="muted">preflop</span>'}</td><td class="num">${x.est}%</td><td class="num"><b>${eqShow(x.real, 1)}</b></td><td class="num"><span class="et-e ${etGrade(x.err)[1]}">${fmt(x.err, 1)}</span></td></tr>`).join("")}</tbody></table></div></section>`;
  } else {
    main = `<section class="eqbox et-intro"><b>Come funziona</b><p>Il Sonar ti dà una mano e un board a caso. Tu stimi quanta equity hai contro il range dell'avversario, poi vedi quella vera e di quanti punti hai sbagliato. Con l'allenamento impari a «sentire» l'equity al tavolo, senza calcolatrice.</p></section>`;
  }
  root.innerHTML = (ET && (ET.stage === "q" || ET.stage === "rev") ? main + setup : setup + main);
  /* impostazioni */
  const save = () => persistSoon();
  const vI = root.querySelector("#etVil"), hI = root.querySelector("#etHero");
  [vI, hI].forEach(x => x.addEventListener("keydown", e => e.stopPropagation()));
  vI.onchange = () => { C.vil = vI.value; save(); etRender(); }; hI.onchange = () => { C.hero = hI.value; save(); etRender(); };
  root.querySelectorAll("[data-etr]").forEach(b => b.onclick = () => { const k = b.dataset.etr; eqRangeModal(k === "vil" ? "Range dell'avversario" : "Mani da cui pescare la tua", C[k], v => { C[k] = v || (k === "hero" ? "casuale" : ""); save(); etRender(); }); });
  root.querySelectorAll("[data-ets]").forEach(b => b.onclick = () => { C.st = b.dataset.ets; save(); if (ET && ET.stage === "q") etNext(); else etRender(); });
  root.querySelectorAll("[data-etn]").forEach(b => b.onclick = () => { C.n = +b.dataset.etn; save(); etRender(); });
  root.querySelector("#etKeep").onchange = e => { C.keep = e.target.checked; save(); };
  const go = root.querySelector("#etGo"); if (go) go.onclick = etStart;
  const rst = root.querySelector("#etReset"); if (rst) rst.onclick = () => { S.etCfg = null; ET = null; persistSoon(); etRender(); gToast("Allenamento azzerato: impostazioni iniziali."); };
  const rq = root.querySelector("[data-etrst]"); if (rq) rq.onclick = () => { ET = null; etRender(); gToast("Allenamento azzerato."); };
  const rs = root.querySelector("#etRestart"); if (rs) rs.onclick = etStart;
  /* domanda */
  const sl = root.querySelector("#etSl");
  if (sl) {
    const setV = v => { ET.cur.est = Math.max(0, Math.min(100, Math.round(v))); sl.value = ET.cur.est; root.querySelector("#etVal").textContent = ET.cur.est; sl.style.setProperty("--p", ET.cur.est + "%"); };
    sl.oninput = () => setV(+sl.value); setV(ET.cur.est);
    root.querySelectorAll("[data-etd]").forEach(b => b.onclick = () => setV(ET.cur.est + +b.dataset.etd));
    root.querySelector("#etRev").onclick = etReveal;
  }
  const nx = root.querySelector("#etNext"); if (nx) nx.onclick = etNext;
  const sp = root.querySelector("#etStop"); if (sp) sp.onclick = () => { ET.stage = "end"; etRender(); };
}
document.addEventListener("keydown", e => {
  if (tab !== "equity" || !EQF || EQF.mode !== "train" || !ET || run || document.querySelector("#gmodal")) return;
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && e.target.type !== "range") return;
  if (ET.stage === "q" && (e.key === "Enter")) { e.preventDefault(); etReveal(); }
  else if (ET.stage === "rev" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); etNext(); }
});
/* ---------- cosa colpisce il range (stile Flopzilla) con filtri ----------
   Ogni riga è una parte del range sul board: mani fatte, progetti, combinazioni.
   Imbuto = tieni solo queste (più imbuti = tieni l'unione); X = togli queste.
   Il filtro vale per quel giocatore e l'equity si ricalcola da sola. */
const FZ_PAIR = ["Overpair", "Top pair", "Coppia sotto la top", "Seconda coppia", "Coppia bassa"];
const FZ_COMBO = ["Colore + coppia", "Scala bilaterale + coppia", "Gutshot + coppia", "Colore + scala", "Colore + overcards"];
const FZ_DRAW2 = ["Progetto colore", "Scala bilaterale", "Gutshot", "Due overcards", "Backdoor colore", "Aria pura"];
function fzCats(h, b) {
  const k = fzClass(h, b), cats = [k.made], dr = k.draws.filter(d => d !== "Colore e scala insieme");
  if (b.length < 5) {
    const hr = [h[0] >> 2, h[1] >> 2], top = Math.max(...b.map(c => c >> 2));
    const over = hr[0] !== hr[1] && hr[0] > top && hr[1] > top && (k.made === "Niente" || k.made === "Asso alto");
    if (over) dr.push("Due overcards");
    dr.forEach(d => cats.push(d));
    const pair = FZ_PAIR.includes(k.made);
    if (pair && dr.includes("Progetto colore")) cats.push("Colore + coppia");
    if (pair && dr.includes("Scala bilaterale")) cats.push("Scala bilaterale + coppia");
    if (pair && dr.includes("Gutshot")) cats.push("Gutshot + coppia");
    if (dr.includes("Progetto colore") && (dr.includes("Scala bilaterale") || dr.includes("Gutshot"))) cats.push("Colore + scala");
    if (dr.includes("Progetto colore") && over) cats.push("Colore + overcards");
    if (!dr.length && (k.made === "Niente" || k.made === "Asso alto")) cats.push("Aria pura");
  }
  return cats;
}
const eqFzF = i => { const f = EQF.fzf && EQF.fzf[i]; return f && (f.keep.length || f.drop.length) ? f : null; };
function eqFilt(i, cs, board) {
  const f = eqFzF(i); if (!f || board.length < 3) return cs;
  return cs.filter(c => { const cats = fzCats(c, board); return (!f.keep.length || cats.some(x => f.keep.includes(x))) && !cats.some(x => f.drop.includes(x)); });
}
const FZI = {
  keep: `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="currentColor"><path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"/></svg>`,
  drop: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`
};
function eqFz() {
  const el = $("#eqFz"); if (!el) return;
  const c = EQF, board = djCs(c.board);
  if (board.length < 3) { el.innerHTML = `<p class="muted" style="margin:0">Metti almeno il flop (3 carte) per vedere come il range colpisce il board e filtrarlo.</p>`; return; }
  if (c.fz > c.p.length) c.fz = 1;
  const i = c.fz - 1, r = eqParse(c.p[i], board);
  c.fzf = c.fzf || {}; const f = c.fzf[i] || (c.fzf[i] = { keep: [], drop: [] });
  const sel = `<div class="fz2-top"><div class="segm small eqfzsel">${c.p.map((t, k) => `<button class="${c.fz === k + 1 ? "on" : ""}" data-fz="${k + 1}">G${k + 1}${eqFzF(k) ? " •" : ""}</button>`).join("")}</div>`;
  if (!r.cs.length || r.bad.length) { el.innerHTML = sel + `</div><p class="muted">Range non valido.</p>`; return; }
  const W = {}, Wf = {}; let tot = 0, totF = 0;
  const kept = new Set(eqFilt(i, r.cs, board));
  for (const cb of r.cs) { const cats = fzCats(cb, board), on = kept.has(cb); cats.forEach(x => { W[x] = (W[x] || 0) + cb[2]; if (on) Wf[x] = (Wf[x] || 0) + cb[2]; }); tot += cb[2]; if (on) totF += cb[2]; }
  const filtered = !!eqFzF(i), pc = v => fmt(v / tot * 100, 1) + "%";
  const row = (k, g) => {
    const v = W[k] || 0, vf = Wf[k] || 0, K = f.keep.includes(k), D = f.drop.includes(k);
    if (!v && !K && !D) return "";
    return `<div class="fz2r ${g} ${K ? "keep" : ""} ${D ? "drop" : ""} ${filtered && !vf ? "out" : ""}">
      <button type="button" class="fz2b k ${K ? "on" : ""}" data-fzk="${esc(k)}" title="Tieni solo questa parte" aria-pressed="${K}">${FZI.keep}</button><button type="button" class="fz2b x ${D ? "on" : ""}" data-fzd="${esc(k)}" title="Togli questa parte" aria-pressed="${D}">${FZI.drop}</button>
      <span class="fz2l">${esc(k)}</span><span class="fz2bar"><i style="width:${Math.max(v ? 1.5 : 0, v / tot * 100)}%"></i>${filtered ? `<em style="width:${vf / tot * 100}%"></em>` : ""}</span><span class="fz2v">${pc(v)}</span><span class="fz2c">${fmtN(Math.round(v * 10) / 10)}</span></div>`;
  };
  const grp = (t, list, g) => { const h = list.map(k => row(k, g)).join(""); return h ? `<div class="fz2g"><h4>${t}</h4>${h}</div>` : ""; };
  el.innerHTML = sel + `<div class="fz2-sum"><b>${fmtN(Math.round((filtered ? totF : tot) * 10) / 10)}</b> combo${filtered ? ` su ${fmtN(Math.round(tot * 10) / 10)} (${fmt(totF / tot * 100, 1)}%)` : ""}<span>G${c.fz} su ${icHand(c.board)}</span></div>${filtered ? `<button type="button" class="btn small ghost" data-fzclr>Togli i filtri</button><button type="button" class="btn small" data-fzfix>Fissa nel range</button>` : ""}</div>
    <p class="fz2-help">${FZI.keep} tieni solo quella parte del range · ${FZI.drop} toglila. L'equity si aggiorna da sola.</p>
    <div class="fz2">${grp("Mani fatte", FZ_MADE, "m")}${board.length < 5 ? grp("Progetti", FZ_DRAW2, "d") + grp("Combinazioni", FZ_COMBO, "c") : ""}</div>`;
  const upd = () => { c.res = null; eqStop(); const s = document.querySelector(`[data-eqs="${i}"]`); if (s) s.innerHTML = eqPlayerStat(i); eqFz(); eqResults(); eqRun(); };
  el.querySelectorAll("[data-fz]").forEach(b => b.onclick = () => { c.fz = +b.dataset.fz; eqFz(); });
  el.querySelectorAll("[data-fzk]").forEach(b => b.onclick = () => { const k = b.dataset.fzk; f.keep = f.keep.includes(k) ? f.keep.filter(x => x !== k) : [...f.keep, k]; f.drop = f.drop.filter(x => x !== k); upd(); });
  el.querySelectorAll("[data-fzd]").forEach(b => b.onclick = () => { const k = b.dataset.fzd; f.drop = f.drop.includes(k) ? f.drop.filter(x => x !== k) : [...f.drop, k]; f.keep = f.keep.filter(x => x !== k); upd(); });
  const clr = el.querySelector("[data-fzclr]"); if (clr) clr.onclick = () => { c.fzf[i] = { keep: [], drop: [] }; upd(); };
  const fix = el.querySelector("[data-fzfix]"); if (fix) fix.onclick = () => {
    const cs = eqFilt(i, eqParse(c.p[i], board).cs, board), nm = x => "23456789TJQKA"[x >> 2] + "cdhs"[x & 3];
    c.p[i] = cs.map(cb => nm(cb[0]) + nm(cb[1]) + (cb[2] < 0.999 ? ":" + Math.round(cb[2] * 100) / 100 : "")).join(","); c.fzf[i] = { keep: [], drop: [] }; c.res = null; eqStop(); renderEquity(); };
}

/* ---------- pagina del solver ---------- */
/* PF_B64: i dati sono in js/data/pf-b64.js */
