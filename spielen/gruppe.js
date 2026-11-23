/*
 * Gruppenspiele für 2 bis 6 Personen: an einem Gerät (weitergeben, dazu Computerspieler) oder online über den Spielraum.
 *
 * Jedes Spiel liefert reine Regeln (Browser: window.<Name>, Node: module.exports):
 *   R.id, R.name, R.min, R.max, R.standard (Zahl der Personen am Anfang)
 *   R.optionen   [{ id, text, werte: [[wert, 'Text'], …], start }]   (freiwillig)
 *   R.neu(spieler, optionen, saat) → Zustand z mit z.spieler (= spieler), z.dran (Sitz 0…n-1), z.ende (null | { sieger: [Sitze], text }), z.log
 *   R.anwenden(z, sitz, aktion)    → neuer Zustand oder null, wenn die Aktion nicht erlaubt ist (z bleibt unverändert)
 *   R.ki(z, sitz)                  → eine erlaubte Aktion für den Computer
 *   R.punkte(z, sitz)              → Anzeige in der Spielerliste (freiwillig)
 *
 * Die Seite ruft auf:
 *   Gruppenspiel({ regeln: R, flaeche, seite, zeichne(z, ansicht), verdeckt, kiPause })
 *     flaeche   Element für das Spielbrett, seite  Element für Spieler, Knöpfe und Protokoll
 *     verdeckt  true: Spieler haben geheime Karten – an einem Gerät erscheint vor jedem Zug „Gib das Gerät an …“
 *     zeichne   bekommt ansicht = { brett, aktionen, ich, darf, sende(aktion), neu(), farbe(sitz), name(sitz), online }
 *               brett: leeres Element im Spielbereich; aktionen: leeres Element in der Seitenleiste
 *               ich:   Sitz, aus dessen Sicht gezeichnet wird (seine Karten sind zu sehen), null = niemand
 *               darf:  ich ist am Zug und darf jetzt handeln; neu(): mit eigenem Auswahlzustand neu zeichnen
 *
 * Online (Adresse ?raum=CODE&partie=ID&host=KENNUNG aus der Lobby): Das Gerät des Anbieters („Spielleitung“) führt den Zustand,
 * prüft jede Aktion mit den Regeln und schickt den neuen Stand an alle. Nachrichten im Raumkanal (nur für diese Partie):
 *   stand  { partie, v, z }        Spielleitung → alle (v = laufende Nummer)
 *   aktion { partie, von, v, a }   Spieler → Spielleitung
 *   frage  { partie, von }         „schick mir den Stand“ (auch die neu geladene Spielleitung fragt so bei den Spielern nach)
 * Wer am Zug ist und länger als 15 Sekunden nicht verbunden ist, wird für diesen Zug vom Computer vertreten.
 */
;(function () {
  'use strict'

  const FARBEN = ['Rot', 'Blau', 'Gelb', 'Grün', 'Lila', 'Orange']
  const farbe = (i) => 'var(--spieler-' + ((i % 6) + 1) + ')'

  function el(tag, klasse, text) {
    const e = document.createElement(tag)
    if (klasse) e.className = klasse
    if (text != null) e.textContent = text
    return e
  }
  function knopf(text, klasse, bei) {
    const b = el('button', 'knopf' + (klasse ? ' ' + klasse : ''), text)
    b.type = 'button'
    if (bei) b.addEventListener('click', bei)
    return b
  }
  function speicher(k, wert) {
    try {
      if (wert === undefined) return sessionStorage.getItem(k)
      sessionStorage.setItem(k, wert)
    } catch {
      /* ohne Speicher */
    }
    return null
  }

  function segmente(titel, werte, start, bei) {
    const gruppe = el('div', 'gruppe')
    if (titel) gruppe.append(el('h2', null, titel))
    const reihe = el('div', 'segmente voll')
    reihe.setAttribute('role', 'group')
    if (titel) reihe.setAttribute('aria-label', titel)
    const knoepfe = werte.map(([wert, text]) => {
      const b = el('button', null, text)
      b.type = 'button'
      b.setAttribute('aria-pressed', String(wert === start))
      b.addEventListener('click', () => {
        knoepfe.forEach((k) => k.setAttribute('aria-pressed', String(k === b)))
        bei(wert)
      })
      return b
    })
    reihe.append(...knoepfe)
    gruppe.append(reihe)
    return gruppe
  }

  function Gruppenspiel(o) {
    const R = o.regeln
    const H = window.GruppenHilfe
    const flaeche = o.flaeche
    const seite = o.seite
    const kiPause = o.kiPause || 700
    let z = null
    let v = 0 // Nummer des Stands (online)
    let kiTakt = 0
    let aufgedeckt = -1 // an einem Gerät mit verdeckten Karten: wessen Karten gerade offen liegen
    let einstellung = null

    // ---------- Online ----------
    const online = (function () {
      const p = new URLSearchParams(location.search)
      const code = (p.get('raum') || '').toUpperCase()
      const partie = p.get('partie') || ''
      const host = p.get('host') || ''
      if (!window.Spielraum || !window.Spielraum.istCode(code) || !/^[A-Z0-9]{4,16}$/i.test(partie) || !/^[A-Z0-9]{4,16}$/i.test(host)) return null
      const raum = window.Spielraum.betreten(code, { name: window.Spielraum.meinName() })
      return { raum, code, partie, host, binHost: host === raum.id, lobby: '../lobby/?raum=' + code, da: new Set(), weg: {}, status: 'verbindet' }
    })()

    const meinSitz = () => (online && z ? z.spieler.findIndex((s) => s.id === online.raum.id) : -1)
    const menschen = () => z.spieler.map((s, i) => (s.ki ? -1 : i)).filter((i) => i >= 0)
    const istAbwesend = (i) => online && z.spieler[i] && z.spieler[i].id && !online.da.has(z.spieler[i].id)
    // Wer spielt diesen Sitz gerade mit dem Computer? (an einem Gerät: Computerspieler; online: Computerspieler und lange Abwesende)
    const kiSitz = (i) => z.spieler[i].ki || (online && online.binHost && istAbwesend(i) && Date.now() - (online.weg[z.spieler[i].id] || Date.now()) > 15000)

    function sicht() {
      if (!z) return { ich: null, darf: false }
      if (online) {
        const ich = meinSitz()
        return { ich: ich >= 0 ? ich : null, darf: ich >= 0 && !z.ende && z.dran === ich }
      }
      const m = menschen()
      const dranMensch = !z.spieler[z.dran].ki
      if (z.ende) return { ich: m.length === 1 ? m[0] : null, darf: false }
      if (m.length === 1) return { ich: m[0], darf: dranMensch }
      if (dranMensch) return { ich: z.dran, darf: true }
      return { ich: o.verdeckt ? null : null, darf: false }
    }

    function anwenden(sitz, a) {
      const n = R.anwenden(z, sitz, a)
      if (!n) return false
      setze(n, v + 1)
      return true
    }

    function setze(neu, nummer) {
      z = neu
      v = nummer
      if (online && online.binHost) {
        online.raum.sende('stand', { partie: online.partie, v, z })
        lobbyMelden()
      }
      zeichnen()
      kiPruefen()
    }

    /** Aktion des Menschen an diesem Gerät. */
    function sende(a) {
      if (!z || z.ende) return false
      const s = sicht()
      if (!s.darf) return false
      if (online && !online.binHost) {
        // Spielleitung prüft und schickt den neuen Stand; probeweise hier prüfen, damit Fehler sofort auffallen
        if (online.wartet === v || !R.anwenden(z, s.ich, a)) return false
        online.wartet = v // bis zum nächsten Stand keine zweite Aktion
        online.raum.sende('aktion', { partie: online.partie, von: online.raum.id, v, a })
        return true
      }
      return anwenden(online ? s.ich : z.dran, a)
    }

    function kiPruefen() {
      clearTimeout(kiTakt)
      if (!z || z.ende) return
      if (online && !online.binHost) return
      if (!kiSitz(z.dran)) return
      const vorher = v
      kiTakt = setTimeout(() => {
        if (v !== vorher || !z || z.ende || !kiSitz(z.dran)) return
        const a = R.ki(z, z.dran)
        if (!anwenden(z.dran, a)) {
          console.error('Computerzug nicht erlaubt', a)
        }
      }, kiPause)
    }

    // ---------- Zeichnen ----------
    const kopfKarte = el('section', 'werkzeug-karte gruppe-status')
    const statusZeile = el('p', 'status')
    statusZeile.setAttribute('role', 'status')
    statusZeile.setAttribute('aria-live', 'polite')
    const spielerListe = el('ul', 'gruppe-spieler')
    const aktionen = el('div', 'gruppe-aktionen')
    const hinweis = el('p', 'hinweis gruppe-hinweis')
    const unten = el('div', 'knopf-reihe')
    kopfKarte.append(statusZeile, spielerListe, aktionen, hinweis, unten)
    const logKarte = el('section', 'werkzeug-karte gruppe-log')
    const logListe = el('ol')
    const logTitel = el('h2', null, 'Verlauf')
    logKarte.append(logTitel, logListe)
    const brett = el('div', 'gruppe-brett')

    function statusText(s) {
      if (z.ende) return z.ende.text
      const n = z.spieler[z.dran].name
      if (s.darf) return online || menschen().length > 1 ? n + ', du bist dran.' : 'Du bist dran.'
      if (z.spieler[z.dran].ki) return n + (/^Computer/.test(n) ? '' : ' (Computer)') + ' ist dran …'
      if (online && istAbwesend(z.dran)) return n + ' ist dran, ist aber nicht verbunden …'
      return n + ' ist dran.'
    }

    function zeichnen() {
      if (!z) return
      const s = sicht()
      // Abdeckung: an einem Gerät mit mehreren Menschen und geheimen Karten
      if (!online && o.verdeckt && !z.ende && s.ich != null && menschen().length > 1 && aufgedeckt !== s.ich) {
        return abdecken(s.ich)
      }
      if (!flaeche.contains(brett)) flaeche.replaceChildren(brett)
      statusZeile.textContent = statusText(s)
      statusZeile.className = 'status' + (z.ende ? (s.ich != null && z.ende.sieger.includes(s.ich) ? ' gut' : '') : '')
      spielerZeichnen()
      aktionen.replaceChildren()
      brett.replaceChildren()
      o.zeichne(z, {
        brett,
        aktionen,
        ich: s.ich,
        darf: s.darf,
        sende,
        neu: zeichnen,
        farbe,
        farbname: (i) => FARBEN[i % 6],
        name: (i) => z.spieler[i].name,
        online: !!online,
      })
      logListe.replaceChildren(...(z.log || []).slice(-8).reverse().map((t) => el('li', null, t)))
      logKarte.hidden = !(z.log || []).length
      knoepfeUnten()
    }

    function spielerZeichnen() {
      spielerListe.replaceChildren(
        ...z.spieler.map((sp, i) => {
          const li = el('li', i === z.dran && !z.ende ? 'dran' : '')
          const punkt = el('span', 'gruppe-punkt')
          punkt.style.background = farbe(i)
          const name = el('span', 'gruppe-name', sp.name + (online && sp.id === online.raum.id ? ' (du)' : ''))
          const klein = el('span', 'gruppe-klein', sp.ki ? (/^Computer/.test(sp.name) ? '' : 'Computer') : online && istAbwesend(i) ? 'nicht verbunden' : '')
          const pkt = el('span', 'gruppe-pkt', R.punkte ? String(R.punkte(z, i)) : '')
          if (z.ende && z.ende.sieger.includes(i)) li.classList.add('sieger')
          li.append(punkt, name, klein, pkt)
          return li
        }),
      )
    }

    function knoepfeUnten() {
      unten.replaceChildren()
      hinweis.textContent = ''
      if (online) {
        const lobby = el('a', 'knopf zweit', 'Zur Lobby')
        lobby.href = online.lobby
        unten.append(lobby)
        if (online.binHost && z.ende) unten.append(knopf('Noch eine Runde', '', nochmal))
        if (!online.binHost && online.status === 'verbunden' && !online.da.has(online.host) && online.da.size) {
          hinweis.textContent = 'Die Spielleitung ist gerade nicht verbunden. Es geht weiter, sobald sie wieder da ist.'
        } else if (online.status !== 'verbunden') hinweis.textContent = 'Verbindung weg – versuche es erneut …'
      } else {
        unten.append(knopf(z.ende ? 'Neues Spiel' : 'Spiel beenden', z.ende ? '' : 'zweit', () => {
          if (z.ende || confirm('Spiel wirklich beenden?')) einrichten()
        }))
        if (z.ende) unten.append(knopf('Nochmal mit denselben', 'zweit', nochmal))
      }
    }

    function abdecken(sitz) {
      aktionen.replaceChildren()
      statusZeile.textContent = z.spieler[sitz].name + ' ist dran.'
      spielerZeichnen()
      const k = el('div', 'gruppe-abdeckung')
      const punkt = el('span', 'gruppe-punkt gross')
      punkt.style.background = farbe(sitz)
      k.append(punkt, el('p', 'gruppe-abdeckung-titel', 'Gib das Gerät an ' + z.spieler[sitz].name + '.'), el('p', 'hinweis', 'Die anderen schauen bitte weg – gleich sind die eigenen Karten zu sehen.'))
      k.append(knopf('Ich bin ' + z.spieler[sitz].name + ' – zeigen', 'gross', () => {
        aufgedeckt = sitz
        zeichnen()
      }))
      flaeche.replaceChildren(k)
      logListe.replaceChildren(...(z.log || []).slice(-8).reverse().map((t) => el('li', null, t)))
      knoepfeUnten()
    }

    function nochmal() {
      const spieler = z.spieler.map((s) => Object.assign({}, s))
      // Wer zuletzt angefangen hat, kommt nach hinten
      spieler.push(spieler.shift())
      aufgedeckt = -1
      setze(R.neu(spieler, z.optionen || {}, H.neueSaat()), v + 1)
    }

    // ---------- Einrichten an einem Gerät ----------
    function standardOptionen() {
      const opt = {}
      ;(R.optionen || []).forEach((x) => (opt[x.id] = x.start))
      try {
        const g = JSON.parse(speicher('gruppenoptionen-' + R.id) || 'null')
        if (g && typeof g === 'object') (R.optionen || []).forEach((x) => x.werte.some((w) => w[0] === g[x.id]) && (opt[x.id] = g[x.id]))
      } catch {
        /* Standard */
      }
      return opt
    }

    function einrichten() {
      clearTimeout(kiTakt)
      z = null
      aufgedeckt = -1
      if (!einstellung) {
        const zahl = R.standard || R.min
        einstellung = {
          anzahl: zahl,
          plaetze: Array.from({ length: R.max }, (_, i) => ({ name: '', ki: R.min === 1 ? i > 0 : false })),
          optionen: standardOptionen(),
        }
      }
      const e = einstellung
      const karte = el('section', 'gruppe-einrichten')
      karte.append(el('h2', null, 'Wer spielt mit?'))
      if (R.max > R.min) {
        const werte = []
        for (let n = R.min; n <= R.max; n++) werte.push([n, String(n)])
        karte.append(
          segmente('Anzahl', werte, e.anzahl, (n) => {
            e.anzahl = n
            einrichten()
          }),
        )
      }
      const liste = el('div', 'gruppe-plaetze')
      for (let i = 0; i < e.anzahl; i++) {
        const p = e.plaetze[i]
        const zeile = el('div', 'gruppe-platz')
        const punkt = el('span', 'gruppe-punkt')
        punkt.style.background = farbe(i)
        const feld = el('input')
        feld.type = 'text'
        feld.maxLength = 20
        feld.autocomplete = 'off'
        feld.value = p.name
        feld.placeholder = p.ki ? 'Computer ' + (i + 1) : FARBEN[i]
        feld.setAttribute('aria-label', 'Name für Platz ' + (i + 1))
        feld.addEventListener('input', () => (p.name = feld.value))
        const art = segmente(null, [[false, 'Mensch'], [true, 'Computer']], p.ki, (w) => {
          p.ki = w
          feld.placeholder = w ? 'Computer ' + (i + 1) : FARBEN[i]
        })
        art.classList.add('gruppe-art')
        zeile.append(punkt, feld, art)
        liste.append(zeile)
      }
      karte.append(liste)
      ;(R.optionen || []).forEach((x) =>
        karte.append(
          segmente(x.text, x.werte, e.optionen[x.id], (w) => {
            e.optionen[x.id] = w
            speicher('gruppenoptionen-' + R.id, JSON.stringify(e.optionen))
          }),
        ),
      )
      const reihe = el('div', 'knopf-reihe')
      reihe.append(
        knopf('Spiel starten', 'gross', () => {
          const spieler = e.plaetze.slice(0, e.anzahl).map((p, i) => ({
            name: (window.Spielraum ? window.Spielraum.bereinige(p.name) : p.name.trim().slice(0, 20)) || (p.ki ? 'Computer ' + (i + 1) : FARBEN[i]),
            ki: !!p.ki,
          }))
          setze(R.neu(spieler, Object.assign({}, e.optionen), H.neueSaat()), 1)
        }),
      )
      const onl = el('a', 'knopf zweit gross', 'Online mit der Klasse')
      onl.href = '../lobby/?spiel=' + encodeURIComponent(R.id)
      onl.addEventListener('click', () => speicher('gruppenoptionen-' + R.id, JSON.stringify(e.optionen)))
      reihe.append(onl)
      karte.append(reihe)
      karte.append(el('p', 'hinweis', 'An einem Gerät: Ihr gebt Tablet oder Laptop weiter. Online spielt jeder auf dem eigenen Handy.'))
      flaeche.replaceChildren(karte)
      statusZeile.textContent = 'Neues Spiel einrichten'
      statusZeile.className = 'status'
      spielerListe.replaceChildren()
      aktionen.replaceChildren()
      unten.replaceChildren()
      hinweis.textContent = ''
      logKarte.hidden = true
    }

    // ---------- Online-Ablauf ----------
    function lobbyMelden() {
      if (!online || !z) return
      const ich = meinSitz()
      online.raum.setze({
        spielt: z.ende ? null : { partie: online.partie, spiel: R.id, host: online.host, gegner: z.spieler.filter((_, i) => i !== ich).map((s) => s.name).join(', ').slice(0, 60), anzahl: z.spieler.length },
      })
    }

    function onlineStarten() {
      const raum = online.raum
      const meine = (d) => d && d.partie === online.partie
      flaeche.replaceChildren(el('p', 'gruppe-warten', 'Verbinde mit dem Spiel …'))
      statusZeile.textContent = 'Online-Spiel'
      logKarte.hidden = true

      raum.auf('status', (s) => {
        online.status = s
        if (z) knoepfeUnten()
      })
      raum.auf('anwesenheit', (liste) => {
        const jetzt = Date.now()
        const neu = new Set(liste.map((x) => x.id))
        online.da.forEach((id) => !neu.has(id) && (online.weg[id] = jetzt))
        neu.forEach((id) => delete online.weg[id])
        online.da = neu
        if (z) {
          spielerZeichnen()
          knoepfeUnten()
          if (!z.ende && !z.spieler[z.dran].ki) statusZeile.textContent = statusText(sicht())
        }
      })
      raum.auf('stand', (d) => {
        if (!meine(d) || !d.z || typeof d.v !== 'number' || !Array.isArray(d.z.spieler)) return
        if (online.binHost && z) return // die Spielleitung hat den Stand schon (Antworten auf ihre Nachfrage kommen unten)
        online.wartet = -1 // Antwort der Spielleitung: wieder handeln dürfen (auch wenn die Aktion abgelehnt wurde)
        if (d.v <= v && z) return zeichnen()
        if (online.binHost) {
          // Antwort auf die Nachfrage nach dem Neuladen
          gerettet = gerettet && gerettet.v >= d.v ? gerettet : d
          return
        }
        z = d.z
        v = d.v
        zeichnen()
      })
      raum.auf('frage', (d) => {
        if (!meine(d) || d.von === raum.id || !z) return
        if (online.binHost || d.von === online.host) raum.sende('stand', { partie: online.partie, v, z })
      })
      raum.auf('aktion', (d) => {
        if (!online.binHost || !meine(d) || !z || z.ende) return
        const sitz = z.spieler.findIndex((s) => s.id === d.von)
        if (sitz < 0 || sitz !== z.dran || d.v !== v || !anwenden(sitz, d.a)) raum.sende('stand', { partie: online.partie, v, z })
      })
      // Lebenszeichen: wer eine Aktion schickt, ist da
      raum.auf('aktion', (d) => meine(d) && typeof d.von === 'string' && delete online.weg[d.von])

      let gerettet = null
      raum.sende('frage', { partie: online.partie, von: raum.id })
      if (online.binHost) {
        setTimeout(() => {
          if (z) return
          if (gerettet) {
            setze(gerettet.z, gerettet.v + 1)
            return
          }
          let start = null
          try {
            start = JSON.parse(speicher('gruppenstart-' + online.partie) || 'null')
          } catch {
            start = null
          }
          if (!start || !Array.isArray(start.spieler) || start.spieler.length < R.min || start.spieler.length > R.max) {
            flaeche.replaceChildren(el('p', 'gruppe-warten', 'Diese Partie gibt es nicht mehr.'))
            const l = el('a', 'knopf', 'Zur Lobby')
            l.href = online.lobby
            flaeche.append(l)
            return
          }
          const spieler = start.spieler.map((s, i) => ({
            name: window.Spielraum.bereinige(s.name) || 'Spieler ' + (i + 1),
            ki: !!s.ki,
            id: s.ki ? undefined : String(s.id),
          }))
          setze(R.neu(spieler, standardOptionen(), H.neueSaat()), 1)
        }, 1800)
        // Regelmäßig: Abwesende am Zug vertritt der Computer
        setInterval(() => z && !z.ende && kiPruefen(), 2500)
      } else {
        // Nachfragen, bis der Stand da ist
        const nachfrage = setInterval(() => {
          if (z) return clearInterval(nachfrage)
          raum.sende('frage', { partie: online.partie, von: raum.id })
        }, 3000)
      }
      window.addEventListener('pagehide', () => raum.verlassen())
    }

    // ---------- Seitenleiste ----------
    seite.prepend(kopfKarte, logKarte)
    if (online) onlineStarten()
    else einrichten()

    return { zustand: () => z, neuZeichnen: () => z && zeichnen() }
  }

  window.Gruppenspiel = Gruppenspiel
  window.Gruppenspiel.FARBEN = FARBEN
})()
