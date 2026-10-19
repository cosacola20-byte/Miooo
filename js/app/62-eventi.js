/* ================= EVENTI ================= */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-tab]"); if (t) return setTab(t.dataset.tab);
  const us = e.target.closest("[data-unskip]"); if (us) { const Lv = LEVELS[+us.dataset.unskip]; S.skipped = { ...(S.skipped || {}) }; Lv.s.forEach(x => delete S.skipped[x.id]); persist(); return renderProgram(); }
  const f0k = e.target.closest("[data-f0skip]"); if (f0k) { e.preventDefault(); return skipF0(); }
  const sk = e.target.closest("[data-skip]"); if (sk) { e.preventDefault(); e.stopPropagation(); return skipLesson(+sk.dataset.skip, sk.closest(".car-card")); }
  const s = e.target.closest("[data-start]"); if (s) { const x = sessById(+s.dataset.start), a = x ? (x.extra ? xAccess(x.level) : levelAccess(x.level)) : { ok: true }; if (!a.ok) return tlLockMsg(a, x.level); return startSession(+s.dataset.start); }
  const pc = e.target.closest("[data-pcat]"); if (pc) { const [d, c] = pc.dataset.pcat.split("|"); if (c === "nl25" && !pre25Ok()) return gToast(PRE25_LOCK_MSG); lsSet("orca_pcat_" + d, c); return renderFree(); }
  const f = e.target.closest("[data-free]"); if (f && !f.disabled) return startFree(f.dataset.free);
  const fl = e.target.closest("[data-flock]"); if (fl) return drillLockMsg(fl.dataset.flock);
});
document.addEventListener("keydown", e => {
  if (!run) return;
  // dentro la scheda Invio attiva il bottone, il cursore, la tendina o il termine del glossario selezionato: non deve far partire il quiz
  if (e.key === "Enter" && e.target.closest && e.target.closest(".lesbody")) return;
  if ((e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") && e.key !== "Enter") return;
  if (e.target.id === "htarget" && e.key === "Enter") return;
  if (e.key === "Enter") { const b = $("#go") || $("#nextQ") || $("#cont") || $("#submitSl:not([hidden])"); if (b) { e.preventDefault(); b.click(); } }
  else if (run.stage === "q" && /^[1-9]$/.test(e.key)) { const b = document.querySelector(`${(run.q && run.q.optSel) || ".opt"}[data-k="${+e.key - 1}"]`); if (b) b.click(); }
});

