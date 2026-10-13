/* ================= BACKUP: ESPORTA E IMPORTA TUTTO ================= */
function bkB64(u8) { let s = ""; const C = 0x8000; for (let i = 0; i < u8.length; i += C) s += String.fromCharCode.apply(null, u8.subarray(i, i + C)); return btoa(s); }
function bkUnB64(str) { const s = atob(str), u8 = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i); return u8; }
/* formato del file: app "orca-gto", schema numerato; si leggono anche i backup della versione precedente ("targetlab" v1) */
const BK_APP = "orca-gto", BK_SCHEMA = 2, BK_REP = "orca-rep-";
async function bkBuild(withSol) {
  const reps = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(BK_REP)) reps[k] = localStorage.getItem(k); } } catch (e) {}
  const out = { app: BK_APP, schema: BK_SCHEMA, date: new Date().toISOString(), S, MS: (() => { const X = { ...MS }; delete X.editId; delete X.delId; delete X.newId; return X; })(), HANDS, POOL, OPP: { opps: OPPS, k: OPPK }, reps, sols: [] };
  if (withSol) {
    const metas = (await gwDbReq("meta", "readonly", st => st.getAll())) || [];
    for (const m of metas) { const rec = await gwDbReq("sol", "readonly", st => st.get(m.key)); if (rec && rec.buf) out.sols.push({ meta: m, sol: { key: rec.key, meta: rec.meta, buf: bkB64(new Uint8Array(rec.buf)) } }); }
  }
  return JSON.stringify(out);
}
/* controlla tutto il file PRIMA di toccare i dati: o si ripristina tutto quello che è valido, o niente */
const bkObj = v => !!v && typeof v === "object" && !Array.isArray(v);
function bkCheck(x) {
  if (!bkObj(x)) return { err: "Il file non è un backup di Orca School Poker." };
  const legacy = x.app === "targetlab";
  if (x.app !== BK_APP && !legacy) return { err: "Il file non è un backup di Orca School Poker." };
  const ver = legacy ? 1 : Number(x.schema);
  if (!Number.isInteger(ver) || ver < 1) return { err: "Il backup è danneggiato (versione mancante)." };
  if (ver > BK_SCHEMA) return { err: "Questo backup viene da una versione più recente di Orca School Poker: aggiorna la pagina e riprova." };
  if (!bkObj(x.S) || (x.S.history != null && !Array.isArray(x.S.history))) return { err: "Il backup è danneggiato: mancano i progressi." };
  const skip = [], p = { S: normalize(x.S) };
  if (x.MS != null) { if (bkObj(x.MS) && (x.MS.sessions == null || Array.isArray(x.MS.sessions))) p.MS = x.MS; else skip.push("Diario"); }
  if (x.HANDS != null) { if (bkObj(x.HANDS) && Array.isArray(x.HANDS.hands)) p.HANDS = { hands: x.HANDS.hands.filter(bkObj) }; else skip.push("Mani"); }
  if (x.POOL != null) { if (bkObj(x.POOL) && x.POOL.f) p.POOL = x.POOL; else skip.push("pool"); }
  if (x.OPP != null) { if (bkObj(x.OPP) && bkObj(x.OPP.opps)) p.OPP = x.OPP; else skip.push("Avversari"); }
  if (x.reps != null) {
    p.reps = {}; if (!bkObj(x.reps)) skip.push("report");
    else Object.entries(x.reps).forEach(([k, v]) => { const nk = k.startsWith("targetlab-rep-") ? BK_REP + k.slice(14) : k; if (!nk.startsWith(BK_REP) || typeof v !== "string") return; try { if (bkObj(JSON.parse(v))) p.reps[nk] = v; } catch (e) {} });
  }
  p.sols = Array.isArray(x.sols) ? x.sols.filter(s => bkObj(s) && bkObj(s.meta) && bkObj(s.sol) && typeof s.sol.key === "string" && typeof s.sol.buf === "string") : [];
  const d = new Date(x.date); p.date = isNaN(d) ? null : d;
  return { p, skip };
}
async function bkExport(withSol, msg) {
  msg("Preparo il file...");
  let txt; try { txt = await bkBuild(withSol); } catch (e) { msg("Non riesco a preparare il backup: " + e.message); return; }
  const name = `orca-gto-backup-${today()}.json`, mb = txt.length < 1e6 ? Math.max(1, Math.round(txt.length / 1e3)) + " KB" : (txt.length / 1e6).toFixed(1) + " MB";
  const dl = await hostUse("downloads").catch(() => null);
  if (dl) {
    try { await dl.save({ filename: name, data: new Blob([txt], { type: "application/json" }) }); msg(`Backup salvato (${mb}): ${name}.`); return; }
    catch (e) { if (e && e.code === "declined") { msg("Salvataggio annullato."); return; } if (e && e.code === "rate_limited") { msg("C'è già una richiesta di salvataggio aperta: riprova tra poco."); return; } }
  }
  try { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "application/json" })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); msg(`Backup pronto (${mb}): se il download non parte, questa vista non permette di salvare file.`); }
  catch (e) { msg("In questa vista non posso salvare file."); }
}
async function bkImport(txt, msg) {
  if (typeof txt !== "string" || txt.length > 200e6) { msg("Il file è troppo grande per essere un backup."); return false; }
  let x; try { x = JSON.parse(txt); } catch (e) { msg("Il file non è un backup valido (JSON non leggibile)."); return false; }
  const c = bkCheck(x); if (c.err) { msg(c.err); return false; }
  const p = c.p;
  S = p.S; S._reset = Date.now(); persist();
  if (p.MS) { MS = { ...MS0(), ...p.MS, _reset: Date.now() }; msSave(); }
  if (p.HANDS) { HANDS = { ...p.HANDS, _reset: Date.now() }; persistHands(); }
  if (p.POOL) { POOL = p.POOL; persistPool(); }
  if (p.OPP) { OPPS = p.OPP.opps; OPPK = p.OPP.k || OPPK; oppSaveLocal(); }
  if (p.reps) try { Object.entries(p.reps).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (e) {}
  let ns = 0;
  for (const s of p.sols) { try { const buf = bkUnB64(s.sol.buf); await gwDbReq("sol", "readwrite", st => st.put({ key: s.sol.key, buf: buf.buffer, meta: s.sol.meta })); await gwDbReq("meta", "readwrite", st => st.put(s.meta)); ns++; } catch (e) {} }
  GW_MEM.list = null; GW.set = null;
  const when = p.date ? ` del ${p.date.toLocaleDateString("it-IT")}` : "";
  msg(`Backup${when} ripristinato: progressi, diario, mani, tabelle${ns ? ` e ${ns} ${ns === 1 ? "soluzione" : "soluzioni"} del solver` : ""}.${c.skip.length ? ` Parti danneggiate saltate: ${c.skip.join(", ")}.` : ""}`);
  return true;
}
function bkPanel() {
  return `<section class="panel" style="margin-top:14px"><div class="eyebrow">Backup</div><h3 style="margin:4px 0 8px">Esporta o importa tutti i tuoi dati</h3>
  <p style="margin:0 0 10px;font-size:15px;color:var(--ink2)">Un solo file con progressi, diario del mindset, mani importate, avversari, tabelle personali, errori da ripassare e impostazioni. Le soluzioni del solver stanno solo in questo browser: includile se vuoi portarle su un altro computer o non perderle svuotando la cache.</p>
  <label style="display:flex;gap:8px;align-items:center;font-size:14px;margin-bottom:10px"><input type="checkbox" id="bkSol"> Includi le soluzioni salvate del solver (file più grande)</label>
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn primary" id="bkExp">⬇ Esporta tutto</button><label class="btn" style="cursor:pointer">⬆ Importa un backup<input type="file" id="bkFile" accept=".json,application/json" style="display:none"></label></div>
  <p id="bkMsg" style="font-size:14px;margin:10px 0 0"></p></section>`;
}
function bkBind() {
  const msg = t => { const m = $("#bkMsg"); if (m) m.innerHTML = t; };
  const e = $("#bkExp"); if (e) e.onclick = () => bkExport($("#bkSol").checked, msg);
  const f = $("#bkFile"); if (f) f.onchange = async () => {
    const file = f.files && f.files[0]; if (!file) return;
    const txt = await file.text();
    msg(`Ripristinare il backup <b>${esc(file.name)}</b>? I dati attuali di questa pagina verranno sostituiti. <button class="btn" id="bkYes" style="padding:4px 10px;font-size:13px">Sì, ripristina</button> <button class="btn ghost" id="bkNo" style="padding:4px 10px;font-size:13px">No</button>`);
    $("#bkNo").onclick = () => { f.value = ""; msg("Importazione annullata."); };
    $("#bkYes").onclick = async () => { msg("Ripristino in corso..."); const ok = await bkImport(txt, msg); f.value = ""; if (ok) { const keep = $("#bkMsg").innerHTML; renderData(); const m2 = $("#bkMsg"); if (m2) m2.innerHTML = keep; } };
  };
}

