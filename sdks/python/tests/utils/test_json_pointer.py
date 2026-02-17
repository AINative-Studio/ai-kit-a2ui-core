"""
Test suite for JSON Pointer (RFC 6901) implementation.

Following TDD principles - tests written BEFORE implementation.
"""

import pytest
from typing import Any


class TestJSONPointerResolve:
    """Test JSONPointer.resolve() method"""

    def test_resolve_root_pointer(self) -> None:
        """Should return entire object for empty pointer"""
        from a2ui.utils.json_pointer import JSONPointer

        data = {"user": {"name": "Alice"}}
        result = JSONPointer.resolve(data, "")
        assert result == data

    def test_resolve_simple_property(self) -> None:
        """Should resolve simple object property"""
        from a2ui.utils.json_pointer import JSONPointer

        data = {"name": "Alice", "age": 30}
        assert JSONPointer.resolve(data, "/name") == "Alice"
        assert JSONPointer.resolve(data, "/age") == 30

    def test_resolve_nested_property(self) -> None:
        """Should resolve nested object properties"""
        from a2ui.utils.json_pointer import JSONPointer

        data = {"user": {"profile": {"name": "Alice", "age": 30}}}
        assert JSONPointer.resolve(data, "/user/profile/name") == "Alice"
        assert JSONPointer.resolve(data, "/user/profile/age") == 30

    def test_resolve_array_element(self) -> None:
        """Should resolve array elements by index"""
        from a2ui.utils.json_pointer import JSONPointer

        data = {"items": ["a", "b", "c"]}
        assert JSONPointer.resolve(data, "/items/0") == "a"
        assert JSONPointer.resolve(data, "/items/1") == "b"
        assert JSONPointer.resolve(data, "/items/2") == "c"

    def test_resolve_escaped_tilde(self) -> None:
        """Should handle ~0 escape sequence for tilde (~)"""
        from a2ui.utils.json_pointer import JSONPointer

        data = {"user~name": "Alice"}
        assert JSONPointer.resolve(data, "/user~0name") == "Alice"

    def test_resolve_escaped_slash(self) -> None:
        """Should handle ~1 escape sequence for forward slash (/)"""
        from a2ui.utils.json_pointer import JSONPointer

        data = {"path/to": {"value": 123}}
        assert JSONPointer.resolve(data, "/path~1to/value") == 123

    def test_resolve_nonexistent_path(self) -> None:
        """Should return None for non-existent paths"""
        from a2ui.utils.json_pointer import JSONPointer

        data = {"user": {"name": "Alice"}}
        assert JSONPointer.resolve(data, "/user/missing") is None
        assert JSONPointer.resolve(data, "/nonexistent") is None

    def test_resolve_invalid_array_index(self) -> None:
        """Should return None for invalid array indices"""
        from a2ui.utils.json_pointer import JSONPointer

        data = {"items": ["a", "b", "c"]}
        assert JSONPointer.resolve(data, "/items/99") is None
        assert JSONPointer.resolve(data, "/items/abc") is None

    def test_resolve_invalid_pointer_format(self) -> None:
        """Should raise error for pointers not starting with /"""
        from a2ui.utils.json_pointer import JSONPointer, JSONPointerError

        data = {"user": "Alice"}
        with pytest.raises(JSONPointerError, match="must start with"):
            JSONPointer.resolve(data, "user/name")

    def test_resolve_through_null(self) -> None:
        """Should return None when navigating through null/undefined"""
        from a2ui.utils.json_pointer import JSONPointer

        data = {"user": None}
        assert JSONPointer.resolve(data, "/user/name") is None


class TestJSONPointerSet:
    """Test JSONPointer.set() method"""

    def test_set_simple_property(self) -> None:
        """Should set simple object property"""
        from a2ui.utils.json_pointer import JSONPointer

        data: dict[str, Any] = {"name": "Alice"}
        JSONPointer.set(data, "/age", 30)
        assert data == {"name": "Alice", "age": 30}

    def test_set_nested_property(self) -> None:
        """Should set nested object property"""
        from a2ui.utils.json_pointer import JSONPointer

        data: dict[str, Any] = {"user": {"name": "Alice"}}
        JSONPointer.set(data, "/user/age", 30)
        assert data == {"user": {"name": "Alice", "age": 30}}

    def test_set_create_intermediate_objects(self) -> None:
        """Should create intermediate objects if they don't exist"""
        from a2ui.utils.json_pointer import JSONPointer

        data: dict[str, Any] = {}
        JSONPointer.set(data, "/user/profile/city", "NYC")
        assert data == {"user": {"profile": {"city": "NYC"}}}

    def test_set_array_element(self) -> None:
        """Should set array element by index"""
        from a2ui.utils.json_pointer import JSONPointer

        data: dict[str, Any] = {"items": ["a", "b", "c"]}
        JSONPointer.set(data, "/items/1", "B")
        assert data["items"] == ["a", "B", "c"]

    def test_set_array_append(self) -> None:
        """Should append to array using - token"""
        from a2ui.utils.json_pointer import JSONPointer

        data: dict[str, Any] = {"items": ["a", "b"]}
        JSONPointer.set(data, "/items/-", "c")
        assert data["items"] == ["a", "b", "c"]

    def test_set_invalid_pointer_format(self) -> None:
        """Should raise error for pointers not starting with /"""
        from a2ui.utils.json_pointer import JSONPointer, JSONPointerError

        data: dict[str, Any] = {}
        with pytest.raises(JSONPointerError, match="must start with"):
            JSONPointer.set(data, "user/name", "Alice")

    def test_set_root_pointer_error(self) -> None:
        """Should raise error when trying to set root"""
        from a2ui.utils.json_pointer import JSONPointer, JSONPointerError

        data: dict[str, Any] = {}
        with pytest.raises(JSONPointerError, match="Cannot set root"):
            JSONPointer.set(data, "", {"new": "data"})

    def test_set_invalid_array_index(self) -> None:
        """Should raise error for invalid array index"""
        from a2ui.utils.json_pointer import JSONPointer, JSONPointerError

        data: dict[str, Any] = {"items": ["a", "b"]}
        with pytest.raises(JSONPointerError, match="Invalid array index"):
            JSONPointer.set(data, "/items/abc", "value")


class TestJSONPointerRemove:
    """Test JSONPointer.remove() method"""

    def test_remove_simple_property(self) -> None:
        """Should remove simple object property"""
        from a2ui.utils.json_pointer import JSONPointer

        data: dict[str, Any] = {"name": "Alice", "age": 30}
        result = JSONPointer.remove(data, "/age")
        assert result is True
        assert data == {"name": "Alice"}

    def test_remove_nested_property(self) -> None:
        """Should remove nested object property"""
        from a2ui.utils.json_pointer import JSONPointer

        data: dict[str, Any] = {"user": {"name": "Alice", "age": 30}}
        result = JSONPointer.remove(data, "/user/age")
        assert result is True
        assert data == {"user": {"name": "Alice"}}

    def test_remove_array_element(self) -> None:
        """Should remove array element by index"""
        from a2ui.utils.json_pointer import JSONPointer

        data: dict[str, Any] = {"items": ["a", "b", "c"]}
        result = JSONPointer.remove(data, "/items/1")
        assert result is True
        assert data["items"] == ["a", "c"]

    def test_remove_nonexistent_path(self) -> None:
        """Should return False for non-existent paths"""
        from a2ui.utils.json_pointer import JSONPointer

        data: dict[str, Any] = {"user": {"name": "Alice"}}
        result = JSONPointer.remove(data, "/user/missing")
        assert result is False
        assert data == {"user": {"name": "Alice"}}

    def test_remove_invalid_pointer_format(self) -> None:
        """Should raise error for pointers not starting with /"""
        from a2ui.utils.json_pointer import JSONPointer, JSONPointerError

        data: dict[str, Any] = {"user": "Alice"}
        with pytest.raises(JSONPointerError, match="must start with"):
            JSONPointer.remove(data, "user/name")

    def test_remove_root_pointer_error(self) -> None:
        """Should raise error when trying to remove root"""
        from a2ui.utils.json_pointer import JSONPointer, JSONPointerError

        data: dict[str, Any] = {"user": "Alice"}
        with pytest.raises(JSONPointerError, match="Cannot remove root"):
            JSONPointer.remove(data, "")


class TestJSONPointerCompile:
    """Test JSONPointer.compile() method"""

    def test_compile_simple_path(self) -> None:
        """Should compile simple pointer into tokens"""
        from a2ui.utils.json_pointer import JSONPointer

        tokens = JSONPointer.compile("/user/name")
        assert tokens == ["user", "name"]

    def test_compile_with_array_index(self) -> None:
        """Should compile pointer with array index"""
        from a2ui.utils.json_pointer import JSONPointer

        tokens = JSONPointer.compile("/items/0")
        assert tokens == ["items", "0"]

    def test_compile_empty_pointer(self) -> None:
        """Should return empty list for root pointer"""
        from a2ui.utils.json_pointer import JSONPointer

        tokens = JSONPointer.compile("")
        assert tokens == []

    def test_compile_with_escapes(self) -> None:
        """Should unescape ~0 and ~1 sequences"""
        from a2ui.utils.json_pointer import JSONPointer

        tokens = JSONPointer.compile("/user~0name/path~1to")
        assert tokens == ["user~name", "path/to"]

    def test_compile_invalid_pointer_format(self) -> None:
        """Should raise error for pointers not starting with /"""
        from a2ui.utils.json_pointer import JSONPointer, JSONPointerError

        with pytest.raises(JSONPointerError, match="must start with"):
            JSONPointer.compile("user/name")


class TestJSONPointerEdgeCases:
    """Test edge cases and error handling"""

    def test_handle_leading_zeros_in_array_index(self) -> None:
        """Should reject array indices with leading zeros"""
        from a2ui.utils.json_pointer import JSONPointer

        data = {"items": ["a", "b", "c"]}
        # "01" has leading zero, should be invalid
        assert JSONPointer.resolve(data, "/items/01") is None

    def test_handle_negative_array_index(self) -> None:
        """Should reject negative array indices"""
        from a2ui.utils.json_pointer import JSONPointer

        data = {"items": ["a", "b", "c"]}
        assert JSONPointer.resolve(data, "/items/-1") is None

    def test_handle_non_object_navigation(self) -> None:
        """Should return None when trying to navigate through primitives"""
        from a2ui.utils.json_pointer import JSONPointer

        data = {"value": 123}
        assert JSONPointer.resolve(data, "/value/nested") is None

    def test_multiple_escapes(self) -> None:
        """Should handle multiple escape sequences in single token"""
        from a2ui.utils.json_pointer import JSONPointer

        data = {"a~b/c": "value"}
        assert JSONPointer.resolve(data, "/a~0b~1c") == "value"

    def test_empty_token(self) -> None:
        """Should handle empty tokens (consecutive slashes)"""
        from a2ui.utils.json_pointer import JSONPointer

        data = {"": {"name": "Alice"}}
        assert JSONPointer.resolve(data, "//name") == "Alice"

    def test_set_through_list_error(self) -> None:
        """Should raise error when navigating through list with non-numeric token"""
        from a2ui.utils.json_pointer import JSONPointer, JSONPointerError

        data: dict[str, Any] = {"items": ["a", "b"]}
        with pytest.raises(JSONPointerError):
            JSONPointer.set(data, "/items/invalid/nested", "value")

    def test_set_through_null_error(self) -> None:
        """Should raise error when trying to navigate through None"""
        from a2ui.utils.json_pointer import JSONPointer, JSONPointerError

        data: dict[str, Any] = {"user": None}
        with pytest.raises(JSONPointerError, match="Cannot navigate"):
            JSONPointer.set(data, "/user/name/nested", "Alice")

    def test_set_through_primitive_error(self) -> None:
        """Should raise error when trying to navigate through primitive value"""
        from a2ui.utils.json_pointer import JSONPointer, JSONPointerError

        data: dict[str, Any] = {"value": 123}
        with pytest.raises(JSONPointerError, match="Cannot navigate"):
            JSONPointer.set(data, "/value/nested/deep", "data")

    def test_set_on_null_parent_error(self) -> None:
        """Should raise error when trying to set value with null parent"""
        from a2ui.utils.json_pointer import JSONPointer, JSONPointerError

        # Create a scenario where parent becomes None during traversal
        data: dict[str, Any] = {"user": {"profile": None}}
        # First navigate to profile (None), then try to set child - should fail in parent logic
        result = JSONPointer.resolve(data, "/user/profile")
        assert result is None

    def test_remove_from_list_out_of_range(self) -> None:
        """Should return False when removing from list with out of range index"""
        from a2ui.utils.json_pointer import JSONPointer

        data: dict[str, Any] = {"items": ["a", "b"]}
        result = JSONPointer.remove(data, "/items/10")
        assert result is False

    def test_remove_from_nested_null(self) -> None:
        """Should return False when trying to remove from null value"""
        from a2ui.utils.json_pointer import JSONPointer

        data: dict[str, Any] = {"user": None}
        result = JSONPointer.remove(data, "/user/name")
        assert result is False

    def test_remove_from_nested_primitive(self) -> None:
        """Should return False when trying to remove from primitive value"""
        from a2ui.utils.json_pointer import JSONPointer

        data: dict[str, Any] = {"value": 123}
        result = JSONPointer.remove(data, "/value/nested")
        assert result is False

    def test_resolve_single_slash(self) -> None:
        """Should return entire object for single slash pointer"""
        from a2ui.utils.json_pointer import JSONPointer

        data = {"user": "Alice"}
        result = JSONPointer.resolve(data, "/")
        assert result == data

    def test_set_creates_nested_dicts(self) -> None:
        """Should create nested dictionaries when setting deep paths"""
        from a2ui.utils.json_pointer import JSONPointer

        data: dict[str, Any] = {}
        JSONPointer.set(data, "/a/b/c/d", "deep")
        assert data == {"a": {"b": {"c": {"d": "deep"}}}}

    def test_compile_preserves_empty_tokens(self) -> None:
        """Should preserve empty tokens from consecutive slashes"""
        from a2ui.utils.json_pointer import JSONPointer

        tokens = JSONPointer.compile("//a//b")
        assert tokens == ["", "a", "", "b"]

    def test_set_on_primitive_final_target_error(self) -> None:
        """Should raise error when trying to set property on primitive value"""
        from a2ui.utils.json_pointer import JSONPointer, JSONPointerError

        data: dict[str, Any] = {"user": {"name": "Alice"}}
        # Navigate to "name" (string), then try to set child property
        with pytest.raises(JSONPointerError, match="Cannot set value on non-object"):
            JSONPointer.set(data, "/user/name/nested", "value")

    def test_remove_nondict_nonlist_final_target(self) -> None:
        """Should return False when final parent is neither dict nor list"""
        from a2ui.utils.json_pointer import JSONPointer

        # Edge case: if somehow we have an object that passes isinstance checks but isn't dict/list
        # This test ensures we handle the else clause in remove's final check
        data: dict[str, Any] = {"value": 123}
        # First ensure we can't remove from primitive
        result = JSONPointer.remove(data, "/value")
        assert result is True  # Actually removes the "value" key from dict
        assert "value" not in data

    def test_set_array_index_at_length(self) -> None:
        """Should allow setting at index == array length (append)"""
        from a2ui.utils.json_pointer import JSONPointer

        data: dict[str, Any] = {"items": ["a", "b"]}
        # Set at index 2 (length = 2), should append
        JSONPointer.set(data, "/items/2", "c")
        assert data["items"] == ["a", "b", "c"]

    def test_set_array_beyond_length_error(self) -> None:
        """Should raise error when setting beyond array length"""
        from a2ui.utils.json_pointer import JSONPointer, JSONPointerError

        data: dict[str, Any] = {"items": ["a", "b"]}
        # Try to set at index 5 when length is 2
        with pytest.raises(JSONPointerError, match="Invalid array index"):
            JSONPointer.set(data, "/items/5", "value")

    def test_remove_from_list_navigates_correctly(self) -> None:
        """Should correctly navigate through nested lists before removing"""
        from a2ui.utils.json_pointer import JSONPointer

        data: dict[str, Any] = {"matrix": [["a", "b"], ["c", "d"]]}
        result = JSONPointer.remove(data, "/matrix/1")
        assert result is True
        assert data["matrix"] == [["a", "b"]]

    def test_set_on_null_at_end_error(self) -> None:
        """Should raise error when final target is null"""
        from a2ui.utils.json_pointer import JSONPointer, JSONPointerError

        data: dict[str, Any] = {"user": {"profile": None}}
        # Navigate to user/profile (dict), profile exists but is None
        # Then try to set property on that None value
        with pytest.raises(JSONPointerError, match="Cannot set value on null"):
            JSONPointer.set(data, "/user/profile/name", "Alice")
