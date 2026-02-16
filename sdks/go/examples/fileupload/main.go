package main

import (
	"encoding/json"
	"log"
	"os"
	"os/signal"

	"github.com/ainative/a2ui-go/a2ui"
)

// FileUploadHandler demonstrates handling file upload UI
type FileUploadHandler struct {
	transport *a2ui.Transport
	logger    *log.Logger
}

func NewFileUploadHandler(transport *a2ui.Transport, logger *log.Logger) *FileUploadHandler {
	return &FileUploadHandler{
		transport: transport,
		logger:    logger,
	}
}

func (h *FileUploadHandler) HandleSurface(msg json.RawMessage) error {
	var surface a2ui.CreateSurfaceMessage
	if err := json.Unmarshal(msg, &surface); err != nil {
		return err
	}

	h.logger.Printf("File upload surface created: %s", surface.SurfaceID)

	// Find file upload components
	for _, component := range surface.Components {
		if component.Type == "fileUpload" {
			h.logger.Printf("File upload component found: %s", component.ID)

			// Extract file upload properties
			if props := component.Properties; props != nil {
				if accept, ok := props["accept"].(string); ok {
					h.logger.Printf("  Accepted types: %s", accept)
				}
				if maxSize, ok := props["maxSize"].(float64); ok {
					h.logger.Printf("  Max size: %.0f bytes", maxSize)
				}
			}
		}
	}

	return nil
}

func (h *FileUploadHandler) HandleUserAction(msg json.RawMessage) error {
	var action a2ui.UserActionMessage
	if err := json.Unmarshal(msg, &action); err != nil {
		return err
	}

	if action.Action == "fileSelected" {
		h.logger.Printf("File selected on component: %s", action.ComponentID)

		if context := action.Context; context != nil {
			if fileName, ok := context["fileName"].(string); ok {
				h.logger.Printf("  File: %s", fileName)
			}
			if fileSize, ok := context["fileSize"].(float64); ok {
				h.logger.Printf("  Size: %.0f bytes", fileSize)
			}
		}

		// Send acknowledgment
		response := &a2ui.UserActionMessage{
			Type:        a2ui.MessageTypeUserAction,
			SurfaceID:   action.SurfaceID,
			Action:      "fileProcessing",
			ComponentID: action.ComponentID,
			Context: map[string]interface{}{
				"status": "processing",
			},
		}

		if err := h.transport.Send(response); err != nil {
			h.logger.Printf("Failed to send response: %v", err)
		}
	}

	return nil
}

func main() {
	logger := log.New(os.Stdout, "[FileUpload] ", log.LstdFlags)

	options := a2ui.DefaultTransportOptions()
	options.Logger = logger

	transport := a2ui.NewTransport("ws://localhost:8000/upload", options)

	handler := NewFileUploadHandler(transport, logger)

	// Register handlers
	transport.On("createSurface", handler.HandleSurface)
	transport.On("userAction", handler.HandleUserAction)

	// Event handlers
	transport.OnEvent("connect", func(data interface{}) {
		logger.Println("Connected to file upload agent")

		// Request file upload UI
		request := &a2ui.UserActionMessage{
			Type:      a2ui.MessageTypeUserAction,
			SurfaceID: "upload-surface",
			Action:    "requestUploadUI",
			Context: map[string]interface{}{
				"accept":  ".jpg,.png,.pdf",
				"maxSize": 10485760, // 10MB
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

	logger.Println("File upload client running... Press Ctrl+C to exit")
	<-interrupt

	logger.Println("Shutting down...")
	transport.Close()
}
