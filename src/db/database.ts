import initSqlJs, { type Database } from 'sql.js';
import { openDB } from 'idb';
import { CREATE_TABLES_SQL } from './schema';
import { seedDemoData } from './seed';

const DB_NAME = '12-week-year';
const DB_STORE = 'database';
const DB_KEY = 'main';

let db: Database | null = null;

async function getIdb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    },
  });
}

async function loadFromIndexedDB(): Promise<Uint8Array | null> {
  const idb = await getIdb();
  const data = await idb.get(DB_STORE, DB_KEY);
  return data ?? null;
}

async function saveToIndexedDB(data: Uint8Array): Promise<void> {
  const idb = await getIdb();
  await idb.put(DB_STORE, data, DB_KEY);
}

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  const baseUrl = import.meta.env.BASE_URL;
  const wasmUrl = `${baseUrl}sql-wasm.wasm`;

  // Fetch WASM binary manually for reliable loading across environments
  const wasmResponse = await fetch(wasmUrl);
  if (!wasmResponse.ok) {
    throw new Error(`Failed to fetch sql-wasm.wasm (${wasmResponse.status}) from ${wasmUrl}`);
  }
  const wasmBinary = await wasmResponse.arrayBuffer();

  const SQL = await initSqlJs({ wasmBinary });

  const savedData = await loadFromIndexedDB();
  if (savedData) {
    try {
      const candidate = new SQL.Database(savedData);
      // Validate the loaded DB has the expected tables
      candidate.exec('SELECT 1 FROM cycles LIMIT 1');
      db = candidate;
    } catch {
      // Corrupted or incompatible DB — start fresh
      console.warn('Existing database was corrupted, creating a new one.');
      db = new SQL.Database();
      db.exec(CREATE_TABLES_SQL);
      await saveDb();
    }
  } else {
    db = new SQL.Database();
    db.exec(CREATE_TABLES_SQL);
    // Only seed demo data on the hosted GitHub Pages build
    if (import.meta.env.VITE_DEMO === 'true') {
      await seedDemoData();
    }
    await saveDb();
  }

  return db;
}

export async function saveDb(): Promise<void> {
  if (!db) return;
  const data = db.export();
  await saveToIndexedDB(data);
}

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export function exportDbFile(): void {
  if (!db) return;
  const data = db.export();
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `12-week-year-backup-${new Date().toISOString().slice(0, 10)}.db`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importDbFile(file: File): Promise<void> {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);

  const baseUrl = import.meta.env.BASE_URL;
  const wasmUrl = `${baseUrl}sql-wasm.wasm`;
  const wasmResponse = await fetch(wasmUrl);
  if (!wasmResponse.ok) {
    throw new Error(`Failed to fetch sql-wasm.wasm (${wasmResponse.status}) from ${wasmUrl}`);
  }
  const wasmBinary = await wasmResponse.arrayBuffer();
  const SQL = await initSqlJs({ wasmBinary });

  // Validate it's a proper SQLite database
  const testDb = new SQL.Database(data);
  try {
    testDb.run('SELECT 1 FROM cycles LIMIT 1');
  } catch {
    testDb.close();
    throw new Error('Invalid database file: missing expected tables.');
  }
  
  // Replace current database
  if (db) db.close();
  db = testDb;
  await saveDb();
}
