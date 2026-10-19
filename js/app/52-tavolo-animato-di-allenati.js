/* ================= TAVOLO ANIMATO DI ALLENATI ================= */
/* grafica originale di Orca School Poker: sedie attorno al panno, fiches che si muovono, stelle, combo e il coach Orki */
const GW_AVS = ["🦊", "🐻", "🦉", "🐺", "🦁", "🐯", "🐸", "🐼", "🦈", "🐙", "🦅", "🐲"];
const GW_AVC = ["#e67e22", "#8e5a3c", "#6c5ce7", "#546e7a", "#d4a017", "#e17055", "#27ae60", "#34495e", "#0984e3", "#b33771", "#795548", "#16a085"];
const gwHashN = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
/* avversari: animali acquatici (66-avatar-acquatici.js); le emoji restano solo come riserva */
const gwAv = (nm, big) => { if (typeof aqAvatar === "function") return aqAvatar(nm, big); const k = gwHashN(nm) % GW_AVS.length; return `<span class="gwav${big ? " big" : ""}" style="--ac:${GW_AVC[k]}">${GW_AVS[k]}</span>`; };
const gwStarsOf = g => 5 - Math.min(4, g);
const gwStarsHtml = (n, cls) => `<span class="gwstars ${cls || ""}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? "on" : ""}" style="--d:${i * 70}ms">★</i>`).join("")}</span>`;
const GW_RATE = ["Perfetta!", "Ottima", "Imprecisa", "Sbagliata", "Errore grave"];
/* sedie del 6-max: la tua è sempre in basso al centro */
const GW_SEATXY = [[50, 101], [5, 74], [11, 14], [50, -3], [89, 14], [95, 74]];
function gwSeats(names, hero) {
  const pos = names.map(n => String(n).toUpperCase());
  if (!pos.every(p => PF_POS.includes(p))) return null;
  const hi = PF_POS.indexOf(pos[hero]);
  return PF_POS.map((p, k) => ({ pos: p, slot: (k - hi + 6) % 6 }));
}
/* storia della mano: azioni per street, con le stelle sulle tue decisioni */
function gwHandLog(PR, H, names, upto) {
  const E = H.L.E, G = E.G, out = []; let n = E.tree.root, hi = H.h0 || 0, sInv = [0, 0];
  const hs = PR.hist, steps = H.steps.slice(0, upto == null ? H.steps.length : upto);
  out.push({ st: G.board.length, cards: G.board.slice() });
  for (const k of steps) {
    if (n.t === "c") { out.push({ st: n.st, cards: [n.deal[k]] }); n = n.ch[k]; sInv = n.inv ? n.inv.slice() : sInv; continue; }
    if (n.t !== "a") break;
    const a = n.acts[k], me = n.pl === H.hero, e = { who: names[n.pl], lab: gwLab(a, E, n), kind: a.kind, me };
    if (me && hi < hs.length) e.grade = hs[hi++].grade;
    out.push(e); n = n.ch[k];
  }
  return { log: out, node: n, sInv };
}
function gwLogHtml(L) {
  let h = "", first = true;
  for (const e of L) {
    if (e.cards) { h += `${first ? "" : `<span class="gwlg-sep"></span>`}<span class="gwlg-st"><b>${["", "", "", "FLOP", "TURN", "RIVER"][e.st]}</b>${e.cards.map(c => gwCardI(c)).join("")}</span>`; first = false; continue; }
    h += `<span class="gwlg-a ${e.me ? "me" : ""} k-${e.kind}"><i>${esc(e.me ? "Tu" : e.who)}</i>${esc(e.lab)}${e.grade != null ? gwStarsHtml(gwStarsOf(e.grade), "sm") : ""}</span>`;
  }
  return `<div class="gwlog">${h}</div>`;
}
/* spiegazione del coach, costruita dalle frequenze e dagli EV del solver */
function gwCoachText(H, hc) {
  const F = H.fb; if (!F) return "";
  const rows = F.rows.slice(), best = rows.reduce((b, r) => r.ev > b.ev ? r : b, rows[0]), mine = rows.filter(r => r.mine), freqTop = rows.reduce((b, r) => r.f > b.f ? r : b, rows[0]);
  const cards = hc.map(hcstr).join(" ");
  const mix = rows.filter(r => r.f > 0.1).map(r => `${r.lab} ${Math.round(r.f * 100)}%`).join(", ");
  let t = F.grade <= 1 ? `Bene! Con ${cards} ${mine.map(r => r.lab).join(" e ")} è ${F.grade === 0 ? "la scelta migliore" : "una buona scelta"}. ` : `Con ${cards} qui il solver preferisce ${best.lab}. `;
  t += rows.filter(r => r.f > 0.1).length > 1 ? `La strategia è mista: ${mix}. ` : `Il solver gioca ${freqTop.lab} quasi sempre. `;
  if (F.grade > 1) t += `La tua scelta costa ${fmt(F.loss, 2)}bb, cioè il ${fmt(F.lossPot * 100, 1)}% del piatto. `;
  const ev2 = rows.slice().sort((a, b) => b.ev - a.ev);
  if (ev2.length > 1) t += ev2[0].ev - ev2[1].ev < 0.1 ? `${ev2[0].lab} e ${ev2[1].lab} valgono quasi lo stesso: qui puoi mescolare senza perdere EV.` : `${ev2[0].lab} vale ${fmt(ev2[0].ev - ev2[1].ev, 2)}bb più di ${ev2[1].lab}.`;
  return t;
}
function gwComboBar(PR) {
  const c = PR.combo || 0, m = Math.min(5, 1 + Math.floor(c / 5)), left = m >= 5 ? 0 : 5 - (c % 5);
  return `<div class="gwcombo-bar"><span>${m >= 5 ? "Bonus massimo 5X attivo" : `<b>${left}</b> ${left === 1 ? "giocata perfetta" : "giocate perfette"} al bonus <b>${m + 1}X</b>`}</span><div class="gwmult">${[1, 2, 3, 4, 5].map(k => `<i class="${k <= m ? "on" : ""} ${k === m ? "cur" : ""}">${k}X</i>`).join("")}<em style="width:${m >= 5 ? 100 : ((m - 1) * 25 + (c % 5) / 5 * 25)}%"></em></div></div>`;
}
/* tavolo completo */
function gwPracTable(PR, H, L, names, shown) {
  const E = L.E, G = E.G, hero = H.hero, vil = 1 - hero, live = shown >= H.steps.length;
  const { log, node: n, sInv } = gwHandLog(PR, H, names, shown);
  /* chi sta per agire mentre il replayer scorre le azioni */
  let nextNode = null; if (!live) { nextNode = n.t === "a" ? n : null; }
  const bd = [...G.board, ...(n.cards || [])], inv = n.inv || [0, 0], pot = E.o.pot + inv[0] + inv[1];
  const A = PR.anim || {}, newHand = A.H !== H, newStep = !newHand && A.steps !== shown, newCards = newHand ? bd.length : Math.max(0, bd.length - (A.bd || 0)), newFb = !!H.fb && !A.fb && live, potUp = !newHand && A.pot != null && A.pot !== E.o.pot + (n.inv ? n.inv[0] + n.inv[1] : 0);
  PR.anim = { H, steps: shown, bd: bd.length, fb: !!H.fb && live, pot: E.o.pot + (n.inv ? n.inv[0] + n.inv[1] : 0) };
  const done = live ? H.done : null;
  const facing = inv[vil] - inv[hero], stv = E.o.stack - inv[vil], sth = E.o.stack - inv[hero];
  const hc = [G.c0[hero][H.h], G.c1[hero][H.h]], vc = [G.c0[vil][H.v], G.c1[vil][H.v]];
  const showV = done && done.type !== "fold";
  const lastV = [...log].reverse().find(e => e.who && !e.me);
  const lastE = log[log.length - 1];
  const vFold = (done && done.type === "fold" && done.heroWins) || (n.t === "f" && n.folder === vil), hFold = (done && done.type === "fold" && !done.heroWins) || (n.t === "f" && n.folder === hero);
  const seats = gwSeats(names, hero);
  const slotOf = p => seats ? seats.find(s => s.pos === String(names[p]).toUpperCase()).slot : p === hero ? 0 : 3;
  const bet = p => Math.max(0, inv[p] - (sInv[p] || 0));
  let h = gwLogHtml(log);
  const X = PR.coins || 0;
  h += `<div class="gwhud"><span title="Giocate perfette di fila">🔥 <b>${PR.combo || 0}</b></span><span title="Mosse perfette nella sessione">💯 <b>${PR.st.grades[0]}</b></span><span title="Mani giocate">🃏 <b>${PR.st.hands}</b></span><span class="gwxp" title="XP guadagnati in questa sessione">⭐ <b>${X}</b>${PR.lastXp && newFb ? `<em class="gwfloat">+${PR.lastXp}</em>` : ""}</span><span class="gwcoins ${(PR.brSess || 0) < 0 ? "neg" : ""}" title="Fiches vinte o perse in questa sessione">${GIC.chip} <b>${(PR.brSess || 0) < 0 ? "−" : ""}${fmtFi(Math.abs(PR.brSess || 0))}</b>${PR.lastBr && newFb ? `<em class="gwfloat ${PR.lastBr < 0 ? "neg" : ""}">${fiSign(PR.lastBr)}${fmtFi(Math.abs(PR.lastBr))}</em>` : ""}</span></div>`;
  h += `<div class="gwtbl2"><div class="gwfelt2"><div class="gwrail"></div>`;
  /* sedie */
  const seatHtml = (slot, nm, stack, opts) => { const [x, y] = GW_SEATXY[slot]; return `<div class="gwseat2 ${opts.cls || ""}" data-slot="${slot}" style="left:${x}%;top:${y}%">${opts.cards || ""}<div class="gwplate">${opts.av}<div><b>${esc(nm)}</b><span>${stack}</span></div></div>${opts.think ? `<div class="gwthink"><i></i></div>` : ""}${opts.extra || ""}</div>`; };
  if (seats) seats.forEach(s => { if (s.slot === 0 || s.pos === String(names[vil]).toUpperCase()) return; h += seatHtml(s.slot, s.pos, "fold", { cls: "folded", av: gwAv(s.pos) }); });
  const vs = slotOf(vil), hs = slotOf(hero);
  const vCards = showV ? `<div class="gwhc2 gwflipin">${vc.map(c => gwCardI(c, true)).join("")}</div>` : vFold ? "" : `<div class="gwhc2 back" ${newHand ? `data-anim="deal" data-i="1"` : ""}><i></i><i></i></div>`;
  const lastIsV = lastV && lastE === lastV;
  h += seatHtml(vs, names[vil], vFold ? "fold" : fmtN(stv) + "bb", { cls: `vil ${(n.t === "a" && n.pl === vil) || (nextNode && nextNode.pl === vil) ? "act" : ""} ${vFold ? "folded" : ""}`, av: gwAv(names[vil], true), cards: vCards, think: nextNode && nextNode.pl === vil, extra: lastIsV && !done ? `<div class="gwbub2 k-${lastV.kind} ${newStep ? "pop" : ""}">${esc(lastV.lab)}</div>` : "" });
  const fire = (PR.combo || 0) >= 3 ? " fire" : "", lastH = [...log].reverse().find(e => e.me);
  h += seatHtml(hs, "Tu · " + names[hero], hFold ? "fold" : fmtN(sth) + "bb", { cls: `hero${fire} ${(n.t === "a" && n.pl === hero && !done && live) || (nextNode && nextNode.pl === hero) ? "act" : ""} ${hFold ? "folded" : ""}`, av: gMascot(H.fb && live ? (H.fb.grade <= 1 ? "wow" : "sad") : "happy", 44), think: nextNode && nextNode.pl === hero, cards: `<div class="gwhc2" ${newHand ? `data-anim="deal" data-i="0"` : ""}>${hc.map(c => gwCardI(c, true)).join("")}</div>`, extra: !live && lastH && lastE === lastH ? `<div class="gwbub2 k-${lastH.kind} ${newStep ? "pop" : ""}">${esc(lastH.lab)}</div>` : "" });
  /* fiches puntate in questa street: partono dalla sedia e scivolano sul panno */
  [hero, vil].forEach(p => { const b = bet(p); if (b <= 0.001 || done) return; const sl = slotOf(p), [x, y] = GW_SEATXY[sl], cx = x + (50 - x) * 0.34, cy = y + (50 - y) * 0.36, fresh = newStep && lastE && lastE.who && ((lastE.me && p === hero) || (!lastE.me && p === vil)); h += `<div class="gwbet2" ${fresh ? `data-anim="chip" data-slot="${sl}"` : ""} style="left:${cx}%;top:${cy}%"><span class="gwchips"><i></i><i></i><i></i></span><b>${fmtN(b)}</b></div>`; });
  /* dealer */
  if (seats) { const btn = seats.find(s => s.pos === "BTN"); if (btn) { const [x, y] = GW_SEATXY[btn.slot]; h += `<span class="gwdealer" style="left:${x + (50 - x) * 0.2}%;top:${y + (50 - y) * 0.26}%">D</span>`; } }
  /* centro: board e piatto */
  h += `<div class="gwmid2"><span class="gwpotpill ${potUp ? "bump" : ""}">Piatto <b>${fmtN(pot)}bb</b></span><div class="gwboard2">${bd.map((c, i) => `<span class="${i >= bd.length - newCards ? "gwflipin" : ""}" style="--d:${(i - (bd.length - newCards)) * 120}ms">${gwCardI(c, true)}</span>`).join("")}</div>${facing > 0 && !done && live && !H.fb ? `<span class="gwtocall">${fmtN(facing)}bb da chiamare</span>` : ""}</div>`;
  /* voto */
  if (H.fb && live) { const g = H.fb.grade, col = GW_GRADE[g][2]; h += `<div class="gwrate ${newFb ? "pop" : ""}" style="--rc:${col}">${gwStarsHtml(gwStarsOf(g), newFb ? "anim" : "")}<b>${GW_RATE[g]}</b>${H.fb.loss > 0.004 ? `<span>-${fmt(H.fb.loss, 2)}bb</span>` : ""}</div>`; }
  h += `</div></div>`;
  h += gwComboBar(PR);
  return { html: h, hc, newFb };
}
/* coach con il testo che si scrive da solo */
function gwCoachHtml(H, hc) {
  if (!H || !H.fb) return "";
  const t = gwCoachText(H, hc), mood = H.fb.grade <= 1 ? "wow" : H.fb.grade >= 3 ? "sad" : "think";
  return `<div class="gwcoach"><div class="gwcoach-av">${gMascot(mood, 54)}<small>Coach Orki</small></div><p class="gwcoach-t" data-tw="${esc(t)}">${esc(t)}</p></div>`;
}
function gwTypewriter() {
  const el = document.querySelector(".gwcoach-t[data-tw]"); if (!el) return;
  const t = el.dataset.tw, PR = GW.prac; if (!PR) return;
  if (PR.twDone === t) { el.textContent = t; return; }
  PR.twDone = t; let i = 0; el.textContent = ""; el.classList.add("typing");
  const step = () => { if (!document.body.contains(el)) return; i = Math.min(t.length, i + 3); el.textContent = t.slice(0, i); if (i < t.length) setTimeout(step, 16); else el.classList.remove("typing"); };
  step();
}

/* animazioni FLIP: carte e fiches partono dal centro o dalla sedia e arrivano al loro posto */
function gwTableAnim() {
  const felt = document.querySelector(".gwfelt2"); if (!felt) return;
  const fr = felt.getBoundingClientRect(), cx = fr.left + fr.width / 2, cy = fr.top + fr.height * 0.42;
  document.querySelectorAll(".gwfelt2 [data-anim]").forEach(el => {
    const r = el.getBoundingClientRect(); let fx = cx, fy = cy;
    if (el.dataset.anim === "chip") { const s = felt.querySelector(`.gwseat2[data-slot="${el.dataset.slot}"] .gwplate`); if (s) { const q = s.getBoundingClientRect(); fx = q.left + q.width / 2; fy = q.top + q.height / 2; } }
    const dx = fx - (r.left + r.width / 2), dy = fy - (r.top + r.height / 2), d = (+el.dataset.i || 0) * 140;
    el.style.transition = "none"; el.style.transform = `translate(${dx}px,${dy}px) scale(${el.dataset.anim === "chip" ? 0.7 : 0.35}) rotate(${el.dataset.anim === "deal" ? -25 : 0}deg)`; el.style.opacity = "0";
    el.getBoundingClientRect();
    requestAnimationFrame(() => { el.style.transition = `transform .5s cubic-bezier(.2,.85,.25,1) ${d}ms, opacity .2s ${d}ms`; el.style.transform = ""; el.style.opacity = ""; });
    el.removeAttribute("data-anim");
  });
}
/* riepilogo a fine mano */
function gwHandSummary(PR, H) {
  const hs = PR.hist.slice(H.h0 || 0); if (!hs.length) return "";
  const avg = hs.reduce((s, x) => s + gwStarsOf(x.grade), 0) / hs.length, stars = Math.round(avg), perfect = hs.every(x => x.grade === 0), loss = hs.reduce((s, x) => s + x.loss, 0);
  const msg = perfect ? ["Bel lavoro!", "Gioco impeccabile dall'inizio alla fine."] : stars >= 4 ? ["Buona mano", "Qualche decisione migliorabile, niente di grave."] : stars >= 3 ? ["Si può fare meglio", "Guarda il coach sulle decisioni con meno stelle."] : ["Mano da rivedere", "Rigiocala: gli errori entrano anche nel ripasso."];
  return `<div class="gwsum ${perfect ? "perfect" : ""}"><div class="gwsum-b">${gwStarsHtml(stars, "anim")}<b>${Math.round(avg / 5 * 100)}</b></div><div><b>${msg[0]}</b><p>${msg[1]}${loss > 0.004 ? ` EV perso nella mano: ${fmt(loss, 2)}bb.` : ""}</p></div></div>`;
}

