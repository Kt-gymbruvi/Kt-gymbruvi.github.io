/*
 * Lernangebote (übernommene Claude-Artefakte) – geordnet wie in „Meine Artefakte“: Fach › Jahrgang › Thema.
 *
 * Neues Angebot:
 *   1. Artefakt herunterladen und übernehmen:  node lernen/werkzeug/uebernehmen.mjs <datei.html> <ordnername>
 *   2. Hier unten einen Eintrag ergänzen.
 *
 *   ordner:  Ordnername unter lernen/
 *   titel:   Anzeigename
 *   fach:    'bio' | 'sport' | …  (siehe FAECHER)
 *   stufen:  Jahrgänge, z. B. ['7'] oder ['10', 'sek2']; leer = für alle Jahrgänge
 *   thema:   optional, z. B. 'evo' (siehe THEMEN)
 *   text:    kurze Beschreibung (optional)
 *   datum:   wann erstellt (zum Sortieren)
 */

window.FAECHER = [
  { id: 'bio', name: 'Biologie', symbol: '🧬' },
  { id: 'sport', name: 'Sport', symbol: '🏃' },
]

window.STUFEN = [
  { id: '5', name: 'Klasse 5' },
  { id: '6', name: 'Klasse 6' },
  { id: '7', name: 'Klasse 7' },
  { id: '8', name: 'Klasse 8' },
  { id: '9', name: 'Klasse 9' },
  { id: '10', name: 'Klasse 10' },
  { id: '11', name: 'Klasse 11' },
  { id: 'sek2', name: 'Klasse 12/13' },
]

window.THEMEN = [
  { id: 'foto', name: 'Fotosynthese' },
  { id: 'zell', name: 'Zellatmung' },
  { id: 'oeko', name: 'Ökologie' },
  { id: 'evo', name: 'Evolution' },
  { id: 'neuro', name: 'Neurobiologie' },
  { id: 'gen', name: 'Genetik' },
]

window.ANGEBOTE = [
  {
    ordner: 'skelett',
    titel: 'Das Skelett des Menschen',
    fach: 'bio',
    stufen: ['6'],
    text: 'Knochen erkunden und benennen.',
    datum: '2026-10-31',
  },
  {
    ordner: 'herzzyklus',
    titel: 'Herzzyklus im Schnitt – Systole und Diastole',
    fach: 'bio',
    stufen: ['7'],
    text: 'Was im Herzen bei jedem Schlag passiert.',
    datum: '2026-10-30',
  },
  {
    ordner: 'raeuber-beute',
    titel: 'Räuber-Beute-Modell',
    fach: 'bio',
    stufen: ['sek2'],
    thema: 'oeko',
    text: 'Simulation nach Lotka-Volterra.',
    datum: '2026-10-05',
  },
  {
    ordner: 'enzymaktivitaet',
    titel: 'Enzymaktivität: Simulation und Michaelis-Menten-Diagramm',
    fach: 'bio',
    stufen: ['sek2'],
    text: 'Substratkonzentration, Temperatur und Hemmung ausprobieren.',
    datum: '2026-10-01',
  },
  {
    ordner: 'taktikboard',
    titel: 'Taktikboard',
    fach: 'sport',
    stufen: [],
    text: 'Spielzüge zeichnen und abspielen. Gespeichert wird nur auf diesem Gerät.',
    datum: '2026-10-25',
  },
]
