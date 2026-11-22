/*
 * Einstein-Rätsel (Zebra-Rätsel) – Rechenkern: Löser (zählt Lösungen) und Erzeuger.
 * Läuft im Browser (window.Einstein) und in Node (module.exports) – keine Abhängigkeiten.
 *
 * n Häuser (Plätze) von links nach rechts, k Kategorien mit je n Werten.
 * Eine Lösung ist loesung[c][w] = Haus (0…n−1), in dem der Wert w der Kategorie c steht.
 *
 * Hinweise:  { art, a:[c,w], b:[c,w] | null, p }
 *   gleich     a und b gehören zusammen (dasselbe Haus)
 *   nicht      a und b gehören nicht zusammen
 *   neben      Häuser von a und b liegen direkt nebeneinander
 *   links      a wohnt direkt links von b
 *   weiterLinks a wohnt irgendwo weiter links als b
 *   an         a steht im Haus p
 */
;(function () {
  'use strict'

  function permutationen(n) {
    const alle = []
    const arbeit = Array.from({ length: n }, (_, i) => i)
    ;(function rek(i) {
      if (i === n) return alle.push(arbeit.slice())
      for (let j = i; j < n; j++) {
        ;[arbeit[i], arbeit[j]] = [arbeit[j], arbeit[i]]
        rek(i + 1)
        ;[arbeit[i], arbeit[j]] = [arbeit[j], arbeit[i]]
      }
    })(0)
    return alle
  }

  function stimmt(h, pos) {
    const a = pos[h.a[0]][h.a[1]]
    switch (h.art) {
      case 'an':
        return a === h.p
      case 'gleich':
        return a === pos[h.b[0]][h.b[1]]
      case 'nicht':
        return a !== pos[h.b[0]][h.b[1]]
      case 'neben':
        return Math.abs(a - pos[h.b[0]][h.b[1]]) === 1
      case 'links':
        return a + 1 === pos[h.b[0]][h.b[1]]
      case 'weiterLinks':
        return a < pos[h.b[0]][h.b[1]]
    }
    return false
  }

  /** Zählt Lösungen (höchstens `grenze`). Liefert { anzahl, loesung } oder { anzahl: -1 }, wenn das Suchbudget nicht reichte. */
  function zaehlen(n, k, hinweise, grenze, budget) {
    const perms = zaehlen.cache[n] || (zaehlen.cache[n] = permutationen(n))
    // Reihenfolge der Kategorien: jeweils die mit den meisten Hinweisen zu den schon gewählten
    const hinweisKats = hinweise.map((h) => (h.b ? [h.a[0], h.b[0]] : [h.a[0]]))
    const reihenfolge = []
    const gewaehlt = new Set()
    while (reihenfolge.length < k) {
      let beste = -1
      let wert = -1
      for (let c = 0; c < k; c++) {
        if (gewaehlt.has(c)) continue
        let w = 0
        hinweisKats.forEach((kats) => {
          if (!kats.includes(c)) return
          if (kats.every((x) => x === c || gewaehlt.has(x))) w += 10
          else w += 1
        })
        if (w > wert) {
          wert = w
          beste = c
        }
      }
      reihenfolge.push(beste)
      gewaehlt.add(beste)
    }
    const platz = new Array(k)
    reihenfolge.forEach((c, i) => (platz[c] = i))
    // Hinweise der Stufe, auf der sie vollständig bekannt sind
    const stufen = Array.from({ length: k }, () => [])
    hinweise.forEach((h, i) => stufen[Math.max(...hinweisKats[i].map((c) => platz[c]))].push(h))

    const pos = new Array(k)
    let anzahl = 0
    let erste = null
    let knoten = 0
    let abgebrochen = false
    function suche(i) {
      if (anzahl >= grenze || abgebrochen) return
      if (i === k) {
        anzahl++
        if (!erste) erste = pos.map((p) => p.slice())
        return
      }
      const c = reihenfolge[i]
      for (const p of perms) {
        if (++knoten > budget) {
          abgebrochen = true
          return
        }
        pos[c] = p
        let ok = true
        for (const h of stufen[i]) {
          if (!stimmt(h, pos)) {
            ok = false
            break
          }
        }
        if (ok) suche(i + 1)
        if (anzahl >= grenze || abgebrochen) return
      }
      pos[c] = null
    }
    suche(0)
    if (abgebrochen && anzahl < grenze) return { anzahl: -1, loesung: null }
    return { anzahl, loesung: erste }
  }
  zaehlen.cache = {}

  function mischen(feld, zufall) {
    for (let i = feld.length - 1; i > 0; i--) {
      const j = Math.floor(zufall() * (i + 1))
      ;[feld[i], feld[j]] = [feld[j], feld[i]]
    }
    return feld
  }

  /** Alle Hinweise, die für die Lösung wahr sind (nach Art gruppiert). */
  function moegliche(n, k, loesung) {
    const gruppen = { gleich: [], nicht: [], neben: [], links: [], weiterLinks: [], an: [] }
    for (let c1 = 0; c1 < k; c1++) {
      for (let w1 = 0; w1 < n; w1++) {
        gruppen.an.push({ art: 'an', a: [c1, w1], b: null, p: loesung[c1][w1] })
        for (let c2 = 0; c2 < k; c2++) {
          if (c1 === c2) continue
          for (let w2 = 0; w2 < n; w2++) {
            const a = loesung[c1][w1]
            const b = loesung[c2][w2]
            const h = (art) => ({ art, a: [c1, w1], b: [c2, w2] })
            if (a === b && c1 < c2) gruppen.gleich.push(h('gleich'))
            if (a !== b && c1 < c2) gruppen.nicht.push(h('nicht'))
            if (Math.abs(a - b) === 1 && c1 < c2) gruppen.neben.push(h('neben'))
            if (a + 1 === b) gruppen.links.push(h('links'))
            if (a < b) gruppen.weiterLinks.push(h('weiterLinks'))
          }
        }
      }
    }
    return gruppen
  }

  const GEWICHT = { gleich: 6, nicht: 2, neben: 3, links: 2, weiterLinks: 2, an: 1 }

  /**
   * Neues Rätsel mit genau einer Lösung.
   *   n, k: Häuser und Kategorien
   *   zufall: optional (Standard Math.random)
   * Liefert { n, k, loesung, hinweise } oder null.
   */
  function erzeugen(n, k, zufall) {
    zufall = zufall || Math.random
    const perms = permutationen(n)
    for (let versuch = 0; versuch < 20; versuch++) {
      const loesung = Array.from({ length: k }, () => perms[Math.floor(zufall() * perms.length)].slice())
      const gruppen = moegliche(n, k, loesung)
      Object.keys(gruppen).forEach((a) => mischen(gruppen[a], zufall))
      // gewichtete Reihenfolge der Hinweise
      const topf = []
      Object.keys(gruppen).forEach((art) => gruppen[art].forEach((h) => topf.push([h, zufall() ** (1 / GEWICHT[art])])))
      topf.sort((x, y) => y[1] - x[1])
      const kandidaten = topf.map((x) => x[0])

      const hinweise = []
      let i = 0
      const schritt = Math.max(2, Math.round((n * k) / 3))
      let eindeutig = false
      while (i < kandidaten.length && !eindeutig) {
        for (let j = 0; j < schritt && i < kandidaten.length; j++) hinweise.push(kandidaten[i++])
        if (hinweise.length < n * (k - 1) / 2) continue
        const r = zaehlen(n, k, hinweise, 2, 400000)
        if (r.anzahl === 1) eindeutig = true
      }
      if (!eindeutig) continue
      // Überflüssiges streichen
      mischen(hinweise, zufall)
      for (let j = hinweise.length - 1; j >= 0; j--) {
        const ohne = hinweise.slice(0, j).concat(hinweise.slice(j + 1))
        if (zaehlen(n, k, ohne, 2, 400000).anzahl === 1) hinweise.splice(j, 1)
      }
      return { n, k, loesung, hinweise }
    }
    return null
  }

  const api = { erzeugen, zaehlen, stimmt, permutationen }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.Einstein = api
})()
