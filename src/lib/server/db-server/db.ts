import { type Box, type EIP12UnsignedTransaction } from "@fleet-sdk/common"
import { ContractType, type BoxRow } from "./boxRow"
import type { TxRow } from "./txRow"
import { ErgoTree } from "@fleet-sdk/core"
import { BUY_ORDER_ADDRESS, DEPOSIT_ADDRESS, SELL_ORDER_ADDRESS } from "../constants/addresses"

interface HasId {
    id: number
}

export type BoxDB = {
    boxRows: BoxRow[]
    txes: TxRow[]
}

export function initDb(): BoxDB {
    return {
        boxRows: [],
        txes: [],
    }
}

function nextId(table: HasId[]){
    const maxId = Math.max(...table.map(row => row.id))
    return maxId + 1;
}

export function db_addBox(db: BoxDB, box: Box){
    const newRow: BoxRow = {
        id: nextId(db.boxRows),
        contract: contractTypeFromErgoTree(box),
        box,
        unspent: true,
    }
    db.boxRows.push(newRow);
}

export function db_addBoxes(db: BoxDB, boxRows: Box[]){
    boxRows.forEach(box => db_addBox(db, box))
}

export function db_addTx(db: BoxDB, tx: EIP12UnsignedTransaction){
    const newRow: TxRow = {
        id: nextId(db.txes),
        unsignedTx: tx,
        commitments: [],
        hintbags: [],
    }
    db.txes.push(newRow);
}

export function contractTypeFromErgoTree(box: Box): ContractType{
    const address = new ErgoTree(box.ergoTree).toAddress().toString();
    if(address == DEPOSIT_ADDRESS){
        return ContractType.DEPOSIT
    }else if(address == BUY_ORDER_ADDRESS){
        return ContractType.BUY
    }else if(address == SELL_ORDER_ADDRESS){
        return ContractType.SELL
    }else{
        return ContractType.UNKNOWN
    }
}