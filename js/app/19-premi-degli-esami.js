/* ================= PREMI DEGLI ESAMI =================
   Ogni esame superato la prima volta: un trofeo da collezione, XP bonus e un nuovo dorso per le carte dei minigiochi.
   NL1000 è il maxi premio: l'Orca d'oro, 10.000 XP, il dorso e il tavolo d'oro e il diploma da scaricare. */
const PRIZES = {
  nl2: { xp: 200, t: "Trofeo NL2", back: "blu", bn: "Blu notte" },
  nl5: { xp: 300, t: "Trofeo NL5", back: "verde", bn: "Verde tavolo" },
  nl10: { xp: 400, t: "Trofeo NL10", back: "viola", bn: "Viola" },
  nl25: { xp: 500, t: "Trofeo NL25", back: "carbonio", bn: "Carbonio" },
  nl50: { xp: 750, t: "Trofeo NL50", back: "oceano", bn: "Oceano" },
  nl100: { xp: 1000, t: "Trofeo NL100", back: "rubino", bn: "Rubino" },
  nl200: { xp: 1500, t: "Trofeo NL200", back: "smeraldo", bn: "Smeraldo" },
  nl500: { xp: 2500, t: "Trofeo NL500", back: "notte", bn: "Notte stellata" },
  nl1000: { xp: 10000, t: "Orca d'oro", back: "oro", bn: "Oro", maxi: true },
};
const BACKS = [["rosso", "Rosso classico"], ...Object.values(PRIZES).map(p => [p.back, p.bn]), ["texas", "Texas Dolly"]];
const prizeHas = id => !!((S.prizes || {})[id]);
const backOk = b => b === "rosso" || (b === "texas" && typeof eggHas === "function" && eggHas("brunson")) || Object.entries(PRIZES).some(([id, p]) => p.back === b && prizeHas(id));
const curBack = () => backOk(S.back) ? S.back : "rosso";
const goldFelt = () => prizeHas("nl1000") && S.felt === "oro";
/* assegna il premio una sola volta per livello: restituisce l'id del livello se è nuovo */
function prizeAward(L) {
  const P = PRIZES[L.id]; if (!P || prizeHas(L.id)) return null;
  S.prizes = { ...(S.prizes || {}), [L.id]: today() }; S.prizeN = { ...(S.prizeN || {}), [L.id]: 1 };
  try { gAddXP(P.xp); } catch (e) {}
  if (P.back) S.back = P.back;
  if (P.maxi) S.felt = "oro";
  persist();
  return L.id;
}
/* ogni esame superato dopo il primo: una medaglia in più per quel livello e il 25% degli XP del premio (NL1000: 2.500) */
function prizeRepeat(L) {
  const P = PRIZES[L.id]; if (!P || !prizeHas(L.id)) return null;
  const n = ((S.prizeN || {})[L.id] || 1) + 1, xp = Math.round(P.xp * 0.25);
  S.prizeN = { ...(S.prizeN || {}), [L.id]: n };
  try { gAddXP(xp); } catch (e) {}
  persist();
  return { id: L.id, n, xp };
}
function prizeRepeatHtml(r) {
  const L = LEVELS.find(x => x.id === r.id), P = PRIZES[r.id]; if (!L || !P) return "";
  return `<div class="prize${P.maxi ? " maxi" : ""}"><span class="prize-eye">${P.maxi ? "Maxi premio, di nuovo" : "Esame superato di nuovo"}</span>${trophyChip(L, true, P.maxi ? 100 : 80)}<h2>${P.t} ×${r.n}</h2><ul class="prize-list"><li><b>+${fmt(r.xp)} XP</b></li><li>Medaglia n° <b>${r.n}</b> di ${L.stake} nella bacheca dei trofei</li></ul></div>`;
}
const trophyChip = (L, on, sz) => `<span class="trophy ${on ? "on" : "off"} ${PRIZES[L.id] && PRIZES[L.id].maxi ? "maxi" : ""}" style="--c:${L.col};--ink:${L.ink};--sz:${sz || 64}px"><i class="tr-cup"></i><b>${L.stake.replace("NL", "")}</b></span>`;
function prizeHtml(id) {
  const L = LEVELS.find(x => x.id === id), P = PRIZES[id]; if (!L || !P) return "";
  if (P.maxi) return `<div class="prize maxi"><span class="prize-eye">Maxi premio</span>${trophyChip(L, true, 120)}<h2>${P.t}</h2><p>Hai superato l'esame NL1000 e completato la scalata, da zero al limite più alto del percorso.</p><ul class="prize-list"><li><b>+${fmt(P.xp)} XP</b></li><li>Dorso delle carte <b>Oro</b> e tavolo <b>d'oro</b> nei minigiochi</li><li>Il <b>diploma Orca School Poker</b> da scaricare</li></ul><button class="btn primary" data-diploma="1">Scarica il diploma</button> <button class="btn ghost" data-tab="progress">Vedi la bacheca</button></div>`;
  return `<div class="prize"><span class="prize-eye">Premio sbloccato</span>${trophyChip(L, true, 92)}<h2>${P.t}</h2><ul class="prize-list"><li><b>+${fmt(P.xp)} XP</b></li><li>Nuovo dorso delle carte: <b>${P.bn}</b> ${aofBack(P.back)}</li></ul><p class="muted" style="font-size:13px;margin:6px 0 0">Lo trovi nella bacheca dei trofei, nella scheda Progressi.</p></div>`;
}
/* bacheca nella scheda Progressi */
function trophyCase() {
  const TLV = LEVELS.filter(L => PRIZES[L.id]), got = TLV.filter(L => prizeHas(L.id)).length;
  let h = `<section class="panel tcase" style="margin-top:16px"><div class="eyebrow">Bacheca dei trofei</div><h3 style="margin:4px 0 8px">${got} trofei su ${TLV.length}</h3><div class="tgrid">${TLV.map(L => { const on = prizeHas(L.id), P = PRIZES[L.id]; return `<div class="tcell ${on ? "on" : ""} ${P.maxi ? "maxi" : ""}">${trophyChip(L, on, P.maxi ? 78 : 60)}<b>${P.t}${on && ((S.prizeN || {})[L.id] || 1) > 1 ? ` <em class="tcount">×${S.prizeN[L.id]}</em>` : ""}</b><small>${on ? `Vinto il ${S.prizes[L.id].split("-").reverse().join("/")}` : `Supera l'esame ${L.stake}`}</small></div>`; }).join("")}</div>`;
  h += `<div class="tbacks"><span class="eyebrow">Dorso delle carte nei minigiochi</span><div class="tbk">${BACKS.map(([b, n]) => { const ok = backOk(b); return `<button class="tbk-b ${curBack() === b ? "on" : ""}" ${ok ? `data-back="${b}"` : "disabled"} title="${esc(n)}${ok ? "" : " (da sbloccare)"}">${aofBack(b)}<small>${ok ? esc(n) : "Bloccato"}</small></button>`; }).join("")}</div></div>`;
  if (prizeHas("nl1000")) h += `<div class="tbacks"><span class="eyebrow">Tavolo dei minigiochi</span><div class="tbk"><button class="tbk-b ${!goldFelt() ? "on" : ""}" data-felt="verde"><span class="tfelt"></span><small>Verde</small></button><button class="tbk-b ${goldFelt() ? "on" : ""}" data-felt="oro"><span class="tfelt oro"></span><small>Oro</small></button></div><p style="margin:10px 0 0"><button class="btn primary" data-diploma="1">Scarica il diploma</button></p></div>`;
  if (typeof collHtml === "function") h += collHtml();
  h += eggHall();
  return h + `</section>`;
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-back]"); if (b) { S.back = b.dataset.back; persistSoon(); if (tab === "progress" && !run) renderProgress(); return; }
  const f = e.target.closest && e.target.closest("button[data-felt]"); if (f) { S.felt = f.dataset.felt; persistSoon(); if (tab === "progress" && !run) renderProgress(); return; }
  const d = e.target.closest && e.target.closest("[data-diploma]"); if (d) { e.preventDefault(); diplomaOpen(); }
});
/* diploma: chiede il nome e crea un PNG */
function diplomaOpen() {
  if (!prizeHas("nl1000")) return;
  gModal(`<span class="eyebrow">Diploma</span><h3 style="margin:4px 0 8px">Il tuo diploma Orca School Poker</h3><p class="muted" style="font-size:14px;margin:0 0 10px">Scrivi il nome da stampare sul diploma.</p><input type="text" id="dipName" maxlength="40" value="${esc(S.dipName || S.nick || "")}" placeholder="Nome e cognome" style="width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:9px 12px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink)"><p style="margin:12px 0 0"><button class="btn primary" id="dipGo">Scarica il PNG</button> <span class="muted" id="dipMsg" style="font-size:13px"></span></p>`, (m, close) => {
    const inp = m.querySelector("#dipName"); inp.focus();
    inp.addEventListener("keydown", ev => { ev.stopPropagation(); if (ev.key === "Enter") m.querySelector("#dipGo").click(); });
    m.querySelector("#dipGo").onclick = async () => {
      const nm = inp.value.replace(/\s+/g, " ").trim().slice(0, 40), msg = m.querySelector("#dipMsg");
      if (!nm) { msg.textContent = "Scrivi un nome."; return; }
      S.dipName = nm; persistSoon(); msg.textContent = "Preparo il diploma...";
      try { const blob = await diplomaPng(nm); const ok = await diplomaSave(blob); msg.textContent = ok ? "Fatto." : "Download annullato."; if (ok) setTimeout(close, 700); } catch (er) { msg.textContent = "Non sono riuscito a creare il diploma."; }
    };
  });
}
function diplomaPng(name) {
  return new Promise((res, rej) => {
    const W = 1600, H = 1130, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0e1a2b"); g.addColorStop(1, "#162a40"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.strokeStyle = "#d9a520"; x.lineWidth = 10; x.strokeRect(40, 40, W - 80, H - 80); x.lineWidth = 2; x.strokeRect(62, 62, W - 124, H - 124);
    const ctr = (t, y, font, col) => { x.font = font; x.fillStyle = col; x.textAlign = "center"; x.fillText(t, W / 2, y); };
    ctr("ORCA SCHOOL POKER", 190, "700 44px Georgia, 'Times New Roman', serif", "#d9a520");
    ctr("Diploma", 310, "italic 700 110px Georgia, 'Times New Roman', serif", "#ffffff");
    ctr("si certifica che", 400, "32px Georgia, 'Times New Roman', serif", "#c8d2de");
    let fs = 92; x.font = `700 ${fs}px Georgia, serif`; while (x.measureText(name).width > W - 360 && fs > 40) { fs -= 4; x.font = `700 ${fs}px Georgia, serif`; }
    ctr(name, 520, `700 ${fs}px Georgia, 'Times New Roman', serif`, "#ffd966");
    x.strokeStyle = "#d9a520"; x.lineWidth = 2; x.beginPath(); x.moveTo(W / 2 - 420, 560); x.lineTo(W / 2 + 420, 560); x.stroke();
    ctr("ha completato il percorso di poker cash 6-max da zero al NL1000", 640, "34px Georgia, 'Times New Roman', serif", "#e6ecf3");
    ctr("e superato tutti gli esami dei livelli, fino all'esame NL1000.", 690, "34px Georgia, 'Times New Roman', serif", "#e6ecf3");
    /* sigillo */
    const cx = W / 2, cy = 850; x.beginPath(); x.arc(cx, cy, 92, 0, Math.PI * 2); const sg = x.createRadialGradient(cx - 25, cy - 25, 10, cx, cy, 95); sg.addColorStop(0, "#ffe9a3"); sg.addColorStop(1, "#b9861a"); x.fillStyle = sg; x.fill();
    x.lineWidth = 6; x.strokeStyle = "#7a5410"; x.stroke(); x.beginPath(); x.arc(cx, cy, 74, 0, Math.PI * 2); x.lineWidth = 2; x.stroke();
    ctr("NL1000", cy + 14, "700 40px Georgia, serif", "#3b2500"); ctr("ORCA D'ORO", cy + 50, "700 15px Georgia, serif", "#3b2500");
    const d = new Date(), ds = String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
    x.font = "28px Georgia, serif"; x.fillStyle = "#c8d2de"; x.textAlign = "left"; x.fillText("Data: " + ds, 150, 1010); x.textAlign = "right"; x.fillText("Orca School Poker", W - 150, 1010);
    c.toBlob(b => b ? res(b) : rej(new Error("png")), "image/png");
  });
}
async function diplomaSave(blob) {
  const dl = await hostUse("downloads").catch(() => null);
  if (dl && typeof dl.save === "function") { try { await dl.save({ filename: "diploma-orca-school-poker.png", data: blob }); return true; } catch (e) { return false; } }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "diploma-orca-school-poker.png"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); return true;
}

