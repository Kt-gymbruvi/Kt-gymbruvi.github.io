// Prüft Werkzeug-Dateien (z. B. aus Claude-Artefakten) auf Dinge, die auf einer öffentlichen Schulseite stören.
// Aufruf:  node werkzeuge/pruefen.mjs werkzeuge/timer/index.html [weitere Dateien …]
//          node werkzeuge/pruefen.mjs            (prüft alle werkzeuge/*/index.html)
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
// --veroeffentlichen: zusätzlich prüfen, ob die Seite fertig für die Veröffentlichung ist
const vorVeroeffentlichung = process.argv.includes('--veroeffentlichen')
let dateien = process.argv.slice(2).filter((a) => !a.startsWith('--'))
if (!dateien.length) {
  dateien = readdirSync(hier, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(hier, d.name, 'index.html')))
    .map((d) => join(hier, d.name, 'index.html'))
}

const REGELN = [
  {
    art: 'Fehler',
    text: 'lädt etwas von einem fremden Server (Datei lieber mit in den Ordner legen)',
    // src/href/import/url() mit http(s) – Links zum Anklicken (<a href>) sind erlaubt
    finde: (html) => [
      ...[...html.matchAll(/<(script|link|img|iframe|audio|video|source)\b[^>]*\b(src|href)\s*=\s*["'](https?:)?\/\/[^"']+/gi)].map((m) => m[0]),
      ...[...html.matchAll(/\bimport\s*(?:[^'"]*from\s*)?["'](https?:)?\/\/[^"']+["']/g)].map((m) => m[0]),
      ...[...html.matchAll(/url\(\s*["']?https?:\/\/[^)]+\)/gi)].map((m) => m[0]),
      ...[...html.matchAll(/@import\s+["']https?:\/\/[^"']+/gi)].map((m) => m[0]),
    ],
  },
  {
    art: 'Fehler',
    text: 'ruft eine KI auf (funktioniert hier nicht, niemals Schlüssel einbauen)',
    finde: (html) => [...html.matchAll(/window\.claude|api\.anthropic\.com|api\.openai\.com|generativelanguage\.googleapis/gi)].map((m) => m[0]),
  },
  {
    art: 'Fehler',
    text: 'schickt Daten an einen Server (fetch/XMLHttpRequest/sendBeacon) – prüfen, ob das nötig ist',
    finde: (html) => [...html.matchAll(/\bfetch\s*\(\s*["'`]https?:|new\s+XMLHttpRequest|navigator\.sendBeacon/g)].map((m) => m[0]),
  },
  {
    art: 'Hinweis',
    text: 'speichert auf dem Gerät – nur für Einstellungen, keine Namen/Noten ungefragt',
    finde: (html) => [...new Set([...html.matchAll(/localStorage|sessionStorage|indexedDB/g)].map((m) => m[0]))],
  },
  { art: 'Hinweis', text: 'fehlt: <html lang="de">', finde: (html) => (/<html[^>]*\blang=["']de/i.test(html) ? [] : ['lang']) },
  { art: 'Hinweis', text: 'fehlt: <meta name="viewport"> (fürs Handy)', finde: (html) => (/name=["']viewport["']/i.test(html) ? [] : ['viewport']) },
  { art: 'Hinweis', text: 'fehlt: <title>', finde: (html) => (/<title>[^<]+<\/title>/i.test(html) ? [] : ['title']) },
]

let fehler = 0
for (const datei of dateien) {
  const html = readFileSync(datei, 'utf8')
  const funde = REGELN.map((r) => ({ ...r, treffer: r.finde(html) })).filter((r) => r.treffer.length)
  console.log(`\n${datei}`)
  if (!funde.length) console.log('  ✓ alles in Ordnung')
  for (const f of funde) {
    if (f.art === 'Fehler') fehler++
    console.log(`  ${f.art === 'Fehler' ? '✗' : '!'} ${f.text}`)
    for (const t of f.treffer.slice(0, 5)) console.log(`      ${t.slice(0, 110)}`)
  }
}
if (vorVeroeffentlichung) {
  const wurzel = join(hier, '..')
  const impressum = readFileSync(join(wurzel, 'impressum.html'), 'utf8')
  const inhalte = readFileSync(join(wurzel, 'js', 'inhalte.js'), 'utf8')
  const offen = [
    /class="todo"|SCHUL_ADRESSE|\[Name der/.test(impressum) && 'impressum.html ist noch ein Entwurf (roter Kasten oder Platzhalter)',
    /beispiel-merkblatt/.test(inhalte) && 'Beispiel-Material steht noch in js/inhalte.js',
  ].filter(Boolean)
  console.log('\nVor der Veröffentlichung:')
  if (!offen.length) console.log('  ✓ Impressum ausgefüllt, kein Beispielmaterial')
  for (const o of offen) {
    fehler++
    console.log(`  ✗ ${o}`)
  }
}

console.log(fehler ? `\n${fehler} Problem(e) gefunden.` : '\nKeine Probleme gefunden.')
process.exit(fehler ? 1 : 0)
