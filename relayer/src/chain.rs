use crate::{
    config::RelayerConfig,
    models::{PendingRelayItem, RelayOperation},
};
use anyhow::{anyhow, Context, Result};
use async_trait::async_trait;
use ethers::{
    abi::{Abi, Detokenize},
    contract::{builders::ContractCall, Contract, ContractError},
    middleware::SignerMiddleware,
    providers::{Http, Middleware, Provider},
    signers::{LocalWallet, Signer},
    types::{Address, TxHash, U256},
};
use std::{str::FromStr, sync::Arc, time::Duration};
use tokio::{sync::Mutex, time::sleep};
use tracing::{debug, warn};

type WalletClient = SignerMiddleware<Provider<Http>, LocalWallet>;

const FAN_POOL_ABI_JSON: &str = r#"[
  {
    "type": "function",
    "name": "withdraw",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "token", "type": "address" },
      { "name": "recipient", "type": "address" },
      { "name": "amount", "type": "uint256" },
      { "name": "nullifierHash", "type": "bytes32" },
      { "name": "proof", "type": "bytes" },
      { "name": "rootHash", "type": "bytes32" },
      { "name": "calldataHash", "type": "bytes32" },
      { "name": "newCommitment", "type": "bytes32" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "executeAction",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "request",
        "type": "tuple",
        "components": [
          { "name": "token", "type": "address" },
          { "name": "amount", "type": "uint256" },
          { "name": "target", "type": "address" },
          { "name": "data", "type": "bytes" },
          { "name": "actionId", "type": "bytes32" },
          { "name": "nullifierHash", "type": "bytes32" },
          { "name": "proof", "type": "bytes" },
          { "name": "rootHash", "type": "bytes32" },
          { "name": "newCommitment", "type": "bytes32" }
        ]
      }
    ],
    "outputs": [{ "name": "success", "type": "bool" }]
  }
]"#;

#[derive(Debug, Clone)]
pub struct FeeEstimate {
    pub gas_estimate: U256,
    pub gas_price: U256,
    pub min_required_fee_wei: U256,
}

pub struct ChainService {
    config: Arc<RelayerConfig>,
    client: Arc<WalletClient>,
    contract: Contract<WalletClient>,
    relayer_address: Address,
    nonce: Mutex<Option<U256>>,
}

#[async_trait]
pub trait ChainClient: Send + Sync {
    fn relayer_address(&self) -> Address;
    async fn estimate_single_request_fee(&self, item: &PendingRelayItem) -> Result<FeeEstimate>;
    async fn submit_item(&self, item: &PendingRelayItem) -> Result<TxHash>;
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
        let abi: Abi = serde_json::from_str(FAN_POOL_ABI_JSON).context("failed to parse pool ABI")?;
        let contract = Contract::new(config.fan_pool_address, abi, client.clone());

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
        let operation = item.operation().context("invalid relay metadata")?;

        let gas_estimate = match operation {
            RelayOperation::Withdraw(op) => self
                .contract
                .method::<_, ()>(
                    "withdraw",
                    (
                        op.token,
                        op.recipient,
                        op.amount,
                        op.nullifier_hash,
                        item.proof.clone(),
                        op.root_hash,
                        op.calldata_hash,
                        op.new_commitment,
                    ),
                )
                .context("failed to build withdraw call")?
                .estimate_gas()
                .await
                .context("failed to estimate gas for relay request")?,
            RelayOperation::ExecuteAction(op) => {
                let request = (
                    op.token,
                    op.amount,
                    op.target,
                    op.data,
                    op.action_id,
                    op.nullifier_hash,
                    item.proof.clone(),
                    op.root_hash,
                    op.new_commitment,
                );
                self.contract
                    .method::<_, bool>("executeAction", (request,))
                    .context("failed to build executeAction call")?
                    .estimate_gas()
                    .await
                    .context("failed to estimate gas for relay request")?
            }
        };

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

    pub async fn submit_item(&self, item: &PendingRelayItem) -> Result<TxHash> {
        let operation = item.operation().context("invalid relay metadata")?;

        match operation {
            RelayOperation::Withdraw(op) => {
                let proof = item.proof.clone();
                self.send_with_retry(
                    |nonce| {
                        self.contract
                            .method::<_, ()>(
                                "withdraw",
                                (
                                    op.token,
                                    op.recipient,
                                    op.amount,
                                    op.nullifier_hash,
                                    proof.clone(),
                                    op.root_hash,
                                    op.calldata_hash,
                                    op.new_commitment,
                                ),
                            )
                            .context("failed to build withdraw call")
                            .map(|call| call.nonce(nonce))
                    },
                    "withdraw",
                )
                .await
            }
            RelayOperation::ExecuteAction(op) => {
                let proof = item.proof.clone();
                self.send_with_retry(
                    |nonce| {
                        let request = (
                            op.token,
                            op.amount,
                            op.target,
                            op.data.clone(),
                            op.action_id,
                            op.nullifier_hash,
                            proof.clone(),
                            op.root_hash,
                            op.new_commitment,
                        );
                        self.contract
                            .method::<_, bool>("executeAction", (request,))
                            .context("failed to build executeAction call")
                            .map(|call| call.nonce(nonce))
                    },
                    "executeAction",
                )
                .await
            }
        }
    }

    async fn send_with_retry<T, F>(&self, build_call: F, operation: &str) -> Result<TxHash>
    where
        T: Detokenize,
        F: Fn(U256) -> Result<ContractCall<WalletClient, T>>,
    {
        for attempt in 1..=self.config.retry_max_attempts {
            let nonce = self.next_nonce().await?;
            let mut call = build_call(nonce)?;

            match call.estimate_gas().await {
                Ok(estimate) => {
                    let gas_limit = (estimate * U256::from(120u64)) / U256::from(100u64);
                    call = call.gas(gas_limit);
                }
                Err(error) => {
                    if self.is_nonce_too_low_error(&error) {
                        warn!(operation, "nonce too low during gas estimate; refreshing nonce");
                        self.reset_nonce().await?;
                        continue;
                    }

                    if self.is_retryable_error(&error) && attempt < self.config.retry_max_attempts {
                        self.backoff(attempt).await;
                        continue;
                    }

                    return Err(anyhow!(error)
                        .context(format!("failed to estimate {operation} relay transaction gas")));
                }
            }

            let send_result = call.send().await;
            match send_result {
                Ok(pending_tx) => {
                    let tx_hash = pending_tx.tx_hash();
                    drop(pending_tx);
                    self.mark_nonce_used(nonce).await;
                    debug!(tx_hash = %tx_hash, operation, "submitted relay transaction to chain");
                    return Ok(tx_hash);
                }
                Err(error) => {
                    if self.is_nonce_too_low_error(&error) {
                        warn!(operation, "nonce error on send; refreshing nonce and retrying");
                        self.reset_nonce().await?;
                        continue;
                    }

                    if self.is_retryable_error(&error) && attempt < self.config.retry_max_attempts {
                        warn!(attempt, operation, "retryable RPC error while sending relay transaction: {error}");
                        self.backoff(attempt).await;
                        continue;
                    }

                    return Err(anyhow!(error)
                        .context(format!("failed to send {operation} relay transaction")));
                }
            }
        }

        Err(anyhow!(
            "relay transaction exhausted all {} attempts",
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

    async fn submit_item(&self, item: &PendingRelayItem) -> Result<TxHash> {
        ChainService::submit_item(self, item).await
    }
}
