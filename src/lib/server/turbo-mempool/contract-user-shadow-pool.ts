import { Network } from '@fleet-sdk/common';
import { compile } from '@fleet-sdk/compiler';
import { BOB_ADDRESS, SHADOWPOOL_ADDRESS } from '../addresses';
import { first, type EIP12UnsignedTransaction } from '@fleet-sdk/common';

import { SGroupElement, SInt, SLong, SSigmaProp } from '@fleet-sdk/serializer';
import { ErgoAddress } from '@fleet-sdk/core';

export const userAndShadowPoolMultisig = `{

val maxHeightReached : Boolean = {
    100000 <= HEIGHT
}

if(maxHeightReached){
  userPK
}else{
  shadowPoolPK && userPK
}}`;

//SELF.tokens(0)._1 == sellTokenId,

function compileContract() {
	const bobAddr = ErgoAddress.fromBase58(BOB_ADDRESS);
	const shadowPoolPK = ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS);

	const tree = compile(userAndShadowPoolMultisig, {
		map: {
			shadowPoolPK: SSigmaProp(SGroupElement(first(shadowPoolPK.getPublicKeys()))).toHex(),
			userPK: SSigmaProp(SGroupElement(first(bobAddr.getPublicKeys()))).toHex()
		},
		version: 0,
		includeSize: false
	});
	return tree.toAddress(Network.Mainnet).toString();
}

console.log(`export const depositAddress = "${compileContract()}"`);
// "YUgzXAHbU5PBQVZ17sAx9BM5ibamq2umSnk1hPTZ4MBEHy1BPmfWK7oD5kXiu25r6hSMFHWGuqPPXRYEd"
