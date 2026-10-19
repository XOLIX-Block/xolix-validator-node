// XOLIX FLUID Production Node Entrypoint — v1.1.0-AegisMesh
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc.
import path from 'node:path';
import { XolixNodeDaemon } from './index.js';
import { XolixWebSocketServer } from './rpc/websocketServer.js';

async function main() {
  console.log('================================================================');
  console.log('  XOLIX FLUID CORE BLOCKCHAIN PRODUCTION NODE DAEMON');
  console.log('  Version: v1.1.0-AegisMesh (Dual-Lane EVM + Native RPC)');
  console.log('================================================================\n');

  const dbPath = process.env.DB_PATH || path.join(process.cwd(), '.xolix_data');
  const wsPort = parseInt(process.env.WS_PORT || '8546', 10);
  const validatorAddress = process.env.VALIDATOR_ADDRESS || null;

  console.log('[NODE] Initializing XolixNodeDaemon...');
  console.log(`[NODE] Database: ${dbPath}`);
  if (validatorAddress) console.log(`[NODE] Validator: ${validatorAddress}`);

  // Daemon auto-starts: RPC(:8545) + Metrics(:9090)
  const daemon = new XolixNodeDaemon({ dbPath, validatorAddress } as any);
  console.log(`[NODE] Chain Height: ${daemon.getChainHeight()}`);

  // Start PoDI consensus engine (block production)
  (daemon as any).startConsensusEngine();

  // P2P network server
  console.log('[P2P]  Starting P2P server on port 30303...');
  try { await (daemon as any).p2p.startServer(30303); } catch(e: any) { console.warn('[P2P] Warning:', e.message); }

  // WebSocket server
  console.log(`[WS]   Starting WebSocket server on port ${wsPort}...`);
  const wsServer = new XolixWebSocketServer(wsPort);
  await wsServer.start();
  (global as any)._xolixWsServer = wsServer;

  console.log('\n✓ XOLIX FLUID Node is ONLINE');
  console.log('✓ JSON-RPC (eth_* + xolix_*) : https://rpc.xolix.io  → :8545');
  console.log(`✓ WebSocket (wss://)          : wss://rpc.xolix.io/ws → :${wsPort}`);
  console.log('✓ Metrics (Prometheus)        : http://127.0.0.1:9090/metrics');
  console.log('✓ P2P Gossip                  : :30303');
  console.log('✓ Chain ID                    : 44990 (0xafbe)\n');

  process.on('SIGINT',  () => { console.log('\n[NODE] SIGINT — shutting down...'); process.exit(0); });
  process.on('SIGTERM', () => { console.log('\n[NODE] SIGTERM — shutting down...'); process.exit(0); });
}

main().catch(err => {
  console.error('[NODE FATAL ERROR]', err);
  process.exit(1);
});
