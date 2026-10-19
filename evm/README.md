<!-- Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved. -->

# EVM Compatibility & Precompile Execution Subsystem

## Overview
The `evm/` module provides 100% native Ethereum Virtual Machine (`EVM`) bytecode compatibility within the XOLIX FLUID node daemon, enabling standard Solidity (`.sol`) contracts and Web3 tooling (MetaMask, Hardhat, Ethers.js, Viem, Remix) to deploy and execute seamlessly.

---

## Technical Architecture

### 1. EVM Runtime Engine (`evm/runtime.ts`)
Executes EVM opcodes deterministically alongside native `XOLIX VM` contracts. State commitments produce isolated EVM state roots (`0xevm_state_*`).

### 2. 10 Native EVM Precompiles (`evm/precompiles.ts`)
Registers 10 native precompiles mapped across address range `0x0000000000000000000000000000000000000001` through `0x000000000000000000000000000000000000000a`:
1. `0x01`: ECDSA Public Key Recovery
2. `0x02`: SHA256 Hash Accelerator
3. `0x03`: RIPEMD160 Hash Accelerator
4. `0x04`: Identity Data Pass-Through
5. `0x05`: Modular Exponentiation
6. `0x06`: BN256 Elliptic Curve Addition
7. `0x07`: BN256 Elliptic Curve Scalar Multiplication
8. `0x08`: BN256 Elliptic Curve Pairing Check
9. `0x09`: Blake2F Compression Function
10. `0x0a`: Native QSC Asset Cross-Bridge Adapter

### 3. EVM RPC Adapter (`evm/rpc/`)
Implements standard `eth_*` JSON-RPC endpoints (`eth_call`, `eth_sendRawTransaction`, `eth_getBalance`, `eth_getBlockByNumber`).

---

```
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.
```
