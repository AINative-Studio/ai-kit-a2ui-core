//! # A2UI Rust SDK
//!
//! Production-ready Rust SDK for the A2UI protocol (v0.9-v0.12).
//!
//! Build agent-to-UI communication systems with WebSocket transport,
//! RFC 6901 JSON Pointer support, and comprehensive type safety.
//!
//! ## Features
//!
//! - **Complete A2UI Protocol**: Full implementation of A2UI v0.9-v0.12 message types
//! - **RFC 6901 JSON Pointer**: Compliant implementation for data model navigation
//! - **WebSocket Transport**: Auto-reconnection, ping/pong keep-alive, event system
//! - **Type-Safe**: Comprehensive Rust type definitions with serde support
//! - **Async/Await**: Built on tokio for high-performance async operations
//! - **Production-Ready**: Error handling, logging, and comprehensive test coverage
//!
//! ## Quick Start
//!
//! ```no_run
//! use a2ui_sdk::{JSONPointer, Transport, TransportOptions};
//! use serde_json::json;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // JSON Pointer example
//!     let data = json!({
//!         "user": {
//!             "name": "Alice",
//!             "age": 30
//!         }
//!     });
//!
//!     let jp = JSONPointer;
//!     let name = jp.resolve(&data, "/user/name")?.unwrap();
//!     println!("Name: {}", name);
//!
//!     Ok(())
//! }
//! ```
//!
//! ## Modules
//!
//! - [`json_pointer`] - RFC 6901 JSON Pointer implementation
//! - [`types`] - A2UI protocol message types
//! - [`transport`] - WebSocket transport layer
//! - [`handlers`] - Message and event handlers
//! - [`error`] - Error types

pub mod error;
pub mod handlers;
pub mod json_pointer;
pub mod transport;
pub mod types;

// Re-export commonly used types
pub use error::{JSONPointerError, JSONPointerResult, TransportError, TransportResult};
pub use handlers::{EventHandler, MessageHandler};
pub use json_pointer::JSONPointer;
pub use transport::{Transport, TransportOptions, TransportStatus};
pub use types::{
    Component, ComponentUpdate, CreateSurfaceMessage, DataOperation, DataUpdate,
    DeleteSurfaceMessage, ErrorMessage, Message, MessageType, Operation, PingMessage, PongMessage,
    UpdateComponentsMessage, UpdateDataModelMessage, UserActionMessage,
};

/// SDK version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version_exists() {
        assert!(!VERSION.is_empty());
    }
}
