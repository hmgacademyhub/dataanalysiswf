/**
 * DAWF v5 Enterprise Feature Pack
 * Adds advanced analytics, data governance, and export capabilities.
 */

const EnterpriseFeatures = {
    init: function() {
        this.addLogoutButton();
        this.enhanceVisuals();
        this.setupExportListeners();
        console.log("Enterprise Features Initialized.");
    },

    addLogoutButton: function() {
        const sidebar = document.getElementById("sidebarLinks");
        if (sidebar) {
            const logoutSection = document.createElement("div");
            logoutSection.className = "pt-4 mt-4 border-t border-slate-800";
            logoutSection.innerHTML = `
                <button id="btnLogout" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-extrabold transition-all text-red-400 hover:bg-red-900/20 hover:text-red-300">
                    <i data-lucide="log-out" class="w-4 h-4"></i> Sign Out Securely
                </button>
            `;
            sidebar.appendChild(logoutSection);
            
            document.getElementById("btnLogout").addEventListener("click", () => {
                sessionStorage.removeItem("dawf_authenticated");
                window.location.href = "index.html";
            });
            
            if (window.lucide) lucide.createIcons();
        }
    },

    enhanceVisuals: function() {
        // Add subtle animations to all cards
        document.querySelectorAll('.bg-white.border').forEach(card => {
            card.classList.add('transition-all', 'hover:shadow-lg', 'duration-300');
        });
    },

    setupExportListeners: function() {
        // Find or create an export button in the header or specific pages
        const header = document.querySelector('header');
        if (header) {
            const exportContainer = document.createElement("div");
            exportContainer.className = "flex items-center gap-2 mr-4";
            exportContainer.innerHTML = `
                <div class="relative group">
                    <button class="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-2 rounded-lg text-xs transition-all shadow-sm">
                        <i data-lucide="download" class="w-3.5 h-3.5"></i> Export Data
                    </button>
                    <div class="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl hidden group-hover:block z-50">
                        <div class="p-2 space-y-1">
                            <button onclick="EnterpriseFeatures.exportData('csv')" class="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                <i data-lucide="file-text" class="w-3.5 h-3.5 text-blue-500"></i> Export as CSV
                            </button>
                            <button onclick="EnterpriseFeatures.exportData('json')" class="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                <i data-lucide="code" class="w-3.5 h-3.5 text-amber-500"></i> Export as JSON (Recipe)
                            </button>
                            <button onclick="window.print()" class="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                <i data-lucide="printer" class="w-3.5 h-3.5 text-slate-500"></i> Print to PDF
                            </button>
                        </div>
                    </div>
                </div>
            `;
            header.insertBefore(exportContainer, header.firstChild);
            if (window.lucide) lucide.createIcons();
        }
    },

    exportData: function(format) {
        if (!workingDataset || workingDataset.length === 0) {
            alert("No data available to export.");
            return;
        }

        let content = "";
        let fileName = (activeFileMeta ? activeFileMeta.name.split('.')[0] : "dawf_export") + "_v5";
        let type = "";

        if (format === 'csv') {
            const headers = Object.keys(workingDataset[0]);
            const rows = workingDataset.map(row => headers.map(h => `"${row[h]}"`).join(','));
            content = [headers.join(','), ...rows].join('\n');
            type = "text/csv";
            fileName += ".csv";
        } else if (format === 'json') {
            content = JSON.stringify({
                metadata: activeFileMeta,
                columns: activeColumns,
                settings: pipelineSettings,
                data: workingDataset
            }, null, 2);
            type = "application/json";
            fileName += ".json";
        }

        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    EnterpriseFeatures.init();
});
