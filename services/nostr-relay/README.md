# Nostr Relay Service

Private whitelist-only Nostr relay with better-sqlite3 storage and HTTP API endpoints.

## Features

- Private whitelist-only access control
- SQLite storage with better-sqlite3 (disk-based, no memory limits)
- HTTP API for health checks and whitelist verification
- WebSocket for real-time Nostr events
- WAL mode for concurrent read performance
- NIP-01 and NIP-11 support
- Rate limiting and connection management

## Quick Start

```bash
cd services/nostr-relay
npm install
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
GET /
```

Returns relay status and statistics:
```json
{
  "status": "healthy",
  "version": "2.1.0",
  "database": "better-sqlite3",
  "events": 1234,
  "whitelisted": 10,
  "dbSizeBytes": 1048576,
  "uptime": 3600
}
```

### Whitelist Check
```
GET /api/check-whitelist?pubkey=<64-char-hex>
```

Returns whitelist status for a pubkey:
```json
{
  "isWhitelisted": true,
  "isAdmin": false,
  "cohorts": ["approved", "moomaa-tribe"],
  "verifiedAt": 1702652400000,
  "source": "relay"
}
```

### Relay Info (NIP-11)
```
GET /.well-known/nostr.json
```

Or request with `Accept: application/nostr+json` header.

### WebSocket
```
ws://localhost:8080
```

Standard Nostr relay protocol (NIP-01).

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | Server port |
| `HOST` | 0.0.0.0 | Bind address |
| `SQLITE_DATA_DIR` | ./data | Database directory |
| `WHITELIST_PUBKEYS` | (empty) | Comma-separated pubkeys |
| `ADMIN_PUBKEYS` | (empty) | Admin pubkeys (have admin cohort) |

Empty whitelist enables development mode (all pubkeys allowed).

## Database

SQLite with better-sqlite3:

- WAL mode for concurrent reads
- 64MB cache
- Automatic table creation
- Whitelist table with cohort support

Schema:
```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  pubkey TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  kind INTEGER NOT NULL,
  tags TEXT NOT NULL,
  content TEXT NOT NULL,
  sig TEXT NOT NULL,
  received_at INTEGER
);

CREATE TABLE whitelist (
  pubkey TEXT PRIMARY KEY,
  cohorts TEXT DEFAULT '[]',
  added_at INTEGER,
  added_by TEXT,
  expires_at INTEGER,
  notes TEXT
);
```

## Docker

Build and run:
```bash
docker build -t nostr-relay .
docker run -d -p 8080:8080 -v $(pwd)/data:/data nostr-relay
```

## Cloud Run Deployment

```bash
gcloud run deploy nostr-relay \
  --image gcr.io/PROJECT/nostr-relay:latest \
  --platform managed \
  --region us-central1 \
  --port 8080 \
  --add-volume name=data,type=cloud-storage,bucket=PROJECT-nostr-data \
  --add-volume-mount volume=data,mount-path=/data \
  --set-env-vars "SQLITE_DATA_DIR=/data,WHITELIST_PUBKEYS=pubkey1,pubkey2" \
  --max-instances 1 \
  --memory 512Mi
```

Use `--max-instances 1` to prevent SQLite write conflicts.

## Version

2.1.0 - better-sqlite3 with HTTP API
