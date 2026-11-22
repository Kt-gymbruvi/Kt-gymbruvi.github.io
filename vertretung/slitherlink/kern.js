/*
 * Slitherlink – Rechenkern: Gitter (Quadrate oder Sechsecke), Löser (zählt Lösungen) und Erzeuger.
 * Läuft im Browser (window.Slitherlink) und in Node (module.exports) – keine Abhängigkeiten.
 *
 * Ein Gitter g beschreibt nur, wie Felder, Kanten und Ecken zusammenhängen – Löser und Erzeuger gelten für jede Form:
 *   g.nk            Zahl der Kanten                 g.ecken        Zahl der Ecken
 *   g.felder        Zahl der Felder
 *   g.kantenEcken[k]   die zwei Ecken einer Kante
 *   g.feldKanten[f]    die Kanten eines Feldes (4 beim Quadrat, 6 beim Sechseck)
 *   g.eckenKanten[v]   die Kanten an einer Ecke
 *   g.kantenFelder[k]  die zwei Felder an einer Kante (-1 = außerhalb)
 *   g.eckenFelder[v]   die Felder rund um eine Ecke im Kreis (-1 = außerhalb) oder null, wenn dort nie Felder nur an der Ecke berühren können
 *   g.punkte[v]        Lage der Ecke (x, y), g.feldMitte[f] Lage der Feldmitte – für die Zeichnung, Einheit = Kantenlänge
 *   g.form             'quadrat' | 'sechseck'
 * Zustand einer Kante: 0 offen, 1 Linie, -1 gesperrt (nur im Löser).
 */
;(function () {
  'use strict'

  /** Ergänzt die abgeleiteten Listen eines Gitters. */
  function fertig(g) {
    g.eckenKanten = Array.from({ length: g.ecken }, () => [])
    for (let k = 0; k < g.nk; k++) g.kantenEcken[k].forEach((v) => g.eckenKanten[v].push(k))
    g.felder = g.feldKanten.length
    return g
  }

  /** Quadrat-Gitter: B Spalten × H Zeilen Felder. */
  function gitter(B, H) {
    const nw = (H + 1) * B
    const nk = nw + H * (B + 1)
    const ecken = (H + 1) * (B + 1)
    const e = (z, s) => z * (B + 1) + s
    const kantenEcken = new Array(nk)
    const kantenFelder = new Array(nk)
    const feldKanten = new Array(B * H)
    const feld = (z, s) => (z >= 0 && z < H && s >= 0 && s < B ? z * B + s : -1)
    for (let z = 0; z <= H; z++) {
      for (let s = 0; s < B; s++) {
        kantenEcken[z * B + s] = [e(z, s), e(z, s + 1)]
        kantenFelder[z * B + s] = [feld(z - 1, s), feld(z, s)]
      }
    }
    for (let z = 0; z < H; z++) {
      for (let s = 0; s <= B; s++) {
        kantenEcken[nw + z * (B + 1) + s] = [e(z, s), e(z + 1, s)]
        kantenFelder[nw + z * (B + 1) + s] = [feld(z, s - 1), feld(z, s)]
      }
    }
    for (let z = 0; z < H; z++) {
      for (let s = 0; s < B; s++) feldKanten[z * B + s] = [z * B + s, (z + 1) * B + s, nw + z * (B + 1) + s, nw + z * (B + 1) + s + 1]
    }
    const punkte = []
    const eckenFelder = []
    for (let z = 0; z <= H; z++) {
      for (let s = 0; s <= B; s++) {
        punkte.push([s, z])
        eckenFelder.push([feld(z - 1, s - 1), feld(z - 1, s), feld(z, s), feld(z, s - 1)])
      }
    }
    const feldMitte = []
    for (let z = 0; z < H; z++) for (let s = 0; s < B; s++) feldMitte.push([s + 0.5, z + 0.5])
    return fertig({ form: 'quadrat', B, H, nw, nk, ecken, kantenEcken, feldKanten, kantenFelder, eckenFelder, punkte, feldMitte })
  }

  /** Sechseck-Gitter (Spitze oben, jede zweite Zeile um ein halbes Feld versetzt): B Spalten × H Zeilen. */
  function sechseckGitter(B, H) {
    const W3 = Math.sqrt(3)
    const punktSchluessel = new Map()
    const punkte = []
    const punkt = (x, y) => {
      const k = Math.round(x * 1000) + ',' + Math.round(y * 1000)
      if (!punktSchluessel.has(k)) {
        punktSchluessel.set(k, punkte.length)
        punkte.push([x, y])
      }
      return punktSchluessel.get(k)
    }
    const kantenSchluessel = new Map()
    const kantenEcken = []
    const kantenFelder = []
    const feldKanten = []
    const feldMitte = []
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < B; c++) {
        const f = r * B + c
        const mx = (c + 0.5 * (r % 2) + 0.5) * W3
        const my = 1 + r * 1.5
        feldMitte.push([mx, my])
        const ecken = []
        for (let i = 0; i < 6; i++) {
          const w = ((30 + 60 * i) * Math.PI) / 180
          ecken.push(punkt(mx + Math.cos(w), my + Math.sin(w)))
        }
        const kanten = []
        for (let i = 0; i < 6; i++) {
          const a = ecken[i]
          const b = ecken[(i + 1) % 6]
          const k = Math.min(a, b) + '-' + Math.max(a, b)
          if (!kantenSchluessel.has(k)) {
            kantenSchluessel.set(k, kantenEcken.length)
            kantenEcken.push([a, b])
            kantenFelder.push([f, -1])
          } else kantenFelder[kantenSchluessel.get(k)][1] = f
          kanten.push(kantenSchluessel.get(k))
        }
        feldKanten.push(kanten)
      }
    }
    // an Sechseck-Ecken stoßen höchstens drei Flächen – eine reine Ecken-Berührung gibt es nicht
    return fertig({ form: 'sechseck', B, H, nk: kantenEcken.length, ecken: punkte.length, kantenEcken, feldKanten, kantenFelder, eckenFelder: null, punkte, feldMitte })
  }

  /** Alles, was aus den Linien folgt; false bei Widerspruch. */
  function folgern(g, zustand, hinweise) {
    const { kantenEcken, feldKanten, eckenKanten } = g
    let geaendert = true
    while (geaendert) {
      geaendert = false
      // Zahlen in den Feldern
      for (let f = 0; f < hinweise.length; f++) {
        const n = hinweise[f]
        if (n < 0) continue
        let an = 0
        let offen = 0
        const fk = feldKanten[f]
        for (let i = 0; i < fk.length; i++) {
          const z = zustand[fk[i]]
          if (z === 1) an++
          else if (z === 0) offen++
        }
        if (an > n || an + offen < n) return false
        if (offen && (an === n || an + offen === n)) {
          const wert = an === n ? -1 : 1
          for (let i = 0; i < fk.length; i++) if (zustand[fk[i]] === 0) zustand[fk[i]] = wert
          geaendert = true
        }
      }
      // Ecken: Grad 0 oder 2
      for (let v = 0; v < eckenKanten.length; v++) {
        let an = 0
        let offen = 0
        const ek = eckenKanten[v]
        for (let i = 0; i < ek.length; i++) {
          const z = zustand[ek[i]]
          if (z === 1) an++
          else if (z === 0) offen++
        }
        if (an > 2) return false
        if (an === 2) {
          if (offen) {
            for (let i = 0; i < ek.length; i++) if (zustand[ek[i]] === 0) zustand[ek[i]] = -1
            geaendert = true
          }
        } else if (an === 1) {
          if (offen === 0) return false
          if (offen === 1) {
            for (let i = 0; i < ek.length; i++) if (zustand[ek[i]] === 0) zustand[ek[i]] = 1
            geaendert = true
          }
        } else if (offen === 1) {
          for (let i = 0; i < ek.length; i++) if (zustand[ek[i]] === 0) zustand[ek[i]] = -1
          geaendert = true
        }
      }
      // Schleifen: ein geschlossener Kreis muss alle Linien enthalten
      const eltern = new Int32Array(g.ecken)
      for (let i = 0; i < eltern.length; i++) eltern[i] = i
      const wurzel = (x) => {
        while (eltern[x] !== x) x = eltern[x] = eltern[eltern[x]]
        return x
      }
      let linien = 0
      for (let k = 0; k < zustand.length; k++) {
        if (zustand[k] !== 1) continue
        linien++
        const a = wurzel(kantenEcken[k][0])
        const b = wurzel(kantenEcken[k][1])
        if (a !== b) eltern[a] = b
      }
      if (linien) {
        const kanten = new Map()
        const punkte = new Map()
        for (let k = 0; k < zustand.length; k++) {
          if (zustand[k] !== 1) continue
          const w = wurzel(kantenEcken[k][0])
          kanten.set(w, (kanten.get(w) || 0) + 1)
        }
        const gesehen = new Set()
        for (let k = 0; k < zustand.length; k++) {
          if (zustand[k] !== 1) continue
          for (const v of kantenEcken[k]) {
            if (gesehen.has(v)) continue
            gesehen.add(v)
            const w = wurzel(v)
            punkte.set(w, (punkte.get(w) || 0) + 1)
          }
        }
        let kreis = false
        for (const [w, n] of kanten) if (punkte.get(w) === n) kreis = true
        if (kreis) {
          if (kanten.size > 1) return false
          for (let k = 0; k < zustand.length; k++) {
            if (zustand[k] === 0) {
              zustand[k] = -1
              geaendert = true
            }
          }
        }
      }
    }
    return true
  }

  /**
   * Zählt Lösungen (höchstens `grenze`). Liefert { anzahl, loesung } mit der ersten Lösung als Kanten-Zustand.
   * budget (optional): höchste Zahl an Suchschritten; reicht sie nicht, kommt { anzahl: -1 } (unbekannt).
   */
  function loesen(g, hinweise, grenze, budget) {
    let anzahl = 0
    let erste = null
    let schritte = 0
    let abgebrochen = false
    function suche(zustand) {
      if (anzahl >= grenze || abgebrochen) return
      if (budget && ++schritte > budget) {
        abgebrochen = true
        return
      }
      if (!folgern(g, zustand, hinweise)) return
      // eine offene Kante wählen: bevorzugt am Ende einer Linie
      let wahl = -1
      for (let v = 0; v < g.eckenKanten.length && wahl < 0; v++) {
        let an = 0
        let frei = -1
        for (const k of g.eckenKanten[v]) {
          if (zustand[k] === 1) an++
          else if (zustand[k] === 0 && frei < 0) frei = k
        }
        if (an === 1 && frei >= 0) wahl = frei
      }
      if (wahl < 0) {
        for (let k = 0; k < zustand.length; k++) {
          if (zustand[k] === 0) {
            wahl = k
            break
          }
        }
      }
      if (wahl < 0) {
        // alles entschieden: genau ein Kreis (Grade und Kreis wurden in folgern geprüft)
        if (zustand.some((z) => z === 1)) {
          anzahl++
          if (!erste) erste = Int8Array.from(zustand)
        }
        return
      }
      for (const wert of [1, -1]) {
        const kopie = Int8Array.from(zustand)
        kopie[wahl] = wert
        suche(kopie)
        if (anzahl >= grenze || abgebrochen) return
      }
    }
    suche(new Int8Array(g.nk))
    if (abgebrochen && anzahl < grenze) return { anzahl: -1, loesung: null }
    return { anzahl, loesung: erste }
  }

  function mischen(feld, zufall) {
    for (let i = feld.length - 1; i > 0; i--) {
      const j = Math.floor(zufall() * (i + 1))
      ;[feld[i], feld[j]] = [feld[j], feld[i]]
    }
    return feld
  }

  /**
   * Zufälliger Kreis: zusammenhängendes Gebiet ohne Löcher und ohne Berührung nur an einer Ecke.
   * Liefert innen[] (Boolean je Feld); die Grenze des Gebiets ist ein einziger Kreis.
   */
  function zufallsKreis(g, anteil, zufall) {
    const n = g.felder
    const innen = new Array(n).fill(false)
    const nachbarn = Array.from({ length: n }, () => [])
    const aussenRand = new Array(n).fill(false) // Feld hat eine Kante nach draußen
    for (const [a, b] of g.kantenFelder) {
      if (a >= 0 && b >= 0) {
        nachbarn[a].push(b)
        nachbarn[b].push(a)
      } else if (a >= 0) aussenRand[a] = true
      else if (b >= 0) aussenRand[b] = true
    }
    const ist = (f) => f >= 0 && innen[f]
    innen[Math.floor(zufall() * n)] = true
    let anzahl = 1
    const ziel = Math.max(4, Math.round(n * anteil))

    function gueltig() {
      // keine reine Ecken-Berührung: um eine Ecke herum höchstens zwei Wechsel zwischen innen und außen
      if (g.eckenFelder) {
        for (const felder of g.eckenFelder) {
          let wechsel = 0
          for (let i = 0; i < felder.length; i++) if (ist(felder[i]) !== ist(felder[(i + 1) % felder.length])) wechsel++
          if (wechsel > 2) return false
        }
      }
      // außen (samt Umgebung) zusammenhängend: keine Löcher
      const besucht = new Array(n).fill(false)
      const stapel = []
      let aussenZahl = 0
      for (let f = 0; f < n; f++) {
        if (!innen[f] && aussenRand[f]) {
          besucht[f] = true
          stapel.push(f)
        }
      }
      while (stapel.length) {
        const f = stapel.pop()
        aussenZahl++
        for (const m of nachbarn[f]) {
          if (!innen[m] && !besucht[m]) {
            besucht[m] = true
            stapel.push(m)
          }
        }
      }
      return aussenZahl === n - anzahl
    }

    let versuche = 0
    while (anzahl < ziel && versuche++ < 800) {
      const kandidaten = []
      for (let f = 0; f < n; f++) if (!innen[f] && nachbarn[f].some((m) => innen[m])) kandidaten.push(f)
      if (!kandidaten.length) break
      const f = kandidaten[Math.floor(zufall() * kandidaten.length)]
      innen[f] = true
      anzahl++
      if (!gueltig()) {
        innen[f] = false
        anzahl--
      }
    }
    return innen
  }

  /** Linien-Zustand (1/0) aus einem Gebiet: Kanten zwischen innen und außen. */
  function randKanten(g, innen) {
    const zustand = new Int8Array(g.nk)
    for (let k = 0; k < g.nk; k++) {
      const [a, b] = g.kantenFelder[k]
      zustand[k] = (a >= 0 && innen[a]) !== (b >= 0 && innen[b]) ? 1 : 0
    }
    return zustand
  }

  const BUDGET_START = 40000 // Suchschritte für die Prüfung des vollen Rätsels
  const BUDGET_PRUEFEN = 3000 // Suchschritte je Prüfung beim Weglassen einer Zahl
  const FRIST_MS = 1500 // danach werden keine weiteren Zahlen mehr weggenommen

  /**
   * Neues Rätsel.
   *   B, H:     Felder in Breite und Höhe
   *   behalten: Anteil der Zahlen, die höchstens weggenommen werden (1 = alle behalten, 0 = so wenige wie möglich)
   *   form:     'quadrat' (Standard) oder 'sechseck'
   * Liefert { form, B, H, hinweise (−1 = leer), loesung (Int8Array 0/1) } – mit genau einer Lösung.
   */
  function erzeugen(B, H, behalten, zufall, form) {
    zufall = zufall || Math.random
    form = form === 'sechseck' ? 'sechseck' : 'quadrat'
    const g = form === 'sechseck' ? sechseckGitter(B, H) : gitter(B, H)
    const start = Date.now()
    for (let versuch = 0; versuch < 80; versuch++) {
      const innen = zufallsKreis(g, 0.45 + zufall() * 0.2, zufall)
      const loesung = randKanten(g, innen)
      const hinweise = new Array(g.felder)
      for (let f = 0; f < g.felder; f++) hinweise[f] = g.feldKanten[f].reduce((s, k) => s + loesung[k], 0)
      if (loesen(g, hinweise, 2, BUDGET_START).anzahl !== 1) continue
      const reihenfolge = mischen([...hinweise.keys()], zufall)
      let uebrig = g.felder
      const untergrenze = Math.round(g.felder * Math.max(0, Math.min(1, behalten)))
      for (const f of reihenfolge) {
        // Zahlen nur wegnehmen, solange die Lösung beweisbar eindeutig bleibt; reicht das Budget nicht, bleibt die Zahl stehen
        if (uebrig <= untergrenze || Date.now() - start > FRIST_MS) break
        const alt = hinweise[f]
        hinweise[f] = -1
        if (loesen(g, hinweise, 2, BUDGET_PRUEFEN).anzahl === 1) uebrig--
        else hinweise[f] = alt
      }
      return { form, B, H, hinweise, loesung }
    }
    return null
  }

  /** Prüft Linien (1/0) auf Gültigkeit: Zahlen stimmen, Grad 0/2, genau ein Kreis. */
  function geloest(g, linien, hinweise) {
    const zustand = Int8Array.from(linien, (z) => (z === 1 ? 1 : -1))
    for (let f = 0; f < hinweise.length; f++) {
      if (hinweise[f] >= 0 && g.feldKanten[f].reduce((s, k) => s + (zustand[k] === 1 ? 1 : 0), 0) !== hinweise[f]) return false
    }
    let linienAnzahl = 0
    for (const ek of g.eckenKanten) {
      const grad = ek.reduce((s, k) => s + (zustand[k] === 1 ? 1 : 0), 0)
      if (grad !== 0 && grad !== 2) return false
    }
    // zusammenhängend
    const nachbar = new Map()
    for (let k = 0; k < zustand.length; k++) {
      if (zustand[k] !== 1) continue
      linienAnzahl++
      const [a, b] = g.kantenEcken[k]
      if (!nachbar.has(a)) nachbar.set(a, [])
      if (!nachbar.has(b)) nachbar.set(b, [])
      nachbar.get(a).push(b)
      nachbar.get(b).push(a)
    }
    if (!linienAnzahl) return false
    const start = nachbar.keys().next().value
    const gesehen = new Set([start])
    const stapel = [start]
    while (stapel.length) {
      for (const n of nachbar.get(stapel.pop())) if (!gesehen.has(n)) (gesehen.add(n), stapel.push(n))
    }
    return gesehen.size === nachbar.size
  }

  const api = { gitter, sechseckGitter, loesen, erzeugen, geloest }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.Slitherlink = api
})()
