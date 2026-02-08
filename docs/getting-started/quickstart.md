# Quickstart

This guide will walk you through the basic flow of initializing the SDK, depositing funds (shielding), and withdrawing them (unshielding).

## 1. Initialize the SDK

First, import the SDK and initialize it with an Ethers provider and the contract address.

```typescript
import { ethers } from "ethers";
import { PrivacyProtocolSDK } from "privacy-protocol-sdk"; // Adjust import path
import circuit from "./path/to/circuits.json";

const RPC_URL = "https://your-rpc-url.com";
const CONTRACT_ADDRESS = "0x..."; // Deployed PrivacyProtocolPool address

const provider = new ethers.JsonRpcProvider(RPC_URL);
const sdk = new PrivacyProtocolSDK(provider, CONTRACT_ADDRESS, circuit);
```

## 2. Shield Assets (Deposit)

To shield assets, you deposit tokens into the pool. This generates a secret note.

```typescript
// Get a signer (e.g., from a wallet)
const signer = await provider.getSigner();
const tokenAddress = "0x..."; // ERC20 Token Address
const amount = ethers.parseEther("1.0");

// Approve the pool to spend tokens
const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
await tokenContract.approve(CONTRACT_ADDRESS, amount);

// Deposit
const result = await sdk.deposit(tokenAddress, amount, signer);

console.log("Deposit successful!");
console.log("Secret:", result.secret);
console.log("Nullifier:", result.nullifier);
console.log("Commitment:", result.commitment);

// IMPORTANT: Save 'secret' and 'nullifier' securely! They are needed to access funds.
```

## 3. Unshield Assets (Withdraw)

To withdraw anonymously, you need the secret and nullifier from the deposit step.

```typescript
// Sync the Merkle Tree to get current state
const leaves = await sdk.getLeaves();

const recipient = "0x..."; // Fresh wallet address
const totalAmountInPool = amount; // The amount associated with the note

const withdrawResult = await sdk.withdraw(
  tokenAddress,
  recipient,
  amount, // Amount to withdraw
  result.secret,
  result.nullifier,
  totalAmountInPool,
  leaves,
  signer
);

console.log("Withdrawal successful!", withdrawResult.txHash);
// New secrets are generated for any remaining change (if partial withdraw)
console.log("New Secret:", withdrawResult.newSecret);
```
