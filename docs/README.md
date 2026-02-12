# Privacy Protocol Documentation

Privacy Protocol lets dApps route sensitive actions through a privacy pool + relayer flow so user actions are harder to link directly to their wallet activity.

## Developer Quickstart

1. Install the SDK in your app.
2. Configure your deployed pool address.
3. Configure relayer URL + relayer address.
4. Use SDK core methods or React hooks for private actions.
5. Render relay lifecycle state in your transaction UI.

## Required App Configuration

Set these in your frontend environment:

- `NEXT_PUBLIC_PRIVACY_PROTOCOL_POOL_ADDRESS`
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_URL`
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_ENDPOINT` (optional, default `/relay`)
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_PUBLIC_INPUT_INDEX` (default `6`)
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_ADDRESS`
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_FEE_INPUT_INDEX` (default `7`)
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_FEE_WEI`

## Private Transaction Lifecycle

Private actions are relayed in three observable stages:

1. `queued`: SDK returns `txHash` as `relay:<request_id>`.
2. `submitted`: relayer broadcasts on-chain tx; request maps to real `0x...` tx hash.
3. `confirmed`: chain receipt is successful (or reverted).

In explorer, submitted private actions show the relayer as `tx.from` and proxy-mediated execution on target contracts.

## Integration Paths

- SDK Core: `privacy-protocol/core`
- React Hooks: `privacy-protocol/hooks`

Use the SDK README for full code examples:

- `sdk/README.md`
