// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

/**
 * XOLIX Real-Time WebSockets (WSS) RPC Subscription Server
 * Version: v0.11.0-QuantumMesh
 *
 * Implements persistent WebSocket (wss://) event streaming for eth_subscribe / xolix_subscribe
 * (newHeads, logs, pendingTransactions), pushing new blocks instantly to clients without polling.
 */

import http from 'node:http';
import crypto from 'node:crypto';
import { Block, TransactionEnvelope } from '../../types/index.js';

export interface WSSubscription {
  id: string;
  topic: 'newHeads' | 'logs' | 'pendingTransactions';
  socket: any;
}

export class XolixWebSocketServer {
  private subscriptions: Map<string, WSSubscription> = new Map();
  private server: http.Server | null = null;
  private port: number;

  constructor(port: number = 8546) {
    this.port = port;
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('XOLIX WebSocket Server Running');
      });

      this.server.on('upgrade', (req, socket, head) => {
        this.handleWSUpgrade(req, socket, head);
      });

      this.server.listen(this.port, () => {
        console.log(`[WebSocket RPC] XOLIX WSS Server listening on ws://127.0.0.1:${this.port}`);
        resolve();
      });
    });
  }

  private handleWSUpgrade(req: http.IncomingMessage, socket: any, head: Buffer): void {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }

    const acceptKey = crypto
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');

    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '\r\n',
    ];

    socket.write(headers.join('\r\n'));

    // Handle incoming client subscription frames
    socket.on('data', (buffer: Buffer) => {
      this.handleClientFrame(socket, buffer);
    });

    socket.on('close', () => {
      this.removeClientSubscriptions(socket);
    });
  }

  private handleClientFrame(socket: any, buffer: Buffer): void {
    try {
      // Decode WebSocket unmask text frame
      const payload = this.decodeWSFrame(buffer);
      if (!payload) return;

      const json = JSON.parse(payload);
      if (json.method === 'eth_subscribe' || json.method === 'xolix_subscribe') {
        const topic = json.params?.[0] || 'newHeads';
        const subId = `0x${crypto.randomBytes(16).toString('hex')}`;

        this.subscriptions.set(subId, { id: subId, topic, socket });

        const response = JSON.stringify({ jsonrpc: '2.0', result: subId, id: json.id });
        this.sendWSFrame(socket, response);
      }
    } catch (e) {
      // Ignore malformed ping/pong frame
    }
  }

  /**
   * Broadcast newly minted block immediately to all active newHeads WS subscribers
   */
  public broadcastNewBlock(block: Block): void {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_subscription',
      params: {
        subscription: 'newHeads',
        result: {
          number: '0x' + block.header.blockNumber.toString(16),
          hash: block.header.blockHash,
          parentHash: block.header.parentHash,
          stateRoot: block.header.stateRoot,
          miner: block.header.proposer,
          timestamp: '0x' + Math.floor(block.header.timestamp / 1000).toString(16),
          txCount: block.transactions.length,
        },
      },
    });

    this.subscriptions.forEach((sub) => {
      if (sub.topic === 'newHeads') {
        this.sendWSFrame(sub.socket, payload);
      }
    });
  }

  private sendWSFrame(socket: any, message: string): void {
    const buffer = Buffer.from(message, 'utf8');
    const length = buffer.length;
    let header: Buffer;

    if (length <= 125) {
      header = Buffer.from([0x81, length]);
    } else if (length <= 65535) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(length), 2);
    }

    try {
      socket.write(Buffer.concat([header, buffer]));
    } catch (e) {
      this.removeClientSubscriptions(socket);
    }
  }

  private decodeWSFrame(buffer: Buffer): string | null {
    if (buffer.length < 6) return null;
    const isFinal = (buffer[0] & 0x80) !== 0;
    const opcode = buffer[0] & 0x0f;
    if (opcode !== 1) return null; // Only handle text frame

    const isMasked = (buffer[1] & 0x80) !== 0;
    let payloadLen = buffer[1] & 0x7f;
    let offset = 2;

    if (payloadLen === 126) {
      payloadLen = buffer.readUInt16BE(2);
      offset = 4;
    } else if (payloadLen === 127) {
      payloadLen = Number(buffer.readBigUInt64BE(2));
      offset = 10;
    }

    let maskKey: Buffer | null = null;
    if (isMasked) {
      maskKey = buffer.slice(offset, offset + 4);
      offset += 4;
    }

    const payload = buffer.slice(offset, offset + payloadLen);
    if (isMasked && maskKey) {
      for (let i = 0; i < payload.length; i++) {
        payload[i] ^= maskKey[i % 4];
      }
    }

    return payload.toString('utf8');
  }

  private removeClientSubscriptions(socket: any): void {
    this.subscriptions.forEach((sub, key) => {
      if (sub.socket === socket) {
        this.subscriptions.delete(key);
      }
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
