# Run a Relayer Node

This guide shows how to run a Privacy Protocol relayer in production.

## Why Run a Relayer

- Earn relay fees for private transactions your node submits.
- Strengthen protocol decentralization and censorship resistance.
- Provide privacy infrastructure with a lightweight Rust service.

## Prerequisites

- Rust stable toolchain (`rustup`, `cargo`).
- A funded EOA dedicated to relayer gas.
- RPC endpoint for the target chain.
- Deployed `PrivacyProtocolPool` address for that chain.

## 1. Configure Environment

Create `relayer/.env`:

```bash
RELAYER_RPC_URL=https://your-rpc-provider
RELAYER_PRIVATE_KEY=0xyour_relayer_private_key
FAN_POOL_ADDRESS=0xyour_privacy_protocol_pool
RELAYER_BIND_ADDR=0.0.0.0:8787
RELAYER_PUBLIC_INPUT_RELAYER_INDEX=6
RELAYER_PUBLIC_INPUT_FEE_INDEX=7
RELAYER_BATCH_SIZE=10
RELAYER_BATCH_MAX_WAIT_SECS=15
RELAYER_RETRY_MAX_ATTEMPTS=5
RELAYER_RETRY_BASE_DELAY_MS=500
RELAYER_MEMPOOL_PATH=./data/mempool.json
```

### Environment Variable Reference

- `RELAYER_RPC_URL`: Chain RPC endpoint.
- `RELAYER_PRIVATE_KEY`: Relayer signer used to pay gas and submit transactions.
- `FAN_POOL_ADDRESS`: PrivacyProtocolPool contract address.
- `RELAYER_BIND_ADDR`: HTTP bind address for API server.
- `RELAYER_PUBLIC_INPUT_RELAYER_INDEX`: `public_inputs` index containing relayer address.
- `RELAYER_PUBLIC_INPUT_FEE_INDEX`: `public_inputs` index containing relayer fee.
- `RELAYER_BATCH_SIZE`: Submit immediately when queue reaches this size.
- `RELAYER_BATCH_MAX_WAIT_SECS`: Submit if oldest queued request exceeds this age.
- `RELAYER_RETRY_MAX_ATTEMPTS`: Max retries for transient submission failures.
- `RELAYER_RETRY_BASE_DELAY_MS`: Base retry delay.
- `RELAYER_MEMPOOL_PATH`: Local persisted mempool file.

## 2. Build and Run

From repository root:

```bash
cd relayer
cargo build --release
```

Run locally:

```bash
cargo run --release
```

The relayer exposes:

- `POST /relay`
- `GET /relay/{request_id}`
- `GET /health`

## 3. Verify Node Health

```bash
curl http://127.0.0.1:8787/health
```

Expected response:

```json
{
  "status": "ok",
  "queue_len": 0
}
```

## 4. Production Deployment (Render Example)

1. Create a new Web Service from this repo.
2. Set Root Directory to `relayer`.
3. Build Command: `cargo build --release`.
4. Start Command: `RELAYER_BIND_ADDR=0.0.0.0:$PORT ./target/release/privacy-protocol-relayer`.
5. Add all `.env` values in Render Environment settings.
6. Fund the relayer signer with ETH on the target network.

## 5. Operator Security Checklist

- Use a dedicated relayer key, never a deployer key.
- Keep private key only in deployment secret manager.
- Monitor `GET /health` and submission failures.
- Rotate keys on incident and update configured relayer address in apps.
- Back up `RELAYER_MEMPOOL_PATH` if you need queue persistence guarantees.

## 6. Performance Tuning

- Lower `RELAYER_BATCH_SIZE` for faster UX and higher gas/tx.
- Increase `RELAYER_BATCH_SIZE` for better batching efficiency.
- Lower `RELAYER_BATCH_MAX_WAIT_SECS` to reduce tail latency.
- Adjust retry settings based on RPC reliability.
