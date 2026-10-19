/* ================= CARRIERA: da NL2 a NL1000 ================= */
/* le sessioni del vecchio programma tengono il loro id (così i progressi restano), le nuove partono da 101 */
const WS = (wi, si, t) => ({ ...WEEKS[wi].s[si], id: wi * 5 + si + 1, ...(t ? { t } : {}) });
const LEVELS = [
  { id: "nl2", stake: "NL2", col: "#e9ecef", ink: "#1b1b1b", t: "Le basi che fanno vincere", d: "Prima la fase 0 con le regole, saltabile con il test d'ingresso. Poi perché si gioca, fortuna e varianza, posizione, limper e giocatori deboli. Niente conti: solo le basi giuste, una lezione alla volta.",
    learn: ["Le regole in 5 lezioni, saltabili con il test d'ingresso", "Perché si vince: il vantaggio piccolo e ripetuto", "Fortuna, varianza e falsi miti", "Posizione, limper e giocatori deboli"],
    study: ["Nello Study apri BTN e BB: guarda come cambia l'open range", "Allenati: 20 mani su un flop BTN vs BB in modalità Semplice"],
    s: [{ id: 231, t: "Il gioco in 5 minuti", skip: true, zero: true, f0: true, plan: [["lez", 8, { id: "rules" }]] },
      { id: 220, t: "I punti del poker: dalla carta alta alla scala reale", skip: true, zero: true, f0: true, plan: [["lez", 8, { id: "hands" }], ["best", 5], ["strongest", 5, { mode: "A", st: "river" }]] },
      { id: 204, t: "Il tavolo 6-max", skip: true, zero: true, f0: true, plan: [["lez", 8, { id: "cash" }], ["seat", 6]] },
      { id: 232, t: "Come si gioca una mano", skip: true, zero: true, f0: true, plan: [["lez", 8, { id: "flow" }], ["seat", 5]] },
      { id: 233, t: "Leggere una mano scritta", skip: true, zero: true, f0: true, plan: [["lez", 8, { id: "notation" }]] },
      { id: 201, t: "Perché giocare: il vantaggio piccolo e ripetuto", plan: [["lez", 8, { id: "why" }]] },
      { id: 202, t: "Fortuna e varianza", plan: [["lez", 8, { id: "luck" }]] },
      { id: 203, t: "Falsi miti del poker online", plan: [["lez", 8, { id: "myths" }]] },
      { id: 217, t: "Il bankroll", plan: [["lez", 8, { id: "bankroll" }], ["bbeuro", 6]] },
      { id: 205, t: "Posizione e open", plan: [["lez", 6, { id: "pos" }], ["seat", 4], ["preflop", 12, { spots: ["rfi_ep", "rfi_mp", "rfi_co", "rfi_btn", "rfi_sb"] }]] },
      { id: 206, t: "Vietato limpare", plan: [["lez", 6, { id: "nolimp" }], ["preflop", 8, { spots: ["rfi_ep", "rfi_mp", "rfi_co", "rfi_btn", "rfi_sb"] }]] },
      { id: 208, t: "Chi paga e chi folda", plan: [["lez", 8, { id: "fish" }], ["target", 6]] },
      { id: 207, t: "Contro i limper", plan: [["lez", 8, { id: "limp" }], ["vslimp", 14]] },
      { id: 209, t: "Postflop semplice", plan: [["lez", 8, { id: "post" }], ["betsize", 5], ["vslimp", 6]] },
      { id: 210, t: "Tracker e HUD", plan: [["lez", 8, { id: "tracker" }]] },
      { ...WS(0, 4, "Esame NL2"), plan: [["lez", 12, { lv: "nl2" }], ["preflop", 8, { spots: ["rfi_ep", "rfi_mp", "rfi_co", "rfi_btn", "rfi_sb"] }], ["vslimp", 8], ["target", 4]] }] },
  { id: "nl5", stake: "NL5", col: "#d63c3c", ink: "#fff", t: "I primi numeri e il preflop solido", d: "La matematica del poker un mattone alla volta: combinazioni, range, equity, outs, pot odds ed EV. Poi il preflop: difesa del BB, 3-bet o fold, risposta al 3-bet.",
    learn: ["Combinazioni e range", "Equity, outs e pot odds", "L'EV e la decisione giusta", "Difesa del BB, 3-bet e risposta al 3-bet"],
    study: ["Study: segui la linea CO apre, BTN 3-betta e guarda la risposta del CO", "Solver preflop: confronta la tua difesa del BB con la tabella GTO"],
    gate: "Esame superato, preflop sopra l'80% e 25 buy-in per NL10.",
    s: [{ id: 211, t: "Perché la matematica e come contare le combinazioni", plan: [["lez", 8, { id: "combo" }], ["combo", 6]] },
      { id: 212, t: "Probabilità delle mani iniziali", plan: [["lez", 8, { id: "prob" }]] },
      { id: 241, t: "Il range", plan: [["lez", 8, { id: "n5range" }]] },
      { id: 213, t: "L'equity: gli scontri preflop", plan: [["lez", 8, { id: "allin" }], ["strongest", 6, { mode: "A", st: "pre" }]] },
      { id: 214, t: "Migliorare al flop", plan: [["lez", 7, { id: "flop" }], ["strongest", 6, { mode: "A", st: "flop" }]] },
      { id: 215, t: "Outs, regola del 2 e del 4", plan: [["lez", 7, { id: "outs" }], ["outs", 8], ["strongest", 5, { mode: "A", st: "post" }]] },
      { id: 216, t: "Pot odds ed equity necessaria", plan: [["lez", 7, { id: "potodds" }], ["math", 8]] },
      { id: 242, t: "L'EV", plan: [["lez", 8, { id: "n5ev" }]] },
      { id: 221, t: "Decisione, non risultato", plan: [["lez", 8, { id: "decide" }]] },
      { id: 102, t: "Difendere il BB", plan: [["lez", 6, { id: "n5bb" }], ["preflop", 14, { spots: ["bb_btn", "bb_sb", "bb_co", "bb_mp", "bb_ep"] }]] },
      { id: 103, t: "3-bet o fold", plan: [["lez", 6, { id: "n5three" }], ["preflop", 14, { spots: ["btn_co", "btn_mp", "btn_ep", "co_mp", "co_ep", "mp_ep", "sb_btn", "sb_co"] }]] },
      { id: 104, t: "Contro il 3-bet", plan: [["lez", 6, { id: "n5vs3" }], ["preflop", 14, { spots: ["btn_vs_bb3", "btn_vs_sb3", "co_vs_btn3", "co_vs_sb3", "co_vs_bb3", "sb_vs_bb3", "mp_vs_btn3", "ep_vs_co3"] }]] },
      { id: 105, t: "Esame NL5", exam: true, plan: [["lez", 12, { lv: "nl5" }], ["preflop", 16], ["math", 5], ["combo", 5]] }] },
  { id: "nl10", stake: "NL10", col: "#2f6fe0", ink: "#fff", t: "Il postflop di base", d: "Misurare i risultati, scegliere quanto puntare, fare c-bet e barrel, leggere il board e difendersi dalla c-bet: tutti gli strumenti del postflop di base.",
    learn: ["Winrate, varianza, tilt e rake in numeri", "L'EV di una puntata, value e size", "C-bet, board e barrel", "Rispondere alla c-bet"],
    study: ["Allenati al river: gioca 30 decisioni in modalità Street", "Risolvi con IA: trova la monosize migliore su un river"],
    gate: "Esame superato e 25 buy-in per NL25.",
    s: [{ id: 371, t: "Winrate e varianza", plan: [["lez", 8, { id: "n10wr" }]] }, { id: 306, t: "Tilt e decisioni sotto pressione", plan: [["lez", 8, { id: "n10mind" }]] }, { id: 372, t: "La rake in numeri", plan: [["lez", 8, { id: "n10rake" }]] }, { id: 302, t: "Pensare in range street dopo street", plan: [["lez", 8, { id: "n10range" }]] }, { id: 301, t: "L'EV di una puntata", plan: [["lez", 8, { id: "n10ev" }]] }, { id: 303, t: "Value bet e thin value", plan: [["lez", 8, { id: "n10value" }]] }, { id: 304, t: "La size come bersaglio", plan: [["lez", 8, { id: "n10size" }]] }, { id: 305, t: "Progetti e implied odds", plan: [["lez", 8, { id: "n10draw" }]] }, { id: 311, t: "Fondamenti di c-bet", plan: [["lez", 8, { id: "n25cbet" }], ["cbet", 6, { spot: "S1" }]] }, { id: 312, t: "Leggere il board", plan: [["lez", 8, { id: "n25board" }]] }, { id: 313, t: "Secondo e terzo barrel", plan: [["lez", 8, { id: "n25barrel" }]] }, { id: 373, t: "Rispondere alla c-bet", plan: [["lez", 8, { id: "n10def" }], ["cbdef", 8]] },
      WS(1, 0), WS(1, 1), WS(1, 2), WS(1, 3), { ...WS(1, 4, "Esame NL10"), plan: [["lez", 12, { lv: "nl10" }], ...WS(1, 4).plan, ["cbdef", 6]] }] },
  { id: "nl25", stake: "NL25", col: "#1f9e5a", ink: "#fff", t: "Il piano dal flop al river", d: "Gli strumenti del NL10 diventano un piano: la mappa del flop BTN contro BB, c-bet mista e check-raise, turn e river, poi statistiche e aggiustamenti contro gli avversari.",
    learn: ["Mappa del flop BTN contro BB", "C-bet mista, check-raise, turn e river", "Piatti multiway", "Dalle statistiche alle scelte"],
    study: ["Report flop BTN vs BB: raggruppa per carta alta e guarda le frequenze di bet", "Study: risolvi un flop e rigioca 20 mani in Allenati"],
    gate: "Esame superato, flop sopra l'80% e 30 buy-in per NL50.",
    s: [{ id: 411, t: "BTN contro BB: la mappa del flop", plan: [["lez", 8, { id: "n25bbflop" }], ["flopbtn", 6]] }, { id: 412, t: "La c-bet mista e il check-raise", plan: [["lez", 8, { id: "n25bbmix" }]] }, { id: 413, t: "Turn, delay e river da aggressore", plan: [["lez", 8, { id: "n25bbturn" }]] }, { id: 314, t: "Piatti multiway", plan: [["lez", 8, { id: "n25multi" }]] }, { id: 315, t: "Leggere le statistiche", plan: [["lez", 8, { id: "n25hud" }]] }, { id: 374, t: "Dalle statistiche alle scelte", plan: [["lez", 8, { id: "n25adj" }]] }, { id: 316, t: "Analizzare le proprie mani", plan: [["lez", 8, { id: "n25review" }]] },
      WS(4, 0), { id: 106, t: "Secondo barrel", plan: [["turn", 10, { spot: "T1" }], ["turn", 8, { spot: "T2" }], ["size", 6], ["concetti", 3]] }, WS(4, 3), WS(3, 0, "Leggere le statistiche"), { ...WS(4, 4, "Esame NL25"), plan: [["lez", 12, { lv: "nl25" }], ...WS(4, 4).plan] }] },
  { id: "nl50", stake: "NL50", col: "#f08a24", ink: "#1b1b1b", t: "Range, difesa e blind contro blind", d: "Forme dei range, alpha e MDF, blocker, c-bet fuori posizione, difesa del BB con il check-raise, blind contro blind e 3-bet contro i reg.",
    learn: ["Forme dei range, MDF e blocker", "C-bet fuori posizione", "Difesa del BB e blind contro blind", "3-bet lineare o polarizzata ed exploit"],
    study: ["Study, scheda Range: confronta equity ed EQR di BB e BTN", "Nodelock: fai foldare troppo il BB e guarda come cambia il BTN"],
    gate: "Esame superato e 30 buy-in per NL100.",
    s: [{ id: 321, t: "Le forme dei range", plan: [["lez", 8, { id: "n50shape" }]] }, { id: 322, t: "Alpha, MDF e quanti bluff", plan: [["lez", 8, { id: "n50math" }]] }, { id: 323, t: "Blocker e unblocker", plan: [["lez", 8, { id: "n50block" }]] }, { id: 326, t: "Le tue mani sul river", plan: [["lez", 8, { id: "n50river" }]] }, { id: 375, t: "C-bet fuori posizione", plan: [["lez", 8, { id: "n50oop" }]] }, { id: 324, t: "Check-raise e difesa del BB", plan: [["lez", 8, { id: "n50xr" }]] }, { id: 421, t: "Il check-raise del BB: quale size", plan: [["lez", 8, { id: "n50bbdflop" }], ["bbdef", 6, { mode: "flop_xr" }]] }, { id: 422, t: "Il turn del BB: dopo il raise e dopo il check", plan: [["lez", 8, { id: "n50bbdturn" }], ["bbdef", 6, { mode: "turn_xr" }]] }, { id: 423, t: "Il river del BB: tre linee, tre piani", plan: [["lez", 8, { id: "n50bbdriver" }]] }, { id: 431, t: "BvB: il piano dello SB al flop", plan: [["lez", 8, { id: "n100bvbflop" }], ["flopbvb", 6]] }, { id: 432, t: "BvB: turn e river dello SB", plan: [["lez", 8, { id: "n100bvbturn" }]] }, { id: 433, t: "BvB: la difesa del BB", plan: [["lez", 8, { id: "n100bvbdef" }]] }, { id: 376, t: "La 3-bet contro i reg: lineare o polarizzata", plan: [["lez", 8, { id: "n50three" }]] }, { id: 325, t: "Exploit e bersagli", plan: [["lez", 8, { id: "n50exploit" }]] },
      WS(2, 0), WS(2, 1), WS(4, 1), WS(4, 2), WS(2, 2), WS(2, 3), WS(3, 1), WS(3, 2), WS(3, 3), { ...WS(2, 4, "Esame NL50"), plan: [["lez", 12, { lv: "nl50" }], ...WS(2, 4).plan] }] },
  { id: "nl100", stake: "NL100", col: "#1d1d1d", ink: "#fff", t: "Teoria avanzata dei reg", d: "Range polarizzati e condensati, vantaggio di range e di nut, c-bet nei single raised pot con i dati, i pilastri della strategia GTO, come punire i range cappati e lo squeeze.",
    learn: ["Polarizzato contro condensato", "Vantaggio di range e di nut", "C-bet nei single raised pot", "Punire i range cappati"],
    study: ["Avversari: analizza un reg e usa il suo profilo nel nodelock", "Le tue mani: apri 3 spot al flop nello Study"],
    gate: "Esame superato e 25 buy-in per NL200.",
    s: [{ id: 331, t: "Polarizzato contro condensato", plan: [["lez", 8, { id: "n100polar" }]] }, { id: 332, t: "Vantaggio di range e di nut", plan: [["lez", 8, { id: "n100adv" }]] }, { id: 333, t: "C-bet nei single raised pot", plan: [["lez", 8, { id: "n100srp" }]] }, { id: 334, t: "I pilastri della strategia GTO", plan: [["lez", 8, { id: "n100pillar" }]] }, { id: 335, t: "Punire i range cappati", plan: [["lez", 8, { id: "n100capped" }]] }, { id: 336, t: "Lo squeeze", plan: [["lez", 8, { id: "n100preflop" }]] },
      WS(6, 0), { ...WS(3, 4, "Esame NL100"), plan: [["lez", 12, { lv: "nl100" }], ...WS(3, 4).plan] }] },
  { id: "nl200", stake: "NL200", col: "#7b3fe4", ink: "#fff", t: "Piatti 3-bet e pressione", d: "Leverage e SPR, 3-bet pot in e fuori posizione e blind contro blind, overbet, probe, bluffcatching e slowplay: dove si decide il winrate dei reg.",
    learn: ["C-bet nei 3-bet pot IP", "3-bet pot OOP con range depolarizzato", "Preflop completo", "SPR medio e impegno dello stack"],
    study: ["Report flop 3-bet pot BB vs BTN: dove punta il 3-bettor", "Allenati: 40 mani nel 3-bet pot in modalità Standard"],
    gate: "Esame superato e 25 buy-in per NL500.",
    s: [{ id: 341, t: "Leverage e size geometrica", plan: [["lez", 8, { id: "n200lev" }]] }, { id: 346, t: "Postflop nei 3-bet pot", plan: [["lez", 8, { id: "n200three" }]] }, { id: 444, t: "3-bet IP: il piano al flop", plan: [["lez", 8, { id: "n200ipflop" }]] }, { id: 445, t: "3-bet IP: turn e river", plan: [["lez", 8, { id: "n200ipturn" }]] }, { id: 441, t: "3-bet pot OOP: la mappa del flop", plan: [["lez", 8, { id: "n200oopflop" }]] }, { id: 442, t: "3-bet pot OOP: turn e river", plan: [["lez", 8, { id: "n200oopturn" }]] }, { id: 443, t: "Ramo check e 3-bet polarizzata del BB", plan: [["lez", 8, { id: "n200oopmix" }]] }, { id: 446, t: "BvB: 3-bet IP polarizzato", plan: [["lez", 8, { id: "n200ipbvb" }]] }, { id: 342, t: "Overbet al flop", plan: [["lez", 8, { id: "n200over" }]] }, { id: 343, t: "Turn probe", plan: [["lez", 8, { id: "n200probe" }]] }, { id: 344, t: "Bluffcatching e indifferenza", plan: [["lez", 8, { id: "n200catch" }]] }, { id: 345, t: "Slowplay", plan: [["lez", 8, { id: "n200slow" }]] },
      WS(5, 0), WS(5, 1), WS(5, 2), WS(5, 3), WS(6, 3), { ...WS(5, 4, "Esame NL200"), plan: [["lez", 12, { lv: "nl200" }], ...WS(5, 4).plan] }] },
  { id: "nl500", stake: "NL500", col: "#e9b949", ink: "#1b1b1b", t: "Piatti grossi ed exploit", d: "Piatti 4-bet con SPR basso, cold 4-bet, dati di popolazione, exploit di livello 1 e 2, ricreativi, bluff-raise al river, redline e timing tell.",
    learn: ["Piatti 4-bet e cold 4-bet", "Dati di popolazione ed exploit", "Battere i ricreativi", "Bluff-raise, redline e timing tell"],
    study: ["Study: arriva a un 4-bet e guarda la risposta calcolata dal solver", "Allenati in modalità Frequenze sui turn dei 3-bet pot"],
    gate: "Esame superato e 25 buy-in per NL1000.",
    s: [{ id: 356, t: "Piatti 4-bet e SPR basso", plan: [["lez", 8, { id: "n500four" }]] }, { id: 351, t: "Dati di popolazione", plan: [["lez", 8, { id: "n500pop" }]] }, { id: 352, t: "Exploit livello 1 e 2", plan: [["lez", 8, { id: "n500lvl" }]] }, { id: 355, t: "Battere i ricreativi", plan: [["lez", 8, { id: "n500rec" }]] }, { id: 353, t: "Blocker al river e bluff-raise", plan: [["lez", 8, { id: "n500riv" }]] }, { id: 354, t: "Redline e timing tell", plan: [["lez", 8, { id: "n500red" }]] },
      WS(6, 1), WS(6, 2), { ...WS(6, 4, "Esame NL500"), plan: [["lez", 12, { lv: "nl500" }], ...WS(6, 4).plan] }] },
  { id: "nl1000", stake: "NL1000", col: "#d9a520", ink: "#3b2500", gold: true, t: "Élite", d: "Tutto insieme, veloce e senza errori: river da professionista, difesa perfetta e la testa degli high stakes.",
    learn: ["Decisioni veloci su tutte le street", "River: value thin, bluff con blocker", "Difesa completa contro ogni linea", "Mental game da high stakes"],
    study: ["Allenati: 100 mani con punteggio GTO sopra il 90%", "Risolvi con IA: trova le 2 size per il tuo spot più frequente"],
    gate: "Il traguardo: da qui si mantiene il livello ogni giorno.",
    s: [{ id: 361, t: "Exploit livello 3 e 4", plan: [["lez", 8, { id: "n1klvl" }]] }, { id: 362, t: "Fuori dall'albero", plan: [["lez", 8, { id: "n1koff" }]] }, { id: 363, t: "River d'élite", plan: [["lez", 8, { id: "n1kriver" }]] }, { id: 364, t: "Mani dagli high stakes", plan: [["lez", 8, { id: "n1khands" }]] }, { id: 365, t: "Errori rari e zona grigia", plan: [["lez", 8, { id: "n1kleak" }]] }, { id: 366, t: "Studiare e giocare da professionista", plan: [["lez", 8, { id: "n1kpro" }]] },
      { id: 107, t: "Mix veloce", plan: [["math", 6], ["combo", 5], ["preflop", 10], ["size", 6], ["blocker", 4], ["turn", 6]] },
      { id: 108, t: "River da professionista", plan: [["size", 10], ["blocker", 6], ["target", 6], ["concetti", 4]] },
      { id: 109, t: "Difesa élite", plan: [["bbdef", 10, { mode: "flop_xr" }], ["bbdef", 8, { mode: "turn_xr" }], ["bvb3", 8], ["p4bet", 6]] },
      { id: 110, t: "Mente da high stakes", plan: [["mindset", 8], ["concetti", 6], ["profile", 6]] },
      { id: 111, t: "Esame NL1000", exam: true, plan: [["lez", 12, { lv: "nl1000" }], ["preflop", 10], ["flopbtn", 6], ["flopbvb", 5], ["bbdef", 6], ["cbet", 6], ["turn", 6], ["size", 6], ["blocker", 4], ["p4bet", 5], ["bvb3", 5], ["concetti", 6]] }] },
  /* livello segreto: invisibile finché non superi l'esame NL1000 */
  { id: "live", stake: "LIVE", secret: true, col: "#8e1b2c", ink: "#fff", t: "Il poker dal vivo", d: "Il livello segreto: tavoli veri, stack profondi, regole e procedure, ricreativi da isolare, size che parlano e sessioni lunghe da gestire con la testa.",
    learn: ["Dal online al live: mani, winrate e rake", "Regole e procedure del tavolo", "Stack profondi, set mining e straddle", "Il pool live, le size e i tell"],
    study: ["Allenati nel drill Il tavolo live finché non lo chiudi sopra il 90%", "Al tavolo vero: annota in ogni sessione le size dei ricreativi quando mostrano le carte"],
    gate: "Il livello segreto: superalo per completare il percorso anche dal vivo.",
    s: [{ id: 901, t: "Dal online al live", plan: [["lez", 8, { id: "lv_diff" }]] },
      { id: 902, t: "Regole e procedure del tavolo", plan: [["lez", 8, { id: "lv_rules" }], ["live", 4]] },
      { id: 903, t: "Stack profondi e straddle", plan: [["lez", 8, { id: "lv_deep" }], ["live", 6]] },
      { id: 904, t: "Il pool live", plan: [["lez", 8, { id: "lv_pool" }], ["vslimp", 6], ["live", 4]] },
      { id: 905, t: "Tell, tempi e size", plan: [["lez", 8, { id: "lv_tells" }], ["live", 6]] },
      { id: 906, t: "Sessioni, bankroll e mente al tavolo", plan: [["lez", 8, { id: "lv_mind" }]] },
      { id: 907, t: "Serata al tavolo", plan: [["live", 12], ["vslimp", 6], ["target", 4]] },
      { id: 908, t: "Esame Live", exam: true, plan: [["lez", 12, { lv: "live" }], ["live", 10], ["vslimp", 6], ["target", 4]] }] },
];
/* livello segreto Live: si apre superando l'esame NL1000 (nell'artifact con la modalità test è sempre visibile) */
const LV_MAIN = LEVELS.filter(L => !L.secret).length;
const isSecretLv = i => !!(LEVELS[i] && LEVELS[i].secret);
function liveOpen() { try { if (tlTest()) return true; const L = LEVELS.find(x => x.id === "nl1000"), ex = L && L.s.find(x => x.exam); return !!ex && ((S.sessions[ex.id] || {}).best || 0) >= examPass(L); } catch (e) { return false; } }
const lvVisible = L => !L.secret || liveOpen();
const sessVisible = s => { const L = LEVELS[s.level]; return !L || lvVisible(L); };
const SESS = []; LEVELS.forEach((L, li) => L.s.forEach((s, si) => SESS.push({ ...s, level: li, week: li })));
/* lezioni extra (da NL25 a NL500): fuori dal percorso, non servono per salire; sul sito sono Premium */
function tlMergePlan(plans, mul) { const m = new Map(); plans.flat().forEach(([d, n, o]) => { const k = d + JSON.stringify(o || {}); const e = m.get(k); if (e) e[1] += n; else m.set(k, [d, n, o]); }); return [...m.values()].map(([d, n, o]) => o ? [d, Math.max(4, Math.round(n * mul)), o] : [d, Math.max(4, Math.round(n * mul))]); }
LEVELS.forEach((L, li) => {
  if (li < 3 || li > 7) return;
  const base = L.s.filter(s => !s.exam), ex = L.s.find(s => s.exam);
  L.x = [
    { id: 1000 + li * 10 + 1, t: `Approfondimento ${L.stake}`, d: "Tutti gli spot del livello in una sessione lunga", extra: true, plan: tlMergePlan(base.map(s => s.plan), 0.6) },
    ...(ex ? [{ id: 1000 + li * 10 + 2, t: `Simulazione d'esame ${L.stake}`, d: "Un esame in più per allenarti prima di quello vero", extra: true, plan: tlMergePlan([ex.plan], 1) }] : [])
  ];
});
const XSESS = []; LEVELS.forEach((L, li) => (L.x || []).forEach(s => XSESS.push({ ...s, level: li, week: li })));
/* fase 0: le regole. Il test d'ingresso (10 domande sulle 5 lezioni) con almeno l'80% le salta tutte */
const F0_TEST = 234, F0_PASS = 80;
XSESS.push({ id: F0_TEST, t: "Test d'ingresso: le regole", f0test: true, plan: [["lez", 10, { lv: "f0" }]], level: 0, week: 0 });
const f0Sess = () => LEVELS[0].s.filter(s => s.f0);
const f0Open = () => f0Sess().some(s => !isSkipped(s));
function f0Apply(score) { if (score == null || score < F0_PASS) return false; S.skipped = { ...(S.skipped || {}) }; f0Sess().forEach(s => { S.skipped[s.id] = true; }); return true; }
const sessById = id => SESS.find(x => x.id === id) || XSESS.find(x => x.id === id);
/* l'esame si supera con almeno l'80% */
const EXAM_PASS = 80;
/* dal NL50 in su salire è davvero difficile: esame più alto, stelle, giorni di allenamento e conferma in due giorni diversi */
const EXAM_BY = { nl2: 80, nl5: 80, nl10: 80, nl25: 82, nl50: 88, nl100: 90, nl200: 92, nl500: 94, nl1000: 95, live: 85 };
const LVL_REQ = { nl50: { stars2: true, days: 30 }, nl100: { stars2: true, starPct: 0.8, days: 45, twice: true }, nl200: { stars2: true, starPct: 0.8, days: 60, twice: true }, nl500: { stars2: true, starPct: 0.85, days: 90, twice: true }, nl1000: { stars2: true, starPct: 0.9, twice: true } };
const examPass = L => EXAM_BY[L.id] || EXAM_PASS;
const examDays = id => ((S.examOk || {})[id] || []).length;
/* verdetto a fine esame: level up, esame superato ma prove da fare, oppure rimandato */
function gExamVerdict() {
  if (!run || run.kind !== "session") return "";
  const s = SESS.find(x => x.id === run.id); if (!s || !s.exam || run.final == null) return "";
  const li = LEVELS.findIndex(L => L.s.some(x => x.id === run.id)), L = LEVELS[li], nx0 = LEVELS[li + 1], nx = nx0 && !nx0.secret ? nx0 : null, sc = run.final, need = examPass(L);
  if (sc >= need) { S.examOk = S.examOk || {}; const d = S.examOk[run.id] || []; if (!d.includes(today())) { S.examOk[run.id] = [...d, today()].slice(-10); persist(); } }
  if (sc >= need && !run.prize && !run.prizeRep) { const nw = prizeAward(L); if (nw) { run.prize = nw; setTimeout(() => { try { gConfetti(PRIZES[nw].maxi ? 6000 : 3000); if (PRIZES[nw].maxi) setTimeout(() => gConfetti(4000), 1500); } catch (e) {} }, 300); } else { run.prizeRep = prizeRepeat(L); if (run.prizeRep) setTimeout(() => { try { gConfetti(PRIZES[L.id].maxi ? 4000 : 1800); } catch (e) {} }, 300); } }
  const LV_REV = L.id === "nl1000" && sc >= need && !S.liveSeen ? `<div class="live-reveal"><span class="live-rev-eye">Livello segreto sbloccato</span>${chip(LEVELS.find(x => x.id === "live"))}<h2>LIVE · Il poker dal vivo</h2><p>Hai superato l'esame NL1000: si è aperto un livello che non compariva nella scala. Tavoli veri, stack profondi, regole del tavolo e ricreativi da leggere. Lo trovi in fondo alla scala del Programma.</p></div>` : "";
  if (LV_REV) { S.liveSeen = today(); persist(); setTimeout(() => { try { gConfetti(4000); } catch (e) {} }, 900); }
  const PZ = (run.prize ? prizeHtml(run.prize) : run.prizeRep ? prizeRepeatHtml(run.prizeRep) : "") + LV_REV + (sc >= need ? mmOfferHtml() : "");
  const P = levelProg(L), R = P.R;
  const chip = lv => `<span class="pchip big${lv.gold ? " gold" : ""}${lv.secret ? " secret" : ""}" style="--c:${lv.col};--ink:${lv.ink};--sz:96px"><i></i><b style="font-size:calc(var(--sz)*${lv.secret ? .2 : [.3, .3, .28, .24, .19][lv.stake.length - 2]})">${lv.stake.replace("NL", "")}</b><em>${lv.secret ? "♠" : "NL"}</em></span>`;
  if (sc >= need && P.passed) return PZ + `<div class="exv up"><div class="exv-chips">${chip(L)}<span class="exv-arrow">➜</span>${nx ? chip(nx) : ""}</div><span class="exv-eye">Level up!</span><h2>${nx ? `Sei promosso a ${nx.stake}` : "Hai completato la scalata fino a NL1000"}</h2><p>Esame ${sc}% (serve ${need}%) e tutti i requisiti di ${L.stake} completati.${nx ? ` Da domani si gioca il livello "${esc(nx.t)}".` : ""}</p></div>`;
  if (sc >= need) return PZ + `<div class="exv half"><div class="exv-chips">${chip(L)}</div><span class="exv-eye">Esame superato</span><h2>Manca poco per ${nx ? nx.stake : "il traguardo"}</h2><p>Esame ${sc}% (serve ${need}%). Per salire di limite manca ancora qualcosa:</p>${levelReqHtml(L, P)}<button class="btn primary" id="exProve">Vai al livello ${L.stake}</button></div>`;
  return `<div class="exv down"><div class="exv-chips">${chip(L)}</div><span class="exv-eye">Rimandato alla prossima</span><h2>Resti a ${L.stake}, per ora</h2><p>Hai fatto <b>${sc}%</b>, serve <b>${need}%</b>. Ripassa gli errori, rifai le sessioni del livello con meno stelle e riprova quando vuoi.</p>${examTriedToday(run.id) ? `<p class="car-small">Un tentativo al giorno: potrai riprovare l'esame domani.</p>` : `<button class="btn primary" id="exAgain">Riprova l'esame</button>`}</div>`;
}
const sessLevel = id => { const s = sessById(id); return s ? LEVELS[s.level] : null; };
/* lezioni saltabili: chi le salta non le vede più e non servono per salire */
const isSkipped = s => !!(s && s.skip && (S.skipped || {})[s.id]);
const lvlSess = L => L.s.filter(s => !isSkipped(s));
function nextSession() { let A = SESS.filter(s => !isSkipped(s) && sessVisible(s)); if (A.some(s => !s.f0 && S.sessions[s.id])) A = A.filter(s => !s.f0 || S.sessions[s.id]); return A.find(s => !S.sessions[s.id]) || A[A.length - 1]; }
function levelProg(L0) {
  const L = { ...L0, s: lvlSess(L0) };
  const placed = S.place != null && LEVELS.indexOf(L0) < S.place;
  const done = L.s.filter(s => S.sessions[s.id]).length, stars = L.s.reduce((a, s) => a + gStars(s.id), 0), exam = L.s.find(s => s.exam), pv = gwLevelProve(L0), R = LVL_REQ[L0.id] || {};
  const best = exam ? ((S.sessions[exam.id] || {}).best || 0) : 0, twiceOk = !R.twice || !exam || examDays(exam.id) >= 2;
  const ex = exam ? best >= examPass(L0) && twiceOk : done === L.s.length;
  const les = L.s.filter(s => !s.exam && !s.f0), s2 = les.filter(s => gStars(s.id) >= 2).length, max = L.s.length * 3, days = (S.days || []).length;
  const starsOk = (!R.stars2 || s2 === les.length) && (!R.starPct || stars >= Math.ceil(R.starPct * max)), daysOk = !R.days || days >= R.days;
  const brUp = brNeedUp(L0), brOk = !brUp || brGet() >= brUp;
  return { done, tot: L.s.length, stars, max, exam: ex, examBest: best, examDays: exam ? examDays(exam.id) : 0, pv, R, s2, s2tot: les.length, days, starsOk, daysOk, brUp, brOk, passed: placed || (ex && pv.done === pv.tot && starsOk && daysOk && brOk), placed };
}
function levelGate(L) { const i = LEVELS.indexOf(L), nx0 = LEVELS[i + 1], nx = nx0 && !nx0.secret ? nx0 : null; return nx ? `Esame superato, lezioni con almeno l'80% e ${fmtFi(BR_UP[L.id] * BR_BI[nx.id])} (30 buy-in di ${nx.stake}).` : L.gate; }
function levelReqHtml(L, P) {
  const R = P.R, ok = b => b ? "✔" : "✖", li = (b, t) => `<li class="${b ? "ok" : ""}">${ok(b)} ${t}</li>`;
  const e = L.s.find(s => s.exam);
  let h = li(P.exam, `Esame almeno <b>${examPass(L)}%</b>${R.twice ? `, superato in <b>2 giorni diversi</b> (${Math.min(2, P.examDays)}/2)` : ""}${e && P.examBest ? ` · migliore ${P.examBest}%` : ""}`);
  h += li(P.pv.done === P.pv.tot, `Prove del livello: ${P.pv.done}/${P.pv.tot}`);
  if (R.stars2) h += li(P.s2 === P.s2tot, `Tutte le lezioni con almeno ★★: ${P.s2}/${P.s2tot}`);
  if (R.starPct) h += li(P.stars >= Math.ceil(R.starPct * P.max), `Stelle totali almeno ${Math.ceil(R.starPct * P.max)}: ${P.stars}/${P.max}`);
  if (R.days) h += li(P.daysOk, `Giorni di allenamento almeno ${R.days}: ${Math.min(P.days, R.days)}/${R.days}`);
  if (P.brUp) h += li(P.brOk, `Almeno <b>${fmtFi(P.brUp)}</b> (${BR_UP[L.id]} buy-in del livello successivo): ora hai ${fmtFi(brGet())}`);
  return `<ul class="lvreq">${h}</ul>`;
}
function curLevelIdx() { for (let i = 0; i < LV_MAIN; i++) if (!levelProg(LEVELS[i]).passed) return i; return LV_MAIN - 1; }
/* ---- accesso ai livelli ----
   Da NL2 a NL500 si sale gratis superando esame e prove del livello precedente.
   Premium (solo sito): sblocca subito qualsiasi livello senza esami e apre NL1000 con le lezioni premium.
   Nell'artifact vale solo la scalata (nessun pagamento). */
const tlCfg = () => window.ORCA_CONFIG || {};
const tlSite = () => !!(HOST() && HOST().standalone);
/* modalità test (solo nell'artifact): codice di sblocco per provare tutto */
const ORCA_TEST_CODE = "target";
const tlTest = () => !tlSite() && lsGet("orca_test") !== 0; /* nell'artifact parte sbloccato: si può disattivare da I miei dati */
function tlPlan() { if (tlTest()) return "premium"; const a = window.ORCA_ACCOUNT; if (a && a.plan) return a.plan; return tlSite() ? "free" : "owner"; }
const tlPremiumLevel = i => !isSecretLv(i) && i >= (tlCfg().premiumFrom != null ? tlCfg().premiumFrom : LV_MAIN - 1);
function levelAccess(i) {
  if (isSecretLv(i)) return liveOpen() ? { ok: true } : { ok: false, why: "secret" };
  const prem = tlPlan() === "premium";
  if (tlSite() && tlPremiumLevel(i) && !prem) return { ok: false, why: "plan" };
  if (i > curLevelIdx() && !prem) return { ok: false, why: "prev", buy: tlSite() };
  if (!prem && i > 0 && brGet() < brNeedPlay(LEVELS[i])) return { ok: false, why: "br" };
  return { ok: true };
}
/* drill liberi: ognuno si apre al livello del programma in cui compare per la prima volta */
let DRILL_LVL = null;
const DRILL_ALWAYS = new Set(["review", "herr", "hands"]);
function drillLvl(id) { if (DRILLS[id] && DRILLS[id].lvl != null) return DRILLS[id].lvl; if (!DRILL_LVL) { DRILL_LVL = {}; LEVELS.forEach((L, i) => L.s.forEach(s => s.plan.forEach(([d]) => { if (DRILL_LVL[d] == null) DRILL_LVL[d] = i; }))); } return DRILL_LVL[id]; }
function drillAccess(id) { if (DRILL_ALWAYS.has(id)) return { ok: true }; const i = drillLvl(id); if (i == null) return { ok: true }; const a = levelAccess(i); return a.ok ? a : { ...a, lvl: i }; }
function drillLockMsg(id) {
  const a = drillAccess(id); if (a.ok) return;
  const st = LEVELS[a.lvl].stake;
  if (a.why === "plan") return tlLockMsg(a, a.lvl);
  gToast(`🔒 <b>${esc(DRILLS[id].name)}</b> si sblocca a <b>${st}</b>: supera prima gli esami del programma.${a.buy ? " Oppure sbloccalo subito con Premium." : ""}`);
  if (a.buy && typeof window.ORCA_UPGRADE === "function") setTimeout(() => window.ORCA_UPGRADE(st), 900);
}
function xAccess(i) { const a = levelAccess(i); if (!a.ok) return a; if (tlSite() && tlPlan() !== "premium") return { ok: false, why: "plan" }; return { ok: true }; }
function tlLockMsg(a, i) {
  if (a.why === "plan" || a.buy && a.force) { if (typeof window.ORCA_UPGRADE === "function") return window.ORCA_UPGRADE(LEVELS[i].stake); return gToast(`⭐ <b>${LEVELS[i].stake}</b> fa parte di Premium.`); }
  if (a.why === "br") return gToast(`${GIC.chip} Fiches sotto i ${BR_MIN} buy-in di <b>${LEVELS[i].stake}</b> (${fmtFi(brNeedPlay(LEVELS[i]))}): gioca il livello sotto per recuperarle.`);
  const c = curLevelIdx(); gToast(`🔒 Prima supera l'esame e le prove di <b>${LEVELS[c].stake}</b>: poi si sblocca il livello successivo.${a.buy ? " Oppure sbloccalo subito con Premium." : ""}`);
}
function tlLockBanner(a, i) {
  if (a.why === "br") return `<div class="car-lock"><b>${GIC.chip} Fiches insufficienti</b><p>Per giocare ${LEVELS[i].stake} servono almeno ${BR_MIN} buy-in: <b>${fmtFi(brNeedPlay(LEVELS[i]))}</b>. Ora ne hai ${fmtFi(brGet())}. Torna al livello sotto e recuperale: ogni risposta giusta te ne fa vincere.</p></div>`;
  if (a.why === "plan") return `<div class="car-lock plan"><b>⭐ Livello Premium</b><p>${LEVELS[i].stake} e le sue lezioni premium fanno parte di Premium.</p><button class="car-play sm" data-upgrade="${i}">Passa a Premium</button></div>`;
  return `<div class="car-lock"><b>🔒 Livello bloccato</b><p>Supera l'esame e le prove di <b>${LEVELS[curLevelIdx()].stake}</b> per sbloccarlo${a.buy ? " gratis" : ""}.${a.buy ? " Con Premium puoi aprire subito tutte le lezioni, senza esami." : ""}</p>${a.buy ? `<button class="car-play sm" data-upgrade="${i}">Sblocca con Premium</button>` : ""}</div>`;
}
/* solver: quota giornaliera per il piano gratuito (solo sito) */
function tlSolveAllowed() {
  if (tlPlan() !== "free") return true;
  const lim = tlCfg().freeSolvesPerDay != null ? tlCfg().freeSolvesPerDay : -1; if (lim < 0) return true;
  const d = today(); let q = lsGet("orca_solves"); if (!q || q.d !== d) q = { d, n: 0 };
  if (q.n >= lim) { if (typeof window.ORCA_UPGRADE === "function") window.ORCA_UPGRADE("solver"); else gToast(`Hai usato i ${lim} calcoli gratuiti di oggi.`); return false; }
  q.n++; lsSet("orca_solves", q); return true;
}
function adaptPlan(plan) {
  const out = [];
  let changed = false;
  const due = reviewDue().length;
  /* il ripasso errori entra all'inizio della prima sessione del giorno, non in tutte */
  if (due && S.revDay !== today()) { out.push(["review", Math.min(6, due)]); }
  for (let [d, n, o] of plan) {
    if (d === "hands" && !DRILLS.hands.avail()) { d = "target"; changed = true; }
    const sk = S.skills[d]; const a = skillAcc(d);
    let m = n;
    if (sk && sk.n >= 20 && a != null) { if (a >= 85) m = Math.max(3, Math.ceil(n * 0.7)); else if (a < 60) m = Math.round(n * 1.3); }
    if (m !== n) changed = true;
    const ex = !o && out.find(x => x[0] === d && !x[2]); if (ex) ex[1] += m; else out.push(o ? [d, m, o] : [d, m]);
  }
  return { plan: out, changed, due };
}
const planChips = plan => plan.map(([d, n]) => `<span class="chip">${DRILLS[d].short} · ${n}</span>`).join("");
const planMin = plan => Math.max(5, Math.round(plan.reduce((a, [d, n]) => a + n * DRILLS[d].time, 0) * 1.4 / 60));

