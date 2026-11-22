/*
 * Schach – vollständige Regeln und Rechner. Reine Funktionen (Browser: window.Schach, Node: module.exports).
 *
 * Felder 0…63: a8 = 0, b8 = 1 … h8 = 7, a7 = 8 … h1 = 63 (Zeile 0 oben, wie auf dem Brett gezeichnet).
 * Figuren: P N B R Q K (weiß, groß), p n b r q k (schwarz, klein); leeres Feld = ''.
 * Zustand: { b: 64 Felder, amZug: 'w' | 'b', rochade: { K, Q, k, q }, ep: Feld | -1, halb: Halbzüge ohne Schlag/Bauernzug,
 *            voll: Zugnummer, hist: { Stellung: Anzahl }, ende: null | { sieger: 'w' | 'b' | null, grund } , imSchach: bool }
 * Zug: { von, nach, promo?: 'Q' | 'R' | 'B' | 'N' }
 */
;(function () {
  'use strict'

  const istWeiss = (p) => p !== '' && p === p.toUpperCase()
  const farbe = (p) => (p === '' ? null : istWeiss(p) ? 'w' : 'b')
  const SPRUNG = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
  const KOENIG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
  const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  const GERADE = [[-1, 0], [1, 0], [0, -1], [0, 1]]

  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

  function ausFen(fen) {
    const [teile, seite, rech, ep, halb, voll] = fen.split(' ')
    const b = []
    for (const ch of teile) {
      if (ch === '/') continue
      if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) b.push('')
      else b.push(ch)
    }
    const s = {
      b,
      amZug: seite,
      rochade: { K: rech.includes('K'), Q: rech.includes('Q'), k: rech.includes('k'), q: rech.includes('q') },
      ep: ep === '-' ? -1 : (8 - +ep[1]) * 8 + (ep.charCodeAt(0) - 97),
      halb: +halb || 0,
      voll: +voll || 1,
      hist: {},
      ende: null,
      imSchach: false,
    }
    s.hist[schluessel(s)] = 1
    abschliessen(s)
    return s
  }

  function neu() {
    return ausFen(START)
  }

  function schluessel(s) {
    return s.b.map((p) => p || '.').join('') + s.amZug + (s.rochade.K ? 'K' : '') + (s.rochade.Q ? 'Q' : '') + (s.rochade.k ? 'k' : '') + (s.rochade.q ? 'q' : '') + s.ep
  }

  /** Wird das Feld sq von der Farbe `von` angegriffen? */
  function angegriffen(b, sq, von) {
    const r = sq >> 3
    const c = sq & 7
    // Bauern
    const pr = von === 'w' ? r + 1 : r - 1
    const bauer = von === 'w' ? 'P' : 'p'
    if (pr >= 0 && pr < 8) {
      if (c > 0 && b[pr * 8 + c - 1] === bauer) return true
      if (c < 7 && b[pr * 8 + c + 1] === bauer) return true
    }
    const springer = von === 'w' ? 'N' : 'n'
    for (const [dr, dc] of SPRUNG) {
      const rr = r + dr
      const cc = c + dc
      if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === springer) return true
    }
    const koenig = von === 'w' ? 'K' : 'k'
    for (const [dr, dc] of KOENIG) {
      const rr = r + dr
      const cc = c + dc
      if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === koenig) return true
    }
    const dame = von === 'w' ? 'Q' : 'q'
    const laeufer = von === 'w' ? 'B' : 'b'
    const turm = von === 'w' ? 'R' : 'r'
    for (const [dr, dc] of DIAG) {
      let rr = r + dr
      let cc = c + dc
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
        const p = b[rr * 8 + cc]
        if (p) {
          if (p === dame || p === laeufer) return true
          break
        }
        rr += dr
        cc += dc
      }
    }
    for (const [dr, dc] of GERADE) {
      let rr = r + dr
      let cc = c + dc
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
        const p = b[rr * 8 + cc]
        if (p) {
          if (p === dame || p === turm) return true
          break
        }
        rr += dr
        cc += dc
      }
    }
    return false
  }

  const koenigsFeld = (b, f) => b.indexOf(f === 'w' ? 'K' : 'k')

  /** Alle Züge, die die Regeln der Figuren erlauben (König darf dabei noch im Schach stehen). */
  function scheinzuege(s) {
    const l = []
    const b = s.b
    const ich = s.amZug
    const gegner = ich === 'w' ? 'b' : 'w'
    for (let v = 0; v < 64; v++) {
      const p = b[v]
      if (!p || farbe(p) !== ich) continue
      const r = v >> 3
      const c = v & 7
      const typ = p.toUpperCase()
      if (typ === 'P') {
        const richtung = ich === 'w' ? -1 : 1
        const startZeile = ich === 'w' ? 6 : 1
        const letzteZeile = ich === 'w' ? 0 : 7
        const hinzu = (nach) => {
          if (nach >> 3 === letzteZeile) for (const q of ['Q', 'R', 'B', 'N']) l.push({ von: v, nach, promo: q })
          else l.push({ von: v, nach })
        }
        const vorn = (r + richtung) * 8 + c
        if (r + richtung >= 0 && r + richtung < 8 && !b[vorn]) {
          hinzu(vorn)
          if (r === startZeile && !b[(r + 2 * richtung) * 8 + c]) l.push({ von: v, nach: (r + 2 * richtung) * 8 + c })
        }
        for (const dc of [-1, 1]) {
          const cc = c + dc
          const rr = r + richtung
          if (cc < 0 || cc > 7 || rr < 0 || rr > 7) continue
          const ziel = rr * 8 + cc
          if (b[ziel] && farbe(b[ziel]) === gegner) hinzu(ziel)
          else if (ziel === s.ep) l.push({ von: v, nach: ziel })
        }
      } else if (typ === 'N' || typ === 'K') {
        for (const [dr, dc] of typ === 'N' ? SPRUNG : KOENIG) {
          const rr = r + dr
          const cc = c + dc
          if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue
          const ziel = rr * 8 + cc
          if (!b[ziel] || farbe(b[ziel]) === gegner) l.push({ von: v, nach: ziel })
        }
        if (typ === 'K') {
          const zeile = ich === 'w' ? 7 : 0
          if (v === zeile * 8 + 4 && !angegriffen(b, v, gegner)) {
            const K = ich === 'w' ? s.rochade.K : s.rochade.k
            const Q = ich === 'w' ? s.rochade.Q : s.rochade.q
            const turm = ich === 'w' ? 'R' : 'r'
            if (K && b[zeile * 8 + 7] === turm && !b[zeile * 8 + 5] && !b[zeile * 8 + 6] && !angegriffen(b, zeile * 8 + 5, gegner) && !angegriffen(b, zeile * 8 + 6, gegner)) {
              l.push({ von: v, nach: zeile * 8 + 6 })
            }
            if (Q && b[zeile * 8] === turm && !b[zeile * 8 + 1] && !b[zeile * 8 + 2] && !b[zeile * 8 + 3] && !angegriffen(b, zeile * 8 + 3, gegner) && !angegriffen(b, zeile * 8 + 2, gegner)) {
              l.push({ von: v, nach: zeile * 8 + 2 })
            }
          }
        }
      } else {
        const richtungen = typ === 'B' ? DIAG : typ === 'R' ? GERADE : DIAG.concat(GERADE)
        for (const [dr, dc] of richtungen) {
          let rr = r + dr
          let cc = c + dc
          while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
            const ziel = rr * 8 + cc
            if (!b[ziel]) l.push({ von: v, nach: ziel })
            else {
              if (farbe(b[ziel]) === gegner) l.push({ von: v, nach: ziel })
              break
            }
            rr += dr
            cc += dc
          }
        }
      }
    }
    return l
  }

  /** Führt den Zug ohne Endprüfung aus (schnell, für Suche und Perft). */
  function ausfuehren(s, z) {
    const b = s.b.slice()
    const p = b[z.von]
    const ich = s.amZug
    const typ = p.toUpperCase()
    const geschlagen = b[z.nach]
    let ep = -1
    b[z.von] = ''
    if (typ === 'P') {
      if (z.nach === s.ep && !geschlagen) b[ich === 'w' ? z.nach + 8 : z.nach - 8] = ''
      if (Math.abs(z.nach - z.von) === 16) ep = (z.von + z.nach) / 2
      b[z.nach] = z.promo ? (ich === 'w' ? z.promo : z.promo.toLowerCase()) : p
    } else {
      b[z.nach] = p
      if (typ === 'K' && Math.abs(z.nach - z.von) === 2) {
        if (z.nach > z.von) {
          b[z.von + 1] = b[z.von + 3]
          b[z.von + 3] = ''
        } else {
          b[z.von - 1] = b[z.von - 4]
          b[z.von - 4] = ''
        }
      }
    }
    const rochade = Object.assign({}, s.rochade)
    if (p === 'K') rochade.K = rochade.Q = false
    if (p === 'k') rochade.k = rochade.q = false
    for (const f of [z.von, z.nach]) {
      if (f === 63) rochade.K = false
      if (f === 56) rochade.Q = false
      if (f === 7) rochade.k = false
      if (f === 0) rochade.q = false
    }
    return {
      b,
      amZug: ich === 'w' ? 'b' : 'w',
      rochade,
      ep,
      halb: typ === 'P' || geschlagen ? 0 : s.halb + 1,
      voll: s.voll + (ich === 'b' ? 1 : 0),
      hist: s.hist,
      ende: null,
      imSchach: false,
    }
  }

  /** Alle regelgerechten Züge. */
  function zuege(s) {
    if (s.ende) return []
    return zuegeOhneEnde(s)
  }
  function zuegeOhneEnde(s) {
    const ich = s.amZug
    const gegner = ich === 'w' ? 'b' : 'w'
    const l = []
    for (const z of scheinzuege(s)) {
      const n = ausfuehren(s, z)
      if (!angegriffen(n.b, koenigsFeld(n.b, ich), gegner)) l.push(z)
    }
    return l
  }

  function genugMaterial(b) {
    const reste = b.filter((p) => p && p.toUpperCase() !== 'K')
    if (reste.length === 0) return false
    if (reste.length === 1 && 'NBnb'.includes(reste[0])) return false
    if (reste.every((p) => p.toUpperCase() === 'B')) {
      // nur Läufer: gleichfarbige Felder = Remis
      const farben = new Set()
      b.forEach((p, i) => {
        if (p && p.toUpperCase() === 'B') farben.add(((i >> 3) + (i & 7)) % 2)
      })
      if (farben.size === 1) return false
    }
    return true
  }

  function abschliessen(s) {
    const gegner = s.amZug === 'w' ? 'b' : 'w'
    s.imSchach = angegriffen(s.b, koenigsFeld(s.b, s.amZug), gegner)
    const hat = zuegeOhneEnde(s).length > 0
    if (!hat) s.ende = s.imSchach ? { sieger: gegner, grund: 'schachmatt' } : { sieger: null, grund: 'patt' }
    else if (s.hist[schluessel(s)] >= 3) s.ende = { sieger: null, grund: 'wiederholung' }
    else if (s.halb >= 100) s.ende = { sieger: null, grund: '50-zuege' }
    else if (!genugMaterial(s.b)) s.ende = { sieger: null, grund: 'material' }
    return s
  }

  /** Neuer Zustand (mit Endprüfung) oder null, wenn der Zug nicht erlaubt ist. */
  function ziehe(s, z) {
    if (s.ende) return null
    const treffer = zuegeOhneEnde(s).find((x) => x.von === z.von && x.nach === z.nach && (x.promo || '') === (z.promo || ''))
    if (!treffer) return null
    const n = ausfuehren(s, treffer)
    n.hist = Object.assign({}, s.hist)
    const k = schluessel(n)
    n.hist[k] = (n.hist[k] || 0) + 1
    n.letzter = { von: treffer.von, nach: treffer.nach }
    return abschliessen(n)
  }

  // ---------- Rechner ----------
  const WERT = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 }
  // Feldwerte aus Sicht von Weiß (Zeile 0 = Reihe 8)
  const BAUER = [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20,
    -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ]
  const SPRINGER = [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5,
    -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ]
  const MITTE = [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
  ]
  const KOENIG_TAB = [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30,
    -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
  ]
  const TAB = { P: BAUER, N: SPRINGER, B: MITTE, R: null, Q: MITTE, K: KOENIG_TAB }

  /** Bewertung aus Sicht der Farbe am Zug. */
  function bewerten(s) {
    let w = 0
    for (let i = 0; i < 64; i++) {
      const p = s.b[i]
      if (!p) continue
      const typ = p.toUpperCase()
      const weiss = istWeiss(p)
      const tab = TAB[typ]
      const sp = tab ? tab[weiss ? i : (7 - (i >> 3)) * 8 + (i & 7)] : 0
      w += (weiss ? 1 : -1) * (WERT[typ] + sp)
    }
    return s.amZug === 'w' ? w : -w
  }

  function sortiert(s, l) {
    return l
      .map((z) => {
        const opfer = s.b[z.nach]
        let w = 0
        if (opfer) w = 10 * WERT[opfer.toUpperCase()] - WERT[s.b[z.von].toUpperCase()] / 10
        if (z.promo) w += 800
        return [w, z]
      })
      .sort((a, b) => b[0] - a[0])
      .map((x) => x[1])
  }

  function ruhe(s, alpha, beta, tiefe) {
    const stand = bewerten(s)
    if (tiefe === 0) return stand
    if (stand >= beta) return stand
    if (stand > alpha) alpha = stand
    const schlaege = sortiert(s, zuegeOhneEnde(s).filter((z) => s.b[z.nach] || z.promo))
    for (const z of schlaege) {
      const w = -ruhe(ausfuehren(s, z), -beta, -alpha, tiefe - 1)
      if (w >= beta) return w
      if (w > alpha) alpha = w
    }
    return alpha
  }

  function suche(s, tiefe, alpha, beta, abstand) {
    if (tiefe === 0) return ruhe(s, alpha, beta, 4)
    const l = sortiert(s, zuegeOhneEnde(s))
    if (!l.length) {
      const imSchach = angegriffen(s.b, koenigsFeld(s.b, s.amZug), s.amZug === 'w' ? 'b' : 'w')
      return imSchach ? -100000 + abstand : 0
    }
    let beste = -Infinity
    for (const z of l) {
      const w = -suche(ausfuehren(s, z), tiefe - 1, -beta, -alpha, abstand + 1)
      if (w > beste) beste = w
      if (beste > alpha) alpha = beste
      if (alpha >= beta) break
    }
    return beste
  }

  /** Wählt einen Zug. stufe: 1 leicht, 2 mittel, 3 schwer. */
  function rechnerZug(s, stufe) {
    const l = zuegeOhneEnde(s)
    if (!l.length) return null
    // Leicht: zufällig unter den nicht schlechten Zügen
    const tiefe = [0, 1, 2, 3][stufe] || 2
    const bewertet = sortiert(s, l).map((z) => {
      const n = ausfuehren(s, z)
      const w = -suche(n, tiefe - 1, -Infinity, Infinity, 1)
      return { z, w }
    })
    bewertet.sort((a, b) => b.w - a.w)
    const toleranz = stufe === 1 ? 120 : stufe === 2 ? 15 : 0
    const gut = bewertet.filter((x) => x.w >= bewertet[0].w - toleranz)
    const wahl = gut[Math.floor(Math.random() * gut.length)]
    return wahl.z
  }

  /** Zählt Stellungen (zum Prüfen der Regeln). */
  function perft(s, tiefe) {
    if (tiefe === 0) return 1
    let n = 0
    for (const z of zuegeOhneEnde(s)) n += tiefe === 1 ? 1 : perft(ausfuehren(s, z), tiefe - 1)
    return n
  }

  /** Zug in Kurzschreibweise des Feldes („e2“). */
  const feldName = (i) => 'abcdefgh'[i & 7] + (8 - (i >> 3))

  const api = { START, ausFen, neu, zuege, ziehe, rechnerZug, perft, farbe, feldName, angegriffen }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.Schach = api
})()
