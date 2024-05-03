import { first, type Amount, type Box, type EIP12UnsignedTransaction, type OneOrMore } from "@fleet-sdk/common";
import { ErgoAddress, OutputBuilder, RECOMMENDED_MIN_FEE_VALUE, SAFE_MIN_BOX_VALUE, SGroupElement, SInt, SSigmaProp, TransactionBuilder } from "@fleet-sdk/core";
import { DEPOSIT_ADDRESS, SHADOWPOOL_ADDRESS } from "../constants/addresses";

export function createDepositTx(userPK: string, inputBoxes: OneOrMore<Box<Amount>>, unlockHeight: number, currentHeight: number): EIP12UnsignedTransaction{
	const output = new OutputBuilder(
		3n * SAFE_MIN_BOX_VALUE,
		DEPOSIT_ADDRESS
	).setAdditionalRegisters({
		R4: SInt(unlockHeight).toHex(),
		R5: SSigmaProp(
			SGroupElement(first(ErgoAddress.fromBase58(userPK).getPublicKeys()))
		).toHex(),
		R6: SSigmaProp(
			SGroupElement(first(ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).getPublicKeys()))
		).toHex()
	});
	const unsignedTransaction = new TransactionBuilder(currentHeight)
		.from(inputBoxes)
		.to(output)
		.sendChangeTo(userPK)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
    return unsignedTransaction
}

export function createWithdrawTx(userAddress: string, inputBoxes: OneOrMore<Box<Amount>>, currentHeight: number): EIP12UnsignedTransaction{
	const unsigned = new TransactionBuilder(currentHeight)
		.from(inputBoxes)
		.sendChangeTo(userAddress)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	return unsigned;
}
