# Deployment Guide — GitHub Pages and Free Static Hosting

## Option A: GitHub Pages
1. Unzip `dataanalysiswf_fixed.zip` or copy the contents of the `data/` folder.
2. Commit all files to the root of `https://github.com/hmgacademyhub/dataanalysiswf`.
3. Go to GitHub repository **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/root`, then save.
6. Wait for the GitHub Pages action to finish.
7. Open `https://hmgacademyhub.github.io/dataanalysiswf/`.
8. Hard-refresh the browser to avoid old cached JS.
9. Test passcode `HMG2025`, CSV upload, sandbox buttons, Ctrl+K search and Workspace Health.

## Option B: Cloudflare Pages
1. Create a Cloudflare Pages project from the GitHub repo.
2. Framework preset: **None**.
3. Build command: leave empty.
4. Output directory: `/`.
5. Deploy.

## Option C: Netlify
1. Drag the unzipped folder into Netlify Drop, or connect GitHub.
2. Build command: leave empty.
3. Publish directory: `/`.
4. Deploy.

## Cache control after deploying fixes
If users still see non-clickable controls, ask them to clear site data or open DevTools → Application → Clear storage. GitHub Pages can cache JS aggressively.

## Search engine indexing
- Keep `robots.txt` and `sitemap.xml` in the root.
- Submit `https://hmgacademyhub.github.io/dataanalysiswf/sitemap.xml` to Google Search Console and Bing Webmaster Tools.
- Ensure the repository is public and GitHub Pages is reachable without login.
- Avoid putting the entire app content behind a server-side noindex or password page. The current client-side gate does not prevent crawlers from reading static text.
