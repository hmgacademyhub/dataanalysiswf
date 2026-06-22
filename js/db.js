/**
 * DAWF v5 Enhanced — IndexedDB State Manager + Undo/Redo Stack
 */
const DB_NAME = "DAWF_Ultimate_v5_DB";
const DB_VERSION = 2;
let dbInstance = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) { resolve(dbInstance); return; }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("state")) db.createObjectStore("state");
      if (!db.objectStoreNames.contains("undo")) db.createObjectStore("undo");
      if (!db.objectStoreNames.contains("queries")) db.createObjectStore("queries");
      if (!db.objectStoreNames.contains("glossary")) db.createObjectStore("glossary");
    };
    request.onsuccess = (e) => { dbInstance = e.target.result; resolve(dbInstance); };
    request.onerror = (e) => reject(e.target.error);
  });
}

const StateDB = {
  set: async (key, val) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("state", "readwrite");
      const store = tx.objectStore("state");
      const req = store.put(val, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  },
  get: async (key) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("state", "readonly");
      const store = tx.objectStore("state");
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
  clear: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("state", "readwrite");
      const store = tx.objectStore("state");
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }
};

// Undo/Redo Stack Manager
const UndoManager = {
  maxDepth: 30,
  push: async (label) => {
    try {
      const snapshot = {
        rawDataset: await StateDB.get("raw_dataset") || [],
        workingDataset: await StateDB.get("working_dataset") || [],
        originalColumns: await StateDB.get("original_columns") || [],
        activeColumns: await StateDB.get("active_columns") || [],
        activeFileMeta: await StateDB.get("active_file_meta") || null,
        pipelineSettings: await StateDB.get("pipeline_settings") || {},
        activeFormulas: await StateDB.get("active_formulas") || [],
        label: label || new Date().toLocaleTimeString(),
        timestamp: Date.now()
      };
      const db = await openDB();
      const tx = db.transaction("undo", "readwrite");
      const store = tx.objectStore("undo");
      // Get current stack
      const getAll = store.getAll ? store.getAll() : new Promise((res, rej) => {
        const items = [];
        const cursor = store.openCursor();
        cursor.onsuccess = (e) => { const c = e.target.result; if (c) { items.push(c.value); c.continue(); } else res(items); };
        cursor.onerror = (e) => rej(e.target.error);
      });
      let stack = await getAll;
      stack = Array.isArray(stack) ? stack : [];
      stack.push(snapshot);
      if (stack.length > UndoManager.maxDepth) stack.shift();
      await store.clear();
      for (const item of stack) await store.put(item, item.timestamp + Math.random());
      await StateDB.set("undo_pointer", stack.length - 1);
    } catch (e) { console.error("Undo push failed", e); }
  },
  undo: async () => {
    try {
      const db = await openDB();
      const tx = db.transaction("undo", "readonly");
      const store = tx.objectStore("undo");
      const getAll = store.getAll ? store.getAll() : new Promise((res, rej) => {
        const items = []; const cursor = store.openCursor();
        cursor.onsuccess = (e) => { const c = e.target.result; if (c) { items.push(c.value); c.continue(); } else res(items); };
        cursor.onerror = (e) => rej(e.target.error);
      });
      let stack = await getAll;
      stack = Array.isArray(stack) ? stack : [];
      if (!stack.length) return false;
      let pointer = (await StateDB.get("undo_pointer")) ?? (stack.length - 1);
      if (pointer > 0) pointer--; else return false;
      const snap = stack[pointer];
      await StateDB.set("raw_dataset", snap.rawDataset || []);
      await StateDB.set("working_dataset", snap.workingDataset || []);
      await StateDB.set("original_columns", snap.originalColumns || []);
      await StateDB.set("active_columns", snap.activeColumns || []);
      await StateDB.set("active_file_meta", snap.activeFileMeta || null);
      await StateDB.set("pipeline_settings", snap.pipelineSettings || {});
      await StateDB.set("active_formulas", snap.activeFormulas || []);
      await StateDB.set("undo_pointer", pointer);
      return true;
    } catch (e) { console.error("Undo failed", e); return false; }
  },
  redo: async () => {
    try {
      const db = await openDB();
      const tx = db.transaction("undo", "readonly");
      const store = tx.objectStore("undo");
      const getAll = store.getAll ? store.getAll() : new Promise((res, rej) => {
        const items = []; const cursor = store.openCursor();
        cursor.onsuccess = (e) => { const c = e.target.result; if (c) { items.push(c.value); c.continue(); } else res(items); };
        cursor.onerror = (e) => rej(e.target.error);
      });
      let stack = await getAll;
      stack = Array.isArray(stack) ? stack : [];
      let pointer = (await StateDB.get("undo_pointer")) ?? (stack.length - 1);
      if (pointer < stack.length - 1) pointer++; else return false;
      const snap = stack[pointer];
      await StateDB.set("raw_dataset", snap.rawDataset || []);
      await StateDB.set("working_dataset", snap.workingDataset || []);
      await StateDB.set("original_columns", snap.originalColumns || []);
      await StateDB.set("active_columns", snap.activeColumns || []);
      await StateDB.set("active_file_meta", snap.activeFileMeta || null);
      await StateDB.set("pipeline_settings", snap.pipelineSettings || {});
      await StateDB.set("active_formulas", snap.activeFormulas || []);
      await StateDB.set("undo_pointer", pointer);
      return true;
    } catch (e) { console.error("Redo failed", e); return false; }
  }
};

window.StateDB = StateDB;
window.UndoManager = UndoManager;
