import { Network } from '@fleet-sdk/common';
import { compile } from '@fleet-sdk/compiler';

export const sellTokenForErg = `
{
	def getTokenId(box: Box)               = box.R4[Coll[Byte]].getOrElse(Coll[Byte]()) 
	def getSellRate(box: Box)              = box.R5[Long].get
	def getSellerMultisigAddress(box: Box) = box.R6[SigmaProp].get.propBytes
	def getSellerMultisigPk(box: Box)      = box.R6[SigmaProp].get
	def getSellerPk(box: Box)              = box.R7[SigmaProp].get
	def getPoolPk(box: Box)                = box.R8[SigmaProp].get
	def unlockHeight(box: Box)             = box.R9[Int].get

	def getTokenAmount(box: Box) = box.tokens(0)._2
  
	def isSameContract(box: Box) = 
		blake2b256(box.propositionBytes) == blake2b256(SELF.propositionBytes)
  
	def isSameToken(box: Box)    = 
		getTokenId(box) == getTokenId(SELF) &&
		box.tokens(0)._1 == getTokenId(SELF)
  
	def isSameSeller(box: Box)     = 
		getSellerMultisigAddress(box) == getSellerMultisigAddress(SELF)
  
	def legitBox(box: Box) = {
		isSameContract(box) && isSameToken(box) && isSameSeller(box) 
	}
  
	def isPaymentBox(box:Box) = {
		getSellerMultisigAddress(SELF) == box.propositionBytes &&
		getTokenId(SELF) == getTokenId(box)
	}
  
	def sumTokensIn(boxes: Coll[Box]): Long = 
		boxes
			.filter(legitBox) 
			.fold(0L, {(a:Long, b: Box) => a + b.tokens(0)._2})
  
	val tokensIn: Long           = sumTokensIn(INPUTS)
  
	val avgRateInputs: Long = INPUTS.filter(legitBox).fold(0L, {(a:Long, b: Box) => a + getSellRate(b)*getTokenAmount(b)}) / tokensIn 
	
	val maxSellRate = INPUTS.filter(legitBox).fold(0L, {(r:Long, box:Box) => {
	  if(r > getSellRate(box)) r else getSellRate(box)
	}})
  
	def sumTokensInAtMaxRate(boxes: Coll[Box]): Long = 
		boxes
			.filter(legitBox)
			.filter({(b: Box)=> getSellRate(b) == maxSellRate})
			.fold(0L, {(a:Long, b: Box) => a + b.tokens(0)._2})
  
	def isMaxRateChangeBox(box: Box) = 
		legitBox(box) && getSellRate(box) == maxSellRate 
  
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
		getSellerMultisigPk(SELF) || (sigmaProp(orderFilled) && getPoolPk(SELF))
	}
}`;

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
