export interface FiatOnrampOrder {
    orderId: string;
    userAddress: string;
    fiatAmountUSD: number;
    xoltAmountWei: bigint;
    paymentGatewaySig: string;
    status: 'PENDING' | 'SETTLED' | 'FAILED';
    createdAt: number;
    settledAt?: number;
}
export declare class XolixDirectFiatSubroutines {
    private orders;
    private processedSignatures;
    private readonly xoltPriceUSD;
    private gatewayPublicKey;
    constructor(gatewayPublicKey?: string);
    /**
     * Verify authenticity of payment gateway HMAC signature before creating order
     */
    verifyGatewaySignature(userAddress: string, amountUSD: number, signature: string): boolean;
    createFiatOnrampOrder(userAddress: string, fiatAmountUSD: number, gatewaySig: string): FiatOnrampOrder;
    settleFiatOnrampOrder(orderId: string): FiatOnrampOrder;
    getOrder(orderId: string): FiatOnrampOrder | undefined;
}
