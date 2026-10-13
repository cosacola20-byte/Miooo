/* ================= REPORT SETTIMANALE (generato in locale, commento IA facoltativo) ================= */
/* settimana da lunedì a domenica; off=0 settimana in corso, off=1 la scorsa */
function wkRange(off) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7 - 7 * off); const e = new Date(d); e.setDate(e.getDate() + 6); return [dstr(d), dstr(e)]; }
function wkStats(a, b) {
  const g = gS(), inR = k => k >= a && k <= b;
  const hist = S.history.filter(h => h && inR(h.date || "")), per = {};
  hist.forEach(h => (h.drills || []).forEach(x => { if (x.score == null || !DRILLS[x.d]) return; const p = per[x.d] || (per[x.d] = { n: 0, s: 0 }); p.n++; p.s += x.score; }));
  const sc = hist.map(h => h.score).filter(v => v != null), acc = sc.length ? Math.round(sc.reduce((x, y) => x + y, 0) / sc.length) : null;
  const sum = o => Math.round(Object.entries(o || {}).filter(([k]) => inR(k)).reduce((x, [, v]) => x + (+v || 0), 0) * 100) / 100;
  const days = new Set(S.days.filter(inR)).size, exams = Object.entries(S.examOk || {}).filter(([, d]) => (d || []).some(inR)).map(([id]) => id);
  const sk = Object.entries(per).filter(([, p]) => p.n >= 1).map(([id, p]) => ({ id, n: p.n, a: Math.round(p.s / p.n) })).sort((x, y) => y.a - x.a);
  return { a, b, sessions: hist.length, acc, xp: sum(g.xpDays), br: sum(g.brDays), days, exams, sk };
}
function wkBuild(off) {
  const [a, b] = wkRange(off), [pa, pb] = wkRange(off + 1), W = wkStats(a, b), P = wkStats(pa, pb);
  const best = W.sk[0], worst = W.sk.length > 1 ? W.sk[W.sk.length - 1] : null, lines = [];
  if (!W.sessions) lines.push("Questa settimana non hai registrato allenamenti. Anche 10 minuti al giorno bastano per non perdere il ritmo.");
  else {
    lines.push(`${W.sessions === 1 ? "Un allenamento" : `${W.sessions} allenamenti`} ${W.days === 1 ? "in un giorno" : `in ${W.days} giorni`}, ${W.xp} XP.`);
    if (W.acc != null) lines.push(P.acc != null ? `Precisione media ${W.acc}% (la settimana prima ${P.acc}%): ${W.acc > P.acc ? "stai migliorando" : W.acc < P.acc ? "in calo, rallenta e rivedi gli errori" : "stai tenendo il livello"}.` : `Precisione media ${W.acc}%.`);
    lines.push(`Fiches nella settimana: ${fiSign(W.br)}${fmtFi(Math.abs(W.br))} (ora hai ${fmtFi(brGet())}).`);
    if (best) lines.push(`Punto forte: ${DRILLS[best.id].name} (${best.a}%).`);
    if (worst && worst.a < 80) lines.push(`Da ripassare: ${DRILLS[worst.id].name} (${worst.a}%).`);
    if (W.exams.length) lines.push(`Esami superati: ${W.exams.length}.`);
  }
  const due = typeof gwRevDue === "function" ? gwRevDue().length : 0;
  const focus = worst && worst.a < 80 ? `Allena ${DRILLS[worst.id].name} finché non superi l'80%${due ? `, e chiudi i ${due} spot del ripasso errori` : ""}.` : due ? `Chiudi i ${due} spot del ripasso errori.` : W.sessions ? "Mantieni il ritmo e prova l'esame del livello quando i requisiti sono verdi." : "Riparti dalla lezione del giorno nella scheda Programma.";
  return { wk: a, end: b, off, date: today(), title: off ? `Settimana ${a.slice(8)}/${a.slice(5, 7)} → ${b.slice(8)}/${b.slice(5, 7)}` : "Settimana in corso", summary: lines.join(" "), focus, weak: worst && worst.a < 80 ? worst.id : null, stats: W };
}
/* ogni settimana: alla prima apertura dopo la fine della settimana il report della settimana scorsa si genera da solo */
function wkAuto() { const [a] = wkRange(1); if (S.wrep && (typeof S.wrep !== "object" || typeof S.wrep.wk !== "string" || typeof S.wrep.summary !== "string")) S.wrep = null; if (S.wrep && S.wrep.stats && !Array.isArray(S.wrep.stats.sk)) S.wrep.stats = null; if (!S.wrep || S.wrep.off === 0 && S.wrep.wk <= a || S.wrep.wk < a) { if (S.history.some(h => h && h.date >= a) || S.wrep) { S.wrep = wkBuild(1); persist(); } } return S.wrep; }
function wkHtml() {
  const R = wkAuto() || (REPORT ? { title: REPORT.title || "Report", date: REPORT.date || "", summary: REPORT.summary || "", focus: REPORT.focus || "" } : null);
  const ai = R && R.ai ? `<div class="rule" style="margin-top:10px"><b>Coach IA:</b> ${esc(R.ai)}</div>` : "";
  return `<section class="panel" style="margin-bottom:16px"><div class="eyebrow">Report settimanale</div>${R ? `<h3 style="margin:4px 0 8px">${esc(R.title)} <span class="muted" style="font-size:13px;font-weight:400">${/^\d{4}-\d\d-\d\d$/.test(R.date || "") ? new Date(R.date + "T12:00").toLocaleDateString("it-IT") : esc(R.date || "")}</span></h3><div class="report">${esc(R.summary)}</div>${R.focus ? `<div class="rule" style="margin-top:10px"><b>Focus della prossima settimana:</b> ${esc(R.focus)}${R.weak && DRILLS[R.weak] ? ` <button class="btn" style="margin-left:6px;padding:5px 10px" data-free="${R.weak}">Allenalo ora</button>` : ""}</div>` : ""}${ai}` : `<p class="muted" style="margin:6px 0 0">Il report si crea da solo all'inizio di ogni settimana, con i numeri della settimana appena chiusa. Puoi generarlo anche adesso sulla settimana in corso.</p>`}
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn" id="wkNow">📊 Genera sulla settimana in corso</button>${R && R.stats && sample ? `<button class="btn ghost" id="wkAi">✨ Commento del coach IA</button>` : ""}</div><p id="wkMsg" class="muted" style="font-size:13px;margin:6px 0 0"></p></section>`;
}
function wkBind() {
  const n = $("#wkNow"); if (n) n.onclick = () => { S.wrep = wkBuild(0); persist(); renderProgress(); };
  const b = $("#wkAi"); if (b) b.onclick = async () => {
    const R = S.wrep; if (!R || !sample) return; b.disabled = true; $("#wkMsg").textContent = "Il coach IA sta leggendo i numeri...";
    const W = R.stats, sk = W.sk.map(x => `${DRILLS[x.id].name}: ${x.a}% su ${x.n}`).join("; ");
    const prompt = `Sei un coach di poker cash 6-max. Numeri della settimana di un allievo (livello ${LEVELS[curLevelIdx()].stake}): ${W.sessions} allenamenti in ${W.days} giorni, precisione media ${W.acc == null ? "n.d." : W.acc + "%"}, fiches vinte o perse ${Math.round(W.br * FI)}, XP ${W.xp}. Abilità: ${sk || "nessuna"}. Rispondi in italiano, massimo 3 frasi concrete e incoraggianti, senza trattini lunghi. Rispondi SOLO con JSON: {"commento": "..."}`;
    try { const r = await sample.json(prompt, { modelTier: "default" }); R.ai = String(r && r.commento || "").slice(0, 600); persist(); renderProgress(); }
    catch (e) { b.disabled = false; const m = $("#wkMsg"); if (m) m.textContent = e && e.code === "rate_limited" ? "Troppe richieste ravvicinate: riprova tra qualche minuto." : "Commento non disponibile ora, riprova più tardi."; }
  };
}
function renderProgress() {
  const hist = S.history.slice().reverse(), vals = S.history.slice(-20).map(h => h.score).filter(v => v != null);
  const skills = Object.entries(DRILLS).filter(([id]) => id !== "review" && id !== "herr").map(([id, d]) => { const a = skillAcc(id), t = skillTime(id); return `<div class="skill"><span>${d.short}</span><div class="meter"><i style="width:${a || 0}%;background:${a == null ? "var(--line)" : a >= 80 ? "var(--good)" : a >= 60 ? "var(--gold)" : "var(--bad)"}"></i></div><span class="mono" style="text-align:right">${a == null ? "-" : Math.round(a) + "%"}<br><span class="muted" style="font-size:11px">${t == null ? "" : fmt(t, 1) + " s"}</span></span></div>`; }).join("");
  const weak = Object.keys(DRILLS).filter(id => id !== "review" && id !== "hands" && skillAcc(id) != null).sort((a, b) => skillAcc(a) - skillAcc(b))[0];
  let h = gProgressTop() + wkHtml();
  h += `<div class="pgrid"><section class="panel"><div class="eyebrow">Andamento</div><h3 style="margin:4px 0 10px">Punteggio delle ultime sessioni</h3><div class="chart">${lineChart(vals)}</div></section><section class="panel"><div class="eyebrow">Abilità</div><h3 style="margin:4px 0 8px">Precisione e tempo medio (ultimi 40)</h3>${skills}${weak ? `<div class="rule" style="margin-top:12px">Punto debole: <b>${DRILLS[weak].name}</b>. <button class="btn" style="margin-left:6px;padding:5px 10px" data-free="${weak}">Allenalo ora</button></div>` : ""}</section></div>`;
  h += `<section class="panel" style="margin-top:16px"><div class="eyebrow">Storico</div><h3 style="margin:4px 0 8px">Allenamenti</h3>${hist.length ? `<div class="tablewrap"><table class="hist"><thead><tr><th>Data</th><th>Allenamento</th><th>Drill</th><th style="text-align:right">Punteggio</th></tr></thead><tbody>${hist.slice(0, 40).map(x => `<tr><td class="mono">${esc(x.date)}</td><td>${esc(x.label)}</td><td>${x.drills.map(d => `${DRILLS[d.d]?.short || d.d} ${d.score == null ? "rivista" : d.score + "%"}`).join(" · ")}</td><td class="mono" style="text-align:right"><b>${x.score == null ? "-" : x.score + "%"}</b></td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Ancora nessun allenamento registrato. Parti dal Giorno 1 nella scheda Programma.</p>`}</section>`;
  h += trophyCase() + xpLbPanel();
  h += `<p class="note">${S.review.length} esercizi nella coda di ripasso. <button class="btn ghost" style="padding:4px 10px;font-size:13px" id="resetBtn">Azzera progressi</button> <span id="resetConfirm"></span></p>`;
  $("#view").innerHTML = h; wkBind(); xpLbMount();
  $("#resetBtn").onclick = () => { $("#resetConfirm").innerHTML = `Sicuro? <button class="btn" style="padding:4px 10px;font-size:13px" id="resetYes">Sì, azzera</button>`; $("#resetYes").onclick = () => { S = EMPTY(); S._reset = Date.now(); persist(); render(); }; };
}
function mountPreView() { const sel = $("#preSel"); if (!sel) return; const draw = () => { $("#preView").innerHTML = preGrid(PRE_BY[sel.value], null); }; sel.onchange = draw; draw(); }
function renderRef() {
  const rows = [[0.25, "1/4"], [0.33, "1/3"], [0.5, "1/2"], [0.66, "2/3"], [0.75, "3/4"], [1, "Pot"], [1.5, "1,5x"], [2, "2x"]].map(([s, l]) => `<tr><td>${l}</td><td class="n">${fmt(s / (1 + s) * 100)}%</td><td class="n">${fmt(s / (1 + 2 * s) * 100)}%</td><td class="n">${fmt(1 / (1 + s) * 100)}%</td></tr>`).join("");
  const outs = [4, 8, 9, 12, 15].map(o => `<tr><td>${o}</td><td class="n">${fmt(o / 46 * 100, 1)}%</td><td class="n">${fmt((1 - (47 - o) * (46 - o) / (47 * 46)) * 100, 1)}%</td></tr>`).join("");
  $("#view").innerHTML = `<div class="ref"><section class="panel"><h3 style="margin-bottom:4px">Size e numeri</h3><p class="muted" style="margin:0 0 8px;font-size:13px">Fold bluff: quanto deve foldare lui per il tuo bluff. Equity call: quanto devi vincere per chiamare. MDF: quanto devi difenderti.</p><table><thead><tr><th>Size</th><th class="n">Fold bluff</th><th class="n">Equity call</th><th class="n">MDF</th></tr></thead><tbody>${rows}</tbody></table></section><section class="panel"><h3 style="margin-bottom:8px">Outs → quante volte chiudi</h3><table><thead><tr><th>Outs</th><th class="n">Turn → river</th><th class="n">Flop → river</th></tr></thead><tbody>${outs}</tbody></table><h3 style="margin:16px 0 8px">Combinazioni</h3><table><tbody><tr><td>Coppia (es. QQ)</td><td class="n">6 · 3 · 1</td></tr><tr><td>Non coppia (es. AK)</td><td class="n">16 · 12 · 9</td></tr><tr><td>Suited / offsuit</td><td class="n">4 / 12</td></tr></tbody></table></section><section class="panel"><h3 style="margin-bottom:8px">Metodo dei 10 secondi</h3><ol style="margin:0;padding-left:20px;line-height:1.7"><li>Come è arrivato qui? (linea + size)</li><li>Range in 5 categorie</li><li>Vantaggio di range e di nuts</li><li>Se punto: chi chiama, chi folda, chi raisa?</li><li>La mia mano: value, showdown o bluff?</li><li>Size che colpisce il bersaglio + piano</li></ol></section><section class="panel" style="grid-column:1 / -1"><h3 style="margin-bottom:8px">Range preflop GTO</h3><label for="preSel" class="muted" style="font-size:13px">Spot</label> <select id="preSel" style="font:inherit;padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink);margin:0 0 10px">${preOptions()}</select>${pre25Ok() ? "" : `<p class="pre25note">🔒 Le tabelle NL25-NL200 si sbloccano quando arrivi a NL25. Fino ad allora usi quelle dei micro limiti (NL2-NL10).</p>`}<div id="preView"></div></section><section class="panel"><h3 style="margin-bottom:8px">Profili in una riga</h3><table><tbody>${Object.values(ARCH).map(a => `<tr><td><b>${a.n}</b></td><td>${a.ex}</td></tr>`).join("")}</tbody></table></section></div>`;
  mountPreView();
}

