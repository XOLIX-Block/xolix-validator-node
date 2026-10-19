"use strict";
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XolixPrometheusExporter = void 0;
/**
 * XOLIX Prometheus & Grafana Telemetry Metrics Exporter
 * Version: v0.11.0-QuantumMesh
 *
 * Exposes lightweight HTTP endpoint (/metrics) on port 9090 for real-time operational
 * telemetry monitoring including peers, mempool size, RPC throughput, block processing latency, and heap memory.
 */
const node_http_1 = __importDefault(require("node:http"));
class XolixPrometheusExporter {
    server = null;
    port;
    metricsCollector;
    rpcRequestCounter = 0;
    lastRpcCalculationTime = Date.now();
    currentRpcRate = 0;
    constructor(collector, port = 9090) {
        this.metricsCollector = collector;
        this.port = port;
    }
    recordRPCRequest() {
        this.rpcRequestCounter++;
        const now = Date.now();
        if (now - this.lastRpcCalculationTime >= 1000) {
            this.currentRpcRate = this.rpcRequestCounter / ((now - this.lastRpcCalculationTime) / 1000);
            this.rpcRequestCounter = 0;
            this.lastRpcCalculationTime = now;
        }
    }
    start() {
        return new Promise((resolve) => {
            this.server = node_http_1.default.createServer((req, res) => {
                if (req.method === 'GET' && (req.url === '/metrics' || req.url === '/')) {
                    const snapshot = this.metricsCollector();
                    const metricsOutput = [
                        '# HELP xolix_connected_peers Number of active connected P2P mesh network peers',
                        '# TYPE xolix_connected_peers gauge',
                        `xolix_connected_peers ${snapshot.connectedPeers}`,
                        '',
                        '# HELP xolix_mempool_size Current number of unconfirmed transactions pending in mempool',
                        '# TYPE xolix_mempool_size gauge',
                        `xolix_mempool_size ${snapshot.mempoolSize}`,
                        '',
                        '# HELP xolix_rpc_requests_per_second Current JSON-RPC request throughput rate per second',
                        '# TYPE xolix_rpc_requests_per_second gauge',
                        `xolix_rpc_requests_per_second ${this.currentRpcRate.toFixed(2)}`,
                        '',
                        '# HELP xolix_block_processing_time_ms Execution and state transition latency for last block in milliseconds',
                        '# TYPE xolix_block_processing_time_ms gauge',
                        `xolix_block_processing_time_ms ${snapshot.blockProcessingTimeMs}`,
                        '',
                        '# HELP xolix_memory_usage_bytes Node heap memory usage in bytes',
                        '# TYPE xolix_memory_usage_bytes gauge',
                        `xolix_memory_usage_bytes ${snapshot.memoryUsageBytes}`,
                        '',
                        '# HELP xolix_chain_head_block Current chain head block height',
                        '# TYPE xolix_chain_head_block counter',
                        `xolix_chain_head_block ${snapshot.chainHeadBlock.toString()}`,
                        '',
                        '# HELP xolix_active_validators Number of active consensus validators',
                        '# TYPE xolix_active_validators gauge',
                        `xolix_active_validators ${snapshot.activeValidators}`,
                        '',
                    ].join('\n');
                    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
                    res.end(metricsOutput);
                    return;
                }
                res.writeHead(404);
                res.end('Not Found');
            });
            this.server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.warn(`[Metrics Exporter] Port ${this.port} in use; skipping metrics listener.`);
                    resolve();
                }
                else {
                    console.error(`[Metrics Exporter] Server error:`, err);
                    resolve();
                }
            });
            this.server.listen(this.port, () => {
                console.log(`[Metrics Exporter] Prometheus metrics server running on http://127.0.0.1:${this.port}/metrics`);
                resolve();
            });
        });
    }
    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => resolve());
            }
            else {
                resolve();
            }
        });
    }
}
exports.XolixPrometheusExporter = XolixPrometheusExporter;
