// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

/**
 * Xolix Human-Readable Error Compiler (XHREC)
 * Translates raw blockchain execution hex failure codes into clear, actionable human explanations.
 * Version: v1.0.0-QuantumAether
 */
export interface TranslatedErrorPayload {
  hexCode: string;
  category: 'SECURITY' | 'CAPABILITY' | 'COLLATERAL' | 'STAKING' | 'REENTRANCY' | 'GAS';
  shortTitle: string;
  humanExplanation: string;
  suggestedAction: string;
}

export class XolixHumanReadableErrorCompiler {
  private static errorRegistry: Map<string, TranslatedErrorPayload> = new Map([
    [
      '0x8c379200',
      {
        hexCode: '0x8c379200',
        category: 'REENTRANCY',
        shortTitle: 'Reentrancy Lock Activated',
        humanExplanation: 'The target smart contract rejected execution because a recursive call was attempted before the previous call completed.',
        suggestedAction: 'Ensure state changes follow the Checks-Effects-Interactions pattern or wait for current call completion.',
      },
    ],
    [
      '0x403cap00',
      {
        hexCode: '0x403cap00',
        category: 'CAPABILITY',
        shortTitle: 'Missing Capability Security Token',
        humanExplanation: 'The caller lacks the required Capability Security Token (FLD-CAP-403) to invoke this function.',
        suggestedAction: 'Request authorization from the contract capability administrator.',
      },
    ],
    [
      '0x150col00',
      {
        hexCode: '0x150col00',
        category: 'COLLATERAL',
        shortTitle: 'Insufficient Collateralization Ratio',
        humanExplanation: 'Vault minting failed because the deposited collateral falls below the 150% minimum threshold.',
        suggestedAction: 'Deposit additional XOLT or GXO collateral before minting QUSD.',
      },
    ],
    [
      '0x100slsh0',
      {
        hexCode: '0x100slsh0',
        category: 'STAKING',
        shortTitle: 'Validator Slashing Event',
        humanExplanation: 'Staking pool transaction failed because the validator node incurred a 10% penalty for double signing.',
        suggestedAction: 'Re-stake minimum 100,000 XOLT to restore active validator status.',
      },
    ],
  ]);

  public static translateHexError(hexCode: string): TranslatedErrorPayload {
    const found = this.errorRegistry.get(hexCode.toLowerCase());
    if (found) return found;

    return {
      hexCode,
      category: 'SECURITY',
      shortTitle: 'Execution Reverted',
      humanExplanation: `Transaction reverted with custom error selector (${hexCode}).`,
      suggestedAction: 'Inspect smart contract preflight conditions and input parameters.',
    };
  }
}
