export interface PendingUnbond {
    amount: bigint;
    releaseBlock: bigint;
    /** Account that receives the XOL once the unbonding period has elapsed. */
    owner: string;
}
export interface ValidatorStake {
    validatorAddress: string;
    stakedAmount: bigint;
    blocksValidated: bigint;
    isSlashed: boolean;
    joinedBlock: bigint;
    /** Validator is jailed (ineligible) until this block after being slashed. */
    jailedUntilBlock: bigint;
    pendingUnbonds: PendingUnbond[];
}
export declare class StakingPoolManager {
    private validators;
    private totalStaked;
    registerValidator(validatorAddress: string, initialDeposit: bigint, currentBlock: bigint): void;
    /**
     * Stake (or top up) for a validator. A first-time validator must stake at least
     * `minValidatorStake`; top-ups of existing validators may be any positive amount.
     */
    stake(validatorAddress: string, amount: bigint, currentBlock: bigint): ValidatorStake;
    /**
     * Begin unbonding. The amount leaves the active stake immediately (so the validator may
     * drop below the threshold at the next epoch) and is released after the unbonding period.
     */
    requestUnstake(validatorAddress: string, amount: bigint, currentBlock: bigint, owner: string): {
        releaseBlock: bigint;
        remainingStake: bigint;
    };
    /**
     * Release every unbonding entry whose lock has expired. Returns what must be credited back.
     */
    releaseMatured(currentBlock: bigint): {
        validatorAddress: string;
        owner: string;
        amount: bigint;
    }[];
    slashValidator(validatorAddress: string, reason: string, currentBlock?: bigint): {
        slashedAmount: bigint;
        remainingStake: bigint;
    };
    /** A validator is eligible when it holds the minimum stake and is not jailed. */
    isEligible(validatorAddress: string, currentBlock: bigint): boolean;
    /** Eligible validators ordered by stake (desc), ties broken by address for determinism. */
    getEligibleValidators(currentBlock: bigint): ValidatorStake[];
    getAllValidators(): ValidatorStake[];
    getTotalNetworkStake(): bigint;
    getValidatorInfo(validatorAddress: string): ValidatorStake | undefined;
}
