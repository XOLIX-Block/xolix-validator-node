import { Block } from '../../types/index.js';
export interface WSSubscription {
    id: string;
    topic: 'newHeads' | 'logs' | 'pendingTransactions';
    socket: any;
}
export declare class XolixWebSocketServer {
    private subscriptions;
    private server;
    private port;
    constructor(port?: number);
    start(): Promise<void>;
    private handleWSUpgrade;
    private handleClientFrame;
    /**
     * Broadcast newly minted block immediately to all active newHeads WS subscribers
     */
    broadcastNewBlock(block: Block): void;
    private sendWSFrame;
    private decodeWSFrame;
    private removeClientSubscriptions;
    stop(): Promise<void>;
}
