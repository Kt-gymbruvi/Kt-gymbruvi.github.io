# Funktionsinventar – Bestand und Abgleich mit der Spezifikation

Stand: 11.11.2026 · Teil des Repository-Audits ([PROJECT_AUDIT.md](PROJECT_AUDIT.md))

Legende für den Abgleich: ✅ vorhanden · 🟡 teilweise vorhanden · ❌ fehlt · Die Spalte „Aufwand“ schätzt grob:
S = klein (eine Etappe), M = mittel (zwei bis drei Etappen), L = groß (eigene Phase).

---

## 1. Startseite (`Kt-gymbruvi.github.io`)

### 1.1 Bestehende Funktionen
| Funktion | Ort | Anmerkung |
|---|---|---|
| Überschrift und Untertitel aus Datei | `js/inhalte.js` → `SEITE` | |
| Kacheln mit Symbol, Titel, Text (Lernangebote, Quizzo, Klassenfunk) | `LINKS`, `js/app.js` | |
| QR-Knopf an jeder Kachel, jedem Werkzeug, jedem Material – großer QR-Dialog für den Beamer | `js/app.js`, `js/qrcode.min.js` | QR wird im Browser erzeugt |
| Werkzeugliste, nach Bereich gruppiert | `WERKZEUGE` | |
| Materialliste mit Suche, Fachfilter, Dateityp-Marke, QR | `MATERIALIEN` | derzeit leer, Bereich blendet sich aus |
| Impressum und Datenschutz | `impressum.html` | verweist auf die Schule |
| Prüfskript gegen fremde Server, KI-Aufrufe, Datenversand | `werkzeuge/pruefen.mjs` | auch `--veroeffentlichen` |

### 1.2 Werkzeuge
| Werkzeug | Funktionen | Speichert |
|---|---|---|
| **Timer** | Countdown, Schnellwahl 1–20 min, Minuten/Sekunden frei, Start/Pause, Zurücksetzen, Vollbild, Signalton (Gong), Bildschirm bleibt an (Wake Lock), Tastatursteuerung | nichts |
| **Gruppen & Zufall** | Namensliste einfügen, Gruppen nach Größe, nach Anzahl, Paare, eine Person ziehen, faire Aufteilung | Namensliste nur auf Wunsch im Gerät (`werkzeug-gruppen`) |
| **Lautstärkeampel** | Mikrofonpegel als Ampel, „Ruhe messen“ zum Eichen, Grenzen einstellbar, Reaktionszeit 0,5/1,5/3 s, optionaler Warnton, Vollbild, Bildschirm bleibt an | Einstellungen im Gerät (`lautstaerkeampel`); kein Ton wird aufgenommen oder gesendet |
| Herzfrequenz (alt) | Weiterleitung auf `lernen/herzfrequenz-zonen/` | – |

### 1.3 Lernübersicht `lernen/`
| Funktion | Anmerkung |
|---|---|
| Baum Fach › Jahrgang › Thema mit Anzahl | Fächer Biologie, Sport; Klassen 5–11 und 12/13; sechs Themen |
| Suche über Titel, Text, Fach, Thema, Jahrgang | mehrere Wörter, alle müssen passen |
| Sortierung nach Jahrgang (mit Zwischenüberschriften), Name, Datum | gemerkt im Gerät (`lernen-sortierung`) |
| Auswahl steht in der Adresse (`?fach=bio&stufe=7`) | für QR-Codes am Beamer; Knopf „QR zu dieser Auswahl“ |
| QR-Code pro Angebot | |
| Bearbeitungsmodus `lernen/#bearbeiten` für die angemeldete Lehrkraft | Titel, Erklärung, Fach, Thema, Jahrgänge, Reihenfolge (↑ ↓), sichtbar/versteckt; Speichern in Supabase-Tabelle `lernangebote` |
| Anmeldung mit Quizzo-Konto oder vorhandener Quizzo-Sitzung | eigene Sitzung nur im `sessionStorage` |
| Rückfall ohne Datenbank | es gilt `lernen/angebote.js` |
| Artefakt übernehmen | `lernen/werkzeug/uebernehmen.mjs`: lokale Schriften, Leiste „← Lernangebote“, Prüfung |

---

## 2. Lernangebote (41)

Alle sind einzelne HTML-Dateien ohne Server-Kontakt, handytauglich (Viewport gesetzt), 40 von 41 mit eigener
Hell-/Dunkel-Anpassung. Technische Merkmale: **G** = speichert im Gerät · **Z** = Zeichenfläche (Canvas) ·
**D** = Druckansicht · **T** = Ton · **↓** = Datei-Download.

### Biologie (32)
| Klasse | Angebot | Art | Merkmale |
|---|---|---|---|
| 5 | Kennzeichen des Lebendigen | Schaubild zum Antippen | |
| 5 | Bestimmungsschlüssel Niedersachsen | Bestimmungshilfe, Übungsmodus, Fundliste | D |
| 5 | Vom Wolf zum Dackel – Zuchtsimulator | Simulation | |
| 5 | Versuchsplaner | Planungswerkzeug mit Protokoll | G Z D ↓ |
| 5 | Diagramm-Trainer Körpertemperatur | Übung | G |
| 6 | Das Skelett des Menschen | Schaubild und Übung | |
| 6 | Skelettvergleich Mensch und Säugetiere | Vergleich | |
| 6 | Wirbeltier oder nicht? | Sortierspiel | |
| 6 | Modell und Wirklichkeit: die Wirbelsäule | Modellkritik | |
| 6 | Federwirkung der Wirbelsäule | Erklärung und Bauanleitung | |
| 7 | Herzzyklus im Schnitt | Animation in Phasen | G Z T |
| 7 | Blut – Was schwimmt in deinem Blut? | Schaubild zum Antippen | |
| 7 | Ernährung und Verdauung | Schaubild Schritt für Schritt | |
| 7 | Fallakten Kreislauf | Fallarbeit | G |
| 7 | Herzfrequenz und Aktivität | Simulation mit eigenen Messwerten | G |
| 7 | Herz-Kreislauf-Erkrankungen | Erklärung mit Quiz | |
| 7 | Gasaustausch in der Alveole | Animation, zwei Stufen | |
| 8 | Wasserpest-Labor | Simulation | G |
| 9 | Immunsystem und Krankheitserreger | Animation in sieben Schritten | |
| 10 | Zellzyklus, Mitose und Meiose | Animation, zwei Stufen | D |
| 10, 12/13 | Gentechnik: Pro und Contra abwägen | Urteilsbildung | D |
| 12/13 | Räuber-Beute-Modell | Simulation | Z D |
| 12/13 | Enzymaktivität | Simulation mit Diagramm | |
| 12/13 | Reizweiterleitung an der Synapse | Animation in neun Schritten | D |
| 12/13 | Plasmolyse und Deplasmolyse | Simulation | D |
| 12/13 | Diffusion und Osmose am Zellmodell | Simulation | Z |
| 12/13 | Stammbaumanalyse | Werkzeug und Übung | D |
| 12/13 | Codesonne und Translation | Werkzeug und Training | |
| 12/13 | Artbildung | Erklärung | |
| 12/13 | Evolutionslabor – Populationsgenetik | Simulation | Z |
| 12/13 | Gendrift und Hardy-Weinberg | Simulation und Rechnen | |
| 12/13 | Escape Room Evolution | Lernspiel | G Z |

### Sport (9)
| Klasse | Angebot | Art | Merkmale |
|---|---|---|---|
| alle | Taktikboard | Zeichen- und Animationswerkzeug | G |
| alle | Turnierplaner | Planungswerkzeug | G D T ↓ |
| alle | Zirkeltraining-Planer | Planungswerkzeug | G D T |
| alle | Akrobatik – Pyramiden und Choreografie | Planung und Bewertung | G |
| 11, 12/13 | Herzfrequenz-Zonen | Rechner | |
| 12/13 | Leichtathletik-Rechner | Rechner | |
| 12/13 | Biomechanische Prinzipien | sechs Labore | D |
| 12/13 | Phasenanalyse | Erklärung und Übung | |
| 12/13 | Muskelkontraktion in 3D | 3D-Modell (`three.min.js` lokal) | Z |

### Abgleich mit Abschnitt 9 der Spezifikation
| Anforderung | Stand | Aufwand |
|---|---|---|
| Alle Artefakte bleiben erhalten | ✅ | – |
| Gemeinsame Bibliothek | 🟡 Lernübersicht existiert, ist aber nicht mit Quizzen, Tafelbildern, Materialien verbunden | M |
| Kategorien Biologie, Sport | ✅ | – |
| Kategorien Fachübergreifend, Simulationen, Lernspiele, Interaktive Präsentationen, Selbsttests | ❌ es gibt nur Fach, Jahrgang, Thema – keine „Art“ | S (neues Feld `art`) |
| Metadaten Titel, Beschreibung, Fach, Jahrgang, Startfunktion | ✅ | – |
| Metadaten Lernziel, Schwierigkeitsgrad, Bearbeitungszeit, Vorschau | ❌ | S für die Felder, M für 41 Vorschaubilder und Texte |
| Neue Aufgabenformen (Drag-and-drop, Lückentext, Zuordnung, interaktive Videos, Schaubilder, Escape Rooms, Lernpfade, Selbstkontrollen) | 🟡 einzelne Angebote enthalten das bereits (Sortierspiel, Escape Room, Schaubilder, Quiz); es gibt keinen Baukasten | L, erst in Phase 9 |

---

## 3. Quizzo

### 3.1 Bestehende Funktionen
**Lehrkraft**
- Anmeldung nur für eingeladene Konten; Passwort setzen/ändern über Einladungs- oder Reset-Link.
- „Meine Quizze“: Ordner und Unterordner (Baum, Brotkrumen), Suche, Sortierung (zuletzt bearbeitet, zuletzt gespielt,
  Name), Kopieren, Löschen, Import und Export als JSON (`quizzo-quiz`, Version 1).
- Editor: zehn Fragetypen, Punkte pro Frage (keine, normal, doppelt), Zeitlimit 5–240 s, Schwierigkeit
  (leicht, mittel, schwer), Medium pro Frage (Bild, Audio, Video hochladen oder YouTube, optional Ausschnitt).

| Fragetyp | Interner Name | Punkte |
|---|---|---|
| Multiple Choice (2–6 Antworten, eine oder mehrere richtig) | `auswahl` | ja |
| Richtig/Falsch | `wahrfalsch` | ja |
| Freitext (bis 10 akzeptierte Lösungen) | `freitext` | ja |
| Sortieren (3–6 Elemente) | `reihenfolge` | ja |
| Zuordnung (2–6 Paare, Teilpunkte) | `zuordnung` | ja |
| Schieberegler (Zahl schätzen) | `schieberegler` | ja |
| Umfrage | `umfrage` | nein |
| Wortwolke | `wortwolke` | nein |
| Offene Frage | `offen` | nein |
| Präsentationsfolie | `folie` | nein |

**Live-Spiel**
- PIN (6 Ziffern) und QR-Code, Lobby, Countdown, Auswertung je Frage, Endstand mit Rangliste.
- Modi: klassisch und Team (2–6 Teams, Durchschnittswertung, Umsetzen in der Lobby).
- Turnier: weitere Runde mit anderem Quiz, Punkte laufen weiter.
- Wieder-Einsteigen nach „Zurück“ (Teilnahme im Gerät gemerkt).
- Beamer und Handy ohne Scrollen.

**Aufgaben ohne Live-Spiel**
- Selbstlernen (anonym, beliebig oft, Lösung nach jeder Frage).
- Hausaufgabe (Spitzname, Frist bis 14 Tage, Ergebnistabelle, CSV-Export, automatische Löschung).
- Prüfung (1–60 Pseudonym-Codes zum Ausdrucken, keine Lösungen auf dem Handy, Löschung nach spätestens 30 Tagen).
- Optionales Zeitlimit pro Frage.

**Weitere**
- Wiederholung falsch beantworteter Fragen, nur im Schülergerät (max. 50, 30 Tage).
- Klassen-Duell im Jeopardy-Stil (2–6 Quizze als Kategorien, 2–6 Teams, nur am Beamer), optional Buzzer mit einem
  Handy pro Team.

### 3.2 Abgleich mit Abschnitt 8 der Spezifikation
| Anforderung | Stand | Aufwand |
|---|---|---|
| Live-Quiz, Einzelmodus, Teammodus | ✅ | – |
| Zeitbegrenzung, Punktesystem, Ranglisten | ✅ | – |
| Multiple Choice, Wahr-Falsch, Zuordnungsaufgaben | ✅ | – |
| Bilderfragen | 🟡 Bild zur Frage am Beamer; Bilder als Antworten und Bilder auf dem Handy fehlen (steht im Quizzo-Fahrplan als Idee) | M |
| Lernmodus ohne Zeitdruck | ✅ Selbstlernen | – |
| Auswertung | ✅ | – |
| Wiederholung falscher Antworten | ✅ | – |
| Quizbibliothek | ✅ „Meine Quizze“ mit Ordnern | – |
| Quiz direkt aus der Tafel starten | ❌, aber ohne Änderung an Quizzo machbar (vorhandene Funktion `spiel_erstellen`) | S |
| QR-Code und Raumcode | ✅ | – |
| Quizfragen aus Lernangeboten erstellen | ❌ Lernangebote haben keine maschinenlesbaren Fragen | M, von Hand je Angebot |
| Gemeinsame Fragenbibliothek | ❌ | M |
| Ergebnisse im Unterrichtsszenario speichern | ❌ widerspricht der Löschregel – nur anonym möglich (Audit W3) | S–M |
| Eigene Spielmechaniken und Grafiken | ✅ eigener Name, eigenes Design | – |

---

## 4. Klassenfunk

### 4.1 Bestehende Funktionen
**Lehrkraft**
- Anmeldung mit dem Quizzo-Konto; Präsentationen anlegen, bearbeiten, kopieren, löschen.
- Sitzung am Beamer: PIN und QR-Code, Abstimmung öffnen/schließen, Ergebnisse zeigen/verbergen, unpassende
  Antworten ausblenden, Folien vor und zurück, Beenden löscht alles.

| Folientyp | Interner Name | Ergebnisdarstellung |
|---|---|---|
| Wortwolke (1–3 Begriffe pro Person) | `wortwolke` | Wolke, häufige Begriffe groß |
| Umfrage (Einfach- oder Mehrfachauswahl, 2–8 Möglichkeiten) | `auswahl` | Balken |
| Offene Frage (20–280 Zeichen) | `offen` | Karten |
| Skala 1–5 (bis 6 Aussagen) | `skala` | Durchschnitt und Verteilung |
| Rangfolge (2–8 Begriffe) | `rangfolge` | Durchschnittsplatz |
| 100 Punkte verteilen | `punkte` | Durchschnitt pro Möglichkeit |
| 2×2-Raster | `raster` | Einzelpunkte und Mittelwert auf zwei Achsen |
| Fragen der Klasse (mit 👍, beantwortet/ausblenden) | `fragen` | Liste, meistgewünschte oben |
| Info-Folie (Text, optional Bild oder YouTube) | `info` | Text und Medium je eine Hälfte |

**Schüler**
- Beitritt nur mit PIN, kein Name. Antworten änderbar. Reaktionen (sechs Emojis) und Tempo-/Verständnis-Barometer
  über Echtzeit-Nachrichten, nichts davon wird gespeichert.

### 4.2 Abgleich mit Abschnitt 7 der Spezifikation
| Anforderung | Stand | Aufwand |
|---|---|---|
| Multiple Choice | ✅ `auswahl` | – |
| Ja/Nein | 🟡 als Umfrage mit zwei Möglichkeiten machbar; kein eigener Typ, keine Vorlage | S (Vorlage im Editor) |
| Offene Fragen | ✅ | – |
| Wortwolken | ✅ | – |
| Skalen | ✅ | – |
| Rankings | ✅ `rangfolge` | – |
| Priorisierungen | ✅ `punkte` (100 Punkte verteilen) | – |
| Pro-Contra | ❌ | M (neuer Folientyp: SQL, Editor, Handy, Ergebnis, Tests) |
| Anonyme Abstimmungen | ✅ grundsätzlich anonym | – |
| Live-Ergebnisse | ✅ | – |
| Diagramme | ✅ Balken, Verteilung, Raster, Wolke | – |
| Direkt aus der Tafel starten | ❌, aber ohne Änderung an Klassenfunk machbar (`kf_sitzung_starten`) | S |
| QR-Code automatisch erzeugen | ✅ | – |
| Ergebnisse auf die Tafel übernehmen | ❌ | M (Schnittstelle in Klassenfunk + Tafel) |
| Ergebnisse exportieren | ❌ (im Klassenfunk-Fahrplan als Idee) | S–M |
| Fragen speichern und wiederverwenden | 🟡 Präsentationen sind dauerhaft und kopierbar; einzelne Folien nicht | M (mit Fragenbibliothek) |

---

## 5. Schülerzugang (Abschnitt 11)

| Anforderung | Quizzo | Klassenfunk | Anmerkung |
|---|---|---|---|
| Sitzung auf Knopfdruck | ✅ | ✅ | |
| QR-Code scannen, ohne Registrierung beitreten | ✅ PIN + Spitzname | ✅ nur PIN | |
| Live-Ergebnisse am Lehrkraftbildschirm | ✅ | ✅ | |
| Zeitlich begrenzte Sitzungen | ✅ 6 h | ✅ 6 h | Aufgaben: Fristen bis 14 bzw. 30 Tage |
| Zufällige, schwer erratbare Codes | 🟡 6 Ziffern, `random()` | 🟡 6 Ziffern, `random()` | Aufgaben-Codes: 6 Zeichen aus 32; siehe Audit, Befund 6 |
| Keine personenbezogenen Daten in Adressen | ✅ nur PIN | ✅ nur PIN | |
| Keine Schülerregistrierung | ✅ | ✅ | |
| Zugriffskontrolle | ✅ RLS, Token, security definer | ✅ | |
| Automatische Bereinigung | ✅ beim nächsten Aufruf; Cron optional | ✅ | siehe Audit, Befund 7 |
| **Gemeinsamer** Zugang für alle Anwendungen | ❌ zwei getrennte PIN-Eingaben | | S: eine Beitrittsseite, die anhand der PIN weiterleitet (braucht eine kleine neue Datenbankfunktion) |

---

## 6. Neue Bereiche – was es heute schon gibt

| Spezifikation | Heute vorhanden | Fehlt |
|---|---|---|
| **Tafel** (4.1, 4.2, 4.4) | nichts | alles |
| **Rechte Leiste** (4.3): Uhr | – | neu |
| Timer | ✅ als eigene Seite | Fensterdarstellung |
| Stoppuhr | – | neu |
| Zufallsschüler | ✅ „Eine Person ziehen“ | Anbindung an Klassenliste, Fenster |
| Gruppengenerator | ✅ | Anbindung an Klassenliste, Fenster |
| Würfel | – | neu |
| Lautstärkeampel | ✅ | Fensterdarstellung |
| Arbeitsauftrag | – | neu |
| Stundenablauf | – | neu |
| QR-Code | ✅ als Dialog auf Startseite und Lernübersicht | frei wählbare Adresse, Fenster |
| Klassenfunk, Quizzo, Lernangebote | ✅ als eigene Anwendungen | Start aus der Tafel, Fenster |
| Notizen / Post-its | – | neu |
| **Klassenverwaltung** (5) | nur ein Namensfeld im Gruppen-Werkzeug | alles |
| **Goodnotes** (6) | – | Link pro Klasse, PDF-Export, Teilen-Menü |
| **Unterrichtseinheiten** (10) | – | alles |
| **Bibliothek** (3) | Quizliste, Präsentationsliste, Lernübersicht, leere Materialliste – getrennt | gemeinsame Sicht |
| **Design** (14): heller und dunkler Modus | Startseite nur dunkel; Lernangebote überwiegend beides | Designsystem |
| **Tests** (13) | Quizzo 282, Klassenfunk 32, Startseite 0 | Tests für alles Neue |
