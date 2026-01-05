/**
 * NIP-98: HTTP Auth
 *
 * Ported from JSS (JavaScriptSolidServer) auth/nostr.js
 * https://github.com/JavaScriptSolidServer/JavaScriptSolidServer
 *
 * Implements HTTP authentication using Schnorr signatures:
 * - Authorization header format: "Nostr <base64-encoded-event>"
 * - Also supports "Basic <base64(nostr:token)>" for git clients
 *
 * The event must be kind 27235 with:
 * - 'u' tag: URL being accessed
 * - 'method' tag: HTTP method (or '*' for wildcard)
 * - 'payload' tag (optional): SHA-256 hash of request body
 */

import crypto from 'crypto';
import { schnorr } from '@noble/curves/secp256k1';

// NIP-98 event kind (references RFC 7235)
const HTTP_AUTH_KIND = 27235;

// Timestamp tolerance in seconds
const TIMESTAMP_TOLERANCE = 60;

// Maximum size for Nostr event (64KB)
const MAX_NOSTR_EVENT_SIZE = 64 * 1024;

interface Nip98Event {
  id?: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

interface HttpRequest {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  body?: string | Buffer | object;
  protocol?: string;
  hostname?: string;
}

interface AuthResult {
  pubkey: string | null;
  didNostr: string | null;
  error: string | null;
}

/**
 * Check if request has Nostr authentication
 * Supports both "Nostr <token>" and "Basic <base64(nostr:token)>" formats
 */
export function hasNostrAuth(headers: Record<string, string | string[] | undefined>): boolean {
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader) return false;

  const auth = Array.isArray(authHeader) ? authHeader[0] : authHeader;

  // Direct Nostr header
  if (auth.startsWith('Nostr ')) return true;

  // Basic auth with username=nostr (for git clients)
  if (auth.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
      return decoded.startsWith('nostr:');
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Extract token from Nostr authorization header
 */
export function extractNostrToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  // Direct Nostr header
  if (authHeader.startsWith('Nostr ')) {
    return authHeader.slice(6).trim();
  }

  // Basic auth with username=nostr, password=token
  if (authHeader.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
      if (decoded.startsWith('nostr:')) {
        return decoded.slice(6); // Remove "nostr:" prefix
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Decode NIP-98 event from base64 token
 */
function decodeEvent(token: string): Nip98Event | null {
  try {
    if (token.length > MAX_NOSTR_EVENT_SIZE) {
      return null;
    }
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    if (decoded.length > MAX_NOSTR_EVENT_SIZE) {
      return null;
    }
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Get tag value from event
 */
function getTagValue(event: Nip98Event, tagName: string): string | null {
  if (!event.tags || !Array.isArray(event.tags)) {
    return null;
  }
  const tag = event.tags.find(t => Array.isArray(t) && t[0] === tagName);
  return tag ? tag[1] : null;
}

/**
 * Convert Nostr pubkey to did:nostr URI
 */
export function pubkeyToDidNostr(pubkey: string): string {
  return `did:nostr:${pubkey.toLowerCase()}`;
}

/**
 * Verify event signature using Schnorr
 */
async function verifySignature(event: Nip98Event): Promise<boolean> {
  try {
    const messageHash = hexToBytes(event.id!);
    const signature = hexToBytes(event.sig);
    const publicKey = hexToBytes(event.pubkey);
    return schnorr.verify(signature, messageHash, publicKey);
  } catch {
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Verify NIP-98 authentication and return pubkey
 */
export async function verifyNostrAuth(request: HttpRequest): Promise<AuthResult> {
  const authHeader = request.headers.authorization || request.headers.Authorization;
  const token = extractNostrToken(Array.isArray(authHeader) ? authHeader[0] : authHeader);

  if (!token) {
    return { pubkey: null, didNostr: null, error: 'Missing Nostr token' };
  }

  // Decode the event
  const event = decodeEvent(token);
  if (!event) {
    return { pubkey: null, didNostr: null, error: 'Invalid token format: could not decode base64 JSON' };
  }

  // Validate event kind (must be 27235)
  if (event.kind !== HTTP_AUTH_KIND) {
    return { pubkey: null, didNostr: null, error: `Invalid event kind: expected ${HTTP_AUTH_KIND}, got ${event.kind}` };
  }

  // Validate timestamp (within ±60 seconds)
  const now = Math.floor(Date.now() / 1000);
  if (!event.created_at || Math.abs(now - event.created_at) > TIMESTAMP_TOLERANCE) {
    return { pubkey: null, didNostr: null, error: 'Event timestamp outside acceptable window (±60s)' };
  }

  // Build full URL for validation
  const protocol = request.protocol || 'http';
  const host = request.headers.host || request.hostname;
  const fullUrl = `${protocol}://${host}${request.url}`;

  // Validate URL tag matches request URL
  const eventUrl = getTagValue(event, 'u');
  if (!eventUrl) {
    return { pubkey: null, didNostr: null, error: 'Missing URL tag in event' };
  }

  // Compare URLs (normalize by removing trailing slashes)
  const normalizedEventUrl = eventUrl.replace(/\/$/, '');
  const normalizedRequestUrl = fullUrl.replace(/\/$/, '');
  const normalizedRequestUrlNoQuery = fullUrl.split('?')[0].replace(/\/$/, '');

  let urlMatches = normalizedEventUrl === normalizedRequestUrl ||
                   normalizedEventUrl === normalizedRequestUrlNoQuery;

  // Allow prefix matching for git clients
  if (!urlMatches && normalizedRequestUrlNoQuery.startsWith(normalizedEventUrl + '/')) {
    urlMatches = true;
  }

  if (!urlMatches) {
    return { pubkey: null, didNostr: null, error: `URL mismatch: event URL "${eventUrl}" does not match request URL "${fullUrl}"` };
  }

  // Validate method tag matches request method
  const eventMethod = getTagValue(event, 'method');
  if (eventMethod && eventMethod !== '*' && eventMethod.toUpperCase() !== request.method.toUpperCase()) {
    return { pubkey: null, didNostr: null, error: `Method mismatch: expected ${request.method}, got ${eventMethod}` };
  }

  // Validate payload hash if present and request has body
  const payloadTag = getTagValue(event, 'payload');
  if (payloadTag && request.body) {
    let bodyString: string;
    if (typeof request.body === 'string') {
      bodyString = request.body;
    } else if (Buffer.isBuffer(request.body)) {
      bodyString = request.body.toString();
    } else {
      bodyString = JSON.stringify(request.body);
    }

    const expectedHash = crypto.createHash('sha256').update(bodyString).digest('hex');
    if (payloadTag.toLowerCase() !== expectedHash.toLowerCase()) {
      return { pubkey: null, didNostr: null, error: 'Payload hash mismatch' };
    }
  }

  // Validate pubkey exists
  if (!event.pubkey || typeof event.pubkey !== 'string' || event.pubkey.length !== 64) {
    return { pubkey: null, didNostr: null, error: 'Invalid or missing pubkey' };
  }

  // Compute event id if missing (lenient mode)
  if (!event.id) {
    const serialized = JSON.stringify([
      0,
      event.pubkey,
      event.created_at,
      event.kind,
      event.tags,
      event.content
    ]);
    event.id = crypto.createHash('sha256').update(serialized).digest('hex');
  }

  // Verify Schnorr signature
  const isValid = await verifySignature(event);
  if (!isValid) {
    return { pubkey: null, didNostr: null, error: 'Invalid Schnorr signature' };
  }

  const didNostr = pubkeyToDidNostr(event.pubkey);
  return { pubkey: event.pubkey, didNostr, error: null };
}

/**
 * Create NIP-98 auth middleware for HTTP endpoints
 */
export function createNip98Middleware() {
  return async (req: HttpRequest): Promise<AuthResult> => {
    if (!hasNostrAuth(req.headers)) {
      return { pubkey: null, didNostr: null, error: null }; // No auth attempted
    }
    return verifyNostrAuth(req);
  };
}
