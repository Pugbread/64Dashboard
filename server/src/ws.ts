import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { config } from './config';

let wss: WebSocketServer;

export interface PurchaseBroadcast {
  gameId: string;
  playerId: string;
  productId: string;
  productName: string;
  productType: string;
  priceRobux: number;
  timestamp: string;
}

export function setupWebSocket(server: http.Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Verify JWT from query parameter
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      if (!token) {
        ws.close(4001, 'Authentication required');
        return;
      }
      jwt.verify(token, config.jwtSecret);
    } catch {
      ws.close(4001, 'Invalid token');
      return;
    }

    // Keepalive pings every 30s
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, 30000);

    ws.on('close', () => clearInterval(interval));
  });

  console.log('WebSocket server ready on /ws');
}

export function broadcastPurchase(data: PurchaseBroadcast) {
  if (!wss) return;
  const message = JSON.stringify({ type: 'purchase', data });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
