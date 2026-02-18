# Privacy Protocol

Privacy Protocol is a relayer-first privacy middleware for EVM dApps built on Arbitrum.  
It lets developers easily build confidential dApps by adding an incognito execution path to new and existing dApps without rewriting their core contracts or building custom ZK systems from scratch.

## What It Includes

- Privacy pool contracts for note-based private execution.
- Noir circuits for proof generation and verification.
- Browser-ready TypeScript SDK package (`privacy-protocol`) with `privacy-protocol/core` and `privacy-protocol/hooks`.
- Rust relayer service for batching and on-chain submission.
- Next.js demo frontend (DAO voting + DeFi swap) showing public vs private flow.

## Tech Stack

| Layer     | Stack                                                            |
| --------- | ---------------------------------------------------------------- |
| Contracts | Solidity, Foundry                                                |
| Circuits  | Noir, Poseidon dependency                                        |
| SDK       | TypeScript, Ethers, `@noir-lang/noir_js`, `@aztec/bb.js`, `tsup` |
| Relayer   | Rust, Axum, Tokio, Ethers-rs, Serde, Tracing                     |
| Frontend  | Next.js, TypeScript, Wagmi, Viem, ConnectKit, Tailwind CSS       |

## Deployments (Arbitrum Sepolia)

Chain ID: `421614`

| Contract            | Address                                      |
| ------------------- | -------------------------------------------- |
| PrivacyProtocolPool | `0xA0806cf43f5E9A2C42c8291676EE814b39A6413e` |
| DemoDao             | `0x0B25AbD0136f6Ed5C220604Ec27026522515194f` |
| DemoDefi            | `0xA8DCc58D83Cae0FfF1076832Ef7E5a5D9B96D9d7` |
| HonkVerifier        | `0x4eE4661b8Ad32Ca08fED028Fe1490303f6D61BDA` |

Source: `contracts/src/Constants.sol`

### Public Infra Endpoints

- Relayer endpoint: `https://privacy-protocol-relayer.onrender.com/relay`
- Explorer: `https://sepolia.arbiscan.io`
- Docs site: `https://privacy-protocol-hi8x.vercel.app/docs`

## Frontend Setup (Only)

This section is only for running the demo frontend locally, after cloning the repo.

### 1. Install dependencies

```bash
cd frontend
npm install --legacy-peer-deps
```

### 2. Configure environment

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_WALLET_ID=<your_walletconnect_project_id>
NEXT_PUBLIC_ALCHEMY_ID=<your_alchemy_api_key>
```

Optional overrides:

```bash
NEXT_PUBLIC_DOCS_URL=https://privacy-protocol-hi8x.vercel.app/docs
NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_URL=https://privacy-protocol-relayer.onrender.com
NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_ENDPOINT=/relay
```

### 3. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

### 4. Production build check

```bash
npm run build
npm start
```
