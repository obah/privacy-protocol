# useDeposit

`useDeposit` creates a private note by depositing into the pool.

## Basic Usage

```ts
import { useDeposit } from "privacy-protocol/hooks";

const { deposit, note, isPending, error } = useDeposit({
  poolAddress,
  provider,
  signer,
  relayer,
});

await deposit({
  token: tokenAddress,
  amount: amountWei,
});
```

## Returns

- `deposit(args)`: executes pool deposit and returns `DepositResult`.
- `note`: generated note object with `secret`, `nullifier`, `commitment`.
- `isPending`: request state.
- `error`: last error.
- `reset()`: clears local hook state.
