import type { EIP12UnsignedTransaction } from "@fleet-sdk/common"

type todo = {}

export type TxTable = {
    id: number
    unsignedTx: EIP12UnsignedTransaction
    commitments: todo
    hintbags: todo
}