<script lang="ts">
  import {
    compileHodlContract,
    compileHodlErg3Contract,
    compileMemeContract,
    compileSellContract,
  } from "../erg-contracts/compile";
  import { onMount } from "svelte";

  import { sellForErgTx, sellForTokenTx } from "../erg-contracts/sell_contract/sendToContract";
  import { buyForErgTx, buyForTokenTx, getBox } from "../erg-contracts/sell_contract/buyFromContract";

  import { sellTx } from "../erg-contracts/sell_fee_contract/sendToContract_fee";
  import { buyTx } from "../erg-contracts/sell_fee_contract/buyFromContract_fee";
  
  import { cancelTx } from "../erg-contracts/cancelSaleOrder";
  import { mintTokenTx } from "../erg-contracts/mint";
  import { mintHodlBoxTx } from "../erg-contracts/hodl_contract/sendToHodl";
  import { receiveHodlBoxTx } from "../erg-contracts/hodl_contract/receiveHodl";
  import { getBoxById, getContractBoxes } from "../erg-contracts/box";
  import { mintHodlErg3BoxTx } from "../erg-contracts/hodl_contract/sendToHodl_hodlerg3";
  import { receiveHodlErg3BoxTx } from "../erg-contracts/hodl_contract/receiveHodl_hodlerg3";
	import { exchangeRsvTx, exchangeScTx, receiveRSVTx, receiveSCTx, redeemRSVTx, redeemSCTx } from "../erg-contracts/sigmaUSD/sigmaUSD";
  import {sendToHodlMemeTx} from "../erg-contracts/hodl_meme/sendToHodlMeme"
  import {receiveHodlMemeTx} from  "../erg-contracts/hodl_meme/receiveFromHodlMeme"
  import {CONTRACT_MEME} from "../erg-contracts/hodl_meme/hodlMeme"
  
  let contract: string = "";
  let contractBoxes: any = [];
  let currentTx = "";
  let newBoxId = "";
  let newBox = { a: "111" };
  let newBoxText = "";
  let address = ""

  const price = 1_000_000_000n;
  //const tokenId = "95823d745f7f768cfea90fd7735d44b87267a52880c56f3743b2674b0980e9e5"; // mainnet Turbo-Ergo token
  //const tokenId = "a9fd42f0212de6fe3b1aae9f9b3c1d2a2d18b36d9f80572b8d9a47adcca70330";   // mainnet Turbo-Ergo v2 token
  const tokenId = "69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8";   // mainnet HodlErgDoge Test1
  const tokenAmount = 1000*10**9; // mainnet Turbo-Ergo token
  const additionalTokenId = "0fdb7ff8b37479b6eb7aab38d45af2cfeefabbefdc7eebc0348d25dd65bc2c91"; // mainnet Lambo token
  const currencyTokenId = "95823d745f7f768cfea90fd7735d44b87267a52880c56f3743b2674b0980e9e5"; // mainnet turbo-ergo token


  const seller = "9fKtqapsSby7JFJKTvx6j4xSUT1nEFEzTrQyqZ1r6fXUrTYa7VK"; // mainnet
  const dev = "9hBdmAbDAcqzL7ZnKjxo39pbEUR5VVzQA7LHWYywdGrZDmf6x5K";    // mainnet
  const ui = "9ha6S6wSKnFsk3JN28HRMvHwXNKRTjMBMZUe3i4LCPnwurfDiFZ";     // mainnet
  const devErdoge = "9ffXZz5AovJvapPo63TGwdNaRPMUiHo2UkqGavmDGzrUERY9qJ3";    // mainnet
  const uiErdoge = "9f8WPUc1it3FWdGYzKfDmrMYNj1uZR26zALCeLUWnvCXuCDYKeb";     // mainnet
  const bank = "MUbV38YgqHy7XbsoXWF5z7EZm524Ybdwe5p9WDrbhruZRtehkRPT92imXer2eTkjwPDfboa1pR3zb3deVKVq3H7Xt98qcTqLuSBSbHb7izzo5jphEpcnqyKJ2xhmpNPVvmtbdJNdvdopPrHHDBbAGGeW7XYTQwEeoRfosXzcDtiGgw97b2aqjTsNFmZk7khBEQywjYfmoDc9nUCJMZ3vbSspnYo3LarLe55mh2Np8MNJqUN9APA6XkhZCrTTDRZb1B4krgFY1sVMswg2ceqguZRvC9pqt3tUUxmSnB24N6dowfVJKhLXwHPbrkHViBv1AKAJTmEaQW2DN1fRmD9ypXxZk8GXmYtxTtrj3BiunQ4qzUCu1eGzxSREjpkFSi2ATLSSDqUwxtRz639sHM6Lav4axoJNPCHbY8pvuBKUxgnGRex8LEGM8DeEJwaJCaoy8dBw9Lz49nq5mSsXLeoC4xpTUmp47Bh7GAZtwkaNreCu74m9rcZ8Di4w1cmdsiK1NWuDh9pJ2Bv7u3EfcurHFVqCkT3P86JUbKnXeNxCypfrWsFuYNKYqmjsix82g9vWcGMmAcu5nagxD4iET86iE2tMMfZZ5vqZNvntQswJyQqv2Wc6MTh4jQx1q2qJZCQe4QdEK63meTGbZNNKMctHQbp3gRkZYNrBtxQyVtNLR8xEY8zGp85GeQKbb37vqLXxRpGiigAdMe3XZA4hhYPmAAU5hpSMYaRAjtvvMT3bNiHRACGrfjvSsEG9G2zY5in2YWz5X9zXQLGTYRsQ4uNFkYoQRCBdjNxGv6R58Xq74zCgt19TxYZ87gPWxkXpWwTaHogG1eps8WXt8QzwJ9rVx6Vu9a5GjtcGsQxHovWmYixgBU8X9fPNJ9UQhYyAWbjtRSuVBtDAmoV1gCBEPwnYVP5GCGhCocbwoYhZkZjFZy6ws4uxVLid3FxuvhWvQrVEDYp7WRvGXbNdCbcSXnbeTrPMey1WPaXX"//
  onMount(doStuff);

  async function doStuff() {
    //contract = compileSellContract();
    contract = compileMemeContract(dev);
    refreshWallet();
    //contract = compileHodlContract(dev);    // Hodl for Erg
    //contract = compileHodlErg3Contract(dev);  // Hodl for HodlErg3
    //contract = CONTRACT_MEME;
    loadBox();
    refreshContractBoxes();
    //"https://testnet.ergoplatform.com/en/addresses/"+
    //sellTokens();
    //receiveToken();
  }
  async function refreshWallet(){
    if(await window.ergoConnector["nautilus"]?.isConnected()){
        address = await ergo.get_change_address();
    }
  }

  function loadBox() {
    const x = localStorage.getItem("contract_box");
    if (x) {
      newBoxText = x;
      newBox = JSON.parse(newBoxText);
    }
  }
  function saveBox() {
    localStorage.setItem("contract_box", newBoxText);
  }

  async function receiveTokenWithFee() {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();
    const tx = await buyTx(
      newBox,
      me,
      tokenId,
      utxos,
      height,
      price,
      seller,
      dev
    );
    //const tx = await getBox(boxId, me, tokenId, utxos, height);
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(txId);
    currentTx = txId;
  }

  async function sellTokensWithFee() {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();
    const assets = [
      { tokenId: tokenId, amount: "1" },
    ];
    const tx = sellTx(contract, me, tokenId, utxos, height, dev, assets);
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(signed);
    newBox = signed.outputs[0];
    newBoxText = JSON.stringify(newBox);
    saveBox();
    console.log(txId);
    currentTx = txId;
  }

  async function sellTokensForErg() {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();
    const assets = [
      { tokenId: tokenId, amount: "1" },
    ];
    const tx = sellForErgTx(contract, me, utxos, height, assets, price);
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(signed);
    newBox = signed.outputs[0];
    newBoxText = JSON.stringify(newBox);
    saveBox();
    console.log(txId);
    currentTx = txId;
  }

  async function receiveTokenForErg() {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();
    const tx = await buyForErgTx(
      newBox,
      me,
      utxos,
      height,
      price,
      seller,
    );
    //const tx = await getBox(boxId, me, tokenId, utxos, height);
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(txId);
    currentTx = txId;
  }

  async function cancelTokenSell() {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();
    const tx = await cancelTx(newBox, me, height);
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(signed);
    newBox = signed.outputs[0];
    newBoxText = JSON.stringify(newBox);
    saveBox();
    console.log(txId);
    currentTx = txId;
  }

  async function mintToken() {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();
    const tokenName = "HoldErgDoge Test1";
    const amount = 50_000_000_000_000_000n;
    const tx = await mintTokenTx(tokenName, amount, me, utxos, height);
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(signed);
    console.log(txId);
    currentTx = txId;
  }

  async function mintHodlBox() {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();
    //const tokenName = "turbo ergo";
    const amount = 190n; //5500000n
    const tx = await mintHodlBoxTx(me, utxos, height, contract, amount, ui);
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(signed);
    newBox = signed.outputs[0];
    newBoxText = JSON.stringify(newBox);
    saveBox();
    console.log(txId);
    currentTx = txId;
  }

  //receiveHodlBoxTx
  async function receiveHodlBox() {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();
    //const tokenName = "turbo ergo";
    //const amount = 5500000n;
    const tx = await receiveHodlBoxTx(
      newBox,
      me,
      utxos,
      height,
      ui,
      dev
    );
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(signed);
    newBox = signed.outputs[0];
    newBoxText = JSON.stringify(newBox);
    saveBox();
    console.log(txId);
    currentTx = txId;
  }


  async function mintHodlErg3Box() {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();

    const assets = [
      { tokenId: tokenId, amount: tokenAmount },
    ];
    
    const tx = await mintHodlErg3BoxTx(me, utxos, height, contract, assets, ui);
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(signed);
    newBox = signed.outputs[0];
    newBoxText = JSON.stringify(newBox);
    saveBox();
    console.log(txId);
    currentTx = txId;
  }

  async function receiveHodlErg3Box() {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();
    const tx = await receiveHodlErg3BoxTx(
      newBox,
      me,
      utxos,
      height,
      ui,
      dev
    );
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(signed);
    newBox = signed.outputs[0];
    newBoxText = JSON.stringify(newBox);
    saveBox();
    console.log(txId);
    currentTx = txId;
  }

  async function mintHodlMemeBox() {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();
    const targetRateInNanoErg = 5_000_000_000n;
    const targetHeight = 123;
    const targetDate ="2025-12-25"
    const oraclePk = me 

    const assets = [
      { tokenId: tokenId, amount: tokenAmount },
    ];
    
    const tx = await sendToHodlMemeTx(me, utxos, height, contract, assets, ui,targetRateInNanoErg,targetHeight,targetDate,oraclePk);
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(signed);
    newBox = signed.outputs[0];
    newBoxText = JSON.stringify(newBox);
    saveBox();
    console.log(txId);
    currentTx = txId;
  }

  async function receiveHodlMemeBox() {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();
    const holder = "9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU"
    const takeBoxById ="af5c2816b9ca7f6582edd8ef1553a1ceee5cecb3781b170e3135c1e237a0393b"
    const box = await getBoxById(takeBoxById)
    const tx = await receiveHodlMemeTx(
      box,
      me,
      utxos,
      height,
      uiErdoge,
      devErdoge,
      holder
    );
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(signed);
    newBox = signed.outputs[0];
    newBoxText = JSON.stringify(newBox);
    saveBox();
    console.log(txId);
    currentTx = txId;
  }




  async function receiveRSV() {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();
   
    const requestRSV=2200n
    const tx = await receiveRSVTx(
      requestRSV,
      me,
      bank,
      utxos,
      height,
    );
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(signed);
    newBox = signed.outputs[0];
    newBoxText = JSON.stringify(newBox);
    saveBox();
    console.log(txId);
    currentTx = txId;
  }
  async function redeemRSV() {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();
   
    const requestRSV=2200n
    const tx = await redeemRSVTx(
      requestRSV,
      me,
      bank,
      utxos,
      height,
    );
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(signed);
    newBox = signed.outputs[0];
    newBoxText = JSON.stringify(newBox);
    saveBox();
    console.log(txId);
    currentTx = txId;
  }


  async function exchangeRSV(direction:bigint=1n,requestRSV:bigint=2200n) {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();
   
     //direction = 1n;
     //requestRSV = 2200n;
   
    const tx = await exchangeRsvTx(
      requestRSV,
      me,
      bank,
      utxos,
      height,
      direction,
    );
    
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(signed);
    newBox = signed.outputs[0];
    newBoxText = JSON.stringify(newBox);
    saveBox();
    console.log(txId);
    currentTx = txId;
  }

  async function exchangeSC (direction:bigint=1n,requestSC:bigint=100n) {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();

    const tx = await exchangeScTx(
      requestSC,
      me,
      bank,
      utxos,
      height,
      direction,
    );
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(signed);
    newBox = signed.outputs[0];
    newBoxText = JSON.stringify(newBox);
    saveBox();
    console.log(txId);
    currentTx = txId;
  }




  async function receiveSC() {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();
   
    const requestSC=100n
    const tx = await receiveSCTx(
      requestSC,
      me,
      bank,
      utxos,
      height,
    );
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(signed);
    newBox = signed.outputs[0];
    newBoxText = JSON.stringify(newBox);
    saveBox();
    console.log(txId);
    currentTx = txId;
  }
  async function redeemSC() {
    await window.ergoConnector.nautilus.connect();
    const me = await ergo.get_change_address();
    const utxos = await ergo.get_utxos();
    const height = await ergo.get_current_height();
   
    const requestSC=100n
    const tx = await redeemSCTx(
      requestSC,
      me,
      bank,
      utxos,
      height,
    );
    console.log(tx);
    const signed = await ergo.sign_tx(tx);
    const txId = await ergo.submit_tx(signed);
    console.log(signed);
    newBox = signed.outputs[0];
    newBoxText = JSON.stringify(newBox);
    saveBox();
    console.log(txId);
    currentTx = txId;
  }
  


 async function submit2Tx() {
	await window.ergoConnector.nautilus.connect();
	const me = await ergo.get_change_address();
	const utxos = await ergo.get_utxos();
	const height = await ergo.get_current_height();

	const tx1signed = {
		id: "7cd0c452ea5c6c62890d7ec5201cae94578f8ed77e5bf73e20caf7b639e7c216",
		inputs: [
			{
				boxId:
					"04f1c9ab87c0bab57c63029d2fedf4bd06d2ae3765e5c2b400055159c4526ce9",
				spendingProof: {
					proofBytes:
						"3e33e909982063cb9cecd9aa682e47e45afb6e16f047d8e8d61233101c666e1c7ae664d6dc2f21fafc5a66e1aca88e50fcfb7425ca7f5119",
					extension: {},
				},
			},
		],
		dataInputs: [],
		outputs: [
			{
				boxId:
					"c079c094a83bd46c90f06d9766258127fb3c62a3a627dd0527e6867644b663c8",
				value: "4998900000",
				ergoTree:
					"0008cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c",
				creationHeight: 1240713,
				index: 0,
				transactionId:
					"7cd0c452ea5c6c62890d7ec5201cae94578f8ed77e5bf73e20caf7b639e7c216",
				assets: [],
				additionalRegisters: {},
			},
			{
				boxId:
					"e2cc14ec01b354397a06cd99290b8f50e88ebde8be85ce27d79ba720b077e3c4",
				value: "1100000",
				ergoTree:
					"1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304",
				creationHeight: 1240713,
				index: 1,
				transactionId:
					"7cd0c452ea5c6c62890d7ec5201cae94578f8ed77e5bf73e20caf7b639e7c216",
				assets: [],
				additionalRegisters: {},
			},
		],
	};
	const tx2unsigned = {
		inputs: [
			{
				boxId:
					"c079c094a83bd46c90f06d9766258127fb3c62a3a627dd0527e6867644b663c8",
				value: "4998900000",
				ergoTree:
					"0008cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c",
				creationHeight: 1240713,
				assets: [],
				additionalRegisters: {},
				transactionId:
					"7cd0c452ea5c6c62890d7ec5201cae94578f8ed77e5bf73e20caf7b639e7c216",
				index: 0,
				extension: {},
			},
		],
		dataInputs: [],
		outputs: [
			{
				value: "4997800000",
				ergoTree:
					"0008cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c",
				creationHeight: 1240713,
				assets: [],
				additionalRegisters: {},
			},
			{
				value: "1100000",
				ergoTree:
					"1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304",
				creationHeight: 1240713,
				assets: [],
				additionalRegisters: {},
			},
		],
	};

	const tx2signed = await ergo.sign_tx(tx2unsigned);
	const txId = await ergo.submit_tx([tx1signed, tx2signed]);
	console.log(txId);
}




  function copyBoxName() {
    navigator.clipboard.writeText(JSON.stringify(newBox));
  }
  async function pasteBoxName() {
    newBoxText = await navigator.clipboard.readText();
    newBox = JSON.parse(newBoxText);
    saveBox();
  }

  async function refreshContractBoxes() {
    contractBoxes = await getContractBoxes(contract);
  }


</script>

<div>
    active wallet: {address}
  </div>
<div>
  active contract:<a
    target="_blank"
    href={`https://testnet.ergoplatform.com/en/addresses/${contract}`}
    >{contract}</a
  >
</div>

<div>
  <button class="text-white bg-black hover:bg-black focus:ring-4 focus:ring-black font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-black dark:hover:bg-black focus:outline-none dark:focus:ring-black"
  on:click={mintHodlMemeBox}>Mint HodlMeme</button>
  <button class="text-white bg-black hover:bg-black focus:ring-4 focus:ring-black font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-black dark:hover:bg-black focus:outline-none dark:focus:ring-black"
  on:click={receiveHodlMemeBox}>Receive HodlMeme</button>
</div>



<div>
  <button class="text-white bg-black hover:bg-black focus:ring-4 focus:ring-black font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-black dark:hover:bg-black focus:outline-none dark:focus:ring-black"
  on:click={mintHodlErg3Box}>Mint HodlBox HodlErg3</button>
  <button class="text-white bg-black hover:bg-black focus:ring-4 focus:ring-black font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-black dark:hover:bg-black focus:outline-none dark:focus:ring-black"
  on:click={receiveHodlErg3Box}>Receive HodlBox HodlErg3</button>
</div>


<div><button class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
   on:click={sellTokensWithFee}>sell Tokens With Fee</button>
   <button class="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
   on:click={sellTokensForErg}>sell Tokens for ERG - No Fee</button>

</div>

<div><button class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
   on:click={receiveTokenWithFee}>receive Token With Fee </button>
   <button class="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
   on:click={receiveTokenForErg}>receive Token for ERG- No Fee</button>
</div>
<div><button class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
   on:click={cancelTokenSell}>cancelSellToken</button></div>
<div>
  <br>

<div>
  <h3>Sig RSV</h3>
  <input type="number" id="SigRSV">
  <div><button class="text-black bg-black-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-400 focus:outline-none dark:focus:ring-green-800"
    on:click={receiveRSV}>buy </button>
  <button class="text-black bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-400 focus:outline-none dark:focus:ring-red-800"
    on:click={redeemRSV}>sell</button>
  <button class="text-black bg-orange-700 hover:bg-orange-800 focus:ring-4 focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-orange-600 dark:hover:bg-orange-400 focus:outline-none dark:focus:ring-orange-800"
    on:click={()=>exchangeRSV(-1n,2200n)}>exchange</button>
  </div>
</div>  
  <br>

<div>
  <h3>Sig USD (cents)</h3>
  <input type="number" id="SigUSD">
  <div><button class="text-black bg-black-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-400 focus:outline-none dark:focus:ring-green-800"
    on:click={receiveSC}>buy </button>
  <button class="text-black bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-400 focus:outline-none dark:focus:ring-red-800"
    on:click={redeemSC}>sell</button>
  <button class="text-black bg-orange-700 hover:bg-orange-800 focus:ring-4 focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-orange-600 dark:hover:bg-orange-400 focus:outline-none dark:focus:ring-orange-800"
  on:click={()=>exchangeSC(1n,100n)}>exchange</button>
  </div>
</div>
  <button class="text-black bg-orange-700 hover:bg-orange-800 focus:ring-4 focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-orange-600 dark:hover:bg-orange-400 focus:outline-none dark:focus:ring-orange-800"
  on:click={()=>submit2Tx()}>sumbit 2 tx </button>
<div>

</div>
  <a
    target="_blank"
    href={`https://ergoplatform.com/en/transactions/${currentTx}`}
    >{"https://ergoplatform.com/en/transactions/" + currentTx}</a
  >
</div>
<div>new box id = {newBoxId}</div>
<textarea name="" id="111" cols="30" rows="10" bind:value={newBoxText} />
<button class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
 on:click={copyBoxName}>copy</button>
<button class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
 on:click={pasteBoxName}>paste</button>
<div><button class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
   on:click={mintToken}>mint token</button></div>
<div />
<div><button class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
   on:click={mintHodlBox}>mint hodl box</button></div>
<div />
<div><button class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
   on:click={receiveHodlBox}>receive hodl box</button></div>

<div class="mt-4">
  <div><button class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
     on:click={refreshContractBoxes}>refresh boxes</button></div>
  <div>{contract}</div>
  {#if contractBoxes.length < 1}
    <div>contract has no boxes</div>
  {:else}
    <div class="flex flex-col gap-1">
      {#each contractBoxes as box}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          on:click={() => {
            newBox = box;
            newBoxText = JSON.stringify(newBox);
          }}
          class="cursor-pointer"
        >
          <div>boxId: {box.boxId}</div>
          <div>{box.value} ERG</div>
        </div>
      {/each}
    </div>
  {/if}
</div>
