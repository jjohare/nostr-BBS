# Architecture

This document describes the internal architecture of the Fairfield Nostr Relay.

## System Overview

```mermaid
graph TB
    subgraph External
        NC[Nostr Clients]
        HC[HTTP Clients]
    end

    subgraph "Transport Layer"
        WSS[WebSocket Server<br/>ws://]
        HTTPS[HTTP Server<br/>http://]
    end

    subgraph "Application Layer"
        NH[NostrHandlers]
        N98[NIP-98 Auth]
        N11[NIP-11 Info]
    end

    subgraph "Business Logic"
        WL[Whitelist]
        RL[RateLimiter]
        N16[NIP-16 Treatment]
        SV[Signature Verification]
    end

    subgraph "Data Layer"
        DB[(SQLite<br/>better-sqlite3)]
    end

    NC -->|WebSocket| WSS
    HC -->|HTTP| HTTPS

    WSS --> NH
    HTTPS --> N98
    HTTPS --> N11

    NH --> WL
    NH --> RL
    NH --> N16
    NH --> SV
    N98 --> SV

    WL --> DB
    NH --> DB
    N16 --> DB
```

## Component Details

### Server (`server.ts`)

The main entry point orchestrating HTTP and WebSocket servers.

```mermaid
classDiagram
    class NostrRelay {
        -server: HttpServer
        -wss: WebSocketServer
        -db: NostrDatabase
        -whitelist: Whitelist
        -rateLimiter: RateLimiter
        -handlers: NostrHandlers
        +start() Promise~void~
        +stop() Promise~void~
        -handleHttpRequest()
        -extractIP()
    }

    NostrRelay --> NostrDatabase
    NostrRelay --> Whitelist
    NostrRelay --> RateLimiter
    NostrRelay --> NostrHandlers
```

### Handlers (`handlers.ts`)

Processes Nostr protocol messages (EVENT, REQ, CLOSE).

```mermaid
flowchart TD
    MSG[Incoming Message] --> PARSE{Parse JSON}
    PARSE -->|Invalid| NOTICE[Send NOTICE]
    PARSE -->|Valid| TYPE{Message Type}

    TYPE -->|EVENT| RATE{Rate Limit OK?}
    RATE -->|No| RL_NOTICE[Rate Limit NOTICE]
    RATE -->|Yes| VALIDATE{Validate Event}
    VALIDATE -->|Invalid| OK_FAIL[OK false]
    VALIDATE -->|Valid| WL{Whitelisted?}
    WL -->|No| OK_BLOCKED[OK false: blocked]
    WL -->|Yes| SIG{Verify Signature}
    SIG -->|Invalid| OK_SIG[OK false: sig]
    SIG -->|Valid| NIP16{Event Treatment}
    NIP16 -->|Ephemeral| BROADCAST[Broadcast Only]
    NIP16 -->|Other| SAVE[Save to DB]
    SAVE --> OK_SUCCESS[OK true]
    BROADCAST --> OK_SUCCESS

    TYPE -->|REQ| QUERY[Query DB]
    QUERY --> EVENTS[Send Events]
    EVENTS --> EOSE[Send EOSE]

    TYPE -->|CLOSE| REMOVE[Remove Subscription]
```

### Database (`db.ts`)

SQLite persistence with optimised indexes and WAL mode.

```mermaid
erDiagram
    EVENTS {
        string id PK "64-char hex event ID"
        string pubkey "64-char hex pubkey"
        integer created_at "Unix timestamp"
        integer kind "Event kind number"
        text tags "JSON array"
        text content "Event content"
        string sig "128-char hex signature"
        integer received_at "Server receipt time"
    }

    WHITELIST {
        string pubkey PK "64-char hex pubkey"
        text cohorts "JSON array of cohort names"
        integer added_at "Unix timestamp"
        string added_by "Admin pubkey"
        integer expires_at "Expiry timestamp"
        text notes "Admin notes"
    }
```

### NIP-16 Event Treatment (`nip16.ts`)

Determines how events are stored based on their kind.

```mermaid
graph TD
    E[Event Kind] --> CHECK{Kind Range}

    CHECK -->|0, 3| REP[Replaceable]
    CHECK -->|10000-19999| REP
    CHECK -->|20000-29999| EPH[Ephemeral]
    CHECK -->|30000-39999| PARAM[Parameterized Replaceable]
    CHECK -->|Other| REG[Regular]

    REP --> STORE_REP[Delete older<br/>pubkey+kind]
    EPH --> BROADCAST[Broadcast only<br/>no storage]
    PARAM --> STORE_PARAM[Delete older<br/>pubkey+kind+d-tag]
    REG --> STORE[Store permanently]

    STORE_REP --> DB[(Database)]
    STORE_PARAM --> DB
    STORE --> DB
```

### NIP-98 HTTP Auth (`nip98.ts`)

Authenticates HTTP requests using signed Nostr events.

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Schnorr

    Client->>Client: Create kind 27235 event
    Client->>Client: Sign with private key
    Client->>Client: Base64 encode
    Client->>Server: GET /api/authenticated<br/>Authorization: Nostr <token>

    Server->>Server: Extract token
    Server->>Server: Decode base64 JSON
    Server->>Server: Validate kind = 27235
    Server->>Server: Check timestamp ±60s
    Server->>Server: Validate URL tag
    Server->>Server: Validate method tag
    Server->>Schnorr: Verify signature
    Schnorr-->>Server: Valid/Invalid

    alt Valid
        Server-->>Client: 200 OK + pubkey
    else Invalid
        Server-->>Client: 401 Unauthorized
    end
```

### did:nostr Identity (`did-nostr.ts`)

Resolves Nostr pubkeys as decentralised identifiers.

```mermaid
graph LR
    subgraph "did:nostr Format"
        DID["did:nostr:abc123...xyz"]
    end

    subgraph Resolution
        PARSE[Parse DID] --> VALIDATE{Valid 64-char hex?}
        VALIDATE -->|No| NULL[null]
        VALIDATE -->|Yes| DOC[Create DID Document]
    end

    subgraph "DID Document"
        DOC --> ID["id: did:nostr:..."]
        DOC --> PK["pubkey: abc123..."]
        DOC --> PROFILE["profile?: {...}"]
        DOC --> AKA["alsoKnownAs?: [...]"]
    end

    DID --> PARSE
```

## Data Flow

### Event Publishing

```mermaid
flowchart LR
    subgraph Client
        C[Nostr Client]
    end

    subgraph Relay
        WS[WebSocket]
        H[Handlers]
        RL[Rate Limit]
        WL[Whitelist]
        SIG[Signature]
        N16[NIP-16]
        DB[(SQLite)]
        SUBS[Subscriptions]
    end

    C -->|1. EVENT| WS
    WS -->|2. Parse| H
    H -->|3. Check| RL
    RL -->|4. Validate| H
    H -->|5. Check| WL
    WL -->|6. Verify| SIG
    SIG -->|7. Treatment| N16
    N16 -->|8. Store| DB
    H -->|9. Broadcast| SUBS
    SUBS -->|10. EVENT| C
```

### Subscription Query

```mermaid
flowchart LR
    subgraph Client
        C[Nostr Client]
    end

    subgraph Relay
        WS[WebSocket]
        H[Handlers]
        DB[(SQLite)]
    end

    C -->|1. REQ| WS
    WS -->|2. Parse| H
    H -->|3. Query| DB
    DB -->|4. Results| H
    H -->|5. EVENT...| WS
    WS -->|6. EOSE| C
```

## Concurrency Model

The relay uses Node.js's event loop with synchronous SQLite operations via better-sqlite3:

```mermaid
graph TB
    subgraph "Event Loop"
        EL[Node.js Event Loop]
    end

    subgraph "Async Operations"
        WS[WebSocket I/O]
        HTTP[HTTP I/O]
        FS[File System]
    end

    subgraph "Sync Operations"
        SQL[SQLite Queries<br/>better-sqlite3]
    end

    EL --> WS
    EL --> HTTP
    EL --> FS
    EL --> SQL

    SQL -->|WAL Mode| CONC[Concurrent Reads<br/>Serial Writes]
```

## Security Architecture

```mermaid
graph TB
    subgraph "Perimeter"
        RL[Rate Limiter]
        WL[Whitelist]
    end

    subgraph "Validation"
        SCHEMA[Schema Validation]
        ID[Event ID Hash]
        SIG[Schnorr Signature]
    end

    subgraph "Storage"
        DB[(SQLite)]
    end

    REQUEST[Incoming Request] --> RL
    RL -->|Pass| WL
    WL -->|Allowed| SCHEMA
    SCHEMA -->|Valid| ID
    ID -->|Correct| SIG
    SIG -->|Valid| DB

    RL -->|Reject| BLOCK[Blocked]
    WL -->|Deny| BLOCK
    SCHEMA -->|Invalid| BLOCK
    ID -->|Mismatch| BLOCK
    SIG -->|Invalid| BLOCK
```
