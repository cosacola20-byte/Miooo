/* ================= EFFETTI DELLE RISPOSTE: combo a livelli, scintille, riepilogo animato ================= */
/* livello della combo: 0 niente, 1 «caldo» (2 giuste di fila), 2 «fuoco» (3-4), 3 «zona» (5 o più) */
const fxLevel = n => n >= 5 ? 3 : n >= 3 ? 2 : n >= 2 ? 1 : 0;
const FX_NAME = ["", "In serie", "In fiamme", "Nella zona"];
/* indicatore della combo accanto alla barra di avanzamento (non in esame) */
function fxComboPill() {
  if (!run || isExamRun()) return "";
  const n = run.combo || 0, lv = fxLevel(n); if (!lv) return "";
  return `<span class="fxc lv${lv}" title="${n} risposte giuste di fila">${GIC.flame}<b>${n}</b><small>${FX_NAME[lv]}</small></span>`;
}
/* dopo la risposta: scintille sull'opzione giusta, lampo quando si entra «nella zona» */
function fxAnswer(k, res) {
  if (!run || isExamRun() || res.score == null) return;
  const pill = document.querySelector(".gbar .fxc"), n = run.combo || 0, lv = fxLevel(n);
  const tmp = document.createElement("span"); tmp.innerHTML = fxComboPill();
  if (pill) pill.replaceWith(...(tmp.firstChild ? [tmp.firstChild] : [])); else if (tmp.firstChild) { const x = document.querySelector(".gbar .xprun"); if (x) x.before(tmp.firstChild); }
  if (res.score < 100 || !prefFx()) return;
  const b = k != null && k >= 0 ? document.querySelector(`.opt[data-k="${k}"]`) : null;
  if (b && lv >= 2) {
    const N = lv === 3 ? 18 : 10, wrap = document.createElement("span"); wrap.className = "fxspark lv" + lv; wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = Array.from({ length: N }, (_, i) => { const a = (i / N) * 360 + Math.random() * 14, d = 34 + Math.random() * 30; return `<i style="--a:${a.toFixed(0)}deg;--d:${d.toFixed(0)}px;--t:${(.45 + Math.random() * .25).toFixed(2)}s"></i>`; }).join("");
    b.appendChild(wrap); setTimeout(() => wrap.remove(), 900);
  }
  if (n === 5 || (n > 5 && n % 10 === 0)) {
    const z = document.createElement("div"); z.className = "fxzone"; z.setAttribute("aria-hidden", "true"); z.innerHTML = `<span>${FX_NAME[3]}<b>×${n}</b></span>`;
    document.body.appendChild(z); setTimeout(() => z.remove(), 1300);
  }
}
/* riepilogo del drill: una tessera per domanda che si gira, punteggio che sale, coriandoli se è tutto giusto */
function fxBest(sc) { let b = 0, c = 0; (sc || []).forEach(s => { if (s != null && s >= 100) { c++; b = Math.max(b, c); } else if (s != null) c = 0; }); return b; }
function fxTiles(r) {
  const sc = (r.sc || []).filter(s => s != null); if (!sc.length) return "";
  const perfect = sc.length >= 3 && sc.every(s => s >= 100), best = fxBest(r.sc);
  return `<div class="fxsum${perfect ? " perfect" : ""}">${perfect ? `<div class="fxperf">${GIC.crown} Perfetto: ${sc.length} su ${sc.length}</div>` : ""}<div class="fxtiles" role="img" aria-label="${r.ok} risposte giuste su ${sc.length}">${sc.map((s, i) => `<span class="${s >= 100 ? "ok" : s > 0 ? "mid" : "ko"}" style="--d:${(.35 + i * .09).toFixed(2)}s">${s >= 100 ? "✓" : s > 0 ? "~" : "✕"}</span>`).join("")}</div>${best >= 3 ? `<div class="fxbest">${GIC.flame} Serie migliore: <b>${best}</b> di fila</div>` : ""}</div>`;
}
function fxSumRun(r) {
  const el = document.querySelector(".sumgrid .big"); if (!el || r.score == null || calmMotion()) return;
  const T = r.score, t0 = performance.now(); el.textContent = "0%";
  const f = t => { const k = Math.min(1, (t - t0) / 800), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(T * e) + "%"; if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f);
  const sc = (r.sc || []).filter(s => s != null);
  if (sc.length >= 3 && sc.every(s => s >= 100)) setTimeout(() => { try { gSnd.combo(); } catch (e) {} gConfetti(2200); }, 450 + sc.length * 90);
}
