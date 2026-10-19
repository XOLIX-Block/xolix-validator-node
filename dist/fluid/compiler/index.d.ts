export interface CompiledXLSArtifact {
    contractName: string;
    version: string;
    bytecode: string;
    stateSchemaHash: string;
    interfaceHash: string;
    capabilityHash: string;
    maxResourceEstimate: number;
}
export declare class FluidScriptCompiler {
    static compile(sourceCode: string): CompiledXLSArtifact;
    static verifyUpgradeCompatibility(oldArtifact: CompiledXLSArtifact, newArtifact: CompiledXLSArtifact): {
        isCompatible: boolean;
        report: string[];
    };
}
