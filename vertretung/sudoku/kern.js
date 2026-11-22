/*
 * Sudoku – Rechenkern: Löser (zählt Lösungen) und Erzeuger. Browser: window.Sudoku, Node: module.exports.
 * Ein Feld ist eine Zahl 0…9 (0 = leer), das Gitter hat 81 Felder (Zeile für Zeile).
 */
;(function () {
  'use strict'

  const ZEILE = (i) => Math.floor(i / 9)
  const SPALTE = (i) => i % 9
  const KASTEN = (i) => Math.floor(ZEILE(i) / 3) * 3 + Math.floor(SPALTE(i) / 3)

  const NACHBARN = Array.from({ length: 81 }, (_, i) => {
    const n = []
    for (let j = 0; j < 81; j++) if (j !== i && (ZEILE(j) === ZEILE(i) || SPALTE(j) === SPALTE(i) || KASTEN(j) === KASTEN(i))) n.push(j)
    return n
  })

  function mischen(feld, zufall) {
    for (let i = feld.length - 1; i > 0; i--) {
      const j = Math.floor(zufall() * (i + 1))
      ;[feld[i], feld[j]] = [feld[j], feld[i]]
    }
    return feld
  }

  /** Zählt Lösungen (höchstens `grenze`); liefert { anzahl, loesung }. Ziffern werden zufällig probiert, wenn `zufall` gegeben ist. */
  function loesen(gitter, grenze, zufall) {
    const g = gitter.slice()
    let anzahl = 0
    let erste = null
    function moegliche(i) {
      let maske = 0
      for (const n of NACHBARN[i]) if (g[n]) maske |= 1 << g[n]
      return maske
    }
    function suche() {
      if (anzahl >= grenze) return
      // leeres Feld mit den wenigsten Möglichkeiten
      let beste = -1
      let bestMaske = 0
      let bestZahl = 10
      for (let i = 0; i < 81; i++) {
        if (g[i]) continue
        const maske = moegliche(i)
        let frei = 0
        for (let z = 1; z <= 9; z++) if (!(maske & (1 << z))) frei++
        if (frei < bestZahl) {
          bestZahl = frei
          beste = i
          bestMaske = maske
          if (frei <= 1) break
        }
      }
      if (beste < 0) {
        anzahl++
        if (!erste) erste = g.slice()
        return
      }
      if (bestZahl === 0) return
      const ziffern = []
      for (let z = 1; z <= 9; z++) if (!(bestMaske & (1 << z))) ziffern.push(z)
      if (zufall) mischen(ziffern, zufall)
      for (const z of ziffern) {
        g[beste] = z
        suche()
        if (anzahl >= grenze) break
      }
      g[beste] = 0
    }
    suche()
    return { anzahl, loesung: erste }
  }

  /** Stufen: so viele Zahlen bleiben mindestens stehen. */
  const STUFEN = { leicht: 40, mittel: 32, schwer: 26 }

  /** Neues Rätsel mit genau einer Lösung: { rätsel, loesung }. */
  function erzeugen(stufe, zufall) {
    zufall = zufall || Math.random
    const voll = loesen(new Array(81).fill(0), 1, zufall).loesung
    const raetsel = voll.slice()
    const ziel = STUFEN[stufe] || STUFEN.mittel
    let uebrig = 81
    for (const i of mischen([...Array(81).keys()], zufall)) {
      if (uebrig <= ziel) break
      const alt = raetsel[i]
      raetsel[i] = 0
      if (loesen(raetsel, 2).anzahl === 1) uebrig--
      else raetsel[i] = alt
    }
    return { raetsel, loesung: voll }
  }

  const api = { NACHBARN, ZEILE, SPALTE, KASTEN, loesen, erzeugen }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.Sudoku = api
})()
