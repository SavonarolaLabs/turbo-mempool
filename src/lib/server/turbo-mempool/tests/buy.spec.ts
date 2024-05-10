import { beforeAll, describe, expect, it } from 'vitest';
import { sellOrderAddress } from '$lib/server/constants/sellOrder';
import {
	ErgoAddress,
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	SAFE_MIN_BOX_VALUE,
	TransactionBuilder,
	type Box
} from '@fleet-sdk/core';
import { ALICE_ADDRESS, BOB_ADDRESS } from '$lib/server/constants/addresses';
import { FUNDING_ADDRESS, FUNDING_MNEMONIC, FUNDING_UTXO } from '../mock/utxos';
import { deposit } from '../utils/account';
import { signMultisig, signTx, signTxAllInputs, signTxMulti } from '$lib/server/multisig/multisig';
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

//let depositBox;
let sellOrderBox: Box;

describe('limit sell order', () => {
	beforeAll(async () => {
		const depositUTx = deposit(
			CHAIN_HEIGHT,
			FUNDING_UTXO,
			FUNDING_ADDRESS,
			BUYER_PK,
			BUYER_UNLOCK_HEIGHT,
			BUY_ORDER_TOKEN,
			10n * SAFE_MIN_BOX_VALUE
		);
		const depositTx = await signTx(depositUTx, FUNDING_MNEMONIC);
		const depositBox = depositTx.outputs.find(
			(o) => o.ergoTree == ErgoAddress.fromBase58(FUNDING_ADDRESS).ergoTree
		);
		expect(depositBox?.assets[0].amount).toBe(BUY_ORDER_TOKEN.amount);

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

		sellOrderBox = (buyOrderTx.outputs.find(
			(o) => o.ergoTree == ErgoAddress.fromBase58(BUYER_PK).ergoTree
		) as Box)
	});

	it("valid sell order", ()=>{
		expect(sellOrderBox).toBeDefined();
	})
});
