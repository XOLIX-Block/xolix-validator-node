/**
 * Questdrium Address-Shield Routing (QASR) Engine
 * RPC-layer transaction sanitizer detecting spoofed / look-alike dust addresses and preventing address poison attacks.
 * Version: v1.0.0-QuantumAether
 */
export interface AddressSanitizationResult {
    isSafe: boolean;
    isSpoofDetected: boolean;
    isDustAttack: boolean;
    similarKnownAddress?: string;
    warning?: string;
}
export declare class QuestdriumAddressShieldRouter {
    private knownUserAddresses;
    private readonly dustThresholdWei;
    registerKnownUserAddress(address: string): void;
    /**
     * Computes Levenshtein distance string similarity metric for address byte matching
     */
    private computeLevenshteinDistance;
    sanitizeRecipientAddress(recipientAddress: string, txValueWei: bigint): AddressSanitizationResult;
}
