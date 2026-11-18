/* Gemeinsame Kopfleiste der Werkzeuge: Pfeil „‹“ vor dem Rückweg und Umschalter hell/dunkel rechts.
   Braucht gemeinsam/symbole.js und gemeinsam/design.js (im <head>). Am Ende von <body> laden. */
;(function () {
  'use strict'
  const kopf = document.querySelector('.werkzeug-kopf')
  if (!kopf) return
  const sym = (n) => (window.LehrraumSymbol ? window.LehrraumSymbol(n) : null)

  const zurueck = kopf.querySelector('a')
  if (zurueck) {
    zurueck.classList.add('zurueck')
    const text = document.createElement('span')
    text.className = 'text'
    text.textContent = zurueck.textContent.replace(/^[←‹]\s*/, '')
    zurueck.replaceChildren(sym('zurueck') || document.createTextNode('‹ '), text)
    zurueck.setAttribute('aria-label', 'Zurück: ' + text.textContent)
  }

  if (!window.LehrraumDesign) return
  const knopf = document.createElement('button')
  knopf.type = 'button'
  knopf.className = 'design-knopf'
  function zeichnen() {
    const dunkel = window.LehrraumDesign.aktuell() === 'dunkel'
    knopf.replaceChildren(sym(dunkel ? 'sonne' : 'mond') || document.createTextNode(dunkel ? '☀' : '☾'))
    knopf.setAttribute('aria-label', dunkel ? 'Heller Modus' : 'Dunkler Modus')
    knopf.title = dunkel ? 'Heller Modus' : 'Dunkler Modus'
  }
  knopf.addEventListener('click', () => window.LehrraumDesign.umschalten())
  document.addEventListener('lehrraum-design', zeichnen)
  zeichnen()
  kopf.append(knopf)
})()
