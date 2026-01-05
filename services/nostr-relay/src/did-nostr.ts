/**
 * did:nostr Identity Resolution
 *
 * Ported from JSS (JavaScriptSolidServer) auth/did-nostr.js
 * https://github.com/JavaScriptSolidServer/JavaScriptSolidServer
 *
 * Resolves did:nostr identifiers to profile information.
 * A did:nostr is simply: did:nostr:<64-char-hex-pubkey>
 *
 * Can optionally resolve to a linked WebID if the pubkey has
 * an alsoKnownAs pointing to a WebID and the WebID links back
 * to the did:nostr (bidirectional verification).
 */

export interface DidNostrDocument {
  id: string;
  pubkey: string;
  profile?: {
    name?: string;
    displayName?: string;
    about?: string;
    picture?: string;
    nip05?: string;
    lud16?: string;
    website?: string;
  };
  alsoKnownAs?: string[];
  relays?: string[];
  created_at?: number;
}

/**
 * Parse a did:nostr URI
 * @returns pubkey or null if invalid
 */
export function parseDidNostr(did: string): string | null {
  if (!did || !did.startsWith('did:nostr:')) {
    return null;
  }

  const pubkey = did.slice(10); // Remove 'did:nostr:' prefix

  // Validate it's a 64-char hex string
  if (pubkey.length !== 64 || !/^[0-9a-f]+$/i.test(pubkey)) {
    return null;
  }

  return pubkey.toLowerCase();
}

/**
 * Convert a pubkey to did:nostr format
 */
export function pubkeyToDidNostr(pubkey: string): string {
  return `did:nostr:${pubkey.toLowerCase()}`;
}

/**
 * Check if a string is a valid did:nostr
 */
export function isValidDidNostr(did: string): boolean {
  return parseDidNostr(did) !== null;
}

/**
 * Create a basic DID document for a pubkey
 * This is the minimal document without profile data
 */
export function createBasicDidDocument(pubkey: string): DidNostrDocument {
  return {
    id: pubkeyToDidNostr(pubkey),
    pubkey: pubkey.toLowerCase(),
  };
}

/**
 * Query relays for profile (kind 0) event
 * This is a simplified implementation - in production you'd query actual relays
 */
export async function fetchProfile(
  pubkey: string,
  relayUrls: string[] = []
): Promise<DidNostrDocument | null> {
  // For now, return basic document
  // In production, this would query relays for kind 0 events
  const doc = createBasicDidDocument(pubkey);

  if (relayUrls.length > 0) {
    doc.relays = relayUrls;
  }

  return doc;
}

/**
 * Extract alsoKnownAs URIs from a profile event
 * These may include WebIDs that the pubkey claims identity with
 */
export function extractAlsoKnownAs(profileContent: string): string[] {
  try {
    const profile = JSON.parse(profileContent);

    // Check for alsoKnownAs array (proposed extension)
    if (Array.isArray(profile.alsoKnownAs)) {
      return profile.alsoKnownAs.filter((uri: unknown) => typeof uri === 'string');
    }

    // Check for single website that might be a WebID
    if (profile.website && typeof profile.website === 'string') {
      // Only include if it looks like a potential WebID (ends with #me or /profile)
      if (profile.website.includes('#') || profile.website.endsWith('/profile')) {
        return [profile.website];
      }
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Verify bidirectional linking between did:nostr and WebID
 *
 * For a valid link:
 * 1. The Nostr profile must have alsoKnownAs pointing to WebID
 * 2. The WebID document must link back to did:nostr
 *
 * This is a placeholder - actual implementation requires:
 * - Querying relays for kind 0 events
 * - Fetching WebID documents
 * - Parsing RDF/Turtle to verify links
 */
export async function verifyBidirectionalLink(
  pubkey: string,
  webId: string
): Promise<boolean> {
  // Placeholder for bidirectional verification
  // In production:
  // 1. Query relays for kind 0 event from pubkey
  // 2. Check if profile.alsoKnownAs includes webId
  // 3. Fetch webId document
  // 4. Check if webId.alsoKnownAs includes did:nostr:pubkey
  return false;
}

/**
 * Resolve did:nostr to a WebID if bidirectionally linked
 * Returns null if no valid link exists
 */
export async function resolveDidNostrToWebId(
  pubkey: string
): Promise<string | null> {
  // Placeholder - in production would:
  // 1. Fetch profile from relays
  // 2. Extract alsoKnownAs
  // 3. Verify bidirectional links
  // 4. Return first valid WebID

  return null;
}

/**
 * Get the DID document for a pubkey
 * Optionally enriched with profile data from relays
 */
export async function resolveDidNostr(
  pubkeyOrDid: string,
  options: {
    relayUrls?: string[];
    includeProfile?: boolean;
  } = {}
): Promise<DidNostrDocument | null> {
  // Parse if it's a full did:nostr URI
  const pubkey = pubkeyOrDid.startsWith('did:nostr:')
    ? parseDidNostr(pubkeyOrDid)
    : pubkeyOrDid;

  if (!pubkey || pubkey.length !== 64) {
    return null;
  }

  const doc = createBasicDidDocument(pubkey);

  if (options.relayUrls) {
    doc.relays = options.relayUrls;
  }

  // If profile enrichment requested, fetch from relays
  if (options.includeProfile && options.relayUrls?.length) {
    const enriched = await fetchProfile(pubkey, options.relayUrls);
    if (enriched) {
      return enriched;
    }
  }

  return doc;
}
