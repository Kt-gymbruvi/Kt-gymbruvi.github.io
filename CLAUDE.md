# Startseite kt-gymbruvi.github.io – Projektregeln

Öffentliche Startseite „Lernen mit Spaß“ einer Lehrkraft (Biologie/Sport, Gymnasium Bruchhausen-Vilsen):
Schnellzugriff auf Quizzo und Klassenfunk, kleine Werkzeuge für den Unterricht, Lernangebote (übernommene
Claude-Artefakte) und eine Materialliste. Stand und offene Aufgaben: `docs/PROJECT-STATUS.md`,
Entscheidungen: `docs/DECISIONS.md` – beide nach größeren Änderungen aktualisieren.

## Architektur
- Reines HTML/CSS/JavaScript ohne Build-Schritt und ohne npm-Abhängigkeiten. Was im Repo liegt, wird so ausgeliefert.
- Hosting: GitHub Pages, Repository `Kt-gymbruvi/Kt-gymbruvi.github.io`, „Deploy from a branch“ (`main`, Root). `.nojekyll` vorhanden.
- Gleiche Herkunft (Origin) wie Quizzo (`/Quizzo/`) und Klassenfunk (`/Klassenfunk/`) – diese sind eigene Repos und werden hier nie geändert.
- Inhalte der Startseite: `js/inhalte.js` (`SEITE`, `LINKS` = Kacheln, `WERKZEUGE`, `MATERIALIEN`), gezeichnet von `js/app.js`.
- Werkzeuge: `werkzeuge/<ordner>/index.html`, gemeinsames Aussehen `werkzeuge/werkzeug.css` + `style.css`.
- Lernangebote: `lernen/<ordner>/index.html`, Liste in `lernen/angebote.js` (Fach › Jahrgang › Thema), Übersicht `lernen/index.html` + `lernen/lernen.js`.
- Ordnung der Lernangebote (Titel, Text, Fach, Stufen, Thema, Reihenfolge, sichtbar) kann die angemeldete Lehrkraft unter `lernen/#bearbeiten` ändern; gespeichert in der Quizzo-Supabase-Tabelle `lernangebote` (Migration 009 im Quizzo-Repo), Zugriff über REST in `lernen/datenbank.js`. Ohne Datenbank gilt `angebote.js`. Ein Angebot erscheint nur, wenn es in `angebote.js` steht (Dateien müssen existieren).

## Konventionen
- Oberfläche, Bezeichner, Kommentare und Commit-Nachrichten auf Deutsch.
- Ordnernamen klein, ohne Umlaute/Leerzeichen (`a-z0-9-`).
- Design: Dunkelblau/Gelb (`--navy`, `--gelb` in `style.css`). Werkzeuge mit Kopfzeile „← Startseite“, Lernangebote mit Leiste „← Lernangebote“.
- Handy (Hochformat) und Beamer müssen funktionieren.
- Claude-Artefakt übernehmen: `node lernen/werkzeug/uebernehmen.mjs <datei.html> <ordner>` (lokale Schriften, Leiste, Prüfung), dann Eintrag in `lernen/angebote.js`. Anleitung: `werkzeuge/ANLEITUNG.md`.
- Wird ein Werkzeug/Angebot verschoben: alte Adresse als Weiterleitungsseite stehen lassen (QR-Codes, Lesezeichen).

## Datenschutz und Sicherheit
- Alles ist öffentlich: keine Schülerdaten, Noten, Prüfungslösungen, keine Scans aus Schulbüchern.
- Nichts von fremden Servern laden (Schriften, Bibliotheken wie `qrcode.min.js`, `three.min.js` liegen im Repo).
- Keine KI-Aufrufe, keine API-Schlüssel. Einzige Server-Verbindung: Supabase (Frankfurt) in `lernen/datenbank.js`, nur mit dem öffentlichen publishable-Schlüssel.
- `localStorage` nur für Einstellungen/Listen auf dem Gerät; nichts davon an Server schicken.
- Impressum/Datenschutz: `impressum.html` (verweist auf die Schule, enthält Abschnitte zu Quizzo und Klassenfunk).

## Arbeitsweise
- Vor dem Veröffentlichen prüfen: `node werkzeuge/pruefen.mjs` (alle Werkzeuge) bzw. `node werkzeuge/pruefen.mjs <datei>`; muss „Keine Probleme gefunden“ melden. Es gibt keine automatischen Tests.
- Lokal ansehen: `index.html` öffnen oder Vite-Vorschau (Quizzo `.claude/launch.json`, Eintrag „startseite“, Port 5180).
- Nichts veröffentlichen (Push auf `main`) und nichts löschen ohne ausdrückliche Zustimmung der Lehrkraft.
