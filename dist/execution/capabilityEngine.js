"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapabilitySecurityEngine = void 0;
class CapabilitySecurityEngine {
    grantedCapabilities = new Map();
    grantCapability(permission) {
        const key = permission.grantedTo;
        if (!this.grantedCapabilities.has(key)) {
            this.grantedCapabilities.set(key, new Set());
        }
        this.grantedCapabilities.get(key).add(`${permission.scope}:${permission.id}`);
    }
    verifyCapability(target, scope, id) {
        const capabilities = this.grantedCapabilities.get(target);
        if (!capabilities)
            return false;
        return capabilities.has(`${scope}:${id}`);
    }
    enforceCapability(target, scope, id) {
        if (!this.verifyCapability(target, scope, id)) {
            throw new Error(`FLD-CAP-403: Security Violation - Target ${target} lacks required capability ${scope}:${id}`);
        }
    }
}
exports.CapabilitySecurityEngine = CapabilitySecurityEngine;
