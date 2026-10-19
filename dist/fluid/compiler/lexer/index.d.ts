export type TokenType = 'KEYWORD' | 'IDENTIFIER' | 'CAPABILITY' | 'PUNCTUATION' | 'STRING_LITERAL' | 'NUMBER_LITERAL' | 'EOF';
export interface Token {
    type: TokenType;
    value: string;
    line: number;
}
export declare class Lexer {
    private pos;
    private line;
    private source;
    constructor(source: string);
    tokenize(): Token[];
}
