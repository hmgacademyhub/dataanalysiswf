# Detailed Feature Explanations

## Authentication and local license gate
A demo passcode protects casual access. The gate is client-side and suitable for demos/training, not a replacement for server-side authentication on sensitive enterprise deployments.

## Ingest & Sandboxes
Users can upload CSV/Excel files, drag-and-drop local files, sync public Google Sheets, import saved workspace recipes, or load deterministic sample sandboxes for e-commerce, HR/school and finance/giving scenarios. CSV upload now works even if PapaParse cannot load.

## Cleaning & Profiling
The platform computes a data quality score, identifies missing values, duplicates and mixed types, previews rows, supports find/replace, null removal, duplicate removal, type casting and column-level pipeline settings.

## Consolidation ETL
Users can append/union another file, perform key-based joins and create formula columns in the browser. Recipes preserve settings for reuse.

## Interactive BI
The dashboard generates KPI cards and charts from the active dataset, supports filters/cross-filter behaviour and exports/printing. A canvas fallback prevents crashes if Chart.js is unavailable.

## Pivot Matrix
The pivot page lets users select row, column, value and aggregation fields to summarize data without code.

## SQL Terminal
The SQL terminal runs AlaSQL over the active in-memory dataset. When AlaSQL is unavailable, a fallback supports common `SELECT ... FROM data ... LIMIT` workflows.

## Analyst Modeller
Includes RFM segmentation, Benford's Law checks for anomaly/fraud screening, moving averages for trends and descriptive statistics.

## Executive Report
Markdown editor with live tokens such as total rows, active file name, date and first numeric sum. Marked.js is used when available; otherwise a built-in markdown fallback renders essential formatting.

## Governance and enterprise readiness
Data dictionary, lineage, undo/redo, workspace recipe export, white labelling, dark mode, command search and workspace health audit support enterprise-style governance using free browser-native tools.

## SEO/PWA
Manifest, icons, description metadata, canonical URL, robots.txt, sitemap.xml and JSON-LD schema make the public platform easier for search engines to discover and understand.
