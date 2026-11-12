# Projektstand – Startseite kt-gymbruvi.github.io

Stand: 12.11.2026 · live unter https://kt-gymbruvi.github.io/ ist weiterhin der Stand von `main` (`68fe986`).
**In Arbeit, nicht veröffentlicht:** Zweig `lehrraum-phase-1` – Ausbau zur Unterrichtsplattform „Lehrraum“.
Plan und Hintergrund: `docs/PROJECT_AUDIT.md`, `FEATURE_INVENTORY.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_ROADMAP.md`.

## Implementiert
- **Startseite „Lehrraum“** (`index.html`, `startseite.css`, `js/app.js`, `js/inhalte.js`) – *nur auf dem Zweig*, nach dem Bildentwurf der Lehrkraft:
  - Kopfzeile mit Logo, Suche über Bereiche, Werkzeuge, Lernangebote und Materialien, Anmelden bzw. Konto-Kürzel mit Abmelden.
  - Seitenleiste links (auf schmalen Bildschirmen als aufklappbares Menü), darin der Umschalter hell/dunkel.
  - **Volle Fassung für angemeldete Lehrkräfte:** Begrüßung mit „Zur Tafel“, fünf Kacheln (Meine Klassen als „folgt“, Quizzo, Klassenfunk, Lernangebote, Interaktive Tafel), „Zuletzt benutzt“, Schnellzugriff, Werkzeuge.
  - **Schlanke Fassung ohne Anmeldung:** „Mitmachen“ mit PIN (weiter zu Quizzo oder Klassenfunk), Kacheln Quizzo, Klassenfunk, Lernangebote, Werkzeuge.
  - Materialliste mit Suche/Fachfilter/QR (derzeit leer und deshalb ausgeblendet).
- **Gemeinsame Gestaltung** (`gemeinsam/`) – *nur auf dem Zweig*: `tokens.css` (Dunkelblau/Türkis aus dem Logo, hell/dunkel, Bereichsfarben, Maße), `grundlage.css` (Seitengerüst mit Kopfzeile und Seitenleiste, Suche, Konto, Knöpfe, Fenster, Fuß), `symbole.js` (28 eigene SVG-Symbole), `design.js` (Umschalter), `logo.png` und `logo-klein.png`.
- **Werkzeuge** (`werkzeuge/`): Timer (Beamer, Signalton, Bildschirm bleibt an), Gruppen & Zufall (Namen nur im Gerät), Lautstärkeampel (Mikrofon nur lokal ausgewertet, „Ruhe messen“, Grenzen/Reaktionszeit einstellbar, optionaler Ton, Vollbild). Noch im alten Design (`style.css`, `werkzeug.css`).
- **Lernangebote** (`lernen/`): 41 Einträge in `angebote.js` (32 Biologie Kl. 5–13, 9 Sport inkl. Oberstufe), Übersicht nach Fach › Jahrgang › Thema mit Suche und QR; Bearbeitungsmodus `lernen/#bearbeiten` für die angemeldete Lehrkraft (Supabase-Tabelle `lernangebote`, nutzt auch eine bestehende Quizzo-Anmeldung). Übersicht noch im alten Design.
- Herzfrequenz-Zonen liegen seit 08.11.2026 unter `lernen/herzfrequenz-zonen/` (Sport, Kl. 11 und 12/13); `werkzeuge/herzfrequenz/` leitet weiter.
- **Hilfsskripte:** `werkzeuge/pruefen.mjs` (fremde Server, KI-Aufrufe, Datenversand, Grundlagen; `--veroeffentlichen` prüft Impressum), `lernen/werkzeug/uebernehmen.mjs` (Artefakt übernehmen), `lernen/werkzeug/schriften-holen.mjs`.
- **Impressum** (`impressum.html`): Verweis auf Impressum/Datenschutz der Schule, Hinweise zu Quizzo und Klassenfunk; auf dem Zweig im neuen Design und mit eigenem Absatz zur Lautstärkeampel.

## Struktur
```
index.html, startseite.css, impressum.html, .nojekyll, favicon.svg (alt, nicht mehr eingebunden)
style.css   altes Design – nur noch für lernen/ und werkzeuge/, bis Etappe 1.2
gemeinsam/  tokens.css, grundlage.css, symbole.js, design.js, logo.png, logo-klein.png
js/         app.js, inhalte.js, qrcode.min.js
werkzeuge/  ANLEITUNG.md, pruefen.mjs, werkzeug.css, timer/, gruppen/, lautstaerke/, herzfrequenz/ (Weiterleitung)
lernen/     index.html, lernen.js, angebote.js, datenbank.js, schriften/, werkzeug/, <41 Angebotsordner>
materialien/ (leer)
docs/       PROJECT-STATUS.md, DECISIONS.md, PROJECT_AUDIT.md, FEATURE_INVENTORY.md, ARCHITECTURE.md, IMPLEMENTATION_ROADMAP.md
```

## Bekannte Probleme / offen
- Neue Startseite nur in der Vorschau geprüft (1280 px und Handy 375 px, hell und dunkel, beide Fassungen) – nicht auf echtem iPad, Smartboard oder Beamer.
- **Die Anmeldung auf der Startseite ist nicht mit einem echten Konto geprüft.** Die volle Fassung wurde mit einer nachgestellten Sitzung angesehen. Ungeprüft ist insbesondere, ob Quizzo, Klassenfunk und die Tafel eine hier begonnene Anmeldung übernehmen (umgekehrt – erst dort anmelden – nutzt die Startseite den schon bisher verwendeten Weg).
- Das Begrüßungsbild ist eine einfache Zeichnung; das Foto aus dem Entwurf liegt nicht als Datei vor.
- Die Lehrraum-App (Tafel) verwendet im dunklen Modus noch Gelb als Akzent; Umstellung auf Türkis steht aus.
- Lernübersicht und Werkzeuge haben noch das alte, dunkle Design und den Rückweg „← Startseite“; das wirkt neben der neuen Startseite uneinheitlich, bis Etappe 1.2 erledigt ist.
- Der Bereich „Meine Klassen“ mit „Zur Tafel“ je Klasse fehlt noch (Kachel und Seitenleiste zeigen „folgt“): Sie brauchen die Klassenverwaltung und die Tafel aus dem Repository `Lehrraum`, das es noch nicht gibt.
- `.claude/launch.json` (Vorschau über das Vite aus `../Quizzo`) ist lokal angelegt und bewusst nicht committet.
- Lautstärkeampel nur mit künstlichem Testsignal geprüft, nicht mit echtem Mikrofon im Klassenraum.
- README nennt noch die Schritte „Vor der ersten Veröffentlichung“ (erledigt); ob die Schulleitung das Impressum freigegeben hat, ist hier nicht dokumentiert. Der Impressumstext wurde am 11.11.2026 ergänzt (Lautstärkeampel, Speicherung auf dem Gerät).
- Keine automatischen Tests; Qualitätssicherung nur über `pruefen.mjs` und Ansehen im Browser.
- Materialliste ist leer.

## Schwesterprojekt Lehrraum
- Seit 11.11.2026 gibt es `../Lehrraum`, veröffentlicht unter https://kt-gymbruvi.github.io/Lehrraum/ (Repository `Kt-gymbruvi/Lehrraum`): Gerüst und Tafel mit Stift, Textmarker, Radierer, Text, Formen, Bildern, Auswahl, Seiten, PDF öffnen und speichern, Rückgängig, Autospeichern sowie Fenstern (Uhr, Timer, Stoppuhr, Würfel, Notizen, Quizzo, Klassenfunk, Lernangebote) – Etappen 1.3, 2a, 2b, 2c, 3a und 5a. Stand dort in `docs/PROJECT-STATUS.md`.
- Der Navigationspunkt „Tafel“ in `js/inhalte.js` hat auf dem Zweig noch keine Adresse. Lehrraum ist jetzt live; beim Veröffentlichen der neuen Startseite `adresse: '/Lehrraum/#/tafel'` eintragen.

## Nächste Schritte (priorisiert, siehe `IMPLEMENTATION_ROADMAP.md`)
1. Tafel am iPad (Apple Pencil) und am Smartboard erproben (Lehrkraft). Entscheiden, ob die neue Startseite (Zweig `lehrraum-phase-1`) veröffentlicht wird.
2. Etappe 1.2: Lernübersicht und Werkzeuge auf `gemeinsam/` umstellen, QR-Fenster als gemeinsames Modul.
3. Zusammenführen mit `main` und Veröffentlichen erst nach ausdrücklicher Zustimmung.
4. Lautstärkeampel am iPad im Unterricht ausprobieren, Grenzwerte ggf. anpassen.
