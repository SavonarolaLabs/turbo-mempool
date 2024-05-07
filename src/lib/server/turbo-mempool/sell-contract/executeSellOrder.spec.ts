import { beforeAll, describe, expect, it } from 'vitest';
import { createDepositTx } from '../account';
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
import type { AssetStandard } from '$lib/types/internal';
import {
	getProver,
	signMultisig,
	signTx,
	signTxAllInputs,
	submitTx,
	txHasErrors
} from '$lib/server/multisig/multisig';
import { ALICE_MNEMONIC, BOB_MNEMONIC } from '$lib/server/constants/mnemonics';
import { fakeContext } from '$lib/server/multisig/fakeContext';
import { wasmModule } from '$lib/server/tx-chaining/utils/wasm-module';
import JSONBig from 'json-bigint';
import { createSellOrderTx } from './cancelSellOrder.spec';

//global
let utxoSell: OneOrMore<Box<Amount>> = [];
let utxoSellMultisig: OneOrMore<Box<Amount>> = [];

const tokenForSale = {
	tokenId: '69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
	amount: '100'
};
const height = 1209964; // 1,259,399
let unlockHeight: number;

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

	it('Alice can BUY from Order (partialy)', async () => {
		const unsignedTx = executeSellOrderTx(
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

		// expect(() =>
		// 	signTxAllInputs(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx)
		// ).rejects.toThrowError();
	});
});

export function executeSellOrderTx(
	sellerPK: string,
	multisigAddress: string,
	inputBoxes: OneOrMore<Box<Amount>>,
	tokenId: string,
	currentHeight: number,
	unlockHeight: number
): EIP12UnsignedTransaction {
	let mandatoryBoxes = inputBoxes;

	let percent = 0.5;

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
