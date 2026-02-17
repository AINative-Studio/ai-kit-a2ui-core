package a2ui

// MessageType represents all A2UI protocol message types
type MessageType string

const (
	// MessageTypeCreateSurface creates a new UI surface
	MessageTypeCreateSurface MessageType = "createSurface"
	// MessageTypeUpdateComponents updates existing components
	MessageTypeUpdateComponents MessageType = "updateComponents"
	// MessageTypeUpdateDataModel updates the data model
	MessageTypeUpdateDataModel MessageType = "updateDataModel"
	// MessageTypeDeleteSurface removes a UI surface
	MessageTypeDeleteSurface MessageType = "deleteSurface"
	// MessageTypeUserAction sent when user interacts with UI
	MessageTypeUserAction MessageType = "userAction"
	// MessageTypeError communicates errors
	MessageTypeError MessageType = "error"
	// MessageTypePing keep-alive ping
	MessageTypePing MessageType = "ping"
	// MessageTypePong keep-alive pong
	MessageTypePong MessageType = "pong"
)

// OperationType represents component update operations
type OperationType string

const (
	// OperationAdd adds a new component
	OperationAdd OperationType = "add"
	// OperationUpdate updates an existing component
	OperationUpdate OperationType = "update"
	// OperationRemove removes a component
	OperationRemove OperationType = "remove"
)

// DataOperationType represents data model operations
type DataOperationType string

const (
	// DataOperationSet sets a value in the data model
	DataOperationSet DataOperationType = "set"
	// DataOperationRemove removes a value from the data model
	DataOperationRemove DataOperationType = "remove"
)

// Component represents an A2UI component
type Component struct {
	// Type is the component type identifier
	Type string `json:"type"`
	// ID is the unique component identifier
	ID string `json:"id"`
	// Properties contains component-specific properties
	Properties map[string]interface{} `json:"properties,omitempty"`
	// Children contains child component IDs
	Children []string `json:"children,omitempty"`
}

// Message is the interface that all A2UI messages implement
type Message interface {
	MessageType() MessageType
}

// BaseMessage contains common message fields
type BaseMessage struct {
	// Type is the message type
	Type MessageType `json:"type"`
	// ID is an optional message identifier for tracking
	ID string `json:"id,omitempty"`
	// Timestamp is the message timestamp
	Timestamp int64 `json:"timestamp,omitempty"`
}

// MessageType implements the Message interface for BaseMessage
func (m *BaseMessage) MessageType() MessageType {
	return m.Type
}

// CreateSurfaceMessage initializes a new UI surface (Agent → UI)
type CreateSurfaceMessage struct {
	// Type is the message type
	Type MessageType `json:"type"`
	// ID is an optional message identifier for tracking
	ID string `json:"id,omitempty"`
	// Timestamp is the message timestamp
	Timestamp int64 `json:"timestamp,omitempty"`
	// SurfaceID is the surface identifier
	SurfaceID string `json:"surfaceId"`
	// Components are the initial components
	Components []Component `json:"components"`
	// DataModel is the initial data model
	DataModel map[string]interface{} `json:"dataModel,omitempty"`
	// Metadata contains optional metadata
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// MessageType implements the Message interface
func (m *CreateSurfaceMessage) MessageType() MessageType {
	return m.Type
}

// ComponentUpdate represents a component update operation
type ComponentUpdate struct {
	// ID is the component ID to update
	ID string `json:"id"`
	// Operation is the update operation type
	Operation OperationType `json:"operation"`
	// Component is the new/updated component (for add/update operations)
	Component *Component `json:"component,omitempty"`
}

// UpdateComponentsMessage updates existing components (Agent → UI)
type UpdateComponentsMessage struct {
	// Type is the message type
	Type MessageType `json:"type"`
	// ID is an optional message identifier for tracking
	ID string `json:"id,omitempty"`
	// Timestamp is the message timestamp
	Timestamp int64 `json:"timestamp,omitempty"`
	// SurfaceID is the surface identifier
	SurfaceID string `json:"surfaceId"`
	// Updates are the component updates to apply
	Updates []ComponentUpdate `json:"updates"`
}

// MessageType implements the Message interface
func (m *UpdateComponentsMessage) MessageType() MessageType {
	return m.Type
}

// DataUpdate represents a data model update using JSON Pointer
type DataUpdate struct {
	// Path is the JSON Pointer path (RFC 6901)
	Path string `json:"path"`
	// Operation is the data operation type
	Operation DataOperationType `json:"operation"`
	// Value is the new value (for set operations)
	Value interface{} `json:"value,omitempty"`
}

// UpdateDataModelMessage updates the data model (Agent → UI)
type UpdateDataModelMessage struct {
	// Type is the message type
	Type MessageType `json:"type"`
	// ID is an optional message identifier for tracking
	ID string `json:"id,omitempty"`
	// Timestamp is the message timestamp
	Timestamp int64 `json:"timestamp,omitempty"`
	// SurfaceID is the surface identifier
	SurfaceID string `json:"surfaceId"`
	// Updates are the data model updates to apply
	Updates []DataUpdate `json:"updates"`
}

// MessageType implements the Message interface
func (m *UpdateDataModelMessage) MessageType() MessageType {
	return m.Type
}

// DeleteSurfaceMessage removes a UI surface (Agent → UI)
type DeleteSurfaceMessage struct {
	// Type is the message type
	Type MessageType `json:"type"`
	// ID is an optional message identifier for tracking
	ID string `json:"id,omitempty"`
	// Timestamp is the message timestamp
	Timestamp int64 `json:"timestamp,omitempty"`
	// SurfaceID is the surface identifier
	SurfaceID string `json:"surfaceId"`
}

// MessageType implements the Message interface
func (m *DeleteSurfaceMessage) MessageType() MessageType {
	return m.Type
}

// UserActionMessage is sent when user interacts with UI (UI → Agent)
type UserActionMessage struct {
	// Type is the message type
	Type MessageType `json:"type"`
	// ID is an optional message identifier for tracking
	ID string `json:"id,omitempty"`
	// Timestamp is the message timestamp
	Timestamp int64 `json:"timestamp,omitempty"`
	// SurfaceID is the surface identifier
	SurfaceID string `json:"surfaceId"`
	// Action is the action name
	Action string `json:"action"`
	// ComponentID is the component that triggered the action
	ComponentID string `json:"componentId,omitempty"`
	// Context contains action context data
	Context map[string]interface{} `json:"context,omitempty"`
	// DataModel is the current data model snapshot
	DataModel map[string]interface{} `json:"dataModel,omitempty"`
}

// MessageType implements the Message interface
func (m *UserActionMessage) MessageType() MessageType {
	return m.Type
}

// ErrorMessage communicates errors (Bidirectional)
type ErrorMessage struct {
	// Type is the message type
	Type MessageType `json:"type"`
	// ID is an optional message identifier for tracking
	ID string `json:"id,omitempty"`
	// Timestamp is the message timestamp
	Timestamp int64 `json:"timestamp,omitempty"`
	// Code is the error code
	Code string `json:"code"`
	// Message is the error message
	Message string `json:"message"`
	// Details contains optional error details
	Details interface{} `json:"details,omitempty"`
}

// MessageType implements the Message interface
func (m *ErrorMessage) MessageType() MessageType {
	return m.Type
}

// PingMessage is a keep-alive ping (Bidirectional)
type PingMessage struct {
	// Type is the message type
	Type MessageType `json:"type"`
	// ID is an optional message identifier for tracking
	ID string `json:"id,omitempty"`
	// Timestamp is the message timestamp
	Timestamp int64 `json:"timestamp,omitempty"`
}

// MessageType implements the Message interface
func (m *PingMessage) MessageType() MessageType {
	return m.Type
}

// PongMessage is a keep-alive pong (Bidirectional)
type PongMessage struct {
	// Type is the message type
	Type MessageType `json:"type"`
	// ID is an optional message identifier for tracking
	ID string `json:"id,omitempty"`
	// Timestamp is the message timestamp
	Timestamp int64 `json:"timestamp,omitempty"`
}

// MessageType implements the Message interface
func (m *PongMessage) MessageType() MessageType {
	return m.Type
}
