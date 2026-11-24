/*
 * Spielraum: Lobby, Angebote und Partien auf dem Echtzeit-Kanal (spielen/echtzeit.js).
 * Gespeichert wird nichts auf einem Server; im Browser (sessionStorage) nur die eigene Kennung und der Spitzname.
 *
 * Anwesenheit (je Person):
 *   { id, name, rolle: 'leitung' | 'spieler', spiele?: [..erlaubte Spiele..] (Leitung),
 *     angebot?: { partie, spiel, code?, belegt? }, spielt?: { partie, spiel, gegner } }
 *   Chaos-Flitzer: angebot.code = Raumcode des Spiels (Kanal chaosflitzer-<code>), angebot.belegt = Zahl der Handys
 *   Gruppenspiele: angebot.gruppe = true, angebot.mit = [{ id, name }] (eingestiegen), angebot.ki = Zahl der Computerspieler
 *
 * Nachrichten:
 *   beitritt  { partie, von, name }                       jemand will bei einem Angebot mitspielen
 *   start     { partie, spiel, spieler: [{id,name}, {id,name}] }   Spieler 1 beginnt (Seite 1)
 *   zug       { partie, von, n, zug }                      n = Nummer des Zuges (ab 1)
 *   sync      { partie, von }                              „schick mir alle Züge“
 *   zugliste  { partie, zuege }
 *   aufgabe   { partie, von }
 *   Gruppenspiele: beitritt wie oben, austritt { partie, von }, start { partie, spiel, spieler: [{ id, name } | { ki: true, name }], host }
 *                  Danach öffnen alle spielen/<spiel>/?raum=&partie=&host= (Ablauf dort: spielen/gruppe.js)
 */
;(function () {
  'use strict'

  const ZEICHEN = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // ohne verwechselbare Zeichen (I, O, 0, 1)
  const SPIELE = {
    'vier-gewinnt': 'Vier gewinnt',
    muehle: 'Mühle',
    schach: 'Schach',
    // Gruppenspiel: Der Anbieter führt es auf seinem Gerät (Beamer/Laptop), die anderen spielen mit dem Handy (vertretung/chaos-flitzer/)
    'chaos-flitzer': 'Chaos-Flitzer 3000',
    // Gruppenspiel wie Chaos-Flitzer: läuft auf dem Gerät des Anbieters, die anderen spielen mit dem Handy (vertretung/flip-7/handy/)
    'flip-7': 'Flip 7',
    // Zu zweit mit verdeckter Flotte: jedes Gerät kennt nur die eigene Flotte und beantwortet die Schüsse des Gegners (vertretung/schiffe-versenken/)
    'schiffe-versenken': 'Schiffe versenken',
    // Gruppenspiele (spielen/gruppe.js): Der Anbieter sammelt Mitspieler und startet; sein Gerät führt das Spiel
    'wuerfelglueck': 'Würfelglück',
    'farbenjagd': 'Farbenjagd',
    'ecke-an-ecke': 'Ecke an Ecke',
    'grenzland': 'Grenzland',
    'inselhandel': 'Inselhandel',
    'schienennetz': 'Schienennetz',
    'kachelland': 'Kachelland',
  }
  // Gruppenspiele: [mindestens, höchstens] Personen (Computerspieler zählen mit)
  const GRUPPE = {
    'wuerfelglueck': [2, 6],
    'farbenjagd': [2, 6],
    'ecke-an-ecke': [2, 4],
    'grenzland': [2, 6],
    'inselhandel': [2, 4],
    'schienennetz': [2, 5],
    'kachelland': [2, 5],
  }

  function zufallText(n) {
    const z = new Uint32Array(n)
    crypto.getRandomValues(z)
    return Array.from(z, (x) => ZEICHEN[x % ZEICHEN.length]).join('')
  }
  const neuerCode = () => zufallText(6)
  const istCode = (c) => typeof c === 'string' && /^[A-HJ-NP-Z2-9]{6}$/.test(c)

  function speicher(schluessel, wert) {
    try {
      if (wert === undefined) return sessionStorage.getItem(schluessel)
      if (wert === null) sessionStorage.removeItem(schluessel)
      else sessionStorage.setItem(schluessel, wert)
    } catch {
      /* ohne Speicher: gilt nur bis zum Neuladen */
    }
    return null
  }

  const meineId = () => {
    let id = speicher('spielraum-id')
    if (!id) {
      id = zufallText(10)
      speicher('spielraum-id', id)
    }
    return id
  }
  const meinName = () => speicher('spielraum-name') || ''
  const setzeName = (n) => speicher('spielraum-name', bereinige(n))
  /** Spitznamen: höchstens 20 Zeichen, keine Steuerzeichen. */
  const bereinige = (n) => String(n || '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 20)

  /**
   * Raum betreten.
   *   o.name     Spitzname
   *   o.leitung  true: legt fest, welche Spiele erlaubt sind (o.spiele)
   * Rückgabe: Raum-Objekt (siehe unten).
   */
  function betreten(code, o) {
    const id = meineId()
    const ich = { id, name: bereinige(o.name) || 'Gast', rolle: o.leitung ? 'leitung' : 'spieler' }
    if (o.leitung) ich.spiele = o.spiele || Object.keys(SPIELE)
    const hoerer = {} // Ereignis → [fn]
    let liste = []
    let status = 'verbindet'

    const ruf = (ereignis, daten) => (hoerer[ereignis] || []).slice().forEach((f) => f(daten))

    const kanal = window.Echtzeit.oeffnen('spielraum-' + code, {
      schluessel: id,
      beiNachricht: (ereignis, daten) => {
        if (daten && typeof daten === 'object') ruf(ereignis, daten)
      },
      beiAnwesenheit: (l) => {
        liste = l.filter((x) => x && typeof x.id === 'string')
        ruf('anwesenheit', liste)
      },
      beiStatus: (s) => {
        status = s
        ruf('status', s)
      },
    })
    kanal.verfolge(ich)

    const raum = {
      code,
      id,
      ich,
      anwesend: () => liste,
      status: () => status,
      /** Erlaubte Spiele: von der Leitung gesetzt, sonst alle. */
      erlaubt() {
        const l = liste.find((x) => x.rolle === 'leitung' && Array.isArray(x.spiele))
        return (l ? l.spiele : Object.keys(SPIELE)).filter((s) => SPIELE[s])
      },
      auf(ereignis, fn) {
        ;(hoerer[ereignis] = hoerer[ereignis] || []).push(fn)
        return () => (hoerer[ereignis] = hoerer[ereignis].filter((f) => f !== fn))
      },
      sende: (ereignis, daten) => kanal.sende(ereignis, daten),
      /** Eigene Angaben ändern (nur die genannten Felder; null entfernt ein Feld). */
      setze(teil) {
        Object.keys(teil).forEach((k) => {
          if (teil[k] === null) delete ich[k]
          else ich[k] = teil[k]
        })
        kanal.verfolge(ich)
        ruf('anwesenheit', liste)
      },
      verlassen: () => kanal.schliessen(),
    }
    return raum
  }

  /**
   * Eine Partie über den Raum. Beide Spieler benutzen dasselbe: Züge werden mit laufender Nummer gesendet,
   * fehlende oder verlorene Züge holt „sync“ nach (z. B. nach Neuladen).
   *   o.partie, o.spiel, o.gegner (Name)
   *   o.beiZug(zug)       ein Zug des Gegners (oder beim Nachholen: auch eigene Züge) muss angewendet werden
   *   o.beiAufgabe()      der Gegner gibt auf
   */
  function partie(raum, o) {
    const zuege = []
    const abmelden = []
    raum.setze({ spielt: { partie: o.partie, spiel: o.spiel, gegner: o.gegner } })
    const meine = (d) => d.partie === o.partie

    function anwenden(n, zug) {
      if (n !== zuege.length + 1) return false
      zuege.push(zug)
      o.beiZug(zug, n)
      return true
    }

    abmelden.push(
      raum.auf('zug', (d) => {
        if (!meine(d) || d.von === raum.id || typeof d.n !== 'number') return
        if (d.n > zuege.length + 1) return raum.sende('sync', { partie: o.partie, von: raum.id }) // Lücke
        if (d.n === zuege.length + 1) anwenden(d.n, d.zug)
      }),
      raum.auf('sync', (d) => {
        if (meine(d) && d.von !== raum.id && zuege.length) raum.sende('zugliste', { partie: o.partie, zuege: zuege.slice() })
      }),
      raum.auf('zugliste', (d) => {
        if (!meine(d) || !Array.isArray(d.zuege)) return
        for (let i = zuege.length; i < d.zuege.length; i++) anwenden(i + 1, d.zuege[i])
      }),
      raum.auf('aufgabe', (d) => {
        if (meine(d) && d.von !== raum.id && o.beiAufgabe) o.beiAufgabe()
      })
    )
    // nach dem Neuladen: Stand beim Gegner erfragen
    raum.sende('sync', { partie: o.partie, von: raum.id })

    return {
      zuege: () => zuege.slice(),
      sendeZug(zug) {
        zuege.push(zug)
        raum.sende('zug', { partie: o.partie, von: raum.id, n: zuege.length, zug })
      },
      gibAuf: () => raum.sende('aufgabe', { partie: o.partie, von: raum.id }),
      beenden() {
        abmelden.forEach((f) => f())
        raum.setze({ spielt: null })
      },
    }
  }

  window.Spielraum = { SPIELE, GRUPPE, neuerCode, istCode, meineId, meinName, setzeName, bereinige, betreten, partie, zufallText }
})()
