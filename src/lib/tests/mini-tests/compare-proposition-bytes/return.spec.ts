import { beforeAll, describe, expect, it } from 'vitest';
import {
	ErgoAddress,
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	SAFE_MIN_BOX_VALUE,
	SByte,
	SColl,
	TransactionBuilder
} from '@fleet-sdk/core';
import {
	first,
	type Amount,
	type Box,
	type OneOrMore
} from '@fleet-sdk/common';
import { returnToR4Address } from './contract-address-return-to-r4';
import { depositAddress } from '$lib/constants/depositAddress';
import { signTxAllInputs } from '$lib/wallet/multisig';
import { BOB_MNEMONIC } from '$lib/constants/mnemonics';
import { utxos } from '$lib/data/utxos';
import { BOB_ADDRESS } from '$lib/constants/addresses';

let contractBoxesForMultisig: OneOrMore<Box<Amount>> = [];
let contractBoxesForBob: OneOrMore<Box<Amount>> = [];
let returnContract = returnToR4Address;

const currentHeight = 1258770;
describe('contract box R4: multisig', () => {
	beforeAll(async () => {
		const output = new OutputBuilder(
			3n * SAFE_MIN_BOX_VALUE,
			returnContract
		).setAdditionalRegisters({
			R4: SColl(
				SByte,
				ErgoAddress.fromBase58(depositAddress).ergoTree
			).toHex()
		});

		const unsigned = new TransactionBuilder(currentHeight)
			.from(utxos[BOB_ADDRESS])
			.to(output)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signed = await signTxAllInputs(BOB_MNEMONIC, unsigned);
		contractBoxesForMultisig = [signed.outputs[0]];

		const output2 = new OutputBuilder(
			3n * SAFE_MIN_BOX_VALUE,
			returnContract
		).setAdditionalRegisters({
			R4: SColl(
				SByte,
				ErgoAddress.fromBase58(BOB_ADDRESS).ergoTree
			).toHex()
		});

		const unsigned2 = new TransactionBuilder(currentHeight)
			.from(utxos[BOB_ADDRESS])
			.to(output2)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signed2 = await signTxAllInputs(BOB_MNEMONIC, unsigned2);
		contractBoxesForBob = [signed2.outputs[0]];
	});

	it('Bob can return to Multisig', async () => {
		const output = new OutputBuilder(SAFE_MIN_BOX_VALUE, depositAddress);

		const unsigned = new TransactionBuilder(currentHeight)
			.from(contractBoxesForMultisig)
			.to(output)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signed = await signTxAllInputs(BOB_MNEMONIC, unsigned);

		// signed
		expect(signed.inputs.length).greaterThan(0);
	});

	it('Bob CANT return to BOB', async () => {
		const output = new OutputBuilder(SAFE_MIN_BOX_VALUE, BOB_ADDRESS);

		const unsigned = new TransactionBuilder(currentHeight)
			.from(contractBoxesForMultisig)
			.to(output)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		expect(signTxAllInputs(BOB_MNEMONIC, unsigned)).rejects.toThrowError();
	});
});

describe('contract box R4: BOB_ADDRESS', () => {
	beforeAll(async () => {
		const output2 = new OutputBuilder(
			3n * SAFE_MIN_BOX_VALUE,
			returnContract
		).setAdditionalRegisters({
			R4: SColl(
				SByte,
				ErgoAddress.fromBase58(BOB_ADDRESS).ergoTree
			).toHex()
		});

		const unsigned2 = new TransactionBuilder(currentHeight)
			.from(utxos[BOB_ADDRESS])
			.to(output2)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signed2 = await signTxAllInputs(BOB_MNEMONIC, unsigned2);
		contractBoxesForBob = [signed2.outputs[0]];
	});

	it('Bob CANT return to Multisig', async () => {
		const output = new OutputBuilder(SAFE_MIN_BOX_VALUE, depositAddress);

		const unsigned = new TransactionBuilder(currentHeight)
			.from(contractBoxesForBob)
			.to(output)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		expect(signTxAllInputs(BOB_MNEMONIC, unsigned)).rejects.toThrowError();
	});

	it('Bob CANT return to Bob', async () => {
		const output = new OutputBuilder(SAFE_MIN_BOX_VALUE, BOB_ADDRESS);

		const unsigned = new TransactionBuilder(currentHeight)
			.from(contractBoxesForBob)
			.to(output)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signed = await signTxAllInputs(BOB_MNEMONIC, unsigned);

		expect(signed.inputs.length).greaterThan(0);
	});
});
