import type { Box } from "@fleet-sdk/common"

export enum ContractType {
    DEPOSIT,
    BUY,
    SELL,
    UNKNOWN
}

export type DepositParams = {
    shadowPk: string
    userPk: string
    unlockHeight: number
}

export type BuyParams = {
    shadowPk: string
    userPk: string
    unlockHeight: number
} & DepositParams

export type BoxRow  = {
    id: number
    box: Box
    contract: ContractType
    params: DepositParams | BuyParams
    unspent: Boolean
}