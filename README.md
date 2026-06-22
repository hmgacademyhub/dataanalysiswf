# 📊 Data Analysis Workflow (DAWF) — Enterprise Edition

Welcome to the **Data Analysis Workflow** platform, a professional, serverless Business Intelligence, ETL, and Data Science ecosystem. 

This platform is designed to transform raw data into executive insights through a progressive, cumulative pipeline—all while ensuring 100% data privacy by processing everything locally in the user's browser.

## 🚀 Core Features

### 1. Data Ingestion Hub
- **Multi-Source Loading:** Support for CSV, Excel (.xlsx, .xls), and direct Google Sheets synchronization.
- **Serverless Sandboxes:** Curated datasets (E-Commerce, HR, Finance) for immediate learning and testing.
- **Client-Side Security:** No data is uploaded to any server; processing occurs in browser RAM.

### 2. Diagnostics & Cleaning
- **Automated Profiling:** Instant dataset overviews, null-value reports, and unique count analysis.
- **Outlier Detection:** Implementation of the 1.5*IQR rule to identify statistical anomalies.
- **Cleaning Toolkit:** Professional tools for trimming whitespace, removing duplicates, and filling missing values.

### 3. Consolidation ETL
- **Dynamic Transformation:** Create calculated columns using JS-based expressions.
- **Schema Management:** Rename or drop columns to refine the data model.
- **Data Shaping:** Tools for sorting and preparing data for high-level analysis.

### 4. Interactive BI Dashboard
- **Executive Scorecards:** Real-time KPI tracking (Totals, Averages, Peaks).
- **Advanced Modelling:** 
    - **RFM Analysis:** Segment customers by Recency, Frequency, and Monetary value.
    - **Pareto (80/20):** Identify the key drivers of your metrics.
    - **Gini Index:** Measure data concentration and risk.
- **Dynamic Visualization:** Interactive Bar and Pie charts powered by Chart.js.

### 5. Governance & Compliance
- **System Audit Trail:** Full chronological log of every transformation applied.
- **Enterprise Matrices:** Access Control and Governance frameworks for organizational standards.
- **Zero-API Architecture:** Guaranteed privacy with no external AI API calls.

### 6. Progressive Learning Portal
- **Cumulative Curriculum:** A 5-level path from Foundation to Enterprise Governance.
- **Instructional Content:** Detailed explanations of every professional data science concept used.

## 🛠️ Tech Stack
- **Frontend:** HTML5, Tailwind CSS, JavaScript (ES6+).
- **Data Processing:** PapaParse (CSV), SheetJS (Excel), AlaSQL (SQL-like queries).
- **Visualization:** Chart.js.
- **Icons:** Lucide Icons.
- **Hosting:** Optimized for GitHub Pages (Static Hosting).

## 📦 Project Structure
- `/css`: Enterprise design system.
- `/js`: Core logic engine (`app.js`).
- `/icons`: Application assets.
- `/index.html`: Ingestion Hub.
- `/clean.html`: Cleaning & Profiling.
- `/etl.html`: ETL Transformation.
- `/dashboard.html`: BI Dashboard.
- `/pivot.html`: Matrix Analysis.
- `/report.html`: Executive Reporting.
- `/governance.html`: Compliance Hub.
- `/learn.html`: Learning Portal.
- `/brand.html`: White-Label Console.
