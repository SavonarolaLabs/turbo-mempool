import type { Box } from "@fleet-sdk/common"

export enum ContractType {
    DEPOSIT,
    BUY,
    SELL,
    UNKNOWN
}

export type BoxRow  = {
    id: number
    box: Box
    contract: ContractType
    unspent: Boolean
}