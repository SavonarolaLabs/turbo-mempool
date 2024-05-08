import {
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

export function createSellOrderTx(
	sellerPK: string,
	sellerMultisigAddress: string,
	inputBoxes: OneOrMore<Box<Amount>>,
	token: { tokenId: string; amount: Amount },
	sellRate: bigint,
	currentHeight: number,
	unlockHeight: number
): EIP12UnsignedTransaction {
	const output = new OutputBuilder(
		2n * RECOMMENDED_MIN_FEE_VALUE + SAFE_MIN_BOX_VALUE,
		SELL_ORDER_ADDRESS
	)
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
			R6: SColl(SByte, token.tokenId).toHex(),
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

export function canсelSellOrderTx(
	sellerPK: string,
	multisigAddress: string,
	inputBoxes: OneOrMore<Box<Amount>>,
	currentHeight: number,
	unlockHeight: number
): EIP12UnsignedTransaction {
	let mandatoryBoxes = inputBoxes;

	const tokens = mandatoryBoxes.flatMap((box) => box.assets);
	let value = mandatoryBoxes.reduce((a, e) => +a + +e.value, 0);

	if (value < SAFE_MIN_BOX_VALUE) {
		value = SAFE_MIN_BOX_VALUE;
	}

	const output = new OutputBuilder(value, multisigAddress)
		.addTokens(tokens)
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
		});

	const unsignedTransaction = new TransactionBuilder(currentHeight)
		.configureSelector((selector) =>
			selector.ensureInclusion(mandatoryBoxes.map((b) => b.boxId))
		)
		.from([...inputBoxes, ...utxos[sellerPK]])
		.to(output)
		.sendChangeTo(sellerPK)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	return unsignedTransaction;
}
