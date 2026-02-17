# Kotlin SDK Quick Start Guide

Get started with the A2UI Kotlin SDK in 5 minutes.

## Prerequisites

- Java 17 or higher
- Gradle 8.0+ or use included wrapper (`./gradlew`)

## Installation

### Option 1: Maven Central (when published)

```kotlin
dependencies {
    implementation("com.ainative:a2ui-sdk:1.0.0")
}
```

### Option 2: Local Build

```bash
cd sdks/kotlin/a2ui-sdk
./gradlew publishToMavenLocal
```

Then in your project:

```kotlin
repositories {
    mavenLocal()
}

dependencies {
    implementation("com.ainative:a2ui-sdk:1.0.0")
}
```

## Basic Usage

### 1. Import the Library

```kotlin
import com.ainative.a2ui.utils.JSONPointer
```

### 2. Resolve Data

```kotlin
val data = mapOf(
    "user" to mapOf(
        "name" to "Alice",
        "email" to "alice@example.com"
    )
)

val name = JSONPointer.resolve(data, "/user/name")
println(name)  // "Alice"
```

### 3. Set Values

```kotlin
val mutableData = mutableMapOf<String, Any>(
    "user" to mutableMapOf<String, Any>()
)

JSONPointer.set(mutableData, "/user/name", "Bob")
JSONPointer.set(mutableData, "/user/age", 25)

println(mutableData)
// {user={name=Bob, age=25}}
```

### 4. Work with Arrays

```kotlin
val todos = mutableMapOf<String, Any>(
    "items" to mutableListOf("Task 1", "Task 2")
)

// Append item
JSONPointer.set(todos, "/items/-", "Task 3")

// Access item
val firstTask = JSONPointer.resolve(todos, "/items/0")
println(firstTask)  // "Task 1"
```

### 5. Remove Values

```kotlin
val config = mutableMapOf<String, Any>(
    "api" to mutableMapOf<String, Any>(
        "url" to "https://api.example.com",
        "debug" to true
    )
)

JSONPointer.remove(config, "/api/debug")
println(config)
// {api={url=https://api.example.com}}
```

### 6. Check Existence

```kotlin
val document = mapOf(
    "title" to "My Doc",
    "author" to "Jane"
)

val hasTitle = JSONPointer.has(document, "/title")
println(hasTitle)  // true

val hasDate = JSONPointer.has(document, "/publishDate")
println(hasDate)  // false
```

### 7. Handle Escape Sequences

```kotlin
val specialData = mapOf(
    "field~name" to "value1",
    "path/to" to "value2"
)

// ~ is escaped as ~0
val value1 = JSONPointer.resolve(specialData, "/field~0name")
println(value1)  // "value1"

// / is escaped as ~1
val value2 = JSONPointer.resolve(specialData, "/path~1to")
println(value2)  // "value2"
```

## Run the Example

```bash
cd sdks/kotlin/a2ui-sdk

# Compile and run the example
kotlinc -cp build/classes/kotlin/main examples/BasicExample.kt \
  -include-runtime -d BasicExample.jar

java -jar BasicExample.jar
```

## Run Tests

```bash
./gradlew test
```

View coverage report:

```bash
./gradlew koverHtmlReport
open build/reports/kover/html/index.html
```

## Error Handling

```kotlin
import com.ainative.a2ui.utils.JSONPointerError

try {
    JSONPointer.resolve(data, "invalid")  // No leading /
} catch (e: JSONPointerError) {
    println("Error: ${e.message}")
}
```

## Next Steps

- Read the full [README.md](./README.md) for complete API documentation
- Check [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for roadmap
- Review [examples/BasicExample.kt](./examples/BasicExample.kt) for more examples

## Common Patterns

### A2UI Component Update

```kotlin
val surface = mutableMapOf<String, Any>(
    "components" to mutableListOf(
        mutableMapOf<String, Any>(
            "id" to "card-1",
            "type" to "card",
            "properties" to mutableMapOf<String, Any>(
                "title" to "Stats"
            )
        )
    )
)

// Update component property
JSONPointer.set(
    surface,
    "/components/0/properties/title",
    "Updated Stats"
)
```

### Data Model Navigation

```kotlin
val dataModel = mapOf(
    "user" to mapOf(
        "profile" to mapOf(
            "stats" to mapOf(
                "views" to 150,
                "likes" to 42
            )
        )
    )
)

val views = JSONPointer.resolve(dataModel, "/user/profile/stats/views")
println("Views: $views")  // Views: 150
```

## Getting Help

- **Issues**: https://github.com/AINative-Studio/ai-kit-a2ui-core/issues
- **Email**: hello@ainative.studio
- **Documentation**: [README.md](./README.md)

---

**Ready to build!** 🚀
