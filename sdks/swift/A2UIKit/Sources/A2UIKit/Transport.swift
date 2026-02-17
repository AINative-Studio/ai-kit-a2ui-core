import Foundation

// MARK: - Transport Status

/// WebSocket connection status
public enum TransportStatus: Equatable {
    case disconnected
    case connecting
    case connected
    case disconnecting
    case reconnecting
    case error
}

// MARK: - Transport Options

/// Configuration options for A2UI transport
public struct A2UITransportOptions {
    /// Enable automatic reconnection on disconnect
    public let reconnect: Bool

    /// Delay between reconnection attempts in milliseconds
    public let reconnectInterval: Int

    /// Maximum number of reconnection attempts
    public let maxReconnectAttempts: Int

    public init(
        reconnect: Bool = true,
        reconnectInterval: Int = 3000,
        maxReconnectAttempts: Int = .max
    ) {
        self.reconnect = reconnect
        self.reconnectInterval = reconnectInterval
        self.maxReconnectAttempts = maxReconnectAttempts
    }
}

// MARK: - Transport Error

/// Transport operation errors
public enum TransportError: Error, LocalizedError {
    case notConnected
    case connectionFailed(Error)
    case sendFailed(Error)
    case invalidMessage
    case maxReconnectAttemptsReached

    public var errorDescription: String? {
        switch self {
        case .notConnected:
            return "Transport is not connected"
        case .connectionFailed(let error):
            return "Connection failed: \(error.localizedDescription)"
        case .sendFailed(let error):
            return "Failed to send message: \(error.localizedDescription)"
        case .invalidMessage:
            return "Received invalid message format"
        case .maxReconnectAttemptsReached:
            return "Maximum reconnection attempts reached"
        }
    }
}

// MARK: - A2UI Transport

/// WebSocket transport for A2UI protocol communication
@available(iOS 15.0, macOS 12.0, *)
public actor A2UITransport {

    // MARK: - Properties

    private let url: URL
    private let options: A2UITransportOptions
    private var webSocketTask: URLSessionWebSocketTask?
    private var session: URLSession?

    private var _status: TransportStatus = .disconnected
    public nonisolated var status: TransportStatus {
        get async { await _status }
    }

    private var reconnectAttempts = 0
    private var reconnectTimer: Task<Void, Never>?

    // Event handlers
    private var statusChangeHandlers: [(TransportStatus) -> Void] = []
    private var createSurfaceHandlers: [(CreateSurfaceMessage) -> Void] = []
    private var updateComponentsHandlers: [(UpdateComponentsMessage) -> Void] = []
    private var updateDataModelHandlers: [(UpdateDataModelMessage) -> Void] = []
    private var deleteSurfaceHandlers: [(DeleteSurfaceMessage) -> Void] = []
    private var errorHandlers: [(ErrorMessage) -> Void] = []
    private var pingHandlers: [(PingMessage) -> Void] = []
    private var pongHandlers: [(PongMessage) -> Void] = []

    private let jsonEncoder = JSONEncoder()
    private let jsonDecoder = JSONDecoder()

    // MARK: - Initialization

    public init(url: URL, options: A2UITransportOptions = A2UITransportOptions()) {
        self.url = url
        self.options = options
    }

    // MARK: - Connection Management

    /// Connect to WebSocket server
    public func connect() async throws {
        guard _status == .disconnected || _status == .error else {
            return
        }

        updateStatus(.connecting)

        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 30

        session = URLSession(configuration: configuration)
        webSocketTask = session?.webSocketTask(with: url)
        webSocketTask?.resume()

        updateStatus(.connected)
        reconnectAttempts = 0

        // Start receiving messages
        await startReceiving()
    }

    /// Disconnect from WebSocket server
    public func disconnect() async throws {
        guard _status != .disconnected else {
            return
        }

        updateStatus(.disconnecting)

        reconnectTimer?.cancel()
        reconnectTimer = nil

        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil

        session?.invalidateAndCancel()
        session = nil

        updateStatus(.disconnected)
    }

    // MARK: - Message Sending

    /// Send a message to the agent
    public func send<T: A2UIMessageProtocol>(_ message: T) async throws {
        guard _status == .connected else {
            throw TransportError.notConnected
        }

        do {
            let data = try jsonEncoder.encode(message)
            let message = URLSessionWebSocketTask.Message.data(data)

            try await webSocketTask?.send(message)
        } catch {
            throw TransportError.sendFailed(error)
        }
    }

    // MARK: - Event Handlers

    /// Register handler for status changes
    public func onStatusChange(_ handler: @escaping (TransportStatus) -> Void) {
        statusChangeHandlers.append(handler)
    }

    /// Register handler for createSurface messages
    public func onCreateSurface(_ handler: @escaping (CreateSurfaceMessage) -> Void) {
        createSurfaceHandlers.append(handler)
    }

    /// Register handler for updateComponents messages
    public func onUpdateComponents(_ handler: @escaping (UpdateComponentsMessage) -> Void) {
        updateComponentsHandlers.append(handler)
    }

    /// Register handler for updateDataModel messages
    public func onUpdateDataModel(_ handler: @escaping (UpdateDataModelMessage) -> Void) {
        updateDataModelHandlers.append(handler)
    }

    /// Register handler for deleteSurface messages
    public func onDeleteSurface(_ handler: @escaping (DeleteSurfaceMessage) -> Void) {
        deleteSurfaceHandlers.append(handler)
    }

    /// Register handler for error messages
    public func onError(_ handler: @escaping (ErrorMessage) -> Void) {
        errorHandlers.append(handler)
    }

    /// Register handler for ping messages
    public func onPing(_ handler: @escaping (PingMessage) -> Void) {
        pingHandlers.append(handler)
    }

    /// Register handler for pong messages
    public func onPong(_ handler: @escaping (PongMessage) -> Void) {
        pongHandlers.append(handler)
    }

    // MARK: - Private Methods

    private func updateStatus(_ newStatus: TransportStatus) {
        _status = newStatus
        for handler in statusChangeHandlers {
            handler(newStatus)
        }
    }

    private func startReceiving() async {
        guard _status == .connected else { return }

        do {
            let message = try await webSocketTask?.receive()

            switch message {
            case .data(let data):
                await handleReceivedData(data)
            case .string(let string):
                if let data = string.data(using: .utf8) {
                    await handleReceivedData(data)
                }
            case .none:
                break
            @unknown default:
                break
            }

            // Continue receiving
            await startReceiving()

        } catch {
            // Connection closed or error
            if _status == .connected {
                updateStatus(.disconnected)

                if options.reconnect && reconnectAttempts < options.maxReconnectAttempts {
                    await attemptReconnect()
                } else {
                    updateStatus(.error)
                }
            }
        }
    }

    private func handleReceivedData(_ data: Data) async {
        do {
            // Try to determine message type from JSON
            guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let typeString = json["type"] as? String,
                  let messageType = MessageType(rawValue: typeString) else {
                notifyError(ErrorMessage(code: "INVALID_MESSAGE", message: "Invalid message format"))
                return
            }

            // Decode based on message type
            switch messageType {
            case .createSurface:
                let message = try jsonDecoder.decode(CreateSurfaceMessage.self, from: data)
                for handler in createSurfaceHandlers {
                    handler(message)
                }

            case .updateComponents:
                let message = try jsonDecoder.decode(UpdateComponentsMessage.self, from: data)
                for handler in updateComponentsHandlers {
                    handler(message)
                }

            case .updateDataModel:
                let message = try jsonDecoder.decode(UpdateDataModelMessage.self, from: data)
                for handler in updateDataModelHandlers {
                    handler(message)
                }

            case .deleteSurface:
                let message = try jsonDecoder.decode(DeleteSurfaceMessage.self, from: data)
                for handler in deleteSurfaceHandlers {
                    handler(message)
                }

            case .error:
                let message = try jsonDecoder.decode(ErrorMessage.self, from: data)
                notifyError(message)

            case .ping:
                let message = try jsonDecoder.decode(PingMessage.self, from: data)
                for handler in pingHandlers {
                    handler(message)
                }
                // Auto-respond with pong
                try? await send(PongMessage())

            case .pong:
                let message = try jsonDecoder.decode(PongMessage.self, from: data)
                for handler in pongHandlers {
                    handler(message)
                }

            case .userAction:
                // Client should not receive userAction messages
                break
            }

        } catch {
            notifyError(ErrorMessage(
                code: "DECODE_ERROR",
                message: "Failed to decode message: \(error.localizedDescription)"
            ))
        }
    }

    private func notifyError(_ error: ErrorMessage) {
        for handler in errorHandlers {
            handler(error)
        }
    }

    private func attemptReconnect() async {
        updateStatus(.reconnecting)
        reconnectAttempts += 1

        reconnectTimer = Task {
            try? await Task.sleep(nanoseconds: UInt64(options.reconnectInterval) * 1_000_000)

            if !Task.isCancelled {
                try? await connect()
            }
        }
    }
}

// MARK: - Test Helpers

#if DEBUG
@available(iOS 15.0, macOS 12.0, *)
extension A2UITransport {
    /// Simulate receiving a message (for testing)
    func simulateReceive(_ message: some A2UIMessageProtocol) async {
        do {
            let data = try jsonEncoder.encode(message)
            await handleReceivedData(data)
        } catch {
            print("Failed to simulate message: \(error)")
        }
    }

    /// Simulate receiving invalid message (for testing)
    func simulateReceiveInvalidMessage() async {
        let invalidData = "invalid json".data(using: .utf8)!
        await handleReceivedData(invalidData)
    }

    /// Simulate status change (for testing)
    func simulateStatusChange(_ status: TransportStatus) async {
        updateStatus(status)
    }
}
#endif
