export interface WalletAccount {
    address: string;
    evmAddress: string;
    stealthAddress: string;
    mnemonic: string;
    privateKey: string;
    publicKey: string;
    createdAt: string;
}
export interface EncryptedVault {
    version: string;
    address: string;
    evmAddress: string;
    crypto: {
        cipher: string;
        ciphertext: string;
        iv: string;
        tag: string;
        kdf: string;
        salt: string;
        iterations: number;
    };
    createdAt: string;
}
export declare class XolixWalletCLI {
    private static WORDLIST;
    /**
     * Generates cryptographically secure 256-bit entropy using Node.js crypto API
     */
    private static generateEntropy;
    /**
     * Derive a 24-word BIP-39 compatible mnemonic seed phrase from random entropy
     */
    private static entropyToMnemonic;
    /**
     * Create a new XOLIX FLUID wallet with Bech32m (xol1...) and EVM (0x...) addresses using real cryptographic primitives.
     */
    static createWallet(): WalletAccount;
    /**
     * Import existing wallet from 24/12 word mnemonic phrase or private key hex.
     */
    static importWallet(secret: string): WalletAccount;
    /**
     * Exports wallet to AES-256-GCM encrypted JSON vault
     */
    static exportEncryptedVault(wallet: WalletAccount, password: string): EncryptedVault;
    /**
     * Decrypts an AES-256-GCM encrypted JSON vault with password
     */
    static importEncryptedVault(vault: EncryptedVault, password: string): WalletAccount;
    /**
     * Execute token transfer transaction with PoDI AI preflight check and Replay Attack Shield (XRAS).
     */
    static sendTransaction(sender: WalletAccount, recipient: string, amount: bigint, symbol?: string, useStealth?: boolean): {
        txHash: string;
        status: string;
        fee: bigint;
        burned: bigint;
        signature: string;
    };
    /**
     * Query multi-token balance breakdown for an address.
     */
    static getBalances(address: string): {
        address: string;
        xolt: bigint;
        gxo: bigint;
        qusd: bigint;
        stakedXol: bigint;
    };
}
