/**
 * RAISE Dynamic Access Control Matrix (R-DACM)
 * Cryptographic privilege management standard in node storage layer.
 * Dynamically rotates administrative rights based on multi-party behavioral consensus.
 * Version: v1.0.0-QuantumAether
 */
export interface AccessControlRole {
    roleId: string;
    contractAddress: string;
    authorizedAddresses: Set<string>;
    requiredQuorum: number;
}
export declare class RaiseDynamicAccessControlMatrix {
    private roles;
    createRole(roleId: string, contractAddress: string, initialSigners: string[], quorum: number): AccessControlRole;
    verifyMultiPartyAction(contractAddress: string, roleId: string, signers: string[]): {
        isAuthorized: boolean;
        validSignaturesCount: number;
        reason?: string;
    };
}
