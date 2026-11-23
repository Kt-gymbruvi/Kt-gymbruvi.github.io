/*
 * Flip 7 – Spielkern: Stapel, Regeln einer Runde, Punkte und Rechnerspieler.
 * Browser: window.Flip7, Node: module.exports. Alle Karten liegen offen; verdeckt ist nur die Reihenfolge des Stapels.
 *
 * Der Ablauf ist asynchron, damit die Oberfläche zwischen den Schritten warten und Entscheidungen von
 * Menschen abwarten kann. Entscheider `E` (je Spiel einer):
 *   E.zug(sp, i)                      → 'nimm' | 'bleib'
 *   E.ziel(sp, von, karte, optionen)  → Nummer eines Spielers aus `optionen` (für Einfrieren, Drei ziehen, Zweite Chance)
 * Mitteilungen: sp.bei(text, art) wird nach jedem Schritt aufgerufen (art: 'bust' | 'flip7' | 'chance' | 'aktion' | 'info').
 *
 * Stapel (94 Karten): Zahlen 0 (1×), 1 (1×), 2 (2×) … 12 (12×) = 79; Bonus +2, +4, +6, +8, +10, ×2 = 6;
 * Aktionen Einfrieren, Drei ziehen, Zweite Chance je 3× = 9.
 */
;(function () {
  'use strict'

  const AKTIONEN = { freeze: 'Einfrieren', drei: 'Drei ziehen', chance: 'Zweite Chance' }

  function stapelBauen() {
    const karten = []
    let id = 0
    const neu = (k) => karten.push({ id: ++id, ...k })
    neu({ t: 'z', w: 0 })
    for (let w = 1; w <= 12; w++) for (let k = 0; k < w; k++) neu({ t: 'z', w })
    for (const w of [2, 4, 6, 8, 10]) neu({ t: 'p', w })
    neu({ t: 'm' })
    for (const a of Object.keys(AKTIONEN)) for (let k = 0; k < 3; k++) neu({ t: 'a', a })
    return karten
  }

  function mischen(feld, zufall) {
    for (let i = feld.length - 1; i > 0; i--) {
      const j = Math.floor(zufall() * (i + 1))
      ;[feld[i], feld[j]] = [feld[j], feld[i]]
    }
    return feld
  }

  const summe = (karten) => karten.reduce((s, k) => s + k.w, 0)

  function neueHand() {
    return { zahlen: [], plus: [], mal: null, chance: null, bustKarte: null, status: 'aktiv', flip7: false }
  }

  /** Neues Spiel. spieler: [{ name, art: 'mensch' | 'rechner', stufe }]. */
  function neuesSpiel(spieler, ziel, zufall) {
    zufall = zufall || Math.random
    return {
      ziel: ziel || 200,
      zufall,
      spieler: spieler.map((s) => ({ name: s.name, art: s.art || 'rechner', stufe: s.stufe || 'stark', gesamt: 0, hand: neueHand(), runde: 0 })),
      stapel: mischen(stapelBauen(), zufall),
      ablage: [],
      runde: 0,
      erster: -1,
      am: -1,
      rundeBeendet: null, // null | 'flip7' | 'leer'
      protokoll: [],
      bei: null,
    }
  }

  async function melde(sp, text, art) {
    sp.protokoll.push({ text, art: art || 'info' })
    if (sp.protokoll.length > 300) sp.protokoll.shift()
    if (sp.bei) await sp.bei(text, art || 'info')
  }

  const aktive = (sp) => sp.spieler.map((_, i) => i).filter((i) => sp.spieler[i].hand.status === 'aktiv')

  function kartenName(k) {
    if (k.t === 'z') return String(k.w)
    if (k.t === 'p') return '+' + k.w
    if (k.t === 'm') return '×2'
    return AKTIONEN[k.a]
  }

  /** Punkte, die ein Spieler jetzt für die Runde bekäme (Bust = 0). */
  function rundenpunkte(h) {
    if (h.status === 'bust') return 0
    let s = summe(h.zahlen)
    if (h.mal) s *= 2
    s += summe(h.plus)
    if (h.flip7) s += 15
    return s
  }

  /** Oberste Karte ziehen; ist der Stapel leer, wird die Ablage gemischt. Null, wenn gar nichts mehr da ist. */
  function ziehen(sp) {
    if (!sp.stapel.length && sp.ablage.length) {
      sp.stapel = mischen(sp.ablage.splice(0), sp.zufall)
      sp.gemischt = (sp.gemischt || 0) + 1
    }
    return sp.stapel.pop() || null
  }

  async function dreiZiehen(sp, j, E) {
    const h = sp.spieler[j].hand
    const aufgeschoben = []
    for (let k = 0; k < 3; k++) {
      if (h.status !== 'aktiv' || sp.rundeBeendet) break
      const karte = ziehen(sp)
      if (!karte) {
        sp.rundeBeendet = 'leer'
        break
      }
      if (karte.t === 'a' && karte.a !== 'chance') {
        aufgeschoben.push(karte)
        await melde(sp, `${sp.spieler[j].name} zieht „${AKTIONEN[karte.a]}“ – wird danach gespielt.`, 'aktion')
        continue
      }
      await legeAn(sp, j, karte, E)
    }
    for (const karte of aufgeschoben) {
      if (h.status === 'aktiv' && !sp.rundeBeendet) await legeAn(sp, j, karte, E)
      else sp.ablage.push(karte)
    }
  }

  /** Karte `karte` kommt zu Spieler `i`; `i` entscheidet bei Aktionskarten über das Ziel. */
  async function legeAn(sp, i, karte, E) {
    const me = sp.spieler[i]
    const h = me.hand
    if (karte.t === 'z') {
      if (h.zahlen.some((k) => k.w === karte.w)) {
        if (h.chance) {
          sp.ablage.push(h.chance, karte)
          h.chance = null
          await melde(sp, `${me.name} zieht die ${karte.w} doppelt – die Zweite Chance rettet!`, 'chance')
        } else {
          h.status = 'bust'
          h.bustKarte = karte
          await melde(sp, `${me.name} zieht die ${karte.w} doppelt: Bust! In dieser Runde 0 Punkte.`, 'bust')
        }
      } else {
        h.zahlen.push(karte)
        if (h.zahlen.length === 7) {
          h.flip7 = true
          sp.rundeBeendet = 'flip7'
          await melde(sp, `${me.name} hat 7 verschiedene Zahlen: FLIP 7! +15 Punkte, die Runde endet.`, 'flip7')
        } else {
          await melde(sp, `${me.name} zieht die ${karte.w}.`)
        }
      }
    } else if (karte.t === 'p') {
      h.plus.push(karte)
      await melde(sp, `${me.name} zieht +${karte.w}.`)
    } else if (karte.t === 'm') {
      if (h.mal) {
        sp.ablage.push(karte)
        await melde(sp, `${me.name} zieht ×2 – hat schon eins, die Karte verfällt.`)
      } else {
        h.mal = karte
        await melde(sp, `${me.name} zieht ×2: die Zahlen zählen doppelt.`)
      }
    } else if (karte.a === 'chance') {
      if (!h.chance) {
        h.chance = karte
        await melde(sp, `${me.name} zieht eine Zweite Chance.`, 'chance')
      } else {
        const opt = aktive(sp).filter((j) => j !== i && !sp.spieler[j].hand.chance)
        if (!opt.length) {
          sp.ablage.push(karte)
          await melde(sp, `${me.name} zieht eine zweite Zweite Chance – niemand kann sie brauchen, sie verfällt.`)
        } else {
          const j = opt.length === 1 ? opt[0] : await E.ziel(sp, i, karte, opt)
          sp.spieler[j].hand.chance = karte
          await melde(sp, `${me.name} schenkt ${sp.spieler[j].name} eine Zweite Chance.`, 'chance')
        }
      }
    } else if (karte.a === 'freeze') {
      const opt = aktive(sp)
      const j = opt.length === 1 ? opt[0] : await E.ziel(sp, i, karte, opt)
      sp.spieler[j].hand.status = 'eingefroren'
      sp.ablage.push(karte)
      await melde(sp, `${me.name} friert ${j === i ? 'sich selbst' : sp.spieler[j].name} ein: Punkte gesichert, raus aus der Runde.`, 'aktion')
    } else if (karte.a === 'drei') {
      const opt = aktive(sp)
      const j = opt.length === 1 ? opt[0] : await E.ziel(sp, i, karte, opt)
      await melde(sp, `${me.name} lässt ${j === i ? 'sich selbst' : sp.spieler[j].name} drei Karten ziehen.`, 'aktion')
      sp.ablage.push(karte)
      await dreiZiehen(sp, j, E)
    }
  }

  function istLeer(h) {
    return !h.zahlen.length && !h.plus.length && !h.mal
  }

  /** Eine Runde spielen. Liefert { flip7, punkte: [Rundenpunkte je Spieler] }. */
  async function runde(sp, E) {
    const n = sp.spieler.length
    // Karten der letzten Runde in die Ablage
    for (const s of sp.spieler) {
      const h = s.hand
      sp.ablage.push(...h.zahlen, ...h.plus)
      if (h.mal) sp.ablage.push(h.mal)
      if (h.chance) sp.ablage.push(h.chance)
      if (h.bustKarte) sp.ablage.push(h.bustKarte)
      s.hand = neueHand()
    }
    sp.runde++
    sp.rundeBeendet = null
    sp.erster = (sp.erster + 1) % n
    await melde(sp, `Runde ${sp.runde}: ${sp.spieler[sp.erster].name} beginnt.`, 'info')

    // Austeilen: jede und jeder eine Karte
    for (let k = 0; k < n && !sp.rundeBeendet; k++) {
      const i = (sp.erster + k) % n
      if (sp.spieler[i].hand.status !== 'aktiv') continue
      const karte = ziehen(sp)
      if (!karte) {
        sp.rundeBeendet = 'leer'
        break
      }
      await legeAn(sp, i, karte, E)
    }

    // Reihum: ziehen oder bleiben
    let i = sp.erster
    while (!sp.rundeBeendet && aktive(sp).length) {
      if (sp.spieler[i].hand.status !== 'aktiv') {
        i = (i + 1) % n
        continue
      }
      sp.am = i
      const h = sp.spieler[i].hand
      let wahl = await E.zug(sp, i)
      if (istLeer(h)) wahl = 'nimm'
      if (wahl === 'bleib') {
        h.status = 'bleibt'
        await melde(sp, `${sp.spieler[i].name} bleibt bei ${rundenpunkte(h)} Punkten.`)
      } else {
        const karte = ziehen(sp)
        if (!karte) {
          sp.rundeBeendet = 'leer'
          break
        }
        await legeAn(sp, i, karte, E)
      }
      i = (i + 1) % n
    }
    sp.am = -1

    const punkte = sp.spieler.map((s) => rundenpunkte(s.hand))
    sp.spieler.forEach((s, k) => {
      s.gesamt += punkte[k]
      s.runde = punkte[k]
    })
    await melde(sp, 'Runde zu Ende: ' + sp.spieler.map((s, k) => `${s.name} +${punkte[k]}`).join(', ') + '.', 'info')
    return { flip7: sp.rundeBeendet === 'flip7', punkte }
  }

  /** Sieger, wenn das Ziel erreicht und die Spitze eindeutig ist; sonst null. */
  function sieger(sp) {
    const hoch = Math.max(...sp.spieler.map((s) => s.gesamt))
    if (hoch < sp.ziel) return null
    const spitze = sp.spieler.map((s, i) => i).filter((i) => sp.spieler[i].gesamt === hoch)
    return spitze.length === 1 ? spitze[0] : null
  }

  // ---------- Rechnerspieler ----------

  /** Wahrscheinlichkeit, mit der nächsten Karte eine Zahl doppelt zu ziehen. */
  function bustChance(sp, hand) {
    const st = sp.stapel
    if (!st.length) return 0
    let dop = 0
    for (const k of st) if (k.t === 'z' && hand.zahlen.some((x) => x.w === k.w)) dop++
    return dop / st.length
  }

  /** Erwartete Rundenpunkte nach einer weiteren Karte (Stand beim Aufhören: S). */
  function erwartung(sp, hand) {
    const S = rundenpunkte(hand)
    const st = sp.stapel
    if (!st.length) return S
    const zs = summe(hand.zahlen)
    const pb = bustChance(sp, hand)
    const pb3 = hand.chance ? pb * 0.5 : 1 - Math.pow(1 - pb, 3)
    let gesamt = 0
    for (const k of st) {
      if (k.t === 'z') {
        if (hand.zahlen.some((x) => x.w === k.w)) gesamt += hand.chance ? S : 0
        else gesamt += (hand.mal ? 2 : 1) * (zs + k.w) + summe(hand.plus) + (hand.zahlen.length === 6 ? 15 : 0)
      } else if (k.t === 'p') gesamt += S + k.w
      else if (k.t === 'm') gesamt += hand.mal ? S : S + zs
      else if (k.a === 'chance') gesamt += hand.chance ? S : S + 3
      else if (k.a === 'freeze') gesamt += S
      else gesamt += (1 - pb3) * (S + 10)
    }
    return gesamt / st.length
  }

  // Rechnerstufen: 'leicht' (Bauchgefühl) und 'stark' (zählt die Karten)
  const zufallsZahl = (sp, von, bis) => von + Math.floor(sp.zufall() * (bis - von + 1))

  function kiZug(sp, i) {
    const me = sp.spieler[i]
    const h = me.hand
    if (istLeer(h)) return 'nimm'
    const S = rundenpunkte(h)
    if (me.stufe === 'leicht') return S >= 14 + zufallsZahl(sp, 0, 8) ? 'bleib' : 'nimm'
    // stark: zählt die Karten im Stapel und zieht nur, wenn die nächste Karte im Mittel mehr bringt als sie kostet
    const ev = erwartung(sp, h)
    // Reicht das Gesicherte schon zum Sieg, wird nicht mehr gewürfelt
    const besterAndere = Math.max(...sp.spieler.filter((_, k) => k !== i).map((x) => x.gesamt))
    if (me.gesamt + S >= sp.ziel && me.gesamt + S > besterAndere) return 'bleib'
    return ev > S ? 'nimm' : 'bleib'
  }

  function kiZiel(sp, von, karte, optionen) {
    const me = sp.spieler[von]
    const andere = optionen.filter((j) => j !== von)
    if (karte.a === 'chance') {
      return andere.reduce((b, j) => (sp.spieler[j].gesamt < sp.spieler[b].gesamt ? j : b), andere[0])
    }
    if (me.stufe === 'leicht') return optionen[Math.floor(sp.zufall() * optionen.length)]
    const S = rundenpunkte(me.hand)
    if (karte.a === 'freeze') {
      if (optionen.includes(von) && S >= 12) return von
      if (!andere.length) return von
      // den Gegner mit den wenigsten Rundenpunkten einfrieren (er sichert wenig und kann nichts mehr aufbauen)
      return andere.reduce((b, j) => {
        const pj = rundenpunkte(sp.spieler[j].hand)
        const pb = rundenpunkte(sp.spieler[b].hand)
        return pj < pb || (pj === pb && sp.spieler[j].gesamt > sp.spieler[b].gesamt) ? j : b
      }, andere[0])
    }
    // Drei ziehen: wer dabei am ehesten verliert, was er hat
    const risiko = (j) => {
      const hj = sp.spieler[j].hand
      const pb = bustChance(sp, hj)
      return hj.chance ? pb * 0.5 : 1 - Math.pow(1 - pb, 3)
    }
    if (optionen.includes(von) && risiko(von) < 0.12 && me.hand.zahlen.length <= 4) return von
    if (!andere.length) return von
    return andere.reduce((b, j) => (risiko(j) * (rundenpunkte(sp.spieler[j].hand) + 6) > risiko(b) * (rundenpunkte(sp.spieler[b].hand) + 6) ? j : b), andere[0])
  }

  /** Entscheider für lauter Rechnerspieler (Tests, Rechner-Anteil der Oberfläche). */
  const rechnerEntscheider = { zug: async (sp, i) => kiZug(sp, i), ziel: async (sp, von, karte, opt) => kiZiel(sp, von, karte, opt) }

  const Flip7 = { AKTIONEN, stapelBauen, neuesSpiel, runde, sieger, rundenpunkte, kartenName, aktive, istLeer, erwartung, bustChance, kiZug, kiZiel, rechnerEntscheider }
  if (typeof module !== 'undefined' && module.exports) module.exports = Flip7
  else window.Flip7 = Flip7
})()
