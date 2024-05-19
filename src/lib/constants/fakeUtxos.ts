import { ALICE_ADDRESS } from "$lib/constants/addresses";
import { ALICE_MNEMONIC } from "$lib/constants/mnemonics";

export const bobUtxosInitial = [
	{
		boxId: 'd2d0deb3b0b2c511e523fd43ae838ba7b89e4583f165169b90215ff11d942c1f',
		value: '100000000',
		ergoTree: '0008cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c',
		creationHeight: 1251583,
		assets: [],
		additionalRegisters: {},
		transactionId: 'bb60c4c35130d4f5ed92d12943bcba4f4567b09e0c49cbf9c40e41eb1b67efb8',
		index: 0,
		confirmed: true,
		comment: ''
	},
	{
		boxId: 'dad047468ce031363cbfde8b07c8ddf738d0b71b8f7096d5962061734568df26',
		value: '1862600000',
		ergoTree: '0008cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c',
		creationHeight: 1251587,
		assets: [
			{
				tokenId: '471eec389bebd266b5be1163451775d15c22df12af911e8ff0b919b60c862bae',
				amount: '1'
			},
			{
				tokenId: '69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
				amount: '47998989999999990'
			},
			{
				tokenId: '61e8c9d9cb5975fb4f54eec7d62286febcd58aba97cf6798691e3acc728cf3d1',
				amount: '1'
			},
			{
				tokenId: '2b4e0c286b470a9403c10fe557c58c1b5b678a2078b50d28baad0629e237e69c',
				amount: '1'
			},
			{
				tokenId: '2b1d40e38098e666740177c9f296a6ec8898c9a28c645576cca37e0449402a09',
				amount: '1'
			},
			{
				tokenId: '74648d5d515e37fd578e3fbe7aa0764f5edd27e0c311d82ffcd5596934daf431',
				amount: '1'
			}
		],
		additionalRegisters: {},
		transactionId: 'bac2b1308a3c5bc04f849bdec03a902432156c27ae664a58591704a75797cec0',
		index: 1,
		confirmed: true,
		comment: ''
	}
];

export const aliceUtxosInitial = [
	{
		boxId: 'b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab',
		value: '997800000',
		ergoTree: '0008cd02eb083423041003740c9e791b2fea5ecf6e273669630a25b7ecabf9145395e447',
		creationHeight: 1246984,
		assets: [],
		additionalRegisters: {},
		transactionId: '17739a5bb2742779f2875a0215693d36b8fc3d7241f662657faef354cc06599c',
		index: 1,
		confirmed: true,
		comment: ''
	}
];

export const PRINTER_UTXO = [
    {
      boxId: "200f8b94cc1a8b726bb40450d3ee684bb4506cdf3867000d0d5a67bd15af930e",
      transactionId: "325e71adc66f484a44cb445a443d6a310bc490a65d6a5179c6dff9ac9ac1cb2d",
      blockId: "b99a54b2039ecb6e1a0a2c884e12ab028191419e0dbdd63dcd295128f61ddb6d",
      value: "994600000",
      index: 2,
      globalIndex: 5491374,
      creationHeight: 1261482,
      settlementHeight: 1261484,
      ergoTree: "0008cd02eb083423041003740c9e791b2fea5ecf6e273669630a25b7ecabf9145395e447",
      ergoTreeConstants: "",
      ergoTreeScript: "{SigmaProp(ProveDlog(ECPoint(eb0834,848edd,...)))}",
      address: "9gJa6Mict6TVu9yipUX5aRUW87Yv8J62bbPEtkTje28sh5i3Lz8",
      assets: [],
      additionalRegisters: {},
      spentTransactionId: null,
      mainChain: true
    }, {
      boxId: "95f4fe09aeb14e46a7257abc6b60988631bb5dc1d66ae35865c99488420af3bd",
      transactionId: "325e71adc66f484a44cb445a443d6a310bc490a65d6a5179c6dff9ac9ac1cb2d",
      blockId: "b99a54b2039ecb6e1a0a2c884e12ab028191419e0dbdd63dcd295128f61ddb6d",
      value: "1000000",
      index: 0,
      globalIndex: 5491372,
      creationHeight: 1261482,
      settlementHeight: 1261484,
      ergoTree: "0008cd02eb083423041003740c9e791b2fea5ecf6e273669630a25b7ecabf9145395e447",
      ergoTreeConstants: "",
      ergoTreeScript: "{SigmaProp(ProveDlog(ECPoint(eb0834,848edd,...)))}",
      address: "9gJa6Mict6TVu9yipUX5aRUW87Yv8J62bbPEtkTje28sh5i3Lz8",
      assets: [
        {
          tokenId: "b73a806dee528632b8d76f07813a1f1b66b8e11bc32b3ad09f8051265f3664ab",
          index: 0,
          amount: "50000000000000000",
          name: "TestToken Test2",
          decimals: 9,
          type: "EIP-004"
        }
      ],
      additionalRegisters: {
        R4: "0e0f54657374546f6b656e205465737432",
        R5: "0e00",
        R6: "0e0139"
      },
      spentTransactionId: null,
      mainChain: true
    }, {
      boxId: "e7f7fd708e42aca91c47cd3717dc4cb92b343971a9873592c8ecde768bd05f0c",
      transactionId: "cbe878ba916b5462e48b040f6f268ef4ed6e47722a901b5afdc5dd2873a98b1c",
      blockId: "ccf62fa8022532d2f1d2ed80a7e0b7527aae177479d07fbdd72486e8b479bff6",
      value: "1000000",
      index: 0,
      globalIndex: 5490189,
      creationHeight: 1261443,
      settlementHeight: 1261445,
      ergoTree: "0008cd02eb083423041003740c9e791b2fea5ecf6e273669630a25b7ecabf9145395e447",
      ergoTreeConstants: "",
      ergoTreeScript: "{SigmaProp(ProveDlog(ECPoint(eb0834,848edd,...)))}",
      address: "9gJa6Mict6TVu9yipUX5aRUW87Yv8J62bbPEtkTje28sh5i3Lz8",
      assets: [
        {
          tokenId: "d2d0deb3b0b2c511e523fd43ae838ba7b89e4583f165169b90215ff11d942c1f",
          index: 0,
          amount: "1000000000000000",
          name: "SwapToken Test1",
          decimals: 9,
          type: "EIP-004"
        }
      ],
      additionalRegisters: {},
      spentTransactionId: null,
      mainChain: true
    }
]

export const PRINTER_MNEMONIC = ALICE_MNEMONIC
export const PRINTER_ADDRESS = ALICE_ADDRESS