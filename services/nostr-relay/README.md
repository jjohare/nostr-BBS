# Fairfield Nostr Relay

A whitelist-based Nostr relay with SQLite persistence, NIP-16/33/98 support, and did:nostr identity resolution.

## Features

- **Whitelist-Controlled Access** - Cohort-based access control with expiring memberships
- **SQLite Persistence** - Production-grade storage with better-sqlite3 and WAL mode
- **NIP-16 Event Treatment** - Proper handling of replaceable, ephemeral, and parameterized events
- **NIP-33 Parameterized Replaceable** - d-tag based event replacement for articles and profiles
- **NIP-98 HTTP Auth** - Schnorr signature authentication for HTTP endpoints
- **did:nostr Identity** - Decentralised identity resolution
- **Rate Limiting** - Configurable per-IP connection and event limits

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run in development
npm run dev

# Build and run production
npm run build
npm start
```

## Architecture Overview

```mermaid
graph TB
    subgraph Clients
        C1[Nostr Client]
        C2[HTTP Client]
    end

    subgraph "Fairfield Relay"
        WS[WebSocket Server]
        HTTP[HTTP Server]
        H[Handlers]
        WL[Whitelist]
        RL[Rate Limiter]
        NIP16[NIP-16 Treatment]
        NIP98[NIP-98 Auth]
        DB[(SQLite DB)]
    end

    C1 -->|ws://| WS
    C2 -->|http://| HTTP

    WS --> H
    HTTP --> NIP98
    H --> WL
    H --> RL
    H --> NIP16
    NIP16 --> DB
    WL --> DB
```

## Supported NIPs

| NIP | Description | Implementation |
|-----|-------------|----------------|
| NIP-01 | Basic Protocol | Full event/subscription handling |
| NIP-11 | Relay Information | `/.well-known/nostr.json` |
| NIP-16 | Event Treatment | Replaceable, ephemeral, regular events |
| NIP-33 | Parameterized Replaceable | d-tag based replacement |
| NIP-98 | HTTP Auth | Schnorr signature authentication |

## Event Kind Ranges

```mermaid
graph LR
    subgraph Regular["Regular (0-9999)"]
        K1[Kind 1: Note]
        K4[Kind 4: DM]
    end

    subgraph Replaceable["Replaceable (10000-19999)"]
        K0[Kind 0: Metadata]
        K3[Kind 3: Contacts]
        K10002[Kind 10002: Relay List]
    end

    subgraph Ephemeral["Ephemeral (20000-29999)"]
        K20000[Kind 20000+: Broadcast Only]
    end

    subgraph Parameterized["Parameterized (30000-39999)"]
        K30023[Kind 30023: Long-form]
    end

    Regular --> DB[(Stored)]
    Replaceable --> DB
    Ephemeral -.->|Not Stored| Broadcast((Broadcast))
    Parameterized --> DB
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP/WebSocket port |
| `HOST` | `0.0.0.0` | Bind address |
| `SQLITE_DATA_DIR` | `./data` | Database directory |
| `WHITELIST_PUBKEYS` | - | Comma-separated allowed pubkeys |
| `ADMIN_PUBKEYS` | - | Comma-separated admin pubkeys |
| `RATE_LIMIT_EVENTS_PER_SEC` | `10` | Max events per second per IP |
| `RATE_LIMIT_MAX_CONNECTIONS` | `10` | Max concurrent connections per IP |

## API Endpoints

### Health Check
```
GET /health
GET /
```

Returns relay status, version, and statistics.

### Whitelist Check
```
GET /api/check-whitelist?pubkey=<64-char-hex>
```

Check if a pubkey is whitelisted and get cohort information.

### NIP-98 Authenticated
```
GET /api/authenticated
Authorization: Nostr <base64-encoded-kind-27235-event>
```

Example authenticated endpoint demonstrating NIP-98.

### Relay Information (NIP-11)
```
GET /.well-known/nostr.json
Accept: application/nostr+json
```

## WebSocket Protocol

```mermaid
sequenceDiagram
    participant Client
    participant Relay
    participant DB

    Client->>Relay: ["EVENT", event]
    Relay->>Relay: Validate & Check Whitelist
    Relay->>Relay: NIP-16 Treatment Check
    alt Ephemeral Event
        Relay-->>Client: ["OK", id, true, ""]
        Relay-->>Relay: Broadcast (no store)
    else Regular/Replaceable
        Relay->>DB: Save Event
        Relay-->>Client: ["OK", id, true, ""]
        Relay-->>Relay: Broadcast
    end

    Client->>Relay: ["REQ", sub_id, filters...]
    Relay->>DB: Query Events
    DB-->>Relay: Matching Events
    loop Each Event
        Relay-->>Client: ["EVENT", sub_id, event]
    end
    Relay-->>Client: ["EOSE", sub_id]

    Client->>Relay: ["CLOSE", sub_id]
    Relay-->>Relay: Remove Subscription
```

## Development

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Build TypeScript
npm run build
```

## Project Structure

```
nostr-relay/
├── src/
│   ├── server.ts      # HTTP/WebSocket server
│   ├── handlers.ts    # Message handlers
│   ├── db.ts          # SQLite database
│   ├── whitelist.ts   # Access control
│   ├── rateLimit.ts   # Rate limiting
│   ├── nip16.ts       # Event treatment
│   ├── nip98.ts       # HTTP auth
│   └── did-nostr.ts   # Identity resolution
├── tests/
│   └── unit/          # Unit tests
├── data/              # SQLite database (gitignored)
└── dist/              # Compiled output
```

## Security Considerations

- **Whitelist Required**: By default, only whitelisted pubkeys can publish events
- **Signature Verification**: All events verified using Schnorr signatures
- **Rate Limiting**: Per-IP limits prevent abuse
- **NIP-98**: HTTP endpoints can require cryptographic authentication

## Licence

MIT
