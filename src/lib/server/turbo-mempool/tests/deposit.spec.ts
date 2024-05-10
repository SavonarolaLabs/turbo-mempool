import { describe, expect, it } from 'vitest';
import { ALICE_ADDRESS, BOB_ADDRESS, SHADOWPOOL_ADDRESS } from '../../constants/addresses';
import { signMultisig, signTxByAddress, submitTx, txHasErrors } from '../../multisig/multisig';
import { ALICE_MNEMONIC, BOB_MNEMONIC } from '../../constants/mnemonics';
import { createDeposit, createTx, createUnsignedMultisigTx, createWithdraw } from '../utils/common';

const he = it;
describe('BOB', async () => {
	he('can deposit', async () => {
		// delaem tx // otpravlyaem
		// const unsignedTx = await createDeposit();
		// const signedTx = (await signTx(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx)).to_js_eip12();
		// const hasError = await txHasErrors(signedTx);
		// expect(hasError).toBe(false);
		//  REAL SEND TX
		//const tx = await submitTx(signedTx);
		//expect(tx).toBe(1);
	});

	//9d5f023ceb155c8bed2049f5af162d73ec8ddc6f27965d6339ee793e8219b0af

	he('can withdraw', async () => {
		//old
		//let unsignedTx = createUnsignedMultisigTx();
		// let user = {
		// 	mnemonic: mnemonicAlice, //|mnemonicAlice
		// 	address: ALICE_ADDRESS // 1 address   //| ALICE_ADDRESS
		// };
		// let shadow = {
		// 	mnemonic: mnemonicBob, //|mnemonicAlice
		// 	address: BOB_ADDRESS // 1 address   //| ALICE_ADDRESS
		// };

		//no money - no honey
		const unsignedTx = await createWithdraw();

		const signedTx = (
			await signMultisig(unsignedTx, ALICE_MNEMONIC, ALICE_ADDRESS)
		).to_js_eip12();
		//expect(signedTx).toBe(1);
		const hasError = await txHasErrors(signedTx);
		expect(hasError).toBe(false);
	});
});

// ----------
