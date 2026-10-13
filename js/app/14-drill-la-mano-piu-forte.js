/* ================= DRILL: LA MANO PIÙ FORTE =================
   Modalità A: tre mani e un board, scegli quella con più equity se vanno tutte e tre all-in insieme. */
const DJ_ST = { pre: ["Preflop", 0], flop: ["Flop", 3], turn: ["Turn", 4], river: ["River", 5] };
const djCache = new Map();
function djMemo(key, f) { if (djCache.has(key)) return djCache.get(key); const v = f(); djCache.set(key, v); if (djCache.size > 60) djCache.delete(djCache.keys().next().value); return v; }
function djEqA(hs, b) { return djMemo("A|" + hs.join(",") + "|" + b, () => djEquity(hs.map(djCs), djCs(b), 40000)); }
function djBoardHtml(st, b) { return `<div class="dj-board"><span class="dj-st">${DJ_ST[st][0]}</span>${b ? cardsHtml(b) : `<span class="dj-pre">Nessuna carta sul tavolo</span>`}</div>`; }
/* motivo preflop semplice: dominio, coppia contro carte più alte */
function djPreWhy(hs, best) {
  const R = h => h.match(/../g).map(c => rv(c[0])).sort((a, b) => b - a), w = R(hs[best]);
  const pairW = w[0] === w[1];
  const dom = hs.map((h, i) => i).filter(i => i !== best).find(i => { const r = R(hs[i]); return r[0] !== r[1] && !pairW && r.some(x => w.includes(x)) && Math.max(...r.filter(x => !w.includes(x))) < Math.max(...w.filter(x => !r.includes(x))); });
  if (dom != null) return `${icHand(hs[best])} domina ${icHand(hs[dom])}: hanno una carta in comune e l'altra è più alta, quindi quando fanno la stessa coppia vince quasi sempre lei.`;
  if (pairW) return `Una coppia in mano parte già avanti: le altre devono accoppiare una delle loro carte per superarla.`;
  return `Preflop conta soprattutto chi ha le carte più alte e chi non è dominato; seme e carte collegate aggiungono qualche punto.`;
}
DRILLS.strongest = {
  name: "La mano più forte", short: "Mano più forte", time: 30, gameFree: true,
  desc: "Minigioco da 10 round: tre mani e un board, tocca quella con più equity se vanno all-in tutte e tre.",
  rule: "<b>Equity</b>: la parte di piatto che una mano vince in media se si va allo showdown, con le carte che devono ancora uscire (i pareggi valgono metà). Non conta solo la combinazione di adesso: un progetto forte può valere più di una coppia piccola. Al river invece non escono altre carte e vince la combinazione migliore.",
  sample(ctx) {
    const o = (ctx.opt) || {};
    const st = o.st === "post" ? pick(["flop", "flop", "turn"]) : o.st || pick(["pre", "flop", "flop", "turn", "river"]);
    const want = st === "flop" || st === "turn" ? Math.random() < 0.45 : false, close = st === "pre" && Math.random() < 0.5;
    for (let k = 0; k < 60; k++) {
      const nb = DJ_ST[st][1], c = dealCards(6 + nb), hs = [c.slice(0, 2).join(""), c.slice(2, 4).join(""), c.slice(4, 6).join("")], b = c.slice(6).join("");
      const r = st === "pre" ? djEquity(hs.map(djCs), [], 6000) : djEqA(hs, b);
      const s = [...r.eq].sort((x, y) => y - x), gap = s[0] - s[1];
      if (st === "river") { if (s[2] === s[0]) continue; }
      else if (st === "pre") { if (gap < 4 || (close && gap > 14)) continue; }
      else if (gap > 1e-9 && gap < 2) continue;
      if (want && k < 50) { const vs = hs.map(h => djEval(djCs(h + b))), cl = vs.indexOf(Math.max(...vs)); if (cl === r.eq.indexOf(s[0])) continue; }
      return { m: "A", st, h: hs, b };
    }
    return { m: "A", st: "flop", h: ["AhKh", "QsQd", "7c6c"], b: "Qh7h2c" };
  },
  build(p) { return djBuildA(p); },
};
/* soluzione di una domanda "la mano più forte": stesso motore del calcolatore */
function djSolveA({ st, h: hs, b }) {
  const J = eqJob(hs, b), o = eqFinish(J);
  const bc = djCs(b), vs = b ? hs.map(h => djEval(djCs(h + b))) : null, bestV = vs ? Math.max(...vs) : -1, cls = vs ? vs.map((v, i) => i).filter(i => vs[i] === bestV) : [];
  const mx = Math.max(...o.eq), tol = o.exact ? 1e-9 : Math.max(0.3, o.se), win = hs.map((x, i) => i).filter(i => mx - o.eq[i] <= tol);
  const sorted = [...o.eq].sort((x, y) => y - x), led = cls.length === 1 ? cls[0] : -1, hard = (led >= 0 && !win.includes(led)) || (st !== "river" && sorted[0] - sorted[1] < 6);
  const now = h => { if (!vs) return ""; const f = fzClass(djCs(h), bc); return djName(djEval(djCs(h + b))) + (f.draws.length ? ` + ${f.draws.filter(d => d !== "Colore e scala insieme").map(d => d.toLowerCase()).join(", ")}` : ""); };
  let why;
  if (st === "river") why = win.length > 1 ? `Pareggio: ${win.map(i => icHand(hs[i])).join(" e ")} hanno la stessa mano di cinque carte e si dividono il piatto. Entrambe le risposte sono giuste.` : `Al river non escono più carte: vince la combinazione migliore di cinque carte, kicker compresi.`;
  else if (st === "pre") why = djPreWhy(hs, win[0]);
  else if (led >= 0 && !win.includes(led)) {
    const w0 = win[0], used = new Set([...hs.flatMap(h => djCs(h)), ...bc]), nxt = []; for (let c = 0; c < 52; c++) if (!used.has(c)) nxt.push(c);
    const good = nxt.filter(c => { const sc = hs.map(h => djEval([...djCs(h), ...bc, c])); return sc[w0] > Math.max(...sc.filter((x, i) => i !== w0)); });
    const fw = fzClass(djCs(hs[w0]), bc), dr = fw.draws.filter(d => d !== "Colore e scala insieme").map(d => d.toLowerCase());
    const suitTxt = fw.draws.includes("Progetto colore") ? (() => { const all = [...djCs(hs[w0]), ...bc], s = [0, 1, 2, 3].find(x => all.filter(c => (c & 3) === x).length === 4), others = hs.filter((h, i) => i !== w0 && djCs(h).some(c => (c & 3) === s)); const sn = ({ 0: "picche", 1: "cuori", 2: "quadri", 3: "fiori" })[s]; return others.length ? ` (anche ${others.map(icHand).join(" e ")} ha ${sn}, quindi qualche colore non basta)` : ` e le altre due mani non hanno carte di ${sn}`; })() : "";
    why = `Adesso è davanti ${icHand(hs[led])} (${djName(vs[led])}), ma ${icHand(hs[w0])} ha ${djName(vs[w0]).toLowerCase()}${dr.length ? ` più ${dr.join(" e ")}` : ""}${suitTxt}. Al ${bc.length === 3 ? "turn" : "river"} ${good.length} carte su ${nxt.length} la mettono già davanti${bc.length === 3 ? ", e con due carte da vedere le occasioni si sommano" : ""}: per questo vince più spesso di chi oggi ha la combinazione migliore.`;
  }
  else if (led < 0 && cls.length) why = `Adesso ${cls.map(i => icHand(hs[i])).join(" e ")} hanno la stessa combinazione: decide chi migliora più spesso con le carte che devono uscire.`;
  else why = `${icHand(hs[win[0]])} è davanti adesso e le altre non hanno abbastanza outs per recuperare spesso.`;
  if (win.length > 1 && st !== "river") why = `${o.exact ? "Pareggio di equity" : "Equity praticamente uguali (dentro il margine della simulazione)"}: ${win.map(i => icHand(hs[i])).join(" e ")}, entrambe le risposte sono giuste. ` + why;
  return { o, win, vs, hard, now, why };
}
/* tavolo in stile minigioco: board con 5 posti e le tre mani intorno */
function djTable2(st, hs, b, ids) {
  const nb = DJ_ST[st][1], bb = (b.match(/../g) || []);
  const slots = [0, 1, 2, 3, 4].map(i => `<span class="sh2-slot">${i < nb ? card(bb[i]) : ""}</span>`).join("");
  const hand = i => `<button type="button" class="sh2-hand p${i}" data-sh="${i}" aria-label="Mano ${i + 1}"><span class="sh2-cards">${hs[i].match(/../g).map(c => card(c)).join("")}</span><span class="sh2-badge" data-shb="${i}"></span></button>`;
  return `<div class="sh2-felt"><span class="sh2-st">${DJ_ST[st][0]}</span><div class="sh2-board">${slots}</div></div><div class="sh2-hands">${hand(0)}${hand(1)}<div class="sh2-row2">${hand(2)}</div></div>`;
}
/* dopo la risposta: equity sotto ogni mano, la migliore in oro, la scelta sbagliata in rosso */
function djMark2(root, R, chosen) {
  root.querySelectorAll("[data-sh]").forEach(el => { const i = +el.dataset.sh; el.disabled = true; el.classList.toggle("best", R.win.includes(i)); el.classList.toggle("wrong", i === chosen && !R.win.includes(i)); el.classList.toggle("pick", i === chosen); const bd = el.querySelector(".sh2-badge"); if (bd) { bd.textContent = eqShow(R.o.eq[i], 1); bd.classList.add("on"); } });
}
function djBuildA(p) {
  const { st, h: hs, b } = p, J = eqJob(hs, b);
  const nm = st === "river" ? "chi vince allo showdown" : "chi ha più equity se vanno tutte e tre all-in adesso";
  let R = null, ch = -1;
  return {
    title: `La mano più forte · ${DJ_ST[st][0]}`,
    body: `<div class="sh2 inq"><p class="sh2-q">Tre giocatori vanno all-in ${st === "pre" ? "preflop" : `al ${DJ_ST[st][0].toLowerCase()}`}. Tocca <b>${nm}</b>.</p>${djTable2(st, hs, b)}</div>`,
    layout: "sh2-hidden", center: true, opts: hs.map((h, i) => ({ label: icHand(h), v: i })), timed: false,
    mount() { eqBackground(J); document.querySelectorAll(".sh2 [data-sh]").forEach(el => el.onclick = () => { const o = document.querySelector(`.opt[data-k="${el.dataset.sh}"]`); if (o) o.click(); }); },
    check(v) {
      ch = v; R = djSolveA(p); const o = R.o, ok = R.win.includes(v);
      const rows = hs.map((h, i) => `<tr class="${R.win.includes(i) ? "dj-win" : ""}"><td>${icHand(h)}</td>${R.vs ? `<td>${R.now(h)}</td>` : ""}<td class="num"><b>${eqPct(o.eq[i])}</b></td><td class="num dj-x">${eqPct(o.win[i])}</td><td class="num dj-x">${eqPct(o.tie[i])}</td></tr>`).join("");
      return { score: ok ? 100 : 0, correct: R.win[0], correctAll: R.win, bonus: ok && R.hard ? 3 : 0, expl: `<div class="dj-tw"><table class="dj-tab"><thead><tr><th>Mano</th>${R.vs ? "<th>Adesso</th>" : ""}<th class="num">Equity</th><th class="num dj-x">Vince</th><th class="num dj-x">Pareggia</th></tr></thead><tbody>${rows}</tbody></table></div><p>${R.why}</p><p class="muted" style="font-size:13px">${st === "river" ? "Al river non escono altre carte: il risultato è certo." : eqNote(o)} L'equity conta le vittorie più la parte di piatto dei pareggi.</p><p>${eqBtn(hs, b)}</p>` };
    },
    after() { const root = document.querySelector(".sh2"); if (root && R) djMark2(root, R, ch); },
  };
}

