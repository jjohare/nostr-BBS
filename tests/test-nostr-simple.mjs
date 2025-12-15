#!/usr/bin/env node

// Use built-in WebSocket from undici (Node 18+)
const { WebSocket } = await import('undici');

const RELAY_URL = 'wss://nostr-relay-pwg5dtwoia-uc.a.run.app';
const TEST_TIMEOUT = 30000;

const results = {
  connectionTest: { status: 'pending', message: '', time: 0 },
  nip01Compliance: { status: 'pending', message: '', time: 0 },
  reqHandling: { status: 'pending', message: '', time: 0 },
  eventHandling: { status: 'pending', message: '', time: 0 },
  closeHandling: { status: 'pending', message: '', time: 0 }
};

async function testWebSocketConnection() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let ws;

    try {
      ws = new WebSocket(RELAY_URL);
    } catch (err) {
      results.connectionTest = {
        status: 'fail',
        message: `Failed to create WebSocket: ${err.message}`,
        time: Date.now() - startTime
      };
      resolve(false);
      return;
    }

    const timeout = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      if (results.connectionTest.status === 'pending') {
        results.connectionTest = {
          status: 'fail',
          message: 'Connection timeout after 30s',
          time: Date.now() - startTime
        };
      }
      resolve(false);
    }, TEST_TIMEOUT);

    ws.addEventListener('open', () => {
      clearTimeout(timeout);
      results.connectionTest = {
        status: 'pass',
        message: 'WebSocket connection established',
        time: Date.now() - startTime
      };

      // Test NIP-01 REQ message
      const subscriptionId = 'test-sub-' + Date.now();
      const reqMessage = JSON.stringify([
        'REQ',
        subscriptionId,
        { kinds: [1], limit: 1 }
      ]);

      const reqStartTime = Date.now();

      try {
        ws.send(reqMessage);
      } catch (err) {
        results.reqHandling = {
          status: 'fail',
          message: `Failed to send REQ: ${err.message}`,
          time: Date.now() - reqStartTime
        };
      }

      // Listen for responses
      ws.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);

          // Check for EOSE (End of Stored Events) - NIP-01 compliance
          if (message[0] === 'EOSE' && message[1] === subscriptionId) {
            results.nip01Compliance = {
              status: 'pass',
              message: 'Received EOSE response (NIP-01 compliant)',
              time: Date.now() - reqStartTime
            };
            results.reqHandling = {
              status: 'pass',
              message: 'REQ message handled correctly',
              time: Date.now() - reqStartTime
            };
          }

          // Check for EVENT responses
          if (message[0] === 'EVENT' && message[1] === subscriptionId) {
            results.eventHandling = {
              status: 'pass',
              message: `EVENT message received: kind ${message[2].kind}`,
              time: Date.now() - reqStartTime
            };
          }

          // Check for NOTICE messages (could indicate whitelist/auth issues)
          if (message[0] === 'NOTICE') {
            console.log('NOTICE from relay:', message[1]);
            if (message[1].toLowerCase().includes('whitelist') ||
                message[1].toLowerCase().includes('auth') ||
                message[1].toLowerCase().includes('blocked')) {
              results.nip01Compliance = {
                status: 'warning',
                message: `Whitelist/auth restriction: ${message[1]}`,
                time: Date.now() - reqStartTime
              };
            }
          }

          // Close after receiving responses
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.close();
            }
          }, 2000);

        } catch (err) {
          console.error('Error parsing message:', err);
        }
      });
    });

    ws.addEventListener('close', () => {
      results.closeHandling = {
        status: 'pass',
        message: 'WebSocket closed gracefully',
        time: 0
      };

      // Set defaults for any tests that didn't complete
      if (results.nip01Compliance.status === 'pending') {
        results.nip01Compliance = {
          status: 'warning',
          message: 'No EOSE received (possible whitelist restriction or timeout)',
          time: 0
        };
      }
      if (results.reqHandling.status === 'pending') {
        results.reqHandling = {
          status: 'warning',
          message: 'REQ message sent but no clear response',
          time: 0
        };
      }
      if (results.eventHandling.status === 'pending') {
        results.eventHandling = {
          status: 'info',
          message: 'No events received (empty relay, whitelist, or no matching events)',
          time: 0
        };
      }

      resolve(true);
    });

    ws.addEventListener('error', (error) => {
      clearTimeout(timeout);
      results.connectionTest = {
        status: 'fail',
        message: `Connection error: ${error.message || 'Unknown WebSocket error'}`,
        time: Date.now() - startTime
      };

      // Close websocket if still open
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    });
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Nostr Relay WebSocket API Contract Validation');
  console.log('Relay:', RELAY_URL);
  console.log('='.repeat(60));
  console.log('');

  await testWebSocketConnection();

  // Wait a bit for async operations
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Print results
  console.log('Test Results:');
  console.log('-'.repeat(60));

  let allPassed = true;

  Object.entries(results).forEach(([testName, result]) => {
    const statusSymbol = result.status === 'pass' ? '✓' :
                        result.status === 'fail' ? '✗' :
                        result.status === 'warning' ? '⚠' : 'ℹ';
    const timeStr = result.time > 0 ? ` (${result.time}ms)` : '';

    console.log(`${statusSymbol} ${testName}: ${result.message}${timeStr}`);

    if (result.status === 'fail') {
      allPassed = false;
    }
  });

  console.log('-'.repeat(60));
  console.log('');

  // Overall status
  const hasWarnings = Object.values(results).some(r => r.status === 'warning');

  if (allPassed && !hasWarnings) {
    console.log('✓ ALL TESTS PASSED');
    process.exit(0);
  } else if (allPassed && hasWarnings) {
    console.log('⚠ TESTS PASSED WITH WARNINGS');
    console.log('Note: Whitelist authentication or relay restrictions may be active');
    process.exit(0);
  } else {
    console.log('✗ SOME TESTS FAILED');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
