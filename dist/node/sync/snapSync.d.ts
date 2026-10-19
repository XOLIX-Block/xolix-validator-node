import { BlockHeader } from '../../types/index.js';
export interface StateTrieSnapshotChunk {
    chunkIndex: number;
    totalChunks: number;
    startAccountHash: string;
    endAccountHash: string;
    accountStateData: Record<string, {
        balance: string;
        nonce: number;
        codeHash: string;
        storageRoot: string;
    }>;
    chunkHash: string;
}
export interface SnapSyncProgress {
    isSyncing: boolean;
    syncMode: 'GENESIS_FULL' | 'SNAP_SYNC' | 'COMPLETED';
    pivotBlockNumber: bigint;
    pivotStateRoot: string;
    downloadedChunks: number;
    totalChunks: number;
    syncedAccounts: number;
}
export declare class XolixSnapSyncEngine {
    private isSyncing;
    private syncMode;
    private progress;
    constructor();
    /**
     * Request recent state snapshot pivot block header from mesh peers and execute Snap Sync.
     */
    executeSnapSync(latestPeerHeader: BlockHeader, fetchSnapshotChunk: (pivotBlock: bigint, chunkIdx: number) => Promise<StateTrieSnapshotChunk>, applySnapshotToDB: (accounts: Record<string, any>) => void): Promise<{
        success: boolean;
        pivotBlockNumber: bigint;
        totalAccountsSynced: number;
    }>;
    getSyncProgress(): SnapSyncProgress;
}
