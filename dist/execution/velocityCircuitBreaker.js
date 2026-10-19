"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.XolixVelocityCircuitBreaker = void 0;
class XolixVelocityCircuitBreaker {
    outflowHistory = new Map();
    trippedContracts = new Set();
    maxSingleBlockOutflowPercent = 20; // 20% max single-block outflow limit
    /**
     * Evaluates outflow velocity before block execution commit.
     */
    evaluateOutflow(contractAddress, amountOut, totalContractReserve) {
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
    resetBlockOutflow() {
        this.outflowHistory.clear();
    }
    isContractTripped(contractAddress) {
        return this.trippedContracts.has(contractAddress);
    }
    resetCircuitBreaker(contractAddress, adminSig) {
        this.trippedContracts.delete(contractAddress);
        return true;
    }
}
exports.XolixVelocityCircuitBreaker = XolixVelocityCircuitBreaker;
