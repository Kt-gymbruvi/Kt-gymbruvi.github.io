/* Lehrraum – heller und dunkler Modus. Ohne Auswahl gilt die Einstellung des Geräts.
   Die Auswahl wird nur auf diesem Gerät gemerkt (localStorage „lehrraum-design“), nichts wird gesendet.
   Diese Datei im <head> laden, damit die Seite nicht erst hell und dann dunkel erscheint. */
;(function () {
  'use strict'

  const SPEICHER = 'lehrraum-design'
  const wurzel = document.documentElement

  function gemerkt() {
    try {
      const w = localStorage.getItem(SPEICHER)
      return w === 'hell' || w === 'dunkel' ? w : null
    } catch {
      return null
    }
  }

  const geraetDunkel = () => !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)

  /** Was gerade gilt: 'hell' oder 'dunkel' */
  function aktuell() {
    return wurzel.dataset.design || (geraetDunkel() ? 'dunkel' : 'hell')
  }

  function setze(wert) {
    wurzel.dataset.design = wert
    try {
      localStorage.setItem(SPEICHER, wert)
    } catch {
      /* ohne Speicher gilt die Auswahl nur bis zum Neuladen */
    }
    document.dispatchEvent(new CustomEvent('lehrraum-design', { detail: wert }))
  }

  const wahl = gemerkt()
  if (wahl) wurzel.dataset.design = wahl

  window.LehrraumDesign = {
    aktuell,
    umschalten: () => setze(aktuell() === 'dunkel' ? 'hell' : 'dunkel'),
  }
})()
