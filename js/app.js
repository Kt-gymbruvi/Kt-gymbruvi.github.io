/* Startseite „Lehrraum“: baut Seitenleiste, Begrüßung, Kacheln, Schnellzugriff, Werkzeuge und Materialliste
   aus js/inhalte.js. Zwei Fassungen: angemeldete Lehrkräfte sehen alles, ohne Anmeldung gibt es die schlanke
   Fassung (Mitmachen mit PIN, Lernangebote, Werkzeuge).
   Zum Server geht nur die Anmeldung (lernen/datenbank.js). Suche und „Zuletzt benutzt“ laufen im Gerät. */
;(function () {
  'use strict'

  const SEITE = window.SEITE || {}
  const NAVIGATION = window.NAVIGATION || []
  const MITMACHEN = window.MITMACHEN || {}
  const LINKS = window.LINKS || []
  const SCHNELLZUGRIFF = window.SCHNELLZUGRIFF || []
  const KLASSEN = window.KLASSEN || null
  const WERKZEUGE = window.WERKZEUGE || []
  const MATERIALIEN = window.MATERIALIEN || []
  const ANGEBOTE = window.ANGEBOTE || []

  const $ = (id) => document.getElementById(id)
  /** kleines Hilfsmittel: Element mit Klasse und Text */
  function el(tag, klasse, text) {
    const e = document.createElement(tag)
    if (klasse) e.className = klasse
    if (text != null) e.textContent = text
    return e
  }

  /** Symbol aus gemeinsam/symbole.js; unbekannte Namen (z. B. ein Emoji) erscheinen als Text */
  function zeichen(name, klasse) {
    const huelle = el('span', klasse)
    huelle.setAttribute('aria-hidden', 'true')
    const svg = name && window.LehrraumSymbol ? window.LehrraumSymbol(name) : null
    if (svg) huelle.append(svg)
    else huelle.textContent = name || ''
    return huelle
  }

  const volleAdresse = (pfad) => new URL(pfad, location.href).href
  const klein = (s) => (s || '').toLocaleLowerCase('de')

  /** Wer sieht einen Eintrag? nur: 'lehrkraft' | 'gast' | 'material' (nur wenn es Materialien gibt) | nichts = alle */
  let lehrkraft = false
  const sichtbar = (e) => (e.nur === 'lehrkraft' ? lehrkraft : e.nur === 'gast' ? !lehrkraft : e.nur === 'material' ? MATERIALIEN.length > 0 : true)

  // ---------- Zuletzt benutzt (nur in diesem Gerät gemerkt) ----------
  const ZULETZT = 'lehrraum-zuletzt'
  const MAX_ZULETZT = 6
  function ladeZuletzt() {
    try {
      const liste = JSON.parse(localStorage.getItem(ZULETZT) || '[]')
      return Array.isArray(liste) ? liste.filter((z) => z && typeof z.titel === 'string' && typeof z.adresse === 'string' && typeof z.zeit === 'number').slice(0, MAX_ZULETZT) : []
    } catch {
      return []
    }
  }
  function merke(titel, adresse, symbol) {
    try {
      const liste = [{ titel, adresse, symbol: symbol || 'verweis', zeit: Date.now() }, ...ladeZuletzt().filter((z) => z.adresse !== adresse)].slice(0, MAX_ZULETZT)
      localStorage.setItem(ZULETZT, JSON.stringify(liste))
    } catch {
      /* ohne Speicher gibt es eben keine Liste */
    }
  }
  /** Verweis, der sich beim Anklicken in „Zuletzt benutzt“ einträgt */
  function verweis(klasse, titel, adresse, symbol) {
    const a = el('a', klasse)
    a.href = adresse
    if (/^https?:/i.test(adresse) && !adresse.startsWith(location.origin)) a.rel = 'noopener'
    a.addEventListener('click', () => merke(titel, adresse, symbol))
    return a
  }
  function wann(zeit) {
    const tage = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(zeit).setHours(0, 0, 0, 0)) / 86400000)
    return tage <= 0 ? 'heute' : tage === 1 ? 'gestern' : new Date(zeit).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })
  }

  const TYPEN = {
    pdf: 'PDF',
    doc: 'Word', docx: 'Word', odt: 'Text',
    ppt: 'Folien', pptx: 'Folien', odp: 'Folien',
    xls: 'Tabelle', xlsx: 'Tabelle', ods: 'Tabelle', csv: 'Tabelle',
    png: 'Bild', jpg: 'Bild', jpeg: 'Bild', gif: 'Bild', svg: 'Bild', webp: 'Bild',
    mp3: 'Audio', m4a: 'Audio', ogg: 'Audio',
    mp4: 'Video', webm: 'Video',
    zip: 'ZIP', txt: 'Text', html: 'Seite',
  }
  function typ(datei) {
    if (/^https?:/i.test(datei) && !/\.[a-z0-9]{2,4}([?#].*)?$/i.test(new URL(datei).pathname)) return 'Link'
    const endung = (datei.split(/[?#]/)[0].split('.').pop() || '').toLowerCase()
    return TYPEN[endung] || 'Datei'
  }

  // ---------- QR-Code groß anzeigen ----------
  const dialog = $('qr-dialog')
  function zeigeQr(titel, adresse) {
    $('qr-titel').textContent = titel
    $('qr-adresse').textContent = adresse.replace(/^https?:\/\//, '')
    const bild = $('qr-bild')
    bild.textContent = ''
    window.QRCode.toString(adresse, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' }, (fehler, svg) => {
      if (fehler) {
        bild.textContent = 'QR-Code konnte nicht erstellt werden.'
        return
      }
      bild.innerHTML = svg // SVG kommt aus der QR-Bibliothek, nicht aus Nutzereingaben
      bild.firstElementChild.setAttribute('role', 'img')
      bild.firstElementChild.setAttribute('aria-label', 'QR-Code für ' + titel)
    })
    dialog.showModal()
  }
  $('qr-schliessen').addEventListener('click', () => dialog.close())
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close() // Klick neben das Fenster
  })

  function qrKnopf(titel, adresse) {
    const k = el('button', 'qr-knopf', 'QR')
    k.type = 'button'
    k.title = 'QR-Code groß zeigen'
    k.setAttribute('aria-label', 'QR-Code für „' + titel + '“ zeigen')
    k.addEventListener('click', (e) => {
      e.preventDefault()
      zeigeQr(titel, adresse)
    })
    return k
  }

  // ---------- Kopf ----------
  if (SEITE.titel) {
    $('titel').textContent = SEITE.titel
    document.title = SEITE.titel
  }
  $('zeile').textContent = SEITE.zeile || ''
  $('such-symbol').replaceWith(zeichen('suche'))
  $('klassen-symbol').replaceWith(zeichen('klassen', 'titel-symbol'))
  $('zuletzt-symbol').replaceWith(zeichen('uhr', 'titel-symbol'))
  $('schnell-symbol').replaceWith(zeichen('blitz', 'titel-symbol'))

  // Seitenleiste auf schmalen Bildschirmen auf- und zuklappen
  const geruest = $('geruest')
  const leisteKnopf = $('leiste-knopf')
  leisteKnopf.append(zeichen('menue'))
  leisteKnopf.addEventListener('click', () => {
    const offen = geruest.classList.toggle('leiste-offen')
    leisteKnopf.setAttribute('aria-expanded', String(offen))
    leisteKnopf.setAttribute('aria-label', offen ? 'Menü schließen' : 'Menü öffnen')
  })

  // ---------- Heller und dunkler Modus ----------
  const designKnopf = $('design-knopf')
  function zeichneDesignKnopf() {
    const dunkel = window.LehrraumDesign && window.LehrraumDesign.aktuell() === 'dunkel'
    designKnopf.textContent = ''
    designKnopf.append(zeichen(dunkel ? 'sonne' : 'mond'), el('span', null, dunkel ? 'Heller Modus' : 'Dunkler Modus'))
  }
  if (window.LehrraumDesign) {
    designKnopf.addEventListener('click', () => window.LehrraumDesign.umschalten())
    document.addEventListener('lehrraum-design', zeichneDesignKnopf)
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', zeichneDesignKnopf)
    zeichneDesignKnopf()
  } else {
    designKnopf.hidden = true
  }

  // ---------- Seitenleiste ----------
  function zeichneNavigation() {
    const liste = $('navigation')
    liste.textContent = ''
    NAVIGATION.filter(sichtbar).forEach((n) => {
      if (!n.adresse && !SEITE.geplantesZeigen) return
      const li = el('li')
      // Bereiche ohne Adresse gibt es noch nicht: kein Link, sondern Text mit dem Hinweis „folgt“
      const punkt = n.adresse ? verweis('leisten-punkt', n.titel, n.adresse, n.symbol) : el('span', 'leisten-punkt geplant')
      if (n.hier) punkt.setAttribute('aria-current', 'page')
      punkt.append(zeichen(n.symbol), el('span', null, n.titel))
      if (!n.adresse) punkt.append(el('small', null, 'folgt'))
      li.append(punkt)
      liste.append(li)
    })
  }

  // ---------- Begrüßung ----------
  /** Schlichte Zeichnung einer Tafel (eigene Zeichnung, kein Foto) */
  const TAFELBILD =
    '<svg viewBox="0 0 320 200" role="presentation" focusable="false">' +
    '<rect x="150" y="14" width="150" height="24" rx="12" fill="var(--tuerkis-hell)" opacity=".35"/>' +
    '<rect x="40" y="30" width="240" height="130" rx="10" fill="var(--navy)"/>' +
    '<rect x="50" y="40" width="220" height="110" rx="5" fill="#ffffff"/>' +
    '<path d="M70 78c18-16 30 14 48-2s26 12 44 0" fill="none" stroke="var(--tuerkis)" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M70 108h96M70 126h62" stroke="var(--navy)" stroke-width="6" stroke-linecap="round" opacity=".25"/>' +
    '<circle cx="222" cy="108" r="22" fill="none" stroke="var(--tuerkis)" stroke-width="5"/>' +
    '<path d="M213 112c4 6 14 6 18 0M214 101h.1M230 101h.1" fill="none" stroke="var(--tuerkis)" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M120 160l-12 30M200 160l12 30" stroke="var(--navy)" stroke-width="8" stroke-linecap="round"/>' +
    '<rect x="262" y="52" width="18" height="18" rx="4" fill="var(--tuerkis)"/><rect x="288" y="40" width="12" height="12" rx="3" fill="var(--tuerkis-hell)"/><rect x="286" y="66" width="10" height="10" rx="3" fill="var(--tuerkis)"/>' +
    '</svg>'
  $('begruessung-bild').innerHTML = TAFELBILD // feste Zeichnung aus dieser Datei

  function zeichneBegruessung() {
    $('begruessung-titel').textContent = lehrkraft ? SEITE.willkommen || 'Willkommen!' : SEITE.gastTitel || 'Mitmachen und lernen'
    $('begruessung-zeile').textContent = (lehrkraft ? SEITE.willkommenText : SEITE.gastText) || ''
    const tafel = NAVIGATION.find((n) => n.symbol === 'bildschirm' && n.adresse)
    const knopf = $('begruessung-knopf')
    knopf.textContent = ''
    knopf.hidden = !tafel
    if (tafel) {
      knopf.href = tafel.adresse
      knopf.append(zeichen('bildschirm'), el('span', null, 'Zur Tafel'))
      knopf.onclick = () => merke(tafel.titel, tafel.adresse, tafel.symbol)
    }
  }

  // ---------- Mitmachen mit PIN (schlanke Fassung) ----------
  const pinFeld = $('pin')
  const pinFehler = $('pin-fehler')
  function pinMeldung(text) {
    pinFehler.textContent = text
    pinFehler.hidden = !text
    pinFeld.setAttribute('aria-invalid', String(!!text))
  }
  pinFeld.addEventListener('input', () => {
    pinFeld.value = pinFeld.value.replace(/\D/g, '').slice(0, 6)
    pinMeldung('')
  })
  document.querySelectorAll('#pin-form [data-ziel]').forEach((knopf) => {
    const basis = MITMACHEN[knopf.dataset.ziel]
    if (!basis) {
      knopf.hidden = true
      return
    }
    knopf.addEventListener('click', () => {
      if (!/^\d{6}$/.test(pinFeld.value)) {
        pinMeldung('Die PIN hat sechs Ziffern. Sie steht am Beamer.')
        pinFeld.focus()
        return
      }
      location.href = basis + pinFeld.value
    })
  })
  $('pin-form').addEventListener('submit', (e) => {
    e.preventDefault() // Eingabetaste: Quiz und Abstimmung haben getrennte PINs, also erst wählen lassen
    pinMeldung(/^\d{6}$/.test(pinFeld.value) ? 'Bitte wählen: Quiz oder Abstimmung.' : 'Die PIN hat sechs Ziffern. Sie steht am Beamer.')
  })

  // ---------- Kacheln ----------
  function zeichneKacheln() {
    const liste = $('links')
    liste.textContent = ''
    LINKS.filter(sichtbar).forEach((l) => {
      if (!l.adresse && !SEITE.geplantesZeigen) return
      const li = el('li')
      const a = l.adresse ? verweis('kachel', l.titel, l.adresse, l.symbol) : el('div', 'kachel geplant')
      if (l.farbe) a.classList.add('farbe-' + l.farbe)
      a.append(zeichen(l.symbol || 'verweis', 'kachel-symbol'))
      a.append(el('span', 'kachel-titel', l.titel))
      const text = (!lehrkraft && l.textGast) || l.text
      if (text) a.append(el('span', 'kachel-text', text))
      a.append(l.adresse ? zeichen('pfeil', 'kachel-pfeil') : el('small', 'kachel-folgt', 'folgt'))
      li.append(a)
      // QR-Knopf liegt neben dem Link über der Kachel (Knöpfe in Links wären ungültig)
      if (l.adresse && l.qr !== false) li.append(qrKnopf(l.titel, volleAdresse(l.adresse)))
      liste.append(li)
    })
  }

  // ---------- Meine Klassen (nur Lehrkraft; die Klassen liegen auf diesem Gerät) ----------
  let klassenLauf = 0
  async function zeichneKlassen() {
    const bereich = document.querySelector('.klassen')
    const liste = $('klassen')
    if (!KLASSEN || !window.LehrraumKlassen) return (bereich.hidden = true)
    $('klassen-alle').href = KLASSEN.verwalten
    if (!lehrkraft) return
    const lauf = ++klassenLauf
    const klassen = await window.LehrraumKlassen.laden()
    if (lauf !== klassenLauf) return // inzwischen wurde neu gezeichnet
    liste.textContent = ''
    klassen.slice(0, KLASSEN.hoechstens).forEach((k) => {
      const name = [k.bezeichnung, k.fach].filter(Boolean).join(' ')
      const li = el('li', 'klassen-karte')
      li.append(el('span', 'klassen-name', k.bezeichnung), el('span', 'klassen-fach', k.fach || 'ohne Fach'))
      const a = verweis('knopf dunkel', 'Tafel ' + name, KLASSEN.tafel + k.id, 'bildschirm')
      a.setAttribute('aria-label', 'Zur Tafel von ' + name)
      a.append(el('span', null, 'Zur Tafel'), zeichen('pfeil', 'knopf-pfeil'))
      li.append(a)
      liste.append(li)
    })
    const neu = el('li', 'klassen-karte neu')
    const a = el('a', 'klassen-neu')
    a.href = KLASSEN.neu
    a.append(zeichen('plus', 'klassen-plus'), el('span', null, 'Neue Klasse anlegen'))
    neu.append(a)
    liste.append(neu)
    if (klassen.length > KLASSEN.hoechstens) $('klassen-alle').textContent = `Alle ${klassen.length} Klassen anzeigen`
  }

  // ---------- Zuletzt benutzt und Schnellzugriff (nur Lehrkraft) ----------
  function zeile(titel, adresse, symbol, farbe, zusatz) {
    const li = el('li')
    const a = verweis('zeile', titel, adresse, symbol)
    a.append(zeichen(symbol, 'zeilen-symbol' + (farbe ? ' farbe-' + farbe : '')), el('span', 'zeilen-titel', titel))
    if (zusatz) a.append(el('span', 'zeilen-zusatz', zusatz))
    a.append(zeichen('pfeil', 'zeilen-pfeil'))
    li.append(a)
    return li
  }
  function zeichneListen() {
    const zuletzt = $('zuletzt')
    zuletzt.textContent = ''
    const liste = ladeZuletzt()
    liste.forEach((z) => zuletzt.append(zeile(z.titel, z.adresse, z.symbol, null, wann(z.zeit))))
    if (!liste.length) zuletzt.append(el('li', 'leer', 'Hier erscheint, was du zuletzt geöffnet hast.'))

    const schnell = $('schnellzugriff')
    schnell.textContent = ''
    SCHNELLZUGRIFF.forEach((s) => schnell.append(zeile(s.titel, s.adresse, s.symbol, s.farbe)))
  }

  // ---------- Werkzeuge (nach Bereich gruppiert) ----------
  const werkzeugListe = $('werkzeuge')
  if (!WERKZEUGE.length) $('werkzeuge-bereich').hidden = true
  const bereiche = [...new Set(WERKZEUGE.map((w) => w.bereich || 'Allgemein'))]
  bereiche.forEach((b) => {
    const gruppe = el('li', 'werkzeug-gruppe')
    if (bereiche.length > 1) gruppe.append(el('h3', null, b))
    const ul = el('ul', 'werkzeug-karten')
    WERKZEUGE.filter((w) => (w.bereich || 'Allgemein') === b).forEach((w) => {
      const li = el('li')
      const a = verweis('werkzeug mit-qr', w.titel, w.adresse, w.symbol)
      a.append(zeichen(w.symbol || 'werkzeug', 'werkzeug-symbol'))
      const textteil = el('span', 'werkzeug-text')
      textteil.append(el('span', 'werkzeug-titel', w.titel))
      if (w.text) textteil.append(el('span', 'werkzeug-info', w.text))
      a.append(textteil)
      li.append(a, qrKnopf(w.titel, volleAdresse(w.adresse)))
      ul.append(li)
    })
    gruppe.append(ul)
    werkzeugListe.append(gruppe)
  })

  // ---------- Materialien ----------
  const ziel = $('materialien')
  const faecherLeiste = $('faecher')
  const suchFeld = $('suche')
  const faecher = [...new Set(MATERIALIEN.map((m) => m.fach || 'Allgemein'))].sort((a, b) => a.localeCompare(b, 'de'))
  let gewaehltesFach = null

  function fachKnopf(name, wert) {
    const k = el('button', 'fach-knopf', name)
    k.type = 'button'
    k.setAttribute('aria-pressed', String(gewaehltesFach === wert))
    k.addEventListener('click', () => {
      gewaehltesFach = wert
      zeichneMaterial()
    })
    return k
  }

  function zeichneMaterial() {
    // Fach-Filter (nur wenn es mehr als ein Fach gibt)
    faecherLeiste.textContent = ''
    if (faecher.length > 1) {
      faecherLeiste.append(fachKnopf('Alle', null))
      faecher.forEach((f) => faecherLeiste.append(fachKnopf(f, f)))
    }

    const suche = klein(suchFeld.value.trim())
    const treffer = MATERIALIEN.filter((m) => {
      if (gewaehltesFach && (m.fach || 'Allgemein') !== gewaehltesFach) return false
      if (!suche) return true
      return [m.titel, m.text, m.fach, m.klasse && 'klasse ' + m.klasse].some((t) => klein(t).includes(suche))
    })

    ziel.textContent = ''
    if (!MATERIALIEN.length) {
      // ohne Materialien den ganzen Bereich ausblenden
      $('material-bereich').hidden = true
      return
    }
    if (!treffer.length) {
      ziel.append(el('p', 'leer', 'Nichts gefunden.'))
      return
    }

    faecher.forEach((fach) => {
      const eintraege = treffer.filter((m) => (m.fach || 'Allgemein') === fach)
      if (!eintraege.length) return
      const gruppe = el('section', 'fach-gruppe')
      gruppe.append(el('h3', null, fach))
      const ul = el('ul', 'liste')
      eintraege.forEach((m) => {
        const li = el('li', 'eintrag')
        li.append(el('span', 'typ', typ(m.datei)))
        const a = verweis('eintrag-link', m.titel, m.datei, 'datei')
        a.append(el('span', 'eintrag-titel', m.titel))
        const info = [m.klasse && 'Klasse ' + m.klasse, m.text].filter(Boolean).join(' · ')
        if (info) a.append(el('span', 'eintrag-info', info))
        li.append(a, qrKnopf(m.titel, volleAdresse(m.datei)))
        ul.append(li)
      })
      gruppe.append(ul)
      ziel.append(gruppe)
    })
  }
  suchFeld.addEventListener('input', zeichneMaterial)
  zeichneMaterial()

  // ---------- Suche über die ganze Plattform (läuft im Gerät) ----------
  const FACHNAMEN = Object.fromEntries((window.FAECHER || []).map((f) => [f.id, f.name]))
  function suchbestand() {
    return [
      ...LINKS.filter((l) => l.adresse && sichtbar(l)).map((l) => ({ titel: l.titel, text: (!lehrkraft && l.textGast) || l.text, adresse: l.adresse, symbol: l.symbol, art: 'Bereich' })),
      ...(lehrkraft ? SCHNELLZUGRIFF.map((s) => ({ titel: s.titel, text: '', adresse: s.adresse, symbol: s.symbol, art: 'Schnellzugriff' })) : []),
      ...WERKZEUGE.map((w) => ({ titel: w.titel, text: w.text, adresse: w.adresse, symbol: w.symbol, art: 'Werkzeug' })),
      ...ANGEBOTE.filter((a) => a.sichtbar !== false).map((a) => ({ titel: a.titel, text: a.text, adresse: 'lernen/' + a.ordner + '/', symbol: 'lernen', art: 'Lernangebot · ' + (FACHNAMEN[a.fach] || a.fach || '') })),
      ...MATERIALIEN.map((m) => ({ titel: m.titel, text: m.text, adresse: m.datei, symbol: 'datei', art: 'Material' })),
    ]
  }
  const sucheFeld = $('plattform-suche')
  const trefferListe = $('suchtreffer')
  const MAX_TREFFER = 8
  function suche() {
    const worte = klein(sucheFeld.value.trim()).split(/\s+/).filter(Boolean)
    trefferListe.textContent = ''
    trefferListe.hidden = !worte.length
    if (!worte.length) return
    // Treffer im Titel zuerst
    const treffer = suchbestand()
      .map((e) => ({ e, imTitel: worte.every((w) => klein(e.titel).includes(w)), ueberhaupt: worte.every((w) => klein(e.titel + ' ' + (e.text || '') + ' ' + e.art).includes(w)) }))
      .filter((t) => t.ueberhaupt)
      .sort((a, b) => Number(b.imTitel) - Number(a.imTitel))
    treffer.slice(0, MAX_TREFFER).forEach(({ e }) => {
      const li = el('li')
      const a = verweis(null, e.titel, e.adresse, e.symbol)
      a.append(el('b', null, e.titel), el('small', null, e.art))
      li.append(a)
      trefferListe.append(li)
    })
    if (!treffer.length) trefferListe.append(el('li', 'leer', 'Nichts gefunden.'))
    else if (treffer.length > MAX_TREFFER) trefferListe.append(el('li', 'leer', `und ${treffer.length - MAX_TREFFER} weitere – bitte genauer suchen`))
  }
  sucheFeld.addEventListener('input', suche)
  sucheFeld.addEventListener('focus', suche)
  sucheFeld.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      sucheFeld.value = ''
      suche()
    }
    if (e.key === 'Enter') trefferListe.querySelector('a')?.click() // Eingabetaste öffnet den ersten Treffer
  })
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.suchfeld')) trefferListe.hidden = true
    if (!e.target.closest('.konto')) schliesseKonto()
  })

  // ---------- Anmeldung der Lehrkraft ----------
  const DB = window.LernDB
  const GEMEINSAM = 'sb-ifdqfndsvgiyvxvxtoga-auth-token' // dieselbe Anmeldung wie Quizzo, Klassenfunk und die Tafel
  const kontoKnopf = $('konto-knopf')
  const kontoMenue = $('konto-menue')
  function schliesseKonto() {
    kontoMenue.hidden = true
    kontoKnopf.setAttribute('aria-expanded', 'false')
  }
  kontoKnopf.addEventListener('click', () => {
    kontoMenue.hidden = !kontoMenue.hidden
    kontoKnopf.setAttribute('aria-expanded', String(!kontoMenue.hidden))
  })

  /** Kürzel aus der E-Mail-Adresse: „max.kruse@…“ → MK, „stephan@…“ → ST */
  function kuerzel(email) {
    const teile = String(email || '').split('@')[0].split(/[._-]+/).filter(Boolean)
    const k = teile.length > 1 ? teile[0][0] + teile[1][0] : (teile[0] || '').slice(0, 2)
    return k.toUpperCase() || '?'
  }

  function setzeRolle(sitzung) {
    lehrkraft = !!sitzung
    document.body.dataset.rolle = lehrkraft ? 'lehrkraft' : 'gast'
    $('anmelde-knopf').hidden = lehrkraft || !DB
    $('konto').hidden = !lehrkraft
    if (lehrkraft) {
      const email = (sitzung.user && sitzung.user.email) || ''
      kontoKnopf.textContent = kuerzel(email)
      kontoKnopf.setAttribute('aria-label', 'Konto: ' + (email || 'angemeldet'))
      $('konto-name').textContent = email ? 'Angemeldet als ' + email : 'Angemeldet'
    }
    schliesseKonto()
    zeichneNavigation()
    zeichneBegruessung()
    zeichneKacheln()
    void zeichneKlassen()
    zeichneListen()
    suche()
  }

  const anmeldeDialog = $('anmelde-dialog')
  const anmeldeFehler = $('anmelde-fehler')
  function fehlerText(e) {
    const m = String((e && e.message) || e)
    if (/invalid login|invalid_credentials/i.test(m)) return 'E-Mail-Adresse oder Passwort ist falsch.'
    if (/rate limit|too many/i.test(m)) return 'Zu viele Versuche. Bitte warte einen Moment.'
    if (/failed to fetch|network/i.test(m)) return 'Keine Verbindung zum Server.'
    return 'Die Anmeldung hat nicht geklappt: ' + m
  }
  $('anmelde-knopf').addEventListener('click', () => {
    anmeldeFehler.hidden = true
    anmeldeDialog.showModal()
    $('anmelde-email').focus()
  })
  $('anmelde-abbrechen').addEventListener('click', () => anmeldeDialog.close())
  $('anmelde-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = $('anmelde-email').value.trim()
    const passwort = $('anmelde-passwort').value
    const zeige = (text) => {
      anmeldeFehler.textContent = text
      anmeldeFehler.hidden = !text
    }
    if (!email || !passwort) return zeige('Bitte E-Mail-Adresse und Passwort eingeben.')
    const knopf = $('anmelde-senden')
    knopf.disabled = true
    zeige('')
    try {
      const sitzung = await DB.anmelden(email, passwort)
      // Die Anmeldung auch dort ablegen, wo Quizzo, Klassenfunk und die Tafel sie suchen – dann gilt sie überall
      try {
        localStorage.setItem(GEMEINSAM, JSON.stringify(sitzung))
      } catch {
        /* dann gilt sie nur hier */
      }
      $('anmelde-passwort').value = ''
      anmeldeDialog.close()
      setzeRolle(sitzung)
    } catch (err) {
      zeige(fehlerText(err))
    } finally {
      knopf.disabled = false
    }
  })
  $('abmelde-knopf').addEventListener('click', () => {
    if (DB) DB.abmelden()
    try {
      localStorage.removeItem(GEMEINSAM) // meldet auch bei Quizzo, Klassenfunk und der Tafel ab
    } catch {
      /* egal */
    }
    setzeRolle(null)
  })

  // ---------- Start: erst die schlanke Fassung, dann nachsehen, ob jemand angemeldet ist ----------
  setzeRolle(null)
  if (DB) DB.sitzung().then(setzeRolle, () => setzeRolle(null))
})()
