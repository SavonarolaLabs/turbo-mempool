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

describe.skip('boxes from depositAddress', () => {
	it('Bob deposit real box to deposit ', async () => {
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
});
