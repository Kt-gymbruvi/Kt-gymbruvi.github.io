/* Lernangebote: Lehrkraft-Hinweise (Erwartungshorizonte, Hinweise „Für Lehrkräfte“, Lehrkraft-Ansicht) nur zeigen,
   wenn auf diesem Gerät eine Lehrkraft angemeldet ist – dieselbe Anmeldung wie Startseite, Quizzo, Klassenfunk und Tafel.

   Wird im <head> jedes Angebots geladen (nach ../lernstil.css, eingesetzt von lernen/werkzeug/stil.mjs) und läuft sofort,
   damit nichts kurz aufblitzt. Ergebnis:
     <html class="lehrkraft-an">  und  window.LehrkraftAngemeldet = true | false
   lernstil.css blendet ohne Anmeldung `.teacher` und `[data-lehrkraft]` aus; Angebote mit eigener Lehrkraft-Ansicht
   (z. B. #lehrkraft) fragen window.LehrkraftAngemeldet.

   Wichtig: Das ist ein Sichtschutz, kein Zugriffsschutz. Die Texte stehen weiter im Quelltext der öffentlichen Seite.
   Geprüft wird, ob eine noch gültige Sitzung im Gerät liegt (gleiche Regel wie auf der Startseite); hier wird nichts
   gesendet. Quizzo und Tafel erneuern die Sitzung beim Öffnen. */
;(function () {
  'use strict'
  const GEMEINSAM = 'sb-ifdqfndsvgiyvxvxtoga-auth-token' // Startseite, Quizzo, Klassenfunk, Tafel
  const EIGENE = 'lernen-sitzung' // Anmeldung der Lernübersicht (nur bis der Tab geschlossen wird)

  function hatSitzung(speicher, schluessel) {
    try {
      const s = JSON.parse(speicher.getItem(schluessel) || 'null')
      // wie lernen/datenbank.js (Startseite): nur eine noch gültige Sitzung zählt, sonst zeigte die Startseite
      // „Anmelden“, die Angebote aber die Lehrkraft-Hinweise
      return !!(s && s.access_token && (s.expires_at || 0) * 1000 > Date.now())
    } catch {
      return false
    }
  }

  let an = false
  try {
    an = hatSitzung(localStorage, GEMEINSAM) || hatSitzung(sessionStorage, EIGENE)
  } catch {
    an = false // Speicher gesperrt (z. B. privater Modus): als Gast behandeln
  }
  window.LehrkraftAngemeldet = an
  if (an) {
    document.documentElement.classList.add('lehrkraft-an')
  } else {
    // Die Regel steht auch in lernstil.css; hier noch einmal, damit eine zwischengespeicherte ältere
    // lernstil.css (GitHub Pages: bis zu 10 Minuten) die Hinweise nicht doch zeigt.
    const stil = document.createElement('style')
    stil.textContent = '.teacher,[data-lehrkraft]{display:none!important}'
    document.head.appendChild(stil)
    erneuernUndNeuLaden()
  }

  /* Liegt eine abgelaufene gemeinsame Sitzung mit Erneuerungstoken im Gerät (Lehrkraft, die seit über einer Stunde keine
     App geöffnet hat), wird sie erneuert (gemeinsam/sitzung.js) und die Seite einmal neu geladen – die Angebote prüfen die
     Anmeldung beim Start. Ohne Anmeldung, ohne Netz oder bei widerrufener Sitzung passiert nichts (Gast-Ansicht). */
  function erneuernUndNeuLaden() {
    let s
    try {
      s = JSON.parse(localStorage.getItem(GEMEINSAM) || 'null')
    } catch {
      return
    }
    if (!s || !s.refresh_token) return
    try {
      if (Date.now() - Number(sessionStorage.getItem('lehrkraft-erneuert') || 0) < 60_000) return // keine Schleife
    } catch {
      return
    }
    const quelle = document.currentScript && document.currentScript.src
    if (!quelle) return
    const modul = document.createElement('script')
    modul.src = new URL('../gemeinsam/sitzung.js', quelle).href
    modul.onload = () => {
      window.LehrraumSitzung.erneuern().then((neu) => {
        if (!neu) return
        try {
          sessionStorage.setItem('lehrkraft-erneuert', String(Date.now()))
        } catch {
          return
        }
        location.reload()
      })
    }
    document.head.appendChild(modul)
  }
})()
