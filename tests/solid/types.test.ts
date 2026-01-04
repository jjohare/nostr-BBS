/**
 * Unit Tests for Solid Pod Types
 * Tests for type definitions, SolidError class, and enums
 */

import { describe, it, expect } from 'vitest';
import {
  SolidError,
  SolidErrorType,
  type SolidClientConfig,
  type SolidIdentity,
  type PodInfo,
  type PodProvisionResult,
  type Nip98AuthEvent,
  type Nip98AuthOptions,
  type FileMetadata,
  type FileUploadOptions,
  type FileUploadResult,
  type FileDownloadResult,
  type ResourceInfo,
  type ContainerListResult,
  type JsonLdResource,
  type JsonLdResult,
  type AclMode,
  type AclEntry,
  type AclUpdateOptions,
  type AuthenticatedRequestOptions,
  type SolidResponse,
} from '$lib/solid/types';

describe('SolidErrorType enum', () => {
  it('should have all expected error types', () => {
    expect(SolidErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(SolidErrorType.AUTH_ERROR).toBe('AUTH_ERROR');
    expect(SolidErrorType.NOT_FOUND).toBe('NOT_FOUND');
    expect(SolidErrorType.FORBIDDEN).toBe('FORBIDDEN');
    expect(SolidErrorType.CONFLICT).toBe('CONFLICT');
    expect(SolidErrorType.SERVER_ERROR).toBe('SERVER_ERROR');
    expect(SolidErrorType.INVALID_REQUEST).toBe('INVALID_REQUEST');
    expect(SolidErrorType.TIMEOUT).toBe('TIMEOUT');
    expect(SolidErrorType.UNKNOWN).toBe('UNKNOWN');
  });

  it('should contain exactly 9 error types', () => {
    const errorTypes = Object.keys(SolidErrorType);
    expect(errorTypes.length).toBe(9);
  });
});

describe('SolidError class', () => {
  it('should create error with message and type', () => {
    const error = new SolidError('Test error', SolidErrorType.AUTH_ERROR);

    expect(error.message).toBe('Test error');
    expect(error.type).toBe(SolidErrorType.AUTH_ERROR);
    expect(error.name).toBe('SolidError');
    expect(error.status).toBeUndefined();
    expect(error.details).toBeUndefined();
  });

  it('should create error with status code', () => {
    const error = new SolidError(
      'Not found',
      SolidErrorType.NOT_FOUND,
      404
    );

    expect(error.status).toBe(404);
    expect(error.type).toBe(SolidErrorType.NOT_FOUND);
  });

  it('should create error with details', () => {
    const details = { path: '/foo/bar', reason: 'Access denied' };
    const error = new SolidError(
      'Forbidden',
      SolidErrorType.FORBIDDEN,
      403,
      details
    );

    expect(error.details).toEqual(details);
  });

  it('should be an instance of Error', () => {
    const error = new SolidError('Test', SolidErrorType.UNKNOWN);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(SolidError);
  });

  it('should have a proper stack trace', () => {
    const error = new SolidError('Stack test', SolidErrorType.NETWORK_ERROR);

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('Stack test');
  });
});

describe('Type interface structure validation', () => {
  it('should accept valid SolidClientConfig', () => {
    const config: SolidClientConfig = {
      serverUrl: 'https://solid.example.com',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
    };

    expect(config.serverUrl).toBe('https://solid.example.com');
    expect(config.timeout).toBe(30000);
  });

  it('should accept minimal SolidClientConfig', () => {
    const config: SolidClientConfig = {
      serverUrl: 'https://solid.example.com',
    };

    expect(config.serverUrl).toBe('https://solid.example.com');
    expect(config.timeout).toBeUndefined();
  });

  it('should accept valid SolidIdentity', () => {
    const identity: SolidIdentity = {
      pubkey: 'a'.repeat(64),
      privateKey: 'b'.repeat(64),
      npub: 'npub1' + 'c'.repeat(58),
    };

    expect(identity.pubkey.length).toBe(64);
    expect(identity.privateKey.length).toBe(64);
    expect(identity.npub.startsWith('npub1')).toBe(true);
  });

  it('should accept valid PodInfo', () => {
    const podInfo: PodInfo = {
      name: 'alice',
      webId: 'https://solid.example.com/alice/profile/card#me',
      podUrl: 'https://solid.example.com/alice/',
      exists: true,
      quota: 1073741824,
      used: 1048576,
      createdAt: 1704067200,
    };

    expect(podInfo.name).toBe('alice');
    expect(podInfo.exists).toBe(true);
    expect(podInfo.quota).toBe(1073741824);
  });

  it('should accept valid PodProvisionResult', () => {
    const result: PodProvisionResult = {
      success: true,
      podInfo: {
        name: 'bob',
        webId: 'https://solid.example.com/bob/profile/card#me',
        podUrl: 'https://solid.example.com/bob/',
        exists: true,
      },
      alreadyExists: false,
    };

    expect(result.success).toBe(true);
    expect(result.podInfo?.name).toBe('bob');
  });

  it('should accept failed PodProvisionResult', () => {
    const result: PodProvisionResult = {
      success: false,
      error: 'Pod creation failed',
    };

    expect(result.success).toBe(false);
    expect(result.error).toBe('Pod creation failed');
  });

  it('should accept valid Nip98AuthEvent', () => {
    const event: Nip98AuthEvent = {
      id: 'a'.repeat(64),
      pubkey: 'b'.repeat(64),
      created_at: Math.floor(Date.now() / 1000),
      kind: 27235,
      tags: [
        ['u', 'https://solid.example.com/alice/files/'],
        ['method', 'GET'],
      ],
      content: '',
      sig: 'c'.repeat(128),
    };

    expect(event.kind).toBe(27235);
    expect(event.tags.length).toBe(2);
    expect(event.content).toBe('');
  });

  it('should accept Nip98AuthEvent with payload tag', () => {
    const event: Nip98AuthEvent = {
      id: 'a'.repeat(64),
      pubkey: 'b'.repeat(64),
      created_at: Math.floor(Date.now() / 1000),
      kind: 27235,
      tags: [
        ['u', 'https://solid.example.com/alice/files/image.png'],
        ['method', 'PUT'],
        ['payload', 'd'.repeat(64)],
      ],
      content: '',
      sig: 'c'.repeat(128),
    };

    expect(event.tags.length).toBe(3);
    expect(event.tags[2][0]).toBe('payload');
  });

  it('should accept valid Nip98AuthOptions', () => {
    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/files/',
      method: 'GET',
    };

    expect(options.url).toBe('https://solid.example.com/alice/files/');
    expect(options.method).toBe('GET');
  });

  it('should accept Nip98AuthOptions with payload', () => {
    const options: Nip98AuthOptions = {
      url: 'https://solid.example.com/alice/data.json',
      method: 'PUT',
      payload: 'e'.repeat(64),
    };

    expect(options.method).toBe('PUT');
    expect(options.payload).toBeDefined();
  });

  it('should accept valid FileMetadata', () => {
    const metadata: FileMetadata = {
      name: 'image.png',
      contentType: 'image/png',
      size: 1024,
      lastModified: Date.now(),
      custom: { category: 'photos' },
    };

    expect(metadata.name).toBe('image.png');
    expect(metadata.custom?.category).toBe('photos');
  });

  it('should accept valid FileUploadOptions', () => {
    const options: FileUploadOptions = {
      path: '/files/image.png',
      contentType: 'image/png',
      metadata: { alt: 'Test image' },
      overwrite: true,
    };

    expect(options.path).toBe('/files/image.png');
    expect(options.overwrite).toBe(true);
  });

  it('should accept valid ResourceInfo', () => {
    const resource: ResourceInfo = {
      url: 'https://solid.example.com/alice/files/image.png',
      name: 'image.png',
      isContainer: false,
      contentType: 'image/png',
      size: 2048,
      modified: Date.now(),
      etag: '"abc123"',
    };

    expect(resource.isContainer).toBe(false);
    expect(resource.contentType).toBe('image/png');
  });

  it('should accept valid container ResourceInfo', () => {
    const container: ResourceInfo = {
      url: 'https://solid.example.com/alice/files/',
      name: 'files',
      isContainer: true,
    };

    expect(container.isContainer).toBe(true);
    expect(container.contentType).toBeUndefined();
  });

  it('should accept valid JsonLdResource', () => {
    const resource: JsonLdResource = {
      '@context': 'https://schema.org/',
      '@id': 'https://solid.example.com/alice/profile.jsonld',
      '@type': 'Person',
      name: 'Alice',
      email: 'alice@example.com',
    };

    expect(resource['@type']).toBe('Person');
    expect(resource.name).toBe('Alice');
  });

  it('should accept JsonLdResource with multiple types', () => {
    const resource: JsonLdResource = {
      '@context': 'https://schema.org/',
      '@type': ['Person', 'Agent'],
      name: 'Bob',
    };

    expect(Array.isArray(resource['@type'])).toBe(true);
    expect((resource['@type'] as string[]).length).toBe(2);
  });

  it('should accept valid AclEntry', () => {
    const entry: AclEntry = {
      agent: 'https://solid.example.com/alice/profile/card#me',
      modes: ['Read', 'Write'],
      isDefault: false,
    };

    expect(entry.modes).toContain('Read');
    expect(entry.modes).toContain('Write');
  });

  it('should accept all AclMode values', () => {
    const modes: AclMode[] = ['Read', 'Write', 'Append', 'Control'];

    expect(modes.length).toBe(4);
    expect(modes).toContain('Control');
  });

  it('should accept valid SolidResponse', () => {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const response: SolidResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers,
      body: { data: 'test' },
    };

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
  });

  it('should accept error SolidResponse', () => {
    const response: SolidResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
    };

    expect(response.ok).toBe(false);
    expect(response.body).toBeUndefined();
  });
});
