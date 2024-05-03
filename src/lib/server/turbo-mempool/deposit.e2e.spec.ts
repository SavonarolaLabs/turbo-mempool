import { describe, expect, it } from 'vitest';
import {
	signTx,
	submitTx,
} from '../multisig/multisig';
import {
	BOB_MNEMONIC,
} from '../constants/mnemonics';
import {
	BOB_ADDRESS,
} from '../constants/addresses';
import { utxos } from '../utxo/unspent';
import { createDepositTx } from './account';

describe.skip('boxes from depositAddress', () => {
	it('Bob deposit real box to deposit ', async () => {
		const unsignedTx = createDepositTx(
			BOB_ADDRESS,
			utxos[BOB_ADDRESS],
			1256321 + 200,
			1255856
		);
		const signedTx = await signTx(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx);

		const sumbitedTx = await submitTx(signedTx);
		expect(sumbitedTx).toBeTypeOf('string');
	});
});
