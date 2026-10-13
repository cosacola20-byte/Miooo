/* ================= SOLVER: impostazione dello spot (passo per passo) ================= */
const RANK169 = ["AA","KK","QQ","JJ","TT","99","88","AKs","77","AQs","AKo","AJs","ATs","AQo","AJo","KQs","66","ATo","A9s","KJs","KTs","A8s","KQo","A9o","55","QJs","A7s","KJo","A6s","A5s","KTo","A8o","K9s","QTs","K8s","A7o","A4s","A3s","QJo","K7s","Q9s","K9o","A6o","A5o","A2s","JTs","44","QTo","K6s","A4o","Q8s","K5s","A3o","J9s","Q9o","K8o","K7o","JTo","K4s","A2o","T9s","Q7s","K6o","33","Q6s","K3s","Q8o","J8s","K5o","Q5s","J9o","K2s","K4o","J7s","T8s","Q7o","T9o","Q3s","Q4s","J8o","K3o","Q6o","K2o","22","T7s","98s","J6s","Q5o","Q2s","J5s","J7o","T8o","97s","Q4o","J4s","Q3o","T6s","98o","87s","J3s","J2s","J6o","T7o","T5s","J5o","96s","Q2o","86s","J4o","T4s","97o","95s","T3s","T6o","76s","87o","J3o","T2s","T5o","J2o","94s","96o","85s","86o","75s","T4o","93s","65s","84s","76o","95o","T3o","92s","T2o","54s","74s","64s","85o","83s","75o","93o","94o","73s","65o","82s","63s","53s","84o","92o","43s","64o","54o","74o","72s","83o","52s","62s","82o","42s","53o","73o","32s","63o","43o","72o","52o","62o","42o","32o"];
const SV_SIZES = [25, 33, 50, 75, 100, 150, 200];
const SV_QUICK = [
  { id: "srp_btn_bb", n: "SRP · BTN vs BB", d: "BTN apre, il BB chiama", oop: "bb_btn|1", ip: "rfi_btn|1", pot: 20, stack: 87.5 },
  { id: "srp_co_bb", n: "SRP · CO vs BB", d: "CO apre, il BB chiama", oop: "bb_co|1", ip: "rfi_co|1", pot: 18, stack: 88 },
  { id: "bvb", n: "BvB · SB vs BB", d: "SB apre, il BB chiama (BB in posizione)", oop: "rfi_sb|1", ip: "bb_sb|1", pot: 24, stack: 85 },
  { id: "3bp_btn_co", n: "3-bet pot · BTN vs CO", d: "Il BTN 3-betta, il CO chiama", oop: "co_vs_btn3|1", ip: "btn_co|1", pot: 45, stack: 70 },
  { id: "3bp_sb_btn", n: "3-bet pot · SB vs BTN", d: "La SB 3-betta, il BTN chiama", oop: "sb_btn|1", ip: "btn_vs_sb3|1", pot: 50, stack: 68 },
  { id: "3bp_bvb", n: "3-bet pot · SB vs BB", d: "Il BB 3-betta, la SB chiama (SB fuori posizione)", oop: "sb_vs_bb3|1", ip: "bb_sb|2", pot: 50, stack: 66 },
  { id: "4bp_btn_bb", n: "4-bet pot · BTN vs BB", d: "Il BTN 4-betta, il BB chiama (SPR basso)", oop: "raw:QQ:0.5,JJ,TT:0.7,99:0.3,AKs:0.5,AKo:0.6,AQs,AJs:0.5,KQs:0.6,AQo:0.3,A5s:0.2", ip: "btn_vs_bb3|2", pot: 110, stack: 45 },
];
function svDefaultForm() { const q = SV_QUICK[0]; return { board: "Ks7d2c4h3s", pot: q.pot, stack: q.stack, oop: svPresetStr(q.oop), ip: svPresetStr(q.ip), oopS: [33, 75, 150], ipS: [33, 75, 150], rzS: [75], allin: true, maxR: 1, hero: 1, iters: 600, lock: "none", quick: q.id, edit: 0, brush: 100 }; }
/* ---------- selettore del board ---------- */
const SV_SUIT = [["s", "♠", "var(--sv-spade)"], ["h", "♥", "var(--sv-heart)"], ["d", "♦", "var(--sv-diam)"], ["c", "♣", "var(--sv-club)"]];
function svBoardHTML(c) {
  const sel = (c.board.match(/../g) || []);
  const slots = [0, 1, 2, 3, 4].map(i => sel[i] ? `<button class="bslot on" data-bs="${sel[i]}" title="Togli">${card(sel[i])}</button>` : `<span class="bslot">${["Flop", "Flop", "Flop", "Turn", "River"][i]}</span>`).join("");
  const grid = SV_SUIT.map(([s, sym, col]) => `<div class="brow">${"AKQJT98765432".split("").map(r => { const k = r + s, on = sel.includes(k); return `<button class="bcard ${on ? "on" : ""}" data-bc="${k}" style="--sc:${col}" ${!on && sel.length >= 5 ? "disabled" : ""}>${rname(r)}<small>${sym}</small></button>`; }).join("")}</div>`).join("");
  return `<div class="bslots">${slots}</div><div class="bpick">${grid}</div><div class="svrow"><button class="btn" data-bact="rnd">Board casuale</button><button class="btn ghost" data-bact="clr">Pulisci</button><span class="muted" style="font-size:13px">Tocca le carte: le prime 3 sono il flop, poi turn e river.</span></div>`;
}
/* ---------- editor del range (stile Equilab / Flopzilla) ---------- */
const reType = k => k.length === 2 ? "p" : k[2] === "s" ? "s" : "o";
const reCombos = w => Object.entries(w).reduce((a, [k, v]) => a + v * (k.length === 2 ? 6 : k[2] === "s" ? 4 : 12), 0);
/* frequenza sotto ogni mano (modalità «Frequenze»): 100, 49,95, 0 */
const reFq = v => { const x = Math.round(v * 10000) / 100; return x >= 100 ? "100" : x <= 0 ? "0" : String(x).replace(".", ","); };
const reCellTxt = (k, v, extra) => S.reFreq ? `<b>${k}</b><small class="rf">${reFq(v)}</small>` : k + (extra != null ? `<small>${extra}</small>` : v > 0 && v < 0.995 ? `<small>${Math.round(v * 100)}</small>` : "");
function reGridHTML(w) {
  let h = "";
  for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) {
    const k = handAt(i, j), v = w[k] || 0, t = reType(k);
    h += `<div class="rc ${t} ${v > 0 ? "on" : ""}" data-rk="${k}" style="--w:${Math.round(v * 100)}%">${reCellTxt(k, v)}</div>`;
  }
  return h;
}
/* ---------- le mie tabelle: range personalizzati salvati ---------- */
function myRanges() { return S.myRanges || (S.myRanges = []); }
function myRangeGet(id) { return myRanges().find(r => r.id === id) || null; }
function myRangeOpts() { const L = myRanges(); return L.length ? `<optgroup label="Le mie tabelle">${L.map(r => `<option value="my:${r.id}">${esc(r.name)}</option>`).join("")}</optgroup>` : ""; }
function myRangeSave(name, range, id) {
  const L = myRanges(), nm = String(name || "").trim().slice(0, 60) || "Tabella " + (L.length + 1);
  let r = id ? myRangeGet(id) : null;
  if (r) { r.name = nm; r.range = range; r.upd = Date.now(); }
  else { r = { id: "t" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), name: nm, range, upd: Date.now() }; L.push(r); }
  persistSoon(); return r.id;
}
function myRangeDel(id) { S.myRanges = myRanges().filter(r => r.id !== id); persistSoon(); }
/* ---------- semi precisi di una mano (solo nel calcolatore di equity) ----------
   Ogni cella del range può tenere solo alcune combinazioni: AKs solo cuori e picche, AKo senza fiori, ecc.
   Si sceglie da una griglia 4x4 di semi: righe = seme della prima carta, colonne = seme della seconda. */
const RE_SU = ["s", "h", "d", "c"], RE_SY = { s: "♠", h: "♥", d: "♦", c: "♣" }, RE_SN = { s: "picche", h: "cuori", d: "quadri", c: "fiori" };
const reHandCombos = k => { const a = k[0], b = k[1], out = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = RE_SU[i], y = RE_SU[j]; if (k.length === 2 ? i < j : k[2] === "s" ? i === j : i !== j) out.push(a + x + b + y); } return out; };
const reComboClass = cb => { const R = "AKQJT98765432", r1 = cb[0], s1 = cb[1], r2 = cb[2], s2 = cb[3]; if (r1 === r2) return r1 + r2; const hi = R.indexOf(r1) < R.indexOf(r2); return (hi ? r1 + r2 : r2 + r1) + (s1 === s2 ? "s" : "o"); };
const reNormCombo = cb => { const R = "AKQJT98765432", A = cb.slice(0, 2), B = cb.slice(2, 4); if (A[0] === B[0]) return RE_SU.indexOf(A[1]) < RE_SU.indexOf(B[1]) ? A + B : B + A; return R.indexOf(A[0]) < R.indexOf(B[0]) ? A + B : B + A; };
/* dal testo: le combinazioni precise (AhKh) raggruppate per mano */
/* combinazioni precise con il loro peso: cx[mano] = Map(combo -> peso), nel testo "AhKh:0.5" */
function reParseCombos(txt) { const cx = {}; String(txt || "").split(/[,\s]+/).forEach(t => { const m = t.match(/^([2-9TJQKA])([shdc])([2-9TJQKA])([shdc])(?::([\d.]+))?$/i); if (!m) return; const cb = reNormCombo(m[1].toUpperCase() + m[2].toLowerCase() + m[3].toUpperCase() + m[4].toLowerCase()); if (cb[0] === cb[2] && cb[1] === cb[3]) return; const wt = m[5] != null ? Math.max(0.01, Math.min(1, parseFloat(m[5]) || 1)) : 1; const k = reComboClass(cb); (cx[k] = cx[k] || new Map()).set(cb, wt); }); return cx; }
const reCombosStr = cx => Object.values(cx).flatMap(M => [...M].map(([cb, wt]) => cb + (wt < 0.995 ? ":" + Math.round(wt * 100) / 100 : ""))).join(",");
const reCxCount = cx => Object.values(cx).reduce((a, M) => a + [...M.values()].reduce((x, y) => x + y, 0), 0);
const reCxW = M => { const v = [...M.values()]; return v.every(x => Math.abs(x - v[0]) < 0.001) ? v[0] : null; };
function svRangeEditor(el, c, which, onSaved, opts) {
  const key = which === 0 ? "oop" : "ip", SU = !!(opts && opts.suits);
  let w = svParseRange(c[key]);
  const cx = SU ? (c.cx || (c.cx = {})) : {};
  /* se una mano è sia nel range per intero sia con combinazioni precise, valgono entrambe (come nel calcolo): le unisco */
  Object.keys(cx).forEach(k => { if (!cx[k] || !cx[k].size) { delete cx[k]; return; } if ((w[k] || 0) > 0) { const M = new Map(reHandCombos(k).map(cb => [reNormCombo(cb), w[k]])); cx[k].forEach((v, cb) => M.set(cb, v)); const vals = [...M.values()]; if (vals.every(x => Math.abs(x - vals[0]) < 0.001)) { w[k] = vals[0]; delete cx[k]; return; } cx[k] = M; } delete w[k]; });
  let smode = false, selHook = null;
  const cxCell = k => { const M = cx[k], cell = el.querySelector(`.regrid [data-rk="${k}"]`); if (!M || !cell) return; const n = reHandCombos(k).length, sw = [...M.values()].reduce((a, b) => a + b, 0), uw = reCxW(M); cell.classList.add("on", "cx"); cell.style.setProperty("--w", Math.round(sw / n * 100) + "%"); const sx = k[2] === "s" ? RE_SU.filter(x => M.has(k[0] + x + k[1] + x)).map(x => `<i class="rs-${x}">${RE_SY[x]}</i>`).join("") : `${M.size}/${n}`;
    cell.title = `${k}: ${M.size} ${M.size === 1 ? "combinazione" : "combinazioni"} su ${n}${uw != null && uw < 0.995 ? ", peso " + Math.round(uw * 100) + "%" : ""}`;
    cell.innerHTML = S.reFreq ? reCellTxt(k, sw / n) : `<b>${k}</b><small class="cxs">${sx}</small>`; };
  const draw = () => {
    const n = reCombos(w) + reCxCount(cx);
    el.querySelector(".regrid").innerHTML = reGridHTML(w); el.querySelector(".regrid").classList.toggle("freq", !!S.reFreq);
    if (selHook) setTimeout(() => { try { selHook(); } catch (e) {} }, 0);
    Object.keys(cx).forEach(cxCell);
    el.querySelector(".restat").innerHTML = `<b>${fmtN(Math.round(n))}</b> combo · <b>${fmtN(Math.round(n / 1326 * 1000) / 10)}%</b> delle mani`;
    el.querySelector(".retxt").value = [svRangeStr(w), reCombosStr(cx)].filter(Boolean).join(",");
    c[key] = svRangeStr(w);
    const tab = document.querySelector(`[data-retab="${which}"] .rcount`); if (tab) tab.textContent = `${fmtN(Math.round(n / 1326 * 1000) / 10)}%`;
  };
  const cur = c.myId && c.myId[key] ? myRangeGet(c.myId[key]) : null;
  el.innerHTML = `<div class="retools"><label class="of">Carica una tabella<select class="repre"><option value="">Scegli...</option>${myRangeOpts()}${svPresetOpts()}</select></label>
   <label class="of">Top % delle mani <span class="muted retopv">-</span><input type="range" class="retop" min="0" max="100" step="1" value="0"></label>
   <label class="of">Peso del pennello <span class="muted rebrv">${c.brush}%</span><input type="range" class="rebr" min="5" max="100" step="5" value="${c.brush}"></label></div>
   <div class="rebtns"><button class="btn" data-q="pairs">Coppie</button><button class="btn" data-q="suited">Suited</button><button class="btn" data-q="offsuit">Offsuit</button><button class="btn" data-q="broad">Broadway</button><button class="btn" data-q="axs">Ax suited</button><button class="btn" data-q="all">Tutte</button><button class="btn ghost" data-q="none">Cancella</button></div>
   ${SU ? `<div class="re-mode"><button type="button" class="on" data-rem="brush">✏️ Pennello</button><button type="button" data-rem="suit">♠♥ Scegli i semi</button><span class="muted">Con «Scegli i semi» selezioni una o più mani (tocca o trascina) e scegli i semi una volta sola per tutte. Tasto destro su una cella: solo quella mano.</span></div>` : ""}
   <div class="regridw"><div class="regrid" role="grid" aria-label="Range: tocca o trascina per selezionare"></div>${SU ? `<div class="resuit" hidden></div>` : ""}</div>${SU ? `<div class="resbar" hidden></div>` : ""}
   <div class="refoot"><span class="restat"></span><button type="button" class="re-fq ${S.reFreq ? "on" : ""}" data-refq aria-pressed="${!!S.reFreq}" title="Mostra sotto ogni mano la frequenza con cui giocarla">% Frequenze</button><span class="relegend"><i class="p"></i>coppie <i class="s"></i>suited <i class="o"></i>offsuit</span></div>
   <details class="retxtd"><summary>Range in formato testo (copia e incolla)</summary><input type="text" class="retxt mono" spellcheck="false"><p class="muted" style="font-size:12px;margin:4px 0 0">Formato: AA,KK,AKs,ATs+,76s-54s,AJo:0.5 (dopo i due punti il peso).</p></details>
   <div class="remy"><span class="remy-l">💾 Le mie tabelle</span><input type="text" class="remyn" maxlength="60" placeholder="Nome, es. BTN open vs reg" value="${cur ? esc(cur.name) : ""}"><button class="btn small" data-mys="new">Salva come nuova</button>${cur ? `<button class="btn small ghost" data-mys="upd">Aggiorna "${esc(cur.name)}"</button>` : ""}<span class="muted remym"></span></div>`;
  draw();
  el.querySelectorAll("[data-mys]").forEach(b => b.onclick = () => {
    const nm = el.querySelector(".remyn").value, str = svRangeStr(w), m = el.querySelector(".remym");
    if (!str) { m.textContent = "La tabella è vuota: seleziona qualche mano."; return; }
    const id = myRangeSave(nm, str, b.dataset.mys === "upd" && cur ? cur.id : null);
    c.myId = { ...(c.myId || {}), [key]: id };
    if (onSaved) onSaved(id); else { svRangeEditor(el, c, which, onSaved); const m2 = el.querySelector(".remym"); if (m2) m2.textContent = "Salvata ✔"; }
  });
  const grid = el.querySelector(".regrid");
  let mode = null;
  const apply = k => { if (!k) return;
    /* mano con semi scelti: il pennello cambia solo il peso di quelle combinazioni, la gomma la toglie */
    if (cx[k]) { if (mode === "erase") { delete cx[k]; delete w[k]; const cell = grid.querySelector(`[data-rk="${k}"]`); if (cell) { cell.classList.remove("on", "cx"); cell.style.setProperty("--w", "0%"); cell.innerHTML = k; } } else { cx[k].forEach((v, cb) => cx[k].set(cb, c.brush / 100)); cxCell(k); } return; }
    if (mode === "erase") delete w[k]; else w[k] = c.brush / 100; const cell = grid.querySelector(`[data-rk="${k}"]`); if (cell) { const v = w[k] || 0; cell.classList.toggle("on", v > 0); cell.style.setProperty("--w", Math.round(v * 100) + "%"); cell.innerHTML = reCellTxt(k, v); } };
  const cellAt = e => { const t = document.elementFromPoint(e.clientX, e.clientY); const x = t && t.closest && t.closest("[data-rk]"); return x && grid.contains(x) ? x.dataset.rk : null; };
  /* semi su più mani insieme: in modalità «Scegli i semi» tocchi o trascini per selezionare le mani,
     poi scegli i semi una volta sola (suited, offsuit e coppie separati) e li applichi a tutte. */
  const ssel = new Set();
  const typ = k => k.length === 2 ? "p" : k[2] === "s" ? "s" : "o";
  const pat = cb => cb[1] + cb[3];
  const selPaint = () => {
    grid.querySelectorAll(".rc.ssel").forEach(x => x.classList.remove("ssel"));
    ssel.forEach(k => { const x = grid.querySelector(`[data-rk="${k}"]`); if (x) x.classList.add("ssel"); });
    const bar = el.querySelector(".resbar"); if (!bar) return;
    const n = ssel.size, cnt = { s: 0, o: 0, p: 0 }; ssel.forEach(k => cnt[typ(k)]++);
    bar.hidden = !smode;
    bar.innerHTML = `<span class="rsb-n">${n ? `<b>${n}</b> ${n === 1 ? "mano selezionata" : "mani selezionate"}${n ? ` <small>(${[cnt.s ? cnt.s + " suited" : "", cnt.o ? cnt.o + " offsuit" : "", cnt.p ? cnt.p + " coppie" : ""].filter(Boolean).join(", ")})</small>` : ""}` : "Tocca o trascina sulle mani da modificare"}</span>
      <span class="rsb-q"><button type="button" class="btn small ghost" data-ssq="range">Tutto il range</button><button type="button" class="btn small ghost" data-ssq="s">Suited</button><button type="button" class="btn small ghost" data-ssq="o">Offsuit</button><button type="button" class="btn small ghost" data-ssq="p">Coppie</button>${n ? `<button type="button" class="btn small ghost" data-ssq="none">Deseleziona</button>` : ""}</span>
      <button type="button" class="btn primary small rsb-go" data-ssgo ${n ? "" : "disabled"}>♠♥ Scegli i semi${n ? " per " + n : ""}</button>`;
    bar.querySelectorAll("[data-ssq]").forEach(b => b.onclick = () => {
      const q = b.dataset.ssq, all = []; for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) all.push(handAt(i, j));
      const inR = k => (w[k] || 0) > 0 || !!cx[k];
      if (q === "none") ssel.clear(); else if (q === "range") all.filter(inR).forEach(k => ssel.add(k)); else { const L = all.filter(k => typ(k) === q && inR(k)); const pickL = L.length ? L : all.filter(k => typ(k) === q); const full = pickL.every(k => ssel.has(k)); pickL.forEach(k => full ? ssel.delete(k) : ssel.add(k)); }
      selPaint();
    });
    const go = bar.querySelector("[data-ssgo]"); if (go) go.onclick = () => suitPanel([...ssel]);
  };
  selHook = selPaint;
  const suitPanel = keys => {
    const P = el.querySelector(".resuit"); if (!P || !keys.length) return;
    const has = { s: keys.some(k => typ(k) === "s"), o: keys.some(k => typ(k) === "o"), p: keys.some(k => typ(k) === "p") };
    /* stato di partenza: i semi già tenuti dalle mani selezionate (se nessuna è nel range, tutti) */
    const st = { s: new Set(), o: new Set(), p: new Set() };
    ["s", "o", "p"].forEach(t => {
      const K = keys.filter(k => typ(k) === t), inR = K.filter(k => (w[k] || 0) > 0 || cx[k]);
      (inR.length ? inR : K).forEach(k => (cx[k] ? [...cx[k].keys()] : reHandCombos(k)).forEach(cb => st[t].add(pat(cb))));
    });
    const allPat = t => { const out = []; RE_SU.forEach((x, i) => RE_SU.forEach((y, j) => { if (t === "s" ? i === j : t === "o" ? i !== j : i < j) out.push(x + y); })); return out; };
    const one = keys.length === 1 ? keys[0] : null, R1 = one ? one[0] : "", R2 = one ? one[1] : "";
    const ws = keys.map(k => cx[k] ? reCxW(cx[k]) : (w[k] || 0) > 0 ? w[k] : null).filter(x => x != null);
    let pw = ws.length && ws.every(x => Math.abs(x - ws[0]) < 0.001) ? ws[0] : c.brush / 100;
    const mx = t => `<div class="rs-sec"><div class="rs-st">${t === "s" ? "Suited" : t === "o" ? "Offsuit" : "Coppie"} <small>${st[t].size}/${allPat(t).length}</small><span><button type="button" data-rsa="${t}:all">Tutte</button><button type="button" data-rsa="${t}:none">Nessuna</button></span></div>
      ${t === "s" ? `<div class="rs-row4">${RE_SU.map(x => `<button type="button" class="rs-c ${st.s.has(x + x) ? "on" : ""}" data-rsp="s:${x + x}" aria-label="Suited a ${RE_SN[x]}"><i class="tc su-${x}">${R1}<i>${RE_SY[x]}</i></i><i class="tc su-${x}">${R2}<i>${RE_SY[x]}</i></i></button>`).join("")}</div>`
      : `<div class="rs-grid"><span></span>${RE_SU.map(y => `<span class="rs-h su-${y}">${t === "p" ? "" : "2ª "}${RE_SY[y]}</span>`).join("")}${RE_SU.map((x, i) => `<span class="rs-h su-${x}">${t === "p" ? "" : "1ª "}${RE_SY[x]}</span>${RE_SU.map((y, j) => (t === "o" ? i !== j : i < j) ? `<button type="button" class="rs-c ${st[t].has(x + y) ? "on" : ""}" data-rsp="${t}:${x + y}" aria-label="${RE_SN[x]} e ${RE_SN[y]}"><i class="tc su-${x}">${R1}<i>${RE_SY[x]}</i></i><i class="tc su-${y}">${R2}<i>${RE_SY[y]}</i></i></button>` : `<span class="rs-no"></span>`).join("")}`).join("")}</div>`}</div>`;
    const paint = () => {
      const n = keys.length;
      P.innerHTML = `<div class="rs-box"><div class="rs-head"><b>${n === 1 ? keys[0] : n + " mani"}</b><span>${n === 1 ? "scegli quali combinazioni tenere" : "i semi scelti valgono per tutte le mani selezionate"}</span><button type="button" class="rs-x" data-rsx aria-label="Chiudi">×</button></div>
        <div class="rs-quick"><span>Con</span>${RE_SU.map(x => `<button type="button" class="btn small ghost rs-suitq su-t-${x}" data-rsq="con:${x}" title="Tieni solo le combinazioni con almeno una carta di ${RE_SN[x]}">${RE_SY[x]}</button>`).join("")}<span>Senza</span>${RE_SU.map(x => `<button type="button" class="btn small ghost rs-suitq su-t-${x}" data-rsq="senza:${x}" title="Togli le combinazioni con carte di ${RE_SN[x]}">${RE_SY[x]}</button>`).join("")}<button type="button" class="btn small ghost" data-rsq="all">Tutti</button></div>
        <div class="rs-secs">${has.s ? mx("s") : ""}${has.o ? mx("o") : ""}${has.p ? mx("p") : ""}</div>
        <label class="rs-w">Peso delle combinazioni scelte <b>${Math.round(pw * 100)}%</b><input type="range" min="5" max="100" step="5" value="${Math.round(pw * 100)}" data-rsw></label>
        <div class="rs-acts"><button type="button" class="btn primary rs-ok" data-rsok>Applica${n > 1 ? " a " + n + " mani" : ""}</button><button type="button" class="btn ghost" data-rsdel>Togli dal range</button></div></div>`;
      P.querySelectorAll("[data-rsp]").forEach(b => b.onclick = () => { const [t, pp] = b.dataset.rsp.split(":"); st[t].has(pp) ? st[t].delete(pp) : st[t].add(pp); paint(); });
      P.querySelectorAll("[data-rsa]").forEach(b => b.onclick = () => { const [t, q] = b.dataset.rsa.split(":"); st[t].clear(); if (q === "all") allPat(t).forEach(x => st[t].add(x)); paint(); });
      P.querySelectorAll("[data-rsq]").forEach(b => b.onclick = () => {
        const [q, x] = b.dataset.rsq.split(":");
        ["s", "o", "p"].forEach(t => { if (q === "all") { st[t] = new Set(allPat(t)); return; } const base = q === "con" ? allPat(t) : [...st[t]]; st[t] = new Set(base.filter(pp => q === "con" ? pp.includes(x) : !pp.includes(x))); });
        paint();
      });
      P.querySelector("[data-rsx]").onclick = () => { P.hidden = true; };
      const wI = P.querySelector("[data-rsw]"); wI.oninput = () => { pw = +wI.value / 100; wI.previousElementSibling.textContent = wI.value + "%"; };
      P.querySelector("[data-rsok]").onclick = () => {
        keys.forEach(k => { const t = typ(k), all = reHandCombos(k), keep = all.filter(cb => st[t].has(pat(cb))); delete w[k]; delete cx[k]; if (keep.length === all.length) w[k] = pw; else if (keep.length) cx[k] = new Map(keep.map(cb => [reNormCombo(cb), pw])); });
        P.hidden = true; ssel.clear(); draw(); selPaint();
      };
      P.querySelector("[data-rsdel]").onclick = () => { keys.forEach(k => { delete w[k]; delete cx[k]; }); P.hidden = true; ssel.clear(); draw(); selPaint(); };
    };
    P.hidden = false; paint();
  };
  let sdrag = null;
  if (SU) {
    el.querySelectorAll("[data-rem]").forEach(b => b.onclick = () => { smode = b.dataset.rem === "suit"; el.querySelectorAll("[data-rem]").forEach(x => x.classList.toggle("on", x === b)); grid.classList.toggle("smode", smode); if (!smode) ssel.clear(); selPaint(); });
    grid.addEventListener("contextmenu", e => { const k = cellAt(e); if (!k) return; e.preventDefault(); mode = null; suitPanel([k]); });
  }
  grid.addEventListener("pointerdown", e => { const k = cellAt(e); if (!k) return; if (SU && (smode || e.button === 2)) { e.preventDefault(); if (smode) { sdrag = ssel.has(k) ? "off" : "on"; sdrag === "on" ? ssel.add(k) : ssel.delete(k); selPaint(); grid.setPointerCapture(e.pointerId); } return; } e.preventDefault(); { const cur = cx[k] ? reCxW(cx[k]) : (w[k] || 0); mode = cur != null && Math.abs(cur - c.brush / 100) < 0.001 ? "erase" : "paint"; } apply(k); grid.setPointerCapture(e.pointerId); });
  grid.addEventListener("pointermove", e => { if (sdrag) { const k = cellAt(e); if (k) { sdrag === "on" ? ssel.add(k) : ssel.delete(k); const x = grid.querySelector(`[data-rk="${k}"]`); if (x) x.classList.toggle("ssel", sdrag === "on"); } return; } if (!mode) return; apply(cellAt(e)); });
  const end = () => { if (sdrag) { sdrag = null; selPaint(); } if (mode) { mode = null; draw(); } };
  grid.addEventListener("pointerup", end); grid.addEventListener("pointercancel", end);
  const fqNote = () => { let n = el.querySelector(".refqnote"); if (!n) { n = document.createElement("p"); n.className = "refqnote"; el.querySelector(".refoot").insertAdjacentElement("afterend", n); } n.hidden = !S.reFreq; n.innerHTML = `Il numero sotto ogni mano è la sua <b>frequenza</b> nel range, in percentuale: 100 = sempre, 49,95 = circa metà delle volte, 0 = mai.`; };
  fqNote();
  el.querySelector("[data-refq]").onclick = e => { S.reFreq = !S.reFreq; persistSoon(); e.currentTarget.classList.toggle("on", !!S.reFreq); e.currentTarget.setAttribute("aria-pressed", !!S.reFreq); draw(); fqNote(); };
  el.querySelector(".rebr").oninput = e => { c.brush = +e.target.value; el.querySelector(".rebrv").textContent = c.brush + "%"; };
  el.querySelector(".retop").oninput = e => { const p = +e.target.value; el.querySelector(".retopv").textContent = p + "%"; w = {}; Object.keys(cx).forEach(k => delete cx[k]); let acc = 0; for (const k of RANK169) { if (acc >= p / 100 * 1326 - 0.1) break; w[k] = 1; acc += k.length === 2 ? 6 : k[2] === "s" ? 4 : 12; } draw(); };
  el.querySelector(".repre").onchange = e => { const v = e.target.value; if (!v) return; Object.keys(cx).forEach(k => delete cx[k]); if (v.startsWith("my:")) { const r = myRangeGet(v.slice(3)); if (!r) return; w = svParseRange(r.range); c.myId = { ...(c.myId || {}), [key]: r.id }; draw(); svRangeEditor(el, c, which, onSaved); return; } w = svParseRange(svPresetStr(v)); if (c.myId) delete c.myId[key]; draw(); };
  el.querySelector(".retxt").onchange = e => { w = svParseRange(e.target.value); if (SU) { Object.keys(cx).forEach(k => delete cx[k]); Object.assign(cx, reParseCombos(e.target.value)); Object.keys(cx).forEach(k => delete w[k]); } draw(); };
  el.querySelectorAll("[data-q]").forEach(b => b.onclick = () => {
    const q = b.dataset.q, R = "AKQJT98765432";
    const all = []; for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) all.push(handAt(i, j));
    const pick = q === "pairs" ? all.filter(k => k.length === 2) : q === "suited" ? all.filter(k => k[2] === "s") : q === "offsuit" ? all.filter(k => k[2] === "o") : q === "broad" ? all.filter(k => R.indexOf(k[0]) <= 4 && R.indexOf(k[1]) <= 4) : q === "axs" ? all.filter(k => k[0] === "A" && k[2] === "s") : q === "all" ? all : [];
    if (q === "none") { w = {}; Object.keys(cx).forEach(k => delete cx[k]); } else { const full = pick.every(k => (w[k] || 0) > 0); pick.forEach(k => { delete cx[k]; if (full) delete w[k]; else w[k] = c.brush / 100; }); }
    draw();
  });
}
