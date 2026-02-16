import XCTest
@testable import A2UIKit

/// Test suite for RFC 6901 JSON Pointer implementation
final class JSONPointerTests: XCTestCase {

    // MARK: - Test Data

    let testData: [String: Any] = [
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
        ],
        "count": 42,
        "tags": ["swift", "ios", "testing"]
    ]

    // MARK: - Resolve Tests

    func testResolveRootPointer() throws {
        let result = try JSONPointer.resolve(testData, pointer: "")
        XCTAssertNotNil(result)
    }

    func testResolveSimplePath() throws {
        let count = try JSONPointer.resolve(testData, pointer: "/count") as? Int
        XCTAssertEqual(count, 42)
    }

    func testResolveNestedPath() throws {
        let name = try JSONPointer.resolve(testData, pointer: "/user/profile/name") as? String
        XCTAssertEqual(name, "Alice")

        let email = try JSONPointer.resolve(testData, pointer: "/user/profile/email") as? String
        XCTAssertEqual(email, "alice@example.com")
    }

    func testResolveArrayIndex() throws {
        let firstPost = try JSONPointer.resolve(testData, pointer: "/posts/0") as? [String: Any]
        XCTAssertEqual(firstPost?["id"] as? Int, 1)
        XCTAssertEqual(firstPost?["title"] as? String, "First post")

        let secondPostTitle = try JSONPointer.resolve(testData, pointer: "/posts/1/title") as? String
        XCTAssertEqual(secondPostTitle, "Second post")
    }

    func testResolveArrayElement() throws {
        let firstTag = try JSONPointer.resolve(testData, pointer: "/tags/0") as? String
        XCTAssertEqual(firstTag, "swift")

        let lastTag = try JSONPointer.resolve(testData, pointer: "/tags/2") as? String
        XCTAssertEqual(lastTag, "testing")
    }

    func testResolveNonExistentPath() {
        XCTAssertThrowsError(try JSONPointer.resolve(testData, pointer: "/nonexistent")) { error in
            XCTAssertTrue(error is JSONPointerError)
        }
    }

    func testResolveInvalidArrayIndex() {
        XCTAssertThrowsError(try JSONPointer.resolve(testData, pointer: "/posts/99")) { error in
            XCTAssertTrue(error is JSONPointerError)
        }
    }

    func testResolveInvalidPointerFormat() {
        XCTAssertThrowsError(try JSONPointer.resolve(testData, pointer: "invalid")) { error in
            XCTAssertTrue(error is JSONPointerError)
        }
    }

    // MARK: - Set Tests

    func testSetSimpleValue() throws {
        var mutableData = testData
        try JSONPointer.set(&mutableData, pointer: "/count", value: 100)

        let result = try JSONPointer.resolve(mutableData, pointer: "/count") as? Int
        XCTAssertEqual(result, 100)
    }

    func testSetNestedValue() throws {
        var mutableData = testData
        try JSONPointer.set(&mutableData, pointer: "/user/profile/name", value: "Bob")

        let result = try JSONPointer.resolve(mutableData, pointer: "/user/profile/name") as? String
        XCTAssertEqual(result, "Bob")
    }

    func testSetArrayElement() throws {
        var mutableData = testData
        try JSONPointer.set(&mutableData, pointer: "/tags/0", value: "kotlin")

        let result = try JSONPointer.resolve(mutableData, pointer: "/tags/0") as? String
        XCTAssertEqual(result, "kotlin")
    }

    func testSetNewProperty() throws {
        var mutableData = testData
        try JSONPointer.set(&mutableData, pointer: "/user/age", value: 30)

        let result = try JSONPointer.resolve(mutableData, pointer: "/user/age") as? Int
        XCTAssertEqual(result, 30)
    }

    func testSetOnNonExistentParent() {
        var mutableData = testData
        XCTAssertThrowsError(try JSONPointer.set(&mutableData, pointer: "/nonexistent/child", value: "value")) { error in
            XCTAssertTrue(error is JSONPointerError)
        }
    }

    // MARK: - Remove Tests

    func testRemoveSimpleProperty() throws {
        var mutableData = testData
        let removed = try JSONPointer.remove(&mutableData, pointer: "/count")

        XCTAssertTrue(removed)
        XCTAssertThrowsError(try JSONPointer.resolve(mutableData, pointer: "/count"))
    }

    func testRemoveNestedProperty() throws {
        var mutableData = testData
        let removed = try JSONPointer.remove(&mutableData, pointer: "/user/profile/email")

        XCTAssertTrue(removed)
        XCTAssertThrowsError(try JSONPointer.resolve(mutableData, pointer: "/user/profile/email"))

        // Verify parent still exists
        let name = try JSONPointer.resolve(mutableData, pointer: "/user/profile/name") as? String
        XCTAssertEqual(name, "Alice")
    }

    func testRemoveArrayElement() throws {
        var mutableData = testData
        let removed = try JSONPointer.remove(&mutableData, pointer: "/tags/1")

        XCTAssertTrue(removed)

        let tags = try JSONPointer.resolve(mutableData, pointer: "/tags") as? [String]
        XCTAssertEqual(tags?.count, 2)
        XCTAssertEqual(tags?[0], "swift")
        XCTAssertEqual(tags?[1], "testing")
    }

    func testRemoveNonExistentProperty() throws {
        var mutableData = testData
        let removed = try JSONPointer.remove(&mutableData, pointer: "/nonexistent")

        XCTAssertFalse(removed)
    }

    // MARK: - Has Tests

    func testHasExistingProperty() {
        XCTAssertTrue(JSONPointer.has(testData, pointer: "/count"))
        XCTAssertTrue(JSONPointer.has(testData, pointer: "/user/profile/name"))
        XCTAssertTrue(JSONPointer.has(testData, pointer: "/posts/0/title"))
    }

    func testHasNonExistentProperty() {
        XCTAssertFalse(JSONPointer.has(testData, pointer: "/nonexistent"))
        XCTAssertFalse(JSONPointer.has(testData, pointer: "/user/nonexistent"))
        XCTAssertFalse(JSONPointer.has(testData, pointer: "/posts/99"))
    }

    func testHasRootPointer() {
        XCTAssertTrue(JSONPointer.has(testData, pointer: ""))
    }

    // MARK: - Parse Tests

    func testParseSimplePointer() throws {
        let segments = try JSONPointer.parse("/count")
        XCTAssertEqual(segments, ["count"])
    }

    func testParseNestedPointer() throws {
        let segments = try JSONPointer.parse("/user/profile/name")
        XCTAssertEqual(segments, ["user", "profile", "name"])
    }

    func testParseArrayPointer() throws {
        let segments = try JSONPointer.parse("/posts/0/title")
        XCTAssertEqual(segments, ["posts", "0", "title"])
    }

    func testParseRootPointer() throws {
        let segments = try JSONPointer.parse("")
        XCTAssertEqual(segments, [])
    }

    func testParseEscapedCharacters() throws {
        let segments = try JSONPointer.parse("/field~0with~1slash")
        XCTAssertEqual(segments, ["field~with/slash"])
    }

    func testParseInvalidPointer() {
        XCTAssertThrowsError(try JSONPointer.parse("invalid")) { error in
            XCTAssertTrue(error is JSONPointerError)
        }
    }

    // MARK: - Format Tests

    func testFormatSimpleSegments() {
        let pointer = JSONPointer.format(["count"])
        XCTAssertEqual(pointer, "/count")
    }

    func testFormatNestedSegments() {
        let pointer = JSONPointer.format(["user", "profile", "name"])
        XCTAssertEqual(pointer, "/user/profile/name")
    }

    func testFormatEmptySegments() {
        let pointer = JSONPointer.format([])
        XCTAssertEqual(pointer, "")
    }

    func testFormatSegmentsWithSpecialCharacters() {
        let pointer = JSONPointer.format(["field~with/slash"])
        XCTAssertEqual(pointer, "/field~0with~1slash")
    }

    // MARK: - Escape/Unescape Tests

    func testEscapeSpecialCharacters() {
        XCTAssertEqual(JSONPointer.escape("field/with~slash"), "field~1with~0slash")
        XCTAssertEqual(JSONPointer.escape("normal"), "normal")
        XCTAssertEqual(JSONPointer.escape("~~/"), "~0~0~1")
    }

    func testUnescapeSpecialCharacters() {
        XCTAssertEqual(JSONPointer.unescape("field~1with~0slash"), "field/with~slash")
        XCTAssertEqual(JSONPointer.unescape("normal"), "normal")
        XCTAssertEqual(JSONPointer.unescape("~0~0~1"), "~~/")
    }

    func testEscapeUnescapeRoundtrip() {
        let original = "field/with~special/chars"
        let escaped = JSONPointer.escape(original)
        let unescaped = JSONPointer.unescape(escaped)
        XCTAssertEqual(unescaped, original)
    }

    // MARK: - Compile Tests

    func testCompilePointer() throws {
        let compiled = try JSONPointer.compile("/user/profile/name")
        let result = try compiled.get(testData) as? String
        XCTAssertEqual(result, "Alice")
    }

    func testCompiledPointerSet() throws {
        let compiled = try JSONPointer.compile("/count")
        var mutableData = testData
        try compiled.set(&mutableData, value: 99)

        let result = try compiled.get(mutableData) as? Int
        XCTAssertEqual(result, 99)
    }

    func testCompiledPointerRemove() throws {
        let compiled = try JSONPointer.compile("/count")
        var mutableData = testData
        let removed = try compiled.remove(&mutableData)

        XCTAssertTrue(removed)
    }

    func testCompiledPointerHas() throws {
        let compiled = try JSONPointer.compile("/user/profile/name")
        XCTAssertTrue(compiled.has(testData))

        let nonExistent = try JSONPointer.compile("/nonexistent")
        XCTAssertFalse(nonExistent.has(testData))
    }

    // MARK: - Edge Cases

    func testEmptyStringKey() throws {
        let data: [String: Any] = ["": "empty key value"]
        let result = try JSONPointer.resolve(data, pointer: "/") as? String
        XCTAssertEqual(result, "empty key value")
    }

    func testNumericStringKey() throws {
        let data: [String: Any] = ["123": "numeric key"]
        let result = try JSONPointer.resolve(data, pointer: "/123") as? String
        XCTAssertEqual(result, "numeric key")
    }

    func testNestedEmptyObjects() throws {
        var data: [String: Any] = [:]
        try JSONPointer.set(&data, pointer: "/a", value: [:] as [String: Any])

        XCTAssertTrue(JSONPointer.has(data, pointer: "/a"))
    }
}
