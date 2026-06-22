/**
 * DAWF v5 Enhanced — Unified Client-Side Core
 * Architect: Adewale Samson Adeagbo | HMG Academy
 */

const LICENSE_SEED = "AdewaleSamsonAdeagbo_HMG_Academy_2026_SecureKey_v5";
const STOPWORDS = new Set(["the","a","an","and","or","but","is","are","was","were","to","for","in","on","at","by","with","of","it","its","they","them","this","that","these","those","you","your","we","our","us","i","my","me","he","she","him","her","his","has","have","had","do","does","did","as","if","then","else","not","no"]);

let rawDataset = [], workingDataset = [], originalColumns = [], activeColumns = [], activeFileMeta = null, pipelineSettings = {}, activeFormulas = [];

function computeOfflineSHA256(text) { let hash=0; for(let i=0;i<text.length;i++){ const char=text.charCodeAt(i); hash=(hash<<5)-hash+char; hash=hash&hash; } return Math.abs(hash).toString(16).padStart(8,'0'); }
function generateLicenseSignature(client,seatId,tier,expiry){ const raw=`${client.trim()}|${seatId.trim()}|${tier}|${expiry}|${LICENSE_SEED}`; return computeOfflineSHA256(raw); }

async function loadSharedState() {
  try {
    rawDataset = await StateDB.get("raw_dataset") || [];
    workingDataset = await StateDB.get("working_dataset") || [];
    originalColumns = await StateDB.get("original_columns") || [];
    activeColumns = await StateDB.get("active_columns") || [];
    activeFileMeta = await StateDB.get("active_file_meta") || null;
    pipelineSettings = await StateDB.get("pipeline_settings") || {};
    activeFormulas = await StateDB.get("active_formulas") || [];
    const badge = document.getElementById("navFileBadge");
    const nameText = document.getElementById("navActiveFileName");
    if (activeFileMeta && badge && nameText) { badge.classList.remove("hidden"); nameText.innerText = `${activeFileMeta.name} (${activeFileMeta.sheet || 'Sheet1'})`; }
  } catch(e) { console.error("State load failed:", e); }
}

async function saveSharedState() {
  await StateDB.set("raw_dataset", rawDataset);
  await StateDB.set("working_dataset", workingDataset);
  await StateDB.set("original_columns", originalColumns);
  await StateDB.set("active_columns", activeColumns);
  await StateDB.set("active_file_meta", activeFileMeta);
  await StateDB.set("pipeline_settings", pipelineSettings);
  await StateDB.set("active_formulas", activeFormulas);
}

function showLoader(msg) { const el = document.getElementById("screenOverlayLoader"); if(el){ el.classList.remove("hidden"); const t = el.querySelector("p"); if(t&&msg) t.innerText = msg; } }
function hideLoader() { const el = document.getElementById("screenOverlayLoader"); if(el) el.classList.add("hidden"); }

function initApp() {
  lucide.createIcons();
  loadSharedState();
  const page = window.location.pathname.split("/").pop() || "index.html";
  if (page === "index.html" || page === "") initUploadHub();
  else if (page === "clean.html") initCleaningPage();
  else if (page === "etl.html") initEtlPage();
  else if (page === "dashboard.html") initDashboardPage();
  else if (page === "pivot.html") initPivotPage();
  else if (page === "sql.html") initSqlPage();
  else if (page === "analyst.html") initAnalystPage();
  else if (page === "learn.html") initLearnPage();
  else if (page === "brand.html") initBrandPage();
  else if (page === "report.html") initReportPage();
}

/* ========== UPLOAD / INGEST ========== */
function initUploadHub() {
  const fileInput = document.getElementById("fileInput");
  const dropzone = document.getElementById("dropzone");
  if (dropzone) {
    dropzone.addEventListener("click", () => fileInput?.click());
    dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("border-violet-500","bg-violet-50"); });
    dropzone.addEventListener("dragleave", () => { dropzone.classList.remove("border-violet-500","bg-violet-50"); });
    dropzone.addEventListener("drop", (e) => { e.preventDefault(); dropzone.classList.remove("border-violet-500","bg-violet-50"); if(e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]); });
  }
  if (fileInput) fileInput.addEventListener("change", (e) => { if(e.target.files.length) handleFile(e.target.files[0]); fileInput.value=""; });

  // Template restore
  const btnRestore = document.getElementById("btnTriggerRestore");
  const configInput = document.getElementById("configFileInput");
  if (btnRestore && configInput) { btnRestore.addEventListener("click", () => configInput.click()); configInput.addEventListener("change", (e) => { if(e.target.files.length) loadRecipe(e.target.files[0]).then(() => { showToast("Recipe loaded. Redirecting...","success"); setTimeout(()=>window.location.href="clean.html",800); }); }); }

  // Sheet selector
  const btnLoadSheet = document.getElementById("btnLoadSelectedSheet");
  if (btnLoadSheet) btnLoadSheet.addEventListener("click", () => { const sel = document.getElementById("sheetSelector"); if(!sel||!sel.value) return; showLoader("Loading worksheet..."); loadXLSXSheet(window.__pendingXLSXWorkbook, sel.value); });

  // Tab switching
  const localTab = document.getElementById("ingestLocalTabBtn");
  const googleTab = document.getElementById("ingestGoogleTabBtn");
  const localPanel = document.getElementById("ingestLocalPanel");
  const googlePanel = document.getElementById("ingestGooglePanel");
  if (localTab && googleTab) {
    localTab.addEventListener("click", () => { localPanel.classList.remove("hidden"); googlePanel.classList.add("hidden"); localTab.classList.add("text-violet-700","border-violet-600"); localTab.classList.remove("text-slate-400","border-transparent"); googleTab.classList.remove("text-violet-700","border-violet-600"); googleTab.classList.add("text-slate-400","border-transparent"); });
    googleTab.addEventListener("click", () => { googlePanel.classList.remove("hidden"); localPanel.classList.add("hidden"); googleTab.classList.add("text-violet-700","border-violet-600"); googleTab.classList.remove("text-slate-400","border-transparent"); localTab.classList.remove("text-violet-700","border-violet-600"); localTab.classList.add("text-slate-400","border-transparent"); });
  }
  document.getElementById("btnSyncGoogleSheet")?.addEventListener("click", syncGoogleSheet);

  // Samples
  document.querySelectorAll(".sample-btn").forEach(btn => btn.addEventListener("click", () => { loadMock(btn.dataset.sampleId); }));
}

function handleFile(file) {
  showLoader("Parsing file...");
  if (file.name.endsWith(".csv")) {
    Papa.parse(file, { header:true, skipEmptyLines:true, complete: async (results) => { await ingestData(results.data, file.name, "Sheet1", file.size); hideLoader(); } });
  } else if (file.name.match(/\.(xlsx|xls)$/)) {
    if (typeof XLSX === 'undefined') { showToast("SheetJS library not available. Please ensure XLSX script is loaded.","error"); hideLoader(); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheets = workbook.SheetNames;
      if (sheets.length > 1) {
        window.__pendingXLSXWorkbook = workbook;
        const sel = document.getElementById("sheetSelector"); sel.innerHTML = sheets.map(s => `<option value="${s}">${s}</option>`).join('');
        document.getElementById("sheetSelectionPanel")?.classList.remove("hidden");
        hideLoader();
        showToast(`Workbook has ${sheets.length} sheets. Select one above.`, "warning");
      } else { loadXLSXSheet(workbook, sheets[0]); }
    };
    reader.readAsArrayBuffer(file);
  } else { showToast("Unsupported file format. Use CSV or Excel.","error"); hideLoader(); }
}

async function loadXLSXSheet(workbook, sheetName) {
  const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header:1, defval: null });
  if (!json.length) { showToast("Sheet is empty","error"); hideLoader(); return; }
  const headers = json[0].map(h => String(h || ''));
  const rows = json.slice(1).map(r => { const o={}; headers.forEach((h,i)=>o[h]=r[i]!==undefined?r[i]:null); return o; });
  await ingestData(rows, "uploaded.xlsx", sheetName, 0);
  hideLoader();
}

async function ingestData(data, name, sheet, size) {
  if (!data.length) { showToast("No data found in file.","error"); return; }
  rawDataset = data; originalColumns = Object.keys(data[0]||{}); activeColumns = [...originalColumns]; activeFileMeta = { name, sheet, size };
  originalColumns.forEach(c => { pipelineSettings[c] = { rename: c, type: "auto", nullStrategy: "ignore", active: true }; });
  workingDataset = JSON.parse(JSON.stringify(data));
  await saveSharedState(); await UndoManager.push("Initial Ingest"); await DataLineage.addStep("Source Ingestion", `Loaded ${data.length} rows`, "database", "done");
  showToast(`Ingested ${data.length.toLocaleString()} rows`, "success");
  window.location.href = "clean.html";
}

async function syncGoogleSheet() {
  const url = document.getElementById("googleSheetUrlField")?.value?.trim();
  if (!url) { showToast("Please paste a Google Sheet public link.","warning"); return; }
  const match = url.match(/\/d\/([a-zA-Z0-9\-_]+)/);
  if (!match) { showToast("Could not parse Sheet ID from URL.","error"); return; }
  const sheetId = match[1];
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&id=${sheetId}`;
  showLoader("Fetching Google Sheet as CSV...");
  try {
    const res = await fetch(csvUrl); const text = await res.text();
    Papa.parse(text, { header:true, skipEmptyLines:true, complete: async (results) => { await ingestData(results.data, "GoogleSheet.csv", "Sheet1", 0); } });
  } catch(e) { showToast("Failed to fetch Google Sheet. Ensure it is public (Viewer).","error"); hideLoader(); }
}

async function loadMock(id) {
  showLoader("Loading sandbox...");
  let data = [];
  if (id === "sales_performance") {
    data = Array.from({length:200},(_,i)=>({ Tx_ID:`TX-${1000+i}`, Date:`2026-${String(1+Math.floor(Math.random()*6)).padStart(2,'0')}-${String(1+Math.floor(Math.random()*28)).padStart(2,'0')}`, Region:["North","South","East","West"][Math.floor(Math.random()*4)], Category:["Electronics","Apparel","Furniture","Food"][Math.floor(Math.random()*4)], Sales:Math.floor(Math.random()*5000)+500, Quantity:Math.floor(Math.random()*10)+1, Margin:0.15+Math.random()*0.25 }));
  } else if (id === "hr_directory") {
    data = Array.from({length:100},(_,i)=>({ Staff_ID:`ST-${2000+i}`, Name:["Samson","Adewale","Jane","John","Mary","Peter","Grace","Daniel","Fatima","Chinedu"][Math.floor(Math.random()*10)], Department:["Science","Languages","HR","Finance","IT","Operations"][Math.floor(Math.random()*6)], Salary:Math.floor(Math.random()*200000)+50000, Rating:Math.floor(Math.random()*5)+1, Years:Math.floor(Math.random()*15)+1 }));
  } else {
    data = Array.from({length:120},(_,i)=>({ Member_ID:`M-${3000+i}`, Date:`2026-${String(1+Math.floor(Math.random()*6)).padStart(2,'0')}-${String(1+Math.floor(Math.random()*28)).padStart(2,'0')}`, Type:["Tithe","Offering","Pledge","Partnership"][Math.floor(Math.random()*4)], Amount:Math.floor(Math.random()*500000)+5000, Segment:["Regular","VIP","New","Inactive"][Math.floor(Math.random()*4)] }));
  }
  await ingestData(data, `${id}_sandbox.csv`, "Sheet1", 0);
  await StateDB.set("brand_config", { name:"DAWF v5", tagline:"Learning Deliberately. Teaching Authentically.", logo:"📊", color:"#7c3aed" });
}

/* ========== CLEANING ========== */
function initCleaningPage() {
  renderQualityMetrics();
  renderColumnsPipeline();
  renderDataGrid();
  setupCalculatedFields();
  setupFindReplace();
  setupDeduplicate();
  setupRemoveNulls();
  setupTypeCast();
  document.getElementById("btnApplyPipeline")?.addEventListener("click", applyPipeline);
  document.getElementById("btnResetPipeline")?.addEventListener("click", async () => { workingDataset = JSON.parse(JSON.stringify(rawDataset)); activeColumns = [...originalColumns]; await saveSharedState(); await UndoManager.push("Reset Pipeline"); renderQualityMetrics(); renderColumnsPipeline(); renderDataGrid(); showToast("Pipeline reset to original.","success"); });
}

async function renderQualityMetrics() {
  const quality = computeQualityScore(workingDataset, activeColumns, pipelineSettings);
  const elScore = document.getElementById("qualityScoreText"); if(elScore) elScore.innerText = `${quality.score} / 100`;
  const elBar = document.getElementById("qualityScoreBar"); if(elBar) { elBar.style.width = `${quality.score}%`; elBar.className = `h-1.5 rounded-full ${quality.score >= 90 ? 'bg-emerald-500' : quality.score >= 70 ? 'bg-amber-500' : 'bg-red-500'}`; }
  document.getElementById("cleanTotalRows")?.setAttribute("value", workingDataset.length.toLocaleString());
  if(document.getElementById("cleanTotalRows")) document.getElementById("cleanTotalRows").innerText = workingDataset.length.toLocaleString();
  if(document.getElementById("cleanTotalCols")) document.getElementById("cleanTotalCols").innerText = activeColumns.length;
  if(document.getElementById("cleanMissingCells")) document.getElementById("cleanMissingCells").innerText = quality.nullCount.toLocaleString();
  const list = document.getElementById("cleaningAdvisorIssuesList");
  if(list) {
    if(!quality.issues.length) list.innerHTML = `<div class="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-center text-xs font-bold">Dataset quality is excellent. No issues detected.</div>`;
    else list.innerHTML = quality.issues.map(iss => `<div class="p-3 ${iss.severity==='high'?'bg-red-50 border-red-100 text-red-700':'bg-amber-50 border-amber-100 text-amber-700'} border rounded-lg text-xs font-bold flex items-start gap-2"><i data-lucide="alert-triangle" class="w-4 h-4 shrink-0 mt-0.5"></i><div><strong>${iss.col}:</strong> ${iss.message}</div></div>`).join('');
  }
  if(window.lucide) lucide.createIcons();
}

function renderColumnsPipeline() {
  const tbody = document.getElementById("columnsPipelineBody"); if(!tbody) return;
  if (!workingDataset.length) { tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-xs text-slate-400 italic">No data loaded</td></tr>`; return; }
  tbody.innerHTML = originalColumns.map(col => {
    const settings = pipelineSettings[col] || {};
    const vals = workingDataset.map(r => r[col]);
    const inferred = inferType(vals);
    const nulls = vals.filter(v => v === null || v === undefined || String(v).trim() === '' || String(v).toLowerCase() === 'null' || String(v).toLowerCase() === 'nan').length;
    const uniques = new Set(vals).size;
    return `<tr class="hover:bg-slate-50 border-b">
      <td class="p-3 text-center"><input type="checkbox" data-col="${col}" class="col-active-check" ${settings.active!==false ? 'checked' : ''}></td>
      <td class="p-3 font-mono text-xs">${col}</td>
      <td class="p-3"><input type="text" data-col="${col}" class="col-rename border rounded px-2 py-1 w-full bg-slate-50 text-xs" value="${settings.rename || col}"></td>
      <td class="p-3">
        <select data-col="${col}" class="col-type border rounded px-2 py-1 bg-slate-50 text-xs">
          <option value="auto" ${(settings.type||'auto')==='auto'?'selected':''}>Auto (${inferred})</option>
          <option value="text" ${settings.type==='text'?'selected':''}>Text</option>
          <option value="number" ${settings.type==='number'?'selected':''}>Number</option>
          <option value="date" ${settings.type==='date'?'selected':''}>Date</option>
          <option value="boolean" ${settings.type==='boolean'?'selected':''}>Boolean</option>
        </select>
      </td>
      <td class="p-3">
        <select data-col="${col}" class="col-null border rounded px-2 py-1 bg-slate-50 text-xs">
          <option value="ignore" ${settings.nullStrategy==='ignore'?'selected':''}>Ignore</option>
          <option value="drop" ${settings.nullStrategy==='drop'?'selected':''}>Drop Rows</option>
          <option value="mean" ${settings.nullStrategy==='mean'?'selected':''}>Mean (numeric)</option>
          <option value="median" ${settings.nullStrategy==='median'?'selected':''}>Median (numeric)</option>
          <option value="mode" ${settings.nullStrategy==='mode'?'selected':''}>Mode (categorical)</option>
          <option value="empty" ${settings.nullStrategy==='empty'?'selected':''}>Empty String</option>
        </select>
      </td>
      <td class="p-3 text-center text-xs font-bold">${nulls}</td>
      <td class="p-3 text-center text-xs font-bold">${uniques}</td>
    </tr>`;
  }).join('');
}

function renderDataGrid() {
  const container = document.getElementById("dataGridContainer");
  if (!container) return;
  if (!workingDataset.length) { container.innerHTML = `<div class="p-8 text-center text-xs text-slate-400 italic">Upload data to preview grid.</div>`; return; }
  const cols = activeColumns.map(c => ({ title: pipelineSettings[c]?.rename || c, field: c, sorter: "string" }));
  if (window.Tabulator) {
    new Tabulator(container, { data: workingDataset.slice(0,500), columns: cols, pagination: "local", paginationSize: 20, layout: "fitColumns", movableColumns: true, height: "400px" });
  } else {
    // Fallback table
    let html = `<div class="overflow-auto border rounded-xl"><table class="w-full text-left text-xs border-collapse"><thead class="bg-slate-50 border-b font-bold"><tr>${activeColumns.map(c => `<th class="p-3">${pipelineSettings[c]?.rename || c}</th>`).join('')}</tr></thead><tbody class="divide-y">`;
    for (const row of workingDataset.slice(0,100)) { html += `<tr>${activeColumns.map(c => `<td class="p-3">${row[c] ?? ''}</td>`).join('')}</tr>`; }
    html += `</tbody></table></div>`;
    if (workingDataset.length > 100) html += `<p class="text-xs text-slate-400 mt-2 italic">Showing first 100 of ${workingDataset.length} rows. Install Tabulator for full grid.</p>`;
    container.innerHTML = html;
  }
}

async function applyPipeline() {
  showLoader("Applying pipeline...");
  // Update settings from UI
  document.querySelectorAll(".col-active-check").forEach(el => { const col = el.dataset.col; pipelineSettings[col] = pipelineSettings[col] || {}; pipelineSettings[col].active = el.checked; });
  document.querySelectorAll(".col-rename").forEach(el => { const col = el.dataset.col; pipelineSettings[col] = pipelineSettings[col] || {}; pipelineSettings[col].rename = el.value; });
  document.querySelectorAll(".col-type").forEach(el => { const col = el.dataset.col; pipelineSettings[col] = pipelineSettings[col] || {}; pipelineSettings[col].type = el.value; });
  document.querySelectorAll(".col-null").forEach(el => { const col = el.dataset.col; pipelineSettings[col] = pipelineSettings[col] || {}; pipelineSettings[col].nullStrategy = el.value; });

  // Rebuild active columns
  activeColumns = originalColumns.filter(c => pipelineSettings[c]?.active !== false);
  // Process data
  let processed = JSON.parse(JSON.stringify(rawDataset));
  for (const col of originalColumns) {
    const settings = pipelineSettings[col] || {};
    const targetType = settings.type === 'auto' ? inferType(processed.map(r=>r[col])) : settings.type;
    // Cast values
    if (targetType !== 'text') {
      for (const row of processed) row[col] = castValue(row[col], targetType);
    }
    // Null strategy
    if (settings.nullStrategy === 'drop') { processed = processed.filter(r => r[col] !== null && r[col] !== undefined && String(r[col]).trim() !== ''); }
    else if (settings.nullStrategy === 'mean' && targetType === 'number') {
      const nums = processed.map(r => Number(r[col])).filter(n => !isNaN(n));
      const mean = nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : 0;
      processed.forEach(r => { if (r[col] === null || r[col] === undefined || String(r[col]).trim() === '') r[col] = mean; });
    } else if (settings.nullStrategy === 'median' && targetType === 'number') {
      const nums = processed.map(r => Number(r[col])).filter(n => !isNaN(n)).sort((a,b)=>a-b);
      const median = nums.length ? (nums.length%2 ? nums[(nums.length-1)/2] : (nums[nums.length/2-1]+nums[nums.length/2])/2) : 0;
      processed.forEach(r => { if (r[col] === null || r[col] === undefined || String(r[col]).trim() === '') r[col] = median; });
    } else if (settings.nullStrategy === 'mode') {
      const clean = processed.map(r => r[col]).filter(v => v !== null && v !== undefined && String(v).trim() !== '');
      const freq = {}; clean.forEach(v => freq[v] = (freq[v]||0)+1);
      const mode = Object.keys(freq).reduce((a,b)=>freq[a]>freq[b]?a:b, Object.keys(freq)[0]);
      processed.forEach(r => { if (r[col] === null || r[col] === undefined || String(r[col]).trim() === '') r[col] = mode; });
    } else if (settings.nullStrategy === 'empty') {
      processed.forEach(r => { if (r[col] === null || r[col] === undefined || String(r[col]).trim() === '') r[col] = ''; });
    }
  }
  // Rename pass
  const renamed = processed.map(row => { const o={}; for(const c of activeColumns) o[pipelineSettings[c]?.rename || c] = row[c]; return o; });
  workingDataset = renamed;
  activeColumns = activeColumns.map(c => pipelineSettings[c]?.rename || c);
  await saveSharedState(); await UndoManager.push("Apply Pipeline"); await DataLineage.addStep("Data Cleaning", `Type cast & null handling applied`, "sparkles", "done");
  renderQualityMetrics(); renderDataGrid(); renderColumnsPipeline();
  showToast(`Pipeline applied: ${workingDataset.length} rows, ${activeColumns.length} columns`, "success");
  hideLoader();
}

function setupCalculatedFields() {
  const btn = document.getElementById("btnAddCalculatedCol");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const name = document.getElementById("calcColName")?.value?.trim();
    const formula = document.getElementById("calcColFormula")?.value?.trim();
    if (!name || !formula) { showToast("Provide name and formula","warning"); return; }
    try {
      showLoader("Computing calculated field...");
      workingDataset = workingDataset.map(row => {
        try { const fn = new Function('row', `return ${formula}`); const val = fn(row); row[name] = (val === undefined || val === null) ? null : val; } catch(e){ row[name] = null; }
        return row;
      });
      if (!activeColumns.includes(name)) activeColumns.push(name);
      activeFormulas.push({ name, formula, created: new Date().toISOString() });
      await saveSharedState(); await UndoManager.push(`Calculated field: ${name}`);
      renderDataGrid(); renderQualityMetrics(); renderColumnsPipeline();
      showToast(`Calculated field "${name}" added`, "success"); hideLoader();
    } catch (err) { showToast("Formula error: " + err.message, "error"); hideLoader(); }
  });
}

function setupFindReplace() {
  const btn = document.getElementById("btnFindReplace");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const col = document.getElementById("findReplaceCol")?.value;
    const find = document.getElementById("findReplaceFind")?.value;
    const replace = document.getElementById("findReplaceReplace")?.value;
    if (!find) { showToast("Enter search term","warning"); return; }
    let count = 0;
    workingDataset = workingDataset.map(row => {
      const val = String(row[col] ?? '');
      if (val.includes(find)) { row[col] = val.split(find).join(replace); count++; }
      return row;
    });
    await saveSharedState(); await UndoManager.push(`Find & Replace in ${col}`);
    renderDataGrid(); renderQualityMetrics(); showToast(`Replaced ${count} occurrences`, "success");
  });
}

function setupDeduplicate() {
  const btn = document.getElementById("btnRemoveDuplicates");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const before = workingDataset.length;
    const seen = new Set(); const deduped = [];
    for (const row of workingDataset) { const key = activeColumns.map(c => row[c]).join('|'); if (!seen.has(key)) { seen.add(key); deduped.push(row); } }
    workingDataset = deduped; await saveSharedState(); await UndoManager.push("Remove duplicates");
    renderDataGrid(); renderQualityMetrics(); showToast(`Removed ${before - deduped.length} duplicates. ${deduped.length} rows remain.`, "success");
  });
}

function setupRemoveNulls() {
  const btn = document.getElementById("btnRemoveNulls");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const col = document.getElementById("removeNullsCol")?.value;
    if (!col || !activeColumns.includes(col)) { showToast("Select a valid column","warning"); return; }
    const before = workingDataset.length;
    workingDataset = workingDataset.filter(r => r[col] !== null && r[col] !== undefined && String(r[col]).trim() !== '');
    await saveSharedState(); await UndoManager.push(`Remove nulls in ${col}`);
    renderDataGrid(); renderQualityMetrics(); showToast(`Removed ${before - workingDataset.length} rows with nulls in ${col}`, "success");
  });
}

function setupTypeCast() {
  const btn = document.getElementById("btnCastType");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const col = document.getElementById("castTypeCol")?.value;
    const type = document.getElementById("castTypeTarget")?.value;
    if (!col || !type) { showToast("Select column and type","warning"); return; }
    workingDataset = workingDataset.map(r => { r[col] = castValue(r[col], type); return r; });
    await saveSharedState(); await UndoManager.push(`Cast ${col} to ${type}`);
    renderDataGrid(); renderQualityMetrics(); showToast(`Cast ${col} to ${type}`, "success");
  });
}

/* ========== ETL ========== */
function initEtlPage() {
  const parentKey = document.getElementById("etlParentKey"); if (parentKey) parentKey.innerHTML = activeColumns.map(c => `<option value="${c}">${c}</option>`).join('');
  const modeSel = document.getElementById("etlModeSelect");
  const joinPanel = document.getElementById("joinKeysPanel");
  if (modeSel && joinPanel) {
    modeSel.addEventListener("change", () => { joinPanel.classList.toggle("hidden", modeSel.value === "union"); });
  }
  document.getElementById("btnTriggerUnionFile")?.addEventListener("click", () => document.getElementById("unionFileInput")?.click());
  const unionInput = document.getElementById("unionFileInput");
  if (unionInput) unionInput.addEventListener("change", (e) => { if (e.target.files.length) handleSecondaryFile(e.target.files[0]); unionInput.value=""; });
  document.getElementById("btnExecuteJoin")?.addEventListener("click", executeJoin);
  document.getElementById("btnAddFormulaColumn")?.addEventListener("click", async () => {
    const name = document.getElementById("formulaColName")?.value?.trim();
    const expr = document.getElementById("formulaExpression")?.value?.trim();
    if (!name || !expr) return showToast("Enter formula name and expression","warning");
    workingDataset = workingDataset.map(row => { try { const fn = new Function('row', `return ${expr}`); row[name] = fn(row); } catch(e){ row[name] = null; } return row; });
    if (!activeColumns.includes(name)) activeColumns.push(name); activeFormulas.push({ name, formula: expr, created: new Date().toISOString() });
    await saveSharedState(); await UndoManager.push(`ETL Formula: ${name}`); showToast(`Formula column "${name}" added`, "success");
    const parentKey = document.getElementById("etlParentKey"); if (parentKey) parentKey.innerHTML = activeColumns.map(c => `<option value="${c}">${c}</option>`).join('');
  });
  DataLineage.render();
}

async function handleSecondaryFile(file) {
  showLoader("Parsing secondary file...");
  let data = [];
  if (file.name.endsWith(".csv")) {
    await new Promise(res => Papa.parse(file, { header:true, skipEmptyLines:true, complete: r => { data = r.data; res(); } }));
  } else if (file.name.match(/\.(xlsx|xls)$/)) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(buf), {type:'array'});
    const sheet = wb.SheetNames[0];
    const json = XLSX.utils.sheet_to_json(wb.Sheets[sheet], {header:1, defval:null});
    const headers = json[0].map(h=>String(h||'')); data = json.slice(1).map(r=>{ const o={}; headers.forEach((h,i)=>o[h]=r[i]!==undefined?r[i]:null); return o; });
  } else { showToast("Unsupported format","error"); hideLoader(); return; }
  await StateDB.set("secondary_dataset", data);
  await StateDB.set("secondary_columns", Object.keys(data[0]||{}));
  const secKey = document.getElementById("etlSecondaryKey"); if (secKey) secKey.innerHTML = Object.keys(data[0]||{}).map(c => `<option value="${c}">${c}</option>`).join('');
  document.getElementById("unionStatusBadge")?.classList.remove("hidden");
  showToast(`Secondary file loaded: ${data.length} rows`, "success"); hideLoader();
  await DataLineage.addStep("Secondary Ingest", `Loaded ${file.name}: ${data.length} rows`, "upload-cloud", "done");
}

async function executeJoin() {
  const mode = document.getElementById("etlModeSelect")?.value;
  const parentKey = document.getElementById("etlParentKey")?.value;
  const secondaryKey = document.getElementById("etlSecondaryKey")?.value;
  const secondary = await StateDB.get("secondary_dataset") || [];
  if (mode !== "union" && (!secondary.length || !secondaryKey)) { showToast("Load a secondary file and select keys","warning"); return; }
  showLoader("Merging datasets...");
  let result = [];
  if (mode === "union") {
    const sec = await StateDB.get("secondary_dataset") || [];
    result = [...workingDataset, ...sec];
  } else if (mode === "left_join") {
    const secMap = new Map(); secondary.forEach(r => secMap.set(r[secondaryKey], r));
    result = workingDataset.map(r => ({ ...r, ...secMap.get(r[parentKey]) }));
  } else if (mode === "inner_join") {
    const secMap = new Map(); secondary.forEach(r => secMap.set(r[secondaryKey], r));
    result = workingDataset.filter(r => secMap.has(r[parentKey])).map(r => ({ ...r, ...secMap.get(r[parentKey]) }));
  }
  // Update columns
  const newCols = Array.from(new Set(result.flatMap(r => Object.keys(r))));
  workingDataset = result; activeColumns = newCols; activeFileMeta = { ...activeFileMeta, name: (activeFileMeta?.name || '') + '_merged' };
  await saveSharedState(); await UndoManager.push(`ETL ${mode}`); await DataLineage.addStep("ETL Merge", `${mode} produced ${result.length} rows`, "git-merge", "done");
  showToast(`${mode} complete: ${result.length} rows`, "success"); hideLoader();
  document.getElementById("unionStatusBadge")?.classList.add("hidden");
}

/* ========== DASHBOARD ========== */
function initDashboardPage() {
  renderKPIs();
  renderDashboardFilters();
  renderAutoCharts();
  document.getElementById("btnResetCrossFilter")?.addEventListener("click", () => { crossFilter = null; renderAutoCharts(); showToast("Cross-filter cleared","success"); });
}

let crossFilter = null; // { col, value }

function renderKPIs() {
  if (!workingDataset.length) return;
  const kpi0 = document.getElementById("kpiValue_0"); if(kpi0) kpi0.innerText = workingDataset.length.toLocaleString();
  const kpi1 = document.getElementById("kpiValue_1"); if(kpi1) {
    const numericCols = activeColumns.filter(c => inferType(workingDataset.map(r=>r[c])) === 'number');
    if (numericCols.length) { const total = workingDataset.reduce((s,r)=>s+(Number(r[numericCols[0]])||0),0); kpi1.innerText = total.toLocaleString(undefined, {maximumFractionDigits:2}); document.getElementById("kpiLabel_1").innerText = `Sum of ${numericCols[0]}`; }
    else kpi1.innerText = "---";
  }
  // Generate insights
  const insights = document.getElementById("executiveInsightsBox"); if (insights) {
    const tips = [];
    const quality = computeQualityScore(workingDataset, activeColumns, pipelineSettings);
    if (quality.score < 100) tips.push(`Data Quality Score is ${quality.score}/100. Review the Clean & Profile page for issues.`);
    const numCols = activeColumns.filter(c => inferType(workingDataset.map(r=>r[c])) === 'number');
    if (numCols.length) { const avg = workingDataset.reduce((s,r)=>s+(Number(r[numCols[0]])||0),0)/workingDataset.length; tips.push(`Average ${numCols[0]} is ${Math.round(avg*100)/100}.`); }
    const catCols = activeColumns.filter(c => inferType(workingDataset.map(r=>r[c])) === 'text');
    if (catCols.length) { const counts = {}; workingDataset.forEach(r => counts[r[catCols[0]]] = (counts[r[catCols[0]]]||0)+1); const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]; if (top) tips.push(`Top category in ${catCols[0]}: "${top[0]}" (${top[1]} rows).`); }
    insights.innerHTML = tips.length ? tips.map(t => `<div class="flex items-start gap-2 text-xs font-semibold"><i data-lucide="lightbulb" class="w-4 h-4 text-amber-500 shrink-0"></i><span>${t}</span></div>`).join('') : `<div class="text-xs text-slate-400 italic">Upload data to see insights.</div>`;
    if (window.lucide) lucide.createIcons();
  }
}

function renderDashboardFilters() {
  const container = document.getElementById("dashboardFilters"); if (!container) return;
  const catCols = activeColumns.filter(c => inferType(workingDataset.map(r=>r[c])) === 'text' && new Set(workingDataset.map(r=>r[c])).size < 50);
  const dateCols = activeColumns.filter(c => inferType(workingDataset.map(r=>r[c])) === 'date');
  let html = `<div class="flex flex-wrap gap-3">`;
  catCols.forEach(col => {
    const vals = [...new Set(workingDataset.map(r=>r[col]))].filter(Boolean).sort();
    html += `<div class="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm"><label class="text-[10px] uppercase font-bold text-slate-500">${col}</label><select data-filter="${col}" class="text-xs font-bold bg-transparent border-0"><option value="">All</option>${vals.map(v=>`<option value="${v}">${v}</option>`).join('')}</select></div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
  container.querySelectorAll("select").forEach(sel => sel.addEventListener("change", () => { renderAutoCharts(); }));
}

function getFilteredDataset() {
  let ds = workingDataset;
  const container = document.getElementById("dashboardFilters");
  if (container) { container.querySelectorAll("select[data-filter]").forEach(sel => { if (sel.value) ds = ds.filter(r => r[sel.dataset.filter] === sel.value); }); }
  if (crossFilter) ds = ds.filter(r => r[crossFilter.col] === crossFilter.value);
  return ds;
}

function renderAutoCharts() {
  const grid = document.getElementById("chartsContainerGrid"); if (!grid) return;
  if (!workingDataset.length) { grid.innerHTML = `<div class="col-span-2 text-center p-8 text-xs text-slate-400 italic">No data for dashboard.</div>`; return; }
  const ds = getFilteredDataset();
  const numCols = activeColumns.filter(c => inferType(ds.map(r=>r[c])) === 'number');
  const catCols = activeColumns.filter(c => inferType(ds.map(r=>r[c])) === 'text' && new Set(ds.map(r=>r[c])).size < 30 && c !== numCols[0]);
  const dateCols = activeColumns.filter(c => inferType(ds.map(r=>r[c])) === 'date');
  grid.innerHTML = '';
  if (catCols.length && numCols.length) {
    const group = {};
    ds.forEach(r => { const k = r[catCols[0]]||'Unknown'; group[k] = (group[k]||0) + (Number(r[numCols[0]])||0); });
    const labels = Object.keys(group); const values = Object.values(group);
    const chartId = 'chart_cat_bar';
    grid.innerHTML += `<div class="bg-white border rounded-2xl p-5 shadow-xs h-72"><h4 class="font-bold text-xs pb-2 border-b mb-3">${numCols[0]} by ${catCols[0]}</h4><canvas id="${chartId}"></canvas></div>`;
    setTimeout(() => {
      const ctx = document.getElementById(chartId)?.getContext('2d'); if (!ctx) return;
      new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: numCols[0], data: values, backgroundColor: 'rgba(124,58,237,0.75)' }] }, options: { responsive:true, maintainAspectRatio:false, onClick: (_,els) => { if(els.length) { crossFilter={col:catCols[0], value:labels[els[0].index]}; renderAutoCharts(); showToast(`Filtered by ${catCols[0]} = ${crossFilter.value}`, "success"); } } } });
    }, 0);
  }
  if (numCols.length >= 2) {
    const chartId = 'chart_scatter';
    grid.innerHTML += `<div class="bg-white border rounded-2xl p-5 shadow-xs h-72"><h4 class="font-bold text-xs pb-2 border-b mb-3">Scatter: ${numCols[0]} vs ${numCols[1]}</h4><canvas id="${chartId}"></canvas></div>`;
    setTimeout(() => {
      const ctx = document.getElementById(chartId)?.getContext('2d'); if (!ctx) return;
      const pts = ds.slice(0,500).map(r => ({ x: Number(r[numCols[0]])||0, y: Number(r[numCols[1]])||0 }));
      new Chart(ctx, { type: 'scatter', data: { datasets: [{ label: `${numCols[0]} vs ${numCols[1]}`, data: pts, backgroundColor: 'rgba(16,185,129,0.7)' }] }, options: { responsive:true, maintainAspectRatio:false, scales: { x:{type:'linear',position:'bottom',title:{display:true,text:numCols[0]}}, y:{title:{display:true,text:numCols[1]}} } } });
    }, 0);
  }
  if (dateCols.length && numCols.length) {
    const chartId = 'chart_line';
    const sorted = [...ds].sort((a,b)=>new Date(a[dateCols[0]])-new Date(b[dateCols[0]])).slice(0,100);
    const labels = sorted.map(r => r[dateCols[0]]); const values = sorted.map(r => Number(r[numCols[0]])||0);
    grid.innerHTML += `<div class="bg-white border rounded-2xl p-5 shadow-xs h-72"><h4 class="font-bold text-xs pb-2 border-b mb-3">${numCols[0]} over time</h4><canvas id="${chartId}"></canvas></div>`;
    setTimeout(() => {
      const ctx = document.getElementById(chartId)?.getContext('2d'); if (!ctx) return;
      new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: numCols[0], data: values, borderColor: '#3b82f6', tension:0.3 }] }, options: { responsive:true, maintainAspectRatio:false } });
    }, 0);
  }
  if (catCols.length >= 2) {
    const chartId = 'chart_pie';
    const counts = {}; ds.forEach(r => { const k = r[catCols[0]]||'Unknown'; counts[k] = (counts[k]||0)+1; });
    const labels = Object.keys(counts); const values = Object.values(counts);
    grid.innerHTML += `<div class="bg-white border rounded-2xl p-5 shadow-xs h-72"><h4 class="font-bold text-xs pb-2 border-b mb-3">Distribution of ${catCols[0]}</h4><canvas id="${chartId}"></canvas></div>`;
    setTimeout(() => {
      const ctx = document.getElementById(chartId)?.getContext('2d'); if (!ctx) return;
      new Chart(ctx, { type: 'doughnut', data: { labels, datasets: [{ data: values, backgroundColor: ['#7c3aed','#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6'] }] }, options: { responsive:true, maintainAspectRatio:false } });
    }, 0);
  }
  const crossEl = document.getElementById("crossFilterBanner"); if (crossEl) crossEl.classList.toggle("hidden", !crossFilter);
  if (crossFilter) { const cf = document.getElementById("crossFilterValue"); if (cf) cf.innerText = `${crossFilter.col} = ${crossFilter.value}`; }
}

/* ========== PIVOT ========== */
function initPivotPage() {
  const rowSel = document.getElementById("pivotSelectRow"); const colSel = document.getElementById("pivotSelectCol"); const valSel = document.getElementById("pivotSelectVal"); const aggSel = document.getElementById("pivotSelectAgg");
  if (!rowSel || !valSel) return;
  const opts = activeColumns.map(c => `<option value="${c}">${c}</option>`).join('');
  rowSel.innerHTML = opts; valSel.innerHTML = opts;
  if (colSel) { colSel.innerHTML = `<option value="">-- Single Dimension --</option>` + opts; }
  const doPivot = () => renderPivot(rowSel.value, colSel?.value, valSel.value, aggSel.value);
  rowSel.addEventListener("change", doPivot); if(colSel) colSel.addEventListener("change", doPivot); valSel.addEventListener("change", doPivot); aggSel.addEventListener("change", doPivot);
  doPivot();
}

function renderPivot(rowCol, colCol, valCol, agg) {
  const head = document.getElementById("pivotTableHeader"); const body = document.getElementById("pivotTableBody"); if (!head || !body) return;
  if (!workingDataset.length) { head.innerHTML = `<tr><th class="p-3">Row</th><th class="p-3">Value</th></tr>`; body.innerHTML = `<tr><td class="p-4 text-center italic text-slate-400" colspan="2">No data</td></tr>`; return; }
  const data = getFilteredDataset(); // reuse filters
  if (!colCol) {
    const groups = {};
    data.forEach(r => { const k = r[rowCol] || 'Unknown'; const v = Number(r[valCol]) || 0; groups[k] = (groups[k]||0) + v; });
    const sorted = Object.entries(groups).sort((a,b)=>b[1]-a[1]);
    head.innerHTML = `<tr class="bg-slate-50 border-b"><th class="p-3">${rowCol}</th><th class="p-3 text-right">${agg.toUpperCase()} of ${valCol}</th></tr>`;
    body.innerHTML = sorted.map(([k,v]) => `<tr class="border-b"><td class="p-3 font-bold">${k}</td><td class="p-3 text-right font-mono">${agg==='mean' ? Math.round(v/(data.filter(r=>(r[rowCol]||'Unknown')===k).length)*100)/100 : v.toLocaleString()}</td></tr>`).join('');
  } else {
    const colVals = [...new Set(data.map(r => r[colCol] || 'Unknown'))].sort();
    head.innerHTML = `<tr class="bg-slate-50 border-b"><th class="p-3">${rowCol} \ ${colCol}</th>` + colVals.map(v => `<th class="p-3 text-right">${v}</th>`).join('') + `<th class="p-3 text-right">Total</th></tr>`;
    const rowVals = [...new Set(data.map(r => r[rowCol] || 'Unknown'))].sort();
    let html = '';
    for (const rv of rowVals) {
      html += `<tr class="border-b"><td class="p-3 font-bold">${rv}</td>`;
      let rowTotal = 0;
      for (const cv of colVals) {
        const subset = data.filter(r => (r[rowCol]||'Unknown')===rv && (r[colCol]||'Unknown')===cv);
        const v = agg === 'mean' ? (subset.length ? subset.reduce((s,r)=>s+(Number(r[valCol])||0),0)/subset.length : 0) : subset.reduce((s,r)=>s+(Number(r[valCol])||0),0);
        rowTotal += v;
        html += `<td class="p-3 text-right font-mono">${Math.round(v*100)/100}</td>`;
      }
      html += `<td class="p-3 text-right font-mono font-bold">${Math.round(rowTotal*100)/100}</td></tr>`;
    }
    body.innerHTML = html;
  }
}

/* ========== SQL ========== */
function initSqlPage() {
  document.getElementById("btnExecuteSQL")?.addEventListener("click", runSql);
  document.getElementById("btnSqlSampleSales")?.addEventListener("click", () => { document.getElementById("sqlTerminalField").value = "SELECT * FROM data LIMIT 20"; });
  document.getElementById("btnExportSqlResult")?.addEventListener("click", exportSqlResult);
  renderSqlHistory();
}

async function runSql() {
  const query = document.getElementById("sqlTerminalField")?.value; if (!query) return;
  const data = workingDataset || [];
  const panel = document.getElementById("sqlResultsPanel"); if (!panel) return;
  panel.classList.remove("hidden");
  try {
    const result = alasql(query, [data]);
    // Save to history
    const history = await StateDB.get("sql_history") || [];
    history.unshift({ query, time: new Date().toLocaleTimeString(), rows: result.length });
    if (history.length > 50) history.pop();
    await StateDB.set("sql_history", history);
    renderSqlResult(result); renderSqlHistory();
  } catch (err) { panel.classList.remove("hidden"); document.getElementById("sqlResultBody").innerHTML = `<tr><td class="p-4 text-red-600 font-mono text-xs">${err.message}</td></tr>`; document.getElementById("sqlResultHeader").innerHTML = ''; }
}

function renderSqlResult(result) {
  const head = document.getElementById("sqlResultHeader"); const body = document.getElementById("sqlResultBody"); if (!head || !body) return;
  if (!result || !result.length) { head.innerHTML = ''; body.innerHTML = `<tr><td class="p-4 text-xs text-slate-400 italic">No results.</td></tr>`; return; }
  const keys = Object.keys(result[0]);
  head.innerHTML = `<tr class="bg-slate-50 border-b">${keys.map(k => `<th class="p-3 uppercase tracking-wider text-xs">${k}</th>`).join('')}</tr>`;
  body.innerHTML = result.slice(0,200).map(row => `<tr class="border-b">${keys.map(k => `<td class="p-3 font-mono text-xs">${row[k] !== undefined ? row[k] : ''}</td>`).join('')}</tr>`).join('');
  if (result.length > 200) body.innerHTML += `<tr><td colspan="${keys.length}" class="p-3 text-center text-slate-400 italic bg-slate-50">Showing 200 of ${result.length} rows.</td></tr>`;
}

async function renderSqlHistory() {
  const container = document.getElementById("sqlHistoryContainer"); if (!container) return;
  const history = await StateDB.get("sql_history") || [];
  if (!history.length) { container.innerHTML = `<p class="text-xs text-slate-400 italic">No queries yet.</p>`; return; }
  container.innerHTML = history.map(h => `<div class="flex justify-between items-center p-2 border rounded-lg hover:bg-slate-50 cursor-pointer text-xs" onclick="document.getElementById('sqlTerminalField').value='${h.query.replace(/'/g,"\\'")}'"><span class="font-mono truncate max-w-[70%]">${h.query}</span><span class="text-slate-400">${h.rows} rows · ${h.time}</span></div>`).join('');
}

function exportSqlResult() {
  const table = document.getElementById("sqlResultBody"); if (!table) return;
  const rows = Array.from(table.querySelectorAll("tr")).map(tr => Array.from(tr.querySelectorAll("td")).map(td => `"${td.innerText.replace(/"/g,'""')}"`).join(','));
  const header = document.getElementById("sqlResultHeader"); if (header) { const h = Array.from(header.querySelectorAll("th")).map(th => `"${th.innerText.replace(/"/g,'""')}"`).join(','); rows.unshift(h); }
  const blob = new Blob([rows.join('\n')], {type:'text/csv'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sql_results.csv'; a.click(); URL.revokeObjectURL(a.href); showToast('SQL results exported','success');
}

/* ========== ANALYST ========== */
function initAnalystPage() {
  const sel = document.getElementById("analystToolSelector"); if (!sel) return;
  const desc = document.getElementById("analystToolDescription");
  const descriptions = {
    rfm: "RFM Segmentation: Recency (how recent), Frequency (how often), Monetary (how much). Use Member/Customer ID, Date, and Amount columns.",
    fraud: "Benford's Law: Analyzes first-digit distribution of numeric values to detect anomalies. Good for financial audit.",
    basket: "Market Basket: Analyzes co-occurrence of items in transactions to find association rules. Requires Transaction ID and Item columns.",
    trend: "Moving Average: Smooths a numeric time series by averaging over a rolling window. Requires Date and numeric value.",
    stats: "Descriptive Statistics: Mean, median, std dev, min, max, mode, correlation matrix for numeric columns."
  };
  const update = () => { if(desc) desc.innerHTML = `<p class="text-xs font-bold text-slate-600">${descriptions[sel.value] || ''}</p>`; };
  sel.addEventListener("change", update); update();
  document.getElementById("btnRunAnalystModel")?.addEventListener("click", runAnalystModel);
  // Populate selectors
  const cols = activeColumns;
  const numCols = cols.filter(c => inferType(workingDataset.map(r=>r[c])) === 'number');
  const dateCols = cols.filter(c => inferType(workingDataset.map(r=>r[c])) === 'date');
  const allOpts = cols.map(c => `<option value="${c}">${c}</option>`).join('');
  const numOpts = numCols.map(c => `<option value="${c}">${c}</option>`).join('');
  const dateOpts = dateCols.map(c => `<option value="${c}">${c}</option>`).join('');
  document.getElementById("analystIdCol") && (document.getElementById("analystIdCol").innerHTML = allOpts);
  document.getElementById("analystDateCol") && (document.getElementById("analystDateCol").innerHTML = dateOpts || allOpts);
  document.getElementById("analystAmountCol") && (document.getElementById("analystAmountCol").innerHTML = numOpts || allOpts);
  document.getElementById("analystNumCol") && (document.getElementById("analystNumCol").innerHTML = numOpts || allOpts);
  document.getElementById("analystBenfordCol") && (document.getElementById("analystBenfordCol").innerHTML = numCols.map(c => `<option value="${c}">${c}</option>`).join('') || '<option>No numeric</option>');
}

async function runAnalystModel() {
  const model = document.getElementById("analystToolSelector")?.value;
  const container = document.getElementById("analystModellerSandbox"); if (!container) return;
  if (!workingDataset.length) { container.innerHTML = `<div class="p-8 text-center text-xs text-slate-400 italic">Load data first.</div>`; return; }
  showLoader("Running model...");
  container.innerHTML = '';
  if (model === 'rfm') {
    const idCol = document.getElementById("analystIdCol")?.value; const dateCol = document.getElementById("analystDateCol")?.value; const amountCol = document.getElementById("analystAmountCol")?.value;
    if (!idCol || !dateCol || !amountCol) { showToast("Select all columns for RFM","warning"); hideLoader(); return; }
    const result = rfmSegmentation(workingDataset, idCol, dateCol, amountCol);
    const counts = {}; result.forEach(r => { counts[r.segment] = (counts[r.segment]||0)+1; });
    let html = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="bg-white border rounded-xl p-4"><h4 class="font-bold text-xs mb-2">Segment Distribution</h4><canvas id="rfmChart"></canvas></div><div class="overflow-auto h-64 border rounded-xl"><table class="w-full text-xs"><thead class="bg-slate-50 border-b"><tr><th class="p-2">ID</th><th class="p-2">R</th><th class="p-2">F</th><th class="p-2">M</th><th class="p-2">Segment</th></tr></thead><tbody class="divide-y">${result.slice(0,50).map(r=>`<tr><td class="p-2">${r.id}</td><td class="p-2">${r.recencyScore}</td><td class="p-2">${r.frequencyScore}</td><td class="p-2">${r.monetaryScore}</td><td class="p-2 font-bold text-violet-700">${r.segment}</td></tr>`).join('')}</tbody></table></div></div>`;
    container.innerHTML = html;
    setTimeout(() => {
      const ctx = document.getElementById('rfmChart')?.getContext('2d'); if(!ctx) return;
      new Chart(ctx, { type:'doughnut', data:{ labels:Object.keys(counts), datasets:[{ data:Object.values(counts), backgroundColor:['#7c3aed','#10b981','#f59e0b','#ef4444'] }] }, options:{ responsive:true, maintainAspectRatio:false } });
    }, 0);
  } else if (model === 'fraud') {
    const col = document.getElementById("analystBenfordCol")?.value;
    if (!col) { showToast("Select numeric column","warning"); hideLoader(); return; }
    const analysis = benfordAnalysis(workingDataset.map(r => r[col]));
    if (!analysis) { container.innerHTML = `<div class="p-4 text-xs text-red-600">Not enough positive numeric data.</div>`; hideLoader(); return; }
    let html = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="bg-white border rounded-xl p-4"><h4 class="font-bold text-xs mb-2">Benford's Law: ${col}</h4><canvas id="benfordChart"></canvas></div><div class="bg-white border rounded-xl p-4 overflow-auto"><table class="w-full text-xs"><thead class="bg-slate-50 border-b"><tr><th class="p-2">Digit</th><th class="p-2">Actual</th><th class="p-2">Expected</th><th class="p-2">Diff</th></tr></thead><tbody class="divide-y">${analysis.distribution.map(d=>`<tr><td class="p-2 font-bold">${d.digit}</td><td class="p-2">${d.actual} (${d.actualPct}%)</td><td class="p-2">${d.expected} (${d.expectedPct}%)</td><td class="p-2 ${Math.abs(d.actualPct-d.expectedPct)>5?'text-red-600':'text-emerald-600'}">${Math.round((d.actualPct-d.expectedPct)*10)/10}%</td></tr>`).join('')}</tbody></table></div></div>`;
    container.innerHTML = html;
    setTimeout(() => {
      const ctx = document.getElementById('benfordChart')?.getContext('2d'); if(!ctx) return;
      new Chart(ctx, { type:'bar', data:{ labels:analysis.distribution.map(d=>d.digit), datasets:[{ label:'Actual', data:analysis.distribution.map(d=>d.actualPct), backgroundColor:'rgba(124,58,237,0.7)' },{ label:'Expected', data:analysis.distribution.map(d=>d.expectedPct), backgroundColor:'rgba(148,163,184,0.5)' }] }, options:{ responsive:true, maintainAspectRatio:false } });
    }, 0);
  } else if (model === 'trend') {
    const col = document.getElementById("analystNumCol")?.value; const win = parseInt(document.getElementById("analystWindow")?.value || 3);
    if (!col) { showToast("Select numeric column","warning"); hideLoader(); return; }
    const vals = workingDataset.map(r => r[col]).filter(v => v !== null && !isNaN(Number(v))).map(Number);
    const ma = movingAverage(vals, win);
    let html = `<div class="bg-white border rounded-xl p-4"><h4 class="font-bold text-xs mb-2">Moving Average (${win} periods): ${col}</h4><canvas id="trendChart"></canvas></div>`;
    container.innerHTML = html;
    setTimeout(() => {
      const ctx = document.getElementById('trendChart')?.getContext('2d'); if(!ctx) return;
      new Chart(ctx, { type:'line', data:{ labels:ma.map((_,i)=>i+1), datasets:[{ label:'Raw', data:ma.map(m=>m.value), borderColor:'rgba(148,163,184,0.7)', tension:0.1 },{ label:'Moving Avg', data:ma.map(m=>m.avg), borderColor:'#7c3aed', tension:0.3 }] }, options:{ responsive:true, maintainAspectRatio:false } });
    }, 0);
  } else if (model === 'stats') {
    const numCols = activeColumns.filter(c => inferType(workingDataset.map(r=>r[c])) === 'number');
    let html = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
    for (const c of numCols.slice(0,4)) {
      const stats = describeColumn(workingDataset.map(r => r[c]), 'number');
      html += `<div class="bg-white border rounded-xl p-4"><h4 class="font-bold text-xs mb-2">${c} — Descriptive Stats</h4><div class="grid grid-cols-2 gap-2 text-xs"><div class="bg-slate-50 p-2 rounded"><div class="text-slate-500 text-[10px] uppercase">Mean</div><div class="font-bold">${Math.round(stats.mean*100)/100}</div></div><div class="bg-slate-50 p-2 rounded"><div class="text-slate-500 text-[10px] uppercase">Median</div><div class="font-bold">${Math.round(stats.median*100)/100}</div></div><div class="bg-slate-50 p-2 rounded"><div class="text-slate-500 text-[10px] uppercase">Std Dev</div><div class="font-bold">${Math.round(stats.std*100)/100}</div></div><div class="bg-slate-50 p-2 rounded"><div class="text-slate-500 text-[10px] uppercase">Range</div><div class="font-bold">${Math.round(stats.min*100)/100} - ${Math.round(stats.max*100)/100}</div></div></div></div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
  }
  hideLoader();
}

/* ========== LEARNING ========== */
function initLearnPage() {
  const search = document.getElementById("glossarySearchField"); const list = document.getElementById("glossaryListContainer"); if (!list) return;
  const terms = {
    "Data Cleaning": "Removing duplicates, handling nulls, standardizing formats, and fixing inconsistencies in raw data.",
    "ETL": "Extract, Transform, Load. The process of moving data from sources to a target system after transformation.",
    "Pivot Table": "A data summarization tool that automatically sorts, counts, and totals data stored in one table.",
    "Correlation": "A statistical measure expressing the extent to which two variables fluctuate together.",
    "RFM": "Recency, Frequency, Monetary. A marketing analysis tool to identify a firm's best customers.",
    "Benford's Law": "An observation about the leading digits of numbers in real-world datasets, used for fraud detection.",
    "AlaSQL": "A lightweight client-side in-memory SQL database for JavaScript.",
    "IndexedDB": "A browser-based database system that allows for significant storage of structured data.",
    "Outlier": "A data point that differs significantly from other observations."
  };
  const render = (q='') => {
    const entries = Object.entries(terms).filter(([k,v]) => k.toLowerCase().includes(q.toLowerCase()) || v.toLowerCase().includes(q.toLowerCase()));
    list.innerHTML = entries.map(([k,v]) => `<div class="border-b pb-2"><h4 class="font-extrabold text-violet-700 text-xs">${k}</h4><p class="text-[11px] text-slate-500">${v}</p></div>`).join('') || `<div class="text-xs text-slate-400 italic">No terms match.</div>`;
  };
  if (search) search.addEventListener("input", e => render(e.target.value)); render();
  document.querySelectorAll(".learn-workflow-btn").forEach(btn => btn.addEventListener("click", () => { showToast("Workflow loaded into workspace!","success"); loadMock("hr_directory"); }));
}

/* ========== BRAND ========== */
function initBrandPage() {
  const btn = document.getElementById("btnApplyWhiteLabel"); if (!btn) return;
  btn.addEventListener("click", async () => {
    const brand = {
      name: document.getElementById("brandConsoleTitle")?.value?.trim() || "DAWF v5",
      tagline: document.getElementById("brandConsoleTagline")?.value?.trim() || "Learning Deliberately. Teaching Authentically.",
      logo: document.getElementById("brandConsoleLogo")?.value || "📊",
      color: document.getElementById("brandConsoleColorPicker")?.value || "#7c3aed"
    };
    await StateDB.set("brand_config", brand); showToast("Branding applied across all pages.","success"); window.location.reload();
  });
  const darkBtn = document.getElementById("btnToggleDarkMode"); if (darkBtn) {
    const updateKnob = async () => {
      const isDark = await StateDB.get("dark_mode") || false;
      const knob = document.getElementById("darkModeKnob");
      if (isDark) { darkBtn.classList.remove("bg-slate-300"); darkBtn.classList.add("bg-violet-600"); if(knob) knob.style.left = "26px"; document.documentElement.classList.add('dark'); }
      else { darkBtn.classList.add("bg-slate-300"); darkBtn.classList.remove("bg-violet-600"); if(knob) knob.style.left = "4px"; document.documentElement.classList.remove('dark'); }
    };
    updateKnob();
    darkBtn.addEventListener("click", async () => { const isDark = await StateDB.get("dark_mode") || false; await StateDB.set("dark_mode", !isDark); await updateKnob(); window.location.reload(); });
  }
}

/* ========== REPORT ========== */
function initReportPage() {
  const editor = document.getElementById("reportEditor"); const preview = document.getElementById("reportPreview"); if (!editor || !preview) return;
  const update = async () => {
    const ds = await StateDB.get("working_dataset") || [];
    const meta = await StateDB.get("active_file_meta") || { name: "N/A" };
    const numCols = Object.keys(ds[0]||{}).filter(c => inferType(ds.map(r=>r[c]))==='number');
    let sum = 0; if (numCols.length) sum = ds.reduce((s,r)=>s+(Number(r[numCols[0]])||0),0);
    let text = editor.value;
    text = text.replace(/{{total_rows}}/g, ds.length.toLocaleString());
    text = text.replace(/{{file_name}}/g, meta.name);
    text = text.replace(/{{date}}/g, new Date().toLocaleDateString());
    text = text.replace(/{{sum_first_numeric}}/g, Math.round(sum*100)/100);
    preview.innerHTML = marked.parse(text);
  };
  editor.addEventListener('input', update);
  if (!editor.value) editor.value = `# Executive Data Report: {{file_name}}\n\n**Date:** {{date}}\n\n## Overview\n- **Records:** {{total_rows}}\n- **Sum (first numeric):** {{sum_first_numeric}}\n\n## Insights\nUse the Executive Report page to write custom narratives alongside your data.\n\n---\n*Generated by DAWF v5 Enhanced*\n`;
  update();
}

// Global init
document.addEventListener("DOMContentLoaded", initApp);
