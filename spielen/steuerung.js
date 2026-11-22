/*
 * Steuerung der Brettspiele: Spielart (zwei an einem Gerät / gegen den Rechner), Stufe, Seite, „Neues Spiel“, „Zurück“.
 * Browser: window.Spielsteuerung(ziel, optionen) → { modus, stufe, ich, status(text, art), neuBeschriften }
 *
 *   optionen.farben    ['Rot', 'Gelb']  Namen von Spieler 1 (beginnt) und Spieler 2
 *   optionen.spiel     Ordner des Spiels (z. B. 'schach'): „Online“ öffnet die Lobby mit diesem Spiel
 *   optionen.neu()     Neues Spiel (liest modus/stufe/ich aus dem Rückgabewert)
 *   optionen.zurueck() Letzten Zug zurücknehmen (im Rechnermodus: die letzten beiden)
 *   optionen.online    { gegner, seite, lobby, aufgeben() } – Online-Partie: keine Auswahl, dafür „Aufgeben“ und „Zur Lobby“
 *                      (modus ist dann 'online', ich = seite)
 */
;(function () {
  'use strict'
  const el = (name, klasse, text) => {
    const e = document.createElement(name)
    if (klasse) e.className = klasse
    if (text != null) e.textContent = text
    return e
  }

  function segmente(titel, werte, start, bei) {
    const gruppe = el('div', 'gruppe')
    gruppe.append(el('h2', null, titel))
    const reihe = el('div', 'segmente voll')
    reihe.setAttribute('role', 'group')
    reihe.setAttribute('aria-label', titel)
    const knoepfe = werte.map(([wert, text]) => {
      const b = el('button', null, text)
      b.type = 'button'
      b.setAttribute('aria-pressed', String(wert === start))
      b.addEventListener('click', () => {
        knoepfe.forEach((k) => k.setAttribute('aria-pressed', String(k === b)))
        bei(wert)
      })
      return b
    })
    reihe.append(...knoepfe)
    gruppe.append(reihe)
    return { gruppe, setze: (wert) => knoepfe.forEach((k, i) => k.setAttribute('aria-pressed', String(werte[i][0] === wert))) }
  }

  function Spielsteuerung(ziel, o) {
    const farben = o.farben || ['Spieler 1', 'Spieler 2']
    const z = { modus: 'lokal', stufe: 2, ich: 1 }
    ziel.textContent = ''
    const karte = el('section', 'werkzeug-karte')
    const status = el('p', 'status')
    status.setAttribute('role', 'status')
    status.setAttribute('aria-live', 'polite')
    karte.append(status)
    const api = (extra) =>
      Object.defineProperties(Object.assign(z, extra || {}), {
        status: {
          value: (text, artKlasse) => {
            status.textContent = text || ''
            status.className = 'status' + (artKlasse ? ' ' + artKlasse : '')
          },
        },
      })

    if (o.online) {
      z.modus = 'online'
      z.ich = o.online.seite
      const gruppe = el('div', 'gruppe')
      gruppe.append(el('h2', null, 'Online gegen ' + o.online.gegner))
      gruppe.append(el('p', 'hinweis', 'Du spielst ' + farben[o.online.seite - 1] + (o.online.seite === 1 ? ' und beginnst.' : '.')))
      const hinweis = el('p', 'hinweis')
      hinweis.style.color = 'var(--fehler)'
      gruppe.append(hinweis)
      karte.append(gruppe)
      const reihe = el('div', 'knopf-reihe')
      reihe.style.marginTop = '1rem'
      const auf = el('button', 'knopf zweit', 'Aufgeben')
      auf.type = 'button'
      auf.addEventListener('click', () => {
        if (confirm('Wirklich aufgeben?')) o.online.aufgeben()
      })
      const lobby = el('a', 'knopf', 'Zur Lobby')
      lobby.href = o.online.lobby
      reihe.append(lobby, auf)
      karte.append(reihe)
      ziel.append(karte)
      return api({
        hinweis: (text) => (hinweis.textContent = text || ''),
        aufgabeAus: () => (auf.hidden = true),
      })
    }

    const art = segmente('Spielart', [['lokal', 'Zu zweit'], ['rechner', 'Gegen Rechner'], ['online', 'Online']], z.modus, (w) => {
      if (w === 'online') {
        // Online spielt man in der Lobby der Klasse; das gewählte Spiel ist dort schon vorgewählt
        location.href = '../lobby/' + (o.spiel ? '?spiel=' + encodeURIComponent(o.spiel) : '')
        return
      }
      z.modus = w
      stufe.gruppe.hidden = seite.gruppe.hidden = w !== 'rechner'
      o.neu()
    })
    const stufe = segmente('Stufe', [[1, 'Leicht'], [2, 'Mittel'], [3, 'Schwer']], z.stufe, (w) => {
      z.stufe = w
      o.neu()
    })
    const seite = segmente('Du spielst', [[1, farben[0] + ' (beginnt)'], [2, farben[1]]], z.ich, (w) => {
      z.ich = w
      o.neu()
    })
    stufe.gruppe.hidden = seite.gruppe.hidden = true
    karte.append(art.gruppe, stufe.gruppe, seite.gruppe)

    const reihe = el('div', 'knopf-reihe')
    reihe.style.marginTop = '1rem'
    const neu = el('button', 'knopf', 'Neues Spiel')
    neu.type = 'button'
    neu.addEventListener('click', () => o.neu())
    const zurueck = el('button', 'knopf zweit', 'Zurück')
    zurueck.type = 'button'
    zurueck.addEventListener('click', () => o.zurueck())
    reihe.append(neu, zurueck)
    karte.append(reihe)
    ziel.append(karte)

    return api()
  }

  window.Spielsteuerung = Spielsteuerung
})()
