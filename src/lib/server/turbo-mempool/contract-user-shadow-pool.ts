import { Network } from "@fleet-sdk/common";
import { compile } from "@fleet-sdk/compiler";

export const userAndShadowPoolMultisig = `
{
    val maxLockHeight : Int       = SELF.R4[Int].get
    val shadowPoolPK : SigmaProp    = SELF.R5[SigmaProp].get
    val userPK : SigmaProp        = SELF.R6[SigmaProp].get
    
    // ensure maxLockHeight is not more than 3 month, using box creation height.
    // what registers do we need to set when oder if filled/canceled -> goes back to multisig deposit

    val maxHeightReached : Boolean = {
        maxLockHeight <= HEIGHT
    }
  
    if(maxHeightReached){
      userPK
    }else{
      shadowPoolPK && userPK
    }
}`;

//SELF.tokens(0)._1 == sellTokenId,

function compileContract() {
    const tree = compile(userAndShadowPoolMultisig, {
        // map: {
        //     AlicePK: SSigmaProp(SGroupElement(first(aliceAddr.getPublicKeys()))).toHex(),
        //     BobPK: SSigmaProp(SGroupElement(first(bobAddr.getPublicKeys()))).toHex()
        // },
        version: 0,
        includeSize: false
    });
    return tree.toAddress(Network.Mainnet).toString();
}

console.log(`export const userAndShadowPoolMultisig = "${compileContract()}"`);
// "YUgzXAHbU5PBQVZ17sAx9BM5ibamq2umSnk1hPTZ4MBEHy1BPmfWK7oD5kXiu25r6hSMFHWGuqPPXRYEd"
