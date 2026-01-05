/**
 * Tests for NIP-16 Event Treatment
 */

import { describe, it, expect } from '@jest/globals';
import {
  isReplaceableKind,
  isEphemeralKind,
  isParameterizedReplaceable,
  getEventTreatment,
  getReplacementKey,
  getDTagValue,
} from '../../src/nip16';
import { NostrEvent } from '../../src/db';

describe('NIP-16 Event Treatment', () => {
  describe('isReplaceableKind', () => {
    it('should identify kind 0 (metadata) as replaceable', () => {
      expect(isReplaceableKind(0)).toBe(true);
    });

    it('should identify kind 3 (contacts) as replaceable', () => {
      expect(isReplaceableKind(3)).toBe(true);
    });

    it('should identify kinds 10000-19999 as replaceable', () => {
      expect(isReplaceableKind(10000)).toBe(true);
      expect(isReplaceableKind(10002)).toBe(true);
      expect(isReplaceableKind(15000)).toBe(true);
      expect(isReplaceableKind(19999)).toBe(true);
    });

    it('should not identify regular kinds as replaceable', () => {
      expect(isReplaceableKind(1)).toBe(false);
      expect(isReplaceableKind(4)).toBe(false);
      expect(isReplaceableKind(9999)).toBe(false);
      expect(isReplaceableKind(20000)).toBe(false);
    });
  });

  describe('isEphemeralKind', () => {
    it('should identify kinds 20000-29999 as ephemeral', () => {
      expect(isEphemeralKind(20000)).toBe(true);
      expect(isEphemeralKind(22222)).toBe(true);
      expect(isEphemeralKind(29999)).toBe(true);
    });

    it('should not identify other kinds as ephemeral', () => {
      expect(isEphemeralKind(1)).toBe(false);
      expect(isEphemeralKind(19999)).toBe(false);
      expect(isEphemeralKind(30000)).toBe(false);
    });
  });

  describe('isParameterizedReplaceable', () => {
    it('should identify kinds 30000-39999 as parameterized replaceable', () => {
      expect(isParameterizedReplaceable(30000)).toBe(true);
      expect(isParameterizedReplaceable(30023)).toBe(true); // Long-form content
      expect(isParameterizedReplaceable(39999)).toBe(true);
    });

    it('should not identify other kinds as parameterized replaceable', () => {
      expect(isParameterizedReplaceable(1)).toBe(false);
      expect(isParameterizedReplaceable(29999)).toBe(false);
      expect(isParameterizedReplaceable(40000)).toBe(false);
    });
  });

  describe('getEventTreatment', () => {
    it('should return correct treatment for each kind', () => {
      expect(getEventTreatment(0)).toBe('replaceable');
      expect(getEventTreatment(1)).toBe('regular');
      expect(getEventTreatment(3)).toBe('replaceable');
      expect(getEventTreatment(10002)).toBe('replaceable');
      expect(getEventTreatment(20000)).toBe('ephemeral');
      expect(getEventTreatment(30023)).toBe('parameterized_replaceable');
    });
  });

  describe('getDTagValue', () => {
    it('should extract d tag value', () => {
      const event: NostrEvent = {
        id: 'abc',
        pubkey: '123',
        created_at: 1234567890,
        kind: 30023,
        tags: [['d', 'my-article'], ['p', 'somepubkey']],
        content: 'test',
        sig: 'sig123',
      };
      expect(getDTagValue(event)).toBe('my-article');
    });

    it('should return empty string for empty d tag', () => {
      const event: NostrEvent = {
        id: 'abc',
        pubkey: '123',
        created_at: 1234567890,
        kind: 30023,
        tags: [['d', '']],
        content: 'test',
        sig: 'sig123',
      };
      expect(getDTagValue(event)).toBe('');
    });

    it('should return null when no d tag exists', () => {
      const event: NostrEvent = {
        id: 'abc',
        pubkey: '123',
        created_at: 1234567890,
        kind: 1,
        tags: [['p', 'somepubkey']],
        content: 'test',
        sig: 'sig123',
      };
      expect(getDTagValue(event)).toBeNull();
    });
  });

  describe('getReplacementKey', () => {
    it('should return pubkey:kind for replaceable events', () => {
      const event: NostrEvent = {
        id: 'abc',
        pubkey: 'pubkey123',
        created_at: 1234567890,
        kind: 0,
        tags: [],
        content: 'test',
        sig: 'sig123',
      };
      expect(getReplacementKey(event)).toBe('pubkey123:0');
    });

    it('should return pubkey:kind:dtag for parameterized replaceable', () => {
      const event: NostrEvent = {
        id: 'abc',
        pubkey: 'pubkey123',
        created_at: 1234567890,
        kind: 30023,
        tags: [['d', 'article-slug']],
        content: 'test',
        sig: 'sig123',
      };
      expect(getReplacementKey(event)).toBe('pubkey123:30023:article-slug');
    });

    it('should return null for regular events', () => {
      const event: NostrEvent = {
        id: 'abc',
        pubkey: 'pubkey123',
        created_at: 1234567890,
        kind: 1,
        tags: [],
        content: 'test',
        sig: 'sig123',
      };
      expect(getReplacementKey(event)).toBeNull();
    });

    it('should return null for ephemeral events', () => {
      const event: NostrEvent = {
        id: 'abc',
        pubkey: 'pubkey123',
        created_at: 1234567890,
        kind: 20000,
        tags: [],
        content: 'test',
        sig: 'sig123',
      };
      expect(getReplacementKey(event)).toBeNull();
    });
  });
});
