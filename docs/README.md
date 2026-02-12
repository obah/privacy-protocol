# Privacy Protocol Documentation

Privacy Protocol is a relayer-first privacy middleware for EVM applications.

## What You Get

- `privacy-protocol/core`: low-level SDK methods.
- `privacy-protocol/hooks`: React hooks for private deposits, executes, and withdrawals.
- A relay lifecycle API for rendering `queued`, `submitted`, and `confirmed` transaction states in UI.

## Developer Quickstart

1. Install the SDK package: `npm install privacy-protocol ethers`.
2. Provide your deployed PrivacyProtocolPool address.
3. Configure your relayer URL and relayer address.
4. Execute private actions through the SDK (core methods or hooks).
5. Show relay status progression in your transaction history UI.

## Required Frontend Environment

- `NEXT_PUBLIC_PRIVACY_PROTOCOL_POOL_ADDRESS`
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_URL`
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_ENDPOINT` (optional, default `/relay`)
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_PUBLIC_INPUT_INDEX` (default `6`)
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_ADDRESS`
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_FEE_INPUT_INDEX` (default `7`)
- `NEXT_PUBLIC_PRIVACY_PROTOCOL_RELAYER_FEE_WEI`

## Relay Lifecycle

1. `queued`: SDK returns `txHash` as `relay:<request_id>`.
2. `submitted`: relayer has broadcast the on-chain transaction.
3. `confirmed`: transaction receipt resolved successfully or reverted.

Explorer views for private calls will show the relayer address as `tx.from`.

## Operators

Run a relayer node to power censorship resistance and earn relay fees:

- [`operators/run-relayer-node.md`](operators/run-relayer-node.md)

## References

- SDK integration and API examples: `sdk/README.md`
