/**
 * Unit Tests for Solid Pod Operations
 * Tests for pod name derivation, URL building, and validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nip19, generateSecretKey, getPublicKey } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';
import {
  derivePodName,
  derivePodNameFromPubkey,
  buildWebId,
  buildPodUrl,
  isValidPodName,
} from '$lib/solid/pods';
import { SolidError, SolidErrorType } from '$lib/solid/types';

describe('derivePodName', () => {
  it('should derive pod name from valid npub', () => {
    // Generate a test key pair
    const privateKey = generateSecretKey();
    const pubkey = getPublicKey(privateKey);
    const npub = nip19.npubEncode(pubkey);

    const podName = derivePodName(npub);

    expect(podName).toBeDefined();
    expect(podName.length).toBe(24);
    expect(podName).toMatch(/^[a-z0-9]+$/);
  });

  it('should remove npub1 prefix', () => {
    const npub = 'npub1abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuv';

    const podName = derivePodName(npub);

    expect(podName).not.toContain('npub1');
    expect(podName.startsWith('abcdef')).toBe(true);
  });

  it('should truncate to 24 characters', () => {
    const privateKey = generateSecretKey();
    const pubkey = getPublicKey(privateKey);
    const npub = nip19.npubEncode(pubkey);

    const podName = derivePodName(npub);

    expect(podName.length).toBe(24);
  });

  it('should lowercase the result', () => {
    const privateKey = generateSecretKey();
    const pubkey = getPublicKey(privateKey);
    const npub = nip19.npubEncode(pubkey);

    const podName = derivePodName(npub);

    expect(podName).toBe(podName.toLowerCase());
  });

  it('should produce consistent results for same npub', () => {
    const npub = 'npub1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq58zp4e';

    const podName1 = derivePodName(npub);
    const podName2 = derivePodName(npub);

    expect(podName1).toBe(podName2);
  });

  it('should produce different results for different npubs', () => {
    const sk1 = generateSecretKey();
    const sk2 = generateSecretKey();
    const npub1 = nip19.npubEncode(getPublicKey(sk1));
    const npub2 = nip19.npubEncode(getPublicKey(sk2));

    const podName1 = derivePodName(npub1);
    const podName2 = derivePodName(npub2);

    expect(podName1).not.toBe(podName2);
  });

  it('should only contain alphanumeric characters', () => {
    const privateKey = generateSecretKey();
    const pubkey = getPublicKey(privateKey);
    const npub = nip19.npubEncode(pubkey);

    const podName = derivePodName(npub);

    // bech32 uses only lowercase letters and digits (no i, o, b, 1 to avoid confusion)
    expect(podName).toMatch(/^[a-z0-9]+$/);
  });
});

describe('derivePodNameFromPubkey', () => {
  it('should derive pod name from hex pubkey', () => {
    const privateKey = generateSecretKey();
    const pubkey = getPublicKey(privateKey);

    const podName = derivePodNameFromPubkey(pubkey);

    expect(podName).toBeDefined();
    expect(podName.length).toBe(24);
  });

  it('should produce same result as derivePodName with npub', () => {
    const privateKey = generateSecretKey();
    const pubkey = getPublicKey(privateKey);
    const npub = nip19.npubEncode(pubkey);

    const fromPubkey = derivePodNameFromPubkey(pubkey);
    const fromNpub = derivePodName(npub);

    expect(fromPubkey).toBe(fromNpub);
  });

  it('should work with uppercase hex pubkey', () => {
    const privateKey = generateSecretKey();
    const pubkey = getPublicKey(privateKey).toUpperCase();

    // Note: nostr-tools should handle case internally
    // This test verifies the integration works
    expect(() => derivePodNameFromPubkey(pubkey)).not.toThrow();
  });
});

describe('buildWebId', () => {
  it('should build correct WebID URL', () => {
    const serverUrl = 'https://solid.example.com';
    const podName = 'alice123';

    const webId = buildWebId(serverUrl, podName);

    expect(webId).toBe('https://solid.example.com/alice123/profile/card#me');
  });

  it('should handle trailing slash in server URL', () => {
    const serverUrl = 'https://solid.example.com/';
    const podName = 'bob456';

    const webId = buildWebId(serverUrl, podName);

    expect(webId).toBe('https://solid.example.com/bob456/profile/card#me');
    expect(webId).not.toContain('//bob');
  });

  it('should work with port in server URL', () => {
    const serverUrl = 'http://localhost:3030';
    const podName = 'testuser';

    const webId = buildWebId(serverUrl, podName);

    expect(webId).toBe('http://localhost:3030/testuser/profile/card#me');
  });

  it('should include fragment identifier #me', () => {
    const webId = buildWebId('https://solid.example.com', 'user');

    expect(webId).toContain('#me');
    expect(webId.endsWith('#me')).toBe(true);
  });
});

describe('buildPodUrl', () => {
  it('should build correct pod root URL', () => {
    const serverUrl = 'https://solid.example.com';
    const podName = 'alice123';

    const podUrl = buildPodUrl(serverUrl, podName);

    expect(podUrl).toBe('https://solid.example.com/alice123/');
  });

  it('should handle trailing slash in server URL', () => {
    const serverUrl = 'https://solid.example.com/';
    const podName = 'bob456';

    const podUrl = buildPodUrl(serverUrl, podName);

    expect(podUrl).toBe('https://solid.example.com/bob456/');
    expect(podUrl).not.toContain('//bob');
  });

  it('should always end with trailing slash', () => {
    const podUrl = buildPodUrl('https://solid.example.com', 'user');

    expect(podUrl.endsWith('/')).toBe(true);
  });

  it('should work with port in server URL', () => {
    const serverUrl = 'http://localhost:3030';
    const podName = 'testuser';

    const podUrl = buildPodUrl(serverUrl, podName);

    expect(podUrl).toBe('http://localhost:3030/testuser/');
  });
});

describe('isValidPodName', () => {
  it('should accept valid lowercase alphanumeric pod names', () => {
    expect(isValidPodName('alice')).toBe(true);
    expect(isValidPodName('bob123')).toBe(true);
    expect(isValidPodName('user-name')).toBe(true);
    expect(isValidPodName('test-pod-1')).toBe(true);
  });

  it('should reject empty string', () => {
    expect(isValidPodName('')).toBe(false);
  });

  it('should reject names longer than 32 characters', () => {
    const longName = 'a'.repeat(33);
    expect(isValidPodName(longName)).toBe(false);

    const exactLimit = 'a'.repeat(32);
    expect(isValidPodName(exactLimit)).toBe(true);
  });

  it('should reject names with uppercase characters', () => {
    expect(isValidPodName('Alice')).toBe(false);
    expect(isValidPodName('ALICE')).toBe(false);
    expect(isValidPodName('aLiCe')).toBe(false);
  });

  it('should reject names with special characters', () => {
    expect(isValidPodName('alice_bob')).toBe(false); // underscore
    expect(isValidPodName('alice.bob')).toBe(false); // dot
    expect(isValidPodName('alice@bob')).toBe(false); // at
    expect(isValidPodName('alice/bob')).toBe(false); // slash
    expect(isValidPodName('alice bob')).toBe(false); // space
  });

  it('should allow hyphens', () => {
    expect(isValidPodName('alice-bob')).toBe(true);
    expect(isValidPodName('my-pod-name')).toBe(true);
    expect(isValidPodName('a-b-c-d')).toBe(true);
  });

  it('should accept minimum length names', () => {
    expect(isValidPodName('a')).toBe(true);
    expect(isValidPodName('ab')).toBe(true);
  });
});

describe('Pod name derivation integration', () => {
  it('should produce valid pod names from any generated key', () => {
    // Generate 10 random keys and verify all produce valid pod names
    for (let i = 0; i < 10; i++) {
      const privateKey = generateSecretKey();
      const pubkey = getPublicKey(privateKey);

      const podName = derivePodNameFromPubkey(pubkey);

      expect(isValidPodName(podName)).toBe(true);
    }
  });

  it('should work end-to-end with generated keys', () => {
    const privateKey = generateSecretKey();
    const pubkey = getPublicKey(privateKey);
    const privateKeyHex = bytesToHex(privateKey);
    const npub = nip19.npubEncode(pubkey);

    const podName = derivePodName(npub);
    const webId = buildWebId('https://solid.example.com', podName);
    const podUrl = buildPodUrl('https://solid.example.com', podName);

    expect(isValidPodName(podName)).toBe(true);
    expect(webId).toContain(podName);
    expect(podUrl).toContain(podName);
    expect(webId.startsWith(podUrl.slice(0, -1))).toBe(true);
  });
});

describe('Known test vectors', () => {
  // Test with known npub for reproducibility
  const knownNpub = 'npub1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq58zp4e';

  it('should derive consistent pod name from known npub', () => {
    const podName = derivePodName(knownNpub);

    // The first 24 chars after 'npub1' should be 'qqqqqqqqqqqqqqqqqqqqqqqq'
    expect(podName).toBe('qqqqqqqqqqqqqqqqqqqqqqqq');
  });

  it('should build predictable URLs from known inputs', () => {
    const podName = derivePodName(knownNpub);
    const serverUrl = 'https://solid.test.com';

    const webId = buildWebId(serverUrl, podName);
    const podUrl = buildPodUrl(serverUrl, podName);

    expect(webId).toBe('https://solid.test.com/qqqqqqqqqqqqqqqqqqqqqqqq/profile/card#me');
    expect(podUrl).toBe('https://solid.test.com/qqqqqqqqqqqqqqqqqqqqqqqq/');
  });
});
