# Audit & fix log — v6.1 → v7.0

A diagnostic pass on the previous build identified the issues below. Every one has been resolved in v7.0.

## P0 — blocking bugs

| # | Where | Symptom | Root cause | Fix |
|---|---|---|---|---|
| 1 | `index.html` upload | Reported "Success" then no data on next page. | Persistence used `localStorage`. Datasets > 5 MB raised a silent `QuotaExceededError`. | Moved persistence to **IndexedDB** (`DB_NAME = "DAWF_DB_v7"`). Datasets stored in a dedicated object-store keyed `active`. |
| 2 | Sandbox buttons | Click did nothing meaningful (just `alert()`). | Click handlers were placeholder comments. | Implemented 5 **deterministic seeded** generators in `DAWF.sandboxes.*` and wired them to `data-sandbox` attributes. |
| 3 | Page navigation lost state | Going from Ingest → Clean often showed "No dataset". | Each page hydrated state on `window.onload`, but the previous page's `save()` was sync `localStorage`. With IndexedDB now async, every page **awaits** `DAWF.ready()` via `DAWFUI.boot()`. |
| 4 | `clean.html`, `etl.html`, etc. | `<div class="main-content">` closed by `</main>` — broken DOM tree. | Manual templating drift. | New shared chrome (`DAWFUI.renderSidebar`, `renderHeader`) — every page uses matching open/close tags. |
| 5 | `pivot.html` "Export CSV" | Showed an alert, didn't download. | Stub function. | Real `DAWF.exportEngine.toCSV()` with BOM + RFC-4180 escaping. |
| 6 | `analyst.html` Cohort | `alert('Visualization pending')`. | Stub. | Full cohort retention grid (`DAWF.analyst.cohort`). |
| 7 | Enterprise / auth / lineage scripts | Loaded nothing — they were `<script src="">` orphans (no page imported them). | v5 ↔ v6 refactor left dead code. | Consolidated into `js/core.js` + `js/ui.js`. Removed orphan files. |
| 8 | Top-nav "Export All" | Linked to `report.html` (no actual export). | UI label vs behaviour mismatch. | Replaced with a real **Export** button that downloads the active dataset as CSV. |

## P1 — important bugs / gaps

| # | Where | Symptom | Fix |
|---|---|---|---|
| 9 | Formula sandbox in ETL | `new Function('return ' + formula)` allowed access to `window`, `fetch`, `eval`. | Added an identifier denylist + execution wrapper that throws on disallowed tokens. |
| 10 | `etl.html` Excel/JSON join | Only handled CSV. | Now also handles XLSX and JSON via `DAWF.ingestion.parseExcel/parseJSON`. |
| 11 | `etl.html` join types | Only `inner` and `left`. | Now `inner` / `left` / `right` / `outer`. |
| 12 | No undo/redo | Mutations were permanent. | Snapshot-based **history stack** (depth 30). Ctrl+Z / Ctrl+Shift+Z + toolbar buttons. |
| 13 | No service worker | App broke when offline despite a manifest. | Added `sw.js` with shell pre-cache + network-first for everything else. |
| 14 | No SEO on inner pages | Only `index.html` had description / OG. | Every page now has `<meta description>`, `<link canonical>`, OG tags, `manifest`. |
| 15 | Tailwind via CDN | Pages broke entirely with no internet. | Removed; rewrote `css/style.css` as plain CSS variables (also enables dark mode). |
| 16 | No PII detection | Sensitive columns flowed through to exports unflagged. | `DAWF.privacy.detectPII()` + masking. |
| 17 | Audit trail | Plain array, no integrity guarantee. | SHA-256 **hash chain** + verifier. |
| 18 | No theming / dark mode | User couldn't customise. | Brand console + dark-mode toggle (persisted in IndexedDB). |
| 19 | Pivot heatmap | Mentioned in copy, not implemented. | Linear-scale heatmap shading using inline `style`. |
| 20 | Profile types | Used `typeof` from the first non-empty row → wrong for sparse columns. | Now samples up to 500 rows and picks the **dominant** inferred type. |

## P2 — quality / DX

| # | Improvement | Result |
|---|---|---|
| 21 | Replaced `alert()` calls with toast notifications. | Less jarring UX; consistent palette per kind. |
| 22 | Added Command Palette (Ctrl+K). | Discoverable feature search across 30+ entries. |
| 23 | Added Live preview to ETL. | Immediate feedback after every mutation. |
| 24 | Added recipe export (JSON). | Reproducible workflow without storing data. |
| 25 | Added 5 sample CSVs in `sample-data/`. | Onboarding without needing internet. |
| 26 | Wrote full `docs/FEATURES.md`, `docs/DEPLOYMENT.md`, `docs/AUDIT_AND_FIXES.md`. | New contributors get up to speed in minutes. |
| 27 | Removed Tailwind CDN dependency. | Page weight ~70 kB lighter; works offline. |
| 28 | Lazy-load Chart.js, AlaSQL, SheetJS via `defer`. | Faster first-contentful-paint. |

## P3 — new pages / capabilities (not present in v6.1 at all)

| # | Page | What it adds |
|---|---|---|
| 29 | `viz.html` | Chart Studio — 9 chart types, PNG export, recommendations. |
| 30 | `forecast.html` | Linear forecast, moving average, what-if, goal-seek. |
| 31 | `settings.html` | Storage info, theme toggle, dataset export. |
| 32 | `governance.html` overhaul | PII scan, hash-chain verifier, health audit, recipe export. |
| 33 | `learn.html` overhaul | Curriculum, glossary, quiz, free resources. |

## Verification

After applying the v7.0 build, re-run the smoke test:

1. Hard-refresh (Ctrl+Shift+R) the deployed site.
2. Click **Upload dataset** → select `sample-data/ecommerce_sales.csv`.
3. The active-file badge should display `ecommerce_sales.csv · 50 rows × 10 cols`.
4. Navigate **Clean → ETL → Pivot → Dashboard → SQL → Analyst → Forecast → Governance → Report**. All pages must show data — none should show the "No dataset" empty state.
5. In Governance, click **Verify** — chain should be valid.
6. In Settings → Storage, confirm `DAWF_DB_v7` is being used.
7. Close the browser tab, re-open the site — the dataset should still be there.
