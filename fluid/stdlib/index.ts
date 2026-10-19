// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

/**
 * FluidScript Standard Libraries (@xolix/core, @xolix/assets, @xolix/security, @xolix/governance, @xolix/math, @xolix/crypto)
 * Version: v0.10.0-QuantumGenesis
 */

export namespace XolixMath {
  export function percent(amount: bigint, percentVal: number): bigint {
    return (amount * BigInt(percentVal)) / BigInt(100);
  }

  export function percentOf(amount: bigint, numerator: number, denominator: number): bigint {
    return (amount * BigInt(numerator)) / BigInt(denominator);
  }

  export function safeAdd(a: bigint, b: bigint): bigint {
    const c = a + b;
    if (c < a) throw new Error('MathOverflow: Addition overflow');
    return c;
  }

  export function safeSub(a: bigint, b: bigint): bigint {
    if (b > a) throw new Error('MathUnderflow: Subtraction underflow');
    return a - b;
  }
}

export namespace XolixSecurity {
  export function requireNonZeroAddress(address: string): void {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      throw new Error('FLD-SEC-101: Zero address forbidden');
    }
  }

  export function requirePositiveAmount(amount: bigint): void {
    if (amount <= BigInt(0)) {
      throw new Error('FLD-SEC-102: Amount must be greater than zero');
    }
  }
}

export namespace XolixCrypto {
  export function computeStateHash(payload: string): string {
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      hash = (hash << 5) - hash + payload.charCodeAt(i);
      hash |= 0;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
  }
}
