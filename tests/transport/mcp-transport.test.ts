/**
 * MCP Transport Tests
 * Comprehensive test coverage for MCPTransport class
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MCPTransport } from '../../src/transport/mcp-transport.js'
import type { MCPConnectionState, MCPInitializeResult, MCPRequest, MCPResponse } from '../../src/types/mcp-protocol.js'
import { MCPMethod } from '../../src/types/mcp-protocol.js'

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  private messages: string[] = []

  constructor(public url: string) {
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      this.onopen?.(new Event('open'))
    }, 10)
  }

  send(data: string): void {
    this.messages.push(data)
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED
    setTimeout(() => {
      this.onclose?.(new CloseEvent('close'))
    }, 10)
  }

  // Test helper to simulate incoming message
  simulateMessage(data: string): void {
    this.onmessage?.(new MessageEvent('message', { data }))
  }

  // Test helper to get sent messages
  getSentMessages(): string[] {
    return this.messages
  }
}

// Set up global WebSocket mock
global.WebSocket = MockWebSocket as any

describe('MCPTransport', () => {
  let transport: MCPTransport
  let mockWs: MockWebSocket

  beforeEach(() => {
    transport = new MCPTransport({
      serverUrl: 'ws://localhost:8080',
      reconnect: false,
      debug: false,
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Connection Lifecycle', () => {
    it('should connect to MCP server', async () => {
      const stateChanges: MCPConnectionState[] = []
      transport.on('stateChange', (state: MCPConnectionState) => {
        stateChanges.push(state)
      })

      let connected = false
      transport.on('connected', () => {
        connected = true
      })

      await transport.connect()

      expect(transport.state).toBe('connected')
      expect(transport.isConnected).toBe(true)
      expect(connected).toBe(true)
      expect(stateChanges).toContain('connecting')
      expect(stateChanges).toContain('connected')
    })

    it('should disconnect from MCP server', async () => {
      await transport.connect()

      let disconnected = false
      transport.on('disconnected', () => {
        disconnected = true
      })

      await transport.disconnect()

      expect(transport.state).toBe('disconnected')
      expect(transport.isConnected).toBe(false)
      expect(disconnected).toBe(true)
    })

    it('should handle connection errors', async () => {
      const errorTransport = new MCPTransport({
        serverUrl: 'ws://invalid-host:9999',
        reconnect: false,
      })

      let errorReceived = false
      errorTransport.on('error', () => {
        errorReceived = true
      })

      // Mock the connection to trigger error immediately
      const originalConnect = errorTransport.connect.bind(errorTransport)
      const connectPromise = originalConnect()

      // Simulate connection error before open event
      await new Promise((resolve) => setTimeout(resolve, 5))
      const ws = (errorTransport as any).ws as MockWebSocket
      ws.onerror?.(new Event('error'))

      await expect(connectPromise).rejects.toThrow()
      expect(errorReceived).toBe(true)
    })

    it('should not connect if already connected', async () => {
      await transport.connect()
      const firstState = transport.state

      await transport.connect()
      const secondState = transport.state

      expect(firstState).toBe(secondState)
      expect(transport.isConnected).toBe(true)
    })
  })

  describe('Initialization', () => {
    it('should initialize MCP session', async () => {
      await transport.connect()

      const initPromise = transport.initialize({
        name: 'test-client',
        version: '1.0.0',
        capabilities: {
          roots: true,
        },
      })

      // Simulate server response
      setTimeout(() => {
        const ws = (transport as any).ws as MockWebSocket
        const messages = ws.getSentMessages()
        const initRequest = JSON.parse(messages[0]!) as MCPRequest

        const response: MCPResponse = {
          jsonrpc: '2.0',
          id: initRequest.id!,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: { listChanged: true },
              resources: { subscribe: true },
            },
            serverInfo: {
              name: 'test-server',
              version: '1.0.0',
            },
          },
        }

        ws.simulateMessage(JSON.stringify(response))
      }, 20)

      const result = await initPromise

      expect(result.protocolVersion).toBe('2024-11-05')
      expect(result.serverInfo.name).toBe('test-server')
      expect(transport.state).toBe('ready')
    })

    it('should send initialized notification', async () => {
      await transport.connect()

      transport.initialize({
        name: 'test-client',
        version: '1.0.0',
      })

      // Simulate server response
      setTimeout(() => {
        const ws = (transport as any).ws as MockWebSocket
        const messages = ws.getSentMessages()
        const initRequest = JSON.parse(messages[0]!) as MCPRequest

        const response: MCPResponse = {
          jsonrpc: '2.0',
          id: initRequest.id!,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            serverInfo: {
              name: 'test-server',
              version: '1.0.0',
            },
          },
        }

        ws.simulateMessage(JSON.stringify(response))
      }, 20)

      await new Promise((resolve) => setTimeout(resolve, 50))

      const ws = (transport as any).ws as MockWebSocket
      const messages = ws.getSentMessages()
      const initializedNotif = messages.find((msg) => msg.includes('initialized'))

      expect(initializedNotif).toBeDefined()
    })
  })

  describe('Tool Operations', () => {
    beforeEach(async () => {
      await transport.connect()
      await initializeTransport(transport)
    })

    it('should list available tools', async () => {
      const toolsPromise = transport.listTools()

      // Simulate server response
      setTimeout(() => {
        const ws = (transport as any).ws as MockWebSocket
        const messages = ws.getSentMessages()
        const lastRequest = JSON.parse(messages[messages.length - 1]!) as MCPRequest

        const response: MCPResponse = {
          jsonrpc: '2.0',
          id: lastRequest.id!,
          result: {
            tools: [
              {
                name: 'test-tool',
                description: 'Test tool',
                inputSchema: { type: 'object' },
              },
            ],
          },
        }

        ws.simulateMessage(JSON.stringify(response))
      }, 20)

      const tools = await toolsPromise

      expect(tools).toHaveLength(1)
      expect(tools[0]!.name).toBe('test-tool')
    })

    it('should call a tool with arguments', async () => {
      const toolPromise = transport.callTool('test-tool', {
        arg1: 'value1',
        arg2: 42,
      })

      // Simulate server response
      setTimeout(() => {
        const ws = (transport as any).ws as MockWebSocket
        const messages = ws.getSentMessages()
        const lastRequest = JSON.parse(messages[messages.length - 1]!) as MCPRequest

        expect(lastRequest.method).toBe(MCPMethod.TOOLS_CALL)
        expect(lastRequest.params).toEqual({
          name: 'test-tool',
          arguments: { arg1: 'value1', arg2: 42 },
        })

        const response: MCPResponse = {
          jsonrpc: '2.0',
          id: lastRequest.id!,
          result: {
            content: [
              {
                type: 'text',
                text: 'Tool executed successfully',
              },
            ],
          },
        }

        ws.simulateMessage(JSON.stringify(response))
      }, 20)

      const result = await toolPromise

      expect(result.content).toHaveLength(1)
      expect(result.content[0]!.text).toBe('Tool executed successfully')
    })

    it('should handle tool errors', async () => {
      const toolPromise = transport.callTool('failing-tool', {})

      // Simulate error response
      setTimeout(() => {
        const ws = (transport as any).ws as MockWebSocket
        const messages = ws.getSentMessages()
        const lastRequest = JSON.parse(messages[messages.length - 1]!) as MCPRequest

        const response: MCPResponse = {
          jsonrpc: '2.0',
          id: lastRequest.id!,
          error: {
            code: -32600,
            message: 'Tool execution failed',
          },
        }

        ws.simulateMessage(JSON.stringify(response))
      }, 20)

      await expect(toolPromise).rejects.toThrow('Tool execution failed')
    })
  })

  describe('Resource Operations', () => {
    beforeEach(async () => {
      await transport.connect()
      await initializeTransport(transport)
    })

    it('should list resources', async () => {
      const resourcesPromise = transport.listResources()

      setTimeout(() => {
        respondToLastRequest(transport, {
          resources: [
            {
              uri: 'file:///test.txt',
              name: 'test.txt',
              mimeType: 'text/plain',
            },
          ],
        })
      }, 20)

      const resources = await resourcesPromise

      expect(resources).toHaveLength(1)
      expect(resources[0]!.uri).toBe('file:///test.txt')
    })

    it('should read a resource', async () => {
      const resourcePromise = transport.readResource('file:///test.txt')

      setTimeout(() => {
        respondToLastRequest(transport, {
          contents: [
            {
              uri: 'file:///test.txt',
              mimeType: 'text/plain',
              text: 'Hello, world!',
            },
          ],
        })
      }, 20)

      const resource = await resourcePromise

      expect(resource.uri).toBe('file:///test.txt')
      expect(resource.text).toBe('Hello, world!')
    })

    it('should subscribe to resource updates', async () => {
      const subscribePromise = transport.subscribe('file:///test.txt')

      setTimeout(() => {
        respondToLastRequest(transport, {})
      }, 20)

      await expect(subscribePromise).resolves.toBeUndefined()
    })

    it('should unsubscribe from resource updates', async () => {
      const unsubscribePromise = transport.unsubscribe('file:///test.txt')

      setTimeout(() => {
        respondToLastRequest(transport, {})
      }, 20)

      await expect(unsubscribePromise).resolves.toBeUndefined()
    })
  })

  describe('Request Timeout', () => {
    it('should timeout requests after configured duration', async () => {
      const timeoutTransport = new MCPTransport({
        serverUrl: 'ws://localhost:8080',
        timeout: 100,
      })

      await timeoutTransport.connect()
      await initializeTransport(timeoutTransport)

      const requestPromise = timeoutTransport.listTools()

      // Don't send response - let it timeout

      await expect(requestPromise).rejects.toThrow('Request timeout')
    })
  })

  describe('Event Handling', () => {
    it('should emit notification events', async () => {
      await transport.connect()

      let notificationReceived = false
      transport.on('notification', () => {
        notificationReceived = true
      })

      const ws = (transport as any).ws as MockWebSocket
      ws.simulateMessage(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/test',
          params: { data: 'test' },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(notificationReceived).toBe(true)
    })

    it('should emit specific notification events', async () => {
      await transport.connect()

      let resourceUpdated = false
      transport.on('resourceUpdated', () => {
        resourceUpdated = true
      })

      const ws = (transport as any).ws as MockWebSocket
      ws.simulateMessage(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/resources/updated',
          params: { uri: 'file:///test.txt' },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(resourceUpdated).toBe(true)
    })
  })

  describe('Reconnection', () => {
    it('should reconnect after disconnect', async () => {
      const reconnectTransport = new MCPTransport({
        serverUrl: 'ws://localhost:8080',
        reconnect: true,
        reconnectInterval: 100,
        maxReconnectAttempts: 3,
      })

      await reconnectTransport.connect()
      await initializeTransport(reconnectTransport)

      let reconnecting = false
      reconnectTransport.on('reconnecting', () => {
        reconnecting = true
      })

      // Simulate disconnect
      const ws = (reconnectTransport as any).ws as MockWebSocket
      ws.close()

      await new Promise((resolve) => setTimeout(resolve, 150))

      expect(reconnecting).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid JSON messages', async () => {
      await transport.connect()

      let errorReceived = false
      transport.on('error', () => {
        errorReceived = true
      })

      const ws = (transport as any).ws as MockWebSocket
      ws.simulateMessage('invalid json {')

      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(errorReceived).toBe(true)
    })

    it('should reject pending requests on disconnect', async () => {
      await transport.connect()
      await initializeTransport(transport)

      const requestPromise = transport.listTools()

      // Don't respond, just disconnect
      await transport.disconnect()

      await expect(requestPromise).rejects.toThrow('Connection closed')
    })
  })
})

// Test Helpers

async function initializeTransport(transport: MCPTransport): Promise<void> {
  const initPromise = transport.initialize({
    name: 'test-client',
    version: '1.0.0',
  })

  setTimeout(() => {
    const ws = (transport as any).ws as MockWebSocket
    const messages = ws.getSentMessages()
    const initRequest = JSON.parse(messages[0]!) as MCPRequest

    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: initRequest.id!,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        serverInfo: {
          name: 'test-server',
          version: '1.0.0',
        },
      },
    }

    ws.simulateMessage(JSON.stringify(response))
  }, 20)

  await initPromise
}

function respondToLastRequest(transport: MCPTransport, result: any): void {
  const ws = (transport as any).ws as MockWebSocket
  const messages = ws.getSentMessages()
  const lastRequest = JSON.parse(messages[messages.length - 1]!) as MCPRequest

  const response: MCPResponse = {
    jsonrpc: '2.0',
    id: lastRequest.id!,
    result,
  }

  ws.simulateMessage(JSON.stringify(response))
}
