export interface EVMPrecompile {
    address: string;
    name: string;
    execute: (input: Uint8Array) => Uint8Array;
}
export declare class XolixPrecompileRegistry {
    private precompiles;
    constructor();
    private registerAllPrecompiles;
    getPrecompile(address: string): EVMPrecompile | undefined;
    isPrecompile(address: string): boolean;
}
