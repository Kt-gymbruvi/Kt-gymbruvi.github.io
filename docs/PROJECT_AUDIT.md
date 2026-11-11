# Repository-Audit – Digitale Unterrichtsplattform (Phase 0)

Stand: 11.11.2026 · Grundlage: Projektspezifikation Version 1.0
Zugehörige Dokumente: [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)

Dieses Audit hat **keine bestehende Datei verändert**. Neu angelegt wurden nur die vier Audit-Dokumente in `docs/`.
Nichts wurde committet oder veröffentlicht.

## 1. Kurzfassung

- Die Plattform besteht heute aus **drei getrennten Repositories**, die unter einer gemeinsamen Adresse
  (`kt-gymbruvi.github.io`) ausgeliefert werden und **eine gemeinsame Supabase-Datenbank** samt Lehrkraft-Konten nutzen.
  Das ist eine sehr gute Ausgangslage: gleiche Herkunft (Origin) heißt gemeinsame Anmeldung, Einbettung per iframe und
  Nachrichtenaustausch zwischen den Anwendungen sind ohne Serverumbau möglich.
- **Quizzo** und **Klassenfunk** sind ausgereift, getestet (282 bzw. 32 Tests) und decken den größten Teil der
  Spezifikation (Abschnitte 7, 8, 11) bereits ab. Sie sollten **unverändert weiterlaufen** und nur kleine
  Schnittstellen bekommen.
- Die **41 Lernangebote** und **3 Werkzeuge** sind eigenständige HTML-Seiten ohne Abhängigkeiten. Sie bleiben, wie sie
  sind; es fehlen nur Metadaten (Lernziel, Schwierigkeit, Bearbeitungszeit, Vorschau).
- **Komplett neu** sind: die hybride Tafel (Lehrraum), Klassenverwaltung, Unterrichtseinheiten, Bibliothek,
  Goodnotes-Anbindung und die gemeinsame Navigation. Das ist der mit Abstand größte Teil der Arbeit.
- Es gibt **vier Stellen, an denen die Spezifikation bestehenden Projektregeln widerspricht** (Abschnitt 6). Die
  wichtigste: Schülerlisten und Sitzordnungen sind personenbezogene Daten – bisher gilt in allen drei Projekten
  „keine Klarnamen auf dem Server“. Dazu braucht es vor Phase 4 eine Entscheidung.
- Empfehlung: Die neue Lehrkraft-Oberfläche als **viertes Repository „Lehrraum“** im selben Stack wie Quizzo
  (Vite, React, TypeScript, Tailwind, Vitest) bauen; die Startseite bleibt statisch und wird nur optisch und in der
  Navigation angepasst. Begründung in [ARCHITECTURE.md](ARCHITECTURE.md).

## 2. Was untersucht wurde

| Repository | Ordner lokal | Stand | Umfang |
|---|---|---|---|
| Startseite | `Kt-gymbruvi.github.io` | `main` = `origin/main` (`68fe986`), Arbeitsverzeichnis sauber | 83 Dateien, ca. 3.600 Zeilen eigener Code + 41 Lernangebote (2,5 MB HTML) |
| Quizzo | `../Quizzo` | `main` = `origin/main` (`3b5d99a`), nur `.claude/launch.json` lokal geändert (bekannt, bewusst) | 87 Dateien, ca. 7.900 Zeilen TypeScript, 2.800 Zeilen SQL, 15 Testdateien |
| Klassenfunk | `../Klassenfunk` | `main` = `origin/main` (`647963b`), sauber | 43 Dateien, ca. 2.700 Zeilen TypeScript, 680 Zeilen SQL, 2 Testdateien |

Gelesen wurden: alle Projektregeln (`CLAUDE.md`), Stands- und Entscheidungsdokumente, Fahrpläne, der gesamte eigene
Code der Startseite, in Quizzo und Klassenfunk die Routen, Datenformate (`fragetypen.ts`, `folien.ts`), der
Datenzugriff, alle Tabellen- und Funktionsdefinitionen der SQL-Migrationen sowie die Build- und Deploy-Konfiguration.
Die Lernangebote wurden nicht einzeln fachlich durchgespielt, sondern technisch klassifiziert (Speicherung, Zeichenfläche,
Druck, Ton, Handy-Tauglichkeit) und mit `werkzeuge/pruefen.mjs` geprüft.

**Geprüft und bestätigt:**
- `node werkzeuge/pruefen.mjs` (Werkzeuge) und derselbe Lauf über alle `lernen/*/index.html`: „Keine Probleme gefunden“.
- Alle drei Repos sind auf dem Stand von `origin/main`.

**Nicht geprüft:** die Live-Datenbank (kein Zugriff, keine Anmeldung), das Verhalten auf echten Geräten (iPad,
Smartboard, Apple Pencil), die Testläufe von Quizzo und Klassenfunk (Zahlen stammen aus deren `PROJECT-STATUS.md`).

## 3. Bestehende Architektur

```
https://kt-gymbruvi.github.io/            Repo Kt-gymbruvi.github.io   HTML/CSS/JS ohne Build, „Deploy from branch“
  ├─ /                 Startseite (Kacheln, Werkzeuge, Materialien)
  ├─ /lernen/          Übersicht + 41 Lernangebote (statische Einzelseiten)
  ├─ /werkzeuge/       Timer, Gruppen & Zufall, Lautstärkeampel
  ├─ /Quizzo/          Repo Quizzo        Vite + React 19 + TypeScript + Tailwind 4, Deploy per GitHub Actions
  └─ /Klassenfunk/     Repo Klassenfunk   gleicher Stack, Deploy per GitHub Actions

Supabase (ein Projekt, Region Frankfurt)
  ├─ Auth: nur eingeladene Lehrkräfte (E-Mail + Passwort), ein Konto für alles
  ├─ Quizzo:      quizze, fragen, spiele, spieler, antworten, aufgaben, aufgabe_* · Bucket quizzo-medien
  ├─ Klassenfunk: kf_praesentationen, kf_folien, kf_sitzungen, kf_teilnehmer, kf_antworten, kf_fragen, kf_stimmen
  │               · Bucket klassenfunk-medien
  └─ Startseite:  lernangebote (Ordnung der Lernangebote)
```

Gemeinsame Muster, die sich bewährt haben und für die neue Plattform übernommen werden sollten:

- **Schüler ohne Konto und ohne Tabellenzugriff:** Beitritt per PIN, danach nur `security definer`-Funktionen mit
  geheimem Token. Punkte und Gültigkeit prüft der Server.
- **Sitzungen sind kurzlebig:** Löschen beim Beenden, Reste nach 6 Stunden (`spiele_aufraeumen()`, `kf_aufraeumen()`).
- **Inhalte als `typ` + JSON `inhalt`**, von der Datenbank geprüft – neue Typen ohne Tabellenumbau.
- **Echtzeit:** Supabase Realtime (Broadcast) als Signal, Abfrage alle 2 s als Rückfallebene.
- **Tests ohne echten Server:** `fakeSupabase` für die Oberfläche, PGlite-Nachbau für SQL inklusive RLS.
- **`<Einpassen>`:** Beamer- und Handyansichten sind genau eine Bildschirmhöhe.
- **HashRouter**, weil GitHub Pages keine Weiterleitungen für Unterseiten kann.

## 4. Bewertung nach den sechs Leitfragen

### 4.1 Was kann unverändert bleiben?
- **Quizzo vollständig** (Editor, zehn Fragetypen, Live-Spiel, Team, Turnier, Aufgaben, Klassen-Duell, Buzzer, Wiederholung).
- **Klassenfunk vollständig** (neun Folientypen, Sitzung, Reaktionen, Barometer, Medien).
- **Alle 41 Lernangebote** als Dateien, inklusive ihrer Adressen (QR-Codes und Lesezeichen bleiben gültig).
- **Die drei Werkzeuge** als eigenständige Seiten.
- **Die Supabase-Datenbank** mit allen Tabellen, Funktionen und Zugriffsregeln.
- **Hilfsskripte** `pruefen.mjs`, `uebernehmen.mjs`, `schriften-holen.mjs`.
- **Hosting** auf GitHub Pages und die Deploy-Abläufe.

### 4.2 Was muss optisch angepasst werden?
- **Startseite:** heute durchgehend dunkel (`color-scheme: dark`, Dunkelblau/Gelb). Die Spezifikation verlangt helle
  Arbeitsflächen, hellen und dunklen Modus und eine Hauptnavigation mit fünf Bereichen.
- **Lernübersicht `lernen/`:** gleiche Farbwelt wie die Startseite, zieht mit um.
- **Werkzeuge:** brauchen eine kompakte Darstellung für die Einbettung als Fenster über der Tafel.
- **Quizzo und Klassenfunk:** haben bewusst eigene Farben (Dunkelblau/Gelb bzw. Petrol/Koralle), damit man sie am
  Beamer sofort unterscheidet. Empfehlung: Farben behalten, nur einen einheitlichen Rückweg zur Plattform ergänzen
  (Klassenfunk hat den „🏠 Homepage“-Knopf schon, Quizzo noch nicht).
- **Lernangebote:** jedes hat sein eigenes Design aus dem Claude-Artefakt. Nicht anfassen; die schmale Leiste
  „← Lernangebote“ genügt als verbindendes Element.

### 4.3 Was kann technisch integriert werden (ohne Neuentwicklung)?
- **Gemeinsame Anmeldung:** existiert bereits. `lernen/datenbank.js` liest die Quizzo-Sitzung aus dem `localStorage`;
  die neue App kann dasselbe Konto und denselben Supabase-Client nutzen.
- **Quiz oder Abstimmung aus der Tafel starten:** Die neue App kann als angemeldete Lehrkraft `quizze` bzw.
  `kf_praesentationen` lesen und `spiel_erstellen` bzw. `kf_sitzung_starten` direkt aufrufen. Anschließend zeigt sie
  `/Quizzo/#/leiten/spiel/<id>` bzw. `/Klassenfunk/#/leiten/sitzung/<id>` in einem Fenster über der Tafel.
  Dafür ist **keine Änderung** an Quizzo oder Klassenfunk nötig.
- **QR-Code und Raumcode:** erzeugen beide Anwendungen schon selbst (`#/mitspielen?pin=…`, `#/mitmachen?pin=…`).
- **Werkzeuge als Tafel-Fenster:** Timer, Gruppen und Lautstärkeampel lassen sich zunächst per iframe einbetten
  (gleiche Herkunft, Mikrofonfreigabe bleibt möglich).
- **Lernangebote in der Bibliothek:** `lernen/angebote.js` und die Tabelle `lernangebote` sind bereits die Datenquelle;
  sie müssen nur um Metadaten erweitert werden.
- **Fragen austauschen:** Quizzo hat ein dokumentiertes Dateiformat (`quizzo-quiz`, Version 1) mit Import und Export.

### 4.4 Was muss neu entwickelt werden?
| Baustein | Spezifikation | Vorhanden |
|---|---|---|
| Hybride Tafel (Seiten- und Whiteboardmodus, Zeichenwerkzeuge, PDF-Import/-Export, Autospeichern) | 4.1–4.4 | nichts |
| Fenstersystem für Werkzeuge über der Tafel (verschieben, ein-/ausblenden) | 4.3 | nichts |
| Neue Werkzeuge: Uhr, Stoppuhr, Würfel, Arbeitsauftrag, Stundenablauf, Notizen/Post-its, QR-Code | 4.3 | Timer, Gruppen/Zufall, Lautstärkeampel |
| Klassenverwaltung (Liste, Sitzordnung, Gruppen, Kopieren, Archivieren, Klassenwechsel) | 5 | nichts (nur Namensfeld im Gruppen-Werkzeug) |
| Goodnotes-Verknüpfung, PDF-Weitergabe über das Teilen-Menü | 6 | nichts |
| Unterrichtseinheiten (Editor, Bausteine, Unterrichtsmodus) | 10 | nichts |
| Bibliothek (Tafelbilder, Vorlagen, Fragen, Materialien, Einheiten) | 3, 12 | Teile: Quizliste, Präsentationsliste, Lernübersicht, leere Materialliste |
| Gemeinsame Fragenbibliothek für Quizzo und Klassenfunk | 7, 8, 12 | nichts (getrennte Formate) |
| Ergebnisse auf die Tafel übernehmen, Export | 7, 8 | nur CSV bei Hausaufgaben |
| Designsystem mit hellem/dunklem Modus, Hauptnavigation | 3, 14 | nichts Gemeinsames |
| Automatisierte Tests für die Startseite | 13 | nur `pruefen.mjs` |

### 4.5 Wo sind Schnittstellen notwendig?
1. **Lehrraum → Supabase:** Lesen von Quizzen und Präsentationen, Starten von Sitzungen (vorhandene Funktionen).
2. **Lehrraum ↔ eingebettete Anwendung:** Nachrichten zwischen Tafel und iframe (`postMessage`), z. B.
   „Sitzung beendet“ oder „Ergebnis auf die Tafel“. Braucht je einen kleinen Zusatz in Quizzo und Klassenfunk.
3. **Einbettungsmodus:** Parameter, mit dem Werkzeuge, Quizzo und Klassenfunk Kopfzeile und Rückweg ausblenden.
4. **Klassenliste → Werkzeuge:** Zufallsschüler und Gruppengenerator beziehen Namen aus der gewählten Klasse.
5. **Fragenbibliothek ↔ Quizzo/Klassenfunk:** Umwandlung in beide Formate (Details in ARCHITECTURE.md, Abschnitt 6).
6. **Lernangebote → Bibliothek:** erweiterte Metadaten in `angebote.js` und Tabelle `lernangebote`.
7. **Tafel → Betriebssystem:** PDF über das Teilen-Menü (`navigator.share`) an Goodnotes.

### 4.6 Welche bestehenden Daten müssen migriert werden?
**Keine zwingend.** Das ist die wichtigste gute Nachricht des Audits.

| Daten | Ort | Vorgehen |
|---|---|---|
| Quizze, Fragen, Aufgaben | Supabase | bleiben unverändert; Fragenbibliothek kommt als **zusätzliche** Tabelle |
| Präsentationen, Folien | Supabase | bleiben unverändert |
| Ordnung der Lernangebote | Supabase `lernangebote` + `angebote.js` | nur **neue, optionale Spalten** (Lernziel, Schwierigkeit, Dauer, Vorschau); bestehende Zeilen bleiben gültig |
| Namenslisten im Gruppen-Werkzeug | `localStorage` des Geräts (Schlüssel `werkzeug-gruppen`, nur wenn „merken“ angehakt) | einmaliges, freiwilliges Übernehmen in eine Klasse anbieten; alter Eintrag bleibt als Rückfall |
| Einstellungen Lautstärkeampel, Sortierung Lernübersicht | `localStorage` | bleiben |
| Quizzo-Gerätedaten (Teilnahme, Wiederholung, Duell, leere Ordner) | `localStorage` | bleiben |

Jede Datenbankänderung erfolgt wie bisher als nummerierte SQL-Datei, die nur ergänzt (neue Tabellen/Spalten) und
mit PGlite getestet wird. Rückfall: Die bestehenden Anwendungen funktionieren auch ohne die neuen Tabellen weiter.

## 5. Befunde und Auffälligkeiten

**Unstimmigkeiten im Bestand (klein, sollten in Phase 1 mit bereinigt werden):**
1. `docs/PROJECT-STATUS.md` nennt 42 Lernangebote; tatsächlich sind es **41** Einträge und 41 Ordner.
2. `impressum.html` nennt „Herzfrequenz-Zonen“ noch als Werkzeug (ist seit 08.11. ein Lernangebot) und erwähnt die
   Lautstärkeampel mit Mikrofonzugriff nicht ausdrücklich.
3. Die Fußzeile der Startseite sagt „speichert nichts“. Genauer wäre: speichert nichts auf Servern; einzelne
   Werkzeuge merken sich Einstellungen auf dem Gerät.
4. Der QR-Dialog ist doppelt vorhanden (`js/app.js` und `lernen/lernen.js`) – Kandidat für ein gemeinsames Modul.
5. Quizzo hat keinen Rückweg zur Startseite, Klassenfunk schon.

**Punkte für die spätere Sicherheitsprüfung (Phase 8):**
6. Die 6-stelligen PINs für Spiele und Sitzungen werden mit `random()` erzeugt (nicht kryptografisch). Bei 6 Stunden
   Lebensdauer und anonymer Teilnahme ist das Risiko gering; ob es eine Bremse gegen massenhaftes Durchprobieren
   gibt, wurde nicht geprüft. Die Spezifikation verlangt „schwer erratbare Codes“.
7. `spiele_aufraeumen()` und `kf_aufraeumen()` laufen nur, wenn jemand ein Spiel erstellt oder beitritt; ein
   nächtlicher Cron-Job ist laut `EINRICHTUNG.md` optional. Ob er eingerichtet ist, ist nicht dokumentiert.

**Offen aus den bestehenden Projekten (unverändert gültig):**
8. Kein eigener SMTP-Server in Supabase – Einladungen und „Passwort vergessen“ funktionieren nur eingeschränkt.
9. Klassenfunk wurde noch nicht in einer echten Sitzung mit mehreren Handys erprobt.
10. Lautstärkeampel nur mit Testsignal geprüft.

## 6. Widersprüche zwischen Spezifikation und bestehenden Regeln

Diese vier Punkte brauchen eine Entscheidung, bevor die jeweilige Phase beginnt.

| Nr. | Spezifikation | Bestehende Regel | Empfehlung |
|---|---|---|---|
| W1 | Klassen mit Schülerliste, Sitzordnung, Gruppen (Abschnitt 5) | „Keine Schülerdaten“, „keine Klarnamen“ in allen drei `CLAUDE.md`; alles im Repo ist öffentlich | Namen **nur auf dem Gerät** speichern (IndexedDB), Weitergabe per Exportdatei. Synchronisation über mehrere Geräte erst später und nur verschlüsselt, nach Abstimmung mit der Schule. Niemals im Repository. |
| W2 | TypeScript, Komponenten, automatisierte Tests (Abschnitt 13) | Startseite: „kein Build-Schritt“ (`DECISIONS.md`) | Startseite bleibt ohne Build. Die neue Lehrkraft-App entsteht als eigenes Repository mit Build – wie Quizzo und Klassenfunk. |
| W3 | Ergebnisse im Unterrichtsszenario speichern (Abschnitt 8) | Spieldaten werden nach Spielende gelöscht | Nur **anonyme Zusammenfassungen** (z. B. „Frage 3: 62 % richtig“) oder ein Bild des Ergebnisses auf die Tafel übernehmen, keine Spitznamen. |
| W4 | Gemeinsame Fragenstruktur, gemeinsame Komponenten (Abschnitt 12) | Klassenfunk: „keinen Code zwischen den Repos teilen“ | Formate nicht zusammenlegen, sondern eine Bibliothek mit Umwandlern davor setzen. Die Regel bleibt gültig. |

Weitere Klärungen, kleiner:
- Abschnitt 14 nennt „vier Hauptbereiche“, Abschnitt 3 listet fünf Navigationspunkte.
- Videobausteine (Abschnitte 9, 10): Auf der Startseite gilt „nichts von fremden Servern“. Quizzo und Klassenfunk
  lösen das über `youtube-nocookie` nur auf dem Lehrkraft-Gerät; dieselbe Regel sollte für die Tafel gelten.
- „Geschützte Lehrkraftfunktionen“: Der Code auf GitHub Pages ist immer öffentlich. Geschützt werden Daten – über
  Anmeldung und Datenbankregeln –, nicht Seiten.

## 7. Risiken

| Risiko | Einschätzung | Gegenmaßnahme |
|---|---|---|
| Die Tafel ist sehr umfangreich (Zeichnen, Seiten, unendliche Fläche, PDF, Stift) | hoch | In Teilschritten liefern, jeweils im Unterricht benutzbar; siehe Roadmap Phase 2a–2d |
| Stifteingabe am iPad (Handballen, Verzögerung, Druck) ist nur am echten Gerät beurteilbar | mittel | Früh einen Zeichenprototyp am iPad erproben, bevor weitere Werkzeuge entstehen |
| Datenverlust bei Tafelbildern (nur lokal gespeichert, Browser löscht Speicher) | mittel | Autospeichern, dauerhaften Speicher anfordern, Export als Datei, später optionale Sicherung |
| Personenbezogene Daten (W1) | hoch, rechtlich | Lokal-zuerst; keine Namen auf Servern ohne Freigabe der Schule |
| Zu viele parallele Baustellen in vier Repos | mittel | Quizzo/Klassenfunk nur für kleine, einzeln testbare Schnittstellen anfassen |
| Speicher- und Verbindungsgrenzen des Supabase-Tarifs | unbekannt | Tarif und Auslastung im Dashboard prüfen, bevor Tafelbilder oder Materialien dort gespeichert werden |
| Große PDF-Dateien auf älteren Smartboards | mittel | Seitenweise rendern, Größenbegrenzung, Test mit echten Arbeitsblättern |

## 8. Entscheidungen, die für die Freigabe benötigt werden

1. **Ort der neuen App:** eigenes Repository „Lehrraum“ unter `/Lehrraum/` (empfohlen) oder Umbau der Startseite?
2. **Schülernamen (W1):** nur auf dem Gerät (empfohlen) – einverstanden?
3. **Zeichen-Technik:** eigene, schlanke Tafel mit drei kleinen Bibliotheken (empfohlen) oder fertiges Whiteboard-Paket?
4. **Startseite:** bleibt sie die Schülerseite „Lernen mit Spaß“ mit neuem Aussehen, und der Lehrkraft-Bereich liegt dahinter (empfohlen)?
5. **Farben von Quizzo und Klassenfunk:** behalten (empfohlen) oder vereinheitlichen?
6. **Reihenfolge:** wie in der Roadmap vorgeschlagen, mit früher iPad-Erprobung der Tafel?
