/**
 * Tests for did:nostr Identity Resolution
 */

import { describe, it, expect } from '@jest/globals';
import {
  parseDidNostr,
  pubkeyToDidNostr,
  isValidDidNostr,
  createBasicDidDocument,
  extractAlsoKnownAs,
} from '../../src/did-nostr';

describe('did:nostr Identity Resolution', () => {
  const validPubkey = 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd';

  describe('parseDidNostr', () => {
    it('should parse valid did:nostr URI', () => {
      const did = `did:nostr:${validPubkey}`;
      expect(parseDidNostr(did)).toBe(validPubkey);
    });

    it('should lowercase the pubkey', () => {
      const did = `did:nostr:${validPubkey.toUpperCase()}`;
      expect(parseDidNostr(did)).toBe(validPubkey);
    });

    it('should return null for invalid prefix', () => {
      expect(parseDidNostr(`did:key:${validPubkey}`)).toBeNull();
    });

    it('should return null for short pubkey', () => {
      expect(parseDidNostr('did:nostr:abc123')).toBeNull();
    });

    it('should return null for non-hex pubkey', () => {
      expect(parseDidNostr('did:nostr:gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseDidNostr('')).toBeNull();
    });

    it('should return null for null-ish values', () => {
      expect(parseDidNostr(null as any)).toBeNull();
      expect(parseDidNostr(undefined as any)).toBeNull();
    });
  });

  describe('pubkeyToDidNostr', () => {
    it('should create did:nostr from pubkey', () => {
      expect(pubkeyToDidNostr(validPubkey)).toBe(`did:nostr:${validPubkey}`);
    });

    it('should lowercase the result', () => {
      expect(pubkeyToDidNostr(validPubkey.toUpperCase())).toBe(`did:nostr:${validPubkey}`);
    });
  });

  describe('isValidDidNostr', () => {
    it('should return true for valid did:nostr', () => {
      expect(isValidDidNostr(`did:nostr:${validPubkey}`)).toBe(true);
    });

    it('should return false for invalid did:nostr', () => {
      expect(isValidDidNostr('did:nostr:tooshort')).toBe(false);
      expect(isValidDidNostr('did:key:abc')).toBe(false);
      expect(isValidDidNostr('')).toBe(false);
    });
  });

  describe('createBasicDidDocument', () => {
    it('should create document with id and pubkey', () => {
      const doc = createBasicDidDocument(validPubkey);
      expect(doc.id).toBe(`did:nostr:${validPubkey}`);
      expect(doc.pubkey).toBe(validPubkey);
    });

    it('should not include optional fields', () => {
      const doc = createBasicDidDocument(validPubkey);
      expect(doc.profile).toBeUndefined();
      expect(doc.alsoKnownAs).toBeUndefined();
      expect(doc.relays).toBeUndefined();
    });
  });

  describe('extractAlsoKnownAs', () => {
    it('should extract alsoKnownAs array', () => {
      const content = JSON.stringify({
        name: 'Alice',
        alsoKnownAs: ['https://alice.example.com/profile#me', 'acct:alice@example.com'],
      });
      const result = extractAlsoKnownAs(content);
      expect(result).toEqual(['https://alice.example.com/profile#me', 'acct:alice@example.com']);
    });

    it('should extract website with WebID pattern', () => {
      const content = JSON.stringify({
        name: 'Bob',
        website: 'https://bob.example.com/profile#me',
      });
      const result = extractAlsoKnownAs(content);
      expect(result).toEqual(['https://bob.example.com/profile#me']);
    });

    it('should not extract regular website', () => {
      const content = JSON.stringify({
        name: 'Charlie',
        website: 'https://charlie.example.com/',
      });
      const result = extractAlsoKnownAs(content);
      expect(result).toEqual([]);
    });

    it('should return empty array for invalid JSON', () => {
      expect(extractAlsoKnownAs('not json')).toEqual([]);
    });

    it('should return empty array for missing alsoKnownAs', () => {
      const content = JSON.stringify({ name: 'Dave' });
      expect(extractAlsoKnownAs(content)).toEqual([]);
    });

    it('should filter non-string values from alsoKnownAs', () => {
      const content = JSON.stringify({
        alsoKnownAs: ['valid', 123, null, 'also-valid'],
      });
      const result = extractAlsoKnownAs(content);
      expect(result).toEqual(['valid', 'also-valid']);
    });
  });
});
