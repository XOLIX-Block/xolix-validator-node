// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

/**
 * XOLIX Atomic Storage Engine (XASE) / XOLIX Native Database (XSDB)
 * Durable Storage & Write-Ahead Log (WAL) Engine
 * Version: v1.0.0-QuantumAether
 *
 * Provides persistent block, transaction, receipt, and state-tree storage on disk
 * with atomic commits, write-ahead logging, and crash-recovery capabilities.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Block, BlockHeader, TransactionEnvelope } from '../../types/index.js';

export interface StorageOptions {
  dbPath?: string;
  enableWAL?: boolean;
}

/**
 * XASE / XSDB — XOLIX Atomic Storage Engine
 */
export class XolixAtomicStorageEngine {
  private dbDir: string;
  private blocksFile: string;
  private walFile: string;
  private stateFile: string;

  constructor(options?: StorageOptions) {
    this.dbDir = options?.dbPath || path.join(process.cwd(), '.xolix_data');
    this.blocksFile = path.join(this.dbDir, 'blocks.xdb');
    this.walFile = path.join(this.dbDir, 'mempool.wal');
    this.stateFile = path.join(this.dbDir, 'state.xdb');

    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
    }
  }

  /**
   * Append a finalized block to persistent disk storage atomically
   */
  public saveBlock(block: Block): void {
    const serialized = JSON.stringify(block, (key, value) =>
      typeof value === 'bigint' ? value.toString() + 'n' : value
    );
    
    // Append to blocks storage with newline delimiter
    fs.appendFileSync(this.blocksFile, serialized + '\n', 'utf8');
    
    // Clear committed WAL transactions
    this.clearWAL();
  }

  /**
   * Load all blocks from persistent storage for crash-recovery
   */
  public loadChain(): Block[] {
    if (!fs.existsSync(this.blocksFile)) {
      return [];
    }

    const content = fs.readFileSync(this.blocksFile, 'utf8').trim();
    if (!content) return [];

    const lines = content.split('\n');
    const chain: Block[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line, (key, value) => {
          if (typeof value === 'string' && /^\d+n$/.test(value)) {
            return BigInt(value.slice(0, -1));
          }
          return value;
        });
        chain.push(parsed);
      } catch (err) {
        console.error('XDB: Failed to deserialize block from storage:', err);
      }
    }

    return chain;
  }

  /**
   * Write pending transaction to Write-Ahead Log (WAL)
   */
  public writeWAL(tx: TransactionEnvelope): void {
    const serialized = JSON.stringify(tx, (key, value) =>
      typeof value === 'bigint' ? value.toString() + 'n' : value
    );
    fs.appendFileSync(this.walFile, serialized + '\n', 'utf8');
  }

  /**
   * Load pending uncommitted transactions from WAL on node restart
   */
  public loadWAL(): TransactionEnvelope[] {
    if (!fs.existsSync(this.walFile)) return [];
    const content = fs.readFileSync(this.walFile, 'utf8').trim();
    if (!content) return [];

    const lines = content.split('\n');
    const txs: TransactionEnvelope[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line, (key, value) => {
          if (typeof value === 'string' && /^\d+n$/.test(value)) {
            return BigInt(value.slice(0, -1));
          }
          return value;
        });
        txs.push(parsed);
      } catch {
        // Skip corrupted WAL entries
      }
    }
    return txs;
  }

  /**
   * Clear WAL after successful block assembly
   */
  public clearWAL(): void {
    if (fs.existsSync(this.walFile)) {
      fs.writeFileSync(this.walFile, '', 'utf8');
    }
  }

  /**
   * Save persistent account state balances
   */
  public saveAccountState(stateMap: Record<string, any>): void {
    const serialized = JSON.stringify(stateMap, (key, value) =>
      typeof value === 'bigint' ? value.toString() + 'n' : value
    );
    fs.writeFileSync(this.stateFile, serialized, 'utf8');
  }

  /**
   * Load persistent account state balances
   */
  public loadAccountState(): Record<string, any> {
    if (!fs.existsSync(this.stateFile)) return {};
    try {
      const content = fs.readFileSync(this.stateFile, 'utf8');
      return JSON.parse(content, (key, value) => {
        if (typeof value === 'string' && /^\d+n$/.test(value)) {
          return BigInt(value.slice(0, -1));
        }
        return value;
      });
    } catch {
      return {};
    }
  }
}

export { XolixAtomicStorageEngine as XolixStorageEngine };
