/* ================= PROGRAMMA ================= */
const SPOTS_REF = null;
const WEEKS = [
  { t: "Settimana 1 · Numeri e bersagli", d: "Matematica, combinazioni e la domanda base: chi paga, chi folda?", s: [
    { t: "Le formule che servono", plan: [["preflop", 8, { spots: ["rfi_ep", "rfi_mp", "rfi_co", "rfi_btn", "rfi_sb"] }], ["math", 10], ["combo", 8], ["target", 5]] },
    { t: "Bersaglio e prezzo", plan: [["math", 10], ["target", 5], ["outs", 6]] },
    { t: "Combinazioni e progetti", plan: [["preflop", 8, { spots: ["bb_btn", "bb_sb", "bb_co", "bb_mp", "bb_ep"] }], ["combo", 8], ["outs", 8], ["target", 5]] },
    { t: "Velocità", plan: [["math", 12], ["combo", 8], ["target", 5]] },
    { t: "Settimana 1", exam: true, plan: [["math", 8], ["combo", 6], ["outs", 6], ["target", 5]] }] },
  { t: "Settimana 2 · Sizing", d: "La size è la targetizzazione: value, bluff e check contro profili diversi.", s: [
    { t: "Prima size lab", plan: [["size", 8], ["math", 8], ["target", 5]] },
    { t: "Progetti e size", plan: [["size", 10], ["outs", 8]] },
    { t: "Size e bersagli", plan: [["size", 10], ["target", 6], ["math", 6]] },
    { t: "Profili misti", plan: [["size", 12], ["combo", 6]] },
    { t: "Settimana 2", exam: true, plan: [["size", 10], ["math", 6], ["target", 6]] }] },
  { t: "Settimana 3 · Leggere il range e blocker", d: "Stima i range su flop, turn e river, anche nei piatti 3-bet, e scegli i bluff con le carte giuste.", s: [
    { t: "Range per categorie", plan: [["range", 4], ["combo", 8], ["target", 5]] },
    { t: "Primi blocker", plan: [["range", 4], ["blocker", 4], ["size", 6]] },
    { t: "Range e matematica", plan: [["range", 5], ["blocker", 4], ["math", 6]] },
    { t: "Blocker e size", plan: [["blocker", 5], ["range", 4], ["size", 6]] },
    { t: "Settimana 3", exam: true, plan: [["range", 4], ["blocker", 4], ["size", 6], ["target", 4]] }] },
  { t: "Settimana 4 · Persone e integrazione", d: "Dall'HUD all'exploit, le tue mani, poi tutto insieme.", s: [
    { t: "Leggere l'HUD", plan: [["profile", 8], ["size", 8]] },
    { t: "Exploit e bersagli", plan: [["profile", 8], ["target", 6], ["hands", 3]] },
    { t: "Profilo e range", plan: [["profile", 8], ["size", 8], ["range", 3]] },
    { t: "Le tue mani sul river", plan: [["hands", 4], ["size", 8], ["outs", 6]] },
    { t: "Esame finale", exam: true, plan: [["math", 6], ["combo", 5], ["size", 8], ["range", 3], ["blocker", 3], ["profile", 5], ["target", 5]] }] },
  { t: "Settimana 5 · single raised pot", d: "I tuoi trainer dentro il programma: BTN vs BB in attacco e in difesa, BvB, 2° barrel.", s: [
    { t: "BTN vs BB in attacco", plan: [["preflop", 6, { spots: ["rfi_btn", "bb_btn"] }], ["flopbtn", 15], ["turn", 8, { spot: "T1" }], ["concetti", 4]] },
    { t: "BB vs BTN in difesa", plan: [["preflop", 6, { spots: ["bb_btn"] }], ["bbdef", 10, { mode: "flop_xr" }], ["bbdef", 8, { mode: "turn_xr" }], ["bbdef", 8, { mode: "turn_xx" }]] },
    { t: "BvB SB vs BB", plan: [["preflop", 6, { spots: ["rfi_sb", "bb_sb"] }], ["flopbvb", 15], ["turn", 8, { spot: "T2" }], ["concetti", 4]] },
    { t: "Ripasso single raised pot", plan: [["flopbtn", 10], ["flopbvb", 8], ["bbdef", 10], ["size", 6]] },
    { t: "Single raised pot", exam: true, plan: [["preflop", 8, { spots: ["rfi_btn", "rfi_sb", "bb_btn", "bb_sb"] }], ["flopbtn", 8], ["flopbvb", 6], ["bbdef", 8], ["turn", 6], ["concetti", 5]] }] },
  { t: "Settimana 6 · 3-bet pot e preflop", d: "3-bet pot in e fuori posizione, preflop completo, esame finale.", s: [
    { t: "3-bet pot in posizione", plan: [["preflop", 6, { spots: ["btn_co", "co_vs_btn3"] }], ["cbet", 10, { spot: "S3" }], ["size", 6], ["concetti", 4]] },
    { t: "3-bet pot fuori posizione", plan: [["preflop", 6, { spots: ["sb_btn", "sb_co", "btn_vs_sb3", "btn_vs_bb3"] }], ["cbet", 10, { spot: "S4" }], ["blocker", 4], ["concetti", 4]] },
    { t: "Preflop completo", plan: [["preflop", 10, { spots: ["rfi_ep", "rfi_mp", "rfi_co", "rfi_btn", "rfi_sb", "bb_co", "bb_mp", "bb_ep", "bb_btn", "bb_sb"] }], ["preflop", 8, { spots: ["btn_co", "btn_mp", "btn_ep", "co_mp", "co_ep", "mp_ep", "sb_btn", "sb_co", "sb_mp", "sb_ep"] }], ["preflop", 10, { spots: ["btn_vs_sb3", "btn_vs_bb3", "co_vs_btn3", "co_vs_sb3", "co_vs_bb3", "mp_vs_sb3", "mp_vs_bb3", "ep_vs_sb3", "ep_vs_bb3", "sb_vs_bb3", "mp_vs_btn3", "mp_vs_co3", "ep_vs_btn3", "ep_vs_co3", "ep_vs_mp3"] }]] },
    { t: "Mista", plan: [["cbet", 10], ["bbdef", 6], ["turn", 6], ["concetti", 6], ["blocker", 3]] },
    { t: "Esame finale", exam: true, plan: [["preflop", 10], ["flopbtn", 6], ["flopbvb", 5], ["bbdef", 6], ["cbet", 8], ["turn", 6], ["concetti", 8], ["size", 6]] }] },

  { t: "Settimana 7 · Squeeze, 4-bet e piatti grossi", d: "Squeeze e cold 4-bet preflop, piatti 4-bet con SPR basso, 3-bet pot BvB fuori posizione.", s: [
    { t: "Squeeze", plan: [["preflop", 12, { spots: ["sq_bb_co", "sq_sb_co", "sq_bb_btn", "sq_btn_mp"] }], ["preflop", 6, { spots: ["bb_co", "bb_btn", "sb_co", "btn_mp"] }], ["concetti", 3]] },
    { t: "Cold 4-bet", plan: [["preflop", 10, { spots: ["c4_btn_mp", "c4_sb_co", "c4_bb_btn"] }], ["preflop", 8, { spots: ["btn_vs_bb3", "co_vs_btn3", "sb_vs_bb3", "btn_vs_sb3"] }]] },
    { t: "Piatti 4-bet", plan: [["p4bet", 12], ["preflop", 6, { spots: ["c4_btn_mp", "c4_sb_co", "c4_bb_btn"] }], ["math", 4]] },
    { t: "3-bet pot BvB fuori posizione", plan: [["preflop", 6, { spots: ["sb_vs_bb3", "bb_sb"] }], ["bvb3", 12], ["outs", 4]] },
    { t: "Piatti grossi", exam: true, plan: [["preflop", 10, { spots: ["sq_bb_co", "sq_sb_co", "sq_bb_btn", "sq_btn_mp", "c4_btn_mp", "c4_sb_co", "c4_bb_btn"] }], ["p4bet", 8], ["bvb3", 8], ["mindset", 3]] }] },
];
