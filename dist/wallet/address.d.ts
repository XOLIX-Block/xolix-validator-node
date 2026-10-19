import { AddressInfo } from '../types/index.js';
export declare function encodeBech32m(hrp: string, dataBytes: Uint8Array): string;
export declare function decodeBech32m(bechString: string): {
    hrp: string;
    bytes: Uint8Array;
    hex: string;
} | null;
export declare class XolixAddressManager {
    private static PREFIX_MAP;
    static parseAddress(address: string): AddressInfo;
    static deriveEvmEquivalent(nativeAddress: string): string;
    static deriveNativeFromEvm(evmAddress: string, prefix?: 'xol' | 'xolc' | 'xolv' | 'xolg' | 'xols'): string;
    static isValidAddress(address: string): boolean;
}
