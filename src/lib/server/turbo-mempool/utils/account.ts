import {
	first,
	type Amount,
	type Box,
	type EIP12UnsignedTransaction,
	type OneOrMore,
	type TokenAmount
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
import { DEPOSIT_ADDRESS, SHADOWPOOL_ADDRESS } from '../../constants/addresses';

export function deposit(
	blockchainHeight: number,
	inputBoxes: OneOrMore<Box<Amount>>,
	changeAddress: string,
	userPK: string,
	unlockHeight: number,
	tokens: OneOrMore<TokenAmount<Amount>>,
	nanoErg: string | bigint = 3n * SAFE_MIN_BOX_VALUE
): EIP12UnsignedTransaction {
	const depositBox = new OutputBuilder(nanoErg, DEPOSIT_ADDRESS)
		.setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(
					first(ErgoAddress.fromBase58(userPK).getPublicKeys())
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
		.addTokens(tokens);

	const unsignedTx = new TransactionBuilder(blockchainHeight)
		.from(inputBoxes)
		.to(depositBox)
		.sendChangeTo(changeAddress)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();

	return unsignedTx;
}

export function createWithdrawTx(
	userAddress: string,
	inputBoxes: OneOrMore<Box<Amount>>,
	currentHeight: number
): EIP12UnsignedTransaction {
	const unsigned = new TransactionBuilder(currentHeight)
		.from(inputBoxes)
		.sendChangeTo(userAddress)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	return unsigned;
}
