/*
 * Echtzeit-Kanal zu Supabase Realtime (Rechenzentrum Frankfurt) – ohne Bibliothek, nur WebSocket.
 * Es wird nichts in der Datenbank gespeichert: Nachrichten („broadcast“) und Anwesenheit („presence“) laufen nur,
 * solange jemand im Kanal ist. Verwendet nur den öffentlichen Schlüssel (wie Quizzo, Klassenfunk und lernen/datenbank.js).
 *
 *   const kanal = Echtzeit.oeffnen('spielraum-ABC123', {
 *     schluessel: 'meine-id',            // Schlüssel in der Anwesenheitsliste
 *     beiNachricht(ereignis, daten) {},   // Nachricht von anderen (nicht von mir selbst)
 *     beiAnwesenheit(liste) {},           // Liste aller Anwesenden: [{ … meta }]
 *     beiStatus(status) {},               // 'verbindet' | 'verbunden' | 'getrennt'
 *   })
 *   kanal.sende('zug', { … })
 *   kanal.verfolge({ name: 'Ben', … })    // eigene Angaben in der Anwesenheitsliste (ersetzt die vorigen)
 *   kanal.schliessen()
 */
;(function () {
  'use strict'

  const SERVER = 'wss://ifdqfndsvgiyvxvxtoga.supabase.co/realtime/v1/websocket'
  const SCHLUESSEL = 'sb_publishable_IwhtQdYMQTuZCeo5Ul4DAw_lgjqKgLG'
  const HERZSCHLAG_MS = 25000

  function oeffnen(name, o) {
    const thema = 'realtime:' + name
    let ws = null
    let ref = 0
    let beigetreten = false
    let geschlossen = false
    let herz = 0
    let versuch = 0
    let erneut = 0
    let meta = null
    const warteschlange = [] // Nachrichten, die vor dem Beitritt gesendet wurden
    // Anwesenheit: je Schlüssel (Person) mehrere Einträge, jeder mit eigener Kennung („phx_ref“). Wer seine Angaben ändert oder die Seite
    // wechselt, meldet erst einen neuen Eintrag an und den alten ab – beides kann in getrennten Nachrichten kommen. Deshalb darf eine
    // Abmeldung nur ihren eigenen Eintrag löschen, nie die ganze Person (sonst wirkt jemand fälschlich als weg).
    const anwesende = new Map() // Schlüssel → Map(Kennung → meta), in der Reihenfolge des Eintreffens
    const eintraege = () => {
      const l = []
      anwesende.forEach((metas) => {
        const letzte = [...metas.values()].pop()
        if (letzte) l.push(letzte)
      })
      return l
    }
    const trage = (k, metas) =>
      (metas || []).forEach((m) => {
        if (!anwesende.has(k)) anwesende.set(k, new Map())
        anwesende.get(k).set(m.phx_ref || 'ohne-' + anwesende.get(k).size, m)
      })
    const nimm = (k, metas) => {
      const m = anwesende.get(k)
      if (!m) return
      ;(metas || []).forEach((x) => m.delete(x.phx_ref || ''))
      if (!m.size) anwesende.delete(k)
    }

    const status = (s) => o.beiStatus && o.beiStatus(s)

    function senden(ereignis, nutzlast, themaName) {
      if (!ws || ws.readyState !== 1) return false
      ws.send(JSON.stringify({ topic: themaName || thema, event: ereignis, payload: nutzlast, ref: String(++ref), join_ref: '1' }))
      return true
    }

    function meldeAnwesenheit() {
      if (o.beiAnwesenheit) o.beiAnwesenheit(eintraege())
    }

    function verbinden() {
      if (geschlossen) return
      status('verbindet')
      beigetreten = false
      ws = new WebSocket(SERVER + '?apikey=' + SCHLUESSEL + '&vsn=1.0.0')
      ws.onopen = () => {
        senden('phx_join', {
          config: { broadcast: { ack: false, self: false }, presence: { key: o.schluessel || '' }, postgres_changes: [], private: false },
          access_token: SCHLUESSEL,
        })
        clearInterval(herz)
        herz = setInterval(() => senden('heartbeat', {}, 'phoenix'), HERZSCHLAG_MS)
      }
      ws.onmessage = (e) => {
        let m
        try {
          m = JSON.parse(e.data)
        } catch {
          return
        }
        if (m.topic !== thema) return
        if (m.event === 'phx_reply' && m.payload && m.payload.status === 'ok' && !beigetreten) {
          beigetreten = true
          versuch = 0
          status('verbunden')
          if (meta) senden('presence', { type: 'presence', event: 'track', payload: meta })
          while (warteschlange.length) {
            const [ereignis, daten] = warteschlange.shift()
            kanalSenden(ereignis, daten)
          }
        } else if (m.event === 'phx_reply' && m.payload && m.payload.status === 'error' && !beigetreten) {
          status('getrennt')
        } else if (m.event === 'broadcast' && m.payload && m.payload.type === 'broadcast') {
          if (o.beiNachricht) o.beiNachricht(m.payload.event, m.payload.payload)
        } else if (m.event === 'presence_state') {
          anwesende.clear()
          Object.keys(m.payload || {}).forEach((k) => trage(k, m.payload[k].metas))
          meldeAnwesenheit()
        } else if (m.event === 'presence_diff') {
          const p = m.payload || {}
          // erst neue Einträge, dann Abmeldungen: so bleibt jemand, der gerade neu angemeldet wurde, auch dann da, wenn die Abmeldung des alten Eintrags später kommt
          Object.keys(p.joins || {}).forEach((k) => trage(k, p.joins[k].metas))
          Object.keys(p.leaves || {}).forEach((k) => nimm(k, p.leaves[k].metas))
          meldeAnwesenheit()
        }
      }
      ws.onclose = () => {
        clearInterval(herz)
        beigetreten = false
        anwesende.clear()
        if (geschlossen) return
        status('getrennt')
        // wieder verbinden: 1 s, 2 s, 4 s … höchstens 15 s
        erneut = setTimeout(verbinden, Math.min(15000, 1000 * 2 ** versuch++))
      }
      ws.onerror = () => {
        try {
          ws.close()
        } catch {
          /* egal */
        }
      }
    }

    function kanalSenden(ereignis, daten) {
      if (!beigetreten) {
        warteschlange.push([ereignis, daten])
        return
      }
      senden('broadcast', { type: 'broadcast', event: ereignis, payload: daten })
    }

    verbinden()

    return {
      sende: kanalSenden,
      verfolge(neu) {
        meta = neu
        if (beigetreten) senden('presence', { type: 'presence', event: 'track', payload: meta })
      },
      verbunden: () => beigetreten,
      schliessen() {
        geschlossen = true
        clearInterval(herz)
        clearTimeout(erneut)
        try {
          if (ws && ws.readyState === 1) senden('phx_leave', {})
          if (ws) ws.close()
        } catch {
          /* egal */
        }
      },
    }
  }

  window.Echtzeit = { oeffnen }
})()
