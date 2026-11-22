// Prüft die Darstellung aller Seiten im echten Browser (Chrome oder Edge, ohne npm-Pakete):
//   - seitlicher Überlauf (Seite breiter als der Bildschirm)
//   - Textkontrast (WCAG: unter 3:1 = Fehler, unter 4,5:1 = Hinweis)
//   - Konsolenfehler und Skriptfehler
// Hintergrund: pruefen.mjs liest nur den Quelltext und merkt nicht, wenn eine Überschrift dunkelgrün auf dunkelgrün
// steht oder eine Seite am Handy überläuft (Audit 21.11.2026).
//
// Aufruf:  node werkzeuge/darstellung.mjs                      alle Seiten, Breiten 375 und 768, heller und dunkler Modus
//          node werkzeuge/darstellung.mjs lernen/blut           nur diese Seite(n) (Ordner oder Datei)
//          node werkzeuge/darstellung.mjs --breiten 320,375     andere Breiten (320 px = sehr kleine Handys: 6 Angebote laufen dort noch über)
//          node werkzeuge/darstellung.mjs --streng              Hinweise (Kontrast 3–4,5:1) zählen auch als Fehler
//          node werkzeuge/darstellung.mjs --nur-hell            dunklen Modus auslassen
// Beendet mit Code 1, wenn Fehler gefunden wurden. Nichts wird gesendet; die Seiten werden von einem lokalen
// Mini-Server (nur 127.0.0.1) ausgeliefert, Chrome läuft in einem Wegwerf-Profil.
import { createServer } from 'node:http'
import { readFileSync, readdirSync, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs'
import { join, dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const wert = (name, vorgabe) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : vorgabe
}
const breiten = wert('--breiten', '375,768').split(',').map(Number)
const streng = args.includes('--streng')
const modi = args.includes('--nur-hell') ? ['hell'] : ['hell', 'dunkel']
const ziele = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--breiten'))

// ---------- Seiten sammeln ----------
function seiten() {
  if (ziele.length) {
    return ziele.map((z) => {
      const p = z.replace(/\\/g, '/').replace(/\/?(index\.html)?$/, '')
      return p ? p + '/' : ''
    })
  }
  const liste = ['', 'lernen/', 'impressum.html']
  for (const bereich of ['werkzeuge', 'lernen']) {
    for (const d of readdirSync(join(wurzel, bereich), { withFileTypes: true })) {
      if (d.isDirectory() && existsSync(join(wurzel, bereich, d.name, 'index.html'))) liste.push(`${bereich}/${d.name}/`)
    }
  }
  return liste
}

// ---------- Mini-Server ----------
const TYPEN = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json' }
const server = createServer((req, res) => {
  let pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (pfad.endsWith('/')) pfad += 'index.html'
  const datei = resolve(wurzel, '.' + pfad)
  if (!datei.startsWith(wurzel + sep) || !existsSync(datei) || !statSync(datei).isFile()) {
    res.writeHead(404).end('nicht gefunden')
    return
  }
  res.writeHead(200, { 'Content-Type': TYPEN[extname(datei)] || 'application/octet-stream' }).end(readFileSync(datei))
})
await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
const basis = `http://127.0.0.1:${server.address().port}/`

// ---------- Chrome starten ----------
const KANDIDATEN = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)
const chromeDatei = KANDIDATEN.find((p) => existsSync(p))
if (!chromeDatei) {
  console.error('Weder Chrome noch Edge gefunden. Pfad in der Umgebungsvariable CHROME angeben.')
  process.exit(2)
}
const profil = mkdtempSync(join(tmpdir(), 'darstellung-'))
const chrome = spawn(chromeDatei, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profil}`, '--no-first-run', '--disable-gpu', '--hide-scrollbars', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] })
const wsAdresse = await new Promise((ok, fehler) => {
  let puffer = ''
  chrome.stderr.on('data', (d) => {
    puffer += d
    const m = puffer.match(/DevTools listening on (ws:\/\/\S+)/)
    if (m) ok(m[1])
  })
  chrome.on('exit', () => fehler(new Error('Chrome beendet')))
  setTimeout(() => fehler(new Error('Chrome startet nicht')), 20000)
})

// ---------- DevTools-Protokoll ----------
const ws = new WebSocket(wsAdresse)
await new Promise((ok, fehler) => {
  ws.onopen = ok
  ws.onerror = fehler
})
let zaehler = 0
const offen = new Map()
const ereignisse = []
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && offen.has(m.id)) {
    const { ok, fehler } = offen.get(m.id)
    offen.delete(m.id)
    m.error ? fehler(new Error(m.error.message)) : ok(m.result)
  } else if (m.method) ereignisse.push(m)
}
const sende = (methode, params = {}, sitzung) =>
  new Promise((ok, fehler) => {
    const id = ++zaehler
    offen.set(id, { ok, fehler })
    ws.send(JSON.stringify({ id, method: methode, params, ...(sitzung ? { sessionId: sitzung } : {}) }))
  })
const warte = (ms) => new Promise((r) => setTimeout(r, ms))

const { targetId } = await sende('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await sende('Target.attachToTarget', { targetId, flatten: true })
const s = (m, p) => sende(m, p, sessionId)
await s('Page.enable')
await s('Runtime.enable')
await s('Log.enable')

// ---------- Messung (läuft in der Seite) ----------
function messung() {
  const hell = (c) => {
    const [r, g, b] = c.map((v) => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const zahlen = (t) => (t.match(/[\d.]+/g) || []).map(Number)
  // Hintergrund hinter einem Element: erste deckende Fläche nach oben; Bilder/Verläufe = unbekannt (null)
  const hintergrund = (e) => {
    for (let x = e; x; x = x.parentElement) {
      const st = getComputedStyle(x)
      if (st.backgroundImage !== 'none') return null
      const z = zahlen(st.backgroundColor)
      if (z.length === 3 || (z.length === 4 && z[3] >= 0.95)) return z.slice(0, 3)
      if (z.length === 4 && z[3] > 0) return null // halbtransparent: nicht sicher bestimmbar
    }
    return [255, 255, 255]
  }
  const sichtbar = (e) => {
    const r = e.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) return false
    if (r.right <= 0 || r.bottom <= 0 || r.left > 5000) return false // für Screenreader aus dem Bild geschoben
    const st = getComputedStyle(e)
    if (st.visibility !== 'visible' || +st.opacity === 0 || st.display === 'none') return false
    for (let x = e; x; x = x.parentElement) if (+getComputedStyle(x).opacity < 0.5 || x.hidden) return false
    return true
  }
  const kontraste = []
  for (const e of document.body.querySelectorAll('*')) {
    if (!sichtbar(e) || !['H1', 'H2', 'H3', 'H4', 'P', 'LI', 'A', 'BUTTON', 'LABEL', 'SPAN', 'TD', 'TH', 'DT', 'DD', 'SUMMARY', 'B', 'STRONG', 'SMALL', 'DIV'].includes(e.tagName)) continue
    if (![...e.childNodes].some((n) => n.nodeType === 3 && /[\p{L}\p{N}]/u.test(n.textContent) && n.textContent.trim().length > 1)) continue // nur Text mit Buchstaben/Ziffern; reine Symbole (●●●) sind Schmuck
    if (e.closest('svg, canvas, [disabled], [aria-hidden="true"]') || e.disabled) continue
    const st = getComputedStyle(e)
    const fg = zahlen(st.color)
    const bg = hintergrund(e)
    if (!bg || fg.length < 3) continue
    const a = fg.length === 4 ? fg[3] : 1
    const vorne = fg.slice(0, 3).map((v, i) => Math.round(v * a + bg[i] * (1 - a)))
    const L1 = hell(vorne)
    const L2 = hell(bg)
    const verhaeltnis = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
    const gross = parseFloat(st.fontSize) >= 24 || (parseFloat(st.fontSize) >= 18.66 && +st.fontWeight >= 700)
    const grenze = gross ? 3 : 4.5
    if (verhaeltnis < grenze) {
      kontraste.push({ v: +verhaeltnis.toFixed(2), grenze, text: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), el: e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : '') })
    }
  }
  kontraste.sort((x, y) => x.v - y.v)
  // Überlauf: Welche Elemente ragen über den rechten Rand? (Bereiche mit eigenem Scrollen zählen nicht)
  const breite = document.documentElement.clientWidth
  const ueber = []
  for (const e of document.body.querySelectorAll('*')) {
    if (e.closest('svg') && e.tagName !== 'svg') continue
    const r = e.getBoundingClientRect()
    if (r.width < 2 || r.right <= breite + 1) continue
    let eingefasst = false
    for (let x = e.parentElement; x && x !== document.body; x = x.parentElement) {
      const o = getComputedStyle(x).overflowX
      if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') {
        eingefasst = true
        break
      }
      if (getComputedStyle(x).position === 'fixed') {
        eingefasst = true
        break
      }
    }
    if (!eingefasst && getComputedStyle(e).position !== 'fixed') ueber.push(e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : '') + ' (rechts ' + Math.round(r.right) + ')')
  }
  if (!ueber.length && document.documentElement.scrollWidth > breite + 1) {
    for (const e of document.body.querySelectorAll('*')) {
      const r = e.getBoundingClientRect()
      if (r.width >= 2 && r.right > breite + 1) ueber.push(e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : '') + ' (rechts ' + Math.round(r.right) + ', in Bereich mit eigenem Scrollen/Ausblenden)')
      if (ueber.length >= 3) break
    }
  }
  return { scrollBreite: document.documentElement.scrollWidth, breite, ueber: ueber.slice(0, 3), kontraste: kontraste.slice(0, 5), anzahlKontraste: kontraste.length }
}

async function pruefeSeite(pfad, breite, modus) {
  ereignisse.length = 0
  await s('Emulation.setDeviceMetricsOverride', { width: breite, height: 900, deviceScaleFactor: 1, mobile: breite < 600 })
  await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: modus === 'dunkel' ? 'dark' : 'light' }] })
  await s('Page.navigate', { url: basis + pfad })
  const start = Date.now()
  while (Date.now() - start < 15000) {
    await warte(150)
    if (ereignisse.some((e) => e.method === 'Page.loadEventFired')) break
  }
  await warte(500) // Skripte der Seite zeichnen lassen
  const { result, exceptionDetails } = await s('Runtime.evaluate', { expression: `(${messung.toString()})()`, returnByValue: true })
  if (exceptionDetails) throw new Error('Messung: ' + exceptionDetails.text)
  const meldungen = ereignisse
    .filter((e) => (e.method === 'Runtime.exceptionThrown') || (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error' && !/404/.test(e.params.entry.text + (e.params.entry.url || ''))))
    .map((e) => (e.params.exceptionDetails ? e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text : e.params.entry ? e.params.entry.text : (e.params.args || []).map((a) => a.value || a.description).join(' ')))
    .map((t) => String(t).split('\n')[0].slice(0, 140))
  return { ...result.value, meldungen }
}

// ---------- Lauf ----------
let fehlerZahl = 0
let hinweisZahl = 0
const alle = seiten()
console.log(`Prüfe ${alle.length} Seiten, Breiten ${breiten.join('/')} px, Modi ${modi.join('/')} …`)
try {
  for (const pfad of alle) {
    const zeilen = []
    for (const modus of modi) {
      if (modus === 'dunkel' && pfad.startsWith('lernen/') && pfad !== 'lernen/') {
        // Lernangebote sind vorerst nur hell (data-theme="light", siehe docs/DECISIONS.md)
        continue
      }
      for (const breite of breiten) {
        const e = await pruefeSeite(pfad, breite, modus)
        const wo = `${breite} px ${modus}`
        if (e.scrollBreite > e.breite + 1) {
          fehlerZahl++
          zeilen.push(`  ✗ ${wo}: Seite ${e.scrollBreite - e.breite} px breiter als der Bildschirm (${e.ueber.join(', ') || 'Ursache nicht gefunden'})`)
        }
        const harte = e.kontraste.filter((k) => k.v < 3)
        const weiche = e.kontraste.filter((k) => k.v >= 3)
        for (const k of harte.slice(0, 3)) {
          fehlerZahl++
          zeilen.push(`  ✗ ${wo}: Kontrast ${k.v}:1 bei „${k.text}“ (${k.el})${e.anzahlKontraste > 3 ? ` – insgesamt ${e.anzahlKontraste} Stellen unter ${3}…4,5:1` : ''}`)
        }
        if (weiche.length && !harte.length) {
          if (streng) fehlerZahl++
          else hinweisZahl++
          zeilen.push(`  ${streng ? '✗' : '!'} ${wo}: Kontrast ${weiche[0].v}:1 (unter ${weiche[0].grenze}:1) bei „${weiche[0].text}“ (${weiche[0].el})${e.anzahlKontraste > 1 ? `, ${e.anzahlKontraste} Stellen` : ''}`)
        }
        for (const m of e.meldungen.slice(0, 2)) {
          fehlerZahl++
          zeilen.push(`  ✗ ${wo}: Konsolenfehler: ${m}`)
        }
      }
    }
    console.log(`${pfad || './'} ${zeilen.length ? '' : '✓'}`)
    for (const z of [...new Set(zeilen)]) console.log(z)
  }
} finally {
  try {
    await sende('Browser.close')
  } catch {
    /* schon zu */
  }
  chrome.kill()
  server.close()
  await warte(300)
  try {
    rmSync(profil, { recursive: true, force: true })
  } catch {
    /* Windows gibt Dateien manchmal verzögert frei */
  }
}
console.log(fehlerZahl ? `\n${fehlerZahl} Fehler${hinweisZahl ? `, ${hinweisZahl} Hinweise` : ''}.` : `\nKeine Fehler gefunden${hinweisZahl ? ` (${hinweisZahl} Hinweise zum Kontrast, mit --streng als Fehler)` : ''}.`)
process.exit(fehlerZahl ? 1 : 0)
