/*
 * Kachelland – Landschaft aus Plättchen legen, Figuren auf Wege, Städte und Kapellen setzen (Browser: window.Kachelland, Node: module.exports).
 * Kanten eines Plättchens: 0 oben, 1 rechts, 2 unten, 3 links. Teile: Städte (Gruppen von Kanten), Wege (Gruppen von Kanten), Kapelle (Mitte).
 * Zustand: { spieler, dran, brett: { 'x,y': { t: Art, r: Drehung 0–3 } }, stapel: [Arten], kachel: Art | null, phase: 'legen' | 'figur',
 *            letzte: { x, y }, figuren: [{ x, y, teil, s }], punkte, vorrat, ende, log, saat }
 * Aktionen: { t: 'lege', x, y, r }, { t: 'figur', teil: Index | -1 (keine) }
 */
;(function () {
  'use strict'
  const H = typeof module !== 'undefined' && module.exports ? require('../gruppe-hilfe.js') : window.GruppenHilfe

  // Art: { stadt: [[Kanten]], weg: [[Kanten]], kapelle, anzahl }
  const ARTEN = {
    A: { kapelle: true, weg: [[2]], anzahl: 2 },
    B: { kapelle: true, anzahl: 3 },
    C: { stadt: [[0, 1, 2, 3]], anzahl: 1 },
    D: { stadt: [[0]], weg: [[1, 3]], anzahl: 3 },
    E: { stadt: [[0]], anzahl: 5 },
    F: { stadt: [[1, 3]], anzahl: 2 },
    G: { stadt: [[0], [2]], anzahl: 2 },
    H: { stadt: [[0], [1]], anzahl: 2 },
    I: { stadt: [[0, 1]], anzahl: 3 },
    J: { stadt: [[0, 1]], weg: [[2, 3]], anzahl: 3 },
    K: { stadt: [[0]], weg: [[1, 2]], anzahl: 3 },
    L: { stadt: [[0]], weg: [[2, 3]], anzahl: 3 },
    M: { stadt: [[0]], weg: [[1], [2], [3]], anzahl: 3 },
    N: { stadt: [[0, 1, 3]], anzahl: 3 },
    O: { stadt: [[0, 1, 3]], weg: [[2]], anzahl: 2 },
    P: { weg: [[0, 2]], anzahl: 8 },
    Q: { weg: [[2, 3]], anzahl: 9 },
    R: { weg: [[1], [2], [3]], anzahl: 4 },
    S: { weg: [[0], [1], [2], [3]], anzahl: 1 },
  }
  const FIGUREN = 7
  const RICHTUNG = [[0, -1], [1, 0], [0, 1], [-1, 0]]
  const schl = (x, y) => x + ',' + y

  /** Teile einer gedrehten Art: [{ art: 'stadt' | 'weg' | 'kapelle', kanten }] (immer in derselben Reihenfolge). */
  const teileCache = {}
  function teile(t, r) {
    const k = t + r
    if (teileCache[k]) return teileCache[k]
    const a = ARTEN[t]
    const l = []
    ;(a.stadt || []).forEach((g) => l.push({ art: 'stadt', kanten: g.map((e) => (e + r) % 4) }))
    ;(a.weg || []).forEach((g) => l.push({ art: 'weg', kanten: g.map((e) => (e + r) % 4) }))
    if (a.kapelle) l.push({ art: 'kapelle', kanten: [] })
    return (teileCache[k] = l)
  }
  function kante(t, r, e) {
    for (const p of teile(t, r)) if (p.kanten.includes(e)) return p.art === 'stadt' ? 'b' : 's'
    return 'w'
  }

  function passt(z, t, x, y, r) {
    if (z.brett[schl(x, y)]) return false
    let nachbar = false
    for (let e = 0; e < 4; e++) {
      const n = z.brett[schl(x + RICHTUNG[e][0], y + RICHTUNG[e][1])]
      if (!n) continue
      nachbar = true
      if (kante(n.t, n.r, (e + 2) % 4) !== kante(t, r, e)) return false
    }
    return nachbar
  }
  function plaetze(z, t) {
    const frei = new Set()
    Object.keys(z.brett).forEach((k) => {
      const [x, y] = k.split(',').map(Number)
      RICHTUNG.forEach(([dx, dy]) => !z.brett[schl(x + dx, y + dy)] && frei.add(schl(x + dx, y + dy)))
    })
    const l = []
    frei.forEach((k) => {
      const [x, y] = k.split(',').map(Number)
      for (let r = 0; r < 4; r++) if (passt(z, t, x, y, r)) l.push({ x, y, r })
    })
    return l
  }

  /** Zusammenhängendes Gebiet (Stadt oder Weg) ab einem Teil: Plättchen, Figuren, fertig? */
  function gebiet(z, x, y, ti) {
    const start = z.brett[schl(x, y)]
    const art = teile(start.t, start.r)[ti].art
    if (art === 'kapelle') {
      let n = 0
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (z.brett[schl(x + dx, y + dy)]) n++
      return { art, kacheln: n, fertig: n === 9, figuren: z.figuren.filter((f) => f.x === x && f.y === y && f.teil === ti), teile: [[x, y, ti]] }
    }
    const gesehen = new Set([schl(x, y) + ':' + ti])
    const kacheln = new Set([schl(x, y)])
    const offen = [[x, y, ti]]
    const alle = [[x, y, ti]]
    let fertig = true
    while (offen.length) {
      const [cx, cy, ci] = offen.pop()
      const k = z.brett[schl(cx, cy)]
      for (const e of teile(k.t, k.r)[ci].kanten) {
        const nx = cx + RICHTUNG[e][0]
        const ny = cy + RICHTUNG[e][1]
        const n = z.brett[schl(nx, ny)]
        if (!n) {
          fertig = false
          continue
        }
        const ni = teile(n.t, n.r).findIndex((p) => p.art === art && p.kanten.includes((e + 2) % 4))
        const id = schl(nx, ny) + ':' + ni
        if (ni < 0 || gesehen.has(id)) continue
        gesehen.add(id)
        kacheln.add(schl(nx, ny))
        offen.push([nx, ny, ni])
        alle.push([nx, ny, ni])
      }
    }
    const figuren = z.figuren.filter((f) => gesehen.has(schl(f.x, f.y) + ':' + f.teil))
    return { art, kacheln: kacheln.size, fertig, figuren, teile: alle }
  }
  function wert(g, amEnde) {
    if (g.art === 'kapelle') return g.kacheln
    if (g.art === 'stadt') return g.kacheln * (g.fertig && !amEnde ? 2 : 1)
    return g.kacheln
  }
  function mehrheit(figuren) {
    const n = {}
    figuren.forEach((f) => (n[f.s] = (n[f.s] || 0) + 1))
    const max = Math.max(0, ...Object.values(n))
    return Object.keys(n).filter((s) => n[s] === max).map(Number)
  }

  function werte(z, g, amEnde) {
    if (!g.figuren.length) return
    const p = wert(g, amEnde)
    const wer = mehrheit(g.figuren)
    wer.forEach((s) => (z.punkte[s] += p))
    const name = g.art === 'stadt' ? 'Stadt' : g.art === 'weg' ? 'Weg' : 'Kapelle'
    H.melde(z, (amEnde ? 'Am Ende: ' : '') + name + ' ' + (g.fertig ? 'fertig' : 'unfertig') + ' – ' + wer.map((s) => H.name(z, s)).join(' und ') + ' +' + p)
    // Figuren zurück
    const weg = new Set(g.figuren)
    z.figuren = z.figuren.filter((f) => !weg.has(f))
    g.figuren.forEach((f) => z.vorrat[f.s]++)
  }

  function ziehe(z) {
    while (z.stapel.length) {
      const t = z.stapel.pop()
      if (plaetze(z, t).length) {
        z.kachel = t
        return
      }
      H.melde(z, 'Ein Plättchen passt nirgends und wird beiseitegelegt.')
    }
    z.kachel = null
  }

  function neu(spieler, optionen, saat) {
    const z = { spieler, optionen: optionen || {}, saat: saat >>> 0, dran: 0, brett: { '0,0': { t: 'D', r: 0 } }, stapel: [], kachel: null, phase: 'legen', letzte: { x: 0, y: 0 }, figuren: [], punkte: spieler.map(() => 0), vorrat: spieler.map(() => FIGUREN), ende: null, log: [] }
    const s = []
    Object.keys(ARTEN).forEach((t) => {
      for (let i = 0; i < ARTEN[t].anzahl; i++) s.push(t)
    })
    z.stapel = H.mische(z, s)
    ziehe(z)
    return z
  }

  function figurErlaubt(z, sitz, teil) {
    const { x, y } = z.letzte
    const k = z.brett[schl(x, y)]
    if (!Number.isInteger(teil) || teil < 0 || teil >= teile(k.t, k.r).length || z.vorrat[sitz] < 1) return false
    return !gebiet(z, x, y, teil).figuren.length
  }

  function abschluss(z, sitz) {
    // Gebiete werten, die das neue Plättchen fertig gemacht hat
    const { x, y } = z.letzte
    const k = z.brett[schl(x, y)]
    const gewertet = new Set()
    teile(k.t, k.r).forEach((p, ti) => {
      if (p.art === 'kapelle') return
      const g = gebiet(z, x, y, ti)
      const id = g.teile.map((q) => q.join(':')).sort()[0]
      if (g.fertig && !gewertet.has(id)) {
        gewertet.add(id)
        werte(z, g, false)
      }
    })
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const n = z.brett[schl(x + dx, y + dy)]
        if (!n) continue
        const ki = teile(n.t, n.r).findIndex((p) => p.art === 'kapelle')
        if (ki < 0) continue
        const g = gebiet(z, x + dx, y + dy, ki)
        if (g.fertig) werte(z, g, false)
      }
    z.dran = (z.dran + 1) % z.spieler.length
    z.phase = 'legen'
    ziehe(z)
    if (!z.kachel) endabrechnung(z)
  }

  function endabrechnung(z) {
    const gewertet = new Set()
    z.figuren.slice().forEach((f) => {
      if (!z.figuren.includes(f)) return
      const g = gebiet(z, f.x, f.y, f.teil)
      const id = g.teile.map((q) => q.join(':')).sort()[0]
      if (gewertet.has(id)) return
      gewertet.add(id)
      werte(z, g, true)
    })
    H.endeNachPunkten(z, z.punkte.slice())
  }

  function anwenden(z0, sitz, a) {
    if (!a || z0.ende || sitz !== z0.dran) return null
    if (a.t === 'lege') {
      if (z0.phase !== 'legen' || !z0.kachel || ![a.x, a.y, a.r].every(Number.isInteger) || a.r < 0 || a.r > 3) return null
      if (!passt(z0, z0.kachel, a.x, a.y, a.r)) return null
      const z = H.kopie(z0)
      z.brett[schl(a.x, a.y)] = { t: z.kachel, r: a.r }
      z.letzte = { x: a.x, y: a.y }
      z.kachel = null
      // Figur möglich?
      const k = z.brett[schl(a.x, a.y)]
      const moeglich = z.vorrat[sitz] > 0 && teile(k.t, k.r).some((_, ti) => figurErlaubt(z, sitz, ti))
      if (moeglich) z.phase = 'figur'
      else abschluss(z, sitz)
      return z
    }
    if (a.t === 'figur') {
      if (z0.phase !== 'figur') return null
      if (a.teil !== -1 && !figurErlaubt(z0, sitz, a.teil)) return null
      const z = H.kopie(z0)
      if (a.teil >= 0) {
        z.figuren.push({ x: z.letzte.x, y: z.letzte.y, teil: a.teil, s: sitz })
        z.vorrat[sitz]--
      }
      abschluss(z, sitz)
      return z
    }
    return null
  }

  // ---------- Computer ----------
  function bewerteLage(z, sitz, x, y, r) {
    const p = H.kopie({ brett: z.brett, figuren: z.figuren })
    p.brett[schl(x, y)] = { t: z.kachel, r }
    let w = 0
    const ts = teile(z.kachel, r)
    let besteFigur = { teil: -1, w: 0 }
    ts.forEach((teil, ti) => {
      const g = gebiet(p, x, y, ti)
      const meine = g.figuren.filter((f) => f.s === sitz).length
      const fremde = mehrheit(g.figuren).filter((s) => s !== sitz).length
      if (g.figuren.length) {
        const gut = mehrheit(g.figuren).includes(sitz)
        const zuwachs = teil.art === 'stadt' ? 2 : 1
        w += (gut ? 1 : -0.6) * zuwachs * (g.fertig ? 2 : 1)
        if (g.fertig && gut) w += wert(g) * 0.5
        if (g.fertig && fremde && !gut) w -= wert(g) * 0.3
      } else if (z.vorrat[sitz] > 0 && !meine) {
        let f = teil.art === 'stadt' ? g.kacheln * (g.fertig ? 2 : 1.4) + 1 : teil.art === 'weg' ? g.kacheln * (g.fertig ? 1 : 0.8) : g.kacheln * 0.9 + 1.5
        if (g.fertig) f += 2 // Figur kommt gleich zurück
        if (z.vorrat[sitz] <= 2 && !g.fertig) f -= 2
        if (f > besteFigur.w) besteFigur = { teil: ti, w: f }
      }
    })
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue
        const n = p.brett[schl(x + dx, y + dy)]
        if (!n) continue
        const ki = teile(n.t, n.r).findIndex((q) => q.art === 'kapelle')
        if (ki < 0) continue
        const f = p.figuren.find((q) => q.x === x + dx && q.y === y + dy && q.teil === ki)
        if (f) w += f.s === sitz ? 1 : -0.5
      }
    return { w: w + Math.max(0, besteFigur.w - 2.5), figur: besteFigur.w > 2.5 ? besteFigur.teil : -1 }
  }
  function ki(z, sitz) {
    if (z.phase === 'legen') {
      let best = null
      let bw = -Infinity
      plaetze(z, z.kachel).forEach((q) => {
        const b = bewerteLage(z, sitz, q.x, q.y, q.r)
        const w = b.w + H.zufall({ saat: (q.x * 131 + q.y * 17 + q.r + z.saat) >>> 0 }) * 0.3
        if (w > bw) {
          bw = w
          best = q
        }
      })
      return { t: 'lege', x: best.x, y: best.y, r: best.r }
    }
    // Figur: dieselbe Bewertung wie beim Legen
    const k = z.brett[schl(z.letzte.x, z.letzte.y)]
    const ohne = H.kopie(z)
    delete ohne.brett[schl(z.letzte.x, z.letzte.y)]
    ohne.kachel = k.t
    const b = bewerteLage(ohne, sitz, z.letzte.x, z.letzte.y, k.r)
    return { t: 'figur', teil: b.figur >= 0 && figurErlaubt(z, sitz, b.figur) ? b.figur : -1 }
  }

  const punkte = (z, i) => z.punkte[i] + ' P · ' + z.vorrat[i] + ' F'

  const api = { id: 'kachelland', name: 'Kachelland', min: 2, max: 5, standard: 3, ARTEN, FIGUREN, RICHTUNG, teile, kante, passt, plaetze, gebiet, figurErlaubt, neu, anwenden, ki, punkte }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.Kachelland = api
})()
