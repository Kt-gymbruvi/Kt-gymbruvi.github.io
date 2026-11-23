/*
 * Schiffe versenken – Spielkern: Flotte aufstellen, schießen, Rechnerspieler.
 * Browser: window.Schiffe, Node: module.exports.
 *
 * Feld 10 × 10, Zelle = Zeile * 10 + Spalte. Flotte wie auf Kästchenpapier: 1 × 5, 2 × 4, 3 × 3, 4 × 2.
 * Auf Wunsch dürfen sich Schiffe nicht berühren (auch nicht schräg): dann sind nach einem versenkten
 * Schiff alle Nachbarfelder sicher Wasser.
 *
 * Brett: { schiffe: [{ id, laenge, zellen, treffer }], belegung: [Schiffsnummer oder -1], schuss: [0 | 1 Wasser | 2 Treffer], sicher: [bool] }
 * Wissen des Schützen (für den Rechner): bekannt[z] = 0 unbekannt, 1 Wasser, 2 Treffer (Schiff noch nicht versenkt), 3 versenkt.
 */
;(function () {
  'use strict'

  const N = 10
  const FLOTTE = [5, 4, 4, 3, 3, 3, 2, 2, 2, 2]
  const NAMEN = { 5: 'Schlachtschiff', 4: 'Kreuzer', 3: 'Zerstörer', 2: 'U-Boot' }
  const SPALTEN = 'ABCDEFGHIJ'
  const R = (z) => Math.floor(z / N)
  const C = (z) => z % N
  const feldName = (z) => SPALTEN[C(z)] + (R(z) + 1)

  function mischen(feld, zufall) {
    for (let i = feld.length - 1; i > 0; i--) {
      const j = Math.floor(zufall() * (i + 1))
      ;[feld[i], feld[j]] = [feld[j], feld[i]]
    }
    return feld
  }

  /** Zellen eines Schiffs ab `start`, waagerecht (nach rechts) oder senkrecht (nach unten); null, wenn es nicht aufs Feld passt. */
  function zellen(start, laenge, waagerecht) {
    if (waagerecht ? C(start) + laenge > N : R(start) + laenge > N) return null
    return Array.from({ length: laenge }, (_, k) => (waagerecht ? start + k : start + k * N))
  }

  function nachbarn8(z) {
    const liste = []
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue
        const r = R(z) + dr
        const c = C(z) + dc
        if (r >= 0 && r < N && c >= 0 && c < N) liste.push(r * N + c)
      }
    }
    return liste
  }

  /** `belegung[z]` = Nummer des Schiffs auf z oder -1. Darf ein neues Schiff auf `zs` liegen? */
  function platzFrei(belegung, zs, beruehren) {
    for (const z of zs) {
      if (belegung[z] >= 0) return false
      if (!beruehren) for (const nb of nachbarn8(z)) if (belegung[nb] >= 0) return false
    }
    return true
  }

  /** Legt die ganze Flotte zufällig. Liefert [{ id, laenge, zellen }]. */
  function zufallsFlotte(zufall, beruehren) {
    zufall = zufall || Math.random
    const reihenfolge = FLOTTE.map((l, id) => ({ id, laenge: l })).sort((a, b) => b.laenge - a.laenge)
    for (;;) {
      const belegung = new Array(N * N).fill(-1)
      const schiffe = []
      let ok = true
      for (const s of reihenfolge) {
        let gelegt = null
        for (let versuch = 0; versuch < 300 && !gelegt; versuch++) {
          const zs = zellen(Math.floor(zufall() * N * N), s.laenge, zufall() < 0.5)
          if (zs && platzFrei(belegung, zs, beruehren)) gelegt = zs
        }
        if (!gelegt) {
          ok = false
          break
        }
        gelegt.forEach((z) => (belegung[z] = s.id))
        schiffe.push({ id: s.id, laenge: s.laenge, zellen: gelegt })
      }
      if (ok) return schiffe.sort((a, b) => a.id - b.id)
    }
  }

  function neuesBrett(schiffe) {
    const belegung = new Array(N * N).fill(-1)
    const kopie = schiffe.map((s) => ({ id: s.id, laenge: s.laenge, zellen: s.zellen.slice(), treffer: 0 }))
    for (const s of kopie) s.zellen.forEach((z) => (belegung[z] = s.id))
    return { schiffe: kopie, belegung, schuss: new Array(N * N).fill(0), sicher: new Array(N * N).fill(false) }
  }

  /** Schuss auf Zelle z. Liefert { art: 'wasser' | 'treffer' | 'versenkt', schiff, fertig } oder null (schon beschossen / sicheres Wasser). */
  function schiessen(brett, z, beruehren) {
    if (brett.schuss[z] || brett.sicher[z]) return null
    const id = brett.belegung[z]
    if (id < 0) {
      brett.schuss[z] = 1
      return { art: 'wasser', schiff: null, fertig: false }
    }
    brett.schuss[z] = 2
    const s = brett.schiffe[id]
    s.treffer++
    if (s.treffer < s.laenge) return { art: 'treffer', schiff: s, fertig: false }
    if (!beruehren) {
      for (const sz of s.zellen) for (const nb of nachbarn8(sz)) if (!brett.schuss[nb]) brett.sicher[nb] = true
    }
    return { art: 'versenkt', schiff: s, fertig: brett.schiffe.every((x) => x.treffer >= x.laenge) }
  }

  const versenkt = (s) => s.treffer >= s.laenge

  /** Was der Schütze über das gegnerische Brett weiß. */
  function wissen(brett) {
    const bekannt = new Array(N * N).fill(0)
    for (let z = 0; z < N * N; z++) {
      if (brett.sicher[z]) bekannt[z] = 1
      if (brett.schuss[z] === 1) bekannt[z] = 1
      else if (brett.schuss[z] === 2) bekannt[z] = versenkt(brett.schiffe[brett.belegung[z]]) ? 3 : 2
    }
    return { bekannt, rest: brett.schiffe.filter((s) => !versenkt(s)).map((s) => s.laenge) }
  }

  // ---------- Rechnerspieler ----------

  function wahl(liste, zufall) {
    return liste[Math.floor(zufall() * liste.length)]
  }

  /** Nächster Schuss. stufe: 'leicht' | 'mittel' | 'schwer'. */
  function schuss(stufe, w, zufall) {
    zufall = zufall || Math.random
    const bekannt = w.bekannt
    const unbekannt = []
    for (let z = 0; z < N * N; z++) if (bekannt[z] === 0) unbekannt.push(z)
    if (stufe === 'leicht') return wahl(unbekannt, zufall)

    const treffer = []
    for (let z = 0; z < N * N; z++) if (bekannt[z] === 2) treffer.push(z)

    if (stufe === 'mittel') {
      if (treffer.length) {
        // Nachbarn von Treffern; in Verlängerung einer Reihe bevorzugt
        const punkte = new Map()
        for (const h of treffer) {
          for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const r = R(h) + dr
            const c = C(h) + dc
            if (r < 0 || r >= N || c < 0 || c >= N) continue
            const nb = r * N + c
            if (bekannt[nb] !== 0) continue
            const gegenueber = [R(h) - dr, C(h) - dc]
            const gz = gegenueber[0] >= 0 && gegenueber[0] < N && gegenueber[1] >= 0 && gegenueber[1] < N ? gegenueber[0] * N + gegenueber[1] : -1
            punkte.set(nb, (punkte.get(nb) || 0) + 1 + (gz >= 0 && bekannt[gz] === 2 ? 5 : 0))
          }
        }
        if (punkte.size) {
          const best = Math.max(...punkte.values())
          return wahl([...punkte].filter(([, p]) => p === best).map(([z]) => z), zufall)
        }
      }
      // Suchen: Schachbrettmuster (jedes Schiff hat mindestens die Länge 2)
      const muster = unbekannt.filter((z) => (R(z) + C(z)) % 2 === 0)
      return wahl(muster.length ? muster : unbekannt, zufall)
    }

    // schwer: zählt alle möglichen Lagen der noch schwimmenden Schiffe
    const dichte = new Array(N * N).fill(0)
    for (const laenge of w.rest) {
      for (let start = 0; start < N * N; start++) {
        for (const waagerecht of [true, false]) {
          const zs = zellen(start, laenge, waagerecht)
          if (!zs || zs.some((z) => bekannt[z] === 1 || bekannt[z] === 3)) continue
          const gedeckt = zs.filter((z) => bekannt[z] === 2).length
          // Lagen, die einen Treffer erklären, zählen viel mehr
          const gewicht = treffer.length ? (gedeckt ? 1 + 20 * gedeckt : 0.05) : 1
          for (const z of zs) if (bekannt[z] === 0) dichte[z] += gewicht
        }
      }
    }
    let best = -1
    let kandidaten = []
    for (const z of unbekannt) {
      if (dichte[z] > best + 1e-9) {
        best = dichte[z]
        kandidaten = [z]
      } else if (Math.abs(dichte[z] - best) <= 1e-9) kandidaten.push(z)
    }
    return wahl(kandidaten.length ? kandidaten : unbekannt, zufall)
  }

  const Schiffe = { N, FLOTTE, NAMEN, SPALTEN, feldName, zellen, nachbarn8, platzFrei, zufallsFlotte, neuesBrett, schiessen, versenkt, wissen, schuss }
  if (typeof module !== 'undefined' && module.exports) module.exports = Schiffe
  else window.Schiffe = Schiffe
})()
