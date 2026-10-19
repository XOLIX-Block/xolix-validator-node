/**
 * FluidScript Standard Libraries (@xolix/core, @xolix/assets, @xolix/security, @xolix/governance, @xolix/math, @xolix/crypto)
 * Version: v0.10.0-QuantumGenesis
 */
export declare namespace XolixMath {
    function percent(amount: bigint, percentVal: number): bigint;
    function percentOf(amount: bigint, numerator: number, denominator: number): bigint;
    function safeAdd(a: bigint, b: bigint): bigint;
    function safeSub(a: bigint, b: bigint): bigint;
}
export declare namespace XolixSecurity {
    function requireNonZeroAddress(address: string): void;
    function requirePositiveAmount(amount: bigint): void;
}
export declare namespace XolixCrypto {
    function computeStateHash(payload: string): string;
}
