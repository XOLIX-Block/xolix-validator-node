"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOTTERY_TOKENOMICS = exports.PRESALE_STAGES_CONFIG = exports.QUSD_TOKENOMICS = exports.GXO_TOKENOMICS = exports.XOLT_TOKENOMICS = void 0;
exports.XOLT_TOKENOMICS = {
    name: 'XOLIX',
    symbol: 'XOLT',
    decimals: 18,
    maxSupply: BigInt(50000000n * 10n ** 18n), // 50,000,000 XOLT
    buyTaxPercent: 0,
    sellTaxPercent: 6,
    burnSharePercent: 5.0, // 5% auto-burn
    operationalSharePercent: 1.0, // 1% operational fund
    distribution: [
        {
            category: 'Staking & Ecosystem Rewards',
            percent: 30.0,
            amount: BigInt(15000000n * 10n ** 18n),
            description: 'Dedicated to automated staking rewards, NFT marketplace incentives, and community growth pools.',
        },
        {
            category: 'Liquidity Pool Reserves',
            percent: 25.0,
            amount: BigInt(12500000n * 10n ** 18n),
            description: 'Permanently locked DEX liquidity paired with stablecoins and native assets.',
        },
        {
            category: 'Marketing & Operational Reserves',
            percent: 20.0,
            amount: BigInt(10000000n * 10n ** 18n),
            description: 'Dedicated to exchange listings, marketing campaigns, audit funds, and ongoing operational overhead.',
        },
        {
            category: 'Presale / IDO Allocation',
            percent: 12.5,
            amount: BigInt(6250000n * 10n ** 18n),
            description: 'Designated for public launchpad events and DEX liquidity initialization.',
        },
        {
            category: 'Team & Development',
            percent: 10.0,
            amount: BigInt(5000000n * 10n ** 18n),
            description: 'Reserved for core contributors and infrastructure development.',
            vestingTerms: 'Linear 24-month vesting schedule.',
        },
        {
            category: 'Seed & Private Round',
            percent: 2.5,
            amount: BigInt(1250000n * 10n ** 18n),
            description: 'Private allocations for early strategic partners under strict lockup schedules.',
        },
    ],
};
exports.GXO_TOKENOMICS = {
    name: 'Governance Xolix',
    symbol: 'GXO',
    decimals: 18,
    maxSupply: BigInt(1500000000n * 10n ** 18n), // 1,500,000,000 GXO
    initialValuationUSD: 1500000,
    initialPricePerTokenUSD: 0.0001,
    distribution: [
        {
            category: 'Rewards & Incentives Pool',
            percent: 50.0,
            amount: BigInt(750000000n * 10n ** 18n),
            description: 'Allocated to reward active creators, collectors, and community participants.',
        },
        {
            category: 'Liquidity Pool',
            percent: 33.33,
            amount: BigInt(500000000n * 10n ** 18n),
            description: 'Paired directly with ecosystem trading pairs to establish deep market liquidity.',
        },
        {
            category: 'Ecosystem Reserves',
            percent: 16.67,
            amount: BigInt(250000000n * 10n ** 18n),
            description: 'Held for future platform expansions, strategic grants, and DAO treasury operations.',
        },
    ],
};
exports.QUSD_TOKENOMICS = {
    name: 'XOLIX USD Stablecoin',
    symbol: 'QUSD',
    decimals: 18,
    targetPegUSD: 1.0,
    minCollateralRatioPercent: 150.0, // 150% collateralized vault backing
    liquidationFeePercent: 5.0,
    description: 'Internal algorithmic and collateral-backed stable asset for XOLIX DeFi, liquidity pools, and risk-managed value storage.',
};
exports.PRESALE_STAGES_CONFIG = {
    totalPresaleAllocation: BigInt(6250000n * 10n ** 18n), // 6,250,000 XOLT (12.5% of 50M)
    stages: [
        {
            stage: 1,
            name: 'Stage 1 (Early Bird / Whitelist)',
            tokenAllocation: BigInt(2000000n * 10n ** 18n),
            cumulativeCap: BigInt(2000000n * 10n ** 18n),
            priceUsdt: 0.05,
            tokensPerUsdt: 20n,
            targetRaiseUsdt: 100000,
        },
        {
            stage: 2,
            name: 'Stage 2 (Public Round A)',
            tokenAllocation: BigInt(2250000n * 10n ** 18n),
            cumulativeCap: BigInt(4250000n * 10n ** 18n),
            priceUsdt: 0.075,
            tokensPerUsdt: 13n, // ~13.333 XOLT per USDT
            targetRaiseUsdt: 168750,
        },
        {
            stage: 3,
            name: 'Stage 3 (Final IDO / Launchpad)',
            tokenAllocation: BigInt(2000000n * 10n ** 18n),
            cumulativeCap: BigInt(6250000n * 10n ** 18n),
            priceUsdt: 0.10,
            tokensPerUsdt: 10n,
            targetRaiseUsdt: 200000,
        },
    ],
    listingTargetPriceUsdt: 0.12,
    totalTargetRaiseUsdt: 468750, // 50% more capital for DEX liquidity and CEX listings
};
exports.LOTTERY_TOKENOMICS = {
    initialSeedXolt: 25000n * 10n ** 18n, // 25,000 XOLT
    seedSource: 'Staking & Ecosystem Rewards Pool (30% pool, representing 0.16% of pool)',
    baseTicketPriceXolt: 1n * 10n ** 18n, // 1 XOLT
    progressiveRollover: true,
    allocations: {
        matchAllJackpotPercent: 50.0, // Match 6 digits (rolls over if unhit)
        match5Percent: 20.0, // Match 5 digits
        match4Percent: 10.0, // Match 4 digits
        match3Percent: 5.0, // Match 3 digits
        deflationaryBurnPercent: 10.0, // Permanently burned to dead address 🔥
        treasuryFeePercent: 5.0, // Allocated to Ecosystem Growth & Treasury 🏦
    },
    minMatchDigits: 3,
    digitsCount: 6,
    bulkDiscounts: [
        { minTickets: 25, discountPercent: 15 },
        { minTickets: 10, discountPercent: 10 },
        { minTickets: 5, discountPercent: 5 },
    ],
};
