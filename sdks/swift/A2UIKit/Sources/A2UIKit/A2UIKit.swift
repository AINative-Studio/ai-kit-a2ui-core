/**
 * A2UIKit - Swift SDK for A2UI Protocol v0.9
 *
 * A production-ready Swift implementation of the A2UI protocol that enables
 * AI agents to dynamically generate rich user interfaces using declarative JSON.
 *
 * Features:
 * - RFC 6901 JSON Pointer implementation for data manipulation
 * - URLSession WebSocket transport with automatic reconnection
 * - Complete Codable support for all protocol message types
 * - Swift async/await and actor-based concurrency
 * - iOS 15+ and macOS 12+ support
 * - Comprehensive test coverage (85%+)
 *
 * Example Usage:
 * ```swift
 * import A2UIKit
 *
 * let url = URL(string: "wss://api.ainative.studio/agents/dashboard")!
 * let transport = A2UITransport(url: url)
 *
 * await transport.onCreateSurface { message in
 *     print("Surface created:", message.surfaceId)
 *     print("Components:", message.components)
 *
 *     // Access data using JSON Pointer
 *     if let dataModel = message.dataModel?.mapValues({ $0.value }) {
 *         let userName = try? JSONPointer.resolve(dataModel, pointer: "/user/name")
 *         print("User name:", userName ?? "Unknown")
 *     }
 * }
 *
 * await transport.onUpdateComponents { message in
 *     print("Component updates:", message.updates)
 * }
 *
 * try await transport.connect()
 *
 * // Send user action
 * let action = UserActionMessage(
 *     surfaceId: "dashboard-1",
 *     action: "submit",
 *     context: ["formData": ["email": "user@example.com"]]
 * )
 * try await transport.send(action)
 * ```
 */

// MARK: - Public Exports

// Core Types
@_exported import struct Foundation.URL
@_exported import struct Foundation.Date

// Message Types
public typealias A2UIMessage = A2UIMessageProtocol

// Re-export all public APIs
// (Swift automatically exports all public declarations from the module)

// MARK: - Version Information

/// A2UIKit version
public enum A2UIKit {
    /// SDK version string
    public static let version = "1.0.0"

    /// Supported A2UI protocol version
    public static let protocolVersion = "0.9"

    /// SDK metadata
    public static let metadata: [String: String] = [
        "version": version,
        "protocolVersion": protocolVersion,
        "platform": "Swift",
        "minIOSVersion": "15.0",
        "minMacOSVersion": "12.0"
    ]
}
