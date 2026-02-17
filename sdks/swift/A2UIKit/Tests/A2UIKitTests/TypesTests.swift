import XCTest
@testable import A2UIKit

/// Test suite for A2UI protocol message types and Codable conformance
final class TypesTests: XCTestCase {

    let jsonEncoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .prettyPrinted]
        return encoder
    }()

    let jsonDecoder = JSONDecoder()

    // MARK: - Component Tests

    func testComponentEncodeDecode() throws {
        let component = A2UIComponent(
            id: "card-1",
            type: "card",
            properties: [
                "title": "Dashboard",
                "description": "User analytics"
            ],
            children: ["text-1", "button-1"]
        )

        let encoded = try jsonEncoder.encode(component)
        let decoded = try jsonDecoder.decode(A2UIComponent.self, from: encoded)

        XCTAssertEqual(decoded.id, "card-1")
        XCTAssertEqual(decoded.type, "card")
        XCTAssertEqual(decoded.properties?["title"] as? String, "Dashboard")
        XCTAssertEqual(decoded.children, ["text-1", "button-1"])
    }

    func testComponentWithoutOptionalFields() throws {
        let component = A2UIComponent(
            id: "button-1",
            type: "button"
        )

        let encoded = try jsonEncoder.encode(component)
        let decoded = try jsonDecoder.decode(A2UIComponent.self, from: encoded)

        XCTAssertEqual(decoded.id, "button-1")
        XCTAssertEqual(decoded.type, "button")
        XCTAssertNil(decoded.properties)
        XCTAssertNil(decoded.children)
    }

    func testNestedComponentProperties() throws {
        let component = A2UIComponent(
            id: "form-1",
            type: "card",
            properties: [
                "nested": [
                    "level": 2,
                    "items": ["a", "b", "c"]
                ]
            ]
        )

        let encoded = try jsonEncoder.encode(component)
        let decoded = try jsonDecoder.decode(A2UIComponent.self, from: encoded)

        let nested = decoded.properties?["nested"] as? [String: Any]
        XCTAssertEqual(nested?["level"] as? Int, 2)
    }

    // MARK: - CreateSurface Message Tests

    func testCreateSurfaceMessageEncodeDecode() throws {
        let message = CreateSurfaceMessage(
            surfaceId: "dashboard-1",
            components: [
                A2UIComponent(id: "card-1", type: "card"),
                A2UIComponent(id: "text-1", type: "text")
            ],
            dataModel: [
                "user": ["name": "Alice", "email": "alice@example.com"]
            ],
            metadata: ["version": "1.0"]
        )

        let encoded = try jsonEncoder.encode(message)
        let decoded = try jsonDecoder.decode(CreateSurfaceMessage.self, from: encoded)

        XCTAssertEqual(decoded.type, .createSurface)
        XCTAssertEqual(decoded.surfaceId, "dashboard-1")
        XCTAssertEqual(decoded.components.count, 2)
        XCTAssertEqual(decoded.components[0].id, "card-1")
        XCTAssertNotNil(decoded.dataModel)
        XCTAssertNotNil(decoded.metadata)
    }

    func testCreateSurfaceWithTimestamp() throws {
        let timestamp = Date().timeIntervalSince1970
        let message = CreateSurfaceMessage(
            surfaceId: "test-1",
            components: [],
            timestamp: timestamp
        )

        let encoded = try jsonEncoder.encode(message)
        let decoded = try jsonDecoder.decode(CreateSurfaceMessage.self, from: encoded)

        XCTAssertEqual(decoded.timestamp, timestamp, accuracy: 0.001)
    }

    // MARK: - UpdateComponents Message Tests

    func testUpdateComponentsMessageEncodeDecode() throws {
        let message = UpdateComponentsMessage(
            surfaceId: "dashboard-1",
            updates: [
                ComponentUpdate(
                    id: "card-1",
                    operation: .update,
                    component: A2UIComponent(id: "card-1", type: "card", properties: ["title": "New Title"])
                ),
                ComponentUpdate(
                    id: "old-component",
                    operation: .remove
                )
            ]
        )

        let encoded = try jsonEncoder.encode(message)
        let decoded = try jsonDecoder.decode(UpdateComponentsMessage.self, from: encoded)

        XCTAssertEqual(decoded.type, .updateComponents)
        XCTAssertEqual(decoded.surfaceId, "dashboard-1")
        XCTAssertEqual(decoded.updates.count, 2)
        XCTAssertEqual(decoded.updates[0].operation, .update)
        XCTAssertEqual(decoded.updates[1].operation, .remove)
    }

    func testComponentUpdateOperations() throws {
        let addUpdate = ComponentUpdate(
            id: "new-1",
            operation: .add,
            component: A2UIComponent(id: "new-1", type: "button")
        )

        let updateUpdate = ComponentUpdate(
            id: "existing-1",
            operation: .update,
            component: A2UIComponent(id: "existing-1", type: "text")
        )

        let removeUpdate = ComponentUpdate(
            id: "old-1",
            operation: .remove
        )

        let encoded1 = try jsonEncoder.encode(addUpdate)
        let decoded1 = try jsonDecoder.decode(ComponentUpdate.self, from: encoded1)
        XCTAssertEqual(decoded1.operation, .add)
        XCTAssertNotNil(decoded1.component)

        let encoded2 = try jsonEncoder.encode(updateUpdate)
        let decoded2 = try jsonDecoder.decode(ComponentUpdate.self, from: encoded2)
        XCTAssertEqual(decoded2.operation, .update)

        let encoded3 = try jsonEncoder.encode(removeUpdate)
        let decoded3 = try jsonDecoder.decode(ComponentUpdate.self, from: encoded3)
        XCTAssertEqual(decoded3.operation, .remove)
        XCTAssertNil(decoded3.component)
    }

    // MARK: - UpdateDataModel Message Tests

    func testUpdateDataModelMessageEncodeDecode() throws {
        let message = UpdateDataModelMessage(
            surfaceId: "dashboard-1",
            updates: [
                DataUpdate(path: "/user/name", operation: .set, value: "Bob"),
                DataUpdate(path: "/user/age", operation: .set, value: 30),
                DataUpdate(path: "/user/oldField", operation: .remove)
            ]
        )

        let encoded = try jsonEncoder.encode(message)
        let decoded = try jsonDecoder.decode(UpdateDataModelMessage.self, from: encoded)

        XCTAssertEqual(decoded.type, .updateDataModel)
        XCTAssertEqual(decoded.surfaceId, "dashboard-1")
        XCTAssertEqual(decoded.updates.count, 3)
        XCTAssertEqual(decoded.updates[0].path, "/user/name")
        XCTAssertEqual(decoded.updates[0].operation, .set)
        XCTAssertEqual(decoded.updates[2].operation, .remove)
    }

    // MARK: - DeleteSurface Message Tests

    func testDeleteSurfaceMessageEncodeDecode() throws {
        let message = DeleteSurfaceMessage(surfaceId: "dashboard-1")

        let encoded = try jsonEncoder.encode(message)
        let decoded = try jsonDecoder.decode(DeleteSurfaceMessage.self, from: encoded)

        XCTAssertEqual(decoded.type, .deleteSurface)
        XCTAssertEqual(decoded.surfaceId, "dashboard-1")
    }

    // MARK: - UserAction Message Tests

    func testUserActionMessageEncodeDecode() throws {
        let message = UserActionMessage(
            surfaceId: "chat-1",
            action: "send-message",
            componentId: "input-1",
            context: [
                "message": "Hello, agent!",
                "timestamp": 1234567890
            ],
            dataModel: ["user": ["id": "user-123"]]
        )

        let encoded = try jsonEncoder.encode(message)
        let decoded = try jsonDecoder.decode(UserActionMessage.self, from: encoded)

        XCTAssertEqual(decoded.type, .userAction)
        XCTAssertEqual(decoded.surfaceId, "chat-1")
        XCTAssertEqual(decoded.action, "send-message")
        XCTAssertEqual(decoded.componentId, "input-1")
        XCTAssertNotNil(decoded.context)
        XCTAssertNotNil(decoded.dataModel)
    }

    func testUserActionWithoutOptionalFields() throws {
        let message = UserActionMessage(
            surfaceId: "surface-1",
            action: "click"
        )

        let encoded = try jsonEncoder.encode(message)
        let decoded = try jsonDecoder.decode(UserActionMessage.self, from: encoded)

        XCTAssertEqual(decoded.action, "click")
        XCTAssertNil(decoded.componentId)
        XCTAssertNil(decoded.context)
        XCTAssertNil(decoded.dataModel)
    }

    // MARK: - Error Message Tests

    func testErrorMessageEncodeDecode() throws {
        let message = ErrorMessage(
            code: "INVALID_SURFACE",
            message: "Surface not found",
            details: ["surfaceId": "unknown-1"]
        )

        let encoded = try jsonEncoder.encode(message)
        let decoded = try jsonDecoder.decode(ErrorMessage.self, from: encoded)

        XCTAssertEqual(decoded.type, .error)
        XCTAssertEqual(decoded.code, "INVALID_SURFACE")
        XCTAssertEqual(decoded.message, "Surface not found")
        XCTAssertNotNil(decoded.details)
    }

    // MARK: - Ping/Pong Message Tests

    func testPingMessageEncodeDecode() throws {
        let message = PingMessage()

        let encoded = try jsonEncoder.encode(message)
        let decoded = try jsonDecoder.decode(PingMessage.self, from: encoded)

        XCTAssertEqual(decoded.type, .ping)
    }

    func testPongMessageEncodeDecode() throws {
        let message = PongMessage()

        let encoded = try jsonEncoder.encode(message)
        let decoded = try jsonDecoder.decode(PongMessage.self, from: encoded)

        XCTAssertEqual(decoded.type, .pong)
    }

    // MARK: - Message Type Discrimination Tests

    func testMessageTypeDiscrimination() throws {
        let createMessage = CreateSurfaceMessage(surfaceId: "test-1", components: [])
        let updateMessage = UpdateComponentsMessage(surfaceId: "test-1", updates: [])
        let deleteMessage = DeleteSurfaceMessage(surfaceId: "test-1")
        let userActionMessage = UserActionMessage(surfaceId: "test-1", action: "click")
        let errorMessage = ErrorMessage(code: "ERROR", message: "Test error")
        let pingMessage = PingMessage()
        let pongMessage = PongMessage()

        XCTAssertEqual(createMessage.type, .createSurface)
        XCTAssertEqual(updateMessage.type, .updateComponents)
        XCTAssertEqual(deleteMessage.type, .deleteSurface)
        XCTAssertEqual(userActionMessage.type, .userAction)
        XCTAssertEqual(errorMessage.type, .error)
        XCTAssertEqual(pingMessage.type, .ping)
        XCTAssertEqual(pongMessage.type, .pong)
    }

    // MARK: - JSON Compatibility Tests

    func testDecodeFromJSONString() throws {
        let jsonString = """
        {
          "type": "createSurface",
          "surfaceId": "dashboard-1",
          "components": [
            {
              "id": "card-1",
              "type": "card",
              "properties": {
                "title": "Dashboard"
              }
            }
          ]
        }
        """

        let data = jsonString.data(using: .utf8)!
        let decoded = try jsonDecoder.decode(CreateSurfaceMessage.self, from: data)

        XCTAssertEqual(decoded.surfaceId, "dashboard-1")
        XCTAssertEqual(decoded.components.count, 1)
        XCTAssertEqual(decoded.components[0].properties?["title"] as? String, "Dashboard")
    }

    func testEncodeToJSONString() throws {
        let message = ErrorMessage(code: "TEST_ERROR", message: "Test message")
        let encoded = try jsonEncoder.encode(message)
        let jsonString = String(data: encoded, encoding: .utf8)!

        XCTAssertTrue(jsonString.contains("\"type\" : \"error\""))
        XCTAssertTrue(jsonString.contains("\"code\" : \"TEST_ERROR\""))
        XCTAssertTrue(jsonString.contains("\"message\" : \"Test message\""))
    }

    // MARK: - Edge Cases

    func testEmptyComponentsList() throws {
        let message = CreateSurfaceMessage(surfaceId: "empty-1", components: [])
        let encoded = try jsonEncoder.encode(message)
        let decoded = try jsonDecoder.decode(CreateSurfaceMessage.self, from: encoded)

        XCTAssertEqual(decoded.components.count, 0)
    }

    func testEmptyUpdatesList() throws {
        let message = UpdateComponentsMessage(surfaceId: "test-1", updates: [])
        let encoded = try jsonEncoder.encode(message)
        let decoded = try jsonDecoder.decode(UpdateComponentsMessage.self, from: encoded)

        XCTAssertEqual(decoded.updates.count, 0)
    }

    func testComplexNestedDataModel() throws {
        let dataModel: [String: Any] = [
            "users": [
                ["id": 1, "name": "Alice", "roles": ["admin", "user"]],
                ["id": 2, "name": "Bob", "roles": ["user"]]
            ],
            "settings": [
                "theme": "dark",
                "notifications": [
                    "email": true,
                    "push": false
                ]
            ]
        ]

        let message = CreateSurfaceMessage(
            surfaceId: "test-1",
            components: [],
            dataModel: dataModel
        )

        let encoded = try jsonEncoder.encode(message)
        let decoded = try jsonDecoder.decode(CreateSurfaceMessage.self, from: encoded)

        XCTAssertNotNil(decoded.dataModel)
    }
}
