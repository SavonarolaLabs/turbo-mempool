┌─────────────────────────┐              ┌─────────────────────────┐   
│  address: BOB           │              │  address: DEPOSIT       │   
│  value: 0.1Erg          │              │  value: 0.0989Erg       │   
│  assets:[{              │              │  assets:[{              │   
│   tokenId: Erdoge       │  ────┬────►  │   tokenId: Erdoge       │   
│   amount:  1000         │      │       │   amount:  1000         │   
│  ]}                     │      │       │  ]}                     │   
└─────────────────────────┘      │       │  additionalRegisters:{  │   
                                 │       │   R4: [BOB,POOL]        │   
                                 │       │   R5: unlockHeight      │   
                                 │       │  }                      │   
                                 │       └─────────────────────────┘   
                                 │       ┌─────────────────────────┐   
                                 │       │  address: BOB           │   
                                 ├────►  │  ...                    │   
                                 │       └─────────────────────────┘ 
                                 │       ┌─────────────────────────┐   
                                 │       │  address: FEE           │   
                                 └────►  │  value: 0.0011Erg       │   
                                         └─────────────────────────┘ 
