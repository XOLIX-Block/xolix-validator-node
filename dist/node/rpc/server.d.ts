import { XolixNodeDaemon } from '../index.js';
export declare class XolixRpcServer {
    private daemon;
    private server;
    private port;
    constructor(daemon: XolixNodeDaemon, port?: number);
    private formatBlockToEvm;
    private formatTxToEvm;
    private handleMethod;
    private sendResult;
    private sendError;
    start(): void;
    stop(): void;
}
