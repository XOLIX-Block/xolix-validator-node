// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

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

export class XolixVelocityCircuitBreaker {
  private outflowHistory: Map<string, bigint> = new Map();
  private trippedContracts: Set<string> = new Set();
  private readonly maxSingleBlockOutflowPercent = 20; // 20% max single-block outflow limit

  /**
   * Evaluates outflow velocity before block execution commit.
   */
  public evaluateOutflow(
    contractAddress: string,
    amountOut: bigint,
    totalContractReserve: bigint
  ): { isTripped: boolean; reason?: string } {
    if (this.trippedContracts.has(contractAddress)) {
      return { isTripped: true, reason: 'XVCB: Circuit Breaker currently TRIPPED for contract.' };
    }

    if (totalContractReserve === 0n) {
      return { isTripped: false };
    }

    const currentOutflow = (this.outflowHistory.get(contractAddress) ?? 0n) + amountOut;
    const outflowPercent = Number((currentOutflow * 100n) / totalContractReserve);

    if (outflowPercent > this.maxSingleBlockOutflowPercent) {
      this.trippedContracts.add(contractAddress);
      return {
        isTripped: true,
        reason: `XVCB: Outflow velocity violation (${outflowPercent}% exceeds ${this.maxSingleBlockOutflowPercent}% limit). Circuit breaker activated.`,
      };
    }

    this.outflowHistory.set(contractAddress, currentOutflow);
    return { isTripped: false };
  }

  public resetBlockOutflow(): void {
    this.outflowHistory.clear();
  }

  public isContractTripped(contractAddress: string): boolean {
    return this.trippedContracts.has(contractAddress);
  }

  public resetCircuitBreaker(contractAddress: string, adminSig: string): boolean {
    this.trippedContracts.delete(contractAddress);
    return true;
  }
}
