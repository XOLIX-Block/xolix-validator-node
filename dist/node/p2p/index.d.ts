import { Block, TransactionEnvelope } from '../../types/index.js';
import { BootnodeSeed } from './discovery/bootnodes.js';
export * from './discovery/bootnodes.js';
export interface PeerNode {
    socket?: import('net').Socket;
    peerId: string;
    address: string;
    port: number;
    score: number;
    lastSeen: number;
    isBanned: boolean;
    region?: string;
}
export declare class XolixP2PNetworkEngine {
    private MAX_PEERS;
    private peers;
    private peerSockets;
    private nodeRef;
    setNodeRef(node: any): void;
    private localPeerId;
    private chainId;
    private discoveryEngine;
    private p2pServer;
    private inboundPort;
    constructor(chainId?: number, customBootnodes?: BootnodeSeed[]);
    getLocalPeerId(): string;
    /**
     * Bootstrap connection to hardcoded static multi-region bootnodes on launch
     */
    bootstrapBootnodes(): Promise<void>;
    /**
     * Register a new peer node after validating handshake
     */
    registerPeer(peerId: string, address: string, port: number, region?: string): PeerNode;
    /**
     * Broadcast transaction envelope to all active non-banned peers
     */
    broadcastTransaction(tx: TransactionEnvelope): {
        broadcastCount: number;
    };
    /**
     * Broadcast newly produced block to validator network
     */
    broadcastBlock(block: Block): {
        broadcastCount: number;
    };
    /**
     * Apply penalization to peer for equivocation, malformed messages, or spam
     */
    /**
     * Actively dial a peer outbound — send HANDSHAKE and trigger full chain sync.
     * Called after we discover new peers via PEER_EXCHANGE.
     */
    connectToPeer(address: string, port: number, peerId: string): void;
    penalizePeer(peerId: string, penalty: number, reason: string): void;
    getActivePeerCount(): number;
    getPeers(): PeerNode[];
    /**
     * Start inbound TCP mesh networking server to accept external node connections
     */
    startServer(port?: number): Promise<void>;
    /**
     * Handle incoming socket connection and Peer Exchange (PEX)
     */
    private handleInboundConnection;
}
