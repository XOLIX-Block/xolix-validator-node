"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGenerator = exports.XLSOpcode = void 0;
var XLSOpcode;
(function (XLSOpcode) {
    XLSOpcode[XLSOpcode["PUSH"] = 0] = "PUSH";
    XLSOpcode[XLSOpcode["LOAD_STATE"] = 1] = "LOAD_STATE";
    XLSOpcode[XLSOpcode["STORE_STATE"] = 2] = "STORE_STATE";
    XLSOpcode[XLSOpcode["CALL_INTERNAL"] = 3] = "CALL_INTERNAL";
    XLSOpcode[XLSOpcode["REQUIRE_CAP"] = 4] = "REQUIRE_CAP";
    XLSOpcode[XLSOpcode["REVERT"] = 5] = "REVERT";
    XLSOpcode[XLSOpcode["HALT"] = 6] = "HALT";
    XLSOpcode[XLSOpcode["RETURN"] = 7] = "RETURN";
})(XLSOpcode || (exports.XLSOpcode = XLSOpcode = {}));
class CodeGenerator {
    contract;
    constructor(contract) {
        this.contract = contract;
    }
    generate() {
        const segments = [];
        // 1. Compile methods to XLS Instruction Sets
        for (const method of this.contract.methods) {
            const instructions = [];
            // Capability enforcement layer (Access Control)
            for (const cap of method.capabilities) {
                instructions.push({ op: XLSOpcode.REQUIRE_CAP, args: [cap.replace('@', '')] });
            }
            // Compile Body
            for (const stmt of method.body) {
                if (stmt.type === 'Assignment') {
                    const assign = stmt;
                    // Push value, Push Key, Store
                    instructions.push({ op: XLSOpcode.PUSH, args: [assign.value] });
                    instructions.push({ op: XLSOpcode.STORE_STATE, args: [assign.target] });
                }
            }
            instructions.push({ op: XLSOpcode.RETURN, args: [] });
            segments.push({
                methodName: method.name,
                isConstructor: method.isConstructor,
                instructions
            });
        }
        // 2. Deterministic State Schema Hash Generation for Upgrade Checking
        const stateSchema = this.contract.state.map(s => `${s.name}:${s.dataType}`).join('|');
        const schemaHash = Buffer.from(stateSchema).toString('base64'); // Mock hash logic for determinism
        return { bytecode: segments, schemaHash };
    }
}
exports.CodeGenerator = CodeGenerator;
