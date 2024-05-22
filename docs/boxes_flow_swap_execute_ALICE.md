┌─────────────────────────┐              ┌─────────────────────────┐   
│  address: SWAP          │              │  address: DEPOSIT       │   
│  value: 0.0978Erg       │              │  value: 0.0978Erg       │   
│  assets:[{              │              │  assets:[{              │   
│   tokenId: Erdoge       │  ──┐   ┌──►  │   tokenId: Erdoge       │   
│   amount:  1000         │    │   │     │   amount:  1000         │   
│  }]                     │    │   │     │  }]                     │   
│  additionalRegisters:{  │    │   │     │  additionalRegisters:{  │   
│   R4: [BOB,POOL]        │    │   │     │   R4: [ALICE,POOL]      │   
│   R5: unlockHeight      │    │   │     │   R5: unlockHeight      │   
│   R6: [Erdoge,rsBTC]    │    │   │     │  }                      │
│   R7: swapRate          │    ├───┤     └─────────────────────────┘
│   R8: DEPOSIT           │    │   │     ┌─────────────────────────┐
│  }                      │    │   │     │  address: DEPOSIT       │
└─────────────────────────┘    │   │     │  value: 0.0978Erg       │
┌─────────────────────────┐    │   │     │  assets:[{              │
│  address: DEPOSIT       │    │   │     │   tokenId: rsBTC        │
│  value: 0.0989Erg       │  ──┘   ├──►  │   amount:  0.00001      │
│  assets:[{              │        │     │  }]                     │
│   tokenId: rsBTC        │        │     │  additionalRegisters:{  │
│   amount:  0.00001      │        │     │   R4: [BOB,POOL]        │
│  }]                     │        │     │   R5: unlockHeight      │
│  additionalRegisters:{  │        │     │   R6: [Erdoge,rsBTC]    │
│   R4: [ALICE,POOL]      │        │     │  }                      │
│   R5: unlockHeight      │        │     └─────────────────────────┘
│  }                      │        │     ┌─────────────────────────┐
└─────────────────────────┘        │     │  address: FEE           │
                                   └──►  │  value: 0.0011Erg       │
                                         └─────────────────────────┘