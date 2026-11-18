// Leiste „‹ Lernangebote“ oben in jedem übernommenen Lernangebot (Stil der Tafel: hell, Haarlinie, Systemschrift).
// Die Artefakte laden gemeinsam/tokens.css nicht; deshalb stehen die Farben hier als Werte –
// sie entsprechen --seite, --verweis, --haarlinie, --schwebe und --fokus aus gemeinsam/tokens.css.
// Alle Regeln mit !important, damit das CSS des Artefakts die Leiste nicht verändert.
//
// Aufruf ohne Argumente erneuert die Leiste in allen lernen/<ordner>/index.html:
//   node lernen/werkzeug/leiste.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const STIL =
  '.lernangebot-leiste{all:initial!important;display:flex!important;align-items:center!important;box-sizing:border-box!important;width:100%!important;min-height:44px!important;padding:0 8px!important;background:#eef2f7!important;border-bottom:1px solid rgba(10,45,83,.1)!important;font:500 16px/1.3 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,"Segoe UI Variable Text","Segoe UI",Roboto,Arial,sans-serif!important;letter-spacing:-.01em!important}' +
  '.lernangebot-leiste a{all:initial!important;display:inline-flex!important;align-items:center!important;gap:2px!important;box-sizing:border-box!important;min-height:36px!important;padding:0 12px 0 6px!important;border-radius:999px!important;color:#0f6f8f!important;font:inherit!important;cursor:pointer!important}' +
  '.lernangebot-leiste a:hover{background:rgba(10,45,83,.07)!important}' +
  '.lernangebot-leiste a:focus-visible{outline:3px solid #0f7f6c!important;outline-offset:2px!important}' +
  '.lernangebot-leiste svg{display:block!important;width:20px!important;height:20px!important;flex:none!important}' +
  '@media (prefers-color-scheme:dark){.lernangebot-leiste{background:#061a33!important;border-bottom-color:rgba(255,255,255,.1)!important}.lernangebot-leiste a{color:#6fd3bf!important}.lernangebot-leiste a:hover{background:rgba(255,255,255,.08)!important}.lernangebot-leiste a:focus-visible{outline-color:#6fd3bf!important}}' +
  '@media print{.lernangebot-leiste{display:none!important}}'

const PFEIL =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7"/></svg>'

export const LEISTE =
  `<nav class="lernangebot-leiste" aria-label="Zurück"><style>${STIL}</style><a href="../">${PFEIL}Lernangebote</a></nav>\n`

const ALT = /<nav class="lernangebot-leiste"[\s\S]*?<\/nav>\n?/

/** Setzt die Leiste direkt nach <body> ein bzw. ersetzt eine vorhandene. */
export function mitLeiste(html) {
  if (ALT.test(html)) return html.replace(ALT, () => LEISTE)
  return html.replace(/<body([^>]*)>\s*/i, (m) => m + LEISTE)
}

// Direkt aufgerufen: in allen Lernangeboten erneuern
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const lernen = join(dirname(fileURLToPath(import.meta.url)), '..')
  let anzahl = 0
  for (const ordner of readdirSync(lernen, { withFileTypes: true })) {
    const datei = join(lernen, ordner.name, 'index.html')
    if (!ordner.isDirectory() || !existsSync(datei)) continue
    const html = readFileSync(datei, 'utf8')
    if (!ALT.test(html)) continue // ohne Leiste (z. B. eigene Kopfzeile wie bei den Herzfrequenz-Zonen)
    const neu = mitLeiste(html)
    if (neu !== html) {
      writeFileSync(datei, neu)
      anzahl++
    }
  }
  console.log(`Leiste in ${anzahl} Lernangeboten erneuert.`)
}
