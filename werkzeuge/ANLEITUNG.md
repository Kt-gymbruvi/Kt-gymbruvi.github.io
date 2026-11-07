# Werkzeuge, Lernangebote – und wie ein Claude-Artefakt hierher kommt

**Lernangebote** (Simulationen, Erklärungen, Übungen aus Claude-Artefakten) liegen unter `lernen/<ordner>/` und
erscheinen auf `lernen/` geordnet nach Fach › Jahrgang › Thema (wie in „Meine Artefakte“). Übernahme in einem Schritt:

```
node lernen/werkzeug/uebernehmen.mjs <heruntergeladenes-artefakt.html> <ordnername>
```

Das ersetzt Google Fonts durch die lokalen Schriften (`lernen/schriften/`), fügt die Leiste „← Lernangebote“ ein und
prüft die Datei. Danach in `lernen/angebote.js` eintragen (Fach, Jahrgänge, Thema). Was das Prüfskript als Fehler meldet
(z. B. Speichern im Claude-Konto über `window.claude`), muss von Hand entfernt werden.

**Werkzeuge** (kleine eigene Helfer wie Timer) liegen unter `werkzeuge/`:

Jedes Werkzeug ist ein eigener Ordner mit einer `index.html`:

```
werkzeuge/
  werkzeug.css          gemeinsames Aussehen (Kopfzeile, Felder, Knöpfe)
  timer/index.html
  gruppen/index.html
  herzfrequenz/index.html
  pruefen.mjs           Prüfskript (siehe unten)
```

Auf der Startseite erscheint ein Werkzeug, sobald es in `js/inhalte.js` unter `WERKZEUGE` eingetragen ist
(Bereich, Symbol, Titel, kurzer Text, Adresse `werkzeuge/<ordner>/`).

## Ein Claude-Artefakt übernehmen

1. **Herunterladen:** Im Artefakt bei Claude „Herunterladen“ bzw. „Code kopieren“ wählen und als
   `werkzeuge/<kurzer-name>/index.html` speichern (Ordnername klein, ohne Leerzeichen und Umlaute, z. B. `raeuber-beute`).
   React-Artefakte (`.jsx`) müssen vorher in eine einzelne HTML-Datei umgewandelt werden – das kann Claude Code übernehmen.
2. **Prüfen lassen:**
   ```
   node werkzeuge/pruefen.mjs werkzeuge/<kurzer-name>/index.html
   ```
3. **Was das Skript bemängelt, beheben:**
   - *Fremde Server* (z. B. `cdnjs.cloudflare.com`, `unpkg.com`, Google Fonts): Datei herunterladen und in den Werkzeug-Ordner
     legen, Pfad anpassen. So erfährt kein fremder Server, wer die Seite öffnet.
   - *KI-Aufrufe* (`window.claude`, `api.anthropic.com`, `openai`): funktionieren außerhalb von Claude nicht – entfernen.
     Niemals einen API-Schlüssel in diese öffentliche Seite schreiben.
   - *Speichern* (`localStorage`, `indexedDB`): nur für Einstellungen oder Listen, die auf dem Gerät bleiben.
     Keine Namen, Noten oder Gesundheitsdaten an einen Server schicken.
   - *Fehlende Grundlagen*: `<html lang="de">`, `<meta name="viewport" …>` und ein `<title>` ergänzen.
4. **Aussehen angleichen (optional):** im `<head>` `../../style.css` und `../werkzeug.css` einbinden und oben
   eine Kopfzeile mit „← Startseite“ einfügen – wie in `timer/index.html`.
5. **Ausprobieren:** am Handy (Hochformat) und am Beamer; Inhalt fachlich prüfen.
6. **Eintragen** in `js/inhalte.js` → `WERKZEUGE`.

Alles hier ist öffentlich: nur eigenes oder frei lizenziertes Material, keine Schülerdaten.
