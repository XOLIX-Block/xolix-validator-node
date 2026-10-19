"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.XolixGasSponsorMatrix = void 0;
class XolixGasSponsorMatrix {
    sponsorVaults = new Map();
    registerSponsorVault(sponsorAddress, appName, sponsorKeyHash, initialDepositWei, maxGasPerTxWei) {
        const vault = {
            sponsorAddress,
            applicationName: appName,
            sponsorKeyHash,
            balanceWei: initialDepositWei,
            maxGasPerTxWei,
            isActive: true,
        };
        this.sponsorVaults.set(sponsorKeyHash, vault);
        return vault;
    }
    processSponsoredTransaction(tx, sponsorKeyHash, estimatedGasCostWei) {
        const vault = this.sponsorVaults.get(sponsorKeyHash);
        if (!vault || !vault.isActive) {
            return { isSponsored: false, reason: 'XBF-GFM: Invalid or inactive gas sponsor key.' };
        }
        if (estimatedGasCostWei > vault.maxGasPerTxWei) {
            return { isSponsored: false, reason: 'XBF-GFM: Estimated gas exceeds sponsor vault per-tx cap.' };
        }
        if (vault.balanceWei < estimatedGasCostWei) {
            return { isSponsored: false, reason: 'XBF-GFM: Sponsor vault has insufficient funds.' };
        }
        vault.balanceWei -= estimatedGasCostWei;
        return {
            isSponsored: true,
            sponsorAddress: vault.sponsorAddress,
            reason: `XBF-GFM: Gas sponsored by ${vault.applicationName} (${vault.sponsorAddress}).`,
        };
    }
}
exports.XolixGasSponsorMatrix = XolixGasSponsorMatrix;
