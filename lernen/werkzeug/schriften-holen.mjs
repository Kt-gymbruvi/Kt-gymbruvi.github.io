// Einmalig ausführen (Lehrkraft-Rechner): lädt die Schriften, die die Artefakte von Google Fonts beziehen,
// und legt sie unter lernen/schriften/ ab – danach lädt die Seite keine Schrift mehr von fremden Servern.
// Nur das Zeichenset „latin“ (enthält ä, ö, ü, ß). Alle Schriften stehen unter der SIL Open Font License.
// Aufruf:  node lernen/werkzeug/schriften-holen.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ziel = join(dirname(fileURLToPath(import.meta.url)), '..', 'schriften')
mkdirSync(ziel, { recursive: true })

// Familie → Google-Fonts-Angabe (so wie in den Artefakten)
const FAMILIEN = [
  'Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700',
  'Schibsted+Grotesk:wght@400;500;600;700;800',
  'Bricolage+Grotesque:opsz,wght@12..96,400..800',
  'Barlow:wght@400;500;600;700',
  'Barlow+Condensed:wght@500;600;700',
]
const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const geladen = new Map() // Google-Adresse → lokaler Dateiname
let css = '/* Schriften lokal (SIL Open Font License) – erzeugt von werkzeug/schriften-holen.mjs */\n'
for (const f of FAMILIEN) {
  const antwort = await fetch(`https://fonts.googleapis.com/css2?family=${f}&display=swap`, { headers: { 'User-Agent': BROWSER } })
  if (!antwort.ok) throw new Error(`${f}: ${antwort.status}`)
  const text = await antwort.text()
  // nur die Blöcke für „latin“
  for (const [, block] of text.matchAll(/\/\* latin \*\/\s*(@font-face\s*{[^}]+})/g)) {
    const url = block.match(/url\((https:[^)]+)\)/)[1]
    const familie = block.match(/font-family:\s*'([^']+)'/)[1]
    const stil = block.match(/font-style:\s*(\w+)/)[1]
    const gewicht = block.match(/font-weight:\s*([\d ]+)/)[1].trim().replace(' ', '-')
    // Variable Schriften liefert Google für mehrere Gewichte als dieselbe Datei – nur einmal speichern
    if (!geladen.has(url)) {
      const datei = `${familie.toLowerCase().replace(/\s+/g, '-')}-${gewicht}-${stil}.woff2`
      const daten = Buffer.from(await (await fetch(url)).arrayBuffer())
      writeFileSync(join(ziel, datei), daten)
      geladen.set(url, datei)
      console.log(`✓ ${datei} (${Math.round(daten.length / 1024)} KB)`)
    }
    css += block.replace(/url\(https:[^)]+\)/, `url(${geladen.get(url)})`) + '\n'
  }
}
writeFileSync(join(ziel, 'schriften.css'), css)
console.log('fertig: lernen/schriften/schriften.css')
