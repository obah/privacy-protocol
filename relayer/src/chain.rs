use crate::{config::RelayerConfig, models::PendingRelayItem};
use anyhow::{anyhow, Context, Result};
use async_trait::async_trait;
use ethers::{
    contract::{abigen, ContractError},
    middleware::SignerMiddleware,
    providers::{Http, Middleware, Provider},
    signers::{LocalWallet, Signer},
    types::{Address, Bytes, TxHash, U256},
};
use std::{str::FromStr, sync::Arc, time::Duration};
use tokio::{sync::Mutex, time::sleep};
use tracing::{debug, warn};

abigen!(
    FanPool,
    r#"[
        function executeBatch(bytes[] proofs, bytes32[][] publicInputs) external
    ]"#
);

type WalletClient = SignerMiddleware<Provider<Http>, LocalWallet>;

#[derive(Debug, Clone)]
pub struct FeeEstimate {
    pub gas_estimate: U256,
    pub gas_price: U256,
    pub min_required_fee_wei: U256,
}

pub struct ChainService {
    config: Arc<RelayerConfig>,
    client: Arc<WalletClient>,
    contract: FanPool<WalletClient>,
    relayer_address: Address,
    nonce: Mutex<Option<U256>>,
}

#[async_trait]
pub trait ChainClient: Send + Sync {
    fn relayer_address(&self) -> Address;
    async fn estimate_single_request_fee(&self, item: &PendingRelayItem) -> Result<FeeEstimate>;
    async fn submit_batch(&self, batch: &[PendingRelayItem]) -> Result<TxHash>;
}

impl ChainService {
    pub async fn new(config: Arc<RelayerConfig>) -> Result<Self> {
        let provider = Provider::<Http>::try_from(config.rpc_url.clone())
            .context("failed to create HTTP provider")?
            .interval(Duration::from_millis(700));

        let chain_id = provider
            .get_chainid()
            .await
            .context("failed to fetch chain id")?
            .as_u64();

        let wallet = LocalWallet::from_str(&config.private_key)
            .context("failed to parse RELAYER_PRIVATE_KEY")?
            .with_chain_id(chain_id);
        let relayer_address = wallet.address();

        let client = Arc::new(SignerMiddleware::new(provider, wallet));
        let contract = FanPool::new(config.fan_pool_address, client.clone());

        Ok(Self {
            config,
            client,
            contract,
            relayer_address,
            nonce: Mutex::new(None),
        })
    }

    pub fn relayer_address(&self) -> Address {
        self.relayer_address
    }

    pub async fn estimate_single_request_fee(
        &self,
        item: &PendingRelayItem,
    ) -> Result<FeeEstimate> {
        let proofs = vec![item.proof.clone()];
        let public_inputs = vec![item.public_inputs.clone()];

        let call = self.contract.execute_batch(proofs, public_inputs);
        let gas_estimate = call
            .estimate_gas()
            .await
            .context("failed to estimate gas for relay request")?;
        let gas_price = self
            .client
            .get_gas_price()
            .await
            .context("failed to fetch gas price")?;
        let gas_cost = gas_estimate
            .checked_mul(gas_price)
            .ok_or_else(|| anyhow!("gas cost overflow"))?;
        let min_required_fee_wei = gas_cost
            .checked_mul(U256::from(110u64))
            .ok_or_else(|| anyhow!("required fee overflow"))?
            / U256::from(100u64);

        Ok(FeeEstimate {
            gas_estimate,
            gas_price,
            min_required_fee_wei,
        })
    }

    pub async fn submit_batch(&self, batch: &[PendingRelayItem]) -> Result<TxHash> {
        if batch.is_empty() {
            return Err(anyhow!("cannot submit empty batch"));
        }

        let proofs: Vec<Bytes> = batch.iter().map(|item| item.proof.clone()).collect();
        let public_inputs: Vec<Vec<[u8; 32]>> = batch
            .iter()
            .map(|item| item.public_inputs.clone())
            .collect();

        // TODO: route this through Flashbots bundle API when private mempool support is added.
        for attempt in 1..=self.config.retry_max_attempts {
            let nonce = self.next_nonce().await?;
            let mut call = self
                .contract
                .execute_batch(proofs.clone(), public_inputs.clone())
                .nonce(nonce);

            match call.estimate_gas().await {
                Ok(estimate) => {
                    let gas_limit = (estimate * U256::from(120u64)) / U256::from(100u64);
                    call = call.gas(gas_limit);
                }
                Err(error) => {
                    if self.is_nonce_too_low_error(&error) {
                        warn!("nonce too low during gas estimate; refreshing nonce");
                        self.reset_nonce().await?;
                        continue;
                    }

                    if self.is_retryable_error(&error) && attempt < self.config.retry_max_attempts {
                        self.backoff(attempt).await;
                        continue;
                    }

                    return Err(anyhow!(error).context("failed to estimate batch gas"));
                }
            }

            let send_result = call.send().await;
            match send_result {
                Ok(pending_tx) => {
                    let tx_hash = pending_tx.tx_hash();
                    drop(pending_tx);
                    self.mark_nonce_used(nonce).await;
                    debug!(
                        tx_hash = %tx_hash,
                        batch_size = batch.len(),
                        "submitted relay batch to chain"
                    );
                    return Ok(tx_hash);
                }
                Err(error) => {
                    if self.is_nonce_too_low_error(&error) {
                        warn!("nonce error on send; refreshing nonce and retrying");
                        self.reset_nonce().await?;
                        continue;
                    }

                    if self.is_retryable_error(&error) && attempt < self.config.retry_max_attempts {
                        warn!(attempt, "retryable RPC error while sending batch: {error}");
                        self.backoff(attempt).await;
                        continue;
                    }

                    return Err(anyhow!(error).context("failed to send relay batch"));
                }
            }
        }

        Err(anyhow!(
            "batch submission exhausted all {} attempts",
            self.config.retry_max_attempts
        ))
    }

    async fn backoff(&self, attempt: u32) {
        let multiplier = 2u64.saturating_pow(attempt.saturating_sub(1));
        let delay_ms = self.config.retry_base_delay_ms.saturating_mul(multiplier);
        sleep(Duration::from_millis(delay_ms)).await;
    }

    async fn next_nonce(&self) -> Result<U256> {
        let mut nonce_guard = self.nonce.lock().await;
        if let Some(nonce) = *nonce_guard {
            return Ok(nonce);
        }

        let nonce = self
            .client
            .get_transaction_count(
                self.relayer_address,
                Some(ethers::types::BlockNumber::Pending.into()),
            )
            .await
            .context("failed to fetch relayer nonce")?;

        *nonce_guard = Some(nonce);
        Ok(nonce)
    }

    async fn mark_nonce_used(&self, used_nonce: U256) {
        let mut nonce_guard = self.nonce.lock().await;
        *nonce_guard = Some(used_nonce.saturating_add(U256::one()));
    }

    async fn reset_nonce(&self) -> Result<()> {
        let chain_nonce = self
            .client
            .get_transaction_count(
                self.relayer_address,
                Some(ethers::types::BlockNumber::Pending.into()),
            )
            .await
            .context("failed to refresh nonce")?;
        let mut nonce_guard = self.nonce.lock().await;
        *nonce_guard = Some(chain_nonce);
        Ok(())
    }

    fn is_nonce_too_low_error(&self, error: &ContractError<WalletClient>) -> bool {
        let text = error.to_string().to_ascii_lowercase();
        text.contains("nonce too low")
            || text.contains("replacement transaction underpriced")
            || text.contains("already known")
    }

    fn is_retryable_error(&self, error: &ContractError<WalletClient>) -> bool {
        let text = error.to_string().to_ascii_lowercase();
        text.contains("timeout")
            || text.contains("temporarily unavailable")
            || text.contains("connection reset")
            || text.contains("429")
            || text.contains("rate limit")
            || text.contains("503")
    }
}

#[async_trait]
impl ChainClient for ChainService {
    fn relayer_address(&self) -> Address {
        ChainService::relayer_address(self)
    }

    async fn estimate_single_request_fee(&self, item: &PendingRelayItem) -> Result<FeeEstimate> {
        ChainService::estimate_single_request_fee(self, item).await
    }

    async fn submit_batch(&self, batch: &[PendingRelayItem]) -> Result<TxHash> {
        ChainService::submit_batch(self, batch).await
    }
}
