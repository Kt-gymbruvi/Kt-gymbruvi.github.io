/*
 * Inselhandel – Zeichnen von Brett, Karten und Knöpfen (Regeln in regeln.js, Ablauf in ../gruppe.js).
 * Bildchen kommen aus dem SVG-Vorrat in index.html (<symbol id="ih-…">).
 */
;(function () {
  'use strict'
  const I = window.Inselhandel
  const SVG = 'http://www.w3.org/2000/svg'
  const FARBE = {
    holz: 'var(--feld-wald)', lehm: 'var(--feld-lehm)', wolle: 'var(--feld-weide)', korn: 'var(--feld-korn)', erz: 'var(--feld-erz)', wueste: 'var(--feld-wueste)',
    papier: 'var(--ware-papier)', tuch: 'var(--ware-tuch)', muenze: 'var(--ware-muenze)',
  }
  const ZFARBE = { handel: 'var(--zunft-handel)', politik: 'var(--zunft-politik)', wissen: 'var(--zunft-wissen)' }
  const KFARBE = { waechter: 'var(--karte-joker)', wegebau: 'var(--feld-lehm)', ernte: 'var(--feld-korn)', markt: 'var(--ware-tuch)', denkmal: 'var(--zunft-handel)' }
  const AUGEN = { 1: [5], 2: [3, 7], 3: [3, 5, 7], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] }
  const BAUTEN = {
    strasse: 'Straße', siedlung: 'Siedlung', stadt: 'Stadt', ritter: 'Ritter', befoerdern: 'Befördern', aktivieren: 'Ausrüsten', mauer: 'Stadtmauer', vertreiben: 'Nebel vertreiben',
  }
  const HINWEIS = {
    strasse: 'Tippe eine gestrichelte Linie an.',
    siedlung: 'Tippe einen hellen Kreis an.',
    stadt: 'Tippe eine eigene Siedlung an.',
    ritter: 'Tippe einen gestrichelten Kreis an einer eigenen Straße an.',
    befoerdern: 'Tippe einen eigenen Ritter an.',
    aktivieren: 'Tippe einen eigenen, leeren Ritter an.',
    mauer: 'Tippe eine eigene Stadt an.',
    vertreiben: 'Tippe einen aktiven Ritter am Nebelfeld an.',
  }

  let bau = null // gewählte Bauart
  let geben = null // Tausch: was abgeben
  let nebelFeld = -1
  let wahl = null // { art: 'ernte', r: [] } | { art: 'markt' }
  let merk = ''
  let wurfMerk = ''
  let handMerk = null

  function s(name, attr) {
    const e = document.createElementNS(SVG, name)
    Object.keys(attr || {}).forEach((k) => e.setAttribute(k, attr[k]))
    return e
  }
  function el(tag, klasse, text) {
    const e = document.createElement(tag)
    if (klasse) e.className = klasse
    if (text != null) e.textContent = text
    return e
  }
  function knopf(text, klasse, bei) {
    const b = el('button', 'knopf' + (klasse ? ' ' + klasse : ''), text)
    b.type = 'button'
    if (bei) b.addEventListener('click', bei)
    return b
  }
  /** Bildchen aus dem Vorrat als eigenes kleines SVG. */
  function bild(id) {
    const v = s('svg', { viewBox: '0 0 44 30', 'aria-hidden': 'true', focusable: 'false' })
    v.append(s('use', { href: '#ih-' + id }))
    return v
  }
  function mini(r) {
    const m = el('span', 'mini')
    m.style.background = FARBE[r] || ZFARBE[r] || KFARBE[r]
    m.append(bild(r))
    return m
  }
  const kostenText = (k) => Object.keys(k).map((r) => (k[r] > 1 ? k[r] + ' ' : '') + I.NAMEN[r]).join(', ')
  function kostenEl(k) {
    const w = el('span', 'kosten')
    Object.keys(k).forEach((r) => {
      const t = el('span', 'kosten-teil')
      t.append(mini(r))
      if (k[r] > 1) t.append(document.createTextNode('×' + k[r]))
      w.append(t)
    })
    w.append(el('span', 'vorlesen', kostenText(k)))
    return w
  }
  function vieleck(fi, k) {
    const f = I.FELDER[fi]
    return f.ecken
      .map((e) => {
        const E = I.ECKEN[e]
        return (f.x + (E.x - f.x) * k).toFixed(1) + ',' + (f.y + (E.y - f.y) * k).toFixed(1)
      })
      .join(' ')
  }

  // ---------- Was ist gerade möglich? ----------
  const eigeneRitter = (z, ich) => z.ritter.map((r, e) => (r && r.s === ich ? e : -1)).filter((e) => e >= 0)
  function ziele(z, ich, art) {
    const E = I.ECKEN.map((_, e) => e)
    if (art === 'strasse') return I.KANTEN.map((_, k) => k).filter((k) => I.strasseErlaubt(z, ich, k))
    if (art === 'siedlung') return E.filter((e) => I.siedlungErlaubt(z, ich, e))
    if (art === 'stadt') return E.filter((e) => z.bauten[e] && z.bauten[e].s === ich && !z.bauten[e].stadt)
    if (art === 'mauer') return E.filter((e) => z.bauten[e] && z.bauten[e].s === ich && z.bauten[e].stadt && !z.bauten[e].mauer)
    if (art === 'ritter') return E.filter((e) => I.ritterErlaubt(z, ich, e))
    if (art === 'befoerdern') return eigeneRitter(z, ich).filter((e) => I.kannBefoerdern(z, ich, e))
    if (art === 'aktivieren') return eigeneRitter(z, ich).filter((e) => !z.ritter[e].aktiv)
    if (art === 'vertreiben') return eigeneRitter(z, ich).filter((e) => I.kannVertreiben(z, ich, e))
    return []
  }
  function moeglich(z, ich, art) {
    const k = z.karten[ich]
    if (art === 'strasse') return (z.freiStrassen > 0 || I.kann(k, I.KOSTEN.strasse)) && I.anzahl(z, ich, 'strasse') < I.VORRAT.strasse && ziele(z, ich, art).length > 0
    if (art === 'siedlung') return I.kann(k, I.KOSTEN.siedlung) && I.anzahl(z, ich, 'siedlung') < I.VORRAT.siedlung && ziele(z, ich, art).length > 0
    if (art === 'stadt') return I.kann(k, I.KOSTEN.stadt) && I.anzahl(z, ich, 'stadt') < I.VORRAT.stadt && ziele(z, ich, art).length > 0
    if (art === 'mauer') return I.kann(k, I.KOSTEN.mauer) && I.mauern(z, ich) < I.VORRAT.mauer && ziele(z, ich, art).length > 0
    if (art === 'ritter') return I.kann(k, I.KOSTEN.ritter) && I.ritterZahl(z, ich, 1) < I.VORRAT.ritter && ziele(z, ich, art).length > 0
    if (art === 'befoerdern') return I.kann(k, I.KOSTEN.befoerdern) && ziele(z, ich, art).length > 0
    if (art === 'aktivieren') return I.kann(k, I.KOSTEN.aktivieren) && ziele(z, ich, art).length > 0
    if (art === 'vertreiben') return ziele(z, ich, art).length > 0
    return false
  }
  const kannSpielen = (z, ich, art) =>
    !z.gespielt && I.spielbar(z, ich, art) && (z.phase === 'bauen' || (z.phase === 'wuerfeln' && art === 'waechter')) && (art !== 'waechter' || I.nebelAktiv(z))

  // ---------- Figuren ----------
  function haus(x, y, farbe, b) {
    const g = s('g', { class: 'figur' })
    const teil = (d, klasse, f) => {
      const p = s('path', { d, class: klasse })
      if (f) p.style.fill = f
      g.append(p)
    }
    if (b.mauer) {
      g.append(s('rect', { x: x - 13, y: y + 1.5, width: 26, height: 8, rx: 1.5, class: 'mauer' }))
      ;[-10.5, -4, 2.5, 9].forEach((dx) => g.append(s('rect', { x: x + dx - 1.4, y: y - 0.3, width: 2.8, height: 2.4, class: 'mauer' })))
    }
    if (!b.stadt) {
      teil(`M${x - 6.5},${y - 1} H${x + 6.5} V${y + 6.5} H${x - 6.5} Z`, 'bau', farbe)
      teil(`M${x - 8},${y - 0.5} L${x},${y - 8.5} L${x + 8},${y - 0.5} Z`, 'bau', farbe)
      teil(`M${x},${y - 8.5} L${x + 8},${y - 0.5} H${x} Z`, 'dach-schatten')
      g.append(s('rect', { x: x - 1.5, y: y + 2, width: 3, height: 4.5, class: 'dach-schatten' }))
      return g
    }
    if (b.metro) {
      g.append(s('line', { x1: x - 6, y1: y - 13, x2: x - 6, y2: y - 22, class: 'metro-mast' }))
      const fahne = s('path', { d: `M${x - 6},${y - 22} h8 l-2 2.5 l2 2.5 h-8 Z`, class: 'bau' })
      fahne.style.fill = ZFARBE[b.metro]
      g.append(fahne)
    }
    teil(`M${x - 2},${y + 7} V${y - 1} H${x + 10.5} V${y + 7} Z`, 'bau', farbe)
    teil(`M${x - 3},${y - 0.5} L${x + 4.2},${y - 6.5} L${x + 11.5},${y - 0.5} Z`, 'bau', farbe)
    teil(`M${x + 4.2},${y - 6.5} L${x + 11.5},${y - 0.5} H${x + 4.2} Z`, 'dach-schatten')
    teil(`M${x - 10.5},${y + 7} V${y - 6.5} H${x - 1.5} V${y + 7} Z`, 'bau', farbe)
    teil(`M${x - 11.5},${y - 6} L${x - 6},${y - 13} L${x - 0.5},${y - 6} Z`, 'bau', farbe)
    teil(`M${x - 6},${y - 13} L${x - 0.5},${y - 6} H${x - 6} Z`, 'dach-schatten')
    g.append(s('rect', { x: x - 7.5, y: y - 3.5, width: 3, height: 3, class: 'fenster' }))
    g.append(s('rect', { x: x + 1.5, y: y + 1.5, width: 2.6, height: 2.6, class: 'fenster' }))
    g.append(s('rect', { x: x + 6, y: y + 1.5, width: 2.6, height: 2.6, class: 'fenster' }))
    return g
  }
  function ritterFigur(x, y, farbe, r) {
    const g = s('g', { class: 'figur' })
    const schild = s('path', { d: `M${x - 6.5},${y - 7.5} H${x + 6.5} V${y - 1} Q${x + 6.5},${y + 5.5} ${x},${y + 8.5} Q${x - 6.5},${y + 5.5} ${x - 6.5},${y - 1} Z`, class: r.aktiv ? 'bau' : 'ritter-leer' })
    if (r.aktiv) schild.style.fill = farbe
    else schild.style.stroke = farbe
    g.append(schild)
    for (let i = 0; i < r.stufe; i++) {
      const m = s('circle', { cx: x + (i - (r.stufe - 1) / 2) * 3.8, cy: y - 0.5, r: 1.5, class: 'ritter-marke' })
      if (!r.aktiv) m.style.fill = farbe
      g.append(m)
    }
    const t = s('title')
    t.textContent = 'Ritter Stufe ' + r.stufe + (r.aktiv ? ', ausgerüstet' : ', nicht ausgerüstet')
    g.append(t)
    return g
  }

  // ---------- Brett ----------
  function brettZeichnen(z, a, modus) {
    const ich = a.ich
    const svg = s('svg', { id: 'insel', viewBox: '-218 -196 436 392', role: 'img', 'aria-label': 'Insel mit 19 Feldern' })
    svg.append(s('rect', { x: -218, y: -196, width: 436, height: 392, rx: 26, class: 'meer' }))
    svg.append(s('rect', { x: -218, y: -196, width: 436, height: 392, rx: 26, class: 'meer-wellen' }))
    I.FELDER.forEach((_, fi) => svg.append(s('polygon', { points: vieleck(fi, 1.3), class: 'brandung' })))
    I.FELDER.forEach((_, fi) => svg.append(s('polygon', { points: vieleck(fi, 1.16), class: 'strand' })))

    I.FELDER.forEach((f, fi) => {
      const feld = z.felder[fi]
      const waehlbar = a.darf && z.phase === 'nebel' && fi !== z.nebel
      const g = s('g', { class: 'feld' + (waehlbar ? ' waehlbar' : '') + (fi === nebelFeld ? ' gewaehlt' : '') })
      const p = s('polygon', { points: vieleck(fi, 0.955), class: 'land' })
      p.style.fill = FARBE[feld.art]
      const t = s('title')
      t.textContent = I.NAMEN[feld.art] + (feld.zahl ? ' ' + feld.zahl : '')
      p.append(t)
      g.append(p, s('polygon', { points: vieleck(fi, 0.955), class: 'licht' }))
      g.append(s('use', { href: '#ih-' + feld.art, x: f.x - 19, y: f.y - 29, width: 38, height: 26 }))
      if (feld.zahl) {
        const heiss = feld.zahl === 6 || feld.zahl === 8
        const c = s('g', { class: 'chip' + (heiss ? ' heiss' : '') })
        c.append(s('circle', { cx: f.x, cy: f.y + 12, r: 12.5, class: 'chip-grund' }))
        c.append(s('circle', { cx: f.x, cy: f.y + 12, r: 10.4, class: 'chip-ring' }))
        const tz = s('text', { x: f.x, y: f.y + 10, class: 'chip-zahl' })
        tz.textContent = feld.zahl
        c.append(tz)
        const n = I.punktwert(feld.zahl)
        for (let i = 0; i < n; i++) c.append(s('circle', { cx: f.x + (i - (n - 1) / 2) * 2.9, cy: f.y + 18.2, r: 1.05, class: 'chip-punkt' }))
        g.append(c)
      }
      if (waehlbar)
        g.addEventListener('click', () => {
          const opfer = I.nebelOpfer(z, ich, fi)
          if (opfer.length <= 1) return a.sende(opfer.length ? { t: 'nebel', feld: fi, opfer: opfer[0] } : { t: 'nebel', feld: fi })
          nebelFeld = fi
          a.neu()
        })
      svg.append(g)
    })

    // Nebel
    const nf = I.FELDER[z.nebel]
    const wolke = s('g', { class: 'nebel-wolke' + (I.nebelAktiv(z) ? '' : ' ruht') })
    ;[[-13, 3, 10], [-2, -5, 13], [11, 1, 11], [3, 8, 10], [-9, 9, 8]].forEach(([dx, dy, r]) => wolke.append(s('circle', { cx: nf.x + dx, cy: nf.y + dy, r, class: 'nebel' })))
    ;[[-4, -8, 5], [9, -2, 4]].forEach(([dx, dy, r]) => wolke.append(s('circle', { cx: nf.x + dx, cy: nf.y + dy, r, class: 'nebel-licht' })))
    const nt = s('text', { x: nf.x, y: nf.y + 2, class: 'nebel-text' })
    nt.textContent = I.nebelAktiv(z) ? 'Nebel' : 'Nebel ruht'
    wolke.append(nt)
    svg.append(wolke)

    // Straßen
    z.strassen.forEach((sp, k) => {
      if (sp === null) return
      const A = I.ECKEN[I.KANTEN[k].a]
      const B = I.ECKEN[I.KANTEN[k].b]
      const pt = { x1: A.x + (B.x - A.x) * 0.15, y1: A.y + (B.y - A.y) * 0.15, x2: B.x + (A.x - B.x) * 0.15, y2: B.y + (A.y - B.y) * 0.15 }
      svg.append(s('line', Object.assign({ class: 'strasse-rand' }, pt)))
      const l = s('line', Object.assign({ class: 'strasse' }, pt))
      l.style.stroke = a.farbe(sp)
      svg.append(l, s('line', Object.assign({ class: 'strasse-glanz' }, pt)))
    })

    // Mögliche Straßen (unter den Figuren)
    if (modus === 'strasse')
      ziele(z, ich, 'strasse').forEach((k) => {
        const A = I.ECKEN[I.KANTEN[k].a]
        const B = I.ECKEN[I.KANTEN[k].b]
        const pt = { x1: A.x, y1: A.y, x2: B.x, y2: B.y }
        const t = s('line', Object.assign({ class: 'weg-treffer' }, pt))
        t.addEventListener('click', () => a.sende({ t: 'strasse', kante: k }))
        svg.append(t, s('line', Object.assign({ class: 'weg' }, pt)))
      })
    // Bauten und Ritter
    const klickZiele = new Set(modus && !['strasse', 'siedlung', 'ritter'].includes(modus) ? ziele(z, ich, modus) : [])
    const klickbar = (g, e) => {
      if (!klickZiele.has(e)) return
      const { x, y } = I.ECKEN[e]
      g.classList.add('klickbar')
      g.append(s('circle', { cx: x, cy: y, r: 13, class: 'ziel-ring' }))
      g.addEventListener('click', () => a.sende({ t: modus, ecke: e }))
    }
    z.bauten.forEach((b, e) => {
      if (!b) return
      const g = haus(I.ECKEN[e].x, I.ECKEN[e].y, a.farbe(b.s), b)
      klickbar(g, e)
      svg.append(g)
    })
    z.ritter.forEach((r, e) => {
      if (!r) return
      const g = ritterFigur(I.ECKEN[e].x, I.ECKEN[e].y, a.farbe(r.s), r)
      klickbar(g, e)
      svg.append(g)
    })

    // Bauplätze
    if (modus === 'siedlung' || modus === 'ritter')
      ziele(z, ich, modus).forEach((e) => {
        const c = s('circle', { cx: I.ECKEN[e].x, cy: I.ECKEN[e].y, r: 6.5, class: 'ort' + (modus === 'ritter' ? ' ritter-ort' : '') })
        c.addEventListener('click', () => a.sende({ t: modus, ecke: e }))
        svg.append(c)
      })
    return svg
  }

  function piratenZeichnen(z) {
    const st = I.staerke(z)
    const ab = z.spieler.reduce((x, _, i) => x + I.abwehr(z, i), 0)
    const box = el('div', 'ih-piraten')
    const kopf = el('div', 'ih-piraten-kopf')
    const titel = el('b', z.piraten >= I.PIRATEN_WEG - 2 && ab < st ? 'gefahr' : '', 'Piratenschiff ' + z.piraten + ' von ' + I.PIRATEN_WEG)
    kopf.append(titel, el('span', null, 'Stärke ' + st + ' (Städte) · Abwehr ' + ab + ' (aktive Ritter)' + (z.angriffe ? ' · ' + z.angriffe + ' Angriff' + (z.angriffe > 1 ? 'e' : '') : '')))
    box.append(kopf)
    const v = s('svg', { viewBox: '0 0 340 40', 'aria-hidden': 'true' })
    v.append(s('rect', { x: 0, y: 0, width: 340, height: 40, rx: 10, class: 'bahn' }))
    v.append(s('line', { x1: 22, y1: 28, x2: 300, y2: 28, class: 'bahn-linie' }))
    for (let i = 0; i <= I.PIRATEN_WEG; i++) v.append(s('circle', { cx: 22 + i * 38, cy: 28, r: 3.5, class: 'bahn-feld' + (i < z.piraten ? ' hinter' : '') }))
    v.append(s('use', { href: '#ih-insel', x: 292, y: 4, width: 46, height: 32 }))
    v.append(s('use', { href: '#ih-schiff', x: 22 + z.piraten * 38 - 18, y: 2, width: 36, height: 25 }))
    box.append(v)
    return box
  }

  // ---------- Karten ----------
  function handZeichnen(z, a) {
    const ich = a.ich
    const karten = z.karten[ich]
    const mitEw = I.ew(z)
    const bereich = el('section', 'ih-bereich')
    const kopf = el('div', 'ih-kopfzeile')
    kopf.append(el('h3', null, (a.online ? 'Deine' : a.name(ich) + 's') + ' Karten'), el('span', null, I.summe(karten) + ' Karten · bei einer 7 ab ' + (I.handLimit(z, ich) + 1) + ' die Hälfte weg'))
    bereich.append(kopf)
    const hand = el('div', 'ih-hand')
    const vorher = handMerk && handMerk.ich === ich ? handMerk.k : null
    ;(mitEw ? I.ALLE : I.ROHSTOFFE).forEach((r) => {
      const k = el('div', 'rkarte' + (karten[r] ? '' : ' null') + (vorher && karten[r] > vorher[r] ? ' neu' : ''))
      const b = el('div', 'rkarte-bild')
      b.style.background = FARBE[r]
      b.append(bild(r))
      k.append(b, el('b', null, String(karten[r])), el('small', null, I.NAMEN[r]))
      hand.append(k)
    })
    handMerk = { ich, k: Object.assign({}, karten) }
    bereich.append(hand)

    // Entwicklungs- bzw. Fortschrittskarten
    const hk = z.hand[ich]
    const arten = I.SPIELKARTEN.filter((x) => hk[x] > 0)
    const kk = el('div', 'ih-kopfzeile')
    kk.append(el('h3', null, mitEw ? 'Fortschrittskarten' : 'Entwicklungskarten'))
    const extra = []
    if (z.denkmal[ich]) extra.push(z.denkmal[ich] + ' Denkmal' + (z.denkmal[ich] > 1 ? 'e' : ''))
    if (z.wache[ich]) extra.push(z.wache[ich] + ' Wächter gespielt')
    if (z.retter[ich]) extra.push(z.retter[ich] + '× Inselretter')
    extra.push('Stapel: ' + z.stapel.length)
    kk.append(el('span', null, extra.join(' · ')))
    bereich.append(kk)
    if (!arten.length)
      bereich.append(el('p', 'hinweis', mitEw ? 'Fortschrittskarten bringt der Ereigniswürfel, sobald eine Zunft ausgebaut ist.' : 'Noch keine Karten. Eine Entwicklungskarte kostet Wolle, Korn und Erz.'))
    else {
      const reihe = el('div', 'ih-ekarten')
      arten.forEach((art) => {
        const karte = el('div', 'ekarte')
        const b = el('div', 'ekarte-bild')
        b.style.background = KFARBE[art]
        b.append(bild(art), el('span', 'ekarte-zahl', String(hk[art])))
        const text = el('div', 'ekarte-text')
        text.append(el('b', null, I.KARTEN[art].name), el('small', null, I.KARTEN[art].text))
        const frisch = ich === z.dran ? z.frisch[art] || 0 : 0
        if (frisch && frisch >= hk[art]) text.append(el('small', null, 'Neu gekauft – erst im nächsten Zug.'))
        if (a.darf && kannSpielen(z, ich, art)) {
          text.append(
            knopf('Ausspielen', 'klein', () => {
              if (art === 'ernte' || art === 'markt') {
                wahl = { art, r: [] }
                bau = null
                geben = null
                a.neu()
              } else a.sende({ t: 'spielen', art })
            }),
          )
        }
        karte.append(b, text)
        reihe.append(karte)
      })
      bereich.append(reihe)
    }
    if (wahl && a.darf) {
      const w = el('div', 'ih-wahl')
      w.append(el('p', null, wahl.art === 'ernte' ? 'Gute Ernte: Wähle zwei Rohstoffe' + (wahl.r.length ? ' (gewählt: ' + I.NAMEN[wahl.r[0]] + ')' : '') + '.' : 'Marktrecht: Welche Sorte sollen dir alle geben?'))
      const r = el('div', 'knopf-reihe')
      ;(wahl.art === 'markt' && mitEw ? I.ALLE : I.ROHSTOFFE).forEach((x) => {
        const b = knopf('', 'zweit klein', () => {
          if (wahl.art === 'markt') return a.sende({ t: 'spielen', art: 'markt', r: x })
          wahl.r.push(x)
          if (wahl.r.length === 2) a.sende({ t: 'spielen', art: 'ernte', r1: wahl.r[0], r2: wahl.r[1] })
          else a.neu()
        })
        b.append(mini(x), document.createTextNode(I.NAMEN[x]))
        r.append(b)
      })
      r.append(
        knopf('Abbrechen', 'leise klein', () => {
          wahl = null
          a.neu()
        }),
      )
      w.append(r)
      bereich.append(w)
    }
    return bereich
  }

  function zuenfteZeichnen(z, a) {
    const ich = a.ich
    const bereich = el('section', 'ih-bereich')
    const kopf = el('div', 'ih-kopfzeile')
    const r = I.ritterZahl(z, ich)
    kopf.append(el('h3', null, 'Zünfte und Ritter'), el('span', null, r + ' Ritter · Abwehr ' + I.abwehr(z, ich) + (I.mauern(z, ich) ? ' · ' + I.mauern(z, ich) + ' Stadtmauer' + (I.mauern(z, ich) > 1 ? 'n' : '') : '')))
    bereich.append(kopf)
    const raster = el('div', 'ih-zuenfte')
    const stadt = I.anzahl(z, ich, 'stadt') > 0
    I.ZUENFTE.forEach((t) => {
      const Z = I.ZUNFT[t]
      const stufe = z.zunft[ich][t]
      const box = el('div', 'zunft')
      box.style.setProperty('--zf', ZFARBE[t])
      const k = el('div', 'zunft-kopf')
      const m = el('span', 'mini')
      m.append(bild(t))
      k.append(m, el('b', null, Z.name), el('small', null, 'Stufe ' + stufe))
      const st = el('div', 'stufen')
      st.setAttribute('aria-hidden', 'true')
      for (let i = 1; i <= 5; i++) st.append(el('i', (i <= stufe ? 'an' : '') + (i === 3 ? ' drei' : '')))
      box.append(k, st, el('small', stufe >= 3 ? 'erreicht' : '', 'Ab Stufe 3: ' + Z.faehigkeit))
      const h = z.metro[t]
      box.append(el('small', h === ich ? 'erreicht' : '', h >= 0 ? 'Metropole: ' + a.name(h) : 'Metropole: frei (ab Stufe 4)'))
      if (a.darf && z.phase === 'bauen' && stufe < 5) {
        const b = knopf('', 'zweit klein', () => a.sende({ t: 'zunft', art: t }))
        b.append(document.createTextNode('Ausbauen'), mini(Z.ware), document.createTextNode('×' + (stufe + 1)))
        b.disabled = !stadt || z.karten[ich][Z.ware] < stufe + 1
        b.title = stadt ? (stufe + 1) + ' ' + I.NAMEN[Z.ware] : 'Erst eine Stadt bauen'
        box.append(b)
      }
      raster.append(box)
    })
    bereich.append(raster)
    if (!stadt) bereich.append(el('p', 'hinweis', 'Zünfte kann ausbauen, wer mindestens eine Stadt hat.'))
    return bereich
  }

  // ---------- Seitenleiste ----------
  function wuerfel(n, klasse, neu) {
    const w = el('span', 'wuerfel' + (klasse ? ' ' + klasse : '') + (neu ? ' rollt' : ''))
    w.setAttribute('role', 'img')
    w.setAttribute('aria-label', (klasse === 'rot' ? 'Roter Würfel ' : 'Würfel ') + n)
    AUGEN[n].forEach((c) => {
      const i = el('i')
      i.style.gridArea = Math.ceil(c / 3) + ' / ' + (((c - 1) % 3) + 1)
      w.append(i)
    })
    return w
  }

  function seiteZeichnen(z, a, modus) {
    const ich = a.ich
    const karten = ich != null ? z.karten[ich] : null
    const mitEw = I.ew(z)
    if (z.wurf) {
      const schluessel = z.log.length + ':' + z.wurf.join('') + z.ereignis
      const neu = schluessel !== wurfMerk
      wurfMerk = schluessel
      const w = el('div', 'ih-wuerfel')
      w.append(wuerfel(z.wurf[0], '', neu), wuerfel(z.wurf[1], mitEw ? 'rot' : '', neu))
      if (z.ereignis) {
        const e = el('span', 'wuerfel ereignis' + (neu ? ' rollt' : ''))
        e.style.background = z.ereignis === 'schiff' ? 'var(--feld-meer)' : ZFARBE[z.ereignis]
        e.setAttribute('role', 'img')
        e.setAttribute('aria-label', 'Ereignis: ' + (z.ereignis === 'schiff' ? 'Piratenschiff' : I.ZUNFT[z.ereignis].name))
        e.append(bild(z.ereignis === 'schiff' ? 'schiff' : z.ereignis))
        w.append(e)
      }
      w.append(el('span', 'ih-summe', '= ' + (z.wurf[0] + z.wurf[1])))
      a.aktionen.append(w)
      if (z.ereignis && z.ereignis !== 'schiff')
        a.aktionen.append(el('p', 'hinweis', 'Fortschritt ' + I.ZUNFT[z.ereignis].name + ': Karte für alle mit Stufe ' + Math.max(1, z.wurf[1] - 1) + ' oder mehr.'))
    }
    const info = el('div', 'ih-info')
    const chip = (t) => info.append(el('span', null, t))
    chip('Ziel: ' + z.optionen.ziel + ' Punkte')
    if (z.laengste >= 0) chip('Längste Straße: ' + a.name(z.laengste))
    if (z.staerkste >= 0) chip('Stärkste Wache: ' + a.name(z.staerkste))
    if (mitEw) I.ZUENFTE.forEach((t) => z.metro[t] >= 0 && chip('Metropole ' + I.ZUNFT[t].name + ': ' + a.name(z.metro[t])))
    a.aktionen.append(info)
    if (!a.darf) return

    if (z.phase === 'start') {
      a.aktionen.append(el('p', null, z.start.ecke < 0 ? 'Setze eine Siedlung: Tippe einen hellen Kreis an.' : 'Setze eine Straße an deine neue Siedlung.'))
      return
    }
    if (z.phase === 'wuerfeln') {
      a.aktionen.append(knopf('Würfeln', 'gross', () => a.sende({ t: 'wuerfeln' })))
      if (kannSpielen(z, ich, 'waechter')) a.aktionen.append(el('p', 'hinweis', 'Du kannst vor dem Würfeln einen Wächter ausspielen (bei deinen Karten).'))
      return
    }
    if (z.phase === 'nebel') {
      if (nebelFeld < 0) a.aktionen.append(el('p', null, (z.wurf && z.wurf[0] + z.wurf[1] === 7 && !z.gespielt ? 'Eine 7! ' : '') + 'Tippe ein Feld an, auf das der Nebel zieht.'))
      else {
        a.aktionen.append(el('p', null, 'Wem nimmst du eine Karte weg?'))
        const r = el('div', 'knopf-reihe')
        I.nebelOpfer(z, ich, nebelFeld).forEach((o) => r.append(knopf(a.name(o), 'zweit', () => a.sende({ t: 'nebel', feld: nebelFeld, opfer: o }))))
        a.aktionen.append(r)
      }
      return
    }

    // Bauen
    if (z.freiStrassen > 0) a.aktionen.append(el('p', 'hinweis', 'Wegebau: noch ' + z.freiStrassen + ' Straße' + (z.freiStrassen > 1 ? 'n' : '') + ' umsonst – tippe eine gestrichelte Linie an.'))
    const bk = el('div', 'ih-bau')
    const arten = ['strasse', 'siedlung', 'stadt'].concat(mitEw ? ['ritter', 'aktivieren', 'befoerdern', 'mauer'] : [])
    arten.forEach((art) => {
      const b = knopf('', bau === art ? 'zweit gewaehlt' : 'zweit', () => {
        bau = bau === art ? null : art
        geben = null
        wahl = null
        a.neu()
      })
      const kosten = art === 'strasse' && z.freiStrassen > 0 ? null : I.KOSTEN[art === 'aktivieren' ? 'aktivieren' : art]
      b.append(el('span', null, BAUTEN[art]))
      if (kosten) b.append(kostenEl(kosten))
      else b.append(el('small', null, 'umsonst'))
      b.disabled = !moeglich(z, ich, art)
      b.setAttribute('aria-pressed', String(bau === art))
      bk.append(b)
    })
    if (mitEw && ziele(z, ich, 'vertreiben').length) {
      const b = knopf('', (bau === 'vertreiben' ? 'zweit gewaehlt' : 'zweit') + ' breit', () => {
        bau = bau === 'vertreiben' ? null : 'vertreiben'
        a.neu()
      })
      b.append(el('span', null, 'Nebel vertreiben'), el('small', null, 'mit einem aktiven Ritter am Nebelfeld'))
      bk.append(b)
    }
    if (!mitEw) {
      const b = knopf('', 'zweit breit', () => a.sende({ t: 'kaufen' }))
      b.append(el('span', null, 'Entwicklungskarte kaufen' + (z.stapel.length ? ' (noch ' + z.stapel.length + ')' : ' – Stapel leer')), kostenEl(I.KOSTEN.karte))
      b.disabled = !z.stapel.length || !I.kann(karten, I.KOSTEN.karte)
      bk.append(b)
    }
    a.aktionen.append(bk)
    if (modus && !(modus === 'strasse' && z.freiStrassen > 0)) a.aktionen.append(el('p', 'hinweis', HINWEIS[modus]))

    // Tauschen
    const sorten = mitEw ? I.ALLE : I.ROHSTOFFE
    const viele = sorten.filter((r) => karten[r] >= I.kurs(z, ich, r))
    if (viele.length) {
      const t = el('div', 'ih-tausch')
      t.append(el('p', null, geben ? 'Tausche ' + I.kurs(z, ich, geben) + ' ' + I.NAMEN[geben] + ' gegen:' : 'Tauschen mit der Bank:'))
      const r = el('div', 'knopf-reihe')
      if (!geben)
        viele.forEach((x) => {
          const b = knopf('', 'zweit klein', () => {
            geben = x
            bau = null
            wahl = null
            a.neu()
          })
          b.append(document.createTextNode(I.kurs(z, ich, x) + '×'), mini(x))
          b.title = I.kurs(z, ich, x) + ' ' + I.NAMEN[x] + ' abgeben'
          b.append(el('span', 'vorlesen', I.NAMEN[x]))
          r.append(b)
        })
      else {
        sorten
          .filter((x) => x !== geben)
          .forEach((x) => {
            const b = knopf('', 'zweit klein', () => a.sende({ t: 'tausch', geben, nehmen: x }))
            b.append(mini(x), document.createTextNode(I.NAMEN[x]))
            r.append(b)
          })
        r.append(
          knopf('Abbrechen', 'leise klein', () => {
            geben = null
            a.neu()
          }),
        )
      }
      t.append(r)
      a.aktionen.append(t)
    }
    a.aktionen.append(knopf('Zug beenden', '', () => a.sende({ t: 'ende' })))
  }

  function zeichne(z, a) {
    const schluessel = [z.dran, z.phase, z.start ? z.start.pos + ':' + z.start.ecke : '', z.gespielt, z.freiStrassen].join(':')
    if (schluessel !== merk) {
      merk = schluessel
      bau = null
      geben = null
      nebelFeld = -1
      wahl = null
    }
    const ich = a.ich
    const karten = ich != null ? z.karten[ich] : null
    if (geben && (!karten || karten[geben] < I.kurs(z, ich, geben))) geben = null
    let modus = null
    if (a.darf && z.phase === 'start') modus = z.start.ecke < 0 ? 'siedlung' : 'strasse'
    else if (a.darf && z.phase === 'bauen') {
      if (bau && !moeglich(z, ich, bau)) bau = null
      modus = bau || (z.freiStrassen > 0 ? 'strasse' : null)
    }

    if (I.ew(z)) a.brett.append(piratenZeichnen(z))
    a.brett.append(brettZeichnen(z, a, modus))
    if (karten) {
      a.brett.append(handZeichnen(z, a))
      if (I.ew(z)) a.brett.append(zuenfteZeichnen(z, a))
    }
    seiteZeichnen(z, a, modus)
  }

  window.Gruppenspiel({
    regeln: I,
    flaeche: document.getElementById('flaeche'),
    seite: document.getElementById('seite'),
    zeichne,
    kiPause: 600,
  })
})()
