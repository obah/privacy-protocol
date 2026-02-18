# privacy-protocol

Privacy Protocol is a relayer-first privacy middleware for EVM dApps.

Package exports:

- `privacy-protocol/core`: low-level SDK
- `privacy-protocol/hooks`: React hooks

No manual circuit import is required. The Noir circuit is bundled.

## Install

```bash
npm install privacy-protocol ethers
```

For React apps:

```bash
npm install react
```

## Core SDK (Quickstart)

```ts
import { ethers } from "ethers";
import { PrivacyProtocolSDK } from "privacy-protocol/core";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = await provider.getSigner();

const sdk = new PrivacyProtocolSDK(provider, process.env.PRIVACY_PROTOCOL_POOL_ADDRESS!);
```

Relayer transport is built in by default. You only pass `options.relayer` if you want to override the default endpoint or relayer metadata.

```ts
const sdkWithCustomRelayer = new PrivacyProtocolSDK(
  provider,
  process.env.PRIVACY_PROTOCOL_POOL_ADDRESS!,
  undefined,
  {
    relayer: {
      url: process.env.PRIVACY_PROTOCOL_RELAYER_URL,
      relayerAddress: process.env.PRIVACY_PROTOCOL_RELAYER_ADDRESS,
    },
  },
);
```

## Typical Flow

1. Approve token spend to `poolAddress`.
2. Deposit with `sdk.deposit(...)`.
3. Build leaves with `sdk.getLeaves()`.
4. Execute private action (`sdk.executeAction(...)`) or withdraw (`sdk.withdraw(...)`).
5. Persist returned note fields (`secret`, `nullifier`, `commitment`).

## Relay Lifecycle

Private `executeAction`/`withdraw` initially return:

- `txHash: "relay:<request_id>"`

As relayer submission progresses:

- request is queued (`queued`)
- on-chain tx is submitted (`submitted`)
- tx confirms (`success`/`reverted`)

Use:

```ts
const details = await sdk.getPrivateTransactionDetails(txHash);
```

If relayer has already submitted, this resolves to actual on-chain metadata (`tx.from`, gas payer, status, etc).

## React Hooks

```ts
import {
  useDeposit,
  useExecuteAction,
  useWithdraw,
  useCommitments,
  usePrivateTransactionDetails,
  useLocalNotes,
} from "privacy-protocol/hooks";
```

Minimal hook setup:

```ts
const common = {
  poolAddress,
  provider,
  signer,
};

const { deposit } = useDeposit(common);
const { executeAction } = useExecuteAction(common);
const { withdraw } = useWithdraw(common);
```

You can still pass `relayer` in hook options to override defaults per app.

## Required Inputs

- Deployed `PrivacyProtocolPool` address
- Ethers provider + signer
- Supported token address in pool
- Storage for note material and tx metadata

## Common Errors

- `InvalidRootHash`: stale leaves/root; refresh leaves and ensure latest SDK build.
- `InvalidProof`: mismatched note inputs or action context.
- `NullifierUsed`: note already spent.
- `TokenNotSupported`: token not added to pool.
