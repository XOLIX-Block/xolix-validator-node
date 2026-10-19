/**
 * Xolix Replay-Attack Shield (XRAS)
 * Signature validator binding transaction signatures to the immutable ecosystem genesis hash and epoch counter.
 * Version: v1.0.0-QuantumAether
 */
export interface ReplayShieldValidation {
    isValid: boolean;
    genesisHash: string;
    epochCounter: number;
    reason?: string;
}
export declare class XolixReplayAttackShield {
    private readonly canonicalGenesisHash;
    private currentEpoch;
    private processedNonces;
    validateTransactionSignature(txHash: string, sender: string, nonce: number, boundGenesisHash: string, txEpoch: number): ReplayShieldValidation;
}
