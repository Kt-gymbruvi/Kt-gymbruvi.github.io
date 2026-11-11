# Umsetzungsplan – Digitale Unterrichtsplattform

Stand: 11.11.2026 · Vorschlag zur Freigabe, Teil des Repository-Audits ([PROJECT_AUDIT.md](PROJECT_AUDIT.md))
Grundlage: Zielarchitektur in [ARCHITECTURE.md](ARCHITECTURE.md), Bestand in [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md)

**Es wurde noch nichts umgebaut.** Der Umbau beginnt erst nach Freigabe dieses Plans.

## 1. Grundsätze für jede Etappe

1. Vor Beginn ein Git-Commit des aktuellen Stands; jede Etappe ist ein eigener Commit („Etappe N: …“).
2. Eine Etappe ist klein genug, um sie an einem Stück zu prüfen, und lässt die Plattform benutzbar zurück.
3. Abschluss einer Etappe: Tests grün (`npm test`, `npm run build` bzw. `node werkzeuge/pruefen.mjs`), kurze
   Zusammenfassung „getestet / nicht getestet“, Dokumentation aktualisiert.
4. Veröffentlicht (Push auf `main`) und in der Datenbank ausgeführt wird nur nach ausdrücklicher Zustimmung.
5. Bestehende Adressen bleiben gültig; wird etwas verschoben, bleibt eine Weiterleitung stehen.
6. Datenbankänderungen nur ergänzend (neue Tabellen, neue optionale Spalten), als nummerierte SQL-Datei mit Test.
7. Nichts wird als fertig gemeldet, was nur als Platzhalter existiert.

## 2. Priorisierung

Die Reihenfolge folgt Abschnitt 16 der Spezifikation, mit zwei Anpassungen:

- **Die Tafel wird in vier Teilschritten gebaut** und schon nach dem ersten am iPad erprobt. Stifteingabe ist das
  größte technische Risiko; sie soll geklärt sein, bevor Werkzeuge und Klassenverwaltung darauf aufbauen.
- **„Aus der Tafel starten“ (Teil von Phase 5) wird vorgezogen**, sobald das Fenstersystem steht: Es kostet wenig,
  braucht keine Änderung an Quizzo oder Klassenfunk und macht die Tafel sofort im Unterricht nützlich.

| Rang | Paket | Nutzen im Unterricht | Risiko | Aufwand |
|---|---|---|---|---|
| 1 | Phase 1: Designsystem, Navigation, Gerüst `Lehrraum` | Grundlage | gering | M |
| 2 | Phase 2a: Zeichnen (Stift, Marker, Radierer, Farben, Rückgängig, Autospeichern) | **hoch** – Tafel ersetzt Whiteboard | **hoch** (Stift) | L |
| 3 | Phase 3a: Fenstersystem + Uhr, Timer, Stoppuhr, Würfel, Notiz | hoch | gering | M |
| 4 | Phase 5a: Quizzo, Klassenfunk, Lernangebote als Fenster starten | hoch | gering | S |
| 5 | Phase 2b: Seiten, Text, Formen, Pfeile, Bilder, Auswahl | hoch | mittel | L |
| 6 | Phase 4: Klassenverwaltung, Zufall und Gruppen mit Klassenliste, Goodnotes-Link | hoch | mittel (Datenschutz) | L |
| 7 | Phase 2c: PDF-Import, Annotation, PDF-Export, Teilen an Goodnotes | hoch | mittel | M |
| 8 | Phase 2d: Whiteboardmodus (unendliche Fläche, Zoom, Gruppieren), Vorlagen, Hintergründe | mittel | mittel | M |
| 9 | Phase 3b: Arbeitsauftrag, Stundenablauf, QR-Code, Lautstärkeampel als Fenster | mittel | gering | M |
| 10 | Phase 6: Bibliothek und Metadaten der Lernangebote | mittel | gering | M |
| 11 | Phase 7: Unterrichtseinheiten | mittel | gering | L |
| 12 | Phase 5b: Ergebnisse auf die Tafel, Fragenbibliothek, fehlende Abstimmungstypen | mittel | mittel (drei Repos) | L |
| 13 | Phase 8: gemeinsamer Schülerzugang, Härtung der Codes | gering (läuft schon getrennt) | gering | S–M |
| 14 | Phase 9: Offline, Sicherung, neue Aufgabenformen | später | – | offen |

Aufwand: S = eine Etappe, M = zwei bis drei, L = vier oder mehr.

## 3. Phasen im Einzelnen

### Phase 0 – Repository-Audit ✅
Ergebnis: diese vier Dokumente. Offen: Freigabe und die sechs Entscheidungen aus dem Audit (Abschnitt 8).

---

### Phase 1 – Designsystem und Navigation
**Ziel:** einheitliches Erscheinungsbild, fünf Navigationspunkte, leeres Gerüst der neuen App – ohne dass eine
bestehende Funktion sich anders verhält.

| Etappe | Inhalt | Repo |
|---|---|---|
| 1.1 | `/gemeinsam/tokens.css` (Farben, Abstände, Schrift, heller und dunkler Modus), einheitlicher Symbolsatz als SVG | Startseite |
| 1.2 | Startseite und Lernübersicht auf die Tokens umstellen; Hauptnavigation; QR-Dialog als gemeinsames Modul; kleine Unstimmigkeiten aus dem Audit (Abschnitt 5, Nr. 1–4) bereinigen | Startseite |
| 1.3 | Neues Repository `Lehrraum` nach dem Muster von Quizzo: Vite, React, TypeScript, Tailwind, Vitest, Actions-Deploy, Anmeldung mit dem bestehenden Konto, drei leere Bereiche mit Navigation | Lehrraum (neu) |
| 1.4 | Übersichtsseite „Interaktion“; Rückweg zur Plattform in Quizzo ergänzen (Klassenfunk hat ihn) | Startseite, Quizzo |

**Abnahme:** Alle bisherigen Adressen funktionieren. Startseite, Lernübersicht und Werkzeuge sind hell und dunkel
lesbar, auf Handy (Hochformat), iPad und Beamer. `pruefen.mjs` meldet „Keine Probleme gefunden“. Anmeldung in
`Lehrraum` funktioniert mit einer bestehenden Quizzo-Sitzung.
**Rückfall:** Die Startseite ist ein einzelner Commit; `git revert` stellt das alte Aussehen her.
**Voraussetzung:** Entscheidungen 1, 4, 5.

---

### Phase 2 – Hybride Tafel
**Ziel:** eine Tafel, die im Unterricht ein Whiteboard ersetzt.

| Etappe | Inhalt |
|---|---|
| 2a.1 | Zeichenfläche mit Kamera; Stift mit Druck, Textmarker, Radierer; Farbe und Strichstärke; linke Leiste fest |
| 2a.2 | Rückgängig/Wiederholen (Befehlsstapel); Tastaturkürzel; Handballen-Schutz, Zwei-Finger-Verschieben |
| 2a.3 | Datenmodell Version 1, Autospeichern in IndexedDB, Wiederherstellen nach Schließen, manuelles Speichern |
| → | **Erprobung am iPad mit Apple Pencil und am Smartboard**, bevor es weitergeht |
| 2b.1 | Auswahlwerkzeug: verschieben, skalieren, löschen, duplizieren |
| 2b.2 | Text, Formen, Pfeile |
| 2b.3 | Bilder einfügen (Datei, Zwischenablage, Ziehen) |
| 2b.4 | Seitenmodus: Seiten hinzufügen, löschen, duplizieren, umsortieren, Miniaturen |
| 2c.1 | PDF importieren (Seiten als Hintergrund), darauf zeichnen |
| 2c.2 | Export als PDF; Export/Import als Tafel-Datei |
| 2d.1 | Whiteboardmodus: unbegrenzte Fläche, Zoom, Übersicht |
| 2d.2 | Gruppieren, Ausrichten; Hintergründe (kariert, liniert, Punkte, dunkel, Bild); Tafelvorlagen |

**Abnahme (Auszug):** 30 Minuten Schreiben am iPad ohne spürbare Verzögerung; Schließen und Wiederöffnen des
Browsers verliert nichts; ein 20-seitiges PDF lässt sich importieren, beschriften und wieder als PDF exportieren;
alle Werkzeuge per Maus, Finger und Stift bedienbar.
**Tests:** Logik (Geometrie, Befehlsstapel, Migration, Export) automatisiert; Zeichnen nach fester Prüfliste von Hand.
**Risiken:** Stiftgefühl in Safari; Speichergrenzen bei vielen Bildern; große PDFs auf älteren Geräten.
**Voraussetzung:** Entscheidung 3.

---

### Phase 3 – Lehrraum-Werkzeuge
**Ziel:** rechte Leiste mit Fenstern, die die Tafel nicht verdecken oder zurücksetzen.

| Etappe | Inhalt |
|---|---|
| 3a.1 | Fenstersystem: öffnen, verschieben, Größe ändern, einklappen, schließen; Positionen je Tafelbild gemerkt; rechte Leiste fest |
| 3a.2 | Uhr, Timer, Stoppuhr (Timer zunächst das bestehende Werkzeug, eingebettet) |
| 3a.3 | Würfel, Notizen und Post-its (Post-its lassen sich auf die Tafel ablegen) |
| 3b.1 | Arbeitsauftrag (Text, Sozialform, Zeit – startet auf Wunsch den Timer), Stundenablauf (Phasen mit Zeiten) |
| 3b.2 | QR-Code-Fenster (beliebige Adresse), Lautstärkeampel als Fenster |
| 3b.3 | Einbettungsansicht `?einbettung=1` für Timer und Lautstärkeampel |

**Abnahme:** Jedes Fenster lässt sich öffnen, während gezeichnet wird; die Tafel bleibt unverändert; mehrere Fenster
gleichzeitig; Bedienung mit dem Finger am Smartboard.

---

### Phase 4 – Klassenverwaltung und Goodnotes
**Ziel:** Klassen anlegen und wechseln; Namen stehen den Werkzeugen zur Verfügung.

| Etappe | Inhalt |
|---|---|
| 4.1 | Klassen anlegen, bearbeiten, kopieren, archivieren (Bezeichnung, Fach, Jahrgang); Speicherung lokal, Datenmodell Version 1 |
| 4.2 | Schülerliste (einfügen aus Text, einzeln bearbeiten, „heute abwesend“); Export/Import als Datei |
| 4.3 | Zufallsschüler und Gruppengenerator als Fenster mit der Liste der gewählten Klasse; feste Gruppen speichern |
| 4.4 | Sitzordnung (Raster, Plätze per Ziehen belegen, Anzeige am Beamer ein-/ausblendbar) |
| 4.5 | Klassenwechsel in der Kopfzeile der Tafel; Zuordnung von Quizzen, Präsentationen, Lernangeboten, Tafelbildern |
| 4.6 | Goodnotes-Link pro Klasse; PDF über das Teilen-Menü weitergeben |
| 4.7 | Einmaliges Angebot, die im Gruppen-Werkzeug gemerkte Liste als Klasse zu übernehmen |

**Abnahme:** Klassenwechsel ändert Namensliste, Goodnotes-Knopf und Vorschläge; keine Netzwerkanfrage enthält einen
Schülernamen (per Test geprüft); archivierte Klassen sind wiederherstellbar.
**Voraussetzung:** Entscheidung 2. Empfehlung: vorab kurze Rücksprache mit der Schule zu lokal gespeicherten
Klassenlisten auf einem Dienstgerät.

---

### Phase 5 – Integration von Klassenfunk und Quizzo
**Ziel:** beide Anwendungen aus der Tafel bedienen; Ergebnisse auf der Tafel weiterverwenden.

| Etappe | Inhalt | Repo |
|---|---|---|
| 5a.1 | Fenster „Quizzo“: eigene Quizze auflisten, Modus wählen, Spiel starten, Beamer-Ansicht im Fenster oder im Vollbild | Lehrraum |
| 5a.2 | Fenster „Klassenfunk“: Präsentationen auflisten, Sitzung starten | Lehrraum |
| 5a.3 | Fenster „Lernangebote“: Auswahl nach Fach und Jahrgang, Anzeige, QR-Code für die Klasse | Lehrraum |
| 5b.1 | Einbettungsmodus und Nachricht „beendet“ | Quizzo, Klassenfunk |
| 5b.2 | „Auf die Tafel“: anonyme Ergebnisse als Diagramm-Element | Quizzo, Klassenfunk, Lehrraum |
| 5b.3 | Ergebnisse exportieren (Bild, PDF, CSV) | Klassenfunk |
| 5b.4 | Fragenbibliothek `lr_fragen` mit Umwandlern nach Quizzo und Klassenfunk; Übernahme aus bestehenden Quizzen | Lehrraum (+ SQL) |
| 5b.5 | Klassenfunk: Vorlage „Ja/Nein“, neuer Folientyp „Pro-Contra“ | Klassenfunk (+ SQL) |
| 5b.6 | Quizzo: Bilder auf dem Handy und als Antworten (steht dort bereits als Idee im Fahrplan) | Quizzo (+ SQL) |

**Abnahme:** Start eines Quiz und einer Abstimmung aus der Tafel in höchstens drei Tipps; die Tafel bleibt erhalten;
sämtliche bestehenden Tests in Quizzo (282) und Klassenfunk (32) bleiben grün; übertragene Ergebnisse enthalten keine
Spitznamen.
**Hinweis:** 5a braucht keine Änderung an Quizzo oder Klassenfunk und kann direkt nach 3a folgen.

---

### Phase 6 – Integration der Lernangebote
| Etappe | Inhalt |
|---|---|
| 6.1 | Neue optionale Felder `art`, `lernziel`, `schwierigkeit`, `dauer_min`, `vorschau` in `angebote.js` und als Spalten in `lernangebote` (SQL-Datei im Quizzo-Repo, wie Migration 009); Bearbeitungsmodus erweitern |
| 6.2 | Metadaten für die 41 Angebote eintragen (Vorschlag durch Claude, Durchsicht durch die Lehrkraft); Vorschaubilder erzeugen |
| 6.3 | Lernübersicht: Filter nach Art (Simulation, Lernspiel, Selbsttest …), Karten mit Vorschau |
| 6.4 | Bibliothek in `Lehrraum`: gemeinsame Sicht auf Lernangebote, Quizze, Präsentationen, Tafelbilder, Materialien |

**Abnahme:** Jedes der 41 Angebote ist unter unveränderter Adresse erreichbar; ohne Datenbank gilt weiter `angebote.js`.

---

### Phase 7 – Unterrichtseinheiten
| Etappe | Inhalt |
|---|---|
| 7.1 | Datenmodell und Tabelle `lr_einheiten` mit RLS und Tests |
| 7.2 | Editor: Bausteine anlegen, per Ziehen ordnen, Zeiten summieren, Ziel zuordnen (Quiz, Präsentation, Lernangebot, Tafelbild, PDF, Text) |
| 7.3 | Unterrichtsmodus an der Tafel: Leiste mit Schritt vor/zurück, Restzeit, öffnet je Baustein das passende Fenster |
| 7.4 | Speichern, kopieren, erneut starten; Zuordnung zu Klassen |

**Abnahme:** Eine Einheit mit allen neun Bausteinarten lässt sich anlegen, speichern, kopieren und Schritt für Schritt
durchführen, ohne dass das Tafelbild verloren geht.

---

### Phase 8 – QR-Code und Live-Sitzungen
Der Schülerzugang existiert und funktioniert. Diese Phase vereinheitlicht und härtet ihn.

| Etappe | Inhalt |
|---|---|
| 8.1 | Eine Beitrittsseite für alle Anwendungen (PIN eingeben oder QR scannen → Weiterleitung zu Quizzo oder Klassenfunk) |
| 8.2 | PIN-Erzeugung auf kryptografischen Zufall umstellen; prüfen, ob eine Bremse gegen Durchprobieren nötig ist |
| 8.3 | Nächtliches Aufräumen als Cron-Job in Supabase einrichten und dokumentieren |
| 8.4 | Datenschutztext (`impressum.html`) an den tatsächlichen Stand anpassen |

---

### Phase 9 – Erweiterungen und Optimierungen (nach Bedarf)
- Offline-Betrieb der Tafel (Service Worker).
- Verschlüsselte Sicherung von Tafelbildern und Klassen auf dem Server (Stufe 2 aus der Architektur).
- Baukasten für neue Aufgabenformen: Lückentext, Zuordnung, Drag-and-drop, verzweigte Lernpfade.
- Quizfragen zu einzelnen Lernangeboten.
- SMTP-Server in Supabase (Einladungen, „Passwort vergessen“) – offener Punkt aus Quizzo.

## 4. Was vor dem Start geklärt sein muss

| Nr. | Frage | Empfehlung | Blockiert |
|---|---|---|---|
| 1 | Neue App als eigenes Repository `Lehrraum` unter `/Lehrraum/`? | ja | Phase 1.3 |
| 2 | Schülernamen nur auf dem Gerät? | ja, Stufe 1 | Phase 4 |
| 3 | Eigene schlanke Zeichenfläche mit `perfect-freehand`, PDF.js, `pdf-lib`? | ja | Phase 2 |
| 4 | Startseite bleibt Schülerseite, Lehrkraft-Bereich dahinter? | ja | Phase 1.2 |
| 5 | Quizzo und Klassenfunk behalten ihre Farben? | ja | Phase 1.4 |
| 6 | Reihenfolge wie in Abschnitt 2 (Tafel früh am iPad erproben, „Starten aus der Tafel“ vorziehen)? | ja | Planung |

Zusätzlich hilfreich, aber nicht blockierend:
- Welche Geräte stehen im Unterricht (iPad-Modell, Smartboard-Hersteller und Browser)?
- Welcher Supabase-Tarif ist aktiv?
- Soll der Name „Lehrraum“ bleiben?

## 5. Erster Schritt nach der Freigabe

Etappe 1.1 und 1.2 im Repository der Startseite: Tokens, heller und dunkler Modus, Hauptnavigation – als ein
überprüfbarer Commit, lokal angesehen auf Handy-, iPad- und Beamerbreite, **ohne Veröffentlichung** bis zur Zustimmung.
