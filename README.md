# DAWF v5 Enhanced — Enterprise Data Workspace

DAWF (Data Analysis Workflow) v5 Enhanced is a professional-grade, serverless, 100% client-side Business Intelligence, ETL, and Data Science platform. Designed for secure enterprise-level data exploration with zero server-side data processing.

## 🚀 What's New in v5 Enhanced

- **Real Excel Upload Support**: SheetJS-powered parsing of .xlsx and .xls workbooks with multi-sheet selection.
- **Google Sheets Sync**: Pull public Google Sheets directly into the workspace via CSV export.
- **Data Quality Engine**: Real-time quality scoring, null/missing detection, duplicate row detection, mixed-type detection, and deterministic cleaning advisor.
- **Interactive Data Preview Grid**: Paginated, sortable data table preview with fallback support.
- **Find & Replace**: Column-level search and replace with occurrence counts.
- **Remove Duplicates**: One-click deduplication across active columns.
- **Type Casting**: Quick cast any column to Text, Number, Date, or Boolean.
- **Real ETL Joins/Union**: Upload a secondary file and perform Left Join, Inner Join, or Row Union with key matching.
- **Dynamic Dashboard**: Auto-generated charts based on data types (bar, scatter, line, doughnut) with cross-filtering.
- **Dashboard Slicers**: Auto-generated categorical dropdown filters on the BI page.
- **Real Pivot Matrix**: Two-dimensional cross-tab pivot with SUM, AVERAGE, and COUNT aggregation.
- **SQL Terminal with History**: AlaSQL-powered query engine with query history, save, and CSV export.
- **Analyst Models**: Working RFM Segmentation, Benford's Law Fraud Detection, Moving Average Forecasting, and Descriptive Statistics.
- **Undo / Redo Stack**: IndexedDB-backed state snapshots for every transformation step.
- **Export Formats**: CSV, Excel (.xlsx), JSON recipe, and Print-to-PDF.
- **Data Dictionary**: Popup modal showing per-column stats, types, and samples.
- **Workspace Recipe Save/Load**: Export and import full workspace state including data, formulas, and brand config.
- **Toast Notifications**: Replaced all browser alerts with non-blocking toast system.
- **Dark Mode**: Full UI dark mode toggle with persistent state.
- **PWA Manifest**: Installable as a standalone app on desktop and mobile.
- **Session Timeout**: Auto-logout after 30 minutes of inactivity.

## 🛠 Technology Stack (All Free / Open Source)

| Tool | License | Purpose |
|------|---------|---------|
| Tailwind CSS (CDN) | MIT | Utility-first CSS |
| Lucide Icons (CDN) | ISC | Iconography |
| Chart.js (CDN) | MIT | Data visualizations |
| SheetJS / xlsx (CDN) | Apache 2.0 | Excel parsing & export |
| PapaParse (CDN) | MIT | CSV parsing |
| AlaSQL (CDN) | MIT | In-browser SQL engine |
| Marked (CDN) | MIT | Markdown rendering for reports |
| IndexedDB | Native | Client-side state persistence |

## 📝 Files Overview

- `index.html` — Ingestion hub (upload, Google Sheets, sandboxes, recipe import)
- `clean.html` — Data profiling, quality advisor, data grid, cleaning tools, pipeline
- `etl.html` — Join/Union engine, calculated fields, data lineage visualizer
- `dashboard.html` — KPI cards, auto charts, slicers, cross-filtering, insights
- `pivot.html` — Two-dimensional pivot table with aggregation
- `sql.html` — SQL query terminal with history and export
- `analyst.html` — RFM, Benford, moving average, descriptive stats
- `report.html` — Markdown executive report with dynamic placeholders
- `learn.html` — Learning portal, glossary, guided workflows
- `brand.html` — Brand console, dark mode, white-labeling
- `css/style.css` — Custom styles, dark mode, print overrides, toast animations
- `js/db.js` — IndexedDB state manager and undo/redo stack
- `js/utils.js` — Toast system, type inference, quality scoring, statistical helpers, recipe save/load
- `js/auth.js` — Passcode auth, license gate, session timeout
- `js/brand.js` — Global brand sync and dark mode class application
- `js/enterprise.js` — Export dropdown, logout, undo/redo buttons, data dictionary modal
- `js/lineage.js` — Data lineage visualizer with step timestamps
- `js/app.js` — Core application logic for all pages
- `manifest.json` — PWA manifest
- `icons/` — App icons for PWA and branding

## 🛠 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed, unambiguous steps.

## 📄 License & Attribution

**Designed and Built by:** Adewale Samson Adeagbo (cssadewale) — A flagship of HMG Technologies / HMG Academy.

All third-party libraries are used under their respective open-source licenses. No AI APIs are required.
