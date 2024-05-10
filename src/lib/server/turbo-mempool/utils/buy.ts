import {
	BUY_ORDER_ADDRESS,
	DEPOSIT_ADDRESS, SHADOWPOOL_ADDRESS
} from '$lib/server/constants/addresses';
import {
	first,
	type Amount,
	type Box,
	type EIP12UnsignedTransaction
} from '@fleet-sdk/common';
import {
	ErgoAddress,
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	SAFE_MIN_BOX_VALUE,
	SByte,
	SColl,
	SGroupElement,
	SInt,
	SLong,
	SSigmaProp,
	TransactionBuilder
} from '@fleet-sdk/core';
import { asBigInt, sumNanoErg } from './helper';

export function buy(
	blockchainHeight: number,
	inputBoxes: Box<Amount>[],
	buyerPK: string,
	buyRate: bigint,
	unlockHeight: number,
	token: { tokenId: string; amount: Amount },
	nanoErg: string | bigint = 2n * RECOMMENDED_MIN_FEE_VALUE + SAFE_MIN_BOX_VALUE
): EIP12UnsignedTransaction {
	console.dir(inputBoxes, {depth: null})
	console.log(token)
	const buyOrder = new OutputBuilder(
		nanoErg,
		BUY_ORDER_ADDRESS
	)
		.addTokens(token)
		.setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(
					first(ErgoAddress.fromBase58(buyerPK).getPublicKeys())
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
			R6: SColl(SByte, token.tokenId).toHex(),
			R7: SLong(buyRate).toHex(),
			R8: SColl(
				SByte,
				ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree
			).toHex()
		});
	
	const change = new OutputBuilder(
		sumNanoErg(inputBoxes) - asBigInt(nanoErg) - RECOMMENDED_MIN_FEE_VALUE,
		DEPOSIT_ADDRESS
	).setAdditionalRegisters({
		R4: SColl(SSigmaProp, [
			SGroupElement(
				first(ErgoAddress.fromBase58(buyerPK).getPublicKeys())
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

	const uTx = new TransactionBuilder(blockchainHeight)
		.from(inputBoxes)
		.to([buyOrder, change])
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	
	return uTx;
}
