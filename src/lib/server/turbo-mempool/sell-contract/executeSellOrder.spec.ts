import { beforeAll, describe, expect, it } from 'vitest';
import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	DEPOSIT_ADDRESS,
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
	SColl,
	SGroupElement,
	SInt,
	SSigmaProp,
	TransactionBuilder
} from '@fleet-sdk/core';
import { signMultisig, signTx } from '$lib/server/multisig/multisig';
import { ALICE_MNEMONIC, BOB_MNEMONIC } from '$lib/server/constants/mnemonics';
import { createSellOrderTx } from './sell';

let sellContractUtxo: Box<Amount>[] = [];

const price = 100n;
const tokenForSale = {
	tokenId: '69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
	amount: '100'
};
const height = 1_209_964;
let unlockHeight: number;

describe(`Bob sellOrder: height:${height}, unlock +10`, () => {
	beforeAll(async () => {
		unlockHeight = height + 10;
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
		sellContractUtxo = [signedTx.outputs[0]];
	});

	it('alice can buy 100/100 tokens', async () => {
		const sellerPK = BOB_ADDRESS;
		const output = new OutputBuilder(
			price * BigInt(tokenForSale.amount)* 100n *100n,
			DEPOSIT_ADDRESS
		)
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
			})
		expect(output.ergoTree).toEqual(sellContractUtxo[0].additionalRegisters.R8)

		const unsignedTx = new TransactionBuilder(height)
			.configureSelector((selector) =>
				selector.ensureInclusion([sellContractUtxo[0].boxId])
			)
			.from([...sellContractUtxo, ...utxos[ALICE_ADDRESS]])
			.to(output)
			.sendChangeTo(sellerPK)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		const signedTx = await signMultisig(
			unsignedTx,
			ALICE_MNEMONIC,
			ALICE_ADDRESS
		);
		expect(signedTx.inputs.length).toBeDefined();
	});
});
