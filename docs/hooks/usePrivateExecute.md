# usePrivateExecute Hook

The `usePrivateExecute` hook abstracts the complexity of the `sdk.executeAction` method. It handles fetching the latest Merkle tree leaves, generating the proof, and executing the transaction.

## Example Implementation

```typescript
import { useState } from "react";
import { usePrivacySDK } from "./usePrivacySDK";
import { ethers } from "ethers";

export const usePrivateExecute = () => {
  const { sdk } = usePrivacySDK();
  const [isExecuting, setIsExecuting] = useState(false);

  const execute = async (
    token: string,
    amount: string,
    target: string,
    data: string,
    note: { secret: string; nullifier: string; amount: string },
    signer: ethers.Signer
  ) => {
    if (!sdk) throw new Error("SDK not initialized");
    setIsExecuting(true);

    try {
      // 1. Fetch latest leaves
      const leaves = await sdk.getLeaves();

      // 2. Generate Action ID (random bytes32)
      const actionId = ethers.hexlify(ethers.randomBytes(32));

      // 3. Execute
      const result = await sdk.executeAction(
        token,
        amount,
        target,
        data,
        actionId,
        note.secret,
        note.nullifier,
        note.amount,
        leaves,
        signer
      );

      return result;
    } finally {
      setIsExecuting(false);
    }
  };

  return { execute, isExecuting };
};
```

## Usage

Use this hook to perform private interactions, such as swapping on Uniswap anonymously.

```tsx
const { execute, isExecuting } = usePrivateExecute();

const handleSwap = async () => {
  // Encoded calldata for the swap
  const swapData = "0x..."; 
  
  const result = await execute(
    usdcAddress,
    amountToSwap,
    uniswapRouterAddress,
    swapData,
    savedNote, // The note stored from a previous deposit
    signer
  );
  
  console.log("Private swap executed!", result.txHash);
};
```
