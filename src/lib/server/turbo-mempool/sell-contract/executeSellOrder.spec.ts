import { beforeAll, describe, expect, it } from 'vitest';
import {
	ALICE_ADDRESS,
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
	ErgoTree,
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	SAFE_MIN_BOX_VALUE,
	SByte,
	SColl,
	SGroupElement,
	SInt,
	SSigmaProp,
	TransactionBuilder
} from '@fleet-sdk/core';
import {
	signMultisig,
	signTxByAddress,
	signTxAllInputs,
	signTxByInputs,
	signTxInput,
	txHasErrors
} from '$lib/server/multisig/multisig';
import {
	ALICE_MNEMONIC,
	BOB_MNEMONIC,
	SHADOW_MNEMONIC
} from '$lib/server/constants/mnemonics';
import { createSellOrderTx } from './sell';
import * as wasm from 'ergo-lib-wasm-nodejs';


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
		const signedTx = await signTxByAddress(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx);
		sellContractUtxo = [signedTx.outputs[0]];
	});

	it('alice can spend sell order box and own box', async () => {
		const sellerPK = BOB_ADDRESS;
		const output = new OutputBuilder(
			price * BigInt(tokenForSale.amount)*1000n,
			DEPOSIT_ADDRESS
		).setAdditionalRegisters({
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
			R5: SInt(unlockHeight).toHex(),
			R6: SColl(SByte, tokenForSale.tokenId).toHex()
		});

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

		//console.dir(unsignedTx, { depth: null });

		expect(unsignedTx.inputs.length).toBe(2);
		expect(unsignedTx.inputs[0].ergoTree).toBe(
			ErgoAddress.fromBase58(SELL_ORDER_ADDRESS).ergoTree
		);

		const shadowIndex = unsignedTx.inputs.findIndex(b => sellContractUtxo.map(b=>b.boxId).includes(b.boxId))
		expect(shadowIndex).toBe(0)
		const signedShadowInput = await signTxInput(
			SHADOW_MNEMONIC,
			unsignedTx,
		);
		const shadowInputProof = JSON.parse(signedShadowInput.spending_proof().to_json());
		expect(shadowInputProof.proofBytes.length).greaterThan(10);

		const aliceIndex = unsignedTx.inputs.findIndex(b => utxos[ALICE_ADDRESS].map(b=>b.boxId).includes(b.boxId))
		expect(aliceIndex).toBe(1)
		expect(unsignedTx.inputs[aliceIndex].ergoTree).toBe(ErgoAddress.fromBase58(ALICE_ADDRESS).ergoTree)
		const signedAliceInput = await signTxInput(
			ALICE_MNEMONIC,
			unsignedTx,
			aliceIndex
		);
		const aliceInputProof = JSON.parse(signedAliceInput.spending_proof().to_json());
		expect(aliceInputProof.proofBytes.length).greaterThan(10);

		const txId = wasm.UnsignedTransaction.from_json(JSON.stringify(unsignedTx)).id().to_str();

		unsignedTx.inputs[shadowIndex] = {
			boxId: unsignedTx.inputs[shadowIndex].boxId,
			spendingProof: shadowInputProof
		}
		unsignedTx.inputs[aliceIndex] = {
			boxId: unsignedTx.inputs[aliceIndex].boxId,
			spendingProof: aliceInputProof
		}
		unsignedTx.id = txId;

		const hasError = await txHasErrors(unsignedTx);
		expect(hasError).toBeFalsy();
	});

	it('alice can buy with Shadow Signed - 100/100 tokens', async () => {
		const sellerPK = BOB_ADDRESS;
		const output = new OutputBuilder(
			price * BigInt(tokenForSale.amount), //SAFE_MIN_BOX_VALUE
			DEPOSIT_ADDRESS
		).setAdditionalRegisters({
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
			R5: SInt(unlockHeight).toHex(),
			R6: SColl(SByte, tokenForSale.tokenId).toHex()
		});

		const unsignedTx = new TransactionBuilder(height)
			.configureSelector((selector) =>
				selector.ensureInclusion([sellContractUtxo[0].boxId])
			)
			.from([...sellContractUtxo])
			.to(output)
			.sendChangeTo(sellerPK)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		expect(unsignedTx.inputs.length).toBe(1);
		expect(unsignedTx.inputs[0].ergoTree).toBe(
			ErgoAddress.fromBase58(SELL_ORDER_ADDRESS).ergoTree
		);

		const signedTx = await signTxAllInputs(
			SHADOW_MNEMONIC,
			unsignedTx
		);

		expect(signedTx.inputs.length).toBeDefined();
	});

	it.skip('alice CANT buy WITHOUT Shadow - 100/100 tokens', async () => {
		const sellerPK = BOB_ADDRESS;
		const output = new OutputBuilder(
			price * BigInt(tokenForSale.amount),
			DEPOSIT_ADDRESS
		).setAdditionalRegisters({
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
			R5: SInt(unlockHeight).toHex(),
			R6: SColl(SByte, tokenForSale.tokenId).toHex()
		});

		const unsignedTx = new TransactionBuilder(height)
			.configureSelector((selector) =>
				selector.ensureInclusion([sellContractUtxo[0].boxId])
			)
			.from([...sellContractUtxo])
			.to(output)
			.sendChangeTo(sellerPK)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		//console.dir(unsignedTx, { depth: null });

		expect(unsignedTx.inputs.length).toBe(1);
		expect(unsignedTx.inputs[0].ergoTree).toBe(
			ErgoAddress.fromBase58(SELL_ORDER_ADDRESS).ergoTree
		);

		expect(
			signTxAllInputs(BOB_MNEMONIC, unsignedTx)
		).rejects.toThrowError();
	});
});
