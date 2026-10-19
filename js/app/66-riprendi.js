/* ================= RIPRENDI DA DOVE ERI =================
   Se la pagina si chiude a metà di una lezione o di un drill (telefono che chiude la scheda, ricarica, batteria),
   alla riapertura si riparte dalla stessa domanda. Il salvataggio è di questo dispositivo (localStorage).
   Uscire con «Esci» o cambiare scheda è una scelta: lì il salvataggio si cancella.
   Esclusi esami, test di piazzamento, minigiochi e partita silenziosa: hanno regole loro (un tentativo, tempo). */
const LS_RUN = "orca-run";
const RUN_MAX_AGE = 3 * 864e5;
function runSnapOk() {
  if (!run || run.silent || run.prova) return false;
  if (run.kind === "session") return !isExamRun();
  return run.kind === "free" && run.plan.every(p => DRILLS[p[0]] && !DRILLS[p[0]].noResume);
}
function runSnap() {
  if (!runSnapOk() || run.stage === "end") return;
  const { q, ...rest } = run;
  try { lsSet(LS_RUN, { v: 1, at: Date.now(), tab, run: rest, qp: q && q.params != null ? q.params : null }); } catch (e) {}
}
function runSnapClear() { try { localStorage.removeItem(LS_RUN); } catch (e) {} }
function runSnapGet() {
  const s = lsGet(LS_RUN);
  if (!s || s.v !== 1 || !s.run || !Array.isArray(s.run.plan) || Date.now() - s.at > RUN_MAX_AGE) return null;
  if (s.run.kind === "session" ? !sessById(s.run.id) : !s.run.plan.every(p => DRILLS[p[0]])) return null;
  return s;
}
/* «Domanda 4 di 8» contando tutti i drill del piano */
function runSnapWhere(r) {
  const tot = r.plan.reduce((a, p) => a + p[1], 0), before = r.plan.slice(0, r.di).reduce((a, p) => a + p[1], 0);
  const n = r.stage === "q" ? before + r.qi + 1 : r.stage === "fb" ? before + r.qi + 2 : r.stage === "dsum" ? before + r.plan[r.di][1] : before + 1;
  return `domanda ${Math.min(n, tot)} di ${tot}`;
}
function runResume() {
  const s = runSnapGet(); if (!s) return runSnapClear();
  run = { ...s.run, saved: false, q: null };
  const [did] = run.plan[run.di] || [];
  if ((run.stage === "q" || run.stage === "fb") && did) {
    let q = null;
    /* la stessa domanda di prima: si ricostruisce dai suoi parametri */
    if (s.qp != null) { try { q = DRILLS[did].build(s.qp); q.params = s.qp; q.skill = q.skill || did; } catch (e) { q = null; } }
    if (run.stage === "fb") { run.q = q || { stop: false }; run.stage = "q"; document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-selected", "false")); return nextQ(); }
    if (!q) q = makeQ(did);
    if (!q) { run.stage = "intro"; } else { run.q = q; run.stage = "q"; }
  }
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-selected", "false"));
  render(); window.scrollTo({ top: 0 });
}
/* riquadro in cima a Programma e Drill liberi */
function resumeBanner() {
  if (run || (tab !== "program" && tab !== "free")) return;
  const s = runSnapGet(), v = document.getElementById("view"); if (!s || !v || v.querySelector(".resume")) return;
  const el = document.createElement("div"); el.className = "resume"; el.setAttribute("role", "region"); el.setAttribute("aria-label", "Riprendi da dove eri");
  el.innerHTML = `${typeof gMascot === "function" ? gMascot("happy", 40) : ""}<div class="resume-t"><small>Hai lasciato a metà</small><b>${esc(s.run.label)}</b><span>${runSnapWhere(s.run)}</span></div><button type="button" class="btn primary" data-resume>Riprendi</button><button type="button" class="resume-x" data-resume-x aria-label="Lascia perdere">✕</button>`;
  v.prepend(el);
}
document.addEventListener("click", e => {
  if (!e.target.closest) return;
  if (e.target.closest("[data-resume]")) return runResume();
  const x = e.target.closest("[data-resume-x]"); if (x) { runSnapClear(); const b = x.closest(".resume"); if (b) b.remove(); }
});
