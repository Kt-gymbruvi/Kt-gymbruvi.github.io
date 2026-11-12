# Startseite kt-gymbruvi.github.io – Projektregeln

Öffentliche Startseite „Lehrraum“ einer Lehrkraft (Biologie/Sport, Gymnasium Bruchhausen-Vilsen):
Übersicht der Unterrichtsplattform mit Seitenleiste, Suche und zwei Fassungen: angemeldete Lehrkräfte sehen
alles (Tafel, Schnellzugriff, zuletzt Benutztes), ohne Anmeldung gibt es Mitmachen per PIN, Quizzo, Klassenfunk,
Lernangebote (übernommene Claude-Artefakte) und Werkzeuge.
Stand und offene Aufgaben: `docs/PROJECT-STATUS.md`, Entscheidungen: `docs/DECISIONS.md` – beide nach größeren
Änderungen aktualisieren. Ausbau zur Unterrichtsplattform (Tafel, Klassen, Unterrichtseinheiten):
`docs/IMPLEMENTATION_ROADMAP.md`, `docs/ARCHITECTURE.md`; die Lehrkraft-App entsteht als eigenes Repo `Lehrraum`.

## Architektur
- Reines HTML/CSS/JavaScript ohne Build-Schritt und ohne npm-Abhängigkeiten. Was im Repo liegt, wird so ausgeliefert.
- Hosting: GitHub Pages, Repository `Kt-gymbruvi/Kt-gymbruvi.github.io`, „Deploy from a branch“ (`main`, Root). `.nojekyll` vorhanden.
- Gleiche Herkunft (Origin) wie Quizzo (`/Quizzo/`) und Klassenfunk (`/Klassenfunk/`) – diese sind eigene Repos und werden hier nie geändert.
- Inhalte der Startseite: `js/inhalte.js` (`SEITE`, `NAVIGATION` = Seitenleiste, `MITMACHEN`, `LINKS` = Kacheln, `SCHNELLZUGRIFF`, `WERKZEUGE`, `MATERIALIEN`; `nur: 'lehrkraft'` zeigt einen Eintrag nur angemeldet), gezeichnet von `js/app.js`, Aussehen `startseite.css`.
- Gemeinsame Gestaltung ohne Build in `gemeinsam/`: `tokens.css` (Dunkelblau/Türkis aus dem Logo, hell/dunkel, Bereichsfarben, Maße), `grundlage.css` (Seitengerüst mit Kopfzeile, Seitenleiste, Suche, Konto; Knöpfe, Fenster), `logo.png`/`logo-klein.png`, `symbole.js` (eigene SVG-Symbole, `LehrraumSymbol(name)`), `design.js` (Umschalter hell/dunkel, im `<head>` laden), `klassen.js` (liest die Klassen der Lehrkraft aus dem IndexedDB-Speicher der Lehrraum-App auf dem Gerät, nur lesend).
- Werkzeuge: `werkzeuge/<ordner>/index.html`, gemeinsames Aussehen `werkzeuge/werkzeug.css` + `style.css`.
- Lernangebote: `lernen/<ordner>/index.html`, Liste in `lernen/angebote.js` (Fach › Jahrgang › Thema), Übersicht `lernen/index.html` + `lernen/lernen.js`.
- Ordnung der Lernangebote (Titel, Text, Fach, Stufen, Thema, Reihenfolge, sichtbar) kann die angemeldete Lehrkraft unter `lernen/#bearbeiten` ändern; gespeichert in der Quizzo-Supabase-Tabelle `lernangebote` (Migration 009 im Quizzo-Repo), Zugriff über REST in `lernen/datenbank.js`. Ohne Datenbank gilt `angebote.js`. Ein Angebot erscheint nur, wenn es in `angebote.js` steht (Dateien müssen existieren).

## Konventionen
- Oberfläche, Bezeichner, Kommentare und Commit-Nachrichten auf Deutsch.
- Ordnernamen klein, ohne Umlaute/Leerzeichen (`a-z0-9-`).
- Design: Dunkelblau und Türkis (Türkis ersetzt das frühere Gelb), helle Arbeitsflächen, heller und dunkler Modus – Werte nur aus `gemeinsam/tokens.css`, keine festen Farben in Seiten. Quizzo und Klassenfunk behalten ihre eigenen Farben. Symbole aus `gemeinsam/symbole.js` statt Emojis.
- `style.css` ist das alte dunkle Design und gilt nur noch für `lernen/` und `werkzeuge/`, bis diese umgestellt sind. Werkzeuge mit Kopfzeile „← Startseite“, Lernangebote mit Leiste „← Lernangebote“.
- Navigationspunkte ohne `adresse` sind noch nicht gebaute Bereiche („folgt“); nie auf eine Seite verlinken, die es nicht gibt.
- Handy (Hochformat) und Beamer müssen funktionieren.
- Claude-Artefakt übernehmen: `node lernen/werkzeug/uebernehmen.mjs <datei.html> <ordner>` (lokale Schriften, Leiste, Prüfung), dann Eintrag in `lernen/angebote.js`. Anleitung: `werkzeuge/ANLEITUNG.md`.
- Wird ein Werkzeug/Angebot verschoben: alte Adresse als Weiterleitungsseite stehen lassen (QR-Codes, Lesezeichen).

## Datenschutz und Sicherheit
- Alles ist öffentlich: keine Schülerdaten, Noten, Prüfungslösungen, keine Scans aus Schulbüchern.
- Nichts von fremden Servern laden (Schriften, Bibliotheken wie `qrcode.min.js`, `three.min.js` liegen im Repo).
- Keine KI-Aufrufe, keine API-Schlüssel. Einzige Server-Verbindung: Supabase (Frankfurt) in `lernen/datenbank.js`, nur mit dem öffentlichen publishable-Schlüssel.
- `localStorage` nur für Einstellungen/Listen auf dem Gerät (`lehrraum-design`, `lehrraum-zuletzt`); nichts davon an Server schicken. Ausnahme: die Anmeldung der Lehrkraft (Supabase-Sitzung, gemeinsam mit Quizzo, Klassenfunk und der Tafel).
- Impressum/Datenschutz: `impressum.html` (verweist auf die Schule, enthält Abschnitte zu Quizzo und Klassenfunk).

## Arbeitsweise
- Vor dem Veröffentlichen prüfen: `node werkzeuge/pruefen.mjs` (alle Werkzeuge) bzw. `node werkzeuge/pruefen.mjs <datei>`; muss „Keine Probleme gefunden“ melden. Es gibt keine automatischen Tests.
- Lokal ansehen: `index.html` öffnen oder Vite-Vorschau (`.claude/launch.json`, Eintrag „startseite“, Port 5180; nutzt das Vite aus `../Quizzo`). Neues immer hell und dunkel sowie in Handy- und Beamerbreite ansehen.
- Der Ausbau läuft auf dem Zweig `lehrraum-phase-1`; `main` ist der veröffentlichte Stand.
- Nichts veröffentlichen (Push auf `main`) und nichts löschen ohne ausdrückliche Zustimmung der Lehrkraft.
