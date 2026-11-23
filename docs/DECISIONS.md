# Entscheidungen – Startseite kt-gymbruvi.github.io

Neue Entscheidungen oben anfügen: Datum, Entscheidung, Grund, verworfene Alternativen.

## 2026-11-23 – Gruppen & Zufall: Klassennamen auf der Startseite, Glücksrad
- **Namen aus dem Gerätespeicher, nur angemeldet.** Die Startseite liest die Namen der Klasse (Vor-/Nachname, keine Noten) direkt aus dem IndexedDB-Lager `klassen` der Lehrraum-App – lokal, nur im Speicher der Seite, nie gesendet, nie in `localStorage`. Das lockert die frühere Regel „nie die Namen lesen“ ausdrücklich nur für dieses Werkzeug (`laden({ mitNamen: true })`); Standard bleibt ohne Namen. Verworfen: Namen vom Server holen (bräuchte Entschlüsselung und das Notenbuch-Passwort), Namen in die Adresse legen (nie).
- **Ohne Anmeldung unverändert:** Eigene Namen, optional auf dem Gerät gemerkt.
- **Glücksrad: erst losen, dann drehen.** Der Zufall liegt allein in `crypto`-Auslosung; die Animation läuft nur auf das Ergebnis zu und ist daher nicht manipulierbar oder „verschieblich“. Dieselbe Rechnung in Tafel (`kern/zufall.ts`) und Startseite.
- **Rad zweimal gebaut (TS in der Tafel, JS hier):** Beide Repos haben keinen gemeinsamen Build; die Rechnung ist klein und in der Tafel getestet.

## 2026-11-18 – Eine Gestaltung für die ganze Plattform, Vorbild Tafel („wie Apple“)
- Auf Wunsch der Lehrkraft: möglichst schöne, einheitliche Oberfläche. Tafel und Notenbuch waren schon ruhig im Apple-Stil, Startseite und Lernangebote nicht (andere Schrift, sehr fett, Lernangebote noch dunkel mit Gelb). Quizzo und Klassenfunk bleiben bei ihren eigenen Farben.
- **Quelle ist `gemeinsam/tokens.css`.** Tafel (`Lehrraum/src/index.css`) und Notenbuch (`index.html`) behalten eine Kopie, weil es eigene Repos mit eigenem Build bzw. eigener Vorschau sind. Entsprechungen: `--seite` = Tafel `--umgebung` = Notenbuch `--bg`; `--flaeche` = `--leiste` / `--surface`; `--schwebe`/`--druecken` = `--leiste-2`/`--leiste-3`; `--haarlinie` = Tafel `--linie`; `--gewaehlt`, `--glas`, `--schatten`, `--schatten-hoch`, `--rund`, `--schnell`, `--fokus`, `--fehler` gleich benannt.
- Schrift: die des Geräts (SF Pro / Segoe UI Variable) statt `ui-rounded`/Nunito; Überschriften 700, Betontes 600 statt 800–900.
- Reihenfolge: Basis → Lernangebote → Startseite → Werkzeuge, alles auf dem Zweig `gestaltung-basis`, veröffentlicht erst nach Zustimmung.
- Übernommene Lernangebote laden `tokens.css` nicht (eigenes CSS des Artefakts); ihre Leiste „‹ Lernangebote“ hat deshalb feste Werte mit `!important` in `lernen/werkzeug/leiste.mjs` – die einzige Stelle mit festen Farben, entsprechend den Tokens.
- Verworfen: Tafel und Notenbuch laden `tokens.css` zur Laufzeit von der Startseite – in der lokalen Vorschau laufen sie auf anderen Ports, und ein Fehler hier würde beide Apps mit verändern.

## 2026-11-15 – Notenbuch fragt bei jedem Öffnen nach dem Passwort
- Auf Wunsch der Lehrkraft (Sicherheit am unbeaufsichtigten Gerät). Umgesetzt im Notenbuch-Repo; die Startseite fragt nach der Anmeldung weiterhin einmal je Gerät, der Schlüssel gilt aber nur noch für Tafel und „Meine Klassen“. Hinweistext im Passwort-Dialog angepasst.

## 2026-11-15 – Startseite kompakter, ohne Schnellzugriff und „Zuletzt benutzt“
- Auf Wunsch der Lehrkraft: übersichtlicher, vor allem auf dem iPad; Symbole kleiner. **Schnellzugriff und „Zuletzt benutzt“ entfallen ganz** – sie wiederholten nur, was Kacheln und Seitenleiste schon bieten. Der Geräteeintrag `lehrraum-zuletzt` wird beim Öffnen der Seite gelöscht.
- **Alles nebeneinander:** Kacheln immer in einer Reihe (Handy: drei je Reihe, nur Symbol und Titel), Werkzeuge nebeneinander mit höchstens zwei Zeilen Beschreibung (Handy: drei je Reihe), Klassen als kleine Karten in einer Reihe (Handy: zum Wischen). Die Startseite zeigt höchstens sechs Klassen, damit sie mit „Neue Klasse“ auf dem iPad hochkant in eine Reihe passen.
- Die ganze Klassenkarte führt zur Tafel der Klasse (statt eines eigenen Knopfs) – das spart Platz bei gleicher Funktion.
- Begrüßung flacher; die Tafel-Zeichnung erscheint erst ab Querformat/Rechner.

## 2026-11-12 – Veröffentlichung und Rückwege zur Startseite
- Auf Wunsch der Lehrkraft führen alle Anwendungen zur neuen Startseite „Lehrraum“ (`https://kt-gymbruvi.github.io/`), nicht mehr zu einer alten Übersicht. Da die neue Startseite unter derselben Adresse liegt wie die alte, stimmten die vorhandenen Verweise; ergänzt wurde der fehlende Rückweg in Quizzo, in Klassenfunk nur die Beschriftung („Lehrraum“ statt „Homepage – Lernen mit Spaß“).
- In Quizzo steht der Knopf bewusst nicht in den Spielansichten (Beamer, Handy im Spiel), damit ihn niemand mitten im Quiz antippt.
- Reihenfolge der Veröffentlichung: erst Lehrraum, Quizzo und Klassenfunk, dann die Startseite – so verweist die Startseite nie auf Seiten, die es noch nicht gibt.
- Der Zweig `lehrraum-phase-1` wurde ohne Umweg in `main` übernommen; weitere Arbeit wieder auf einem eigenen Zweig, veröffentlicht wird nur nach Zustimmung.

## 2026-11-12 – „Meine Klassen“ auf der Startseite
- Die Startseite zeigt angemeldeten Lehrkräften ihre Klassen mit „Zur Tafel“. Die Klassen liegen im IndexedDB-Speicher der Lehrraum-App auf dem Gerät; `gemeinsam/klassen.js` liest sie nur (gleiche Adresse), ändert nichts und schließt die Verbindung sofort.
- Anlegen und Verwalten geschieht in der Lehrraum-App – dort gibt es Tests und das Datenmodell; die Startseite bleibt ohne Build und ohne eigene Klassenlogik.
- Auf einem Gerät ohne Klassen (z. B. Schülerhandy, falls sich dort jemand anmeldete) ist die Liste leer; es wird nichts übertragen.
- Kein QR-Knopf an der Kachel „Meine Klassen“: Die Klassen gibt es nur auf dem eigenen Gerät.

## 2026-11-12 – Startseite nach dem Entwurf der Lehrkraft: Seitenleiste, Logo, Türkis, zwei Fassungen
Vorlage: Bildentwurf der Lehrkraft (Seitenleiste links, Kopfzeile mit Logo und Suche, Begrüßung, fünf Kacheln, Klassen, Schnellzugriff). Entscheidungen der Lehrkraft dazu:
- **Zwei Fassungen einer Seite:** Angemeldete Lehrkräfte sehen alles; ohne Anmeldung erscheint die schlanke Fassung (Mitmachen mit PIN, Quizzo, Klassenfunk, Lernangebote, Werkzeuge). Umgeschaltet wird über `<body data-rolle>` und `nur:` in `js/inhalte.js`. Die Seite selbst bleibt öffentlich – geschützt sind Daten, nicht Seiten.
- **Türkis ersetzt Gelb** (Farben aus dem Logo: Dunkelblau `#0a2d53`, Türkis `#2cb69c`). Für Knöpfe mit weißer Schrift gilt das kräftigere `#0f7f6c`, weil Weiß auf dem Logo-Türkis zu schwach kontrastiert. Quizzo behält sein Gelb, Klassenfunk seine Farben.
- **Logo als zugeschnittenes PNG** aus der Datei der Lehrkraft (`gemeinsam/logo.png`, `logo-klein.png`), nicht nachgezeichnet – so ist es genau das entworfene. Es hat weißen Grund und steht deshalb auch im dunklen Modus auf Weiß.
- **Weggelassen:** Glocke/Benachrichtigungen, „Unsere Vision“, „Noch mehr Möglichkeiten/Community“, Status „Aktiv“ bei Klassen – dahinter stünde keine Funktion.
- **„Zuletzt benutzt“ statt „Neuigkeiten“** (am 15.11.2026 wieder entfernt): merkt sich nur im Gerät (`lehrraum-zuletzt`, höchstens sechs Einträge), was auf der Startseite geöffnet wurde.
- **Suche läuft im Gerät** über Bereiche, Werkzeuge, alle Lernangebote (`lernen/angebote.js`) und Materialien; Quizze und Klassen noch nicht.
- **Anmeldung über `lernen/datenbank.js`** (vorhanden). Nach dem Anmelden wird die Sitzung zusätzlich unter dem Namen abgelegt, unter dem Quizzo, Klassenfunk und die Tafel sie suchen; „Abmelden“ entfernt sie dort wieder. Das Kürzel im Konto-Knopf entsteht aus der E-Mail-Adresse.
- **Begrüßungsbild ist eine eigene Zeichnung** (Tafel), kein Foto: Für das Foto im Entwurf liegt keine Datei vor, und auf einer öffentlichen Seite bräuchte es geklärte Rechte.
- **Noch nicht gebaut und deshalb „folgt“:** „Meine Klassen“ (Kachel und Seitenleiste). „Materialien“ erscheint, sobald es Materialien gibt. „Einstellungen“ ist vorerst der Umschalter hell/dunkel in der Seitenleiste; „Hilfe & Support“ fehlt.
- Die Hauptnavigation aus Etappe 1.1 (fünf Punkte oben) ist damit durch die Seitenleiste ersetzt.

## 2026-11-11 – Startseite heißt „Lehrraum“, hell und dunkel (Etappe 1.1)
- Gestaltungswerte in `gemeinsam/tokens.css`, Grundlage (Kopfleiste, Knöpfe, QR-Fenster) in `gemeinsam/grundlage.css`, Symbole als eigene SVG-Zeichnungen in `gemeinsam/symbole.js`, Umschalter in `gemeinsam/design.js`. Alles ohne Build, damit Startseite, Lernübersicht und Werkzeuge es gleich nutzen können.
- Heller Modus ist die Grundlage, dunkel folgt dem Gerät oder dem Umschalter (gemerkt nur im Gerät, `lehrraum-design`). Die Kopfleiste bleibt in beiden Modi dunkelblau.
- `style.css` bleibt unverändert, solange Lernübersicht und Werkzeuge noch nicht umgestellt sind (Etappe 1.2) – so ändert sich dort nichts.
- Navigation: Bereiche ohne Adresse (`NAVIGATION` in `js/inhalte.js`) erscheinen als „folgt“ und sind kein Link; auf dem Handy werden sie ausgeblendet. Abschaltbar über `SEITE.geplantesZeigen`.
- „Mitmachen“ mit PIN: zwei Knöpfe (Quiz / Abstimmung), weil Quizzo und Klassenfunk getrennte PINs haben. Eine gemeinsame Beitrittsseite braucht eine Datenbankfunktion (Roadmap Phase 8.1).
- Verworfen: Emojis als Symbole (sehen je nach Gerät anders aus); externe Symbol-Datei mit `<use>` (funktioniert nicht beim Öffnen per Doppelklick).

## 2026-11-11 – Ausbau zur Unterrichtsplattform: Freigabe des Audits
Grundlage: `docs/PROJECT_AUDIT.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_ROADMAP.md`. Entscheidungen der Lehrkraft:
1. Die neue Lehrkraft-App (Tafel, Unterrichten, Bibliothek) wird ein **eigenes Repository `Lehrraum`** unter `/Lehrraum/`, gleicher Stack wie Quizzo. Diese Startseite bleibt ohne Build.
2. **Schülernamen nur auf dem Gerät** (IndexedDB), Weitergabe per Exportdatei. Nie im Repository, nie auf dem Server im Klartext.
3. **Eigene Zeichenfläche** mit `perfect-freehand`, PDF.js und `pdf-lib` statt eines fertigen Whiteboard-Pakets.
4. Die Startseite ist die **Übersicht „Lehrraum“** (nicht mehr „Lernen mit Spaß“): Einstieg in die Tafeln der Klassen („Klassen zuerst“). Klassen-Kacheln erscheinen nur auf dem Gerät der Lehrkraft, Schüler sehen Mitmachen und Lernangebote. Der Name der Tafel ist noch offen.
5. **Quizzo und Klassenfunk behalten ihre Farben.**
6. Reihenfolge wie in der Roadmap: Tafel früh am iPad erproben, „Starten aus der Tafel“ vorziehen.
- Gearbeitet wird auf dem Zweig `lehrraum-phase-1`; `main` bleibt der veröffentlichte Stand.

## 2026-11-08 – Herzfrequenz-Zonen als Lernangebot statt Werkzeug
- Gehört fachlich zu Sport/Oberstufe; Werkzeuge bleiben fächerübergreifende Unterrichtshelfer (Timer, Gruppen, Lautstärkeampel).
- Alte Adresse bleibt als Weiterleitung (`meta refresh`), weil QR-Codes und Lesezeichen existieren können.

## 2026-11-08 – Lautstärkeampel rein im Browser
- Pegel per Web Audio (RMS → 0–100), Mikrofon ohne Echo-/Rauschunterdrückung und ohne automatische Verstärkung (sonst „rechnet“ der Browser laute Klassen leiser).
- Nichts aufnehmen oder senden; nur Einstellungen in `localStorage`.
- Umschalten erst nach einstellbarer Dauer (0,5/1,5/3 s), damit einzelne Geräusche nicht sofort Rot auslösen.

## 2026-11-07 – Je eine Kachel für Quizzo und Klassenfunk
- Kacheln führen auf die jeweilige App-Startseite (Wahl Mitspielen/Lehrkraft bzw. Mitmachen/Präsentieren) statt direkt zur PIN-Eingabe.
- Verworfen: getrennte Kacheln für Schüler und Lehrkraft – unübersichtlich; der QR-Code am Beamer führt ohnehin direkt zur PIN.

## Lernangebote: Ordnung in der Datenbank, Dateien im Repo
- Dateien liegen statisch im Repo (`lernen/<ordner>/`), die Einordnung kann die Lehrkraft ohne Code-Änderung im Browser anpassen (Tabelle `lernangebote` in der Quizzo-Datenbank, Lesen für alle, Ändern nur durch die Lehrkraft, der der Eintrag gehört).
- `angebote.js` bleibt Grundlage: Nur dort eingetragene Ordner werden angezeigt, die Datenbank überschreibt nur Felder. Fällt die Datenbank aus, gilt `angebote.js`.
- Anmeldung: eigene (sessionStorage) oder vorhandene Quizzo-Anmeldung (gleiche Origin).
- Bewusst kein eigenes Supabase-Projekt: Die Lehrkraft-Konten von Quizzo existieren schon.

## Claude-Artefakte übernehmen statt verlinken
- Artefakte werden heruntergeladen und lokal gehostet; Google Fonts durch lokale Schriften (`lernen/schriften/`), Bibliotheken lokal (z. B. `three.min.js`).
- Grund: Datenschutz (kein Kontakt zu fremden Servern), Unabhängigkeit vom Claude-Konto. `window.claude`-Speicher/KI-Aufrufe werden entfernt.

## Kein Build-Schritt, GitHub Pages aus dem Branch
- Reines HTML/CSS/JS, damit die Lehrkraft Inhalte direkt in `js/inhalte.js` bzw. `lernen/angebote.js` pflegen kann.
- Bewusst kein Vite/React wie bei Quizzo: Für eine Inhaltsseite wäre ein Build- und Actions-Schritt nur zusätzlicher Aufwand.

## Tafel als Gast (ohne Anmeldung)
- Ohne Anmeldung zeigt die Startseite „Tafel als Gast“ → `/Lehrraum/#/tafel?gast=1`. Der Gast arbeitet in einer eigenen, beim Start geleerten IndexedDB (`lehrraum-gast`), ohne Klassen, ohne Server-Abgleich; die Daten der Lehrkraft auf dem Gerät bleiben unberührt.
- Umgesetzt im Repo `Lehrraum` (`src/speicher/gast.ts`); dort noch nicht veröffentlicht – erst Lehrraum veröffentlichen, dann die Startseite, sonst führt der Link in die normale Tafel.

## Gemeinsame Sitzung erneuern (22.11.2026)
- `gemeinsam/sitzung.js` erneuert eine abgelaufene Supabase-Sitzung mit dem Erneuerungstoken und schreibt sie im Format von supabase-js zurück (gleicher Schlüssel wie Quizzo, Klassenfunk, Tafel). Grund: Der Zugriffstoken gilt etwa eine Stunde; wer morgens direkt die Startseite oder ein Lernangebot öffnet, wurde als Gast behandelt.
- Erneuerungstoken werden vom Server rotiert (einmal gültig, kurzes Wiederverwendungsfenster). Deshalb erneuert in einem Browser immer nur ein Tab (Web Lock `lehrraum-sitzung`), und vor dem Erneuern wird der Speicher noch einmal gelesen.
- Ist der Erneuerungstoken widerrufen oder fehlt das Netz, bleibt die gespeicherte Sitzung unverändert (Quizzo entscheidet) und die Seite zeigt die Gastfassung.
- `lernen/lehrkraft.js` lädt das Modul nur bei abgelaufener Sitzung mit Erneuerungstoken und lädt die Seite danach einmal neu (Sperre 60 s gegen Schleifen).

## Darstellungsprüfung im Browser (22.11.2026)
- `werkzeuge/darstellung.mjs` startet lokal Chrome/Edge (DevTools-Protokoll, ohne npm-Pakete), liefert die Seiten über einen Mini-Server auf 127.0.0.1 aus und misst Überlauf, Textkontrast und Konsolenfehler. Anlass: `pruefen.mjs` liest nur Quelltext und übersah unlesbare Titel und Überlauf. An der Version vor dem Sofort-Paket getestet: findet alle damaligen Fehler.
- Kontrast: unter 3:1 Fehler, 3–4,5:1 Hinweis (`--streng` macht daraus Fehler). Reine Symbole (●●●) und aus dem Bild geschobene Screenreader-Texte zählen nicht.

## Lehrkraft-Hinweise in Lernangeboten nur mit Anmeldung (21.11.2026)
- Erwartungshorizonte, Hinweise „Für Lehrkräfte“ und Lehrkraft-Ansichten erscheinen nur, wenn auf dem Gerät eine Lehrkraft angemeldet ist (gemeinsame Supabase-Sitzung oder Anmeldung der Lernübersicht). Entscheidung der Lehrkraft nach dem Audit.
- Umsetzung ohne Umbau der Artefakte: `lernen/lehrkraft.js` (im `<head>`, setzt `html.lehrkraft-an` und `window.LehrkraftAngemeldet`), `lernstil.css` blendet `.teacher` und `[data-lehrkraft]` aus. Eigene Lehrkraft-Ansichten (`#lehrkraft` in Fallakten und Lebensmittel sortieren, Inselwelt, Bosskampf) fragen `window.LehrkraftAngemeldet`.
- Nur Sichtschutz: Die Texte bleiben im Quelltext der öffentlichen Seite. Echter Schutz hieße, sie in die Datenbank (RLS) zu verlegen – derzeit nicht nötig, weil es keine Prüfungslösungen sind.
- Geprüft wird, ob eine noch gültige Sitzung im Gerät liegt (gleiche Regel wie die Startseite; zuerst ohne Ablaufprüfung gebaut, dann angeglichen, weil Gäste mit abgelaufener Sitzung die Hinweise sahen).
- Musterlösungen zu Übungsaufgaben bleiben sichtbar (Selbstkontrolle der Schüler).
- Neue Angebote: Lehrkraft-Inhalte als `<details class="teacher">` oder mit `data-lehrkraft` auszeichnen; `stil.mjs` setzt `lehrkraft.js` ein.

## Lernangebote im Stil der Startseite (21.11.2026, Zweig `lernen-neuer-stil`)
- Die übernommenen Artefakte behalten ihr eigenes `<style>`; danach lädt `lernen/lernstil.css` und überschreibt deren Farbvariablen mit den Werten der Startseite (hell, Dunkelgrün `#0f5c47`, Orange `#ff8a14`), setzt die Systemschrift und glättet dicke Ränder/harte Schatten.
- `<html data-theme="light">` schaltet den dunklen Block der Artefakte ab (vorerst nur heller Modus). Dunkel später: Attribut entfernen und passende dunkle Werte in `lernstil.css` ergänzen.
- Fachliche Farben (Blut, Organe, Zellteile, Meer, Allele, Gruppenfarben) bleiben bewusst bestehen; nur Gestaltungsfarben wurden umgestellt.
- Einsetzen/Erneuern in allen Angeboten: `node lernen/werkzeug/stil.mjs` (Angebote mit `gemeinsam/tokens.css`, z. B. Herzfrequenz-Zonen, werden übersprungen). Angebot mit dunkler 3D-Bühne: `data-ls="buehne"` (Genetiklabor 3D).
- Neu übernommene Artefakte: nach `uebernehmen.mjs` zusätzlich `node lernen/werkzeug/stil.mjs <ordner>` ausführen.
