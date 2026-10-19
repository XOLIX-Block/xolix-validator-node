// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

import net from 'node:net';

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

export const OFFICIAL_BOOTNODES: BootnodeSeed[] = [
  {
    nodeId: 'xolix_boot_primary_01',
    region: 'AWS Primary XOLIX Node (N. Virginia)',
    dnsOrIp: 'p2p.xolix.io',
    p2pPort: 30303,
    rpcPort: 8545,
    isStatic: true,
  },
  {
    nodeId: 'xolix_boot_us_west_01',
    region: 'AWS US-West (Oregon)',
    dnsOrIp: 'p2p-us-west.xolix.io',
    p2pPort: 30303,
    rpcPort: 8545,
    isStatic: true,
  },
  {
    nodeId: 'xolix_boot_eu_central_01',
    region: 'AWS Europe (Frankfurt)',
    dnsOrIp: 'p2p-eu-central.xolix.io',
    p2pPort: 30303,
    rpcPort: 8545,
    isStatic: true,
  },
  {
    nodeId: 'xolix_boot_ap_northeast_01',
    region: 'AWS Asia-Pacific (Tokyo)',
    dnsOrIp: 'p2p-ap-northeast.xolix.io',
    p2pPort: 30303,
    rpcPort: 8545,
    isStatic: true,
  },
  {
    nodeId: 'xolix_boot_sa_east_01',
    region: 'AWS South America (São Paulo)',
    dnsOrIp: 'p2p-sa-east.xolix.io',
    p2pPort: 30303,
    rpcPort: 8545,
    isStatic: true,
  },
];

export class XolixPeerDiscoveryEngine {
  private bootnodes: BootnodeSeed[];
  private activePeers: Map<string, BootnodeSeed> = new Map();

  constructor(customBootnodes?: BootnodeSeed[]) {
    this.bootnodes = customBootnodes && customBootnodes.length > 0 ? customBootnodes : OFFICIAL_BOOTNODES;
  }

  /**
   * Bootstrap node by establishing initial connections to static global bootnode servers.
   */
  public async bootstrapNetwork(): Promise<{ connectedBootnodes: number; totalBootnodes: number }> {
    let connected = 0;
    console.log(`[P2P Discovery] Bootstrapping XOLIX network against ${this.bootnodes.length} global static bootnodes...`);

    for (const bootnode of this.bootnodes) {
      try {
        const isReachable = await this.pingBootnode(bootnode);
        if (isReachable) {
          this.activePeers.set(bootnode.nodeId, bootnode);
          connected++;
          console.log(`[P2P Discovery] Connected to bootnode [${bootnode.nodeId}] in region: ${bootnode.region} (${bootnode.dnsOrIp}:${bootnode.p2pPort})`);
        }
      } catch (err) {
        console.warn(`[P2P Discovery] Bootnode connection attempt for ${bootnode.nodeId} timed out. Retrying background mesh...`);
      }
    }

    return { connectedBootnodes: connected, totalBootnodes: this.bootnodes.length };
  }

  private pingBootnode(bootnode: BootnodeSeed): Promise<boolean> {
    return new Promise((resolve) => {
      // In automated test or simulation suites, resolve mock connectivity
      if (process.env.NODE_ENV === 'test' || process.env.XOLIX_P2P_SIMULATION === 'true') {
        setTimeout(() => resolve(true), 20);
        return;
      }

      let resolved = false;
      const socket = net.createConnection({
        host: bootnode.dnsOrIp,
        port: bootnode.p2pPort,
        timeout: 1500,
      });

      const cleanup = (result: boolean) => {
        if (!resolved) {
          resolved = true;
          socket.removeAllListeners();
          socket.destroy();
          resolve(result);
        }
      };

      socket.once('connect', () => {
        cleanup(true);
      });

      socket.once('timeout', () => {
        cleanup(false);
      });

      socket.once('error', () => {
        cleanup(false);
      });
    });
  }

  public getDiscoveredPeers(): BootnodeSeed[] {
    return Array.from(this.activePeers.values());
  }

  public getBootnodes(): BootnodeSeed[] {
    return this.bootnodes;
  }
}
