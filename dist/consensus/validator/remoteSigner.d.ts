export interface RemoteSignerConfig {
    type: 'LOCAL' | 'WEB3SIGNER' | 'AWS_KMS' | 'GCP_KMS' | 'HASHICORP_VAULT';
    remoteUrl?: string;
    keyId?: string;
    authToken?: string;
    localPrivateKey?: string;
    timeoutMs?: number;
}
export interface SignBlockRequest {
    blockHash: string;
    blockNumber: bigint;
    proposer: string;
    chainId: number;
}
export interface IValidatorSigner {
    getSignerAddress(): string;
    signBlockHash(request: SignBlockRequest): Promise<string>;
    signTransactionPayload(payloadHash: string): Promise<string>;
}
export declare class LocalKeyfileSigner implements IValidatorSigner {
    private address;
    private privateKey;
    constructor(address: string, privateKey: string);
    getSignerAddress(): string;
    signBlockHash(request: SignBlockRequest): Promise<string>;
    signTransactionPayload(payloadHash: string): Promise<string>;
}
export declare class Web3SignerRemote implements IValidatorSigner {
    private address;
    private remoteUrl;
    private keyId;
    private authToken?;
    constructor(address: string, config: RemoteSignerConfig);
    getSignerAddress(): string;
    signBlockHash(request: SignBlockRequest): Promise<string>;
    signTransactionPayload(payloadHash: string): Promise<string>;
    private postRemoteSignerRequest;
}
export declare class ValidatorSignerFactory {
    static createSigner(address: string, config?: RemoteSignerConfig): IValidatorSigner;
}
