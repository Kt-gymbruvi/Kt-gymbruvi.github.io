/*
 * Themen und Formulierungen für das Einstein-Rätsel.
 * Jedes Thema hat Kategorien mit mindestens sechs Werten; je Rätsel werden zufällig so viele gezogen, wie es Häuser gibt.
 *
 * Wert:  { anzeige, rel, praed }
 *   anzeige  kurzer Text im Feld, z. B. „Hund“
 *   rel      Relativsatz („die einen Hund hat“) – für „Die Person, die einen Hund hat, …“
 *   praed    Aussage („hat einen Hund“) – für „Anna hat einen Hund.“
 *   name     true: der Wert ist ein Name und wird wie ein Eigenname gesprochen („Anna wohnt …“)
 */
;(function () {
  'use strict'

  const ORD = ['ersten', 'zweiten', 'dritten', 'vierten', 'fünften', 'sechsten']

  /** Wert aus Vorlagen: {s} wird ersetzt. */
  function vorlage(rel, praed, liste) {
    return liste.map((x) => {
      const [anzeige, s] = Array.isArray(x) ? x : [x, x]
      return { anzeige, rel: rel.replace('{s}', s), praed: praed.replace('{s}', s) }
    })
  }
  function namen(liste) {
    return liste.map((n) => ({ anzeige: n, name: true, rel: 'die ' + n + ' heißt', praed: 'heißt ' + n }))
  }
  function eigene(liste) {
    return liste.map(([anzeige, praed, rel]) => ({ anzeige, praed, rel }))
  }

  const THEMEN = [
    {
      id: 'strasse',
      titel: 'Die Straße',
      einleitung: (n) => `In einer Straße stehen ${n} Häuser nebeneinander. Sie sind von links nach rechts nummeriert. Wer wohnt wo?`,
      ort: 'Haus',
      pos: {
        fest: (p, n) => 'wohnt im ' + (p === n - 1 ? 'letzten' : ORD[p]) + ' Haus',
        neben: 'wohnt direkt neben',
        links: 'wohnt direkt links von',
        weiter: 'wohnt weiter links als',
      },
      kategorien: [
        { name: 'Name', werte: namen(['Anna', 'Ben', 'Clara', 'David', 'Emma', 'Felix']) },
        { name: 'Haustier', werte: vorlage('die {s} hat', 'hat {s}', [['Hund', 'einen Hund'], ['Katze', 'eine Katze'], ['Hamster', 'einen Hamster'], ['Wellensittich', 'einen Wellensittich'], ['Kaninchen', 'ein Kaninchen'], ['Schildkröte', 'eine Schildkröte']]) },
        { name: 'Getränk', werte: vorlage('die am liebsten {s} trinkt', 'trinkt am liebsten {s}', ['Tee', 'Kakao', 'Apfelsaft', 'Milch', 'Wasser', 'Limonade']) },
        {
          name: 'Hobby',
          werte: eigene([
            ['Schwimmen', 'schwimmt gern', 'die gern schwimmt'],
            ['Lesen', 'liest gern', 'die gern liest'],
            ['Zeichnen', 'zeichnet gern', 'die gern zeichnet'],
            ['Tanzen', 'tanzt gern', 'die gern tanzt'],
            ['Radfahren', 'fährt gern Rad', 'die gern Rad fährt'],
            ['Fußball', 'spielt gern Fußball', 'die gern Fußball spielt'],
          ]),
        },
        { name: 'Hausfarbe', werte: vorlage('die im {s} Haus wohnt', 'wohnt im {s} Haus', [['Rot', 'roten'], ['Blau', 'blauen'], ['Gelb', 'gelben'], ['Grün', 'grünen'], ['Weiß', 'weißen'], ['Grau', 'grauen']]) },
      ],
    },
    {
      id: 'sportfest',
      titel: 'Das Sportfest',
      einleitung: (n) => `Beim Sportfest stehen ${n} Kinder nebeneinander in einer Reihe. Wer steht wo? Links und rechts ist aus Sicht der Kinder.`,
      ort: 'Platz',
      pos: {
        fest: (p, n) => (p === 0 ? 'steht ganz links' : p === n - 1 ? 'steht ganz rechts' : 'steht an ' + ORD[p].replace(/n$/, '') + 'r Stelle'),
        neben: 'steht direkt neben',
        links: 'steht direkt links von',
        weiter: 'steht weiter links als',
      },
      kategorien: [
        { name: 'Name', werte: namen(['Lena', 'Max', 'Sophie', 'Tim', 'Mia', 'Jonas']) },
        { name: 'Disziplin', werte: vorlage('die im {s} startet', 'startet im {s}', ['Sprint', 'Weitsprung', 'Hochsprung', 'Kugelstoßen', 'Ballwurf', 'Staffellauf']) },
        { name: 'Trikot', werte: vorlage('die ein {s} Trikot trägt', 'trägt ein {s} Trikot', [['Rot', 'rotes'], ['Blau', 'blaues'], ['Gelb', 'gelbes'], ['Grün', 'grünes'], ['Orange', 'oranges'], ['Weiß', 'weißes']]) },
        { name: 'Snack', werte: vorlage('die vor dem Start {s} isst', 'isst vor dem Start {s}', [['Banane', 'eine Banane'], ['Müsliriegel', 'einen Müsliriegel'], ['Apfel', 'einen Apfel'], ['Nudeln', 'Nudeln'], ['Traubenzucker', 'Traubenzucker'], ['Brot', 'ein Brot']]) },
        { name: 'Alter', werte: vorlage('die {s} Jahre alt ist', 'ist {s} Jahre alt', [['11 Jahre', '11'], ['12 Jahre', '12'], ['13 Jahre', '13'], ['14 Jahre', '14'], ['15 Jahre', '15'], ['16 Jahre', '16']]) },
      ],
    },
    {
      id: 'klassenfahrt',
      titel: 'Die Klassenfahrt',
      einleitung: (n) => `Auf der Klassenfahrt liegen ${n} Zimmer nebeneinander am Flur. Sie sind von links nach rechts nummeriert. Wer schläft wo?`,
      ort: 'Zimmer',
      pos: {
        fest: (p, n) => 'schläft im ' + (p === n - 1 ? 'letzten' : ORD[p]) + ' Zimmer',
        neben: 'schläft direkt neben',
        links: 'schläft direkt links von',
        weiter: 'schläft weiter links als',
      },
      kategorien: [
        { name: 'Name', werte: namen(['Nele', 'Paul', 'Yara', 'Leon', 'Hannah', 'Emil']) },
        { name: 'Lieblingsfach', werte: vorlage('die am liebsten {s} mag', 'mag am liebsten {s}', ['Biologie', 'Sport', 'Kunst', 'Musik', 'Mathe', 'Englisch']) },
        { name: 'Snack', werte: vorlage('die {s} dabei hat', 'hat {s} dabei', ['Kekse', 'Gummibärchen', 'Äpfel', 'Nüsse', 'Chips', 'Bananen']) },
        { name: 'Instrument', werte: vorlage('die {s} spielt', 'spielt {s}', ['Gitarre', 'Klavier', 'Flöte', 'Schlagzeug', 'Geige', 'Trompete']) },
        { name: 'Schlafsack', werte: vorlage('die einen {s} Schlafsack hat', 'hat einen {s} Schlafsack', [['Blau', 'blauen'], ['Grün', 'grünen'], ['Rot', 'roten'], ['Schwarz', 'schwarzen'], ['Lila', 'lila'], ['Gelb', 'gelben']]) },
      ],
    },
  ]

  const gross = (t) => t.charAt(0).toUpperCase() + t.slice(1)

  /**
   * Satz zu einem Hinweis.
   *   w(c, i): Wert i der Kategorie c (Objekt aus den Themen)
   */
  function satz(h, w, thema, n) {
    const A = w(h.a[0], h.a[1])
    const B = h.b ? w(h.b[0], h.b[1]) : null
    const subj = (x) => (x.name ? x.anzeige : 'die Person, ' + x.rel + ',')
    const dativ = (x) => (x.name ? x.anzeige : 'der Person, ' + x.rel)
    const nominativ = (x) => (x.name ? x.anzeige : 'die Person, ' + x.rel)
    switch (h.art) {
      case 'gleich':
        return gross(subj(A) + ' ' + B.praed + '.')
      case 'nicht':
        return gross(subj(A) + ' ist nicht ' + nominativ(B) + '.')
      case 'neben':
        return gross(subj(A) + ' ' + thema.pos.neben + ' ' + dativ(B) + '.')
      case 'links':
        return gross(subj(A) + ' ' + thema.pos.links + ' ' + dativ(B) + '.')
      case 'weiterLinks':
        return gross(subj(A) + ' ' + thema.pos.weiter + ' ' + dativ(B) + '.')
      case 'an':
        return gross(subj(A) + ' ' + thema.pos.fest(h.p, n) + '.')
    }
    return ''
  }

  window.EinsteinThemen = { THEMEN, satz }
})()
