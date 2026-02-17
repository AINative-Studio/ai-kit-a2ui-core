import Foundation
import A2UIKit

/**
 * Basic Example: A2UIKit Usage
 *
 * This example demonstrates how to use the A2UIKit SDK to connect to an
 * A2UI agent, handle messages, and send user actions.
 *
 * Usage:
 * 1. Replace the WebSocket URL with your agent endpoint
 * 2. Run the example in an async context
 * 3. Observe the console output for messages
 */

@available(iOS 15.0, macOS 12.0, *)
class BasicA2UIExample {

    let transport: A2UITransport

    init(agentURL: URL) {
        // Initialize transport with custom options
        let options = A2UITransportOptions(
            reconnect: true,
            reconnectInterval: 3000,
            maxReconnectAttempts: 5
        )
        self.transport = A2UITransport(url: agentURL, options: options)
    }

    func run() async throws {
        // Register event handlers
        await registerHandlers()

        // Connect to agent
        print("Connecting to agent...")
        try await transport.connect()
        print("Connected successfully!")

        // Keep the example running
        try await Task.sleep(nanoseconds: 60_000_000_000) // 60 seconds

        // Disconnect
        try await transport.disconnect()
        print("Disconnected")
    }

    private func registerHandlers() async {
        // Handle connection status changes
        await transport.onStatusChange { status in
            print("Status changed:", status)
        }

        // Handle createSurface messages
        await transport.onCreateSurface { [weak self] message in
            print("\n=== Create Surface ===")
            print("Surface ID:", message.surfaceId)
            print("Components:", message.components.count)

            // Access data using JSON Pointer
            if let dataModel = message.dataModel?.mapValues({ $0.value }) {
                self?.logDataModel(dataModel)
            }

            // Example: Auto-respond with a user action
            Task {
                try? await self?.sendExampleAction(surfaceId: message.surfaceId)
            }
        }

        // Handle component updates
        await transport.onUpdateComponents { message in
            print("\n=== Update Components ===")
            print("Surface ID:", message.surfaceId)
            print("Updates:")
            for update in message.updates {
                print("  - \(update.operation): \(update.id)")
            }
        }

        // Handle data model updates
        await transport.onUpdateDataModel { message in
            print("\n=== Update Data Model ===")
            print("Surface ID:", message.surfaceId)
            print("Updates:")
            for update in message.updates {
                print("  - \(update.operation) \(update.path)")
            }
        }

        // Handle surface deletion
        await transport.onDeleteSurface { message in
            print("\n=== Delete Surface ===")
            print("Surface ID:", message.surfaceId)
        }

        // Handle errors
        await transport.onError { error in
            print("\n=== Error ===")
            print("Code:", error.code)
            print("Message:", error.message)
            if let details = error.details {
                print("Details:", details)
            }
        }

        // Handle ping/pong (for keep-alive)
        await transport.onPing { _ in
            print("Received ping")
        }

        await transport.onPong { _ in
            print("Received pong")
        }
    }

    private func logDataModel(_ dataModel: [String: Any]) {
        print("\nData Model:")

        // Example: Extract user information
        if let userName = try? JSONPointer.resolve(dataModel, pointer: "/user/name") as? String {
            print("  User Name:", userName)
        }

        if let userEmail = try? JSONPointer.resolve(dataModel, pointer: "/user/email") as? String {
            print("  User Email:", userEmail)
        }

        // Example: Check if a path exists
        let hasSettings = JSONPointer.has(dataModel, pointer: "/settings")
        print("  Has Settings:", hasSettings)

        // Example: Parse pointer into segments
        if let segments = try? JSONPointer.parse("/user/profile/avatar") {
            print("  Parsed segments:", segments)
        }
    }

    private func sendExampleAction(surfaceId: String) async throws {
        // Example: Send a button click action
        let action = UserActionMessage(
            surfaceId: surfaceId,
            action: "button-click",
            componentId: "submit-button",
            context: [
                "timestamp": Date().timeIntervalSince1970,
                "formData": [
                    "name": "Alice",
                    "email": "alice@example.com",
                    "preferences": ["notifications": true, "theme": "dark"]
                ]
            ]
        )

        try await transport.send(action)
        print("Sent user action: button-click")
    }
}

// MARK: - Advanced Example: Data Manipulation

@available(iOS 15.0, macOS 12.0, *)
class AdvancedA2UIExample {

    func demonstrateJSONPointer() {
        print("\n=== JSON Pointer Examples ===")

        var data: [String: Any] = [
            "user": [
                "profile": [
                    "name": "Alice",
                    "email": "alice@example.com"
                ],
                "settings": [
                    "theme": "dark",
                    "notifications": true
                ]
            ],
            "posts": [
                ["id": 1, "title": "First post"],
                ["id": 2, "title": "Second post"]
            ]
        ]

        // 1. Resolve values
        if let name = try? JSONPointer.resolve(data, pointer: "/user/profile/name") as? String {
            print("Name:", name)
        }

        if let firstPost = try? JSONPointer.resolve(data, pointer: "/posts/0/title") as? String {
            print("First post:", firstPost)
        }

        // 2. Set values
        try? JSONPointer.set(&data, pointer: "/user/profile/name", value: "Bob")
        print("Updated name:", (try? JSONPointer.resolve(data, pointer: "/user/profile/name")) ?? "nil")

        // 3. Add new properties
        try? JSONPointer.set(&data, pointer: "/user/age", value: 30)
        print("Added age:", (try? JSONPointer.resolve(data, pointer: "/user/age")) ?? "nil")

        // 4. Remove properties
        _ = try? JSONPointer.remove(&data, pointer: "/user/settings/notifications")
        let hasNotifications = JSONPointer.has(data, pointer: "/user/settings/notifications")
        print("Has notifications:", hasNotifications)

        // 5. Use compiled pointers for performance
        if let compiled = try? JSONPointer.compile("/user/profile/email") {
            if let email = try? compiled.get(data) as? String {
                print("Email (compiled):", email)
            }
        }

        // 6. Escape/unescape special characters
        let escaped = JSONPointer.escape("field/with~slash")
        print("Escaped:", escaped)

        let unescaped = JSONPointer.unescape("field~1with~0slash")
        print("Unescaped:", unescaped)

        // 7. Format pointer from segments
        let pointer = JSONPointer.format(["user", "profile", "name"])
        print("Formatted pointer:", pointer)
    }
}

// MARK: - Main Entry Point

@main
@available(iOS 15.0, macOS 12.0, *)
struct ExampleRunner {
    static func main() async throws {
        // Basic example
        let agentURL = URL(string: "wss://api.ainative.studio/agents/dashboard")!
        let example = BasicA2UIExample(agentURL: agentURL)

        do {
            try await example.run()
        } catch {
            print("Error running example:", error)
        }

        // Advanced JSON Pointer example
        let advanced = AdvancedA2UIExample()
        advanced.demonstrateJSONPointer()
    }
}
