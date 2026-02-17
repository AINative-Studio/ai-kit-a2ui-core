//! RFC 6901 JSON Pointer Implementation.
//!
//! Provides complete implementation of JSON Pointer specification for
//! navigating and manipulating JSON data structures.
//!
//! Reference: <https://tools.ietf.org/html/rfc6901>

use crate::error::{JSONPointerError, JSONPointerResult};
use serde_json::Value;

/// JSON Pointer utility for RFC 6901 compliant operations.
///
/// Provides methods for resolving, setting, and removing values in JSON
/// data structures using JSON Pointer syntax.
///
/// # Examples
///
/// ```
/// use serde_json::json;
/// use a2ui_sdk::JSONPointer;
///
/// let data = json!({
///     "user": {
///         "name": "Alice",
///         "age": 30
///     }
/// });
///
/// let jp = JSONPointer;
/// let name = jp.resolve(&data, "/user/name").unwrap().unwrap();
/// assert_eq!(name, &json!("Alice"));
/// ```
pub struct JSONPointer;

impl JSONPointer {
    /// Resolve a JSON Pointer path in a value.
    ///
    /// # Arguments
    ///
    /// * `value` - The JSON value to navigate
    /// * `pointer` - JSON Pointer string (must start with "/" unless empty)
    ///
    /// # Returns
    ///
    /// * `Some(&Value)` - The resolved value
    /// * `None` - If the path doesn't exist
    ///
    /// # Errors
    ///
    /// Returns `JSONPointerError::InvalidFormat` if pointer format is invalid.
    ///
    /// # Examples
    ///
    /// ```
    /// use serde_json::json;
    /// use a2ui_sdk::JSONPointer;
    ///
    /// let data = json!({"user": {"name": "Alice"}});
    /// let jp = JSONPointer;
    ///
    /// let name = jp.resolve(&data, "/user/name").unwrap().unwrap();
    /// assert_eq!(name, &json!("Alice"));
    ///
    /// let missing = jp.resolve(&data, "/user/missing").unwrap();
    /// assert!(missing.is_none());
    /// ```
    pub fn resolve<'a>(
        &self,
        value: &'a Value,
        pointer: &str,
    ) -> JSONPointerResult<Option<&'a Value>> {
        // Empty pointer returns root
        if pointer.is_empty() || pointer == "/" {
            return Ok(Some(value));
        }

        // Validate format
        if !pointer.starts_with('/') {
            return Err(JSONPointerError::InvalidFormat(format!(
                "must start with \"/\" (got \"{}\")",
                pointer
            )));
        }

        // Compile and traverse
        let tokens = self.compile(pointer)?;
        let mut current = value;

        for token in tokens {
            match current {
                Value::Object(map) => match map.get(&token) {
                    Some(v) => current = v,
                    None => return Ok(None),
                },
                Value::Array(arr) => match Self::parse_array_index(&token, arr.len()) {
                    Some(idx) if idx < arr.len() => current = &arr[idx],
                    _ => return Ok(None),
                },
                _ => return Ok(None),
            }
        }

        Ok(Some(current))
    }

    /// Set a value at a JSON Pointer path.
    ///
    /// Creates intermediate objects as needed. Mutates the value in-place.
    ///
    /// # Arguments
    ///
    /// * `value` - The JSON value to modify (must be Object or Array)
    /// * `pointer` - JSON Pointer string (must start with "/", cannot be empty)
    /// * `new_value` - The value to set
    ///
    /// # Errors
    ///
    /// * `JSONPointerError::CannotModifyRoot` - If pointer is empty
    /// * `JSONPointerError::InvalidFormat` - If pointer format is invalid
    /// * `JSONPointerError::InvalidArrayIndex` - If array index is invalid
    /// * `JSONPointerError::InvalidTarget` - If target is not an object or array
    ///
    /// # Examples
    ///
    /// ```
    /// use serde_json::json;
    /// use a2ui_sdk::JSONPointer;
    ///
    /// let mut data = json!({});
    /// let jp = JSONPointer;
    ///
    /// jp.set(&mut data, "/user/name", json!("Alice")).unwrap();
    /// assert_eq!(data, json!({"user": {"name": "Alice"}}));
    /// ```
    pub fn set(&self, value: &mut Value, pointer: &str, new_value: Value) -> JSONPointerResult<()> {
        // Cannot set root
        if pointer.is_empty() {
            return Err(JSONPointerError::CannotModifyRoot);
        }

        // Validate format
        if !pointer.starts_with('/') {
            return Err(JSONPointerError::InvalidFormat(format!(
                "must start with \"/\" (got \"{}\")",
                pointer
            )));
        }

        // Compile tokens
        let mut tokens = self.compile(pointer)?;
        if tokens.is_empty() {
            return Err(JSONPointerError::CannotModifyRoot);
        }

        // Get last token
        let last_token = tokens.pop().unwrap();

        // Navigate to parent, creating intermediate objects
        let mut current = value;
        for token in tokens {
            match current {
                Value::Object(map) => {
                    // Create intermediate object if missing
                    if !map.contains_key(&token) {
                        map.insert(token.clone(), Value::Object(serde_json::Map::new()));
                    }
                    current = map.get_mut(&token).unwrap();
                }
                Value::Array(arr) => match Self::parse_array_index(&token, arr.len()) {
                    Some(idx) if idx < arr.len() => current = &mut arr[idx],
                    _ => return Err(JSONPointerError::InvalidArrayIndex(token)),
                },
                _ => return Err(JSONPointerError::InvalidTarget(pointer.to_string())),
            }
        }

        // Set final value
        match current {
            Value::Object(map) => {
                map.insert(last_token, new_value);
                Ok(())
            }
            Value::Array(arr) => {
                // Special "-" token means append
                if last_token == "-" {
                    arr.push(new_value);
                    return Ok(());
                }

                match Self::parse_array_index(&last_token, arr.len()) {
                    Some(idx) if idx <= arr.len() => {
                        if idx == arr.len() {
                            arr.push(new_value);
                        } else {
                            arr[idx] = new_value;
                        }
                        Ok(())
                    }
                    _ => Err(JSONPointerError::InvalidArrayIndex(last_token)),
                }
            }
            _ => Err(JSONPointerError::InvalidTarget(pointer.to_string())),
        }
    }

    /// Remove a value at a JSON Pointer path.
    ///
    /// # Arguments
    ///
    /// * `value` - The JSON value to modify
    /// * `pointer` - JSON Pointer string (must start with "/", cannot be empty)
    ///
    /// # Returns
    ///
    /// * `Ok(true)` - If value was removed
    /// * `Ok(false)` - If path didn't exist
    ///
    /// # Errors
    ///
    /// * `JSONPointerError::CannotModifyRoot` - If pointer is empty
    /// * `JSONPointerError::InvalidFormat` - If pointer format is invalid
    ///
    /// # Examples
    ///
    /// ```
    /// use serde_json::json;
    /// use a2ui_sdk::JSONPointer;
    ///
    /// let mut data = json!({"user": {"name": "Alice", "age": 30}});
    /// let jp = JSONPointer;
    ///
    /// let removed = jp.remove(&mut data, "/user/age").unwrap();
    /// assert!(removed);
    /// assert_eq!(data, json!({"user": {"name": "Alice"}}));
    /// ```
    pub fn remove(&self, value: &mut Value, pointer: &str) -> JSONPointerResult<bool> {
        // Cannot remove root
        if pointer.is_empty() {
            return Err(JSONPointerError::CannotModifyRoot);
        }

        // Validate format
        if !pointer.starts_with('/') {
            return Err(JSONPointerError::InvalidFormat(format!(
                "must start with \"/\" (got \"{}\")",
                pointer
            )));
        }

        // Compile tokens
        let mut tokens = self.compile(pointer)?;
        if tokens.is_empty() {
            return Err(JSONPointerError::CannotModifyRoot);
        }

        // Get last token
        let last_token = tokens.pop().unwrap();

        // Navigate to parent
        let mut current = value;
        for token in tokens {
            match current {
                Value::Object(map) => match map.get_mut(&token) {
                    Some(v) => current = v,
                    None => return Ok(false),
                },
                Value::Array(arr) => match Self::parse_array_index(&token, arr.len()) {
                    Some(idx) if idx < arr.len() => current = &mut arr[idx],
                    _ => return Ok(false),
                },
                _ => return Ok(false),
            }
        }

        // Remove final value
        match current {
            Value::Object(map) => Ok(map.remove(&last_token).is_some()),
            Value::Array(arr) => match Self::parse_array_index(&last_token, arr.len()) {
                Some(idx) if idx < arr.len() => {
                    arr.remove(idx);
                    Ok(true)
                }
                _ => Ok(false),
            },
            _ => Ok(false),
        }
    }

    /// Compile a JSON Pointer into an array of reference tokens.
    ///
    /// Handles RFC 6901 escape sequences (~0 for ~, ~1 for /).
    ///
    /// # Arguments
    ///
    /// * `pointer` - JSON Pointer string (empty string or starting with "/")
    ///
    /// # Returns
    ///
    /// Vector of unescaped tokens.
    ///
    /// # Errors
    ///
    /// Returns `JSONPointerError::InvalidFormat` if pointer format is invalid.
    ///
    /// # Examples
    ///
    /// ```
    /// use a2ui_sdk::JSONPointer;
    ///
    /// let jp = JSONPointer;
    ///
    /// let tokens = jp.compile("/user/profile/name").unwrap();
    /// assert_eq!(tokens, vec!["user", "profile", "name"]);
    ///
    /// let tokens = jp.compile("/user~0name/path~1to").unwrap();
    /// assert_eq!(tokens, vec!["user~name", "path/to"]);
    /// ```
    pub fn compile(&self, pointer: &str) -> JSONPointerResult<Vec<String>> {
        // Empty pointer
        if pointer.is_empty() {
            return Ok(vec![]);
        }

        // Validate format
        if !pointer.starts_with('/') {
            return Err(JSONPointerError::InvalidFormat(format!(
                "must start with \"/\" (got \"{}\")",
                pointer
            )));
        }

        // Split and unescape tokens
        let tokens: Vec<String> = pointer[1..].split('/').map(Self::unescape).collect();

        Ok(tokens)
    }

    /// Unescape a JSON Pointer token.
    ///
    /// Per RFC 6901:
    /// - ~1 represents /
    /// - ~0 represents ~
    ///
    /// Must process ~1 first, then ~0.
    fn unescape(token: &str) -> String {
        token.replace("~1", "/").replace("~0", "~")
    }

    /// Parse an array index from a token.
    ///
    /// # Returns
    ///
    /// * `Some(index)` - Valid non-negative integer index
    /// * `None` - Invalid index
    ///
    /// # Rules (RFC 6901)
    ///
    /// - Must be non-negative integer
    /// - No leading zeros (except "0" itself)
    /// - "-" is special and returns array_length (for append)
    fn parse_array_index(token: &str, array_length: usize) -> Option<usize> {
        // "-" means append (return array_length for bounds checking)
        if token == "-" {
            return Some(array_length);
        }

        // Must be all digits
        if !token.chars().all(|c| c.is_ascii_digit()) {
            return None;
        }

        // Reject leading zeros (except "0" itself)
        if token.len() > 1 && token.starts_with('0') {
            return None;
        }

        token.parse::<usize>().ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_unescape_tilde() {
        assert_eq!(JSONPointer::unescape("user~0name"), "user~name");
    }

    #[test]
    fn test_unescape_slash() {
        assert_eq!(JSONPointer::unescape("path~1to"), "path/to");
    }

    #[test]
    fn test_unescape_both() {
        assert_eq!(JSONPointer::unescape("a~0b~1c"), "a~b/c");
    }

    #[test]
    fn test_parse_array_index_valid() {
        assert_eq!(JSONPointer::parse_array_index("0", 10), Some(0));
        assert_eq!(JSONPointer::parse_array_index("5", 10), Some(5));
        assert_eq!(JSONPointer::parse_array_index("123", 200), Some(123));
    }

    #[test]
    fn test_parse_array_index_dash() {
        assert_eq!(JSONPointer::parse_array_index("-", 10), Some(10));
    }

    #[test]
    fn test_parse_array_index_leading_zeros() {
        assert_eq!(JSONPointer::parse_array_index("01", 10), None);
        assert_eq!(JSONPointer::parse_array_index("007", 10), None);
    }

    #[test]
    fn test_parse_array_index_invalid() {
        assert_eq!(JSONPointer::parse_array_index("abc", 10), None);
        assert_eq!(JSONPointer::parse_array_index("1a", 10), None);
        assert_eq!(JSONPointer::parse_array_index("-1", 10), None);
    }
}
