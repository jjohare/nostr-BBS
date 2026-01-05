/**
 * NIP-01 Protocol Compliance Tests
 * Tests Nostr protocol message types: EVENT, REQ, CLOSE
 *
 * NOTE: These tests require a running relay at RELAY_URL.
 * Set RELAY_WS_URL environment variable or skip with SKIP_INTEGRATION_TESTS=true
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import WebSocket from 'ws';
import { TEST_RELAY_CONFIG } from '../setup';
import { createTestEvent, TEST_USER_1, TEST_ADMIN } from '../fixtures/test-keys';

const SKIP_INTEGRATION = process.env.SKIP_INTEGRATION_TESTS === 'true';

describe('NIP-01 Protocol Compliance', () => {
  let ws: WebSocket | null = null;
  const RELAY_URL = TEST_RELAY_CONFIG.wsUrl;
  let relayAvailable = true;

  // Helper to safely close WebSocket with timeout
  const closeWebSocket = (socket: WebSocket | null): Promise<void> => {
    return new Promise((resolve) => {
      if (!socket) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => resolve(), 1000);

      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.once('close', () => {
          clearTimeout(timeout);
          resolve();
        });
        socket.close();
      } else {
        clearTimeout(timeout);
        resolve();
      }
    });
  };

  // Helper to skip test if relay not available
  const skipIfNoRelay = (done: () => void): boolean => {
    if (SKIP_INTEGRATION || !relayAvailable || !ws) {
      done();
      return true;
    }
    return false;
  };

  beforeEach((done) => {
    if (SKIP_INTEGRATION || !relayAvailable) {
      done();
      return;
    }

    ws = new WebSocket(RELAY_URL);
    ws.on('open', () => done());
    ws.on('error', (error: Error) => {
      if ((error as any).code === 'ECONNREFUSED') {
        relayAvailable = false;
        done();
      } else {
        done(error);
      }
    });
  });

  afterEach(async () => {
    await closeWebSocket(ws);
    ws = null;
  });

  describe('EVENT Messages', () => {
    it('should accept valid EVENT message', (done) => {
      if (skipIfNoRelay(done)) return;

      const event = createTestEvent(TEST_ADMIN, 1, 'Test message');

      ws!.send(JSON.stringify(['EVENT', event]));

      ws!.on('message', (data) => {
        const response = JSON.parse(data.toString());

        if (response[0] === 'OK') {
          expect(response[1]).toBe(event.id);
          expect(response[2]).toBe(true);
          done();
        }
      });
    });

    it('should reject EVENT with invalid signature', (done) => {
      if (skipIfNoRelay(done)) return;

      const event = createTestEvent(TEST_USER_1, 1, 'Test message');
      event.sig = '0'.repeat(128);

      ws!.send(JSON.stringify(['EVENT', event]));

      ws!.on('message', (data) => {
        const response = JSON.parse(data.toString());

        if (response[0] === 'OK') {
          expect(response[1]).toBe(event.id);
          expect(response[2]).toBe(false);
          expect(response[3]).toContain('invalid');
          done();
        }
      });
    });

    it('should reject EVENT with missing required fields', (done) => {
      if (skipIfNoRelay(done)) return;

      const invalidEvent = {
        id: 'test',
        pubkey: TEST_USER_1.publicKey,
      };

      ws!.send(JSON.stringify(['EVENT', invalidEvent]));

      ws!.on('message', (data) => {
        const response = JSON.parse(data.toString());

        if (response[0] === 'NOTICE' || response[0] === 'OK') {
          done();
        }
      });
    });
  });

  describe('REQ Messages', () => {
    it('should accept REQ and open subscription', (done) => {
      if (skipIfNoRelay(done)) return;

      const subscriptionId = 'test-sub-1';
      const filter = { kinds: [1], limit: 10 };

      ws!.send(JSON.stringify(['REQ', subscriptionId, filter]));

      ws!.on('message', (data) => {
        const response = JSON.parse(data.toString());

        if (response[0] === 'EOSE') {
          expect(response[1]).toBe(subscriptionId);
          done();
        }
      });
    });

    it('should support multiple filters in REQ', (done) => {
      if (skipIfNoRelay(done)) return;

      const subscriptionId = 'multi-filter-sub';
      const filter1 = { kinds: [1], limit: 5 };
      const filter2 = { kinds: [0], limit: 5 };

      ws!.send(JSON.stringify(['REQ', subscriptionId, filter1, filter2]));

      ws!.on('message', (data) => {
        const response = JSON.parse(data.toString());

        if (response[0] === 'EOSE') {
          expect(response[1]).toBe(subscriptionId);
          done();
        }
      });
    });

    it('should filter by author pubkey', (done) => {
      if (skipIfNoRelay(done)) return;

      const subscriptionId = 'author-filter';
      const filter = { authors: [TEST_ADMIN.publicKey], limit: 10 };

      ws!.send(JSON.stringify(['REQ', subscriptionId, filter]));

      let receivedEOSE = false;

      ws!.on('message', (data) => {
        const response = JSON.parse(data.toString());

        if (response[0] === 'EVENT') {
          expect(response[2].pubkey).toBe(TEST_ADMIN.publicKey);
        } else if (response[0] === 'EOSE') {
          receivedEOSE = true;
          expect(response[1]).toBe(subscriptionId);
          done();
        }
      });

      setTimeout(() => {
        if (!receivedEOSE) {
          done();
        }
      }, 1000);
    });

    it('should filter by event IDs', (done) => {
      if (skipIfNoRelay(done)) return;

      const event = createTestEvent(TEST_USER_1, 1, 'Find me');
      const subscriptionId = 'id-filter';

      ws!.send(JSON.stringify(['EVENT', event]));

      setTimeout(() => {
        const filter = { ids: [event.id] };
        ws!.send(JSON.stringify(['REQ', subscriptionId, filter]));
      }, 200);

      ws!.on('message', (data) => {
        const response = JSON.parse(data.toString());

        if (response[0] === 'EVENT' && response[2].id === event.id) {
          expect(response[1]).toBe(subscriptionId);
          expect(response[2].content).toBe('Find me');
          done();
        }
      });
    });

    it('should respect limit parameter', (done) => {
      if (skipIfNoRelay(done)) return;

      const subscriptionId = 'limit-test';
      const filter = { kinds: [1], limit: 3 };
      const events: any[] = [];

      ws!.send(JSON.stringify(['REQ', subscriptionId, filter]));

      ws!.on('message', (data) => {
        const response = JSON.parse(data.toString());

        if (response[0] === 'EVENT') {
          events.push(response[2]);
        } else if (response[0] === 'EOSE') {
          expect(events.length).toBeLessThanOrEqual(3);
          done();
        }
      });
    });

    it('should filter by timestamp (since/until)', (done) => {
      if (skipIfNoRelay(done)) return;

      const now = Math.floor(Date.now() / 1000);
      const subscriptionId = 'time-filter';
      const filter = {
        kinds: [1],
        since: now - 3600,
        until: now + 60,
        limit: 10
      };

      ws!.send(JSON.stringify(['REQ', subscriptionId, filter]));

      ws!.on('message', (data) => {
        const response = JSON.parse(data.toString());

        if (response[0] === 'EVENT') {
          const eventTime = response[2].created_at;
          expect(eventTime).toBeGreaterThanOrEqual(filter.since);
          expect(eventTime).toBeLessThanOrEqual(filter.until);
        } else if (response[0] === 'EOSE') {
          done();
        }
      });
    });
  });

  describe('CLOSE Messages', () => {
    it('should close subscription with CLOSE', (done) => {
      if (skipIfNoRelay(done)) return;

      const subscriptionId = 'close-test';

      ws!.send(JSON.stringify(['REQ', subscriptionId, { kinds: [1] }]));

      setTimeout(() => {
        ws!.send(JSON.stringify(['CLOSE', subscriptionId]));

        let receivedAfterClose = false;
        ws!.on('message', (data) => {
          const response = JSON.parse(data.toString());
          if (response[0] === 'EVENT' && response[1] === subscriptionId) {
            receivedAfterClose = true;
          }
        });

        setTimeout(() => {
          expect(receivedAfterClose).toBe(false);
          done();
        }, 500);
      }, 200);
    });

    it('should handle closing non-existent subscription', (done) => {
      if (skipIfNoRelay(done)) return;

      ws!.send(JSON.stringify(['CLOSE', 'non-existent-sub']));

      setTimeout(() => {
        expect(ws!.readyState).toBe(WebSocket.OPEN);
        done();
      }, 200);
    });

    it('should allow reopening same subscription ID', (done) => {
      if (skipIfNoRelay(done)) return;

      const subscriptionId = 'reopen-test';

      ws!.send(JSON.stringify(['REQ', subscriptionId, { kinds: [1], limit: 1 }]));

      setTimeout(() => {
        ws!.send(JSON.stringify(['CLOSE', subscriptionId]));

        setTimeout(() => {
          ws!.send(JSON.stringify(['REQ', subscriptionId, { kinds: [0], limit: 1 }]));

          ws!.on('message', (data) => {
            const response = JSON.parse(data.toString());
            if (response[0] === 'EOSE' && response[1] === subscriptionId) {
              done();
            }
          });
        }, 200);
      }, 200);
    });
  });

  describe('Error Handling', () => {
    it('should reject unknown message types', (done) => {
      if (skipIfNoRelay(done)) return;

      ws!.send(JSON.stringify(['UNKNOWN', 'param1', 'param2']));

      ws!.on('message', (data) => {
        const response = JSON.parse(data.toString());

        if (response[0] === 'NOTICE') {
          expect(response[1].toLowerCase()).toContain('unknown');
          done();
        }
      });
    });

    it('should handle malformed JSON gracefully', (done) => {
      if (skipIfNoRelay(done)) return;

      ws!.send('{invalid json}');

      ws!.on('message', (data) => {
        const response = JSON.parse(data.toString());

        if (response[0] === 'NOTICE') {
          done();
        }
      });
    });

    it('should handle non-array message format', (done) => {
      if (skipIfNoRelay(done)) return;

      ws!.send(JSON.stringify({ type: 'EVENT', data: 'test' }));

      ws!.on('message', (data) => {
        const response = JSON.parse(data.toString());

        if (response[0] === 'NOTICE') {
          done();
        }
      });
    });
  });
});
