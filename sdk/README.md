# privacy-protocol

Privacy Protocol is a plug-and-play privacy middleware for EVM dApps.

This package exposes:

- `privacy-protocol/core`: low-level TypeScript SDK for private deposit, private execution, and private withdrawal
- `privacy-protocol/hooks`: React hooks built on top of the core SDK

The Noir circuit is bundled in the package. Users do not need to import a circuit artifact manually.

## Installation

```bash
npm install privacy-protocol ethers
```

For React integrations:

```bash
npm install react
```

No framework-specific aliasing is required. The package exports are configured for both ESM (`import`) and CommonJS (`require`) consumers, with browser-safe entrypoints for frontend builds. `@aztec/bb.js` is loaded lazily at runtime and Buffer BigInt compatibility methods are polyfilled automatically when missing.

## Integration Requirements

Before integration, ensure all of the following are available:

1. A deployed `PrivacyProtocolPool` address on the target chain
2. An RPC endpoint for that chain
3. An `ethers` provider and signer
4. Supported token addresses on that chain
5. Pool configuration that includes each token via `addSupportedToken`
6. User token balance and ERC20 approval to `poolAddress`
7. Storage for note data (`secret`, `nullifier`, `commitment`, `amount`, `txHash`)

## Core SDK

### Initialize

```ts
import { ethers } from "ethers";
import { PrivacyProtocolSDK } from "privacy-protocol/core";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const poolAddress = process.env.PRIVACY_PROTOCOL_POOL_ADDRESS as string;
const sdk = new PrivacyProtocolSDK(provider, poolAddress);
```

### Deposit

```ts
const signer = await provider.getSigner();
const tokenAddress = "0xTokenAddress";
const amount = ethers.parseUnits("10", 18);

const token = new ethers.Contract(
  tokenAddress,
  ["function approve(address spender, uint256 value) returns (bool)"],
  signer,
);

await (await token.approve(poolAddress, amount)).wait();

const depositResult = await sdk.deposit(tokenAddress, amount, signer);
```

`depositResult` returns:

- `secret`
- `nullifier`
- `commitment`
- `txHash`

### Withdraw

```ts
const leaves = await sdk.getLeaves();

const withdrawResult = await sdk.withdraw(
  tokenAddress,
  recipientAddress,
  amountToWithdraw,
  secret,
  nullifier,
  amountInPool,
  leaves,
  signer,
);
```

### Execute Private Action

```ts
const leaves = await sdk.getLeaves();
const actionId = ethers.keccak256(ethers.getBytes(secret));

const executeResult = await sdk.executeAction(
  tokenAddress,
  amountToSpend,
  targetContractAddress,
  encodedCallData,
  actionId,
  secret,
  nullifier,
  amountInPool,
  leaves,
  signer,
);
```

### Fetch Private Transaction Metadata

```ts
const txDetails = await sdk.getPrivateTransactionDetails(txHash);
```

## React Hooks

All hooks are exported from `privacy-protocol/hooks`.
Provide your own `ethers` `provider` and `signer`.

### usePrivacyProtocol

```ts
import { usePrivacyProtocol } from "privacy-protocol/hooks";

const { sdk, isReady } = usePrivacyProtocol({
  poolAddress,
  provider,
  signer,
});
```

### useDeposit

```ts
import { useDeposit } from "privacy-protocol/hooks";

const { deposit, data, note, isPending, error } = useDeposit({
  poolAddress,
  provider,
  signer,
});

await deposit({
  token: tokenAddress,
  amount,
});
```

### useWithdraw

```ts
import { useWithdraw } from "privacy-protocol/hooks";

const { withdraw, data, nextNote, isPending, error } = useWithdraw({
  poolAddress,
  provider,
  signer,
});

await withdraw({
  token: tokenAddress,
  recipient: recipientAddress,
  amount: withdrawAmount,
  note,
});
```

`note` can be replaced with explicit values:

- `secret`
- `nullifier`
- `amountInPool`

### useExecuteAction

```ts
import { useExecuteAction } from "privacy-protocol/hooks";

const { executeAction, data, nextNote, isPending, error } = useExecuteAction({
  poolAddress,
  provider,
  signer,
});

await executeAction({
  token: tokenAddress,
  amount: amountToSpend,
  target: targetContractAddress,
  data: encodedCallData,
  note,
});
```

### useCommitments

```ts
import { useCommitments } from "privacy-protocol/hooks";

const { commitments, refetch, isLoading, error } = useCommitments({
  poolAddress,
  provider,
  signer,
  fromBlock: 0,
});
```

### usePrivateTransactionDetails

```ts
import { usePrivateTransactionDetails } from "privacy-protocol/hooks";

const { data, isLoading, error, refetch } = usePrivateTransactionDetails({
  poolAddress,
  provider,
  signer,
  txHash,
});
```

### useLocalNotes

```ts
import { useLocalNotes } from "privacy-protocol/hooks";

const { notes, addNote, upsertNote, removeNote, clearNotes, getNoteByCommitment } =
  useLocalNotes();
```

## Minimal Integration Flow

1. Create SDK instance with `poolAddress` + `provider`
2. Approve token spend to `poolAddress`
3. Deposit and persist returned note data
4. Rebuild commitments with `getLeaves`
5. Execute private action or withdraw
6. Persist next note returned from execution
7. Display metadata via `getPrivateTransactionDetails` or `usePrivateTransactionDetails`

## Environment Configuration

Recommended variables:

```bash
RPC_URL=https://your-rpc-url
PRIVACY_PROTOCOL_POOL_ADDRESS=0xYourPoolAddress
```

For frontend apps:

```bash
NEXT_PUBLIC_PRIVACY_PROTOCOL_POOL_ADDRESS=0xYourPoolAddress
```

## Operational Notes

- The target contract in `executeAction` must support calls where `msg.sender` is the privacy proxy.
- `actionId` must be `keccak256(secret)` for private proxy withdrawal compatibility.
- Notes are required to continue private spending. Losing note data prevents recovery of shielded funds.
- `getLeaves` should be called against the same chain and pool where deposits occurred.

## Common Failure Cases

- `TokenNotSupported`: token has not been added to pool support list.
- `InvalidProof`: incorrect note values, stale leaves/root, or mismatched action context.
- `NullifierUsed`: note already spent.
- `InsufficientBalance`: attempting to spend more than note amount or pool token balance.

## Compatibility

- Ethers v6
- React 18 or React 19 for hooks
- EVM chains where the Privacy Protocol contracts are deployed
