import { TransactionEnvelope, ResourceUsage } from '../types/index.js';
import { CompiledXLSArtifact } from '../fluid/compiler/index.js';
export interface ExecutionResult {
    txHash: string;
    success: boolean;
    stateRootAfter: string;
    resourcesConsumed: ResourceUsage;
    logs: string[];
    output?: Uint8Array | string;
}
export declare class XolixVirtualMachine {
    private globalStateStore;
    executeNativeTransaction(tx: TransactionEnvelope, artifact?: CompiledXLSArtifact): ExecutionResult;
    getState(key: string): Uint8Array | undefined;
}
