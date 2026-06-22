/* ===========================================================================
 * DAWF — Shared UI Chrome (sidebar, header, command-K search, dark mode)
 * Loaded on every page AFTER core.js.
 * =========================================================================== */

(function () {
  "use strict";

  const PAGES = [
    { id: "index",      url: "index.html",      icon: "database",         label: "Ingest & Sandboxes",  group: "Workspace Pipeline" },
    { id: "clean",      url: "clean.html",      icon: "sparkles",         label: "Clean & Profile",     group: "Workspace Pipeline" },
    { id: "etl",        url: "etl.html",        icon: "git-merge",        label: "ETL & Power Query",   group: "Workspace Pipeline" },
    { id: "pivot",      url: "pivot.html",      icon: "grid-3x3",         label: "Pivot Matrix",        group: "Workspace Pipeline" },
    { id: "dashboard",  url: "dashboard.html",  icon: "layout-dashboard", label: "Interactive BI",      group: "Workspace Pipeline" },
    { id: "report",     url: "report.html",     icon: "file-text",        label: "Executive Report",    group: "Workspace Pipeline" },
    { id: "sql",        url: "sql.html",        icon: "terminal",         label: "SQL Workbench",       group: "Expert Intelligence", badge: "PRO" },
    { id: "analyst",    url: "analyst.html",    icon: "wrench",           label: "Analyst Modeller",    group: "Expert Intelligence", badge: "PRO" },
    { id: "forecast",   url: "forecast.html",   icon: "trending-up",      label: "Forecast & What-If",  group: "Expert Intelligence", badge: "PRO" },
    { id: "viz",        url: "viz.html",        icon: "bar-chart-2",      label: "Chart Studio",        group: "Expert Intelligence", badge: "NEW" },
    { id: "learn",      url: "learn.html",      icon: "graduation-cap",   label: "Learning Portal",     group: "Knowledge Hub" },
    { id: "brand",      url: "brand.html",      icon: "palette",          label: "Brand Console",       group: "Knowledge Hub" },
    { id: "governance", url: "governance.html", icon: "shield-check",     label: "Governance",          group: "Knowledge Hub" },
    { id: "settings",   url: "settings.html",   icon: "settings",         label: "Settings",            group: "Knowledge Hub" }
  ];

  function currentPage() {
    const f = (location.pathname.split("/").pop() || "index.html").replace(/^$/, "index.html");
    return f.replace(/\?.*$/, "");
  }

  function renderSidebar(target) {
    const page = currentPage();
    const groups = {};
    PAGES.forEach(p => { (groups[p.group] = groups[p.group] || []).push(p); });

    const groupsHtml = Object.entries(groups).map(([g, items]) => `
      <div class="nav-group">
        <span class="nav-label">${g}</span>
        <div class="space-y-1">
          ${items.map(p => `
            <a href="${p.url}" class="nav-link ${page === p.url ? "active" : ""}" data-page="${p.id}">
              <i data-lucide="${p.icon}" class="w-4 h-4"></i>
              <span>${p.label}</span>
              ${p.badge ? `<span class="badge badge-${p.badge.toLowerCase()} ml-auto">${p.badge}</span>` : ""}
            </a>`).join("")}
        </div>
      </div>`).join("");

    target.innerHTML = `
      <div class="sidebar-brand">
        <div class="brand-logo-container">📊</div>
        <div>
          <h2 class="brand-name-text">Data Analysis Workflow</h2>
          <span class="brand-tagline-text">Learning Deliberately. Teaching Authentically.</span>
          <span class="version-pill">Enterprise v${(window.DAWF && DAWF.version) || "7.0"}</span>
        </div>
      </div>
      <nav class="sidebar-nav" id="sidebarLinks">${groupsHtml}</nav>
      <div class="sidebar-footer">
        <div class="profile-card">
          <div class="profile-avatar">AD</div>
          <div>
            <p class="profile-name">Admin Analyst</p>
            <p class="profile-sub">Workspace · client-side</p>
          </div>
        </div>
        <button id="btnLogout" class="logout-btn"><i data-lucide="log-out" class="w-4 h-4"></i> Sign out</button>
      </div>`;
  }

  function renderHeader(target) {
    target.innerHTML = `
      <div class="top-nav-left">
        <button id="sidebarToggle" class="icon-btn lg:hidden" aria-label="Toggle sidebar">
          <i data-lucide="menu" class="w-5 h-5"></i>
        </button>
        <div class="search-wrap">
          <i data-lucide="search" class="w-4 h-4 search-icon"></i>
          <input id="globalSearchBox" type="search" placeholder="Search features… (Ctrl+K)" />
        </div>
        <span id="activeFileBadge" class="active-file-badge hidden">
          <span class="dot"></span> Active: <span id="activeFileName">None</span>
          <span id="activeRowCount" class="muted"></span>
        </span>
      </div>
      <div class="top-nav-right">
        <button id="btnUndo" class="icon-btn" title="Undo (Ctrl+Z)"><i data-lucide="undo-2" class="w-4 h-4"></i></button>
        <button id="btnRedo" class="icon-btn" title="Redo (Ctrl+Shift+Z)"><i data-lucide="redo-2" class="w-4 h-4"></i></button>
        <button id="btnDark"  class="icon-btn" title="Toggle dark mode"><i data-lucide="moon" class="w-4 h-4"></i></button>
        <button id="btnHelp"  class="icon-btn" title="Help & Learning" onclick="location.href='learn.html'"><i data-lucide="help-circle" class="w-4 h-4"></i></button>
        <button id="btnExport" class="btn btn-primary text-xs"><i data-lucide="download" class="w-4 h-4"></i> Export</button>
      </div>`;
  }

  function attachCommandSearch() {
    const box = document.getElementById("globalSearchBox");
    if (!box) return;
    const commands = [
      ...PAGES.map(p => ({ label: p.label, hint: p.group, url: p.url, icon: p.icon })),
      { label: "Upload CSV / Excel",     hint: "Ingestion",  url: "index.html#upload",        icon: "upload" },
      { label: "Sync Google Sheet",      hint: "Ingestion",  url: "index.html#gsheet",        icon: "link" },
      { label: "Load Sample Dataset",    hint: "Sandboxes",  url: "index.html#sandboxes",     icon: "flask-conical" },
      { label: "Trim Whitespace",        hint: "Cleaning",   url: "clean.html",               icon: "type" },
      { label: "Drop Duplicates",        hint: "Cleaning",   url: "clean.html",               icon: "copy-minus" },
      { label: "Treat Outliers (IQR)",   hint: "Cleaning",   url: "clean.html",               icon: "shield-alert" },
      { label: "Calculated Column",      hint: "ETL",        url: "etl.html",                 icon: "calculator" },
      { label: "Join Tables",            hint: "ETL",        url: "etl.html",                 icon: "git-merge" },
      { label: "Pivot Table",            hint: "Analysis",   url: "pivot.html",               icon: "grid-3x3" },
      { label: "Run SQL Query",          hint: "SQL",        url: "sql.html",                 icon: "terminal" },
      { label: "RFM Segmentation",       hint: "Modeller",   url: "analyst.html#rfm",         icon: "target" },
      { label: "Pareto / ABC",           hint: "Modeller",   url: "analyst.html#pareto",      icon: "trending-down" },
      { label: "Benford's Law (Fraud)",  hint: "Modeller",   url: "analyst.html#benford",     icon: "search-check" },
      { label: "Cohort Retention",       hint: "Modeller",   url: "analyst.html#cohort",      icon: "users" },
      { label: "Correlation Matrix",     hint: "Modeller",   url: "analyst.html#corr",        icon: "scatter-chart" },
      { label: "Linear Forecast",        hint: "Forecast",   url: "forecast.html",            icon: "trending-up" },
      { label: "What-If Scenario",       hint: "Forecast",   url: "forecast.html#whatif",     icon: "git-fork" },
      { label: "Goal Seek",              hint: "Forecast",   url: "forecast.html#goal",       icon: "target" },
      { label: "Detect PII",             hint: "Governance", url: "governance.html#pii",      icon: "shield" },
      { label: "Audit Trail",            hint: "Governance", url: "governance.html#audit",    icon: "clipboard-list" },
      { label: "Verify Hash Chain",      hint: "Governance", url: "governance.html#hash",     icon: "key" },
      { label: "Brand Console",          hint: "Settings",   url: "brand.html",               icon: "palette" },
      { label: "Dark Mode",              hint: "Display",    url: "#dark",                    icon: "moon" }
    ];

    let panel;
    function close() { panel?.remove(); panel = null; }
    function open(q) {
      close();
      if (!q) return;
      const ql = q.toLowerCase();
      const hits = commands.filter(c => (c.label + " " + c.hint).toLowerCase().includes(ql)).slice(0, 10);
      panel = document.createElement("div");
      panel.className = "global-search-panel";
      panel.innerHTML = hits.length
        ? hits.map(h => `
            <button class="g-hit" data-url="${h.url}">
              <i data-lucide="${h.icon}" class="w-4 h-4"></i>
              <div><div class="g-hit-label">${h.label}</div><div class="g-hit-hint">${h.hint}</div></div>
            </button>`).join("")
        : `<div class="g-empty">No feature matched “${q}”.</div>`;
      box.parentElement.appendChild(panel);
      if (window.lucide) lucide.createIcons();
      panel.querySelectorAll(".g-hit").forEach(b => b.addEventListener("mousedown", e => {
        e.preventDefault();
        const url = b.dataset.url;
        if (url === "#dark") { document.documentElement.classList.toggle("dark"); DAWF.state.darkMode = document.documentElement.classList.contains("dark"); DAWF._saveStateMeta(); return; }
        location.href = url;
      }));
    }
    box.addEventListener("input", e => open(e.target.value));
    box.addEventListener("blur", () => setTimeout(close, 150));
    document.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); box.focus(); }
    });
  }

  async function updateActiveFileBadge() {
    const b = document.getElementById("activeFileBadge");
    if (!b) return;
    if (DAWF.state.activeFile) {
      b.classList.remove("hidden");
      document.getElementById("activeFileName").textContent = DAWF.state.activeFile;
      document.getElementById("activeRowCount").textContent =
        DAWF.state.dataset.length ? ` · ${DAWF.state.dataset.length.toLocaleString()} rows × ${DAWF.state.columns.length} cols` : "";
    } else {
      b.classList.add("hidden");
    }
  }

  function attachActions() {
    document.getElementById("btnUndo")?.addEventListener("click", () => DAWF.history.undo().then(() => location.reload()));
    document.getElementById("btnRedo")?.addEventListener("click", () => DAWF.history.redo().then(() => location.reload()));
    document.getElementById("btnDark")?.addEventListener("click", async () => {
      document.documentElement.classList.toggle("dark");
      DAWF.state.darkMode = document.documentElement.classList.contains("dark");
      await DAWF._saveStateMeta();
    });
    document.getElementById("btnLogout")?.addEventListener("click", () => {
      sessionStorage.clear();
      DAWF.toast("Signed out (local session only).", "success");
      setTimeout(() => location.href = "index.html", 600);
    });
    document.getElementById("btnExport")?.addEventListener("click", () => {
      if (!DAWF.state.dataset.length) return DAWF.toast("Nothing to export. Upload a dataset first.", "warning");
      DAWF.exportEngine.toCSV(DAWF.state.dataset, DAWF.state.columns);
    });
    document.getElementById("sidebarToggle")?.addEventListener("click", () => {
      document.querySelector(".sidebar")?.classList.toggle("open");
    });
    // global undo / redo keyboard
    document.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); DAWF.history.undo().then(() => location.reload()); }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) { e.preventDefault(); DAWF.history.redo().then(() => location.reload()); }
    });
  }

  function noDatasetCard() {
    return `
      <div class="card p-12 text-center">
        <div class="empty-icon"><i data-lucide="database" class="w-12 h-12"></i></div>
        <h3 class="empty-title">No dataset is loaded yet</h3>
        <p class="empty-sub">Upload a CSV/XLSX, sync a Google Sheet, or pick a sample dataset to begin.</p>
        <a href="index.html" class="btn btn-primary mt-6"><i data-lucide="upload" class="w-4 h-4"></i> Go to Ingest</a>
      </div>`;
  }

  function teachPanel(title, html) {
    return `
      <div class="teach-card">
        <div class="teach-title"><i data-lucide="graduation-cap" class="w-4 h-4"></i>${title}</div>
        <div class="teach-body">${html}</div>
      </div>`;
  }

  /* ----------------------------------------------------------------- */
  window.DAWFUI = {
    PAGES, renderSidebar, renderHeader, attachCommandSearch,
    attachActions, updateActiveFileBadge, noDatasetCard, teachPanel,
    /** Boot helper - call from each page: */
    async boot() {
      await DAWF.ready();
      const sb = document.getElementById("sidebar");
      const hd = document.getElementById("topNav");
      if (sb) renderSidebar(sb);
      if (hd) renderHeader(hd);
      attachCommandSearch();
      attachActions();
      await updateActiveFileBadge();
      if (DAWF.state.darkMode) document.documentElement.classList.add("dark");
      // apply branding
      document.querySelectorAll(".brand-name-text").forEach(e => e.textContent = DAWF.state.brand.name);
      document.querySelectorAll(".brand-tagline-text").forEach(e => e.textContent = DAWF.state.brand.tagline);
      document.querySelectorAll(".brand-logo-container").forEach(e => e.textContent = DAWF.state.brand.logo);
      document.documentElement.style.setProperty("--primary", DAWF.state.brand.color);
      if (window.lucide) lucide.createIcons();
    }
  };
})();
