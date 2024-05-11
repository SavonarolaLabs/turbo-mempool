import { DEPOSIT_ADDRESS } from '$lib/server/constants/addresses';
import type {
	Amount,
	Box,
	SignedTransaction,
	TokenAmount
} from '@fleet-sdk/common';
import { ErgoAddress } from '@fleet-sdk/core';

export function asBigInt(v: bigint | string) {
	if (typeof v == 'string') {
		return BigInt(v);
	} else {
		return v;
	}
}

export function sumNanoErg(boxes: Box<Amount>[]): bigint {
	return boxes.reduce(
		(a: bigint, b: Box<Amount>) => asBigInt(a) + asBigInt(b.value),
		0n
	);
}

export function calcTokenChange(
	utxosIn: Box[],
	tokensOut: TokenAmount<Amount>
): TokenAmount<Amount>[] {
	let inputCopy: Box[] = JSON.parse(JSON.stringify(utxosIn));
	const inputTokens = inputCopy
		.flatMap((box) => box.assets)
		.reduce(_sumAssets, []);
	return _subtractAssets(inputTokens, [tokensOut]);
}
function _sumAssets(acc: TokenAmount<Amount>[], asset: TokenAmount<Amount>) {
	const token = acc.find((t) => t.tokenId == asset.tokenId);
	if (token) {
		token.amount = asBigInt(token.amount) + asBigInt(asset.amount);
	} else {
		acc.push(asset);
	}
	return acc;
}
function _subtractAssets(a: TokenAmount<Amount>[], b: TokenAmount<Amount>[]) {
	b.forEach((bToken) => {
		const aToken = a.find((token) => token.tokenId == bToken.tokenId);
		if (aToken) {
			aToken.amount = asBigInt(aToken.amount) - asBigInt(bToken.amount);
		}
	});
	return a.filter((token) => asBigInt(token.amount) > 0n);
}