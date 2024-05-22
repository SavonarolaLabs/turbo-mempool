┌─────────────────────────┐              ┌─────────────────────────┐   
│  address: DEPOSIT       │              │  address: SWAP          │   
│  value: 0989Erg         │              │  value: 0978Erg         │   
│  assets:[{              │              │  assets:[{              │   
│   tokenId: Erdoge       │  ────┬────►  │   tokenId: Erdoge       │   
│   amount:  1000         │      │       │   amount:  1000         │   
│  ]}                     │      │       │  ]}                     │   
│  additionalRegisters:{  │      │       │  additionalRegisters:{  │   
│   R4: [BOB,POOL]        │      │       │   R4: [BOB,POOL]        │   
│   R5: unlockHeight      │      │       │   R5: unlockHeight      │   
│  }                      │      │       │   R6: [Erdoge,rsBTC]    │
└─────────────────────────┘      │       │   R7: swapRate          │
                                 │       │   R8: DEPOSIT           │  
                                 │       │  }                      │
                                 │       └─────────────────────────┘   
                                 │       ┌─────────────────────────┐   
                                 │       │  address: FEE           │   
                                 └────►  │  value: 0.0011Erg       │   
                                         └─────────────────────────┘ 
