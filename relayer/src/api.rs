use crate::{
    errors::ApiError,
    models::{decode_relayer_address, HealthResponse, RelayQueuedResponse, RelayRequest},
    state::AppState,
};
use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use chrono::Utc;
use tracing::{info, warn};

pub fn build_router(state: AppState) -> Router {
    Router::new()
        .route("/relay", post(relay))
        .route("/health", get(health))
        .with_state(state)
}

pub async fn relay(
    State(state): State<AppState>,
    Json(payload): Json<RelayRequest>,
) -> Result<Json<RelayQueuedResponse>, ApiError> {
    let item = payload
        .into_pending(state.config.fee_public_input_index, Utc::now())
        .map_err(|error| ApiError::BadRequest(error.to_string()))?;

    let relayer_word = item
        .public_inputs
        .get(state.config.relayer_public_input_index)
        .ok_or_else(|| {
            ApiError::BadRequest(format!(
                "public_inputs missing relayer index {}, len={}",
                state.config.relayer_public_input_index,
                item.public_inputs.len()
            ))
        })?;

    let requested_relayer = decode_relayer_address(relayer_word).map_err(|error| {
        ApiError::BadRequest(format!(
            "failed to decode relayer address public input: {error:#}"
        ))
    })?;
    let expected_relayer = state.chain.relayer_address();

    if requested_relayer != expected_relayer {
        warn!(
            request_id = %item.id,
            expected_relayer = %expected_relayer,
            requested_relayer = %requested_relayer,
            "relay request rejected due to relayer mismatch"
        );
        return Err(ApiError::Forbidden(
            "public_inputs relayer address does not match this relayer".to_string(),
        ));
    }

    let estimate = state
        .chain
        .estimate_single_request_fee(&item)
        .await
        .map_err(|error| ApiError::Unprocessable(format!("relay simulation failed: {error:#}")))?;

    if item.relayer_fee_wei < estimate.min_required_fee_wei {
        return Err(ApiError::Unprocessable(format!(
            "relayer fee {} is below required minimum {}",
            item.relayer_fee_wei, estimate.min_required_fee_wei
        )));
    }

    let request_id = item.id;
    let queue_len = {
        let mut mempool = state.mempool.write().await;
        mempool
            .push(item)
            .map_err(|error| ApiError::Internal(format!("failed to enqueue request: {error:#}")))?
    };

    info!(
        request_id = %request_id,
        queue_len,
        gas_estimate = %estimate.gas_estimate,
        gas_price = %estimate.gas_price,
        min_required_fee = %estimate.min_required_fee_wei,
        "relay request queued"
    );

    Ok(Json(RelayQueuedResponse {
        request_id,
        queue_len,
        gas_estimate: estimate.gas_estimate.to_string(),
        min_required_fee_wei: estimate.min_required_fee_wei.to_string(),
    }))
}

pub async fn health(State(state): State<AppState>) -> Json<HealthResponse> {
    let queue_len = state.mempool.read().await.len();
    Json(HealthResponse {
        status: "ok",
        queue_len,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        chain::{ChainClient, FeeEstimate},
        config::RelayerConfig,
        mempool::RelayMempool,
        models::PendingRelayItem,
    };
    use anyhow::Result;
    use async_trait::async_trait;
    use ethers::{
        abi::{encode, Token},
        types::{Address, TxHash, U256},
    };
    use std::{path::PathBuf, sync::Arc};
    use tokio::sync::{Mutex, RwLock};
    use uuid::Uuid;

    struct MockChain {
        relayer: Address,
        min_required_fee_wei: U256,
        submit_count: Mutex<u64>,
    }

    #[async_trait]
    impl ChainClient for MockChain {
        fn relayer_address(&self) -> Address {
            self.relayer
        }

        async fn estimate_single_request_fee(
            &self,
            _item: &PendingRelayItem,
        ) -> Result<FeeEstimate> {
            Ok(FeeEstimate {
                gas_estimate: U256::from(100_000u64),
                gas_price: U256::from(1u64),
                min_required_fee_wei: self.min_required_fee_wei,
            })
        }

        async fn submit_item(&self, _item: &PendingRelayItem) -> Result<TxHash> {
            let mut guard = self.submit_count.lock().await;
            *guard += 1;
            Ok(TxHash::from_low_u64_be(1))
        }
    }

    fn encode_address_word(address: Address) -> String {
        let encoded = encode(&[Token::Address(address)]);
        format!("0x{}", hex::encode(encoded))
    }

    fn encode_u256_word(value: U256) -> String {
        let encoded = encode(&[Token::Uint(value)]);
        format!("0x{}", hex::encode(encoded))
    }

    fn test_mempool_path() -> PathBuf {
        std::env::temp_dir().join(format!("privacy-relayer-test-{}.json", Uuid::new_v4()))
    }

    fn test_config(path: PathBuf) -> Arc<RelayerConfig> {
        Arc::new(RelayerConfig {
            rpc_url: "http://127.0.0.1:8545".to_string(),
            private_key: "0x00".to_string(),
            fan_pool_address: Address::zero(),
            bind_addr: "127.0.0.1:0".parse().expect("valid bind addr"),
            relayer_public_input_index: 0,
            fee_public_input_index: 1,
            batch_size: 10,
            batch_max_wait_secs: 15,
            retry_max_attempts: 2,
            retry_base_delay_ms: 10,
            mempool_path: path,
        })
    }

    fn test_request(relayer: Address, fee: U256) -> RelayRequest {
        RelayRequest {
            proof: "0x1234".to_string(),
            public_inputs: vec![encode_address_word(relayer), encode_u256_word(fee)],
            metadata: None,
        }
    }

    async fn build_state(relayer: Address, min_required_fee_wei: U256) -> AppState {
        let config = test_config(test_mempool_path());
        let mempool =
            RelayMempool::load_or_create(config.mempool_path.clone()).expect("mempool init");
        let chain_impl = Arc::new(MockChain {
            relayer,
            min_required_fee_wei,
            submit_count: Mutex::new(0),
        });
        let chain: Arc<dyn ChainClient> = chain_impl;

        AppState {
            config,
            chain,
            mempool: Arc::new(RwLock::new(mempool)),
        }
    }

    #[tokio::test]
    async fn relay_queues_valid_request() {
        let relayer = Address::from_low_u64_be(42);
        let state = build_state(relayer, U256::from(100u64)).await;

        let response = relay(
            State(state.clone()),
            Json(test_request(relayer, U256::from(500u64))),
        )
        .await
        .expect("relay request should be accepted");

        assert_eq!(response.0.queue_len, 1);
        assert_eq!(state.mempool.read().await.len(), 1);
    }

    #[tokio::test]
    async fn relay_rejects_relayer_mismatch() {
        let expected_relayer = Address::from_low_u64_be(42);
        let wrong_relayer = Address::from_low_u64_be(43);
        let state = build_state(expected_relayer, U256::from(100u64)).await;

        let result = relay(
            State(state.clone()),
            Json(test_request(wrong_relayer, U256::from(500u64))),
        )
        .await;

        match result {
            Err(ApiError::Forbidden(_)) => {}
            other => panic!("expected forbidden error, got {other:?}"),
        }

        assert_eq!(state.mempool.read().await.len(), 0);
    }
}
