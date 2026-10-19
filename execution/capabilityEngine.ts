// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

import { CapabilityPermission } from '../types/index.js';

export class CapabilitySecurityEngine {
  private grantedCapabilities: Map<string, Set<string>> = new Map();

  public grantCapability(permission: CapabilityPermission): void {
    const key = permission.grantedTo;
    if (!this.grantedCapabilities.has(key)) {
      this.grantedCapabilities.set(key, new Set());
    }
    this.grantedCapabilities.get(key)!.add(`${permission.scope}:${permission.id}`);
  }

  public verifyCapability(target: string, scope: string, id: string): boolean {
    const capabilities = this.grantedCapabilities.get(target);
    if (!capabilities) return false;
    return capabilities.has(`${scope}:${id}`);
  }

  public enforceCapability(target: string, scope: string, id: string): void {
    if (!this.verifyCapability(target, scope, id)) {
      throw new Error(`FLD-CAP-403: Security Violation - Target ${target} lacks required capability ${scope}:${id}`);
    }
  }
}
