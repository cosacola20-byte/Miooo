# Orca School Poker

La scuola di poker cash 6-max: dalle basi del NL2 fino al NL1000.

## Come provarla

Apri `index.html` nel browser (doppio clic). Non serve installare niente.

In alternativa, da terminale nella cartella del progetto:

```
python3 -m http.server 8000
```

e poi vai su http://localhost:8000

## Com'è organizzato il progetto

```
index.html          la pagina: intestazione, schede e l'elenco dei file da caricare
css/                lo stile, un file per sezione (00-reset, 01-generale, 06-coaching, ...)
js/data/            le tabelle di dati grandi (range preflop, spot, report del solver)
js/app/             il codice, un file per sezione (05-drill, 23-coaching, 54-mindset, ...)
tools/build.py      rimette tutto in un unico file HTML
```

I file hanno un numero davanti perché **l'ordine conta**: `index.html` li carica
dal più basso al più alto, prima i dati e poi il codice. Se aggiungi un file nuovo,
aggiungi anche la sua riga in `index.html` nel punto giusto.

Per trovare una funzione, cerca il suo nome in tutta la cartella `js/`
(nel tuo editor: "Cerca nei file").

## Creare il file unico

Per pubblicare o condividere l'app come una sola pagina HTML:

```
python3 tools/build.py
```

Il risultato è `dist/orca-school-poker.html`.

## Dove vengono salvati i progressi

Nel browser di chi usa l'app (`localStorage` e IndexedDB). Se l'app è pubblicata
su claude.ai con il database attivo, i progressi del proprietario si sincronizzano
tra i suoi dispositivi.
