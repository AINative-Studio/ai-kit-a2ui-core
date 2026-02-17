package com.ainative.a2ui

import com.ainative.a2ui.utils.JSONPointer
import com.ainative.a2ui.utils.JSONPointerError
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * Test suite for JSON Pointer (RFC 6901) implementation.
 *
 * Following TDD principles - tests written BEFORE implementation.
 * Based on Python SDK test suite for consistency.
 */
class JSONPointerResolveTest {

    @Test
    fun `should return entire object for empty pointer`() {
        val data = mapOf("user" to mapOf("name" to "Alice"))
        val result = JSONPointer.resolve(data, "")
        assertEquals(data, result)
    }

    @Test
    fun `should return entire object for single slash pointer`() {
        val data = mapOf("user" to "Alice")
        val result = JSONPointer.resolve(data, "/")
        assertEquals(data, result)
    }

    @Test
    fun `should resolve simple object property`() {
        val data = mapOf("name" to "Alice", "age" to 30)
        assertEquals("Alice", JSONPointer.resolve(data, "/name"))
        assertEquals(30, JSONPointer.resolve(data, "/age"))
    }

    @Test
    fun `should resolve nested object properties`() {
        val data = mapOf(
            "user" to mapOf(
                "profile" to mapOf(
                    "name" to "Alice",
                    "age" to 30
                )
            )
        )
        assertEquals("Alice", JSONPointer.resolve(data, "/user/profile/name"))
        assertEquals(30, JSONPointer.resolve(data, "/user/profile/age"))
    }

    @Test
    fun `should resolve array elements by index`() {
        val data = mapOf("items" to listOf("a", "b", "c"))
        assertEquals("a", JSONPointer.resolve(data, "/items/0"))
        assertEquals("b", JSONPointer.resolve(data, "/items/1"))
        assertEquals("c", JSONPointer.resolve(data, "/items/2"))
    }

    @Test
    fun `should handle tilde escape sequence (~0)`() {
        val data = mapOf("user~name" to "Alice")
        assertEquals("Alice", JSONPointer.resolve(data, "/user~0name"))
    }

    @Test
    fun `should handle slash escape sequence (~1)`() {
        val data = mapOf("path/to" to mapOf("value" to 123))
        assertEquals(123, JSONPointer.resolve(data, "/path~1to/value"))
    }

    @Test
    fun `should handle multiple escape sequences in single token`() {
        val data = mapOf("a~b/c" to "value")
        assertEquals("value", JSONPointer.resolve(data, "/a~0b~1c"))
    }

    @Test
    fun `should return null for non-existent paths`() {
        val data = mapOf("user" to mapOf("name" to "Alice"))
        assertNull(JSONPointer.resolve(data, "/user/missing"))
        assertNull(JSONPointer.resolve(data, "/nonexistent"))
    }

    @Test
    fun `should return null for invalid array indices`() {
        val data = mapOf("items" to listOf("a", "b", "c"))
        assertNull(JSONPointer.resolve(data, "/items/99"))
        assertNull(JSONPointer.resolve(data, "/items/abc"))
    }

    @Test
    fun `should throw error for pointers not starting with slash`() {
        val data = mapOf("user" to "Alice")
        val exception = assertThrows<JSONPointerError> {
            JSONPointer.resolve(data, "user/name")
        }
        assertTrue(exception.message.contains("must start with"))
    }

    @Test
    fun `should return null when navigating through null`() {
        val data = mapOf("user" to null)
        assertNull(JSONPointer.resolve(data, "/user/name"))
    }

    @Test
    fun `should return null when navigating through primitives`() {
        val data = mapOf("value" to 123)
        assertNull(JSONPointer.resolve(data, "/value/nested"))
    }

    @Test
    fun `should handle empty tokens (consecutive slashes)`() {
        val data = mapOf("" to mapOf("name" to "Alice"))
        assertEquals("Alice", JSONPointer.resolve(data, "//name"))
    }

    @Test
    fun `should reject array indices with leading zeros`() {
        val data = mapOf("items" to listOf("a", "b", "c"))
        assertNull(JSONPointer.resolve(data, "/items/01"))
    }

    @Test
    fun `should reject negative array indices`() {
        val data = mapOf("items" to listOf("a", "b", "c"))
        assertNull(JSONPointer.resolve(data, "/items/-1"))
    }
}

class JSONPointerSetTest {

    @Test
    fun `should set simple object property`() {
        val data = mutableMapOf<String, Any>("name" to "Alice")
        JSONPointer.set(data, "/age", 30)
        assertEquals(mapOf("name" to "Alice", "age" to 30), data)
    }

    @Test
    fun `should set nested object property`() {
        val data = mutableMapOf<String, Any>(
            "user" to mutableMapOf<String, Any>("name" to "Alice")
        )
        JSONPointer.set(data, "/user/age", 30)
        val user = data["user"] as Map<*, *>
        assertEquals("Alice", user["name"])
        assertEquals(30, user["age"])
    }

    @Test
    fun `should create intermediate objects if they don't exist`() {
        val data = mutableMapOf<String, Any>()
        JSONPointer.set(data, "/user/profile/city", "NYC")

        val user = data["user"] as Map<*, *>
        val profile = user["profile"] as Map<*, *>
        assertEquals("NYC", profile["city"])
    }

    @Test
    fun `should create deeply nested structures`() {
        val data = mutableMapOf<String, Any>()
        JSONPointer.set(data, "/a/b/c/d", "deep")

        val a = data["a"] as Map<*, *>
        val b = a["b"] as Map<*, *>
        val c = b["c"] as Map<*, *>
        assertEquals("deep", c["d"])
    }

    @Test
    fun `should set array element by index`() {
        val data = mutableMapOf<String, Any>(
            "items" to mutableListOf("a", "b", "c")
        )
        JSONPointer.set(data, "/items/1", "B")
        val items = data["items"] as List<*>
        assertEquals(listOf("a", "B", "c"), items)
    }

    @Test
    fun `should append to array using minus token`() {
        val data = mutableMapOf<String, Any>(
            "items" to mutableListOf("a", "b")
        )
        JSONPointer.set(data, "/items/-", "c")
        val items = data["items"] as List<*>
        assertEquals(listOf("a", "b", "c"), items)
    }

    @Test
    fun `should allow setting at index equal to array length (append)`() {
        val data = mutableMapOf<String, Any>(
            "items" to mutableListOf("a", "b")
        )
        JSONPointer.set(data, "/items/2", "c")
        val items = data["items"] as List<*>
        assertEquals(listOf("a", "b", "c"), items)
    }

    @Test
    fun `should throw error for pointers not starting with slash`() {
        val data = mutableMapOf<String, Any>()
        val exception = assertThrows<JSONPointerError> {
            JSONPointer.set(data, "user/name", "Alice")
        }
        assertTrue(exception.message.contains("must start with"))
    }

    @Test
    fun `should throw error when trying to set root`() {
        val data = mutableMapOf<String, Any>()
        val exception = assertThrows<JSONPointerError> {
            JSONPointer.set(data, "", mapOf("new" to "data"))
        }
        assertTrue(exception.message.contains("Cannot set root"))
    }

    @Test
    fun `should throw error for invalid array index`() {
        val data = mutableMapOf<String, Any>(
            "items" to mutableListOf("a", "b")
        )
        val exception = assertThrows<JSONPointerError> {
            JSONPointer.set(data, "/items/abc", "value")
        }
        assertTrue(exception.message.contains("Invalid array index"))
    }

    @Test
    fun `should throw error when setting beyond array length`() {
        val data = mutableMapOf<String, Any>(
            "items" to mutableListOf("a", "b")
        )
        val exception = assertThrows<JSONPointerError> {
            JSONPointer.set(data, "/items/5", "value")
        }
        assertTrue(exception.message.contains("Invalid array index"))
    }

    @Test
    fun `should throw error when navigating through null`() {
        val data = mutableMapOf<String, Any>("user" to null)
        val exception = assertThrows<JSONPointerError> {
            JSONPointer.set(data, "/user/name/nested", "Alice")
        }
        assertTrue(exception.message.contains("Cannot navigate"))
    }

    @Test
    fun `should throw error when navigating through primitive value`() {
        val data = mutableMapOf<String, Any>("value" to 123)
        val exception = assertThrows<JSONPointerError> {
            JSONPointer.set(data, "/value/nested/deep", "data")
        }
        assertTrue(exception.message.contains("Cannot navigate"))
    }

    @Test
    fun `should throw error when trying to set property on primitive value`() {
        val data = mutableMapOf<String, Any>(
            "user" to mutableMapOf<String, Any>("name" to "Alice")
        )
        val exception = assertThrows<JSONPointerError> {
            JSONPointer.set(data, "/user/name/nested", "value")
        }
        assertTrue(exception.message.contains("Cannot set value on non-object"))
    }

    @Test
    fun `should throw error when final target is null`() {
        val data = mutableMapOf<String, Any>(
            "user" to mutableMapOf<String, Any>("profile" to null)
        )
        val exception = assertThrows<JSONPointerError> {
            JSONPointer.set(data, "/user/profile/name", "Alice")
        }
        assertTrue(exception.message.contains("Cannot set value on null"))
    }
}

class JSONPointerRemoveTest {

    @Test
    fun `should remove simple object property`() {
        val data = mutableMapOf<String, Any>("name" to "Alice", "age" to 30)
        val result = JSONPointer.remove(data, "/age")
        assertTrue(result)
        assertEquals(mapOf("name" to "Alice"), data)
    }

    @Test
    fun `should remove nested object property`() {
        val data = mutableMapOf<String, Any>(
            "user" to mutableMapOf<String, Any>("name" to "Alice", "age" to 30)
        )
        val result = JSONPointer.remove(data, "/user/age")
        assertTrue(result)

        val user = data["user"] as Map<*, *>
        assertEquals(mapOf("name" to "Alice"), user)
    }

    @Test
    fun `should remove array element by index`() {
        val data = mutableMapOf<String, Any>(
            "items" to mutableListOf("a", "b", "c")
        )
        val result = JSONPointer.remove(data, "/items/1")
        assertTrue(result)

        val items = data["items"] as List<*>
        assertEquals(listOf("a", "c"), items)
    }

    @Test
    fun `should correctly navigate through nested lists before removing`() {
        val data = mutableMapOf<String, Any>(
            "matrix" to mutableListOf(
                mutableListOf("a", "b"),
                mutableListOf("c", "d")
            )
        )
        val result = JSONPointer.remove(data, "/matrix/1")
        assertTrue(result)

        val matrix = data["matrix"] as List<*>
        assertEquals(1, matrix.size)
    }

    @Test
    fun `should return false for non-existent paths`() {
        val data = mutableMapOf<String, Any>(
            "user" to mutableMapOf<String, Any>("name" to "Alice")
        )
        val result = JSONPointer.remove(data, "/user/missing")
        assertFalse(result)

        val user = data["user"] as Map<*, *>
        assertEquals(mapOf("name" to "Alice"), user)
    }

    @Test
    fun `should return false when removing from list with out of range index`() {
        val data = mutableMapOf<String, Any>(
            "items" to mutableListOf("a", "b")
        )
        val result = JSONPointer.remove(data, "/items/10")
        assertFalse(result)
    }

    @Test
    fun `should return false when trying to remove from null value`() {
        val data = mutableMapOf<String, Any>("user" to null)
        val result = JSONPointer.remove(data, "/user/name")
        assertFalse(result)
    }

    @Test
    fun `should return false when trying to remove from primitive value`() {
        val data = mutableMapOf<String, Any>("value" to 123)
        val result = JSONPointer.remove(data, "/value/nested")
        assertFalse(result)
    }

    @Test
    fun `should throw error for pointers not starting with slash`() {
        val data = mutableMapOf<String, Any>("user" to "Alice")
        val exception = assertThrows<JSONPointerError> {
            JSONPointer.remove(data, "user/name")
        }
        assertTrue(exception.message.contains("must start with"))
    }

    @Test
    fun `should throw error when trying to remove root`() {
        val data = mutableMapOf<String, Any>("user" to "Alice")
        val exception = assertThrows<JSONPointerError> {
            JSONPointer.remove(data, "")
        }
        assertTrue(exception.message.contains("Cannot remove root"))
    }
}

class JSONPointerCompileTest {

    @Test
    fun `should compile simple path into tokens`() {
        val tokens = JSONPointer.compile("/user/name")
        assertEquals(listOf("user", "name"), tokens)
    }

    @Test
    fun `should compile pointer with array index`() {
        val tokens = JSONPointer.compile("/items/0")
        assertEquals(listOf("items", "0"), tokens)
    }

    @Test
    fun `should return empty list for root pointer`() {
        val tokens = JSONPointer.compile("")
        assertEquals(emptyList(), tokens)
    }

    @Test
    fun `should unescape ~0 and ~1 sequences`() {
        val tokens = JSONPointer.compile("/user~0name/path~1to")
        assertEquals(listOf("user~name", "path/to"), tokens)
    }

    @Test
    fun `should preserve empty tokens from consecutive slashes`() {
        val tokens = JSONPointer.compile("//a//b")
        assertEquals(listOf("", "a", "", "b"), tokens)
    }

    @Test
    fun `should throw error for pointers not starting with slash`() {
        val exception = assertThrows<JSONPointerError> {
            JSONPointer.compile("user/name")
        }
        assertTrue(exception.message.contains("must start with"))
    }
}

class JSONPointerHasTest {

    @Test
    fun `should return true for existing simple property`() {
        val data = mapOf("name" to "Alice", "age" to 30)
        assertTrue(JSONPointer.has(data, "/name"))
    }

    @Test
    fun `should return true for existing nested property`() {
        val data = mapOf(
            "user" to mapOf("profile" to mapOf("name" to "Alice"))
        )
        assertTrue(JSONPointer.has(data, "/user/profile/name"))
    }

    @Test
    fun `should return true for existing array element`() {
        val data = mapOf("items" to listOf("a", "b", "c"))
        assertTrue(JSONPointer.has(data, "/items/1"))
    }

    @Test
    fun `should return false for non-existent property`() {
        val data = mapOf("name" to "Alice")
        assertFalse(JSONPointer.has(data, "/age"))
    }

    @Test
    fun `should return false for non-existent nested property`() {
        val data = mapOf("user" to mapOf("name" to "Alice"))
        assertFalse(JSONPointer.has(data, "/user/missing"))
    }

    @Test
    fun `should return false for out of bounds array index`() {
        val data = mapOf("items" to listOf("a", "b"))
        assertFalse(JSONPointer.has(data, "/items/10"))
    }

    @Test
    fun `should return true for root pointer`() {
        val data = mapOf("name" to "Alice")
        assertTrue(JSONPointer.has(data, ""))
    }
}

class JSONPointerFormatTest {

    @Test
    fun `should format simple path from tokens`() {
        val pointer = JSONPointer.format(listOf("user", "name"))
        assertEquals("/user/name", pointer)
    }

    @Test
    fun `should format path with array index`() {
        val pointer = JSONPointer.format(listOf("items", "0"))
        assertEquals("/items/0", pointer)
    }

    @Test
    fun `should return empty string for empty token list`() {
        val pointer = JSONPointer.format(emptyList())
        assertEquals("", pointer)
    }

    @Test
    fun `should escape special characters when formatting`() {
        val pointer = JSONPointer.format(listOf("user~name", "path/to"))
        assertEquals("/user~0name/path~1to", pointer)
    }

    @Test
    fun `should handle empty tokens`() {
        val pointer = JSONPointer.format(listOf("", "a", "", "b"))
        assertEquals("//a//b", pointer)
    }
}

class JSONPointerEscapeTest {

    @Test
    fun `should escape tilde to ~0`() {
        val escaped = JSONPointer.escape("user~name")
        assertEquals("user~0name", escaped)
    }

    @Test
    fun `should escape slash to ~1`() {
        val escaped = JSONPointer.escape("path/to")
        assertEquals("path~1to", escaped)
    }

    @Test
    fun `should escape both tilde and slash`() {
        val escaped = JSONPointer.escape("a~b/c")
        assertEquals("a~0b~1c", escaped)
    }

    @Test
    fun `should return same string if no special characters`() {
        val escaped = JSONPointer.escape("normal")
        assertEquals("normal", escaped)
    }
}

class JSONPointerUnescapeTest {

    @Test
    fun `should unescape ~0 to tilde`() {
        val unescaped = JSONPointer.unescape("user~0name")
        assertEquals("user~name", unescaped)
    }

    @Test
    fun `should unescape ~1 to slash`() {
        val unescaped = JSONPointer.unescape("path~1to")
        assertEquals("path/to", unescaped)
    }

    @Test
    fun `should unescape both ~0 and ~1`() {
        val unescaped = JSONPointer.unescape("a~0b~1c")
        assertEquals("a~b/c", unescaped)
    }

    @Test
    fun `should return same string if no escape sequences`() {
        val unescaped = JSONPointer.unescape("normal")
        assertEquals("normal", unescaped)
    }
}
