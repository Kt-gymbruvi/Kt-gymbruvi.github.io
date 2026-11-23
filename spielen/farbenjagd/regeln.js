/*
 * Farbenjagd – Ablegespiel: Farbe oder Zeichen bedienen, wer zuerst keine Karten mehr hat, gewinnt
 * (Browser: window.Farbenjagd, Node: module.exports).
 * Karte: { f: 0–3 Farbe | 4 Joker, w: 0–9 | 'aus' (Aussetzen) | 'dreh' (Richtungswechsel) | 'zwei' (+2) | 'wahl' (Farbwahl) | 'vier' (+4 und Farbwahl) }
 * Zustand: { spieler, dran, richtung: 1 | -1, haende: [[Karten]], stapel, ablage (oberste zuletzt), farbe, gezogen, ende, log, saat }
 * Aktionen: { t: 'lege', i: Index in der Hand, farbe?: 0–3 (bei Jokern) }, { t: 'ziehe' }, { t: 'passe' } (nur nach dem Ziehen)
 */
;(function () {
  'use strict'
  const H = typeof module !== 'undefined' && module.exports ? require('../gruppe-hilfe.js') : window.GruppenHilfe

  const FARBEN = ['Rot', 'Blau', 'Gelb', 'Grün']
  const ZEICHEN = { aus: 'Aussetzen', dreh: 'Richtungswechsel', zwei: '+2', wahl: 'Farbwahl', vier: '+4' }
  const kartenName = (k) => (k.f === 4 ? ZEICHEN[k.w] : FARBEN[k.f] + ' ' + (typeof k.w === 'number' ? k.w : ZEICHEN[k.w]))

  function stapelNeu() {
    const s = []
    for (let f = 0; f < 4; f++) {
      s.push({ f, w: 0 })
      for (let w = 1; w <= 9; w++) s.push({ f, w }, { f, w })
      ;['aus', 'dreh', 'zwei'].forEach((w) => s.push({ f, w }, { f, w }))
    }
    for (let i = 0; i < 4; i++) s.push({ f: 4, w: 'wahl' }, { f: 4, w: 'vier' })
    return s
  }

  function ziehen(z, sitz, n) {
    for (let i = 0; i < n; i++) {
      if (!z.stapel.length) {
        const oben = z.ablage.pop()
        z.stapel = H.mische(z, z.ablage)
        z.ablage = [oben]
        if (!z.stapel.length) return // alle Karten auf der Hand
      }
      z.haende[sitz].push(z.stapel.pop())
    }
  }

  const naechster = (z, schritte) => (((z.dran + z.richtung * (schritte || 1)) % z.spieler.length) + z.spieler.length) % z.spieler.length
  const oben = (z) => z.ablage[z.ablage.length - 1]
  const passt = (z, k) => k.f === 4 || k.f === z.farbe || (k.w === oben(z).w && oben(z).f !== 4)

  function neu(spieler, optionen, saat) {
    const z = { spieler, optionen: optionen || {}, saat: saat >>> 0, dran: 0, richtung: 1, haende: spieler.map(() => []), stapel: [], ablage: [], farbe: 0, gezogen: false, ende: null, log: [] }
    z.stapel = H.mische(z, stapelNeu())
    for (let r = 0; r < 7; r++) spieler.forEach((_, i) => z.haende[i].push(z.stapel.pop()))
    // Erste Karte: eine Zahlenkarte
    let k = z.stapel.pop()
    while (typeof k.w !== 'number') {
      z.stapel.unshift(k)
      k = z.stapel.pop()
    }
    z.ablage.push(k)
    z.farbe = k.f
    H.melde(z, 'Los geht es mit ' + kartenName(k) + '.')
    return z
  }

  function anwenden(z0, sitz, a) {
    if (!a || z0.ende || sitz !== z0.dran) return null
    const z = H.kopie(z0)
    const hand = z.haende[sitz]
    const n = z.spieler.length
    if (a.t === 'ziehe') {
      if (z.gezogen) return null
      ziehen(z, sitz, 1)
      const k = hand[hand.length - 1]
      if (k && passt(z, k)) {
        z.gezogen = true // darf die gezogene Karte gleich legen oder passen
        H.melde(z, H.name(z, sitz) + ' zieht eine Karte.')
      } else {
        H.melde(z, H.name(z, sitz) + ' zieht eine Karte und passt.')
        z.dran = naechster(z)
      }
      return z
    }
    if (a.t === 'passe') {
      if (!z.gezogen) return null
      z.gezogen = false
      z.dran = naechster(z)
      return z
    }
    if (a.t !== 'lege' || !Number.isInteger(a.i) || a.i < 0 || a.i >= hand.length) return null
    if (z.gezogen && a.i !== hand.length - 1) return null
    const k = hand[a.i]
    if (!passt(z, k)) return null
    if (k.f === 4 && !(Number.isInteger(a.farbe) && a.farbe >= 0 && a.farbe < 4)) return null
    hand.splice(a.i, 1)
    z.ablage.push(k)
    z.farbe = k.f === 4 ? a.farbe : k.f
    z.gezogen = false
    H.melde(z, H.name(z, sitz) + ' legt ' + kartenName(k) + (k.f === 4 ? ' und wünscht sich ' + FARBEN[a.farbe] : '') + '.')
    if (!hand.length) {
      z.ende = { sieger: [sitz], text: H.name(z, sitz) + ' hat keine Karten mehr und gewinnt!' }
      H.melde(z, z.ende.text)
      return z
    }
    if (hand.length === 1) H.melde(z, H.name(z, sitz) + ' hat nur noch eine Karte!')
    let weiter = 1
    if (k.w === 'aus') weiter = 2
    if (k.w === 'dreh') {
      z.richtung = -z.richtung
      if (n === 2) weiter = 2
    }
    if (k.w === 'zwei' || k.w === 'vier') {
      const opfer = naechster(z)
      ziehen(z, opfer, k.w === 'zwei' ? 2 : 4)
      H.melde(z, H.name(z, opfer) + ' zieht ' + (k.w === 'zwei' ? 2 : 4) + ' Karten und setzt aus.')
      weiter = 2
    }
    z.dran = naechster(z, weiter)
    return z
  }

  // ---------- Computer ----------
  function lieblingsfarbe(hand) {
    const c = [0, 0, 0, 0]
    hand.forEach((k) => k.f < 4 && c[k.f]++)
    return c.indexOf(Math.max(...c))
  }
  function ki(z, sitz) {
    const hand = z.haende[sitz]
    const moeglich = hand.map((k, i) => i).filter((i) => (!z.gezogen || i === hand.length - 1) && passt(z, hand[i]))
    if (!moeglich.length) return z.gezogen ? { t: 'passe' } : { t: 'ziehe' }
    const naechsterHat = z.haende[naechster(z)].length
    const wert = (k) => {
      let x = typeof k.w === 'number' ? k.w : 0
      if (k.f === 4) x -= naechsterHat <= 2 ? -20 : 30 // Joker aufheben, außer der Nächste ist fast fertig
      if (k.w === 'zwei' || k.w === 'aus' || (k.w === 'dreh' && z.spieler.length === 2)) x += naechsterHat <= 2 ? 25 : 5
      if (k.f === lieblingsfarbe(hand)) x += 3
      return x
    }
    moeglich.sort((a, b) => wert(hand[b]) - wert(hand[a]))
    const i = moeglich[0]
    const k = hand[i]
    if (k.f === 4) {
      const rest = hand.filter((_, j) => j !== i)
      return { t: 'lege', i, farbe: rest.some((x) => x.f < 4) ? lieblingsfarbe(rest) : 0 }
    }
    return { t: 'lege', i }
  }

  const punkte = (z, i) => z.haende[i].length + (z.haende[i].length === 1 ? ' Karte' : ' Karten')

  const api = { id: 'farbenjagd', name: 'Farbenjagd', min: 2, max: 6, standard: 3, FARBEN, ZEICHEN, kartenName, passt, oben, neu, anwenden, ki, punkte }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else window.Farbenjagd = api
})()
