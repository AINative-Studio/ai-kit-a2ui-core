plugins {
    kotlin("jvm") version "1.9.21"
    kotlin("plugin.serialization") version "1.9.21"
    id("org.jetbrains.kotlinx.kover") version "0.7.5"
    id("io.gitlab.arturbosch.detekt") version "1.23.4"
    `maven-publish`
}

group = "com.ainative"
version = "1.0.0"

repositories {
    mavenCentral()
}

dependencies {
    // Kotlin coroutines for async operations
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // Kotlinx serialization for JSON
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")

    // Ktor client for WebSocket
    implementation("io.ktor:ktor-client-core:2.3.7")
    implementation("io.ktor:ktor-client-cio:2.3.7")
    implementation("io.ktor:ktor-client-websockets:2.3.7")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.7")

    // SLF4J for logging
    implementation("org.slf4j:slf4j-api:2.0.9")
    implementation("org.slf4j:slf4j-simple:2.0.9")

    // Testing
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5:1.9.21")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("io.ktor:ktor-client-mock:2.3.7")
}

tasks.test {
    useJUnitPlatform()

    // Fail build if test coverage is below 85%
    finalizedBy(tasks.koverVerify)
}

kover {
    // Enable coverage reporting
    reports {
        filters {
            excludes {
                // Exclude generated code
                classes("*.BuildConfig")
            }
        }
    }
}

tasks.koverVerify {
    rule {
        minBound(85)
    }
}

tasks.koverHtmlReport {
    // Generate HTML coverage report
    onCheck = true
}

detekt {
    buildUponDefaultConfig = true
    allRules = false
    config.setFrom("$projectDir/config/detekt.yml")
}

kotlin {
    jvmToolchain(17)

    compilerOptions {
        // Enable explicit API mode for better API design
        freeCompilerArgs.add("-Xexplicit-api=strict")
    }
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs = listOf(
            "-opt-in=kotlin.RequiresOptIn",
            "-Xexplicit-api=strict"
        )
    }
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])

            pom {
                name.set("A2UI Kotlin SDK")
                description.set("Production-ready Kotlin SDK for A2UI protocol (v0.9-v0.12)")
                url.set("https://github.com/AINative-Studio/ai-kit-a2ui-core")

                licenses {
                    license {
                        name.set("MIT License")
                        url.set("https://opensource.org/licenses/MIT")
                    }
                }

                developers {
                    developer {
                        organization.set("AINative Studio")
                        email.set("hello@ainative.studio")
                    }
                }

                scm {
                    connection.set("scm:git:git://github.com/AINative-Studio/ai-kit-a2ui-core.git")
                    url.set("https://github.com/AINative-Studio/ai-kit-a2ui-core")
                }
            }
        }
    }
}
