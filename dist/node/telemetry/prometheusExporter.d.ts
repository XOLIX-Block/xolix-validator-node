export interface TelemetryMetricsSnapshot {
    connectedPeers: number;
    mempoolSize: number;
    rpcRequestsPerSec: number;
    blockProcessingTimeMs: number;
    memoryUsageBytes: number;
    chainHeadBlock: bigint;
    activeValidators: number;
}
export declare class XolixPrometheusExporter {
    private server;
    private port;
    private metricsCollector;
    private rpcRequestCounter;
    private lastRpcCalculationTime;
    private currentRpcRate;
    constructor(collector: () => TelemetryMetricsSnapshot, port?: number);
    recordRPCRequest(): void;
    start(): Promise<void>;
    stop(): Promise<void>;
}
