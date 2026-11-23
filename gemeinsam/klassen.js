/* Lehrraum – liest die Klassen der Lehrkraft aus dem Speicher dieses Geräts (IndexedDB „lehrraum“, Lager „klassen“).
   Angelegt und geändert werden sie in der Lehrraum-App (/Lehrraum/#/klassen); hier wird nur gelesen.
   Hier wird nichts gesendet (den verschlüsselten Abgleich zwischen Geräten macht die Lehrraum-App). Standardmäßig werden
   nur Kennung, Bezeichnung, Fach und Jahrgang gelesen. Nur mit `laden({ mitNamen: true })` kommen auch die Namen der
   Klasse (`schueler`) mit – das nutzt allein „Gruppen & Zufall“ für angemeldete Lehrkräfte; die Namen bleiben im
   Speicher der Seite, werden nie gesendet und nie in localStorage abgelegt. Auf einem Gerät ohne Klassen ist die Liste leer. */
;(function () {
  'use strict'

  const istKennung = (x) => typeof x === 'string' && /^[0-9a-f]{8,64}$/.test(x)
  const text = (x, max) => (typeof x === 'string' ? x.trim().slice(0, max) : '')
  const reihenfolge = new Intl.Collator('de', { numeric: true, sensitivity: 'base' })

  /** Namen einer Klasse: nur Kennung, Vor- und Nachname, gültige Einträge */
  function lesbareNamen(roh) {
    if (!Array.isArray(roh)) return []
    return roh
      .filter((s) => s && typeof s.id === 'string' && (text(s.vorname, 40) || text(s.nachname, 40)))
      .map((s) => ({ id: s.id.slice(0, 64), vorname: text(s.vorname, 40), nachname: text(s.nachname, 40) }))
      .slice(0, 60)
  }

  /** Liefert die aktiven (nicht archivierten) Klassen, sortiert nach Bezeichnung und Fach. Nie ein Fehler – notfalls leer. */
  function ladeKlassen(optionen) {
    const mitNamen = !!(optionen && optionen.mitNamen)
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
              .map((k) => {
                const eintrag = { id: k.id, bezeichnung: text(k.bezeichnung, 30), fach: text(k.fach, 40), jahrgang: text(k.jahrgang, 10) }
                if (mitNamen) eintrag.schueler = lesbareNamen(k.schueler)
                return eintrag
              })
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
