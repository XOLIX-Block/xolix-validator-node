// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

/**
 * XOLIX FLUID Core Type Definitions
 * Version: v1.0.0-QuantumAether
 */

export type AddressPrefix = 'xol1' | 'xolc1' | 'xolv1' | 'xolg1' | 'xols1' | '0x';

export type NetworkId = 'xolix-mainnet-1' | 'xolix-testnet-1' | 'xolix-devnet-1';

export interface AddressInfo {
  raw: string;
  prefix: AddressPrefix;
  evmEquivalent?: string;
  isContract: boolean;
  isValidator: boolean;
}

export interface GenesisConfig {
  chainId: number;
  chainName: string;
  networkId: NetworkId;
  version: string;
  consensus: 'PoDI'; // Proof of Deterministic Invariants
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  initialValidators: string[];
  protocolTreasury: string;
  evmPrecompilesEnabled: boolean;
  /** Optional genesis balances: address -> amount in base units (decimal string). */
  alloc?: Record<string, string>;
}

export interface ResourceUsage {
  cpuUnits: number;
  stateReads: number;
  stateWrites: number;
  bandwidthBytes: number;
  cryptoOps: number;
  totalXCU: number; // XOLIX Computational Units
}

export interface CapabilityPermission {
  id: string;
  scope: string;
  grantedTo: string;
  expiresAtBlock?: number;
}

export interface TransactionEnvelope {
  txHash: string;
  sender: string;
  recipient: string;
  value: bigint;
  nonce: number;
  gasPrice?: bigint;
  payload: Uint8Array | string;
  executionLane: 'XOLIX_NATIVE' | 'EVM';
  capabilities: CapabilityPermission[];
  resourceLimit: number;
  signature: string;
  timestamp: number;
}

export interface PreflightReport {
  txHash: string;
  isValid: boolean;
  deterministicCheck: boolean;
  reentrancyCheck: boolean;
  riskScore: number;
  maxRiskThreshold: number;
  estimatedXCU: ResourceUsage;
  failureReason?: string;
}

export interface BlockHeader {
  blockNumber: bigint;
  blockHash: string;
  parentHash: string;
  stateRoot: string;
  transactionsRoot: string;
  receiptsRoot: string;
  proposer: string;
  podiProof: string;
  timestamp: number;
  gasOrXcuUsed: bigint;
  reward?: bigint;
}

export interface Block {
  header: BlockHeader;
  transactions: TransactionEnvelope[];
  signatures: string[];
}

export interface QSC20Asset {
  assetId: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  transferFeePercent: number; // e.g., 6%
  burnSharePercent: number;    // e.g., 83.33%
  treasurySharePercent: number;// e.g., 16.67%
}

export interface QSC721Asset {
  assetId: string;
  name: string;
  symbol: string;
  tokenId: bigint;
  owner: string;
  royaltyPercent: number;
  uri: string;
}

export interface QSC352RealWorldAsset {
  assetId: string;
  ownerIdentity: string;
  complianceRequired: boolean;
  restrictedTransfer: boolean;
  assetMetadataHash: string;
  historyStateRoot: string;
}

export interface QSC4900SmartAccount {
  accountAddress: string;
  ownerPasskeyHash: string;
  dailySpendingLimit: bigint;
  spentToday: bigint;
  multisigQuorum: number;
  authorizedSigners: string[];
}

export interface FluidContractState {
  contractId: string;
  publicAddress: string;
  currentImplementationHash: string;
  stateSchemaHash: string;
  version: string;
  upgradePolicy: {
    authority: 'governance' | 'immutable' | 'security_council';
    timelockBlocks: number;
    requireSimulation: boolean;
    requireSchemaCompatibility: boolean;
  };
}
