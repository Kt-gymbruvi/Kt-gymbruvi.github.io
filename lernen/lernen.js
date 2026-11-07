/* Lernangebote: Baum Fach › Jahrgang › Thema, Suche, Sortierung. Die Auswahl steht in der Adresse
   (z. B. ?fach=bio&stufe=7), damit man sie per QR-Code am Beamer teilen kann. Keine Daten verlassen das Gerät. */
;(function () {
  'use strict'

  const FAECHER = window.FAECHER || []
  const STUFEN = window.STUFEN || []
  const THEMEN = window.THEMEN || []
  const ANGEBOTE = (window.ANGEBOTE || []).map((a) => ({ ...a, stufen: a.stufen || [] }))
  const ALLE_JG = 'alle' // Angebote ohne Jahrgang („für alle Jahrgänge“)
  const OHNE_THEMA = 'ohne'

  const $ = (id) => document.getElementById(id)
  function el(tag, klasse, text) {
    const e = document.createElement(tag)
    if (klasse) e.className = klasse
    if (text != null) e.textContent = text
    return e
  }
  const name = (liste, id) => (liste.find((x) => x.id === id) || {}).name || id
  const vergleich = new Intl.Collator('de', { numeric: true, sensitivity: 'base' })

  // ---------- Zustand aus der Adresse ----------
  const p = new URLSearchParams(location.search)
  const zustand = {
    fach: p.get('fach'),
    stufe: p.get('stufe'),
    thema: p.get('thema'),
  }
  const SORTIERUNGEN = ['jahrgang', 'name', 'datum']
  let sortierung = 'jahrgang'
  try {
    const g = localStorage.getItem('lernen-sortierung')
    if (SORTIERUNGEN.includes(g)) sortierung = g
  } catch {
    /* egal */
  }
  $('sortierung').value = sortierung

  // ---------- Filter ----------
  const imFach = (a, f) => !f || a.fach === f
  const inStufe = (a, s) => !s || (s === ALLE_JG ? !a.stufen.length : a.stufen.includes(s) || !a.stufen.length)
  const imThema = (a, t) => !t || (t === OHNE_THEMA ? !a.thema : a.thema === t)
  const passt = (a, z) => imFach(a, z.fach) && inStufe(a, z.stufe) && imThema(a, z.thema)

  function suchtreffer(a, s) {
    if (!s) return true
    const heu = [a.titel, a.text, name(FAECHER, a.fach), name(THEMEN, a.thema), ...a.stufen.map((x) => name(STUFEN, x)), a.stufen.includes('sek2') ? 'oberstufe' : '']
      .join(' ')
      .toLocaleLowerCase('de')
    return s.split(/\s+/).every((w) => heu.includes(w))
  }

  // ---------- Baum ----------
  function ast(text, anzahl, aktiv, onClick, symbol) {
    const li = el('li')
    const b = el('button', 'ast')
    b.type = 'button'
    if (aktiv) b.setAttribute('aria-current', 'true')
    if (symbol) b.append(el('span', null, symbol))
    b.append(el('span', 'name', text), el('span', 'zahl', String(anzahl)))
    b.addEventListener('click', onClick)
    li.append(b)
    return li
  }

  function waehle(z) {
    zustand.fach = z.fach ?? null
    zustand.stufe = z.stufe ?? null
    zustand.thema = z.thema ?? null
    zeichne()
  }

  function baum() {
    const nav = $('baum')
    nav.textContent = ''
    const ul = el('ul', 'ebene-1')
    ul.append(ast('Alle', ANGEBOTE.length, !zustand.fach, () => waehle({}), '📚'))
    FAECHER.forEach((f) => {
      const imF = ANGEBOTE.filter((a) => a.fach === f.id)
      if (!imF.length) return
      const li = ast(f.name, imF.length, zustand.fach === f.id && !zustand.stufe, () => waehle({ fach: f.id }), f.symbol)
      if (zustand.fach === f.id) {
        const stufen = el('ul', 'ebene-2')
        STUFEN.forEach((s) => {
          if (!imF.some((a) => a.stufen.includes(s.id))) return
          const n = imF.filter((a) => inStufe(a, s.id)).length // inkl. „für alle Jahrgänge“
          const sLi = ast(s.name, n, zustand.stufe === s.id && !zustand.thema, () => waehle({ fach: f.id, stufe: s.id }))
          // Themen nur, wenn es in diesem Jahrgang welche gibt
          const imS = imF.filter((a) => a.stufen.includes(s.id))
          if (zustand.stufe === s.id && imS.some((a) => a.thema)) {
            const themen = el('ul', 'ebene-3')
            THEMEN.forEach((t) => {
              const m = imS.filter((a) => a.thema === t.id).length
              if (m) themen.append(ast(t.name, m, zustand.thema === t.id, () => waehle({ fach: f.id, stufe: s.id, thema: t.id })))
            })
            const ohne = imS.filter((a) => !a.thema).length
            if (ohne) themen.append(ast('Ohne Thema', ohne, zustand.thema === OHNE_THEMA, () => waehle({ fach: f.id, stufe: s.id, thema: OHNE_THEMA })))
            sLi.append(themen)
          }
          stufen.append(sLi)
        })
        const alle = imF.filter((a) => !a.stufen.length).length
        if (alle) stufen.append(ast('Für alle Jahrgänge', alle, zustand.stufe === ALLE_JG, () => waehle({ fach: f.id, stufe: ALLE_JG })))
        li.append(stufen)
      }
      ul.append(li)
    })
    nav.append(ul)
  }

  // ---------- Überschrift und Pfad ----------
  function kopf() {
    const teile = []
    if (zustand.fach) teile.push({ text: name(FAECHER, zustand.fach), z: { fach: zustand.fach } })
    if (zustand.stufe) teile.push({ text: zustand.stufe === ALLE_JG ? 'Für alle Jahrgänge' : name(STUFEN, zustand.stufe), z: { fach: zustand.fach, stufe: zustand.stufe } })
    if (zustand.thema) teile.push({ text: zustand.thema === OHNE_THEMA ? 'Ohne Thema' : name(THEMEN, zustand.thema), z: { ...zustand } })
    $('ueberschrift').textContent = teile.length ? teile[teile.length - 1].text : 'Alle Lernangebote'
    const pfad = $('pfad')
    pfad.textContent = ''
    if (!teile.length) return
    const start = el('button', null, 'Alle')
    start.type = 'button'
    start.addEventListener('click', () => waehle({}))
    pfad.append(start)
    teile.slice(0, -1).forEach((t) => {
      pfad.append(el('span', null, '›'))
      const b = el('button', null, t.text)
      b.type = 'button'
      b.addEventListener('click', () => waehle(t.z))
      pfad.append(b)
    })
    pfad.append(el('span', null, '›'))
  }

  // ---------- Karten ----------
  // Position im Jahrgang (für die Sortierung); „für alle Jahrgänge“ ans Ende
  const stufenRang = (a) => (a.stufen.length ? Math.min(...a.stufen.map((s) => STUFEN.findIndex((x) => x.id === s))) : STUFEN.length)
  const nachName = (a, b) => vergleich.compare(a.titel, b.titel)

  function zeile(a) {
    const li = el('li', 'karte')
    const link = el('a')
    link.href = a.ordner + '/'
    const text = el('span', 'inhalt')
    text.append(el('span', 'titel', a.titel))
    if (a.text) text.append(el('span', 'info', a.text))
    const marken = el('span', 'marken')
    marken.append(el('span', 'marke fach', name(FAECHER, a.fach)))
    if (!a.stufen.length) marken.append(el('span', 'marke', 'alle Jahrgänge'))
    a.stufen.forEach((s) => marken.append(el('span', 'marke', name(STUFEN, s))))
    if (a.thema) marken.append(el('span', 'marke', name(THEMEN, a.thema)))
    text.append(marken)
    link.append(text, el('span', 'oeffnen', 'Öffnen ›'))
    li.append(link, qrKnopf(a.titel, new URL(a.ordner + '/', location.href).href))
    return li
  }

  function karten() {
    const suche = $('suche').value.trim().toLocaleLowerCase('de')
    const liste = ANGEBOTE.filter((a) => passt(a, zustand) && suchtreffer(a, suche))
    const ul = $('karten')
    ul.textContent = ''
    if (!liste.length) {
      ul.append(el('li', 'leer', suche ? 'Nichts gefunden.' : 'Hier gibt es noch keine Lernangebote.'))
      return
    }
    if (sortierung === 'datum') liste.sort((a, b) => (b.datum || '').localeCompare(a.datum || '') || nachName(a, b))
    else if (sortierung === 'name') liste.sort(nachName)
    else liste.sort((a, b) => stufenRang(a) - stufenRang(b) || nachName(a, b))

    // Nach Jahrgang: Zwischenüberschriften (außer ein Jahrgang ist schon gewählt)
    const gruppieren = sortierung === 'jahrgang' && !zustand.stufe
    let letzte = null
    liste.forEach((a) => {
      if (gruppieren) {
        const rang = stufenRang(a)
        if (rang !== letzte) {
          letzte = rang
          ul.append(el('li', 'gruppe', rang < STUFEN.length ? STUFEN[rang].name : 'Für alle Jahrgänge'))
        }
      }
      ul.append(zeile(a))
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
    const k = el('button', 'qr-knopf', 'QR')
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
    // Auswahl in die Adresse schreiben (teilbar, Zurück-Knopf bleibt nutzbar)
    const q = new URLSearchParams()
    for (const k of ['fach', 'stufe', 'thema']) if (zustand[k]) q.set(k, zustand[k])
    const neu = location.pathname + (q.toString() ? '?' + q : '')
    if (neu !== location.pathname + location.search) history.replaceState(null, '', neu)
    baum()
    kopf()
    karten()
    document.title = ($('ueberschrift').textContent === 'Alle Lernangebote' ? '' : $('ueberschrift').textContent + ' – ') + 'Lernangebote'
  }

  $('suche').addEventListener('input', karten)
  $('sortierung').addEventListener('change', (e) => {
    sortierung = e.target.value
    try {
      localStorage.setItem('lernen-sortierung', sortierung)
    } catch {
      /* egal */
    }
    karten()
  })
  zeichne()
})()
