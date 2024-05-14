import { type Box, type EIP12UnsignedTransaction } from "@fleet-sdk/common"
import type { BoxRow } from "./boxes"
import type { TxRow } from "./transactions"

interface HasId {
    id: number
}

type ServerDB = {
    boxes: BoxRow[]
    txes: TxRow[]
}

export const db: ServerDB = {
    boxes: [],
    txes: [],
}

function nextId(table: HasId[]){
    const maxId = Math.max(...table.map(row => row.id))
    return maxId + 1;
}

export function addBox(db: ServerDB, box: Box){
    const newRow: BoxRow = {
        id: nextId(db.boxes),
        box,
        unspent: true,
    }
    db.boxes.push(newRow);
}

export function addTx(db: ServerDB, tx: EIP12UnsignedTransaction){
    const newRow: TxRow = {
        id: nextId(db.txes),
        unsignedTx: tx,
        commitments: [],
        hintbags: [],
    }
    db.txes.push(newRow);
}