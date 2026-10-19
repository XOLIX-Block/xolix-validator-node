"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.XolixCrypto = exports.XolixSecurity = exports.XolixMath = void 0;
/**
 * FluidScript Standard Libraries (@xolix/core, @xolix/assets, @xolix/security, @xolix/governance, @xolix/math, @xolix/crypto)
 * Version: v0.10.0-QuantumGenesis
 */
var XolixMath;
(function (XolixMath) {
    function percent(amount, percentVal) {
        return (amount * BigInt(percentVal)) / BigInt(100);
    }
    XolixMath.percent = percent;
    function percentOf(amount, numerator, denominator) {
        return (amount * BigInt(numerator)) / BigInt(denominator);
    }
    XolixMath.percentOf = percentOf;
    function safeAdd(a, b) {
        const c = a + b;
        if (c < a)
            throw new Error('MathOverflow: Addition overflow');
        return c;
    }
    XolixMath.safeAdd = safeAdd;
    function safeSub(a, b) {
        if (b > a)
            throw new Error('MathUnderflow: Subtraction underflow');
        return a - b;
    }
    XolixMath.safeSub = safeSub;
})(XolixMath || (exports.XolixMath = XolixMath = {}));
var XolixSecurity;
(function (XolixSecurity) {
    function requireNonZeroAddress(address) {
        if (!address || address === '0x0000000000000000000000000000000000000000') {
            throw new Error('FLD-SEC-101: Zero address forbidden');
        }
    }
    XolixSecurity.requireNonZeroAddress = requireNonZeroAddress;
    function requirePositiveAmount(amount) {
        if (amount <= BigInt(0)) {
            throw new Error('FLD-SEC-102: Amount must be greater than zero');
        }
    }
    XolixSecurity.requirePositiveAmount = requirePositiveAmount;
})(XolixSecurity || (exports.XolixSecurity = XolixSecurity = {}));
var XolixCrypto;
(function (XolixCrypto) {
    function computeStateHash(payload) {
        let hash = 0;
        for (let i = 0; i < payload.length; i++) {
            hash = (hash << 5) - hash + payload.charCodeAt(i);
            hash |= 0;
        }
        return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
    }
    XolixCrypto.computeStateHash = computeStateHash;
})(XolixCrypto || (exports.XolixCrypto = XolixCrypto = {}));
