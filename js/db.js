/**
 * DAWF v5 IndexedDB State Manager
 * Handles asynchronous data transactions and states transfers between separate physical HTML pages.
 */

const DB_NAME = "DAWF_Ultimate_v5_DB";
const DB_VERSION = 1;

let dbInstance = null;

function openDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("state")) {
                db.createObjectStore("state");
            }
        };
        
        request.onsuccess = (e) => {
            dbInstance = e.target.result;
            resolve(dbInstance);
        };
        
        request.onerror = (e) => {
            reject(e.target.error);
        };
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

window.StateDB = StateDB;
