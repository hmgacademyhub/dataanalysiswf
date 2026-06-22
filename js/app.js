/**
 * DAWF v6 CORE ENGINE
 * ------------------
 * This engine handles data state, ingestion, cleaning, ETL, and advanced modelling.
 * It uses localStorage to ensure data persists across different HTML pages.
 */

const DAWF = {
    state: {
        dataset: [],
        columns: [],
        originalDataset: [],
        activeFile: null,
        auditLog: [],
        config: {
            brandName: 'Data Analysis Workflow',
            brandTagline: 'Learning Deliberately. Teaching Authentically.',
            primaryColor: '#4f46e5'
        }
    },

    // Persistence Layer
    persistence: {
        save() {
            const dataToSave = {
                dataset: DAWF.state.dataset,
                columns: DAWF.state.columns,
                activeFile: DAWF.state.activeFile,
                auditLog: DAWF.state.auditLog
            };
            localStorage.setItem('DAWF_STATE', JSON.stringify(dataToSave));
        },
        load() {
            const saved = localStorage.getItem('DAWF_STATE');
            if (saved) {
                const parsed = JSON.parse(saved);
                DAWF.state.dataset = parsed.dataset || [];
                DAWF.state.columns = parsed.columns || [];
                DAWF.state.activeFile = parsed.activeFile || null;
                DAWF.state.auditLog = parsed.auditLog || [];
            }
        }
    },

    utils: {
        log(action, details) {
            const entry = {
                timestamp: new Date().toISOString(),
                action,
                details
            };
            DAWF.state.auditLog.push(entry);
            DAWF.persistence.save();
            console.log(`[AUDIT] ${action}: ${details}`);
        },
        
        // Find numeric columns
        getNumericColumns() {
            if (DAWF.state.dataset.length === 0) return [];
            return DAWF.state.columns.filter(col => {
                const val = DAWF.state.dataset.find(row => row[col] !== null && row[col] !== undefined && row[col] !== '');
                return typeof val?.[col] === 'number';
            });
        },

        // Find categorical columns
        getCategoricalColumns() {
            return DAWF.state.columns.filter(col => !this.getNumericColumns().includes(col));
        }
    },

    // Ingestion Engine
    ingestion: {
        async loadFile(file) {
            try {
                let data = [];
                if (file.name.endsWith('.csv')) {
                    data = await this.parseCSV(file);
                } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    data = await this.parseExcel(file);
                } else {
                    throw new Error('Unsupported file format');
                }

                this.finalizeIngestion(data, file.name);
                return data;
            } catch (e) {
                console.error('Ingestion Error:', e);
                throw e;
            }
        },

        async parseCSV(file) {
            return new Promise((resolve, reject) => {
                Papa.parse(file, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (res) => resolve(res.data),
                    error: (err) => reject(err)
                });
            });
        },

        async parseExcel(file) {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer);
            const sheetName = wb.SheetNames[0];
            return XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
        },

        async syncGoogleSheet(url) {
            const csvUrl = url.replace(/\/edit.*$/, '/export?format=csv');
            const response = await fetch(csvUrl);
            const text = await response.text();
            const data = Papa.parse(text, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            }).data;
            this.finalizeIngestion(data, 'Google Sheet');
            return data;
        },

        finalizeIngestion(data, fileName) {
            if (!data || data.length === 0) throw new Error('No data found in file');
            DAWF.state.dataset = data;
            DAWF.state.columns = Object.keys(data[0]);
            DAWF.state.activeFile = fileName;
            DAWF.state.originalDataset = JSON.parse(JSON.stringify(data));
            DAWF.utils.log('DATA_LOAD', `Loaded ${data.length} rows from ${fileName}`);
            DAWF.persistence.save();
        }
    },

    // Profiling Engine (Excel/PowerBI style)
    profiling: {
        getOverview() {
            const data = DAWF.state.dataset;
            return {
                rowCount: data.length,
                colCount: DAWF.state.columns.length,
                totalCells: data.length * DAWF.state.columns.length,
                lastUpdated: new Date().toLocaleString()
            };
        },

        getColumnStats(colName) {
            const vals = DAWF.state.dataset.map(r => r[colName]).filter(v => v !== null && v !== undefined && v !== '');
            const total = DAWF.state.dataset.length;
            const unique = new Set(vals).size;
            
            const stats = {
                name: colName,
                type: typeof vals[0],
                nulls: total - vals.length,
                nullPercent: ((total - vals.length) / total) * 100,
                unique: unique,
                uniquePercent: (unique / total) * 100
            };

            if (stats.type === 'number') {
                const sorted = [...vals].sort((a, b) => a - b);
                stats.min = sorted[0];
                stats.max = sorted[sorted.length - 1];
                stats.avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
                
                const q1 = sorted[Math.floor(sorted.length * 0.25)];
                const q3 = sorted[Math.floor(sorted.length * 0.75)];
                const iqr = q3 - q1;
                stats.outliers = vals.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr).length;
            }
            return stats;
        }
    },

    // Cleaning Engine
    cleaning: {
        trimAll() {
            DAWF.state.dataset = DAWF.state.dataset.map(row => {
                const newRow = { ...row };
                for (let k in newRow) if (typeof newRow[k] === 'string') newRow[k] = newRow[k].trim();
                return newRow;
            });
            DAWF.utils.log('CLEAN_TRIM', 'Trimmed all string columns');
            DAWF.persistence.save();
        },

        dropDuplicates() {
            const seen = new Set();
            const initial = DAWF.state.dataset.length;
            DAWF.state.dataset = DAWF.state.dataset.filter(row => {
                const s = JSON.stringify(row);
                return seen.has(s) ? false : seen.add(s);
            });
            DAWF.utils.log('CLEAN_DUPES', `Removed ${initial - DAWF.state.dataset.length} duplicates`);
            DAWF.persistence.save();
        },

        fillMissing(col, val, strategy = 'constant') {
            if (strategy === 'constant') {
                DAWF.state.dataset = DAWF.state.dataset.map(row => {
                    if (row[col] === null || row[col] === undefined || row[col] === '') return { ...row, [col]: val };
                    return row;
                });
            } else if (strategy === 'mean') {
                const nums = DAWF.state.dataset.map(r => r[col]).filter(v => typeof v === 'number');
                const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
                this.fillMissing(col, mean, 'constant');
            }
            DAWF.utils.log('CLEAN_FILL', `Filled missing in ${col} using ${strategy}`);
            DAWF.persistence.save();
        }
    },

    // ETL Engine (Power Query style)
    etl: {
        calculateColumn(name, formula) {
            try {
                const sanitized = formula.replace(/\[(.*?)\]/g, (m, col) => `row['${col}']`);
                const fn = new Function('row', `return ${sanitized}`);
                DAWF.state.dataset = DAWF.state.dataset.map(row => ({ ...row, [name]: fn(row) }));
                if (!DAWF.state.columns.includes(name)) DAWF.state.columns.push(name);
                DAWF.utils.log('ETL_CALC', `Created column ${name}`);
                DAWF.persistence.save();
            } catch (e) { throw new Error(`Formula Error: ${e.message}`); }
        },

        dropColumn(col) {
            DAWF.state.dataset = DAWF.state.dataset.map(row => {
                const { [col]: _, ...rest } = row;
                return rest;
            });
            DAWF.state.columns = DAWF.state.columns.filter(c => c !== col);
            DAWF.utils.log('ETL_DROP', `Dropped ${col}`);
            DAWF.persistence.save();
        },

        renameColumn(oldN, newN) {
            DAWF.state.dataset = DAWF.state.dataset.map(row => {
                const { [oldN]: val, ...rest } = row;
                return { ...rest, [newN]: val };
            });
            const idx = DAWF.state.columns.indexOf(oldN);
            DAWF.state.columns[idx] = newN;
            DAWF.utils.log('ETL_RENAME', `${oldN} -> ${newN}`);
            DAWF.persistence.save();
        },

        mergeDatasets(otherData, leftKey, rightKey, type = 'inner') {
            // Implementation of Joins (Inner, Left, Outer)
            const left = DAWF.state.dataset;
            const right = otherData;
            let result = [];

            if (type === 'inner') {
                left.forEach(lRow => {
                    right.forEach(rRow => {
                        if (lRow[leftKey] === rRow[rightKey]) result.push({ ...lRow, ...rRow });
                    });
                });
            } else if (type === 'left') {
                left.forEach(lRow => {
                    const match = right.find(rRow => rRow[rightKey] === lRow[leftKey]);
                    result.push(match ? { ...lRow, ...match } : lRow);
                });
            }
            
            DAWF.state.dataset = result;
            DAWF.state.columns = Object.keys(result[0] || {});
            DAWF.utils.log('ETL_MERGE', `Joined datasets using ${type} join on ${leftKey}`);
            DAWF.persistence.save();
        }
    },

    // BI Modelling (Analyst Modeller)
    analyst: {
        computeRFM(custCol, dateCol, valCol) {
            const now = new Date();
            const customerData = {};

            DAWF.state.dataset.forEach(row => {
                const cust = row[custCol];
                const date = new Date(row[dateCol]);
                const val = parseFloat(row[valCol]) || 0;
                
                if (!customerData[cust]) customerData[cust] = { r: date, f: 0, m: 0 };
                if (date > customerData[cust].r) customerData[cust].r = date;
                customerData[cust].f += 1;
                customerData[cust].m += val;
            });

            return Object.entries(customerData).map(([id, stats]) => ({
                Customer: id,
                Recency: Math.floor((now - stats.r) / (1000 * 60 * 60 * 24)),
                Frequency: stats.f,
                Monetary: stats.m
            }));
        },

        computePareto(dimCol, measureCol) {
            const agg = {};
            DAWF.state.dataset.forEach(row => {
                const k = row[dimCol] || 'Unknown';
                agg[k] = (agg[k] || 0) + (parseFloat(row[measureCol]) || 0);
            });

            const sorted = Object.entries(agg).sort((a, b) => b[1] - a[1]);
            const total = sorted.reduce((sum, pair) => sum + pair[1], 0);
            
            let cumulative = 0;
            return sorted.map(([name, val]) => {
                cumulative += val;
                return {
                    Category: name,
                    Value: val,
                    CumulativePercent: (cumulative / total) * 100
                };
            });
        }
    }
};

// Initialize Persistence on load
window.addEventListener('DOMContentLoaded', () => DAWF.persistence.load());
