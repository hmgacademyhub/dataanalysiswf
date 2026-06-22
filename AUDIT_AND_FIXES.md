# DAWF v5 Enhanced — Deep Audit, Fixes and Enterprise Enhancement Notes

Audit date: 2026-06-22.

## Summary
The original site contained strong static UI and many planned modules, but several operations could fail silently because core initialization depended on external CDN scripts and asynchronous IndexedDB state loading was not awaited before module rendering. This made the Ingest & Sandboxes buttons appear non-clickable in constrained browsers and made downstream pages render before the saved dataset was available.

## Root causes found and fixed
1. **Unprotected `lucide.createIcons()` call** — if the Lucide CDN failed, `initApp()` stopped before upload, sandbox, tab and Google Sheet event listeners were attached. Fixed by adding `safeLucideCreate()` and using guarded icon rendering.
2. **Asynchronous state race** — `loadSharedState()` was called but not awaited. Cleaning, dashboard, pivot, SQL and modeller pages could initialize with empty globals. Fixed by making `initApp()` async and awaiting shared state.
3. **CSV dependency fragility** — CSV upload required PapaParse from CDN. If blocked, upload failed. Added a local CSV parser fallback that supports quoted values and empty row removal.
4. **SQL dependency fragility** — SQL required AlaSQL. Added a simple offline SELECT fallback.
5. **Report dependency fragility** — report preview required Marked. Added a safe markdown fallback.
6. **Chart dependency fragility** — Chart.js absence could crash dashboard/modeller charts. Added a lightweight canvas chart fallback.
7. **Google Sheet ingestion weakness** — original export URL did not respect `gid` and did not check failed HTTP responses. Added `gid` support and HTTP error handling.
8. **Excel workbook metadata** — selected worksheet ingestion always used `uploaded.xlsx`. Fixed to preserve original file name where possible.
9. **Dataset normalization** — blank rows and duplicate/blank headers could cause unstable columns. Added normalization before ingestion.
10. **SEO canonical error** — canonical URL pointed to another deployment. Fixed to GitHub Pages URL and added robots/sitemap.

## Enhancements added
- Global feature search / command palette with Ctrl+K.
- Feature Guide modal explaining all system capabilities.
- Workspace Health Audit modal for dataset, quality, privacy, dependencies, SEO and export readiness.
- SEO metadata, JSON-LD SoftwareApplication schema, `robots.txt`, and `sitemap.xml`.
- Offline resilience for CSV, simple charts, simple SQL and markdown preview.

## Recommended manual verification
1. Open `index.html`, unlock with `HMG2025`, click each sandbox card; each should redirect to `clean.html` after ingesting generated data.
2. Upload a CSV file; it should ingest and redirect to cleaning.
3. Upload an XLSX file in a network-enabled browser; multi-sheet selector should work.
4. Use Google Sheet Sync with a public spreadsheet URL; if URL includes `gid`, the selected sheet tab should be used.
5. Visit Clean, Dashboard, Pivot, SQL, Analyst and Report pages after ingest; they should read the active dataset from IndexedDB.
6. Press Ctrl+K and search for features.
7. Open Feature Guide and Workspace Health from the sidebar.
