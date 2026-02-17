package main

import (
	"encoding/json"
	"log"
	"os"
	"os/signal"

	"github.com/ainative/a2ui-go/a2ui"
)

// MCPBridge demonstrates A2UI + MCP integration
type MCPBridge struct {
	transport *a2ui.Transport
	logger    *log.Logger
	dataModel map[string]interface{}
	jp        *a2ui.JSONPointer
}

func NewMCPBridge(transport *a2ui.Transport, logger *log.Logger) *MCPBridge {
	return &MCPBridge{
		transport: transport,
		logger:    logger,
		dataModel: make(map[string]interface{}),
		jp:        &a2ui.JSONPointer{},
	}
}

func (b *MCPBridge) HandleCreateSurface(msg json.RawMessage) error {
	var surface a2ui.CreateSurfaceMessage
	if err := json.Unmarshal(msg, &surface); err != nil {
		return err
	}

	b.logger.Printf("MCP surface created: %s", surface.SurfaceID)

	// Store initial data model
	if surface.DataModel != nil {
		b.dataModel = surface.DataModel
		b.logger.Printf("Initial data model: %+v", b.dataModel)
	}

	return nil
}

func (b *MCPBridge) HandleDataModelUpdate(msg json.RawMessage) error {
	var update a2ui.UpdateDataModelMessage
	if err := json.Unmarshal(msg, &update); err != nil {
		return err
	}

	b.logger.Printf("Data model updates: %d", len(update.Updates))

	// Apply updates to local data model
	for _, u := range update.Updates {
		switch u.Operation {
		case a2ui.DataOperationSet:
			if err := b.jp.Set(b.dataModel, u.Path, u.Value); err != nil {
				b.logger.Printf("Failed to set %s: %v", u.Path, err)
			} else {
				b.logger.Printf("Set %s = %v", u.Path, u.Value)
			}

		case a2ui.DataOperationRemove:
			if removed, err := b.jp.Remove(b.dataModel, u.Path); err != nil {
				b.logger.Printf("Failed to remove %s: %v", u.Path, err)
			} else if removed {
				b.logger.Printf("Removed %s", u.Path)
			}
		}
	}

	return nil
}

func (b *MCPBridge) HandleUserAction(msg json.RawMessage) error {
	var action a2ui.UserActionMessage
	if err := json.Unmarshal(msg, &action); err != nil {
		return err
	}

	b.logger.Printf("User action: %s on %s", action.Action, action.ComponentID)

	// Handle MCP-specific actions
	switch action.Action {
	case "mcpQuery":
		b.handleMCPQuery(action)

	case "mcpUpdate":
		b.handleMCPUpdate(action)

	case "mcpDelete":
		b.handleMCPDelete(action)

	default:
		b.logger.Printf("Unknown action: %s", action.Action)
	}

	return nil
}

func (b *MCPBridge) handleMCPQuery(action a2ui.UserActionMessage) {
	b.logger.Println("Executing MCP query...")

	// Simulate MCP query
	result := map[string]interface{}{
		"status": "success",
		"data": []interface{}{
			map[string]interface{}{"id": 1, "name": "Item 1"},
			map[string]interface{}{"id": 2, "name": "Item 2"},
		},
	}

	// Send result back via data model update
	response := &a2ui.UpdateDataModelMessage{
		Type:      a2ui.MessageTypeUpdateDataModel,
		SurfaceID: action.SurfaceID,
		Updates: []a2ui.DataUpdate{
			{
				Path:      "/queryResult",
				Operation: a2ui.DataOperationSet,
				Value:     result,
			},
		},
	}

	if err := b.transport.Send(response); err != nil {
		b.logger.Printf("Failed to send query result: %v", err)
	}
}

func (b *MCPBridge) handleMCPUpdate(action a2ui.UserActionMessage) {
	b.logger.Println("Executing MCP update...")

	// Extract update data from context
	if context := action.Context; context != nil {
		if data, ok := context["updateData"]; ok {
			b.logger.Printf("Update data: %+v", data)

			// Simulate MCP update
			// In real implementation, this would call MCP server

			// Send success response
			response := &a2ui.UserActionMessage{
				Type:      a2ui.MessageTypeUserAction,
				SurfaceID: action.SurfaceID,
				Action:    "mcpUpdateComplete",
				Context: map[string]interface{}{
					"status":  "success",
					"message": "Update completed",
				},
			}

			if err := b.transport.Send(response); err != nil {
				b.logger.Printf("Failed to send update response: %v", err)
			}
		}
	}
}

func (b *MCPBridge) handleMCPDelete(action a2ui.UserActionMessage) {
	b.logger.Println("Executing MCP delete...")

	// Extract ID from context
	if context := action.Context; context != nil {
		if id, ok := context["id"]; ok {
			b.logger.Printf("Deleting ID: %v", id)

			// Simulate MCP delete
			// In real implementation, this would call MCP server

			// Send success response
			response := &a2ui.UserActionMessage{
				Type:      a2ui.MessageTypeUserAction,
				SurfaceID: action.SurfaceID,
				Action:    "mcpDeleteComplete",
				Context: map[string]interface{}{
					"status": "success",
					"id":     id,
				},
			}

			if err := b.transport.Send(response); err != nil {
				b.logger.Printf("Failed to send delete response: %v", err)
			}
		}
	}
}

func main() {
	logger := log.New(os.Stdout, "[MCP] ", log.LstdFlags)

	options := a2ui.DefaultTransportOptions()
	options.Logger = logger

	transport := a2ui.NewTransport("ws://localhost:8000/mcp", options)

	bridge := NewMCPBridge(transport, logger)

	// Register handlers
	transport.On("createSurface", bridge.HandleCreateSurface)
	transport.On("updateDataModel", bridge.HandleDataModelUpdate)
	transport.On("userAction", bridge.HandleUserAction)

	// Event handlers
	transport.OnEvent("connect", func(data interface{}) {
		logger.Println("Connected to MCP agent")

		// Request MCP UI
		request := &a2ui.UserActionMessage{
			Type:      a2ui.MessageTypeUserAction,
			SurfaceID: "mcp-surface",
			Action:    "requestMCPUI",
			Context: map[string]interface{}{
				"features": []string{"query", "update", "delete"},
			},
		}

		if err := transport.Send(request); err != nil {
			logger.Printf("Failed to request UI: %v", err)
		}
	})

	transport.OnEvent("error", func(data interface{}) {
		logger.Printf("Error: %v", data)
	})

	// Connect
	if err := transport.Connect(); err != nil {
		logger.Fatalf("Failed to connect: %v", err)
	}

	// Wait for interrupt
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)

	logger.Println("MCP bridge running... Press Ctrl+C to exit")
	<-interrupt

	logger.Println("Shutting down...")
	transport.Close()
}
