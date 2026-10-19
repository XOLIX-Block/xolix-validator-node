// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

export type TokenType = 
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'CAPABILITY'
  | 'PUNCTUATION'
  | 'STRING_LITERAL'
  | 'NUMBER_LITERAL'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
}

const KEYWORDS = new Set(['version', 'contract', 'state', 'persistent', 'constructor', 'public', 'private', 'return', 'let', 'require']);

export class Lexer {
  private pos: number = 0;
  private line: number = 1;
  private source: string;

  constructor(source: string) {
    this.source = source;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.source.length) {
      const char = this.source[this.pos];

      // Whitespace
      if (/\s/.test(char)) {
        if (char === '\n') this.line++;
        this.pos++;
        continue;
      }

      // Comments (Single line and Multi-line)
      if (char === '/' && this.source[this.pos + 1] === '/') {
        while (this.pos < this.source.length && this.source[this.pos] !== '\n') this.pos++;
        continue;
      }
      if (char === '/' && this.source[this.pos + 1] === '*') {
        this.pos += 2;
        while (this.pos < this.source.length && !(this.source[this.pos] === '*' && this.source[this.pos + 1] === '/')) {
          if (this.source[this.pos] === '\n') this.line++;
          this.pos++;
        }
        if (this.pos < this.source.length) this.pos += 2;
        continue;
      }

      // Capabilities (Decorators)
      if (char === '@') {
        let val = '@';
        this.pos++;
        while (this.pos < this.source.length && /[A-Za-z0-9_]/.test(this.source[this.pos])) {
          val += this.source[this.pos];
          this.pos++;
        }
        tokens.push({ type: 'CAPABILITY', value: val, line: this.line });
        continue;
      }

      // Strings
      if (char === '"' || char === "'") {
        const quote = char;
        let val = '';
        this.pos++;
        while (this.pos < this.source.length && this.source[this.pos] !== quote) {
          val += this.source[this.pos];
          this.pos++;
        }
        this.pos++; // consume closing quote
        tokens.push({ type: 'STRING_LITERAL', value: val, line: this.line });
        continue;
      }

      // Numbers
      if (/[0-9]/.test(char)) {
        let val = '';
        while (this.pos < this.source.length && /[0-9.]/.test(this.source[this.pos])) {
          val += this.source[this.pos];
          this.pos++;
        }
        tokens.push({ type: 'NUMBER_LITERAL', value: val, line: this.line });
        continue;
      }

      // Identifiers & Keywords
      if (/[A-Za-z_]/.test(char)) {
        let val = '';
        while (this.pos < this.source.length && /[A-Za-z0-9_]/.test(this.source[this.pos])) {
          val += this.source[this.pos];
          this.pos++;
        }
        if (KEYWORDS.has(val)) {
          tokens.push({ type: 'KEYWORD', value: val, line: this.line });
        } else {
          tokens.push({ type: 'IDENTIFIER', value: val, line: this.line });
        }
        continue;
      }

      // Punctuation & Operators
      if (/[{};().,:=^<>\!+\-\*\/%&|~@?\[\]]/.test(char)) {
        tokens.push({ type: 'PUNCTUATION', value: char, line: this.line });
        this.pos++;
        continue;
      }

      throw new Error(`FluidScript Lexer Error at line ${this.line}: Unrecognized character '${char}'`);
    }
    
    tokens.push({ type: 'EOF', value: '', line: this.line });
    return tokens;
  }
}
