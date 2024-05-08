import { beforeAll, describe, expect, it } from 'vitest';
import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	DEPOSIT_ADDRESS,
	SELL_ORDER_ADDRESS,
	SHADOWPOOL_ADDRESS
} from '$lib/server/constants/addresses';
import { utxos } from '$lib/server/utxo/unspent';
import {
	first,
	type Amount,
	type Box,
	type EIP12UnsignedTransaction,
	type OneOrMore
} from '@fleet-sdk/common';
import {
	ErgoAddress,
	ErgoTree,
	OutputBuilder,
	RECOMMENDED_MIN_FEE_VALUE,
	SAFE_MIN_BOX_VALUE,
	SByte,
	SColl,
	SGroupElement,
	SInt,
	SSigmaProp,
	TransactionBuilder
} from '@fleet-sdk/core';
import {
	signMultisig,
	signTxByAddress,
	signTxAllInputs,
	signTxByInputs,
	signTxInput,
	txHasErrors,
	submitTx
} from '$lib/server/multisig/multisig';
import {
	ALICE_MNEMONIC,
	BOB_MNEMONIC,
	SHADOW_MNEMONIC
} from '$lib/server/constants/mnemonics';
import { createSellOrderTx } from './sell';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { fetchHeight } from '../fetchHeight';


const price = 100n;
const tokenForSale = {
	tokenId: '69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
	amount: '100'
};
let height = 1_260_252; // await fetchHeight()
let unlockHeight = 1_260_258;


let sellContractUtxo = [{
	boxId: "bf042d09ceaf3cc303f6a898a568261cb439b34d346a7f6b091e1353440c2ac2",
	transactionId: "fd323564bacbe705e2505738e9c3cd26784ce06c4f0b403f4bb0f2197c4311f6",
	value: "3200000",
	index: 0,
	globalIndex: 5453329,
	creationHeight: 1260248,
	settlementHeight: 1260250,
	ergoTree: "100f010004000402040004000500040005000500040005000400050005000400d817d601d9010163e4c672010504d602da720101a7d603d17300d60483020872037203d605d9010563b2e5c6720504147204730100d606da720501a7d607d9010763b2e5c6720704147204730200d608d901086393c27208c2a7d609d9010963e5c67209060e830002d60ada720901a7d60bd9010b63eded93720ada720901720b91b1db6308720b730393720a8cb2db6308720b73040001d60cd9010c63e4c6720c080ed60dda720c01a7d60ed9010e6393720dda720c01720ed60fd9010f63ededda720801720fda720b01720fda720e01720fd610dad901100c63b0b57210720f7305d9011241639a8c7212018cb2db63088c7212027306000201a4d611d9011163ed937206da720501721193da720701a7da7207017211d612d9011263937202da7201017212d613d9011363e4c672130705d614b5a4720fd615b072147307d901154163d802d6178c721501d618da7213018c72150295917217721872177218d616dad901160c63b0b57216d9011863edededededda7211017218da7212017218da720b017218937215da7213017218da720e017218da72080172187308d9011841639a8c7218018cb2db63088c7218027309000201a5d61799721072169591a372027206d801d618da720701a7eb02ea0272067218ea02d1ed909c72179d999c72109db07214730ad901194163d801d61b8c7219029a8c7219019cda721301721bdad9011c638cb2db6308721c730b000201721b72109c721672157217b0b5a5d9011963edededda7211017219da721201721993720ada720901721993720dc27219730cd9011941639a8c721901c18c72190291dad901190c63b0b5b57219720fd9011b6393da721301721b7215730dd9011b41639a8c721b018cb2db63088c721b02730e000201a472167218",
	address: "4YBYFsTyF7ruQvuVdMbyQD69fXYFyEQwUytbb7cfL9qywcV5FpRWUDic9UBtdJxaqLTEQbcAiM3mhp2pHLaLMirSACX1QoNUmxQZ37F1CZFQfS9Bk4CA2u2ePRU5ErPvWVu5QWMfdp11eo1E9CBmE9dyNNNZZSkBqdhXmoNXWjyTcKG9QHFNQ58DYZYEMnjssT8Z2uohseruTTW2N4V5eGW6D4KwM8Ji187vNTo99LpnbMCxehG1NQ5mfTWQzAdGHMcsQRYEkd6wQyM8jCNTkoTwNGBXxjthBZEGAvZBZaDSGZzA4hAZLZruahG7vSinw6jy7BBFFnh746rkc5YSs26YKMovBPWuB67ksW4QDBLcxbMdRYNr9U2rzfyRx6sCasD9jbQL8mAM56MmgWcEPdZj6Eiyxk89V9qixHdsizn8Ar5CxsTLeD45YCs2PkQ7gysHbnEDrgTzYTaoK5cB2inCMuYKKeWSXwjBQhB6iLYTUXRH7v39rij3e1wFuWbdnEzt3DQ45FY7TJRkMt5RUMYRNaiyUuJ261eDEmWQZYwqw97r15BEkxgkQdECmiELe97dDQKv1ZW4wmtDpLpWuhbVm7oPpPEA6vfynZZzcd2v5gqwyQdZc7sdEYdXKFwjXCpzHTfFo5Tei48H7wmYanx2Rr67PucAj3AunC7BAR3J7p8wqzs6qcn8wDidZxA2ZVK4LoUKVTiBU5zbudnxipcVCh4Y2J4jiANkKTLh2NfkCpkd4gzx9LyGBjYWJ2reNTFaBoY8fL4Myj1dSWmiuE31T8dzEYcEbDsXyiU1qBEbKXzMvfPsMNKvQX3ANJwXdZqk6gn7rKqa1tDxuk4n5i9Fg2GGaZG3R3KQeQR8o32y3j6aGhoE2wgDT2dsqSPWzhjXrNPcTDXHePVVQE1FwdunSnnVkEn7FkZZEXxkCGhcQxhuGx",
	assets: [
	  {
		tokenId: "69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8",
		amount: "100",
	  }
	],
	additionalRegisters: {
	  R5: "04c4eb9901",
	  R6: "0e2069feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8",
	  R8: "0e1e1000d801d601e4c6a705089591a3e4c6a704047201ea027201e4c6a70608",
	  R7: "05c801",
	  R4: "1402cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2ccd025d163103d491a5193c7b18182442877ce8fcf3ffb9ae9c295d9c98a16dcb0551"
	},
	spentTransactionId: null,
	mainChain: true
  }]

// not this box: a340b2d618ddf2a6d62ed0f68040be004c701eaf25836a129a5c6b1c19d5ada4

describe(`Bob sellOrder: height:${height}, unlock +10`, () => {

	it('sigmaProp(orderFilled) && getPoolPk(SELF)', async () => {
		const sellerPK = BOB_ADDRESS;
		const output = new OutputBuilder(
			price * BigInt(tokenForSale.amount)*1000n,
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

		const shadowIndex = unsignedTx.inputs.findIndex(b => sellContractUtxo.map(b=>b.boxId).includes(b.boxId))
		expect(shadowIndex).toBe(0)
		const signedShadowInput = await signTxInput(
			SHADOW_MNEMONIC,
			unsignedTx,
			shadowIndex
		);
		const shadowInputProof = JSON.parse(signedShadowInput.spending_proof().to_json());
		expect(shadowInputProof.proofBytes.length).greaterThan(10);

		const aliceIndex = unsignedTx.inputs.findIndex(b => utxos[ALICE_ADDRESS].map(b=>b.boxId).includes(b.boxId))
		expect(aliceIndex).toBe(1)
		expect(unsignedTx.inputs[aliceIndex].ergoTree).toBe(ErgoAddress.fromBase58(ALICE_ADDRESS).ergoTree)
		const signedAliceInput = await signTxInput(
			ALICE_MNEMONIC,
			unsignedTx,
			aliceIndex
		);
		const aliceInputProof = JSON.parse(signedAliceInput.spending_proof().to_json());
		expect(aliceInputProof.proofBytes.length).greaterThan(10);

		const txId = wasm.UnsignedTransaction.from_json(JSON.stringify(unsignedTx)).id().to_str();

		unsignedTx.inputs[shadowIndex] = {
			boxId: unsignedTx.inputs[shadowIndex].boxId,
			spendingProof: shadowInputProof
		}
		unsignedTx.inputs[aliceIndex] = {
			boxId: unsignedTx.inputs[aliceIndex].boxId,
			spendingProof: aliceInputProof
		}
		unsignedTx.id = txId;

		const hasError = await txHasErrors(unsignedTx);
		expect(hasError).toBeFalsy();
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

		const signedTx = await signTxAllInputs(
			SHADOW_MNEMONIC,
			unsignedTx
		);

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

	it.skip('SUBMIT TX: bob sell order', async()=>{
		unlockHeight = height + 10;
		const unsignedTx = createSellOrderTx(
			BOB_ADDRESS,
			DEPOSIT_ADDRESS,
			utxos[BOB_ADDRESS],
			tokenForSale,
			price,
			height,
			unlockHeight
		);
		const signedTx = await signTxByAddress(BOB_MNEMONIC, BOB_ADDRESS, unsignedTx);
		sellContractUtxo = [signedTx.outputs[0]];
		const txId = await submitTx(signedTx)
		expect(txId).toBeTruthy();
		console.log("txId", txId)
	})
});
