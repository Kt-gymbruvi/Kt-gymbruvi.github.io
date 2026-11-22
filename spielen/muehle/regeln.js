/*
 * Mühle (Neun Männer Morris) – Regeln und Rechner. Reine Funktionen (Browser: window.Muehle, Node: module.exports).
 *
 * Punkte 0…23: äußerer Ring 0–7, mittlerer 8–15, innerer 16–23; je Ring im Uhrzeigersinn ab links oben
 * (Ecke, Mitte oben, Ecke, Mitte rechts, Ecke, Mitte unten, Ecke, Mitte links).
 * Zustand: { p: 24 Punkte (0 leer, 1, 2), vorrat: [_, a, b] noch zu setzen, brett: [_, a, b] auf dem Brett,
 *            amZug: 1 | 2, ende: null | { sieger: 0 | 1 | 2 }, ohneSchlag: Halbzüge ohne Mühle }
 * Zug: { von: -1 (Setzen) | Punkt, nach: Punkt, nimm: -1 | Punkt }  – Ziehen und Entfernen in einem Zug.
 */
;(function () {
  'use strict'

  const NACHBARN = Array.from({ length: 24 }, () => [])
  const verbinde = (a, b) => {
    NACHBARN[a].push(b)
    NACHBARN[b].push(a)
  }
  for (let r = 0; r < 3; r++) for (let i = 0; i < 8; i++) verbinde(r * 8 + i, r * 8 + ((i + 1) % 8))
  for (let i = 1; i < 8; i += 2) {
    verbinde(i, 8 + i)
    verbinde(8 + i, 16 + i)
  }

  const MUEHLEN = []
  for (let r = 0; r < 3; r++) {
    for (let k = 0; k < 4; k++) MUEHLEN.push([r * 8 + 2 * k, r * 8 + 2 * k + 1, r * 8 + ((2 * k + 2) % 8)])
  }
  for (let i = 1; i < 8; i += 2) MUEHLEN.push([i, 8 + i, 16 + i])
  const MUEHLEN_VON = Array.from({ length: 24 }, (_, i) => MUEHLEN.filter((m) => m.includes(i)))

  /** Ort der Punkte im 7×7-Raster (x, y) für die Zeichnung. */
  const ORT = []
  for (let r = 0; r < 3; r++) {
    const d = r
    const m = [[d, d], [3, d], [6 - d, d], [6 - d, 3], [6 - d, 6 - d], [3, 6 - d], [d, 6 - d], [d, 3]]
    m.forEach((xy) => ORT.push(xy))
  }

  function neu() {
    return { p: new Array(24).fill(0), vorrat: [0, 9, 9], brett: [0, 0, 0], amZug: 1, ende: null, ohneSchlag: 0, letzter: null }
  }

  const inMuehle = (p, i) => MUEHLEN_VON[i].some((m) => m.every((x) => p[x] === p[i]))

  function entfernbar(p, gegner) {
    const alle = []
    const freie = []
    for (let i = 0; i < 24; i++) {
      if (p[i] !== gegner) continue
      alle.push(i)
      if (!inMuehle(p, i)) freie.push(i)
    }
    return freie.length ? freie : alle
  }

  /** Alle erlaubten Züge (mit Entfernen). */
  function zuege(s) {
    if (s.ende) return []
    const wer = s.amZug
    const gegner = 3 - wer
    const basis = []
    if (s.vorrat[wer] > 0) {
      for (let i = 0; i < 24; i++) if (!s.p[i]) basis.push({ von: -1, nach: i })
    } else {
      const fliegen = s.brett[wer] === 3
      for (let v = 0; v < 24; v++) {
        if (s.p[v] !== wer) continue
        if (fliegen) {
          for (let n = 0; n < 24; n++) if (!s.p[n]) basis.push({ von: v, nach: n })
        } else {
          for (const n of NACHBARN[v]) if (!s.p[n]) basis.push({ von: v, nach: n })
        }
      }
    }
    const l = []
    for (const z of basis) {
      const p = s.p.slice()
      if (z.von >= 0) p[z.von] = 0
      p[z.nach] = wer
      if (inMuehle(p, z.nach)) {
        for (const n of entfernbar(p, gegner)) l.push({ von: z.von, nach: z.nach, nimm: n })
      } else l.push({ von: z.von, nach: z.nach, nimm: -1 })
    }
    return l
  }

  const gleich = (a, b) => a.von === b.von && a.nach === b.nach && a.nimm === b.nimm

  /** Neuer Zustand oder null, wenn der Zug nicht erlaubt ist. */
  function ziehe(s, z) {
    if (!zuege(s).some((x) => gleich(x, z))) return null
    return anwenden(s, z)
  }

  function anwenden(s, z) {
    const wer = s.amZug
    const gegner = 3 - wer
    const p = s.p.slice()
    const vorrat = s.vorrat.slice()
    const brett = s.brett.slice()
    if (z.von >= 0) p[z.von] = 0
    else {
      vorrat[wer]--
      brett[wer]++
    }
    p[z.nach] = wer
    if (z.nimm >= 0) {
      p[z.nimm] = 0
      brett[gegner]--
    }
    const n = { p, vorrat, brett, amZug: gegner, ende: null, ohneSchlag: z.nimm >= 0 || z.von < 0 ? 0 : s.ohneSchlag + 1, letzter: z }
    if (vorrat[gegner] + brett[gegner] < 3) n.ende = { sieger: wer }
    else if (!zuege(n).length) n.ende = { sieger: wer } // Gegner kann nicht ziehen
    else if (n.ohneSchlag >= 60) n.ende = { sieger: 0 }
    return n
  }

  // ---------- Rechner ----------
  function bewerten(s, ich) {
    const du = 3 - ich
    let w = (s.vorrat[ich] + s.brett[ich] - s.vorrat[du] - s.brett[du]) * 12
    let beweglich = 0
    for (let i = 0; i < 24; i++) {
      if (!s.p[i]) continue
      const f = s.p[i] === ich ? 1 : -1
      for (const n of NACHBARN[i]) if (!s.p[n]) beweglich += f
    }
    w += beweglich
    for (const m of MUEHLEN) {
      let a = 0
      let b = 0
      for (const i of m) {
        if (s.p[i] === ich) a++
        else if (s.p[i] === du) b++
      }
      if (a === 3) w += 4
      else if (b === 3) w -= 4
      else if (a === 2 && !b) w += 5
      else if (b === 2 && !a) w -= 5
    }
    return w
  }

  function negamax(s, tiefe, alpha, beta, ich) {
    if (s.ende) return s.ende.sieger === 0 ? 0 : s.ende.sieger === s.amZug ? 10000 + tiefe : -(10000 + tiefe)
    if (tiefe === 0) return s.amZug === ich ? bewerten(s, ich) : -bewerten(s, ich)
    const l = zuege(s)
    // Mühlen zuerst (bessere Abschnitte)
    l.sort((a, b) => (b.nimm >= 0) - (a.nimm >= 0))
    let beste = -Infinity
    for (const z of l) {
      const w = -negamax(anwenden(s, z), tiefe - 1, -beta, -alpha, ich)
      if (w > beste) beste = w
      if (beste > alpha) alpha = beste
      if (alpha >= beta) break
    }
    return beste
  }

  /** Wählt einen Zug. stufe: 1 leicht, 2 mittel, 3 schwer. */
  function rechnerZug(s, stufe) {
    const l = zuege(s)
    if (!l.length) return null
    if (stufe === 1 && Math.random() < 0.4) return l[Math.floor(Math.random() * l.length)]
    const tiefe = [0, 2, 3, 4][stufe] || 3
    let beste = []
    let wert = -Infinity
    for (const z of l) {
      const w = -negamax(anwenden(s, z), tiefe - 1, -Infinity, Infinity, s.amZug)
      if (w > wert) {
        wert = w
        beste = [z]
      } else if (w === wert) beste.push(z)
    }
    return beste[Math.floor(Math.random() * beste.length)]
  }

  const api = { NACHBARN, MUEHLEN, ORT, neu, zuege, ziehe, rechnerZug }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.Muehle = api
})()
