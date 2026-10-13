/* ================= utilità ================= */
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (x, d = 0) => Number(x).toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d });
const bb = x => fmt(x, Math.abs(x - Math.round(x)) > 0.001 ? 1 : 0) + "bb";
const dstr = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const today = () => dstr(new Date());
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return dstr(d); };

const RANKS = "23456789TJQKA";
const SUITS = "shdc";
const SYM = { s: "♠", h: "♥", d: "♦", c: "♣" };
const rv = r => RANKS.indexOf(r) + 2;
const rname = r => r === "T" ? "10" : r;
function card(code, sm) {
  const r = code[0], s = code[1];
  return `<span class="pc ${sm ? "sm " : ""}su-${s}" aria-label="${rname(r)} di ${({ s: "picche", h: "cuori", d: "quadri", c: "fiori" })[s]}"><span class="r">${rname(r)}</span><span class="s">${SYM[s]}</span></span>`;
}
const cardsHtml = (str, sm) => `<span class="cards">${(str.match(/../g) || []).map(c => card(c, sm)).join("")}</span>`;
const ic = code => `<span class="ic ic-${code[1]}">${rname(code[0])}<span>${SYM[code[1]]}</span></span>`;
const icHand = str => (str.match(/../g) || []).map(ic).join(" ");
/* board e mano disegnati su un tavolo da poker: board al centro, la tua mano nel tuo posto, l'avversario sopra */
const tableHtml = (parts, six) => {
  const isHero = p => !!p.hero || /mano/i.test(p.lbl), board = parts.filter(p => !isHero(p) && p.cards), hero = parts.find(p => isHero(p) && p.cards);
  if (six && typeof sixTable === "function") return sixPost(six, board, hero ? hero.cards : null);
  const av = typeof gwAv === "function" ? gwAv("Avversario", true) : "", me = typeof gMascot === "function" ? gMascot("think", 36) : "";
  return `<div class="ptbl"><div class="ptbl-felt ${hero ? "hh" : ""}"><div class="qrail"></div>
    <div class="ptbl-seat vil"><div class="ptbl-back"><i></i><i></i></div><div class="ptbl-plate">${av}<b>Avversario</b></div></div>
    <div class="ptbl-board">${board.length ? board.map(p => `<div class="ptbl-grp"><span>${p.lbl}</span>${cardsHtml(p.cards, p.sm)}</div>`).join("") : `<span class="ptbl-pre">Preflop</span>`}</div>
    <div class="ptbl-seat hero">${hero ? `<div class="ptbl-hc">${cardsHtml(hero.cards, hero.sm)}</div>` : ""}<div class="ptbl-plate">${me}<b>Tu</b></div></div>
  </div></div>`;
};
/* ---- tavolo 6-max: sei posti, chi ha foldato, puntate davanti ai giocatori, bottone del dealer ---- */
const P6 = ["EP", "MP", "CO", "BTN", "SB", "BB"];
const P6_SLOT = [[50, 100], [6, 76], [14, 8], [50, -2], [86, 8], [94, 76]]; /* posizione in % sul tavolo, 0 = tu (in basso), poi in senso orario */
const fmtBB = x => fmtN(x) + "bb";
function sixTable(o) {
  const hi = P6.indexOf(o.hero), seats = o.seats || {};
  const pot = o.pot != null ? o.pot : P6.reduce((a, p) => a + ((seats[p] && seats[p].bet) || 0), 0);
  const seatHtml = (p, k) => {
    const S0 = seats[p] || { st: "fold" }, [x, y] = P6_SLOT[k], me = p === o.hero, fold = S0.st === "fold";
    const bx = 50 + (x - 50) * 0.58, by = 46 + (y - 46) * 0.52;
    const bet = S0.bet ? `<div class="p6-bet ${S0.bet > 1 ? "big" : ""}" style="left:${bx}%;top:${by}%"><i></i><b>${fmtN(S0.bet)}</b></div>` : "";
    const dx = 50 + (x - 50) * 0.8 + (k === 0 ? 17 : k === 3 ? -9 : 0), dy = 46 + (y - 46) * 0.78 + (k === 1 || k === 5 ? -8 : k === 2 || k === 4 ? 8 : k === 0 ? -6 : 0);
    const btn = p === "BTN" ? `<div class="p6-dealer" style="left:${dx}%;top:${dy}%">D</div>` : "";
    const cards = me ? (o.heroCards ? `<div class="p6-hc">${cardsHtml(o.heroCards)}</div>` : "") : !fold ? `<div class="p6-back"><i></i><i></i></div>` : "";
    const tag = fold ? `<em>Fold</em>` : S0.tag ? `<em class="act">${S0.tag}</em>` : "";
    return `${bet}${btn}<div class="p6-seat ${me ? "me" : ""} ${fold ? "fold" : ""} ${S0.st === "wait" ? "wait" : ""} s${k}" style="left:${x}%;top:${y}%">${cards}<div class="p6-plate"><b>${me ? "Tu · " + p : p}</b><span>${fmtBB(S0.stk != null ? S0.stk : Math.max(0, (o.stack || 100) - (S0.bet || 0)))}</span>${tag}</div></div>`;
  };
  const board = (o.board || []).filter(b => b.cards);
  return `<div class="p6"><div class="p6-felt"><div class="qrail"></div>
    <div class="p6-mid">${board.length ? `<div class="ptbl-board">${board.map(b => `<div class="ptbl-grp"><span>${b.lbl}</span>${cardsHtml(b.cards, b.sm)}</div>`).join("")}</div>` : `<span class="ptbl-pre">${o.street || "Preflop"}</span>`}<span class="p6-pot">Piatto <b>${fmtBB(pot)}</b></span></div>
    ${P6.map((p, i) => seatHtml(p, (i - hi + 6) % 6)).join("")}
  </div></div>`;
}
/* stato del tavolo per uno spot preflop delle tabelle (chi ha aperto, chi ha 3-bettato, chi ha foldato) */
function pf6State(sp) {
  const id = String(sp.id).replace(/^m_/, ""), L = sp.label || "", num = x => parseFloat(String(x).replace(",", ".")), up = x => String(x).toUpperCase();
  const size = rx => { const m = L.match(rx); return m ? num(m[1]) : null; };
  let hero, m; const acts = [];
  if ((m = id.match(/^rfi_(ep|mp|co|btn|sb)$/))) hero = up(m[1]);
  else if ((m = id.match(/^bb_(ep|mp|co|btn|sb)$/))) { hero = "BB"; acts.push([up(m[1]), "open", size(/open ([\d,]+)bb/) || 2.2]); }
  else if ((m = id.match(/^(ep|mp|co|btn|sb)_(ep|mp|co|btn|sb)$/))) { hero = up(m[1]); acts.push([up(m[2]), "open", size(/open ([\d,]+)bb/) || 2.2]); }
  else if ((m = id.match(/^(ep|mp|co|btn|sb)_vs_(mp|co|btn|sb|bb)3$/))) { hero = up(m[1]); acts.push([hero, "open", size(/aperto ([\d,]+)bb/) || 2.2], [up(m[2]), "3-bet", size(/3-betta a ([\d,]+)bb/) || 7]); }
  else if ((m = id.match(/^sq_(\w+)_(\w+)$/))) { hero = up(m[1]); const o = size(/apre ([\d,]+)bb/) || 2.2; acts.push([up(m[2]), "open", o]); const c = L.match(/(EP|MP|CO|BTN|SB|BB) chiama/); if (c) acts.push([c[1], "call", o]); }
  else if ((m = id.match(/^c4_(\w+)_(\w+)$/))) { hero = up(m[1]); acts.push([up(m[2]), "open", size(/apre ([\d,]+)bb/) || 2.2]); const t = L.match(/(EP|MP|CO|BTN|SB|BB) 3-betta a ([\d,]+)bb/); if (t) acts.push([t[1], "3-bet", num(t[2])]); }
  else return null;
  if (!P6.includes(hero)) return null;
  const seats = {}, heroActed = acts.some(a => a[0] === hero), hi = P6.indexOf(hero);
  P6.forEach((p, i) => { seats[p] = { st: heroActed || i < hi ? "fold" : "wait", bet: p === "SB" ? 0.5 : p === "BB" ? 1 : 0 }; });
  seats[hero].st = "hero";
  acts.forEach(([p, a, x]) => { if (!seats[p]) return; seats[p].st = "in"; seats[p].bet = x; seats[p].tag = a === "open" ? "Open" : a === "call" ? "Call" : a; });
  if (seats[hero].tag === "Open") seats[hero].tag = "";
  return { hero, seats };
}
/* postflop 6-max: restano in due, gli altri hanno foldato preflop */
function sixPost(six, board, heroCards) {
  const seats = {}, left = 100 - (six.inv || 0); P6.forEach(p => { seats[p] = { st: "fold", bet: 0, stk: p === "SB" ? 99.5 : p === "BB" ? 99 : 100 }; });
  seats[six.hero] = { st: "hero", bet: 0, stk: left }; if (six.vil) seats[six.vil] = { st: "in", bet: 0, stk: left };
  Object.entries(six.bets || {}).forEach(([p, x]) => { if (seats[p]) { seats[p].bet = x; seats[p].stk = Math.max(0, seats[p].stk - x); seats[p].tag = six.tags && six.tags[p] || "Bet"; } });
  return sixTable({ hero: six.hero, seats, board, heroCards, pot: six.pot, stack: six.stack || 100 - (six.inv || 0) });
}
function pf6Table(sp, heroCards) { const st = pf6State(sp); return st ? sixTable({ ...st, heroCards }) : null; }
const CAT = [
  { k: "forte", L: "F", n: "2 coppie o meglio", v: "var(--c-forte)" },
  { k: "top", L: "T", n: "Top pair / overpair", v: "var(--c-top)" },
  { k: "medio", L: "M", n: "Coppia media o bassa", v: "var(--c-medio)" },
  { k: "draw", L: "D", n: "Progetti (colore, scala)", v: "var(--c-draw)" },
  { k: "aria", L: "A", n: "Niente (A-high, draw mancati)", v: "var(--c-aria)" },
];
const CATL = Object.fromEntries(CAT.map(c => [c.L, c]));
const stackHtml = comp => `<div class="stack">${CAT.map(c => comp[c.k] > 0 ? `<span style="width:${comp[c.k]}%;background:${c.v}" title="${c.n} ${fmt(comp[c.k])}%"></span>` : "").join("")}</div>`;
const legendHtml = comp => `<div class="legend">${CAT.filter(c => !comp || comp[c.k] > 0).map(c => `<span><i style="background:${c.v}"></i>${c.n}${comp ? ` <b class="mono">${fmt(comp[c.k])}%</b>` : ""}</span>`).join("")}</div>`;
const sizeName = s => s === 0 ? "Check" : Math.abs(s - 0.33) < .01 ? "1/3" : s === 0.5 ? "1/2" : s === 0.75 ? "3/4" : s === 1 ? "Pot" : s === 1.5 ? "1,5x" : "All-in";

