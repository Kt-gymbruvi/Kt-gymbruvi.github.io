/*
 * Würfelglück – Würfelspiel mit fünf Würfeln und Punkteblock (Browser: window.Wuerfelglueck, Node: module.exports).
 * Zustand: { spieler, dran, wuerfel: [5 Zahlen 1–6], wurf: 0–3 (Würfe in diesem Zug), blatt: [je Spieler 13 Felder: Punkte oder null], runde, ende, log, saat }
 * Aktionen: { t: 'wurf', halten: [5 × true/false] }  (beim ersten Wurf werden alle geworfen)
 *           { t: 'eintragen', feld: 0–12 }
 */
;(function () {
  'use strict'
  const H = typeof module !== 'undefined' && module.exports ? require('../gruppe-hilfe.js') : window.GruppenHilfe

  const FELDER = ['Einser', 'Zweier', 'Dreier', 'Vierer', 'Fünfer', 'Sechser', 'Dreierpasch', 'Viererpasch', 'Full House', 'Kleine Straße', 'Große Straße', 'Fünfling', 'Chance']
  const BONUS_AB = 63
  const BONUS = 35

  const summe = (w) => w.reduce((a, b) => a + b, 0)
  const zaehle = (w) => {
    const c = [0, 0, 0, 0, 0, 0, 0]
    w.forEach((x) => c[x]++)
    return c
  }
  function hatFolge(w, laenge) {
    const da = new Set(w)
    for (let s = 1; s + laenge - 1 <= 6; s++) {
      let ok = true
      for (let k = s; k < s + laenge; k++) if (!da.has(k)) ok = false
      if (ok) return true
    }
    return false
  }

  /** Punkte, die diese Würfel in diesem Feld bringen. */
  function wert(w, feld) {
    const c = zaehle(w)
    const max = Math.max(...c)
    if (feld < 6) return c[feld + 1] * (feld + 1)
    switch (feld) {
      case 6: return max >= 3 ? summe(w) : 0
      case 7: return max >= 4 ? summe(w) : 0
      case 8: return (c.includes(3) && c.includes(2)) || max === 5 ? 25 : 0
      case 9: return hatFolge(w, 4) ? 30 : 0
      case 10: return hatFolge(w, 5) ? 40 : 0
      case 11: return max === 5 ? 50 : 0
      default: return summe(w)
    }
  }

  const oben = (b) => b.slice(0, 6).reduce((a, x) => a + (x || 0), 0)
  const bonus = (b) => (oben(b) >= BONUS_AB ? BONUS : 0)
  const gesamt = (b) => b.reduce((a, x) => a + (x || 0), 0) + bonus(b)

  function neu(spieler, optionen, saat) {
    return {
      spieler,
      optionen: optionen || {},
      saat: saat >>> 0,
      dran: 0,
      wuerfel: [1, 2, 3, 4, 5],
      wurf: 0,
      blatt: spieler.map(() => new Array(13).fill(null)),
      runde: 1,
      ende: null,
      log: [],
    }
  }

  function anwenden(z0, sitz, a) {
    if (!a || z0.ende || sitz !== z0.dran) return null
    const z = H.kopie(z0)
    if (a.t === 'wurf') {
      if (z.wurf >= 3) return null
      const halten = z.wurf === 0 ? [false, false, false, false, false] : Array.isArray(a.halten) ? a.halten.slice(0, 5).map(Boolean) : []
      if (z.wurf > 0 && halten.length === 5 && halten.every(Boolean)) return null
      for (let i = 0; i < 5; i++) if (!halten[i]) z.wuerfel[i] = 1 + H.ganz(z, 6)
      z.wurf++
      return z
    }
    if (a.t === 'eintragen') {
      const f = a.feld
      if (z.wurf < 1 || !Number.isInteger(f) || f < 0 || f > 12 || z.blatt[sitz][f] !== null) return null
      const p = wert(z.wuerfel, f)
      z.blatt[sitz][f] = p
      H.melde(z, H.name(z, sitz) + ': ' + FELDER[f] + ' – ' + p + ' Punkte')
      z.wurf = 0
      z.dran = (z.dran + 1) % z.spieler.length
      if (z.dran === 0) z.runde++
      if (z.blatt.every((b) => b.every((x) => x !== null))) H.endeNachPunkten(z, z.blatt.map(gesamt))
      return z
    }
    return null
  }

  // ---------- Computer ----------
  // Grobe Erwartung je Feld: Wer darunter bleibt, „verschenkt“ etwas.
  const RICHT = [2, 5, 8, 11, 14, 17, 18, 10, 18, 22, 22, 18, 22]
  function bewerte(w, b, f) {
    const p = wert(w, f)
    let n = p - RICHT[f]
    if (f < 6) {
      const vorher = oben(b)
      if (vorher < BONUS_AB && vorher + p >= BONUS_AB) n += 25 // Bonus erreicht
      n += (zaehle(w)[f + 1] - 3) * (f + 1) * 0.8 // mehr als drei gleiche oben lohnt sich
    }
    if (f === 12) n -= 4 // Chance lieber aufheben
    return n
  }
  function bestesFeld(w, b) {
    let best = -1
    let bw = -Infinity
    for (let f = 0; f < 13; f++) {
      if (b[f] !== null) continue
      const x = bewerte(w, b, f)
      if (x > bw) {
        bw = x
        best = f
      }
    }
    return { feld: best, wert: bw }
  }

  function ki(z, sitz) {
    const b = z.blatt[sitz]
    const w = z.wuerfel
    if (z.wurf === 0) return { t: 'wurf', halten: [false, false, false, false, false] }
    const bf = bestesFeld(w, b)
    const sicher = (f) => b[f] === null && wert(w, f) > 0
    if (z.wurf >= 3 || sicher(11) || sicher(10) || (sicher(8) && b[8] === null && Math.max(...zaehle(w)) < 4) || (sicher(9) && b[10] !== null)) return { t: 'eintragen', feld: bf.feld }
    // Straßen verfolgen, wenn vier in Folge da sind
    if ((b[9] === null || b[10] === null) && hatFolge(w, 4)) {
      const gesehen = new Set()
      let folge = null
      for (const s of [1, 2, 3]) if ([0, 1, 2, 3].every((k) => w.includes(s + k))) folge = s
      const halten = w.map((x) => (x >= folge && x < folge + 4 && !gesehen.has(x) ? (gesehen.add(x), true) : false))
      if (halten.some((h) => !h)) return { t: 'wurf', halten }
    }
    // Sonst: die häufigste Augenzahl behalten (bei Gleichstand die höhere, sofern das Feld oben noch frei ist)
    const c = zaehle(w)
    let ziel = 6
    let beste = -1
    for (let x = 6; x >= 1; x--) {
      const gewicht = c[x] * 10 + x + (b[x - 1] === null ? 5 : 0)
      if (gewicht > beste) {
        beste = gewicht
        ziel = x
      }
    }
    const halten = w.map((x) => x === ziel)
    if (halten.every(Boolean)) return { t: 'eintragen', feld: bf.feld }
    return { t: 'wurf', halten }
  }

  const punkte = (z, i) => gesamt(z.blatt[i])

  const api = { id: 'wuerfelglueck', name: 'Würfelglück', min: 1, max: 6, standard: 2, FELDER, BONUS_AB, BONUS, wert, oben, bonus, gesamt, neu, anwenden, ki, punkte }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.Wuerfelglueck = api
})()
