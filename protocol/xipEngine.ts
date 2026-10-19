// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

import { XOLIX_CHAIN_PARAMETERS } from './chainParameters.js';

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

export class XIPGovernanceEngine {
  private proposals: Map<string, XIPProposal> = new Map();

  public createProposal(
    proposalId: string,
    proposer: string,
    title: string,
    description: string,
    targetContractAddress: string,
    newImplementationHash: string,
    currentBlock: bigint
  ): XIPProposal {
    const proposal: XIPProposal = {
      proposalId,
      proposer,
      title,
      description,
      targetContractAddress,
      newImplementationHash,
      votesFor: BigInt(0),
      votesAgainst: BigInt(0),
      creationBlock: currentBlock,
      status: 'PENDING',
    };

    this.proposals.set(proposalId, proposal);
    return proposal;
  }

  public castVote(proposalId: string, voter: string, voteWeight: bigint, support: boolean): void {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`XIP Proposal ${proposalId} not found.`);
    if (proposal.status !== 'PENDING') throw new Error(`Voting closed for proposal ${proposalId}`);

    if (support) {
      proposal.votesFor += voteWeight;
    } else {
      proposal.votesAgainst += voteWeight;
    }
  }

  public evaluateProposal(proposalId: string, totalNetworkStake: bigint, currentBlock: bigint): XIPProposal {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`XIP Proposal ${proposalId} not found.`);

    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const quorumRequired = (totalNetworkStake * BigInt(XOLIX_CHAIN_PARAMETERS.governanceQuorumPercent)) / BigInt(100);

    if (totalVotes >= quorumRequired && proposal.votesFor > proposal.votesAgainst) {
      proposal.status = 'TIMELOCKED';
      proposal.executionBlock = currentBlock + BigInt(XOLIX_CHAIN_PARAMETERS.governanceTimelockBlocks);
    } else if (totalVotes >= quorumRequired && proposal.votesAgainst >= proposal.votesFor) {
      proposal.status = 'REJECTED';
    }

    return proposal;
  }

  public executeProposal(proposalId: string, currentBlock: bigint): XIPProposal {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found.`);
    if (proposal.status !== 'TIMELOCKED') throw new Error(`Proposal ${proposalId} is not in TIMELOCKED state.`);
    if (currentBlock < (proposal.executionBlock ?? BigInt(0))) {
      throw new Error(`Timelock active. Cannot execute until block ${proposal.executionBlock}`);
    }

    proposal.status = 'EXECUTED';
    return proposal;
  }
}
