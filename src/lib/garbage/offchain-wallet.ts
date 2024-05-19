import type { EIP12UnsignedTransaction, UnsignedTransaction } from '@fleet-sdk/common';
import { TransactionBuilder, OutputBuilder, RECOMMENDED_MIN_FEE_VALUE } from '@fleet-sdk/core';
import { BOB_ADDRESS } from '$lib/constants/addresses';

const creationHeight = 1255780;

export function createUnsignedMultisigTx(): EIP12UnsignedTransaction {
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

// "89951fab8b63bdc491d9b1184b3ebb8ef9ce38184cda57c3bd374d164b9f7269"
export function createUnsignedTx(): EIP12UnsignedTransaction {
	const inputs = [
		{
			boxId: '04f1c9ab87c0bab57c63029d2fedf4bd06d2ae3765e5c2b400055159c4526ce9',
			value: '5000000000',
			ergoTree: '0008cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c',
			creationHeight: 1240570,
			assets: [],
			additionalRegisters: {},
			transactionId: 'f2da249215f52e602837dbf9aa538d6a36b372c61bf30e254692382c55e37f68',
			index: 0,
			confirmed: true
		}
	];
	const output = new OutputBuilder(BigInt('5000000000') - RECOMMENDED_MIN_FEE_VALUE, BOB_ADDRESS);

	let tx = new TransactionBuilder(creationHeight)
		.from(inputs)
		.to(output)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	return tx;
}

export function createUnsignedTxAlice(): EIP12UnsignedTransaction {
	const inputs = [
		{
			boxId: '2be7238457fe8d983764d4005fa6dfefe063384a3cf0c1dfc091418aa80707dc',
			value: '1000000000',
			ergoTree: '0008cd02eb083423041003740c9e791b2fea5ecf6e273669630a25b7ecabf9145395e447',
			creationHeight: 1246507,
			assets: [],
			additionalRegisters: {},
			transactionId: '698b4523f9909972f35839bb4440adf9f3eb412e6d56943b4b69118bec2b2c1d',
			index: 0,
			confirmed: true
		}
	];
	const output = new OutputBuilder(BigInt('1000000000') - RECOMMENDED_MIN_FEE_VALUE, BOB_ADDRESS);

	let tx = new TransactionBuilder(creationHeight)
		.from(inputs)
		.to(output)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();
	return tx;
}

export function createChainedUnsingedTx(): UnsignedTransaction {
	const tx1 = {
		id: '7cd0c452ea5c6c62890d7ec5201cae94578f8ed77e5bf73e20caf7b639e7c216',
		inputs: [
			{
				boxId: '04f1c9ab87c0bab57c63029d2fedf4bd06d2ae3765e5c2b400055159c4526ce9',
				spendingProof: {
					proofBytes:
						'3e33e909982063cb9cecd9aa682e47e45afb6e16f047d8e8d61233101c666e1c7ae664d6dc2f21fafc5a66e1aca88e50fcfb7425ca7f5119',
					extension: {}
				}
			}
		],
		dataInputs: [],
		outputs: [
			{
				boxId: 'c079c094a83bd46c90f06d9766258127fb3c62a3a627dd0527e6867644b663c8',
				value: '4998900000',
				ergoTree:
					'0008cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c',
				creationHeight: 1240713,
				index: 0,
				transactionId: '7cd0c452ea5c6c62890d7ec5201cae94578f8ed77e5bf73e20caf7b639e7c216',
				assets: [],
				additionalRegisters: {}
			},
			{
				boxId: 'e2cc14ec01b354397a06cd99290b8f50e88ebde8be85ce27d79ba720b077e3c4',
				value: '1100000',
				ergoTree:
					'1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304',
				creationHeight: 1240713,
				index: 1,
				transactionId: '7cd0c452ea5c6c62890d7ec5201cae94578f8ed77e5bf73e20caf7b639e7c216',
				assets: [],
				additionalRegisters: {}
			}
		]
	};

	const inputs = [tx1.outputs[0]];
	const output = new OutputBuilder(
		BigInt(tx1.outputs[0].value) - RECOMMENDED_MIN_FEE_VALUE,
		BOB_ADDRESS
	);

	let tx2 = new TransactionBuilder(creationHeight)
		.from(inputs)
		.to(output)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();

	return tx2;
}

export { BOB_ADDRESS };