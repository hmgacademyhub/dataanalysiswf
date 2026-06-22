# DAWF v5 Enhanced — Deployment Guide

This document provides clear, unambiguous, step-by-step instructions to deploy DAWF v5 Enhanced on free platforms. No build tools, no AI APIs, and no server-side processing are required.

---

## Option A: Local Usage (No Internet After First Load)

This is the fastest way to run DAWF v5 Enhanced on your own machine.

### Step 1: Download the Files
1. Download the `data` folder (or the provided `.zip` file) to your computer.
2. Extract the contents into a folder named `dawf-v5-enhanced`.

### Step 2: Open the Application
3. Double-click `index.html` inside the folder.
4. The application will open in your default browser.

### Step 3: Log In
5. Enter the demo credentials when the auth gate appears:
   - **Passcode:** `HMG2025`

### Step 4: Start Working
6. Upload a CSV or Excel file via the drag-and-drop zone, or load a sandbox dataset.

> **Note:** For full offline capability after the first load, ensure your browser caches the CDN libraries (Tailwind, Chart.js, etc.). If you need 100% offline usage without any CDN, download the library files locally and update the `<script>` and `<link>` tags in each HTML file.

---

## Option B: GitHub Pages (Free Hosting, Recommended)

GitHub Pages is a free, reliable static hosting service. This is the recommended deployment path for sharing the platform with a team or students.

### Step 1: Create a GitHub Repository
1. Go to [https://github.com](https://github.com) and log in to your account.
2. Click the **+** icon (top right) and select **New repository**.
3. Name the repository (e.g., `dawf-v5-enhanced`).
4. Choose **Public** visibility.
5. Do NOT initialize with a README (the repository should be empty).
6. Click **Create repository**.

### Step 2: Upload the Files
7. On the repository page, click the **uploading an existing file** link.
8. Drag the **entire contents** of the `data` folder into the browser window:
   - All `.html` files
   - The `css/` folder (with `style.css` inside)
   - The `js/` folder (with `db.js`, `utils.js`, `app.js`, `auth.js`, `brand.js`, `enterprise.js`, `lineage.js`)
   - The `icons/` folder (with `.png` and `.svg` files)
   - `manifest.json`
   - `README.md`, `FEATURES.md`, `DEPLOYMENT.md`
9. **Important:** Ensure the files are uploaded to the **root** of the repository, not inside a subfolder.
10. Click **Commit changes**.

### Step 3: Enable GitHub Pages
11. In the repository, click **Settings** (tab near the top).
12. In the left sidebar, click **Pages**.
13. Under **Build and deployment > Source**, select **Deploy from a branch**.
14. Under **Branch**, select `main` and `/ (root)`.
15. Click **Save**.
16. Wait 1–2 minutes. GitHub will display a green confirmation box with your live URL: `https://[your-username].github.io/dawf-v5-enhanced/`

### Step 4: Verify
17. Open the URL in a new browser tab.
18. Enter the passcode `HMG2025` and confirm the workspace loads.

---

## Option C: Netlify (Free Hosting with Drag-and-Drop)

Netlify offers a zero-config drag-and-drop deployment that is ideal for rapid prototyping.

### Step 1: Prepare a Zip
1. Select **all files and folders** inside the `data` directory (not the `data` folder itself).
2. Compress them into a `.zip` file named `dawf-v5-enhanced.zip`.

### Step 2: Deploy to Netlify
3. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop).
4. Drag your `dawf-v5-enhanced.zip` onto the drop zone.
5. Netlify will automatically extract and deploy the site.
6. A live URL will be generated instantly (e.g., `https://glowing-daffodil-123456.netlify.app`).

### Step 3: (Optional) Custom Domain
7. In the Netlify dashboard for your new site, go to **Domain settings** to add a custom domain or rename the Netlify subdomain.

---

## Option D: Vercel (Free Hosting with Git Integration)

Vercel is optimized for frontend frameworks and static sites, but works perfectly for vanilla HTML/JS projects.

### Step 1: Import to Vercel
1. Go to [https://vercel.com](https://vercel.com) and log in.
2. Click **Add New Project**.
3. If you pushed the `dawf-v5-enhanced` repository to GitHub, select **Import Git Repository** and choose your repo.
4. If you do not have a GitHub repository, click **Upload** and select the folder containing the extracted files.

### Step 2: Configure Deployment
5. Vercel will auto-detect the project as a static site.
6. Ensure the **Framework Preset** is set to **Other** (or **Vite** if you had a build step, but you do not).
7. Ensure the **Root Directory** is set to the root of the uploaded files (not a subfolder).
8. Click **Deploy**.

### Step 3: Verify
9. Once the build completes (usually under 30 seconds), Vercel will provide a `.vercel.app` URL.
10. Visit the URL and log in with `HMG2025`.

---

## Option E: Surge.sh (Free CLI Static Hosting)

Surge.sh is a fast command-line static hosting tool ideal for developers comfortable with the terminal.

### Step 1: Install Surge
```bash
npm install -g surge
```

### Step 2: Deploy
```bash
cd dawf-v5-enhanced
surge
```

### Step 3: Follow Prompts
- Surge will ask for a project path: press Enter to use the current directory.
- Surge will suggest a random subdomain (e.g., `dawf-v5-enhanced.surge.sh`). Press Enter to accept, or type a custom domain.
- The site will deploy immediately. The URL is printed in the terminal.

---

## Post-Deployment Checklist

After any deployment, verify the following:

1. **Auth Gate:** The passcode `HMG2025` unlocks the workspace.
2. **File Upload:** Drag and drop a `.csv` file. It should parse and redirect to the Clean page.
3. **Excel Upload:** Drag and drop a `.xlsx` file with multiple sheets. The sheet selector should appear.
4. **Google Sheets:** Paste a public Google Sheets URL and sync.
5. **Sandbox:** Click **E-Commerce Sales Performance** and confirm the dataset loads.
6. **Cleaning:** Apply a type cast or null strategy. The quality score should update.
7. **ETL:** Upload a secondary CSV and perform a Left Join or Union.
8. **Dashboard:** Confirm that charts are generated from actual data, not static placeholders.
9. **SQL Terminal:** Run `SELECT * FROM data LIMIT 5` and see results.
10. **Export:** Click **Export > Export as Excel (.xlsx)** and confirm the file downloads.
11. **Dark Mode:** Toggle dark mode on the Brand Console and confirm the UI inverts.
12. **PWA:** On Chrome mobile, open the site and confirm the "Add to Home Screen" prompt appears.

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "SheetJS library not available" when uploading Excel | CDN not loaded or blocked | Check internet connection; if offline, vendor `xlsx.full.min.js` locally and update the `<script>` tag in all HTML files. |
| Charts show no data or "No data for dashboard" | No working dataset in IndexedDB | Upload a file or load a sandbox from the Ingestion page. |
| Auth gate keeps reappearing | `sessionStorage` cleared | Re-enter `HMG2025`. If the issue persists, check browser settings for strict cookie blocking. |
| Undo / Redo do not work | IndexedDB blocked | Ensure the browser allows IndexedDB for the domain. In private browsing, some browsers disable IndexedDB. |
| Sidebar looks broken on mobile | Sidebar is fixed width | Resize to desktop or use a tablet/desktop view; the current layout is optimized for 1024px+ width. |
| Google Sheets sync fails | Sheet is not public | Open the Google Sheet, click **Share**, set to **Anyone with the link can view**, then copy the link again. |

---

**Developed by:** Adewale Samson Adeagbo (cssadewale)  
**Organization:** HMG Academy / HMG Concepts  
**Date:** 2026-06-22
