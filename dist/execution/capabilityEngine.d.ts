import { CapabilityPermission } from '../types/index.js';
export declare class CapabilitySecurityEngine {
    private grantedCapabilities;
    grantCapability(permission: CapabilityPermission): void;
    verifyCapability(target: string, scope: string, id: string): boolean;
    enforceCapability(target: string, scope: string, id: string): void;
}
