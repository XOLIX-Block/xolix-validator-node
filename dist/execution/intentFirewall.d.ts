import { TransactionEnvelope } from '../types/index.js';
export interface ObfuscatedTxBatch {
    batchId: string;
    timestamp: number;
    transactions: TransactionEnvelope[];
    shuffledHashes: string[];
    mevRiskScore: number;
}
export declare class XolixIntentFirewall {
    private pendingBuffer;
    private batchCounter;
    /**
     * Enqueues inbound transactions into the encrypted obfuscation buffer.
     */
    enqueueTransaction(tx: TransactionEnvelope): {
        success: boolean;
        queuePosition: number;
    };
    /**
     * Batches and cryptographically shuffles transactions to eliminate order manipulation by MEV bots.
     */
    processAndShuffleBatch(batchSize?: number): ObfuscatedTxBatch;
    private evaluateBatchMevRisk;
    getBufferLength(): number;
}
