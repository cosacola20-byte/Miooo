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
  ["gen", "PFR", "Preflop Raise", "In quante mani su 100 rilancia preflop: open, iso, 3-bet, 4-bet.", "Quanto rilancia. Se è molto più basso del VPIP, il giocatore fa call e limpa invece di rilanciare."],
  ["gen", "AF", "Aggression Factor", "Puntate e rilanci diviso i call, dopo il flop. È un rapporto, non una percentuale: AF 3 vuol dire tre puntate o rilanci per ogni call.", "Basso (sotto 1,5) è passivo, alto (sopra 3) aggressivo. Non conta i fold."],
  ["gen", "AFq", "Aggression Frequency", "Puntate e rilanci diviso tutte le azioni dopo il flop, fold compresi (check esclusi), in percentuale.", "Più completo dell'AF, perché tiene conto anche dei fold."],
  ["gen", "Agg%", "Postflop Aggression %", "In quante street viste dopo il flop punta o rilancia almeno una volta. Holdem Manager la mostra anche street per street.", "Simile all'AFq, ma conta le street invece delle singole azioni."],
  ["gen", "Saw Flop", "Saw Flop %", "In quante mani su 100 vede il flop.", "Va letta con il VPIP: chi vede molti flop gioca molti piatti dopo il flop, spesso fuori posizione."],
  ["gen", "Fold to Bet", "Fold to Bet (Total)", "Quanto spesso folda quando qualcuno punta, su tutte le street dopo il flop.", "Alto: le puntate funzionano. Basso: punta per valore e bluffa poco."],
  ["gen", "Check-Call", "Check-Call", "Dopo aver fatto check, fa call alla puntata che arriva.", "Tipico dei giocatori passivi: lasciano puntare e fanno call."],
  ["gen", "Check-Fold", "Check-Fold", "Dopo aver fatto check, folda alla puntata che arriva.", "Alto: puntare dopo il suo check rende."],

  /* ---------- risultati ---------- */
  ["ris", "bb/100", "Win Rate (bb/100)", "Quanti big blind vinci o perdi in media ogni 100 mani.", "Il numero che dice se stai vincendo. Servono decine di migliaia di mani perché sia affidabile."],
  ["ris", "EV bb/100", "All-in Adj bb/100 / EV bb/100", "Il winrate tolta la fortuna degli all-in: per ogni all-in conta la tua equity invece del risultato.", "Se è molto sopra il winrate reale sei stato sfortunato, se è sotto fortunato."],
  ["ris", "Vinto", "Net Won / Won $", "Quanto hai vinto o perso in tutto, in euro o in big blind."],
  ["ris", "Linea verde", "Net Won (linea verde)", "Nel grafico dei risultati, la vincita totale."],
  ["ris", "Linea rossa", "Non-Showdown Winnings", "Nel grafico, quanto vinci o perdi nelle mani finite senza showdown: piatti vinti con puntate e piatti lasciati con un fold.", "In salita: vinci tanti piatti senza mostrare. In discesa: foldi spesso dopo aver investito."],
  ["ris", "Linea blu", "Showdown Winnings", "Nel grafico, quanto vinci o perdi nelle mani arrivate allo showdown.", "Ai micro di solito sale: con le mani forti prendi valore."],
  ["ris", "Linea EV", "All-in EV / All-in Adj", "Nel grafico, la linea della vincita tolta la fortuna degli all-in. Il colore cambia da tracker a tracker.", "La distanza dalla linea verde è fortuna o sfortuna."],
  ["ris", "Rake", "Rake Paid / Rake attribuita", "Quanta rake hai pagato. I tracker la dividono tra chi ha messo soldi nel piatto."],
  ["ris", "Dev. std", "Std Dev bb/100", "Quanto oscillano i risultati ogni 100 mani: la misura della varianza.", "Più è alta, più mani servono per capire il tuo vero winrate."],

  /* ---------- preflop ---------- */
  ["pre", "RFI", "Raise First In / Open Raise", "Quanto spesso apre con un rilancio quando prima di lui hanno foldato tutti. Di solito si guarda per posizione: UTG, HJ, CO, BTN, SB.", "Confrontala con le tabelle di open: dice quanto è largo il suo range."],
  ["pre", "Limp", "Open Limp / Limp %", "Quanto spesso entra mettendo solo il big blind quando prima di lui hanno foldato tutti.", "Alto: giocatore debole, da isolare."],
  ["pre", "Limp-Call", "Limp-Call", "Dopo aver limpato, fa call al rilancio di un altro giocatore."],
  ["pre", "Limp-Fold", "Limp-Fold", "Dopo aver limpato, folda al rilancio di un altro giocatore.", "Alto: l'iso raise vince spesso subito."],
  ["pre", "Limp-Raise", "Limp-Raise / Limp-Reraise", "Dopo aver limpato, rilancia quando un altro giocatore rilancia.", "Ai micro è quasi sempre una mano fortissima, come AA o KK."],
  ["pre", "Overlimp", "Overlimp / Limp Behind", "Limpa anche lui dopo che un altro ha già limpato."],
  ["pre", "Iso", "Raise Limpers / Iso Raise", "Rilancia dopo uno o più limper per giocare contro uno solo."],
  ["pre", "Fold to Iso", "Fold to Iso Raise", "Dopo aver limpato, folda all'iso raise. È un altro nome del limp-fold in alcuni tracker."],
  ["pre", "CC", "Cold Call", "Fa call a un rilancio come prima azione volontaria della mano, senza aver ancora messo soldi nel piatto di sua volontà.", "Alto: fa call a molti open invece di 3-bettare, spesso fuori posizione."],
  ["pre", "Call Open", "Call vs RFI / Flat", "Fa call a un open, di solito mostrata per posizione: contro UTG, contro CO, contro BTN."],
  ["pre", "3-bet", "3Bet PF", "Quanto spesso rilancia quando davanti a lui c'è un open: rilanci diviso le occasioni di 3-bet.", "Bassa (sotto 4%): quando 3-betta ha mani forti. Alta (oltre 10%): 3-betta anche per bluff."],
  ["pre", "3-bet IP / OOP", "3Bet PF IP / OOP", "La 3-bet divisa tra in posizione (per esempio dal BTN contro il CO) e fuori posizione (dai bui).", "Molti giocatori 3-bettano di più dai bui e fanno call di più in posizione."],
  ["pre", "Fold to 3-bet", "Fold to 3Bet PF", "Dopo aver aperto, quanto spesso folda alla 3-bet.", "Alto: le 3-bet in bluff contro di lui rendono."],
  ["pre", "Call 3-bet", "Call 3Bet PF", "Dopo aver aperto, quanto spesso fa call alla 3-bet."],
  ["pre", "4-bet", "4Bet PF", "Quanto spesso rilancia una 3-bet.", "Ai micro, se è bassa, la 4-bet è quasi sempre AA, KK o AK."],
  ["pre", "Fold to 4-bet", "Fold to 4Bet PF", "Dopo aver fatto 3-bet, quanto spesso folda alla 4-bet."],
  ["pre", "Call 4-bet", "Call 4Bet PF", "Dopo aver fatto 3-bet, quanto spesso fa call alla 4-bet."],
  ["pre", "5-bet", "5Bet PF", "Quanto spesso rilancia una 4-bet, di solito all-in."],
  ["pre", "Fold to 5-bet", "Fold to 5Bet PF", "Dopo aver fatto 4-bet, quanto spesso folda alla 5-bet."],
  ["pre", "Cold 4-bet", "Cold 4Bet", "Fa 4-bet senza aver messo soldi prima: c'è stato un open, poi una 3-bet, e lui rilancia da dietro.", "Quasi sempre una mano fortissima ai micro."],
  ["pre", "Squeeze", "Squeeze", "Fa 3-bet dopo un open e almeno un call.", "Alta: usa i call degli altri per rubare il piatto."],
  ["pre", "Fold to Squeeze", "Fold to Squeeze", "Dopo aver aperto o fatto call, quanto spesso folda allo squeeze."],
  ["pre", "PF All-in", "Preflop All-in / Open Shove", "Quanto spesso va all-in preflop, per primo o su un rilancio."],

  /* ---------- steal e bui ---------- */
  ["bui", "ATS", "Attempt to Steal / Steal", "Apre da CO, BTN o SB quando prima di lui hanno foldato tutti, per rubare i bui.", "Alta: apre largo in late position, puoi difendere e 3-bettare di più."],
  ["bui", "Steal riuscito", "Steal Success", "In quante occasioni il suo steal vince subito perché foldano tutti."],
  ["bui", "Fold to Steal", "Fold to Steal (SB / BB)", "Dai bui, quanto spesso folda contro uno steal.", "Alta: contro di lui apri più mani da CO e BTN."],
  ["bui", "Call Steal", "Call vs Steal (SB / BB)", "Dai bui, quanto spesso fa call a uno steal."],
  ["bui", "3-bet vs Steal", "3Bet vs Steal / Resteal", "Dai bui, quanto spesso fa 3-bet contro uno steal."],
  ["bui", "Fold to Resteal", "Fold to 3Bet after Steal", "Dopo uno steal, quanto spesso folda alla 3-bet dei bui.", "Alta: 3-bettare contro i suoi steal è molto profittevole."],
  ["bui", "BB Defend", "BB Defend vs Steal", "Dal BB, quanto spesso difende (fa call o rilancia) contro uno steal: il contrario del fold to steal."],
  ["bui", "SB vs BB", "Blind vs Blind", "Le statistiche quando restano solo i due bui: steal dello SB, limp dello SB, fold del BB allo SB, 3-bet del BB contro lo SB.", "Nel blind vs blind i range sono molto larghi: è una situazione a parte."],
  ["bui", "SB Limp", "SB Complete / SB Limp", "Dallo SB, quando prima hanno foldato tutti, completa il big blind invece di rilanciare o foldare."],
  ["bui", "Walk", "Walk", "Mani in cui il BB vince i bui perché tutti foldano prima di lui."],

  /* ---------- flop ---------- */
  ["fl", "CBet", "Flop CBet", "Quanto spesso l'ultimo ad aver rilanciato preflop punta il flop, quando prima di lui nessuno ha puntato.", "Alta: punta molti flop anche senza niente. Bassa: quando punta ha spesso una mano."],
  ["fl", "CBet IP / OOP", "Flop CBet IP / OOP", "La stessa c-bet divisa tra in posizione e fuori posizione.", "Quasi tutti fanno più c-bet in posizione."],
  ["fl", "CBet 3BP", "Flop CBet in 3Bet Pot", "La c-bet al flop nei piatti con 3-bet preflop."],
  ["fl", "CBet MW", "Flop CBet Multiway", "La c-bet al flop contro due o più avversari."],
  ["fl", "Fold to CBet", "Fold to Flop CBet", "Quanto spesso folda alla c-bet del flop.", "Alta: la c-bet contro di lui vince spesso subito. Bassa: punta per valore, bluffa poco."],
  ["fl", "Call CBet", "Call Flop CBet", "Quanto spesso fa call alla c-bet del flop."],
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
  ["tu", "Call Turn CB", "Call Turn CBet", "Quanto spesso fa call alla seconda puntata."],
  ["tu", "Raise Turn CB", "Raise Turn CBet", "Quanto spesso rilancia la puntata del turn.", "Ai micro un raise al turn è quasi sempre una mano molto forte."],
  ["tu", "Fold to Turn Raise", "Fold to Turn Raise", "Dopo aver puntato il turn, quanto spesso folda al rilancio dell'avversario."],
  ["tu", "Delay", "Delayed Turn CBet", "L'aggressore preflop non punta il flop e punta il turn."],
  ["tu", "Fold to Delay", "Fold to Delayed Turn CBet", "Quanto spesso folda alla puntata ritardata del turn."],
  ["tu", "Probe", "Turn Probe", "Il flop è stato checkato da tutti (l'aggressore in posizione non ha fatto c-bet) e lui, fuori posizione, punta per primo il turn."],
  ["tu", "Fold to Probe", "Fold to Turn Probe", "Quanto spesso l'aggressore preflop folda alla probe del turn."],
  ["tu", "Turn Donk", "Turn Donk Bet", "Dopo aver fatto call alla puntata del flop, punta per primo il turn invece di fare check."],
  ["tu", "Turn XR", "Turn Check-Raise", "Check-raise al turn."],
  ["tu", "Fold to Turn XR", "Fold to Turn Check-Raise", "Dopo aver puntato il turn, quanto spesso folda al check-raise."],
  ["tu", "Float", "Turn Bet vs Missed CBet / Float", "Ha fatto call alla c-bet al flop in posizione; al turn l'aggressore fa check e lui punta.", "Alta: fa call al flop per prendersi il piatto al turn quando l'altro rinuncia."],
  ["tu", "Turn AF", "Turn Aggression Factor", "L'aggression factor solo al turn."],
  ["tu", "Turn Agg%", "Turn Aggression %", "In quanti turn visti punta o rilancia."],

  /* ---------- river ---------- */
  ["ri", "CBet River", "River CBet / Triple Barrel", "Dopo aver puntato flop e turn, quanto spesso punta anche il river."],
  ["ri", "Fold to River CB", "Fold to River CBet", "Quanto spesso folda alla terza puntata, al river.", "Ai micro di solito è bassa: chi arriva al river con una coppia fa call."],
  ["ri", "Call River CB", "Call River CBet", "Quanto spesso fa call alla terza puntata."],
  ["ri", "Raise River CB", "Raise River CBet", "Quanto spesso rilancia la puntata del river.", "Ai micro un raise al river è quasi sempre una mano fortissima."],
  ["ri", "River Bet", "River Bet", "Quanto spesso punta il river quando può farlo per primo o quando l'avversario checka."],
  ["ri", "Fold River Bet", "Fold to River Bet", "Quanto spesso folda a una puntata al river, di qualsiasi tipo."],
  ["ri", "River Probe", "River Probe", "Il turn è stato checkato da tutti e lui, fuori posizione, punta per primo il river."],
  ["ri", "River Donk", "River Donk Bet", "Dopo aver fatto call alla puntata del turn, punta per primo il river."],
  ["ri", "River XR", "River Check-Raise", "Check-raise al river.", "Ai micro è quasi sempre valore."],
  ["ri", "River Bet vs Miss", "River Bet vs Missed CBet", "L'aggressore checka il river e lui punta."],
  ["ri", "River AF", "River Aggression Factor", "L'aggression factor solo al river."],
  ["ri", "River Agg%", "River Aggression %", "In quanti river visti punta o rilancia."],

  /* ---------- showdown ---------- */
  ["sd", "WTSD", "Went To ShowDown", "Quante volte, dopo aver visto il flop, arriva allo showdown.", "Alta (oltre 30%): fa call fino in fondo, bluffa poco contro di lui. Bassa: folda spesso prima."],
  ["sd", "W$SD", "Won $ at ShowDown", "Quanti showdown vince.", "Con WTSD alta e W$SD bassa: arriva allo showdown con mani deboli."],
  ["sd", "WWSF", "Won When Saw Flop / W$WSF", "In quante mani vince il piatto quando vede il flop, con o senza showdown.", "Alta: si prende molti piatti con l'aggressività. Bassa: lascia spesso il piatto."],
  ["sd", "W$SD River Call", "Won at SD after River Call", "Quanti showdown vince quando ci arriva facendo call a una puntata al river. Il nome cambia da tracker a tracker.", "Bassa: fa call al river troppo largo. Alta: fa call solo con mani forti."],
  ["sd", "WTSD after CB", "WTSD after Calling Flop CBet", "Quante volte arriva allo showdown dopo aver fatto call alla c-bet al flop.", "Dice se chi fa call al flop poi molla al turn o va fino in fondo."],

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
/* ---------- altre statistiche, una per una ---------- */
SG_STATS.push(
  ["gen", "Fold Turn Bet", "Fold to Turn Bet", "Quanto spesso folda a una puntata al turn, c-bet o no."],
  ["pre", "Call Squeeze", "Call Squeeze", "Dopo aver aperto o fatto call, quanto spesso fa call allo squeeze."],
  ["pre", "4-bet vs Squeeze", "4Bet vs Squeeze", "Dopo aver aperto, quanto spesso rilancia lo squeeze."],
  ["pre", "Fold to Cold 4-bet", "Fold to Cold 4Bet", "Dopo aver fatto 3-bet, quanto spesso folda alla 4-bet di un terzo giocatore."],
  ["pre", "Iso vs 1", "Iso Raise vs 1 Limper", "L'iso raise quando c'è un solo limper."],
  ["pre", "Iso vs 2+", "Iso Raise vs 2+ Limpers", "L'iso raise quando i limper sono due o più."],
  ["pre", "Fold to Iso IP / OOP", "Fold to Iso Raise IP / OOP", "Dopo aver limpato, il fold all'iso raise diviso tra in posizione e fuori posizione."],
  ["pre", "BB Raise vs Limp", "BB Raise vs Limpers", "Dal BB, quanto spesso rilancia quando davanti ci sono solo limper.", "Basso: lascia vedere il flop gratis a tutti."],
  ["bui", "BB Raise vs SB Limp", "BB Raise vs SB Complete", "Quando lo SB limpa, quanto spesso il BB rilancia."],
  ["bui", "BB Check vs SB Limp", "BB Check vs SB Complete", "Quando lo SB limpa, quanto spesso il BB fa check e vede il flop gratis."],
  ["bui", "SB Limp-Fold", "SB Limp-Fold vs BB Raise", "Lo SB limpa, il BB rilancia e lo SB folda."],
  ["bui", "SB Limp-Call", "SB Limp-Call vs BB Raise", "Lo SB limpa, il BB rilancia e lo SB fa call."],
  ["bui", "SB Limp-Raise", "SB Limp-Raise vs BB Raise", "Lo SB limpa, il BB rilancia e lo SB rilancia ancora."],
  ["bui", "BB Fold vs SB Open", "BB Fold to SB Open", "Quanto spesso il BB folda all'open dello SB."],
  ["bui", "BB 3-bet vs SB", "BB 3Bet vs SB Open", "Quanto spesso il BB fa 3-bet contro l'open dello SB."],
  ["bui", "SB Fold to BB 3-bet", "SB Fold to BB 3Bet", "Dopo aver aperto, quanto spesso lo SB folda alla 3-bet del BB."],
  ["bui", "SB 4-bet vs BB", "SB 4Bet vs BB 3Bet", "Dopo aver aperto, quanto spesso lo SB rilancia la 3-bet del BB."],
  ["fl", "Check-Call Flop", "Flop Check-Call", "Al flop fa check e fa call alla puntata che arriva."],
  ["fl", "Check-Fold Flop", "Flop Check-Fold", "Al flop fa check e folda alla puntata che arriva."],
  ["fl", "Call XR", "Call Flop Check-Raise", "Dopo aver puntato, quanto spesso fa call al check-raise."],
  ["fl", "Flop 3-bet", "Flop 3Bet / Reraise", "Rilancia di nuovo al flop dopo che la sua puntata è stata rilanciata.", "Ai micro è quasi sempre una mano fortissima."],
  ["fl", "Fold to Flop 3-bet", "Fold to Flop 3Bet", "Dopo aver rilanciato al flop, quanto spesso folda al nuovo rilancio."],
  ["fl", "Check-back Flop", "Flop Check Behind", "L'aggressore preflop in posizione non fa c-bet e checka anche lui: il contrario della c-bet in posizione."],
  ["fl", "Float Flop", "Float Flop", "Fa call alla c-bet al flop in posizione, spesso con l'idea di prendersi il piatto più avanti."],
  ["fl", "Limped Pot Bet", "Bet Flop in Limped Pot", "Nei piatti senza rilanci preflop, quanto spesso punta il flop quando gli altri hanno fatto check."],
  ["tu", "Check-Call Turn", "Turn Check-Call", "Al turn fa check e fa call alla puntata che arriva."],
  ["tu", "Check-Fold Turn", "Turn Check-Fold", "Al turn fa check e folda alla puntata che arriva."],
  ["tu", "Call Turn XR", "Call Turn Check-Raise", "Dopo aver puntato il turn, quanto spesso fa call al check-raise."],
  ["tu", "Fold to Float", "Fold to Turn Float", "Dopo aver fatto c-bet al flop e check al turn, quanto spesso folda alla puntata dell'avversario."],
  ["tu", "Fold Turn Raise", "Fold to Turn Raise (after Call)", "Dopo aver puntato il turn, quanto spesso folda quando l'avversario rilancia in posizione."],
  ["ri", "Check-Call River", "River Check-Call", "Al river fa check e fa call alla puntata che arriva.", "Alto: fa call al river con le mani medie, punta per valore contro di lui."],
  ["ri", "Check-Fold River", "River Check-Fold", "Al river fa check e folda alla puntata che arriva.", "Alto: al river i bluff contro di lui funzionano."],
  ["ri", "Call River Bet", "Call River Bet", "Quanto spesso fa call a una puntata al river, di qualsiasi tipo."],
  ["ri", "Raise River Bet", "Raise River Bet", "Quanto spesso rilancia una puntata al river."],
  ["ri", "Fold River Raise", "Fold to River Raise", "Dopo aver puntato il river, quanto spesso folda al rilancio."],
  ["ri", "Delay River", "Delayed River CBet", "L'aggressore checka il turn e punta il river."],
  ["ri", "Fold to Delay River", "Fold to Delayed River CBet", "Quanto spesso folda alla puntata ritardata del river."],
  ["sd", "WnSD", "Won Without Showdown", "Quanti piatti vince senza arrivare allo showdown, perché gli altri foldano."],
  ["sd", "WTSD after XR", "WTSD after Flop Check-Raise", "Quante volte arriva allo showdown dopo aver fatto check-raise al flop."],
  ["sd", "W$SD after Raise", "W$SD after Postflop Raise", "Quanti showdown vince dopo aver rilanciato dopo il flop.", "Alta: i suoi rilanci sono quasi sempre valore."],
);
/* ---------- le varianti: la stessa statistica per posizione, per piatto, per size ---------- */
(() => {
  const V = (c, ab, nm, d) => SG_STATS.push([c, ab, nm, d, "", 1]), del = p => (p === "SB" ? "dello " : "del ") + p, dal = p => (p === "SB" ? "Dallo " : "Dal ") + p;
  const P5 = ["UTG", "HJ", "CO", "BTN", "SB"], D5 = ["HJ", "CO", "BTN", "SB", "BB"];
  P5.forEach(p => V("pre", "RFI · " + p, "RFI " + p, `Quanto spesso apre con un rilancio dal posto ${p}, quando prima hanno foldato tutti.`));
  P5.forEach(p => V("pre", "Limp · " + p, "Open Limp " + p, `Quanto spesso entra limpando dal posto ${p}, quando prima hanno foldato tutti.`));
  D5.forEach(p => V("pre", "Iso · " + p, "Iso Raise " + p, `L'iso raise fatto dal posto ${p}.`));
  D5.forEach(p => V("pre", "Cold Call · " + p, "Cold Call " + p, `Quanto spesso fa call a un open dal posto ${p}.`));
  D5.forEach(p => V("pre", "3-bet · " + p, "3Bet PF " + p, `La 3-bet fatta dal posto ${p}.`));
  P5.forEach(p => V("pre", "3-bet vs " + p, "3Bet vs " + p + " Open", `Quanto spesso fa 3-bet contro un open ${del(p)}.`));
  P5.forEach(p => V("pre", "Fold to 3-bet · " + p, "Fold to 3Bet " + p, `Dopo aver aperto dal posto ${p}, quanto spesso folda alla 3-bet.`));
  P5.forEach(p => V("pre", "Call 3-bet · " + p, "Call 3Bet " + p, `Dopo aver aperto dal posto ${p}, quanto spesso fa call alla 3-bet.`));
  P5.forEach(p => V("pre", "4-bet · " + p, "4Bet " + p, `Dopo aver aperto dal posto ${p}, quanto spesso rilancia la 3-bet.`));
  [["IP", "in posizione"], ["OOP", "fuori posizione"]].forEach(([k, t]) => {
    V("pre", "Fold to 3-bet · " + k, "Fold to 3Bet " + k, `Dopo aver aperto, il fold alla 3-bet quando giocherà il piatto ${t}.`);
    V("pre", "4-bet · " + k, "4Bet " + k, `La 4-bet quando giocherà il piatto ${t}.`);
    V("pre", "Fold to 4-bet · " + k, "Fold to 4Bet " + k, `Dopo aver fatto 3-bet, il fold alla 4-bet quando giocherà il piatto ${t}.`);
  });
  ["CO", "BTN", "SB", "BB"].forEach(p => V("pre", "Squeeze · " + p, "Squeeze " + p, `Lo squeeze fatto dal posto ${p}.`));
  ["CO", "BTN", "SB"].forEach(p => V("bui", "Steal · " + p, "Attempt to Steal " + p, `Lo steal dal posto ${p}: apre quando prima hanno foldato tutti.`));
  [["BB", "CO"], ["BB", "BTN"], ["BB", "SB"], ["SB", "CO"], ["SB", "BTN"]].forEach(([a, b]) => {
    V("bui", `Fold to Steal · ${a} vs ${b}`, `${a} Fold vs ${b} Steal`, `${dal(a)}, quanto spesso folda contro lo steal ${del(b)}.`);
    V("bui", `Call Steal · ${a} vs ${b}`, `${a} Call vs ${b} Steal`, `${dal(a)}, quanto spesso fa call allo steal ${del(b)}.`);
    V("bui", `3-bet vs Steal · ${a} vs ${b}`, `${a} 3Bet vs ${b} Steal`, `${dal(a)}, quanto spesso fa 3-bet contro lo steal ${del(b)}.`);
  });
  ["CO", "BTN", "SB"].forEach(p => V("bui", "Fold to Resteal · " + p, "Fold to Resteal " + p, `Dopo uno steal dal posto ${p}, quanto spesso folda alla 3-bet dei bui.`));
  ["UTG", "HJ", "CO", "BTN", "SB", "BB"].forEach(p => V("ris", "bb/100 · " + p, "Win Rate " + p, `Il winrate delle mani giocate dal posto ${p}.`));
  /* dopo il flop: c-bet e risposte, per street, tipo di piatto e posizione */
  const ST = [["fl", "Flop", "al flop"], ["tu", "Turn", "al turn"], ["ri", "River", "al river"]];
  const POT = [["SRP", "nei piatti con un solo rilancio preflop"], ["3BP", "nei piatti con 3-bet"], ["4BP", "nei piatti con 4-bet"]];
  const SIDE = [["IP", "in posizione"], ["OOP", "fuori posizione"]];
  const ACT = [["CBet", "CBet", "la c-bet"], ["Fold to CBet", "Fold to CBet", "il fold alla c-bet"], ["Call CBet", "Call CBet", "il call della c-bet"], ["Raise CBet", "Raise CBet", "il rilancio della c-bet"]];
  ST.forEach(([c, sN, sT]) => ACT.forEach(([ab, en, it]) => POT.forEach(([pk, pt]) => SIDE.forEach(([ik, itx]) =>
    V(c, `${ab} ${sN} · ${pk} · ${ik}`, `${sN} ${en} ${pk} ${ik}`, `${it[0].toUpperCase() + it.slice(1)} ${sT}, ${pt}, quando è ${itx}.`)))));
  [["HU", "contro un solo avversario"], ["MW", "contro due o più avversari"]].forEach(([k, t]) => ACT.forEach(([ab, en, it]) =>
    V("fl", `${ab} Flop · ${k}`, `Flop ${en} ${k}`, `${it[0].toUpperCase() + it.slice(1)} al flop ${t}.`)));
  const SZ = [["≤ 1/3", "fino a un terzo del piatto"], ["1/3-1/2", "tra un terzo e metà piatto"], ["1/2-2/3", "tra metà e due terzi del piatto"], ["2/3-piatto", "tra due terzi e tutto il piatto"], ["Overbet", "più grande del piatto"]];
  ST.forEach(([c, sN, sT]) => SZ.forEach(([k, t]) => {
    V(c, `Fold to CBet ${sN} · ${k}`, `Fold to ${sN} CBet by Size ${k}`, `Il fold alla c-bet ${sT} quando la puntata è ${t}.`);
    V(c, `CBet ${sN} · size ${k}`, `${sN} CBet Size ${k}`, `Quante delle sue c-bet ${sT} sono ${t}.`);
  }));
  ST.forEach(([c, sN, sT]) => POT.slice(0, 2).forEach(([pk, pt]) => {
    V(c, `XR ${sN} · ${pk}`, `${sN} Check-Raise ${pk}`, `Il check-raise ${sT}, ${pt}.`);
    V(c, `Fold to XR ${sN} · ${pk}`, `Fold to ${sN} Check-Raise ${pk}`, `Il fold al check-raise ${sT}, ${pt}.`);
    V(c, `Donk ${sN} · ${pk}`, `${sN} Donk Bet ${pk}`, `La donk bet ${sT}, ${pt}.`);
    V(c, `Fold to Donk ${sN} · ${pk}`, `Fold to ${sN} Donk ${pk}`, `Il fold alla donk bet ${sT}, ${pt}.`);
    V(c, `Bet vs Miss ${sN} · ${pk}`, `${sN} Bet vs Missed CBet ${pk}`, `La puntata ${sT} quando l'aggressore rinuncia alla c-bet, ${pt}.`);
    V(c, `Fold vs Miss ${sN} · ${pk}`, `Fold to ${sN} Bet vs Missed CBet ${pk}`, `Il fold ${sT} dopo aver rinunciato alla c-bet, ${pt}.`);
  }));
  ST.slice(1).forEach(([c, sN, sT]) => POT.slice(0, 2).forEach(([pk, pt]) => {
    V(c, `Probe ${sN} · ${pk}`, `${sN} Probe ${pk}`, `La probe ${sT}, ${pt}.`);
    V(c, `Fold to Probe ${sN} · ${pk}`, `Fold to ${sN} Probe ${pk}`, `Il fold alla probe ${sT}, ${pt}.`);
    SIDE.forEach(([ik, itx]) => {
      V(c, `Delay ${sN} · ${pk} · ${ik}`, `Delayed ${sN} CBet ${pk} ${ik}`, `La c-bet ritardata ${sT}, ${pt}, quando è ${itx}.`);
      V(c, `Fold to Delay ${sN} · ${pk} · ${ik}`, `Fold to Delayed ${sN} CBet ${pk} ${ik}`, `Il fold alla c-bet ritardata ${sT}, ${pt}, quando è ${itx}.`);
    });
  }));
  ST.forEach(([c, sN, sT]) => SIDE.forEach(([ik, itx]) => {
    V(c, `${sN} Agg% · ${ik}`, `${sN} Aggression % ${ik}`, `In quanti ${sN.toLowerCase()} visti ${itx} punta o rilancia.`);
    V(c, `Fold ${sN} Bet · ${ik}`, `Fold to ${sN} Bet ${ik}`, `Il fold a una puntata ${sT}, quando è ${itx}.`);
  }));
  ["UTG", "HJ", "CO", "BTN", "SB", "BB"].forEach(p => { V("sd", "WTSD · " + p, "WTSD " + p, `La WTSD delle mani giocate dal posto ${p}.`); V("sd", "W$SD · " + p, "W$SD " + p, `La W$SD delle mani giocate dal posto ${p}.`); });
})();

UI.statGl = () => `<div class="lx-sg" data-sg><button type="button" class="lx-sg-h" aria-expanded="false" data-sgt><span class="lx-sg-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg></span><span class="lx-sg-t"><b>Glossario delle statistiche</b><small>${SG_STATS.length} statistiche di HM3, PT4 e Hand2Note, con le varianti per posizione, piatto e size</small></span><span class="lx-sg-go" data-sgl>Apri</span></button><div class="lx-sg-b" data-sgb hidden></div></div>`;
function sgBody() {
  const chips = [["all", "Tutte", "var(--ink2)"], ...SG_CAT].map(([k, n, c], i) => `<button type="button" class="lx-sg-c${i ? "" : " on"}" data-sgc="${k}" aria-pressed="${i ? "false" : "true"}" style="--c:${c}">${n}<i>${k === "all" ? SG_STATS.length : SG_STATS.filter(s => s[0] === k).length}</i></button>`).join("");
  const groups = SG_CAT.map(([k, n, c]) => `<section class="lx-sg-g" data-sgg="${k}" style="--c:${c}"><h5>${n}</h5>${SG_STATS.filter(s => s[0] === k).map(([, ab, nm, d, r, v]) => `<div class="lx-sg-i${v ? " v" : ""}" data-sgs="${esc((ab + " " + nm + " " + d + " " + (r || "")).toLowerCase())}"><div class="lx-sg-k"><b>${esc(ab)}</b><small>${esc(nm)}</small></div><p>${esc(d)}</p>${r ? `<p class="lx-sg-r"><span>Come leggerla</span>${esc(r)}</p>` : ""}</div>`).join("")}</section>`).join("");
  return `<div class="lx-sg-tools"><label class="lx-sg-s"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input type="search" placeholder="Cerca: VPIP, fold, river…" aria-label="Cerca una statistica" data-sgq></label><div class="lx-sg-cs" role="group" aria-label="Gruppi">${chips}</div><label class="lx-sg-v"><input type="checkbox" data-sgv checked><span></span>Mostra anche le varianti (per posizione, tipo di piatto, size)</label></div><p class="lx-sg-n" data-sgn aria-live="polite">${SG_STATS.length} statistiche</p><div class="lx-sg-l">${groups}<p class="lx-sg-0" data-sg0 hidden>Nessuna statistica trovata. Prova con un'altra parola.</p></div><button type="button" class="lx-sg-end" data-sgx>Chiudi il glossario</button><p class="lx-cap">I nomi cambiano un po' da un tracker all'altro, e ogni statistica esiste in molte varianti (per posizione, per size, per tipo di piatto): qui trovi le famiglie e cosa misurano. Le letture sono indicative e valgono solo con abbastanza mani.</p>`;
}
function sgFilter(box) {
  const q = (box.querySelector("[data-sgq]").value || "").trim().toLowerCase(), va = box.querySelector("[data-sgv]").checked, cat = (box.querySelector(".lx-sg-c.on") || {}).dataset?.sgc || "all";
  let n = 0;
  box.querySelectorAll(".lx-sg-g").forEach(g => { let m = 0; const okC = cat === "all" || g.dataset.sgg === cat;
    g.querySelectorAll(".lx-sg-i").forEach(it => { const ok = okC && (va || !it.classList.contains("v")) && (!q || it.dataset.sgs.includes(q)); it.hidden = !ok; if (ok) m++; }); g.hidden = !m; n += m; });
  box.querySelector("[data-sgn]").textContent = n === 1 ? "1 statistica" : `${n} statistiche`;
  box.querySelector("[data-sg0]").hidden = n > 0;
}
document.addEventListener("click", e => {
  if (!e.target.closest) return;
  const x = e.target.closest("[data-sgx]");
  const t = x ? x.closest("[data-sg]").querySelector("[data-sgt]") : e.target.closest("[data-sgt]");
  if (t) { const box = t.closest("[data-sg]"), b = box.querySelector("[data-sgb]"), open = b.hidden;
    if (open && !b.firstChild) b.innerHTML = sgBody();
    b.hidden = !open; box.classList.toggle("on", open); t.setAttribute("aria-expanded", open ? "true" : "false"); t.querySelector("[data-sgl]").textContent = open ? "Chiudi" : "Apri";
    if (!open && box.getBoundingClientRect().top < 0) box.scrollIntoView({ block: "start", behavior: typeof calmMotion === "function" && calmMotion() ? "auto" : "smooth" });
    return; }
  const c = e.target.closest("[data-sgc]");
  if (c) { const box = c.closest("[data-sg]"); box.querySelectorAll("[data-sgc]").forEach(x => { x.classList.toggle("on", x === c); x.setAttribute("aria-pressed", x === c ? "true" : "false"); }); sgFilter(box); }
});
document.addEventListener("change", e => { if (e.target.matches && e.target.matches("[data-sgv]")) sgFilter(e.target.closest("[data-sg]")); });
document.addEventListener("input", e => { if (e.target.matches && e.target.matches("[data-sgq]")) sgFilter(e.target.closest("[data-sg]")); });

/* ================= HUD DI PROVA CON POPUP (UI.hudPop) =================
   Un HUD su tre righe sopra un avversario. Ogni numero apre il suo popup: il dettaglio di quella statistica
   (per posizione, in posizione o no, per street, per size). Ogni riga ha accanto le occasioni:
   sotto le 20 è segnata come poco affidabile. Righe: [nome, valore, occasioni, barra 0-100 o null]. */
const HP = {
  vpip: ["VPIP", 41, 312, "hi", "Quanto gioca, posto per posto", [["UTG", 28, 52], ["HJ", 33, 52], ["CO", 39, 52], ["BTN", 48, 52], ["SB", 46, 52], ["BB", 52, 52], ["Entra con un open limp", 18, 140], ["Cold call (call di un open)", 22, 95]], "Gioca troppe mani da ogni posto: anche da UTG entra quasi 3 volte su 10. La differenza con il PFR dice che entra soprattutto limpando o facendo call."],
  pfr: ["PFR", 9, 312, "lo", "Quanto rilancia, posto per posto", [["UTG", 6, 52], ["HJ", 7, 52], ["CO", 9, 52], ["BTN", 14, 52], ["SB", 10, 52], ["BB", 8, 52], ["Open raise · UTG", 8, 12], ["Open raise · BTN", 24, 21]], "Rilancia poco ovunque: quando apre dai primi posti ha quasi sempre una mano forte. Con VPIP 41 e PFR 9 è il profilo del fish passivo."],
  mani: ["Mani", 312, null, "", "Quante mani hai giocato con lui", [["Da UTG", "52", null], ["Da HJ", "52", null], ["Da CO", "52", null], ["Dal BTN", "52", null], ["Dallo SB", "52", null], ["Dal BB", "52", null], ["Sessioni insieme", "4", null]], "312 mani bastano per VPIP e PFR, non per le statistiche più rare: per quelle guarda sempre le occasioni nel loro popup."],
  "3b": ["3-bet", 3, 104, "lo", "Quanto rilancia un open", [["Dal CO", 2, 15], ["Dal BTN", 3, 18], ["Dallo SB", 4, 22], ["Dal BB", 3, 37], ["Contro un open da UTG o HJ", 1, 31], ["Contro un open da CO o BTN", 4, 52], ["In posizione", 2, 38], ["Fuori posizione", 4, 66]], "3-betta pochissimo: ai micro una 3-bet così rara è quasi sempre QQ+ o AK. Contro la sua 3-bet folda le mani medie."],
  f3b: ["Fold to 3-bet", 45, 11, "", "Cosa fa quando gli rilanciano l'open", [["Fold", 45, 11], ["Call", 55, 11], ["4-bet", 0, 11], ["Dopo un open da UTG o HJ", 50, 4], ["Dopo un open da CO o BTN", 43, 7], ["In posizione", 40, 5], ["Fuori posizione", 50, 6]], "Undici occasioni sono troppo poche: il 45% può essere 25% o 65%. Servono almeno 30 o 40 occasioni prima di 3-bettarlo in bluff."],
  ats: ["Steal", 21, 34, "lo", "Quanto apre da CO, BTN e SB", [["Dal CO", 15, 13], ["Dal BTN", 26, 12], ["Dallo SB", 22, 9], ["Steal riuscito: foldano tutti", 35, 34], ["Folda alla 3-bet dei bui", 50, 4], ["Dallo SB, limp invece di rilanciare", 41, 22]], "Ruba poco per uno che gioca il 41% delle mani: dal BTN preferisce limpare o fare call. Quando apre da CO o BTN il suo range è più forte del solito."],
  cb: ["C-bet", 61, 38, "", "Quanto punta dopo aver rilanciato preflop", [["Flop", 61, 38], ["Flop · in posizione", 68, 22], ["Flop · fuori posizione", 50, 16], ["Flop · contro due o più", 44, 9], ["Turn (secondo colpo)", 42, 19], ["River (terzo colpo)", 35, 8], ["Size media al flop: 55% del piatto", null, 38]], "Punta il flop spesso, il turn molto meno: se fai call al flop, al turn spesso rinuncia e il piatto può essere tuo."],
  fcb: ["Fold to c-bet", 38, 52, "", "Cosa fa contro la c-bet", [["Fold al flop", 38, 52], ["Call al flop", 56, 52], ["Raise al flop", 6, 52], ["Folda in posizione", 33, 21], ["Folda fuori posizione", 42, 31], ["Folda a una c-bet fino a 1/3", 30, 20], ["Folda a una c-bet da 2/3 o più", 52, 14], ["Folda al turn", 33, 24], ["Folda al river", 22, 14]], "Contro le c-bet piccole folda poco: il bluff piccolo rende poco, la value bet anche con mani medie sì. Folda di più solo contro le puntate grandi."],
  wtsd: ["WTSD", 34, 98, "hi", "Quanto arriva allo showdown dopo il flop", [["Arriva allo showdown", 34, 98], ["Vince allo showdown (W$SD)", 47, 33], ["Vince il piatto quando vede il flop (WWSF)", 41, 98], ["Arriva allo showdown dopo aver fatto call alla c-bet", 52, 29], ["Vince dopo aver fatto call al river", 40, 15]], "Arriva spesso allo showdown e vince meno della metà delle volte: fa call con mani deboli. Contro di lui value bet sottili e pochi bluff."],
};
const HP_ROWS = [["vpip", "pfr", "mani"], ["3b", "f3b", "ats"], ["cb", "fcb", "wtsd"]], HP_AB = { vpip: "VPIP", pfr: "PFR", mani: "Mani", "3b": "3B", f3b: "F3B", ats: "ATS", cb: "CB", fcb: "FCB", wtsd: "WTSD" };
const hpPop = k => { const [n, v, occ, , sub, rows, read] = HP[k];
  return `<div class="lx-hp-top"><b>${n} · ${v}${occ ? "%" : ""}${occ ? ` <small>(${occ})</small>` : ""}</b><button type="button" data-hpx aria-label="Chiudi il popup">✕</button></div><p class="lx-hp-sub">${sub}</p>
  <div class="lx-hp-rows">${rows.map(([l, x, o]) => { const num = typeof x === "number"; return `<div class="lx-hp-r${o != null && o < 20 ? " few" : ""}${num ? "" : " nb"}"><span>${l}</span>${num ? `<i style="--w:${x}%"></i><b>${x}%</b>` : `<i class="no"></i><b>${x == null ? "" : x}</b>`}<small>${o != null ? `(${o})` : ""}</small></div>`; }).join("")}</div>
  <p class="lx-hp-read"><span>Come leggerlo</span>${read}</p><p class="lx-hp-note"><i></i>Tra parentesi le occasioni. In grigio quelle sotto le 20: sono solo indizi.</p>`; };
UI.hudPop = () => `<div class="lx-hp" data-hp><div class="lx-hp-felt"><div class="lx-hp-seat"><div class="lx-hp-hud" role="group" aria-label="HUD dell'avversario: tocca un numero">${HP_ROWS.map(r => `<span class="row">${r.map(k => `<button type="button" class="${HP[k][3]}" data-hpk="${k}" aria-expanded="false"><b>${HP[k][1]}</b><small>${HP_AB[k]}</small></button>`).join("")}</span>`).join("")}</div><span class="lx-hp-av">Il vicino</span><span class="lx-hp-tap" aria-hidden="true">Tocca un numero</span></div></div>
  <div class="lx-hp-pop" data-hpp hidden></div>
  <p class="lx-hp-leg"><span class="hi">verde</span> molto alto <span class="lo">rosso</span> molto basso <span>bianco</span> nella media</p></div>`;
document.addEventListener("click", e => {
  if (!e.target.closest) return;
  const k = e.target.closest("[data-hpk]"), x = e.target.closest("[data-hpx]");
  if (!k && !x) return;
  const box = (k || x).closest("[data-hp]"), p = box.querySelector("[data-hpp]"), same = k && box.dataset.cur === k.dataset.hpk && !p.hidden, open = k && !same;
  box.querySelectorAll("[data-hpk]").forEach(b => { const on = open && b === k; b.classList.toggle("sel", on); b.setAttribute("aria-expanded", on ? "true" : "false"); });
  if (open) { p.innerHTML = hpPop(k.dataset.hpk); box.dataset.cur = k.dataset.hpk; }
  p.hidden = !open; box.classList.toggle("on", !!open);
});

/* ================= GRAFICO DEI RISULTATI DI UN TRACKER (UI.trkGraph) =================
   40.000 mani di un giocatore vincente: linea verde (vinto), blu (showdown), rossa (senza showdown),
   arancio (EV degli all-in). I numeri del testo vengono dagli stessi punti: verde +2.000bb (+5 bb/100),
   blu +4.800bb, rossa −2.800bb, EV +1.400bb, downswing di 900bb tra le mani 14.000 e 22.000. */
const TG = (() => {
  let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647 - 0.5;
  const lerp = (pts, x) => { for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [a, b] = [pts[i - 1], pts[i]]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return pts[pts.length - 1][1]; };
  const NET = [[0, 0], [6000, 420], [14000, 1150], [22000, 250], [30000, 1150], [40000, 2000]], EV = [[0, 0], [14000, 560], [22000, 330], [40000, 1400]];
  const X = [], net = [], ev = [], nsd = [], sdl = [];
  for (let h = 0; h <= 40000; h += 500) { const end = [0, 14000, 22000, 40000].includes(h); X.push(h);
    const n = lerp(NET, h) + (end ? 0 : rnd() * 90), e = lerp(EV, h) + (end ? 0 : rnd() * 30), r = -0.07 * h + (end ? 0 : rnd() * 70);
    net.push(n); ev.push(e); nsd.push(r); sdl.push(n - r); }
  return { X, net, ev, nsd, sd: sdl };
})();
const TG_L = [["net", "Vinto", "#22a86a"], ["sd", "Showdown", "#2f7de1"], ["nsd", "Senza showdown", "#e04848"], ["ev", "EV all-in", "#ef9a2a"]];
const TG_TXT = {
  net: "<b>La linea verde è quanto hai vinto davvero</b>: qui +2.000bb in 40.000 mani, cioè +5 bb/100. È la somma della linea blu e della linea rossa.",
  sd: "<b>La linea blu sono le mani arrivate allo showdown</b>: quasi sempre sale, perché allo showdown arrivi spesso con mani forti. Qui +4.800bb, cioè +12 bb/100.",
  nsd: "<b>La linea rossa sono le mani finite senza showdown</b>: piatti vinti con le puntate e piatti lasciati con un fold, compresi i bui che perdi quando foldi da SB e BB. Ai micro di solito scende un po': qui −2.800bb, −7 bb/100. Se scende molto ripida foldi troppo dopo aver messo soldi nel piatto; se sale vinci tanti piatti con l'aggressività.",
  ev: "<b>La linea arancio è la vincita tolta la fortuna degli all-in</b>: per ogni all-in conta la tua equity invece del risultato. Qui la verde finisce 600bb sopra: con gli all-in sei stato fortunato. Il tuo livello vero è più vicino all'arancio, +3,5 bb/100.",
  dw: "<b>Il downswing</b>: tra le mani 14.000 e 22.000 la linea verde perde 900bb, nove buy-in, anche se il giocatore è vincente. L'arancio nello stesso tratto scende poco: gran parte del calo è sfortuna agli all-in. Capita a tutti: guarda l'EV e il numero di mani prima di cambiare strategia.",
};
function tgSvg(sel) {
  const W = 600, H = 300, L = 74, R = 30, T = 14, B = 30, y0 = -3200, y1 = 5200, xs = x => L + x / 40000 * (W - L - R), ys = y => T + (y1 - y) / (y1 - y0) * (H - T - B);
  const grid = [-2000, 0, 2000, 4000].map(v => `<line x1="${L}" x2="${W - R}" y1="${ys(v)}" y2="${ys(v)}" class="${v ? "g" : "z"}"/><text x="${L - 6}" y="${ys(v) + 4}" class="yl">${v > 0 ? "+" : ""}${v.toLocaleString("it-IT")}</text>`).join("");
  const xt = [0, 10000, 20000, 30000, 40000].map(v => `<text x="${xs(v)}" y="${H - 9}" class="xl${v === 40000 ? " e" : ""}">${v.toLocaleString("it-IT")}</text>`).join("");
  const dw = `<rect x="${xs(14000)}" y="${T}" width="${xs(22000) - xs(14000)}" height="${H - T - B}" class="dw${sel === "dw" ? " on" : ""}"/>`;
  const lines = TG_L.map(([k, , c]) => `<path d="${TG[k].map((v, i) => (i ? "L" : "M") + xs(TG.X[i]).toFixed(1) + " " + ys(v).toFixed(1)).join("")}" stroke="${c}" class="ln${sel === k || (sel === "dw" && (k === "net" || k === "ev")) ? " on" : ""}"/>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="lx-tg-svg" role="img" aria-label="Grafico dei risultati su 40.000 mani: vinto +2.000bb, showdown +4.800bb, senza showdown −2.800bb, EV all-in +1.400bb">${grid}${dw}${xt}<text x="${W - R}" y="${T + 10}" class="ax">bb vinti</text>${lines}</svg>`;
}
UI.trkGraph = () => `<div class="lx-tg" data-tg><div class="lx-tg-c">${tgSvg("net")}</div><p class="lx-tg-x">mani giocate</p><div class="lx-tg-b" role="group" aria-label="Cosa guardare">${[...TG_L, ["dw", "Downswing", "#7d8790"]].map(([k, n, c], i) => `<button type="button" class="${i ? "" : "on"}" aria-pressed="${i ? "false" : "true"}" data-tgk="${k}" style="--c:${c}"><i></i>${n}</button>`).join("")}</div><p class="lx-tg-t" data-tgt aria-live="polite">${TG_TXT.net}</p></div>`;
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-tgk]"); if (!b) return;
  const box = b.closest("[data-tg]"), k = b.dataset.tgk;
  box.querySelectorAll("[data-tgk]").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
  box.querySelector(".lx-tg-c").innerHTML = tgSvg(k); box.querySelector("[data-tgt]").innerHTML = TG_TXT[k];
});

/* ================= GLI SCOPI DI UNA PUNTATA (UI.betWhy) =================
   Otto scopi, ognuno legato alle due domande della lezione: Domanda 1 (valore), Domanda 2 (fold), tutte e due, o altro.
   Si sceglie uno scopo e sotto compaiono obiettivo, quando, esempio con le carte e cosa conta a NL2. */
const BW = [
  ["value", "Value bet", "Domanda 1", "v", "Ricevere call da mani peggiori della tua.", "Batti buona parte delle mani con cui l'avversario fa call. Al river serve vincere più di metà delle volte in cui ricevi call.", ["7♠7♦", "K♣7♥2♦", "Set su un board secco: fanno call i re e le coppie."], "È la puntata che fa guadagnare di più, soprattutto contro chi fa call troppo spesso."],
  ["bluff", "Bluff", "Domanda 2", "b", "Far foldare mani migliori della tua.", "Allo showdown perderesti quasi sempre, ma l'avversario può foldare le sue mani migliori.", ["J♠10♦", "K♠Q♠7♥4♦2♣", "Scala mancata al river: con J alto non vinci allo showdown."], "Funziona solo se l'avversario folda abbastanza spesso: più è grande la puntata, più spesso deve foldare. Contro chi fa sempre call, niente bluff."],
  ["semi", "Semi-bluff", "Domanda 2 + piano B", "s", "Far foldare subito, con buone carte per vincere dopo.", "Hai un progetto, colore o scala, e l'avversario può foldare.", ["A♥5♥", "Q♥7♥3♣", "Progetto colore al flop: se fa call, il colore entra circa una volta su tre."], "Lo hai visto nella sezione 4: somma i due modi di vincere."],
  ["prot", "Protezione", "Tutte e due", "y", "Prendere valore e non regalare carte che possono superarti.", "Adesso sei avanti, ma tante carte al turn e al river ti mettono in difficoltà.", ["9♠9♣", "8♥2♦2♣", "Coppia sopra il board: ogni carta alta al turn o al river ti fa paura, e dopo ricevi call di rado."], "Se l'avversario folda una mano che ti batterebbe 1 volta su 5, passi dal vincere l'80% del piatto al 100%."],
  ["neg", "Negazione dell'equity", "Domanda 2, in piccolo", "t", "Non lasciare carte gratis alle mani che non hanno colpito.", "Hai una mano media, non sai se sei avanti, e tante mani dell'avversario migliorano facilmente.", ["4♠4♣", "10♥2♦2♣", "Una puntata piccola fa foldare K-Q, K-J, Q-J e mani come 8-7 o 7-6: con due carte gratis ti supererebbero spesso."], "A differenza della protezione non sai di essere avanti: punti piccolo per togliere carte gratis."],
  ["block", "Blocking bet", "Fuori posizione", "c", "Decidere tu quanto si mette nel piatto.", "Sei fuori posizione e temi una puntata grande dell'avversario, a cui non vorresti fare call.", ["2♠2♣", "J♦10♣9♠8♥2♥", "Tris di 2 su un board da scala: con 1/3 del piatto prendi valore dalle doppie coppie, che dopo un tuo check non punterebbero per paura della scala."], "Livello più alto: a NL2 i giocatori passivi raramente ti costringono a usarla."],
  ["merge", "Merging", "Tutte e due", "o", "Con la stessa puntata far foldare mani migliori e ricevere call da mani peggiori.", "Hai una mano media, in mezzo al range dell'avversario.", ["K♠K♣", "A♥J♣3♦", "Un asso debole può foldare, Q-J può fare call: la puntata serve a tutte e due le cose."], "Livello più alto: serve conoscere bene i range dell'avversario."],
  ["bal", "Bilanciamento", "Teoria (GTO)", "n", "Rendere le tue puntate difficili da leggere.", "Nella strategia d'equilibrio ogni size contiene mani forti e bluff nella giusta proporzione, così l'avversario non sa cosa fare.", null, "A NL2 conta poco: gli avversari non studiano le tue puntate. Conta di più sfruttare i loro errori, come in «Chi paga e chi folda»."],
];
const bwOut = k => { const [, n, tag, tn, goal, when, ex, nl2] = BW.find(b => b[0] === k);
  return `<div class="lx-bw-h"><b>${n}</b><span class="lx-bw-tag" data-t="${tn}">${tag}</span></div>
    <div class="lx-bw-r"><small>Obiettivo</small><p>${goal}</p></div><div class="lx-bw-r"><small>Quando</small><p>${when}</p></div>
    ${ex ? `<div class="lx-bw-r"><small>Esempio</small><p><span class="lx-bw-cards">${UI.c(ex[0])}<i>su</i>${UI.c(ex[1])}</span>${ex[2]}</p></div>` : ""}
    <div class="lx-bw-r nl"><small>A NL2</small><p>${nl2}</p></div>`; };
UI.betWhy = () => `<div class="lx-bw" data-bw><div class="lx-bw-b" role="group" aria-label="Scopo della puntata">${BW.map(([k, n, , tn], i) => `<button type="button" class="${i ? "" : "on"}" data-bwk="${k}" data-t="${tn}" aria-pressed="${i ? "false" : "true"}">${n}</button>`).join("")}</div><div class="lx-bw-o" data-bwo aria-live="polite">${bwOut("value")}</div></div>`;
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-bwk]"); if (!b) return;
  const box = b.closest("[data-bw]"); box.querySelectorAll("[data-bwk]").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
  const o = box.querySelector("[data-bwo]"); o.innerHTML = bwOut(b.dataset.bwk); o.classList.remove("in"); void o.offsetWidth; o.classList.add("in");
});
