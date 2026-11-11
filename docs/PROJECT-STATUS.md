# Projektstand – Startseite kt-gymbruvi.github.io

Stand: 11.11.2026 · live unter https://kt-gymbruvi.github.io/ ist weiterhin der Stand von `main` (`68fe986`).
**In Arbeit, nicht veröffentlicht:** Zweig `lehrraum-phase-1` – Ausbau zur Unterrichtsplattform „Lehrraum“.
Plan und Hintergrund: `docs/PROJECT_AUDIT.md`, `FEATURE_INVENTORY.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_ROADMAP.md`.

## Implementiert
- **Startseite „Lehrraum“** (`index.html`, `startseite.css`, `js/app.js`, `js/inhalte.js`) – *nur auf dem Zweig*: Kopfleiste mit Hauptnavigation (Tafel, Unterrichten, Interaktion, Lernen, Bibliothek; noch nicht gebaute Bereiche als „folgt“), Umschalter hell/dunkel, „Mitmachen“ mit PIN (weiter zu Quizzo oder Klassenfunk), Schnellstart-Kacheln mit QR-Knopf (Quizzo, Klassenfunk, Lernangebote), Werkzeugliste, Materialliste mit Suche/Fachfilter/QR (derzeit leer).
- **Gemeinsame Gestaltung** (`gemeinsam/`) – *nur auf dem Zweig*: `tokens.css` (Farben hell/dunkel, Bereichsfarben, Maße), `grundlage.css` (Kopfleiste, Knöpfe, QR-Fenster, Fuß), `symbole.js` (17 eigene SVG-Symbole), `design.js` (Umschalter).
- **Werkzeuge** (`werkzeuge/`): Timer (Beamer, Signalton, Bildschirm bleibt an), Gruppen & Zufall (Namen nur im Gerät), Lautstärkeampel (Mikrofon nur lokal ausgewertet, „Ruhe messen“, Grenzen/Reaktionszeit einstellbar, optionaler Ton, Vollbild). Noch im alten Design (`style.css`, `werkzeug.css`).
- **Lernangebote** (`lernen/`): 41 Einträge in `angebote.js` (32 Biologie Kl. 5–13, 9 Sport inkl. Oberstufe), Übersicht nach Fach › Jahrgang › Thema mit Suche und QR; Bearbeitungsmodus `lernen/#bearbeiten` für die angemeldete Lehrkraft (Supabase-Tabelle `lernangebote`, nutzt auch eine bestehende Quizzo-Anmeldung). Übersicht noch im alten Design.
- Herzfrequenz-Zonen liegen seit 08.11.2026 unter `lernen/herzfrequenz-zonen/` (Sport, Kl. 11 und 12/13); `werkzeuge/herzfrequenz/` leitet weiter.
- **Hilfsskripte:** `werkzeuge/pruefen.mjs` (fremde Server, KI-Aufrufe, Datenversand, Grundlagen; `--veroeffentlichen` prüft Impressum), `lernen/werkzeug/uebernehmen.mjs` (Artefakt übernehmen), `lernen/werkzeug/schriften-holen.mjs`.
- **Impressum** (`impressum.html`): Verweis auf Impressum/Datenschutz der Schule, Hinweise zu Quizzo und Klassenfunk; auf dem Zweig im neuen Design und mit eigenem Absatz zur Lautstärkeampel.

## Struktur
```
index.html, startseite.css, favicon.svg, impressum.html, .nojekyll
style.css   altes Design – nur noch für lernen/ und werkzeuge/, bis Etappe 1.2
gemeinsam/  tokens.css, grundlage.css, symbole.js, design.js
js/         app.js, inhalte.js, qrcode.min.js
werkzeuge/  ANLEITUNG.md, pruefen.mjs, werkzeug.css, timer/, gruppen/, lautstaerke/, herzfrequenz/ (Weiterleitung)
lernen/     index.html, lernen.js, angebote.js, datenbank.js, schriften/, werkzeug/, <41 Angebotsordner>
materialien/ (leer)
docs/       PROJECT-STATUS.md, DECISIONS.md, PROJECT_AUDIT.md, FEATURE_INVENTORY.md, ARCHITECTURE.md, IMPLEMENTATION_ROADMAP.md
```

## Bekannte Probleme / offen
- Neue Startseite nur in der Vorschau geprüft (Desktop 1024 px, Handy 375 px, hell und dunkel) – nicht auf echtem iPad, Smartboard oder Beamer.
- Lernübersicht und Werkzeuge haben noch das alte, dunkle Design und den Rückweg „← Startseite“; das wirkt neben der neuen Startseite uneinheitlich, bis Etappe 1.2 erledigt ist.
- Die Klassen-Kacheln („Klassen zuerst“) fehlen noch: Sie brauchen die Klassenverwaltung und die Tafel aus dem Repository `Lehrraum`, das es noch nicht gibt.
- `.claude/launch.json` (Vorschau über das Vite aus `../Quizzo`) ist lokal angelegt und bewusst nicht committet.
- Lautstärkeampel nur mit künstlichem Testsignal geprüft, nicht mit echtem Mikrofon im Klassenraum.
- README nennt noch die Schritte „Vor der ersten Veröffentlichung“ (erledigt); ob die Schulleitung das Impressum freigegeben hat, ist hier nicht dokumentiert. Der Impressumstext wurde am 11.11.2026 ergänzt (Lautstärkeampel, Speicherung auf dem Gerät).
- Keine automatischen Tests; Qualitätssicherung nur über `pruefen.mjs` und Ansehen im Browser.
- Materialliste ist leer.

## Schwesterprojekt Lehrraum
- Seit 11.11.2026 gibt es `../Lehrraum` (nur lokal, kein GitHub-Repository): Gerüst und Tafel mit Stift, Textmarker, Radierer, Rückgängig, Autospeichern (Etappen 1.3 und 2a). Stand dort in `docs/PROJECT-STATUS.md`.
- Der Navigationspunkt „Tafel“ in `js/inhalte.js` bleibt ohne Adresse, bis Lehrraum unter `/Lehrraum/` veröffentlicht ist.

## Nächste Schritte (priorisiert, siehe `IMPLEMENTATION_ROADMAP.md`)
1. Tafel am iPad (Apple Pencil) und am Smartboard erproben – dafür muss Lehrraum veröffentlicht werden (Entscheidung der Lehrkraft).
2. Etappe 1.2: Lernübersicht und Werkzeuge auf `gemeinsam/` umstellen, QR-Fenster als gemeinsames Modul.
3. Zusammenführen mit `main` und Veröffentlichen erst nach ausdrücklicher Zustimmung.
4. Lautstärkeampel am iPad im Unterricht ausprobieren, Grenzwerte ggf. anpassen.
