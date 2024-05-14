import type { Box } from "@fleet-sdk/common"

export type BoxRow  = {
    id: number
    box: Box
    unspent: Boolean
}