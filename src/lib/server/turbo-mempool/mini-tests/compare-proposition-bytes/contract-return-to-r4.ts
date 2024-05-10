import { DEPOSIT_ADDRESS } from '$lib/server/constants/addresses';
import { Network } from '@fleet-sdk/common';
import { compile } from '@fleet-sdk/compiler';
import { ErgoAddress, SColl } from '@fleet-sdk/core';

export const sellTokenForErg = `{	
	def getSellerMultisigAddress(box: Box) = box.R4[Coll[Byte]].get
    
    val box : Box = OUTPUTS(0)
    val returnedToDeposit = getSellerMultisigAddress(SELF) == box.propositionBytes 

    if (returnedToDeposit){
        sigmaProp(true)
    } else
    {
        sigmaProp(false)
    }
}`;

function compileContract() {
	const tree = compile(sellTokenForErg, {
		version: 0,
		includeSize: false
	});
	return tree.toAddress(Network.Mainnet).toString();
}

console.log(`export const returnToR4Address = "${compileContract()}"`);
