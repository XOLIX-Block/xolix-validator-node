#!/usr/bin/env node
// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

/**
 * XOLIX FLUID Unified Command Line Interface (CLI) & Main Interactive Dashboard
 * Version: v1.0.0-QuantumAether
 */

import readline from 'node:readline';
import { XolixNodeDaemon } from '../node/index.js';
import { FluidScriptCompiler } from '../fluid/compiler/index.js';
import { XolixWalletCLI } from './wallet/index.js';
import { handleValidatorCommand } from './validator/index.js';
import { runFullIntegrationAudit } from '../tests/fullIntegration.test.js';

export function runCLI(args: string[]): void {
  const command = args[0];

  if (!command || command === 'menu' || command === 'interactive') {
    startInteractiveMenu();
    return;
  }

  executeCommand(command, args.slice(1)).catch(console.error);
}

async function executeCommand(command: string, params: string[]): Promise<void> {
  console.log('╭────────────────────────────────────────╮');
  console.log('│      XOLIX FLUID CLI v1.0.0-Aether     │');
  console.log('╰────────────────────────────────────────╯');

  switch (command) {
    case 'wallet:create': {
      console.log('Generating new XOLIX FLUID Native Wallet Keypair...');
      const wallet = XolixWalletCLI.createWallet();
      console.log(`✓ Native Address:  ${wallet.address}`);
      console.log(`✓ EVM Address:     ${wallet.evmAddress}`);
      console.log(`✓ Stealth Address: ${wallet.stealthAddress}`);
      console.log(`✓ Mnemonic Seed:   "${wallet.mnemonic}"`);
      console.log(`✓ Private Key:     ${wallet.privateKey}`);
      break;
    }

    case 'wallet:import': {
      const secret = params[0];
      if (!secret) {
        console.error('Error: Please provide a mnemonic seed or private key.');
        console.log('Usage: xolix wallet:import "<mnemonic_or_key>"');
        break;
      }
      const wallet = XolixWalletCLI.importWallet(secret);
      console.log('✓ Successfully Imported Wallet:');
      console.log(`✓ Native Address:  ${wallet.address}`);
      console.log(`✓ EVM Address:     ${wallet.evmAddress}`);
      break;
    }

    case 'wallet:balance': {
      const targetAddr = params[0];
      if (!targetAddr) {
        console.error('Usage: xolix wallet:balance <xol1...address>');
        break;
      }
      console.log(`Querying balances for ${targetAddr}...`);
      const http = require('node:http');
      const res = await new Promise<any>((resolve) => {
        const body = JSON.stringify({jsonrpc:'2.0',method:'xolix_getBalances',params:[targetAddr],id:1});
        const req = http.request({hostname:'127.0.0.1',port:8545,method:'POST',headers:{'Content-Type':'application/json'}}, (r: any) => {
          let d = ''; r.on('data', (c: any) => d += c); r.on('end', () => resolve(JSON.parse(d)));
        });
        req.write(body); req.end();
      });
      const b = res.result || {};
      console.log(`  XOLT (Native Coin):   ${(BigInt(b.xolt||'0') / 10n**18n).toString()} XOLIX`);
      console.log(`  GXO (Governance):     ${(BigInt(b.gxo||'0') / 10n**18n).toString()} GXO`);
      console.log(`  QUSD (Stablecoin):    ${(BigInt(b.qusd||'0') / 10n**18n).toString()} QUSD`);
      console.log(`  Staked:               ${(BigInt(b.stakedXol||'0') / 10n**18n).toString()} XOL`);
      break;
    }

    case 'wallet:send': {
      const recipient = params[0];
      const amountStr = params[1];
      const privateKeyHex = params[2];

      if (!recipient || !amountStr || !privateKeyHex) {
        console.error('Usage: xolix wallet:send <recipient> <amount> <privateKey>');
        console.error('Example: xolix wallet:send xol1abc... 10 0xprivkey...');
        break;
      }

      const amount = BigInt(amountStr) * 10n**18n;
      const { ethers } = require('ethers');
      const http = require('node:http');

      // Derive wallet from private key
      const ethWallet = new ethers.Wallet(privateKeyHex.startsWith('0x') ? privateKeyHex : '0x' + privateKeyHex);
      const senderEvm = ethWallet.address.toLowerCase();

      // Get nonce
      const nonceRes = await new Promise<any>((resolve) => {
        const body = JSON.stringify({jsonrpc:'2.0',method:'eth_getTransactionCount',params:[senderEvm,'latest'],id:1});
        const req = http.request({hostname:'127.0.0.1',port:8545,method:'POST',headers:{'Content-Type':'application/json'}}, (res: any) => {
          let d = ''; res.on('data', (c: any) => d += c); res.on('end', () => resolve(JSON.parse(d)));
        });
        req.write(body); req.end();
      });
      const nonce = parseInt(nonceRes.result, 16) || 0;

      // Build tx payload
      const txHash = '0x' + require('node:crypto').createHash('sha256')
        .update(senderEvm + ':' + recipient + ':' + amount.toString() + ':' + nonce + ':' + Date.now())
        .digest('hex');

      // Sign: hash(sender:recipient:value:nonce) with ECDSA
      const msgHash = require('node:crypto').createHash('sha256')
        .update(senderEvm + ':' + recipient + ':' + amount.toString() + ':' + nonce)
        .digest('hex');
      const signResult = await ethWallet.signMessage(msgHash);

      // Submit to node
      const submitRes = await new Promise<any>((resolve) => {
        const body = JSON.stringify({
          jsonrpc:'2.0', method:'xolix_sendTransaction',
          params:[{
            txHash, sender: senderEvm, recipient,
            value: amount.toString(), nonce,
            gasPrice: '1000000000', payload: '0x',
            executionLane: 'EVM', capabilities: [], resourceLimit: 21000,
            signature: signResult, timestamp: Date.now(),
          }], id: 1
        });
        const req = http.request({hostname:'127.0.0.1',port:8545,method:'POST',headers:{'Content-Type':'application/json'}}, (res: any) => {
          let d = ''; res.on('data', (c: any) => d += c); res.on('end', () => resolve(JSON.parse(d)));
        });
        req.write(body); req.end();
      });

      if (submitRes.result?.success) {
        console.log(`✓ Transaction submitted: ${submitRes.result.txHash}`);
        console.log(`✓ From: ${senderEvm}`);
        console.log(`✓ To:   ${recipient}`);
        console.log(`✓ Amount: ${amountStr} XOLIX`);
      } else {
        console.error(`✗ Transaction failed: ${submitRes.result?.reason || submitRes.error?.message || 'unknown'}`);
      }
      break;
    }

    case 'node:start': {
        console.log('Launching XOLIX Node Daemon & Production RPC Server...');
        const { XolixRPCServer } = require('../node/rpc/index.js');
        const { XOLIX_GENESIS_CONFIG } = require('../protocol/genesis.js');
        const { ethers } = require('ethers');
        
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        readline.question('🔒 [SECURITY] Enter Validator Private Key (Hex) to start Consensus Engine (or press Enter for Observer Mode): ', (privateKey: string) => {
            readline.close();
            
            let activeValidator = undefined as any;

            if (privateKey.trim().length > 0) {
                try {
                    const wallet = new ethers.Wallet(privateKey.trim().startsWith('0x') ? privateKey.trim() : '0x' + privateKey.trim());
                    const evmAddress = wallet.address.toLowerCase();
                    const derivedValidatorAddress = 'xolv1' + evmAddress.substring(2);

                    console.log(`✅ [SECURITY] Cryptographic Derivation Successful.`);
                    console.log(`🔑 Derived Public Validator Address: ${derivedValidatorAddress}`);

                    if (XOLIX_GENESIS_CONFIG.initialValidators.includes(derivedValidatorAddress)) {
                        activeValidator = derivedValidatorAddress;
                        console.log('✅ [SECURITY] Address is AUTHORIZED in Genesis configuration. Access Granted.');
                    } else {
                        console.log('❌ [SECURITY] Address is NOT AUTHORIZED in Genesis configuration! Access Denied.');
                        console.log('ℹ️ Starting node in Read-Only Observer Mode.');
                    }
                } catch (error) {
                    console.log('❌ [SECURITY] Invalid Elliptic Curve Private Key format! Access Denied.');
                    console.log('ℹ️ Starting node in Read-Only Observer Mode.');
                }
            } else {
                 console.log('ℹ️ No key provided. Starting node in Read-Only Observer Mode.');
            }

            // XolixNodeDaemon now inherently boots its own RPC and Metrics servers
            const node = new XolixNodeDaemon({ validatorAddress: activeValidator });
            
            console.log(`🚀 XOLIX FLUID Node & JSON-RPC Server listening on http://0.0.0.0:8545`);
            console.log(`📈 Active Chain Height: ${node.getChainHeight()}`);
            
            if (activeValidator) {
                node.startConsensusEngine();
            }
        });
        break;
      }

    case 'fluid:build':
    case 'fluid:compile': {
      const targetFile = params[0];
      if (!targetFile) {
        console.error('Error: Please specify a .fls file to compile.');
        console.log('Usage: xolix fluid:compile <path/to/contract.fls>');
        break;
      }
      
      const fs = require('fs');
      const path = require('path');
      
      try {
        console.log(`Compiling FluidScript source: ${targetFile}...`);
        const sourceCode = fs.readFileSync(targetFile, 'utf8');
        
        const artifact = FluidScriptCompiler.compile(sourceCode);
        
        const outDir = path.join(process.cwd(), 'build');
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }
        
        const outPath = path.join(outDir, `${artifact.contractName}.xls`);
        fs.writeFileSync(outPath, JSON.stringify(artifact, null, 2));
        
        console.log(`✓ Successfully Compiled Contract: ${artifact.contractName}`);
        console.log(`✓ Generated XLS Bytecode Artifact: ${outPath}`);
        console.log(`✓ XCU Execution Estimate: ${artifact.maxResourceEstimate}`);
        console.log(`✓ Cryptographic State Schema Hash: ${artifact.stateSchemaHash}`);
      } catch (err: any) {
        console.error(`❌ Compiler Fatal Error: ${err.message}`);
      }
      break;
    }

    case 'validator:keygen':
    case 'validator:register':
    case 'validator:deregister':
    case 'validator:status':
    case 'validator:list': {
      handleValidatorCommand(command, params).catch(console.error);
      break;
    }

    case 'system:test':
    case 'test:all': {
      console.log('Launching Full System Integration & Security Simulation Suite...');
      runFullIntegrationAudit();
      break;
    }

    default: {
      console.log('Available Commands:');
      console.log('  node dist/cli/index.js                       - Launch Main Interactive Dashboard');
      console.log('  node dist/cli/index.js wallet:create         - Generate new native keypair & addresses');
      console.log('  node dist/cli/index.js wallet:import <key>   - Import existing wallet from seed or key');
      console.log('  node dist/cli/index.js wallet:balance <addr> - Query multi-token balances');
      console.log('  node dist/cli/index.js wallet:send <to> <amt>- Transfer tokens with preflight & XRAS shield');
      console.log('  node dist/cli/index.js node:start            - Launch local XOLIX node with PoDI consensus');
      console.log('  node dist/cli/index.js fluid:build           - Compile FluidScript (.fls) to XLS bytecode');
      console.log('  node dist/cli/index.js system:test           - Run Live System Simulation & Full Audit');
      break;
    }
  }
}

function startInteractiveMenu(): void {
  console.log('╭────────────────────────────────────────────────────────╮');
  console.log('│      XOLIX FLUID XOLIX Blockchain Main CLI         │');
  console.log('│               v1.0.0-QuantumAether                     │');
  console.log('╰────────────────────────────────────────────────────────╯');
  console.log('  [1] 🔑 Create New Native Wallet Keypair');
  console.log('  [2] 📥 Import Existing Wallet (Seed or Private Key)');
  console.log('  [3] 💰 Query Multi-Token Account Balances');
  console.log('  [4] 💸 Send Tokens (with AI SentientGuard & XRAS Shield)');
  console.log('  [5] ⚡ Launch Local Node Daemon (PoDI + EVM Runtime)');
  console.log('  [6] 🛠️  Compile FluidScript (.fls) to XLS Bytecode');
  console.log('  [7] 🧪 Run Live System Simulation & Full Integration Audit');
  console.log('  [8] ❌ Exit Dashboard');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Select an option [1-8]: ', (answer) => {
    const option = answer.trim();
    rl.close();

    switch (option) {
      case '1':
        executeCommand('wallet:create', []);
        break;
      case '2': {
        const subRl = readline.createInterface({ input: process.stdin, output: process.stdout });
        subRl.question('Enter mnemonic seed phrase or private key: ', (key) => {
          subRl.close();
          executeCommand('wallet:import', [key.trim()]);
        });
        break;
      }
      case '3': {
        const subRl = readline.createInterface({ input: process.stdin, output: process.stdout });
        subRl.question('Enter address (leave blank for default): ', (addr) => {
          subRl.close();
          if (!addr.trim()) {
            console.error('Please enter a wallet address');
          } else {
            executeCommand('wallet:balance', [addr.trim()]).catch(console.error);
          }
        });
        break;
      }
      case '4': {
        const subRl = readline.createInterface({ input: process.stdin, output: process.stdout });
        subRl.question('Enter recipient address: ', (to) => {
          subRl.question('Enter transfer amount: ', (amt) => {
            subRl.close();
            executeCommand('wallet:send', [to.trim(), amt.trim() || '10']);
          });
        });
        break;
      }
      case '5':
        executeCommand('node:start', []);
        break;
      case '6':
        executeCommand('fluid:build', []);
        break;
      case '7':
        executeCommand('system:test', []);
        break;
      case '8':
        console.log('Exiting XOLIX FLUID Dashboard. Goodbye!');
        break;
      default:
        console.log('Invalid option selected.');
        break;
    }
  });
}

if (require.main === module) {
  runCLI(process.argv.slice(2));
}
