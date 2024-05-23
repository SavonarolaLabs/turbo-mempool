# Abstract

**CrystalPoolL1: Realtime Order-Based Exchange**

**Authors:** c8, savonarola  
**Contact:** c8e4@proton.me  
**Date:** May 23, 2024

The objective of CrystalPoolL1 is to develop a self-custodial exchange that offers a user experience (UX) comparable to centralized exchanges (CEX) while ensuring transparent Know Your Asset (KYA) protocols. This project is part of the Ergohack initiative and aims to deliver a comprehensive solution comprising a user interface (UI) for trading, an order book management system, and core functionalities for handling and storing chains of unpublished transactions.

**Key Components:**

1. **Transaction Processing System**: Manages the processing and storage of chains of unpublished transactions.
2. **Information Exchange System**: Facilitates the creation of correct multisignatures.
3. **Integrated Wallet Functions**: Provides initial user convenience and interaction with smart contracts.
4. **User Interface**: Enables order creation, execution, and tracking of balances and active operations.

**Model and Mechanism:**
CrystalPool enables real-time exchange transactions on Layer 1 (L1) through the integration of time-limited multisig smart contracts, a headless wallet, and strategic UX decisions. Self-custody is achieved by requiring both the user's public key (userPK) and the pool's public key (poolPK) to sign operations before a specified time limit. After this time limit, the userPK gains full control over the operations.

**Real-Time User Experience:**
CrystalPool provides real-time balance and state updates. Each trading action generates a new transaction, maintained in a chain of temporary, unpublished signed transactions. These transactions are published asynchronously in the background, ensuring a seamless trading experience.

**Built-in Wallet:**
To enhance user experience, a built-in wallet is introduced. This open-source exchange UI manages user balances based on DEPOSIT, SWAP, BUY, and SELL Boxes. The one-click swap order feature automates the process, making it efficient and user-friendly.

**Know Your Asset (KYA) Protocol:**
All transactions are settled on L1 and incur a transaction fee. CrystalPool maintains a public set of unsubmitted transactions, with real-time balance calculations based on the latest known state. Security is ensured as CrystalPool cannot move user balances without the userPK. In case of service shutdown, users can withdraw their deposits/orders after the unlockHeight period.

**Smart Contracts:**
The project includes smart contracts for Deposit, Swap, Buy, and Sell operations. These contracts ensure secure and transparent transactions, minimizing the risk of potential bugs and malicious activities.

**Risk Vectors and Mitigations:**
The project identifies potential risks associated with smart contracts, the built-in wallet, and the management of unsubmitted transactions. Mitigation strategies include thorough testing, public availability of unsubmitted transactions, and user control over transactions post-unlockHeight.
