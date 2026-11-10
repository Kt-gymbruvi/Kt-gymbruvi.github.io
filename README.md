# Startseite kt-gymbruvi.github.io

Einfache Startseite ohne Build-Schritt: reines HTML, CSS und JavaScript. Was im Repository liegt, ist
nach dem Push unter https://kt-gymbruvi.github.io/ erreichbar. Quizzo bleibt unter `/Quizzo/` und
wird hiervon nicht berührt.

## Inhalte ändern

Fast alles steht in **`js/inhalte.js`**:

- `SEITE` – Überschrift und Untertitel
- `LINKS` – die großen gelben Kacheln (z. B. Quizzo)
- `WERKZEUGE` – kleine Web-Apps unter `werkzeuge/` (Timer, Gruppen & Zufall, Lautstärkeampel)
- `MATERIALIEN` – die Materialliste (Fach, Klasse, Titel, Datei, Beschreibung)

Neues Material: Datei nach `materialien/` legen (Name ohne Leerzeichen/Umlaute), Eintrag in
`MATERIALIEN` ergänzen. Jeder Eintrag bekommt automatisch einen QR-Knopf für den Beamer.

Lokal ansehen: `index.html` im Browser öffnen (Doppelklick genügt).

## Werkzeuge und Claude-Artefakte

Siehe [`werkzeuge/ANLEITUNG.md`](werkzeuge/ANLEITUNG.md). Prüfen mit `node werkzeuge/pruefen.mjs`.

## Wichtig: alles ist öffentlich

- Keine Schülerdaten, keine Noten, keine Prüfungslösungen vor der Prüfung.
- Nur eigenes Material oder Material mit passender Lizenz – keine Scans aus Schulbüchern.
- Grenzen von GitHub Pages: Seite insgesamt höchstens 1 GB, einzelne Dateien unter 100 MB.

## Vor der ersten Veröffentlichung

1. ✅ Überschrift „Lernen mit Spaß“, Beispiel-Material entfernt.
2. ✅ `impressum.html` verweist auf Impressum und Datenschutz von gymnasium-bruvi.de (OK der Schulleitung einholen).
3. Prüfen: `node werkzeuge/pruefen.mjs --veroeffentlichen` muss „Keine Probleme gefunden“ melden.
4. Auf github.com (angemeldet als **Kt-gymbruvi**) ein **öffentliches** Repository mit genau dem Namen
   `Kt-gymbruvi.github.io` anlegen – leer, ohne README.
5. Pushen; unter *Settings → Pages* als Quelle „Deploy from a branch“, Branch `main`, Ordner `/ (root)` wählen.

## Technik

- `js/qrcode.min.js`: gebündelte Fassung der Bibliothek [qrcode](https://github.com/soldair/node-qrcode)
  (MIT-Lizenz), damit nichts von fremden Servern geladen wird.
- `.nojekyll`: GitHub Pages liefert die Dateien unverändert aus.
