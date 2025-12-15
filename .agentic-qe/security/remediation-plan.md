# Security Remediation Plan - Fairfield Nostr GCP Deployment

**Audit Date:** 2025-12-15
**Overall Risk:** MEDIUM
**Critical Issues:** 1 | **High Issues:** 2 | **Medium Issues:** 4 | **Low Issues:** 3

---

## Critical Priority (Immediate Action Required)

### 1. SEC-001: Production Secrets Exposed in .env File
**Severity:** CRITICAL | **CVSS:** 9.1

**Issue:**
- Production admin keys stored in plaintext in `.env` file
- ADMIN_PROVKEY and ADMIN_KEY (mnemonic) visible in repository

**Status:**
- ✅ GOOD: .env is properly in .gitignore
- ✅ VERIFIED: File is NOT tracked in git history
- ❌ RISK: Secrets still in plaintext on filesystem

**Immediate Actions:**
```bash
# 1. Generate new admin keys (rotate compromised keys)
npx nostr-tools keygen

# 2. Store in GCP Secret Manager
echo -n "nsec1..." | gcloud secrets create admin-private-key \
  --data-file=- --replication-policy=automatic

# 3. Update Cloud Run to use secret
gcloud run services update nostr-relay \
  --region=us-central1 \
  --set-secrets=ADMIN_PROVKEY=admin-private-key:latest

# 4. Remove secrets from .env file (keep only non-sensitive defaults)
sed -i '/ADMIN_PROVKEY/d' .env
sed -i '/ADMIN_KEY/d' .env

# 5. Verify secret is not in git history (already verified clean)
git log --all --full-history -- .env
```

**Long-term:**
- Implement key rotation policy (quarterly)
- Use hardware security module (HSM) for production keys
- Enable Cloud Audit Logs for secret access

---

### 2. SEC-002: Missing Cryptographic Signature Verification
**Severity:** HIGH | **CVSS:** 8.1

**Issue:**
- Nostr events accepted without verifying Schnorr signatures
- Only event ID hash is verified, not the cryptographic signature
- Allows event forgery and impersonation attacks

**Immediate Fix:**
```typescript
// services/nostr-relay/src/handlers.ts

// 1. Install dependencies
// npm install @noble/secp256k1

import { schnorr } from '@noble/secp256k1';

// 2. Add signature verification method
private async verifySignature(event: NostrEvent): Promise<boolean> {
  try {
    // Schnorr signature verification per NIP-01
    const signatureValid = await schnorr.verify(
      event.sig,
      event.id,
      event.pubkey
    );
    return signatureValid;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

// 3. Update handleEvent to verify signatures
private async handleEvent(ws: WebSocket, event: NostrEvent): Promise<void> {
  // Existing validation...
  if (!this.validateEvent(event)) {
    this.sendOK(ws, event.id, false, 'invalid: event validation failed');
    return;
  }

  // Check whitelist
  if (!this.whitelist.isAllowed(event.pubkey)) {
    this.sendOK(ws, event.id, false, 'blocked: pubkey not whitelisted');
    return;
  }

  // Verify event ID
  if (!this.verifyEventId(event)) {
    this.sendOK(ws, event.id, false, 'invalid: event id verification failed');
    return;
  }

  // ✅ NEW: Verify cryptographic signature
  if (!await this.verifySignature(event)) {
    this.sendOK(ws, event.id, false, 'invalid: signature verification failed');
    return;
  }

  // Save to database...
}
```

**Testing:**
```bash
# Run unit tests to verify signature validation
npm test -- handlers.test.ts --grep "signature"
```

---

## High Priority (Within 48 Hours)

### 3. SEC-003: SQL Injection Risk in Tag Filtering
**Severity:** HIGH | **CVSS:** 7.3

**Fix:**
```typescript
// services/nostr-relay/src/db.ts:156-160

// Filter by tags (e.g., #e, #p)
for (const [key, values] of Object.entries(filter)) {
  if (key.startsWith('#') && Array.isArray(values)) {
    const tagName = key.substring(1);

    // ✅ NEW: Validate tag name (alphanumeric only)
    if (!/^[a-z0-9]+$/i.test(tagName)) {
      console.warn(`Invalid tag name: ${tagName}`);
      continue;
    }

    for (const value of values) {
      // ✅ NEW: Escape special characters in value
      const safeValue = value.replace(/["\\]/g, '\\$&');
      conditions.push(`tags LIKE ?`);
      params.push(`%["${tagName}","${safeValue}"%`);
    }
  }
}
```

---

### 4. SEC-004: Missing Rate Limiting
**Severity:** MEDIUM | **CVSS:** 5.3

**Fix:**
```typescript
// services/nostr-relay/src/server.ts

import rateLimit from 'ws-rate-limit';

class NostrRelay {
  private connectionLimits = new Map<string, number>();
  private messageLimits = new Map<string, { count: number; resetAt: number }>();

  private readonly MAX_CONNECTIONS_PER_IP = 10;
  private readonly MAX_MESSAGES_PER_SECOND = 20;

  async start(): Promise<void> {
    await this.db.init();

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientIp = req.socket.remoteAddress || 'unknown';

      // ✅ NEW: Check connection limit
      const currentConnections = this.connectionLimits.get(clientIp) || 0;
      if (currentConnections >= this.MAX_CONNECTIONS_PER_IP) {
        console.warn(`Connection limit exceeded for IP: ${clientIp}`);
        ws.close(1008, 'Connection limit exceeded');
        return;
      }

      this.connectionLimits.set(clientIp, currentConnections + 1);
      console.log(`Client connected from ${clientIp} (${currentConnections + 1} connections)`);

      ws.on('message', async (data: Buffer) => {
        // ✅ NEW: Check message rate limit
        if (!this.checkRateLimit(clientIp)) {
          ws.send(JSON.stringify(['NOTICE', 'Rate limit exceeded']));
          return;
        }

        const message = data.toString();
        await this.handlers.handleMessage(ws, message);
      });

      ws.on('close', () => {
        console.log(`Client disconnected from ${clientIp}`);
        const count = this.connectionLimits.get(clientIp) || 1;
        this.connectionLimits.set(clientIp, count - 1);
        this.handlers.handleDisconnect(ws);
      });
    });
  }

  private checkRateLimit(clientIp: string): boolean {
    const now = Date.now();
    const limit = this.messageLimits.get(clientIp);

    if (!limit || now >= limit.resetAt) {
      // Reset counter every second
      this.messageLimits.set(clientIp, {
        count: 1,
        resetAt: now + 1000
      });
      return true;
    }

    if (limit.count >= this.MAX_MESSAGES_PER_SECOND) {
      return false; // Rate limit exceeded
    }

    limit.count++;
    return true;
  }
}
```

---

## Medium Priority (Within 1 Week)

### 5. SEC-005: Weak CORS Configuration

**Fix:**
```bash
# Update Cloud Build deployment
# services/embedding-api/cloudbuild.yaml

# Replace ALLOWED_ORIGINS=* with specific domains
- '--set-env-vars'
- 'ALLOWED_ORIGINS=https://nostr-relay-617806532906.us-central1.run.app,https://your-production-domain.com'
```

---

### 6. SEC-006: Unauthenticated Embedding API

**Fix:**
```python
# services/embedding-api/main.py

from fastapi import Header, HTTPException
import os

API_KEY = os.getenv("EMBEDDING_API_KEY")

@app.post("/embed", response_model=EmbedResponse)
async def generate_embeddings(
    request: EmbedRequest,
    x_api_key: str = Header(None)
):
    """Generate embeddings (requires API key authentication)"""

    # ✅ NEW: Verify API key
    if not API_KEY or x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Existing embedding logic...
```

**Deployment:**
```bash
# Store API key in Secret Manager
openssl rand -base64 32 | gcloud secrets create embedding-api-key \
  --data-file=- --replication-policy=automatic

# Update Cloud Run
gcloud run services update embedding-api \
  --region=us-central1 \
  --set-secrets=EMBEDDING_API_KEY=embedding-api-key:latest
```

---

### 7. SEC-007: Whitelist Bypass Risk

**Fix:**
```typescript
// services/nostr-relay/src/whitelist.ts

private loadWhitelist(): void {
  const whitelistEnv = process.env.WHITELIST_PUBKEYS || '';
  const pubkeys = whitelistEnv.split(',').map(pk => pk.trim()).filter(pk => pk.length > 0);

  for (const pubkey of pubkeys) {
    this.allowedPubkeys.add(pubkey);
  }

  // ✅ NEW: Fail hard in production if whitelist is empty
  if (this.allowedPubkeys.size === 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: Whitelist cannot be empty in production mode. Set WHITELIST_PUBKEYS environment variable.');
    }
    console.warn('WARNING: Empty whitelist - allowing all pubkeys (development mode only)');
  } else {
    console.log(`Whitelist loaded with ${this.allowedPubkeys.size} pubkeys`);
  }
}
```

---

## Low Priority (Within 1 Month)

### 8. SEC-008: Verbose Error Messages

**Fix:**
```typescript
// Generic error responses to clients
this.sendNotice(ws, 'Processing error - please try again');

// Detailed logging server-side only
console.error('[ERROR]', {
  timestamp: Date.now(),
  error: error.message,
  stack: error.stack
});
```

---

### 9. SEC-009: Dependency Vulnerability Scanning

**Fix:**
```yaml
# Add to cloudbuild.yaml

- name: 'node:20'
  entrypoint: 'npm'
  args: ['audit', '--production', '--audit-level=high']
  id: 'security-scan'

- name: 'python:3.11'
  entrypoint: 'pip'
  args: ['install', 'pip-audit', '&&', 'pip-audit']
  dir: 'services/embedding-api'
  id: 'python-security-scan'
```

---

### 10. SEC-010: Missing Security Headers

**Fix:**
```typescript
// services/nostr-relay/src/server.ts

this.wss.on('connection', (ws: WebSocket, req) => {
  // ✅ NEW: Add security headers to upgrade response
  if (req.headers.upgrade === 'websocket') {
    const headers = {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    };
    // Apply headers via Cloud Run configuration
  }
});
```

---

## Compliance Checklist

### OWASP Top 10 (2021)
- [ ] A02: Cryptographic Failures - **SEC-001, SEC-002** (Critical)
- [ ] A03: Injection - **SEC-003** (High)
- [ ] A04: Insecure Design - **SEC-004** (Medium)
- [ ] A05: Security Misconfiguration - **SEC-005, SEC-008, SEC-010** (Low-Medium)
- [ ] A06: Vulnerable Components - **SEC-009** (Low)
- [ ] A07: Authentication Failures - **SEC-006** (Medium)

### PCI-DSS Requirements
- [ ] Requirement 6.5.3: Insecure cryptographic storage - **SEC-001**
- [ ] Requirement 6.5.1: Injection flaws - **SEC-003**
- [ ] Requirement 8.3: Secure authentication - **SEC-001, SEC-006**

---

## Testing Verification

After implementing fixes, run:

```bash
# Unit tests
npm test

# Integration tests with signature verification
npm run test:integration

# Security scan
npm audit --production
pip-audit

# Manual penetration testing
# - Test rate limiting with siege tool
# - Verify signature validation with forged events
# - Confirm whitelist enforcement
```

---

## Monitoring & Alerting

**Set up Cloud Monitoring alerts:**

```bash
# Alert on high connection rate (potential DoS)
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL \
  --display-name="High connection rate" \
  --condition-threshold-value=100 \
  --condition-threshold-duration=60s

# Alert on failed signature verifications
gcloud logging metrics create failed_signatures \
  --description="Failed Nostr signature verifications" \
  --log-filter='resource.type="cloud_run_revision" AND textPayload=~"signature verification failed"'
```

---

## Timeline

| Priority | Issue | ETA | Owner |
|----------|-------|-----|-------|
| CRITICAL | SEC-001: Rotate secrets | Today | DevOps |
| CRITICAL | SEC-002: Signature verification | 24h | Backend Team |
| HIGH | SEC-003: SQL injection fix | 48h | Backend Team |
| HIGH | SEC-004: Rate limiting | 48h | Backend Team |
| MEDIUM | SEC-005-007 | 1 week | Full Team |
| LOW | SEC-008-010 | 1 month | DevOps |

---

**Next Steps:**
1. Review and approve remediation plan
2. Assign owners for each issue
3. Create tracking tickets (GitHub Issues)
4. Implement fixes with TDD approach
5. Verify fixes with security testing
6. Re-audit after completion
