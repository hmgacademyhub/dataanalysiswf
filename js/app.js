/**
 * Data Analysis Workflow - Core Engine
 * Developed by Expert Agentic Assistant
 * Implementation of advanced data science and BI logic for static environments.
 */

const DAWF = {
    state: {
        dataset: [],
        originalDataset: [],
        columns: [],
        activeFile: null,
        user: {
            tier: 'Free',
            name: 'Guest Analyst'
        },
        auditLog: [],
        config: {
            brandName: 'Data Analysis Workflow',
            brandTagline: 'Learning Deliberately. Teaching Authentically.',
            primaryColor: '#4f46e5'
        }
    },

    // Utility Functions
    utils: {
        logAction(action, details) {
            const entry = {
                timestamp: new Date().toISOString(),
                action: action,
                details: details
            };
            DAWF.state.auditLog.push(entry);
            console.log(`[AUDIT] ${action}: ${details}`);
        },

        formatCurrency(value) {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
        },

        formatPercent(value) {
            return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }).format(value);
        }
    },

    // Data Ingestion
    ingestion: {
        async parseCSV(file) {
            return new Promise((resolve, reject) => {
                Papa.parse(file, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results) => resolve(results.data),
                    error: (error) => reject(error)
                });
            });
        },

        async parseExcel(file) {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            return XLSX.utils.sheet_to_json(worksheet);
        },

        async syncGoogleSheet(url) {
            // Simple CSV export trick for public Google Sheets
            const csvUrl = url.replace(/\/edit.*$/, '/export?format=csv');
            const response = await fetch(csvUrl);
            const text = await response.text();
            return Papa.parse(text, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            }).data;
        },

        async loadData(source, options = {}) {
            try {
                let data = [];
                if (source instanceof File) {
                    if (source.name.endsWith('.csv')) {
                        data = await this.parseCSV(source);
                    } else if (source.name.endsWith('.xlsx') || source.name.endsWith('.xls')) {
                        data = await this.parseExcel(source);
                    }
                } else if (typeof source === 'string' && source.startsWith('http')) {
                    data = await this.syncGoogleSheet(source);
                }

                if (data && data.length > 0) {
                    DAWF.state.dataset = data;
                    DAWF.state.originalDataset = JSON.parse(JSON.stringify(data));
                    DAWF.state.columns = Object.keys(data[0]);
                    DAWF.utils.logAction('DATA_INGESTION', `Loaded ${data.length} rows from ${source.name || 'URL'}`);
                    return data;
                }
                throw new Error('No valid data found.');
            } catch (error) {
                console.error('Ingestion Error:', error);
                throw error;
            }
        }
    },

    // Data Profiling (from exceloperations)
    profiling: {
        generateOverview() {
            const data = DAWF.state.dataset;
            const cols = DAWF.state.columns;
            return {
                rowCount: data.length,
                colCount: cols.length,
                totalCells: data.length * cols.length,
                lastUpdated: new Date().toLocaleString()
            };
        },

        getColumnProfile(colName) {
            const values = DAWF.state.dataset.map(row => row[colName]);
            const nonNulls = values.filter(v => v !== null && v !== undefined && v !== '');
            const uniqueValues = new Set(values).size;
            
            const profile = {
                name: colName,
                type: typeof values.find(v => v !== null && v !== undefined),
                count: values.length,
                nonNullCount: nonNulls.length,
                nullCount: values.length - nonNulls.length,
                nullPercent: (values.length - nonNulls.length) / values.length,
                uniqueCount: uniqueValues,
                uniquePercent: uniqueValues / values.length
            };

            if (profile.type === 'number') {
                const sorted = nonNulls.sort((a, b) => a - b);
                profile.min = sorted[0];
                profile.max = sorted[sorted.length - 1];
                profile.mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
                profile.median = sorted[Math.floor(sorted.length / 2)];
                
                // IQR Outliers
                const q1 = sorted[Math.floor(sorted.length * 0.25)];
                const q3 = sorted[Math.floor(sorted.length * 0.75)];
                const iqr = q3 - q1;
                const lowerBound = q1 - 1.5 * iqr;
                const upperBound = q3 + 1.5 * iqr;
                profile.outliers = values.filter(v => v < lowerBound || v > upperBound).length;
            }

            return profile;
        },

        getFullProfile() {
            return {
                overview: this.generateOverview(),
                columns: DAWF.state.columns.map(col => this.getColumnProfile(col))
            };
        }
    },

    // Data Cleaning (from exceloperations)
    cleaning: {
        trimAll() {
            DAWF.state.dataset = DAWF.state.dataset.map(row => {
                const newRow = { ...row };
                for (let key in newRow) {
                    if (typeof newRow[key] === 'string') {
                        newRow[key] = newRow[key].trim();
                    }
                }
                return newRow;
            });
            DAWF.utils.logAction('CLEANING_TRIM', 'Trimmed all whitespace from string columns');
        },

        dropDuplicates() {
            const seen = new Set();
            const initialCount = DAWF.state.dataset.length;
            DAWF.state.dataset = DAWF.state.dataset.filter(row => {
                const str = JSON.stringify(row);
                return seen.has(str) ? false : seen.add(str);
            });
            DAWF.utils.logAction('CLEANING_DUPES', `Removed ${initialCount - DAWF.state.dataset.length} duplicate rows`);
        },

        fillMissing(colName, value, strategy = 'constant') {
            if (strategy === 'constant') {
                DAWF.state.dataset = DAWF.state.dataset.map(row => {
                    if (row[colName] === null || row[colName] === undefined || row[colName] === '') {
                        return { ...row, [colName]: value };
                    }
                    return row;
                });
            } else if (strategy === 'mean') {
                const vals = DAWF.state.dataset.map(r => r[colName]).filter(v => typeof v === 'number');
                const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
                this.fillMissing(colName, mean, 'constant');
            }
            DAWF.utils.logAction('CLEANING_FILL', `Filled missing values in ${colName} using ${strategy}`);
        }
    }
};
