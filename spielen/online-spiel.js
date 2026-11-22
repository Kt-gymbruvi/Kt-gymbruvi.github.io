/*
 * Online-Anbindung für die Spielseiten. Die Lobby öffnet eine Spielseite mit
 *   ?raum=CODE&partie=ID&seite=1|2&gegner=Name&gid=KENNUNG
 * Ohne diese Angaben liefert OnlineSpiel.start() null (dann läuft das Spiel zu zweit am Gerät oder gegen den Rechner).
 *
 *   const online = OnlineSpiel.start({ beiZug(zug), beiAufgabe(), beiGegner(da) })
 *   online.seite         1 oder 2 (Spieler 1 beginnt)
 *   online.gegner        Name des Gegners
 *   online.sendeZug(z)   eigenen Zug senden (nach dem lokalen Ausführen)
 *   online.gibAuf()      aufgeben
 *   online.fertig()      Partie vorbei: Anzeige „spielt“ in der Lobby beenden
 *   online.lobby         Adresse der Lobby
 */
;(function () {
  'use strict'

  function start(o) {
    const p = new URLSearchParams(location.search)
    const code = (p.get('raum') || '').toUpperCase()
    const partie = p.get('partie') || ''
    const seite = Number(p.get('seite'))
    const gegner = window.Spielraum ? window.Spielraum.bereinige(p.get('gegner')) || 'Gegner' : 'Gegner'
    const gid = p.get('gid') || ''
    if (!window.Spielraum || !window.Spielraum.istCode(code) || !/^[A-Z0-9]{4,16}$/i.test(partie) || (seite !== 1 && seite !== 2)) return null

    const raum = window.Spielraum.betreten(code, { name: window.Spielraum.meinName() })
    const sp = window.Spielraum.partie(raum, {
      partie,
      spiel: location.pathname.replace(/\/$/, '').split('/').pop(),
      gegner,
      beiZug: o.beiZug,
      beiAufgabe: o.beiAufgabe,
    })

    // Ist der Gegner noch im Raum? (kurze Aussetzer nach dem Seitenwechsel nicht gleich melden)
    let weg = 0
    raum.auf('anwesenheit', (liste) => {
      if (!gid || !o.beiGegner) return
      const da = liste.some((x) => x.id === gid)
      clearTimeout(weg)
      if (da) o.beiGegner(true)
      else weg = setTimeout(() => o.beiGegner(false), 6000)
    })

    // Jede Nachricht des Gegners zeigt: Er ist da – auch wenn die Anwesenheitsliste kurz etwas anderes meldet
    ;['zug', 'sync'].forEach((e) =>
      raum.auf(e, (d) => {
        if (gid && d.von === gid && o.beiGegner) {
          clearTimeout(weg)
          o.beiGegner(true)
        }
      }),
    )

    window.addEventListener('pagehide', () => raum.verlassen())
    return {
      seite,
      gegner,
      code,
      lobby: '../lobby/?raum=' + code,
      sendeZug: sp.sendeZug,
      gibAuf: sp.gibAuf,
      fertig: () => raum.setze({ spielt: null }),
    }
  }

  window.OnlineSpiel = { start }
})()
