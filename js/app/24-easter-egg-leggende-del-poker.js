/* ================= EASTER EGG: LEGGENDE DEL POKER =================
   Piccole esperienze legate alle skill: si attivano mentre ti alleni, non da una sezione a parte.
   Fatti storici verificati, battute originali, premi solo cosmetici. Illustrazioni disegnate qui (nessuna foto o logo). */
const EGG_SVG = {
  chan: '<rect x="6" y="24" width="34" height="16" rx="3" fill="#c2263f"/><rect x="34" y="14" width="16" height="26" rx="3" fill="#8e1b2c"/><rect x="38" y="18" width="8" height="8" rx="1.5" fill="#ffe08a"/><rect x="12" y="14" width="6" height="10" fill="#3a3a3a"/><path d="M15 12 q-4 -6 2 -9 q6 -2 4 -7" fill="none" stroke="#cfd8d6" stroke-width="2.5" stroke-linecap="round"/><circle cx="14" cy="44" r="6" fill="#222" stroke="#f5c542" stroke-width="2.5"/><circle cx="30" cy="44" r="6" fill="#222" stroke="#f5c542" stroke-width="2.5"/><circle cx="45" cy="44" r="6" fill="#222" stroke="#f5c542" stroke-width="2.5"/><path d="M2 52 h56" stroke="#7a6a55" stroke-width="2"/>',
  money: '<rect x="6" y="16" width="48" height="28" rx="4" fill="#f5c542"/><rect x="6" y="16" width="48" height="28" rx="4" fill="none" stroke="#9c7412" stroke-width="2"/><path d="M40 16 v28" stroke="#9c7412" stroke-width="2" stroke-dasharray="3 3"/><text x="23" y="33.5" text-anchor="middle" font-size="7" font-weight="900" fill="#5b4200">GOLDEN</text><text x="47" y="34" text-anchor="middle" font-size="10" font-weight="900" fill="#5b4200">★</text>',
  brunson: '<ellipse cx="30" cy="38" rx="26" ry="7" fill="#8a5a2b"/><path d="M16 37 q2 -20 14 -20 q12 0 14 20 z" fill="#a8703a"/><path d="M17 33 q13 5 26 0" stroke="#3b2414" stroke-width="3" fill="none"/><path d="M26 18 q4 4 8 0" stroke="#3b2414" stroke-width="2" fill="none"/>',
  hellmuth: '<path d="M30 6 l18 10 v18 l-18 10 l-18 -10 v-18 z" fill="#bfe9ff" stroke="#7fd4ff" stroke-width="2"/><path d="M30 6 v38 M12 16 l36 18 M48 16 l-36 18" stroke="#ffffff" stroke-width="1.5" opacity=".7"/><circle cx="30" cy="25" r="4" fill="#ffffff"/>',
  negreanu: '<path d="M4 30 q26 -24 52 0 q-26 24 -52 0 z" fill="#1b2a25" stroke="#3fd18f" stroke-width="2.5"/><circle cx="30" cy="30" r="10" fill="#3fd18f"/><circle cx="30" cy="30" r="4.5" fill="#0c1512"/><circle cx="33" cy="27" r="2" fill="#fff"/>',
  obrestad: '<rect x="12" y="10" width="22" height="32" rx="3" fill="#8e1f1a" stroke="#f3e6d0" stroke-width="2" transform="rotate(-8 23 26)"/><rect x="26" y="12" width="22" height="32" rx="3" fill="#a8322b" stroke="#f3e6d0" stroke-width="2" transform="rotate(8 37 28)"/><path d="M6 30 q24 -8 48 0" stroke="#141414" stroke-width="7" stroke-linecap="round"/><path d="M6 30 q24 -8 48 0" stroke="#3a3a3a" stroke-width="2"/>',
};
const EGGS = [
  { id: "chan", badge: "BACK-TO-BACK", who: "Johnny Chan", tag: "Costanza", svg: "chan",
    fact: "Johnny Chan, soprannominato «The Orient Express», vinse il Main Event delle WSOP nel 1987 e nel 1988. Nel 1989 arrivò di nuovo all'heads-up finale e fu battuto da Phil Hellmuth.",
    quip: "Due giorni di fila al tavolo da studio: il tuo Orient Express è partito.", reward: "Badge segreto BACK-TO-BACK",
    hint: "Allenati due giorni di fila." },
  { id: "money", badge: "MONEYMAKER EFFECT", who: "Chris Moneymaker", tag: "Bankroll e progressione", svg: "money",
    fact: "Nel 2003 Chris Moneymaker, un contabile dilettante, vinse il Main Event delle WSOP dopo essersi qualificato con un satellite online da poche decine di dollari. La sua storia fece esplodere la popolarità del poker: si parla ancora di «Moneymaker Effect».",
    quip: "Dal satellite al tavolo finale, con il bankroll al sicuro: la parte meno famosa della favola, ma la più importante.", reward: "Biglietto d'oro e badge MONEYMAKER EFFECT",
    hint: "Supera il tuo primo esame e cerca il biglietto." },
  { id: "brunson", badge: "TEXAS DOLLY", who: "Doyle Brunson", tag: "Storia e combinazioni", svg: "brunson",
    fact: "Doyle Brunson, «Texas Dolly», vinse il Main Event delle WSOP nel 1976 e nel 1977 e in entrambe le mani finali aveva 10-2. Da allora quella mano porta il suo nome.",
    quip: "Leggendaria nella storia. Non automaticamente profittevole nella tua strategia.", reward: "Dorso delle carte TEXAS DOLLY",
    hint: "Prima o poi in un drill ti arriverà una mano molto famosa." },
  { id: "hellmuth", badge: "ICE IN THE VEINS", who: "Phil Hellmuth", tag: "Mindset e varianza", svg: "hellmuth",
    fact: "Phil Hellmuth, soprannominato «The Poker Brat» per le sue reazioni al tavolo, vinse il Main Event delle WSOP nel 1989 a 24 anni e detiene il record di braccialetti WSOP.",
    quip: "Una decisione giusta non diventa sbagliata perché il risultato è andato storto. Tu non hai tiltato.", reward: "Badge segreto ICE IN THE VEINS",
    hint: "Dopo un momento storto, continua a decidere bene." },
  { id: "negreanu", badge: "SOUL READ", who: "Daniel Negreanu", tag: "Lettura delle mani", svg: "negreanu",
    fact: "Daniel Negreanu, «Kid Poker», è famoso per ragionare ad alta voce sulle mani degli avversari e, a volte, per nominare le loro carte prima che le mostrino.",
    quip: "Niente magia: hai ristretto il range azione dopo azione. È così che nasce una «lettura».", reward: "Badge segreto SOUL READ",
    hint: "Stima un range con grande precisione." },
  { id: "obrestad", badge: "NO-LOOK", who: "Annette Obrestad", tag: "Posizione e osservazione", svg: "obrestad",
    fact: "Nel 2007 Annette Obrestad vinse un torneo online da 180 giocatori guardando le proprie carte una sola volta, per mostrare quanto contano posizione e osservazione. Pochi mesi dopo, a 18 anni, vinse il Main Event delle WSOP Europe.",
    quip: "Hai giocato a occhi chiusi e hai visto tutto quello che serviva. Ora riapri gli occhi: le carte contano, ma non sono l'unica informazione.", reward: "Badge segreto NO-LOOK",
    hint: "Leggi bene i range e i giocatori: si aprirà una sfida segreta." },
];
const EGG_BY = Object.fromEntries(EGGS.map(e => [e.id, e]));
const eggHas = id => !!((S.eggs || {})[id]);
const eggIcon = (id, sz) => `<svg viewBox="0 0 60 56" width="${sz || 56}" height="${sz || 56}" aria-hidden="true">${EGG_SVG[EGG_BY[id].svg] || ""}</svg>`;
function eggCard(id) { const E = EGG_BY[id]; return `<div class="egg-card"><span class="egg-eye">Easter egg · ${esc(E.tag)}</span>${eggIcon(id, 84)}<h2>${esc(E.badge)}</h2><p class="egg-who">Omaggio a ${esc(E.who)}</p><p class="egg-fact">${esc(E.fact)}</p><p class="egg-quip">«${esc(E.quip)}»</p><p class="egg-rw">🎁 ${esc(E.reward)}</p><p class="muted" style="font-size:12px;margin:8px 0 0">Lo ritrovi nella Hall of Fame segreta, in Progressi.</p></div>`; }
function eggUnlock(id, delay) {
  if (!EGG_BY[id] || eggHas(id)) return false;
  S.eggs = { ...(S.eggs || {}), [id]: today() }; persist();
  setTimeout(() => { try { gModal(eggCard(id)); gConfetti(1800); } catch (e) {} }, delay != null ? delay : 600);
  return true;
}
/* frasi rare di Orca: al massimo una al giorno per tipo */
function eggQuip(key, txt) { const k = "orca_q_" + key; if (lsGet(k) === today()) return false; lsSet(k, today()); try { gToast(`${typeof gMascot === "function" ? "" : ""}🐋 <span>${txt}</span>`); } catch (e) {} return true; }

/* ---- Phil Hellmuth: due errori di fila, poi tre decisioni giuste ---- */
function eggOnAnswer(q, res) {
  try {
    if (!run || isExamRun() || res.score == null) return;
    const c = run.ctx;
    if (res.score < 60) { c.eggBad = (c.eggBad || 0) + 1; c.eggGood = 0; if (c.eggBad >= 2 && !c.hellArmed && !eggHas("hellmuth")) { c.hellArmed = true; eggQuip("hell", "Respira. Phil sta arrivando…"); } }
    else if (res.score >= 100) { c.eggBad = 0; if (c.hellArmed) { c.eggGood = (c.eggGood || 0) + 1; if (c.eggGood >= 3) { c.hellArmed = false; eggUnlock("hellmuth", 900); } } }
    /* Negreanu: stima del range quasi perfetta */
    if (q.skill === "range" && res.score >= 90) eggUnlock("negreanu", 900);
    /* Obrestad: chi legge bene range e giocatori trova la sfida segreta */
    if ((q.skill === "range" || q.skill === "profile") && res.score >= 80 && !(S.eggOffer || {}).nolook) {
      S.eggOffer = { ...(S.eggOffer || {}), nolook: today() }; persist();
      setTimeout(() => { const fb = $("#fb"); if (fb) fb.insertAdjacentHTML("beforeend", `<div class="egg-offer">${eggIcon("obrestad", 46)}<div><b>Sfida segreta sbloccata: No-Look</b><span>Cinque mani con le carte coperte: decidi solo con posizione, azioni e avversari. La trovi anche in Drill liberi.</span></div><button class="btn small" data-nolook="1">Gioca</button></div>`); }, 50);
    }
    /* Doyle Brunson: 10-2 in mano → dopo la risposta compare il cappello da cowboy */
    setTimeout(eggBrunsonScan, 60);
  } catch (e) {}
}
function eggHeroRanks() {
  const card = document.querySelector(".qcard"); if (!card) return [];
  const els = card.querySelectorAll(".ptbl-hc .pc, .p6-hc .pc");
  return [...els].map(e => (e.getAttribute("aria-label") || e.textContent || "").trim().split(" ")[0]).filter(Boolean);
}
function eggBrunsonScan() {
  if (eggHas("brunson") || !run || run.stage !== "fb") return;
  const r = eggHeroRanks(); if (r.length !== 2 || !(r.includes("10") && r.includes("2"))) return;
  const fb = $("#fb"); if (!fb || fb.querySelector(".egg-hat")) return;
  fb.insertAdjacentHTML("afterbegin", `<button class="egg-hat" data-egg="brunson" title="Questa mano ha una storia..." aria-label="Una mano famosa: scopri la storia">${eggIcon("brunson", 44)}<span>10-2: questa mano ha una storia</span></button>`);
}
/* ---- Johnny Chan: allenamento in due giorni consecutivi ---- */
function eggCheckChan() { try { if (eggHas("chan")) return; const set = new Set(S.days || []); if (set.has(today()) && set.has(addDays(-1))) { eggTrain(); eggUnlock("chan", 2600); } } catch (e) {} }
function eggTrain() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const t = document.createElement("div"); t.className = "egg-train"; t.innerHTML = `${eggIcon("chan", 70)}<span>The Orient Express</span>`; document.body.appendChild(t); setTimeout(() => t.remove(), 3200);
}

/* ---- Annette Obrestad: No-Look Challenge, 5 mani a carte coperte ---- */
const NL_SPOTS = [
  { pos: "BTN", act: "Tutti foldano fino a te.", opp: "SB e BB sono due giocatori molto stretti: foldano quasi sempre contro i furti.", o: ["Rilancio per rubare i bui", "Fold"], a: 0, why: "Dal bottone, contro bui che foldano quasi sempre, il rilancio vince subito il piatto molto spesso: la posizione e gli avversari valgono più delle carte." },
  { pos: "EP", act: "Sei il primo a parlare e dietro di te ci sono cinque giocatori.", opp: "Al tavolo ci sono due reg aggressivi che 3-bettano spesso.", o: ["Fold", "Rilancio"], a: 0, why: "Dal primo posto, con cinque giocatori dietro e avversari aggressivi, senza sapere cosa hai il fold è la scelta prudente: la posizione peggiore richiede le mani migliori." },
  { pos: "CO", act: "Tutti foldano fino a te.", opp: "Il BTN è un giocatore molto aggressivo che rilancia spesso le aperture del CO.", o: ["Fold più spesso del solito", "Rilancio sempre"], a: 0, why: "Con un giocatore aggressivo in posizione subito dopo di te, rubare diventa più costoso: senza carte da vedere, il fold è la scelta sensata. Con le carte apriresti un range più stretto del normale." },
  { pos: "SB", act: "Tutti foldano fino a te.", opp: "Il BB è un giocatore che folda troppo contro i rilanci dalla SB.", o: ["Rilancio", "Fold"], a: 0, why: "Contro un BB che folda troppo il rilancio dalla SB guadagna subito i bui molto spesso: è l'avversario a rendere profittevole la scelta." },
  { pos: "BTN", act: "Tutti foldano fino a te.", opp: "SB e BB sono due giocatori che 3-bettano moltissimo e non mollano mai il piatto.", o: ["Fold", "Rilancio per rubare"], a: 0, why: "Contro bui che rispondono sempre con un rilancio, rubare alla cieca costa caro: senza vedere le carte il fold evita una guerra senza vantaggio." },
];
function nlChallenge() {
  const G = { i: 0, ok: 0, order: shuffle(NL_SPOTS.map((_, k) => k)), cards: [] };
  const deal = () => { const d = shuffle(RANKS.split("").flatMap(r => SUITS.split("").map(s => r + s))); return d[0] + d[1]; };
  const paint = (rev, pick) => {
    const sp = NL_SPOTS[G.order[G.i]], cs = G.cards[G.i] || (G.cards[G.i] = deal());
    const back = `<span class="nl-back"></span><span class="nl-back"></span>`;
    return `<div class="nl-ch"><div class="nl-top">${eggIcon("obrestad", 40)}<div><span class="egg-eye">No-Look Challenge · mano ${G.i + 1} di ${NL_SPOTS.length}</span><b>Le tue carte restano coperte</b></div></div>
      <div class="nl-seat"><span class="nl-pos">${sp.pos}</span><div class="nl-cards ${rev ? "rev" : ""}">${rev ? cardsHtml(cs) : back}</div></div>
      <p class="nl-act"><b>Azione:</b> ${esc(sp.act)}</p><p class="nl-act"><b>Avversari:</b> ${esc(sp.opp)}</p>
      ${rev ? `<div class="nl-res ${pick === sp.a ? "ok" : "ko"}"><b>${pick === sp.a ? "Lettura giusta" : "Questa volta no"}</b><p>${esc(sp.why)}</p></div><button class="btn primary" data-nlnext="1">${G.i + 1 < NL_SPOTS.length ? "Prossima mano" : "Vedi il risultato"}</button>`
        : `<div class="nl-opts">${sp.o.map((t, k) => `<button class="btn" data-nlpick="${k}">${esc(t)}</button>`).join("")}</div>`}
      <p class="muted" style="font-size:12px;margin:10px 0 0">Esperimento didattico, non una strategia GTO: serve a sentire quanto pesano posizione e avversari.</p></div>`;
  };
  const end = () => `<div class="nl-ch" style="text-align:center">${eggIcon("obrestad", 70)}<h2 style="margin:8px 0">${G.ok} su ${NL_SPOTS.length}</h2><p>${G.ok >= 4 ? "Hai letto posizione e avversari senza guardare le carte." : "Riprova: guarda dove sei seduto e chi hai intorno prima di tutto il resto. Servono almeno 4 letture giuste."}</p>${G.ok >= 4 ? "" : `<button class="btn primary" data-nlagain="1">Riprova</button>`}</div>`;
  const mount = m => {
    const box = m.querySelector(".nl-host");
    const bind = () => {
      box.querySelectorAll("[data-nlpick]").forEach(b => b.onclick = () => { const k = +b.dataset.nlpick, sp = NL_SPOTS[G.order[G.i]]; if (k === sp.a) G.ok++; box.innerHTML = paint(true, k); bind(); });
      const nx = box.querySelector("[data-nlnext]"); if (nx) nx.onclick = () => { G.i++; if (G.i >= NL_SPOTS.length) { box.innerHTML = end(); bind(); if (G.ok >= 4) { try { recordAnswer("profile", 100, 0); } catch (e) {} eggUnlock("obrestad", 700); } } else { box.innerHTML = paint(false); bind(); } };
      const ag = box.querySelector("[data-nlagain]"); if (ag) ag.onclick = () => { G.i = 0; G.ok = 0; G.order = shuffle(NL_SPOTS.map((_, k) => k)); G.cards = []; box.innerHTML = paint(false); bind(); };
    };
    box.innerHTML = paint(false); bind();
  };
  gModal(`<div class="nl-host"></div>`, mount);
}

/* ---- Chris Moneymaker: dal satellite al tavolo finale, tre tappe ---- */
const MM_STEPS = [
  { t: "Tappa 1 · Il satellite", q: "Hai un bankroll simulato da tornei di 400 €. Quale torneo scegli per inseguire il sogno senza rischiare tutto?", o: ["Un satellite da 10 € che dà il biglietto per un torneo più grande", "Il torneo principale da 400 €, tutto in una volta", "Un torneo da 200 €, metà bankroll", "Tre tornei da 150 €"], a: 0, why: "Il satellite costa una piccola parte del bankroll e dà accesso al torneo grande: è esattamente come nacque la storia. Giocarsi metà o tutto il bankroll in un torneo è la ricetta per rimanere a zero." },
  { t: "Tappa 2 · Il torneo", q: "Hai 10 big blind al BTN, tutti foldano fino a te. Hai A♠9♦. Cosa fai?", o: ["All-in", "Rilancio a 2bb e fold se mi rilanciano", "Limp", "Fold"], a: 0, why: "Con 10 big blind A9 al bottone è un all-in standard: metti pressione sui bui, vinci spesso il piatto subito e quando vieni chiamato hai buone chance. Un rilancio piccolo con uno stack così corto ti lascia senza opzioni." },
  { t: "Tappa 3 · Il tavolo finale", q: "Heads-up per il titolo: hai 12 big blind in SB con K♠7♠. Cosa fai?", o: ["All-in", "Fold", "Limp e fold a un rilancio", "Rilancio a 2bb e fold a un all-in"], a: 0, why: "In heads-up con 12 big blind K7 suited è un all-in chiaro: la mano è sopra la media e la pressione ti fa vincere i bui molto spesso. Foldare o limpare regala fiches proprio quando contano di più." },
];
function mmMission() {
  let i = 0, ok = 0;
  const paint = (pick) => { const s = MM_STEPS[i]; return `<div class="nl-ch"><div class="nl-top">${eggIcon("money", 44)}<div><span class="egg-eye">Il biglietto d'oro · ${esc(s.t)}</span><b>${i + 1} di ${MM_STEPS.length}</b></div></div><p class="mm-q">${typeof tcText === "function" ? tcText(s.q) : esc(s.q)}</p>
    ${pick == null ? `<div class="nl-opts col">${shuffle(s.o.map((t, k) => k)).map(k => `<button class="btn" data-mmpick="${k}">${esc(s.o[k])}</button>`).join("")}</div>` : `<div class="nl-res ${pick === s.a ? "ok" : "ko"}"><b>${pick === s.a ? "Giusto" : "Non proprio"}</b><p>${esc(s.why)}</p></div><button class="btn primary" data-mmnext="1">${i + 1 < MM_STEPS.length ? "Prossima tappa" : "Vedi il finale"}</button>`}</div>`; };
  const mount = m => { const box = m.querySelector(".nl-host"); const bind = () => {
    box.querySelectorAll("[data-mmpick]").forEach(b => b.onclick = () => { const k = +b.dataset.mmpick; if (k === MM_STEPS[i].a) ok++; box.innerHTML = paint(k); bind(); });
    const nx = box.querySelector("[data-mmnext]"); if (nx) nx.onclick = () => { i++; if (i < MM_STEPS.length) { box.innerHTML = paint(null); bind(); return; }
      box.innerHTML = ok === MM_STEPS.length ? `<div class="nl-ch" style="text-align:center">${eggIcon("money", 80)}<h2 style="margin:8px 0">Campione!</h2><p>Dal satellite al titolo senza mettere a rischio il bankroll.</p></div>` : `<div class="nl-ch" style="text-align:center">${eggIcon("money", 70)}<h2 style="margin:8px 0">${ok} tappe su ${MM_STEPS.length}</h2><p>Il biglietto resta valido: riprova quando vuoi da Progressi, nella Hall of Fame segreta.</p><button class="btn primary" data-mmagain="1">Riprova</button></div>`;
      bind(); if (ok === MM_STEPS.length) eggUnlock("money", 700); };
    const ag = box.querySelector("[data-mmagain]"); if (ag) ag.onclick = () => { i = 0; ok = 0; box.innerHTML = paint(null); bind(); };
  }; box.innerHTML = paint(null); bind(); };
  gModal(`<div class="nl-host"></div>`, mount);
}
const mmOffered = () => !!(S.eggOffer || {}).money;
function mmOfferHtml() { if (eggHas("money")) return ""; if (!mmOffered()) { S.eggOffer = { ...(S.eggOffer || {}), money: today() }; persist(); } return `<div class="egg-offer gold">${eggIcon("money", 46)}<div><b>Hai trovato un biglietto d'oro</b><span>Una mini-missione in tre tappe: dal satellite al tavolo finale.</span></div><button class="btn small" data-mm="1">Usa il biglietto</button></div>`; }

/* dettagli nascosti nelle schede: carte leggendarie, macchina del tempo, avversario senza nome (mai durante un drill) */
function eggDecor() {
  try {
    if (run) return; const v = $("#view"); if (!v || v.querySelector(".egg-decor")) return;
    const hk = { progress: "aa", ref: "kk", equity: "s72", mind: "t2" }[tab];
    if (hk && !huntHas(hk)) v.insertAdjacentHTML("beforeend", `<div class="egg-decor hunt-wrap">${huntHtml(hk)}</div>`);
    if (tab === "progress") { const ey = [...v.querySelectorAll(".eyebrow")].find(x => /andamento|report settimanale/i.test(x.textContent)); if (ey && !ey.querySelector("[data-tmach]")) ey.insertAdjacentHTML("beforeend", ` <button class="tm-btn" data-tmach="1" title="Che ore sono nella storia del poker?" aria-label="Macchina del tempo">⏳</button>`); }
    if (tab === "opp" && !eggHas("isildur")) v.insertAdjacentHTML("beforeend", `<div class="egg-decor"><button class="isil" data-isildur="1" title="Avversario senza nome">${eggIcon("isildur", 26)}<span>Avversario sconosciuto · 0 mani</span></button></div>`);
  } catch (e) {}
}
/* pulsante per riprendere una sfida già trovata ma non ancora vinta */
function eggOfferBtn(id) { const O = S.eggOffer || {}; return id === "money" && O.money ? `<button class="btn small" data-mm="1">Usa il biglietto</button>` : id === "obrestad" && O.nolook ? `<button class="btn small" data-nolook="1">Gioca</button>` : id === "hansen" && O.hansen ? `<button class="btn small" data-hansen="1">Gioca</button>` : id === "dwan" && O.dwan ? `<button class="btn small" data-dwan="1">Gioca</button>` : id === "ivey" && O.ivey ? `<button class="btn small" data-silent="1">Siediti</button>` : ""; }
/* ---- Hall of Fame segreta (nella bacheca dei trofei) ---- */
function eggHall() {
  const n = EGGS.filter(e => eggHas(e.id)).length;
  return `<div class="egg-hall"><span class="eyebrow">Hall of Fame segreta · ${n}/${EGGS.length}</span><div class="egg-grid">${EGGS.map(e => eggHas(e.id)
    ? `<button class="egg-cell on" data-eggshow="${e.id}">${eggIcon(e.id, 46)}<b>${esc(e.badge)}</b><small>${esc(e.who)}</small></button>`
    : `<div class="egg-cell off">${eggIcon(e.id, 46)}<b>???</b><small>${esc(e.hint)}</small>${eggOfferBtn(e.id)}</div>`).join("")}</div>${eggHas("ivey") ? `<button class="btn small egg-theme" data-eggtheme="1">${eggTheme() ? "Torna al tema normale" : "Usa il tema THE SILENT TABLE"}</button>` : ""}</div>`;
}
document.addEventListener("click", e => {
  const h = e.target.closest("[data-egg]"); if (h) { e.preventDefault(); const id = h.dataset.egg; if (!eggUnlock(id, 0)) gModal(eggCard(id)); h.remove(); return; }
  const sh = e.target.closest("[data-eggshow]"); if (sh) return gModal(eggCard(sh.dataset.eggshow));
  if (e.target.closest("[data-nolook]")) { e.preventDefault(); return nlChallenge(); }
  if (e.target.closest("[data-mm]")) { e.preventDefault(); return mmMission(); }
});

