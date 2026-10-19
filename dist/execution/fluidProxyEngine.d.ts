import { FluidContractState } from '../types/index.js';
import { CompiledXLSArtifact } from '../fluid/compiler/index.js';
export interface FluidProxyConfig {
    proxyAddress: string;
    storageAddress: string;
    initialLogicHash: string;
    adminGovernanceAddress: string;
    timelockBlocks: number;
}
export declare class FluidContractProxyManager {
    private contracts;
    private persistentStorage;
    private pendingUpgrades;
    deployFluidContract(config: FluidProxyConfig, initialArtifact: CompiledXLSArtifact): FluidContractState;
    proposeLogicUpgrade(proxyAddress: string, newArtifact: CompiledXLSArtifact, currentBlockHeight: bigint): {
        pendingTxHash: string;
        readyAtBlock: bigint;
    };
    executeLogicUpgrade(proxyAddress: string, currentBlockHeight: bigint): FluidContractState;
    writeStateStorage(proxyAddress: string, key: string, value: Uint8Array): void;
    readStateStorage(proxyAddress: string, key: string): Uint8Array | undefined;
    getContractState(proxyAddress: string): FluidContractState | undefined;
}
