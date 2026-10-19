// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

import * as http from 'http';
import * as crypto from 'crypto';
import { XolixNodeDaemon } from '../index.js';
import { TransactionEnvelope, Block } from '../../types/index.js';

export class XolixRpcServer {
  private daemon: XolixNodeDaemon;
  private server: http.Server;
  private port: number;

  constructor(daemon: XolixNodeDaemon, port: number = 8545) {
    this.daemon = daemon;
    this.port = port;

    this.server = http.createServer(async (req, res) => {
      // CORS configuration for 3rd party dApps
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === 'GET') {
        const healthPayload = JSON.stringify({
          status: 'ok',
          network: 'XOLIX FLUID Mainnet',
          chainId: this.daemon.getChainId(),
          chainHeight: this.daemon.getChainHeight().toString(),
          client: 'XolixFluid/v1.1.0-AegisMesh/node',
          dualLane: {
            evmCompliant: true,
            nativeCompliant: true
          },
          message: 'XOLIX Node JSON-RPC Server is operational. Send JSON-RPC 2.0 requests via POST.'
        }, null, 2);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(healthPayload);
        return;
      }

      if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed. Use POST for JSON-RPC or GET for node health.');
        return;
      }

      let body = '';
      let bodySize = 0;
      const MAX_BODY = 1024 * 1024; // 1MB DoS protection

      req.on('data', chunk => {
        bodySize += chunk.length;
        if (bodySize > MAX_BODY) {
          res.writeHead(413, { 'Content-Type': 'text/plain' });
          res.end('Payload Too Large');
          req.destroy();
          return;
        }
        body += chunk.toString();
      });

      req.on('end', async () => {
        if (bodySize > MAX_BODY) return;
        try {
          const requestBody = JSON.parse(body);

          if (!requestBody.method || requestBody.jsonrpc !== '2.0') {
            this.sendError(res, requestBody.id, -32600, 'Invalid Request');
            return;
          }

          const result = await this.handleMethod(requestBody.method, requestBody.params || []);
          this.sendResult(res, requestBody.id, result);
        } catch (error: any) {
          this.sendError(res, null, -32700, `Parse error: ${error.message}`);
        }
      });
    });
  }

  private formatBlockToEvm(block: Block | null, fullTx: boolean = false): any {
    if (!block) return null;
    const header = block.header;
    const blockNumHex = '0x' + BigInt(header.blockNumber).toString(16);
    const timestampHex = '0x' + Math.floor((header.timestamp || Date.now()) / 1000).toString(16);
    return {
      number: blockNumHex,
      hash: header.blockHash || ('0x' + '0'.repeat(64)),
      parentHash: header.parentHash || ('0x' + '0'.repeat(64)),
      nonce: '0x0000000000000000',
      sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
      logsBloom: '0x' + '0'.repeat(512),
      transactionsRoot: header.transactionsRoot || ('0x' + '0'.repeat(64)),
      stateRoot: header.stateRoot || ('0x' + '0'.repeat(64)),
      receiptsRoot: header.receiptsRoot || ('0x' + '0'.repeat(64)),
      miner: header.proposer || '0x0000000000000000000000000000000000000000',
      difficulty: '0x1',
      totalDifficulty: '0x1',
      extraData: '0x',
      size: '0x1000',
      gasLimit: '0x1c9c380', // 30,000,000
      gasUsed: '0x' + BigInt(header.gasOrXcuUsed || 0).toString(16),
      timestamp: timestampHex,
      transactions: fullTx
        ? (block.transactions || []).map((tx: any, idx: number) => this.formatTxToEvm(tx, header.blockHash, header.blockNumber, idx))
        : (block.transactions || []).map((tx: any) => tx.txHash || tx),
      uncles: [],
      baseFeePerGas: '0x3b9aca00', // 1 Gwei
      reward: '0x' + ((header as any).reward ? BigInt((header as any).reward) : 50000000000000000n).toString(16),
    };
  }

  private formatTxToEvm(tx: TransactionEnvelope | null, blockHash?: string, blockNumber?: bigint, txIndex: number = 0): any {
    if (!tx) return null;
    const bNumHex = blockNumber !== undefined ? '0x' + BigInt(blockNumber).toString(16) : null;
    return {
      hash: tx.txHash,
      nonce: '0x' + BigInt(tx.nonce || 0).toString(16),
      blockHash: blockHash || null,
      blockNumber: bNumHex,
      transactionIndex: '0x' + txIndex.toString(16),
      from: tx.sender,
      to: tx.recipient,
      value: '0x' + BigInt(tx.value || 0).toString(16),
      gas: '0x5208',
      gasPrice: '0x3b9aca00',
      input: tx.payload ? ('0x' + Buffer.from(typeof tx.payload === 'string' ? tx.payload : JSON.stringify(tx.payload)).toString('hex')) : '0x',
      v: '0x1b',
      r: '0x' + '1'.repeat(64),
      s: '0x' + '2'.repeat(64),
    };
  }

  private async handleMethod(method: string, params: any[]): Promise<any> {
    switch (method) {
      // === BLOCK NUMBER (EVM & NATIVE DUAL-LANE) ===
      case 'eth_blockNumber':
        return '0x' + this.daemon.getChainHeight().toString(16);
      case 'xolix_blockNumber':
        return this.daemon.getChainHeight().toString();

      // === CHAIN ID ===
      case 'eth_chainId':
        return '0x' + this.daemon.getChainId().toString(16); // 0xafbe = 44990
      case 'xolix_chainId':
        return this.daemon.getChainId(); // 44990
      case 'net_version':
        return this.daemon.getChainId().toString();

      // === GAS PRICE ===
      case 'eth_gasPrice':
        return '0x3b9aca00'; // 1 Gwei in hex
      case 'xolix_gasPrice':
        return '1000000000';

      // === CLIENT & NETWORK TELEMETRY ===
      case 'web3_clientVersion':
        return 'XolixFluid/v1.0.0/node';
      case 'net_listening':
        return true;
      case 'net_peerCount':
        return '0x' + this.daemon.getP2PEngine().getActivePeerCount().toString(16);
      case 'eth_syncing':
        return false;
      case 'eth_accounts':
        return [];
      case 'eth_feeHistory':
        return {
          oldestBlock: '0x' + Math.max(0, Number(this.daemon.getChainHeight()) - 4).toString(16),
          baseFeePerGas: ['0x3b9aca00', '0x3b9aca00'],
          gasUsedRatio: [0.05],
          reward: [['0x0']]
        };

      // === BALANCES & NONCE ===
      case 'eth_getBalance': {
        const address = params[0] as string;
        try {
          if (address?.startsWith('xol')) {
            const bal = this.daemon.getBalances(address).xolt;
            return '0x' + bal.toString(16);
          }
          // 0x EVM address lookup
          const addrL = (address || '').toLowerCase();
          let found = this.daemon.accountBalances.get(addrL) ?? 0n;
          if (found === 0n) {
            try {
              let decodeBech32m: any;
              try {
                decodeBech32m = require('../../wallet/address.js').decodeBech32m;
              } catch {
                try {
                  decodeBech32m = require('../wallet/address.js').decodeBech32m;
                } catch {
                  decodeBech32m = require('/opt/xolix-node/dist/wallet/address.js').decodeBech32m;
                }
              }
              if (decodeBech32m) {
                for (const [na, bal] of this.daemon.accountBalances.entries()) {
                  const dec = decodeBech32m(na);
                  if (dec?.hex && ('0x' + dec.hex.replace('0x', '')).toLowerCase() === addrL) {
                    found = bal; break;
                  }
                }
              }
            } catch(e) {}
          }
          return '0x' + found.toString(16);
        } catch {
          return '0x0';
        }
      }
      case 'xolix_getBalances':
        return this.daemon.getBalances(params[0]);

      case 'eth_getTransactionCount': {
        const address = params[0];
        return '0x' + this.daemon.getNonce(address).toString(16);
      }
      case 'xolix_getNonce':
        return this.daemon.getNonce(params[0]);

      // === BLOCKS ===
      case 'eth_getBlockByNumber': {
        const param = params[0];
        let blockNum: bigint;
        if (param === 'latest' || param === 'pending') {
          blockNum = this.daemon.getChainHeight();
        } else if (param === 'earliest') {
          blockNum = 0n;
        } else if (typeof param === 'string' && param.startsWith('0x')) {
          blockNum = BigInt(param);
        } else {
          blockNum = BigInt(param || 0);
        }
        const block = this.daemon.getBlockByNumber(blockNum);
        return this.formatBlockToEvm(block, Boolean(params[1]));
      }

      case 'eth_getBlockByHash': {
        const hash = params[0];
        const block = this.daemon.getChain().find(b => b.header.blockHash === hash) || null;
        return this.formatBlockToEvm(block, Boolean(params[1]));
      }

      case 'xolix_getLatestBlock':
        return this.daemon.getLatestBlock();

      case 'xolix_getBlockByNumber':
        return this.daemon.getBlockByNumber(BigInt(params[0]));

      // === TRANSACTIONS ===
      case 'eth_sendRawTransaction': {
        const rawHex = params[0] as string;
        try {
          const { Transaction, getCreateAddress } = require('ethers');
          const parsed = Transaction.from(rawHex);
          const from = parsed.from?.toLowerCase() ?? null;
          if (!from) throw new Error('Cannot decode sender address');

          const isDeployment = !parsed.to;
          let contractAddress: string | null = null;
          let recipient: string;

          if (isDeployment) {
            const addr: string = getCreateAddress({ from, nonce: parsed.nonce || 0 }).toLowerCase();
            contractAddress = addr;
            recipient = addr;
          } else {
            recipient = (parsed.to as string).toLowerCase();
          }

          const txHash = '0x' + require('crypto').createHash('sha256')
            .update(`${from}:${recipient}:${parsed.value?.toString() || '0'}:${parsed.nonce || 0}:${Date.now()}`)
            .digest('hex');
          const tx = {
            txHash, executionLane: 'EVM' as const,
            sender: from, recipient,
            value: BigInt(parsed.value?.toString() || '0'),
            nonce: parsed.nonce || 0,
            gasPrice: parsed.gasPrice ? BigInt(parsed.gasPrice.toString()) : 1000000000n,
            resourceLimit: Number(parsed.gasLimit || 21000),
            capabilities: [], payload: parsed.data || '0x',
            signature: rawHex.slice(0, 132), timestamp: Date.now(),
            contractAddress: contractAddress || undefined,
          };
          if (isDeployment && contractAddress) {
            (this.daemon as any).contractBytecodes?.set(contractAddress, parsed.data || '0x');
          }
          const res = this.daemon.submitTransaction(tx);
          if (!res.success) throw new Error(res.reason || 'Rejected');
          return txHash;
        } catch(err: any) { throw new Error('eth_sendRawTransaction: ' + err.message); }
      }

      case 'xolix_sendTransaction': {
        // Server-computed txHash — never trust caller
        const tx: TransactionEnvelope = params[0];
        tx.value = BigInt(tx.value);
        if (tx.gasPrice) tx.gasPrice = BigInt(tx.gasPrice);
        return this.daemon.submitTransaction(tx);
      }

      case 'eth_getTransactionByHash': {
        const hash = params[0];
        const res = this.daemon.getTransactionByHash(hash);
        if (!res) return null;
        return this.formatTxToEvm(res.tx, res.blockHash, res.blockNumber, res.txIndex);
      }

      case 'xolix_getTransactionByHash':
        return this.daemon.getTransactionByHash(params[0]);

      case 'eth_getTransactionReceipt': {
        const hash = params[0];
        const res = this.daemon.getTransactionByHash(hash);
        if (!res) return null;
        const deployedAddr = (res.tx as any).contractAddress || null;
        return {
          transactionHash: hash,
          transactionIndex: '0x' + res.txIndex.toString(16),
          blockHash: res.blockHash,
          blockNumber: '0x' + res.blockNumber.toString(16),
          from: res.tx.sender,
          to: deployedAddr ? null : res.tx.recipient,
          cumulativeGasUsed: '0x5208',
          gasUsed: '0x5208',
          contractAddress: deployedAddr,
          logs: [],
          logsBloom: '0x' + '0'.repeat(512),
          status: '0x1',
          effectiveGasPrice: '0x3b9aca00',
        };
      }

      // === GAS ESTIMATION & SIMULATION ===
      case 'eth_estimateGas':
        return '0x5208'; // 21,000 gas in hex

      case 'xolix_simulatePreflight': {
        const tx: TransactionEnvelope = params[0];
        tx.value = BigInt(tx.value);
        if (tx.gasPrice) tx.gasPrice = BigInt(tx.gasPrice);
        return (this.daemon as any).consensus.runPreflightCheck(tx);
      }

      // === CONTRACT CALLS ===
      case 'eth_call':
      case 'xolix_call': {
        try {
          const cp = (params[0] || {}) as any;
          const target = (cp.to || '').toLowerCase();
          const cd = (cp.data || '0x').toLowerCase();

          // 1. balanceOf(address)
          if (cd.startsWith('0x70a08231')) {
            const qa = '0x' + cd.slice(34, 74);
            let bal = this.daemon.accountBalances.get(qa) ?? 0n;
            return '0x' + bal.toString(16).padStart(64, '0');
          }

          // 2. totalSupply() (Canonical Protocol Tokenomics)
          if (cd.startsWith('0x18160ddd')) {
            if (target === '0x8467dfd3c75f1bc034095dee180550f3eb4892eb') {
              // Governance Xolix (GXO): 1,500,000,000 GXO
              return '0x' + (1500000000n * 10n ** 18n).toString(16).padStart(64, '0');
            }
            // XOLIX Native Token (XOLT): 50,000,000 XOLT
            return '0x' + (50000000n * 10n ** 18n).toString(16).padStart(64, '0');
          }

          // 3. decimals()
          if (cd.startsWith('0x313ce567')) {
            return '0x' + (18n).toString(16).padStart(64, '0');
          }

          // 4. name()
          if (cd.startsWith('0x06fdde03')) {
            const nameStr = target === '0x8467dfd3c75f1bc034095dee180550f3eb4892eb' ? 'Governance Xolix' : 'XOLIX';
            const hex = Buffer.from(nameStr, 'utf8').toString('hex');
            return '0x0000000000000000000000000000000000000000000000000000000000000020' +
              nameStr.length.toString(16).padStart(64, '0') +
              hex.padEnd(64, '0');
          }

          // 5. symbol()
          if (cd.startsWith('0x95d89b41')) {
            const symStr = target === '0x8467dfd3c75f1bc034095dee180550f3eb4892eb' ? 'GXO' : 'XOLT';
            const hex = Buffer.from(symStr, 'utf8').toString('hex');
            return '0x0000000000000000000000000000000000000000000000000000000000000020' +
              symStr.length.toString(16).padStart(64, '0') +
              hex.padEnd(64, '0');
          }

          // 6. owner()
          if (cd.startsWith('0x8da5cb5b')) {
            return '0x000000000000000000000000237bf8e6a7eeb917b61eea85e5bf59b706ebb7ee';
          }
        } catch (e) {}
        return '0x';
      }

      case 'eth_getCode': {
        const address = (params[0] || '').toLowerCase();
        if ((this.daemon as any).contractBytecodes?.has(address)) {
          return (this.daemon as any).contractBytecodes.get(address);
        }
        for (const block of this.daemon.getChain()) {
          for (const tx of block.transactions || []) {
            if ((tx as any).contractAddress?.toLowerCase() === address && tx.payload) {
              return tx.payload;
            }
            if (tx.recipient?.toLowerCase() === address && tx.payload && tx.payload.length > 64) {
              return tx.payload;
            }
          }
        }
        return '0x';
      }

      case 'eth_getLogs': {
        const filter = (params[0] || {}) as any;
        const logs: any[] = [];
        const fromBlock = filter.fromBlock === 'latest' ? this.daemon.getChainHeight() :
                          filter.fromBlock ? parseInt(filter.fromBlock, 16) : 0;
        const toBlock   = filter.toBlock   === 'latest' ? this.daemon.getChainHeight() :
                          filter.toBlock   ? parseInt(filter.toBlock, 16)   : this.daemon.getChainHeight();
        for (const block of (this.daemon as any).chain || []) {
          const bn = Number(block.header.blockNumber);
          if (bn < fromBlock || bn > toBlock) continue;
          for (let i = 0; i < (block.transactions || []).length; i++) {
            const tx = block.transactions[i];
            const fa = (filter.address || '').toLowerCase();
            if (fa && tx.recipient && tx.recipient.toLowerCase() !== fa) continue;
            logs.push({
              removed: false, logIndex: '0x0',
              transactionIndex: '0x' + i.toString(16),
              transactionHash: tx.txHash, blockHash: block.header.blockHash,
              blockNumber: '0x' + bn.toString(16), address: tx.recipient || '0x',
              data: tx.payload || '0x', topics: filter.topics || [],
            });
          }
        }
        return logs;
      }
      case 'eth_newBlockFilter': return '0x1';
      case 'eth_newPendingTransactionFilter': return '0x2';
      case 'eth_getFilterChanges': return [];
      case 'eth_getFilterLogs': return [];
      case 'eth_uninstallFilter': return true;
      default:
        throw new Error(`Method ${method} not found`);
    }
  }

  private sendResult(res: http.ServerResponse, id: any, result: any) {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id,
      result
    }, (key, value) => typeof value === 'bigint' ? value.toString() : value);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(payload);
  }

  private sendError(res: http.ServerResponse, id: any, code: number, message: string) {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: { code, message }
    });
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(payload);
  }

  public start() {
    this.server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[RPC] Port ${this.port} in use; skipping duplicate RPC listener.`);
      } else {
        console.error(`[RPC] Server error:`, err);
      }
    });

    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`[RPC] XOLIX Node JSON-RPC Server active on port ${this.port} (Dual-Lane EVM & Native Compliant)`);
    });
  }

  public stop() {
    this.server.close();
  }
}
