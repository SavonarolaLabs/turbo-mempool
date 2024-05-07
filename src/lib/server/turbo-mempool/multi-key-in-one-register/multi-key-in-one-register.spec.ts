import { beforeAll, describe, expect, it } from 'vitest';
import { signTxAllInputs } from '../../multisig/multisig';
import { ALICE_MNEMONIC, BOB_MNEMONIC } from '../../constants/mnemonics';
import { ALICE_ADDRESS, BOB_ADDRESS } from '../../constants/addresses';
import { utxos } from '../../utxo/unspent';
import {
	ErgoAddress,
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	SAFE_MIN_BOX_VALUE,
	SColl,
	SGroupElement,
	SInt,
	SSigmaProp,
	TransactionBuilder
} from '@fleet-sdk/core';
import {
	first,
	type Amount,
	type Box,
	type OneOrMore
} from '@fleet-sdk/common';

const contract = '21Ria9WjLZHMjVqHRCJdXd5w77sWf1QD8gEgNAxvmsUGVdY6QfWDeqCMnVX8';
/*
{
	val who : Int             = SELF.R4[Int].get
	val alicePk               = SELF.R4[Coll[SigmaProp]].get(0)
	val bobPK                 = SELF.R4[Coll[SigmaProp]].get(1)
	
	if(who ==  1){
		alicePk
	}else
	{
		bobPK
	}
}
*/

let contractBoxesForAlice: OneOrMore<Box<Amount>> = [];
let contractBoxesForBob: OneOrMore<Box<Amount>> = [];

const currentHeight = 1258770;
describe.only('Multiple Keys in one register', () => {
	beforeAll(async () => {
		const output = new OutputBuilder(
			3n * SAFE_MIN_BOX_VALUE,
			contract
		).setAdditionalRegisters({
			R4: SInt(1).toHex(), // this means alicePk needs to sign
			R5: SColl(SSigmaProp, [
				SGroupElement(
					first(ErgoAddress.fromBase58(ALICE_ADDRESS).getPublicKeys())
				),
				SGroupElement(
					first(ErgoAddress.fromBase58(BOB_ADDRESS).getPublicKeys())
				)
			]).toHex()
		});
		const unsigned = new TransactionBuilder(currentHeight)
			.from(utxos[BOB_ADDRESS])
			.to(output)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signed = await signTxAllInputs(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsigned
		);

		contractBoxesForAlice = [signed.outputs[0]];

		const output2 = new OutputBuilder(
			3n * SAFE_MIN_BOX_VALUE,
			contract
		).setAdditionalRegisters({
			R4: SInt(2).toHex(), // this means alicePk needs to sign
			R5: SColl(SSigmaProp, [
				SGroupElement(
					first(ErgoAddress.fromBase58(ALICE_ADDRESS).getPublicKeys())
				),
				SGroupElement(
					first(ErgoAddress.fromBase58(BOB_ADDRESS).getPublicKeys())
				)
			]).toHex()
		});
		const unsigned2 = new TransactionBuilder(currentHeight)
			.from(utxos[BOB_ADDRESS])
			.to(output2)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signed2 = await signTxAllInputs(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsigned2
		);

		contractBoxesForBob = [signed2.outputs[0]];
	});

	it('alice can sign if R4 == 1', async () => {
		const output = new OutputBuilder(SAFE_MIN_BOX_VALUE, ALICE_ADDRESS);

		const unsigned = new TransactionBuilder(currentHeight)
			.from(contractBoxesForAlice)
			.to(output)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signed = await signTxAllInputs(
			ALICE_MNEMONIC,
			ALICE_ADDRESS,
			unsigned
		);
		expect(signed.inputs.length).toBe(1);
	});

	it('bob CANT sign if R4 == 1', async () => {
		const output = new OutputBuilder(SAFE_MIN_BOX_VALUE, ALICE_ADDRESS);

		const unsigned = new TransactionBuilder(currentHeight)
			.from(contractBoxesForAlice)
			.to(output)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		expect(() =>
			signTxAllInputs(BOB_MNEMONIC, BOB_ADDRESS, unsigned)
		).rejects.toThrowError();
	});

	it('alice CANT sign if R4 == 2', async () => {
		const output = new OutputBuilder(SAFE_MIN_BOX_VALUE, ALICE_ADDRESS);

		const unsigned = new TransactionBuilder(currentHeight)
			.from(contractBoxesForBob)
			.to(output)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		expect(
			signTxAllInputs(ALICE_MNEMONIC, ALICE_ADDRESS, unsigned)
		).rejects.toThrowError();
	});

	it('bob can sign if R4 == 1', async () => {
		const output = new OutputBuilder(SAFE_MIN_BOX_VALUE, ALICE_ADDRESS);

		const unsigned = new TransactionBuilder(currentHeight)
			.from(contractBoxesForBob)
			.to(output)
			.sendChangeTo(BOB_ADDRESS)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signed = await signTxAllInputs(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsigned
		);
		expect(signed.inputs.length).toBe(1);
	});
});
