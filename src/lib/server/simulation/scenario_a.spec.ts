import { beforeAll, describe, expect, it } from 'vitest';
import { initDb } from '../db-server/db';
import { PRINTER_ADDRESS, PRINTER_MNEMONIC, PRINTER_UTXO } from '../turbo-mempool/mock/utxos';
import { deposit, depositMultiple } from '../turbo-mempool/utils/account';
import { signTx } from '../multisig/multisig';
import { boxesAtAddress } from '../turbo-mempool/utils/test-helper';
import { DEPOSIT_ADDRESS } from '../constants/addresses';
import type { Box } from '@fleet-sdk/common';


const userA = {
	mnemonic:
		'item stay almost tomato chronic coast art wire dust brass demise park',
	address: '9iGVEPcZk5Q6aweZXfVdgA6p7huhWJ9GtGe9pYhs6SBfJSQFEYe'
};

const userB = {
	mnemonic:
		'street sad winner stay wrong square option amused solid captain laptop october',
	address: '9f99JMoDMtygYiHeRcXvR55BxmFkcGPtHKgUrowA9maxeqQk7Xm'
};

const userC = {
	mnemonic:
		'dream inquiry truly laundry mixed have able fatigue animal mobile subway state',
	address: '9g3HxMBLh7csKkWsNnifSHWVEq9d7JrRzwzg15tQ4hbECbvP12a'
};

const tokenTest1 = {
	tokenId: "d2d0deb3b0b2c511e523fd43ae838ba7b89e4583f165169b90215ff11d942c1f",
	index: 0,
	amount: "1000000000000000",
	name: "SwapToken Test1",
	decimals: 9,
	type: "EIP-004"
  }
const tokenTest2 = {
	tokenId: "b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab",
	index: 0,
	amount: "50000000000000000",
	name: "TestToken Test2",
	decimals: 9,
	type: "EIP-004"
}

/*
Scenarios: (userA,userB,userC)

1. UserA:Deposit (0.2Erg,assets:{tokenId:Test1,amount:100})
2. UserB:Deposit (0.10Erg,assets:{tokenId:Test2,amount:100})
3. UserC:Deposit (0.10Erg,assets:{tokenId:Test2,amount:100})

4. UserA:Create Buy (10 Test2, Price:0.002, value: 0.020Erg)
5. UserA:Create Buy (10 Test2, Price:0.001, value: 0.010Erg)
6. UserB:Execute Buy (5 Test, Price:0.002, value: 0.010Erg)
7. UserC:Execute Buy (10 Test, Price:0.0015, value: 0.015Erg)

8. UserA: Cancel Buy (...)

9. Withdraw All...
*/
const deposits = [
	{
		userPK: userA.address,
		tokens: [{
			tokenId: tokenTest1.tokenId,
			amount: BigInt(100*10**tokenTest1.decimals)
		}],
		nanoErg: BigInt(200_000_000).toString()
	},{
		userPK: userB.address,
		tokens: [{
			tokenId: tokenTest2.tokenId,
			amount: BigInt(100*10**tokenTest2.decimals)
		}],
		nanoErg: BigInt(200_000_000).toString()
	},{
		userPK: userC.address,
		tokens: [{
			tokenId: tokenTest2.tokenId,
			amount: BigInt(100*10**tokenTest2.decimals)
		}],
		nanoErg: BigInt(200_000_000).toString()
	},
]

const CHAIN_HEIGHT = 1250600;
const UNLOCK_DELTA = 200000;
const BUYER_UNLOCK_HEIGHT = CHAIN_HEIGHT + UNLOCK_DELTA;

let db;
let depositBoxes: Box[];
async function initUserBalance(){
	const depositUTx = depositMultiple(
		CHAIN_HEIGHT,
		PRINTER_UTXO,
		PRINTER_ADDRESS,
		BUYER_UNLOCK_HEIGHT,
		deposits
	);
	const depositTx = await signTx(depositUTx, PRINTER_MNEMONIC);
	depositBoxes = boxesAtAddress(depositTx, DEPOSIT_ADDRESS);
}

describe('screnario', () => {
	beforeAll(() => {
		db = initDb();
		initUserBalance();
	});
	it('A', () => {
		expect(depositBoxes.length,"deposit boxes").toBe(3);
	});
});
