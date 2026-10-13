/* ================= SCELTA DELLE SIZE PRIMA DI CALCOLARE ================= */
/* prima di ogni nuova soluzione si apre il costruttore dell'albero: quante size su flop, turn, river e raise */
const GW_ASKP = {
  3: { n: "Flop", list: [25, 33, 50, 75, 100, 125, 150], pre: { 1: [33], 2: [33, 100], 3: [25, 75, 125] } },
  4: { n: "Turn", list: [25, 33, 50, 75, 100, 125, 150, 200], pre: { 1: [75], 2: [50, 125], 3: [33, 75, 150] } },
  5: { n: "River", list: [25, 33, 50, 75, 100, 125, 150], pre: { 1: [75], 2: [50, 125], 3: [33, 75, 150] } },
  rz: { n: "Raise", list: [30, 50, 75, 100, 150], pre: { 0: [], 1: [75], 2: [50, 100] } },
  rz2: { n: "Re-raise", list: [50, 75, 100], pre: { 0: [], 1: [75], 2: [50, 100] } },
  o3: { n: "Flop OOP", list: [25, 33, 50, 75, 100, 125], pre: { 1: [33], 2: [33, 75], 3: [25, 50, 100] } },
  o4: { n: "Turn OOP", list: [25, 33, 50, 75, 100, 125, 150], pre: { 1: [75], 2: [33, 100], 3: [33, 75, 125] } },
  o5: { n: "River OOP", list: [25, 33, 50, 75, 100, 125, 150], pre: { 1: [75], 2: [33, 100], 3: [33, 75, 125] } },
};
const GW_ASKPRE = [
  { id: "mono", n: "Monosize", d: "1 size per street, il più veloce", v: { f: [33], t: [75], r: [75], rz: [75] } },
  { id: "std", n: "Standard", d: "2 size al flop, 1 dopo", v: { f: [33, 100], t: [75], r: [75], rz: [75] } },
  { id: "two", n: "2 size ovunque", d: "piccola e overbet su ogni street", v: { f: [33, 100], t: [50, 125], r: [50, 125], rz: [75] } },
  { id: "full", n: "Completo", d: "3 size e 2 raise (lento)", v: { f: [25, 75, 125], t: [33, 75, 150], r: [33, 75, 150], rz: [50, 100] } },
];
let GW_RATE0 = 8e-8; /* secondi per cella e iterazione, si aggiorna dopo ogni calcolo */
const GW_KEY = { 3: "f", 4: "t", 5: "r", rz: "rz", rz2: "rz2", o3: "fo", o4: "to", o5: "ro" };
function gwSetInit() {
  if (!GW.set) {
    GW.set = { ...GW_SET0(), ...((typeof S !== "undefined" && S.gwSet) || {}) };
    /* senza scelta salvata: rake PokerStars del livello a cui sei */
    const saved = typeof S !== "undefined" && S.gwSet;
    if (!saved || saved.rakeLvl === undefined) { const k = rakeDefaultStake(), r = rakePS(k, 6); if (r && (!saved || (saved.rake === 5 && saved.cap === 3))) Object.assign(GW.set, { rake: r.rake, cap: r.cap, rakeLvl: k }); }
  }
  return GW.set;
}
const gwAskOn = () => !(typeof S !== "undefined" && S.gwAsk === false);
/* cfg: { st0, title, mk: () => o (legge GW.set), go: () => void, first: {oop, ip} per le mani importate } */
function gwAskOpen(cfg) {
  gwSetInit();
  const s = GW.set;
  GW.ask = { ...cfg, D: { f: s.f.slice(), t: s.t.slice(), r: s.r.slice(), rz: (cfg.rz && cfg.rz.length ? cfg.rz : s.rz).slice(), rz2: (s.rz2 || []).slice(), maxR: s.maxR ?? 2, oopSep: !!s.oopSep, fo: (s.fo || [33]).slice(), to: (s.to || [75]).slice(), ro: (s.ro || [75]).slice(), allin: s.allin, donk: s.donk, lead: s.lead, it: s.it, itT: s.itT, first: cfg.first ? { oop: cfg.first.oop.slice(), ip: cfg.first.ip.slice() } : null }, est: null };
  gwAskEst();
  renderStudy();
}
/* stima dell'albero: nodi di decisione, memoria e tempo (dal ritmo delle soluzioni precedenti) */
function gwAskEst() {
  const A = GW.ask; if (!A) return;
  try {
    const s0 = GW.set; GW.set = { ...s0, ...A.D };
    let o; try { o = A.mk(A.D); } finally { GW.set = s0; }
    const tree = msBuildTree(o), n = [o.ranges[0].length, o.ranges[1].length];
    let nAct = 0, cells = 0;
    tree.nodes.forEach(x => { if (x.t !== "a") return; nAct++; cells += x.acts.length * n[x.pl]; });
    const it = o.board.length === 3 ? A.D.it : A.D.itT, mb = cells * 8 / 1e6;
    const sec = cells * it * ((GW.rateK || {})[o.board.length === 3 ? 3 : 4] || GW_RATE0);
    A.est = { nAct, mb, sec, it };
  } catch (e) { A.est = null; }
}
function gwAskModal() {
  const A = GW.ask, D = A.D, st0 = A.st0, E = A.est;
  const count = a => a.length;
  const X = A.xt || (A.xt = {}), uni = (list, arr, k) => [...new Set([...list, ...arr, ...(X[k] || [])])].sort((a, b) => a - b);
  const add = t => `<span class="gwask-add"><input type="number" inputmode="numeric" min="5" max="500" step="1" placeholder="altra %" data-gakin="${t}"><button class="gwchip" data-gakadd="${t}" title="Aggiungi una size personalizzata">+</button></span>`;
  const chips = (k, arr, list, max) => uni(list, arr, k).map(x => `<button class="gwchip ${arr.includes(x) ? "on" : ""}" data-gaks="${k}:${x}" ${!arr.includes(x) && arr.length >= max ? "disabled" : ""}>${x}%</button>`).join("");
  const seg = (k, arr, opts) => `<div class="gwask-n">${opts.map(v => `<button class="${count(arr) === v ? "on" : ""}" data-gakn="${k}:${v}">${v === 0 ? "0" : v}</button>`).join("")}</div>`;
  const rowSt = st => {
    const k = GW_KEY[st], P = GW_ASKP[st], arr = D[k];
    if (A.first && st === st0) {
      const lst = (f, p) => uni(P.list, f, "f" + p);
      return `<div class="gwask-row"><div class="gwask-l"><b>${P.n}</b><small>size della mano</small></div><div class="gwask-r"><div class="gwask-sub"><span>OOP</span>${lst(D.first.oop, "oop").map(x => `<button class="gwchip ${D.first.oop.includes(x) ? "on" : ""}" data-gakf="oop:${x}">${x}%</button>`).join("")}${add("f:oop")}</div><div class="gwask-sub"><span>IP</span>${lst(D.first.ip, "ip").map(x => `<button class="gwchip ${D.first.ip.includes(x) ? "on" : ""}" data-gakf="ip:${x}">${x}%</button>`).join("")}${add("f:ip")}</div></div></div>`;
    }
    return `<div class="gwask-row"><div class="gwask-l"><b>${P.n}</b><small>${count(arr)} ${count(arr) === 1 ? "size" : "size"}${st === 5 && D.allin ? " + all-in" : ""}</small></div><div class="gwask-r">${seg(st, arr, [1, 2, 3])}<div class="gwask-chips">${chips(st, arr, P.list, 4)}${arr.length < 4 ? add("s:" + st) : ""}${st === 5 ? `<button class="gwchip ${D.allin ? "on" : ""}" data-gakt="allin">All-in</button>` : ""}</div></div></div>`;
  };
  const rowO = st => { const k = GW_KEY[st], P = GW_ASKP[st], arr = D[k]; return `<div class="gwask-row"><div class="gwask-l"><b>${P.n}</b><small>lead di chi è fuori posizione</small></div><div class="gwask-r">${seg(st, arr, [1, 2, 3])}<div class="gwask-chips">${chips(st, arr, P.list, 4)}${arr.length < 4 ? add("s:" + st) : ""}</div></div></div>`; };
  const streets = [3, 4, 5].filter(st => st >= st0);
  const tag = E ? (E.sec < 20 ? ["ok", "Veloce"] : E.sec < 90 ? ["mid", "Medio"] : ["slow", "Pesante"]) : null;
  const tm = E ? (E.sec < 60 ? `${Math.max(1, Math.round(E.sec))} s` : `${Math.round(E.sec / 60)} min`) : "";
  return `<div class="gwmodal gwask"><div class="gwmodal-b" style="max-width:760px">
    <div class="gwhead"><b>Prima di calcolare: scegli le size</b><button class="gwbtn ghost" data-gakx="1">Annulla</button></div>
    <p class="gwmuted" style="margin:0 0 10px">${esc(A.title || "")}. Decidi quante size può usare il solver su ogni street: meno size vuol dire una strategia più semplice da giocare e un calcolo più rapido. Con <b>+</b> aggiungi una size personalizzata (da 5% a 500% del piatto).</p><p class="gwask-msg" id="gwAskMsg">${esc(A.msg || "")}</p>
    <div class="gwask-pre">${GW_ASKPRE.map(p => { const on = streets.every(st => (A.first && st === st0) || D[GW_KEY[st]].join() === p.v[GW_KEY[st]].join()) && D.rz.join() === p.v.rz.join(); return `<button class="${on ? "on" : ""}" data-gakp="${p.id}"><b>${p.n}</b><small>${p.d}</small></button>`; }).join("")}</div>
    ${streets.map(rowSt).join("")}
    <div class="gwask-row"><div class="gwask-l"><b>Raise</b><small>${D.rz.length ? D.rz.length + " size" : "solo all-in"}</small></div><div class="gwask-r">${seg("rz", D.rz, [0, 1, 2])}<div class="gwask-chips">${chips("rz", D.rz, [...new Set([...GW_ASKP.rz.list, ...(A.rz || [])])].sort((x, y) => x - y), 2)}${D.rz.length < 2 ? add("s:rz") : ""}<button class="gwchip ${D.allin ? "on" : ""}" data-gakt="allin">All-in</button></div></div></div>
    <div class="gwask-row"><div class="gwask-l"><b>Raise per street</b><small>${D.maxR === 2 ? "raise e re-raise" : "un solo raise"}</small></div><div class="gwask-r"><div class="gwask-n"><button class="${D.maxR === 1 ? "on" : ""}" data-gaki="maxR:1">1</button><button class="${D.maxR === 2 ? "on" : ""}" data-gaki="maxR:2">2</button></div>${D.maxR === 2 ? `<div class="gwask-chips"><span class="gwmuted" style="font-size:12px">Re-raise:</span>${chips("rz2", D.rz2, GW_ASKP.rz2.list, 2)}${D.rz2.length < 2 ? add("s:rz2") : ""}<span class="gwmuted" style="font-size:12px">${D.rz2.length ? "più all-in" : "solo all-in"}</span></div>` : ""}</div></div>
    <div class="gwask-row"><div class="gwask-l"><b>OOP</b><small>chi è fuori posizione</small></div><div class="gwask-r"><div class="gwask-chips">${st0 === 3 ? `<button class="gwchip ${D.donk ? "on" : ""}" data-gakt="donk">Donk bet al flop</button>` : ""}<button class="gwchip ${D.lead ? "on" : ""}" data-gakt="lead">Lead/probe su turn e river</button>${(st0 === 3 && D.donk) || D.lead ? `<button class="gwchip ${D.oopSep ? "on" : ""}" data-gakt="oopSep">Size OOP diverse da IP</button>` : ""}</div></div></div>
    ${D.oopSep ? [3, 4, 5].filter(st => st >= st0 && !(A.first && st === st0) && (st === 3 ? D.donk : D.lead)).map(st => rowO("o" + st)).join("") : ""}
    <div class="gwask-row"><div class="gwask-l"><b>Precisione</b><small>${st0 === 3 ? "flop" : "turn e river"}</small></div><div class="gwask-r"><div class="gwask-chips">${(st0 === 3 ? [[50, "Veloce"], [100, "Normale"], [200, "Alta"]] : [[100, "Veloce"], [200, "Normale"], [400, "Alta"]]).map(([v, l]) => `<button class="gwchip ${(st0 === 3 ? D.it : D.itT) === v ? "on" : ""}" data-gaki="${st0 === 3 ? "it" : "itT"}:${v}">${l}</button>`).join("")}</div></div></div>
    <div class="gwask-foot">${E ? `<div class="gwask-est"><span class="gwask-tag ${tag[0]}">${tag[1]}</span><span><b>${E.nAct.toLocaleString("it-IT")}</b> nodi</span><span><b>${fmt(E.mb, 0)}</b> MB</span><span>circa <b>${tm}</b>${(GW.rateK || {})[st0 === 3 ? 3 : 4] ? "" : " (stima)"}</span></div>` : `<div></div>`}
      <label class="gwask-alw"><input type="checkbox" id="gwAskAlw" ${gwAskOn() ? "checked" : ""}> Chiedi sempre prima di calcolare</label>
      <button class="gwbtn" data-gakgo="1">Calcola ▶</button></div>
    <p class="gwmuted" style="margin:8px 0 0">Se lo stesso spot con le stesse size è già in memoria si apre subito. Puoi cambiare le size anche dopo, con ⚙ Albero o Risolvi con IA.</p>
  </div></div>`;
}
function gwAskBind() {
  const A = GW.ask; if (!A) return;
  const Q = s => document.querySelectorAll(s), D = A.D, upd = () => { gwAskEst(); renderStudy(); };
  Q("[data-gakn]").forEach(b => b.onclick = () => { const [st, v] = b.dataset.gakn.split(":"), k = GW_KEY[st]; D[k] = GW_ASKP[st].pre[+v].slice(); upd(); });
  Q("[data-gaks]").forEach(b => b.onclick = () => { const [st, x] = b.dataset.gaks.split(":"), k = GW_KEY[st], v = +x, arr = D[k]; if (arr.includes(v)) { if (arr.length > 1 || st === "rz" || st === "rz2") D[k] = arr.filter(y => y !== v); } else D[k] = [...arr, v].sort((a, c) => a - c); upd(); });
  const addV = (t, raw) => {
    const v = Math.round(+String(raw).replace(",", ".")), [kind, key] = t.split(":");
    if (!(v >= 5 && v <= 500)) { A.msg = "Scrivi una percentuale del piatto tra 5 e 500."; return renderStudy(); }
    A.msg = "";
    if (kind === "f") { const arr = D.first[key]; if (!arr.includes(v)) D.first[key] = [...arr, v].sort((a, c) => a - c); (A.xt["f" + key] = A.xt["f" + key] || []).push(v); return upd(); }
    const k = GW_KEY[key], max = key === "rz" || key === "rz2" ? 2 : 4;
    if (!D[k].includes(v)) { if (D[k].length >= max) { A.msg = `Al massimo ${max} size ${key === "rz" ? "di raise" : "per street"}: togline una prima.`; return renderStudy(); } D[k] = [...D[k], v].sort((a, c) => a - c); }
    (A.xt[key] = A.xt[key] || []).push(v); upd();
  };
  Q("[data-gakadd]").forEach(b => b.onclick = () => { const t = b.dataset.gakadd, i = document.querySelector(`[data-gakin="${t}"]`); addV(t, i ? i.value : ""); });
  Q("[data-gakin]").forEach(i => i.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); addV(i.dataset.gakin, i.value); } });
  Q("[data-gakf]").forEach(b => b.onclick = () => { const [p, x] = b.dataset.gakf.split(":"), v = +x, arr = D.first[p]; D.first[p] = arr.includes(v) ? arr.filter(y => y !== v) : [...arr, v].sort((a, c) => a - c); upd(); });
  Q("[data-gakt]").forEach(b => b.onclick = () => { const k = b.dataset.gakt; D[k] = !D[k]; upd(); });
  Q("[data-gaki]").forEach(b => b.onclick = () => { const [k, v] = b.dataset.gaki.split(":"); D[k] = +v; upd(); });
  Q("[data-gakp]").forEach(b => b.onclick = () => { const p = GW_ASKPRE.find(x => x.id === b.dataset.gakp); Object.entries(p.v).forEach(([k, v]) => D[k] = v.slice()); upd(); });
  const alw = $("#gwAskAlw"); if (alw) alw.onchange = e => { S.gwAsk = e.target.checked; persistSoon(); };
  Q("[data-gakx]").forEach(b => b.onclick = () => { GW.ask = null; renderStudy(); });
  Q("[data-gakgo]").forEach(b => b.onclick = () => {
    const { first, ...rest } = D;
    Object.assign(GW.set, rest);
    S.gwSet = { f: GW.set.f, t: GW.set.t, r: GW.set.r, rz: GW.set.rz, rz2: GW.set.rz2, maxR: GW.set.maxR, oopSep: GW.set.oopSep, fo: GW.set.fo, to: GW.set.to, ro: GW.set.ro, allin: GW.set.allin, donk: GW.set.donk, lead: GW.set.lead, it: GW.set.it, itT: GW.set.itT, rake: GW.set.rake, cap: GW.set.cap, rakeLvl: GW.set.rakeLvl || "" }; persistSoon();
    GW.ask = null;
    A.go(D);
  });
}

