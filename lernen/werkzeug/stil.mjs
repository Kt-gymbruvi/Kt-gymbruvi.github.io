// Stil der Startseite für Lernangebote: bindet lernen/lernstil.css ein und stellt <html data-theme="light"> ein
// (die Artefakte schalten ihren dunklen Block bei data-theme="light" ab – vorerst nur heller Modus).
//
// Aufruf ohne Argumente: in allen lernen/<ordner>/index.html einsetzen bzw. erneuern.
//   node lernen/werkzeug/stil.mjs
// Aufruf mit Ordnern: nur dort.   node lernen/werkzeug/stil.mjs zuchtsimulator versuchsplaner
// Angebote, die gemeinsam/tokens.css selbst laden (z. B. herzfrequenz-zonen), werden übersprungen.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const LINK = '<link rel="stylesheet" href="../lernstil.css">'

/** Setzt data-theme="light" am ersten <html> und den Stil-Link ans Ende des <head>. */
export function mitStil(html) {
  let neu = html
  if (!/<html[^>]*data-theme=/i.test(neu)) neu = neu.replace(/<html(?![^>]*data-theme)/i, '<html data-theme="light"')
  if (!neu.includes('lernstil.css')) {
    // nach der Schriften-Verknüpfung, sonst direkt vor </head>
    if (/<link rel="stylesheet" href="\.\.\/schriften\/schriften\.css">/.test(neu)) {
      neu = neu.replace(/(<link rel="stylesheet" href="\.\.\/schriften\/schriften\.css">)/, `$1\n${LINK}`)
    } else {
      neu = neu.replace(/<\/head>/i, `${LINK}\n</head>`)
    }
  }
  return neu
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const lernen = join(dirname(fileURLToPath(import.meta.url)), '..')
  const nur = process.argv.slice(2)
  let anzahl = 0
  for (const ordner of readdirSync(lernen, { withFileTypes: true })) {
    const datei = join(lernen, ordner.name, 'index.html')
    if (!ordner.isDirectory() || !existsSync(datei)) continue
    if (nur.length && !nur.includes(ordner.name)) continue
    const html = readFileSync(datei, 'utf8')
    if (html.includes('gemeinsam/tokens.css')) continue // hat die Gestaltung der Startseite schon
    const neu = mitStil(html)
    if (neu !== html) {
      writeFileSync(datei, neu)
      anzahl++
    }
  }
  console.log(`Stil in ${anzahl} Lernangeboten eingesetzt.`)
}
