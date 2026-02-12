use anyhow::{anyhow, Context, Result};
use chrono::{DateTime, Utc};
use ethers::{
    abi::{decode, ParamType, Token},
    types::{Address, Bytes, TxHash, U256},
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::str::FromStr;
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize)]
pub struct RelayRequest {
    pub proof: String,
    pub public_inputs: Vec<String>,
    #[serde(default)]
    pub metadata: Option<Value>,
}

#[derive(Debug, Clone)]
pub struct PendingRelayItem {
    pub id: Uuid,
    pub proof: Bytes,
    pub public_inputs: Vec<[u8; 32]>,
    pub relayer_fee_wei: U256,
    pub received_at: DateTime<Utc>,
    pub metadata: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredPendingRelayItem {
    pub id: Uuid,
    pub proof: String,
    pub public_inputs: Vec<String>,
    pub relayer_fee_wei: String,
    pub received_at: DateTime<Utc>,
    #[serde(default)]
    pub metadata: Option<Value>,
}

#[derive(Debug, Clone)]
pub struct WithdrawOperation {
    pub token: Address,
    pub recipient: Address,
    pub amount: U256,
    pub nullifier_hash: [u8; 32],
    pub root_hash: [u8; 32],
    pub new_commitment: [u8; 32],
    pub calldata_hash: [u8; 32],
}

#[derive(Debug, Clone)]
pub struct ExecuteActionOperation {
    pub token: Address,
    pub amount: U256,
    pub target: Address,
    pub data: Bytes,
    pub action_id: [u8; 32],
    pub nullifier_hash: [u8; 32],
    pub root_hash: [u8; 32],
    pub new_commitment: [u8; 32],
}

#[derive(Debug, Clone)]
pub enum RelayOperation {
    Withdraw(WithdrawOperation),
    ExecuteAction(ExecuteActionOperation),
}

#[derive(Debug, Serialize)]
pub struct RelayQueuedResponse {
    pub request_id: Uuid,
    pub queue_len: usize,
    pub gas_estimate: String,
    pub min_required_fee_wei: String,
}

#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub status: &'static str,
    pub queue_len: usize,
}

#[derive(Debug, Clone)]
pub enum RelayRequestStatus {
    Queued,
    Submitted { tx_hash: TxHash },
}

impl RelayRequestStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            RelayRequestStatus::Queued => "queued",
            RelayRequestStatus::Submitted { .. } => "submitted",
        }
    }
}

#[derive(Debug, Serialize)]
pub struct RelayStatusResponse {
    pub request_id: Uuid,
    pub status: &'static str,
    pub tx_hash: Option<String>,
}

impl RelayRequest {
    pub fn into_pending(
        self,
        fee_public_input_index: usize,
        now: DateTime<Utc>,
    ) -> Result<PendingRelayItem> {
        let proof = parse_hex_to_bytes(&self.proof).context("invalid proof hex")?;
        let mut public_inputs = Vec::with_capacity(self.public_inputs.len());

        for (index, word) in self.public_inputs.iter().enumerate() {
            let parsed = parse_hex_to_bytes32(word)
                .with_context(|| format!("invalid public_inputs[{index}]"))?;
            public_inputs.push(parsed);
        }

        let fee_word = public_inputs.get(fee_public_input_index).ok_or_else(|| {
            anyhow!(
                "public_inputs missing fee index {}, len={}",
                fee_public_input_index,
                public_inputs.len()
            )
        })?;

        let relayer_fee_wei = decode_u256_word(fee_word).context("invalid relayer fee word")?;

        Ok(PendingRelayItem {
            id: Uuid::new_v4(),
            proof,
            public_inputs,
            relayer_fee_wei,
            received_at: now,
            metadata: self.metadata,
        })
    }
}

impl From<&PendingRelayItem> for StoredPendingRelayItem {
    fn from(value: &PendingRelayItem) -> Self {
        Self {
            id: value.id,
            proof: format!("0x{}", hex::encode(value.proof.as_ref())),
            public_inputs: value
                .public_inputs
                .iter()
                .map(|word| format!("0x{}", hex::encode(word)))
                .collect(),
            relayer_fee_wei: value.relayer_fee_wei.to_string(),
            received_at: value.received_at,
            metadata: value.metadata.clone(),
        }
    }
}

impl TryFrom<StoredPendingRelayItem> for PendingRelayItem {
    type Error = anyhow::Error;

    fn try_from(value: StoredPendingRelayItem) -> Result<Self> {
        let proof = parse_hex_to_bytes(&value.proof).context("invalid stored proof")?;
        let mut public_inputs = Vec::with_capacity(value.public_inputs.len());
        for (index, word) in value.public_inputs.iter().enumerate() {
            let parsed = parse_hex_to_bytes32(word)
                .with_context(|| format!("invalid stored public_inputs[{index}]"))?;
            public_inputs.push(parsed);
        }

        let relayer_fee_wei =
            U256::from_dec_str(&value.relayer_fee_wei).context("invalid stored relayer_fee_wei")?;

        Ok(Self {
            id: value.id,
            proof,
            public_inputs,
            relayer_fee_wei,
            received_at: value.received_at,
            metadata: value.metadata,
        })
    }
}

impl PendingRelayItem {
    pub fn operation(&self) -> Result<RelayOperation> {
        let metadata = self
            .metadata
            .as_ref()
            .ok_or_else(|| anyhow!("missing relay metadata"))?;

        let operation = metadata
            .get("operation")
            .and_then(Value::as_str)
            .ok_or_else(|| anyhow!("metadata.operation is required"))?;

        match operation {
            "withdraw" => {
                let token = parse_address(metadata, "token")?;
                let recipient = parse_address(metadata, "recipient")?;
                let amount = parse_u256(metadata, "amount")?;
                let nullifier_hash = parse_bytes32(metadata, "nullifierHash")?;
                let root_hash = parse_bytes32(metadata, "rootHash")?;
                let new_commitment = parse_bytes32(metadata, "newCommitment")?;
                let calldata_hash = metadata
                    .get("calldataHash")
                    .map(|_| parse_bytes32(metadata, "calldataHash"))
                    .transpose()?
                    .unwrap_or([0u8; 32]);

                Ok(RelayOperation::Withdraw(WithdrawOperation {
                    token,
                    recipient,
                    amount,
                    nullifier_hash,
                    root_hash,
                    new_commitment,
                    calldata_hash,
                }))
            }
            "executeAction" => {
                let token = parse_address(metadata, "token")?;
                let amount = parse_u256(metadata, "amount")?;
                let target = parse_address(metadata, "target")?;
                let data = parse_bytes(metadata, "data")?;
                let action_id = parse_bytes32(metadata, "actionId")?;
                let nullifier_hash = parse_bytes32(metadata, "nullifierHash")?;
                let root_hash = parse_bytes32(metadata, "rootHash")?;
                let new_commitment = parse_bytes32(metadata, "newCommitment")?;

                Ok(RelayOperation::ExecuteAction(ExecuteActionOperation {
                    token,
                    amount,
                    target,
                    data,
                    action_id,
                    nullifier_hash,
                    root_hash,
                    new_commitment,
                }))
            }
            other => Err(anyhow!("unsupported metadata.operation: {other}")),
        }
    }
}

pub fn decode_relayer_address(word: &[u8; 32]) -> Result<Address> {
    let tokens = decode(&[ParamType::Address], word).context("invalid ABI-encoded address")?;
    match tokens.first() {
        Some(Token::Address(address)) => Ok(*address),
        _ => Err(anyhow!("failed to decode relayer address token")),
    }
}

pub fn decode_u256_word(word: &[u8; 32]) -> Result<U256> {
    let tokens = decode(&[ParamType::Uint(256)], word).context("invalid ABI-encoded uint256")?;
    match tokens.first() {
        Some(Token::Uint(value)) => Ok(*value),
        _ => Err(anyhow!("failed to decode uint256 token")),
    }
}

pub fn parse_hex_to_bytes(input: &str) -> Result<Bytes> {
    let bytes = decode_hex(input)?;
    Ok(Bytes::from(bytes))
}

pub fn parse_hex_to_bytes32(input: &str) -> Result<[u8; 32]> {
    let bytes = decode_hex(input)?;
    if bytes.len() != 32 {
        return Err(anyhow!(
            "expected 32-byte hex value, got {} bytes",
            bytes.len()
        ));
    }

    let mut out = [0u8; 32];
    out.copy_from_slice(&bytes);
    Ok(out)
}

fn decode_hex(input: &str) -> Result<Vec<u8>> {
    let normalized = input.trim_start_matches("0x");
    if normalized.is_empty() {
        return Ok(Vec::new());
    }
    let decoded = hex::decode(normalized).with_context(|| format!("invalid hex: {input}"))?;
    Ok(decoded)
}

fn parse_address(metadata: &Value, field: &str) -> Result<Address> {
    let raw = metadata
        .get(field)
        .and_then(Value::as_str)
        .ok_or_else(|| anyhow!("metadata.{field} is required"))?;
    Address::from_str(raw).with_context(|| format!("failed to parse metadata.{field} as address"))
}

fn parse_bytes32(metadata: &Value, field: &str) -> Result<[u8; 32]> {
    let raw = metadata
        .get(field)
        .and_then(Value::as_str)
        .ok_or_else(|| anyhow!("metadata.{field} is required"))?;
    parse_hex_to_bytes32(raw).with_context(|| format!("failed to parse metadata.{field}"))
}

fn parse_bytes(metadata: &Value, field: &str) -> Result<Bytes> {
    let raw = metadata
        .get(field)
        .and_then(Value::as_str)
        .ok_or_else(|| anyhow!("metadata.{field} is required"))?;
    parse_hex_to_bytes(raw).with_context(|| format!("failed to parse metadata.{field}"))
}

fn parse_u256(metadata: &Value, field: &str) -> Result<U256> {
    let value = metadata
        .get(field)
        .ok_or_else(|| anyhow!("metadata.{field} is required"))?;

    match value {
        Value::String(raw) => parse_u256_string(raw)
            .with_context(|| format!("failed to parse metadata.{field} as uint256")),
        Value::Number(raw) => {
            let as_u64 = raw
                .as_u64()
                .ok_or_else(|| anyhow!("metadata.{field} number is not a u64"))?;
            Ok(U256::from(as_u64))
        }
        _ => Err(anyhow!("metadata.{field} must be string or number")),
    }
}

fn parse_u256_string(raw: &str) -> Result<U256> {
    if raw.starts_with("0x") || raw.starts_with("0X") {
        U256::from_str_radix(raw.trim_start_matches("0x").trim_start_matches("0X"), 16)
            .context("invalid hex uint256")
    } else {
        U256::from_dec_str(raw).context("invalid decimal uint256")
    }
}
