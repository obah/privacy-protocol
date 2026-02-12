use anyhow::{anyhow, Context, Result};
use chrono::{DateTime, Utc};
use ethers::{
    abi::{decode, ParamType, Token},
    types::{Address, Bytes, U256},
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
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
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredPendingRelayItem {
    pub id: Uuid,
    pub proof: String,
    pub public_inputs: Vec<String>,
    pub relayer_fee_wei: String,
    pub received_at: DateTime<Utc>,
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
        })
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
