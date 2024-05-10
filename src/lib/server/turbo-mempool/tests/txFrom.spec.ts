import { describe, expect, it } from 'vitest';
import { BOB_ADDRESS } from '../../constants/addresses';
import { signTxByAddress } from '../../multisig/multisig';
import { BOB_MNEMONIC } from '../../constants/mnemonics';
import { createTx } from '../utils/common';

describe('tx to ', async () => {
	it('it works', async () => {
		// delaem tx // otpravlyaem
		const unsignedTx = await createTx();
		const signedTx = (await signTxByAddress(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx)).to_js_eip12();
		expect(signedTx).toBeTruthy();
	});
});
