# Privacy Protocol Relayer (Rust)

High-performance relayer service for Privacy Protocol. It accepts proof payloads over HTTP, validates anti-theft and fee constraints, batches requests, and submits pool transactions on-chain (`withdraw` / `executeAction`).

## Features

- `POST /relay` JSON API for relay intake.
- Anti-theft check: `public_inputs[RELAYER_INDEX]` must match relayer wallet address.
- Fee check: request fee must cover `estimated_gas_cost * 1.1`.
- Smart batching worker:
  - submit immediately when queue length reaches batch size
  - submit when oldest request exceeds max wait
  - sleep when queue is empty
- Nonce management with retry for transient RPC errors.
- Graceful shutdown and mempool persistence to disk.
- Flashbots integration point marked with TODO in chain submission path.

## Quick Start

1. Copy env template:

```bash
cp .env.example .env
```

2. Fill `.env` values.

3. Run:

```bash
cargo run
```

Server starts on `RELAYER_BIND_ADDR` (default `0.0.0.0:8787`).

## Tests

Run:

```bash
cargo test
```

Included tests cover:

- relay intake acceptance and queueing
- anti-theft relayer address rejection
- worker submission and mempool acknowledgement

## API

### `POST /relay`

Request:

```json
{
  "proof": "0x...",
  "public_inputs": ["0x...", "0x..."],
  "metadata": {
    "client": "optional"
  }
}
```

Response:

```json
{
  "request_id": "uuid",
  "queue_len": 3,
  "gas_estimate": "123456",
  "min_required_fee_wei": "987654321"
}
```

Error codes:

- `400` malformed payload/public inputs
- `403` relayer address mismatch (anti-theft check failed)
- `422` simulation failed or fee too low
- `500` internal error

### `GET /health`

Response:

```json
{
  "status": "ok",
  "queue_len": 0
}
```

## Contract/Circuit Assumptions

The proving flow is expected to provide at least:

- one public input containing relayer address (bytes32-encoded address)
- one public input containing relayer fee in wei (`uint256`)

Relay metadata is expected to include:

- `operation`: `withdraw` or `executeAction`
- operation-specific fields required to build the target pool call

Set indices via:

- `RELAYER_PUBLIC_INPUT_RELAYER_INDEX`
- `RELAYER_PUBLIC_INPUT_FEE_INDEX`

## Persistence

Pending queue state is written to `RELAYER_MEMPOOL_PATH` on enqueue and after successful batch acknowledgements. On restart, queue state is restored from this file.
