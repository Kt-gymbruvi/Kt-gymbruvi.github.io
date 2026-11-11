/* Startseite „Lehrraum“: baut Navigation, Kacheln, Werkzeuge und Materialliste aus js/inhalte.js.
   Keine Daten verlassen das Gerät. */
;(function () {
  'use strict'

  const SEITE = window.SEITE || {}
  const NAVIGATION = window.NAVIGATION || []
  const MITMACHEN = window.MITMACHEN || {}
  const LINKS = window.LINKS || []
  const MATERIALIEN = window.MATERIALIEN || []

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
  const dialog = document.getElementById('qr-dialog')
  function zeigeQr(titel, adresse) {
    document.getElementById('qr-titel').textContent = titel
    document.getElementById('qr-adresse').textContent = adresse.replace(/^https?:\/\//, '')
    const bild = document.getElementById('qr-bild')
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
  document.getElementById('qr-schliessen').addEventListener('click', () => dialog.close())
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
    document.getElementById('titel').textContent = SEITE.titel
    document.title = SEITE.titel
  }
  const untertitel = document.getElementById('untertitel')
  untertitel.textContent = SEITE.untertitel || ''
  untertitel.hidden = !SEITE.untertitel

  // ---------- Hauptnavigation ----------
  const navListe = document.getElementById('navigation')
  NAVIGATION.forEach((n) => {
    if (!n.adresse && !SEITE.geplantesZeigen) return
    const li = el('li', n.adresse ? null : 'nav-geplant')
    // Bereiche ohne Adresse gibt es noch nicht: kein Link, sondern Text mit dem Hinweis „folgt“
    const punkt = el(n.adresse ? 'a' : 'span', 'nav-punkt' + (n.adresse ? '' : ' geplant'))
    if (n.adresse) punkt.href = n.adresse
    punkt.append(zeichen(n.symbol, 'nav-symbol'), el('span', null, n.titel))
    if (!n.adresse) punkt.append(el('small', null, 'folgt'))
    li.append(punkt)
    navListe.append(li)
  })

  // ---------- Heller und dunkler Modus ----------
  const designKnopf = document.getElementById('design-knopf')
  function zeichneDesignKnopf() {
    const dunkel = window.LehrraumDesign && window.LehrraumDesign.aktuell() === 'dunkel'
    designKnopf.textContent = ''
    designKnopf.append(zeichen(dunkel ? 'sonne' : 'mond'))
    designKnopf.setAttribute('aria-label', dunkel ? 'Zum hellen Modus wechseln' : 'Zum dunklen Modus wechseln')
    designKnopf.title = dunkel ? 'Heller Modus' : 'Dunkler Modus'
  }
  if (window.LehrraumDesign) {
    designKnopf.addEventListener('click', () => window.LehrraumDesign.umschalten())
    document.addEventListener('lehrraum-design', zeichneDesignKnopf)
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', zeichneDesignKnopf)
    zeichneDesignKnopf()
  } else {
    designKnopf.hidden = true
  }

  // ---------- Mitmachen mit PIN ----------
  const pinFeld = document.getElementById('pin')
  const pinFehler = document.getElementById('pin-fehler')
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
  document.getElementById('pin-form').addEventListener('submit', (e) => {
    e.preventDefault() // Eingabetaste: Quiz und Abstimmung haben getrennte PINs, also erst wählen lassen
    pinMeldung(/^\d{6}$/.test(pinFeld.value) ? 'Bitte wählen: Quiz oder Abstimmung.' : 'Die PIN hat sechs Ziffern. Sie steht am Beamer.')
  })
  if (!MITMACHEN.quiz && !MITMACHEN.abstimmung) document.getElementById('mitmachen').hidden = true

  // ---------- Kacheln ----------
  const linkListe = document.getElementById('links')
  LINKS.forEach((l) => {
    const li = el('li')
    const a = el('a', 'kachel' + (l.farbe ? ' farbe-' + l.farbe : ''))
    a.href = l.adresse
    a.append(zeichen(l.symbol || 'verweis', 'kachel-symbol'))
    a.append(el('span', 'kachel-titel', l.titel))
    if (l.text) a.append(el('span', 'kachel-text', l.text))
    li.append(a)
    // QR-Knopf liegt neben dem Link über der Kachel (Knöpfe in Links wären ungültig)
    if (l.qr !== false) {
      a.classList.add('mit-qr')
      li.append(qrKnopf(l.titel, volleAdresse(l.adresse)))
    }
    linkListe.append(li)
  })

  // ---------- Werkzeuge (nach Bereich gruppiert) ----------
  const WERKZEUGE = window.WERKZEUGE || []
  const werkzeugListe = document.getElementById('werkzeuge')
  if (!WERKZEUGE.length) document.getElementById('werkzeuge-bereich').hidden = true
  const bereiche = [...new Set(WERKZEUGE.map((w) => w.bereich || 'Allgemein'))]
  bereiche.forEach((b) => {
    const gruppe = el('li', 'werkzeug-gruppe')
    if (bereiche.length > 1) gruppe.append(el('h3', null, b))
    const ul = el('ul', 'werkzeug-karten')
    WERKZEUGE.filter((w) => (w.bereich || 'Allgemein') === b).forEach((w) => {
      const li = el('li')
      const a = el('a', 'werkzeug mit-qr')
      a.href = w.adresse
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
  const ziel = document.getElementById('materialien')
  const faecherLeiste = document.getElementById('faecher')
  const suchFeld = document.getElementById('suche')
  const faecher = [...new Set(MATERIALIEN.map((m) => m.fach || 'Allgemein'))].sort((a, b) => a.localeCompare(b, 'de'))
  let gewaehltesFach = null

  function fachKnopf(name, wert) {
    const k = el('button', 'fach-knopf', name)
    k.type = 'button'
    k.setAttribute('aria-pressed', String(gewaehltesFach === wert))
    k.addEventListener('click', () => {
      gewaehltesFach = wert
      zeichne()
    })
    return k
  }

  const klein = (s) => (s || '').toLocaleLowerCase('de')

  function zeichne() {
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
      document.getElementById('material-bereich').hidden = true
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
        const adresse = volleAdresse(m.datei)
        const li = el('li', 'eintrag')
        li.append(el('span', 'typ', typ(m.datei)))
        const a = el('a', 'eintrag-link')
        a.href = m.datei
        if (/^https?:/i.test(m.datei)) a.rel = 'noopener'
        a.append(el('span', 'eintrag-titel', m.titel))
        const info = [m.klasse && 'Klasse ' + m.klasse, m.text].filter(Boolean).join(' · ')
        if (info) a.append(el('span', 'eintrag-info', info))
        li.append(a, qrKnopf(m.titel, adresse))
        ul.append(li)
      })
      gruppe.append(ul)
      ziel.append(gruppe)
    })
  }

  suchFeld.addEventListener('input', zeichne)
  zeichne()
})()
