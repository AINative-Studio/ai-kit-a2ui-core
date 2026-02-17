package a2ui_test

import (
	"encoding/json"
	"testing"

	"github.com/ainative/a2ui-go/a2ui"
	"github.com/stretchr/testify/assert"
)

func TestDefaultTransportOptions(t *testing.T) {
	opts := a2ui.DefaultTransportOptions()

	assert.NotNil(t, opts)
	assert.True(t, opts.AutoReconnect)
	assert.Equal(t, 5, opts.MaxReconnectAttempts)
	assert.Greater(t, opts.ReconnectDelay.Milliseconds(), int64(0))
	assert.Greater(t, opts.PingInterval.Milliseconds(), int64(0))
	assert.Greater(t, opts.PongTimeout.Milliseconds(), int64(0))
}

func TestNewTransport(t *testing.T) {
	t.Run("create transport with default options", func(t *testing.T) {
		transport := a2ui.NewTransport("ws://localhost:8000", nil)

		assert.NotNil(t, transport)
		assert.Equal(t, a2ui.StatusDisconnected, transport.Status())
		assert.False(t, transport.IsConnected())
	})

	t.Run("create transport with custom options", func(t *testing.T) {
		opts := &a2ui.TransportOptions{
			AutoReconnect:        false,
			ReconnectDelay:       5000,
			MaxReconnectAttempts: 3,
		}

		transport := a2ui.NewTransport("ws://localhost:8000", opts)

		assert.NotNil(t, transport)
		assert.Equal(t, a2ui.StatusDisconnected, transport.Status())
	})
}

func TestTransportHandlers(t *testing.T) {
	t.Run("register message handler", func(t *testing.T) {
		transport := a2ui.NewTransport("ws://localhost:8000", nil)

		transport.On("createSurface", func(msg json.RawMessage) error {
			return nil
		})

		// Handler should be registered (we can't easily test execution without a connection)
		assert.NotNil(t, transport)
	})

	t.Run("register event handler", func(t *testing.T) {
		transport := a2ui.NewTransport("ws://localhost:8000", nil)

		transport.OnEvent("connect", func(data interface{}) {
			// Handler registered
		})

		assert.NotNil(t, transport)
	})

	t.Run("register multiple handlers for same event", func(t *testing.T) {
		transport := a2ui.NewTransport("ws://localhost:8000", nil)

		transport.On("message", func(msg json.RawMessage) error {
			return nil
		})
		transport.On("message", func(msg json.RawMessage) error {
			return nil
		})

		assert.NotNil(t, transport)
	})
}

func TestTransportStatus(t *testing.T) {
	t.Run("initial status is disconnected", func(t *testing.T) {
		transport := a2ui.NewTransport("ws://localhost:8000", nil)

		assert.Equal(t, a2ui.StatusDisconnected, transport.Status())
		assert.False(t, transport.IsConnected())
	})

	t.Run("status types", func(t *testing.T) {
		// Test all status constants exist
		statuses := []a2ui.TransportStatus{
			a2ui.StatusDisconnected,
			a2ui.StatusConnecting,
			a2ui.StatusConnected,
			a2ui.StatusError,
		}

		for _, status := range statuses {
			assert.NotEmpty(t, status)
		}
	})
}

func TestTransportClose(t *testing.T) {
	t.Run("close disconnected transport", func(t *testing.T) {
		transport := a2ui.NewTransport("ws://localhost:8000", nil)

		err := transport.Close()
		assert.NoError(t, err)
	})
}

func TestTransportMessageTypes(t *testing.T) {
	t.Run("verify all message types", func(t *testing.T) {
		messageTypes := []a2ui.MessageType{
			a2ui.MessageTypeCreateSurface,
			a2ui.MessageTypeUpdateComponents,
			a2ui.MessageTypeUpdateDataModel,
			a2ui.MessageTypeDeleteSurface,
			a2ui.MessageTypeUserAction,
			a2ui.MessageTypeError,
			a2ui.MessageTypePing,
			a2ui.MessageTypePong,
		}

		for _, mt := range messageTypes {
			assert.NotEmpty(t, mt)
		}
	})
}

func TestTransportOperationTypes(t *testing.T) {
	t.Run("verify operation types", func(t *testing.T) {
		ops := []a2ui.OperationType{
			a2ui.OperationAdd,
			a2ui.OperationUpdate,
			a2ui.OperationRemove,
		}

		for _, op := range ops {
			assert.NotEmpty(t, op)
		}
	})

	t.Run("verify data operation types", func(t *testing.T) {
		ops := []a2ui.DataOperationType{
			a2ui.DataOperationSet,
			a2ui.DataOperationRemove,
		}

		for _, op := range ops {
			assert.NotEmpty(t, op)
		}
	})
}
