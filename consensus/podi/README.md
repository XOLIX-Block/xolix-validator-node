<!-- Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved. -->

# Proof-of-Dynamic-Intelligence (PoDI) Consensus Subsystem

## Overview
The `consensus/podi/` module implements XOLIX FLUID's proprietary Proof-of-Dynamic-Intelligence consensus mechanism, integrating validator stake with real-time, deterministic AI neural preflight risk scoring (`SentientGuard`).

---

## Technical Architecture

### 1. Preflight AI Risk Engine (`consensus/podi.ts`)
Evaluates transaction parameters prior to mempool admission:
$$S_{\text{risk}} = w_1 \cdot \text{Anomaly}(T_x) + w_2 \cdot \text{Variance}(P) + w_3 \cdot \text{GasShift}$$
- **Score Cutoff**: Transactions producing $S_{\text{risk}} > 0.75$ are rejected automatically.
- **Zero-Address Guard**: Rejects transaction envelopes targeting `0x0000000000000000000000000000000000000000` with error code `FLD-SEC-101`.

### 2. Staking Pool & Slashing (`consensus/stakingPool.ts`)
- **Minimum Validator Deposit**: 100,000 XOL
- **Equivocation Slashing**: Double-signing or double-proposing triggers an automated 10% stake slash routed directly to the DAO Treasury.

### 3. Proposer & Quorum Selection (`consensus/podi/proposer-selection/`)
Determines block proposer selection per round using weighted validator stake combined with verifiable random functions (VRF).

---

```
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
```
