# Projektstand – Startseite kt-gymbruvi.github.io

Stand: 10.11.2026 · live unter https://kt-gymbruvi.github.io/ (letzter Push: `cebb674`)

## Implementiert
- **Startseite** (`index.html`, `js/app.js`, `js/inhalte.js`): Überschrift „Lernen mit Spaß“, Kacheln mit QR-Knopf (Lernangebote, Quizzo, Klassenfunk), Werkzeugliste, Materialliste mit Suche/Fachfilter/QR (derzeit leer).
- **Werkzeuge** (`werkzeuge/`): Timer (Beamer, Signalton, Bildschirm bleibt an), Gruppen & Zufall (Namen nur im Gerät), Lautstärkeampel (Mikrofon nur lokal ausgewertet, „Ruhe messen“, Grenzen/Reaktionszeit einstellbar, optionaler Ton, Vollbild).
- **Lernangebote** (`lernen/`): 42 Einträge in `angebote.js` (Biologie Kl. 5–13, Sport inkl. Oberstufe), Übersicht nach Fach › Jahrgang › Thema mit Suche und QR; Bearbeitungsmodus `lernen/#bearbeiten` für die angemeldete Lehrkraft (Supabase-Tabelle `lernangebote`, nutzt auch eine bestehende Quizzo-Anmeldung).
- Herzfrequenz-Zonen liegen seit 08.11.2026 unter `lernen/herzfrequenz-zonen/` (Sport, Kl. 11 und 12/13); `werkzeuge/herzfrequenz/` leitet weiter.
- **Hilfsskripte:** `werkzeuge/pruefen.mjs` (fremde Server, KI-Aufrufe, Datenversand, Grundlagen; `--veroeffentlichen` prüft Impressum), `lernen/werkzeug/uebernehmen.mjs` (Artefakt übernehmen), `lernen/werkzeug/schriften-holen.mjs`.
- **Impressum** (`impressum.html`): Verweis auf Impressum/Datenschutz der Schule, Hinweise zu Quizzo und Klassenfunk.

## Struktur
```
index.html, style.css, favicon.svg, impressum.html, .nojekyll
js/        app.js, inhalte.js, qrcode.min.js
werkzeuge/ ANLEITUNG.md, pruefen.mjs, werkzeug.css, timer/, gruppen/, lautstaerke/, herzfrequenz/ (Weiterleitung)
lernen/    index.html, lernen.js, angebote.js, datenbank.js, schriften/, werkzeug/, <42 Angebotsordner>
materialien/ (leer)
docs/      PROJECT-STATUS.md, DECISIONS.md
```

## Bekannte Probleme / offen
- Lautstärkeampel nur mit künstlichem Testsignal geprüft, nicht mit echtem Mikrofon im Klassenraum.
- README nennt noch die Schritte „Vor der ersten Veröffentlichung“ (erledigt); ob die Schulleitung das Impressum freigegeben hat, ist hier nicht dokumentiert.
- Keine automatischen Tests; Qualitätssicherung nur über `pruefen.mjs` und Ansehen im Browser.
- Materialliste ist leer.

## Nächste Schritte (priorisiert)
1. Lautstärkeampel am iPad im Unterricht ausprobieren, Grenzwerte ggf. anpassen.
2. Weitere Claude-Artefakte als Lernangebote übernehmen (nach Bedarf der Lehrkraft).
3. Materialien ergänzen, sobald vorhanden.
