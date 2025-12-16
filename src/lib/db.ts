import Dexie, { type Table } from 'dexie';

/**
 * Message interface for Dexie database
 */
export interface DBMessage {
  id: string;
  channelId: string;
  pubkey: string;
  content: string;
  created_at: number;
  encrypted: boolean;
  deleted: boolean;
  authorName?: string;
  authorAvatar?: string;
  kind: number;
  tags: string[][];
  sig: string;
}

/**
 * Channel interface for Dexie database
 */
export interface DBChannel {
  id: string;
  name: string;
  about: string | null;
  picture: string | null;
  creatorPubkey: string;
  created_at: number;
  isPrivate: boolean;
  isEncrypted: boolean;
  memberPubkeys: string[];
  adminPubkeys: string[];
  kind: number;
  tags: string[][];
}

/**
 * User profile cache for Dexie database
 */
export interface DBUser {
  pubkey: string;
  name: string | null;
  displayName: string | null;
  avatar: string | null;
  about: string | null;
  nip05: string | null;
  lud16: string | null;
  website: string | null;
  banner: string | null;
  created_at: number | null;
  updated_at: number | null;
  cached_at: number;
}

/**
 * Deletion event tracking
 */
export interface DBDeletion {
  id: string;
  deletedEventId: string;
  channelId: string;
  deleterPubkey: string;
  created_at: number;
  kind: number; // 5 for NIP-09, 9005 for NIP-29
}

/**
 * Relay connection state
 */
export interface DBRelay {
  url: string;
  connected: boolean;
  lastConnected: number | null;
  lastError: string | null;
  subscriptions: string[];
}

/**
 * Search index entry for full-text search
 */
export interface DBSearchIndex {
  id: string; // unique id for this index entry
  messageId: string;
  channelId: string;
  content: string;
  authorPubkey: string;
  timestamp: number;
  tokens: string[]; // tokenized content for searching
}

/**
 * Search history entry
 */
export interface DBSearchHistory {
  id?: number;
  query: string;
  timestamp: number;
  resultCount: number;
}

/**
 * Embedding data stored in IndexedDB
 */
export interface DBEmbedding {
  key: string;
  data: ArrayBuffer;
  version: number;
}

/**
 * Metadata storage for sync state and other config
 */
export interface DBMetadata {
  key: string;
  value: unknown;
}

/**
 * Nostr BBS Database
 */
class MinimoomaNoirDB extends Dexie {
  messages!: Table<DBMessage, string>;
  channels!: Table<DBChannel, string>;
  users!: Table<DBUser, string>;
  deletions!: Table<DBDeletion, string>;
  relays!: Table<DBRelay, string>;
  searchIndex!: Table<DBSearchIndex, string>;
  searchHistory!: Table<DBSearchHistory, number>;
  embeddings!: Table<DBEmbedding, string>;
  metadata!: Table<DBMetadata, string>;

  constructor() {
    super('MinimoomaNoirDB');

    this.version(1).stores({
      messages: 'id, channelId, pubkey, created_at, deleted, [channelId+created_at]',
      channels: 'id, creatorPubkey, created_at, isPrivate, isEncrypted',
      users: 'pubkey, cached_at',
      deletions: 'id, deletedEventId, channelId, deleterPubkey, created_at',
      relays: 'url, connected, lastConnected'
    });

    // Version 2: Add search tables
    this.version(2).stores({
      messages: 'id, channelId, pubkey, created_at, deleted, [channelId+created_at]',
      channels: 'id, creatorPubkey, created_at, isPrivate, isEncrypted',
      users: 'pubkey, cached_at',
      deletions: 'id, deletedEventId, channelId, deleterPubkey, created_at',
      relays: 'url, connected, lastConnected',
      searchIndex: 'id, messageId, channelId, authorPubkey, timestamp, *tokens',
      searchHistory: '++id, timestamp'
    });

    // Version 3: Add semantic search tables for HNSW index and embeddings
    this.version(3).stores({
      messages: 'id, channelId, pubkey, created_at, deleted, [channelId+created_at]',
      channels: 'id, creatorPubkey, created_at, isPrivate, isEncrypted',
      users: 'pubkey, cached_at',
      deletions: 'id, deletedEventId, channelId, deleterPubkey, created_at',
      relays: 'url, connected, lastConnected',
      searchIndex: 'id, messageId, channelId, authorPubkey, timestamp, *tokens',
      searchHistory: '++id, timestamp',
      embeddings: 'key, version',
      metadata: 'key'
    });
  }

  /**
   * Clear all data from the database
   */
  async clearAll(): Promise<void> {
    await this.messages.clear();
    await this.channels.clear();
    await this.users.clear();
    await this.deletions.clear();
    await this.relays.clear();
  }

  /**
   * Get estimated storage usage in bytes
   */
  async getStorageEstimate(): Promise<{ used: number; quota: number; percentage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      return {
        used,
        quota,
        percentage: quota > 0 ? (used / quota) * 100 : 0
      };
    }
    return { used: 0, quota: 0, percentage: 0 };
  }

  /**
   * Get table row counts for diagnostics
   */
  async getTableCounts(): Promise<Record<string, number>> {
    return {
      messages: await this.messages.count(),
      channels: await this.channels.count(),
      users: await this.users.count(),
      deletions: await this.deletions.count(),
      searchIndex: await this.searchIndex.count(),
      searchHistory: await this.searchHistory.count()
    };
  }

  /**
   * Aggressive cache pruning with configurable limits
   *
   * Default strategy:
   * - Keep only last 3 days of messages per channel (configurable)
   * - Keep max 1000 messages per channel
   * - Keep max 500 users in cache
   * - Prune search index older than 7 days
   * - Auto-trigger when storage exceeds 80% quota
   */
  async pruneOldCache(options: {
    maxMessageAgeDays?: number;
    maxMessagesPerChannel?: number;
    maxCachedUsers?: number;
    maxSearchIndexAgeDays?: number;
    forceAggressive?: boolean;
  } = {}): Promise<{ pruned: Record<string, number>; storageFreed: number }> {
    const {
      maxMessageAgeDays = 3,
      maxMessagesPerChannel = 1000,
      maxCachedUsers = 500,
      maxSearchIndexAgeDays = 7,
      forceAggressive = false
    } = options;

    const pruned: Record<string, number> = {
      messages: 0,
      users: 0,
      deletions: 0,
      searchIndex: 0
    };

    const storageBefore = await this.getStorageEstimate();
    const needsAggressive = forceAggressive || storageBefore.percentage > 80;

    const now = Date.now() / 1000;
    const messagesCutoff = now - (maxMessageAgeDays * 24 * 60 * 60);
    const searchCutoff = now - (maxSearchIndexAgeDays * 24 * 60 * 60);
    const userCacheCutoff = now - (needsAggressive ? 1 : 7) * 24 * 60 * 60;

    // 1. Prune old messages by age
    pruned.messages += await this.messages
      .where('created_at')
      .below(messagesCutoff)
      .delete();

    // 2. Prune messages per channel if exceeding limit
    const channels = await this.channels.toArray();
    for (const channel of channels) {
      const messageCount = await this.messages
        .where('channelId')
        .equals(channel.id)
        .count();

      if (messageCount > maxMessagesPerChannel) {
        // Keep only the newest messages
        const oldestToKeep = await this.messages
          .where('channelId')
          .equals(channel.id)
          .reverse()
          .offset(maxMessagesPerChannel)
          .toArray();

        if (oldestToKeep.length > 0) {
          const idsToDelete = oldestToKeep.map(m => m.id);
          await this.messages.bulkDelete(idsToDelete);
          pruned.messages += idsToDelete.length;

          // Also remove from search index
          await this.searchIndex
            .where('messageId')
            .anyOf(idsToDelete)
            .delete();
        }
      }
    }

    // 3. Prune old user cache - keep only most recently cached
    const userCount = await this.users.count();
    if (userCount > maxCachedUsers || needsAggressive) {
      // Delete users older than cutoff
      pruned.users += await this.users
        .where('cached_at')
        .below(userCacheCutoff)
        .delete();

      // If still over limit, delete oldest
      const remainingUsers = await this.users.count();
      if (remainingUsers > maxCachedUsers) {
        const toDelete = await this.users
          .orderBy('cached_at')
          .limit(remainingUsers - maxCachedUsers)
          .toArray();
        await this.users.bulkDelete(toDelete.map(u => u.pubkey));
        pruned.users += toDelete.length;
      }
    }

    // 4. Prune old deletions (keep for reference but clean old ones)
    pruned.deletions += await this.deletions
      .where('created_at')
      .below(now - (needsAggressive ? 3 : 7) * 24 * 60 * 60)
      .delete();

    // 5. Prune old search index entries
    pruned.searchIndex += await this.searchIndex
      .where('timestamp')
      .below(searchCutoff)
      .delete();

    // 6. Clean up search history (keep last 20 in aggressive mode)
    if (needsAggressive) {
      const historyCount = await this.searchHistory.count();
      if (historyCount > 20) {
        const oldHistory = await this.searchHistory
          .orderBy('timestamp')
          .limit(historyCount - 20)
          .toArray();
        await this.searchHistory.bulkDelete(oldHistory.map(h => h.id!));
      }
    }

    const storageAfter = await this.getStorageEstimate();

    return {
      pruned,
      storageFreed: storageBefore.used - storageAfter.used
    };
  }

  /**
   * Check if storage is getting full and prune if needed
   * Call this periodically or after bulk operations
   */
  async autoMaintenance(): Promise<void> {
    const storage = await this.getStorageEstimate();

    if (storage.percentage > 90) {
      console.warn(`[DB] Storage at ${storage.percentage.toFixed(1)}% - running aggressive cleanup`);
      await this.pruneOldCache({ forceAggressive: true });
    } else if (storage.percentage > 70) {
      console.info(`[DB] Storage at ${storage.percentage.toFixed(1)}% - running standard cleanup`);
      await this.pruneOldCache();
    }
  }

  /**
   * Get messages for a channel with author info
   */
  async getChannelMessagesWithAuthors(channelId: string): Promise<(DBMessage & { author: DBUser | null })[]> {
    const messages = await this.messages
      .where('channelId')
      .equals(channelId)
      .and(msg => !msg.deleted)
      .sortBy('created_at');

    const messagesWithAuthors = await Promise.all(
      messages.map(async (msg) => {
        const author = await this.users.get(msg.pubkey);
        return { ...msg, author: author || null };
      })
    );

    return messagesWithAuthors;
  }

  /**
   * Mark message as deleted
   */
  async markMessageDeleted(messageId: string): Promise<void> {
    await this.messages.update(messageId, { deleted: true });
  }

  /**
   * Get channel by ID
   */
  async getChannel(channelId: string): Promise<DBChannel | undefined> {
    return await this.channels.get(channelId);
  }

  /**
   * Get user by pubkey
   */
  async getUser(pubkey: string): Promise<DBUser | undefined> {
    return await this.users.get(pubkey);
  }

  /**
   * Cache user profile
   */
  async cacheUser(user: Omit<DBUser, 'cached_at'>): Promise<void> {
    await this.users.put({
      ...user,
      cached_at: Date.now() / 1000
    });
  }

  /**
   * Check if message is deleted
   */
  async isMessageDeleted(messageId: string): Promise<boolean> {
    const deletion = await this.deletions.get(messageId);
    return deletion !== undefined;
  }

  /**
   * Add deletion event
   */
  async addDeletion(deletion: DBDeletion): Promise<void> {
    await this.deletions.put(deletion);
    await this.markMessageDeleted(deletion.deletedEventId);
  }

  /**
   * Update relay connection state
   */
  async updateRelay(url: string, updates: Partial<DBRelay>): Promise<void> {
    const existing = await this.relays.get(url);

    if (existing) {
      await this.relays.update(url, updates);
    } else {
      await this.relays.put({
        url,
        connected: false,
        lastConnected: null,
        lastError: null,
        subscriptions: [],
        ...updates
      });
    }
  }

  /**
   * Get all messages for export
   */
  async exportMessages(channelId?: string): Promise<DBMessage[]> {
    if (channelId) {
      return await this.messages
        .where('channelId')
        .equals(channelId)
        .toArray();
    }
    return await this.messages.toArray();
  }

  /**
   * Import messages from backup
   */
  async importMessages(messages: DBMessage[]): Promise<void> {
    await this.messages.bulkPut(messages);
  }

  /**
   * Tokenize text for search indexing
   * Converts text to lowercase, removes special characters, splits into words
   */
  tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
      .split(/\s+/) // Split on whitespace
      .filter(token => token.length > 1) // Remove single characters
      .filter(token => !this.isStopWord(token)); // Remove stop words
  }

  /**
   * Check if word is a stop word (common words to ignore)
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
      'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]);
    return stopWords.has(word);
  }

  /**
   * Index a single message for search
   */
  async indexMessage(message: DBMessage): Promise<void> {
    if (message.deleted) return; // Don't index deleted messages

    const tokens = this.tokenize(message.content);

    const searchEntry: DBSearchIndex = {
      id: `idx_${message.id}`,
      messageId: message.id,
      channelId: message.channelId,
      content: message.content,
      authorPubkey: message.pubkey,
      timestamp: message.created_at,
      tokens
    };

    await this.searchIndex.put(searchEntry);
  }

  /**
   * Bulk index multiple messages
   */
  async bulkIndexMessages(messages: DBMessage[]): Promise<void> {
    const searchEntries = messages
      .filter(msg => !msg.deleted)
      .map(message => {
        const tokens = this.tokenize(message.content);
        return {
          id: `idx_${message.id}`,
          messageId: message.id,
          channelId: message.channelId,
          content: message.content,
          authorPubkey: message.pubkey,
          timestamp: message.created_at,
          tokens
        };
      });

    await this.searchIndex.bulkPut(searchEntries);
  }

  /**
   * Remove message from search index
   */
  async removeFromIndex(messageId: string): Promise<void> {
    await this.searchIndex.delete(`idx_${messageId}`);
  }

  /**
   * Clear entire search index
   */
  async clearSearchIndex(): Promise<void> {
    await this.searchIndex.clear();
  }

  /**
   * Save search query to history
   */
  async addSearchHistory(query: string, resultCount: number): Promise<void> {
    await this.searchHistory.add({
      query,
      timestamp: Date.now() / 1000,
      resultCount
    });

    // Keep only last 50 searches
    const count = await this.searchHistory.count();
    if (count > 50) {
      const oldest = await this.searchHistory
        .orderBy('timestamp')
        .limit(count - 50)
        .toArray();

      await this.searchHistory.bulkDelete(oldest.map(h => h.id!));
    }
  }

  /**
   * Get recent search history
   */
  async getSearchHistory(limit: number = 10): Promise<DBSearchHistory[]> {
    return await this.searchHistory
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Clear search history
   */
  async clearSearchHistory(): Promise<void> {
    await this.searchHistory.clear();
  }
}

/**
 * Singleton database instance
 */
export const db = new MinimoomaNoirDB();

/**
 * Initialize database and run maintenance
 */
export async function initDB(): Promise<void> {
  try {
    await db.open();
    await db.pruneOldCache();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDB(): Promise<void> {
  await db.close();
}
