<!-- Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved. -->

# XOLIX Node Daemon — Production Deployment & Operator Manual

## Overview
The `node/` module implements the full node daemon for validator nodes, public RPC endpoints, and indexer operators. It features both a low-latency **Native Rust Engine** (`node/src/`) and an enterprise **TypeScript Node Daemon** (`node/index.ts`).

---

## 1. System Requirements & Prerequisites

### Hardware Specifications
* **CPU**: 8 vCPUs / Cores (x86_64 or ARM64)
* **RAM**: 32 GB RAM minimum (64 GB recommended for RPC nodes)
* **Storage**: 1 TB NVMe SSD (High IOPS)
* **Network**: 1 Gbps dedicated unmetered network connection

### Required System Libraries & Tools
Install system build tools and cryptographic dependencies:

```bash
# Ubuntu / Debian Linux
sudo apt update && sudo apt install -y \
  build-essential \
  pkg-config \
  libssl-dev \
  clang \
  cmake \
  curl \
  git \
  docker.io \
  docker-compose

# Install Node.js 20 LTS & TypeScript
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g typescript ts-node

# Install Rust Toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env
```

---

## 2. Environment Configuration & Network Ports

### Required Network Firewall Ports

| Port | Protocol | Purpose | Access Level |
| :--- | :--- | :--- | :--- |
| **`30303`** | TCP / UDP | P2P Node Discovery & GossipSub | **Public Internet** |
| **`8545`** | TCP | JSON-RPC 2.0 HTTP API (`eth_*`, `xol_*`) | Public or Load Balancer |
| **`8546`** | TCP | WebSocket Subscription API | Public or Load Balancer |
| **`50051`** | TCP | gRPC Streaming API | Internal / Indexers |
| **`9090`** | TCP | Prometheus Metrics Endpoint | Internal Monitoring Only |

---

## 3. Deployment Guide: AWS (EC2 & EKS)

### Option A: AWS EC2 Instance Deployment (Ubuntu 22.04 LTS)

1. **Launch EC2 Instance**:
   - Instance Type: `c6i.2xlarge` or `m6i.2xlarge` (8 vCPU, 32GB RAM).
   - Storage: 1 TB GP3 EBS Volume (3,000 IOPS minimum).
   - Security Group: Allow inbound TCP/UDP `30303`, TCP `8545`, `8546`, and SSH `22`.

2. **Clone & Build Monorepo**:
   ```bash
   git clone https://github.com/emryvalyn/XOLIX-Block-FLUID-Infrastructure-.git
   cd XOLIX-Block-FLUID-Infrastructure-
   npm install
   npx tsc
   cargo build --release --manifest-path node/Cargo.toml
   ```

3. **Configure Systemd Production Service**:
   Create `/etc/systemd/system/xolix-node.service`:
   ```ini
   [Unit]
   Description=XOLIX FLUID Production Validator Node Daemon
   After=network.target

   [Service]
   Type=simple
   User=ubuntu
   WorkingDirectory=/home/ubuntu/XOLIX-Block-FLUID-Infrastructure-
   ExecStart=/usr/bin/node dist/node/index.js
   Restart=always
   RestartSec=5
   Environment=NODE_ENV=production
   Environment=CHAIN_ID=44990
   Environment=P2P_PORT=30303
   Environment=RPC_PORT=8545
   Environment=WS_PORT=8546
   LimitNOFILE=65536

   [Install]
   WantedBy=multi-user.target
   ```

4. **Start & Enable Node Service**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable xolix-node
   sudo systemctl start xolix-node
   sudo systemctl status xolix-node
   ```

---

## 4. Deployment Guide: Google Cloud Platform (GCP Compute Engine & GKE)

### Option A: GCP Compute Engine Instance

1. **Create Compute Instance**:
   ```bash
   gcloud compute instances create xolix-validator-1 \
     --zone=us-central1-a \
     --machine-type=n2-standard-8 \
     --boot-disk-type=pd-ssd \
     --boot-disk-size=1000GB \
     --image-family=ubuntu-2204-lts \
     --image-project=ubuntu-os-cloud
   ```

2. **Configure GCP Firewall Rules**:
   ```bash
   gcloud compute firewall-rules create allow-xolix-p2p \
     --allow=tcp:30303,udp:30303 \
     --target-tags=xolix-node

   gcloud compute firewall-rules create allow-xolix-rpc \
     --allow=tcp:8545,tcp:8546 \
     --target-tags=xolix-node
   ```

3. **Deploy via Docker Container**:
   ```bash
   # Build Production Docker Container
   docker build -t xolix/node-daemon:latest -f deployments/docker/Dockerfile .

   # Launch Daemon Container
   docker run -d --name xolix-node-prod \
     --restart always \
     -p 30303:30303/tcp -p 30303:30303/udp \
     -p 8545:8545 -p 8546:8546 -p 9090:9090 \
     -v /var/lib/xolix/data:/app/node/storage \
     xolix/node-daemon:latest
   ```

---

## 5. Node Verification & Health Checks

Verify node daemon health and synchronization:

```bash
# 1. Query Node Health Status
curl -X GET http://localhost:8545/health

# 2. Query JSON-RPC Block Height
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 3. Stream Node Logs
journalctl -u xolix-node -f -n 100
```

---

## 6. Internal Node Daemon Architecture & Subsystem Specification

### A. Persistent Disk Storage Engine & Write-Ahead Log (WAL) (`node/storage/`)
- **Block Storage (`blocks.xdb`)**: Append-only JSON line block ledger.
- **Write-Ahead Log (`mempool.wal`)**: Immediate disk append logging for uncommitted transactions to guarantee zero transaction loss upon unexpected node restarts.
- **State Tree (`state.xdb`)**: Account state balance snapshots.

### B. Production JSON-RPC Server (`node/rpc/`)
- **Endpoints**: `eth_blockNumber`, `eth_getBalance`, `xolix_getBalance`, `xolix_getLatestBlock`, `xolix_submitTx`.
- **DDoS Mitigation**: 1MB payload cap and 600 req/min IP sliding window rate-limiter.
- **Health Check**: `/health` HTTP endpoint for load balancer health probes.

### C. Authenticated P2P Gossip & Peer Reputation (`node/p2p/`)
- **Peer Scoring**: 0 to 100 initial reputation score.
- **Automated Banning**: Nodes falling below 20 pts (due to invalid signatures, double-proposals, or spam) are automatically banned from the gossip mesh.

---

## Copyright & Ownership

```
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
```
