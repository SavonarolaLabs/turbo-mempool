import { describe, expect, it } from 'vitest';
import { createDepositTx } from '../account';
import {
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
	signTx,
	signTxAllInputs,
	submitTx,
	txHasErrors
} from '$lib/server/multisig/multisig';
import { BOB_MNEMONIC } from '$lib/server/constants/mnemonics';
import { fakeContext } from '$lib/server/multisig/fakeContext';
import { wasmModule } from '$lib/server/tx-chaining/utils/wasm-module';
import JSONBig from 'json-bigint';

describe('boxes from Bob', () => {
	it.skip('E2E-Bob can deposit to SellOrder', async () => {
		const height = 1255856;
		const tokenForSale = {
			tokenId:
				'69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
			amount: '100'
		};

		const price = 100n;

		const unsignedTx = createSellOrderTx(
			BOB_ADDRESS,
			utxos[BOB_ADDRESS],
			tokenForSale,
			price,
			height
		);
		const signedTx = await signTx(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx);
		const hasError = await txHasErrors(signedTx);
		expect(hasError).toBe(false);

		//const signedTx = await signTx(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx);
		const sumbitedTx = await submitTx(signedTx);
		expect(sumbitedTx).toBeTypeOf('string');
		console.log('🚀 ~ it ~ sumbitedTx:', sumbitedTx);
	});
	it.skip('E2E - Bob can cancel SellOrder', async () => {
		const height = 1255856;
		const tokenForSale = {
			tokenId:
				'69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
			amount: '100'
		};
		const unsignedTx = canсelSellOrderTx(
			BOB_ADDRESS,
			utxos[SELL_ORDER_ADDRESS],
			tokenForSale.tokenId,
			height
		);
		const signedTx = await signTxAllInputs(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsignedTx
		);
		const hasError = await txHasErrors(signedTx);
		expect(hasError).toBe(false);

		console.log('🚀 ~ it ~ signedTx:');
		console.dir(signedTx, { depth: null });

		const sumbitedTx = await submitTx(signedTx);
		expect(sumbitedTx).toBeTypeOf('string');
		console.log('🚀 ~ it ~ sumbitedTx:', sumbitedTx);
	});

	it.skip('Bob can deposit and cancel SellOrder', async () => {
		const height = 1255856;
		const tokenForSale = {
			tokenId:
				'69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
			amount: '100'
		};

		const price = 100n;

		const unsignedTx = createSellOrderTx(
			BOB_ADDRESS,
			utxos[BOB_ADDRESS],
			tokenForSale,
			price,
			height
		);
		const signedTx = await signTx(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx);

		const newInput = [signedTx.outputs[0]];
		console.log('🚀 ~ it ~ newInput:', newInput);

		//------
		const unsignedTx2 = canсelSellOrderTx(
			BOB_ADDRESS,
			newInput,
			tokenForSale.tokenId,
			height
		);

		const signedTx2 = await signTxAllInputs(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsignedTx2
		);

		//-----
		await wasmModule.loadAsync();
		const bobProver = await getProver(BOB_MNEMONIC);
		const sigmaRust = await wasmModule.SigmaRust;

		const tx = sigmaRust.UnsignedTransaction.from_json(
			JSONBig.stringify(unsignedTx2)
		);

		const unspentBoxes = sigmaRust.ErgoBoxes.from_boxes_json(
			unsignedTx2.inputs
		);
		console.log('unspentBoxes', unspentBoxes.get(0).to_js_eip12());
		const dataInputBoxes = sigmaRust.ErgoBoxes.from_boxes_json(
			unsignedTx2.dataInputs
		);

		const signedInput = bobProver.sign_tx_input(
			0,
			fakeContext(),
			tx,
			unspentBoxes,
			dataInputBoxes
		);
		console.log(signedInput.spending_proof().to_json());
		//console.log(signedTx2.inputs[0].spendingProof);
		// expect(
		// 	signedTx2.inputs[0].spendingProof.proofBytes.length
		// ).toBeGreaterThan(1);
		// console.dir(signedTx2, { depth: null });
	});

	it.skip('Alice can buy from SellOrder, partially');
	it.skip('Alice can buy from SellOrder, full');
	//BOB - > To Shadow
});

export function createSellOrderTx(
	sellerPK: string,
	inputBoxes: OneOrMore<Box<Amount>>,
	token: { tokenId: string; amount: Amount },
	sellPrice: bigint,
	currentHeight: number
): EIP12UnsignedTransaction {
	const output = new OutputBuilder(SAFE_MIN_BOX_VALUE, SELL_ORDER_ADDRESS)
		.addTokens(token)
		.setAdditionalRegisters({
			R4: SColl(SByte, token.tokenId).toHex(),
			R5: SLong(sellPrice).toHex(),
			R6: SSigmaProp(
				SGroupElement(
					first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())
				)
			).toHex()
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

export function canсelSellOrderTx(
	sellerPK: string,
	inputBoxes: OneOrMore<Box<Amount>>,
	tokenId: string,
	currentHeight: number
): EIP12UnsignedTransaction {
	//console.log(inputBoxes);
	//const checkInputBoxes = inputBoxes.length

	let mandatoryBoxes = inputBoxes;
	console.log('inputBoxes:');
	console.dir(inputBoxes, { depth: null });
	console.log('XXXXXXXXXX:');

	const tokens = mandatoryBoxes.flatMap((box) => box.assets);
	let value = mandatoryBoxes.reduce((a, e) => +a + +e.value, 0);

	if (value < SAFE_MIN_BOX_VALUE) {
		value = SAFE_MIN_BOX_VALUE;
	}

	//9998094700000

	const output = new OutputBuilder(value, sellerPK)
		.addTokens(tokens)
		.setAdditionalRegisters({ R4: SColl(SByte, tokenId).toHex() });

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
