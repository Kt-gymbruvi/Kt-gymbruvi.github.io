/*
 * Grenzland – Eroberungsspiel auf einer Karte aus Sechsecken (Browser: window.Grenzland, Node: module.exports).
 * Ein Zug: Truppen verteilen → angreifen (Würfel) → einmal Truppen verschieben.
 * Zustand: { spieler, dran, besitzer: [Sitz je Feld], truppen: [Zahl je Feld], phase: 'verteilen' | 'angriff' | 'nachruecken' | 'verschieben',
 *            rest (zu verteilen), sieg: { von, nach, min } (nach einer Eroberung), runde, raus: [true/false], wuerfe, ende, log, saat }
 * Aktionen: { t: 'setze', feld, n }                    Truppen aufs eigene Feld (verteilen)
 *           { t: 'angriff', von, nach, bis }            ein Wurf; bis = true: würfeln bis erobert oder nur noch 1 Truppe
 *           { t: 'nachruecken', n }                     nach einer Eroberung n Truppen nachziehen (mindestens so viele wie Würfel)
 *           { t: 'weiter' }                             Angriffe beenden
 *           { t: 'verschiebe', von, nach, n }           über eigene Felder verschieben, beendet den Zug
 *           { t: 'ende' }                               Zug beenden
 */
;(function () {
  'use strict'
  const H = typeof module !== 'undefined' && module.exports ? require('../gruppe-hilfe.js') : window.GruppenHilfe

  // Karte: Zeilen versetzt (ungerade Zeilen halb nach rechts), Buchstabe = Gebiet, Punkt = Meer
  const KARTE = [
    '.NNN.OO.',
    'WNN.OOO.',
    'WWMMMO..',
    'W.MMMSS.',
    'KKMSSS..',
    'KKK.S...',
  ]
  const GEBIETE = {
    N: { name: 'Nordmark', bonus: 3 },
    O: { name: 'Ostwald', bonus: 3 },
    W: { name: 'Westküste', bonus: 2 },
    M: { name: 'Mittelland', bonus: 4 },
    S: { name: 'Südgebirge', bonus: 3 },
    K: { name: 'Kap', bonus: 2 },
  }
  // Überfahrten übers Meer (Paare von Feldern als [Zeile, Spalte])
  const FAEHREN = [
    [[0, 3], [1, 4]],
    [[3, 0], [4, 1]],
    [[4, 2], [5, 4]],
  ]

  const FELDER = []
  KARTE.forEach((zeile, r) =>
    [...zeile].forEach((ch, c) => {
      if (ch !== '.') FELDER.push({ r, c, gebiet: ch })
    }),
  )
  const index = (r, c) => FELDER.findIndex((f) => f.r === r && f.c === c)
  const NACHBARN = FELDER.map((f) => {
    const d = f.r % 2 ? [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]] : [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]]
    return d.map(([dr, dc]) => index(f.r + dr, f.c + dc)).filter((i) => i >= 0)
  })
  FAEHREN.forEach(([[r1, c1], [r2, c2]]) => {
    const a = index(r1, c1)
    const b = index(r2, c2)
    if (a >= 0 && b >= 0 && !NACHBARN[a].includes(b)) {
      NACHBARN[a].push(b)
      NACHBARN[b].push(a)
    }
  })
  const ZUM_GEBIET = {}
  FELDER.forEach((f, i) => (ZUM_GEBIET[f.gebiet] = (ZUM_GEBIET[f.gebiet] || []).concat(i)))

  const felderVon = (z, s) => z.besitzer.map((b, i) => (b === s ? i : -1)).filter((i) => i >= 0)
  function nachschub(z, s) {
    const eigene = felderVon(z, s).length
    let n = Math.max(3, Math.floor(eigene / 3))
    Object.keys(ZUM_GEBIET).forEach((g) => {
      if (ZUM_GEBIET[g].every((i) => z.besitzer[i] === s)) n += GEBIETE[g].bonus
    })
    return n
  }
  /** Felder, die von „von“ aus über eigene Felder erreichbar sind. */
  function erreichbar(z, von) {
    const s = z.besitzer[von]
    const gesehen = new Set([von])
    const offen = [von]
    while (offen.length) {
      const f = offen.pop()
      NACHBARN[f].forEach((n) => {
        if (!gesehen.has(n) && z.besitzer[n] === s) {
          gesehen.add(n)
          offen.push(n)
        }
      })
    }
    gesehen.delete(von)
    return gesehen
  }

  function neu(spieler, optionen, saat) {
    const o = Object.assign({ runden: 8 }, optionen || {})
    const z = { spieler, optionen: o, saat: saat >>> 0, dran: 0, besitzer: [], truppen: [], phase: 'verteilen', rest: 0, sieg: null, runde: 1, raus: spieler.map(() => false), wuerfe: null, ende: null, log: [] }
    const reihe = H.mische(z, FELDER.map((_, i) => i))
    reihe.forEach((f, k) => {
      z.besitzer[f] = k % spieler.length
      z.truppen[f] = 1
    })
    // Starttruppen zufällig auf die eigenen Felder
    const extra = Math.floor(66 / spieler.length) - Math.ceil(FELDER.length / spieler.length)
    spieler.forEach((_, s) => {
      const eigene = felderVon(z, s)
      // Wer nicht anfängt, bekommt 6 Truppen mehr (der Erste greift zuerst an)
      for (let k = 0; k < extra + (s ? 6 : 0); k++) z.truppen[eigene[H.ganz(z, eigene.length)]]++
    })
    z.rest = nachschub(z, 0)
    H.melde(z, 'Runde 1: ' + H.name(z, 0) + ' bekommt ' + z.rest + ' Truppen.')
    return z
  }

  function zugEnde(z) {
    z.sieg = null
    z.wuerfe = null
    const n = z.spieler.length
    for (let k = 0; k < n; k++) {
      z.dran = (z.dran + 1) % n
      if (z.dran === 0) z.runde++
      if (!z.raus[z.dran]) break
    }
    if (z.optionen.runden && z.runde > z.optionen.runden) {
      const punkte = z.spieler.map((_, s) => felderVon(z, s).length)
      H.endeNachPunkten(z, punkte, 'Feldern')
      return
    }
    z.phase = 'verteilen'
    z.rest = nachschub(z, z.dran)
    H.melde(z, (z.dran === 0 || z.spieler.length === 1 ? 'Runde ' + z.runde + ': ' : '') + H.name(z, z.dran) + ' bekommt ' + z.rest + ' Truppen.')
  }

  function kampf(z, von, nach) {
    const a = Math.min(3, z.truppen[von] - 1)
    const v = Math.min(2, z.truppen[nach])
    const wa = Array.from({ length: a }, () => 1 + H.ganz(z, 6)).sort((x, y) => y - x)
    const wv = Array.from({ length: v }, () => 1 + H.ganz(z, 6)).sort((x, y) => y - x)
    let verlustA = 0
    let verlustV = 0
    for (let i = 0; i < Math.min(a, v); i++) {
      if (wa[i] > wv[i]) verlustV++
      else verlustA++
    }
    z.truppen[von] -= verlustA
    z.truppen[nach] -= verlustV
    z.wuerfe = { a: wa, v: wv, von, nach }
    return a
  }

  function anwenden(z0, sitz, a) {
    if (!a || z0.ende || sitz !== z0.dran) return null
    const z = H.kopie(z0)
    const meins = (f) => Number.isInteger(f) && f >= 0 && f < FELDER.length && z.besitzer[f] === sitz
    if (a.t === 'setze') {
      if (z.phase !== 'verteilen' || !meins(a.feld) || !Number.isInteger(a.n) || a.n < 1 || a.n > z.rest) return null
      z.truppen[a.feld] += a.n
      z.rest -= a.n
      if (!z.rest) z.phase = 'angriff'
      return z
    }
    if (a.t === 'angriff') {
      if (z.phase !== 'angriff' || !meins(a.von) || z.truppen[a.von] < 2) return null
      if (!Number.isInteger(a.nach) || !NACHBARN[a.von].includes(a.nach) || z.besitzer[a.nach] === sitz) return null
      const opfer = z.besitzer[a.nach]
      let wuerfel = 0
      do wuerfel = kampf(z, a.von, a.nach)
      while (a.bis && z.truppen[a.nach] > 0 && z.truppen[a.von] > 1)
      if (z.truppen[a.nach] <= 0) {
        z.besitzer[a.nach] = sitz
        z.truppen[a.nach] = 0
        H.melde(z, H.name(z, sitz) + ' erobert ein Feld in ' + GEBIETE[FELDER[a.nach].gebiet].name + '.')
        if (!felderVon(z, opfer).length) {
          z.raus[opfer] = true
          H.melde(z, H.name(z, opfer) + ' hat kein Feld mehr und scheidet aus.')
        }
        if (z.raus.filter((x) => !x).length === 1) {
          z.truppen[a.nach] = z.truppen[a.von] - 1
          z.truppen[a.von] = 1
          z.ende = { sieger: [sitz], text: H.name(z, sitz) + ' beherrscht das ganze Grenzland!' }
          H.melde(z, z.ende.text)
          return z
        }
        const min = Math.min(wuerfel, z.truppen[a.von] - 1)
        if (z.truppen[a.von] - 1 === min) {
          // keine Wahl: alle beweglichen Truppen ziehen nach
          z.truppen[a.nach] = min
          z.truppen[a.von] -= min
        } else {
          z.phase = 'nachruecken'
          z.sieg = { von: a.von, nach: a.nach, min }
        }
      } else if (a.bis) H.melde(z, H.name(z, sitz) + ' greift in ' + GEBIETE[FELDER[a.nach].gebiet].name + ' an und muss aufgeben.')
      return z
    }
    if (a.t === 'nachruecken') {
      if (z.phase !== 'nachruecken' || !z.sieg) return null
      const max = z.truppen[z.sieg.von] - 1
      if (!Number.isInteger(a.n) || a.n < z.sieg.min || a.n > max) return null
      z.truppen[z.sieg.nach] = a.n
      z.truppen[z.sieg.von] -= a.n
      z.sieg = null
      z.phase = 'angriff'
      return z
    }
    if (a.t === 'weiter') {
      if (z.phase !== 'angriff') return null
      z.phase = 'verschieben'
      z.wuerfe = null
      return z
    }
    if (a.t === 'verschiebe') {
      if (z.phase !== 'verschieben' && z.phase !== 'angriff') return null
      if (!meins(a.von) || !meins(a.nach) || !erreichbar(z, a.von).has(a.nach)) return null
      if (!Number.isInteger(a.n) || a.n < 1 || a.n > z.truppen[a.von] - 1) return null
      z.truppen[a.von] -= a.n
      z.truppen[a.nach] += a.n
      H.melde(z, H.name(z, sitz) + ' verschiebt ' + a.n + (a.n === 1 ? ' Truppe.' : ' Truppen.'))
      zugEnde(z)
      return z
    }
    if (a.t === 'ende') {
      if (z.phase !== 'verschieben' && z.phase !== 'angriff') return null
      zugEnde(z)
      return z
    }
    return null
  }

  // ---------- Computer ----------
  const feinde = (z, f) => NACHBARN[f].filter((n) => z.besitzer[n] !== z.besitzer[f])
  function gebietsWert(z, s, f) {
    const feld = ZUM_GEBIET[FELDER[f].gebiet]
    return feld.filter((i) => z.besitzer[i] === s).length / feld.length
  }
  function ki(z, s) {
    if (z.phase === 'verteilen') {
      let best = -1
      let bw = -Infinity
      felderVon(z, s).forEach((f) => {
        const fe = feinde(z, f)
        if (!fe.length) return
        const druck = Math.max(...fe.map((n) => z.truppen[n])) - z.truppen[f]
        const chance = Math.max(...fe.map((n) => z.truppen[f] - z.truppen[n] + gebietsWert(z, s, n) * 4))
        const w = Math.max(druck, chance) + gebietsWert(z, s, f) * 3
        if (w > bw) {
          bw = w
          best = f
        }
      })
      if (best < 0) best = felderVon(z, s)[0]
      return { t: 'setze', feld: best, n: z.rest }
    }
    if (z.phase === 'nachruecken') {
      const max = z.truppen[z.sieg.von] - 1
      const nochFeinde = feinde(z, z.sieg.von).length
      return { t: 'nachruecken', n: nochFeinde ? Math.max(z.sieg.min, Math.ceil(max / 2)) : max }
    }
    if (z.phase === 'angriff') {
      let best = null
      let bw = 1.4
      felderVon(z, s).forEach((f) => {
        if (z.truppen[f] < 3) return
        feinde(z, f).forEach((n) => {
          const w = (z.truppen[f] - 1) / z.truppen[n] + gebietsWert(z, s, n) * 0.6
          if (w > bw) {
            bw = w
            best = { t: 'angriff', von: f, nach: n, bis: true }
          }
        })
      })
      if (best) return best
      return { t: 'weiter' }
    }
    // verschieben: viele Truppen im Hinterland an die Grenze
    let quelle = -1
    let qn = 1
    felderVon(z, s).forEach((f) => {
      if (!feinde(z, f).length && z.truppen[f] > qn) {
        qn = z.truppen[f]
        quelle = f
      }
    })
    if (quelle >= 0) {
      const ziele = [...erreichbar(z, quelle)].filter((f) => feinde(z, f).length)
      if (ziele.length) {
        ziele.sort((x, y) => z.truppen[x] - z.truppen[y])
        return { t: 'verschiebe', von: quelle, nach: ziele[0], n: z.truppen[quelle] - 1 }
      }
    }
    return { t: 'ende' }
  }

  const punkte = (z, i) => (z.raus[i] ? 'raus' : felderVon(z, i).length + ' Felder')

  const api = { id: 'grenzland', name: 'Grenzland', min: 2, max: 6, standard: 3, KARTE, GEBIETE, FELDER, NACHBARN, ZUM_GEBIET, FAEHREN, nachschub, erreichbar, felderVon, neu, anwenden, ki, punkte,
    optionen: [{ id: 'runden', text: 'Spieldauer (offen: bis einer alles hat)', werte: [[6, '6 Runden'], [8, '8 Runden'], [12, '12 Runden'], [0, 'offen']], start: 8 }] }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.Grenzland = api
})()
