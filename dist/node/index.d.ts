import { Block, TransactionEnvelope } from '../types/index.js';
import { XolixP2PNetworkEngine } from './p2p/index.js';
import { XolixPrometheusExporter } from './telemetry/prometheusExporter.js';
export interface NodeDaemonOptions {
    validatorAddress?: string;
    dbPath?: string;
    maxMempoolSize?: number;
    chainId?: number;
    metricsPort?: number;
}
export declare class XolixNodeDaemon {
    private consensus;
    private nativeVM;
    private evmRuntime;
    private storage;
    private p2p;
    private metricsExporter;
    private rpcServer;
    private minerInterval;
    private activeValidator;
    private lastBlockProcessingTimeMs;
    private confirmedTxHashes;
    private mempool;
    private chain;
    accountBalances: Map<string, bigint>;
    contractBytecodes: Map<string, string>;
    private accountNonces;
    private maxMempoolSize;
    constructor(options?: NodeDaemonOptions);
    private initializeOrRecoverChain;
    private initializeGenesisBlock;
    /**
     * Submit transaction to mempool with signature & preflight validation, nonce check, and WAL disk persistence.
     */
    submitTransaction(tx: TransactionEnvelope): {
        success: boolean;
        txHash: string;
        reason?: string;
    };
    /**
     * Assemble next block, verify headers, execute transactions, and commit to disk storage.
     */
    produceNextBlock(proposer: string): Block;
    getBalances(address: string): {
        address: string;
        xolt: bigint;
        gxo: bigint;
        qusd: bigint;
        stakedXol: bigint;
    };
    getBlockByNumber(blockNum: bigint): Block | null;
    getMempool(): TransactionEnvelope[];
    getLatestBlock(): Block;
    getChainHeight(): bigint;
    getP2PEngine(): XolixP2PNetworkEngine;
    getChainId(): number;
    getNonce(address: string): number;
    getChain(): Block[];
    getMetricsExporter(): XolixPrometheusExporter;
    getTransactionByHash(hash: string): {
        tx: TransactionEnvelope;
        blockHash: string;
        blockNumber: bigint;
        txIndex: number;
    } | null;
    startConsensusEngine(): void;
}
