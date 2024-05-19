import { beforeAll, describe, expect, it } from 'vitest';
import { SAFE_MIN_BOX_VALUE, type Box } from '@fleet-sdk/core';
import {
	BOB_ADDRESS,
	BUY_ORDER_ADDRESS,
	DEPOSIT_ADDRESS
} from '$lib/constants/addresses';
import {
	PRINTER_ADDRESS,
	PRINTER_MNEMONIC,
	PRINTER_UTXO
} from '$lib/constants/fakeUtxos';
import { deposit } from '$lib/wallet/deposit';
import { signTx, signTxMulti } from '$lib/wallet/multisig';
import { buy } from '$lib/wallet/buy';
import { BOB_MNEMONIC } from '$lib/constants/mnemonics';
import { boxAtAddress, boxesAtAddress } from '$lib/utils/test-helper';

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
		const buyOrderTx = await signTxMulti(
			buyOrderUTx,
			BUYER_MNEMONIC,
			BUYER_PK
		);

		const buyOrderBox = boxAtAddress(buyOrderTx, BUY_ORDER_ADDRESS);
		expect(buyOrderBox, 'buy order box in output').toBeDefined();

		expect(
			boxesAtAddress(buyOrderTx, DEPOSIT_ADDRESS).length,
			'amount of change boxes'
		).toBe(1);
	});
});
