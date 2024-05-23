# Smart Contracts

The project includes smart contracts for Deposit, Swap, Buy, and Sell operations. These contracts ensure secure and transparent transactions, minimizing the risk of potential bugs and malicious activities.

### 1. Deposit Contract

```scala
{
  def getSellerPk(box: Box)              = box.R4[Coll[SigmaProp]].get(0)
  def getPoolPk(box: Box)                = box.R4[Coll[SigmaProp]].get(1)
  def unlockHeight(box: Box)             = box.R5[Int].get

  if(HEIGHT > unlockHeight(SELF)){
    getSellerPk(SELF)
  } else {
    getSellerPk(SELF) && getPoolPk(SELF)
  }
}
```

### 2. Swap Contract

```scala
{
  def getSellerPk(box: Box)               = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
  def getPoolPk(box: Box)                 = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
  def unlockHeight(box: Box)              = box.R5[Int].get
  def getSellingTokenId(box: Box)         = box.R6[(Coll[Byte],Coll[Byte])].getOrElse((Coll[Byte](),Coll[Byte]()))._1
  def getBuyingTokenId(box: Box)          = box.R6[(Coll[Byte],Coll[Byte])].getOrElse((Coll[Byte](),Coll[Byte]()))._2
  def getRate(box: Box)                   = box.R7[Long].get
  def getSellerMultisigAddress(box: Box)  = box.R8[Coll[Byte]].get

  def tokenId(box: Box) = box.tokens(0)._1
  def tokenAmount(box: Box) = box.tokens(0)._2
  def sumTokenAmount(a: Long, b: Box) = a + tokenAmount(b)
  def sumTokenAmountXRate(a: Long, b: Box) = a + tokenAmount(b) * getRate(b)

  def isSameContract(box: Box) =
    box.propositionBytes == SELF.propositionBytes

  def isSameTokenPair(box: Box) =
    getSellingTokenId(SELF) == getSellingTokenId(box) &&
    getBuyingTokenId(SELF) == getBuyingTokenId(box)

  def hasSellingToken(box: Box) =
    getSellingTokenId(SELF) == getSellingTokenId(box) &&
    box.tokens.size > 0 &&
    getSellingTokenId(SELF) == tokenId(box)

  def hasBuyingToken(box: Box) =
    getBuyingTokenId(SELF) == getBuyingTokenId(box) &&
    box.tokens.size > 0 &&
    getBuyingTokenId(SELF) == tokenId(box)

  def isGreaterZeroRate(box: Box) =
    getRate(box) > 0

  def isSameSeller(box: Box) =
    getSellerPk(SELF) == getSellerPk(box) &&
    getPoolPk(SELF) == getPoolPk(box)

  def isSameUnlockHeight(box: Box) =
    unlockHeight(SELF) == unlockHeight(box)

  def isSameMultisig(box: Box) =
    getSellerMultisigAddress(SELF) == getSellerMultisigAddress(box)

  def isLegitInput(box: Box) =
    isSameContract(box) &&
    isSameSeller(box) &&
    isSameUnlockHeight(box) &&
    isSameTokenPair(box) &&
    hasSellingToken(box) &&
    isGreaterZeroRate(box) &&
    isSameMultisig(box)

  val maxSellRate: Long = INPUTS
    .filter(isLegitInput)
    .fold(0L, {(r: Long, box: Box) => {
      if (r > getRate(box)) r else getRate(box)
    }})

  def hasMaxSellRate(box: Box) =
    getRate(box) == maxSellRate

  def isLegitSellOrderOutput(box: Box) =
    isLegitInput(box) &&
    hasMaxSellRate(box)

  def isPaymentBox(box: Box) =
    isSameSeller(box) &&
    isSameUnlockHeight(box) &&
    hasBuyingToken(box) &&
    getSellerMultisigAddress(SELF) == box.propositionBytes

  def sumSellTokensIn(boxes: Coll[Box]): Long = boxes
    .filter(isLegitInput)
    .fold(0L, sumTokenAmount)

  def sumSellTokensOut(boxes: Coll[Box]): Long = boxes
    .filter(isLegitSellOrderOutput)
    .fold(0L, sumTokenAmount)

  def sumBuyTokensPaid(boxes: Coll[Box]): Long = boxes
    .filter(isPaymentBox)
    .fold(0L, sumTokenAmount)

  val tokensSold = sumSellTokensIn(INPUTS) - sumSellTokensOut(OUTPUTS)
  val tokensPaid = sumBuyTokensPaid(OUTPUTS)

  val inSellTokensXRate = INPUTS
    .filter(isLegitInput)
    .fold(0L, sumTokenAmountXRate)

  val outSellTokensXRate = OUTPUTS
    .filter(isLegitSellOrderOutput)
    .fold(0L, sumTokenAmountXRate)

  val sellTokensXRate = inSellTokensXRate - outSellTokensXRate
  val expectedRate = sellTokensXRate / tokensSold

  val isPaidAtFairRate = tokensPaid / tokensSold >= expectedRate

  if (HEIGHT > unlockHeight(SELF)) {
    getSellerPk(SELF)
  } else {
    getSellerPk(SELF) && getPoolPk(SELF) || sigmaProp(isPaidAtFairRate) && getPoolPk(SELF)
  }
}
```

### 3. Buy Contract

```scala
{
  def getBuyerPk(box: Box)               = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
  def getPoolPk(box: Box)                = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
  def unlockHeight(box: Box)             = box.R5[Int].get
  def getTokenId(box: Box)               = box.R6[Coll[Byte]].getOrElse(Coll[Byte]())
  def getBuyRate(box: Box)               = box.R7[Long].get
  def getBuyerMultisigAddress(box: Box)  = box.R8[Coll[Byte]].get

  def tokenId(box: Box) =
    box.tokens(0)._1
  def tokenAmount(box: Box) =
    box.tokens(0)._2

  def isSameContract(box: Box) =
    box.propositionBytes == SELF.propositionBytes

  def isSameTokenId(box: Box) =
    getTokenId(SELF) == getTokenId(box)

  def includesToken(box: Box) =
    getTokenId(SELF) == getTokenId(box) &&
    box.tokens.size > 0 &&
    getTokenId(SELF) == tokenId(box)

  def isGreaterZeroRate(box: Box) =
    getBuyRate(box) > 0

  def isSameBuyer(box: Box) =
    getBuyerPk(SELF) == getBuyerPk(box) &&
    getPoolPk(SELF) == getPoolPk(box)

  def isSameUnlockHeight(box: Box) =
    unlockHeight(SELF) == unlockHeight(box)

  def isSameMultisig(box: Box) =
    getBuyerMultisigAddress(SELF) == getBuyerMultisigAddress(box)

  def isLegitBuyOrderInput(box: Box) =
    isSameBuyer(box) &&
    isSameUnlockHeight(box) &&
    isSameTokenId(box) &&
    isGreaterZeroRate(box) &&
    isSameMultisig(box) &&
    isSameContract(box)

  val minBuyRate = INPUTS
    .filter(isLegitBuyOrderInput)
    .fold(0L, {(r: Long, box: Box) => {
      if (r < getBuyRate(box)) r else getBuyRate(box)
    }})

  def isLegitBuyOrderOutput(box: Box) =
    isLegitBuyOrderInput(box) &&
    minBuyRate == getBuyRate(box)

  def isPaymentBox(box: Box) =
    isSameBuyer(box) &&
    isSameUnlockHeight(box) &&
    includesToken(box) &&
    getBuyerMultisigAddress(SELF) == box.propositionBytes

  def sumValuesIn(boxes: Coll[Box]): Long = boxes
    .filter(isLegitBuyOrderInput)
    .fold(0L, {(a: Long, b: Box) => a + b.value})

  def sumValuesOut(boxes: Coll[Box]): Long = boxes
    .filter(isLegitBuyOrderOutput)
    .fold(0L, {(a: Long, b: Box) => a + b.value})

  def sumAmountsIn(boxes: Coll[Box]): Long = boxes
    .filter(isLegitBuyOrderInput)
    .fold(0L, {(a: Long, b: Box) => a + b.value / getBuyRate(b)})

  def sumAmountsOut(boxes: Coll[Box]): Long = boxes
    .filter(isLegitBuyOrderOutput)
    .fold(0L, {(a: Long, b: Box) => a + b.value / getBuyRate(b)})

  val valuesIn: Long = sumValuesIn(INPUTS)
  val amountsIn: Long = sumAmountsIn(INPUTS)

  val valuesOut: Long = sumValuesOut(OUTPUTS)
  val amountsOut: Long = sumAmountsOut(OUTPUTS)

  val deltaAmounts = amountsIn - amountsOut
  val deltaValues = valuesIn - valuesOut

  def tokensBought(boxes: Coll[Box]): Long = boxes
    .filter(isPaymentBox)
    .fold(0L, {(a: Long, b: Box) => a + tokenAmount(b)})

  val sentToBuyer = tokensBought(OUTPUTS)
  val isBuyerPaid = deltaAmounts <= sentToBuyer

  if (HEIGHT > unlockHeight(SELF)) {
    getBuyerPk(SELF)
  } else {
    getBuyerPk(SELF) && getPoolPk(SELF) || sigmaProp(isBuyerPaid) && getPoolPk(SELF)
  }
}
```

### 4. Sell Contract

```scala
{
  def getSellerPk(box: Box)              = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
  def getPoolPk(box: Box)                = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
  def unlockHeight(box: Box)             = box.R5[Int].get
  def getTokenId(box: Box)               = box.R6[Coll[Byte]].getOrElse(Coll[Byte]())
  def getSellRate(box: Box)              = box.R7[Long].get
  def getSellerMultisigAddress(box: Box) = box.R8[Coll[Byte]].get

  def tokenId(box: Box) = box.tokens(0)._1
  def tokenAmount(box: Box) = box.tokens(0)._2

  def isSameContract(box: Box) =
    box.propositionBytes == SELF.propositionBytes

  def isSameToken(box: Box) =
    getTokenId(SELF) == getTokenId(box) &&
    box.tokens.size > 0 &&
    getTokenId(SELF) == tokenId(box)

  def isGreaterZeroRate(box: Box) =
    getSellRate(box) > 0

  def isSameSeller(box: Box) =
    getSellerPk(SELF) == getSellerPk(box) &&
    getPoolPk(SELF) == getPoolPk(box)

  def isSameUnlockHeight(box: Box) =
    unlockHeight(SELF) == unlockHeight(box)

  def isSameMultisig(box: Box) =
    getSellerMultisigAddress(SELF) == getSellerMultisigAddress(box)

  def isLegitInputBox(b: Box) = {
    isSameContract(b) &&
    isSameToken(b) &&
    isSameMultisig(b) &&
    isSameSeller(b) &&
    isGreaterZeroRate(b)
  }

  def isPaymentBox(box: Box) = {
    isSameSeller(box) &&
    isSameUnlockHeight(box) &&
    getTokenId(SELF) == getTokenId(box) &&
    getSellerMultisigAddress(SELF) == box.propositionBytes
  }

  def sumTokensIn(boxes: Coll[Box]): Long = boxes
    .filter(isLegitInputBox)
    .fold(0L, {(a: Long, b: Box) => a + b.tokens(0)._2})

  val tokensIn: Long = sumTokensIn(INPUTS)

  val avgRateInputs: Long = INPUTS
    .filter(isLegitInputBox)
    .fold(0L, {(a: Long, b: Box) => {
      a + getSellRate(b) * tokenAmount(b)
    }}) / tokensIn

  val maxSellRate = INPUTS
    .filter(isLegitInputBox)
    .fold(0L, {(r: Long, box: Box) => {
      if (r > getSellRate(box)) r else getSellRate(box)
    }})

  def sumTokensInAtMaxRate(boxes: Coll[Box]): Long = boxes
    .filter(isLegitInputBox)
    .filter({(b: Box) => getSellRate(b) == maxSellRate})
    .fold(0L, {(a: Long, b: Box) => a + tokenAmount(b)})

  def isMaxRateChangeBox(box: Box) = {
    isSameSeller(box) &&
    isSameUnlockHeight(box) &&
    isSameToken(box) &&
    maxSellRate == getSellRate(box) &&
    isSameMultisig(box) &&
    isSameContract(box)
  }

  def tokensRemaining(boxes: Coll[Box]): Long = boxes
    .filter(isMaxRateChangeBox)
    .fold(0L, {(a: Long, b: Box) => a + tokenAmount(b)})

  val tokensBack: Long = tokensRemaining(OUTPUTS)
  val tokensSold: Long = tokensIn - tokensBack

  val nanoErgsPaid: Long = OUTPUTS
    .filter(isPaymentBox)
    .fold(0L, {(a: Long, b: Box) => a + b.value})

  val valueOfSoldTokens: Long = tokensIn * avgRateInputs - tokensBack * maxSellRate
  val amountOfSoldTokens: Long = tokensIn - tokensBack
  val avgTokenPrice: Long = valueOfSoldTokens / amountOfSoldTokens

  val tokensInputAtMaxRate = sumTokensInAtMaxRate(INPUTS)
  val sellOrderChangeBoxIsFine = tokensInputAtMaxRate > tokensBack
  val sellerPaid: Boolean = tokensSold * avgTokenPrice <= nanoErgsPaid

  val orderFilled = sellerPaid && sellOrderChangeBoxIsFine

  if (HEIGHT > unlockHeight(SELF)) {
    getSellerPk(SELF)
  } else {
    getSellerPk(SELF) && getPoolPk(SELF) || sigmaProp(orderFilled) && getPoolPk(SELF)
  }
}
```
