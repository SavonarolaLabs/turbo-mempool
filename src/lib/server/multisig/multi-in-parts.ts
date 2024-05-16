import type { EIP12UnsignedTransaction } from '@fleet-sdk/common';
import { ALICE_MNEMONIC, SHADOW_MNEMONIC } from '../constants/mnemonics';
import { SHADOWPOOL_ADDRESS } from '../constants/addresses';
import { arrayToProposition, getProver } from './multisig';
import { ErgoAddress } from '@fleet-sdk/core';
import { fakeContext } from './fakeContext';
import {
	ErgoBox,
	ErgoBoxes,
	ReducedTransaction,
	Transaction,
	TransactionHintsBag,
	UnsignedTransaction,
	extract_hints
} from 'ergo-lib-wasm-nodejs';

export async function signPart1(unsignedTx: EIP12UnsignedTransaction) {
	const proverServer = await getProver(SHADOW_MNEMONIC);
	const hServer =
		ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).ergoTree.slice(6);

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

	let initialCommitsServerForUser =
		proverServer.generate_commitments_for_reduced_transaction(reducedTx);

	let jsonServerHints = initialCommitsServerForUser.to_json();

	for (var row in jsonServerHints.publicHints) {
		jsonServerHints.publicHints[row] = jsonServerHints.publicHints[
			row
		].filter(
			(item: { hint: string; pubkey: { h: string } }) =>
				!(item.hint == 'cmtWithSecret' && item.pubkey.h == hServer)
		);
	}
	initialCommitsServerForUser = TransactionHintsBag.from_json(
		JSON.stringify(jsonServerHints)
	);

	const hintsString = JSON.stringify(jsonServerHints);

	// console.log('PART 1 FINAL HINTS');
	// console.dir(jsonServerHints, { depth: null });

	return hintsString;
}

export async function signPart2(
	unsignedTx: EIP12UnsignedTransaction,
	hintsString: string,
	userMnemonic: string,
	userAddress: string
) {
	const initialCommitsServerForUser =
		TransactionHintsBag.from_json(hintsString);

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

	const proverUser = await getProver(userMnemonic);

	const initialCommitsUser =
		proverUser.generate_commitments_for_reduced_transaction(reducedTx);

	const hintsForSign = TransactionHintsBag.empty();

	for (var i = 0; i < unsignedTx.inputs.length; i++) {
		hintsForSign.add_hints_for_input(
			i,
			initialCommitsUser.all_hints_for_input(i)
		);
		hintsForSign.add_hints_for_input(
			i,
			initialCommitsServerForUser.all_hints_for_input(i)
		);
	}

	const wasmHintsForSign = TransactionHintsBag.from_json(
		JSON.stringify(hintsForSign.to_json()) // to wasm...
	);

	const partialSignedTx = proverUser.sign_reduced_transaction_multi(
		reducedTx,
		wasmHintsForSign
	);

	const hUser = ErgoAddress.fromBase58(userAddress).ergoTree.slice(6);
	const ergoBoxes = ErgoBoxes.empty();
	for (var i = 0; i < unsignedTx.inputs.length; i++) {
		ergoBoxes.add(ErgoBox.from_json(JSON.stringify(unsignedTx.inputs[i])));
	}
	const realPropositionsUser = arrayToProposition([hUser]); //->p2
	const simulated: string[] = [];
	const simulatedPropositions = arrayToProposition(simulated);

	let hints = extract_hints(
		partialSignedTx,
		context,
		ergoBoxes,
		ErgoBoxes.empty(),
		realPropositionsUser,
		simulatedPropositions
	);
	//console.dir(hints.to_json(), { depth: null });
	const hintsTemp = hints.to_json();
	//hintsTemp.publicHints['0'] = [];
	const keys = Object.keys(hintsTemp.secretHints);
	// console.log(keys);
	// keys.forEach((k) => {
	// 	hintsTemp.server[k] = [];
	// });
	//hintsTemp.secretHints['0'] = [];
	// console.log('PART 2 FINAL HINTS');
	// console.dir(hintsTemp, { depth: null });

	const hintsStringPartial = JSON.stringify(hintsTemp);
	//const hintsStringPartial = JSON.stringify(hints.to_json());

	return hintsStringPartial;
}

export async function signPart3(
	unsignedTx: EIP12UnsignedTransaction,
	hintsStringPartial: string
) {
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

	let hints = TransactionHintsBag.from_json(hintsStringPartial);

	const ourHints = hints.to_json();

	const proverServer = await getProver(SHADOW_MNEMONIC);

	let initialCommitsServer =
		proverServer.generate_commitments_for_reduced_transaction(reducedTx);

	const hintsForServerSign = initialCommitsServer.to_json();

	for (var row in hintsForServerSign.publicHints) {
		for (var i = 0; i < ourHints.publicHints[row].length; i++) {
			hintsForServerSign.publicHints[row].push(
				ourHints.publicHints[row][i]
			);
		}
		for (var i = 0; i < ourHints.secretHints[row].length; i++) {
			hintsForServerSign.secretHints[row].push(
				ourHints.secretHints[row][i]
			);
		}
	}

	const convertedHintsForServerSign = TransactionHintsBag.from_json(
		JSON.stringify(hintsForServerSign)
	);

	let signedTx = proverServer.sign_reduced_transaction_multi(
		reducedTx,
		convertedHintsForServerSign
	);

	return signedTx.to_js_eip12();
}

export async function signMultisigV1(
	unsignedTx: EIP12UnsignedTransaction,
	userMnemonic: string,
	userAddress: string
) {
	// part 1 start
	const hintsString = await signPart1(unsignedTx);

	// part 2 start
	const hintsStringPartial = await signPart2(
		unsignedTx,
		hintsString,
		userMnemonic,
		userAddress
	);

	// part 3 start
	const signedTx = await signPart3(unsignedTx, hintsStringPartial);
	// part 3 end

	return signedTx;
}
