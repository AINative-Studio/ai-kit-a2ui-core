package a2ui_test

import (
	"encoding/json"
	"testing"

	"github.com/ainative/a2ui-go/a2ui"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestComponentMarshaling(t *testing.T) {
	t.Run("marshal component to JSON", func(t *testing.T) {
		component := a2ui.Component{
			Type: "button",
			ID:   "btn-1",
			Properties: map[string]interface{}{
				"label":   "Click me",
				"variant": "primary",
			},
			Children: []string{"child-1", "child-2"},
		}

		data, err := json.Marshal(component)
		require.NoError(t, err)

		var unmarshaled map[string]interface{}
		err = json.Unmarshal(data, &unmarshaled)
		require.NoError(t, err)

		assert.Equal(t, "button", unmarshaled["type"])
		assert.Equal(t, "btn-1", unmarshaled["id"])
	})

	t.Run("unmarshal component from JSON", func(t *testing.T) {
		jsonData := `{
			"type": "textField",
			"id": "field-1",
			"properties": {
				"label": "Name",
				"placeholder": "Enter your name"
			}
		}`

		var component a2ui.Component
		err := json.Unmarshal([]byte(jsonData), &component)
		require.NoError(t, err)

		assert.Equal(t, "textField", component.Type)
		assert.Equal(t, "field-1", component.ID)
		assert.Equal(t, "Name", component.Properties["label"])
	})
}

func TestCreateSurfaceMessage(t *testing.T) {
	t.Run("create valid createSurface message", func(t *testing.T) {
		msg := &a2ui.CreateSurfaceMessage{
			Type:      a2ui.MessageTypeCreateSurface,
			SurfaceID: "surface-1",
			Components: []a2ui.Component{
				{
					Type: "card",
					ID:   "card-1",
				},
			},
			DataModel: map[string]interface{}{
				"user": map[string]interface{}{
					"name": "Alice",
				},
			},
		}

		assert.Equal(t, a2ui.MessageTypeCreateSurface, msg.MessageType())
		assert.Equal(t, "surface-1", msg.SurfaceID)
		assert.Equal(t, 1, len(msg.Components))
	})

	t.Run("marshal createSurface message to JSON", func(t *testing.T) {
		msg := &a2ui.CreateSurfaceMessage{
			Type:      a2ui.MessageTypeCreateSurface,
			SurfaceID: "surface-1",
			Components: []a2ui.Component{
				{
					Type: "button",
					ID:   "btn-1",
					Properties: map[string]interface{}{
						"label": "Submit",
					},
				},
			},
			DataModel: map[string]interface{}{
				"formData": map[string]interface{}{},
			},
		}

		data, err := json.Marshal(msg)
		require.NoError(t, err)

		var unmarshaled map[string]interface{}
		err = json.Unmarshal(data, &unmarshaled)
		require.NoError(t, err)

		assert.Equal(t, "createSurface", unmarshaled["type"])
		assert.Equal(t, "surface-1", unmarshaled["surfaceId"])
		assert.NotNil(t, unmarshaled["components"])
		assert.NotNil(t, unmarshaled["dataModel"])
	})

	t.Run("unmarshal createSurface message from JSON", func(t *testing.T) {
		jsonData := `{
			"type": "createSurface",
			"surfaceId": "surface-2",
			"components": [
				{
					"type": "text",
					"id": "text-1",
					"properties": {
						"content": "Hello World"
					}
				}
			],
			"dataModel": {
				"greeting": "Hello"
			}
		}`

		var msg a2ui.CreateSurfaceMessage
		err := json.Unmarshal([]byte(jsonData), &msg)
		require.NoError(t, err)

		assert.Equal(t, a2ui.MessageTypeCreateSurface, msg.Type)
		assert.Equal(t, "surface-2", msg.SurfaceID)
		assert.Equal(t, 1, len(msg.Components))
		assert.Equal(t, "text", msg.Components[0].Type)
		assert.Equal(t, "Hello", msg.DataModel["greeting"])
	})
}

func TestUpdateComponentsMessage(t *testing.T) {
	t.Run("create update message with add operation", func(t *testing.T) {
		msg := &a2ui.UpdateComponentsMessage{
			Type:      a2ui.MessageTypeUpdateComponents,
			SurfaceID: "surface-1",
			Updates: []a2ui.ComponentUpdate{
				{
					ID:        "btn-1",
					Operation: a2ui.OperationAdd,
					Component: &a2ui.Component{
						Type: "button",
						ID:   "btn-1",
					},
				},
			},
		}

		assert.Equal(t, a2ui.MessageTypeUpdateComponents, msg.MessageType())
		assert.Equal(t, 1, len(msg.Updates))
		assert.Equal(t, a2ui.OperationAdd, msg.Updates[0].Operation)
	})

	t.Run("create update message with remove operation", func(t *testing.T) {
		msg := &a2ui.UpdateComponentsMessage{
			Type:      a2ui.MessageTypeUpdateComponents,
			SurfaceID: "surface-1",
			Updates: []a2ui.ComponentUpdate{
				{
					ID:        "btn-1",
					Operation: a2ui.OperationRemove,
				},
			},
		}

		assert.Equal(t, a2ui.OperationRemove, msg.Updates[0].Operation)
		assert.Nil(t, msg.Updates[0].Component)
	})

	t.Run("marshal and unmarshal update message", func(t *testing.T) {
		msg := &a2ui.UpdateComponentsMessage{
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

		data, err := json.Marshal(msg)
		require.NoError(t, err)

		var unmarshaled a2ui.UpdateComponentsMessage
		err = json.Unmarshal(data, &unmarshaled)
		require.NoError(t, err)

		assert.Equal(t, a2ui.MessageTypeUpdateComponents, unmarshaled.Type)
		assert.Equal(t, "surface-1", unmarshaled.SurfaceID)
		assert.Equal(t, 1, len(unmarshaled.Updates))
		assert.Equal(t, "btn-1", unmarshaled.Updates[0].ID)
	})
}

func TestUpdateDataModelMessage(t *testing.T) {
	t.Run("create data model update with set operation", func(t *testing.T) {
		msg := &a2ui.UpdateDataModelMessage{
			Type:      a2ui.MessageTypeUpdateDataModel,
			SurfaceID: "surface-1",
			Updates: []a2ui.DataUpdate{
				{
					Path:      "/user/name",
					Operation: a2ui.DataOperationSet,
					Value:     "Alice",
				},
			},
		}

		assert.Equal(t, a2ui.MessageTypeUpdateDataModel, msg.MessageType())
		assert.Equal(t, 1, len(msg.Updates))
		assert.Equal(t, "/user/name", msg.Updates[0].Path)
		assert.Equal(t, "Alice", msg.Updates[0].Value)
	})

	t.Run("create data model update with remove operation", func(t *testing.T) {
		msg := &a2ui.UpdateDataModelMessage{
			Type:      a2ui.MessageTypeUpdateDataModel,
			SurfaceID: "surface-1",
			Updates: []a2ui.DataUpdate{
				{
					Path:      "/user/age",
					Operation: a2ui.DataOperationRemove,
				},
			},
		}

		assert.Equal(t, a2ui.DataOperationRemove, msg.Updates[0].Operation)
		assert.Nil(t, msg.Updates[0].Value)
	})

	t.Run("marshal and unmarshal data model update", func(t *testing.T) {
		msg := &a2ui.UpdateDataModelMessage{
			Type:      a2ui.MessageTypeUpdateDataModel,
			SurfaceID: "surface-1",
			Updates: []a2ui.DataUpdate{
				{
					Path:      "/items/-",
					Operation: a2ui.DataOperationSet,
					Value:     "new item",
				},
			},
		}

		data, err := json.Marshal(msg)
		require.NoError(t, err)

		var unmarshaled a2ui.UpdateDataModelMessage
		err = json.Unmarshal(data, &unmarshaled)
		require.NoError(t, err)

		assert.Equal(t, "/items/-", unmarshaled.Updates[0].Path)
		assert.Equal(t, "new item", unmarshaled.Updates[0].Value)
	})
}

func TestUserActionMessage(t *testing.T) {
	t.Run("create user action message", func(t *testing.T) {
		msg := &a2ui.UserActionMessage{
			Type:        a2ui.MessageTypeUserAction,
			SurfaceID:   "surface-1",
			Action:      "submit",
			ComponentID: "btn-1",
			Context: map[string]interface{}{
				"formData": map[string]interface{}{
					"name": "Alice",
				},
			},
		}

		assert.Equal(t, a2ui.MessageTypeUserAction, msg.MessageType())
		assert.Equal(t, "submit", msg.Action)
		assert.Equal(t, "btn-1", msg.ComponentID)
	})

	t.Run("marshal and unmarshal user action", func(t *testing.T) {
		msg := &a2ui.UserActionMessage{
			Type:        a2ui.MessageTypeUserAction,
			SurfaceID:   "surface-1",
			Action:      "click",
			ComponentID: "btn-submit",
			Context: map[string]interface{}{
				"timestamp": 1234567890,
			},
			DataModel: map[string]interface{}{
				"currentUser": "Alice",
			},
		}

		data, err := json.Marshal(msg)
		require.NoError(t, err)

		var unmarshaled a2ui.UserActionMessage
		err = json.Unmarshal(data, &unmarshaled)
		require.NoError(t, err)

		assert.Equal(t, "click", unmarshaled.Action)
		assert.Equal(t, "btn-submit", unmarshaled.ComponentID)
		assert.NotNil(t, unmarshaled.Context)
		assert.NotNil(t, unmarshaled.DataModel)
	})
}

func TestErrorMessage(t *testing.T) {
	t.Run("create error message", func(t *testing.T) {
		msg := &a2ui.ErrorMessage{
			Type:    a2ui.MessageTypeError,
			Code:    "VALIDATION_ERROR",
			Message: "Invalid input",
			Details: map[string]interface{}{
				"field":  "email",
				"reason": "invalid format",
			},
		}

		assert.Equal(t, a2ui.MessageTypeError, msg.MessageType())
		assert.Equal(t, "VALIDATION_ERROR", msg.Code)
		assert.Equal(t, "Invalid input", msg.Message)
	})

	t.Run("marshal and unmarshal error message", func(t *testing.T) {
		msg := &a2ui.ErrorMessage{
			Type:    a2ui.MessageTypeError,
			Code:    "AUTH_ERROR",
			Message: "Unauthorized",
		}

		data, err := json.Marshal(msg)
		require.NoError(t, err)

		var unmarshaled a2ui.ErrorMessage
		err = json.Unmarshal(data, &unmarshaled)
		require.NoError(t, err)

		assert.Equal(t, "AUTH_ERROR", unmarshaled.Code)
		assert.Equal(t, "Unauthorized", unmarshaled.Message)
	})
}

func TestPingPongMessages(t *testing.T) {
	t.Run("create ping message", func(t *testing.T) {
		msg := &a2ui.PingMessage{
			Type: a2ui.MessageTypePing,
		}

		assert.Equal(t, a2ui.MessageTypePing, msg.MessageType())
	})

	t.Run("create pong message", func(t *testing.T) {
		msg := &a2ui.PongMessage{
			Type: a2ui.MessageTypePong,
		}

		assert.Equal(t, a2ui.MessageTypePong, msg.MessageType())
	})

	t.Run("marshal and unmarshal ping/pong", func(t *testing.T) {
		ping := &a2ui.PingMessage{Type: a2ui.MessageTypePing}
		pong := &a2ui.PongMessage{Type: a2ui.MessageTypePong}

		pingData, err := json.Marshal(ping)
		require.NoError(t, err)

		pongData, err := json.Marshal(pong)
		require.NoError(t, err)

		var unmarshaledPing a2ui.PingMessage
		err = json.Unmarshal(pingData, &unmarshaledPing)
		require.NoError(t, err)
		assert.Equal(t, a2ui.MessageTypePing, unmarshaledPing.Type)

		var unmarshaledPong a2ui.PongMessage
		err = json.Unmarshal(pongData, &unmarshaledPong)
		require.NoError(t, err)
		assert.Equal(t, a2ui.MessageTypePong, unmarshaledPong.Type)
	})
}

func TestDeleteSurfaceMessage(t *testing.T) {
	t.Run("create delete surface message", func(t *testing.T) {
		msg := &a2ui.DeleteSurfaceMessage{
			Type:      a2ui.MessageTypeDeleteSurface,
			SurfaceID: "surface-1",
		}

		assert.Equal(t, a2ui.MessageTypeDeleteSurface, msg.MessageType())
		assert.Equal(t, "surface-1", msg.SurfaceID)
	})

	t.Run("marshal and unmarshal delete surface", func(t *testing.T) {
		msg := &a2ui.DeleteSurfaceMessage{
			Type:      a2ui.MessageTypeDeleteSurface,
			SurfaceID: "surface-2",
		}

		data, err := json.Marshal(msg)
		require.NoError(t, err)

		var unmarshaled a2ui.DeleteSurfaceMessage
		err = json.Unmarshal(data, &unmarshaled)
		require.NoError(t, err)

		assert.Equal(t, "surface-2", unmarshaled.SurfaceID)
	})
}
