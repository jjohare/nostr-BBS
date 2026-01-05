/**
 * Test setup and utilities
 */
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export const TEST_RELAY_CONFIG = {
  host: process.env.RELAY_HOST || 'localhost',
  port: parseInt(process.env.RELAY_PORT || '8080'),
  wsUrl: process.env.RELAY_WS_URL || 'ws://localhost:8080',
};

const TEST_DB_DIR = process.env.TEST_DB_DIR || path.join(os.tmpdir(), 'nostr-relay-tests');
const TEST_DB_PATH = path.join(TEST_DB_DIR, `test-${process.pid}.db`);

let testDb: Database.Database | null = null;

export function getTestDb(): Database.Database {
  if (!testDb) {
    if (!fs.existsSync(TEST_DB_DIR)) {
      fs.mkdirSync(TEST_DB_DIR, { recursive: true });
    }
    testDb = new Database(TEST_DB_PATH);
    testDb.pragma('journal_mode = WAL');
  }
  return testDb;
}

export function closeTestDb(): void {
  if (testDb) {
    testDb.close();
    testDb = null;
  }
}

export function setupTestDatabase(): void {
  const db = getTestDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      pubkey TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      kind INTEGER NOT NULL,
      tags TEXT NOT NULL,
      content TEXT NOT NULL,
      sig TEXT NOT NULL,
      received_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_events_pubkey ON events(pubkey);
    CREATE INDEX IF NOT EXISTS idx_events_kind ON events(kind);
    CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

    CREATE TABLE IF NOT EXISTS whitelist (
      pubkey TEXT PRIMARY KEY,
      cohorts TEXT NOT NULL DEFAULT '[]',
      added_at INTEGER DEFAULT (strftime('%s', 'now')),
      added_by TEXT,
      expires_at INTEGER,
      notes TEXT
    );
  `);
}

export function cleanTestDatabase(): void {
  const db = getTestDb();
  db.exec(`
    DELETE FROM whitelist;
    DELETE FROM events;
  `);
}

export function globalSetup(): void {
  setupTestDatabase();
}

export function globalTeardown(): void {
  cleanTestDatabase();
  closeTestDb();

  try {
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    if (fs.existsSync(TEST_DB_PATH + '-wal')) fs.unlinkSync(TEST_DB_PATH + '-wal');
    if (fs.existsSync(TEST_DB_PATH + '-shm')) fs.unlinkSync(TEST_DB_PATH + '-shm');
  } catch {
    // Ignore cleanup errors
  }
}
