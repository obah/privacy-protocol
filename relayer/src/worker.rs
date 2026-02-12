use crate::state::AppState;
use chrono::Utc;
use std::time::Duration;
use tokio::time::sleep;
use tokio_util::sync::CancellationToken;
use tracing::{error, info, warn};
use crate::models::RelayRequestStatus;

const EMPTY_QUEUE_SLEEP_MS: u64 = 1_000;
const NON_EMPTY_QUEUE_SLEEP_MS: u64 = 300;
const SUBMIT_FAILURE_SLEEP_SECS: u64 = 2;

pub async fn run_batch_worker(state: AppState, shutdown: CancellationToken) {
    info!(
        batch_size = state.config.batch_size,
        max_wait_secs = state.config.batch_max_wait_secs,
        "relay batch worker started"
    );

    loop {
        if shutdown.is_cancelled() {
            break;
        }

        let (queue_len, should_submit) = {
            let mempool = state.mempool.read().await;
            let len = mempool.len();
            let oldest_age_secs = mempool.oldest_age_secs(Utc::now()).unwrap_or(0);
            let due_to_size = len >= state.config.batch_size;
            let due_to_age = len > 0 && oldest_age_secs >= state.config.batch_max_wait_secs as i64;
            (len, due_to_size || due_to_age)
        };

        if !should_submit {
            let sleep_for = if queue_len == 0 {
                Duration::from_millis(EMPTY_QUEUE_SLEEP_MS)
            } else {
                Duration::from_millis(NON_EMPTY_QUEUE_SLEEP_MS)
            };

            tokio::select! {
                _ = shutdown.cancelled() => break,
                _ = sleep(sleep_for) => {}
            }
            continue;
        }

        let batch = {
            let mempool = state.mempool.read().await;
            mempool.snapshot_batch(state.config.batch_size)
        };

        if batch.is_empty() {
            continue;
        }

        let mut hit_failure = false;
        for item in &batch {
            match state.chain.submit_item(item).await {
                Ok(tx_hash) => {
                    let mut mempool = state.mempool.write().await;
                    if let Err(error) = mempool.acknowledge_batch(1) {
                        error!(
                            tx_hash = %tx_hash,
                            request_id = %item.id,
                            error = %error,
                            "item submitted but failed to persist mempool ack"
                        );
                        hit_failure = true;
                        break;
                    }
                    let queue_len = mempool.len();
                    drop(mempool);

                    {
                        let mut statuses = state.relay_statuses.write().await;
                        statuses.insert(item.id, RelayRequestStatus::Submitted { tx_hash });
                    }

                    info!(
                        tx_hash = %tx_hash,
                        request_id = %item.id,
                        queue_len,
                        "relay request submitted successfully"
                    );
                }
                Err(error) => {
                    warn!(
                        request_id = %item.id,
                        error = %error,
                        "relay request submission failed; item left in queue"
                    );
                    hit_failure = true;
                    break;
                }
            }
        }

        if hit_failure {
            tokio::select! {
                _ = shutdown.cancelled() => break,
                _ = sleep(Duration::from_secs(SUBMIT_FAILURE_SLEEP_SECS)) => {}
            }
        }
    }

    info!("relay batch worker stopped");
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        chain::{ChainClient, FeeEstimate},
        config::RelayerConfig,
        mempool::RelayMempool,
        models::{PendingRelayItem, RelayRequest},
        state::AppState,
    };
    use anyhow::Result;
    use async_trait::async_trait;
    use chrono::Utc;
    use ethers::{
        abi::{encode, Token},
        types::{Address, TxHash, U256},
    };
    use std::{collections::HashMap, path::PathBuf, sync::Arc, time::Duration};
    use tokio::sync::{Mutex, RwLock};
    use tokio::time::{sleep, timeout};
    use uuid::Uuid;

    struct MockChain {
        relayer: Address,
        submitted_request_ids: Mutex<Vec<[u8; 32]>>,
    }

    impl MockChain {
        async fn submit_count(&self) -> usize {
            self.submitted_request_ids.lock().await.len()
        }
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
                min_required_fee_wei: U256::from(1u64),
            })
        }

        async fn submit_item(&self, item: &PendingRelayItem) -> Result<TxHash> {
            let hash_bytes = item
                .public_inputs
                .first()
                .copied()
                .unwrap_or([0u8; 32]);
            self.submitted_request_ids.lock().await.push(hash_bytes);
            Ok(TxHash::from_low_u64_be(11))
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
        std::env::temp_dir().join(format!(
            "privacy-relayer-worker-test-{}.json",
            Uuid::new_v4()
        ))
    }

    fn test_config(path: PathBuf) -> Arc<RelayerConfig> {
        Arc::new(RelayerConfig {
            rpc_url: "http://127.0.0.1:8545".to_string(),
            private_key: "0x00".to_string(),
            fan_pool_address: Address::zero(),
            bind_addr: "127.0.0.1:0".parse().expect("valid bind addr"),
            relayer_public_input_index: 0,
            fee_public_input_index: 1,
            batch_size: 1,
            batch_max_wait_secs: 15,
            retry_max_attempts: 2,
            retry_base_delay_ms: 10,
            mempool_path: path,
        })
    }

    fn to_pending_item(relayer: Address, fee: U256) -> PendingRelayItem {
        RelayRequest {
            proof: "0x1234".to_string(),
            public_inputs: vec![encode_address_word(relayer), encode_u256_word(fee)],
            metadata: None,
        }
        .into_pending(1, Utc::now())
        .expect("valid pending relay item")
    }

    async fn build_state(relayer: Address) -> (AppState, Arc<MockChain>) {
        let config = test_config(test_mempool_path());
        let mempool =
            RelayMempool::load_or_create(config.mempool_path.clone()).expect("mempool init");
        let chain_impl = Arc::new(MockChain {
            relayer,
            submitted_request_ids: Mutex::new(Vec::new()),
        });
        let chain: Arc<dyn ChainClient> = chain_impl.clone();

        (
            AppState {
                config,
                chain,
                mempool: Arc::new(RwLock::new(mempool)),
                relay_statuses: Arc::new(RwLock::new(HashMap::new())),
            },
            chain_impl,
        )
    }

    #[tokio::test]
    async fn worker_submits_and_acknowledges_batch() {
        let relayer = Address::from_low_u64_be(99);
        let (state, chain) = build_state(relayer).await;

        {
            let mut mempool = state.mempool.write().await;
            mempool
                .push(to_pending_item(relayer, U256::from(1000u64)))
                .expect("enqueue pending item");
        }

        let shutdown = CancellationToken::new();
        let handle = tokio::spawn(run_batch_worker(state.clone(), shutdown.clone()));

        timeout(Duration::from_secs(3), async {
            loop {
                if chain.submit_count().await > 0 {
                    break;
                }
                sleep(Duration::from_millis(25)).await;
            }
        })
        .await
        .expect("worker should submit queued batch");

        shutdown.cancel();
        handle.await.expect("worker task should finish cleanly");

        assert_eq!(chain.submit_count().await, 1);
        assert_eq!(state.mempool.read().await.len(), 0);
        assert_eq!(state.relay_statuses.read().await.len(), 1);
    }
}
