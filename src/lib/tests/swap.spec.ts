import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	DEPOSIT_ADDRESS, SWAP_ORDER_ADDRESS
} from '$lib/constants/addresses';
import {
	ALICE_MNEMONIC,
	BOB_MNEMONIC,
	SHADOW_MNEMONIC
} from '$lib/constants/mnemonics';
import { signTxByAddress, signTxInput } from '$lib/wallet/multisig';
import { utxos } from '$lib/data/utxos';
import {
	ErgoAddress,
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	SAFE_MIN_BOX_VALUE, TransactionBuilder
} from '@fleet-sdk/core';
import { beforeAll, describe, expect, it } from 'vitest';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { createSwapOrderTx } from '../wallet/swap';

const sellingTokenId =
	'69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8'; //HoldErgDoge Test1
const buyingTokenId =
	'd2d0deb3b0b2c511e523fd43ae838ba7b89e4583f165169b90215ff11d942c1f'; //SwapToken Test1
const orderValue = SAFE_MIN_BOX_VALUE;

const tokenForSale = {
	tokenId: '69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
	amount: '100'
};

const price = 2n;

let height = 1_260_252; // await fetchHeight()
let unlockHeight = 1_260_258;

let swapOrderBoxes: any;

describe('create new Swap order', async () => {
	beforeAll(async () => {
		const unsignedTx = createSwapOrderTx(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxos[BOB_ADDRESS],
			tokenForSale,
			price,
			height,
			unlockHeight,
			sellingTokenId,
			buyingTokenId
		);

		const signedTx = await signTxByAddress(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsignedTx
		);
		swapOrderBoxes = [signedTx.outputs[0]];
	});

	//swapOrderBoxes

	it('create swap', async () => {
		const buyAmount = 50n;
		const error = 0n;
		const buyerPk = ALICE_ADDRESS;
		const currentHeight = height;

		const paymentInTokens = {
			tokenId: buyingTokenId,
			amount: buyAmount * price
		}; // Сколько заплатили в Других токенах

		//Seller Output
		const outputPayment = new OutputBuilder(
			SAFE_MIN_BOX_VALUE,
			DEPOSIT_ADDRESS
		)
			.setAdditionalRegisters({
				R4: swapOrderBoxes[0].additionalRegisters.R4,
				R5: swapOrderBoxes[0].additionalRegisters.R5,
				R6: swapOrderBoxes[0].additionalRegisters.R6
			})
			.addTokens(paymentInTokens);

		const tempOutputSwapOrder = JSON.parse(
			JSON.stringify(swapOrderBoxes[0])
		);

		tempOutputSwapOrder.assets[0].amount =
			BigInt(tokenForSale.amount) - buyAmount;

		//Swap Order Output
		const outputSwapOrder = new OutputBuilder(
			tempOutputSwapOrder.value,
			SWAP_ORDER_ADDRESS
		)
			.addTokens(tempOutputSwapOrder.assets)
			.setAdditionalRegisters(tempOutputSwapOrder.additionalRegisters);

		const unsignedTransaction = new TransactionBuilder(currentHeight)
			.configureSelector((selector) =>
				selector.ensureInclusion(swapOrderBoxes.map((b) => b.boxId))
			)
			.from([...swapOrderBoxes, ...utxos[buyerPk]])
			.to([outputPayment, outputSwapOrder])
			.sendChangeTo(buyerPk) //add registers
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		//Sign inputs
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
	});
});
