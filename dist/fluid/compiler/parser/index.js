"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
class Parser {
    tokens;
    pos = 0;
    constructor(tokens) {
        this.tokens = tokens;
    }
    peek() { return this.tokens[this.pos]; }
    consume() { return this.tokens[this.pos++]; }
    match(type, value) {
        const t = this.peek();
        return t.type === type && (value === undefined || t.value === value);
    }
    expect(type, value) {
        if (this.match(type, value))
            return this.consume();
        throw new Error(`FluidScript Parser Error line ${this.peek().line}: Expected ${type} ${value || ''}, got ${this.peek().value}`);
    }
    parse() {
        // 1. Parse top-level directives (pragmas, version, imports)
        while (!this.match('KEYWORD', 'contract') && !this.match('IDENTIFIER', 'contract') && !this.match('EOF')) {
            if (this.match('KEYWORD', 'version') || this.match('IDENTIFIER', 'pragma') || this.match('IDENTIFIER', 'import')) {
                while (!this.match('PUNCTUATION', ';') && !this.match('EOF')) {
                    this.consume();
                }
                if (this.match('PUNCTUATION', ';'))
                    this.consume();
            }
            else {
                this.consume();
            }
        }
        if (this.match('KEYWORD', 'contract') || this.match('IDENTIFIER', 'contract')) {
            this.consume();
        }
        else {
            throw new Error(`FluidScript Parser Error: Could not find 'contract' keyword.`);
        }
        const name = this.expect('IDENTIFIER').value;
        // Consume contract modifiers like 'fluid', 'upgradeable' until '{'
        while (!this.match('PUNCTUATION', '{') && !this.match('EOF')) {
            this.consume();
        }
        this.expect('PUNCTUATION', '{');
        const state = [];
        const methods = [];
        while (!this.match('PUNCTUATION', '}') && !this.match('EOF')) {
            // Capability declarations: capability asset:transfer;
            if (this.match('IDENTIFIER', 'capability') || this.match('KEYWORD', 'capability')) {
                while (!this.match('PUNCTUATION', ';') && !this.match('EOF')) {
                    this.consume();
                }
                if (this.match('PUNCTUATION', ';'))
                    this.consume();
                continue;
            }
            // State declarations: state persistent { ... }
            if (this.match('KEYWORD', 'state') || this.match('IDENTIFIER', 'state')) {
                this.consume();
                if (this.match('KEYWORD', 'persistent') || this.match('IDENTIFIER', 'persistent')) {
                    this.consume();
                }
                this.expect('PUNCTUATION', '{');
                while (!this.match('PUNCTUATION', '}') && !this.match('EOF')) {
                    // Handle state maps or variables
                    let dataType = '';
                    if (this.match('IDENTIFIER', 'map') || this.match('KEYWORD', 'map')) {
                        while (!this.match('PUNCTUATION', ';') && !this.match('EOF')) {
                            dataType += this.consume().value;
                        }
                        const stateName = 'mapState_' + state.length;
                        state.push({ type: 'StateDecl', name: stateName, dataType });
                        if (this.match('PUNCTUATION', ';'))
                            this.consume();
                        continue;
                    }
                    const stateNameToken = this.expect('IDENTIFIER');
                    if (this.match('PUNCTUATION', ':')) {
                        this.consume();
                        let typeVal = '';
                        while (!this.match('PUNCTUATION', ';') && !this.match('EOF')) {
                            typeVal += this.consume().value;
                        }
                        state.push({ type: 'StateDecl', name: stateNameToken.value, dataType: typeVal });
                        if (this.match('PUNCTUATION', ';'))
                            this.consume();
                    }
                    else if (this.match('IDENTIFIER') || this.match('KEYWORD')) {
                        const stateType = this.consume().value;
                        state.push({ type: 'StateDecl', name: stateNameToken.value, dataType: stateType });
                        if (this.match('PUNCTUATION', ';'))
                            this.consume();
                    }
                }
                if (this.match('PUNCTUATION', '}'))
                    this.consume();
                continue;
            }
            // Methods, Constructors, and Transactions
            const capabilities = [];
            while (this.match('CAPABILITY')) {
                capabilities.push(this.consume().value);
            }
            let isConstructor = false;
            let methodName = '';
            if (this.match('KEYWORD', 'constructor') || this.match('IDENTIFIER', 'constructor')) {
                this.consume();
                isConstructor = true;
                methodName = 'constructor';
            }
            else if (this.match('IDENTIFIER', 'transaction') || this.match('KEYWORD', 'transaction') || this.match('KEYWORD', 'public') || this.match('IDENTIFIER', 'public')) {
                this.consume();
                if (this.match('IDENTIFIER')) {
                    methodName = this.expect('IDENTIFIER').value;
                }
                else {
                    methodName = 'method_' + methods.length;
                }
            }
            else {
                if (this.match('IDENTIFIER')) {
                    methodName = this.consume().value;
                }
                else {
                    this.consume();
                    continue;
                }
            }
            if (this.match('PUNCTUATION', '(')) {
                this.consume();
                const args = [];
                while (!this.match('PUNCTUATION', ')') && !this.match('EOF')) {
                    if (this.match('IDENTIFIER')) {
                        const argName = this.consume().value;
                        let argType = 'uint256';
                        if (this.match('PUNCTUATION', ':')) {
                            this.consume();
                            if (this.match('IDENTIFIER'))
                                argType = this.consume().value;
                        }
                        else if (this.match('IDENTIFIER')) {
                            argType = this.consume().value;
                        }
                        args.push({ name: argName, dataType: argType });
                    }
                    else {
                        this.consume();
                    }
                    if (this.match('PUNCTUATION', ','))
                        this.consume();
                }
                if (this.match('PUNCTUATION', ')'))
                    this.consume();
                // Skip modifiers like requires ..., return type, preflight, etc. until '{'
                let depth = 0;
                while (!this.match('EOF')) {
                    if (this.match('PUNCTUATION', '{')) {
                        if (depth === 0)
                            break;
                        depth++;
                    }
                    else if (this.match('PUNCTUATION', '}')) {
                        depth--;
                    }
                    this.consume();
                }
                if (this.match('PUNCTUATION', '{')) {
                    this.expect('PUNCTUATION', '{');
                    const body = [];
                    let braceDepth = 1;
                    while (braceDepth > 0 && !this.match('EOF')) {
                        const t = this.consume();
                        if (t.type === 'PUNCTUATION' && t.value === '{')
                            braceDepth++;
                        else if (t.type === 'PUNCTUATION' && t.value === '}')
                            braceDepth--;
                    }
                    methods.push({
                        type: 'Method',
                        name: methodName,
                        capabilities,
                        isConstructor,
                        args,
                        body
                    });
                }
            }
            else {
                // Skip unparsed tokens until next section or ';'
                while (!this.match('PUNCTUATION', ';') && !this.match('PUNCTUATION', '}') && !this.match('EOF')) {
                    this.consume();
                }
                if (this.match('PUNCTUATION', ';'))
                    this.consume();
            }
        }
        if (this.match('PUNCTUATION', '}'))
            this.consume();
        return { type: 'Contract', name, state, methods };
    }
}
exports.Parser = Parser;
