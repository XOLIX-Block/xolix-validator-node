import { Block, TransactionEnvelope } from '../../types/index.js';
export interface StorageOptions {
    dbPath?: string;
    enableWAL?: boolean;
}
/**
 * XASE / XSDB — XOLIX Atomic Storage Engine
 */
export declare class XolixAtomicStorageEngine {
    private dbDir;
    private blocksFile;
    private walFile;
    private stateFile;
    constructor(options?: StorageOptions);
    private ensureDirectoryExists;
    /**
     * Append a finalized block to persistent disk storage atomically
     */
    saveBlock(block: Block): void;
    /**
     * Load all blocks from persistent storage for crash-recovery
     */
    loadChain(): Block[];
    /**
     * Write pending transaction to Write-Ahead Log (WAL)
     */
    writeWAL(tx: TransactionEnvelope): void;
    /**
     * Load pending uncommitted transactions from WAL on node restart
     */
    loadWAL(): TransactionEnvelope[];
    /**
     * Clear WAL after successful block assembly
     */
    clearWAL(): void;
    /**
     * Save persistent account state balances
     */
    saveAccountState(stateMap: Record<string, any>): void;
    /**
     * Load persistent account state balances
     */
    loadAccountState(): Record<string, any>;
}
export { XolixAtomicStorageEngine as XolixStorageEngine };
