import { XolixNodeDaemon } from '../index.js';
export interface RPCServerConfig {
    port?: number;
    host?: string;
    rateLimitPerMin?: number;
}
export declare class XolixRPCServer {
    private server;
    private node;
    private port;
    private host;
    private requestCounts;
    private maxRequestsPerMin;
    constructor(node: XolixNodeDaemon, config?: RPCServerConfig);
    /**
     * Start HTTP JSON-RPC Server
     */
    start(): Promise<void>;
    /**
     * Stop HTTP Server
     */
    stop(): Promise<void>;
    private handleHTTPRequest;
    private isRateLimited;
    private isValidAddress;
    private isValidHash;
    private processJSONRPCRequest;
}
