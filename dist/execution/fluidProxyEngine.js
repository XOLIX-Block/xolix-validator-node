"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.FluidContractProxyManager = void 0;
const index_js_1 = require("../fluid/compiler/index.js");
class FluidContractProxyManager {
    contracts = new Map();
    persistentStorage = new Map();
    pendingUpgrades = new Map();
    deployFluidContract(config, initialArtifact) {
        const state = {
            contractId: config.proxyAddress,
            publicAddress: config.proxyAddress,
            currentImplementationHash: config.initialLogicHash,
            stateSchemaHash: initialArtifact.stateSchemaHash,
            version: initialArtifact.version,
            upgradePolicy: {
                authority: 'governance',
                timelockBlocks: config.timelockBlocks,
                requireSimulation: true,
                requireSchemaCompatibility: true,
            },
        };
        this.contracts.set(config.proxyAddress, state);
        this.persistentStorage.set(config.proxyAddress, new Map());
        return state;
    }
    proposeLogicUpgrade(proxyAddress, newArtifact, currentBlockHeight) {
        const state = this.contracts.get(proxyAddress);
        if (!state) {
            throw new Error(`Fluid Contract Proxy ${proxyAddress} not found.`);
        }
        if (state.upgradePolicy.requireSchemaCompatibility) {
            const compatibility = index_js_1.FluidScriptCompiler.verifyUpgradeCompatibility({ stateSchemaHash: state.stateSchemaHash }, newArtifact);
            if (!compatibility.isCompatible) {
                throw new Error(`Stateful migration blocked: Schema incompatibility detected.`);
            }
        }
        const readyAtBlock = currentBlockHeight + BigInt(state.upgradePolicy.timelockBlocks);
        this.pendingUpgrades.set(proxyAddress, {
            newLogicHash: newArtifact.bytecode,
            readyAtBlock,
        });
        return {
            pendingTxHash: `0xupgrade_prop_${proxyAddress}_${newArtifact.contractName}`,
            readyAtBlock,
        };
    }
    executeLogicUpgrade(proxyAddress, currentBlockHeight) {
        const state = this.contracts.get(proxyAddress);
        const pending = this.pendingUpgrades.get(proxyAddress);
        if (!state || !pending) {
            throw new Error(`No pending upgrade proposal found for Fluid Contract ${proxyAddress}.`);
        }
        if (currentBlockHeight < pending.readyAtBlock) {
            throw new Error(`Timelock violation: Upgrade ready at block ${pending.readyAtBlock}, current block ${currentBlockHeight}.`);
        }
        state.currentImplementationHash = pending.newLogicHash;
        state.version = '2.0.0';
        this.pendingUpgrades.delete(proxyAddress);
        return state;
    }
    writeStateStorage(proxyAddress, key, value) {
        const storage = this.persistentStorage.get(proxyAddress);
        if (!storage)
            throw new Error(`Storage container missing for ${proxyAddress}`);
        storage.set(key, value);
    }
    readStateStorage(proxyAddress, key) {
        const storage = this.persistentStorage.get(proxyAddress);
        return storage ? storage.get(key) : undefined;
    }
    getContractState(proxyAddress) {
        return this.contracts.get(proxyAddress);
    }
}
exports.FluidContractProxyManager = FluidContractProxyManager;
