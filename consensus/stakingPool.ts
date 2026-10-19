// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

import { XOLIX_CHAIN_PARAMETERS } from '../protocol/chainParameters.js';

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

export class StakingPoolManager {
  private validators: Map<string, ValidatorStake> = new Map();
  private totalStaked: bigint = BigInt(0);

  public registerValidator(validatorAddress: string, initialDeposit: bigint, currentBlock: bigint): void {
    if (initialDeposit < XOLIX_CHAIN_PARAMETERS.minValidatorStake) {
      throw new Error(
        `Insufficient initial stake. Minimum required: ${XOLIX_CHAIN_PARAMETERS.minValidatorStake} XOL, provided: ${initialDeposit}`
      );
    }

    const existing = this.validators.get(validatorAddress);
    if (existing) {
      this.totalStaked -= existing.stakedAmount;
    }

    const stakeInfo: ValidatorStake = {
      validatorAddress,
      stakedAmount: initialDeposit,
      blocksValidated: BigInt(0),
      isSlashed: false,
      joinedBlock: currentBlock,
      jailedUntilBlock: BigInt(0),
      pendingUnbonds: existing ? existing.pendingUnbonds : [],
    };

    this.validators.set(validatorAddress, stakeInfo);
    this.totalStaked += initialDeposit;
  }

  /**
   * Stake (or top up) for a validator. A first-time validator must stake at least
   * `minValidatorStake`; top-ups of existing validators may be any positive amount.
   */
  public stake(validatorAddress: string, amount: bigint, currentBlock: bigint): ValidatorStake {
    if (amount <= BigInt(0)) throw new Error('Stake amount must be greater than zero.');

    const existing = this.validators.get(validatorAddress);
    if (!existing) {
      this.registerValidator(validatorAddress, amount, currentBlock);
      return this.validators.get(validatorAddress)!;
    }

    existing.stakedAmount += amount;
    this.totalStaked += amount;
    return existing;
  }

  /**
   * Begin unbonding. The amount leaves the active stake immediately (so the validator may
   * drop below the threshold at the next epoch) and is released after the unbonding period.
   */
  public requestUnstake(
    validatorAddress: string,
    amount: bigint,
    currentBlock: bigint,
    owner: string
  ): { releaseBlock: bigint; remainingStake: bigint } {
    const validator = this.validators.get(validatorAddress);
    if (!validator) throw new Error(`Validator ${validatorAddress} not registered.`);
    if (amount <= BigInt(0)) throw new Error('Unstake amount must be greater than zero.');
    if (amount > validator.stakedAmount) {
      throw new Error(`Cannot unstake ${amount}: only ${validator.stakedAmount} staked.`);
    }

    const releaseBlock = currentBlock + BigInt(XOLIX_CHAIN_PARAMETERS.unbondingPeriodBlocks);
    validator.stakedAmount -= amount;
    this.totalStaked -= amount;
    validator.pendingUnbonds.push({ amount, releaseBlock, owner });

    return { releaseBlock, remainingStake: validator.stakedAmount };
  }

  /**
   * Release every unbonding entry whose lock has expired. Returns what must be credited back.
   */
  public releaseMatured(currentBlock: bigint): { validatorAddress: string; owner: string; amount: bigint }[] {
    const released: { validatorAddress: string; owner: string; amount: bigint }[] = [];
    for (const validator of this.validators.values()) {
      const stillLocked: PendingUnbond[] = [];
      for (const u of validator.pendingUnbonds) {
        if (currentBlock >= u.releaseBlock) {
          released.push({ validatorAddress: validator.validatorAddress, owner: u.owner, amount: u.amount });
        } else {
          stillLocked.push(u);
        }
      }
      validator.pendingUnbonds = stillLocked;
    }
    return released;
  }

  public slashValidator(
    validatorAddress: string,
    reason: string,
    currentBlock: bigint = BigInt(0)
  ): { slashedAmount: bigint; remainingStake: bigint } {
    const validator = this.validators.get(validatorAddress);
    if (!validator) throw new Error(`Validator ${validatorAddress} not registered.`);

    const penaltyPercent = BigInt(XOLIX_CHAIN_PARAMETERS.slashingPenaltyPercent);
    const slashedAmount = (validator.stakedAmount * penaltyPercent) / BigInt(100);
    validator.stakedAmount -= slashedAmount;
    validator.isSlashed = true;
    validator.jailedUntilBlock = currentBlock + BigInt(XOLIX_CHAIN_PARAMETERS.unbondingPeriodBlocks);
    this.totalStaked -= slashedAmount;

    return { slashedAmount, remainingStake: validator.stakedAmount };
  }

  /** A validator is eligible when it holds the minimum stake and is not jailed. */
  public isEligible(validatorAddress: string, currentBlock: bigint): boolean {
    const v = this.validators.get(validatorAddress);
    if (!v) return false;
    return v.stakedAmount >= XOLIX_CHAIN_PARAMETERS.minValidatorStake && currentBlock >= v.jailedUntilBlock;
  }

  /** Eligible validators ordered by stake (desc), ties broken by address for determinism. */
  public getEligibleValidators(currentBlock: bigint): ValidatorStake[] {
    return [...this.validators.values()]
      .filter((v) => this.isEligible(v.validatorAddress, currentBlock))
      .sort((a, b) => {
        if (a.stakedAmount > b.stakedAmount) return -1;
        if (a.stakedAmount < b.stakedAmount) return 1;
        return a.validatorAddress < b.validatorAddress ? -1 : a.validatorAddress > b.validatorAddress ? 1 : 0;
      });
  }

  public getAllValidators(): ValidatorStake[] {
    return [...this.validators.values()];
  }

  public getTotalNetworkStake(): bigint {
    return this.totalStaked;
  }

  public getValidatorInfo(validatorAddress: string): ValidatorStake | undefined {
    return this.validators.get(validatorAddress);
  }
}
