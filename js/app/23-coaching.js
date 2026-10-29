/* ================= COACHING (stile Preply, per il poker) =================
   Chiunque può proporsi come coach con un profilo (approvato dal proprietario dell'app), gli studenti trovano un coach,
   prenotano una lezione in diretta nell'aula del sito (niente link esterni), la prenotazione è immediata e alla fine lo studente lascia una recensione.
   Dati: coaches/<id> profilo · coachok/<id> approvazione (solo admin) · rq/<id studente> richieste · cr/<id coach> risposte · rev/<id studente> recensioni.
   Ognuno scrive solo i propri documenti; gli altri li leggono. */
const CO_FMT = [["cash", "Cash game"], ["mtt", "MTT (tornei)"], ["spin", "Spin & Go"], ["plo", "PLO (Omaha)"], ["sng", "Sit & Go"], ["hu", "Heads-up"], ["live", "Poker live"], ["gto", "GTO"], ["track", "Uso dei tracker"], ["db", "Analisi database"]];
const coFmtName = k => (CO_FMT.find(x => x[0] === k) || [k, k])[1];
const CO_SPEC = [["pre", "Preflop e range"], ["post", "Postflop"], ["hands", "Analisi delle tue mani"], ["mind", "Mindset e tilt"], ["br", "Bankroll e salita di limite"], ["exploit", "Exploit e lettura del pool"], ["solver", "Uso del solver"]];
const CO_LANG = [["it", "Italiano"], ["en", "Inglese"], ["es", "Spagnolo"], ["fr", "Francese"], ["de", "Tedesco"], ["pt", "Portoghese"]];
const CO_DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const CO_HOURS = Array.from({ length: 24 }, (_, i) => i); /* tutte le ore, da 0:00 a 23:00 */
const CO = { tab: "find", back: "find", cur: null, pv: null, filt: { fav: false, abi: "", fm: "", lv: "", sp: "", lang: "", max: 0, sort: "rec" }, D: null, busy: false, admin: false, draft: null };
const coTxt = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const coLongTxt = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u0009\u000b-\u001f\u007f<>]/g, " ").replace(/[ \t]+/g, " ").trim().slice(0, n);
const coLink = s => { const t = String(s || "").trim(); return /^https:\/\/[^\s"'<>]{4,300}$/.test(t) ? t : ""; };
const coNum = (v, a, b) => { const n = Math.round(+v); return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : 0; };
const coLv = id => LEVELS.find(L => L.id === id);
const coColor = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return `hsl(${h % 360} 55% 42%)`; };
const coAv = (name, sz) => `<span class="co-av" style="--c:${coColor(name)};--sz:${sz || 48}px">${esc(String(name || "?").split(" ").map(w => w[0] || "").join("").slice(0, 2).toUpperCase())}</span>`;
const coPh = s => { const t = String(s || ""); return t.length < 70000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(t) ? t : ""; };
const coPic = (c, sz) => c && c.ph ? `<img class="co-av co-img" style="--sz:${sz || 48}px" src="${c.ph}" alt="" loading="lazy" decoding="async">` : coAv(c ? c.name : "?", sz);
/* foto del coach: ritaglio quadrato 220x220 in JPEG, tenuta piccola per stare nel profilo */
function coPhotoFile(file) {
  return new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type)) return rej("tipo");
    if (file.size > 15 * 1024 * 1024) return rej("grande");
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => { try {
      const S0 = 220, cv = document.createElement("canvas"); cv.width = cv.height = S0; const g = cv.getContext("2d");
      const m = Math.min(im.naturalWidth, im.naturalHeight), sx = (im.naturalWidth - m) / 2, sy = (im.naturalHeight - m) / 2;
      g.fillStyle = "#fff"; g.fillRect(0, 0, S0, S0); g.drawImage(im, sx, sy, m, m, 0, 0, S0, S0);
      let q = 0.85, d = cv.toDataURL("image/jpeg", q); while (d.length > 60000 && q > 0.35) { q -= 0.1; d = cv.toDataURL("image/jpeg", q); }
      URL.revokeObjectURL(url); coPh(d) ? res(d) : rej("grande");
    } catch (e) { URL.revokeObjectURL(url); rej("err"); } };
    im.onerror = () => { URL.revokeObjectURL(url); rej("tipo"); }; im.src = url;
  });
}
const coStars = (avg, n, big) => n ? `<span class="co-stars ${big ? "big" : ""}" title="${fmt(avg, 1)} su 5">${"★★★★★".slice(0, Math.round(avg))}<i>${"★★★★★".slice(Math.round(avg))}</i> <b>${fmt(avg, 1)}</b> <small>(${n})</small></span>` : `<span class="co-stars none">Nuovo coach</span>`;
const coWhen = ms => { const d = new Date(ms); return d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }); };
/* ---------- caricamento ---------- */
async function coLoad() {
  await lbInit(); if (!LB.db) { CO.D = null; return null; }
  try {
    const u = await hostUse("user"); CO.admin = !!(u && (await u.isOwner().catch(() => false) || await u.canEdit().catch(() => false)));
  } catch (e) { CO.admin = false; }
  const all = async c => { try { const qs = await LB.db.collection(c).limit(500).get(); return qs.docs.map(d => ({ id: d.id, ...(d.data() || {}) })); } catch (e) { return []; } };
  const [co, ok, rq, cr, rev] = await Promise.all(["coaches", "coachok", "rq", "cr", "rev"].map(all));
  const mails = {}; if (CO.admin) (await all("cmail")).forEach(x => { if (coMail(x.e)) mails[x.id] = coMail(x.e); });
  const reps = [], seen = {}; let repMine = null;
  if (CO.admin) {
    (await all("crep")).forEach(d => { const r = d.r && typeof d.r === "object" ? d.r : {}; Object.entries(r).forEach(([cid, v]) => { if (v && typeof v === "object" && CO_REP.some(x => x[0] === v.why)) reps.push({ key: d.id + ":" + cid + ":" + coNum(v.ts, 0, 9e15), sid: d.id, coach: cid, why: v.why, t: coLongTxt(v.t, 800), name: coTxt(v.name, 40) || "Utente", ts: coNum(v.ts, 0, 9e15) }); }); });
    try { const sn = await LB.db.doc("coadm/main").get(); const x = sn && sn.exists ? sn.data() : null; if (x && x.seen && typeof x.seen === "object") Object.keys(x.seen).forEach(k => { seen[k] = true; }); } catch (e) {}
  }
  if (LB.uid) { try { const sn = await LB.db.doc("crep/" + LB.uid).get(); repMine = sn && sn.exists ? sn.data() : null; } catch (e) {} }
  if (LB.uid && !mails[LB.uid]) { try { const sn = await LB.db.doc("cmail/" + LB.uid).get(); const x = sn && sn.exists ? sn.data() : null; if (x && coMail(x.e)) mails[LB.uid] = coMail(x.e); } catch (e) {} }
  const okSet = new Set(ok.filter(x => x.ok).map(x => x.id));
  const coaches = co.map(x => coClean(x)).filter(Boolean);
  const resp = {}; cr.forEach(d => { const r = d.r && typeof d.r === "object" ? d.r : {}; Object.entries(r).forEach(([bid, v]) => { if (v && typeof v === "object") resp[bid] = { st: ["ok", "no", "done"].includes(v.st) ? v.st : "ok", note: coTxt(v.note, 300), by: d.id, cin: coNum(v.in, 0, 9e15) }; }); });
  const books = []; rq.forEach(d => { const b = d.b && typeof d.b === "object" ? d.b : {}; Object.entries(b).forEach(([bid, v]) => { if (!v || typeof v !== "object") return; const start = +v.start; if (!Number.isFinite(start)) return; const R = resp[bid] && resp[bid].by === v.coach ? resp[bid] : null; books.push({ id: bid, sid: d.id, coach: String(v.coach || ""), start, dur: +v.dur === 30 ? 30 : 60, trial: !!v.trial, price: coNum(v.price, 0, 5000), msg: coLongTxt(v.msg, 600), sname: coTxt(v.sname, 40) || "Studente", cancel: !!v.cancel, late: !!v.late, g: coTxt(v.g, 30), sin: coNum(v.in, 0, 9e15), cin: R ? R.cin : 0, st: v.cancel ? (v.late ? "late" : "cancel") : R ? (R.st === "ok" ? "ok" : R.st) : "ok", note: R ? R.note : "" }); }); });
  const reviews = []; rev.forEach(d => { const r = d.r && typeof d.r === "object" ? d.r : {}; Object.entries(r).forEach(([cid, v]) => { if (v && typeof v === "object") { const s = coNum(v.s, 1, 5); if (s) reviews.push({ sid: d.id, coach: cid, s, t: coLongTxt(v.t, 500), name: coTxt(v.name, 40) || "Studente", date: coTxt(v.date, 10) }); } }); });
  CO.D = { coaches, okSet, books, reviews, mails, reps, seen, repMine, rqMine: rq.find(x => x.id === LB.uid) || null, crMine: cr.find(x => x.id === LB.uid) || null, revMine: rev.find(x => x.id === LB.uid) || null };
  return CO.D;
}
function coClean(x) {
  const name = coTxt(x.name, 40); if (!name) return null;
  const slots = Array.isArray(x.slots) ? x.slots.filter(s => Array.isArray(s) && s.length === 2).map(([d, h]) => [coNum(d, 0, 6), coNum(h, 0, 23)]).slice(0, 168) : [];
  const ll = {}; if (x.ll && typeof x.ll === "object") Object.entries(x.ll).forEach(([k, v]) => { if (CO_LANG.some(l => l[0] === k) && ["nat", "c2", "c1", "b2", "b1", "a2"].includes(v)) ll[k] = v; });
  const lx = x.lx && typeof x.lx === "object" && coTxt(x.lx.n, 30) ? { n: coTxt(x.lx.n, 30), l: ["nat", "c2", "c1", "b2", "b1", "a2"].includes(x.lx.l) ? x.lx.l : "" } : null;
  const abi = (Array.isArray(x.abi) ? x.abi : []).filter(k => CO_ABI.some(a => a[0] === k));
  const qz = x.qz && typeof x.qz === "object" ? { s: coNum(x.qz.s, 0, 50), n: coNum(x.qz.n, 1, 50) || 20, d: coTxt(x.qz.d, 10) } : null;
  const dt = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? String(v) : "";
  const off = (Array.isArray(x.off) ? x.off : []).filter(o => Array.isArray(o) && dt(o[0]) && dt(o[1])).map(o => [dt(o[0]), dt(o[1]) < dt(o[0]) ? dt(o[0]) : dt(o[1]), coTxt(o[2], 40)]).slice(0, 30);
  const ex = (Array.isArray(x.ex) ? x.ex : []).filter(o => Array.isArray(o) && dt(o[0])).map(o => [dt(o[0]), coNum(o[1], 0, 23)]).slice(0, 80);
  return { id: x.id, name, qz, off, ex, win: [14, 30, 60].includes(+x.win) ? +x.win : 30, nt: CO_NOTICE.includes(+x.nt) ? +x.nt : 12, nr: CO_NOTICE.includes(+x.nr) ? +x.nr : 2, ph: coPh(x.ph), ll, lx, abi, spx: coTxt(x.spx, 80), ideal: coTxt(x.ideal, 140), head: coTxt(x.head, 90), bio: coLongTxt(x.bio, 1500), exp: coTxt(x.exp, 120), fm: (Array.isArray(x.fm) ? x.fm : []).filter(k => CO_FMT.some(f => f[0] === k)), lv: (Array.isArray(x.lv) ? x.lv : []).filter(id => coLv(id)), sp: (Array.isArray(x.sp) ? x.sp : []).filter(k => CO_SPEC.some(s => s[0] === k)), lang: (Array.isArray(x.lang) ? x.lang : []).filter(k => CO_LANG.some(s => s[0] === k)), p60: coNum(x.p60, 0, 1000), p30: coNum(x.p30, 0, 1000), link: coLink(x.link), slots, tz: coNum(x.tz, -840, 840), pause: !!x.pause, date: coTxt(x.date, 10) };
}
/* regole di prenotazione come sulle grandi piattaforme di lezioni */
const CO_NOTICE = [2, 6, 12, 24, 48], CO_WIN = [[14, "2 settimane"], [30, "1 mese"], [60, "2 mesi"]], CO_FREE_H = 12;
const coMail = e => { const t = String(e || "").trim().slice(0, 120); return /^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(t) ? t : ""; };
const coDayStr = ms => new Date(ms).toISOString().slice(0, 10);
const coIsOff = (c, ds) => (c.off || []).some(o => ds >= o[0] && ds <= o[1]);
const coRating = cid => { const r = (CO.D ? CO.D.reviews : []).filter(x => x.coach === cid); return { n: r.length, avg: r.length ? r.reduce((a, b) => a + b.s, 0) / r.length : 0, list: r }; };
/* tornei: al posto del limite cash si indica l'ABI (buy-in medio) */
const CO_TOUR = ["mtt", "spin", "sng"];
const CO_ABI = [["a1", "fino a 2 €", 0, 2], ["a2", "2-5 €", 2, 5], ["a3", "5-11 €", 5, 11], ["a4", "11-22 €", 11, 22], ["a5", "22-55 €", 22, 55], ["a6", "55-109 €", 55, 109], ["a7", "oltre 109 €", 109, 0]];
const coTour = c => (c.fm || []).some(k => CO_TOUR.includes(k));
const coAbiRange = c => { if (!coTour(c)) return ""; const ix = (c.abi || []).map(k => CO_ABI.findIndex(a => a[0] === k)).filter(i => i >= 0).sort((a, b) => a - b); if (!ix.length) return "ABI: tutti"; const lo = CO_ABI[ix[0]][2], hi = CO_ABI[ix[ix.length - 1]][3]; return "ABI " + (!hi ? (lo ? "da " + lo + " € in su" : "tutti") : !lo ? "fino a " + hi + " €" : lo + "-" + hi + " €"); };
const coLvRange = c => { const f = c.fm && c.fm.length ? c.fm : ["cash"]; return f.includes("cash") ? coLvRange0(c) : ""; };
const coFmtChips = c => (c.fm && c.fm.length ? c.fm : ["cash"]).map(k => `<span class="fm">${esc(coFmtName(k))}</span>`).join("");
const coDone = cid => (CO.D ? CO.D.books : []).filter(b => b.coach === cid && b.st === "done").length;
const coLvRange0 = c => { const ix = c.lv.map(id => LEVELS.findIndex(L => L.id === id)).filter(i => i >= 0).sort((a, b) => a - b); return ix.length ? (ix.length === 1 ? LEVELS[ix[0]].stake : LEVELS[ix[0]].stake + " - " + LEVELS[ix[ix.length - 1]].stake) : "Tutti i livelli"; };
/* orari: il coach li salva nel suo fuso; qui diventano date vere dentro la sua finestra di prenotazione.
   Contano il preavviso minimo (diverso per la prova), i giorni di assenza e le ore extra. */
function coFreeSlots(c, dur, trial) {
  const out = [], now = Date.now(), taken = (CO.D ? CO.D.books : []).filter(b => b.coach === c.id && (b.st === "wait" || b.st === "ok")).map(b => [b.start, b.start + b.dur * 60000]);
  const notice = (trial ? c.nt : c.nr) || 2, win = c.win || 30, lo = now + notice * 3600000, hi = now + win * 86400000;
  const cNow = now + c.tz * 60000, d0 = Math.floor(cNow / 86400000) * 86400000;
  const add = start => { if (start < lo || start > hi) return; const end = start + dur * 60000; if (taken.some(([a, b]) => start < b && end > a)) return; out.push(start); };
  for (let k = 0; k <= win + 1; k++) {
    const dayL = d0 + k * 86400000, wd = (new Date(dayL).getUTCDay() + 6) % 7;
    if (coIsOff(c, coDayStr(dayL))) continue;
    for (const [d, h] of c.slots) if (d === wd) add(dayL + h * 3600000 - c.tz * 60000);
  }
  for (const [ds, h] of c.ex || []) { const dayL = Date.parse(ds + "T00:00:00Z"); if (Number.isFinite(dayL) && !coIsOff(c, ds)) add(dayL + h * 3600000 - c.tz * 60000); }
  return [...new Set(out)].sort((a, b) => a - b);
}
/* icone dell'area coaching: disegnate a mano, tratto semplice */
const CO_I = {
  cap: '<path d="M2 9.5 12 5l10 4.5L12 14z"/><path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"/><path d="M22 9.5V15"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 19.5c.4-3.2 3.1-5.3 6.5-5.3s6.1 2.1 6.5 5.3"/><circle cx="17.2" cy="9" r="2.5"/><path d="M16.5 14.3c2.6.2 4.6 1.9 5 4.7"/>',
  star: '<path class="f" d="M12 3.2l2.6 5.5 6 .7-4.4 4.1 1.2 5.9L12 16.5l-5.4 2.9 1.2-5.9-4.4-4.1 6-.7z"/>',
  heart: '<path d="M12 20s-7.2-4.4-9-8.6C1.6 8.2 3.7 5 7 5c2.1 0 3.4 1.1 5 3 1.6-1.9 2.9-3 5-3 3.3 0 5.4 3.2 4 6.4-1.8 4.2-9 8.6-9 8.6z"/>',
  check: '<circle cx="12" cy="12" r="9.5"/><path d="M7.8 12.4l2.9 2.9 5.6-6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>',
  video: '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 10.2 21.5 7v10l-6-3.2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  cal: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>'
};
const coI = (n, sz, cls) => `<svg class="co-i ${cls || ""}" viewBox="0 0 24 24" width="${sz || 16}" height="${sz || 16}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${CO_I[n]}</svg>`;
const coTeachShort = c => { const f = c.fm.length ? c.fm : ["cash"], lv = coLvRange(c), ab = coAbiRange(c); return f.map(coFmtName).join(", ") + (lv && lv !== "Tutti i livelli" ? " · " + lv : "") + (ab && ab !== "ABI: tutti" ? " · " + ab : ""); };
/* ---------- pagina ---------- */
function renderCoach() {
  const tabs = [["find", "Trova un coach"], ["mine", "Le mie lezioni"], ["coach", "Area coach"], ...(CO.admin ? [["admin", "Approvazioni"]] : [])];
  const cur = CO.tab === "prof" ? CO.back : CO.tab === "aula" ? CO.aback : CO.tab;
  $("#view").innerHTML = `<div class="co co2 ${CO.tab === "prof" || CO.tab === "aula" ? "isprof" : ""}">
    <div class="co-hero2"><div class="co-hx">
      <span class="co-kick">${coI("video", 15)} Lezioni di poker in diretta, 1 a 1</span>
      <h2>Trova il coach giusto<br>per il tuo poker</h2>
      <p>Cash game, MTT, Spin & Go, PLO, GTO e molto altro. Scegli il coach, prenota un orario e fai lezione in diretta nell'aula del sito.</p>
      <label class="co-search">${coI("search", 19)}<input id="coQ" type="search" autocomplete="off" placeholder="Cerca un coach, un limite o una specialità" value="${esc(CO.filt.q || "")}"></label>
      <div class="co-hstats" id="coHst"><span><b>-</b> coach</span><span><b>${CO_FMT.length}</b> categorie</span><span><b>1 a 1</b> in diretta</span></div>
    </div><div class="co-hart" aria-hidden="true">
      <div class="co-hc a"><span class="co-av" style="--c:hsl(162 60% 36%);--sz:42px">AK</span><div><b>Cash game</b><small>NL10 - NL50</small></div><em>${coI("star", 13)} 4,9</em></div>
      <div class="co-hc b"><span class="co-av" style="--c:hsl(265 50% 48%);--sz:42px">MT</span><div><b>MTT</b><small>ABI 5-22 €</small></div><em>${coI("star", 13)} 5,0</em></div>
      <div class="co-hc c">${coI("cal", 18)}<div><b>Mar 18:00</b><small>Lezione di prova</small></div></div>
    </div></div>
    <div class="co-tabs2" role="tablist">${tabs.map(([k, l]) => `<button class="${cur === k ? "on" : ""}" data-cot="${k}" role="tab">${l}<i class="co-tb" data-cotb="${k}"></i></button>`).join("")}</div>
    <div id="coBody"><div class="co-skel"><span></span><span></span></div></div></div>`;
  document.querySelectorAll("[data-cot]").forEach(b => b.onclick = () => { CO.tab = b.dataset.cot; renderCoach(); });
  const q = $("#coQ"); q.addEventListener("keydown", e => e.stopPropagation());
  q.addEventListener("input", () => { CO.filt.q = q.value; if (CO.tab !== "find") { coGo("find"); return; } const el = $("#coBody"); if (el && CO.D) coFind(el); });
  coLoad().then(() => { if (tab !== "coach" || run) return; if (CO.admin && !$("[data-cot=admin]")) return renderCoach(); coHeroStats(); coBody(); });
}
function coHeroStats() {
  const D = CO.D, h = $("#coHst"); if (!D) return;
  const pub = D.coaches.filter(c => D.okSet.has(c.id) && !c.pause), trials = pub.filter(c => c.p30).map(c => c.p30), done = D.books.filter(b => b.st === "done").length;
  if (h) h.innerHTML = `<span><b>${pub.length}</b> ${pub.length === 1 ? "coach" : "coach"}</span><span><b>${CO_FMT.length}</b> categorie</span>${trials.length ? `<span>prova da <b>${Math.min(...trials)} €</b></span>` : `<span><b>1 a 1</b> in diretta</span>`}${done ? `<span><b>${done}</b> ${done === 1 ? "lezione svolta" : "lezioni svolte"}</span>` : ""}`;
  const up = D.books.filter(b => b.sid === LB.uid && (b.st === "wait" || b.st === "ok") && b.start > Date.now()).length;
  const wait = D.books.filter(b => b.coach === LB.uid && b.st === "ok" && b.start > Date.now() && b.start < Date.now() + 7 * 86400000).length;
  const adm = D.coaches.filter(c => !D.okSet.has(c.id)).length + (D.reps || []).filter(r => !(D.seen || {})[r.key]).length;
  [["mine", up], ["coach", wait], ["admin", CO.admin ? adm : 0]].forEach(([k, n]) => { const t = document.querySelector(`[data-cotb="${k}"]`); if (t) { t.textContent = n || ""; t.classList.toggle("on", !!n); } });
}
function coBody() {
  const el = $("#coBody"); if (!el) return;
  if (!CO.D) { el.innerHTML = `<div class="co-empty2">${coI("users", 34)}<b>Il coaching ha bisogno dell'archivio condiviso</b><p>In questa vista non è disponibile.</p></div>`; return; }
  if (CO.tab !== "aula") coAulaLeave();
  ({ find: coFind, mine: coMine, coach: coArea, admin: coAdmin, prof: coProf, aula: coAula })[CO.tab](el);
}
function coFind(el) {
  const F = CO.filt, D = CO.D;
  let L = D.coaches.filter(c => D.okSet.has(c.id) && !c.pause);
  if (F.fav) L = L.filter(c => (S.coFav || []).includes(c.id));
  if (F.fm) L = L.filter(c => (c.fm && c.fm.length ? c.fm : ["cash"]).includes(F.fm));
  if (F.lv) L = L.filter(c => !c.lv.length || c.lv.includes(F.lv));
  if (F.abi && CO_TOUR.includes(F.fm)) L = L.filter(c => !c.abi.length || c.abi.includes(F.abi));
  if (F.sp) L = L.filter(c => c.sp.includes(F.sp));
  if (F.lang) L = L.filter(c => c.lang.includes(F.lang));
  if (F.max) L = L.filter(c => c.p60 <= F.max);
  const q = String(F.q || "").trim().toLowerCase();
  if (q) L = L.filter(c => [c.name, c.head, c.bio, c.exp, c.ideal, coSpAll(c).join(" "), coTeachShort(c), coLangAll(c).join(" ")].join(" ").toLowerCase().includes(q));
  const R = c => coRating(c.id);
  L.sort(F.sort === "cheap" ? (a, b) => a.p60 - b.p60 : F.sort === "top" ? (a, b) => R(b).avg - R(a).avg || R(b).n - R(a).n : (a, b) => (R(b).avg * Math.min(R(b).n, 10) + coDone(b.id)) - (R(a).avg * Math.min(R(a).n, 10) + coDone(a.id)));
  const pf = (id, opts, v, lab) => `<label class="co-pf ${v && v !== "0" && v !== "rec" ? "set" : ""}"><small>${lab}</small><select id="${id}">${opts.map(([k, l]) => `<option value="${k}" ${k === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>`;
  const lvSel = !F.fm || F.fm === "cash" ? pf("coFl", [["", "Tutti"], ...LEVELS.filter(L => !L.secret).map(L => [L.id, L.stake])], F.lv, "Il tuo limite cash") : CO_TOUR.includes(F.fm) ? pf("coFa", [["", "Tutti"], ...CO_ABI.map(a => [a[0], a[1]])], F.abi || "", "Il tuo ABI") : "";
  const active = [F.fm, F.lv, F.abi, F.sp, F.lang, F.max, F.fav, q].filter(Boolean).length;
  el.innerHTML = `<div class="co-fmts2"><div class="co-fscroll">${[["", "Tutti"], ...CO_FMT].map(([k, l]) => `<button class="${F.fm === k ? "on" : ""}" data-cofm="${k}">${l}</button>`).join("")}</div></div>
    <div class="co-pfs">${lvSel}${pf("coFs", [["", "Tutte"], ...CO_SPEC], F.sp, "Specialità")}${pf("coFg", [["", "Tutte"], ...CO_LANG], F.lang, "Lingua")}${pf("coFm", [["0", "Qualsiasi"], ["20", "fino a 20 €"], ["35", "fino a 35 €"], ["50", "fino a 50 €"], ["80", "fino a 80 €"]], String(F.max), "Prezzo all'ora")}</div>
    <div class="co-rbar"><b>${L.length} ${L.length === 1 ? "coach disponibile" : "coach disponibili"}</b>${active ? `<button class="co-clear" data-coclear>Azzera i filtri</button>` : ""}<span class="co-sp"></span><button class="co-favf ${F.fav ? "on" : ""}" data-cofavf>${coI("heart", 15)} Salvati</button>${pf("coFo", [["rec", "Consigliati"], ["top", "Voto più alto"], ["cheap", "Prezzo più basso"]], F.sort, "Ordina")}</div>
    ${L.length ? `<div class="co-list2">${L.map(c => { const r = R(c), dn = coDone(c.id), fav = (S.coFav || []).includes(c.id); return `<article class="co-c2" data-coopen="${esc(c.id)}">
      <div class="co-c2a">${coPic(c, 96)}</div>
      <div class="co-c2m">
        <div class="co-c2n"><b>${esc(c.name)}</b><span class="co-vb" title="Profilo approvato">${coI("check", 14)} Verificato</span></div>
        <p class="co-c2h">${esc(c.head)}</p>
        <ul class="co-c2l"><li>${coI("cap")}<span>${esc(coTeachShort(c))}</span></li><li>${coI("users")}<span>${dn} ${dn === 1 ? "lezione svolta" : "lezioni svolte"}</span></li><li>${coI("globe")}<span>Parla ${esc(coLangAll(c).join(", ").toLowerCase() || "-")}</span></li></ul>
        ${coSpAll(c).length ? `<div class="co-tags">${coSpAll(c).slice(0, 4).map(t => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
        ${c.bio ? `<p class="co-c2b">${esc(c.bio)}</p>` : ""}
      </div>
      <div class="co-c2s">
        <button class="co-hrt ${fav ? "on" : ""}" data-cofav2="${esc(c.id)}" aria-label="${fav ? "Togli dai salvati" : "Salva il coach"}">${coI("heart", 20)}</button>
        <div class="co-c2st"><div>${r.n ? `<b>${coI("star", 15)} ${fmt(r.avg, 1)}</b><small>${r.n} ${r.n === 1 ? "recensione" : "recensioni"}</small>` : `<b class="new">Nuovo</b><small>coach</small>`}</div><div><b>${c.p60} €</b><small>60 minuti</small></div></div>
        <button class="btn primary co-c2go" data-cotry="${esc(c.id)}">${c.p30 ? `Prenota una prova · ${c.p30} €` : "Prenota una lezione"}</button>
        <button class="btn ghost co-c2pr" data-coview="${esc(c.id)}">Vedi il profilo</button>
      </div></article>`; }).join("")}</div>`
      : `<div class="co-empty2">${coI(F.fav ? "heart" : "search", 34)}<b>${F.fav && !(S.coFav || []).length ? "Nessun coach salvato" : "Nessun coach con questi filtri"}</b><p>${F.fav && !(S.coFav || []).length ? "Apri un profilo e tocca «Salva il coach» per ritrovarlo qui." : D.coaches.some(c => D.okSet.has(c.id)) ? "Prova a togliere qualche filtro o a cambiare la ricerca." : "I primi coach sono in arrivo. Sei un giocatore forte? Vai in «Area coach» e proponiti."}</p>${active ? `<button class="btn" data-coclear>Azzera i filtri</button>` : ""}</div>`}`;
  el.querySelectorAll("[data-cofm]").forEach(b => b.onclick = () => { F.fm = b.dataset.cofm; if (F.fm && F.fm !== "cash") F.lv = ""; if (!CO_TOUR.includes(F.fm)) F.abi = ""; coFind(el); });
  el.querySelector("[data-cofavf]").onclick = () => { F.fav = !F.fav; coFind(el); };
  el.querySelectorAll("[data-coclear]").forEach(b => b.onclick = () => { Object.assign(F, { fav: false, abi: "", fm: "", lv: "", sp: "", lang: "", max: 0, q: "" }); const qi = $("#coQ"); if (qi) qi.value = ""; coFind(el); });
  [["coFl", "lv"], ["coFa", "abi"], ["coFs", "sp"], ["coFg", "lang"], ["coFm", "max"], ["coFo", "sort"]].forEach(([id, k]) => { if (!$("#" + id)) return; $("#" + id).onchange = e => { F[k] = k === "max" ? +e.target.value : e.target.value; coFind(el); }; });
  el.querySelectorAll("[data-coopen]").forEach(b => b.onclick = () => coProfile(b.dataset.coopen));
  el.querySelectorAll("[data-cofav2]").forEach(b => b.onclick = e => { e.stopPropagation(); const id = b.dataset.cofav2, S2 = new Set(S.coFav || []); S2.has(id) ? S2.delete(id) : S2.add(id); S.coFav = [...S2].slice(-100); persistSoon(); if (F.fav) coFind(el); else b.classList.toggle("on", S2.has(id)); });
  el.querySelectorAll("[data-cotry]").forEach(b => b.onclick = e => { e.stopPropagation(); coProfile(b.dataset.cotry, true); });
  el.querySelectorAll("[data-coview]").forEach(b => b.onclick = e => { e.stopPropagation(); coProfile(b.dataset.coview); });
}
/* ---------- profilo del coach (pagina intera, stile scheda insegnante) ---------- */
const CO_LL = [["nat", "Madrelingua"], ["c2", "C2 Padronanza"], ["c1", "C1 Avanzato"], ["b2", "B2 Intermedio alto"], ["b1", "B1 Intermedio"], ["a2", "A2 Base"]];
const coLLName = k => (CO_LL.find(x => x[0] === k) || ["", ""])[1];
const coSpName = k => (CO_SPEC.find(s => s[0] === k) || [k, k])[1];
const coSpAll = c => [...c.sp.map(k => coSpName(k)), ...String(c.spx || "").split(",").map(t => t.trim()).filter(Boolean).slice(0, 4)];
const coLangAll = c => [...c.lang.map(k => coLangName(k)), ...(c.lx ? [c.lx.n] : [])];
const coLangName = k => (CO_LANG.find(s => s[0] === k) || [k, k])[1];
const coStarRow = s => `<span class="co-stars">${"★★★★★".slice(0, Math.round(s))}<i>${"★★★★★".slice(Math.round(s))}</i></span>`;
const CO_CAP = `<svg class="co-ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 4 1.5 9 12 14l8.5-4.05V16h1.5V9L12 4zm-6 8.6V16c0 1.66 2.69 3 6 3s6-1.34 6-3v-3.4L12 15.5l-6-2.9z" fill="currentColor"/></svg>`;
function coTzLabel() {
  let n = ""; try { n = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  const o = -new Date().getTimezoneOffset(), s = (o >= 0 ? "+" : "-") + Math.floor(Math.abs(o) / 60) + ":" + String(Math.abs(o) % 60).padStart(2, "0");
  return (n ? n.replace(/_/g, " ") + " " : "") + "GMT " + s;
}
function coIdeal(c) {
  const ab = coAbiRange(c), tl = (c.fm.length ? c.fm : ["cash"]).filter(k => CO_TOUR.includes(k)).pop();
  const fms = (c.fm.length ? c.fm : ["cash"]).map(k => coFmtName(k) + (k === "cash" && coLvRange(c) && coLvRange(c) !== "Tutti i livelli" ? " " + coLvRange(c) : "") + (k === tl && ab && ab !== "ABI: tutti" ? " con " + ab : ""));
  const sp = c.sp.slice(0, 3).map(k => { const t = coSpName(k); return t.charAt(0).toLowerCase() + t.slice(1); });
  const j = a => a.length > 1 ? a.slice(0, -1).join(", ") + " e " + a[a.length - 1] : a[0];
  return `Chi gioca ${j(fms)} e vuole migliorare ${sp.length ? "su " + j(sp) : "il proprio gioco"}.`;
}
function coGo(t) {
  if (t === "prof") { if (CO.tab !== "prof") CO.back = CO.tab; } CO.tab = t;
  const on = t === "prof" ? (CO.back || "find") : t === "aula" ? (CO.aback || "mine") : t;
  document.querySelectorAll("[data-cot]").forEach(b => b.classList.toggle("on", b.dataset.cot === on));
  const w = document.querySelector(".co2"); if (w) w.classList.toggle("isprof", t === "prof" || t === "aula");
  coBody();
}
function coProfile(cid, jump) {
  const c = CO.D && CO.D.coaches.find(x => x.id === cid); if (!c) return;
  CO.cur = cid; CO.pv = { wk: 0, trial: !!c.p30, more: false, revAll: false, jump: !!jump };
  if (tab !== "coach" || !$("#coBody")) return;
  coGo("prof"); const v = CO.pv.jump ? $("#coCal") : $("#coBody"); if (v) { try { window.scrollTo({ top: Math.max(0, v.getBoundingClientRect().top + window.scrollY - 70) }); } catch (e) {} } if (CO.pv.jump && v) { v.classList.add("flash"); CO.pv.jump = false; }
}
function coCal(c, P) {
  const dur = P.trial ? 30 : 60, all = coFreeSlots(c, dur, P.trial);
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const mon0 = new Date(t0); mon0.setDate(t0.getDate() - ((t0.getDay() + 6) % 7));
  const last = all.length ? all[all.length - 1] : 0, maxWk = Math.max(0, Math.min(Math.ceil((c.win || 30) / 7), Math.floor((last - mon0.getTime()) / (7 * 86400000))));
  P.wk = Math.max(0, Math.min(P.wk, maxWk));
  const mon = new Date(mon0); mon.setDate(mon0.getDate() + P.wk * 7);
  const days = [...Array(7)].map((_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
  const mo = d => d.toLocaleDateString("it-IT", { month: "short" }).replace(".", "");
  const lab = days[0].getMonth() === days[6].getMonth() ? `${days[0].getDate()}–${days[6].getDate()} ${mo(days[6])} ${days[6].getFullYear()}` : `${days[0].getDate()} ${mo(days[0])} – ${days[6].getDate()} ${mo(days[6])} ${days[6].getFullYear()}`;
  const byDay = days.map(d => { const a = d.getTime(), b = a + 86400000; return all.filter(t => t >= a && t < b); });
  const hhmm = t => new Date(t).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  const any = byDay.some(x => x.length), CAP = 8, cut = !P.allT && byDay.some(x => x.length > CAP);
  return `<div class="co-calinfo">${coI("clock", 17)}<span>Scegli un orario per la ${P.trial ? "lezione di prova" : "lezione"}: la prenotazione è immediata. Si prenota almeno ${P.trial ? c.nt : c.nr} ore prima e fino a ${(CO_WIN.find(w => w[0] === (c.win || 30)) || [0, "1 mese"])[1]} avanti. Gli orari sono nel tuo fuso orario.</span></div>
    ${c.p30 ? `<div class="co-seg"><button class="${P.trial ? "on" : ""}" data-codur="t">Prova · 30 min</button><button class="${P.trial ? "" : "on"}" data-codur="60">60 min</button></div>` : ""}
    <div class="co-wnav"><button data-cowk="-1" ${P.wk <= 0 ? "disabled" : ""} aria-label="Settimana precedente">‹</button><button data-cowk="1" ${P.wk >= maxWk ? "disabled" : ""} aria-label="Settimana successiva">›</button><b>${lab}</b><small>${esc(coTzLabel())}</small></div>
    <div class="co-cal">${days.map((d, i) => `<div class="co-cd ${d < t0 ? "past" : ""}"><span class="co-cbar ${byDay[i].length ? "on" : ""}"></span><span class="co-cw">${d.toLocaleDateString("it-IT", { weekday: "short" }).replace(".", "")}</span><b class="co-cn">${d.getDate()}</b>${(cut ? byDay[i].slice(0, CAP) : byDay[i]).map(t => `<button class="co-ct" data-coslot="${t}">${hhmm(t)}</button>`).join("")}${cut && byDay[i].length > CAP ? `<span class="co-cmore">+${byDay[i].length - CAP}</span>` : ""}</div>`).join("")}</div>
    ${cut || P.allT && byDay.some(x => x.length > CAP) ? `<button class="co-more" data-coallt>${P.allT ? "Mostra meno orari" : "Mostra tutti gli orari"}</button>` : ""}
    ${any ? "" : `<p class="co-nofree">${all.length ? "Nessun orario libero in questa settimana: guarda la prossima." : "Nessun orario libero per ora: il coach apre il calendario fino a " + (CO_WIN.find(w => w[0] === (c.win || 30)) || [0, "1 mese"])[1] + " avanti."}</p>`}`;
}
function coProf(el) {
  const c = CO.D.coaches.find(x => x.id === CO.cur); if (!c) { CO.tab = CO.back || "find"; return coBody(); }
  const P = CO.pv || (CO.pv = { wk: 0, trial: !!c.p30, more: false, revAll: false }); if (!c.p30) P.trial = false;
  const r = coRating(c.id), done = coDone(c.id), fms = c.fm.length ? c.fm : ["cash"], own = LB.uid === c.id, fav = (S.coFav || []).includes(c.id), lvr = coLvRange(c);
  const tours = fms.filter(k => CO_TOUR.includes(k)), abr = coAbiRange(c), jn = a => a.length > 1 ? a.slice(0, -1).join(", ") + " e " + a[a.length - 1] : a[0];
  const teach = fms.filter(k => !CO_TOUR.includes(k) || k === tours[0]).map(k => k === tours[0] ? jn(tours.map(coFmtName)) + (abr ? " (" + abr + ")" : "") : coFmtName(k) + (k === "cash" && lvr ? " (" + lvr + ")" : "")).join(", ");
  const longBio = c.bio.length > 380 || c.bio.split("\n").length > 5;
  const revs = r.list.slice().reverse(), shown = P.revAll ? revs : revs.slice(0, 4);
  const nRev = n => n + " " + (n === 1 ? "recensione" : "recensioni");
  el.innerHTML = `<button class="co-back" data-coback>${coI("back", 16)} Tutti i coach</button>
  <div class="co-pg">
    <div class="co-ptop"><div class="co-pav">${coPic(c, 112)}</div><div class="co-pid"><h2>${esc(c.name)} <span class="co-vb">${coI("check", 15)} Verificato</span></h2><p class="co-psub">Coach di ${esc(fms.map(coFmtName).join(" · "))}${coLangAll(c).length ? " · parla " + esc(coLangAll(c).join(", ").toLowerCase()) : ""}</p><p class="co-ptag">${esc(c.head)}</p><p class="co-pteach">${coI("cap", 18)}<span><b>Insegna:</b> ${esc(teach)}</span></p></div></div>
    <aside class="co-side"><div class="co-scard">
      <div class="co-sprice"><b>${c.p60} €</b><small>Lezione di 60 minuti</small></div>
      <div class="co-sstats"><span>${r.n ? `<b>${coI("star", 15)} ${fmt(r.avg, 1)}</b>` : `<b class="new">Nuovo</b>`}<small>${nRev(r.n)}</small></span><span><b>${done}</b><small>${done === 1 ? "lezione" : "lezioni"}</small></span><span><b>${c.p30 ? c.p30 + " €" : "-"}</b><small>prova 30 min</small></span></div>
      ${own ? `<p class="co-own">Questo è il tuo profilo, come lo vedono gli studenti.</p>` : LB.uid ? `<button class="btn primary co-sbig" data-cogo="${c.p30 ? "t" : "60"}">${c.p30 ? "Prenota una lezione di prova" : "Prenota una lezione"}</button>${c.p30 ? `<button class="btn co-s2" data-cogo="60">Prenota 60 minuti</button>` : ""}` : `<p class="co-own">Per prenotare serve un accesso con il tuo account.</p>`}
      <button class="btn ghost co-s2 co-fav ${fav ? "on" : ""}" data-cofav>${coI("heart", 16)} <span>${fav ? "Salvato" : "Salva il coach"}</span></button>
      ${!own && LB.uid ? `<button class="co-repl" data-corep="${esc(c.id)}">${coI("flag", 14)} Segnala questo coach</button>` : ""}
      <ul class="co-sinfo"><li>${coI("check")} Prenotazione immediata</li><li>${coI("clock")} Annullamento gratuito fino a 12 ore prima</li><li>${coI("video")} Lezione in diretta nell'aula del sito</li></ul>
    </div></aside>
    <div class="co-pmain">
      <div class="co-ideal"><b>${coI("users", 17)} Ideale per</b><p>${esc(c.ideal || coIdeal(c))}</p></div>
      <section class="co-sec"><h3>Chi sono</h3>${c.exp ? `<p class="co-exp">${esc(c.exp)}</p>` : ""}<div class="co-bio ${longBio && !P.more ? "clamp" : ""}">${esc(c.bio).replace(/\n/g, "<br>")}</div>${longBio ? `<button class="co-more" data-comore>${P.more ? "Riduci" : "Espandi"}</button>` : ""}${coSpAll(c).length ? `<h4 class="co-h4">Specialità</h4><div class="co-chips co-spc">${coSpAll(c).map(t => `<span>${esc(t)}</span>`).join("")}</div>` : ""}</section>
      <section class="co-sec"><h3>Parlo</h3><div class="co-langs">${c.lang.map(k => `<span>${esc(coLangName(k))}${c.ll[k] ? `<em class="${c.ll[k] === "nat" ? "nat" : ""}">${esc(coLLName(c.ll[k]))}</em>` : ""}</span>`).join("")}${c.lx ? `<span>${esc(c.lx.n)}${c.lx.l ? `<em class="${c.lx.l === "nat" ? "nat" : ""}">${esc(coLLName(c.lx.l))}</em>` : ""}</span>` : ""}${!c.lang.length && !c.lx ? "<span>-</span>" : ""}</div></section>
      <section class="co-sec"><h3>Cosa dicono i miei studenti</h3>${r.n ? `<div class="co-rbig"><b>${fmt(r.avg, 1)}</b><div>${coStarRow(r.avg)}<small>${nRev(r.n)}</small></div></div>
        <div class="co-rgrid">${shown.map(x => `<div class="co-rcard"><div class="co-rh">${coAv(x.name, 38)}<div><b>${esc(x.name)}</b><small>${esc((x.date || "").split("-").reverse().join("/"))}</small></div></div>${coStarRow(x.s)}${x.t ? `<p>${esc(x.t)}</p>` : ""}</div>`).join("")}</div>
        ${revs.length > 4 ? `<button class="btn ghost co-revall" data-corevall>${P.revAll ? "Mostra meno" : "Mostra tutte le " + nRev(revs.length)}</button>` : ""}` : `<div class="co-nor">Ancora nessuna recensione: ${esc(c.name)} è un coach nuovo. Dopo ogni lezione svolta lo studente può lasciare un voto.</div>`}</section>
      <section class="co-sec" id="coCal"><h3>Calendario</h3><div id="coCalIn">${coCal(c, P)}</div></section>
    </div>
  </div>`;
  const bindCal = () => {
    const box = el.querySelector("#coCalIn");
    box.querySelectorAll("[data-codur]").forEach(b => b.onclick = () => { P.trial = b.dataset.codur === "t"; box.innerHTML = coCal(c, P); bindCal(); });
    box.querySelectorAll("[data-coallt]").forEach(b => b.onclick = () => { P.allT = !P.allT; box.innerHTML = coCal(c, P); bindCal(); });
    box.querySelectorAll("[data-cowk]").forEach(b => b.onclick = () => { P.wk += +b.dataset.cowk; box.innerHTML = coCal(c, P); bindCal(); });
    box.querySelectorAll("[data-coslot]").forEach(b => b.onclick = () => {
      if (own) { gToast("È il tuo profilo: gli studenti prenotano da qui."); return; }
      if (!LB.uid) { gToast("Per prenotare serve un accesso con il tuo account."); return; }
      coConfirm(c, +b.dataset.coslot, P.trial ? 30 : 60, P.trial);
    });
  };
  bindCal();
  el.querySelector("[data-coback]").onclick = () => coGo(CO.back || "find");
  el.querySelectorAll("[data-corep]").forEach(b => b.onclick = () => coReport(b.dataset.corep));
  const mo = el.querySelector("[data-comore]"); if (mo) mo.onclick = () => { P.more = !P.more; el.querySelector(".co-bio").classList.toggle("clamp", !P.more); mo.textContent = P.more ? "Riduci" : "Espandi"; };
  const ra = el.querySelector("[data-corevall]"); if (ra) ra.onclick = () => { P.revAll = !P.revAll; coProf(el); };
  el.querySelectorAll("[data-cogo]").forEach(b => b.onclick = () => {
    const t = b.dataset.cogo === "t"; if (P.trial !== t) { P.trial = t; el.querySelector("#coCalIn").innerHTML = coCal(c, P); bindCal(); }
    const cal = el.querySelector("#coCal"); try { window.scrollTo({ top: cal.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" }); } catch (e) { cal.scrollIntoView(); }
    cal.classList.remove("flash"); void cal.offsetWidth; cal.classList.add("flash");
  });
  el.querySelector("[data-cofav]").onclick = e => {
    const L = new Set(S.coFav || []); L.has(c.id) ? L.delete(c.id) : L.add(c.id); S.coFav = [...L].slice(-100); persistSoon();
    const on = L.has(c.id); e.currentTarget.classList.toggle("on", on); e.currentTarget.querySelector("span").textContent = on ? "Salvato" : "Salva il coach";
  };
}
/* conferma della prenotazione dopo aver scelto un orario nel calendario */
function coConfirm(c, start, dur, trial) {
  const price = trial ? c.p30 : c.p60, hh = t => new Date(t).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  gModal(`<span class="eyebrow">Prenota</span><h3 style="margin:4px 0 12px">${trial ? "Lezione di prova" : "Lezione"} con ${esc(c.name)}</h3><div id="coBk">
    <div class="co-cfsum">${coPic(c, 48)}<div><b>${new Date(start).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</b><span>${hh(start)} – ${hh(start + dur * 60000)} · ${dur} minuti</span></div><strong>${price} €</strong></div>
    <label class="of">Il tuo nome<input type="text" id="cbName" maxlength="40" value="${esc(S.nick || "")}"></label>
    <label class="of">Cosa vuoi migliorare (facoltativo)<textarea id="cbMsg" rows="3" maxlength="600" placeholder="Es. gioco NL10, perdo nei 3-bet pot fuori posizione"></textarea></label>
    ${trial ? "" : `<label class="co-wkly"><input type="checkbox" id="cbWk"> <span><b>Ogni settimana</b><small>Prenota lo stesso giorno e la stessa ora per 4 settimane (solo gli orari liberi)</small></span></label>`}
    <ul class="co-rules"><li>${coI("check")} Prenotazione immediata: il posto è tuo</li><li>${coI("clock")} Puoi annullare gratis fino a 12 ore prima. Dopo, la lezione è dovuta al coach.</li></ul>
    <p class="muted" style="font-size:12px">Il pagamento online arriverà con il sito: per ora il coach ti indica come pagare.</p>
    <button class="btn primary co-sbig" id="cbGo">Prenota ${trial ? "la lezione di prova" : "la lezione"}</button> <span class="muted" id="cbMsgOut" style="font-size:13px"></span></div>`, m => {
    m.querySelector(".gmbox").classList.add("cowide");
    const nm = m.querySelector("#cbName"), msg = m.querySelector("#cbMsg"); [nm, msg].forEach(x => x.addEventListener("keydown", e => e.stopPropagation()));
    m.querySelector("#cbGo").onclick = async () => {
      const name = coTxt(nm.value, 40); if (!name) { m.querySelector("#cbMsgOut").textContent = "Scrivi il tuo nome."; return; }
      m.querySelector("#cbGo").disabled = true;
      const bid = "b" + Date.now().toString(36) + Math.floor(Math.random() * 1e5).toString(36);
      const cur = CO.D.rqMine && CO.D.rqMine.b && typeof CO.D.rqMine.b === "object" ? CO.D.rqMine.b : {};
      const wk = m.querySelector("#cbWk") && m.querySelector("#cbWk").checked, free = wk ? coFreeSlots(c, dur, false) : [];
      const starts = wk ? [0, 1, 2, 3].map(k => start + k * 7 * 86400000).filter((t, k) => !k || free.includes(t)) : [start];
      const g = wk ? "g" + Date.now().toString(36) : "", add = {};
      starts.forEach((t, k) => { add[bid + (k ? "_" + k : "")] = { coach: c.id, start: t, dur, trial, price, msg: coLongTxt(msg.value, 600), sname: name, ts: Date.now(), ...(g ? { g } : {}) }; });
      try {
        await LB.db.doc("rq/" + LB.uid).set({ b: { ...cur, ...add } });
        S.nick = S.nick || name; persistSoon();
        m.querySelector("#coBk").innerHTML = `<div class="co-okmsg"><b>${starts.length > 1 ? starts.length + " lezioni prenotate!" : "Lezione prenotata!"}</b><p>${starts.map(t => coWhen(t)).join("<br>")}</p><p>La trovi in «Le mie lezioni»: da lì entri nell'aula della lezione, che si apre 15 minuti prima. Puoi annullare gratis fino a 12 ore prima.</p></div>`;
        await coLoad(); if (tab === "coach") { CO.tab = "mine"; renderCoach(); }
      } catch (e) { m.querySelector("#cbGo").disabled = false; m.querySelector("#cbMsgOut").textContent = e && e.code === "invalid_argument" ? "Con questo accesso non puoi prenotare." : "Non sono riuscito a inviare: riprova."; }
    };
  });
}
const CO_ST = { wait: ["In attesa", "mid"], ok: ["Prenotata", "ok"], no: ["Annullata dal coach", "bad"], done: ["Svolta", "done"], cancel: ["Annullata", "bad"], late: ["Annullata tardi", "bad"] };
function coBookRow(b, asCoach) {
  const c = CO.D.coaches.find(x => x.id === b.coach), st = CO_ST[b.st] || CO_ST.wait, future = b.start > Date.now() - b.dur * 60000;
  const reviewed = !asCoach && CO.D.revMine && CO.D.revMine.r && CO.D.revMine.r[b.coach];
  let act = "";
  if (asCoach) {
    if ((b.st === "ok" || b.st === "wait") && coAulaOpen(b)) act = `<button class="btn small primary" data-coaula="${b.id}">${coI("video", 14)} Entra nell'aula</button>`;
    if ((b.st === "ok" || b.st === "wait") && b.start <= Date.now()) act += `<button class="btn small" data-cor="done:${b.id}">Segna come svolta</button>`;
    else if ((b.st === "ok" || b.st === "wait") && b.start - Date.now() > CO_FREE_H * 3600000) act += `<button class="btn small ghost" data-cor="no:${b.id}">Annulla</button>`;
    else if (b.st === "ok" || b.st === "wait") act += `<small class="co-12h">Meno di 12 ore: non si può più annullare</small>`;
  } else {
    if ((b.st === "ok" || b.st === "wait") && future) act = coAulaOpen(b) ? `<button class="btn small primary" data-coaula="${b.id}">${coI("video", 14)} Entra nell'aula</button>` : `<small class="co-12h">L'aula si apre 15 minuti prima</small>`;
    if ((b.st === "wait" || b.st === "ok") && b.start > Date.now()) act += `<button class="btn small ghost" data-cocancel="${b.id}">Annulla</button>`;
    if (b.st === "done" && !reviewed) act += `<button class="btn small primary" data-corev="${b.coach}">Lascia una recensione</button>`;
    if (b.start < Date.now() || b.st === "no") act += `<button class="btn small ghost co-repb" data-corep="${b.coach}" title="Segnala il coach">${coI("flag", 14)} Segnala</button>`;
  }
  const dd = new Date(b.start);
  return `<div class="co-bk co-bk2 ${b.st}"><div class="co-bkm"><div class="co-date"><small>${dd.toLocaleDateString("it-IT", { month: "short" }).replace(".", "")}</small><b>${dd.getDate()}</b><small>${dd.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</small></div>${(asCoach ? coAv(b.sname, 40) : coPic(c, 40))}<div><b>${esc(asCoach ? b.sname : (c ? c.name : "Coach"))}</b><span>${coWhen(b.start)} · ${b.trial ? "prova 30 min" : b.dur + " min"} · ${b.price} €${b.g ? " · ogni settimana" : ""}</span>${b.msg && asCoach ? `<small>«${esc(b.msg)}»</small>` : ""}${b.note ? `<small>Nota del coach: ${esc(b.note)}</small>` : ""}${b.sin || b.cin ? `<small class="co-att">${b.cin ? "Coach entrato alle " + new Date(b.cin).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "Coach non entrato"} · ${b.sin ? "studente entrato alle " + new Date(b.sin).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "studente non entrato"}</small>` : ""}</div></div><div class="co-bka"><span class="co-st ${st[1]}">${st[0]}</span>${act}</div></div>`;
}
function coMine(el) {
  const L = CO.D.books.filter(b => b.sid === LB.uid).sort((a, b) => b.start - a.start);
  el.innerHTML = L.length ? `<div class="co-list">${L.map(b => coBookRow(b, false)).join("")}</div>` : `<div class="co-empty"><b>Nessuna lezione prenotata.</b><p>Trova un coach e prenota la prima lezione: con molti coach puoi iniziare da una lezione di prova di 30 minuti.</p><button class="btn primary" data-cot2="find">Trova un coach</button></div>`;
  el.querySelectorAll("[data-cot2]").forEach(b => b.onclick = () => { CO.tab = b.dataset.cot2; renderCoach(); });
  el.querySelectorAll("[data-cocancel]").forEach(b => b.onclick = () => {
    const bid = b.dataset.cocancel, cur = { ...((CO.D.rqMine && CO.D.rqMine.b) || {}) }; if (!cur[bid]) return;
    const late = +cur[bid].start - Date.now() < CO_FREE_H * 3600000;
    gModal(`<span class="eyebrow">Annulla la lezione</span><h3 style="margin:4px 0 8px">${coWhen(+cur[bid].start)}</h3><p>${late ? "<b>Mancano meno di 12 ore.</b> Se annulli adesso la lezione non viene rimborsata: il coach aveva tenuto libero quell'orario e viene pagato lo stesso." : "Mancano più di 12 ore: l'annullamento è gratuito."}</p><div class="co-mebtn"><button class="btn ${late ? "" : "primary"}" id="ccGo">${late ? "Annulla comunque" : "Annulla la lezione"}</button><button class="btn ghost" id="ccNo">Tieni la lezione</button></div>`, (m, close) => {
      m.querySelector("#ccNo").onclick = close;
      m.querySelector("#ccGo").onclick = async () => { m.querySelector("#ccGo").disabled = true; cur[bid] = { ...cur[bid], cancel: true, ...(late ? { late: true } : {}) }; try { await LB.db.doc("rq/" + LB.uid).set({ b: cur }); close(); await coLoad(); coBody(); } catch (e) { m.querySelector("#ccGo").disabled = false; } };
    });
  });
  el.querySelectorAll("[data-corev]").forEach(b => b.onclick = () => coReview(b.dataset.corev));
  el.querySelectorAll("[data-corep]").forEach(b => b.onclick = () => coReport(b.dataset.corep));
  el.querySelectorAll("[data-coaula]").forEach(b => b.onclick = () => coAulaGo(b.dataset.coaula));
}
function coReview(cid) {
  const c = CO.D.coaches.find(x => x.id === cid); let s = 5;
  gModal(`<span class="eyebrow">Recensione</span><h3 style="margin:4px 0 8px">Com'è andata con ${esc(c ? c.name : "il coach")}?</h3><div class="co-rate">${[1, 2, 3, 4, 5].map(i => `<button data-crs="${i}">★</button>`).join("")}</div><textarea id="crTxt" rows="4" maxlength="500" placeholder="Cosa ti è piaciuto, cosa hai imparato" style="width:100%;box-sizing:border-box;font:inherit;padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink)"></textarea><p style="margin:10px 0 0"><button class="btn primary" id="crGo">Pubblica la recensione</button></p>`, (m, close) => {
    const paint = () => m.querySelectorAll("[data-crs]").forEach(b => b.classList.toggle("on", +b.dataset.crs <= s)); paint();
    m.querySelectorAll("[data-crs]").forEach(b => b.onclick = () => { s = +b.dataset.crs; paint(); });
    m.querySelector("#crTxt").addEventListener("keydown", e => e.stopPropagation());
    m.querySelector("#crGo").onclick = async () => {
      const cur = { ...((CO.D.revMine && CO.D.revMine.r) || {}) };
      cur[cid] = { s, t: coLongTxt(m.querySelector("#crTxt").value, 500), name: coTxt(S.nick || "Studente", 40), date: today() };
      try { await LB.db.doc("rev/" + LB.uid).set({ r: cur }); close(); await coLoad(); coBody(); gToast("Grazie: la recensione è pubblicata."); } catch (e) { gToast("Non sono riuscito a pubblicare la recensione."); }
    };
  });
}
/* ---------- quiz di ingresso per diventare coach ----------
   20 domande pescate a caso, 20 secondi ciascuna, niente ritorno indietro.
   Se cambi scheda o finestra la domanda conta come sbagliata. Serve almeno 16/20; se non passi riprovi dopo 24 ore. */
const COQ_N = 20, COQ_PASS = 16, COQ_SECS = 20, COQ_WAIT = 24 * 3600000;
/* la prima risposta è quella giusta: l'ordine viene mescolato ogni volta */
const COQ_POOL = [
  ["Quale di queste combinazioni batte una scala?", "Colore", "Tris", "Doppia coppia", "Coppia d'assi"],
  ["Full contro colore allo showdown: chi vince?", "Il full", "Il colore", "Pareggio", "Decide il kicker"],
  ["Qual è la scala più bassa possibile?", "A-2-3-4-5", "2-3-4-5-6", "10-J-Q-K-A", "Non si può fare scala con l'asso basso"],
  ["Al tavolo 6-max, quale posizione agisce per ultima dopo il flop?", "Il bottone", "Il big blind", "UTG", "Lo small blind"],
  ["Al tavolo 6-max, chi parla per primo preflop?", "UTG", "Il big blind", "Il bottone", "Lo small blind"],
  ["Piatto 100, l'avversario punta 50. Quanta equity ti serve per un call in pareggio?", "25%", "33%", "50%", "20%"],
  ["L'avversario punta quanto il piatto. Quanta equity minima ti serve per chiamare?", "Circa 33%", "Circa 50%", "Circa 25%", "Circa 40%"],
  ["Piatto 90, l'avversario punta 60. Equity minima per chiamare?", "Circa 29%", "Circa 40%", "Circa 20%", "Circa 50%"],
  ["Al flop hai un progetto di colore. Quanti outs hai?", "9", "8", "12", "15"],
  ["Progetto di scala bilaterale (open-ended): quanti outs?", "8", "4", "9", "6"],
  ["Progetto di scala interna (gutshot): quanti outs?", "4", "8", "2", "6"],
  ["Al flop, all-in, con 9 outs e due carte da scoprire: quanta equity circa (regola del 4)?", "Circa 36%", "Circa 18%", "Circa 9%", "Circa 50%"],
  ["Al turn hai 8 outs. Quanta equity circa per il river (regola del 2)?", "Circa 16%", "Circa 32%", "Circa 8%", "Circa 24%"],
  ["Che cos'è la fold equity?", "Il valore che guadagni quando l'avversario folda alla tua puntata", "L'equity della tua mano dopo che hai foldato", "La percentuale di mani che giochi", "La parte di piatto trattenuta dalla sala"],
  ["Cosa significa c-bet?", "La puntata al flop di chi ha rilanciato per ultimo preflop", "Un check-raise al turn", "La puntata obbligatoria del big blind", "Un all-in al river"],
  ["Secondo le regole della scuola, da quale posizione si può fare limp?", "Solo dallo small blind", "Da qualsiasi posizione", "Solo dal bottone", "Da nessuna posizione"],
  ["Size dell'isolamento su uno o più limper secondo la scuola:", "3bb più 1bb per ogni limper", "2bb fissi", "5bb più 2bb per ogni limper", "Sempre all-in"],
  ["Size di riferimento di una 3-bet in posizione:", "Circa 3 volte il rilancio", "Circa 2 volte il rilancio", "Circa 6 volte il rilancio", "Il minimo consentito"],
  ["Size di riferimento di una 3-bet fuori posizione:", "Circa 4 volte il rilancio", "Circa 2 volte il rilancio", "Circa 8 volte il rilancio", "Il minimo consentito"],
  ["Squeeze in posizione: come si calcola la size?", "3-3,5 volte il rilancio più 1 volta per ogni caller", "Sempre 2 volte il rilancio", "Come una 3-bet, i caller non contano", "10 volte il big blind fissi"],
  ["Ai micro limiti, quanto costa in media la rake?", "Circa 10-15 bb/100", "Circa 1 bb/100", "Circa 50 bb/100", "Niente"],
  ["Cosa indica il cap della rake?", "Il massimo che la sala trattiene in un singolo piatto", "Il buy-in minimo del tavolo", "Il numero massimo di giocatori", "La puntata massima consentita"],
  ["Perché si gestisce il bankroll?", "Per reggere la varianza senza andare in rovina", "Per vincere più mani", "Per pagare meno rake", "Per giocare più tavoli"],
  ["Nel tracker, cosa indica il VPIP?", "La percentuale di mani in cui metti soldi volontariamente nel piatto preflop", "La percentuale di rilanci al flop", "Le vincite ogni 100 mani", "La frequenza con cui arrivi allo showdown"],
  ["Nel tracker, cosa indica il PFR?", "La percentuale di mani che rilanci preflop", "La percentuale di flop visti", "Le perdite ogni 100 mani", "La frequenza di c-bet"],
  ["Un giocatore con VPIP 45 e PFR 8 è probabilmente:", "Un giocatore loose e passivo che chiama tanto", "Un regular tight-aggressivo", "Un giocatore molto tight (nit)", "Un maniac che rilancia quasi tutto"],
  ["Cosa significa SPR?", "Il rapporto tra stack effettivo e piatto", "La percentuale di showdown vinti", "La size della puntata preflop", "Il numero di outs"],
  ["Cos'è un blocker?", "Una carta che hai in mano e riduce le combinazioni possibili dell'avversario", "Una puntata piccola per evitare una puntata grande", "Un giocatore che non vede mai il flop", "Una carta del board che chiude il colore"],
  ["Contro una puntata di metà piatto, quanto devi difendere per non essere sfruttabile (MDF)?", "Circa 67%", "Circa 33%", "Circa 50%", "Circa 80%"],
  ["Cosa significa value bet?", "Puntare per farti chiamare da mani peggiori", "Puntare per far foldare mani migliori", "Puntare il minimo per vedere la carta dopo", "Puntare solo con i progetti"],
  ["Qual è lo scopo di un bluff?", "Far foldare mani migliori della tua", "Farti chiamare da mani peggiori", "Vedere gratis la carta successiva", "Ridurre la rake"],
  ["Perché il bottone è la posizione più redditizia?", "Perché agisce per ultimo dopo il flop", "Perché paga i blind", "Perché riceve carte migliori", "Perché nessuno può rilanciarlo"],
  ["Il board A♠ K♦ 7♣ è:", "Asciutto (dry)", "Molto coordinato", "Monocolore", "Accoppiato"],
  ["Il board 9♥ 8♥ 7♠ è:", "Coordinato, con molti progetti", "Asciutto", "Monocolore", "Accoppiato"],
  ["Hai A-K e il flop è K-7-2. La tua mano è:", "Top pair top kicker", "Overpair", "Set", "Un progetto"],
  ["Hai Q-Q e il flop è J-7-3. La tua mano è:", "Overpair", "Top pair", "Set", "Seconda coppia"],
  ["Cos'è lo stack effettivo?", "Il più piccolo tra il tuo stack e quello dell'avversario", "La somma degli stack", "Il tuo stack meno il piatto", "Lo stack più grande al tavolo"],
  ["Quante combinazioni esistono di una coppia precisa, per esempio A-A?", "6", "4", "12", "16"],
  ["Quante combinazioni di A-K esistono in totale (suited e offsuit)?", "16", "12", "4", "6"],
  ["Quante combinazioni di A-K suited esistono?", "4", "12", "16", "1"],
  ["Nei tornei, a cosa serve l'ICM?", "A tradurre le chips in valore reale in base al montepremi", "A calcolare le outs", "A scegliere la size della c-bet", "A misurare la rake"],
  ["Quanti giocatori ci sono in uno Spin & Go?", "3", "6", "9", "2"],
  ["Nell'analisi del database, perché dividi i risultati per posizione?", "Per vedere dove vinci e dove perdi", "Per pagare meno rake", "Per nascondere le statistiche agli avversari", "Non serve: conta solo il totale"],
  ["Cosa significa giocare GTO?", "Seguire una strategia di equilibrio difficile da sfruttare", "Sfruttare al massimo un avversario preciso", "Giocare solo mani premium", "Giocare tornei a turbo"],
  ["Cosa fa una strategia exploit?", "Si allontana dall'equilibrio per sfruttare gli errori dell'avversario", "Segue sempre il solver", "Gioca ogni mano allo stesso modo", "Evita i bluff in ogni caso"],
  ["Cos'è un check-raise?", "Fare check e poi rilanciare la puntata dell'avversario nello stesso giro", "Fare check su due giri di fila", "Rilanciare preflop e fare check al flop", "Chiamare una puntata e poi foldare"],
  ["Cosa sono le implied odds?", "Quello che pensi di vincere nei giri successivi se chiudi il progetto", "Le odds del piatto già presenti", "La probabilità di fare scala al river", "La rake trattenuta nelle mani grandi"],
  ["Cos'è un overbet?", "Una puntata più grande del piatto", "Una puntata del minimo", "Un rilancio preflop di 2bb", "Una puntata del big blind"],
  ["Cos'è una donk bet?", "Puntare fuori posizione verso chi aveva l'iniziativa nel giro prima", "Una c-bet in posizione", "Un all-in preflop", "Un limp dallo small blind"],
  ["Hai 5♥4♥ e il board è 6♥ 7♣ 2♥. Cosa hai?", "Progetto di scala bilaterale e progetto di colore", "Solo progetto di colore", "Scala fatta", "Niente"],
  ["Cos'è il winrate in bb/100?", "Quanti big blind vinci in media ogni 100 mani", "Quante mani vinci su 100", "Quanti tornei vinci su 100", "La rake pagata ogni 100 mani"],
  ["Perché la varianza conta nel poker?", "Perché nel breve periodo i risultati possono essere lontani dal tuo vero livello", "Perché decide chi gioca meglio", "Perché si annulla dopo 100 mani", "Perché riguarda solo i tornei"]
];
const coQOk = me => (me && me.qz && me.qz.s >= COQ_PASS) || (S.coQz && S.coQz.pass);
function coQuizGate(el) {
  const Q = S.coQz || {}, wait = !Q.pass && Q.ts && Date.now() - Q.ts < COQ_WAIT ? COQ_WAIT - (Date.now() - Q.ts) : 0;
  const wm = Math.ceil(wait / 60000), hh = Math.floor(wm / 60), mm = wm % 60;
  el.innerHTML = `<div class="coq-gate"><div class="coq-ic">${coI("check", 30)}</div><span class="co-kick">Prima di diventare coach</span><h3>Quiz di ingresso</h3>
    <p>Per proteggere gli studenti ogni coach supera un quiz di base su regole, matematica, concetti e lettura dei dati. Il quiz è a tempo, così non si fa in tempo a chiedere le risposte a un'IA.</p>
    <div class="coq-rules"><div><b>${COQ_N}</b><small>domande</small></div><div><b>${COQ_SECS} s</b><small>per domanda</small></div><div><b>${COQ_PASS}/${COQ_N}</b><small>per passare</small></div></div>
    <ul class="coq-list"><li>${coI("arrow")} Non si torna indietro e il tempo non si ferma.</li><li>${coI("arrow")} Se cambi scheda, app o finestra, la domanda conta come sbagliata.</li><li>${coI("arrow")} Le risposte giuste non vengono mostrate.</li><li>${coI("arrow")} Se non lo superi, puoi riprovare dopo 24 ore.</li></ul>
    ${Q.ts && !Q.pass ? `<p class="coq-last">Ultimo tentativo: <b>${Q.s}/${Q.n || COQ_N}</b>.</p>` : ""}
    ${wait ? `<button class="btn" disabled>Riprova tra ${hh ? hh + " h " : ""}${mm} min</button>` : `<button class="btn primary co-sbig" id="coqGo">Inizia il quiz</button>`}</div>`;
  const g = $("#coqGo"); if (g) g.onclick = () => coQuizRun(el);
}
function coQuizRun(el) {
  const pool = COQ_POOL.map((q, i) => i).sort(() => Math.random() - 0.5).slice(0, COQ_N);
  const Z = { i: 0, ok: 0, t0: 0, timer: 0, lock: false, ans: [] };
  CO.quiz = Z;
  const off = () => { clearInterval(Z.timer); document.removeEventListener("visibilitychange", onHide); window.removeEventListener("blur", onHide); CO.quiz = null; };
  const onHide = () => { if (!Z.lock && CO.quiz === Z && (document.hidden || !document.hasFocus())) pick(-1, true); };
  document.addEventListener("visibilitychange", onHide); window.addEventListener("blur", onHide);
  const show = () => {
    if (Z.i >= COQ_N) return finish();
    const q = COQ_POOL[pool[Z.i]], ord = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    Z.cur = ord; Z.lock = false; Z.t0 = Date.now();
    el.innerHTML = `<div class="coq" oncopy="return false" oncontextmenu="return false"><div class="coq-top"><span>Domanda <b>${Z.i + 1}</b> di ${COQ_N}</span><span class="coq-sec" id="coqSec">${COQ_SECS}</span></div>
      <div class="coq-bar"><i style="width:${Z.i / COQ_N * 100}%"></i></div><div class="coq-time"><i id="coqT"></i></div>
      <h3 class="coq-q">${esc(q[0])}</h3><div class="coq-opts">${ord.map((k, j) => `<button data-coqa="${j}"><span>${"ABCD"[j]}</span>${esc(q[k])}</button>`).join("")}</div>
      <p class="coq-warn">Resta su questa pagina fino alla fine.</p></div>`;
    el.querySelectorAll("[data-coqa]").forEach(b => b.onclick = () => pick(+b.dataset.coqa));
    clearInterval(Z.timer);
    Z.timer = setInterval(() => { const left = COQ_SECS - (Date.now() - Z.t0) / 1000, t = $("#coqT"), s = $("#coqSec"); if (t) t.style.width = Math.max(0, left / COQ_SECS * 100) + "%"; if (s) { s.textContent = Math.max(0, Math.ceil(left)); s.classList.toggle("low", left <= 5); } if (left <= 0) pick(-1); }, 100);
  };
  const pick = (j, away) => {
    if (Z.lock || CO.quiz !== Z) return; Z.lock = true; clearInterval(Z.timer);
    const good = j >= 0 && Z.cur[j] === 1; if (good) Z.ok++;
    Z.ans.push(good ? 1 : 0);
    const b = j >= 0 ? el.querySelector(`[data-coqa="${j}"]`) : null; if (b) b.classList.add("sel");
    if (away) { const w = el.querySelector(".coq-warn"); if (w) { w.textContent = "Hai lasciato la pagina: questa domanda conta come sbagliata."; w.classList.add("bad"); } }
    Z.i++; setTimeout(show, away ? 1400 : 280);
  };
  const finish = () => {
    off(); const pass = Z.ok >= COQ_PASS;
    S.coQz = { pass: pass || !!(S.coQz && S.coQz.pass), s: Z.ok, n: COQ_N, ts: Date.now(), d: today() }; persistSoon();
    el.innerHTML = `<div class="coq-gate coq-end ${pass ? "ok" : "ko"}"><div class="coq-score"><b>${Z.ok}</b><small>su ${COQ_N}</small></div>
      <h3>${pass ? "Quiz superato!" : "Quiz non superato"}</h3><p>${pass ? "Ottimo lavoro: ora puoi compilare il tuo profilo da coach. Il punteggio del quiz viene allegato al profilo per l'approvazione." : `Servivano almeno ${COQ_PASS} risposte giuste. Ripassa le lezioni e i drill: puoi riprovare tra 24 ore.`}</p>
      ${pass ? `<button class="btn primary co-sbig" id="coqNext">Compila il profilo</button>` : `<button class="btn" id="coqBack">Torna all'area coach</button>`}</div>`;
    const n = $("#coqNext") || $("#coqBack"); if (n) n.onclick = () => coArea(el);
  };
  show();
}
/* ---------- area coach ---------- */
function coArea(el) {
  if (!LB.uid) { el.innerHTML = `<p class="muted">Per proporti come coach serve un accesso con il tuo account.</p>`; return; }
  const me = CO.D.coaches.find(c => c.id === LB.uid), ok = CO.D.okSet.has(LB.uid);
  if (me && !CO.draft) {
    const req = CO.D.books.filter(b => b.coach === LB.uid).sort((a, b) => a.start - b.start), r = coRating(LB.uid);
    const earn = req.filter(b => b.st === "done" || b.st === "late").reduce((a, b) => a + b.price, 0), next = req.filter(b => b.st === "ok" && b.start > Date.now());
    el.innerHTML = `<div class="co-me"><div class="co-ph">${coPic(me, 64)}<div><h3>${esc(me.name)}</h3><p>${esc(me.head)}</p><span class="co-st ${ok ? "ok" : "mid"}">${ok ? (me.pause ? "In pausa: non compari nella ricerca" : "Profilo pubblicato") : "In attesa di approvazione"}</span></div></div>
      <div class="co-facts"><div><small>Voto</small><b>${r.n ? fmt(r.avg, 1) + " ★" : "-"}</b></div><div><small>Lezioni svolte</small><b>${coDone(LB.uid)}</b></div><div><small>Prossime lezioni</small><b>${next.length}</b></div><div><small>Da incassare (svolte e annullate tardi)</small><b>${earn} €</b></div></div>
      <div class="co-mebtn"><button class="btn" id="coEdit">Modifica il profilo</button><button class="btn ghost" id="coPause">${me.pause ? "Riprendi le lezioni" : "Metti in pausa"}</button><button class="btn ghost" data-coopen="${esc(me.id)}">Vedi come ti vedono</button></div></div>
      ${ok ? "" : `<div class="co-pend">${coI("mail", 22)}<div><b>Profilo ricevuto: lo stiamo valutando</b><p>Grazie per esserti proposto come coach. Teniamo molto a far sì che chi usa la piattaforma riceva lezioni serie e professionali, per questo controlliamo ogni profilo prima di pubblicarlo. Potremmo contattarti all'indirizzo email che hai indicato${CO.D.mails[LB.uid] ? ` (<b>${esc(CO.D.mails[LB.uid])}</b>)` : ""} per chiederti qualche informazione in più sulla tua esperienza o sul tuo metodo. Controlla anche la cartella spam.</p></div></div>`}
      ${coAvailBox(me)}
      <h3 class="co-h">Lezioni prenotate</h3>${req.length ? `<div class="co-list">${req.map(b => coBookRow(b, true)).join("")}</div>` : `<p class="muted">Nessuna lezione prenotata per ora. Gli studenti prenotano subito negli orari liberi del tuo calendario.</p>`}`;
    coAvailBind(el, me);
    $("#coEdit").onclick = () => { CO.draft = { ...me }; coArea(el); };
    $("#coPause").onclick = async () => { try { await LB.db.doc("coaches/" + LB.uid).set(coDoc({ ...me, pause: !me.pause })); await coLoad(); coArea(el); } catch (e) {} };
    el.querySelectorAll("[data-coopen]").forEach(b => b.onclick = () => coProfile(b.dataset.coopen));
    el.querySelectorAll("[data-coaula]").forEach(b => b.onclick = () => coAulaGo(b.dataset.coaula));
    el.querySelectorAll("[data-cor]").forEach(b => b.onclick = async () => {
      const [st, bid] = b.dataset.cor.split(":"); let note = "";
      b.disabled = true; if (st === "no") note = "Il coach ha annullato la lezione.";
      const cur = { ...((CO.D.crMine && CO.D.crMine.r) || {}) }; cur[bid] = { st, note, at: Date.now() };
      try { await LB.db.doc("cr/" + LB.uid).set({ r: cur }); await coLoad(); coArea(el); } catch (e) { b.disabled = false; }
    });
    return;
  }
  /* modulo profilo: prima serve il quiz */
  if (!me && !coQOk(me)) return coQuizGate(el);
  const d = CO.draft || { win: 30, nt: 12, nr: 2, off: [], ex: [], abi: [], name: S.nick || "", ideal: "", ll: { it: "nat" }, head: "", bio: "", exp: "", fm: ["cash"], lv: [], sp: [], lang: ["it"], p60: 30, p30: 10, link: "", slots: [] };
  CO.draft = d;
  const chk = (arr, key, list) => list.map(([k, l]) => `<label class="co-chk"><input type="checkbox" data-cof="${key}" value="${k}" ${arr.includes(k) ? "checked" : ""}> ${l}</label>`).join("");
  const has = (dd, h) => d.slots.some(s => s[0] === dd && s[1] === h);
  el.innerHTML = `<div class="co-form"><h3>${me ? "Modifica il tuo profilo da coach" : "Diventa coach"}</h3>${me ? "" : `<p class="muted">Compila il profilo: dopo l'approvazione comparirai nella ricerca e gli studenti potranno prenotarti. Le lezioni si svolgono in diretta nell'aula del sito: niente link esterni da gestire.</p>`}
    <div class="co-phbox"><div class="co-phprev" id="cfPhPrev">${d.ph ? `<img class="co-av co-img" style="--sz:96px" src="${coPh(d.ph)}" alt="">` : coAv(d.name || "?", 96)}</div><div><b>La tua foto</b><p class="muted">Una foto chiara del viso aiuta gli studenti a sceglierti. Viene ritagliata quadrata.</p><div class="co-mebtn" style="margin-top:6px"><label class="btn small" for="cfPh">${d.ph ? "Cambia foto" : "Carica una foto"}</label><input type="file" id="cfPh" accept="image/jpeg,image/png,image/webp" hidden>${d.ph ? `<button type="button" class="btn small ghost" id="cfPhDel">Rimuovi</button>` : ""}<span class="muted" id="cfPhMsg" style="font-size:12.5px"></span></div></div></div>
    <div class="co-fg"><label class="of">Nome che vedono gli studenti<input type="text" id="cfName" maxlength="40" value="${esc(d.name)}"></label><label class="of">Titolo breve<input type="text" id="cfHead" maxlength="90" value="${esc(d.head)}" placeholder="Es. Reg NL100, specialista di difesa del BB"></label></div>
    <label class="of">Chi sei e come insegni<textarea id="cfBio" rows="5" maxlength="1500" placeholder="Racconta il tuo percorso, i limiti che giochi e come imposti le lezioni">${esc(d.bio)}</textarea></label>
    <label class="of">Esperienza in una riga<input type="text" id="cfExp" maxlength="120" value="${esc(d.exp)}" placeholder="Es. 6 anni di cash online, gioco NL200"></label>
    <label class="of">Ideale per (facoltativo)<input type="text" id="cfIdeal" maxlength="140" value="${esc(d.ideal || "")}" placeholder="Es. chi gioca NL2-NL10 e vuole un metodo chiaro per il preflop"></label>
    <div class="co-fs"><b>Cosa insegni</b><div class="co-chks">${chk(d.fm || [], "fm", CO_FMT)}</div></div>
    <div class="co-fs" id="cfLvBox" ${(d.fm || []).includes("cash") ? "" : "hidden"}><b>Limiti cash che segui</b><div class="co-chks">${chk(d.lv, "lv", LEVELS.filter(L => !L.secret).map(L => [L.id, L.stake]))}</div></div>
    <div class="co-fs" id="cfAbiBox" ${(d.fm || []).some(k => CO_TOUR.includes(k)) ? "" : "hidden"}><b>ABI che segui</b> <small class="muted">buy-in medio dei tornei (MTT, Spin & Go, Sit & Go)</small><div class="co-chks">${chk(d.abi || [], "abi", CO_ABI.map(a => [a[0], a[1]]))}</div></div>
    <div class="co-fs"><b>Specialità</b><div class="co-chks">${chk(d.sp, "sp", CO_SPEC)}</div><label class="co-altro">Altro:<input type="text" id="cfSpx" maxlength="80" value="${esc(d.spx || "")}" placeholder="Es. ICM, gioco short-handed (separa con la virgola)"></label></div>
    <div class="co-fs"><b>Lingue che parli</b><div class="co-lrows">${CO_LANG.map(([k, l]) => `<div class="co-lrow"><label class="co-chk"><input type="checkbox" data-cof="lang" value="${k}" ${d.lang.includes(k) ? "checked" : ""}> ${l}</label><select data-coll="${k}" aria-label="Livello di ${l}"><option value="">Livello</option>${CO_LL.map(([v, n]) => `<option value="${v}" ${(d.ll || {})[k] === v ? "selected" : ""}>${n}</option>`).join("")}</select></div>`).join("")}<div class="co-lrow co-lx"><label class="co-altro">Altro:<input type="text" id="cfLxN" maxlength="30" value="${esc((d.lx && d.lx.n) || "")}" placeholder="Es. Russo"></label><select id="cfLxL" aria-label="Livello dell'altra lingua"><option value="">Livello</option>${CO_LL.map(([v, n]) => `<option value="${v}" ${d.lx && d.lx.l === v ? "selected" : ""}>${n}</option>`).join("")}</select></div></div></div>
    <div class="co-fg"><label class="of">Prezzo 60 minuti (€)<input type="number" id="cfP60" min="5" max="1000" value="${d.p60}"></label><label class="of">Lezione di prova 30 minuti (€, 0 = nessuna)<input type="number" id="cfP30" min="0" max="1000" value="${d.p30}"></label></div>
    <div class="co-fg"><label class="of">La tua email (la vede solo lo staff)<input type="email" id="cfMail" maxlength="120" value="${esc(d.em || CO.D.mails[LB.uid] || "")}" placeholder="nome@esempio.it"></label></div>
    <div class="co-fs"><b>Regole di prenotazione</b> <small class="muted">gli studenti prenotano subito negli orari liberi, senza aspettare la tua conferma</small><div class="co-fg3"><label class="of">Calendario aperto per<select id="cfWin">${CO_WIN.map(([v, l]) => `<option value="${v}" ${(d.win || 30) === v ? "selected" : ""}>${l}</option>`).join("")}</select></label><label class="of">Preavviso per la prova<select id="cfNt">${CO_NOTICE.map(v => `<option value="${v}" ${(d.nt || 12) === v ? "selected" : ""}>${v} ore prima</option>`).join("")}</select></label><label class="of">Preavviso per le lezioni<select id="cfNr">${CO_NOTICE.map(v => `<option value="${v}" ${(d.nr || 2) === v ? "selected" : ""}>${v} ore prima</option>`).join("")}</select></label></div></div>
    <div class="co-fs"><b>Quando sei disponibile</b> <small class="muted">tocca le ore libere, ogni settimana, a qualsiasi ora del giorno e della notte (nel tuo fuso orario). Tocca un giorno o un'ora per selezionare tutta la colonna o la riga.</small><div class="co-week"><div class="co-wh"></div>${CO_DAYS.map((x, dd) => `<button type="button" class="co-wh" data-cowc="${dd}">${x}</button>`).join("")}${CO_HOURS.map(h => `<button type="button" class="co-wt" data-cowr="${h}">${String(h).padStart(2, "0")}:00</button>${CO_DAYS.map((x, dd) => `<button type="button" class="co-ws ${has(dd, h) ? "on" : ""}" data-cows="${dd}:${h}" aria-label="${x} ${h}:00"></button>`).join("")}`).join("")}</div></div>
    <p class="muted" style="font-size:12.5px">Gli studenti possono annullare gratis fino a 12 ore prima; dopo, la lezione ti è dovuta. Tu puoi annullare solo oltre le 12 ore. Il pagamento online arriverà con il sito: per ora indichi tu allo studente come pagare.</p>
    ${me ? "" : `<div class="co-pend small">${coI("mail", 18)}<p>Dopo l'invio valutiamo il profilo: vogliamo che ogni studente trovi un coach preparato e una lezione professionale. Potremmo scriverti all'email indicata per chiederti ulteriori informazioni prima dell'approvazione.</p></div>`}
    <div class="co-mebtn"><button class="btn primary" id="cfSave">${me ? "Salva le modifiche" : "Invia il profilo"}</button>${me ? `<button class="btn ghost" id="cfCancel">Annulla</button>` : ""}<span class="muted" id="cfMsg" style="font-size:13px"></span></div></div>`;
  el.querySelectorAll("input,textarea").forEach(x => x.addEventListener("keydown", e => e.stopPropagation()));
  el.querySelectorAll('[data-cof="fm"]').forEach(x => x.addEventListener("change", () => { const f = [...el.querySelectorAll('[data-cof="fm"]:checked')].map(y => y.value); $("#cfLvBox").hidden = !f.includes("cash"); $("#cfAbiBox").hidden = !f.some(k => CO_TOUR.includes(k)); }));
  el.querySelectorAll("[data-coll]").forEach(x => x.onchange = () => { const cb = el.querySelector(`[data-cof="lang"][value="${x.dataset.coll}"]`); if (x.value && cb) cb.checked = true; });
  const sync = () => { d.name = $("#cfName").value; d.head = $("#cfHead").value; d.bio = $("#cfBio").value; d.exp = $("#cfExp").value; d.ideal = $("#cfIdeal").value; d.spx = $("#cfSpx").value; d.lx = { n: $("#cfLxN").value, l: $("#cfLxL").value }; d.ll = {}; el.querySelectorAll("[data-coll]").forEach(x => { if (x.value) d.ll[x.dataset.coll] = x.value; }); d.p60 = +$("#cfP60").value; d.p30 = +$("#cfP30").value; d.link = ""; d.em = $("#cfMail").value; d.win = +$("#cfWin").value; d.nt = +$("#cfNt").value; d.nr = +$("#cfNr").value; ["fm", "lv", "abi", "sp", "lang"].forEach(k => { d[k] = [...el.querySelectorAll(`[data-cof="${k}"]:checked`)].map(x => x.value); }); };
  el.querySelectorAll("[data-cows]").forEach(b => b.onclick = () => { const [dd, h] = b.dataset.cows.split(":").map(Number); const i = d.slots.findIndex(s => s[0] === dd && s[1] === h); if (i >= 0) d.slots.splice(i, 1); else d.slots.push([dd, h]); b.classList.toggle("on"); });
  const coSetMany = cells => { const allOn = cells.every(([dd, h]) => d.slots.some(s => s[0] === dd && s[1] === h)); cells.forEach(([dd, h]) => { const i = d.slots.findIndex(s => s[0] === dd && s[1] === h); if (allOn && i >= 0) d.slots.splice(i, 1); if (!allOn && i < 0) d.slots.push([dd, h]); const b = el.querySelector(`[data-cows="${dd}:${h}"]`); if (b) b.classList.toggle("on", !allOn); }); };
  el.querySelectorAll("[data-cowc]").forEach(b => b.onclick = () => { const dd = +b.dataset.cowc; coSetMany(CO_HOURS.map(h => [dd, h])); });
  el.querySelectorAll("[data-cowr]").forEach(b => b.onclick = () => { const h = +b.dataset.cowr; coSetMany(CO_DAYS.map((x, dd) => [dd, h])); });
  $("#cfPh").onchange = async e => { const f = e.target.files && e.target.files[0]; if (!f) return; sync(); $("#cfPhMsg").textContent = "Preparo la foto..."; try { d.ph = await coPhotoFile(f); coArea(el); } catch (er) { $("#cfPhMsg").textContent = er === "tipo" ? "Usa una foto JPG, PNG o WEBP." : er === "grande" ? "La foto è troppo grande." : "Non sono riuscito a leggere la foto."; } };
  if ($("#cfPhDel")) $("#cfPhDel").onclick = () => { sync(); d.ph = ""; coArea(el); };
  if ($("#cfCancel")) $("#cfCancel").onclick = () => { CO.draft = null; coArea(el); };
  $("#cfSave").onclick = async () => {
    sync(); const msg = $("#cfMsg");
    if (!coTxt(d.name, 40) || !coTxt(d.head, 90) || coLongTxt(d.bio, 1500).length < 40) { msg.textContent = "Servono nome, titolo e una presentazione di almeno 40 caratteri."; return; }
    if (!(d.p60 >= 5)) { msg.textContent = "Il prezzo di 60 minuti deve essere almeno 5 €."; return; }
    if (!coMail(d.em)) { msg.textContent = "Scrivi un'email valida: serve allo staff per contattarti."; return; }
    if (!d.slots.length) { msg.textContent = "Scegli almeno un'ora di disponibilità."; return; }
    if (!d.lang.length && !coTxt(d.lx && d.lx.n, 30)) { msg.textContent = "Scegli almeno una lingua."; return; }
    if (!(d.fm || []).length) { msg.textContent = "Scegli almeno una categoria: cash game, MTT, Spin & Go..."; return; }
    $("#cfSave").disabled = true; msg.textContent = "Salvo...";
    try { await LB.db.doc("cmail/" + LB.uid).set({ e: coMail(d.em) }); await LB.db.doc("coaches/" + LB.uid).set(coDoc(d)); CO.draft = null; await coLoad(); coArea(el); gToast(me ? "Profilo aggiornato." : "Profilo inviato: lo valutiamo e potremmo contattarti via email."); }
    catch (e) { $("#cfSave").disabled = false; msg.textContent = e && e.code === "invalid_argument" ? "Con questo accesso non puoi salvare un profilo." : "Non sono riuscito a salvare: riprova."; }
  };
}
const coDoc = d => ({ off: (d.off || []).slice(0, 30), ex: (d.ex || []).slice(0, 80), win: [14, 30, 60].includes(+d.win) ? +d.win : 30, nt: CO_NOTICE.includes(+d.nt) ? +d.nt : 12, nr: CO_NOTICE.includes(+d.nr) ? +d.nr : 2, qz: d.qz ? { s: coNum(d.qz.s, 0, 50), n: coNum(d.qz.n, 1, 50), d: coTxt(d.qz.d, 10) } : S.coQz && S.coQz.pass ? { s: S.coQz.s, n: S.coQz.n, d: S.coQz.d } : null, ph: coPh(d.ph), abi: (d.fm || []).some(k => CO_TOUR.includes(k)) ? (d.abi || []) : [], name: coTxt(d.name, 40), spx: coTxt(d.spx, 80), lx: d.lx && coTxt(d.lx.n, 30) ? { n: coTxt(d.lx.n, 30), l: d.lx.l || "" } : null, ideal: coTxt(d.ideal, 140), ll: Object.fromEntries((d.lang || []).filter(k => d.ll && d.ll[k]).map(k => [k, d.ll[k]])), head: coTxt(d.head, 90), bio: coLongTxt(d.bio, 1500), exp: coTxt(d.exp, 120), fm: d.fm || ["cash"], lv: (d.fm || []).includes("cash") ? (d.lv || []) : [], sp: d.sp || [], lang: d.lang || [], p60: coNum(d.p60, 5, 1000), p30: coNum(d.p30, 0, 1000), link: "", slots: (d.slots || []).slice(0, 168), tz: new Date().getTimezoneOffset() * -1, pause: !!d.pause, date: d.date || today() });
/* ---------- aula della lezione: tutto dentro il sito, senza link esterni ----------
   Coach e studente entrano qui. La presenza in diretta passa dalla stanza dell'app; l'ingresso viene salvato
   (studente in rq, coach in cr) così si sa chi c'era. Il video vero arriverà con il sito definitivo. */
const CO_AULA_PRE = 15 * 60000, CO_AULA_POST = 30 * 60000;
const coAulaOpen = b => Date.now() >= b.start - CO_AULA_PRE && Date.now() <= b.start + b.dur * 60000 + CO_AULA_POST;
let COA = { offs: [], tick: 0, peers: [] };
function coAulaGo(bid) { CO.aula = bid; if (CO.tab !== "aula") CO.aback = CO.tab; coGo("aula"); }
function coAulaLeave() { clearInterval(COA.tick); COA.offs.forEach(f => { try { f(); } catch (e) {} }); COA.offs = []; if (BTR.room) BTR.room.presence({ aula: null }).catch(() => {}); }
async function coAulaCheckin(b, asCoach) {
  try {
    if (asCoach) { const cur = { ...((CO.D.crMine && CO.D.crMine.r) || {}) }; const o = cur[b.id] || {}; if (o.in) return; cur[b.id] = { ...o, st: o.st || "ok", in: Date.now(), at: o.at || Date.now() }; await LB.db.doc("cr/" + LB.uid).set({ r: cur }); CO.D.crMine = { ...(CO.D.crMine || {}), r: cur }; }
    else { const cur = { ...((CO.D.rqMine && CO.D.rqMine.b) || {}) }; if (!cur[b.id] || cur[b.id].in) return; cur[b.id] = { ...cur[b.id], in: Date.now() }; await LB.db.doc("rq/" + LB.uid).set({ b: cur }); CO.D.rqMine = { ...(CO.D.rqMine || {}), b: cur }; }
  } catch (e) {}
}
function coAula(el) {
  coAulaLeave();
  const b = CO.D.books.find(x => x.id === CO.aula); if (!b) { CO.tab = CO.aback || "mine"; return coBody(); }
  const c = CO.D.coaches.find(x => x.id === b.coach), asCoach = b.coach === LB.uid, other = asCoach ? b.sname : (c ? c.name : "Coach");
  const hh = t => new Date(t).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  const tile = (who, name, pic, me) => `<div class="co-tile ${me ? "me" : ""}" data-cotile="${who}"><div class="co-tpic">${pic}</div><b>${esc(name)}${me ? " (tu)" : ""}</b><span class="co-tst" data-cotst="${who}">${me ? "Nell'aula" : "Non ancora entrato"}</span></div>`;
  el.innerHTML = `<button class="co-back" data-coaback>${coI("back", 16)} Esci dall'aula</button>
    <div class="co-aula">
      <div class="co-ahead"><div><span class="co-kick">${coI("video", 15)} Aula della lezione</span><h2>${b.trial ? "Lezione di prova" : "Lezione"} con ${esc(other)}</h2><p>${esc(coWhen(b.start))} - ${hh(b.start + b.dur * 60000)} · ${b.dur} minuti</p></div><div class="co-atime"><small id="coaLab">-</small><b id="coaClock">--:--</b></div></div>
      <div class="co-stage">${tile(asCoach ? "c" : "s", asCoach ? (c ? c.name : "Coach") : b.sname, asCoach ? coPic(c, 92) : coAv(b.sname, 92), true)}${tile(asCoach ? "s" : "c", other, asCoach ? coAv(b.sname, 92) : coPic(c, 92), false)}
        <div class="co-vnote">${coI("video", 18)}<span>Qui ci sarà la videochiamata con audio, video e condivisione dello schermo, tutta dentro il sito. In questa versione di prova l'aula registra chi entra e quando, e mostra in diretta chi è presente.</span></div></div>
      <div class="co-abar">${asCoach && b.start <= Date.now() && (b.st === "ok" || b.st === "wait") ? `<button class="btn primary" data-coadone>Segna come svolta</button>` : ""}<span class="muted" id="coaInfo"></span></div>
      ${b.msg ? `<div class="co-amsg"><b>Cosa vuole migliorare lo studente</b><p>${esc(b.msg)}</p></div>` : ""}
    </div>`;
  el.querySelector("[data-coaback]").onclick = () => { coAulaLeave(); coGo(CO.aback || (asCoach ? "coach" : "mine")); };
  const dn = el.querySelector("[data-coadone]"); if (dn) dn.onclick = async () => { dn.disabled = true; const cur = { ...((CO.D.crMine && CO.D.crMine.r) || {}) }; cur[b.id] = { ...(cur[b.id] || {}), st: "done", at: Date.now() }; try { await LB.db.doc("cr/" + LB.uid).set({ r: cur }); await coLoad(); gToast("Lezione segnata come svolta."); coAula(el); } catch (e) { dn.disabled = false; } };
  const clock = () => {
    const now = Date.now(), lab = el.querySelector("#coaLab"), ck = el.querySelector("#coaClock"); if (!lab) return coAulaLeave();
    const end = b.start + b.dur * 60000, f = ms => { const s = Math.max(0, Math.round(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
    if (now < b.start) { lab.textContent = "Inizia tra"; ck.textContent = f(b.start - now); } else if (now < end) { lab.textContent = "Tempo rimasto"; ck.textContent = f(end - now); } else { lab.textContent = "Lezione terminata"; ck.textContent = "00:00"; }
  };
  clock(); COA.tick = setInterval(clock, 1000);
  const open = coAulaOpen(b) && (b.st === "ok" || b.st === "wait" || b.st === "done");
  const info = el.querySelector("#coaInfo");
  if (!open) { info.textContent = Date.now() < b.start - CO_AULA_PRE ? "L'aula si apre 15 minuti prima dell'inizio." : b.st === "cancel" || b.st === "late" || b.st === "no" ? "Questa lezione è stata annullata." : "L'aula è chiusa."; return; }
  coAulaCheckin(b, asCoach);
  btRoomInit().then(R => {
    if (!R.room || CO.tab !== "aula" || CO.aula !== b.id) return;
    const me = { b: b.id, u: LB.uid, r: asCoach ? "c" : "s", t: Date.now() };
    R.room.presence({ aula: me }).catch(() => {});
    const paint = peers => {
      const there = (peers || []).some(p => !p.sameTab && p.presence && p.presence.aula && p.presence.aula.b === b.id && p.presence.aula.r === (asCoach ? "s" : "c"));
      const t = el.querySelector(`[data-cotst="${asCoach ? "s" : "c"}"]`), tl = el.querySelector(`[data-cotile="${asCoach ? "s" : "c"}"]`);
      if (t) t.textContent = there ? "Nell'aula" : "Non ancora entrato"; if (tl) tl.classList.toggle("in", there);
    };
    try { paint(R.room.peers ? R.room.peers() : []); } catch (e) {}
    COA.offs.push(R.room.onPeers(ch => paint(ch.peers), () => {}));
  });
}
/* ---------- menu a tendina dell'area coaching (sostituisce la tendina del sistema, bianca e blu) ----------
   Il <select> resta nella pagina, nascosto: il menu ne cambia il valore e lancia "change", così il resto del codice non cambia. */
let CODD = null;
function coDDClose() { if (!CODD) return; const { p, b } = CODD; p.remove(); b.setAttribute("aria-expanded", "false"); b.classList.remove("open"); document.removeEventListener("pointerdown", CODD.out, true); window.removeEventListener("resize", coDDClose); window.removeEventListener("scroll", CODD.sc, true); CODD = null; }
function coDDOpen(sel, b) {
  if (CODD && CODD.b === b) return coDDClose(); coDDClose(); if (sel.disabled) return;
  const p = document.createElement("div"); p.className = "co-ddp"; p.setAttribute("role", "listbox");
  const opts = [...sel.options], chk = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
  const ob = o => { const i = opts.indexOf(o); return `<button type="button" role="option" class="co-ddo ${o.value === sel.value ? "on" : ""}" aria-selected="${o.value === sel.value}" data-ddi="${i}" ${o.disabled ? "disabled" : ""}><span>${esc(o.textContent)}</span>${chk}</button>`; };
  const body = [...sel.children].map(n => n.tagName === "OPTGROUP" ? `<div class="co-ddg" data-ddg><div class="co-ddgh">${esc(n.label)}</div>${[...n.children].map(ob).join("")}</div>` : ob(n)).join("");
  const big = opts.length > 14;
  p.innerHTML = (big ? `<div class="co-dds"><input type="search" placeholder="Cerca..." aria-label="Cerca" autocomplete="off"></div>` : "") + body;
  if (big) p.classList.add("big");
  document.body.appendChild(p);
  const r = b.getBoundingClientRect(), vh = window.innerHeight, below = vh - r.bottom - 12, above = r.top - 12, up = below < 220 && above > below;
  p.style.left = Math.max(8, Math.min(r.left, window.innerWidth - Math.max(r.width, 200) - 8)) + "px"; p.style.minWidth = Math.max(r.width, 200) + "px";
  p.style.maxHeight = Math.max(160, Math.min(340, up ? above : below)) + "px";
  if (up) { p.style.bottom = (vh - r.top + 6) + "px"; p.classList.add("up"); } else p.style.top = (r.bottom + 6) + "px";
  { const pw = p.offsetWidth; p.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pw - 8)) + "px"; }
  b.setAttribute("aria-expanded", "true"); b.classList.add("open");
  const pick = i => { const o = opts[i]; if (!o || o.disabled) return; coDDClose(); if (sel.value !== o.value) { sel.value = o.value; sel.dispatchEvent(new Event("input", { bubbles: true })); sel.dispatchEvent(new Event("change", { bubbles: true })); } coDDLabel(sel, b); b.focus(); };
  p.querySelectorAll("[data-ddi]").forEach(x => x.onclick = () => pick(+x.dataset.ddi));
  const sI = p.querySelector(".co-dds input");
  if (sI) { sI.addEventListener("input", () => { const q = sI.value.trim().toLowerCase(); p.querySelectorAll("[data-ddi]").forEach(x => { x.hidden = q && !x.textContent.toLowerCase().includes(q); }); p.querySelectorAll("[data-ddg]").forEach(g => { g.hidden = ![...g.querySelectorAll("[data-ddi]")].some(x => !x.hidden); }); });
    sI.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "ArrowDown") { e.preventDefault(); const f = [...p.querySelectorAll("[data-ddi]")].find(x => !x.hidden && !x.disabled); if (f) f.focus(); } else if (e.key === "Escape") { coDDClose(); b.focus(); } else if (e.key === "Enter") { e.preventDefault(); const f = [...p.querySelectorAll("[data-ddi]")].find(x => !x.hidden && !x.disabled); if (f) f.click(); } }); }
  p.addEventListener("keydown", e => {
    if (e.target && e.target.tagName === "INPUT") return;
    e.stopPropagation(); const L = [...p.querySelectorAll("[data-ddi]:not([disabled])")].filter(x => !x.hidden), k = L.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); (L[k + 1] || L[0]).focus(); } else if (e.key === "ArrowUp") { e.preventDefault(); (L[k - 1] || L[L.length - 1]).focus(); }
    else if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); coDDClose(); b.focus(); }
  });
  const cur = p.querySelector(".co-ddo.on") || p.querySelector("[data-ddi]"); if (sI) sI.focus({ preventScroll: true }); else if (cur) cur.focus({ preventScroll: true }); if (cur) cur.scrollIntoView({ block: "nearest" });
  const out = e => { if (!p.contains(e.target) && e.target !== b && !b.contains(e.target)) coDDClose(); };
  const sc = e => { if (!p.contains(e.target)) coDDClose(); };
  CODD = { p, b, out, sc };
  setTimeout(() => { if (CODD && CODD.p === p) { document.addEventListener("pointerdown", out, true); window.addEventListener("resize", coDDClose); window.addEventListener("scroll", sc, true); } }, 0);
}
function coDDLabel(sel, b) { const o = sel.options[sel.selectedIndex]; b.querySelector("span").textContent = o ? o.textContent : ""; }
function coDDEnhance(sel) {
  const gl = !sel.closest(".co2, .cowide, .retools, .co-pf"), gw = gl ? sel.offsetWidth : 0, gpw = gl && sel.parentElement ? sel.parentElement.clientWidth : 0, gcs = gl ? getComputedStyle(sel) : null;
  sel.dataset.dd = "1"; sel.classList.add("co-ddsrc"); sel.tabIndex = -1; sel.setAttribute("aria-hidden", "true");
  const b = document.createElement("button"); b.type = "button"; b.className = "co-ddb" + (sel.closest(".co-pf") ? " inpf" : "");
  b.setAttribute("aria-haspopup", "listbox"); b.setAttribute("aria-expanded", "false");
  const lab = sel.getAttribute("aria-label") || (sel.closest("label") ? (sel.closest("label").querySelector("small") || {}).textContent : ""); if (lab) b.setAttribute("aria-label", lab);
  b.innerHTML = `<span></span><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
  if (gl) { b.classList.add("gl"); if (gcs.flex && gcs.flex !== "0 1 auto") b.style.flex = gcs.flex; if (gcs.marginTop !== "0px" || gcs.marginBottom !== "0px") b.style.margin = gcs.margin;
    if (gw > 0 && gpw > 0 && gw < gpw - 6 && !/display:\s*block|width:\s*100%/.test(sel.getAttribute("style") || "")) { b.style.width = "auto"; b.style.minWidth = Math.max(120, gw) + "px"; } }
  sel.insertAdjacentElement("afterend", b); coDDLabel(sel, b);
  b.onclick = e => { e.preventDefault(); e.stopPropagation(); coDDOpen(sel, b); };
  b.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); coDDOpen(sel, b); } });
  sel.addEventListener("change", () => coDDLabel(sel, b));
  const pf = sel.closest(".co-pf"); if (pf) pf.addEventListener("click", e => { if (e.target === pf || e.target.tagName === "SMALL") { e.preventDefault(); coDDOpen(sel, b); } });
}
/* ---------- calendario personalizzato al posto di quello del sistema (assenze, ore extra) ----------
   L'<input type="date"> resta nascosto e riceve il valore; qui si disegna un calendario nello stile dell'app. */
let CODP = null;
const DP_MON = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const dpStr = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const dpParse = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
const dpLabel = s => { const d = dpParse(s); if (!d) return "Scegli il giorno"; const o = { weekday: "short", day: "numeric", month: "short" }; if (d.getFullYear() !== new Date().getFullYear()) o.year = "numeric"; return d.toLocaleDateString("it-IT", o).replace(/\./g, ""); };
function coDPClose() { if (!CODP) return; CODP.p.remove(); CODP.b.classList.remove("open"); CODP.b.setAttribute("aria-expanded", "false"); document.removeEventListener("pointerdown", CODP.out, true); window.removeEventListener("resize", coDPClose); window.removeEventListener("scroll", CODP.sc, true); CODP = null; }
function coDPOpen(inp, b) {
  if (CODP && CODP.b === b) return coDPClose(); coDPClose(); if (typeof coDDClose === "function") coDDClose();
  const p = document.createElement("div"); p.className = "co-dp"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Scegli il giorno");
  const sel = dpParse(inp.value), min = dpParse(inp.min), max = dpParse(inp.max), today = new Date(); today.setHours(0, 0, 0, 0);
  let view = new Date((sel || min || today).getFullYear(), (sel || min || today).getMonth(), 1);
  const paint = () => {
    const y = view.getFullYear(), mo = view.getMonth(), first = (new Date(y, mo, 1).getDay() + 6) % 7, days = new Date(y, mo + 1, 0).getDate();
    const prevOk = !min || new Date(y, mo, 0) >= min, nextOk = !max || new Date(y, mo + 1, 1) <= max;
    let cells = ""; for (let i = 0; i < first; i++) cells += `<span></span>`;
    for (let d = 1; d <= days; d++) { const dt = new Date(y, mo, d), s = dpStr(dt), off = (min && dt < min) || (max && dt > max); cells += `<button type="button" class="dp-d ${s === inp.value ? "on" : ""} ${dt.getTime() === today.getTime() ? "today" : ""} ${(dt.getDay() + 6) % 7 >= 5 ? "we" : ""}" data-dpd="${s}" ${off ? "disabled" : ""}>${d}</button>`; }
    p.innerHTML = `<div class="dp-h"><button type="button" class="dp-n" data-dpm="-1" ${prevOk ? "" : "disabled"} aria-label="Mese precedente">‹</button><b>${DP_MON[mo]} ${y}</b><button type="button" class="dp-n" data-dpm="1" ${nextOk ? "" : "disabled"} aria-label="Mese successivo">›</button></div>
      <div class="dp-w">${["lun", "mar", "mer", "gio", "ven", "sab", "dom"].map(x => `<span>${x}</span>`).join("")}</div><div class="dp-g">${cells}</div>
      <div class="dp-f"><button type="button" data-dpt ${(min && today < min) || (max && today > max) ? "disabled" : ""}>Oggi</button><button type="button" data-dpx>Chiudi</button></div>`;
    p.querySelectorAll("[data-dpm]").forEach(x => x.onclick = () => { view = new Date(y, mo + +x.dataset.dpm, 1); paint(); });
    p.querySelectorAll("[data-dpd]").forEach(x => x.onclick = () => pick(x.dataset.dpd));
    const t = p.querySelector("[data-dpt]"); t.onclick = () => pick(dpStr(today));
    p.querySelector("[data-dpx]").onclick = () => { coDPClose(); b.focus(); };
  };
  const pick = s => { inp.value = s; inp.dispatchEvent(new Event("input", { bubbles: true })); inp.dispatchEvent(new Event("change", { bubbles: true })); coDPLabel(inp, b); coDPClose(); b.focus(); };
  paint(); document.body.appendChild(p);
  const r = b.getBoundingClientRect(), vh = window.innerHeight, ph = p.offsetHeight, pw = p.offsetWidth, up = vh - r.bottom < ph + 12 && r.top > ph + 12;
  p.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pw - 8)) + "px";
  if (up) { p.style.bottom = (vh - r.top + 6) + "px"; p.classList.add("up"); } else p.style.top = Math.min(r.bottom + 6, vh - ph - 8) + "px";
  b.classList.add("open"); b.setAttribute("aria-expanded", "true");
  p.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Escape") { coDPClose(); b.focus(); } });
  const f = p.querySelector(".dp-d.on") || p.querySelector(".dp-d.today:not([disabled])") || p.querySelector(".dp-d:not([disabled])"); if (f) f.focus({ preventScroll: true });
  const out = e => { if (!p.contains(e.target) && e.target !== b && !b.contains(e.target)) coDPClose(); };
  const sc = e => { if (!p.contains(e.target)) coDPClose(); };
  CODP = { p, b, out, sc };
  setTimeout(() => { if (CODP && CODP.p === p) { document.addEventListener("pointerdown", out, true); window.addEventListener("resize", coDPClose); window.addEventListener("scroll", sc, true); } }, 0);
}
function coDPLabel(inp, b) { b.querySelector("span").textContent = dpLabel(inp.value); }
function coDPEnhance(inp) {
  inp.dataset.dp = "1"; inp.classList.add("co-ddsrc"); inp.tabIndex = -1; inp.setAttribute("aria-hidden", "true");
  const b = document.createElement("button"); b.type = "button"; b.className = "co-ddb co-dpb"; b.setAttribute("aria-haspopup", "dialog"); b.setAttribute("aria-expanded", "false");
  b.innerHTML = `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/></svg><span></span>`;
  inp.insertAdjacentElement("afterend", b); coDPLabel(inp, b);
  b.onclick = e => { e.preventDefault(); e.stopPropagation(); coDPOpen(inp, b); };
  inp.addEventListener("change", () => coDPLabel(inp, b));
}
/* scelta file nello stile dell'app (al posto di "Choose Files / No file chosen" del sistema) */
function fpEnhance(inp) {
  inp.dataset.fp = "1"; if (inp.hidden || /display:\s*none/.test(inp.getAttribute("style") || "")) return;
  const many = inp.multiple, w = document.createElement("div"); w.className = "fpick";
  w.innerHTML = `<button type="button" class="btn ghost fpick-b"><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5"/><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/></svg>${inp.webkitdirectory ? "Scegli una cartella" : many ? "Scegli i file" : "Scegli il file"}</button><span class="fpick-n muted"></span>`;
  inp.classList.add("co-ddsrc"); inp.tabIndex = -1; inp.insertAdjacentElement("afterend", w);
  const n = w.querySelector(".fpick-n"), paint = () => { const f = inp.files ? [...inp.files] : []; n.textContent = !f.length ? (inp.webkitdirectory ? "Nessuna cartella scelta" : "Nessun file scelto") : f.length === 1 ? f[0].name : f.length + " file scelti"; };
  w.querySelector("button").onclick = () => inp.click(); inp.addEventListener("change", paint); paint();
  w.addEventListener("dragover", e => { e.preventDefault(); w.classList.add("drag"); }); w.addEventListener("dragleave", () => w.classList.remove("drag"));
  w.addEventListener("drop", e => { e.preventDefault(); w.classList.remove("drag"); if (e.dataTransfer && e.dataTransfer.files.length) { try { inp.files = e.dataTransfer.files; inp.dispatchEvent(new Event("change", { bubbles: true })); } catch (er) {} } });
}
let coDDRaf = 0;
/* righe che scorrono di lato: sfumatura sul bordo dove c'è altro da vedere */
const HS_SEL = ".co-tabs, .co-tabs2, .gwtabs, .car-ladder, .gwstrip";
function hsEdge(el) { const m = el.scrollWidth - el.clientWidth; el.classList.toggle("hsl", m > 4 && el.scrollLeft > 4); el.classList.toggle("hsr", m > 4 && el.scrollLeft < m - 4); }
function hsScan() { document.querySelectorAll(HS_SEL).forEach(el => { if (!el.dataset.hs) { el.dataset.hs = "1"; el.addEventListener("scroll", () => hsEdge(el), { passive: true }); } hsEdge(el); }); }
try { window.addEventListener("resize", () => { try { hsScan(); } catch (e) {} }); } catch (e) {}
/* tabelle di testo troppo larghe per il telefono: ogni riga diventa una scheda con le etichette delle colonne */
function tblStack() { document.querySelectorAll(".otable table:not([data-stk])").forEach(t => { const w = t.parentElement.clientWidth; if (!w) return; t.dataset.stk = "0";
  const hs = [...t.querySelectorAll("thead th")].map(h => h.textContent.trim()); if (hs.length < 3 || t.querySelector("input,select,button")) return;
  if (t.scrollWidth <= w + 4) return; t.dataset.stk = "1"; t.classList.add("stk"); t.querySelectorAll("tbody tr").forEach(r => [...r.children].forEach((c, i) => { if (hs[i]) c.dataset.l = hs[i]; })); }); }
try { document.addEventListener("toggle", () => { try { tblStack(); } catch (e) {} }, true); window.addEventListener("resize", () => { try { tblStack(); } catch (e) {} }); } catch (e) {}
function coDDScan() { coDDRaf = 0; try { hsScan(); tblStack(); } catch (e) {} document.querySelectorAll('input[type="file"]:not([data-fp])').forEach(i => { try { fpEnhance(i); } catch (e) {} }); document.querySelectorAll("select:not([data-dd]):not([multiple]):not([data-native])").forEach(sel => { if (sel.size > 1) return; try { coDDEnhance(sel); } catch (e) {} });
  document.querySelectorAll("select[data-dd]").forEach(sel => { const b = sel.nextElementSibling; if (b && b.classList.contains("co-ddb") && b !== (CODD && CODD.b)) { const o = sel.options[sel.selectedIndex], t = o ? o.textContent : ""; const sp = b.querySelector("span"); if (sp && sp.textContent !== t) sp.textContent = t; b.disabled = sel.disabled; } });
  document.querySelectorAll('.co2 input[type="date"]:not([data-dp]), .cowide input[type="date"]:not([data-dp])').forEach(coDPEnhance);
  if (CODP && !document.body.contains(CODP.b)) coDPClose(); if (CODD && !document.body.contains(CODD.b)) coDDClose(); }
try { new MutationObserver(() => { if (!coDDRaf) coDDRaf = requestAnimationFrame(coDDScan); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
/* ---------- assenze e ore extra del coach ---------- */
function coAvailBox(me) {
  const fd = ds => new Date(ds + "T12:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
  const td = coDayStr(Date.now() - new Date().getTimezoneOffset() * 60000);
  const offs = (me.off || []).map((o, i) => [o, i]).filter(([o]) => o[1] >= td), exs = (me.ex || []).map((o, i) => [o, i]).filter(([o]) => o[0] >= td).sort((a, b) => (a[0][0] + String(a[0][1]).padStart(2, "0")).localeCompare(b[0][0] + String(b[0][1]).padStart(2, "0")));
  return `<div class="co-avail"><div class="co-avc"><h4>${coI("cal", 18)} Assenze</h4><p class="muted">Nei giorni di assenza non compari nel calendario. Le lezioni già prenotate in quei giorni vengono annullate.</p>
      ${offs.length ? `<ul class="co-avl">${offs.map(([o, i]) => `<li><span><b>${fd(o[0])}${o[1] !== o[0] ? " – " + fd(o[1]) : ""}</b>${o[2] ? `<small>${esc(o[2])}</small>` : ""}</span><button data-cooffdel="${i}" aria-label="Togli assenza">×</button></li>`).join("")}</ul>` : ""}
      <div class="co-avf"><label class="of">Dal<input type="date" id="caOffA" min="${td}" value="${td}"></label><label class="of">Al<input type="date" id="caOffB" min="${td}" value="${td}"></label><label class="of">Nota (facoltativa)<input type="text" id="caOffL" maxlength="40" placeholder="Es. vacanza"></label><button class="btn small" id="caOffGo">Aggiungi assenza</button></div></div>
    <div class="co-avc"><h4>${coI("clock", 18)} Ore extra</h4><p class="muted">Apri un orario in più per un giorno preciso, senza cambiare la tua settimana tipo.</p>
      ${exs.length ? `<ul class="co-avl">${exs.map(([o, i]) => `<li><span><b>${fd(o[0])} · ${String(o[1]).padStart(2, "0")}:00</b></span><button data-coexdel="${i}" aria-label="Togli ora extra">×</button></li>`).join("")}</ul>` : ""}
      <div class="co-avf"><label class="of">Giorno<input type="date" id="caExD" min="${td}" value="${td}"></label><label class="of">Ora<select id="caExH">${CO_HOURS.map(h => `<option value="${h}" ${h === 18 ? "selected" : ""}>${String(h).padStart(2, "0")}:00</option>`).join("")}</select></label><button class="btn small" id="caExGo">Aggiungi ora</button></div></div>
    <p class="co-avmsg muted" id="caMsg"></p></div>`;
}
function coAvailBind(el, me) {
  const msg = t => { const m = el.querySelector("#caMsg"); if (m) m.textContent = t; };
  const save = async (patch, cancelIn) => {
    try {
      await LB.db.doc("coaches/" + LB.uid).set(coDoc({ ...me, ...patch }));
      if (cancelIn) {
        const hit = CO.D.books.filter(b => b.coach === LB.uid && b.st === "ok" && b.start > Date.now()).filter(b => { const ds = coDayStr(b.start + me.tz * 60000); return ds >= cancelIn[0] && ds <= cancelIn[1]; });
        if (hit.length) { const cur = { ...((CO.D.crMine && CO.D.crMine.r) || {}) }; hit.forEach(b => { cur[b.id] = { st: "no", note: "Il coach è assente in quei giorni: lezione annullata.", at: Date.now() }; }); await LB.db.doc("cr/" + LB.uid).set({ r: cur }); gToast(hit.length === 1 ? "1 lezione in quei giorni è stata annullata." : hit.length + " lezioni in quei giorni sono state annullate."); }
      }
      await coLoad(); coArea(el);
    } catch (e) { msg("Non sono riuscito a salvare: riprova."); }
  };
  el.querySelectorAll(".co-avail input").forEach(x => x.addEventListener("keydown", e => e.stopPropagation()));
  const oA = el.querySelector("#caOffA"), oB = el.querySelector("#caOffB");
  if (oA && oB) { oA.addEventListener("change", () => { oB.min = oA.value; if (!oB.value || oB.value < oA.value) { oB.value = oA.value; oB.dispatchEvent(new Event("change")); } }); }
  const og = el.querySelector("#caOffGo"); if (og) og.onclick = () => {
    const a = el.querySelector("#caOffA").value, b = el.querySelector("#caOffB").value || a, l = coTxt(el.querySelector("#caOffL").value, 40);
    if (!a) return msg("Scegli il primo giorno di assenza."); const B = b < a ? a : b;
    const hit = CO.D.books.filter(x => x.coach === LB.uid && x.st === "ok" && x.start > Date.now()).filter(x => { const ds = coDayStr(x.start + me.tz * 60000); return ds >= a && ds <= B; }).length;
    const go = () => save({ off: [...(me.off || []), [a, B, l]] }, [a, B]);
    if (!hit) return go();
    gModal(`<span class="eyebrow">Assenza</span><h3 style="margin:4px 0 8px">Ci sono lezioni prenotate</h3><p>In quei giorni hai <b>${hit}</b> ${hit === 1 ? "lezione prenotata" : "lezioni prenotate"}: aggiungendo l'assenza ${hit === 1 ? "verrà annullata" : "verranno annullate"} e lo studente lo vedrà in «Le mie lezioni».</p><div class="co-mebtn"><button class="btn primary" id="caOk">Aggiungi e annulla</button><button class="btn ghost" id="caNo">Lascia stare</button></div>`, (m, close) => { m.querySelector("#caNo").onclick = close; m.querySelector("#caOk").onclick = () => { close(); go(); }; });
  };
  const eg = el.querySelector("#caExGo"); if (eg) eg.onclick = () => {
    const d = el.querySelector("#caExD").value, h = +el.querySelector("#caExH").value; if (!d) return msg("Scegli il giorno.");
    if ((me.ex || []).some(o => o[0] === d && o[1] === h)) return msg("Quest'ora c'è già.");
    save({ ex: [...(me.ex || []), [d, h]] });
  };
  el.querySelectorAll("[data-cooffdel]").forEach(b => b.onclick = () => save({ off: (me.off || []).filter((_, i) => i !== +b.dataset.cooffdel) }));
  el.querySelectorAll("[data-coexdel]").forEach(b => b.onclick = () => save({ ex: (me.ex || []).filter((_, i) => i !== +b.dataset.coexdel) }));
}
/* ---------- contatto via email dalle approvazioni (lo invia il proprietario dalla sua casella) ---------- */
const CO_MAILT = {
  ok: ["Il tuo profilo da coach è approvato", n => `Ciao ${n},\n\nil tuo profilo da coach su Orca School Poker è stato approvato: da adesso compari nella ricerca e gli studenti possono prenotare negli orari liberi del tuo calendario.\n\nTi consigliamo di tenere aggiornati gli orari e di segnare le assenze.\n\nBuone lezioni,\nlo staff di Orca School Poker`],
  fix: ["Il tuo profilo da coach: servono alcune modifiche", n => `Ciao ${n},\n\ngrazie per esserti proposto come coach su Orca School Poker. Prima di approvare il profilo ti chiediamo alcune modifiche:\n\n- \n\nQuando le hai fatte, rispondi a questa email.\n\nGrazie,\nlo staff di Orca School Poker`],
  stop: ["Il tuo profilo da coach è sospeso", n => `Ciao ${n},\n\nil tuo profilo da coach su Orca School Poker è stato sospeso per questo motivo:\n\n- \n\nPer qualsiasi chiarimento rispondi a questa email.\n\nLo staff di Orca School Poker`],
  free: ["Orca School Poker: coaching", n => `Ciao ${n},\n\n\n\nLo staff di Orca School Poker`]
};
function coMailOpen(cid) {
  const c = CO.D.coaches.find(x => x.id === cid); if (!c) return;
  const em = CO.D.mails[cid] || "", ok = CO.D.okSet.has(cid);
  let t = ok ? "ok" : "fix";
  gModal(`<span class="eyebrow">Contatta il coach</span><h3 style="margin:4px 0 10px">${esc(c.name)}</h3>
    ${em ? `<div class="co-mailto">${coI("mail", 18)}<b>${esc(em)}</b></div>` : `<p class="co-nor">Questo coach non ha ancora lasciato l'email (profilo creato prima di questa novità). La chiederemo alla prossima modifica del profilo.</p>`}
    <div class="co-mtpl">${[["ok", "Approvato"], ["fix", "Servono modifiche"], ["stop", "Sospeso"], ["free", "Messaggio libero"]].map(([k, l]) => `<button data-cmt="${k}">${l}</button>`).join("")}</div>
    <label class="of">Oggetto<input type="text" id="cmSub" maxlength="140"></label>
    <label class="of">Messaggio<textarea id="cmBody" rows="9" maxlength="3000"></textarea></label>
    <div class="co-mebtn">${em ? `<a class="btn primary" id="cmGo" target="_blank" rel="noopener">${coI("mail", 16)} Apri nella tua email</a>` : ""}<button class="btn ghost" id="cmCopy">Copia il testo</button><span class="muted" id="cmMsg" style="font-size:13px"></span></div>
    <p class="muted" style="font-size:12px;margin-top:8px">Si apre la tua app di posta con il messaggio già scritto: controllalo e invialo tu.</p>`, m => {
    m.querySelector(".gmbox").classList.add("cowide");
    const sub = m.querySelector("#cmSub"), body = m.querySelector("#cmBody"), go = m.querySelector("#cmGo");
    [sub, body].forEach(x => x.addEventListener("keydown", e => e.stopPropagation()));
    const upd = () => { if (go) go.href = "mailto:" + encodeURIComponent(em).replace(/%40/g, "@") + "?subject=" + encodeURIComponent(sub.value) + "&body=" + encodeURIComponent(body.value); };
    const pick = k => { t = k; m.querySelectorAll("[data-cmt]").forEach(b => b.classList.toggle("on", b.dataset.cmt === k)); sub.value = CO_MAILT[k][0]; body.value = CO_MAILT[k][1](c.name); upd(); };
    m.querySelectorAll("[data-cmt]").forEach(b => b.onclick = () => pick(b.dataset.cmt));
    sub.oninput = upd; body.oninput = upd; pick(t);
    m.querySelector("#cmCopy").onclick = async () => {
      const txt = (em ? "A: " + em + "\n" : "") + "Oggetto: " + sub.value + "\n\n" + body.value;
      let done = false; try { await navigator.clipboard.writeText(txt); done = true; } catch (e) {}
      if (!done) { try { body.focus(); body.select(); done = document.execCommand("copy"); } catch (e) {} }
      m.querySelector("#cmMsg").textContent = done ? "Testo copiato." : "Seleziona il testo e copialo a mano.";
    };
  });
}
/* ---------- segnala un coach ----------
   Chi ha un accesso può segnalare un coach allo staff: crep/<id di chi segnala> {r:{coachId:{why,t,name,ts}}}.
   Le segnalazioni le legge solo lo staff; il coach non le vede. Lo staff segna come viste in coadm/main. */
const CO_REP = [["noshow", "Non si è presentato alla lezione"], ["rude", "Comportamento scorretto o offensivo"], ["fake", "Profilo falso o informazioni non vere"], ["pay", "Chiede pagamenti fuori dalle regole"], ["bad", "Lezione non professionale o di scarsa qualità"], ["other", "Altro"]];
const coRepName = k => (CO_REP.find(x => x[0] === k) || ["", "Altro"])[1];
const coReps = cid => (CO.D && CO.D.reps ? CO.D.reps : []).filter(r => r.coach === cid);
const coRepNew = cid => coReps(cid).filter(r => !(CO.D.seen || {})[r.key]);
/* verifica anti-bot fatta in casa: tocca le carte di un seme, più un campo trappola e un tempo minimo.
   Sul sito vero si aggiungerà una verifica lato server. */
const CO_SUITS = [["s", "♠", "picche"], ["h", "♥", "cuori"], ["d", "♦", "quadri"], ["c", "♣", "fiori"]];
function coCapNew() {
  const t = CO_SUITS[Math.floor(Math.random() * 4)], n = 2 + Math.floor(Math.random() * 2), ranks = "A23456789TJQK".split("").sort(() => Math.random() - 0.5);
  const others = CO_SUITS.filter(x => x[0] !== t[0]);
  const cards = [...Array(6)].map((_, i) => ({ r: ranks[i], s: i < n ? t : others[Math.floor(Math.random() * 3)] })).sort(() => Math.random() - 0.5);
  return { t, cards, pick: new Set() };
}
const coCapHtml = K => `<div class="co-cap"><p><b>Verifica di non essere un bot:</b> tocca tutte le carte di <b>${K.t[2]} ${K.t[1]}</b></p><div class="co-capc">${K.cards.map((c, i) => `<button type="button" class="co-capk ${c.s[0] === "h" || c.s[0] === "d" ? "red" : ""} ${K.pick.has(i) ? "on" : ""}" data-capk="${i}" aria-label="${c.r === "T" ? "10" : c.r} di ${c.s[2]}"><b>${c.r === "T" ? "10" : c.r}</b><i>${c.s[1]}</i></button>`).join("")}</div><button type="button" class="co-capnew" data-capnew>Cambia carte</button></div>`;
const coCapOk = K => K.cards.every((c, i) => (c.s[0] === K.t[0]) === K.pick.has(i));
function coReport(cid) {
  const c = CO.D.coaches.find(x => x.id === cid); if (!c) return;
  if (!LB.uid) { gToast("Per segnalare serve un accesso con il tuo account."); return; }
  const mine = CO.D.repMine && CO.D.repMine.r && CO.D.repMine.r[cid];
  let why = mine ? mine.why : "";
  gModal(`<span class="eyebrow">Segnala un coach</span><h3 style="margin:4px 0 6px">${esc(c.name)}</h3>
    <p class="muted" style="margin:0 0 12px;font-size:14px">La segnalazione arriva solo allo staff, che la controlla: il coach non la vede.${mine ? ` Hai già segnalato questo coach il ${esc(new Date(mine.ts).toLocaleDateString("it-IT"))}: puoi aggiornare la segnalazione.` : ""}</p>
    <div class="co-reps">${CO_REP.map(([k, l]) => `<label class="co-rep ${why === k ? "on" : ""}"><input type="radio" name="corep" value="${k}" ${why === k ? "checked" : ""}> ${l}</label>`).join("")}</div>
    <label class="of">Racconta cosa è successo<textarea id="crpTxt" rows="4" maxlength="800" placeholder="Più dettagli dai, più è facile per lo staff verificare">${esc(mine ? mine.t : "")}</textarea></label>
    <label class="co-hp" aria-hidden="true">Sito web<input type="text" id="crpWeb" tabindex="-1" autocomplete="off"></label>
    <div id="crpCap"></div>
    <div class="co-mebtn"><button class="btn primary" id="crpGo">${mine ? "Aggiorna la segnalazione" : "Invia la segnalazione"}</button><span class="muted" id="crpMsg" style="font-size:13px"></span></div>`, (m, close) => {
    m.querySelector(".gmbox").classList.add("cowide");
    const ta = m.querySelector("#crpTxt"); ta.addEventListener("keydown", e => e.stopPropagation());
    const t0 = Date.now(); let K = coCapNew();
    const drawCap = () => { const box = m.querySelector("#crpCap"); box.innerHTML = coCapHtml(K);
      box.querySelectorAll("[data-capk]").forEach(b => b.onclick = () => { const i = +b.dataset.capk; K.pick.has(i) ? K.pick.delete(i) : K.pick.add(i); b.classList.toggle("on", K.pick.has(i)); m.querySelector("#crpMsg").textContent = ""; });
      box.querySelector("[data-capnew]").onclick = () => { K = coCapNew(); drawCap(); }; };
    drawCap();
    m.querySelectorAll('[name="corep"]').forEach(x => x.onchange = () => { why = x.value; m.querySelector("#crpMsg").textContent = ""; m.querySelectorAll(".co-rep").forEach(l => l.classList.toggle("on", l.querySelector("input").checked)); });
    m.querySelector("#crpGo").onclick = async () => {
      const t = coLongTxt(ta.value, 800), out = m.querySelector("#crpMsg");
      if (!why) { out.textContent = "Scegli un motivo."; return; }
      if (t.length < 15) { out.textContent = "Scrivi almeno una frase su cosa è successo."; return; }
      if (!coCapOk(K)) { out.textContent = "Verifica non riuscita: tocca solo le carte di " + K.t[2] + ". Ti ho dato carte nuove."; K = coCapNew(); drawCap(); return; }
      if (Date.now() - t0 < 4000) { out.textContent = "Troppo veloce: rileggi e riprova tra un attimo."; return; }
      const last = (CO.D.repMine && CO.D.repMine.r && CO.D.repMine.r[cid] && CO.D.repMine.r[cid].ts) || 0;
      if (Date.now() - last < 10 * 60000) { out.textContent = "Hai appena inviato una segnalazione per questo coach: riprova tra qualche minuto."; return; }
      if (m.querySelector("#crpWeb").value) { m.querySelector(".gmbox").innerHTML = `<div class="co-okmsg"><b>Grazie, segnalazione inviata.</b></div>`; return; }
      m.querySelector("#crpGo").disabled = true;
      const cur = { ...((CO.D.repMine && CO.D.repMine.r) || {}) }; cur[cid] = { why, t, name: coTxt(S.nick || "Utente", 40), ts: Date.now() };
      try {
        await LB.db.doc("crep/" + LB.uid).set({ r: cur }); CO.D.repMine = { r: cur };
        m.querySelector(".gmbox").innerHTML = `<div class="co-okmsg"><b>Grazie, segnalazione inviata.</b><p>Lo staff la controllerà e, se serve, contatterà il coach o sospenderà il profilo. Teniamo molto a che ogni lezione sulla piattaforma sia seria e professionale.</p></div><p style="margin:12px 0 0"><button class="btn" id="crpClose">Chiudi</button></p>`;
        m.querySelector("#crpClose").onclick = close;
      } catch (e) { m.querySelector("#crpGo").disabled = false; out.textContent = e && e.code === "invalid_argument" ? "Con questo accesso non puoi inviare segnalazioni." : "Non sono riuscito a inviarla: riprova."; }
    };
  });
}
/* finestra dello staff con le segnalazioni di un coach */
function coRepOpen(cid, onDone) {
  const c = CO.D.coaches.find(x => x.id === cid); if (!c) return;
  const L = coReps(cid).sort((a, b) => b.ts - a.ts), seen = CO.D.seen || {};
  gModal(`<span class="eyebrow">Segnalazioni</span><h3 style="margin:4px 0 10px">${esc(c.name)} · ${L.length} ${L.length === 1 ? "segnalazione" : "segnalazioni"}</h3>
    <div class="co-replist">${L.map(r => `<div class="co-repc ${seen[r.key] ? "" : "new"}"><div><b>${esc(coRepName(r.why))}</b>${seen[r.key] ? "" : `<span class="co-newb">Nuova</span>`}</div><small>${esc(r.name)} · ${esc(new Date(r.ts).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }))}</small><p>${esc(r.t)}</p></div>`).join("") || `<p class="muted">Nessuna segnalazione.</p>`}</div>
    <div class="co-mebtn"><button class="btn primary" id="crsSeen">Segna come viste</button><button class="btn ghost" id="crsMail">${coI("mail", 15)} Contatta il coach</button></div>`, (m, close) => {
    m.querySelector(".gmbox").classList.add("cowide");
    m.querySelector("#crsMail").onclick = () => { close(); coMailOpen(cid); };
    m.querySelector("#crsSeen").onclick = async () => {
      const s2 = { ...(CO.D.seen || {}) }; L.forEach(r => { s2[r.key] = true; });
      try { await LB.db.doc("coadm/main").set({ seen: s2 }); CO.D.seen = s2; close(); if (onDone) onDone(); coHeroStats(); } catch (e) { gToast("Non sono riuscito a salvare."); }
    };
  });
}
/* ---------- approvazioni (solo proprietario) ---------- */
function coAdmin(el) {
  const L = CO.D.coaches.slice().sort((a, b) => coRepNew(b.id).length - coRepNew(a.id).length || (CO.D.okSet.has(a.id) ? 1 : 0) - (CO.D.okSet.has(b.id) ? 1 : 0));
  el.innerHTML = L.length ? `<div class="co-list">${L.map(c => { const ok = CO.D.okSet.has(c.id); return `<div class="co-bk"><div class="co-bkm">${coPic(c, 40)}<div><b>${esc(c.name)}</b><span>${esc(c.head)} · ${c.p60} €/h · ${esc((c.fm && c.fm.length ? c.fm : ["cash"]).map(coFmtName).join(", "))}${coLvRange(c) ? " " + esc(coLvRange(c)) : ""}${coAbiRange(c) ? " · " + esc(coAbiRange(c)) : ""}</span><small class="${c.qz && c.qz.s >= COQ_PASS ? "coq-okt" : "coq-kot"}">${c.qz ? `Quiz: ${c.qz.s}/${c.qz.n}` : "Quiz non fatto"}</small><small>${esc(c.exp)}</small></div></div><div class="co-bka"><span class="co-st ${ok ? "ok" : "mid"}">${ok ? "Approvato" : "Da approvare"}</span><button class="btn small ghost" data-coopen="${esc(c.id)}">Profilo</button><button class="btn small ghost" data-comail="${esc(c.id)}">${coI("mail", 15)} Contatta</button>${coReps(c.id).length ? `<button class="btn small ${coRepNew(c.id).length ? "co-repbad" : "ghost"}" data-coreps="${esc(c.id)}">${coI("flag", 14)} ${coReps(c.id).length} ${coReps(c.id).length === 1 ? "segnalazione" : "segnalazioni"}${coRepNew(c.id).length ? ` (${coRepNew(c.id).length} ${coRepNew(c.id).length === 1 ? "nuova" : "nuove"})` : ""}</button>` : ""}${ok ? `<button class="btn small ghost" data-coap="0:${esc(c.id)}">Sospendi</button>` : `<button class="btn small primary" data-coap="1:${esc(c.id)}">Approva</button>`}</div></div>`; }).join("")}</div>` : `<p class="muted">Nessun profilo da coach per ora.</p>`;
  el.querySelectorAll("[data-coopen]").forEach(b => b.onclick = () => coProfile(b.dataset.coopen));
  el.querySelectorAll("[data-comail]").forEach(b => b.onclick = () => coMailOpen(b.dataset.comail));
  el.querySelectorAll("[data-coreps]").forEach(b => b.onclick = () => coRepOpen(b.dataset.coreps, () => coAdmin(el)));
  el.querySelectorAll("[data-coap]").forEach(b => b.onclick = async () => { const [v, id] = b.dataset.coap.split(":"); b.disabled = true; try { await LB.db.doc("coachok/" + id).set({ ok: v === "1", date: today() }); await coLoad(); coAdmin(el); } catch (e) { b.disabled = false; gToast("Solo chi può modificare l'app approva i coach."); } });
}

/* ---- Flop trainer BTN vs BB  ---- */
function v7(cards3) {
  const v = cards3.map(c => rv(c[0])).sort((a, b) => b - a);
  const su = cards3.map(c => c[1]);
  const asc = [...v].sort((a, b) => a - b);
  const g1 = asc[1] - asc[0], g2 = asc[2] - asc[1];
  const paired = new Set(v).size < 3;
  const two = new Set(su).size === 2, mono = new Set(su).size === 1;
  const bwc = v.filter(x => x >= 10).length;
  // scala possibile: tre ranghi diversi entro 5 (asso anche basso)
  const scaleP = !paired && (v[0] - v[2] <= 4 || (v[0] === 14 && v[1] <= 5));
  const isDrawy = ((g1 === 1 || g2 === 1) && g1 <= 3 && g2 <= 3) || two || mono;
  // monotone medio collegato: niente asso, carta alta fino al 10, tre carte entro 5 ranghi
  const monoMid = mono && v[0] <= 10 && v[0] - v[2] <= 4;
  const cat = paired ? "PAIRED" : monoMid ? "MONO CONN" : (bwc === 2 && !scaleP) ? "2BROAD" : scaleP ? "SCALE" : isDrawy ? "DRAWY" : "DRY";
  const bucket = v[0] === 14 ? "A-high" : v[0] === 13 ? "K-high" : v[0] === 12 ? "Q-high" : v[0] === 11 ? "J-high" : v[0] === 10 ? "T-high" : "9-high less";
  const tone = mono ? "Monotone" : two ? "2Tone" : "Rainbow";
  const pr = paired ? v.find(x => v.filter(y => y === x).length >= 2) : null;
  const superConn = paired && Math.abs(v.find(x => x !== pr) - pr) === 1;
  const sec = v[1];
  const R = (sols, full, exp, mixed) => ({ sols, full, exp, mixed, bucket, cat, tone });
  if (mono) return monoMid ? R(["CHECK"], "CHECK range", "Monotone medio collegato → check con tutto il range: tanti progetti di scala, la difesa del BB è facile", false) : R(["1BB"], "1BB range", "Board monotone → 1BB con tutto il range: la difesa del BB è quasi impossibile", false);
  if (bucket === "A-high") {
    if (paired) return superConn ? R(["M75", "CHECK"], "M75", "A-high paired super connesso → M75 (CHECK valido)", true) : R(["25r"], "25r", "A-high paired → 25r", false);
    if (v[1] <= 6 && v[1] - v[2] <= 2) return R(["CHECK"], "CHECK", "A-high scala bassa → full check", false);
    if (bwc === 3) return R(["30"], "30", "Tripla broadway → 30 range", false);
    if (sec >= 12) return R(["M120"], "M120", "AKx / AQx → M120 sempre", false);
    if (sec >= 10) return R([two ? "M100" : "30"], "M100 (2Tone) / 30 (Dry)", "AJx / ATx: 2Tone → M100, Dry → 30", true);
    if (sec === 9 && v[2] >= 6) return R(["M75", "CHECK"], "M75", "A98, A97, A96 → M75 (CHECK valido)", true);
    if (two || g1 <= 2) return R(["M50", "CHECK"], "M50", "A9x- connesso o 2tone → M50 (CHECK valido); M75 solo su A98, A97, A96", true);
    return R(["30", "M50"], "30 (M50 valido)", "A9x- dry → 30 range (in alternativa M50)", false);
  }
  if (bucket === "K-high" || bucket === "Q-high" || bucket === "J-high") return paired ? R(["25r"], "25r", `${bucket} paired → 25r`, false) : R(["30"], "30", `${bucket} → 30 range`, false);
  if (paired) return superConn ? R(["M75", "25r"], "25r / M75 (super conn.)", "Paired super connesso (977, 877): exploit → 25r, standard → M75", true) : R(["25r"], "25r", "T-high o più basso paired → 25r", false);
  if (scaleP) return R(["M50", "CHECK"], "M50", "Board a scala (scala possibile) → M50 (CHECK valido)", true);
  if (v[0] === 10 && v[1] === 9) return R(["M100", "CHECK"], "M100", "T9x senza scale possibili → M100 (CHECK valido)", true);
  return R(["M75", "CHECK"], "M75", "T8x o più basso senza scale possibili → M75 (CHECK valido)", true);
}
const V7_ACTS = [["CHECK", "CHECK", "check 0%"], ["25r", "25r", "range bet 25%"], ["30", "30", "range bet 30%"], ["M50", "M50", "mixed 50%"], ["M75", "M75", "mixed 75%"], ["M100", "M100", "mixed 100%"], ["M120", "M120", "mixed 120%"], ["1BB", "1BB", "mini-bet ~10% (monotone)"]];
DRILLS.flopbtn = {
  name: "Flop trainer BTN vs BB", short: "Flop BTN", time: 15,
  desc: "SRP BTN vs BB, scegli l'azione al flop. Sulle strategie miste vale la size principale e, dove indicato, anche il check.",
  rule: "Bucket (A, K, Q, J, T-high, 9-high less) × categoria (PAIRED, 2BROAD, SCALE, DRAWY, DRY) × colori. Tasti 1-8 per rispondere; se rispondi giusto si passa da soli alla mano dopo.",
  sample() { return { b: dealCards(3).join("") }; },
  build({ b }) {
    const cs = b.match(/../g), s = v7(cs);
    return {
      title: "BTN vs BB · SRP · flop", autoNext: true,
      body: `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px"><span class="pill mid">${s.bucket}</span><span class="pill acc">${s.cat}</span><span class="pill good">${s.tone}</span></div>` + tableHtml([{ lbl: "Flop", cards: b }], { hero: "BTN", vil: "BB", pot: 5.5, inv: 2.5 }) + `<p class="ctx" style="margin:0 0 10px">Qual è la tua azione? (BTN vs BB, SRP)</p>`,
      layout: "cols4", center: true, opts: V7_ACTS.map(([v, l, d]) => ({ label: `${l}<br><span class="muted" style="font-weight:400;font-size:11px">${d}</span>`, v })), timed: true,
      check(v) {
        const ok = s.sols.includes(v);
        return { score: ok ? 100 : 0, correct: s.sols[0], expl: `<p><b>Soluzione: ${s.full}</b>${s.sols.includes("CHECK") && s.sols[0] !== "CHECK" ? " (vale anche CHECK)" : ""}${s.mixed ? " · strategia mista, conta la size principale" : ""}.</p><p>${s.exp}.</p><p class="muted" style="font-size:13px">Board: ${s.bucket} / ${s.cat} / ${s.tone}.</p>` };
      },
    };
  },
};

/* ---- Flop trainer SB vs BB (logica del tuo trainer v1) ---- */
function bvbStrat(cards3) {
  const v = cards3.map(c => rv(c[0])).sort((a, b) => b - a), su = cards3.map(c => c[1]);
  const mono = new Set(su).size === 1, two = new Set(su).size === 2, fd = mono || two;
  const paired = new Set(v).size < 3;
  const pv = v[0] === v[1] ? v[0] : v[1] === v[2] ? v[1] : null;
  // due carte fino all'8 che possono stare nella stessa scala: distanza fino a 4 (7-3, 8-4, 6-2)
  const lows = [...new Set(v)].filter(x => x <= 8).sort((a, b) => a - b);
  let twoLow = false; for (let i = 0; i < lows.length; i++) for (let j = i + 1; j < lows.length; j++) if (lows[j] - lows[i] <= 4) twoLow = true;
  const monoLow = mono && v[0] <= 11 && v[0] - v[2] <= 4;
  const bwc = v.filter(x => x >= 10).length;
  const dblBroad = two && !paired && bwc >= 2 && (v[1] - v[2] <= 2 || (v[0] === 14 && v[1] >= 12 && v[2] <= 3));
  const bucket = paired ? "PAIRED" : v[0] === 14 ? "A-high" : v[0] === 13 ? "K-high" : v[0] === 12 ? "Q-high" : v[0] === 11 ? "J-high" : v[0] === 10 ? "T-high" : "Low (≤9)";
  const tone = mono ? "Monotone" : two ? "2Tone" : "Rainbow";
  const R = (sols, full, cat, exp) => ({ sols, full, cat, exp, bucket, tone });
  if (paired) {
    if (pv >= 9) return R(["B25"], "B25", "PAIR ≥9", "Paired dal 99x in su: range equity buona, il pool overfolda al cbet piccolo sui paired alti.");
    if (pv <= 3) return R(["B25", "CHECK"], "B25 (vale anche CHECK)", "PAIR 22-33", "Paired 22x e 33x: il BB non ha quasi 2x e 3x offsuit (A2 e A3 li 3-betta o li folda), i trips sono pari: si può puntare 25% con tutto il range. Anche il check range va bene.");
    return R(["CHECK"], "CHECK range", "PAIR 44-88", "Paired dal 44x all'88x: il BB difende tanti trips offsuit (98, 87, 86 sull'8) e ci flotta troppo, controlliamo il piatto.");
  }
  if (mono) return monoLow ? R(["CHECK"], "CHECK range", "MONO CONN LOW", "Monotone connesso medio-basso: board troppo dinamico, preserviamo il range e controlliamo la varianza al turn.") : R(["1BB"], "1BB blocker", "MONO STATIC", "Monotone non dinamico: blocking bet minima, reggiamo tutto il range senza investire troppo.");
  if (twoLow) {
    if (v[0] === 14) return fd ? R(["CHECK"], "CHECK range", "2 LOW CONN", "A-high con 2 carte fino all'8 connesse a scala + progetto colore: Q8, Q9, J8, J9 no-equity sarebbero scomode al turn, checkando range le togliamo dall'equazione.") : R(["B25"], "B25", "2 LOW CONN", "A-high con connesse basse ma senza progetto colore: board pulito al turn, range bet 25%.");
    return R(["CHECK"], "CHECK range", "2 LOW CONN", "2 carte fino all'8 che possono stare nella stessa scala (distanza fino a 4, come 7-3 o 8-4): al turn avremmo combo medie no-equity con mix complicatissimi, meglio check range.");
  }
  if (dblBroad) return R(["1BB", "B25"], "1BB (vale anche B25)", "2BROAD 2TONE", "Doppia broadway two-tone con la terza carta connessa alla seconda (KT8, QJ9) o AK/AQ con una carta fino al 3: il raffinamento è 1bb con tutto il range; il B25 resta una semplificazione valida.");
  return R(["B25"], "B25", "DRY/PULITO", "Nessun doppio connettore basso: board pulito, al turn tutte le combo restano semplificabili, range bet 25%.");
}
DRILLS.flopbvb = {
  name: "Flop trainer SB vs BB", short: "Flop BvB", time: 12,
  desc: "BvB: strategia binaria B25 / CHECK (1bb sui monotone statici e, come raffinamento, sulle doppie broadway two-tone).",
  rule: "2 carte fino all'8 connesse a scala (distanza fino a 4: 7-3 e 8-4 contano) → CHECK, il resto → B25. Sugli A-high serve anche il progetto colore per checkare. Paired: 9 o più B25, dal 44 all'88 CHECK, 22x e 33x B25 (vale anche CHECK). Monotone: connesso medio-basso CHECK, gli altri 1bb. Doppia broadway two-tone connessa (KT8, AK2): 1bb, vale anche B25.",
  sample() { return { b: dealCards(3).join("") }; },
  build({ b }) {
    const s = bvbStrat(b.match(/../g));
    return {
      title: "SB vs BB · SRP · flop", autoNext: true,
      body: `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px"><span class="pill mid">${s.bucket}</span><span class="pill acc">${s.cat}</span><span class="pill good">${s.tone}</span></div>` + tableHtml([{ lbl: "Flop", cards: b }], { hero: "SB", vil: "BB", pot: 6, inv: 3 }) + `<p class="ctx" style="margin:0 0 10px">Qual è la tua azione? (SB vs BB, SRP)</p>`,
      layout: "cols3", center: true, opts: [["CHECK", "check range"], ["B25", "bet 25% range"], ["1BB", "blocker 1bb"]].map(([v, d]) => ({ label: `${v}<br><span class="muted" style="font-weight:400;font-size:11px">${d}</span>`, v })), timed: true,
      check(v) { return { score: s.sols.includes(v) ? 100 : 0, correct: s.sols[0], expl: `<p><b>Soluzione: ${s.full}</b>.</p><p>${s.exp}</p><p class="muted" style="font-size:13px">Board: ${s.bucket} / ${s.cat} / ${s.tone}.</p>` }; },
    };
  },
}

/* ---- BB defense: check-raise e turn (logica del tuo trainer) ---- */
const cv = c => rv(c[0]);
const dvals = cs => cs.map(cv).sort((a, b) => b - a);
const dPaired = v => new Set(v).size < 3;
const dScale = v => { const a = [...v].sort((x, y) => x - y); return a[2] - a[1] <= 2 && a[1] - a[0] <= 2; };
const dFD = cs => SUITS.split("").some(s => cs.filter(c => c[1] === s).length >= 2);
const dMono = cs => new Set(cs.map(c => c[1])).size === 1;
const dTwo = cs => new Set(cs.map(c => c[1])).size === 2;
const RN2 = r => RANKS[r - 2] === "T" ? "10" : RANKS[r - 2];
function xrFlop(cs) {
  const v = dvals(cs);
  if (dPaired(v)) {
    const p = v.find(x => v.filter(y => y === x).length >= 2), k = v.find(x => x !== p);
    if (p >= 10) return { sols: ["30"], full: "30", exp: "Paired al 10 o più alto: parità di trips → XR 30." };
    if (k == null) return { sols: ["50"], full: "50", exp: `Board con tris (${RN2(p)}${RN2(p)}${RN2(p)}): si gioca come i paired bassi → XR 50.` };
    return k > p ? { sols: ["100"], full: "100", exp: `Paired basso (${RN2(p)}${RN2(p)}) con kicker alto (${RN2(k)}) → XR 100, polarizzato: si perde l'intento di protezione.` } : { sols: ["50"], full: "50", exp: `Paired basso (${RN2(p)}${RN2(p)}) con kicker basso (${RN2(k)}) → XR 50, protezione contro le overcard.` };
  }
  if (v[0] === 14) {
    const low = [v[1], v[2]].sort((a, b) => a - b);
    if (low[1] - low[0] <= 1) return { sols: ["75"], full: "75", exp: `A-high con scale forti (${RN2(low[1])}${RN2(low[0])}) → XR 75.` };
    return dFD(cs) ? { sols: ["100"], full: "100", exp: "A-high con progetto colore leggero, senza scale forti → XR 100." } : { sols: ["100"], full: "100", exp: "A-high super secco → XR 100: raisiamo pochissimo e ultra polare." };
  }
  if (v.some(x => x >= 10)) return { sols: ["75"], full: "75", exp: "Board con broadway → XR 75, size intermedia versatile." };
  if (dScale(v)) return { sols: ["75"], full: "75", exp: "Board a scala → XR 75." };
  return { sols: ["75"], full: "75", exp: "Board standard → XR 75." };
}
const closesFlushD = (fl, t) => SUITS.split("").some(s => fl.filter(c => c[1] === s).length >= 2 && t[1] === s);
const pairsBoardD = (fl, t) => dvals(fl).includes(cv(t));
function closesScaleD(fl, t) {
  const fv = dvals(fl), tv = cv(t);
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { if (fv[i] === fv[j]) continue; const c = [fv[i], fv[j], tv].sort((a, b) => a - b); if (c[2] - c[1] <= 2 && c[1] - c[0] <= 2) return true; }
  return false;
}
function turnTag(fl, t) { return pairsBoardD(fl, t) ? "Paira il board" : closesFlushD(fl, t) ? "Chiude colore" : closesScaleD(fl, t) ? "Chiude scala" : "Blank"; }
function xrTurn(fl, t) {
  const fv = dvals(fl), tv = cv(t);
  // nuove scale chiuse dal turn: tutte fatte con due carte fino al 6?
  const lowConc = () => {
    const b3 = fv, b4 = [...fv, tv];
    const has = (cards, need) => { const s = new Set(cards.flatMap(x => x === 14 ? [14, 1] : [x])); for (let lo = 1; lo <= 10; lo++) { let ok = true; for (let r = lo; r < lo + 5; r++) if (!s.has(r)) { ok = false; break; } if (ok && (!need || (need >= lo && need < lo + 5) || (need === 14 && lo === 1))) return true; } return false; };
    let n = 0, low = true;
    for (let a = 2; a <= 14; a++) for (let c = a + 1; c <= 14; c++) { if (has([...b4, a, c], tv) && !has([...b3, a, c])) { n++; if (c > 6) low = false; } }
    for (let a = 2; a <= 14; a++) if (has([...b4, a], tv) && !has([...b3, a])) low = false;
    return n > 0 && low;
  };
  if (pairsBoardD(fl, t)) return { sols: ["100"], full: "100", exp: "Il turn accoppia il board → 100 (anche se chiude colore)." };
  if (closesFlushD(fl, t)) return { sols: ["30"], full: "30 range", exp: "Il turn chiude il colore → 30 con quasi tutto il range: le nuts del flop non sono più in cima e molti semi-bluff sono diventati colore." };
  if (closesScaleD(fl, t)) return lowConc() ? { sols: ["100", "75"], full: "100 (75 accettato)", exp: "Il turn chiude scale fatte solo con carte basse, che dopo il check-raise ha quasi solo il BB → la size cresce fino al piatto." } : { sols: ["75", "CHECK"], full: "75 / CHECK", exp: "Il turn chiude scala e le scale non sono concentrate nel tuo range → 75 (vale anche CHECK)." };
  if (tv >= 11 && tv > fv[0]) return { sols: ["75", "CHECK"], full: "75 / CHECK", exp: "Overcard alta che sembra una blank ma dà al BTN nuove doppie nella parte offsuit (es. K8o e KQo su Q-8-4 con il K) → size polare più piccola, 75, e punti meno spesso." };
  return { sols: ["100", "2e"], full: "100 / 2e", exp: "Turn blank → 100% o 2e, full polar: punta tutte le nuts." };
}
function xxTurn(fl, t) {
  const fv = dvals(fl), tv = cv(t);
  const all = [...fv, tv].sort((a, b) => a - b);
  const lowConc = () => {
    const b3 = fv, b4 = [...fv, tv];
    const has = (cards, need) => { const s = new Set(cards.flatMap(x => x === 14 ? [14, 1] : [x])); for (let lo = 1; lo <= 10; lo++) { let ok = true; for (let r = lo; r < lo + 5; r++) if (!s.has(r)) { ok = false; break; } if (ok && (!need || (need >= lo && need < lo + 5) || (need === 14 && lo === 1))) return true; } return false; };
    let n = 0, low = true;
    for (let a = 2; a <= 14; a++) for (let c = a + 1; c <= 14; c++) { if (has([...b4, a, c], tv) && !has([...b3, a, c])) { n++; if (c > 6) low = false; } }
    for (let a = 2; a <= 14; a++) if (has([...b4, a], tv) && !has([...b3, a])) low = false;
    return n > 0 && low;
  };
  // A-high con scala bassa: il BTN lo gioca check con tutto il range
  if (!dPaired(fv) && fv[0] === 14 && fv[1] <= 6 && fv[1] - fv[2] <= 2) return { sols: ["CHECK"], full: "CHECK", exp: "A-high con scala bassa: il BTN lo gioca check con tutto il range, il suo check non è debole. Il BB punta così poco (circa 10%) che si semplifica a check; quando il BTN punta, check-raise con size geometrica." };
  if (tv <= 9 && dScale(fv) && all[3] - all[0] <= 4) return { sols: ["30", "CHECK"], full: "30 / CHECK", exp: "4 carte a scala bassa → 30 con tutto il range (vale anche CHECK)." };
  if (pairsBoardD(fl, t)) return { sols: ["100"], full: "100", exp: "Il turn accoppia il board → 100." };
  if (closesFlushD(fl, t)) return { sols: ["30", "CHECK"], full: "30 / CHECK", exp: "Il turn chiude il colore → 30 (vale anche CHECK)." };
  if (closesScaleD(fl, t)) return lowConc() ? { sols: ["100", "75"], full: "100 (75 accettato)", exp: "Il turn chiude scale fatte solo con carte basse, che sono quasi tutte del BB → la size cresce fino al piatto." } : { sols: ["75", "CHECK"], full: "75 / CHECK", exp: "Il turn chiude scala → 75 (vale anche CHECK)." };
  if (tv >= 11 && tv > fv[0]) return { sols: ["75", "100"], full: "75 / 100", exp: "Overcard alta: aiuta il range di apertura del BTN e non vuoi puntare le coppie medie → 75 o piatto." };
  if (tv >= 6 && fv.some(x => Math.abs(x - tv) <= 2)) return { sols: ["150", "100"], full: "150 (100 accettato)", exp: "Blank media vicina al board: crea molte carte al river che cambiano le nuts → size sotto la geometrica, 150." };
  return { sols: ["2e", "100"], full: "2e / 100", exp: "Turn blank che non cambia le nuts → range polarizzato e size geometrica (circa 2,5 volte il piatto dopo check-check), oppure 100." };
}
const BBD_MODES = {
  flop_xr: { n: "Flop · size del check-raise contro la c-bet", q: "Che size usi per il check-raise?", acts: ["30", "50", "75", "100"], turn: false },
  turn_xr: { n: "Turn dopo il tuo check-raise al flop", q: "Che size usi al turn?", acts: ["CHECK", "30", "75", "100", "2e"], turn: true },
  turn_xx: { n: "Turn dopo check-check al flop (bet vs missed)", q: "Che size usi al turn?", acts: ["CHECK", "30", "75", "100", "150", "2e"], turn: true },
};
const BBD_FILTERS = { all: "Tutti", paired: "Paired", scale: "Scala", flushdraw: "Flushdraw", monotone: "Monotone", blank: "Turn blank", closesflush: "Turn chiude colore", closesscale: "Turn chiude scala", pairsturn: "Turn paira il board" };
function bbdMatch(f, fl, t) {
  const v = dvals(fl);
  if (!f || f === "all") return true;
  if (f === "paired") return dPaired(v);
  if (f === "scale") return dScale(v) && !dPaired(v);
  if (f === "flushdraw") return dFD(fl) && !dMono(fl) && !dPaired(v);
  if (f === "monotone") return dMono(fl);
  if (!t) return true;
  if (f === "blank") return turnTag(fl, t) === "Blank";
  if (f === "closesflush") return closesFlushD(fl, t) && !pairsBoardD(fl, t);
  if (f === "closesscale") return closesScaleD(fl, t) && !pairsBoardD(fl, t) && !closesFlushD(fl, t);
  if (f === "pairsturn") return pairsBoardD(fl, t);
  return true;
}
DRILLS.bbdef = {
  name: "BB defense: check-raise e turn", short: "BB defense", time: 15, filters: BBD_FILTERS,
  desc: "BB vs BTN: size del check-raise al flop, turn dopo il check-raise e turn dopo check-check.",
  rule: "XR: paired alti 30, paired bassi 50 o 100 in base al kicker, broadway 75, A-high secchi 100. Turn: accoppia il board 100, chiude colore 30, chiude scala 75 (piatto se le scale sono solo tue), blank 100 o 2e, overcard alta 75. Dopo check-check: A-high con scala bassa check, blank media vicina al board 150.",
  sample(ctx) {
    const mode = (ctx.opt && ctx.opt.mode) || pick(Object.keys(BBD_MODES));
    const f = ctx.opt && ctx.opt.filter;
    for (let k = 0; k < 300; k++) { const c = dealCards(4); const fl = c.slice(0, 3), t = BBD_MODES[mode].turn ? c[3] : null; if (bbdMatch(f, fl, t)) return { mode, b: fl.join("") + (t || "") }; }
    const c = dealCards(4); return { mode, b: c.slice(0, 3).join("") + (BBD_MODES[mode].turn ? c[3] : "") };
  },
  build({ mode, b }) {
    const m = BBD_MODES[mode], cs = b.match(/../g), fl = cs.slice(0, 3), t = cs[3] || null;
    const s = mode === "flop_xr" ? xrFlop(fl) : mode === "turn_xr" ? xrTurn(fl, t) : xxTurn(fl, t);
    const v = dvals(fl), tone = dMono(fl) ? "Monotone" : dTwo(fl) ? "2Tone" : "Rainbow";
    const cat = dPaired(v) ? "Paired" : dScale(v) ? "Scala" : dFD(fl) ? "Flushdraw" : "Standard";
    const parts = [{ lbl: "Flop", cards: fl.join("") }]; if (t) parts.push({ lbl: "Turn", cards: t });
    return {
      title: "BB vs BTN · " + m.n, autoNext: true,
      body: `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px"><span class="pill acc">${m.n}</span><span class="pill mid">${RN2(v[0])}-high · ${cat}</span><span class="pill good">${tone}</span>${t ? `<span class="pill bad">${ic(t)} · ${turnTag(fl, t)}</span>` : ""}</div>` + tableHtml(parts) + `<p class="ctx" style="margin:0 0 10px">${m.q}</p>`,
      layout: m.acts.length > 4 ? "cols3" : "cols4", center: true, opts: m.acts.map(a => ({ label: a === "CHECK" ? "Check" : a === "2e" ? "2e (geo)" : a + "%", v: a })), timed: true,
      check(x) { return { score: s.sols.includes(x) ? 100 : 0, correct: s.sols[0], expl: `<p><b>Soluzione: ${s.full}</b>.</p><p>${s.exp}</p><p class="muted" style="font-size:13px"></p>` }; },
    };
  },
};

/* ---- 2° barrel al turn ---- */
function turnFeat(flop, turn) {
  const f = feat(flop);
  const t = { r: rv(turn[0]), s: turn[1] };
  const all = [...flop, turn].map(c => rv(c[0]));
  const suitCount = [...flop, turn].filter(c => c[1] === t.s).length;
  const flushDone = suitCount >= 3 && f.twotone && flop.filter(c => c[1] === t.s).length === 2;
  const pairsTop = t.r === f.high;
  const pairsOther = !pairsTop && f.rs.includes(t.r);
  const uniqF = [...new Set(f.rs)], uniqA = [...new Set(all)];
  const win = arr => { let best = 0; for (let lo = 1; lo <= 10; lo++) { const n = arr.filter(r => (r >= lo && r <= lo + 4) || (r === 14 && lo === 1)).length; best = Math.max(best, n); } return best; };
  const strF = win(uniqF), strA = win(uniqA);
  const connects = !pairsTop && !pairsOther && strA >= 3 && strA > strF;
  const fourStraight = strA >= 4;
  const overBroad = !pairsTop && !pairsOther && t.r >= 10 && t.r > f.mid;
  const near = !pairsTop && !pairsOther && t.r >= 6 && f.rs.some(r => Math.abs(r - t.r) <= 2);
  return { f, t, flushDone, pairsTop, pairsOther, connects, fourStraight, overBroad, near };
}
function turnS1(tf) {
  const tr = tf.t.r;
  if ((tf.pairsTop || tf.pairsOther) && tr >= 13) return { a: ["100"], cat: `Il turn accoppia ${tr === 13 ? "un K" : "un asso"}`, why: "Il BB 3-betta gran parte di AK, KQ, KJ e degli assi forti: il BTN ha molti più trips e punta il piatto." };
  if (tf.pairsTop) return { a: ["75"], cat: "Il turn accoppia la carta più alta", why: "Pairing della top card: 75%." };
  if (tf.pairsOther) return { a: ["75"], cat: "Il turn accoppia una carta più bassa", why: "In teoria 75-100% in base ai trips del BB; ai nostri limiti il BB al flop non rilancia quasi mai queste coppie e le tiene nel range di call: 75%." };
  if (tf.flushDone) return { a: ["75"], cat: "Il turn chiude il colore", why: "Runout che chiudono progetti del flop: 75%, con frequenza di bet bassa se il colore si chiude con carte alte." };
  if (tf.connects) {
    // scala nuova più alta resa possibile dal turn
    const fl = [...new Set(tf.f.rs)], all = [...new Set([...tf.f.rs, tr])];
    const inW = (r, lo) => (r >= lo && r <= lo + 4) || (r === 14 && lo === 1);
    let top = 0;
    for (let lo = 10; lo >= 1 && !top; lo--) if (inW(tr, lo) && all.filter(r => inW(r, lo)).length >= 3 && fl.filter(r => inW(r, lo)).length < 3) top = lo + 4;
    if (top >= 13 && tr >= 10) return { a: ["100"], cat: "Il turn chiude una scala alta", why: "Scale alte (broadway) di cui il BTN ha il vantaggio di concentrazione: piatto." };
    return { a: ["75"], cat: "Il turn chiude una scala bassa o media", why: "Carte che chiudono progetti e creano nuove doppie coppie nella parte offsuit del BB: 75%." };
  }
  if (tf.overBroad) return { a: ["100"], cat: "Overcard alta che dà al BB nuove combo di valore medio-alto", why: "Carte che generano nuove combo nella parte medio-alta del valore avversario: 100%." };
  if (tf.near) return { a: ["100", "75"], cat: "Carta vicina al board: nuove doppie coppie e progetti per il BB", why: "Non è una blank: genera nuove doppie coppie nella parte offsuit del BB. Tra 100% (nuovo valore medio-alto) e 75% (se chiude o crea molte connessioni)." };
  return { a: ["150"], cat: "Blank", why: "Più il turn lascia invariate le nuts del flop, più la size è grande: sulle blank overbet 150%." };
}
function turnS2(tf) {
  if (tf.flushDone) {
    if (tf.t.r >= 10) return { a: ["30"], cat: "Turn alto che chiude il colore", why: "30% si usa solo sui turn alti che chiudono colore: le top pair scendono intorno al 60% di equity." };
    if (tf.t.r === 9) return { a: ["30", "50"], cat: "Turn 9 che chiude il colore", why: "Carta intermedia: prevale il 30%, ma va bene anche il 50%." };
    if (tf.connects || tf.fourStraight) return { a: ["30"], cat: "Turn che chiude colore e scala insieme", why: "Quando si chiudono insieme colore e scala si scende al 30%." };
    return { a: ["50"], cat: "Turn basso che chiude il colore", why: "Turn bassi che chiudono colore: 50%, le top pair hanno ancora oltre il 70% di equity." };
  }
  if (tf.pairsTop || tf.pairsOther) return (tf.f.high - tf.t.r >= 4) ? { a: ["50"], cat: "Turn che accoppia una carta bassa, con tanto gap dalla carta alta", why: "Paired con tanto gap dal pairing alto: 50%." } : { a: ["75", "100"], cat: "Turn che accoppia una carta alta", why: "Nessuna regola specifica: size polare 75% o 100%." };
  if (tf.fourStraight && tf.t.r >= 10) return { a: ["50"], cat: "Quarta carta a scala alta", why: "Quarte carte a scala alte: 50%, per puntare anche le doppie coppie." };
  if (tf.fourStraight && tf.t.r <= 8) return { a: ["50"], cat: "Turn basso che chiude scale basse", why: "Turn bassi che chiudono scale basse: 50%." };
  if (tf.connects || tf.near) return { a: ["75"], cat: "Il turn rafforza le connessioni a scala", why: "75% sulle carte che rafforzano le connessioni a scala." };
  return { a: ["100", "150"], cat: "Blank", why: "100% e 150%: size polarizzanti sulle blank dopo aver giocato range al flop." };
}
const TURN_SPOTS = {
  T1: { n: "SRP · BTN vs BB: c-bet 30% range al flop, il BB chiama", src: "Aggressore", rule: turnS1, flopRule: f => ruleS1v7(f), opts: [["75", "75%"], ["100", "100%"], ["150", "Overbet 150%"]] },
  T2: { n: "BvB · SB vs BB: B25 range al flop, il BB chiama", src: "BvB", rule: turnS2, flopRule: f => { const s = bvbStrat(f._cards); return s.sols[0] === "B25" ? { a: ["b25"] } : null; }, opts: [["30", "30%"], ["50", "50%"], ["75", "75%"], ["100", "100%"], ["150", "150%"]] },
};
DRILLS.turn = {
  name: "Size del 2° barrel", short: "2° barrel", time: 25,
  desc: "Al turn dopo una c-bet chiamata: scegli la size in base a come la carta cambia le nuts.",
  rule: "Più il turn lascia invariate le nuts del flop, più la size è grande (blank = overbet). Carte che chiudono progetti o creano nuove doppie coppie per lui → size più piccola.",
  sample(ctx) {
    const sk = (ctx.opt && ctx.opt.spot) || pick(Object.keys(TURN_SPOTS));
    for (let k = 0; k < 80; k++) { const b = dealCards(4); const fl = feat(b.slice(0, 3)); const r = TURN_SPOTS[sk].flopRule(fl); if (r && r.a.some(x => ["r30", "r25", "b25"].includes(x))) return { sk, b: b.join("") }; }
    return { sk: "T1", b: "Ks7d2c4h" };
  },
  build({ sk, b }) {
    const sp = TURN_SPOTS[sk], cs = b.match(/../g), tf = turnFeat(cs.slice(0, 3), cs[3]), r = sp.rule(tf);
    return {
      title: sp.n,
      body: `<p class="ctx">${sp.n}. Continui a puntare al turn: con quale size?</p>` + tableHtml([{ lbl: "Flop", cards: cs.slice(0, 3).join("") }, { lbl: "Turn", cards: cs[3] }], sk === "T2" ? { hero: "SB", vil: "BB", pot: 9, inv: 4.5 } : { hero: "BTN", vil: "BB", pot: 8.8, inv: 4.15 }),
      layout: sp.opts.length > 3 ? "cols3" : "cols3", center: true, opts: sp.opts.map(([v, l]) => ({ label: l, v })), timed: false,
      check(v) {
        const lab = x => sp.opts.find(o => o[0] === x)[1];
        return { score: r.a.includes(v) ? 100 : 0, correct: r.a[0], expl: `<p><b>${r.cat}</b> → ${r.a.map(lab).join(" oppure ")}.</p><p>${r.why}</p><p class="muted" style="font-size:13px">Fonte: ${sp.src}. La size si sceglie per tutto il range, non per la singola mano.</p>` };
      },
    };
  },
};

/* ---- concetti ---- */
const CONCEPTS = [
  { q: "SRP BTN vs BB: vieni check-raisato al turn. Cosa dice la strategia di riferimento?", o: ["Non avere paura di overfoldare: il field usa poco questa mossa ed è sbilanciato sul nuttish", "Chiama sempre con top pair o meglio", "Rilancia i tuoi bluff migliori", "Chiama per MDF"], a: 0, ex: "il check-raise turn nel field è raro e spostato sul nuttish. Overfoldare qui va bene." },
  { q: "Al flop, dopo una tua c-bet, conviene giocare bet + 3-bet?", o: ["Sì, con value e bluff", "No: si può giocare senza bet+3bet flop nei SRP, il field non ne approfitta", "Solo con le nuts", "Solo sui board accoppiati"], a: 1, ex: "eliminare la 3-bet flop semplifica il gioco e i dati mostrano che il field non allarga il check-raise per sfruttarlo." },
  { q: "Difesa BB vs BTN: conviene usare la donk bet al flop?", o: ["Sì, sui board bassi", "Sì, con i progetti", "No: pochi vantaggi, pochi flop adatti e risposte casuali", "Solo contro i reg"], a: 2, ex: "Difese: no donkbet." },
  { q: "BB vs BTN: con che size fai check-raise sui board accoppiati al 10 o più alti?", o: ["30%", "50%", "75%", "100%"], a: 0, ex: "30% sui paired dove c'è parità di trips o peggio: i pairati al 10 o più alti." },
  { q: "BB vs BTN: check-raise su board tipo 993 (paired basso con kicker basso)?", o: ["30%", "50%, per proteggere le coppie tra il 9 e il 3", "100%", "Mai check-raise"], a: 1, ex: "50% sui paired 99x- con kicker più basso: vantaggio di trips e protezione sulle overcard." },
  { q: "BB vs BTN: check-raise sui board A-high super secchi?", o: ["30%", "50%", "75%", "100%: raisiamo pochissimo e ultra polare"], a: 3, ex: "Size POT sugli A-high superdry, e sui paired bassi con kicker alto." },
  { q: "BTN in posizione al river: quando è corretto puntare 30%?", o: ["Dopo tre barrel", "In bet-check-bet", "In check-check-bet", "Mai: al river IP non si punta 30%"], a: 3, ex: "al river IP non vogliamo MAI bettare 30, in nessuna linea." },
  { q: "BB, linea check-check al flop e al turn (XX-XX), river: cosa fare con le mani senza showdown value?", o: ["Checkare e mollare", "Bettarle tutte: l'overfold del field qui è enorme", "Bettare solo i progetti mancati con blocker", "Bettare 30%"], a: 1, ex: "Difese: in XX-XX river betta tutto ciò che non ha showdown value. Dati di riferimento: il BTN folda il 58% contro 30% (ottimale 25%) e l'86% contro 150% (ottimale 63%)." },
  { q: "BB dopo check/call flop e check-check turn: quale split di size al river consiglia la strategia di riferimento?", o: ["Check / 30 / 100", "Solo all-in", "Solo 75%", "Check / 50"], a: 0, ex: "Lo split con cui non si fanno errori grossi è CHECK // 30 // 100." },
  { q: "Dati di riferimento (REG NL50): quanto folda il BB contro una c-bet 30% del BTN?", o: ["Circa 20%", "Circa 37% (ottimale 34%)", "Circa 55%", "Circa 70%"], a: 1, ex: "Tabella SRC OOP BB vs BTN: fold 37% vs 30%, 43% vs 50%, 48% vs 70%, 59% vs 100%." },
  { q: "Quando vale la pena semplificare molto il gioco al flop con c-bet small?", o: ["Quando l'avversario folda il 40% o più contro c-bet small", "Mai", "Solo nei 3-bet pot", "Quando l'avversario check-raisa molto"], a: 0, ex: "contro chi folda attorno al 40% o più contro size small si può semplificare molto." },
  { q: "SRP BTN vs BB, 2° barrel: quali size usa la strategia di riferimento per semplificare?", o: ["30 e 50", "75, 100 e 150", "Solo 50", "Solo all-in"], a: 1, ex: "Size di 2nd barrel tra cui scegliere: 75%, 100% e 150%. Aggiungerne altre porta pochissima EV in più." },
  { q: "Delay c-bet su A85 dopo check-check al flop. Turn K: che size?", o: ["30%", "50%", "75%", "150%"], a: 3, ex: "Esempio: 4 → 50/75, T → 75/100, K → 150%, 5 (pairing) → 30%." },
  { q: "BvB SB vs BB: dopo la prima bet nelle linee spezzate, cosa fa il field?", o: ["Folda tantissimo anche dopo", "Non folda più: i bluff vanno centellinati", "Rilancia spesso", "Folda solo al river"], a: 1, ex: "BvB: grandissimo overfold SOLO nella prima bet, dopo il field NON FOLDA." },
  { q: "River BvB: chiudi un progetto colore e hai doppia coppia. Il solver usa una size thin. Cosa suggerisce la strategia di riferimento?", o: ["Size thin come il solver", "Size polare 75%: il field non rilancia value peggiore, così puoi bet-foldare o estrarre il massimo", "Check-call", "All-in"], a: 1, ex: "Il field non raisa MAI value peggiore: meglio mettere questo value in una size polare 75%." },
  { q: "Come si scelgono i bluff (BvB difesa, river)?", o: ["Per rank, le peggiori mani", "Con una carta alta e una bassa, per non bloccare con entrambe le carte il folding range avversario", "Solo con due carte alte", "Solo progetti colore mancati"], a: 1, ex: "I bluff non devono bloccare con entrambe le carte il folding avversario." },
  { q: "3-bet pot IP con range lineare: qual è il leak principale del field?", o: ["Overfold al flop", "Under check-raise e under fold: chiamano troppo e non realizzano equity", "Troppi donk bet", "Troppi 4-bet bluff"], a: 1, ex: "3BP IP: fortissimo under check-raise e under fold. Bet range flop + turn, river quasi 0 bluff." },
  { q: "3-bet pot OOP (range depolarizzato), 2° barrel: turn che dà forte vantaggio di equity al tuo range (overcard A)?", o: ["70%", "50%", "30%", "All-in"], a: 2, ex: "Runout che avvantaggiano fortemente il tuo range: size small 30%. Se perdi equity sotto il 50%: 70%. Se mantieni vantaggio: 50%." },
  { q: "3-bet pot OOP, delay c-bet: turn blank?", o: ["30%", "2e (circa 100%)", "50%", "Check"], a: 1, ex: "Delay: blank = 2e (close 100%), connessione = 75%, colore chiuso o 4 a scala = 30%." },
  { q: "3-bet pot OOP (SB vs BTN): board monotone al flop?", o: ["Range 10% e quasi full check al turn", "Range 50%", "Check sempre", "Mix 67%"], a: 0, ex: "Monotone: range 10%, turn quasi fullcheck tranne la quarta carta a colore." },
  { q: "3-bet pot OOP, difesa del CO/BTN: conviene raisare le c-bet?", o: ["Sempre, per protezione", "La strategia di riferimento suggerisce raise 0%, tranne sui T-high o più bassi accoppiati contro chi betta range", "Solo con le nuts", "Solo sui board A-high"], a: 1, ex: "In difesa giocare a raise 0% sposta poco EV, tranne sui paired T-high o più bassi dove raisare vale oltre 30bb/100." },
  { q: "Range preflop GTO: il BB contro l'open 2,5bb del BTN quanto chiama e quanto 3-betta?", o: ["Chiama 48%, 3-betta 5%", "Chiama circa 27%, 3-betta circa 14% (3-bet a 12bb)", "Chiama 15%, 3-betta 25%", "Chiama 35%, 3-betta 8%"], a: 1, ex: "Range GTO (rake NL200): BB vs BTN fold 59%, call 26,9%, 3-bet 14,1%." },
];
/* ---------- drill del livello segreto: decisioni al tavolo live ---------- */
const LIVE_BANK = [
  { ctx: "1/2 €, stack effettivo 300 €. Due ricreativi limpano, tu sei al BTN.", hero: "A♠J♠", q: "Che rilancio fai?", o: ["Isolo a 10 € (5bb: 3bb più 1bb per limper)", "Limp anche io", "Isolo a 4 € (2bb)", "All-in"], e: "La base è 3bb più 1bb per ogni limper: 5bb, cioè 10 €. Con A♠J♠ in posizione contro due limper l'isolamento è chiaro; contro chi paga troppo puoi salire ancora." },
  { ctx: "1/2 €. Un reg rilancia a 10 € dal CO, tu sei al BTN. Stack effettivo 500 €.", hero: "5♣5♦", q: "Cosa fai?", o: ["Call: lo stack effettivo è 50 volte il call, il set mining rende", "Fold: le coppie basse non si giocano", "3-bet all-in", "3-bet a 30 € per vedere dove sono"], e: "500 ÷ 10 = 50 volte: molto sopra la soglia indicativa di 15-20 volte. Quando chiudi il set (circa 1 volta su 8) puoi vincere uno stack profondo." },
  { ctx: "1/2 €. Un giocatore con soli 60 € rilancia a 12 € da UTG. Tu sei in MP con 600 €.", hero: "4♥4♠", q: "Il call per set mining è giustificato?", o: ["No: conta lo stack effettivo, 60 €, solo 5 volte il call", "Sì: ho 600 € davanti", "Sì: le coppie si chiamano sempre", "No, ma conviene 3-bettare all-in con 44"], e: "Lo stack effettivo è il più corto tra i due: 60 € ÷ 12 € = 5 volte. Anche vincendo tutto quando chiudi il set non ripaghi le volte in cui lo manchi." },
  { ctx: "River. Un ricreativo passivo, che in tre ore non ha mai rilanciato, fa check-raise all-in.", hero: "K♦Q♦", board: "K♠9♣4♥7♦2♣", q: "Hai top pair buon kicker. Cosa fai?", o: ["Fold: da un passivo il check-raise al river è quasi sempre una mano più forte", "Call: top pair buon kicker vale lo stack", "Call perché i ricreativi bluffano spesso", "Rilancio"], e: "I passivi rilanciano raramente e quasi solo con mani forti. Al river un check-raise all-in da quel giocatore batte quasi sempre una coppia." },
  { ctx: "River. Un ricreativo che chiama tanto ha pagato flop e turn. Ora fa check.", hero: "A♥Q♣", board: "Q♠8♦5♣3♥2♠", q: "Hai top pair buon kicker. Cosa fai?", o: ["Punto per valore con una size che paga: chiama con molte mani peggiori", "Check: potrebbe avere di meglio", "Punto all-in per fare paura", "Check per indurre un bluff"], e: "Contro chi chiama troppo le mani medie pagano: la value bet è la scelta che rende di più. Lui raramente bluffa, quindi indurre bluff vale poco." },
  { ctx: "River. Contro una calling station, il colore e la scala sono mancati.", hero: "J♠T♠", board: "A♣9♥4♠3♦K♣", q: "Hai solo carta alta. Cosa fai?", o: ["Check e lascio: bluffare chi non folda non funziona", "Punto grande per farla foldare", "Punto piccolo per bloccare", "All-in"], e: "Il bluff funziona solo se l'avversario può foldare. Contro una calling station il bluff al river perde soldi: meglio arrendersi." },
  { ctx: "L'avversario punta 20 €. Vuoi rilanciare a 60 €, ma hai solo fiches da 100 €.", q: "Qual è il modo corretto?", o: ["Dire \"rilancio a 60\" e poi mettere la fiche", "Mettere la fiche da 100 € senza dire nulla", "Mettere la fiche e dire \"rilancio\" dopo", "Chiedere all'avversario se va bene"], e: "Una sola fiche più grande senza dichiarazione di solito vale come call. Dichiarare prima l'importo rende valido il rilancio." },
  { ctx: "River: tu punti 50 €, l'avversario chiama.", q: "Chi deve mostrare per primo?", o: ["Tu, che hai fatto l'ultima azione aggressiva", "L'avversario, perché ha chiamato", "Chi è più vicino al bottone", "Nessuno: si decide a sorte"], e: "Al river mostra per primo chi ha fatto l'ultima puntata o rilancio." },
  { ctx: "1/2 € con straddle da 4 € da UTG. Tu hai 400 € davanti.", q: "Quanti \"big blind\" sei profondo nel preflop di questa mano?", o: ["100, perché il riferimento diventa lo straddle", "200", "400", "50"], e: "Con lo straddle il preflop si ragiona sullo straddle come big blind: 400 € ÷ 4 € = 100." },
  { ctx: "Un ricreativo ha mostrato due volte che con i set punta tutto il piatto e con i progetti punta 1/4. Ora al turn punta 1/4.", hero: "J♣J♦", board: "T♠8♠3♦4♣", q: "Hai overpair. Cosa fai?", o: ["Continuo, anche rilanciando per valore: la size indica spesso un progetto o una mano media", "Fold: potrebbe avere un set", "Call e fold al river qualsiasi carta", "All-in subito per paura del colore"], e: "Le size mostrate sono il dato più affidabile: da questo giocatore la puntata piccola indica spesso progetti o mani medie. La tua overpair è avanti." },
  { ctx: "Un avversario di solito decide in pochi secondi. Al river ci pensa due minuti e poi punta grande. Non hai altri dati su di lui.", hero: "A♦T♦", board: "A♠J♣6♥2♦9♣", q: "Hai top pair kicker medio. Su cosa basi la decisione?", o: ["Sulla linea e sulla size della mano: il tempo da solo non basta", "Sul tempo: chi pensa a lungo bluffa", "Sul tempo: chi pensa a lungo ha le nuts", "Lancio una moneta"], e: "I tempi sono utili solo rispetto al ritmo abituale e insieme alla linea. Da soli non giustificano né un call né un fold." },
  { ctx: "Hai perso 3 buy-in con due cooler. Sei stanco, sono passate 6 ore, il tavolo è ancora buono.", q: "Cosa fai?", o: ["Chiudo: stanchezza e frustrazione sono condizioni per smettere", "Resto finché non recupero", "Resto e gioco più mani", "Cambio tavolo e continuo"], e: "Si smette in base alle condizioni, non al saldo. Dopo 6 ore e due cooler la lucidità non è più quella dell'inizio." },
  { ctx: "1/2 €. Un ricreativo limpa da UTG mostrando spesso mani come K♣9♦ e Q♥7♥. Tu sei in CO.", hero: "A♦Q♣", q: "Cosa fai?", o: ["Isolo a 8 € (3bb più 1bb per il limper)", "Limp dietro", "Fold: potrebbe avere AA", "All-in"], e: "Contro un limper largo e debole A♦Q♣ domina molte delle sue mani. Isola con 3bb più 1bb: 4bb, cioè 8 €." },
  { ctx: "Vinci 15 bb/100 dal vivo e giochi 30 mani all'ora a 1/2 €.", q: "Quanto vinci in media all'ora, prima di spese e mance?", o: ["9 €", "4,5 €", "15 €", "30 €"], e: "15 × 30 ÷ 100 = 4,5 bb all'ora. Il big blind vale 2 €: 4,5 × 2 = 9 € all'ora." },
  { ctx: "Stack effettivi 300bb, piatto singolo multiway al flop. Due avversari passivi prima di te fanno check.", hero: "A♥8♣", board: "A♠9♦4♣", q: "Qual è il piano?", o: ["Controllo il piatto: con stack così profondi la mia coppia è spesso dominata se il piatto diventa grande", "Punto e rilancio per costruire un piatto enorme", "All-in", "Fold"], e: "Asso con kicker debole fa una coppia dominabile. Con SPR altissimo e più avversari si prende valore con prudenza, senza mettere tutto dentro." },
  { ctx: "Al tavolo ci sono due ricreativi molto larghi e si libera un posto. Puoi scegliere dove sederti.", q: "Dove conviene?", o: ["Con loro alla mia destra, così parlano prima di me", "Con loro alla mia sinistra", "Di fronte a loro", "Non conta"], e: "Con i ricreativi alla tua destra agisci dopo di loro: puoi isolare i loro limp e vedere le loro scelte prima di decidere." },
];
DRILLS.live = {
  name: "Il tavolo live", short: "Live", time: 30,
  desc: "Decisioni dal vivo: limp da isolare, stack profondi, regole del tavolo, size dei ricreativi e gestione della sessione.",
  rule: "Dal vivo contano le <b>puntate</b> più dei gesti, lo <b>stack effettivo</b> decide le implied odds e contro chi chiama tutto si prende <b>valore</b>. La base degli isolamenti resta 3bb più 1bb per ogni limper.",
  sample(ctx) { ctx.lvBag = ctx.lvBag && ctx.lvBag.length ? ctx.lvBag : shuffle(LIVE_BANK.map((_, i) => i)); return { i: ctx.lvBag.pop() }; },
  build({ i }) {
    const c = LIVE_BANK[i], cc = s => s ? s.replace(/10/g, "T").replace(/♠/g, "s").replace(/♥/g, "h").replace(/♦/g, "d").replace(/♣/g, "c") : "";
    const tbl = c.hero || c.board ? tableHtml([...(c.board ? [{ lbl: ["Flop", "Turn", "River"][Math.max(0, cc(c.board).length / 2 - 3)] || "Board", cards: cc(c.board) }] : []), ...(c.hero ? [{ hero: 1, lbl: "La tua mano", cards: cc(c.hero) }] : [])]) : "";
    return {
      title: "Il tavolo live", body: `<p class="ctx">${esc(c.ctx)}</p>${tbl}<p class="qtitle">${esc(c.q)}</p>`, layout: "",
      opts: shuffle(c.o.map((t, k) => k)).map(k => ({ label: esc(c.o[k]), v: k })), timed: false,
      check(v) { return { score: v === 0 ? 100 : 0, correct: 0, expl: `<p>${esc(c.e)}</p>` }; },
    };
  },
};

