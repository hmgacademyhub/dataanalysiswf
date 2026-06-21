/**
 * DAWF v2 Lineage Visualizer
 * Tracks and displays the flow of data from Source to Final Dashboard.
 */

const DataLineage = {
    init: function() {
        const container = document.getElementById("lineageVisualizer");
        if (!container) return;
        this.renderLineage(container);
    },

    renderLineage: async function(container) {
        const meta = await StateDB.get("active_file_meta");
        const steps = [
            { id: 1, name: "Source Ingestion", desc: meta ? `Loaded: ${meta.name}` : "No file loaded", icon: "database", status: meta ? "done" : "pending" },
            { id: 2, name: "Data Cleaning", desc: "Type casting & null handling applied", icon: "sparkles", status: meta ? "done" : "pending" },
            { id: 3, name: "Transformation", desc: "Calculated fields & ETL Joins", icon: "git-merge", status: "active" },
            { id: 4, name: "BI Visualization", desc: "Interactive charts generated", icon: "layout-dashboard", status: "pending" }
        ];

        let html = `<div class="flex flex-col md:flex-row items-center justify-between gap-4 p-8">`;
        
        steps.forEach((step, index) => {
            const isLast = index === steps.length - 1;
            const colorClass = step.status === "done" ? "bg-emerald-500" : (step.status === "active" ? "bg-violet-600 animate-pulse" : "bg-slate-200");
            const textColor = step.status === "pending" ? "text-slate-400" : "text-slate-900";

            html += `
                <div class="flex-1 flex flex-col items-center text-center group">
                    <div class="w-12 h-12 ${colorClass} text-white rounded-full flex items-center justify-center shadow-lg mb-3 relative z-10">
                        <i data-lucide="${step.icon}" class="w-6 h-6"></i>
                    </div>
                    <h4 class="text-xs font-black ${textColor}">${step.name}</h4>
                    <p class="text-[10px] text-slate-400 mt-1 max-w-[120px]">${step.desc}</p>
                </div>
            `;

            if (!isLast) {
                html += `
                    <div class="hidden md:block flex-1 h-0.5 bg-slate-100 relative -mt-10 mx-[-20px] z-0">
                        <div class="absolute inset-0 ${step.status === 'done' ? 'bg-emerald-200' : 'bg-slate-100'} transition-all"></div>
                    </div>
                `;
            }
        });

        html += `</div>`;
        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    }
};

document.addEventListener("DOMContentLoaded", () => DataLineage.init());
