//! Message and Event Handlers.
//!
//! Handler traits and implementations for A2UI messages and events.

use async_trait::async_trait;
use serde_json::Value;

/// Message handler trait.
#[async_trait]
pub trait MessageHandler: Send + Sync {
    /// Handle an incoming message.
    async fn handle(&self, message: Value) -> Result<(), Box<dyn std::error::Error + Send + Sync>>;
}

/// Event handler trait.
#[async_trait]
pub trait EventHandler: Send + Sync {
    /// Handle an event.
    async fn handle(&self, data: Value) -> Result<(), Box<dyn std::error::Error + Send + Sync>>;
}
