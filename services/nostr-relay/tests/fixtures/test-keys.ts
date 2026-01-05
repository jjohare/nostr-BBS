/**
 * Test cryptographic keys and identities
 * Uses nostr-tools for Nostr-specific crypto operations
 */
import { getPublicKey, generateSecretKey, finalizeEvent, getEventHash } from 'nostr-tools';
import { bytesToHex, hexToBytes } from '@noble/curves/abstract/utils';

export interface TestIdentity {
  privateKey: string;
  publicKey: string;
  npub?: string;
}

/**
 * Generate a test keypair
 */
export function generateTestKey(): TestIdentity {
  const privateKeyBytes = generateSecretKey();
  const publicKey = getPublicKey(privateKeyBytes);

  return {
    privateKey: bytesToHex(privateKeyBytes),
    publicKey,
  };
}

/**
 * Generate event ID (using nostr-tools)
 */
export function generateEventId(event: any): string {
  return getEventHash(event);
}

// Pre-generated test identities
export const TEST_ADMIN: TestIdentity = {
  privateKey: 'd2508ff0e0f4f0791d25fac8a8e400fa2930086c2fe50c7dbb7f265aeffe2031',
  publicKey: '8d70f935c1a795588306a1a4ae36b44a378ec00acfbfcf428d198b4575f7e3d3',
};

export const TEST_USER_1: TestIdentity = generateTestKey();
export const TEST_USER_2: TestIdentity = generateTestKey();
export const TEST_USER_3: TestIdentity = generateTestKey();

/**
 * Create a test Nostr event
 * Uses nostr-tools finalizeEvent for proper signing
 */
export function createTestEvent(
  identity: TestIdentity,
  kind: number = 1,
  content: string = 'Test event',
  tags: string[][] = []
): any {
  const eventTemplate = {
    kind,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content,
  };

  // Convert hex private key to Uint8Array for nostr-tools
  const privateKeyBytes = hexToBytes(identity.privateKey);

  // finalizeEvent adds id, pubkey, and sig
  const signedEvent = finalizeEvent(eventTemplate, privateKeyBytes);

  return signedEvent;
}
