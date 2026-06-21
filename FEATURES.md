# DAWF v2 Enhanced — Enterprise Feature Documentation

This document provides a detailed technical and functional overview of the features available in DAWF v2 Enhanced.

## 1. In-Memory SQL Query Engine (AlaSQL)
*   **What it is:** A professional SQL terminal integrated directly into the browser.
*   **Unique Value:** Allows advanced users to perform complex aggregations, window functions, and subqueries using standard SQL syntax without needing a database server.
*   **How to use:** Navigate to the **SQL Terminal** and write queries like `SELECT Category, SUM(Sales) AS Total FROM data GROUP BY Category`.
*   **Enterprise Use Case:** Auditing data for specific anomalies or generating ad-hoc report tables for stakeholders.

## 2. Executive Markdown Reporter
*   **What it is:** A code-first reporting environment that combines Markdown documentation with dynamic data injection.
*   **Unique Value:** Analysts can write professional narratives around their data. Using `{{placeholder}}` syntax, the report automatically updates with real-time metrics (e.g., `{{total_rows}}`).
*   **How to use:** Go to **Executive Report**. Type your findings. The live preview on the right shows the formatted document, ready for PDF export.
*   **Enterprise Use Case:** Creating automated weekly performance summaries or compliance reports.

## 3. Data Lineage Visualizer
*   **What it is:** A graphical representation of the data lifecycle within the platform.
*   **Unique Value:** Tracks the provenance of data from ingestion through cleaning and transformation to final visualization.
*   **How to use:** Visible on the **Consolidation ETL** page. It updates dynamically as you perform actions in the pipeline.
*   **Enterprise Use Case:** Data governance and transparency—ensuring that the source and transformations are clear for auditors.

## 4. Calculated Field Constructor
*   **What it is:** An Excel-like formula builder using JavaScript logic to create new columns.
*   **Unique Value:** Enables "feature engineering" without altering the source file. You can create metrics like `Profit_Margin` or `Full_Name` on the fly.
*   **How to use:** On the **Clean & Profile** page, enter a new column name and a JS expression like `row['Sales'] - row['Cost']`.
*   **Enterprise Use Case:** Custom business logic implementation (e.g., tax calculations, currency conversions).

## 5. Client-Side Join & Blending
*   **What it is:** Advanced ETL logic that allows joining two separate datasets (e.g., Sales.csv + Customers.xlsx) using Left or Inner Joins.
*   **Unique Value:** Most browser-based tools only support single files. DAWF v2 allows relational modeling in-browser.
*   **How to use:** Upload your primary file, go to **Consolidation ETL**, upload a secondary file, select the join keys, and merge.
*   **Enterprise Use Case:** Enriching transaction data with customer demographics or product catalogs.

## 6. Deterministic Data Quality Advisor
*   **What it is:** An automated auditing tool that scans for null values, duplicates, and type mismatches.
*   **Unique Value:** Acts as a "First-Pass Auditor" to ensure data integrity before visualization.
*   **How to use:** View the "Quality Score" and "Advisor Panel" on the **Clean & Profile** page.
*   **Enterprise Use Case:** Ensuring data accuracy for critical financial or scientific decision-making.

## 7. PWA & Offline Security
*   **What it is:** A Progressive Web App architecture ensuring 100% data privacy.
*   **Unique Value:** No data ever touches a server. Everything happens in your browser's RAM.
*   **How to use:** Works instantly on any modern browser. Can be "Installed" as a desktop/mobile app.
*   **Enterprise Use Case:** High-security environments where data cannot leave the local machine (GDPR/HIPAA compliance).

---
**DAWF v2 Enhanced — Learning Deliberately. Teaching Authentically.**
