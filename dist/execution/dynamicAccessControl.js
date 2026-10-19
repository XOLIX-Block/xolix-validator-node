"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.RaiseDynamicAccessControlMatrix = void 0;
class RaiseDynamicAccessControlMatrix {
    roles = new Map();
    createRole(roleId, contractAddress, initialSigners, quorum) {
        const roleKey = `${contractAddress}:${roleId}`;
        const role = {
            roleId,
            contractAddress,
            authorizedAddresses: new Set(initialSigners),
            requiredQuorum: quorum,
        };
        this.roles.set(roleKey, role);
        return role;
    }
    verifyMultiPartyAction(contractAddress, roleId, signers) {
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
exports.RaiseDynamicAccessControlMatrix = RaiseDynamicAccessControlMatrix;
