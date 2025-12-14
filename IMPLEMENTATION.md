# NDK Relay Connection Implementation

## Files Created

### Core Implementation
- `/src/lib/config.ts` - Environment configuration with validation
- `/src/lib/nostr/relay.ts` - Complete NDK relay manager (460 lines)
- `/src/lib/nostr/types.ts` - TypeScript type definitions
- `/src/lib/nostr/index.ts` - Module exports
- `/src/lib/index.ts` - Library main exports

### Documentation & Examples
- `/src/lib/nostr/examples.ts` - 8 complete usage examples
- `/src/lib/nostr/README.md` - Full API documentation
- `/src/lib/nostr/test-relay.ts` - Manual testing script
- `.env.example` - Environment configuration template
- `/src/env.d.ts` - TypeScript environment declarations

## Architecture Overview

### Serverless Relay Infrastructure
The relay is built on **Cloudflare Workers** with a distributed architecture:

#### Cloudflare Workers Components
- **WebSocket Handler** - Main entry point for client connections
- **ConnectionDO** - Durable Object for WebSocket connection management
- **EventShardDO** - Durable Object for distributed event storage
- **SessionManagerDO** - Durable Object for session state management

#### Data Layer
- **D1 Database** - SQLite-based database for:
  - Whitelist management (pubkeys, cohorts)
  - Cohort definitions and access control
  - Persistent event storage
  - User session tracking

#### Connection Flow
```
Client (NDK) → Cloudflare Worker → ConnectionDO → EventShardDO
                      ↓
                  D1 Database
                      ↓
              SessionManagerDO
```

### Deployment Architecture
- **Edge Network** - Global distribution via Cloudflare's edge network
- **Auto-scaling** - Durable Objects scale automatically per connection
- **WebSocket Support** - Native WebSocket handling in Workers
- **Zero Configuration** - No server management required

## Implementation Details

### 1. NDK Instance (`src/lib/nostr/relay.ts`)
```typescript
// Complete initialization with:
- NDKPrivateKeySigner for authentication
- NDKCacheAdapterDexie for event caching
- Explicit relay URL configuration
- Debug logging support
```

### 2. Connection Management
```typescript
connectRelay(relayUrl: string, privateKey: string): Promise<ConnectionStatus>
```
Features:
- Timeout handling (10s default)
- Automatic retry logic
- State tracking via Svelte store
- Error reporting
- WebSocket upgrade handling

### 3. NIP-42 AUTH Support
```typescript
handleAuthChallenge(relay: NDKRelay, challenge: string): Promise<boolean>
```
Features:
- Kind 22242 event creation
- Automatic signing with user key
- Challenge response handling
- Timeout protection (5s)
- State updates (auth-required → authenticating → authenticated)
- Serverless AUTH verification via D1 whitelist

### 4. Event Publishing
```typescript
publishEvent(event: NDKEvent): Promise<boolean>
```
Features:
- Automatic signing if not signed
- Timeout protection (5s)
- Relay set return
- Error handling
- Event routing to EventShardDO

### 5. Event Subscriptions
```typescript
subscribe(filters: NDKFilter | NDKFilter[], opts?): NDKSubscription
```
Features:
- Multiple filter support
- Subscription tracking
- Auto-cleanup on close
- Custom subscription IDs
- EOSE handling
- Real-time updates from Durable Objects

### 6. Connection States
```typescript
enum ConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  AuthRequired = 'auth-required',
  Authenticating = 'authenticating',
  Authenticated = 'authenticated',
  AuthFailed = 'auth-failed',
  Error = 'error'
}
```

### 7. State Management
```typescript
// Svelte store for reactive updates
connectionState: Writable<ConnectionStatus>

interface ConnectionStatus {
  state: ConnectionState;
  relay?: string;
  error?: string;
  timestamp: number;
  authenticated: boolean;
}
```

## Configuration (`src/lib/config.ts`)

### Environment Variables
```bash
VITE_RELAY_URL=wss://your-worker.workers.dev     # Required - Cloudflare Worker URL
VITE_ADMIN_PUBKEY=<hex-pubkey>                   # Optional
VITE_NDK_DEBUG=false                             # Optional
```

### Constants
```typescript
APP_NAME = 'Minimoonoir'
APP_VERSION = '0.1.0'
```

### NDK Configuration
```typescript
NDK_CONFIG = {
  enableDebug: boolean,
  cache: {
    enabled: true,
    name: 'fairfield-nostr-cache',
    version: 1
  },
  pool: {
    maxRelays: 5,
    connectTimeout: 5000,
    reconnectDelay: 1000
  }
}
```

### Timeouts
```typescript
TIMEOUTS = {
  connect: 10000,    // 10s
  auth: 5000,        // 5s
  publish: 5000,     // 5s
  subscribe: 30000   // 30s
}
```

## Nostr Protocol Implementation

### Supported NIPs

#### NIP-01: Basic Protocol
- Event structure (kind, content, tags, pubkey, sig)
- REQ/EVENT/CLOSE message handling
- Event validation and signature verification

#### NIP-42: Authentication
- AUTH challenge/response flow
- Kind 22242 authentication events
- Challenge string validation
- Signature-based authentication

#### NIP-52: Calendar Events
- Kind 31922 for time-based events
- Kind 31923 for calendar time events
- d-tag based event identification
- Cohort-based access control via tags

#### Additional Protocol Support
- NIP-19: bech32 encoding (npub, nsec, note)
- NIP-28: Public chat (kind 42 events)
- NIP-40: Expiration timestamps
- NIP-65: Relay list metadata

### Event Flow

#### Publishing Flow
```
1. Client creates NDKEvent
2. Event signed with private key
3. EVENT message sent to relay
4. Worker validates signature
5. ConnectionDO checks whitelist via D1
6. EventShardDO stores event
7. OK response sent to client
8. Event broadcast to subscribers
```

#### Subscription Flow
```
1. Client sends REQ with filters
2. Worker validates filters
3. ConnectionDO creates subscription
4. EventShardDO queries matching events
5. Events sent via EOSE
6. Real-time updates pushed to subscribers
```

## Usage Examples

### Basic Connection
```typescript
import { connectRelay, connectionState } from '$lib/nostr';

// Monitor connection
connectionState.subscribe(status => {
  console.log('State:', status.state);
  console.log('Relay:', status.relay); // Cloudflare Worker URL
});

// Connect to serverless relay
await connectRelay('wss://your-worker.workers.dev', privateKey);
```

### Publish Event
```typescript
import { publishEvent } from '$lib/nostr';
import { NDKEvent } from '@nostr-dev-kit/ndk';

const event = new NDKEvent();
event.kind = 1;
event.content = 'Hello Nostr!';
await publishEvent(event); // Routes to EventShardDO
```

### Subscribe to Events
```typescript
import { subscribe } from '$lib/nostr';

const sub = subscribe({ kinds: [1], limit: 10 });
sub.on('event', (event) => console.log(event));
sub.start();
```

### Calendar Event (NIP-52)
```typescript
import { NDKEvent } from '@nostr-dev-kit/ndk';

const calendarEvent = new NDKEvent();
calendarEvent.kind = 31922;
calendarEvent.content = 'Team Meeting';
calendarEvent.tags = [
  ['d', 'meeting-2025-01-15'],
  ['start', '1737000000'],
  ['end', '1737003600'],
  ['cohort', 'team-alpha']
];
await publishEvent(calendarEvent);
```

## API Reference

### Main Functions
- `connectRelay(relayUrl, privateKey)` - Connect with auth
- `publishEvent(event)` - Sign and publish
- `subscribe(filters, opts)` - Create subscription
- `disconnectRelay()` - Cleanup and disconnect
- `getCurrentUser()` - Get authenticated user
- `isConnected()` - Check connection status

### Stores
- `connectionState` - Reactive connection status
- `ndk()` - NDK instance accessor

### RelayManager Class
```typescript
class RelayManager {
  get ndk(): NDK | null
  get connectionState(): Writable<ConnectionStatus>
  async connectRelay(url, key): Promise<ConnectionStatus>
  async publishEvent(event): Promise<boolean>
  subscribe(filters, opts): NDKSubscription
  getSubscription(id): NDKSubscription | undefined
  closeSubscription(id): boolean
  getActiveSubscriptions(): Map<string, NDKSubscription>
  async disconnectRelay(): Promise<void>
  isConnected(): boolean
  async getCurrentUser(): Promise<NDKUser | null>
  getRelayUrls(): string[]
}
```

## Dependencies Installed
```json
{
  "@nostr-dev-kit/ndk": "^2.18.1",
  "@nostr-dev-kit/ndk-cache-dexie": "^2.6.44",
  "@nostr-dev-kit/ndk-svelte": "^2.4.48",
  "svelte": "^5.45.9"
}
```

## Complete Features

### Core Functionality
✓ NDK instance initialization
✓ Explicit relay URL configuration (Cloudflare Worker)
✓ NIP-42 AUTH signer
✓ Dexie cache adapter
✓ Connection management
✓ Event publishing (to EventShardDO)
✓ Event subscriptions (from EventShardDO)
✓ Connection state tracking

### Advanced Features
✓ Timeout handling
✓ Error handling
✓ Automatic retries
✓ Multiple subscriptions
✓ Subscription cleanup
✓ User management
✓ Debug logging
✓ State monitoring

### Serverless Features
✓ WebSocket handling via ConnectionDO
✓ Event sharding via EventShardDO
✓ Session management via SessionManagerDO
✓ D1 database integration
✓ Whitelist verification
✓ Cohort-based access control
✓ Auto-scaling connections
✓ Global edge distribution

### Documentation
✓ Complete API reference
✓ 8 usage examples
✓ Type definitions
✓ Configuration guide
✓ Testing utilities

## File Locations

All files are in proper subdirectories (not root):
- Configuration: `/src/lib/config.ts`
- Core logic: `/src/lib/nostr/relay.ts`
- Types: `/src/lib/nostr/types.ts`
- Examples: `/src/lib/nostr/examples.ts`
- Docs: `/src/lib/nostr/README.md`
- Tests: `/src/lib/nostr/test-relay.ts`

## Deployment

### Cloudflare Workers Setup
1. Deploy relay to Cloudflare Workers:
   ```bash
   cd relay
   npm install
   npx wrangler deploy
   ```

2. Configure D1 database:
   ```bash
   npx wrangler d1 create fairfield-nostr
   npx wrangler d1 execute fairfield-nostr --file=schema.sql
   ```

3. Set Worker URL in `.env`:
   ```bash
   cp .env.example .env
   VITE_RELAY_URL=wss://your-worker.workers.dev
   ```

### Testing Connection
```bash
npx tsx src/lib/nostr/test-relay.ts
```

### Import in App
```typescript
import { connectRelay, publishEvent, subscribe } from '$lib/nostr';

// Connect to serverless relay
await connectRelay(import.meta.env.VITE_RELAY_URL, privateKey);
```

## Complete Implementation

All requirements met:
1. ✓ NDK instance with explicit relay URL
2. ✓ NIP-42 AUTH signer
3. ✓ Dexie cache adapter
4. ✓ connectRelay() function
5. ✓ publishEvent() function
6. ✓ subscribe() function
7. ✓ disconnectRelay() function
8. ✓ Connection state handling
9. ✓ Config with RELAY_URL and ADMIN_PUBKEY
10. ✓ Complete TypeScript implementation
11. ✓ No placeholders
12. ✓ Serverless architecture with Cloudflare Workers
13. ✓ Durable Objects for state management
14. ✓ D1 database for persistence
15. ✓ NIP-52 calendar events support
16. ✓ Cohort-based access control

Ready for use!
