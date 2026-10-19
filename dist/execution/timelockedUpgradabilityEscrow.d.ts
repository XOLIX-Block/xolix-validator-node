/**
 * RAISE Time-Locked Upgradability Escrow (RTLUE)
 * Protocol-native state delay mechanism forcing contract bytecode updates into a transparent timelock queue.
 * Version: v1.0.0-QuantumAether
 */
export interface PendingBytecodeUpgrade {
    proposalId: string;
    contractAddress: string;
    newBytecodeHash: string;
    proposedAtBlock: number;
    executableAtBlock: number;
    status: 'PENDING' | 'EXECUTED' | 'CANCELED';
}
export declare class RaiseTimelockedUpgradabilityEscrow {
    private pendingUpgrades;
    private readonly defaultTimelockBlocks;
    proposeUpgrade(contractAddress: string, newBytecodeHash: string, currentBlock: number, timelockDelayBlocks?: number): PendingBytecodeUpgrade;
    executeUpgrade(proposalId: string, currentBlock: number): PendingBytecodeUpgrade;
}
