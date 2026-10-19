import { TransactionEnvelope } from '../types/index.js';
import { ExecutionResult } from '../execution/xolixVM.js';
export interface PrecompileDefinition {
    address: string;
    name: string;
    execute: (input: Uint8Array) => Uint8Array;
}
export declare class XolixEVMRuntime {
    private precompiles;
    constructor();
    private registerDefaultPrecompiles;
    executeEvmTransaction(tx: TransactionEnvelope): ExecutionResult;
}
