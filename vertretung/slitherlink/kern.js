/*
 * Slitherlink – Rechenkern: Gitter, Löser (zählt Lösungen) und Erzeuger.
 * Läuft im Browser (window.Slitherlink) und in Node (module.exports) – keine Abhängigkeiten.
 *
 * Gitter: B Spalten × H Zeilen Felder. Kanten: waagerecht (H+1)·B, senkrecht H·(B+1).
 * Zustand einer Kante: 0 offen, 1 Linie, -1 gesperrt (nur im Löser).
 */
;(function () {
  'use strict'

  function gitter(B, H) {
    const nw = (H + 1) * B
    const nk = nw + H * (B + 1)
    const ecken = (H + 1) * (B + 1)
    const kantenEcken = new Array(nk)
    const feldKanten = new Array(B * H)
    const eckenKanten = Array.from({ length: ecken }, () => [])
    const e = (z, s) => z * (B + 1) + s
    for (let z = 0; z <= H; z++) {
      for (let s = 0; s < B; s++) kantenEcken[z * B + s] = [e(z, s), e(z, s + 1)]
    }
    for (let z = 0; z < H; z++) {
      for (let s = 0; s <= B; s++) kantenEcken[nw + z * (B + 1) + s] = [e(z, s), e(z + 1, s)]
    }
    for (let k = 0; k < nk; k++) kantenEcken[k].forEach((v) => eckenKanten[v].push(k))
    for (let z = 0; z < H; z++) {
      for (let s = 0; s < B; s++) {
        feldKanten[z * B + s] = [z * B + s, (z + 1) * B + s, nw + z * (B + 1) + s, nw + z * (B + 1) + s + 1]
      }
    }
    return { B, H, nw, nk, ecken, kantenEcken, feldKanten, eckenKanten }
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
        for (let i = 0; i < 4; i++) {
          const z = zustand[fk[i]]
          if (z === 1) an++
          else if (z === 0) offen++
        }
        if (an > n || an + offen < n) return false
        if (offen && (an === n || an + offen === n)) {
          const wert = an === n ? -1 : 1
          for (let i = 0; i < 4; i++) if (zustand[fk[i]] === 0) zustand[fk[i]] = wert
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

  /** Zählt Lösungen (höchstens `grenze`). Liefert { anzahl, loesung } mit der ersten Lösung als Kanten-Zustand. */
  function loesen(g, hinweise, grenze) {
    let anzahl = 0
    let erste = null
    function suche(zustand) {
      if (anzahl >= grenze) return
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
        if (anzahl >= grenze) return
      }
    }
    suche(new Int8Array(g.nk))
    return { anzahl, loesung: erste }
  }

  function mischen(feld, zufall) {
    for (let i = feld.length - 1; i > 0; i--) {
      const j = Math.floor(zufall() * (i + 1))
      ;[feld[i], feld[j]] = [feld[j], feld[i]]
    }
    return feld
  }

  /** Zufälliger Kreis: zusammenhängendes Gebiet ohne Löcher und ohne Berührung nur an Ecken. Liefert innen[] (Boolean je Feld). */
  function zufallsKreis(g, anteil, zufall) {
    const { B, H } = g
    const innen = new Array(B * H).fill(false)
    const ist = (z, s) => z >= 0 && z < H && s >= 0 && s < B && innen[z * B + s]
    const start = Math.floor(zufall() * B * H)
    innen[start] = true
    let anzahl = 1
    const ziel = Math.max(4, Math.round(B * H * anteil))

    function gueltig() {
      // keine Ecken-Berührung (Schachbrett im 2×2-Fenster, auch am Rand)
      for (let z = -1; z < H; z++) {
        for (let s = -1; s < B; s++) {
          const a = ist(z, s)
          const b = ist(z, s + 1)
          const c = ist(z + 1, s)
          const d = ist(z + 1, s + 1)
          if (a === d && b === c && a !== b) return false
        }
      }
      // außen (mit Rand) zusammenhängend: keine Löcher
      const aussen = (z, s) => !ist(z, s)
      const besucht = new Set()
      const stapel = [[-1, -1]]
      besucht.add(-1 * 1000 + -1)
      let n = 0
      while (stapel.length) {
        const [z, s] = stapel.pop()
        n++
        for (const [dz, ds] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const zz = z + dz
          const ss = s + ds
          if (zz < -1 || zz > H || ss < -1 || ss > B) continue
          const schluessel = zz * 1000 + ss
          if (besucht.has(schluessel) || !aussen(zz, ss)) continue
          besucht.add(schluessel)
          stapel.push([zz, ss])
        }
      }
      return n === (H + 2) * (B + 2) - anzahl
    }

    let versuche = 0
    while (anzahl < ziel && versuche++ < 400) {
      const kandidaten = []
      for (let z = 0; z < H; z++) {
        for (let s = 0; s < B; s++) {
          if (innen[z * B + s]) continue
          if (ist(z - 1, s) || ist(z + 1, s) || ist(z, s - 1) || ist(z, s + 1)) kandidaten.push(z * B + s)
        }
      }
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

  /** Linien-Zustand (1/0) aus einem Gebiet. */
  function randKanten(g, innen) {
    const { B, H } = g
    const ist = (z, s) => z >= 0 && z < H && s >= 0 && s < B && innen[z * B + s]
    const zustand = new Int8Array(g.nk)
    for (let z = 0; z <= H; z++) for (let s = 0; s < B; s++) zustand[z * B + s] = ist(z - 1, s) !== ist(z, s) ? 1 : 0
    for (let z = 0; z < H; z++) {
      for (let s = 0; s <= B; s++) zustand[g.nw + z * (B + 1) + s] = ist(z, s - 1) !== ist(z, s) ? 1 : 0
    }
    return zustand
  }

  /**
   * Neues Rätsel.
   *   B, H:    Felder in Breite und Höhe
   *   behalten: Anteil der Zahlen, die höchstens weggenommen werden (1 = alle behalten, 0 = so wenige wie möglich)
   * Liefert { B, H, hinweise (−1 = leer), loesung (Int8Array 0/1) } – mit genau einer Lösung.
   */
  function erzeugen(B, H, behalten, zufall) {
    zufall = zufall || Math.random
    const g = gitter(B, H)
    for (let versuch = 0; versuch < 60; versuch++) {
      const innen = zufallsKreis(g, 0.45 + zufall() * 0.2, zufall)
      const loesung = randKanten(g, innen)
      const hinweise = new Array(B * H)
      for (let f = 0; f < B * H; f++) hinweise[f] = g.feldKanten[f].reduce((s, k) => s + loesung[k], 0)
      if (loesen(g, hinweise, 2).anzahl !== 1) continue
      const reihenfolge = mischen([...hinweise.keys()], zufall)
      let uebrig = B * H
      const untergrenze = Math.round(B * H * Math.max(0, Math.min(1, behalten)))
      for (const f of reihenfolge) {
        if (uebrig <= untergrenze) break
        const alt = hinweise[f]
        hinweise[f] = -1
        if (loesen(g, hinweise, 2).anzahl === 1) uebrig--
        else hinweise[f] = alt
      }
      return { B, H, hinweise, loesung }
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

  const api = { gitter, loesen, erzeugen, geloest }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.Slitherlink = api
})()
