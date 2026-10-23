/* ================= TERMINI DEL POKER: la spiegazione al passaggio del mouse =================
   Nelle lezioni del NL2 (e nella fase 0) ogni termine del poker (BB, CO, flop, rake...) mostra cosa significa
   quando ci passi sopra con il mouse, o quando lo tocchi sul telefono. Il termine non è sottolineato né colorato:
   solo il cursore cambia. Vale per ogni volta che il termine compare.
   Le definizioni vengono dal glossario delle lezioni (GLOSS) quando c'è, altrimenti da TERMS qui sotto. */
const TIP_LV = ["nl2", "f0"];
/* [varianti, definizione, maiuscole esatte] */
const TERMS = [
  [["UTG"], "Under the gun: il primo a parlare preflop, subito a sinistra del big blind.", 1],
  [["HJ"], "Hijack: il posto dopo l'UTG, due posti a destra del bottone.", 1],
  [["CO"], "Cutoff: il posto subito a destra del bottone, il penultimo a parlare preflop.", 1],
  [["BTN"], "Il bottone: il posto del dealer. Dal flop in poi parla sempre per ultimo, ed è la posizione migliore.", 1],
  [["SB"], "Small blind: il primo posto a sinistra del bottone. Mette 0,5bb prima che arrivino le carte.", 1],
  [["BB"], "Big blind: il secondo posto a sinistra del bottone. Mette 1bb prima che arrivino le carte e preflop parla per ultimo.", 1],
  [["EP"], "Early position: le posizioni che parlano per prime preflop. Al 6-max è l'UTG.", 1],
  [["MP"], "Middle position: le posizioni di mezzo. Al 6-max è l'HJ.", 1],
  [["IP"], "In posizione: parli dopo l'avversario nelle street dopo il flop.", 1],
  [["OOP"], "Fuori posizione: parli prima dell'avversario nelle street dopo il flop.", 1],
  [["bb"], "Big blind: l'unità di misura del poker. Puntate, piatti e stack si contano in big blind, così valgono per ogni limite.", 1],
  [["big blind"], "Il buio grande: la puntata obbligatoria del secondo posto a sinistra del bottone, 1bb. È anche l'unità di misura delle puntate."],
  [["small blind"], "Il buio piccolo: la puntata obbligatoria del primo posto a sinistra del bottone, mezzo big blind."],
  [["bui", "blind"], "Le due puntate obbligatorie, small blind e big blind, messe prima di vedere le carte: creano un piatto da giocare."],
  [["bottone", "button", "dealer"], "Il segno del dealer: chi ce l'ha davanti parla per ultimo dal flop in poi. Gira di un posto a ogni mano."],
  [["6-max"], "Un tavolo da 6 giocatori al massimo: UTG, HJ, CO, BTN, SB e BB."],
  [["cash game", "cash"], "Il poker a soldi veri al tavolo: le fiches valgono denaro, puoi sederti e alzarti quando vuoi, e i bui non salgono."],
  [["No Limit"], "Puoi puntare qualsiasi cifra, fino a tutte le fiches che hai davanti."],
  [["room"], "Il sito di poker che organizza i tavoli e trattiene la rake."],
  [["preflop"], "Il primo giro di puntate, dopo che ognuno ha ricevuto le sue 2 carte e prima del flop."],
  [["flop"], "Le prime 3 carte comuni scoperte al centro del tavolo, e il giro di puntate che segue."],
  [["turn"], "La quarta carta comune, e il giro di puntate che segue."],
  [["river"], "La quinta e ultima carta comune, e l'ultimo giro di puntate."],
  [["board"], "Le carte comuni scoperte al centro del tavolo, che usano tutti i giocatori."],
  [["street"], "Uno dei giri di puntate: preflop, flop, turn o river."],
  [["fold", "folda", "foldano", "foldare", "foldi", "foldo", "foldato", "foldata", "foldati", "foldando"], "Lasciare la mano: butti le carte e non rischi altro, ma perdi quello che hai già messo nel piatto."],
  [["check", "checka", "checki", "checkano", "checkare", "checkato", "checkata"], "Non puntare e lasciare la parola al giocatore dopo, restando nella mano. Si può solo se nessuno ha puntato prima in quel giro."],
  [["call"], "Pagare la puntata o il rilancio dell'avversario per restare nella mano."],
  [["bet"], "Una puntata: la prima messa in un giro di puntate."],
  [["raise", "rilancio", "rilanci"], "Un rilancio: alzi la puntata di chi ha parlato prima di te."],
  [["ante"], "Una piccola puntata obbligatoria che in alcune partite mettono tutti i giocatori prima delle carte, oltre ai bui."],
  [["limp/raise"], "Limpare e poi, se qualcuno rilancia, rilanciare a propria volta."],
  [["overlimp"], "Limpare anche tu dopo che un altro giocatore ha già limpato."],
  [["limp-caller"], "Chi limpa e poi paga il rilancio di un altro giocatore."],
  [["iso raise"], "Il rilancio dopo uno o più limp, per giocare il piatto contro un solo avversario."],
  [["all-in"], "Mettere in mezzo tutte le fiches che hai davanti."],
  [["open-raise"], "Il primo rilancio preflop, quando prima di te hanno foldato tutti."],
  [["value bet", "value"], "Puntare per valore: lo fai perché ti pagano mani peggiori della tua."],
  [["bluff", "bluffare", "bluffa", "bluffi", "bluffano"], "Puntare con una mano debole perché l'avversario foldi una mano migliore della tua."],
  [["semi-bluff"], "Un bluff con un progetto: se lui paga, puoi ancora chiudere la mano migliore."],
  [["progetto", "progetti"], "Una mano non ancora fatta che può diventare forte con le carte che mancano, come 4 carte dello stesso seme."],
  [["top pair"], "La coppia fatta con la carta più alta del board."],
  [["overpair"], "Una coppia in mano più alta di tutte le carte del board."],
  [["nuts"], "La mano migliore possibile su quel board."],
  [["suited"], "Due carte dello stesso seme, come A♠K♠."],
  [["offsuit"], "Due carte di semi diversi, come A♠K♦."],
  [["buy-in"], "La cifra con cui ti siedi al tavolo. Il buy-in pieno è 100bb: a NL2 sono 2 €."],
  [["stack"], "Le fiches che un giocatore ha davanti."],
  [["varianza"], "L'oscillazione dei risultati dovuta alla fortuna: sul breve periodo può nascondere quanto stai giocando bene o male."],
  [["downswing"], "Un periodo di perdite più lungo del normale, dovuto alla varianza."],
  [["upswing"], "Un periodo di vincite più lungo del normale, dovuto alla varianza."],
  [["bad beat"], "Perdere una mano da grande favorito, per una carta che arriva all'ultimo."],
  [["cooler"], "Una mano molto forte che perde contro una ancora più forte: non potevi evitarlo."],
  [["fish"], "Un giocatore debole che gioca troppe mani e paga troppo: è da lui che arriva il guadagno."],
  [["reg"], "Regular: un giocatore abituale e preparato, che gioca tante mani con una strategia solida."],
  [["nit"], "Un giocatore molto chiuso: gioca solo mani fortissime e rischia pochissimo."],
  [["calling station"], "Un giocatore che paga quasi sempre e folda raramente: contro di lui si bluffa poco e si punta per valore."],
  [["maniac"], "Un giocatore che rilancia e punta di continuo, con mani di ogni tipo."],
  [["TAG"], "Tight-aggressive: gioca poche mani, ma quando entra rilancia e punta.", 1],
  [["LAG"], "Loose-aggressive: gioca molte mani e lo fa in modo aggressivo.", 1],
  [["EQR"], "Equity realization: quanta della sua equity un giocatore riesce a incassare davvero. In posizione di solito è più alta, fuori posizione più bassa.", 1],
  [["RTA"], "Real-time assistance: programmi che ti dicono cosa fare durante la mano. Sono vietati in tutte le room.", 1],
  [["heads-up"], "Un piatto, o un tavolo, con solo due giocatori."],
  [["size", "sizing"], "Quanto è grande una puntata, di solito come parte del piatto: 1/3, 1/2, 2/3."],
  [["spot"], "Una situazione di gioco precisa: posizioni, azioni, carte e stack."],
  [["in posizione"], "Parli dopo l'avversario nelle street dopo il flop: vedi cosa fa prima di decidere."],
  [["fuori posizione"], "Parli prima dell'avversario nelle street dopo il flop: decidi senza sapere cosa farà."],
  [["mani speculative"], "Mani come coppie basse e carte vicine dello stesso seme: vincono di rado, ma quando chiudono vincono molto."],
];
/* definizioni speciali: limiti (NL2, NL25...) e mani scritte in breve (AA, AK, AKs, T9o...) */
const TIP_RANK = { A: "assi", K: "re", Q: "donne", J: "jack", T: "dieci" };
const TIP_R1 = { A: "asso", K: "re", Q: "donna", J: "jack", T: "10" };
function tipSpecial(w) {
  let m = /^NL(\d+)$/.exec(w);
  if (m) { const bb = +m[1] / 100; return `No Limit con big blind da ${bb.toLocaleString("it-IT", { minimumFractionDigits: bb < 1 ? 2 : 0 })} €: il buy-in pieno (100bb) è ${m[1]} €.`; }
  if (/^([AKQJT])\1$/.test(w)) return `Una coppia di ${TIP_RANK[w[0]]} in mano.`;
  m = /^([AKQJT2-9])([AKQJT2-9])([so]?)$/.exec(w);
  if (m) { const n = r => TIP_R1[r] || r; return `Una mano con ${n(m[1])} e ${n(m[2])}${m[3] === "s" ? " dello stesso seme (suited)" : m[3] === "o" ? " di semi diversi (offsuit)" : ", di qualsiasi seme"}.`; }
  return "";
}
/* indice: maiuscole esatte prima, poi in minuscolo; le voci del glossario delle lezioni hanno la precedenza */
const TIP_EX = {}, TIP_CI = {};
TERMS.forEach(([vs, d, cs]) => vs.forEach(v => { if (cs) TIP_EX[v] = d; else TIP_CI[v.toLowerCase()] = d; }));
GLOSS.forEach(([vs, d]) => vs.forEach(v => { if (/^[A-Z0-9/]+$/.test(v)) TIP_EX[v] = d; else TIP_CI[v.toLowerCase()] = d; }));
const tipEsc = s => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const TIP_W = "A-Za-z0-9À-ÿ";
const TIP_RE = (() => {
  const all = [...new Set([...Object.keys(TIP_EX), ...Object.keys(TIP_CI)])].sort((a, b) => b.length - a.length).map(tipEsc);
  const special = ["NL\\d+", "(?:AA|KK|QQ|JJ|TT)", "(?:[AKQJT][AKQJT2-9]|[2-9][AKQJT])[so]?"];
  return new RegExp(`(?<![${TIP_W}/-])(${all.join("|")}|${special.join("|")})(?![${TIP_W}-])|(?<=\\d)(bb)(?![${TIP_W}/])`, "gi");
})();
function tipDef(w) {
  if (TIP_EX[w]) return TIP_EX[w];
  const sp = tipSpecial(w); if (sp) return sp;
  /* le sigle (BB, CO, EV) valgono solo scritte esattamente così; le parole (flop, Fold) in qualsiasi forma */
  return Object.prototype.hasOwnProperty.call(TIP_CI, w.toLowerCase()) ? TIP_CI[w.toLowerCase()] : "";
}
/* dove non toccare il testo: grafica, pulsanti, carte, tavoli animati, termini già marcati */
const TIP_SKIP = "svg,style,script,button,select,option,textarea,label,a,.lx-gl,.lx-tip,.lx-c,.lx-ha,.lx-ha-sr,.p6,.ptbl,.pc,.cards,.lx-hud-box,code";
const TIP_CACHE = {};
function tipWrap(html) {
  const t = document.createElement("template"); t.innerHTML = html;
  const w = document.createTreeWalker(t.content, NodeFilter.SHOW_TEXT), nodes = [];
  while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => {
    const p = n.parentElement, s = n.nodeValue; if (!s || !s.trim() || (p && p.closest(TIP_SKIP))) return;
    TIP_RE.lastIndex = 0; if (!TIP_RE.test(s)) return; TIP_RE.lastIndex = 0;
    const f = document.createDocumentFragment(); let last = 0, m;
    while ((m = TIP_RE.exec(s))) {
      const word = m[1] || m[2], d = m[2] ? TIP_EX.bb : tipDef(word);
      if (!d) continue;
      if (m.index > last) f.appendChild(document.createTextNode(s.slice(last, m.index)));
      const sp = document.createElement("span"); sp.className = "lx-tip"; sp.dataset.tip = d; sp.textContent = word; f.appendChild(sp);
      last = m.index + m[0].length;
    }
    if (!last) return;
    if (last < s.length) f.appendChild(document.createTextNode(s.slice(last)));
    /* il testo resta un pezzo solo: dentro un contenitore flex o grid ogni span sarebbe un elemento a parte e la riga non andrebbe più a capo */
    const w = document.createElement("span"); w.className = "lx-tipw"; w.appendChild(f); n.replaceWith(w);
  });
  return t.innerHTML;
}
/* le schede delle lezioni passano tutte da lesGloss: qui si aggiungono le spiegazioni */
const _lesGlossT = lesGloss;
lesGloss = function (id, html) {
  const out = _lesGlossT(id, html), L = LESSONS[id];
  if (!L || !TIP_LV.includes(L.lv)) return out;
  const k = id + "|" + out.length;
  return TIP_CACHE[k] || (TIP_CACHE[k] = tipWrap(out));
};

/* ---------- il fumetto ---------- */
let tipBox = null, tipEl = null, tipT = null, tipTouch = false;
function tipText(el) {
  if (el.dataset.tip) return { t: el.textContent, d: el.dataset.tip };
  const G = GLOSS[+el.dataset.gl]; if (!G) return null;
  const L = LESSONS[G[2]], n = typeof lesNum === "function" ? lesNum(G[2]) : "";
  return { t: el.textContent, d: G[1], more: L ? `Lo vedi nella lezione ${n ? n + " " : ""}«${L.t}».` : "" };
}
function tipShow(el) {
  const x = tipText(el); if (!x) return;
  if (!tipBox) { tipBox = document.createElement("div"); tipBox.className = "tipbox"; tipBox.id = "tipBox"; tipBox.setAttribute("role", "tooltip"); document.body.appendChild(tipBox); }
  tipBox.innerHTML = `<b>${esc(x.t)}</b> ${esc(x.d)}${x.more ? `<small>${esc(x.more)}</small>` : ""}`;
  tipEl = el; el.setAttribute("aria-describedby", "tipBox");
  tipBox.classList.remove("on", "below"); tipBox.style.left = "0px"; tipBox.style.top = "0px";
  const r = el.getBoundingClientRect(), b = tipBox.getBoundingClientRect(), vw = document.documentElement.clientWidth;
  let left = r.left + r.width / 2 - b.width / 2; left = Math.max(8, Math.min(vw - b.width - 8, left));
  let top = r.top - b.height - 10; const below = top < 8; if (below) top = r.bottom + 10;
  tipBox.style.left = left + scrollX + "px"; tipBox.style.top = top + scrollY + "px";
  tipBox.style.setProperty("--ax", Math.max(14, Math.min(b.width - 14, r.left + r.width / 2 - left)) + "px");
  tipBox.classList.toggle("below", below); tipBox.classList.add("on");
}
function tipHide() { clearTimeout(tipT); if (tipEl) tipEl.removeAttribute("aria-describedby"); tipEl = null; if (tipBox) tipBox.classList.remove("on"); }
const TIP_SEL = ".lx-tip,.lx-gl";
document.addEventListener("pointerdown", e => { tipTouch = e.pointerType !== "mouse"; }, true);
document.addEventListener("mouseover", e => {
  if (tipTouch || !e.target.closest) return;
  const el = e.target.closest(TIP_SEL); if (!el || el === tipEl) return;
  clearTimeout(tipT); tipT = setTimeout(() => tipShow(el), 220);
});
document.addEventListener("mouseout", e => {
  if (tipTouch || !e.target.closest) return;
  const el = e.target.closest(TIP_SEL); if (!el) return;
  if (e.relatedTarget && el.contains(e.relatedTarget)) return;
  clearTimeout(tipT); if (tipEl === el) tipHide();
});
/* tocco o clic: apre il fumetto; un altro tocco altrove lo chiude */
document.addEventListener("click", e => {
  const el = e.target.closest && e.target.closest(TIP_SEL);
  if (el) { e.preventDefault(); e.stopPropagation(); if (tipEl === el && tipTouch) tipHide(); else tipShow(el); return; }
  if (tipEl) tipHide();
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape" && tipEl) tipHide(); });
addEventListener("scroll", () => { if (tipEl && tipTouch) tipHide(); }, { passive: true });
