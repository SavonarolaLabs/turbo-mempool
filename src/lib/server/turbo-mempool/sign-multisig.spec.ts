import { describe, expect, it } from 'vitest';
import {
	getProver,
	signMultisig,
	signTx,
	signTxAllInputs,
	submitTx,
	txHasErrors
} from '../multisig/multisig';
import { ALICE_MNEMONIC, BOB_MNEMONIC, SHADOW_MNEMONIC } from '../constants/mnemonics';
import { ErgoBox, ErgoBoxes } from 'ergo-lib-wasm-nodejs';
import { fakeContext } from '../multisig/fakeContext';
import * as wasm from 'ergo-lib-wasm-nodejs';
import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	DEPOSIT_ADDRESS,
	SHADOWPOOL_ADDRESS
} from '../constants/addresses';

import { SGroupElement, SInt, SLong, SSigmaProp } from '@fleet-sdk/serializer';

import {
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	TransactionBuilder,
	ErgoAddress,
	SAFE_MIN_BOX_VALUE
} from '@fleet-sdk/core';
import { depositAddress } from '../constants/depositAddress';
import { utxos } from '../utxo/unspent';
import { first } from '@fleet-sdk/common';

describe.only('boxes from depositAddress', () => {
	it('can be spent', async () => {
		const output = new OutputBuilder(
			3n * SAFE_MIN_BOX_VALUE,
			depositAddress
		).setAdditionalRegisters({
			R4: SInt(1290000 + 100).toHex(),
			R5: SSigmaProp(
				SGroupElement(first(ErgoAddress.fromBase58(BOB_ADDRESS).getPublicKeys()))
			).toHex(),
			R6: SSigmaProp(
				SGroupElement(first(ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).getPublicKeys()))
			).toHex()
		});
		const unsignedTransaction = new TransactionBuilder(1255856)
			.from(utxos[BOB_ADDRESS])
			.to(output)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signedTx = (
			await signTx(BOB_MNEMONIC, BOB_ADDRESS, unsignedTransaction)
		).to_js_eip12();

		const newInput = signedTx.outputs[0];
		//const output = new OutputBuilder(2n * SAFE_MIN_BOX_VALUE, depositAddress);

		const unsignedTx2 = new TransactionBuilder(1255856)
			.from(newInput)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signed = await signMultisig(unsignedTx2, BOB_MNEMONIC, BOB_ADDRESS);
		expect(signed.to_js_eip12().inputs.length).toBe(1);
	});

	it.skip('can sign solo', async () => {
		const output = new OutputBuilder(
			3n * SAFE_MIN_BOX_VALUE,
			depositAddress
		).setAdditionalRegisters({
			R4: SInt(2229000 + 100).toHex(),
			R5: SSigmaProp(
				SGroupElement(first(ErgoAddress.fromBase58(BOB_ADDRESS).getPublicKeys()))
			).toHex(),
			R6: SSigmaProp(
				SGroupElement(first(ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).getPublicKeys()))
			).toHex()
		});
		const unsignedTransaction = new TransactionBuilder(1255856)
			.from(utxos[BOB_ADDRESS])
			.to(output)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signedTx = (
			await signTx(BOB_MNEMONIC, BOB_ADDRESS, unsignedTransaction)
		).to_js_eip12();

		const newInput = signedTx.outputs[0];
		//const output = new OutputBuilder(2n * SAFE_MIN_BOX_VALUE, depositAddress);

		const unsignedTx2 = new TransactionBuilder(1255856)
			.from(newInput)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signedTx2 = (
			await signTxAllInputs(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx2)
		).to_js_eip12();
		expect(signedTx2.inputs.length).toBe(1);
	});

	it.skip('Bob deposit real box to deposit ', async () => {
		const output = new OutputBuilder(
			3n * SAFE_MIN_BOX_VALUE,
			depositAddress
		).setAdditionalRegisters({
			R4: SInt(1256321 + 200).toHex(),
			R5: SSigmaProp(
				SGroupElement(first(ErgoAddress.fromBase58(BOB_ADDRESS).getPublicKeys()))
			).toHex(),
			R6: SSigmaProp(
				SGroupElement(first(ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).getPublicKeys()))
			).toHex()
		});
		const unsignedTransaction = new TransactionBuilder(1255856)
			.from(utxos[BOB_ADDRESS])
			.to(output)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signedTx = (
			await signTx(BOB_MNEMONIC, BOB_ADDRESS, unsignedTransaction)
		).to_js_eip12();

		//console.dir(signedTx, { depth: null });
		const sumbitedTx = await submitTx(signedTx);
		expect(sumbitedTx).toBeTypeOf('string');
	});

	it('Bob+Shadow can withdraw real box from deposit ', async () => {
		const newInput = utxos[DEPOSIT_ADDRESS]; //find

		const unsignedTx2 = new TransactionBuilder(1255856)
			.from(newInput)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signed = await signMultisig(unsignedTx2, BOB_MNEMONIC, BOB_ADDRESS);
		const signedTx2 = signed.to_js_eip12();

		//console.dir(signedTx2, { depth: null });
		const hasError = await txHasErrors(signedTx2);
		expect(hasError).toBe(false);
	});

	it('Bob can withdraw real box from deposit ', async () => {
		const newInput = utxos[DEPOSIT_ADDRESS];

		const unsignedTx2 = new TransactionBuilder(1255856)
			.from(newInput)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signedTx2 = (
			await signTxAllInputs(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx2)
		).to_js_eip12();
		expect(signedTx2.inputs.length).toBe(1);

		//console.dir(signedTx2, { depth: null });
		const hasError = await txHasErrors(signedTx2);
		expect(hasError).toBe(false);
	}); //find

	it.skip('Alice+Shadow cant withdraw real box from deposit ', async () => {
		const newInput = utxos[DEPOSIT_ADDRESS];

		const unsignedTx2 = new TransactionBuilder(1255856)
			.from(newInput)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();
		//await expect(signMultisig(unsignedTx2, ALICE_MNEMONIC, ALICE_ADDRESS)).toThrowError();
		//expect().rejects()
	});

	it.skip('Bob can withdraw real box with height from deposit ', async () => {
		const newInput = utxos[DEPOSIT_ADDRESS][0]; //find
		console.dir(newInput, { depth: null });
		const unsignedTx2 = new TransactionBuilder(1255856)
			.from(newInput)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();
		//SHADOWPOOL_ADDRESS,SHADOW_MNEMONIC
		const signedTx2 = (
			await signTxAllInputs(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx2)
		).to_js_eip12();
		expect(signedTx2.inputs.length).toBe(1);

		//console.dir(signedTx2, { depth: null });
		const hasError = await txHasErrors(signedTx2);
		expect(hasError).toBe(false);
		// const sumbitedTx = await submitTx(signedTx2);
		// expect(sumbitedTx).toBeTypeOf('string');
	}); //find

	it.skip('SHADOW can withdraw real box with height from deposit ', async () => {
		const newInput = utxos[DEPOSIT_ADDRESS][0]; //find
		console.dir(newInput, { depth: null });
		const unsignedTx2 = new TransactionBuilder(1255856)
			.from(newInput)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();
		//SHADOWPOOL_ADDRESS,SHADOW_MNEMONIC
		const signedTx2 = (
			await signTxAllInputs(SHADOW_MNEMONIC, SHADOWPOOL_ADDRESS, unsignedTx2)
		).to_js_eip12();
		expect(signedTx2.inputs.length).toBe(1);

		const hasError = await txHasErrors(signedTx2);
		expect(hasError).toBe(false);
	}); //find

	it.skip('Bob+Shadow can withdraw real with height box from deposit ', async () => {
		const newInput = utxos[DEPOSIT_ADDRESS][0]; //find

		const unsignedTx2 = new TransactionBuilder(1255856)
			.from(newInput)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signed = await signMultisig(unsignedTx2, BOB_MNEMONIC, BOB_ADDRESS);
		const signedTx2 = signed.to_js_eip12();

		//console.dir(signedTx2, { depth: null });
		const hasError = await txHasErrors(signedTx2);
		expect(hasError).toBe(false);
	});
});
