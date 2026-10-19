"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.StakingPoolManager = void 0;
const chainParameters_js_1 = require("../protocol/chainParameters.js");
class StakingPoolManager {
    validators = new Map();
    totalStaked = BigInt(0);
    registerValidator(validatorAddress, initialDeposit, currentBlock) {
        if (initialDeposit < chainParameters_js_1.XOLIX_CHAIN_PARAMETERS.minValidatorStake) {
            throw new Error(`Insufficient initial stake. Minimum required: ${chainParameters_js_1.XOLIX_CHAIN_PARAMETERS.minValidatorStake} XOL, provided: ${initialDeposit}`);
        }
        const existing = this.validators.get(validatorAddress);
        if (existing) {
            this.totalStaked -= existing.stakedAmount;
        }
        const stakeInfo = {
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
    stake(validatorAddress, amount, currentBlock) {
        if (amount <= BigInt(0))
            throw new Error('Stake amount must be greater than zero.');
        const existing = this.validators.get(validatorAddress);
        if (!existing) {
            this.registerValidator(validatorAddress, amount, currentBlock);
            return this.validators.get(validatorAddress);
        }
        existing.stakedAmount += amount;
        this.totalStaked += amount;
        return existing;
    }
    /**
     * Begin unbonding. The amount leaves the active stake immediately (so the validator may
     * drop below the threshold at the next epoch) and is released after the unbonding period.
     */
    requestUnstake(validatorAddress, amount, currentBlock, owner) {
        const validator = this.validators.get(validatorAddress);
        if (!validator)
            throw new Error(`Validator ${validatorAddress} not registered.`);
        if (amount <= BigInt(0))
            throw new Error('Unstake amount must be greater than zero.');
        if (amount > validator.stakedAmount) {
            throw new Error(`Cannot unstake ${amount}: only ${validator.stakedAmount} staked.`);
        }
        const releaseBlock = currentBlock + BigInt(chainParameters_js_1.XOLIX_CHAIN_PARAMETERS.unbondingPeriodBlocks);
        validator.stakedAmount -= amount;
        this.totalStaked -= amount;
        validator.pendingUnbonds.push({ amount, releaseBlock, owner });
        return { releaseBlock, remainingStake: validator.stakedAmount };
    }
    /**
     * Release every unbonding entry whose lock has expired. Returns what must be credited back.
     */
    releaseMatured(currentBlock) {
        const released = [];
        for (const validator of this.validators.values()) {
            const stillLocked = [];
            for (const u of validator.pendingUnbonds) {
                if (currentBlock >= u.releaseBlock) {
                    released.push({ validatorAddress: validator.validatorAddress, owner: u.owner, amount: u.amount });
                }
                else {
                    stillLocked.push(u);
                }
            }
            validator.pendingUnbonds = stillLocked;
        }
        return released;
    }
    slashValidator(validatorAddress, reason, currentBlock = BigInt(0)) {
        const validator = this.validators.get(validatorAddress);
        if (!validator)
            throw new Error(`Validator ${validatorAddress} not registered.`);
        const penaltyPercent = BigInt(chainParameters_js_1.XOLIX_CHAIN_PARAMETERS.slashingPenaltyPercent);
        const slashedAmount = (validator.stakedAmount * penaltyPercent) / BigInt(100);
        validator.stakedAmount -= slashedAmount;
        validator.isSlashed = true;
        validator.jailedUntilBlock = currentBlock + BigInt(chainParameters_js_1.XOLIX_CHAIN_PARAMETERS.unbondingPeriodBlocks);
        this.totalStaked -= slashedAmount;
        return { slashedAmount, remainingStake: validator.stakedAmount };
    }
    /** A validator is eligible when it holds the minimum stake and is not jailed. */
    isEligible(validatorAddress, currentBlock) {
        const v = this.validators.get(validatorAddress);
        if (!v)
            return false;
        return v.stakedAmount >= chainParameters_js_1.XOLIX_CHAIN_PARAMETERS.minValidatorStake && currentBlock >= v.jailedUntilBlock;
    }
    /** Eligible validators ordered by stake (desc), ties broken by address for determinism. */
    getEligibleValidators(currentBlock) {
        return [...this.validators.values()]
            .filter((v) => this.isEligible(v.validatorAddress, currentBlock))
            .sort((a, b) => {
            if (a.stakedAmount > b.stakedAmount)
                return -1;
            if (a.stakedAmount < b.stakedAmount)
                return 1;
            return a.validatorAddress < b.validatorAddress ? -1 : a.validatorAddress > b.validatorAddress ? 1 : 0;
        });
    }
    getAllValidators() {
        return [...this.validators.values()];
    }
    getTotalNetworkStake() {
        return this.totalStaked;
    }
    getValidatorInfo(validatorAddress) {
        return this.validators.get(validatorAddress);
    }
}
exports.StakingPoolManager = StakingPoolManager;
