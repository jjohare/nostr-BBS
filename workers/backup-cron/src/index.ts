/**
 * Encrypted Notes Backup Cron Worker
 *
 * Backs up encrypted Nostr events from D1 database to private GitHub repository
 * Runs every 6 hours via Cloudflare Cron Trigger
 */

import { createOrUpdateFile, listFiles, deleteFile, type GitHubConfig } from './github';

interface Env {
  DB: D1Database;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  BACKUP_RETENTION_DAYS: string;
}

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string;
  content: string;
  sig: string;
}

interface BackupMetadata {
  timestamp: string;
  eventCount: number;
  kinds: number[];
  dateRange: {
    oldest: number;
    newest: number;
  };
  version: string;
}

interface BackupData {
  metadata: BackupMetadata;
  events: NostrEvent[];
}

/**
 * Fetch encrypted events from D1 database
 * Includes: kind 4 (encrypted DM), 1059 (gift-wrapped), 30078 (app-specific encrypted)
 */
async function fetchEncryptedEvents(db: D1Database): Promise<NostrEvent[]> {
  const query = `
    SELECT id, pubkey, created_at, kind, tags, content, sig
    FROM events
    WHERE kind IN (4, 1059, 30078)
    ORDER BY created_at DESC
  `;

  const result = await db.prepare(query).all<NostrEvent>();
  return result.results || [];
}

/**
 * Create backup data with metadata
 */
function createBackupData(events: NostrEvent[]): BackupData {
  const kinds = [...new Set(events.map(e => e.kind))].sort((a, b) => a - b);
  const createdAts = events.map(e => e.created_at).filter(Boolean);

  return {
    metadata: {
      timestamp: new Date().toISOString(),
      eventCount: events.length,
      kinds,
      dateRange: {
        oldest: createdAts.length > 0 ? Math.min(...createdAts) : 0,
        newest: createdAts.length > 0 ? Math.max(...createdAts) : 0
      },
      version: '1.0.0'
    },
    events
  };
}

/**
 * Generate backup file path based on current timestamp
 * Format: backups/YYYY-MM-DD/HH-00-encrypted-events.json
 */
function getBackupPath(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');

  return `backups/${year}-${month}-${day}/${hour}-00-encrypted-events.json`;
}

/**
 * Clean up old backups beyond retention period
 */
async function cleanupOldBackups(config: GitHubConfig, retentionDays: number): Promise<number> {
  const now = Date.now();
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(now - retentionMs);

  let deletedCount = 0;

  try {
    // List all backup directories
    const backupDirs = await listFiles(config, 'backups');

    for (const dir of backupDirs) {
      // Parse directory name (YYYY-MM-DD)
      const dateMatch = dir.name.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!dateMatch) continue;

      const dirDate = new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`);

      // Delete if older than retention period
      if (dirDate < cutoffDate) {
        // List files in directory
        const files = await listFiles(config, dir.path);

        // Delete each file
        for (const file of files) {
          await deleteFile(config, file.path, `Cleanup: Remove backup older than ${retentionDays} days`);
          deletedCount++;
        }
      }
    }
  } catch (error) {
    console.error('Error during backup cleanup:', error);
    // Don't fail the backup if cleanup fails
  }

  return deletedCount;
}

/**
 * Scheduled handler - runs every 6 hours
 */
export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const startTime = Date.now();

    console.log('Starting encrypted notes backup...');

    try {
      // Validate environment variables
      if (!env.GITHUB_TOKEN) {
        throw new Error('GITHUB_TOKEN not configured');
      }
      if (!env.GITHUB_REPO) {
        throw new Error('GITHUB_REPO not configured');
      }

      const githubConfig: GitHubConfig = {
        token: env.GITHUB_TOKEN,
        repo: env.GITHUB_REPO,
        branch: env.GITHUB_BRANCH || 'main'
      };

      // Fetch encrypted events from database
      console.log('Fetching encrypted events from D1...');
      const events = await fetchEncryptedEvents(env.DB);
      console.log(`Found ${events.length} encrypted events`);

      if (events.length === 0) {
        console.log('No encrypted events to backup');
        return;
      }

      // Create backup data
      const backupData = createBackupData(events);
      const backupJson = JSON.stringify(backupData, null, 2);

      // Generate backup path
      const now = new Date();
      const backupPath = getBackupPath(now);

      // Upload to GitHub
      console.log(`Uploading backup to ${backupPath}...`);
      await createOrUpdateFile(
        githubConfig,
        backupPath,
        backupJson,
        `Automated backup: ${events.length} encrypted events at ${now.toISOString()}`
      );

      console.log('Backup uploaded successfully');

      // Cleanup old backups
      const retentionDays = parseInt(env.BACKUP_RETENTION_DAYS || '30', 10);
      console.log(`Cleaning up backups older than ${retentionDays} days...`);
      const deletedCount = await cleanupOldBackups(githubConfig, retentionDays);
      console.log(`Deleted ${deletedCount} old backup files`);

      const duration = Date.now() - startTime;
      console.log(`Backup completed in ${duration}ms`);

    } catch (error) {
      console.error('Backup failed:', error);
      throw error; // Re-throw to mark the cron execution as failed
    }
  },

  /**
   * HTTP handler for manual testing
   * GET / - triggers a backup manually
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Only allow GET requests for manual trigger
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Manually trigger the backup
      await this.scheduled({} as ScheduledController, env, ctx);

      return new Response('Backup triggered successfully', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response(`Backup failed: ${errorMessage}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};
