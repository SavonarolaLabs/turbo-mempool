import { Network } from '@fleet-sdk/common';
import { compile } from '@fleet-sdk/compiler';

export const swapTokens = `{	
	def getSellerPk(box: Box)              = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
	def getPoolPk(box: Box)                = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
	def unlockHeight(box: Box)             = box.R5[Int].get
	def getSellingTokenId(box: Box)        = box.R6[Coll[Coll[Byte]]].getOrElse(Coll(Coll[Byte](),Coll[Byte]()))(0)
	def getBuyingTokenId(box: Box)         = box.R6[Coll[Coll[Byte]]].getOrElse(Coll(Coll[Byte](),Coll[Byte]()))(1)
	def getRate(box: Box)                  = box.R7[Long].get
	def getSellerMultisigAddress(box: Box)  = box.R8[Coll[Byte]].get

	def tokenId(box: Box) = 
	  box.tokens(0)._1
	def tokenAmount(box: Box) = 
	  box.tokens(0)._2

	def isSameContract(box: Box) = 
		  box.propositionBytes == SELF.propositionBytes

  def isSameTokenPair (box: Box) = 
		  getSellingTokenId(SELF) == getSellingTokenId(box) &&
		  getBuyingTokenId(SELF)  == getBuyingTokenId(box)

	def hasSellingToken(box: Box) = 
		  getSellingTokenId(SELF) == getSellingTokenId(box) &&
		  box.tokens.size > 0 &&
		  getSellingTokenId(SELF) == tokenId(box)

	def hasBuyingToken(box: Box) = 
		  getBuyingTokenId(SELF) == getBuyingTokenId(box) &&
		  box.tokens.size > 0 &&
		  getBuyingTokenId(SELF) == tokenId(box)

  def isGreaterZeroRate(box:Box) =
	  getRate(box) > 0

	def isSameSeller(box: Box)   = 
	  getSellerPk(SELF) == getSellerPk(box) &&
	  getPoolPk(SELF) == getPoolPk(box)

  def isSameUnlockHeight(box: Box)  = 
	  unlockHeight(SELF) == unlockHeight(box)

  def isSameMultisig(box: Box)    =
	  getSellerMultisigAddress(SELF) == getSellerMultisigAddress(box)

	def isLegitInput(box: Box) =
	  isSameContract(box) &&
	  isSameSeller(box) &&
	  isSameUnlockHeight(box) && 
	  isSameTokenPair(box) &&
	  hasSellingToken(box) && // add this check ot other contracts! else you can do right registers and fake token(?)
	  isGreaterZeroRate(box) &&
	  isSameMultisig(box)

	val maxSellRate: Long = INPUTS
	  .filter(isLegitInput)
	  .fold(0L, {(r:Long, box:Box) => {
			if(r > getRate(box)) r else getRate(box)
		}})

  def hasMaxSellRate(box: Box) =
	  getRate(box) == maxSellRate

  def isLegitSellOrderOutput(box: Box) =
	  isLegitInput(box)&&
	  hasMaxSellRate(box)

	def isPaymentBox(box:Box) =
		  isSameSeller(box) &&
	  isSameUnlockHeight(box) &&
		  hasBuyingToken(box) &&
		  getSellerMultisigAddress(SELF) == box.propositionBytes

  def sumSellTokensIn(boxes: Coll[Box]): Long = boxes
			.filter(isLegitInput) 
			.fold(0L, {(a:Long, b: Box) => a + tokenAmount(b)})

  def sumSellTokensOut(boxes: Coll[Box]): Long = boxes
	  .filter(isLegitSellOrderOutput)
	  .fold(0L, {(a:Long, b: Box) => a + tokenAmount(b)})

  def sumBuyTokensPaid(boxes: Coll[Box]): Long = boxes
			.filter(isPaymentBox) 
			.fold(0L, {(a:Long, b: Box) => a + tokenAmount(b)})
  
  val tokensSold = sumSellTokensIn(INPUTS) - sumSellTokensOut(OUTPUTS)
  val tokensPaid = sumBuyTokensPaid(OUTPUTS)

  val inSellTokensXRate = INPUTS
	  .filter(isLegitInput) 
			.fold(0L, {(a:Long, b: Box) => a + getRate(b)*tokenAmount(b)})
  val outSellTokensXRate = OUTPUTS
	  .filter(isLegitSellOrderOutput)
	  .fold(0L, {(a:Long, b: Box) => a + tokenAmount(b)})

  val sellTokensXRate = inSellTokensXRate - outSellTokensXRate
  val expectedRate = sellTokensXRate / tokensSold

  val isPaidAtFairRate = tokensSold/tokensPaid >= expectedRate 

	if(HEIGHT > unlockHeight(SELF)){
		getSellerPk(SELF)
	}else{
		getSellerPk(SELF) && getPoolPk(SELF) || sigmaProp(isPaidAtFairRate) && getPoolPk(SELF)
	}
}`;

function compileContract() {
	const tree = compile(swapTokens, {
		version: 0,
		includeSize: false
	});
	return tree.toAddress(Network.Mainnet).toString();
}

console.log(`export const swapTokensAddress = "${compileContract()}"`);
// "EY6QviSZUcZPg9WukwaSVqv1T2oh6t2EX1eQPoqsFjqzmNeKx64nbK5fsRrNXsyQTbcxX7ryfpqxpYfx2MrU2LhX5YCxJcvGXechX9MNBv7XLNZ1gFZ48PVjL7DHafJ5AT24FUBrCm5LxE1fn6j2tXCnXghPdZuxScaav45Cww97cNhV8YXJMimaMPvXkxyM8xRYmmnvfaLHg2BL4WV9Wa2dBs9Md1uhgH2Enhbre3uGFPnsfyeE1apo2Z8m7cYAgajsmWoUvHHa3ErugYASZJB3VRfeahEc6iBpBLPb8a3SrPgLmicpTsvXAzGTRueSDFSGRti76eJW797xHRbEJFpDWaUS4XCQERmjcJCPG3oh3LMXFo5VakW8LxHro7YedSWH2Z7z6eR4aX5xXuPfCwSbyLBiL6avzxjZsjMKHbTY8SqPFkGp3NWxdbf2WXBa3yrqRSTTEXjqhDkXzwDvnrsk3vttwGYq6t8PEvPT3MCEed5LnRyd2YDr4pxbATr2MChpqGXR9MXWFaS29bfjqxVfu7jmZ8bixy9dwnxp4MW8HtREnfiJJNt2kgbrmTxgqhgbmdNGjUGRnmCtZHJBRQEfMnwTruREiayQ7gLv3rwCg49wwnJLLDsWL8pnwigWGeqFKndeThM2CmEYtXR97rg1MxrVsKmbHsr9V2mCF3HYKKGeFkeLYVDR5p1bZjwwi8FtaXVSwfrpiLEWMViCwuq76MsaCxEas9hp4LzCGkMhwbu77oWHq8jE3BN9w2P6NKZPvNCSt92Ya8nFYzfaBuH3ZoBESxAvhdmoSVTgJNanE9HUMf3Xp7LMcABA2qRT9TWzgwBiV7ovJiPkNZZjCDwnpyXrV3mSnhscGi5RYwCkjv6FV3R6TEXCEU6oFwCBKo6p68XVf5ERqkqMUDStdVxTTY82KSQDmpd2r9opVRJcbmHCYhvM7Ur8mnG2ewDvZ5cD6LN6pENh3E1t57vhRQsDGYZG465JskpJER3zYmfuFBYn4z7GUFQgnPgbLYrg3PYyN9zx6DmdkLuUaxdh"
