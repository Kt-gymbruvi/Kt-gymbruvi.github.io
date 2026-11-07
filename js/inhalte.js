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
  titel: 'Unterricht',
  untertitel: 'Quiz, Material und Werkzeuge an einem Ort',
}

/** Große Kacheln oben (Links auf eigene Seiten) */
window.LINKS = [
  {
    symbol: '❓',
    titel: 'Quizzo – Mitspielen',
    text: 'PIN eingeben und beim Live-Quiz mitmachen. Auch für Aufgaben-Codes.',
    adresse: 'https://kt-gymbruvi.github.io/Quizzo/#/mitspielen',
  },
  {
    symbol: '🧑‍🏫',
    titel: 'Quizzo – Lehrkraft',
    text: 'Anmelden, Quizze bearbeiten, Spiel starten.',
    adresse: 'https://kt-gymbruvi.github.io/Quizzo/',
    qr: false, // braucht niemand als QR-Code
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
  // BEISPIEL – vor dem Veröffentlichen löschen (und materialien/beispiel-merkblatt.txt auch)
  {
    fach: 'Beispiel',
    klasse: '7',
    titel: 'Beispiel-Merkblatt',
    datei: 'materialien/beispiel-merkblatt.txt',
    text: 'So sieht ein Eintrag aus.',
  },
]
