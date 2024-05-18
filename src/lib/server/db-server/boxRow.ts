import type { Box } from "@fleet-sdk/common"

export enum ContractType {
    DEPOSIT,
    BUY,
    SELL,
    UNKNOWN
}

export type DepositParams = {
    userPk: string
    poolPk: string
    unlockHeight: number
}

export type BuyParams = DepositParams & {
}

export type SellParams = DepositParams & {
}

export type SwapParams = DepositParams & {
}

export type BoxParameters = {
    contract: ContractType,
    parameters: DepositParams | BuyParams | SellParams | SwapParams
}

export type BoxRow  = {
    id: number
    box: Box
    contract: ContractType
    parameters: DepositParams | BuyParams
    unspent: Boolean
}