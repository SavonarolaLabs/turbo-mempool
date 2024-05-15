import type { EIP12UnsignedTransaction } from '@fleet-sdk/common';
import { ALICE_MNEMONIC, SHADOW_MNEMONIC } from '../constants/mnemonics';
import { ALICE_ADDRESS, SHADOWPOOL_ADDRESS } from '../constants/addresses';
import { arrayToProposition, getProver } from './multisig';
import { ErgoAddress } from '@fleet-sdk/core';
import { fakeContext } from './fakeContext';
import {
	ErgoBox,
	ErgoBoxes,
	ReducedTransaction,
	TransactionHintsBag,
	UnsignedTransaction,
	extract_hints
} from 'ergo-lib-wasm-nodejs';

export async function part1(unsignedTx: EIP12UnsignedTransaction) {
	const shadow = { mnemonic: SHADOW_MNEMONIC, address: SHADOWPOOL_ADDRESS };
	const proverBob = await getProver(shadow.mnemonic);
	const hBob = ErgoAddress.fromBase58(shadow.address).ergoTree.slice(6);

	const wasmUnsignedTx = UnsignedTransaction.from_json(
		JSON.stringify(unsignedTx)
	);
	const inputBoxes = ErgoBoxes.from_boxes_json(unsignedTx.inputs);

	let context = fakeContext();

	let reducedTx = ReducedTransaction.from_unsigned_tx(
		wasmUnsignedTx,
		inputBoxes,
		ErgoBoxes.empty(),
		context
	);

	let initialCommitsBobForAlice =
		proverBob.generate_commitments_for_reduced_transaction(reducedTx);

	let jsonBobHints = initialCommitsBobForAlice.to_json();

	for (var row in jsonBobHints.publicHints) {
		jsonBobHints.publicHints[row] = jsonBobHints.publicHints[row].filter(
			(item: { hint: string; pubkey: { h: string } }) =>
				!(item.hint == 'cmtWithSecret' && item.pubkey.h == hBob)
		);
	}
	initialCommitsBobForAlice = TransactionHintsBag.from_json(
		JSON.stringify(jsonBobHints)
	);

	return { initialCommitsBobForAlice };
}

export async function signMultisigV1(unsignedTx: EIP12UnsignedTransaction) {
	// part 1 start
	const { initialCommitsBobForAlice } = await part1(unsignedTx);

	// part 2 start
	const wasmUnsignedTx2 = UnsignedTransaction.from_json(
		JSON.stringify(unsignedTx)
	);
	const inputBoxes2 = ErgoBoxes.from_boxes_json(unsignedTx.inputs);
	let context2 = fakeContext();
	let reducedTx2 = ReducedTransaction.from_unsigned_tx(
		wasmUnsignedTx2,
		inputBoxes2,
		ErgoBoxes.empty(),
		context2
	);

	const user = { mnemonic: ALICE_MNEMONIC, address: ALICE_ADDRESS };
	const proverAlice = await getProver(user.mnemonic);

	const initialCommitsAlice =
		proverAlice.generate_commitments_for_reduced_transaction(reducedTx2);

	const hintsAll = TransactionHintsBag.empty();

	for (var i = 0; i < unsignedTx.inputs.length; i++) {
		hintsAll.add_hints_for_input(
			i,
			initialCommitsAlice.all_hints_for_input(i)
		);
		hintsAll.add_hints_for_input(
			i,
			initialCommitsBobForAlice.all_hints_for_input(i)
		);
	}

	const hintsForAliceSign = JSON.parse(JSON.stringify(hintsAll.to_json())); // make copy

	const convertedHintsForAliceSign = TransactionHintsBag.from_json(
		JSON.stringify(hintsForAliceSign) // to wasm...
	);

	const partialSignedTx = proverAlice.sign_reduced_transaction_multi(
		reducedTx2,
		convertedHintsForAliceSign
	);

	// part 3 end
	const hAlice = ErgoAddress.fromBase58(ALICE_ADDRESS).ergoTree.slice(6);
	let context = fakeContext();
	const wasmUnsignedTx = UnsignedTransaction.from_json(
		JSON.stringify(unsignedTx)
	);
	const inputBoxes = ErgoBoxes.from_boxes_json(unsignedTx.inputs);
	let reducedTx = ReducedTransaction.from_unsigned_tx(
		wasmUnsignedTx,
		inputBoxes,
		ErgoBoxes.empty(),
		context
	);

	const ergoBoxes = ErgoBoxes.empty();
	for (var i = 0; i < unsignedTx.inputs.length; i++) {
		ergoBoxes.add(ErgoBox.from_json(JSON.stringify(unsignedTx.inputs[i])));
	}

	const realPropositionsAlice = arrayToProposition([hAlice]);

	const simulated: string[] = [];
	const simulatedPropositions = arrayToProposition(simulated);

	let hints = extract_hints(
		partialSignedTx,
		context,
		ergoBoxes,
		ErgoBoxes.empty(),
		realPropositionsAlice,
		simulatedPropositions
	);

	const ourHints = hints.to_json();

	const shadow = { mnemonic: SHADOW_MNEMONIC, address: SHADOWPOOL_ADDRESS };
	const proverBob = await getProver(shadow.mnemonic);

	let initialCommitsBob =
		proverBob.generate_commitments_for_reduced_transaction(reducedTx);

	const hintsForBobSign = initialCommitsBob.to_json();

	for (var row in hintsForBobSign.publicHints) {
		for (var i = 0; i < ourHints.publicHints[row].length; i++) {
			hintsForBobSign.publicHints[row].push(ourHints.publicHints[row][i]);
		}
		for (var i = 0; i < ourHints.secretHints[row].length; i++) {
			hintsForBobSign.secretHints[row].push(ourHints.secretHints[row][i]);
		}
	}

	const convertedHintsForBobSign = TransactionHintsBag.from_json(
		JSON.stringify(hintsForBobSign)
	);

	let signedTx = proverBob.sign_reduced_transaction_multi(
		reducedTx,
		convertedHintsForBobSign
	);

	return signedTx.to_js_eip12();
}
