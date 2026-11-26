/* Lehrraum – einheitlicher Symbolsatz als eingebettete SVG-Zeichnungen (24 × 24, Linie in der Textfarbe).
   Eigene Zeichnungen, nichts wird von fremden Servern geladen.
   Benutzung:  element.append(LehrraumSymbol('tafel'))   – liefert null, wenn es den Namen nicht gibt. */
;(function () {
  'use strict'

  const SVG = 'http://www.w3.org/2000/svg'

  const SYMBOLE = {
    // Bereiche
    tafel: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20l2-4M16 20l-2-4M7 9h6M7 12h3"/>',
    unterrichten: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4M8 14h3M8 17h6"/>',
    interaktion: '<path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M8 9h8M8 13h5"/>',
    lernen: '<path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2z"/><path d="M12 6v14"/>',
    bibliothek: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    // Anwendungen
    quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8M12 17h.01"/>',
    funk: '<circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2"/>',
    // Werkzeuge
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
    wuerfel: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01"/>',
    ampel: '<rect x="8" y="2" width="8" height="20" rx="4"/><circle cx="12" cy="7" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="17" r="1.5"/>',
    raetsel: '<path d="M10 4a2 2 0 1 1 4 0v1h4v4h-1a2 2 0 1 0 0 4h1v4h-4v-1a2 2 0 1 0-4 0v1H6v-4h1a2 2 0 1 0 0-4H6V5h4z"/>',
    werkzeug: '<path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L3 18l3 3 6.2-6.2a4 4 0 0 0 5.3-5.3l-2.7 2.7-2.5-.5-.5-2.5z"/>',
    // Links ins Netz (Simulationen, Mikroskop, Film, Sport)
    atom: '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
    mikroskop: '<rect x="9" y="2.5" width="4" height="10" rx="1" transform="rotate(20 11 7.5)"/><path d="M6 21h12M12 21a6.5 6.5 0 0 0 4-11.5M7.5 16.5H12"/>',
    zelle: '<circle cx="12" cy="12" r="9"/><circle cx="10.5" cy="11" r="3"/><path d="M16.5 15.5h.01M15.5 7.5h.01M8 17h.01"/>',
    planet: '<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10.5" ry="3.5" transform="rotate(-20 12 12)"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6c3 3.2 3 9.6 0 12.8M18.4 5.6c-3 3.2-3 9.6 0 12.8"/>',
    // Fächer
    blatt: '<path d="M5 19C5 10 11 5 20 4c0 9-5 15-14 15z"/><path d="M5 19l8-8"/>',
    laufen: '<circle cx="15" cy="4" r="2"/><path d="M13.5 7.5 11 13M8 9.5l3-2 4 1 2.5 2.5M11 13l3 3-1 5M11 13l-2.5 3.5H5"/>',
    // Allgemein
    zurueck: '<path d="M15 5l-7 7 7 7"/>',
    weiter: '<path d="M9 5l7 7-7 7"/>',
    qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18v2M18 18h2v2"/>',
    datei: '<path d="M6 3h8l4 4v14H6zM14 3v4h4"/>',
    verweis: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    pfeil: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    sonne: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    mond: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    // Seitengerüst
    haus: '<path d="M4 11l8-7 8 7M6 10v10h12V10M10 20v-6h4v6"/>',
    klassen: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5.2a3 3 0 0 1 0 5.6M17.5 14.3A6 6 0 0 1 21 20"/>',
    pokal: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M10 17h4"/>',
    megafon: '<path d="M4 10v4h3l7 4V6l-7 4zM17 9a4 4 0 0 1 0 6M8 14v4h3v-2.5"/>',
    bildschirm: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/>',
    zahnrad: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    suche: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    menue: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    blitz: '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
    uhr: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    notenbuch: '<path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11M9 8h5M9 11h3"/>',
    schild: '<path d="M12 3l7 3v5.5c0 4.3-3 7.7-7 9.5-4-1.8-7-5.2-7-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
    schluessel: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>',
  }

  // Bereiche, Werkzeuge und Fächer erscheinen im einheitlichen Logo-Stil (flach, Dunkelgrün und Orange);
  // die schlichten Linien-Symbole oben bleiben für Bedienelemente (Suche, Pfeile, Menü …).
  const BASIS = (function () {
    const s = document.currentScript && document.currentScript.src
    return s ? s.replace(/[^/]*$/, '') : ''
  })()
  const LOGOS = {
    tafel: 'tafel', bildschirm: 'tafel', lernen: 'lernen', klassen: 'klassen', haus: 'startseite',
    timer: 'timer', uhr: 'timer', wuerfel: 'gruppen', ampel: 'ampel', werkzeug: 'werkzeuge',
    notenbuch: 'notenbuch', sonne: 'modus-hell', mond: 'modus-dunkel', blatt: 'blatt', laufen: 'laufen',
    vertretung: 'vertretung', sudoku: 'sudoku', slitherlink: 'slitherlink', einstein: 'einstein',
    viergewinnt: 'vier-gewinnt', muehle: 'muehle', schach: 'schach', spielraum: 'spielraum',
    chaosflitzer: 'chaos-flitzer', murdoku: 'murdoku', flip7: 'flip-7', schiffe: 'schiffe-versenken',
    wuerfelglueck: 'wuerfelglueck', farbenjagd: 'farbenjagd', eckeanecke: 'ecke-an-ecke', grenzland: 'grenzland',
    inselhandel: 'inselhandel', schienennetz: 'schienennetz', kachelland: 'kachelland',
  }

  /** Erzeugt ein dekoratives Symbol. Die Größe kommt aus dem CSS (.symbol), die Farbe aus der Textfarbe. */
  function symbol(name) {
    if (LOGOS[name] && BASIS) {
      const bild = document.createElement('img')
      bild.src = BASIS + LOGOS[name] + '-logo.svg'
      bild.alt = ''
      bild.className = 'symbol symbol-logo'
      bild.setAttribute('aria-hidden', 'true')
      return bild
    }
    const zeichnung = SYMBOLE[name]
    if (!zeichnung) return null
    const svg = document.createElementNS(SVG, 'svg')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('class', 'symbol')
    svg.setAttribute('fill', 'none')
    svg.setAttribute('stroke', 'currentColor')
    svg.setAttribute('stroke-width', '2')
    svg.setAttribute('stroke-linecap', 'round')
    svg.setAttribute('stroke-linejoin', 'round')
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('focusable', 'false')
    svg.innerHTML = zeichnung // feste Zeichnungen aus dieser Datei, keine Eingaben
    return svg
  }

  window.LehrraumSymbol = symbol
  window.LehrraumSymbol.namen = Object.keys(SYMBOLE)
})()
