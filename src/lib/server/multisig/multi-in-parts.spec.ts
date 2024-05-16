import { beforeAll, describe, expect, it } from 'vitest';
import { SAFE_MIN_BOX_VALUE, type Box } from '@fleet-sdk/core';
import {
	BOB_ADDRESS,
	BUY_ORDER_ADDRESS,
	DEPOSIT_ADDRESS
} from '$lib/server/constants/addresses';
import {
	PRINTER_ADDRESS,
	PRINTER_MNEMONIC,
	PRINTER_UTXO
} from '../turbo-mempool/mock/utxos';
import {
	signTx,
	signTxMulti,
	submitTx,
	txHasErrors
} from '$lib/server/multisig/multisig';
import { buy } from '../turbo-mempool/utils/buy';
import { BOB_MNEMONIC } from '$lib/server/constants/mnemonics';
import {
	boxAtAddress,
	boxesAtAddress
} from '../turbo-mempool/utils/test-helper';
import { deposit } from '../turbo-mempool/utils/account';
import {
	signMultisigV1,
	signPart1,
	signPart2,
	signPart3
} from './multi-in-parts';
import { utxos } from '../utxo/unspent';
import type { SignedTransaction } from '@fleet-sdk/common';

const CHAIN_HEIGHT = 1265580;
const UNLOCK_DELTA = 2000;
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
let realBox: Box;
let realDepostiTx: SignedTransaction;

describe('buy virtual box', () => {
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

	it('signMultisigV1', async () => {
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

		const hintsServer = await signPart1(buyOrderUTx);
		const hintsUserPartial = await signPart2(
			buyOrderUTx,
			hintsServer,
			BUYER_MNEMONIC,
			BUYER_PK
		);
		const buyOrderTx = await signPart3(buyOrderUTx, hintsUserPartial);

		const buyOrderBox = boxAtAddress(buyOrderTx, BUY_ORDER_ADDRESS);
		expect(buyOrderBox, 'buy order box in output').toBeDefined();

		expect(
			boxesAtAddress(buyOrderTx, DEPOSIT_ADDRESS).length,
			'amount of change boxes'
		).toBe(1);
	});
});

describe('buy real box', () => {
	beforeAll(async () => {
		const realUtxo = utxos[PRINTER_ADDRESS];

		const depositUTx = deposit(
			CHAIN_HEIGHT,
			realUtxo,
			PRINTER_ADDRESS,
			BUYER_PK,
			BUYER_UNLOCK_HEIGHT,
			DEPOSIT_TOKEN,
			10n * SAFE_MIN_BOX_VALUE
		);
		//console.dir(depositUTx, { depth: null });
		realDepostiTx = await signTx(depositUTx, PRINTER_MNEMONIC);

		realBox = utxos[DEPOSIT_ADDRESS][0];
	});

	it.skip('deposit real box', async () => {
		const errors = await txHasErrors(realDepostiTx);
		console.log(errors);
		const submitedTx = await submitTx(realDepostiTx);
		expect(submitedTx).toBeTypeOf('string');
	});

	it('signTxMulti < unlock height', async () => {
		const token = {
			name: 'TestToken Test2',
			tokenId:
				'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
			amount: 10_000_000_000n,
			decimals: 9
		};

		const buyOrderUTx = buy(
			CHAIN_HEIGHT,
			[realBox],
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
		expect(await txHasErrors(buyOrderTx)).toBe(false);
	});

	it('signMultisigV1 real box < unlock height', async () => {
		const token = {
			name: 'TestToken Test2',
			tokenId:
				'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
			amount: 10_000_000_000n,
			decimals: 9
		};

		const buyOrderUTx = buy(
			CHAIN_HEIGHT,
			[realBox],
			BUYER_PK,
			RATE,
			BUYER_UNLOCK_HEIGHT,
			token,
			SAFE_MIN_BOX_VALUE
		);

		const hintsServer = await signPart1(buyOrderUTx);
		const hintsUserPartial = await signPart2(
			buyOrderUTx,
			hintsServer,
			BUYER_MNEMONIC,
			BUYER_PK
		);
		const buyOrderTx = await signPart3(buyOrderUTx, hintsUserPartial);

		const buyOrderBox = boxAtAddress(buyOrderTx, BUY_ORDER_ADDRESS);
		expect(buyOrderBox, 'buy order box in output').toBeDefined();

		expect(
			boxesAtAddress(buyOrderTx, DEPOSIT_ADDRESS).length,
			'amount of change boxes'
		).toBe(1);
		console.dir(buyOrderBox, { depth: null });
		expect(await txHasErrors(buyOrderTx)).toBe(false);
	});
});
