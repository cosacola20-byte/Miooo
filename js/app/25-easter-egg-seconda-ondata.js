/* ================= EASTER EGG, SECONDA ONDATA ================= */
Object.assign(EGG_SVG, {
  ivey: '<rect x="8" y="12" width="44" height="32" rx="16" fill="#1c1c1c" stroke="#6b6b6b" stroke-width="2"/><path d="M18 28 h8 M34 28 h8" stroke="#e8e8e8" stroke-width="3" stroke-linecap="round"/><path d="M24 37 h12" stroke="#9a9a9a" stroke-width="2" stroke-linecap="round"/>',
  hansen: '<path d="M30 6 L36 22 L54 22 L40 32 L45 50 L30 39 L15 50 L20 32 L6 22 L24 22 Z" fill="#e05a4e" stroke="#ffb3a7" stroke-width="2"/><circle cx="30" cy="28" r="6" fill="#141414"/><path d="M27 28 h6" stroke="#f5c542" stroke-width="2"/>',
  ungar: '<path d="M12 44 q18 -40 36 -30" fill="none" stroke="#3fd18f" stroke-width="4" stroke-linecap="round"/><path d="M42 8 l8 6 l-9 4" fill="none" stroke="#3fd18f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="44" r="5" fill="#f5c542"/>',
  enright: '<rect x="6" y="20" width="48" height="22" rx="11" fill="#146b41" stroke="#6a4b24" stroke-width="3"/><path d="M30 6 l4 8 l9 1 l-7 6 l2 9 l-8 -5 l-8 5 l2 -9 l-7 -6 l9 -1 z" fill="#f5c542"/><path d="M14 44 l8 8 M46 44 l-8 8" stroke="#ffb3a7" stroke-width="3" stroke-linecap="round"/>',
  dwan: '<path d="M8 40 L22 22 L32 32 L52 10" fill="none" stroke="#7fd4ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="52" cy="10" r="4" fill="#7fd4ff"/><text x="30" y="54" text-anchor="middle" font-size="10" font-weight="900" fill="#f5c542">rrrr</text>',
  isildur: '<circle cx="30" cy="22" r="12" fill="#2b3a35"/><path d="M10 52 q20 -26 40 0 z" fill="#2b3a35"/><text x="30" y="27" text-anchor="middle" font-size="16" font-weight="900" fill="#7fd4ff">?</text>',
  hunt: '<rect x="8" y="10" width="20" height="28" rx="3" fill="#fff" transform="rotate(-10 18 24)"/><text x="12" y="30" font-size="11" font-weight="900" fill="#141414" transform="rotate(-10 18 24)">A</text><circle cx="38" cy="32" r="12" fill="none" stroke="#f5c542" stroke-width="4"/><path d="M47 41 l8 8" stroke="#f5c542" stroke-width="4" stroke-linecap="round"/>',
  time: '<circle cx="30" cy="30" r="22" fill="#1b2a25" stroke="#f5c542" stroke-width="3"/><path d="M30 14 v16 l11 7" stroke="#e8e8e8" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M8 18 a24 24 0 0 1 10 -10" stroke="#3fd18f" stroke-width="3" fill="none"/><path d="M8 18 l0 -7 M8 18 l7 0" stroke="#3fd18f" stroke-width="3" stroke-linecap="round"/>',
});
EGGS.push(
  { id: "ivey", badge: "THE SILENT TABLE", who: "Phil Ivey", tag: "Decisioni sotto pressione", svg: "ivey",
    fact: "Phil Ivey è uno dei giocatori con più braccialetti WSOP e ha giocato per anni ai tavoli con le puntate più alte. Al tavolo è famoso per l'espressione impassibile: non lascia trasparire nulla.",
    quip: "Hai tolto le decorazioni e hai deciso con quello che conta davvero. Omaggio al suo stile riservato, non a una tecnica segreta.", reward: "Tema scuro THE SILENT TABLE",
    hint: "Chiudi un drill senza errori: ti aspetta un tavolo silenzioso." },
  { id: "hansen", badge: "CONTROLLED CHAOS", who: "Gus Hansen", tag: "Exploit e disciplina", svg: "hansen",
    fact: "Gus Hansen, «The Great Dane», è il simbolo dello stile loose-aggressive: giocava moltissime mani e metteva pressione costante. Ha vinto tre titoli del World Poker Tour.",
    quip: "L'aggressività è una strategia. L'aggressività senza motivo è un conto da pagare.", reward: "Badge CONTROLLED CHAOS",
    hint: "Riconosci un giocatore molto aggressivo dalle statistiche." },
  { id: "ungar", badge: "ONE MORE RUN", who: "Stu Ungar", tag: "Resilienza", svg: "ungar",
    fact: "Stu Ungar vinse il Main Event delle WSOP nel 1980 e nel 1981. Nel 1997, dopo anni lontano dai grandi titoli, tornò a vincerlo per la terza volta.",
    quip: "Una pausa non cancella quello che hai imparato. Si riparte da una sessione, e la sessione è fatta.", reward: "Badge ONE MORE RUN",
    hint: "Se ti fermi per un po', il ritorno ha un premio." },
  { id: "enright", badge: "BREAKING THE TABLE", who: "Barbara Enright", tag: "Traguardi", svg: "enright",
    fact: "Nel 1995 Barbara Enright fu la prima donna ad arrivare al tavolo finale del Main Event delle WSOP.",
    quip: "Tre sfide difficili superate: hai aperto una strada, un tavolo alla volta.", reward: "Badge BREAKING THE TABLE",
    hint: "Supera tre sfide segrete." },
  { id: "dwan", badge: "DURRRR", who: "Tom Dwan", tag: "Aggressività giustificata", svg: "dwan",
    fact: "Tom Dwan, noto online come «durrrr», divenne famoso giovanissimo ai tavoli cash con le puntate più alte, online e in TV, per le sue linee aggressive e creative.",
    quip: "Le linee spettacolari funzionano quando hanno una ragione: vantaggio di nuts, blocker, un avversario che folda. Senza ragione sono solo spettacolo.", reward: "Badge DURRRR",
    hint: "Diventa bravo con le size grandi." },
  { id: "isildur", badge: "ANONYMOUS", who: "Isildur1", tag: "Storia del poker online", svg: "isildur",
    fact: "Nel 2009 un giocatore con il nickname «Isildur1» comparve dal nulla ai tavoli online più alti e sfidò i migliori professionisti, muovendo cifre enormi. Per mesi nessuno sapeva chi fosse; poi si scoprì che era lo svedese Viktor Blom.",
    quip: "Il mito intorno a un nickname non gioca le mani. Le statistiche e le mani mostrate sì.", reward: "Badge ANONYMOUS",
    hint: "Negli Avversari si nasconde qualcuno senza nome." },
  { id: "hunt", badge: "CACCIATORE DI CARTE", who: "Le mani leggendarie", tag: "Curiosità", svg: "hunt",
    fact: "Nell'app sono nascoste quattro carte leggendarie, fuori dai drill: ogni coppia di carte ha un soprannome e una storia.",
    quip: "Occhio da cacciatore: le hai trovate tutte, senza mai distrarti durante una decisione.", reward: "Badge CACCIATORE DI CARTE",
    hint: "Ci sono carte nascoste nelle schede dell'app." },
  { id: "time", badge: "TIME TRAVELER", who: "La storia del poker", tag: "Storia", svg: "time",
    fact: "Dalle prime WSOP degli anni Settanta al boom televisivo, dal poker online alle sessioni di studio con i solver: in cinquant'anni il gioco è cambiato più di quanto sembri.",
    quip: "Hai visitato tutte le epoche. Il gioco cambia, le decisioni giuste restano il punto.", reward: "Badge TIME TRAVELER",
    hint: "Nell'archivio dei progressi c'è un orologio." },
);
EGG_BY.ivey = EGGS.find(e => e.id === "ivey"); ["hansen", "ungar", "enright", "dwan", "isildur", "hunt", "time"].forEach(id => { EGG_BY[id] = EGGS.find(e => e.id === id); });
const EGG_CHALLENGES = ["obrestad", "money", "ivey", "hansen", "dwan"];
function eggCheckEnright() { if (!eggHas("enright") && EGG_CHALLENGES.filter(eggHas).length >= 3) eggUnlock("enright", 2200); }
const _eggUnlock0 = eggUnlock;
eggUnlock = function (id, delay) { const r = _eggUnlock0(id, delay); if (r && EGG_CHALLENGES.includes(id)) setTimeout(eggCheckEnright, 50); return r; };

/* ---- sfida a domande (riusata da Gus Hansen e Tom Dwan) ---- */
function eggQuiz(o) {
  let i = 0, ok = 0;
  const paint = pick => { const s = o.steps[i]; return `<div class="nl-ch"><div class="nl-top">${eggIcon(o.egg, 44)}<div><span class="egg-eye">${esc(o.title)} · ${i + 1} di ${o.steps.length}</span><b>${esc(o.sub)}</b></div></div>
    ${s.hero || s.board ? `<div class="nl-seat">${s.board ? `<div class="nl-cards">${cardsHtml(s.board)}</div>` : ""}${s.hero ? `<div class="nl-cards rev">${cardsHtml(s.hero)}</div>` : ""}</div>` : ""}
    <p class="mm-q">${esc(s.q)}</p>
    ${pick == null ? `<div class="nl-opts col">${shuffle(s.o.map((t, k) => k)).map(k => `<button class="btn" data-eqpick="${k}">${esc(s.o[k])}</button>`).join("")}</div>` : `<div class="nl-res ${pick === 0 ? "ok" : "ko"}"><b>${pick === 0 ? "Giusto" : "Non proprio"}</b><p>${esc(s.e)}</p></div><button class="btn primary" data-eqnext="1">${i + 1 < o.steps.length ? "Avanti" : "Vedi il risultato"}</button>`}</div>`; };
  const mount = m => { const box = m.querySelector(".nl-host"); const bind = () => {
    box.querySelectorAll("[data-eqpick]").forEach(b => b.onclick = () => { const k = +b.dataset.eqpick; if (k === 0) ok++; box.innerHTML = paint(k); bind(); });
    const nx = box.querySelector("[data-eqnext]"); if (nx) nx.onclick = () => { i++; if (i < o.steps.length) { box.innerHTML = paint(null); bind(); return; }
      const win = ok >= o.need; box.innerHTML = `<div class="nl-ch" style="text-align:center">${eggIcon(o.egg, 74)}<h2 style="margin:8px 0">${ok} su ${o.steps.length}</h2><p>${esc(win ? o.win : o.lose)}</p>${win ? "" : `<button class="btn primary" data-eqagain="1">Riprova</button>`}</div>`; bind(); if (win) eggUnlock(o.egg, 800); };
    const ag = box.querySelector("[data-eqagain]"); if (ag) ag.onclick = () => { i = 0; ok = 0; box.innerHTML = paint(null); bind(); };
  }; box.innerHTML = paint(null); bind(); };
  gModal(`<div class="nl-host"></div>`, mount);
}
/* Gus Hansen: contro un avversario che apre e punta troppo */
const HANSEN_Q = { egg: "hansen", title: "Controlled Chaos", sub: "Contro un avversario che apre e punta quasi sempre", need: 4,
  win: "L'aggressività è una strategia. L'aggressività senza motivo è un conto da pagare.", lose: "Riprova: attacca quando hai un motivo, evita le guerre senza vantaggio. Servono almeno 4 risposte giuste.",
  steps: [
    { q: "Un LAG apre dal BTN più della metà delle mani. Sei BB con A♦9♣. Cosa fai?", o: ["3-bet: contro un range così largo la tua mano è molto avanti", "Fold: è un rilancio dal bottone", "Call e fold al flop se non colpisci", "Vai all-in"], e: "Contro un open largo A9 offsuit è nettamente sopra la media del suo range: la 3-bet per valore lo punisce." },
    { q: "Lo stesso LAG ti 4-betta. Hai 7♠6♠ dopo aver provato una 3-bet di bluff. Cosa fai?", o: ["Fold: senza vantaggio la guerra di rilanci costa e basta", "5-bet all-in per non farti mettere i piedi in testa", "Call e vedi il flop fuori posizione", "Call e punto sempre il flop"], e: "Rispondere all'aggressività con altra aggressività senza equity né fold equity è il conto da pagare. Si folda e si riprova con mani migliori." },
    { q: "Al flop K♣7♦2♥ il LAG punta tre street come fa quasi sempre. Hai 8♥8♣. Qual è il piano?", o: ["Pago più largo del solito: il suo range di barrel è pieno di aria", "Fold al primo colpo: c'è un re", "Rilancio subito all-in", "Pago il flop e foldo sempre il turn"], e: "Contro chi punta troppo, i bluffcatcher valgono di più: le sue puntate includono tante mani peggiori della tua." },
    { q: "Hai J♠4♠, niente coppia, al river contro un LAG che chiama molto e rilancia spesso. Lui fa check. Bluffi?", o: ["No: contro chi chiama e rilancia tanto il bluff non ha bersaglio", "Sì, sempre: lui è aggressivo quindi debole", "Sì, all-in", "Sì, piccolo per vedere"], e: "Il bluff serve a far foldare mani migliori. Un giocatore che chiama e rilancia spesso non folda abbastanza: meglio arrendersi." },
    { q: "Hai A♣K♣ al CO, il LAG al BTN 3-betta spesso. Cosa fai preflop dopo la sua 3-bet?", o: ["4-bet per valore: AK è molto avanti contro il suo range di 3-bet largo", "Fold: è una 3-bet", "Call e check-fold al flop", "Limp alla prossima mano per evitarlo"], e: "Contro una 3-bet larga AK suited è una mano da 4-bet per valore: l'aggressività dell'avversario lavora per te quando hai la mano." },
  ] };
/* Tom Dwan: stack profondi, quando la linea aggressiva è giustificata */
const DWAN_Q = { egg: "dwan", title: "Durrrr Challenge", sub: "Stack da 200bb: quando una linea aggressiva ha senso?", need: 3,
  win: "Hai scelto l'aggressività quando aveva una ragione. È questo che rende una linea spettacolare anche giusta.", lose: "Riprova: prima di una linea aggressiva cerca la ragione (nuts, blocker, fold). Servono almeno 3 risposte giuste.",
  steps: [
    { q: "River A♠K♦7♣4♥2♠, sei in posizione con 200bb. Hai il range con più assi e re, l'avversario ha chiamato due street ed è cappato. Hai A♥K♣.", o: ["Overbet: hai vantaggio di nuts e lui non ha le mani più forti", "Check: potrebbe avere un set", "Punto 1/4 per non spaventarlo", "Fold"], e: "Quando il tuo range ha le mani migliori e quello avversario è cappato, l'overbet prende il massimo valore. È la ragione che giustifica la size." },
    { q: "River dove il colore di picche è mancato. Hai A♠5♣ senza coppia, l'avversario ha molti progetti mancati e coppie medie.", o: ["Bluff grande: l'asso di picche toglie i colori migliori e lui ha tante mani che foldano", "Check e lascio sempre", "Punto piccolo", "Mostro le carte"], e: "Il blocker sul colore e un range avversario pieno di mani che non possono pagare danno una ragione al bluff." },
    { q: "Contro una calling station profonda 200bb hai aria al river e hai puntato flop e turn. Cosa fai?", o: ["Check: senza fold equity la linea aggressiva non ha ragione", "Terzo barrel overbet", "All-in: è profonda e quindi folda", "Punto il minimo"], e: "La station non folda: il terzo barrel è solo spettacolo che costa fiches." },
    { q: "Flop T♥9♥8♣ in 3-bet pot, stack profondi. Hai Q♥J♥ (scala fatta e progetto colore). L'avversario punta.", o: ["Rilancio: hai una mano fortissima con equity anche contro i set", "Fold", "Call e fold al turn", "Call sempre fino al river senza mai rilanciare"], e: "Con la scala e il progetto colore sei avanti o con tanta equity contro quasi tutto: costruire il piatto con stack profondi è la scelta giusta." },
  ] };

/* ---- Phil Ivey: The Silent Table, cinque decisioni senza indizi decorativi ---- */
function silentStart() {
  PRE_CAT = null;
  run = { kind: "free", id: "silent", label: "The Silent Table", silent: true, plan: [["cbdef", 2], ["preflop", 2], ["size", 1]], di: 0, qi: 0, stage: "intro", scores: [], results: [], ctx: {} };
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-selected", "false")); const m = $("#gmodal"); if (m) m.remove(); render(); window.scrollTo({ top: 0 });
}
function silentOfferHtml() { return eggHas("ivey") ? "" : `<div class="egg-offer silent">${eggIcon("ivey", 46)}<div><b>Ti aspetta un tavolo silenzioso</b><span>Cinque decisioni senza aiuti grafici: restano solo le informazioni che servono. Con l'80% sblocchi un tema segreto.</span></div><button class="btn small" data-silent="1">Siediti</button></div>`; }
const eggTheme = () => S.theme === "silent" && eggHas("ivey");

/* ---- Stu Ungar: ritorno dopo una pausa di almeno 7 giorni ---- */
function eggCheckUngar() { try { if (eggHas("ungar")) return; const prev = (S.days || []).filter(d => d < today()).sort().pop(); if (!prev) return; const gap = (new Date(today()) - new Date(prev)) / 864e5; if (gap >= 7) eggUnlock("ungar", 2400); } catch (e) {} }

/* ---- caccia alle carte leggendarie: quattro carte nascoste nelle schede, mai durante una decisione ---- */
const HUNT = {
  aa: { c: "AsAh", n: "A-A, i «Rockets»", t: "La mano migliore del Texas Hold'em ti arriva una volta ogni 221 mani, in media. Il soprannome nasce dalla forma delle due A, che sembrano due razzi." },
  kk: { c: "KcKd", n: "K-K, i «Cowboys»", t: "I re sono la seconda mano migliore e si chiamano «Cowboys». Il loro incubo è un asso al flop: succede poco più di una volta su cinque quando l'avversario non ha assi." },
  s72: { c: "7c2d", n: "7-2 offsuit", t: "È considerata la peggior mano di partenza: carte basse, lontane e di semi diversi. In molte partite tra amici esiste il «7-2 game»: chi vince un piatto mostrando 7-2 riceve un piccolo premio dagli altri." },
  t2: { c: "Th2s", n: "10-2, la «Doyle Brunson»", t: "Con 10-2 Doyle Brunson vinse il Main Event delle WSOP due anni di fila, nel 1976 e nel 1977: per questo la mano porta il suo nome." },
};
const huntHas = k => !!((S.hunt || {})[k]);
function huntHtml(k) { if (huntHas(k)) return ""; return `<button class="hunt-c" data-hunt="${k}" aria-label="Una carta nascosta">${cardsHtml(HUNT[k].c, true)}</button>`; }
function huntFind(k) {
  if (!HUNT[k]) return; S.hunt = { ...(S.hunt || {}), [k]: today() }; persist();
  const n = Object.keys(HUNT).filter(huntHas).length;
  gModal(`<div class="egg-card"><span class="egg-eye">Carta leggendaria · ${n} di ${Object.keys(HUNT).length}</span><div class="hunt-big">${cardsHtml(HUNT[k].c)}</div><h2>${esc(HUNT[k].n)}</h2><p class="egg-fact">${esc(HUNT[k].t)}</p>${n < 4 ? `<p class="muted" style="font-size:12.5px">Ne restano ${4 - n} da trovare, nascoste in altre schede.</p>` : ""}</div>`);
  if (n >= 4) eggUnlock("hunt", 1500);
}

/* ---- la macchina del tempo: quattro epoche, ognuna con una curiosità, una mano storica e una sfida ---- */
const ERAS = [
  { k: "70", n: "Anni Settanta · le prime WSOP", t: "Nel 1970 nacquero le World Series of Poker a Las Vegas: il primo campione, Johnny Moss, fu scelto con un voto tra i giocatori. Dall'anno dopo il titolo si decise al tavolo.", h: "La mano: 10-2 di Doyle Brunson, campione nel 1976 e nel 1977.", go: ["preflop", "Allenati sul preflop"] },
  { k: "tv", n: "Primi anni Duemila · il boom televisivo", t: "Le telecamere sotto il tavolo mostrarono al pubblico le carte coperte dei giocatori: il poker diventò uno spettacolo da seguire in TV. Nel 2003 un dilettante qualificato online vinse il Main Event.", h: "La mano: il bluff con re alto di Chris Moneymaker contro Sammy Farha al Main Event 2003.", go: ["target", "Allenati sul bersaglio di una puntata"] },
  { k: "on", n: "Il poker online", t: "Dalla fine degli anni Novanta si gioca con soldi veri su internet: più tavoli insieme, migliaia di mani al mese e statistiche su ogni avversario. Nascono i tracker e lo studio sui numeri.", h: "La storia: nel 2009 il misterioso Isildur1 sfidò i migliori ai tavoli online più alti.", go: ["profile", "Allenati a leggere le statistiche"] },
  { k: "gto", n: "High stakes moderni · l'era dei solver", t: "Oggi i regular studiano con i solver, programmi che calcolano strategie di equilibrio. Il vantaggio si sposta su chi capisce le frequenze e sa adattarsi agli errori degli avversari.", h: "Il concetto: frequenze miste, size multiple e range bilanciati.", go: ["solver", "Apri lo Study"] },
];
function timeMachine() {
  const seen = () => S.eras || {};
  const paint = k => { const E = ERAS.find(x => x.k === k) || ERAS[0]; return `<div class="tm"><div class="nl-top">${eggIcon("time", 42)}<div><span class="egg-eye">La macchina del tempo</span><b>Scegli un'epoca</b></div></div>
    <div class="tm-eras">${ERAS.map(x => `<button class="tm-e ${x.k === E.k ? "on" : ""} ${seen()[x.k] ? "seen" : ""}" data-era="${x.k}">${esc(x.n.split(" · ")[0])}</button>`).join("")}</div>
    <div class="tm-card"><h3>${esc(E.n)}</h3><p>${esc(E.t)}</p><p class="tm-h">${esc(E.h)}</p><button class="btn small" data-erago="${E.go[0]}">${esc(E.go[1])} ›</button></div></div>`; };
  const visit = k => { S.eras = { ...seen(), [k]: today() }; persist(); if (ERAS.every(x => seen()[x.k])) eggUnlock("time", 1200); };
  gModal(`<div class="nl-host"></div>`, m => { const box = m.querySelector(".nl-host"); const bind = cur => { box.innerHTML = paint(cur); visit(cur);
    box.querySelectorAll("[data-era]").forEach(b => b.onclick = () => bind(b.dataset.era));
    box.querySelector("[data-erago]").onclick = ev => { const g = ev.currentTarget.dataset.erago; m.remove(); if (g === "solver") setTab("solver"); else startFree(g); }; }; bind(ERAS[0].k); });
}

/* ---- frasi rare di Orca: pertinenti, al massimo una al giorno per tipo e non sempre ---- */
function eggQuips(q, res) {
  if (!run || isExamRun() || res.score == null || Math.random() > 0.5) return;
  const c = run.ctx, lab = (q.opts || []).find(o => o.v === res.correct), L = lab ? String(lab.label).replace(/<[^>]+>/g, "") : "";
  if (res.score >= 100 && /^call\b/i.test(L) && ["cbdef", "bbdef", "bvb3", "p4bet", "size"].includes(q.skill)) return eggQuip("neg", "Negreanu sta prendendo appunti.");
  if (q.timed) { c.qStreak = res.score >= 100 ? (c.qStreak || 0) + 1 : 0; if (c.qStreak === 3) return eggQuip("hel2", "Hellmuth non ha ancora tiltato nessuno qui."); }
  if (res.score >= 100 && q.skill === "target" && /^check\b/i.test(L)) return eggQuip("gus", "Gus avrebbe almeno considerato l'idea.");
}
const _eggOnAnswer0 = eggOnAnswer;
eggOnAnswer = function (q, res) {
  _eggOnAnswer0(q, res);
  try {
    eggQuips(q, res);
    /* Gus Hansen: riconosci un LAG o un maniac dalle statistiche */
    if (q.skill === "profile" && res.score >= 100 && ["lag", "maniac"].includes(res.correct) && !(S.eggOffer || {}).hansen && !eggHas("hansen")) { S.eggOffer = { ...(S.eggOffer || {}), hansen: today() }; persist(); setTimeout(() => { const fb = $("#fb"); if (fb) fb.insertAdjacentHTML("beforeend", `<div class="egg-offer">${eggIcon("hansen", 46)}<div><b>Sfida segreta: Controlled Chaos</b><span>Cinque spot contro un avversario che apre e punta troppo: quando attaccare, quando lasciar perdere.</span></div><button class="btn small" data-hansen="1">Gioca</button></div>`); }, 70); }
    /* Tom Dwan: bravo con le size grandi */
    if (q.skill === "size" && res.score >= 100) { c0 = run.ctx; c0.sizeOk = (c0.sizeOk || 0) + 1; if (c0.sizeOk >= 3 && !(S.eggOffer || {}).dwan && !eggHas("dwan")) { S.eggOffer = { ...(S.eggOffer || {}), dwan: today() }; persist(); setTimeout(() => { const fb = $("#fb"); if (fb) fb.insertAdjacentHTML("beforeend", `<div class="egg-offer">${eggIcon("dwan", 46)}<div><b>Sfida segreta: Durrrr Challenge</b><span>Stack da 200bb e decisioni complicate: quando una linea aggressiva ha davvero una ragione.</span></div><button class="btn small" data-dwan="1">Gioca</button></div>`); }, 70); } }
  } catch (e) {}
};
var c0 = null;
document.addEventListener("click", e => {
  if (e.target.closest("[data-hansen]")) { e.preventDefault(); return eggQuiz(HANSEN_Q); }
  if (e.target.closest("[data-dwan]")) { e.preventDefault(); return eggQuiz(DWAN_Q); }
  if (e.target.closest("[data-silent]")) { e.preventDefault(); return silentStart(); }
  const hu = e.target.closest("[data-hunt]"); if (hu) { e.preventDefault(); hu.remove(); return huntFind(hu.dataset.hunt); }
  if (e.target.closest("[data-tmach]")) { e.preventDefault(); return timeMachine(); }
  if (e.target.closest("[data-isildur]")) { e.preventDefault(); if (!eggUnlock("isildur", 0)) gModal(eggCard("isildur")); return; }
  const th = e.target.closest("[data-eggtheme]"); if (th) { S.theme = S.theme === "silent" ? "" : "silent"; persist(); render(); return; }
});

DRILLS.concetti = {
  name: "Concetti chiave", short: "Concetti", time: 30,
  desc: "Le regole pratiche delle lezioni: check-raise, river, dati del field, 3-bet pot.",
  rule: "Domande su SRP BTN vs BB, BvB, 3-bet pot IP e OOP).",
  // correzioni a singole voci di CONCEPTS, riconosciute dall'inizio del testo della domanda
  fixes: [
    { q0: "3-bet pot OOP (range depolarizzato), 2° barrel", q: "3-bet pot OOP (range depolarizzato), 2° barrel nella strategia semplificata: turn che dà forte vantaggio di equity al tuo range (overcard A)?", o: ["70%", "50% (o check)", "30%", "All-in"], a: 1, ex: "Nella versione semplificata il 30% al turn si elimina: sposta pochissimo EV e apre spot di raise difficili. Sui turn che ti favoriscono si usa 50% (o la geometrica sulle blank), altrimenti check. In teoria su un asso comparirebbe anche il 30%." },
  ],
  fix(c) { const f = DRILLS.concetti.fixes.find(x => c.q.startsWith(x.q0)); return f ? { q: f.q, o: f.o, a: f.a, ex: f.ex } : c; },
  sample(ctx) { ctx.cBag = ctx.cBag && ctx.cBag.length ? ctx.cBag : shuffle(CONCEPTS.map((_, i) => i)); return { i: ctx.cBag.pop() }; },
  build({ i }) {
    const c = DRILLS.concetti.fix(CONCEPTS[i]);
    return {
      title: "Concetti chiave", body: `<p class="qtitle">${c.q}</p>`, layout: "", opts: shuffle(c.o.map((t, k) => k)).map(k => ({ label: c.o[k], v: k })), timed: false,
      check(v) { return { score: v === c.a ? 100 : 0, correct: c.a, expl: `<p>${c.ex}</p>` }; },
    };
  },
}

/* ---- le tue mani: motore di analisi locale (range, bersagli, errori) ---- */
const AV = 4; // versione del modello di analisi
const HR = "23456789TJQKA", HS = "shdc";
const hcid = c => HR.indexOf(c[0]) * 4 + HS.indexOf(c[1]);
const hcstr = i => HR[i >> 2] + HS[i & 3];
const hsplit = s => (String(s || "").match(/../g) || []).map(hcid);
const HK = 1048576;
const _RC = new Int8Array(13), _SC = new Int8Array(4), _SM = new Int32Array(4);
function hStr(m) { const m2 = (m << 1) | ((m >> 12) & 1); for (let h = 13; h >= 4; h--) if (((m2 >> (h - 4)) & 31) === 31) return h - 1; return -1; }
function hEval(cs) {
  _RC.fill(0); _SC.fill(0); _SM.fill(0); let mask = 0;
  for (let i = 0; i < cs.length; i++) { const c = cs[i], r = c >> 2, s = c & 3; _RC[r]++; _SC[s]++; _SM[s] |= 1 << r; mask |= 1 << r; }
  let fl = -1; for (let s = 0; s < 4; s++) if (_SC[s] >= 5) fl = s;
  if (fl >= 0) { const sh = hStr(_SM[fl]); if (sh >= 0) return 8 * HK + sh; }
  let q = -1, t1 = -1, t2 = -1, p1 = -1, p2 = -1;
  for (let r = 12; r >= 0; r--) { const n = _RC[r]; if (n === 4) q = r; else if (n === 3) { if (t1 < 0) t1 = r; else if (t2 < 0) t2 = r; } else if (n === 2) { if (p1 < 0) p1 = r; else if (p2 < 0) p2 = r; } }
  const kick = (a, b, n) => { let v = 0, k = 0; for (let r = 12; r >= 0 && k < n; r--) if (_RC[r] && r !== a && r !== b) { v = v * 16 + r; k++; } while (k < n) { v *= 16; k++; } return v; };
  if (q >= 0) return 7 * HK + q * 16 + kick(q, -1, 1);
  if (t1 >= 0 && (t2 >= 0 || p1 >= 0)) return 6 * HK + t1 * 16 + Math.max(t2, p1);
  if (fl >= 0) { let v = 0, k = 0; for (let r = 12; r >= 0 && k < 5; r--) if ((_SM[fl] >> r) & 1) { v = v * 16 + r; k++; } return 5 * HK + v; }
  const sh = hStr(mask); if (sh >= 0) return 4 * HK + sh;
  if (t1 >= 0) return 3 * HK + t1 * 256 + kick(t1, -1, 2);
  if (p1 >= 0 && p2 >= 0) return 2 * HK + p1 * 256 + p2 * 16 + kick(p1, p2, 1);
  if (p1 >= 0) return HK + p1 * 4096 + kick(p1, -1, 3);
  return kick(-1, -1, 5);
}
const HCATN = ["carta alta", "coppia", "doppia coppia", "tris", "scala", "colore", "full", "poker", "scala colore"];
/* categoria della mano rispetto al board: M forte, T top/overpair, P coppia media, D coppia bassa, S progetto forte, g progetto debole, A aria */
function hClassify(h, b) {
  const all = h.concat(b), v = hEval(all), cat = Math.floor(v / HK);
  const bc = {}; b.forEach(c => bc[c >> 2] = (bc[c >> 2] || 0) + 1);
  const br = Object.keys(bc).map(Number).sort((x, y) => y - x);
  const r1 = h[0] >> 2, r2 = h[1] >> 2;
  let bk;
  if (b.length >= 5 && v === hEval(b)) bk = "A";
  else if (cat >= 4) bk = "M";
  else {
    const m1 = bc[r1] || 0, m2 = bc[r2] || 0;
    if (r1 === r2) bk = m1 ? "M" : r1 > br[0] ? "T" : r1 > (br[1] ?? -1) ? "P" : "D";
    else if ((m1 && m2) || m1 >= 2 || m2 >= 2) bk = "M";
    else if (m1 || m2) { const m = m1 ? r1 : r2, k = m1 ? r2 : r1, i = br.indexOf(m); bk = i === 0 ? (k >= 9 ? "T" : "P") : i === 1 ? "P" : "D"; }
    else bk = "A";
  }
  let dr = 0;
  if (b.length < 5 && bk !== "M" && bk !== "T") {
    for (let s = 0; s < 4; s++) { let n = 0, hn = 0; all.forEach(c => { if ((c & 3) === s) n++; }); h.forEach(c => { if ((c & 3) === s) hn++; }); if (n === 4 && hn) dr = 2; }
    if (cat < 4) {
      let mask = 0, bm = 0; all.forEach(c => mask |= 1 << (c >> 2)); b.forEach(c => bm |= 1 << (c >> 2));
      let outs = 0; for (let r = 0; r < 13; r++) { if ((mask >> r) & 1) continue; if (hStr(mask | (1 << r)) >= 0 && hStr(bm | (1 << r)) < 0) outs++; }
      if (outs >= 2) dr = 2; else if (outs === 1 && !dr) dr = 1;
    }
  }
  let k = bk;
  if (dr === 2 && (bk === "A" || bk === "D")) k = "S";
  else if (dr === 1 && bk === "A") k = "g";
  return { bk, k, dr, v, cat };
}
const HKEY = c => { const a = c[0] >> 2, b = c[1] >> 2, hi = Math.max(a, b), lo = Math.min(a, b); return a === b ? HR[a] + HR[b] : HR[hi] + HR[lo] + ((c[0] & 3) === (c[1] & 3) ? "s" : "o"); };
function hExpand(key) {
  const out = [], a = HR.indexOf(key[0]), b = HR.indexOf(key[1]);
  if (key.length === 2) { for (let s = 0; s < 4; s++) for (let t = s + 1; t < 4; t++) out.push([a * 4 + s, a * 4 + t]); }
  else if (key[2] === "s") { for (let s = 0; s < 4; s++) out.push([a * 4 + s, b * 4 + s]); }
  else { for (let s = 0; s < 4; s++) for (let t = 0; t < 4; t++) if (s !== t) out.push([a * 4 + s, b * 4 + t]); }
  return out;
}
function hParseRange(str) {
  const w = {}; const R = "AKQJT98765432";
  for (let tok of str.split(",")) {
    tok = tok.trim(); if (!tok) continue;
    const m = tok.match(/^([2-9TJQKA])([2-9TJQKA])([so]?)(\+)?(?:-([2-9TJQKA])([2-9TJQKA])[so]?)?$/); if (!m) continue;
    const [, x, y, t, plus, x2, y2] = m;
    if (x === y) { const i = R.indexOf(x), j = x2 ? R.indexOf(x2) : plus ? 0 : i; for (let k = Math.min(i, j); k <= Math.max(i, j); k++) w[R[k] + R[k]] = 1; continue; }
    const hi = R.indexOf(x), lo = R.indexOf(y);
    const kinds = t ? [t] : ["s", "o"];
    let from = lo, to = lo;
    if (plus) { from = hi + 1; to = lo; } else if (y2) { from = Math.min(lo, R.indexOf(y2)); to = Math.max(lo, R.indexOf(y2)); }
    for (let k = Math.min(from, to); k <= Math.max(from, to); k++) kinds.forEach(q => w[x + R[k] + q] = 1);
  }
  return w;
}
const HPK = { UTG: "ep", EP: "ep", HJ: "mp", MP: "mp", CO: "co", BTN: "btn", SB: "sb", BB: "bb" };
const HPN = { ep: "UTG", mp: "HJ", co: "CO", btn: "BTN", sb: "SB", bb: "BB" };
const HORD = { SB: 0, BB: 1, UTG: 2, EP: 2, HJ: 3, MP: 3, CO: 4, BTN: 5 };
const HFB = {
  flat: ["22-JJ,A2s-AQs,KTs+,QTs+,J9s+,T9s,98s,87s,76s,65s,AJo,AQo,KQo", "call stimato (la tabella ha solo 3-bet o fold in questo spot)"],
  tb: ["TT+,AQs+,AKo,AJs,KQs,A5s,A4s", "3-bet stimato"],
  limp: ["22-99,A2s-A9s,K2s-KTs,Q8s-QTs,J8s+,T8s+,97s+,86s+,75s+,64s+,54s,A2o-ATo,K9o-KJo,Q9o+,J9o+,T9o", "piatto limpato: range largo stimato"],
  four: ["QQ+,AKs,AKo,JJ,AQs", "call del 4-bet stimato"],
};
function hPre(id, i) { const sp = preT(id); if (!sp) return null; const w = {}; Object.entries(sp.f).forEach(([k, f]) => { if (f[i] > 0.001) w[k] = f[i]; }); return { w, src: sp.label + " (tabella GTO)" }; }
const hFB = k => ({ w: hParseRange(HFB[k][0]), src: HFB[k][1] });

function hParseHist(hist) {
  const ST = { Preflop: 0, Flop: 1, Turn: 2, River: 3 }, out = [[], [], [], []];
  const num = x => parseFloat(String(x).replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
  for (const line of hist || []) {
    const m = line.match(/^(Preflop|Flop|Turn|River): (.*)$/); if (!m) continue;
    for (const tok of m[2].split(" · ")) {
      const t = tok.match(/^(.+?) (fold|check|call ([\d.,]+)|punta ([\d.,]+)|rilancia a ([\d.,]+))$/); if (!t) continue;
      const a = t[2].split(" ")[0];
      out[ST[m[1]]].push({ who: t[1], a: a === "punta" ? "bet" : a === "rilancia" ? "raise" : a, x: t[3] ? num(t[3]) : t[4] ? num(t[4]) : t[5] ? num(t[5]) : 0 });
    }
  }
  return out;
}
/* ricostruisce il piatto, gli avversari e il range preflop del villain */
function hGame(h, d) {
  const S4 = hParseHist(d.hist), pre = S4[0];
  const posOf = w => w === "Tu" ? h.pos : w;
  const blind = w => posOf(w) === "SB" ? 0.5 : posOf(w) === "BB" ? 1 : 0;
  const raisers = []; let lri = -1;
  pre.forEach((t, i) => { if (t.a === "raise") { raisers.push(t.who); lri = i; } });
  const C = {}, seen = new Set(pre.map(t => t.who));
  const gc = w => C[w] ?? blind(w);
  pre.forEach(t => { if (t.a === "call") C[t.who] = gc(t.who) + t.x; else if (t.a === "raise") C[t.who] = t.x; else C[t.who] = gc(t.who); });
  let pot = Object.values(C).reduce((a, b) => a + b, 0);
  ["SB", "BB"].forEach(p => { const w = h.pos === p ? "Tu" : p; if (!seen.has(w)) pot += p === "SB" ? 0.5 : 1; });
  let inP;
  if (raisers.length) { inP = new Set([raisers[raisers.length - 1]]); pre.slice(lri + 1).forEach(t => { if (t.a === "call") inP.add(t.who); }); }
  else inP = new Set(pre.filter(t => t.a !== "fold").map(t => t.who));
  for (let s = 1; s <= 3; s++) S4[s].forEach(t => inP.add(t.who));
  inP.add("Tu");
  const folded = new Set(); for (let s = 1; s <= 3; s++) S4[s].forEach(t => { if (t.a === "fold") folded.add(t.who); });
  const opps = [...inP].filter(w => w !== "Tu" && !folded.has(w));
  let v = opps[0] || null;
  if (opps.length > 1) { const lr = raisers[raisers.length - 1]; if (opps.includes(lr)) v = lr; else { for (let s = d.st; s >= 1 && v === opps[0]; s--) { const ag = S4[s].filter(t => opps.includes(t.who) && (t.a === "bet" || t.a === "raise")).pop(); if (ag) v = ag.who; } } }
  // strade: piatto e contesto di ogni azione
  const streets = []; let ps = pot;
  const potAt = [];
  for (let s = 1; s <= d.st; s++) {
    potAt[s] = ps;
    const sc = {}; let maxC = 0, cur = ps, heroChk = false;
    streets[s] = S4[s].map(t => {
      const o = { ...t, pot: cur, toCall: Math.max(0, maxC - (sc[t.who] || 0)), heroChk };
      if (t.a === "call") { sc[t.who] = (sc[t.who] || 0) + t.x; cur += t.x; }
      else if (t.a === "bet") { sc[t.who] = (sc[t.who] || 0) + t.x; cur += t.x; maxC = sc[t.who]; }
      else if (t.a === "raise") { cur += t.x - (sc[t.who] || 0); sc[t.who] = t.x; maxC = t.x; }
      if (t.who === "Tu" && t.a === "check") heroChk = true;
      return o;
    });
    ps = cur;
  }
  let init = raisers[raisers.length - 1] || null;
  for (let s = 1; s < d.st; s++) { const ag = (streets[s] || []).filter(t => t.a === "bet" || t.a === "raise").pop(); init = ag ? ag.who : null; }
  const vpos = v ? posOf(v) : null;
  const heroIP = v ? HORD[h.pos] > HORD[vpos] : true;
  return { init, S4, pre, raisers, pot3: raisers.length >= 2, pot4: raisers.length >= 3, limped: !raisers.length, v, vpos, opps, multi: opps.length > 1, heroIP, streets, potAt, prePot: pot };
}
function hVillainPre(g, h) {
  const R = g.raisers, v = g.v, vk = HPK[g.vpos], hk = HPK[h.pos];
  let r = null;
  if (!R.length) r = hFB("limp");
  else if (R.length === 1 && R[0] === v) r = vk && vk !== "bb" ? hPre("rfi_" + vk, 1) : hFB("limp");
  else if (R.length === 1 && R[0] === "Tu") r = vk === "bb" ? hPre("bb_" + hk, 1) : hFB("flat");
  else if (R.length === 2 && R[0] === "Tu" && R[1] === v) r = vk === "bb" ? hPre("bb_" + hk, 2) : hPre(vk + "_" + hk, 1);
  else if (R.length === 2 && R[0] === v && R[1] === "Tu") r = hPre(vk + "_vs_" + hk + "3", 1);
  else if (R.length === 3 && R[0] === v && R[1] === "Tu" && R[2] === v) r = hPre(vk + "_vs_" + hk + "3", 2);
  else if (R.length >= 3 && R[R.length - 1] === "Tu") r = hFB("four");
  if (!r) r = R.includes(v) ? hFB("tb") : hFB("flat");
  return r;
}
/* moltiplicatori per azione del villain (flop/turn e river) */
const HW = {
  chkOOP: { M: .75, T: .85, P: 1, D: 1, S: .85, g: 1, A: 1 }, chkIP: { M: .5, T: .55, P: 1, D: 1, S: .6, g: .8, A: .85 },
  bet: { M: 1, T: .9, P: .45, D: .3, S: .8, g: .5, A: .35 }, raise: { M: 1, T: .35, P: .08, D: .04, S: .55, g: .2, A: .12 },
  callS: { M: .7, T: 1, P: .9, D: .6, S: .95, g: .5, A: .08 }, callM: { M: .7, T: 1, P: .7, D: .35, S: .95, g: .3, A: .04 }, callB: { M: .75, T: .95, P: .45, D: .15, S: .85, g: .15, A: .02 },
};
const HWR = {
  chkOOP: { M: .7, T: .85, P: 1, D: 1, A: 1 }, chkIP: { M: .3, T: .5, P: 1, D: 1, A: .8 },
  bet: { M: 1, T: .7, P: .25, D: .15, A: .4 }, raise: { M: 1, T: .2, P: .03, D: .02, A: .15 },
  callS: { M: .85, T: 1, P: .8, D: .4, A: .03 }, callM: { M: .85, T: 1, P: .55, D: .2, A: .02 }, callB: { M: .9, T: .9, P: .3, D: .08, A: .01 },
};
const HVS_RAISE = { M: 1, T: .85, S: .9, P: .45, D: .25, g: .3, A: .15 }, HVS_RAISE_R = { M: 1, T: .6, P: .2, D: .08, A: .02 };
const boardAt = (d, s) => d.board.slice(0, s === 1 ? 6 : s === 2 ? 8 : 10);
const pct = x => Math.round(x * 100);
function hNarrow(g, h, d, pr) {
  const dead = new Set([...hsplit(h.hero), ...hsplit(d.board)]);
  let combos = [];
  Object.entries(pr.w).forEach(([k, w]) => hExpand(k).forEach(c => { if (!dead.has(c[0]) && !dead.has(c[1])) combos.push({ c, w, key: k }); }));
  const cnt = () => combos.reduce((a, o) => a + o.w, 0);
  const steps = [{ l: `Preflop: ${pr.src}`, n: cnt() }];
  for (let s = 1; s <= d.st; s++) {
    const b = hsplit(boardAt(d, s)), T = s === 3 ? HWR : HW;
    const vt = (g.streets[s] || []).filter(t => t.who === g.v);
    if (!vt.length) continue;
    combos.forEach(o => o.cl = hClassify(o.c, b));
    const labels = [];
    vt.forEach(t => {
      let key, lab;
      if (t.a === "check") { key = t.heroChk ? "chkIP" : "chkOOP"; lab = t.heroChk ? "check dietro" : "check"; }
      else if (t.a === "bet") { key = "bet"; lab = `punta ${bb(t.x)} (${pct(t.x / t.pot)}% pot)`; }
      else if (t.a === "raise") { key = "raise"; lab = `rilancia a ${bb(t.x)}`; }
      else if (t.a === "call") { const r = t.toCall / Math.max(0.1, t.pot - t.toCall); key = r <= 0.5 ? "callS" : r <= 0.85 ? "callM" : "callB"; lab = `call ${bb(t.x)} (${pct(r)}% pot)`; }
      else return;
      combos.forEach(o => { const tb = T[key]; const kk = o.cl.k; let m = tb[kk] ?? tb.A; if (o.cl.dr === 2 && tb.S != null) m = Math.max(m, tb.S); o.w *= m; });
      labels.push(lab);
    });
    steps.push({ l: `${["", "Flop", "Turn", "River"][s]}: ${labels.join(", ")}`, n: cnt() });
  }
  combos = combos.filter(o => o.w > 0.002);
  const b = hsplit(d.board);
  combos.forEach(o => o.cl = hClassify(o.c, b));
  return { combos, steps };
}
let hSeed = 1; const hRand = () => { hSeed = (Math.imul(hSeed, 1103515245) + 12345) & 0x7fffffff; return hSeed / 0x7fffffff; };
function hEquity(hero, board, combos, N) {
  const used = new Set([...hero, ...board]);
  const deck = []; for (let i = 0; i < 52; i++) if (!used.has(i)) deck.push(i);
  if (board.length === 5) { const hv = hEval(hero.concat(board)); combos.forEach(o => { const vv = hEval(o.c.concat(board)); o.e = hv > vv ? 1 : hv === vv ? 0.5 : 0; }); return; }
  let runs = [];
  if (board.length === 4) runs = deck.map(x => [x]);
  else { hSeed = 7; const all = []; for (let i = 0; i < deck.length; i++) for (let j = i + 1; j < deck.length; j++) all.push([deck[i], deck[j]]); for (let k = all.length - 1; k > 0; k--) { const j = Math.floor(hRand() * (k + 1)); [all[k], all[j]] = [all[j], all[k]]; } runs = all.slice(0, N || 220); }
  const hv = runs.map(r => hEval(hero.concat(board, r)));
  combos.forEach(o => { let s = 0, n = 0; runs.forEach((r, k) => { if (r.includes(o.c[0]) || r.includes(o.c[1])) return; const vv = hEval(o.c.concat(board, r)); s += hv[k] > vv ? 1 : hv[k] === vv ? 0.5 : 0; n++; }); o.e = n ? s / n : 0.5; });
}
const HPRI = { M: 60, T: 50, S: 45, P: 40, D: 30, g: 25, A: 10 };
function hFold(s, st, p3) {
  const th = theo(s), cf = courseFold(s, null);
  let f = st === 3 ? cf : st === 2 ? th + 0.6 * (cf - th) : th + 4;
  if (p3) f = Math.min(f, th) - 6;
  return Math.max(5, Math.min(90, f));
}
function hCont(A, s) {
  const { combos, st } = A, tot = A.tot, f = hFold(s, st, A.g.pot3) / 100;
  const prot = o => o.cl.k === "M" || (o.cl.k === "T" && s <= (st === 3 ? 0.8 : 1.2)) || (o.cl.k === "S" && st < 3 && s <= 0.8);
  const c = combos.map(o => prot(o) ? 1 : 0);
  let need = (1 - f) * tot - combos.reduce((a, o, i) => a + (c[i] ? o.w : 0), 0);
  for (const i of A.order) { if (need <= 1e-9) break; if (c[i]) continue; const t = Math.min(1, need / combos[i].w); c[i] = t; need -= t * combos[i].w; }
  return c;
}
function hSplit(A, c) {
  const r = { call: 0, cb: 0, cw: 0, fb: 0, fw: 0, callSet: [], foldSet: [] };
  A.combos.forEach((o, i) => { const cw = o.w * c[i], fw = o.w - cw; r.call += cw; if (o.e < 0.5) { r.cb += cw; r.fb += fw; } else if (o.e > 0.5) { r.cw += cw; r.fw += fw; } if (cw > 1e-6) r.callSet.push({ o, w: cw }); if (fw > 1e-6) r.foldSet.push({ o, w: fw }); });
  ["call", "cb", "cw", "fb", "fw"].forEach(k => r[k] /= A.tot);
  return r;
}
function hBetEV(A, s) {
  const P = A.pot, b = s * P, c = hCont(A, s);
  let ev = 0, callW = 0, eqC = 0;
  A.combos.forEach((o, i) => { const cw = o.w * c[i]; ev += (o.w - cw) * P + cw * (o.e * A.R * (P + 2 * b) - b); callW += cw; eqC += cw * o.e; });
  return { s, ev: ev / A.tot, eqC: callW ? eqC / callW : 0, ...hSplit(A, c) };
}
const hCls = s => s === 0 ? "check" : s <= 0.5 + 1e-9 ? "small" : s <= 0.8 + 1e-9 ? "mid" : "big";
const hSizeName = (s, A) => s === 0 ? "Check" : A && Math.abs(s * A.pot - A.stack) < 0.05 ? `All-in (${pct(s)}%)` : `${pct(s)}% pot`;
/* la tua strategia di riferimento applicata allo spot, se combacia */
function hStrategy(g, h, d) {
  if (!g.v || g.multi || d.st > 2) return null;
  const fl = boardAt(d, 1).match(/../g), f = feat(fl), R = g.raisers, S = g.streets;
  const heroFirstOnStreet = st => !(S[st] || []).some(t => t.who === "Tu");
  const onlyVChk = st => { const t = S[st] || []; return t.length === 1 && t[0].who === g.v && t[0].a === "check"; };
  const geo = () => { const P = d.pot, St = d.stack; return Math.max(0.3, (Math.sqrt((P + 2 * St) / P) - 1) / 2); };
  const one = d.pot > 0 ? 1 / d.pot : 0.1;
  const CODE = { check: null, r10: [.1, 1], r25: [.25, 1], r30: [.3, 1], r40: [.4, 1], r50: [.5, 1], r70: [.7, 1], b25: [.25, 1], b1: [one, 1], m30: [.3, 0], m50: [.5, 0], m67: [.67, 0], m75: [.75, 0], m100: [1, 0], ob: [1.2, 0] };
  const fromCodes = (codes, src, txt, adapted) => {
    const acts = [], seen = new Set(); let chk = false, chkRange = false;
    codes.forEach(c => { if (c === "check") { chk = true; if (codes.length === 1) chkRange = true; return; } const x = CODE[c]; if (!x) return; if (!x[1]) chk = true; if (!seen.has(x[0])) { seen.add(x[0]); acts.push({ s: x[0], range: !!x[1] }); } });
    if (codes.includes("check") && codes.length > 1) chk = true;
    return { src, txt, acts, chk, chkRange, adapted };
  };
  const vbb = g.vpos === "BB";
  // flop da aggressore preflop
  if (d.st === 1 && d.toCall === 0 && heroFirstOnStreet(1)) {
    if (R.length === 1 && R[0] === "Tu" && vbb && h.pos !== "SB" && onlyVChk(1)) {
      const s = v7(fl), codes = s.sols.map(x => V7MAP[x]);
      return fromCodes(codes, "Flop SRP BTN vs BB", `${s.bucket} / ${s.cat} / ${s.tone}: ${s.exp}.`, h.pos !== "BTN" ? `sei ${h.pos}: uso il piano del BTN` : "");
    }
    if (R.length === 1 && R[0] === "Tu" && vbb && h.pos === "SB" && !(S[1] || []).length) {
      const s = bvbStrat(fl);
      return fromCodes(s.sols.map(x => ({ CHECK: "check", B25: "b25", "1BB": "b1" })[x]), "Flop BvB (SB vs BB)", `${s.bucket} / ${s.cat} / ${s.tone}: ${s.exp}`, "");
    }
    if (R.length === 2 && R[1] === "Tu" && R[0] === g.v && g.heroIP && onlyVChk(1)) {
      const r = ruleS3(f); if (r) return fromCodes(r.a, "3-bet pot IP (BTN vs CO)", `${r.cat}: ${r.why}`, h.pos !== "BTN" || g.vpos !== "CO" ? `sei ${h.pos} vs ${g.vpos}: uso il piano BTN vs CO` : "");
    }
    if (R.length === 2 && R[1] === "Tu" && R[0] === g.v && !g.heroIP && !(S[1] || []).length) {
      const r = ruleS4(f); if (r) return fromCodes(r.a, "3-bet pot OOP (SB vs BTN)", `${r.cat}: ${r.why}`, h.pos !== "SB" || g.vpos !== "BTN" ? `sei ${h.pos} vs ${g.vpos}: uso il piano SB vs BTN` : "");
    }
  }
  // turn dopo c-bet piccola chiamata
  if (d.st === 2 && d.toCall === 0 && heroFirstOnStreet(2) && R.length === 1 && R[0] === "Tu" && vbb) {
    const t1 = S[1] || [], cb = t1.find(t => t.who === "Tu" && t.a === "bet"), called = t1.some(t => t.who === g.v && t.a === "call");
    if (cb && called && cb.x / cb.pot <= 0.4) {
      const tf = turnFeat(fl, d.board.slice(6, 8));
      if (h.pos !== "SB" && onlyVChk(2)) { const r = turnS1(tf); return { src: "2° barrel (BTN vs BB)", txt: `${r.cat}: ${r.why}`, acts: r.a.map(x => ({ s: +x / 100, range: false })), chk: true, chkRange: false, adapted: h.pos !== "BTN" ? `sei ${h.pos}: uso il piano del BTN` : "" }; }
      if (h.pos === "SB" && !(S[2] || []).length) { const r = turnS2(tf); return { src: "2° barrel BvB", txt: `${r.cat}: ${r.why}`, acts: r.a.map(x => ({ s: +x / 100, range: false })), chk: true, chkRange: false, adapted: "" }; }
    }
  }
  // BB defense
  if (h.pos === "BB" && R.length === 1 && R[0] === g.v) {
    const t1 = S[1] || [];
    if (d.st === 1 && d.toCall > 0 && t1.length === 2 && t1[0].who === "Tu" && t1[0].a === "check" && t1[1].a === "bet") {
      const r = xrFlop(fl), p = +r.sols[0] / 100;
      return { src: "Difesa del BB · size del check-raise", txt: r.exp, raiseTo: d.toCall + p * (d.pot + d.toCall), raiseLab: `XR ${r.sols[0]}`, acts: [], chk: false, adapted: g.vpos !== "BTN" ? `contro ${g.vpos}: uso il piano vs BTN` : "" };
    }
    if (d.st === 2 && d.toCall === 0 && heroFirstOnStreet(2)) {
      const xr = t1.some(t => t.who === "Tu" && t.a === "raise") && t1[t1.length - 1].who === g.v && t1[t1.length - 1].a === "call";
      const xx = t1.length === 2 && t1[0].who === "Tu" && t1[0].a === "check" && t1[1].a === "check";
      if (xr || xx) {
        const r = (xr ? xrTurn : xxTurn)(fl, d.board.slice(6, 8));
        const acts = r.sols.filter(x => x !== "CHECK").map(x => ({ s: x === "2e" ? geo() : +x / 100, range: false }));
        return { src: `Difesa del BB · turn ${xr ? "dopo il tuo check-raise" : "dopo check-check (bet vs missed)"}`, txt: r.exp, acts, chk: true, chkRange: false, adapted: g.vpos !== "BTN" ? `contro ${g.vpos}: uso il piano vs BTN` : "" };
      }
    }
  }
  return null;
}
const HERR = {
  strat: "Fuori dalla tua strategia", bigsize: "Size troppo grande per il bersaglio", smallsize: "Size troppo piccola", valuebad: "Value contro un range che paga solo con meglio",
  bluffbad: "Bluff senza bersaglio", donk: "Donk bet contro chi ha l'iniziativa", missval: "Check: valore perso", missbluff: "Check: fold equity sprecata", badcall: "Call senza prezzo", badfold: "Fold troppo stretto", badraise: "Raise che isola contro il meglio", missraise: "Raise mancato",
};
function hAnalyze(h, d, N) {
  const g = hGame(h, d);
  if (!g.v) return null;
  const pr = hVillainPre(g, h);
  const { combos, steps } = hNarrow(g, h, d, pr);
  if (!combos.length) return null;
  const hero = hsplit(h.hero), board = hsplit(d.board), st = d.st;
  hEquity(hero, board, combos, N);
  combos.forEach(o => o.sc = st === 3 ? o.cl.v : HPRI[o.cl.k] * 10 * HK + o.cl.v);
  const A = { g, pr, combos, steps, st, pot: d.pot, stack: d.stack, toCall: d.toCall, R: st === 3 ? 1 : g.heroIP ? 0.95 : 0.85 };
  A.tot = combos.reduce((a, o) => a + o.w, 0);
  A.order = combos.map((_, i) => i).sort((a, b) => combos[b].sc - combos[a].sc);
  A.eq = combos.reduce((a, o) => a + o.w * o.e, 0) / A.tot;
  A.beat = combos.reduce((a, o) => a + (o.e < 0.5 ? o.w : 0), 0) / A.tot;
  A.win = combos.reduce((a, o) => a + (o.e > 0.5 ? o.w : 0), 0) / A.tot;
  A.strat = hStrategy(g, h, d);
  A.donk = !A.strat && d.toCall === 0 && !g.heroIP && !(g.streets[st] || []).length && g.init === g.v;
  const P = d.pot;
  if (d.toCall > 0) {
    const tc = Math.min(d.toCall, d.stack);
    A.need = tc / (P + tc);
    const callEV = combos.reduce((a, o) => a + o.w * (o.e * A.R * (P + tc) - tc), 0) / A.tot;
    const X = Math.min(d.stack, A.strat && A.strat.raiseTo ? A.strat.raiseTo : d.act === "raise" && d.amt > tc ? d.amt : Math.max(3 * tc, tc + 0.75 * (P + tc)));
    const RT = st === 3 ? HVS_RAISE_R : HVS_RAISE;
    const rc = combos.map(o => RT[o.cl.k] ?? 0);
    const RR = st === 3 ? 1 : A.R * 0.9;
    let rev = 0; combos.forEach((o, i) => { rev += o.w * ((1 - rc[i]) * P + rc[i] * (o.e * RR * (P + X + X - tc) - X)); });
    const rs = hSplit(A, rc);
    A.opts = [{ k: "fold", l: "Fold", ev: 0 }, { k: "call", l: `Call ${bb(tc)}`, ev: callEV }, { k: "raise", l: `Raise a ${bb(X)}${A.strat && A.strat.raiseLab ? " (" + A.strat.raiseLab + ")" : ""}`, ev: rev / A.tot, X, ...rs, eqC: rs.call ? combos.reduce((a, o, i) => a + o.w * rc[i] * o.e, 0) / (rs.call * A.tot) : 0 }];
    A.cls = { fold: A.opts[0], call: A.opts[1], raise: A.opts[2] };
  } else {
    const maxS = d.stack / P;
    let sizes = [0.33, 0.5, 0.75, 1, 1.5];
    if (A.strat) A.strat.acts.forEach(a => { if (!sizes.some(x => Math.abs(x - a.s) < 0.02)) sizes.push(a.s); });
    if (d.act === "bet" && d.ratio > 0) { const r = Math.min(d.ratio, maxS); if (!sizes.some(x => Math.abs(x - r) < 0.02)) sizes.push(r); }
    sizes = sizes.filter(s => s < maxS - 0.02);
    if (maxS <= 3) sizes.push(maxS);
    sizes.sort((a, b) => a - b);
    const chkEV = A.eq * A.R * P;
    A.opts = [{ k: "check", s: 0, l: "Check", ev: chkEV }, ...sizes.map(s => { const r = hBetEV(A, s); return { k: hCls(s), l: hSizeName(s, A), ...r }; })];
    A.opts.forEach(o => { o.inStrat = !A.strat ? true : o.s === 0 ? !!A.strat.chk || !A.strat.acts.length : A.strat.acts.some(a => Math.abs(a.s - o.s) < 0.02); });
    // la classe vale la migliore size al suo interno (dentro la strategia, se c'è)
    A.cls = {};
    ["check", "small", "mid", "big"].forEach(k => { const c = A.opts.filter(o => o.k === k && (!A.strat || o.inStrat)); const all = A.opts.filter(o => o.k === k); const pool = c.length ? c : all; if (pool.length) A.cls[k] = pool.reduce((a, b) => b.ev > a.ev ? b : a); });
  }
  // migliore: dentro la strategia se esiste
  const cand = Object.entries(A.cls).filter(([k, o]) => !A.strat || d.toCall > 0 || o.inStrat);
  const bestE = (cand.length ? cand : Object.entries(A.cls)).reduce((a, b) => b[1].ev > a[1].ev ? b : a);
  A.best = bestE[1]; A.bestK = bestE[0];
  if (A.strat && d.toCall === 0 && A.strat.acts.length === 1 && A.strat.acts[0].range && !A.strat.chk) { const k = hCls(A.strat.acts[0].s); A.bestK = k; A.best = A.cls[k]; A.forced = true; }
  if (A.strat && A.strat.chkRange) { A.bestK = "check"; A.best = A.cls.check; A.forced = true; }
  if (A.donk) { A.bestK = "check"; A.best = A.cls.check; }
  return A;
}
/* giudizio di un'azione (classe o size esatta) */
function hJudge(A, k, exact) {
  const opt = exact || A.cls[k];
  if (!opt) return { sc: 0, k };
  const loss = A.best.ev - opt.ev, P = A.pot;
  let sc = loss <= Math.max(0.04 * P, 0.3) ? 100 : loss <= 0.12 * P ? 60 : 0;
  let type = null;
  if (A.donk) { if (k === "check") return { sc: 100, k, opt, loss: 0, type: null }; const small = opt.ev >= A.cls.check.ev - 0.04 * P; return { sc: small ? 60 : 0, k, opt, loss: Math.max(0, A.cls.check.ev - opt.ev), type: "donk" }; }
  const inStrat = A.toCall > 0 || !A.strat ? true : k === "check" ? (A.strat.chk || A.strat.chkRange || !A.strat.acts.length) : A.strat.acts.some(a => hCls(a.s) === k) && !A.strat.chkRange;
  if (A.forced) sc = k === A.bestK ? 100 : 0;
  else if (A.strat && !inStrat) sc = loss <= 0.05 * P ? 60 : 0;
  if (sc < 100) type = hErrType(A, k, opt, inStrat);
  return { sc, k, opt, loss: Math.max(0, loss), type };
}
function hErrType(A, k, opt, inStrat) {
  if (A.strat && !inStrat) return "strat";
  const bk = A.bestK;
  if (A.toCall > 0) {
    if (k === "call") return A.eq < A.need ? "badcall" : bk === "raise" ? "missraise" : "badcall";
    if (k === "fold") return bk === "raise" ? "missraise" : "badfold";
    if (k === "raise") return "badraise";
  }
  if (k === "check") return A.best.eqC >= 0.5 ? "missval" : "missbluff";
  if (bk === "check") return opt.eqC >= 0.5 || A.eq < 0.4 ? (A.eq < 0.4 ? "bluffbad" : "valuebad") : "valuebad";
  const order = ["check", "small", "mid", "big"];
  if (A.forced && A.strat) return "strat";
  return order.indexOf(k) > order.indexOf(bk) ? "bigsize" : "smallsize";
}
/* elenco mani di un insieme, raggruppate */
function hList(set, n, withCat) {
  const g = {}; set.forEach(({ o, w }) => { const k = o.key; if (!g[k]) g[k] = { k, w: 0, cat: o.cl.cat, b: o.cl.k }; g[k].w += w; });
  return Object.values(g).sort((a, b) => b.w - a.w).slice(0, n || 5).map(x => withCat ? `${x.k} (${HCATN[x.cat] || ""})` : x.k).join(", ");
}
const HBN = { M: "mani forti", T: "top pair e overpair", P: "coppie medie", D: "coppie basse", S: "progetti forti", g: "progetti deboli", A: "aria" };
function hBuckets(set, tot) {
  const g = {}; set.forEach(({ o, w }) => { g[o.cl.k] = (g[o.cl.k] || 0) + w; });
  return Object.entries(g).sort((a, b) => b[1] - a[1]).filter(([, w]) => w / tot >= 0.04).slice(0, 3).map(([k, w]) => `${HBN[k]} ${pct(w / tot)}%`).join(", ");
}
function hDiag(A, j, who) {
  const o = j.opt, T = A.tot, V = A.g.vpos;
  const betterSet = A.combos.filter(x => x.e < 0.5).map(x => ({ o: x, w: x.w })), worseSet = A.combos.filter(x => x.e > 0.5).map(x => ({ o: x, w: x.w }));
  const bst = A.best;
  const bestTxt = A.toCall > 0 ? bst.l : bst.l;
  const lines = [];
  const t = j.type;
  if (t === "strat") {
    const pl = A.strat.chkRange ? "check con tutto il range" : A.strat.acts.map(a => `${a.range ? "range bet" : "bet"} ${pct(a.s)}%`).join(" o ") + (A.strat.chk && !A.strat.chkRange ? " (oppure check con una parte del range)" : "");
    lines.push(`${who} fuori dal tuo piano: qui la tua strategia è <b>${pl}</b>. ${A.strat.txt}`);
    if (o && o.s > 0 && o.fw != null && bst.s > 0 && hCls(o.s) !== hCls(bst.s)) lines.push(`Con ${o.l} ti pagano il ${pct(o.call)}% delle sue mani (${pct(o.cw)}% peggiori della tua), con ${bst.l} il ${pct(bst.call)}% (${pct(bst.cw)}% peggiori).`);
  } else if (t === "donk") lines.push(`Sei fuori posizione e l'iniziativa è di ${V}: la linea standard è check e lasciar puntare lui, che con il suo range punta spesso anche con aria. Con ${o.l} ti pagano ${hBuckets(o.callSet, T) || "le sue mani migliori"} e foldano proprio le mani con cui lui avrebbe bluffato.`);
  else if (t === "valuebad") lines.push(`Con ${o.l} ti paga soprattutto chi ti batte: ${pct(o.cb)}% del suo range chiama con mani migliori (${hList(o.callSet.filter(x => x.o.e < 0.5), 4, A.st === 3)}) e solo ${pct(o.cw)}% con peggio. Le mani peggiori (${hList(o.foldSet.filter(x => x.o.e > 0.5), 4)}) foldano. La tua mano vale di più a showdown.`);
  else if (t === "bluffbad") lines.push(`Bluff senza bersaglio: le mani migliori che dovevi far foldare continuano (${pct(o.cb)}% del range paga con meglio: ${hList(o.callSet.filter(x => x.o.e < 0.5), 4)}), mentre folda soprattutto roba che battevi già (${pct(o.fw)}%). Servivano ${pct(o.s / (1 + o.s))}% di fold, ne arrivano ${pct(1 - o.call)}%.`);
  else if (t === "bigsize") lines.push(`Size troppo grande: con ${o.l} chiama solo il ${pct(o.call)}% del range e il ${pct(o.cb / Math.max(o.call, 1e-9))}% di chi chiama ti batte. Con ${bestTxt} ti pagherebbe il ${pct(bst.call)}%, incluse ${hList(bst.callSet.filter(x => x.o.e > 0.5), 4)}: quello era il tuo bersaglio e con la size grande folda.`);
  else if (t === "smallsize") lines.push(`Size troppo piccola: il tuo bersaglio (${hList(bst.callSet.filter(x => x.o.e > 0.5), 4) || "le mani che vuoi far foldare"}) regge anche ${bestTxt}. Con ${o.l} lasci ${bb(j.loss)} in media.`);
  else if (t === "missval") lines.push(`Check che perde valore: con ${bestTxt} ti pagava il ${pct(bst.cw)}% del range con mani peggiori (${hList(bst.callSet.filter(x => x.o.e > 0.5), 5)}), e solo il ${pct(bst.cb)}% con meglio.`);
  else if (t === "missbluff") lines.push(`Check che spreca fold equity: con ${bestTxt} folda il ${pct(1 - bst.call)}% del suo range (servono ${pct(bst.s / (1 + bst.s))}%), incluse mani migliori della tua (${pct(bst.fb)}%: ${hList(bst.foldSet.filter(x => x.o.e < 0.5), 4)}).`);
  else if (t === "badcall") lines.push(`Call senza prezzo: ti serve il ${pct(A.need)}% di equity, contro il suo range ne hai il ${pct(A.eq)}%. ${V} arriva qui con ${hBuckets(A.combos.map(x => ({ o: x, w: x.w })), T)}: ti battono ${hList(betterSet, 5, A.st === 3)}.`);
  else if (t === "badfold") lines.push(`Fold troppo stretto: ti serve il ${pct(A.need)}% di equity e ne hai il ${pct(A.eq)}%. Nel suo range ci sono abbastanza mani che batti (${hList(worseSet, 5)}).`);
  else if (t === "badraise") lines.push(`Raise che isola contro il meglio: continua il ${pct(A.cls.raise.call)}% del suo range e contro quelle mani hai il ${pct(A.cls.raise.eqC)}%. Foldano le mani che battevi (${hList(A.cls.raise.foldSet.filter(x => x.o.e > 0.5), 4)}).`);
  else if (t === "missraise") lines.push(`Raise mancato: con ${bst.l} folda il ${pct(1 - bst.call)}% del suo range e contro chi continua hai ancora il ${pct(bst.eqC)}% di equity.`);
  return lines.join(" ");
}
function hWhyBest(A) {
  const b = A.best;
  if (A.toCall > 0) {
    if (A.bestK === "call") return `Hai il ${pct(A.eq)}% di equity e te ne serve il ${pct(A.need)}%: call.`;
    if (A.bestK === "fold") return `Hai il ${pct(A.eq)}% di equity ma te ne serve il ${pct(A.need)}%: fold.`;
    return `Raise: folda il ${pct(1 - b.call)}% e chi continua ha il ${pct(1 - b.eqC)}% contro di te.`;
  }
  if (A.donk) return `Check a chi ha l'iniziativa (${A.g.vpos}): lui punta spesso con tutto il range, tu decidi dopo tra call, check-raise e fold. Equity contro il suo range: ${pct(A.eq)}%.`;
  if (A.bestK === "check") return A.eq >= 0.45 ? `Check: nessuna size viene pagata da abbastanza mani peggiori, la tua mano va a showdown (equity ${pct(A.eq)}%).` : `Check: i suoi fold non ripagano il bluff a nessuna size.`;
  if (b.eqC >= 0.5) return `Bersaglio value: con ${b.l} ti paga il ${pct(b.call)}% del range, di cui ${pct(b.cw)} punti con mani peggiori (${hList(b.callSet.filter(x => x.o.e > 0.5), 5)}) e ${pct(b.cb)} con meglio.`;
  return `Bersaglio fold: con ${b.l} folda il ${pct(1 - b.call)}% (servono ${pct(b.s / (1 + b.s))}%), comprese mani migliori della tua come ${hList(b.foldSet.filter(x => x.o.e < 0.5), 4) || "le sue coppie"}.`;
}
function hCompHtml(A) {
  const map = { M: "forte", T: "top", P: "medio", D: "medio", S: "draw", g: "aria", A: "aria" }, comp = { forte: 0, top: 0, medio: 0, draw: 0, aria: 0 };
  A.combos.forEach(o => comp[map[o.cl.k]] += o.w / A.tot * 100);
  return stackHtml(comp) + legendHtml(comp);
}
function hGridHtml(A) {
  const G = {}; A.combos.forEach(o => { const g = G[o.key] || (G[o.key] = { w: 0, b: 0, t: 0 }); g.w += o.w; if (o.e < 0.5) g.b += o.w; else if (o.e === 0.5) g.t += o.w; });
  let h = `<div class="vgrid" role="img" aria-label="Range avversario: rosso ti batte, verde lo batti">`;
  for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) {
    const k = handAt(i, j), g = G[k], n = k.length === 2 ? 6 : k[2] === "s" ? 4 : 12;
    if (!g) { h += `<span class="vc">${k}</span>`; continue; }
    const a = Math.max(18, Math.min(100, Math.round(g.w / n * 100))), col = g.b > g.w / 2 ? "var(--bad)" : g.t > g.w / 2 ? "var(--muted)" : "var(--good)";
    h += `<span class="vc on" style="background:color-mix(in srgb, ${col} ${a}%, transparent)" title="${k}: ${fmt(g.w, 1)} combo">${k}</span>`;
  }
  return h + `</div><div class="legend"><span><i style="background:var(--bad)"></i>ti batte</span><span><i style="background:var(--good)"></i>lo batti</span><span><i style="background:var(--muted)"></i>pareggio</span><span class="muted">colore più pieno = più combo nel range</span></div>`;
}
function hEvHtml(A, tableK, tableOpt, userK) {
  const rows = A.opts.map(o => ({ ...o }));
  if (tableOpt && !rows.some(r => r.s != null && tableOpt.s != null && Math.abs(r.s - tableOpt.s) < 0.02)) rows.push({ ...tableOpt });
  rows.sort((x, y) => (x.s ?? -1) - (y.s ?? -1));
  const evs = rows.map(r => r.ev), hi = Math.max(...evs), lo0 = Math.min(...evs), span = Math.max(hi - lo0, 0.5), lo = lo0 - span * 0.35;
  return `<div class="evbars hev">${rows.map(r => {
    const isBest = A.toCall > 0 ? r.k === A.bestK : (r.s != null && A.best.s != null && Math.abs(r.s - A.best.s) < 1e-6);
    const isTable = A.toCall > 0 ? r.k === tableK : tableOpt ? (r.s != null && Math.abs(r.s - tableOpt.s) < 0.02) : r.k === tableK && r.s === 0;
    const w = Math.max(2, (r.ev - lo) / (hi - lo) * 100), diff = r.ev - A.best.ev;
    const tag = [isTable ? "al tavolo" : "", A.strat && r.inStrat === false ? "fuori piano" : A.strat && r.s > 0 && r.inStrat ? "tuo piano" : ""].filter(Boolean).join(" · ");
    return `<div class="evrow"><b>${esc(r.l)}${tag ? ` <span class="muted" style="font-weight:400;font-size:11.5px">${tag}</span>` : ""}</b><div class="evtrack"><i style="left:0;width:${w}%;background:${isBest ? "var(--good)" : r.inStrat === false ? "var(--c-aria)" : r.ev < 0 ? "var(--bad)" : "var(--c-top)"}"></i></div><span class="mono">${r.ev >= 0 ? "+" : ""}${fmt(r.ev, 1)}${isBest ? "" : ` <span class="muted">(${diff >= 0 ? "+" : ""}${fmt(diff, 1)})</span>`}</span></div>`;
  }).join("")}</div><p class="muted" style="font-size:12.5px;margin:4px 0 0">Valore medio in bb di ogni linea, contando il piatto già in mezzo. Tra parentesi la differenza dalla linea migliore${A.strat ? " dentro la tua strategia" : ""}.</p>`;
}
const hTableK = d => d.toCall > 0 ? d.act : d.act === "check" ? "check" : d.act === "bet" ? hCls(d.ratio) : d.act;
function hTableOpt(A, d) {
  if (d.toCall > 0 || d.act !== "bet") return null;
  const s = Math.min(d.ratio, d.stack / d.pot);
  const hit = A.opts.find(o => o.s != null && Math.abs(o.s - s) < 0.02); if (hit) return hit;
  const r = hBetEV(A, s); return { k: hCls(s), l: hSizeName(s, A), ...r, inStrat: !A.strat ? true : A.strat.acts.some(a => Math.abs(a.s - s) < 0.02) };
}
function hJudgeTable(A, d) {
  const k = hTableK(d), opt = hTableOpt(A, d);
  if (!opt) return hJudge(A, k);
  const j = hJudge(A, k, opt);
  if (A.strat && d.toCall === 0 && opt.s > 0 && !opt.inStrat && A.strat.acts.length) { const ok = A.strat.acts.some(a => Math.abs(a.s - opt.s) < 0.12 * Math.max(1, a.s)); if (!ok) { j.sc = Math.min(j.sc, j.loss <= 0.05 * A.pot ? 60 : 0); j.type = "strat"; } }
  return j;
}
const pill = sc => `<span class="pill ${sc >= 100 ? "good" : sc > 0 ? "mid" : "bad"}">${sc >= 100 ? "giusta" : sc > 0 ? "imprecisa" : "errore"}</span>`;
function hReportHtml(h, d, A, userK) {
  const V = A.g.vpos, tj = hJudgeTable(A, d), uj = userK ? hJudge(A, userK) : null;
  const tl = d.act === "bet" || d.act === "raise" ? `${actLabel(actClass(d))} (${bb(d.amt)}, ${fmt(d.ratio * 100)}% del piatto)` : actLabel(actClass(d));
  let x = `<div class="hverd">`;
  if (uj) x += `<div><span class="muted">La tua scelta ora</span><b>${esc(actLabel(userK))}</b>${pill(uj.sc)}</div>`;
  x += `<div><span class="muted">Al tavolo</span><b>${esc(tl)}</b>${pill(tj.sc)}</div><div><span class="muted">Linea migliore</span><b>${esc(A.best.l)}</b>${tj.loss > 0.05 ? `<span class="pill good">+${fmt(tj.loss, 1)}bb sul tavolo</span>` : `<span class="pill good">come al tavolo</span>`}</div></div>`;
  if (h.shown && h.shown[V]) x += `<p class="hint">A showdown ${esc(V)} ha mostrato <b>${icHand(h.shown[V])}</b>.</p>`;
  if (A.strat) x += `<div class="hstrat"><b>La tua strategia</b> · ${esc(A.strat.src)}${A.strat.adapted ? ` <span class="muted">(${esc(A.strat.adapted)})</span>` : ""}<br>${esc(A.strat.txt)}${A.strat.acts.length && !A.strat.chkRange ? `<br><span class="muted">Size del piano: ${A.strat.acts.map(a => `${pct(a.s)}%${a.range ? " con tutto il range" : ""}`).join(", ")}${A.strat.chk ? ", oppure check" : ""}. Tra bet e check decide il modello in base alla tua mano.</span>` : ""}</div>`;
  if (tj.sc < 100) x += `<div class="herr"><b>Errore al tavolo: ${HERR[tj.type] || "linea peggiore"}</b>${tj.loss > 0.05 ? ` · perdi circa ${bb(tj.loss)}` : ""}<br>${hDiag(A, tj, "Al tavolo sei")}</div>`;
  else x += `<div class="hok"><b>Al tavolo hai giocato bene.</b> ${hWhyBest(A)}</div>`;
  if (uj && uj.sc < 100 && userK !== hTableK(d)) x += `<div class="herr"><b>La tua scelta di oggi: ${HERR[uj.type] || "linea peggiore"}</b><br>${hDiag(A, uj, "Adesso sei")}</div>`;
  x += `<p style="margin:10px 0 4px"><b>Perché la linea migliore:</b> ${hWhyBest(A)}</p>`;
  x += `<h4 class="hsub">Come si restringe il range del ${esc(V)}${A.g.multi ? " (piatto multiway: analizzo lui)" : ""}</h4><div class="hfun">${A.steps.map((s, i) => `<div><span>${esc(s.l)}</span><i style="width:${Math.max(3, s.n / A.steps[0].n * 100)}%"></i><b class="mono">${fmt(s.n, 0)} combo</b></div>`).join("")}</div>`;
  x += `<h4 class="hsub">Con cosa arriva qui</h4>${hCompHtml(A)}`;
  x += `<div class="hbeat"><span style="width:${pct(A.beat)}%;background:var(--bad)">${A.beat >= 0.12 ? "ti batte " + pct(A.beat) + "%" : ""}</span><span style="width:${Math.max(0, 100 - pct(A.beat) - pct(A.win))}%;background:var(--muted)"></span><span style="width:${pct(A.win)}%;background:var(--good)">${A.win >= 0.12 ? "lo batti " + pct(A.win) + "%" : ""}</span></div>`;
  const bt = A.combos.filter(o => o.e < 0.5).map(o => ({ o, w: o.w })), wt = A.combos.filter(o => o.e > 0.5).map(o => ({ o, w: o.w }));
  x += `<p style="font-size:14px;margin:6px 0">${A.st < 3 ? `Equity contro il range: <b>${pct(A.eq)}%</b>. ` : ""}${bt.length ? `Sei dietro a: ${hList(bt, 6, A.st === 3)}. ` : ""}${wt.length ? `Sei avanti a: ${hList(wt, 6)}.` : ""}</p>`;
  x += `<h4 class="hsub">EV di ogni opzione</h4>${hEvHtml(A, hTableK(d), hTableOpt(A, d), userK)}`;
  if (d.st === 3 && !A.g.multi) x += `<div id="svVerdict"></div>`;
  if ((d.st === 1 || d.st === 2) && !A.g.multi) x += `<p style="margin:8px 0"><button class="btn" id="gwOpenSt">Apri questo spot nello Study (solver ${d.st === 1 ? "flop" : "turn"})</button> <button class="btn" id="gwProbSt">🧩 Rigioca come problema</button> <span class="muted" style="font-size:13px">Range e size della mano, con il nodelock sull'avversario se l'hai analizzato.</span></p>`;
  x += `<details class="hdet"><summary>Range del ${esc(V)} mano per mano</summary>${hGridHtml(A)}</details>`;
  x += `<p class="note">Stima del modello, non un solver: range preflop dalle tabelle GTO, ristretto dalle azioni di ${esc(V)} con il comportamento tipico del field micro; fold contro le size dai dati di riferimento (REG NL50)${A.g.pot3 ? ", meno fold nei 3-bet pot" : ""}. Al flop e al turn l'equity è realizzata al ${pct(A.R)}% e non considero i raise avversari.</p>`;
  return { html: x, tj, uj };
}
/* analisi salvata per decisione (per la scheda Errori) */
function hQuick(h, d) {
  if (d.an && d.an.v === AV) return d.an;
  let r = { v: AV, sc: null };
  try { const A = hAnalyze(h, d, 70); if (A) { const tj = hJudgeTable(A, d); r = { v: AV, sc: tj.sc, type: tj.type || null, loss: Math.round(tj.loss * 10) / 10, best: A.best.l, st: d.st, strat: !!A.strat }; } } catch (e) { r = { v: AV, sc: null }; }
  d.an = r; return r;
}

