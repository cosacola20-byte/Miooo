/* ================= AVVERSARI: interfaccia ================= */
const LSO = "orca-opp-v1";
let OPPS = {}, OPPK = OPP_K, oppView = { mode: "list" }, oppImgs = null;
const oppSlug = n => String(n || "senza_nome").trim().replace(/[^A-Za-z0-9_\-.~:@+]/g, "_").replace(/^\.+$/, "_").slice(0, 120) || "senza_nome";
const oget = (o, p) => p.split(".").reduce((x, k) => x == null ? undefined : x[k], o);
function oset(o, p, v) { const ks = p.split("."); let x = o; ks.slice(0, -1).forEach(k => { if (x[k] == null || typeof x[k] !== "object") x[k] = {}; x = x[k]; }); x[ks[ks.length - 1]] = v; }
const oppEmpty = () => ({ name: "", rows: ["", "", "", "", "", ""], header: {}, cbet: {}, aggr: {}, tb: {}, notes: "", flags: [] });
const G6 = ["flop_ip", "turn_ip", "river_ip", "flop_oop", "turn_oop", "river_oop"], G6L = ["FlopIP", "TurnIP", "RiverIP", "FlopOOP", "TurnOOP", "RiverOOP"];
const FTR = ["flop", "turn", "river"], FTRL = ["Flop", "Turn", "River"];
const OPP_FORM = [
  { t: "Giocatore (header profilo)", open: true, f: [["name", "Nome"], ["header.hands", "Hands"], ["header.bb100", "bb/100"], ["header.winrate_ev", "Winrate EV (bb/100)"], ["header.net_won", "Net Won"], ["header.wtsd", "WTSD% (n/tot)"], ["header.wsd", "W$SD% (n/tot)"], ["header.wsd_river_bet", "W$SD% B River (n/tot)"]] },
  { t: "HUD principale (6 righe, copia i numeri come li vedi, con le /)", open: true, rows: true },
  { t: "Pop-up CBET", f: [["cbet.wtsd", "wtsd (in alto a destra)"], ...FTR.map((s, i) => ["cbet.cb_general." + s, `CB GENERALE ${FTRL[i]}`]), ...FTR.map((s, i) => ["cbet.fold_cb." + s, `FOLD CB ${FTRL[i]}`]), ["cbet.cb_vs_2", "cb vs 2 oppi"], ["cbet.cb_vs_3plus", "cb vs 3+"]],
    grid: { base: "cbet.grid", rows: [["cbet", "CBet"], ["fold_to_cbet", "Fold to CBet"], ["raise_cbet", "Raise CBet"], ["cb_fold", "Cb-fold"]], cols: G6, colL: G6L },
    f2: [["cbet.fold_vs_raise_cb", "Fold vs raise cb (1a colonna)"], ...["flop", "turn_ip", "turn_oop", "river_ip", "river_oop"].map((s, i) => ["cbet.bet_vs_missed." + s, `Bet vs miss cbet ${["Flop", "Turn IP", "Turn OOP", "River IP", "River OOP"][i]}`]), ...FTR.map((s, i) => ["cbet.check_fold." + s, `Check fold ${FTRL[i]}`]), ["cbet.cb_vs_hero", "Cb vs hero"], ["cbet.river_bet_srp", "RIVER BET SRP"], ["cbet.riverbet_pct", "RIVERBET %"], ["cbet.fold_river_bet", "Fold river bet"],
      ...FTR.map((s, i) => ["cbet.threebet_pot.cbet." + s, `CBet 3betpot ${FTRL[i]}`]), ...FTR.map((s, i) => ["cbet.threebet_pot.fold_to_cbet." + s, `Fold to CBet 3betpot ${FTRL[i]}`]), ["cbet.threebet_pot.raise_cbet_3betpot", "Raise CBet (col. 3betpot)"], ["cbet.threebet_pot.fold_vs_raise_3betpot", "Fold vs raise cb (col. 3betpot)"]] },
  { t: "Pop-up Aggression", f: [...["total", ...FTR].map((s, i) => ["aggr.agg_freq." + s, `Agg Freq % ${["Total", ...FTRL][i]}`]), ...["total", ...FTR].map((s, i) => ["aggr.af." + s, `Agg Factor ${["Total", ...FTRL][i]}`]), ...["total", ...FTR].map((s, i) => ["aggr.check_raise." + s, `Check Raise ${["Total", ...FTRL][i]}`]), ["aggr.agg_3betpot", "AGG 3BETPOT"]] },
  { t: "Pop-up 3Bet", f: [...["total", "ep", "mp", "co", "btn", "sb", "bb"].map(s => ["tb.by_pos." + s, `3Bet ${s.toUpperCase()}`]), ...["ep", "mp", "co", "btn", "sb"].map(s => ["tb.vs_open_from." + s, `3B VS ${s.toUpperCase()}`]), ...["total", "co", "btn", "sb", "bb"].map(s => ["tb.squeeze." + s, `Squeeze ${s.toUpperCase()}`]), ...["total_fold", "co", "btn", "sb"].map(s => ["tb.vs_4bet." + s, `VS 4BET ${s === "total_fold" ? "TOTAL FOLD" : s.toUpperCase() + " FOLD"}`]),
    ...[["bb_btn", "BB vs BTN"], ["bb_sb", "BB vs SB"], ["btn_co", "BTN vs CO"], ["sb_btn", "SB vs BTN"]].flatMap(([k, l]) => [["tb.det." + k + ".all", `3b ${l}`], ["tb.det." + k + ".vs_hero", `3b ${l} (vs hero)`]])] },
];
const oppId = p => "of-" + p.replace(/\./g, "__");
function oppPrep(D) {
  const X = JSON.parse(JSON.stringify(D));
  const det = (X.tb || {}).det || {};
  X.tb = X.tb || {}; X.tb.detail = Object.entries(det).map(([k, v]) => { const [a, b] = k.split("_"); return { his_pos: a, vs: b, all: v.all, vs_hero: v.vs_hero }; }).filter(x => x.all);
  if (X.tb.by_pos && X.tb.by_pos.total != null) X.tb.by_pos.total = oppCell(X.tb.by_pos.total) ? oppCell(X.tb.by_pos.total).value : X.tb.by_pos.total;
  return X;
}
function oppLoadLocal() { try { const x = JSON.parse(localStorage.getItem(LSO) || "null"); if (x && x.opps) { OPPS = x.opps; if (x.k) OPPK = x.k; } } catch (e) {} }
function oppSaveLocal() { try { localStorage.setItem(LSO, JSON.stringify({ opps: OPPS, k: OPPK })); } catch (e) {} }
async function oppLoadDb() {
  if (!db) return;
  try {
    const qs = await db.collection("opponents").get();
    qs.docs.forEach(d => { const x = d.data(); if (x && x.name) OPPS[d.id] = x; });
    const c = await db.doc("config/opp").get(); if (c.exists && c.data().k) OPPK = c.data().k;
    oppSaveLocal();
    if (tab === "opp" && !run && oppView.mode === "list") renderOpp();
  } catch (e) {}
}
function oppPersist(id) { oppSaveLocal(); if (db) db.doc("opponents/" + id).set(OPPS[id]).then(() => setSave("Avversario salvato")).catch(() => setSave("Avversario salvato in questo browser")); }
/* ---------- lista ---------- */
function renderOpp() {
  if (oppView.mode === "edit") return renderOppEdit();
  if (oppView.mode === "show") return renderOppShow();
  const L = Object.entries(OPPS).sort((a, b) => String(b[1].date || "").localeCompare(String(a[1].date || "")));
  let h = `<section class="next" style="margin-bottom:16px"><div><div class="eyebrow">Analisi avversari da HM3</div><h2>Voto 1-10 e nota da incollare</h2><p>Carica gli screenshot di HUD e pop-up (header, CBET, Aggression, 3Bet). Leggo i numeri, li controllo incrociandoli e poi calcolo voto, leak e adattamenti.</p></div><div><button class="btn primary" id="oppNew">Nuova analisi</button></div></section>`;
  if (!L.length) h += `<p class="muted">Nessun avversario analizzato. Premi Nuova analisi.</p>`;
  else h += `<div class="opp-list">${L.map(([id, o]) => `<button class="opp-card" data-opp="${esc(id)}"><span class="opp-vote ${o.out.vote >= 7 ? "good" : o.out.vote >= 4.5 ? "mid" : "bad"}">${fmtN(o.out.vote)}</span><span><b>${esc(o.name)}</b><br><span class="muted" style="font-size:12.5px">${esc(o.out.label)} · ${o.out.hands} mani · ${esc(o.date || "")}</span></span>${o.userVote != null ? `<span class="muted mono" style="font-size:12px">tuo ${fmtN(o.userVote)}</span>` : ""}</button>`).join("")}</div>`;
  const cal = oppCalib();
  h += `<section class="panel" style="margin-top:16px"><div class="eyebrow">Calibrazione del voto</div><p style="margin:4px 0 8px;font-size:14.5px">Voto = 10 − k × penalità. Ora k = <b class="mono">${String(OPPK).replace(".", ",")}</b> (tarato sui 16 giocatori della specifica). Scrivi il tuo voto nelle schede degli avversari: con almeno 5 voti ti propongo il k che rende il tool più vicino al tuo giudizio.</p>${cal ? `<p style="margin:0 0 8px;font-size:14.5px">Su <b>${cal.n}</b> avversari con il tuo voto: con k attuale ${cal.cur}/${cal.n} entro ±1, con k = <b>${String(cal.k).replace(".", ",")}</b> ${cal.best}/${cal.n}.</p>${Math.abs(cal.k - OPPK) > 0.001 ? `<button class="btn" id="oppUseK">Usa k = ${String(cal.k).replace(".", ",")}</button>` : `<span class="pill good">k già ottimale</span>`}` : `<p class="muted" style="margin:0;font-size:13px">${Object.values(OPPS).filter(o => o.userVote != null).length}/5 voti tuoi inseriti.</p>`}</section>`;
  $("#view").innerHTML = h;
  $("#oppNew").onclick = () => { oppView = { mode: "edit", D: oppEmpty(), step: 1 }; oppImgs = null; renderOpp(); };
  document.querySelectorAll("[data-opp]").forEach(b => b.onclick = () => { oppView = { mode: "show", id: b.dataset.opp }; renderOpp(); });
  if ($("#oppUseK")) $("#oppUseK").onclick = () => { OPPK = cal.k; oppSaveLocal(); if (db) db.doc("config/opp").set({ k: OPPK }).catch(() => {}); Object.keys(OPPS).forEach(id => oppRecompute(id)); renderOpp(); };
}
function oppRecompute(id) {
  const o = OPPS[id]; if (!o || !o.D) return;
  const A = oppRun(oppPrep(o.D), OPPK, o.llm ? o.llm.revisione : 0);
  o.out = { ...o.out, ...A.out };
}
function oppCalib() {
  const L = Object.values(OPPS).filter(o => o.userVote != null && o.out && o.out.P != null);
  if (L.length < 5) return null;
  const score = k => L.filter(o => { const v = oppVoteFrom(o, k); return Math.abs(v - o.userVote) <= 1; }).length;
  let best = OPPK, bs = -1, mae = 1e9;
  for (let k = 0.07; k <= 0.1501; k += 0.005) { const s = score(k), m = L.reduce((a, o) => a + Math.abs(oppVoteFrom(o, k) - o.userVote), 0); if (s > bs || (s === bs && m < mae)) { bs = s; best = Math.round(k * 1000) / 1000; mae = m; } }
  return { n: L.length, k: best, best: bs, cur: score(OPPK) };
}
function oppVoteFrom(o, k) {
  const A = oppRun(oppPrep(o.D), k, o.llm ? o.llm.revisione : 0);
  return A.out.vote;
}
/* analisi completa (deterministica), con revisione opzionale */
function oppRun(D, k, rev) {
  const V = oppValidate(D), S = oppStats(D, V), sc = oppScore(D, V, S, k), note = oppNote(D, V, S, sc), fin = oppFinal(sc, S, V, rev || 0);
  const strong = sc.rows.filter(r => r.lvl === 0 && r.w >= 3 && r.conf >= 0.6).map(r => `${r.lab} ${fmtN(r.v)}`).slice(0, 3);
  const weak = sc.rows.filter(r => r.pen > 0).sort((a, b) => b.pen - a.pen).slice(0, 3).map(r => `${r.lab} ${fmtN(r.v)}`);
  const line = `Punti forti: ${strong.length ? strong.join(", ") : "nessuno netto"}. Punti deboli: ${weak.length ? weak.join(", ") : "nessuno netto"}.`;
  return { V, S, sc, note, fin, out: { vote: fin.vote, band: fin.band, conf: fin.conf, caps: fin.caps, rev: fin.rev, tech: Math.round(sc.tech * 100) / 100, P: Math.round(sc.P * 10) / 10, wadj: sc.wadj, dimP: sc.dimP, label: note.label, hands: V.hands || 0, line, k } };
}
/* ---------- editor ---------- */
function oppField(D, p, l) {
  const fl = (D.flags || []).find(f => f.field === p);
  const v = oget(D, p);
  return `<label class="of${fl ? " flag" : ""}" for="${oppId(p)}">${esc(l)}<input type="text" id="${oppId(p)}" data-p="${p}" value="${esc(v == null ? "" : typeof v === "object" ? oppFmtCell(v) : v)}" ${fl ? `title="${esc(fl.reason)}"` : ""}></label>`;
}
function renderOppEdit() {
  const D = oppView.D;
  let h = `<div class="rbar" style="margin-bottom:12px"><div class="where"><b>Nuova analisi avversario</b></div><button class="btn ghost" id="oppBack">Torna alla lista</button></div>`;
  h += `<section class="panel"><div class="eyebrow">1 · Screenshot</div><p style="margin:4px 0 8px;font-size:14.5px">Carica HUD, header del profilo e pop-up CBET, Aggression e 3Bet (anche tutti insieme). Ogni immagine viene letta due volte, intera e ingrandita in alto contrasto: se le due letture non coincidono il valore resta evidenziato in giallo da confermare.</p>
  <input type="file" id="oppFiles" accept="image/png,image/jpeg,image/webp" multiple style="margin:4px 0 8px">
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn primary" id="oppRead" disabled>Leggi gli screenshot con Claude</button><span id="oppReadMsg" class="muted" style="font-size:13.5px">Controllo se questa vista può leggere immagini...</span></div>
  <div id="oppReadLog" class="opp-log"></div>
  <details class="osec" style="margin-top:8px"><summary>Importa dati (JSON)</summary><p style="margin:4px 0 6px;font-size:13.5px;color:var(--ink2)">Incolla il JSON che ti ho preparato in chat (schema della specifica, sezione 5): riempie il modulo qui sotto, poi controlli e analizzi.</p><textarea id="oppJson" placeholder='{"player": {"name": "..."}, "hud": {"raw_rows": [...]}, ...}'></textarea><div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap"><button class="btn" id="oppJsonB">Importa</button><span id="oppJsonMsg" class="muted" style="font-size:13.5px"></span></div></details></section>`;
  h += `<section class="panel" style="margin-top:14px"><div class="eyebrow">2 · Valori (controlla e correggi)</div><p style="margin:4px 0 8px;font-size:14px;color:var(--ink2)">Formato delle celle: <span class="mono">39 (23/59)</span> = 39% su 59 spot, 23 casi. Solo il numero se il sample non si vede. <span class="mono">-</span> o vuoto = dato assente. I colori dell'HUD non contano.</p>`;
  OPP_FORM.forEach((sec, si) => {
    h += `<details class="osec" ${sec.open ? "open" : ""}><summary>${esc(sec.t)}</summary>`;
    if (sec.rows) h += `<div class="orows">${OPP_ROWS.map((R, i) => { const fl = (D.flags || []).find(f => f.field === "row" + (i + 1)); return `<label class="of${fl ? " flag" : ""}" for="of-row${i}">Riga ${i + 1} · <span class="muted" style="font-weight:400">${R.n} valori: ${esc(R.lab)}</span><input type="text" id="of-row${i}" data-row="${i}" value="${esc(D.rows[i] || "")}" placeholder="${["5253 28 22/ 29", "20 25 32 51 51/ 36", "55 52 46/ 50 31 78", "9.4 55/ 3 62/ 8 73", "12 55/ 3 57/ 3/ 63", "70/ 45 50 59 55"][i]}" class="mono"></label>`; }).join("")}</div>`;
    if (sec.f) h += `<div class="ogrid">${sec.f.map(([p, l]) => oppField(D, p, l)).join("")}</div>`;
    if (sec.grid) { const g = sec.grid; h += `<div class="otable"><table><thead><tr><th></th>${g.colL.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>${g.rows.map(([rk, rl]) => `<tr><th>${rl}</th>${g.cols.map(c => { const p = `${g.base}.${rk}.${c}`, fl = (D.flags || []).find(f => f.field === p), v = oget(D, p); return `<td><input type="text" id="${oppId(p)}" data-p="${p}" aria-label="${rl} ${c}" value="${esc(v == null ? "" : typeof v === "object" ? oppFmtCell(v) : v)}" class="${fl ? "flag" : ""}"></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`; }
    if (sec.f2) h += `<div class="ogrid">${sec.f2.map(([p, l]) => oppField(D, p, l)).join("")}</div>`;
    h += `</details>`;
  });
  h += `<label for="oppNotes" style="font-weight:600;font-size:14px;display:block;margin-top:10px">Note live (facoltative): mani viste al tavolo</label><textarea id="oppNotes" placeholder="es. chiama c/r con 88 su 755, chiama pot turn, checka back river sull'asso">${esc(D.notes || "")}</textarea>
  <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn primary" id="oppCheck">Controlla e analizza</button></div></section><div id="oppVal"></div>`;
  $("#view").innerHTML = h;
  const sync = () => { document.querySelectorAll("[data-p]").forEach(i => { const v = i.value.trim(); oset(D, i.dataset.p, v === "" ? null : v); }); document.querySelectorAll("[data-row]").forEach(i => D.rows[+i.dataset.row] = i.value.trim()); D.notes = $("#oppNotes").value; };
  document.querySelectorAll("[data-p],[data-row]").forEach(i => i.addEventListener("change", () => { const p = i.dataset.p || "row" + (+i.dataset.row + 1); D.flags = (D.flags || []).filter(f => f.field !== p); i.classList.remove("flag"); i.closest(".of")?.classList.remove("flag"); }));
  $("#oppBack").onclick = () => { oppView = { mode: "list" }; renderOpp(); };
  $("#oppCheck").onclick = () => { sync(); oppCheck(); };
  $("#oppJsonB").onclick = () => { sync(); const r = oppImportJSON($("#oppJson").value, D); if (r.ok) { renderOppEdit(); $("#oppJsonMsg") && ($("#oppJsonMsg").textContent = ""); const lg = $("#oppReadLog"); if (lg) lg.textContent = `Importati ${r.n} valori. Controlla il modulo e premi Controlla e analizza.`; } else $("#oppJsonMsg").textContent = r.msg; };
  // lettura immagini
  const fi = $("#oppFiles");
  (async () => {
    const m = $("#oppReadMsg"); if (!m) return;
    const alt = " In alternativa mandami gli screenshot nella chat di Cowork: li leggo io e ti restituisco il codice da incollare in Importa dati qui sotto.";
    const off = t => { const mm = $("#oppReadMsg"); if (mm) { mm.innerHTML = `<b>Lettura automatica non disponibile.</b> ${t}${alt}`; mm.classList.add("owarn"); } fi.disabled = true; };
    if (!(HOST() && typeof HOST().use === "function")) return off("La pagina è aperta fuori dal visualizzatore di Claude, quindi non può chiedere niente a Claude e salva i dati solo in questo browser. Aprila su claude.ai nel browser (galleria claude.ai/code/artifacts) e riprova.");
    m.textContent = "Collegamento con Claude in corso (fino a 10 secondi)...";
    const smp = sample || (SAMPLE_P ? await SAMPLE_P : null);
    if (!$("#oppReadMsg")) return;
    if (!smp) return off("Questa vista non concede Claude alla pagina (capacità non servita o non autorizzata qui: succede in alcune finestre dell'app). Aprila su claude.ai nel browser (galleria claude.ai/code/artifacts) e, se compare la richiesta di permesso, consenti.");
    sample = smp;
    const lim = await smp.limits().catch(() => null);
    if (!$("#oppReadMsg")) return;
    if (!lim || !lim.images) return off("Claude è collegato, ma questa vista non può inviargli immagini.");
    const m2 = $("#oppReadMsg");
    m2.textContent = `Pronto. Fino a ${lim.images.maxCount} immagini per chiamata, ogni immagine costa 2 letture di Claude.`;
    fi.onchange = () => { $("#oppRead").disabled = !fi.files.length; };
    $("#oppRead").onclick = () => { sync(); oppReadImages([...fi.files]); };
  })();
}
/* ---------- import JSON (schema sezione 5 o formato del modulo) ---------- */
function oppImportJSON(txt, D) {
  let J; try { J = JSON.parse(String(txt).trim().replace(/^```(?:json)?|```$/g, "")); } catch (e) { return { ok: false, msg: "Il testo non è un JSON valido." }; }
  const cellS = c => c == null ? null : typeof c === "object" && "value" in c ? (c.value == null ? null : `${c.value}${c.tot != null ? ` (${c.n}/${c.tot})` : ""}`) : typeof c === "object" ? null : String(c);
  let n = 0;
  const put = (path, v) => { const x = cellS(v); if (x != null && x !== "") { oset(D, path, x); n++; } };
  const walk = (obj, base) => Object.entries(obj || {}).forEach(([k, v]) => { if (v && typeof v === "object" && !("value" in v) && !Array.isArray(v)) walk(v, base + "." + k); else if (!Array.isArray(v)) put(base + "." + k, v); });
  if (J.rows || J.cbet || J.aggr || J.tb) { // formato del modulo
    if (J.name) D.name = J.name; if (Array.isArray(J.rows)) J.rows.forEach((r, i) => { if (i < 6 && r) { D.rows[i] = String(r); n++; } });
    ["header", "cbet", "aggr", "tb"].forEach(k => walk(J[k], k)); if (J.notes) D.notes = J.notes;
    return { ok: n > 0, n, msg: "Nessun valore trovato." };
  }
  const P = J.player || {}, H = J.header || {}, U = J.hud || {}, C = J.cbet_popup || {}, A = J.aggression_popup || {}, B = J.threebet_popup || {};
  if (P.name) D.name = P.name;
  if (P.hands != null) put("header.hands", P.hands);
  ["bb100", "winrate_ev", "net_won", "wtsd", "wsd", "wsd_river_bet"].forEach(k => put("header." + k, H[k]));
  if (Array.isArray(U.raw_rows)) U.raw_rows.forEach((r, i) => { if (i < 6 && r) { D.rows[i] = String(r); n++; } });
  if (C.wtsd != null) put("cbet.wtsd", C.wtsd);
  ["cb_general", "fold_cb", "grid", "check_fold"].forEach(k => walk(C[k], "cbet." + k));
  ["cb_vs_2", "cb_vs_3plus", "cb_vs_hero", "river_bet_srp", "riverbet_pct", "fold_river_bet"].forEach(k => put("cbet." + k, C[k]));
  walk(C.bet_vs_missed_cbet || C.bet_vs_missed, "cbet.bet_vs_missed");
  const T = C.threebet_pot || {};
  walk(T.cbet, "cbet.threebet_pot.cbet"); walk(T.fold_to_cbet, "cbet.threebet_pot.fold_to_cbet");
  if (T.raise_cbet_row) put("cbet.threebet_pot.raise_cbet_3betpot", T.raise_cbet_row.col_3betpot);
  if (T.fold_vs_raise_cb_row) { put("cbet.threebet_pot.fold_vs_raise_3betpot", T.fold_vs_raise_cb_row.col_3betpot); put("cbet.fold_vs_raise_cb", T.fold_vs_raise_cb_row.col1); }
  walk(A.af, "aggr.af"); walk(A.agg_freq, "aggr.agg_freq"); walk(A.check_raise, "aggr.check_raise"); if (A.agg_3betpot != null) put("aggr.agg_3betpot", A.agg_3betpot);
  walk(B.threebet_by_pos || B.by_pos, "tb.by_pos"); walk(B.threebet_vs_open_from || B.vs_open_from, "tb.vs_open_from"); walk(B.squeeze, "tb.squeeze"); walk(B.vs_4bet, "tb.vs_4bet");
  (B.detail || []).forEach(d => { const k = `${d.his_pos}_${d.vs}`; if (["bb_btn", "bb_sb", "btn_co", "sb_btn"].includes(k)) { put(`tb.det.${k}.all`, d.all); put(`tb.det.${k}.vs_hero`, d.vs_hero); } });
  if (Array.isArray(J.user_notes) && J.user_notes.length) D.notes = J.user_notes.join("\n");
  if (Array.isArray(J.extraction_flags)) J.extraction_flags.forEach(f => { const p = String(f.field || "").replace(/^hud\.r(\d)\..*/, "row$1").replace(/^cbet_popup\./, "cbet.").replace(/^aggression_popup\./, "aggr.").replace(/^threebet_popup\./, "tb."); D.flags = D.flags || []; D.flags.push({ field: p, reason: f.reason || "da ricontrollare" }); });
  return { ok: n > 0, n, msg: "Nessun valore trovato: controlla lo schema." };
}
/* ---------- lettura con Claude (estrazione a doppia passata) ---------- */
const OPP_XPROMPT = `Sei un estrattore di dati da screenshot di HoldemManager 3 (poker). Leggi SOLO i numeri visibili, non interpretare. Ignora i colori. "-" = dato assente: scrivi null. Non inventare mai valori: se una cella non si legge scrivi null.
Formato di ogni cella con sample: una stringa "P (n/tot)" esattamente come appare, es. "39 (23/59)" (39 è la percentuale, 59 il totale, 23 i casi). Se il sample non è visibile: solo "P".
Classifica l'immagine in uno di questi tipi e restituisci SOLO JSON {"type": ..., "data": {...}}:
1. "hud": HUD principale, sfondo scuro, 6 righe di numeri. data = {"rows": ["riga 1 esattamente come appare, con gli / e gli spazi", ..., "riga 6"]}. Copia ogni numero della riga, compresi gli 0 e i "-". Non unire e non separare numeri.
2. "header": header del profilo. data = {"name": nome completo, "hands": n, "bb100": n, "net_won": n, "winrate_ev": n (Winrate EV bb/100), "wtsd": "P (n/tot)", "wsd": "P (n/tot)" (W$SD%), "wsd_river_bet": "P (n/tot)" (W$SD% B River)}.
3. "cbet": pop-up CBET. data = {"wtsd": n, "cb_general": {"flop","turn","river"}, "fold_cb": {"flop","turn","river"}, "cb_vs_2", "cb_vs_3plus", "grid": {"cbet"|"fold_to_cbet"|"raise_cbet"|"cb_fold": {"flop_ip","turn_ip","river_ip","flop_oop","turn_oop","river_oop"}}, "threebet_pot": {"cbet": {"flop","turn","river"}, "fold_to_cbet": {"flop","turn","river"}, "raise_cbet_3betpot", "fold_vs_raise_3betpot"}, "fold_vs_raise_cb" (prima colonna), "bet_vs_missed": {"flop","turn_ip","turn_oop","river_ip","river_oop"}, "check_fold": {"flop","turn","river"}, "cb_vs_hero", "river_bet_srp", "riverbet_pct", "fold_river_bet"}. Ignora "CB Flop posizioni".
4. "aggression": pop-up Aggression. data = {"name_short": nome abbreviato, "af": {"total","flop","turn","river"} (numeri), "agg_freq": {"total","flop","turn","river"} (numeri), "check_raise": {"total","flop","turn","river"} ("P (n/tot)"), "agg_3betpot": n}.
5. "threebet": pop-up 3Bet. data = {"by_pos": {"total","ep","mp","co","btn","sb","bb"}, "vs_open_from": {"ep","mp","co","btn","sb"}, "squeeze": {"total","co","btn","sb","bb"}, "vs_4bet": {"total_fold","co","btn","sb"}, "det": {"bb_btn": {"all","vs_hero"}, "bb_sb": {"all","vs_hero"}, "btn_co": {"all","vs_hero"}, "sb_btn": {"all","vs_hero"}}} (det dalle righe "3b [sua pos] vs [opener]" e accanto "vs [pos] hero").
6. "other": altro.
Campi che non vedi: ometti o null.`;
function oppPrepImage(file, boost) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const px = img.width * img.height, target = 1.15e6, sc = boost ? Math.max(1, Math.min(4, Math.sqrt(target / px))) : 1;
      if (!boost) { URL.revokeObjectURL(url); return res(file); }
      const c = document.createElement("canvas"); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      const x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.filter = "grayscale(1) contrast(1.6)"; x.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error("canvas")), "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("immagine")); };
    img.src = url;
  });
}
function oppFlatten(o, pre, out) { Object.entries(o || {}).forEach(([k, v]) => { const p = pre ? pre + "." + k : k; if (v && typeof v === "object" && !Array.isArray(v)) oppFlatten(v, p, out); else out[p] = v; }); return out; }
const oppNorm = v => v == null ? "" : String(v).replace(/\s+/g, " ").replace(/\s*\/\s*/g, "/").replace(/\(\s*/g, "(").replace(/\s*\)/g, ")").trim();
async function oppReadImages(files) {
  const D = oppView.D, log = $("#oppReadLog"), btn = $("#oppRead");
  btn.disabled = true; log.innerHTML = "";
  const TMAP = { hud: null, header: "header", cbet: "cbet", aggression: "aggr", threebet: "tb" };
  const line = t => { const p = document.createElement("div"); p.textContent = t; log.appendChild(p); return p; };
  for (const f of files) {
    const p = line(`${f.name}: lettura 1 di 2...`);
    try {
      const a = await sample.json(OPP_XPROMPT, { images: f, modelTier: "default" });
      p.textContent = `${f.name}: lettura 2 di 2 (ingrandita)...`;
      const b = await sample.json(OPP_XPROMPT, { images: await oppPrepImage(f, true), modelTier: "default" });
      const type = a && a.type;
      if (!type || type === "other") { p.textContent = `${f.name}: non riconosciuto come HUD o pop-up HM3.`; continue; }
      if (b && b.type && b.type !== type) line(`${f.name}: le due letture non concordano sul tipo (${type} / ${b.type}), uso la prima.`);
      const fa = oppFlatten(a.data, "", {}), fb = oppFlatten(b && b.type === type ? b.data : {}, "", {});
      let diff = 0;
      if (type === "hud") {
        const ra = (a.data && a.data.rows) || [], rb = (b && b.data && b.data.rows) || [];
        ra.forEach((r, i) => { if (i > 5) return; D.rows[i] = String(r || ""); if (oppNorm(r) !== oppNorm(rb[i])) { diff++; D.flags = (D.flags || []).filter(x => x.field !== "row" + (i + 1)); D.flags.push({ field: "row" + (i + 1), reason: `doppia lettura discordante: "${r}" / "${rb[i] || "?"}"` }); } });
      } else {
        const base = TMAP[type];
        Object.entries(fa).forEach(([k, v]) => {
          if (type === "aggression" && k === "name_short") return;
          if (type === "header" && k === "name") { if (v) D.name = String(v); return; }
          const path = base + "." + k;
          oset(D, path, v == null ? null : String(v));
          if (k in fb && oppNorm(fb[k]) !== oppNorm(v)) { diff++; D.flags = (D.flags || []).filter(x => x.field !== path); D.flags.push({ field: path, reason: `doppia lettura discordante: ${v} / ${fb[k]}` }); }
        });
      }
      p.textContent = `${f.name}: ${({ hud: "HUD principale", header: "header profilo", cbet: "pop-up CBET", aggression: "pop-up Aggression", threebet: "pop-up 3Bet" })[type]} letto${diff ? `, ${diff} valori da confermare (in giallo)` : ", le due letture coincidono"}.`;
    } catch (e) {
      p.textContent = `${f.name}: ${e && e.code === "not_granted" ? "lettura non autorizzata" : e && e.code === "rate_limited" ? "troppe richieste, riprova tra qualche minuto" : e && e.code === "image_rejected" ? "immagine non accettata" : "lettura non riuscita"}.`;
      if (e && (e.code === "not_granted" || e.code === "rate_limited")) break;
    }
  }
  const keep = log.innerHTML;
  renderOppEdit();
  $("#oppReadLog").innerHTML = keep;
}
/* ---------- validazione e analisi ---------- */
function oppCheck() {
  const D = oppView.D, X = oppPrep(D);
  const V = oppValidate(X);
  const errs = V.issues.filter(i => i.lvl === "err"), dbt = V.issues.filter(i => i.lvl === "doubt");
  document.querySelectorAll(".of.bad, input.bad").forEach(e => e.classList.remove("bad"));
  V.issues.forEach(i => { const id = /^row\d/.test(i.f) ? "of-row" + (+i.f.slice(3) - 1) : oppId(i.f); const el = document.getElementById(id); if (el) { el.classList.add("bad"); el.closest(".of")?.classList.add("bad"); const d = el.closest("details"); if (d) d.open = true; } });
  let h = `<section class="panel" style="margin-top:14px"><div class="eyebrow">3 · Controllo della lettura</div>`;
  if (errs.length) {
    h += `<p style="margin:6px 0"><b>Mi fermo: questi valori vanno corretti prima dell'analisi.</b></p><ul class="oiss err">${errs.map(i => `<li>${esc(i.msg)}</li>`).join("")}</ul>`;
    if (dbt.length) h += `<p style="margin:10px 0 4px"><b>Da ricontrollare anche:</b></p><ul class="oiss">${dbt.map(i => `<li>${esc(i.msg)}</li>`).join("")}</ul>`;
    $("#oppVal").innerHTML = h + `</section>`; $("#oppVal").scrollIntoView({ behavior: "smooth" }); return;
  }
  if (dbt.length) {
    h += `<p style="margin:6px 0">Ho dei dubbi su questi valori. Correggili nel modulo o conferma che sono giusti.</p><div class="oiss">${dbt.map((i, k) => `<label class="odbt"><input type="checkbox" data-dbt="${k}"> ${esc(i.msg)}</label>`).join("")}</div><button class="btn primary" id="oppGo" disabled style="margin-top:10px">Confermo, analizza</button>`;
    $("#oppVal").innerHTML = h + `</section>`;
    const boxes = [...document.querySelectorAll("[data-dbt]")];
    boxes.forEach(b => b.onchange = () => { $("#oppGo").disabled = !boxes.every(x => x.checked); });
    $("#oppGo").onclick = () => oppDo(dbt.map(d => d.msg));
    $("#oppVal").scrollIntoView({ behavior: "smooth" });
    return;
  }
  oppDo([]);
}
function oppDo(confirmed) {
  const D = oppView.D, id = oppSlug(D.name);
  const A = oppRun(oppPrep(D), OPPK, 0);
  const prev = OPPS[id];
  OPPS[id] = { name: String(D.name).trim(), D: JSON.parse(JSON.stringify(D)), out: A.out, confirmed, date: today(), userVote: prev ? prev.userVote : null, llm: null };
  oppPersist(id);
  oppView = { mode: "show", id };
  renderOpp(); window.scrollTo({ top: 0 });
}
/* ---------- scheda avversario ---------- */
const mdb = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
function oppNoteFromLLM(o, A) {
  const L = o.llm, S = A.S, g = k => S[k] ? fmtN(S[k].value) : "n/d";
  let t = `**${o.name} | ${L.label || A.note.label} | ${g("vpip")}/${g("pfr")} | ${A.out.hands} mani | WTSD ${g("wtsd")} / W$SD ${g("wsd")} / W$SD river ${g("wsd_river")} / Aggr Freq ${g("aggr")}%**\n\n`;
  (L.punti || []).slice(0, 10).forEach((p, i) => { t += `**${i + 1}. ${p.titolo}**: ${p.testo}\n`; });
  if ((L.no || []).length) t += `\n**NO:** ${L.no.join(", ")}\n`;
  t += `\n**Concetto chiave:** ${L.concetto || A.note.concept}`;
  return t;
}
function renderOppShow() {
  const id = oppView.id, o = OPPS[id];
  if (!o) { oppView = { mode: "list" }; return renderOpp(); }
  const A = oppRun(oppPrep(o.D), OPPK, o.llm ? o.llm.revisione : 0), out = A.out;
  const detNote = oppNoteText(o.name, oppPrep(o.D), A.V, A.S, A.note);
  const noteTxt = o.llm ? oppNoteFromLLM(o, A) : detNote;
  const L = o.llm;
  let h = `<div class="rbar" style="margin-bottom:12px"><div class="where"><b>${esc(o.name)}</b> · analisi del ${esc(o.date || "")}</div><div style="display:flex;gap:8px"><button class="btn ghost" id="oppEditB">Modifica i valori</button><button class="btn ghost" id="oppBack">Lista</button></div></div>`;
  h += `<section class="opp-head"><div class="opp-big ${out.vote >= 7 ? "good" : out.vote >= 4.5 ? "mid" : "bad"}">${fmtN(out.vote)}<span>/10</span></div><div><div class="eyebrow">VOTO: ${fmtN(out.vote)}/10 | ${esc(out.band)} | confidenza ${esc(out.conf)} (${out.hands} mani)</div><p style="margin:6px 0 0">${esc(L && L.riga_sintesi ? L.riga_sintesi : out.line)}</p></div></section>`;
  h += `<section class="panel" style="margin-top:14px"><div class="rbar" style="margin:0 0 8px"><div class="eyebrow">Nota HM3${L ? " · rifinita da Claude" : " · motore regole"}</div><button class="btn" id="oppCopy">Copia la nota</button></div><div class="onote">${mdb(noteTxt)}</div>
  ${sample ? `<div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn ${L ? "" : "primary"}" id="oppLLM">${L ? "Rifinisci di nuovo con Claude" : "Rifinisci con Claude (correlazioni, note live, revisione ±1)"}</button><span class="muted" style="font-size:13px">Usa il tuo utilizzo di Claude.</span></div><div id="oppLLMout"></div>` : `<p class="muted" style="font-size:13px;margin:10px 0 0">La rifinitura con Claude non è disponibile in questa vista: nota e voto vengono dal motore regole.</p>`}</section>`;
  // dettaglio
  const dimL = p => p <= 3 ? "solido" : p <= 10 ? "leak presenti" : "bucato";
  h += `<details class="panel osec" style="margin-top:14px"><summary>Dettaglio dell'analisi</summary>
  <h4 class="hsub">Catena</h4><ol class="ochain">${A.note.chain.map(c => `<li>${esc(c)}</li>`).join("")}</ol>
  ${L && L.catena ? `<p class="muted" style="font-size:13.5px;margin:0 0 6px">Claude: ${esc(L.catena)}</p>` : ""}
  <h4 class="hsub">Pattern incrociati</h4>${A.note.patterns.length || (L && L.pattern && L.pattern.length) ? `<ul>${A.note.patterns.map(p => `<li>${esc(p)}</li>`).join("")}${L && L.pattern ? L.pattern.map(p => `<li>${esc(p)}</li>`).join("") : ""}</ul>` : `<p class="muted">Nessun pattern con sample sufficiente.</p>`}
  <h4 class="hsub">Viste e scartate</h4>${A.note.discarded.length ? `<ul>${A.note.discarded.map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : `<p class="muted">Nessuna.</p>`}
  ${o.D.notes ? `<h4 class="hsub">Note live</h4><p style="font-size:14px">${esc(o.D.notes)}</p>${L && L.note_live ? `<p style="font-size:14px"><b>Lettura:</b> ${esc(L.note_live)}</p>` : `<p class="muted" style="font-size:13px">Le note live le legge solo la rifinitura con Claude.</p>`}` : ""}
  <h4 class="hsub">Breakdown del voto</h4><div class="otable"><table><thead><tr><th>Dimensione</th><th>Penalità</th><th>Giudizio</th></tr></thead><tbody>${Object.entries(OPP_DIM).map(([k, l]) => `<tr><th>${l}</th><td class="mono">${fmtN(out.dimP[k])}</td><td>${dimL(out.dimP[k])}</td></tr>`).join("")}</tbody></table></div>
  <p style="font-size:14px;margin:8px 0">Penalità totale <b class="mono">${fmtN(out.P)}</b> → voto tecnico 10 − ${String(OPPK).replace(".", ",")} × ${fmtN(out.P)} = <b class="mono">${fmtN(out.tech)}</b>. Winrate EV: <b>${out.wadj >= 0 ? "+" : ""}${fmtN(out.wadj)}</b>. Revisione: <b>${out.rev >= 0 ? "+" : ""}${fmtN(out.rev)}</b>${L && L.motivo ? ` (${esc(L.motivo)})` : ""}. ${out.caps.length ? `Cap: ${esc(out.caps.join("; "))}.` : "Nessun cap."} Arrotondato a 0,5.</p>
  <h4 class="hsub">Statistiche usate nel voto</h4><div class="otable"><table><thead><tr><th>Stat</th><th>Valore</th><th>Sano</th><th>Liv.</th><th>Conf.</th><th>Pen.</th></tr></thead><tbody>${A.sc.rows.map(r => `<tr class="${r.lvl >= 2 ? "hi" : ""}"><th>${esc(r.lab)}</th><td class="mono">${fmtN(r.v)}${r.tot ? ` <span class="muted">(${r.n != null ? r.n + "/" : "~"}${r.tot})</span>` : r.nodenom ? ` <span class="muted">(no pop-up)</span>` : ""}</td><td class="mono">${r.lo}-${r.hi}</td><td class="mono">${r.lvl}${r.side ? (r.side === "alto" ? "↑" : "↓") : ""}</td><td class="mono">${fmtN(r.conf)}</td><td class="mono">${fmtN(Math.round(r.pen * 10) / 10)}</td></tr>`).join("")}</tbody></table></div>
  <h4 class="hsub">Verifiche di lettura</h4>${o.confirmed && o.confirmed.length ? `<ul>${o.confirmed.map(c => `<li>Confermato da te: ${esc(c)}</li>`).join("")}</ul>` : `<p class="muted">Nessun dubbio aperto.</p>`}
  </details>`;
  h += `<section class="panel" style="margin-top:14px"><div class="eyebrow">Il tuo voto</div><p style="margin:4px 0 8px;font-size:14px">Se lo conosci bene, dai il tuo voto: serve a ricalibrare il tool.</p><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input type="number" id="oppUV" min="1" max="10" step="0.5" value="${o.userVote ?? ""}" style="width:110px"><button class="btn" id="oppUVs">Salva il mio voto</button><button class="btn ghost" id="oppDel" style="margin-left:auto">Elimina avversario</button><span id="oppDelC"></span></div></section>`;
  $("#view").innerHTML = h;
  $("#oppBack").onclick = () => { oppView = { mode: "list" }; renderOpp(); };
  $("#oppEditB").onclick = () => { oppView = { mode: "edit", D: JSON.parse(JSON.stringify(o.D)) }; renderOpp(); };
  $("#oppCopy").onclick = async () => { const plain = noteTxt.replace(/\*\*/g, ""); try { await navigator.clipboard.writeText(plain); $("#oppCopy").textContent = "Copiata"; } catch (e) { const ta = document.createElement("textarea"); ta.value = plain; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); $("#oppCopy").textContent = "Copiata"; } catch (e2) { $("#oppCopy").textContent = "Copia non riuscita"; } ta.remove(); } };
  $("#oppUVs").onclick = () => { const v = parseFloat($("#oppUV").value); if (!(v >= 1 && v <= 10)) return; o.userVote = v; oppPersist(id); $("#oppUVs").textContent = "Salvato"; };
  $("#oppDel").onclick = () => { $("#oppDelC").innerHTML = `<button class="btn" id="oppDelY" style="padding:4px 10px;font-size:13px">Sì, elimina</button>`; $("#oppDelY").onclick = () => { delete OPPS[id]; oppSaveLocal(); if (db) db.doc("opponents/" + id).delete().catch(() => {}); oppView = { mode: "list" }; renderOpp(); }; };
  if ($("#oppLLM")) $("#oppLLM").onclick = () => oppRefine(id, A, detNote);
}
const OPP_RULES = `Sei un analista di cash game NL25 6-max 100bb, esperto di GTO ed exploit. Ricevi un JSON validato con le statistiche HM3 di un avversario, l'output del motore regole (livelli, confidenze, voto tecnico, nota deterministica) e le eventuali note dell'utente.
Regole inderogabili:
- Segui la catena VPIP/PFR -> WTSD -> W$SD -> W$SD river prima di qualsiasi conclusione. WTSD alto non vuol dire calling station senza guardare W$SD.
- W$SD B River = quanto vince LUI quando betta il river e va allo showdown (qualità del suo range di attacco al river), NON quando paga il river. <40 bluffoso (hero call più largo), >55 value (folda i marginali). Sample <20 inutilizzabile, 20-30 solo direzione.
- Agg Freq% è la metrica di aggressione; AF solo come supporto, mai in nota.
- Fold to CBet = lui folda al TUO cbet. Raise CBet = lui raisa il TUO cbet. Cb-fold = lui cbetta e folda al TUO raise. Fold BvB non è fold to steal generico. Da SB fold 55-70% è normale. In nota fold BvB <45 e fold BB vs BTN <55 non si scrivono. Cbet multiway 35-50% è corretto.
- Nessuna stat con sample <20 in nota. Sample 20-29 solo se deviazione marcata e coerente, con sample indicato. Fold vs CB turn/river solo con denominatore del pop-up.
- Confronta sempre stat vs hero e stat generiche dello stesso spot (overfold generico ma non vs hero = ti ha letto: gioca standard).
- Cerca sempre almeno una combo offensiva (es. probe turn alto + fold vs c/r basso = skip cbet con mani forti e c/r turn value; check-fold river alto + c/r river 0% = bluff river su ogni check; riverbet alto + W$SD river basso = hero call; CB flop alto e turn basso = float IP).
- Stat nella norma escluse. Sintetizza i pattern ripetuti in un solo punto (check-fold su più street = CHECK = RESA; overfold su 3bet/squeeze/steal = PREFLOP DEBOLE).
- Fish (VPIP>35, gap>10, limp alto): iso 5-6x IP 6-8x OOP value largo; 3bet vs fish che chiama le 3bet value LARGO (66+, A9s+, KTs+, QTs+, JTs, AJo+, KQo) 3.5-4x zero bluff; value bet 75%+ flop e turn; niente bluff senza equity.
- Giocatore bilanciato: dillo e non forzare exploit.
- Note live: se confermano l'HUD scrivi "confermato live"; una mano singola non è mai una regola; tell di sizing servono 4-5 osservazioni.
- Adattamenti concreti, mai vaghi (NO "sfrutta il suo overfold", SI "open qualsiasi mano da BTN quando è BB"). Ordina per EV: ampiezza deviazione, frequenza dello spot (BB vs BTN, check-fold flop, fold vs CB flop frequentissimi), facilità.
- Voto: parti dal voto del motore; puoi spostarlo di massimo ±1 (passi da 0.5) solo per: adattamento evidente contro l'hero (+0.5), deviazioni aggressive coerenti con winrate positivo su sample alto (+0.5), note live con errori grossolani (-0.5/-1), contraddizioni gravi nella catena SD (-0.5), profilo loose-passivo non catturato dalla formula (-0.5). Altrimenti 0.
- Italiano, sintetico, MAI il trattino lungo: usa due punti, virgole o punti. Massimo 10 punti, di norma 5-7. Includi il sample tra parentesi quando non è alto.`;
async function oppRefine(id, A, detNote) {
  const o = OPPS[id], btn = $("#oppLLM"), outEl = $("#oppLLMout");
  btn.disabled = true; outEl.innerHTML = `<p class="muted" style="font-size:13.5px">Claude sta ragionando sui dati (anche un minuto)...</p>`;
  const X = oppPrep(o.D);
  const engine = { voto_motore_senza_revisione: oppFinal(A.sc, A.S, A.V, 0).vote, voto_tecnico: A.out.tech, penalita: A.out.P, aggiustamento_winrate: A.out.wadj, cap_possibili: "VPIP>=50 o limp>=20: max 2; VPIP>=35 o gap>=12 o limp>=10: max 3.5; WTSD>=33 e W$SD<=46 con 100+ SD: max 3.5; >8.5 solo con 5000+ mani",
    stat: A.sc.rows.map(r => ({ stat: r.lab, valore: r.v, sample: r.tot ? `${r.n ?? "~"}/${r.tot}` : null, range_sano: `${r.lo}-${r.hi}`, livello: r.lvl, lato: r.side, confidenza: r.conf })), nota_motore: detNote, scartate: A.note.discarded, pattern: A.note.patterns };
  const prompt = `${OPP_RULES}\n\nDATI (JSON validato, celle "P (n/tot)"):\n${JSON.stringify({ name: X.name, rows: X.rows, header: X.header, cbet: X.cbet, aggr: X.aggr, tb: X.tb }).slice(0, 18000)}\n\nMOTORE REGOLE:\n${JSON.stringify(engine).slice(0, 16000)}\n\nNOTE LIVE DELL'UTENTE: ${o.D.notes ? JSON.stringify(o.D.notes) : "nessuna"}\n\nMigliora la nota del motore: correggi punti deboli, aggiungi correlazioni e combo offensive supportate dai dati, usa le note live. Rispondi SOLO con JSON:
{"revisione": numero tra -1 e 1 a passi di 0.5, "motivo": "motivo della revisione o 'nessuna'", "label": "LABEL SPECIFICA IN MAIUSCOLO", "riga_sintesi": "una riga: punti forti e punti deboli principali", "punti": [{"titolo": "TITOLO LEAK IN MAIUSCOLO", "testo": "stat + sample se non alto: adattamento concreto"}], "no": ["trappola con la sua stat"], "concetto": "una o due frasi operative", "catena": "la catena in 1-2 frasi", "pattern": ["correlazioni che giustificano i punti"], "note_live": "come le note live confermano o contraddicono l'HUD, o 'nessuna nota'"}`;
  try {
    const r = await sample.json(prompt, { modelTier: "complex" });
    const clean = x => typeof x === "string" ? x.replace(/\s*—\s*/g, ": ").replace(/–/g, "-") : Array.isArray(x) ? x.map(clean) : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, clean(v)])) : x;
    const L = clean(r || {});
    let rev = Math.round(Math.max(-1, Math.min(1, +L.revisione || 0)) * 2) / 2;
    if (!Array.isArray(L.punti) || !L.punti.length) throw { code: "invalid_json" };
    L.revisione = rev;
    o.llm = L; o.out = oppRun(X, OPPK, rev).out; oppPersist(id);
    renderOppShow();
  } catch (e) {
    btn.disabled = false;
    outEl.innerHTML = `<p class="muted" style="font-size:13.5px">${e && e.code === "not_granted" ? "Rifinitura non autorizzata." : e && e.code === "rate_limited" ? "Troppe richieste: riprova tra qualche minuto." : "Rifinitura non riuscita, riprova."}</p>`;
  }
}

