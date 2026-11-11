# Entscheidungen – Startseite kt-gymbruvi.github.io

Neue Entscheidungen oben anfügen: Datum, Entscheidung, Grund, verworfene Alternativen.

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
