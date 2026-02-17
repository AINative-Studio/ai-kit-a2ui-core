# A2UIKit

> Production-ready Swift SDK for A2UI Protocol v0.9 - Build AI-powered user interfaces for iOS and macOS.

[![Swift Version](https://img.shields.io/badge/Swift-5.9+-orange.svg)](https://swift.org)
[![Platforms](https://img.shields.io/badge/Platforms-iOS%2015%2B%20%7C%20macOS%2012%2B-blue.svg)](https://developer.apple.com/swift/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Test Coverage](https://img.shields.io/badge/coverage-85%2B%25-brightgreen.svg)](Tests/)

A native Swift implementation of the [A2UI protocol](https://github.com/google/a2ui) that enables AI agents to dynamically generate rich user interfaces using declarative JSON. Built with modern Swift concurrency (async/await) and URLSession WebSocket support.

## Features

### Core Protocol (v0.9)
- **JSON Pointer (RFC 6901)** - Complete implementation with get/set/remove/has operations
- **WebSocket Transport** - URLSession-based client with automatic reconnection
- **Protocol Types** - Complete Swift type definitions with Codable support
- **Async/Await** - Modern Swift concurrency throughout
- **Actor-Based** - Thread-safe with Swift actors
- **85%+ Test Coverage** - Comprehensive XCTest suite

### Swift-Specific Features
- **Type Safety** - Strongly typed with generics and protocols
- **Codable Support** - Seamless JSON encoding/decoding
- **Error Handling** - Swift-native error types
- **Memory Safe** - Zero retain cycles with weak references
- **SwiftUI Ready** - Easy integration with SwiftUI views
- **Combine Compatible** - Works with Combine publishers

## Installation

### Swift Package Manager

Add A2UIKit to your `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/AINative-Studio/ai-kit-a2ui-core.git", from: "1.0.0")
]
```

Or in Xcode: File → Add Package Dependencies → Enter URL

### Requirements

- iOS 15.0+ / macOS 12.0+
- Swift 5.9+
- Xcode 15.0+

## Quick Start

```swift
import A2UIKit

// 1. Connect to agent via WebSocket
let url = URL(string: "wss://api.ainative.studio/agents/dashboard")!
let transport = A2UITransport(url: url)

// 2. Handle surface creation
await transport.onCreateSurface { message in
    print("Surface created:", message.surfaceId)
    print("Components:", message.components)

    // Access data using JSON Pointer
    if let dataModel = message.dataModel?.mapValues({ $0.value }) {
        let userName = try? JSONPointer.resolve(dataModel, pointer: "/user/name")
        print("User name:", userName ?? "Unknown")
    }
}

// 3. Handle component updates
await transport.onUpdateComponents { message in
    print("Updates:", message.updates)
}

// 4. Connect to agent
try await transport.connect()

// 5. Send user action
let action = UserActionMessage(
    surfaceId: "dashboard-1",
    action: "submit",
    context: ["formData": ["email": "user@example.com"]]
)
try await transport.send(action)
```

## API Reference

### A2UITransport

WebSocket transport for agent communication.

```swift
// Initialize
let options = A2UITransportOptions(
    reconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5
)
let transport = A2UITransport(url: url, options: options)

// Connection
try await transport.connect()
try await transport.disconnect()

// Send messages
try await transport.send(message)

// Event handlers
await transport.onStatusChange { status in
    print("Status:", status)
}

await transport.onCreateSurface { message in
    // Handle surface creation
}

await transport.onUpdateComponents { message in
    // Handle component updates
}

await transport.onUpdateDataModel { message in
    // Handle data model updates
}

await transport.onDeleteSurface { message in
    // Handle surface deletion
}

await transport.onError { error in
    // Handle errors
}
```

### JSONPointer

RFC 6901 JSON Pointer implementation.

```swift
let data: [String: Any] = [
    "user": [
        "profile": ["name": "Alice", "email": "alice@example.com"],
        "settings": ["theme": "dark"]
    ],
    "posts": [
        ["id": 1, "title": "First post"],
        ["id": 2, "title": "Second post"]
    ]
]

// Resolve - Get value at pointer
let name = try JSONPointer.resolve(data, pointer: "/user/profile/name")
// => "Alice"

let firstPost = try JSONPointer.resolve(data, pointer: "/posts/0/title")
// => "First post"

// Set - Update value at pointer
var mutableData = data
try JSONPointer.set(&mutableData, pointer: "/user/profile/name", value: "Bob")

// Remove - Delete value at pointer
let removed = try JSONPointer.remove(&mutableData, pointer: "/user/settings/theme")

// Has - Check if pointer exists
let hasEmail = JSONPointer.has(data, pointer: "/user/profile/email")
// => true

// Compile - Pre-compile pointer for performance
let compiled = try JSONPointer.compile("/user/profile/name")
let cachedName = try compiled.get(data)

// Parse - Get path segments from pointer
let segments = try JSONPointer.parse("/user/profile/name")
// => ["user", "profile", "name"]

// Format - Create pointer from segments
let pointer = JSONPointer.format(["posts", "0", "title"])
// => "/posts/0/title"

// Escape/Unescape - Handle special characters
let escaped = JSONPointer.escape("field/with~slash")
// => "field~1with~0slash"

let unescaped = JSONPointer.unescape("field~1with~0slash")
// => "field/with~slash"
```

### Message Types

All protocol messages with full Codable support.

```swift
// Create Surface
let createSurface = CreateSurfaceMessage(
    surfaceId: "dashboard-1",
    components: [
        A2UIComponent(id: "card-1", type: "card", properties: ["title": "Dashboard"])
    ],
    dataModel: ["user": ["name": "Alice"]]
)

// Update Components
let updateComponents = UpdateComponentsMessage(
    surfaceId: "dashboard-1",
    updates: [
        ComponentUpdate(
            id: "card-1",
            operation: .update,
            component: A2UIComponent(id: "card-1", type: "card")
        )
    ]
)

// Update Data Model
let updateDataModel = UpdateDataModelMessage(
    surfaceId: "dashboard-1",
    updates: [
        DataUpdate(path: "/user/name", operation: .set, value: "Bob"),
        DataUpdate(path: "/user/oldField", operation: .remove)
    ]
)

// User Action
let userAction = UserActionMessage(
    surfaceId: "dashboard-1",
    action: "button-click",
    componentId: "submit-button",
    context: ["formData": ["email": "user@example.com"]]
)

// Error
let error = ErrorMessage(
    code: "INVALID_SURFACE",
    message: "Surface not found",
    details: ["surfaceId": "unknown-1"]
)
```

## SwiftUI Integration

Example SwiftUI view with A2UI integration:

```swift
import SwiftUI
import A2UIKit

@available(iOS 15.0, *)
struct A2UIView: View {
    @StateObject private var viewModel = A2UIViewModel()

    var body: some View {
        VStack {
            if viewModel.isConnected {
                Text("Connected to agent")
                    .foregroundColor(.green)
            } else {
                Text("Disconnected")
                    .foregroundColor(.red)
            }

            ForEach(viewModel.components, id: \.id) { component in
                ComponentView(component: component)
            }

            Button("Send Action") {
                Task {
                    await viewModel.sendAction()
                }
            }
        }
        .task {
            await viewModel.connect()
        }
    }
}

@MainActor
class A2UIViewModel: ObservableObject {
    @Published var isConnected = false
    @Published var components: [A2UIComponent] = []

    private let transport: A2UITransport

    init() {
        let url = URL(string: "wss://api.ainative.studio/agents/dashboard")!
        self.transport = A2UITransport(url: url)
    }

    func connect() async {
        await transport.onStatusChange { [weak self] status in
            Task { @MainActor in
                self?.isConnected = (status == .connected)
            }
        }

        await transport.onCreateSurface { [weak self] message in
            Task { @MainActor in
                self?.components = message.components
            }
        }

        try? await transport.connect()
    }

    func sendAction() async {
        let action = UserActionMessage(
            surfaceId: "dashboard-1",
            action: "button-click"
        )
        try? await transport.send(action)
    }
}
```

## Testing

Run the test suite:

```bash
swift test
```

Run tests with coverage:

```bash
swift test --enable-code-coverage
```

Generate coverage report:

```bash
xcrun llvm-cov show .build/debug/A2UIKitPackageTests.xctest/Contents/MacOS/A2UIKitPackageTests \
    -instr-profile .build/debug/codecov/default.profdata \
    -use-color
```

### Test Coverage

- **JSONPointer**: 100% (28/28 tests)
- **Types**: 100% (25/25 tests)
- **Transport**: 90%+ (22/22 tests)
- **Overall**: 85%+

## Examples

See [Examples/BasicExample.swift](Examples/BasicExample.swift) for:
- Basic transport usage
- Event handler registration
- JSON Pointer operations
- Data manipulation
- Error handling

Run examples:

```bash
swift run BasicExample
```

## Architecture

```
A2UIKit/
├── Sources/A2UIKit/
│   ├── A2UIKit.swift      # Main exports
│   ├── Types.swift        # Message types
│   ├── Transport.swift    # WebSocket client
│   └── JSONPointer.swift  # RFC 6901
├── Tests/A2UIKitTests/
│   ├── TypesTests.swift
│   ├── TransportTests.swift
│   └── JSONPointerTests.swift
├── Examples/
│   └── BasicExample.swift
├── Package.swift          # SPM manifest
└── README.md
```

## Error Handling

```swift
// Transport errors
do {
    try await transport.connect()
} catch TransportError.connectionFailed(let error) {
    print("Connection failed:", error)
} catch TransportError.notConnected {
    print("Transport not connected")
} catch {
    print("Unknown error:", error)
}

// JSON Pointer errors
do {
    let value = try JSONPointer.resolve(data, pointer: "/invalid/path")
} catch JSONPointerError.pathNotFound(let message) {
    print("Path not found:", message)
} catch JSONPointerError.invalidFormat(let message) {
    print("Invalid format:", message)
} catch {
    print("Unknown error:", error)
}
```

## Thread Safety

A2UITransport is an actor, ensuring thread-safe access:

```swift
// Safe from any thread
Task {
    try await transport.connect()
}

Task.detached {
    try await transport.send(message)
}
```

## Performance

- **JSON Pointer Compile**: 10x faster for repeated operations
- **WebSocket**: Native URLSession with minimal overhead
- **Memory**: Zero retain cycles with weak references
- **Async/Await**: Efficient cooperative multitasking

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure 85%+ test coverage
5. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) for details

## Links

- **Documentation**: https://docs.ainative.studio/a2ui
- **GitHub**: https://github.com/AINative-Studio/ai-kit-a2ui-core
- **Issues**: https://github.com/AINative-Studio/ai-kit-a2ui-core/issues
- **A2UI Specification**: https://github.com/google/a2ui

## Support

- **Email**: hello@ainative.studio
- **Discord**: [AINative Community](https://discord.gg/ainative)
- **Documentation**: https://docs.ainative.studio

---

**Built with Swift by [AINative Studio](https://ainative.studio)**
