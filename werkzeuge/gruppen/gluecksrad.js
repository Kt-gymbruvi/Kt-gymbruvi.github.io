/* Glücksrad für „Gruppen & Zufall“ – nur die Zeichnung und das Drehen.
   Wer gewinnt, wird vorher ausgelost (crypto, in index.html); das Rad läuft dann weich auf dieses Feld aus.
   Feld 0 beginnt oben und läuft im Uhrzeigersinn, der Zeiger steht fest oben (gleiche Rechnung wie in der Tafel:
   ../Lehrraum/src/kern/zufall.ts, `raddrehung`). Farben nur aus gemeinsam/tokens.css (Klassen in index.html). */
;(function () {
  'use strict'

  const NS = 'http://www.w3.org/2000/svg'
  const R = 96
  const norm = (g) => ((g % 360) + 360) % 360
  const zahl = (z) => z.toFixed(2)

  function punkt(winkel, r) {
    const w = ((winkel - 90) * Math.PI) / 180 // 0° = oben
    return [Math.cos(w) * r, Math.sin(w) * r]
  }
  function svg(tag, attribute, kinder) {
    const e = document.createElementNS(NS, tag)
    for (const k in attribute || {}) e.setAttribute(k, attribute[k])
    ;(kinder || []).forEach((c) => e.append(c))
    return e
  }
  const kurz = (name, max) => (name.length > max ? name.slice(0, Math.max(1, max - 1)) + '…' : name)

  /** Neue Gesamtdrehung (Grad, wächst nur): `runden` volle Runden plus Rest, damit der Zeiger auf Feld `feld` zeigt. */
  function drehungFuer(aktuell, n, feld, versatz, runden) {
    const breite = 360 / Math.max(1, n)
    const stelle = 0.1 + 0.8 * Math.min(1, Math.max(0, versatz))
    return aktuell + Math.max(0, Math.floor(runden)) * 360 + norm(-(feld + stelle) * breite - aktuell)
  }

  /**
   * Zeichnet das Rad in `ziel`. `felder`: Liste von Namen. Liefert { drehe(feld, versatz, runden, dauerMs, fertig),
   * markiere(feld), verbrauche(feld) }.
   */
  function erzeuge(ziel, felder) {
    const n = felder.length
    const breite = 360 / Math.max(1, n)
    const schrift = Math.max(2.6, Math.min(8, 220 / Math.max(6, n) / 1.5))
    const maxZeichen = Math.round(Math.max(7, Math.min(16, 56 / schrift + 4)))
    const dreh = svg('g', { class: 'rad-dreh' })
    const feldGruppen = []
    felder.forEach((name, i) => {
      const a0 = i * breite
      const [x0, y0] = punkt(a0, R)
      const [x1, y1] = punkt(a0 + breite, R)
      let farbe = i % 3
      if (n > 1 && i === n - 1 && farbe === 0) farbe = 3
      const g = svg('g', { class: 'rad-feld' })
      if (n === 1) g.append(svg('circle', { r: R, class: 'rad-f0' }))
      else g.append(svg('path', { d: `M0 0 L${zahl(x0)} ${zahl(y0)} A${R} ${R} 0 ${breite > 180 ? 1 : 0} 1 ${zahl(x1)} ${zahl(y1)} Z`, class: 'rad-f' + farbe }))
      const t = svg('text', { transform: `rotate(${zahl(a0 + breite / 2 - 90)}) translate(${R - 6} 0)`, 'text-anchor': 'end', 'dominant-baseline': 'central', 'font-size': schrift, class: 'rad-name' })
      t.textContent = kurz(name, maxZeichen)
      g.append(t)
      dreh.append(g)
      feldGruppen.push(g)
    })
    dreh.append(svg('circle', { r: R, class: 'rad-rand' }))
    const bild = svg('svg', { viewBox: '-106 -106 212 212', class: 'rad-bild', 'aria-hidden': 'true' }, [dreh, svg('circle', { r: 9, class: 'rad-nabe' }), svg('path', { d: 'M0 -86 L-8 -104 L8 -104 Z', class: 'rad-zeiger' })])
    ziel.textContent = ''
    ziel.setAttribute('role', 'img')
    ziel.setAttribute('aria-label', `Glücksrad mit ${n} Feldern`)
    ziel.append(bild)

    let drehung = 0
    let uhr = 0
    return {
      drehe(feld, versatz, runden, dauer, fertig) {
        clearTimeout(uhr)
        feldGruppen.forEach((g) => g.classList.remove('gewinner'))
        drehung = drehungFuer(drehung, n, feld, versatz, dauer ? runden : 0)
        dreh.style.transition = dauer ? `transform ${dauer}ms cubic-bezier(0.1, 0.62, 0.08, 1)` : 'none'
        dreh.style.transform = `rotate(${drehung}deg)`
        uhr = setTimeout(() => {
          feldGruppen[feld].classList.add('gewinner')
          fertig()
        }, dauer + 60)
      },
      verbrauche(feld) {
        feldGruppen[feld].classList.add('verbraucht')
      },
    }
  }

  window.Gluecksrad = { erzeuge, drehungFuer }
})()
