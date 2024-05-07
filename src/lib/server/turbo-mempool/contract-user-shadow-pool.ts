import { Network } from '@fleet-sdk/common';
import { compile } from '@fleet-sdk/compiler';
import { BOB_ADDRESS, SHADOWPOOL_ADDRESS } from '../constants/addresses';
import { first, type EIP12UnsignedTransaction } from '@fleet-sdk/common';

import { SGroupElement, SInt, SLong, SSigmaProp } from '@fleet-sdk/serializer';
import { ErgoAddress } from '@fleet-sdk/core';

//1255856
export const userAndShadowPoolMultisig = `{
	def getSellerPk(box: Box)              = box.R4[Coll[SigmaProp]].get(0)
	def getPoolPk(box: Box)                = box.R4[Coll[SigmaProp]].get(1)
	def unlockHeight(box: Box)             = box.R5[Int].get
	
	if(HEIGHT > unlockHeight(SELF)){
		getSellerPk(SELF)
	}else{
		getSellerPk(SELF) && getPoolPk(SELF)
	}
}`;

//SELF.tokens(0)._1 == sellTokenId,

function compileContract() {
	const bobAddr = ErgoAddress.fromBase58(BOB_ADDRESS);
	const shadowPoolPK = ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS);

	const tree = compile(userAndShadowPoolMultisig, {
		//map: {
		//	shadowPoolPK: SSigmaProp(SGroupElement(first(shadowPoolPK.getPublicKeys()))).toHex(),
		//	userPK: SSigmaProp(SGroupElement(first(bobAddr.getPublicKeys()))).toHex()
		//},
		version: 0,
		includeSize: false
	});
	return tree.toAddress(Network.Mainnet).toString();
}

console.log(`export const depositAddress = "${compileContract()}"`);
// "YUgzXAHbU5PBQVZ17sAx9BM5ibamq2umSnk1hPTZ4MBEHy1BPmfWK7oD5kXiu25r6hSMFHWGuqPPXRYEd"
