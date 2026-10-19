<!-- Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved. -->

# XOLIX Protocol Engine & Specification Architecture

## Overview
The `protocol/` module defines the foundational chain parameters, genesis allocations, tokenomics rules, and XOLIX Improvement Proposal (`XIP`) governance state machine for the XOLIX FLUID XOLIX blockchain (`v1.0.0-QuantumAether`).

---

## Core Components

### 1. Chain Parameters (`protocol/chainParameters.ts`)
Defines immutable mainnet (`44990`) and testnet (`44991`) constants:
- **Block Time**: 1.5 seconds target slot duration
- **Target Gas / XCU Limit**: 30,000,000 XCU per block
- **Validator Set Size**: Active consensus quorum (67% minimum threshold)

### 2. Protocol Tokenomics (`protocol/tokenomics.ts`)
Implements multi-token tokenomics:
- **XOLT (Native Coin)**: 1,000,000,000 initial supply; powers consensus staking, XCU gas fees, and validator rewards.
- **Protocol Burn Rate**: 83.33% of native QSC fees permanently destroyed per block; 16.67% allocated to DAO Treasury.

### 3. Genesis Specification (`protocol/genesis.ts`)
Initializes state trees, pre-allocated validator balances, faucet accounts, and native system contracts.

### 4. XIP Governance Engine (`protocol/xipEngine.ts`)
On-chain governance proposal lifecycle engine:
- **Voting Quorum**: 67% network stake threshold
- **Voting Period**: 172,800 blocks (~3 days)
- **Timelock Delay**: 72-hour timelock prior to protocol code activation (`RTLUE`)

---

```
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
```
