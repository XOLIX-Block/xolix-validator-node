/**
 * RAISE Flash-Loan Deflector (R-FLD) Engine
 * Consensus execution hook detecting atomic multi-contract price manipulation & flash-loan vectors.
 * Version: v1.0.0-QuantumAether
 */
export interface FlashLoanCheckResult {
    isFlashLoanDetected: boolean;
    varianceTaxMultiplier: number;
    shouldRevert: boolean;
    reason?: string;
    riskScore: number;
}
export declare class RaiseFlashLoanDeflector {
    private readonly maxPriceVariancePercent;
    private readonly maxBorrowedThresholdWei;
    /**
     * Scans transaction call trace for rapid multi-pool arbitrage, volume-weighted price shifts, and oracle price distortions.
     */
    analyzeTransactionTrace(callChain: string[], initialPriceUSD: number, finalPriceUSD: number, borrowedAmount: bigint, poolVolumeUSD?: number): FlashLoanCheckResult;
}
