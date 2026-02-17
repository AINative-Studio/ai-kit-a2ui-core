// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "A2UIKit",
    platforms: [
        .iOS(.v15),
        .macOS(.v12)
    ],
    products: [
        .library(
            name: "A2UIKit",
            targets: ["A2UIKit"]
        )
    ],
    dependencies: [],
    targets: [
        .target(
            name: "A2UIKit",
            dependencies: []
        ),
        .testTarget(
            name: "A2UIKitTests",
            dependencies: ["A2UIKit"]
        )
    ]
)
