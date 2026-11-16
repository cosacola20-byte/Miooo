/* ================= FICHE 3D DELLA SCALATA =================
   La fiche grande in cima al Programma è un oggetto vero: due facce, lo spessore con gli inserti sul bordo e la luce.
   Si trascina per girarla da ogni lato e la si lascia andare con lo slancio; un tocco la spinge nel punto toccato
   (a destra gira verso destra, in alto si ribalta in avanti, al centro ruota piatta). Poi torna da sola dritta.
   L'orientamento è una matrice 3×3, così la rotazione segue sempre il dito, senza gli scatti degli angoli separati. */
const chip3d = (lv, size) => {
  const fs = lv.secret ? .2 : [.3, .3, .28, .24, .19][lv.stake.length - 2], kind = `${lv.gold ? " gold" : ""}${lv.secret ? " secret" : ""}`, c2 = lv.c2 ? `;--c2:${lv.c2}` : "";
  const face = side => `<span class="pchip face ${side}${kind}" style="--c:${lv.col};--ink:${lv.ink}${c2};--sz:${size}px"><i></i><b style="font-size:calc(var(--sz)*${fs})">${lv.stake.replace("NL", "")}</b><em>${lv.secret ? "♠" : "NL"}</em><u class="chip3d-gl"></u></span>`;
  const edge = [-.86, -.64, -.43, -.21, 0, .21, .43, .64, .86].map(k => `<i class="chip3d-l" style="--k:${k}"></i>`).join("");
  return `<div class="chip3d idle${kind}" data-chip3d role="button" tabindex="0" aria-label="Fiche ${lv.stake}: trascinala o toccala per farla girare" title="Trascinami o toccami: giro" style="--c:${lv.col}${c2};--sz:${size}px"><div class="chip3d-in">${edge}${face("front")}${face("back")}</div><i class="chip3d-sh"></i></div>`;
};
const C3 = { st: new WeakMap(), drag: null, hover: null };
const c3I = () => [1, 0, 0, 0, 1, 0, 0, 0, 1];
const c3Mul = (a, b) => [a[0] * b[0] + a[1] * b[3] + a[2] * b[6], a[0] * b[1] + a[1] * b[4] + a[2] * b[7], a[0] * b[2] + a[1] * b[5] + a[2] * b[8], a[3] * b[0] + a[4] * b[3] + a[5] * b[6], a[3] * b[1] + a[4] * b[4] + a[5] * b[7], a[3] * b[2] + a[4] * b[5] + a[5] * b[8], a[6] * b[0] + a[7] * b[3] + a[8] * b[6], a[6] * b[1] + a[7] * b[4] + a[8] * b[7], a[6] * b[2] + a[7] * b[5] + a[8] * b[8]];
const c3T = m => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
/* rotazione di «ang» radianti attorno all'asse (x, y, z), con gli assi dello schermo: x a destra, y in basso, z verso chi guarda */
function c3Rot(x, y, z, ang) {
  const n = Math.hypot(x, y, z); if (n < 1e-9 || !ang) return c3I(); x /= n; y /= n; z /= n;
  const c = Math.cos(ang), s = Math.sin(ang), t = 1 - c;
  return [c + t * x * x, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, c + t * y * y, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, c + t * z * z];
}
/* asse e angolo della rotazione d: [x, y, z, angolo] */
function c3Axis(d) {
  const ang = Math.acos(Math.max(-1, Math.min(1, (d[0] + d[4] + d[8] - 1) / 2))), s = 2 * Math.sin(ang);
  if (ang < 1e-5) return [0, 0, 1, 0];
  if (Math.abs(s) > 1e-3) return [(d[7] - d[5]) / s, (d[2] - d[6]) / s, (d[3] - d[1]) / s, ang];
  /* mezzo giro esatto: l'asse si legge dalla diagonale */
  return [Math.sqrt(Math.max(0, (d[0] + 1) / 2)), Math.sqrt(Math.max(0, (d[4] + 1) / 2)), Math.sqrt(Math.max(0, (d[8] + 1) / 2)), ang];
}
/* rimette la matrice ortogonale dopo tanti prodotti */
function c3Fix(m) {
  let a = [m[0], m[3], m[6]], b = [m[1], m[4], m[7]];
  const nrm = v => { const n = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / n, v[1] / n, v[2] / n]; };
  a = nrm(a); const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; b = nrm([b[0] - d * a[0], b[1] - d * a[1], b[2] - d * a[2]]);
  const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  return [a[0], b[0], c[0], a[1], b[1], c[1], a[2], b[2], c[2]];
}
function c3State(el) { let s = C3.st.get(el); if (!s) { s = { m: c3I(), w: [0, 0, 0], hx: 0, hy: 0, raf: 0, t: 0, drag: false }; C3.st.set(el, s); } return s; }
const c3Calm = () => typeof calmMotion === "function" && calmMotion();
/* posa di riposo più vicina: di fronte o di spalle (le due facce sono uguali), più l'inclinazione verso il mouse */
function c3Target(s) { const base = s.m[8] >= 0 ? c3I() : [-1, 0, 0, 0, 1, 0, 0, 0, -1]; return s.hx || s.hy ? c3Mul(c3Mul(c3Rot(1, 0, 0, -s.hy * .3), c3Rot(0, 1, 0, s.hx * .3)), base) : base; }
function c3Paint(el, s) {
  const m = s.m, inn = el.firstElementChild, L = [-.42, -.6, .68], lam = m[2] * L[0] + m[5] * L[1] + m[8] * L[2];
  inn.style.transform = `matrix3d(${m[0]},${m[3]},${m[6]},0,${m[1]},${m[4]},${m[7]},0,${m[2]},${m[5]},${m[8]},0,0,0,0,1)`;
  el.style.setProperty("--lf", (.74 + .42 * Math.max(0, lam)).toFixed(3)); el.style.setProperty("--lb", (.74 + .42 * Math.max(0, -lam)).toFixed(3));
  el.style.setProperty("--hx", (31 - m[2] * 46).toFixed(1) + "%"); el.style.setProperty("--hy", (23 - m[5] * 46).toFixed(1) + "%");
  const fl = Math.abs(m[8]); el.style.setProperty("--shs", (.5 + .5 * fl).toFixed(3)); el.style.setProperty("--sho", (.45 + .55 * fl).toFixed(3));
}
function c3Rest(el, s) { s.m = c3I(); s.w = [0, 0, 0]; el.firstElementChild.style.transform = ""; ["--lf", "--lb", "--hx", "--hy", "--shs", "--sho"].forEach(k => el.style.removeProperty(k)); el.classList.add("idle"); }
function c3Run(el) {
  const s = c3State(el); if (s.raf) return;
  el.classList.remove("idle"); s.t = performance.now();
  const step = now => {
    s.raf = 0; if (!el.isConnected) return;
    const dt = Math.min(.034, Math.max(.001, (now - s.t) / 1000)); s.t = now;
    if (!s.drag) {
      const sp = Math.hypot(s.w[0], s.w[1], s.w[2]);
      if (sp > 2.6) { const f = Math.exp(-dt * 1.15); s.w = s.w.map(v => v * f); } /* gira libera e rallenta */
      else { /* molla verso la posa di riposo */
        const T = c3Target(s), [ax, ay, az, ang] = c3Axis(c3Mul(T, c3T(s.m))), f = Math.exp(-dt * 9);
        s.w = [(s.w[0] + ax * ang * 62 * dt) * f, (s.w[1] + ay * ang * 62 * dt) * f, (s.w[2] + az * ang * 62 * dt) * f];
        if (ang < .004 && Math.hypot(s.w[0], s.w[1], s.w[2]) < .05) { if (s.hx || s.hy) { s.m = T; s.w = [0, 0, 0]; c3Paint(el, s); } else c3Rest(el, s); return; }
      }
      const w = Math.hypot(s.w[0], s.w[1], s.w[2]);
      if (w > 1e-6) s.m = c3Fix(c3Mul(c3Rot(s.w[0], s.w[1], s.w[2], w * dt), s.m));
    }
    c3Paint(el, s); s.raf = requestAnimationFrame(step);
  };
  s.raf = requestAnimationFrame(step);
}
/* spinta nel punto (nx, ny), da -1 a 1 dal centro: il punto toccato va verso il fondo; al centro la fiche ruota piatta */
function c3Push(el, nx, ny) {
  const s = c3State(el); if (c3Calm()) return;
  const r = Math.hypot(nx, ny);
  if (r < .24) { s.w[2] += (s.w[2] < 0 ? -1 : 1) * 15; s.w[0] += 1.2; }
  else { const k = (10 + 9 * Math.min(1, r)) / r; s.w[0] += -ny * k; s.w[1] += nx * k; }
  const sp = Math.hypot(s.w[0], s.w[1], s.w[2]); if (sp > 42) s.w = s.w.map(v => v * 42 / sp);
  c3Run(el);
}
document.addEventListener("pointerdown", e => {
  const el = e.target.closest && e.target.closest("[data-chip3d]"); if (!el || (e.button != null && e.button > 0)) return;
  const s = c3State(el), b = el.getBoundingClientRect();
  s.drag = true; s.w = [0, 0, 0]; C3.drag = { el, id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), moved: 0, k: 2.2 / b.width };
  try { el.setPointerCapture(e.pointerId); } catch (er) {}
  el.classList.add("drag"); c3Run(el);
});
document.addEventListener("pointermove", e => {
  const D = C3.drag;
  if (D && e.pointerId === D.id) {
    const s = c3State(D.el), dx = e.clientX - D.x, dy = e.clientY - D.y, now = performance.now(), dt = Math.max(.004, (now - D.t) / 1000);
    D.x = e.clientX; D.y = e.clientY; D.t = now; D.moved += Math.abs(dx) + Math.abs(dy);
    /* la faccia segue il dito: a destra gira attorno all'asse verticale, in basso attorno a quello orizzontale */
    const ax = -dy * D.k, ay = dx * D.k, ang = Math.hypot(ax, ay);
    if (ang > 0) { s.m = c3Fix(c3Mul(c3Rot(ax, ay, 0, ang), s.m)); s.w = [s.w[0] * .55 + ax / dt * .45, s.w[1] * .55 + ay / dt * .45, 0]; }
    return;
  }
  /* con il mouse sopra, la fiche si inclina verso il puntatore */
  if (e.pointerType !== "mouse" || c3Calm()) return;
  const el = e.target.closest && e.target.closest("[data-chip3d]");
  if (el) { const s = c3State(el), b = el.getBoundingClientRect(); s.hx = Math.max(-1, Math.min(1, (e.clientX - b.left - b.width / 2) / (b.width / 2))); s.hy = Math.max(-1, Math.min(1, (e.clientY - b.top - b.height / 2) / (b.height / 2))); C3.hover = el; c3Run(el); }
  else if (C3.hover) { const h = C3.hover, s = c3State(h); C3.hover = null; s.hx = s.hy = 0; if (h.isConnected) c3Run(h); }
});
function c3End(e, cancel) {
  const D = C3.drag; if (!D || e.pointerId !== D.id) return;
  C3.drag = null; const s = c3State(D.el), b = D.el.getBoundingClientRect(); s.drag = false; D.el.classList.remove("drag");
  if (c3Calm()) { s.w = [0, 0, 0]; s.m = s.m[8] >= 0 ? c3I() : [-1, 0, 0, 0, 1, 0, 0, 0, -1]; }
  else if (!cancel && D.moved < 7) c3Push(D.el, (D.x0 - b.left - b.width / 2) / (b.width / 2), (D.y0 - b.top - b.height / 2) / (b.height / 2));
  else if (performance.now() - D.t > 90) s.w = [0, 0, 0]; /* fermata prima di lasciarla: niente slancio */
  c3Run(D.el);
}
document.addEventListener("pointerup", e => c3End(e, false));
document.addEventListener("pointercancel", e => c3End(e, true));
document.addEventListener("keydown", e => {
  const el = e.target.closest && e.target.closest("[data-chip3d]"); if (!el) return;
  const P = { Enter: [.8, 0], " ": [.8, 0], ArrowRight: [.8, 0], ArrowLeft: [-.8, 0], ArrowUp: [0, -.8], ArrowDown: [0, .8] }[e.key];
  if (P) { e.preventDefault(); c3Push(el, P[0], P[1]); }
});
