import { beforeAll, describe, expect, it } from 'vitest';
import { SAFE_MIN_BOX_VALUE, type Box } from '@fleet-sdk/core';
import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	BUY_ORDER_ADDRESS,
	DEPOSIT_ADDRESS
} from '$lib/server/constants/addresses';
import {
	PRINTER_ADDRESS,
	PRINTER_MNEMONIC,
	PRINTER_UTXO
} from '../turbo-mempool/mock/utxos';
import { deposit } from '../turbo-mempool/utils/account';
import {
	signMultisigPart1,
	signMultisigPart2,
	signTx,
	signTxMulti
} from '$lib/server/multisig/multisig';
import { buy } from '../turbo-mempool/utils/buy';
import { ALICE_MNEMONIC, BOB_MNEMONIC } from '$lib/server/constants/mnemonics';
import {
	boxAtAddress,
	boxesAtAddress
} from '../turbo-mempool/utils/test-helper';

const CHAIN_HEIGHT = 1250600;
const UNLOCK_DELTA = 100;
const BUYER_UNLOCK_HEIGHT = CHAIN_HEIGHT + UNLOCK_DELTA;
const BUYER_PK = BOB_ADDRESS;
const BUYER_MNEMONIC = BOB_MNEMONIC;

const DEPOSIT_TOKEN = {
	name: 'TestToken Test2',
	tokenId: 'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
	amount: 100_000_000_000n,
	decimals: 9
};
const RATE = 1n;
let depositBox: Box;

describe('buy()', () => {
	beforeAll(async () => {
		const depositUTx = deposit(
			CHAIN_HEIGHT,
			PRINTER_UTXO,
			PRINTER_ADDRESS,
			BUYER_PK,
			BUYER_UNLOCK_HEIGHT,
			DEPOSIT_TOKEN,
			10n * SAFE_MIN_BOX_VALUE
		);
		const depositTx = await signTx(depositUTx, PRINTER_MNEMONIC);
		depositBox = boxAtAddress(depositTx, DEPOSIT_ADDRESS);
	});

	it.skip('return with OLD multisig', async () => {
		const token = {
			name: 'TestToken Test2',
			tokenId:
				'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
			amount: 10_000_000_000n,
			decimals: 9
		};

		const buyOrderUTx = buy(
			CHAIN_HEIGHT,
			[depositBox],
			BUYER_PK,
			RATE,
			BUYER_UNLOCK_HEIGHT,
			token,
			SAFE_MIN_BOX_VALUE
		);

		const buyOrderTx = await signTxMulti(
			buyOrderUTx,
			BUYER_MNEMONIC,
			BUYER_PK
		);
	});

	it('returns change to DEPOSIT_ADDRESS', async () => {
		const token = {
			name: 'TestToken Test2',
			tokenId:
				'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
			amount: 10_000_000_000n,
			decimals: 9
		};

		const buyOrderUTx = buy(
			CHAIN_HEIGHT,
			[depositBox],
			BUYER_PK,
			RATE,
			BUYER_UNLOCK_HEIGHT,
			token,
			SAFE_MIN_BOX_VALUE
		);

		const inputsToSign = [buyOrderUTx.inputs[0]];
		// Construct Tx (with ShadowPool commitment)
		// ergoTree:'100204000402d801d601d9010163b2e4c6720104147300009591a3dad9010263e4c67202050401a7da720101a7ea02da720101a7dad9010263b2e4c67202041473010001a7'
		const transactionP1 = await signMultisigPart1(buyOrderUTx); //Boxes to sign?
		// console.log('new hint bag');
		// console.dir(transactionP1.transactionHintsBag, {
		// 	depth: null
		// });

		const transactionP2 = await signMultisigPart2(
			transactionP1.transaction,
			transactionP1.transactionHintsBag,
			ALICE_MNEMONIC,
			ALICE_ADDRESS
		); //Boxes to sign?
		// console.log('🚀 ~ it ~ hintsP2:', transactionP2);
		// console.dir(transactionP2.to_json(), { depth: null });

		//	const buyOrderBox = boxAtAddress(buyOrderTx, BUY_ORDER_ADDRESS);
	});
});
