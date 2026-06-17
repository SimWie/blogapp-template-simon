# Deployment-Setup: Azure Storage + GitHub Actions

Diese Anleitung richtet das automatische Deployment der Angular-App auf eine
**Azure Storage Static Website** ein. Am Ende deployt der Workflow
`.github/workflows/azure-deploy.yml` bei jedem Push auf `main` automatisch.

Der Build-Output liegt in **`dist/app/browser/`** (konfiguriert via `outputPath: "dist/app"`
in `angular.json`) — darauf ist der Workflow bereits eingestellt.

---

## Schritt 1: Storage Account anlegen

Im **Azure Portal** (`portal.azure.com`):

1. Oben nach **„Storage accounts"** suchen → **„+ Create"**.
2. Tab **Basics** ausfüllen:
   - **Subscription:** `Azure for Students`
   - **Resource group:** neu erstellen (z. B. `rg-blogapp`) oder bestehende wählen
   - **Storage account name:** z. B. `myblogapp2026`
     (nur Kleinbuchstaben + Zahlen, 3–24 Zeichen, weltweit eindeutig)
   - **Region:** eine erlaubte Region, z. B. `Poland Central`
   - **Primary service / Preferred storage type:** `Azure Blob Storage or Azure Data Lake Storage Gen 2`
     ⚠️ Wichtig: **nicht** `Azure Files` wählen — Static-Website-Hosting gibt es nur bei Blob Storage.
   - **Performance:** `Standard`
   - **Redundancy:** `LRS` (günstigste Option)
3. **„Review + create"** → **„Create"**.
4. Nach dem Deployment: **„Go to resource"**.

---

## Schritt 2: Static Website aktivieren

Im erstellten Storage Account:

1. Im linken Menü unter _Data management_ → **„Static website"**.
2. Auf **„Enabled"** schalten.
3. **Index document name:** `index.html`
4. **Error document path:** `index.html`
   ⚠️ Wichtig für Angular Client-Side-Routing: Beim direkten Aufruf eines Deep-Links
   (z. B. `/blog/123`) liefert Storage sonst 404. Mit `index.html` als Error-Dokument
   übernimmt der Angular-Router das Routing.
5. **„Save"**.

Danach erscheint oben der **Primary endpoint**, z. B.:
`https://myblogapp2026.z16.web.core.windows.net`

> Diese URL ist die öffentliche Adresse deiner App. Notiere sie dir.
> Der `$web`-Container wird durch das Aktivieren automatisch angelegt — du musst
> ihn nicht manuell erstellen.

---

## Schritt 3: Zugangsdaten (Access Key) holen

Im Storage Account:

1. Im linken Menü unter _Security + networking_ → **„Access keys"**.
2. Bei **key1** auf **„Show"** klicken.
3. Du brauchst gleich zwei Werte:
   - **Storage account name** (der Name aus Schritt 1, z. B. `myblogapp2026`)
   - **Key** (der lange Wert unter `key1` → _Key_)

> Behandle den Key wie ein Passwort. Er kommt **nicht** ins Repo, sondern nur
> in die GitHub Secrets (Schritt 4).

---

## Schritt 4: GitHub Secrets setzen

Im GitHub-Repository (`rudini/blogapp-template`):

1. **Settings** (oben im Repo) → links **Secrets and variables** → **Actions**.
2. Tab **Secrets** → **„New repository secret"**.
3. Erstes Secret anlegen:
   - **Name:** `STORAGE_ACCOUNT_NAME`
   - **Secret:** der Account-Name aus Schritt 3 (z. B. `myblogapp2026`)
   - **„Add secret"**
4. Zweites Secret anlegen:
   - **Name:** `STORAGE_ACCOUNT_KEY`
   - **Secret:** der Key-Wert aus Schritt 3
   - **„Add secret"**

Beide Namen müssen **exakt** so heißen — der Workflow referenziert sie als
`${{ secrets.STORAGE_ACCOUNT_NAME }}` und `${{ secrets.STORAGE_ACCOUNT_KEY }}`.

---

## Schritt 5: Deployment auslösen & prüfen

Der Workflow läuft automatisch bei jedem Push auf `main`. Manuell auslösen:

1. GitHub → **Actions** → Workflow **„Deploy to Azure Storage"** auswählen.
2. **„Run workflow"** → Branch `main` → **„Run workflow"**.
3. Den Lauf öffnen und die Schritte beobachten. Erfolgreich, wenn
   _„Upload to Azure Storage ($web)"_ grün ist.
4. Die App im Browser unter dem **Primary endpoint** aus Schritt 2 öffnen.

---

## Troubleshooting

- **`AuthorizationFailure` / Login-Fehler beim Upload:** Account-Name oder Key falsch.
  Secrets in Schritt 4 prüfen (kein Leerzeichen, kompletter Key kopiert).
- **Seite lädt, aber Deep-Links geben 404 (Statuscode):** Das ist bei Storage normal —
  die App rendert trotzdem korrekt, da `index.html` als Error-Dokument ausgeliefert wird.
  Sicherstellen, dass **Error document path = `index.html`** gesetzt ist (Schritt 2).
- **Alte Version wird angezeigt:** Browser-Cache leeren. Der Workflow räumt vor jedem
  Upload alte Dateien im `$web` auf (`delete-batch`), daher sollten keine veralteten
  Bundles übrig bleiben.
- **Workflow startet nicht:** Prüfen, dass die Änderungen auf dem Branch `main` liegen
  (der Workflow triggert auf `push` nach `main`).

---

## Hinweis zu den GitHub Actions

- **`azure-deploy.yml`** — baut und deployt (diese Anleitung).
- **`ci-build.yml`** — bleibt unverändert: lint, Unit-Tests, Build und E2E-Tests bei
  Push/PR. Deployt nichts — die saubere Trennung von CI (Testen) und CD (Deployen)
  ist gewollt.
