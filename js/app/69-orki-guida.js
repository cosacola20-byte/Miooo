/* ================= ORKI GUIDA =================
   Orki fa la domanda in un fumetto, come in una chat, e reagisce alla risposta: contento, pensieroso o triste.
   Sbatte gli occhi e muove appena la testa (css/14-novita.css). Negli esami resta neutro, per non rivelare niente. */
function orkiAsk(root) {
  const q = root && root.querySelector(".qcard:not(.intro) .qtitle");
  if (!q || q.closest(".orki-ask") || typeof gMascot !== "function") return;
  const row = document.createElement("div"); row.className = "orki-ask";
  row.innerHTML = `<div class="orki-av">${gMascot("think", 46)}</div><div class="orki-bub"></div>`;
  q.replaceWith(row); row.querySelector(".orki-bub").appendChild(q);
}
function orkiReact(res) {
  const av = document.querySelector(".orki-ask .orki-av"); if (!av || !res) return;
  if (isExamRun()) return;
  const mood = res.score == null ? "think" : res.score >= 100 ? "happy" : res.score > 0 ? "think" : "sad";
  av.innerHTML = gMascot(mood === "happy" && (run.combo || 0) >= 3 ? "wow" : mood, 46);
  av.classList.remove("ok", "ko"); void av.offsetWidth; av.classList.add(res.score >= 100 ? "ok" : "ko");
}
