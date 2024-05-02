import { beforeAll, describe, expect, it } from 'vitest';
import { sellOrderAddress } from '../constants/sellOrder';
import {
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	TransactionBuilder,
	ErgoAddress,
	SAFE_MIN_BOX_VALUE,
	ErgoBox
} from '@fleet-sdk/core';
import { first } from '@fleet-sdk/common';
import { SGroupElement, SInt, SLong, SSigmaProp } from '@fleet-sdk/serializer';
import { aliceUtxosInitial, bobUtxosInitial } from './utxos';
import { fetchHeight } from './fetchHeight';
import { wasmModule } from '../tx-chaining/utils/wasm-module';
import Bip32 from '../tx-chaining/bip32';
import { Prover } from '../tx-chaining/prover';
import { headers } from '../tx-chaining/gql-explorer';
import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	DEPOSIT_ADDRESS,
	SHADOWPOOL_ADDRESS
} from '../constants/addresses';
import { BOB_MNEMONIC } from '../constants/mnemonics';
import { getProver, signTx } from '../multisig/multisig';
import { addBoxToContract } from './common';

const allboxes = []; // table for utxos and spent Tx

const CHAIN_HEIGHT = 1250600;

const BOB_TREE = '0008cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c';

const HOLDERGDOGE_TEST1 = '69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8';
const enoughToSignBob = {};
const enoughToSignAlice = {};

const initialValue = SAFE_MIN_BOX_VALUE; //big int
const assetId = '';
const assetAmount = 100;
const assetRate = 5;
const decayHeight = 10;

const assetFakeId = '';
const assetFakeRate = ''; //blocked

let bobUtxos = JSON.parse(JSON.stringify(bobUtxosInitial)); //ergoTree? //status?
let aliceUtxos = JSON.parse(JSON.stringify(aliceUtxosInitial));
let shadowUtxos = [];
let orderUtxos = [];

const onChainUtxos = [...aliceUtxos, ...bobUtxos, ...shadowUtxos, ...orderUtxos];

const depositTo = DEPOSIT_ADDRESS;

const bobDepositAssets = [
	{
		tokenId: HOLDERGDOGE_TEST1,
		amount: 1000 * 10 ** 9
	}
];

function updateBoxes(signedTx) {
	const inputs = signedTx.inputs;
	const outputs = signedTx.outputs;
	//console.log(bobUtxos);
	inputs.forEach((input) => {
		bobUtxos = deleteBox(bobUtxos, input);
		aliceUtxos = deleteBox(aliceUtxos, input);
		shadowUtxos = deleteBox(shadowUtxos, input);
		orderUtxos = deleteBox(orderUtxos, input);
	});
	//console.log("new", bobUtxos);

	// BROKEN...
	outputs.forEach((o) => {
		if (o.ergoTree == ErgoAddress.fromBase58(BOB_ADDRESS).ergoTree) {
			addBox(bobUtxos, o);
		}
		if (o.ergoTree == ErgoAddress.fromBase58(ALICE_ADDRESS).ergoTree) {
			addBox(aliceUtxos, o);
		}
		if (o.ergoTree == ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).ergoTree) {
			addBox(shadowUtxos, o);
		}
		if (o.ergoTree == ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree) {
			addBox(orderUtxos, o);
		}
	});
}

function deleteBox(boxArray, box) {
	//console.log("🚀 ~ deleteBox ~ box:", box);
	let boxFound = boxArray.find((b) => b.boxId == box.boxId);
	if (boxFound) {
		boxArray = boxArray.filter((b) => b.boxId != box.boxId);
	}
	return boxArray;
}
function addBox(boxArray, box, comment?) {
	box.comment = comment;
	boxArray.push(box);
}

async function depositBobAssets() {
	const currentHeight = await fetchHeight();
	const shadowPool = ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS);
	const userPK = ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS);

	const registers = {
		R4: SInt(currentHeight + 10).toHex(),
		R5: SSigmaProp(SGroupElement(first(shadowPool.getPublicKeys()))).toHex(),
		R6: SSigmaProp(SGroupElement(first(userPK.getPublicKeys()))).toHex()
	};
	return addBoxToContract(
		DEPOSIT_ADDRESS,
		BOB_ADDRESS,
		bobUtxos,
		SAFE_MIN_BOX_VALUE,
		bobDepositAssets,
		registers,
		currentHeight
	);
}

function depositBobAssetsSync() {
	const currentHeight = 1255030;
	const bobDepositAssets = [
		{
			tokenId: HOLDERGDOGE_TEST1,
			amount: 1000 * 10 ** 9
		}
	];

	const shadowPool = ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS);
	const userPK = ErgoAddress.fromBase58(BOB_ADDRESS);

	const registers = {
		R4: SInt(currentHeight + 100).toHex(),
		R5: SSigmaProp(SGroupElement(first(shadowPool.getPublicKeys()))).toHex(),
		R6: SSigmaProp(SGroupElement(first(userPK.getPublicKeys()))).toHex()
	};
	return addBoxToContract(
		DEPOSIT_ADDRESS,
		BOB_ADDRESS,
		bobUtxos,
		SAFE_MIN_BOX_VALUE,
		bobDepositAssets,
		registers,
		currentHeight
	);
}

function withdrawBobAllSync(outputs: any) {
	const currentHeight = 1254307;

	const shadowPool = ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS);
	const userPK = ErgoAddress.fromBase58(BOB_ADDRESS);

	const registers = {
		R4: SInt(currentHeight + 10).toHex(),
		R5: SSigmaProp(SGroupElement(first(shadowPool.getPublicKeys()))).toHex(),
		R6: SSigmaProp(SGroupElement(first(userPK.getPublicKeys()))).toHex()
	};

	const tempAssets = outputs.flatMap((o) => o.assets);
	const result = [];
	tempAssets.forEach((a) => {
		const asset = result.find((asset) => asset.tokenId == a.tokenId);
		if (asset) {
			asset.amount = asset.amount + a.amount;
		} else {
			result.push(a);
		}
	});

	//    console.dir(outputs, { depth: null });

	let value = BigInt(outputs.reduce((a, out) => a + out.value, 0) ?? 0);

	if (value < SAFE_MIN_BOX_VALUE) {
		value = SAFE_MIN_BOX_VALUE;
	}

	return addBoxToContract(
		BOB_ADDRESS,
		DEPOSIT_ADDRESS,
		[...outputs, ...bobUtxos],
		value,
		result,
		{},
		currentHeight
	);
}

function depositShadowBobToOrder(outputs: any) {
	const currentHeight = 1254307;

	const shadowPool = ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS); //multisig address
	const orderPK = ErgoAddress.fromBase58(sellOrderAddress); //

	const registers = {
		R4: SInt(currentHeight + 10).toHex(), //tokenId
		R5: SInt(currentHeight + 10).toHex(), // Rate
		R6: SSigmaProp(SGroupElement(first(shadowPool.getPublicKeys()))).toHex() //multisig address
	};

	// val sellTokenId   : Long      = SELF.R4[Long].get
	// val ergTokenRate  : Int       = SELF.R5[Int].get
	// val sellerAddress : SigmaProp = SELF.R6[SigmaProp].get

	// TODO: Change for Multiasset
	const tempAssets = outputs.flatMap((o) => o.assets);
	const result = [];
	tempAssets.forEach((a) => {
		const asset = result.find((asset) => asset.tokenId == a.tokenId);
		if (asset) {
			asset.amount = asset.amount + a.amount;
		} else {
			result.push(a);
		}
	});

	//    console.dir(outputs, { depth: null });

	let value = BigInt(outputs.reduce((a, out) => a + out.value, 0) ?? 0);

	if (value < SAFE_MIN_BOX_VALUE) {
		value = SAFE_MIN_BOX_VALUE;
	}

	return addBoxToContract(
		orderPK,
		shadowPool,
		[...outputs, ...bobUtxos],
		value,
		result,
		{},
		currentHeight
	);
}

//--------------------------------------
const withdrawBoxToContract = (
	contract: ErgoAddress | string,
	sender: ErgoAddress | string,
	utxos: Array<any>,
	registers: { R4?; R5?; R6?; R7?; R8? },
	currentHeight: number
) => {
	const output = new OutputBuilder(SAFE_MIN_BOX_VALUE, contract).setAdditionalRegisters(
		registers
	);

	const unsignedMintTransaction = new TransactionBuilder(currentHeight)
		.from(utxos)
		.to(output)
		.sendChangeTo(sender)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();

	return unsignedMintTransaction;
};

let tx;

describe('deposit funds', async () => {
	it('bob can deposit', () => {
		const expected = depositBobAssetsSync();
		expect(expected.inputs.length).toBe(1);
		expect(expected.outputs.length).toBe(3);
	});

	it('bob can sign, 1 output = 1 input', async () => {
		// TEST BOB - > Shadow - > BOB
		// ---------- Deposit Shadow------------
		const unsignedTx = depositBobAssetsSync();
		const signedTx = (await signTx(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx)).to_js_eip12();

		// const signedTx9 = await prover
		//     .from([BOB_ADDRESS_STATE])
		//     .changeIndex(0)
		//     .signEip12(unsignedTx, blockHeaders);

		// console.dir(signedTx, { depth: null });

		const shadowOutputs = signedTx.outputs.filter(
			(o) => o.ergoTree == ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree
		); // choose box for next step

		const oldBobUtxos = JSON.parse(JSON.stringify(bobUtxos));
		updateBoxes(signedTx);
		expect(bobUtxos).not.toEqual(oldBobUtxos);
		//console.dir(shadowOutputs, { depth: null });

		//function UpdateBoxes(tx)
		//UpdateBob
		//UpdateShadow
		//UpdateOrder

		// ---------- Withdraw Shadow------------
		const unsignedTx2 = withdrawBobAllSync(shadowOutputs);
		//console.dir(unsignedTx2, { depth: null });
		//const signedTx3 = signMultisig(unsignedTx2, enoughToSignBob, enoughToSignAlice);

		// const signedTx2 = await prover
		//     .from([BOB_ADDRESS_STATE])
		//     .changeIndex(0)
		//     .sign(unsignedTx2, blockHeaders);

		// const bobOutputs = signedTx2.outputs.filter(
		//     (o) => o.ergoTree == ErgoAddress.fromBase58(BOB_ADDRESS).ergoTree
		// ); // choose box for next step
		// expect(bobOutputs[0].assets).toEqual(bobDepositAssets);

		// updateBoxes(signedTx2);
		//console.log("🚀 ~ it ~ bobUtxos:", bobUtxos);

		// TEST BOB - > Shadow - > Order
		// ---------- Deposit to Order ------------
		//const unsignedTx2 = withdrawBobAllSync(shadowOutputs);
	});
});

// Bob    --> Shadow (1)
// Shadow --> Bob (2)
// Shadow --> Order (3)
// Order  --> Alice (4)
