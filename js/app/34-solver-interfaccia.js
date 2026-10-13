/* ================= SOLVER: interfaccia ================= */
let SV = { cfg: null, E0: null, E1: null, view: "gto", node: null, path: [], sel: null, busy: false };
const svColor = a => a.kind === "fold" ? "var(--sv-fold)" : a.kind === "check" || a.kind === "call" ? "var(--sv-check)" : a.kind === "allin" ? "var(--sv-allin)" : a.kind === "raise" ? "var(--sv-b3)" : (a.frac || 0) <= 0.4 ? "var(--sv-b1)" : (a.frac || 0) <= 0.9 ? "var(--sv-b2)" : "var(--sv-b3)";
const svPct = s => String(s).split(/[,\s]+/).map(x => parseFloat(x.replace("%", ""))).filter(x => x > 0).map(x => x / 100);
function svParseRange(str) {
  const w = {};
  String(str || "").split(",").forEach(tok => { tok = tok.trim(); if (!tok) return; const [base, ww] = tok.split(":"); const f = ww == null ? 1 : parseFloat(ww); if (!(f > 0)) return; Object.keys(hParseRange(base)).forEach(k => w[k] = Math.min(1, f)); });
  return w;
}
const svRangeStr = w => Object.entries(w).filter(([, v]) => v > 0.0005).map(([k, v]) => v >= 0.9995 ? k : `${k}:${Math.round(v * 10000) / 10000}`).join(",");
function svCombos(w) { const out = []; Object.entries(w).forEach(([k, v]) => hExpand(k).forEach(c => out.push({ c, w: v, key: k }))); return out; }
/* tabelle GTO divise per tipo di spot: open, difesa del BB, 3-bet IP/OOP, contro 3-bet IP/OOP, squeeze, cold 4-bet */
const PRE_GROUPS = [
  ["Open · primo a entrare", id => /^rfi_/.test(id)],
  ["Difesa del BB contro open", id => /^bb_(ep|mp|co|btn|sb)$/.test(id)],
  ["3-bet in posizione (IP)", id => /^(btn|co|mp)_(ep|mp|co)$/.test(id)],
  ["3-bet fuori posizione (OOP) dalla SB", id => /^sb_(ep|mp|co|btn)$/.test(id)],
  ["Contro 3-bet · sei in posizione (IP)", id => /^(ep|mp|co|btn)_vs_(sb|bb)3$/.test(id)],
  ["Contro 3-bet · sei fuori posizione (OOP)", id => /^(ep|mp|co|sb)_vs_(mp|co|btn|bb)3$/.test(id) && !/^(ep|mp|co)_vs_(sb|bb)3$/.test(id)],
  ["Squeeze", id => /^sq_/.test(id)],
  ["Cold 4-bet", id => /^c4_/.test(id)]
];
function svPresetOpts() {
  const used = new Set(), opt = sp => sp.acts.map((a, i) => i === 0 ? "" : `<option value="${sp.id}|${i}">${esc(sp.label)} → ${esc(a)}</option>`).join("");
  const ok25 = pre25Ok(), opt25 = sp => ok25 ? opt(sp) : opt(sp).replace(/<option /g, "<option disabled ");
  let h25 = PRE_GROUPS.map(([lbl, f]) => { const L = PRE.filter(sp => !used.has(sp.id) && f(sp.id)); L.forEach(sp => used.add(sp.id)); return L.length ? `<optgroup label="${ok25 ? "" : "🔒 "}NL25-NL200 · ${esc(lbl)}">${L.map(opt25).join("")}</optgroup>` : ""; }).join("");
  const rest = PRE.filter(sp => !used.has(sp.id)); if (rest.length) h25 += `<optgroup label="Altre tabelle">${rest.map(opt25).join("")}</optgroup>`;
  let h = "";
  /* tabelle dei micro limiti, stessi gruppi */
  const usedM = new Set();
  h += PRE_GROUPS.map(([lbl, f]) => { const L = PRE_MICRO.filter(sp => !usedM.has(sp.id) && f(sp.id.replace(/^m_/, ""))); L.forEach(sp => usedM.add(sp.id)); return L.length ? `<optgroup label="Micro NL2-NL10 · ${esc(lbl)}">${L.map(opt).join("")}</optgroup>` : ""; }).join("");
  return h + h25;
}
function svPresetStr(v) { const [id, i] = v.split("|"); const sp = PRE_BY[id]; if (!sp) return ""; if (!sp.micro && !pre25Ok()) { gToast(PRE25_LOCK_MSG); return ""; } const w = {}; Object.entries(sp.f).forEach(([k, f]) => { if (f[+i] > 0.005) w[k] = f[+i]; }); return svRangeStr(w); }
