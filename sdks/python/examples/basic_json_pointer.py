"""
Basic JSON Pointer Examples

Demonstrates core JSON Pointer functionality including resolve, set, and remove operations.
"""

from a2ui import JSONPointer, JSONPointerError


def main() -> None:
    """Run basic JSON Pointer examples."""

    print("=" * 60)
    print("A2UI Python SDK - JSON Pointer Examples")
    print("=" * 60)

    # Example 1: Resolving values
    print("\n1. Resolving Values")
    print("-" * 60)

    data = {
        "user": {"profile": {"name": "Alice", "age": 30}, "settings": {"theme": "dark"}},
        "items": ["apple", "banana", "cherry"],
    }

    print(f"Data: {data}\n")

    # Simple resolution
    name = JSONPointer.resolve(data, "/user/profile/name")
    print(f'resolve("/user/profile/name") = {name}')

    age = JSONPointer.resolve(data, "/user/profile/age")
    print(f'resolve("/user/profile/age") = {age}')

    theme = JSONPointer.resolve(data, "/user/settings/theme")
    print(f'resolve("/user/settings/theme") = {theme}')

    # Array resolution
    first_item = JSONPointer.resolve(data, "/items/0")
    print(f'resolve("/items/0") = {first_item}')

    third_item = JSONPointer.resolve(data, "/items/2")
    print(f'resolve("/items/2") = {third_item}')

    # Non-existent paths
    missing = JSONPointer.resolve(data, "/user/missing")
    print(f'resolve("/user/missing") = {missing}')

    # Example 2: Setting values
    print("\n2. Setting Values")
    print("-" * 60)

    data2 = {"user": {"name": "Bob"}}
    print(f"Initial: {data2}")

    # Add new property
    JSONPointer.set(data2, "/user/age", 25)
    print(f'After set("/user/age", 25): {data2}')

    # Create nested structure
    JSONPointer.set(data2, "/user/address/city", "NYC")
    print(f'After set("/user/address/city", "NYC"): {data2}')

    # Example 3: Array operations
    print("\n3. Array Operations")
    print("-" * 60)

    data3 = {"items": ["a", "b", "c"]}
    print(f"Initial: {data3}")

    # Modify array element
    JSONPointer.set(data3, "/items/1", "B")
    print(f'After set("/items/1", "B"): {data3}')

    # Append using "-" token
    JSONPointer.set(data3, "/items/-", "d")
    print(f'After set("/items/-", "d"): {data3}')

    # Example 4: Removing values
    print("\n4. Removing Values")
    print("-" * 60)

    data4 = {"user": {"name": "Charlie", "age": 35, "email": "charlie@example.com"}}
    print(f"Initial: {data4}")

    # Remove property
    removed = JSONPointer.remove(data4, "/user/age")
    print(f'After remove("/user/age"): {data4} (removed={removed})')

    # Try to remove non-existent
    removed = JSONPointer.remove(data4, "/user/phone")
    print(f'After remove("/user/phone"): {data4} (removed={removed})')

    # Example 5: Escape sequences
    print("\n5. Escape Sequences (RFC 6901)")
    print("-" * 60)

    data5 = {"user~name": "Dave", "path/to": {"value": 123}, "a~b/c": "complex"}

    print(f"Data: {data5}\n")

    # ~ is escaped as ~0
    result = JSONPointer.resolve(data5, "/user~0name")
    print(f'resolve("/user~0name") = {result}  (~ escaped as ~0)')

    # / is escaped as ~1
    result = JSONPointer.resolve(data5, "/path~1to/value")
    print(f'resolve("/path~1to/value") = {result}  (/ escaped as ~1)')

    # Multiple escapes
    result = JSONPointer.resolve(data5, "/a~0b~1c")
    print(f'resolve("/a~0b~1c") = {result}  (both ~ and / escaped)')

    # Example 6: Compiling pointers
    print("\n6. Compiling Pointers")
    print("-" * 60)

    pointers = [
        "/user/profile/name",
        "/items/0",
        "",
        "/user~0name/path~1to",
    ]

    for pointer in pointers:
        tokens = JSONPointer.compile(pointer)
        print(f'compile("{pointer}") = {tokens}')

    # Example 7: Error handling
    print("\n7. Error Handling")
    print("-" * 60)

    try:
        # Invalid pointer (missing leading "/")
        JSONPointer.resolve(data, "user/name")
    except JSONPointerError as e:
        print(f"Error: {e.message}")

    try:
        # Cannot set root
        JSONPointer.set(data, "", {"new": "data"})
    except JSONPointerError as e:
        print(f"Error: {e.message}")

    try:
        # Cannot navigate through null
        data6 = {"user": None}
        JSONPointer.set(data6, "/user/name/nested", "value")
    except JSONPointerError as e:
        print(f"Error: {e.message}")

    print("\n" + "=" * 60)
    print("Examples completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
