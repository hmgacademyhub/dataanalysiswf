/**
 * DAWF v5 Enhanced — Enterprise Features: Export, Logout, Data Dictionary, UI Enhancements
 */
const EnterpriseFeatures = {
  init: function() {
    this.addLogoutButton();
    this.addExportButtons();
    this.addUndoRedoButtons();
    this.addDataDictionaryLink();
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
    if (window.lucide) lucide.createIcons();
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
    if (window.lucide) lucide.createIcons();
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
    if (window.lucide) lucide.createIcons();

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
    if (window.lucide) lucide.createIcons();
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
    if (window.lucide) lucide.createIcons();
    document.getElementById('closeDict').addEventListener('click', () => div.remove());
    div.addEventListener('click', (e) => { if (e.target === div) div.remove(); });
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
