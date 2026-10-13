/* ================= CLASSIFICHE DEI DRILL (generale e settimanale) =================
   Ogni risposta vale da 0 a 10 punti (10 se giusta, una parte se quasi giusta).
   Un solo documento per giocatore, lbd/<id>, con un campo per drill: s_<drill> (sempre) e w_<drill> (settimana wk).
   La settimana va da lunedì a domenica; al primo punto di una nuova settimana i punti settimanali ripartono da zero. */
const LBD_SKIP = new Set(["review", "herr", "hands"]);
/* le domande delle lezioni del programma (lez) contano nella classifica "Quiz delle lezioni" (teoria) */
const lbdKey = id => id === "lez" ? "teoria" : id;
const lbdOn = id => DRILLS[lbdKey(id)] && !DRILLS[lbdKey(id)].game && !LBD_SKIP.has(id);
function isoWeek(d0) { const d = new Date(Date.UTC(d0.getFullYear(), d0.getMonth(), d0.getDate())), day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); return d.getUTCFullYear() + "-W" + String(Math.ceil(((d - y0) / 86400000 + 1) / 7)).padStart(2, "0"); }
const curWeek = () => isoWeek(new Date());
function lbdState() { const w = curWeek(); if (!S.lbd || typeof S.lbd !== "object") S.lbd = { wk: w, s: {}, w: {} }; if (S.lbd.wk !== w) { S.lbd.wk = w; S.lbd.w = {}; } return S.lbd; }
function lbdAdd(id, score) {
  if (!lbdOn(id) || score == null) return; id = lbdKey(id);
  const L = lbdState(), p = Math.max(0, Math.min(10, Math.round(score / 10)));
  if (!p) return;
  L.s[id] = (L.s[id] || 0) + p; L.w[id] = (L.w[id] || 0) + p; L.dirty = true;
}
let LBDS = { t: 0, busy: false };
function lbdSync(force) {
  const L = lbdState(); if (!S.nick || LBDS.busy || (!L.dirty && !force)) return Promise.resolve();
  if (!force && Date.now() - LBDS.t < 30000) return Promise.resolve();
  LBDS.busy = true; LBDS.t = Date.now();
  return lbInit().then(async () => {
    try {
      if (LB.db && LB.uid) {
        const doc = { name: lbName(S.nick), wk: L.wk, date: today() };
        let sa = 0, wa = 0;
        Object.entries(L.s).forEach(([k, v]) => { doc["s_" + k] = v; sa += v; });
        Object.entries(L.w).forEach(([k, v]) => { doc["w_" + k] = v; wa += v; });
        doc.s_all = sa; doc.w_all = wa;
        await LB.db.doc("lbd/" + LB.uid).set(doc); L.dirty = false;
      }
    } catch (e) {}
    LBDS.busy = false;
  });
}
async function lbdLoad(id, mode) {
  await lbInit(); if (!LB.db) return null;
  const f = (mode === "w" ? "w_" : "s_") + id, wk = curWeek();
  try {
    const q = mode === "w" ? LB.db.collection("lbd").where("wk", "==", wk).limit(500) : LB.db.collection("lbd").orderBy(f, "desc").limit(LB_N + 1);
    const qs = await q.get();
    const rows = qs.docs.map(d => { const x = d.data() || {}; return { id: d.id, name: lbName(x.name) || "Anonimo", score: Math.max(0, Math.min(1e8, Math.round(+x[f] || 0))), wk: x.wk }; })
      .filter(r => r.score > 0 && (mode !== "w" || r.wk === wk)).sort((a, b) => b.score - a.score).slice(0, LB_N);
    let mine = LB.uid ? rows.find(r => r.id === LB.uid) || null : null;
    if (!mine && LB.uid) { const L = lbdState(), v = mode === "w" ? (L.w[id] || 0) : (L.s[id] || 0); if (v && S.nick) mine = { id: LB.uid, name: lbName(S.nick), score: v }; }
    return { rows, mine };
  } catch (e) { return null; }
}
const lbdTitle = id => id === "all" ? "Tutti i drill" : (DRILLS[id] ? DRILLS[id].name : id);
/* finestra classifica di un drill: Settimana / Generale */
function lbdOpen(id, mode0) {
  let mode = mode0 || "w";
  gModal(`<div class="lbd"><span class="eyebrow">Classifica</span><h3 style="margin:4px 0 8px">${esc(lbdTitle(id))}</h3><div class="lbd-tabs"><button data-lbdm="w">Questa settimana</button><button data-lbdm="s">Generale</button></div><div id="lbdJoin"></div><div class="lb-box lbd-box"><div class="lb-body" id="lbdBody"><p class="lb-empty">Carico la classifica...</p></div></div><p class="lbd-note">10 punti per ogni risposta giusta, una parte se è quasi giusta. La classifica settimanale riparte ogni lunedì.</p></div>`, (m) => {
    m.querySelector(".gmbox").classList.add("lbdwide");
    const paint = async () => {
      m.querySelectorAll("[data-lbdm]").forEach(b => b.classList.toggle("on", b.dataset.lbdm === mode));
      const body = m.querySelector("#lbdBody"); body.innerHTML = `<p class="lb-empty">Carico la classifica...</p>`;
      if (S.nick) await lbdSync(true);
      const d = await lbdLoad(id, mode);
      body.innerHTML = lbTable("lbd", d);
      const me = body.querySelector("li.me"), ls = body.querySelector(".lb-scroll"); if (me && ls) ls.scrollTop = Math.max(0, me.offsetTop - ls.offsetTop - ls.clientHeight / 2);
    };
    m.querySelectorAll("[data-lbdm]").forEach(b => b.onclick = () => { mode = b.dataset.lbdm; paint(); });
    const join = m.querySelector("#lbdJoin");
    lbInit().then(() => {
      if (!LB.db || !LB.uid || S.nick) { join.innerHTML = S.nick && LB.db ? `<p class="lb-note" style="text-align:left;margin:0 0 8px">Giochi come <b>${esc(lbName(S.nick))}</b>. ${(() => { const L = lbdState(); return id === "all" ? "" : `Questa settimana: <b>${fmt(L.w[id] || 0)}</b> punti, in totale <b>${fmt(L.s[id] || 0)}</b>.`; })()}</p>` : ""; return; }
      join.innerHTML = `<div class="lb-form" style="max-width:none"><p>Entra nelle classifiche dei drill con un nome: i tuoi punti si aggiornano da soli.</p><div class="lb-row"><input type="text" id="lbdName" maxlength="14" placeholder="Il tuo nome"><button class="aof2-go lb-save" id="lbdGo">Entra</button></div><p class="lb-msg" id="lbdMsg"></p></div>`;
      const inp = join.querySelector("#lbdName"); inp.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") join.querySelector("#lbdGo").click(); });
      join.querySelector("#lbdGo").onclick = async () => { const nm = lbName(inp.value); if (!nm) { join.querySelector("#lbdMsg").textContent = "Scrivi un nome."; return; } S.nick = nm; lbdState().dirty = true; persistSoon(); await lbdSync(true); join.innerHTML = `<p class="lb-note" style="text-align:left;margin:0 0 8px">Sei in classifica come <b>${esc(nm)}</b>.</p>`; paint(); };
    });
    paint();
  });
}
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-lbd]"); if (!b) return; e.preventDefault(); e.stopPropagation(); lbdOpen(b.dataset.lbd, b.dataset.lbdmode); }, true);

