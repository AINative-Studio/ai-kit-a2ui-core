//! WebSocket Transport Layer.
//!
//! Provides auto-reconnecting WebSocket transport for A2UI protocol.

use crate::error::{TransportError, TransportResult};
use crate::types::Message;
use std::time::Duration;

/// WebSocket transport status.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransportStatus {
    /// Disconnected
    Disconnected,
    /// Connecting
    Connecting,
    /// Connected
    Connected,
    /// Error state
    Error,
}

/// Transport configuration options.
#[derive(Debug, Clone)]
pub struct TransportOptions {
    /// Enable automatic reconnection
    pub auto_reconnect: bool,
    /// Delay between reconnection attempts
    pub reconnect_delay: Duration,
    /// Maximum reconnection attempts (0 = unlimited)
    pub max_reconnect_attempts: usize,
    /// Ping interval for keep-alive
    pub ping_interval: Duration,
    /// Pong timeout
    pub pong_timeout: Duration,
}

impl Default for TransportOptions {
    fn default() -> Self {
        Self {
            auto_reconnect: true,
            reconnect_delay: Duration::from_secs(3),
            max_reconnect_attempts: 5,
            ping_interval: Duration::from_secs(30),
            pong_timeout: Duration::from_secs(5),
        }
    }
}

/// WebSocket transport for A2UI protocol.
///
/// Placeholder implementation - will be fully implemented in next phase.
#[allow(dead_code)]
pub struct Transport {
    url: String,
    options: TransportOptions,
    status: TransportStatus,
}

impl Transport {
    /// Create a new transport.
    pub fn new(url: impl Into<String>, options: Option<TransportOptions>) -> Self {
        Self {
            url: url.into(),
            options: options.unwrap_or_default(),
            status: TransportStatus::Disconnected,
        }
    }

    /// Get current connection status.
    pub fn status(&self) -> TransportStatus {
        self.status
    }

    /// Check if connected.
    pub fn is_connected(&self) -> bool {
        self.status == TransportStatus::Connected
    }

    /// Connect to the agent (placeholder).
    pub async fn connect(&mut self) -> TransportResult<()> {
        // Placeholder - will be implemented with tokio-tungstenite
        self.status = TransportStatus::Connected;
        Ok(())
    }

    /// Disconnect from the agent (placeholder).
    pub async fn disconnect(&mut self) -> TransportResult<()> {
        // Placeholder - will be implemented with tokio-tungstenite
        self.status = TransportStatus::Disconnected;
        Ok(())
    }

    /// Send a message (placeholder).
    pub async fn send<M: Message>(&mut self, _message: &M) -> TransportResult<()> {
        // Placeholder - will be implemented with tokio-tungstenite
        if !self.is_connected() {
            return Err(TransportError::Disconnected);
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transport_default_options() {
        let options = TransportOptions::default();
        assert!(options.auto_reconnect);
        assert_eq!(options.reconnect_delay, Duration::from_secs(3));
        assert_eq!(options.max_reconnect_attempts, 5);
    }

    #[test]
    fn test_transport_creation() {
        let transport = Transport::new("ws://localhost:8000", None);
        assert_eq!(transport.status(), TransportStatus::Disconnected);
        assert!(!transport.is_connected());
    }

    #[tokio::test]
    async fn test_transport_connect() {
        let mut transport = Transport::new("ws://localhost:8000", None);
        let result = transport.connect().await;
        assert!(result.is_ok());
        assert!(transport.is_connected());
    }
}
