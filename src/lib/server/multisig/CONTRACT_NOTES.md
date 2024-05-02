{
//Sell ShitCoin -> take erg
val sellAssetId : Long = SELF.R4[Long].get
val sellAssetRate : Int = SELF.R5[Int].get // int? long?
val sellerPK : SigmaProp = SELF.R6[SigmaProp].get

ADDITIONAL:
Return to Contract owner
Total assets cost in 1 order/box/seller -> more than 1 nanoerg
Rate > 0 //amount > 0
PROCESS Boxes with /R4/R5...

SCENARII 0: (SELLERS:1 , BOXes:1, BUYER:Take ALL)
{
SELLER(0):
box (value:0,02ERG, assets{id:"123124151",amount:100}).
R4: "123124151" // TokenId
R5: "0.05" // TokenRate. 1 asset = 0.05 ERG | 1 erg = 20 asset
R6: "9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU"// SellerPK // MultisigPK?

//-----------------------
INPUT(0) = Bank(0) // чекаем
INPUT(1) = BUYER() // не чекаем

OUTPUTS(0)= SELLER(0) // чекаем
Box (value: 5 ERG)

OUTPUTS(1)= BUYER(0)
Box (value: Min, assets{id:"123124151",amount:"100"})

//CHECK:
var assetId = INPUT(0).R4
var assetRate = INPUT(0).R5
var currentSale = assetRate \* BUYER(0).assets(id==123124151,amount:"100")

УСЛОВИЯ ДЛЯ ПРОХОЖДЕНИЯ ОРДЕРА
1 Проверяем что достаточно заплатил:
var assetAmount = INPUT(0).assets(0).\_2
var assetRate = INPUT(0).R5[Long].get
var initialValue = INPUT(0).value

var orderValue = initialValue + assetAmount \* assetRate
var payedValue = OUTPUTS(0).value // min Box value?
orderValue == payedValue

2 Что оплата ушла кому надо
var SellerPk [SigmaProp]= INPUT(0).R6[SigmaProp].get // R? Compile?
OUTPUTS(0).propositionBytes == SellerPk

3 Только один бокс снимается с контракта
OUTPUTS(0).R4[Coll[Byte]].get == SELF.id // ?

// 1 + 3
Сумма всех инпутов с контракта --- Сумме всех аутпутов из контракта - продавцу PK
R4+R5+R6 - нашего формата?
Sum Input value + assets amount \* prices. == Sum Outputs value
(filter R6 == SellerPK) (filter OUTPUTS == SellerPK)
price>0
id == assetId

УСЛОВИЯ ДЛЯ ВОЗВРАТА ОРДЕРА 1. ОПЛАТА и ВОЗВРАТ продавцу
var SellerPk [SigmaProp]= INPUT(0).R6[SigmaProp].get // R? Compile? 1. Полное покрытие
Filter Contract Filter Seller
Sum Input assets Sum Output assets  
 Sum Input value Sum Output assets
2 Частичное покрытие
delta \* price
}

SCENARII 1: (SELLERS:1 , BOXes:1, BUYER:Take 30%)
{

INPUT(0) = Bank(0) // чекаем
INPUT(1) = BUYER(0) // не чекаем

OUTPUTS(0)= BANK(0) // чекаем
Box (value: 5 ERG,
assets {id:"123124151",amount:"70"} )

OUTPUTS(1)= BUYER(0)
Box (value: Min,
assets{id:"123124151",amount:"30"})

CHECK:
Sum Input value + assets amount \* prices. == Sum Outputs value
(filter R6 == SellerPK) (filter OUTPUTS == BANK)
price>0
id == assetId

    delta ASSETS
    Sum Input assets input  ==  Sum Outputs assets output + delta
    (filter R6 == SellerPK)                (filter OUTPUTS == BANK)
     id == assetId

    //bad solution...
    (some a VS some b)
    OUTPUT(a).R4 = INPUT(b).R4
    OUTPUT(a).R5 = INPUT(b).R5
    OUTPUT(a).R6 = INPUT(b).R6
    // Надо гарантировать что пользователь не добавит больше необходимых боксов
    // не сможет перезаписать боксы на контракте (раздув инпут через добавление лишних ордеров)
    // Предположение: либо пройдут боксы с одинаковой ценой (только), либо остальные будут перезаписываться

}

problem example:{
100: price
100: price 1.5
100: price 2
100: price 4

    150: price 1
    100: price 1
    100: price 1
    100: price 1

}

    // !!! HOW TO SOLVE AVERAGE PRICE ABUSE PROBLEM... ()
    //probably good solution...
    (min input Boxes required == delta assets)
    // !!! Мультиасет можно ли заскамить если объединить боксы на контракте с разными ассетами

SCENARII: A: (SELLERS:1 , BOXes:3, Type:DifferentPrices, BUYER:Take ALL)
{  
 SELLER(0):
box (Id: 1;Amount: 100;Price: 1)
box (Id: 2;Amount: 100;Price: 2)
box (Id: 3;Amount: 100;Price: 5)
BUYER(...):

OUTPUTS(0)= SELLER(0)
OUTPUTS(1)= BUYER(0)
}

SCENARII: B.1: (SELLERS:2)
{
//BUYER take all
SELLER(0):
box (Id: 1;Amount: 100;Price: 1)
box (Id: 2;Amount: 100;Price: 2)
box (Id: 3;Amount: 100;Price: 5)
SELLER(1):
box (Id: 1;Amount: 100;Price: 1)
box (Id: 2;Amount: 100;Price: 2)
box (Id: 3;Amount: 100;Price: 5)

OUTPUTS(0)= SELLER(0)
OUTPUTS(1)= SELLER(1)
OUTPUTS(2)= BUYER(0)
}

SCENARII: B.2: (SELLERS:2)
{
//BUYER
SELLER(0):
box (Id: 1;Amount: 100;Price: 1) // 100%
box (Id: 2;Amount: 100;Price: 2) // 100%
box (Id: 3;Amount: 100;Price: 5) // 100%
SELLER(1):
box (Id: 1;Amount: 100;Price: 1) // 100%
box (Id: 2;Amount: 100;Price: 2) // 100%
box (Id: 3;Amount: 100;Price: 5) // 20%

OUTPUTS(0)= SELLER(0)
OUTPUTS(1)= BANK(1)
OUTPUTS(2)= BUYER(0)
}

SCENARII: B.3: (SELLERS:2)
{
//BUYER
SELLER(0):
box (Id: 1;Amount: 100;Price: 1) // 100%
box (Id: 2;Amount: 100;Price: 2) // 100%
box (Id: 3;Amount: 100;Price: 5) // 10%
SELLER(1):
box (Id: 1;Amount: 100;Price: 1) // 100%
box (Id: 2;Amount: 100;Price: 2) // 100%
box (Id: 3;Amount: 100;Price: 5) // ---

OUTPUTS(0)= BANK(0) // amount dif + value in ERG + R
OUTPUTS(1)= BANK(1) // amount dif + value in ERG + R
OUTPUTS(2)= BUYER(0). // amount + value in ERG
}

SCENARII: C: (SELLERS:1 , BOXes:3, Type:SAME, BUYER:Take ALL)
{  
 SELLER(0):
box (Id: 1;Amount: 100;Price: 1)
box (Id: 2;Amount: 200;Price: 1)
box (Id: 3;Amount: 300;Price: 1)
BUYER(...)
}

//--------------------TEMP-------------------
val bankBoxIn = SELF

    val bankBoxOut = OUTPUTS(0)
    val receiptBox = OUTPUTS(1)

    // Assets amount In = Assets amount out
    // SELF id

    INPUTS(0) //bank box
    OUTPUTS(0) //bank box

    //BOX 1 TO BUYER
    	OUTPUTS(0).propositionBytes == hodlerPK.propBytes &&
    		OUTPUTS(0).value >= repaymentNanoErg &&
    		//OUTPUTS(0).R4[Coll[Byte]].get == SELF.id

    //BOX 2 BACK TO CONTRACT (R4-R5, assets, value)
      //if Enough to bank
      OUTPUTS(1).propositionBytes == hodlerPK.propBytes &&
    		OUTPUTS(1).value >= repaymentNanoErg &&
    		OUTPUTS(1).R4[Coll[Byte]].get == SELF.id
      // else empty

}
