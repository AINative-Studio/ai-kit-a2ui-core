import Foundation

// MARK: - Message Types

/// A2UI protocol message types
public enum MessageType: String, Codable {
    case createSurface
    case updateComponents
    case updateDataModel
    case deleteSurface
    case userAction
    case error
    case ping
    case pong
}

// MARK: - Base Protocol

/// Base message protocol
public protocol A2UIMessageProtocol: Codable {
    var type: MessageType { get }
    var id: String? { get set }
    var timestamp: TimeInterval? { get set }
}

// MARK: - Component Types

/// A2UI component structure
public struct A2UIComponent: Codable {
    /// Unique component identifier
    public let id: String

    /// Component type
    public let type: String

    /// Component properties (type-specific)
    public let properties: [String: AnyCodable]?

    /// Child component IDs
    public let children: [String]?

    public init(
        id: String,
        type: String,
        properties: [String: Any]? = nil,
        children: [String]? = nil
    ) {
        self.id = id
        self.type = type
        self.properties = properties?.mapValues { AnyCodable($0) }
        self.children = children
    }

    enum CodingKeys: String, CodingKey {
        case id, type, properties, children
    }
}

// MARK: - Component Update

/// Component update operation
public enum ComponentOperation: String, Codable {
    case add
    case update
    case remove
}

/// Component update structure
public struct ComponentUpdate: Codable {
    /// Component ID to update
    public let id: String

    /// Operation type
    public let operation: ComponentOperation

    /// New/updated component (for add/update)
    public let component: A2UIComponent?

    public init(
        id: String,
        operation: ComponentOperation,
        component: A2UIComponent? = nil
    ) {
        self.id = id
        self.operation = operation
        self.component = component
    }
}

// MARK: - Data Update

/// Data update operation
public enum DataOperation: String, Codable {
    case set
    case remove
}

/// Data model update structure
public struct DataUpdate: Codable {
    /// JSON Pointer path (RFC 6901)
    public let path: String

    /// Operation type
    public let operation: DataOperation

    /// New value (for set operation)
    public let value: AnyCodable?

    public init(
        path: String,
        operation: DataOperation,
        value: Any? = nil
    ) {
        self.path = path
        self.operation = operation
        self.value = value.map { AnyCodable($0) }
    }
}

// MARK: - Message Implementations

/// Create Surface Message (Agent → UI)
public struct CreateSurfaceMessage: A2UIMessageProtocol {
    public let type: MessageType = .createSurface
    public var id: String?
    public var timestamp: TimeInterval?

    /// Surface identifier
    public let surfaceId: String

    /// Initial components
    public let components: [A2UIComponent]

    /// Initial data model
    public let dataModel: [String: AnyCodable]?

    /// Optional metadata
    public let metadata: [String: AnyCodable]?

    enum CodingKeys: String, CodingKey {
        case type, id, timestamp, surfaceId, components, dataModel, metadata
    }

    public init(
        surfaceId: String,
        components: [A2UIComponent],
        dataModel: [String: Any]? = nil,
        metadata: [String: Any]? = nil,
        id: String? = nil,
        timestamp: TimeInterval? = nil
    ) {
        self.surfaceId = surfaceId
        self.components = components
        self.dataModel = dataModel?.mapValues { AnyCodable($0) }
        self.metadata = metadata?.mapValues { AnyCodable($0) }
        self.id = id
        self.timestamp = timestamp
    }
}

/// Update Components Message (Agent → UI)
public struct UpdateComponentsMessage: A2UIMessageProtocol {
    public let type: MessageType = .updateComponents
    public var id: String?
    public var timestamp: TimeInterval?

    /// Surface identifier
    public let surfaceId: String

    /// Component updates
    public let updates: [ComponentUpdate]

    enum CodingKeys: String, CodingKey {
        case type, id, timestamp, surfaceId, updates
    }

    public init(
        surfaceId: String,
        updates: [ComponentUpdate],
        id: String? = nil,
        timestamp: TimeInterval? = nil
    ) {
        self.surfaceId = surfaceId
        self.updates = updates
        self.id = id
        self.timestamp = timestamp
    }
}

/// Update Data Model Message (Agent → UI)
public struct UpdateDataModelMessage: A2UIMessageProtocol {
    public let type: MessageType = .updateDataModel
    public var id: String?
    public var timestamp: TimeInterval?

    /// Surface identifier
    public let surfaceId: String

    /// Data updates
    public let updates: [DataUpdate]

    enum CodingKeys: String, CodingKey {
        case type, id, timestamp, surfaceId, updates
    }

    public init(
        surfaceId: String,
        updates: [DataUpdate],
        id: String? = nil,
        timestamp: TimeInterval? = nil
    ) {
        self.surfaceId = surfaceId
        self.updates = updates
        self.id = id
        self.timestamp = timestamp
    }
}

/// Delete Surface Message (Agent → UI)
public struct DeleteSurfaceMessage: A2UIMessageProtocol {
    public let type: MessageType = .deleteSurface
    public var id: String?
    public var timestamp: TimeInterval?

    /// Surface identifier
    public let surfaceId: String

    enum CodingKeys: String, CodingKey {
        case type, id, timestamp, surfaceId
    }

    public init(
        surfaceId: String,
        id: String? = nil,
        timestamp: TimeInterval? = nil
    ) {
        self.surfaceId = surfaceId
        self.id = id
        self.timestamp = timestamp
    }
}

/// User Action Message (UI → Agent)
public struct UserActionMessage: A2UIMessageProtocol {
    public let type: MessageType = .userAction
    public var id: String?
    public var timestamp: TimeInterval?

    /// Surface identifier
    public let surfaceId: String

    /// Action name
    public let action: String

    /// Component that triggered action
    public let componentId: String?

    /// Action context data
    public let context: [String: AnyCodable]?

    /// Current data model snapshot
    public let dataModel: [String: AnyCodable]?

    enum CodingKeys: String, CodingKey {
        case type, id, timestamp, surfaceId, action, componentId, context, dataModel
    }

    public init(
        surfaceId: String,
        action: String,
        componentId: String? = nil,
        context: [String: Any]? = nil,
        dataModel: [String: Any]? = nil,
        id: String? = nil,
        timestamp: TimeInterval? = nil
    ) {
        self.surfaceId = surfaceId
        self.action = action
        self.componentId = componentId
        self.context = context?.mapValues { AnyCodable($0) }
        self.dataModel = dataModel?.mapValues { AnyCodable($0) }
        self.id = id
        self.timestamp = timestamp
    }
}

/// Error Message (Bidirectional)
public struct ErrorMessage: A2UIMessageProtocol {
    public let type: MessageType = .error
    public var id: String?
    public var timestamp: TimeInterval?

    /// Error code
    public let code: String

    /// Error message
    public let message: String

    /// Optional error details
    public let details: [String: AnyCodable]?

    enum CodingKeys: String, CodingKey {
        case type, id, timestamp, code, message, details
    }

    public init(
        code: String,
        message: String,
        details: [String: Any]? = nil,
        id: String? = nil,
        timestamp: TimeInterval? = nil
    ) {
        self.code = code
        self.message = message
        self.details = details?.mapValues { AnyCodable($0) }
        self.id = id
        self.timestamp = timestamp
    }
}

/// Ping Message (Bidirectional)
public struct PingMessage: A2UIMessageProtocol {
    public let type: MessageType = .ping
    public var id: String?
    public var timestamp: TimeInterval?

    enum CodingKeys: String, CodingKey {
        case type, id, timestamp
    }

    public init(
        id: String? = nil,
        timestamp: TimeInterval? = nil
    ) {
        self.id = id
        self.timestamp = timestamp
    }
}

/// Pong Message (Bidirectional)
public struct PongMessage: A2UIMessageProtocol {
    public let type: MessageType = .pong
    public var id: String?
    public var timestamp: TimeInterval?

    enum CodingKeys: String, CodingKey {
        case type, id, timestamp
    }

    public init(
        id: String? = nil,
        timestamp: TimeInterval? = nil
    ) {
        self.id = id
        self.timestamp = timestamp
    }
}

// MARK: - AnyCodable

/// Type-erased Codable wrapper for heterogeneous collections
public struct AnyCodable: Codable {
    public let value: Any

    public init(_ value: Any) {
        self.value = value
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if container.decodeNil() {
            self.value = NSNull()
        } else if let bool = try? container.decode(Bool.self) {
            self.value = bool
        } else if let int = try? container.decode(Int.self) {
            self.value = int
        } else if let double = try? container.decode(Double.self) {
            self.value = double
        } else if let string = try? container.decode(String.self) {
            self.value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            self.value = array.map { $0.value }
        } else if let dictionary = try? container.decode([String: AnyCodable].self) {
            self.value = dictionary.mapValues { $0.value }
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "AnyCodable value cannot be decoded"
            )
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()

        switch value {
        case is NSNull:
            try container.encodeNil()
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let int8 as Int8:
            try container.encode(int8)
        case let int16 as Int16:
            try container.encode(int16)
        case let int32 as Int32:
            try container.encode(int32)
        case let int64 as Int64:
            try container.encode(int64)
        case let uint as UInt:
            try container.encode(uint)
        case let uint8 as UInt8:
            try container.encode(uint8)
        case let uint16 as UInt16:
            try container.encode(uint16)
        case let uint32 as UInt32:
            try container.encode(uint32)
        case let uint64 as UInt64:
            try container.encode(uint64)
        case let float as Float:
            try container.encode(float)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dictionary as [String: Any]:
            try container.encode(dictionary.mapValues { AnyCodable($0) })
        default:
            let context = EncodingError.Context(
                codingPath: container.codingPath,
                debugDescription: "AnyCodable value cannot be encoded"
            )
            throw EncodingError.invalidValue(value, context)
        }
    }
}
