/* ================= AVATAR ACQUATICI (caricato prima di 09 e 10: le schede delle lezioni li usano già al caricamento): 105 specie disegnate in SVG per gli avversari (Hero è sempre Orki, l'orca) =================
   Ogni specie = [nome, modello, colore 1, colore 2, colore 3, variante]. I modelli disegnano il corpo, colori e variante cambiano la specie.
   A ogni nuova domanda (aqShuffle) gli avversari ricevono specie nuove, tutte diverse allo stesso tavolo. */
const AQ = [
  /* squali */
  ["Squalo bianco", "shark", "#7d8b97", "#eef2f5", "#4c5862", ""], ["Squalo tigre", "shark", "#8a8f7a", "#eceee4", "#4d5240", "tiger"], ["Squalo martello", "shark", "#7b8fa0", "#eef3f6", "#4a5d6c", "hammer"],
  ["Squalo balena", "shark", "#2f4f78", "#e8eef5", "#ffffff", "spots"], ["Squalo leopardo", "shark", "#b59a6a", "#f3ecdc", "#5a4526", "spots"], ["Squalo mako", "shark", "#2f5fa0", "#eef3fa", "#1c3a66", ""],
  ["Squalo toro", "shark", "#8d7f70", "#efe9e2", "#574b40", ""], ["Squalo nutrice", "shark", "#a0805a", "#f0e4d2", "#6b5236", "round"], ["Squalo grigio di barriera", "shark", "#6f7a84", "#eef1f3", "#2c333a", "tips"],
  ["Squalo pinna bianca", "shark", "#5f6c76", "#eef1f3", "#ffffff", "tips"], ["Squalo elefante", "shark", "#5a6066", "#d9dcdf", "#33383c", "basking"], ["Squalo limone", "shark", "#b8a65a", "#f5f0d8", "#7a6b2c", ""],
  /* razze */
  ["Manta", "ray", "#2b3440", "#f2f4f6", "#ffffff", "manta"], ["Razza chiodata", "ray", "#9b8768", "#efe7da", "#5f4e36", "spots"], ["Trigone viola", "ray", "#6b4e8e", "#e9e2f2", "#3f2b57", ""],
  ["Aquila di mare", "ray", "#2f3b4a", "#f3f5f7", "#ffffff", "dots"], ["Torpedine", "ray", "#a2774e", "#f1e3d2", "#3e2a16", "round"],
  /* meduse */
  ["Medusa luna", "jelly", "#c9d9f2", "#9bb3e6", "#ffffff", "clover"], ["Medusa criniera di leone", "jelly", "#e07a3a", "#f7c08a", "#b9471c", "mane"], ["Caravella portoghese", "jelly", "#7f8ff0", "#c9b6ff", "#3b4bd0", "float"],
  ["Polmone di mare", "jelly", "#d7ccef", "#5c4ab0", "#ffffff", "frill"], ["Cassiopea", "jelly", "#a7b98a", "#e6e9c8", "#5f7a40", "frill"], ["Medusa luminosa", "jelly", "#e98bd0", "#ffd2f0", "#b04392", ""],
  ["Medusa uovo fritto", "jelly", "#f3e9c8", "#f5b51e", "#d48a00", "egg"], ["Cubomedusa", "jelly", "#bfe7f2", "#7fcbe0", "#3d97b0", "box"],
  /* cefalopodi */
  ["Polpo comune", "octo", "#c4553a", "#f0a07f", "#7d2c1a", ""], ["Polpo dagli anelli blu", "octo", "#e6c35a", "#f7e2a0", "#1d6ff2", "rings"], ["Polpo mimetico", "octo", "#a87c5a", "#f1dcc4", "#4a3220", "bands"],
  ["Calamaro", "squid", "#e7a3a0", "#f8d8d4", "#b05a54", ""], ["Calamaro gigante", "squid", "#b44a52", "#f0b8ba", "#6e1f27", "giant"], ["Seppia", "squid", "#9a8a72", "#efe6d8", "#5a4b36", "cuttle"],
  ["Nautilus", "naut", "#f1e6d2", "#c0602a", "#7d3412", ""],
  /* crostacei */
  ["Granchio reale", "crab", "#c2402f", "#f19a7f", "#7a1d12", "spiky"], ["Granchio rosso", "crab", "#e0482e", "#ffb08a", "#8f1f10", ""], ["Granchio blu", "crab", "#3a77c4", "#a8cdf2", "#1d4580", ""],
  ["Aragosta", "lobster", "#c9572c", "#f5b48a", "#7d2a0f", "spiny"], ["Astice", "lobster", "#2f4f8c", "#9fb6e0", "#1b2f5a", ""], ["Gambero", "shrimp", "#f08a6e", "#ffd0c0", "#c2533a", ""],
  ["Canocchia pavone", "shrimp", "#2fae7a", "#ff6a3d", "#2f6fe0", "mantis"],
  /* cetacei e mammiferi marini (l'orca è Hero) */
  ["Delfino", "dolphin", "#6f8fae", "#e9f0f6", "#3f5a74", ""], ["Stenella", "dolphin", "#4f6a86", "#e6edf4", "#ffffff", "spots"], ["Balena azzurra", "whale", "#5a7fa8", "#d7e4f1", "#34557a", "spots"],
  ["Megattera", "whale", "#3a4450", "#e8ecf0", "#ffffff", "hump"], ["Capodoglio", "whale", "#5a5f66", "#c9cdd2", "#33373c", "sperm"], ["Beluga", "whale", "#eef3f6", "#ffffff", "#b9c7d2", "beluga"],
  ["Narvalo", "whale", "#8b98a4", "#e9eef2", "#4a5560", "narwhal"], ["Foca", "seal", "#8c8f94", "#c8cbcf", "#4a4d52", "spots"], ["Tricheco", "seal", "#a0745a", "#d9b597", "#5a3a28", "walrus"],
  ["Lamantino", "seal", "#8e9396", "#c3c7ca", "#5a5f62", "manatee"],
  /* tartarughe e rettili */
  ["Tartaruga verde", "turtle", "#5f8f4a", "#b9d69a", "#3b5c2a", ""], ["Caretta caretta", "turtle", "#a8683a", "#e9c08f", "#6b3d1d", ""], ["Tartaruga liuto", "turtle", "#3f4a52", "#9aa6ae", "#22282c", "ridges"],
  ["Serpente di mare", "eel", "#26324a", "#e8eef5", "#e8eef5", "bands"],
  /* stelle, ricci e cavallucci */
  ["Stella marina", "star", "#f08a3c", "#ffd0a0", "#c2541a", ""], ["Stella marina blu", "star", "#2f6fe0", "#a8c8ff", "#1b4aa8", ""], ["Stella cuscino", "star", "#d9a43a", "#f6dc9a", "#8d5f12", "fat"],
  ["Riccio di mare", "urchin", "#5a2b6e", "#9b6bb5", "#2c1238", ""], ["Cavalluccio marino", "horse", "#e8a33a", "#f8d690", "#a8661a", ""], ["Cavalluccio pigmeo", "horse", "#e88aa0", "#f8d0da", "#a84a62", "dots"],
  ["Dragone foglia", "horse", "#b5a34a", "#e6dca0", "#6b5f1d", "leafy"],
  /* pesci di barriera */
  ["Pesce pagliaccio", "fish", "#f2731d", "#ffffff", "#1a1a1a", "clown"], ["Pesce chirurgo blu", "fish", "#2c5fd8", "#f5c400", "#0d1f4f", "tang"], ["Pesce palla", "fish", "#d9c48a", "#f7efd6", "#6b5a2a", "puffer"],
  ["Pesce istrice", "fish", "#c8b48a", "#f4ecd8", "#5a4a26", "porcupine"], ["Pesce angelo imperatore", "fish", "#1f3fa0", "#f5c400", "#ffffff", "angel"], ["Pesce farfalla", "fish", "#f5d23a", "#ffffff", "#1a1a1a", "butterfly"],
  ["Pesce leone", "fish", "#c24a2c", "#fbe3d4", "#6b1e10", "lion"], ["Pesce pappagallo", "fish", "#2fb59a", "#f08ab8", "#1c6b8a", "parrot"], ["Pesce scorpione", "fish", "#b5603a", "#e8b892", "#5a2a14", "scorpion"],
  ["Pesce balestra", "fish", "#3a3f46", "#f5c400", "#ffffff", "trigger"], ["Pesce cofano", "fish", "#f2d03a", "#1a1a1a", "#ffffff", "box"], ["Pesce mandarino", "fish", "#2f6fe0", "#f2731d", "#2fb59a", "mandarin"],
  ["Pesce trombetta", "fish", "#d9a43a", "#f6dc9a", "#7a5412", "trumpet"], ["Pesce ago", "fish", "#8fb9a0", "#e4f2e9", "#3f6b52", "needle"], ["Cernia", "fish", "#7a5a3a", "#d9c0a0", "#3f2a16", "grouper"],
  /* pesci del mare aperto e degli abissi */
  ["Pesce luna", "fish", "#9aa6b0", "#e2e8ec", "#5a6670", "mola"], ["Pesce spada", "fish", "#4a6f9a", "#e2ebf4", "#2a4566", "sword"], ["Pesce vela", "fish", "#2c5fa8", "#dfe9f6", "#1d3f75", "sail"],
  ["Marlin", "fish", "#24497a", "#dfe8f3", "#7fb2ff", "marlin"], ["Tonno", "fish", "#2f4a6e", "#e8edf3", "#f5c400", "tuna"], ["Barracuda", "fish", "#8b98a4", "#eef2f5", "#3a4550", "barracuda"],
  ["Murena", "eel", "#6b7a3a", "#d6dca0", "#2f3a12", "spots"], ["Murena nastro blu", "eel", "#2f5fd8", "#f5d23a", "#0d1f4f", "ribbon"], ["Anguilla", "eel", "#4f5a3a", "#c9cfa8", "#252b16", ""],
  ["Rana pescatrice", "fish", "#8a6a4a", "#d9c0a0", "#3a2a1a", "angler"], ["Pesce abissale", "fish", "#2a2f3a", "#5a6478", "#ffe066", "deepsea"], ["Pesce volante", "fish", "#3a6fb5", "#e2ecf8", "#9fc4ff", "flying"],
  ["Pesce remo", "eel", "#c9cfd6", "#f2f5f8", "#e0482e", "oar"], ["Pesce lanterna", "fish", "#3a4560", "#8fa0c8", "#9ff0ff", "lantern"],
  /* pesci del Mediterraneo e d'acqua dolce */
  ["Orata", "fish", "#a9b4bd", "#eef2f5", "#e8b93a", "bream"], ["Branzino", "fish", "#8a98a6", "#eef2f5", "#4a5866", ""], ["Dentice", "fish", "#d98a7a", "#f6dcd4", "#2f6fe0", "dots"],
  ["Sardina", "fish", "#5a7fa8", "#eef3f8", "#2a4a70", "slim"], ["Salmone", "fish", "#9aa6b0", "#f2a48a", "#3a4550", "spots"], ["Trota iridea", "fish", "#8a9a6a", "#f2b8c8", "#3a4a26", "rainbow"],
  ["Sogliola", "flat", "#a88e6a", "#e9dcc8", "#6b5236", ""], ["Rombo", "flat", "#8f7f66", "#e2d8c6", "#4f4232", "spots"], ["Carpa koi", "fish", "#f5f2ea", "#f2731d", "#1a1a1a", "koi"],
  ["Pesce rosso", "fish", "#f2731d", "#ffc08a", "#c2440a", "gold"], ["Discus", "fish", "#d9542c", "#f5c08a", "#2f6fe0", "discus"], ["Pesce combattente", "fish", "#3a3fb5", "#e0457b", "#8a2fb5", "betta"],
  ["Neon", "fish", "#2a2f3a", "#2fb5e0", "#e0482e", "neon"], ["Piranha", "fish", "#8a98a6", "#e0482e", "#3a4550", "piranha"], ["Storione", "fish", "#6a6f66", "#d6d9d0", "#3a3f36", "sturgeon"],
  ["Pesce gatto", "fish", "#5a5040", "#c9bea6", "#2a2418", "catfish"],
];
/* ---- disegni: viewBox 0 0 64 64, l'animale guarda a destra ---- */
const aqEye = (x, y, r = 2.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + .5}" cy="${y}" r="${r * .55}" fill="#111"/>`;
const AQ_DRAW = {
  shark: (a, b, c, v) => {
    const head = v === "hammer" ? `<path d="M46 26h10v4h-4l-1 8h-3z" fill="${a}"/>` : "";
    const pat = v === "tiger" ? [20, 27, 34].map(x => `<path d="M${x} 24l2 7" stroke="${c}" stroke-width="2"/>`).join("") : v === "spots" ? [[18, 28], [24, 25], [30, 29], [36, 26], [27, 33]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${c}"/>`).join("") : "";
    const tip = v === "tips" ? `<path d="M30 17l2-2 1 3z" fill="${c}"/>` : "";
    const mouth = v === "basking" ? `<path d="M48 36h6" stroke="${c}" stroke-width="2.4"/>` : `<path d="M47 37q3 1 6-1" stroke="${c}" stroke-width="1.2" fill="none"/>`;
    return `<path d="M6 24l9 8-9 9 4-9z" fill="${a}"/><path d="M10 32q12-13 30-11q12 1 17 9q-5 9-17 10q-18 2-30-8z" fill="${a}"/><path d="M14 33q14 8 28 6q9-1 15-7q-5 9-17 10q-15 1-26-9z" fill="${b}"/><path d="M26 22l5-11 5 10z" fill="${a}"/>${tip}<path d="M32 38l-3 7 7-6z" fill="${a}"/>${pat}${head}${[40, 42, 44].map(x => `<path d="M${x} 29v4" stroke="${c}" stroke-width=".9"/>`).join("")}${mouth}${aqEye(v === "hammer" ? 54 : 50, 28, 2)}`;
  },
  ray: (a, b, c, v) => {
    const pat = v === "spots" ? [[26, 26], [36, 26], [31, 31], [24, 33], [38, 33]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${c}"/>`).join("") : v === "dots" ? [[22, 28], [28, 24], [34, 24], [40, 28], [31, 30], [25, 33], [37, 33]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="${c}"/>`).join("") : "";
    const body = v === "round" ? `<ellipse cx="32" cy="30" rx="18" ry="14" fill="${a}"/>` : `<path d="M32 16q8 6 26 14q-18 10-26 12q-8-2-26-12q18-8 26-14z" fill="${a}"/>`;
    const fins = v === "manta" ? `<path d="M27 18q-2-6 1-8M37 18q2-6-1-8" stroke="${a}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M24 30q8 6 16 0" fill="${b}" opacity=".9"/>` : "";
    return `<path d="M32 40q1 10 4 18" stroke="${a}" stroke-width="2" fill="none" stroke-linecap="round"/>${body}${pat}${fins}${aqEye(28, 24, 1.8)}${aqEye(36, 24, 1.8)}`;
  },
  jelly: (a, b, c, v) => {
    const tent = v === "mane" ? Array.from({ length: 9 }, (_, i) => `<path d="M${16 + i * 4} 34q${i % 2 ? 3 : -3} 8 0 16q${i % 2 ? -3 : 3} 6 0 10" stroke="${b}" stroke-width="2" fill="none"/>`).join("") : [20, 27, 34, 41, 47].map((x, i) => `<path d="M${x} 34q${i % 2 ? 4 : -4} 7 0 13q${i % 2 ? -4 : 4} 5 0 9" stroke="${c}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`).join("");
    const dome = v === "box" ? `<path d="M16 34v-12q0-8 16-8t16 8v12z" fill="${a}"/>` : v === "float" ? `<path d="M14 30q2-14 20-16q14 2 16 12q-2 6-18 6t-18-2z" fill="${a}"/><path d="M22 18q8-8 20-2" stroke="${c}" stroke-width="2.4" fill="none"/>` : `<path d="M12 34q0-20 20-20t20 20q-4 3-10 1q-5 3-10 0q-5 3-10 0q-6 2-10-1z" fill="${a}"/>`;
    const deco = v === "clover" ? [[25, 25], [32, 22], [39, 25], [32, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="none" stroke="${b}" stroke-width="1.4"/>`).join("") : v === "egg" ? `<circle cx="32" cy="25" r="6" fill="${b}"/>` : v === "frill" ? `<path d="M14 33q4 4 8 0q4 4 8 0q4 4 8 0q4 4 8 0q4 4 6 0" stroke="${b}" stroke-width="2.4" fill="none"/>` : `<ellipse cx="32" cy="24" rx="9" ry="4" fill="${b}" opacity=".55"/>`;
    return `${tent}${dome}${deco}${aqEye(27, 27, 1.8)}${aqEye(37, 27, 1.8)}`;
  },
  octo: (a, b, c, v) => {
    const arms = [10, 17, 24, 31, 38, 45, 52].map((x, i) => `<path d="M${30 + (x - 31) * .35} 36q${(x - 31) * .5} 8 ${x - 30 - (x - 31) * .35} 16q${i % 2 ? 3 : -3} 3 ${i % 2 ? -2 : 2} 5" stroke="${a}" stroke-width="4.2" fill="none" stroke-linecap="round"/>`).join("");
    const pat = v === "rings" ? [[25, 22], [33, 18], [39, 25], [30, 29], [23, 31], [41, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="none" stroke="${c}" stroke-width="1.6"/>`).join("") : v === "bands" ? [20, 27, 34, 41].map(x => `<path d="M${x} 14v22" stroke="${c}" stroke-width="2" opacity=".55"/>`).join("") : `<circle cx="26" cy="18" r="1.4" fill="${b}"/><circle cx="36" cy="16" r="1.2" fill="${b}"/><circle cx="40" cy="22" r="1.5" fill="${b}"/>`;
    return `${arms}<ellipse cx="32" cy="25" rx="13" ry="13" fill="${a}"/>${pat}${aqEye(27, 29, 2.4)}${aqEye(37, 29, 2.4)}`;
  },
  squid: (a, b, c, v) => {
    const arms = [24, 28, 32, 36, 40].map((x, i) => `<path d="M${x} 44q${i % 2 ? 2 : -2} 6 ${i % 2 ? 1 : -1} 12" stroke="${a}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`).join("");
    if (v === "cuttle") return `${arms}<ellipse cx="32" cy="30" rx="12" ry="15" fill="${a}"/><path d="M20 30q-4 0-4 6q4 4 6-2M44 30q4 0 4 6q-4 4-6-2" fill="${b}"/>${[22, 26, 30].map(y => `<path d="M24 ${y}q8 3 16 0" stroke="${c}" stroke-width="1.4" fill="none"/>`).join("")}${aqEye(27, 38, 2.2)}${aqEye(37, 38, 2.2)}`;
    return `${arms}<path d="M32 6l9 12-3 26h-12l-3-26z" fill="${a}"/><path d="M23 18l-7 6 8 2M41 18l7 6-8 2" fill="${b}"/>${v === "giant" ? `<path d="M30 14v24M34 14v24" stroke="${c}" stroke-width="1.2" opacity=".6"/>` : ""}${aqEye(28, 38, 2.4)}${aqEye(36, 38, 2.4)}`;
  },
  naut: (a, b, c) => `<path d="M14 34a18 18 0 1 1 36 0q0 6-6 10h-18q-12-2-12-10z" fill="${a}"/>${[0, 1, 2, 3, 4].map(i => `<path d="M${22 + i * 5} 18q-${4 - i} 12 0 26" stroke="${b}" stroke-width="2.4" fill="none"/>`).join("")}<circle cx="38" cy="32" r="7" fill="none" stroke="${c}" stroke-width="2"/><path d="M12 40q-4 4-2 10M16 42q-2 6 0 10M20 43q0 6 2 10" stroke="${b}" stroke-width="1.8" fill="none"/>${aqEye(16, 36, 2)}`,
  crab: (a, b, c, v) => `${[16, 22, 42, 48].map((x, i) => `<path d="M${x} 38l${i < 2 ? -6 : 6} 8" stroke="${a}" stroke-width="2.4" stroke-linecap="round"/>`).join("")}<path d="M18 26q-8-8-4-14q6 0 6 6q-2 2-2 8zM46 26q8-8 4-14q-6 0-6 6q2 2 2 8z" fill="${a}"/><ellipse cx="32" cy="34" rx="16" ry="11" fill="${a}"/><ellipse cx="32" cy="37" rx="10" ry="5" fill="${b}" opacity=".6"/>${v === "spiky" ? [22, 28, 34, 40].map(x => `<path d="M${x} 25l2-4 2 4" fill="${c}"/>`).join("") : ""}<path d="M27 25v-5M37 25v-5" stroke="${a}" stroke-width="2"/>${aqEye(27, 19, 2.2)}${aqEye(37, 19, 2.2)}`,
  lobster: (a, b, c, v) => `<path d="M24 10q-8 2-6 10l6-4zM40 10q8 2 6 10l-6-4z" fill="${a}"/><path d="M26 18q-2 6 2 10M38 18q2 6-2 10" stroke="${a}" stroke-width="3"/><path d="M32 20q8 0 8 10v14q0 6-8 8q-8-2-8-8v-14q0-10 8-10z" fill="${a}"/>${[34, 39, 44].map(y => `<path d="M25 ${y}h14" stroke="${c}" stroke-width="1.4"/>`).join("")}<path d="M26 52l6 8 6-8z" fill="${b}"/>${v === "spiny" ? `<path d="M28 22l-1-4M36 22l1-4" stroke="${c}" stroke-width="1.6"/>` : ""}<path d="M30 20q-6-10-14-12M34 20q6-10 14-12" stroke="${c}" stroke-width="1" fill="none"/>${aqEye(29, 25, 2)}${aqEye(35, 25, 2)}`,
  shrimp: (a, b, c, v) => `<path d="M46 20q-24-6-30 12q-4 14 8 20q4-8 10-10q10-4 12-22z" fill="${a}"/>${[24, 29, 34, 39].map(x => `<path d="M${x} 24q-6 10-2 20" stroke="${v === "mantis" ? c : b}" stroke-width="2" fill="none"/>`).join("")}<path d="M24 52l-6 6 8-2z" fill="${b}"/><path d="M46 20q6-10 14-12M44 22q8-6 16-4" stroke="${c}" stroke-width="1" fill="none"/>${v === "mantis" ? `<path d="M40 30l6 8-4 2z" fill="${c}"/>` : ""}${aqEye(44, 24, 2.4)}`,
  dolphin: (a, b, c, v) => `<path d="M6 22l8 10-8 8 4-8z" fill="${a}"/><path d="M10 32q10-14 28-12q12 2 16 8l6 2-6 3q-6 8-20 8q-16 0-24-9z" fill="${a}"/><path d="M16 34q12 6 26 4q8-1 12-6q-6 8-20 8q-12 0-18-6z" fill="${b}"/><path d="M28 21l4-9 4 9z" fill="${a}"/><path d="M34 38l-2 7 6-6z" fill="${a}"/>${v === "spots" ? [[22, 26], [28, 24], [34, 27], [40, 25]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="${c}"/>`).join("") : ""}<path d="M54 31q3 1 6 0" stroke="${c}" stroke-width="1" fill="none"/>${aqEye(47, 28, 1.8)}`,
  whale: (a, b, c, v) => {
    if (v === "sperm") return `<path d="M4 20l8 10-8 10 4-10z" fill="${a}"/><path d="M8 30q6-14 22-14h22q6 0 6 8v8q0 10-12 10h-22q-14 0-16-12z" fill="${a}"/><path d="M36 42h18q-2 4-8 5h-14z" fill="${b}"/>${aqEye(46, 30, 1.8)}`;
    const tusk = v === "narwhal" ? `<path d="M56 28l8-8" stroke="#f3ecdc" stroke-width="2.2" stroke-linecap="round"/>` : "";
    const throat = v === "beluga" ? `<path d="M50 26q4-10 8 0" fill="${a}"/>` : `${[0, 1, 2, 3].map(i => `<path d="M34 ${38 + i * 1.6}h20" stroke="${c}" stroke-width=".8" opacity=".6"/>`).join("")}`;
    const fin = v === "hump" ? `<path d="M30 40l-10 12 12-8z" fill="${b}"/>` : `<path d="M30 40l-4 8 8-6z" fill="${a}"/>`;
    const spots = v === "spots" ? [[18, 28], [24, 25], [30, 27]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="${c}"/>`).join("") : "";
    return `<path d="M4 18l10 12-10 12 4-12z" fill="${a}"/><path d="M10 30q8-14 26-14q18 0 22 14q-2 12-24 12q-20 0-24-12z" fill="${a}"/><path d="M20 36q14 8 36-2q-4 8-22 8q-10 0-14-6z" fill="${b}"/>${throat}${fin}${spots}${tusk}${aqEye(48, 30, 1.9)}`;
  },
  seal: (a, b, c, v) => {
    const tusks = v === "walrus" ? `<path d="M28 42l-1 12M36 42l1 12" stroke="#f3ecdc" stroke-width="2.6" stroke-linecap="round"/>` : "";
    const nose = v === "manatee" ? `<ellipse cx="32" cy="40" rx="9" ry="6" fill="${b}"/>` : `<ellipse cx="32" cy="38" rx="7" ry="5" fill="${b}"/>`;
    const pat = v === "spots" ? [[18, 24], [46, 22], [22, 34], [44, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${c}"/>`).join("") : "";
    return `<ellipse cx="32" cy="34" rx="20" ry="18" fill="${a}"/>${pat}${nose}<path d="M31 36h2l-1 2z" fill="#1a1a1a"/>${[-1, 1].map(s => `<path d="M${32 + s * 4} 39q${s * 6} -1 ${s * 10} -3M${32 + s * 4} 40q${s * 6} 1 ${s * 10} 1" stroke="${c}" stroke-width=".9" fill="none"/>`).join("")}${tusks}${aqEye(25, 29, 3)}${aqEye(39, 29, 3)}`;
  },
  turtle: (a, b, c, v) => `<path d="M14 22l-6-4 4 8zM50 22l6-4-4 8zM16 44l-6 6 8-2zM48 44l6 6-8-2z" fill="${b}"/><ellipse cx="32" cy="12" rx="6" ry="6" fill="${b}"/>${aqEye(29, 11, 1.4)}${aqEye(35, 11, 1.4)}<ellipse cx="32" cy="33" rx="17" ry="19" fill="${a}"/>${v === "ridges" ? [24, 32, 40].map(x => `<path d="M${x} 16v34" stroke="${c}" stroke-width="2"/>`).join("") : `<path d="M32 18l7 6v10l-7 6-7-6v-10z" fill="none" stroke="${c}" stroke-width="1.6"/><path d="M25 24l-7-2M39 24l7-2M25 34l-7 4M39 34l7 4M32 40v10" stroke="${c}" stroke-width="1.6"/>`}`,
  star: (a, b, c, v) => { const pts = Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? (v === "fat" ? 15 : 10) : 26, ang = -Math.PI / 2 + i * Math.PI / 5; return `${(32 + r * Math.cos(ang)).toFixed(1)},${(34 + r * Math.sin(ang)).toFixed(1)}`; }).join(" "); return `<polygon points="${pts}" fill="${a}" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>${[[32, 20], [24, 30], [40, 30], [27, 42], [37, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${b}"/>`).join("")}${aqEye(28, 34, 2)}${aqEye(36, 34, 2)}`; },
  urchin: (a, b, c) => `${Array.from({ length: 22 }, (_, i) => { const t = i / 22 * Math.PI * 2; return `<path d="M${(32 + 12 * Math.cos(t)).toFixed(1)} ${(34 + 12 * Math.sin(t)).toFixed(1)}L${(32 + 26 * Math.cos(t)).toFixed(1)} ${(34 + 26 * Math.sin(t)).toFixed(1)}" stroke="${b}" stroke-width="1.6" stroke-linecap="round"/>`; }).join("")}<circle cx="32" cy="34" r="14" fill="${a}"/>${aqEye(27, 32, 2.2)}${aqEye(37, 32, 2.2)}`,
  horse: (a, b, c, v) => `<path d="M30 8q10-2 12 6l8 2-8 4q-2 4-6 6q8 6 6 16q-2 8-10 10q-6 2-6 8q0 4 4 4" stroke="${a}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M28 30q-6 4-6 10" stroke="${b}" stroke-width="3" fill="none"/>${v === "dots" ? [[34, 14], [32, 34], [36, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${c}"/>`).join("") : ""}${v === "leafy" ? `<path d="M24 22l-8-4 4 8zM40 34l10-2-6 8zM22 44l-10 2 8 4z" fill="${b}"/>` : ""}<path d="M30 6l2-4 2 4" fill="${c}"/>${aqEye(36, 13, 2)}`,
  eel: (a, b, c, v) => `<path d="M6 46q10-10 20 0t20 0q6-6 10-12" stroke="${a}" stroke-width="10" fill="none" stroke-linecap="round"/>${v === "bands" ? [12, 20, 28, 36, 44].map(x => `<circle cx="${x}" cy="${x % 16 ? 44 : 46}" r="2.4" fill="${c}" opacity=".9"/>`).join("") : v === "spots" ? [[12, 44], [20, 49], [30, 46], [40, 43], [50, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${c}"/>`).join("") : ""}${v === "ribbon" ? `<path d="M56 34l6-4" stroke="${b}" stroke-width="3" stroke-linecap="round"/>` : ""}${v === "oar" ? `<path d="M50 36q4-14 6-26M54 34q6-12 8-20" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` : ""}<path d="M50 34q4-6 8-4q2 4-2 8" fill="${v === "ribbon" ? b : a}"/><path d="M56 34q2 2 0 4" stroke="${c}" stroke-width="1" fill="none"/>${aqEye(54, 32, 1.8)}`,
  flat: (a, b, c, v) => `<ellipse cx="30" cy="32" rx="20" ry="15" fill="${a}"/><path d="M48 32l12-8v16z" fill="${a}"/><ellipse cx="30" cy="32" rx="20" ry="15" fill="none" stroke="${b}" stroke-width="2.4" stroke-dasharray="2 2"/>${v === "spots" ? [[22, 28], [30, 36], [36, 26], [24, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${c}"/>`).join("") : `<path d="M18 32q12-4 26 0" stroke="${c}" stroke-width="1" fill="none"/>`}${aqEye(16, 28, 2)}${aqEye(19, 23, 2)}`,
  fish: (a, b, c, v) => {
    /* forma del corpo per variante */
    const S = { puffer: [30, 32, 16, 15], porcupine: [30, 32, 15, 14], angel: [30, 32, 15, 17], butterfly: [30, 32, 15, 15], discus: [30, 32, 16, 16], mola: [30, 32, 15, 18], box: [30, 32, 15, 12], slim: [30, 32, 19, 8], needle: [30, 32, 22, 4], trumpet: [30, 32, 21, 6], sword: [28, 32, 18, 9], sail: [28, 34, 18, 9], marlin: [28, 32, 18, 9], barracuda: [30, 32, 21, 7], tuna: [30, 32, 19, 11], neon: [30, 32, 17, 7], betta: [28, 32, 13, 9] }[v] || [30, 32, 18, 12];
    const [cx, cy, rx, ry] = S, tx = cx - rx;
    let tail = v === "mola" ? `<path d="M${tx + 2} ${cy - 10}q-6 10 0 20q-4-10 0-20z" fill="${b}"/>` : v === "betta" ? `<path d="M${tx + 2} ${cy}q-14-18-12 4q-2 18 12-4z" fill="${b}"/><path d="M${cx - 6} ${cy - ry}q6-12 14-6M${cx - 6} ${cy + ry}q4 14 14 8" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>` : `<path d="M${tx + 2} ${cy}l-10 -${Math.max(6, ry * .8)}v${Math.max(12, ry * 1.6)}z" fill="${v === "tang" ? b : v === "gold" ? b : a}"/>`;
    let body = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${a}"/>`;
    let extra = "", mouth = `<path d="M${cx + rx - 3} ${cy + 2}q2 1 3 0" stroke="#111" stroke-width="1" fill="none"/>`;
    const fin = `<path d="M${cx - 4} ${cy - ry + 1}q6-7 12 0z" fill="${a}"/>`;
    const belly = `<ellipse cx="${cx + 2}" cy="${cy + ry * .45}" rx="${rx * .75}" ry="${ry * .38}" fill="${b}" opacity=".55"/>`;
    const eye = aqEye(cx + rx * .55, cy - ry * .25, Math.max(1.6, Math.min(2.8, ry * .22)));
    switch (v) {
      case "clown": extra = [cx - rx * .5, cx + rx * .1, cx + rx * .6].map(x => `<path d="M${x} ${cy - ry}q-3 ${ry} 0 ${ry * 2}" stroke="${c}" stroke-width="5" fill="none"/><path d="M${x} ${cy - ry}q-3 ${ry} 0 ${ry * 2}" stroke="${b}" stroke-width="3" fill="none"/>`).join(""); break;
      case "tang": extra = `<path d="M${cx - rx + 4} ${cy}q${rx} -10 ${rx * 1.6} -2" stroke="${c}" stroke-width="3" fill="none"/>`; break;
      case "puffer": case "porcupine": extra = Array.from({ length: 16 }, (_, i) => { const t = i / 16 * Math.PI * 2; return `<path d="M${(cx + rx * Math.cos(t)).toFixed(1)} ${(cy + ry * Math.sin(t)).toFixed(1)}l${(4 * Math.cos(t)).toFixed(1)} ${(4 * Math.sin(t)).toFixed(1)}" stroke="${c}" stroke-width="1.6"/>`; }).join("") + (v === "porcupine" ? [[24, 28], [30, 36], [34, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${c}"/>`).join("") : ""); break;
      case "angel": extra = [0, 1, 2, 3].map(i => `<path d="M${cx - 10 + i * 6} ${cy - ry + 2}q-4 ${ry} 0 ${ry * 2 - 4}" stroke="${b}" stroke-width="2" fill="none"/>`).join("") + `<path d="M${cx - 6} ${cy - ry}q8-10 14 2M${cx - 6} ${cy + ry}q8 10 14-2" fill="${a}"/>`; break;
      case "butterfly": extra = `<path d="M${cx + 6} ${cy - ry}v${ry * 2}" stroke="${c}" stroke-width="4"/><circle cx="${cx - 8}" cy="${cy + 2}" r="3.4" fill="${c}"/>`; break;
      case "lion": extra = Array.from({ length: 9 }, (_, i) => `<path d="M${cx - 12 + i * 3} ${cy - ry + 2}l${-3 + i * .4} -${10 + (i % 3) * 3}" stroke="${c}" stroke-width="1.4"/>`).join("") + [0, 1, 2, 3, 4].map(i => `<path d="M${cx - 12 + i * 6} ${cy - ry}q-3 ${ry} 0 ${ry * 2}" stroke="${b}" stroke-width="1.8" fill="none"/>`).join("") + `<path d="M${cx + 4} ${cy + ry - 2}l-6 12M${cx} ${cy + ry - 2}l-10 10" stroke="${c}" stroke-width="1.4"/>`; break;
      case "parrot": extra = `<path d="M${cx + rx - 6} ${cy - 4}q6 2 6 6q-2 4-6 4" fill="${b}"/>` + [0, 1, 2].map(i => `<path d="M${cx - 10 + i * 6} ${cy - ry + 2}q-3 ${ry} 0 ${ry * 2 - 4}" stroke="${c}" stroke-width="1.4" fill="none" opacity=".6"/>`).join(""); break;
      case "scorpion": case "grouper": extra = [[24, 30], [30, 36], [36, 28], [20, 36], [40, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${c}"/>`).join("") + (v === "scorpion" ? `<path d="M${cx - 8} ${cy - ry}l2-8 4 6 3-8 3 7 3-6 2 8" fill="${c}"/>` : ""); mouth = `<path d="M${cx + rx - 4} ${cy + 3}q3 2 5-1" stroke="#111" stroke-width="1.6" fill="none"/>`; break;
      case "trigger": extra = `<path d="M${cx - 10} ${cy - ry + 2}q10 8 18 0" fill="${b}"/><path d="M${cx - 2} ${cy + 2}q6 6 12 0" fill="${c}"/>`; break;
      case "box": extra = [[24, 28], [32, 28], [40, 28], [28, 34], [36, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${b}"/>`).join(""); body = `<rect x="${cx - rx}" y="${cy - ry}" width="${rx * 2}" height="${ry * 2}" rx="7" fill="${a}"/>`; break;
      case "mandarin": extra = [0, 1, 2, 3].map(i => `<path d="M${cx - 12 + i * 7} ${cy - ry + 2}q4 ${ry} -2 ${ry * 2 - 4}" stroke="${b}" stroke-width="2.4" fill="none"/>`).join("") + `<path d="M${cx - 14} ${cy}h22" stroke="${c}" stroke-width="2"/>`; break;
      case "trumpet": case "needle": extra = `<path d="M${cx + rx - 2} ${cy}h10" stroke="${a}" stroke-width="${v === "needle" ? 2 : 3}" stroke-linecap="round"/>`; break;
      case "mola": extra = `<path d="M${cx - 2} ${cy - ry}l2-10 4 10zM${cx - 2} ${cy + ry}l2 10 4-10z" fill="${a}"/>`; break;
      case "sword": case "marlin": case "sail": extra = `<path d="M${cx + rx - 2} ${cy - 1}h${v === "sword" ? 18 : 14}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>` + (v === "sail" ? `<path d="M${cx - 12} ${cy - ry + 1}q8-20 22-2z" fill="${c}" opacity=".85"/>` : v === "marlin" ? [0, 1, 2].map(i => `<path d="M${cx - 8 + i * 6} ${cy - ry + 2}v${ry * 2 - 4}" stroke="${c}" stroke-width="1.4"/>`).join("") : ""); break;
      case "tuna": extra = `<path d="M${cx - 10} ${cy + ry - 1}l2 4 2-4 2 4 2-4 2 4" stroke="${c}" stroke-width="1.4" fill="none"/><path d="M${cx - rx + 4} ${cy}h${rx * 1.4}" stroke="${c}" stroke-width="1.6" opacity=".7"/>`; break;
      case "barracuda": extra = [0, 1, 2, 3].map(i => `<path d="M${cx - 12 + i * 6} ${cy - ry + 1}l-2 5" stroke="${c}" stroke-width="1.4"/>`).join(""); mouth = `<path d="M${cx + rx - 6} ${cy + 1}l6-1-1 3z" fill="#fff"/>`; break;
      case "angler": case "deepsea": extra = `<path d="M${cx + 4} ${cy - ry}q6-12 16-8" stroke="${c}" stroke-width="1.4" fill="none"/><circle cx="${cx + 20}" cy="${cy - ry - 8}" r="2.6" fill="${c}"/>`; mouth = `<path d="M${cx + rx - 10} ${cy + 3}q6 6 10-2" stroke="#fff" stroke-width="1.6" stroke-dasharray="1.4 1.4" fill="#111"/>`; break;
      case "flying": extra = `<path d="M${cx - 4} ${cy}q-4-18 14-16q-2 10-14 16z" fill="${c}" opacity=".85"/>`; break;
      case "lantern": extra = [[24, 36], [30, 37], [36, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${c}"/>`).join(""); break;
      case "bream": extra = `<path d="M${cx + rx * .4} ${cy - ry * .5}q2 4 0 8" stroke="${c}" stroke-width="2.4" fill="none"/>`; break;
      case "dots": extra = [[22, 30], [30, 27], [36, 33], [26, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="${c}"/>`).join(""); break;
      case "spots": extra = [[20, 28], [26, 25], [32, 29], [38, 26], [28, 33]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="${c}"/>`).join(""); break;
      case "rainbow": extra = `<path d="M${cx - rx + 4} ${cy + 1}h${rx * 1.6}" stroke="${b}" stroke-width="3.4" stroke-linecap="round"/>` + [[22, 27], [30, 25], [38, 27]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="${c}"/>`).join(""); break;
      case "koi": extra = `<path d="M${cx - 8} ${cy - ry + 2}q8 6 4 14q-8 0-10-8z" fill="${b}"/><path d="M${cx + 4} ${cy + 2}q6-2 6 4q-4 2-6-4z" fill="${c}"/>`; break;
      case "discus": extra = [0, 1, 2, 3, 4].map(i => `<path d="M${cx - 12 + i * 6} ${cy - ry + 3}q-3 ${ry} 0 ${ry * 2 - 6}" stroke="${c}" stroke-width="1.4" fill="none" opacity=".7"/>`).join(""); break;
      case "neon": extra = `<path d="M${cx - rx + 2} ${cy - 2}h${rx * 1.7}" stroke="${b}" stroke-width="2.6" stroke-linecap="round"/><path d="M${cx - rx + 4} ${cy + 3}h${rx}" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`; break;
      case "piranha": mouth = `<path d="M${cx + rx - 7} ${cy + 3}l2 3 2-3 2 3 2-3" stroke="#fff" stroke-width="1.2" fill="none"/>`; break;
      case "sturgeon": extra = [0, 1, 2, 3, 4].map(i => `<path d="M${cx - 14 + i * 6} ${cy - ry + 1}l2 3 2-3" fill="${c}"/>`).join("") + `<path d="M${cx + rx} ${cy}l6 2" stroke="${a}" stroke-width="3" stroke-linecap="round"/>`; break;
      case "catfish": extra = `<path d="M${cx + rx - 2} ${cy + 2}q8 2 12 10M${cx + rx - 2} ${cy + 1}q10-2 14 4" stroke="${c}" stroke-width="1.2" fill="none"/>`; break;
      case "gold": extra = `<path d="M${cx - 4} ${cy + ry - 1}q4 8 10 2" fill="${b}"/>`; break;
    }
    return `${tail}${v === "box" || v === "mola" ? "" : fin}${body}${v === "box" || v === "neon" ? "" : belly}${extra}${mouth}${eye}`;
  },
};
/* colore di sfondo del cerchio: tinta chiara del colore principale */
function aqSvg(i, size = 46) {
  const [, t, a, b, c, v] = AQ[i % AQ.length];
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">${(AQ_DRAW[t] || AQ_DRAW.fish)(a, b, c, v)}</svg>`;
}
/* avversari: una specie a caso per ogni nome, diversa da quelle già al tavolo; aqShuffle() rimescola a ogni nuova domanda */
let AQ_MAP = {};
function aqShuffle() { AQ_MAP = {}; }
function aqPick(key) {
  if (AQ_MAP[key] != null) return AQ_MAP[key];
  const used = new Set(Object.values(AQ_MAP)); let i, n = 0;
  do { i = Math.floor(Math.random() * AQ.length); } while (used.has(i) && ++n < 200);
  return (AQ_MAP[key] = i);
}
function aqAvatar(key, big) {
  const i = aqPick(String(key)), [name, , a] = AQ[i];
  return `<span class="gwav aqav${big ? " big" : ""}" style="--ac:${a}" title="${name}" role="img" aria-label="${name}">${aqSvg(i, big ? 40 : 30)}</span>`;
}
/* avatar di una specie precisa, per gli esempi fissi delle lezioni */
function aqAvatarOf(name, big) {
  const i = Math.max(0, AQ.findIndex(x => x[0] === name)), [nm, , a] = AQ[i];
  return `<span class="gwav aqav${big ? " big" : ""}" style="--ac:${a}" title="${nm}" role="img" aria-label="${nm}">${aqSvg(i, big ? 40 : 30)}</span>`;
}
