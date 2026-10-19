// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

import { GenesisConfig } from '../types/index.js';

export const XOLIX_GENESIS_CONFIG: GenesisConfig = {
  chainId: 44990,
  chainName: 'XOLIX FLUID Core Network',
  networkId: 'xolix-mainnet-1',
  version: 'v1.1.0-AegisMesh',
  consensus: 'PoDI',
  nativeCurrency: {
    name: 'XOLIX',
    symbol: 'XOLT',
    decimals: 18,
  },
  initialValidators: [
    'xolv1vzrcew3rnan6xx6g000lqv9309rw4sdpjxx56f', // Questdrium sovereign validator
  ],
  protocolTreasury: 'xolg1vzrcew3rnan6xx6g000lqv9309rw4sdpd5qtck', // Questdrium sovereign treasury
  evmPrecompilesEnabled: true,
  alloc: {
    'xol1vzrcew3rnan6xx6g000lqv9309rw4sdpayrw6g': '50000000', // Questdrium owner wallet — 50M XOLT genesis
  },
};

export function validateGenesisConfig(config: GenesisConfig): boolean {
  if (config.chainId <= 0) return false;
  if (!config.chainName || !config.version) return false;
  if (config.initialValidators.length === 0) return false;
  return true;
}
