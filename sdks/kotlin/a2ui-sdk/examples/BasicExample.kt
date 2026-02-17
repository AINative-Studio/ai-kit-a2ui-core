package com.ainative.a2ui.examples

import com.ainative.a2ui.utils.JSONPointer
import com.ainative.a2ui.utils.JSONPointerError

/**
 * Basic example demonstrating JSON Pointer usage in the A2UI Kotlin SDK.
 *
 * Run with: kotlinc -cp build/libs/a2ui-sdk-1.0.0.jar BasicExample.kt -include-runtime -d BasicExample.jar
 *           java -jar BasicExample.jar
 */
fun main() {
    println("=== A2UI Kotlin SDK - JSON Pointer Examples ===\n")

    // Example 1: Basic Resolution
    println("Example 1: Basic Resolution")
    val userData = mapOf(
        "user" to mapOf(
            "profile" to mapOf(
                "name" to "Alice",
                "email" to "alice@example.com",
                "age" to 30
            ),
            "settings" to mapOf(
                "theme" to "dark",
                "notifications" to true
            )
        ),
        "posts" to listOf(
            mapOf("id" to 1, "title" to "First Post"),
            mapOf("id" to 2, "title" to "Second Post")
        )
    )

    val name = JSONPointer.resolve(userData, "/user/profile/name")
    println("User name: $name")

    val theme = JSONPointer.resolve(userData, "/user/settings/theme")
    println("User theme: $theme")

    val firstPostTitle = JSONPointer.resolve(userData, "/posts/0/title")
    println("First post title: $firstPostTitle")

    // Example 2: Setting Values
    println("\nExample 2: Setting Values")
    val mutableData = mutableMapOf<String, Any>(
        "user" to mutableMapOf<String, Any>(
            "name" to "Bob"
        )
    )

    println("Initial data: $mutableData")

    JSONPointer.set(mutableData, "/user/email", "bob@example.com")
    JSONPointer.set(mutableData, "/user/age", 25)
    println("After adding email and age: $mutableData")

    // Create nested structure
    JSONPointer.set(mutableData, "/settings/theme", "light")
    println("After creating settings: $mutableData")

    // Example 3: Array Operations
    println("\nExample 3: Array Operations")
    val todoData = mutableMapOf<String, Any>(
        "todos" to mutableListOf(
            mapOf("id" to 1, "text" to "Buy groceries", "done" to false),
            mapOf("id" to 2, "text" to "Write code", "done" to true)
        )
    )

    println("Initial todos: ${JSONPointer.resolve(todoData, "/todos")}")

    // Append new todo
    JSONPointer.set(
        todoData,
        "/todos/-",
        mapOf("id" to 3, "text" to "Review PR", "done" to false)
    )
    println("After appending: ${JSONPointer.resolve(todoData, "/todos")}")

    // Update todo
    val todos = todoData["todos"] as MutableList<*>
    val secondTodo = todos[1] as MutableMap<String, Any>
    secondTodo["done"] = true
    println("After updating second todo: ${JSONPointer.resolve(todoData, "/todos/1/done")}")

    // Example 4: Removing Values
    println("\nExample 4: Removing Values")
    val config = mutableMapOf<String, Any>(
        "api" to mutableMapOf<String, Any>(
            "endpoint" to "https://api.example.com",
            "timeout" to 30,
            "retries" to 3,
            "debug" to true
        )
    )

    println("Initial config: $config")

    val removed = JSONPointer.remove(config, "/api/debug")
    println("Removed debug flag: $removed")
    println("After removal: $config")

    // Example 5: Escape Sequences
    println("\nExample 5: Escape Sequences")
    val specialData = mapOf(
        "field~name" to "tilde field",
        "path/to" to mapOf(
            "value" to 123
        )
    )

    // ~ is escaped as ~0
    val tildeField = JSONPointer.resolve(specialData, "/field~0name")
    println("Tilde field: $tildeField")

    // / is escaped as ~1
    val pathValue = JSONPointer.resolve(specialData, "/path~1to/value")
    println("Path value: $pathValue")

    // Example 6: Checking Existence
    println("\nExample 6: Checking Existence")
    val document = mapOf(
        "title" to "My Document",
        "author" to mapOf("name" to "Jane Doe")
    )

    val hasAuthor = JSONPointer.has(document, "/author/name")
    println("Has author name: $hasAuthor")

    val hasPublishDate = JSONPointer.has(document, "/publishDate")
    println("Has publish date: $hasPublishDate")

    // Example 7: Compiling and Formatting
    println("\nExample 7: Compiling and Formatting")
    val pointer = "/user/profile/email"
    val tokens = JSONPointer.compile(pointer)
    println("Pointer: $pointer")
    println("Compiled tokens: $tokens")

    val reformatted = JSONPointer.format(tokens)
    println("Reformatted pointer: $reformatted")

    // Example 8: Error Handling
    println("\nExample 8: Error Handling")
    try {
        // Invalid pointer (doesn't start with /)
        JSONPointer.resolve(userData, "user/name")
    } catch (e: JSONPointerError) {
        println("Caught error: ${e.message}")
    }

    try {
        // Cannot set root
        JSONPointer.set(mutableData, "", mapOf("new" to "data"))
    } catch (e: JSONPointerError) {
        println("Caught error: ${e.message}")
    }

    // Example 9: Real-World Usage - A2UI Component Update
    println("\nExample 9: Real-World Usage - A2UI Component Update")
    val a2uiSurface = mutableMapOf<String, Any>(
        "surfaceId" to "dashboard-1",
        "components" to mutableListOf(
            mutableMapOf<String, Any>(
                "id" to "card-1",
                "type" to "card",
                "properties" to mutableMapOf<String, Any>(
                    "title" to "User Stats",
                    "description" to "Current user statistics"
                )
            )
        ),
        "dataModel" to mutableMapOf<String, Any>(
            "user" to mutableMapOf<String, Any>(
                "name" to "Alice",
                "stats" to mutableMapOf(
                    "views" to 150,
                    "likes" to 42
                )
            )
        )
    )

    println("Initial surface: $a2uiSurface")

    // Update component title using JSON Pointer
    JSONPointer.set(a2uiSurface, "/components/0/properties/title", "Updated Stats")
    println("Updated component title: ${JSONPointer.resolve(a2uiSurface, "/components/0/properties/title")}")

    // Update data model
    JSONPointer.set(a2uiSurface, "/dataModel/user/stats/views", 200)
    println("Updated views: ${JSONPointer.resolve(a2uiSurface, "/dataModel/user/stats/views")}")

    // Add new data field
    JSONPointer.set(a2uiSurface, "/dataModel/user/lastLogin", "2024-02-16T10:30:00Z")
    println("Added last login: ${JSONPointer.resolve(a2uiSurface, "/dataModel/user/lastLogin")}")

    println("\n=== All Examples Completed Successfully! ===")
}
