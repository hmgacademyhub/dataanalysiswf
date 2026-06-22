# DAWF v5 Enhanced — Enterprise Feature Documentation

This document provides a detailed technical and functional overview of every feature in DAWF v5 Enhanced.

---

## 1. Secure Authentication & Session Management
**What it is:** A client-side gate that protects the workspace with a passcode or enterprise cryptographic license key.  
**Unique Value:** No server required. Sessions include a 30-minute auto-timeout for security compliance.  
**How to use:** Enter `HMG2025` on the landing modal, or paste a license hash for enterprise tier.  
**Enterprise Use Case:** Shared workstations in schools or banks where analysts must not leave data exposed.

---

## 2. Multi-Source Ingestion (Local + Cloud)
**What it is:** Upload CSV, Excel (.xlsx/.xls) with multi-sheet selection, or paste a public Google Sheets link to sync data.  
**Unique Value:** True Excel parsing via SheetJS, not just CSV. Google Sheets are fetched as CSV in-browser.  
**How to use:** Drag & drop a file onto the dropzone, or paste a Google Sheets share link and click Sync.  
**Enterprise Use Case:** Analysts receive weekly Excel reports from finance; upload directly without conversion.

---

## 3. Serverless Sandbox Datasets
**What it is:** Pre-built synthetic datasets (E-Commerce, HR Directory, Church/SaaS Finance) that load instantly for training or demos.  
**Unique Value:** 100-200 rows of realistic data with proper schemas, generated on the fly.  
**How to use:** Click any sandbox card on the Ingestion page.  
**Enterprise Use Case:** New team members can practice cleaning and modeling without touching real data.

---

## 4. Workspace Recipe Save / Load
**What it is:** Export the entire workspace state (raw data, working data, columns, formulas, brand config, dark mode) as a JSON recipe. Re-import later.  
**Unique Value:** True reproducibility. A senior analyst can save a recipe and juniors can load it to resume the exact same session.  
**How to use:** Use the **Export > Save Workspace Recipe** button in the header dropdown. Load via **Import Template (.json)** on the Ingestion page.  
**Enterprise Use Case:** Audit trails, classroom assignments, and standard operating procedures.

---

## 5. Data Quality Engine
**What it is:** Automated scoring (0-100) based on real null counts, duplicate rows, and mixed-type columns. Issues are listed with severity (high/medium).  
**Unique Value:** Not a hardcoded score. It actually scans every cell.  
**How to use:** View the **Diagnostics & Data Cleaning** page after ingestion. The score bar, metrics, and advisor update live.  
**Enterprise Use Case:** Financial data must be scored before board reporting. This gives an objective pass/fail metric.

---

## 6. Interactive Data Preview Grid
**What it is:** A paginated, sortable table preview of the working dataset (first 500 rows).  
**Unique Value:** If Tabulator is available, it renders a full-featured grid. Otherwise, a clean HTML table fallback is shown.  
**How to use:** Appears automatically on the **Clean & Profile** page.  
**Enterprise Use Case:** Quickly eyeball 100 rows to confirm that formulas and casts worked correctly.

---

## 7. Find & Replace
**What it is:** Column-specific search and replace with occurrence counting.  
**Unique Value:** Works on the in-memory dataset, not the original file.  
**How to use:** Select a column, enter search text and replacement text, then click **Apply Replace**.  
**Enterprise Use Case:** Standardize country codes, currency symbols, or department names across 50,000 rows.

---

## 8. Remove Duplicates
**What it is:** One-click deduplication based on the exact match of all active column values.  
**Unique Value:** Preserves the original dataset; deduplication is applied to the working copy.  
**How to use:** Click **Remove Duplicate Rows** on the Clean & Profile page.  
**Enterprise Use Case:** Merge two CRM exports that overlap and clean the union before analysis.

---

## 9. Remove Null Rows
**What it is:** Drop rows where a selected column is null, empty, or whitespace.  
**Unique Value:** Targeted null removal without deleting the entire dataset.  
**How to use:** Select a column in the dropdown, then click **Drop Null Rows**.  
**Enterprise Use Case:** Remove records with missing `Customer_ID` before joining to the master table.

---

## 10. Quick Type Cast
**What it is:** Cast any column to Text, Number, Date, or Boolean in one action.  
**Unique Value:** Uses a smart `castValue` helper that handles ISO dates, booleans, and numeric strings.  
**How to use:** Select column and target type on the Clean & Profile page, then click **Cast Type**.  
**Enterprise Use Case:** Imported CSVs often treat IDs as numbers; cast to Text to preserve leading zeros.

---

## 11. Schema Columns Pipeline & Null Strategy
**What it is:** A table showing every original column with toggles for Active, Rename, Data Type, and Null Strategy (Ignore, Drop Rows, Mean, Median, Mode, Empty String).  
**Unique Value:** Mean/Median/Mode imputation is computed on the fly from the actual data distribution.  
**How to use:** Configure columns in the pipeline table, then click **Apply Pipeline Changes**.  
**Enterprise Use Case:** A survey dataset with missing salaries can be imputed with median salary per department.

---

## 12. Enterprise Calculated Columns
**What it is:** JavaScript-expression-based new columns. Example: `row['Price'] * row['Quantity']`.  
**Unique Value:** Each formula is recorded in the state history and can be reloaded via a recipe.  
**How to use:** Enter a new name and formula, then click **Add Calculated Field**.  
**Enterprise Use Case:** Compute `Net_Revenue = Sales * (1 - Discount_Rate)` without modifying the source ERP extract.

---

## 13. In-Memory ETL Join & Union
**What it is:** Upload a secondary file and perform Left Join, Inner Join, or Row Union using key columns.  
**Unique Value:** Relational blending entirely in the browser, no database needed.  
**How to use:** Go to **Consolidation ETL**, choose a mode, upload a secondary file, select keys, and execute.  
**Enterprise Use Case:** Enrich a sales transaction file with a customer demographics file on `Customer_ID`.

---

## 14. Data Lineage Visualizer
**What it is:** A visual trail showing ingestion, cleaning, transformation, and visualization steps with timestamps.  
**Unique Value:** Steps are appended dynamically as the user performs actions, not hardcoded.  
**How to use:** View the lineage diagram on the **Consolidation ETL** page.  
**Enterprise Use Case:** Data governance audits require proof of source-to-dashboard lineage.

---

## 15. Interactive BI Dashboard with Auto-Charts
**What it is:** KPI cards, auto-suggested charts (Bar, Scatter, Line, Doughnut) based on column data types, and a cross-filtering system.  
**Unique Value:** Charts are built from the actual uploaded data, not dummy charts. Clicking a chart bar filters the entire dashboard.  
**How to use:** Navigate to **Interactive BI** after cleaning data. Use slicers to filter. Click chart bars to drill down.  
**Enterprise Use Case:** Present live sales dashboards in regional review meetings without exposing raw data to a server.

---

## 16. Dashboard Slicers (Auto-Generated Filters)
**What it is:** Dropdown filters automatically generated from every text/categorical column with fewer than 50 unique values.  
**Unique Value:** No manual configuration. The system detects what is filterable.  
**How to use:** Use the filter bar above the charts on the **Interactive BI** page.  
**Enterprise Use Case:** A manager wants to see only the "Lagos" region and "Q3" without writing SQL.

---

## 17. Cross-Tab Pivot Matrix
**What it is:** A true two-dimensional pivot table with Row Dimension, Column Dimension, Measure, and Aggregation (SUM, AVERAGE, COUNT).  
**Unique Value:** Built with custom JavaScript aggregation, not a dummy table. Totals are computed.  
**How to use:** Select dimensions and aggregation on the **Pivot Matrix** page.  
**Enterprise Use Case:** Monthly revenue by region and product category for executive summaries.

---

## 18. In-Memory SQL Terminal (AlaSQL)
**What it is:** A full SQL engine running in the browser. Supports `SELECT`, `GROUP BY`, `JOIN`, `WHERE`, `LIMIT`, and more.  
**Unique Value:** Query history is persisted in IndexedDB. Results can be exported to CSV.  
**How to use:** Go to **SQL Terminal**, write a query, and click **Run Query**.  
**Enterprise Use Case:** Ad-hoc auditing queries such as "SELECT * FROM data WHERE Amount > 1000000".

---

## 19. Analyst Modeller (RFM, Benford, Trend, Stats)
**What it is:** Four working statistical models:  
- **RFM Segmentation:** Recency, Frequency, Monetary quintile scoring with automatic segment labels (Champions, Loyal, New, At Risk, Others).  
- **Benford's Law Fraud Screen:** Compares first-digit distribution against Benford's expected frequencies.  
- **Moving Average Forecast:** Rolling window smoothing with configurable window size.  
- **Descriptive Statistics:** Mean, median, std dev, min, max, mode, unique counts per numeric column.  
**Unique Value:** No Python or R required. All models run in the browser on the active dataset.  
**How to use:** Select a model on the **Analyst Modeller** page, map columns, and run.  
**Enterprise Use Case:** Internal audit teams can screen invoice amounts for anomalies using Benford's Law before engaging external auditors.

---

## 20. Executive Markdown Reporter
**What it is:** A split-screen Markdown editor with live preview. Dynamic placeholders like `{{total_rows}}`, `{{file_name}}`, `{{date}}`, `{{sum_first_numeric}}` are injected with real data.  
**Unique Value:** Narrative reporting meets live data. The output is print-ready.  
**How to use:** Go to **Executive Report**, write Markdown, and click **Print Report**.  
**Enterprise Use Case:** Generate weekly board memos that combine analyst commentary with up-to-date numbers.

---

## 21. Data Dictionary Modal
**What it is:** A popup showing every column, its inferred type, non-null count, unique count, and sample values.  
**Unique Value:** Generated dynamically from the active dataset.  
**How to use:** Click **Data Dictionary** in the sidebar under **Data Governance**.  
**Enterprise Use Case:** Onboarding a new data steward who needs to understand a legacy file's schema.

---

## 22. Export Suite (CSV, Excel, JSON, PDF)
**What it is:** Export the working dataset as CSV, Excel (.xlsx via SheetJS), JSON (recipe), or Print-to-PDF.  
**Unique Value:** Excel export is native binary, not a CSV renamed. JSON export preserves the full state.  
**How to use:** Click the **Export** button in the top header on any page.  
**Enterprise Use Case:** Share a cleaned Excel file with the finance department, or save a JSON recipe for compliance records.

---

## 23. Undo / Redo Stack
**What it is:** Every transformation (cleaning, ETL, formula, type cast) is snapshotted to IndexedDB. Undo and redo buttons appear in the header.  
**Unique Value:** Up to 30 deep snapshots. Reloading the page does not clear the stack.  
**How to use:** Click **Undo** or **Redo** in the header toolbar.  
**Enterprise Use Case:** Experiment with aggressive deduplication, realize it dropped valid rows, and undo safely.

---

## 24. Toast Notification System
**What it is:** Non-blocking, color-coded notifications (info, success, warning, error) that slide in from the top-right.  
**Unique Value:** Replaced every `alert()` in the original codebase.  
**How to use:** Automatic on all user actions. No manual interaction needed.  
**Enterprise Use Case:** A smoother UX during long ETL pipelines where multiple alerts would be disruptive.

---

## 25. Brand Console & Dark Mode
**What it is:** Re-skin the entire application: title, tagline, emoji/logo, accent color. Toggle dark mode.  
**Unique Value:** Changes are stored in IndexedDB and applied across all pages instantly.  
**How to use:** Go to **Brand Console**, enter values, and click **Apply Branding**. Toggle dark mode with the switch.  
**Enterprise Use Case:** White-label the platform for a client presentation or school lab.

---

## 26. Progressive Web App (PWA)
**What it is:** A `manifest.json` and meta tags allow installation on desktop and mobile home screens.  
**Unique Value:** Works offline once loaded (libraries are cached by the browser).  
**How to use:** On Chrome/Edge, click the install icon in the address bar.  
**Enterprise Use Case:** Field analysts in remote areas can install the tool as a desktop app and work offline.

---

**DAWF v5 Enhanced — Learning Deliberately. Teaching Authentically.**

*Developed by Adewale Samson Adeagbo (cssadewale) — HMG Academy / HMG Concepts.*
