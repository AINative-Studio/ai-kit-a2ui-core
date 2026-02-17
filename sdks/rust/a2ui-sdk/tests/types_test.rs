/// A2UI Type Definitions Tests
///
/// Comprehensive tests for all A2UI protocol message types.
use a2ui_sdk::*;
use serde_json::json;
use std::collections::HashMap;

#[test]
fn test_update_components_message() {
    let msg = UpdateComponentsMessage {
        message_type: MessageType::UpdateComponents,
        surface_id: "test-surface".to_string(),
        updates: vec![ComponentUpdate {
            id: "btn-1".to_string(),
            operation: Operation::Update,
            component: Some(Component {
                component_type: "button".to_string(),
                id: "btn-1".to_string(),
                properties: HashMap::new(),
                children: vec![],
            }),
        }],
    };

    assert_eq!(msg.message_type(), MessageType::UpdateComponents);

    let json = serde_json::to_value(&msg).unwrap();
    assert_eq!(json["type"], "updateComponents");
    assert_eq!(json["surfaceId"], "test-surface");
}

#[test]
fn test_update_data_model_message() {
    let msg = UpdateDataModelMessage {
        message_type: MessageType::UpdateDataModel,
        surface_id: "test-surface".to_string(),
        updates: vec![DataUpdate {
            path: "/user/name".to_string(),
            operation: DataOperation::Set,
            value: Some(json!("Alice")),
        }],
    };

    assert_eq!(msg.message_type(), MessageType::UpdateDataModel);

    let json = serde_json::to_value(&msg).unwrap();
    assert_eq!(json["type"], "updateDataModel");
}

#[test]
fn test_user_action_message() {
    let msg = UserActionMessage {
        message_type: MessageType::UserAction,
        surface_id: "test-surface".to_string(),
        action: "submit".to_string(),
        component_id: Some("btn-1".to_string()),
        context: HashMap::new(),
    };

    assert_eq!(msg.message_type(), MessageType::UserAction);

    let json = serde_json::to_value(&msg).unwrap();
    assert_eq!(json["type"], "userAction");
    assert_eq!(json["action"], "submit");
}

#[test]
fn test_error_message() {
    let msg = ErrorMessage {
        message_type: MessageType::Error,
        code: "VALIDATION_ERROR".to_string(),
        message: "Invalid input".to_string(),
        details: HashMap::new(),
    };

    assert_eq!(msg.message_type(), MessageType::Error);

    let json = serde_json::to_value(&msg).unwrap();
    assert_eq!(json["type"], "error");
    assert_eq!(json["code"], "VALIDATION_ERROR");
}

#[test]
fn test_delete_surface_message() {
    let msg = DeleteSurfaceMessage {
        message_type: MessageType::DeleteSurface,
        surface_id: "test-surface".to_string(),
    };

    assert_eq!(msg.message_type(), MessageType::DeleteSurface);

    let json = serde_json::to_value(&msg).unwrap();
    assert_eq!(json["type"], "deleteSurface");
}

#[test]
fn test_ping_message() {
    let msg = PingMessage {
        message_type: MessageType::Ping,
    };

    assert_eq!(msg.message_type(), MessageType::Ping);

    let json = serde_json::to_value(&msg).unwrap();
    assert_eq!(json["type"], "ping");
}

#[test]
fn test_pong_message() {
    let msg = PongMessage {
        message_type: MessageType::Pong,
    };

    assert_eq!(msg.message_type(), MessageType::Pong);

    let json = serde_json::to_value(&msg).unwrap();
    assert_eq!(json["type"], "pong");
}

#[test]
fn test_operation_serialization() {
    let op = Operation::Add;
    let json = serde_json::to_string(&op).unwrap();
    assert_eq!(json, "\"add\"");

    let op = Operation::Update;
    let json = serde_json::to_string(&op).unwrap();
    assert_eq!(json, "\"update\"");

    let op = Operation::Remove;
    let json = serde_json::to_string(&op).unwrap();
    assert_eq!(json, "\"remove\"");
}

#[test]
fn test_data_operation_serialization() {
    let op = DataOperation::Set;
    let json = serde_json::to_string(&op).unwrap();
    assert_eq!(json, "\"set\"");

    let op = DataOperation::Remove;
    let json = serde_json::to_string(&op).unwrap();
    assert_eq!(json, "\"remove\"");
}

#[test]
fn test_message_type_deserialization() {
    let json = "\"createSurface\"";
    let msg_type: MessageType = serde_json::from_str(json).unwrap();
    assert_eq!(msg_type, MessageType::CreateSurface);

    let json = "\"updateComponents\"";
    let msg_type: MessageType = serde_json::from_str(json).unwrap();
    assert_eq!(msg_type, MessageType::UpdateComponents);

    let json = "\"ping\"";
    let msg_type: MessageType = serde_json::from_str(json).unwrap();
    assert_eq!(msg_type, MessageType::Ping);
}

#[test]
fn test_all_message_types_equality() {
    assert_eq!(MessageType::CreateSurface, MessageType::CreateSurface);
    assert_eq!(MessageType::UpdateComponents, MessageType::UpdateComponents);
    assert_eq!(MessageType::UpdateDataModel, MessageType::UpdateDataModel);
    assert_eq!(MessageType::UserAction, MessageType::UserAction);
    assert_eq!(MessageType::Error, MessageType::Error);
    assert_eq!(MessageType::DeleteSurface, MessageType::DeleteSurface);
    assert_eq!(MessageType::Ping, MessageType::Ping);
    assert_eq!(MessageType::Pong, MessageType::Pong);
}

#[test]
fn test_operation_equality() {
    assert_eq!(Operation::Add, Operation::Add);
    assert_eq!(Operation::Update, Operation::Update);
    assert_eq!(Operation::Remove, Operation::Remove);
}

#[test]
fn test_data_operation_equality() {
    assert_eq!(DataOperation::Set, DataOperation::Set);
    assert_eq!(DataOperation::Remove, DataOperation::Remove);
}

#[test]
fn test_component_with_children() {
    let component = Component {
        component_type: "container".to_string(),
        id: "container-1".to_string(),
        properties: HashMap::new(),
        children: vec![
            Component {
                component_type: "button".to_string(),
                id: "btn-1".to_string(),
                properties: HashMap::new(),
                children: vec![],
            }
        ],
    };

    let json = serde_json::to_value(&component).unwrap();
    assert_eq!(json["type"], "container");
    assert!(json["children"].is_array());
    assert_eq!(json["children"][0]["type"], "button");
}

#[test]
fn test_complete_create_surface_roundtrip() {
    let original = CreateSurfaceMessage {
        message_type: MessageType::CreateSurface,
        surface_id: "test".to_string(),
        components: vec![
            Component {
                component_type: "text".to_string(),
                id: "text-1".to_string(),
                properties: {
                    let mut props = HashMap::new();
                    props.insert("value".to_string(), json!("Hello"));
                    props
                },
                children: vec![],
            }
        ],
        data_model: {
            let mut model = HashMap::new();
            model.insert("count".to_string(), json!(0));
            model
        },
    };

    let json = serde_json::to_string(&original).unwrap();
    let deserialized: CreateSurfaceMessage = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.surface_id, "test");
    assert_eq!(deserialized.components.len(), 1);
    assert_eq!(deserialized.data_model.get("count").unwrap(), &json!(0));
}
