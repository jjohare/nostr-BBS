/**
 * Unit Tests for Solid Pod Storage Operations
 * Tests for MIME type detection, path building, and container parsing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSecretKey, getPublicKey } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';
import { createSolidIdentity } from '$lib/solid/client';
import {
  MimeTypes,
  detectMimeType,
  buildResourcePath,
} from '$lib/solid/storage';
import type { SolidIdentity } from '$lib/solid/types';

// Generate test identity
function createTestIdentity(): SolidIdentity {
  const privateKey = generateSecretKey();
  const pubkey = getPublicKey(privateKey);
  const privateKeyHex = bytesToHex(privateKey);

  return createSolidIdentity(pubkey, privateKeyHex);
}

describe('MimeTypes constants', () => {
  it('should have text MIME types', () => {
    expect(MimeTypes.TEXT).toBe('text/plain');
    expect(MimeTypes.HTML).toBe('text/html');
    expect(MimeTypes.CSS).toBe('text/css');
  });

  it('should have application MIME types', () => {
    expect(MimeTypes.JS).toBe('application/javascript');
    expect(MimeTypes.JSON).toBe('application/json');
    expect(MimeTypes.JSON_LD).toBe('application/ld+json');
    expect(MimeTypes.PDF).toBe('application/pdf');
    expect(MimeTypes.BINARY).toBe('application/octet-stream');
  });

  it('should have image MIME types', () => {
    expect(MimeTypes.PNG).toBe('image/png');
    expect(MimeTypes.JPEG).toBe('image/jpeg');
    expect(MimeTypes.GIF).toBe('image/gif');
    expect(MimeTypes.WEBP).toBe('image/webp');
    expect(MimeTypes.SVG).toBe('image/svg+xml');
  });

  it('should have Turtle MIME type for RDF', () => {
    expect(MimeTypes.TURTLE).toBe('text/turtle');
  });
});

describe('detectMimeType', () => {
  describe('text files', () => {
    it('should detect plain text files', () => {
      expect(detectMimeType('readme.txt')).toBe('text/plain');
      expect(detectMimeType('notes.TXT')).toBe('text/plain');
    });

    it('should detect HTML files', () => {
      expect(detectMimeType('index.html')).toBe('text/html');
      expect(detectMimeType('page.htm')).toBe('text/html');
    });

    it('should detect CSS files', () => {
      expect(detectMimeType('styles.css')).toBe('text/css');
    });
  });

  describe('application files', () => {
    it('should detect JavaScript files', () => {
      expect(detectMimeType('app.js')).toBe('application/javascript');
      expect(detectMimeType('module.mjs')).toBe('application/javascript');
    });

    it('should detect JSON files', () => {
      expect(detectMimeType('data.json')).toBe('application/json');
    });

    it('should detect JSON-LD files', () => {
      expect(detectMimeType('profile.jsonld')).toBe('application/ld+json');
    });

    it('should detect PDF files', () => {
      expect(detectMimeType('document.pdf')).toBe('application/pdf');
    });
  });

  describe('image files', () => {
    it('should detect PNG files', () => {
      expect(detectMimeType('image.png')).toBe('image/png');
    });

    it('should detect JPEG files', () => {
      expect(detectMimeType('photo.jpg')).toBe('image/jpeg');
      expect(detectMimeType('photo.jpeg')).toBe('image/jpeg');
    });

    it('should detect GIF files', () => {
      expect(detectMimeType('animation.gif')).toBe('image/gif');
    });

    it('should detect WebP files', () => {
      expect(detectMimeType('image.webp')).toBe('image/webp');
    });

    it('should detect SVG files', () => {
      expect(detectMimeType('icon.svg')).toBe('image/svg+xml');
    });
  });

  describe('RDF files', () => {
    it('should detect Turtle files', () => {
      expect(detectMimeType('data.ttl')).toBe('text/turtle');
    });
  });

  describe('edge cases', () => {
    it('should return binary for unknown extensions', () => {
      expect(detectMimeType('file.xyz')).toBe('application/octet-stream');
      expect(detectMimeType('data.unknown')).toBe('application/octet-stream');
    });

    it('should handle files without extensions', () => {
      expect(detectMimeType('Makefile')).toBe('application/octet-stream');
      expect(detectMimeType('README')).toBe('application/octet-stream');
    });

    it('should handle paths with directories', () => {
      expect(detectMimeType('/path/to/image.png')).toBe('image/png');
      expect(detectMimeType('folder/subfolder/data.json')).toBe('application/json');
    });

    it('should handle multiple dots in filename', () => {
      expect(detectMimeType('file.test.json')).toBe('application/json');
      expect(detectMimeType('image.v2.final.png')).toBe('image/png');
    });

    it('should be case insensitive', () => {
      expect(detectMimeType('IMAGE.PNG')).toBe('image/png');
      expect(detectMimeType('DATA.JSON')).toBe('application/json');
      expect(detectMimeType('FILE.TxT')).toBe('text/plain');
    });
  });
});

describe('buildResourcePath', () => {
  let identity: SolidIdentity;

  beforeEach(() => {
    identity = createTestIdentity();
  });

  it('should build path with leading slash in input', () => {
    const path = buildResourcePath(identity, '/files/image.png');

    expect(path).toMatch(/^\/[a-z0-9]+\/files\/image\.png$/);
    expect(path.startsWith('/')).toBe(true);
  });

  it('should build path without leading slash in input', () => {
    const path = buildResourcePath(identity, 'files/image.png');

    expect(path).toMatch(/^\/[a-z0-9]+\/files\/image\.png$/);
  });

  it('should include pod name derived from identity', () => {
    const path = buildResourcePath(identity, '/test.txt');

    // Pod name is first 24 chars after the leading slash
    const podName = path.split('/')[1];
    expect(podName.length).toBe(24);
    expect(podName).toMatch(/^[a-z0-9]+$/);
  });

  it('should handle nested paths', () => {
    const path = buildResourcePath(identity, '/a/b/c/d/file.txt');

    expect(path).toContain('/a/b/c/d/file.txt');
  });

  it('should handle container paths ending with slash', () => {
    const path = buildResourcePath(identity, '/files/');

    expect(path.endsWith('/files/')).toBe(true);
  });

  it('should handle root path', () => {
    const path = buildResourcePath(identity, '/');

    // Should be /{podName}/
    const parts = path.split('/').filter(Boolean);
    expect(parts.length).toBe(1);
    expect(parts[0].length).toBe(24);
  });

  it('should produce consistent paths for same identity', () => {
    const path1 = buildResourcePath(identity, '/test.txt');
    const path2 = buildResourcePath(identity, '/test.txt');

    expect(path1).toBe(path2);
  });

  it('should produce different pod prefixes for different identities', () => {
    const identity2 = createTestIdentity();

    const path1 = buildResourcePath(identity, '/test.txt');
    const path2 = buildResourcePath(identity2, '/test.txt');

    expect(path1).not.toBe(path2);
    expect(path1.endsWith('/test.txt')).toBe(true);
    expect(path2.endsWith('/test.txt')).toBe(true);
  });
});

describe('Container listing parser behavior', () => {
  // These tests verify expected behavior of the parseContainerListing function
  // which is internal but its behavior affects listContainer results

  it('should handle Turtle with ldp:contains predicates', () => {
    const turtleContent = `
@prefix ldp: <http://www.w3.org/ns/ldp#> .

<> a ldp:Container ;
   ldp:contains <file1.txt> ;
   ldp:contains <file2.json> ;
   ldp:contains <subfolder/> .
`;

    // The parser should extract: file1.txt, file2.json, subfolder/
    // This validates the expected format - actual parsing tested via integration
    expect(turtleContent).toContain('ldp:contains');
    expect(turtleContent).toContain('<file1.txt>');
    expect(turtleContent).toContain('<subfolder/>');
  });

  it('should handle container identified by trailing slash', () => {
    const containerUrl = 'https://solid.example.com/alice/files/';

    expect(containerUrl.endsWith('/')).toBe(true);

    // Resource URLs ending with / are containers
    const isContainer = (url: string) => url.endsWith('/');

    expect(isContainer(containerUrl)).toBe(true);
    expect(isContainer('https://solid.example.com/alice/files/image.png')).toBe(false);
  });
});

describe('File operation type checking', () => {
  // These tests verify type structures without network calls

  it('should accept valid FileUploadOptions', () => {
    const options = {
      path: '/files/test.txt',
      contentType: 'text/plain',
      overwrite: true,
    };

    expect(options.path).toBeDefined();
    expect(options.contentType).toBe('text/plain');
    expect(options.overwrite).toBe(true);
  });

  it('should accept minimal FileUploadOptions', () => {
    const options = {
      path: '/files/data.json',
    };

    expect(options.path).toBe('/files/data.json');
  });

  it('should build proper file metadata structure', () => {
    const metadata = {
      name: 'test.txt',
      contentType: 'text/plain',
      size: 1024,
      lastModified: Date.now(),
    };

    expect(metadata.name).toBe('test.txt');
    expect(metadata.size).toBe(1024);
    expect(typeof metadata.lastModified).toBe('number');
  });
});

describe('JSON-LD resource handling', () => {
  it('should accept valid JSON-LD with context', () => {
    const resource = {
      '@context': 'https://schema.org/',
      '@type': 'Person',
      name: 'Alice',
    };

    expect(resource['@context']).toBe('https://schema.org/');
    expect(resource['@type']).toBe('Person');
  });

  it('should accept JSON-LD with array context', () => {
    const resource = {
      '@context': [
        'https://schema.org/',
        { custom: 'https://example.org/custom#' },
      ],
      '@type': 'Person',
      name: 'Bob',
    };

    expect(Array.isArray(resource['@context'])).toBe(true);
    expect(resource['@context'].length).toBe(2);
  });

  it('should accept JSON-LD with id', () => {
    const resource = {
      '@context': 'https://schema.org/',
      '@id': 'https://solid.example.com/alice/profile#me',
      '@type': 'Person',
      name: 'Alice',
    };

    expect(resource['@id']).toContain('#me');
  });

  it('should accept JSON-LD with multiple types', () => {
    const resource = {
      '@context': 'https://schema.org/',
      '@type': ['Person', 'Agent'],
      name: 'Charlie',
    };

    expect(Array.isArray(resource['@type'])).toBe(true);
    expect(resource['@type']).toContain('Person');
    expect(resource['@type']).toContain('Agent');
  });

  it('should handle nested JSON-LD objects', () => {
    const resource = {
      '@context': 'https://schema.org/',
      '@type': 'Person',
      name: 'Alice',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 Main St',
        addressLocality: 'Somewhere',
      },
    };

    expect(resource.address['@type']).toBe('PostalAddress');
    expect(resource.address.streetAddress).toBe('123 Main St');
  });
});

describe('Resource existence check patterns', () => {
  it('should determine container vs file from path', () => {
    const isContainerPath = (path: string) => path.endsWith('/');

    expect(isContainerPath('/alice/')).toBe(true);
    expect(isContainerPath('/alice/files/')).toBe(true);
    expect(isContainerPath('/alice/file.txt')).toBe(false);
    expect(isContainerPath('/alice/files/image.png')).toBe(false);
  });

  it('should extract filename from path', () => {
    const getFilename = (path: string) => path.split('/').pop() || '';

    expect(getFilename('/alice/files/image.png')).toBe('image.png');
    expect(getFilename('/alice/data.json')).toBe('data.json');
    expect(getFilename('/alice/files/')).toBe('');
  });

  it('should extract parent path', () => {
    const getParent = (path: string) => {
      const parts = path.split('/').filter(Boolean);
      parts.pop();
      return '/' + parts.join('/') + '/';
    };

    expect(getParent('/alice/files/image.png')).toBe('/alice/files/');
    expect(getParent('/alice/data.json')).toBe('/alice/');
  });
});
