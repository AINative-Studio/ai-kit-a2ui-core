"""
JSON Pointer (RFC 6901) Implementation for Python.

Provides RFC 6901 compliant JSON Pointer operations for navigating and
manipulating JSON-like data structures.

Reference: https://tools.ietf.org/html/rfc6901
"""

from typing import Any, Optional


class JSONPointerError(Exception):
    """Exception raised for JSON Pointer errors."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class JSONPointer:
    """
    JSON Pointer utility class implementing RFC 6901.

    Provides static methods for resolving, setting, removing values
    in data structures using JSON Pointer syntax.

    Examples:
        >>> data = {'user': {'name': 'Alice', 'age': 30}}
        >>> JSONPointer.resolve(data, '/user/name')
        'Alice'
        >>> JSONPointer.set(data, '/user/city', 'NYC')
        >>> data
        {'user': {'name': 'Alice', 'age': 30, 'city': 'NYC'}}
    """

    @staticmethod
    def resolve(obj: Any, pointer: str) -> Optional[Any]:
        """
        Resolve a JSON Pointer path in an object.

        Args:
            obj: The object to navigate (dict, list, or any JSON-like structure)
            pointer: JSON Pointer string (e.g., "/user/name"). Must start with "/"
                    unless empty string (which returns root object)

        Returns:
            The resolved value, or None if path doesn't exist

        Raises:
            JSONPointerError: If pointer format is invalid

        Examples:
            >>> data = {'user': {'name': 'Alice'}}
            >>> JSONPointer.resolve(data, '/user/name')
            'Alice'
            >>> JSONPointer.resolve(data, '/user/missing')
            None
        """
        # Empty pointer returns root object
        if pointer == "":
            return obj

        # Root "/" also returns root object
        if pointer == "/":
            return obj

        # Validate pointer format
        if not pointer.startswith("/"):
            raise JSONPointerError(f'Invalid JSON Pointer: must start with "/" (got "{pointer}")')

        # Compile tokens and traverse
        tokens = JSONPointer.compile(pointer)
        current = obj

        for token in tokens:
            # Cannot navigate through None
            if current is None or current is None:
                return None

            # Must be an object (dict or list)
            if not isinstance(current, (dict, list)):
                return None

            # Handle arrays
            if isinstance(current, list):
                index = JSONPointer._parse_array_index(token, len(current))
                if index == -1 or index >= len(current):
                    return None
                current = current[index]
            # Handle objects/dicts
            elif isinstance(current, dict):
                if token not in current:
                    return None
                current = current[token]
            else:
                return None

        return current

    @staticmethod
    def set(obj: Any, pointer: str, value: Any) -> None:
        """
        Set a value at a JSON Pointer path.

        Creates intermediate objects as needed. Mutates the object in-place.

        Args:
            obj: The object to modify (must be dict or list)
            pointer: JSON Pointer string. Must start with "/" and not be empty
            value: The value to set

        Raises:
            JSONPointerError: If pointer is invalid, root, or navigation fails

        Examples:
            >>> data = {'user': {}}
            >>> JSONPointer.set(data, '/user/name', 'Alice')
            >>> data
            {'user': {'name': 'Alice'}}
        """
        # Cannot set root
        if not pointer or pointer == "":
            raise JSONPointerError("Cannot set root value")

        # Validate pointer format
        if not pointer.startswith("/"):
            raise JSONPointerError(f'Invalid JSON Pointer: must start with "/" (got "{pointer}")')

        # Compile tokens
        tokens = JSONPointer.compile(pointer)
        if not tokens:
            raise JSONPointerError("Invalid JSON Pointer: no tokens")

        # Get parent path and final key
        last_token = tokens.pop()

        # Navigate to parent, creating intermediate objects as needed
        current = obj
        for i, token in enumerate(tokens):
            if current is None:
                raise JSONPointerError(f"Cannot navigate through null/undefined")

            if not isinstance(current, (dict, list)):
                raise JSONPointerError(f"Cannot navigate through non-object")

            # Handle arrays
            if isinstance(current, list):
                index = JSONPointer._parse_array_index(token, len(current))
                if index == -1 or index >= len(current):
                    raise JSONPointerError(f'Invalid array index: "{token}"')
                current = current[index]
            # Handle objects/dicts
            elif isinstance(current, dict):
                # Create intermediate object if missing
                if token not in current:
                    current[token] = {}
                current = current[token]

            # After navigation, check if we need to continue and current is invalid
            if i < len(tokens) - 1:  # Not the last token yet
                if current is None:
                    raise JSONPointerError(f"Cannot navigate through null/undefined")
                if not isinstance(current, (dict, list)):
                    raise JSONPointerError(f"Cannot navigate through non-object")

        # Set final value
        if current is None:
            raise JSONPointerError("Cannot set value on null/undefined")

        if not isinstance(current, (dict, list)):
            raise JSONPointerError("Cannot set value on non-object")

        # Handle arrays
        if isinstance(current, list):
            # Special "-" token means append
            if last_token == "-":
                current.append(value)
            else:
                index = JSONPointer._parse_array_index(last_token, len(current))
                if index == -1:
                    raise JSONPointerError(f'Invalid array index: "{last_token}"')
                # Allow setting at existing index or one past end
                if index <= len(current):
                    if index == len(current):
                        current.append(value)
                    else:
                        current[index] = value
                else:
                    raise JSONPointerError(f'Invalid array index: "{last_token}"')
        # Handle objects/dicts
        elif isinstance(current, dict):
            current[last_token] = value

    @staticmethod
    def remove(obj: Any, pointer: str) -> bool:
        """
        Remove a value at a JSON Pointer path.

        Args:
            obj: The object to modify (must be dict or list)
            pointer: JSON Pointer string. Must start with "/" and not be empty

        Returns:
            True if value was removed, False if path didn't exist

        Raises:
            JSONPointerError: If pointer is invalid or root

        Examples:
            >>> data = {'user': {'name': 'Alice', 'age': 30}}
            >>> JSONPointer.remove(data, '/user/age')
            True
            >>> data
            {'user': {'name': 'Alice'}}
        """
        # Cannot remove root
        if not pointer or pointer == "":
            raise JSONPointerError("Cannot remove root value")

        # Validate pointer format
        if not pointer.startswith("/"):
            raise JSONPointerError(f'Invalid JSON Pointer: must start with "/" (got "{pointer}")')

        # Compile tokens
        tokens = JSONPointer.compile(pointer)
        if not tokens:
            raise JSONPointerError("Invalid JSON Pointer: no tokens")

        # Get parent path and final key
        last_token = tokens.pop()

        # Navigate to parent
        current = obj
        for token in tokens:
            if current is None:
                return False

            if not isinstance(current, (dict, list)):
                return False

            # Handle arrays
            if isinstance(current, list):
                index = JSONPointer._parse_array_index(token, len(current))
                if index == -1 or index >= len(current):
                    return False
                current = current[index]
            # Handle objects/dicts
            elif isinstance(current, dict):
                if token not in current:
                    return False
                current = current[token]

        # Remove final value
        if current is None:
            return False

        if not isinstance(current, (dict, list)):
            return False

        # Handle arrays
        if isinstance(current, list):
            index = JSONPointer._parse_array_index(last_token, len(current))
            if index == -1 or index >= len(current):
                return False
            del current[index]
            return True
        # Handle objects/dicts
        elif isinstance(current, dict):
            if last_token not in current:
                return False
            del current[last_token]
            return True

        return False

    @staticmethod
    def compile(pointer: str) -> list[str]:
        """
        Compile a JSON Pointer into an array of reference tokens.

        Handles RFC 6901 escape sequences (~0 for ~, ~1 for /).

        Args:
            pointer: JSON Pointer string (empty string or starting with "/")

        Returns:
            List of unescaped tokens

        Raises:
            JSONPointerError: If pointer format is invalid

        Examples:
            >>> JSONPointer.compile('/user/profile/name')
            ['user', 'profile', 'name']
            >>> JSONPointer.compile('/user~0name/path~1to')
            ['user~name', 'path/to']
        """
        # Empty pointer
        if pointer == "":
            return []

        # Validate format
        if not pointer.startswith("/"):
            raise JSONPointerError(f'Invalid JSON Pointer: must start with "/" (got "{pointer}")')

        # Split on "/" and unescape each token
        # Remove leading "/" first
        tokens = pointer[1:].split("/")
        return [JSONPointer._unescape(token) for token in tokens]

    @staticmethod
    def _unescape(token: str) -> str:
        """
        Unescape a JSON Pointer token.

        Per RFC 6901:
        - ~1 represents /
        - ~0 represents ~

        Must process ~1 first, then ~0.
        """
        # Order matters: ~1 first, then ~0
        return token.replace("~1", "/").replace("~0", "~")

    @staticmethod
    def _parse_array_index(token: str, array_length: int) -> int:
        """
        Parse an array index from a token.

        Returns:
            The index as an integer, or -1 if invalid

        Rules per RFC 6901:
        - Must be non-negative integer
        - No leading zeros (except "0" itself)
        - "-" is special: means append (returns array_length)
        """
        # "-" means append
        if token == "-":
            return array_length

        # Must be digits only
        if not token.isdigit():
            return -1

        # Reject leading zeros (except "0" itself)
        if len(token) > 1 and token.startswith("0"):
            return -1

        return int(token)
