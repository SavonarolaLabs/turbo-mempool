import { Network } from '@fleet-sdk/common';
import { compile } from '@fleet-sdk/compiler';

export const userAndShadowPoolMultisig = `{
	val who : Int             = SELF.R4[Int].get
	val alicePk               = SELF.R4[Coll[SigmaProp]].get(0)
	val bobPK                 = SELF.R4[Coll[SigmaProp]].get(1)
	
	if(who ==  1){
		alicePk
	}else
	{
		bobPK
	}
}`;

function compileContract() {
	const tree = compile(userAndShadowPoolMultisig, {
		version: 0,
		includeSize: false
	});
	return tree.toAddress(Network.Mainnet).toString();
}

console.log(`${compileContract()}`);
