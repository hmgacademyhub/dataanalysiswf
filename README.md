# 📊 Data Analysis Workflow (DAWF) — Enterprise Edition v6.1

Welcome to the **Data Analysis Workflow** platform, the ultimate serverless, client-side ecosystem for professional data analysts. 

DAWF is designed to mirror the complete professional workflow of a data analyst—combining the versatility of **Excel**, the structural power of **MySQL Workbench**, the transformation capabilities of **Power Query**, and the visualization strength of **Power BI/Tableau**—all within a single, private, browser-based environment.

## 🚀 The Professional Analyst's Pipeline

The platform is structured as a cumulative pipeline. Each stage builds upon the previous one:

### 1. Ingestion & Sandboxes (The Entry Point)
- **Multi-Format Support:** Load CSV, XLSX, and XLS files.
- **Cloud Integration:** Direct synchronization with public Google Sheets.
- **Zero-Server Architecture:** Data is loaded into Browser RAM, ensuring 100% privacy.
- **Sample Sandboxes:** Pre-curated professional datasets for rapid testing and learning.

### 2. Diagnostics & Cleaning (The Data Quality Stage)
- **Automated Profiling:** Instant detection of data types, null rates, and unique value distributions.
- **Outlier Detection:** Statistical flagging of anomalies using the 1.5*IQR (Interquartile Range) rule.
- **Professional Cleaning:** Tools for whitespace trimming, duplicate removal, and intelligent missing-value imputation (Constant or Mean).

### 3. Consolidation ETL (The Structural Stage)
- **Calculated Columns:** Create new business metrics using JS-based expressions (e.g., `[Price] * [Quantity]`).
- **Dataset Merging (Joins):** Perform professional Inner and Left Outer Joins to combine multiple datasets.
- **Schema Management:** Drop or rename columns to refine your analytic model.

### 4. SQL Terminal (The Expert Query Stage)
- **Browser-Resident SQL:** Full SQL querying capabilities using the AlaSQL engine.
- **MySQL Experience:** Write complex `SELECT`, `GROUP BY`, and `JOIN` queries directly against your loaded data.
- **Real-time Results:** Instant result set generation with execution timing.

### 5. Pivot Matrix (The Cross-Tabulation Stage)
- **Dynamic Pivoting:** Drag-and-drop style configuration for rows, columns, and measures.
- **Multiple Aggregations:** Support for Sum, Count, and Average.
- **Exportable Matrices:** Generate cross-tab reports ready for export.

### 6. Interactive BI Dashboard (The Storytelling Stage)
- **Dynamic Slicers:** Global filters that update all visualizations in real-time.
- **KPI Scorecards:** High-level executive metrics (Total, Average, Peak).
- **Visual Analytics:** Interactive Bar and Pie charts powered by Chart.js.
- **Advanced Modelling:**
    - **RFM Analysis:** Customer segmentation by Recency, Frequency, and Monetary value.
    - **Pareto (80/20):** Identification of the key drivers of your metrics.
    - **Cohort Analysis:** User retention and churn tracking over time.

### 7. Executive Reporting & Governance (The Final Delivery)
- **Print-Ready Reports:** Professional, formatted reports optimized for PDF export.
- **System Audit Trail:** A full, timestamped chronological log of every transformation applied to the data.
- **Enterprise Frameworks:** Access Control Matrices and Zero-API Privacy guarantees.

## 🛠️ Tech Stack
- **Frontend:** HTML5, Tailwind CSS, JavaScript (ES6+).
- **Data Engine:** PapaParse (CSV), SheetJS (Excel), AlaSQL (SQL).
- **Visualization:** Chart.js.
- **Icons:** Lucide Icons.
- **Persistence:** Browser `localStorage` (ensures data persists across page navigation).

## 📦 Project Structure
- `/css`: Enterprise Design System.
- `/js`: Core Logic Engine (`app.js`).
- `/icons`: Application assets.
- `index.html` $\rightarrow$ Ingestion Hub.
- `clean.html` $\rightarrow$ Diagnostics & Cleaning.
- `etl.html` $\rightarrow$ Consolidation ETL.
- `sql.html` $\rightarrow$ SQL Terminal.
- `pivot.html` $\rightarrow$ Pivot Matrix.
- `dashboard.html` $\rightarrow$ Interactive BI.
- `analyst.html` $\rightarrow$ Analyst Modeller.
- `report.html` $\rightarrow$ Executive Reporting.
- `governance.html` $\rightarrow$ Compliance Hub.
- `learn.html` $\rightarrow$ Learning Portal.
- `brand.html` $\rightarrow$ White-Label Console.
