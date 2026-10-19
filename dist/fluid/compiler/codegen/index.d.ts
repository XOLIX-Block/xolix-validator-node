import { ContractNode } from '../ast/index';
export declare enum XLSOpcode {
    PUSH = 0,
    LOAD_STATE = 1,
    STORE_STATE = 2,
    CALL_INTERNAL = 3,
    REQUIRE_CAP = 4,
    REVERT = 5,
    HALT = 6,
    RETURN = 7
}
export interface XLSInstruction {
    op: XLSOpcode;
    args: any[];
}
export interface XLSBytecodeSegment {
    methodName: string;
    isConstructor: boolean;
    instructions: XLSInstruction[];
}
export declare class CodeGenerator {
    private contract;
    constructor(contract: ContractNode);
    generate(): {
        bytecode: XLSBytecodeSegment[];
        schemaHash: string;
    };
}
