import { describe, expect, it } from 'vitest';
import { getProver, signTx } from '../multisig/multisig';
import { ALICE_MNEMONIC, BOB_MNEMONIC, SHADOW_MNEMONIC } from '../constants/mnemonics';
import { createDeposit, createWithdraw } from './common';
import { ErgoBox, ErgoBoxes } from 'ergo-lib-wasm-nodejs';
import { fakeContext } from '../multisig/fakeContext';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { BOB_ADDRESS, SHADOWPOOL_ADDRESS } from '../constants/addresses';

import {
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	TransactionBuilder,
	ErgoAddress,
	SAFE_MIN_BOX_VALUE
} from '@fleet-sdk/core';
import { depositAddress } from '../constants/depositAddress';
import { utxos } from '../utxo/unspent';

describe.only('sign_tx_input', () => {
	it('works', async () => {
		const prover = await getProver(BOB_MNEMONIC);

		const output = new OutputBuilder(3n * SAFE_MIN_BOX_VALUE, depositAddress);

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

		const unsignedTransaction2 = new TransactionBuilder(1255856)
			.from(newInput)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const tx = unsignedTransaction2;
		// filtet  == address
		const inputBoxes = [tx.inputs[0]];
		const boxes_to_spend = ErgoBoxes.empty();
		inputBoxes.forEach((box) => {
			boxes_to_spend.add(ErgoBox.from_json(JSON.stringify(box)));
		});

		//  sign_tx_input(input_idx: number, state_context: ErgoStateContext, tx: UnsignedTransaction, boxes_to_spend: ErgoBoxes, data_boxes: ErgoBoxes): Input;
		const wasmInput = prover.sign_tx_input(
			0,
			fakeContext(),
			wasm.UnsignedTransaction.from_json(JSON.stringify(tx)),
			boxes_to_spend,
			ErgoBoxes.empty()
		);

		expect(JSON.parse(wasmInput.spending_proof().to_json())?.proofBytes).toBeDefined();
	});
});
