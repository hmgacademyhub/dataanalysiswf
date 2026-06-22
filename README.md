# Data Analysis Workflow Hub (v7.0 — Enterprise)

> **The entire data-analyst toolkit (Excel + Power BI + Tableau + MySQL Workbench) running 100 % in your browser. Free. Your data never leaves your device.**

Live demo: <https://hmgacademyhub.github.io/dataanalysiswf/>
Repository: <https://github.com/hmgacademyhub/dataanalysiswf>

---

## Why this exists

Cloud BI tools (Power BI Service, Tableau Online, Looker Studio) require you to upload your data to a vendor's server, pay per seat / per row, and trust their compliance posture. For 90 % of analytical tasks that an everyday analyst, teacher, student, accountant or small-business owner performs, *none of that is necessary*. Modern browsers can run the entire analyst workflow locally — and that is exactly what this hub does.

* **No backend.** Static HTML/CSS/JS hosted on GitHub Pages, Netlify, Vercel, Cloudflare Pages — anywhere.
* **No AI APIs.** Models are deterministic, classical, explainable (RFM, Pareto, Benford, regression, IQR…).
* **No analytics trackers.** No third-party JavaScript except the libraries you can see.
* **No data leaves your browser.** Datasets live in IndexedDB; you control export.

---

## Workflow coverage

| Discipline | Equivalent tool                | Hub page                                  |
|---|---|---|
| Ingestion / connect | Power Query, Excel "Get Data"        | `index.html`                       |
| Profile / quality   | Power Query column profile, OpenRefine | `clean.html`                     |
| Transform / shape   | Power Query, dplyr, pandas             | `etl.html`                       |
| Pivot               | Excel PivotTable                       | `pivot.html`                     |
| Visualise           | Tableau, Power BI Desktop              | `dashboard.html`, `viz.html`     |
| SQL                 | MySQL Workbench, DBeaver, BigQuery UI  | `sql.html`                       |
| Modelling           | Excel + Solver, RFM templates, Python  | `analyst.html`                   |
| Forecast / what-if  | Excel forecast sheet, Power BI quick   | `forecast.html`                  |
| Report              | Word, PDF export                       | `report.html`                    |
| Govern              | Purview / DataDog DQ                   | `governance.html`                |

A full list with explanations is in [`docs/FEATURES.md`](docs/FEATURES.md).

---

## Quick start

1. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).
2. Click **Upload dataset** — pick a CSV / XLSX, or click any sandbox button.
3. Follow the sidebar in order: **Clean & Profile → ETL → Pivot → Dashboard → SQL → Modeller → Forecast → Report**.
4. Hit **Ctrl + K** anywhere to jump to any feature with full-text search.

---

## What changed in v7.0 vs the previous v6.1

The previous build worked but had several blocking bugs and missed features. v7.0 is a near-total rewrite of the runtime while preserving every page name and the UX flow.

### Bug fixes (see [`docs/AUDIT_AND_FIXES.md`](docs/AUDIT_AND_FIXES.md))

* **Upload now persists between pages** — switched persistence from `localStorage` (5–10 MB, fails silently on big files) to **IndexedDB** (browser-quota limit, usually hundreds of MB).
* **Sandbox buttons actually load data** — five seeded synthetic datasets generated in-browser.
* **Mismatched HTML tags fixed** (`<div class="main-content">` was being closed with `</main>`).
* **Race condition on page navigation fixed** — every page now awaits `DAWFUI.boot()` which awaits `DAWF.ready()` before doing anything.
* **Pivot CSV export now works** (was a fake `alert("Exported!")` stub).
* **Cohort analysis no longer a stub** — full month-bucket retention grid.
* **Enterprise / auth / lineage / brand scripts are now actually loaded** (were orphaned dead code in v6.1).
* **Service worker added** — the shell is offline-capable.

### Major new features

* **Forecast & What-If page** — linear regression, moving average, scenario %, goal-seek.
* **Chart Studio** — nine chart types with recommendations and PNG export.
* **SQL Workbench upgrade** — query library, history (IndexedDB), saved queries, format/explain.
* **Analyst Modeller** rebuilt with nine models including Gini, anomaly z-score, fuzzy duplicates, reconciliation, text frequency.
* **Governance** — SHA-256 hash-chained audit trail, PII detector (email/phone/SSN/credit card) with partial/full/hash masking, workspace health audit.
* **Brand Console** — true white-label across every page.
* **Dark mode** — one-click theme toggle.
* **Command palette** — Ctrl+K full-text feature search.
* **PWA-ready** — manifest, service worker, installable.
* **SEO-ready** — robots.txt, sitemap.xml, JSON-LD structured data, OG tags, canonical URLs on every page.

### Features ported from the HMG Excel Operations Streamlit platform

(Items below were re-implemented in pure browser JavaScript so they remain free and serverless.)

* Quality scorecard with letter grade
* Data dictionary / column profile
* PII detection with masking modes
* Audit log with hash chain integrity
* Pareto / ABC analysis
* Benford's Law fraud screen
* Cohort retention grid
* RFM segmentation with scoring
* Reconciliation report (left-join key diff)
* Fuzzy duplicate detector (Jaccard)
* Anomaly detection (IQR + z-score)
* Correlation matrix
* What-if scenario modeller
* Goal-seek solver
* Calendar / date-part extractor
* Bin column (equal-width / quantile)
* IF column (8 operators)
* Find/Replace (with regex)
* Standardised header names
* Forward-fill / mean / median / mode imputation
* Outlier winsorise / remove
* Workspace recipe export
* Executive report generator (markdown / HTML / print)

---

## Deploy (3-step GitHub Pages)

```bash
git clone https://github.com/hmgacademyhub/dataanalysiswf.git
cd dataanalysiswf
# Replace the repo contents with the contents of this `data/` folder
git add -A
git commit -m "v7.0 enterprise"
git push origin main
```

GitHub → Settings → Pages → Source = `main` / `/(root)` → Save. URL appears within ~60 s.
Detailed instructions and alternatives (Netlify, Vercel, Cloudflare Pages, self-hosting) are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## Folder layout

```
.
├── index.html              ← Ingestion + sandboxes
├── clean.html              ← Clean & Profile
├── etl.html                ← ETL / Power Query
├── pivot.html              ← Pivot matrix
├── dashboard.html          ← Interactive BI
├── sql.html                ← SQL Workbench
├── analyst.html            ← Modeller (RFM, Pareto, …)
├── forecast.html           ← Forecast / What-If / Goal-seek
├── viz.html                ← Chart Studio
├── report.html             ← Executive report
├── governance.html         ← Audit / PII / health
├── brand.html              ← White-label console
├── learn.html              ← Curriculum / glossary / quiz
├── settings.html           ← Storage & display
├── sw.js                   ← Service worker (offline)
├── manifest.json           ← PWA
├── robots.txt              ← SEO
├── sitemap.xml             ← SEO
├── css/style.css           ← Design system
├── js/core.js              ← Runtime: state, IndexedDB, ingestion, ETL, models
├── js/ui.js                ← Shared sidebar / header / command palette
├── icons/                  ← PWA icons
├── sample-data/            ← Practice CSVs
└── docs/                   ← README, FEATURES, DEPLOYMENT, AUDIT
```

---

## Technology stack

| Concern        | Library                  | Why                                              |
|---|---|---|
| CSV parsing    | PapaParse 5.4            | Streaming, robust, dynamic typing                |
| Excel reading  | SheetJS 0.18 (`xlsx`)    | Reads/writes XLSX, XLS                           |
| SQL            | AlaSQL 4.4               | Full ANSI-SQL subset in browser                  |
| Charts         | Chart.js 4.x             | Tiny, dependency-free, beautiful                 |
| Icons          | Lucide                   | Crisp open-source icon set                       |
| Persistence    | IndexedDB (native)       | Hundreds of MB available, origin-isolated        |
| Hash chain     | Web Crypto SubtleCrypto  | Built-in SHA-256                                 |
| Styling        | Plain CSS variables      | No build, instant dark mode                      |

There is **no** server, no Tailwind CDN, no React, no AI API, no analytics — by design.

---

## License

MIT (see `LICENSE` if present, otherwise the standard MIT terms apply).

Built by **HMG Academy / HMG Technologies** — *Learning Deliberately. Teaching Authentically.*
