# useWithdraw

`useWithdraw` spends a private note and withdraws to a recipient address.

## Basic Usage

```ts
import { useWithdraw } from "privacy-protocol/hooks";

const { withdraw, nextNote, isPending, error } = useWithdraw({
  poolAddress,
  provider,
  signer,
  relayer,
});

await withdraw({
  token: tokenAddress,
  recipient: recipientAddress,
  amount: amountWei,
  note: existingNote,
});
```

## Notes

- You can pass `secret` + `nullifier` directly, or pass `note`.
- If `leaves` are omitted, the hook fetches latest leaves automatically.
- `nextNote` stores any remaining private balance from partial spend.
