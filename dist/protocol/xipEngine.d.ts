export interface XIPProposal {
    proposalId: string;
    proposer: string;
    title: string;
    description: string;
    targetContractAddress: string;
    newImplementationHash: string;
    votesFor: bigint;
    votesAgainst: bigint;
    creationBlock: bigint;
    executionBlock?: bigint;
    status: 'PENDING' | 'PASSED' | 'TIMELOCKED' | 'EXECUTED' | 'REJECTED';
}
export declare class XIPGovernanceEngine {
    private proposals;
    createProposal(proposalId: string, proposer: string, title: string, description: string, targetContractAddress: string, newImplementationHash: string, currentBlock: bigint): XIPProposal;
    castVote(proposalId: string, voter: string, voteWeight: bigint, support: boolean): void;
    evaluateProposal(proposalId: string, totalNetworkStake: bigint, currentBlock: bigint): XIPProposal;
    executeProposal(proposalId: string, currentBlock: bigint): XIPProposal;
}
