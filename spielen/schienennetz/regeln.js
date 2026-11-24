/*
 * Schienennetz – Strecken zwischen Städten in Niedersachsen bauen und Aufträge erfüllen (Browser: window.Schienennetz, Node: module.exports).
 * Ein Zug ist eins von dreien: zwei Wagenkarten ziehen, eine Strecke bauen oder neue Aufträge ziehen.
 * Zustand: { spieler, dran, phase: 'wahl' | 'zug', hand: [[7 Zahlen: Farben 0–5, 6 = Lok]], auslage: [5 Karten], stapel, ablage,
 *            strecken: [Sitz | null je Strecke], wagen: [Zahl], auftraege: [[{ a, b, p }]], angebot: [Aufträge zur Wahl], mindestens,
 *            gezogen (Karten in diesem Zug), schluss (restliche Züge nach dem Ende, sonst -1), punkte, passen, ende, log, saat }
 * Aktionen: { t: 'karte', i: 0–4 | 'stapel' }, { t: 'strecke', id, farbe }, { t: 'auftraege' }, { t: 'behalte', welche: [Indizes] }, { t: 'passe' }
 */
;(function () {
  'use strict'
  const H = typeof module !== 'undefined' && module.exports ? require('../gruppe-hilfe.js') : window.GruppenHilfe

  const FARBEN = ['Rot', 'Blau', 'Gelb', 'Grün', 'Lila', 'Orange', 'Lok']
  const LOK = 6
  const GRAU = 6
  const PUNKTE = [0, 1, 2, 4, 7, 10, 15]

  const STAEDTE = [
    ['Emden', 40, 120], ['Wilhelmshaven', 118, 70], ['Cuxhaven', 205, 25], ['Stade', 272, 72], ['Hamburg', 340, 88],
    ['Lüneburg', 392, 148], ['Uelzen', 420, 212], ['Bremerhaven', 180, 92], ['Oldenburg', 118, 148], ['Bremen', 196, 165],
    ['Verden', 258, 196], ['Soltau', 330, 186], ['Celle', 352, 262], ['Wolfsburg', 452, 284], ['Braunschweig', 418, 330],
    ['Hildesheim', 345, 342], ['Hannover', 300, 300], ['Nienburg', 240, 252], ['Bruchhausen-Vilsen', 198, 218], ['Diepholz', 150, 262],
    ['Osnabrück', 88, 304], ['Minden', 200, 322], ['Bielefeld', 140, 374], ['Göttingen', 330, 418], ['Lingen', 38, 228],
    ['Cloppenburg', 98, 205],
  ].map(([name, x, y]) => ({ name, x, y }))
  const S = (n) => STAEDTE.findIndex((s) => s.name === n)

  // [Stadt, Stadt, Länge, Farbe (6 = grau: jede Farbe)]
  const STRECKEN = [
    ['Emden', 'Wilhelmshaven', 2, GRAU], ['Emden', 'Oldenburg', 2, 0], ['Emden', 'Lingen', 3, 1], ['Wilhelmshaven', 'Oldenburg', 2, 2],
    ['Wilhelmshaven', 'Bremerhaven', 2, 3], ['Bremerhaven', 'Cuxhaven', 2, GRAU], ['Cuxhaven', 'Stade', 2, 4], ['Stade', 'Hamburg', 1, GRAU],
    ['Bremerhaven', 'Bremen', 2, 5], ['Bremerhaven', 'Stade', 3, 0], ['Oldenburg', 'Bremen', 2, 1], ['Oldenburg', 'Cloppenburg', 2, GRAU],
    ['Cloppenburg', 'Lingen', 2, 3], ['Cloppenburg', 'Diepholz', 2, 2], ['Lingen', 'Osnabrück', 3, 5], ['Osnabrück', 'Diepholz', 2, 0],
    ['Osnabrück', 'Bielefeld', 2, 3], ['Osnabrück', 'Minden', 3, GRAU], ['Bremen', 'Bruchhausen-Vilsen', 1, GRAU], ['Bremen', 'Verden', 2, 3],
    ['Bremen', 'Hamburg', 4, 2], ['Bremen', 'Cloppenburg', 3, 4], ['Bruchhausen-Vilsen', 'Diepholz', 2, 1], ['Bruchhausen-Vilsen', 'Nienburg', 2, 5],
    ['Bruchhausen-Vilsen', 'Verden', 1, 4], ['Verden', 'Soltau', 2, 1], ['Verden', 'Nienburg', 2, GRAU], ['Hamburg', 'Lüneburg', 2, 3],
    ['Hamburg', 'Soltau', 3, 5], ['Lüneburg', 'Uelzen', 2, 0], ['Lüneburg', 'Soltau', 2, 2], ['Soltau', 'Celle', 2, 4],
    ['Soltau', 'Uelzen', 3, GRAU], ['Uelzen', 'Wolfsburg', 3, 1], ['Uelzen', 'Celle', 2, 5], ['Celle', 'Hannover', 1, 2],
    ['Celle', 'Wolfsburg', 3, 3], ['Celle', 'Braunschweig', 3, GRAU], ['Nienburg', 'Hannover', 2, 4], ['Nienburg', 'Minden', 2, 2],
    ['Diepholz', 'Minden', 2, 3], ['Minden', 'Hannover', 3, 0], ['Minden', 'Bielefeld', 2, 4], ['Bielefeld', 'Göttingen', 4, 5],
    ['Hannover', 'Hildesheim', 1, 1], ['Hannover', 'Braunschweig', 2, GRAU], ['Hildesheim', 'Braunschweig', 2, 0], ['Hildesheim', 'Göttingen', 3, 2],
    ['Braunschweig', 'Wolfsburg', 1, 4], ['Braunschweig', 'Göttingen', 4, 3], ['Hannover', 'Bielefeld', 4, GRAU], ['Stade', 'Soltau', 3, 1],
  ].map(([a, b, n, f], id) => ({ id, a: S(a), b: S(b), n, f }))

  const PAARE = [
    ['Emden', 'Hamburg'], ['Emden', 'Hannover'], ['Cuxhaven', 'Göttingen'], ['Bremen', 'Braunschweig'], ['Lingen', 'Wolfsburg'],
    ['Oldenburg', 'Celle'], ['Bremerhaven', 'Hildesheim'], ['Osnabrück', 'Lüneburg'], ['Wilhelmshaven', 'Bielefeld'], ['Stade', 'Minden'],
    ['Bruchhausen-Vilsen', 'Hamburg'], ['Bruchhausen-Vilsen', 'Göttingen'], ['Verden', 'Osnabrück'], ['Diepholz', 'Uelzen'], ['Nienburg', 'Cuxhaven'],
    ['Soltau', 'Bielefeld'], ['Hamburg', 'Göttingen'], ['Lüneburg', 'Bremen'], ['Cloppenburg', 'Hannover'], ['Uelzen', 'Oldenburg'],
    ['Wolfsburg', 'Bremen'], ['Minden', 'Lüneburg'], ['Bielefeld', 'Braunschweig'], ['Lingen', 'Bremen'], ['Hildesheim', 'Stade'],
    ['Göttingen', 'Wilhelmshaven'], ['Hannover', 'Cuxhaven'], ['Osnabrück', 'Hamburg'], ['Diepholz', 'Wolfsburg'], ['Emden', 'Bruchhausen-Vilsen'],
  ]

  /** Kürzester Weg (Summe der Längen) zwischen zwei Städten; kosten(strecke) → Zahl oder Infinity. */
  function wegKosten(a, b, kosten) {
    const d = STAEDTE.map(() => Infinity)
    const vor = STAEDTE.map(() => -1)
    const fertig = new Set()
    d[a] = 0
    while (true) {
      let u = -1
      d.forEach((x, i) => !fertig.has(i) && x < Infinity && (u < 0 || x < d[u]) && (u = i))
      if (u < 0 || u === b) break
      fertig.add(u)
      STRECKEN.forEach((s) => {
        if (s.a !== u && s.b !== u) return
        const v = s.a === u ? s.b : s.a
        const k = kosten(s)
        if (d[u] + k < d[v]) {
          d[v] = d[u] + k
          vor[v] = s.id
        }
      })
    }
    const weg = []
    if (d[b] < Infinity)
      for (let x = b; x !== a; ) {
        const s = STRECKEN[vor[x]]
        weg.push(s.id)
        x = s.a === x ? s.b : s.a
      }
    return { laenge: d[b], weg }
  }
  const AUFTRAEGE = PAARE.map(([a, b]) => {
    const x = S(a)
    const y = S(b)
    return { a: x, b: y, p: wegKosten(x, y, (s) => s.n).laenge }
  })

  function verbunden(z, s, a, b) {
    const gesehen = new Set([a])
    const offen = [a]
    while (offen.length) {
      const u = offen.pop()
      if (u === b) return true
      STRECKEN.forEach((r) => {
        if (z.strecken[r.id] !== s || (r.a !== u && r.b !== u)) return
        const v = r.a === u ? r.b : r.a
        if (!gesehen.has(v)) {
          gesehen.add(v)
          offen.push(v)
        }
      })
    }
    return false
  }
  function laengsteStrecke(z, s) {
    const eigene = STRECKEN.filter((r) => z.strecken[r.id] === s)
    let best = 0
    function tiefe(u, benutzt, laenge) {
      best = Math.max(best, laenge)
      eigene.forEach((r) => {
        if (benutzt.has(r.id) || (r.a !== u && r.b !== u)) return
        benutzt.add(r.id)
        tiefe(r.a === u ? r.b : r.a, benutzt, laenge + r.n)
        benutzt.delete(r.id)
      })
    }
    STAEDTE.forEach((_, u) => tiefe(u, new Set(), 0))
    return best
  }

  function ziehen(z) {
    if (!z.stapel.length && z.ablage.length) {
      z.stapel = H.mische(z, z.ablage)
      z.ablage = []
    }
    return z.stapel.length ? z.stapel.pop() : null
  }
  function auslageAuffuellen(z) {
    for (let runde = 0; runde < 5; runde++) {
      for (let i = 0; i < 5; i++) if (z.auslage[i] === null) z.auslage[i] = ziehen(z)
      // drei Loks offen: neu auslegen (höchstens ein paar Mal)
      if (z.auslage.filter((k) => k === LOK).length < 3) return
      z.auslage.forEach((k) => k !== null && z.ablage.push(k))
      z.auslage = [null, null, null, null, null]
    }
  }

  function neu(spieler, optionen, saat) {
    const n = spieler.length
    const z = {
      spieler, optionen: optionen || {}, saat: saat >>> 0, dran: 0, phase: 'wahl',
      hand: spieler.map(() => [0, 0, 0, 0, 0, 0, 0]), auslage: [null, null, null, null, null], stapel: [], ablage: [],
      strecken: STRECKEN.map(() => null), wagen: spieler.map(() => (n <= 3 ? 30 : 25)), auftraege: spieler.map(() => []),
      angebot: [], mindestens: 2, stapelAuftraege: [], gezogen: 0, schluss: -1, punkte: spieler.map(() => 0), passen: 0, ende: null, log: [],
    }
    const karten = []
    for (let f = 0; f < 6; f++) for (let i = 0; i < 12; i++) karten.push(f)
    for (let i = 0; i < 14; i++) karten.push(LOK)
    z.stapel = H.mische(z, karten)
    spieler.forEach((_, s) => {
      for (let i = 0; i < 4; i++) z.hand[s][ziehen(z)]++
    })
    auslageAuffuellen(z)
    z.stapelAuftraege = H.mische(z, AUFTRAEGE.map((_, i) => i))
    z.angebot = z.stapelAuftraege.splice(-3)
    H.melde(z, 'Jeder wählt zuerst mindestens zwei von drei Aufträgen.')
    return z
  }

  function zugEnde(z) {
    z.gezogen = 0
    if (z.schluss > 0) z.schluss--
    if (z.schluss === 0 || z.passen >= z.spieler.length) return abrechnen(z)
    z.dran = (z.dran + 1) % z.spieler.length
  }

  function abrechnen(z) {
    const l = z.spieler.map((_, s) => laengsteStrecke(z, s))
    const max = Math.max(...l)
    const gesamt = z.spieler.map((_, s) => {
      let p = z.punkte[s]
      z.auftraege[s].forEach((t) => {
        const A = AUFTRAEGE[t]
        p += verbunden(z, s, A.a, A.b) ? A.p : -A.p
      })
      if (max > 0 && l[s] === max) p += 10
      return p
    })
    z.endpunkte = gesamt
    z.laengste = l
    H.melde(z, 'Abrechnung: Aufträge zählen plus oder minus, die längste Strecke (' + max + ') bringt 10 Punkte.')
    H.endeNachPunkten(z, gesamt)
  }

  /** Mit welchen Farben kann der Spieler diese Strecke bezahlen? */
  function bezahlbar(z, s, id) {
    const r = STRECKEN[id]
    const hand = z.hand[s]
    if (!r || z.strecken[id] !== null || z.wagen[s] < r.n) return []
    const farben = r.f === GRAU ? [0, 1, 2, 3, 4, 5] : [r.f]
    const l = farben.filter((f) => hand[f] > 0 && hand[f] + hand[LOK] >= r.n)
    if (!l.length && hand[LOK] >= r.n) l.push(r.f === GRAU ? 0 : r.f) // nur mit Loks
    return l
  }

  function anwenden(z0, sitz, a) {
    if (!a || z0.ende || sitz !== z0.dran) return null
    const z = H.kopie(z0)
    const hand = z.hand[sitz]
    if (z.phase === 'wahl') {
      if (a.t !== 'behalte' || !Array.isArray(a.welche)) return null
      const welche = [...new Set(a.welche)].filter((i) => Number.isInteger(i) && i >= 0 && i < z.angebot.length)
      if (welche.length < Math.min(z.mindestens, z.angebot.length) || welche.length !== a.welche.length) return null
      welche.forEach((i) => z.auftraege[sitz].push(z.angebot[i]))
      z.angebot.forEach((t, i) => !welche.includes(i) && z.stapelAuftraege.unshift(t))
      H.melde(z, H.name(z, sitz) + ' behält ' + welche.length + (welche.length === 1 ? ' Auftrag.' : ' Aufträge.'))
      z.angebot = []
      z.phase = 'zug'
      if (z.mindestens === 2 && z.auftraege.some((x) => !x.length)) {
        // Anfangswahl: der Nächste wählt
        z.dran = (z.dran + 1) % z.spieler.length
        z.angebot = z.stapelAuftraege.splice(-3)
        z.phase = 'wahl'
        return z
      }
      if (z.mindestens === 2) {
        z.dran = 0
        z.mindestens = 1
        return z
      }
      z.passen = 0
      zugEnde(z)
      return z
    }
    if (a.t === 'karte') {
      let k
      if (a.i === 'stapel') {
        k = ziehen(z)
        if (k === null) return null
      } else {
        if (!Number.isInteger(a.i) || a.i < 0 || a.i > 4 || z.auslage[a.i] === null) return null
        k = z.auslage[a.i]
        if (k === LOK && z.gezogen > 0) return null
        z.auslage[a.i] = null
        auslageAuffuellen(z)
      }
      hand[k]++
      z.gezogen += a.i !== 'stapel' && k === LOK ? 2 : 1
      z.passen = 0
      if (z.gezogen >= 2) {
        H.melde(z, H.name(z, sitz) + ' zieht Wagenkarten.')
        zugEnde(z)
      }
      return z
    }
    if (z.gezogen > 0) {
      // nach der ersten Karte darf man nur noch eine zweite ziehen (oder passen, wenn nichts mehr da ist)
      if (a.t === 'passe' && !z.stapel.length && !z.ablage.length && z.auslage.every((x) => x === null || x === LOK)) {
        zugEnde(z)
        return z
      }
      return null
    }
    if (a.t === 'strecke') {
      if (!bezahlbar(z, sitz, a.id).includes(a.farbe)) return null
      const r = STRECKEN[a.id]
      const bunt = Math.min(hand[a.farbe], r.n)
      const lok = r.n - bunt
      hand[a.farbe] -= bunt
      hand[LOK] -= lok
      for (let i = 0; i < bunt; i++) z.ablage.push(a.farbe)
      for (let i = 0; i < lok; i++) z.ablage.push(LOK)
      z.strecken[a.id] = sitz
      z.wagen[sitz] -= r.n
      z.punkte[sitz] += PUNKTE[r.n]
      z.passen = 0
      H.melde(z, H.name(z, sitz) + ' baut ' + STAEDTE[r.a].name + ' – ' + STAEDTE[r.b].name + ' (' + PUNKTE[r.n] + ' P).')
      if (z.schluss < 0 && z.wagen[sitz] <= 2) {
        z.schluss = z.spieler.length + 1 // jeder hat noch einen Zug (dieser Zug zählt gleich mit)
        H.melde(z, H.name(z, sitz) + ' hat nur noch ' + z.wagen[sitz] + ' Wagen: Jeder hat noch einen letzten Zug!')
      }
      zugEnde(z)
      return z
    }
    if (a.t === 'auftraege') {
      if (!z.stapelAuftraege.length) return null
      z.angebot = z.stapelAuftraege.splice(-3)
      z.phase = 'wahl'
      return z
    }
    if (a.t === 'passe') {
      // nur wenn man weder ziehen noch bauen kann
      const kannZiehen = z.stapel.length || z.ablage.length || z.auslage.some((x) => x !== null)
      const kannBauen = STRECKEN.some((r) => bezahlbar(z, sitz, r.id).length)
      if (kannZiehen || kannBauen || z.stapelAuftraege.length) return null
      z.passen++
      H.melde(z, H.name(z, sitz) + ' kann nichts tun und passt.')
      zugEnde(z)
      return z
    }
    return null
  }

  // ---------- Computer ----------
  function gebrauchte(z, s) {
    const l = new Map()
    z.auftraege[s].forEach((t) => {
      const A = AUFTRAEGE[t]
      if (verbunden(z, s, A.a, A.b)) return
      const w = wegKosten(A.a, A.b, (r) => (z.strecken[r.id] === s ? 0 : z.strecken[r.id] === null ? r.n : Infinity))
      if (w.laenge < Infinity && w.laenge <= z.wagen[s]) w.weg.forEach((id) => z.strecken[id] === null && l.set(id, (l.get(id) || 0) + 1))
    })
    return l
  }
  function ki(z, s) {
    const hand = z.hand[s]
    if (z.phase === 'wahl') {
      const wert = z.angebot.map((t, i) => ({ i, p: AUFTRAEGE[t].p + wegKosten(AUFTRAEGE[t].a, AUFTRAEGE[t].b, (r) => (z.strecken[r.id] === s ? 0 : z.strecken[r.id] === null ? r.n : 50)).laenge }))
      wert.sort((x, y) => x.p - y.p)
      return { t: 'behalte', welche: wert.slice(0, Math.max(z.mindestens, 1)).map((x) => x.i) }
    }
    const noetig = gebrauchte(z, s)
    const kandidaten = (filter) => {
      let best = null
      let bw = -Infinity
      STRECKEN.forEach((r) => {
        if (!filter(r)) return
        const f = bezahlbar(z, s, r.id)
        if (!f.length) return
        // die Farbe nehmen, von der man am meisten hat (Loks schonen)
        f.sort((x, y) => hand[y] - hand[x])
        const w = r.n * 2 + (noetig.get(r.id) || 0) * 10
        if (w > bw) {
          bw = w
          best = { t: 'strecke', id: r.id, farbe: f[0] }
        }
      })
      return best
    }
    if (z.gezogen === 0) {
      const b = kandidaten((r) => noetig.has(r.id))
      if (b) return b
      if (!noetig.size) {
        if (z.wagen[s] > 12 && z.stapelAuftraege.length && z.schluss < 0 && z.auftraege[s].length < 6) return { t: 'auftraege' }
        const c = kandidaten((r) => r.n >= 3 || z.wagen[s] <= 6)
        if (c) return c
      }
    }
    // Karten ziehen: Farben der gebrauchten Strecken
    const bedarf = [0, 0, 0, 0, 0, 0]
    noetig.forEach((_, id) => {
      const r = STRECKEN[id]
      if (r.f !== GRAU) bedarf[r.f] += r.n
    })
    let best = -1
    let bw = 0
    z.auslage.forEach((k, i) => {
      if (k === null) return
      const w = k === LOK ? (z.gezogen ? -1 : 2.5) : bedarf[k] - hand[k] * 0.5 + 0.1
      if (w > bw) {
        bw = w
        best = i
      }
    })
    if (best >= 0) return { t: 'karte', i: best }
    if (z.stapel.length || z.ablage.length) return { t: 'karte', i: 'stapel' }
    const frei = z.auslage.findIndex((k) => k !== null && (k !== LOK || !z.gezogen))
    if (frei >= 0) return { t: 'karte', i: frei }
    if (z.gezogen === 0) {
      const c = kandidaten(() => true)
      if (c) return c
      if (z.stapelAuftraege.length) return { t: 'auftraege' }
    }
    return { t: 'passe' }
  }

  const punkte = (z, i) => (z.ende && z.endpunkte ? z.endpunkte[i] + ' P' : z.punkte[i] + ' P · ' + z.wagen[i] + ' W')

  const api = { id: 'schienennetz', name: 'Schienennetz', min: 2, max: 5, standard: 3, FARBEN, LOK, GRAU, PUNKTE, STAEDTE, STRECKEN, AUFTRAEGE, verbunden, laengsteStrecke, bezahlbar, neu, anwenden, ki, punkte }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.Schienennetz = api
})()
