import { Token } from '../lexer/index';
import { ContractNode } from '../ast/index';
export declare class Parser {
    private tokens;
    private pos;
    constructor(tokens: Token[]);
    private peek;
    private consume;
    private match;
    private expect;
    parse(): ContractNode;
}
