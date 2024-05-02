import {
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	TransactionBuilder,
	ErgoAddress
} from '@fleet-sdk/core';
import { BOB_ADDRESS, DEPOSIT_ADDRESS } from '../addresses';
import { utxos } from '../utxo/unspent';
import { fetchHeight } from './fetchHeight';

export async function createTx() {
	//input-output+config
	const currentHeight = await fetchHeight();
	const utxosBob = utxos[BOB_ADDRESS];
	const utxosDeposit = utxos[DEPOSIT_ADDRESS];
	const mandatoryBoxes = utxosDeposit;

	// const output1 = new OutputBuilder(
	// 	BigInt('1000000000') - RECOMMENDED_MIN_FEE_VALUE,
	// 	BOB_ADDRESS
	// ); //"98900000"
	const unsignedMintTransaction = new TransactionBuilder(currentHeight)
		.configureSelector((selector) =>
			selector.ensureInclusion(mandatoryBoxes.map((b) => b.boxId))
		)
		.from([...utxosDeposit, ...utxosBob])
		.sendChangeTo(BOB_ADDRESS)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();

	return unsignedMintTransaction;
}

export async function createDeposit() {
	//input-output+config
	const currentHeight = await fetchHeight();
	const utxosBob = utxos[BOB_ADDRESS];
	const utxosDeposit = utxos[DEPOSIT_ADDRESS];
	const output = new OutputBuilder('30000000', DEPOSIT_ADDRESS); //"98900000"

	const unsignedMintTransaction = new TransactionBuilder(currentHeight)
		.from([...utxosBob])
		.to([output])
		.sendChangeTo(BOB_ADDRESS)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();

	return unsignedMintTransaction;
}

export function addBoxToContract(
	contract: ErgoAddress | string,
	sender: ErgoAddress | string,
	utxos: Array<any>,
	value: bigint,
	assets: Array<any>,
	registers: { R4?; R5?; R6?; R7?; R8? },
	currentHeight: number
) {
	const output = new OutputBuilder(value, contract)
		.addTokens(assets)
		.setAdditionalRegisters(registers);

	const unsignedMintTransaction = new TransactionBuilder(currentHeight)
		.from(utxos)
		.to(output)
		.sendChangeTo(sender)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();

	return unsignedMintTransaction;
}
