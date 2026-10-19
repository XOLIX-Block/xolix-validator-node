"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.XolixNodeDaemon = void 0;
const genesis_js_1 = require("../protocol/genesis.js");
// XolixValidatorRegistry contract address — set after deployment
// Until deployed, falls back to genesis initialValidators
const VALIDATOR_REGISTRY_ADDRESS = process.env.VALIDATOR_REGISTRY_ADDRESS || '';
// Validator private key — loaded from env, never stored in code
// Used to cryptographically sign each produced block
const VALIDATOR_PRIVATE_KEY = process.env.VALIDATOR_PRIVATE_KEY || '';
const podi_js_1 = require("../consensus/podi.js");
const xolixVM_js_1 = require("../execution/xolixVM.js");
const runtime_js_1 = require("../evm/runtime.js");
const index_js_1 = require("./storage/index.js");
const index_js_2 = require("./p2p/index.js");
const address_js_1 = require("../wallet/address.js");
const prometheusExporter_js_1 = require("./telemetry/prometheusExporter.js");
const server_js_1 = require("./rpc/server.js");
class XolixNodeDaemon {
    consensus;
    nativeVM;
    evmRuntime;
    storage;
    p2p;
    metricsExporter;
    rpcServer;
    minerInterval = null;
    activeValidator = null;
    lastBlockProcessingTimeMs = 12;
    confirmedTxHashes = new Set();
    mempool = [];
    chain = [];
    accountBalances = new Map(); // public for RPC server address lookup
    contractBytecodes = new Map();
    accountNonces = new Map();
    maxMempoolSize;
    constructor(options) {
        this.consensus = new podi_js_1.PoDIConsensusEngine(genesis_js_1.XOLIX_GENESIS_CONFIG.initialValidators);
        this.nativeVM = new xolixVM_js_1.XolixVirtualMachine();
        this.evmRuntime = new runtime_js_1.XolixEVMRuntime();
        this.storage = new index_js_1.XolixStorageEngine({ dbPath: options?.dbPath });
        this.p2p = new index_js_2.XolixP2PNetworkEngine(options?.chainId || 44990);
        this.maxMempoolSize = options?.maxMempoolSize || 10000;
        this.activeValidator = options?.validatorAddress || null;
        this.metricsExporter = new prometheusExporter_js_1.XolixPrometheusExporter(() => ({
            connectedPeers: this.p2p.getActivePeerCount(),
            mempoolSize: this.mempool.length,
            rpcRequestsPerSec: 0,
            blockProcessingTimeMs: this.lastBlockProcessingTimeMs,
            memoryUsageBytes: process.memoryUsage().heapUsed,
            chainHeadBlock: this.getChainHeight(),
            activeValidators: genesis_js_1.XOLIX_GENESIS_CONFIG.initialValidators.length,
        }), options?.metricsPort || 9090);
        this.rpcServer = new server_js_1.XolixRpcServer(this, 8545);
        this.p2p.setNodeRef(this); // allow P2P to access block data for sync
        this.metricsExporter.start();
        this.rpcServer.start();
        this.initializeOrRecoverChain();
    }
    initializeOrRecoverChain() {
        // 1. Recover chain state from persistent disk storage
        const recoveredChain = this.storage.loadChain();
        if (recoveredChain.length > 0) {
            this.chain = recoveredChain;
            // Replay all confirmed transactions to rebuild state
            let replayed = 0;
            for (const block of recoveredChain) {
                let blockFees = 0n;
                for (const tx of (block.transactions || [])) {
                    const val = typeof tx.value === 'bigint' ? tx.value : BigInt(tx.value || '0');
                    const gasFee = (tx.gasPrice || 1000000000n) * BigInt(tx.resourceLimit || 21000);
                    const senderBal = this.accountBalances.get(tx.sender) ?? 0n;
                    const recipBal = this.accountBalances.get(tx.recipient) ?? 0n;
                    this.accountBalances.set(tx.sender, senderBal - val - gasFee);
                    this.accountBalances.set(tx.recipient, recipBal + val);
                    this.accountNonces.set(tx.sender, tx.nonce + 1);
                    this.confirmedTxHashes.add(tx.txHash);
                    blockFees += gasFee;
                    replayed++;
                }
                if (block.header.blockNumber > 0n && block.header.proposer) {
                    const reward = block.header.reward ? BigInt(block.header.reward) : (50000000000000000n + blockFees);
                    const pBal = this.accountBalances.get(block.header.proposer) ?? 0n;
                    this.accountBalances.set(block.header.proposer, pBal + reward);
                }
            }
            if (replayed > 0)
                console.log(`[NODE] Replayed ${replayed} transactions — state rebuilt.`);
            console.log(`[NODE] Successfully recovered chain from disk storage. Height: ${this.getChainHeight()}`);
        }
        else {
            // 2. Initialize Genesis block if first boot
            this.initializeGenesisBlock();
        }
        // 3. Load uncommitted WAL mempool entries
        const walTxs = this.storage.loadWAL();
        for (const tx of walTxs) {
            this.submitTransaction(tx);
        }
    }
    initializeGenesisBlock() {
        const genesisProposer = genesis_js_1.XOLIX_GENESIS_CONFIG.initialValidators[0];
        const genesisTxRoot = '0x' + require('node:crypto').createHash('sha256').update('xolix:genesis:txroot:empty').digest('hex');
        const genesisStateRoot = '0x' + require('node:crypto').createHash('sha256').update(`xolix:genesis:state:${genesis_js_1.XOLIX_GENESIS_CONFIG.chainId}`).digest('hex');
        const genesisRecRoot = '0x' + require('node:crypto').createHash('sha256').update('xolix:genesis:receiptsroot:empty').digest('hex');
        const genesisPodiProof = '0x' + require('node:crypto').createHash('sha256').update(`xolix:genesis:podi:${genesisProposer}`).digest('hex');
        const genesisBlockHash = '0x' + require('node:crypto').createHash('sha256').update(`xolix:genesis:0:${genesis_js_1.XOLIX_GENESIS_CONFIG.chainId}:${genesisProposer}:${genesisStateRoot}`).digest('hex');
        const genesisTimestamp = Date.now();
        const genesisHeader = {
            blockNumber: BigInt(0),
            blockHash: genesisBlockHash,
            parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            stateRoot: genesisStateRoot,
            transactionsRoot: genesisTxRoot,
            receiptsRoot: genesisRecRoot,
            proposer: genesisProposer,
            podiProof: genesisPodiProof,
            timestamp: genesisTimestamp,
            gasOrXcuUsed: BigInt(0),
        };
        const genesisBlock = {
            header: genesisHeader,
            transactions: [],
            signatures: [genesisPodiProof],
        };
        this.chain.push(genesisBlock);
        // Load genesis token allocations
        try {
            const gen = require('../protocol/genesis.js');
            if (gen.XOLIX_GENESIS_CONFIG?.alloc) {
                for (const [addr, amt] of Object.entries(gen.XOLIX_GENESIS_CONFIG.alloc)) {
                    this.accountBalances.set(addr, BigInt(amt) * (10n ** 18n));
                    console.log('[NODE] Genesis alloc: ' + addr + ' = ' + amt + ' XOLT');
                }
            }
        }
        catch (e) {
            console.warn('[NODE] Genesis alloc warning:', e.message);
        }
        this.storage.saveBlock(genesisBlock);
    }
    /**
     * Submit transaction to mempool with signature & preflight validation, nonce check, and WAL disk persistence.
     */
    submitTransaction(tx) {
        // XOLIX_SECURITY_CHECKS — production security gates
        const MAX_SUPPLY = 50000000n * (10n ** 18n);
        const txValue = typeof tx.value === 'bigint' ? tx.value : BigInt(tx.value || '0');
        // 50M cap: native XOLT transfers only — contract deploys/calls are exempt
        const isContractDeployOrCall = tx.executionLane === 'EVM' ||
            (typeof tx.payload === 'string' && tx.payload !== '0x' && tx.payload.length > 2);
        if (!isContractDeployOrCall) {
            let totalSupply = 0n;
            for (const b of this.accountBalances.values()) { if (b > 0n) totalSupply += b; }
            if (totalSupply + txValue > MAX_SUPPLY) {
                return { success: false, txHash: tx.txHash, reason: 'Rejected: exceeds 50M XOLT max supply' };
            }
        }
        // Native coin transfers require non-zero value, but smart contract deployment & calls may have zero value
        const hasSmartContractPayload = Boolean(tx.payload && tx.payload !== '0x' && tx.payload.length > 2);
        if (txValue === 0n && !hasSmartContractPayload) {
            return { success: false, txHash: tx.txHash, reason: 'Zero-value transfers without contract payload not permitted' };
        }
        if (tx.sender === tx.recipient && !hasSmartContractPayload) {
            return { success: false, txHash: tx.txHash, reason: 'Self-transfers not permitted' };
        }
        // Mempool DoS Prevention: Capacity Cap Check
        if (this.mempool.length >= this.maxMempoolSize) {
            return { success: false, txHash: tx.txHash, reason: 'Mempool capacity limit reached (DoS Protection)' };
        }
        // Cryptographic & Preflight Check
        const preflight = this.consensus.runPreflightCheck(tx);
        if (!preflight.isValid) {
            return { success: false, txHash: tx.txHash, reason: preflight.failureReason };
        }
        // Nonce & Sequential Ordering Verification
        const pendingCount = this.mempool.filter(t => t.sender === tx.sender).length;
        const currentNonce = (this.accountNonces.get(tx.sender) || 0) + pendingCount;
        if (tx.nonce !== currentNonce) {
            return { success: false, txHash: tx.txHash, reason: `Invalid nonce ${tx.nonce}. Expected exactly ${currentNonce}` };
        }
        if (this.confirmedTxHashes.has(tx.txHash)) {
            return { success: false, txHash: tx.txHash, reason: 'Transaction already confirmed (replay rejected)' };
        }
        const senderBalance = this.accountBalances.get(tx.sender) ?? 0n;
        const txVal2 = typeof tx.value === 'bigint' ? tx.value : BigInt(tx.value || '0');
        const gasFeeCheck = (tx.gasPrice || 1000000000n) * BigInt(tx.resourceLimit || 21000);
        if (senderBalance < txVal2 + gasFeeCheck) {
            return { success: false, txHash: tx.txHash, reason: `Insufficient balance. Have ${senderBalance} need ${txVal2 + gasFeeCheck}` };
        }
        // end balance check
        // Duplicate tx check
        if (this.mempool.some(existing => existing.txHash === tx.txHash)) {
            return { success: false, txHash: tx.txHash, reason: 'Transaction already exists in mempool' };
        }
        // Write-Ahead Log (WAL) Disk Persistence
        this.storage.writeWAL(tx);
        this.mempool.push(tx);
        // Gossip to P2P network
        this.p2p.broadcastTransaction(tx);
        return { success: true, txHash: tx.txHash };
    }
    /**
     * Assemble next block, verify headers, execute transactions, and commit to disk storage.
     */
    produceNextBlock(proposer) {
        const startTime = Date.now();
        const latestHeader = this.chain[this.chain.length - 1].header;
        // Sort mempool by gasPrice (descending) and then timestamp (ascending) for MEV protection & fair ordering
        const txsToInclude = [...this.mempool].sort((a, b) => {
            const gasA = a.gasPrice || 0n;
            const gasB = b.gasPrice || 0n;
            if (gasA > gasB)
                return -1;
            if (gasA < gasB)
                return 1;
            return a.timestamp - b.timestamp;
        });
        this.mempool = [];
        const newBlock = this.consensus.produceBlock(proposer, latestHeader, txsToInclude);
        // Cryptographically sign the block with validator private key (async, fire-and-update)
        if (VALIDATOR_PRIVATE_KEY) {
            // Sign async and update block signatures map — next gossip will include signature
            (async () => {
                try {
                    const { Wallet } = require('ethers');
                    const { PoDIConsensusEngine } = require('../consensus/podi.js');
                    const signerWallet = new Wallet(VALIDATOR_PRIVATE_KEY.startsWith('0x') ? VALIDATOR_PRIVATE_KEY : '0x' + VALIDATOR_PRIVATE_KEY);
                    const signableHash = PoDIConsensusEngine.computeSignableBlockHash(newBlock.header);
                    const signature = await signerWallet.signMessage(signableHash);
                    newBlock.signatures = [signature];
                    console.log(`[PoDI] Block #${newBlock.header.blockNumber} signed ✅ by ${signerWallet.address}`);
                }
                catch (e) {
                    console.warn('[PoDI] Block signing failed:', e.message);
                }
            })();
        }
        else {
            console.warn('[PoDI] ⚠️  VALIDATOR_PRIVATE_KEY not set — blocks unsigned. Set env var for full trustless validation.');
        }
        // Execute transactions through dual VM lane & update state
        let totalBlockTxFees = 0n;
        for (const tx of newBlock.transactions) {
            if (tx.executionLane === 'EVM') {
                this.evmRuntime.executeEvmTransaction(tx);
            }
            else {
                this.nativeVM.executeNativeTransaction(tx);
            }
            // Update Nonce tracking
            this.accountNonces.set(tx.sender, tx.nonce + 1);
            // Debit/Credit State Ledger
            const senderBal = this.getBalances(tx.sender).xolt;
            if (senderBal >= tx.value) {
                // GAS_FEE_DEDUCT
                const gasFee2 = (tx.gasPrice || 1000000000n) * BigInt(tx.resourceLimit || 21000);
                this.accountBalances.set(tx.sender, senderBal - tx.value - gasFee2);
                const recipientBal = this.getBalances(tx.recipient).xolt;
                this.accountBalances.set(tx.recipient, recipientBal + tx.value);
                totalBlockTxFees += gasFee2;
            }
        }
        // Protocol SPoS Validator Block Reward:
        // Block subsidy is 0.05 XOLT (from 30% Staking & Validator Rewards Pool) + total gas fees collected
        const BLOCK_SUBSIDY_WEI = 50000000000000000n; // 0.05 XOLT (5 * 10^16 wei)
        const totalValidatorReward = BLOCK_SUBSIDY_WEI + totalBlockTxFees;
        const proposerBal = this.accountBalances.get(proposer) ?? 0n;
        // Route reward to registered reward address (or validator address if not set)
        const _vrMap = this.validatorRewardAddresses;
        const rewardTarget = _vrMap?.get(proposer) || proposer;
        const rewardTargetBal = this.accountBalances.get(rewardTarget) ?? 0n;
        this.accountBalances.set(rewardTarget, rewardTargetBal + totalValidatorReward);
        // Record verified reward on block header
        newBlock.header.reward = totalValidatorReward;
        // Commit finalized block to disk storage
        this.chain.push(newBlock);
        this.storage.saveBlock(newBlock);
        // Gossip block to P2P network
        this.p2p.broadcastBlock(newBlock);
        this.lastBlockProcessingTimeMs = Math.max(1, Date.now() - startTime);
        return newBlock;
    }
    getBalances(address) {
        if (!address_js_1.XolixAddressManager.isValidAddress(address)) {
            throw new Error(`Invalid target address: ${address}`);
        }
        const currentXolt = this.accountBalances.get(address) ?? 0n;
        return {
            address,
            xolt: currentXolt,
            gxo: 0n,
            qusd: 0n,
            stakedXol: 0n,
        };
    }
    getBlockByNumber(blockNum) {
        const num = Number(blockNum);
        if (num >= 0 && num < this.chain.length) {
            return this.chain[num];
        }
        return null;
    }
    getMempool() {
        return this.mempool;
    }
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }
    registerValidator(n,r){this.consensus.addValidator(n);if(!this.validatorRewardAddresses)this.validatorRewardAddresses=new Map();this.validatorRewardAddresses.set(n,r);console.log(`[NODE] Validator registered: ${n}`);}
    deregisterValidator(n){this.consensus.removeValidator(n);}
    getValidatorRewardAddress(n){return this.validatorRewardAddresses?.get(n)||n;}
    getChainHeight() {
        return this.getLatestBlock().header.blockNumber;
    }
    getP2PEngine() {
        return this.p2p;
    }
    getChainId() {
        return 44990;
    }
    getNonce(address) {
        return this.accountNonces.get(address) || 0;
    }
    getChain() {
        return this.chain;
    }
    getMetricsExporter() {
        return this.metricsExporter;
    }
    getTransactionByHash(hash) {
        for (const block of this.chain) {
            for (let i = 0; i < block.transactions.length; i++) {
                if (block.transactions[i].txHash === hash) {
                    return {
                        tx: block.transactions[i],
                        blockHash: block.header.blockHash,
                        blockNumber: block.header.blockNumber,
                        txIndex: i,
                    };
                }
            }
        }
        return null;
    }
    startConsensusEngine() {
        if (!this.activeValidator) {
            console.log('[PoDI] Node running in Observer Mode (No validator address provided).');
            return;
        }
        if (!genesis_js_1.XOLIX_GENESIS_CONFIG.initialValidators.includes(this.activeValidator)) {
            console.log(`[PoDI] Validator ${this.activeValidator} is NOT in the Genesis authorized list. Running in Observer Mode.`);
            return;
        }
        console.log(`[PoDI] Consensus Engine Started! Node is acting as Genesis Validator: ${this.activeValidator}`);
        this.minerInterval = setInterval(() => {
            if (this.mempool.length > 0) {
                console.log(`\n[PoDI] Found ${this.mempool.length} transactions in Mempool. Proposing new block...`);
                const block = this.produceNextBlock(this.activeValidator);
                // Broadcast to WebSocket subscribers
                if (global._xolixWsServer?.broadcastNewBlock) {
                    try {
                        global._xolixWsServer.broadcastNewBlock(block);
                    }
                    catch (e) { }
                }
                console.log(`[PoDI] Successfully minted Block #${block.header.blockNumber} with Hash: ${block.header.blockHash}\n`);
            }
        }, 12000); // 12s production block time
    }
}
exports.XolixNodeDaemon = XolixNodeDaemon;
