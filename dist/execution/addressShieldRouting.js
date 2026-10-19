"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestdriumAddressShieldRouter = void 0;
class QuestdriumAddressShieldRouter {
    knownUserAddresses = new Set();
    dustThresholdWei = 1000000000000n; // 0.000001 XOLT dust limit
    registerKnownUserAddress(address) {
        this.knownUserAddresses.add(address.toLowerCase());
    }
    /**
     * Computes Levenshtein distance string similarity metric for address byte matching
     */
    computeLevenshteinDistance(a, b) {
        if (a.length === 0)
            return b.length;
        if (b.length === 0)
            return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++)
            matrix[i] = [i];
        for (let j = 0; j <= a.length; j++)
            matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }
        return matrix[b.length][a.length];
    }
    sanitizeRecipientAddress(recipientAddress, txValueWei) {
        const target = recipientAddress.toLowerCase();
        const isDust = txValueWei > 0n && txValueWei <= this.dustThresholdWei;
        // Check for look-alike similarity matching (prefix/suffix match or Levenshtein distance <= 4)
        for (const known of this.knownUserAddresses) {
            if (known !== target) {
                const knownPrefix = known.slice(0, 6);
                const knownSuffix = known.slice(-4);
                const targetPrefix = target.slice(0, 6);
                const targetSuffix = target.slice(-4);
                const isPrefixSuffixSpoof = knownPrefix === targetPrefix && knownSuffix === targetSuffix;
                const distance = this.computeLevenshteinDistance(target, known);
                const isSimilaritySpoof = distance > 0 && distance <= 4;
                if (isPrefixSuffixSpoof || isSimilaritySpoof) {
                    return {
                        isSafe: false,
                        isSpoofDetected: true,
                        isDustAttack: isDust,
                        similarKnownAddress: known,
                        warning: `QASR Security Alert: Recipient address (${target}) shares look-alike similarity with known address (${known}). Address poisoning spoofing attempt detected!`,
                    };
                }
            }
        }
        return {
            isSafe: true,
            isSpoofDetected: false,
            isDustAttack: isDust,
        };
    }
}
exports.QuestdriumAddressShieldRouter = QuestdriumAddressShieldRouter;
