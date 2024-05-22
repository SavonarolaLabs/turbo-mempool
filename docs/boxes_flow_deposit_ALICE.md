┌─────────────────────────┐              ┌─────────────────────────┐   
│  address: ALICE         │              │  address: DEPOSIT       │   
│  value: 0.1Erg          │              │  value: 0.0989Erg       │   
│  assets:[{              │              │  assets:[{              │   
│   tokenId: rsBTC        │  ────┬────►  │   tokenId: rsBTC        │   
│   amount:  0.00001      │      │       │   amount:  0.00001      │   
│  }]                     │      │       │  }]                     │   
└─────────────────────────┘      │       │  additionalRegisters:{  │   
                                 │       │   R4: [ALICE,POOL]      │   
                                 │       │   R5: unlockHeight      │   
                                 │       │  }                      │   
                                 │       └─────────────────────────┘   
                                 │       ┌─────────────────────────┐   
                                 │       │  address: ALICE         │   
                                 ├────►  │  ...                    │   
                                 │       └─────────────────────────┘ 
                                 │       ┌─────────────────────────┐   
                                 │       │  address: FEE           │   
                                 └────►  │  value: 0.0011Erg       │   
                                         └─────────────────────────┘ 
