// Package a2ui implements the A2UI protocol for Go
package a2ui

import (
	"fmt"
	"strconv"
	"strings"
)

// JSONPointerError represents an error in JSON Pointer operations
type JSONPointerError struct {
	Message string
}

func (e *JSONPointerError) Error() string {
	return e.Message
}

// JSONPointer implements RFC 6901 JSON Pointer for Go
type JSONPointer struct{}

// Resolve resolves a JSON pointer to a value in the data structure
// Per RFC 6901, returns the value at the pointer location or error if not found
func (jp *JSONPointer) Resolve(data interface{}, pointer string) (interface{}, error) {
	// Empty pointer or "/" returns root
	if pointer == "" {
		return data, nil
	}

	if !strings.HasPrefix(pointer, "/") {
		return nil, &JSONPointerError{
			Message: fmt.Sprintf("invalid JSON pointer: must start with \"/\" (got %q)", pointer),
		}
	}

	tokens := jp.Parse(pointer)
	if tokens == nil {
		return nil, &JSONPointerError{
			Message: "invalid JSON pointer format",
		}
	}

	current := data

	for _, token := range tokens {
		if current == nil {
			return nil, &JSONPointerError{
				Message: "cannot navigate through nil value",
			}
		}

		switch v := current.(type) {
		case map[string]interface{}:
			val, ok := v[token]
			if !ok {
				return nil, &JSONPointerError{
					Message: fmt.Sprintf("key not found: %q", token),
				}
			}
			current = val

		case []interface{}:
			index, err := jp.parseArrayIndex(token, len(v))
			if err != nil {
				return nil, err
			}
			if index < 0 || index >= len(v) {
				return nil, &JSONPointerError{
					Message: fmt.Sprintf("array index out of bounds: %d (length: %d)", index, len(v)),
				}
			}
			current = v[index]

		default:
			return nil, &JSONPointerError{
				Message: fmt.Sprintf("cannot traverse through type %T", current),
			}
		}
	}

	return current, nil
}

// Set sets a value at the JSON pointer location
// Creates intermediate objects as needed
func (jp *JSONPointer) Set(data interface{}, pointer string, value interface{}) error {
	if pointer == "" {
		return &JSONPointerError{
			Message: "cannot set root value",
		}
	}

	if !strings.HasPrefix(pointer, "/") {
		return &JSONPointerError{
			Message: fmt.Sprintf("invalid JSON pointer: must start with \"/\" (got %q)", pointer),
		}
	}

	tokens := jp.Parse(pointer)
	if tokens == nil || len(tokens) == 0 {
		return &JSONPointerError{
			Message: "invalid JSON pointer: no tokens",
		}
	}

	// Navigate to parent
	current := data
	for i := 0; i < len(tokens)-1; i++ {
		token := tokens[i]

		if current == nil {
			return &JSONPointerError{
				Message: "cannot navigate through nil value",
			}
		}

		switch v := current.(type) {
		case map[string]interface{}:
			if _, exists := v[token]; !exists {
				// Create intermediate object
				v[token] = make(map[string]interface{})
			}
			current = v[token]

		case []interface{}:
			index, err := jp.parseArrayIndex(token, len(v))
			if err != nil {
				return err
			}
			if index < 0 || index >= len(v) {
				return &JSONPointerError{
					Message: fmt.Sprintf("invalid array index: %q", token),
				}
			}
			current = v[index]

		default:
			return &JSONPointerError{
				Message: fmt.Sprintf("cannot navigate through type %T", current),
			}
		}
	}

	// Set value at final location
	lastToken := tokens[len(tokens)-1]

	if current == nil {
		return &JSONPointerError{
			Message: "cannot set value on nil",
		}
	}

	switch v := current.(type) {
	case map[string]interface{}:
		v[lastToken] = value

	case []interface{}:
		if lastToken == "-" {
			// Append to array
			parent := data
			for i := 0; i < len(tokens)-2; i++ {
				token := tokens[i]
				switch p := parent.(type) {
				case map[string]interface{}:
					parent = p[token]
				case []interface{}:
					idx, _ := jp.parseArrayIndex(token, len(p))
					parent = p[idx]
				}
			}

			// Update the parent's array
			parentToken := tokens[len(tokens)-2]
			switch p := parent.(type) {
			case map[string]interface{}:
				if arr, ok := p[parentToken].([]interface{}); ok {
					p[parentToken] = append(arr, value)
				}
			}
		} else {
			index, err := jp.parseArrayIndex(lastToken, len(v))
			if err != nil {
				return err
			}
			if index < 0 || index >= len(v) {
				return &JSONPointerError{
					Message: fmt.Sprintf("invalid array index: %q", lastToken),
				}
			}
			v[index] = value
		}

	default:
		return &JSONPointerError{
			Message: fmt.Sprintf("cannot set value on type %T", current),
		}
	}

	return nil
}

// Remove removes a value at the JSON pointer location
// Returns true if removed, false if path not found
func (jp *JSONPointer) Remove(data interface{}, pointer string) (bool, error) {
	if pointer == "" {
		return false, &JSONPointerError{
			Message: "cannot remove root value",
		}
	}

	if !strings.HasPrefix(pointer, "/") {
		return false, &JSONPointerError{
			Message: fmt.Sprintf("invalid JSON pointer: must start with \"/\" (got %q)", pointer),
		}
	}

	tokens := jp.Parse(pointer)
	if tokens == nil || len(tokens) == 0 {
		return false, &JSONPointerError{
			Message: "invalid JSON pointer: no tokens",
		}
	}

	// Navigate to parent
	current := data
	for i := 0; i < len(tokens)-1; i++ {
		token := tokens[i]

		if current == nil {
			return false, nil
		}

		switch v := current.(type) {
		case map[string]interface{}:
			val, exists := v[token]
			if !exists {
				return false, nil
			}
			current = val

		case []interface{}:
			index, err := jp.parseArrayIndex(token, len(v))
			if err != nil {
				return false, nil
			}
			if index < 0 || index >= len(v) {
				return false, nil
			}
			current = v[index]

		default:
			return false, nil
		}
	}

	// Remove value at final location
	lastToken := tokens[len(tokens)-1]

	if current == nil {
		return false, nil
	}

	switch v := current.(type) {
	case map[string]interface{}:
		if _, exists := v[lastToken]; !exists {
			return false, nil
		}
		delete(v, lastToken)
		return true, nil

	case []interface{}:
		index, err := jp.parseArrayIndex(lastToken, len(v))
		if err != nil || index < 0 || index >= len(v) {
			return false, nil
		}

		// Find parent to update the array
		parent := data
		for i := 0; i < len(tokens)-2; i++ {
			token := tokens[i]
			switch p := parent.(type) {
			case map[string]interface{}:
				parent = p[token]
			case []interface{}:
				idx, _ := jp.parseArrayIndex(token, len(p))
				parent = p[idx]
			}
		}

		// Update parent's array by removing element
		if len(tokens) >= 2 {
			parentToken := tokens[len(tokens)-2]
			switch p := parent.(type) {
			case map[string]interface{}:
				if arr, ok := p[parentToken].([]interface{}); ok {
					p[parentToken] = append(arr[:index], arr[index+1:]...)
				}
			}
		}
		return true, nil

	default:
		return false, nil
	}
}

// Parse parses a JSON pointer into an array of reference tokens
// Returns nil for invalid pointers
func (jp *JSONPointer) Parse(pointer string) []string {
	if pointer == "" {
		return []string{}
	}

	if !strings.HasPrefix(pointer, "/") {
		return nil
	}

	// Remove leading "/" and split
	parts := strings.Split(pointer[1:], "/")
	tokens := make([]string, len(parts))

	for i, part := range parts {
		// Unescape: ~1 -> /, ~0 -> ~
		tokens[i] = jp.unescape(part)
	}

	return tokens
}

// unescape unescapes a JSON pointer token per RFC 6901
// ~1 -> /, ~0 -> ~
func (jp *JSONPointer) unescape(token string) string {
	// Must unescape ~1 first, then ~0 (order matters!)
	token = strings.ReplaceAll(token, "~1", "/")
	token = strings.ReplaceAll(token, "~0", "~")
	return token
}

// parseArrayIndex parses an array index from a token
// Returns error for invalid indices
func (jp *JSONPointer) parseArrayIndex(token string, arrayLength int) (int, error) {
	// "-" means append (only valid for set operation)
	if token == "-" {
		return arrayLength, nil
	}

	// Must be non-negative integer
	if len(token) == 0 {
		return -1, &JSONPointerError{
			Message: "invalid array index: empty token",
		}
	}

	// Check for leading zeros (invalid per RFC 6901, except "0" itself)
	if len(token) > 1 && token[0] == '0' {
		return -1, &JSONPointerError{
			Message: fmt.Sprintf("invalid array index: leading zeros not allowed (got %q)", token),
		}
	}

	// Parse as integer
	index, err := strconv.Atoi(token)
	if err != nil {
		return -1, &JSONPointerError{
			Message: fmt.Sprintf("invalid array index: not a number (got %q)", token),
		}
	}

	if index < 0 {
		return -1, &JSONPointerError{
			Message: fmt.Sprintf("invalid array index: negative index (got %d)", index),
		}
	}

	return index, nil
}
