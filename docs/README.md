# Privacy Protocol

Privacy Protocol is now relayer-first for private actions.

## Notable Changes

- Private `executeAction` and private `withdraw` use relayer transport by default in the SDK.
- Private execution returns `relay:<request_id>` immediately after queueing.
- Frontend demo logs now include relay metadata:
  - request id
  - queue length
  - gas estimate
  - minimum required fee

## End-to-End Flow

1. User deposits into `PrivacyProtocolPool` on-chain.
2. User generates proof client-side with Noir + UltraHonk.
3. SDK submits `{ proof, public_inputs }` to relayer (`POST /relay`).
4. Relayer validates relayer-address input, validates fee, and queues request.
5. Worker submits batch to `FanPool.executeBatch(...)`.
6. Batched tx is mined and visible on explorer from relayer address.

## Frontend / dApp Integration

Set public env vars in your app:

- `NEXT_PUBLIC_PRIVACY_PROTOCOL_POOL_ADDRESS`
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_URL`
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_ENDPOINT`
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_PUBLIC_INPUT_INDEX`
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_ADDRESS`
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_FEE_INPUT_INDEX`
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_FEE_WEI`

## Registry Status

There is currently no on-chain or off-chain relayer operator registry implementation in this repository.

## Next Steps

- [Installation](getting-started/installation.md)
- [Quickstart](getting-started/quickstart.md)
