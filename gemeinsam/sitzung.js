/* Lehrraum – gemeinsame Anmeldung der Lehrkraft (Supabase-Sitzung), gleiche Adresse wie Quizzo, Klassenfunk und Tafel.
   Die Sitzung liegt im localStorage unter dem Schlüssel von supabase-js. Ihr Zugriffstoken gilt nur etwa eine Stunde;
   Quizzo, Klassenfunk und die Tafel erneuern ihn selbst, solange sie geöffnet sind. Wer morgens direkt die Startseite oder ein
   Lernangebot öffnet, fände sonst eine abgelaufene Sitzung vor und würde als Gast behandelt (Audit 21.11.2026).
   Dieses Modul erneuert die Sitzung mit dem Erneuerungstoken (refresh_token) und schreibt sie im selben Format zurück,
   damit alle Anwendungen sie weiter nutzen.

   LehrraumSitzung.lesen()      gespeicherte Sitzung (egal ob gültig) oder null
   LehrraumSitzung.gueltig(s)   Zugriffstoken noch mindestens 60 s gültig?
   LehrraumSitzung.erneuern()   Promise: gültige Sitzung (ggf. neu geholt und zurückgeschrieben) oder null
   LehrraumSitzung.speichern(s) Sitzung ablegen (nach der Anmeldung)
   LehrraumSitzung.loeschen()   Abmelden

   Nur der öffentliche publishable-Schlüssel steht hier; die Zugriffsregeln prüft die Datenbank. Gesendet wird nur der
   Erneuerungstoken an Supabase (Frankfurt), sonst nichts. Der Server rotiert den Erneuerungstoken bei jeder Erneuerung:
   Das alte Token gilt danach nur noch kurz (Wiederverwendungsfenster). Deshalb erneuert immer nur ein Tab (Web Lock). */
;(function () {
  'use strict'

  const URL_BASIS = 'https://ifdqfndsvgiyvxvxtoga.supabase.co'
  const SCHLUESSEL = 'sb_publishable_IwhtQdYMQTuZCeo5Ul4DAw_lgjqKgLG'
  const GEMEINSAM = 'sb-ifdqfndsvgiyvxvxtoga-auth-token'
  const PUFFER_MS = 60_000

  function lesen() {
    try {
      const s = JSON.parse(localStorage.getItem(GEMEINSAM) || 'null')
      return s && s.access_token ? s : null
    } catch {
      return null
    }
  }
  const gueltig = (s) => !!(s && s.access_token && (s.expires_at || 0) * 1000 > Date.now() + PUFFER_MS)

  function speichern(s) {
    try {
      localStorage.setItem(GEMEINSAM, JSON.stringify(s))
    } catch {
      /* dann gilt sie nur hier */
    }
  }
  function loeschen() {
    try {
      localStorage.removeItem(GEMEINSAM)
    } catch {
      /* egal */
    }
  }

  async function holeNeu(alt) {
    const r = await fetch(URL_BASIS + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: SCHLUESSEL, Authorization: 'Bearer ' + SCHLUESSEL, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: alt.refresh_token }),
    })
    if (!r.ok) return null // Token widerrufen oder abgelaufen: dann hilft nur eine neue Anmeldung
    const neu = await r.json()
    if (!neu || !neu.access_token || !neu.refresh_token) return null
    // supabase-js erwartet expires_at (Sekunden); ältere Antworten haben nur expires_in
    if (!neu.expires_at) neu.expires_at = Math.floor(Date.now() / 1000) + (neu.expires_in || 3600)
    return neu
  }

  let laufend = null
  /** Gültige Sitzung liefern: vorhandene, sonst erneuerte, sonst null. Fehler (kein Netz) ergeben null, nie eine Ausnahme. */
  function erneuern() {
    const jetzt = lesen()
    if (gueltig(jetzt)) return Promise.resolve(jetzt)
    if (!jetzt || !jetzt.refresh_token) return Promise.resolve(null)
    if (laufend) return laufend
    const arbeit = async () => {
      // Hat ein anderer Tab inzwischen erneuert? Dann dessen Ergebnis nehmen (Erneuerungstoken sind nur einmal gültig).
      const frisch = lesen()
      if (gueltig(frisch)) return frisch
      if (!frisch || !frisch.refresh_token) return null
      const neu = await holeNeu(frisch)
      if (!neu) return null
      speichern(neu)
      return neu
    }
    laufend = (async () => {
      try {
        if (navigator.locks && navigator.locks.request) return await navigator.locks.request('lehrraum-sitzung', arbeit)
        return await arbeit()
      } catch {
        return null
      } finally {
        laufend = null
      }
    })()
    return laufend
  }

  window.LehrraumSitzung = { lesen, gueltig, erneuern, speichern, loeschen, GEMEINSAM }
})()
