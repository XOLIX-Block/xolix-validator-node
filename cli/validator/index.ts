// Copyright (c) 2026 Questdrium Next-Gen Technologies R&D. Inc., All rights reserved.

/**
 * XOLIX Validator CLI Module
 * Commands for node operators to manage validator registration and status
 */

import http from 'node:http';
import crypto from 'node:crypto';

async function rpcCall(method: string, params: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 });
    const req = http.request(
      { hostname: '127.0.0.1', port: 8545, method: 'POST', headers: { 'Content-Type': 'application/json' } },
      (res) => {
        let d = '';
        res.on('data', (c) => d += c);
        res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export async function handleValidatorCommand(command: string, params: string[]): Promise<void> {
  switch(command) {
    case 'validator:status': {
      const addr = params[0];
      if (!addr) { console.error('Usage: xolix validator:status <xolv1...>'); return; }
      const res = await rpcCall('xolix_isValidator', [addr]);
      const active = res.result;
      console.log(`Validator ${addr}`);
      console.log(`Status: ${active ? '✅ ACTIVE — authorized to produce blocks' : '❌ NOT AUTHORIZED'}`);
      const validators = await rpcCall('xolix_getActiveValidators', []);
      console.log(`Total active validators: ${(validators.result || []).length}`);
      break;
    }

    case 'validator:list': {
      const res = await rpcCall('xolix_getActiveValidators', []);
      const list = res.result || [];
      console.log(`Active Validators (${list.length}):`);
      list.forEach((v: string, i: number) => console.log(`  ${i+1}. ${v}`));
      break;
    }

    case 'validator:register': {
      // params: [nativeAddress, rewardAddress]
      const [nativeAddr, rewardAddr] = params;
      if (!nativeAddr || !rewardAddr) {
        console.error('Usage: xolix validator:register <xolv1...> <xol1...rewardWallet>');
        console.error('Note: You must have staked 100,000 XOLT on-chain first');
        return;
      }
      const res = await rpcCall('xolix_registerValidator', [nativeAddr, rewardAddr]);
      if (res.result?.success) {
        console.log('✅ ' + res.result.message);
        console.log('Validator is now authorized to produce blocks.');
        console.log('Block rewards will go to: ' + rewardAddr);
      } else {
        console.error('❌ ' + (res.error?.message || res.result?.reason || 'Failed'));
      }
      break;
    }

    case 'validator:deregister': {
      const [nativeAddr] = params;
      if (!nativeAddr) { console.error('Usage: xolix validator:deregister <xolv1...>'); return; }
      const res = await rpcCall('xolix_deregisterValidator', [nativeAddr]);
      if (res.result?.success) {
        console.log('✅ ' + res.result.message);
      } else {
        console.error('❌ ' + (res.error?.message || 'Failed'));
      }
      break;
    }

    case 'validator:keygen': {
      // Generate a validator keypair
      const { ethers } = require('ethers');
      const wallet = ethers.Wallet.createRandom();
      const evmAddr = wallet.address.toLowerCase();

      // Derive xolv1 address from EVM address
      const { XolixAddressManager } = require('../../wallet/address.js');
      const nativeAddr = XolixAddressManager.evmToNative(evmAddr, 'xolv');
      const rewardAddr = XolixAddressManager.evmToNative(evmAddr, 'xol');

      console.log('');
      console.log('╭──────────────────────────────────────────────────────╮');
      console.log('│     XOLIX Validator Keypair Generated                │');
      console.log('╰──────────────────────────────────────────────────────╯');
      console.log('');
      console.log(`Validator Address (xolv1): ${nativeAddr}`);
      console.log(`Reward Address    (xol1):  ${rewardAddr}`);
      console.log(`EVM Address       (0x):    ${evmAddr}`);
      console.log(`Private Key:               ${wallet.privateKey}`);
      console.log(`Mnemonic:                  ${wallet.mnemonic?.phrase || 'N/A'}`);
      console.log('');
      console.log('⚠️  SAVE YOUR PRIVATE KEY SECURELY. Never share it.');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Stake 100,000+ XOLT in XolixValidatorRegistry contract');
      console.log('     registerValidator("' + nativeAddr + '", "' + rewardAddr + '", "yourip:30303")');
      console.log('  2. Set in systemd: VALIDATOR_ADDRESS=' + nativeAddr);
      console.log('  3. Set in systemd: VALIDATOR_PRIVATE_KEY=' + wallet.privateKey);
      console.log('  4. Run: xolix validator:register ' + nativeAddr + ' ' + rewardAddr);
      console.log('  5. Your node will automatically sign and produce blocks');
      break;
    }

    default: {
      console.log('Validator commands:');
      console.log('  xolix validator:keygen              Generate a new validator keypair');
      console.log('  xolix validator:register <xolv1> <xol1>  Register after staking on-chain');
      console.log('  xolix validator:deregister <xolv1> Remove from active set');
      console.log('  xolix validator:status <xolv1>     Check if authorized');
      console.log('  xolix validator:list                List all active validators');
    }
  }
}
