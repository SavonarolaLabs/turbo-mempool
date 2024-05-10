import { beforeAll, describe, expect, it } from 'vitest';
import {
	ErgoAddress, SAFE_MIN_BOX_VALUE, type Box
} from '@fleet-sdk/core';
import { BOB_ADDRESS, BUY_ORDER_ADDRESS, DEPOSIT_ADDRESS } from '$lib/server/constants/addresses';
import { PRINTER_ADDRESS, PRINTER_MNEMONIC, PRINTER_UTXO } from '../mock/utxos';
import { deposit } from '../utils/account';
import { signTx, signTxMulti } from '$lib/server/multisig/multisig';
import { buy } from '../utils/buy';
import { BOB_MNEMONIC } from '$lib/server/constants/mnemonics';

const CHAIN_HEIGHT = 1250600;
const UNLOCK_DELTA = 100;
const BUYER_UNLOCK_HEIGHT = CHAIN_HEIGHT + UNLOCK_DELTA;
const BUYER_PK = BOB_ADDRESS;
const BUYER_MNEMONIC = BOB_MNEMONIC;
const BUY_ORDER_TOKEN = {
	name: 'TestToken Test2',
	tokenId: 'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
	amount: 100_000_000_000n, // this is only 100 tokens
	decimals: 9
};
const RATE = 1n;

let buyOrderBox: Box;

describe('buy', () => {
	beforeAll(async () => {
		const depositUTx = deposit(
			CHAIN_HEIGHT,
			PRINTER_UTXO,
			PRINTER_ADDRESS,
			BUYER_PK,
			BUYER_UNLOCK_HEIGHT,
			BUY_ORDER_TOKEN,
			10n * SAFE_MIN_BOX_VALUE
		);
		const depositTx = await signTx(depositUTx, PRINTER_MNEMONIC);
		const depositBox = depositTx.outputs.find(
			(o) => o.ergoTree == ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree
		);

		const buyOrderUTx = buy(
			CHAIN_HEIGHT,
			[(depositBox as Box)],
			BUYER_PK,
			RATE,
			BUYER_UNLOCK_HEIGHT,
			BUY_ORDER_TOKEN,
			SAFE_MIN_BOX_VALUE
		)
		const buyOrderTx = await signTxMulti(buyOrderUTx, BUYER_MNEMONIC, BUYER_PK);
		buyOrderBox = (buyOrderTx.outputs.find(
			(o) => o.ergoTree == ErgoAddress.fromBase58(BUY_ORDER_ADDRESS).ergoTree
		) as Box)
	});

	it("create buy order box", ()=>{
		expect(buyOrderBox).toBeDefined();
	})
});
