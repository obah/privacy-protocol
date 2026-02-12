# Quickstart

This guide shows the minimal relayer-first integration flow.

## 1. Initialize the SDK

```typescript
import { ethers } from "ethers";
import { PrivacyProtocolSDK } from "privacy-protocol/core";

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const sdk = new PrivacyProtocolSDK(
  provider,
  process.env.NEXT_PUBLIC_PRIVACY_PROTOCOL_POOL_ADDRESS!,
  undefined,
  {
    relayer: {
      url: process.env.NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_URL!,
      endpoint:
        process.env.NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_ENDPOINT ?? "/relay",
      relayerPublicInputIndex: Number(
        process.env.NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_PUBLIC_INPUT_INDEX ??
          "6"
      ),
      relayerAddress:
        process.env.NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_ADDRESS!,
      feePublicInputIndex: Number(
        process.env.NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_FEE_INPUT_INDEX ?? "7"
      ),
      relayerFeeWei:
        process.env.NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_FEE_WEI ??
        "1000000000000000",
    },
  }
);
```

## 2. Deposit (Shield)

```ts
const tokenAddress = "0x...";
const amount = ethers.parseEther("1.0");
const poolAddress = process.env.NEXT_PUBLIC_PRIVACY_PROTOCOL_POOL_ADDRESS!;
const token = new ethers.Contract(
  tokenAddress,
  ["function approve(address spender,uint256 amount) external returns (bool)"],
  signer
);
await token.approve(poolAddress, amount);

// Deposit
const result = await sdk.deposit(tokenAddress, amount, signer);
```

Persist `result.secret`, `result.nullifier`, and `result.commitment` securely.

## 3. Execute a Private Action

```ts
const leaves = await sdk.getLeaves();
const actionResult = await sdk.executeAction(
  tokenAddress,
  amount,
  "0xTargetContract",
  "0xEncodedCalldata",
  ethers.keccak256(result.secret),
  result.secret,
  result.nullifier,
  amount,
  leaves,
  signer
);
```

`actionResult.txHash` returns a relay lifecycle id like `relay:<request_id>` first, then maps to on-chain tx metadata when submitted.

## 4. Track Relay Lifecycle

```ts
const details = await sdk.getPrivateTransactionDetails(actionResult.txHash);
console.log(details.status); // queued | submitted | confirmed
console.log(details.txHash); // on-chain hash when submitted
```
