import { beforeAll, describe, expect, it } from 'vitest';
import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	DEPOSIT_ADDRESS,
	SELL_ORDER_ADDRESS,
	SHADOWPOOL_ADDRESS
} from '$lib/server/constants/addresses';
import { utxos } from '$lib/server/utxo/unspent';
import {
	first,
	type Amount,
	type Box,
	type EIP12UnsignedTransaction,
	type OneOrMore
} from '@fleet-sdk/common';
import {
	ErgoAddress,
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	SAFE_MIN_BOX_VALUE,
	SByte,
	SColl,
	SGroupElement,
	SInt,
	SLong,
	SSigmaProp,
	TransactionBuilder
} from '@fleet-sdk/core';
import {
	signMultisig,
	signTx,
	signTxAllInputs,
} from '$lib/server/multisig/multisig';
import { ALICE_MNEMONIC, BOB_MNEMONIC } from '$lib/server/constants/mnemonics';

//global
let utxoSell: OneOrMore<Box<Amount>> = [];
let utxoSellMultisig: OneOrMore<Box<Amount>> = [];

const tokenForSale = {
	tokenId: '69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
	amount: '100'
};
const height = 1209964; // 1,259,399
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
		const signedTx = await signTx(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx);
		utxoSell = [signedTx.outputs[0]];
	});

	it('Bob can cancel', async () => {
		const unsignedTx = canсelSellOrderTx(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxoSell,
			tokenForSale.tokenId,
			height,
			unlockHeight
		);
		const signedTx = await signTxAllInputs(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsignedTx
		);
		expect(signedTx.inputs.length).toBeDefined();
	});

	it('Bob can cancel to ANY Address', async () => {
		const unsignedTx = canсelSellOrderTx(
			BOB_ADDRESS,
			ALICE_ADDRESS,
			utxoSell,
			tokenForSale.tokenId,
			height,
			unlockHeight
		);
		const signedTx = await signTxAllInputs(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsignedTx
		);

		expect(signedTx.inputs.length).toBeDefined();
	});

	it('Alice CANT cancel', async () => {
		const unsignedTx = canсelSellOrderTx(
			ALICE_ADDRESS,
			DEPOSIT_ADDRESS,
			utxoSell,
			tokenForSale.tokenId,
			height,
			unlockHeight
		);
		expect(() =>
			signTxAllInputs(ALICE_MNEMONIC, ALICE_ADDRESS, unsignedTx)
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
		const signedTx = await signTx(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx);
		utxoSellMultisig = [signedTx.outputs[0]];
	});

	it('Bob CANT cancel', async () => {
		const unsignedTx = canсelSellOrderTx(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxoSellMultisig,
			tokenForSale.tokenId,
			height,
			unlockHeight
		);

		expect(() =>
			signTxAllInputs(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx)
		).rejects.toThrowError();
	});

	it('Alice CANT cancel', async () => {
		const unsignedTx = canсelSellOrderTx(
			ALICE_ADDRESS,
			DEPOSIT_ADDRESS,
			utxoSellMultisig,
			tokenForSale.tokenId,
			height,
			unlockHeight
		);
		expect(() =>
			signTxAllInputs(ALICE_MNEMONIC, ALICE_ADDRESS, unsignedTx)
		).rejects.toThrowError();
	});
	it('Alice+Pool CANT cancel', async () => {
		const unsignedTx = canсelSellOrderTx(
			ALICE_ADDRESS,
			DEPOSIT_ADDRESS,
			utxoSellMultisig,
			tokenForSale.tokenId,
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
			tokenForSale.tokenId,
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

export function createSellOrderTx(
	sellerPK: string,
	sellerMultisigAddress: string,
	inputBoxes: OneOrMore<Box<Amount>>,
	token: { tokenId: string; amount: Amount },
	sellRate: bigint,
	currentHeight: number,
	unlockHeight: number
): EIP12UnsignedTransaction {
	const output = new OutputBuilder(SAFE_MIN_BOX_VALUE, SELL_ORDER_ADDRESS)
		.addTokens(token)
		.setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(
					first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())
				),
				SGroupElement(
					first(
						ErgoAddress.fromBase58(
							SHADOWPOOL_ADDRESS
						).getPublicKeys()
					)
				)
			]).toHex(),
			R5: SInt(unlockHeight).toHex(),
			R6: SColl(SByte, token.tokenId).toHex(),
			R7: SLong(sellRate).toHex(),
			R8: SColl(SByte, ErgoAddress.fromBase58(sellerMultisigAddress).ergoTree).toHex()
		});

	const unsignedTransaction = new TransactionBuilder(currentHeight)
		.from(inputBoxes)
		.to(output)
		.sendChangeTo(sellerPK)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	return unsignedTransaction;
}

//TODO: FIX REGISTERS
export function canсelSellOrderTx(
	sellerPK: string,
	multisigAddress: string,
	inputBoxes: OneOrMore<Box<Amount>>,
	tokenId: string,
	currentHeight: number,
	unlockHeight: number
): EIP12UnsignedTransaction {
	let mandatoryBoxes = inputBoxes;

	const tokens = mandatoryBoxes.flatMap((box) => box.assets);
	let value = mandatoryBoxes.reduce((a, e) => +a + +e.value, 0);

	if (value < SAFE_MIN_BOX_VALUE) {
		value = SAFE_MIN_BOX_VALUE;
	}

	const output = new OutputBuilder(value, multisigAddress)
		.addTokens(tokens)
		.setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(
					first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())
				),
				SGroupElement(
					first(
						ErgoAddress.fromBase58(
							SHADOWPOOL_ADDRESS
						).getPublicKeys()
					)
				)
			]).toHex(),
			R5: SInt(unlockHeight).toHex()
		});

	const unsignedTransaction = new TransactionBuilder(currentHeight)
		.configureSelector((selector) =>
			selector.ensureInclusion(mandatoryBoxes.map((b) => b.boxId))
		)
		.from([...inputBoxes, ...utxos[sellerPK]])
		.to(output)
		.sendChangeTo(sellerPK)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	return unsignedTransaction;
}

export function canсelBrokenSellOrderTx(
	sellerPK: string,
	multisigAddress: string,
	inputBoxes: OneOrMore<Box<Amount>>,
	tokenId: string,
	currentHeight: number,
	unlockHeight: number
): EIP12UnsignedTransaction {
	let mandatoryBoxes = inputBoxes;

	const tokens = mandatoryBoxes.flatMap((box) => box.assets);
	let value = mandatoryBoxes.reduce((a, e) => +a + +e.value, 0);

	if (value < SAFE_MIN_BOX_VALUE) {
		value = SAFE_MIN_BOX_VALUE;
	}

	const output = new OutputBuilder(value, multisigAddress)
		.addTokens(tokens)
		.setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(
					first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())
				),
				SGroupElement(
					first(
						ErgoAddress.fromBase58(
							SHADOWPOOL_ADDRESS
						).getPublicKeys()
					)
				)
			]).toHex(),
			R5: SInt(unlockHeight).toHex()
		});

	const unsignedTransaction = new TransactionBuilder(currentHeight)
		.configureSelector((selector) =>
			selector.ensureInclusion(mandatoryBoxes.map((b) => b.boxId))
		)
		.from([...inputBoxes, ...utxos[sellerPK]])
		.to(output)
		.sendChangeTo(sellerPK)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	return unsignedTransaction;
}
