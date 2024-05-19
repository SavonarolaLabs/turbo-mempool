import { fakeContext } from '../constants/fakeContext';
import {
	ErgoBox,
	ErgoBoxes,
	Propositions,
	ReducedTransaction,
	TransactionHintsBag,
	UnsignedTransaction,
	extract_hints
} from 'ergo-lib-wasm-nodejs';
import { ErgoAddress } from '@fleet-sdk/core';
import { mnemonicToSeedSync } from 'bip39';
import * as wasm from 'ergo-lib-wasm-nodejs';
import type {
	EIP12UnsignedInput,
	EIP12UnsignedTransaction,
	SignedTransaction
} from '@fleet-sdk/common';
import { SHADOW_MNEMONIC } from '../constants/mnemonics';
import { SHADOWPOOL_ADDRESS } from '../constants/addresses';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';

export async function signTxMulti(
	unsignedTx: EIP12UnsignedTransaction,
	userMnemonic: string,
	userAddress: string
): Promise<SignedTransaction> {
	return (
		await signMultisig(unsignedTx, userMnemonic, userAddress)
	).to_js_eip12();
}
const bip32 = BIP32Factory(ecc);

type JSONTransactionHintsBag = any;

function _removeSecrets(
	privateCommitments: JSONTransactionHintsBag,
	address: string
) {
	let copy = JSON.parse(JSON.stringify(privateCommitments));

	const hBob = ErgoAddress.fromBase58(address).ergoTree.slice(6);
	for (var row in copy.publicHints) {
		copy.publicHints[row] = copy.publicHints[row].filter(
			(item: { hint: string; pubkey: { h: string } }) =>
				!(item.hint == 'cmtWithSecret' && item.pubkey.h == hBob)
		);
	}

	return copy;
}

export async function a(unsignedTx: EIP12UnsignedTransaction): Promise<any> {
	const proverBob = await getProver(SHADOW_MNEMONIC);
	let reducedTx = reducedFromUnsignedTx(unsignedTx);
	const privateCommitsBob = proverBob
		.generate_commitments_for_reduced_transaction(reducedTx)
		.to_json();

	let publicCommitsBob = _removeSecrets(
		privateCommitsBob,
		SHADOWPOOL_ADDRESS
	);

	return { privateCommitsBob, publicCommitsBob };
}

export async function b(
	unsignedTx: EIP12UnsignedTransaction,
	userMnemonic: string,
	userAddress: string,
	publicCommits: JSONTransactionHintsBag
) {
	const publicBag = TransactionHintsBag.from_json(
		JSON.stringify(publicCommits)
	);
	const proverAlice = await getProver(userMnemonic);
	const reducedTx = reducedFromUnsignedTx(unsignedTx);
	const initialCommitsAlice =
		proverAlice.generate_commitments_for_reduced_transaction(reducedTx);

	const combinedHints = TransactionHintsBag.empty();

	for (let i = 0; i < unsignedTx.inputs.length; i++) {
		combinedHints.add_hints_for_input(
			i,
			initialCommitsAlice.all_hints_for_input(i)
		);
		combinedHints.add_hints_for_input(i, publicBag.all_hints_for_input(i));
	}

	const partialSignedTx = proverAlice.sign_reduced_transaction_multi(
		reducedTx,
		combinedHints
	);

	const hAlice = ErgoAddress.fromBase58(userAddress).ergoTree.slice(6);
	let extractedHints = extract_hints(
		partialSignedTx,
		fakeContext(),
		ErgoBoxes.from_boxes_json(unsignedTx.inputs),
		ErgoBoxes.empty(),
		arrayToProposition([hAlice]),
		arrayToProposition([])
	).to_json();
	return extractedHints;
}

export async function c(
	unsignedTx: EIP12UnsignedTransaction,
	privateCommitsBob: JSONTransactionHintsBag,
	hints: JSONTransactionHintsBag
) {
	const hintsForBobSign = privateCommitsBob;

	for (var row in hintsForBobSign.publicHints) {
		for (var i = 0; i < hints.publicHints[row].length; i++) {
			hintsForBobSign.publicHints[row].push(hints.publicHints[row][i]);
		}
		for (var i = 0; i < hints.secretHints[row].length; i++) {
			hintsForBobSign.secretHints[row].push(hints.secretHints[row][i]);
		}
	}
	const convertedHintsForBobSign = TransactionHintsBag.from_json(
		JSON.stringify(hintsForBobSign)
	);

	const proverBob = await getProver(SHADOW_MNEMONIC);
	let signedTx = proverBob.sign_reduced_transaction_multi(
		reducedFromUnsignedTx(unsignedTx),
		convertedHintsForBobSign
	);

	return signedTx;
}

function reducedFromUnsignedTx(unsignedTx: EIP12UnsignedTransaction) {
	const inputBoxes = ErgoBoxes.from_boxes_json(unsignedTx.inputs);
	const wasmUnsignedTx = UnsignedTransaction.from_json(
		JSON.stringify(unsignedTx)
	);
	let context = fakeContext();
	let reducedTx = ReducedTransaction.from_unsigned_tx(
		wasmUnsignedTx,
		inputBoxes,
		ErgoBoxes.empty(),
		context
	);
	return reducedTx;
}

export async function signMultisig(
	unsignedTx: EIP12UnsignedTransaction,
	userMnemonic: string,
	userAddress: string
) {
	const { privateCommitsBob, publicCommitsBob } = await a(unsignedTx);

	const extractedHints = await b(
		unsignedTx,
		userMnemonic,
		userAddress,
		publicCommitsBob
	);

	const signedTx = await c(unsignedTx, privateCommitsBob, extractedHints);

	return signedTx;
}

export async function txHasErrors(
	signedTransaction: SignedTransaction
): Promise<false | string> {
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

export async function submitTx(
	signedTransaction: SignedTransaction
): Promise<false | string> {
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
	const output = new Propositions();
	input.forEach((pk) => {
		const proposition = Uint8Array.from(Buffer.from('cd' + pk, 'hex'));
		output.add_proposition_from_byte(proposition);
	});
	return output;
}

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
	return wasm.SecretKey.dlog_from_bytes(
		Uint8Array.from(extended.privateKey ?? Buffer.from(''))
	);
};

const RootPathWithoutIndex = "m/44'/429'/0'/0";
const calcPathFromIndex = (index: number) => `${RootPathWithoutIndex}/${index}`;
