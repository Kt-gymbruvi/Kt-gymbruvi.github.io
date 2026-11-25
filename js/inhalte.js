/*
 * Inhalte der Startseite – nur diese Datei muss man zum Ergänzen ändern.
 *
 * Neues Material:
 *   1. Datei in den Ordner „materialien/“ legen (Dateiname ohne Leerzeichen und Umlaute,
 *      z. B. „bruchrechnung-merkblatt.pdf“).
 *   2. Unten in MATERIALIEN einen Eintrag ergänzen (Komma am Ende nicht vergessen).
 *
 * Alles hier ist öffentlich sichtbar – keine Schülerdaten, keine Prüfungslösungen,
 * keine Scans aus Schulbüchern.
 *
 * Symbole: Namen aus gemeinsam/symbole.js (z. B. 'pokal', 'megafon', 'timer'). Ein Emoji geht auch.
 * „nur“: wer einen Eintrag sieht – 'lehrkraft' (nur angemeldet), 'gast' (nur ohne Anmeldung), sonst alle.
 */

/** Name und Begrüßung der Seite */
window.SEITE = {
  titel: 'Lehrraum',
  zeile: 'Dein digitaler Unterrichtsraum',
  // Begrüßung für angemeldete Lehrkräfte
  willkommen: 'Willkommen in deinem Lehrraum!',
  willkommenText: 'Dein zentraler Ort für einen modernen, interaktiven und individuellen Unterricht.',
  // Begrüßung ohne Anmeldung (Schülerinnen und Schüler)
  gastTitel: 'Mitmachen und lernen',
  gastText: 'Gib die PIN vom Beamer ein – oder stöbere in den Lernangeboten.',
  // Bereiche, die es noch nicht gibt, in der Seitenleiste mit dem Hinweis „folgt“ zeigen (false = weglassen)
  geplantesZeigen: true,
}

const PLATTFORM = 'https://kt-gymbruvi.github.io'

/**
 * Seitenleiste links.
 *   adresse: Ziel. Solange sie fehlt (null), ist der Bereich noch nicht gebaut („folgt“, nur für Lehrkräfte sichtbar).
 */
window.NAVIGATION = [
  { titel: 'Startseite', symbol: 'haus', bild: 'gemeinsam/startseite-logo.svg', adresse: './', hier: true },
  { titel: 'Meine Klassen', symbol: 'klassen', bild: 'gemeinsam/klassen-logo.svg', adresse: PLATTFORM + '/Lehrraum/#/klassen', nur: 'lehrkraft' },
  { titel: 'Notenbuch', symbol: 'notenbuch', bild: 'gemeinsam/notenbuch-logo.svg', adresse: PLATTFORM + '/Notenbuch/', nur: 'lehrkraft' },
  { titel: 'Quizzo', symbol: 'pokal', bild: 'gemeinsam/quizzo-symbol.png', adresse: PLATTFORM + '/Quizzo/' },
  { titel: 'Klassenfunk', symbol: 'megafon', bild: 'gemeinsam/klassenfunk-symbol.png', adresse: PLATTFORM + '/Klassenfunk/' },
  { titel: 'Lernangebote', symbol: 'lernen', bild: 'gemeinsam/lernen-logo.svg', adresse: 'lernen/' },
  { titel: 'Vertretung', symbol: 'vertretung', bild: 'gemeinsam/vertretung-logo.svg', adresse: 'vertretung/' },
  { titel: 'Interaktive Tafel', symbol: 'bildschirm', bild: 'gemeinsam/tafel-logo.svg', adresse: PLATTFORM + '/Lehrraum/#/tafel', nur: 'lehrkraft' },
  { titel: 'Tafel (Gast)', symbol: 'bildschirm', bild: 'gemeinsam/tafel-logo.svg', adresse: PLATTFORM + '/Lehrraum/#/tafel?gast=1', nur: 'gast' }, // ohne Anmeldung, nichts wird gespeichert
  { titel: 'Materialien', symbol: 'bibliothek', adresse: '#material-bereich', nur: 'material' }, // erscheint nur, wenn es Materialien gibt
  { titel: 'Werkzeuge', symbol: 'werkzeug', bild: 'gemeinsam/werkzeuge-logo.svg', adresse: '#werkzeuge-bereich' },
]

/**
 * Mitmachen mit der PIN vom Beamer (Fassung ohne Anmeldung): Die PIN wird an diese Adressen angehängt.
 * (Quiz und Abstimmung haben getrennte PINs; deshalb wählt man, wohin es geht.)
 */
window.MITMACHEN = {
  quiz: PLATTFORM + '/Quizzo/#/mitspielen?pin=',
  abstimmung: PLATTFORM + '/Klassenfunk/#/mitmachen?pin=',
}

/**
 * Große Kacheln (Links auf eigene Seiten).
 *   farbe: 'unterrichten' | 'lernen' | 'tafel' | 'interaktion' | 'bibliothek' | 'quizzo' | 'klassenfunk'
 *   bild: eigenes Logo (Pfad) statt Symbol, nur für Quizzo und Klassenfunk
 *   textGast: anderer Text ohne Anmeldung (optional)
 *   handy: false = auf schmalen Bildschirmen ohne Anmeldung ausblenden (optional)
 */
window.LINKS = [
  {
    symbol: 'klassen',
    bild: 'gemeinsam/klassen-logo.svg',
    farbe: 'unterrichten',
    titel: 'Meine Klassen',
    text: 'Klassenräume verwalten und starten',
    adresse: PLATTFORM + '/Lehrraum/#/klassen',
    qr: false, // Klassen liegen nur auf dem eigenen Gerät – ein QR-Code dorthin nützt niemandem
    nur: 'lehrkraft',
  },
  {
    symbol: 'pokal',
    bild: 'gemeinsam/quizzo-symbol.png',
    farbe: 'bibliothek',
    titel: 'Quizzo',
    text: 'Interaktive Quizze erstellen und spielen',
    textGast: 'Mit PIN oder Aufgaben-Code beim Quiz mitspielen',
    adresse: PLATTFORM + '/Quizzo/',
  },
  {
    symbol: 'megafon',
    bild: 'gemeinsam/klassenfunk-symbol.png',
    farbe: 'interaktion',
    titel: 'Klassenfunk',
    text: 'Abstimmungen und Umfragen',
    textGast: 'Live abstimmen – mit PIN, anonym',
    adresse: PLATTFORM + '/Klassenfunk/',
  },
  {
    symbol: 'lernen',
    bild: 'gemeinsam/lernen-logo.svg',
    farbe: 'lernen',
    titel: 'Lernangebote',
    text: 'Materialien und Lernpfade',
    textGast: 'Simulationen, Erklärungen und Übungen – nach Fach und Jahrgang',
    adresse: 'lernen/',
  },
  {
    symbol: 'vertretung',
    bild: 'gemeinsam/vertretung-logo.svg',
    farbe: 'unterrichten',
    titel: 'Vertretung',
    text: 'Rätsel und Spiele für Vertretungsstunden',
    textGast: 'Sudoku, Schach, Vier gewinnt und mehr – allein oder gegeneinander',
    adresse: 'vertretung/',
  },
  {
    symbol: 'bildschirm',
    bild: 'gemeinsam/tafel-logo.svg',
    farbe: 'tafel',
    titel: 'Interaktive Tafel',
    text: 'Digital unterrichten',
    adresse: PLATTFORM + '/Lehrraum/#/tafel',
    nur: 'lehrkraft',
  },
  {
    symbol: 'bildschirm',
    bild: 'gemeinsam/tafel-logo.svg',
    farbe: 'tafel',
    titel: 'Tafel als Gast',
    text: 'Ohne Anmeldung schreiben und zeichnen – nichts wird gespeichert',
    adresse: PLATTFORM + '/Lehrraum/#/tafel?gast=1',
    qr: false,
    nur: 'gast',
    handy: false, // am Handy ohne Anmeldung ausgeblendet (dort zählt nur die PIN)
  },
]

/**
 * Meine Klassen (nur für angemeldete Lehrkräfte). Die Klassen selbst liegen auf dem Gerät und werden in der
 * Lehrraum-App angelegt; hier stehen nur die Adressen.
 */
window.KLASSEN = {
  verwalten: PLATTFORM + '/Lehrraum/#/klassen',
  neu: PLATTFORM + '/Lehrraum/#/klassen?neu=1',
  tafel: PLATTFORM + '/Lehrraum/#/tafel?klasse=', // dahinter kommt die Kennung der Klasse
  // Die Startseite zeigt immer alle Klassen in einer Reihe; die Karten passen ihre Größe an.
}

/**
 * Werkzeuge: kleine Web-Apps im Ordner werkzeuge/<name>/index.html
 * (eigene oder aus Claude-Artefakten übernommen – Anleitung in werkzeuge/ANLEITUNG.md).
 *   bereich: Überschrift, unter der das Werkzeug erscheint (z. B. 'Unterricht', 'Sport', 'Biologie')
 */
window.WERKZEUGE = [
  {
    bereich: 'Unterricht',
    symbol: 'timer',
    bild: 'gemeinsam/timer-logo.svg',
    titel: 'Timer',
    text: 'Countdown für Arbeitsphasen – groß für den Beamer, mit Signalton.',
    adresse: 'werkzeuge/timer/',
  },
  {
    bereich: 'Unterricht',
    symbol: 'wuerfel',
    bild: 'gemeinsam/gruppen-logo.svg',
    titel: 'Gruppen & Zufall',
    text: 'Gruppen oder Paare auslosen, eine Person ziehen. Namen bleiben auf diesem Gerät.',
    adresse: 'werkzeuge/gruppen/',
  },
  {
    bereich: 'Unterricht',
    symbol: 'ampel',
    bild: 'gemeinsam/ampel-logo.svg',
    titel: 'Lautstärke­ampel', // ­ = Trennstelle, falls der Platz (Handy) nicht reicht
    text: 'Zeigt am Beamer, wie laut es in der Klasse ist. Das Mikrofon wird nur auf diesem Gerät ausgewertet, nichts aufgenommen.',
    adresse: 'werkzeuge/lautstaerke/',
  },
  {
    bereich: 'Unterricht',
    symbol: 'qr',
    titel: 'QR-Code erstellen',
    text: 'Aus einem Link einen QR-Code machen – groß für den Beamer oder als Bild zum Ausdrucken.',
    adresse: 'werkzeuge/qr-code/',
  },
  // Links ins Netz (fremde Seiten, öffnen sich dort); der QR-Knopf an jeder Kachel macht daraus einen Code für die Klasse
  {
    bereich: 'Links für den Unterricht',
    symbol: 'atom',
    titel: 'PhET-Simulationen',
    text: 'Interaktive Simulationen für Physik, Chemie und Biologie (Universität Colorado).',
    adresse: 'https://phet.colorado.edu/',
  },
  {
    bereich: 'Links für den Unterricht',
    symbol: 'mikroskop',
    titel: 'Virtuelle Mikroskope',
    text: 'Präparate am Bildschirm mikroskopieren.',
    adresse: 'https://www.digital.anatomie.ruhr-uni-bochum.de/de/virtuelles-mikroskop/', // für die Suche; die Kachel zeigt die Ziele
    // mehrere Ziele: je ein Knopf in der Kachel, der QR-Dialog schaltet zwischen den Codes um
    ziele: [
      { titel: 'Bochum', text: 'Gewebeschnitte (Ruhr-Universität Bochum)', adresse: 'https://www.digital.anatomie.ruhr-uni-bochum.de/de/virtuelles-mikroskop/' },
      { titel: 'Duisburg-Essen', text: 'BioSLiDES: Scans von Pflanzen, Tieren und Pilzen (Universität Duisburg-Essen)', adresse: 'https://bioslides.biologie.uni-due.de/collection.php' },
    ],
  },
  {
    bereich: 'Links für den Unterricht',
    symbol: 'zelle',
    titel: 'EduBioSim',
    text: 'Biologische Simulationen und Experimente zum Ausprobieren.',
    adresse: 'https://www.edubiosim.de/',
  },
  {
    bereich: 'Links für den Unterricht',
    symbol: 'planet',
    titel: 'Planet Schule: Biologie',
    text: 'Filme und Materialien zur Biologie für den Unterricht.',
    adresse: 'https://www.planet-schule.de/fach/biologie-102.html',
  },
  {
    bereich: 'Links für den Unterricht',
    symbol: 'ball',
    titel: 'Sportunterricht.eu',
    text: 'Ideen, Spiele und Materialien für den Sportunterricht.',
    adresse: 'https://sportunterricht.eu/',
  },
]

/**
 * Materialien.
 *   fach:   Fach (danach wird gruppiert und gefiltert)
 *   klasse: z. B. '7' oder '10–12' (optional)
 *   titel:  Anzeigename
 *   datei:  Pfad im Ordner materialien/ – oder eine volle Adresse (https://…)
 *   text:   kurze Beschreibung (optional)
 */
window.MATERIALIEN = [
  // Beispiel:
  // { fach: 'Biologie', klasse: '10', titel: 'Merkblatt Fotosynthese', datei: 'materialien/fotosynthese.pdf', text: 'Zum Wiederholen' },
]
