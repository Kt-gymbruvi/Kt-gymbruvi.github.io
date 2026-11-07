# Startseite kt-gymbruvi.github.io

Einfache Startseite ohne Build-Schritt: reines HTML, CSS und JavaScript. Was im Repository liegt, ist
nach dem Push unter https://kt-gymbruvi.github.io/ erreichbar. Quizzo bleibt unter `/Quizzo/` und
wird hiervon nicht berührt.

## Inhalte ändern

Fast alles steht in **`js/inhalte.js`**:

- `SEITE` – Überschrift und Untertitel
- `LINKS` – die großen gelben Kacheln (z. B. Quizzo)
- `MATERIALIEN` – die Materialliste (Fach, Klasse, Titel, Datei, Beschreibung)

Neues Material: Datei nach `materialien/` legen (Name ohne Leerzeichen/Umlaute), Eintrag in
`MATERIALIEN` ergänzen. Jeder Eintrag bekommt automatisch einen QR-Knopf für den Beamer.

Lokal ansehen: `index.html` im Browser öffnen (Doppelklick genügt).

## Wichtig: alles ist öffentlich

- Keine Schülerdaten, keine Noten, keine Prüfungslösungen vor der Prüfung.
- Nur eigenes Material oder Material mit passender Lizenz – keine Scans aus Schulbüchern.
- Grenzen von GitHub Pages: Seite insgesamt höchstens 1 GB, einzelne Dateien unter 100 MB.

## Vor der ersten Veröffentlichung

1. Beispiel-Eintrag in `js/inhalte.js` und `materialien/beispiel-merkblatt.txt` löschen.
2. `impressum.html` ausfüllen (mit der Schulleitung klären) und den roten Entwurfs-Kasten entfernen.
3. Auf GitHub ein **öffentliches** Repository mit genau dem Namen `Kt-gymbruvi.github.io` anlegen.
4. Pushen; unter *Settings → Pages* als Quelle „Deploy from a branch“, Branch `main`, Ordner `/ (root)` wählen.

## Technik

- `js/qrcode.min.js`: gebündelte Fassung der Bibliothek [qrcode](https://github.com/soldair/node-qrcode)
  (MIT-Lizenz), damit nichts von fremden Servern geladen wird.
- `.nojekyll`: GitHub Pages liefert die Dateien unverändert aus.
