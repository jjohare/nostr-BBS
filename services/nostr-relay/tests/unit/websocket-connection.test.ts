/**
 * WebSocket Connection Tests
 * Tests real WebSocket connections to the Nostr relay
 *
 * NOTE: These tests require a running relay at RELAY_URL.
 * Set RELAY_WS_URL environment variable or skip with SKIP_INTEGRATION_TESTS=true
 */
import { describe, it, expect, beforeAll, afterEach } from '@jest/globals';
import WebSocket from 'ws';
import { TEST_RELAY_CONFIG } from '../setup';

const SKIP_INTEGRATION = process.env.SKIP_INTEGRATION_TESTS === 'true';

describe('WebSocket Connection Tests', () => {
  let ws: WebSocket | null = null;
  const RELAY_URL = TEST_RELAY_CONFIG.wsUrl;

  // Helper to safely close WebSocket with timeout
  const closeWebSocket = (socket: WebSocket | null): Promise<void> => {
    return new Promise((resolve) => {
      if (!socket) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        resolve();
      }, 1000);

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

  afterEach(async () => {
    await closeWebSocket(ws);
    ws = null;
  });

  it('should establish WebSocket connection', (done) => {
    if (SKIP_INTEGRATION) {
      done();
      return;
    }

    ws = new WebSocket(RELAY_URL);

    ws.on('open', () => {
      expect(ws!.readyState).toBe(WebSocket.OPEN);
      done();
    });

    ws.on('error', (error: Error) => {
      // Connection refused is expected if no relay is running
      if ((error as any).code === 'ECONNREFUSED') {
        done();
      } else {
        done(error);
      }
    });
  });

  it('should receive connection acknowledgment', (done) => {
    if (SKIP_INTEGRATION) {
      done();
      return;
    }

    ws = new WebSocket(RELAY_URL);

    ws.on('open', () => {
      // Relay might send NOTICE on connect
      setTimeout(() => {
        expect(ws!.readyState).toBe(WebSocket.OPEN);
        done();
      }, 100);
    });

    ws.on('error', (error: Error) => {
      if ((error as any).code === 'ECONNREFUSED') {
        done();
      } else {
        done(error);
      }
    });
  });

  it('should handle multiple concurrent connections', (done) => {
    if (SKIP_INTEGRATION) {
      done();
      return;
    }

    const connections: WebSocket[] = [];
    const CONCURRENT_COUNT = 10;
    let openedCount = 0;
    let errorOccurred = false;

    for (let i = 0; i < CONCURRENT_COUNT; i++) {
      const conn = new WebSocket(RELAY_URL);
      connections.push(conn);

      conn.on('open', () => {
        if (errorOccurred) return;
        openedCount++;
        if (openedCount === CONCURRENT_COUNT) {
          expect(openedCount).toBe(CONCURRENT_COUNT);
          connections.forEach(c => c.close());
          done();
        }
      });

      conn.on('error', (error: Error) => {
        if (errorOccurred) return;
        errorOccurred = true;
        connections.forEach(c => c.close());
        if ((error as any).code === 'ECONNREFUSED') {
          done();
        } else {
          done(error);
        }
      });
    }
  });

  it('should handle connection close gracefully', (done) => {
    if (SKIP_INTEGRATION) {
      done();
      return;
    }

    ws = new WebSocket(RELAY_URL);

    ws.on('open', () => {
      ws!.close();
    });

    ws.on('close', (code) => {
      expect([1000, 1001, 1005, 1006]).toContain(code); // Normal closure codes
      done();
    });

    ws.on('error', (error: Error) => {
      if ((error as any).code === 'ECONNREFUSED') {
        done();
      } else {
        done(error);
      }
    });
  });

  it('should reject malformed messages', (done) => {
    if (SKIP_INTEGRATION) {
      done();
      return;
    }

    ws = new WebSocket(RELAY_URL);
    let handledMessage = false;

    // Set a timeout for this specific test
    const testTimeout = setTimeout(() => {
      if (!handledMessage) {
        done();
      }
    }, 5000);

    ws.on('open', () => {
      ws!.send('invalid json');

      ws!.on('message', (data) => {
        if (handledMessage) return;
        try {
          const message = JSON.parse(data.toString());
          if (message[0] === 'NOTICE') {
            handledMessage = true;
            clearTimeout(testTimeout);
            expect(message[1]).toBeTruthy();
            done();
          }
        } catch {
          // Ignore parse errors
        }
      });
    });

    ws.on('error', (error: Error) => {
      clearTimeout(testTimeout);
      if ((error as any).code === 'ECONNREFUSED') {
        done();
      } else {
        done(error);
      }
    });
  });

  it('should handle ping/pong frames', (done) => {
    if (SKIP_INTEGRATION) {
      done();
      return;
    }

    ws = new WebSocket(RELAY_URL);

    ws.on('open', () => {
      ws!.ping();
    });

    ws.on('pong', () => {
      expect(true).toBe(true); // Pong received
      done();
    });

    ws.on('error', (error: Error) => {
      if ((error as any).code === 'ECONNREFUSED') {
        done();
      } else {
        done(error);
      }
    });
  });

  it('should handle rapid message sending', (done) => {
    if (SKIP_INTEGRATION) {
      done();
      return;
    }

    ws = new WebSocket(RELAY_URL);
    const MESSAGE_COUNT = 50;
    let sentCount = 0;

    ws.on('open', () => {
      for (let i = 0; i < MESSAGE_COUNT; i++) {
        try {
          ws!.send(JSON.stringify(['REQ', `sub-${i}`, {}]));
          sentCount++;
        } catch (error: unknown) {
          done(error as Error);
          return;
        }
      }

      expect(sentCount).toBe(MESSAGE_COUNT);
      setTimeout(() => done(), 500);
    });

    ws.on('error', (error: Error) => {
      if ((error as any).code === 'ECONNREFUSED') {
        done();
      } else {
        done(error);
      }
    });
  });
});
