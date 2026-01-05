/**
 * Tests for NIP-98 HTTP Auth
 */

import { describe, it, expect } from '@jest/globals';
import {
  hasNostrAuth,
  extractNostrToken,
  pubkeyToDidNostr,
} from '../../src/nip98';

describe('NIP-98 HTTP Auth', () => {
  describe('hasNostrAuth', () => {
    it('should detect Nostr authorization header', () => {
      expect(hasNostrAuth({ authorization: 'Nostr abc123' })).toBe(true);
    });

    it('should detect Basic auth with nostr: prefix', () => {
      // "nostr:token" encoded in base64
      const encoded = Buffer.from('nostr:abc123').toString('base64');
      expect(hasNostrAuth({ authorization: `Basic ${encoded}` })).toBe(true);
    });

    it('should reject regular Basic auth', () => {
      // "user:password" encoded in base64
      const encoded = Buffer.from('user:password').toString('base64');
      expect(hasNostrAuth({ authorization: `Basic ${encoded}` })).toBe(false);
    });

    it('should reject Bearer auth', () => {
      expect(hasNostrAuth({ authorization: 'Bearer abc123' })).toBe(false);
    });

    it('should return false for missing auth header', () => {
      expect(hasNostrAuth({})).toBe(false);
    });
  });

  describe('extractNostrToken', () => {
    it('should extract token from Nostr header', () => {
      expect(extractNostrToken('Nostr eyJhbGciOiJIUzI1NiJ9')).toBe('eyJhbGciOiJIUzI1NiJ9');
    });

    it('should extract token from Basic nostr: header', () => {
      const token = 'eyJhbGciOiJIUzI1NiJ9';
      const encoded = Buffer.from(`nostr:${token}`).toString('base64');
      expect(extractNostrToken(`Basic ${encoded}`)).toBe(token);
    });

    it('should return null for regular Basic auth', () => {
      const encoded = Buffer.from('user:password').toString('base64');
      expect(extractNostrToken(`Basic ${encoded}`)).toBeNull();
    });

    it('should return null for Bearer auth', () => {
      expect(extractNostrToken('Bearer abc123')).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(extractNostrToken(undefined)).toBeNull();
    });

    it('should trim whitespace from Nostr token', () => {
      expect(extractNostrToken('Nostr   abc123   ')).toBe('abc123');
    });
  });

  describe('pubkeyToDidNostr', () => {
    it('should convert pubkey to did:nostr format', () => {
      const pubkey = 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd';
      expect(pubkeyToDidNostr(pubkey)).toBe(`did:nostr:${pubkey.toLowerCase()}`);
    });

    it('should lowercase the pubkey', () => {
      const pubkey = 'A1B2C3D4E5F6789012345678901234567890123456789012345678901234ABCD';
      expect(pubkeyToDidNostr(pubkey)).toBe('did:nostr:a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd');
    });
  });
});
