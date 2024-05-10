import type { Amount, Box } from "@fleet-sdk/common"

export function asBigInt(v: bigint | string){
	if(typeof(v) == "string"){
		return BigInt(v)
	}else{
		return v
	}
}

export function sumNanoErg(boxes: Box<Amount>[]): bigint{
	return boxes.reduce((a: bigint, b:Box<Amount>)=> asBigInt(a) + asBigInt(b.value), 0n)
}