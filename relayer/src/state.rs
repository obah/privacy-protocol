use crate::{chain::ChainClient, config::RelayerConfig, mempool::RelayMempool};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<RelayerConfig>,
    pub chain: Arc<dyn ChainClient>,
    pub mempool: Arc<RwLock<RelayMempool>>,
}
