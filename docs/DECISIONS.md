# Entscheidungen – Startseite kt-gymbruvi.github.io

Neue Entscheidungen oben anfügen: Datum, Entscheidung, Grund, verworfene Alternativen.

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
