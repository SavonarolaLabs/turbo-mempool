import { Network } from '@fleet-sdk/common';
import { compile } from '@fleet-sdk/compiler';

export const sellTokenForErg = `{	
	def getSellerPk(box: Box)              = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
	def getPoolPk(box: Box)                = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
	def unlockHeight(box: Box)             = box.R5[Int].get
	def getTokenId(box: Box)               = box.R6[Coll[Byte]].getOrElse(Coll[Byte]()) 
	def getSellRate(box: Box)              = box.R7[Long].get
	def getSellerMultisigAddress(box: Box) = box.R8[Coll[Byte]].get

	def getTokenAmount(box: Box) = box.tokens(0)._2
  
	def isSameContract(box: Box) = 
		  box.propositionBytes == SELF.propositionBytes
  
	def isSameToken(box: Box)    = 
	  	getTokenId(SELF) == getTokenId(box) &&
	  	box.tokens.size > 0 &&
		getTokenId(SELF) == box.tokens(0)._1 
  
	def isSameSeller(box: Box)   = 
      getSellerPk(SELF) == getSellerPk(box) &&
      getPoolPk(SELF) == getPoolPk(box)

  def isSameUnlockHeight(box: Box)  = 
      unlockHeight(SELF) == unlockHeight(box)

  def isSameMultisig(box: Box)    =
      getSellerMultisigAddress(SELF) == getSellerMultisigAddress(box)



	def isLegitInputBox(box: Box) = {
		isSameContract(box) && isSameToken(box) && isSameMultisig(box)
	}
  
	def isPaymentBox(box:Box) = {
		isSameSeller(box) &&
    	isSameUnlockHeight(box) &&
		getTokenId(SELF) == getTokenId(box) &&
		getSellerMultisigAddress(SELF) == box.propositionBytes
	}
  
	def sumTokensIn(boxes: Coll[Box]): Long = 
		boxes
			.filter(isLegitInputBox) 
			.fold(0L, {(a:Long, b: Box) => a + b.tokens(0)._2})
  
	val tokensIn: Long           = sumTokensIn(INPUTS)
  
	val avgRateInputs: Long = INPUTS.filter(isLegitInputBox).fold(0L, {(a:Long, b: Box) => a + getSellRate(b)*getTokenAmount(b)}) / tokensIn 
	
	val maxSellRate = INPUTS.filter(isLegitInputBox).fold(0L, {(r:Long, box:Box) => {
	  if(r > getSellRate(box)) r else getSellRate(box)
	}})
  
	def sumTokensInAtMaxRate(boxes: Coll[Box]): Long = 
		boxes
			.filter(isLegitInputBox)
			.filter({(b: Box)=> getSellRate(b) == maxSellRate})
			.fold(0L, {(a:Long, b: Box) => a + b.tokens(0)._2})
  
	def isMaxRateChangeBox(box: Box) = {
		isSameSeller(box) &&
		isSameUnlockHeight(box) &&
		isSameToken(box) &&
		maxSellRate == getSellRate(box) &&
		isSameMultisig(box) &&
		isSameContract(box)
	}
  
	def tokensRemaining(boxes: Coll[Box]): Long = 
		boxes
			.filter(isMaxRateChangeBox)
			.fold(0L, {(a:Long, b: Box) => a + b.tokens(0)._2}) 
	
	val tokensNewSellOrder: Long = tokensRemaining(OUTPUTS)
	val tokensSold: Long         = tokensIn - tokensNewSellOrder
  
	val nanoErgsPaid: Long = 
		OUTPUTS
		  .filter(isPaymentBox)
		  .fold(0L, {(a:Long, b: Box) => a + b.value})
  
	val avgTokenPrice : Long = (tokensIn * avgRateInputs - tokensNewSellOrder * maxSellRate) / (tokensIn - tokensNewSellOrder);
	val tokensInputAtMaxRate = sumTokensInAtMaxRate(INPUTS) 
	val sellOrderChangeBoxIsFine = tokensInputAtMaxRate > tokensNewSellOrder 
	val sellerPaid: Boolen = tokensSold * avgTokenPrice <= nanoErgsPaid
  
	val orderFilled = sellerPaid && sellOrderChangeBoxIsFine
  
	if(HEIGHT > unlockHeight(SELF)){
		getSellerPk(SELF)
	}else{
		getSellerPk(SELF) && getPoolPk(SELF) || sigmaProp(orderFilled) && getPoolPk(SELF)
	}
}`;

function compileContract() {
	const tree = compile(sellTokenForErg, {
		version: 0,
		includeSize: false
	});
	return tree.toAddress(Network.Mainnet).toString();
}

console.log(`export const sellOrderAddress = "${compileContract()}"`);
// "YyLFSBN184GYjBv4aH3q4tfwa7xdicpviowAM4MVVyWgbLKfpzWWXH4BPf5B3xepMb562S1R8UxBMtF4ZMp2FP3QVvQKDijPmNeiE3cbKXxTYDeE1EvwwB3paxQnQrnRjxtH9hjugjScENTHUwkCJVrr7muMnNVkXno1KboB73vWF4ujfnNCyooF4p72LMHsHUsFrps5vfQPaQm8Z2AHV3aXRtK14jTs2nTnZ7SoQsJZnyW9dXD9XSMP1KDEf2GdpgkzUhE5njFkW7XLg3E5CuxahW8LMY5e5F49ad5tNiBViCan2uUVMucrscgSYAX6YpWtiKuVYxVzm3oUZSwUTZpKWHfM9AtQ45yijrsmVmtkBQx6QT2EV394Ng3vNcM69SiS4rxUWaCKAsKWxF2VhiB17sy5M3CffpJqLGLnLpzGrYd6VyLLtMZn37rRi7ujGo2acgbcQ1iwTfuepFFNwCnAxUexWnkTS1NejRdRf4Yirie16i2rZKkpFMaC61SS8YS4P9qZcjLiHTc1Wn4Edn52qbTsyeWCrSQCcw5mZijoTXdEjkRJyvn3rngKn1h5gQNMd5FpmvAZthLVxJpCNtcAuYvXRsBSL79Eo1d5j331LUtknawqxVWDe3puZke9PR74z9h2kmfknM7Dq7BQTxFXN2nxHww8KLskRWNrMNHykt4xfiv3knayoNcvXbyDJLhYK653dwVymLnpH2LEqoAC7sunSCfShrqJQdB76NGUGZKqBRGpB"
