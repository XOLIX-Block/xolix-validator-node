"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.XolixReplayAttackShield = void 0;
class XolixReplayAttackShield {
    canonicalGenesisHash = '0x44990_genesis_hash_xolix_fluid_core_v1';
    currentEpoch = 100;
    processedNonces = new Set();
    validateTransactionSignature(txHash, sender, nonce, boundGenesisHash, txEpoch) {
        const replayKey = `${sender}:${nonce}`;
        if (boundGenesisHash !== this.canonicalGenesisHash) {
            return {
                isValid: false,
                genesisHash: boundGenesisHash,
                epochCounter: txEpoch,
                reason: 'XRAS: Genesis hash mismatch! Signature originated from a foreign blockchain.',
            };
        }
        if (this.processedNonces.has(replayKey)) {
            return {
                isValid: false,
                genesisHash: boundGenesisHash,
                epochCounter: txEpoch,
                reason: 'XRAS: Signature replay attack detected! Nonce already spent.',
            };
        }
        this.processedNonces.add(replayKey);
        return {
            isValid: true,
            genesisHash: boundGenesisHash,
            epochCounter: txEpoch,
        };
    }
}
exports.XolixReplayAttackShield = XolixReplayAttackShield;
