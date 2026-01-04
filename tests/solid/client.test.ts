/**
 * Unit Tests for Solid Pod Client
 * Tests for NIP-98 auth, request methods, and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSecretKey, getPublicKey, verifyEvent } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';
import {
  SolidClient,
  createSolidClient,
  createSolidIdentity,
  createNip98AuthEvent,
  encodeNip98Auth,
  createAuthorizationHeader,
  getSolidServerUrl,
  getDefaultClient,
  setDefaultClient,
} from '$lib/solid/client';
import { SolidError, SolidErrorType } from '$lib/solid/types';
import type { SolidIdentity, Nip98AuthOptions } from '$lib/solid/types';

// Generate test keys
function createTestIdentity(): SolidIdentity {
  const privateKey = generateSecretKey();
  const pubkey = getPublicKey(privateKey);
  const privateKeyHex = bytesToHex(privateKey);

  return createSolidIdentity(pubkey, privateKeyHex);
}

describe('createSolidIdentity', () => {
  it('should create identity with correct structure', () => {
    const privateKey = generateSecretKey();
    const pubkey = getPublicKey(privateKey);
    const privateKeyHex = bytesToHex(privateKey);

    const identity = createSolidIdentity(pubkey, privateKeyHex);

    expect(identity.pubkey).toBe(pubkey);
    expect(identity.privateKey).toBe(privateKeyHex);
    expect(identity.npub).toMatch(/^npub1/);
  });

  it('should generate valid npub from pubkey', () => {
    const identity = createTestIdentity();

    expect(identity.npub.startsWith('npub1')).toBe(true);
    expect(identity.npub.length).toBe(63); // npub1 + 58 chars
  });
});

describe('createNip98AuthEvent', () => {
  let identity: SolidIdentity;

  beforeEach(() => {
    identity = createTestIdentity();
  });

  it('should create event with correct kind', () => {
    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/',
      method: 'GET',
    };

    const event = createNip98AuthEvent(identity, options);

    expect(event.kind).toBe(27235);
  });

  it('should include URL tag', () => {
    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/files/',
      method: 'GET',
    };

    const event = createNip98AuthEvent(identity, options);

    const urlTag = event.tags.find(t => t[0] === 'u');
    expect(urlTag).toBeDefined();
    expect(urlTag?.[1]).toBe('https://solid.example.com/alice/files/');
  });

  it('should include method tag', () => {
    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/',
      method: 'POST',
    };

    const event = createNip98AuthEvent(identity, options);

    const methodTag = event.tags.find(t => t[0] === 'method');
    expect(methodTag).toBeDefined();
    expect(methodTag?.[1]).toBe('POST');
  });

  it('should include payload tag for POST requests with payload', () => {
    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/data.json',
      method: 'POST',
      payload: 'abc123def456',
    };

    const event = createNip98AuthEvent(identity, options);

    const payloadTag = event.tags.find(t => t[0] === 'payload');
    expect(payloadTag).toBeDefined();
    expect(payloadTag?.[1]).toBe('abc123def456');
  });

  it('should include payload tag for PUT requests', () => {
    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/file.txt',
      method: 'PUT',
      payload: 'file-hash-123',
    };

    const event = createNip98AuthEvent(identity, options);

    const payloadTag = event.tags.find(t => t[0] === 'payload');
    expect(payloadTag).toBeDefined();
  });

  it('should include payload tag for PATCH requests', () => {
    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/file.txt',
      method: 'PATCH',
      payload: 'patch-hash-456',
    };

    const event = createNip98AuthEvent(identity, options);

    const payloadTag = event.tags.find(t => t[0] === 'payload');
    expect(payloadTag).toBeDefined();
  });

  it('should NOT include payload tag for GET requests', () => {
    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/',
      method: 'GET',
      payload: 'should-be-ignored', // GET shouldn't have payload
    };

    const event = createNip98AuthEvent(identity, options);

    const payloadTag = event.tags.find(t => t[0] === 'payload');
    expect(payloadTag).toBeUndefined();
  });

  it('should NOT include payload tag for DELETE requests', () => {
    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/file.txt',
      method: 'DELETE',
      payload: 'should-be-ignored',
    };

    const event = createNip98AuthEvent(identity, options);

    const payloadTag = event.tags.find(t => t[0] === 'payload');
    expect(payloadTag).toBeUndefined();
  });

  it('should have empty content', () => {
    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/',
      method: 'GET',
    };

    const event = createNip98AuthEvent(identity, options);

    expect(event.content).toBe('');
  });

  it('should have valid created_at timestamp', () => {
    const before = Math.floor(Date.now() / 1000);

    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/',
      method: 'GET',
    };

    const event = createNip98AuthEvent(identity, options);
    const after = Math.floor(Date.now() / 1000);

    expect(event.created_at).toBeGreaterThanOrEqual(before);
    expect(event.created_at).toBeLessThanOrEqual(after);
  });

  it('should have correct pubkey', () => {
    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/',
      method: 'GET',
    };

    const event = createNip98AuthEvent(identity, options);

    expect(event.pubkey).toBe(identity.pubkey);
  });

  it('should have valid signature', () => {
    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/',
      method: 'GET',
    };

    const event = createNip98AuthEvent(identity, options);

    expect(event.sig).toBeDefined();
    expect(event.sig.length).toBe(128); // 64 bytes = 128 hex chars

    // Verify the signature is valid
    const isValid = verifyEvent(event);
    expect(isValid).toBe(true);
  });

  it('should have valid event id', () => {
    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/',
      method: 'GET',
    };

    const event = createNip98AuthEvent(identity, options);

    expect(event.id).toBeDefined();
    expect(event.id.length).toBe(64); // 32 bytes = 64 hex chars
  });
});

describe('encodeNip98Auth', () => {
  it('should encode event to base64', () => {
    const identity = createTestIdentity();
    const event = createNip98AuthEvent(identity, {
      url: 'https://solid.example.com/alice/',
      method: 'GET',
    });

    const encoded = encodeNip98Auth(event);

    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);

    // Should be valid base64
    expect(() => {
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
      JSON.parse(decoded);
    }).not.toThrow();
  });

  it('should round-trip encode/decode correctly', () => {
    const identity = createTestIdentity();
    const event = createNip98AuthEvent(identity, {
      url: 'https://solid.example.com/alice/files/',
      method: 'POST',
      payload: 'test-hash',
    });

    const encoded = encodeNip98Auth(event);
    const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));

    expect(decoded.kind).toBe(event.kind);
    expect(decoded.pubkey).toBe(event.pubkey);
    expect(decoded.id).toBe(event.id);
    expect(decoded.sig).toBe(event.sig);
    expect(decoded.tags).toEqual(event.tags);
  });
});

describe('createAuthorizationHeader', () => {
  it('should create header with Nostr scheme', () => {
    const identity = createTestIdentity();
    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/',
      method: 'GET',
    };

    const header = createAuthorizationHeader(identity, options);

    expect(header.startsWith('Nostr ')).toBe(true);
  });

  it('should contain base64-encoded event after scheme', () => {
    const identity = createTestIdentity();
    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/',
      method: 'GET',
    };

    const header = createAuthorizationHeader(identity, options);
    const base64Part = header.replace('Nostr ', '');

    // Should be valid base64
    const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
    const event = JSON.parse(decoded);

    expect(event.kind).toBe(27235);
    expect(event.pubkey).toBe(identity.pubkey);
  });
});

describe('SolidClient', () => {
  describe('constructor', () => {
    it('should use default server URL when not provided', () => {
      const client = new SolidClient();

      expect(client.serverUrl).toBe('http://solid-server:3030');
    });

    it('should use provided server URL', () => {
      const client = new SolidClient({
        serverUrl: 'https://my-solid.example.com',
      });

      expect(client.serverUrl).toBe('https://my-solid.example.com');
    });

    it('should accept custom config options', () => {
      const client = new SolidClient({
        serverUrl: 'https://solid.example.com',
        timeout: 60000,
        maxRetries: 5,
        retryDelay: 2000,
      });

      expect(client.serverUrl).toBe('https://solid.example.com');
    });
  });

  describe('buildUrl', () => {
    it('should build URL with leading slash in path', () => {
      const client = new SolidClient({ serverUrl: 'https://solid.example.com' });

      const url = client.buildUrl('/alice/files/image.png');

      expect(url).toBe('https://solid.example.com/alice/files/image.png');
    });

    it('should build URL without leading slash in path', () => {
      const client = new SolidClient({ serverUrl: 'https://solid.example.com' });

      const url = client.buildUrl('alice/files/image.png');

      expect(url).toBe('https://solid.example.com/alice/files/image.png');
    });

    it('should handle trailing slash in server URL', () => {
      const client = new SolidClient({ serverUrl: 'https://solid.example.com/' });

      const url = client.buildUrl('/alice/');

      expect(url).toBe('https://solid.example.com/alice/');
      expect(url).not.toContain('//alice');
    });
  });

  describe('mapStatusToErrorType', () => {
    it('should map 401 to AUTH_ERROR', () => {
      expect(SolidClient.mapStatusToErrorType(401)).toBe(SolidErrorType.AUTH_ERROR);
    });

    it('should map 403 to FORBIDDEN', () => {
      expect(SolidClient.mapStatusToErrorType(403)).toBe(SolidErrorType.FORBIDDEN);
    });

    it('should map 404 to NOT_FOUND', () => {
      expect(SolidClient.mapStatusToErrorType(404)).toBe(SolidErrorType.NOT_FOUND);
    });

    it('should map 409 to CONFLICT', () => {
      expect(SolidClient.mapStatusToErrorType(409)).toBe(SolidErrorType.CONFLICT);
    });

    it('should map 400 to INVALID_REQUEST', () => {
      expect(SolidClient.mapStatusToErrorType(400)).toBe(SolidErrorType.INVALID_REQUEST);
    });

    it('should map 422 to INVALID_REQUEST', () => {
      expect(SolidClient.mapStatusToErrorType(422)).toBe(SolidErrorType.INVALID_REQUEST);
    });

    it('should map 5xx to SERVER_ERROR', () => {
      expect(SolidClient.mapStatusToErrorType(500)).toBe(SolidErrorType.SERVER_ERROR);
      expect(SolidClient.mapStatusToErrorType(502)).toBe(SolidErrorType.SERVER_ERROR);
      expect(SolidClient.mapStatusToErrorType(503)).toBe(SolidErrorType.SERVER_ERROR);
    });

    it('should map unknown status to UNKNOWN', () => {
      expect(SolidClient.mapStatusToErrorType(418)).toBe(SolidErrorType.UNKNOWN);
      expect(SolidClient.mapStatusToErrorType(200)).toBe(SolidErrorType.UNKNOWN);
    });
  });

  describe('throwForResponse', () => {
    it('should throw SolidError with correct type', () => {
      const response = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
      };

      expect(() => SolidClient.throwForResponse(response)).toThrow(SolidError);

      try {
        SolidClient.throwForResponse(response);
      } catch (error) {
        expect(error).toBeInstanceOf(SolidError);
        expect((error as SolidError).type).toBe(SolidErrorType.NOT_FOUND);
        expect((error as SolidError).status).toBe(404);
      }
    });

    it('should use custom message if provided', () => {
      const response = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Headers(),
      };

      try {
        SolidClient.throwForResponse(response, 'Access denied to resource');
      } catch (error) {
        expect((error as SolidError).message).toBe('Access denied to resource');
      }
    });

    it('should include response body in details', () => {
      const response = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        body: { error: 'Invalid JSON' },
      };

      try {
        SolidClient.throwForResponse(response);
      } catch (error) {
        expect((error as SolidError).details).toEqual({ error: 'Invalid JSON' });
      }
    });
  });
});

describe('createSolidClient', () => {
  it('should create client instance', () => {
    const client = createSolidClient({ serverUrl: 'https://solid.example.com' });

    expect(client).toBeInstanceOf(SolidClient);
  });

  it('should accept empty config', () => {
    const client = createSolidClient();

    expect(client).toBeInstanceOf(SolidClient);
  });
});

describe('getDefaultClient and setDefaultClient', () => {
  it('should return same client instance on repeated calls', () => {
    const client1 = getDefaultClient();
    const client2 = getDefaultClient();

    expect(client1).toBe(client2);
  });

  it('should allow setting custom default client', () => {
    const customClient = new SolidClient({ serverUrl: 'https://custom.example.com' });

    setDefaultClient(customClient);
    const retrieved = getDefaultClient();

    expect(retrieved.serverUrl).toBe('https://custom.example.com');

    // Reset to default
    setDefaultClient(new SolidClient());
  });
});
