/*
 * Vier gewinnt – Regeln und Rechner. Reine Funktionen ohne Oberfläche (Browser: window.VierGewinnt, Node: module.exports).
 * Zustand: { brett: 42 Felder (0 leer, 1, 2; Zeile 0 oben, 7 Spalten), amZug: 1 | 2, ende: null | { sieger: 0 | 1 | 2, linie: [Felder] } }
 * Zug: die Nummer der Spalte 0…6.
 */
;(function () {
  'use strict'
  const B = 7
  const H = 6

  function neu() {
    return { brett: new Array(B * H).fill(0), amZug: 1, ende: null }
  }

  function zuege(s) {
    if (s.ende) return []
    const l = []
    for (let c = 0; c < B; c++) if (s.brett[c] === 0) l.push(c)
    return l
  }

  const RICHTUNGEN = [[0, 1], [1, 0], [1, 1], [1, -1]]
  function gewinnLinie(brett, z, c) {
    const wer = brett[z * B + c]
    for (const [dz, dc] of RICHTUNGEN) {
      const linie = [z * B + c]
      for (const vorz of [1, -1]) {
        let zz = z + dz * vorz
        let cc = c + dc * vorz
        while (zz >= 0 && zz < H && cc >= 0 && cc < B && brett[zz * B + cc] === wer) {
          linie.push(zz * B + cc)
          zz += dz * vorz
          cc += dc * vorz
        }
      }
      if (linie.length >= 4) return linie
    }
    return null
  }

  /** Neuer Zustand nach dem Einwurf in Spalte c (oder null, wenn nicht erlaubt). */
  function ziehe(s, c) {
    if (s.ende || c < 0 || c >= B || s.brett[c] !== 0) return null
    let z = H - 1
    while (s.brett[z * B + c] !== 0) z--
    const brett = s.brett.slice()
    brett[z * B + c] = s.amZug
    const linie = gewinnLinie(brett, z, c)
    let ende = null
    if (linie) ende = { sieger: s.amZug, linie }
    else if (brett.every((x) => x)) ende = { sieger: 0, linie: [] }
    return { brett, amZug: 3 - s.amZug, ende, letzter: z * B + c }
  }

  // ---------- Rechner ----------
  function bewerten(brett, ich) {
    let punkte = 0
    // Mitte ist wertvoll
    for (let z = 0; z < H; z++) if (brett[z * B + 3] === ich) punkte += 3
    else if (brett[z * B + 3] === 3 - ich) punkte -= 3
    const fenster = (z, c, dz, dc) => {
      let a = 0
      let b = 0
      for (let i = 0; i < 4; i++) {
        const v = brett[(z + dz * i) * B + c + dc * i]
        if (v === ich) a++
        else if (v) b++
      }
      if (a && b) return 0
      const tab = [0, 1, 5, 50, 0]
      return a ? tab[a] : -tab[b] * 1.1
    }
    for (let z = 0; z < H; z++) for (let c = 0; c < B - 3; c++) punkte += fenster(z, c, 0, 1)
    for (let z = 0; z < H - 3; z++) for (let c = 0; c < B; c++) punkte += fenster(z, c, 1, 0)
    for (let z = 0; z < H - 3; z++) for (let c = 0; c < B - 3; c++) punkte += fenster(z, c, 1, 1)
    for (let z = 0; z < H - 3; z++) for (let c = 3; c < B; c++) punkte += fenster(z, c, 1, -1)
    return punkte
  }

  const REIHE = [3, 2, 4, 1, 5, 0, 6]
  function negamax(s, tiefe, alpha, beta, ich) {
    if (s.ende) return s.ende.sieger === 0 ? 0 : s.ende.sieger === s.amZug ? 100000 + tiefe : -(100000 + tiefe)
    if (tiefe === 0) return s.amZug === ich ? bewerten(s.brett, ich) : -bewerten(s.brett, ich)
    let beste = -Infinity
    for (const c of REIHE) {
      if (s.brett[c] !== 0) continue
      const w = -negamax(ziehe(s, c), tiefe - 1, -beta, -alpha, ich)
      if (w > beste) beste = w
      if (beste > alpha) alpha = beste
      if (alpha >= beta) break
    }
    return beste
  }

  /** Wählt einen Zug. stufe: 1 leicht, 2 mittel, 3 schwer. */
  function rechnerZug(s, stufe) {
    const frei = zuege(s)
    if (!frei.length) return null
    const tiefe = [0, 2, 4, 6][stufe] || 4
    // Leicht: manchmal zufällig, sieht aber unmittelbare Gewinne
    for (const c of frei) if (ziehe(s, c).ende?.sieger === s.amZug) return c
    if (stufe === 1 && Math.random() < 0.35) return frei[Math.floor(Math.random() * frei.length)]
    let bester = []
    let wert = -Infinity
    for (const c of REIHE) {
      if (s.brett[c] !== 0) continue
      const w = -negamax(ziehe(s, c), tiefe - 1, -Infinity, Infinity, s.amZug)
      if (w > wert) {
        wert = w
        bester = [c]
      } else if (w === wert) bester.push(c)
    }
    return bester[Math.floor(Math.random() * bester.length)]
  }

  const api = { B, H, neu, zuege, ziehe, rechnerZug }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.VierGewinnt = api
})()
