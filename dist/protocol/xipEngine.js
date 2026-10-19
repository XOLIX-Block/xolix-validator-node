"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.XIPGovernanceEngine = void 0;
const chainParameters_js_1 = require("./chainParameters.js");
class XIPGovernanceEngine {
    proposals = new Map();
    createProposal(proposalId, proposer, title, description, targetContractAddress, newImplementationHash, currentBlock) {
        const proposal = {
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
    castVote(proposalId, voter, voteWeight, support) {
        const proposal = this.proposals.get(proposalId);
        if (!proposal)
            throw new Error(`XIP Proposal ${proposalId} not found.`);
        if (proposal.status !== 'PENDING')
            throw new Error(`Voting closed for proposal ${proposalId}`);
        if (support) {
            proposal.votesFor += voteWeight;
        }
        else {
            proposal.votesAgainst += voteWeight;
        }
    }
    evaluateProposal(proposalId, totalNetworkStake, currentBlock) {
        const proposal = this.proposals.get(proposalId);
        if (!proposal)
            throw new Error(`XIP Proposal ${proposalId} not found.`);
        const totalVotes = proposal.votesFor + proposal.votesAgainst;
        const quorumRequired = (totalNetworkStake * BigInt(chainParameters_js_1.XOLIX_CHAIN_PARAMETERS.governanceQuorumPercent)) / BigInt(100);
        if (totalVotes >= quorumRequired && proposal.votesFor > proposal.votesAgainst) {
            proposal.status = 'TIMELOCKED';
            proposal.executionBlock = currentBlock + BigInt(chainParameters_js_1.XOLIX_CHAIN_PARAMETERS.governanceTimelockBlocks);
        }
        else if (totalVotes >= quorumRequired && proposal.votesAgainst >= proposal.votesFor) {
            proposal.status = 'REJECTED';
        }
        return proposal;
    }
    executeProposal(proposalId, currentBlock) {
        const proposal = this.proposals.get(proposalId);
        if (!proposal)
            throw new Error(`Proposal ${proposalId} not found.`);
        if (proposal.status !== 'TIMELOCKED')
            throw new Error(`Proposal ${proposalId} is not in TIMELOCKED state.`);
        if (currentBlock < (proposal.executionBlock ?? BigInt(0))) {
            throw new Error(`Timelock active. Cannot execute until block ${proposal.executionBlock}`);
        }
        proposal.status = 'EXECUTED';
        return proposal;
    }
}
exports.XIPGovernanceEngine = XIPGovernanceEngine;
