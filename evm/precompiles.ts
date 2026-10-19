// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

export interface EVMPrecompile {
  address: string;
  name: string;
  execute: (input: Uint8Array) => Uint8Array;
}

export class XolixPrecompileRegistry {
  private precompiles: Map<string, EVMPrecompile> = new Map();

  constructor() {
    this.registerAllPrecompiles();
  }

  private registerAllPrecompiles(): void {
    const list: { suffix: string; name: string }[] = [
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
        execute: (input: Uint8Array) => new Uint8Array([1, 0, 1]), // Success result buffer
      });
    }
  }

  public getPrecompile(address: string): EVMPrecompile | undefined {
    return this.precompiles.get(address.toLowerCase());
  }

  public isPrecompile(address: string): boolean {
    return this.precompiles.has(address.toLowerCase());
  }
}
