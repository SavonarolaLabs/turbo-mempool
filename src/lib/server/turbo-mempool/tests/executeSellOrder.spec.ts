import { describe, expect, it } from 'vitest';
import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	DEPOSIT_ADDRESS,
	SELL_ORDER_ADDRESS,
	SHADOWPOOL_ADDRESS
} from '$lib/server/constants/addresses';
import { utxos } from '$lib/server/utxo/unspent';
import {
	first
} from '@fleet-sdk/common';
import {
	BOX_VALUE_PER_BYTE,
	ErgoAddress,
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	SByte,
	SColl,
	SGroupElement,
	SInt,
	SLong,
	SSigmaProp,
	TransactionBuilder
} from '@fleet-sdk/core';
import {
	signTxByAddress,
	signTxAllInputs,
	signTxInput,
	txHasErrors,
	submitTx
} from '$lib/server/multisig/multisig';
import {
	ALICE_MNEMONIC,
	BOB_MNEMONIC,
	SHADOW_MNEMONIC
} from '$lib/server/constants/mnemonics';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { fetchHeight } from '../utils/fetchHeight';
import { createSellOrderTx } from '../utils/sell';

const price = 1000n;
const tokenForSale = {
	tokenId: '69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
	amount: '100'
};
let height = 1_260_252; // await fetchHeight()
let unlockHeight = 1_260_258;

let sellContractUtxo = [
	{
		boxId: 'e0d2f8c5412008f914fd4eeb32581046b748b90c21df0f8a88f78f188d5470e0',
		transactionId:
			'5fe38258ee0d7644a9f960c8a47e43d6509f1498f38ccfb98e1d77b3a14a4539',
		blockId:
			'240f5767c4019c80e26c9bf47198cf626afb7a8d65f68b856a59472da9f79419',
		value: '3200000',
		index: 0,
		globalIndex: 5469114,
		creationHeight: 1260252,
		settlementHeight: 1260700,
		ergoTree:
			'100f010004000402040004000500040005000500040005000400050005000400d817d601d9010163e4c672010504d602da720101a7d603d17300d60483020872037203d605d9010563b2e5c6720504147204730100d606da720501a7d607d9010763b2e5c6720704147204730200d608d901086393c27208c2a7d609d9010963e5c67209060e830002d60ada720901a7d60bd9010b63eded93720ada720901720b91b1db6308720b730393720a8cb2db6308720b73040001d60cd9010c63e4c6720c080ed60dda720c01a7d60ed9010e6393720dda720c01720ed60fd9010f63ededda720801720fda720b01720fda720e01720fd610dad901100c63b0b57210720f7305d9011241639a8c7212018cb2db63088c7212027306000201a4d611d9011163ed937206da720501721193da720701a7da7207017211d612d9011263937202da7201017212d613d9011363e4c672130705d614b5a4720fd615b072147307d901154163d802d6178c721501d618da7213018c72150295917217721872177218d616dad901160c63b0b57216d9011863edededededda7211017218da7212017218da720b017218937215da7213017218da720e017218da72080172187308d9011841639a8c7218018cb2db63088c7218027309000201a5d61799721072169591a372027206d801d618da720701a7eb02ea0272067218ea02d1ed909c72179d999c72109db07214730ad901194163d801d61b8c7219029a8c7219019cda721301721bdad9011c638cb2db6308721c730b000201721b72109c721672157217b0b5a5d9011963edededda7211017219da721201721993720ada720901721993720dc27219730cd9011941639a8c721901c18c72190291dad901190c63b0b5b57219720fd9011b6393da721301721b7215730dd9011b41639a8c721b018cb2db63088c721b02730e000201a472167218',
		ergoTreeConstants:
			'0: false\n1: 0\n2: 1\n3: 0\n4: 0\n5: 0\n6: 0\n7: 0\n8: 0\n9: 0\n10: 0\n11: 0\n12: 0\n13: 0\n14: 0',
		ergoTreeScript:
			'{\n  val func1 = {(box1: Box) => box1.R5[Int].get }\n  val i2 = func1(SELF)\n  val prop3 = sigmaProp(placeholder[Boolean](0))\n  val coll4 = Coll[SigmaProp](prop3, prop3)\n  val func5 = {(box5: Box) => box5.R4[Coll[SigmaProp]].getOrElse(coll4)(placeholder[Int](1)) }\n  val prop6 = func5(SELF)\n  val func7 = {(box7: Box) => box7.R4[Coll[SigmaProp]].getOrElse(coll4)(placeholder[Int](2)) }\n  val func8 = {(box8: Box) => box8.propositionBytes == SELF.propositionBytes }\n  val func9 = {(box9: Box) => box9.R6[Coll[Byte]].getOrElse(Coll[Byte]()) }\n  val coll10 = func9(SELF)\n  val func11 = {(box11: Box) => ((coll10 == func9(box11)) && (box11.tokens.size > placeholder[Int](3))) && (coll10 == box11.tokens(placeholder[Int](4))._1) }\n  val func12 = {(box12: Box) => box12.R8[Coll[Byte]].get }\n  val coll13 = func12(SELF)\n  val func14 = {(box14: Box) => coll13 == func12(box14) }\n  val func15 = {(box15: Box) => (func8(box15) && func11(box15)) && func14(box15) }\n  val l16 = {(coll16: Coll[Box]) =>\n    coll16.filter(func15).fold(placeholder[Long](5), {(tuple18: (Long, Box)) => tuple18._1 + tuple18._2.tokens(placeholder[Int](6))._2 })\n  }(INPUTS)\n  val func17 = {(box17: Box) => (prop6 == func5(box17)) && (func7(SELF) == func7(box17)) }\n  val func18 = {(box18: Box) => i2 == func1(box18) }\n  val func19 = {(box19: Box) => box19.R7[Long].get }\n  val coll20 = INPUTS.filter(func15)\n  val l21 = coll20.fold(placeholder[Long](7), {(tuple21: (Long, Box)) =>\n      val l23 = tuple21._1\n      val l24 = func19(tuple21._2)\n      if (l23 > l24) { l23 } else { l24 }\n    })\n  val l22 = {(coll22: Coll[Box]) =>\n    coll22.filter({(box24: Box) => ((((func17(box24) && func18(box24)) && func11(box24)) && (l21 == func19(box24))) && func14(box24)) && func8(box24) }).fold(\n      placeholder[Long](8), {(tuple24: (Long, Box)) => tuple24._1 + tuple24._2.tokens(placeholder[Int](9))._2 }\n    )\n  }(OUTPUTS)\n  val l23 = l16 - l22\n  if (HEIGHT > i2) { prop6 } else {(\n    val prop24 = func7(SELF)\n    prop6 && prop24 || sigmaProp((l23 * l16 * coll20.fold(placeholder[Long](10), {(tuple25: (Long, Box)) =>\n            val box27 = tuple25._2\n            tuple25._1 + func19(box27) * {(box28: Box) => box28.tokens(placeholder[Int](11))._2 }(box27)\n          }) / l16 - l22 * l21 / l23 <= OUTPUTS.filter({(box25: Box) => ((func17(box25) && func18(box25)) && (coll10 == func9(box25))) && (coll13 == box25.propositionBytes) }).fold(placeholder[Long](12), {(tuple25: (Long, Box)) => tuple25._1 + tuple25._2.value })) && ({(coll25: Coll[Box]) => coll25.filter(func15).filter({(box27: Box) => func19(box27) == l21 }).fold(placeholder[Long](13), {(tuple27: (Long, Box)) => tuple27._1 + tuple27._2.tokens(placeholder[Int](14))._2 }) }(INPUTS) > l22)) && prop24\n  )}\n}',
		address:
			'4YBYFsTyF7ruQvuVdMbyQD69fXYFyEQwUytbb7cfL9qywcV5FpRWUDic9UBtdJxaqLTEQbcAiM3mhp2pHLaLMirSACX1QoNUmxQZ37F1CZFQfS9Bk4CA2u2ePRU5ErPvWVu5QWMfdp11eo1E9CBmE9dyNNNZZSkBqdhXmoNXWjyTcKG9QHFNQ58DYZYEMnjssT8Z2uohseruTTW2N4V5eGW6D4KwM8Ji187vNTo99LpnbMCxehG1NQ5mfTWQzAdGHMcsQRYEkd6wQyM8jCNTkoTwNGBXxjthBZEGAvZBZaDSGZzA4hAZLZruahG7vSinw6jy7BBFFnh746rkc5YSs26YKMovBPWuB67ksW4QDBLcxbMdRYNr9U2rzfyRx6sCasD9jbQL8mAM56MmgWcEPdZj6Eiyxk89V9qixHdsizn8Ar5CxsTLeD45YCs2PkQ7gysHbnEDrgTzYTaoK5cB2inCMuYKKeWSXwjBQhB6iLYTUXRH7v39rij3e1wFuWbdnEzt3DQ45FY7TJRkMt5RUMYRNaiyUuJ261eDEmWQZYwqw97r15BEkxgkQdECmiELe97dDQKv1ZW4wmtDpLpWuhbVm7oPpPEA6vfynZZzcd2v5gqwyQdZc7sdEYdXKFwjXCpzHTfFo5Tei48H7wmYanx2Rr67PucAj3AunC7BAR3J7p8wqzs6qcn8wDidZxA2ZVK4LoUKVTiBU5zbudnxipcVCh4Y2J4jiANkKTLh2NfkCpkd4gzx9LyGBjYWJ2reNTFaBoY8fL4Myj1dSWmiuE31T8dzEYcEbDsXyiU1qBEbKXzMvfPsMNKvQX3ANJwXdZqk6gn7rKqa1tDxuk4n5i9Fg2GGaZG3R3KQeQR8o32y3j6aGhoE2wgDT2dsqSPWzhjXrNPcTDXHePVVQE1FwdunSnnVkEn7FkZZEXxkCGhcQxhuGx',
		assets: [
			{
				tokenId:
					'69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
				index: 0,
				amount: '100',
				name: 'HoldErgDoge Test1',
				decimals: 9,
				type: 'EIP-004'
			}
		],
		additionalRegisters: {
			R5: '04f8a39c01',
			R6: '0e2069feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
			R8: '0e1e1000d801d601e4c6a705089591a3e4c6a704047201ea027201e4c6a70608',
			R7: '05c801',
			R4: '1402cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2ccd025d163103d491a5193c7b18182442877ce8fcf3ffb9ae9c295d9c98a16dcb0551'
		},
		spentTransactionId: null,
		mainChain: true
	}
];

// not this box: a340b2d618ddf2a6d62ed0f68040be004c701eaf25836a129a5c6b1c19d5ada4

describe(`Bob sellOrder: height:${height}, unlock +10`, () => {
	it.skip('100/100 sigmaProp(orderFilled) && getPoolPk(SELF)', async () => {
		const sellerPK = BOB_ADDRESS;
		const output = new OutputBuilder(
			price * BigInt(tokenForSale.amount) * 1000n,
			DEPOSIT_ADDRESS
		).setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(
					first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())
				),
				SGroupElement(
					first(
						ErgoAddress.fromBase58(
							SHADOWPOOL_ADDRESS
						).getPublicKeys()
					)
				)
			]).toHex(),
			R5: SInt(unlockHeight).toHex(),
			R6: SColl(SByte, tokenForSale.tokenId).toHex()
		});

		const unsignedTx = new TransactionBuilder(height)
			.configureSelector((selector) =>
				selector.ensureInclusion([sellContractUtxo[0].boxId])
			)
			.from([...sellContractUtxo, ...utxos[ALICE_ADDRESS]])
			.to(output)
			.sendChangeTo(sellerPK)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		//console.dir(unsignedTx, { depth: null });

		expect(unsignedTx.inputs.length).toBe(2);
		expect(unsignedTx.inputs[0].ergoTree).toBe(
			ErgoAddress.fromBase58(SELL_ORDER_ADDRESS).ergoTree
		);

		const shadowIndex = unsignedTx.inputs.findIndex((b) =>
			sellContractUtxo.map((b) => b.boxId).includes(b.boxId)
		);
		expect(shadowIndex).toBe(0);
		const signedShadowInput = await signTxInput(
			SHADOW_MNEMONIC,
			unsignedTx,
			shadowIndex
		);
		const shadowInputProof = JSON.parse(
			signedShadowInput.spending_proof().to_json()
		);
		expect(shadowInputProof.proofBytes.length).greaterThan(10);

		const aliceIndex = unsignedTx.inputs.findIndex((b) =>
			utxos[ALICE_ADDRESS].map((b) => b.boxId).includes(b.boxId)
		);
		expect(aliceIndex).toBe(1);
		expect(unsignedTx.inputs[aliceIndex].ergoTree).toBe(
			ErgoAddress.fromBase58(ALICE_ADDRESS).ergoTree
		);
		const signedAliceInput = await signTxInput(
			ALICE_MNEMONIC,
			unsignedTx,
			aliceIndex
		);
		const aliceInputProof = JSON.parse(
			signedAliceInput.spending_proof().to_json()
		);
		expect(aliceInputProof.proofBytes.length).greaterThan(10);

		const txId = wasm.UnsignedTransaction.from_json(
			JSON.stringify(unsignedTx)
		)
			.id()
			.to_str();

		unsignedTx.inputs[shadowIndex] = {
			boxId: unsignedTx.inputs[shadowIndex].boxId,
			spendingProof: shadowInputProof
		};
		unsignedTx.inputs[aliceIndex] = {
			boxId: unsignedTx.inputs[aliceIndex].boxId,
			spendingProof: aliceInputProof
		};
		unsignedTx.id = txId;
	});

	it.skip('50/100 sigmaProp(orderFilled) && getPoolPk(SELF)', async () => {
		const sellerPK = BOB_ADDRESS;
		const buyerPK = ALICE_ADDRESS; //Deposit Address
		let payment = 50n * price;
		// TODO: Decode price from R7
		const output = new OutputBuilder(
			payment, //50n * price, //<minValuePerByte * outputSize> nanoErgs
			DEPOSIT_ADDRESS
		).setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(
					first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())
				),
				SGroupElement(
					first(
						ErgoAddress.fromBase58(
							SHADOWPOOL_ADDRESS
						).getPublicKeys()
					)
				)
			]).toHex(),
			R5: sellContractUtxo[0].additionalRegisters.R5, //<----
			R6: SColl(SByte, tokenForSale.tokenId).toHex()
		});

		// TODO:Check MinValue
		const size = BigInt(output.setCreationHeight(height).estimateSize());
		const minValue = size * BOX_VALUE_PER_BYTE;
		payment = payment > minValue ? payment : minValue;
		output.setValue(payment);

		const tempBox = JSON.parse(JSON.stringify(sellContractUtxo[0]));

		const outputSellOrder = new OutputBuilder(
			BigInt(tempBox.value), // //BOX (3200000) -> BOX (3200000) // - 100n
			SELL_ORDER_ADDRESS
		)
			.setAdditionalRegisters(tempBox.additionalRegisters)
			.addTokens({ tokenId: tokenForSale.tokenId, amount: 50n });

		const unsignedTx = new TransactionBuilder(height)
			.configureSelector((selector) =>
				selector.ensureInclusion([sellContractUtxo[0].boxId])
			)
			.from([...sellContractUtxo, ...utxos[buyerPK]])
			.to([output, outputSellOrder])
			.sendChangeTo(buyerPK) // TODO: addRegisters R4/R5/R6? Deposit Address
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		expect(unsignedTx.inputs.length).toBe(2);
		expect(unsignedTx.inputs[0].ergoTree).toBe(
			ErgoAddress.fromBase58(SELL_ORDER_ADDRESS).ergoTree
		);

		const shadowIndex = unsignedTx.inputs.findIndex((b) =>
			sellContractUtxo.map((b) => b.boxId).includes(b.boxId)
		);
		expect(shadowIndex).toBe(0);

		const signedShadowInput = await signTxInput(
			SHADOW_MNEMONIC,
			unsignedTx,
			shadowIndex
		);

		const shadowInputProof = JSON.parse(
			signedShadowInput.spending_proof().to_json()
		);
		expect(shadowInputProof.proofBytes.length).greaterThan(10);

		const aliceIndex = unsignedTx.inputs.findIndex((b) =>
			utxos[ALICE_ADDRESS].map((b) => b.boxId).includes(b.boxId)
		);
		expect(aliceIndex).toBe(1);
		expect(unsignedTx.inputs[aliceIndex].ergoTree).toBe(
			ErgoAddress.fromBase58(ALICE_ADDRESS).ergoTree
		);
		const signedAliceInput = await signTxInput(
			ALICE_MNEMONIC,
			unsignedTx,
			aliceIndex
		);
		const aliceInputProof = JSON.parse(
			signedAliceInput.spending_proof().to_json()
		);
		expect(aliceInputProof.proofBytes.length).greaterThan(10);

		console.dir(unsignedTx, { depth: null });

		const txId = wasm.UnsignedTransaction.from_json(
			JSON.stringify(unsignedTx)
		)
			.id()
			.to_str();

		unsignedTx.inputs[shadowIndex] = {
			boxId: unsignedTx.inputs[shadowIndex].boxId,
			spendingProof: shadowInputProof
		};
		unsignedTx.inputs[aliceIndex] = {
			boxId: unsignedTx.inputs[aliceIndex].boxId,
			spendingProof: aliceInputProof
		};

		unsignedTx.id = txId;
	});

	it.skip('NEW CONTRACT 100 000 sigmaProp(orderFilled) && getPoolPk(SELF)', async () => {
		unlockHeight = height + 20000;
		const unsignedTx_prev = createSellOrderTx(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxos[BOB_ADDRESS],
			tokenForSale,
			price,
			height,
			unlockHeight
		);

		const signedTx_prev = await signTxByAddress(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsignedTx_prev
		);
		const sellContractUtxo = [signedTx_prev.outputs[0]];

		const sellerPK = BOB_ADDRESS;
		const buyerPK = ALICE_ADDRESS; //Deposit Address
		const buyPart = 50n;
		const buyDenom = 100n;
		let payment = 50n * price;
		// TODO: Decode price from R7
		let steal = 0n;
		console.log('payment', payment);
		console.log('steal  ', steal);
		payment = payment - steal;
		const output = new OutputBuilder(
			payment, //50n * price, //<minValuePerByte * outputSize> nanoErgs
			DEPOSIT_ADDRESS
		).setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(
					first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())
				),
				SGroupElement(
					first(
						ErgoAddress.fromBase58(
							SHADOWPOOL_ADDRESS
						).getPublicKeys()
					)
				)
			]).toHex(),
			R5: sellContractUtxo[0].additionalRegisters.R5, //<----
			R6: SColl(SByte, tokenForSale.tokenId).toHex()
		});
		//console.log(output.additionalRegisters.R6)

		expect(output.additionalRegisters.R5).toBe(SInt(unlockHeight).toHex());

		// TODO:Check MinValue
		const size = BigInt(output.setCreationHeight(height).estimateSize());
		const minValue = size * BOX_VALUE_PER_BYTE;
		payment = payment > minValue ? payment : minValue;
		output.setValue(payment);

		const tempBox = JSON.parse(JSON.stringify(sellContractUtxo[0]));

		const outputSellOrder = new OutputBuilder(
			BigInt(tempBox.value), // //BOX (3200000) -> BOX (3200000) // - 100n
			SELL_ORDER_ADDRESS
		)
			.setAdditionalRegisters(tempBox.additionalRegisters)
			.addTokens({ tokenId: tokenForSale.tokenId, amount: 50n });

		const unsignedTx = new TransactionBuilder(height)
			.configureSelector((selector) =>
				selector.ensureInclusion([sellContractUtxo[0].boxId])
			)
			.from([...sellContractUtxo, ...utxos[buyerPK]])
			.to([output, outputSellOrder])
			.sendChangeTo(buyerPK) // TODO: addRegisters R4/R5/R6? Deposit Address
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		expect(unsignedTx.inputs.length).toBe(2);
		expect(unsignedTx.inputs[0].ergoTree).toBe(
			ErgoAddress.fromBase58(SELL_ORDER_ADDRESS).ergoTree
		);

		const shadowIndex = unsignedTx.inputs.findIndex((b) =>
			sellContractUtxo.map((b) => b.boxId).includes(b.boxId)
		);
		expect(shadowIndex).toBe(0);

		const signedShadowInput = await signTxInput(
			SHADOW_MNEMONIC,
			unsignedTx,
			shadowIndex
		);

		const shadowInputProof = JSON.parse(
			signedShadowInput.spending_proof().to_json()
		);
		expect(shadowInputProof.proofBytes.length).greaterThan(10);

		const aliceIndex = unsignedTx.inputs.findIndex((b) =>
			utxos[ALICE_ADDRESS].map((b) => b.boxId).includes(b.boxId)
		);
		expect(aliceIndex).toBe(1);
		expect(unsignedTx.inputs[aliceIndex].ergoTree).toBe(
			ErgoAddress.fromBase58(ALICE_ADDRESS).ergoTree
		);
		const signedAliceInput = await signTxInput(
			ALICE_MNEMONIC,
			unsignedTx,
			aliceIndex
		);
		const aliceInputProof = JSON.parse(
			signedAliceInput.spending_proof().to_json()
		);
		expect(aliceInputProof.proofBytes.length).greaterThan(10);

		console.dir(unsignedTx, { depth: null });

		const txId = wasm.UnsignedTransaction.from_json(
			JSON.stringify(unsignedTx)
		)
			.id()
			.to_str();

		unsignedTx.inputs[shadowIndex] = {
			boxId: unsignedTx.inputs[shadowIndex].boxId,
			spendingProof: shadowInputProof
		};
		unsignedTx.inputs[aliceIndex] = {
			boxId: unsignedTx.inputs[aliceIndex].boxId,
			spendingProof: aliceInputProof
		};

		unsignedTx.id = txId;
	});

	it.skip('alice can buy with Shadow Signed - 100/100 tokens', async () => {
		const sellerPK = BOB_ADDRESS;
		const output = new OutputBuilder(
			price * BigInt(tokenForSale.amount), //SAFE_MIN_BOX_VALUE
			DEPOSIT_ADDRESS
		).setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(
					first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())
				),
				SGroupElement(
					first(
						ErgoAddress.fromBase58(
							SHADOWPOOL_ADDRESS
						).getPublicKeys()
					)
				)
			]).toHex(),
			R5: SInt(unlockHeight).toHex(),
			R6: SColl(SByte, tokenForSale.tokenId).toHex()
		});

		const unsignedTx = new TransactionBuilder(height)
			.configureSelector((selector) =>
				selector.ensureInclusion([sellContractUtxo[0].boxId])
			)
			.from([...sellContractUtxo])
			.to(output)
			.sendChangeTo(sellerPK)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		expect(unsignedTx.inputs.length).toBe(1);
		expect(unsignedTx.inputs[0].ergoTree).toBe(
			ErgoAddress.fromBase58(SELL_ORDER_ADDRESS).ergoTree
		);

		const signedTx = await signTxAllInputs(SHADOW_MNEMONIC, unsignedTx);

		expect(signedTx.inputs.length).toBeDefined();
	});

	it.skip('alice CANT buy WITHOUT Shadow - 100/100 tokens', async () => {
		const sellerPK = BOB_ADDRESS;
		const output = new OutputBuilder(
			price * BigInt(tokenForSale.amount),
			DEPOSIT_ADDRESS
		).setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(
					first(ErgoAddress.fromBase58(sellerPK).getPublicKeys())
				),
				SGroupElement(
					first(
						ErgoAddress.fromBase58(
							SHADOWPOOL_ADDRESS
						).getPublicKeys()
					)
				)
			]).toHex(),
			R5: SInt(unlockHeight).toHex(),
			R6: SColl(SByte, tokenForSale.tokenId).toHex()
		});

		const unsignedTx = new TransactionBuilder(height)
			.configureSelector((selector) =>
				selector.ensureInclusion([sellContractUtxo[0].boxId])
			)
			.from([...sellContractUtxo])
			.to(output)
			.sendChangeTo(sellerPK)
			.payFee(RECOMMENDED_MIN_FEE_VALUE)
			.build()
			.toEIP12Object();

		//console.dir(unsignedTx, { depth: null });

		expect(unsignedTx.inputs.length).toBe(1);
		expect(unsignedTx.inputs[0].ergoTree).toBe(
			ErgoAddress.fromBase58(SELL_ORDER_ADDRESS).ergoTree
		);

		expect(
			signTxAllInputs(BOB_MNEMONIC, unsignedTx)
		).rejects.toThrowError();
	});

	it.skip('SUBMIT TX: bob sell order', async () => {
		unlockHeight = height + 20000;
		const unsignedTx = createSellOrderTx(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxos[BOB_ADDRESS],
			tokenForSale,
			price,
			height,
			unlockHeight
		);
		const signedTx = await signTxByAddress(
			BOB_MNEMONIC,
			BOB_ADDRESS,
			unsignedTx
		);
		sellContractUtxo = [signedTx.outputs[0]];
		const txId = await submitTx(signedTx);
		expect(txId).toBeTruthy();
		console.log('txId', txId);
	});
});
