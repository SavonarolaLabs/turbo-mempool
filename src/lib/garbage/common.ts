import {
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	TransactionBuilder,
	ErgoAddress
} from '@fleet-sdk/core';
import { BOB_ADDRESS, DEPOSIT_ADDRESS, SHADOWPOOL_ADDRESS } from '$lib/constants/addresses';
import { utxos } from '$lib/data/unspent';
import { fetchHeight } from '../external/height';
import { first, type EIP12UnsignedTransaction } from '@fleet-sdk/common';

import { SGroupElement, SInt, SSigmaProp } from '@fleet-sdk/serializer';

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
	const currentHeight = await fetchHeight();
	const utxosBob = utxos[BOB_ADDRESS];
	const utxosDeposit = utxos[DEPOSIT_ADDRESS];

	const shadowPool = ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS);
	const userPk = ErgoAddress.fromBase58(BOB_ADDRESS);

	const output = new OutputBuilder('30000000', DEPOSIT_ADDRESS).setAdditionalRegisters({
		R4: SInt(currentHeight + 10).toHex(),
		R5: SSigmaProp(SGroupElement(first(shadowPool.getPublicKeys()))).toHex(),
		R6: SSigmaProp(SGroupElement(first(userPk.getPublicKeys()))).toHex()
	});

	const unsignedMintTransaction = new TransactionBuilder(currentHeight)
		.from([...utxosBob])
		.to([output])
		.sendChangeTo(BOB_ADDRESS)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();

	return unsignedMintTransaction;
}

export async function createWithdraw() {
	//input-output+config
	const currentHeight = await fetchHeight();
	//const utxosBob = utxos[BOB_ADDRESS];
	//const utxosDeposit = [utxos[BOB_ADDRESS][0]];
	const utxosDeposit = [utxos[DEPOSIT_ADDRESS][0]];
	const mandatoryBoxes = utxosDeposit;
	//mandatoryBoxes

	const unsignedMintTransaction = new TransactionBuilder(currentHeight)
		.configureSelector((selector) =>
			selector.ensureInclusion(mandatoryBoxes.map((b) => b.boxId))
		)
		.from([...utxosDeposit])
		.sendChangeTo(BOB_ADDRESS)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();

	return unsignedMintTransaction;
}

export function createUnsignedMultisigTx(): EIP12UnsignedTransaction {
	//OLD DELETE AFTER
	const creationHeight = 1255796;
	const inputs = [
		{
			boxId: 'e1a20cf2048cc090f2dd97891e536def6f28e82206cdaacbf769e6b86a435c9b',
			value: '1000000000',
			ergoTree:
				'1003040408cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c08cd02eb083423041003740c9e791b2fea5ecf6e273669630a25b7ecabf9145395e44798730083020873017302',
			creationHeight: 1251587,
			assets: [],
			additionalRegisters: {},
			transactionId: 'bac2b1308a3c5bc04f849bdec03a902432156c27ae664a58591704a75797cec0',
			index: 0,
			confirmed: true
		}
	];
	const output1 = new OutputBuilder(
		BigInt('1000000000') - RECOMMENDED_MIN_FEE_VALUE,
		BOB_ADDRESS
	); //"98900000"

	let tx = new TransactionBuilder(creationHeight)
		.from(inputs)
		.to([output1])
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();

	return tx;
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
