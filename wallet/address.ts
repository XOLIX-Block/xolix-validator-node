// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

import { AddressInfo, AddressPrefix } from '../types/index.js';

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
const BECH32M_CONST = 0x2bc830a3;

function polymod(values: number[]): number {
  let chk = 1;
  for (let p = 0; p < values.length; ++p) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ values[p];
    for (let i = 0; i < 5; ++i) {
      if ((top >> i) & 1) chk ^= GENERATOR[i];
    }
  }
  return chk;
}

function hrpExpand(hrp: string): number[] {
  const ret: number[] = [];
  for (let p = 0; p < hrp.length; ++p) ret.push(hrp.charCodeAt(p) >> 5);
  ret.push(0);
  for (let p = 0; p < hrp.length; ++p) ret.push(hrp.charCodeAt(p) & 31);
  return ret;
}

function convertBits(data: number[] | Uint8Array, frombits: number, tobits: number, pad: boolean): number[] {
  let acc = 0;
  let bits = 0;
  const ret: number[] = [];
  const maxv = (1 << tobits) - 1;
  for (let p = 0; p < data.length; ++p) {
    acc = (acc << frombits) | data[p];
    bits += frombits;
    while (bits >= tobits) {
      bits -= tobits;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad && bits > 0) {
    ret.push((acc << (tobits - bits)) & maxv);
  }
  return ret;
}

export function encodeBech32m(hrp: string, dataBytes: Uint8Array): string {
  const words = convertBits(dataBytes, 8, 5, true);
  const combined = hrpExpand(hrp).concat(words).concat([0, 0, 0, 0, 0, 0]);
  const mod = polymod(combined) ^ BECH32M_CONST;
  const checksum: number[] = [];
  for (let p = 0; p < 6; ++p) {
    checksum.push((mod >> (5 * (5 - p))) & 31);
  }
  return hrp + '1' + words.concat(checksum).map(w => CHARSET[w]).join('');
}

export function decodeBech32m(bechString: string): { hrp: string; bytes: Uint8Array; hex: string } | null {
  const pos = bechString.lastIndexOf('1');
  if (pos < 1 || pos + 7 > bechString.length) return null;
  const hrp = bechString.substring(0, pos).toLowerCase();
  const data: number[] = [];
  for (let p = pos + 1; p < bechString.length; ++p) {
    const d = CHARSET.indexOf(bechString.charAt(p).toLowerCase());
    if (d === -1) return null;
    data.push(d);
  }
  if (polymod(hrpExpand(hrp).concat(data)) !== BECH32M_CONST) return null;
  const words = data.slice(0, data.length - 6);
  const bytesArr = convertBits(words, 5, 8, false);
  const bytes = new Uint8Array(bytesArr);
  const hex = '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return { hrp, bytes, hex };
}

export class XolixAddressManager {
  private static PREFIX_MAP: Record<AddressPrefix, string> = {
    xol1: 'Native User Account',
    xolc1: 'Native Smart Contract',
    xolv1: 'Network Validator Node',
    xolg1: 'Governance / Protocol DAO',
    xols1: 'System / Core Module Account',
    '0x': 'EVM Compatible Account',
  };

  public static parseAddress(address: string): AddressInfo {
    if (address.startsWith('0x')) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new Error(`Invalid EVM address format: ${address}`);
      }
      return {
        raw: address,
        prefix: '0x',
        evmEquivalent: address,
        isContract: false,
        isValidator: false,
      };
    }

    const prefixes: AddressPrefix[] = ['xol1', 'xolc1', 'xolv1', 'xolg1', 'xols1'];
    const matchedPrefix = prefixes.find((p) => address.startsWith(p));

    if (!matchedPrefix) {
      throw new Error(`Unrecognized XOLIX address prefix for: ${address}`);
    }

    return {
      raw: address,
      prefix: matchedPrefix,
      isContract: matchedPrefix === 'xolc1',
      isValidator: matchedPrefix === 'xolv1',
      evmEquivalent: XolixAddressManager.deriveEvmEquivalent(address),
    };
  }

  public static deriveEvmEquivalent(nativeAddress: string): string {
    // 1. Try mathematical BIP-350 Bech32m decoding first
    const decoded = decodeBech32m(nativeAddress);
    if (decoded && decoded.bytes.length === 20) {
      return decoded.hex.toLowerCase();
    }

    // 2. Deterministic hash fallback for arbitrary string addresses
    let hash = 0;
    for (let i = 0; i < nativeAddress.length; i++) {
      hash = (hash << 5) - hash + nativeAddress.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(40, '7a91f4c82e6d3b9a1f0c7d5e8b42a6f3c91d0e27');
    return '0x' + hex.substring(0, 40);
  }

  public static deriveNativeFromEvm(evmAddress: string, prefix: 'xol' | 'xolc' | 'xolv' | 'xolg' | 'xols' = 'xol'): string {
    const clean = evmAddress.toLowerCase().replace('0x', '');
    if (clean.length !== 40) {
      throw new Error(`Invalid EVM address length: ${evmAddress}`);
    }
    const bytes = new Uint8Array(20);
    for (let i = 0; i < 20; i++) {
      bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
    }
    return encodeBech32m(prefix, bytes);
  }

  public static isValidAddress(address: string): boolean {
    try {
      XolixAddressManager.parseAddress(address);
      return true;
    } catch {
      return false;
    }
  }
}
