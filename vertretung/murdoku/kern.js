/*
 * Murdoku – Rechenkern: Haus mit Räumen und Möbeln, Hinweise, Löser (zählt Lösungen) und Erzeuger.
 * Browser: window.Murdoku, Node: module.exports.
 *
 * Regeln: Jede Person steht in genau einer Zelle; in jeder Zeile und jeder Spalte steht genau eine Person.
 * Möbel und das Opfer besetzen Zellen, auf denen niemand steht. Der Mörder ist die Person, die im Raum
 * des Opfers steht (dort steht genau eine). Die Hinweise legen die Plätze eindeutig fest.
 *
 * Eine Stellung ist ein Feld `pos` mit der Zelle jeder Person (Zelle = Zeile * n + Spalte, -1 = nicht gesetzt).
 */
;(function () {
  'use strict'

  const STUFEN = {
    leicht: { n: 5, raeume: 4, moebel: 3 },
    mittel: { n: 6, raeume: 5, moebel: 4 },
    schwer: { n: 7, raeume: 6, moebel: 5 },
  }

  // Räume mit der Form für „… war ___“
  const RAEUME = [
    { name: 'Küche', in: 'in der Küche' },
    { name: 'Salon', in: 'im Salon' },
    { name: 'Bibliothek', in: 'in der Bibliothek' },
    { name: 'Wintergarten', in: 'im Wintergarten' },
    { name: 'Labor', in: 'im Labor' },
    { name: 'Keller', in: 'im Keller' },
    { name: 'Atelier', in: 'im Atelier' },
    { name: 'Spielzimmer', in: 'im Spielzimmer' },
    { name: 'Werkstatt', in: 'in der Werkstatt' },
  ]
  const MOEBEL = [
    { id: 'sofa', name: 'Sofa', dativ: 'dem Sofa' },
    { id: 'tisch', name: 'Tisch', dativ: 'dem Tisch' },
    { id: 'pflanze', name: 'Pflanze', dativ: 'der Pflanze' },
    { id: 'kamin', name: 'Kamin', dativ: 'dem Kamin' },
    { id: 'regal', name: 'Regal', dativ: 'dem Regal' },
    { id: 'bett', name: 'Bett', dativ: 'dem Bett' },
  ]
  const PERSONEN = ['Alma', 'Ben', 'Cleo', 'Dino', 'Elli', 'Finn', 'Gus']

  // Gewichte der Hinweisarten je Stufe (0 = gibt es in dieser Stufe nicht)
  const GEWICHTE = {
    leicht: { raum: 5, moebel: 4, neben: 3, gleicherRaum: 3, allein: 2, rand: 2, nichtRaum: 1.5 },
    mittel: { raum: 3, moebel: 3, neben: 2, gleicherRaum: 2, allein: 2, rand: 1, innen: 1, nichtRaum: 2, nichtMoebel: 1, andererRaum: 1, links: 2, oben: 2 },
    schwer: { raum: 2, moebel: 2, neben: 2, gleicherRaum: 2, allein: 2, rand: 1, innen: 1, nichtRaum: 2, nichtMoebel: 1.5, andererRaum: 1.5, links: 2, oben: 2, schraeg: 2, nichtNeben: 1 },
  }

  function mischen(feld, zufall) {
    for (let i = feld.length - 1; i > 0; i--) {
      const j = Math.floor(zufall() * (i + 1))
      ;[feld[i], feld[j]] = [feld[j], feld[i]]
    }
    return feld
  }

  // ---------- Haus ----------

  /** Teilt das Quadrat zufällig in k zusammenhängende Räume (Wachstum von Keimzellen). */
  function raeumeWachsen(n, k, zufall) {
    const raum = new Array(n * n).fill(-1)
    mischen(Array.from({ length: n * n }, (_, i) => i), zufall)
      .slice(0, k)
      .forEach((z, i) => (raum[z] = i))
    for (let rest = n * n - k; rest > 0; rest--) {
      const kandidaten = []
      for (let z = 0; z < n * n; z++) {
        if (raum[z] < 0) continue
        const r = Math.floor(z / n)
        const c = z % n
        if (r > 0 && raum[z - n] < 0) kandidaten.push([z - n, raum[z]])
        if (r < n - 1 && raum[z + n] < 0) kandidaten.push([z + n, raum[z]])
        if (c > 0 && raum[z - 1] < 0) kandidaten.push([z - 1, raum[z]])
        if (c < n - 1 && raum[z + 1] < 0) kandidaten.push([z + 1, raum[z]])
      }
      const [zelle, r] = kandidaten[Math.floor(zufall() * kandidaten.length)]
      raum[zelle] = r
    }
    return raum
  }

  /** Findet zufällig eine Verteilung „eine Person je Zeile und Spalte“ auf den freien Zellen: Spalte je Zeile oder null. */
  function plaetzeSuchen(n, istFrei, zufall) {
    const spalteDerZeile = new Array(n).fill(-1)
    const belegt = new Array(n).fill(false)
    function rek(r) {
      if (r === n) return true
      for (const c of mischen(Array.from({ length: n }, (_, i) => i), zufall)) {
        if (belegt[c] || !istFrei(r * n + c)) continue
        belegt[c] = true
        spalteDerZeile[r] = c
        if (rek(r + 1)) return true
        belegt[c] = false
      }
      return false
    }
    return rek(0) ? spalteDerZeile : null
  }

  // ---------- Hinweise ----------

  /** Baut einen Hinweis. `a`, `b`: Personen; `w`: Raum- bzw. Möbelnummer. ok(pos) ist wahr, solange nichts widerspricht. */
  function hinweis(H, typ, a, b, w) {
    const n = H.n
    const raum = H.raum
    const R = (c) => Math.floor(c / n)
    const C = (c) => c % n
    const neben = (c, d) => Math.abs(R(c) - R(d)) + Math.abs(C(c) - C(d)) === 1
    const schraeg = (c, d) => Math.abs(R(c) - R(d)) === 1 && Math.abs(C(c) - C(d)) === 1
    const rand = (c) => R(c) === 0 || R(c) === n - 1 || C(c) === 0 || C(c) === n - 1
    const P = H.personen
    const A = P[a]
    const B = b != null ? P[b] : ''
    let ok
    let text
    let beteiligte = [a]
    switch (typ) {
      case 'raum':
        ok = (p) => p[a] < 0 || raum[p[a]] === w
        text = `${A} war ${H.raumNamen[w].in}.`
        break
      case 'nichtRaum':
        ok = (p) => p[a] < 0 || raum[p[a]] !== w
        text = `${A} war nicht ${H.raumNamen[w].in}.`
        break
      case 'moebel':
        ok = (p) => p[a] < 0 || neben(p[a], H.moebel[w].zelle)
        text = `${A} stand direkt neben ${H.moebel[w].dativ}.`
        break
      case 'nichtMoebel':
        ok = (p) => p[a] < 0 || !neben(p[a], H.moebel[w].zelle)
        text = `${A} stand nicht direkt neben ${H.moebel[w].dativ}.`
        break
      case 'rand':
        ok = (p) => p[a] < 0 || rand(p[a])
        text = `${A} stand am Rand des Hauses.`
        break
      case 'innen':
        ok = (p) => p[a] < 0 || !rand(p[a])
        text = `${A} stand nicht am Rand des Hauses.`
        break
      case 'allein':
        beteiligte = P.map((_, i) => i)
        ok = (p) => p[a] < 0 || p.every((q, i) => i === a || q < 0 || raum[q] !== raum[p[a]])
        text = `${A} war allein in seinem Raum.`
        break
      case 'gleicherRaum':
        beteiligte = [a, b]
        ok = (p) => p[a] < 0 || p[b] < 0 || raum[p[a]] === raum[p[b]]
        text = `${A} und ${B} waren im selben Raum.`
        break
      case 'andererRaum':
        beteiligte = [a, b]
        ok = (p) => p[a] < 0 || p[b] < 0 || raum[p[a]] !== raum[p[b]]
        text = `${A} und ${B} waren nicht im selben Raum.`
        break
      case 'neben':
        beteiligte = [a, b]
        ok = (p) => p[a] < 0 || p[b] < 0 || neben(p[a], p[b])
        text = `${A} stand direkt neben ${B} (waagerecht oder senkrecht).`
        break
      case 'nichtNeben':
        beteiligte = [a, b]
        ok = (p) => p[a] < 0 || p[b] < 0 || !neben(p[a], p[b])
        text = `${A} stand nicht direkt neben ${B} (waagerecht oder senkrecht).`
        break
      case 'schraeg':
        beteiligte = [a, b]
        ok = (p) => p[a] < 0 || p[b] < 0 || schraeg(p[a], p[b])
        text = `${A} stand schräg neben ${B}.`
        break
      case 'links':
        beteiligte = [a, b]
        ok = (p) => p[a] < 0 || p[b] < 0 || C(p[a]) < C(p[b])
        text = `${A} stand weiter links als ${B}.`
        break
      case 'oben':
        beteiligte = [a, b]
        ok = (p) => p[a] < 0 || p[b] < 0 || R(p[a]) < R(p[b])
        text = `${A} stand weiter oben als ${B}.`
        break
      default:
        throw new Error('Unbekannter Hinweis: ' + typ)
    }
    return { typ, a, b, w, text, ok, beteiligte }
  }

  /** Alle Hinweise, die für die Stellung `pos` stimmen (mit Gewicht der Art), als Liste. */
  function wahreHinweise(H, pos, stufe) {
    const g = GEWICHTE[stufe]
    const n = H.personen.length
    const liste = []
    const neu = (typ, a, b, w) => {
      if (!g[typ]) return
      const h = hinweis(H, typ, a, b, w)
      if (h.ok(pos)) liste.push({ h, gewicht: g[typ] })
    }
    for (let a = 0; a < n; a++) {
      for (let r = 0; r < H.raumNamen.length; r++) {
        neu('raum', a, null, r)
        neu('nichtRaum', a, null, r)
      }
      for (let m = 0; m < H.moebel.length; m++) {
        neu('moebel', a, null, m)
        neu('nichtMoebel', a, null, m)
      }
      neu('rand', a)
      neu('innen', a)
      neu('allein', a)
      for (let b = 0; b < n; b++) {
        if (a === b) continue
        neu('links', a, b)
        neu('oben', a, b)
        if (a < b) {
          neu('gleicherRaum', a, b)
          neu('andererRaum', a, b)
          neu('neben', a, b)
          neu('nichtNeben', a, b)
          neu('schraeg', a, b)
        }
      }
    }
    return liste
  }

  // ---------- Löser ----------

  /** Zählt Stellungen, die alle Hinweise erfüllen (höchstens `grenze`); liefert { anzahl, erste }. */
  function loesen(H, hinweise, grenze) {
    const n = H.personen.length
    const pos = new Array(n).fill(-1)
    const zeileBelegt = new Array(n).fill(false)
    const spalteBelegt = new Array(n).fill(false)
    // Zellen je Person: nur solche, die die Hinweise zu dieser Person allein schon erlauben
    const kandidaten = []
    for (let s = 0; s < n; s++) {
      const eigene = hinweise.filter((h) => h.beteiligte.length === 1 && h.a === s)
      kandidaten.push(
        H.frei.filter((z) => {
          pos[s] = z
          const gut = eigene.every((h) => h.ok(pos))
          pos[s] = -1
          return gut
        }),
      )
    }
    // Reihenfolge: zuerst die Personen mit den wenigsten Zellen, dann die mit den meisten Hinweisen
    const zahl = new Array(n).fill(0)
    for (const h of hinweise) for (const s of h.beteiligte) zahl[s]++
    const ordnung = Array.from({ length: n }, (_, i) => i).sort((x, y) => kandidaten[x].length - kandidaten[y].length || zahl[y] - zahl[x])
    // Hinweise werden geprüft, sobald die zuletzt gesetzte beteiligte Person an der Reihe war
    const rang = new Array(n)
    ordnung.forEach((s, i) => (rang[s] = i))
    const je = Array.from({ length: n }, () => [])
    for (const h of hinweise) {
      if (h.beteiligte.length === 1) continue
      for (const s of h.beteiligte) je[s].push(h)
    }
    let anzahl = 0
    let erste = null
    function rek(i) {
      if (i === n) {
        anzahl++
        if (!erste) erste = pos.slice()
        return anzahl >= grenze
      }
      const s = ordnung[i]
      for (const z of kandidaten[s]) {
        const r = Math.floor(z / n)
        const c = z % n
        if (zeileBelegt[r] || spalteBelegt[c]) continue
        pos[s] = z
        let gut = true
        for (const h of je[s]) {
          if (!h.ok(pos)) {
            gut = false
            break
          }
        }
        if (gut) {
          zeileBelegt[r] = spalteBelegt[c] = true
          const stopp = rek(i + 1)
          zeileBelegt[r] = spalteBelegt[c] = false
          if (stopp) {
            pos[s] = -1
            return true
          }
        }
        pos[s] = -1
      }
      return false
    }
    rek(0)
    return { anzahl, erste }
  }

  // ---------- Erzeuger ----------

  function hausBauen(st, zufall) {
    const { n, raeume: k, moebel: m } = st
    for (let versuch = 0; versuch < 2000; versuch++) {
      const raum = raeumeWachsen(n, k, zufall)
      const groesse = new Array(k).fill(0)
      raum.forEach((r) => groesse[r]++)
      if (Math.min(...groesse) < 3 || Math.max(...groesse) > Math.ceil(((n * n) / k) * 2)) continue
      const zellen = mischen(Array.from({ length: n * n }, (_, i) => i), zufall)
      const moebel = mischen(MOEBEL.slice(), zufall)
        .slice(0, m)
        .map((mb, i) => ({ ...mb, zelle: zellen[i] }))
      const opfer = zellen[m]
      const gesperrt = new Set([...moebel.map((x) => x.zelle), opfer])
      const frei = []
      for (let z = 0; z < n * n; z++) if (!gesperrt.has(z)) frei.push(z)
      const raumNamen = mischen(RAEUME.slice(), zufall).slice(0, k)
      const H = { n, raum, moebel, opfer, frei, raumNamen, personen: PERSONEN.slice(0, n) }
      // Stellung der Personen: eine je Zeile und Spalte, genau eine im Raum des Opfers
      for (let t = 0; t < 30; t++) {
        const spalte = plaetzeSuchen(n, (z) => !gesperrt.has(z), zufall)
        if (!spalte) break
        const zeileDerPerson = mischen(Array.from({ length: n }, (_, i) => i), zufall)
        const loesung = zeileDerPerson.map((r) => r * n + spalte[r])
        const imOpferRaum = loesung.filter((z) => raum[z] === raum[opfer]).length
        if (imOpferRaum === 1) return { H, loesung }
      }
    }
    throw new Error('Kein Haus gefunden')
  }

  /** Neues Rätsel: { n, raum, raumNamen, moebel, opfer, personen, hinweise, loesung, moerder }. */
  function erzeugen(stufe, zufall) {
    zufall = zufall || Math.random
    const st = STUFEN[stufe] || STUFEN.mittel
    stufe = STUFEN[stufe] ? stufe : 'mittel'
    const GRENZE = 60
    for (let versuch = 0; versuch < 200; versuch++) {
      const { H, loesung } = hausBauen(st, zufall)
      // Wahre Hinweise in gewichteter Zufallsreihenfolge
      const pool = wahreHinweise(H, loesung, stufe)
        .map((e) => ({ h: e.h, schluessel: -Math.log(1 - zufall()) / e.gewicht }))
        .sort((x, y) => x.schluessel - y.schluessel)
        .map((e) => e.h)
      let hinweise = []
      let stand = loesen(H, hinweise, GRENZE).anzahl
      for (const h of pool) {
        if (stand <= 1 || hinweise.length >= 30) break
        const neu = loesen(H, [...hinweise, h], GRENZE).anzahl
        if (neu < stand || (stand >= GRENZE && neu <= stand)) {
          hinweise.push(h)
          stand = neu
        }
      }
      if (stand !== 1) continue
      // Überflüssiges streichen (in Zufallsreihenfolge)
      for (const h of mischen(hinweise.slice(), zufall)) {
        const rest = hinweise.filter((x) => x !== h)
        if (loesen(H, rest, 2).anzahl === 1) hinweise = rest
      }
      const pruef = loesen(H, hinweise, 2)
      if (pruef.anzahl !== 1) continue
      // Für die Anzeige: nach Art und Person ordnen, damit Ähnliches zusammensteht
      hinweise.sort((x, y) => x.a - y.a || x.typ.localeCompare(y.typ))
      const moerder = loesung.findIndex((z) => H.raum[z] === H.raum[H.opfer])
      return {
        stufe,
        n: H.n,
        raum: H.raum,
        raumNamen: H.raumNamen,
        moebel: H.moebel,
        opfer: H.opfer,
        frei: H.frei,
        personen: H.personen,
        hinweise,
        loesung,
        moerder,
      }
    }
    throw new Error('Kein Rätsel gefunden')
  }

  /** Prüft eine Stellung gegen das Rätsel: { fertig, falsch: Personen, verletzt: Hinweise, doppelt: Zellen }. */
  function pruefen(R, pos) {
    const n = R.n
    const falsch = []
    pos.forEach((z, s) => {
      if (z >= 0 && z !== R.loesung[s]) falsch.push(s)
    })
    const verletzt = R.hinweise.filter((h) => !h.ok(pos))
    const doppelt = new Set()
    for (let s = 0; s < pos.length; s++) {
      for (let t = s + 1; t < pos.length; t++) {
        if (pos[s] < 0 || pos[t] < 0) continue
        if (Math.floor(pos[s] / n) === Math.floor(pos[t] / n) || pos[s] % n === pos[t] % n) {
          doppelt.add(pos[s])
          doppelt.add(pos[t])
        }
      }
    }
    return { fertig: pos.every((z, s) => z === R.loesung[s]), falsch, verletzt, doppelt }
  }

  const Murdoku = { STUFEN, RAEUME, MOEBEL, PERSONEN, erzeugen, loesen, pruefen }
  if (typeof module !== 'undefined' && module.exports) module.exports = Murdoku
  else window.Murdoku = Murdoku
})()
