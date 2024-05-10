import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	DEPOSIT_ADDRESS,
	SHADOWPOOL_ADDRESS,
	SWAP_ORDER_ADDRESS
} from '$lib/server/constants/addresses';
import { BOB_MNEMONIC, SHADOW_MNEMONIC } from '$lib/server/constants/mnemonics';
import { signTxByAddress, signTxInput } from '$lib/server/multisig/multisig';
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
	SByte,
	SColl,
	SConstant,
	SGroupElement,
	SInt,
	SLong,
	SSigmaProp,
	SType,
	TransactionBuilder
} from '@fleet-sdk/core';
import { SPair, STupleType } from '@fleet-sdk/serializer';
import { TokenId } from 'ergo-lib-wasm-nodejs';
import { beforeAll, describe, expect, it } from 'vitest';

const sellingTokenId =
	'69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8'; //HoldErgDoge Test1
const buyingTokenId =
	'd2d0deb3b0b2c511e523fd43ae838ba7b89e4583f165169b90215ff11d942c1f'; //SwapToken Test1
const orderValue = SAFE_MIN_BOX_VALUE;

const tokenForSale = {
	tokenId: '69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
	amount: '100'
};

const price = 5n;

let height = 1_260_252; // await fetchHeight()
let unlockHeight = 1_260_258;

let swapOrderBoxes;

describe('create new Swap order', async () => {
	beforeAll(async () => {
		const unsignedTx = createSwapOrderTx(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxos[BOB_ADDRESS],
			tokenForSale,
			price,
			height,
			unlockHeight
		);
		//console.dir(unsignedTx, { depth: null });

		const signedTx = await signTxByAddress(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsignedTx
		);
		swapOrderBoxes = [signedTx.outputs[0]];
	});

	//swapOrderBoxes

	it('create swap', async () => {
		const buyAmount = 10n;
		const buyerPk = ALICE_ADDRESS;
		const currentHeight = height;

		const paymentInTokens = {
			tokenId: buyingTokenId,
			amount: buyAmount * price //50 tokenov
		};

		const outputPayment = new OutputBuilder(
			SAFE_MIN_BOX_VALUE,
			DEPOSIT_ADDRESS
		)
			.setAdditionalRegisters({
				R4: swapOrderBoxes[0].additionalRegisters.R4,
				R5: swapOrderBoxes[0].additionalRegisters.R5
			})
			.addTokens(paymentInTokens);

		const tempOutputSwapOrder = JSON.parse(
			JSON.stringify(swapOrderBoxes[0])
		); //copy
		// tempOutputSwapOrder.assets.find((a) => a.tokenId == sellingTokenId).amount =
		// 	BigInt(tokenForSale.amount) - buyAmount;
		tempOutputSwapOrder.assets[0].amount = (
			BigInt(tokenForSale.amount) - buyAmount
		).toString();

		const outputSwapOrder = new OutputBuilder(
			tempOutputSwapOrder.value,
			SWAP_ORDER_ADDRESS
		)
			.addTokens(tempOutputSwapOrder.assets)
			.setAdditionalRegisters(tempOutputSwapOrder.additionalRegisters);

		//console.dir(outputSwapOrder, { depth: null });

		const totalInValue = [...swapOrderBoxes, ...utxos[buyerPk]].reduce(
			(a, e) => a + +e.value,
			0
		);
		console.log('🚀 ~ it ~ totalInValue:', totalInValue);
		const totalOutValue = [outputPayment, outputSwapOrder].reduce(
			(a, e) => a + +e.value.toString(),
			0
		);
		console.log('🚀 ~ it ~ totalOutValue: ', totalOutValue);
		console.log('🚀 ~ it ~ totalOutValue: ', 2100000);

		const tokensIn = [...swapOrderBoxes, ...utxos[buyerPk]].reduce(
			(a, e) => a + +e.value,
			0
		);
		const unsignedTransaction = new TransactionBuilder(currentHeight)
			.configureSelector((selector) =>
				selector.ensureInclusion(swapOrderBoxes.map((b) => b.boxId))
			)
			.from(...swapOrderBoxes, ...utxos[buyerPk])
			.to([outputPayment, outputSwapOrder])
			.sendChangeTo(buyerPk) //add registers
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		//SIGN INPUTS: Alice and Shadow
		const unsignedTx = unsignedTransaction; // <---
		let swapContractUtxo = swapOrderBoxes;

		const shadowIndex = unsignedTx.inputs.findIndex((b) =>
			swapContractUtxo.map((b) => b.boxId).includes(b.boxId)
		);
		expect(shadowIndex).toBe(0);

		const signedShadowInput = await signTxInput(
			SHADOW_MNEMONIC,
			unsignedTx,
			shadowIndex
		);

		const shadowInputProof = JSON.parse(
			signedShadowInput.spending_proof().to_json()
		);
		expect(shadowInputProof.proofBytes.length).greaterThan(10);

		const aliceIndex = unsignedTx.inputs.findIndex((b) =>
			utxos[ALICE_ADDRESS].map((b) => b.boxId).includes(b.boxId)
		);
		expect(aliceIndex).toBe(1);
		expect(unsignedTx.inputs[aliceIndex].ergoTree).toBe(
			ErgoAddress.fromBase58(ALICE_ADDRESS).ergoTree
		);
		const signedAliceInput = await signTxInput(
			ALICE_MNEMONIC,
			unsignedTx,
			aliceIndex
		);
		const aliceInputProof = JSON.parse(
			signedAliceInput.spending_proof().to_json()
		);
		expect(aliceInputProof.proofBytes.length).greaterThan(10);

		console.dir(unsignedTx, { depth: null });

		const txId = wasm.UnsignedTransaction.from_json(
			JSON.stringify(unsignedTx)
		)
			.id()
			.to_str();

		unsignedTx.inputs[shadowIndex] = {
			boxId: unsignedTx.inputs[shadowIndex].boxId,
			spendingProof: shadowInputProof
		};
		unsignedTx.inputs[aliceIndex] = {
			boxId: unsignedTx.inputs[aliceIndex].boxId,
			spendingProof: aliceInputProof
		};

		unsignedTx.id = txId;
		console.log(ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree);
		expect(await txHasErrors(unsignedTx)).toBe(false);
	});
});

export function createSwapOrderTx(
	sellerPK: string,
	sellerMultisigAddress: string,
	inputBoxes: OneOrMore<Box<Amount>>,
	token: { tokenId: string; amount: Amount },
	sellRate: bigint,
	currentHeight: number,
	unlockHeight: number
): EIP12UnsignedTransaction {
	const output = new OutputBuilder(SAFE_MIN_BOX_VALUE, SWAP_ORDER_ADDRESS)
		.addTokens(token)
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
			R5: SInt(unlockHeight).toHex(),
			R6: SPair(
				SColl(SByte, sellingTokenId),
				SColl(SByte, buyingTokenId)
			).toHex(),
			R7: SLong(sellRate).toHex(),
			R8: SColl(
				SByte,
				ErgoAddress.fromBase58(sellerMultisigAddress).ergoTree
			).toHex()
		});

	const unsignedTransaction = new TransactionBuilder(currentHeight)
		.from(inputBoxes)
		.to(output)
		.sendChangeTo(sellerPK)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	return unsignedTransaction;
}
