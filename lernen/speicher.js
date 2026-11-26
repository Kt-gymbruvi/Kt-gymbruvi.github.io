/* Lernangebote: persönliche Daten (Turniere, Spielzüge) im Konto der angemeldeten Lehrkraft speichern.
   Tabelle `lernen_daten` (docs/sql/lernen_daten.sql, Zugriff nur auf eigene Zeilen).
   Ohne Anmeldung oder solange die Tabelle fehlt: bereit() liefert false und das Angebot speichert nur lokal.
   Braucht gemeinsam/sitzung.js und lernen/datenbank.js (LernDB.sitzung). Keine Schülerdaten ablegen. */
;(function () {
  'use strict'
  const BASIS = 'https://ifdqfndsvgiyvxvxtoga.supabase.co/rest/v1/lernen_daten'
  const SCHLUESSEL = 'sb_publishable_IwhtQdYMQTuZCeo5Ul4DAw_lgjqKgLG'
  let token = null

  const kopf = () => ({ apikey: SCHLUESSEL, Authorization: 'Bearer ' + token })

  /** true, wenn eine Lehrkraft angemeldet ist und die Tabelle erreichbar ist */
  async function bereit() {
    try {
      const s = window.LernDB && (await window.LernDB.sitzung())
      if (!s || !s.access_token) return false
      token = s.access_token
      const r = await fetch(BASIS + '?select=schluessel&limit=1', { headers: kopf() })
      return r.ok
    } catch {
      return false
    }
  }

  /** Alle Einträge eines Angebots: [{schluessel, inhalt}] */
  async function laden(angebot) {
    const r = await fetch(BASIS + '?select=schluessel,inhalt&angebot=eq.' + encodeURIComponent(angebot), { headers: kopf() })
    if (!r.ok) throw new Error('Laden fehlgeschlagen (' + r.status + ')')
    return r.json()
  }

  async function speichern(angebot, schluessel, inhalt) {
    const r = await fetch(BASIS + '?on_conflict=besitzer_id,angebot,schluessel', {
      method: 'POST',
      headers: { ...kopf(), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ angebot, schluessel, inhalt, geaendert_am: new Date().toISOString() }),
    })
    if (!r.ok) {
      const e = new Error('Speichern fehlgeschlagen (' + r.status + ')')
      e.code = r.status === 413 ? 'quota_exceeded' : String(r.status)
      throw e
    }
  }

  async function loeschen(angebot, schluessel) {
    const r = await fetch(BASIS + '?angebot=eq.' + encodeURIComponent(angebot) + '&schluessel=eq.' + encodeURIComponent(schluessel), {
      method: 'DELETE',
      headers: kopf(),
    })
    if (!r.ok) throw new Error('Löschen fehlgeschlagen (' + r.status + ')')
  }

  window.LernSpeicher = { bereit, laden, speichern, loeschen }
})()
