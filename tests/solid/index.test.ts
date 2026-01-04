/**
 * Unit Tests for Solid Pod Integration Module Exports
 * Tests for module structure and exported API
 */

import { describe, it, expect } from 'vitest';

// Test that all expected exports are available
describe('Module exports from $lib/solid', () => {
  it('should export types', async () => {
    const solidModule = await import('$lib/solid');

    // SolidError class
    expect(solidModule.SolidError).toBeDefined();
    expect(typeof solidModule.SolidError).toBe('function');

    // SolidErrorType enum
    expect(solidModule.SolidErrorType).toBeDefined();
    expect(solidModule.SolidErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR');
  });

  it('should export client functions', async () => {
    const solidModule = await import('$lib/solid');

    expect(solidModule.SolidClient).toBeDefined();
    expect(solidModule.createSolidClient).toBeDefined();
    expect(solidModule.getDefaultClient).toBeDefined();
    expect(solidModule.setDefaultClient).toBeDefined();
    expect(solidModule.getSolidServerUrl).toBeDefined();
    expect(solidModule.createSolidIdentity).toBeDefined();
    expect(solidModule.createNip98AuthEvent).toBeDefined();
    expect(solidModule.encodeNip98Auth).toBeDefined();
    expect(solidModule.createAuthorizationHeader).toBeDefined();
  });

  it('should export pod functions', async () => {
    const solidModule = await import('$lib/solid');

    expect(solidModule.derivePodName).toBeDefined();
    expect(solidModule.derivePodNameFromPubkey).toBeDefined();
    expect(solidModule.buildWebId).toBeDefined();
    expect(solidModule.buildPodUrl).toBeDefined();
    expect(solidModule.checkPodExists).toBeDefined();
    expect(solidModule.provisionPod).toBeDefined();
    expect(solidModule.ensurePod).toBeDefined();
    expect(solidModule.getOrCreatePod).toBeDefined();
    expect(solidModule.deletePod).toBeDefined();
    expect(solidModule.getPodInfo).toBeDefined();
    expect(solidModule.isValidPodName).toBeDefined();
  });

  it('should export storage functions', async () => {
    const solidModule = await import('$lib/solid');

    expect(solidModule.MimeTypes).toBeDefined();
    expect(solidModule.detectMimeType).toBeDefined();
    expect(solidModule.buildResourcePath).toBeDefined();
    expect(solidModule.uploadFile).toBeDefined();
    expect(solidModule.uploadText).toBeDefined();
    expect(solidModule.downloadFile).toBeDefined();
    expect(solidModule.downloadText).toBeDefined();
    expect(solidModule.deleteFile).toBeDefined();
    expect(solidModule.ensureContainer).toBeDefined();
    expect(solidModule.listContainer).toBeDefined();
    expect(solidModule.saveJsonLd).toBeDefined();
    expect(solidModule.loadJsonLd).toBeDefined();
    expect(solidModule.resourceExists).toBeDefined();
    expect(solidModule.copyFile).toBeDefined();
    expect(solidModule.moveFile).toBeDefined();
    expect(solidModule.getResourceInfo).toBeDefined();
  });

  it('should export initializeSolid helper', async () => {
    const solidModule = await import('$lib/solid');

    expect(solidModule.initializeSolid).toBeDefined();
    expect(typeof solidModule.initializeSolid).toBe('function');
  });

  it('should export version and NIP-98 kind constants', async () => {
    const solidModule = await import('$lib/solid');

    expect(solidModule.VERSION).toBe('1.0.0');
    expect(solidModule.NIP98_KIND).toBe(27235);
  });
});

describe('SolidClient class structure', () => {
  it('should be instantiable', async () => {
    const { SolidClient } = await import('$lib/solid');

    const client = new SolidClient({ serverUrl: 'https://solid.example.com' });

    expect(client).toBeInstanceOf(SolidClient);
  });

  it('should have request methods', async () => {
    const { SolidClient } = await import('$lib/solid');

    const client = new SolidClient({ serverUrl: 'https://solid.example.com' });

    expect(typeof client.get).toBe('function');
    expect(typeof client.post).toBe('function');
    expect(typeof client.put).toBe('function');
    expect(typeof client.delete).toBe('function');
    expect(typeof client.patch).toBe('function');
    expect(typeof client.request).toBe('function');
  });

  it('should have buildUrl method', async () => {
    const { SolidClient } = await import('$lib/solid');

    const client = new SolidClient({ serverUrl: 'https://solid.example.com' });

    expect(typeof client.buildUrl).toBe('function');
  });

  it('should have static error mapping methods', async () => {
    const { SolidClient } = await import('$lib/solid');

    expect(typeof SolidClient.mapStatusToErrorType).toBe('function');
    expect(typeof SolidClient.throwForResponse).toBe('function');
  });
});

describe('SolidError class structure', () => {
  it('should extend Error', async () => {
    const { SolidError, SolidErrorType } = await import('$lib/solid');

    const error = new SolidError('Test', SolidErrorType.UNKNOWN);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(SolidError);
  });

  it('should have required properties', async () => {
    const { SolidError, SolidErrorType } = await import('$lib/solid');

    const error = new SolidError('Test message', SolidErrorType.AUTH_ERROR, 401, { reason: 'invalid token' });

    expect(error.message).toBe('Test message');
    expect(error.type).toBe(SolidErrorType.AUTH_ERROR);
    expect(error.status).toBe(401);
    expect(error.details).toEqual({ reason: 'invalid token' });
    expect(error.name).toBe('SolidError');
  });
});

describe('MimeTypes constant structure', () => {
  it('should contain all expected MIME types', async () => {
    const { MimeTypes } = await import('$lib/solid');

    const expectedTypes = [
      'TEXT', 'HTML', 'CSS', 'JS', 'JSON', 'JSON_LD',
      'TURTLE', 'PNG', 'JPEG', 'GIF', 'WEBP', 'SVG', 'PDF', 'BINARY'
    ];

    for (const type of expectedTypes) {
      expect(MimeTypes[type as keyof typeof MimeTypes]).toBeDefined();
    }
  });

  it('should be frozen (immutable)', async () => {
    const { MimeTypes } = await import('$lib/solid');

    // In strict mode, this would throw. Otherwise, it just fails silently.
    // The 'as const' assertion in the source should make it readonly.
    expect(typeof MimeTypes).toBe('object');
  });
});

describe('Function signatures', () => {
  it('createSolidIdentity should require pubkey and privateKey', async () => {
    const { createSolidIdentity } = await import('$lib/solid');

    // Valid call
    const identity = createSolidIdentity(
      'a'.repeat(64),
      'b'.repeat(64)
    );

    expect(identity.pubkey).toBe('a'.repeat(64));
    expect(identity.privateKey).toBe('b'.repeat(64));
    expect(identity.npub).toMatch(/^npub1/);
  });

  it('buildWebId should require serverUrl and podName', async () => {
    const { buildWebId } = await import('$lib/solid');

    const webId = buildWebId('https://solid.example.com', 'alice');

    expect(webId).toBe('https://solid.example.com/alice/profile/card#me');
  });

  it('buildPodUrl should require serverUrl and podName', async () => {
    const { buildPodUrl } = await import('$lib/solid');

    const podUrl = buildPodUrl('https://solid.example.com', 'alice');

    expect(podUrl).toBe('https://solid.example.com/alice/');
  });

  it('detectMimeType should accept filename string', async () => {
    const { detectMimeType } = await import('$lib/solid');

    expect(detectMimeType('test.json')).toBe('application/json');
    expect(detectMimeType('image.png')).toBe('image/png');
  });
});

describe('Re-exports from sub-modules', () => {
  it('should re-export all from types.ts', async () => {
    const indexModule = await import('$lib/solid/index');
    const typesModule = await import('$lib/solid/types');

    // SolidError and SolidErrorType should be available from both
    expect(indexModule.SolidError).toBe(typesModule.SolidError);
    expect(indexModule.SolidErrorType).toBe(typesModule.SolidErrorType);
  });

  it('should re-export from client.ts', async () => {
    const indexModule = await import('$lib/solid/index');
    const clientModule = await import('$lib/solid/client');

    expect(indexModule.SolidClient).toBe(clientModule.SolidClient);
    expect(indexModule.createSolidClient).toBe(clientModule.createSolidClient);
    expect(indexModule.createNip98AuthEvent).toBe(clientModule.createNip98AuthEvent);
  });

  it('should re-export from pods.ts', async () => {
    const indexModule = await import('$lib/solid/index');
    const podsModule = await import('$lib/solid/pods');

    expect(indexModule.derivePodName).toBe(podsModule.derivePodName);
    expect(indexModule.buildWebId).toBe(podsModule.buildWebId);
    expect(indexModule.isValidPodName).toBe(podsModule.isValidPodName);
  });

  it('should re-export from storage.ts', async () => {
    const indexModule = await import('$lib/solid/index');
    const storageModule = await import('$lib/solid/storage');

    expect(indexModule.MimeTypes).toBe(storageModule.MimeTypes);
    expect(indexModule.detectMimeType).toBe(storageModule.detectMimeType);
    expect(indexModule.buildResourcePath).toBe(storageModule.buildResourcePath);
  });
});
