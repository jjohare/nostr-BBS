import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export class NostrDatabase {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    const dataDir = process.env.SQLITE_DATA_DIR || './data';

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = path.join(dataDir, 'nostr.db');
  }

  async init(): Promise<void> {
    this.db = new Database(this.dbPath);

    // Enable WAL mode for better concurrent read performance
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB cache
    this.db.pragma('temp_store = MEMORY');

    // Create events table and indexes
    this.db.exec(`
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

      CREATE INDEX IF NOT EXISTS idx_pubkey ON events(pubkey);
      CREATE INDEX IF NOT EXISTS idx_kind ON events(kind);
      CREATE INDEX IF NOT EXISTS idx_created_at ON events(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_kind_created ON events(kind, created_at DESC);
    `);

    // Create whitelist table for cohort management
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS whitelist (
        pubkey TEXT PRIMARY KEY,
        cohorts TEXT NOT NULL DEFAULT '[]',
        added_at INTEGER DEFAULT (strftime('%s', 'now')),
        added_by TEXT,
        expires_at INTEGER,
        notes TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_whitelist_cohorts ON whitelist(cohorts);
    `);

  }

  async saveEvent(
    event: NostrEvent,
    options?: {
      treatment?: 'regular' | 'replaceable' | 'ephemeral' | 'parameterized_replaceable';
      replacementKey?: string | null;
      dTag?: string | null;
    }
  ): Promise<boolean> {
    if (!this.db) return false;

    const treatment = options?.treatment || 'regular';

    try {
      // NIP-16: Handle replaceable events
      if (treatment === 'replaceable') {
        // Delete older event with same pubkey+kind
        const deleteStmt = this.db.prepare(`
          DELETE FROM events
          WHERE pubkey = ? AND kind = ? AND created_at < ?
        `);
        deleteStmt.run(event.pubkey, event.kind, event.created_at);

        // Check if newer event exists
        const checkStmt = this.db.prepare(`
          SELECT 1 FROM events
          WHERE pubkey = ? AND kind = ? AND created_at >= ?
          LIMIT 1
        `);
        const exists = checkStmt.get(event.pubkey, event.kind, event.created_at);
        if (exists) {
          // Newer event exists, don't insert
          return false;
        }
      }

      // NIP-33: Handle parameterized replaceable events
      if (treatment === 'parameterized_replaceable') {
        const dTag = options?.dTag || '';

        // Delete older event with same pubkey+kind+d-tag
        const deleteStmt = this.db.prepare(`
          DELETE FROM events
          WHERE pubkey = ? AND kind = ? AND created_at < ?
          AND json_extract(tags, '$') LIKE ?
        `);
        deleteStmt.run(event.pubkey, event.kind, event.created_at, `%["d","${dTag}"%`);

        // Check if newer event exists
        const checkStmt = this.db.prepare(`
          SELECT 1 FROM events
          WHERE pubkey = ? AND kind = ? AND created_at >= ?
          AND json_extract(tags, '$') LIKE ?
          LIMIT 1
        `);
        const exists = checkStmt.get(event.pubkey, event.kind, event.created_at, `%["d","${dTag}"%`);
        if (exists) {
          return false;
        }
      }

      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO events (id, pubkey, created_at, kind, tags, content, sig)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        event.id,
        event.pubkey,
        event.created_at,
        event.kind,
        JSON.stringify(event.tags),
        event.content,
        event.sig
      );

      return result.changes > 0;
    } catch {
      return false;
    }
  }

  async queryEvents(filters: any[]): Promise<NostrEvent[]> {
    if (!this.db || !filters || filters.length === 0) {
      return [];
    }

    const events: NostrEvent[] = [];

    for (const filter of filters) {
      const conditions: string[] = [];
      const params: any[] = [];

      if (filter.ids && filter.ids.length > 0) {
        const placeholders = filter.ids.map(() => '?').join(',');
        conditions.push(`id IN (${placeholders})`);
        params.push(...filter.ids);
      }

      if (filter.authors && filter.authors.length > 0) {
        const placeholders = filter.authors.map(() => '?').join(',');
        conditions.push(`pubkey IN (${placeholders})`);
        params.push(...filter.authors);
      }

      if (filter.kinds && filter.kinds.length > 0) {
        const placeholders = filter.kinds.map(() => '?').join(',');
        conditions.push(`kind IN (${placeholders})`);
        params.push(...filter.kinds);
      }

      if (filter.since) {
        conditions.push(`created_at >= ?`);
        params.push(filter.since);
      }

      if (filter.until) {
        conditions.push(`created_at <= ?`);
        params.push(filter.until);
      }

      // Filter by tags (e.g., #e, #p)
      for (const [key, values] of Object.entries(filter)) {
        if (key.startsWith('#') && Array.isArray(values)) {
          const tagName = key.substring(1);

          if (!/^[a-zA-Z0-9_-]+$/.test(tagName)) {
            continue;
          }

          for (const value of values) {
            if (typeof value !== 'string' || value.length === 0) {
              continue;
            }

            const escapedValue = value
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/%/g, '\\%')
              .replace(/_/g, '\\_');

            conditions.push(`tags LIKE ? ESCAPE '\\'`);
            params.push(`%["${tagName}","${escapedValue}"%`);
          }
        }
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const limit = filter.limit ? Math.min(filter.limit, 5000) : 500;

      const query = `
        SELECT id, pubkey, created_at, kind, tags, content, sig
        FROM events
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ?
      `;

      try {
        const stmt = this.db.prepare(query);
        const rows = stmt.all(...params, limit) as any[];

        for (const row of rows) {
          events.push({
            id: row.id,
            pubkey: row.pubkey,
            created_at: row.created_at,
            kind: row.kind,
            tags: JSON.parse(row.tags),
            content: row.content,
            sig: row.sig,
          });
        }
      } catch {
        // Query failed, continue with other filters
      }
    }

    return events;
  }

  // Whitelist management methods
  async isWhitelisted(pubkey: string): Promise<boolean> {
    if (!this.db) return false;

    const stmt = this.db.prepare(`
      SELECT 1 FROM whitelist
      WHERE pubkey = ?
      AND (expires_at IS NULL OR expires_at > strftime('%s', 'now'))
    `);

    const result = stmt.get(pubkey);
    return !!result;
  }

  async getWhitelistEntry(pubkey: string): Promise<{
    pubkey: string;
    cohorts: string[];
    addedAt: number;
    addedBy: string | null;
    expiresAt: number | null;
    notes: string | null;
  } | null> {
    if (!this.db) return null;

    const stmt = this.db.prepare(`
      SELECT pubkey, cohorts, added_at, added_by, expires_at, notes
      FROM whitelist
      WHERE pubkey = ?
      AND (expires_at IS NULL OR expires_at > strftime('%s', 'now'))
    `);

    const row = stmt.get(pubkey) as any;
    if (!row) return null;

    return {
      pubkey: row.pubkey,
      cohorts: JSON.parse(row.cohorts || '[]'),
      addedAt: row.added_at,
      addedBy: row.added_by,
      expiresAt: row.expires_at,
      notes: row.notes,
    };
  }

  async addToWhitelist(
    pubkey: string,
    cohorts: string[],
    addedBy: string,
    expiresAt?: number,
    notes?: string
  ): Promise<boolean> {
    if (!this.db) return false;

    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO whitelist (pubkey, cohorts, added_by, expires_at, notes)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(pubkey, JSON.stringify(cohorts), addedBy, expiresAt || null, notes || null);
      return true;
    } catch {
      return false;
    }
  }

  async removeFromWhitelist(pubkey: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const stmt = this.db.prepare('DELETE FROM whitelist WHERE pubkey = ?');
      stmt.run(pubkey);
      return true;
    } catch {
      return false;
    }
  }

  async listWhitelist(): Promise<string[]> {
    if (!this.db) return [];

    const stmt = this.db.prepare(`
      SELECT pubkey FROM whitelist
      WHERE expires_at IS NULL OR expires_at > strftime('%s', 'now')
    `);

    const rows = stmt.all() as { pubkey: string }[];
    return rows.map(r => r.pubkey);
  }

  async getStats(): Promise<{
    eventCount: number;
    whitelistCount: number;
    dbSizeBytes: number;
  }> {
    if (!this.db) {
      return { eventCount: 0, whitelistCount: 0, dbSizeBytes: 0 };
    }

    const eventCount = (this.db.prepare('SELECT COUNT(*) as count FROM events').get() as any).count;
    const whitelistCount = (this.db.prepare('SELECT COUNT(*) as count FROM whitelist').get() as any).count;

    let dbSizeBytes = 0;
    try {
      const stat = fs.statSync(this.dbPath);
      dbSizeBytes = stat.size;
    } catch {
      // File may not exist yet
    }

    return { eventCount, whitelistCount, dbSizeBytes };
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export alias for backward compatibility
export { NostrDatabase as Database };
