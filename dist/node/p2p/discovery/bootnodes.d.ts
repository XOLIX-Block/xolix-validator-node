/**
 * XOLIX FLUID Peer Discovery & Bootnode Manager
 * Version: v0.11.0-QuantumMesh
 *
 * Configures static high-availability bootnode seeds across global geographic regions
 * (US-East, US-West, Europe, Asia, LATAM) for instant P2P bootstrap networking.
 */
export interface BootnodeSeed {
    nodeId: string;
    region: string;
    dnsOrIp: string;
    p2pPort: number;
    rpcPort: number;
    isStatic: boolean;
}
export declare const OFFICIAL_BOOTNODES: BootnodeSeed[];
export declare class XolixPeerDiscoveryEngine {
    private bootnodes;
    private activePeers;
    constructor(customBootnodes?: BootnodeSeed[]);
    /**
     * Bootstrap node by establishing initial connections to static global bootnode servers.
     */
    bootstrapNetwork(): Promise<{
        connectedBootnodes: number;
        totalBootnodes: number;
    }>;
    private pingBootnode;
    getDiscoveredPeers(): BootnodeSeed[];
    getBootnodes(): BootnodeSeed[];
}
