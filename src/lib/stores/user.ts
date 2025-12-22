import { derived, writable, type Readable, type Writable } from 'svelte/store';
import { authStore } from './auth';
import { verifyWhitelistStatus, type CohortName, type WhitelistStatus } from '$lib/nostr/whitelist';
import { browser } from '$app/environment';
import { profileCache } from './profiles';

/**
 * User cohort types
 */
export type CohortType = 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate' | 'faculty' | 'staff' | 'alumni';

/**
 * Relay-verified whitelist status store
 * This is the SOURCE OF TRUTH for admin/cohort permissions
 */
export const whitelistStatusStore: Writable<WhitelistStatus | null> = writable(null);

/**
 * User profile interface
 */
export interface UserProfile {
  pubkey: string;
  name: string | null;
  displayName: string | null;
  avatar: string | null;
  about: string | null;
  cohorts: CohortType[];
  isAdmin: boolean;
  isApproved: boolean;
  nip05: string | null;
  lud16: string | null; // Lightning address
  website: string | null;
  banner: string | null;
  birthday: string | null; // Optional birthday in YYYY-MM-DD format
  createdAt: number | null;
  updatedAt: number | null;
}

/**
 * User store state
 */
export interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Creates a default user profile from pubkey
 */
function createDefaultProfile(pubkey: string): UserProfile {
  return {
    pubkey,
    name: null,
    displayName: null,
    avatar: null,
    about: null,
    cohorts: [],
    isAdmin: false,
    isApproved: false,
    nip05: null,
    lud16: null,
    website: null,
    banner: null,
    birthday: null,
    createdAt: null,
    updatedAt: null
  };
}

/**
 * User store derived from auth store
 * Automatically updates when authentication state changes
 */
export const userStore: Readable<UserState> = derived(
  authStore,
  ($auth, set: (value: UserState) => void) => {
    // If not authenticated, clear user
    if ($auth.state !== 'authenticated' || !$auth.pubkey) {
      set({
        profile: null,
        isLoading: false,
        error: null
      });
      return;
    }

    // Create initial profile from pubkey
    const initialProfile = createDefaultProfile($auth.pubkey);

    set({
      profile: initialProfile,
      isLoading: true,
      error: null
    });

    // Load profile metadata and verify whitelist status from relay
    const loadProfile = async () => {
      if (!browser || !$auth.pubkey) {
        set({
          profile: initialProfile,
          isLoading: false,
          error: null
        });
        return;
      }

      // ALWAYS verify whitelist status first - this MUST succeed for admin access
      // Do this independently of profile fetch so errors don't block admin verification
      let whitelistStatus: WhitelistStatus;
      try {
        whitelistStatus = await verifyWhitelistStatus($auth.pubkey);
        whitelistStatusStore.set(whitelistStatus);
        console.log('[User] Whitelist status verified:', {
          pubkey: $auth.pubkey.slice(0, 8) + '...',
          isAdmin: whitelistStatus.isAdmin,
          source: whitelistStatus.source
        });
      } catch (whitelistError) {
        console.warn('[User] Whitelist verification failed:', whitelistError);
        // Create fallback status directly
        whitelistStatus = {
          isWhitelisted: false,
          isAdmin: false,
          cohorts: [],
          verifiedAt: Date.now(),
          source: 'fallback'
        };
        whitelistStatusStore.set(whitelistStatus);
      }

      // Map cohorts from whitelist status
      const cohorts: CohortType[] = whitelistStatus.cohorts.map((cohortName): CohortType => {
        const mapping: Record<string, CohortType> = {
          freshman: 'freshman',
          sophomore: 'sophomore',
          junior: 'junior',
          senior: 'senior',
          graduate: 'graduate',
          faculty: 'faculty',
          staff: 'staff',
          alumni: 'alumni'
        };
        return mapping[cohortName] || 'freshman';
      });

      // Now try to fetch profile data - this can fail without affecting admin status
      let cachedProfile = null;
      try {
        cachedProfile = await profileCache.getProfile($auth.pubkey);
      } catch (profileError) {
        console.warn('[User] Profile fetch failed (non-fatal):', profileError);
      }

      // Merge profile data with whitelist status
      const verifiedProfile: UserProfile = {
        ...initialProfile,
        name: cachedProfile?.profile?.name ?? null,
        displayName: cachedProfile?.displayName ?? null,
        avatar: cachedProfile?.avatar ?? null,
        about: cachedProfile?.about ?? null,
        nip05: cachedProfile?.nip05 ?? null,
        lud16: cachedProfile?.profile?.lud16 ?? null,
        website: cachedProfile?.profile?.website ?? null,
        banner: cachedProfile?.profile?.banner ?? null,
        birthday: (cachedProfile?.profile as any)?.birthday ?? null,
        isAdmin: whitelistStatus.isAdmin,
        isApproved: whitelistStatus.isWhitelisted,
        cohorts,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      set({
        profile: verifiedProfile,
        isLoading: false,
        error: null
      });

      if (import.meta.env.DEV && $auth.pubkey) {
        console.log('[User] Profile loaded from Nostr:', {
          pubkey: $auth.pubkey.slice(0, 8) + '...',
          displayName: verifiedProfile.displayName,
          isAdmin: whitelistStatus.isAdmin,
          cohorts: cohorts,
          source: whitelistStatus.source
        });
      }
    };

    loadProfile();
  },
  {
    profile: null,
    isLoading: false,
    error: null
  }
);

/**
 * Derived store for checking if current user is authenticated
 */
export const isAuthenticated: Readable<boolean> = derived(
  authStore,
  $auth => $auth.state === 'authenticated' && $auth.pubkey !== null
);

/**
 * Derived store for checking if current user is admin
 * Uses client-side check (VITE_ADMIN_PUBKEY) for fast UI updates
 */
export const isAdmin: Readable<boolean> = derived(
  userStore,
  $user => $user.profile?.isAdmin ?? false
);

/**
 * Derived store for RELAY-VERIFIED admin status
 * This is the authoritative check - use for privileged operations
 */
export const isAdminVerified: Readable<boolean> = derived(
  whitelistStatusStore,
  $status => $status?.isAdmin ?? false
);

/**
 * Derived store for whitelist verification source
 * Useful for debugging - shows if status came from relay, cache, or fallback
 */
export const whitelistSource: Readable<'relay' | 'cache' | 'fallback' | null> = derived(
  whitelistStatusStore,
  $status => $status?.source ?? null
);

/**
 * Derived store for checking if current user is approved
 */
export const isApproved: Readable<boolean> = derived(
  userStore,
  $user => $user.profile?.isApproved ?? false
);

/**
 * Derived store for current user's pubkey
 */
export const currentPubkey: Readable<string | null> = derived(
  authStore,
  $auth => $auth.pubkey
);

/**
 * Derived store for current user's cohorts
 */
export const currentCohorts: Readable<CohortType[]> = derived(
  userStore,
  $user => $user.profile?.cohorts ?? []
);

/**
 * Derived store for current user's display name
 */
export const currentDisplayName: Readable<string | null> = derived(
  userStore,
  $user => $user.profile?.displayName ?? $user.profile?.name ?? null
);
