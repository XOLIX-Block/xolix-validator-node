/**
 * XOLIX Protocol Canonical Tokenomics Configuration
 * Company: XOLIX, LLC (Delaware / California)
 * Leadership: Cameron Furniss (Founder & CEO), Gabriel Vanorio, Araya Masami
 * Version: v1.0.0-QuantumAether
 */
export interface TokenomicsAllocation {
    category: string;
    amount: bigint;
    percent: number;
    description: string;
    vestingTerms?: string;
}
export declare const XOLT_TOKENOMICS: {
    name: string;
    symbol: string;
    decimals: number;
    maxSupply: bigint;
    buyTaxPercent: number;
    sellTaxPercent: number;
    burnSharePercent: number;
    operationalSharePercent: number;
    distribution: TokenomicsAllocation[];
};
export declare const GXO_TOKENOMICS: {
    name: string;
    symbol: string;
    decimals: number;
    maxSupply: bigint;
    initialValuationUSD: number;
    initialPricePerTokenUSD: number;
    distribution: TokenomicsAllocation[];
};
export declare const QUSD_TOKENOMICS: {
    name: string;
    symbol: string;
    decimals: number;
    targetPegUSD: number;
    minCollateralRatioPercent: number;
    liquidationFeePercent: number;
    description: string;
};
export interface PresaleStageConfig {
    stage: number;
    name: string;
    tokenAllocation: bigint;
    cumulativeCap: bigint;
    priceUsdt: number;
    tokensPerUsdt: bigint;
    targetRaiseUsdt: number;
}
export declare const PRESALE_STAGES_CONFIG: {
    totalPresaleAllocation: bigint;
    stages: PresaleStageConfig[];
    listingTargetPriceUsdt: number;
    totalTargetRaiseUsdt: number;
};
export declare const LOTTERY_TOKENOMICS: {
    initialSeedXolt: bigint;
    seedSource: string;
    baseTicketPriceXolt: bigint;
    progressiveRollover: boolean;
    allocations: {
        matchAllJackpotPercent: number;
        match5Percent: number;
        match4Percent: number;
        match3Percent: number;
        deflationaryBurnPercent: number;
        treasuryFeePercent: number;
    };
    minMatchDigits: number;
    digitsCount: number;
    bulkDiscounts: {
        minTickets: number;
        discountPercent: number;
    }[];
};
