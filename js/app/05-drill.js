/* ================= DRILL ================= */
const DRILLS = {};

DRILLS.math = {
  name: "Matematica rapida", short: "Matematica", time: 20,
  desc: "Quanto devi vincere per chiamare, quanto deve foldare lui per il tuo bluff, quanto devi difenderti.",
  rule: "Tutto si riduce a <b>quanto rischi</b> contro <b>quanto puoi vincere</b>: rischio / (rischio + vincita). Esempio: rischi 10 per vincere 20 → 10 / 30 = 33%.",
  sample() {
    const P = pick([8, 10, 12, 15, 18, 20, 24, 30, 36, 40, 50, 60]);
    const f = pick([0.25, 0.33, 0.5, 0.66, 0.75, 1, 1.25, 1.5, 2]);
    return { P, B: Math.max(1, Math.round(P * f * 2) / 2), type: pick(["bluff", "call", "mdf"]) };
  },
  build({ P, B, type }) {
    const vals = { bluff: B / (P + B) * 100, call: B / (P + 2 * B) * 100, mdf: P / (P + B) * 100 };
    const ratio = `È una puntata di ${fmt(B / P, 2)} volte il piatto.`;
    let viz, q;
    if (type === "bluff") {
      viz = `<div class="potviz"><div class="pv k-pot"><span>Piatto</span><b>${bb(P)}</b></div><div class="plus">+</div><div class="pv bet k-bet k-mine"><span>La tua puntata (bluff)</span><b>${bb(B)}</b></div></div>`;
      q = `Punti ${bb(B)} in bluff con una mano che a showdown perde sempre. Rischi <b>${bb(B)}</b> per vincere i <b>${bb(P)}</b> del piatto. <br>Su 100 volte, <b>quante volte deve foldare l'avversario</b> perché il bluff vada in pari?`;
    } else if (type === "call") {
      viz = `<div class="potviz"><div class="pv k-pot"><span>Piatto</span><b>${bb(P)}</b></div><div class="plus">+</div><div class="pv bet k-bet"><span>Puntata avversario</span><b>${bb(B)}</b></div><div class="plus">→</div><div class="pv win k-win"><span>Se chiami, piatto finale</span><b>${bb(P + 2 * B)}</b></div></div>`;
      q = `Per chiamare metti <b>${bb(B)}</b> per vincere <b>${bb(P + B)}</b> (il piatto più la sua puntata). <br>Su 100 volte, <b>quante volte devi vincere la mano</b> perché il call vada in pari?`;
    } else {
      viz = `<div class="potviz"><div class="pv k-pot"><span>Piatto</span><b>${bb(P)}</b></div><div class="plus">+</div><div class="pv bet k-bet"><span>Puntata avversario</span><b>${bb(B)}</b></div></div>`;
      q = `Se foldi troppo spesso, l'avversario guadagna puntando con qualsiasi mano. <br>Su 100 mani con cui arrivi qui, <b>con quante devi almeno continuare</b> (call o raise) per non farti sfruttare?`;
    }
    const ans = Math.round(vals[type]);
    const set = new Set([ans]);
    for (const c of shuffle([Math.round(vals.bluff), Math.round(vals.call), Math.round(vals.mdf), Math.round(100 - vals[type]), ans + 8, ans - 7, ans + 13, ans - 12])) { if (set.size >= 4) break; if (c > 0 && c < 100 && ![...set].some(x => Math.abs(x - c) < 3)) set.add(c); }
    while (set.size < 4) set.add(ans + set.size * 5);
    const steps = {
      bluff: `<ol class="steps"><li>Rischi ${bb(B)}, puoi vincere ${bb(P)}.</li><li>Fold necessari = rischio / (rischio + vincita) = ${fmt(B, 1)} / ${fmt(P + B, 1)} = <b>${fmt(vals.bluff, 1)}%</b>.</li></ol><p>Se pensi che folderà meno di ${Math.round(vals.bluff)} volte su 100, il bluff perde soldi.</p>`,
      call: `<ol class="steps"><li>Rischi ${bb(B)}, puoi vincere ${bb(P + B)}.</li><li>Equity necessaria = rischio / (rischio + vincita) = ${fmt(B, 1)} / ${fmt(P + 2 * B, 1)} = <b>${fmt(vals.call, 1)}%</b>.</li></ol><p>Se vinci meno di ${Math.round(vals.call)} volte su 100, il call perde (a meno di vincite future).</p>`,
      mdf: `<ol class="steps"><li>Il suo bluff rischia ${bb(B)} per vincere ${bb(P)}.</li><li>Devi continuare con almeno piatto / (piatto + puntata) = ${fmt(P, 1)} / ${fmt(P + B, 1)} = <b>${fmt(vals.mdf, 1)}%</b> delle tue mani.</li></ol><p>È la MDF: con meno difesa, i suoi bluff guadagnano sempre.</p>`,
    }[type];
    return {
      title: { bluff: "Il tuo bluff conviene?", call: "Ti conviene chiamare?", mdf: "Quanto devi difenderti?" }[type],
      body: viz + `<p class="muted" style="margin:-4px 0 8px;font-size:13px">${ratio}</p><p class="qtitle">${q}</p>`,
      layout: "cols2", opts: shuffle([...set]).map(v => ({ label: v + " su 100 (" + v + "%)", v })), timed: true,
      check(v) { return { score: v === ans ? 100 : 0, correct: ans, expl: steps }; },
    };
  },
};

DRILLS.combo = {
  name: "Conteggio combo", short: "Combo", time: 25,
  desc: "In quanti modi diversi l'avversario può avere una certa mano, viste le carte già fuori.",
  rule: "Una mano come AK si può avere con 16 combinazioni di semi (4 × 4). Ogni asso o re che vedi sul board o in mano tua ne toglie. Una coppia come QQ ne ha 6.",
  sample() {
    let r1, r2, kind;
    if (Math.random() < 0.28) { r1 = r2 = pick("6789TJQKA".split("")); kind = "pair"; }
    else { const a = shuffle("56789TJQKA".split("")).slice(0, 2).sort((x, y) => rv(y) - rv(x)); r1 = a[0]; r2 = a[1]; kind = pick(["any", "any", "s", "o"]); }
    const deck = []; for (const r of RANKS) for (const s of SUITS) deck.push(r + s);
    const used = new Set(); const take = c => { used.add(c); return c; };
    const rc = pred => shuffle(deck.filter(c => !used.has(c) && (!pred || pred(c))))[0];
    const board = [];
    if (Math.random() < 0.7) board.push(take(rc(c => c[0] === r1)));
    if (kind !== "pair" && Math.random() < 0.35) board.push(take(rc(c => c[0] === r2)));
    while (board.length < 3) board.push(take(rc(c => c[0] !== r1 && c[0] !== r2)));
    const hero = [];
    if (Math.random() < 0.45) hero.push(take(rc(c => c[0] === (Math.random() < .5 ? r1 : r2))));
    while (hero.length < 2) hero.push(take(rc(c => c[0] !== r1 && c[0] !== r2)));
    return { r1, r2, kind, board: board.join(""), hero: hero.join("") };
  },
  build({ r1, r2, kind, board, hero }) {
    const dead = new Set([...(board.match(/../g)), ...(hero.match(/../g))]);
    const av = r => SUITS.split("").filter(s => !dead.has(r + s));
    const a1 = av(r1), a2 = av(r2);
    let n, expl;
    if (kind === "pair") { n = a1.length * (a1.length - 1) / 2; expl = `Restano ${a1.length} carte di ${rname(r1)} (le altre le vedi). Coppie possibili: ${a1.length} × ${a1.length - 1} / 2 = <b>${n}</b>.`; }
    else {
      const suited = SUITS.split("").filter(s => a1.includes(s) && a2.includes(s)).length;
      const all = a1.length * a2.length;
      n = kind === "any" ? all : kind === "s" ? suited : all - suited;
      expl = `Restano ${a1.length} carte di ${rname(r1)} e ${a2.length} di ${rname(r2)}: ${a1.length} × ${a2.length} = ${all} combinazioni, di cui ${suited} dello stesso seme (suited) e ${all - suited} di semi diversi (offsuit). Risposta: <b>${n}</b>.`;
    }
    const lbl = kind === "pair" ? r1 + r1 : r1 + r2 + (kind === "s" ? " dello stesso seme (suited)" : kind === "o" ? " di semi diversi (offsuit)" : " (qualsiasi seme)");
    const pool = [0, 1, 2, 3, 4, 6, 8, 9, 12, 16].filter(x => x !== n).sort((a, b) => Math.abs(a - n) - Math.abs(b - n)).slice(0, 5);
    return {
      title: "Quante combinazioni?",
      body: tableHtml([{ lbl: "Board", cards: board }, { hero: 1, lbl: "La tua mano", cards: hero }]) + `<p class="qtitle">In quanti modi diversi l'avversario può avere <b>${lbl}</b>, viste le carte che conosci?</p>`,
      layout: "cols2", opts: shuffle([n, ...shuffle(pool).slice(0, 3)]).map(v => ({ label: String(v), v })), timed: true,
      check(v) { return { score: v === n ? 100 : 0, correct: n, expl: `<p>${expl}</p><p class="muted">Ogni carta che vedi toglie combinazioni al suo range: è la base dei blocker.</p>` }; },
    };
  },
};

const DRAWS = [
  { n: "un progetto di scala interna (gutshot)", o: 4, c: "4 carte (le quattro del rank che ti manca)" },
  { n: "un progetto di scala bilaterale", o: 8, c: "4 + 4 = 8 carte (due rank, uno per lato)" },
  { n: "un progetto colore", o: 9, c: "13 carte del seme − 4 che vedi = 9" },
  { n: "colore + scala interna", o: 12, c: "9 del colore + 4 della scala − 1 contata due volte (la carta della scala del tuo seme) = 12" },
  { n: "colore + scala bilaterale", o: 15, c: "9 del colore + 8 della scala − 2 contate due volte = 15" },
  { n: "due overcard (carte più alte del board)", o: 6, c: "3 + 3 = 6 carte per fare top pair (non sempre bastano a vincere)" },
  { n: "un doppio gutshot", o: 8, c: "4 + 4 = 8 carte" },
];
const quick = (o, flop) => flop ? o * 4 - Math.max(0, o - 8) : o * 2;
DRILLS.outs = {
  name: "Outs e prezzo dei draw", short: "Outs", time: 25,
  desc: "Quante volte chiudi il tuo progetto, e se la puntata avversaria te lo fa pagare troppo.",
  rule: "Gli <b>outs</b> sono le carte che completano il tuo progetto. Con una carta da vedere (turn → river): outs × 2. Con due carte (flop → river): outs × 4, togliendo (outs − 8) quando hai più di 8 outs. Chiudere il progetto non vuol dire sempre vincere, e a volte vinci anche senza chiudere.",
  sample() { return Math.random() < 0.45 ? { m: "eq", di: rint(0, DRAWS.length - 1), flop: Math.random() < 0.5 } : { m: "pay", di: rint(0, DRAWS.length - 1), P: pick([10, 16, 20, 24, 30, 40]), f: pick([0.33, 0.5, 0.66, 0.75, 1]) }; },
  build(p) {
    const d = DRAWS[p.di];
    const eqTurn = d.o / 46 * 100, eqFlop = (1 - (47 - d.o) * (46 - d.o) / (47 * 46)) * 100;
    if (p.m === "eq") {
      const ans = Math.round(p.flop ? eqFlop : eqTurn);
      const set = new Set([ans]);
      for (const c of shuffle([Math.round(p.flop ? eqTurn : eqFlop), ans + 9, ans - 8, ans + 16, ans - 15, Math.round(d.o * 3)])) { if (set.size >= 4) break; if (c > 1 && c < 99 && ![...set].some(x => Math.abs(x - c) < 7)) set.add(c); }
      let add = 10; while (set.size < 4) { const c = ans + add; if (c < 99 && ![...set].some(x => Math.abs(x - c) < 7)) set.add(c); add += 7; }
      return {
        title: "Quante volte chiudi?",
        body: `<p class="qtitle">Hai ${d.n}: <b>${d.o} outs</b>, cioè ${d.c}. Sei al <b>${p.flop ? "flop" : "turn"}</b> e ${p.flop ? "vedrai turn e river (due carte)" : "vedrai solo il river (una carta)"}. <br>Su 100 volte, <b>quante volte completi il progetto</b> entro il river?</p>`,
        layout: "cols2", opts: shuffle([...set]).map(v => ({ label: v + " su 100", v })), timed: false,
        check(v) { return { score: Math.abs(v - (p.flop ? eqFlop : eqTurn)) <= 4 ? 100 : 0, correct: ans, expl: `<p>${p.flop ? `Carte sconosciute: 47. Probabilità di NON chiudere né al turn né al river: (${47 - d.o} / 47) × (${46 - d.o} / 46). Quindi chiudi 1 − (${47 - d.o} × ${46 - d.o}) / (47 × 46) = <b>${fmt(eqFlop, 1)}%</b>.` : `Carte sconosciute: 46. Chiudi con ${d.o} carte su 46 = <b>${fmt(eqTurn, 1)}%</b>.`}</p><p>Regola rapida: ${p.flop ? `${d.o} × 4${d.o > 8 ? ` − (${d.o} − 8)` : ""}` : `${d.o} × 2`} = <b>${quick(d.o, p.flop)}%</b>, abbastanza vicino da usarla al tavolo.</p>` }; },
      };
    }
    const B = Math.round(p.P * p.f), need = B / (p.P + 2 * B) * 100, ok = eqTurn >= need;
    return {
      title: "Il call conviene?",
      body: `<div class="potviz"><div class="pv k-pot"><span>Piatto</span><b>${bb(p.P)}</b></div><div class="plus">+</div><div class="pv bet k-bet"><span>Puntata avversario</span><b>${bb(B)}</b></div></div><p class="qtitle">Sei al turn con ${d.n} (${d.o} outs, chiudi circa ${Math.round(eqTurn)} volte su 100). Senza contare quello che potresti vincere dopo, <b>il call è profittevole</b>?</p>`,
      layout: "cols2", opts: [{ label: "Sì, chiudo abbastanza spesso", v: true }, { label: "No, mi fa pagare troppo", v: false }], timed: false,
      check(v) { return { score: v === ok ? 100 : 0, correct: ok, expl: `<ol class="steps"><li>Outs: ${d.c}. Chiudi ${d.o} volte su 46 carte = <b>${fmt(eqTurn, 1)}%</b>.</li><li>Per chiamare ti serve: ${B} / (${p.P} + ${2 * B}) = <b>${fmt(need, 1)}%</b>.</li></ol><p>${ok ? "La puntata è troppo piccola: il progetto paga il prezzo giusto." : "La puntata fa pagare il progetto più di quanto vale. È la size giusta quando sei tu a puntare contro i progetti."}</p>` }; },
    };
  },
};

/* ---------- «Dì il bersaglio»: la mano si gioca davanti a te, street per street, poi tocca a te ----------
   Ogni copione segue solo le azioni scritte nello spot: niente size o azioni inventate. */
const TG_RP = {
  "Ks7d2c|AhKd": { v: "BB", h: "BTN", pre: [["h", "Apre"], ["v", "Chiama"]], flop: [["v", "Check"]] },
  "8h7h5c|AcQd": { v: "BB", h: "BTN", pre: [["h", "Apre"], ["v", "Chiama"]], flop: [["v", "Check"]] },
  "KcQs6d3h2c|QhJh": { v: "Station", turn: [["v", "Check"], ["h", "Check"]], river: [["v", "Check"]] },
  "KsQd7s4c2d|6h5h": { v: "Reg", flop: [["h", "Punta"], ["v", "Chiama"]], turn: [["h", "Punta"], ["v", "Chiama"]], river: [["v", "Check"]] },
  "KsQd7s4c2d|9c9d": { v: "Avversario", flop: [["h", "Punta"], ["v", "Chiama"]], turn: [["h", "Punta"], ["v", "Chiama"]], river: [["v", "Check"]] },
  "9s6d2cAh|QsJs": { v: "BB", h: "BTN", pre: [["h", "Apre"], ["v", "Chiama"]], flop: [["h", "C-bet 1/3"], ["v", "Chiama"]], turn: [["v", "Check"]] },
  "AdJc8s4h2c|KdKc": { v: "Nit", flop: [["v", "Check"], ["h", "Punta"], ["v", "Chiama"]], turn: [["v", "Check"], ["h", "Punta"], ["v", "Chiama"]], river: [["v", "Check"]] },
  "Js7h3d|QcQd": { v: "CO", pre: [["v", "Apre"], ["h", "3-bet"], ["v", "Chiama"]], flop: [["v", "Check"]], pot3: 1 },
  "Th9h4c2d3h|Ah5h": { v: "BB", flop: [["v", "Check"], ["h", "Punta"], ["v", "Chiama"]], turn: [["v", "Check"], ["h", "Punta"], ["v", "Chiama"]], river: [["v", "Check"]] },
  "Qs8s3d2c|As5s": { v: "BB", h: "BTN", pre: [["h", "Apre"], ["v", "Chiama"]], flop: [["h", "C-bet"], ["v", "Chiama"]], turn: [["v", "Check"]] },
  "Jh9h4c2s|JsTc": { v: "BB", h: "BTN", pre: [["h", "Apre"], ["v", "Chiama"]], flop: [["h", "C-bet"], ["v", "Chiama"]], turn: [["v", "Check"]] },
  "KcJd4s2h9c|7h6h": { v: "Station", flop: [["h", "Punta"], ["v", "Chiama"]], turn: [["h", "Punta"], ["v", "Chiama"]], river: [["v", "Check"]] },
  "Kd7s7c|Ah4h": { v: "BB", h: "BTN", pre: [["h", "Apre"], ["v", "Chiama"]], flop: [["v", "Check"]] },
};
/* copioni delle linee dei problemi di river generati (le stesse azioni scritte nel testo della domanda) */
const TG_LINE = {
  "srp-A": { v: "BB", h: "BTN", pre: [["h", "Apre"], ["v", "Chiama"]], flop: [["v", "Check"], ["h", "Punta 1/3"], ["v", "Chiama"]], turn: [["v", "Check"], ["h", "Punta 2/3"], ["v", "Chiama"]], river: [["v", "Check"]] },
  "srp-B": { v: "BB", h: "BTN", pre: [["h", "Apre"], ["v", "Chiama"]], flop: [["v", "Check"], ["h", "Punta 1/3"], ["v", "Chiama"]], turn: [["v", "Check"], ["h", "Check"]], river: [["v", "Check"]] },
  "sb-A": { v: "BB", h: "SB", pre: [["h", "Apre"], ["v", "Chiama"]], flop: [["h", "Punta 1/3"], ["v", "Chiama"]], turn: [["h", "Punta 2/3"], ["v", "Chiama"]] },
  "3bp-A": { v: "CO", h: "BTN", pre: [["v", "Apre 2,2bb"], ["h", "3-bet 7bb"], ["v", "Chiama"]], flop: [["v", "Check"], ["h", "Punta 1/3"], ["v", "Chiama"]], turn: [["v", "Check"], ["h", "Punta 2/3"], ["v", "Chiama"]], river: [["v", "Check"]], pot3: 1 },
};
const TG_ST = [["pre", "Preflop", 0], ["flop", "Flop", 3], ["turn", "Turn", 4], ["river", "River", 5]];
function tgScript(s) {
  const rp = s.rp || TG_RP[s.board + "|" + s.hero] || { v: "Avversario" }, n = s.board.length / 2, last = n >= 5 ? 3 : n === 4 ? 2 : 1, steps = [];
  TG_ST.slice(0, last + 1).forEach(([k, lbl, nc], i) => { steps.push({ st: i, lbl, nc }); (rp[k] || []).forEach(([w, a]) => steps.push({ w, a })); });
  return { rp, steps };
}
function tgReplayHtml(s) {
  const { rp } = tgScript(s), cs = s.board.match(/../g), av = typeof gwAv === "function" ? gwAv(rp.v, true) : "", me = typeof gMascot === "function" ? gMascot("think", 36) : "";
  return `<div class="tgr" data-tgr><div class="tgr-top"><div class="tgr-sts">${TG_ST.slice(0, cs.length >= 5 ? 4 : cs.length === 4 ? 3 : 2).map(([, l], i) => `<span data-tgs="${i}">${l}</span>`).join("")}${rp.pot3 ? `<em class="tgr-p3">3-bet pot</em>` : ""}</div><button type="button" class="tgr-skip" data-tgskip>Salta ▸</button></div>
    <div class="ptbl tgr-t"><div class="ptbl-felt hh"><div class="qrail"></div>
      <div class="ptbl-seat vil"><div class="tgr-bub" data-tgb="v"></div><div class="ptbl-back"><i></i><i></i></div><div class="ptbl-plate">${av}<b>${esc(rp.v)}</b></div></div>
      <div class="ptbl-board tgr-board">${cs.map((c, i) => `<span class="tgr-c" data-tgc="${i}"><span class="tgr-bk"></span>${card(c)}</span>`).join("")}</div>
      <div class="ptbl-seat hero"><div class="tgr-bub" data-tgb="h"></div><div class="ptbl-hc">${cardsHtml(s.hero)}</div><div class="ptbl-plate">${me}<b>Tu${rp.h ? " · " + esc(rp.h) : ""}</b></div></div>
    </div></div>
    <p class="tgr-turn" data-tgturn>${s.turn != null ? esc(s.turn) : "Tocca a te: cosa fai e cosa colpisci?"}</p></div>`;
}
function tgReplayRun(root, s, q) {
  const el = root.querySelector("[data-tgr]"); if (!el) return;
  const { steps } = tgScript(s), opts = [...document.querySelectorAll(".opts .opt")];
  let i = 0, tm = null, done = false;
  const bub = (w, a) => { const b = el.querySelector(`[data-tgb="${w}"]`); if (!b) return; b.textContent = a; b.className = "tgr-bub on " + (/check/i.test(a) ? "ck" : /chiama/i.test(a) ? "cl" : "bt"); };
  const apply = x => {
    if (x.st != null) { el.querySelectorAll("[data-tgs]").forEach(t => t.classList.toggle("on", +t.dataset.tgs === x.st)); el.querySelectorAll("[data-tgs]").forEach(t => t.classList.toggle("past", +t.dataset.tgs < x.st));
      el.querySelectorAll("[data-tgc]").forEach(c => { if (+c.dataset.tgc < x.nc) c.classList.add("up"); }); el.querySelectorAll(".tgr-bub").forEach(b => b.classList.remove("on")); }
    else bub(x.w, x.a);
  };
  const finish = () => { if (done) return; done = true; clearTimeout(tm); for (; i < steps.length; i++) apply(steps[i]); el.classList.add("end"); q.hold = false; opts.forEach(o => { o.disabled = false; o.classList.remove("tgr-wait"); }); const sk = el.querySelector("[data-tgskip]"); if (sk) sk.textContent = "↻ Rivedi"; if (run && run.q === q) run.t0 = Date.now(); };
  const tick = () => { if (!document.body.contains(el) || !run || run.q !== q) return; if (i >= steps.length) return finish(); const x = steps[i++]; apply(x); const sp = run && run.ctx && run.ctx.tgSkip ? 0.5 : 1; tm = setTimeout(tick, sp * (x.st != null ? (x.nc ? 700 : 350) : 520)); };
  el.querySelector("[data-tgskip]").onclick = () => { if (!done) { if (run && run.ctx) run.ctx.tgSkip = 1; return finish(); } /* rivedi: rigioca solo l'animazione, le opzioni restano attive */
    done = false; i = 0; el.classList.remove("end"); el.querySelectorAll("[data-tgc]").forEach(c => c.classList.remove("up")); el.querySelectorAll(".tgr-bub").forEach(b => b.classList.remove("on")); el.querySelector("[data-tgskip]").textContent = "Salta ▸"; tm = setTimeout(tick, 300); };
  if (isExamRun() || matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
  q.hold = true; opts.forEach(o => { o.disabled = true; o.classList.add("tgr-wait"); });
  tm = setTimeout(tick, 350);
}

/* segno delle fiches: niente «−0» o «+0» quando il numero mostrato è zero */
const fiSign = x => { x = +x || 0; return /^0(?![\d.,])/.test(String(fmtFi(Math.abs(x)))) ? "" : x < 0 ? "−" : "+"; };
/* ---------- domande solo testo: una striscia visiva con il contesto (posizioni, tipo di piatto, street) e i numeri chiave ----------
   Si legge dal testo della domanda: niente dati inventati, solo quello che la domanda dice già, messo in evidenza. */
const QV_POS = ["EP", "MP", "CO", "BTN", "SB", "BB"], QV_AL = { UTG: "EP", HJ: "MP", LJ: "MP" };
function qvParse(txt) {
  const t = String(txt).replace(/<[^>]+>/g, " ").replace(/\s+/g, " "), R = { pos: [], hero: null, pot: null, st: null, tiles: [] };
  const PR = "(EP|UTG|MP|HJ|LJ|CO|BTN|SB|BB)", norm = p => QV_AL[p] || p;
  (t.match(new RegExp("\\b" + PR + "\\b", "g")) || []).forEach(p => { p = norm(p); if (!R.pos.includes(p)) R.pos.push(p); });
  const hm = new RegExp("\\bsei (?:nel |in |di |da |il |al |lo |la )?" + PR + "\\b", "i").exec(t) || new RegExp("\\b" + PR + " \\(tu\\)").exec(t) || new RegExp("\\(tu,? " + PR + "\\b").exec(t) || new RegExp("\\btu,? (?:sei )?(?:in |nel |di )?" + PR + "\\b").exec(t) || new RegExp("\\b(?:apri|hai aperto|rilanci|3-betti|difendi|paghi|giochi|limpi|completi) (?:da|dal|dallo|dalla|in|nel) " + PR + "\\b", "i").exec(t) || new RegExp("\\bdal(?:lo|la|l')? ?" + PR + " (?:fai|apri|rilanci|paghi|3-betti|4-betti|limpi|completi|difendi)\\b", "i").exec(t) || new RegExp("\\bsei (?:il|lo|la|l') ?[^.,;()]{0,24}\\(" + PR + "\\)", "i").exec(t) || new RegExp("\\b(?:paghi|difendi|chiami) (?:dal|dallo|dalla|in|nel) " + PR + "\\b", "i").exec(t);
  if (hm) R.hero = norm(hm[1].toUpperCase());
  if (/\b4-bet(?:ti|tato)? pot\b|piatto (?:di )?4-bet|\b4bp\b/i.test(t)) R.pot = "Piatto 4-bet"; else if (/\b3-bet pot\b|piatto (?:di |con )?3-bet|\b3bp\b/i.test(t)) R.pot = "Piatto 3-bet"; else if (/\bsqueeze\b/i.test(t) && R.pos.length) R.pot = "Squeeze"; else if (/\blimp(?:er|ano|a|i)?\b/i.test(t) && R.pos.length) R.pot = "Con limp"; else if (/\bSRP\b/.test(t) || (/apre.{0,40}chiam/i.test(t) && !/3-bet|4-bet|rilancia/i.test(t))) R.pot = "Piatto singolo";
  const sm = [...t.replace(/\b(?:dopo il|prima del|fino al|vedere il|vede il) (?:flop|turn|river)\b/gi, " ").matchAll(/\b(preflop|flop|turn|river)\b/gi)].map(m => m[1].toLowerCase()), lead = /^\s*(preflop|flop|turn|river)\b/i.exec(t);
  if (lead) R.st = lead[1].toLowerCase(); else if (sm.length) R.st = ["preflop", "flop", "turn", "river"].filter(x => sm.includes(x)).pop();
  const add = (lab, val) => { if (R.tiles.length < 3 && !R.tiles.some(x => x.val === val && x.lab === lab)) R.tiles.push({ lab, val }); };
  let m;
  if ((m = /([+−-]?\d+(?:[.,]\d+)?)\s?bb\/100/.exec(t))) add("Winrate", m[1] + " bb/100");
  if ((m = /\bSQS(?: medio)?(?: di)? (\d+(?:[.,]\d+)?)/i.exec(t))) add("SQS", m[1]);
  if ((m = /(\d{1,3}(?:\.\d{3})+|\d+) mani\b/.exec(t))) add("Mani", m[1]);
  for (const x of t.matchAll(/(?<![\d,.])([+−-]?\d+(?:[.,]\d+)?(?:-\d+)?) (?:buy-in|BI)\b/g)) add("Buy-in", x[1]);
  /* bb: l'etichetta viene dalla parola subito prima (o «dietro» subito dopo); senza un'etichetta chiara il numero resta solo nel testo */
  const bbN = (t.match(/\d\s?bb\b(?!\/)/g) || []).length;
  for (const x of t.matchAll(/(\d+(?:[.,]\d+)?)\s?bb\b(?!\/)/g)) {
    const pre = t.slice(Math.max(0, x.index - 32), x.index).toLowerCase(), post = t.slice(x.index + x[0].length, x.index + x[0].length + 10).toLowerCase();
    const lab = /^\s*(?:di )?dietro/.test(post) || /\bstack(?: di| dietro)?\s*$/.test(pre) ? "Stack dietro" : /piatto(?: al flop| al turn| al river)?(?: di| da)?\s*$/.test(pre) ? "Piatto" : /\bev\s*[+−-]?$/.test(pre) ? "EV" : /squeeze[^,.;]*$/.test(pre) ? "Squeeze" : /4-bet[^,.;]*$/.test(pre) ? "4-bet" : /3-bet[^,.;]*$/.test(pre) ? "3-bet" : /(?:rilancia|rilanci|raise)[^,.;]*$/.test(pre) ? "Rilancio" : /\bapr[eio][^,.;]*$/.test(pre) ? "Open" : /all-in[^,.;]*$/.test(pre) ? "All-in" : /(?:punt[aio]|betta|bluffi|c-bet|puntata|overbet)[^,.;]*$/.test(pre) ? "Puntata" : /cost[ao][^,.;]*$/.test(pre) ? "Costo" : "";
    if (lab && (bbN <= 3 || lab === "Piatto" || lab === "Stack dietro")) { add(lab, x[1] + "bb"); const tl = R.tiles[R.tiles.length - 1]; if (tl && tl.lab === lab && /\b(?:punt[io]|bluffi|betti)\b[^,.;]*$/.test(pre)) tl.me = 1; }
  }
  const pcs0 = [...t.matchAll(/\d\s?%/g)];
  for (const x of t.matchAll(/\b(VPIP|PFR|AF|WTSD)\s(?:di |del |al )?(\d+(?:[.,]\d+)?)(%?)/g)) add(x[1], x[2] + (x[1] === "AF" ? "" : "%"));
  if (pcs0.length <= 2) for (const x of t.matchAll(/\b(fold(?:a)? (?:alla |to )?c-bet|fold to 3-bet)[^%\d]{0,20}?(\d+(?:[.,]\d+)?)%/gi)) add(/3-bet/i.test(x[1]) ? "Fold a 3-bet" : "Fold a c-bet", x[2] + "%");
  /* percentuali con un'etichetta chiara dalla parola vicina */
  const pcs = [...t.matchAll(/(\d+(?:[.,]\d+)?(?:-\d+(?:[.,]\d+)?)?)\s?%/g)];
  if (pcs.length <= 2) for (const x of pcs) {
    const pre = t.slice(Math.max(0, x.index - 30), x.index).toLowerCase(), post = t.slice(x.index + x[0].length, x.index + x[0].length + 14).toLowerCase();
    const lab = /^\s*(?:di |d')?equity/.test(post) || /equity(?: del| di| dell')?\s*$/.test(pre) ? "Equity" : /fold[a-zè]*(?: (?:il|circa|alla|al))*[^,.;]{0,12}$/.test(pre) || /^\s*(?:di )?fold/.test(post) ? "Fold" : /c-bet(?: ip| oop)?[^,.;]{0,6}$/.test(pre) ? "C-bet" : /riferimento\s*$/.test(pre) ? "Riferimento" : /bluff[a-z]*[^,.;]{0,10}$/.test(pre) ? "Bluff" : /vinc[a-z]*[^,.;]{0,14}$/.test(pre) ? "Vinci" : "";
    if (lab && !R.tiles.some(tl => tl.val === x[1] + "%")) add(lab, x[1] + "%");
  }
  /* range scritto nel testo (es. «TT+, AK e AQs»): diventa una griglia 13x13 */
  const TK = "(?:[AKQJT2-9]{2}[so]?\\+?(?:-[AKQJT2-9]{2}[so]?)?)", RG = new RegExp("(?<![A-Za-z0-9])" + TK + "(?:(?:,\\s*|\\s+e\\s+|\\s+o\\s+)" + TK + ")*(?![A-Za-z0-9])", "g");
  let best = null; for (const mm of t.matchAll(RG)) { const toks = mm[0].split(/,\s*|\s+e\s+|\s+o\s+/).filter(Boolean); if (toks.length < 2 && !/[+-]/.test(mm[0])) continue; if (!best || mm[0].length > best.length) best = mm[0]; }
  if (best && typeof svParseRange === "function") { try { const w = svParseRange(best.split(/,\s*|\s+e\s+|\s+o\s+/).join(",")), n = Object.keys(w).length; if (n >= 2) R.range = { txt: best, w, combos: svCombos(w).length }; } catch (e) {} }
  return R;
}
const QV_RK = "AKQJT98765432";
function qvMatrix(w) { let h = ""; for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) { const a = QV_RK[i], b = QV_RK[j], k = i === j ? a + b : i < j ? a + b + "s" : b + a + "o"; h += `<i class="${w[k] ? "on" : ""} ${i === j ? "pp" : ""}" title="${k}"></i>`; } return `<div class="qv-mx" aria-hidden="true">${h}</div>`; }
function qvHtml(txt) {
  const R = qvParse(txt), seats = R.pos.length > 0 && R.pos.length <= 4;
  if (!seats && !R.tiles.length && !(R.pot && R.st) && !R.range) return "";
  const vil = R.pos.filter(p => p !== R.hero);
  const strip = seats ? `<div class="qv-seats" aria-label="Posizioni">${QV_POS.map(p => `<span class="qv-s ${p === R.hero ? "me" : vil.includes(p) ? "on" : ""}">${p === R.hero ? `<i>Tu</i>` : ""}${p}</span>`).join("")}</div>` : "";
  const tags = (R.pot || R.st) ? `<div class="qv-tags">${R.pot ? `<span class="qv-pot">${esc(R.pot)}</span>` : ""}${R.st ? `<span class="qv-st">${["preflop", "flop", "turn", "river"].map(s => `<b class="${s === R.st ? "on" : ""}">${s[0].toUpperCase() + s.slice(1)}</b>`).join("")}</span>` : ""}</div>` : "";
  const tiles = R.tiles.length ? `<div class="qv-tiles">${R.tiles.map(x => `<span class="qv-t"><b>${esc(x.val)}</b><small>${esc(x.lab)}</small></span>`).join("")}</div>` : "";
  const rng = R.range ? `<div class="qv-rg">${qvMatrix(R.range.w)}<div class="qv-rgt"><small>Range nel testo</small><b>${esc(R.range.txt)}</b><span>${R.range.combos} combo · ${fmtN(Math.round(R.range.combos / 1326 * 1000) / 10)}% delle mani</span></div></div>` : "";
  return `<div class="qviz">${strip}${tags}${tiles}${rng}</div>`;
}
/* domande di concetto senza numeri né posizioni: un'illustrazione del tema (rake, varianza, tilt, bankroll, teoria, studio, regole, combinazioni, exploit) */
const QV_TOP = [
  ["rake", "La rake", "Quello che la room trattiene da ogni piatto", /\brake\b|rakeback|\bcap\b/i],
  ["tilt", "Mente e tilt", "Emozioni, stanchezza e decisioni", /\btilt\b|emozion|frustra|arrabbi|caldo alle|stanc|nervos|per recuperare|pausa|respir|quattro ore|affitto/i],
  ["study", "Studio", "Rivedere le mani e leggere i dati", /rived|review|report|database|tracker|holdem manager|\bHM3\b|statistic|campione di mani|frequenza di fold/i],
  ["var", "Varianza", "Risultato e decisione non sono la stessa cosa", /varianz|sfortun|fortun|bad beat|cooler|sessioni? negativ|downswing|di fila|pilotat/i],
  ["edge", "Il vantaggio", "Come si vince nel lungo periodo", /vantaggio|lungo periodo|media del tavolo|più bravo|stesso livello/i],
  ["bank", "Bankroll", "Quanti buy-in servono e quando cambiare limite", /bankroll|buy-in|salire di limite|scendere di limite/i],
  ["math", "Probabilità e conti", "Equity, prezzo e frequenze", /quanto spesso|probabilit|\bequity\b|70\/30|quanti big blind|bb vale|\bMDF\b|prezzo|pot odds|quanti giri/i],
  ["combo", "Range e combinazioni", "Quali mani e quante", /combinazion|\bcombo\b|quante (?:sono le )?mani|\brange\b|griglia|caselle|condensat|\bVPIP\b/i],
  ["gto", "Teoria dei giochi", "Equilibrio, indifferenza e frequenze", /solver|\bGTO\b|equilibri|indifferen|toy game|gioco (?:semplificato|della chiaroveggenza)|polarizzat|bilanciat|bluffcatcher|cappat|slowplay|check-raise/i],
  ["exp", "Exploit", "Giocare contro i punti deboli dell'avversario", /exploit|sfrutt|\bnit\b|station|maniac|ricreativ|\bfish\b|passiv|aggressiv/i],
  ["rules", "Regole", "Come funziona una mano", /chi (?:vince|parla|mostra)|regol|showdown|bottone|\bbui\b|blind|fiches|\bstack\b|no limit|torneo|cash game|carte comuni|tutti gli altri foldano|value bet|block bet|puntata/i],
];
const QV_TOPSVG = {
  rake: '<circle cx="30" cy="34" r="17" fill="#f5c542"/><circle cx="30" cy="34" r="11" fill="none" stroke="#7a5a00" stroke-width="2" stroke-dasharray="4 3"/><path d="M30 34 L30 17 A17 17 0 0 1 45 26 Z" fill="#0e1512"/><path d="M36 14 l12 -6 M44 22 l10 -2" stroke="#e05a4e" stroke-width="3" stroke-linecap="round"/>',
  tilt: '<rect x="25" y="8" width="10" height="34" rx="5" fill="#2b3a35" stroke="#9fb3ac" stroke-width="2"/><circle cx="30" cy="46" r="9" fill="#e05a4e"/><rect x="28" y="22" width="4" height="22" fill="#e05a4e"/><path d="M42 14 h8 M42 22 h6 M42 30 h8" stroke="#9fb3ac" stroke-width="2" stroke-linecap="round"/>',
  var: '<path d="M4 34 C12 10 18 52 26 30 S40 8 46 26 S54 44 58 20" fill="none" stroke="#3fd18f" stroke-width="3" stroke-linecap="round"/><path d="M4 30 L58 22" stroke="#f5c542" stroke-width="2" stroke-dasharray="4 3"/>',
  bank: '<ellipse cx="30" cy="46" rx="16" ry="5" fill="#b8433a"/><rect x="14" y="36" width="32" height="10" fill="#b8433a"/><ellipse cx="30" cy="36" rx="16" ry="5" fill="#e05a4e"/><rect x="14" y="26" width="32" height="10" fill="#1e88e5"/><ellipse cx="30" cy="26" rx="16" ry="5" fill="#4aa3f0"/><rect x="14" y="16" width="32" height="10" fill="#15925f"/><ellipse cx="30" cy="16" rx="16" ry="5" fill="#3fd18f"/>',
  gto: '<path d="M30 8 L52 20 L52 40 L30 52 L8 40 L8 20 Z" fill="none" stroke="#7fd4ff" stroke-width="2.5"/><path d="M30 8 V52 M8 20 L52 40 M52 20 L8 40" stroke="#7fd4ff" stroke-width="1.5" opacity=".6"/><circle cx="30" cy="30" r="5" fill="#f5c542"/>',
  exp: '<circle cx="30" cy="30" r="20" fill="none" stroke="#e05a4e" stroke-width="3"/><circle cx="30" cy="30" r="12" fill="none" stroke="#e05a4e" stroke-width="3"/><circle cx="30" cy="30" r="4" fill="#e05a4e"/><path d="M44 16 L56 4 M50 4 h6 v6" stroke="#f5c542" stroke-width="3" stroke-linecap="round" fill="none"/>',
  study: '<rect x="8" y="10" width="44" height="34" rx="4" fill="#1b2a25" stroke="#9fb3ac" stroke-width="2"/><path d="M14 36 l8 -8 l7 5 l9 -12 l8 6" fill="none" stroke="#3fd18f" stroke-width="2.5" stroke-linecap="round"/><circle cx="44" cy="44" r="8" fill="none" stroke="#f5c542" stroke-width="3"/><path d="M50 50 l6 6" stroke="#f5c542" stroke-width="3" stroke-linecap="round"/>',
  combo: '<rect x="8" y="14" width="20" height="28" rx="3" fill="#fff" transform="rotate(-10 18 28)"/><rect x="22" y="12" width="20" height="28" rx="3" fill="#fff" transform="rotate(4 32 26)"/><rect x="34" y="16" width="20" height="28" rx="3" fill="#fff" transform="rotate(14 44 30)"/><text x="14" y="32" font-size="11" font-weight="800" fill="#141414">A</text><text x="28" y="30" font-size="11" font-weight="800" fill="#d8584e">K</text><text x="41" y="35" font-size="11" font-weight="800" fill="#1e88e5">Q</text>',
  edge: '<path d="M8 48 L52 12" stroke="#3fd18f" stroke-width="3" stroke-linecap="round"/><path d="M8 48 L52 40" stroke="#9fb3ac" stroke-width="2" stroke-dasharray="3 3"/><path d="M44 12 h8 v8" fill="none" stroke="#3fd18f" stroke-width="3" stroke-linecap="round"/><circle cx="8" cy="48" r="4" fill="#f5c542"/>',
  math: '<rect x="10" y="8" width="40" height="44" rx="6" fill="#1b2a25" stroke="#9fb3ac" stroke-width="2"/><rect x="16" y="14" width="28" height="10" rx="2" fill="#3fd18f"/><g fill="#9fb3ac"><circle cx="20" cy="32" r="3"/><circle cx="30" cy="32" r="3"/><circle cx="40" cy="32" r="3"/><circle cx="20" cy="42" r="3"/><circle cx="30" cy="42" r="3"/></g><circle cx="40" cy="42" r="3" fill="#f5c542"/>',
  rules: '<rect x="10" y="16" width="40" height="28" rx="14" fill="#146b41" stroke="#6a4b24" stroke-width="3"/><circle cx="22" cy="30" r="3" fill="#f5c542"/><circle cx="30" cy="30" r="3" fill="#fff"/><circle cx="38" cy="30" r="3" fill="#fff"/><text x="30" y="12" text-anchor="middle" font-size="9" font-weight="800" fill="#9fb3ac">D</text>',
};
function qvTopic(txt) { const t = String(txt).replace(/<[^>]+>/g, " "); const m = QV_TOP.find(x => x[3].test(t)); return m ? { k: m[0], n: m[1], d: m[2] } : null; }
function qvTopicHtml(txt) { const T = qvTopic(txt); if (!T) return ""; return `<div class="qviz qv-top qv-${T.k}"><svg viewBox="0 0 60 60" width="54" height="54" aria-hidden="true">${QV_TOPSVG[T.k]}</svg><div><small>Tema</small><b>${esc(T.n)}</b><span>${esc(T.d)}</span></div></div>`; }
/* tavolo senza piatto: piatto, puntata e stack letti dal testo vanno sul tavolo, con le fiches */
function qvPotRow(card, q) {
  const felt = card.querySelector(".ptbl-felt"); if (!felt || card.querySelector(".ptbl-potrow, .p6-felt, .tgr") || [...card.querySelectorAll(".pill, .tag, .chip")].some(x => /piatto/i.test(x.textContent))) return;
  const R = qvParse((q.body || "").replace(/<[^>]+>/g, " ")), pot = R.tiles.find(t => t.lab === "Piatto"), bet = R.tiles.find(t => t.lab === "Puntata" || t.lab === "All-in"), stk = R.tiles.find(t => t.lab === "Stack dietro");
  if (!pot && !bet) return;
  const chips = n => `<span class="qchips">${Array.from({ length: n }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</span>`;
  const row = document.createElement("div"); row.className = "ptbl-potrow";
  row.innerHTML = (pot ? `${chips(4)}<span class="qpot">Piatto <b>${esc(pot.val)}</b></span>` : "") + (bet ? `<span class="qbet2 ${bet.me ? "me" : "vil"}">${chips(2)}${bet.me ? "La tua puntata" : bet.lab === "All-in" ? "All-in" : "Puntata"} <b>${esc(bet.val)}</b></span>` : "") + (stk ? `<span class="qpot">Stack dietro <b>${esc(stk.val)}</b></span>` : "");
  felt.appendChild(row);
}
/* targhette del tavolo: se il testo dice chi sei e contro chi giochi, al posto di «Avversario» compare la posizione */
function qvSeats(card, q) {
  if (card.querySelector(".tgr")) return; const vb = card.querySelector(".ptbl-seat.vil .ptbl-plate b"), hb = card.querySelector(".ptbl-seat.hero .ptbl-plate b"); if (!vb && !hb) return;
  const R = qvParse((q.body || "").replace(/<[^>]+>/g, " ")); if (!R.hero) return; const vil = R.pos.filter(p => p !== R.hero);
  if (hb && hb.textContent.trim() === "Tu") hb.textContent = "Tu · " + R.hero;
  if (vb && vil.length === 1 && vb.textContent.trim() === "Avversario") vb.textContent = vil[0];
}
/* la striscia va solo sulle domande che non hanno già un tavolo, carte o grafici */
function qvApply(root, q) {
  try { const c1 = root && root.querySelector(".qcard"); if (c1) qvSeats(c1, q); } catch (e) {}
  try { const c0 = root && root.querySelector(".qcard"); if (c0) qvPotRow(c0, q); } catch (e) {}
  try {
    const card = root && root.querySelector(".qcard"); if (!card || card.querySelector(".qviz")) return;
    if (/<(div|table|svg|section|canvas|ul|img)\b/i.test(q.body || "")) return;
    if (card.querySelector(".ptbl, .p6-felt, .tgr, .potviz, .tcs, table, svg:not(.gic)")) return;
    const txt = (q.body || "").replace(/<\/?(?:b|i|em|strong|span)\b[^>]*>/g, "").replace(/<[^>]+>/g, " ");
    const h = qvHtml(txt) || qvTopicHtml(txt); if (!h) return;
    const head = card.querySelector(".qhead"); (head || card.firstElementChild).insertAdjacentHTML("afterend", h);
  } catch (e) {}
}

DRILLS.target = {
  name: "Dì il bersaglio", short: "Bersaglio", time: 35,
  desc: "Value, bluff o check: e quali mani del suo range colpisci.",
  rule: "Ogni puntata ha un bersaglio: <b>pagano mani peggiori</b> (value) oppure <b>foldano mani migliori</b> (bluff). Se non c'è nessuno dei due, check.",
  sample(ctx) {
    if (Math.random() < 0.45) { ctx.spotBag = ctx.spotBag && ctx.spotBag.length ? ctx.spotBag : shuffle(SPOTS.map((_, k) => k)); return { m: "hand", i: ctx.spotBag.pop() }; }
    return { m: "gen", id: pick(BANK).id, pk: pick(profilesAvail()) };
  },
  build(p) {
    if (p.m === "hand") {
      const s = SPOTS[p.i];
      return {
        title: `${s.street} · cosa fai e cosa colpisci?`,
        body: `<p class="ctx">${esc(s.ctx)}</p>` + tgReplayHtml(s),
        layout: "", opts: shuffle(s.opts.map((t, k) => k)).map(k => ({ label: s.opts[k], v: k })), timed: false,
        mount() { try { tgReplayRun(document.getElementById("view"), s, this); } catch (e) { this.hold = false; } },
        check(v) { return { score: v === s.a ? 100 : 0, correct: s.a, expl: `<p>${s.ex}</p>` }; },
      };
    }
    const sp = BANK.find(x => x.id === p.id);
    const { best, html } = evTable(sp, p.pk);
    const act = best.s === 0 ? "check" : sp.eq >= 0.5 ? "value" : "bluff";
    const { evs } = evTable(sp, p.pk);
    const betBest = Math.max(...evs.filter(e => e.s > 0).map(e => e.bbv), -1e9);
    const evOf = v => v === "check" ? 0 : (v === "value") === (sp.eq >= 0.5) ? betBest : -1e9;
    const tol = Math.max(0.6, 0.01 * sp.pot), tol2 = Math.max(1.2, 0.025 * sp.pot);
    const rs = { board: sp.board, hero: sp.hero, rp: TG_LINE[sp.cfg + "-" + sp.line], turn: "Tocca a te." }, prof = PROFILES[p.pk];
    const body = rs.rp ? `<p class="ctx">${LINE_TXT[sp.cfg + "-" + sp.line]}</p>` + tgReplayHtml(rs) +
      `<div class="potviz"><div class="pv k-pot"><span>Piatto al river</span><b>${bb(sp.pot)}</b></div><div class="pv"><span>Stack dietro</span><b>${bb(sp.stack)}</b></div><div class="pv win"><span>Batti il suo range</span><b>${Math.round(sp.eq * 100)}%</b></div></div>` +
      `<p class="hint">Avversario: <b>${prof.n}</b>, ${prof.d}.${p.pk === "course" ? " " + COURSE_NOTE[sp.cfg + "-" + sp.line] : ""} Ecco con cosa è arrivato al river (${VIL[sp.cfg]}):</p>${stackHtml(sp.comp)}${legendHtml(sp.comp)}` : spotBody(sp, p.pk);
    return {
      title: "River · punti o no?",
      body: body + `<p class="qtitle" style="margin-top:12px">Che ruolo ha la tua mano qui?</p>`,
      mount() { if (rs.rp) try { tgReplayRun(document.getElementById("view"), rs, this); } catch (e) { this.hold = false; } },
      layout: "cols3", opts: [{ label: "<b>Value</b> · punto perché mi pagano mani peggiori", v: "value" }, { label: "<b>Bluff</b> · punto perché foldano mani migliori", v: "bluff" }, { label: "<b>Check</b> · nessun bersaglio, vado a showdown o mollo", v: "check" }],
      timed: false,
      check(v) { const gap = best.bbv - evOf(v); const score = v === act || gap <= tol ? 100 : gap <= tol2 ? 60 : 0; return { score, correct: act, expl: `${v !== act && score === 100 ? `<p class="muted">Differenza minima (${fmt(gap, 1)}bb): anche la tua scelta è corretta.</p>` : ""}<p><b>${act === "value" ? "Value" : act === "bluff" ? "Bluff" : "Check"}</b>${best.s ? ` (size migliore ${sizeName(best.s)})` : ""}. ${whyText(sp, best, evs)}</p>${html}<p class="muted" style="margin-top:6px">Valori in bb rispetto al check.</p>` }; },
    };
  },
};

DRILLS.size = {
  name: "Laboratorio size", short: "Size", time: 40,
  desc: "Spot di river calcolati combo per combo: scegli la size che rende di più contro quel giocatore.",
  rule: "Una size vale: fold × piatto + call da mani peggiori × (piatto + size) − call da mani migliori × size. Il confronto è sempre con il check.",
  sample(ctx) { return { id: pick(BANK).id, pk: ctx.profile || pick(profilesAvail()) }; },
  build(p) {
    const sp = BANK.find(x => x.id === p.id);
    const sizes = spotSizes(sp);
    return {
      title: "River · quanto punti?",
      body: spotBody(sp, p.pk) + `<p class="qtitle" style="margin-top:12px">Quale size scegli?</p>`,
      layout: "cols6", center: true, opts: sizes.map(s => ({ label: sizeName(s) + (s > 0 ? `<br><span class="muted" style="font-weight:400;font-size:12px">${bb(s * sp.pot)}</span>` : ""), v: s })), timed: false,
      check(v) {
        const { evs, best, html } = evTable(sp, p.pk);
        const me = evs.find(e => e.s === v);
        let score = me === best ? 100 : (best.bbv > 0.3 && me.bbv >= best.bbv * 0.85) || (best.bbv <= 0.3 && Math.abs(me.bbv - best.bbv) < 0.3) ? 60 : 0;
        return { score, correct: best.s, expl: `<p><b>Migliore: ${sizeName(best.s)}.</b> ${whyText(sp, best, evs)}</p>${html}<p class="muted" style="margin-top:8px">bb in più rispetto al check. Range del ${VIL[sp.cfg]} calcolato su range reali; il profilo decide quali mani pagano ogni size.</p>` };
      },
    };
  },
};

const RANGE_LBL = {
  old: { BTN: "Range di apertura del BTN (45% delle mani), sul flop", BB: "Range con cui il BB ha chiamato l'open del BTN, sul flop", BBcall: "Range del BB dopo aver chiamato una c-bet da 1/3" },
  srp: { F: "BTN apre 2,5bb, BB chiama (range GTO, 27%): range del BB sul flop", FC: "BTN apre, BB chiama: range del BB dopo aver chiamato una c-bet da 1/3", T: "BTN apre, BB chiama: range del BB al turn, dopo aver chiamato flop e turn", A: "BTN apre, BB chiama: range del BB al river, dopo aver chiamato flop e turn", H: "Range di apertura del BTN sul flop" },
  sb: { F: "SB apre 3bb, BB chiama (range GTO, 32%): range del BB sul flop", FC: "SB apre, BB chiama: range del BB dopo aver chiamato una c-bet da 1/3", T: "SB apre, BB chiama: range del BB al turn, dopo due call", A: "SB apre, BB chiama: range del BB al river, dopo due call", H: "Range di apertura della SB sul flop" },
  "3bp": { F: "Piatto 3-bet (range GTO): range del CO che ha chiamato il 3-bet del BTN, sul flop", FC: "Piatto 3-bet: range del CO dopo aver chiamato una c-bet da 1/3", T: "Piatto 3-bet: range del CO al turn, dopo due call", A: "Piatto 3-bet: range del CO al river, dopo due call", H: "Range di 3-bet del BTN contro il CO, sul flop" },
};
const RANGE_ITEMS = MRANGES.map((m, i) => ({ src: "m", i }));
/* storia completa della mano per "Stima il range": posizioni, size preflop, c-bet e barrel, piatto a ogni street */
const RANGE_CFG = {
  srp: { hero: "BTN", vil: "BB", pre: [["BTN", "apre a 2,5bb"], ["SB", "folda"], ["BB", "chiama"]], pot: 5.5, inv: 2.5, qv: "Stima la composizione del range del BB", qh: "Stima la composizione del tuo range di apertura dal BTN" },
  sb: { hero: "SB", vil: "BB", pre: [["SB", "apre a 3bb"], ["BB", "chiama"]], pot: 6, inv: 3, qv: "Stima la composizione del range del BB", qh: "Stima la composizione del tuo range di apertura dalla SB" },
  "3bp": { hero: "BTN", vil: "CO", pre: [["CO", "apre a 2,2bb"], ["BTN", "3-betta a 7bb"], ["SB", "folda"], ["BB", "folda"], ["CO", "chiama"]], pot: 15.5, inv: 7, qv: "Stima la composizione del range del CO", qh: "Stima la composizione del tuo range di 3-bet dal BTN contro il CO" },
};
function rangeStory(cfg, line, board) {
  const C = RANGE_CFG[cfg]; if (!C) return null;
  const who = p => p === C.hero ? `<b>${p} (tu)</b>` : `<b>${p}</b>`;
  const rows = [`<li><span>Preflop</span><div>${C.pre.map(([p, a]) => `${who(p)} ${a}`).join(", ")}. Piatto ${fmtBB(C.pot)}.</div></li>`];
  let pot = C.pot, inv = C.inv;
  const fl = board.slice(0, 6), tu = board.slice(6, 8), rv = board.slice(8, 10);
  const lineCall = (street, cards, pct) => { const b = Math.round(pot * pct / 100 * 10) / 10; pot = Math.round((pot + 2 * b) * 10) / 10; inv += b; return `<li><span>${street} ${icHand(cards)}</span><div>${who(C.vil)} fa check, ${who(C.hero)} punta ${pct}% (${fmtBB(b)}), ${who(C.vil)} chiama. Piatto ${fmtBB(pot)}.</div></li>`; };
  if (line === "FC" || line === "T" || line === "A") rows.push(lineCall("Flop", fl, 33));
  if (line === "T" || line === "A") rows.push(lineCall("Turn", tu, 66));
  if (line === "A" && rv) rows.push(`<li><span>River ${icHand(rv)}</span><div>Arriva il river, nessuno ha ancora agito.</div></li>`);
  const q = line === "H" ? C.qh : C.qv;
  const at = board.length === 6 ? (line === "F" || line === "H" ? "sul flop, prima delle puntate" : "sul flop, dopo la call") : board.length === 8 ? "al turn, dopo la call" : "al river";
  return { html: `<div class="rstory"><ol>${rows.join("")}</ol><p class="rstory-q">${q} <b>${at}</b>.</p></div>`, six: { hero: C.hero, vil: C.vil, pot, inv } };
}
DRILLS.range = {
  name: "Stima il range", short: "Range", time: 70,
  desc: "Dividi un range nelle 5 categorie su flop, turn e river, in piatti singoli e 3-bet.",
  rule: "Chiediti: quante delle sue mani hanno colpito forte, quante top pair, quante una coppia più bassa, quante un progetto, quante niente? Contano le proporzioni, non la precisione al punto.",
  sample() { return { ri: rint(0, RANGE_ITEMS.length - 1) }; },
  build({ ri }) {
    const it = RANGE_ITEMS[ri];
    let label, board, ref;
    if (it.src === "old") { const f = FLOPS[it.i]; label = RANGE_LBL.old[it.k]; board = f.b; ref = f.r[it.k]; }
    else { const m = MRANGES[it.i]; label = RANGE_LBL[m.cfg][m.line]; board = m.board; ref = m.r; var story = rangeStory(m.cfg, m.line, board); }
    const street = board.length === 6 ? "Flop" : board.length === 8 ? "Turn" : "River";
    return {
      title: `Stima la composizione · ${street}`,
      body: (story ? story.html : `<p class="ctx">${label}.</p>`) + tableHtml([{ lbl: street, cards: board }], story ? story.six : null) +
        `<div class="sliders">${CAT.map(c => `<div class="srow"><label for="sl-${c.k}"><i style="display:inline-block;width:11px;height:11px;border-radius:3px;background:${c.v}"></i>${c.n}</label><input type="range" id="sl-${c.k}" min="0" max="100" step="1" value="${{ forte: 5, top: 15, medio: 20, draw: 10, aria: 50 }[c.k]}"><output id="o-${c.k}" class="mono"></output></div>`).join("")}<div class="sumline">I valori vengono riportati automaticamente a 100%.</div></div>`,
      layout: "sliders", timed: false,
      mount() { const upd = () => { let t = 0; CAT.forEach(c => t += +$("#sl-" + c.k).value); CAT.forEach(c => $("#o-" + c.k).textContent = Math.round(+$("#sl-" + c.k).value / (t || 1) * 100) + "%"); }; CAT.forEach(c => $("#sl-" + c.k).addEventListener("input", upd)); upd(); },
      read() { let t = 0; const v = {}; CAT.forEach(c => { v[c.k] = +$("#sl-" + c.k).value; t += v[c.k]; }); CAT.forEach(c => v[c.k] = v[c.k] / (t || 1) * 100); return v; },
      check(v) {
        let l1 = 0; CAT.forEach(c => l1 += Math.abs(v[c.k] - ref[c.k]));
        const score = Math.max(0, Math.round(100 - l1));
        CAT.forEach(c => $("#sl-" + c.k).disabled = true);
        const big = CAT.map(c => ({ c, d: v[c.k] - ref[c.k] })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
        return { score: score >= 80 ? 100 : score >= 60 ? 60 : 0, raw: score, correct: null, scoreLabel: `${score}/100`, expl: `<div class="cmp"><div class="line"><span>La tua stima</span>${stackHtml(v)}</div><div class="line"><span>Calcolato</span>${stackHtml(ref)}</div></div>${legendHtml(ref)}<p style="margin-top:8px">Scarto maggiore: <b>${big.c.n}</b> (${big.d > 0 ? "+" : ""}${fmt(big.d)} punti). Punteggio = 100 − somma degli scarti; 80+ conta come corretto.</p>` };
      },
    };
  },
};

const ALLBLK = [...BLOCKERS, ...GBLK];
const blkSz = s => s === 10 ? "1bb" : s + "%";
function blkFlopTxt(s) { return s <= 10 ? "Contro la mini-bet al flop ha chiamato quasi tutto." : s <= 33 ? "Contro la c-bet piccola al flop ha chiamato largo, anche con A-high, overcard e gutshot." : s <= 75 ? "Contro " + s + "% al flop ha lasciato gran parte degli A-high e delle overcard." : "Contro una c-bet grande al flop ha chiamato quasi solo con coppie e progetti."; }
function blkTurnTxt(s) { return s <= 50 ? "Con " + s + "% al turn ha continuato con quasi tutte le coppie e i progetti." : s <= 75 ? "Con 75% al turn ha continuato con top pair, coppie medie buone e progetti." : s <= 100 ? "Con 100% al turn ha lasciato parte delle coppie medie: restano top pair, poche coppie medie e i progetti." : "Con l'overbet 150% al turn ha tenuto top pair con buon kicker, mani forti e progetti forti, quasi niente coppie medie."; }
function blkLine(s) {
  const L = s.line; if (!L) return "";
  const vil = s.cfg === "3bp" ? "CO" : "BB", b = s.board.match(/../g);
  const st = (n, cards, rows) => `<div class="bl-st"><div class="bl-h"><b>${n}</b>${cardsHtml(cards, true)}</div>${rows.map(r => `<span class="${r[1] || ""}">${r[0]}</span>`).join("")}</div>`;
  return `<div class="bl-line">` +
    st("Flop", b.slice(0, 3).join(""), [["Piatto " + bb(L.pre)], ["Tu " + (L.fs === 10 ? "mini-bet 1bb" : blkSz(L.fs) + " (" + bb(L.fb) + ")"), "me"], [vil + " chiama", "vil"]]) +
    st("Turn", b[3], [["Piatto " + bb(L.pf)], ["Tu " + blkSz(L.ts) + " (" + bb(L.tb) + ")", "me"], [vil + " chiama", "vil"]]) +
    st("River", b[4], [["Piatto " + bb(L.pr)], [s.cfg === "sb" ? "Tocca a te" : vil + " check", "vil"], ["Bluff a piatto: " + bb(L.pr), "me"]]) +
    `</div><p class="hint" style="margin:0 0 10px">${blkFlopTxt(L.fs)} ${blkTurnTxt(L.ts)}${L.fc ? `<br><span class="muted">Size della strategia di riferimento: flop ${esc(L.fc)}; turn ${esc(L.tc)}.</span>` : ""}</p>`;
}
DRILLS.blocker = {
  name: "Scegli il bluff (blocker)", short: "Blocker", time: 50,
  desc: "Tra tre mani, trova quella che lascia più fold nel suo range.",
  rule: "Le tue carte tolgono combinazioni al suo range. Per bluffare scegli la mano che <b>toglie mani che pagano</b> e <b>lascia quelle che foldano</b>.",
  sample(ctx) { ctx.blkBag = ctx.blkBag && ctx.blkBag.length ? ctx.blkBag : shuffle(ALLBLK.map((_, k) => k)); return { id: ALLBLK[ctx.blkBag.pop()].id }; },
  build(p) {
    const s = ALLBLK.find(x => x.id === p.id);
    const best = s.cands.reduce((a, b) => b.foldPct > a.foldPct ? b : a);
    const short = str => str.split(",").slice(0, 10).join(", ") + (str.split(",").length > 10 ? "…" : "");
    return {
      title: "River · con quale mano bluffi?",
      body: `<p class="ctx">${esc(s.story)} Vuoi bluffare con una puntata grande: ${s.id[0] === "g" ? "lui paga con qualsiasi coppia o meglio e folda il resto" : "lui paga con le mani in verde e folda quelle in rosso"}. Le tre mani qui sotto non hanno coppia né progetto chiuso.</p>` + (s.line ? blkLine(s) : tableHtml([{ lbl: "Board", cards: s.board }])) +
        `<p style="font-size:14px;margin:0 0 4px"><span class="pill good">PAGA</span> ${esc(short(s.callsDesc))}</p><p style="font-size:14px;margin:0 0 12px"><span class="pill bad">FOLDA</span> ${esc(short(s.foldsDesc))}</p>`,
      layout: "cols3", opts: shuffle(s.cands).map(c => ({ label: `<span style="display:flex;gap:4px">${cardsHtml(c.hand, true)}</span>`, v: c.hand })), timed: false,
      check(v) {
        const me = s.cands.find(c => c.hand === v);
        const score = me === best ? 100 : best.foldPct - me.foldPct <= 1.5 ? 60 : 0;
        const rows = s.cands.slice().sort((a, b) => b.foldPct - a.foldPct).map(c => `<tr><td>${icHand(c.hand)}</td><td class="mono">${fmt(c.calls)}</td><td class="mono">${fmt(c.folds)}</td><td class="mono"><b>${fmt(c.foldPct, 1)}%</b></td></tr>`).join("");
        return { score, correct: best.hand, expl: `<p>Prima di contare le tue carte: ${fmt(s.calls0)} combinazioni pagano, ${fmt(s.folds0)} foldano (fold ${fmt(s.foldPct0, 1)}%).</p><div class="tablewrap"><table class="hist"><thead><tr><th>Mano</th><th>Pagano</th><th>Foldano</th><th>Fold</th></tr></thead><tbody>${rows}</tbody></table></div><p style="margin-top:8px">${icHand(best.hand)} lascia più fold: toglie ${fmt(s.calls0 - best.calls)} combinazioni che pagano e ${fmt(s.folds0 - best.folds)} che foldano.${me !== best ? ` ${icHand(me.hand)} ne toglie ${fmt(s.calls0 - me.calls)} che pagano e ${fmt(s.folds0 - me.folds)} che foldano.` : ""}</p>` };
      },
    };
  },
};

const ARCH = {
  nit: { n: "Nit", st: { VPIP: [11, 16], PFR: [9, 13], AF: [1.4, 2.4], "3BET": [2, 4], "FOLD CB": [55, 66], WTSD: [21, 26] }, ex: "Ruba spesso e folda contro le sue bet grandi al river", why: "VPIP e PFR bassissimi, 3-bet raro: gioca poche mani e le sue bet grandi sono value." },
  station: { n: "Calling station", st: { VPIP: [38, 55], PFR: [5, 11], AF: [0.6, 1.3], "3BET": [1, 3], "FOLD CB": [24, 36], WTSD: [33, 42] }, ex: "Value bet grandi e frequenti, anche thin; niente bluff", why: "VPIP altissimo con PFR basso e WTSD sopra il 32%: chiama e arriva a showdown." },
  reg: { n: "Reg / TAG", st: { VPIP: [22, 27], PFR: [18, 23], AF: [2.5, 3.4], "3BET": [6, 9], "FOLD CB": [42, 52], WTSD: [26, 30] }, ex: "Resta vicino alla strategia di base; bluff solo con buoni blocker", why: "Numeri equilibrati: VPIP e PFR vicini, 3-bet nella norma, fold to c-bet medio." },
  fitfold: { n: "Fit-or-fold", st: { VPIP: [25, 33], PFR: [14, 20], AF: [1.6, 2.4], "3BET": [3, 6], "FOLD CB": [62, 74], WTSD: [19, 24] }, ex: "C-bet piccole e frequenti al flop; smetti di bluffare quando chiama", why: "Fold to c-bet sopra il 60% e WTSD basso: molla se non colpisce il flop." },
  lag: { n: "LAG", st: { VPIP: [29, 35], PFR: [23, 29], AF: [3.2, 4.2], "3BET": [9, 13], "FOLD CB": [36, 45], WTSD: [27, 31] }, ex: "Allarga la difesa e fai check-raise al flop; non foldare troppo ai barrel", why: "VPIP e PFR alti e vicini, 3-bet alto: pressione costante ma con criterio." },
  maniac: { n: "Maniac", st: { VPIP: [46, 62], PFR: [30, 45], AF: [4.6, 7], "3BET": [14, 22], "FOLD CB": [22, 34], WTSD: [30, 36] }, ex: "Lascialo bluffare: trap, call più light, pochi bluff tuoi", why: "VPIP sopra il 45% con AF altissimo: overbluffa ovunque." },
};
DRILLS.profile = {
  name: "Leggi il giocatore", short: "Profili", time: 30,
  desc: "Dalle statistiche HUD all'archetipo e all'exploit giusto.",
  rule: "Guarda prima VPIP e PFR (quante mani gioca e quante ne rilancia), poi AF e WTSD (quanto è aggressivo e quanto arriva a showdown).",
  sample() { const k = pick(Object.keys(ARCH)); return { k, stats: Object.entries(ARCH[k].st).map(([n, [lo, hi]]) => [n, n === "AF" ? Math.round(rnd(lo, hi) * 10) / 10 : Math.round(rnd(lo, hi))]), hands: rint(400, 4200), others: shuffle(Object.keys(ARCH).filter(x => x !== k)).slice(0, 3) }; },
  build({ k, stats, hands, others }) {
    const a = ARCH[k];
    return {
      title: "Chi è e come lo attacchi?",
      body: `<p class="ctx">HUD su <b class="mono">${fmt(hands)}</b> mani, NL25 6-max.</p><div class="hud">${stats.map(([n, v]) => `<div><b>${n === "AF" ? fmt(v, 1) : v}</b><span>${n}</span></div>`).join("")}</div>`,
      layout: "", opts: shuffle([k, ...others]).map(x => ({ label: `<b>${ARCH[x].n}</b> · ${ARCH[x].ex}`, v: x })), timed: false,
      check(v) { return { score: v === k ? 100 : 0, correct: k, expl: `<p><b>${a.n}.</b> ${a.why}</p><p>Exploit: ${a.ex}.</p>` }; },
    };
  },
};

