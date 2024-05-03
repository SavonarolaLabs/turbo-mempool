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
import { first, type Amount, type Box, type EIP12UnsignedTransaction, type OneOrMore } from '@fleet-sdk/common';
import { createDepositTx, createWithdrawTx } from './account';

describe.only('boxes from depositAddress', () => {
	it('can spent a deposit', async () => {
		const unsignedDepositTx = createDepositTx(BOB_ADDRESS, utxos[BOB_ADDRESS], 1290000 + 100, 1255856)

		const signedTx = (
			await signTx(BOB_MNEMONIC, BOB_ADDRESS, unsignedDepositTx)
		).to_js_eip12();

		const withdrawBoxes = signedTx.outputs[0];
		const unsignedTx2 = createWithdrawTx(BOB_ADDRESS, withdrawBoxes, 1255856);

		const signed = await signMultisig(unsignedTx2, BOB_MNEMONIC, BOB_ADDRESS);
		expect(signed.to_js_eip12().inputs.length).toBe(1);
	});

	it.skip('can sign solo', async () => {
		const unsignedDepositTx = createDepositTx(BOB_ADDRESS, utxos[BOB_ADDRESS], 2229000 + 100, 1255856)

		const signedTx = (
			await signTx(BOB_MNEMONIC, BOB_ADDRESS, unsignedDepositTx)
		).to_js_eip12();

		const withdrawBoxes = signedTx.outputs[0];

		const signedTx2 = (
			await signTxAllInputs(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx2)
		).to_js_eip12();
		expect(signedTx2.inputs.length).toBe(1);
	});

	it('Bob+Shadow can withdraw real box from deposit ', async () => {
		const withdrawBoxes = utxos[DEPOSIT_ADDRESS]; //find
		const unsignedTx2 = createWithdrawTx(BOB_ADDRESS, withdrawBoxes, 1255856);

		const signed = await signMultisig(unsignedTx2, BOB_MNEMONIC, BOB_ADDRESS);
		const signedTx2 = signed.to_js_eip12();

		//console.dir(signedTx2, { depth: null });
		const hasError = await txHasErrors(signedTx2);
		expect(hasError).toBe(false);
	});

	it('Bob can NOT withdraw real box from deposit ', async () => {
		const withdrawBoxes = utxos[DEPOSIT_ADDRESS];
		const unsignedTx2 = createWithdrawTx(BOB_ADDRESS, withdrawBoxes, 1255856);

			await expect(signTxAllInputs(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx2)
		).rejects.toThrowError();
	}); //find

	it.skip('Alice+Shadow cant withdraw real box from deposit ', async () => {
		const withdrawBoxes = utxos[DEPOSIT_ADDRESS];
		const unsignedTx2 = createWithdrawTx(BOB_ADDRESS, withdrawBoxes, 1255856);
		//await expect(signMultisig(unsignedTx2, ALICE_MNEMONIC, ALICE_ADDRESS)).toThrowError();
		//expect().rejects()
	});

	it.skip('Bob can withdraw real box with height from deposit ', async () => {
		const withdrawBoxes = utxos[DEPOSIT_ADDRESS][0]; //find
		const unsignedTx2 = createWithdrawTx(BOB_ADDRESS, withdrawBoxes, 1255856);
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
		const withdrawBoxes = utxos[DEPOSIT_ADDRESS][0]; //find
		const unsignedTx2 = createWithdrawTx(BOB_ADDRESS, withdrawBoxes, 1255856);
		//SHADOWPOOL_ADDRESS,SHADOW_MNEMONIC
		const signedTx2 = (
			await signTxAllInputs(SHADOW_MNEMONIC, SHADOWPOOL_ADDRESS, unsignedTx2)
		).to_js_eip12();
		expect(signedTx2.inputs.length).toBe(1);

		const hasError = await txHasErrors(signedTx2);
		expect(hasError).toBe(false);
	}); //find

	it.skip('Bob+Shadow can withdraw real with height box from deposit ', async () => {
		const withdrawBoxes = utxos[DEPOSIT_ADDRESS][0]; //find
		const unsignedTx2 = createWithdrawTx(BOB_ADDRESS, withdrawBoxes, 1255856);

		const signed = await signMultisig(unsignedTx2, BOB_MNEMONIC, BOB_ADDRESS);
		const signedTx2 = signed.to_js_eip12();

		//console.dir(signedTx2, { depth: null });
		const hasError = await txHasErrors(signedTx2);
		expect(hasError).toBe(false);
	});
});
