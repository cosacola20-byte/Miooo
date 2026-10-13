/* ================= VARIANZA: simulatore Monte Carlo (stile Primedope) ================= */
let VC = null;
function vcRng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function vcNormGen(r) { let spare = null; return () => { if (spare != null) { const s = spare; spare = null; return s; } let u = 0, v = 0; while (u === 0) u = r(); v = r(); const m = Math.sqrt(-2 * Math.log(u)); spare = m * Math.sin(2 * Math.PI * v); return m * Math.cos(2 * Math.PI * v); }; }
function vcRun(p, seed, keep) {
  const g = vcNormGen(vcRng(seed * 7919 + 17)), path = keep ? new Float32Array(p.steps + 1) : null;
  let x = 0, peak = 0, dd = 0, since = 0, longest = 0;
  for (let i = 1; i <= p.steps; i++) {
    x += p.mu + p.sig * g();
    if (x >= peak) { peak = x; since = 0; } else { since++; if (since > longest) longest = since; }
    if (peak - x > dd) dd = peak - x;
    if (path) path[i] = x;
  }
  return { final: x, dd, longest: longest * p.stepH, path };
}
function vcSimulate(inp) {
  const N = Math.max(1000, Math.round(inp.h)), steps = Math.min(2000, Math.ceil(N / 100)), stepH = N / steps;
  const p = { N, steps, stepH, mu: inp.wr * stepH / 100, sig: inp.sd * Math.sqrt(stepH / 100) };
  const R = 1000, fin = new Float64Array(R), dds = new Float64Array(R), lng = new Float64Array(R);
  for (let k = 0; k < R; k++) { const r = vcRun(p, k + 1, false); fin[k] = r.final; dds[k] = r.dd; lng[k] = r.longest; }
  const ord = Array.from(fin.keys()).sort((a, b) => fin[a] - fin[b]);
  const best = ord[R - 1], worst = ord[0], med = ord[Math.floor(R / 2)];
  const samples = Array.from({ length: 20 }, (_, k) => vcRun(p, k * 50 + 1, true).path);
  return { p, fin, dds, lng, R, samples, bestPath: vcRun(p, best + 1, true).path, worstPath: vcRun(p, worst + 1, true).path, medPath: vcRun(p, med + 1, true).path, best: fin[best], worst: fin[worst] };
}
const vcPhi = x => msNorm(x);
function vcStats(inp, S) {
  const N = S.p.N, ev = inp.wr * N / 100, sN = inp.sd * Math.sqrt(N / 100);
  const o = { ev, sN, ci70: [ev - 1.0364 * sN, ev + 1.0364 * sN], ci95: [ev - 1.96 * sN, ev + 1.96 * sN], ploss: vcPhi(-ev / sN), best: S.best, worst: S.worst };
  if (inp.owr !== "" && inp.owr != null && !Number.isNaN(+inp.owr)) o.pobs = vcPhi(((+inp.owr) - inp.wr) * N / 100 / sN);
  if (inp.wr > 0) { o.br5 = -Math.log(0.05) * inp.sd * inp.sd / (2 * inp.wr); o.br1 = -Math.log(0.01) * inp.sd * inp.sd / (2 * inp.wr); }
  if (inp.br > 0) o.ror = inp.wr > 0 ? Math.exp(-2 * inp.wr * inp.br / (inp.sd * inp.sd)) : 1;
  const dd = [100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000, 15000, 20000];
  o.down = dd.map(x => [x, S.dds.reduce((a, v) => a + (v >= x ? 1 : 0), 0) / S.R]).filter(([, pr]) => pr >= 0.005 && pr <= 0.999);
  const st = [5000, 10000, 20000, 30000, 50000, 75000, 100000, 150000, 200000, 300000, 500000].filter(x => x < N);
  o.stretch = st.map(x => [x, S.lng.reduce((a, v) => a + (v >= x ? 1 : 0), 0) / S.R]).filter(([, pr]) => pr >= 0.005);
  o.ddMed = [...S.dds].sort((a, b) => a - b)[Math.floor(S.R / 2)];
  return o;
}
function vcUnit() { const lv = MS.bank && MS_LEVELS[MS.bank.level] ? MS.bank.level : "NL25"; return { lv, bbUsd: MS_LEVELS[lv].bi / 100 }; }
function vcFmt(bbv, unit) { const u = vcUnit(); if (unit === "bi") return `${fmtN(Math.round(bbv / 10) / 10)} BI`; if (unit === "usd") return `${bbv < 0 ? "-" : ""}$${Math.round(Math.abs(bbv) * u.bbUsd).toLocaleString("it-IT")}`; return `${Math.round(bbv).toLocaleString("it-IT")} bb`; }
function msVar() {
  if (!VC) {
    const hp = {}; try { (location.hash || "").replace(/^#/, "").split("&").forEach(kv => { const [k, v] = kv.split("="); if (k) hp[k] = decodeURIComponent(v || ""); }); } catch (e) {}
    const K = MS.bank || {};
    VC = { inp: { wr: +(hp.wr ?? (K.wr !== "" && K.wr != null ? K.wr : 5)), owr: hp.owr ?? "", sd: +(hp.sd ?? (K.sd || 100)), h: +(hp.h ?? 100000), br: hp.br ? +hp.br : (K.br && MS_LEVELS[K.level] ? Math.round(+K.br / MS_LEVELS[K.level].bi * 100) : "") }, unit: "bb", view: "samples", zoom: [0, 100] };
  }
  const I = VC.inp, u = vcUnit();
  let h = `<section class="panel"><div class="eyebrow">Simulatore di varianza · cash game</div><p style="margin:4px 0 10px;font-size:14px;color:var(--ink2)">1.000 simulazioni Monte Carlo a passi di 100 mani con risultati distribuiti normalmente. Bande di confidenza al 70% e al 95%, 20 run di esempio, downswing e periodi sotto il massimo.</p>
  <div class="ogrid"><label class="of">Winrate (bb/100)<input type="number" step="0.1" id="vcWR" value="${I.wr}"></label><label class="of">Winrate osservato (facoltativo)<input type="number" step="0.1" id="vcOWR" value="${esc(I.owr)}" placeholder="es. -2"></label><label class="of">Deviazione standard (bb/100)<input type="number" step="1" id="vcSD" value="${I.sd}"><small class="muted" style="font-weight:400">NLH 6-max 75-120</small></label><label class="of">Mani<input type="number" step="1000" id="vcH" value="${I.h}"></label><label class="of">Bankroll (bb, per il risk of ruin)<input type="number" step="100" id="vcBR" value="${esc(I.br)}" placeholder="es. 5000"></label><label class="of">Unità<select id="vcU"><option value="bb" ${VC.unit === "bb" ? "selected" : ""}>bb</option><option value="bi" ${VC.unit === "bi" ? "selected" : ""}>buy-in</option><option value="usd" ${VC.unit === "usd" ? "selected" : ""}>$ a ${u.lv}</option></select></label></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn primary" id="vcGo">Simula</button><span class="muted" id="vcMsg" style="font-size:13px"></span></div></section><div id="vcOut"></div>`;
  $("#msBody").innerHTML = h;
  const read = () => { VC.inp = { wr: +$("#vcWR").value || 0, owr: $("#vcOWR").value.trim(), sd: Math.max(1, +$("#vcSD").value || 100), h: Math.max(1000, Math.min(5000000, +$("#vcH").value || 100000)), br: $("#vcBR").value.trim() === "" ? "" : +$("#vcBR").value }; VC.unit = $("#vcU").value; };
  const go = () => { read(); $("#vcMsg").textContent = "Simulo..."; setTimeout(() => { VC.S = vcSimulate(VC.inp); VC.st = vcStats(VC.inp, VC.S); VC.zoom = [0, 100]; $("#vcMsg").textContent = ""; try { history.replaceState(null, "", `#wr=${VC.inp.wr}&sd=${VC.inp.sd}&h=${VC.inp.h}${VC.inp.owr !== "" ? "&owr=" + VC.inp.owr : ""}${VC.inp.br !== "" ? "&br=" + VC.inp.br : ""}`); } catch (e) {} vcRender(); }, 10); };
  $("#vcGo").onclick = go;
  $("#vcU").onchange = () => { VC.unit = $("#vcU").value; if (VC.S) vcRender(); };
  if (VC.S) vcRender(); else go();
}
function vcRender() {
  const S = VC.S, st = VC.st, I = VC.inp, U = VC.unit, f = x => vcFmt(x, U), N = S.p.N;
  const pct1 = x => x < 0.001 ? "< 0,1%" : x > 0.999 ? "> 99,9%" : `${fmtN(Math.round(x * 1000) / 10)}%`;
  let h = `<section class="panel" style="margin-top:14px"><div class="svtabs"><button class="btn ${VC.view === "samples" ? "primary" : ""}" data-vcv="samples">Run di esempio e bande</button><button class="btn ${VC.view === "median" ? "primary" : ""}" data-vcv="median">Run mediano e drawdown</button></div>
  <div id="vcChart"></div><div class="vczoom"><label>Da <input type="range" id="vcZ0" min="0" max="95" step="5" value="${VC.zoom[0]}"></label><label>A <input type="range" id="vcZ1" min="5" max="100" step="5" value="${VC.zoom[1]}"></label><span class="muted mono" id="vcZl"></span></div></section>`;
  h += `<div class="two" style="margin-top:14px"><section class="panel"><div class="eyebrow">La varianza in numeri</div><div class="otable"><table><tbody>
  <tr><th>Winrate</th><td class="mono">${fmtN(I.wr)} bb/100</td></tr><tr><th>Deviazione standard</th><td class="mono">${fmtN(I.sd)} bb/100</td></tr><tr><th>Mani</th><td class="mono">${N.toLocaleString("it-IT")}</td></tr>
  <tr><th>Risultato atteso (EV)</th><td class="mono">${f(st.ev)}</td></tr><tr><th>Deviazione standard su ${N.toLocaleString("it-IT")} mani</th><td class="mono">${f(st.sN)}</td></tr>
  <tr><th>Intervallo di confidenza 70%</th><td class="mono">${f(st.ci70[0])} / ${f(st.ci70[1])}</td></tr><tr><th>Intervallo di confidenza 95%</th><td class="mono">${f(st.ci95[0])} / ${f(st.ci95[1])}</td></tr>
  <tr><th>Run migliore / peggiore (su 1.000)</th><td class="mono">${f(st.best)} / ${f(st.worst)}</td></tr>
  <tr><th>Probabilità di essere in perdita dopo ${N.toLocaleString("it-IT")} mani</th><td class="mono">${pct1(st.ploss)}</td></tr>
  ${st.pobs != null ? `<tr><th>Probabilità di un winrate ≤ ${fmtN(+I.owr)} bb/100 con un vero ${fmtN(I.wr)}</th><td class="mono">${pct1(st.pobs)}</td></tr>` : ""}
  ${st.br5 != null ? `<tr><th>Bankroll minimo per risk of ruin &lt; 5%</th><td class="mono">${f(st.br5)}</td></tr><tr><th>Bankroll minimo per risk of ruin &lt; 1%</th><td class="mono">${f(st.br1)}</td></tr>` : `<tr><th>Risk of ruin</th><td>100% con winrate ≤ 0</td></tr>`}
  ${st.ror != null ? `<tr><th>Risk of ruin con ${f(I.br)}</th><td class="mono">${pct1(st.ror)}</td></tr>` : ""}
  <tr><th>Drawdown massimo mediano</th><td class="mono">${f(st.ddMed)}</td></tr></tbody></table></div></section>
  <section class="panel"><div class="eyebrow">Downswing in ${N.toLocaleString("it-IT")} mani</div><div class="otable"><table><thead><tr><th>Downswing di almeno</th><th>Probabilità</th></tr></thead><tbody>${st.down.map(([x, p]) => `<tr><td class="mono">${f(x)}</td><td><div class="vcbar"><i style="width:${p * 100}%"></i><span class="mono">${pct1(p)}</span></div></td></tr>`).join("")}</tbody></table></div>
  <div class="eyebrow" style="margin-top:12px">Periodi sotto il massimo precedente</div><div class="otable"><table><thead><tr><th>Senza nuovo massimo per almeno</th><th>Probabilità</th></tr></thead><tbody>${st.stretch.length ? st.stretch.map(([x, p]) => `<tr><td class="mono">${x.toLocaleString("it-IT")} mani</td><td><div class="vcbar"><i style="width:${p * 100}%"></i><span class="mono">${pct1(p)}</span></div></td></tr>`).join("") : `<tr><td colspan="2" class="muted">Nessun periodo lungo con probabilità rilevante.</td></tr>`}</tbody></table></div></section></div>`;
  h += `<p class="note">Modello: risultati per 100 mani distribuiti normalmente con media = winrate e deviazione = deviazione standard, 1.000 run indipendenti. Risk of ruin = e^(−2 × winrate × bankroll / deviazione²). Il winrate vero non lo conosci mai con certezza: con ${N.toLocaleString("it-IT")} mani e deviazione ${I.sd} l'incertezza sul winrate è ±${fmtN(Math.round(1.96 * I.sd / Math.sqrt(N / 100) * 10) / 10)} bb/100 al 95%.</p>`;
  $("#vcOut").innerHTML = h;
  document.querySelectorAll("[data-vcv]").forEach(b => b.onclick = () => { VC.view = b.dataset.vcv; vcRender(); });
  const z = which => () => { let a = +$("#vcZ0").value, b = +$("#vcZ1").value; if (b <= a) { if (which === 0) { b = Math.min(100, a + 5); $("#vcZ1").value = b; } else { a = Math.max(0, b - 5); $("#vcZ0").value = a; } } VC.zoom = [a, b]; vcChart(); };
  $("#vcZ0").oninput = z(0); $("#vcZ1").oninput = z(1);
  vcChart();
}
function vcChart() {
  const S = VC.S, I = VC.inp, U = VC.unit, el = $("#vcChart"); if (!el) return;
  const steps = S.p.steps, i0 = Math.floor(steps * VC.zoom[0] / 100), i1 = Math.max(i0 + 2, Math.ceil(steps * VC.zoom[1] / 100));
  $("#vcZl").textContent = `${Math.round(i0 * S.p.stepH).toLocaleString("it-IT")} - ${Math.round(i1 * S.p.stepH).toLocaleString("it-IT")} mani`;
  const W = Math.max(340, Math.min(900, el.clientWidth || 900)), sm = W < 600, H = VC.view === "median" ? (sm ? 260 : 300) : (sm ? 300 : 360), pl = sm ? 48 : 70, pr = sm ? 8 : 16, pt = 14, pb = 30, H2 = sm ? 90 : 110;
  const band = (i, z) => { const n = i * S.p.stepH; return I.wr * n / 100 + z * I.sd * Math.sqrt(n / 100); };
  const conv = v => U === "bi" ? v / 100 : U === "usd" ? v * vcUnit().bbUsd : v;
  const every = Math.max(1, Math.floor((i1 - i0) / 450));
  const idx = []; for (let i = i0; i <= i1; i += every) idx.push(i); if (idx[idx.length - 1] !== i1) idx.push(i1);
  let lo = Infinity, hi = -Infinity;
  const consider = arr => idx.forEach(i => { const v = arr[i]; if (v < lo) lo = v; if (v > hi) hi = v; });
  if (VC.view === "samples") { S.samples.forEach(consider); consider(S.bestPath); consider(S.worstPath); idx.forEach(i => { lo = Math.min(lo, band(i, -1.96)); hi = Math.max(hi, band(i, 1.96)); }); }
  else consider(S.medPath);
  lo = Math.min(lo, 0); hi = Math.max(hi, 0); const pad = (hi - lo) * 0.05; lo -= pad; hi += pad;
  const x = i => pl + (i - i0) / (i1 - i0) * (W - pl - pr), y = v => pt + (hi - v) / (hi - lo) * (H - pt - pb);
  const line = (arr) => idx.map((i, k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(arr[i]).toFixed(1)}`).join("");
  const area = (za, zb) => idx.map((i, k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(band(i, za)).toFixed(1)}`).join("") + [...idx].reverse().map(i => `L${x(i).toFixed(1)},${y(band(i, zb)).toFixed(1)}`).join("") + "Z";
  const ticks = n => { const span = hi - lo, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), st = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= n) || mag * 10; const out = []; for (let v = Math.ceil(lo / st) * st; v <= hi; v += st) out.push(v); return out; };
  const fmtA = v => { const c = conv(v); return Math.abs(c) >= 10000 ? `${Math.round(c / 1000)}k` : Math.abs(c) >= 1000 ? `${fmtN(Math.round(c / 100) / 10)}k` : fmtN(Math.round(c)); };
  let g = `<svg viewBox="0 0 ${W} ${VC.view === "median" ? H + H2 + 10 : H}" class="vcsvg" role="img" aria-label="Simulazione della varianza">`;
  ticks(6).forEach(v => { g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end" class="vcax">${fmtA(v)}</text>`; });
  g += `<line x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}" stroke="var(--muted)" stroke-width="1"/>`;
  const xt = sm ? 3 : 5; for (let k = 0; k <= xt; k++) { const i = i0 + (i1 - i0) * k / xt; g += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" class="vcax">${Math.round(i * S.p.stepH / 1000)}k</text>`; }
  if (VC.view === "samples") {
    g += `<path d="${area(-1.96, 1.96)}" fill="var(--c-top)" opacity=".10"/><path d="${area(-1.0364, 1.0364)}" fill="var(--c-top)" opacity=".16"/>`;
    S.samples.forEach(p => g += `<path d="${line(p)}" fill="none" stroke="var(--ink2)" stroke-width="1" opacity=".28"/>`);
    g += `<path d="${line(S.worstPath)}" fill="none" stroke="var(--bad)" stroke-width="2"/><path d="${line(S.bestPath)}" fill="none" stroke="var(--good)" stroke-width="2"/>`;
    g += `<path d="${idx.map((i, k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(band(i, 0)).toFixed(1)}`).join("")}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="6 4"/>`;
    const li = idx[idx.length - 1];
    g += `<text x="${x(li) - 4}" y="${y(S.bestPath[li]) - 6}" text-anchor="end" class="vclab">migliore</text><text x="${x(li) - 4}" y="${y(S.worstPath[li]) + 14}" text-anchor="end" class="vclab">peggiore</text><text x="${x(li) - 4}" y="${y(band(li, 0)) - 6}" text-anchor="end" class="vclab">EV</text>`;
  } else {
    const m = S.medPath; let pk = -Infinity; const peak = new Float32Array(m.length); for (let i = 0; i < m.length; i++) { pk = Math.max(pk, m[i]); peak[i] = pk; }
    let pk0 = 0; for (let i = 0; i <= i0; i++) pk0 = Math.max(pk0, m[i]);
    g += `<path d="${idx.map((i, k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(peak[i]).toFixed(1)}`).join("") + [...idx].reverse().map(i => `L${x(i).toFixed(1)},${y(m[i]).toFixed(1)}`).join("")}Z" fill="var(--bad)" opacity=".22"/>`;
    g += `<path d="${line(m)}" fill="none" stroke="var(--c-top)" stroke-width="2"/>`;
    // pannello drawdown sotto (stesso asse x)
    const dmax = Math.max(1, ...idx.map(i => peak[i] - m[i])), y2 = v => H + 10 + (v / dmax) * (H2 - 24);
    g += `<text x="${pl}" y="${H + 6}" class="vcax">Drawdown dal massimo</text><line x1="${pl}" x2="${W - pr}" y1="${y2(0)}" y2="${y2(0)}" stroke="var(--muted)"/>`;
    g += `<path d="${idx.map((i, k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y2(0).toFixed(1)}`).join("") + [...idx].reverse().map(i => `L${x(i).toFixed(1)},${y2(peak[i] - m[i]).toFixed(1)}`).join("")}Z" fill="var(--bad)" opacity=".55"/>`;
    g += `<text x="${pl - 8}" y="${y2(dmax) + 4}" text-anchor="end" class="vcax">-${fmtA(dmax)}</text>`;
  }
  g += `<line id="vcX" x1="0" x2="0" y1="${pt}" y2="${H - pb}" stroke="var(--ink)" stroke-width="1" opacity="0"/><rect x="${pl}" y="${pt}" width="${W - pl - pr}" height="${H - pt - pb}" fill="transparent" id="vcHit"/></svg>`;
  const leg = VC.view === "samples" ? `<div class="legend"><span><i style="background:var(--ink)"></i>EV</span><span><i style="background:var(--c-top);opacity:.5"></i>70% e 95%</span><span><i style="background:var(--ink2);opacity:.5"></i>20 run di esempio</span><span><i style="background:var(--good)"></i>run migliore</span><span><i style="background:var(--bad)"></i>run peggiore</span><span class="muted">asse in ${U === "bi" ? "buy-in" : U === "usd" ? "$" : "bb"}</span></div>` : `<div class="legend"><span><i style="background:var(--c-top)"></i>run mediano (su 1.000)</span><span><i style="background:var(--bad);opacity:.5"></i>sotto il massimo precedente</span></div>`;
  el.innerHTML = g + `<div class="vctip" id="vcTip" hidden></div>` + leg;
  const svg = el.querySelector("svg"), hit = el.querySelector("#vcHit"), tip = el.querySelector("#vcTip"), cx = el.querySelector("#vcX");
  hit.addEventListener("mousemove", e => {
    const r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * W;
    const i = Math.max(i0, Math.min(i1, Math.round(i0 + (sx - pl) / (W - pl - pr) * (i1 - i0))));
    cx.setAttribute("x1", x(i)); cx.setAttribute("x2", x(i)); cx.setAttribute("opacity", ".4");
    const n = Math.round(i * S.p.stepH), f = v => vcFmt(v, U);
    tip.hidden = false;
    tip.innerHTML = VC.view === "samples" ? `<b>${n.toLocaleString("it-IT")} mani</b><br>EV ${f(band(i, 0))}<br>70%: ${f(band(i, -1.0364))} / ${f(band(i, 1.0364))}<br>95%: ${f(band(i, -1.96))} / ${f(band(i, 1.96))}` : (() => { const m = S.medPath; let pk = 0; for (let k = 0; k <= i; k++) pk = Math.max(pk, m[k]); return `<b>${n.toLocaleString("it-IT")} mani</b><br>Risultato ${f(m[i])}<br>Drawdown ${f(m[i] - pk)}`; })();
    const tx = (x(i) / W) * r.width; tip.style.left = Math.min(r.width - 170, Math.max(0, tx + 10)) + "px"; tip.style.top = "10px";
  });
  hit.addEventListener("mouseleave", () => { tip.hidden = true; cx.setAttribute("opacity", "0"); });
}


