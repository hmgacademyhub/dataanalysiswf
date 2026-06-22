/**
 * DAWF v5 Enhanced — Enterprise Features: Export, Logout, Data Dictionary, UI Enhancements
 */
const EnterpriseFeatures = {
  init: function() {
    this.addLogoutButton();
    this.addExportButtons();
    this.addUndoRedoButtons();
    this.addDataDictionaryLink();
    this.addFeatureGuideLink();
    this.addWorkspaceHealthLink();
    this.addCommandSearch();
    this.enhanceVisuals();
    console.log("Enterprise Features Initialized.");
  },

  addLogoutButton: function() {
    const sidebar = document.getElementById("sidebarLinks");
    if (!sidebar) return;
    const existing = document.getElementById("btnLogout");
    if (existing) return;
    const div = document.createElement("div");
    div.className = "pt-4 mt-4 border-t border-slate-800";
    div.innerHTML = `
      <button id="btnLogout" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-extrabold transition-all text-red-400 hover:bg-red-900/20 hover:text-red-300">
        <i data-lucide="log-out" class="w-4 h-4"></i> Sign Out Securely
      </button>
    `;
    sidebar.appendChild(div);
    document.getElementById("btnLogout").addEventListener("click", () => {
      sessionStorage.removeItem("dawf_authenticated");
      sessionStorage.removeItem("dawf_auth_time");
      sessionStorage.removeItem("dawf_tier");
      window.location.href = "index.html";
    });
    safeLucideCreate();
  },

  addUndoRedoButtons: function() {
    const header = document.querySelector('header');
    if (!header) return;
    const container = document.createElement("div");
    container.className = "flex items-center gap-2 mr-4 no-print";
    container.id = "undoRedoContainer";
    container.innerHTML = `
      <button id="btnUndo" class="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2.5 py-1.5 rounded-lg text-[10px] border border-slate-200 transition-all" title="Undo last transformation">
        <i data-lucide="undo-2" class="w-3 h-3"></i> Undo
      </button>
      <button id="btnRedo" class="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2.5 py-1.5 rounded-lg text-[10px] border border-slate-200 transition-all" title="Redo transformation">
        <i data-lucide="redo-2" class="w-3 h-3"></i> Redo
      </button>
    `;
    header.insertBefore(container, header.firstChild);
    document.getElementById("btnUndo").addEventListener("click", async () => {
      const ok = await UndoManager.undo();
      if (ok) { showToast("Undo applied", "success"); window.location.reload(); }
      else showToast("Nothing to undo", "warning");
    });
    document.getElementById("btnRedo").addEventListener("click", async () => {
      const ok = await UndoManager.redo();
      if (ok) { showToast("Redo applied", "success"); window.location.reload(); }
      else showToast("Nothing to redo", "warning");
    });
    safeLucideCreate();
  },

  addExportButtons: function() {
    const header = document.querySelector('header');
    if (!header) return;
    const div = document.createElement("div");
    div.className = "relative group mr-4 no-print";
    div.innerHTML = `
      <button class="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-2 rounded-lg text-xs transition-all shadow-sm">
        <i data-lucide="download" class="w-3.5 h-3.5"></i> Export
      </button>
      <div class="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl hidden group-hover:block z-50 p-2">
        <div class="space-y-1">
          <button id="btnExportCSV" class="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
            <i data-lucide="file-text" class="w-3.5 h-3.5 text-blue-500"></i> Export as CSV
          </button>
          <button id="btnExportXLSX" class="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
            <i data-lucide="sheet" class="w-3.5 h-3.5 text-green-500"></i> Export as Excel (.xlsx)
          </button>
          <button id="btnExportJSON" class="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
            <i data-lucide="code" class="w-3.5 h-3.5 text-amber-500"></i> Export as JSON (Recipe)
          </button>
          <button id="btnSaveRecipe" class="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
            <i data-lucide="save" class="w-3.5 h-3.5 text-violet-500"></i> Save Workspace Recipe
          </button>
          <button onclick="window.print()" class="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
            <i data-lucide="printer" class="w-3.5 h-3.5 text-slate-500"></i> Print / Save PDF
          </button>
        </div>
      </div>
    `;
    header.insertBefore(div, header.firstChild);
    safeLucideCreate();

    document.getElementById("btnExportCSV")?.addEventListener("click", () => this.exportData('csv'));
    document.getElementById("btnExportXLSX")?.addEventListener("click", () => this.exportData('xlsx'));
    document.getElementById("btnExportJSON")?.addEventListener("click", () => this.exportData('json'));
    document.getElementById("btnSaveRecipe")?.addEventListener("click", () => saveRecipe());
  },

  addDataDictionaryLink: function() {
    const sidebar = document.getElementById("sidebarLinks");
    if (!sidebar) return;
    const section = document.createElement("div");
    section.innerHTML = `
      <span class="block px-2 text-[10px] font-extrabold uppercase text-slate-500 tracking-widest pt-4 mb-2">Data Governance</span>
      <a href="#" id="btnDataDictionary" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-extrabold transition-all text-slate-400 hover:bg-slate-800/50 hover:text-white">
        <i data-lucide="book-open" class="w-4 h-4"></i> Data Dictionary
      </a>
    `;
    sidebar.appendChild(section);
    document.getElementById("btnDataDictionary")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.showDataDictionary();
    });
    safeLucideCreate();
  },

  showDataDictionary: async function() {
    const cols = await StateDB.get("original_columns") || [];
    const ds = await StateDB.get("working_dataset") || [];
    const settings = await StateDB.get("pipeline_settings") || {};
    if (!cols.length) { showToast("No active dataset to describe.", "warning"); return; }
    let html = `<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"><div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
      <div class="flex justify-between items-center mb-4"><h3 class="text-lg font-black">Data Dictionary</h3><button id="closeDict" class="text-slate-400 hover:text-slate-700"><i data-lucide="x" class="w-5 h-5"></i></button></div>
      <table class="w-full text-left text-xs border-collapse"><thead><tr class="bg-slate-50 border-b"><th class="p-3">Column</th><th class="p-3">Type</th><th class="p-3">Non-Null</th><th class="p-3">Unique</th><th class="p-3">Sample</th></tr></thead><tbody>`;
    for (const col of cols) {
      const vals = ds.map(r => r[col]);
      const nonNull = vals.filter(v => v !== null && v !== undefined && String(v).trim() !== '').length;
      const unique = new Set(vals).size;
      const type = inferType(vals);
      const sample = vals.slice(0,3).join(', ');
      html += `<tr class="border-b"><td class="p-3 font-bold">${settings[col]?.rename || col}</td><td class="p-3 capitalize">${type}</td><td class="p-3">${nonNull}/${vals.length}</td><td class="p-3">${unique}</td><td class="p-3 text-slate-500 italic">${sample}</td></tr>`;
    }
    html += `</tbody></table></div></div>`;
    const div = document.createElement('div'); div.id = 'dictModal'; div.innerHTML = html;
    document.body.appendChild(div);
    safeLucideCreate();
    document.getElementById('closeDict').addEventListener('click', () => div.remove());
    div.addEventListener('click', (e) => { if (e.target === div) div.remove(); });
  },



  addFeatureGuideLink: function() {
    const sidebar = document.getElementById("sidebarLinks");
    if (!sidebar || document.getElementById("btnFeatureGuide")) return;
    const section = document.createElement("div");
    section.innerHTML = `
      <a href="#" id="btnFeatureGuide" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-extrabold transition-all text-slate-400 hover:bg-slate-800/50 hover:text-white">
        <i data-lucide="list-checks" class="w-4 h-4"></i> Feature Guide
      </a>
    `;
    sidebar.appendChild(section);
    document.getElementById("btnFeatureGuide")?.addEventListener("click", (e) => { e.preventDefault(); this.showFeatureGuide(); });
    safeLucideCreate();
  },

  addWorkspaceHealthLink: function() {
    const sidebar = document.getElementById("sidebarLinks");
    if (!sidebar || document.getElementById("btnWorkspaceHealth")) return;
    const section = document.createElement("div");
    section.innerHTML = `
      <a href="#" id="btnWorkspaceHealth" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-extrabold transition-all text-slate-400 hover:bg-slate-800/50 hover:text-white">
        <i data-lucide="activity" class="w-4 h-4"></i> Workspace Health
      </a>
    `;
    sidebar.appendChild(section);
    document.getElementById("btnWorkspaceHealth")?.addEventListener("click", (e) => { e.preventDefault(); this.showWorkspaceHealth(); });
    safeLucideCreate();
  },

  addCommandSearch: function() {
    const header = document.querySelector('header');
    if (!header || document.getElementById('globalSearchBox')) return;
    const wrap = document.createElement('div');
    wrap.className = 'relative max-w-xs flex-1 hidden md:block no-print';
    wrap.innerHTML = `<input id="globalSearchBox" type="search" aria-label="Search DAWF features" placeholder="Search features... Ctrl+K" class="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"><i data-lucide="search" class="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400"></i>`;
    header.insertBefore(wrap, header.firstChild);
    const box = document.getElementById('globalSearchBox');
    const commands = [
      ['Ingest local CSV/Excel', 'index.html', 'Upload files, Google Sheets, and offline sandboxes'],
      ['Clean and profile', 'clean.html', 'Quality score, missing values, duplicates, type casting'],
      ['Consolidation ETL', 'etl.html', 'Union, join, and calculated columns'],
      ['Interactive BI dashboard', 'dashboard.html', 'Auto charts, KPIs, cross filters'],
      ['Pivot matrix', 'pivot.html', 'Drag-free aggregation and summaries'],
      ['SQL terminal', 'sql.html', 'Browser SQL over the active dataset'],
      ['Analyst modeller', 'analyst.html', 'RFM, Benford, moving average, statistics'],
      ['Executive report', 'report.html', 'Markdown report with live data tokens'],
      ['Learning portal', 'learn.html', 'Glossary and workflow lessons'],
      ['Brand console', 'brand.html', 'White label and dark mode'],
      ['Data dictionary', '#dictionary', 'Schema, type, uniqueness and samples'],
      ['Workspace health', '#health', 'Quality, security, and capability audit']
    ];
    const openResults = (q) => {
      document.getElementById('globalSearchResults')?.remove();
      if (!q) return;
      const hits = commands.filter(c => (c[0] + ' ' + c[2]).toLowerCase().includes(q.toLowerCase())).slice(0, 8);
      const panel = document.createElement('div'); panel.id='globalSearchResults'; panel.className='absolute top-12 left-0 w-96 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2';
      panel.innerHTML = hits.map(h => `<button class="global-hit w-full text-left p-3 hover:bg-violet-50 rounded-lg border-b last:border-0" data-url="${h[1]}"><div class="text-xs font-black text-slate-800">${h[0]}</div><div class="text-[10px] text-slate-500">${h[2]}</div></button>`).join('') || `<div class="p-3 text-xs text-slate-400">No feature matched.</div>`;
      wrap.appendChild(panel);
      panel.querySelectorAll('.global-hit').forEach(btn => btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        if (url === '#dictionary') this.showDataDictionary(); else if (url === '#health') this.showWorkspaceHealth(); else window.location.href = url;
      }));
    };
    box.addEventListener('input', e => openResults(e.target.value));
    box.addEventListener('blur', () => setTimeout(()=>document.getElementById('globalSearchResults')?.remove(), 180));
    document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); box.focus(); } });
    safeLucideCreate();
  },

  showFeatureGuide: function() {
    const features = [
      ['Ingestion & Sandboxes', 'Upload CSV/Excel, sync public Google Sheets, import workspace recipes, or load deterministic sample sandboxes. CSV works even when external CDNs are blocked.'],
      ['Data Cleaning & Profiling', 'Quality score, duplicate detection, null handling, type inference, schema controls, preview grid, find/replace, and deterministic auto-fixes.'],
      ['Consolidation ETL', 'Union/append datasets, key-based joins, and browser-based calculated columns without a server.'],
      ['Interactive BI', 'Automatic KPI cards, category/numeric charts, cross-filtering, and export/print workflows.'],
      ['Pivot Matrix', 'No-code row/column/value aggregation for quick summary tables.'],
      ['SQL Terminal', 'AlaSQL query engine with an offline fallback for simple SELECT statements.'],
      ['Analyst Modeller', 'RFM segmentation, Benford fraud screen, moving average trend model, and descriptive statistics.'],
      ['Governance', 'Data dictionary, lineage timeline, undo/redo snapshots, workspace health audit, local IndexedDB persistence, and exportable recipes.'],
      ['Enterprise Readiness', 'White-label branding, dark mode, local license gate, PWA manifest, SEO metadata, and client-side privacy by design.']
    ];
    const div = document.createElement('div'); div.id = 'featureGuideModal';
    div.innerHTML = `<div class="fixed inset-0 z-50 bg-slate-900/70 p-4 flex items-center justify-center"><div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6"><div class="flex justify-between items-center mb-4"><h3 class="text-lg font-black">DAWF Feature Guide</h3><button id="closeFeatureGuide" class="text-slate-400 hover:text-slate-700">✕</button></div><div class="grid gap-3">${features.map(f=>`<div class="border rounded-xl p-4"><h4 class="text-sm font-black text-violet-700">${f[0]}</h4><p class="text-xs text-slate-500 mt-1">${f[1]}</p></div>`).join('')}</div></div></div>`;
    document.body.appendChild(div);
    document.getElementById('closeFeatureGuide').addEventListener('click', () => div.remove());
    div.firstChild.addEventListener('click', e => { if (e.target === div.firstChild) div.remove(); });
  },

  showWorkspaceHealth: async function() {
    const ds = await StateDB.get('working_dataset') || [];
    const cols = await StateDB.get('active_columns') || [];
    const meta = await StateDB.get('active_file_meta') || null;
    const quality = computeQualityScore(ds, cols, await StateDB.get('pipeline_settings') || {});
    const checks = [
      ['Dataset loaded', !!ds.length, ds.length ? `${ds.length.toLocaleString()} rows / ${cols.length} columns` : 'No active dataset'],
      ['Client-side privacy', true, 'Data stays in browser IndexedDB/RAM unless user exports it'],
      ['Quality score', quality.score >= 70, `${quality.score}/100 with ${quality.issues.length} issue(s)`],
      ['External dependency resilience', true, 'CSV, search, simple SQL and markdown have local fallbacks'],
      ['SEO readiness', !!document.querySelector('meta[name="description"]'), 'Description, canonical, and structured data should be present on public pages'],
      ['Export readiness', true, 'CSV/JSON always available; XLSX available when SheetJS loads']
    ];
    const div = document.createElement('div'); div.id='healthModal';
    div.innerHTML = `<div class="fixed inset-0 z-50 bg-slate-900/70 p-4 flex items-center justify-center"><div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6"><div class="flex justify-between items-center mb-4"><h3 class="text-lg font-black">Workspace Health Audit</h3><button id="closeHealth" class="text-slate-400 hover:text-slate-700">✕</button></div><p class="text-xs text-slate-500 mb-4">Active source: <strong>${meta?.name || 'None'}</strong></p><div class="space-y-2">${checks.map(c=>`<div class="flex items-start gap-3 border rounded-xl p-3"><span class="mt-0.5 w-3 h-3 rounded-full ${c[1]?'bg-emerald-500':'bg-amber-500'}"></span><div><div class="text-xs font-black text-slate-800">${c[0]}</div><div class="text-[11px] text-slate-500">${c[2]}</div></div></div>`).join('')}</div></div></div>`;
    document.body.appendChild(div);
    document.getElementById('closeHealth').addEventListener('click', () => div.remove());
    div.firstChild.addEventListener('click', e => { if (e.target === div.firstChild) div.remove(); });
  },

  enhanceVisuals: function() {
    document.querySelectorAll('.bg-white.border').forEach(card => {
      card.classList.add('transition-all', 'hover:shadow-lg', 'duration-300');
    });
  },

  exportData: async function(format) {
    const ds = await StateDB.get("working_dataset") || [];
    if (!ds.length) { showToast("No data available to export.", "warning"); return; }
    const meta = await StateDB.get("active_file_meta") || { name: "dawf_export" };
    const baseName = (meta.name || "export").split('.')[0];

    if (format === 'csv') {
      const headers = Object.keys(ds[0]);
      const rows = ds.map(row => headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','));
      const blob = new Blob([headers.join(',') + '\n' + rows.join('\n')], {type: 'text/csv'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${baseName}.csv`; a.click(); URL.revokeObjectURL(a.href);
      showToast('CSV exported successfully', 'success');
    } else if (format === 'json') {
      const payload = { metadata: meta, columns: Object.keys(ds[0]), data: ds };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${baseName}_recipe.json`; a.click(); URL.revokeObjectURL(a.href);
      showToast('JSON exported successfully', 'success');
    } else if (format === 'xlsx') {
      if (typeof XLSX === 'undefined') { showToast('SheetJS library not loaded. Cannot export XLSX.', 'error'); return; }
      const ws = XLSX.utils.json_to_sheet(ds);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      XLSX.writeFile(wb, `${baseName}.xlsx`);
      showToast('Excel exported successfully', 'success');
    }
  }
};

document.addEventListener("DOMContentLoaded", () => EnterpriseFeatures.init());
