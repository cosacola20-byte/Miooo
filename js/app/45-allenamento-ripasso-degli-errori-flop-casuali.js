/* ================= ALLENAMENTO: RIPASSO DEGLI ERRORI, FLOP CASUALI, TEXTURE, TABELLE PREFLOP ================= */
const GW_REV_IV = [1, 3, 7, 14, 30];
const gwDay = (d = 0) => { const x = new Date(); x.setDate(x.getDate() + d); return dstr(x); };
function gwRevCards() { return S.revCards || (S.revCards = []); }
function gwRevDue() { const t = today(); return gwRevCards().filter(c => c.due <= t); }
/* salvo lo spot sbagliato: soluzione in memoria, nodo, mano e cosa avevi scelto */
function gwRevAdd(H, n, grade, lab, loss) {
  try {
    const E = H.L.E; if (!E || !E.o || E.cancel) return;
    const key = gwSolKey(E.o, E.it), G = E.G, cards = [G.c0[H.hero][H.h], G.c1[H.hero][H.h]].map(hcstr).join("");
    const L = gwRevCards(), sig = key + "|" + H.steps.join(",") + "|" + cards;
    if (L.some(c => c.sig === sig)) return;
    const bd = [...G.board, ...(n.cards || [])].map(hcstr).join("");
    L.unshift({ id: "r" + Date.now().toString(36) + Math.floor(Math.random() * 1e3), sig, key, steps: H.steps.slice(), hero: H.hero, cards, names: [H.L.oop, H.L.ip], board: bd, lab, loss: Math.round(loss * 100) / 100, grade, added: today(), due: gwDay(1), iv: 0, ok: 0 });
    if (L.length > 200) L.length = 200;
    persistSoon();
  } catch (e) {}
}
/* voto del ripasso: giusta -> intervallo più lungo, sbagliata -> torna a domani */
function gwRevGrade(id, grade) {
  const c = gwRevCards().find(x => x.id === id); if (!c) return;
  if (grade <= 1) { c.ok++; c.iv++; if (c.iv >= GW_REV_IV.length) { S.revCards = gwRevCards().filter(x => x.id !== id); S.revDone = (S.revDone || 0) + 1; } else c.due = gwDay(GW_REV_IV[c.iv]); }
  else { c.iv = 0; c.due = gwDay(1); }
  c.last = today(); persistSoon();
}
async function gwRevStart(queue) {
  const Q = queue || gwRevDue().map(c => c.id);
  if (!Q.length) return;
  if (typeof run !== "undefined" && run) run = null;
  setTab("solver");
  GW.rev = { queue: Q.slice(), pos: 0 };
  gwRevOpen();
}
async function gwRevOpen() {
  const R = GW.rev; if (!R) return;
  while (R.pos < R.queue.length) {
    const c = gwRevCards().find(x => x.id === R.queue[R.pos]);
    if (!c) { R.pos++; continue; }
    GW.busy = true; GW.prog = { fr: 0, ms: 0, label: "Apro lo spot da ripassare...", nodes: 0, mem: 0 }; renderStudy();
    const all = await gwMemList(), m = all.find(x => x.key === c.key);
    const E = m ? await gwMemGet(c.key, m.o) : null;
    GW.busy = false;
    if (!E) { S.revCards = gwRevCards().filter(x => x.id !== c.id); persistSoon(); R.pos++; R.miss = (R.miss || 0) + 1; continue; }
    const L = { E, steps: [], oop: c.names[0], ip: c.names[1] };
    Object.assign(GW, { direct: { oop: c.names[0], ip: c.names[1], pot: E.o.pot, stack: E.o.stack, title: "Ripasso errori" }, board: E.o.board.map(hcstr).join(""), layers: [L], customOpen: false, cache: new Map(), tab: "prac", sel: null, filter: null, ask: null });
    const PR = gwPracState();
    Object.assign(PR, { mode: "hand", diff: "std", input: "act", pause: "action", side: c.hero, hand: null, fv: null });
    PR.fixed = { L, hero: c.hero, cards: hsplit(c.cards), pid: "rev", steps: c.steps.slice(), rev: c.id };
    gwPracNew(); renderStudy();
    return;
  }
  GW.rev.end = true; renderStudy();
}
function gwRevBanner(PR, H) {
  const R = GW.rev, c = gwRevCards().find(x => x.id === PR.fixed.rev) || (R && R.lastCard);
  if (!R) return "";
  if (c) R.lastCard = c;
  const n = R.queue.length, k = Math.min(R.pos + 1, n);
  let h = `<div class="gwprob gwrev"><div class="gwprob-h"><span>🔁 Ripasso errori · ${k} di ${n}</span><b>${c ? esc(c.names[c.hero]) + " con " + c.cards.match(/../g).join(" ") + " su " + c.board.match(/../g).join(" ") : "Spot"}</b></div>`;
  if (c) h += `<p>Il ${esc(c.added)} qui avevi scelto <b>${esc(c.lab)}</b> e perso ${fmt(c.loss, 2)}bb. Rigioca la decisione: se è giusta lo rivedrai tra più giorni, se è sbagliata torna domani.</p>`;
  if (H && H.revGraded != null) h += `<p style="color:${H.revGraded <= 1 ? "#3fd07a" : "#ff8a80"};font-weight:700">${H.revGraded <= 1 ? "✔ Giusta: prossimo ripasso più avanti." : "✖ Ancora sbagliata: la rivedi domani."}</p><div class="gwrow"><button class="gwbtn" data-grevnext="1">${R.pos + 1 < n ? "Prossimo errore »" : "Fine del ripasso"}</button></div>`;
  return h + `</div>`;
}
function gwRevEndHtml() {
  const R = GW.rev, left = gwRevDue().length;
  return `<div class="gwpanel gwprob"><div class="gwprob-h"><span>🔁 Ripasso errori</span><b>Ripasso finito</b></div><p>Hai rivisto ${R.queue.length - (R.miss || 0)} spot${R.miss ? ` (${R.miss} non più in memoria, tolti dalla lista)` : ""}. ${left ? `Ne restano ${left} da rivedere oggi.` : "Per oggi non ne restano altri."} In totale da ripassare: ${gwRevCards().length}.</p><div class="gwrow"><button class="gwbtn ghost" data-gtabgo="program">Torna al Programma</button><button class="gwbtn ghost" data-grevx="1">Chiudi</button></div></div>`;
}
/* ---------- texture del flop e punteggio per tipo di board ---------- */
function gwTex(b3) {
  const r = b3.map(c => c >> 2).sort((a, b) => b - a), s = b3.map(c => c & 3), ns = new Set(s).size, u = [...new Set(r)];
  const paired = u.length < 3, hi = r[0];
  let conn = "no"; if (!paired) { const span = Math.max(...u) - Math.min(...u), lowA = u.includes(12) ? Math.max(...u.map(x => x === 12 ? -1 : x)) + 1 : 99; conn = span <= 4 || lowA <= 4 ? "conn" : "no"; }
  return { hc: hi >= 8 ? "AKQJT"[12 - hi] + "-high" : "9 o meno", tone: ns === 1 ? "Monotone" : ns === 2 ? "Two-tone" : "Rainbow", paired: paired ? "Accoppiati" : "Non accoppiati", conn: paired ? "Accoppiati" : conn === "conn" ? "Connessi" : "Scollegati" };
}
function gwTexRec(E, lossPot) {
  if (!E || !E.G || E.G.board.length < 3) return;
  const T = gwTex(E.G.board.slice(0, 3)), X = S.texStats || (S.texStats = {});
  [["tone", T.tone], ["paired", T.paired], ["hc", T.hc], ["conn", T.conn]].forEach(([g, v]) => { const k = g + ":" + v, e = X[k] || (X[k] = { m: 0, lp: 0 }); e.m++; e.lp += Math.min(lossPot, 0.25); });
}
function gwTexHtml() {
  const X = S.texStats || {}; if (!Object.keys(X).length) return "";
  const grp = [["tone", "Colori", ["Rainbow", "Two-tone", "Monotone"]], ["paired", "Coppie", ["Non accoppiati", "Accoppiati"]], ["hc", "Carta alta", ["A-high", "K-high", "Q-high", "J-high", "T-high", "9 o meno"]], ["conn", "Connessione", ["Scollegati", "Connessi", "Accoppiati"]]];
  const row = (g, v) => { const e = X[g + ":" + v]; if (!e || !e.m) return ""; const sc = Math.max(0, 100 - e.lp / e.m * 400), col = sc >= 85 ? "#3fd07a" : sc >= 70 ? "#f0c24b" : "#ff8a80"; return `<div class="gwtex-r"><span>${esc(v)}</span><div class="gwtrk"><i style="width:${sc}%;background:${col}"></i></div><b style="color:${col}">${Math.round(sc)}%</b><em>${e.m}</em></div>`; };
  return `<div class="gwpanel"><div class="gwhead"><b>🧭 Punteggio per tipo di flop</b><span class="gwmuted">decisioni</span></div>${grp.map(([g, n, vs]) => { const rs = vs.map(v => row(g, v)).join(""); return rs ? `<div class="gwsub" style="margin:6px 0 2px">${n}</div>${rs}` : ""; }).join("")}<p class="gwmuted" style="margin:6px 0 0">Il punteggio viene dall'EV perso in Allenati su ogni tipo di board. Usa 🎲 Flop casuale per allenarti su texture diverse.</p></div>`;
}
/* flop casuale per lo stesso spot preflop: pesi come la frequenza reale dei flop */
function gwRandFlop() {
  if (GW.busy) return;
  const P = gwPre(); if (!P || !P.flop) return;
  const tot = GW_FLOPSUB.reduce((s, f) => s + (f.w || 1), 0); let x = Math.random() * tot, fl = GW_FLOPSUB[0].b;
  for (const f of GW_FLOPSUB) { x -= f.w || 1; if (x <= 0) { fl = f.b; break; } }
  /* rinomino i semi a caso per non vedere sempre gli stessi */
  const pm = msPerms().P[Math.floor(Math.random() * 24)];
  fl = hsplit(fl).map(c => hcstr((c & ~3) | pm[c & 3])).join("");
  GW.board = fl; GW.layers = []; GW.cache = new Map(); GW.autoPrac = true; GW.direct = null;
  gwSolveFlop(P, true);
}
/* ---------- tabelle personali nell'albero preflop ---------- */
const GW_PFC = new Map();
function gwSpF(sp) {
  const ov = S.pfOver && S.pfOver[sp.id]; if (!ov || !Object.keys(ov).length) return sp.f;
  const tabs = Object.entries(ov).map(([i, id]) => [+i, myRangeGet(id)]).filter(([, t]) => t);
  if (!tabs.length) return sp.f;
  const ck = sp.id + "|" + tabs.map(([i, t]) => i + ":" + t.id + ":" + t.upd).join(",");
  if (GW_PFC.has(ck)) return GW_PFC.get(ck);
  const W = tabs.map(([i, t]) => [i, svParseRange(t.range)]), out = {}, A = sp.acts.length;
  for (let k = 0; k < PF_N; k++) {
    const nm = pfName(k), base = sp.f[nm] || sp.acts.map((_, i) => i === 0 ? 1 : 0), f = base.slice();
    W.forEach(([i, w]) => { f[i] = w[nm] || 0; });
    let s = 0; for (let i = 1; i < A; i++) s += f[i];
    if (s > 1) { for (let i = 1; i < A; i++) f[i] /= s; s = 1; }
    f[0] = Math.max(0, 1 - s); out[nm] = f;
  }
  GW_PFC.set(ck, out); return out;
}
function gwPfOvModal() {
  const P = gwPre(), sp = P && P.cur && P.cur.sp; if (!sp) return "";
  const ov = (S.pfOver && S.pfOver[sp.id]) || {}, L = myRanges();
  return `<div class="gwmodal"><div class="gwmodal-b" style="max-width:560px"><div class="gwhead"><b>✎ Tabelle personali · ${esc(sp.label)}</b><button class="gwbtn ghost" data-gpfov="0">Chiudi</button></div>
    <p class="gwmuted" style="margin:0 0 10px">Per ogni azione scegli una delle tue tabelle: il peso della mano nella tabella diventa la frequenza di quell'azione, il fold è quello che resta. Vale nello Study, nella linea preflop e nei range che arrivano al flop.</p>
    ${L.length ? sp.acts.map((a, i) => i === 0 ? "" : `<label class="gwpfov"><span>${esc(a)}</span><select data-gpfsel="${i}"><option value="">Tabella GTO</option>${L.map(t => `<option value="${t.id}" ${ov[i] === t.id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label>`).join("") : `<p>Non hai ancora tabelle salvate: creane una con <b>📋 Tabelle</b>.</p>`}
    <div class="gwrow"><button class="gwbtn ghost" data-gpfreset="1">Ripristina le tabelle GTO</button><button class="gwbtn" data-gtabs="1">📋 Crea o modifica tabelle</button></div></div></div>`;
}
function gwTrainBind() {
  const Q = q => document.querySelectorAll(q);
  Q("[data-grevgo]").forEach(b => b.onclick = () => gwRevStart());
  Q("[data-grevnext]").forEach(b => b.onclick = () => { GW.rev.pos++; gwRevOpen(); });
  Q("[data-grevx]").forEach(b => b.onclick = () => { GW.rev = null; gwNewHand(); });
  Q("[data-grandflop]").forEach(b => b.onclick = () => gwRandFlop());
  Q("[data-gpfov]").forEach(b => b.onclick = () => { GW.pfOv = b.dataset.gpfov === "1"; renderStudy(); });
  Q("[data-gpfsel]").forEach(s => s.onchange = () => { const P = gwPre(), sp = P.cur.sp; S.pfOver = S.pfOver || {}; const ov = S.pfOver[sp.id] = S.pfOver[sp.id] || {}; if (s.value) ov[s.dataset.gpfsel] = s.value; else delete ov[s.dataset.gpfsel]; persistSoon(); GW.cache = new Map(); renderStudy(); });
  Q("[data-gpfreset]").forEach(b => b.onclick = () => { const P = gwPre(), sp = P.cur.sp; if (S.pfOver) delete S.pfOver[sp.id]; persistSoon(); renderStudy(); });
}
/* ---------- banco di prova della precisione ---------- */
function gwBenchModal() {
  const B = GW_BENCH, rows = B ? Object.entries(B.rows) : [];
  const pct = x => fmt(x * 100, 1);
  const body = rows.length ? `<div class="gwtable"><table><thead><tr><th>Flop</th><th>Tipo</th><th>Completo</th><th>Normale 16x8</th><th>Alta 24x12</th></tr></thead><tbody>${rows.map(([b, r]) => { const c = m => { const x = r[m]; if (!x) return "-"; const n = x.cmp.nodes["0"] || {}, d = n.full ? Math.max(...n.full.map((f, i) => Math.abs(n.samp[i] - f))) : 0; return `<span class="mono">${Math.round(x.sec)}s</span><br><small>EV ${fmt(Math.max(Math.abs(x.cmp.ev[0]), Math.abs(x.cmp.ev[1])), 2)}bb · freq ±${pct(d)}% · mani ${pct(n.hand || 0)}%</small>`; }; return `<tr><td class="gwtb">${(b.match(/../g) || []).map(x => gwCardS(x)).join("")}</td><td>${esc(r.lab || "")}</td><td class="mono">${Math.round(r.full.sec)}s</td><td>${c("16x8")}</td><td>${c("24x12")}</td></tr>`; }).join("")}</tbody></table></div>` : `<p class="gwmuted">Il banco di prova è ancora in corso: i risultati compaiono qui al prossimo aggiornamento.</p>`;
  const agg = m => { const xs = rows.map(([, r]) => r[m]).filter(Boolean); if (!xs.length) return null; const ev = xs.map(x => Math.max(Math.abs(x.cmp.ev[0]), Math.abs(x.cmp.ev[1]))), hd = xs.map(x => (x.cmp.nodes["0"] || {}).hand || 0), fr = xs.map(x => { const n = x.cmp.nodes["0"] || {}; return n.full ? Math.max(...n.full.map((f, i) => Math.abs(n.samp[i] - f))) : 0; }); const av = a => a.reduce((s, v) => s + v, 0) / a.length; return { ev: av(ev), evMax: Math.max(...ev), hd: av(hd), fr: av(fr), frMax: Math.max(...fr) }; };
  const A = agg("16x8"), C = agg("24x12");
  const sum = A ? `<div class="gwbench-s">${[["Normale (16x8)", A], ["Alta (24x12)", C]].filter(x => x[1]).map(([n, x]) => `<div><b>${n}</b><span>EV: in media ${fmt(x.ev, 2)}bb di differenza (max ${fmt(x.evMax, 2)})</span><span>Frequenze dopo il check: ±${pct(x.fr)}% in media (max ${pct(x.frMax)}%)</span><span>Mano per mano: ${pct(x.hd)}% di strategia diversa</span></div>`).join("")}</div>` : "";
  return `<div class="gwmodal"><div class="gwmodal-b" style="max-width:900px"><div class="gwhead"><b>📐 Precisione del solver al flop</b><button class="gwbtn ghost" data-gbench="0">Chiudi</button></div>
    <p class="gwmuted" style="margin:0 0 10px">Al flop turn e river sono campionati. Qui confronto la precisione Normale e Alta con il calcolo completo (tutte le carte turn e river) su ${rows.length || 12} flop di tipo diverso, BTN contro BB, ${B ? B.it : 60} iterazioni, albero flop 33/100, turn e river 75. "Mani" è quanta strategia cambia in media mano per mano, pesata per la frequenza delle mani. I tempi sono del server di prova, non del tuo computer.</p>${sum}${body}</div></div>`;
}

