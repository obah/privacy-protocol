# useExecuteAction

`useExecuteAction` performs private arbitrary calls through the pool and relayer.

## Basic Usage

```ts
import { useExecuteAction } from "privacy-protocol/hooks";

const { executeAction, nextNote, isPending, error } = useExecuteAction({
  poolAddress,
  provider,
  signer,
  relayer,
});

await executeAction({
  token: tokenAddress,
  amount: amountWei,
  target: targetContract,
  data: calldata,
  note: existingNote,
});
```

## Notes

- If `actionId` is omitted, the hook derives it as `keccak256(secret)`.
- If `leaves` are omitted, the hook fetches them via `sdk.getLeaves()`.
- `nextNote` is generated from the remaining private balance after execution.
