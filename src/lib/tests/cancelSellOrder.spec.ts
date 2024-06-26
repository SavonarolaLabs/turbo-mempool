import { beforeAll, describe, expect, it } from 'vitest';
import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	DEPOSIT_ADDRESS
} from '$lib/constants/addresses';
import { utxos } from '$lib/data/utxos';
import {
	type Amount,
	type Box,
	type OneOrMore
} from '@fleet-sdk/common';
import {
	signMultisig,
	signTxByAddress,
	signTxAllInputs
} from '$lib/wallet/multisig';
import { ALICE_MNEMONIC, BOB_MNEMONIC } from '$lib/constants/mnemonics';
import { canсelSellOrderTx, createSellOrderTx } from '$lib/wallet/sell';

let utxoSell: OneOrMore<Box<Amount>> = [];
let utxoSellMultisig: OneOrMore<Box<Amount>> = [];

const tokenForSale = {
	tokenId: '69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
	amount: '100'
};
const height = 1_209_964;
let unlockHeight: number;

describe(`Bob sellOrder: height:${height}, unlock -10`, () => {
	beforeAll(async () => {
		unlockHeight = height - 10;
		const price = 100n;
		const unsignedTx = createSellOrderTx(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxos[BOB_ADDRESS],
			tokenForSale,
			price,
			height,
			unlockHeight
		);
		const signedTx = await signTxByAddress(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsignedTx
		);
		utxoSell = [signedTx.outputs[0]];
	});

	it('Bob can cancel', async () => {
		const unsignedTx = canсelSellOrderTx(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxoSell,
			height,
			unlockHeight
		);
		const signedTx = await signTxAllInputs(BOB_MNEMONIC, unsignedTx);
		expect(signedTx.inputs.length).toBeDefined();
	});

	it('Bob can cancel to ANY Address', async () => {
		const unsignedTx = canсelSellOrderTx(
			BOB_ADDRESS,
			ALICE_ADDRESS,
			utxoSell,
			height,
			unlockHeight
		);
		const signedTx = await signTxAllInputs(BOB_MNEMONIC, unsignedTx);

		expect(signedTx.inputs.length).toBeDefined();
	});

	it('Alice CANT cancel', async () => {
		const unsignedTx = canсelSellOrderTx(
			ALICE_ADDRESS,
			DEPOSIT_ADDRESS,
			utxoSell,
			height,
			unlockHeight
		);
		expect(() =>
			signTxAllInputs(ALICE_MNEMONIC, unsignedTx)
		).rejects.toThrowError();
	});
});

describe(`Bob sellOrder: height:${height}, unlock +10`, () => {
	beforeAll(async () => {
		unlockHeight = height + 10;
		const price = 100n;
		const unsignedTx = createSellOrderTx(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxos[BOB_ADDRESS],
			tokenForSale,
			price,
			height,
			unlockHeight
		);
		const signedTx = await signTxByAddress(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsignedTx
		);
		utxoSellMultisig = [signedTx.outputs[0]];
	});

	it('Bob CANT cancel', async () => {
		const unsignedTx = canсelSellOrderTx(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxoSellMultisig,
			height,
			unlockHeight
		);

		expect(() =>
			signTxAllInputs(BOB_MNEMONIC, unsignedTx)
		).rejects.toThrowError();
	});

	it('Alice CANT cancel', async () => {
		const unsignedTx = canсelSellOrderTx(
			ALICE_ADDRESS,
			DEPOSIT_ADDRESS,
			utxoSellMultisig,
			height,
			unlockHeight
		);
		expect(() =>
			signTxAllInputs(ALICE_MNEMONIC, unsignedTx)
		).rejects.toThrowError();
	});
	it('Alice+Pool CANT cancel', async () => {
		const unsignedTx = canсelSellOrderTx(
			ALICE_ADDRESS,
			DEPOSIT_ADDRESS,
			utxoSellMultisig,
			height,
			unlockHeight
		);

		expect(() =>
			signMultisig(unsignedTx, ALICE_MNEMONIC, ALICE_ADDRESS)
		).rejects.toThrowError();
	});

	it('Bob+Pool can cancel', async () => {
		const unsignedTx = canсelSellOrderTx(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxoSellMultisig,
			height,
			unlockHeight
		);

		const signedTx = await signMultisig(
			unsignedTx,
			BOB_MNEMONIC,
			BOB_ADDRESS
		);
		expect(signedTx.inputs.length).toBeDefined();
	});
});
