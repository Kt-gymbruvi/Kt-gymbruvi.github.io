/*
 * Angebote für Vertretungsstunden – eine Liste für die Seite „Vertretung“ und die Suche der Startseite.
 * Neues Angebot: Ordner anlegen, hier einen Eintrag ergänzen (Komma nicht vergessen).
 *
 *   adresse  vom Hauptordner der Plattform aus (z. B. 'vertretung/sudoku/')
 *   gruppe   'knobeln' | 'spiele'
 *   logo     Name aus gemeinsam/symbole.js (zeigt gemeinsam/<name>-logo.svg)
 *   marken   kleine Hinweise unter dem Titel
 *   liste    false = nicht in der Liste der Seite, nur über die Suche der Startseite auffindbar
 */
window.VERTRETUNG_GRUPPEN = [
  { id: 'knobeln', name: 'Knobeln', text: 'Rätsel zum Alleinlösen – jedes ist neu und genau eine Lösung.' },
  {
    id: 'spiele',
    name: 'Spiele',
    text: 'Brett- und Würfelspiele: zu zweit, gegen den Rechner oder online in der Klasse.',
    // Knopf an der Gruppe: Online ist eine Art zu spielen, kein eigenes Spiel
    aktion: {
      text: 'Online mit der Klasse spielen',
      info: 'Raum anlegen, Code oder QR-Code teilen, Spiele anbieten und einsteigen',
      adresse: 'spielen/lobby/',
      logo: 'spielraum',
    },
  },
]

window.VERTRETUNG = [
  {
    titel: 'Sudoku',
    text: 'Zahlen von 1 bis 9 so verteilen, dass keine doppelt vorkommt. Mit Notizen, Prüfen und Tipp.',
    adresse: 'vertretung/sudoku/',
    gruppe: 'knobeln',
    logo: 'sudoku',
    marken: ['1 Person', '3 Stufen'],
  },
  {
    titel: 'Slitherlink',
    text: 'Aus den Zahlen eine einzige geschlossene Linie legen – auf Quadraten oder Sechsecken.',
    adresse: 'vertretung/slitherlink/',
    gruppe: 'knobeln',
    logo: 'slitherlink',
    marken: ['1 Person', '3 Stufen', 'Quadrate oder Sechsecke'],
  },
  {
    titel: 'Einstein-Rätsel',
    text: 'Wer wohnt wo? Aus den Hinweisen herausfinden, wie alles zusammenpasst.',
    adresse: 'vertretung/logikraetsel/',
    gruppe: 'knobeln',
    logo: 'einstein',
    marken: ['1 Person', '3 Stufen', '3 Themen'],
  },
  {
    titel: 'Chaos-Flitzer 3000',
    text: 'Würfeln, flitzen, gemein sein: Das Rennspiel mit 36 verrückten Läufern, jeder mit einer Fähigkeit, die die Regeln bricht.',
    adresse: 'vertretung/chaos-flitzer/',
    gruppe: 'spiele',
    logo: 'chaosflitzer',
    marken: ['2 bis 6 Personen', 'mit Computerspielern', '4 Rennen'],
  },
  {
    titel: 'Vier gewinnt',
    text: 'Vier Steine in einer Reihe: waagerecht, senkrecht oder schräg.',
    adresse: 'spielen/vier-gewinnt/',
    gruppe: 'spiele',
    logo: 'viergewinnt',
    marken: ['2 Personen', 'gegen Rechner', 'online'],
  },
  {
    titel: 'Mühle',
    text: 'Setzen, ziehen, springen – Mühlen bilden und Steine wegnehmen.',
    adresse: 'spielen/muehle/',
    gruppe: 'spiele',
    logo: 'muehle',
    marken: ['2 Personen', 'gegen Rechner', 'online'],
  },
  {
    titel: 'Schach',
    text: 'Mit allen Regeln: Rochade, en passant, Umwandlung, Matt und Patt.',
    adresse: 'spielen/schach/',
    gruppe: 'spiele',
    logo: 'schach',
    marken: ['2 Personen', 'gegen Rechner', 'online'],
  },
  {
    titel: 'Spielraum (online spielen)',
    text: 'Die Klasse spielt gegeneinander: Raum mit Code oder QR-Code anlegen, Spiele anbieten und einsteigen.',
    adresse: 'spielen/lobby/',
    gruppe: 'spiele',
    logo: 'spielraum',
    marken: ['ganze Klasse', 'online'],
    liste: false,
  },
]
