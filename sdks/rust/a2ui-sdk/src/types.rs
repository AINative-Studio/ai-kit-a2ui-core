//! A2UI Protocol Message Types.
//!
//! Type definitions for all A2UI protocol v0.9-v0.12 messages.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

/// A2UI protocol message types.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum MessageType {
    /// Create a new surface (Agent → UI)
    CreateSurface,
    /// Update components in a surface (Agent → UI)
    UpdateComponents,
    /// Update data model (Agent → UI)
    UpdateDataModel,
    /// User action (UI → Agent)
    UserAction,
    /// Error message (Bidirectional)
    Error,
    /// Delete surface (Agent → UI)
    DeleteSurface,
    /// Ping (Bidirectional)
    Ping,
    /// Pong (Bidirectional)
    Pong,
}

/// Base trait for all A2UI messages.
pub trait Message: Serialize + Send + Sync {
    /// Get the message type.
    fn message_type(&self) -> MessageType;
}

/// Component operation types.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Operation {
    /// Add a new component
    Add,
    /// Update an existing component
    Update,
    /// Remove a component
    Remove,
}

/// Data model operation types.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DataOperation {
    /// Set a value
    Set,
    /// Remove a value
    Remove,
}

/// UI Component definition.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Component {
    /// Component type (e.g., "button", "input", "text")
    #[serde(rename = "type")]
    pub component_type: String,
    /// Unique component ID
    pub id: String,
    /// Component properties
    #[serde(default)]
    pub properties: HashMap<String, Value>,
    /// Child components
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub children: Vec<Component>,
}

/// Component update operation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentUpdate {
    /// Component ID
    pub id: String,
    /// Operation type
    pub operation: Operation,
    /// Component data (for add/update)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub component: Option<Component>,
}

/// Data model update operation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataUpdate {
    /// JSON Pointer path
    pub path: String,
    /// Operation type
    pub operation: DataOperation,
    /// Value (for set operation)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<Value>,
}

/// CreateSurface message (Agent → UI).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSurfaceMessage {
    /// Message type
    #[serde(rename = "type")]
    pub message_type: MessageType,
    /// Surface ID
    pub surface_id: String,
    /// Initial components
    #[serde(default)]
    pub components: Vec<Component>,
    /// Initial data model
    #[serde(default)]
    pub data_model: HashMap<String, Value>,
}

impl Message for CreateSurfaceMessage {
    fn message_type(&self) -> MessageType {
        MessageType::CreateSurface
    }
}

/// UpdateComponents message (Agent → UI).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateComponentsMessage {
    /// Message type
    #[serde(rename = "type")]
    pub message_type: MessageType,
    /// Surface ID
    pub surface_id: String,
    /// Component updates
    pub updates: Vec<ComponentUpdate>,
}

impl Message for UpdateComponentsMessage {
    fn message_type(&self) -> MessageType {
        MessageType::UpdateComponents
    }
}

/// UpdateDataModel message (Agent → UI).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDataModelMessage {
    /// Message type
    #[serde(rename = "type")]
    pub message_type: MessageType,
    /// Surface ID
    pub surface_id: String,
    /// Data updates
    pub updates: Vec<DataUpdate>,
}

impl Message for UpdateDataModelMessage {
    fn message_type(&self) -> MessageType {
        MessageType::UpdateDataModel
    }
}

/// UserAction message (UI → Agent).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserActionMessage {
    /// Message type
    #[serde(rename = "type")]
    pub message_type: MessageType,
    /// Surface ID
    pub surface_id: String,
    /// Action name
    pub action: String,
    /// Component ID (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub component_id: Option<String>,
    /// Action context data
    #[serde(default)]
    pub context: HashMap<String, Value>,
}

impl Message for UserActionMessage {
    fn message_type(&self) -> MessageType {
        MessageType::UserAction
    }
}

/// Error message (Bidirectional).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorMessage {
    /// Message type
    #[serde(rename = "type")]
    pub message_type: MessageType,
    /// Error code
    pub code: String,
    /// Error message
    pub message: String,
    /// Additional error details
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    pub details: HashMap<String, Value>,
}

impl Message for ErrorMessage {
    fn message_type(&self) -> MessageType {
        MessageType::Error
    }
}

/// DeleteSurface message (Agent → UI).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteSurfaceMessage {
    /// Message type
    #[serde(rename = "type")]
    pub message_type: MessageType,
    /// Surface ID
    pub surface_id: String,
}

impl Message for DeleteSurfaceMessage {
    fn message_type(&self) -> MessageType {
        MessageType::DeleteSurface
    }
}

/// Ping message (Bidirectional).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PingMessage {
    /// Message type
    #[serde(rename = "type")]
    pub message_type: MessageType,
}

impl Message for PingMessage {
    fn message_type(&self) -> MessageType {
        MessageType::Ping
    }
}

/// Pong message (Bidirectional).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PongMessage {
    /// Message type
    #[serde(rename = "type")]
    pub message_type: MessageType,
}

impl Message for PongMessage {
    fn message_type(&self) -> MessageType {
        MessageType::Pong
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_message_type_serialization() {
        let msg_type = MessageType::CreateSurface;
        let json = serde_json::to_string(&msg_type).unwrap();
        assert_eq!(json, "\"createSurface\"");
    }

    #[test]
    fn test_create_surface_serialization() {
        let msg = CreateSurfaceMessage {
            message_type: MessageType::CreateSurface,
            surface_id: "test-surface".to_string(),
            components: vec![],
            data_model: HashMap::new(),
        };

        let json = serde_json::to_value(&msg).unwrap();
        assert_eq!(json["type"], "createSurface");
        assert_eq!(json["surfaceId"], "test-surface");
    }

    #[test]
    fn test_component_serialization() {
        let component = Component {
            component_type: "button".to_string(),
            id: "btn-1".to_string(),
            properties: {
                let mut props = HashMap::new();
                props.insert("label".to_string(), json!("Click me"));
                props
            },
            children: vec![],
        };

        let json = serde_json::to_value(&component).unwrap();
        assert_eq!(json["type"], "button");
        assert_eq!(json["id"], "btn-1");
        assert_eq!(json["properties"]["label"], "Click me");
    }
}
