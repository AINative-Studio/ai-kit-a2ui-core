package main

import (
	"encoding/json"
	"log"
	"os"
	"os/signal"

	"github.com/ainative/a2ui-go/a2ui"
)

func main() {
	// Create logger
	logger := log.New(os.Stdout, "[A2UI] ", log.LstdFlags)

	// Create transport with custom options
	options := &a2ui.TransportOptions{
		AutoReconnect:        true,
		ReconnectDelay:       3000,
		MaxReconnectAttempts: 5,
		PingInterval:         30000,
		PongTimeout:          5000,
		Logger:               logger,
	}

	transport := a2ui.NewTransport("ws://localhost:8000", options)

	// Register message handlers
	transport.On("createSurface", func(msg json.RawMessage) error {
		var surface a2ui.CreateSurfaceMessage
		if err := json.Unmarshal(msg, &surface); err != nil {
			return err
		}

		logger.Printf("Surface created: %s", surface.SurfaceID)
		logger.Printf("Components: %d", len(surface.Components))
		return nil
	})

	transport.On("updateComponents", func(msg json.RawMessage) error {
		var update a2ui.UpdateComponentsMessage
		if err := json.Unmarshal(msg, &update); err != nil {
			return err
		}

		logger.Printf("Components updated: %d changes", len(update.Updates))
		for _, u := range update.Updates {
			logger.Printf("  - %s: %s", u.Operation, u.ID)
		}
		return nil
	})

	transport.On("updateDataModel", func(msg json.RawMessage) error {
		var update a2ui.UpdateDataModelMessage
		if err := json.Unmarshal(msg, &update); err != nil {
			return err
		}

		logger.Printf("Data model updated: %d changes", len(update.Updates))
		for _, u := range update.Updates {
			logger.Printf("  - %s: %s = %v", u.Operation, u.Path, u.Value)
		}
		return nil
	})

	// Register event handlers
	transport.OnEvent("connect", func(data interface{}) {
		logger.Println("Connected!")

		// Send a user action
		action := &a2ui.UserActionMessage{
			Type:      a2ui.MessageTypeUserAction,
			SurfaceID: "main-surface",
			Action:    "ready",
			Context: map[string]interface{}{
				"clientVersion": "1.0.0",
			},
		}

		if err := transport.Send(action); err != nil {
			logger.Printf("Failed to send action: %v", err)
		}
	})

	transport.OnEvent("disconnect", func(data interface{}) {
		logger.Println("Disconnected")
	})

	transport.OnEvent("error", func(data interface{}) {
		logger.Printf("Error: %v", data)
	})

	transport.OnEvent("statusChange", func(data interface{}) {
		logger.Printf("Status: %v", data)
	})

	transport.OnEvent("reconnecting", func(data interface{}) {
		logger.Printf("Reconnecting (attempt %v)...", data)
	})

	// Connect to the agent
	if err := transport.Connect(); err != nil {
		logger.Fatalf("Failed to connect: %v", err)
	}

	// Wait for interrupt signal
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)

	logger.Println("Running... Press Ctrl+C to exit")
	<-interrupt

	logger.Println("Shutting down...")
	transport.Close()
}
