<!-- Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved. -->

# XOLIX Improvement Proposals (XIPs)

## Overview
The `protocol/xips/` directory contains on-chain governance proposals, improvement specifications, and template manifests for protocol upgrades to the XOLIX FLUID network.

---

## XIP Submission & Governance Lifecycle

1. **Draft Phase**: Proposal authored using [`template.md`](file:///c:/Users/Cameron%20Furniss/Desktop/XOLIX%20FLUID/protocol/xips/template.md).
2. **On-Chain Proposal Submission**: Submitted to [`XolixGovernanceToken.sol`](file:///c:/Users/Cameron%20Furniss/Desktop/XOLIX%20FLUID/contracts/XolixGovernanceToken.sol) or [`GovernanceXolix.fls`](file:///c:/Users/Cameron%20Furniss/Desktop/XOLIX%20FLUID/fluid/contracts/GovernanceXolix.fls).
3. **Voting Period**: Active voting for 172,800 blocks (~3 days). Requires 67% network stake quorum approval.
4. **Timelock Queue**: Passed proposals enter the 72-hour `RTLUE` timelock queue.
5. **Execution**: Automated execution of state logic migration.

---

```
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
```
