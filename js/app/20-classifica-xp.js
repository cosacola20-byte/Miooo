/* ================= CLASSIFICA XP =================
   Chi vuole entra con un nome; da quel momento la sua riga si aggiorna da sola con gli XP (al massimo una scrittura al minuto). */
LB_TITLE.xp = "Classifica XP";
let XPSYNC = { t: 0, last: null, busy: false };
function xpLbSync(force) {
  if (!S.xpLb || XPSYNC.busy) return;
  const xp = Math.round(gS().xp || 0);
  if (!force && (xp === XPSYNC.last || Date.now() - XPSYNC.t < 60000)) return;
  XPSYNC.busy = true; XPSYNC.t = Date.now();
  lbInit().then(async () => {
    try { if (LB.db && LB.uid) { await LB.db.doc("lb_xp/" + LB.uid).set({ name: lbName(S.xpLb), score: xp, rank: (typeof gRank === "function" ? (gRank().R || {}).n : "") || "", date: today() }); XPSYNC.last = xp; } } catch (e) {}
    XPSYNC.busy = false;
  });
}
function xpLbPanel() {
  return `<section class="panel xplb" style="margin-top:16px"><div class="eyebrow">Classifica</div><h3 style="margin:4px 0 6px">Classifica XP di tutti i giocatori</h3><p class="muted" style="font-size:13px;margin:0 0 10px">Gli XP si guadagnano con lezioni, drill, esami e minigiochi.</p><div id="xpJoin"></div>${lbBox("xp")}</section>`;
}
function xpLbMount() {
  const el = $("#xpJoin"); if (!el) return;
  lbInit().then(() => {
    if (!LB.db || !LB.uid) { el.innerHTML = ""; return; }
    if (S.xpLb) { el.innerHTML = `<p class="lb-note" style="text-align:left">Sei in classifica come <b>${esc(lbName(S.xpLb))}</b> con ${fmt(Math.round(gS().xp || 0))} XP. <button class="btn small ghost" id="xpLeave">Esci dalla classifica</button></p>`; $("#xpLeave").onclick = async () => { try { await LB.db.doc("lb_xp/" + LB.uid).delete(); } catch (e) {} S.xpLb = null; persistSoon(); xpLbMount(); lbFill("xp"); }; return; }
    el.innerHTML = `<div class="lb-form xpform"><p>Entra in classifica con un nome: i tuoi XP si aggiorneranno da soli.</p><div class="lb-row"><input type="text" id="xpName" maxlength="14" placeholder="Il tuo nome" value="${esc(S.nick || "")}"><button class="aof2-go lb-save" id="xpGo">Entra</button></div><p class="lb-msg" id="xpMsg"></p></div>`;
    const inp = $("#xpName"); inp.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") $("#xpGo").click(); });
    $("#xpGo").onclick = async () => {
      const nm = lbName(inp.value); if (!nm) { $("#xpMsg").textContent = "Scrivi un nome."; return; }
      $("#xpGo").disabled = true;
      try { await LB.db.doc("lb_xp/" + LB.uid).set({ name: nm, score: Math.round(gS().xp || 0), rank: (typeof gRank === "function" ? (gRank().R || {}).n : "") || "", date: today() }); S.xpLb = nm; S.nick = S.nick || nm; XPSYNC.last = Math.round(gS().xp || 0); persistSoon(); xpLbMount(); lbFill("xp"); }
      catch (e) { $("#xpGo").disabled = false; $("#xpMsg").textContent = e && e.code === "invalid_argument" ? "Con questo accesso puoi vedere la classifica ma non entrarci." : "Non sono riuscito a salvare: riprova tra poco."; }
    };
  });
  lbFill("xp");
}

