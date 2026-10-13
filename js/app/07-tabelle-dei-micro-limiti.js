/* ================= TABELLE DEI MICRO LIMITI (NL2, NL5, NL10) =================
   Create dalla scuola: range puri (ogni mano sempre o mai), open 2,5bb (3bb dalla SB), 3-bet ~3x in posizione e ~4x fuori,
   squeeze con +1x per caller. Base solida adattata alla rake e ai pool passivi: meno call, 3-bet più in value, steal larghi.
   Stessi spot delle tabelle da NL25 a NL200, con id "m_" davanti. */
/* PRE_MICRO: i dati sono in js/data/pre-micro.js */
PRE_MICRO.forEach(sp => { PRE_BY[sp.id] = sp; });
const MICRO_LV = ["nl2", "nl5", "nl10"];
/* livello di riferimento: quello della sessione in corso, altrimenti quello a cui sei arrivato */
function preLvMicro() {
  try { if (!pre25Ok()) return true;
    if (PRE_CAT && !(run && (run.kind === "session" || run.kind === "place"))) return PRE_CAT !== "nl25";
    const li = run && run.kind === "session" ? LEVELS.findIndex(L => L.s.some(x => x.id === run.id)) : run && run.kind === "place" ? 0 : curLevelIdx(); return li >= 0 && MICRO_LV.includes(LEVELS[li].id); } catch (e) { return false; }
}
/* tabelle NL25-NL200: si aprono quando arrivi a NL25 (o con l'accesso completo) */
function pre25Ok() { try { const i = LEVELS.findIndex(L => L.id === "nl25"); return tlPlan() === "premium" || i < 0 || curLevelIdx() >= i; } catch (e) { return true; } }
const preT = id => pre25Ok() ? PRE_BY[id] : (PRE_BY["m_" + id] || PRE_BY[id]);
const PRE25_LOCK_MSG = "🔒 Le tabelle NL25-NL200 si sbloccano quando arrivi a <b>NL25</b>: supera prima gli esami fino a NL10.";
/* categoria di tabelle scelta nei drill liberi (NL2-NL10 oppure NL25-NL200) */
let PRE_CAT = null;
const PCAT_DRILLS = ["preflop", "openfold", "vslimp"];
function pcatGet(d) { const v = lsGet("orca_pcat_" + d); if (v === "nl25" && pre25Ok()) return "nl25"; if (v === "micro") return "micro"; try { const i = LEVELS.findIndex(L => L.id === "nl25"); return pre25Ok() && curLevelIdx() >= i ? "nl25" : "micro"; } catch (e) { return "micro"; } }
function pcatHtml(d) { const c = pcatGet(d), ok = pre25Ok(); return `<div class="pcat" role="group" aria-label="Tabelle"><button type="button" data-pcat="${d}|micro" class="${c === "micro" ? "on" : ""}">NL2-NL10</button><button type="button" data-pcat="${d}|nl25" class="${c === "nl25" ? "on" : ""} ${ok ? "" : "lk"}" ${ok ? "" : 'aria-disabled="true"'}>${ok ? "" : "🔒 "}NL25-NL200</button></div>`; }
const preFor = id => { const base = String(id).replace(/^m_/, ""); return preLvMicro() && PRE_BY["m_" + base] ? PRE_BY["m_" + base] : PRE_BY[base] || PRE_BY[id]; };
const GRID_RANKS = "AKQJT98765432";
const handAt = (i, j) => i === j ? GRID_RANKS[i] + GRID_RANKS[j] : (GRID_RANKS[Math.min(i, j)] + GRID_RANKS[Math.max(i, j)] + (j > i ? "s" : "o"));
const combosOf = h => h.length === 2 ? 6 : h[2] === "s" ? 4 : 12;
const ACT_COL = ["var(--c-aria)", "var(--c-top)", "var(--c-draw)"];
const PRE_GS = ["Open", "Difesa del BB", "3-bet", "Contro un 3-bet", "Squeeze e cold 4-bet"];
const preOptions = () => { const ok = pre25Ok(); return PRE_GS.map(g => `<optgroup label="Micro NL2-NL10 · ${g}">${PRE_MICRO.filter(p => p.g === g).map(p => `<option value="${p.id}">${p.label}</option>`).join("")}</optgroup>`).join("") + PRE_GS.map(g => `<optgroup label="${ok ? "" : "🔒 "}NL25-NL200 · ${g}">${PRE.filter(p => p.g === g).map(p => `<option value="${p.id}" ${ok ? "" : "disabled"}>${p.label}</option>`).join("")}</optgroup>`).join(""); };
/* spot del drill Preflop GTO per la categoria scelta: il valore è sempre l'id base, la categoria decide quale tabella usare */
const preDrillOptions = cat => (cat === "nl25" ? PRE : PRE_MICRO).length ? PRE_GS.map(g => `<optgroup label="${g}">${(cat === "nl25" ? PRE : PRE_MICRO).filter(p => p.g === g).map(p => `<option value="${p.id.replace(/^m_/, "")}">${p.label}</option>`).join("")}</optgroup>`).join("") : "";
