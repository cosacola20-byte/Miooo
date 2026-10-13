/* ================= CLASSIFICA CONDIVISA DEI MINIGIOCHI =================
   Un documento per giocatore: lb_aof/<id> e lb_sh/<id> con il suo miglior punteggio e il nome da arcade.
   Tutti leggono la classifica, ognuno scrive solo la propria riga (regole db: lb_x/{self}). */
const LB_N = 100; /* la classifica tiene solo la top 100 */
/* una classifica per ogni situazione iniziale */
const aofKeyLb = secs => secs ? "aof" + secs : "aofinf";
const aofDurLbl = secs => secs ? secs + " secondi" : "Senza tempo";
const shKeyLb = st => "sh" + (st || "");
const LB_TITLE = { aof30: "Classifica · 30 secondi", aof60: "Classifica · 60 secondi", aof90: "Classifica · 90 secondi", aofinf: "Classifica · senza tempo", sh: "Classifica · tutte le street", shpre: "Classifica · preflop", shpost: "Classifica · flop e turn", shriver: "Classifica · river" };
const recGet = k => ((S.recs || {})[k]) || 0;
const recSet = (k, v) => { S.recs = { ...(S.recs || {}), [k]: v }; };
const LB = { db: null, uid: null, ready: null, cache: {} };
function lbInit() {
  if (LB.ready) return LB.ready;
  LB.ready = (async () => {
    try { const [d, u] = await Promise.all([hostUse("db"), hostUse("user")]); LB.db = d || null; LB.uid = u && typeof u.id === "function" ? await u.id() : null; } catch (e) {}
    return LB;
  })();
  return LB.ready;
}
const lbName = s => String(s || "").replace(/[<>"&]/g, "").replace(/\s+/g, " ").trim().slice(0, 14).toUpperCase();
async function lbLoad(game) {
  await lbInit(); if (!LB.db) return null;
  try {
    const qs = await LB.db.collection("lb_" + game).orderBy("score", "desc").limit(LB_N + 1).get();
    const rows = qs.docs.map(d => { const x = d.data() || {}; return { id: d.id, name: lbName(x.name) || "Anonimo", score: Math.max(0, Math.min(1e7, Math.round(+x.score || 0))), date: String(x.date || "").slice(0, 10), extra: +x.extra || 0 }; }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, LB_N);
    let mine = LB.uid ? rows.find(r => r.id === LB.uid) || null : null;
    if (LB.uid && !mine) { try { const m = await LB.db.doc("lb_" + game + "/" + LB.uid).get(); if (m.exists) { const x = m.data() || {}; mine = { id: LB.uid, name: lbName(x.name) || "Anonimo", score: Math.round(+x.score || 0), date: String(x.date || "").slice(0, 10), rank: null }; } } catch (e) {} }
    LB.cache[game] = { rows, mine, at: Date.now() };
    return LB.cache[game];
  } catch (e) { return null; }
}
async function lbSave(game, name, score, extra) {
  await lbInit(); if (!LB.db || !LB.uid) return { ok: false, why: "no" };
  const nm = lbName(name); if (!nm) return { ok: false, why: "name" };
  const ref = LB.db.doc("lb_" + game + "/" + LB.uid);
  try {
    const cur = await ref.get(); const old = cur.exists ? +((cur.data() || {}).score || 0) : 0;
    const best = Math.max(old, Math.round(score));
    await ref.set({ name: nm, score: best, extra: extra || 0, date: today() });
    S.nick = nm; persistSoon();
    return { ok: true, best };
  } catch (e) { return { ok: false, why: e && e.code === "invalid_argument" ? "ro" : "err" }; }
}
/* tabella: prime 10, la tua riga evidenziata e la tua posizione se sei più giù */
function lbTable(game, data, hiScore) {
  if (!data) return `<p class="lb-empty">Classifica non disponibile in questa vista.</p>`;
  const { rows, mine } = data;
  if (!rows.length) return `<p class="lb-empty">Nessun punteggio ancora: il primo nome in classifica può essere il tuo.</p>`;
  const myIdx = mine ? rows.findIndex(r => r.id === mine.id) : -1;
  const line = (r, i) => `<li class="${r.id === (mine && mine.id) ? "me" : ""} ${i < 3 ? "top" + (i + 1) : ""}"><span class="lb-pos">${i + 1}</span><span class="lb-nm">${esc(r.name)}${r.id === (mine && mine.id) ? " <small>(tu)</small>" : ""}</span><span class="lb-sc">${fmt(r.score)}</span></li>`;
  let h = `<ol class="lb-list lb-scroll">${rows.map(line).join("")}</ol><p class="lb-cap">Top ${LB_N} · ${rows.length} ${rows.length === 1 ? "giocatore" : "giocatori"}</p>`;
  if (mine && myIdx < 0) h += `<p class="lb-empty">Il tuo record, <b>${fmt(mine.score)}</b>, è uscito dalla top ${LB_N}.</p>`;
  return h;
}
/* box classifica: si riempie da solo quando i dati arrivano */
function lbBox(game, title) { return `<div class="lb-box" data-lb="${game}"><div class="lb-h"><span>${title || LB_TITLE[game] || "Classifica"}</span><button type="button" class="lb-ref" data-lbref="${game}" aria-label="Aggiorna">↻</button></div><div class="lb-body">${LB.cache[game] ? lbTable(game, LB.cache[game]) : `<p class="lb-empty">Carico la classifica...</p>`}</div></div>`; }
async function lbFill(game) {
  const d = await lbLoad(game);
  document.querySelectorAll(`.lb-box[data-lb="${game}"] .lb-body`).forEach(el => { el.innerHTML = lbTable(game, d); const me = el.querySelector("li.me"), ls = el.querySelector(".lb-scroll"); if (me && ls) ls.scrollTop = Math.max(0, me.offsetTop - ls.offsetTop - ls.clientHeight / 2); });
  return d;
}
/* modulo "lascia il tuo nome" a fine partita, solo se il punteggio batte il tuo record in classifica */
function lbOffer(game, score, extra) {
  const el = document.querySelector(`.lb-offer[data-lbo="${game}"]`); if (!el || !score) return;
  lbInit().then(async () => {
    const d = LB.cache[game] || await lbLoad(game);
    if (!LB.db || !LB.uid) { el.innerHTML = ""; return; }
    const myBest = d && d.mine ? d.mine.score : 0;
    const others = d ? d.rows.filter(r => r.id !== LB.uid) : [];
    if (others.length >= LB_N && score <= others[LB_N - 1].score) { el.innerHTML = `<p class="lb-note">Per entrare nella top ${LB_N} servono più di <b>${fmt(others[LB_N - 1].score)}</b> punti.</p>`; return; }
    if (score <= myBest) { el.innerHTML = `<p class="lb-note">Il tuo record in classifica resta <b>${fmt(myBest)}</b>.</p>`; return; }
    const rank = d ? d.rows.filter(r => r.score >= score && r.id !== LB.uid).length + 1 : null;
    el.innerHTML = `<div class="lb-form"><p><b>${myBest ? "Nuovo record personale!" : "Entri in classifica!"}</b>${rank ? ` Saresti <b>${rank}°</b>.` : ""} Lascia il tuo nome:</p><div class="lb-row"><input type="text" id="lbName" maxlength="14" placeholder="Il tuo nome" value="${esc(S.nick || "")}" autocomplete="nickname"><button class="aof2-go lb-save" id="lbSave">Salva</button></div><p class="lb-msg" id="lbMsg"></p></div>`;
    const inp = el.querySelector("#lbName"), btn = el.querySelector("#lbSave"), msg = el.querySelector("#lbMsg");
    if (!S.nick) inp.focus({ preventScroll: true });
    inp.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); btn.click(); } });
    btn.onclick = async () => {
      btn.disabled = true; msg.textContent = "Salvo...";
      const r = await lbSave(game, inp.value, score, extra);
      if (r.ok) { el.innerHTML = `<p class="lb-note">Salvato in classifica come <b>${esc(lbName(inp.value))}</b>.</p>`; lbFill(game); }
      else { btn.disabled = false; msg.textContent = r.why === "name" ? "Scrivi un nome." : r.why === "ro" ? "Con questo accesso puoi vedere la classifica ma non salvare: chiedi a chi ti ha condiviso l'app il permesso di usarla." : "Non sono riuscito a salvare: riprova tra poco."; }
    };
  });
}
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-lbref]"); if (!b) return; e.preventDefault(); lbFill(b.dataset.lbref); });

