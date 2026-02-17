package a2ui

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// TransportStatus represents the connection status
type TransportStatus string

const (
	// StatusDisconnected means not connected
	StatusDisconnected TransportStatus = "disconnected"
	// StatusConnecting means connection in progress
	StatusConnecting TransportStatus = "connecting"
	// StatusConnected means connected and ready
	StatusConnected TransportStatus = "connected"
	// StatusError means error state
	StatusError TransportStatus = "error"
)

// TransportOptions configures the transport behavior
type TransportOptions struct {
	// AutoReconnect enables automatic reconnection on connection loss
	AutoReconnect bool
	// ReconnectDelay is the delay between reconnection attempts (default: 3s)
	ReconnectDelay time.Duration
	// MaxReconnectAttempts limits reconnection attempts (0 = infinite)
	MaxReconnectAttempts int
	// PingInterval is the interval between ping messages (0 = disabled)
	PingInterval time.Duration
	// PongTimeout is the timeout for pong responses (default: 5s)
	PongTimeout time.Duration
	// Logger for transport events (optional)
	Logger *log.Logger
}

// DefaultTransportOptions returns default transport options
func DefaultTransportOptions() *TransportOptions {
	return &TransportOptions{
		AutoReconnect:        true,
		ReconnectDelay:       3 * time.Second,
		MaxReconnectAttempts: 5,
		PingInterval:         30 * time.Second,
		PongTimeout:          5 * time.Second,
	}
}

// MessageHandler is a function that handles A2UI messages
type MessageHandler func(message json.RawMessage) error

// EventHandler is a function that handles transport events
type EventHandler func(data interface{})

// Transport handles WebSocket communication with A2UI agents
type Transport struct {
	url     string
	options *TransportOptions

	// Connection state
	conn              *websocket.Conn
	status            TransportStatus
	reconnectAttempts int
	mu                sync.RWMutex
	ctx               context.Context
	cancel            context.CancelFunc

	// Message handlers (by message type)
	handlers   map[string][]MessageHandler
	handlersMu sync.RWMutex

	// Event handlers
	eventHandlers   map[string][]EventHandler
	eventHandlersMu sync.RWMutex

	// Timers
	pingTimer *time.Timer
	pongTimer *time.Timer
}

// NewTransport creates a new A2UI transport
func NewTransport(url string, options *TransportOptions) *Transport {
	if options == nil {
		options = DefaultTransportOptions()
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &Transport{
		url:           url,
		options:       options,
		status:        StatusDisconnected,
		handlers:      make(map[string][]MessageHandler),
		eventHandlers: make(map[string][]EventHandler),
		ctx:           ctx,
		cancel:        cancel,
	}
}

// Connect establishes the WebSocket connection
func (t *Transport) Connect() error {
	t.mu.Lock()
	if t.status == StatusConnected || t.status == StatusConnecting {
		t.mu.Unlock()
		return nil
	}
	t.status = StatusConnecting
	t.mu.Unlock()

	t.emit("statusChange", t.status)

	dialer := websocket.DefaultDialer
	conn, _, err := dialer.Dial(t.url, nil)
	if err != nil {
		t.mu.Lock()
		t.status = StatusError
		t.mu.Unlock()
		t.emit("statusChange", t.status)
		t.emit("error", err)
		return fmt.Errorf("failed to connect: %w", err)
	}

	t.mu.Lock()
	t.conn = conn
	t.status = StatusConnected
	t.reconnectAttempts = 0
	t.mu.Unlock()

	t.emit("statusChange", t.status)
	t.emit("connect", nil)

	// Start message receiver
	go t.receiveLoop()

	// Start ping/pong if enabled
	if t.options.PingInterval > 0 {
		t.startPing()
	}

	t.logf("Connected to %s", t.url)
	return nil
}

// Disconnect closes the WebSocket connection
func (t *Transport) Disconnect() error {
	t.mu.Lock()
	defer t.mu.Unlock()

	if t.conn != nil {
		err := t.conn.Close()
		t.conn = nil
		t.status = StatusDisconnected
		t.emit("statusChange", t.status)
		t.emit("disconnect", nil)
		t.logf("Disconnected from %s", t.url)
		return err
	}

	return nil
}

// Close permanently closes the transport and cancels all operations
func (t *Transport) Close() error {
	t.cancel()
	return t.Disconnect()
}

// Send sends a message to the agent
func (t *Transport) Send(message Message) error {
	t.mu.RLock()
	conn := t.conn
	status := t.status
	t.mu.RUnlock()

	if status != StatusConnected || conn == nil {
		return errors.New("not connected")
	}

	data, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	err = conn.WriteMessage(websocket.TextMessage, data)
	if err != nil {
		return fmt.Errorf("failed to send message: %w", err)
	}

	return nil
}

// On registers a message handler for a specific message type
func (t *Transport) On(messageType string, handler MessageHandler) {
	t.handlersMu.Lock()
	defer t.handlersMu.Unlock()

	t.handlers[messageType] = append(t.handlers[messageType], handler)
}

// OnEvent registers an event handler
// Events: "connect", "disconnect", "error", "statusChange", "reconnecting"
func (t *Transport) OnEvent(event string, handler EventHandler) {
	t.eventHandlersMu.Lock()
	defer t.eventHandlersMu.Unlock()

	t.eventHandlers[event] = append(t.eventHandlers[event], handler)
}

// Status returns the current connection status
func (t *Transport) Status() TransportStatus {
	t.mu.RLock()
	defer t.mu.RUnlock()
	return t.status
}

// IsConnected returns true if connected
func (t *Transport) IsConnected() bool {
	return t.Status() == StatusConnected
}

// receiveLoop handles incoming messages
func (t *Transport) receiveLoop() {
	for {
		select {
		case <-t.ctx.Done():
			return
		default:
			t.mu.RLock()
			conn := t.conn
			t.mu.RUnlock()

			if conn == nil {
				return
			}

			_, message, err := conn.ReadMessage()
			if err != nil {
				t.logf("Read error: %v", err)
				t.handleDisconnect()
				return
			}

			// Parse message type
			var baseMsg struct {
				Type string `json:"type"`
			}
			if err := json.Unmarshal(message, &baseMsg); err != nil {
				t.emit("error", fmt.Errorf("failed to parse message: %w", err))
				continue
			}

			// Handle pong specially
			if baseMsg.Type == "pong" {
				t.handlePong()
				continue
			}

			// Call registered handlers
			t.handlersMu.RLock()
			handlers := t.handlers[baseMsg.Type]
			t.handlersMu.RUnlock()

			for _, handler := range handlers {
				if err := handler(json.RawMessage(message)); err != nil {
					t.emit("error", fmt.Errorf("handler error for %s: %w", baseMsg.Type, err))
				}
			}

			// Also emit to generic "message" handlers
			t.handlersMu.RLock()
			messageHandlers := t.handlers["message"]
			t.handlersMu.RUnlock()

			for _, handler := range messageHandlers {
				if err := handler(json.RawMessage(message)); err != nil {
					t.emit("error", fmt.Errorf("message handler error: %w", err))
				}
			}
		}
	}
}

// handleDisconnect handles connection loss
func (t *Transport) handleDisconnect() {
	t.mu.Lock()
	wasConnected := t.status == StatusConnected
	t.status = StatusDisconnected
	t.mu.Unlock()

	t.emit("statusChange", t.status)

	if wasConnected {
		t.emit("disconnect", nil)
		t.logf("Connection lost")

		// Auto-reconnect if enabled
		if t.options.AutoReconnect {
			t.scheduleReconnect()
		}
	}
}

// scheduleReconnect schedules a reconnection attempt
func (t *Transport) scheduleReconnect() {
	t.mu.Lock()
	if t.options.MaxReconnectAttempts > 0 &&
		t.reconnectAttempts >= t.options.MaxReconnectAttempts {
		t.mu.Unlock()
		t.emit("error", errors.New("max reconnect attempts reached"))
		return
	}

	t.reconnectAttempts++
	attempt := t.reconnectAttempts
	t.mu.Unlock()

	t.emit("reconnecting", attempt)
	t.logf("Reconnecting (attempt %d)...", attempt)

	time.AfterFunc(t.options.ReconnectDelay, func() {
		if err := t.Connect(); err != nil {
			t.emit("error", fmt.Errorf("reconnect failed: %w", err))
		}
	})
}

// startPing starts the ping/pong keep-alive mechanism
func (t *Transport) startPing() {
	if t.options.PingInterval <= 0 {
		return
	}

	t.pingTimer = time.AfterFunc(t.options.PingInterval, func() {
		if t.IsConnected() {
			// Send ping
			ping := &PingMessage{Type: MessageTypePing}
			if err := t.Send(ping); err != nil {
				t.emit("error", fmt.Errorf("failed to send ping: %w", err))
			}

			// Schedule pong timeout
			t.pongTimer = time.AfterFunc(t.options.PongTimeout, func() {
				t.emit("error", errors.New("pong timeout: connection may be dead"))
				t.handleDisconnect()
			})

			// Schedule next ping
			t.startPing()
		}
	})
}

// handlePong handles pong response
func (t *Transport) handlePong() {
	if t.pongTimer != nil {
		t.pongTimer.Stop()
		t.pongTimer = nil
	}
}

// emit emits an event to registered handlers
func (t *Transport) emit(event string, data interface{}) {
	t.eventHandlersMu.RLock()
	handlers := t.eventHandlers[event]
	t.eventHandlersMu.RUnlock()

	for _, handler := range handlers {
		handler(data)
	}
}

// logf logs a message if logger is configured
func (t *Transport) logf(format string, args ...interface{}) {
	if t.options.Logger != nil {
		t.options.Logger.Printf(format, args...)
	}
}
