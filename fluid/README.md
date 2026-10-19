<!-- Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved. -->

# FluidScript (`.fls`) Language Compiler & Tooling Suite

## Overview
The `fluid/` module contains the compiler pipeline, standard library, lexer, parser, AST generator, type checker, and language tools for **FluidScript (`.fls`)**, XOLIX FLUID's native capability-secured domain-specific smart contract language.

---

## Compiler Pipeline Architecture (`fluid/compiler/`)

```text
    ┌────────────────┐
    │ Source (.fls)  │
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │ Lexer & Parser │  ──> Generates Tokens & AST (fluid/compiler/ast/)
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │ Type & Capability│ ──> Validates FLD-CAP-403 capabilities & Reentrancy Guards
    │    Checker     │
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │ CodeGen Engine │  ──> Emits XLS Binary Bytecode (.xls)
    └────────────────┘
```

---

## Language Specifications (`fluid/specification/`)
- **`grammar.md`**: Formal EBNF grammar definitions.
- **`type-system.md`**: Native types (`uint256`, `address`, `capability`, `resource`, `event`).
- **`security.md`**: `Security.require_no_reentrancy()` preflight guards and isolation rules.

---

## Native Smart Contracts (`fluid/contracts/`)
Includes production-ready native FluidScript implementations:
- [`XolixNativeCoin.fls`](file:///c:/Users/Cameron%20Furniss/Desktop/XOLIX%20FLUID/fluid/contracts/XolixNativeCoin.fls) — Native Layer-1 coin logic.
- [`GovernanceXolix.fls`](file:///c:/Users/Cameron%20Furniss/Desktop/XOLIX%20FLUID/fluid/contracts/GovernanceXolix.fls) — Governance staking token.
- [`QusdStablecoin.fls`](file:///c:/Users/Cameron%20Furniss/Desktop/XOLIX%20FLUID/fluid/contracts/QusdStablecoin.fls) — QUSD stablecoin contract.
- [`XolixVaultManager.fls`](file:///c:/Users/Cameron%20Furniss/Desktop/XOLIX%20FLUID/fluid/contracts/XolixVaultManager.fls) — Native yield vault manager.
- [`XolixDaoTreasury.fls`](file:///c:/Users/Cameron%20Furniss/Desktop/XOLIX%20FLUID/fluid/contracts/XolixDaoTreasury.fls) — DAO treasury contract.

---

```
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
```
