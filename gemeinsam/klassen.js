/* Lehrraum – liest die Klassen der Lehrkraft aus dem Speicher dieses Geräts (IndexedDB „lehrraum“, Lager „klassen“).
   Angelegt und geändert werden sie in der Lehrraum-App (/Lehrraum/#/klassen); hier wird nur gelesen.
   Die Klassen liegen nur auf dem Gerät – es wird nichts gesendet. Auf einem Gerät ohne Klassen ist die Liste leer. */
;(function () {
  'use strict'

  const istKennung = (x) => typeof x === 'string' && /^[0-9a-f]{8,64}$/.test(x)
  const text = (x, max) => (typeof x === 'string' ? x.trim().slice(0, max) : '')
  const reihenfolge = new Intl.Collator('de', { numeric: true, sensitivity: 'base' })

  /** Liefert die aktiven (nicht archivierten) Klassen, sortiert nach Bezeichnung und Fach. Nie ein Fehler – notfalls leer. */
  function ladeKlassen() {
    return new Promise((fertig) => {
      let anfrage
      try {
        anfrage = indexedDB.open('lehrraum') // ohne Versionsnummer: die Datenbank bleibt, wie die App sie angelegt hat
      } catch {
        return fertig([])
      }
      anfrage.onerror = () => fertig([])
      anfrage.onblocked = () => fertig([])
      anfrage.onsuccess = () => {
        const db = anfrage.result
        if (!db.objectStoreNames.contains('klassen')) {
          db.close() // die App hat hier noch keine Klassen gespeichert
          return fertig([])
        }
        try {
          const alle = db.transaction('klassen', 'readonly').objectStore('klassen').getAll()
          alle.onerror = () => {
            db.close()
            fertig([])
          }
          alle.onsuccess = () => {
            db.close() // gleich wieder freigeben, damit die App die Datenbank umbauen kann
            const klassen = (alle.result || [])
              .filter((k) => k && k.schema === 'lehrraum/klasse' && istKennung(k.id) && text(k.bezeichnung, 30) && k.archiviert !== true)
              .map((k) => ({ id: k.id, bezeichnung: text(k.bezeichnung, 30), fach: text(k.fach, 40), jahrgang: text(k.jahrgang, 10) }))
              .sort((a, b) => reihenfolge.compare(a.bezeichnung, b.bezeichnung) || reihenfolge.compare(a.fach, b.fach))
            fertig(klassen)
          }
        } catch {
          db.close()
          fertig([])
        }
      }
    })
  }

  window.LehrraumKlassen = { laden: ladeKlassen }
})()
