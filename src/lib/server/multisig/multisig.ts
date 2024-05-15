import { wasmModule } from '../tx-chaining/utils/wasm-module';
import { fakeContext } from './fakeContext';
import { ErgoBox, ErgoBoxes, TransactionHintsBag } from 'ergo-lib-wasm-nodejs';
import { ErgoAddress } from '@fleet-sdk/core';
import { mnemonicToSeedSync } from 'bip39';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { bip32 } from './functions';
import type { EIP12UnsignedInput, EIP12UnsignedTransaction, SignedTransaction } from '@fleet-sdk/common';
import { SHADOW_MNEMONIC } from '../constants/mnemonics';
import { SHADOWPOOL_ADDRESS } from '../constants/addresses';



export async function signTxMulti(unsignedTx: EIP12UnsignedTransaction, userMnemonic: string, userAddress: string): Promise<SignedTransaction>{
	return (await signMultisig(unsignedTx, userMnemonic, userAddress)).to_js_eip12()
}

export async function signMultisig(unsignedTx: EIP12UnsignedTransaction, userMnemonic: string, userAddress: string) {
	await wasmModule.loadAsync();

	const shadow = { mnemonic: SHADOW_MNEMONIC, address: SHADOWPOOL_ADDRESS };
	//const shadow = { mnemonic: BOB_MNEMONIC, address: BOB_ADDRESS };
	const user = { mnemonic: userMnemonic, address: userAddress };

	const proverAlice = await getProver(user.mnemonic);
	const proverBob = await getProver(shadow.mnemonic);

	const hAlice = ErgoAddress.fromBase58(user.address).ergoTree.slice(6);
	const hBob = ErgoAddress.fromBase58(shadow.address).ergoTree.slice(6);

	const wasmUnsignedTx = wasmModule.SigmaRust.UnsignedTransaction.from_json(
		JSON.stringify(unsignedTx)
	);

	const inputBoxes = ErgoBoxes.from_boxes_json(unsignedTx.inputs);

	let context = fakeContext();

	let reducedTx = wasmModule.SigmaRust.ReducedTransaction.from_unsigned_tx(
		wasmUnsignedTx,
		inputBoxes,
		ErgoBoxes.empty(),
		context
	);

	const initialCommitsBob = proverBob.generate_commitments_for_reduced_transaction(reducedTx);
	const initialCommitsAlice = proverAlice.generate_commitments_for_reduced_transaction(reducedTx);

	const hintsAll = TransactionHintsBag.empty();

	for (var i = 0; i < unsignedTx.inputs.length; i++) {
		hintsAll.add_hints_for_input(i, initialCommitsAlice.all_hints_for_input(i));
		hintsAll.add_hints_for_input(i, initialCommitsBob.all_hints_for_input(i));
	}

	const hintsForAliceSign = JSON.parse(JSON.stringify(hintsAll.to_json())); // make copy

	for (var row in hintsForAliceSign.publicHints) {
		hintsForAliceSign.publicHints[row] = hintsForAliceSign.publicHints[row].filter(
			(item) => !(item.hint == 'cmtWithSecret' && item.pubkey.h == hBob)
		);
	}

	const convertedHintsForAliceSign = TransactionHintsBag.from_json(
		JSON.stringify(hintsForAliceSign) // to wasm...
	);

	const partialSignedTx = proverAlice.sign_reduced_transaction_multi(
		reducedTx,
		convertedHintsForAliceSign
	);

	const ergoBoxes = wasmModule.SigmaRust.ErgoBoxes.empty();
	for (var i = 0; i < unsignedTx.inputs.length; i++) {
		ergoBoxes.add(ErgoBox.from_json(JSON.stringify(unsignedTx.inputs[i])));
	}

	const realPropositionsAlice = arrayToProposition([hAlice]);
	const realPropositionsBob = arrayToProposition([hBob]);

	const simulated = [];
	const simulatedPropositions = arrayToProposition(simulated);

	let hints = wasmModule.SigmaRust.extract_hints(
		partialSignedTx,
		context, // ?
		ergoBoxes,
		wasmModule.SigmaRust.ErgoBoxes.empty(),
		realPropositionsAlice, // ?
		simulatedPropositions
	);

	const ourHints = hints.to_json();
	const hintsForBobSign = initialCommitsBob.to_json();

	for (var row in hintsForBobSign.publicHints) {
		for (var i = 0; i < ourHints.publicHints[row].length; i++) {
			hintsForBobSign.publicHints[row].push(ourHints.publicHints[row][i]);
		}
		for (var i = 0; i < ourHints.secretHints[row].length; i++) {
			hintsForBobSign.secretHints[row].push(ourHints.secretHints[row][i]);
		}
	}
	const convertedHintsForBobSign = TransactionHintsBag.from_json(JSON.stringify(hintsForBobSign));

	let signedTx = proverBob.sign_reduced_transaction_multi(reducedTx, convertedHintsForBobSign);

	return signedTx;
}

export async function txHasErrors(signedTransaction: SignedTransaction): Promise<false | string> {
	const endpoint = 'https://gql.ergoplatform.com/';
	const query = `
      mutation CheckTransaction($signedTransaction: SignedTransaction!) {
        checkTransaction(signedTransaction: $signedTransaction)
      }
    `;

	const variables = {
		signedTransaction: signedTransaction
	};

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query: query,
			variables: variables
		})
	});

	if (!response.ok) {
		throw new Error(response.statusText);
	}

	const jsonResp = await response.json();
	if (jsonResp.data?.checkTransaction) {
		return false;
	} else {
		return jsonResp.errors;
	}
}

export async function submitTx(signedTransaction: SignedTransaction): Promise<false | string> {
	const endpoint = 'https://gql.ergoplatform.com/';
	const query = `
      mutation SubmitTransaction($signedTransaction: SignedTransaction!) {
        submitTransaction(signedTransaction: $signedTransaction)
      }
    `;

	const variables = {
		signedTransaction: signedTransaction
	};

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query: query,
			variables: variables
		})
	});

	if (!response.ok) {
		throw new Error('Network response was not ok: ' + response.statusText);
	}

	const jsonResp = await response.json();
	if (jsonResp.data?.submitTransaction) {
		return jsonResp.data.submitTransaction;
	} else {
		return false;
	}
}

enum WalletType {
	ReadOnly = 'READ_ONLY',
	Normal = 'NORMAL',
	MultiSig = 'MULTI_SIG'
}

interface TokenInfo {
	tokenId: string;
	balance: string;
}

interface StateWallet {
	id: number;
	name: string;
	networkType: string;
	seed: string;
	xPub: string;
	type: WalletType;
	requiredSign: number;
	version: number;
	balance: string;
	tokens: Array<TokenInfo>;
	addresses: Array<StateAddress>;
}

export interface StateAddress {
	id: number;
	name: string;
	address: string;
	path: string;
	idx: number;
	balance: string;
	walletId: number;
	proceedHeight: number;
	tokens: Array<TokenInfo>;
}

export function arrayToProposition(input: Array<string>): wasm.Propositions {
	const output = new wasmModule.SigmaRust.Propositions();
	input.forEach((pk) => {
		const proposition = Uint8Array.from(Buffer.from('cd' + pk, 'hex'));
		output.add_proposition_from_byte(proposition);
	});
	return output;
};

export async function getProver(mnemonic: string): Promise<wasm.Wallet> {
	const secretKeys = new wasm.SecretKeys();
	secretKeys.add(getWalletAddressSecret(mnemonic));
	return wasm.Wallet.from_secrets(secretKeys);
}

export async function signTxByAddress(
	mnemonic: string,
	address: string,
	tx: EIP12UnsignedTransaction
): Promise<SignedTransaction> {
	const prover = await getProver(mnemonic);

	const boxesToSign = tx.inputs.filter(
		(i) => i.ergoTree == ErgoAddress.fromBase58(address).ergoTree
	);
	const boxes_to_spend = ErgoBoxes.empty();
	boxesToSign.forEach((box) => {
		boxes_to_spend.add(ErgoBox.from_json(JSON.stringify(box)));
	});

	const signedTx = prover.sign_transaction(
		fakeContext(),
		wasm.UnsignedTransaction.from_json(JSON.stringify(tx)),
		boxes_to_spend,
		ErgoBoxes.empty()
	);
	return signedTx.to_js_eip12();
}

export async function signTxByInputs(
	mnemonic: string,
	boxesToSign: EIP12UnsignedInput[],
	tx: EIP12UnsignedTransaction
): Promise<SignedTransaction> {
	const prover = await getProver(mnemonic);

	const boxes_to_spend = ErgoBoxes.empty();
	boxesToSign.forEach((box) => {
		boxes_to_spend.add(ErgoBox.from_json(JSON.stringify(box)));
	});

	const signedTx = prover.sign_transaction(
		fakeContext(),
		wasm.UnsignedTransaction.from_json(JSON.stringify(tx)),
		boxes_to_spend,
		ErgoBoxes.empty()
	);
	return signedTx.to_js_eip12();
}

export async function signTx(
	tx: EIP12UnsignedTransaction,
	mnemonic: string
): Promise<SignedTransaction> {
	const prover = await getProver(mnemonic);

	const boxesToSign = tx.inputs;
	const boxes_to_spend = ErgoBoxes.empty();
	boxesToSign.forEach((box) => {
		boxes_to_spend.add(ErgoBox.from_json(JSON.stringify(box)));
	});

	const signedTx = prover.sign_transaction(
		fakeContext(),
		wasm.UnsignedTransaction.from_json(JSON.stringify(tx)),
		boxes_to_spend,
		ErgoBoxes.empty()
	);
	return signedTx.to_js_eip12();
}

export async function signTxAllInputs(
	mnemonic: string,
	tx: EIP12UnsignedTransaction
): Promise<SignedTransaction> {
	const prover = await getProver(mnemonic);

	const boxesToSign = tx.inputs;
	const boxes_to_spend = ErgoBoxes.empty();
	boxesToSign.forEach((box) => {
		boxes_to_spend.add(ErgoBox.from_json(JSON.stringify(box)));
	});

	const signedTx = prover.sign_transaction(
		fakeContext(),
		wasm.UnsignedTransaction.from_json(JSON.stringify(tx)),
		boxes_to_spend,
		ErgoBoxes.empty()
	);
	return signedTx.to_js_eip12();
}

export async function signTxInput(
	mnemonic: string,
	tx: EIP12UnsignedTransaction,
	index: number
): Promise<wasm.Input> {
	const prover = await getProver(mnemonic);

	const boxesToSign = tx.inputs;
	const boxes_to_spend = ErgoBoxes.empty();
	boxesToSign.forEach((box) => {
		boxes_to_spend.add(ErgoBox.from_json(JSON.stringify(box)));
	});

	const signedInput = prover.sign_tx_input(
		index,
		fakeContext(),
		wasm.UnsignedTransaction.from_json(JSON.stringify(tx)),
		boxes_to_spend,
		ErgoBoxes.empty()
	);
	return signedInput;
}

const getWalletAddressSecret = (mnemonic: string, idx: number = 0) => {
	let seed = mnemonicToSeedSync(mnemonic);
	const path = calcPathFromIndex(idx);
	const extended = bip32.fromSeed(seed).derivePath(path);
	return wasm.SecretKey.dlog_from_bytes(Uint8Array.from(extended.privateKey ?? Buffer.from('')));
};

const RootPathWithoutIndex = "m/44'/429'/0'/0";
const calcPathFromIndex = (index: number) => `${RootPathWithoutIndex}/${index}`;
