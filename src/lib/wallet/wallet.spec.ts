import { describe, expect, it } from 'vitest';
import { getChangeAddress, createMnemonic } from './wallet';
import { ALICE_MNEMONIC } from '$lib/constants/mnemonics';
import { ALICE_ADDRESS } from '$lib/constants/addresses';

describe('wallet', () => {
	it('creates mnemonic 12 words', () => {
		const mnemonic = createMnemonic();
		expect(mnemonic.split(' ').length, 'words').toBe(12);
	});

	it('get change address from mnemonic', async () => {
		const address = await getChangeAddress(ALICE_MNEMONIC);
		expect(address, 'change address').toBe(ALICE_ADDRESS);
	});

	it('create new user', async () => {});
});
