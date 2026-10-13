/* ================= AVVIO ================= */
(function boot() {
  const l = lsGet(LS); if (l) S = normalize(l);
  gS(); gStreakFix(); gS().rankSeen = gS().rankSeen || gRank().i;
  const lh = lsGet(LSH); if (lh && Array.isArray(lh.hands)) HANDS = lh;
  const lp = lsGet(LSP); if (lp && lp.f) POOL = lp;
  oppLoadLocal(); msLoad(); if (MS.active) msStartTimer();
  render();
  if (!(HOST() && typeof HOST().use === "function")) { setSave(l ? "Progressi salvati in questo browser" : ""); return; }
  SAMPLE_P = hostUse("sample").catch(() => null);
  SAMPLE_P.then(s => { if (s) { sample = s; if (run && run.stage === "fb" && run.lastHand && !$("#aiBtn") && !$("#aiOut")) {} } }).catch(() => {});
  hostUse("db").then(async d => {
    if (!d) { setSave("Progressi salvati in questo browser"); return; }
    /* nell'artifact condiviso i progressi salvati sono del proprietario: chi lo apre da un link gioca con i progressi nel suo browser */
    if (!window.ORCA_HOST) { try { const u = await hostUse("user"); if (u && !(await u.isOwner())) { setSave("Progressi salvati in questo browser"); return; } } catch (e) {} }
    db = d; docRef = db.doc("progress/main");
    try {
      const [ps, hs, pl] = await Promise.all([docRef.get(), db.doc("myhands/list").get(), db.doc("config/pool").get()]);
      if (ps.exists && isObj(ps.data())) { const R = ps.data(); SYNC["progress/main"].apply(R); SEEN["progress/main"] = R._u || 0; if (R._dev !== DEV || (S._u || 0) > (R._u || 0)) persist(); }
      else if (S.history.length) persist();
      if (hs.exists && isObj(hs.data()) && Array.isArray(hs.data().hands)) { const R = hs.data(); SYNC["myhands/list"].apply(R); SEEN["myhands/list"] = R._u || 0; if (R._dev !== DEV || (HANDS._u || 0) > (R._u || 0)) persistHands(); } else if (HANDS.hands.length) persistHands();
      if (pl.exists && pl.data().f) { POOL = pl.data(); lsSet(LSP, POOL); } else if (POOL) persistPool();
      setSave("Progressi sincronizzati");
    } catch (e) { setSave("Progressi salvati in questo browser"); }
    oppLoadDb(); msLoadDb();
    try {
      const rs = await db.collection("reports").orderBy("date", "desc").limit(1).get();
      if (!rs.empty) REPORT = rs.docs[0].data();
    } catch (e) {}
    if (!run || run.stage === "intro" || run.stage === "end") render(); else renderStats();
  }).catch(() => {});
})();

