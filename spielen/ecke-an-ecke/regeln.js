/*
 * Ecke an Ecke – Legespiel mit je 21 Steinen aus 1 bis 5 Quadraten (Browser: window.EckeAnEcke, Node: module.exports).
 * Zu zweit 14 × 14 Felder, zu dritt und viert 20 × 20. Der erste Stein bedeckt das Startfeld, jeder weitere berührt
 * einen eigenen Stein nur an einer Ecke, nie an einer Kante. Wer nicht mehr legen kann, scheidet aus.
 * Zustand: { spieler, dran, n (Kantenlänge), brett: n·n Felder (-1 leer, sonst Sitz), uebrig: [[21 × true/false]], raus: [true/false], ende, log }
 * Aktion:  { t: 'lege', s: Stein 0–20, o: Lage (Index in FORMEN[s]), x, y }  – die Felder der Lage werden um (x, y) verschoben
 */
;(function () {
  'use strict'
  const H = typeof module !== 'undefined' && module.exports ? require('../gruppe-hilfe.js') : window.GruppenHilfe

  const STEINE = [
    [[0, 0]],
    [[0, 0], [1, 0]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 0], [1, 0], [0, 1]],
    [[0, 0], [1, 0], [2, 0], [3, 0]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [2, 0], [1, 1]],
    [[0, 0], [0, 1], [0, 2], [1, 2]],
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]],
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
    [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]],
    [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3]],
    [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]],
    [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
    [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2], [1, 3]],
    [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]],
  ]

  // Alle Lagen (gedreht und gespiegelt), ohne doppelte; jede Lage beginnt bei (0, 0) oben links
  function lagen(stein) {
    const gesehen = new Set()
    const l = []
    for (let spiegel = 0; spiegel < 2; spiegel++) {
      let p = stein.map(([x, y]) => (spiegel ? [-x, y] : [x, y]))
      for (let d = 0; d < 4; d++) {
        p = p.map(([x, y]) => [-y, x])
        const mx = Math.min(...p.map((q) => q[0]))
        const my = Math.min(...p.map((q) => q[1]))
        const n = p.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0])
        const k = JSON.stringify(n)
        if (!gesehen.has(k)) {
          gesehen.add(k)
          l.push(n)
        }
      }
    }
    return l
  }
  const FORMEN = STEINE.map(lagen)
  // Drehen und Spiegeln einer Lage (für die Knöpfe der Oberfläche): Index der neuen Lage
  function wandle(s, o, art) {
    const p = FORMEN[s][o].map(([x, y]) => (art === 'dreh' ? [-y, x] : [-x, y]))
    const mx = Math.min(...p.map((q) => q[0]))
    const my = Math.min(...p.map((q) => q[1]))
    const k = JSON.stringify(p.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]))
    return FORMEN[s].findIndex((f) => JSON.stringify(f) === k)
  }

  function startfeld(z, sitz) {
    const n = z.n
    if (n === 14) return sitz === 0 ? [4, 4] : [9, 9]
    return [[0, 0], [n - 1, 0], [n - 1, n - 1], [0, n - 1]][sitz]
  }
  const erster = (z, sitz) => z.uebrig[sitz].every(Boolean)

  function gueltig(z, sitz, s, o, x, y) {
    const form = FORMEN[s] && FORMEN[s][o]
    if (!form || !z.uebrig[sitz][s]) return false
    const n = z.n
    let ecke = false
    const [sx, sy] = startfeld(z, sitz)
    const anfang = erster(z, sitz)
    for (const [fx, fy] of form) {
      const cx = fx + x
      const cy = fy + y
      if (cx < 0 || cy < 0 || cx >= n || cy >= n || z.brett[cy * n + cx] !== -1) return false
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx
        const ny = cy + dy
        if (nx >= 0 && ny >= 0 && nx < n && ny < n && z.brett[ny * n + nx] === sitz) return false
      }
      if (anfang) {
        if (cx === sx && cy === sy) ecke = true
      } else if (!ecke) {
        for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          const nx = cx + dx
          const ny = cy + dy
          if (nx >= 0 && ny >= 0 && nx < n && ny < n && z.brett[ny * n + nx] === sitz) ecke = true
        }
      }
    }
    return ecke
  }

  /** Freie Felder, an denen ein neuer Stein ansetzen kann (Ecke an eigenem Stein, keine eigene Kante). */
  function ansatzpunkte(z, sitz) {
    if (erster(z, sitz)) return [startfeld(z, sitz)]
    const n = z.n
    const l = []
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        if (z.brett[y * n + x] !== -1) continue
        let kante = false
        let ecke = false
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && ny >= 0 && nx < n && ny < n && z.brett[ny * n + nx] === sitz) kante = true
        }
        if (kante) continue
        for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && ny >= 0 && nx < n && ny < n && z.brett[ny * n + nx] === sitz) ecke = true
        }
        if (ecke) l.push([x, y])
      }
    return l
  }

  /** Alle erlaubten Züge (oder nur den ersten, wenn nurEiner). */
  function zuege(z, sitz, nurEiner) {
    const punkte = ansatzpunkte(z, sitz)
    const l = []
    const gesehen = new Set()
    for (let s = STEINE.length - 1; s >= 0; s--) {
      if (!z.uebrig[sitz][s]) continue
      FORMEN[s].forEach((form, o) => {
        for (const [px, py] of punkte)
          for (const [fx, fy] of form) {
            const x = px - fx
            const y = py - fy
            const k = s + ':' + o + ':' + x + ':' + y
            if (gesehen.has(k)) continue
            gesehen.add(k)
            if (gueltig(z, sitz, s, o, x, y)) {
              l.push({ t: 'lege', s, o, x, y })
              if (nurEiner) return
            }
          }
      })
      if (nurEiner && l.length) return l
    }
    return l
  }

  const gelegt = (z, i) => z.uebrig[i].reduce((a, u, s) => a + (u ? 0 : STEINE[s].length), 0) + (z.uebrig[i].every((u) => !u) ? 15 : 0)

  function weiter(z) {
    for (let k = 0; k < z.spieler.length; k++) {
      z.dran = (z.dran + 1) % z.spieler.length
      if (z.raus[z.dran]) continue
      if (z.uebrig[z.dran].some(Boolean) && zuege(z, z.dran, true).length) return
      z.raus[z.dran] = true
      H.melde(z, H.name(z, z.dran) + (z.uebrig[z.dran].some(Boolean) ? ' kann nicht mehr legen.' : ' hat alle Steine gelegt!'))
    }
    H.endeNachPunkten(z, z.spieler.map((_, i) => gelegt(z, i)), 'Feldern')
  }

  function neu(spieler, optionen, saat) {
    const n = spieler.length === 2 ? 14 : 20
    return {
      spieler,
      optionen: optionen || {},
      saat: saat >>> 0,
      dran: 0,
      n,
      brett: new Array(n * n).fill(-1),
      uebrig: spieler.map(() => STEINE.map(() => true)),
      raus: spieler.map(() => false),
      ende: null,
      log: [],
    }
  }

  function anwenden(z0, sitz, a) {
    if (!a || a.t !== 'lege' || z0.ende || sitz !== z0.dran) return null
    if (![a.s, a.o, a.x, a.y].every(Number.isInteger) || !gueltig(z0, sitz, a.s, a.o, a.x, a.y)) return null
    const z = H.kopie(z0)
    FORMEN[a.s][a.o].forEach(([fx, fy]) => (z.brett[(fy + a.y) * z.n + fx + a.x] = sitz))
    z.uebrig[sitz][a.s] = false
    H.melde(z, H.name(z, sitz) + ' legt einen Stein mit ' + STEINE[a.s].length + (STEINE[a.s].length === 1 ? ' Feld.' : ' Feldern.'))
    weiter(z)
    return z
  }

  // ---------- Computer: große Steine zuerst, viele neue Ansatzpunkte, Richtung Mitte ----------
  function ki(z, sitz) {
    const l = zuege(z, sitz)
    const n = z.n
    const mitte = (n - 1) / 2
    let best = l[0]
    let bw = -Infinity
    const frueh = z.uebrig[sitz].filter(Boolean).length > 14
    for (const a of l) {
      const form = FORMEN[a.s][a.o]
      let w = form.length * 12
      let nah = 0
      const eigene = new Set(form.map(([fx, fy]) => (fy + a.y) * n + fx + a.x))
      let neueEcken = 0
      let block = 0
      for (const [fx, fy] of form) {
        const cx = fx + a.x
        const cy = fy + a.y
        nah += Math.abs(cx - mitte) + Math.abs(cy - mitte)
        for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          const nx = cx + dx
          const ny = cy + dy
          if (nx >= 0 && ny >= 0 && nx < n && ny < n && z.brett[ny * n + nx] === -1 && !eigene.has(ny * n + nx)) neueEcken++
        }
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx
          const ny = cy + dy
          const f = nx >= 0 && ny >= 0 && nx < n && ny < n ? z.brett[ny * n + nx] : -1
          if (f !== -1 && f !== sitz) block++
        }
      }
      w += neueEcken * 1.5 + block * 2 - (frueh ? nah / form.length : 0) * 1.5 + H.zufall({ saat: (a.x * 31 + a.y * 17 + a.s * 7 + z.saat) >>> 0 }) * 3
      if (w > bw) {
        bw = w
        best = a
      }
    }
    return best
  }

  const punkte = (z, i) => gelegt(z, i) + (z.raus[i] && !z.ende ? ' (fertig)' : '')

  const api = { id: 'ecke-an-ecke', name: 'Ecke an Ecke', min: 2, max: 4, standard: 4, STEINE, FORMEN, wandle, startfeld, gueltig, ansatzpunkte, zuege, gelegt, neu, anwenden, ki, punkte }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.EckeAnEcke = api
})()
