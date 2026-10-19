# XOLIX FLUID — Validator Node

Run a validator node on the XOLIX FLUID blockchain (Chain ID: 44990).

## Requirements
- Node.js v18+
- 100,000 XOLIX staked in XolixValidatorRegistry contract
- Authorization from network governance

## Quick Start

### 1. Install
```bash
git clone https://github.com/emryvalyn/xolix-validator-node.git
cd xolix-validator-node
npm install
```

### 2. Generate Your Validator Keypair
```bash
node dist/cli/index.js validator:keygen
```
This outputs:
- `xolv1...` — your validator address (register this on-chain)
- `xol1...`  — your reward wallet (block rewards sent here)
- `0x...`    — EVM address (for MetaMask / contract interactions)
- Private key — **keep this secret and secure**

### 3. Stake & Register On-Chain
Call `XolixValidatorRegistry.registerValidator()` with 100,000+ XOLIX:
```
registerValidator(
  "xolv1...yourValidatorAddress...",
  "xol1...yourRewardWallet...",
  "yourip:30303"
)
```

### 4. Configure
Edit your systemd service or create a `.env` file:
```
VALIDATOR_ADDRESS=xolv1...yourValidatorAddress...
VALIDATOR_PRIVATE_KEY=0x...yourPrivateKey...
DB_PATH=./.xolix_data
WS_PORT=8546
```

**Systemd (recommended):**
```bash
sudo systemctl edit xolix-node.service
```
Add:
```ini
[Service]
Environment="VALIDATOR_ADDRESS=xolv1..."
Environment="VALIDATOR_PRIVATE_KEY=0x..."
```

### 5. Start
```bash
# Direct
node dist/node/start.js

# Systemd (production)
sudo systemctl start xolix-node
sudo systemctl enable xolix-node
```

## What Happens Automatically
1. Connects to `p2p.xolix.io:30303` (primary bootnode)
2. Discovers other peers via gossip protocol
3. Verifies chain ID 44990 — wrong chain = disconnected
4. Downloads missing blocks from peers
5. Produces signed blocks (if authorized)
6. Block rewards go to your registered `xol1` reward wallet

## CLI Commands
```bash
node dist/cli/index.js wallet:create              # Generate user wallet
node dist/cli/index.js wallet:balance xol1...     # Check balance
node dist/cli/index.js wallet:send xol1... 10 0x. # Send XOLIX
node dist/cli/index.js validator:keygen           # Generate validator keypair
node dist/cli/index.js validator:register xolv1.. xol1..  # Register node
node dist/cli/index.js validator:status xolv1..   # Check authorization
node dist/cli/index.js validator:list             # List active validators
```

## Network Details
| | |
|--|--|
| Chain ID | 44990 (0xafbe) |
| RPC | https://rpc.xolix.io |
| WSS | wss://rpc.xolix.io/ws |
| P2P Bootnode | p2p.xolix.io:30303 |
| Native Currency | XOLIX (18 decimals) |
| Block Time | ~12 seconds |
| Min Validator Stake | 100,000 XOLIX |

## Security
- Blocks cryptographically signed with your private key
- Unauthorized validators auto-rejected by the network
- 50M XOLIX hard supply cap enforced at protocol level
- Slashing: 10% stake burned for misbehavior

## License
Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc. All rights reserved.
