# Zielarchitektur – Digitale Unterrichtsplattform

Stand: 11.11.2026 · Vorschlag zur Freigabe, Teil des Repository-Audits ([PROJECT_AUDIT.md](PROJECT_AUDIT.md))

Alles in diesem Dokument ist ein **Vorschlag**. Nichts davon ist gebaut. Stellen, an denen eine Entscheidung der
Lehrkraft nötig ist, sind mit **Entscheidung** markiert.

## 1. Leitlinien

1. **Bestehendes läuft weiter.** Quizzo, Klassenfunk, Lernangebote und Werkzeuge behalten ihre Adressen, ihre Daten
   und ihren Code. Neues kommt daneben, nicht anstelle.
2. **Eine Herkunft, mehrere Anwendungen.** Alles liegt unter `kt-gymbruvi.github.io`. Dadurch teilen sich die
   Anwendungen die Anmeldung und können einander einbetten.
3. **Lokal zuerst.** Tafelbilder und Klassenlisten liegen auf dem Gerät der Lehrkraft. Der Server sieht nur, was er
   für Live-Sitzungen und geräteübergreifende Inhalte braucht.
4. **Ein Stack.** Die neue App nutzt dieselbe Technik wie Quizzo und Klassenfunk – keine neue Technologie, die
   gepflegt werden muss.
5. **Kein eigener Server.** Weiterhin nur GitHub Pages und Supabase.

## 2. Gesamtbild

```
https://kt-gymbruvi.github.io/
│
├─ /                      Startseite          bleibt statisch (HTML/CSS/JS), neues Aussehen, Hauptnavigation
├─ /lernen/               Lernangebote        bleibt; Metadaten erweitert
├─ /werkzeuge/            Werkzeuge           bleiben; zusätzlich kompakte Einbettungsansicht
├─ /gemeinsam/            NEU, klein          Design-Tokens (CSS), Navigationsleiste, QR-Dialog – ohne Build
│
├─ /Lehrraum/             NEU, eigenes Repo   Vite + React + TypeScript + Tailwind
│     #/tafel               Hybride Tafel mit Werkzeugleisten und Fenstern
│     #/unterrichten        Klassen, Unterrichtseinheiten, Goodnotes, Materialien
│     #/bibliothek          Tafelbilder, Vorlagen, Fragen, Materialien, Lernangebote, Einheiten
│
├─ /Quizzo/               bleibt eigenes Repo   + Einbettungsmodus, + „Auf die Tafel“
└─ /Klassenfunk/          bleibt eigenes Repo   + Einbettungsmodus, + „Auf die Tafel“

Gerät der Lehrkraft (IndexedDB)            Supabase (bestehendes Projekt, Frankfurt)
  Tafelbilder, Seiten, Bilder                Auth: Lehrkraft-Konten (unverändert)
  Klassen mit Namen, Sitzordnung             Quizzo-Tabellen, kf_-Tabellen, lernangebote (unverändert)
  Entwürfe, Einstellungen                    NEU mit Präfix lr_: Einheiten, Fragenbibliothek, Material-Verweise
```

### Zuordnung der Hauptnavigation
| Navigationspunkt | Ziel | Zielgruppe |
|---|---|---|
| Tafel | `/Lehrraum/#/tafel` | Lehrkraft |
| Unterrichten | `/Lehrraum/#/unterrichten` | Lehrkraft |
| Interaktion | Übersichtsseite mit Quizzo, Klassenfunk, Fragenbibliothek, laufenden Sitzungen | Lehrkraft und Schüler (Mitmachen) |
| Lernen | `/lernen/` | Schüler und Lehrkraft |
| Bibliothek | `/Lehrraum/#/bibliothek` | Lehrkraft |

**Entscheidung 1 – Ort der neuen App.** Empfohlen: eigenes Repository `Lehrraum`.

| | A: eigenes Repo `Lehrraum` (empfohlen) | B: Startseite auf Build umstellen | C: Tafel ohne Build in der Startseite |
|---|---|---|---|
| Bestehende Startseite | unberührt, Regel „kein Build“ bleibt | Deploy-Verfahren ändert sich, 41 Lernangebote müssen durch den Build | unberührt |
| TypeScript, Tests, Komponenten | ja, wie Quizzo | ja | nein – widerspricht Abschnitt 13 der Spezifikation |
| Risiko für Bestehendes | sehr gering | mittel (ein Fehler im Build legt alles lahm) | gering |
| Aufwand Einrichtung | klein (Muster aus Quizzo) | mittel | klein |
| Eignung für eine große Tafel-App | gut | gut | schlecht (tausende Zeilen ohne Typen und Tests) |

**Entscheidung 4 – Rolle der Startseite.** Die Startseite wird von Schülern per QR-Code aufgerufen. Empfohlen: Sie
bleibt die freundliche Schülerseite „Lernen mit Spaß“ und bekommt die Hauptnavigation; die Punkte Tafel, Unterrichten
und Bibliothek führen zur Lehrkraft-Anmeldung.

## 3. Technik der neuen App „Lehrraum“

| Thema | Wahl | Grund |
|---|---|---|
| Build | Vite 8, TypeScript, React 19 | identisch zu Quizzo und Klassenfunk |
| Gestaltung | Tailwind CSS 4 mit Tokens aus `/gemeinsam/` | einheitliche Farben, heller und dunkler Modus |
| Routing | HashRouter | GitHub Pages kann keine Weiterleitungen |
| Server | `@supabase/supabase-js`, selbes Projekt, nur publishable-Schlüssel | gemeinsame Anmeldung |
| Lokaler Speicher | IndexedDB (über eine kleine eigene Schicht) | Tafelbilder sind zu groß für `localStorage` |
| Tests | Vitest, Testing Library, `fakeSupabase`, PGlite für SQL, `fake-indexeddb` | Muster aus Quizzo |
| Veröffentlichung | GitHub Actions (Tests, Build, Pages) | Muster aus Quizzo |

Ordnerstruktur (Geschäftslogik getrennt von der Oberfläche):
```
src/
  kern/          reine Logik ohne React: Datenmodelle, Versionen, Migrationen, Geometrie, Rückgängig-Stapel
  speicher/      IndexedDB, Export/Import, Supabase-Zugriff
  tafel/         Zeichenfläche, Werkzeuge, Seiten- und Whiteboardmodus, PDF
  fenster/       Fenstersystem und die einzelnen Werkzeugfenster (Uhr, Timer, Würfel …)
  unterrichten/  Klassen, Einheiten, Goodnotes
  bibliothek/    gemeinsame Sicht auf alle Inhalte
  ui/            wiederverwendbare Bausteine (Knopf, Dialog, Leiste, Symbol)
  test/
```

## 4. Die Tafel

### 4.1 Aufbau des Bildschirms
```
┌──────────────────────────────────────────────────────────────────┐
│ Kopf: Klasse ▾ · Tafeltitel · Seite 2/5 · Modus Seiten|Whiteboard │
├────┬───────────────────────────────────────────────────────┬─────┤
│ Z  │                                                       │  S  │
│ e  │              Zeichenfläche (weiß,                     │  c  │
│ i  │              wählbarer Hintergrund)                   │  h  │
│ c  │                                                       │  n  │
│ h  │        ┌────────────┐    ┌──────────┐                 │  e  │
│ e  │        │ Timer  ⨯   │    │ Notiz ⨯  │  ← Fenster      │  l  │
│ n  │        └────────────┘    └──────────┘                 │  l  │
├────┴───────────────────────────────────────────────────────┴─────┤
│ Seitenleiste unten (nur Seitenmodus): Miniaturen, +, duplizieren  │
└──────────────────────────────────────────────────────────────────┘
```
Beide Leisten sind fest sichtbar. Fenster liegen in einer eigenen Ebene über der Zeichenfläche; sie gehören nicht zum
Tafelbild, können aber als Bild darauf „abgelegt“ werden (z. B. ein Abstimmungsergebnis).

### 4.2 Ein Datenmodell für beide Modi
Seitenmodus und Whiteboardmodus unterscheiden sich nur in der **Kamera**: Im Seitenmodus zeigt sie eine feste Fläche
(z. B. A4 quer) je Seite, im Whiteboardmodus ist sie frei verschieb- und zoombar. Die Elemente sind dieselben.

```ts
type Tafelbild = {
  schema: 'lehrraum/tafel'; version: 1
  id: string; titel: string; klasseId?: string
  modus: 'seiten' | 'whiteboard'
  hintergrund: { art: 'weiss' | 'kariert' | 'liniert' | 'punkte' | 'dunkel' | 'bild'; bildId?: string }
  seiten: Seite[]                    // Whiteboard: genau eine Seite ohne Grenzen
  geaendertAm: string
}
type Seite = { id: string; breite?: number; hoehe?: number; pdfSeite?: { dateiId: string; nr: number }; elemente: Element[] }
type Element =
  | { art: 'strich'; id; punkte: [x, y, druck][]; farbe; staerke; werkzeug: 'stift' | 'marker' }
  | { art: 'text';   id; x; y; breite; text; groesse; farbe }
  | { art: 'form';   id; form: 'rechteck' | 'ellipse' | 'linie' | 'pfeil' | 'dreieck'; x; y; b; h; farbe; fuellung?; staerke }
  | { art: 'bild';   id; x; y; b; h; dateiId }
  | { art: 'gruppe'; id; kinder: string[] }
```
Bilder und PDF-Dateien liegen getrennt als Binärdaten in IndexedDB und werden über `dateiId` verknüpft.
Rückgängig/Wiederholen arbeitet auf Befehlen (hinzufügen, ändern, löschen), nicht auf Bildschirmkopien.

### 4.3 Zeichen-Technik
**Entscheidung 3.** Empfohlen: eigene, schlanke Zeichenfläche auf Canvas mit drei kleinen, lokal eingebundenen
Bibliotheken.

| Aufgabe | Bibliothek | Lizenz |
|---|---|---|
| Druckempfindliche, geglättete Striche | `perfect-freehand` | MIT |
| PDF importieren (Seiten als Hintergrund) | `pdfjs-dist` (Mozilla PDF.js) | Apache 2.0 |
| PDF exportieren | `pdf-lib` | MIT |

Alternativen und warum nicht:
- **Excalidraw** (MIT): fertiges Whiteboard, aber handgezeichneter Stil, kein Seitenmodus, keine PDF-Annotation,
  eigene Werkzeugleisten, die sich schwer durch die geforderten festen Leisten ersetzen lassen.
- **tldraw:** sehr leistungsfähig, aber nach meinem Kenntnisstand für den Produktiveinsatz lizenzpflichtig bzw. mit
  Pflicht-Wasserzeichen. Müsste vor einer Entscheidung aktuell geprüft werden.
- **Konva / Fabric.js:** allgemeine Canvas-Bibliotheken; nehmen Arbeit beim Auswählen und Verschieben ab, bringen
  aber kein Seiten- oder Stiftkonzept mit. Bleibt als Ausweichmöglichkeit, falls die eigene Auswahl-Logik zu
  aufwendig wird.

Alle Bibliotheken werden über npm in das Paket gebaut – es wird nichts von fremden Servern geladen.

### 4.4 Eingabe
- **Pointer Events** für Maus, Finger und Stift in einem Verfahren. `pointerType === 'pen'` liefert `pressure`
  (Apple Pencil in Safari auf dem iPad, Stifte an Windows-Smartboards). Wo kein Druck gemeldet wird, gilt eine
  feste Strichstärke.
- Wenn ein Stift erkannt wurde, zeichnen Finger nicht mehr, sondern verschieben und zoomen (Handballen-Schutz).
- Zwei Finger: verschieben und zoomen. Tastaturkürzel für alle Werkzeuge, Rückgängig, Seitenwechsel.
- **Nicht verfügbar im Browser:** Doppeltipp am Apple Pencil, Squeeze, Barrel Roll. Schweben (Hover) nur auf
  neueren Geräten. Das ist eine Einschränkung der Plattform, keine Frage des Aufwands.

### 4.5 Speichern und Wiederherstellen
- Automatisch nach jeder Änderung (gebündelt, etwa jede Sekunde) in IndexedDB.
- Beim Start: zuletzt geöffnetes Tafelbild wird wiederhergestellt.
- `navigator.storage.persist()` anfordern, damit der Browser den Speicher nicht selbstständig leert.
- Manuell: „Speichern unter“ in die Bibliothek, Export als Datei (`.tafel.json` mit eingebetteten Bildern) und als PDF.
- **Grenze:** Safari auf dem iPad kann lokale Daten von Webseiten löschen, die lange nicht besucht wurden. Deshalb
  regelmäßiger Hinweis auf Export; eine Sicherung auf dem Server ist als spätere Ausbaustufe vorgesehen (Abschnitt 7).

### 4.6 Fenster über der Tafel
Ein Fenster ist ein verschiebbarer, in der Größe veränderbarer Rahmen mit Titel, Einklappen und Schließen. Position
und Zustand werden pro Tafelbild gemerkt.

| Fenster | Umsetzung |
|---|---|
| Uhr, Stoppuhr, Würfel, Arbeitsauftrag, Stundenablauf, Notiz/Post-it, QR-Code | neu, als React-Komponenten in `Lehrraum` |
| Timer, Lautstärkeampel | zunächst das bestehende Werkzeug per iframe (`?einbettung=1`), später bei Bedarf als Komponente |
| Zufallsschüler, Gruppengenerator | neu als Komponente, weil sie die Klassenliste brauchen; die Auslose-Logik wird aus `werkzeuge/gruppen/` übernommen |
| Quizzo, Klassenfunk | iframe auf die bestehende Anwendung (gleiche Herkunft, gleiche Anmeldung) |
| Lernangebote | Auswahl aus der Bibliothek, Anzeige per iframe |

Die bestehenden Werkzeugseiten bleiben unter ihren Adressen erreichbar.

## 5. Datenhaltung

### 5.1 Was liegt wo
| Daten | Ort | Begründung |
|---|---|---|
| Tafelbilder, eingefügte Bilder, importierte PDFs | Gerät (IndexedDB) | groß, können Schülerarbeiten oder Namen zeigen |
| Klassen: Bezeichnung, Fach, Jahrgang, Goodnotes-Link, Verweise auf Quizze/Lernangebote/Einheiten | Gerät; **optional** Supabase | keine personenbezogenen Daten |
| Schülernamen, Sitzordnung, Gruppen | **nur Gerät** | personenbezogen (Audit W1) |
| Unterrichtseinheiten | Supabase (`lr_einheiten`), Entwürfe lokal | sollen auf iPad und PC verfügbar sein, enthalten keine Schülerdaten |
| Fragenbibliothek | Supabase (`lr_fragen`) | gemeinsame Quelle für Quizzo und Klassenfunk |
| Materialien | Verweise (Adresse, Titel, Fach); Dateien im Repo unter `materialien/` oder später privater Storage-Bucket | öffentliche Materialien bleiben statisch |
| Live-Sitzungen | unverändert in Quizzo/Klassenfunk | keine zweite Sitzungsverwaltung |

**Entscheidung 2 – Schülernamen.** Stufenmodell:
1. **Stufe 1 (empfohlen für den Start):** nur auf dem Gerät. Übertragung auf ein zweites Gerät per Exportdatei.
2. **Stufe 2 (später, optional):** Synchronisation, bei der die Daten **im Browser verschlüsselt** werden (Web Crypto,
   Schlüssel aus einem Kennwort der Lehrkraft). Supabase speichert nur unlesbare Daten.
3. **Nicht empfohlen:** Namen im Klartext in Supabase. Technisch mit RLS absicherbar, rechtlich aber eine
   Auftragsverarbeitung, die die Schule freigeben müsste.

In keinem Fall gelangen Namen in ein Repository, in eine Adresse oder in einen QR-Code.

### 5.2 Versionierte Datenmodelle
Jedes gespeicherte Objekt trägt `schema` und `version`. Beim Laden prüft eine Migrationskette (`v1 → v2 → …`), ob
umgewandelt werden muss; vor einer Umwandlung bleibt die alte Fassung als Kopie erhalten (Rückfall).

```ts
type Klasse = {
  schema: 'lehrraum/klasse'; version: 1
  id: string; bezeichnung: string; fach: string; jahrgang: string
  archiviert: boolean
  schueler: { id: string; name: string; aktiv: boolean }[]          // nur lokal
  sitzordnung?: { spalten: number; reihen: number; plaetze: (string | null)[] }
  gruppen: { id: string; name: string; mitglieder: string[] }[]
  goodnotesLink?: string
  verweise: { quizze: string[]; praesentationen: string[]; lernangebote: string[]; einheiten: string[]; tafelbilder: string[]; materialien: string[] }
  einstellungen: { hintergrund?: string; lautstaerkeGrenzen?: [number, number] }
}

type Unterrichtseinheit = {
  schema: 'lehrraum/einheit'; version: 1
  id: string; titel: string; fach: string; jahrgang: string; beschreibung: string
  bausteine: Baustein[]
}
type Baustein = {
  id: string; titel: string; beschreibung: string; minuten: number
  art: 'tafelbild' | 'klassenfunk' | 'quizzo' | 'lernangebot' | 'pdf' | 'arbeitsauftrag' | 'gruppenarbeit' | 'video' | 'reflexion'
  ziel?: { quizId?: string; praesentationId?: string; ordner?: string; tafelbildId?: string; adresse?: string }
  materialien: string[]
}

type Material = { schema: 'lehrraum/material'; version: 1; id; titel; fach; jahrgang?; art: 'datei' | 'link'; adresse: string; beschreibung? }
```
Ein Klassenwechsel in der Kopfzeile setzt: Namensliste für Zufall und Gruppen, Goodnotes-Knopf, bevorzugte
Quizze/Lernangebote/Einheiten in den Auswahllisten, zuletzt benutztes Tafelbild der Klasse.

### 5.3 Neue Tabellen in Supabase (Präfix `lr_`)
Nur ergänzend, als nummerierte SQL-Dateien im Repository `Lehrraum`, mit RLS über `besitzer_id` wie in Quizzo:

| Tabelle | Inhalt |
|---|---|
| `lr_einheiten` | `id, besitzer_id, titel, fach, jahrgang, inhalt jsonb (Bausteine), version, geaendert_am` |
| `lr_fragen` | `id, besitzer_id, typ, text, inhalt jsonb, fach, jahrgang, schlagworte text[], herkunft, version, geaendert_am` |
| `lr_materialien` | `id, besitzer_id, titel, fach, jahrgang, art, adresse, beschreibung` |
| `lernangebote` (bestehend) | **neue optionale Spalten:** `art, lernziel, schwierigkeit, dauer_min, vorschau` |

Schüler haben auf keine `lr_`-Tabelle Zugriff. Bestehende Tabellen werden nicht umgebaut.

## 6. Gemeinsame Fragenstruktur

Quizzo (`fragen`) und Klassenfunk (`kf_folien`) folgen bereits demselben Muster `typ` + `text` + `inhalt`.
Die Feldnamen unterscheiden sich aber, und beide Formate werden von der Datenbank streng geprüft. Statt sie
zusammenzulegen (riskant, widerspricht Audit W4), bekommt die Bibliothek ein eigenes Format mit zwei Umwandlern.

| Bibliothek (`lr_fragen.typ`) | → Quizzo | → Klassenfunk |
|---|---|---|
| `auswahl` (Möglichkeiten, optional richtige) | `auswahl` (mit Lösung) oder `umfrage` (ohne) | `auswahl` |
| `wahrfalsch` | `wahrfalsch` | `auswahl` mit „Ja / Nein“ |
| `freitext` (kurze Lösung) | `freitext` | – |
| `offen` | `offen` | `offen` |
| `wortwolke` | `wortwolke` | `wortwolke` |
| `reihenfolge` | `reihenfolge` (richtige Reihenfolge) | `rangfolge` (Meinung) |
| `zuordnung` | `zuordnung` | – |
| `schieberegler` | `schieberegler` | – |
| `skala`, `punkte`, `raster` | – | `skala`, `punkte`, `raster` |
| `info` | `folie` | `info` |

Übergabe an Quizzo: über das vorhandene Dateiformat `quizzo-quiz` Version 1 bzw. direkt über `quiz_speichern`.
Übergabe an Klassenfunk: über `kf_praesentation_speichern`. Beide Funktionen existieren und prüfen die Daten selbst.
Rückweg (Frage aus einem Quiz in die Bibliothek übernehmen): Lesen der eigenen Quizze ist per RLS erlaubt.

## 7. Schnittstellen zwischen den Anwendungen

| Nr. | Schnittstelle | Technik | Änderung an Bestehendem |
|---|---|---|---|
| 1 | Gemeinsame Anmeldung | Supabase-Sitzung im `localStorage` derselben Herkunft | keine |
| 2 | Quiz starten | `spiel_erstellen(quiz, modus, teams)` → Fenster mit `/Quizzo/#/leiten/spiel/<id>` | keine |
| 3 | Abstimmung starten | `kf_sitzung_starten(praesentation)` → Fenster mit `/Klassenfunk/#/leiten/sitzung/<id>` | keine |
| 4 | Einbettungsmodus | Adressparameter `einbettung=1` blendet Kopf und Rückweg aus | klein, in Werkzeugen, Quizzo, Klassenfunk |
| 5 | Ergebnis auf die Tafel | `postMessage` vom iframe an die Tafel, nur gleiche Herkunft | Knopf „Auf die Tafel“ in Quizzo und Klassenfunk |
| 6 | Sitzungsende melden | `postMessage` | klein |
| 7 | Gemeinsamer Schülerzugang | eine Beitrittsseite, die per Datenbankfunktion erkennt, zu welcher Anwendung eine PIN gehört | eine neue SQL-Funktion, liefert nur den Anwendungsnamen |

Nachrichtenformat (versioniert, Empfänger prüft `origin`):
```ts
type TafelNachricht =
  | { quelle: 'quizzo' | 'klassenfunk'; version: 1; typ: 'ergebnis'; titel: string;
      daten: { frage: string; werte: { text: string; anzahl: number }[] } }     // nur anonyme Summen
  | { quelle: 'quizzo' | 'klassenfunk'; version: 1; typ: 'beendet' }
```
Die Tafel zeichnet daraus selbst ein Diagramm als Tafelelement. Spitznamen und Einzelantworten werden nie übertragen.

## 8. Goodnotes

Goodnotes bietet keine dokumentierte Schnittstelle für Webseiten. Es wird nichts verwendet, was nicht dokumentiert ist.

| Funktion | Umsetzung |
|---|---|
| Goodnotes-Link pro Klasse | gespeicherte Adresse (z. B. ein Freigabelink), Knopf „In Goodnotes öffnen“ öffnet sie in einem neuen Tab |
| Tafelbild oder Arbeitsblatt als PDF | Export mit `pdf-lib` |
| Weitergabe an Goodnotes | Teilen-Menü des Betriebssystems über `navigator.share({ files })`; auf dem iPad erscheint dort „In Goodnotes öffnen“. Wo das Teilen von Dateien nicht unterstützt wird, normaler Download |
| Synchronisation von Schülerdokumenten | wird nicht gebaut |

## 9. Designsystem

- **Tokens** als CSS-Variablen in `/gemeinsam/tokens.css`, genutzt von Startseite, Lernübersicht, Werkzeugen und
  (als Kopie im Tailwind-Theme) von `Lehrraum`.
- **Farben:** Dunkelblau `#0b1f4d` bleibt Hauptfarbe (Kopf, Leisten, Schrift auf Hell). Arbeitsflächen Weiß und
  Hellgrau. Gelb `#ffc928` bleibt als Markenakzent.
- **Akzentfarben der Bereiche** (Vorschlag, dezent als Streifen oder Symbolfarbe): Tafel Blau · Unterrichten Grün ·
  Interaktion Koralle (nimmt Klassenfunk auf) · Lernen Gelb · Bibliothek Violett.
- **Heller und dunkler Modus:** über `prefers-color-scheme` und einen Umschalter; die Tafel selbst bleibt weiß, sofern
  kein anderer Hintergrund gewählt ist.
- **Bedienelemente:** mindestens 48 px Tippfläche, an der Tafel 56 px; Schrift systemnah (wie bisher `ui-rounded`),
  keine Schrift von fremden Servern.
- **Symbole:** ein einheitlicher Satz als eingebettete SVG-Dateien im Repository (heute werden Emojis verwendet, die
  je nach Gerät anders aussehen).
- **Animationen:** nur funktionale (Fenster ein-/ausblenden), abschaltbar über `prefers-reduced-motion`.

**Entscheidung 5.** Quizzo und Klassenfunk behalten ihre Farben (empfohlen), bekommen aber denselben Rückweg zur
Plattform.

## 10. Hosting, Grenzen, Sicherheit

- **GitHub Pages** reicht für alles Geplante: Es werden nur statische Dateien ausgeliefert. Die Größen- und
  Bandbreitengrenzen von Pages (laut GitHub-Dokumentation im Bereich 1 GB je Website bzw. 100 GB Datenverkehr pro
  Monat) werden bei weitem nicht erreicht.
- **Supabase:** bleibt einziger Serverdienst. Vor dem Speichern größerer Dateien (Materialien, Sicherungen von
  Tafelbildern) sind Tarif und Auslastung im Dashboard zu prüfen; das konnte im Audit nicht eingesehen werden.
- **Offline:** Die Tafel soll auch bei ausgefallenem WLAN funktionieren. Ein Service Worker, der die App-Dateien
  zwischenspeichert, ist in Phase 9 vorgesehen.
- **Sicherheit:** nur publishable-Schlüssel im Code; RLS auf jeder neuen Tabelle; `postMessage` nur mit geprüfter
  Herkunft; importierte Dateien (PDF, Bilder, Tafel-Dateien) werden als Daten behandelt und nie ausgeführt; keine
  Schülerdaten in Adressen.
- **Datenschutz:** Speicher- und Löschregeln werden in `impressum.html` ergänzt, sobald eine Funktion Daten speichert.

## 11. Tests

| Bereich | Verfahren |
|---|---|
| Logik (`kern/`): Datenmodelle, Migrationen, Geometrie, Rückgängig, Gruppenbildung, Umwandler der Fragen | Vitest, ohne Browser |
| Oberfläche: Klassen, Einheiten, Fenster, Bibliothek | Testing Library mit `fakeSupabase` und `fake-indexeddb` |
| SQL (`lr_`-Tabellen, RLS) | PGlite-Nachbau wie in Quizzo |
| Zeichnen, Stift, PDF | automatisiert nur eingeschränkt prüfbar – zusätzlich feste Prüfliste am iPad und am Smartboard je Phase |
| Startseite | `pruefen.mjs` erweitern: jeder Eintrag in `angebote.js` hat einen Ordner, jede Navigation ein Ziel |
