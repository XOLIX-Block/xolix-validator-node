// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

export interface ChainParameters {
  blockTimeSeconds: number; // 1 second target block time
  maxBlockXCU: number;      // 30,000,000 XCU max per block
  minValidatorStake: bigint;// 100,000 XOL minimum stake
  governanceQuorumPercent: number; // 67%
  governanceTimelockBlocks: number;// 259,200 blocks (~72 hours at 1s block time)
  emergencyTimelockBlocks: number; // 21,600 blocks (~6 hours at 1s block time)
  slashingPenaltyPercent: number;  // 10% penalty for double-signing
  validatorEpochBlocks: number;    // Validator set is recomputed every N blocks (stake-based admission)
  unbondingPeriodBlocks: number;   // Blocks unstaked XOL stays locked (also the jail duration after a slash)
  maxActiveValidators: number;     // Upper bound on the active validator set size
}

/**
 * Reserved system account of the native staking module. Transactions sent to this
 * address with a JSON payload ({"op":"stake"} / {"op":"unstake"}) are executed by the
 * protocol's ValidatorRegistry instead of being treated as plain transfers.
 */
export const XOLIX_STAKING_SYSTEM_ADDRESS = 'xols1validatorstakingmodule';

export const XOLIX_CHAIN_PARAMETERS: ChainParameters = {
  blockTimeSeconds: 1,
  maxBlockXCU: 30000000,
  minValidatorStake: BigInt(100000000000000000000000n), // 100,000 XOL (18 decimals)
  governanceQuorumPercent: 67,
  governanceTimelockBlocks: 259200,
  emergencyTimelockBlocks: 21600,
  slashingPenaltyPercent: 10,
  validatorEpochBlocks: 100,
  unbondingPeriodBlocks: 86400, // ~24 hours at 1s block time
  maxActiveValidators: 100,
};
