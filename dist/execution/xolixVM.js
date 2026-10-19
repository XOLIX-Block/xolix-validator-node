"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.XolixVirtualMachine = void 0;
const index_js_1 = require("../fluid/compiler/codegen/index.js");
class XolixVirtualMachine {
    globalStateStore = new Map();
    executeNativeTransaction(tx, artifact) {
        const startCpu = performance.now();
        const logs = [];
        logs.push(`Executing transaction ${tx.txHash} on Native XOLIX VM`);
        // Extract execution request
        let methodName = '';
        let args = [];
        try {
            const payloadStr = new TextDecoder().decode(typeof tx.payload === 'string' ? new TextEncoder().encode(tx.payload) : tx.payload);
            const parsed = JSON.parse(payloadStr);
            methodName = parsed.method;
            args = parsed.args || [];
        }
        catch {
            // Fallback
        }
        let success = true;
        let stateRootAfter = `0xstateroot_${Date.now()}`;
        let totalXCU = 21000; // Base Tx Cost
        if (artifact) {
            logs.push(`Loaded XLS Bytecode Artifact: ${artifact.contractName} v${artifact.version}`);
            try {
                const segments = JSON.parse(artifact.bytecode);
                const method = segments.find(s => s.methodName === methodName);
                if (!method) {
                    throw new Error(`Method ${methodName} not found in artifact bytecode`);
                }
                // --- XOLIX NATIVE VM STACK EXECUTION ---
                const stack = [];
                for (const inst of method.instructions) {
                    switch (inst.op) {
                        case index_js_1.XLSOpcode.PUSH:
                            stack.push(inst.args[0]);
                            totalXCU += 5; // Gas
                            break;
                        case index_js_1.XLSOpcode.STORE_STATE:
                            const val = stack.pop();
                            const key = inst.args[0];
                            // Scope key to contract + state variable
                            const stateKey = `${artifact.contractName}_${key}`;
                            this.globalStateStore.set(stateKey, new TextEncoder().encode(String(val)));
                            totalXCU += 20000; // Gas
                            logs.push(`[VM:STORE] ${stateKey} = ${val}`);
                            break;
                        case index_js_1.XLSOpcode.REQUIRE_CAP:
                            const capReq = inst.args[0]; // e.g., 'owner'
                            // The VM natively fetches the capability from the state store
                            const ownerKey = `${artifact.contractName}_${capReq}`;
                            const authorizedAddressBytes = this.globalStateStore.get(ownerKey);
                            if (authorizedAddressBytes) {
                                const authAddr = new TextDecoder().decode(authorizedAddressBytes);
                                if (authAddr !== tx.sender) {
                                    throw new Error(`FLD-ERR-403: Capability Denied. Expected ${authAddr}, got ${tx.sender}`);
                                }
                            }
                            logs.push(`[VM:AUTH] Capability '${capReq}' validated for ${tx.sender}`);
                            totalXCU += 2100;
                            break;
                        case index_js_1.XLSOpcode.RETURN:
                            // Method finished executing
                            break;
                        default:
                            throw new Error(`Unknown Opcode: ${inst.op}`);
                    }
                }
                // ---------------------------------------
            }
            catch (err) {
                success = false;
                logs.push(`[VM:FATAL_ERROR] ${err.message}`);
            }
        }
        else {
            // Direct raw transfer execution (if no contract artifact provided)
            const stateKey = `balance_${tx.recipient}`;
            const newVal = new TextEncoder().encode(tx.value.toString());
            this.globalStateStore.set(stateKey, newVal);
        }
        const endCpu = performance.now();
        return {
            txHash: tx.txHash,
            success,
            stateRootAfter,
            resourcesConsumed: {
                cpuUnits: Math.max(1, Math.round(endCpu - startCpu)),
                stateReads: 1,
                stateWrites: 1,
                bandwidthBytes: typeof tx.payload === 'string' ? tx.payload.length : tx.payload.length,
                cryptoOps: 1,
                totalXCU,
            },
            logs,
        };
    }
    getState(key) {
        return this.globalStateStore.get(key);
    }
}
exports.XolixVirtualMachine = XolixVirtualMachine;
