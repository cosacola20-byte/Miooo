/* ================= GUIDA: come usare il solver ================= */
const GW_GUIDE = [
  { i: "🚀", t: "In 30 secondi", open: true, b: `
    <p>Gli strumenti (spot personalizzato, soluzioni salvate, tabelle, impostazioni, precisione e questa guida) sono nel menu <b>⋯ Strumenti</b> a destra delle schede.</p>
    <ol>
      <li><b>Scegli la linea preflop</b>: tocca le azioni dei giocatori nella striscia in alto (chi apre, chi chiama, chi rilancia). Le tabelle preflop si aggiornano a ogni scelta.</li>
      <li><b>Scegli il flop</b>: tocca 3 carte, oppure premi <b>🎲 Flop casuale</b>.</li>
      <li><b>Scegli le size</b> nella finestra "Prima di calcolare" e premi <b>Calcola ▶</b>.</li>
      <li><b>Leggi la strategia</b> nella griglia 13x13 e naviga l'albero toccando le azioni.</li>
    </ol>
    <p>Per ricominciare da zero in qualsiasi momento: <b>⟲ Nuova mano</b>.</p>` },
  { i: "1", t: "La linea preflop", b: `
    <p>La striscia in alto mostra i 6 posti (UTG, HJ, CO, BTN, SB, BB). Tocca l'azione di chi deve parlare: fold, open, call, 3-bet, 4-bet. Quando restano due giocatori e la linea finisce con un call, lo spot passa al flop.</p>
    <ul>
      <li>La griglia a destra mostra la range di chi deve agire, con i colori delle azioni.</li>
      <li>Toccando un passo già fatto nella striscia torni indietro a quel punto.</li>
      <li><b>⋯ Strumenti → Tabelle preflop</b> sceglie quali tabelle preflop usare, anche le tue personali (vedi sotto).</li>
      <li><b>⋯ Strumenti → Spot personalizzato</b> apre lo spot personalizzato: scegli tu posizioni, piatto, stack e range senza passare dal preflop.</li>
    </ul>` },
  { i: "2", t: "Board e size prima del calcolo", b: `
    <p>Puoi dare 3, 4 o 5 carte: il solver parte da quella street. Con 3 carte risolve flop e turn (il river arriva a showdown oppure lo risolvi dopo), con 4 turn e river, con 5 solo il river.</p>
    <p>Prima del calcolo si apre la finestra delle size:</p>
    <ul>
      <li><b>Bet</b> e <b>raise</b> per ogni street, in % del piatto. I preset sono già pronti, e con <b>+</b> aggiungi una size personalizzata (da 5% a 500%).</li>
      <li>La puntata minima è 1bb e i raise rispettano il min-raise legale.</li>
      <li>Al river l'<b>all-in</b> è sempre disponibile.</li>
      <li>Più size = albero più grande = calcolo più lento. Per studiare bastano 1-2 size per street.</li>
    </ul>
    <p>Se non vuoi la finestra ogni volta, togli la spunta "Chiedi sempre prima di calcolare" e usa <b>⚙ Albero</b> per le impostazioni fisse.</p>` },
  { i: "3", t: "Durante il calcolo", b: `
    <p>La barra mostra l'avanzamento. Il primo passo prepara le equity di tutti i turn e river, poi il solver migliora la strategia a ogni iterazione.</p>
    <ul>
      <li>Puoi fermare tutto con <b>Annulla il calcolo e nuova mano</b>.</li>
      <li>La <b>precisione</b> (Normale 16x8, Alta 24x12) indica quanti turn e river vengono campionati. Alta è più lenta e più vicina alla soluzione completa. Il pannello <b>⋯ Strumenti → Precisione del solver</b> mostra quanto si scosta ciascuna dalla soluzione completa su flop di prova.</li>
      <li>Le soluzioni già calcolate restano in memoria: rifare lo stesso spot è immediato. Le trovi in <b>⋯ Strumenti → Soluzioni salvate</b>.</li>
    </ul>` },
  { i: "4", t: "Leggere la strategia", b: `
    <ul>
      <li><b>Griglia 13x13</b>: ogni casella è una mano (coppie in diagonale, suited sopra, offsuit sotto). I colori sono le azioni, le proporzioni sono le frequenze.</li>
      <li><b>Tocca una mano</b> per vedere tutte le sue combo con frequenza ed EV di ogni azione, e l'<b>equity %</b> contro la range avversaria a quel nodo.</li>
      <li><b>EV</b> in big blind: è quanto vinci in media da questo punto in poi. Il <b>fold vale sempre 0</b>, come negli altri solver: conta solo ciò che vinci da qui.</li>
      <li>Il riquadro delle azioni in alto riassume la frequenza totale di ogni azione su tutta la range.</li>
      <li><b>Range</b> mostra le range di entrambi i giocatori al nodo, con fasce di equity e grafico.</li>
    </ul>` },
  { i: "5", t: "Navigare l'albero", b: `
    <ul>
      <li>Tocca un'azione (check, bet 33%, call...) per scendere nel nodo successivo. La striscia in alto registra il percorso: tocca un passo per tornare lì.</li>
      <li>Quando arriva una nuova carta scegli il turn o il river, oppure usa <b>Turn casuale</b> / <b>River casuale</b>.</li>
      <li>Se hai risolto solo il flop, al turn premi <b>Risolvi turn e river</b> per il dettaglio completo di quella carta.</li>
    </ul>` },
  { i: "6", t: "Nodelock: sfruttare un avversario", b: `
    <p>Il nodelock ti dice come cambiare strategia contro un giocatore che sbaglia.</p>
    <ol>
      <li>Vai al nodo in cui agisce l'avversario e premi <b>🔒 Nodelock</b>.</li>
      <li>Trascina le maniglie per dividere il 100% tra le azioni (per esempio "folda troppo al c-bet") oppure modifica le combo.</li>
      <li>Premi <b>Blocca e ricalcola</b>: il solver ricalcola il resto dell'albero e mostra la tua strategia di sfruttamento. Sotto trovi le frequenze GTO senza nodelock per confronto.</li>
    </ol>
    <p>Con <b>Blocca un avversario su tutto l'albero</b> applichi un profilo (per esempio i dati del pool NL) a tutti i nodi. <b>Sblocca questo nodo</b> toglie il lock.</p>` },
  { i: "7", t: "Albero, tabelle e size personalizzate", b: `
    <ul>
      <li><b>⚙ Albero</b>: size fisse per flop, turn e river, raise per street (fino a 2), size OOP diverse da IP, donk e lead, all-in, iterazioni e rake.</li>
      <li><b>⋯ Strumenti → Tabelle preflop</b>: dipingi una range, dagli un nome e premi "Salva come nuova". La ritrovi negli editor delle range e nell'albero preflop.</li>
      <li><b>✎ Modifica combo</b> nelle range: cambia a mano la range di un giocatore prima di calcolare.</li>
    </ul>` },
  { i: "8", t: "Report flop, Allenati e preflop", b: `
    <ul>
      <li><b>Report flop</b>: la strategia aggregata su tanti flop per lo stesso spot preflop. Utile per capire quando si punta tanto o poco a seconda della texture.</li>
      <li><b>Allenati</b>: giochi la mano contro il solver. A ogni decisione ricevi il voto (stelle), l'EV perso e il commento del coach. <b>▶ Rivedi la mano</b> la ripercorre, <b>» Mano successiva</b> ne distribuisce un'altra.</li>
      <li><b>🎲 Allenati su un flop casuale</b>: stesso spot preflop, flop nuovo scelto con la frequenza reale dei board.</li>
      <li><b>Solver preflop</b>: continua l'albero preflop oltre le tabelle (4-bet, 5-bet all-in).</li>
    </ul>` },
  { i: "💡", t: "Consigli di studio", b: `
    <ul>
      <li>Parti dagli spot più frequenti: BTN vs BB e CO vs BB single raised pot.</li>
      <li>Non memorizzare le frequenze esatte: cerca il perché (quali mani puntano, quali fanno check, quali blocker contano).</li>
      <li>Confronta 2-3 flop simili prima di trarre una regola, oppure usa il Report flop.</li>
      <li>Dopo aver studiato uno spot, giocalo in <b>Allenati</b> finché il punteggio supera l'80%.</li>
    </ul>` },
  { i: "📖", t: "Glossario rapido", b: `
    <dl class="gwgl">
      <dt>IP / OOP</dt><dd>In posizione / fuori posizione (chi parla per ultimo / per primo dopo il flop).</dd>
      <dt>SRP</dt><dd>Single raised pot: open e call preflop.</dd>
      <dt>EV</dt><dd>Valore atteso in big blind, da questo nodo in poi.</dd>
      <dt>Equity</dt><dd>La quota di piatto che vinceresti se tutte le carte uscissero senza altre puntate.</dd>
      <dt>Combo</dt><dd>Una singola combinazione di carte (AK ha 16 combo, AKs 4, AA 6).</dd>
      <dt>Sfruttabilità</dt><dd>Quanto perderebbe la strategia contro l'avversario perfetto: più è bassa, più la soluzione è precisa.</dd>
      <dt>Nodelock</dt><dd>Fissare la strategia di un giocatore per vedere la risposta migliore dell'altro.</dd>
    </dl>` }
];
function gwGuideModal() {
  return `<div class="gwmodal gwguide"><div class="gwmodal-b" style="max-width:760px"><div class="gwhead"><b>❓ Come usare il solver</b><button class="gwbtn ghost" data-gguide="0">Chiudi</button></div>
    ${GW_GUIDE.map(s => `<details ${s.open ? "open" : ""}><summary><span class="gwg-i">${s.i}</span>${s.t}</summary><div class="gwg-b">${s.b}</div></details>`).join("")}
  </div></div>`;
}

