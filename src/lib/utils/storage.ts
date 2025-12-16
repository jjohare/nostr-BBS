/**
 * Secure localStorage utilities for Nostr key management
 * Includes fallback to in-memory storage for private browsing
 */

/**
 * In-memory storage fallback for when localStorage is unavailable
 */
class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.data.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

// Fallback storage instance
const memoryStorage = new MemoryStorage();
let usingFallback = false;

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get appropriate storage with automatic fallback
 */
function getStorage(): Storage {
  if (typeof window === 'undefined') {
    return memoryStorage;
  }

  if (usingFallback) {
    return memoryStorage;
  }

  if (!isLocalStorageAvailable()) {
    usingFallback = true;
    console.warn('localStorage unavailable, using in-memory fallback. Data will not persist.');
    return memoryStorage;
  }

  return localStorage;
}

/**
 * Safe storage wrapper with automatic fallback
 */
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return getStorage().getItem(key);
    } catch {
      return memoryStorage.getItem(key);
    }
  },

  setItem(key: string, value: string): boolean {
    try {
      getStorage().setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Storage quota exceeded or unavailable for ${key}, using fallback`);
      if (!usingFallback) {
        usingFallback = true;
      }
      memoryStorage.setItem(key, value);
      return true;
    }
  },

  removeItem(key: string): void {
    try {
      getStorage().removeItem(key);
      memoryStorage.removeItem(key);
    } catch {
      memoryStorage.removeItem(key);
    }
  },

  get isUsingFallback(): boolean {
    return usingFallback || !isLocalStorageAvailable();
  }
};

const STORAGE_KEYS = {
  PUBKEY: 'nostr_bbs_nostr_pubkey',
  ENCRYPTED_PRIVKEY: 'nostr_bbs_nostr_encrypted_privkey',
  MNEMONIC_SHOWN: 'nostr_bbs_nostr_mnemonic_shown'
} as const;

export interface StoredKeys {
  pubkey: string;
  encryptedPrivkey: string;
}

/**
 * Validates that we're running in a secure context
 */
function validateSecureContext(): void {
  if (typeof window === 'undefined') {
    return; // SSR context
  }

  if (!window.isSecureContext && window.location.hostname !== 'localhost') {
    console.warn('Not running in a secure context. Key storage may be insecure.');
  }
}

/**
 * Saves Nostr keys to localStorage
 */
export function saveKeys(pubkey: string, encryptedPrivkey: string): void {
  validateSecureContext();

  try {
    localStorage.setItem(STORAGE_KEYS.PUBKEY, pubkey);
    localStorage.setItem(STORAGE_KEYS.ENCRYPTED_PRIVKEY, encryptedPrivkey);
  } catch (error) {
    console.error('Failed to save keys to localStorage:', error);
    throw new Error('Failed to save keys. localStorage may be disabled.');
  }
}

/**
 * Loads Nostr keys from localStorage
 */
export function loadKeys(): StoredKeys | null {
  if (typeof window === 'undefined') {
    return null; // SSR context
  }

  validateSecureContext();

  try {
    const pubkey = localStorage.getItem(STORAGE_KEYS.PUBKEY);
    const encryptedPrivkey = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_PRIVKEY);

    if (!pubkey || !encryptedPrivkey) {
      return null;
    }

    return { pubkey, encryptedPrivkey };
  } catch (error) {
    console.error('Failed to load keys from localStorage:', error);
    return null;
  }
}

/**
 * Clears all stored keys from localStorage
 */
export function clearKeys(): void {
  if (typeof window === 'undefined') {
    return; // SSR context
  }

  try {
    localStorage.removeItem(STORAGE_KEYS.PUBKEY);
    localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_PRIVKEY);
    localStorage.removeItem(STORAGE_KEYS.MNEMONIC_SHOWN);
  } catch (error) {
    console.error('Failed to clear keys from localStorage:', error);
  }
}

/**
 * Marks that the user has been shown their mnemonic
 */
export function setMnemonicShown(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.MNEMONIC_SHOWN, 'true');
  } catch (error) {
    console.error('Failed to set mnemonic shown flag:', error);
  }
}

/**
 * Checks if the user has been shown their mnemonic
 */
export function hasMnemonicBeenShown(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return localStorage.getItem(STORAGE_KEYS.MNEMONIC_SHOWN) === 'true';
  } catch (error) {
    console.error('Failed to check mnemonic shown flag:', error);
    return false;
  }
}

/**
 * Checks if keys exist in storage
 */
export function hasStoredKeys(): boolean {
  return loadKeys() !== null;
}

/**
 * Gets just the public key from storage
 */
export function getStoredPubkey(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(STORAGE_KEYS.PUBKEY);
  } catch (error) {
    console.error('Failed to get pubkey from localStorage:', error);
    return null;
  }
}
