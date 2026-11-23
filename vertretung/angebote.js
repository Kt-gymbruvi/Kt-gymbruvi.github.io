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
    text: 'Brett-, Karten- und Würfelspiele: zu zweit oder in der Gruppe, gegen den Rechner oder online in der Klasse.',
    // Knopf an der Gruppe: Online ist eine Art zu spielen, kein eigenes Spiel
    aktion: {
      text: 'Online mit der Klasse spielen',
      info: 'Lobby am Smartboard öffnen – die Klasse kommt per Handy, bietet Spiele an und steigt ein',
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
    titel: 'Murdoku',
    text: 'Kriminalrätsel: Wer stand wo? Aus den Hinweisen die Plätze finden – und den Mörder, der mit dem Opfer allein war.',
    adresse: 'vertretung/murdoku/',
    gruppe: 'knobeln',
    logo: 'murdoku',
    marken: ['1 Person', '3 Stufen', 'Notizen und Tipp'],
  },
  {
    titel: 'Chaos-Flitzer 3000',
    text: 'Würfeln, flitzen, gemein sein: Das Rennspiel mit 36 verrückten Läufern. Am Beamer laufen, die Schüler entscheiden per Handy.',
    adresse: 'vertretung/chaos-flitzer/',
    gruppe: 'spiele',
    logo: 'chaosflitzer',
    marken: ['2 bis 6 Personen', 'Handys treten bei', 'online in der Klasse'],
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
    titel: 'Flip 7',
    text: 'Karten ziehen oder aufhören: Wer 7 verschiedene Zahlen sammelt, bekommt den Bonus – doppelte Zahl heißt Bust. Am Beamer laufen, die Schüler spielen per Handy.',
    adresse: 'vertretung/flip-7/',
    gruppe: 'spiele',
    logo: 'flip7',
    marken: ['2 bis 6 Personen', 'Handys treten bei', 'online in der Klasse'],
  },
  {
    titel: 'Schiffe versenken',
    text: 'Flotte verstecken und die Schiffe des Gegners aufspüren – gegen den Rechner, zu zweit an einem Gerät oder online gegen eine Mitschülerin oder einen Mitschüler.',
    adresse: 'vertretung/schiffe-versenken/',
    gruppe: 'spiele',
    logo: 'schiffe',
    marken: ['2 Personen', 'gegen Rechner', 'online'],
  },
  {
    titel: 'Würfelglück',
    text: 'Fünf Würfel, drei Würfe, dreizehn Felder: Pasch, Full House, Straße oder Fünfling.',
    adresse: 'spielen/wuerfelglueck/',
    gruppe: 'spiele',
    logo: 'wuerfelglueck',
    marken: ['1 bis 6 Personen', 'gegen Rechner', 'online'],
  },
  {
    titel: 'Farbenjagd',
    text: 'Kartenspiel: Farbe oder Zahl bedienen, Aussetzen, +2 und Joker – wer zuerst alle Karten los ist, gewinnt.',
    adresse: 'spielen/farbenjagd/',
    gruppe: 'spiele',
    logo: 'farbenjagd',
    marken: ['2 bis 6 Personen', 'gegen Rechner', 'online'],
  },
  {
    titel: 'Ecke an Ecke',
    text: 'Legespiel mit 21 Steinen: Eigene Steine dürfen sich nur an den Ecken berühren.',
    adresse: 'spielen/ecke-an-ecke/',
    gruppe: 'spiele',
    logo: 'eckeanecke',
    marken: ['2 bis 4 Personen', 'gegen Rechner', 'online'],
  },
  {
    titel: 'Grenzland',
    text: 'Eroberungsspiel: Truppen verteilen, mit Würfeln angreifen, Gebiete halten.',
    adresse: 'spielen/grenzland/',
    gruppe: 'spiele',
    logo: 'grenzland',
    marken: ['2 bis 6 Personen', 'gegen Rechner', 'online'],
  },
  {
    titel: 'Inselhandel',
    text: 'Siedeln, bauen und tauschen auf einer Insel aus Sechsecken – Holz, Lehm, Wolle, Korn und Erz.',
    adresse: 'spielen/inselhandel/',
    gruppe: 'spiele',
    logo: 'inselhandel',
    marken: ['2 bis 4 Personen', 'gegen Rechner', 'online'],
  },
  {
    titel: 'Schienennetz',
    text: 'Bahnstrecken durch Niedersachsen bauen und Aufträge erfüllen – von Emden bis Göttingen.',
    adresse: 'spielen/schienennetz/',
    gruppe: 'spiele',
    logo: 'schienennetz',
    marken: ['2 bis 5 Personen', 'gegen Rechner', 'online'],
  },
  {
    titel: 'Kachelland',
    text: 'Plättchen anlegen, Wege, Städte und Kapellen bauen, Figuren geschickt setzen.',
    adresse: 'spielen/kachelland/',
    gruppe: 'spiele',
    logo: 'kachelland',
    marken: ['2 bis 5 Personen', 'gegen Rechner', 'online'],
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
