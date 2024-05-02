import { describe, expect, it } from 'vitest';
import { getProver, signMultisig, signTx } from '../multisig/multisig';
import { ALICE_MNEMONIC, BOB_MNEMONIC, SHADOW_MNEMONIC } from '../constants/mnemonics';
import { ErgoBox, ErgoBoxes } from 'ergo-lib-wasm-nodejs';
import { fakeContext } from '../multisig/fakeContext';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { BOB_ADDRESS, SHADOWPOOL_ADDRESS } from '../constants/addresses';

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

		const output = new OutputBuilder(3n * SAFE_MIN_BOX_VALUE, depositAddress).setAdditionalRegisters({
            R4: SSigmaProp(SGroupElement(first(ErgoAddress.fromBase58(BOB_ADDRESS).getPublicKeys()))).toHex(),
            R5: SSigmaProp(SGroupElement(first(ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).getPublicKeys()))).toHex()
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

		const signed = await signMultisig(unsignedTx2, BOB_MNEMONIC, BOB_ADDRESS)
        expect(signed.to_js_eip12().inputs.length).toBe(1);
	});
});
