/* ================= ESERCIZI VISIVI: si risponde agendo sul tavolo =================
   «Tocca il posto» (posizioni e ordine di parola), «La mano migliore» (5 carte su 7 e chi vince allo showdown),
   «Scegli la size» (cursore della puntata) e «Da bb a euro» (bui e buy-in ai vari limiti).
   Usano il runner come gli altri drill: q.optSel per rispondere toccando un posto, q.submit per confermare una scelta. */

/* ---------- Tocca il posto ---------- */
const SQ_NM = { EP: "UTG", MP: "HJ", CO: "CO", BTN: "BTN", SB: "SB", BB: "BB" };
const SQ_POST = ["SB", "BB", "EP", "MP", "CO", "BTN"];
const SQ_ORDER = "SB, BB, UTG, HJ, CO, BTN";
/* articoli: l'UTG, l'HJ, il CO, il BTN, lo SB, il BB */
const SQ_IL = { EP: "l'", MP: "l'", CO: "il ", BTN: "il ", SB: "lo ", BB: "il " }, SQ_DEL = { EP: "dell'", MP: "dell'", CO: "del ", BTN: "del ", SB: "dello ", BB: "del " };
const sqIl = (p, b) => SQ_IL[p] + (b ? `<b>${SQ_NM[p]}</b>` : SQ_NM[p]);
const sqList = a => { const n = a.map(p => `<b>${SQ_NM[p]}</b>`); return n.length < 2 ? n.join("") : n.slice(0, -1).join(", ") + " e " + n[n.length - 1]; };
DRILLS.seat = {
  name: "Tocca il posto", short: "Posti", time: 25,
  desc: "Il tavolo 6-max senza nomi: trova i posti partendo dal bottone, chi parla per primo e chi è in posizione. Rispondi toccando il posto.",
  rule: "Il bottone (D) è il punto di partenza: alla sua sinistra lo small blind, poi il big blind, l'UTG, l'HJ e il CO. Preflop parla per primo l'UTG e per ultimo il big blind; dal flop in poi l'ordine è SB, BB, UTG, HJ, CO, BTN.",
  sample() {
    const k = pick(["find", "find", "find", "first_pre", "last_pre", "first_post", "inpos", "inpos", "blind"]), hero = pick(P6);
    const p = { k, hero };
    if (k === "find") p.ans = pick(P6.filter(x => x !== hero && x !== "BTN"));
    else if (k === "first_pre") p.ans = "EP";
    else if (k === "last_pre") p.ans = "BB";
    else if (k === "blind") p.ans = pick(["SB", "BB"]);
    else {
      /* al flop: 2-4 giocatori ancora in mano, gli altri hanno foldato */
      p.act = shuffle(P6).slice(0, k === "inpos" ? 2 : rint(2, 4));
      const inHand = SQ_POST.filter(x => p.act.includes(x));
      p.ans = k === "inpos" ? inHand[inHand.length - 1] : inHand[0];
    }
    p.hc = dealCards(2).join("");
    return p;
  },
  build(p) {
    const seats = {}; P6.forEach(x => { seats[x] = { st: p.act && !p.act.includes(x) ? "fold" : "wait" }; });
    const heroIn = !p.act || p.act.includes(p.hero);
    /* i nomi dei posti sono nascosti: si scoprono dopo la risposta */
    const tbl = sixTable({ hero: p.hero, seats, pot: 0, heroCards: heroIn ? p.hc : "" })
      .replace(/<div class="p6-plate"><b>([^<]*)<\/b><span>[^<]*<\/span><\/div>/g, (m, t) => { const me = t.startsWith("Tu · "), pos = me ? t.slice(5) : t; return `<div class="p6-plate"><b data-pos="${SQ_NM[pos] || pos}">${me ? "Tu" : "?"}</b></div>`; });
    const N = SQ_NM[p.ans];
    const ask = {
      find: `Il bottone del dealer <b class="sq-d">D</b> è qui. Tocca il posto ${SQ_DEL[p.ans]}<b>${N}</b>.`,
      first_pre: "Inizia una nuova mano. Chi parla per primo <b>preflop</b>? Tocca il suo posto.",
      last_pre: "Preflop, chi parla per <b>ultimo</b>? Tocca il suo posto.",
      blind: `Chi mette il <b>${p.ans === "SB" ? "small blind" : "big blind"}</b> in questa mano? Tocca il suo posto.`,
      first_post: `Siamo al flop: in mano restano i ${p.act ? p.act.length : 0} giocatori con le carte, gli altri hanno foldato. Chi parla per <b>primo</b>?`,
      inpos: "Siamo al flop e in mano restano in due. Chi è <b>in posizione</b>, cioè parla per ultimo?",
    }[p.k];
    const off = (P6.indexOf(p.ans) - P6.indexOf("BTN") + 6) % 6;
    const where = ["", "è il primo posto alla sinistra del bottone", "è il secondo posto alla sinistra del bottone", "è il terzo posto alla sinistra del bottone, subito dopo il big blind", "è il quarto posto alla sinistra del bottone, cioè due posti alla sua destra", "è il posto subito alla destra del bottone"][off];
    const why = {
      find: `<p>Dal bottone si conta un posto alla volta: SB, BB, UTG, HJ, CO. ${sqIl(p.ans, true).replace(/^./, c => c.toUpperCase())} ${where}.</p>`,
      first_pre: "<p>Preflop i bui hanno già messo i loro soldi, quindi parla per primo il posto subito dopo il big blind: l'<b>UTG</b>, il terzo alla sinistra del bottone. Il big blind parla per ultimo.</p>",
      last_pre: "<p>Il <b>big blind</b> parla per ultimo preflop: ha già messo 1bb e chiude il giro. Dal flop in poi, invece, l'ultimo è il bottone.</p>",
      blind: "<p>Lo <b>small blind</b> è il primo posto alla sinistra del bottone, il <b>big blind</b> il secondo. Il bottone gira di un posto a ogni mano, e con lui i bui.</p>",
      first_post: `<p>Dal flop in poi l'ordine è ${SQ_ORDER}: parla per primo chi è più vicino alla sinistra del bottone. Tra ${sqList(p.act || [])} parla per primo ${sqIl(p.ans, true)}.</p>`,
      inpos: `<p>In posizione è chi parla per ultimo dopo il flop. Nell'ordine ${SQ_ORDER}, tra ${sqList(p.act || [])} viene dopo ${sqIl(p.ans, true)}: vede sempre cosa fa l'altro prima di decidere.</p>`,
    }[p.k];
    return {
      title: "Tocca il posto", lesId: "cash",
      body: `<p class="qtitle">${ask}</p><div class="seatq">${tbl}</div>`,
      noOpts: true, optSel: ".seatq .p6-seat", opts: P6.map(x => ({ label: SQ_NM[x], v: x })), timed: false,
      mount() {
        document.querySelectorAll(".seatq .p6-seat").forEach((el, i) => {
          el.dataset.k = i; el.classList.add("pick"); el.tabIndex = 0; el.setAttribute("role", "button");
          el.setAttribute("aria-label", el.classList.contains("me") ? "Il tuo posto" : `Posto ${i + 1}${el.classList.contains("fold") ? ", ha foldato" : ""}`);
          el.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); } };
        });
      },
      after() { document.querySelectorAll(".seatq .p6-plate b[data-pos]").forEach(b => { b.textContent = (b.textContent === "Tu" ? "Tu · " : "") + b.dataset.pos; b.parentElement.classList.add("shown"); }); },
      check(v) { return { score: v === p.ans ? 100 : 0, correct: p.ans, expl: why }; },
    };
  },
};

/* ---------- La mano migliore: 5 carte su 7, oppure chi vince allo showdown ---------- */
function bhBest(cs) {
  /* il miglior gruppo di 5 carte tra 7: si provano tutte le 21 combinazioni */
  const all = djCs(cs.join("")), best = djEval(all); let set = null;
  for (let a = 0; a < 7 && !set; a++) for (let b = a + 1; b < 7 && !set; b++) { const five = cs.filter((_, i) => i !== a && i !== b); if (djEval(djCs(five.join(""))) === best) set = five; }
  /* come si legge una mano: prima le carte ripetute (il tris del full, la coppia), poi dalla più alta */
  const S5 = set || cs.slice(0, 5), cnt = r => S5.filter(c => c[0] === r).length;
  return { v: best, set: S5.sort((x, y) => cnt(y[0]) - cnt(x[0]) || RANKS.indexOf(y[0]) - RANKS.indexOf(x[0])) };
}
DRILLS.best = {
  name: "La mano migliore", short: "Mano migliore", time: 45,
  desc: "Scegli le 5 carte che formano la mano migliore tra le tue 2 e le 5 del board, e scopri chi vince allo showdown.",
  rule: "La mano è sempre di 5 carte, scelte tra le 7 a disposizione: puoi usare tutte e due le tue carte, una sola o nessuna. A parità di combinazione decidono le carte più alte, il kicker.",
  sample() {
    if (Math.random() < 0.6) {
      /* una combinazione scelta a caso, così escono anche scale, colori e full */
      const want = pick([0, 1, 1, 2, 2, 3, 4, 5, 6]); let cs, n = 0;
      do { cs = dealCards(7); } while (djCat(djEval(djCs(cs.join("")))) !== want && ++n < 600);
      return { m: "five", h: cs.slice(0, 2).join(""), b: cs.slice(2).join("") };
    }
    const np = pick([2, 2, 3]), cs = dealCards(np * 2 + 5);
    return { m: "win", hs: Array.from({ length: np }, (_, i) => cs.slice(i * 2, i * 2 + 2).join("")), b: cs.slice(np * 2).join(""), who: Array.from({ length: np }, (_, i) => AQ[aqPick("bw" + i)][0]) };
  },
  build(p) {
    const bc = p.b.match(/../g);
    if (p.m === "five") {
      const hc = p.h.match(/../g), cs = [...bc, ...hc], B = bhBest(cs), heroUsed = B.set.filter(c => hc.includes(c)).length;
      const btn = (c, i) => `<button type="button" class="bh-c" data-bc="${i}" aria-pressed="false">${card(c)}</button>`;
      let sel = [];
      return {
        title: "La mano migliore", lesId: "hands",
        body: `<p class="qtitle">Tocca le <b>5 carte</b> che formano la tua mano migliore. Puoi usare le tue carte, quelle del board o entrambe.</p>
          <div class="bh"><div class="bh-row"><small>Board</small><div class="bh-cards">${bc.map((c, i) => btn(c, i)).join("")}</div></div>
          <div class="bh-row me"><small>Le tue carte</small><div class="bh-cards">${hc.map((c, i) => btn(c, i + 5)).join("")}</div></div>
          <p class="bh-cnt" aria-live="polite"><b data-bhn>0</b> di 5 scelte</p></div>`,
        noOpts: true, submit: "Conferma le 5 carte", submitOff: true, opts: [], timed: false,
        mount() {
          const upd = () => { const n = sel.length, c = document.querySelector("[data-bhn]"), s = document.getElementById("submitSl"); if (c) c.textContent = n; if (s) s.disabled = n !== 5; };
          document.querySelectorAll(".bh-c").forEach(b => b.onclick = () => {
            if (run.stage !== "q") return;
            const i = +b.dataset.bc, k = sel.indexOf(i);
            if (k >= 0) sel.splice(k, 1); else if (sel.length < 5) sel.push(i); else { b.classList.remove("no"); void b.offsetWidth; b.classList.add("no"); return; }
            b.classList.toggle("on", k < 0); b.setAttribute("aria-pressed", String(k < 0)); upd();
          });
        },
        read: () => sel.slice(),
        after() { document.querySelectorAll(".bh-c").forEach(b => { const c = cs[+b.dataset.bc]; b.disabled = true; b.classList.toggle("best", B.set.includes(c)); b.classList.toggle("miss", b.classList.contains("on") && !B.set.includes(c)); }); },
        check(s) {
          const mine = (s || []).map(i => cs[i]), v = mine.length === 5 ? djEval(djCs(mine.join(""))) : -1;
          const score = v === B.v ? 100 : v >= 0 && djCat(v) === djCat(B.v) ? 50 : 0;
          const tip = heroUsed === 0 ? "Qui la mano migliore è tutta sul board: le tue carte non la migliorano, e allo showdown chi ha lo stesso board divide il piatto." : djCat(B.v) === 0 ? "Senza coppie conta la carta più alta, poi la seconda, e così via fino alla quinta." : djCat(B.v) === 5 ? "Per il colore servono 5 carte dello stesso seme: se ce ne sono di più, tieni le 5 più alte." : djCat(B.v) === 4 ? "Per la scala servono 5 carte di valore consecutivo; i semi non contano." : "Dopo la combinazione, le carte che restano si scelgono tra le più alte: sono i kicker.";
          return { score, correct: null, expl: `<p>La mano migliore è <b>${djName(B.v)}</b>: ${cardsHtml(B.set.join(""))}</p>${score < 100 && v >= 0 ? `<p>Le tue 5 carte fanno ${djName(v)}${score === 50 ? ": la combinazione è giusta, ma esistono carte più alte da tenere." : "."}</p>` : ""}<p class="muted">${tip}</p>` };
        },
      };
    }
    const vs = p.hs.map(h => djEval(djCs(h + p.b))), top = Math.max(...vs), win = vs.map((v, i) => v === top ? i : -1).filter(i => i >= 0);
    const ans = win.length > 1 ? "split" : win[0];
    const who = p.who || p.hs.map((_, i) => "Giocatore " + (i + 1));
    return {
      title: "Chi vince allo showdown?", lesId: "hands",
      body: `<div class="bw-felt"><span class="bw-st">River</span><div class="bw-board">${cardsHtml(p.b)}</div></div><p class="qtitle">Tutti hanno mostrato le carte. Chi vince il piatto?</p>`,
      layout: "", timed: false,
      opts: [...p.hs.map((h, i) => ({ label: `<span class="bw-o">${aqAvatarOf(who[i], false)}<span class="bw-n">${esc(who[i])}</span>${cardsHtml(h, true)}</span>`, v: i })), { label: "Pareggio: si dividono il piatto", v: "split" }],
      check(v) {
        const li = p.hs.map((h, i) => `<li>${esc(who[i])}: <b>${djName(vs[i])}</b>${win.includes(i) ? " ✓" : ""}</li>`).join("");
        const end = win.length > 1 ? `<p>${win.map(i => esc(who[i])).join(" e ")} hanno la stessa mano di 5 carte: si dividono il piatto.</p>` : `<p>Vince <b>${esc(who[win[0]])}</b>.</p>`;
        return { score: v === ans ? 100 : 0, correct: ans, expl: `<ul class="bw-l">${li}</ul>${end}<p class="muted">Ognuno usa le 5 carte migliori tra le sue 2 e le 5 del board.</p>` };
      },
    };
  },
};

/* ---------- Scegli la size: il cursore della puntata ---------- */
const BS_FR = [[1, 3, "1/3"], [1, 2, "1/2"], [2, 3, "2/3"], [3, 4, "3/4"], [1, 1, "piatto"]];
const BS_ST = ["Al flop", "Al turn", "Al river"];
DRILLS.betsize = {
  name: "Scegli la size", short: "Scegli size", time: 40,
  desc: "Trascina il cursore fino alla puntata giusta: frazioni del piatto e rilanci preflop, in big blind.",
  rule: "Una puntata di 1/2 è metà del piatto, 1/3 è il piatto diviso 3, 2/3 è il doppio di un terzo, 3/4 è metà più metà della metà. Preflop la 3-bet è 3 volte l'apertura in posizione e 4 volte fuori posizione.",
  sample() {
    if (Math.random() < 0.3) { const ip = Math.random() < 0.6; return { k: "pre", open: pick([2, 2.5, 3]), ip }; }
    const f = pick(BS_FR), pots = [6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 24, 27, 30, 36, 40].filter(x => (x * f[0]) % f[1] === 0 || (x * f[0] * 2) % f[1] === 0);
    return { k: "frac", f: BS_FR.indexOf(f), pot: pick(pots), st: rint(0, 2) };
  },
  build(p) {
    const pre = p.k === "pre", f = BS_FR[p.f || 0], mult = p.ip ? 3 : 4;
    const target = pre ? p.open * mult : p.pot * f[0] / f[1], max = pre ? 15 : Math.ceil(p.pot * 1.25 * 2) / 2;
    const ask = pre ? `${p.ip ? "Sei al BTN e il CO" : "Sei nello SB e il BTN"} apre a <b>${fmtBB(p.open)}</b>. Fai la 3‑bet della size standard: <b>${p.ip ? "in posizione, 3 volte" : "fuori posizione, 4 volte"}</b> l'apertura.`
      : `${BS_ST[p.st]} il piatto è <b>${fmtBB(p.pot)}</b>. Punta <b>${f[2] === "piatto" ? "quanto il piatto" : f[2] + " del piatto"}</b>.`;
    return {
      title: "Scegli la size",
      body: `<p class="qtitle">${ask} Trascina il cursore fino alla puntata giusta.</p>
        <div class="bs"><div class="bs-felt"><div class="bs-pot"><span class="qchips">${Array.from({ length: 4 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</span><span>${pre ? "Apertura" : "Piatto"} <b>${fmtBB(pre ? p.open : p.pot)}</b></span></div>
          <div class="bs-bet"><span class="bs-stack" data-bss></span><b data-bsv>0bb</b><small data-bsp>${pre ? "0x l'apertura" : "0% del piatto"}</small></div></div>
          <div class="bs-ctl"><button type="button" class="bs-step" data-bsd="-1" aria-label="Meno 0,5bb">−</button><input type="range" class="bs-range" min="0" max="${max}" step="0.5" value="0" aria-label="La tua puntata in big blind"><button type="button" class="bs-step" data-bsd="1" aria-label="Più 0,5bb">+</button></div>
          <div class="bs-scale"><span>0</span><span>${fmtBB(max)}</span></div></div>`,
      noOpts: true, submit: "Punta", opts: [], timed: false,
      mount() {
        const r = document.querySelector(".bs-range"); if (!r) return;
        const upd = () => { const v = +r.value, n = Math.min(12, Math.round(v / max * 12)); document.querySelector("[data-bsv]").textContent = fmtBB(v); document.querySelector("[data-bsp]").textContent = pre ? `${fmt(v / p.open, 1)}x l'apertura` : `${Math.round(v / p.pot * 100)}% del piatto`; document.querySelector("[data-bss]").innerHTML = `<span class="qchips" style="height:${8 + n * 4}px">${Array.from({ length: n }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</span>`; r.style.setProperty("--p", (v / max * 100) + "%"); };
        r.oninput = upd; upd();
        document.querySelectorAll("[data-bsd]").forEach(b => b.onclick = () => { if (run.stage !== "q") return; r.value = Math.min(max, Math.max(0, +r.value + 0.5 * +b.dataset.bsd)); upd(); });
      },
      read: () => +(document.querySelector(".bs-range") || { value: 0 }).value,
      after() { document.querySelectorAll(".bs-range, [data-bsd]").forEach(x => { x.disabled = true; }); },
      check(v) {
        const d = Math.abs(v - target), score = d <= 0.25 ? 100 : d <= target * 0.12 ? 50 : 0;
        const how = pre ? `<p>${p.ip ? "In posizione" : "Fuori posizione"} la 3‑bet è ${mult} volte l'apertura: ${fmtN(p.open)} × ${mult} = <b>${fmtBB(target)}</b>.${p.ip ? "" : " Fuori posizione si rilancia di più perché chi paga giocherà in posizione."}</p>`
          : `<p>${f[2] === "piatto" ? "Una puntata quanto il piatto" : f[2] + " di " + fmtBB(p.pot)} = ${f[2] === "piatto" ? fmtBB(p.pot) : `${fmtN(p.pot)} × ${f[0]} ÷ ${f[1]}`} = <b>${fmtBB(target)}</b>.</p><p class="muted">${{ "1/3": "Un terzo: dividi il piatto per 3.", "1/2": "Metà piatto: dividi per 2.", "2/3": "Due terzi: trova un terzo e raddoppialo.", "3/4": "Tre quarti: metà piatto più la metà della metà.", piatto: "Quanto il piatto: la puntata è uguale al piatto." }[f[2]]}</p>`;
        return { score, correct: null, expl: `${how}${score < 100 ? `<p>Hai puntato ${fmtBB(v)}${score === 50 ? ": ci sei vicino." : "."}</p>` : ""}` };
      },
    };
  },
};

/* ---------- Da bb a euro ---------- */
const BE_LIM = [["NL2", 0.02, "0,01 / 0,02 €"], ["NL5", 0.05, "0,02 / 0,05 €"], ["NL10", 0.1, "0,05 / 0,10 €"], ["NL25", 0.25, "0,10 / 0,25 €"], ["NL50", 0.5, "0,25 / 0,50 €"], ["NL100", 1, "0,50 / 1 €"], ["NL200", 2, "1 / 2 €"]];
const beEu = x => (Math.round(x * 100) / 100).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
DRILLS.bbeuro = {
  name: "Da bb a euro", short: "bb ed euro", time: 30,
  desc: "Passa dai big blind agli euro e ritorno, ai vari limiti: stack, piatti e buy-in.",
  rule: "Il numero dopo NL è il buy-in pieno in euro, cioè 100 big blind: a NL25 100bb sono 25 €, quindi 1bb vale 0,25 €. Per passare da bb a euro moltiplichi per il valore del big blind, per tornare indietro dividi.",
  sample() {
    const k = pick(["toeur", "toeur", "tobb", "tobb", "buyin"]), li = rint(0, BE_LIM.length - 1);
    return { k, li, n: pick([15, 20, 25, 30, 40, 50, 60, 75, 80, 120, 150, 200, 250]) };
  },
  build(p) {
    const [nl, bb, bui] = BE_LIM[p.li], n = p.k === "buyin" ? 100 : p.n;
    const right = p.k === "tobb" ? n : n * bb;
    const fmtV = p.k === "tobb" ? fmtBB : beEu;
    const pool = [right * 10, right / 10, right / 2, right * 2, right * 100].filter(x => x !== right && (p.k !== "tobb" || Number.isInteger(x * 2)));
    const seen = new Set([fmtV(right)]), wrong = [];
    shuffle(pool).forEach(x => { const t = fmtV(x); if (wrong.length < 3 && !seen.has(t)) { seen.add(t); wrong.push(x); } });
    const ask = p.k === "toeur" ? `A ${nl} hai uno stack di <b>${fmtBB(n)}</b>. Quanti euro sono?` : p.k === "tobb" ? `A ${nl} il piatto è di <b>${beEu(n * bb)}</b>. Quanti big blind sono?` : `Quanto costa un <b>buy-in pieno</b> (100bb) a ${nl}?`;
    const show = p.k === "tobb" ? beEu(n * bb) : fmtBB(n);
    return {
      title: "Da bb a euro", lesId: "bankroll",
      body: `<div class="be"><div class="be-lim"><b>${nl}</b><span>bui ${bui}</span></div><div class="be-stk"><span class="qchips" style="height:${12 + Math.min(10, Math.round(n / 25)) * 4}px">${Array.from({ length: Math.min(10, Math.max(2, Math.round(n / 25))) }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</span><b>${show}</b></div></div><p class="qtitle">${ask}</p>`,
      layout: "cols2", timed: false,
      opts: shuffle([right, ...wrong]).map(x => ({ label: fmtV(x), v: fmtV(x) })),
      check(v) {
        const how = p.k === "tobb" ? `${beEu(n * bb)} ÷ ${beEu(bb)} = <b>${fmtBB(n)}</b>` : `${fmtBB(n)} × ${beEu(bb)} = <b>${beEu(n * bb)}</b>`;
        return { score: v === fmtV(right) ? 100 : 0, correct: fmtV(right), expl: `<p>A ${nl} il big blind vale ${beEu(bb)}: ${how}.</p><p class="muted">Il numero dopo NL è il buy-in pieno in euro: a ${nl} 100bb sono ${beEu(100 * bb)}.</p>` };
      },
    };
  },
};
