/* Lernangebote: Baum Fach › Jahrgang › Thema, Suche, Sortierung. Die Auswahl steht in der Adresse
   (z. B. ?fach=bio&stufe=7), damit man sie per QR-Code am Beamer teilen kann.
   Die Ordnung (Fach, Jahrgänge, Thema, Reihenfolge, Sichtbarkeit, Titel, Erklärung) kommt aus der Datenbank,
   sobald dort etwas gespeichert ist – sonst aus angebote.js. Ändern kann sie nur die angemeldete Lehrkraft
   (lernen/#bearbeiten). Besucher sehen davon nichts. */
;(function () {
  'use strict'

  const FAECHER = window.FAECHER || []
  const STUFEN = window.STUFEN || []
  const THEMEN = window.THEMEN || []
  const FELDER = ['titel', 'text', 'fach', 'stufen', 'thema', 'position', 'sichtbar', 'datum']
  const normal = (a) => ({ ...a, stufen: a.stufen || [], thema: a.thema || null, text: a.text || '', position: a.position || 0, sichtbar: a.sichtbar !== false })
  const STATISCH = (window.ANGEBOTE || []).map(normal)
  let ANGEBOTE = STATISCH.map((a) => ({ ...a }))
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
  const zustand = { fach: p.get('fach'), stufe: p.get('stufe'), thema: p.get('thema') }
  const SORTIERUNGEN = ['jahrgang', 'name', 'datum']
  let sortierung = 'jahrgang'
  try {
    const g = localStorage.getItem('lernen-sortierung')
    if (SORTIERUNGEN.includes(g)) sortierung = g
  } catch {
    /* egal */
  }
  $('sortierung').value = sortierung

  // ---------- Lehrkraft ----------
  let sitzung = null // Anmeldung der Lehrkraft
  let bearbeiten = false // Bearbeiten-Modus an?
  const aenderungen = new Map() // ordner → geänderter Eintrag (noch nicht gespeichert)
  const sichtbarFuerAlle = (a) => bearbeiten || a.sichtbar

  // ---------- Filter ----------
  const imFach = (a, f) => !f || a.fach === f
  const inStufe = (a, s) => !s || (s === ALLE_JG ? !a.stufen.length : a.stufen.includes(s) || !a.stufen.length)
  const imThema = (a, t) => !t || (t === OHNE_THEMA ? !a.thema : a.thema === t)
  const passt = (a, z) => imFach(a, z.fach) && inStufe(a, z.stufe) && imThema(a, z.thema)
  const angezeigt = () => ANGEBOTE.filter(sichtbarFuerAlle)

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
    const alle = angezeigt()
    const ul = el('ul', 'ebene-1')
    ul.append(ast('Alle', alle.length, !zustand.fach, () => waehle({}), '📚'))
    FAECHER.forEach((f) => {
      const imF = alle.filter((a) => a.fach === f.id)
      if (!imF.length) return
      const li = ast(f.name, imF.length, zustand.fach === f.id && !zustand.stufe, () => waehle({ fach: f.id }), f.symbol)
      if (zustand.fach === f.id) {
        const stufen = el('ul', 'ebene-2')
        STUFEN.forEach((s) => {
          if (!imF.some((a) => a.stufen.includes(s.id))) return
          const n = imF.filter((a) => inStufe(a, s.id)).length // inkl. „für alle Jahrgänge“
          const sLi = ast(s.name, n, zustand.stufe === s.id && !zustand.thema, () => waehle({ fach: f.id, stufe: s.id }))
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
        const ohneJg = imF.filter((a) => !a.stufen.length).length
        if (ohneJg) stufen.append(ast('Für alle Jahrgänge', ohneJg, zustand.stufe === ALLE_JG, () => waehle({ fach: f.id, stufe: ALLE_JG })))
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

  // ---------- Liste ----------
  // Position im Jahrgang (für die Sortierung); „für alle Jahrgänge“ ans Ende
  const stufenRang = (a) => (a.stufen.length ? Math.min(...a.stufen.map((s) => STUFEN.findIndex((x) => x.id === s))) : STUFEN.length)
  const nachName = (a, b) => vergleich.compare(a.titel, b.titel)
  const nachPosition = (a, b) => a.position - b.position || nachName(a, b)

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

  let aktuelleGruppen = [] // für ↑/↓: die angezeigten Einträge je Gruppe in Reihenfolge

  function karten() {
    const suche = $('suche').value.trim().toLocaleLowerCase('de')
    const liste = angezeigt().filter((a) => passt(a, zustand) && suchtreffer(a, suche))
    const ul = $('karten')
    ul.textContent = ''
    aktuelleGruppen = []
    if (!liste.length) {
      ul.append(el('li', 'leer', suche ? 'Nichts gefunden.' : 'Hier gibt es noch keine Lernangebote.'))
      return
    }
    if (sortierung === 'datum') liste.sort((a, b) => (b.datum || '').localeCompare(a.datum || '') || nachName(a, b))
    else if (sortierung === 'name') liste.sort(nachName)
    // Nach Jahrgang: erst Jahrgang, dann eigene Reihenfolge – ist ein Jahrgang gewählt, nur die eigene Reihenfolge
    else liste.sort((a, b) => (zustand.stufe ? 0 : stufenRang(a) - stufenRang(b)) || nachPosition(a, b))

    // Nach Jahrgang: Zwischenüberschriften (außer ein Jahrgang ist schon gewählt)
    const gruppieren = sortierung === 'jahrgang' && !zustand.stufe
    let letzte = null
    let gruppe = []
    liste.forEach((a) => {
      const rang = stufenRang(a)
      if (gruppieren && rang !== letzte) {
        letzte = rang
        ul.append(el('li', 'gruppe', rang < STUFEN.length ? STUFEN[rang].name : 'Für alle Jahrgänge'))
        gruppe = []
        aktuelleGruppen.push(gruppe)
      } else if (!aktuelleGruppen.length) aktuelleGruppen.push(gruppe)
      gruppe.push(a)
      ul.append(bearbeiten ? editierZeile(a, gruppe.length - 1, gruppe) : zeile(a))
    })
  }

  // ---------- Bearbeiten (nur angemeldete Lehrkraft) ----------
  function aendern(a, feld, wert) {
    a[feld] = wert
    aenderungen.set(a.ordner, a)
    leiste()
  }

  function verschieben(gruppe, i, richtung) {
    const j = i + richtung
    if (j < 0 || j >= gruppe.length) return
    // Reihenfolge der Gruppe festschreiben und die beiden tauschen
    const neu = [...gruppe]
    ;[neu[i], neu[j]] = [neu[j], neu[i]]
    neu.forEach((a, k) => {
      if (a.position !== (k + 1) * 10) aendern(a, 'position', (k + 1) * 10)
    })
    karten()
  }

  function editierZeile(a, i, gruppe) {
    const li = el('li', 'karte bearbeiten' + (a.sichtbar ? '' : ' versteckt') + (aenderungen.has(a.ordner) ? ' geaendert' : ''))
    const box = el('div', 'editor')

    const pfeile = el('div', 'pfeile')
    const hoch = el('button', 'knopf zweit', '↑')
    hoch.type = 'button'
    hoch.disabled = sortierung !== 'jahrgang' || i === 0
    hoch.setAttribute('aria-label', a.titel + ' nach oben')
    hoch.addEventListener('click', () => verschieben(gruppe, i, -1))
    const runter = el('button', 'knopf zweit', '↓')
    runter.type = 'button'
    runter.disabled = sortierung !== 'jahrgang' || i === gruppe.length - 1
    runter.setAttribute('aria-label', a.titel + ' nach unten')
    runter.addEventListener('click', () => verschieben(gruppe, i, 1))
    pfeile.append(hoch, runter)

    const felder = el('div', 'felder')
    const titel = el('input')
    titel.value = a.titel
    titel.maxLength = 200
    titel.setAttribute('aria-label', 'Titel')
    titel.addEventListener('input', () => aendern(a, 'titel', titel.value))
    const text = el('textarea')
    text.value = a.text
    text.maxLength = 600
    text.rows = 2
    text.setAttribute('aria-label', 'Erklärung zu ' + a.titel)
    text.addEventListener('input', () => aendern(a, 'text', text.value))

    const reihe = el('div', 'reihe')
    const fach = el('select')
    fach.setAttribute('aria-label', 'Fach von ' + a.titel)
    FAECHER.forEach((f) => fach.append(new Option(f.name, f.id, false, f.id === a.fach)))
    fach.addEventListener('change', () => (aendern(a, 'fach', fach.value), zeichne()))
    const thema = el('select')
    thema.setAttribute('aria-label', 'Thema von ' + a.titel)
    thema.append(new Option('ohne Thema', '', false, !a.thema))
    THEMEN.forEach((t) => thema.append(new Option(t.name, t.id, false, t.id === a.thema)))
    thema.addEventListener('change', () => (aendern(a, 'thema', thema.value || null), zeichne()))
    const sichtbar = el('label', 'schalter')
    const haken = el('input')
    haken.type = 'checkbox'
    haken.checked = a.sichtbar
    haken.addEventListener('change', () => (aendern(a, 'sichtbar', haken.checked), karten()))
    sichtbar.append(haken, document.createTextNode(' für Schüler sichtbar'))
    const oeffnen = el('a', 'oeffnen-klein', 'ansehen ›')
    oeffnen.href = a.ordner + '/'
    oeffnen.target = '_blank'
    reihe.append(fach, thema, sichtbar, oeffnen)

    const stufen = el('div', 'stufen-wahl')
    stufen.setAttribute('role', 'group')
    stufen.setAttribute('aria-label', 'Jahrgänge von ' + a.titel)
    STUFEN.forEach((s) => {
      const l = el('label')
      const c = el('input')
      c.type = 'checkbox'
      c.checked = a.stufen.includes(s.id)
      c.addEventListener('change', () => {
        const neu = STUFEN.map((x) => x.id).filter((id) => (id === s.id ? c.checked : a.stufen.includes(id)))
        aendern(a, 'stufen', neu)
        zeichne()
      })
      l.append(c, document.createTextNode(' ' + s.name.replace('Klasse ', '')))
      stufen.append(l)
    })
    const hinweis = el('span', 'stufen-hinweis', 'keiner = für alle Jahrgänge')

    felder.append(titel, text, reihe, stufen, hinweis)
    box.append(pfeile, felder)
    li.append(box)
    return li
  }

  // Leiste unten: ungespeicherte Änderungen
  function leiste() {
    const bar = $('speicherleiste')
    bar.hidden = !aenderungen.size
    $('aenderungen-zahl').textContent = aenderungen.size === 1 ? '1 Änderung' : aenderungen.size + ' Änderungen'
  }

  async function speichern() {
    const knopf = $('speichern')
    knopf.disabled = true
    $('speicher-meldung').textContent = 'Wird gespeichert …'
    try {
      sitzung = await window.LernDB.sitzung()
      if (!sitzung) throw new Error('Die Anmeldung ist abgelaufen. Bitte neu anmelden.')
      const zeilen = [...aenderungen.values()].map((a) => {
        const z = { ordner: a.ordner }
        FELDER.forEach((f) => (z[f] = a[f] ?? null))
        z.titel = (z.titel || '').trim() || a.ordner
        z.text = (z.text || '').trim()
        z.stufen = z.stufen || []
        return z
      })
      await window.LernDB.speichern(zeilen, sitzung.access_token)
      aenderungen.clear()
      leiste()
      $('speicher-meldung').textContent = ''
      meldung('Gespeichert. Die Schülerinnen und Schüler sehen die neue Ordnung sofort.')
    } catch (e) {
      $('speicher-meldung').textContent = fehlerText(e)
    } finally {
      knopf.disabled = false
    }
  }

  function fehlerText(e) {
    const m = String((e && e.message) || e)
    if (/relation|does not exist|schema cache/i.test(m)) return 'Die Datenbank kennt die Lernangebote noch nicht – bitte zuerst SQL 009 ausführen.'
    if (/row-level security|permission/i.test(m)) return 'Keine Berechtigung, diesen Eintrag zu ändern.'
    if (/invalid login|invalid_credentials/i.test(m)) return 'E-Mail-Adresse oder Passwort ist falsch.'
    if (/failed to fetch|network/i.test(m)) return 'Keine Verbindung zum Server.'
    return m
  }

  function meldung(text) {
    const m = $('lehrkraft-meldung')
    m.textContent = text
    m.hidden = !text
  }

  async function lehrkraftBereich() {
    const box = $('lehrkraft')
    box.textContent = ''
    if (sitzung) {
      box.hidden = false
      const umschalter = el('button', 'knopf' + (bearbeiten ? '' : ' zweit'), bearbeiten ? '✓ Bearbeiten beenden' : '✎ Ordnung bearbeiten')
      umschalter.type = 'button'
      umschalter.addEventListener('click', () => {
        if (bearbeiten && aenderungen.size && !confirm('Es gibt ungespeicherte Änderungen. Trotzdem beenden? Sie gehen verloren.')) return
        if (bearbeiten && aenderungen.size) verwerfen()
        bearbeiten = !bearbeiten
        lehrkraftBereich()
        zeichne()
      })
      const ab = el('button', 'knopf zweit', 'Abmelden')
      ab.type = 'button'
      ab.addEventListener('click', () => {
        window.LernDB.abmelden()
        sitzung = null
        bearbeiten = false
        verwerfen()
        if (location.hash === '#bearbeiten') history.replaceState(null, '', location.pathname + location.search)
        lehrkraftBereich()
        zeichne()
      })
      box.append(umschalter, ab)
      if (bearbeiten)
        box.append(
          el('p', 'hinweis', 'Bearbeiten-Modus: Einträge einsortieren, umbenennen, verstecken; mit ↑ ↓ die Reihenfolge innerhalb eines Jahrgangs ändern (Sortierung „Nach Jahrgang“). Danach unten „Speichern“.'),
        )
      return
    }
    // Anmeldeformular nur über lernen/#bearbeiten – normale Besucher sehen es nicht
    if (location.hash !== '#bearbeiten') return (box.hidden = true)
    box.hidden = false
    const form = el('form', 'anmelden')
    form.append(el('strong', null, 'Lehrkraft-Anmeldung (Quizzo-Konto)'))
    const email = el('input')
    email.type = 'email'
    email.placeholder = 'E-Mail'
    email.autocomplete = 'username'
    email.setAttribute('aria-label', 'E-Mail')
    const pw = el('input')
    pw.type = 'password'
    pw.placeholder = 'Passwort'
    pw.autocomplete = 'current-password'
    pw.setAttribute('aria-label', 'Passwort')
    const los = el('button', 'knopf', 'Anmelden')
    const fehler = el('span', 'fehler')
    form.append(email, pw, los, fehler)
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      los.disabled = true
      fehler.textContent = ''
      try {
        sitzung = await window.LernDB.anmelden(email.value.trim(), pw.value)
        await neuLaden()
        bearbeiten = true
        lehrkraftBereich()
        zeichne()
      } catch (err) {
        fehler.textContent = fehlerText(err)
      } finally {
        los.disabled = false
      }
    })
    box.append(form)
  }

  function verwerfen() {
    aenderungen.clear()
    leiste()
    neuLaden()
  }

  // ---------- Daten aus der Datenbank übernehmen ----------
  async function neuLaden() {
    if (!window.LernDB) return
    try {
      const zeilen = await window.LernDB.laden(sitzung && sitzung.access_token)
      const db = new Map((zeilen || []).map((z) => [z.ordner, z]))
      // Nur Angebote, deren Dateien es wirklich gibt (angebote.js); Datenbank überschreibt die Einordnung
      ANGEBOTE = STATISCH.map((a) => {
        const z = db.get(a.ordner)
        if (!z) return { ...a }
        const neu = { ...a }
        FELDER.forEach((f) => z[f] !== undefined && z[f] !== null && (neu[f] = z[f]))
        neu.thema = z.thema || null
        return normal(neu)
      })
      // Versteckte Einträge (sichtbar = false) blendet sichtbarFuerAlle() für Besucher aus.
    } catch {
      ANGEBOTE = STATISCH.map((a) => ({ ...a })) // ohne Datenbank: Stand aus angebote.js
    }
    zeichne()
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
    const q = new URLSearchParams()
    for (const k of ['fach', 'stufe', 'thema']) if (zustand[k]) q.set(k, zustand[k])
    const neu = location.pathname + (q.toString() ? '?' + q : '') + location.hash
    if (neu !== location.pathname + location.search + location.hash) history.replaceState(null, '', neu)
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
  $('speichern').addEventListener('click', speichern)
  $('verwerfen').addEventListener('click', () => {
    if (confirm('Alle ungespeicherten Änderungen verwerfen?')) verwerfen()
  })
  window.addEventListener('beforeunload', (e) => {
    if (aenderungen.size) e.preventDefault()
  })
  window.addEventListener('hashchange', lehrkraftBereich)

  zeichne() // sofort mit dem Stand aus angebote.js
  ;(async () => {
    if (window.LernDB) sitzung = await window.LernDB.sitzung().catch(() => null)
    await lehrkraftBereich()
    await neuLaden()
  })()
})()
