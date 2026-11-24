/*
 * Inselhandel – Siedeln, Bauen und Tauschen auf einer Insel aus 19 Sechsecken (Browser: window.Inselhandel, Node: module.exports).
 * Rohstoffe: Holz, Lehm, Wolle, Korn, Erz. Wer zuerst die Zielpunktzahl erreicht (Siedlung 1, Stadt 2, längste Straße 2), gewinnt.
 * Zustand: { spieler, dran, felder: [{ art, zahl }], nebel (Feld), bauten: [je Ecke null | { s, stadt }], strassen: [je Kante null | Sitz],
 *            karten: [{ holz, lehm, wolle, korn, erz }], phase: 'start' | 'wuerfeln' | 'nebel' | 'bauen', start: { pos, ecke }, wurf, laengste, ende, log, saat }
 * Aktionen: { t: 'siedlung', ecke }, { t: 'strasse', kante }, { t: 'stadt', ecke }, { t: 'wuerfeln' },
 *           { t: 'nebel', feld, opfer? }, { t: 'tausch', geben, nehmen } (4 : 1 mit der Bank), { t: 'ende' }
 */
;(function () {
  'use strict'
  const H = typeof module !== 'undefined' && module.exports ? require('../gruppe-hilfe.js') : window.GruppenHilfe

  const ROHSTOFFE = ['holz', 'lehm', 'wolle', 'korn', 'erz']
  const NAMEN = { holz: 'Holz', lehm: 'Lehm', wolle: 'Wolle', korn: 'Korn', erz: 'Erz', wueste: 'Wüste' }
  const KOSTEN = {
    strasse: { holz: 1, lehm: 1 },
    siedlung: { holz: 1, lehm: 1, wolle: 1, korn: 1 },
    stadt: { korn: 2, erz: 3 },
  }
  const VORRAT = { strasse: 15, siedlung: 5, stadt: 4 }
  const R = 40

  // ---------- Geometrie: 19 Felder, 54 Ecken, 72 Kanten ----------
  const FELDER = []
  for (let r = -2; r <= 2; r++) for (let q = -2; q <= 2; q++) if (Math.abs(q + r) <= 2) FELDER.push({ q, r, x: R * Math.sqrt(3) * (q + r / 2), y: R * 1.5 * r })
  const ECKEN = []
  const KANTEN = []
  const eckIndex = new Map()
  const kantIndex = new Map()
  FELDER.forEach((f, fi) => {
    f.ecken = []
    for (let i = 0; i < 6; i++) {
      const w = (Math.PI / 180) * (60 * i - 30)
      const x = f.x + R * Math.cos(w)
      const y = f.y + R * Math.sin(w)
      const k = Math.round(x) + ':' + Math.round(y)
      if (!eckIndex.has(k)) {
        eckIndex.set(k, ECKEN.length)
        ECKEN.push({ x, y, felder: [], nachbarn: [], kanten: [] })
      }
      const e = eckIndex.get(k)
      ECKEN[e].felder.push(fi)
      f.ecken.push(e)
    }
    for (let i = 0; i < 6; i++) {
      const a = f.ecken[i]
      const b = f.ecken[(i + 1) % 6]
      const k = Math.min(a, b) + '-' + Math.max(a, b)
      if (!kantIndex.has(k)) {
        kantIndex.set(k, KANTEN.length)
        KANTEN.push({ a: Math.min(a, b), b: Math.max(a, b) })
        ECKEN[a].nachbarn.push(b)
        ECKEN[b].nachbarn.push(a)
        ECKEN[a].kanten.push(KANTEN.length - 1)
        ECKEN[b].kanten.push(KANTEN.length - 1)
      }
    }
  })
  const andereEcke = (k, e) => (KANTEN[k].a === e ? KANTEN[k].b : KANTEN[k].a)
  const punktwert = (zahl) => (zahl ? 6 - Math.abs(7 - zahl) : 0) // Zahl der Würfelkombinationen

  const leer = () => ({ holz: 0, lehm: 0, wolle: 0, korn: 0, erz: 0 })
  const summe = (k) => ROHSTOFFE.reduce((a, r) => a + k[r], 0)
  const kann = (k, kosten) => Object.keys(kosten).every((r) => k[r] >= kosten[r])
  const zahle = (k, kosten) => Object.keys(kosten).forEach((r) => (k[r] -= kosten[r]))
  const anzahl = (z, s, art) => (art === 'strasse' ? z.strassen.filter((x) => x === s).length : z.bauten.filter((b) => b && b.s === s && !!b.stadt === (art === 'stadt')).length)

  function siegpunkte(z, s) {
    let p = 0
    z.bauten.forEach((b) => b && b.s === s && (p += b.stadt ? 2 : 1))
    if (z.laengste === s) p += 2
    return p
  }

  /** Abstandsregel: Ecke frei und alle Nachbarecken frei. */
  const frei = (z, e) => !z.bauten[e] && ECKEN[e].nachbarn.every((n) => !z.bauten[n])
  const anStrasse = (z, s, e) => ECKEN[e].kanten.some((k) => z.strassen[k] === s)

  function siedlungErlaubt(z, s, e) {
    if (!Number.isInteger(e) || e < 0 || e >= ECKEN.length || !frei(z, e)) return false
    if (z.phase === 'start') return true
    return anStrasse(z, s, e)
  }
  function strasseErlaubt(z, s, k) {
    if (!Number.isInteger(k) || k < 0 || k >= KANTEN.length || z.strassen[k] !== null) return false
    const { a, b } = KANTEN[k]
    if (z.phase === 'start') return a === z.start.ecke || b === z.start.ecke
    return [a, b].some((e) => {
      const bau = z.bauten[e]
      if (bau && bau.s === s) return true
      if (bau && bau.s !== s) return false // fremde Siedlung unterbricht
      return ECKEN[e].kanten.some((x) => x !== k && z.strassen[x] === s)
    })
  }

  /** Längste zusammenhängende Straße eines Spielers (fremde Bauten unterbrechen). */
  function strassenLaenge(z, s) {
    let best = 0
    const eigene = z.strassen.map((x, i) => (x === s ? i : -1)).filter((i) => i >= 0)
    function tiefe(e, benutzt) {
      let m = 0
      const bau = z.bauten[e]
      if (benutzt.size && bau && bau.s !== s) return 0
      for (const k of ECKEN[e].kanten) {
        if (z.strassen[k] !== s || benutzt.has(k)) continue
        benutzt.add(k)
        m = Math.max(m, 1 + tiefe(andereEcke(k, e), benutzt))
        benutzt.delete(k)
      }
      return m
    }
    const starts = new Set()
    eigene.forEach((k) => {
      starts.add(KANTEN[k].a)
      starts.add(KANTEN[k].b)
    })
    starts.forEach((e) => (best = Math.max(best, tiefe(e, new Set()))))
    return best
  }
  function laengsteNeu(z) {
    const l = z.spieler.map((_, s) => strassenLaenge(z, s))
    const halter = z.laengste
    if (halter >= 0 && l[halter] >= 5 && l.every((x, s) => s === halter || x <= l[halter])) return
    const max = Math.max(...l)
    const wer = l.map((x, s) => (x === max ? s : -1)).filter((s) => s >= 0)
    const neu = max >= 5 && wer.length === 1 ? wer[0] : halter >= 0 && l[halter] >= 5 && l[halter] === max ? halter : -1
    if (neu !== z.laengste && neu >= 0) H.melde(z, H.name(z, neu) + ' hat jetzt die längste Straße (' + max + ').')
    z.laengste = neu
  }

  function pruefeSieg(z, s) {
    if (siegpunkte(z, s) >= z.optionen.ziel) {
      z.ende = { sieger: [s], text: H.name(z, s) + ' erreicht ' + siegpunkte(z, s) + ' Punkte und gewinnt!' }
      H.melde(z, z.ende.text)
    }
  }

  function neu(spieler, optionen, saat) {
    const o = Object.assign({ ziel: 10 }, optionen || {})
    const z = { spieler, optionen: o, saat: saat >>> 0, dran: 0, felder: [], nebel: 0, bauten: ECKEN.map(() => null), strassen: KANTEN.map(() => null), karten: spieler.map(leer), phase: 'start', start: { pos: 0, ecke: -1 }, wurf: null, laengste: -1, tausche: 0, ende: null, log: [] }
    const arten = H.mische(z, ['holz', 'holz', 'holz', 'holz', 'lehm', 'lehm', 'lehm', 'wolle', 'wolle', 'wolle', 'wolle', 'korn', 'korn', 'korn', 'korn', 'erz', 'erz', 'erz', 'wueste'])
    // Zahlen so legen, dass 6 und 8 nicht nebeneinander liegen
    let zahlen
    for (let versuch = 0; versuch < 200; versuch++) {
      zahlen = H.mische(z, [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12])
      let k = 0
      const probe = arten.map((a) => (a === 'wueste' ? 0 : zahlen[k++]))
      const rot = (i) => probe[i] === 6 || probe[i] === 8
      const nah = (i, j) => FELDER[i].ecken.some((e) => FELDER[j].ecken.includes(e))
      let ok = true
      for (let i = 0; i < 19 && ok; i++) for (let j = i + 1; j < 19 && ok; j++) if (rot(i) && rot(j) && nah(i, j)) ok = false
      if (ok) break
    }
    let k = 0
    z.felder = arten.map((art) => ({ art, zahl: art === 'wueste' ? 0 : zahlen[k++] }))
    z.nebel = z.felder.findIndex((f) => f.art === 'wueste')
    H.melde(z, 'Jeder setzt zwei Siedlungen mit je einer Straße – erst vorwärts, dann rückwärts.')
    return z
  }
  const startReihe = (z) => {
    const n = z.spieler.length
    return Array.from({ length: n }, (_, i) => i).concat(Array.from({ length: n }, (_, i) => n - 1 - i))
  }

  function verteile(z, summe) {
    const bekam = z.spieler.map(leer)
    z.felder.forEach((f, fi) => {
      if (f.zahl !== summe || fi === z.nebel) return
      FELDER[fi].ecken.forEach((e) => {
        const b = z.bauten[e]
        if (!b) return
        z.karten[b.s][f.art] += b.stadt ? 2 : 1
        bekam[b.s][f.art] += b.stadt ? 2 : 1
      })
    })
    bekam.forEach((k, s) => {
      const t = ROHSTOFFE.filter((r) => k[r]).map((r) => k[r] + ' ' + NAMEN[r]).join(', ')
      if (t) H.melde(z, H.name(z, s) + ' bekommt ' + t + '.')
    })
  }

  function anwenden(z0, sitz, a) {
    if (!a || z0.ende || sitz !== z0.dran) return null
    const z = H.kopie(z0)
    const karten = z.karten[sitz]
    if (z.phase === 'start') {
      const reihe = startReihe(z)
      if (a.t === 'siedlung' && z.start.ecke < 0) {
        if (!siedlungErlaubt(z, sitz, a.ecke)) return null
        z.bauten[a.ecke] = { s: sitz, stadt: false }
        z.start.ecke = a.ecke
        if (z.start.pos >= z.spieler.length) {
          // zweite Siedlung: Rohstoffe der angrenzenden Felder
          ECKEN[a.ecke].felder.forEach((fi) => z.felder[fi].art !== 'wueste' && karten[z.felder[fi].art]++)
        }
        return z
      }
      if (a.t === 'strasse' && z.start.ecke >= 0) {
        if (!strasseErlaubt(z, sitz, a.kante)) return null
        z.strassen[a.kante] = sitz
        z.start.ecke = -1
        z.start.pos++
        if (z.start.pos >= reihe.length) {
          z.phase = 'wuerfeln'
          z.dran = 0
          H.melde(z, 'Alle haben gesetzt. ' + H.name(z, 0) + ' würfelt zuerst.')
        } else z.dran = reihe[z.start.pos]
        return z
      }
      return null
    }
    if (a.t === 'wuerfeln') {
      if (z.phase !== 'wuerfeln') return null
      z.wurf = [1 + H.ganz(z, 6), 1 + H.ganz(z, 6)]
      const s = z.wurf[0] + z.wurf[1]
      H.melde(z, H.name(z, sitz) + ' würfelt ' + s + '.')
      z.tausche = 0
      if (s === 7) {
        z.karten.forEach((k, sp) => {
          const n = summe(k)
          if (n <= 7) return
          const weg = Math.floor(n / 2)
          for (let i = 0; i < weg; i++) {
            const stapel = ROHSTOFFE.flatMap((r) => Array(k[r]).fill(r))
            k[stapel[H.ganz(z, stapel.length)]]--
          }
          H.melde(z, H.name(z, sp) + ' hatte mehr als 7 Karten und verliert ' + weg + '.')
        })
        z.phase = 'nebel'
      } else {
        verteile(z, s)
        z.phase = 'bauen'
      }
      return z
    }
    if (a.t === 'nebel') {
      if (z.phase !== 'nebel' || !Number.isInteger(a.feld) || a.feld < 0 || a.feld >= 19 || a.feld === z.nebel) return null
      const opfer = nebelOpfer(z, sitz, a.feld)
      if (opfer.length && !opfer.includes(a.opfer)) return null
      z.nebel = a.feld
      if (opfer.length) {
        const k = z.karten[a.opfer]
        const stapel = ROHSTOFFE.flatMap((r) => Array(k[r]).fill(r))
        const r = stapel[H.ganz(z, stapel.length)]
        k[r]--
        karten[r]++
        H.melde(z, H.name(z, sitz) + ' schickt den Nebel weiter und nimmt ' + H.name(z, a.opfer) + ' eine Karte weg.')
      } else H.melde(z, H.name(z, sitz) + ' schickt den Nebel weiter.')
      z.phase = 'bauen'
      return z
    }
    if (z.phase !== 'bauen') return null
    if (a.t === 'siedlung') {
      if (!kann(karten, KOSTEN.siedlung) || anzahl(z, sitz, 'siedlung') >= VORRAT.siedlung || !siedlungErlaubt(z, sitz, a.ecke)) return null
      zahle(karten, KOSTEN.siedlung)
      z.bauten[a.ecke] = { s: sitz, stadt: false }
      H.melde(z, H.name(z, sitz) + ' baut eine Siedlung.')
      laengsteNeu(z)
      pruefeSieg(z, sitz)
      return z
    }
    if (a.t === 'stadt') {
      const b = Number.isInteger(a.ecke) && z.bauten[a.ecke]
      if (!b || b.s !== sitz || b.stadt || !kann(karten, KOSTEN.stadt) || anzahl(z, sitz, 'stadt') >= VORRAT.stadt) return null
      zahle(karten, KOSTEN.stadt)
      b.stadt = true
      H.melde(z, H.name(z, sitz) + ' baut eine Stadt.')
      pruefeSieg(z, sitz)
      return z
    }
    if (a.t === 'strasse') {
      if (!kann(karten, KOSTEN.strasse) || anzahl(z, sitz, 'strasse') >= VORRAT.strasse || !strasseErlaubt(z, sitz, a.kante)) return null
      zahle(karten, KOSTEN.strasse)
      z.strassen[a.kante] = sitz
      laengsteNeu(z)
      pruefeSieg(z, sitz)
      return z
    }
    if (a.t === 'tausch') {
      if (!ROHSTOFFE.includes(a.geben) || !ROHSTOFFE.includes(a.nehmen) || a.geben === a.nehmen || karten[a.geben] < 4) return null
      karten[a.geben] -= 4
      karten[a.nehmen]++
      z.tausche++
      H.melde(z, H.name(z, sitz) + ' tauscht 4 ' + NAMEN[a.geben] + ' gegen 1 ' + NAMEN[a.nehmen] + '.')
      return z
    }
    if (a.t === 'ende') {
      z.dran = (z.dran + 1) % z.spieler.length
      z.phase = 'wuerfeln'
      z.wurf = null
      return z
    }
    return null
  }

  /** Wem kann man eine Karte wegnehmen, wenn der Nebel auf dieses Feld zieht? */
  function nebelOpfer(z, s, feld) {
    const l = new Set()
    FELDER[feld].ecken.forEach((e) => {
      const b = z.bauten[e]
      if (b && b.s !== s && summe(z.karten[b.s]) > 0) l.add(b.s)
    })
    return [...l]
  }

  // ---------- Computer ----------
  function eckWert(z, e) {
    const arten = new Set()
    let w = 0
    ECKEN[e].felder.forEach((fi) => {
      const f = z.felder[fi]
      w += punktwert(f.zahl) * (fi === z.nebel ? 0.3 : 1)
      if (f.art !== 'wueste') arten.add(f.art)
    })
    return w + arten.size * 1.5
  }
  function besteEcke(z, s, liste) {
    let best = -1
    let bw = -Infinity
    liste.forEach((e) => {
      const w = eckWert(z, e)
      if (w > bw) {
        bw = w
        best = e
      }
    })
    return best
  }
  function strasseZiel(z, s) {
    // Kante, deren Ende zu einer guten freien Ecke führt (direkt oder eine Kante weiter)
    let best = -1
    let bw = -Infinity
    KANTEN.forEach((_, k) => {
      if (!strasseErlaubt(z, s, k)) return
      const { a, b } = KANTEN[k]
      ;[a, b].forEach((e) => {
        let w = frei(z, e) ? eckWert(z, e) : 0
        ECKEN[e].nachbarn.forEach((n) => {
          if (frei(z, n)) w = Math.max(w, eckWert(z, n) * 0.7)
        })
        w += H.zufall({ saat: (k * 7 + z.saat) >>> 0 })
        if (w > bw) {
          bw = w
          best = k
        }
      })
    })
    return best
  }
  function ki(z, s) {
    const karten = z.karten[s]
    if (z.phase === 'start') {
      if (z.start.ecke < 0) return { t: 'siedlung', ecke: besteEcke(z, s, ECKEN.map((_, e) => e).filter((e) => frei(z, e))) }
      const kanten = ECKEN[z.start.ecke].kanten.filter((k) => strasseErlaubt(z, s, k))
      let best = kanten[0]
      let bw = -1
      kanten.forEach((k) => {
        const e = andereEcke(k, z.start.ecke)
        const w = Math.max(0, ...ECKEN[e].nachbarn.filter((n) => frei(z, n)).map((n) => eckWert(z, n)))
        if (w > bw) {
          bw = w
          best = k
        }
      })
      return { t: 'strasse', kante: best }
    }
    if (z.phase === 'wuerfeln') return { t: 'wuerfeln' }
    if (z.phase === 'nebel') {
      const fuehrer = z.spieler.map((_, i) => i).filter((i) => i !== s).sort((x, y) => siegpunkte(z, y) - siegpunkte(z, x))
      let best = -1
      let bw = -Infinity
      z.felder.forEach((f, fi) => {
        if (fi === z.nebel) return
        let w = -1
        FELDER[fi].ecken.forEach((e) => {
          const b = z.bauten[e]
          if (!b) return
          const gewicht = (b.stadt ? 2 : 1) * punktwert(f.zahl)
          w += b.s === s ? -gewicht * 3 : gewicht * (b.s === fuehrer[0] ? 1.5 : 1)
        })
        if (w > bw) {
          bw = w
          best = fi
        }
      })
      const opfer = nebelOpfer(z, s, best)
      opfer.sort((x, y) => summe(z.karten[y]) - summe(z.karten[x]))
      return opfer.length ? { t: 'nebel', feld: best, opfer: opfer[0] } : { t: 'nebel', feld: best }
    }
    // bauen
    const stadtOrte = z.bauten.map((b, e) => (b && b.s === s && !b.stadt ? e : -1)).filter((e) => e >= 0)
    if (kann(karten, KOSTEN.stadt) && stadtOrte.length && anzahl(z, s, 'stadt') < VORRAT.stadt) return { t: 'stadt', ecke: besteEcke(z, s, stadtOrte) }
    const orte = ECKEN.map((_, e) => e).filter((e) => frei(z, e) && anStrasse(z, s, e))
    if (kann(karten, KOSTEN.siedlung) && orte.length && anzahl(z, s, 'siedlung') < VORRAT.siedlung) return { t: 'siedlung', ecke: besteEcke(z, s, orte) }
    const strassenOk = anzahl(z, s, 'strasse') < VORRAT.strasse && (!orte.length || (anzahl(z, s, 'siedlung') >= VORRAT.siedlung ? false : karten.holz >= 2 && karten.lehm >= 2))
    if (kann(karten, KOSTEN.strasse) && strassenOk) {
      const k = strasseZiel(z, s)
      if (k >= 0) return { t: 'strasse', kante: k }
    }
    // Tauschen: Überschuss gegen das, was für das nächste Ziel fehlt
    if (z.tausche < 3) {
      const ziel = stadtOrte.length && anzahl(z, s, 'stadt') < VORRAT.stadt && (karten.erz >= 2 || karten.korn >= 2) ? KOSTEN.stadt : orte.length ? KOSTEN.siedlung : KOSTEN.strasse
      const fehlt = ROHSTOFFE.filter((r) => (ziel[r] || 0) > karten[r])
      const ueber = ROHSTOFFE.filter((r) => karten[r] - (ziel[r] || 0) >= 4)
      if (fehlt.length && ueber.length) return { t: 'tausch', geben: ueber[0], nehmen: fehlt[0] }
    }
    return { t: 'ende' }
  }

  const punkte = (z, i) => siegpunkte(z, i) + ' P · ' + summe(z.karten[i]) + ' K'

  const api = {
    id: 'inselhandel', name: 'Inselhandel', min: 2, max: 4, standard: 3,
    ROHSTOFFE, NAMEN, KOSTEN, VORRAT, R, FELDER, ECKEN, KANTEN, punktwert, summe, kann, anzahl, siegpunkte, frei,
    siedlungErlaubt, strasseErlaubt, strassenLaenge, nebelOpfer, startReihe, neu, anwenden, ki, punkte,
    optionen: [{ id: 'ziel', text: 'Ziel', werte: [[6, '6 Punkte (kurz)'], [8, '8 Punkte'], [10, '10 Punkte']], start: 8 }],
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.Inselhandel = api
})()
