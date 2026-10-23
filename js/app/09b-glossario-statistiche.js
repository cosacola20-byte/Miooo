/* ================= GLOSSARIO DELLE STATISTICHE DEI TRACKER (UI.statGl) =================
   Le statistiche di Holdem Manager 3, PokerTracker 4 e Hand2Note 4, divise per gruppo.
   Ogni voce: [gruppo, sigla, nome come appare nei tracker, cosa misura, come leggerla (facoltativo)].
   Il contenuto si costruisce solo quando il glossario si apre: la scheda della lezione resta leggera
   e i termini dentro il glossario non diventano link o fumetti. */
const SG_CAT = [
  ["gen", "Generali", "#2f7de1"], ["ris", "Risultati", "#1b9a5a"], ["pre", "Preflop", "#8f5ad8"], ["bui", "Steal e bui", "#d4a24c"],
  ["fl", "Flop", "#1aa6a0"], ["tu", "Turn", "#ef7a43"], ["ri", "River", "#e04848"], ["sd", "Showdown", "#5b6bd6"], ["var", "Varianti e simboli", "#7d8790"],
];
const SG_STATS = [
  /* ---------- generali ---------- */
  ["gen", "Mani", "Hands", "Quante mani hai giocato al tavolo con quel giocatore. È il numero che dice quanto fidarti di tutti gli altri.", "Sotto le 100 mani VPIP e PFR sono indizi; le statistiche più rare ne chiedono centinaia o migliaia."],
  ["gen", "VPIP", "Voluntarily Put $ In Pot", "In quante mani su 100 mette soldi nel piatto di sua volontà preflop: call, limp e rilanci. Non contano i bui obbligati quando poi checka o folda.", "Quanto gioca. Molto alto (40 e oltre) è tipico di chi gioca troppe mani."],
  ["gen", "PFR", "Preflop Raise", "In quante mani su 100 rilancia preflop: open, iso, 3-bet, 4-bet.", "Quanto rilancia. Se è molto più basso del VPIP, il giocatore paga e limpa invece di rilanciare."],
  ["gen", "AF", "Aggression Factor", "Puntate e rilanci diviso i call, dopo il flop. È un rapporto, non una percentuale: AF 3 vuol dire tre puntate o rilanci per ogni call.", "Basso (sotto 1,5) è passivo, alto (sopra 3) aggressivo. Non conta i fold."],
  ["gen", "AFq", "Aggression Frequency", "Puntate e rilanci diviso tutte le azioni dopo il flop, fold compresi (check esclusi), in percentuale.", "Più completo dell'AF, perché tiene conto anche dei fold."],
  ["gen", "Agg%", "Postflop Aggression %", "In quante street viste dopo il flop punta o rilancia almeno una volta. Holdem Manager la mostra anche street per street.", "Simile all'AFq, ma conta le street invece delle singole azioni."],
  ["gen", "Saw Flop", "Saw Flop %", "In quante mani su 100 vede il flop.", "Va letta con il VPIP: chi vede molti flop gioca molti piatti dopo il flop, spesso fuori posizione."],
  ["gen", "Fold to Bet", "Fold to Bet (Total)", "Quanto spesso folda quando qualcuno punta, su tutte le street dopo il flop.", "Alto: le puntate funzionano. Basso: punta per valore e bluffa poco."],
  ["gen", "Check-Call", "Check-Call", "Dopo aver fatto check, paga la puntata che arriva.", "Tipico dei giocatori passivi: lasciano puntare e pagano."],
  ["gen", "Check-Fold", "Check-Fold", "Dopo aver fatto check, folda alla puntata che arriva.", "Alto: puntare dopo il suo check rende."],

  /* ---------- risultati ---------- */
  ["ris", "bb/100", "Win Rate (bb/100)", "Quanti big blind vinci o perdi in media ogni 100 mani.", "Il numero che dice se stai vincendo. Servono decine di migliaia di mani perché sia affidabile."],
  ["ris", "EV bb/100", "All-in Adj bb/100 / EV bb/100", "Il winrate tolta la fortuna degli all-in: per ogni all-in conta la tua equity invece del risultato.", "Se è molto sopra il winrate reale sei stato sfortunato, se è sotto fortunato."],
  ["ris", "Vinto", "Net Won / Won $", "Quanto hai vinto o perso in tutto, in euro o in big blind."],
  ["ris", "Linea verde", "Net Won (linea verde)", "Nel grafico dei risultati, la vincita totale."],
  ["ris", "Linea rossa", "Non-Showdown Winnings", "Nel grafico, quanto vinci o perdi nelle mani finite senza showdown: piatti vinti con puntate e piatti lasciati con un fold.", "In salita: vinci tanti piatti senza mostrare. In discesa: foldi spesso dopo aver investito."],
  ["ris", "Linea blu", "Showdown Winnings", "Nel grafico, quanto vinci o perdi nelle mani arrivate allo showdown.", "Ai micro di solito sale: le mani forti si fanno pagare."],
  ["ris", "Linea EV", "All-in EV / All-in Adj", "Nel grafico, la linea della vincita tolta la fortuna degli all-in. Il colore cambia da tracker a tracker.", "La distanza dalla linea verde è fortuna o sfortuna."],
  ["ris", "Rake", "Rake Paid / Rake attribuita", "Quanta rake hai pagato. I tracker la dividono tra chi ha messo soldi nel piatto."],
  ["ris", "Dev. std", "Std Dev bb/100", "Quanto oscillano i risultati ogni 100 mani: la misura della varianza.", "Più è alta, più mani servono per capire il tuo vero winrate."],

  /* ---------- preflop ---------- */
  ["pre", "RFI", "Raise First In / Open Raise", "Quanto spesso apre con un rilancio quando prima di lui hanno foldato tutti. Di solito si guarda per posizione: UTG, HJ, CO, BTN, SB.", "Confrontala con le tabelle di open: dice quanto è largo il suo range."],
  ["pre", "Limp", "Open Limp / Limp %", "Quanto spesso entra pagando solo il big blind quando prima di lui hanno foldato tutti.", "Alto: giocatore debole, da isolare."],
  ["pre", "Limp-Call", "Limp-Call", "Dopo aver limpato, paga il rilancio di un altro giocatore."],
  ["pre", "Limp-Fold", "Limp-Fold", "Dopo aver limpato, folda al rilancio di un altro giocatore.", "Alto: l'iso raise vince spesso subito."],
  ["pre", "Limp-Raise", "Limp-Raise / Limp-Reraise", "Dopo aver limpato, rilancia quando un altro giocatore rilancia.", "Ai micro è quasi sempre una mano fortissima, come AA o KK."],
  ["pre", "Overlimp", "Overlimp / Limp Behind", "Limpa anche lui dopo che un altro ha già limpato."],
  ["pre", "Iso", "Raise Limpers / Iso Raise", "Rilancia dopo uno o più limper per giocare contro uno solo."],
  ["pre", "Fold to Iso", "Fold to Iso Raise", "Dopo aver limpato, folda all'iso raise. È un altro nome del limp-fold in alcuni tracker."],
  ["pre", "CC", "Cold Call", "Paga un rilancio come prima azione volontaria della mano, senza aver ancora messo soldi nel piatto di sua volontà.", "Alto: paga molti open invece di 3-bettare, spesso fuori posizione."],
  ["pre", "Call Open", "Call vs RFI / Flat", "Paga un open, di solito mostrata per posizione: contro UTG, contro CO, contro BTN."],
  ["pre", "3-bet", "3Bet PF", "Quanto spesso rilancia quando davanti a lui c'è un open: rilanci diviso le occasioni di 3-bet.", "Bassa (sotto 4%): quando 3-betta ha mani forti. Alta (oltre 10%): 3-betta anche per bluff."],
  ["pre", "3-bet IP / OOP", "3Bet PF IP / OOP", "La 3-bet divisa tra in posizione (per esempio dal BTN contro il CO) e fuori posizione (dai bui).", "Molti giocatori 3-bettano di più dai bui e pagano di più in posizione."],
  ["pre", "Fold to 3-bet", "Fold to 3Bet PF", "Dopo aver aperto, quanto spesso folda alla 3-bet.", "Alto: le 3-bet in bluff contro di lui rendono."],
  ["pre", "Call 3-bet", "Call 3Bet PF", "Dopo aver aperto, quanto spesso paga la 3-bet."],
  ["pre", "4-bet", "4Bet PF", "Quanto spesso rilancia una 3-bet.", "Ai micro, se è bassa, la 4-bet è quasi sempre AA, KK o AK."],
  ["pre", "Fold to 4-bet", "Fold to 4Bet PF", "Dopo aver fatto 3-bet, quanto spesso folda alla 4-bet."],
  ["pre", "Call 4-bet", "Call 4Bet PF", "Dopo aver fatto 3-bet, quanto spesso paga la 4-bet."],
  ["pre", "5-bet", "5Bet PF", "Quanto spesso rilancia una 4-bet, di solito all-in."],
  ["pre", "Fold to 5-bet", "Fold to 5Bet PF", "Dopo aver fatto 4-bet, quanto spesso folda alla 5-bet."],
  ["pre", "Cold 4-bet", "Cold 4Bet", "Fa 4-bet senza aver messo soldi prima: c'è stato un open, poi una 3-bet, e lui rilancia da dietro.", "Quasi sempre una mano fortissima ai micro."],
  ["pre", "Squeeze", "Squeeze", "Fa 3-bet dopo un open e almeno un call.", "Alta: usa i call degli altri per rubare il piatto."],
  ["pre", "Fold to Squeeze", "Fold to Squeeze", "Dopo aver aperto o pagato, quanto spesso folda allo squeeze."],
  ["pre", "PF All-in", "Preflop All-in / Open Shove", "Quanto spesso va all-in preflop, per primo o su un rilancio."],

  /* ---------- steal e bui ---------- */
  ["bui", "ATS", "Attempt to Steal / Steal", "Apre da CO, BTN o SB quando prima di lui hanno foldato tutti, per rubare i bui.", "Alta: apre largo in late position, puoi difendere e 3-bettare di più."],
  ["bui", "Steal riuscito", "Steal Success", "In quante occasioni il suo steal vince subito perché foldano tutti."],
  ["bui", "Fold to Steal", "Fold to Steal (SB / BB)", "Dai bui, quanto spesso folda contro uno steal.", "Alta: contro di lui apri più mani da CO e BTN."],
  ["bui", "Call Steal", "Call vs Steal (SB / BB)", "Dai bui, quanto spesso paga uno steal."],
  ["bui", "3-bet vs Steal", "3Bet vs Steal / Resteal", "Dai bui, quanto spesso fa 3-bet contro uno steal."],
  ["bui", "Fold to Resteal", "Fold to 3Bet after Steal", "Dopo uno steal, quanto spesso folda alla 3-bet dei bui.", "Alta: 3-bettare contro i suoi steal è molto profittevole."],
  ["bui", "BB Defend", "BB Defend vs Steal", "Dal BB, quanto spesso difende (paga o rilancia) contro uno steal: il contrario del fold to steal."],
  ["bui", "SB vs BB", "Blind vs Blind", "Le statistiche quando restano solo i due bui: steal dello SB, limp dello SB, fold del BB allo SB, 3-bet del BB contro lo SB.", "Nel blind vs blind i range sono molto larghi: è una situazione a parte."],
  ["bui", "SB Limp", "SB Complete / SB Limp", "Dallo SB, quando prima hanno foldato tutti, completa il big blind invece di rilanciare o foldare."],
  ["bui", "Walk", "Walk", "Mani in cui il BB vince i bui perché tutti foldano prima di lui."],

  /* ---------- flop ---------- */
  ["fl", "CBet", "Flop CBet", "Quanto spesso l'ultimo ad aver rilanciato preflop punta il flop, quando prima di lui nessuno ha puntato.", "Alta: punta molti flop anche senza niente. Bassa: quando punta ha spesso una mano."],
  ["fl", "CBet IP / OOP", "Flop CBet IP / OOP", "La stessa c-bet divisa tra in posizione e fuori posizione.", "Quasi tutti fanno più c-bet in posizione."],
  ["fl", "CBet 3BP", "Flop CBet in 3Bet Pot", "La c-bet al flop nei piatti con 3-bet preflop."],
  ["fl", "CBet MW", "Flop CBet Multiway", "La c-bet al flop contro due o più avversari."],
  ["fl", "Fold to CBet", "Fold to Flop CBet", "Quanto spesso folda alla c-bet del flop.", "Alta: la c-bet contro di lui vince spesso subito. Bassa: punta per valore, bluffa poco."],
  ["fl", "Call CBet", "Call Flop CBet", "Quanto spesso paga la c-bet del flop."],
  ["fl", "Raise CBet", "Raise Flop CBet", "Quanto spesso rilancia la c-bet del flop. Fuori posizione è un check-raise.", "Bassa: il suo rilancio ai micro è quasi sempre una mano forte."],
  ["fl", "XR", "Flop Check-Raise", "Fa check e poi rilancia la puntata dell'avversario nella stessa street."],
  ["fl", "Fold to XR", "Fold to Flop Check-Raise", "Dopo aver puntato, quanto spesso folda al check-raise."],
  ["fl", "Donk", "Flop Donk Bet / Lead", "Punta per primo il flop fuori posizione verso chi ha rilanciato preflop, invece di fare check.", "Ai micro spesso è una mano media o un progetto."],
  ["fl", "Fold to Donk", "Fold to Flop Donk", "Quanto spesso l'aggressore preflop folda alla donk bet."],
  ["fl", "Raise Donk", "Raise Flop Donk", "Quanto spesso l'aggressore preflop rilancia la donk bet."],
  ["fl", "Fold to Raise", "Fold to Flop Raise", "Dopo aver puntato il flop, quanto spesso folda quando l'avversario rilancia in posizione.", "Alta: rilancia le sue puntate e folda le mani medie."],
  ["fl", "Bet vs Miss", "Flop Bet vs Missed CBet / Stab", "L'aggressore preflop non fa c-bet e lui punta. Di solito succede in posizione.", "Alta: attacca ogni volta che l'aggressore rinuncia."],
  ["fl", "Fold vs Miss", "Fold to Flop Bet vs Missed CBet", "Dopo aver rinunciato alla c-bet, quanto spesso folda quando l'avversario punta."],
  ["fl", "Flop AF", "Flop Aggression Factor", "L'aggression factor solo al flop."],
  ["fl", "Flop Agg%", "Flop Aggression %", "In quanti flop visti punta o rilancia."],
  ["fl", "Fold Flop Bet", "Fold to Flop Bet", "Quanto spesso folda a una puntata al flop, c-bet o no."],

  /* ---------- turn ---------- */
  ["tu", "CBet Turn", "Turn CBet / Double Barrel", "Dopo la c-bet al flop, quanto spesso punta di nuovo al turn.", "Molto più bassa della c-bet al flop: quando punta anche il turn ha più spesso una mano."],
  ["tu", "Fold to Turn CB", "Fold to Turn CBet", "Quanto spesso folda alla seconda puntata, al turn."],
  ["tu", "Call Turn CB", "Call Turn CBet", "Quanto spesso paga la seconda puntata."],
  ["tu", "Raise Turn CB", "Raise Turn CBet", "Quanto spesso rilancia la puntata del turn.", "Ai micro un raise al turn è quasi sempre una mano molto forte."],
  ["tu", "Fold to Turn Raise", "Fold to Turn Raise", "Dopo aver puntato il turn, quanto spesso folda al rilancio dell'avversario."],
  ["tu", "Delay", "Delayed Turn CBet", "L'aggressore preflop non punta il flop e punta il turn."],
  ["tu", "Fold to Delay", "Fold to Delayed Turn CBet", "Quanto spesso folda alla puntata ritardata del turn."],
  ["tu", "Probe", "Turn Probe", "Il flop è stato checkato da tutti (l'aggressore in posizione non ha fatto c-bet) e lui, fuori posizione, punta per primo il turn."],
  ["tu", "Fold to Probe", "Fold to Turn Probe", "Quanto spesso l'aggressore preflop folda alla probe del turn."],
  ["tu", "Turn Donk", "Turn Donk Bet", "Dopo aver pagato la puntata del flop, punta per primo il turn invece di fare check."],
  ["tu", "Turn XR", "Turn Check-Raise", "Check-raise al turn."],
  ["tu", "Fold to Turn XR", "Fold to Turn Check-Raise", "Dopo aver puntato il turn, quanto spesso folda al check-raise."],
  ["tu", "Float", "Turn Bet vs Missed CBet / Float", "Ha pagato la c-bet al flop in posizione; al turn l'aggressore fa check e lui punta.", "Alta: paga il flop per prendersi il piatto al turn quando l'altro rinuncia."],
  ["tu", "Turn AF", "Turn Aggression Factor", "L'aggression factor solo al turn."],
  ["tu", "Turn Agg%", "Turn Aggression %", "In quanti turn visti punta o rilancia."],

  /* ---------- river ---------- */
  ["ri", "CBet River", "River CBet / Triple Barrel", "Dopo aver puntato flop e turn, quanto spesso punta anche il river."],
  ["ri", "Fold to River CB", "Fold to River CBet", "Quanto spesso folda alla terza puntata, al river.", "Ai micro di solito è bassa: chi arriva al river con una coppia paga."],
  ["ri", "Call River CB", "Call River CBet", "Quanto spesso paga la terza puntata."],
  ["ri", "Raise River CB", "Raise River CBet", "Quanto spesso rilancia la puntata del river.", "Ai micro un raise al river è quasi sempre una mano fortissima."],
  ["ri", "River Bet", "River Bet", "Quanto spesso punta il river quando può farlo per primo o quando l'avversario checka."],
  ["ri", "Fold River Bet", "Fold to River Bet", "Quanto spesso folda a una puntata al river, di qualsiasi tipo."],
  ["ri", "River Probe", "River Probe", "Il turn è stato checkato da tutti e lui, fuori posizione, punta per primo il river."],
  ["ri", "River Donk", "River Donk Bet", "Dopo aver pagato la puntata del turn, punta per primo il river."],
  ["ri", "River XR", "River Check-Raise", "Check-raise al river.", "Ai micro è quasi sempre valore."],
  ["ri", "River Bet vs Miss", "River Bet vs Missed CBet", "L'aggressore checka il river e lui punta."],
  ["ri", "River AF", "River Aggression Factor", "L'aggression factor solo al river."],
  ["ri", "River Agg%", "River Aggression %", "In quanti river visti punta o rilancia."],

  /* ---------- showdown ---------- */
  ["sd", "WTSD", "Went To ShowDown", "Quante volte, dopo aver visto il flop, arriva allo showdown.", "Alta (oltre 30%): paga fino in fondo, bluffa poco contro di lui. Bassa: folda spesso prima."],
  ["sd", "W$SD", "Won $ at ShowDown", "Quanti showdown vince.", "Con WTSD alta e W$SD bassa: arriva allo showdown con mani deboli."],
  ["sd", "WWSF", "Won When Saw Flop / W$WSF", "In quante mani vince il piatto quando vede il flop, con o senza showdown.", "Alta: si prende molti piatti con l'aggressività. Bassa: lascia spesso il piatto."],
  ["sd", "W$SD River Call", "Won at SD after River Call", "Quanti showdown vince quando ci arriva pagando una puntata al river. Il nome cambia da tracker a tracker.", "Bassa: paga il river troppo largo. Alta: paga solo con mani forti."],
  ["sd", "WTSD after CB", "WTSD after Calling Flop CBet", "Quante volte arriva allo showdown dopo aver pagato la c-bet al flop.", "Dice se chi paga il flop poi molla al turn o va fino in fondo."],

  /* ---------- varianti e simboli ---------- */
  ["var", "( n )", "Opportunità / Sample", "Il numero piccolo accanto a una statistica: le volte in cui il giocatore ha avuto l'occasione di farla. 50% su 4 occasioni non dice quasi niente.", "Prima di usare una percentuale guarda sempre su quante occasioni è calcolata."],
  ["var", "EP · MP · CO · BTN · SB · BB", "Per posizione", "Quasi ogni statistica preflop esiste per posizione: EP sono i primi posti (UTG), MP quelli centrali (HJ). Lo stesso giocatore apre molto più largo dal BTN che da UTG."],
  ["var", "vs pos", "Contro posizione", "La stessa azione divisa per la posizione di chi ha agito prima: per esempio fold to steal contro il CO o contro il BTN."],
  ["var", "IP / OOP", "In / Out of Position", "La statistica divisa tra le mani giocate in posizione e fuori posizione."],
  ["var", "SRP · 3BP · 4BP", "Tipo di piatto", "Single raised pot (un solo rilancio preflop), 3-bet pot e 4-bet pot. Le statistiche dopo il flop cambiano molto tra uno e l'altro."],
  ["var", "HU / MW", "Heads-up / Multiway", "La statistica divisa tra piatti con un solo avversario e piatti con due o più."],
  ["var", "Size", "Per size della puntata", "Hand2Note e Holdem Manager 3 dividono molte statistiche per size: fold contro una puntata di 1/3, di 1/2, di 2/3 o del piatto.", "Lo stesso giocatore può foldare poco contro le puntate piccole e tanto contro quelle grandi."],
  ["var", "Popup", "Popup", "La finestra che si apre cliccando sull'HUD: mostra le statistiche dettagliate, con tutte le varianti."],
  ["var", "Colori", "Colori dell'HUD", "Molti HUD colorano i numeri per fascia (per esempio rosso se molto basso, verde se molto alto). Le fasce le decidi tu nelle impostazioni."],
  ["var", "Nota", "Note e tag", "Il segno o il colore che metti su un giocatore per ricordarti cosa hai visto: utile quando le mani sono ancora poche."],
];
UI.statGl = () => `<div class="lx-sg" data-sg><button type="button" class="lx-sg-h" aria-expanded="false" data-sgt><span class="lx-sg-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg></span><span class="lx-sg-t"><b>Glossario delle statistiche</b><small>${SG_STATS.length} statistiche di HM3, PT4 e Hand2Note, divise per street</small></span><span class="lx-sg-go" data-sgl>Apri</span></button><div class="lx-sg-b" data-sgb hidden></div></div>`;
function sgBody() {
  const chips = [["all", "Tutte", "var(--ink2)"], ...SG_CAT].map(([k, n, c], i) => `<button type="button" class="lx-sg-c${i ? "" : " on"}" data-sgc="${k}" aria-pressed="${i ? "false" : "true"}" style="--c:${c}">${n}<i>${k === "all" ? SG_STATS.length : SG_STATS.filter(s => s[0] === k).length}</i></button>`).join("");
  const groups = SG_CAT.map(([k, n, c]) => `<section class="lx-sg-g" data-sgg="${k}" style="--c:${c}"><h5>${n}</h5>${SG_STATS.filter(s => s[0] === k).map(([, ab, nm, d, r]) => `<div class="lx-sg-i" data-sgs="${esc((ab + " " + nm + " " + d + " " + (r || "")).toLowerCase())}"><div class="lx-sg-k"><b>${esc(ab)}</b><small>${esc(nm)}</small></div><p>${esc(d)}</p>${r ? `<p class="lx-sg-r"><span>Come leggerla</span>${esc(r)}</p>` : ""}</div>`).join("")}</section>`).join("");
  return `<div class="lx-sg-tools"><label class="lx-sg-s"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input type="search" placeholder="Cerca: VPIP, fold, river…" aria-label="Cerca una statistica" data-sgq></label><div class="lx-sg-cs" role="group" aria-label="Gruppi">${chips}</div></div><p class="lx-sg-n" data-sgn aria-live="polite">${SG_STATS.length} statistiche</p><div class="lx-sg-l">${groups}<p class="lx-sg-0" data-sg0 hidden>Nessuna statistica trovata. Prova con un'altra parola.</p></div><p class="lx-cap">I nomi cambiano un po' da un tracker all'altro, e ogni statistica esiste in molte varianti (per posizione, per size, per tipo di piatto): qui trovi le famiglie e cosa misurano. Le letture sono indicative e valgono solo con abbastanza mani.</p>`;
}
function sgFilter(box) {
  const q = (box.querySelector("[data-sgq]").value || "").trim().toLowerCase(), cat = (box.querySelector(".lx-sg-c.on") || {}).dataset?.sgc || "all";
  let n = 0;
  box.querySelectorAll(".lx-sg-g").forEach(g => { let m = 0; const okC = cat === "all" || g.dataset.sgg === cat;
    g.querySelectorAll(".lx-sg-i").forEach(it => { const ok = okC && (!q || it.dataset.sgs.includes(q)); it.hidden = !ok; if (ok) m++; }); g.hidden = !m; n += m; });
  box.querySelector("[data-sgn]").textContent = n === 1 ? "1 statistica" : `${n} statistiche`;
  box.querySelector("[data-sg0]").hidden = n > 0;
}
document.addEventListener("click", e => {
  if (!e.target.closest) return;
  const t = e.target.closest("[data-sgt]");
  if (t) { const box = t.closest("[data-sg]"), b = box.querySelector("[data-sgb]"), open = b.hidden;
    if (open && !b.firstChild) b.innerHTML = sgBody();
    b.hidden = !open; box.classList.toggle("on", open); t.setAttribute("aria-expanded", open ? "true" : "false"); t.querySelector("[data-sgl]").textContent = open ? "Chiudi" : "Apri"; return; }
  const c = e.target.closest("[data-sgc]");
  if (c) { const box = c.closest("[data-sg]"); box.querySelectorAll("[data-sgc]").forEach(x => { x.classList.toggle("on", x === c); x.setAttribute("aria-pressed", x === c ? "true" : "false"); }); sgFilter(box); }
});
document.addEventListener("input", e => { if (e.target.matches && e.target.matches("[data-sgq]")) sgFilter(e.target.closest("[data-sg]")); });
