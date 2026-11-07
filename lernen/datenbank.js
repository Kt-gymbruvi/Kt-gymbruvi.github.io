/* Verbindung zur Quizzo-Datenbank (Supabase, Frankfurt) – nur für die Ordnung der Lernangebote.
   Besucher lesen ohne Konto die sichtbaren Einträge. Ändern kann nur die angemeldete Lehrkraft.
   Im Code steht nur der öffentliche Schlüssel (publishable); die Zugriffsregeln prüft die Datenbank. */
;(function () {
  'use strict'

  const URL_BASIS = 'https://ifdqfndsvgiyvxvxtoga.supabase.co'
  const SCHLUESSEL = 'sb_publishable_IwhtQdYMQTuZCeo5Ul4DAw_lgjqKgLG'
  const EIGENE_SITZUNG = 'lernen-sitzung' // sessionStorage: nur bis der Browser-Tab geschlossen wird
  const QUIZZO_SITZUNG = 'sb-ifdqfndsvgiyvxvxtoga-auth-token' // Anmeldung aus Quizzo (gleiche Adresse)
  const SPALTEN = 'ordner,titel,text,fach,stufen,thema,position,sichtbar,datum'

  const kopf = (token) => ({ apikey: SCHLUESSEL, Authorization: 'Bearer ' + (token || SCHLUESSEL) })

  async function antwort(r) {
    if (r.ok) return r.status === 204 ? null : r.json()
    let meldung = ''
    try {
      const j = await r.json()
      meldung = j.msg || j.message || j.error_description || j.error || ''
    } catch {
      /* egal */
    }
    const e = new Error(meldung || 'Fehler ' + r.status)
    e.status = r.status
    e.code = (meldung.match(/^\w+/) || [])[0]
    throw e
  }

  function lies(speicher, schluessel) {
    try {
      return JSON.parse(speicher.getItem(schluessel) || 'null')
    } catch {
      return null
    }
  }
  const gueltig = (s) => s && s.access_token && (s.expires_at || 0) * 1000 > Date.now() + 60_000

  /** Aktuelle Anmeldung (eigene oder aus Quizzo) oder null */
  async function sitzung() {
    const eigene = lies(sessionStorage, EIGENE_SITZUNG)
    if (gueltig(eigene)) return eigene
    if (eigene && eigene.refresh_token) {
      try {
        const neu = await antwort(
          await fetch(URL_BASIS + '/auth/v1/token?grant_type=refresh_token', {
            method: 'POST',
            headers: { ...kopf(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: eigene.refresh_token }),
          }),
        )
        sessionStorage.setItem(EIGENE_SITZUNG, JSON.stringify(neu))
        return neu
      } catch {
        sessionStorage.removeItem(EIGENE_SITZUNG)
      }
    }
    // Quizzo-Anmeldung nur lesen (nicht erneuern – das macht Quizzo selbst)
    const q = lies(localStorage, QUIZZO_SITZUNG)
    return gueltig(q) ? q : null
  }

  async function anmelden(email, passwort) {
    const s = await antwort(
      await fetch(URL_BASIS + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { ...kopf(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwort }),
      }),
    )
    sessionStorage.setItem(EIGENE_SITZUNG, JSON.stringify(s))
    return s
  }

  function abmelden() {
    sessionStorage.removeItem(EIGENE_SITZUNG)
  }

  /** Einträge lesen (Besucher: nur sichtbare; Lehrkraft: auch eigene versteckte) */
  async function laden(token) {
    return antwort(await fetch(URL_BASIS + '/rest/v1/lernangebote?select=' + SPALTEN, { headers: kopf(token) }))
  }

  /** Einträge anlegen oder ändern (nach Ordner) */
  async function speichern(zeilen, token) {
    const jetzt = new Date().toISOString()
    return antwort(
      await fetch(URL_BASIS + '/rest/v1/lernangebote?on_conflict=ordner', {
        method: 'POST',
        headers: { ...kopf(token), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(zeilen.map((z) => ({ ...z, geaendert_am: jetzt }))),
      }),
    )
  }

  window.LernDB = { sitzung, anmelden, abmelden, laden, speichern }
})()
