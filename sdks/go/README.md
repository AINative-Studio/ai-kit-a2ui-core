# A2UI Go SDK

Production-ready Go SDK for the A2UI protocol (v0.9-v0.12). Build agent-to-UI communication systems with WebSocket transport, RFC 6901 JSON Pointer support, and automatic reconnection.

## Features

- **Complete A2UI Protocol**: Full implementation of A2UI v0.9-v0.12 message types
- **RFC 6901 JSON Pointer**: Compliant implementation for data model navigation
- **WebSocket Transport**: Auto-reconnection, ping/pong keep-alive, event system
- **Type-Safe**: Comprehensive Go type definitions with interfaces
- **Production-Ready**: Error handling, context support, goroutine-safe
- **Idiomatic Go**: Follows effective Go guidelines and best practices
- **Well-Tested**: 45%+ test coverage with comprehensive test suite

## Installation

```bash
go get github.com/ainative/a2ui-go
```

## Quick Start

```go
package main

import (
	"encoding/json"
	"log"
	"os"
	"os/signal"

	"github.com/ainative/a2ui-go/a2ui"
)

func main() {
	// Create transport
	transport := a2ui.NewTransport("ws://localhost:8000", nil)

	// Register message handlers
	transport.On("createSurface", func(msg json.RawMessage) error {
		var surface a2ui.CreateSurfaceMessage
		if err := json.Unmarshal(msg, &surface); err != nil {
			return err
		}
		log.Printf("Surface created: %s", surface.SurfaceID)
		return nil
	})

	// Register event handlers
	transport.OnEvent("connect", func(data interface{}) {
		log.Println("Connected!")
	})

	transport.OnEvent("error", func(data interface{}) {
		log.Printf("Error: %v", data)
	})

	// Connect to agent
	if err := transport.Connect(); err != nil {
		log.Fatal(err)
	}
	defer transport.Close()

	// Wait for interrupt
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)
	<-interrupt
}
```

## Core Components

### 1. JSON Pointer (RFC 6901)

Navigate and manipulate JSON data structures using JSON Pointer paths:

```go
jp := &a2ui.JSONPointer{}

data := map[string]interface{}{
	"user": map[string]interface{}{
		"name": "Alice",
		"age":  30,
	},
	"items": []interface{}{"a", "b", "c"},
}

// Resolve values
name, err := jp.Resolve(data, "/user/name")  // "Alice"
age, err := jp.Resolve(data, "/user/age")    // 30
item, err := jp.Resolve(data, "/items/0")    // "a"

// Set values
err = jp.Set(data, "/user/city", "NYC")
err = jp.Set(data, "/items/-", "d")  // Append to array

// Remove values
removed, err := jp.Remove(data, "/user/age")  // true

// Parse pointers
tokens := jp.Parse("/user/profile/name")  // ["user", "profile", "name"]
```

**RFC 6901 Escape Sequences:**

```go
data := map[string]interface{}{
	"user~name": "Alice",      // ~ escaped as ~0
	"path/to":   "value",      // / escaped as ~1
}

// Access escaped keys
name, _ := jp.Resolve(data, "/user~0name")  // "Alice"
val, _ := jp.Resolve(data, "/path~1to")     // "value"
```

### 2. WebSocket Transport

Framework-agnostic WebSocket transport with auto-reconnection:

```go
// Create transport with custom options
options := &a2ui.TransportOptions{
	AutoReconnect:        true,
	ReconnectDelay:       3 * time.Second,
	MaxReconnectAttempts: 5,
	PingInterval:         30 * time.Second,
	PongTimeout:          5 * time.Second,
	Logger:               log.New(os.Stdout, "[A2UI] ", log.LstdFlags),
}

transport := a2ui.NewTransport("ws://localhost:8000", options)

// Register message handlers
transport.On("createSurface", handleCreateSurface)
transport.On("updateComponents", handleUpdateComponents)
transport.On("updateDataModel", handleUpdateDataModel)

// Register event handlers
transport.OnEvent("connect", func(data interface{}) {
	log.Println("Connected!")
})

transport.OnEvent("disconnect", func(data interface{}) {
	log.Println("Disconnected")
})

transport.OnEvent("reconnecting", func(data interface{}) {
	attempt := data.(int)
	log.Printf("Reconnecting (attempt %d)...", attempt)
})

transport.OnEvent("statusChange", func(data interface{}) {
	status := data.(a2ui.TransportStatus)
	log.Printf("Status: %s", status)
})

// Connect
if err := transport.Connect(); err != nil {
	log.Fatal(err)
}
defer transport.Close()

// Send messages
action := &a2ui.UserActionMessage{
	Type:      a2ui.MessageTypeUserAction,
	SurfaceID: "main-surface",
	Action:    "submit",
	Context: map[string]interface{}{
		"formData": map[string]interface{}{
			"name": "Alice",
		},
	},
}

if err := transport.Send(action); err != nil {
	log.Printf("Failed to send: %v", err)
}
```

**Transport Status:**

```go
status := transport.Status()  // disconnected | connecting | connected | error
isConnected := transport.IsConnected()  // bool
```

### 3. Message Types

Complete A2UI protocol message types:

```go
// Create Surface (Agent → UI)
createMsg := &a2ui.CreateSurfaceMessage{
	Type:      a2ui.MessageTypeCreateSurface,
	SurfaceID: "surface-1",
	Components: []a2ui.Component{
		{
			Type: "button",
			ID:   "btn-1",
			Properties: map[string]interface{}{
				"label": "Click me",
			},
		},
	},
	DataModel: map[string]interface{}{
		"user": map[string]interface{}{
			"name": "Alice",
		},
	},
}

// Update Components (Agent → UI)
updateMsg := &a2ui.UpdateComponentsMessage{
	Type:      a2ui.MessageTypeUpdateComponents,
	SurfaceID: "surface-1",
	Updates: []a2ui.ComponentUpdate{
		{
			ID:        "btn-1",
			Operation: a2ui.OperationUpdate,
			Component: &a2ui.Component{
				Type: "button",
				ID:   "btn-1",
				Properties: map[string]interface{}{
					"disabled": true,
				},
			},
		},
	},
}

// Update Data Model (Agent → UI)
dataMsg := &a2ui.UpdateDataModelMessage{
	Type:      a2ui.MessageTypeUpdateDataModel,
	SurfaceID: "surface-1",
	Updates: []a2ui.DataUpdate{
		{
			Path:      "/user/name",
			Operation: a2ui.DataOperationSet,
			Value:     "Bob",
		},
	},
}

// User Action (UI → Agent)
actionMsg := &a2ui.UserActionMessage{
	Type:        a2ui.MessageTypeUserAction,
	SurfaceID:   "surface-1",
	Action:      "submit",
	ComponentID: "btn-1",
	Context: map[string]interface{}{
		"formData": map[string]interface{}{},
	},
}

// Error Message (Bidirectional)
errorMsg := &a2ui.ErrorMessage{
	Type:    a2ui.MessageTypeError,
	Code:    "VALIDATION_ERROR",
	Message: "Invalid input",
	Details: map[string]interface{}{
		"field": "email",
	},
}

// Delete Surface (Agent → UI)
deleteMsg := &a2ui.DeleteSurfaceMessage{
	Type:      a2ui.MessageTypeDeleteSurface,
	SurfaceID: "surface-1",
}

// Ping/Pong (Bidirectional)
pingMsg := &a2ui.PingMessage{Type: a2ui.MessageTypePing}
pongMsg := &a2ui.PongMessage{Type: a2ui.MessageTypePong}
```

## Examples

### Basic Agent Communication

See `examples/basic/main.go` for a complete example with:
- Connection management
- Message handling
- Event handling
- Graceful shutdown

```bash
cd examples/basic
go run main.go
```

### File Upload Handler

See `examples/fileupload/main.go` for a file upload UI handler with:
- File component detection
- Upload progress tracking
- Response handling

```bash
cd examples/fileupload
go run main.go
```

### MCP Integration

See `examples/mcp/main.go` for Model Context Protocol integration with:
- Data model synchronization
- Query/update/delete operations
- JSON Pointer data manipulation

```bash
cd examples/mcp
go run main.go
```

## API Reference

### Transport

```go
// Create transport
func NewTransport(url string, options *TransportOptions) *Transport

// Connection management
func (t *Transport) Connect() error
func (t *Transport) Disconnect() error
func (t *Transport) Close() error

// Message handling
func (t *Transport) Send(message Message) error
func (t *Transport) On(messageType string, handler MessageHandler)

// Event handling
func (t *Transport) OnEvent(event string, handler EventHandler)

// Status
func (t *Transport) Status() TransportStatus
func (t *Transport) IsConnected() bool
```

**Events:**
- `connect` - Connected to agent
- `disconnect` - Disconnected from agent
- `error` - Error occurred
- `statusChange` - Connection status changed
- `reconnecting` - Reconnection attempt

### JSON Pointer

```go
// Create JSON Pointer
jp := &a2ui.JSONPointer{}

// Navigate data
func (jp *JSONPointer) Resolve(data interface{}, pointer string) (interface{}, error)

// Modify data
func (jp *JSONPointer) Set(data interface{}, pointer string, value interface{}) error
func (jp *JSONPointer) Remove(data interface{}, pointer string) (bool, error)

// Parse pointers
func (jp *JSONPointer) Parse(pointer string) []string
```

## Testing

Run the test suite:

```bash
go test ./a2ui -v
```

Run with coverage:

```bash
go test ./a2ui -v -cover -coverprofile=coverage.out
go tool cover -html=coverage.out
```

Run code quality checks:

```bash
go vet ./...
go fmt ./...
```

## Architecture

The SDK is designed with clean separation of concerns:

```
a2ui/
├── types.go          # Protocol message types and constants
├── transport.go      # WebSocket transport layer
├── jsonpointer.go    # RFC 6901 JSON Pointer implementation
├── *_test.go         # Comprehensive test suite
```

**Key Design Principles:**

- **Type Safety**: Strong typing for all protocol messages
- **Error Handling**: Comprehensive error types and handling
- **Concurrency**: Thread-safe operations with proper locking
- **Context Support**: Graceful shutdown with context cancellation
- **Idiomatic Go**: Follows Go best practices and conventions

## Protocol Compliance

This SDK implements:

- **A2UI Protocol v0.9-v0.12**: All message types and operations
- **RFC 6901 JSON Pointer**: Complete specification compliance
- **WebSocket**: Full-duplex communication with auto-reconnection

## Requirements

- Go 1.21 or higher
- gorilla/websocket v1.5.1
- stretchr/testify v1.8.4 (testing only)

## License

[Add your license here]

## Contributing

Contributions welcome! Please ensure:

1. All tests pass: `go test ./a2ui -v`
2. Code is formatted: `go fmt ./...`
3. No vet issues: `go vet ./...`
4. Test coverage ≥45%

## Support

For issues and questions, please open an issue on GitHub.
