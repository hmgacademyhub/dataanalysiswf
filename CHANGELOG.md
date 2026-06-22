# Changelog

## [7.0.0] — 2026-06-22 — Enterprise

### Added
- `forecast.html` — linear forecast, moving-average, what-if, goal-seek.
- `viz.html` — Chart Studio with 9 chart types and PNG export.
- `settings.html` — storage, theme, dataset export.
- Ctrl+K command palette across every page.
- Dark mode + brand console (white-label).
- PII detector (email / phone / SSN / credit-card) with partial / full / hash masking.
- SHA-256 hash-chained audit trail with one-click verification.
- 5 deterministic in-browser sandbox datasets.
- Recipe export / import (JSON).
- Service worker (offline-first shell).
- Sample CSV pack (`sample-data/`).
- Complete `docs/FEATURES.md`, `docs/DEPLOYMENT.md`, `docs/AUDIT_AND_FIXES.md`.

### Changed
- Persistence migrated from `localStorage` to **IndexedDB** — large datasets now survive navigation and refresh.
- Replaced Tailwind CDN with a hand-tuned plain-CSS design system (offline-safe).
- SQL Workbench: schema explorer, snippet library, query history, saved queries.
- Pivot now supports row & column totals + heatmap shading + real CSV/Excel export.
- ETL: 7 new operation tabs (calc, cols, IF/Bins, text/date, filter/sort, joins, group-by).
- Analyst: 9 models including Gini, correlations, fuzzy duplicates, reconciliation, text frequency.
- Report: markdown / HTML / printable PDF outputs.
- Every page: real SEO metadata (description, canonical, OG, JSON-LD).

### Fixed
- Upload silently failing on datasets > 5 MB.
- Mismatched `<div>` / `</main>` tags across pages.
- "Sandbox" buttons being stubs.
- Pivot CSV export being a stub `alert()`.
- Cohort analysis being a stub `alert()`.
- Orphan v5 scripts (`auth.js`, `enterprise.js`, etc.) never loaded on any page.
- Type inference using only the first row.
- Formula sandbox allowing access to `window` / `fetch` / `eval`.

## [6.1] — Previous build (reference)
See repository history.
