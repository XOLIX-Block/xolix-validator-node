# XOLIX FLUID — Validator Node

> Official validator node for the **XOLIX FLUID** blockchain network.
> 
> **Chain ID:** 44990 | **RPC:** https://rpc.xolix.io | **P2P:** p2p.xolix.io:30303

---

## Requirements
- Node.js v18+
- 100,000 XOLIX staked in `XolixValidatorRegistry` contract
- Authorization from network governance

---

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/XOLIX-Block/xolix-validator-node.git
cd xolix-validator-node
npm install
```

### 2. Generate Your Validator Keypair
```bash
node dist/cli/index.js validator:keygen
```
Outputs:
- `xolv1...` — validator address ← register this on-chain
- `xol1...`  — reward wallet ← block rewards go here automatically
- `0x...`    — EVM address (MetaMask compatible)
- Private key — **keep secret, never share**

### 3. Stake & Register On-Chain
Call `XolixValidatorRegistry.registerValidator()` with 100,000+ XOLIX:
```solidity
registerValidator(
  "xolv1...yourValidatorAddress...",
  "xol1...yourRewardWallet...",
  "yourPublicIP:30303"
)
```

### 4. Configure Your Node
Create a systemd override or set environment variables:
```bash
VALIDATOR_ADDRESS=xolv1...yourValidatorAddress...
VALIDATOR_PRIVATE_KEY=0x...yourPrivateKey...
```

**Systemd (recommended for production):**
```bash
sudo systemctl edit xolix-node.service
```
```ini
[Service]
Environment="VALIDATOR_ADDRESS=xolv1..."
Environment="VALIDATOR_PRIVATE_KEY=0x..."
```

### 5. Start the Node
```bash
# Direct
node dist/node/start.js

# With npm
npm start
```

---

## What Happens Automatically
1. ✅ Connects to `p2p.xolix.io:30303` (primary bootnode)
2. ✅ Discovers peers via gossip network
3. ✅ Verifies chain ID 44990 — wrong chain = auto-disconnect
4. ✅ Downloads and validates full chain history
5. ✅ Produces cryptographically signed blocks (once authorized)
6. ✅ Block rewards automatically sent to your `xol1` reward wallet

---

## CLI Commands
```bash
# Validator management
node dist/cli/index.js validator:keygen                        # Generate keypair
node dist/cli/index.js validator:register xolv1... xol1...    # Register node
node dist/cli/index.js validator:status  xolv1...             # Check authorization
node dist/cli/index.js validator:list                         # List all active validators
node dist/cli/index.js validator:deregister xolv1...          # Deregister node

# Wallet
node dist/cli/index.js wallet:create                          # Generate new wallet
node dist/cli/index.js wallet:balance xol1...                 # Check balance
node dist/cli/index.js wallet:send xol1... <amount> 0xkey     # Send XOLIX
```

---

## Network Details

| | |
|--|--|
| **Chain ID** | 44990 (0xafbe) |
| **RPC Endpoint** | https://rpc.xolix.io |
| **WebSocket** | wss://rpc.xolix.io/ws |
| **P2P Bootnode** | p2p.xolix.io:30303 |
| **Native Currency** | XOLIX (18 decimals) |
| **Block Time** | ~12 seconds |
| **Min Validator Stake** | 100,000 XOLIX |
| **Block Reward** | 0.05 XOLIX + tx fees |

---

## MetaMask / Wallet Configuration
```
Network Name:  XOLIX FLUID Mainnet
RPC URL:       https://rpc.xolix.io
Chain ID:      44990
Symbol:        XOLIX
```

---

## Security
- Every block is **cryptographically signed** with your private key
- Blocks from unauthorized addresses are **auto-rejected** by all nodes
- Wrong chain ID peers are **immediately disconnected**
- 50,000,000 XOLIX **hard supply cap** enforced at protocol level
- Misbehaving validators face **10% stake slashing**
- Replay attacks, zero-value spam, self-transfers all **blocked**

---

## Repository Structure
```
dist/node/       ← Blockchain node (RPC, P2P, storage)
dist/consensus/  ← PoDI block validation + signing
dist/protocol/   ← Genesis config (Chain ID, supply, validators)
dist/cli/        ← xolix CLI tool
dist/evm/        ← EVM smart contract runtime
dist/fluid/      ← FLUID language compiler
dist/wallet/     ← Native address (xol1/xolv1) handling
protocol/genesis/ ← Chain parameters
```

---

## Links
- **Organization:** https://github.com/XOLIX-Block
- **Validator Node:** https://github.com/XOLIX-Block/xolix-validator-node
- **Full Infrastructure:** https://github.com/emryvalyn/XOLIX-Block-FLUID-Infrastructure-
- **RPC:** https://rpc.xolix.io

---

## License
Copyright © 2026 Questdrium Next-Gen Technologies R&D. Inc. All rights reserved.
