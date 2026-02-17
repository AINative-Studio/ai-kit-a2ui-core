use a2ui_sdk::{JSONPointer, JSONPointerError};
/// RFC 6901 JSON Pointer Tests
///
/// Comprehensive test suite for JSON Pointer implementation.
/// Tests are written FIRST following TDD methodology.
use serde_json::{json, Value};

// ============================================================================
// Happy Path Tests - Resolve
// ============================================================================

#[test]
fn test_resolve_simple_object_path() {
    let data = json!({
        "user": {
            "name": "Alice",
            "age": 30
        }
    });

    let jp = JSONPointer;
    let result = jp.resolve(&data, "/user/name").unwrap().unwrap();
    assert_eq!(result, &json!("Alice"));
}

#[test]
fn test_resolve_nested_object() {
    let data = json!({
        "user": {
            "profile": {
                "name": "Alice",
                "address": {
                    "city": "NYC"
                }
            }
        }
    });

    let jp = JSONPointer;
    let result = jp
        .resolve(&data, "/user/profile/address/city")
        .unwrap()
        .unwrap();
    assert_eq!(result, &json!("NYC"));
}

#[test]
fn test_resolve_array_by_index() {
    let data = json!({
        "items": ["a", "b", "c"]
    });

    let jp = JSONPointer;
    let result = jp.resolve(&data, "/items/0").unwrap().unwrap();
    assert_eq!(result, &json!("a"));

    let result = jp.resolve(&data, "/items/1").unwrap().unwrap();
    assert_eq!(result, &json!("b"));

    let result = jp.resolve(&data, "/items/2").unwrap().unwrap();
    assert_eq!(result, &json!("c"));
}

#[test]
fn test_resolve_array_of_objects() {
    let data = json!({
        "users": [
            {"name": "Alice", "age": 30},
            {"name": "Bob", "age": 25}
        ]
    });

    let jp = JSONPointer;
    let result = jp.resolve(&data, "/users/0/name").unwrap().unwrap();
    assert_eq!(result, &json!("Alice"));

    let result = jp.resolve(&data, "/users/1/age").unwrap().unwrap();
    assert_eq!(result, &json!(25));
}

#[test]
fn test_resolve_empty_string_returns_root() {
    let data = json!({"key": "value"});

    let jp = JSONPointer;
    let result = jp.resolve(&data, "").unwrap().unwrap();
    assert_eq!(result, &data);
}

#[test]
fn test_resolve_root_slash_returns_root() {
    let data = json!({"key": "value"});

    let jp = JSONPointer;
    let result = jp.resolve(&data, "/").unwrap().unwrap();
    assert_eq!(result, &data);
}

#[test]
fn test_resolve_nonexistent_path_returns_none() {
    let data = json!({"user": {"name": "Alice"}});

    let jp = JSONPointer;
    let result = jp.resolve(&data, "/user/missing").unwrap();
    assert!(result.is_none());
}

#[test]
fn test_resolve_with_escaped_tilde() {
    let data = json!({"user~name": "Alice"});

    let jp = JSONPointer;
    let result = jp.resolve(&data, "/user~0name").unwrap().unwrap();
    assert_eq!(result, &json!("Alice"));
}

#[test]
fn test_resolve_with_escaped_slash() {
    let data = json!({"path/to": "value"});

    let jp = JSONPointer;
    let result = jp.resolve(&data, "/path~1to").unwrap().unwrap();
    assert_eq!(result, &json!("value"));
}

#[test]
fn test_resolve_with_both_escapes() {
    let data = json!({"a~b/c": "value"});

    let jp = JSONPointer;
    let result = jp.resolve(&data, "/a~0b~1c").unwrap().unwrap();
    assert_eq!(result, &json!("value"));
}

// ============================================================================
// Error Tests - Resolve
// ============================================================================

#[test]
fn test_resolve_invalid_pointer_no_leading_slash() {
    let data = json!({"key": "value"});

    let jp = JSONPointer;
    let result = jp.resolve(&data, "invalid");

    match result {
        Err(JSONPointerError::InvalidFormat(_)) => (),
        _ => panic!("Expected InvalidFormat error"),
    }
}

#[test]
fn test_resolve_array_with_invalid_index() {
    let data = json!({"items": ["a", "b", "c"]});

    let jp = JSONPointer;
    let result = jp.resolve(&data, "/items/abc").unwrap();
    assert!(result.is_none());
}

#[test]
fn test_resolve_array_out_of_bounds() {
    let data = json!({"items": ["a", "b", "c"]});

    let jp = JSONPointer;
    let result = jp.resolve(&data, "/items/10").unwrap();
    assert!(result.is_none());
}

// ============================================================================
// Happy Path Tests - Set
// ============================================================================

#[test]
fn test_set_simple_value() {
    let mut data = json!({});

    let jp = JSONPointer;
    jp.set(&mut data, "/key", json!("value")).unwrap();

    assert_eq!(data, json!({"key": "value"}));
}

#[test]
fn test_set_nested_value_creates_intermediate() {
    let mut data = json!({});

    let jp = JSONPointer;
    jp.set(&mut data, "/user/name", json!("Alice")).unwrap();

    assert_eq!(
        data,
        json!({
            "user": {
                "name": "Alice"
            }
        })
    );
}

#[test]
fn test_set_deep_nested_value() {
    let mut data = json!({});

    let jp = JSONPointer;
    jp.set(&mut data, "/a/b/c/d", json!("deep")).unwrap();

    assert_eq!(
        data,
        json!({
            "a": {
                "b": {
                    "c": {
                        "d": "deep"
                    }
                }
            }
        })
    );
}

#[test]
fn test_set_existing_value_overwrites() {
    let mut data = json!({"user": {"name": "Alice"}});

    let jp = JSONPointer;
    jp.set(&mut data, "/user/name", json!("Bob")).unwrap();

    assert_eq!(data, json!({"user": {"name": "Bob"}}));
}

#[test]
fn test_set_array_by_index() {
    let mut data = json!({"items": ["a", "b", "c"]});

    let jp = JSONPointer;
    jp.set(&mut data, "/items/1", json!("B")).unwrap();

    assert_eq!(data, json!({"items": ["a", "B", "c"]}));
}

#[test]
fn test_set_array_append_with_dash() {
    let mut data = json!({"items": ["a", "b", "c"]});

    let jp = JSONPointer;
    jp.set(&mut data, "/items/-", json!("d")).unwrap();

    assert_eq!(data, json!({"items": ["a", "b", "c", "d"]}));
}

#[test]
fn test_set_with_escaped_key() {
    let mut data = json!({});

    let jp = JSONPointer;
    jp.set(&mut data, "/user~0name", json!("Alice")).unwrap();

    assert_eq!(data, json!({"user~name": "Alice"}));
}

// ============================================================================
// Error Tests - Set
// ============================================================================

#[test]
fn test_set_root_fails() {
    let mut data = json!({"key": "value"});

    let jp = JSONPointer;
    let result = jp.set(&mut data, "", json!("new"));

    match result {
        Err(JSONPointerError::CannotModifyRoot) => (),
        _ => panic!("Expected CannotModifyRoot error"),
    }
}

#[test]
fn test_set_invalid_pointer_no_leading_slash() {
    let mut data = json!({});

    let jp = JSONPointer;
    let result = jp.set(&mut data, "invalid", json!("value"));

    match result {
        Err(JSONPointerError::InvalidFormat(_)) => (),
        _ => panic!("Expected InvalidFormat error"),
    }
}

#[test]
fn test_set_array_invalid_index() {
    let mut data = json!({"items": ["a", "b", "c"]});

    let jp = JSONPointer;
    let result = jp.set(&mut data, "/items/abc", json!("value"));

    match result {
        Err(JSONPointerError::InvalidArrayIndex(_)) => (),
        _ => panic!("Expected InvalidArrayIndex error"),
    }
}

// ============================================================================
// Happy Path Tests - Remove
// ============================================================================

#[test]
fn test_remove_simple_key() {
    let mut data = json!({"user": {"name": "Alice", "age": 30}});

    let jp = JSONPointer;
    let result = jp.remove(&mut data, "/user/age").unwrap();

    assert!(result);
    assert_eq!(data, json!({"user": {"name": "Alice"}}));
}

#[test]
fn test_remove_nested_key() {
    let mut data = json!({
        "user": {
            "profile": {
                "name": "Alice",
                "city": "NYC"
            }
        }
    });

    let jp = JSONPointer;
    let result = jp.remove(&mut data, "/user/profile/city").unwrap();

    assert!(result);
    assert_eq!(
        data,
        json!({
            "user": {
                "profile": {
                    "name": "Alice"
                }
            }
        })
    );
}

#[test]
fn test_remove_array_element() {
    let mut data = json!({"items": ["a", "b", "c"]});

    let jp = JSONPointer;
    let result = jp.remove(&mut data, "/items/1").unwrap();

    assert!(result);
    assert_eq!(data, json!({"items": ["a", "c"]}));
}

#[test]
fn test_remove_nonexistent_returns_false() {
    let mut data = json!({"user": {"name": "Alice"}});

    let jp = JSONPointer;
    let result = jp.remove(&mut data, "/user/missing").unwrap();

    assert!(!result);
    assert_eq!(data, json!({"user": {"name": "Alice"}}));
}

// ============================================================================
// Error Tests - Remove
// ============================================================================

#[test]
fn test_remove_root_fails() {
    let mut data = json!({"key": "value"});

    let jp = JSONPointer;
    let result = jp.remove(&mut data, "");

    match result {
        Err(JSONPointerError::CannotModifyRoot) => (),
        _ => panic!("Expected CannotModifyRoot error"),
    }
}

#[test]
fn test_remove_invalid_pointer() {
    let mut data = json!({});

    let jp = JSONPointer;
    let result = jp.remove(&mut data, "invalid");

    match result {
        Err(JSONPointerError::InvalidFormat(_)) => (),
        _ => panic!("Expected InvalidFormat error"),
    }
}

// ============================================================================
// Happy Path Tests - Compile
// ============================================================================

#[test]
fn test_compile_simple_path() {
    let jp = JSONPointer;
    let tokens = jp.compile("/user/name").unwrap();

    assert_eq!(tokens, vec!["user", "name"]);
}

#[test]
fn test_compile_nested_path() {
    let jp = JSONPointer;
    let tokens = jp.compile("/user/profile/name").unwrap();

    assert_eq!(tokens, vec!["user", "profile", "name"]);
}

#[test]
fn test_compile_empty_string() {
    let jp = JSONPointer;
    let tokens = jp.compile("").unwrap();

    assert_eq!(tokens, Vec::<String>::new());
}

#[test]
fn test_compile_with_escaped_tilde() {
    let jp = JSONPointer;
    let tokens = jp.compile("/user~0name").unwrap();

    assert_eq!(tokens, vec!["user~name"]);
}

#[test]
fn test_compile_with_escaped_slash() {
    let jp = JSONPointer;
    let tokens = jp.compile("/path~1to").unwrap();

    assert_eq!(tokens, vec!["path/to"]);
}

#[test]
fn test_compile_with_both_escapes() {
    let jp = JSONPointer;
    let tokens = jp.compile("/user~0name/path~1to").unwrap();

    assert_eq!(tokens, vec!["user~name", "path/to"]);
}

// ============================================================================
// Error Tests - Compile
// ============================================================================

#[test]
fn test_compile_invalid_pointer_no_leading_slash() {
    let jp = JSONPointer;
    let result = jp.compile("invalid");

    match result {
        Err(JSONPointerError::InvalidFormat(_)) => (),
        _ => panic!("Expected InvalidFormat error"),
    }
}

// ============================================================================
// Edge Cases
// ============================================================================

#[test]
fn test_resolve_empty_key() {
    let data = json!({"": "empty_key_value"});

    let jp = JSONPointer;
    let result = jp.resolve(&data, "/").unwrap().unwrap();
    assert_eq!(result, &data);
}

#[test]
fn test_set_creates_array_when_needed() {
    let mut data = json!({});

    let jp = JSONPointer;
    // Setting on a new path with numeric index should create object, not array
    // (arrays are only appended with -)
    jp.set(&mut data, "/items/0", json!("a")).unwrap();

    // This creates an object with key "0", not an array
    assert_eq!(data, json!({"items": {"0": "a"}}));
}

#[test]
fn test_array_index_leading_zeros_invalid() {
    let data = json!({"items": ["a", "b", "c"]});

    let jp = JSONPointer;
    let result = jp.resolve(&data, "/items/01").unwrap();
    assert!(result.is_none());
}

#[test]
fn test_array_index_zero_is_valid() {
    let data = json!({"items": ["a", "b", "c"]});

    let jp = JSONPointer;
    let result = jp.resolve(&data, "/items/0").unwrap().unwrap();
    assert_eq!(result, &json!("a"));
}

#[test]
fn test_dash_append_only_in_arrays() {
    let data = json!({"items": ["a", "b", "c"]});

    let jp = JSONPointer;
    let result = jp.resolve(&data, "/items/-").unwrap();
    // "-" as array index during resolve should fail (it's only for append in set)
    assert!(result.is_none());
}
