import { Block, BlockHeader, TransactionEnvelope, PreflightReport } from '../types/index.js';
import { IValidatorSigner } from './validator/remoteSigner.js';
export interface BlockValidationResult {
    isValid: boolean;
    reason?: string;
}
export declare class PoDIConsensusEngine {
    private activeValidators;
    private maxRiskThreshold;
    private chainId;
    constructor(validators: string[], chainId?: number);
    /**
     * Run comprehensive preflight risk scanning, signature verification, and parameter validation
     */
    runPreflightCheck(tx: TransactionEnvelope): PreflightReport;
    /**
     * Validate full block upon receipt from peer network
     */
    validateBlock(block: Block, parentHeader: BlockHeader): BlockValidationResult;
    /**
     * Produce new block proposal signed by authorized validator (supporting optional HSM/Web3Signer)
     */
    produceBlockAsync(proposer: string, parentHeader: BlockHeader, transactions: TransactionEnvelope[], signer?: IValidatorSigner): Promise<Block>;
    produceBlock(proposer: string, parentHeader: BlockHeader, transactions: TransactionEnvelope[]): Block;
    private computeDeterministicRiskScore;
}
