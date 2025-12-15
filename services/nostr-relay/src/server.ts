import { WebSocketServer, WebSocket } from 'ws';
import { Database } from './db';
import { Whitelist } from './whitelist';
import { RateLimiter } from './rateLimit';
import { NostrHandlers } from './handlers';
import dotenv from 'dotenv';
import { IncomingMessage } from 'http';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8080');
const HOST = process.env.HOST || '0.0.0.0';

// Extend WebSocket to include IP address
type ExtendedWebSocket = WebSocket & {
  ip?: string;
};

class NostrRelay {
  private wss: WebSocketServer;
  private db: Database;
  private whitelist: Whitelist;
  private rateLimiter: RateLimiter;
  private handlers: NostrHandlers;

  constructor() {
    this.db = new Database();
    this.whitelist = new Whitelist();
    this.rateLimiter = new RateLimiter();
    this.handlers = new NostrHandlers(this.db, this.whitelist, this.rateLimiter);
    this.wss = new WebSocketServer({ port: PORT, host: HOST });
  }

  async start(): Promise<void> {
    await this.db.init();

    this.wss.on('connection', (ws: ExtendedWebSocket, req: IncomingMessage) => {
      // Extract IP address from request
      const ip = this.extractIP(req);
      console.log(`New client connected from ${ip}`);

      // Track connection and check rate limit
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

    // Log rate limiter configuration
    const stats = this.rateLimiter.getStats();
    console.log(`Nostr relay listening on ws://${HOST}:${PORT}`);
    console.log(`Whitelist mode: ${this.whitelist.list().length > 0 ? 'ENABLED' : 'DEVELOPMENT (all allowed)'}`);
    console.log(`Rate limits: ${stats.config.eventsPerSecond} events/sec, ${stats.config.maxConcurrentConnections} max connections per IP`);
  }

  /**
   * Extract IP address from incoming request
   * Handles X-Forwarded-For header for proxied connections
   */
  private extractIP(req: IncomingMessage): string {
    // Check X-Forwarded-For header (for proxied connections)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }

    // Check X-Real-IP header
    const realIP = req.headers['x-real-ip'];
    if (realIP) {
      return Array.isArray(realIP) ? realIP[0] : realIP;
    }

    // Fall back to socket remote address
    return req.socket.remoteAddress || 'unknown';
  }

  async stop(): Promise<void> {
    this.wss.close();
    this.rateLimiter.destroy();
    await this.db.close();
    console.log('Relay stopped');
  }
}

// Start the relay
const relay = new NostrRelay();

relay.start().catch((error) => {
  console.error('Failed to start relay:', error);
  process.exit(1);
});

// Graceful shutdown
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
