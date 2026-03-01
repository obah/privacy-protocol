# Privacy Protocol: ZK-Middleware for the EVM

Privacy Protocol is a developer-first middleware SDK that enables confidential execution for any EVM dApp. It allows developers to add an incognito path to their applications without requiring users to leave the host chain or developers to write custom ZK circuits.

By abstracting the complexity of Noir-based ZK-proofs and Rust relayers, we provide "Confidentiality-as-a-Service" for the next generation of privacy-preserving applications.

## The Problem

Current privacy solutions require developers to build on specific "privacy chains" or master complex cryptography. This creates fragmentation and high barriers to entry. Privacy Protocol fixes this by bringing privacy to where the liquidity and users already are—starting with the Arbitrum ecosystem.

## Key Features

- **Zero-Knowledge Abstraction**: Build with ZK-privacy using standard TypeScript/React hooks. No Noir or Solidity circuit-writing required.
- **Relayer-First Architecture**: Our Rust-based relayer completely decouples the user's wallet address from their on-chain action, ensuring 100% metadata privacy.
- **Note-Based Privacy Pool**: Robust deposit/withdrawal logic using a privacy pool for secure, anonymous asset management.
- **Ephemeral Proxies**: High-security execution path that prevents linkage between historical transactions and current actions.

## Tech Stack

| Layer     | Technology          | Role                                                   |
| --------- | ------------------- | ------------------------------------------------------ |
| Contracts | Solidity / Foundry  | Privacy pools, Verifiers, and Demo logic.              |
| Circuits  | Noir / Aztec        | Privacy-preserving proof generation and verification.  |
| SDK       | TypeScript / Ethers | Frontend integration (/core) and React Hooks (/hooks). |
| Relayer   | Rust / Axum / Tokio | Secure, off-chain batching and transaction submission. |
| Frontend  | Next.js / Tailwind  | Developer dashboard and demonstration suite.           |

## SDK Quick Start

Integrating privacy into your dApp is now a few lines of code:

```typescript
import { useDeposit, useExecuteAction } from "privacy-protocol/hooks";

const config = { poolAddress, provider, signer };
const { deposit } = useDeposit(config);
const { executeAction } = useExecuteAction(config);

const depositResult = await deposit({ token, amount });
const result = await executeAction({
  token,
  amount,
  target,
  data,
  secret: depositResult.secret,
  nullifier: depositResult.nullifier,
  amountInPool: amount,
});
```

## Roadmap

We are currently in a successful testing phase on Arbitrum Sepolia. Our goals for this funding cycle include:

- **Production Deployment**: Migrating core contracts to Ethereum Mainnet and Sepolia.
- **Relayer Decentralization**: Transitioning the Rust relayer into a permissionless network of operators.
- **Cross-Chain Capability**: Expanding the SDK to support seamless private transactions across multiple L2s.

## 🤝 Contributing

Thank you for considering contributing! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
