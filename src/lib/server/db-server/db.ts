import { type Box, type EIP12UnsignedTransaction } from '@fleet-sdk/common';
import {
	ContractType,
	type BoxParameters,
	type BoxRow,
} from './boxRow';
import type { TxRow } from './txRow';
import { ErgoAddress, ErgoTree } from '@fleet-sdk/core';
import {
	BUY_ORDER_ADDRESS,
	DEPOSIT_ADDRESS,
	SELL_ORDER_ADDRESS
} from '../constants/addresses';
import { parse } from '@fleet-sdk/serializer';

interface HasId {
	id: number;
}

export type BoxDB = {
	boxRows: BoxRow[];
	txes: TxRow[];
};

export function initDb(): BoxDB {
	return {
		boxRows: [],
		txes: []
	};
}

function nextId(table: HasId[]) {
	const maxId = Math.max(...table.map((row) => row.id));
	return maxId + 1;
}

export function db_addBox(db: BoxDB, box: Box) {
	const newRow: BoxRow = {
		id: nextId(db.boxRows),
		contract: contractTypeFromErgoTree(box),
		box,
		unspent: true
	};
	db.boxRows.push(newRow);
}

export function db_addBoxes(db: BoxDB, boxRows: Box[]) {
	boxRows.forEach((box) => db_addBox(db, box));
}

export function db_addTx(db: BoxDB, tx: EIP12UnsignedTransaction) {
	const newRow: TxRow = {
		id: nextId(db.txes),
		unsignedTx: tx,
		commitments: [],
		hintbags: []
	};
	db.txes.push(newRow);
}

// pasring

export function contractTypeFromErgoTree(box: Box): ContractType {
	const address = new ErgoTree(box.ergoTree).toAddress().toString();
	if (address == DEPOSIT_ADDRESS) {
		return ContractType.DEPOSIT;
	} else if (address == BUY_ORDER_ADDRESS) {
		return ContractType.BUY;
	} else if (address == SELL_ORDER_ADDRESS) {
		return ContractType.SELL;
	} else {
		return ContractType.UNKNOWN;
	}
}

export function parseBox(box: Box): BoxParameters | undefined {
	const contractType = contractTypeFromErgoTree(box);
	if (contractType == ContractType.DEPOSIT) {
		const r4 = decodeR4(box);
		const r5 = decodeR5(box);
		if (r4 && r5) {
			return {
				contract: ContractType.DEPOSIT,
				parameters: {
					userPk: r4.userPk,
					poolPk: r4.poolPk,
					unlockHeight: r5
				}
			};
		}
	} else if(contractType == ContractType.BUY) {
		const r4 = decodeR4(box);
		const r5 = decodeR5(box);
		if (r4 && r5) {
			return {
				contract: ContractType.DEPOSIT,
				parameters: {
					userPk: r4.userPk,
					poolPk: r4.poolPk,
					unlockHeight: r5
				}
			};
		}
	}
}

export function decodeR4(
	box: Box
): { userPk: string; poolPk: string } | undefined {
	const r4 = box.additionalRegisters.R4;

	if (r4) {
		const parsed = parse<Uint8Array[]>(r4);
		return {
			userPk: ErgoAddress.fromPublicKey(parsed[0]).toString(),
			poolPk: ErgoAddress.fromPublicKey(parsed[1]).toString()
		};
	}
}

export function decodeR5(box: Box): number | undefined {
	const r5 = box.additionalRegisters.R5;
	if (r5) {
		const parsed = parse<number>(r5);
		return parsed;
	}
}

export function decodeTokenIdFromR6(box: Box): string | undefined {
	const r6 = box.additionalRegisters.R6;
	if (r6) {
		const parsed = Buffer.from(parse(r6)).toString('hex');
		return parsed;
	}
}

export function decodeR7(box: Box): bigint | undefined {
	const r7 = box.additionalRegisters.R7;
	if (r7) {
		const parsed = parse<bigint>(r7);
		return parsed;
	}
}

export function decodeR8(box: Box): string | undefined {
	const r8 = box.additionalRegisters.R8;
	if (r8) {
		const hexBuffer = Buffer.from(parse(r8)).toString('hex');
		const parsed = ErgoAddress.fromErgoTree(hexBuffer).toString();
		return parsed;
	}
}

export function decodeTokenIdPairFromR6(box: Box):
	| {
			sellingTokenId: string;
			buyingTokenId: string;
	  }
	| undefined {
	const r6 = box.additionalRegisters.R6;
	if (r6) {
		const parsed = parse<Uint8Array[]>(r6);
		return {
			sellingTokenId: Buffer.from(parsed[0]).toString('hex'),
			buyingTokenId: Buffer.from(parsed[1]).toString('hex')
		};
	}
}
