# Client Reference

`PrivacyProtocolSDK` is the core API for deposits, private actions, withdrawals, and relay lifecycle inspection.

## Constructor

```ts
new PrivacyProtocolSDK(provider, poolAddress, undefined, {
  relayer: {
    url: "https://your-relayer.example.com",
    endpoint: "/relay",
    relayerPublicInputIndex: 6,
    relayerAddress: "0xRelayerAddress",
    feePublicInputIndex: 7,
    relayerFeeWei: "1000000000000000",
  },
});
```

- `provider`: Ethers provider.
- `poolAddress`: deployed `PrivacyProtocolPool`.
- `circuit`: optional; SDK bundles default circuit.
- `options.relayer`: relayer transport settings used by private calls.

## `deposit`

```ts
await sdk.deposit(token, amount, signer);
```

Returns:

```ts
{
  secret: string;
  nullifier: string;
  commitment: string;
  txHash: string;
}
```

## `withdraw`

```ts
await sdk.withdraw(
  token,
  recipient,
  amount,
  secret,
  nullifier,
  amountInPool,
  leaves,
  signer,
  executionOptions
);
```

Returns an execution result containing updated note values and relay metadata.

## `executeAction`

```ts
await sdk.executeAction(
  token,
  amount,
  target,
  data,
  actionId,
  secret,
  nullifier,
  amountInPool,
  leaves,
  signer,
  executionOptions
);
```

`actionId` must be `keccak256(secret)`.

## `getLeaves`

```ts
await sdk.getLeaves(fromBlock);
```

Fetches current commitments used to rebuild the Merkle tree for proving.

## `getPrivateTransactionDetails`

```ts
await sdk.getPrivateTransactionDetails(txHashOrRelayId);
```

Accepts either:

- relay id format: `relay:<request_id>`
- on-chain tx hash: `0x...`

Returns normalized transaction metadata:

- `status`: `pending | success | reverted`
- `txHash`
- `initiator`
- `gasPayer`
- `to`
- `method`
- `parameters`
