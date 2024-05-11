import type { Box, SignedTransaction } from "@fleet-sdk/common";
import { ErgoAddress } from "@fleet-sdk/core";

export function boxAtAddress(
	depositTx: SignedTransaction,
	address: string
): Box {
	return depositTx.outputs.find(
		(o) => o.ergoTree == ErgoAddress.fromBase58(address).ergoTree
	)!;
}

export function boxesAtAddress(
	depositTx: SignedTransaction,
	address: string
): Box[] {
	return depositTx.outputs.filter(
		(o) => o.ergoTree == ErgoAddress.fromBase58(address).ergoTree
	)!;
}
