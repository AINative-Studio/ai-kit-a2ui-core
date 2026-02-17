/// Error Type Tests
///
/// Comprehensive tests for error types and conversions.
use a2ui_sdk::{JSONPointerError, TransportError};

#[test]
fn test_json_pointer_error_clone() {
    let err1 = JSONPointerError::InvalidFormat("test".to_string());
    let err2 = err1.clone();
    assert_eq!(err1, err2);
}

#[test]
fn test_transport_error_from_url_parse() {
    let url_err = url::Url::parse("not a valid url").unwrap_err();
    let transport_err: TransportError = url_err.into();

    match transport_err {
        TransportError::InvalidUrl(_) => (),
        _ => panic!("Expected InvalidUrl error"),
    }
}

#[test]
fn test_transport_error_from_io() {
    let io_err = std::io::Error::new(std::io::ErrorKind::ConnectionRefused, "test");
    let transport_err: TransportError = io_err.into();

    match transport_err {
        TransportError::IoError(_) => (),
        _ => panic!("Expected IoError"),
    }
}

#[test]
fn test_json_pointer_error_debug() {
    let err = JSONPointerError::NavigationError("/test".to_string());
    let debug_str = format!("{:?}", err);
    assert!(debug_str.contains("NavigationError"));
}

#[test]
fn test_transport_error_debug() {
    let err = TransportError::SendError("test".to_string());
    let debug_str = format!("{:?}", err);
    assert!(debug_str.contains("SendError"));
}
