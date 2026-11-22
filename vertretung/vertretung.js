/* Seite „Vertretung“: Liste der Rätsel und Spiele wie bei den Lernangeboten – links die Arten, rechts die Liste mit Suche.
   Die Auswahl steht in der Adresse (z. B. ?art=spiele), damit man sie per QR-Code am Beamer teilen kann.
   Die Angebote stehen in vertretung/angebote.js. */
;(function () {
  'use strict'

  const GRUPPEN = window.VERTRETUNG_GRUPPEN || []
  // In der Liste stehen nur Angebote ohne „liste: false“ (der Spielraum ist eine Spielart und steht als Knopf an der Gruppe)
  const ANGEBOTE = (window.VERTRETUNG || []).filter((a) => a.liste !== false)
  const $ = (id) => document.getElementById(id)
  const sym = (n) => window.LehrraumSymbol && window.LehrraumSymbol(n)

  function el(tag, klasse, text) {
    const e = document.createElement(tag)
    if (klasse) e.className = klasse
    if (text != null) e.textContent = text
    return e
  }

  const p = new URLSearchParams(location.search)
  let art = GRUPPEN.some((g) => g.id === p.get('art')) ? p.get('art') : null

  // Logo im Feld (gemeinsam/symbole.js liefert das Logo-Bild)
  function logoFeld(name, klein) {
    const feld = el('span', 'symbol-feld logo' + (klein ? ' klein' : ''))
    const s = sym(name)
    if (s) feld.append(s)
    return feld
  }

  const suchtreffer = (a, s) => {
    if (!s) return true
    const heu = [a.titel, a.text, ...(a.marken || [])].join(' ').toLocaleLowerCase('de')
    return s.split(/\s+/).every((w) => heu.includes(w))
  }

  // ---------- Seitenleiste ----------
  function ast(text, anzahl, aktiv, logo, bei) {
    const li = el('li')
    const b = el('button', 'ast')
    b.type = 'button'
    if (aktiv) b.setAttribute('aria-current', 'true')
    b.append(logoFeld(logo, true), el('span', 'name', text), el('span', 'zahl', String(anzahl)))
    b.addEventListener('click', bei)
    li.append(b)
    return li
  }
  const waehle = (neu) => {
    art = neu
    zeichne()
  }
  const logoDerArt = { knobeln: 'sudoku', spiele: 'viergewinnt' }

  function baum() {
    const nav = $('baum')
    nav.textContent = ''
    const ul = el('ul', 'ebene-1')
    ul.append(ast('Alle', ANGEBOTE.length, !art, 'vertretung', () => waehle(null)))
    GRUPPEN.forEach((g) => ul.append(ast(g.name, ANGEBOTE.filter((a) => a.gruppe === g.id).length, art === g.id, logoDerArt[g.id] || 'vertretung', () => waehle(g.id))))
    nav.append(ul)
  }

  // ---------- Kopf ----------
  function kopf() {
    const g = GRUPPEN.find((x) => x.id === art)
    $('ueberschrift').textContent = g ? g.name : 'Vertretung'
    $('einleitung').textContent = g ? g.text : 'Rätsel und Spiele, die man ohne Vorbereitung und ohne Fachwissen mit einer Klasse machen kann – am Beamer gemeinsam oder am Handy und Tablet allein. Es wird nichts gespeichert.'
    const pfad = $('pfad')
    pfad.textContent = ''
    if (!g) return
    const start = el('button', null, 'Alle')
    start.type = 'button'
    start.addEventListener('click', () => waehle(null))
    pfad.append(start, el('span', null, '›'))
  }

  // ---------- Liste ----------
  function zeile(a) {
    const li = el('li', 'eintrag')
    const link = el('a', 'liste-eintrag')
    link.href = '../' + a.adresse
    const text = el('span', 'inhalt')
    text.append(el('span', 'titel', a.titel), el('span', 'info', a.text))
    const marken = el('span', 'marken')
    ;(a.marken || []).forEach((m) => marken.append(el('span', 'chip', m)))
    text.append(marken)
    link.append(logoFeld(a.logo), text)
    li.append(link, qrKnopf(a.titel, new URL('../' + a.adresse, location.href).href))
    return li
  }

  // Großer Knopf an der Gruppe: Logo, Titel, ein Satz und Pfeil – eine Spielart, kein eigenes Spiel
  function onlineKnopf(aktion) {
    const a = el('a', 'online-knopf')
    a.href = '../' + aktion.adresse
    const logo = el('span', 'online-logo')
    const s = sym(aktion.logo)
    if (s) logo.append(s)
    const text = el('span', 'online-text')
    text.append(el('strong', null, aktion.text), el('small', null, aktion.info))
    const pfeil = el('span', 'online-pfeil')
    const p = sym('weiter')
    if (p) pfeil.append(p)
    else pfeil.textContent = '›'
    a.append(logo, text, pfeil)
    return a
  }

  function karten() {
    const suche = $('suche').value.trim().toLocaleLowerCase('de')
    const liste = ANGEBOTE.filter((a) => (!art || a.gruppe === art) && suchtreffer(a, suche))
    const box = $('karten')
    box.textContent = ''
    if (!liste.length) return box.append(el('p', 'leer', 'Nichts gefunden.'))
    // Bei „Alle“ jede Art als eigene Liste mit Titel, sonst eine Liste
    GRUPPEN.forEach((g) => {
      const imG = liste.filter((a) => a.gruppe === g.id)
      if (!imG.length) return
      // Titel der Gruppe (bei „Alle“) und – falls vorhanden – der große Online-Knopf der Gruppe
      if (!art) box.append(el('h3', 'liste-titel', g.name))
      if (g.aktion) box.append(onlineKnopf(g.aktion))
      const ul = el('ul', 'liste-gruppe')
      imG.forEach((a) => ul.append(zeile(a)))
      box.append(ul)
    })
  }

  // ---------- QR-Code groß (Beamer) ----------
  const dialog = $('qr-dialog')
  function zeigeQr(titel, adresse) {
    $('qr-titel').textContent = titel
    $('qr-adresse').textContent = adresse.replace(/^https?:\/\//, '')
    const bild = $('qr-bild')
    bild.textContent = ''
    window.QRCode.toString(adresse, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' }, (fehler, svg) => {
      if (fehler) return (bild.textContent = 'QR-Code konnte nicht erstellt werden.')
      bild.innerHTML = svg // stammt aus der QR-Bibliothek, nicht aus Eingaben
      bild.firstElementChild.setAttribute('role', 'img')
      bild.firstElementChild.setAttribute('aria-label', 'QR-Code für ' + titel)
    })
    dialog.showModal()
  }
  function qrKnopf(titel, adresse) {
    const k = el('button', 'qr-knopf rund')
    const svg = sym('qr')
    if (svg) k.append(svg)
    else k.textContent = 'QR'
    k.type = 'button'
    k.setAttribute('aria-label', 'QR-Code für „' + titel + '“ zeigen')
    k.addEventListener('click', () => zeigeQr(titel, adresse))
    return k
  }
  $('qr-schliessen').addEventListener('click', () => dialog.close())
  dialog.addEventListener('click', (e) => e.target === dialog && dialog.close())
  $('qr-auswahl').addEventListener('click', () => zeigeQr($('ueberschrift').textContent, location.href))

  // ---------- Zeichnen ----------
  function zeichne() {
    const neu = location.pathname + (art ? '?art=' + art : '') + location.hash
    if (neu !== location.pathname + location.search + location.hash) history.replaceState(null, '', neu)
    baum()
    kopf()
    karten()
    const g = GRUPPEN.find((x) => x.id === art)
    document.title = (g ? g.name + ' – ' : '') + 'Vertretung'
  }
  $('suche').addEventListener('input', karten)

  // ---------- Navigationsleiste: Symbole, hell/dunkel, kleiner Titel beim Scrollen ----------
  if (sym('zurueck')) $('zurueck-symbol').replaceChildren(sym('zurueck'))
  if (sym('suche')) $('such-symbol').replaceWith(sym('suche'))
  const designKnopf = $('design-knopf')
  function designSymbol() {
    const dunkel = window.LehrraumDesign && window.LehrraumDesign.aktuell() === 'dunkel'
    designKnopf.replaceChildren(sym(dunkel ? 'sonne' : 'mond') || document.createTextNode(dunkel ? '☀' : '☾'))
    designKnopf.setAttribute('aria-label', dunkel ? 'Heller Modus' : 'Dunkler Modus')
    designKnopf.title = dunkel ? 'Heller Modus' : 'Dunkler Modus'
  }
  if (window.LehrraumDesign) {
    designKnopf.addEventListener('click', () => window.LehrraumDesign.umschalten())
    document.addEventListener('lehrraum-design', designSymbol)
    designSymbol()
  } else designKnopf.hidden = true
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => document.body.classList.toggle('gescrollt', !e.isIntersecting), { rootMargin: '-64px 0px 0px 0px' }).observe($('ueberschrift'))
  }

  zeichne()
})()
