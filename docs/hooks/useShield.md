# useShield Hook

The `useShield` hook is a React abstraction over the `sdk.deposit` method, simplifying the process of shielding assets in a frontend application.

## Example Implementation

Since this hook is part of the implementation layer, here is how you might construct it using the SDK:

```typescript
import { useState } from "react";
import { usePrivacySDK } from "./usePrivacySDK"; // Assumes you have a context/provider
import { ethers } from "ethers";

export const useShield = () => {
  const { sdk } = usePrivacySDK();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shield = async (tokenAddress: string, amount: string, signer: ethers.Signer) => {
    if (!sdk) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await sdk.deposit(tokenAddress, amount, signer);
      // Ideally, save result.secret and result.nullifier to local storage or state
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { shield, isLoading, error };
};
```

## Usage

```tsx
const { shield, isLoading } = useShield();

const handleDeposit = async () => {
  const receipt = await shield(
    "0xTokenAddress...",
    ethers.parseEther("10"),
    signer
  );
  console.log("Shielded Note Secret:", receipt.secret);
};
```
