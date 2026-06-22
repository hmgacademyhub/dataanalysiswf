# Feature catalogue — v7.0 Enterprise

Every capability ships free, runs in the browser, and is reachable from the **Ctrl + K** command palette.

## 1. Ingestion (`index.html`)

| Feature | Notes |
|---|---|
| Local file upload | CSV, TSV, TXT, XLSX, XLS, JSON. Parsed by PapaParse / SheetJS. |
| URL load | Any direct CSV / JSON URL with CORS enabled. |
| Google Sheet sync | Public sheet → auto-converted to CSV export URL. |
| Sandbox datasets | 5 deterministic synthetic datasets (e-commerce, HR, finance, marketing, inventory). |
| Recipe import | Restore session metadata from a previously exported recipe JSON. |
| Reset workspace | Single click wipes all IndexedDB state. |
| Quick stats | Live KPI card showing rows, columns, missing %, quality score after upload. |

## 2. Clean & Profile (`clean.html`)

| Feature | Notes |
|---|---|
| Overview KPIs | Rows / Cols / Cells / Missing / Duplicates / Quality score. |
| Column profile table | Type, nulls, null %, unique, outlier count, min, max, mean, std, status pill. |
| One-click trim | Removes leading/trailing whitespace from every string cell. |
| Drop duplicates | Exact-row dedupe. |
| Drop empty rows | Removes rows where every cell is empty. |
| Standardise headers | snake_case, dedupe, ASCII-safe. |
| Reset to original | Restore the ingested snapshot. |
| Impute missing | Strategies: constant, mean, median, mode, forward-fill. |
| Treat outliers | IQR fence → cap (winsorise) or remove. |
| Cast column type | string / integer / number / boolean / date. |
| Find & replace | Literal or regular expression, per-column. |

## 3. ETL & Power Query (`etl.html`)

7 tabs:
* **Calculated** — JavaScript-sandboxed formula with `[col]` syntax (`window`, `fetch`, etc. blocked).
* **Columns** — drop, rename, merge several into one.
* **IF / Bins** — IF column with 8 operators; equal-width or quantile binning.
* **Text / Date** — split a column by delimiter; extract year / month / day / weekday / quarter / yyyy-mm.
* **Filter / Sort** — 10 row filter operators, asc/desc sort.
* **Joins & Union** — inner / left / right / outer join with another file; append/union.
* **Group-By** — sum / count / avg / min / max / median aggregation by one or many dimensions; download as CSV.

## 4. Pivot Matrix (`pivot.html`)

* Row × Column × Measure with sum / count / avg / min / max / median.
* Optional row & column totals.
* Optional heatmap shading (linear scale by value).
* CSV and Excel export.

## 5. Interactive BI Dashboard (`dashboard.html`)

* Up to 6 categorical slicers.
* KPI scorecard (Rows, Total, Average, Max, Min of first numeric measure).
* Four cross-filtered Chart.js charts: bar, doughnut, line, scatter.
* Independent dimension / measure dropdowns per chart.
* Clear-all-filters button.

## 6. Chart Studio (`viz.html`)

* Nine chart types — bar, line, area, doughnut, pie, polar area, radar, scatter, bubble.
* Top-N filter, custom colour, agg = sum / count / avg.
* Auto-recommendation list based on column types.
* PNG export.

## 7. SQL Workbench (`sql.html`)

* AlaSQL engine (ANSI-SQL subset, joins, windows, aggregates).
* Schema explorer (column + inferred type).
* Snippet library (8 starter queries).
* History (last 20 queries, persisted in IndexedDB).
* Save named queries.
* Format SQL.
* CSV / JSON export of results.
* Ctrl + Enter to run.

## 8. Analyst Modeller (`analyst.html`)

* **RFM** segmentation (Champions / Loyal / At-Risk / New / Lost / Potential).
* **Pareto / ABC** classification.
* **Benford's Law** with chi-square verdict.
* **Cohort** retention grid (M0..M11).
* **Correlation** matrix (Pearson).
* **Anomaly** detection (IQR or z-score).
* **Gini** concentration with Lorenz curve.
* **Text frequency** (stop-words removed).
* **Reconciliation** (left-join key diff).

## 9. Forecast & What-If (`forecast.html`)

* Linear regression forecast (configurable horizon).
* Moving-average smoothing.
* % what-if scenario (preserves original values).
* Goal-seek solver (multiplier + implied %).

## 10. Executive Report (`report.html`)

* Auto-generated executive summary.
* Quality audit KPI block.
* Top numeric metrics table.
* Rule-based insights.
* Audit trail (last 20 entries).
* Print-to-PDF, Markdown, HTML export.

## 11. Governance (`governance.html`)

* SHA-256 **hash-chained audit log** with one-click verification.
* CSV export of audit log.
* **PII detector** — email, phone, SSN, credit-card patterns + name-heuristic.
* Mask modes: partial, full, hash.
* Access-control matrix reference (Viewer / Analyst / Lead / Auditor).
* Workspace health audit (8 checks).
* Recipe export (JSON).
* Privacy posture summary.

## 12. Brand Console (`brand.html`)

* White-label name, tagline, logo emoji, primary colour, organisation.
* Live preview tile.
* Persistent per-device (IndexedDB).

## 13. Learning Portal (`learn.html`)

* Eight-module progressive curriculum with hands-on practice prompts.
* Feature explanations.
* Glossary (17 terms, searchable).
* Six-question self-grading quiz.
* Free dataset and SQL/DAX resources.

## 14. Settings (`settings.html`)

* Dark-mode toggle.
* Storage estimate (used / quota).
* Reset workspace.
* Export current dataset as CSV / JSON / XLSX / recipe.

## 15. Cross-cutting

* **Ctrl + K** command palette — fuzzy-search every feature.
* **Ctrl + Z / Ctrl + Shift + Z** — undo / redo (snapshot stack of 30 entries).
* **Dark mode** persists per device.
* **Service worker** caches the app shell — works offline once visited.
* **PWA manifest** — installable to home-screen.
* **SEO** — robots.txt, sitemap.xml, JSON-LD, OG tags, canonical URLs.
* **Accessible** — keyboard navigation, focus rings, semantic landmarks.
