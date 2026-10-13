/* ================= FICHES (bravura) =================
   Separate dagli XP: gli XP misurano l'allenamento, le fiches i risultati delle decisioni
   (giusta +0,2 buy-in, imprecisa -0,05, sbagliata -0,2 al livello su cui giochi, arrotondati a fiches intere).
   Come un bankroll vero: 1 buy-in di NLx vale 2x fiches, si parte con 120 (30 buy-in di NL2),
   per salire servono 30 buy-in del livello successivo (NL5 300, NL10 600, NL25 1.500...) e sotto i 15 buy-in un livello si chiude. */
const BR_BI = { nl2: 4, nl5: 10, nl10: 20, nl25: 50, nl50: 100, nl100: 200, nl200: 400, nl500: 1000, nl1000: 2000, live: 2000 };
const BR_UP = { nl2: 30, nl5: 30, nl10: 30, nl25: 30, nl50: 30, nl100: 30, nl200: 30, nl500: 30 };
const BR_MIN = 15, BR_START = 120, BR_FLOOR = 40;
const FI = 1;
const fmtFi = x => { const n = Math.round(x * FI); return fmt(n, 0) + (Math.abs(n) === 1 ? " fiche" : " fiches"); };
/* fiches intere per ogni risultato, mai zero per una risposta giusta o sbagliata */
const brAmt = (k, bi) => { bi = bi || brBI(); const w = Math.max(1, Math.round(0.2 * bi)); return k === "win" ? w : k === "loss" ? -w : (-Math.round(0.05 * bi) || 0); };
const brGrade = (grade, bi) => { bi = bi || brBI(); const f = [0.2, 0.1, 0, -0.1, -0.2][grade] || 0; if (!f) return 0; const v = Math.max(1, Math.round(Math.abs(f) * bi)); return f > 0 ? v : -v; };
function brGet() { const g = gS(); if (g.br == null) { g.br = BR_START; g.brMax = BR_START; } if (g.brBase == null) g.brBase = r2(g.br - ctrSum(g.brC)); return g.br; }
function brLevel() { try { if (run && run.kind === "session") { const L = sessLevel(run.id); if (L) return L; } let i = curLevelIdx(); while (i > 0 && brGet() < BR_MIN * (BR_BI[LEVELS[i].id] || 2)) i--; return LEVELS[i]; } catch (e) { return LEVELS[0]; } }
const brBI = L => BR_BI[(L || brLevel()).id] || 2;
/* fiches: si muovono solo con il risultato delle decisioni (come le mani al tavolo), non con gli XP */
const BR_WIN = 0.2, BR_IMP = -0.05, BR_LOSS = -0.2; /* in buy-in: giusta, imprecisa, sbagliata */
function brResult(score) { const a = brAmt(score >= 100 ? "win" : score > 0 ? "imp" : "loss"); return a ? brAdd(a) : 0; }
const xpTxt = n => `<span class="xpg">+${n} XP</span>`;
function brAdd(eur) {
  const g = gS(), before = brGet(), after = Math.max(BR_FLOOR, Math.round(before + eur)), d = after - before;
  g.br = after; if (d) ctrAdd(g, "brC", d); g.brMax = Math.max(g.brMax || 0, after); g.brDays = g.brDays || {}; g.brDays[today()] = (g.brDays[today()] || 0) + d;
  const ks = Object.keys(g.brDays).sort(); if (ks.length > 60) delete g.brDays[ks[0]];
  if (run) run.brRun = (run.brRun || 0) + d;
  return d;
}
const brNeedUp = L => { const i = LEVELS.indexOf(L), nx0 = LEVELS[i + 1], nx = nx0 && !nx0.secret ? nx0 : null; return nx && BR_UP[L.id] ? BR_UP[L.id] * brBI(nx) : 0; };
const brNeedPlay = L => LEVELS.indexOf(L) > 0 ? BR_MIN * brBI(L) : 0;
const brTxt = d => `<span class="brgain ${d < 0 ? "neg" : ""}">${fiSign(d)}${fmtFi(Math.abs(d))}</span>`;
const GRANKS = [
  { n: "Fish", xp: 0, m: 0 }, { n: "Micro reg", xp: 200, m: 0.3 }, { n: "NL10 crusher", xp: 500, m: 0.8 }, { n: "NL25 reg", xp: 1200, m: 1.3 },
  { n: "NL25 crusher", xp: 2000, m: 1.8 }, { n: "NL50 reg", xp: 3000, m: 2.3 }, { n: "NL100 reg", xp: 6000, m: 2.8 }, { n: "NL200 crusher", xp: 12000, m: 3.3 },
  { n: "High stakes reg", xp: 24000, m: 3.8 }, { n: "Shark", xp: 40000, m: 4.4 }, { n: "Orca", xp: 60000, m: 5 },
];
function gRank() { const g = gS(), m = gMasteryAvg(); let r = 0; const bm = (brGet(), g.brMax || 0); GRANKS.forEach((R, i) => { if (bm >= R.xp && m >= R.m - 1e-9) r = i; }); return { i: r, R: GRANKS[r], next: GRANKS[r + 1], m }; }
/* XP e serie */
const gToday = () => gS().xpDays[today()] || 0;
function gAddXP(n) { const g = gS(), d = today(); const before = gToday(); if (g.xpBase == null) g.xpBase = (g.xp || 0) - ctrSum(g.xpC); g.xp += n; if (n) ctrAdd(g, "xpC", n); g.xpDays[d] = before + n; const ks = Object.keys(g.xpDays).sort(); if (ks.length > 120) delete g.xpDays[ks[0]]; if (before < g.goal && before + n >= g.goal) { gQuestEv("goal", 1); run && (run.goalHit = true); } gQuestEv("xp", n); }
function gStreakFix() {
  const g = gS(), set = new Set(S.days); const y = new Date(); y.setDate(y.getDate() - 1); const yd = dstr(y); const y2 = new Date(); y2.setDate(y2.getDate() - 2);
  if (!set.has(today()) && !set.has(yd) && set.has(dstr(y2)) && g.freezes > 0 && !g.frozen.includes(yd)) { g.freezes--; g.frozen = [...g.frozen, yd].slice(-30); S.days = [...S.days, yd].sort(); g.usedFreeze = yd; }
}
/* missioni del giorno */
const QPOOL = [
  { id: "xp", t: g => `Guadagna ${g.goal} XP oggi`, target: g => g.goal, ev: "xp" },
  { id: "drills", t: () => "Completa 3 drill", target: () => 3, ev: "drill" },
  { id: "combo", t: () => "Fai una combo di 10 risposte giuste", target: () => 10, ev: "combo", max: true },
  { id: "perfect", t: () => "Chiudi un drill senza errori", target: () => 1, ev: "perfect" },
  { id: "review", t: () => "Rispondi a 5 esercizi di ripasso o errori", target: () => 5, ev: "review" },
  { id: "pre", t: () => "Rispondi a 15 domande preflop", target: () => 15, ev: "pre" },
  { id: "hands", t: () => "Rivedi 3 decisioni delle tue mani", target: () => 3, ev: "hands" },
  { id: "mind", t: () => "Completa una sessione Mindset con il check", target: () => 1, ev: "mind" },
  { id: "solver", t: () => "Risolvi uno spot nel solver", target: () => 1, ev: "solver" },
  { id: "fast", t: () => "10 risposte giuste in meno di 8 secondi", target: () => 10, ev: "fast" },
  { id: "concept", t: () => "5 risposte giuste nei concetti o nel Mindset", target: () => 5, ev: "concept" },
];
function gQuests() {
  const g = gS(), d = today();
  if (!g.quests || g.quests.date !== d) {
    let seed = 0; for (const ch of d) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const r = vcRng(seed), pool = QPOOL.filter(q => q.id !== "xp"), pick3 = [];
    while (pick3.length < 2) { const q = pool[Math.floor(r() * pool.length)]; if (!pick3.includes(q)) pick3.push(q); }
    g.quests = { date: d, list: [QPOOL[0], ...pick3].map(q => ({ id: q.id, p: 0, done: false })), chest: false };
  }
  return g.quests;
}
const QUEST_XP = 20, CHEST_XP = 50;
function gQuestEv(ev, n) {
  const Q = gQuests(); let changed = false;
  Q.list.forEach(it => { const q = QPOOL.find(x => x.id === it.id); if (!q || q.ev !== ev || it.done) return; const T = q.target(gS()); it.p = q.max ? Math.max(it.p, n) : it.p + n; if (it.p >= T) { it.p = T; it.done = true; changed = true; setTimeout(() => { gAddXP(QUEST_XP); persistSoon(); }, 0); gToast(`${GIC.star} Missione completata: ${q.t(gS())} · +${QUEST_XP} XP`); } });
  if (Q.list.every(x => x.done) && !Q.chest) { Q.chest = true; setTimeout(() => { gAddXP(CHEST_XP); persistSoon(); }, 0); gToast(`${GIC.trophy} Tutte le missioni di oggi: forziere da ${CHEST_XP} XP!`); }
  return changed;
}
/* traguardi */
const BADGES = [
  { id: "first", n: "Prima mano", d: "Completa il primo drill", ok: g => g.lessons >= 1 },
  { id: "s7", n: "Settimana di fuoco", d: "Serie di 7 giorni", ok: () => streak() >= 7 },
  { id: "s30", n: "Mese da grinder", d: "Serie di 30 giorni", ok: () => streak() >= 30 },
  { id: "s100", n: "Cento giorni", d: "Serie di 100 giorni", ok: () => streak() >= 100 },
  { id: "c20", n: "Combo 20", d: "20 risposte giuste di fila", ok: g => g.bestCombo >= 20 },
  { id: "c50", n: "Macchina", d: "50 risposte giuste di fila", ok: g => g.bestCombo >= 50 },
  { id: "p10", n: "Perfezionista", d: "10 drill senza errori", ok: g => g.perfect >= 10 },
  { id: "a1k", n: "Mille decisioni", d: "1.000 risposte", ok: g => g.answers >= 1000 },
  { id: "a10k", n: "Diecimila", d: "10.000 risposte", ok: g => g.answers >= 10000 },
  { id: "gold", n: "Primo oro", d: "Un'abilità a livello Oro", ok: () => CORE().some(id => gMastery(id) >= 3) },
  { id: "leg", n: "Leggenda", d: "Un'abilità a livello Leggenda", ok: () => CORE().some(id => gMastery(id) >= 5) },
  { id: "unit", n: "Limite a 3 stelle", d: "Tutte le sessioni di un limite a 3 stelle", ok: () => LEVELS.some(L => lvlSess(L).every(x => gStars(x.id) === 3)) },
  { id: "prog", n: "Programma completo", d: "Tutte le sessioni del percorso", ok: () => SESS.every(x => S.sessions[x.id]) },
  { id: "opp", n: "Schedatore", d: "5 avversari analizzati", ok: () => Object.keys(OPPS).length >= 5 },
  { id: "mind", n: "Mente d'acciaio", d: "10 sessioni Mindset registrate", ok: () => (MS.sessions || []).length >= 10 },
  { id: "top", n: "Top 1 al mondo", d: "Raggiungi il rango massimo", ok: () => gRank().i === GRANKS.length - 1 },
];
function gBadgeCheck() { const g = gS(); BADGES.forEach(b => { if (!g.badges[b.id] && b.ok(g)) { g.badges[b.id] = today(); gToast(`${GIC.crown} Traguardo sbloccato: <b>${b.n}</b>`); } }); }
function gToast(html) { let box = $("#toasts"); if (!box) { box = document.createElement("div"); box.id = "toasts"; document.body.appendChild(box); } const t = document.createElement("div"); t.className = "toast"; t.innerHTML = html; box.appendChild(t); setTimeout(() => t.classList.add("out"), 3200); setTimeout(() => t.remove(), 3700); }
/* frasi */
const GOOD_MSG = ["Perfetto!", "Lettura da crusher.", "Esatto.", "Da reg vero.", "Ottimo lavoro!", "Colpito il bersaglio.", "Pulito.", "Così si fa.", "Solido come il GTO."];
const BAD_MSG = ["Non proprio.", "Quasi, rivediamola.", "Attento qui.", "Errore utile: ora lo sai."];
const gPick = a => a[Math.floor(Math.random() * a.length)];
/* hook: ogni risposta */
function gOnAnswer(q, res, ms) {
  const g = gS(); if (!run) return "";
  run.combo = run.combo || 0; run.xpRun = run.xpRun || 0; run.maxCombo = run.maxCombo || 0;
  if (res.score == null) { gAddXP(5); run.xpRun += 5; gQuestEv("hands", 1); return `<span class="xpgain">${xpTxt(5)}</span>`; }
  g.answers++;
  let xp = 0, extra = "";
  if (res.score >= 100) {
    run.combo++; g.correct++; run.maxCombo = Math.max(run.maxCombo, run.combo); g.bestCombo = Math.max(g.bestCombo, run.combo);
    xp = 10 + (run.combo >= 10 ? 5 : run.combo >= 5 ? 3 : run.combo >= 3 ? 1 : 0);
    const d = DRILLS[q.skill]; if (q.timed && d && d.time && ms < d.time * 500) { xp += 2; extra = " · veloce"; }
    if (res.bonus) { xp += res.bonus; extra += " · difficile"; }
    if (ms < 8000) gQuestEv("fast", 1);
    if ([5, 10, 20, 30, 50].includes(run.combo)) { gSnd.combo(); gToast(`${GIC.flame} Combo x${run.combo}!`); } else gSnd.ok();
    gQuestEv("combo", run.combo);
    if (q.skill === "concetti" || q.skill === "mindset") gQuestEv("concept", 1);
  } else if (res.score > 0) { xp = 5; run.combo = 0; gSnd.bad(); }
  else { xp = 1; run.combo = 0; gSnd.bad(); }
  if (q.reviewItem || q.skill === "hands" && run.id === "herr") gQuestEv("review", 1);
  if (q.skill === "preflop") gQuestEv("pre", 1);
  if (q.skill === "hands") gQuestEv("hands", 1);
  const b0 = run.brRun || 0, dq = DRILLS[q.skill] || {};
  if (dq.xpMul != null) xp = Math.max(1, Math.round(xp * dq.xpMul));
  gAddXP(xp); if (!dq.noBr) brResult(res.score);
  run.xpRun += xp;
  return `<span class="xpgain">${xpTxt(xp)} ${brTxt((run.brRun || 0) - b0)}${extra}</span>${run.combo >= 3 ? `<span class="combo">${GIC.flame} ${run.combo}</span>` : ""}`;
}
function gOnDrillEnd(did, scores) {
  const g = gS(); const sc = scores.filter(x => x != null);
  g.lessons++; gQuestEv("drill", 1);
  if (sc.length >= 3 && sc.every(x => x >= 100)) { g.perfect++; gQuestEv("perfect", 1); gAddXP(15); run.xpRun = (run.xpRun || 0) + 15; run.perfectDrills = (run.perfectDrills || 0) + 1; }
  gAddXP(10); run.xpRun = (run.xpRun || 0) + 10;
  gBadgeCheck();
}
/* stelle di una sessione del percorso */
function gStars(id) { const r = S.sessions[id]; if (!r) return 0; return r.best >= 95 ? 3 : r.best >= 80 ? 2 : r.best >= 60 ? 1 : 0; }
/* lezione del giorno: ripasso + abilità più deboli + un pizzico di mindset */
function gDailyPlan() {
  const due = reviewDue().length, plan = [];
  if (due && S.revDay !== today()) plan.push(["review", Math.min(6, due)]);
  const c = CORE().filter(id => id !== "mindset" && !DRILLS[id].noMix && (!DRILLS[id].avail || DRILLS[id].avail()) && drillAccess(id).ok);
  const score = id => { const lv = gMastery(id), a = skillAcc(id); return lv * 100 + (a == null ? 50 : a); };
  const weak = c.slice().sort((a, b) => score(a) - score(b));
  const nx = nextSession(); const fresh = nx && nx.plan[0] ? nx.plan[0][0] : null;
  const picks = [...new Set([weak[0], weak[1], fresh && fresh !== weak[0] ? fresh : weak[2]].filter(Boolean))];
  picks.forEach((id, k) => plan.push([id, ["flopbtn", "flopbvb", "bbdef", "preflop"].includes(id) ? 12 : k === 0 ? 8 : 6]));
  plan.push(["mindset", 3]);
  return plan;
}
/* barra in alto */
function gHeader() {
  const g = gS(), st = streak(), tx = gToday(), pc = Math.min(1, tx / g.goal), R = gRank(), due = reviewDue().length;
  const ring = `<svg viewBox="0 0 36 36" class="ring"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--line)" stroke-width="4"/><circle cx="18" cy="18" r="15" fill="none" stroke="${pc >= 1 ? "#f5b700" : "#15925f"}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(pc * 94.2).toFixed(1)} 94.2" transform="rotate(-90 18 18)"/></svg>`;
  return `<button class="gpill" data-gp="streak" title="Serie di giorni">${st > 0 && S.days.includes(today()) ? GIC.flame : st > 0 ? GIC.flame : GIC.flameOff}<b>${st}</b>${g.freezes ? `<span class="ice">${GIC.ice}${g.freezes}</span>` : ""}</button>
  <button class="gpill br" data-gp="fiches" title="Fiches: la tua bravura">${GIC.chip}<b>${fmt(Math.round(brGet() * FI), 0)}</b></button>
  <button class="gpill" data-gp="goal" title="XP di oggi: ${tx}/${g.goal}">${ring}<b>${tx} XP</b></button>
  <button class="gpill rank" data-gp="rank" title="Il tuo rango">${GIC.crown}<b>${esc(R.R.n)}</b></button>
  ${due ? `<button class="gpill" data-gp="review" title="Da ripassare">${GIC.book}<b>${due}</b></button>` : ""}
  <button class="gpill ghost" id="gSound" title="${g.sound ? "Suoni attivi" : "Suoni spenti"}" aria-label="Suoni">${g.sound ? GIC.sound : GIC.mute}</button>`;
}


