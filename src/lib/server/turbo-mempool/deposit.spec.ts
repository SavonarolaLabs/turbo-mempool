import { describe, expect, it } from 'vitest';
import { BOB_ADDRESS } from '../addresses';
import { signTx, txHasErrors } from '../multisig/multisig';
import { BOB_MNEMONIC } from '../constants/mnemonics';
import { createDeposit, createTx } from './common';

describe('BOB', async () => {
	it('can deposit', async () => {
		// delaem tx // otpravlyaem
		const unsignedTx = await createDeposit();
		const signedTx = (await signTx(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx)).to_js_eip12();
		const hasError = await txHasErrors(signedTx);
		expect(hasError).toBe(false);
	});
});
