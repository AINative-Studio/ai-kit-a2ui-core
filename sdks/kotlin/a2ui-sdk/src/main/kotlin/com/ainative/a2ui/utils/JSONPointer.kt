package com.ainative.a2ui.utils

/**
 * Exception raised for JSON Pointer errors.
 *
 * @property message The error message describing the issue
 */
public class JSONPointerError(override val message: String) : Exception(message)

/**
 * JSON Pointer utility implementing RFC 6901.
 *
 * Provides operations for resolving, setting, and removing values in
 * data structures using JSON Pointer syntax.
 *
 * Reference: https://tools.ietf.org/html/rfc6901
 *
 * Example:
 * ```kotlin
 * val data = mapOf("user" to mapOf("name" to "Alice", "age" to 30))
 * val name = JSONPointer.resolve(data, "/user/name") // "Alice"
 * ```
 */
public object JSONPointer {

    /**
     * Resolve a JSON Pointer path in an object.
     *
     * @param obj The object to navigate (Map, List, or any JSON-like structure)
     * @param pointer JSON Pointer string (e.g., "/user/name"). Must start with "/"
     *                unless empty string (which returns root object)
     * @return The resolved value, or null if path doesn't exist
     * @throws JSONPointerError If pointer format is invalid
     *
     * Example:
     * ```kotlin
     * val data = mapOf("user" to mapOf("name" to "Alice"))
     * JSONPointer.resolve(data, "/user/name") // "Alice"
     * JSONPointer.resolve(data, "/user/missing") // null
     * ```
     */
    public fun resolve(obj: Any?, pointer: String): Any? {
        // Empty pointer returns root object
        if (pointer.isEmpty() || pointer == "/") {
            return obj
        }

        // Validate pointer format
        if (!pointer.startsWith("/")) {
            throw JSONPointerError("Invalid JSON Pointer: must start with \"/\" (got \"$pointer\")")
        }

        // Compile tokens and traverse
        val tokens = compile(pointer)
        var current: Any? = obj

        for (token in tokens) {
            // Cannot navigate through null
            if (current == null) {
                return null
            }

            // Handle arrays
            if (current is List<*>) {
                val index = parseArrayIndex(token, current.size)
                if (index == -1 || index >= current.size) {
                    return null
                }
                current = current[index]
            }
            // Handle objects/maps
            else if (current is Map<*, *>) {
                if (token !in current) {
                    return null
                }
                current = current[token]
            }
            // Cannot navigate through primitives
            else {
                return null
            }
        }

        return current
    }

    /**
     * Set a value at a JSON Pointer path.
     *
     * Creates intermediate objects as needed. Mutates the object in-place.
     *
     * @param obj The object to modify (must be MutableMap or MutableList)
     * @param pointer JSON Pointer string. Must start with "/" and not be empty
     * @param value The value to set
     * @throws JSONPointerError If pointer is invalid, root, or navigation fails
     *
     * Example:
     * ```kotlin
     * val data = mutableMapOf<String, Any>("user" to mutableMapOf<String, Any>())
     * JSONPointer.set(data, "/user/name", "Alice")
     * // data is now {"user": {"name": "Alice"}}
     * ```
     */
    public fun set(obj: Any?, pointer: String, value: Any?) {
        // Cannot set root
        if (pointer.isEmpty()) {
            throw JSONPointerError("Cannot set root value")
        }

        // Validate pointer format
        if (!pointer.startsWith("/")) {
            throw JSONPointerError("Invalid JSON Pointer: must start with \"/\" (got \"$pointer\")")
        }

        // Compile tokens
        val tokens = compile(pointer).toMutableList()
        if (tokens.isEmpty()) {
            throw JSONPointerError("Invalid JSON Pointer: no tokens")
        }

        // Get parent path and final key
        val lastToken = tokens.removeAt(tokens.size - 1)

        // Navigate to parent, creating intermediate objects as needed
        var current: Any? = obj
        for ((i, token) in tokens.withIndex()) {
            if (current == null) {
                throw JSONPointerError("Cannot navigate through null/undefined")
            }

            if (current !is MutableMap<*, *> && current !is MutableList<*>) {
                throw JSONPointerError("Cannot navigate through non-object")
            }

            // Handle arrays
            if (current is MutableList<*>) {
                val index = parseArrayIndex(token, current.size)
                if (index == -1 || index >= current.size) {
                    throw JSONPointerError("Invalid array index: \"$token\"")
                }
                current = current[index]
            }
            // Handle objects/maps
            else if (current is MutableMap<*, *>) {
                @Suppress("UNCHECKED_CAST")
                val map = current as MutableMap<String, Any?>
                // Create intermediate object if missing
                if (token !in map) {
                    map[token] = mutableMapOf<String, Any?>()
                }
                current = map[token]
            }

            // After navigation, check if we need to continue and current is invalid
            if (i < tokens.size - 1) { // Not the last token yet
                if (current == null) {
                    throw JSONPointerError("Cannot navigate through null/undefined")
                }
                if (current !is MutableMap<*, *> && current !is MutableList<*>) {
                    throw JSONPointerError("Cannot navigate through non-object")
                }
            }
        }

        // Set final value
        if (current == null) {
            throw JSONPointerError("Cannot set value on null/undefined")
        }

        if (current !is MutableMap<*, *> && current !is MutableList<*>) {
            throw JSONPointerError("Cannot set value on non-object")
        }

        // Handle arrays
        if (current is MutableList<*>) {
            @Suppress("UNCHECKED_CAST")
            val list = current as MutableList<Any?>
            // Special "-" token means append
            if (lastToken == "-") {
                list.add(value)
            } else {
                val index = parseArrayIndex(lastToken, list.size)
                if (index == -1) {
                    throw JSONPointerError("Invalid array index: \"$lastToken\"")
                }
                // Allow setting at existing index or one past end
                if (index <= list.size) {
                    if (index == list.size) {
                        list.add(value)
                    } else {
                        list[index] = value
                    }
                } else {
                    throw JSONPointerError("Invalid array index: \"$lastToken\"")
                }
            }
        }
        // Handle objects/maps
        else if (current is MutableMap<*, *>) {
            @Suppress("UNCHECKED_CAST")
            val map = current as MutableMap<String, Any?>
            map[lastToken] = value
        }
    }

    /**
     * Remove a value at a JSON Pointer path.
     *
     * @param obj The object to modify (must be MutableMap or MutableList)
     * @param pointer JSON Pointer string. Must start with "/" and not be empty
     * @return True if value was removed, false if path didn't exist
     * @throws JSONPointerError If pointer is invalid or root
     *
     * Example:
     * ```kotlin
     * val data = mutableMapOf("user" to mutableMapOf("name" to "Alice", "age" to 30))
     * JSONPointer.remove(data, "/user/age") // true
     * // data is now {"user": {"name": "Alice"}}
     * ```
     */
    public fun remove(obj: Any?, pointer: String): Boolean {
        // Cannot remove root
        if (pointer.isEmpty()) {
            throw JSONPointerError("Cannot remove root value")
        }

        // Validate pointer format
        if (!pointer.startsWith("/")) {
            throw JSONPointerError("Invalid JSON Pointer: must start with \"/\" (got \"$pointer\")")
        }

        // Compile tokens
        val tokens = compile(pointer).toMutableList()
        if (tokens.isEmpty()) {
            throw JSONPointerError("Invalid JSON Pointer: no tokens")
        }

        // Get parent path and final key
        val lastToken = tokens.removeAt(tokens.size - 1)

        // Navigate to parent
        var current: Any? = obj
        for (token in tokens) {
            if (current == null) {
                return false
            }

            if (current !is Map<*, *> && current !is List<*>) {
                return false
            }

            // Handle arrays
            if (current is List<*>) {
                val index = parseArrayIndex(token, current.size)
                if (index == -1 || index >= current.size) {
                    return false
                }
                current = current[index]
            }
            // Handle objects/maps
            else if (current is Map<*, *>) {
                if (token !in current) {
                    return false
                }
                current = current[token]
            }
        }

        // Remove final value
        if (current == null) {
            return false
        }

        if (current !is MutableMap<*, *> && current !is MutableList<*>) {
            return false
        }

        // Handle arrays
        if (current is MutableList<*>) {
            @Suppress("UNCHECKED_CAST")
            val list = current as MutableList<Any?>
            val index = parseArrayIndex(lastToken, list.size)
            if (index == -1 || index >= list.size) {
                return false
            }
            list.removeAt(index)
            return true
        }
        // Handle objects/maps
        else if (current is MutableMap<*, *>) {
            @Suppress("UNCHECKED_CAST")
            val map = current as MutableMap<String, Any?>
            if (lastToken !in map) {
                return false
            }
            map.remove(lastToken)
            return true
        }

        return false
    }

    /**
     * Check if a JSON Pointer path exists in an object.
     *
     * @param obj The object to check
     * @param pointer JSON Pointer string
     * @return True if path exists, false otherwise
     *
     * Example:
     * ```kotlin
     * val data = mapOf("user" to mapOf("name" to "Alice"))
     * JSONPointer.has(data, "/user/name") // true
     * JSONPointer.has(data, "/user/age") // false
     * ```
     */
    public fun has(obj: Any?, pointer: String): Boolean {
        return resolve(obj, pointer) != null || pointer.isEmpty()
    }

    /**
     * Compile a JSON Pointer into an array of reference tokens.
     *
     * Handles RFC 6901 escape sequences (~0 for ~, ~1 for /).
     *
     * @param pointer JSON Pointer string (empty string or starting with "/")
     * @return List of unescaped tokens
     * @throws JSONPointerError If pointer format is invalid
     *
     * Example:
     * ```kotlin
     * JSONPointer.compile("/user/profile/name")
     * // ["user", "profile", "name"]
     * JSONPointer.compile("/user~0name/path~1to")
     * // ["user~name", "path/to"]
     * ```
     */
    public fun compile(pointer: String): List<String> {
        // Empty pointer
        if (pointer.isEmpty()) {
            return emptyList()
        }

        // Validate format
        if (!pointer.startsWith("/")) {
            throw JSONPointerError("Invalid JSON Pointer: must start with \"/\" (got \"$pointer\")")
        }

        // Split on "/" and unescape each token
        // Remove leading "/" first
        val tokens = pointer.substring(1).split("/")
        return tokens.map { unescape(it) }
    }

    /**
     * Format a JSON Pointer from an array of reference tokens.
     *
     * Escapes special characters in tokens.
     *
     * @param segments List of tokens
     * @return JSON Pointer string
     *
     * Example:
     * ```kotlin
     * JSONPointer.format(listOf("user", "name"))
     * // "/user/name"
     * JSONPointer.format(listOf("user~name", "path/to"))
     * // "/user~0name/path~1to"
     * ```
     */
    public fun format(segments: List<String>): String {
        if (segments.isEmpty()) {
            return ""
        }
        return segments.joinToString("/", prefix = "/") { escape(it) }
    }

    /**
     * Escape a JSON Pointer token.
     *
     * Per RFC 6901:
     * - ~ becomes ~0
     * - / becomes ~1
     *
     * Must process ~ first, then /.
     *
     * @param str String to escape
     * @return Escaped string
     *
     * Example:
     * ```kotlin
     * JSONPointer.escape("user~name") // "user~0name"
     * JSONPointer.escape("path/to") // "path~1to"
     * ```
     */
    public fun escape(str: String): String {
        // Order matters: ~ first, then /
        return str.replace("~", "~0").replace("/", "~1")
    }

    /**
     * Unescape a JSON Pointer token.
     *
     * Per RFC 6901:
     * - ~1 represents /
     * - ~0 represents ~
     *
     * Must process ~1 first, then ~0.
     *
     * @param token Token to unescape
     * @return Unescaped string
     *
     * Example:
     * ```kotlin
     * JSONPointer.unescape("user~0name") // "user~name"
     * JSONPointer.unescape("path~1to") // "path/to"
     * ```
     */
    public fun unescape(token: String): String {
        // Order matters: ~1 first, then ~0
        return token.replace("~1", "/").replace("~0", "~")
    }

    /**
     * Parse an array index from a token.
     *
     * @param token Token to parse
     * @param arrayLength Length of the array
     * @return The index as an integer, or -1 if invalid
     *
     * Rules per RFC 6901:
     * - Must be non-negative integer
     * - No leading zeros (except "0" itself)
     * - "-" is special: means append (returns arrayLength)
     */
    private fun parseArrayIndex(token: String, arrayLength: Int): Int {
        // "-" means append
        if (token == "-") {
            return arrayLength
        }

        // Must be digits only
        if (!token.all { it.isDigit() }) {
            return -1
        }

        // Reject leading zeros (except "0" itself)
        if (token.length > 1 && token.startsWith("0")) {
            return -1
        }

        return token.toIntOrNull() ?: -1
    }
}
