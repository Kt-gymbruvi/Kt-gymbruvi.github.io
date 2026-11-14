/* Lehrraum – Schlüsselbund dieses Geräts, gemeinsam mit Notenbuch und Tafel (gleiche Adresse, gleicher Speicher).
   IndexedDB „lehrraum-schluessel“, Lager „bund“, Eintrag „bund“: { version: 1, basis: CryptoKey, am: ISO-Zeit }.
   `basis` ist das Notenbuch-Passwort als nicht exportierbarer PBKDF2-Schlüssel; das Passwort selbst wird nie gespeichert.
   Daraus leiten Notenbuch und Tafel ihre Schlüssel ab – einmal je Gerät eingegeben, öffnen sie ohne Rückfrage.
   Hier wird das Passwort nur geprüft (an den verschlüsselten Tresoren, die Startseite liest nichts davon im Klartext
   weiter) und der Bund angelegt bzw. beim Abmelden gelöscht. Gleiches Format in ../Lehrraum (schluesselbund.ts) und
   ../Notenbuch (index.html). */
;(function () {
  'use strict'

  const NAME = 'lehrraum-schluessel'
  const LAGER = 'bund'
  const RUNDEN = 250000

  function oeffne() {
    return new Promise((ok, fehler) => {
      const a = indexedDB.open(NAME, 1)
      a.onupgradeneeded = () => {
        if (!a.result.objectStoreNames.contains(LAGER)) a.result.createObjectStore(LAGER)
      }
      a.onsuccess = () => ok(a.result)
      a.onerror = () => fehler(a.error)
      a.onblocked = () => fehler(new Error('blockiert'))
    })
  }

  async function vorgang(art, tun) {
    const db = await oeffne()
    try {
      return await new Promise((ok, fehler) => {
        const t = db.transaction(LAGER, art)
        const anfrage = tun(t.objectStore(LAGER))
        t.oncomplete = () => ok(anfrage.result)
        t.onerror = () => fehler(t.error)
      })
    } finally {
      db.close()
    }
  }

  async function laden() {
    try {
      const b = await vorgang('readonly', (l) => l.get(LAGER))
      return b && b.version === 1 && b.basis instanceof CryptoKey ? b : null
    } catch {
      return null
    }
  }

  async function loeschen() {
    try {
      await vorgang('readwrite', (l) => l.delete(LAGER))
    } catch {
      /* nichts zu löschen */
    }
  }

  function unb64(s) {
    const bin = atob(s)
    const b = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i)
    return b
  }

  async function passt(basis, zeile) {
    try {
      const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: unb64(zeile.salt), iterations: RUNDEN, hash: 'SHA-256' },
        basis,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt'],
      )
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(zeile.iv) }, key, unb64(zeile.daten))
      return true
    } catch {
      return false
    }
  }

  /**
   * Prüft das Notenbuch-Passwort und legt den Bund an.
   * `holeTresor(art)` liefert die verschlüsselte Zeile aus lr_tresore oder null.
   * Ergebnis: 'ok' | 'falsch' | 'keins' (noch weder Notenbuch noch Klassen – nichts zu prüfen, nichts gespeichert)
   */
  async function entsperre(passwort, holeTresor) {
    const basis = await crypto.subtle.importKey('raw', new TextEncoder().encode(passwort), 'PBKDF2', false, ['deriveKey'])
    for (const art of ['namen', 'klassen', 'notenbuch']) {
      const zeile = await holeTresor(art)
      if (!zeile) continue
      if (!(await passt(basis, zeile))) return 'falsch'
      await vorgang('readwrite', (l) => l.put({ version: 1, basis, am: new Date().toISOString() }, LAGER))
      return 'ok'
    }
    return 'keins'
  }

  window.LehrraumSchluessel = { laden, loeschen, entsperre }
})()
