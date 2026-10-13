/* ================= PREFLOP (range GTO) ================= */
/* pulizia delle tabelle: le frequenze sotto il 5% erano rumore della lettura dei grafici (es. 82o 2% da SB, Q2o 2% da EP) */
PRE.forEach(sp => { for (const k in sp.f) { const f = sp.f[k]; let ch = false; for (let i = 0; i < f.length; i++) if (f[i] > 0 && f[i] < 0.05) { f[i] = 0; ch = true; } if (ch) { const t = f.reduce((a, b) => a + b, 0); if (t > 0) for (let i = 0; i < f.length; i++) f[i] = Math.round(f[i] / t * 1000) / 1000; } } });
const PRE_BY = Object.fromEntries(PRE.map(s => [s.id, s]));
