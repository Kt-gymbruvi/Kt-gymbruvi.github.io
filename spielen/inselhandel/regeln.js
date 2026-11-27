/*
 * Inselhandel – Siedeln, Bauen und Tauschen auf einer Insel aus 19 Sechsecken (Browser: window.Inselhandel, Node: module.exports).
 * Rohstoffe: Holz, Lehm, Wolle, Korn, Erz. Wer zuerst die Zielpunktzahl erreicht, gewinnt.
 * Punkte: Siedlung 1, Stadt 2, längste Straße 2, stärkste Wache 2, Denkmal 1; mit Erweiterung zusätzlich Metropole 2, Inselretter 1.
 *
 * Grundspiel mit Entwicklungskarten (Wächter, Wegebau, Gute Ernte, Marktrecht, Denkmal). Wer beginnt, entscheidet der Zufall.
 * Erweiterung „Ritter & Piraten“ (Option erweiterung): Städte bringen Waren (Papier, Tuch, Münze), drei Zünfte lassen sich
 * mit Waren ausbauen (ab Stufe 4 Metropole), Ritter verteidigen die Insel gegen das Piratenschiff, das der Ereigniswürfel
 * heransegeln lässt. Statt Entwicklungskarten zu kaufen, gibt es Fortschrittskarten über den Ereigniswürfel.
 *
 * Zustand: { spieler, dran, erster, felder: [{ art, zahl }], nebel (Feld), bauten: [je Ecke null | { s, stadt, mauer?, metro? }],
 *            strassen: [je Kante null | Sitz], ritter: [je Ecke null | { s, stufe, aktiv, frisch?, befoerdert? }],
 *            karten: [{ holz, lehm, wolle, korn, erz, papier, tuch, muenze }], stapel, hand: [{ waechter, wegebau, ernte, markt }],
 *            frisch, gespielt, freiStrassen, wache, staerkste, denkmal, zunft: [{ handel, politik, wissen }], metro, piraten, angriffe,
 *            retter, phase: 'start' | 'wuerfeln' | 'nebel' | 'bauen', nachNebel, start: { pos, ecke }, wurf, ereignis, laengste, ende, log, saat }
 * Aktionen: { t: 'siedlung', ecke }, { t: 'strasse', kante }, { t: 'stadt', ecke }, { t: 'wuerfeln' }, { t: 'nebel', feld, opfer? },
 *           { t: 'tausch', geben, nehmen }, { t: 'kaufen' }, { t: 'spielen', art, r1?, r2?, r? }, { t: 'ende' },
 *           Erweiterung: { t: 'zunft', art }, { t: 'ritter', ecke }, { t: 'befoerdern', ecke }, { t: 'aktivieren', ecke },
 *           { t: 'vertreiben', ecke }, { t: 'mauer', ecke }
 */
;(function () {
  'use strict'
  const H = typeof module !== 'undefined' && module.exports ? require('../gruppe-hilfe.js') : window.GruppenHilfe

  const ROHSTOFFE = ['holz', 'lehm', 'wolle', 'korn', 'erz']
  const WAREN = ['papier', 'tuch', 'muenze']
  const ALLE = ROHSTOFFE.concat(WAREN)
  const NAMEN = { holz: 'Holz', lehm: 'Lehm', wolle: 'Wolle', korn: 'Korn', erz: 'Erz', wueste: 'Wüste', papier: 'Papier', tuch: 'Tuch', muenze: 'Münze' }
  const WARE_VON = { holz: 'papier', wolle: 'tuch', erz: 'muenze' }
  const KOSTEN = {
    strasse: { holz: 1, lehm: 1 },
    siedlung: { holz: 1, lehm: 1, wolle: 1, korn: 1 },
    stadt: { korn: 2, erz: 3 },
    karte: { wolle: 1, korn: 1, erz: 1 },
    ritter: { wolle: 1, erz: 1 },
    befoerdern: { wolle: 1, erz: 1 },
    aktivieren: { korn: 1 },
    mauer: { lehm: 2 },
  }
  const VORRAT = { strasse: 15, siedlung: 5, stadt: 4, mauer: 3, ritter: 2 } // ritter: je Stufe
  const ZUENFTE = ['handel', 'politik', 'wissen']
  const ZUNFT = {
    handel: { name: 'Handel', ware: 'tuch', faehigkeit: 'Waren 2 : 1 tauschen' },
    politik: { name: 'Politik', ware: 'muenze', faehigkeit: 'Ritter bis Stufe 3' },
    wissen: { name: 'Wissenschaft', ware: 'papier', faehigkeit: 'Wurf ohne Ertrag: 1 Rohstoff' },
  }
  const KARTEN = {
    waechter: { name: 'Wächter', text: 'Versetze den Nebel und nimm jemandem eine Karte weg.' },
    wegebau: { name: 'Wegebau', text: 'Baue zwei Straßen umsonst.' },
    ernte: { name: 'Gute Ernte', text: 'Nimm zwei Rohstoffe deiner Wahl.' },
    markt: { name: 'Marktrecht', text: 'Alle geben dir ihre Karten einer Sorte.' },
    denkmal: { name: 'Denkmal', text: 'Wird sofort aufgedeckt: 1 Punkt.' },
  }
  const SPIELKARTEN = ['waechter', 'wegebau', 'ernte', 'markt']
  const EREIGNIS = ['schiff', 'schiff', 'schiff', 'handel', 'politik', 'wissen']
  const PIRATEN_WEG = 7
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

  const leer = () => ({ holz: 0, lehm: 0, wolle: 0, korn: 0, erz: 0, papier: 0, tuch: 0, muenze: 0 })
  const leereHand = () => ({ waechter: 0, wegebau: 0, ernte: 0, markt: 0 })
  const summe = (k) => ALLE.reduce((a, r) => a + (k[r] || 0), 0)
  const kann = (k, kosten) => !!k && Object.keys(kosten).every((r) => k[r] >= kosten[r])
  const zahle = (k, kosten) => Object.keys(kosten).forEach((r) => (k[r] -= kosten[r]))
  const anzahl = (z, s, art) => (art === 'strasse' ? z.strassen.filter((x) => x === s).length : z.bauten.filter((b) => b && b.s === s && !!b.stadt === (art === 'stadt')).length)
  const ew = (z) => !!(z.optionen && z.optionen.erweiterung)
  const nebelAktiv = (z) => !ew(z) || z.angriffe > 0
  const mauern = (z, s) => z.bauten.filter((b) => b && b.s === s && b.mauer).length
  const handLimit = (z, s) => 7 + (ew(z) ? 2 * mauern(z, s) : 0)
  const ritterZahl = (z, s, stufe) => z.ritter.filter((r) => r && r.s === s && (!stufe || r.stufe === stufe)).length
  const abwehr = (z, s) => z.ritter.reduce((a, r) => a + (r && r.s === s && r.aktiv ? r.stufe : 0), 0)
  const staerke = (z) => z.bauten.filter((b) => b && b.stadt).length
  /** Tauschkurs mit der Bank: 4 : 1, Waren ab Handel 3 nur 2 : 1. */
  const kurs = (z, s, r) => (ew(z) && WAREN.includes(r) && z.zunft[s].handel >= 3 ? 2 : 4)
  const spielbar = (z, s, art) => (z.hand[s][art] || 0) - (s === z.dran ? z.frisch[art] || 0 : 0) > 0

  function siegpunkte(z, s) {
    let p = 0
    z.bauten.forEach((b) => b && b.s === s && (p += b.stadt ? 2 : 1))
    if (z.laengste === s) p += 2
    if (z.staerkste === s) p += 2
    p += (z.denkmal ? z.denkmal[s] : 0) + (z.retter ? z.retter[s] : 0)
    if (z.metro) ZUENFTE.forEach((t) => z.metro[t] === s && (p += 2))
    return p
  }

  /** Abstandsregel: Ecke frei (auch ohne Ritter) und alle Nachbarecken ohne Bauten. */
  const frei = (z, e) => !z.bauten[e] && !z.ritter[e] && ECKEN[e].nachbarn.every((n) => !z.bauten[n])
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
      const bau = z.bauten[e] || z.ritter[e]
      if (bau && bau.s === s) return true
      if (bau && bau.s !== s) return false // fremde Siedlung oder fremder Ritter unterbricht
      return ECKEN[e].kanten.some((x) => x !== k && z.strassen[x] === s)
    })
  }
  function ritterErlaubt(z, s, e) {
    return Number.isInteger(e) && e >= 0 && e < ECKEN.length && !z.bauten[e] && !z.ritter[e] && anStrasse(z, s, e)
  }
  /** Ritter, der den Nebel vertreiben kann: eigener, aktiver Ritter an einem Eckpunkt des Nebelfelds. */
  function kannVertreiben(z, s, e) {
    const r = z.ritter[e]
    return !!r && r.s === s && r.aktiv && !r.frisch && nebelAktiv(z) && ECKEN[e].felder.includes(z.nebel)
  }
  function kannBefoerdern(z, s, e) {
    const r = Number.isInteger(e) && z.ritter[e]
    if (!r || r.s !== s || r.stufe >= 3 || r.befoerdert) return false
    if (r.stufe + 1 === 3 && z.zunft[s].politik < 3) return false
    return ritterZahl(z, s, r.stufe + 1) < VORRAT.ritter
  }

  /** Längste zusammenhängende Straße eines Spielers (fremde Bauten und Ritter unterbrechen). */
  function strassenLaenge(z, s) {
    let best = 0
    const eigene = z.strassen.map((x, i) => (x === s ? i : -1)).filter((i) => i >= 0)
    function tiefe(e, benutzt) {
      let m = 0
      const bau = z.bauten[e] || z.ritter[e]
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
  /** Stärkste Wache: wer zuerst 3 Wächter ausgespielt hat; wer mehr ausspielt, übernimmt sie. */
  function staerksteNeu(z, s) {
    const h = z.staerkste
    if (z.wache[s] >= 3 && (h < 0 || (h !== s && z.wache[s] > z.wache[h]))) {
      z.staerkste = s
      H.melde(z, H.name(z, s) + ' hat jetzt die stärkste Wache (' + z.wache[s] + ' Wächter).')
    }
  }

  function pruefeSieg(z, s) {
    if (!z.ende && z.phase !== 'start' && siegpunkte(z, s) >= z.optionen.ziel) {
      z.ende = { sieger: [s], text: H.name(z, s) + ' erreicht ' + siegpunkte(z, s) + ' Punkte und gewinnt!' }
      H.melde(z, z.ende.text)
    }
  }

  function neu(spieler, optionen, saat) {
    const o = Object.assign({ ziel: 10, erweiterung: false }, optionen || {})
    o.erweiterung = !!o.erweiterung
    const n = spieler.length
    const z = {
      spieler, optionen: o, saat: saat >>> 0, dran: 0, erster: 0, felder: [], nebel: 0,
      bauten: ECKEN.map(() => null), strassen: KANTEN.map(() => null), ritter: ECKEN.map(() => null),
      karten: spieler.map(leer), stapel: [], hand: spieler.map(leereHand), frisch: leereHand(), gespielt: false, freiStrassen: 0,
      wache: spieler.map(() => 0), staerkste: -1, denkmal: spieler.map(() => 0),
      zunft: spieler.map(() => ({ handel: 0, politik: 0, wissen: 0 })), metro: { handel: -1, politik: -1, wissen: -1 },
      piraten: 0, angriffe: 0, retter: spieler.map(() => 0),
      phase: 'start', nachNebel: null, start: { pos: 0, ecke: -1 }, wurf: null, ereignis: null, laengste: -1, tausche: 0, ende: null, log: [],
    }
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
    const stapel = o.erweiterung
      ? { wegebau: 4, ernte: 4, markt: 4, denkmal: 3 }
      : { waechter: 14, wegebau: 2, ernte: 2, markt: 2, denkmal: 5 }
    z.stapel = H.mische(z, Object.keys(stapel).flatMap((a) => Array(stapel[a]).fill(a)))
    z.erster = H.ganz(z, n)
    z.dran = z.erster
    H.melde(z, 'Jeder setzt zwei Siedlungen mit je einer Straße – erst der Reihe nach, dann rückwärts.')
    H.melde(z, 'Das Los hat entschieden: ' + H.name(z, z.erster) + ' beginnt.')
    return z
  }
  const startReihe = (z) => {
    const n = z.spieler.length
    const vor = Array.from({ length: n }, (_, i) => (z.erster + i) % n)
    return vor.concat(vor.slice().reverse())
  }

  function verteile(z, zahl) {
    const bekam = z.spieler.map(leer)
    const mitWaren = ew(z)
    z.felder.forEach((f, fi) => {
      if (f.zahl !== zahl || fi === z.nebel) return
      FELDER[fi].ecken.forEach((e) => {
        const b = z.bauten[e]
        if (!b) return
        const gib = (r, n) => {
          z.karten[b.s][r] += n
          bekam[b.s][r] += n
        }
        if (!b.stadt) gib(f.art, 1)
        else if (mitWaren && WARE_VON[f.art]) {
          gib(f.art, 1)
          gib(WARE_VON[f.art], 1)
        } else gib(f.art, 2)
      })
    })
    bekam.forEach((k, s) => {
      const t = ALLE.filter((r) => k[r]).map((r) => k[r] + ' ' + NAMEN[r]).join(', ')
      if (t) H.melde(z, H.name(z, s) + ' bekommt ' + t + '.')
      else if (mitWaren && z.zunft[s].wissen >= 3) {
        const r = ROHSTOFFE.slice().sort((a, b) => z.karten[s][a] - z.karten[s][b])[0]
        z.karten[s][r]++
        H.melde(z, H.name(z, s) + ' bekommt dank der Wissenschaft 1 ' + NAMEN[r] + '.')
      }
    })
  }

  /** Karte vom Stapel ziehen (Kauf im Grundspiel oder Fortschrittskarte in der Erweiterung). */
  function ziehe(z, s, gekauft) {
    if (!z.stapel.length) return null
    const art = z.stapel.pop()
    if (art === 'denkmal') {
      z.denkmal[s]++
      H.melde(z, H.name(z, s) + ' bekommt ein Denkmal (1 Punkt).')
    } else {
      z.hand[s][art]++
      if (gekauft && s === z.dran) z.frisch[art]++
    }
    return art
  }

  function metroGeben(z, t, s) {
    const stadt = z.bauten.findIndex((b) => b && b.s === s && b.stadt && !b.metro)
    if (stadt < 0) return
    const alt = z.metro[t]
    if (alt >= 0) z.bauten.forEach((b) => b && b.metro === t && delete b.metro)
    z.bauten[stadt].metro = t
    z.metro[t] = s
    H.melde(z, H.name(z, s) + (alt >= 0 ? ' übernimmt' : ' gründet') + ' die Metropole des ' + ZUNFT[t].name + 's (2 Punkte).')
  }

  function angriff(z) {
    const st = staerke(z)
    const ab = z.spieler.map((_, s) => abwehr(z, s))
    const gesamt = ab.reduce((a, b) => a + b, 0)
    H.melde(z, 'Die Piraten legen an! Stärke ' + st + ' (Städte) gegen Abwehr ' + gesamt + ' (aktive Ritter).')
    if (!st) H.melde(z, 'Ohne Städte finden die Piraten nichts und segeln wieder ab.')
    else if (gesamt >= st) {
      const max = Math.max(...ab)
      const wer = ab.map((x, s) => (x === max ? s : -1)).filter((s) => s >= 0)
      if (wer.length === 1) {
        z.retter[wer[0]]++
        H.melde(z, 'Abgewehrt! ' + H.name(z, wer[0]) + ' hat am stärksten verteidigt und wird Inselretter (1 Punkt).')
      } else {
        H.melde(z, 'Abgewehrt! Die besten Verteidiger bekommen eine Fortschrittskarte.')
        wer.forEach((s) => ziehe(z, s, false))
      }
    } else {
      const kandidaten = z.spieler.map((_, s) => s).filter((s) => z.bauten.some((b) => b && b.s === s && b.stadt && !b.metro))
      if (kandidaten.length) {
        const min = Math.min(...kandidaten.map((s) => ab[s]))
        kandidaten
          .filter((s) => ab[s] === min)
          .forEach((s) => {
            const orte = z.bauten.map((b, e) => (b && b.s === s && b.stadt && !b.metro ? e : -1)).filter((e) => e >= 0)
            orte.sort((a, b) => !!z.bauten[a].mauer - !!z.bauten[b].mauer)
            const b = z.bauten[orte[0]]
            b.stadt = false
            delete b.mauer
            H.melde(z, 'Die Piraten plündern eine Stadt von ' + H.name(z, s) + ' – sie wird wieder zur Siedlung.')
          })
      }
    }
    z.ritter.forEach((r) => r && (r.aktiv = false))
    z.piraten = 0
    z.angriffe++
    if (z.angriffe === 1) H.melde(z, 'Ab jetzt zieht bei einer 7 auch der Nebel weiter.')
  }

  function ereignis(z) {
    if (z.ereignis === 'schiff') {
      z.piraten++
      if (z.piraten >= PIRATEN_WEG) angriff(z)
      else H.melde(z, 'Das Piratenschiff segelt näher (' + z.piraten + ' von ' + PIRATEN_WEG + ').')
    }
  }
  function fortschritt(z) {
    const t = z.ereignis
    if (!ZUENFTE.includes(t)) return
    const rot = z.wurf[1]
    const n = z.spieler.length
    for (let i = 0; i < n; i++) {
      const s = (z.dran + i) % n
      const stufe = z.zunft[s][t]
      if (stufe >= 1 && rot <= stufe + 1 && z.stapel.length) {
        const art = ziehe(z, s, false)
        if (art && art !== 'denkmal') H.melde(z, H.name(z, s) + ' bekommt eine Fortschrittskarte (' + ZUNFT[t].name + ').')
      }
    }
  }

  function anwenden(z0, sitz, a) {
    if (!a || z0.ende || sitz !== z0.dran) return null
    const z = schritt(H.kopie(z0), sitz, a)
    if (z) pruefeSieg(z, sitz)
    return z
  }

  function schritt(z, sitz, a) {
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
          z.dran = z.erster
          H.melde(z, 'Alle haben gesetzt. ' + H.name(z, z.dran) + ' würfelt zuerst.')
        } else z.dran = reihe[z.start.pos]
        return z
      }
      return null
    }
    if (a.t === 'wuerfeln') {
      if (z.phase !== 'wuerfeln') return null
      z.wurf = [1 + H.ganz(z, 6), 1 + H.ganz(z, 6)]
      const s = z.wurf[0] + z.wurf[1]
      z.ereignis = ew(z) ? EREIGNIS[H.ganz(z, 6)] : null
      H.melde(z, H.name(z, sitz) + ' würfelt ' + s + '.')
      z.tausche = 0
      if (z.ereignis) ereignis(z)
      if (s === 7) {
        z.karten.forEach((k, sp) => {
          const n = summe(k)
          if (n <= handLimit(z, sp)) return
          const weg = Math.floor(n / 2)
          for (let i = 0; i < weg; i++) {
            const stapel = ALLE.flatMap((r) => Array(k[r]).fill(r))
            k[stapel[H.ganz(z, stapel.length)]]--
          }
          H.melde(z, H.name(z, sp) + ' hatte zu viele Karten und verliert ' + weg + '.')
        })
        if (nebelAktiv(z)) {
          z.phase = 'nebel'
          z.nachNebel = 'bauen'
        } else {
          H.melde(z, 'Der Nebel ruht, bis die Piraten zum ersten Mal angelegt haben.')
          z.phase = 'bauen'
        }
      } else {
        verteile(z, s)
        z.phase = 'bauen'
      }
      if (z.ereignis) fortschritt(z)
      return z
    }
    if (a.t === 'nebel') {
      if (z.phase !== 'nebel' || !Number.isInteger(a.feld) || a.feld < 0 || a.feld >= 19 || a.feld === z.nebel) return null
      const opfer = nebelOpfer(z, sitz, a.feld)
      if (opfer.length && !opfer.includes(a.opfer)) return null
      z.nebel = a.feld
      if (opfer.length) {
        const k = z.karten[a.opfer]
        const stapel = ALLE.flatMap((r) => Array(k[r]).fill(r))
        const r = stapel[H.ganz(z, stapel.length)]
        k[r]--
        karten[r]++
        H.melde(z, H.name(z, sitz) + ' schickt den Nebel weiter und nimmt ' + H.name(z, a.opfer) + ' eine Karte weg.')
      } else H.melde(z, H.name(z, sitz) + ' schickt den Nebel weiter.')
      z.phase = z.nachNebel || 'bauen'
      z.nachNebel = null
      return z
    }
    if (a.t === 'spielen') {
      const art = a.art
      if (!SPIELKARTEN.includes(art) || z.gespielt || !spielbar(z, sitz, art)) return null
      if (z.phase !== 'bauen' && !(z.phase === 'wuerfeln' && art === 'waechter')) return null
      if (art === 'waechter') {
        if (!nebelAktiv(z)) return null
        z.wache[sitz]++
        H.melde(z, H.name(z, sitz) + ' spielt einen Wächter.')
        staerksteNeu(z, sitz)
        z.nachNebel = z.phase
        z.phase = 'nebel'
      } else if (art === 'wegebau') {
        const n = Math.min(2, VORRAT.strasse - anzahl(z, sitz, 'strasse'))
        if (n <= 0) return null
        z.freiStrassen = n
        H.melde(z, H.name(z, sitz) + ' spielt Wegebau: ' + n + ' Straße' + (n > 1 ? 'n' : '') + ' umsonst.')
      } else if (art === 'ernte') {
        if (!ROHSTOFFE.includes(a.r1) || !ROHSTOFFE.includes(a.r2)) return null
        karten[a.r1]++
        karten[a.r2]++
        H.melde(z, H.name(z, sitz) + ' spielt Gute Ernte und nimmt ' + (a.r1 === a.r2 ? '2 ' + NAMEN[a.r1] : NAMEN[a.r1] + ' und ' + NAMEN[a.r2]) + '.')
      } else if (art === 'markt') {
        if (!(ew(z) ? ALLE : ROHSTOFFE).includes(a.r)) return null
        let n = 0
        z.karten.forEach((k, o) => {
          if (o === sitz) return
          n += k[a.r]
          k[a.r] = 0
        })
        karten[a.r] += n
        H.melde(z, H.name(z, sitz) + ' spielt Marktrecht und bekommt ' + n + ' ' + NAMEN[a.r] + '.')
      }
      z.hand[sitz][art]--
      z.gespielt = true
      if (art !== 'waechter') laengsteNeu(z)
      return z
    }
    if (z.phase !== 'bauen') return null
    if (a.t === 'siedlung') {
      if (!kann(karten, KOSTEN.siedlung) || anzahl(z, sitz, 'siedlung') >= VORRAT.siedlung || !siedlungErlaubt(z, sitz, a.ecke)) return null
      zahle(karten, KOSTEN.siedlung)
      z.bauten[a.ecke] = { s: sitz, stadt: false }
      H.melde(z, H.name(z, sitz) + ' baut eine Siedlung.')
      laengsteNeu(z)
      return z
    }
    if (a.t === 'stadt') {
      const b = Number.isInteger(a.ecke) && z.bauten[a.ecke]
      if (!b || b.s !== sitz || b.stadt || !kann(karten, KOSTEN.stadt) || anzahl(z, sitz, 'stadt') >= VORRAT.stadt) return null
      zahle(karten, KOSTEN.stadt)
      b.stadt = true
      H.melde(z, H.name(z, sitz) + ' baut eine Stadt.')
      // Zünfte ab Stufe 4 warten auf eine freie Stadt für die Metropole
      if (ew(z)) ZUENFTE.forEach((t) => z.zunft[sitz][t] >= 4 && z.metro[t] < 0 && metroGeben(z, t, sitz))
      return z
    }
    if (a.t === 'strasse') {
      const umsonst = z.freiStrassen > 0
      if ((!umsonst && !kann(karten, KOSTEN.strasse)) || anzahl(z, sitz, 'strasse') >= VORRAT.strasse || !strasseErlaubt(z, sitz, a.kante)) return null
      if (umsonst) z.freiStrassen--
      else zahle(karten, KOSTEN.strasse)
      z.strassen[a.kante] = sitz
      laengsteNeu(z)
      return z
    }
    if (a.t === 'tausch') {
      const sorten = ew(z) ? ALLE : ROHSTOFFE
      if (!sorten.includes(a.geben) || !sorten.includes(a.nehmen) || a.geben === a.nehmen) return null
      const n = kurs(z, sitz, a.geben)
      if (karten[a.geben] < n) return null
      karten[a.geben] -= n
      karten[a.nehmen]++
      z.tausche++
      H.melde(z, H.name(z, sitz) + ' tauscht ' + n + ' ' + NAMEN[a.geben] + ' gegen 1 ' + NAMEN[a.nehmen] + '.')
      return z
    }
    if (a.t === 'kaufen') {
      if (ew(z) || !z.stapel.length || !kann(karten, KOSTEN.karte)) return null
      zahle(karten, KOSTEN.karte)
      H.melde(z, H.name(z, sitz) + ' kauft eine Entwicklungskarte.')
      ziehe(z, sitz, true)
      return z
    }
    if (a.t === 'ende') {
      z.dran = (z.dran + 1) % z.spieler.length
      z.phase = 'wuerfeln'
      z.wurf = null
      z.ereignis = null
      z.frisch = leereHand()
      z.gespielt = false
      z.freiStrassen = 0
      z.ritter.forEach((r) => {
        if (!r) return
        delete r.frisch
        delete r.befoerdert
      })
      return z
    }
    // ---------- Erweiterung ----------
    if (!ew(z)) return null
    if (a.t === 'zunft') {
      const t = a.art
      if (!ZUENFTE.includes(t) || !anzahl(z, sitz, 'stadt')) return null
      const stufe = z.zunft[sitz][t]
      const ware = ZUNFT[t].ware
      if (stufe >= 5 || karten[ware] < stufe + 1) return null
      karten[ware] -= stufe + 1
      z.zunft[sitz][t] = stufe + 1
      H.melde(z, H.name(z, sitz) + ' baut die Zunft ' + ZUNFT[t].name + ' auf Stufe ' + (stufe + 1) + ' aus.' + (stufe + 1 === 3 ? ' Neu: ' + ZUNFT[t].faehigkeit + '.' : ''))
      const h = z.metro[t]
      if (stufe + 1 >= 4 && h !== sitz && (h < 0 || (stufe + 1 === 5 && z.zunft[h][t] < 5))) metroGeben(z, t, sitz)
      return z
    }
    if (a.t === 'ritter') {
      if (!kann(karten, KOSTEN.ritter) || ritterZahl(z, sitz, 1) >= VORRAT.ritter || !ritterErlaubt(z, sitz, a.ecke)) return null
      zahle(karten, KOSTEN.ritter)
      z.ritter[a.ecke] = { s: sitz, stufe: 1, aktiv: false }
      H.melde(z, H.name(z, sitz) + ' stellt einen Ritter auf.')
      laengsteNeu(z)
      return z
    }
    if (a.t === 'befoerdern') {
      if (!kann(karten, KOSTEN.befoerdern) || !kannBefoerdern(z, sitz, a.ecke)) return null
      zahle(karten, KOSTEN.befoerdern)
      const r = z.ritter[a.ecke]
      r.stufe++
      r.befoerdert = true
      H.melde(z, H.name(z, sitz) + ' befördert einen Ritter auf Stufe ' + r.stufe + '.')
      return z
    }
    if (a.t === 'aktivieren') {
      const r = Number.isInteger(a.ecke) && z.ritter[a.ecke]
      if (!r || r.s !== sitz || r.aktiv || !kann(karten, KOSTEN.aktivieren)) return null
      zahle(karten, KOSTEN.aktivieren)
      r.aktiv = true
      r.frisch = true
      H.melde(z, H.name(z, sitz) + ' rüstet einen Ritter aus.')
      return z
    }
    if (a.t === 'vertreiben') {
      if (!kannVertreiben(z, sitz, a.ecke)) return null
      z.ritter[a.ecke].aktiv = false
      H.melde(z, H.name(z, sitz) + ' vertreibt mit einem Ritter den Nebel.')
      z.nachNebel = 'bauen'
      z.phase = 'nebel'
      return z
    }
    if (a.t === 'mauer') {
      const b = Number.isInteger(a.ecke) && z.bauten[a.ecke]
      if (!b || b.s !== sitz || !b.stadt || b.mauer || mauern(z, sitz) >= VORRAT.mauer || !kann(karten, KOSTEN.mauer)) return null
      zahle(karten, KOSTEN.mauer)
      b.mauer = true
      H.melde(z, H.name(z, sitz) + ' baut eine Stadtmauer.')
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
  /** Steht der Nebel auf einem Feld, an dem s baut? */
  const nebelSchadet = (z, s) => z.felder[z.nebel].zahl > 0 && FELDER[z.nebel].ecken.some((e) => z.bauten[e] && z.bauten[e].s === s)

  function nebelZiel(z, s) {
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

  function ki(z, s) {
    const karten = z.karten[s]
    const mitEw = ew(z)
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
    if (z.phase === 'wuerfeln') {
      if (!z.gespielt && spielbar(z, s, 'waechter') && nebelAktiv(z) && nebelSchadet(z, s)) return { t: 'spielen', art: 'waechter' }
      return { t: 'wuerfeln' }
    }
    if (z.phase === 'nebel') return nebelZiel(z, s)

    // ---------- bauen ----------
    if (z.freiStrassen > 0) {
      const k = strasseZiel(z, s)
      if (k >= 0) return { t: 'strasse', kante: k }
    }
    const stadtOrte = z.bauten.map((b, e) => (b && b.s === s && !b.stadt ? e : -1)).filter((e) => e >= 0)
    const stadtMoeglich = stadtOrte.length && anzahl(z, s, 'stadt') < VORRAT.stadt
    if (kann(karten, KOSTEN.stadt) && stadtMoeglich) return { t: 'stadt', ecke: besteEcke(z, s, stadtOrte) }

    if (mitEw) {
      // Zünfte ausbauen, wenn Waren reichen
      if (anzahl(z, s, 'stadt')) {
        const t = ZUENFTE.filter((x) => z.zunft[s][x] < 5 && karten[ZUNFT[x].ware] >= z.zunft[s][x] + 1).sort((x, y) => z.zunft[s][x] - z.zunft[s][y])[0]
        if (t) return { t: 'zunft', art: t }
      }
      const eigeneRitter = z.ritter.map((r, e) => (r && r.s === s ? e : -1)).filter((e) => e >= 0)
      // Nebel mit Ritter vertreiben
      if (nebelSchadet(z, s)) {
        const e = eigeneRitter.find((x) => kannVertreiben(z, s, x))
        if (e !== undefined) return { t: 'vertreiben', ecke: e }
      }
      // Verteidigung gegen die Piraten
      const gefahr = z.piraten >= 3 && staerke(z) > 0
      const eigeneStaedte = anzahl(z, s, 'stadt')
      if (gefahr && (eigeneStaedte || z.piraten >= 5)) {
        const inaktiv = eigeneRitter.filter((e) => !z.ritter[e].aktiv)
        if (inaktiv.length && kann(karten, KOSTEN.aktivieren) && (!kann(karten, KOSTEN.stadt) || karten.korn >= 3)) {
          inaktiv.sort((x, y) => z.ritter[y].stufe - z.ritter[x].stufe)
          return { t: 'aktivieren', ecke: inaktiv[0] }
        }
        if (kann(karten, KOSTEN.ritter) && ritterZahl(z, s, 1) < VORRAT.ritter && karten.erz >= (stadtMoeglich ? 4 : 1)) {
          const orte = ECKEN.map((_, e) => e).filter((e) => ritterErlaubt(z, s, e))
          if (orte.length) return { t: 'ritter', ecke: orte.sort((x, y) => eckWert(z, y) - eckWert(z, x))[0] }
        }
        if (z.piraten >= 4 && kann(karten, KOSTEN.befoerdern) && karten.erz >= (stadtMoeglich ? 4 : 1)) {
          const e = eigeneRitter.find((x) => kannBefoerdern(z, s, x))
          if (e !== undefined) return { t: 'befoerdern', ecke: e }
        }
      }
    }

    const orte = ECKEN.map((_, e) => e).filter((e) => frei(z, e) && anStrasse(z, s, e))
    if (kann(karten, KOSTEN.siedlung) && orte.length && anzahl(z, s, 'siedlung') < VORRAT.siedlung) return { t: 'siedlung', ecke: besteEcke(z, s, orte) }
    const strassenOk = anzahl(z, s, 'strasse') < VORRAT.strasse && (!orte.length || (anzahl(z, s, 'siedlung') >= VORRAT.siedlung ? false : karten.holz >= 2 && karten.lehm >= 2))
    if (kann(karten, KOSTEN.strasse) && strassenOk) {
      const k = strasseZiel(z, s)
      if (k >= 0) return { t: 'strasse', kante: k }
    }

    // Karten ausspielen
    if (!z.gespielt) {
      if (spielbar(z, s, 'waechter') && nebelAktiv(z) && nebelSchadet(z, s)) return { t: 'spielen', art: 'waechter' }
      if (spielbar(z, s, 'wegebau') && anzahl(z, s, 'strasse') < VORRAT.strasse && strasseZiel(z, s) >= 0) return { t: 'spielen', art: 'wegebau' }
      if (spielbar(z, s, 'ernte')) {
        const ziel = stadtMoeglich ? KOSTEN.stadt : KOSTEN.siedlung
        const fehlt = ROHSTOFFE.filter((r) => (ziel[r] || 0) > karten[r])
        const r1 = fehlt[0] || 'erz'
        const r2 = fehlt[1] || ((ziel[r1] || 0) - karten[r1] >= 2 ? r1 : 'korn')
        return { t: 'spielen', art: 'ernte', r1, r2 }
      }
      if (spielbar(z, s, 'markt')) {
        const sorten = mitEw ? ALLE : ROHSTOFFE
        const menge = (r) => z.karten.reduce((a, k, o) => a + (o === s ? 0 : k[r]), 0)
        const r = sorten.slice().sort((x, y) => menge(y) - menge(x))[0]
        if (menge(r) >= 3) return { t: 'spielen', art: 'markt', r }
      }
      if (spielbar(z, s, 'waechter') && nebelAktiv(z) && z.wache[s] >= 2 && z.staerkste !== s) return { t: 'spielen', art: 'waechter' }
    }
    // Entwicklungskarte kaufen
    if (!mitEw && z.stapel.length && kann(karten, KOSTEN.karte) && (!stadtMoeglich || karten.korn < 2 || karten.erz >= 4)) return { t: 'kaufen' }
    // Stadtmauer, wenn viele Karten auf der Hand sind
    if (mitEw && karten.lehm >= 2 && summe(karten) > handLimit(z, s) - 1 && mauern(z, s) < VORRAT.mauer) {
      const e = z.bauten.findIndex((b) => b && b.s === s && b.stadt && !b.mauer)
      if (e >= 0) return { t: 'mauer', ecke: e }
    }

    // Tauschen: Überschuss gegen das, was für das nächste Ziel fehlt
    if (z.tausche < 3) {
      const ziel = stadtMoeglich && (karten.erz >= 2 || karten.korn >= 2) ? KOSTEN.stadt : orte.length ? KOSTEN.siedlung : !mitEw && z.stapel.length ? KOSTEN.karte : KOSTEN.strasse
      const fehlt = ROHSTOFFE.filter((r) => (ziel[r] || 0) > karten[r])
      const ueber = ROHSTOFFE.filter((r) => karten[r] - (ziel[r] || 0) >= 4)
      if (mitEw) WAREN.forEach((w) => z.zunft[s].handel >= 3 && karten[w] >= 2 && Object.keys(ZUNFT).every((t) => ZUNFT[t].ware !== w || z.zunft[s][t] >= 5 || karten[w] - 2 >= z.zunft[s][t] + 1) && ueber.push(w))
      if (fehlt.length && ueber.length) return { t: 'tausch', geben: ueber[0], nehmen: fehlt[0] }
    }
    return { t: 'ende' }
  }

  const punkte = (z, i) => siegpunkte(z, i) + ' P · ' + summe(z.karten[i]) + ' K'

  const api = {
    id: 'inselhandel', name: 'Inselhandel', min: 2, max: 4, standard: 3,
    ROHSTOFFE, WAREN, ALLE, NAMEN, WARE_VON, KOSTEN, VORRAT, ZUENFTE, ZUNFT, KARTEN, SPIELKARTEN, EREIGNIS, PIRATEN_WEG,
    R, FELDER, ECKEN, KANTEN, punktwert, summe, kann, anzahl, siegpunkte, frei, ew, nebelAktiv, handLimit, mauern, ritterZahl,
    abwehr, staerke, kurs, spielbar, siedlungErlaubt, strasseErlaubt, ritterErlaubt, kannVertreiben, kannBefoerdern,
    strassenLaenge, nebelOpfer, startReihe, neu, anwenden, ki, punkte,
    optionen: [
      { id: 'ziel', text: 'Ziel', werte: [[6, '6 (kurz)'], [8, '8'], [10, '10'], [13, '13']], start: 8 },
      { id: 'erweiterung', text: 'Erweiterung', werte: [[false, 'Grundspiel'], [true, 'Ritter & Piraten']], start: false },
    ],
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.Inselhandel = api
})()
