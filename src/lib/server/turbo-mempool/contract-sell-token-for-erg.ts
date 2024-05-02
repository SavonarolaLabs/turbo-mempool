import { Network } from '@fleet-sdk/common';
import { compile } from '@fleet-sdk/compiler';

export const sellTokenForErg = `
{
    val sellTokenId   : Long      = SELF.R4[Long].get
    val ergTokenRate  : Int       = SELF.R5[Int].get
    val sellerAddress : SigmaProp = SELF.R6[SigmaProp].get

    val sellerPaid = allOf(Coll(
        OUTPUTS(0).propositionBytes == sellerAddress.propBytes,
        OUTPUTS(0).value == SELF.value + SELF.tokens(0)._2 * ergTokenRate //secure it vs token injection
    ))

    sigmaProp(sellerPaid)
}`;

//SELF.tokens(0)._1 == sellTokenId,

function compileContract() {
	const tree = compile(sellTokenForErg, {
		// map: {
		//     AlicePK: SSigmaProp(SGroupElement(first(aliceAddr.getPublicKeys()))).toHex(),
		//     BobPK: SSigmaProp(SGroupElement(first(bobAddr.getPublicKeys()))).toHex()
		// },
		version: 0,
		includeSize: false
	});
	return tree.toAddress(Network.Mainnet).toString();
}

console.log(`export const sellOrderAddress = "${compileContract()}"`);
// "YUgzXAHbU5PBQVZ17sAx9BM5ibamq2umSnk1hPTZ4MBEHy1BPmfWK7oD5kXiu25r6hSMFHWGuqPPXRYEd"
