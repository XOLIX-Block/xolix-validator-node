// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

import { FluidContractState } from '../types/index.js';
import { FluidScriptCompiler, CompiledXLSArtifact } from '../fluid/compiler/index.js';

export interface FluidProxyConfig {
  proxyAddress: string;
  storageAddress: string;
  initialLogicHash: string;
  adminGovernanceAddress: string;
  timelockBlocks: number;
}

export class FluidContractProxyManager {
  private contracts: Map<string, FluidContractState> = new Map();
  private persistentStorage: Map<string, Map<string, Uint8Array>> = new Map();
  private pendingUpgrades: Map<string, { newLogicHash: string; readyAtBlock: bigint }> = new Map();

  public deployFluidContract(
    config: FluidProxyConfig,
    initialArtifact: CompiledXLSArtifact
  ): FluidContractState {
    const state: FluidContractState = {
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

  public proposeLogicUpgrade(
    proxyAddress: string,
    newArtifact: CompiledXLSArtifact,
    currentBlockHeight: bigint
  ): { pendingTxHash: string; readyAtBlock: bigint } {
    const state = this.contracts.get(proxyAddress);
    if (!state) {
      throw new Error(`Fluid Contract Proxy ${proxyAddress} not found.`);
    }

    if (state.upgradePolicy.requireSchemaCompatibility) {
      const compatibility = FluidScriptCompiler.verifyUpgradeCompatibility(
        { stateSchemaHash: state.stateSchemaHash } as any,
        newArtifact
      );
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

  public executeLogicUpgrade(
    proxyAddress: string,
    currentBlockHeight: bigint
  ): FluidContractState {
    const state = this.contracts.get(proxyAddress);
    const pending = this.pendingUpgrades.get(proxyAddress);

    if (!state || !pending) {
      throw new Error(`No pending upgrade proposal found for Fluid Contract ${proxyAddress}.`);
    }

    if (currentBlockHeight < pending.readyAtBlock) {
      throw new Error(
        `Timelock violation: Upgrade ready at block ${pending.readyAtBlock}, current block ${currentBlockHeight}.`
      );
    }

    state.currentImplementationHash = pending.newLogicHash;
    state.version = '2.0.0';
    this.pendingUpgrades.delete(proxyAddress);

    return state;
  }

  public writeStateStorage(proxyAddress: string, key: string, value: Uint8Array): void {
    const storage = this.persistentStorage.get(proxyAddress);
    if (!storage) throw new Error(`Storage container missing for ${proxyAddress}`);
    storage.set(key, value);
  }

  public readStateStorage(proxyAddress: string, key: string): Uint8Array | undefined {
    const storage = this.persistentStorage.get(proxyAddress);
    return storage ? storage.get(key) : undefined;
  }

  public getContractState(proxyAddress: string): FluidContractState | undefined {
    return this.contracts.get(proxyAddress);
  }
}
