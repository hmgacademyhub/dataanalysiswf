# 🚀 Deployment Guide: Data Analysis Workflow v6.1

Follow these steps to deploy the **Data Analysis Workflow** platform. Since it is a serverless, static application, it can be hosted on any static site provider (GitHub Pages, Vercel, Netlify, etc.).

## 📂 Deployment via GitHub Pages (Recommended)

### Step 1: Create the Repository
1. Log in to your GitHub account.
2. Click the **+** icon (top right) $\rightarrow$ **New repository**.
3. Name your repository (e.g., `data-analysis-workflow`).
4. Set the visibility to **Public**.
5. Click **Create repository**.

### Step 2: Upload the Files
1. Inside your new repository, click **uploading an existing file**.
2. Open the `data analysis v2` folder on your computer.
3. Drag and drop **everything** inside that folder (including the `css` and `js` folders, and all `.html` files) into the GitHub upload window.
4. Add a commit message (e.g., "Deploy DAWF v6.1 Enterprise") and click **Commit changes**.

### Step 3: Enable GitHub Pages
1. Go to the **Settings** tab of your repository.
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment** $\rightarrow$ **Branch**, select `main` (or `master`) and the `/ (root)` folder.
4. Click **Save**.

### Step 4: Access the Platform
- Your site will be live at: `https://yourusername.github.io/data-analysis-workflow/`.
- (Note: It may take 1-2 minutes for the site to activate for the first time).

---

## ⚙️ Technical Configuration & Customization

### 🎨 White-Labeling (Permanent Branding)
To change the platform identity permanently (instead of using the Brand Console):
1. Open `js/app.js`.
2. Find the `DAWF.state.config` object.
3. Update the `brandName`, `brandTagline`, and `primaryColor`.
4. Push the changes to GitHub.

### 🔐 Security & Data Privacy
This platform uses a **Zero-API Architecture**. 
- **No data is sent to a server.**
- **No AI API calls are made.**
- All processing is done in the user's Browser RAM.
- This makes the platform compliant with the strictest data privacy laws (GDPR/HIPAA) by design.

### 📈 SEO Tips for Visibility
To make the platform searchable:
1. **Custom Domain:** Link a professional domain in GitHub Pages settings.
2. **Metadata:** Edit the `<title>` and `<meta name="description">` tags in `index.html` to include your keywords.
3. **Sitemap:** Create a `sitemap.xml` file in the root folder to help search engines index all the hubs.
