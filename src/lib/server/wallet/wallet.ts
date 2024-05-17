import BIP32Factory, { type BIP32Interface } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bip39 from 'bip39';
import { DERIVATION_PATH } from '../tx-chaining/ergo';
import { addressFromPk } from '../tx-chaining/addresses';

const bip32 = BIP32Factory(ecc);

export function createMnemonic() {
	const mnemonic = bip39.generateMnemonic(128);
	return mnemonic;
}

export async function getChangeAddress(mnemonic: string) {
	return addressFromPk(
		bip32
			.fromSeed(await bip39.mnemonicToSeed(mnemonic))
			.derivePath(DERIVATION_PATH)
			.derive(0)
			.publicKey.toString('hex')
	);
}
