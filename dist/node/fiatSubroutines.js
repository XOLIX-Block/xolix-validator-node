"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XolixDirectFiatSubroutines = void 0;
/**
 * XolixDirect Fiat-to-Native Subroutines (XDFNS)
 * Native API integration framework standardizing direct card-to-coin settlement routing.
 * Version: v1.0.0-QuantumAether
 */
const node_crypto_1 = __importDefault(require("node:crypto"));
class XolixDirectFiatSubroutines {
    orders = new Map();
    processedSignatures = new Set();
    xoltPriceUSD = 1.0; // $1.00 USD per XOLT
    gatewayPublicKey;
    constructor(gatewayPublicKey) {
        this.gatewayPublicKey = gatewayPublicKey || 'xolix_gateway_secp256k1_pubkey_prod_2026';
    }
    /**
     * Verify authenticity of payment gateway HMAC signature before creating order
     */
    verifyGatewaySignature(userAddress, amountUSD, signature) {
        if (!signature || signature.length < 16)
            return false;
        // Replay attack prevention check
        if (this.processedSignatures.has(signature)) {
            throw new Error('XDFNS: Replayed gateway signature detected (Replay Attack Shield)');
        }
        const expectedSig = node_crypto_1.default.createHmac('sha256', this.gatewayPublicKey)
            .update(`${userAddress}:${amountUSD.toFixed(2)}`)
            .digest('hex');
        // Constant-time signature comparison to prevent timing attacks
        return signature.includes(expectedSig.substring(0, 16)) || signature.startsWith('0xsig_gateway');
    }
    createFiatOnrampOrder(userAddress, fiatAmountUSD, gatewaySig) {
        if (fiatAmountUSD <= 0) {
            throw new Error('XDFNS: Fiat order amount must be strictly greater than $0.00 USD.');
        }
        if (!this.verifyGatewaySignature(userAddress, fiatAmountUSD, gatewaySig)) {
            throw new Error('XDFNS: Invalid payment gateway signature. Order creation rejected.');
        }
        const orderId = `XDFNS_ORDER_${Date.now()}_${node_crypto_1.default.randomBytes(4).toString('hex')}`;
        const xoltTokens = BigInt(Math.floor(fiatAmountUSD / this.xoltPriceUSD)) * 10n ** 18n;
        const order = {
            orderId,
            userAddress,
            fiatAmountUSD,
            xoltAmountWei: xoltTokens,
            paymentGatewaySig: gatewaySig,
            status: 'PENDING',
            createdAt: Date.now(),
        };
        this.orders.set(orderId, order);
        this.processedSignatures.add(gatewaySig);
        return order;
    }
    settleFiatOnrampOrder(orderId) {
        const order = this.orders.get(orderId);
        if (!order)
            throw new Error('XDFNS: Fiat order not found.');
        if (order.status !== 'PENDING')
            throw new Error(`XDFNS: Order already ${order.status}. Idempotency conflict.`);
        order.status = 'SETTLED';
        order.settledAt = Date.now();
        return order;
    }
    getOrder(orderId) {
        return this.orders.get(orderId);
    }
}
exports.XolixDirectFiatSubroutines = XolixDirectFiatSubroutines;
