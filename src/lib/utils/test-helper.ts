import type { Box, SignedTransaction } from "@fleet-sdk/common";
import { ErgoAddress } from "@fleet-sdk/core";

export function boxAtAddress(
	tx: SignedTransaction,
	address: string
): Box {
	return tx.outputs.find(
		(o) => o.ergoTree == ErgoAddress.fromBase58(address).ergoTree
	)!;
}

export function boxesAtAddress(
	tx: SignedTransaction,
	address: string
): Box[] {
	return tx.outputs.filter(
		(o) => o.ergoTree == ErgoAddress.fromBase58(address).ergoTree
	);
}
