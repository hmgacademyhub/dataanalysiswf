# Deployment guide — Data Analysis Workflow Hub v7.0

The hub is a static website. There is **no server**, **no build step**, **no environment variable** required to make the platform work end-to-end. Any static host serves it.

The repository this guide targets:
**`https://github.com/hmgacademyhub/dataanalysiswf`** → published at **`https://hmgacademyhub.github.io/dataanalysiswf/`**

The same files can also be deployed to Netlify, Vercel, Cloudflare Pages, Render, or even served from a local folder.

---

## Option A — GitHub Pages (recommended; what you already use)

### A1. Replace the existing repo contents

```bash
# 1.  Clone the existing repo
git clone https://github.com/hmgacademyhub/dataanalysiswf.git
cd dataanalysiswf

# 2.  Move the entire contents of THIS `data/` folder into the repo root,
#     overwriting old files (do not copy the folder itself, copy its contents).
#     On macOS/Linux:
rm -rf ./*                          # be sure you have a backup branch first
cp -R /path/to/data/. ./            # the trailing /. copies hidden files too

# 3.  Verify the page list
ls
# Expect: index.html, clean.html, etl.html, pivot.html, dashboard.html,
#         sql.html, analyst.html, forecast.html, viz.html, report.html,
#         governance.html, brand.html, learn.html, settings.html,
#         sw.js, manifest.json, robots.txt, sitemap.xml,
#         css/, js/, icons/, sample-data/, docs/

# 4.  Commit and push
git add -A
git commit -m "v7.0 Enterprise — bug fixes, IndexedDB, modeller, forecast, governance"
git push origin main
```

### A2. Enable GitHub Pages

1. Open `https://github.com/hmgacademyhub/dataanalysiswf` in the browser.
2. Click **Settings → Pages** (left sidebar).
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. **Branch**: `main`. **Folder**: `/(root)`. Click **Save**.
5. Wait 30–90 seconds. A green banner appears with your URL:
   `https://hmgacademyhub.github.io/dataanalysiswf/`

### A3. Verify the deploy

1. Open the URL in a fresh incognito window.
2. Click **Upload dataset** → pick any CSV → confirm the active-file badge appears.
3. Navigate **Clean → ETL → Pivot → Dashboard → SQL → Modeller → Report**. Each page should show the same dataset.
4. Open DevTools → Application → Storage → IndexedDB. You should see a database **`DAWF_DB_v7`** with stores for `state`, `history`, `datasets`, `queries`, `recipes`, `audit`.

### A4. (Optional) custom domain

In **Settings → Pages → Custom domain**, enter e.g. `analytics.hmgacademyhub.com`. Add a CNAME DNS record pointing to `hmgacademyhub.github.io`. Tick **Enforce HTTPS**.

### A5. Forcing a hard-refresh after redeploy

Because of the service worker, returning users may see the old cached shell for one extra visit. Bump the cache version in `sw.js`:

```js
const CACHE = "dawf-shell-v7.0.1"; // bump on every release
```

---

## Option B — Netlify

### Drag-and-drop deploy (60 seconds)

1. Visit <https://app.netlify.com/drop>.
2. Drag the entire `data/` folder into the browser.
3. Netlify uploads and gives you a `https://<random>.netlify.app` URL.

### Git-driven deploy (better)

1. Push the repo to GitHub (as in Option A1).
2. Netlify → **Add new site → Import from Git → GitHub → choose `dataanalysiswf`**.
3. Build command: *(empty)*. Publish directory: `/` (root). Click **Deploy**.

---

## Option C — Vercel

```bash
npm i -g vercel
cd /path/to/data
vercel --prod
```

When prompted for build commands, accept the defaults (none). Vercel will detect a static site and serve it from `https://<project>.vercel.app/`.

---

## Option D — Cloudflare Pages

1. Cloudflare dashboard → **Pages → Create a project → Connect to Git** → choose `dataanalysiswf`.
2. Framework preset: **None**. Build command: *(empty)*. Build output: `/`.
3. Deploy.

---

## Option E — Self-host (Nginx / Apache / Caddy)

Copy the contents of `data/` to your web-root (e.g. `/var/www/html`). No further configuration is required because there is no backend.

Nginx snippet:

```nginx
server {
  listen 80;
  server_name analytics.example.com;
  root /var/www/dawf;
  index index.html;
  try_files $uri $uri/ /index.html;

  # Long-cache versioned assets (bump filenames or service-worker CACHE token on release)
  location ~* \.(css|js|png|svg|webp)$ {
    add_header Cache-Control "public,max-age=31536000,immutable";
  }
}
```

Caddyfile snippet:

```caddy
analytics.example.com {
  root * /var/www/dawf
  file_server
  encode gzip zstd
}
```

---

## Option F — Local-only (zero hosting)

Because nothing requires a server, you can:

```bash
cd /path/to/data
python3 -m http.server 8000
# or:
npx serve
```

then open <http://localhost:8000>. This is the recommended way to develop and demo offline.

---

## Search-engine indexing

1. After deployment, visit Google Search Console: <https://search.google.com/search-console>.
2. Add your domain (`hmgacademyhub.github.io/dataanalysiswf/` for project sites you must add the **prefix** version: `https://hmgacademyhub.github.io/dataanalysiswf/`).
3. Verify ownership (DNS or HTML tag — for GitHub Pages, easiest is **HTML tag**: copy the meta line into the `<head>` of `index.html`).
4. Submit `sitemap.xml`.
5. Optional: also add the site to <https://www.bing.com/webmasters>.

All pages already include:
* `<meta name="description">` with descriptive copy.
* `<link rel="canonical">`.
* Open Graph (`og:title`, `og:description`, `og:image`, `og:url`).
* Twitter Card.
* JSON-LD `SoftwareApplication` structured data on `index.html`.
* `robots.txt` allowing all.
* `sitemap.xml` enumerating every page.

---

## Updating in future

1. Edit files locally.
2. Test by opening `index.html` via `python3 -m http.server 8000`.
3. Bump the service-worker cache version in `sw.js`.
4. `git add -A && git commit -m "feat: …" && git push`.
5. Pages auto-rebuilds in ~60 seconds.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Cannot upload dataset" — alert appears with no file | Was caused by the old `localStorage` quota error. v7 uses IndexedDB. If you still see this, you may be on the cached old service-worker — open DevTools → Application → Service Workers → **Unregister**, then hard-refresh (Ctrl+Shift+R). |
| Sandbox buttons don't load anything | v6 had stub handlers. v7 generates the data in-browser; if buttons still look inert, check DevTools console for script errors and ensure `js/core.js` loaded. |
| Charts blank | `Chart.js` is loaded async with `defer`. The page waits for it. If on a strict CSP, allowlist `cdn.jsdelivr.net`. |
| Google Sheet sync fails | Ensure the sheet is shared **Anyone with the link → Viewer**. The hub falls back to error toast otherwise. |
| Page text not indexed by Google | The hub is a SPA-style multi-page app — every page is a real HTML file with its own metadata, so it indexes fine. Just submit `sitemap.xml` (see above). |

---

## Versioning

Bumped via three knobs:

1. `js/core.js` → `version: "7.0.0-enterprise"` (visible in About, sidebar pill).
2. `sw.js` → `CACHE = "dawf-shell-v7.0.0"` (forces fresh download for returning users).
3. Repository git tag, e.g. `git tag v7.0.0 && git push --tags`.

---

## Going further

* Embed the hub in an LMS via a 1-line `<iframe src="https://hmgacademyhub.github.io/dataanalysiswf/">`.
* Add a `CNAME` file with your custom domain for GitHub Pages.
* Fork and re-skin via `brand.html` (white-label) for your school / company.
* For very large datasets (>200 MB) consider [DuckDB-WASM](https://duckdb.org/docs/api/wasm/overview) — could be added to `sql.html` in a future release.
