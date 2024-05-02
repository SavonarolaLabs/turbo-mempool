import { first } from "@fleet-sdk/common";
import { compile } from "@fleet-sdk/compiler";
import { ErgoAddress, SGroupElement, SSigmaProp, Network } from "@fleet-sdk/core";

export function compileMultisig(): string {
    const bobPublicKey = "9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU";
    const alicePublicKey = "9gJa6Mict6TVu9yipUX5aRUW87Yv8J62bbPEtkTje28sh5i3Lz8";

    const bobExtendedKey =
        "xpub6EerXhnhfix7B4Cq2W8z17NWG1SkNwzbpGoA23Dm6JnKzhxHEzLE9YNJsJp1chijsPriQTMnRrzHnPkWu3kErJcoBSTr48bkjUozhrYZ6Mu";
    const aliceExtendedKey =
        "xpub6ELZQdHDd8YdeKSNGEBuC9gF23VJZpBVPX3ujJS312J2pvoU2F3mDGiqbrYXuyTjMEvqtVb8RnfovRP1FF66J17G3qf25B5j2UHZvK2x2ib";

    const bobAddr = ErgoAddress.fromBase58(bobPublicKey);
    const aliceAddr = ErgoAddress.fromBase58(alicePublicKey);

    const contract2 = "BobPK && AlicePK";
    const contract = "{atLeast(2, Coll[SigmaProp](BobPK, AlicePK))}";

    const tree = compile(contract, {
        map: {
            AlicePK: SSigmaProp(SGroupElement(first(aliceAddr.getPublicKeys()))).toHex(),
            BobPK: SSigmaProp(SGroupElement(first(bobAddr.getPublicKeys()))).toHex()
        },
        version: 0,
        includeSize: false
    });
    const x = tree.toAddress(Network.Mainnet).toString();
    const newTree = ErgoAddress.fromBase58(x);
    //console.log("🚀 ~ compileMultisig ~ newTree:", newTree);
    console.log("🚀 ~ compileMultisig ~ newTree.ergoTree:", newTree.ergoTree);

    return x;
}

const x = compileMultisig();
console.log(x);
