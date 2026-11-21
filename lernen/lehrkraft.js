/* Lernangebote: Lehrkraft-Hinweise (Erwartungshorizonte, Hinweise „Für Lehrkräfte“, Lehrkraft-Ansicht) nur zeigen,
   wenn auf diesem Gerät eine Lehrkraft angemeldet ist – dieselbe Anmeldung wie Startseite, Quizzo, Klassenfunk und Tafel.

   Wird im <head> jedes Angebots geladen (nach ../lernstil.css, eingesetzt von lernen/werkzeug/stil.mjs) und läuft sofort,
   damit nichts kurz aufblitzt. Ergebnis:
     <html class="lehrkraft-an">  und  window.LehrkraftAngemeldet = true | false
   lernstil.css blendet ohne Anmeldung `.teacher` und `[data-lehrkraft]` aus; Angebote mit eigener Lehrkraft-Ansicht
   (z. B. #lehrkraft) fragen window.LehrkraftAngemeldet.

   Wichtig: Das ist ein Sichtschutz, kein Zugriffsschutz. Die Texte stehen weiter im Quelltext der öffentlichen Seite.
   Geprüft wird nur, ob eine Sitzung im Gerät liegt (Ablaufzeit egal, Quizzo und Tafel erneuern sie selbst);
   hier wird nichts gesendet. */
;(function () {
  'use strict'
  const GEMEINSAM = 'sb-ifdqfndsvgiyvxvxtoga-auth-token' // Startseite, Quizzo, Klassenfunk, Tafel
  const EIGENE = 'lernen-sitzung' // Anmeldung der Lernübersicht (nur bis der Tab geschlossen wird)

  function hatSitzung(speicher, schluessel) {
    try {
      const s = JSON.parse(speicher.getItem(schluessel) || 'null')
      return !!(s && s.access_token && s.refresh_token)
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
  }
})()
