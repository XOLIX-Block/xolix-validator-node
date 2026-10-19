"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.XOLIX_CHAIN_PARAMETERS = exports.XOLIX_STAKING_SYSTEM_ADDRESS = void 0;
/**
 * Reserved system account of the native staking module. Transactions sent to this
 * address with a JSON payload ({"op":"stake"} / {"op":"unstake"}) are executed by the
 * protocol's ValidatorRegistry instead of being treated as plain transfers.
 */
exports.XOLIX_STAKING_SYSTEM_ADDRESS = 'xols1validatorstakingmodule';
exports.XOLIX_CHAIN_PARAMETERS = {
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
