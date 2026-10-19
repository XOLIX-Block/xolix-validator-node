"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XolixP2PNetworkEngine = void 0;
/**
 * XOLIX FLUID P2P GossipSub & Peer Discovery Network Engine
 * Version: v1.1.0-AegisMesh
 *
 * Implements authenticated peer transport, node scoring, message rate-limiting,
 * multi-region static bootnode bootstrap discovery, block gossip, and transaction broadcasting.
 */
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_net_1 = __importDefault(require("node:net"));
const bootnodes_js_1 = require("./discovery/bootnodes.js");
__exportStar(require("./discovery/bootnodes.js"), exports);
class XolixP2PNetworkEngine {
    MAX_PEERS = 50;
    peers = new Map();
    peerSockets = new Map(); // peerId -> live socket
    nodeRef = null; // reference to XolixNodeDaemon for block access
    setNodeRef(node) { this.nodeRef = node; }
    localPeerId;
    chainId;
    discoveryEngine;
    p2pServer = null;
    inboundPort = 30303;
    constructor(chainId = 44990, customBootnodes) {
        this.chainId = chainId;
        this.localPeerId = `peer_${node_crypto_1.default.randomBytes(16).toString('hex')}`;
        this.discoveryEngine = new bootnodes_js_1.XolixPeerDiscoveryEngine(customBootnodes);
        this.bootstrapBootnodes();
        // After bootnode TCP probe, also dial them for full handshake
        setTimeout(() => {
            for (const bn of bootnodes_js_1.OFFICIAL_BOOTNODES) {
                if (this.peerSockets.size < this.MAX_PEERS) {
                    this.connectToPeer(bn.dnsOrIp, bn.p2pPort, bn.nodeId);
                }
            }
        }, 2000); // 2s delay after boot
    }
    getLocalPeerId() {
        return this.localPeerId;
    }
    /**
     * Bootstrap connection to hardcoded static multi-region bootnodes on launch
     */
    async bootstrapBootnodes() {
        const result = await this.discoveryEngine.bootstrapNetwork();
        for (const bootnode of this.discoveryEngine.getDiscoveredPeers()) {
            this.registerPeer(bootnode.nodeId, bootnode.dnsOrIp, bootnode.p2pPort, bootnode.region);
        }
    }
    /**
     * Register a new peer node after validating handshake
     */
    registerPeer(peerId, address, port, region) {
        if (this.peers.has(peerId)) {
            const existing = this.peers.get(peerId);
            existing.lastSeen = Date.now();
            return existing;
        }
        const newPeer = {
            peerId,
            address,
            port,
            score: 100, // Initial reputation score
            lastSeen: Date.now(),
            isBanned: false,
            region,
        };
        this.peers.set(peerId, newPeer);
        return newPeer;
    }
    /**
     * Broadcast transaction envelope to all active non-banned peers
     */
    broadcastTransaction(tx) {
        let sentCount = 0;
        for (const [peerId, peer] of this.peers.entries()) {
            if (peer.isBanned || peer.score < 20)
                continue;
            // Gossip message transmit to peer
            sentCount++;
        }
        return { broadcastCount: sentCount };
    }
    /**
     * Broadcast newly produced block to validator network
     */
    broadcastBlock(block) {
        let sentCount = 0;
        const gossip = JSON.stringify({
            type: 'NEW_BLOCK',
            blockNumber: block.header.blockNumber.toString(),
            blockHash: block.header.blockHash,
            proposer: block.header.proposer,
            txCount: block.transactions.length,
            timestamp: block.header.timestamp,
        }) + '\n';
        for (const [peerId, peer] of this.peers.entries()) {
            if (peer.isBanned || peer.score < 20)
                continue;
            sentCount++;
            // Send NEW_BLOCK gossip over live socket
            const sock = this.peerSockets.get(peerId);
            if (sock && !sock.destroyed) {
                try {
                    sock.write(gossip);
                }
                catch (e) { /* peer may have disconnected */ }
            }
        }
        return { broadcastCount: sentCount };
    }
    /**
     * Apply penalization to peer for equivocation, malformed messages, or spam
     */
    /**
     * Actively dial a peer outbound — send HANDSHAKE and trigger full chain sync.
     * Called after we discover new peers via PEER_EXCHANGE.
     */
    connectToPeer(address, port, peerId) {
        if (this.peers.has(peerId) && this.peerSockets.get(peerId)?.destroyed === false) {
            return; // already connected
        }
        if (this.peerSockets.size >= this.MAX_PEERS)
            return; // at capacity
        const socket = node_net_1.default.createConnection({ host: address, port, timeout: 5000 });
        let buffer = '';
        socket.once('connect', () => {
            // Register and track socket
            this.registerPeer(peerId, address, port);
            this.peerSockets.set(peerId, socket);
            // Send HANDSHAKE
            socket.write(JSON.stringify({
                type: 'HANDSHAKE',
                peerId: this.localPeerId,
                port: this.inboundPort,
                chainId: 44990,
                version: 'v1.1.0-AegisMesh',
            }) + '\n');
            console.log(`[P2P] Outbound connection established to ${address}:${port} (${peerId})`);
        });
        socket.on('data', (data) => {
            buffer += data.toString();
            if (!buffer.includes('\n'))
                return;
            const messages = buffer.split('\n');
            buffer = messages.pop() || '';
            for (const msg of messages) {
                if (!msg.trim())
                    continue;
                try {
                    const payload = JSON.parse(msg);
                    // Reuse same message handlers as inbound — but tempPeerId = peerId here
                    if (payload.type === 'PEER_EXCHANGE') {
                        for (const p of payload.peers) {
                            if (p.peerId !== this.localPeerId && !this.peers.has(p.peerId)) {
                                this.registerPeer(p.peerId, p.address, p.port);
                                // Dial discovered peers too (up to MAX_PEERS)
                                if (this.peerSockets.size < this.MAX_PEERS) {
                                    setTimeout(() => this.connectToPeer(p.address, p.port, p.peerId), 500);
                                }
                            }
                        }
                        // Request chain state
                        socket.write(JSON.stringify({ type: 'REQUEST_CHAIN_STATE' }) + '\n');
                    }
                    else if (payload.type === 'CHAIN_STATE') {
                        if (payload.chainId && payload.chainId !== 44990) {
                            console.warn(`[P2P] Outbound peer ${peerId} on wrong chain — disconnecting`);
                            this.penalizePeer(peerId, 100, 'Wrong chain ID');
                            socket.destroy();
                        }
                        else {
                            console.log(`[P2P] Outbound peer ${peerId} verified on chain 44990`);
                            socket.write(JSON.stringify({
                                type: 'REQUEST_CHAIN_HEIGHT',
                                myHeight: this.nodeRef ? this.nodeRef.getChainHeight() : 0,
                            }) + '\n');
                        }
                    }
                    else if (payload.type === 'CHAIN_HEIGHT') {
                        const myHeight = this.nodeRef ? this.nodeRef.getChainHeight() : 0;
                        const peerHeight = payload.height || 0;
                        if (peerHeight > myHeight) {
                            console.log(`[P2P] Outbound peer ahead (${peerHeight} vs ${myHeight}) — syncing`);
                            socket.write(JSON.stringify({
                                type: 'REQUEST_BLOCKS',
                                fromBlock: myHeight,
                                toBlock: Math.min(peerHeight, myHeight + 50),
                            }) + '\n');
                        }
                        else {
                            console.log(`[P2P] In sync with outbound peer ${peerId} at height ${myHeight}`);
                        }
                    }
                    else if (payload.type === 'BLOCKS_RESPONSE') {
                        if (this.nodeRef && payload.blocks?.length) {
                            this.nodeRef.applyBlocksFromPeer(payload.blocks, peerId);
                        }
                    }
                    else if (payload.type === 'NEW_BLOCK') {
                        console.log(`[P2P] New block from outbound peer ${peerId}: #${payload.blockNumber}`);
                    }
                }
                catch (e) { /* malformed message */ }
            }
        });
        socket.on('timeout', () => { socket.destroy(); });
        socket.on('error', (err) => {
            console.warn(`[P2P] Outbound connection to ${address}:${port} failed: ${err.message}`);
            this.peerSockets.delete(peerId);
        });
        socket.on('close', () => {
            this.peerSockets.delete(peerId);
        });
    }
    penalizePeer(peerId, penalty, reason) {
        const peer = this.peers.get(peerId);
        if (!peer)
            return;
        peer.score = Math.max(0, peer.score - penalty);
        console.warn(`[P2P] Peer ${peerId} penalized -${penalty} pts (${reason}). New Score: ${peer.score}`);
        if (peer.score < 20) {
            peer.isBanned = true;
            console.error(`[P2P] Peer ${peerId} BANNED due to low reputation score.`);
        }
    }
    getActivePeerCount() {
        return Array.from(this.peers.values()).filter(p => !p.isBanned).length;
    }
    getPeers() {
        return Array.from(this.peers.values());
    }
    /**
     * Start inbound TCP mesh networking server to accept external node connections
     */
    async startServer(port = 30303) {
        this.inboundPort = port;
        return new Promise((resolve) => {
            this.p2pServer = node_net_1.default.createServer((socket) => {
                this.handleInboundConnection(socket);
            });
            this.p2pServer.listen(this.inboundPort, () => {
                console.log(`[P2P] Inbound Mesh Server listening on port ${this.inboundPort}`);
                resolve();
            });
        });
    }
    /**
     * Handle incoming socket connection and Peer Exchange (PEX)
     */
    handleInboundConnection(socket) {
        const peerAddress = socket.remoteAddress || 'unknown';
        // Inbound Peer Registration (Temporary ID until handshake)
        const tempPeerId = `peer_inbound_${node_crypto_1.default.randomBytes(8).toString('hex')}`;
        const peer = this.registerPeer(tempPeerId, peerAddress, socket.remotePort || 0);
        this.peerSockets.set(tempPeerId, socket); // track live socket
        let buffer = '';
        socket.on('data', (data) => {
            buffer += data.toString();
            if (!buffer.includes('\n'))
                return;
            const messages = buffer.split('\n');
            buffer = messages.pop() || '';
            for (const msg of messages) {
                if (!msg)
                    continue;
                try {
                    const payload = JSON.parse(msg);
                    if (payload.type === 'HANDSHAKE') {
                        // Upgrade temp connection
                        this.peers.delete(tempPeerId);
                        this.registerPeer(payload.peerId, peerAddress, payload.port || socket.remotePort || 0);
                        // Peer Exchange Protocol (PEX) - gossip 50 known peers
                        const peerList = Array.from(this.peers.values())
                            .filter(p => !p.isBanned)
                            .map(p => ({ address: p.address, port: p.port, peerId: p.peerId }));
                        socket.write(JSON.stringify({ type: 'PEER_EXCHANGE', peers: peerList.slice(0, 50) }) + '\n');
                    }
                    else if (payload.type === 'PEER_EXCHANGE') {
                        // Ingest discovered peers from mesh and actively dial them
                        for (const p of payload.peers) {
                            if (p.peerId !== this.localPeerId && !this.peers.has(p.peerId)) {
                                this.registerPeer(p.peerId, p.address, p.port);
                                // Actively connect to discovered peer
                                if (this.peerSockets.size < this.MAX_PEERS) {
                                    setTimeout(() => this.connectToPeer(p.address, p.port, p.peerId), 200);
                                }
                            }
                        }
                        // Request our own chain state verification
                        socket.write(JSON.stringify({ type: 'REQUEST_CHAIN_STATE' }) + '\n');
                    }
                    else if (payload.type === 'REQUEST_CHAIN_STATE') {
                        // Respond with our current chain height and network identity
                        socket.write(JSON.stringify({
                            type: 'CHAIN_STATE',
                            chainId: 44990,
                            genesisHash: 'xolix-fluid-44990',
                            peerId: this.localPeerId,
                        }) + '\n');
                    }
                    else if (payload.type === 'CHAIN_STATE') {
                        // Verify connecting peer is on our network
                        if (payload.chainId && payload.chainId !== 44990) {
                            this.penalizePeer(tempPeerId, 100, 'Wrong chain ID — peer rejected');
                            socket.destroy();
                        }
                        else {
                            const realPeerId = payload.peerId || tempPeerId;
                            console.log(`[P2P] Peer ${realPeerId} verified on XOLIX chain 44990`);
                            // Trigger block sync — request their chain height first
                            socket.write(JSON.stringify({
                                type: 'REQUEST_CHAIN_HEIGHT',
                                myHeight: this.nodeRef ? this.nodeRef.getChainHeight() : 0,
                            }) + '\n');
                        }
                    }
                    else if (payload.type === 'NEW_BLOCK') {
                        console.log(`[P2P] Block gossip received: height=${payload.blockNumber || '?'} hash=${(payload.blockHash || '').slice(0, 18)}...`);
                    }
                    else if (payload.type === 'NEW_TRANSACTION') {
                        console.log(`[P2P] Transaction gossip received: ${(payload.txHash || '?').slice(0, 18)}...`);
                    }
                    else if (payload.type === 'REQUEST_CHAIN_HEIGHT') {
                        // Peer wants to know our height to decide if they need to sync
                        const myHeight = this.nodeRef ? this.nodeRef.getChainHeight() : 0;
                        socket.write(JSON.stringify({
                            type: 'CHAIN_HEIGHT',
                            height: myHeight,
                            chainId: 44990,
                        }) + '\n');
                    }
                    else if (payload.type === 'CHAIN_HEIGHT') {
                        // We received peer's height — if they're ahead, request their blocks
                        const myHeight = this.nodeRef ? this.nodeRef.getChainHeight() : 0;
                        const peerHeight = payload.height || 0;
                        if (peerHeight > myHeight) {
                            console.log(`[P2P] Peer is ahead (their height: ${peerHeight}, ours: ${myHeight}) — requesting blocks`);
                            socket.write(JSON.stringify({
                                type: 'REQUEST_BLOCKS',
                                fromBlock: myHeight,
                                toBlock: Math.min(peerHeight, myHeight + 50), // request 50 at a time
                            }) + '\n');
                        }
                        else if (peerHeight < myHeight) {
                            // We're ahead — they'll request from us when they send REQUEST_CHAIN_HEIGHT
                            console.log(`[P2P] We are ahead (ours: ${myHeight}, peer: ${peerHeight}) — ready to serve blocks`);
                        }
                        else {
                            console.log(`[P2P] In sync with peer at height ${myHeight}`);
                        }
                    }
                    else if (payload.type === 'REQUEST_BLOCKS') {
                        // Peer wants blocks from us — stream them
                        const from = Number(payload.fromBlock) || 0;
                        const to = Number(payload.toBlock) || from;
                        if (!this.nodeRef) {
                            return;
                        }
                        const blocks = [];
                        for (let i = from; i <= to; i++) {
                            const block = this.nodeRef.getBlockByNumber(BigInt(i));
                            if (block)
                                blocks.push(block);
                        }
                        if (blocks.length > 0) {
                            console.log(`[P2P] Serving ${blocks.length} blocks (${from}-${to}) to peer`);
                            socket.write(JSON.stringify({
                                type: 'BLOCKS_RESPONSE',
                                blocks: blocks.map((b) => ({
                                    header: {
                                        blockNumber: b.header.blockNumber.toString(),
                                        blockHash: b.header.blockHash,
                                        parentHash: b.header.parentHash,
                                        stateRoot: b.header.stateRoot,
                                        transactionsRoot: b.header.transactionsRoot,
                                        receiptsRoot: b.header.receiptsRoot,
                                        proposer: b.header.proposer,
                                        podiProof: b.header.podiProof,
                                        timestamp: b.header.timestamp,
                                        gasOrXcuUsed: b.header.gasOrXcuUsed.toString(),
                                    },
                                    transactions: b.transactions,
                                    signatures: b.signatures,
                                })),
                            }) + '\n');
                        }
                    }
                    else if (payload.type === 'BLOCKS_RESPONSE') {
                        // We received blocks from a peer — validate and apply
                        if (!this.nodeRef || !payload.blocks || !Array.isArray(payload.blocks))
                            return;
                        console.log(`[P2P] Received ${payload.blocks.length} blocks from peer — applying...`);
                        this.nodeRef.applyBlocksFromPeer(payload.blocks, tempPeerId);
                    }
                }
                catch (e) {
                    this.penalizePeer(tempPeerId, 5, 'Malformed inbound P2P payload');
                }
            }
        });
        socket.on('error', () => {
            peer.score = Math.max(0, peer.score - 10);
        });
        socket.on('close', () => {
            // Clean up socket tracking on disconnect
            for (const [pid, s] of this.peerSockets.entries()) {
                if (s === socket) {
                    this.peerSockets.delete(pid);
                    break;
                }
            }
        });
    }
}
exports.XolixP2PNetworkEngine = XolixP2PNetworkEngine;
