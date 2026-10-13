/* ================= VOTO DA 1 A 10 PER OGNI MANO IMPORTATA =================
   Ogni decisione postflop ha già un punteggio (0-100) e l'EV perso stimato. Qualità di una decisione:
   punteggio x (1 - EV perso / piatto, con un massimo di metà). Voto = 1 + 9 x media delle qualità, arrotondato. */
function hVote(h) {
  const ds = (h.dec || []).map(d => ({ d, a: hQuick(h, d) })).filter(x => x.a && x.a.sc != null);
  if (!ds.length) return null;
  const q = ds.map(({ d, a }) => (a.sc / 100) * (1 - Math.min(0.5, (a.loss || 0) / Math.max(1, d.pot || 1))));
  const v = Math.max(1, Math.min(10, Math.round(1 + 9 * q.reduce((x, y) => x + y, 0) / q.length)));
  return { v, n: ds.length, loss: Math.round(ds.reduce((x, y) => x + (y.a.loss || 0), 0) * 10) / 10, ds };
}
const hVoteTier = v => v >= 8 ? "hi" : v >= 5 ? "mid" : "lo";
const hVoteBadge = (V, hi) => V ? `<button type="button" class="hvote ${hVoteTier(V.v)}" data-hvote="${hi}" title="Vedi il voto decisione per decisione">${V.v}<small>/10</small></button>` : `<span class="hvote na" title="Nessuna decisione postflop da valutare">-</span>`;
const hVoteWord = v => v >= 9 ? "Giocata ottima" : v >= 7 ? "Giocata buona" : v >= 5 ? "Giocata con qualche imprecisione" : v >= 3 ? "Giocata con errori" : "Giocata da rivedere";
function hVoteOpen(hi) {
  const h = HANDS.hands[hi]; if (!h) return; const V = hVote(h);
  const rows = V ? V.ds.map(({ d, a }) => { const did = d.act === "bet" || d.act === "raise" ? `${actLabel(actClass(d))}${d.ratio ? ` (${Math.round(d.ratio * 100)}% del piatto)` : ""}` : actLabel(actClass(d)); const tag = a.sc >= 100 ? ["ok", "Giusta"] : a.sc > 0 ? ["mid", "Imprecisa"] : ["bad", "Errore"]; return `<div class="hvr"><span class="hvs">${HSTN[d.st]}</span><span class="hvd">Hai giocato <b>${esc(did)}</b>${a.sc >= 100 ? "" : `<small>Meglio: ${esc(a.best || "-")}${a.type && HERR[a.type] ? ` · ${esc(HERR[a.type])}` : ""}</small>`}</span><span class="hvt ${tag[0]}">${tag[1]}${a.loss ? `<small>-${fmt(a.loss, 1)}bb</small>` : ""}</span></div>`; }).join("") : "";
  gModal(`<span class="eyebrow">Voto della mano</span><h3 style="margin:4px 0 2px">${icHand(h.hero)} · ${esc(h.pos)} · ${esc(h.stakes)}</h3><p class="muted" style="font-size:12.5px;margin:0 0 10px">Mano #${esc(h.id)}</p>${V ? `<div class="hv-big ${hVoteTier(V.v)}"><b>${V.v}</b><span>/10</span><em>${hVoteWord(V.v)}</em></div><div class="hvrows">${rows}</div><p class="muted" style="font-size:12.5px;margin:10px 0 0">Il voto guarda solo le decisioni postflop (${V.n}), non il risultato della mano: si può giocare bene e perdere. EV perso stimato in tutto: ${fmt(V.loss, 1)}bb.</p>` : `<p>Questa mano non ha decisioni postflop da valutare.</p>`}`);
}
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-hvote]"); if (!b) return; e.preventDefault(); e.stopPropagation(); hVoteOpen(+b.dataset.hvote); }, true);

const HOPT = { face: [{ l: "Fold", v: "fold" }, { l: "Call", v: "call" }, { l: "Raise", v: "raise" }], free: [{ l: "Check", v: "check" }, { l: "Bet piccola (fino a 1/2)", v: "small" }, { l: "Bet media (1/2 - 3/4)", v: "mid" }, { l: "Bet grande (oltre 3/4)", v: "big" }] };
const actClass = d => d.act === "bet" ? (d.ratio <= 0.5 ? "small" : d.ratio <= 0.8 ? "mid" : "big") : d.act === "raise" ? "raise" : d.act;
const actLabel = v => [...HOPT.face, ...HOPT.free].find(o => o.v === v)?.l || v;
function hHandBuild(p, errMode) {
  const h = HANDS.hands[p.hi], d = h && h.dec[p.di];
  if (!d) throw new Error("mano assente");
  const opts = (d.toCall > 0 ? HOPT.face : HOPT.free).map(o => ({ label: o.l, v: o.v }));
  const hist = d.hist.map(l => `<div>${esc(l).replace(/^(Preflop|Flop|Turn|River):/, '<span class="st">$1:</span>').replace(/\bTu\b/g, '<span class="me">Tu</span>')}</div>`).join("");
  const hideTable = true;
  return {
    title: `${errMode ? "Errore da rifare" : "La tua mano"} · ${["Preflop", "Flop", "Turn", "River"][d.st]}`,
    body: `<p class="ctx">Mano #${esc(h.id)} · ${esc(h.stakes)} · sei <b>${esc(h.pos)}</b>${errMode && d.an && d.an.type ? ` · <span class="pill bad">${esc(HERR[d.an.type] || "errore")}</span>` : ""}</p>` + tableHtml([{ lbl: "Board", cards: d.board }, { hero: 1, lbl: "La tua mano", cards: h.hero }]) +
      `<div class="potviz"><div class="pv k-pot"><span>Piatto</span><b>${bb(d.pot)}</b></div>${d.toCall > 0 ? `<div class="pv bet"><span>Da chiamare</span><b>${bb(d.toCall)}</b></div>` : ""}<div class="pv"><span>Il tuo stack</span><b>${bb(d.stack)}</b></div></div><div class="hh">${hist}</div>` +
      `<label for="htarget" style="font-weight:600;font-size:14px">Il tuo bersaglio (facoltativo): chi vuoi far chiamare o foldare?</label><input type="text" id="htarget" placeholder="es. voglio che paghino le overpair e i set" style="margin:6px 0 12px">`,
    layout: "cols2", opts, timed: false,
    check(v) {
      const tgt = ($("#htarget")?.value || "").trim();
      if ($("#htarget")) $("#htarget").disabled = true;
      let A = null; try { A = hAnalyze(h, d, 220); } catch (e) { console.error(e); }
      run.lastHand = { h, d, v, tgt, A };
      const ai = sample ? `<div style="margin-top:10px"><button class="btn" id="aiBtn">Chiedi anche a Claude</button> <span class="muted" style="font-size:13px">Usa il tuo utilizzo di Claude.</span><div id="aiOut"></div></div>` : "";
      if (!A) return { score: null, correct: null, expl: `<p>Hai scelto <b>${actLabel(v)}</b>. Al tavolo hai giocato <b>${actLabel(actClass(d))}</b>.</p><p class="muted">Non riesco a ricostruire l'avversario di questa mano.</p>${ai}` };
      const r = hReportHtml(h, d, A, v);
      d.an = { v: AV, sc: r.tj.sc, type: r.tj.type || null, loss: Math.round(r.tj.loss * 10) / 10, best: A.best.l, st: d.st, strat: !!A.strat };
      if (errMode && r.uj.sc >= 100) { d.fixed = today(); }
      persistHandsSoon();
      return { score: r.uj.sc, correct: A.bestK, expl: (tgt ? `<p class="hint">Il tuo bersaglio: <b>${esc(tgt)}</b>. Confrontalo con chi paga e chi folda qui sotto.</p>` : "") + r.html + ai };
    },
    after() { const b = $("#aiBtn"); if (b) b.onclick = () => analyzeHand(); const sv = $("#svVerdict"); if (sv) svHandVerdict(h, d, sv); const gs = $("#gwOpenSt"); if (gs) gs.onclick = () => { const cfg = svFromHandSt(h, d); if (!cfg) { gs.textContent = "Non riesco a ricostruire lo spot"; return; } const o = cfg.vname ? Object.values(OPPS).find(x => x.name === cfg.vname) : null; if (run) { run = null; } gwOpenHand(cfg, o ? "opp:" + oppSlug(o.name) : null); }; const gp = $("#gwProbSt"); if (gp) gp.onclick = () => { const cfg = svFromHandSt(h, d); if (!cfg) { gp.textContent = "Non riesco a ricostruire lo spot"; return; } const o = cfg.vname ? Object.values(OPPS).find(x => x.name === cfg.vname) : null; if (run) { run = null; } gwHandProblem(cfg, o ? "opp:" + oppSlug(o.name) : null); }; },
  };
}
let phT = null; function persistHandsSoon() { clearTimeout(phT); phT = setTimeout(persistHands, 1500); }
DRILLS.hands = {
  name: "Le tue mani", short: "Mani tue", time: 60,
  desc: "Rivedi le decisioni delle tue mani importate: ricostruisco il range avversario, ti dico chi paga e chi folda a ogni size e dove hai sbagliato bersaglio.",
  rule: "Prima di vedere cosa hai fatto, decidi di nuovo e scrivi il bersaglio: chi volevi far chiamare o foldare? Poi confronta con il range ricostruito e con la tua strategia.",
  avail: () => HANDS.hands.some(h => h.dec && h.dec.length),
  sample(ctx) {
    ctx.hBag = ctx.hBag && ctx.hBag.length ? ctx.hBag : shuffle(HANDS.hands.flatMap((h, hi) => (h.dec || []).map((d, di) => ({ hi, di }))));
    return ctx.hBag.pop() || null;
  },
  build(p) { return hHandBuild(p, false); },
};
function hErrList(filter) {
  const out = [];
  HANDS.hands.forEach((h, hi) => (h.dec || []).forEach((d, di) => { const a = d.an; if (a && a.v === AV && a.sc != null && a.sc < 100 && !d.fixed && (!filter || a.type === filter)) out.push({ hi, di, a, h, d }); }));
  return out;
}
DRILLS.herr = {
  name: "Errori delle tue mani", short: "Errori mani", time: 60,
  desc: "Solo le decisioni che al tavolo hai sbagliato, secondo l'analisi del range. Rifalle finché le giochi giuste.",
  rule: "Sono spot che al tavolo hai giocato male. Decidi di nuovo pensando al bersaglio: chi paga e chi folda a questa size?",
  avail: () => hErrList().length > 0,
  sample(ctx) {
    ctx.eBag = ctx.eBag || shuffle(hErrList(ctx.opt && ctx.opt.type).map(x => ({ hi: x.hi, di: x.di })));
    return ctx.eBag.pop() || null;
  },
  build(p) { const q = hHandBuild(p, true); q.skill = "hands"; return q; },
};
async function analyzeHand() {
  const L = run.lastHand; if (!L || !sample) return;
  const btn = $("#aiBtn"); btn.disabled = true; btn.textContent = "Analisi in corso...";
  const { h, d, v, tgt, A } = L;
  const loc = A ? `Analisi del modello locale: range di ${A.g.vpos} = ${A.pr.src}; restringimento: ${A.steps.map(s => s.l + " → " + Math.round(s.n) + " combo").join("; ")}. Hero è dietro a ${pct(A.beat)}% del range, avanti a ${pct(A.win)}%. Linea migliore secondo il modello: ${A.best.l}.${A.strat ? ` Strategia personale di Hero per questo spot (${A.strat.src}): ${A.strat.txt} Size del piano: ${A.strat.acts.map(a => pct(a.s) + "%").join(", ") || "check"}. Rispetta questa strategia: non proporre size diverse da quelle del piano.` : ""}` : "";
  const prompt = `Sei un coach di poker No Limit Hold'em cash 6-max, micro limiti (NL10-NL50), esperto di targetizzazione del range. Analizza questa decisione del giocatore (Hero).
Mano: ${h.stakes}. Hero in ${h.pos} con ${h.hero}. Board attuale: ${d.board || "(preflop)"}.
Azioni fino a qui (bb = big blind):
${d.hist.join("\n")}
Piatto ${fmt(d.pot, 1)}bb, da chiamare ${fmt(d.toCall, 1)}bb, stack Hero ${fmt(d.stack, 1)}bb.
Opzioni: ${(d.toCall > 0 ? HOPT.face : HOPT.free).map(o => o.l).join(", ")}.
Scelta di Hero ora, rivedendo la mano: "${actLabel(v)}". Bersaglio dichiarato: "${tgt || "nessuno"}". Al tavolo aveva giocato: "${actLabel(actClass(d))}"${d.act === "bet" || d.act === "raise" ? ` (${fmt(d.amt, 1)}bb, ${pct(d.ratio)}% del piatto)` : ""}.
${loc}
Strategia di Hero al flop SRP BTN vs BB (dal suo trainer): K/Q/J-high 30% range, AKx e AQx overbet 120% mix, A-high tripla broadway 30%, A-high scala bassa check, paired 25% range, board a scala mix 50%, T-high o meno mix 75%, monotone 1bb. Turn dopo c-bet piccola chiamata: blank 150%, carte che chiudono progetti 75%. Il field overfolda contro i barrel grandi e underfolda nei 3-bet pot IP.
Rispondi in italiano, frasi brevi e concrete, senza trattini lunghi. Rispondi SOLO con JSON: {"migliore": una delle opzioni esatte, "bersaglio": "quali mani del range avversario colpisce la linea migliore", "errore": "l'errore di targetizzazione fatto al tavolo, o 'nessuno'", "spiegazione": "2-4 frasi"}`;
  try {
    const r = await sample.json(prompt, { modelTier: "default" });
    $("#aiOut").innerHTML = `<div class="ai"><h4>Parere di Claude</h4><p><b>Migliore:</b> ${esc(r.migliore)}</p><p><b>Bersaglio:</b> ${esc(r.bersaglio)}</p><p><b>Errore al tavolo:</b> ${esc(r.errore)}</p><p style="margin:0">${esc(r.spiegazione)}</p></div>`;
    btn.remove();
  } catch (e) {
    btn.disabled = false; btn.textContent = "Chiedi anche a Claude";
    $("#aiOut").innerHTML = `<p class="muted">${e && e.code === "not_granted" ? "Analisi non autorizzata: puoi abilitarla dal prompt della pagina." : e && e.code === "rate_limited" ? "Troppe richieste ravvicinate: riprova tra qualche minuto." : "Analisi non riuscita, riprova."}</p>`;
    if (e && e.code === "not_granted") { sample = null; btn.remove(); }
  }
}

/* ---- ripasso ---- */
DRILLS.review = {
  name: "Ripasso errori", short: "Ripasso", time: 35,
  desc: "Gli esercizi che hai sbagliato tornano dopo 1, 3, 7 e 14 giorni finché non li risolvi.",
  rule: "Sono domande che hai già sbagliato. Rispondi senza fretta: una risposta corretta le allontana, un errore le riporta a domani.",
  sample(ctx) { const o = ctx.opt || {}; ctx.revBag = ctx.revBag || shuffle(o.all ? S.review.filter(r => !o.d || r.d === o.d) : reviewDue()); let it = ctx.revBag.pop(); while (it && !S.review.find(r => r.key === it.key)) it = ctx.revBag.pop(); return it ? { key: it.key } : null; },
  build(p) {
    const it = S.review.find(r => r.key === p.key);
    const q = DRILLS[it.d].build(it.p);
    q.title = "Ripasso · " + DRILLS[it.d].short + " · " + q.title;
    q.reviewItem = it; q.skill = it.d;
    return q;
  },
};

