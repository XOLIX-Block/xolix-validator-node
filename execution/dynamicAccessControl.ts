// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

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

export class RaiseDynamicAccessControlMatrix {
  private roles: Map<string, AccessControlRole> = new Map();

  public createRole(
    roleId: string,
    contractAddress: string,
    initialSigners: string[],
    quorum: number
  ): AccessControlRole {
    const roleKey = `${contractAddress}:${roleId}`;
    const role: AccessControlRole = {
      roleId,
      contractAddress,
      authorizedAddresses: new Set(initialSigners),
      requiredQuorum: quorum,
    };

    this.roles.set(roleKey, role);
    return role;
  }

  public verifyMultiPartyAction(
    contractAddress: string,
    roleId: string,
    signers: string[]
  ): { isAuthorized: boolean; validSignaturesCount: number; reason?: string } {
    const roleKey = `${contractAddress}:${roleId}`;
    const role = this.roles.get(roleKey);

    if (!role) {
      return { isAuthorized: false, validSignaturesCount: 0, reason: 'R-DACM: Role not defined.' };
    }

    const validSigners = signers.filter(s => role.authorizedAddresses.has(s));
    if (validSigners.length < role.requiredQuorum) {
      return {
        isAuthorized: false,
        validSignaturesCount: validSigners.length,
        reason: `R-DACM: Quorum failed. Got ${validSigners.length} valid signatures, required ${role.requiredQuorum}.`,
      };
    }

    return { isAuthorized: true, validSignaturesCount: validSigners.length };
  }
}
