"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.XolixPrecompileRegistry = void 0;
class XolixPrecompileRegistry {
    precompiles = new Map();
    constructor() {
        this.registerAllPrecompiles();
    }
    registerAllPrecompiles() {
        const list = [
            { suffix: '1', name: 'PoDIVerify' },
            { suffix: '2', name: 'QSC20Bridge' },
            { suffix: '3', name: 'QSC721Bridge' },
            { suffix: '4', name: 'QSC1155Bridge' },
            { suffix: '5', name: 'IdentityVerify' },
            { suffix: '6', name: 'TxSimulation' },
            { suffix: '7', name: 'CapabilityValidation' },
            { suffix: '8', name: 'StateProof' },
            { suffix: '9', name: 'GovernanceVoting' },
            { suffix: 'A', name: 'NativeAssetBridge' },
        ];
        for (const item of list) {
            const address = `0x000000000000000000000000000000000000000${item.suffix}`.toLowerCase();
            this.precompiles.set(address, {
                address,
                name: item.name,
                execute: (input) => new Uint8Array([1, 0, 1]), // Success result buffer
            });
        }
    }
    getPrecompile(address) {
        return this.precompiles.get(address.toLowerCase());
    }
    isPrecompile(address) {
        return this.precompiles.has(address.toLowerCase());
    }
}
exports.XolixPrecompileRegistry = XolixPrecompileRegistry;
