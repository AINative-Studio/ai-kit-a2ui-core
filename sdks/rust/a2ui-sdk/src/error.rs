//! Error types for the A2UI SDK.
//!
//! Provides comprehensive error handling for JSON Pointer operations,
//! WebSocket transport, and message handling.

use thiserror::Error;

/// Errors that can occur during JSON Pointer operations.
#[derive(Error, Debug, Clone, PartialEq)]
pub enum JSONPointerError {
    /// Invalid JSON Pointer format (must start with "/" unless empty).
    #[error("Invalid JSON Pointer format: {0}")]
    InvalidFormat(String),

    /// Cannot modify root value with empty pointer.
    #[error("Cannot modify root value")]
    CannotModifyRoot,

    /// Invalid array index (must be non-negative integer or '-' for append).
    #[error("Invalid array index: {0}")]
    InvalidArrayIndex(String),

    /// Cannot navigate through null or undefined value.
    #[error("Cannot navigate through null value at path: {0}")]
    NavigationError(String),

    /// Cannot set value on non-object/non-array.
    #[error("Cannot set value on non-object/non-array at path: {0}")]
    InvalidTarget(String),
}

/// Errors that can occur during WebSocket transport operations.
#[derive(Error, Debug)]
pub enum TransportError {
    /// WebSocket connection error.
    #[error("WebSocket connection error: {0}")]
    ConnectionError(String),

    /// WebSocket send error.
    #[error("Failed to send message: {0}")]
    SendError(String),

    /// WebSocket receive error.
    #[error("Failed to receive message: {0}")]
    ReceiveError(String),

    /// Invalid WebSocket URL.
    #[error("Invalid WebSocket URL: {0}")]
    InvalidUrl(String),

    /// Message serialization error.
    #[error("Message serialization error: {0}")]
    SerializationError(String),

    /// Message deserialization error.
    #[error("Message deserialization error: {0}")]
    DeserializationError(String),

    /// Transport is disconnected.
    #[error("Transport is disconnected")]
    Disconnected,

    /// Maximum reconnection attempts reached.
    #[error("Maximum reconnection attempts reached ({0})")]
    MaxReconnectAttemptsReached(usize),

    /// Transport timeout.
    #[error("Transport operation timed out")]
    Timeout,

    /// I/O error from underlying WebSocket.
    #[error("I/O error: {0}")]
    IoError(String),
}

/// Result type for JSON Pointer operations.
pub type JSONPointerResult<T> = Result<T, JSONPointerError>;

/// Result type for transport operations.
pub type TransportResult<T> = Result<T, TransportError>;

// Implement From for common error conversions
impl From<serde_json::Error> for TransportError {
    fn from(err: serde_json::Error) -> Self {
        TransportError::DeserializationError(err.to_string())
    }
}

impl From<url::ParseError> for TransportError {
    fn from(err: url::ParseError) -> Self {
        TransportError::InvalidUrl(err.to_string())
    }
}

impl From<std::io::Error> for TransportError {
    fn from(err: std::io::Error) -> Self {
        TransportError::IoError(err.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_json_pointer_error_display() {
        let err = JSONPointerError::InvalidFormat("test".to_string());
        assert_eq!(err.to_string(), "Invalid JSON Pointer format: test");

        let err = JSONPointerError::CannotModifyRoot;
        assert_eq!(err.to_string(), "Cannot modify root value");

        let err = JSONPointerError::InvalidArrayIndex("abc".to_string());
        assert_eq!(err.to_string(), "Invalid array index: abc");
    }

    #[test]
    fn test_transport_error_display() {
        let err = TransportError::ConnectionError("failed".to_string());
        assert_eq!(err.to_string(), "WebSocket connection error: failed");

        let err = TransportError::Disconnected;
        assert_eq!(err.to_string(), "Transport is disconnected");

        let err = TransportError::MaxReconnectAttemptsReached(5);
        assert_eq!(err.to_string(), "Maximum reconnection attempts reached (5)");
    }

    #[test]
    fn test_json_pointer_error_equality() {
        let err1 = JSONPointerError::InvalidFormat("test".to_string());
        let err2 = JSONPointerError::InvalidFormat("test".to_string());
        let err3 = JSONPointerError::InvalidFormat("other".to_string());

        assert_eq!(err1, err2);
        assert_ne!(err1, err3);
    }

    #[test]
    fn test_error_conversion_from_serde() {
        let json_err = serde_json::from_str::<serde_json::Value>("invalid json").unwrap_err();
        let transport_err: TransportError = json_err.into();

        match transport_err {
            TransportError::DeserializationError(_) => (),
            _ => panic!("Expected DeserializationError"),
        }
    }
}
