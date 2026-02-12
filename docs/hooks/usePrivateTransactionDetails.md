# usePrivateTransactionDetails

`usePrivateTransactionDetails` resolves relay lifecycle and on-chain metadata for private transactions.

## Basic Usage

```ts
import { usePrivateTransactionDetails } from "privacy-protocol/hooks";

const { data, isLoading, error, refetch } = usePrivateTransactionDetails({
  poolAddress,
  provider,
  relayer,
  txHash, // relay:<request_id> or on-chain 0x hash
  enabled: true,
});
```

## Returned Metadata

- `status`: `pending | success | reverted`
- `txHash`: on-chain hash when available
- `initiator`
- `gasPayer`
- `to`
- `method`
- `parameters`
