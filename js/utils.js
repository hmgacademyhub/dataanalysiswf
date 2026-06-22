/**
 * DAWF v5 Enhanced — Utilities, Toasts, Stats, Quality Engine, Data Inference
 */

// Toast system
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} flex items-center gap-2`;
  let icon = 'info';
  if (type === 'error') icon = 'alert-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'warning') icon = 'alert-triangle';
  toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i><span>${message}</span>`;
  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Sleep helper
const sleep = (ms) => new Promise(r => setTimeout(r, ms));


// Safe icon renderer: prevents one failed CDN from breaking all click handlers.
function safeLucideCreate() {
  try { if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons(); }
  catch (e) { console.warn('Lucide icon rendering skipped:', e); }
}

// Lightweight CSV parser fallback. Keeps uploads working when PapaParse CDN is unavailable.
function parseCSVText(text) {
  const rows = [];
  let row = [], cell = '', inQuotes = false;
  const pushCell = () => { row.push(cell); cell = ''; };
  const pushRow = () => { rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') { cell += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) pushCell();
    else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;
      pushCell(); pushRow();
    } else cell += ch;
  }
  if (cell.length || row.length) { pushCell(); pushRow(); }
  const headers = (rows.shift() || []).map((h, i) => String(h || `Column_${i+1}`).trim() || `Column_${i+1}`);
  return rows
    .filter(r => r.some(v => String(v ?? '').trim() !== ''))
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = r[i] !== undefined ? r[i] : null; });
      return obj;
    });
}

function parseCSVSource(source, onComplete, onError) {
  const done = (rows) => onComplete(Array.isArray(rows) ? rows : []);
  const fail = (err) => { console.error('CSV parse failed:', err); if (onError) onError(err); else showToast('CSV parse failed: ' + (err.message || err), 'error'); };
  try {
    if (window.Papa && typeof Papa.parse === 'function') {
      Papa.parse(source, { header: true, skipEmptyLines: true, complete: (results) => done(results.data), error: fail });
      return;
    }
    if (source instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => { try { done(parseCSVText(e.target.result || '')); } catch (err) { fail(err); } };
      reader.onerror = () => fail(reader.error || new Error('Could not read file'));
      reader.readAsText(source);
    } else done(parseCSVText(String(source || '')));
  } catch (err) { fail(err); }
}

function normalizeDatasetRows(rows) {
  const cleaned = (rows || []).filter(r => r && Object.values(r).some(v => v !== null && v !== undefined && String(v).trim() !== ''));
  if (!cleaned.length) return [];
  const originalHeaders = Object.keys(cleaned[0]);
  const seen = {};
  const headers = originalHeaders.map((h, i) => {
    let base = String(h || `Column_${i+1}`).trim() || `Column_${i+1}`;
    seen[base] = (seen[base] || 0) + 1;
    return seen[base] > 1 ? `${base}_${seen[base]}` : base;
  });
  if (headers.every((h, i) => h === originalHeaders[i])) return cleaned;
  return cleaned.map(row => {
    const obj = {};
    originalHeaders.forEach((old, i) => obj[headers[i]] = row[old]);
    return obj;
  });
}

// Minimal Chart.js-compatible fallback so dashboards do not crash offline.
(function installChartFallback(){
  if (window.Chart) return;
  window.Chart = function(ctx, config) {
    const canvas = ctx && ctx.canvas;
    if (!canvas) return { destroy(){} };
    const labels = (config?.data?.labels || []).slice(0, 16);
    const ds = (config?.data?.datasets?.[0]?.data || []).map(Number).slice(0, 16);
    const w = canvas.width || canvas.clientWidth || 640, h = canvas.height || canvas.clientHeight || 320;
    canvas.width = w; canvas.height = h;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#475569'; ctx.font = '12px sans-serif';
    ctx.fillText('Offline chart fallback (load Chart.js for full interactivity)', 12, 18);
    const max = Math.max(...ds, 1), barW = Math.max(8, (w-40)/(ds.length || 1)-6);
    ds.forEach((v,i)=>{
      const bh = Math.max(2, (h-70) * (v/max));
      const x = 20 + i*(barW+6), y = h-35-bh;
      ctx.fillStyle = '#7c3aed'; ctx.fillRect(x,y,barW,bh);
      ctx.fillStyle = '#64748b'; ctx.fillText(String(labels[i] ?? i+1).slice(0,8), x, h-16);
    });
    return { destroy(){ ctx.clearRect(0,0,w,h); } };
  };
})();

function markdownToHtmlFallback(text) {
  return String(text || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)$/gm, '<li>$1</li>').replace(/\n/g, '<br>');
}

// Small SELECT fallback when AlaSQL is unavailable. Supports: SELECT *|col,... FROM data [WHERE col = value] [LIMIT n]
function executeSimpleSQL(query, data) {
  const q = String(query || '').trim().replace(/;$/, '');
  const match = q.match(/^select\s+(.+?)\s+from\s+data(?:\s+where\s+(.+?))?(?:\s+limit\s+(\d+))?$/i);
  if (!match) throw new Error('AlaSQL is offline. Fallback supports SELECT columns FROM data [WHERE col = value] [LIMIT n].');
  let [, fields, where, limit] = match;
  let rows = [...(data || [])];
  if (where) {
    const wm = where.match(/^([\w\s.-]+?)\s*(=|!=|>|<|>=|<=)\s*['"]?(.+?)['"]?$/);
    if (!wm) throw new Error('Unsupported WHERE clause in fallback SQL.');
    const [, colRaw, op, valRaw] = wm; const col = colRaw.trim(); const val = valRaw.trim();
    rows = rows.filter(r => {
      const left = r[col]; const ln = Number(left), rn = Number(val);
      const numeric = !Number.isNaN(ln) && !Number.isNaN(rn);
      const a = numeric ? ln : String(left ?? ''); const b = numeric ? rn : val;
      return op === '=' ? a == b : op === '!=' ? a != b : op === '>' ? a > b : op === '<' ? a < b : op === '>=' ? a >= b : a <= b;
    });
  }
  if (fields.trim() !== '*') {
    const cols = fields.split(',').map(s => s.trim());
    rows = rows.map(r => Object.fromEntries(cols.map(c => [c, r[c]])));
  }
  return rows.slice(0, limit ? Number(limit) : rows.length);
}

// Data type inference
function inferType(values) {
  let numCount = 0, dateCount = 0, boolCount = 0, nullCount = 0, total = 0;
  for (const v of values) {
    if (v === null || v === undefined || String(v).trim() === '' || String(v).toLowerCase() === 'null' || String(v).toLowerCase() === 'nan') { nullCount++; continue; }
    total++;
    const s = String(v).trim();
    if (s === 'true' || s === 'false' || s === '1' || s === '0' || s === 'yes' || s === 'no') boolCount++;
    if (!isNaN(Number(s)) && s !== '') numCount++;
    if (!isNaN(Date.parse(s)) && s.length > 5) dateCount++;
  }
  if (nullCount === values.length) return 'null';
  if (boolCount / total > 0.8) return 'boolean';
  if (dateCount / total > 0.7) return 'date';
  if (numCount / total > 0.8) return 'number';
  return 'text';
}

function castValue(value, type) {
  if (value === null || value === undefined || String(value).trim() === '' || String(value).toLowerCase() === 'null' || String(value).toLowerCase() === 'nan') return null;
  const s = String(value).trim();
  if (type === 'number') { const n = Number(s); return isNaN(n) ? null : n; }
  if (type === 'date') { const d = new Date(s); return isNaN(d.getTime()) ? null : d; }
  if (type === 'boolean') { return ['true','1','yes','y'].includes(s.toLowerCase()); }
  return s;
}

// Quality scoring engine
function computeQualityScore(dataset, columns, pipelineSettings) {
  if (!dataset || !dataset.length) return { score: 0, nullCount: 0, duplicateRows: 0, mixedTypes: 0, issues: [] };
  const totalCells = dataset.length * columns.length;
  let nullCount = 0, mixedTypes = 0, issues = [];
  const seenRows = new Set();
  let duplicateRows = 0;
  for (const row of dataset) {
    const key = JSON.stringify(columns.map(c => row[c]));
    if (seenRows.has(key)) duplicateRows++; else seenRows.add(key);
  }
  for (const col of columns) {
    const values = dataset.map(r => r[col]);
    const inferred = inferType(values);
    const nulls = values.filter(v => v === null || v === undefined || String(v).trim() === '' || String(v).toLowerCase() === 'null' || String(v).toLowerCase() === 'nan').length;
    nullCount += nulls;
    if (inferred === 'text') {
      const numLike = values.filter(v => v !== null && v !== undefined && !isNaN(Number(String(v).trim())) && String(v).trim() !== '').length;
      if (numLike > values.length * 0.3) mixedTypes++;
    }
    if (nulls > 0) {
      issues.push({ col, severity: nulls > dataset.length * 0.2 ? 'high' : 'medium', message: `${nulls} missing values (${Math.round(nulls/dataset.length*100)}%)` });
    }
  }
  if (duplicateRows > 0) issues.push({ col: 'All Columns', severity: 'medium', message: `${duplicateRows} duplicate rows detected` });
  let score = 100;
  score -= Math.min(30, Math.round((nullCount / totalCells) * 100));
  score -= Math.min(20, duplicateRows);
  score -= Math.min(20, mixedTypes * 5);
  score = Math.max(0, Math.min(100, score));
  return { score, nullCount, duplicateRows, mixedTypes, issues };
}

// Descriptive statistics (using simple-statistics if available, else fallback)
function describeColumn(values, type) {
  const clean = values.map(v => castValue(v, type)).filter(v => v !== null);
  if (!clean.length) return { count: 0, missing: values.length, mean: 0, median: 0, min: 0, max: 0, std: 0, unique: 0, mode: null };
  const count = clean.length;
  const missing = values.length - count;
  if (type === 'number') {
    const nums = clean.map(Number);
    const mean = nums.reduce((a,b)=>a+b,0)/nums.length;
    const sorted = [...nums].sort((a,b)=>a-b);
    const median = sorted.length % 2 ? sorted[(sorted.length-1)/2] : (sorted[sorted.length/2-1]+sorted[sorted.length/2])/2;
    const min = sorted[0], max = sorted[sorted.length-1];
    const variance = nums.reduce((a,b)=>a+Math.pow(b-mean,2),0)/nums.length;
    const std = Math.sqrt(variance);
    const freq = {};
    for (const n of nums) freq[n] = (freq[n]||0)+1;
    const mode = Object.keys(freq).reduce((a,b)=>freq[a]>freq[b]?a:b, Object.keys(freq)[0]);
    const unique = new Set(nums).size;
    return { count, missing, mean, median, min, max, std, unique, mode: Number(mode) };
  }
  if (type === 'date') {
    const ts = clean.map(d => d.getTime()).sort((a,b)=>a-b);
    const min = new Date(ts[0]), max = new Date(ts[ts.length-1]);
    const mean = new Date(ts.reduce((a,b)=>a+b,0)/ts.length);
    const mid = ts.length % 2 ? ts[(ts.length-1)/2] : (ts[ts.length/2-1]+ts[ts.length/2])/2;
    return { count, missing, mean, median: new Date(mid), min, max, std: 0, unique: new Set(ts).size, mode: null };
  }
  const freq = {};
  for (const v of clean) freq[v] = (freq[v]||0)+1;
  const mode = Object.keys(freq).reduce((a,b)=>freq[a]>freq[b]?a:b, Object.keys(freq)[0]);
  return { count, missing, mean: 0, median: 0, min: null, max: null, std: 0, unique: new Set(clean).size, mode };
}

// Correlation matrix (numeric columns only)
function correlationMatrix(dataset, columns) {
  const numericCols = columns.filter(c => inferType(dataset.map(r=>r[c])) === 'number');
  if (numericCols.length < 2) return null;
  const matrix = {};
  for (const a of numericCols) {
    matrix[a] = {};
    for (const b of numericCols) {
      const av = dataset.map(r => castValue(r[a], 'number')).filter(v => v !== null);
      const bv = dataset.map(r => castValue(r[b], 'number')).filter(v => v !== null);
      if (av.length !== bv.length) { matrix[a][b] = 0; continue; }
      const n = av.length;
      const meanA = av.reduce((s,v)=>s+v,0)/n, meanB = bv.reduce((s,v)=>s+v,0)/n;
      let num = 0, denA = 0, denB = 0;
      for (let i=0;i<n;i++) { num += (av[i]-meanA)*(bv[i]-meanB); denA += Math.pow(av[i]-meanA,2); denB += Math.pow(bv[i]-meanB,2); }
      matrix[a][b] = denA && denB ? (num / Math.sqrt(denA*denB)) : 0;
    }
  }
  return { cols: numericCols, matrix };
}

// Benford's Law analysis
function benfordAnalysis(values) {
  const nums = values.map(Number).filter(n => n > 0 && !isNaN(n));
  if (nums.length < 10) return null;
  const counts = new Array(9).fill(0);
  for (const n of nums) {
    const first = parseInt(String(Math.abs(n)).replace(/^0+/, '').charAt(0));
    if (first >= 1 && first <= 9) counts[first-1]++;
  }
  const total = counts.reduce((a,b)=>a+b,0);
  const expected = [30.1, 17.6, 12.5, 9.7, 7.9, 6.7, 5.8, 5.1, 4.6].map(p => total * p / 100);
  const distribution = counts.map((c,i) => ({ digit: i+1, actual: c, expected: Math.round(expected[i]*10)/10, actualPct: Math.round(c/total*1000)/10, expectedPct: [30.1,17.6,12.5,9.7,7.9,6.7,5.8,5.1,4.6][i] }));
  return { total, distribution };
}

// RFM Segmentation helper
function rfmSegmentation(dataset, idCol, dateCol, amountCol, dateNow = new Date()) {
  const ids = [...new Set(dataset.map(r => r[idCol]))];
  const now = dateNow.getTime();
  const result = [];
  for (const id of ids) {
    const rows = dataset.filter(r => r[idCol] === id);
    const dates = rows.map(r => new Date(r[dateCol]).getTime()).filter(t => !isNaN(t));
    const amounts = rows.map(r => Number(r[amountCol])).filter(n => !isNaN(n));
    const recency = dates.length ? Math.round((now - Math.max(...dates)) / (1000*60*60*24)) : 999;
    const frequency = rows.length;
    const monetary = amounts.length ? amounts.reduce((a,b)=>a+b,0) : 0;
    result.push({ id, recency, frequency, monetary });
  }
  // Quintile scoring 1-5
  const score = (arr, field, asc=true) => {
    const sorted = [...arr].sort((a,b) => asc ? a[field]-b[field] : b[field]-a[field]);
    const n = sorted.length;
    return sorted.map((item, idx) => ({ ...item, [`${field}Score`]: Math.ceil((idx+1)/n*5) }));
  };
  let scored = score(result, 'recency', true); // lower recency = higher score
  scored = score(scored, 'frequency', false);
  scored = score(scored, 'monetary', false);
  return scored.map(r => ({
    ...r,
    rfm: `${r.recencyScore}${r.frequencyScore}${r.monetaryScore}`,
    segment: (r.recencyScore >= 4 && r.frequencyScore >= 4 && r.monetaryScore >= 4) ? 'Champions' :
              (r.recencyScore >= 3 && r.frequencyScore >= 3 && r.monetaryScore >= 3) ? 'Loyal' :
              (r.recencyScore >= 4 && r.frequencyScore <= 2) ? 'New' :
              (r.recencyScore <= 2 && r.frequencyScore >= 3) ? 'At Risk' : 'Others'
  }));
}

// Moving average
function movingAverage(values, windowSize) {
  const nums = values.map(Number).filter(n => !isNaN(n));
  const out = [];
  for (let i = 0; i < nums.length; i++) {
    const slice = nums.slice(Math.max(0, i - windowSize + 1), i + 1);
    out.push({ index: i, value: nums[i], avg: slice.reduce((a,b)=>a+b,0)/slice.length });
  }
  return out;
}

// Save workspace recipe
async function saveRecipe() {
  const recipe = {
    version: 'v5-enhanced',
    date: new Date().toISOString(),
    rawDataset: await StateDB.get('raw_dataset') || [],
    workingDataset: await StateDB.get('working_dataset') || [],
    originalColumns: await StateDB.get('original_columns') || [],
    activeColumns: await StateDB.get('active_columns') || [],
    activeFileMeta: await StateDB.get('active_file_meta') || null,
    pipelineSettings: await StateDB.get('pipeline_settings') || {},
    activeFormulas: await StateDB.get('active_formulas') || [],
    brand: await StateDB.get('brand_config') || null,
    darkMode: await StateDB.get('dark_mode') || false
  };
  const blob = new Blob([JSON.stringify(recipe, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `dawf_recipe_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Workspace recipe exported successfully', 'success');
}

// Load workspace recipe
async function loadRecipe(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const recipe = JSON.parse(e.target.result);
        if (!recipe.version) throw new Error('Invalid recipe file');
        await StateDB.set('raw_dataset', recipe.rawDataset || []);
        await StateDB.set('working_dataset', recipe.workingDataset || []);
        await StateDB.set('original_columns', recipe.originalColumns || []);
        await StateDB.set('active_columns', recipe.activeColumns || []);
        await StateDB.set('active_file_meta', recipe.activeFileMeta || null);
        await StateDB.set('pipeline_settings', recipe.pipelineSettings || {});
        await StateDB.set('active_formulas', recipe.activeFormulas || []);
        if (recipe.brand) await StateDB.set('brand_config', recipe.brand);
        if (recipe.darkMode !== undefined) await StateDB.set('dark_mode', recipe.darkMode);
        showToast('Recipe loaded successfully', 'success');
        resolve(true);
      } catch (err) { showToast('Failed to load recipe: ' + err.message, 'error'); reject(err); }
    };
    reader.readAsText(file);
  });
}

window.showToast = showToast;
window.sleep = sleep;
window.inferType = inferType;
window.castValue = castValue;
window.computeQualityScore = computeQualityScore;
window.describeColumn = describeColumn;
window.correlationMatrix = correlationMatrix;
window.benfordAnalysis = benfordAnalysis;
window.rfmSegmentation = rfmSegmentation;
window.movingAverage = movingAverage;
window.saveRecipe = saveRecipe;
window.loadRecipe = loadRecipe;
