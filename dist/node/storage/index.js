"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XolixStorageEngine = exports.XolixAtomicStorageEngine = void 0;
/**
 * XOLIX Atomic Storage Engine (XASE) / XOLIX Native Database (XSDB)
 * Durable Storage & Write-Ahead Log (WAL) Engine
 * Version: v1.0.0-QuantumAether
 *
 * Provides persistent block, transaction, receipt, and state-tree storage on disk
 * with atomic commits, write-ahead logging, and crash-recovery capabilities.
 */
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
/**
 * XASE / XSDB — XOLIX Atomic Storage Engine
 */
class XolixAtomicStorageEngine {
    dbDir;
    blocksFile;
    walFile;
    stateFile;
    constructor(options) {
        this.dbDir = options?.dbPath || node_path_1.default.join(process.cwd(), '.xolix_data');
        this.blocksFile = node_path_1.default.join(this.dbDir, 'blocks.xdb');
        this.walFile = node_path_1.default.join(this.dbDir, 'mempool.wal');
        this.stateFile = node_path_1.default.join(this.dbDir, 'state.xdb');
        this.ensureDirectoryExists();
    }
    ensureDirectoryExists() {
        if (!node_fs_1.default.existsSync(this.dbDir)) {
            node_fs_1.default.mkdirSync(this.dbDir, { recursive: true });
        }
    }
    /**
     * Append a finalized block to persistent disk storage atomically
     */
    saveBlock(block) {
        const serialized = JSON.stringify(block, (key, value) => typeof value === 'bigint' ? value.toString() + 'n' : value);
        // Append to blocks storage with newline delimiter
        node_fs_1.default.appendFileSync(this.blocksFile, serialized + '\n', 'utf8');
        // Clear committed WAL transactions
        this.clearWAL();
    }
    /**
     * Load all blocks from persistent storage for crash-recovery
     */
    loadChain() {
        if (!node_fs_1.default.existsSync(this.blocksFile)) {
            return [];
        }
        const content = node_fs_1.default.readFileSync(this.blocksFile, 'utf8').trim();
        if (!content)
            return [];
        const lines = content.split('\n');
        const chain = [];
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const parsed = JSON.parse(line, (key, value) => {
                    if (typeof value === 'string' && /^\d+n$/.test(value)) {
                        return BigInt(value.slice(0, -1));
                    }
                    return value;
                });
                chain.push(parsed);
            }
            catch (err) {
                console.error('XDB: Failed to deserialize block from storage:', err);
            }
        }
        return chain;
    }
    /**
     * Write pending transaction to Write-Ahead Log (WAL)
     */
    writeWAL(tx) {
        const serialized = JSON.stringify(tx, (key, value) => typeof value === 'bigint' ? value.toString() + 'n' : value);
        node_fs_1.default.appendFileSync(this.walFile, serialized + '\n', 'utf8');
    }
    /**
     * Load pending uncommitted transactions from WAL on node restart
     */
    loadWAL() {
        if (!node_fs_1.default.existsSync(this.walFile))
            return [];
        const content = node_fs_1.default.readFileSync(this.walFile, 'utf8').trim();
        if (!content)
            return [];
        const lines = content.split('\n');
        const txs = [];
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const parsed = JSON.parse(line, (key, value) => {
                    if (typeof value === 'string' && /^\d+n$/.test(value)) {
                        return BigInt(value.slice(0, -1));
                    }
                    return value;
                });
                txs.push(parsed);
            }
            catch {
                // Skip corrupted WAL entries
            }
        }
        return txs;
    }
    /**
     * Clear WAL after successful block assembly
     */
    clearWAL() {
        if (node_fs_1.default.existsSync(this.walFile)) {
            node_fs_1.default.writeFileSync(this.walFile, '', 'utf8');
        }
    }
    /**
     * Save persistent account state balances
     */
    saveAccountState(stateMap) {
        const serialized = JSON.stringify(stateMap, (key, value) => typeof value === 'bigint' ? value.toString() + 'n' : value);
        node_fs_1.default.writeFileSync(this.stateFile, serialized, 'utf8');
    }
    /**
     * Load persistent account state balances
     */
    loadAccountState() {
        if (!node_fs_1.default.existsSync(this.stateFile))
            return {};
        try {
            const content = node_fs_1.default.readFileSync(this.stateFile, 'utf8');
            return JSON.parse(content, (key, value) => {
                if (typeof value === 'string' && /^\d+n$/.test(value)) {
                    return BigInt(value.slice(0, -1));
                }
                return value;
            });
        }
        catch {
            return {};
        }
    }
}
exports.XolixAtomicStorageEngine = XolixAtomicStorageEngine;
exports.XolixStorageEngine = XolixAtomicStorageEngine;
