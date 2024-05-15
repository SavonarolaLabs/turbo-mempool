import type { EIP12UnsignedTransaction } from '@fleet-sdk/common';
import { SHADOW_MNEMONIC } from '../constants/mnemonics';
import { SHADOWPOOL_ADDRESS } from '../constants/addresses';
import { arrayToProposition, getProver } from './multisig';
import { ErgoAddress } from '@fleet-sdk/core';
import { fakeContext } from './fakeContext';
import { ErgoBox, ErgoBoxes, ReducedTransaction, TransactionHintsBag, UnsignedTransaction, extract_hints } from 'ergo-lib-wasm-nodejs';

export async function signMultisigV1(
	unsignedTx: EIP12UnsignedTransaction,
	userMnemonic: string,
	userAddress: string
) {
	const shadow = { mnemonic: SHADOW_MNEMONIC, address: SHADOWPOOL_ADDRESS };
	//const shadow = { mnemonic: BOB_MNEMONIC, address: BOB_ADDRESS };
	const user = { mnemonic: userMnemonic, address: userAddress };

	const proverAlice = await getProver(user.mnemonic);
	const proverBob = await getProver(shadow.mnemonic);

	const hAlice = ErgoAddress.fromBase58(user.address).ergoTree.slice(6);
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

	let initialCommitsBob =
		proverBob.generate_commitments_for_reduced_transaction(reducedTx);

	let jsonBobHints = initialCommitsBobForAlice.to_json();
	console.log("🚀 ~ jsonBobHints:", jsonBobHints)
	

	for (var row in jsonBobHints.publicHints) {
		jsonBobHints.publicHints[row] = jsonBobHints.publicHints[row].filter(
			(item: { hint: string; pubkey: { h: string } }) =>
				!(item.hint == 'cmtWithSecret' && item.pubkey.h == hBob)
		);
	}

	initialCommitsBobForAlice = TransactionHintsBag.from_json(JSON.stringify(jsonBobHints));


	//end

	const initialCommitsAlice =
		proverAlice.generate_commitments_for_reduced_transaction(reducedTx);

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

	for (var row in hintsForAliceSign.publicHints) {
		hintsForAliceSign.publicHints[row] = hintsForAliceSign.publicHints[
			row
		].filter(
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

	const ergoBoxes = ErgoBoxes.empty();
	for (var i = 0; i < unsignedTx.inputs.length; i++) {
		ergoBoxes.add(ErgoBox.from_json(JSON.stringify(unsignedTx.inputs[i])));
	}

	const realPropositionsAlice = arrayToProposition([hAlice]);
	const realPropositionsBob = arrayToProposition([hBob]);

	const simulated: string[] = [];
	const simulatedPropositions = arrayToProposition(simulated);

	let hints = extract_hints(
		partialSignedTx,
		context, // ?
		ergoBoxes,
		ErgoBoxes.empty(),
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
	const convertedHintsForBobSign = TransactionHintsBag.from_json(
		JSON.stringify(hintsForBobSign)
	);

	let signedTx = proverBob.sign_reduced_transaction_multi(
		reducedTx,
		convertedHintsForBobSign
	);

	return signedTx.to_js_eip12();
}