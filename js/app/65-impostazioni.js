/* ================= IMPOSTAZIONI: tema, animazioni, effetti, suoni, avanzamento automatico =================
   Le preferenze sono di questo dispositivo (localStorage, non sincronizzate): il tema scuro sul telefono non deve
   cambiare quello del computer. I suoni restano in gS().sound come prima. */
const LS_PREF = "orca-prefs";
const PREF0 = { theme: "auto", motion: "auto", fx: true, auto: false, felt: "verde", scene: "auto", deck: "", speed: "normale", vib: true };
/* temi del tavolo: [valore, nome, colore centro, colore bordo del panno, colore del bordo del tavolo] (i colori veri sono in css/13-tavolo.css) */
const FELTS = [["verde", "Verde e legno (Orca)", "#1f8a55", "#0c4a2d", "#6a4b24"], ["blu", "Blu e metallo", "#1d5fb4", "#103670", "#3a3f46"], ["smeraldo", "Smeraldo e nero", "#22b277", "#0d5e3e", "#1c2421"], ["bordeaux", "Bordeaux e oro", "#ad3a4e", "#5b1828", "#9c7424"], ["notte", "Notte e argento", "#56636e", "#2a3239", "#5d6870"], ["corallo", "Corallo e oro", "#e2674f", "#9c3a2a", "#d4a24c"], ["abisso", "Abisso", "#0f6e7e", "#06262e", "#39d0e0"], ["aurora", "Aurora", "#5b3fa8", "#24164a", "#9be7c4"]];
const SCENES = [["auto", "Verde scuro (Orca)", "#1b2a24", "#0b1310"], ["notteblu", "Blu notte", "#15233a", "#070c16"], ["acciaio", "Acciaio", "#18212e", "#060a11"], ["foresta", "Foresta", "#134a33", "#0a2e1f"], ["oceano", "Oceano", "#123a78", "#061b3f"], ["vinaccia", "Vinaccia", "#3a1220", "#14060b"]];
let PREF = Object.assign({}, PREF0, lsGet(LS_PREF) || {});
/* movimento ridotto: scelto nelle impostazioni o chiesto dal sistema */
const calmMotion = () => { if (PREF.motion === "reduce") return true; try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
const prefFx = () => PREF.fx !== false && !calmMotion();
/* velocità delle animazioni: le animazioni CSS partono alla velocità scelta; i tempi in JavaScript (replay delle mani, suoni) si moltiplicano per animK() */
const animRate = () => ({ lente: 0.7, veloci: 1.5 })[PREF.speed] || 1;
const animK = () => 1 / animRate();
document.addEventListener("animationstart", e => {
  const r = animRate(); if (r === 1 || !e.target.getAnimations) return;
  try { e.target.getAnimations().forEach(a => { if (a.animationName === e.animationName && a.playbackRate !== r) a.playbackRate = r; }); } catch (err) {}
}, true);
/* «Ridotte» deve valere come «riduci movimento» del sistema: copia le regole CSS di quella media query sotto :root[data-motion="reduce"],
   così non si duplica a mano nessuna regola e quelle aggiunte in futuro valgono da sole */
function prefMotionCss() {
  let out = "";
  for (const sh of document.styleSheets) {
    let rules; try { rules = sh.cssRules; } catch (e) { continue; }
    for (const r of rules || []) {
      if (!(r instanceof CSSMediaRule) || !/prefers-reduced-motion\s*:\s*reduce/.test(r.conditionText || (r.media && r.media.mediaText) || "")) continue;
      for (const x of r.cssRules) if (x.selectorText) out += x.selectorText.split(",").map(s => { s = s.trim(); const R = ':root[data-motion="reduce"]'; return /^:root/.test(s) ? s.replace(/^:root/, R) : /^html\b/.test(s) ? s.replace(/^html/, "html" + R.slice(5)) : R + " " + s; }).join(",") + "{" + x.style.cssText + "}";
    }
  }
  return out;
}
/* riserva se il browser non lascia leggere i fogli di stile (pagina aperta da file locale con CSS separati): le regole principali */
const PREF_MOTION_MIN = ':root[data-motion="reduce"] *:not(.lx-ha *){animation:none!important}:root[data-motion="reduce"] *{transition:none!important}:root[data-motion="reduce"] .lx-ha [class*=" a"],:root[data-motion="reduce"] .lx-ha [class^="a"]{animation-play-state:paused!important;animation-delay:var(--lx-ha-frz,-17s)!important}:root[data-motion="reduce"] .lx-ha>.lx-cap{display:none}';
function prefApply() {
  const R = document.documentElement;
  if (PREF.theme === "light" || PREF.theme === "dark") R.dataset.theme = PREF.theme; else delete R.dataset.theme;
  /* attributi con nomi propri (data-tav, data-scena, data-mazzo): un attributo su <html> non deve coincidere con quelli che i gestori dei clic cercano con closest() */
  for (const [k, at, def] of [["felt", "tav", "verde"], ["scene", "scena", "auto"], ["deck", "mazzo", ""]]) { if (PREF[k] && PREF[k] !== def) R.dataset[at] = PREF[k]; else delete R.dataset[at]; }
  if (PREF.motion === "reduce") {
    R.dataset.motion = "reduce";
    if (!document.getElementById("prefMotion")) { const st = document.createElement("style"); st.id = "prefMotion"; st.textContent = prefMotionCss() || PREF_MOTION_MIN; document.head.appendChild(st); }
  } else delete R.dataset.motion;
}
function prefSet(k, v) { PREF[k] = v; lsSet(LS_PREF, PREF); prefApply(); }
const GIC_GEAR = '<svg viewBox="0 0 24 24" class="gic"><path d="M10.3 2h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9L2 13.7v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8z" fill="currentColor"/><circle cx="12" cy="12" r="3.4" fill="var(--surface)"/></svg>';
function prefModal() {
  const row = (k, lab, help, opts, cur) => `<div class="prefrow"><div><b>${lab}</b><small>${help}</small></div><div class="segm small" role="group" aria-label="${lab}">${opts.map(([v, t]) => `<button type="button" data-pref="${k}" data-v="${v}" class="${String(cur) === String(v) ? "on" : ""}" aria-pressed="${String(cur) === String(v)}">${t}</button>`).join("")}</div></div>`;
  /* i tavoli da collezione restano chiusi finché non li sblocchi (js/app/71-collezione.js) */
  const locked = (k, v) => k === "felt" && typeof tavOk === "function" && !tavOk(v);
  const swatch = (k, lab, help, list) => `<div class="prefrow"><div><b>${lab}</b><small>${help}</small></div><div class="feltpick" role="group" aria-label="${lab}">${list.map(([v, t, c1, c2, c3]) => { const lk = locked(k, v), tt = lk ? `${t}: da sbloccare (${tavWhy(v)})` : t; return `<button type="button" ${lk ? "disabled" : `data-pref="${k}" data-v="${v}"`} class="${PREF[k] === v ? "on" : ""} ${lk ? "lock" : ""}" aria-pressed="${PREF[k] === v}" title="${tt}" aria-label="${tt}" style="--c1:${c1};--c2:${c2};--c3:${c3}"></button>`; }).join("")}</div></div>`;
  const body = () => `<h3 style="margin:0 0 4px">Impostazioni</h3><p class="muted" style="margin:0 0 12px;font-size:13.5px">Valgono su questo dispositivo.</p><div class="prefs">
    ${row("theme", "Tema", "Automatico segue il telefono o il computer.", [["auto", "Automatico"], ["light", "Chiaro"], ["dark", "Scuro"]], PREF.theme)}
    ${swatch("felt", "Tavolo", "Panno e bordo in lezioni, quiz, drill e minigiochi.", FELTS.map(([v, t, a, b, c]) => [v, t, a, b, c]))}
    ${swatch("scene", "Sfondo del tavolo", "La scena scura dietro il tavolo.", SCENES.map(([v, t, a, b]) => [v, t, a, b, "#000"]))}
    ${row("deck", "Carte", "Colori: carte colorate per seme. Classico: bianche, rosso e nero. 4 colori: bianche con quadri blu e fiori verdi.", [["", "Come ora"], ["colori", "Colori"], ["classico", "Classico"], ["4c", "4 colori"]], PREF.deck)}
    ${row("motion", "Animazioni", "Ridotte: mani al tavolo ferme sull'ultimo momento, niente effetti in movimento.", [["auto", "Automatiche"], ["reduce", "Ridotte"]], PREF.motion)}
    ${row("speed", "Velocità delle animazioni", "Lente per seguire meglio le mani al tavolo, veloci per allenarti più in fretta.", [["lente", "Lente"], ["normale", "Normali"], ["veloci", "Veloci"]], PREF.speed)}
    ${row("fx", "Effetti delle risposte", "Scintille, lampo «Nella zona» e coriandoli.", [[true, "Sì"], [false, "No"]], PREF.fx)}
    ${row("sound", "Suoni", "Risposte, combo, fine del drill e suoni del tavolo: carte, fiches, check e fold.", [[true, "Sì"], [false, "No"]], gS().sound)}
    ${row("vib", "Vibrazione", "Risposte giuste e sbagliate, combo e festeggiamenti. Solo sui telefoni che la supportano (su iPhone non è disponibile).", [[true, "Sì"], [false, "No"]], PREF.vib)}
    ${row("auto", "Avanti da solo", "Dopo una risposta giusta passa alla domanda dopo (non negli esami).", [[false, "No"], [true, "Sì"]], PREF.auto)}
  </div>`;
  gModal(`<div id="prefBody">${body()}</div>`, m => {
    m.addEventListener("click", e => {
      const b = e.target.closest("[data-pref]"); if (!b) return;
      const k = b.dataset.pref, raw = b.dataset.v, v = raw === "true" ? true : raw === "false" ? false : raw;
      if (k === "sound") { gS().sound = v; persist(); renderStats(); } else prefSet(k, v);
      m.querySelector("#prefBody").innerHTML = body();
      const nb = m.querySelector(`[data-pref="${k}"][data-v="${raw}"]`); if (nb) nb.focus();
    });
  });
}
document.addEventListener("click", e => { if (e.target.closest && e.target.closest("[data-prefs]")) prefModal(); });
prefApply();
