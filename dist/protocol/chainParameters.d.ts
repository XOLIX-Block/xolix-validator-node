export interface ChainParameters {
    blockTimeSeconds: number;
    maxBlockXCU: number;
    minValidatorStake: bigint;
    governanceQuorumPercent: number;
    governanceTimelockBlocks: number;
    emergencyTimelockBlocks: number;
    slashingPenaltyPercent: number;
    validatorEpochBlocks: number;
    unbondingPeriodBlocks: number;
    maxActiveValidators: number;
}
/**
 * Reserved system account of the native staking module. Transactions sent to this
 * address with a JSON payload ({"op":"stake"} / {"op":"unstake"}) are executed by the
 * protocol's ValidatorRegistry instead of being treated as plain transfers.
 */
export declare const XOLIX_STAKING_SYSTEM_ADDRESS = "xols1validatorstakingmodule";
export declare const XOLIX_CHAIN_PARAMETERS: ChainParameters;
