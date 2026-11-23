/*
 * Hilfen für die Regeln der Gruppenspiele (Browser: window.GruppenHilfe, Node: module.exports).
 * Der Zufall steckt im Zustand (z.saat), damit die Regeln reine Funktionen bleiben: Wer denselben Zustand
 * und dieselbe Aktion hat, bekommt dasselbe Ergebnis.
 */
;(function () {
  'use strict'

  const kopie = (x) => JSON.parse(JSON.stringify(x))

  /** Zahl in [0, 1) – schreibt die neue Saat in z.saat (mulberry32). */
  function zufall(z) {
    let t = (z.saat = (z.saat + 0x6d2b79f5) >>> 0)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const ganz = (z, n) => Math.floor(zufall(z) * n)
  function mische(z, a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = ganz(z, i + 1)
      const t = a[i]
      a[i] = a[j]
      a[j] = t
    }
    return a
  }
  const neueSaat = () => Math.floor(Math.random() * 4294967296) >>> 0

  /** Meldung ins Spielprotokoll (höchstens 30 Einträge). */
  function melde(z, text) {
    z.log = (z.log || []).concat(text).slice(-30)
  }
  const name = (z, i) => (z.spieler && z.spieler[i] ? z.spieler[i].name : 'Spieler ' + (i + 1))

  /** Spielende nach Punkten: höchste Punktzahl gewinnt (bei Gleichstand alle mit dieser Zahl). */
  function endeNachPunkten(z, punkte, einheit) {
    const best = Math.max(...punkte)
    const sieger = punkte.map((p, i) => (p === best ? i : -1)).filter((i) => i >= 0)
    const namen = sieger.map((i) => name(z, i)).join(' und ')
    z.ende = { sieger, text: namen + (sieger.length > 1 ? ' gewinnen' : ' gewinnt') + ' mit ' + best + ' ' + (einheit || 'Punkten') + '.' }
    melde(z, z.ende.text)
  }

  const api = { kopie, zufall, ganz, mische, neueSaat, melde, name, endeNachPunkten }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.GruppenHilfe = api
})()
