import { beforeAll, describe, expect, it } from 'vitest';
import {
	contractTypeFromErgoTree,
	decodeR4,
	decodeR5,
	decodeR6,
	decodeR7,
	decodeR8
} from './db';
import { ContractType } from './boxRow';
import { SConstant, parse } from '@fleet-sdk/serializer';
import { ErgoAddress, SAFE_MIN_BOX_VALUE } from '@fleet-sdk/core';
import { deposit } from '../turbo-mempool/utils/account';
import {
	PRINTER_ADDRESS,
	PRINTER_MNEMONIC,
	PRINTER_UTXO
} from '../turbo-mempool/mock/utxos';
import {
	BOB_ADDRESS,
	BUY_ORDER_ADDRESS,
	DEPOSIT_ADDRESS,
	SELL_ORDER_ADDRESS
} from '../constants/addresses';
import {
	boxAtAddress,
	boxesAtAddress
} from '../turbo-mempool/utils/test-helper';
import { signTx, signTxMulti } from '../multisig/multisig';
import { buy } from '../turbo-mempool/utils/buy';
import { BOB_MNEMONIC } from '../constants/mnemonics';
import { createSellOrderTx } from '../turbo-mempool/utils/sell';

const depositBox = {
	boxId: '9721de0f8ec7da47b2b31083856bf24819a1d7d755e0e0e57c42fb6ff7a8eff8',
	transactionId:
		'57fb04e45dd1bd63feb5b2191608d2c4f5f6bb4547efca64f664aa83a15582e3',
	blockId: '8ee92294745d0246f21a43d1ef791f220115395324d745b495120d4e33a50fd4',
	value: '10000000',
	index: 0,
	globalIndex: 5626549,
	creationHeight: 1265580,
	settlementHeight: 1265588,
	ergoTree:
		'100204000402d801d601d9010163b2e4c6720104147300009591a3dad9010263e4c67202050401a7da720101a7ea02da720101a7dad9010263b2e4c67202041473010001a7',
	ergoTreeConstants: '0: 0\n1: 1',
	ergoTreeScript:
		'{\n  val func1 = {(box1: Box) => box1.R4[Coll[SigmaProp]].get(placeholder[Int](0)) }\n  if (HEIGHT > {(box2: Box) => box2.R5[Int].get }(SELF)) { func1(SELF) } else {\n    func1(SELF) && {(box2: Box) => box2.R4[Coll[SigmaProp]].get(placeholder[Int](1)) }(SELF)\n  }\n}',
	address:
		't5UVmPtqprz5zN2M2X5fRTajpYD2CYuamxePkcwNFc2t9Yc3DhNMyB81fLAqoL7t91hzyYacMA8uVzkpTYTRdg4A6gZHFZxVsvLo',
	assets: [
		{
			tokenId:
				'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
			index: 0,
			amount: '100000000000',
			name: 'TestToken Test2',
			decimals: 9,
			type: 'EIP-004'
		}
	],
	additionalRegisters: {
		R4: '1402cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2ccd025d163103d491a5193c7b18182442877ce8fcf3ffb9ae9c295d9c98a16dcb0551',
		R5: '04f8dd9a01'
	},
	spentTransactionId: null,
	mainChain: true
};

describe('contractTypeFromErgoTree', () => {
	it('returns sell contract', () => {
		expect(contractTypeFromErgoTree(depositBox), 'buy box').toBe(
			ContractType.DEPOSIT
		);
	});
});

describe('deposit box registers ', () => {
	it('R4(userPk poolPk) can be parsed', () => {
		const expected = {
			poolPk: '9fE4Hk2QXzij6eKt73ki93iWVKboZgRPgV95VZYmazdzqdjPEW8',
			userPK: '9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU'
		};
		expect(decodeR4(depositBox)).toStrictEqual(expected);
	});
	it('R5(unlock height) can be parsed', () => {
		const expected = 1267580;
		expect(decodeR5(depositBox)).toStrictEqual(expected);
	});
});

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

describe('buy order box registers', () => {
	let buyOrderBox: Box;

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
		const depositBox = boxAtAddress(depositTx, DEPOSIT_ADDRESS);

		const token = {
			name: 'TestToken Test2',
			tokenId:
				'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
			amount: 10_000_000_000n,
			decimals: 9
		};
		const RATE = 1n;

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
		buyOrderBox = boxAtAddress(buyOrderTx, BUY_ORDER_ADDRESS);
	});
	it('R4(userPk poolPk) can be parsed', () => {
		const expected = {
			poolPk: '9fE4Hk2QXzij6eKt73ki93iWVKboZgRPgV95VZYmazdzqdjPEW8',
			userPK: '9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU'
		};
		expect(decodeR4(buyOrderBox)).toStrictEqual(expected);
	});
	it('R5(unlock height) can be parsed', () => {
		const expected = 1250700;
		expect(decodeR5(buyOrderBox)).toStrictEqual(expected);
	});
	it('R6 (tokenId) can be parsed', () => {
		const expected =
			'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab';
		expect(decodeR6(buyOrderBox)).toStrictEqual(expected);
	});
	it('R7( rate) can be parsed', () => {
		const expected = 1n;
		expect(decodeR7(buyOrderBox)).toStrictEqual(expected);
	});
	it('R8(deposit address) can be parsed', () => {
		const expected =
			't5UVmPtqprz5zN2M2X5fRTajpYD2CYuamxePkcwNFc2t9Yc3DhNMyB81fLAqoL7t91hzyYacMA8uVzkpTYTRdg4A6gZHFZxVsvLo';
		expect(decodeR8(buyOrderBox)).toStrictEqual(expected);
	});
});

describe(`sell order box registers`, () => {
	let sellOrderBox: Box;

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
		const depositBox = boxAtAddress(depositTx, DEPOSIT_ADDRESS);

		const token = {
			name: 'TestToken Test2',
			tokenId:
				'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
			amount: 10_000_000_000n,
			decimals: 9
		};
		const RATE = 1n;

		const sellOrderUTx = createSellOrderTx(
			BUYER_PK, //<----------___SELLER PK
			DEPOSIT_ADDRESS,
			[depositBox],
			token,
			RATE,
			CHAIN_HEIGHT,
			BUYER_UNLOCK_HEIGHT //<-------_SELLER
		);
		const sellOrderTx = await signTxMulti(
			sellOrderUTx,
			BUYER_MNEMONIC,
			BUYER_PK
		);

		sellOrderBox = boxAtAddress(sellOrderTx, SELL_ORDER_ADDRESS);
	});
	it('R4(userPk poolPk) can be parsed', () => {
		const expected = {
			poolPk: '9fE4Hk2QXzij6eKt73ki93iWVKboZgRPgV95VZYmazdzqdjPEW8',
			userPK: '9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU'
		};
		expect(decodeR4(sellOrderBox)).toStrictEqual(expected);
	});
	it('R5(unlock height) can be parsed', () => {
		const expected = 1250700;
		expect(decodeR5(sellOrderBox)).toStrictEqual(expected);
	});
	it('R6 (tokenId) can be parsed', () => {
		const expected =
			'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab';
		expect(decodeR6(sellOrderBox)).toStrictEqual(expected);
	});
	it('R7( rate) can be parsed', () => {
		const expected = 1n;
		expect(decodeR7(sellOrderBox)).toStrictEqual(expected);
	});
	it('R8(deposit address) can be parsed', () => {
		const expected =
			't5UVmPtqprz5zN2M2X5fRTajpYD2CYuamxePkcwNFc2t9Yc3DhNMyB81fLAqoL7t91hzyYacMA8uVzkpTYTRdg4A6gZHFZxVsvLo';
		expect(decodeR8(sellOrderBox)).toStrictEqual(expected);
	});
});
