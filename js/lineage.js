/**
 * DAWF v5 Enhanced — Data Lineage Visualizer
 */
const DataLineage = {
  steps: [],
  init: function() { this.render(); },
  addStep: async function(name, desc, icon="check-circle", status="done") {
    this.steps.push({ name, desc, icon, status, time: new Date().toLocaleTimeString() });
    await StateDB.set('lineage_steps', this.steps);
    this.render();
  },
  render: async function() {
    const container = document.getElementById("lineageVisualizer");
    if (!container) return;
    const meta = await StateDB.get("active_file_meta");
    const stored = await StateDB.get('lineage_steps') || [];
    if (!stored.length) {
      stored.push({ name: "Source Ingestion", desc: meta ? `Loaded: ${meta.name}` : "No file loaded", icon: "database", status: meta ? "done" : "pending" });
      stored.push({ name: "Data Cleaning", desc: "Type casting & null handling", icon: "sparkles", status: meta ? "done" : "pending" });
      stored.push({ name: "Transformation", desc: "Calculated fields & ETL Joins", icon: "git-merge", status: "active" });
      stored.push({ name: "BI Visualization", desc: "Interactive charts generated", icon: "layout-dashboard", status: "pending" });
    }
    let html = `<div class="flex flex-col md:flex-row items-center justify-between gap-4 p-6">`;
    stored.forEach((step, i) => {
      const isLast = i === stored.length - 1;
      const color = step.status === "done" ? "bg-emerald-500" : (step.status === "active" ? "bg-violet-600 animate-pulse" : "bg-slate-200");
      const text = step.status === "pending" ? "text-slate-400" : "text-slate-900";
      html += `
        <div class="flex-1 flex flex-col items-center text-center group min-w-[120px]">
          <div class="w-10 h-10 ${color} text-white rounded-full flex items-center justify-center shadow mb-2 relative z-10">
            <i data-lucide="${step.icon}" class="w-5 h-5"></i>
          </div>
          <h4 class="text-xs font-black ${text}">${step.name}</h4>
          <p class="text-[10px] text-slate-400 mt-1 max-w-[140px]">${step.desc}</p>
          <p class="text-[9px] text-slate-300 mt-0.5">${step.time || ''}</p>
        </div>`;
      if (!isLast) html += `<div class="hidden md:block flex-1 h-0.5 bg-slate-100 relative -mt-6 mx-[-12px] z-0"><div class="absolute inset-0 ${step.status === 'done' ? 'bg-emerald-200' : 'bg-slate-100'}"></div></div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }
};
document.addEventListener("DOMContentLoaded", () => DataLineage.init());
