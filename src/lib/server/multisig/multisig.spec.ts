import { describe, it, expect } from 'vitest';
import { signMultisig, txHasErrors } from './multisig';
import { ALICE_ADDRESS, BOB_ADDRESS, SHADOWPOOL_ADDRESS } from '../constants/addresses';
import { ALICE_MNEMONIC, BOB_MNEMONIC, SHADOW_MNEMONIC } from '../constants/mnemonics';
import { createUnsignedMultisigTx } from '../tx-chaining/offchain-wallet';

describe('new multisig', async () => {
	it('test', async () => {
		// let unsignedTx = {
		// 	inputs: [
		// 		{
		// 			boxId: '35fe5d32cbc5debe9df461e1caa5ccbe009871ad8744b76532fd2590c8bdb937',
		// 			value: '1000000',
		// 			ergoTree: '1000d801d601e4c6a706089590e4c6a70404a37201ea02e4c6a705087201',
		// 			creationHeight: 1254307,
		// 			assets: [
		// 				{
		// 					tokenId:
		// 						'69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
		// 					amount: '1000000000000'
		// 				}
		// 			],
		// 			additionalRegisters: {
		// 				R4: '04da8e9901',
		// 				R6: '08cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c',
		// 				R5: '08cd025d163103d491a5193c7b18182442877ce8fcf3ffb9ae9c295d9c98a16dcb0551'
		// 			},
		// 			transactionId:
		// 				'da5018abfd2eefd68cda35394409bbee14ee299bc142ed9fc9ef977f7f92a654',
		// 			index: 0,
		// 			extension: {}
		// 		},
		// 		{
		// 			boxId: 'd2d0deb3b0b2c511e523fd43ae838ba7b89e4583f165169b90215ff11d942c1f',
		// 			value: '100000000',
		// 			ergoTree:
		// 				'0008cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c',
		// 			creationHeight: 1251583,
		// 			assets: [],
		// 			additionalRegisters: {},
		// 			transactionId:
		// 				'bb60c4c35130d4f5ed92d12943bcba4f4567b09e0c49cbf9c40e41eb1b67efb8',
		// 			index: 0,
		// 			extension: {}
		// 		}
		// 	],
		// 	dataInputs: [],
		// 	outputs: [
		// 		{
		// 			value: '1000000',
		// 			ergoTree:
		// 				'0008cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c',
		// 			creationHeight: 1254307,
		// 			assets: [
		// 				{
		// 					tokenId:
		// 						'69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
		// 					amount: '1000000000000'
		// 				}
		// 			],
		// 			additionalRegisters: {}
		// 		},
		// 		{
		// 			value: '1100000',
		// 			ergoTree:
		// 				'1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304',
		// 			creationHeight: 1254307,
		// 			assets: [],
		// 			additionalRegisters: {}
		// 		},
		// 		{
		// 			value: '98900000',
		// 			ergoTree: '1000d801d601e4c6a706089590e4c6a70404a37201ea02e4c6a705087201',
		// 			creationHeight: 1254307,
		// 			assets: [],
		// 			additionalRegisters: {}
		// 		}
		// 	]
		// };

		// let user = {
		// 	mnemonic: BOB_MNEMONIC, //|ALICE_MNEMONIC
		// 	address: BOB_ADDRESS // 1 address   //| ALICE_ADDRESS
		// };
		// let shadow = {
		// 	mnemonic: SHADOW_MNEMONIC, //|ALICE_MNEMONIC
		// 	address: SHADOWPOOL_ADDRESS // 1 address   //| ALICE_ADDRESS
		// };

		// ----------

		let unsignedTx = createUnsignedMultisigTx();
		let user = {
			mnemonic: ALICE_MNEMONIC, //|ALICE_MNEMONIC
			address: ALICE_ADDRESS // 1 address   //| ALICE_ADDRESS
		};
		let shadow = {
			mnemonic: BOB_MNEMONIC, //|ALICE_MNEMONIC
			address: BOB_ADDRESS // 1 address   //| ALICE_ADDRESS
		};
		// ----------
		const signedTx = await signMultisig(unsignedTx, user.mnemonic, user.address);

		const txErrors = await txHasErrors(signedTx.to_js_eip12());
		if (txErrors) {
			//console.error(txErrors);
		}
		expect(txErrors).toBe(false);
	});
});
