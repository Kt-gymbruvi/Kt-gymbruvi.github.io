# Projektstand – Startseite kt-gymbruvi.github.io

Stand: 21.11.2026 · live unter https://kt-gymbruvi.github.io/ (`main` = `origin/main`). Zweig `sofort-paket` (Fehler aus dem Audit vom 21.11.2026) wartet auf Zustimmung. Die neue Startseite „Lehrraum“ ist damit die Startseite der Plattform; der Zweig `lehrraum-phase-1` ist in `main` aufgegangen.
Plan und Hintergrund: `docs/PROJECT_AUDIT.md`, `FEATURE_INVENTORY.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_ROADMAP.md`.

## Audit und Sofort-Paket (21.11.2026, Zweig `sofort-paket`, nicht veröffentlicht)
Ganzheitliches Audit (Startseite, Lernangebote, Werkzeuge, Einstieg Quizzo/Klassenfunk; live und im Code). Behoben auf dem Zweig:
- `lernen/lernstil.css` gab Überschriften eine feste dunkle Farbe – in Angeboten mit dunklem Kopf (Phasenanalyse, Mystery Fischsterben, Turnierplaner, Akrobatik) war der Titel unlesbar (Kontrast 1,5:1). Jetzt erben Überschriften die Farbe. Außerdem: Schrittnummern im Versuchsplaner (Grün auf Grün), Turnier-Auswahl im Turnierplaner (weiß auf weiß), „Jungen/Mädchen“ im Leichtathletik-Rechner (Rot auf Grün), AFB-Marken in Artbildung.
- Seitlicher Überlauf am Handy: Wasserpest-Labor (666 px) und Phasenanalyse (431 px) – Grid-Spalten mit `minmax(0,1fr)`.
- Fallakten Kreislauf merkt sich die Lehrkraft-Ansicht (`#lehrkraft`) nicht mehr im Gerät.
- Logos Quizzo/Klassenfunk von 512 auf 128 px (zusammen 407 KB → 43 KB; vorher 88 % der Startseite).
- Startseite ohne Anmeldung am Handy: nur PIN, ohne Tafel-Knopf, Tafel-Bild und Kachel „Tafel als Gast“ (`handy: false` in `inhalte.js`); Platzhalter „6 Ziffern“ statt „123456“.
- Geprüft: alle 47 Angebote automatisch bei 375 px (Überlauf, Kontrast), Handy-Bilder, Startseite hell/dunkel, Handy/Desktop. Nicht geprüft: echte Geräte.

Offen aus dem Audit (Reihenfolge nach Nutzen):
1. Erledigt auf Zweig `darstellung-und-sitzung` (nicht veröffentlicht): `gemeinsam/sitzung.js` erneuert eine abgelaufene gemeinsame Sitzung mit dem Erneuerungstoken und schreibt sie zurück (Startseite, Lernübersicht, Lehrkraft-Hinweise in den Angeboten). Mit nachgestelltem Supabase-Server geprüft (15 Fälle: Erneuerung, widerrufen, ohne Sitzung, parallele Aufrufe, keine Neuladeschleife); **mit echtem Konto und zusammen mit Quizzo/Tafel noch nicht** – Erneuerungstoken sind nur einmal gültig, bitte nach dem Veröffentlichen morgens prüfen, ob Quizzo und Tafel angemeldet bleiben.
2. Erledigt auf Zweig `lehrkraft-hinweise` (Entscheidung der Lehrkraft 21.11.2026: „nur nach Anmeldung“): `lernen/lehrkraft.js` + Regel in `lernstil.css` blenden Lehrkraft-Hinweise ohne Anmeldung aus (16 Angebote). Sichtschutz, kein Zugriffsschutz – die Texte stehen weiter im Quelltext. Bewusst sichtbar geblieben: Musterlösungen zu Übungsaufgaben (Artbildung, Biomechanische Prinzipien, Plasmolyse, Räuber-Beute, Synapse, Zellzyklus), weil sie der Selbstkontrolle der Schüler dienen.
3. Gleiche Adresse für Notenbuch/Tafel und 46 KI-erzeugte Lernseiten: jede Seite könnte Anmelde-Token lesen und den Schlüsselbund benutzen. Langfristig eigene Adresse für sensible Apps, Lernangebote abschotten (iframe sandbox/CSP).
4. Ein PIN-Einstieg für Quiz und Abstimmung; einheitlicher Rückweg in Quizzo/Klassenfunk/Lernangeboten; dunkler Modus für Lernangebote; Token-Namen `--navy`/`--tuerkis` neutral benennen.
5. Darstellungsprüfung `werkzeuge/darstellung.mjs` ist gebaut (Zweig `darstellung-und-sitzung`). Bei 375 und 768 px ohne Fehler. Offen: bei 320 px (`--breiten 320`) laufen Akrobatik, Artbildung, Bestimmungsschlüssel, Enzymaktivität, Evolutionslabor und Herzzyklus seitlich über; 12 Stellen mit Kontrast 4,2–4,5:1 (Hinweise, knapp unter WCAG AA). Nicht erfasst: Zustände nach Klicks (z. B. Schrittnummern im Versuchsplaner), 3D-Szenen, Dunkelmodus der Angebote.

## Einheitliche Gestaltung im Stil der Tafel (veröffentlicht am 18.11.2026)
- Schritt 1 von 4 erledigt (18.11.2026): gemeinsame Basis. `gemeinsam/tokens.css` hat die Werte der Tafel (Systemschrift, Glas, Haarlinie, Schatten, Rundung, Bewegung); `gemeinsam/grundlage.css` hat leichtere Schriftstärken, Knöpfe, die beim Drücken nachgeben, graue Eingabefelder mit Fokusring, Fenster mit unscharfem Hintergrund und neue Bausteine (`.glas`, `.karte-flaeche`, `.symbol-feld`, `.liste-gruppe`, `.segmente`, `.chip`, `.eingabe`).
- Schritt 2 erledigt (18.11.2026): Übersicht der Lernangebote neu (`lernen/index.html`, `lernen/lernen.css`): Glas-Navigationsleiste „‹ Lehrraum“ mit Umschalter hell/dunkel, Seitenleiste Fach › Jahrgang › Thema wie in den Einstellungen, Angebote als gruppierte Listen mit Fach-Symbol (neue Symbole `blatt`, `laufen` statt Emojis), leiser QR-Knopf, Chips. Handy: Fächer als Segment-Umschalter, Jahrgänge und Themen als Chips. Bearbeiten-Modus und Speicherleiste im selben Stil. Geprüft hell/dunkel, Handy, Beamer 1920 px, Bearbeiten mit nachgestellter Anmeldung.
- Schritt 3 erledigt (18.11.2026, nach Entwurf und Zustimmung der Lehrkraft): Startseite mit heller, schwebender Seitenleiste (statt dunkelblau), Kopfzeile ohne Fläche und kleinerem Logo, Begrüßung als weiße Karte mit großem Titel, weiße Kacheln mit Bereichsfarbe nur im Symbol-Quadrat, leise QR-Symbole statt „QR“-Plaketten, Klassen als graue Felder, Werkzeuge im selben Stil; Handy als Raster wie App-Symbole. Geprüft hell/dunkel, Gast und angemeldet (mit Beispielklassen nachgestellt), Handy mit offenem Menü, Beamer 1920 px.
- Schritt 4 erledigt (18.11.2026): Werkzeuge (Timer, Gruppen & Zufall, Lautstärkeampel) und Herzfrequenz-Zonen mit Glas-Kopfzeile „‹ Startseite“/„‹ Lernangebote“ und Umschalter hell/dunkel (`werkzeuge/werkzeug.js`), weißen Karten, grauen Feldern, ohne Emojis; Ampelfarben als Tokens `--signal-rot/-gelb/-gruen`. Leiste „‹ Lernangebote“ in allen 40 übernommenen Angeboten hell im Stil der Tafel, zentral in `lernen/werkzeug/leiste.mjs` (auch von `uebernehmen.mjs` genutzt). Impressum mit heller Glas-Kopfleiste. Geprüft hell/dunkel, Handy; `pruefen.mjs` ohne Befund.
- Lernangebote im Stil der Startseite (21.11.2026, inzwischen in `main` und live): `lernen/lernstil.css` + `lernen/werkzeug/stil.mjs` für alle 46 Artefakte, nur heller Modus, Dunkelgrün/Orange. Offen: dunkler Modus, Beamerbreite und Klick-Test der Angebote. Unlesbare Titel und der Überlauf am Handy sind auf dem Zweig `sofort-paket` behoben (siehe unten).
- Das alte dunkle Design `style.css` ist gelöscht (18.11.2026, mit Zustimmung der Lehrkraft).
- Veröffentlicht nach Zustimmung der Lehrkraft. Offen: auf echtem iPad und am Beamer ansehen.

## Startseite kompakter (veröffentlicht am 15.11.2026)
- Schnellzugriff und „Zuletzt benutzt“ entfernt; Kacheln, Meine Klassen (höchstens sechs) und Werkzeuge kompakt nebeneinander, Symbole kleiner, Begrüßung flacher.
- Geprüft in der Vorschau mit nachgestellter Anmeldung und Beispielklassen: iPad hoch und quer, Handy, Beamer (1920 px), hell und dunkel, Suche. Auf einem echten iPad ungeprüft.

## Ein Passwort für Notenbuch, Tafel und Startseite (gebaut 14.11.2026, nicht veröffentlicht)
- Nach der Anmeldung fragt die Startseite einmal je Gerät nach dem Notenbuch-Passwort (Dialog „Notenbuch-Passwort für dieses Gerät“, „Später“ möglich) – nur, wenn es schon Notenbuch oder Klassen gibt und noch kein Schlüsselbund da ist. Geprüft wird an den verschlüsselten Tresoren (`LernDB.tresor`), abgelegt nur ein nicht exportierbarer Schlüssel (`gemeinsam/schluesselbund.js`). Abmelden löscht ihn; fehlt beim Start die gemeinsame Anmeldung, ebenso. Der Schlüssel öffnet nur Tafel und „Meine Klassen“; das Notenbuch fragt seit 15.11.2026 bei jedem Öffnen nach dem Passwort.
- Geprüft in der Vorschau: Prüfung „passt nicht“ / „passt“ / „noch nichts da“ mit nachgestelltem Tresor, Löschen, Dialog hell/dunkel am Handy. Mit echtem Konto ungeprüft. Spezifikation: `../Lehrraum/docs/SPEC-tafeln-abgleich-pdf-tabelle.md`, Etappe B.

## Implementiert
- **Rückwege (geprüft am 12.11.2026 an den veröffentlichten Seiten):** Quizzo (Knopf „← Lehrraum“ auf Startseite, Anmeldung und in der Lehrkraft-Kopfzeile), Klassenfunk (Knopf „Lehrraum“ in jeder Ansicht), Lehrraum-App (Haus-Knopf), Lernübersicht und Werkzeuge („← Startseite“) führen alle auf `https://kt-gymbruvi.github.io/`. Lernangebote führen über „← Lernangebote“ zur Lernübersicht und von dort zur Startseite.
- **Startseite „Lehrraum“** (`index.html`, `startseite.css`, `js/app.js`, `js/inhalte.js`), nach dem Bildentwurf der Lehrkraft:
  - Kopfzeile mit Logo, Suche über Bereiche, Werkzeuge, Lernangebote und Materialien, Anmelden bzw. Konto-Kürzel mit Abmelden.
  - Seitenleiste links (auf schmalen Bildschirmen als aufklappbares Menü), darin der Umschalter hell/dunkel.
  - **Volle Fassung für angemeldete Lehrkräfte:** Begrüßung mit „Zur Tafel“, fünf Kacheln (Meine Klassen, Quizzo, Klassenfunk, Lernangebote, Interaktive Tafel), Bereich **„Meine Klassen“** mit „Zur Tafel“ je Klasse und „Neue Klasse anlegen“, Werkzeuge.
  - Die Klassen liest `gemeinsam/klassen.js` aus dem Speicher des Geräts (IndexedDB der Lehrraum-App, nur lesend). Angelegt werden sie in der Lehrraum-App (`/Lehrraum/#/klassen`).
  - **Schlanke Fassung ohne Anmeldung:** „Mitmachen“ mit PIN (weiter zu Quizzo oder Klassenfunk), Kacheln Quizzo, Klassenfunk, Lernangebote, Werkzeuge.
  - Materialliste mit Suche/Fachfilter/QR (derzeit leer und deshalb ausgeblendet).
- **Gemeinsame Gestaltung** (`gemeinsam/`): `tokens.css` (Dunkelgrün/Orange aus dem Logo, hell/dunkel, Bereichsfarben, Maße), `grundlage.css` (Seitengerüst mit Kopfzeile und Seitenleiste, Suche, Konto, Knöpfe, Fenster, Fuß), `symbole.js` (28 eigene SVG-Symbole), `design.js` (Umschalter), `logo.png` und `logo-klein.png`.
- **Werkzeuge** (`werkzeuge/`): Timer (Beamer, Signalton, Bildschirm bleibt an), Gruppen & Zufall (Namen nur im Gerät), Lautstärkeampel (Mikrofon nur lokal ausgewertet, „Ruhe messen“, Grenzen/Reaktionszeit einstellbar, optionaler Ton, Vollbild). QR-Code erstellen (`werkzeug/qr-code/`, freie http/https-Adresse, Vollbild, PNG speichern; Code entsteht im Browser). Aussehen aus `gemeinsam/` und `werkzeug.css`.
- **Lernangebote** (`lernen/`): 41 Einträge in `angebote.js` (32 Biologie Kl. 5–13, 9 Sport inkl. Oberstufe), Übersicht nach Fach › Jahrgang › Thema mit Suche und QR; Bearbeitungsmodus `lernen/#bearbeiten` für die angemeldete Lehrkraft (Supabase-Tabelle `lernangebote`, nutzt auch eine bestehende Quizzo-Anmeldung). Übersicht noch im alten Design.
- Herzfrequenz-Zonen liegen seit 08.11.2026 unter `lernen/herzfrequenz-zonen/` (Sport, Kl. 11 und 12/13); `werkzeuge/herzfrequenz/` leitet weiter.
- **Hilfsskripte:** `werkzeuge/pruefen.mjs` (fremde Server, KI-Aufrufe, Datenversand, Grundlagen; `--veroeffentlichen` prüft Impressum), `lernen/werkzeug/uebernehmen.mjs` (Artefakt übernehmen), `lernen/werkzeug/schriften-holen.mjs`.
- **Impressum** (`impressum.html`): Verweis auf Impressum/Datenschutz der Schule, Hinweise zu Quizzo und Klassenfunk; auf dem Zweig im neuen Design und mit eigenem Absatz zur Lautstärkeampel.

## Struktur
```
index.html, startseite.css, impressum.html, .nojekyll, favicon.svg (alt, nicht mehr eingebunden)
gemeinsam/  tokens.css, grundlage.css, symbole.js, design.js, logo.png, logo-klein.png
js/         app.js, inhalte.js, qrcode.min.js
werkzeuge/  ANLEITUNG.md, pruefen.mjs, werkzeug.css, werkzeug.js, timer/, gruppen/, lautstaerke/, qr-code/, herzfrequenz/ (Weiterleitung)
lernen/     index.html, lernen.js, angebote.js, datenbank.js, schriften/, werkzeug/, <41 Angebotsordner>
materialien/ (leer)
docs/       PROJECT-STATUS.md, DECISIONS.md, PROJECT_AUDIT.md, FEATURE_INVENTORY.md, ARCHITECTURE.md, IMPLEMENTATION_ROADMAP.md
```

## Bekannte Probleme / offen
- Neue Startseite nur in der Vorschau geprüft (1280 px und Handy 375 px, hell und dunkel, beide Fassungen) – nicht auf echtem iPad, Smartboard oder Beamer.
- **Die Anmeldung auf der Startseite ist auch nach der Veröffentlichung nicht mit einem echten Konto geprüft** (das muss die Lehrkraft tun). Die volle Fassung wurde mit einer nachgestellten Sitzung angesehen. Ungeprüft ist insbesondere, ob Quizzo, Klassenfunk und die Tafel eine hier begonnene Anmeldung übernehmen (umgekehrt – erst dort anmelden – nutzt die Startseite den schon bisher verwendeten Weg).
- Das Begrüßungsbild ist eine einfache Zeichnung; das Foto aus dem Entwurf liegt nicht als Datei vor.
- „Meine Klassen“: Zusammenspiel live geprüft (in der Lehrraum-App angelegte Klasse erscheint auf der Startseite, „Zur Tafel“ öffnet ihre Tafel). In der lokalen Vorschau teilen sich Startseite und Lehrraum keinen Speicher.
- Frühere Notiz, erledigt: Sie brauchen die Klassenverwaltung und die Tafel aus dem Repository `Lehrraum`, das es noch nicht gibt.
- `.claude/launch.json` (Vorschau über das Vite aus `../Quizzo`) ist lokal angelegt und bewusst nicht committet.
- Lautstärkeampel nur mit künstlichem Testsignal geprüft, nicht mit echtem Mikrofon im Klassenraum.
- README nennt noch die Schritte „Vor der ersten Veröffentlichung“ (erledigt); ob die Schulleitung das Impressum freigegeben hat, ist hier nicht dokumentiert. Der Impressumstext wurde am 11.11.2026 ergänzt (Lautstärkeampel, Speicherung auf dem Gerät).
- Keine automatischen Tests; Qualitätssicherung nur über `pruefen.mjs` und Ansehen im Browser.
- Materialliste ist leer.

## Schwesterprojekt Lehrraum
- Seit 11.11.2026 gibt es `../Lehrraum`, veröffentlicht unter https://kt-gymbruvi.github.io/Lehrraum/ (Repository `Kt-gymbruvi/Lehrraum`): Gerüst und Tafel mit Stift, Textmarker, Radierer, Text, Formen, Bildern, Auswahl, Seiten, PDF öffnen und speichern, Rückgängig, Autospeichern sowie Fenstern (Uhr, Timer, Stoppuhr, Würfel, Notizen, Quizzo, Klassenfunk, Lernangebote) – Etappen 1.3, 2a, 2b, 2c, 3a und 5a. Stand dort in `docs/PROJECT-STATUS.md`.
- Der Navigationspunkt „Tafel“ in `js/inhalte.js` hat auf dem Zweig noch keine Adresse. Lehrraum ist jetzt live; beim Veröffentlichen der neuen Startseite `adresse: '/Lehrraum/#/tafel'` eintragen.

## Notenbuch (seit 14.11.2026 live)
- Das Notenbuch ist vom Claude-Artefakt nach `../Notenbuch` umgezogen (https://kt-gymbruvi.github.io/Notenbuch/), Plan in `../Lehrraum/docs/SPEC-klassen-namen-und-notenbuch.md`. Abgleich zwischen zwei Geräten von der Lehrkraft geprüft.
- Auf der Startseite: Eintrag „Notenbuch“ in Seitenleiste und Schnellzugriff (nur angemeldet), Symbol `notenbuch`, Absatz im Impressum (veröffentlicht am 14.11.2026).

## Nächste Schritte (priorisiert, siehe `IMPLEMENTATION_ROADMAP.md`)
1. Tafel am iPad (Apple Pencil) und am Smartboard erproben (Lehrkraft). Entscheiden, ob die neue Startseite (Zweig `lehrraum-phase-1`) veröffentlicht wird.
2. Etappe 1.2: Lernübersicht und Werkzeuge auf `gemeinsam/` umstellen, QR-Fenster als gemeinsames Modul.
3. Zusammenführen mit `main` und Veröffentlichen erst nach ausdrücklicher Zustimmung.
4. Lautstärkeampel am iPad im Unterricht ausprobieren, Grenzwerte ggf. anpassen.

## Logos Quizzo und Klassenfunk
Kacheln und Seitenleiste zeigen die Logos (`gemeinsam/quizzo-symbol.png`, `gemeinsam/klassenfunk-symbol.png`; Feld `bild` in `js/inhalte.js`). Noch nicht veröffentlicht.
