Actions:

1. Deposit

2. Create Buy/Sell order

3. Execute Buy/Sell order

4. Cancel Buy/Sell order

5. Withdraw

---

..............................
Scenarios: (userA,userB,userC)

1. UserA:Deposit (10Erg,assets:{tokenId:Test1,amount:100})
2. UserB:Deposit (10Erg,assets:{tokenId:Test1,amount:100})
3. UserC:Deposit (10Erg,assets:{tokenId:Test1,amount:100})

4. UserA:Create Buy (10 Test2, Price:2, value: 20Erg)
5. UserA:Create Buy (10 Test2, Price:1, value: 10Erg)
6. UserB:Execute Buy (5 Test, Price:2, value: 10Erg)
7. UserC:Execute Buy (10 Test, Price:1.5, value:15Erg)

8. UserA: Cancel Buy (...)

9. Withdraw All...

..............................
