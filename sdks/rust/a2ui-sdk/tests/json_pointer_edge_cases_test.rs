/// JSON Pointer Edge Cases Tests
///
/// Additional edge case tests to improve coverage.
use a2ui_sdk::{JSONPointer, JSONPointerError};
use serde_json::json;

#[test]
fn test_set_creates_deep_array_path_error() {
    let mut data = json!({"items": []});
    let jp = JSONPointer;

    // Trying to set on a non-existent array index should fail
    let result = jp.set(&mut data, "/items/10/field", json!("value"));
    assert!(result.is_err());
}

#[test]
fn test_set_on_primitive_value_error() {
    let mut data = json!({"value": 42});
    let jp = JSONPointer;

    // Cannot set a child on a primitive value
    let result = jp.set(&mut data, "/value/field", json!("test"));
    assert!(result.is_err());
}

#[test]
fn test_remove_from_non_object() {
    let mut data = json!({"value": 42});
    let jp = JSONPointer;

    // Cannot remove from a non-object/non-array
    let result = jp.remove(&mut data, "/value/field").unwrap();
    assert!(!result);
}

#[test]
fn test_set_array_past_end_error() {
    let mut data = json!({"items": ["a", "b"]});
    let jp = JSONPointer;

    // Setting past array end (index 10 when length is 2) should fail
    let result = jp.set(&mut data, "/items/10", json!("x"));
    assert!(result.is_err());
}

#[test]
fn test_navigate_through_null_error() {
    let mut data = json!({"user": null});
    let jp = JSONPointer;

    // Cannot navigate through null
    let result = jp.set(&mut data, "/user/name", json!("Alice"));
    assert!(result.is_err());
}

#[test]
fn test_resolve_through_null() {
    let data = json!({"user": null});
    let jp = JSONPointer;

    // Resolving through null returns None
    let result = jp.resolve(&data, "/user/name").unwrap();
    assert!(result.is_none());
}

#[test]
fn test_remove_from_nested_array() {
    let mut data = json!({
        "matrix": [
            [1, 2, 3],
            [4, 5, 6]
        ]
    });
    let jp = JSONPointer;

    // Remove element from nested array
    let result = jp.remove(&mut data, "/matrix/0/1").unwrap();
    assert!(result);
    assert_eq!(data["matrix"][0], json!([1, 3]));
}

#[test]
fn test_set_in_nested_array() {
    let mut data = json!({
        "matrix": [
            [1, 2, 3],
            [4, 5, 6]
        ]
    });
    let jp = JSONPointer;

    // Set element in nested array
    jp.set(&mut data, "/matrix/0/1", json!(99)).unwrap();
    assert_eq!(data["matrix"][0][1], json!(99));
}

#[test]
fn test_navigate_through_array_out_of_bounds() {
    let data = json!({
        "items": [
            {"name": "first"},
            {"name": "second"}
        ]
    });
    let jp = JSONPointer;

    // Out of bounds array access during multi-level navigation
    let result = jp.resolve(&data, "/items/10/name").unwrap();
    assert!(result.is_none());
}
