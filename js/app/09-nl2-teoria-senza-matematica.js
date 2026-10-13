/* ================= NL2: TEORIA SENZA MATEMATICA ================= */
/* ---- Contro i limper: isolare, overlimpare o foldare ---- */
const VL_R = "AKQJT98765432";
const vlRv = r => 14 - VL_R.indexOf(r);
function vlCat(h) {
  const a = h[0], b = h[1], s = h[2] === "s", pair = a === b, hi = vlRv(a), lo = vlRv(b), gap = hi - lo;
  if (pair) return hi >= 7 ? "value" : "spec";
  if (a === "A") { if (lo >= 11 || (s && lo >= 10)) return "value"; if (s) return "spec"; return lo >= 9 ? "wide" : "trash"; }
  if (a === "K") { if (b === "Q" || (s && lo >= 10)) return "value"; if (lo >= 10 || (s && lo === 9)) return "wide"; return "trash"; }
  if (a === "Q") { if (s && lo >= 10) return "value"; if (b === "J" || (s && lo === 9)) return "wide"; return "trash"; }
  if (s && gap <= 2 && lo >= 4 && hi <= 11) return "spec";
  if (a === "J" && b === "T") return "wide";
  return "trash";
}
const VL_POOL = (() => { const out = { value: [], wide: [], spec: [], trash: [] }; for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) { const h = i === j ? VL_R[i] + VL_R[j] : i < j ? VL_R[i] + VL_R[j] + "s" : VL_R[j] + VL_R[i] + "o"; if (!out[vlCat(h)].includes(h)) out[vlCat(h)].push(h); } return out; })();
const vlIso = (n, oop) => 4 + (n - 1) + (oop ? 1 : 0);
/* il range di iso coincide più o meno con quello di open dalla stessa posizione */
function vlOpen(pos, h) { const sp = typeof PRE_BY !== "undefined" && preFor("rfi_" + pos.toLowerCase()); if (!sp) return null; const x = sp.f[h]; return x ? x[x.length - 1] : 0; }
DRILLS.vslimp = {
  name: "Contro i limper", short: "Limp", time: 20,
  desc: "Uno o più giocatori entrano con un limp: isoli, entri anche tu con un limp o foldi?",
  rule: "Contro chi limpa: <b>isola con il tuo range di apertura</b> da quella posizione (i due range coincidono più o meno), a circa 3bb + 1bb per ogni limper (4bb contro uno), 1bb in più se sei fuori posizione; contro chi non folda mai puoi salire ancora. <b>Il limp si esclude quasi sempre</b>: solo dalla SB completare con coppie basse e suited ha senso. Fuori dal range di open: fold. Dal BB con mani deboli basta il check.",
  sample() {
    const hero = pick(["MP", "CO", "BTN", "BTN", "SB", "BB"]), hi = P6.indexOf(hero);
    const before = P6.slice(0, hi).filter(p => p !== "SB" && p !== "BB");
    const pool = hero === "BB" ? ["EP", "MP", "CO", "BTN"] : before;
    const n = Math.min(pool.length, pick([1, 1, 1, 2, 2, 3]));
    const limpers = shuffle(pool).slice(0, Math.max(1, n)).sort((a, b) => P6.indexOf(a) - P6.indexOf(b));
    let h;
    const sp = hero !== "BB" && preFor("rfi_" + hero.toLowerCase());
    if (sp && Math.random() < 0.8) { const keys = Object.keys(sp.f), inR = keys.filter(k => vlOpen(hero, k) >= 0.5), near = typeof preBorder === "function" ? preBorder(sp) : []; h = Math.random() < 0.5 ? pick(inR) : pick(near.length ? near : keys); }
    else { const cat = pick(["value", "value", "wide", "spec", "spec", "trash"]); h = pick(VL_POOL[cat]); }
    return { hero, limpers, h, c: randCardsFor(h) };
  },
  build({ hero, limpers, h, c }) {
    const n = limpers.length, oop = hero === "SB" || hero === "BB", ip = !oop, cat = vlCat(h), size = vlIso(n, oop);
    const acts = hero === "BB" ? ["Check", `Raise a ${size}bb`] : [hero === "SB" ? "Fold" : "Fold", hero === "SB" ? "Completa (0,5bb)" : "Limp anche tu (1bb)", `Iso a ${size}bb`];
    /* risposta: [migliore, accettabile] come indici */
    let best, ok = -1, why;
    if (hero === "BB") {
      if (cat === "value") { best = 1; why = `${h} è abbastanza forte per fare raise: i limper giocano mani deboli e pagano troppo.`; }
      else if (cat === "wide" && n <= 2) { best = 1; ok = 0; why = `${h} batte buona parte delle mani con cui si limpa: fai raise e fai pagare chi è entrato con carte deboli. Anche il check è accettabile, visto che sei fuori posizione.`; }
      else { best = 0; why = `${h} non è una mano da gonfiare il piatto fuori posizione: vedi il flop gratis con il check.`; if (cat === "wide") ok = 1; }
    } else if (hero === "SB") {
      const fo = vlOpen("SB", h) ?? 0;
      if (cat === "spec") { best = 1; if (fo >= 0.5) ok = 2; why = `Dalla SB completare costa solo 0,5bb: con ${h} cerchi il set, la scala o il colore in un piatto già grande. È l'unico posto dove entrare senza rilanciare ha senso.`; }
      else if (fo >= 0.5 || cat === "value") { best = 2; if (cat === "wide" && n >= 2) ok = 1; why = `${h} è nel tuo range di apertura dalla SB: isola, con 1bb in più perché sarai fuori posizione. Il range di iso è più o meno quello di open.`; }
      else { best = 0; why = `${h} non è nel range di apertura dalla SB: anche se completare costa poco, fuori posizione perdi soldi a giocarla.`; }
    } else {
      const fo = vlOpen(hero, h) ?? (cat === "trash" ? 0 : 1);
      if (fo >= 0.5) { best = 2; why = `${h} è nel tuo range di apertura da ${hero} (${Math.round(fo * 100)}%): contro i limper il range di iso è più o meno lo stesso dell'open. Isola: chi limpa gioca mani deboli e tu hai l'iniziativa${ip ? " e la posizione" : ""}. Il limp no, lascia il vantaggio agli altri.`; }
      else if (fo >= 0.15) { best = 2; ok = 0; why = `${h} da ${hero} è una mano di confine (open ${Math.round(fo * 100)}%): contro limper deboli isolare è la scelta migliore, ma anche il fold va bene. Il limp no.`; }
      else { best = 0; why = `${h} non è nel range di apertura da ${hero}: il range di iso è più o meno quello di open, quindi fold. Entrare con un limp non la rende giocabile.`; }
    }
    const seats = {}; const hi = P6.indexOf(hero);
    P6.forEach((p, i) => { seats[p] = { st: i < hi || (hero === "BB" && p === "SB") ? "fold" : "wait", bet: p === "SB" ? 0.5 : p === "BB" ? 1 : 0 }; });
    limpers.forEach(p => { seats[p] = { st: "in", bet: 1, tag: "Limp" }; });
    seats[hero] = { ...seats[hero], st: "hero" };
    const lim = limpers.join(n === 2 ? " e " : ", ");
    const ctx = `${n === 1 ? `${lim} entra con un limp` : `${lim} entrano con un limp`}${hero === "BB" ? ", la SB folda" : ", gli altri foldano"} fino a te. Sei <b>${hero}</b>. NL2, 100bb. Cosa fai?`;
    return {
      title: `Contro ${n === 1 ? "un limper" : n + " limper"} · ${hero}`,
      body: `<p class="ctx">${ctx}</p>` + sixTable({ hero, seats, heroCards: c }),
      layout: acts.length === 3 ? "cols3" : "cols2", center: true, opts: acts.map((a, k) => ({ label: a, v: k })), timed: true,
      check(v) {
        const score = v === best ? 100 : v === ok ? 60 : 0;
        const sz = best === (hero === "BB" ? 1 : 2) || ok === (hero === "BB" ? 1 : 2) ? `<p class="muted">Size: 4bb contro un limper, +1bb per ogni limper in più${oop ? ", +1bb perché sei fuori posizione" : ""}: qui <b>${size}bb</b>. Una size piccola fa entrare tutti e perdi il vantaggio di isolare.</p>` : "";
        return { score, correct: best, expl: `<p>${why}</p>${ok >= 0 ? `<p class="muted">Accettabile anche: ${acts[ok]}.</p>` : ""}${sz}` };
      },
    };
  },
};

/* ---- Teoria NL2: domande di strategia, niente conti ---- */
/* LESSONS BEGIN */
/* ---------------- piccoli strumenti interattivi delle schede ----------------
   Il primo disegno lo fa UI.* (HTML), i ridisegni li fanno i gestori delegati in fondo al file:
   funzionano ovunque la scheda venga mostrata (lezione, ripasso, finestra «Scheda»). */
const LXW = (() => {
  const fI = n => Math.round(Math.abs(n)).toLocaleString("it-IT");
  const sg = n => (n > 0 ? "+" : n < 0 ? "−" : "") + fI(n);
  const eur = (n, d = 2) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: true }) + " €";
  const cls = n => n > 0 ? "g" : n < 0 ? "r" : "";
  return {
    edgeRes(v, rake, rb = 0) {
      const back = rake * rb / 100, base = v - rake, r = Math.round((base + back) * 10) / 10, bb = Math.round(r * 100), e = bb * 0.02;
      const n = x => (x > 0 ? "+" : x < 0 ? "−" : "") + String(Math.round(Math.abs(x) * 10) / 10).replace(".", ",");
      const msg = r > 0 ? (rb && base <= 0 ? `Vinci grazie al rakeback: senza, saresti a ${n(base)} bb/100.` : "Vinci: il vantaggio paga la rake e te ne resta una parte.")
        : r === 0 ? (rb ? "In pari: vantaggio e rakeback pagano appena la rake." : "In pari: tutto il vantaggio se ne va in rake.")
        : v > 0 ? (rb ? "Perdi: anche con il rakeback, la rake è più grande del tuo vantaggio." : "Perdi: sei più bravo del tavolo, ma la rake è più grande del tuo vantaggio.")
        : (rb ? "Perdi: senza vantaggio il rakeback ti restituisce solo una parte della rake." : "Perdi: senza vantaggio paghi solo la rake.");
      const f = rb ? `<p class="lx-edge-f">${n(v)} − ${rake} + ${n(back).replace("+", "")} di rakeback (${rb}% della rake) = <b class="${cls(r)}">${n(r)} bb/100</b></p>` : "";
      return `<div class="lx-edge-n ${cls(r)}"><small>Risultato dopo la rake</small><b>${n(r)} bb/100</b></div><p>${msg}</p>${f}<p class="lx-cap">Su 10.000 mani a NL2: <b class="${cls(r)}">${sg(bb)}bb</b>, cioè <b class="${cls(r)}">${eur(e)}</b>.</p>`;
    },
    bbcOut(wr, bb) {
      const t = (n, l) => `<div><small>${l}</small><b class="${cls(n)}">${eur(n, n !== 0 && Math.abs(n) < 1 ? 2 : Math.abs(n) < 100 ? 2 : 0)}</b></div>`;
      return t(wr * bb, "ogni 100 mani") + t(wr * 100 * bb, "ogni 10.000 mani") + t(wr * 1000 * bb, "ogni 100.000 mani");
    },
    coinRun(p, N) {
      let s = 0, w = 0; const step = Math.max(1, Math.floor(N / 240)), pts = [0];
      for (let i = 1; i <= N; i++) { if (Math.random() < p) { s++; w++; } else s--; if (i % step === 0 || i === N) pts.push(s); }
      const ev = N * (2 * p - 1), lo = Math.min(0, ...pts, ev), hi = Math.max(0, ...pts, ev), span = Math.max(1, hi - lo);
      const Wd = 320, Ht = 120, X = k => 6 + k / (pts.length - 1) * (Wd - 12), Y = v => 8 + (hi - v) / span * (Ht - 16);
      const path = pts.map((v, k) => (k ? "L" : "M") + X(k).toFixed(1) + " " + Y(v).toFixed(1)).join("");
      const svg = `<svg viewBox="0 0 ${Wd} ${Ht}" class="lx-coin-ch" role="img" aria-label="Andamento dei ${fI(N)} lanci"><path class="z" d="M6 ${Y(0).toFixed(1)} H${Wd - 6}"/><path class="e" d="M${X(0)} ${Y(0).toFixed(1)} L${X(pts.length - 1)} ${Y(ev).toFixed(1)}"/><path class="l ${cls(s)}" d="${path}"/></svg>`;
      return { s, w, html: `<div class="lx-coin-res"><div class="lx-edge-n ${cls(s)}"><small>Dopo ${fI(N)} lanci</small><b>${sg(s)} €</b></div><p>${fI(w)} teste e ${fI(N - w)} croci: in media <b>${eur(Math.sign(s) * Math.round(Math.abs(s) / N * 100) / 100)}</b> a lancio, contro i <b>${eur(2 * p - 1)}</b> attesi. Il risultato atteso in totale era <b>${Math.abs(ev) < 10 ? eur(ev) : sg(Math.round(ev)) + " €"}</b> (linea tratteggiata).</p></div>${svg}` };
    },
    // calcolatore del bankroll: buy-in a ogni limite secondo il piano; per salire servono almeno 30 buy-in del limite nuovo (NL2 è il punto di partenza)
    brcOut(e, plan) {
      const L = [["NL2", 2], ["NL5", 5], ["NL10", 10], ["NL25", 25], ["NL50", 50], ["NL100", 100], ["NL200", 200]];
      const fb = x => String(Math.floor(x * 10) / 10).replace(".", ","), eu = x => fI(x) + " €", need = c => c === 2 ? plan : Math.max(plan, 30);
      const R = L.map(([n, c]) => { const bi = e / c; return { n, c, bi, st: bi >= need(c) ? "ok" : c !== 2 && bi >= plan ? "stay" : "no" }; });
      let cur = -1; R.forEach((r, i) => { if (r.st === "ok") cur = i; });
      const ST = { ok: `<span class="lx-brc-y">✓ Sì</span>`, stay: `<span class="lx-brc-s">Solo se ci sei già</span>`, no: `<span class="lx-brc-n">✗ No</span>` };
      const rows = R.map((r, i) => `<tr class="${i === cur ? "on" : ""}"><th>${r.n}</th><td class="num">${fb(r.bi)}</td><td class="num">${ST[r.st]}</td></tr>`).join("");
      const t1 = cur < 0 ? `<b>Nessun limite</b><span>sotto il piano anche a NL2</span>` : `<b>${R[cur].n}</b><span>${fb(R[cur].bi)} buy-in, dentro il piano</span>`;
      const t2 = cur < 0 ? `<b>Nessuna</b><span>prima devi arrivare ai buy-in del piano</span>` : `<b>${eu(plan * R[cur].c)}</b><span>${cur ? `sotto questa cifra torni a ${R[cur - 1].n}` : "sotto questa cifra sei fuori piano anche a NL2"}</span>`;
      const nx = cur >= 0 && cur + 1 < R.length ? R[cur + 1] : null;
      const t3 = cur < 0 ? `<b>${eu(plan * 2)}</b><span>per iniziare a NL2 con ${plan} buy-in, ti mancano ${eu(plan * 2 - e)}</span>` : nx ? `<b>${eu(need(nx.c) * nx.c)}</b><span>per salire a ${nx.n}: ${need(nx.c)} buy-in${e < need(nx.c) * nx.c ? `, ti mancano ${eu(need(nx.c) * nx.c - e)}` : ""}</span>` : `<b>Oltre NL200</b><span>fuori da questa tabella</span>`;
      const sy = R.find(r => r.st === "stay");
      const note = sy ? `<p class="lx-brc-nx">Con il piano aggressivo i ${plan} buy-in sono la soglia per restare: se giochi già ${sy.n} puoi restarci (hai ${fb(sy.bi)} buy-in), ma per salirci ne servono 30, cioè ${eu(30 * sy.c)}.</p>` : "";
      return `<div class="lx-brc-sum"><div class="app"><small>Dove giochi</small>${t1}</div><div><small>Soglia per scendere</small>${t2}</div><div><small>${cur < 0 ? "Per iniziare" : "Per salire"}</small>${t3}</div></div>${note}<div class="lx-tabw"><table class="lx-tab lx-brc-t"><thead><tr><th>Limite</th><th class="num">Buy-in</th><th class="num">Ci puoi giocare?</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    },
    // rischio di andare a zero: moto con deriva wr e oscillazione 90bb ogni 100 mani; entro H mani e per sempre
    ruinP(bi, wr, hands) {
      const x = bi * 100, sd = 90, inf = Math.exp(-2 * wr * x / (sd * sd));
      if (!hands) return inf;
      const erf = z => { const t = 1 / (1 + 0.3275911 * Math.abs(z)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z); return z >= 0 ? y : -y; };
      const Phi = z => 0.5 * (1 + erf(z / Math.SQRT2)), t = hands / 100, s = sd * Math.sqrt(t);
      return Phi((-x - wr * t) / s) + inf * Phi((-x + wr * t) / s);
    },
    ruinPct(p) { return p < 0.001 ? "meno dello 0,1%" : String(Math.round(p * 1000) / 10).replace(".", ",") + "%"; },
    ruinOut(bi, wr) {
      const f = LXW.ruinP(bi, wr, 100000), s = LXW.ruinP(bi, wr, 0), c = f >= 0.05 ? "r" : f < 0.01 ? "g" : "";
      const su = f < 0.001 ? "meno di 1 su 1.000" : f < 0.01 ? "meno di 1 su 100" : `circa ${Math.round(f * 100)} su 100`;
      return `<div class="lx-coin-res"><div class="lx-edge-n ${c}"><small>Vai a zero entro 100.000 mani</small><b>${LXW.ruinPct(f)}</b></div><p>Su 100 giocatori con ${bi} buy-in e +${wr} bb/100, ${su} finiscono il bankroll entro 100.000 mani. Se giocassero per sempre allo stesso limite: ${LXW.ruinPct(s)}.</p></div>`;
    },
    // costruisci il tuo piano: situazione (limite, bankroll, mani, winrate) + soglie per salire e per scendere → risposta a «posso salire?»
    LV: [["NL2", 2], ["NL5", 5], ["NL10", 10], ["NL25", 25], ["NL50", 50], ["NL100", 100], ["NL200", 200], ["NL500", 500], ["NL1000", 1000]],
    LVC: ["#9aa5b1", "#f08c3c", "#4f9dff", "#b07cff", "#f5c542", "#3cc9d6", "#ff8fb1", "#c9a227", "#e8e8e8"],
    // probabilità di scendere prima o poi di D buy-in (moto con deriva wr bb/100 e oscillazione sd bb ogni 100 mani)
    pDown(dBi, wr, sd = 90) { return dBi <= 0 ? 1 : wr <= 0 ? 1 : Math.exp(-2 * wr * dBi * 100 / (sd * sd)); },
    // mani minime a un limite prima di salire ancora: si sale un limite alla volta
    STAY: 20000,
    planOut(P) {
      const L = LXW.LV, eu = x => fI(x) + " €", eu2 = x => x.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
      const f1 = x => String(Math.round(x * 10) / 10).replace(".", ","), fs = x => (x < 0 ? "−" : x > 0 ? "+" : "") + f1(Math.abs(x)), fb = x => (Math.floor(x * 10) / 10).toLocaleString("it-IT", { maximumFractionDigits: 1 });
      const { lv, e, h, wr, up, dn } = P, dr = P.dr != null ? P.dr : 2, ev = P.ev != null && isFinite(P.ev) ? P.ev : null, W = ev != null ? ev : wr, U = Math.max(up, 30);
      const own = P.sd != null && isFinite(P.sd) && P.sd > 0, sd = own ? P.sd : 90, pr = x => x < 0.001 ? "meno dello 0,1%" : LXW.ruinPct(x);
      const [cn, cc] = L[lv], nx = L[lv + 1], pv = lv > 0 ? L[lv - 1] : null, curDn = dn * cc;
      // winrate: margine circa 2 × oscillazione ÷ √(mani ÷ 100), 19 volte su 20; per i conti si usa l'EV se c'è
      const m = h >= 100 ? 2 * sd / Math.sqrt(h / 100) : Infinity, lo = W - m, hi = W + m, sure = h >= 1000 && lo > 0;
      // stime con il calo scelto: winrate a ogni limite, fin dove arriva il bankroll con la soglia per salire, fin dove resti vincente
      const estW = i => Math.round((W - dr * (i - lv)) * 10) / 10;
      let top = lv; while (top + 1 < L.length && e >= U * L[top + 1][1]) top++;
      let topW = lv; while (topW + 1 < L.length && estW(topW + 1) > 0) topW++;
      let k = lv; while (k > 0 && e < dn * L[k][1]) k--;
      const S = [], T = [], w = []; let v, cls, ck = "";
      let s1 = h < 1000 ? `Con ${fI(h)} mani il winrate non dice ancora niente: servono molte più mani.` : `Su ${fI(h)} mani il margine è circa ±${f1(m)} bb/100: il tuo winrate reale sta, 19 volte su 20, tra ${fs(lo)} e ${fs(hi)} bb/100. ${sure ? "Sei vincente con buona sicurezza." : W > 0 ? "Probabilmente vinci, ma non è ancora sicuro: potresti anche essere sotto zero." : "Al momento non risulti vincente a questo limite."}`;
      if (ev != null) { const d = wr - ev; s1 += Math.abs(d) < 1 ? " EV e vincita sono quasi uguali: negli all-in non hai avuto né fortuna né sfortuna particolare." : (d > 0 ? ` Hai vinto più dell'EV: negli all-in sei stato fortunato, quindi per i conti uso l'EV (${fs(ev)} bb/100).` : ` Hai vinto meno dell'EV: negli all-in sei stato sfortunato, quindi per i conti uso l'EV (${fs(ev)} bb/100).`) + " L'EV toglie solo la fortuna degli all-in, non tutta la varianza: il margine resta."; }
      if (h >= 1000) s1 += own ? ` Il margine usa la tua oscillazione: ${f1(sd)}bb ogni 100 mani.` : " Il margine usa un'oscillazione di 90bb ogni 100 mani, la stima tipica del 6-max: se il tracker ti dà la tua (la deviazione standard), scrivila in «Oscillazione».";
      S.push(["Il winrate", s1]);
      S.push(["Il bankroll", `${eu(e)} sono ${fb(e / cc)} buy-in di ${cn}${nx ? ` e ${fb(e / nx[1])} di ${nx[0]}` : ""}.${nx ? ` Per salire a ${nx[0]} il tuo piano ne chiede ${U}, cioè ${eu(U * nx[1])}.` : ""} ${pv ? `Sotto ${eu(curDn)} (${dn} buy-in di ${cn}) il piano ti riporta a ${pv[0]}.` : `Sotto ${eu(dn * 2)} sei fuori piano anche a NL2.`}${top >= lv + 2 ? ` Con la soglia di ${U} buy-in il bankroll ti basterebbe fino a ${L[top][0]} (${fb(e / L[top][1])} buy-in): non è il bankroll a frenarti.` : ""}`]);
      const per = W * cc / 100, fuori = "Tieni fuori dal bankroll i soldi per le spese: conta solo quello che hai per il poker.";
      if (lv > 0 && e < curDn) {
        v = `No: prima devi scendere. Con ${eu(e)} sei sotto la tua soglia di ${cn} (${eu(curDn)}).`; cls = "r";
        const kk = L[k], kDn = dn * kk[1];
        T.push(k > 0 || e >= dn * 2 ? `Torna a <b>${kk[0]}</b> adesso: lì hai ${fb(e / kk[1])} buy-in, dentro il tuo piano.` : `Torna a <b>NL2</b> adesso. Anche lì sei sotto la tua soglia (${eu(dn * 2)}): sei fuori piano, quindi ricarica solo con soldi che puoi perdere o fai una pausa.`);
        T.push(`Risali a ${L[k + 1][0]} quando arrivi a <b>${eu(U * L[k + 1][1])}</b> (${U} buy-in di ${L[k + 1][0]}).`);
        if (k > 0) T.push(`Se scendi sotto <b>${eu(kDn)}</b> torna a ${L[k - 1][0]}.`);
        S.push(["Perché scendere", `Il tuo piano chiede almeno ${dn} buy-in del limite dove giochi. Restare sotto vuol dire giocare con un bankroll troppo piccolo per reggere la varianza: è il modo classico per andare a zero.`]);
      } else if (lv === 0 && e < curDn) {
        v = `Sei sotto il tuo piano anche a NL2: ${eu(e)} sono ${fb(e / 2)} buy-in, il piano ne chiede almeno ${dn}.`; cls = "r";
        T.push(`Prima di pensare a salire, riporta il bankroll ad almeno <b>${eu(curDn)}</b>: ricarica solo con soldi che puoi permetterti di perdere.`);
        T.push(`Se continui a giocare a NL2 con ${eu(e)} sei fuori piano: vuol dire accettare di poter perdere tutto in una serie negativa.`);
        T.push(`Sali a NL5 quando arrivi a <b>${eu(U * 5)}</b> (${U} buy-in di NL5).`);
        S.push(["Perché è un problema", `Con meno di ${dn} buy-in anche una serie negativa normale può azzerare il bankroll: il piano serve proprio a evitarlo.`]);
      } else if (!nx) {
        v = `Sei già a ${cn}, il limite più alto della scala.`; cls = "g";
        T.push(`Resta a <b>${cn}</b> finché hai almeno <b>${eu(curDn)}</b>; sotto torna a ${pv[0]}.`);
      } else {
        const need = U * nx[1], biN = e / nx[1], shot = 5 * nx[1], after = e - shot, dnN = dn * nx[1], dist = (e - dnN) / nx[1];
        const Wn = estW(lv + 1), shotOk = W > 0 && Wn > 0 && biN >= 20 && after >= curDn;
        // i tre controlli, separati: il bankroll basta? il winrate è affidabile? al limite nuovo resti vincente?
        const C3 = [
          [e >= need ? "y" : "n", "Bankroll", e >= need ? `${fb(biN)} buy-in di ${nx[0]}, ne servono ${U}` : `ti mancano ${eu(need - e)} per i ${U} buy-in di ${nx[0]}`],
          [h < 1000 || W <= 0 ? "n" : sure ? "y" : "s", `Winrate a ${cn}`, h < 1000 ? "troppo poche mani per dirlo" : W <= 0 ? "non risulti vincente" : `tra ${fs(lo)} e ${fs(hi)} bb/100: ${sure ? "vincente con buona sicurezza" : "probabile, non ancora sicuro"}`],
          [Wn > 0 ? "y" : "n", `A ${nx[0]}, stimato`, `${fs(Wn)} bb/100${Wn > 0 ? " con il calo che hai scelto" : ": non saresti vincente"}`],
        ], SR = { y: "sì", n: "no", s: "non ancora sicuro" };
        ck = `<div class="lx-plan-ck">${C3.map(([s, t, d]) => `<div class="${s}"><i aria-hidden="true">${s === "y" ? "✓" : s === "n" ? "✗" : "?"}</i><span><b>${t}<span class="lx-sr">: ${SR[s]}</span></b>${d}</span></div>`).join("")}</div>`;
        if (e >= need && W > 0 && Wn <= 0) {
          v = `Il bankroll basterebbe per ${nx[0]}, ma lì non saresti vincente: con il calo che hai scelto il tuo winrate stimato è ${fs(Wn)} bb/100.`; cls = "y";
          T.push(`Resta a <b>${cn}</b>, dove vinci ${fs(W)} bb/100.`);
          T.push(`Prima di salire migliora il gioco: a ${nx[0]} gli avversari sono più forti e il tuo margine oggi non basta.`);
          T.push(pv ? `Se scendi sotto <b>${eu(curDn)}</b> torna a ${pv[0]}.` : `Se scendi sotto <b>${eu(dn * 2)}</b> sei fuori piano: fermati o ricarica solo con soldi che puoi perdere.`);
        } else if (e >= need && W > 0 && sure) {
          v = `Sì: puoi salire a ${nx[0]}.`; cls = "g";
          T.push(`Sali a <b>${nx[0]}</b>: hai ${fb(biN)} buy-in, il tuo piano ne chiede ${U}.`);
          T.push(`Se lì scendi sotto <b>${eu(dnN)}</b> (${dn} buy-in di ${nx[0]}) torna a ${cn}, senza cambiare piano.`);
          T.push(`A ${nx[0]} aspettati un winrate più basso, circa <b>${fs(Wn)} bb/100</b>. Gioca almeno <b>${fI(LXW.STAY)} mani</b> a ${nx[0]}, poi rifai questo controllo con il tuo winrate di ${nx[0]}: si sale un limite alla volta.`);
        } else if (e >= need && W > 0) {
          v = `Quasi: il bankroll basta per ${nx[0]}, ma il tuo winrate non è ancora sicuro.`; cls = "y";
          T.push(`Prova <b>${nx[0]}</b> con uno shot di 5 buy-in (<b>${eu(shot)}</b>): se li perdi torna a ${cn}.`);
          T.push(`Intanto continua a raccogliere mani: con più mani saprai se il tuo vantaggio è reale.`);
          T.push(pv ? `Se a ${cn} scendi sotto <b>${eu(curDn)}</b> torna a ${pv[0]}.` : `Se scendi sotto <b>${eu(dn * 2)}</b> sei fuori piano: fermati o ricarica solo con soldi che puoi perdere.`);
        } else if (e >= need) {
          v = `Il bankroll basterebbe per ${nx[0]}, ma a ${cn} non risulti vincente.`; cls = "y";
          T.push(`Resta a <b>${cn}</b> e lavora sul gioco: salire con un winrate di zero o negativo vuol dire perdere più in fretta.`);
          T.push(`Rivedi le mani perse più grandi e ripassa le lezioni sugli spot dove perdi di più.`);
        } else if (W > 0) {
          const hands = Math.ceil((need - e) / per / 10) * 1000;
          v = `Non ancora: ti mancano ${eu(need - e)} per salire a ${nx[0]}.`; cls = "y";
          T.push(`Resta a <b>${cn}</b>.`);
          T.push(Wn > 0 ? `Sali a ${nx[0]} quando arrivi a <b>${eu(need)}</b>: al tuo ritmo circa <b>${fI(hands)} mani</b>. Allora rifai questo controllo.` : `Arriverai a <b>${eu(need)}</b> in circa ${fI(hands)} mani, ma con il calo che hai scelto a ${nx[0]} non saresti vincente: prima di salire migliora il gioco.`);
          if (shotOk) T.push(`Se vuoi provarci prima: shot di 5 buy-in di ${nx[0]} (<b>${eu(shot)}</b>). Se li perdi torna subito a ${cn}: resterai con ${eu(after)}, ancora dentro il piano.`);
          T.push(pv ? `Se scendi sotto <b>${eu(curDn)}</b> torna a ${pv[0]}.` : `Se scendi sotto <b>${eu(dn * 2)}</b> sei fuori piano: fermati o ricarica solo con soldi che puoi perdere.`);
          S.push(["Quanto manca", `A ${cn} con ${f1(W)} bb/100 guadagni in media ${eu2(per)} ogni 100 mani: i ${eu(need - e)} che mancano arrivano in circa ${fI(hands)} mani.`]);
        } else {
          v = `Non ancora: ti mancano ${eu(need - e)} per salire a ${nx[0]}, e a ${cn} non risulti vincente.`; cls = "r";
          T.push(`Resta a <b>${cn}</b> e lavora sul gioco: con un winrate di zero o negativo il bankroll non cresce.`);
          T.push(pv ? `Se scendi sotto <b>${eu(curDn)}</b> torna a ${pv[0]}.` : `Se scendi sotto <b>${eu(dn * 2)}</b> sei fuori piano: fermati o ricarica solo con soldi che puoi perdere.`);
        }
        if (W > 0) S.push(["Il winrate al livello nuovo", dr > 0 ? `Salendo gli avversari sono più forti e il winrate in bb/100 di solito scende. Con il calo che hai scelto (${dr} bb/100 a livello), a ${nx[0]} stimi circa ${fs(Wn)} bb/100${Wn > 0 ? `, cioè circa ${eu2(Wn * nx[1] / 100)} ogni 100 mani contro i ${eu2(per)} di ${cn}` : ": non saresti più vincente"}.` : `Hai scelto nessun calo: stai ipotizzando di vincere a ${nx[0]} quanto a ${cn}, ${fs(W)} bb/100. Di solito però salendo il winrate scende.`]);
        if (W > 0 && Wn > 0 && biN >= 20 && !(e >= need && sure)) S.push(["Lo shot", shotOk ? `5 buy-in di ${nx[0]} sono ${eu(shot)}: se vanno male resti a ${cn} con ${eu(after)}, cioè ${fb(after / cc)} buy-in, sopra la tua soglia. È un rischio piccolo e deciso prima.` : `5 buy-in di ${nx[0]} sono ${eu(shot)}: se vanno male scenderesti sotto la tua soglia di ${cn}. Meglio aspettare di avere più margine.`]);
        if (W > 0 && Wn > 0) {
          const H = [...new Set([Wn, Math.round(Wn / 2 * 10) / 10].filter(x => x > 0))];
          S.push(["Se salissi adesso", dist < 0 ? `Con ${eu(e)} saresti già sotto la tua soglia di ${nx[0]} (${eu(dnN)}): torneresti giù subito.` : dist === 0 ? `Con ${eu(e)} saresti proprio sulla tua soglia di ${nx[0]}: basterebbe una mano persa per tornare giù.` : `Con ${fb(biN)} buy-in di ${nx[0]} e la soglia a ${dn}, torneresti a ${cn} solo dopo aver perso ${eu(e - dnN)} (${fb(dist)} buy-in). Probabilità che succeda prima o poi, con un'oscillazione di ${f1(sd)}bb ogni 100 mani: ${pr(LXW.pDown(dist, H[0], sd))} se lì vinci ${fs(H[0])} bb/100${H[1] ? `, ${pr(LXW.pDown(dist, H[1], sd))} se vinci solo la metà (${fs(H[1])} bb/100)` : ""}. Tornare giù non vuol dire perdere tutto: vuol dire giocare di nuovo a ${cn}.`]);
        }
        // fuori scala: il bankroll copre anche i limiti dopo quello nuovo, quindi le soglie non decidono più niente (solo per chi lì resterebbe vincente: agli altri il verdetto dice già di non salire)
        if (top >= lv + 2 && W > 0 && Wn > 0) w.push(`Il bankroll non è il tuo limite: con la soglia di ${U} buy-in ti basterebbe fino a ${L[top][0]}, e se sali a ${nx[0]} torneresti a ${cn} solo dopo aver perso ${eu(e - dnN)}. Con un bankroll così le soglie non ti fermano: a decidere quanto salire sono il tuo livello e i risultati a ogni limite. ${topW > lv ? `Con il calo che hai scelto resteresti vincente fino a ${L[topW][0]} (${fs(estW(topW))} bb/100), ma è una stima: si sale` : "Si sale"} un limite alla volta, e ogni limite si conferma con le mani giocate lì.`);
      }
      T.push(fuori);
      if (dn >= up) w.push("Nessun margine: sali e scendi alla stessa cifra, quindi basta una sessione storta per tornare giù. Di solito la soglia per scendere sta qualche buy-in sotto quella per salire.");
      if (dn < 20) w.push(`Scendere solo sotto ${dn} buy-in è più rischioso anche del piano aggressivo (20-25).`);
      const rows = L.map(([n, c], i) => `<tr class="${i === lv ? "on" : ""}"><th><i class="lx-lvd" style="--c:${LXW.LVC[i]}"></i>${n}</th><td class="num">${i ? eu(U * c) : "partenza"}</td><td class="num">${eu(dn * c)}</td><td class="num">${fs(estW(i))}</td></tr>`).join("");
      return `<div class="lx-plan-v ${cls}"><small>${nx ? `Posso salire a ${nx[0]}?` : "La risposta"}</small><b>${v}</b></div>
        ${ck}
        <div class="lx-plan-do"><small>Cosa devi fare</small><ol>${T.map(x => `<li>${x}</li>`).join("")}</ol></div>
        ${w.map(x => `<p class="lx-plan-w">${x}</p>`).join("")}
        <details class="lx-fold" open><summary><span>La soluzione passo per passo</span><small>con i tuoi numeri</small></summary><div class="lx-fold-b"><ol class="lx-steps lx-plan-st">${S.map(([t, x]) => `<li><b>${t}</b>${x}</li>`).join("")}</ol></div></details>
        <details class="lx-fold"><summary><span>La tua scala dei limiti</span><small>con le tue due soglie</small></summary><div class="lx-tabw"><table class="lx-tab lx-brc-t"><thead><tr><th>Limite</th><th class="num">Sali qui con</th><th class="num">Scendi sotto</th><th class="num">Winrate stimato</th></tr></thead><tbody>${rows}</tbody></table></div><p class="lx-cap">A NL2 non c'è un limite più basso: sotto la soglia sei fuori piano. Il winrate stimato, in bb/100, parte dal tuo e usa il calo che hai scelto: è un'ipotesi, da confermare con le mani giocate a ogni limite.</p></details>`;
    },
    // simula il piano dal limite dove sei: ogni 100 mani il bankroll cambia di (winrate + oscillazione sd), poi si applicano le due soglie.
    // Come nella risposta: si sale solo dove il winrate stimato resta sopra zero, e un limite alla volta (almeno LXW.STAY mani a ogni limite; h0 = mani già giocate al limite di partenza)
    planSim(e, up, dn, wr, N, s0, dr = 0, sd = 90, h0 = 0) {
      const L = LXW.LV, C = LXW.LVC, g = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random()), B = N / 100, step = Math.max(1, Math.floor(B / 300)), U = Math.max(up, 30);
      let s = s0 || 0, x = e, hi = s, ups = 0, downs = 0, bust = -1, stay = (h0 || 0) / 100; const st = s, pts = [[0, x]], ev = [], segs = [[0, s]], minStay = LXW.STAY / 100, wAt = lv => wr - dr * (lv - st);
      for (let i = 1; i <= B; i++) {
        x += (wAt(s) + sd * g()) * L[s][1] / 100; stay++;
        if (x <= 0) { x = 0; bust = i; pts.push([i, 0]); break; }
        if (s + 1 < L.length && x >= U * L[s + 1][1] && wAt(s + 1) > 0 && stay >= minStay) { s++; ups++; stay = 0; ev.push([i, x, 1, s]); segs.push([i, s]); hi = Math.max(hi, s); pts.push([i, x]); }
        else if (s > 0 && x < dn * L[s][1]) { s--; downs++; stay = 0; ev.push([i, x, -1, s]); segs.push([i, s]); pts.push([i, x]); }
        else if (i % step === 0 || i === B) pts.push([i, x]);
      }
      const end = bust > 0 ? bust : B, eu = v => fI(v) + " €";
      // tratti per limite: [inizio, fine, limite] con le soglie di quel momento
      const SG = segs.map(([a, lv], k) => [a, k + 1 < segs.length ? segs[k + 1][0] : end, lv]);
      const canUp = lv => lv + 1 < L.length && wAt(lv + 1) > 0, thr = SG.flatMap(([, , lv]) => [canUp(lv) ? U * L[lv + 1][1] : 0, lv > 0 ? dn * L[lv][1] : 0]);
      const top0 = Math.max(e, ...pts.map(p => p[1]), ...thr) * 1.06 || 1;
      const nice = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000], stp = nice.find(n => top0 / n <= 4) || 10000000, top = Math.ceil(top0 / stp) * stp;
      const W = 640, H = 360, X = i => 6 + i / B * (W - 12), Y = v => 10 + (top - v) / top * (H - 20), pc = (v, M) => (v / M * 100).toFixed(2) + "%";
      const grid = Array.from({ length: Math.round(top / stp) + 1 }, (_, k) => k * stp);
      const gl = grid.map(v => `<path class="gl" d="M6 ${Y(v).toFixed(1)} H${W - 6}"/>`).join("");
      const ylab = grid.filter(v => v > 0 && Y(v) / H >= 0.1).map(v => `<span style="top:${pc(Y(v), H)}">${eu(v)}</span>`).join("");
      const th = SG.map(([a, b, lv]) => (canUp(lv) ? `<path class="tu" d="M${X(a).toFixed(1)} ${Y(U * L[lv + 1][1]).toFixed(1)} H${X(b).toFixed(1)}"/>` : "") + (lv > 0 ? `<path class="td" d="M${X(a).toFixed(1)} ${Y(dn * L[lv][1]).toFixed(1)} H${X(b).toFixed(1)}"/>` : "")).join("");
      const lines = SG.map(([a, b, lv]) => { const q = pts.filter(([i]) => i >= a && i <= b); return q.length > 1 ? `<path class="l" style="stroke:${C[lv]}" d="${q.map(([i, v], k) => (k ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join("")}"/>` : ""; }).join("");
      const mk = ev.slice(0, 80).map(([i, v, t]) => `<circle class="dot ${t > 0 ? "up" : "dn"}" style="--d:${(i / B * 2.6).toFixed(2)}s" cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="5"/>`).join("") + (bust > 0 ? `<circle class="dot dn" style="--d:${(bust / B * 2.6).toFixed(2)}s" cx="${X(bust).toFixed(1)}" cy="${Y(0).toFixed(1)}" r="6"/>` : "");
      // etichette dei cambi di limite, senza sovrapporle
      let lastX = -99; const tags = ev.filter(([i]) => { const p = Math.min(91, Math.max(9, i / B * 100)); if (p - lastX < 16) return false; lastX = p; return true; }).slice(0, 7).map(([i, v, t, lv]) => { const lp = Math.min(91, Math.max(9, X(i) / W * 100)), tp = Y(v) / H * 100, below = t < 0 || tp < 16; return `<span class="${t > 0 ? "up" : "dn"}${below ? " bl" : ""}" style="left:${lp.toFixed(2)}%;top:${tp.toFixed(2)}%;--d:${(i / B * 2.6).toFixed(2)}s">${t > 0 ? "▲" : "▼"} ${L[lv][0]}</span>`; }).join("");
      const xt = [0, 0.5, 1].map(f => `<span>${fI(Math.round(N * f))}${f === 1 ? " mani" : ""}</span>`).join("");
      const strip = SG.map(([a, b, lv]) => { const wd = (b - a) / B * 100; return `<span style="--w:${wd.toFixed(2)}%;--c:${C[lv]}" title="${L[lv][0]}">${wd > 9 ? L[lv][0] : ""}</span>`; }).join("") + (bust > 0 ? `<span class="off" style="--w:${((B - bust) / B * 100).toFixed(2)}%">${(B - bust) / B > 0.12 ? "fermo" : ""}</span>` : "");
      const lvs = [...new Set(SG.map(z => z[2]))].sort((p, q) => p - q);
      const wl = lv => { const w = Math.round((wr - dr * (lv - st)) * 10) / 10; return (w > 0 ? "+" : w < 0 ? "−" : "") + String(Math.abs(w)).replace(".", ","); };
      const leg = `<div class="lx-plan-leg">${lvs.map(lv => `<span><i style="--c:${C[lv]}"></i>${L[lv][0]} · ${wl(lv)} bb/100</span>`).join("")}<span><i class="tu"></i>soglia per salire</span><span><i class="td"></i>soglia per scendere</span></div>`;
      const res = bust > 0 ? `<b class="r">Bankroll finito dopo ${fI(bust * 100)} mani.</b> Con queste soglie e questo winrate il piano non ha retto: prova a scendere prima o a partire più in basso.` : `<b>Finisci a ${L[s][0]} con ${eu(x)}</b> (partivi da ${L[st][0]} con ${eu(e)}). Livello più alto raggiunto: ${L[hi][0]}.`;
      return `<p class="lx-cap">Il colore della linea è il limite a cui giochi. Quando il bankroll tocca la linea tratteggiata verde sali, quando scende sotto quella rossa torni giù. La verde manca dove al limite sopra non saresti vincente.</p>${leg}
        <div class="lx-plan-plot"><svg viewBox="0 0 ${W} ${H}" class="lx-plan-svg lx-rv" role="img" aria-label="Bankroll simulato in ${fI(N)} mani, da ${L[st][0]} a ${L[s][0]}">${gl}${th}${lines}${mk}</svg><div class="lx-plan-y">${ylab}</div><div class="lx-plan-tags">${tags}</div></div>
        <div class="lx-plan-x">${xt}</div>
        <div class="lx-plan-strip lx-late" aria-label="Limite giocato nel tempo">${strip}</div>
        <p class="lx-ruin-m lx-late">${res}</p><div class="lx-plan-k lx-late"><span>Salite: <b>${ups}</b></span><span>Discese: <b>${downs}</b></span><span>Livello più alto: <b>${L[hi][0]}</b></span></div>`;
    },
    // percorso di un vincente con seme fisso (sempre uguale): bankroll in buy-in ogni 100 mani e il periodo negativo più profondo
    swing(seed, wr, bi0) {
      let s0 = seed | 0; const r = () => { s0 = s0 + 0x6D2B79F5 | 0; let t = Math.imul(s0 ^ s0 >>> 15, 1 | s0); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      const g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()); let x = bi0 * 100; const a = [bi0];
      for (let i = 1; i <= 1000; i++) { x += wr + 90 * g(); a.push(x / 100); }
      let pk = a[0], pki = 0, best = 0, bp = 0, bt = 0; for (let i = 1; i < a.length; i++) { if (a[i] > pk) { pk = a[i]; pki = i; } if (pk - a[i] > best) { best = pk - a[i]; bp = pki; bt = i; } }
      return { a, best, bp, bt };
    },
    // 20 giocatori: percorsi del bankroll in buy-in, si fermano a zero
    ruinSim(bi, wr, n = 20) {
      const g = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random()), P = [];
      let broke = 0;
      for (let k = 0; k < n; k++) {
        let x = bi * 100; const a = [[0, bi]]; let dead = false;
        for (let i = 1; i <= 1000; i++) { x += wr + 90 * g(); if (x <= 0) { a.push([i / 10, 0]); dead = true; break; } if (i % 10 === 0) a.push([i / 10, x / 100]); }
        if (dead) broke++; P.push({ a, dead });
      }
      const top = Math.max(bi + wr * 10, ...P.map(p => Math.max(...p.a.map(q => q[1])))) * 1.05, Wd = 320, Ht = 150, X = k => 8 + k / 100 * (Wd - 16), Y = v => 8 + (top - v) / top * (Ht - 16);
      const ln = p => { const pts = p.a.map(([k, v], j) => (j ? "L" : "M") + X(k).toFixed(1) + " " + Y(v).toFixed(1)).join(""), e = p.a[p.a.length - 1]; return `<path class="l ${p.dead ? "r" : "s"}" d="${pts}"/>${p.dead ? `<circle cx="${X(e[0]).toFixed(1)}" cy="${Y(0).toFixed(1)}" r="3" class="dot" style="--d:${(e[0] / 100 * 2.6).toFixed(2)}s"/>` : ""}`; };
      const svg = `<div class="lx-rvw"><svg viewBox="0 0 ${Wd} ${Ht}" class="lx-coin-ch lx-ruin-svg lx-rv" role="img" aria-label="Bankroll di ${n} giocatori in 100.000 mani"><path class="z" d="M8 ${Y(0).toFixed(1)} H${Wd - 8}"/>${P.map(ln).join("")}<path class="e" d="M${X(0)} ${Y(bi).toFixed(1)} L${X(100)} ${Y(bi + wr * 10).toFixed(1)}"/></svg></div><div class="lx-gs-ax"><span>0 mani</span><span>100.000 mani</span></div>`;
      const exp = n * LXW.ruinP(bi, wr, 100000), ex = exp < 0.1 ? "quasi nessuno" : exp < 1 ? "meno di 1" : "circa " + Math.round(exp);
      return { broke, html: `<p class="lx-cap">Ogni linea è un giocatore che parte con ${bi} buy-in: in rosso chi va a zero, il tratteggio è il risultato atteso.</p>${svg}<p class="lx-ruin-m lx-late"><b class="${broke ? "r" : "g"}">Andati a zero: ${broke} su ${n}</b>. Il calcolo ne prevede in media ${ex} su ${n}.</p>` };
    },
    // contatore dei colpi rari: mani in un anno e cooler attesi per tre modi di giocare
    rareOut(h, p) {
      const M = [["Dal vivo", "1 tavolo · circa 30 mani l'ora", 30], ["Online", "1 tavolo · circa 80 mani l'ora", 80], ["Online", "4 tavoli · circa 320 mani l'ora", 320]], mx = 320 * h * 50;
      const f = k => k < 10 ? String(Math.round(k * 10) / 10).replace(".", ",") : fI(k);
      return M.map(([t, d, m]) => { const N = m * h * 50, k = N * p; return `<div><small>${t}</small><span class="lx-rare-d">${d}</span><b>${fI(N)}</b><span class="lx-rare-d">mani in un anno</span><i style="--w:${N / mx * 100}%"></i><p>KK contro AA: <b>${f(k)}</b> ${k >= 0.95 && k < 1.05 ? "volta" : "volte"}</p></div>`; }).join("");
    },
    // segno con decimali per i numeri piccoli (+101,5 · −100 · +0,75), interi con il punto per quelli grandi
    sgd(n) { return (n > 0 ? "+" : n < 0 ? "−" : "") + (Math.abs(n) >= 1000 ? fI(n) : String(Math.round(Math.abs(n) * 100) / 100).replace(".", ",")); },
    // linea dell'andamento con il risultato atteso tratteggiato
    lineSvg(pts, ev, cl, label) {
      const lo = Math.min(0, ...pts, ev), hi = Math.max(0, ...pts, ev), span = Math.max(1, hi - lo);
      const Wd = 320, Ht = 120, X = k => 6 + k / Math.max(1, pts.length - 1) * (Wd - 12), Y = v => 8 + (hi - v) / span * (Ht - 16);
      const path = pts.map((v, k) => (k ? "L" : "M") + X(k).toFixed(1) + " " + Y(v).toFixed(1)).join("");
      return `<svg viewBox="0 0 ${Wd} ${Ht}" class="lx-coin-ch" role="img" aria-label="${label}"><path class="z" d="M6 ${Y(0).toFixed(1)} H${Wd - 6}"/><path class="e" d="M${X(0)} ${Y(0).toFixed(1)} L${X(pts.length - 1)} ${Y(ev).toFixed(1)}"/><path class="l ${cl}" d="${path}"/></svg>`;
    },
    // rigioca un all-in N volte: board casuali dal mazzo rimasto, valutati con il motore dell'app (djEval)
    rerunRun(h, v, N, pot, inv, board) {
      const SU = { "♠": "s", "♥": "h", "♦": "d", "♣": "c" };
      const toC = str => (String(str).replace(/10/g, "T").match(/[2-9TJQKA][♠♥♦♣]/g) || []).map(x => RANKS.indexOf(x[0]) * 4 + "shdc".indexOf(SU[x[1]]));
      const A = toC(h), B = toC(v), Bd = toC(board || "").slice(0, 5), used = new Set([...A, ...B, ...Bd]), d = []; for (let c = 0; c < 52; c++) if (!used.has(c)) d.push(c);
      const need = 5 - Bd.length, o = 2 + Bd.length, x = [A[0], A[1], ...Bd, 0, 0, 0, 0, 0].slice(0, 7), y = [B[0], B[1], ...Bd, 0, 0, 0, 0, 0].slice(0, 7), step = Math.max(1, Math.floor(N / 240)), pts = [0], seq = [];
      let w = 0, t = 0, l = 0, net = 0, va = 0, vb = 0;
      for (let i = 1; i <= N; i++) {
        for (let k = 0; k < need; k++) { const j = k + Math.floor(Math.random() * (d.length - k)), q = d[k]; d[k] = d[j]; d[j] = q; x[o + k] = y[o + k] = d[k]; }
        va = djEval(x); vb = djEval(y);
        const r = va > vb ? 1 : va < vb ? -1 : 0;
        if (r > 0) { w++; net += pot - inv; } else if (r < 0) { l++; net -= inv; } else { t++; net += pot / 2 - inv; }
        if (N <= 10) seq.push(r);
        if (i % step === 0 || i === N) pts.push(net);
      }
      return { w, t, l, net, pts, seq, board: [...Bd, ...d.slice(0, need)], nb: need, va, vb };
    },
    rerunHtml(R, N, ev, vil) {
      const sym = { s: "♠", h: "♥", d: "♦", c: "♣" }, low = s => s.charAt(0).toLowerCase() + s.slice(1);
      const cH = (c, nw) => { const r = RANKS[c >> 2], s = "shdc"[c & 3]; return `<span class="lx-c big ${s}${nw ? " nw" : ""}">${r === "T" ? "10" : r}<i>${sym[s]}</i></span>`; };
      if (N === 1) {
        const r = R.w ? 1 : R.l ? -1 : 0, who = r > 0 ? "Vinci tu" : r < 0 ? `Vince il ${vil}` : "Pareggio";
        return `<div class="lx-rr-board" aria-label="Board">${R.board.map((c, k) => cH(c, R.nb < 5 && k >= 5 - R.nb)).join("")}</div><div class="lx-coin-res"><div class="lx-edge-n ${cls(r)}"><small>${who}</small><b>${LXW.sgd(R.net)}bb</b></div><p>Tu: ${low(djName(R.va))}. Il ${vil}: ${low(djName(R.vb))}.</p></div>`;
      }
      const pc = k => String(Math.round(k / N * 1000) / 10).replace(".", ",") + "%";
      const seq = R.seq.length ? `<div class="lx-rr-seq" aria-label="Esito di ogni all-in">${R.seq.map(r => `<span class="${cls(r)}" title="${r > 0 ? "vinto" : r < 0 ? "perso" : "pareggio"}">${r > 0 ? "✓" : r < 0 ? "✗" : "="}</span>`).join("")}</div>` : "";
      return `<div class="lx-coin-res"><div class="lx-edge-n ${cls(R.net)}"><small>Dopo ${fI(N)} all-in</small><b>${LXW.sgd(R.net)}bb</b></div><p>Vinti <b>${fI(R.w)}</b> (${pc(R.w)}), persi <b>${fI(R.l)}</b>${R.t ? `, pareggi ${fI(R.t)}` : ""}. In media <b>${LXW.sgd(Math.round(R.net / N * 10) / 10)}bb</b> ad all-in; il risultato atteso è <b>${LXW.sgd(ev)}bb</b> (linea tratteggiata).</p></div>${seq}<div class="lx-rr-bar" aria-hidden="true"><i class="g" style="--w:${R.w / N * 100}%"></i><i class="n" style="--w:${R.t / N * 100}%"></i><i class="r" style="--w:${R.l / N * 100}%"></i></div>${LXW.lineSvg(R.pts, ev * N, cls(R.net), `Andamento dei ${fI(N)} all-in`)}`;
    },
    // chi è il vincente: due saldi simulati, uno a +5 e uno a −5 bb/100, oscillazione 90bb ogni 100 mani
    guessPair(N) {
      const P = 120, per = N / 100 / P, g = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
      const path = wr => { const a = [0]; let s = 0; for (let k = 0; k < P; k++) { s += wr * per + 90 * Math.sqrt(per) * g(); a.push(Math.round(s)); } return a; };
      const w = Math.random() < 0.5 ? 0 : 1, L = []; L[w] = path(5); L[1 - w] = path(-5); return { w, L };
    },
    guessSvg(L, N, rev, w) {
      const E = 5 * N / 100, n = L[0].length - 1, all = [...L[0], ...L[1], E, -E, 0], lo = Math.min(...all), hi = Math.max(...all), span = Math.max(1, hi - lo);
      const Wd = 320, Ht = 140, X = k => 8 + k / n * (Wd - 16), Y = v => 8 + (hi - v) / span * (Ht - 16);
      const ln = (a, c) => `<path class="l ${c}" d="${a.map((v, k) => (k ? "L" : "M") + X(k).toFixed(1) + " " + Y(v).toFixed(1)).join("")}"/>`;
      const cA = rev ? (w === 0 ? "g" : "r") : "a", cB = rev ? (w === 1 ? "g" : "r") : "b";
      const ex = rev ? `<path class="e g" d="M${X(0)} ${Y(0).toFixed(1)} L${X(n)} ${Y(E).toFixed(1)}"/><path class="e r" d="M${X(0)} ${Y(0).toFixed(1)} L${X(n)} ${Y(-E).toFixed(1)}"/>` : "";
      const fin = i => sg(L[i][n]) + "bb", tag = i => rev ? (i === w ? " · vince 5 bb/100" : " · perde 5 bb/100") : "";
      return `<div class="lx-gs-leg"><span class="${cA}"><i></i>A${tag(0)}: <b>${fin(0)}</b></span><span class="${cB}"><i></i>B${tag(1)}: <b>${fin(1)}</b></span></div><svg viewBox="0 0 ${Wd} ${Ht}" class="lx-coin-ch lx-gs-svg" role="img" aria-label="Saldo dei giocatori A e B dopo ${fI(N)} mani"><path class="z" d="M8 ${Y(0).toFixed(1)} H${Wd - 8}"/>${ex}${ln(L[1], cB)}${ln(L[0], cA)}</svg><div class="lx-gs-ax"><span>0 mani</span><span>${fI(N)} mani</span></div>`;
    },
    guessMsg(L, w, p, N) {
      const n = L[0].length - 1, hi = L[0][n] >= L[1][n] ? 0 : 1, nm = ["A", "B"], ok = p === w;
      const OFT = { 1000: "4 volte su 10", 10000: "2 volte su 10", 100000: "meno di 1 volta su 100" };
      const m = ok ? (w === hi ? `Giusto: il vincente era ${nm[w]}, ed era anche davanti nel saldo.` : "Giusto, anche se il suo saldo era più basso: questa volta davanti c'era il perdente.")
        : (p === hi ? `Era ${nm[w]}. Hai scelto il saldo più alto, ma questa volta davanti c'era il perdente: con ${fI(N)} mani succede circa ${OFT[N] || ""}.` : `Era ${nm[w]}, che questa volta era anche davanti nel saldo.`);
      return { ok, html: `<p class="lx-gs-m ${ok ? "ok" : "ko"}"><b>${ok ? "✓" : "✗"}</b> ${m}</p>` };
    },
    guessScore(sc) {
      const ks = Object.keys(sc).sort((a, b) => a - b); if (!ks.length) return "";
      return `<small>I tuoi tentativi</small>${ks.map(k => `<span>${fI(+k)} mani: ${sc[k][0]} su ${sc[k][1]}</span>`).join("")}`;
    },
    // check del tilt: basta un segnale per chiudere
    tiltOut(n) {
      return n ? `<div class="lx-tilt-v st"><i>STOP</i><p><b>Chiudi la sessione.</b> ${n === 1 ? "Basta un segnale" : n + " segnali"}: la mano dopo non la giocherai meglio. Torna quando decidi con la calma della prima mano.</p></div>`
        : `<div class="lx-tilt-v go"><i>GIOCA</i><p>Nessun segnale: puoi continuare. Rifai il check dopo un colpo grosso e a ogni pausa.</p></div>`;
    },
    sg, cls,
  };
})();

/* ---------------- componenti grafici delle schede (UI.*) ----------------
   Si usano dentro le schede con ${UI.nome(...)}. Restituiscono HTML. */
const UI = (() => {
  let HAN = 0;
  const SU = { "♠": "s", "♥": "h", "♦": "d", "♣": "c" };
  const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  // "A♣K♥" oppure "A♣ K♥" -> carte singole; "10" accettato come T
  const split = str => String(str).replace(/10/g, "T").replace(/\s+/g, "").match(/[2-9TJQKA][♠♥♦♣]/g) || [];
  const card = (c, big) => { const r = c[0] === "T" ? "10" : c[0], s = c[1]; return big ? `<span class="lx-c big ${SU[s]}">${r}<i>${s}</i></span>` : `<span class="lx-c ${SU[s]}">${r}${s}</span>`; };
  const RC = { r1: "var(--r1)", r2: "var(--r2)", r3: "var(--r3)", r4: "var(--r4)", r5: "var(--r5)" };
  const RN = { r1: "2 coppie o meglio", r2: "Top pair / overpair", r3: "Coppia media o bassa", r4: "Progetti", r5: "Aria, A-high" };
  return {
    // carte in linea nel testo: ${UI.c("A♠K♦")}
    c: s => split(s).map(x => card(x)).join(""),
    // spot: {hero:"A♣K♥", pos:"BTN", board:"K♠7♦2♣", info:[["Formato","NL25"],["Preflop","BTN 2,5bb, BB chiama"]]}
    spot: o => `<div class="lx-spot">${o.hero ? `<div><small>${o.hl ? esc(o.hl) : "Hero" + (o.pos ? " (" + esc(o.pos) + ")" : "")}</small><div class="lx-cards">${split(o.hero).map(x => card(x, 1)).join("")}</div></div>` : ""}${o.board ? `<div class="lx-felt"><small>Board</small><div class="lx-cards">${split(o.board).map(x => card(x, 1)).join("")}</div></div>` : ""}${o.info ? `<dl>${o.info.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>` : ""}</div>`,
    // range a categorie: rows=[["K♠7♦2♣ BTN",[2,17,19,0,62]], ...] percentuali r1..r5; legend=true
    range: (rows, cap, legend = true) => {
      const r = rows.map(([lab, v]) => `<div class="lx-rrow"><span>${lab}</span><div class="lx-rbar">${v.map((p, i) => p > 0 ? `<i class="r${i + 1}" style="flex:${p}">${p >= 8 ? p + "%" : ""}</i>` : "").join("")}</div></div>`).join("");
      const used = [0, 1, 2, 3, 4].filter(i => rows.some(([, v]) => v[i] > 0));
      const leg = legend ? `<div class="lx-leg">${used.map(i => `<span style="--c:${RC["r" + (i + 1)]}">${RN["r" + (i + 1)]}</span>`).join("")}</div>` : "";
      return `<div class="lx-range">${leg}${r}</div>${cap ? `<p class="lx-cap">${cap}</p>` : ""}`;
    },
    // barre: rows=[["1/3 piatto",25],...]; opz {max:100, unit:"%", cls:"a"}
    bars: (rows, o = {}) => { const mx = o.max || Math.max(...rows.map(r => Math.abs(r[1]))); return `<div class="lx-bars">${rows.map(([l, v, c]) => `<div class="lx-bar"><span>${l}</span><div class="tr"><em class="${c || o.cls || ""}" style="--w:${Math.round(Math.abs(v) / mx * 100)}%">${o.fmt ? o.fmt(v) : String(v).replace(".", ",") + (o.unit ?? "%")}</em></div></div>`).join("")}</div>`; },
    // confronto due serie: rows=[["Fold vs c-bet",65,59],...], names=["Reg","GTO"]
    cmp: (rows, names, o = {}) => { const mx = o.max || 100, u = o.unit ?? "%"; return `<div class="lx-leg"><span style="--c:var(--lxo)">${names[0]}</span><span style="--c:var(--lxb)">${names[1]}</span></div><div class="lx-bars">${rows.map(([l, a, b]) => `<div class="lx-bar"><span>${l}</span><div class="tr"><em class="a" style="--w:${a / mx * 100}%">${String(a).replace(".", ",")}${u}</em><em class="b" style="--w:${b / mx * 100}%">${String(b).replace(".", ",")}${u}</em></div></div>`).join("")}</div>`; },
    // numeri grandi: [["21,7%","dei flop ha un asso"],...]
    stats: rows => `<div class="lx-stats">${rows.map(([n, t]) => `<div><b>${n}</b><span>${t}</span></div>`).join("")}</div>`,
    // forme del range: UI.shapes(["lin","pol","cond","cap"])
    shapes: (keys = ["lin", "pol", "cond", "cap"]) => {
      const P = {
        lin: ["Lineare", "forte e medio, niente aria", "M8,62 L8,30 L120,12 L120,62 Z"],
        pol: ["Polarizzato", "nuts e bluff, niente medio", "M8,62 L8,14 L34,14 L34,58 L94,58 L94,14 L120,14 L120,62 Z"],
        cond: ["Condensato", "tanto medio, poche nuts", "M8,62 C40,62 50,8 64,8 C78,8 88,62 120,62 Z"],
        cap: ["Cappato", "manca la parte alta", "M8,62 C20,20 50,14 72,34 C90,50 96,52 104,54 L104,60 L120,61 L120,62 Z"],
      };
      return `<div class="lx-shapes">${keys.map(k => { const [t, d, path] = P[k]; return `<div class="lx-shape"><b>${t}</b><span>${d}</span><svg viewBox="0 0 128 76" aria-hidden="true"><path class="ar" d="${path}"/><line class="ax" x1="4" y1="62" x2="124" y2="62"/><text x="4" y="74">debole</text><text x="104" y="74">nuts</text></svg></div>`; }).join("")}</div>`;
    },
    // grafico fold necessari e equity necessaria per size (fisso, numeri esatti)
    sizeChart: () => {
      const S = [1 / 3, 1 / 2, 3 / 4, 1, 1.5, 2], X = i => 40 + i * 56, Y = v => 150 - v * 1.6;
      const f = S.map(s => s / (1 + s) * 100), e = S.map(s => s / (1 + 2 * s) * 100), lab = ["1/3", "1/2", "3/4", "pot", "1,5x", "2x"];
      const line = (a, c) => `<polyline class="${c}" points="${a.map((v, i) => X(i) + "," + Y(v).toFixed(1)).join(" ")}"/>`;
      const dots = (a, c, dy) => a.map((v, i) => `<circle class="${c}" cx="${X(i)}" cy="${Y(v).toFixed(1)}" r="3.5"/><text x="${X(i) - 9}" y="${(Y(v) + dy).toFixed(1)}">${Math.round(v)}%</text>`).join("");
      return `<div class="lx-chart"><div class="lx-leg"><span style="--c:var(--lxo)">fold necessari al bluff: B/(P+B)</span><span style="--c:var(--lxb)">equity per chiamare: B/(P+2B)</span></div><svg viewBox="0 0 360 172">${[0, 20, 40, 60].map(v => `<line class="gl" x1="30" x2="350" y1="${Y(v)}" y2="${Y(v)}"/><text x="4" y="${Y(v) + 4}">${v}%</text>`).join("")}${line(f, "l1")}${line(e, "l2")}${dots(f, "d1", -8)}${dots(e, "d2", 15)}${lab.map((l, i) => `<text x="${X(i) - 9}" y="168">${l}</text>`).join("")}</svg></div>`;
    },

    // equazione a tessere: UI.eqn([["+3","Edge","pos"],"−",["5","Rake","neg"],"=",["+0,5","bb/100","res"]])
    eqn: parts => `<div class="lx-eqn">${parts.map(x => typeof x === "string" ? `<i class="${x === "=" ? "eq" : ""}">${x}</i>` : `<div class="${x[2] || ""}"><b>${x[0]}</b><span>${x[1]}</span></div>`).join("")}</div>`,
    // tessere con numeri grandi: UI.big([["Equity necessaria","48,63%","Call ÷ piatto finale"],["La tua equity","63,72%","contro il range","gold"]])
    big: rows => `<div class="lx-bign">${rows.map(([k, v, d, c]) => `<div class="${c || ""}"><small>${k}</small><b>${v}</b>${d ? `<span>${d}</span>` : ""}</div>`).join("")}</div>`,
    // misuratore di equity: UI.meter(63.72, 48.63, "JJ contro il range", "serve")
    meter: (have, need, lab, needLab = "serve") => { const f = v => String(v).replace(".", ","); return `<div class="lx-meter"><div class="lx-mtrack"><i style="width:${have}%"></i><b style="left:${have}%">${f(have)}%</b><em style="left:${need}%"><span>${needLab} ${f(need)}%</span></em></div><div class="lx-mleg"><span>0%</span><span>${lab}</span><span>100%</span></div></div>`; },
    // griglia 13x13 di un range: UI.grid("22+,A9s+,ATo+", "didascalia")
    grid: (range, cap) => {
      const R = "AKQJT98765432", ix = c => R.indexOf(c), on = new Set();
      const name = (i, j) => i === j ? R[i] + R[j] : i < j ? R[i] + R[j] + "s" : R[j] + R[i] + "o";
      range.split(",").map(t => t.trim()).filter(Boolean).forEach(t => {
        let m;
        if ((m = t.match(/^([2-9TJQKA])\1(\+?)$/))) { const a = ix(m[1]); for (let i = m[2] ? 0 : a; i <= a; i++) on.add(R[i] + R[i]); }
        else if ((m = t.match(/^([2-9TJQKA])([2-9TJQKA])([so])(\+?)$/))) { const h = ix(m[1]), l = ix(m[2]); for (let k = m[4] ? h + 1 : l; k <= l; k++) on.add(R[h] + R[k] + m[3]); }
      });
      let n = 0; on.forEach(c => n += c.length === 2 ? 6 : c[2] === "s" ? 4 : 12);
      let g = ""; for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) { const c = name(i, j); g += `<i class="${on.has(c) ? "on" : ""}${i === j ? " pp" : ""}">${c}</i>`; }
      return `<div class="lx-rgw"><div class="lx-rg">${g}</div><p class="lx-cap">${cap ? cap + " · " : ""}${n} combinazioni, ${String(Math.round(n / 1326 * 1000) / 10).replace(".", ",")}% delle mani</p></div>`;
    },
    // grafico della varianza: percorsi simulati con lo stesso winrate reale
    varChart: (o = {}) => {
      const wr = o.wr ?? 5, sd = o.sd ?? 90, steps = o.steps ?? 30, P = o.paths ?? 6; let seed = o.seed ?? 7;
      const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
      const paths = []; for (let p = 0; p < P; p++) { let v = 0; const a = [0]; for (let k = 0; k < steps; k++) { v += wr + sd * gauss(); a.push(v); } paths.push(a); }
      const all = paths.flat(), mx = Math.max(...all, wr * steps) * 1.08, mn = Math.min(...all, 0) * 1.08;
      const W = 360, H = 200, X = k => 40 + k / steps * 300, Y = v => 12 + (mx - v) / (mx - mn) * 160;
      const line = (a, c) => `<polyline class="${c}" points="${a.map((v, k) => X(k).toFixed(1) + "," + Y(v).toFixed(1)).join(" ")}"/>`;
      const ticks = [mn, 0, mx].map(v => Math.round(v / 100) * 100).filter((v, i, A) => A.indexOf(v) === i);
      const ends = paths.map(a => a[steps]).sort((x, y) => x - y);
      return `<div class="lx-chart lx-var"><div class="lx-leg"><span style="--c:var(--lxb)">${P} giocatori con lo stesso winrate reale (${wr} bb/100)</span><span style="--c:var(--gold)">risultato atteso</span></div><svg viewBox="0 0 ${W} ${H}">${ticks.map(v => `<line class="gl" x1="36" x2="345" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text x="2" y="${(Y(v) + 4).toFixed(1)}">${v > 0 ? "+" : ""}${v}${v ? "" : " bb"}</text>`).join("")}${paths.map((a, i) => line(a, i === 0 ? "vp vh" : "vp")).join("")}<line class="ve" x1="${X(0)}" y1="${Y(0)}" x2="${X(steps)}" y2="${Y(wr * steps).toFixed(1)}"/><text x="40" y="196">0 mani</text><text x="290" y="196">${String(steps * 100).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} mani</text></svg><p class="lx-cap">Simulazione: stesso giocatore, stesso livello, ${String(steps * 100).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} mani. Dopo ${String(steps * 100).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} mani i saldi vanno da ${Math.round(ends[0] / steps)} a +${Math.round(ends[ends.length - 1] / steps)} bb/100, anche se il winrate reale è sempre +${wr}.</p></div>`;
    },

    // simulazione animata di una mano al tavolo 6-max (solo CSS: funziona anche dentro innerHTML)
    // o = { cycle, hero:{pos,cards}, ev:[[t,pos,tipo,testo,chip]], pot:[[t,testo]], deal:t, hcards:t, end:{t,testo,info}, log:[[t,testo]] }
    hand: (o) => {
      const id = "lx-ha-" + (++HAN), C = o.cycle || 18, P = t => Math.max(0, Math.min(100, t / C * 100)).toFixed(2);
      const POS = { BTN: [50, 85], SB: [13, 64], BB: [13, 28], UTG: [50, 16], HJ: [87, 28], CO: [87, 64] }, CEN = [50, 46];
      const BUB = { BTN: [76, 88], SB: [22, 79], BB: [20, 46], UTG: [50, 31], HJ: [80, 44], CO: [80, 79] }, CHP = { BTN: [50, 64], SB: [24, 60], BB: [29, 37], UTG: [50, 27], HJ: [71, 37], CO: [72, 58] };
      const lerp = (a, k) => [a[0] + (CEN[0] - a[0]) * k, a[1] + (CEN[1] - a[1]) * k];
      let css = "", k = 0;
      const anim = (from, to, t1, t2 = C - 0.7, fade = 0.35) => { const c = "a" + (++k); css += `@keyframes ${id}-${c}{0%,${P(t1)}%{${from}}${P(t1 + fade)}%,${P(t2)}%{${to}}${P(Math.min(C, t2 + fade))}%,100%{${from}}}.${id} .${c}{animation:${id}-${c} ${C}s linear infinite}`; return c; };
      const show = (t1, t2) => anim("opacity:0;transform:translate(-50%,-50%) scale(.6)", "opacity:1;transform:translate(-50%,-50%) scale(1)", t1, t2);
      const fold = Object.fromEntries(o.ev.filter(e => e[2] === "fold").map(e => [e[1], e[0]]));
      // board facoltativo: [[t,"K♠7♦2♣"],[t,"4♥"],[t,"9♣"]]; carte avversarie a showdown: reveal [[t,"CO","A♦Q♦"]]
      const BT = (o.board || []).map(b => b[0]), nextB = t => BT.find(x => x > t), rev = Object.fromEntries((o.reveal || []).map(r => [r[1], r]));
      const cardsHtml = str => str.replace(/10/g, "T").match(/[2-9TJQKA][♠♥♦♣]/g).map(c => `<b class="lx-c ${({ "♠": "s", "♥": "h", "♦": "d", "♣": "c" })[c[1]]}">${c[0] === "T" ? "10" : c[0]}${c[1]}</b>`).join("");
      const seats = Object.entries(POS).map(([pos, [x, y]]) => {
        const hero = o.hero && o.hero.pos === pos, dim = fold[pos] != null ? anim("opacity:1", "opacity:.38", fold[pos]) : "";
        const backs = hero ? "" : `<span class="lx-ha-bk ${anim("opacity:0;transform:translateY(-14px)", "opacity:1;transform:none", (o.deal || 1) + Object.keys(POS).indexOf(pos) * .12, fold[pos] != null ? fold[pos] : rev[pos] ? rev[pos][0] - .05 : C - 0.7)}"><i></i><i></i></span>` + (rev[pos] ? `<span class="lx-ha-hc ${anim("opacity:0;transform:translateY(-10px) rotateY(90deg)", "opacity:1;transform:none", rev[pos][0])}">${cardsHtml(rev[pos][2])}</span>` : "");
        const hc = hero ? `<span class="lx-ha-hc ${anim("opacity:0;transform:translateY(-10px) rotateY(90deg)", "opacity:1;transform:none", o.hcards || 2)}">${o.hero.cards.replace(/10/g, "T").match(/[2-9TJQKA][♠♥♦♣]/g).map(c => `<b class="lx-c ${({ "♠": "s", "♥": "h", "♦": "d", "♣": "c" })[c[1]]}">${c[0] === "T" ? "10" : c[0]}${c[1]}</b>`).join("")}</span>` : "";
        return `<div class="lx-ha-seat${hero ? " hero" : ""} ${dim}" style="left:${x}%;top:${y}%">${hc}${backs}<span class="lx-ha-av">${pos}</span><span class="lx-ha-st">${hero ? "Hero · " : ""}100bb</span></div>`;
      }).join("");
      const ev = o.ev.map(([t, pos, tipo, txt, chip], i) => {
        const ns = o.ev.slice(i + 1).find(e => e[1] === pos), nb = nextB(t), til = Math.min(ns ? ns[0] - .05 : C - 0.7, nb != null ? nb - .05 : C - 0.7);
        const [x, y] = BUB[pos], b = tipo === "post" ? "" : `<span class="lx-ha-bub ${tipo} ${show(t, til)}" style="left:${x}%;top:${y}%">${txt}</span>`;
        const nx = o.ev.slice(i + 1).find(e => e[1] === pos && e[4]), [cx, cy] = CHP[pos];
        const c = chip ? `<span class="lx-ha-chip ${tipo === "allin" ? "big " : ""}${show(t + .15, Math.min(nx ? nx[0] + .1 : C - 0.7, nb != null ? nb - .05 : C - 0.7))}" style="left:${cx}%;top:${cy}%"><i></i>${chip}</span>` : "";
        return b + c;
      }).join("");
      const pots = o.pot.map(([t, txt], i) => `<span class="lx-ha-pot ${show(t, i + 1 < o.pot.length ? o.pot[i + 1][0] - .05 : C - 0.7)}">Piatto <b>${txt}</b></span>`).join("");
      const btn = POS.BTN, db = `<span class="lx-ha-d" style="left:${btn[0] - 13}%;top:${btn[1] - 3}%">D</span>`;
      const end = o.end ? `<div class="lx-ha-end ${anim("opacity:0;transform:translate(-50%,8px)", "opacity:1;transform:translate(-50%,0)", o.end.t)}">${o.end.testo}</div>` : "";
      const log = (o.log || []).map(([t, txt]) => `<li class="${anim("opacity:.18", "opacity:1", t)}">${txt}</li>`).join("");
      const brd = o.board ? `<div class="lx-ha-board">${o.board.map(([t, str]) => `<span class="${anim("opacity:0;transform:translateY(-8px)", "opacity:1;transform:none", t)}">${cardsHtml(str)}</span>`).join("")}</div>` : "";
      const frz = o.end ? Math.min(C - 0.75, o.end.t + 0.4) : C - 1;
      const sum = [...(o.reveal || []).map(([, pos, c]) => `${pos} mostra ${c}`), o.end ? o.end.testo.replace(/<[^>]+>/g, "") : ""].filter(Boolean).join(". ");
      return `<div class="lx-ha ${id}" style="--lx-ha-frz:-${frz.toFixed(2)}s"><style>${css}</style><div class="lx-ha-tbl${o.board ? " hasb" : ""}" aria-hidden="true"><div class="lx-ha-felt"></div>${seats}${db}${brd}${pots}${ev}${end}</div>${log ? `<ol class="lx-ha-log">${log}</ol>` : ""}${sum ? `<p class="lx-ha-sr">${sum}</p>` : ""}<p class="lx-cap">La mano si ripete da sola ogni ${C} secondi.</p></div>`;
    },
    // rigioca un all-in con board sempre nuovi: UI.rerun({ hero, vil, vn, hp, pot, inv, ev, ex:[vinci,pareggio,perdi], exNote })
    rerun: (o = {}) => {
      const h = o.hero || "A♠A♦", v = o.vil || "K♣K♥", vn = o.vn || "CO", pot = o.pot || 201.5, ex = o.ex || [], f = x => String(x).replace(".", ",");
      const cs = s => `<div class="lx-cards">${split(s).map(x => card(x, 1)).join("")}</div>`;
      return `<div class="lx-rr" data-h="${h}" data-v="${v}" data-b="${o.board || ""}" data-vn="${vn}" data-pot="${pot}" data-inv="${o.inv || 100}" data-ev="${o.ev || 0}">
        <div class="lx-rr-top"><div><small>Tu${o.hp ? " · " + o.hp : ""}</small>${cs(h)}</div><span class="lx-rr-vs">contro</span><div><small>${vn}</small>${cs(v)}</div>${o.board ? `<div class="lx-rr-bd"><small>Board</small>${cs(o.board)}</div>` : ""}<div class="lx-rr-pot"><small>Piatto</small><b>${f(pot)}bb</b></div></div>
        <div class="lx-coin-row"><span>Rigioca</span>${[[1, "1 volta"], [10, "10"], [100, "100"], [1000, "1.000"]].map(([n, l]) => `<button type="button" data-lxrr="${n}">${l}</button>`).join("")}</div>
        <div class="lx-coin-out" data-rrout aria-live="polite"><p class="lx-cap">${o.board ? "Tocca un pulsante: a ogni prova esce un river nuovo dalle carte rimaste." : "Tocca un pulsante: a ogni all-in il mazzo si mescola da capo."}</p></div>
        <div class="lx-coin-hist" data-rrhist></div>
        ${ex.length ? `<details class="lx-fold"><summary><span>Il conto esatto</span><small>${o.exSub || "su tutti i 1.712.304 board possibili"}</small></summary><div class="lx-tabw"><table class="lx-tab"><tbody><tr><th>Vinci tu</th><td class="num">${f(ex[0])}%</td></tr><tr><th>Pareggio</th><td class="num">${f(ex[1])}%</td></tr><tr><th>Vince il ${vn}</th><td class="num">${f(ex[2])}%</td></tr><tr><th>Risultato medio</th><td class="num">+${f(o.ev)}bb</td></tr></tbody></table></div>${o.exNote ? `<p class="lx-cap">${o.exNote}</p>` : ""}</details>` : ""}
      </div>`;
    },
    // indovina il vincente da due grafici: UI.guess()
    guess: () => {
      const N = 10000, pr = LXW.guessPair(N);
      return `<div class="lx-gs" data-n="${N}" data-w="${pr.w}" data-l='${JSON.stringify(pr.L)}' data-sc="{}">
        <div class="lx-coin-row"><span>Mani</span>${[1000, 10000, 100000].map(n => `<button type="button" class="${n === N ? "on" : ""}" data-lxgn="${n}" aria-pressed="${n === N ? "true" : "false"}">${n === 1000 ? "1.000" : n === 10000 ? "10.000" : "100.000"}</button>`).join("")}</div>
        <div data-gch>${LXW.guessSvg(pr.L, N, false, pr.w)}</div>
        <div class="lx-gs-pick"><span>Chi è il vincente?</span><button type="button" data-lxgp="0"><i class="a"></i>A</button><button type="button" data-lxgp="1"><i class="b"></i>B</button></div>
        <div data-gout aria-live="polite"><p class="lx-cap">Uno dei due vince 5 bb/100, l'altro ne perde 5: scegli guardando i grafici.</p></div>
        <div class="lx-coin-hist" data-gsc></div>
        <details class="lx-fold"><summary><span>Quanto dice il saldo</span><small>calcolo, non simulazione</small></summary><div class="lx-tabw"><table class="lx-tab"><thead><tr><th>Mani</th><th class="num">Saldo più alto del vincente</th><th class="num">Vincente in perdita</th></tr></thead><tbody><tr><th>1.000</th><td class="num">6 su 10</td><td class="num">43%</td></tr><tr><th>10.000</th><td class="num">8 su 10</td><td class="num">29%</td></tr><tr><th>100.000</th><td class="num">99 su 100</td><td class="num">4%</td></tr></tbody></table></div><p class="lx-cap">Vincente a +5 e perdente a −5 bb/100, con un'oscillazione tipica di 90bb ogni 100 mani (stima per il 6-max).</p></details>
      </div>`;
    },
    // costruisci il tuo piano: UI.plan() · la tua situazione, le tue soglie, la risposta a «posso salire?» e la simulazione
    plan: () => {
      const D = { lv: 1, e: 300, h: 20000, wr: 5, up: 40, dn: 30 }, P = [["Conservativo", 100, 80], ["Intermedio", 40, 30], ["Aggressivo", 30, 20]];
      return `<div class="lx-plan" data-lv="${D.lv}" data-n="100000" data-dr="2">
        <div class="lx-plan-hd"><b class="lx-plan-h">1 · La tua situazione</b><button type="button" class="lx-replay lx-plan-ex" data-lxpex>Carica l'esempio</button></div>
        <div class="lx-coin-row lx-plan-lv"><span>Giochi a</span>${LXW.LV.map(([n], i) => `<button type="button" class="${i === D.lv ? "on" : ""}" data-lxplv="${i}">${n}</button>`).join("")}</div>
        <div class="lx-plan-in"><label><span>Bankroll</span><input type="number" inputmode="decimal" min="0" step="10" value="${D.e}" data-lxpe aria-label="Bankroll in euro"><em>€</em></label><label><span>Mani a questo limite</span><input type="number" inputmode="numeric" min="0" step="1000" value="${D.h}" data-lxph aria-label="Mani giocate a questo limite"></label><label><span>Winrate (vincita)</span><input type="number" inputmode="decimal" step="0.5" value="${D.wr}" data-lxpwr aria-label="Winrate in bb/100"><em>bb/100</em></label><label><span>EV · facoltativo</span><input type="number" inputmode="decimal" step="0.5" value="" placeholder="come la vincita" data-lxpev aria-label="Winrate EV in bb/100, facoltativo"><em>bb/100</em></label><label><span>Oscillazione · facoltativo</span><input type="number" inputmode="decimal" min="30" max="300" step="5" value="" placeholder="90, la stima tipica" data-lxpsd aria-label="Oscillazione tipica in bb ogni 100 mani (deviazione standard), facoltativo"><em>bb/100</em></label></div>
        <div class="lx-coin-row lx-plan-dr"><span>Salendo il winrate cala di</span>${[0, 1, 2, 3].map(d => `<button type="button" class="${d === 2 ? "on" : ""}" data-lxpdr="${d}">${d ? "−" + d : "0"} bb/100</button>`).join("")}<small>a ogni livello: lì gli avversari sono più forti</small></div>
        <b class="lx-plan-h">2 · Il tuo piano</b>
        <div class="lx-coin-row"><span>Approccio</span>${P.map(([t, u, d]) => `<button type="button" class="${u === D.up && d === D.dn ? "on" : ""}" data-lxpp="${u},${d}">${t}</button>`).join("")}<em class="lx-plan-c" data-pc hidden>Piano personalizzato</em></div>
        <label class="lx-plan-sl"><span>Sali quando hai</span><b data-pu>${D.up} buy-in del limite nuovo</b><input type="range" min="30" max="100" step="5" value="${D.up}" data-lxpu aria-label="Buy-in del limite nuovo per salire"></label>
        <label class="lx-plan-sl"><span>Scendi quando hai meno di</span><b data-pd>${D.dn} buy-in del limite dove sei</b><input type="range" min="10" max="100" step="5" value="${D.dn}" data-lxpd aria-label="Buy-in sotto cui scendere"></label>
        <b class="lx-plan-h">3 · La risposta</b>
        <div data-po>${LXW.planOut(D)}</div>
        <div class="lx-plan-sim"><b class="lx-plan-h">4 · Prova il tuo piano</b>
          <p class="lx-cap">Parte dal tuo limite e dal tuo bankroll, con il tuo winrate (l'EV, se l'hai scritto) e le tue soglie.</p>
          <div class="lx-coin-row"><span>Mani</span>${[50000, 100000, 200000].map(n => `<button type="button" class="${n === 100000 ? "on" : ""}" data-lxpn="${n}">${n === 50000 ? "50.000" : n === 100000 ? "100.000" : "200.000"}</button>`).join("")}</div>
          <div><button type="button" class="lx-gs-new" data-lxpsim>Simula il percorso</button></div>
          <div data-psim></div>
          <p class="lx-cap">Ipotesi: a ogni livello sopra il tuo il winrate cala di quanto hai scelto (e sotto sale di altrettanto), con l'oscillazione che hai scritto o, se non l'hai scritta, 90bb ogni 100 mani. Come nella risposta, sali solo dove resti vincente e un limite alla volta: dopo ogni cambio di limite giochi almeno 20.000 mani prima di salire ancora. Il tuo piano resta salvato sul tuo profilo.</p>
        </div>
      </div>`;
    },
    // lo stesso bankroll in buy-in a più limiti, con le fiche che compaiono: UI.brStack({ e: 300 })
    brStack: (o = {}) => {
      const e = o.e || 300, per = o.per || 10, L = o.lv || [["NL2", 2, "a"], ["NL5", 5, "b"], ["NL10", 10, "c"]]; let d = 0.15;
      const rows = L.map(([n, c, k]) => { const bi = e / c, nc = Math.round(bi / per), ch = Array.from({ length: nc }, (_, i) => `<i class="lx-chip ${k} lx-pp" style="--d:${(d + i * 0.06).toFixed(2)}s"></i>`).join(""), r = `<div class="lx-stk-r"><div class="lx-stk-l"><b>${n}</b><span>${c} € a buy-in</span></div><div class="lx-stk-c">${ch}</div><b class="lx-stk-n lx-fd" style="--d:${(d + nc * 0.06 + 0.1).toFixed(2)}s">${bi.toLocaleString("it-IT")} buy-in</b></div>`; d += nc * 0.06 + 0.45; return r; }).join("");
      return `<div class="lx-stk lx-anim"><div class="lx-stk-h"><b>${e.toLocaleString("it-IT")} € di bankroll</b><span><i class="lx-chip a"></i> ogni fiche vale ${per} buy-in</span></div>${rows}<button type="button" class="lx-replay" data-lxreplay>Rivedi</button></div>`;
    },
    // un vincente e il suo periodo negativo, la linea si disegna da sinistra: UI.brSwing({ seed, wr, bi0, dur })
    brSwing: (o = {}) => {
      const wr = o.wr || 5, bi0 = o.bi0 || 30, dur = o.dur || 7, S = LXW.swing(o.seed || 15, wr, bi0), a = S.a, n = a.length - 1;
      const lo = Math.min(...a) - 4, hi = Math.max(...a, bi0 + wr * 10) + 4, W = 320, H = 160, X = i => 8 + i / n * (W - 16), Y = v => 8 + (hi - v) / (hi - lo) * (H - 16);
      const d = a.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(""), f1 = x => String(Math.round(x * 10) / 10).replace(".", ",");
      const tb = (S.bt / n * dur).toFixed(2), fin = a[n] - bi0;
      return `<div class="lx-sw lx-anim" style="--dur:${dur}s"><div class="lx-rvw"><svg viewBox="0 0 ${W} ${H}" class="lx-coin-ch lx-sw-svg lx-rvg" role="img" aria-label="Bankroll di un vincente in 100.000 mani: periodo negativo di ${f1(S.best)} buy-in">
        <rect class="band lx-fd" style="--d:${tb}s" x="${X(S.bp).toFixed(1)}" y="${Y(a[S.bp]).toFixed(1)}" width="${(X(S.bt) - X(S.bp)).toFixed(1)}" height="${(Y(a[S.bt]) - Y(a[S.bp])).toFixed(1)}" rx="3"/>
        <path class="e" d="M${X(0)} ${Y(bi0).toFixed(1)} L${X(n)} ${Y(bi0 + wr * 10).toFixed(1)}"/><path class="l g" d="${d}"/>
        <circle class="dot lx-pp" style="--d:${dur}s" cx="${X(n).toFixed(1)}" cy="${Y(a[n]).toFixed(1)}" r="3.5"/></svg></div>
        <div class="lx-gs-ax"><span>0 mani · ${bi0} buy-in</span><span>100.000 mani</span></div>
        <div class="lx-sw-tags"><span class="dd lx-fd" style="--d:${tb}s">Periodo negativo: −${f1(S.best)} buy-in in ${((S.bt - S.bp) * 100).toLocaleString("it-IT")} mani</span><span class="end lx-fd" style="--d:${dur}s">Dopo 100.000 mani: ${fin >= 0 ? "+" : "−"}${f1(Math.abs(fin))} buy-in</span></div>
        <button type="button" class="lx-replay" data-lxreplay>Rivedi</button></div>`;
    },
    // lo shot in tre passi, che compaiono uno dopo l'altro: UI.shotFlow()
    shotFlow: () => `<div class="lx-sf lx-anim"><div class="lx-sf-row"><div class="lx-sf-n lx-fd" style="--d:.1s"><small>Prima</small><b>800 €</b><span>NL10 · 80 buy-in</span></div><span class="lx-sf-ar lx-fd" style="--d:.6s" aria-hidden="true">→</span><div class="lx-sf-n sh lx-fd" style="--d:.9s"><small>Lo shot</small><b>5 buy-in di NL25</b><span>rischi al massimo 125 €</span></div></div><div class="lx-sf-br"><div class="lx-sf-n ko lx-fd" style="--d:1.6s"><small>Se va male</small><b>675 €</b><span>torni a NL10 con 67,5 buy-in: ancora dentro il piano</span></div><div class="lx-sf-n ok lx-fd" style="--d:2.1s"><small>Se va bene e arrivi a 1.000 €</small><b>NL25</b><span>40 buy-in di NL25: il limite entra nel piano</span></div></div><button type="button" class="lx-replay" data-lxreplay>Rivedi</button></div>`,
    // calcolatore del bankroll: UI.brc({ e: 500, plan: 100 })
    brc: (o = {}) => {
      const E = [40, 60, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000], e = o.e || 500, plan = o.plan || 100, i0 = Math.max(0, E.indexOf(e));
      const bt = p => `<button type="button" class="${p === plan ? "on" : ""}" data-lxbrp="${p}" aria-pressed="${p === plan ? "true" : "false"}">${p}</button>`;
      return `<div class="lx-brc" data-plan="${plan}" data-e='${JSON.stringify(E)}'>
        <label><span>Il tuo bankroll</span><b data-bre>${e.toLocaleString("it-IT")} €</b><input type="range" min="0" max="${E.length - 1}" step="1" value="${i0}" data-lxbre aria-label="Bankroll in euro"></label>
        <div class="lx-brc-plan"><span>Buy-in del tuo piano</span><div><small>Aggressivo</small><p>${[20, 25].map(bt).join("")}</p></div><div><small>Intermedio</small><p>${[30, 40, 50, 60].map(bt).join("")}</p></div><div><small>Conservativo</small><p>${bt(100)}</p></div></div>
        <div data-bro>${LXW.brcOut(e, plan)}</div>
      </div>`;
    },
    // rischio di andare a zero e simulazione di 20 giocatori: UI.ruin({ bi: 25, wr: 5 })
    ruin: (o = {}) => {
      const bi = o.bi || 25, wr = o.wr || 5;
      return `<div class="lx-ruin" data-bi="${bi}" data-wr="${wr}">
        <div class="lx-coin-row"><span>Bankroll</span>${[20, 25, 30, 50, 100].map(b => `<button type="button" class="${b === bi ? "on" : ""}" data-lxrbi="${b}">${b} buy-in</button>`).join("")}</div>
        <div class="lx-coin-row"><span>Winrate</span>${[2, 5, 8].map(w => `<button type="button" class="${w === wr ? "on" : ""}" data-lxrwr="${w}">+${w} bb/100</button>`).join("")}</div>
        <div data-ruo>${LXW.ruinOut(bi, wr)}</div>
        <div><button type="button" class="lx-gs-new" data-lxrsim>Simula 20 giocatori</button></div>
        <div data-rusim></div>
        <details class="lx-fold"><summary><span>Il rischio per sempre</span><small>winrate in bb/100, sempre allo stesso limite</small></summary><div class="lx-tabw"><table class="lx-tab"><thead><tr><th>Buy-in</th><th class="num">+2</th><th class="num">+5</th><th class="num">+8</th></tr></thead><tbody>${[20, 25, 30, 50, 100].map(b => `<tr><th>${b}</th>${[2, 5, 8].map(w => `<td class="num">${LXW.ruinPct(LXW.ruinP(b, w, 0)).replace("meno dello ", "&lt;")}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>
        <p class="lx-cap">Calcolo con un'oscillazione tipica di 90bb ogni 100 mani (stima per il 6-max), giocando sempre allo stesso limite, senza mai scendere né ricaricare.</p>
      </div>`;
    },
    // contatore dei colpi rari: UI.rare({ p: probabilità per mano, h: ore a settimana, cap })
    rare: (o = {}) => { const h = o.h || 10; return `<div class="lx-rare" data-p="${o.p}"><label><span>Ore di gioco a settimana</span><b data-rh>${h} ore</b><input type="range" min="1" max="40" step="1" value="${h}" data-lxrare aria-label="Ore di gioco a settimana"></label><div class="lx-rare-out" data-ro>${LXW.rareOut(h, o.p)}</div>${o.cap ? `<p class="lx-cap">${o.cap}</p>` : ""}</div>`; },
    // metodo in passi applicato a casi diversi: UI.method(["Domanda", ...], [{ t: "etichetta", q: "«sospetto»", a: ["risposta", ...], v: "verdetto" }])
    method: (steps, cases) => `<div class="lx-meth"><div class="lx-coin-row"><span>Il sospetto</span>${cases.map((c, i) => `<button type="button" class="${i ? "" : "on"}" data-lxmeth="${i}" aria-pressed="${i ? "false" : "true"}">${c.t}</button>`).join("")}</div>${cases.map((c, i) => `<div class="lx-meth-c" data-mc="${i}"${i ? " hidden" : ""}><p class="lx-meth-q">${c.q}</p><ol class="lx-meth-l">${steps.map((st, k) => `<li><b>${st}</b><p>${c.a[k]}</p></li>`).join("")}</ol><div class="lx-meth-v"><small>Verdetto</small><b>${c.v}</b></div></div>`).join("")}</div>`,
    // vero o falso con spiegazione: UI.tf([["frase", true, "perché"], ...])
    tf: (items, o = {}) => { const Y = o.yes || "Vero", N = o.no || "Falso", hint = o.hint || "Tocca Vero o Falso per ogni frase.";
      return `<div class="lx-tf" data-hint="${hint}">${items.map(([q, a, e]) => `<div class="lx-tf-i" data-a="${a ? 1 : 0}"><p>${q}</p><div class="lx-tf-b">${o.noFirst ? `<button type="button" data-lxtf="0">${N}</button><button type="button" data-lxtf="1">${Y}</button>` : `<button type="button" data-lxtf="1">${Y}</button><button type="button" data-lxtf="0">${N}</button>`}</div><p class="lx-tf-e" hidden><b>${a ? Y : N}.</b> ${e}</p></div>`).join("")}<p class="lx-tf-s" data-tfs>${hint}</p></div>`; },
    // check del tilt: UI.tilt([["Segnale", "descrizione"], ...])
    tilt: items => `<div class="lx-tilt"><div class="lx-tilt-h"><b>Il check del tilt</b><small>Spunta quello che senti adesso. Rifallo dopo ogni colpo grosso.</small></div><div class="lx-tilt-l">${items.map(([t, d]) => `<label class="lx-tilt-i"><input type="checkbox" data-lxtilt><span><b>${t}</b>${d}</span></label>`).join("")}</div><div data-tout aria-live="polite">${LXW.tiltOut(0)}</div></div>`,
    // tabella: UI.tab(["Size","Fold","MDF"], [["1/3","25%","75%"],...], {num:[1,2]})
    tab: (head, rows, o = {}) => `<div class="lx-tabw"><table class="lx-tab${o.green ? " g" : ""}"><thead><tr>${head.map((h, i) => `<th${(o.num || []).includes(i) ? ' class="num"' : ""}>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td${(o.num || []).includes(i) ? ' class="num"' : ""}>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`,
    // moneta truccata interattiva: UI.coin() · il vantaggio piccolo e ripetuto, lanci simulati e probabilità esatte
    coin: () => {
      const P = { "0.51": [40, 54, 73, 98], "0.53": [45, 69, 97, ">99,9"], "0.55": [50, 82, "99,9", ">99,9"] };
      const row = p => `<tr><th>${Math.round(p * 100)}%</th>${P[p].map(v => `<td class="num">${String(v).replace(".", ",")}%</td>`).join("")}</tr>`;
      return `<div class="lx-coin" data-p="0.55">
        <div class="lx-coin-top"><div class="lx-coin-c" aria-hidden="true"><b data-cpc>55%</b></div><div><b>La moneta truccata</b><p>Esce testa il <b data-cp>55%</b> delle volte. Testa vinci 1 €, croce perdi 1 €. In media guadagni <b data-cev>0,10 €</b> a lancio: un vantaggio piccolo.</p></div></div>
        <div class="lx-coin-row"><span>Vantaggio</span><button type="button" data-lxcp="0.51" aria-pressed="false">51%</button><button type="button" data-lxcp="0.53" aria-pressed="false">53%</button><button type="button" class="on" data-lxcp="0.55" aria-pressed="true">55%</button></div>
        <div class="lx-coin-row"><span>Lancia</span><button type="button" data-lxcn="10">10</button><button type="button" data-lxcn="100">100</button><button type="button" data-lxcn="1000">1.000</button><button type="button" data-lxcn="10000">10.000</button></div>
        <div class="lx-coin-out" data-cout aria-live="polite"><p class="lx-cap">Tocca un numero di lanci, poi ripeti. Con 10 lanci a volte chiudi in perdita, con 10.000 quasi mai. Guarda anche la media a lancio: con tanti lanci si avvicina a quella attesa.</p></div>
        <div class="lx-coin-hist" data-chist></div>
        <details class="lx-fold"><summary><span>Probabilità di chiudere in vantaggio</span><small>calcolo esatto, non simulato</small></summary><div class="lx-tabw"><table class="lx-tab"><thead><tr><th>Moneta</th><th class="num">10 lanci</th><th class="num">100</th><th class="num">1.000</th><th class="num">10.000</th></tr></thead><tbody>${["0.51", "0.53", "0.55"].map(row).join("")}</tbody></table></div><p class="lx-cap">«In vantaggio» vuol dire sopra zero, e con pochi lanci chiudere in pari capita spesso: con la moneta al 55% e 10 lanci chiudi in vantaggio 1 volta su 2, in pari 1 su 4, in perdita 1 su 4. Più il vantaggio è piccolo, più ripetizioni servono perché venga fuori.</p></details>
      </div>`;
    },
    // dove vanno i soldi di un piatto: UI.flow(10, 5) · piatto in euro, rake in percentuale (esempio)
    flow: (pot = 10, pct = 5) => {
      const rk = Math.round(pot * pct) / 100, win = pot - rk, f = v => v.toFixed(2).replace(".", ",") + " €";
      return `<div class="lx-flow"><div class="lx-flow-pot"><span class="lx-flow-chips"><i></i><i></i><i></i></span><small>Piatto</small><b>${f(pot)}</b><em>i soldi messi dai giocatori</em></div>
        <div class="lx-flow-arr"><div class="lx-flow-a w"><span style="--w:${100 - pct}%"></span><div><b>${f(win)}</b><small>a chi vince la mano</small></div></div><div class="lx-flow-a r"><span style="--w:${Math.max(pct, 4)}%"></span><div><b>${f(rk)}</b><small>alla room: la rake</small></div></div></div></div>`;
    },
    // vantaggio contro rake, con cursore: UI.edge(13, 10)
    edge: (v = 13, rake = 10) => `<div class="lx-edge" data-rake="${rake}" data-rb="0"><label><span>Il tuo vantaggio sul tavolo, prima della rake</span><b data-ev>+${v} bb/100</b><input type="range" min="0" max="25" step="1" value="${v}" data-lxedge aria-label="Vantaggio prima della rake in bb/100" aria-valuetext="+${v} bb/100"></label>
      <div class="lx-coin-row"><span>Rakeback</span>${[0, 15, 30, 50].map(p => `<button type="button" class="${p ? "" : "on"}" data-lxrb="${p}" aria-pressed="${p ? "false" : "true"}">${p ? p + "%" : "Nessuno"}</button>`).join("")}</div>
      <div class="lx-edge-bars"><div><small>Vantaggio</small><i class="g" data-eg style="--w:${v / 25 * 100}%"></i></div><div><small>Rake</small><i class="r" style="--w:${rake / 25 * 100}%"></i><em>−${rake}</em></div><div class="rb" data-erb hidden><small>Rakeback</small><i class="rb" data-erbi style="--w:0%"></i><em data-erbe>+0</em></div></div>
      <div class="lx-edge-res" data-er aria-live="polite">${LXW.edgeRes(v, rake)}</div></div>`,
    // da bb/100 a euro: UI.bbc(5)
    bbc: (wr = 5) => `<div class="lx-bbc" data-lv="0.02"><label><span>Winrate</span><b data-bw>+${wr} bb/100</b><input type="range" min="-10" max="15" step="1" value="${wr}" data-lxbbw aria-label="Winrate in bb/100" aria-valuetext="${LXW.sg(wr)} bb/100"></label>
      <div class="lx-coin-row"><span>Limite</span>${[["NL2", "0.02"], ["NL5", "0.05"], ["NL10", "0.10"], ["NL25", "0.25"], ["NL50", "0.50"], ["NL100", "1"], ["NL200", "2"], ["NL500", "5"], ["NL1000", "10"]].map(([n, b], i) => `<button type="button" class="${i ? "" : "on"}" data-lxbbl="${b}" aria-pressed="${i ? "false" : "true"}">${n}</button>`).join("")}</div>
      <div class="lx-bbc-out" data-bo aria-live="polite">${LXW.bbcOut(wr, 0.02)}</div></div>`,
    // il volume moltiplica: due linee di risultato atteso, +3 e −4 bb/100, fino a 100.000 mani
    vol: () => {
      const W = 320, H = 150, X = k => 34 + k / 100 * 276, Y = v => 75 - v / 4200 * 62;
      const ln = (wr, cls) => `<path class="${cls}" d="M${X(0)} ${Y(0)} L${X(100)} ${Y(wr * 1000)}"/>`;
      return `<figure class="lx-vol"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Risultato atteso con +3 e −4 bb/100 fino a 100.000 mani">
        <path class="ax" d="M${X(0)} ${Y(0)} H${X(100)}"/>${ln(3, "g")}${ln(-4, "r")}${[25, 50, 75, 100].map(k => `<path class="tk" d="M${X(k)} ${Y(0) - 3} V${Y(0) + 3}"/><text class="tl" x="${X(k)}" y="${Y(0) + 14}" text-anchor="${k === 100 ? "end" : "middle"}">${k}k</text>`).join("")}
        <text class="tg" x="${X(100) - 2}" y="${Y(3000) - 6}" text-anchor="end">+3 bb/100 → +3.000bb</text><text class="tr" x="${X(100) - 2}" y="${Y(-4000) + 14}" text-anchor="end">−4 bb/100 → −4.000bb</text>
        <text class="tl" x="${X(0) - 4}" y="${Y(0) + 4}" text-anchor="end">0</text></svg>
        <figcaption>Risultato atteso in base alle mani giocate (in migliaia). A NL2: <b class="g">+60 €</b> contro <b class="r">−80 €</b> dopo 100.000 mani.</figcaption></figure>`;
    },
  };
})();
/* gestori delegati degli strumenti interattivi delle schede */
(() => {
  if (typeof document === "undefined" || !document.addEventListener) return;
  // animazioni delle schede: partono quando il blocco entra nello schermo (classe .in), «Rivedi» le fa ripartire
  const io = typeof IntersectionObserver === "function" ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.3 }) : null;
  const animScan = root => { if (!root || !root.querySelectorAll) return; const L = [...root.querySelectorAll(".lx-anim:not([data-io])")]; if (root.matches && root.matches(".lx-anim:not([data-io])")) L.push(root); L.forEach(el => { el.dataset.io = "1"; if (io) io.observe(el); else el.classList.add("in"); }); };
  if (typeof MutationObserver === "function") new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(nd => { if (nd.nodeType === 1) animScan(nd); }))).observe(document.documentElement, { childList: true, subtree: true });
  animScan(document);
  const coinSet = (box, p) => {
    box.dataset.p = p; box.dataset.h = "[]"; const pc = Math.round(p * 100);
    box.querySelectorAll("[data-cp],[data-cpc]").forEach(x => x.textContent = pc + "%");
    const ev = box.querySelector("[data-cev]"); if (ev) ev.textContent = (2 * p - 1).toFixed(2).replace(".", ",") + " €";
    box.querySelectorAll("[data-lxcp]").forEach(b => { const on = +b.dataset.lxcp === p; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    const o = box.querySelector("[data-cout]"); if (o) o.innerHTML = `<p class="lx-cap">Moneta al ${pc}%: tocca un numero di lanci e ripeti più volte.</p>`;
    const hi = box.querySelector("[data-chist]"); if (hi) hi.innerHTML = "";
  };
  // vantaggio contro rake: ridisegna barre e risultato con il rakeback scelto
  const edgeUpd = box => {
    if (!box) return; const v = +box.querySelector("[data-lxedge]").value, rk = +box.dataset.rake || 10, rb = +box.dataset.rb || 0, back = rk * rb / 100;
    box.querySelector("[data-ev]").textContent = "+" + v + " bb/100"; box.querySelector("[data-lxedge]").setAttribute("aria-valuetext", "+" + v + " bb/100"); box.querySelector("[data-eg]").style.setProperty("--w", v / 25 * 100 + "%");
    const rr = box.querySelector("[data-erb]"); if (rr) { rr.hidden = !rb; rr.querySelector("[data-erbi]").style.setProperty("--w", back / 25 * 100 + "%"); rr.querySelector("[data-erbe]").textContent = "+" + String(back).replace(".", ","); }
    box.querySelector("[data-er]").innerHTML = LXW.edgeRes(v, rk, rb);
  };
  document.addEventListener("click", e => {
    const rp = e.target.closest("[data-lxreplay]"); if (rp) { const el = rp.closest(".lx-anim"); if (el) { el.classList.remove("in"); void el.offsetWidth; el.classList.add("in"); } return; }
    const rbb = e.target.closest("[data-lxrb]"); if (rbb) { const box = rbb.closest(".lx-edge"); if (!box) return; box.dataset.rb = rbb.dataset.lxrb; box.querySelectorAll("[data-lxrb]").forEach(b => { b.classList.toggle("on", b === rbb); b.setAttribute("aria-pressed", b === rbb ? "true" : "false"); }); edgeUpd(box); return; }
    const cp = e.target.closest("[data-lxcp]"); if (cp) { const box = cp.closest(".lx-coin"); if (!box) return; const last = box.querySelector("[data-lxcn].on"); coinSet(box, +cp.dataset.lxcp); if (last) last.click(); return; }
    const cn = e.target.closest("[data-lxcn]");
    if (cn) {
      const box = cn.closest(".lx-coin"); if (!box) return; const N = +cn.dataset.lxcn, p = +box.dataset.p || 0.55, r = LXW.coinRun(p, N);
      box.querySelectorAll("[data-lxcn]").forEach(b => b.classList.toggle("on", b === cn));
      box.querySelector("[data-cout]").innerHTML = r.html;
      let H = []; try { H = JSON.parse(box.dataset.h || "[]"); } catch (er) {} H.push([N, r.s]); H = H.slice(-8); box.dataset.h = JSON.stringify(H);
      box.querySelector("[data-chist]").innerHTML = `<small>Ultimi tentativi</small>${H.map(([n, v]) => `<span class="${LXW.cls(v)}">${n.toLocaleString("it-IT")} lanci: ${LXW.sg(v)} €</span>`).join("")}`;
      return;
    }
    const bl = e.target.closest("[data-lxbbl]");
    if (bl) { const box = bl.closest(".lx-bbc"); if (!box) return; box.dataset.lv = bl.dataset.lxbbl; box.querySelectorAll("[data-lxbbl]").forEach(b => { b.classList.toggle("on", b === bl); b.setAttribute("aria-pressed", b === bl ? "true" : "false"); }); const w = +box.querySelector("[data-lxbbw]").value; box.querySelector("[data-bo]").innerHTML = LXW.bbcOut(w, +box.dataset.lv); }
  });
  // chi è il vincente: nuova coppia di grafici
  const guessNew = (box, N) => {
    const pr = LXW.guessPair(N); box.dataset.n = N; box.dataset.w = pr.w; box.dataset.l = JSON.stringify(pr.L); delete box.dataset.done;
    box.querySelectorAll("[data-lxgn]").forEach(b => { const on = +b.dataset.lxgn === N; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    box.querySelector("[data-gch]").innerHTML = LXW.guessSvg(pr.L, N, false, pr.w);
    box.querySelectorAll("[data-lxgp]").forEach(b => { b.disabled = false; b.classList.remove("on", "ok", "ko"); const i = b.querySelector("i"); if (i) i.className = b.dataset.lxgp === "0" ? "a" : "b"; });
    box.querySelector("[data-gout]").innerHTML = `<p class="lx-cap">Uno dei due vince 5 bb/100, l'altro ne perde 5: scegli guardando i grafici.</p>`;
  };
  // vero o falso: conteggio e pulsante per rifare
  const tfScore = box => {
    const it = [...box.querySelectorAll(".lx-tf-i")], done = it.filter(x => x.dataset.done).length, ok = it.filter(x => x.classList.contains("ok")).length, s = box.querySelector("[data-tfs]");
    if (s) s.innerHTML = done < it.length ? `${done} su ${it.length}: continua con le altre.` : `Giuste <b>${ok} su ${it.length}</b>. <button type="button" class="lx-tf-r" data-lxtfr>Rifai</button>`;
  };
  document.addEventListener("click", e => {
    const rr = e.target.closest("[data-lxrr]");
    if (rr) {
      const box = rr.closest(".lx-rr"); if (!box || typeof djEval !== "function") return;
      const N = +rr.dataset.lxrr, R = LXW.rerunRun(box.dataset.h, box.dataset.v, N, +box.dataset.pot, +box.dataset.inv, box.dataset.b || "");
      box.querySelectorAll("[data-lxrr]").forEach(b => b.classList.toggle("on", b === rr));
      box.querySelector("[data-rrout]").innerHTML = LXW.rerunHtml(R, N, +box.dataset.ev, box.dataset.vn);
      let H = []; try { H = JSON.parse(box.dataset.hist || "[]"); } catch (er) {} H.push([N, R.net]); H = H.slice(-8); box.dataset.hist = JSON.stringify(H);
      box.querySelector("[data-rrhist]").innerHTML = `<small>Ultimi tentativi</small>${H.map(([n, v]) => `<span class="${LXW.cls(v)}">${n === 1 ? "1 all-in" : n.toLocaleString("it-IT") + " all-in"}: ${LXW.sgd(v)}bb</span>`).join("")}`;
      return;
    }
    const gn = e.target.closest("[data-lxgn]"), gnew = e.target.closest("[data-lxgnew]");
    if (gn || gnew) { const box = (gn || gnew).closest(".lx-gs"); if (box) guessNew(box, gn ? +gn.dataset.lxgn : +box.dataset.n); return; }
    const gp = e.target.closest("[data-lxgp]");
    if (gp) {
      const box = gp.closest(".lx-gs"); if (!box || box.dataset.done) return; box.dataset.done = "1";
      let L = [[0], [0]]; try { L = JSON.parse(box.dataset.l); } catch (er) {}
      const N = +box.dataset.n, w = +box.dataset.w, p = +gp.dataset.lxgp, res = LXW.guessMsg(L, w, p, N);
      box.querySelector("[data-gch]").innerHTML = LXW.guessSvg(L, N, true, w);
      box.querySelectorAll("[data-lxgp]").forEach(b => { b.disabled = true; b.classList.toggle("on", b === gp); if (b === gp) b.classList.add(res.ok ? "ok" : "ko"); const i = b.querySelector("i"); if (i) i.className = +b.dataset.lxgp === w ? "g" : "r"; });
      box.querySelector("[data-gout]").innerHTML = res.html + `<button type="button" class="lx-gs-new" data-lxgnew>Nuova coppia</button>`;
      let sc = {}; try { sc = JSON.parse(box.dataset.sc || "{}"); } catch (er) {} const c = sc[N] || [0, 0]; sc[N] = [c[0] + (res.ok ? 1 : 0), c[1] + 1]; box.dataset.sc = JSON.stringify(sc);
      box.querySelector("[data-gsc]").innerHTML = LXW.guessScore(sc);
      return;
    }
    const me = e.target.closest("[data-lxmeth]");
    if (me) { const box = me.closest(".lx-meth"); if (!box) return; box.querySelectorAll("[data-lxmeth]").forEach(b => { b.classList.toggle("on", b === me); b.setAttribute("aria-pressed", b === me ? "true" : "false"); }); box.querySelectorAll("[data-mc]").forEach(c => c.hidden = c.dataset.mc !== me.dataset.lxmeth); return; }
    const tf = e.target.closest("[data-lxtf]");
    if (tf) {
      const it = tf.closest(".lx-tf-i"), box = tf.closest(".lx-tf"); if (!it || !box || it.dataset.done) return; it.dataset.done = "1";
      const a = +it.dataset.a, ok = +tf.dataset.lxtf === a; it.classList.add(ok ? "ok" : "ko");
      it.querySelectorAll("[data-lxtf]").forEach(b => { b.disabled = true; if (+b.dataset.lxtf === a) b.classList.add("right"); if (b === tf) b.classList.add("pick"); });
      it.querySelector(".lx-tf-e").hidden = false; tfScore(box); return;
    }
    const tfr = e.target.closest("[data-lxtfr]");
    if (tfr) {
      const box = tfr.closest(".lx-tf"); if (!box) return;
      box.querySelectorAll(".lx-tf-i").forEach(it => { delete it.dataset.done; it.classList.remove("ok", "ko"); it.querySelector(".lx-tf-e").hidden = true; it.querySelectorAll("[data-lxtf]").forEach(b => { b.disabled = false; b.classList.remove("right", "pick"); }); });
      box.querySelector("[data-tfs]").textContent = box.dataset.hint || "Tocca Vero o Falso per ogni frase."; return;
    }
  });
  document.addEventListener("change", e => {
    const t = e.target; if (!t || !t.matches || !t.matches("[data-lxtilt]")) return;
    const box = t.closest(".lx-tilt"); if (!box) return; const n = box.querySelectorAll("[data-lxtilt]:checked").length;
    box.classList.toggle("on", n > 0); box.querySelector("[data-tout]").innerHTML = LXW.tiltOut(n);
  });
  // costruisci il tuo piano: lettura dei controlli, ridisegno, salvataggio nel profilo (S.bplan) e ripristino quando la scheda compare
  const planNum = (el, d, lo, hi) => { const v = parseFloat(String(el && el.value).replace(",", ".")); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
  const planRead = box => { const q = k => box.querySelector(k); return { lv: Math.min(LXW.LV.length - 1, Math.max(0, +box.dataset.lv || 0)), e: planNum(q("[data-lxpe]"), 0, 0, 10000000), h: Math.round(planNum(q("[data-lxph]"), 0, 0, 100000000)), wr: planNum(q("[data-lxpwr]"), 0, -100, 100), ev: String(q("[data-lxpev]") ? q("[data-lxpev]").value : "").trim() === "" ? null : planNum(q("[data-lxpev]"), 0, -100, 100), sd: String(q("[data-lxpsd]") ? q("[data-lxpsd]").value : "").trim() === "" ? null : planNum(q("[data-lxpsd]"), 90, 30, 300), up: +q("[data-lxpu]").value, dn: +q("[data-lxpd]").value, n: +box.dataset.n || 100000, dr: box.dataset.dr != null && box.dataset.dr !== "" ? +box.dataset.dr : 2 }; };
  const planUpd = (box, keepSim) => {
    if (!box) return; const q = k => box.querySelector(k); let P = planRead(box);
    if (P.dn > P.up) { q("[data-lxpd]").value = P.up; P = planRead(box); }
    q("[data-pu]").textContent = P.up + " buy-in del limite nuovo"; q("[data-pd]").textContent = P.dn + " buy-in del limite dove sei";
    let pre = false; box.querySelectorAll("[data-lxpp]").forEach(b => { const [u, d] = b.dataset.lxpp.split(",").map(Number), on = u === P.up && d === P.dn; b.classList.toggle("on", on); if (on) pre = true; });
    const pc = q("[data-pc]"); if (pc) pc.hidden = pre;
    box.querySelectorAll("[data-lxplv]").forEach(b => b.classList.toggle("on", +b.dataset.lxplv === P.lv)); box.querySelectorAll("[data-lxpdr]").forEach(b => b.classList.toggle("on", +b.dataset.lxpdr === P.dr)); box.querySelectorAll("[data-lxpn]").forEach(b => b.classList.toggle("on", +b.dataset.lxpn === P.n));
    const fold = q("[data-po] details"), open = fold && fold.open;
    q("[data-po]").innerHTML = LXW.planOut(P); if (open) { const f2 = q("[data-po] details"); if (f2) f2.open = true; }
    if (!keepSim) { q("[data-psim]").innerHTML = ""; const sb = q("[data-lxpsim]"); if (sb) sb.textContent = "Simula il percorso"; }
  };
  const planSave = box => { try { const P = planRead(box); if (typeof S === "object" && S) { S.bplan = P; if (typeof persist === "function") persist(); } } catch (er) {} };
  const planSet = (box, B) => { const q = k => box.querySelector(k); if (B.lv != null) box.dataset.lv = B.lv; if (B.e != null) q("[data-lxpe]").value = B.e; if (B.h != null) q("[data-lxph]").value = B.h; if (B.wr != null) q("[data-lxpwr]").value = B.wr; if (q("[data-lxpev]")) q("[data-lxpev]").value = B.ev == null ? "" : B.ev; if (q("[data-lxpsd]")) q("[data-lxpsd]").value = B.sd == null ? "" : B.sd; if (B.up) q("[data-lxpu]").value = B.up; if (B.dn) q("[data-lxpd]").value = B.dn; if (B.n) box.dataset.n = B.n; if (B.dr != null) box.dataset.dr = B.dr; planUpd(box); };
  const planHydrate = root => {
    if (!root || !root.querySelectorAll) return; let B = null; try { B = typeof S === "object" && S ? S.bplan : null; } catch (er) {} if (!B || B.lv == null) return;
    const L = [...root.querySelectorAll(".lx-plan:not([data-hy])")]; if (root.matches && root.matches(".lx-plan:not([data-hy])")) L.push(root);
    L.forEach(box => { box.dataset.hy = "1"; planSet(box, B); });
  };
  if (typeof MutationObserver === "function") new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(nd => { if (nd.nodeType === 1) planHydrate(nd); }))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("input", e => { const t = e.target; if (t && t.matches && t.matches("[data-lxpe],[data-lxph],[data-lxpwr],[data-lxpev],[data-lxpsd],[data-lxpu],[data-lxpd]")) planUpd(t.closest(".lx-plan")); });
  document.addEventListener("change", e => { const t = e.target; if (t && t.matches && t.matches("[data-lxpe],[data-lxph],[data-lxpwr],[data-lxpev],[data-lxpsd],[data-lxpu],[data-lxpd]")) planSave(t.closest(".lx-plan")); });
  document.addEventListener("click", e => {
    const pl = e.target.closest("[data-lxplv]");
    if (pl) { const box = pl.closest(".lx-plan"); if (!box) return; box.dataset.lv = pl.dataset.lxplv; planUpd(box); planSave(box); return; }
    const pp = e.target.closest("[data-lxpp]");
    if (pp) { const box = pp.closest(".lx-plan"); if (!box) return; const [u, d] = pp.dataset.lxpp.split(",").map(Number); box.querySelector("[data-lxpu]").value = u; box.querySelector("[data-lxpd]").value = d; planUpd(box); planSave(box); return; }
    const px = e.target.closest("[data-lxpex]");
    if (px) { const box = px.closest(".lx-plan"); if (!box) return; planSet(box, { lv: 3, e: 1300, h: 300000, wr: 10, ev: 10, up: 30, dn: 20, dr: 2 }); planSave(box); const v = box.querySelector(".lx-plan-v"); if (v) v.scrollIntoView({ block: "nearest", behavior: "smooth" }); return; }
    const pd = e.target.closest("[data-lxpdr]");
    if (pd) { const box = pd.closest(".lx-plan"); if (!box) return; box.dataset.dr = pd.dataset.lxpdr; planUpd(box); planSave(box); return; }
    const pn = e.target.closest("[data-lxpn]");
    if (pn) { const box = pn.closest(".lx-plan"); if (!box) return; box.dataset.n = pn.dataset.lxpn; planUpd(box); planSave(box); return; }
    const ps = e.target.closest("[data-lxpsim]");
    if (ps) { const box = ps.closest(".lx-plan"); if (!box) return; const P = planRead(box); box.querySelector("[data-psim]").innerHTML = LXW.planSim(P.e, P.up, P.dn, P.ev != null ? P.ev : P.wr, P.n, P.lv, P.dr, P.sd != null ? P.sd : 90, P.h); ps.textContent = "Simula di nuovo"; return; }
  });
  // bankroll: ridisegna calcolatore e rischio
  const brcUpd = box => {
    if (!box) return; let E = [500]; try { E = JSON.parse(box.dataset.e); } catch (er) {}
    const e = E[+box.querySelector("[data-lxbre]").value] || 500, plan = +box.dataset.plan || 100;
    box.querySelector("[data-bre]").textContent = e.toLocaleString("it-IT") + " €"; box.querySelector("[data-bro]").innerHTML = LXW.brcOut(e, plan);
  };
  const ruinUpd = box => { if (!box) return; box.querySelector("[data-ruo]").innerHTML = LXW.ruinOut(+box.dataset.bi, +box.dataset.wr); box.querySelector("[data-rusim]").innerHTML = ""; const b = box.querySelector("[data-lxrsim]"); if (b) b.textContent = "Simula 20 giocatori"; };
  document.addEventListener("click", e => {
    const bp = e.target.closest("[data-lxbrp]");
    if (bp) { const box = bp.closest(".lx-brc"); if (!box) return; box.dataset.plan = bp.dataset.lxbrp; box.querySelectorAll("[data-lxbrp]").forEach(b => { b.classList.toggle("on", b === bp); b.setAttribute("aria-pressed", b === bp ? "true" : "false"); }); brcUpd(box); return; }
    const rb = e.target.closest("[data-lxrbi]"), rw = e.target.closest("[data-lxrwr]");
    if (rb || rw) { const el = rb || rw, box = el.closest(".lx-ruin"); if (!box) return; const k = rb ? "lxrbi" : "lxrwr"; if (rb) box.dataset.bi = rb.dataset.lxrbi; else box.dataset.wr = rw.dataset.lxrwr; box.querySelectorAll(`[data-${k === "lxrbi" ? "lxrbi" : "lxrwr"}]`).forEach(b => b.classList.toggle("on", b === el)); ruinUpd(box); return; }
    const rs = e.target.closest("[data-lxrsim]");
    if (rs) { const box = rs.closest(".lx-ruin"); if (!box) return; const r = LXW.ruinSim(+box.dataset.bi, +box.dataset.wr); box.querySelector("[data-rusim]").innerHTML = r.html; rs.textContent = "Simula di nuovo"; return; }
  });
  document.addEventListener("input", e => { const t = e.target; if (t && t.matches && t.matches("[data-lxbre]")) brcUpd(t.closest(".lx-brc")); });
  document.addEventListener("input", e => {
    const t = e.target; if (!t || !t.matches) return;
    if (t.matches("[data-lxedge]")) edgeUpd(t.closest(".lx-edge"));
    if (t.matches("[data-lxrare]")) { const box = t.closest(".lx-rare"), h = +t.value; box.querySelector("[data-rh]").textContent = h + (h === 1 ? " ora" : " ore"); box.querySelector("[data-ro]").innerHTML = LXW.rareOut(h, +box.dataset.p); }
    if (t.matches("[data-lxbbw]")) { const box = t.closest(".lx-bbc"), w = +t.value; box.querySelector("[data-bw]").textContent = LXW.sg(w) + " bb/100"; t.setAttribute("aria-valuetext", LXW.sg(w) + " bb/100"); box.querySelector("[data-bo]").innerHTML = LXW.bbcOut(w, +box.dataset.lv || 0.02); }
  });
})();

