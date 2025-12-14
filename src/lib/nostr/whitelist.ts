/**
 * Whitelist verification service
 *
 * Verifies user status against the relay's API endpoints.
 * This is the SOURCE OF TRUTH for admin/cohort permissions.
 *
 * The client-side VITE_ADMIN_PUBKEY check is for UI/UX only.
 * All privileged actions MUST be verified via this service.
 */

import { browser } from '$app/environment';

export type CohortName = 'admin' | 'approved' | 'business' | 'moomaa-tribe';

export interface WhitelistEntry {
  pubkey: string;
  cohorts: CohortName[];
  addedAt: number;
  addedBy: string;
  expiresAt: number | null;
  notes: string | null;
}

export interface WhitelistStatus {
  isWhitelisted: boolean;
  isAdmin: boolean;
  cohorts: CohortName[];
  verifiedAt: number;
  source: 'relay' | 'cache' | 'fallback';
}

// Cache whitelist status to avoid repeated queries
const statusCache = new Map<string, { status: WhitelistStatus; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Get relay URL from environment
const RELAY_URL = import.meta.env.VITE_RELAY_URL || 'wss://nosflare.solitary-paper-764d.workers.dev';

/**
 * Convert WebSocket URL to HTTP URL for API calls
 */
function getRelayHttpUrl(): string {
  return RELAY_URL.replace('wss://', 'https://').replace('ws://', 'http://');
}

/**
 * Verify a user's whitelist status via the relay API
 *
 * This calls the relay's /api/check-whitelist endpoint
 * to confirm the user's actual permissions.
 *
 * @param pubkey - User's public key (hex format)
 * @returns WhitelistStatus with verified permissions
 */
export async function verifyWhitelistStatus(pubkey: string): Promise<WhitelistStatus> {
  if (!browser || !pubkey) {
    return createFallbackStatus(pubkey);
  }

  // Check cache first
  const cached = statusCache.get(pubkey);
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.status, source: 'cache' };
  }

  try {
    // Call relay API endpoint directly
    const httpUrl = getRelayHttpUrl();
    const response = await fetch(`${httpUrl}/api/check-whitelist?pubkey=${pubkey}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const status: WhitelistStatus = {
        isWhitelisted: data.isWhitelisted ?? false,
        isAdmin: data.isAdmin ?? false,
        cohorts: data.cohorts ?? [],
        verifiedAt: data.verifiedAt ?? Date.now(),
        source: 'relay'
      };
      cacheStatus(pubkey, status);
      return status;
    }

    // If API call fails, fall back to client-side check
    console.warn('[Whitelist] API call failed, using fallback');
    const fallback = createFallbackStatus(pubkey);
    cacheStatus(pubkey, fallback);
    return fallback;

  } catch (error) {
    console.warn('[Whitelist] Verification failed, using fallback:', error);
    return createFallbackStatus(pubkey);
  }
}

/**
 * Create fallback status using client-side admin check
 */
function createFallbackStatus(pubkey: string): WhitelistStatus {
  const adminPubkeys = (import.meta.env.VITE_ADMIN_PUBKEY || '')
    .split(',')
    .map((k: string) => k.trim())
    .filter(Boolean);

  const isAdmin = adminPubkeys.includes(pubkey);

  return {
    isWhitelisted: isAdmin, // Assume admin is whitelisted
    isAdmin,
    cohorts: isAdmin ? ['admin'] : [],
    verifiedAt: Date.now(),
    source: 'fallback'
  };
}

/**
 * Cache a whitelist status
 */
function cacheStatus(pubkey: string, status: WhitelistStatus): void {
  statusCache.set(pubkey, {
    status,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

/**
 * Clear cached status for a user (e.g., after logout)
 */
export function clearWhitelistCache(pubkey?: string): void {
  if (pubkey) {
    statusCache.delete(pubkey);
  } else {
    statusCache.clear();
  }
}

/**
 * Check if current user has admin privileges
 * This is the AUTHORITATIVE check - use this instead of client-side isAdmin
 */
export async function verifyAdminStatus(pubkey: string): Promise<boolean> {
  const status = await verifyWhitelistStatus(pubkey);
  return status.isAdmin;
}

/**
 * Check if current user belongs to a specific cohort
 */
export async function verifyCohortMembership(pubkey: string, cohort: CohortName): Promise<boolean> {
  const status = await verifyWhitelistStatus(pubkey);
  return status.cohorts.includes(cohort);
}

/**
 * Get all cohorts for a user
 */
export async function getUserCohorts(pubkey: string): Promise<CohortName[]> {
  const status = await verifyWhitelistStatus(pubkey);
  return status.cohorts;
}

/**
 * Quick check if user is approved (whitelisted or admin)
 * Used by auth flows to determine if pending approval is needed
 */
export async function checkWhitelistStatus(pubkey: string): Promise<{ isApproved: boolean; isAdmin: boolean }> {
  const status = await verifyWhitelistStatus(pubkey);
  return {
    isApproved: status.isWhitelisted,
    isAdmin: status.isAdmin
  };
}
