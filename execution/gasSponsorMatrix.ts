// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

import { TransactionEnvelope } from '../types/index.js';

/**
 * XolixBlock Micro-Fee Gas Matrix (XBF-GFM)
 * Gas delegation & sponsorship engine enabling Web3 dApps to sponsor zero-fee user transactions natively.
 * Version: v1.0.0-QuantumAether
 */
export interface GasSponsorVault {
  sponsorAddress: string;
  applicationName: string;
  sponsorKeyHash: string;
  balanceWei: bigint;
  maxGasPerTxWei: bigint;
  isActive: boolean;
}

export class XolixGasSponsorMatrix {
  private sponsorVaults: Map<string, GasSponsorVault> = new Map();

  public registerSponsorVault(
    sponsorAddress: string,
    appName: string,
    sponsorKeyHash: string,
    initialDepositWei: bigint,
    maxGasPerTxWei: bigint
  ): GasSponsorVault {
    const vault: GasSponsorVault = {
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

  public processSponsoredTransaction(
    tx: TransactionEnvelope,
    sponsorKeyHash: string,
    estimatedGasCostWei: bigint
  ): { isSponsored: boolean; sponsorAddress?: string; reason?: string } {
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
