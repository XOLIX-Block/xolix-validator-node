import { TransactionEnvelope } from '../types/index.js';
/**
 * XolixBlock Micro-Fee Gas Matrix (XBF-GFM)
 * Gas delegation & sponsorship engine enabling Web3 dApps to sponsor zero-fee user transactions natively.
 * Version: v1.0.0-QuantumAether
 */
export interface GasSponsorVault {
    sponsorAddress: string;
    applicationName: string;
    sponsorKeyHash: string;
    balanceWei: bigint;
    maxGasPerTxWei: bigint;
    isActive: boolean;
}
export declare class XolixGasSponsorMatrix {
    private sponsorVaults;
    registerSponsorVault(sponsorAddress: string, appName: string, sponsorKeyHash: string, initialDepositWei: bigint, maxGasPerTxWei: bigint): GasSponsorVault;
    processSponsoredTransaction(tx: TransactionEnvelope, sponsorKeyHash: string, estimatedGasCostWei: bigint): {
        isSponsored: boolean;
        sponsorAddress?: string;
        reason?: string;
    };
}
