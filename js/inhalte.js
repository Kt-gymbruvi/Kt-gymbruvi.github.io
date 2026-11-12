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
  { titel: 'Startseite', symbol: 'haus', adresse: './', hier: true },
  { titel: 'Meine Klassen', symbol: 'klassen', adresse: PLATTFORM + '/Lehrraum/#/klassen', nur: 'lehrkraft' },
  { titel: 'Quizzo', symbol: 'pokal', adresse: PLATTFORM + '/Quizzo/' },
  { titel: 'Klassenfunk', symbol: 'megafon', adresse: PLATTFORM + '/Klassenfunk/' },
  { titel: 'Lernangebote', symbol: 'lernen', adresse: 'lernen/' },
  { titel: 'Interaktive Tafel', symbol: 'bildschirm', adresse: PLATTFORM + '/Lehrraum/#/tafel', nur: 'lehrkraft' },
  { titel: 'Materialien', symbol: 'bibliothek', adresse: '#material-bereich', nur: 'material' }, // erscheint nur, wenn es Materialien gibt
  { titel: 'Werkzeuge', symbol: 'werkzeug', adresse: '#werkzeuge-bereich' },
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
 *   textGast: anderer Text ohne Anmeldung (optional)
 */
window.LINKS = [
  {
    symbol: 'klassen',
    farbe: 'unterrichten',
    titel: 'Meine Klassen',
    text: 'Klassenräume verwalten und starten',
    adresse: PLATTFORM + '/Lehrraum/#/klassen',
    qr: false, // Klassen liegen nur auf dem eigenen Gerät – ein QR-Code dorthin nützt niemandem
    nur: 'lehrkraft',
  },
  {
    symbol: 'pokal',
    farbe: 'bibliothek',
    titel: 'Quizzo',
    text: 'Interaktive Quizze erstellen und spielen',
    textGast: 'Mit PIN oder Aufgaben-Code beim Quiz mitspielen',
    adresse: PLATTFORM + '/Quizzo/',
  },
  {
    symbol: 'megafon',
    farbe: 'interaktion',
    titel: 'Klassenfunk',
    text: 'Abstimmungen und Umfragen',
    textGast: 'Live abstimmen – mit PIN, anonym',
    adresse: PLATTFORM + '/Klassenfunk/',
  },
  {
    symbol: 'lernen',
    farbe: 'lernen',
    titel: 'Lernangebote',
    text: 'Materialien und Lernpfade',
    textGast: 'Simulationen, Erklärungen und Übungen – nach Fach und Jahrgang',
    adresse: 'lernen/',
  },
  {
    symbol: 'bildschirm',
    farbe: 'tafel',
    titel: 'Interaktive Tafel',
    text: 'Digital unterrichten',
    adresse: PLATTFORM + '/Lehrraum/#/tafel',
    nur: 'lehrkraft',
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
  hoechstens: 7, // so viele Klassen zeigt die Startseite; alle stehen unter „Alle Klassen anzeigen“
}

/** Schnellzugriff (nur für angemeldete Lehrkräfte) */
window.SCHNELLZUGRIFF = [
  { symbol: 'bildschirm', farbe: 'tafel', titel: 'Tafel öffnen', adresse: PLATTFORM + '/Lehrraum/#/tafel' },
  { symbol: 'pokal', farbe: 'bibliothek', titel: 'Quizzo starten', adresse: PLATTFORM + '/Quizzo/#/leiten' },
  { symbol: 'megafon', farbe: 'interaktion', titel: 'Klassenfunk öffnen', adresse: PLATTFORM + '/Klassenfunk/#/leiten' },
  { symbol: 'lernen', farbe: 'lernen', titel: 'Lernangebote ordnen', adresse: 'lernen/#bearbeiten' },
]

/**
 * Werkzeuge: kleine Web-Apps im Ordner werkzeuge/<name>/index.html
 * (eigene oder aus Claude-Artefakten übernommen – Anleitung in werkzeuge/ANLEITUNG.md).
 *   bereich: Überschrift, unter der das Werkzeug erscheint (z. B. 'Unterricht', 'Sport', 'Biologie')
 */
window.WERKZEUGE = [
  {
    bereich: 'Unterricht',
    symbol: 'timer',
    titel: 'Timer',
    text: 'Countdown für Arbeitsphasen – groß für den Beamer, mit Signalton.',
    adresse: 'werkzeuge/timer/',
  },
  {
    bereich: 'Unterricht',
    symbol: 'wuerfel',
    titel: 'Gruppen & Zufall',
    text: 'Gruppen oder Paare auslosen, eine Person ziehen. Namen bleiben auf diesem Gerät.',
    adresse: 'werkzeuge/gruppen/',
  },
  {
    bereich: 'Unterricht',
    symbol: 'ampel',
    titel: 'Lautstärkeampel',
    text: 'Zeigt am Beamer, wie laut es in der Klasse ist. Das Mikrofon wird nur auf diesem Gerät ausgewertet, nichts aufgenommen.',
    adresse: 'werkzeuge/lautstaerke/',
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
