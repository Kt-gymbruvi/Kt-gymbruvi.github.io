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
 */

/** Überschrift oben auf der Seite */
window.SEITE = {
  titel: 'Lernen mit Spaß',
  untertitel: 'Quiz, Material und Werkzeuge an einem Ort',
}

/** Große Kacheln oben (Links auf eigene Seiten) */
window.LINKS = [
  {
    symbol: '📚',
    titel: 'Lernangebote',
    text: 'Simulationen, Erklärungen und Übungen – nach Fach, Jahrgang und Thema.',
    adresse: 'lernen/',
  },
  {
    symbol: '❓',
    titel: 'Quizzo',
    text: 'Das Live-Quiz: mit PIN oder Aufgaben-Code mitspielen – oder als Lehrkraft ein Quiz starten.',
    adresse: 'https://kt-gymbruvi.github.io/Quizzo/',
  },
  {
    symbol: '📡',
    titel: 'Klassenfunk',
    text: 'Live abstimmen im Unterricht: Wortwolke, Umfrage, Fragen an die Lehrkraft. Mitmachen mit PIN, anonym.',
    adresse: 'https://kt-gymbruvi.github.io/Klassenfunk/',
  },
]

/**
 * Werkzeuge: kleine Web-Apps im Ordner werkzeuge/<name>/index.html
 * (eigene oder aus Claude-Artefakten übernommen – Anleitung in werkzeuge/ANLEITUNG.md).
 *   bereich: Überschrift, unter der das Werkzeug erscheint (z. B. 'Unterricht', 'Sport', 'Biologie')
 */
window.WERKZEUGE = [
  {
    bereich: 'Unterricht',
    symbol: '⏱',
    titel: 'Timer',
    text: 'Countdown für Arbeitsphasen – groß für den Beamer, mit Signalton.',
    adresse: 'werkzeuge/timer/',
  },
  {
    bereich: 'Unterricht',
    symbol: '🎲',
    titel: 'Gruppen & Zufall',
    text: 'Gruppen oder Paare auslosen, eine Person ziehen. Namen bleiben auf diesem Gerät.',
    adresse: 'werkzeuge/gruppen/',
  },
  {
    bereich: 'Sport',
    symbol: '❤️',
    titel: 'Herzfrequenz-Zonen',
    text: 'Trainingsbereiche aus Alter und Ruhepuls berechnen – mit Pulswerten für 15 Sekunden.',
    adresse: 'werkzeuge/herzfrequenz/',
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
