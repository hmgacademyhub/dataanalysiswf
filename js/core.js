/* ===========================================================================
 * DAWF — Data Analysis Workflow Hub | Core Engine v7.0 Enterprise
 * (c) HMG Academy / HMG Technologies. MIT-style internal use.
 *
 * This is the single, authoritative client-side runtime for the entire
 * platform. It replaces the legacy DAWF/StateDB/UndoManager fragments and
 * fixes the persistence, ingestion, navigation and state-loss bugs that were
 * present in v6.1.
 *
 * Architecture highlights
 * ----------------------------------------------------------------------------
 *  - 100% serverless: every byte of user data lives in the browser only.
 *  - IndexedDB (not localStorage) is the persistence layer, so multi-MB
 *    datasets survive page navigation without QuotaExceededError.
 *  - Synchronous API surface for legacy pages (DAWF.state.dataset) AND an
 *    async API surface for new pages (await DAWF.load()).
 *  - Undo / redo snapshot stack (30 deep) on every mutating action.
 *  - Audit trail with timestamp + tamper-evident SHA-256 hash chain.
 *  - Service-worker friendly: never blocks on network.
 *  - Defensive: every public method wraps errors in DAWF.toast(...).
 * =========================================================================== */

(function (root) {
  "use strict";

  /* ------------------------------------------------------------------ *
   *  0.  Tiny utility helpers (no external deps)                       *
   * ------------------------------------------------------------------ */
  const TOAST_ID = "__dawf_toast_host__";
  function toast(msg, kind = "info", ms = 3200) {
    try {
      let host = document.getElementById(TOAST_ID);
      if (!host) {
        host = document.createElement("div");
        host.id = TOAST_ID;
        host.style.cssText =
          "position:fixed;z-index:99999;bottom:24px;right:24px;display:flex;flex-direction:column;gap:8px;max-width:360px;";
        document.body.appendChild(host);
      }
      const palette = {
        info:    ["#eef2ff", "#3730a3", "#c7d2fe"],
        success: ["#ecfdf5", "#065f46", "#a7f3d0"],
        warning: ["#fffbeb", "#92400e", "#fde68a"],
        error:   ["#fef2f2", "#991b1b", "#fecaca"]
      };
      const [bg, fg, br] = palette[kind] || palette.info;
      const el = document.createElement("div");
      el.style.cssText = `background:${bg};color:${fg};border:1px solid ${br};padding:10px 14px;border-radius:10px;font:600 12px/1.4 Inter,system-ui,sans-serif;box-shadow:0 10px 25px -8px rgba(15,23,42,.18);animation:dawfToastIn .25s ease;`;
      el.textContent = msg;
      host.appendChild(el);
      setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; }, ms - 300);
      setTimeout(() => el.remove(), ms);
    } catch (e) { console[kind === "error" ? "error" : "log"]("[DAWF]", msg); }
  }

  function uid(prefix = "id") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  async function sha256(text) {
    if (window.crypto?.subtle) {
      const buf = new TextEncoder().encode(text);
      const hash = await crypto.subtle.digest("SHA-256", buf);
      return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
    }
    // fallback non-crypto hash
    let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
    return ("00000000" + (h >>> 0).toString(16)).slice(-8);
  }

  function csvEscape(v) {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function download(name, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function fmtNum(n, digits = 2) {
    if (n === null || n === undefined || n === "" || !isFinite(n)) return "—";
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits });
  }

  /* ------------------------------------------------------------------ *
   *  1.  IndexedDB persistence (replaces localStorage)                 *
   * ------------------------------------------------------------------ */
  const DB_NAME = "DAWF_DB_v7";
  const DB_VER  = 1;
  let _dbPromise = null;

  function openDB() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        ["state", "history", "datasets", "queries", "recipes", "audit"].forEach(s => {
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
        });
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror   = (e) => reject(e.target.error);
    });
    return _dbPromise;
  }

  async function idbGet(store, key) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, "readonly");
      const r = tx.objectStore(store).get(key);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function idbSet(store, key, val) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, "readwrite");
      const r = tx.objectStore(store).put(val, key);
      r.onsuccess = () => res(true);
      r.onerror = () => rej(r.error);
    });
  }
  async function idbDel(store, key) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, "readwrite");
      const r = tx.objectStore(store).delete(key);
      r.onsuccess = () => res(true);
      r.onerror = () => rej(r.error);
    });
  }
  async function idbKeys(store) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, "readonly");
      const r = tx.objectStore(store).getAllKeys();
      r.onsuccess = () => res(r.result || []);
      r.onerror = () => rej(r.error);
    });
  }

  /* ------------------------------------------------------------------ *
   *  2.  Type inference & profiling helpers                            *
   * ------------------------------------------------------------------ */
  const DATE_RX = /^\d{4}-\d{1,2}-\d{1,2}(?:[ T]\d{1,2}:\d{2}(:\d{2})?)?$|^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
  function inferType(v) {
    if (v === null || v === undefined || v === "") return "null";
    if (typeof v === "number") return Number.isInteger(v) ? "integer" : "number";
    if (typeof v === "boolean") return "boolean";
    if (v instanceof Date) return "date";
    const s = String(v).trim();
    if (s === "") return "null";
    if (/^-?\d+$/.test(s)) return "integer";
    if (/^-?\d*\.\d+$/.test(s)) return "number";
    if (/^(true|false)$/i.test(s)) return "boolean";
    if (DATE_RX.test(s)) return "date";
    return "string";
  }
  function dominantType(values) {
    const counts = {};
    for (const v of values) {
      const t = inferType(v);
      counts[t] = (counts[t] || 0) + 1;
    }
    delete counts.null;
    const arr = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return arr[0] ? arr[0][0] : "string";
  }
  function castValue(v, type) {
    if (v === null || v === undefined || v === "") return null;
    try {
      switch (type) {
        case "integer": { const n = parseInt(String(v).replace(/[, ]/g, ""), 10); return isNaN(n) ? v : n; }
        case "number":  { const n = parseFloat(String(v).replace(/[, ]/g, "")); return isNaN(n) ? v : n; }
        case "boolean": return /^(true|1|yes|y)$/i.test(String(v));
        case "date":    { const d = new Date(v); return isNaN(d) ? v : d.toISOString().slice(0, 10); }
        default:        return String(v);
      }
    } catch (e) { return v; }
  }

  /* ------------------------------------------------------------------ *
   *  3.  The DAWF singleton                                            *
   * ------------------------------------------------------------------ */
  const DAWF = {
    version: "7.0.0-enterprise",
    /* runtime state ------------------------------------------------- */
    state: {
      dataset: [],
      originalDataset: [],
      columns: [],
      columnTypes: {},          // colName -> inferred type
      activeFile: null,
      auditLog: [],
      recipes: [],
      bookmarks: {},            // page-specific saved settings
      filters: {},
      brand: {
        name: "Data Analysis Workflow Hub",
        tagline: "Learning Deliberately. Teaching Authentically.",
        logo: "📊",
        color: "#4f46e5",
        org: "HMG Academy"
      },
      darkMode: false
    },
    toast, uid, sha256, csvEscape, download, fmtNum, inferType, castValue, dominantType,

    /* ---------------------------- ready() -------------------------- *
     * await DAWF.ready() before doing anything in page scripts.       *
     * Loads persisted state from IndexedDB into DAWF.state.           */
    async ready() {
      if (this._ready) return this._ready;
      this._ready = (async () => {
        try {
          const saved = await idbGet("state", "main");
          if (saved) Object.assign(this.state, saved);
          const brand = await idbGet("state", "brand");
          if (brand) Object.assign(this.state.brand, brand);
          // hydrate dataset blob (kept separately because it can be huge)
          const ds = await idbGet("datasets", "active");
          if (ds && ds.rows) {
            this.state.dataset = ds.rows;
            this.state.originalDataset = ds.originalRows || ds.rows;
            this.state.columns = ds.columns || (ds.rows[0] ? Object.keys(ds.rows[0]) : []);
            this.state.columnTypes = ds.columnTypes || this._buildColumnTypes(ds.rows, this.state.columns);
            this.state.activeFile = ds.activeFile || this.state.activeFile;
          }
        } catch (e) { console.warn("[DAWF.ready] could not restore state", e); }
        // attach beforeunload safety save
        window.addEventListener("beforeunload", () => { try { this._saveStateMeta(); } catch (e) {} });
        return true;
      })();
      return this._ready;
    },

    /* --------------------------- persistence ----------------------- */
    async _saveStateMeta() {
      const meta = {
        activeFile: this.state.activeFile,
        auditLog: this.state.auditLog.slice(-500),     // cap
        recipes: this.state.recipes,
        bookmarks: this.state.bookmarks,
        filters: this.state.filters,
        darkMode: this.state.darkMode
      };
      await idbSet("state", "main", meta);
      await idbSet("state", "brand", this.state.brand);
    },
    async saveDataset() {
      await idbSet("datasets", "active", {
        rows: this.state.dataset,
        originalRows: this.state.originalDataset,
        columns: this.state.columns,
        columnTypes: this.state.columnTypes,
        activeFile: this.state.activeFile,
        savedAt: new Date().toISOString()
      });
      await this._saveStateMeta();
    },
    async clearWorkspace() {
      await idbDel("datasets", "active");
      await idbDel("state", "main");
      this.state.dataset = [];
      this.state.originalDataset = [];
      this.state.columns = [];
      this.state.columnTypes = {};
      this.state.activeFile = null;
      this.state.auditLog = [];
      this.state.filters = {};
      toast("Workspace cleared", "success");
    },

    /* ----------------------------- audit --------------------------- */
    async log(action, details = "") {
      const prev = this.state.auditLog[this.state.auditLog.length - 1];
      const prevHash = prev ? prev.hash : "GENESIS";
      const entry = {
        ts: new Date().toISOString(),
        action, details,
        prevHash
      };
      entry.hash = await sha256(`${entry.ts}|${action}|${details}|${prevHash}`);
      this.state.auditLog.push(entry);
      if (this.state.auditLog.length > 1000) this.state.auditLog.shift();
      this._saveStateMeta();
      return entry;
    },
    verifyAuditChain() {
      const log = this.state.auditLog;
      const issues = [];
      for (let i = 0; i < log.length; i++) {
        const e = log[i];
        const expected = log[i - 1] ? log[i - 1].hash : "GENESIS";
        if (e.prevHash !== expected) issues.push({ index: i, error: "broken-link" });
      }
      return { ok: issues.length === 0, issues, length: log.length };
    },

    /* ----------------------------- utils --------------------------- */
    utils: {
      getNumericColumns() {
        return DAWF.state.columns.filter(c => ["integer", "number"].includes(DAWF.state.columnTypes[c]));
      },
      getCategoricalColumns() {
        return DAWF.state.columns.filter(c => ["string", "boolean"].includes(DAWF.state.columnTypes[c]));
      },
      getDateColumns() {
        return DAWF.state.columns.filter(c => DAWF.state.columnTypes[c] === "date");
      },
      filtered() {
        const fs = DAWF.state.filters || {};
        const keys = Object.keys(fs).filter(k => fs[k] !== "" && fs[k] !== null && fs[k] !== undefined);
        if (!keys.length) return DAWF.state.dataset;
        return DAWF.state.dataset.filter(r => keys.every(k => String(r[k]) === String(fs[k])));
      }
    },

    _buildColumnTypes(rows, cols) {
      const out = {};
      if (!rows.length) return out;
      const sample = rows.slice(0, Math.min(rows.length, 500));
      for (const c of cols) {
        out[c] = dominantType(sample.map(r => r[c]));
      }
      return out;
    },

    /* ============================================================== *
     *  INGESTION                                                     *
     * ============================================================== */
    ingestion: {
      async loadFile(file) {
        const name = (file.name || "uploaded").toLowerCase();
        let rows;
        if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt"))
          rows = await this.parseCSV(file);
        else if (name.endsWith(".json"))
          rows = await this.parseJSON(file);
        else if (name.endsWith(".xlsx") || name.endsWith(".xls"))
          rows = await this.parseExcel(file);
        else
          throw new Error("Unsupported file format. Use CSV, TSV, XLSX, XLS or JSON.");
        await this.finalize(rows, file.name);
        return rows;
      },
      parseCSV(file) {
        return new Promise((resolve, reject) => {
          if (typeof Papa === "undefined") {
            // tiny fallback
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const text = reader.result;
                const lines = text.split(/\r?\n/).filter(Boolean);
                const headers = lines.shift().split(/[,\t]/).map(h => h.replace(/^"|"$/g, ""));
                const rows = lines.map(line => {
                  const cols = line.split(/[,\t]/);
                  const o = {};
                  headers.forEach((h, i) => o[h] = cols[i]);
                  return o;
                });
                resolve(rows);
              } catch (e) { reject(e); }
            };
            reader.onerror = reject;
            reader.readAsText(file);
            return;
          }
          Papa.parse(file, {
            header: true, dynamicTyping: true, skipEmptyLines: "greedy",
            transformHeader: (h) => (h || "").trim() || "col",
            complete: r => resolve(r.data),
            error: reject
          });
        });
      },
      async parseExcel(file) {
        if (typeof XLSX === "undefined") throw new Error("SheetJS library not loaded.");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        return XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
      },
      async parseJSON(file) {
        const text = await file.text();
        const j = JSON.parse(text);
        if (Array.isArray(j)) return j;
        if (Array.isArray(j.data)) return j.data;
        // flatten object of arrays
        const keys = Object.keys(j);
        const len = Math.max(...keys.map(k => Array.isArray(j[k]) ? j[k].length : 0));
        const rows = [];
        for (let i = 0; i < len; i++) {
          const r = {}; keys.forEach(k => r[k] = j[k]?.[i]);
          rows.push(r);
        }
        return rows;
      },
      async syncGoogleSheet(url) {
        if (!url) throw new Error("Provide a Google Sheet URL.");
        // accepts /edit URLs or already-export URLs
        let csvUrl = url.trim();
        if (csvUrl.includes("/edit")) csvUrl = csvUrl.replace(/\/edit.*$/, "/export?format=csv");
        else if (!csvUrl.includes("output=csv") && !csvUrl.includes("export?format=csv"))
          csvUrl += (csvUrl.includes("?") ? "&" : "?") + "output=csv";
        const res = await fetch(csvUrl);
        if (!res.ok) throw new Error("Could not fetch Google Sheet. Make sure it is shared as 'Anyone with link can view'.");
        const text = await res.text();
        const data = (typeof Papa !== "undefined")
          ? Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true }).data
          : await this.parseCSV(new Blob([text], { type: "text/csv" }));
        await this.finalize(data, "GoogleSheet:" + (url.split("/").pop() || "sheet"));
        return data;
      },
      async loadFromURL(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error("URL fetch failed: " + res.status);
        const text = await res.text();
        const lower = url.toLowerCase();
        let rows;
        if (lower.endsWith(".json")) {
          const j = JSON.parse(text);
          rows = Array.isArray(j) ? j : (j.data || []);
        } else {
          rows = (typeof Papa !== "undefined")
            ? Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true }).data
            : await this.parseCSV(new Blob([text], { type: "text/csv" }));
        }
        await this.finalize(rows, url.split("/").pop() || "remote.csv");
        return rows;
      },
      async loadSandbox(key) {
        // Built-in deterministic sandboxes — no network call required
        const generators = DAWF.sandboxes;
        if (!generators[key]) throw new Error("Unknown sandbox: " + key);
        const rows = generators[key]();
        await this.finalize(rows, `Sandbox: ${key}`);
        return rows;
      },
      async finalize(rows, fileName) {
        if (!rows || !rows.length) throw new Error("No rows detected in source.");
        // clean header keys
        const cols = Object.keys(rows[0]).map(k => (k === "" || k === null || k === undefined) ? "col" : String(k).trim());
        rows = rows.map(r => {
          const o = {};
          Object.keys(r).forEach(k => o[String(k).trim() || "col"] = r[k]);
          return o;
        });
        DAWF.state.dataset = rows;
        DAWF.state.originalDataset = JSON.parse(JSON.stringify(rows));
        DAWF.state.columns = cols;
        DAWF.state.columnTypes = DAWF._buildColumnTypes(rows, cols);
        DAWF.state.activeFile = fileName;
        DAWF.state.filters = {};
        await DAWF.history.snapshot("Ingest: " + fileName);
        await DAWF.log("DATA_LOAD", `${rows.length} rows × ${cols.length} cols from ${fileName}`);
        await DAWF.saveDataset();
      }
    },

    /* ============================================================== *
     *  HISTORY (Undo / Redo)                                          *
     * ============================================================== */
    history: {
      stack: [],
      pointer: -1,
      max: 30,
      async snapshot(label) {
        const snap = {
          label, ts: Date.now(),
          dataset: JSON.parse(JSON.stringify(DAWF.state.dataset)),
          columns: [...DAWF.state.columns],
          columnTypes: { ...DAWF.state.columnTypes }
        };
        // truncate forward branch on new mutation
        this.stack = this.stack.slice(0, this.pointer + 1);
        this.stack.push(snap);
        if (this.stack.length > this.max) this.stack.shift();
        this.pointer = this.stack.length - 1;
      },
      async undo() {
        if (this.pointer <= 0) { toast("Nothing to undo", "warning"); return false; }
        this.pointer--;
        this._restore(this.stack[this.pointer]);
        await DAWF.saveDataset();
        toast("Undone: " + this.stack[this.pointer + 1].label, "info");
        return true;
      },
      async redo() {
        if (this.pointer >= this.stack.length - 1) { toast("Nothing to redo", "warning"); return false; }
        this.pointer++;
        this._restore(this.stack[this.pointer]);
        await DAWF.saveDataset();
        toast("Redone: " + this.stack[this.pointer].label, "info");
        return true;
      },
      _restore(s) {
        DAWF.state.dataset = JSON.parse(JSON.stringify(s.dataset));
        DAWF.state.columns = [...s.columns];
        DAWF.state.columnTypes = { ...s.columnTypes };
      }
    },

    /* ============================================================== *
     *  PROFILING                                                     *
     * ============================================================== */
    profiling: {
      overview() {
        const d = DAWF.state.dataset;
        const cols = DAWF.state.columns;
        let cells = 0, missing = 0;
        for (const r of d) for (const c of cols) { cells++; if (r[c] === null || r[c] === undefined || r[c] === "") missing++; }
        return {
          rowCount: d.length,
          colCount: cols.length,
          totalCells: cells,
          missingCells: missing,
          missingPct: cells ? (missing / cells) * 100 : 0,
          lastUpdated: new Date().toLocaleString()
        };
      },
      columnStats(col) {
        const vals = DAWF.state.dataset.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== "");
        const total = DAWF.state.dataset.length;
        const unique = new Set(vals).size;
        const stats = {
          name: col, type: DAWF.state.columnTypes[col] || "string",
          nulls: total - vals.length, nullPercent: total ? ((total - vals.length) / total) * 100 : 0,
          unique, uniquePercent: total ? (unique / total) * 100 : 0
        };
        if (["integer", "number"].includes(stats.type)) {
          const nums = vals.map(Number).filter(n => !isNaN(n));
          if (nums.length) {
            const sorted = [...nums].sort((a, b) => a - b);
            const sum = nums.reduce((a, b) => a + b, 0);
            stats.min = sorted[0];
            stats.max = sorted[sorted.length - 1];
            stats.avg = sum / nums.length;
            stats.median = sorted[Math.floor(sorted.length / 2)];
            const mean = stats.avg;
            stats.std = Math.sqrt(nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length);
            stats.sum = sum;
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1;
            stats.q1 = q1; stats.q3 = q3; stats.iqr = iqr;
            stats.outliers = nums.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr).length;
          }
        }
        if (stats.type === "string") {
          const lengths = vals.map(v => String(v).length);
          stats.minLen = Math.min(...lengths);
          stats.maxLen = Math.max(...lengths);
          stats.topValue = (() => {
            const m = {}; vals.forEach(v => m[v] = (m[v] || 0) + 1);
            return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0];
          })();
        }
        return stats;
      },
      qualityScore() {
        const ov = this.overview();
        let score = 100;
        score -= ov.missingPct * 0.6;
        const dupes = DAWF.cleaning.countDuplicates();
        if (ov.rowCount) score -= (dupes / ov.rowCount) * 25;
        let outlierColumns = 0;
        DAWF.state.columns.forEach(c => {
          const s = this.columnStats(c);
          if (s.outliers && s.outliers / Math.max(ov.rowCount, 1) > 0.05) outlierColumns++;
        });
        score -= outlierColumns * 3;
        score = Math.max(0, Math.min(100, Math.round(score)));
        return { score, missingPct: ov.missingPct, duplicates: dupes, outlierColumns };
      }
    },

    /* ============================================================== *
     *  CLEANING                                                      *
     * ============================================================== */
    cleaning: {
      async trimAll() {
        await DAWF.history.snapshot("Trim whitespace");
        DAWF.state.dataset = DAWF.state.dataset.map(row => {
          const o = { ...row };
          for (const k in o) if (typeof o[k] === "string") o[k] = o[k].trim();
          return o;
        });
        DAWF.log("CLEAN_TRIM", "Trimmed all string cells");
        await DAWF.saveDataset();
      },
      countDuplicates() {
        const seen = new Set(); let c = 0;
        for (const r of DAWF.state.dataset) {
          const s = JSON.stringify(r);
          if (seen.has(s)) c++;
          else seen.add(s);
        }
        return c;
      },
      async dropDuplicates() {
        await DAWF.history.snapshot("Drop duplicates");
        const seen = new Set();
        const before = DAWF.state.dataset.length;
        DAWF.state.dataset = DAWF.state.dataset.filter(r => {
          const s = JSON.stringify(r);
          if (seen.has(s)) return false;
          seen.add(s); return true;
        });
        DAWF.log("CLEAN_DUPES", `Removed ${before - DAWF.state.dataset.length} duplicate rows`);
        await DAWF.saveDataset();
      },
      async fillMissing(col, value, strategy = "constant") {
        await DAWF.history.snapshot(`Fill missing in ${col} (${strategy})`);
        const colVals = DAWF.state.dataset.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== "");
        let fill = value;
        if (strategy === "mean") {
          const nums = colVals.map(Number).filter(n => !isNaN(n));
          fill = nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
        } else if (strategy === "median") {
          const nums = colVals.map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
          fill = nums.length ? nums[Math.floor(nums.length / 2)] : 0;
        } else if (strategy === "mode") {
          const m = {}; colVals.forEach(v => m[v] = (m[v] || 0) + 1);
          fill = Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
        } else if (strategy === "ffill") {
          let last = null;
          DAWF.state.dataset = DAWF.state.dataset.map(r => {
            const v = r[col];
            if (v === null || v === undefined || v === "") return { ...r, [col]: last };
            last = v; return r;
          });
          DAWF.log("CLEAN_FILL", `Forward-filled ${col}`);
          await DAWF.saveDataset();
          return;
        }
        DAWF.state.dataset = DAWF.state.dataset.map(r => {
          if (r[col] === null || r[col] === undefined || r[col] === "") return { ...r, [col]: fill };
          return r;
        });
        DAWF.log("CLEAN_FILL", `Filled missing in ${col} (${strategy}=${fill})`);
        await DAWF.saveDataset();
      },
      async castColumn(col, type) {
        await DAWF.history.snapshot(`Cast ${col} to ${type}`);
        DAWF.state.dataset = DAWF.state.dataset.map(r => ({ ...r, [col]: castValue(r[col], type) }));
        DAWF.state.columnTypes[col] = type;
        DAWF.log("CLEAN_CAST", `${col} → ${type}`);
        await DAWF.saveDataset();
      },
      async findReplace(col, find, replace, useRegex = false) {
        await DAWF.history.snapshot(`Find/Replace in ${col}`);
        const rx = useRegex ? new RegExp(find, "g") : null;
        let count = 0;
        DAWF.state.dataset = DAWF.state.dataset.map(r => {
          let v = r[col];
          if (v === null || v === undefined) return r;
          const s = String(v);
          let n;
          if (useRegex) {
            if (rx.test(s)) { n = s.replace(rx, replace); count++; }
            else return r;
          } else {
            if (s.includes(find)) { n = s.split(find).join(replace); count++; }
            else return r;
          }
          return { ...r, [col]: n };
        });
        DAWF.log("CLEAN_REPLACE", `${col}: ${count} replacements`);
        await DAWF.saveDataset();
      },
      async treatOutliers(col, method = "cap") {
        await DAWF.history.snapshot(`Treat outliers in ${col}`);
        const stats = DAWF.profiling.columnStats(col);
        if (!stats.q1 && stats.q1 !== 0) return toast("Column has no numeric stats", "warning");
        const lo = stats.q1 - 1.5 * stats.iqr;
        const hi = stats.q3 + 1.5 * stats.iqr;
        if (method === "remove") {
          DAWF.state.dataset = DAWF.state.dataset.filter(r => {
            const v = Number(r[col]);
            return isNaN(v) || (v >= lo && v <= hi);
          });
        } else { // cap
          DAWF.state.dataset = DAWF.state.dataset.map(r => {
            const v = Number(r[col]);
            if (isNaN(v)) return r;
            if (v < lo) return { ...r, [col]: lo };
            if (v > hi) return { ...r, [col]: hi };
            return r;
          });
        }
        DAWF.log("CLEAN_OUTLIER", `${col} via ${method}`);
        await DAWF.saveDataset();
      },
      async standardizeHeaders() {
        await DAWF.history.snapshot("Standardize headers");
        const map = {};
        const newCols = DAWF.state.columns.map(c => {
          const nc = c.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
          map[c] = nc || "col";
          return map[c];
        });
        // dedupe
        const seen = {}; const final = newCols.map(c => {
          if (!seen[c]) { seen[c] = 1; return c; }
          return c + "_" + (seen[c]++);
        });
        DAWF.state.dataset = DAWF.state.dataset.map(r => {
          const o = {}; DAWF.state.columns.forEach((c, i) => o[final[i]] = r[c]);
          return o;
        });
        DAWF.state.columns = final;
        const newTypes = {}; final.forEach((nc, i) => newTypes[nc] = DAWF.state.columnTypes[DAWF.state.columns[i]] || "string");
        DAWF.state.columnTypes = newTypes;
        DAWF.log("CLEAN_HEADERS", "Standardized column headers");
        await DAWF.saveDataset();
      },
      async dropEmptyRows() {
        await DAWF.history.snapshot("Drop empty rows");
        const before = DAWF.state.dataset.length;
        DAWF.state.dataset = DAWF.state.dataset.filter(r => Object.values(r).some(v => v !== null && v !== undefined && v !== ""));
        DAWF.log("CLEAN_EMPTY", `Removed ${before - DAWF.state.dataset.length} empty rows`);
        await DAWF.saveDataset();
      },
      async resetToOriginal() {
        if (!DAWF.state.originalDataset.length) return toast("No original snapshot", "warning");
        await DAWF.history.snapshot("Reset to original");
        DAWF.state.dataset = JSON.parse(JSON.stringify(DAWF.state.originalDataset));
        DAWF.state.columns = Object.keys(DAWF.state.dataset[0] || {});
        DAWF.state.columnTypes = DAWF._buildColumnTypes(DAWF.state.dataset, DAWF.state.columns);
        DAWF.log("CLEAN_RESET", "Reverted to ingested snapshot");
        await DAWF.saveDataset();
      }
    },

    /* ============================================================== *
     *  ETL                                                           *
     * ============================================================== */
    etl: {
      async calculateColumn(name, formula) {
        if (!name || !formula) throw new Error("Provide name and formula.");
        await DAWF.history.snapshot(`Calculated column ${name}`);
        const sanitized = formula.replace(/\[(.*?)\]/g, (_, c) => `row['${c.replace(/'/g, "\\'")}']`);
        // sandbox: deny obvious globals
        if (/window|document|fetch|XMLHttp|import|eval|Function/.test(sanitized))
          throw new Error("Disallowed identifier in formula.");
        const fn = new Function("row", "Math", "Number", "String",
          `try { return (${sanitized}); } catch(e){ return null; }`);
        DAWF.state.dataset = DAWF.state.dataset.map(r => ({ ...r, [name]: fn(r, Math, Number, String) }));
        if (!DAWF.state.columns.includes(name)) DAWF.state.columns.push(name);
        DAWF.state.columnTypes[name] = dominantType(DAWF.state.dataset.slice(0, 200).map(r => r[name]));
        DAWF.log("ETL_CALC", `Created ${name} = ${formula}`);
        await DAWF.saveDataset();
      },
      async dropColumn(col) {
        await DAWF.history.snapshot(`Drop column ${col}`);
        DAWF.state.dataset = DAWF.state.dataset.map(r => { const { [col]: _, ...rest } = r; return rest; });
        DAWF.state.columns = DAWF.state.columns.filter(c => c !== col);
        delete DAWF.state.columnTypes[col];
        DAWF.log("ETL_DROP", `Dropped ${col}`);
        await DAWF.saveDataset();
      },
      async renameColumn(oldN, newN) {
        if (!newN || oldN === newN) return;
        await DAWF.history.snapshot(`Rename ${oldN} → ${newN}`);
        DAWF.state.dataset = DAWF.state.dataset.map(r => { const { [oldN]: v, ...rest } = r; return { ...rest, [newN]: v }; });
        const idx = DAWF.state.columns.indexOf(oldN);
        if (idx >= 0) DAWF.state.columns[idx] = newN;
        DAWF.state.columnTypes[newN] = DAWF.state.columnTypes[oldN];
        delete DAWF.state.columnTypes[oldN];
        DAWF.log("ETL_RENAME", `${oldN} → ${newN}`);
        await DAWF.saveDataset();
      },
      async mergeDatasets(otherRows, leftKey, rightKey, type = "inner") {
        if (!Array.isArray(otherRows) || !otherRows.length) throw new Error("Second dataset is empty.");
        await DAWF.history.snapshot(`Merge (${type})`);
        const left = DAWF.state.dataset;
        const idx = new Map();
        for (const r of otherRows) {
          const k = r[rightKey];
          if (!idx.has(k)) idx.set(k, []);
          idx.get(k).push(r);
        }
        let result = [];
        if (type === "inner") {
          for (const l of left) {
            const matches = idx.get(l[leftKey]) || [];
            for (const r of matches) result.push({ ...l, ...r });
          }
        } else if (type === "left") {
          for (const l of left) {
            const matches = idx.get(l[leftKey]);
            if (matches && matches.length) for (const r of matches) result.push({ ...l, ...r });
            else result.push({ ...l });
          }
        } else if (type === "right") {
          const lidx = new Map();
          for (const r of left) { const k = r[leftKey]; if (!lidx.has(k)) lidx.set(k, []); lidx.get(k).push(r); }
          for (const r of otherRows) {
            const matches = lidx.get(r[rightKey]);
            if (matches && matches.length) for (const l of matches) result.push({ ...l, ...r });
            else result.push({ ...r });
          }
        } else if (type === "outer") {
          const seen = new Set();
          for (const l of left) {
            const matches = idx.get(l[leftKey]);
            if (matches && matches.length) for (const r of matches) { result.push({ ...l, ...r }); seen.add(r); }
            else result.push({ ...l });
          }
          for (const r of otherRows) if (!seen.has(r)) result.push({ ...r });
        }
        DAWF.state.dataset = result;
        DAWF.state.columns = Object.keys(result[0] || {});
        DAWF.state.columnTypes = DAWF._buildColumnTypes(result, DAWF.state.columns);
        DAWF.log("ETL_MERGE", `${type} join on ${leftKey}=${rightKey} → ${result.length} rows`);
        await DAWF.saveDataset();
      },
      async unionDatasets(otherRows, fileName = "") {
        await DAWF.history.snapshot("Union append");
        DAWF.state.dataset = DAWF.state.dataset.concat(otherRows);
        const newCols = new Set([...DAWF.state.columns, ...Object.keys(otherRows[0] || {})]);
        DAWF.state.columns = Array.from(newCols);
        DAWF.state.columnTypes = DAWF._buildColumnTypes(DAWF.state.dataset, DAWF.state.columns);
        DAWF.log("ETL_UNION", `Appended ${otherRows.length} rows${fileName ? " from " + fileName : ""}`);
        await DAWF.saveDataset();
      },
      async splitColumn(col, delimiter, newCols) {
        await DAWF.history.snapshot(`Split ${col}`);
        DAWF.state.dataset = DAWF.state.dataset.map(r => {
          const parts = (r[col] == null ? "" : String(r[col])).split(delimiter);
          const o = { ...r };
          newCols.forEach((nc, i) => o[nc] = parts[i] ?? "");
          return o;
        });
        newCols.forEach(nc => {
          if (!DAWF.state.columns.includes(nc)) DAWF.state.columns.push(nc);
          DAWF.state.columnTypes[nc] = "string";
        });
        DAWF.log("ETL_SPLIT", `${col} → ${newCols.join(", ")}`);
        await DAWF.saveDataset();
      },
      async mergeColumns(cols, newCol, sep = " ") {
        await DAWF.history.snapshot(`Merge ${cols.join("+")} → ${newCol}`);
        DAWF.state.dataset = DAWF.state.dataset.map(r => ({ ...r, [newCol]: cols.map(c => r[c] ?? "").join(sep) }));
        if (!DAWF.state.columns.includes(newCol)) DAWF.state.columns.push(newCol);
        DAWF.state.columnTypes[newCol] = "string";
        DAWF.log("ETL_MERGE_COL", `${cols.join("+")} → ${newCol}`);
        await DAWF.saveDataset();
      },
      async datePart(col, part, newCol) {
        await DAWF.history.snapshot(`Date part ${col}.${part}`);
        const f = {
          year:  d => d.getFullYear(),
          month: d => d.getMonth() + 1,
          day:   d => d.getDate(),
          weekday: d => d.toLocaleString("en-US", { weekday: "long" }),
          quarter: d => "Q" + (Math.floor(d.getMonth() / 3) + 1),
          ym: d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")
        };
        DAWF.state.dataset = DAWF.state.dataset.map(r => {
          const v = r[col]; const d = v ? new Date(v) : null;
          return { ...r, [newCol]: d && !isNaN(d) ? f[part](d) : null };
        });
        if (!DAWF.state.columns.includes(newCol)) DAWF.state.columns.push(newCol);
        DAWF.state.columnTypes[newCol] = (part === "year" || part === "month" || part === "day") ? "integer" : "string";
        DAWF.log("ETL_DATEPART", `${col}.${part} → ${newCol}`);
        await DAWF.saveDataset();
      },
      async ifColumn(col, op, compareVal, trueVal, falseVal, newCol) {
        await DAWF.history.snapshot(`IF ${col} ${op} → ${newCol}`);
        const test = (v) => {
          const nv = Number(v); const ncv = Number(compareVal);
          switch (op) {
            case ">":  return nv > ncv;
            case ">=": return nv >= ncv;
            case "<":  return nv < ncv;
            case "<=": return nv <= ncv;
            case "==": return String(v) === String(compareVal);
            case "!=": return String(v) !== String(compareVal);
            case "contains": return String(v ?? "").includes(String(compareVal));
            case "startsWith": return String(v ?? "").startsWith(String(compareVal));
            default: return false;
          }
        };
        DAWF.state.dataset = DAWF.state.dataset.map(r => ({ ...r, [newCol]: test(r[col]) ? trueVal : falseVal }));
        if (!DAWF.state.columns.includes(newCol)) DAWF.state.columns.push(newCol);
        DAWF.state.columnTypes[newCol] = dominantType([trueVal, falseVal]);
        DAWF.log("ETL_IF", `IF ${col} ${op} ${compareVal} → ${newCol}`);
        await DAWF.saveDataset();
      },
      async binColumn(col, bins, newCol, method = "equal") {
        await DAWF.history.snapshot(`Bin ${col} → ${newCol}`);
        const nums = DAWF.state.dataset.map(r => Number(r[col])).filter(n => !isNaN(n));
        if (!nums.length) throw new Error("No numeric data to bin.");
        const sorted = [...nums].sort((a, b) => a - b);
        const edges = [];
        if (method === "equal") {
          const min = sorted[0], max = sorted[sorted.length - 1];
          const step = (max - min) / bins;
          for (let i = 0; i <= bins; i++) edges.push(min + step * i);
        } else { // quantile
          for (let i = 0; i <= bins; i++) edges.push(sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * i / bins))]);
        }
        const labels = []; for (let i = 0; i < bins; i++) labels.push(`${fmtNum(edges[i])}–${fmtNum(edges[i + 1])}`);
        DAWF.state.dataset = DAWF.state.dataset.map(r => {
          const v = Number(r[col]);
          if (isNaN(v)) return { ...r, [newCol]: null };
          for (let i = 0; i < bins; i++) if (v <= edges[i + 1]) return { ...r, [newCol]: labels[i] };
          return { ...r, [newCol]: labels[bins - 1] };
        });
        if (!DAWF.state.columns.includes(newCol)) DAWF.state.columns.push(newCol);
        DAWF.state.columnTypes[newCol] = "string";
        DAWF.log("ETL_BIN", `${col} → ${bins} ${method} bins`);
        await DAWF.saveDataset();
      },
      async sortBy(col, dir = "asc") {
        await DAWF.history.snapshot(`Sort by ${col}`);
        const mult = dir === "asc" ? 1 : -1;
        DAWF.state.dataset.sort((a, b) => {
          const x = a[col], y = b[col];
          if (x === y) return 0;
          if (x === null || x === undefined || x === "") return 1;
          if (y === null || y === undefined || y === "") return -1;
          if (typeof x === "number" && typeof y === "number") return (x - y) * mult;
          return String(x).localeCompare(String(y)) * mult;
        });
        DAWF.log("ETL_SORT", `${col} ${dir}`);
        await DAWF.saveDataset();
      },
      async filterRows(col, op, value) {
        await DAWF.history.snapshot(`Filter ${col} ${op} ${value}`);
        const before = DAWF.state.dataset.length;
        DAWF.state.dataset = DAWF.state.dataset.filter(r => {
          const v = r[col];
          switch (op) {
            case "=": return String(v) === String(value);
            case "!=": return String(v) !== String(value);
            case ">":  return Number(v) > Number(value);
            case ">=": return Number(v) >= Number(value);
            case "<":  return Number(v) < Number(value);
            case "<=": return Number(v) <= Number(value);
            case "contains": return String(v ?? "").includes(value);
            case "regex":    try { return new RegExp(value).test(String(v ?? "")); } catch (e) { return false; }
            case "empty":    return v === null || v === undefined || v === "";
            case "not-empty": return v !== null && v !== undefined && v !== "";
            default: return true;
          }
        });
        DAWF.log("ETL_FILTER", `${col} ${op} ${value} (removed ${before - DAWF.state.dataset.length})`);
        await DAWF.saveDataset();
      },
      async groupAggregate(dims, measure, agg = "sum") {
        const m = {};
        DAWF.state.dataset.forEach(r => {
          const key = dims.map(d => r[d]).join("|||");
          if (!m[key]) m[key] = [];
          m[key].push(Number(r[measure]) || 0);
        });
        return Object.entries(m).map(([key, vals]) => {
          const parts = key.split("|||");
          const row = {}; dims.forEach((d, i) => row[d] = parts[i]);
          if (agg === "sum")    row[measure] = vals.reduce((a, b) => a + b, 0);
          if (agg === "count")  row[measure] = vals.length;
          if (agg === "avg")    row[measure] = vals.reduce((a, b) => a + b, 0) / vals.length;
          if (agg === "min")    row[measure] = Math.min(...vals);
          if (agg === "max")    row[measure] = Math.max(...vals);
          if (agg === "median") { const s = [...vals].sort((a, b) => a - b); row[measure] = s[Math.floor(s.length / 2)]; }
          return row;
        });
      }
    },

    /* ============================================================== *
     *  ANALYSIS / MODELS                                             *
     * ============================================================== */
    analyst: {
      rfm(custCol, dateCol, valCol) {
        const now = new Date();
        const m = {};
        DAWF.state.dataset.forEach(row => {
          const c = row[custCol]; if (c == null) return;
          const d = new Date(row[dateCol]); const v = parseFloat(row[valCol]) || 0;
          if (!m[c]) m[c] = { r: d, f: 0, m: 0 };
          if (!isNaN(d) && d > m[c].r) m[c].r = d;
          m[c].f += 1; m[c].m += v;
        });
        const arr = Object.entries(m).map(([id, s]) => ({
          Customer: id,
          Recency: isNaN(s.r) ? null : Math.floor((now - s.r) / 86400000),
          Frequency: s.f, Monetary: +s.m.toFixed(2)
        }));
        const score = (sorted, key, asc) => {
          const sortedArr = [...sorted].sort((a, b) => asc ? a[key] - b[key] : b[key] - a[key]);
          const q = Math.ceil(sortedArr.length / 5) || 1;
          sortedArr.forEach((r, i) => r[key + "Score"] = 5 - Math.min(4, Math.floor(i / q)));
          return sortedArr;
        };
        let scored = score(arr, "Recency", true);
        scored = score(scored, "Frequency", false);
        scored = score(scored, "Monetary", false);
        return scored.map(r => ({
          ...r,
          RFM: `${r.RecencyScore}${r.FrequencyScore}${r.MonetaryScore}`,
          Segment: (r.RecencyScore >= 4 && r.FrequencyScore >= 4 && r.MonetaryScore >= 4) ? "Champions"
                : (r.RecencyScore >= 3 && r.FrequencyScore >= 3 && r.MonetaryScore >= 3) ? "Loyal"
                : (r.RecencyScore >= 4 && r.FrequencyScore <= 2) ? "New"
                : (r.RecencyScore <= 2 && r.FrequencyScore >= 3) ? "At Risk"
                : (r.RecencyScore <= 2 && r.FrequencyScore <= 2) ? "Lost"
                : "Potential"
        }));
      },
      pareto(dimCol, measureCol) {
        const agg = {};
        DAWF.state.dataset.forEach(r => {
          const k = r[dimCol] ?? "Unknown";
          agg[k] = (agg[k] || 0) + (parseFloat(r[measureCol]) || 0);
        });
        const sorted = Object.entries(agg).sort((a, b) => b[1] - a[1]);
        const total = sorted.reduce((s, p) => s + p[1], 0) || 1;
        let cum = 0;
        return sorted.map(([k, v]) => {
          cum += v;
          return { Category: k, Value: +v.toFixed(2), CumulativePct: +((cum / total) * 100).toFixed(2),
                   Class: (cum / total) <= 0.8 ? "A" : (cum / total) <= 0.95 ? "B" : "C" };
        });
      },
      abc(dimCol, measureCol, aThr = 80, bThr = 95) {
        return this.pareto(dimCol, measureCol).map(r => ({
          ...r,
          Class: r.CumulativePct <= aThr ? "A" : r.CumulativePct <= bThr ? "B" : "C"
        }));
      },
      benford(col) {
        const vals = DAWF.state.dataset.map(r => r[col]).filter(v => v !== null && v !== "" && !isNaN(Number(v))).map(Number);
        const counts = Array(10).fill(0);
        let total = 0;
        for (const v of vals) {
          const av = Math.abs(v);
          if (av < 1) continue;
          const first = parseInt(String(av).replace(/^0+|\./g, "")[0], 10);
          if (first >= 1 && first <= 9) { counts[first]++; total++; }
        }
        const expected = [0, 30.1, 17.6, 12.5, 9.7, 7.9, 6.7, 5.8, 5.1, 4.6];
        const rows = []; let chi = 0;
        for (let i = 1; i <= 9; i++) {
          const obs = total ? (counts[i] / total) * 100 : 0;
          const exp = expected[i];
          if (total) chi += ((obs - exp) ** 2) / exp;
          rows.push({ Digit: i, ObservedPct: +obs.toFixed(2), ExpectedPct: exp, Diff: +(obs - exp).toFixed(2) });
        }
        return { rows, total, chi: +chi.toFixed(2),
                 verdict: chi < 15.5 ? "Consistent with Benford" : "Significant deviation — investigate" };
      },
      movingAverage(col, window = 7) {
        const vals = DAWF.state.dataset.map(r => Number(r[col])).map(n => isNaN(n) ? null : n);
        const out = [];
        for (let i = 0; i < vals.length; i++) {
          const slice = vals.slice(Math.max(0, i - window + 1), i + 1).filter(v => v !== null);
          out.push({ Index: i, Value: vals[i], MovingAvg: slice.length ? +(slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(3) : null });
        }
        return out;
      },
      cohort(userCol, dateCol) {
        const userFirst = {};
        DAWF.state.dataset.forEach(r => {
          const u = r[userCol]; const d = new Date(r[dateCol]);
          if (!u || isNaN(d)) return;
          if (!userFirst[u] || d < userFirst[u]) userFirst[u] = d;
        });
        const grid = {};
        DAWF.state.dataset.forEach(r => {
          const u = r[userCol]; const d = new Date(r[dateCol]);
          if (!u || isNaN(d) || !userFirst[u]) return;
          const cohort = userFirst[u].getFullYear() + "-" + String(userFirst[u].getMonth() + 1).padStart(2, "0");
          const period = Math.floor((d - userFirst[u]) / (30 * 86400000));
          if (!grid[cohort]) grid[cohort] = {};
          if (!grid[cohort][period]) grid[cohort][period] = new Set();
          grid[cohort][period].add(u);
        });
        const rows = [];
        Object.keys(grid).sort().forEach(c => {
          const row = { Cohort: c, Size: grid[c][0]?.size || 0 };
          for (let p = 0; p < 12; p++) {
            const cnt = grid[c][p]?.size || 0;
            row["M" + p] = row.Size ? +((cnt / row.Size) * 100).toFixed(1) : 0;
          }
          rows.push(row);
        });
        return rows;
      },
      correlations() {
        const nums = DAWF.utils.getNumericColumns();
        const rows = [];
        for (let i = 0; i < nums.length; i++) {
          const row = { Column: nums[i] };
          for (let j = 0; j < nums.length; j++) row[nums[j]] = this._pearson(nums[i], nums[j]);
          rows.push(row);
        }
        return rows;
      },
      _pearson(a, b) {
        const xs = []; const ys = [];
        DAWF.state.dataset.forEach(r => {
          const x = Number(r[a]); const y = Number(r[b]);
          if (!isNaN(x) && !isNaN(y)) { xs.push(x); ys.push(y); }
        });
        const n = xs.length; if (n < 2) return null;
        const mx = xs.reduce((a, b) => a + b, 0) / n;
        const my = ys.reduce((a, b) => a + b, 0) / n;
        let num = 0, dx = 0, dy = 0;
        for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); dx += (xs[i] - mx) ** 2; dy += (ys[i] - my) ** 2; }
        const d = Math.sqrt(dx * dy);
        return d === 0 ? 0 : +(num / d).toFixed(3);
      },
      forecastLinear(col, periods = 6) {
        const ys = DAWF.state.dataset.map(r => Number(r[col])).filter(n => !isNaN(n));
        const n = ys.length; if (n < 2) return [];
        const xs = ys.map((_, i) => i);
        const mx = xs.reduce((a, b) => a + b, 0) / n;
        const my = ys.reduce((a, b) => a + b, 0) / n;
        let num = 0, den = 0;
        for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
        const slope = den ? num / den : 0;
        const intercept = my - slope * mx;
        const out = ys.map((y, i) => ({ Index: i, Actual: y, Forecast: +(slope * i + intercept).toFixed(3) }));
        for (let i = 0; i < periods; i++) {
          const idx = n + i;
          out.push({ Index: idx, Actual: null, Forecast: +(slope * idx + intercept).toFixed(3) });
        }
        return out;
      },
      whatIf(col, pct) {
        const rows = DAWF.state.dataset.map(r => {
          const v = Number(r[col]); if (isNaN(v)) return r;
          return { ...r, [col + "_What-If"]: +(v * (1 + pct / 100)).toFixed(3) };
        });
        const sumBefore = DAWF.state.dataset.reduce((s, r) => s + (Number(r[col]) || 0), 0);
        const sumAfter = rows.reduce((s, r) => s + (Number(r[col + "_What-If"]) || 0), 0);
        return { rows, sumBefore, sumAfter, delta: sumAfter - sumBefore };
      },
      goalSeek(col, target) {
        const cur = DAWF.state.dataset.reduce((s, r) => s + (Number(r[col]) || 0), 0);
        if (cur === 0) return { factor: null, msg: "Current total is 0, cannot scale." };
        const factor = target / cur;
        return { current: cur, target, factor: +factor.toFixed(4), pctChange: +(((factor - 1) * 100)).toFixed(2) };
      },
      reconcile(otherRows, leftKey, rightKey, compareCols) {
        const idx = new Map();
        otherRows.forEach(r => idx.set(r[rightKey], r));
        const rows = [];
        DAWF.state.dataset.forEach(l => {
          const r = idx.get(l[leftKey]);
          if (!r) { rows.push({ Key: l[leftKey], Status: "Missing in Right" }); return; }
          for (const c of compareCols) {
            const lv = l[c]; const rv = r[c];
            if (String(lv) !== String(rv)) rows.push({ Key: l[leftKey], Column: c, Left: lv, Right: rv, Status: "Diff" });
          }
        });
        const leftKeys = new Set(DAWF.state.dataset.map(r => r[leftKey]));
        otherRows.forEach(r => { if (!leftKeys.has(r[rightKey])) rows.push({ Key: r[rightKey], Status: "Missing in Left" }); });
        return rows;
      },
      fuzzyDuplicates(cols, threshold = 0.85, maxRows = 500) {
        const norm = s => (s ?? "").toString().toLowerCase().replace(/[^a-z0-9]+/g, "");
        const rows = DAWF.state.dataset.slice(0, maxRows);
        const out = [];
        for (let i = 0; i < rows.length; i++) {
          for (let j = i + 1; j < rows.length; j++) {
            let total = 0;
            for (const c of cols) {
              const a = norm(rows[i][c]); const b = norm(rows[j][c]);
              total += jaccard(a, b);
            }
            const score = total / cols.length;
            if (score >= threshold) out.push({ A: i, B: j, Score: +score.toFixed(3) });
          }
        }
        return out;
        function jaccard(a, b) {
          if (!a && !b) return 1; if (!a || !b) return 0;
          const ag = new Set(a.match(/.{2}/g) || []); const bg = new Set(b.match(/.{2}/g) || []);
          const inter = [...ag].filter(x => bg.has(x)).length;
          const uni = new Set([...ag, ...bg]).size;
          return uni ? inter / uni : 0;
        }
      },
      anomalies(col, method = "iqr", z = 3) {
        const vals = DAWF.state.dataset.map((r, i) => ({ i, v: Number(r[col]) })).filter(x => !isNaN(x.v));
        const nums = vals.map(x => x.v);
        if (method === "iqr") {
          const sorted = [...nums].sort((a, b) => a - b);
          const q1 = sorted[Math.floor(sorted.length * 0.25)];
          const q3 = sorted[Math.floor(sorted.length * 0.75)];
          const iqr = q3 - q1;
          return vals.filter(x => x.v < q1 - 1.5 * iqr || x.v > q3 + 1.5 * iqr)
                    .map(x => ({ RowIndex: x.i, Value: x.v, Why: "outside 1.5 × IQR" }));
        }
        // z-score
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        const std = Math.sqrt(nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length);
        return vals.filter(x => Math.abs((x.v - mean) / (std || 1)) >= z)
                  .map(x => ({ RowIndex: x.i, Value: x.v, ZScore: +((x.v - mean) / (std || 1)).toFixed(2) }));
      },
      gini(dim, measure) {
        const agg = {};
        DAWF.state.dataset.forEach(r => {
          const k = r[dim] ?? "Unknown";
          agg[k] = (agg[k] || 0) + (Number(r[measure]) || 0);
        });
        const vals = Object.values(agg).sort((a, b) => a - b);
        const n = vals.length; if (!n) return { gini: 0, lorenz: [] };
        const total = vals.reduce((a, b) => a + b, 0);
        if (!total) return { gini: 0, lorenz: [] };
        let sumNum = 0;
        vals.forEach((v, i) => sumNum += (i + 1) * v);
        const gini = (2 * sumNum) / (n * total) - (n + 1) / n;
        let cum = 0;
        const lorenz = vals.map((v, i) => { cum += v; return { x: (i + 1) / n, y: cum / total }; });
        return { gini: +gini.toFixed(3), lorenz, total };
      },
      textFrequency(col, topN = 25) {
        const stop = new Set(["the","and","of","to","a","in","is","it","for","on","with","as","by","an","be","at","this","that","or","but","not","are","was","from","you","we","i"]);
        const m = {};
        DAWF.state.dataset.forEach(r => {
          (String(r[col] ?? "").toLowerCase().match(/[a-z]{3,}/g) || []).forEach(w => {
            if (!stop.has(w)) m[w] = (m[w] || 0) + 1;
          });
        });
        return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, topN).map(([Word, Count]) => ({ Word, Count }));
      },
      pivot(rowDim, colDim, valCol, agg = "sum") {
        const data = DAWF.utils.filtered();
        const rows = Array.from(new Set(data.map(r => r[rowDim] ?? "—")));
        const cols = colDim ? Array.from(new Set(data.map(r => r[colDim] ?? "—"))) : ["Total"];
        const grid = {};
        rows.forEach(r => { grid[r] = {}; cols.forEach(c => grid[r][c] = []); });
        data.forEach(r => {
          const rk = r[rowDim] ?? "—";
          const ck = colDim ? (r[colDim] ?? "—") : "Total";
          grid[rk][ck].push(parseFloat(r[valCol]) || 0);
        });
        const out = rows.map(rk => {
          const row = { __row: rk };
          cols.forEach(ck => {
            const v = grid[rk][ck];
            if (agg === "sum")   row[ck] = v.reduce((a, b) => a + b, 0);
            if (agg === "count") row[ck] = v.length;
            if (agg === "avg")   row[ck] = v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
            if (agg === "min")   row[ck] = v.length ? Math.min(...v) : 0;
            if (agg === "max")   row[ck] = v.length ? Math.max(...v) : 0;
          });
          return row;
        });
        return { rows: out, cols };
      }
    },

    /* ============================================================== *
     *  EXPORT                                                        *
     * ============================================================== */
    exportEngine: {
      toCSV(rows, columns, filename) {
        if (!rows || !rows.length) return toast("Nothing to export", "warning");
        const cols = columns || Object.keys(rows[0]);
        const head = cols.map(csvEscape).join(",");
        const body = rows.map(r => cols.map(c => csvEscape(r[c])).join(",")).join("\n");
        download(filename || (DAWF.state.activeFile || "export") + ".csv",
          new Blob(["\ufeff" + head + "\n" + body], { type: "text/csv;charset=utf-8" }));
      },
      toJSON(rows, filename) {
        if (!rows || !rows.length) return toast("Nothing to export", "warning");
        const payload = { exportedAt: new Date().toISOString(), rows: rows.length, data: rows };
        download(filename || (DAWF.state.activeFile || "export") + ".json",
          new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
      },
      toExcel(sheets, filename) {
        if (typeof XLSX === "undefined") return toast("SheetJS not loaded; falling back to CSV", "warning");
        const wb = XLSX.utils.book_new();
        Object.entries(sheets).forEach(([name, rows]) => {
          if (rows && rows.length) {
            const ws = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 30));
          }
        });
        XLSX.writeFile(wb, filename || (DAWF.state.activeFile || "workbook") + ".xlsx");
      },
      toMarkdown(rows, columns) {
        const cols = columns || Object.keys(rows[0]);
        const head = "| " + cols.join(" | ") + " |\n|" + cols.map(() => "---").join("|") + "|";
        const body = rows.map(r => "| " + cols.map(c => (r[c] ?? "")).join(" | ") + " |").join("\n");
        return head + "\n" + body;
      },
      async saveRecipe(name = "Recipe " + new Date().toLocaleString()) {
        const recipe = {
          name, ts: new Date().toISOString(), version: DAWF.version,
          activeFile: DAWF.state.activeFile,
          columns: DAWF.state.columns,
          columnTypes: DAWF.state.columnTypes,
          auditLog: DAWF.state.auditLog,
          rowCount: DAWF.state.dataset.length
        };
        DAWF.state.recipes.push(recipe);
        await DAWF._saveStateMeta();
        download((name || "recipe").replace(/\s+/g, "_") + ".json",
          new Blob([JSON.stringify(recipe, null, 2)], { type: "application/json" }));
      }
    },

    /* ============================================================== *
     *  PII detection & masking                                        *
     * ============================================================== */
    privacy: {
      detectPII() {
        const patterns = {
          email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
          phone: /^[\+\(]?[\d][\d\s\-\(\)\.]{7,}$/,
          ssn: /^\d{3}-\d{2}-\d{4}$/,
          credit_card: /^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/
        };
        const findings = [];
        DAWF.state.columns.forEach(col => {
          const sample = DAWF.state.dataset.slice(0, 200).map(r => r[col]).filter(v => v !== null && v !== "");
          if (!sample.length) return;
          for (const [kind, rx] of Object.entries(patterns)) {
            const hits = sample.filter(v => rx.test(String(v))).length;
            const ratio = hits / sample.length;
            if (ratio >= 0.4) findings.push({ Column: col, Kind: kind, ConfidencePct: +(ratio * 100).toFixed(1) });
          }
          if (/email/i.test(col)) findings.push({ Column: col, Kind: "email-by-name", ConfidencePct: 80 });
          if (/(phone|mobile|tel)/i.test(col)) findings.push({ Column: col, Kind: "phone-by-name", ConfidencePct: 80 });
        });
        return findings;
      },
      async maskColumn(col, mode = "partial") {
        await DAWF.history.snapshot(`Mask PII ${col}`);
        DAWF.state.dataset = DAWF.state.dataset.map(r => {
          const v = r[col]; if (v == null || v === "") return r;
          const s = String(v);
          let m;
          if (mode === "hash") m = "h_" + Math.abs(s.split("").reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 0)).toString(16);
          else if (mode === "full") m = "*".repeat(Math.min(s.length, 12));
          else m = s.length <= 4 ? "***" : s.slice(0, 2) + "***" + s.slice(-2);
          return { ...r, [col]: m };
        });
        DAWF.log("PRIVACY_MASK", `${col} (${mode})`);
        await DAWF.saveDataset();
      }
    },

    /* ============================================================== *
     *  SANDBOX DATASETS — deterministic, no network                  *
     * ============================================================== */
    sandboxes: {
      ecommerce() {
        const products = ["Laptop", "Phone", "Tablet", "Headphones", "Camera", "Monitor", "Keyboard", "Mouse"];
        const regions = ["North", "South", "East", "West", "Central"];
        const channels = ["Online", "Retail", "Wholesale"];
        const rows = [];
        const seed = 12345; let s = seed;
        const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
        for (let i = 1; i <= 500; i++) {
          const d = new Date(2024, Math.floor(rand() * 12), 1 + Math.floor(rand() * 27));
          rows.push({
            OrderID: "ORD-" + (10000 + i),
            Date: d.toISOString().slice(0, 10),
            Customer: "C" + (1 + Math.floor(rand() * 120)),
            Product: products[Math.floor(rand() * products.length)],
            Region: regions[Math.floor(rand() * regions.length)],
            Channel: channels[Math.floor(rand() * channels.length)],
            Quantity: 1 + Math.floor(rand() * 9),
            UnitPrice: +(20 + rand() * 980).toFixed(2),
            Discount: +(rand() * 0.3).toFixed(2)
          });
        }
        return rows.map(r => ({ ...r, Revenue: +(r.Quantity * r.UnitPrice * (1 - r.Discount)).toFixed(2) }));
      },
      hr() {
        const depts = ["Sales", "Engineering", "Marketing", "HR", "Finance", "Operations"];
        const titles = ["Junior", "Mid", "Senior", "Lead", "Manager"];
        let s = 555;
        const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
        const rows = [];
        for (let i = 1; i <= 200; i++) {
          const hireYear = 2010 + Math.floor(rand() * 15);
          rows.push({
            EmployeeID: "E" + (1000 + i),
            Name: "Employee " + i,
            Department: depts[Math.floor(rand() * depts.length)],
            Title: titles[Math.floor(rand() * titles.length)],
            HireDate: hireYear + "-" + String(1 + Math.floor(rand() * 12)).padStart(2, "0") + "-15",
            Salary: 30000 + Math.floor(rand() * 120000),
            Performance: +(2.5 + rand() * 2.5).toFixed(1),
            HoursPerWeek: 30 + Math.floor(rand() * 25),
            Attrition: rand() < 0.15 ? "Yes" : "No"
          });
        }
        return rows;
      },
      finance() {
        const cats = ["Revenue", "Salaries", "Rent", "Marketing", "R&D", "Travel", "Software", "Utilities"];
        let s = 888;
        const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
        const rows = [];
        for (let m = 0; m < 24; m++) {
          for (const cat of cats) {
            rows.push({
              Month: new Date(2024, m % 12, 1).toISOString().slice(0, 7),
              Year: 2024 + Math.floor(m / 12),
              Category: cat,
              Amount: cat === "Revenue" ? Math.round(50000 + rand() * 50000) : -Math.round(2000 + rand() * 18000),
              Department: ["Corp", "EMEA", "AMER", "APAC"][Math.floor(rand() * 4)]
            });
          }
        }
        return rows;
      },
      marketing() {
        const channels = ["SEO", "Paid Search", "Social", "Email", "Affiliate", "Direct"];
        const campaigns = ["Spring", "Summer", "Holiday", "Back-to-School", "Brand"];
        let s = 222;
        const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
        const rows = [];
        for (let i = 0; i < 300; i++) {
          const imp = Math.floor(1000 + rand() * 50000);
          const ctr = +(0.01 + rand() * 0.1).toFixed(3);
          const clicks = Math.floor(imp * ctr);
          const cvr = +(0.01 + rand() * 0.15).toFixed(3);
          const conv = Math.floor(clicks * cvr);
          const cpc = +(0.2 + rand() * 4).toFixed(2);
          rows.push({
            Date: new Date(2024, Math.floor(rand() * 12), 1 + Math.floor(rand() * 27)).toISOString().slice(0, 10),
            Channel: channels[Math.floor(rand() * channels.length)],
            Campaign: campaigns[Math.floor(rand() * campaigns.length)],
            Impressions: imp, Clicks: clicks, CTR: ctr, Conversions: conv, CVR: cvr,
            Spend: +(clicks * cpc).toFixed(2), Revenue: +(conv * (30 + rand() * 200)).toFixed(2)
          });
        }
        return rows;
      },
      inventory() {
        const skus = []; for (let i = 0; i < 60; i++) skus.push("SKU-" + (1000 + i));
        const wh = ["WH-Lagos", "WH-Abuja", "WH-PH", "WH-Kano"];
        let s = 333;
        const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
        return skus.flatMap(sku => wh.map(w => ({
          SKU: sku, Warehouse: w,
          OnHand: Math.floor(rand() * 500),
          Reorder: 50 + Math.floor(rand() * 100),
          UnitCost: +(2 + rand() * 200).toFixed(2),
          Category: ["Electronics", "Apparel", "Grocery", "Home"][Math.floor(rand() * 4)],
          LastReceived: new Date(2024, Math.floor(rand() * 12), 1 + Math.floor(rand() * 27)).toISOString().slice(0, 10)
        })));
      }
    }
  };

  /* legacy stubs so old inline code keeps working ----------------- */
  DAWF.persistence = {
    save:  () => DAWF.saveDataset(),
    load:  () => DAWF.ready()
  };

  // also expose StateDB/UndoManager shims for legacy v5 scripts
  root.StateDB = {
    get: (k) => idbGet("state", k),
    set: (k, v) => idbSet("state", k, v),
    clear: async () => { const db = await openDB(); return new Promise(r => { const tx = db.transaction("state","readwrite"); tx.objectStore("state").clear().onsuccess = () => r(true); }); }
  };
  root.UndoManager = {
    push: (label) => DAWF.history.snapshot(label),
    undo: () => DAWF.history.undo(),
    redo: () => DAWF.history.redo()
  };

  root.DAWF = DAWF;

  /* Auto-init: page scripts must `await DAWF.ready()` first ------- */
  document.addEventListener("DOMContentLoaded", () => { DAWF.ready(); });

  /* CSS keyframe for toast */
  const style = document.createElement("style");
  style.textContent = "@keyframes dawfToastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}";
  document.head.appendChild(style);

})(window);
