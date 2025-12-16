import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { NostrDatabase } from './db';
import { Whitelist } from './whitelist';
import { RateLimiter } from './rateLimit';
import { NostrHandlers } from './handlers';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8080');
const HOST = process.env.HOST || '0.0.0.0';

type ExtendedWebSocket = WebSocket & {
  ip?: string;
};

class NostrRelay {
  private server: ReturnType<typeof createServer>;
  private wss: WebSocketServer;
  private db: NostrDatabase;
  private whitelist: Whitelist;
  private rateLimiter: RateLimiter;
  private handlers: NostrHandlers;

  constructor() {
    this.db = new NostrDatabase();
    this.whitelist = new Whitelist();
    this.rateLimiter = new RateLimiter();
    this.handlers = new NostrHandlers(this.db, this.whitelist, this.rateLimiter);

    // Create HTTP server for REST endpoints
    this.server = createServer((req, res) => this.handleHttpRequest(req, res));

    // Attach WebSocket server to HTTP server
    this.wss = new WebSocketServer({ server: this.server });
  }

  private async handleHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health check endpoint
    if (url.pathname === '/health' || url.pathname === '/') {
      const stats = await this.db.getStats();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        version: '2.1.0',
        database: 'better-sqlite3',
        events: stats.eventCount,
        whitelisted: stats.whitelistCount,
        dbSizeBytes: stats.dbSizeBytes,
        uptime: process.uptime()
      }));
      return;
    }

    // Whitelist check endpoint
    if (url.pathname === '/api/check-whitelist') {
      const pubkey = url.searchParams.get('pubkey');

      if (!pubkey || !/^[0-9a-f]{64}$/i.test(pubkey)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid pubkey format' }));
        return;
      }

      // Check environment whitelist first (backward compatible)
      const isEnvWhitelisted = this.whitelist.isAllowed(pubkey);

      // Check database whitelist
      const dbEntry = await this.db.getWhitelistEntry(pubkey);

      // Check if admin
      const adminPubkeys = (process.env.ADMIN_PUBKEYS || process.env.WHITELIST_PUBKEYS || '')
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);
      const isAdmin = adminPubkeys.includes(pubkey);

      const cohorts = dbEntry?.cohorts || [];
      if (isAdmin && !cohorts.includes('admin')) {
        cohorts.push('admin');
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        isWhitelisted: isEnvWhitelisted || !!dbEntry,
        isAdmin,
        cohorts,
        verifiedAt: Date.now(),
        source: 'relay'
      }));
      return;
    }

    // Relay info (NIP-11)
    if (url.pathname === '/.well-known/nostr.json' ||
        (req.headers.accept?.includes('application/nostr+json'))) {
      res.writeHead(200, { 'Content-Type': 'application/nostr+json' });
      res.end(JSON.stringify({
        name: 'Fairfield Nostr Relay',
        description: 'Private whitelist-only relay',
        pubkey: process.env.ADMIN_PUBKEYS?.split(',')[0] || '',
        supported_nips: [1, 11],
        software: 'fairfield-nostr-relay',
        version: '2.1.0',
        limitation: {
          auth_required: false,
          payment_required: false,
          restricted_writes: true
        }
      }));
      return;
    }

    // 404 for unknown routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  async start(): Promise<void> {
    await this.db.init();

    this.wss.on('connection', (ws: ExtendedWebSocket, req: IncomingMessage) => {
      const ip = this.extractIP(req);
      console.log(`New client connected from ${ip}`);

      if (!this.handlers.trackConnection(ws, ip)) {
        console.log(`Connection rejected from ${ip} (rate limit exceeded)`);
        ws.close(1008, 'rate limit exceeded: too many concurrent connections');
        return;
      }

      ws.on('message', async (data: Buffer) => {
        const message = data.toString();
        await this.handlers.handleMessage(ws, message);
      });

      ws.on('close', () => {
        console.log(`Client disconnected from ${ip}`);
        this.handlers.handleDisconnect(ws);
      });

      ws.on('error', (error: Error) => {
        console.error(`WebSocket error from ${ip}:`, error);
      });
    });

    this.server.listen(PORT, HOST, () => {
      const stats = this.rateLimiter.getStats();
      console.log(`Nostr relay listening on http://${HOST}:${PORT}`);
      console.log(`WebSocket: ws://${HOST}:${PORT}`);
      console.log(`Health: http://${HOST}:${PORT}/health`);
      console.log(`Whitelist API: http://${HOST}:${PORT}/api/check-whitelist`);
      console.log(`Whitelist mode: ${this.whitelist.list().length > 0 ? 'ENABLED' : 'DEVELOPMENT (all allowed)'}`);
      console.log(`Rate limits: ${stats.config.eventsPerSecond} events/sec, ${stats.config.maxConcurrentConnections} max connections per IP`);
    });
  }

  private extractIP(req: IncomingMessage): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }

    const realIP = req.headers['x-real-ip'];
    if (realIP) {
      return Array.isArray(realIP) ? realIP[0] : realIP;
    }

    return req.socket.remoteAddress || 'unknown';
  }

  async stop(): Promise<void> {
    this.wss.close();
    this.server.close();
    this.rateLimiter.destroy();
    await this.db.close();
    console.log('Relay stopped');
  }
}

const relay = new NostrRelay();

relay.start().catch((error) => {
  console.error('Failed to start relay:', error);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await relay.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await relay.stop();
  process.exit(0);
});
