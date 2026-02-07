# PrivacyProtocolPool SDK

This SDK allows developers to interact with the Privacy Protocol middleware contract.

## Installation

Ensure you have the dependencies installed:

```bash
npm install ethers @aztec/bb.js @noir-lang/noir_js
```

## Usage

### Initialization

```typescript
import { PrivacyProtocolPoolSDK } from "./sdk";
import circuit from "./sdk/circuits.json" assert { type: "json" };

const provider = new ethers.JsonRpcProvider("RPC_URL");
const contractAddress = "DEPLOYED_CONTRACT_ADDRESS";

const sdk = new PrivacyProtocolPoolSDK(provider, contractAddress, circuit);
```

### Deposit

```typescript
const signer = await provider.getSigner();
// Approve token first!
await tokenContract.connect(signer).approve(contractAddress, amount);

const { secret, nullifier, commitment, txHash } = await sdk.deposit(
  tokenAddress,
  amount,
  signer,
);
console.log("Save these secrets!", secret, nullifier);
```

### Withdraw

```typescript
// Sync Merkle Tree leaves (from events)
const leaves = await sdk.getLeaves();

const { txHash, newSecret, newNullifier } = await sdk.withdraw(
  tokenAddress,
  recipientAddress,
  amountToWithdraw,
  secret, // Saved from deposit
  nullifier, // Saved from deposit
  totalAmountInPool, // The original deposited amount (or current UTXO amount)
  leaves,
  signer,
);
```

### Execute Action

```typescript
const leaves = await sdk.getLeaves();

const { txHash, newSecret, newNullifier, proxyAddress } =
  await sdk.executeAction(
    tokenAddress,
    amountToSpend,
    targetContractAddress,
    encodedCallData,
    actionId, // Unique ID for action
    secret,
    nullifier,
    totalAmountInPool,
    leaves,
    signer,
  );

console.log("Proxy deployed at, this should be saved also:", proxyAddress);
```
