# 🚀 Deployment Guide: Data Analysis Workflow

Follow these detailed steps to deploy the **Data Analysis Workflow** platform to GitHub Pages or any other static hosting provider.

## 🛠️ Prerequisites
- A GitHub account.
- A basic understanding of Git or the GitHub web interface.

## 📂 Deployment Steps (GitHub Pages - Easiest Method)

### Method 1: Using the GitHub Web Interface (No Coding Required)
1. **Create a New Repository:**
   - Log in to GitHub and click the **+** icon in the top right $\rightarrow$ **New repository**.
   - Name your repository (e.g., `data-analysis-workflow`).
   - Set it to **Public**.
   - Click **Create repository**.

2. **Upload the Files:**
   - Inside your new repository, click **uploading an existing file**.
   - Drag and drop all files and folders from the `data` folder (including `css`, `js`, `icons`, and all `.html` files) into the browser.
   - Add a commit message (e.g., "Initial deployment of DAWF v6") and click **Commit changes**.

3. **Activate GitHub Pages:**
   - Go to the **Settings** tab of your repository.
   - In the left sidebar, click **Pages**.
   - Under **Build and deployment** $\rightarrow$ **Branch**, select `main` (or `master`) and the `/ (root)` folder.
   - Click **Save**.

4. **Access Your Site:**
   - GitHub will provide a URL (e.g., `https://yourusername.github.io/data-analysis-workflow/`).
   - Wait 1-2 minutes, and your platform will be live!

### Method 2: Using Git CLI (For Developers)
```bash
# 1. Clone your empty repository
git clone https://github.com/yourusername/data-analysis-workflow.git
cd data-analysis-workflow

# 2. Copy the contents of the 'data' folder into this directory
cp -r ../data/* .

# 3. Add, commit, and push
git add .
git commit -m "Deploy Data Analysis Workflow v6"
git push origin main
```
*Then follow Step 3 from Method 1 to activate GitHub Pages.*

## ⚙️ Post-Deployment Configuration

### 🎨 White-Labeling (Custom Branding)
To permanently change the platform's name and colors:
1. Open `js/app.js`.
2. Locate the `DAWF.state.config` object.
3. Update the `brandName`, `brandTagline`, and `primaryColor` values.
4. Commit and push the changes to GitHub.

### 🔐 Security Note
The current authentication gate uses a client-side passcode (`HMG2025`). While this prevents casual access, remember that since this is a static site, the passcode is visible in the source code. For higher security, consider deploying behind a proxy or using a service like Cloudflare Access.

## 📈 SEO Optimization Tips
To make your platform more searchable:
1. **Custom Domain:** Link a custom domain in GitHub Pages settings.
2. **Metadata:** The site already includes meta tags. To customize them, edit the `<head>` section of `index.html`.
3. **Sitemap:** Create a `sitemap.xml` file in the root directory listing all the HTML pages.
