import { describe, expect, it } from 'vitest';
import {
	signMultisig,
	signTxByAddress,
	signTxAllInputs,
	txHasErrors
} from '../multisig/multisig';
import { BOB_MNEMONIC, SHADOW_MNEMONIC } from '../constants/mnemonics';
import {
	BOB_ADDRESS,
	DEPOSIT_ADDRESS,
	SHADOWPOOL_ADDRESS
} from '../constants/addresses';
import { utxos } from '../utxo/unspent';
import { createDepositTx, createWithdrawTx } from './account';

describe.only('deposit -> withdraw', () => {
	it('can spent a deposit', async () => {
		const unsignedDepositTx = createDepositTx(
			BOB_ADDRESS,
			utxos[BOB_ADDRESS],
			1290000 + 100,
			1255856
		);
		const signedTx = await signTxByAddress(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsignedDepositTx
		);

		const withdrawBoxes = signedTx.outputs[0];
		const unsignedTx2 = createWithdrawTx(
			BOB_ADDRESS,
			withdrawBoxes,
			1255856
		);

		const signed = await signMultisig(
			unsignedTx2,
			BOB_MNEMONIC,
			BOB_ADDRESS
		);
		expect(signed.to_js_eip12().inputs.length).toBe(1);
	});

	it.skip('can sign solo', async () => {
		const unsignedDepositTx = createDepositTx(
			BOB_ADDRESS,
			utxos[BOB_ADDRESS],
			2229000 + 100,
			1255856
		);
		const signedTx = await signTxByAddress(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsignedDepositTx
		);

		const withdrawBoxes = signedTx.outputs[0];
		const unsignedTx2 = createWithdrawTx(
			BOB_ADDRESS,
			withdrawBoxes,
			1255856
		);

		const signedTx2 = await signTxAllInputs(
			BOB_MNEMONIC,
			unsignedTx2
		);
		expect(signedTx2.inputs.length).toBe(1);
	});

	it('Bob+Shadow can withdraw real box from deposit ', async () => {
		const withdrawBoxes = utxos[DEPOSIT_ADDRESS];
		const unsignedTx2 = createWithdrawTx(
			BOB_ADDRESS,
			withdrawBoxes,
			1255856
		);

		const signed = await signMultisig(
			unsignedTx2,
			BOB_MNEMONIC,
			BOB_ADDRESS
		);
		const signedTx2 = signed.to_js_eip12();

		const hasError = await txHasErrors(signedTx2);
		expect(hasError).toBe(false);
	});

	it('Bob can NOT withdraw real box from deposit ', async () => {
		const withdrawBoxes = utxos[DEPOSIT_ADDRESS];
		const unsignedTx2 = createWithdrawTx(
			BOB_ADDRESS,
			withdrawBoxes,
			1255856
		);

		await expect(
			signTxAllInputs(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx2)
		).rejects.toThrowError();
	});

	it.skip('Alice+Shadow cant withdraw real box from deposit ', async () => {
		const withdrawBoxes = utxos[DEPOSIT_ADDRESS];
		const unsignedTx2 = createWithdrawTx(
			BOB_ADDRESS,
			withdrawBoxes,
			1255856
		);
		//await expect(signMultisig(unsignedTx2, ALICE_MNEMONIC, ALICE_ADDRESS)).toThrowError();
		//expect().rejects()
	});

	it.skip('Bob can withdraw real box with height from deposit ', async () => {
		const withdrawBoxes = utxos[DEPOSIT_ADDRESS][0];
		const unsignedTx2 = createWithdrawTx(
			BOB_ADDRESS,
			withdrawBoxes,
			1255856
		);

		const signedTx2 = await signTxAllInputs(
			BOB_MNEMONIC,
			unsignedTx2
		);
		expect(signedTx2.inputs.length).toBe(1);

		const hasError = await txHasErrors(signedTx2);
		expect(hasError).toBe(false);
		// const sumbitedTx = await submitTx(signedTx2);
		// expect(sumbitedTx).toBeTypeOf('string');
	});

	it.skip('SHADOW can withdraw real box with height from deposit ', async () => {
		const withdrawBoxes = utxos[DEPOSIT_ADDRESS][0];
		const unsignedTx2 = createWithdrawTx(
			BOB_ADDRESS,
			withdrawBoxes,
			1255856
		);

		const signedTx2 = await signTxAllInputs(
			SHADOW_MNEMONIC,
			unsignedTx2
		);
		expect(signedTx2.inputs.length).toBe(1);

		const hasError = await txHasErrors(signedTx2);
		expect(hasError).toBe(false);
	});

	it.skip('Bob+Shadow can withdraw real with height box from deposit ', async () => {
		const withdrawBoxes = utxos[DEPOSIT_ADDRESS][0];
		const unsignedTx2 = createWithdrawTx(
			BOB_ADDRESS,
			withdrawBoxes,
			1255856
		);

		const signed = await signMultisig(
			unsignedTx2,
			BOB_MNEMONIC,
			BOB_ADDRESS
		);
		const signedTx2 = signed.to_js_eip12();

		const hasError = await txHasErrors(signedTx2);
		expect(hasError).toBe(false);
	});
});
