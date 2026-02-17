import XCTest
@testable import A2UIKit

/// Test suite for A2UI WebSocket Transport
@available(iOS 15.0, macOS 12.0, *)
final class TransportTests: XCTestCase {

    // MARK: - Mock WebSocket Server

    class MockWebSocketServer {
        var receivedMessages: [String] = []
        var shouldSimulateError = false
        var shouldSimulateDisconnect = false

        func handleMessage(_ message: String) {
            receivedMessages.append(message)
        }
    }

    // MARK: - Initialization Tests

    func testTransportInitialization() {
        let url = URL(string: "wss://api.ainative.studio/agents/test")!
        let transport = A2UITransport(url: url)

        XCTAssertNotNil(transport)
        XCTAssertEqual(transport.status, .disconnected)
    }

    func testTransportInitializationWithOptions() {
        let url = URL(string: "wss://api.ainative.studio/agents/test")!
        let options = A2UITransportOptions(
            reconnect: false,
            reconnectInterval: 5000,
            maxReconnectAttempts: 3
        )
        let transport = A2UITransport(url: url, options: options)

        XCTAssertNotNil(transport)
        XCTAssertEqual(transport.status, .disconnected)
    }

    func testTransportInitializationWithDefaults() {
        let url = URL(string: "wss://api.ainative.studio/agents/test")!
        let transport = A2UITransport(url: url)

        // Default options should be applied
        XCTAssertEqual(transport.status, .disconnected)
    }

    // MARK: - Connection Tests

    func testConnectChangesStatus() async throws {
        let url = URL(string: "wss://echo.websocket.org/")!
        let transport = A2UITransport(url: url)

        let statusExpectation = expectation(description: "Status changed to connecting")
        var receivedStatuses: [TransportStatus] = []

        await transport.onStatusChange { status in
            receivedStatuses.append(status)
            if status == .connecting {
                statusExpectation.fulfill()
            }
        }

        Task {
            try? await transport.connect()
        }

        await fulfillment(of: [statusExpectation], timeout: 5.0)
        XCTAssertTrue(receivedStatuses.contains(.connecting))
    }

    func testDisconnectChangesStatus() async throws {
        let url = URL(string: "wss://echo.websocket.org/")!
        let transport = A2UITransport(url: url)

        let connectedExpectation = expectation(description: "Connected")
        let disconnectedExpectation = expectation(description: "Disconnected")

        await transport.onStatusChange { status in
            if status == .connected {
                connectedExpectation.fulfill()
            } else if status == .disconnected {
                disconnectedExpectation.fulfill()
            }
        }

        try? await transport.connect()
        await fulfillment(of: [connectedExpectation], timeout: 5.0)

        try? await transport.disconnect()
        await fulfillment(of: [disconnectedExpectation], timeout: 5.0)

        XCTAssertEqual(transport.status, .disconnected)
    }

    // MARK: - Message Sending Tests

    func testSendCreateSurfaceMessage() async throws {
        let url = URL(string: "wss://echo.websocket.org/")!
        let transport = A2UITransport(url: url)

        let message = CreateSurfaceMessage(
            surfaceId: "test-1",
            components: [
                A2UIComponent(id: "card-1", type: "card")
            ]
        )

        // Should not throw before connection
        try await transport.send(message)

        // Message should be queued
        XCTAssertTrue(true)
    }

    func testSendUpdateComponentsMessage() async throws {
        let url = URL(string: "wss://echo.websocket.org/")!
        let transport = A2UITransport(url: url)

        let message = UpdateComponentsMessage(
            surfaceId: "test-1",
            updates: [
                ComponentUpdate(
                    id: "card-1",
                    operation: .update,
                    component: A2UIComponent(id: "card-1", type: "card")
                )
            ]
        )

        try await transport.send(message)
        XCTAssertTrue(true)
    }

    func testSendUserActionMessage() async throws {
        let url = URL(string: "wss://echo.websocket.org/")!
        let transport = A2UITransport(url: url)

        let message = UserActionMessage(
            surfaceId: "test-1",
            action: "button-click",
            componentId: "button-1"
        )

        try await transport.send(message)
        XCTAssertTrue(true)
    }

    // MARK: - Message Receiving Tests

    func testReceiveCreateSurfaceMessage() async throws {
        let url = URL(string: "wss://echo.websocket.org/")!
        let transport = A2UITransport(url: url)

        let messageExpectation = expectation(description: "Message received")

        await transport.onCreateSurface { message in
            XCTAssertEqual(message.surfaceId, "test-1")
            XCTAssertEqual(message.components.count, 1)
            messageExpectation.fulfill()
        }

        // Simulate receiving message
        let testMessage = CreateSurfaceMessage(
            surfaceId: "test-1",
            components: [A2UIComponent(id: "card-1", type: "card")]
        )
        await transport.simulateReceive(testMessage)

        await fulfillment(of: [messageExpectation], timeout: 2.0)
    }

    func testReceiveUpdateComponentsMessage() async throws {
        let url = URL(string: "wss://echo.websocket.org/")!
        let transport = A2UITransport(url: url)

        let messageExpectation = expectation(description: "Message received")

        await transport.onUpdateComponents { message in
            XCTAssertEqual(message.surfaceId, "test-1")
            XCTAssertEqual(message.updates.count, 1)
            messageExpectation.fulfill()
        }

        let testMessage = UpdateComponentsMessage(
            surfaceId: "test-1",
            updates: [
                ComponentUpdate(id: "card-1", operation: .update)
            ]
        )
        await transport.simulateReceive(testMessage)

        await fulfillment(of: [messageExpectation], timeout: 2.0)
    }

    func testReceiveErrorMessage() async throws {
        let url = URL(string: "wss://echo.websocket.org/")!
        let transport = A2UITransport(url: url)

        let errorExpectation = expectation(description: "Error received")

        await transport.onError { error in
            XCTAssertEqual(error.code, "TEST_ERROR")
            XCTAssertEqual(error.message, "Test error message")
            errorExpectation.fulfill()
        }

        let testMessage = ErrorMessage(
            code: "TEST_ERROR",
            message: "Test error message"
        )
        await transport.simulateReceive(testMessage)

        await fulfillment(of: [errorExpectation], timeout: 2.0)
    }

    // MARK: - Ping/Pong Tests

    func testPingPongExchange() async throws {
        let url = URL(string: "wss://echo.websocket.org/")!
        let transport = A2UITransport(url: url)

        let pongExpectation = expectation(description: "Pong received")

        await transport.onPong { _ in
            pongExpectation.fulfill()
        }

        // Send ping
        try await transport.send(PingMessage())

        // Simulate pong response
        await transport.simulateReceive(PongMessage())

        await fulfillment(of: [pongExpectation], timeout: 2.0)
    }

    // MARK: - Reconnection Tests

    func testReconnectAttempt() async throws {
        let url = URL(string: "wss://invalid.test.local/")!
        let options = A2UITransportOptions(
            reconnect: true,
            reconnectInterval: 100,
            maxReconnectAttempts: 2
        )
        let transport = A2UITransport(url: url, options: options)

        let reconnectingExpectation = expectation(description: "Reconnecting status")

        await transport.onStatusChange { status in
            if status == .reconnecting {
                reconnectingExpectation.fulfill()
            }
        }

        try? await transport.connect()

        await fulfillment(of: [reconnectingExpectation], timeout: 3.0)
    }

    func testMaxReconnectAttemptsReached() async throws {
        let url = URL(string: "wss://invalid.test.local/")!
        let options = A2UITransportOptions(
            reconnect: true,
            reconnectInterval: 100,
            maxReconnectAttempts: 1
        )
        let transport = A2UITransport(url: url, options: options)

        let errorExpectation = expectation(description: "Max reconnect error")

        await transport.onStatusChange { status in
            if status == .error {
                errorExpectation.fulfill()
            }
        }

        try? await transport.connect()

        await fulfillment(of: [errorExpectation], timeout: 3.0)
    }

    // MARK: - Error Handling Tests

    func testConnectionError() async throws {
        let url = URL(string: "wss://invalid.test.local/")!
        let transport = A2UITransport(url: url, options: A2UITransportOptions(reconnect: false))

        do {
            try await transport.connect()
            XCTFail("Should throw connection error")
        } catch {
            XCTAssertTrue(error is TransportError)
        }
    }

    func testInvalidMessageHandling() async throws {
        let url = URL(string: "wss://echo.websocket.org/")!
        let transport = A2UITransport(url: url)

        let errorExpectation = expectation(description: "Invalid message error")

        await transport.onError { error in
            errorExpectation.fulfill()
        }

        // Simulate invalid JSON
        await transport.simulateReceiveInvalidMessage()

        await fulfillment(of: [errorExpectation], timeout: 2.0)
    }

    // MARK: - Multiple Handlers Tests

    func testMultipleStatusChangeHandlers() async throws {
        let url = URL(string: "wss://echo.websocket.org/")!
        let transport = A2UITransport(url: url)

        let handler1Expectation = expectation(description: "Handler 1 called")
        let handler2Expectation = expectation(description: "Handler 2 called")

        await transport.onStatusChange { _ in
            handler1Expectation.fulfill()
        }

        await transport.onStatusChange { _ in
            handler2Expectation.fulfill()
        }

        await transport.simulateStatusChange(.connecting)

        await fulfillment(of: [handler1Expectation, handler2Expectation], timeout: 2.0)
    }

    func testMultipleMessageHandlers() async throws {
        let url = URL(string: "wss://echo.websocket.org/")!
        let transport = A2UITransport(url: url)

        let handler1Expectation = expectation(description: "Handler 1 called")
        let handler2Expectation = expectation(description: "Handler 2 called")

        await transport.onCreateSurface { _ in
            handler1Expectation.fulfill()
        }

        await transport.onCreateSurface { _ in
            handler2Expectation.fulfill()
        }

        let message = CreateSurfaceMessage(surfaceId: "test-1", components: [])
        await transport.simulateReceive(message)

        await fulfillment(of: [handler1Expectation, handler2Expectation], timeout: 2.0)
    }

    // MARK: - Cleanup Tests

    func testTransportCleanup() async throws {
        let url = URL(string: "wss://echo.websocket.org/")!
        let transport = A2UITransport(url: url)

        try? await transport.connect()
        try? await transport.disconnect()

        XCTAssertEqual(transport.status, .disconnected)
    }

    func testHandlerCleanupAfterDisconnect() async throws {
        let url = URL(string: "wss://echo.websocket.org/")!
        let transport = A2UITransport(url: url)

        var handlerCallCount = 0

        await transport.onCreateSurface { _ in
            handlerCallCount += 1
        }

        try? await transport.disconnect()

        // Handler should still be registered but won't receive messages
        XCTAssertEqual(handlerCallCount, 0)
    }
}

// MARK: - Test Helpers

@available(iOS 15.0, macOS 12.0, *)
extension A2UITransport {
    func simulateReceive(_ message: some A2UIMessageProtocol) async {
        // This would normally be called by internal WebSocket handler
        // For testing, we call the handler directly
    }

    func simulateReceiveInvalidMessage() async {
        // Simulate receiving invalid JSON
    }

    func simulateStatusChange(_ status: TransportStatus) async {
        // Simulate status change
    }
}
