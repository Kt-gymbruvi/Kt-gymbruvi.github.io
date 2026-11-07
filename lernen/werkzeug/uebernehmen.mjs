// Übernimmt ein heruntergeladenes Claude-Artefakt als Lernangebot.
// Aufruf:  node lernen/werkzeug/uebernehmen.mjs <artefakt.html> <ordnername>
//   – ersetzt Google Fonts durch die lokalen Schriften (lernen/schriften/)
//   – fügt oben eine schmale Leiste „← Lernangebote“ ein
//   – schreibt lernen/<ordnername>/index.html und prüft die Datei (werkzeuge/pruefen.mjs)
// Danach den Eintrag in lernen/angebote.js ergänzen.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const [quelle, name] = process.argv.slice(2)
if (!quelle || !/^[a-z0-9-]+$/.test(name ?? '')) {
  console.error('Aufruf: node lernen/werkzeug/uebernehmen.mjs <artefakt.html> <ordnername (klein, a-z 0-9 -)>')
  process.exit(2)
}
const lernen = join(dirname(fileURLToPath(import.meta.url)), '..')
let html = readFileSync(quelle, 'utf8')
const vorher = html.length

// 1. Google Fonts → lokale Schriften
html = html.replace(/[ \t]*<link[^>]+href=["']https:\/\/fonts\.(googleapis|gstatic)\.com[^>]*>\s*\n?/gi, '')
html = html.replace(/@import\s+url\(["']?https:\/\/fonts\.googleapis\.com[^)]*\)\s*;?/gi, '')
html = html.replace(/<\/head>/i, '<link rel="stylesheet" href="../schriften/schriften.css">\n</head>')

// 2. Rückweg zur Übersicht (eigene Klasse und Inline-Stile, damit das Artefakt-CSS nicht stört)
const leiste =
  '<nav class="lernangebot-leiste" style="all:initial;display:flex;align-items:center;gap:12px;box-sizing:border-box;width:100%;padding:8px 16px;background:#0b1f4d;font:700 16px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif">' +
  '<a href="../" style="all:initial;color:#ffc928;font:inherit;cursor:pointer;text-decoration:none">← Lernangebote</a></nav>\n'
if (!html.includes('lernangebot-leiste')) html = html.replace(/<body([^>]*)>\s*/i, (m) => m + leiste)

// 3. Sprache und Viewport sicherstellen
if (!/<html[^>]*\blang=/i.test(html)) html = html.replace(/<html/i, '<html lang="de"')

const ziel = join(lernen, name)
mkdirSync(ziel, { recursive: true })
writeFileSync(join(ziel, 'index.html'), html)
console.log(`→ lernen/${name}/index.html (${Math.round(vorher / 1024)} KB)`)

// 4. Prüfen
try {
  console.log(execFileSync('node', [join(lernen, '..', 'werkzeuge', 'pruefen.mjs'), join(ziel, 'index.html')], { encoding: 'utf8' }))
} catch (e) {
  console.log(e.stdout)
  process.exitCode = 1
}
