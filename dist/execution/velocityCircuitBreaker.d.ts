/**
 * Xolix Velocity-Circuit Breaker (XVCB)
 * Node-level execution firewall detecting rapid liquidity drain exploits.
 * Automatically halts contract execution if single-block outflow exceeds statistical thresholds.
 * Version: v1.0.0-QuantumAether
 */
export interface OutflowRecord {
    blockNumber: bigint;
    contractAddress: string;
    amountOut: bigint;
    tokenSymbol: string;
}
export declare class XolixVelocityCircuitBreaker {
    private outflowHistory;
    private trippedContracts;
    private readonly maxSingleBlockOutflowPercent;
    /**
     * Evaluates outflow velocity before block execution commit.
     */
    evaluateOutflow(contractAddress: string, amountOut: bigint, totalContractReserve: bigint): {
        isTripped: boolean;
        reason?: string;
    };
    resetBlockOutflow(): void;
    isContractTripped(contractAddress: string): boolean;
    resetCircuitBreaker(contractAddress: string, adminSig: string): boolean;
}
