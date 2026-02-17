import Foundation

/// RFC 6901 JSON Pointer implementation for Swift
/// https://datatracker.ietf.org/doc/html/rfc6901
public enum JSONPointer {

    // MARK: - Public API

    /// Resolve a value at the given JSON Pointer path
    /// - Parameters:
    ///   - object: The root object to traverse
    ///   - pointer: The JSON Pointer string (e.g., "/user/profile/name")
    /// - Returns: The resolved value
    /// - Throws: JSONPointerError if path is invalid or not found
    public static func resolve(_ object: Any, pointer: String) throws -> Any {
        let segments = try parse(pointer)
        return try resolveSegments(object, segments: segments)
    }

    /// Set a value at the given JSON Pointer path
    /// - Parameters:
    ///   - object: The root object to modify (must be mutable)
    ///   - pointer: The JSON Pointer string
    ///   - value: The value to set
    /// - Throws: JSONPointerError if path is invalid
    public static func set(_ object: inout Any, pointer: String, value: Any) throws {
        let segments = try parse(pointer)
        try setSegments(&object, segments: segments, value: value)
    }

    /// Remove a value at the given JSON Pointer path
    /// - Parameters:
    ///   - object: The root object to modify
    ///   - pointer: The JSON Pointer string
    /// - Returns: True if value was removed, false if not found
    /// - Throws: JSONPointerError if path is invalid
    @discardableResult
    public static func remove(_ object: inout Any, pointer: String) throws -> Bool {
        let segments = try parse(pointer)
        return try removeSegments(&object, segments: segments)
    }

    /// Check if a value exists at the given JSON Pointer path
    /// - Parameters:
    ///   - object: The root object to check
    ///   - pointer: The JSON Pointer string
    /// - Returns: True if path exists, false otherwise
    public static func has(_ object: Any, pointer: String) -> Bool {
        do {
            let segments = try parse(pointer)
            _ = try resolveSegments(object, segments: segments)
            return true
        } catch {
            return false
        }
    }

    /// Parse a JSON Pointer string into segments
    /// - Parameter pointer: The JSON Pointer string
    /// - Returns: Array of path segments
    /// - Throws: JSONPointerError if pointer is invalid
    public static func parse(_ pointer: String) throws -> [String] {
        // Root pointer
        if pointer.isEmpty {
            return []
        }

        // Must start with /
        guard pointer.hasPrefix("/") else {
            throw JSONPointerError.invalidFormat("Pointer must start with / or be empty")
        }

        // Split and unescape segments
        return pointer
            .dropFirst() // Remove leading /
            .split(separator: "/", omittingEmptySubsequences: false)
            .map { unescape(String($0)) }
    }

    /// Format segments into a JSON Pointer string
    /// - Parameter segments: Array of path segments
    /// - Returns: JSON Pointer string
    public static func format(_ segments: [String]) -> String {
        if segments.isEmpty {
            return ""
        }
        return "/" + segments.map { escape($0) }.joined(separator: "/")
    }

    /// Escape special characters in a segment
    /// - Parameter string: The string to escape
    /// - Returns: Escaped string
    public static func escape(_ string: String) -> String {
        return string
            .replacingOccurrences(of: "~", with: "~0")
            .replacingOccurrences(of: "/", with: "~1")
    }

    /// Unescape special characters in a segment
    /// - Parameter string: The string to unescape
    /// - Returns: Unescaped string
    public static func unescape(_ string: String) -> String {
        return string
            .replacingOccurrences(of: "~1", with: "/")
            .replacingOccurrences(of: "~0", with: "~")
    }

    /// Compile a JSON Pointer for reuse
    /// - Parameter pointer: The JSON Pointer string
    /// - Returns: Compiled pointer instance
    /// - Throws: JSONPointerError if pointer is invalid
    public static func compile(_ pointer: String) throws -> CompiledPointer {
        let segments = try parse(pointer)
        return CompiledPointer(segments: segments)
    }

    // MARK: - Internal Helpers

    internal static func resolveSegments(_ object: Any, segments: [String]) throws -> Any {
        var current = object

        for segment in segments {
            if let dict = current as? [String: Any] {
                guard let next = dict[segment] else {
                    throw JSONPointerError.pathNotFound("Key '\(segment)' not found")
                }
                current = next
            } else if let array = current as? [Any] {
                guard let index = Int(segment), index >= 0, index < array.count else {
                    throw JSONPointerError.pathNotFound("Array index '\(segment)' out of bounds")
                }
                current = array[index]
            } else {
                throw JSONPointerError.pathNotFound("Cannot traverse non-container type")
            }
        }

        return current
    }

    internal static func setSegments(_ object: inout Any, segments: [String], value: Any) throws {
        guard !segments.isEmpty else {
            object = value
            return
        }

        if var dict = object as? [String: Any] {
            try setInDictionary(&dict, segments: segments, value: value)
            object = dict
        } else if var array = object as? [Any] {
            try setInArray(&array, segments: segments, value: value)
            object = array
        } else {
            throw JSONPointerError.invalidOperation("Cannot set value on non-container type")
        }
    }

    private static func setInDictionary(_ dict: inout [String: Any], segments: [String], value: Any) throws {
        let key = segments[0]

        if segments.count == 1 {
            dict[key] = value
            return
        }

        let remaining = Array(segments.dropFirst())

        if var existingDict = dict[key] as? [String: Any] {
            try setInDictionary(&existingDict, segments: remaining, value: value)
            dict[key] = existingDict
        } else if var existingArray = dict[key] as? [Any] {
            try setInArray(&existingArray, segments: remaining, value: value)
            dict[key] = existingArray
        } else if dict[key] == nil {
            // Create new nested structure
            var newValue: Any = [:]
            try setSegments(&newValue, segments: remaining, value: value)
            dict[key] = newValue
        } else {
            throw JSONPointerError.invalidOperation("Cannot traverse non-container type")
        }
    }

    private static func setInArray(_ array: inout [Any], segments: [String], value: Any) throws {
        guard let index = Int(segments[0]), index >= 0, index < array.count else {
            throw JSONPointerError.pathNotFound("Array index out of bounds")
        }

        if segments.count == 1 {
            array[index] = value
            return
        }

        let remaining = Array(segments.dropFirst())

        if var existingDict = array[index] as? [String: Any] {
            try setInDictionary(&existingDict, segments: remaining, value: value)
            array[index] = existingDict
        } else if var existingArray = array[index] as? [Any] {
            try setInArray(&existingArray, segments: remaining, value: value)
            array[index] = existingArray
        } else {
            throw JSONPointerError.invalidOperation("Cannot traverse non-container type")
        }
    }

    internal static func removeSegments(_ object: inout Any, segments: [String]) throws -> Bool {
        guard !segments.isEmpty else {
            return false
        }

        if var dict = object as? [String: Any] {
            let removed = try removeFromDictionary(&dict, segments: segments)
            object = dict
            return removed
        } else if var array = object as? [Any] {
            let removed = try removeFromArray(&array, segments: segments)
            object = array
            return removed
        } else {
            return false
        }
    }

    private static func removeFromDictionary(_ dict: inout [String: Any], segments: [String]) throws -> Bool {
        let key = segments[0]

        if segments.count == 1 {
            if dict[key] != nil {
                dict.removeValue(forKey: key)
                return true
            }
            return false
        }

        let remaining = Array(segments.dropFirst())

        if var existingDict = dict[key] as? [String: Any] {
            let removed = try removeFromDictionary(&existingDict, segments: remaining)
            dict[key] = existingDict
            return removed
        } else if var existingArray = dict[key] as? [Any] {
            let removed = try removeFromArray(&existingArray, segments: remaining)
            dict[key] = existingArray
            return removed
        }

        return false
    }

    private static func removeFromArray(_ array: inout [Any], segments: [String]) throws -> Bool {
        guard let index = Int(segments[0]), index >= 0, index < array.count else {
            return false
        }

        if segments.count == 1 {
            array.remove(at: index)
            return true
        }

        let remaining = Array(segments.dropFirst())

        if var existingDict = array[index] as? [String: Any] {
            let removed = try removeFromDictionary(&existingDict, segments: remaining)
            array[index] = existingDict
            return removed
        } else if var existingArray = array[index] as? [Any] {
            let removed = try removeFromArray(&existingArray, segments: remaining)
            array[index] = existingArray
            return removed
        }

        return false
    }
}

// MARK: - CompiledPointer

/// Pre-compiled JSON Pointer for performance optimization
public struct CompiledPointer {
    private let segments: [String]

    init(segments: [String]) {
        self.segments = segments
    }

    /// Get value at compiled pointer path
    public func get(_ object: Any) throws -> Any {
        return try JSONPointer.resolveSegments(object, segments: segments)
    }

    /// Set value at compiled pointer path
    public func set(_ object: inout Any, value: Any) throws {
        try JSONPointer.setSegments(&object, segments: segments, value: value)
    }

    /// Remove value at compiled pointer path
    @discardableResult
    public func remove(_ object: inout Any) throws -> Bool {
        return try JSONPointer.removeSegments(&object, segments: segments)
    }

    /// Check if value exists at compiled pointer path
    public func has(_ object: Any) -> Bool {
        do {
            _ = try get(object)
            return true
        } catch {
            return false
        }
    }
}

// MARK: - Errors

/// JSON Pointer operation errors
public enum JSONPointerError: Error, LocalizedError {
    case invalidFormat(String)
    case pathNotFound(String)
    case invalidOperation(String)

    public var errorDescription: String? {
        switch self {
        case .invalidFormat(let message):
            return "Invalid pointer format: \(message)"
        case .pathNotFound(let message):
            return "Path not found: \(message)"
        case .invalidOperation(let message):
            return "Invalid operation: \(message)"
        }
    }
}
