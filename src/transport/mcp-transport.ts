/**
 * Model Context Protocol (MCP) Transport Layer
 * WebSocket-based MCP client for connecting to MCP servers
 */

import type {
  MCPClientInfo,
  MCPInitializeResult,
  MCPTool,
  MCPToolResult,
  MCPResource,
  MCPResourceContents,
  MCPPrompt,
  MCPPromptResult,
  MCPRequest,
  MCPResponse,
  MCPNotification,
  MCPMessage,
  MCPConnectionState,
  MCPTransportProtocol,
  JsonRpcVersion,
} from '../types/mcp-protocol.js'
import { MCPErrorCode, MCPMethod, isMCPResponse, isMCPNotification, isMCPError } from '../types/mcp-protocol.js'

/**
 * MCP Transport Options
 */
export interface MCPTransportOptions {
  /** Server URL (e.g., "ws://localhost:8080") */
  serverUrl: string
  /** Transport protocol */
  protocol?: MCPTransportProtocol
  /** Auto-reconnect on disconnect */
  reconnect?: boolean
  /** Reconnect interval in ms */
  reconnectInterval?: number
  /** Max reconnect attempts (0 = infinite) */
  maxReconnectAttempts?: number
  /** Request timeout in ms */
  timeout?: number
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Event handler type
 */
export type MCPEventHandler<T = unknown> = (data: T) => void

/**
 * Pending request tracker
 */
interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

/**
 * MCP Transport Class
 * Implements Model Context Protocol over WebSocket
 */
export class MCPTransport {
  private ws: WebSocket | null = null
  private _state: MCPConnectionState = 'disconnected'
  private readonly options: Required<MCPTransportOptions>
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private requestIdCounter = 0
  private pendingRequests = new Map<string | number, PendingRequest>()
  private readonly handlers = new Map<string, Set<MCPEventHandler>>()
  private initializeResult: MCPInitializeResult | null = null

  constructor(options: MCPTransportOptions) {
    this.options = {
      serverUrl: options.serverUrl,
      protocol: options.protocol ?? 'ws',
      reconnect: options.reconnect ?? true,
      reconnectInterval: options.reconnectInterval ?? 3000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
      timeout: options.timeout ?? 30000,
      debug: options.debug ?? false,
    }
  }

  /**
   * Connect to MCP server
   */
  async connect(): Promise<void> {
    if (this._state === 'connected' || this._state === 'connecting') {
      return
    }

    this._state = 'connecting'
    this.emit('stateChange', this._state)

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.options.serverUrl)

        this.ws.onopen = () => {
          this._state = 'connected'
          this.reconnectAttempts = 0
          this.emit('stateChange', this._state)
          this.emit('connected', undefined)
          this.log('Connected to MCP server')
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data as string)
        }

        this.ws.onerror = (error) => {
          this._state = 'error'
          this.emit('stateChange', this._state)
          this.emit('error', new Error(`WebSocket error: ${String(error)}`))
          reject(new Error('MCP connection failed'))
        }

        this.ws.onclose = () => {
          this.handleClose()
        }
      } catch (error) {
        this._state = 'error'
        this.emit('stateChange', this._state)
        reject(error)
      }
    })
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    this.stopReconnect()

    // Send shutdown notification
    if (this.isConnected) {
      try {
        await this.sendNotification(MCPMethod.SHUTDOWN, {})
      } catch (error) {
        this.log(`Shutdown notification failed: ${String(error)}`)
      }
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    // Reject all pending requests
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeout)
      pending.reject(new Error('Connection closed'))
    })
    this.pendingRequests.clear()

    this._state = 'disconnected'
    this.emit('stateChange', this._state)
    this.emit('disconnected', undefined)
    this.log('Disconnected from MCP server')
  }

  /**
   * Reconnect to MCP server
   */
  async reconnect(): Promise<void> {
    await this.disconnect()
    await this.connect()
    if (this.initializeResult) {
      // Re-initialize with previous client info
      await this.initialize({
        name: 'a2ui-mcp-client',
        version: '1.0.0',
      })
    }
  }

  /**
   * Initialize MCP session
   */
  async initialize(clientInfo: MCPClientInfo): Promise<MCPInitializeResult> {
    this._state = 'initializing'
    this.emit('stateChange', this._state)

    const result = await this.sendRequest<MCPInitializeResult>(MCPMethod.INITIALIZE, {
      protocolVersion: '2024-11-05',
      capabilities: clientInfo.capabilities ?? {},
      clientInfo: {
        name: clientInfo.name,
        version: clientInfo.version,
      },
    })

    this.initializeResult = result

    // Send initialized notification
    await this.sendNotification(MCPMethod.INITIALIZED, {})

    this._state = 'ready'
    this.emit('stateChange', this._state)
    this.emit('initialized', result)
    this.log('MCP session initialized', result)

    return result
  }

  /**
   * List available tools
   */
  async listTools(): Promise<MCPTool[]> {
    const result = await this.sendRequest<{ tools: MCPTool[] }>(MCPMethod.TOOLS_LIST, {})
    return result.tools
  }

  /**
   * Call a tool
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    this.log(`Calling tool: ${name}`, args)
    return await this.sendRequest<MCPToolResult>(MCPMethod.TOOLS_CALL, {
      name,
      arguments: args,
    })
  }

  /**
   * List available resources
   */
  async listResources(): Promise<MCPResource[]> {
    const result = await this.sendRequest<{ resources: MCPResource[] }>(MCPMethod.RESOURCES_LIST, {})
    return result.resources
  }

  /**
   * Read a resource
   */
  async readResource(uri: string): Promise<MCPResourceContents> {
    this.log(`Reading resource: ${uri}`)
    const result = await this.sendRequest<{ contents: MCPResourceContents[] }>(MCPMethod.RESOURCES_READ, {
      uri,
    })
    if (result.contents.length === 0) {
      throw new Error(`Resource not found: ${uri}`)
    }
    return result.contents[0]!
  }

  /**
   * Subscribe to resource updates
   */
  async subscribe(uri: string): Promise<void> {
    await this.sendRequest(MCPMethod.RESOURCES_SUBSCRIBE, { uri })
    this.log(`Subscribed to resource: ${uri}`)
  }

  /**
   * Unsubscribe from resource updates
   */
  async unsubscribe(uri: string): Promise<void> {
    await this.sendRequest(MCPMethod.RESOURCES_UNSUBSCRIBE, { uri })
    this.log(`Unsubscribed from resource: ${uri}`)
  }

  /**
   * List available prompts
   */
  async listPrompts(): Promise<MCPPrompt[]> {
    const result = await this.sendRequest<{ prompts: MCPPrompt[] }>(MCPMethod.PROMPTS_LIST, {})
    return result.prompts
  }

  /**
   * Get a prompt
   */
  async getPrompt(name: string, args?: Record<string, string>): Promise<MCPPromptResult> {
    return await this.sendRequest<MCPPromptResult>(MCPMethod.PROMPTS_GET, {
      name,
      arguments: args ?? {},
    })
  }

  /**
   * Set logging level
   */
  async setLogLevel(level: 'debug' | 'info' | 'warning' | 'error'): Promise<void> {
    await this.sendRequest(MCPMethod.LOGGING_SET_LEVEL, { level })
  }

  /**
   * Send a JSON-RPC request and wait for response
   */
  async sendRequest<T = unknown>(method: string, params: Record<string, unknown>): Promise<T> {
    if (!this.isConnected) {
      throw new Error('Not connected to MCP server')
    }

    const id = ++this.requestIdCounter
    const request: MCPRequest = {
      jsonrpc: '2.0' as JsonRpcVersion,
      id,
      method,
      params,
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id)
        reject(new Error(`Request timeout: ${method}`))
      }, this.options.timeout)

      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout,
      })

      this.send(request)
    })
  }

  /**
   * Send a JSON-RPC notification (no response expected)
   */
  async sendNotification(method: string, params: Record<string, unknown>): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to MCP server')
    }

    const notification: MCPNotification = {
      jsonrpc: '2.0' as JsonRpcVersion,
      method,
      params,
    }

    this.send(notification)
  }

  /**
   * Register an event handler
   */
  on<T = unknown>(event: string, handler: MCPEventHandler<T>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler as MCPEventHandler)
  }

  /**
   * Unregister an event handler
   */
  off<T = unknown>(event: string, handler: MCPEventHandler<T>): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.delete(handler as MCPEventHandler)
    }
  }

  /**
   * Get current connection state
   */
  get state(): MCPConnectionState {
    return this._state
  }

  /**
   * Check if connected and ready
   */
  get isConnected(): boolean {
    return (
      (this._state === 'connected' || this._state === 'ready' || this._state === 'initializing') &&
      this.ws !== null &&
      this.ws.readyState === WebSocket.OPEN
    )
  }

  /**
   * Get server capabilities
   */
  get capabilities(): MCPInitializeResult['capabilities'] | null {
    return this.initializeResult?.capabilities ?? null
  }

  /**
   * Send raw message to server
   */
  private send(message: MCPMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not open')
    }

    const json = JSON.stringify(message)
    this.ws.send(json)
    this.log('Sent:', message)
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as MCPMessage
      this.log('Received:', message)

      if (isMCPResponse(message)) {
        this.handleResponse(message)
      } else if (isMCPNotification(message)) {
        this.handleNotification(message)
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to parse message: ${String(error)}`))
    }
  }

  /**
   * Handle JSON-RPC response
   */
  private handleResponse(response: MCPResponse): void {
    const pending = this.pendingRequests.get(response.id)
    if (!pending) {
      this.log(`Received response for unknown request: ${response.id}`)
      return
    }

    this.pendingRequests.delete(response.id)
    clearTimeout(pending.timeout)

    if (isMCPError(response)) {
      pending.reject(
        new Error(`MCP Error ${response.error.code}: ${response.error.message}`)
      )
    } else {
      pending.resolve(response.result)
    }
  }

  /**
   * Handle JSON-RPC notification
   */
  private handleNotification(notification: MCPNotification): void {
    this.emit('notification', notification)
    this.emit(`notification:${notification.method}`, notification.params)

    // Handle specific notifications
    if (notification.method === MCPMethod.NOTIFICATION_RESOURCES_UPDATED) {
      this.emit('resourceUpdated', notification.params)
    } else if (notification.method === MCPMethod.NOTIFICATION_TOOLS_LIST_CHANGED) {
      this.emit('toolsListChanged', notification.params)
    } else if (notification.method === MCPMethod.NOTIFICATION_RESOURCES_LIST_CHANGED) {
      this.emit('resourcesListChanged', notification.params)
    } else if (notification.method === MCPMethod.NOTIFICATION_PROMPTS_LIST_CHANGED) {
      this.emit('promptsListChanged', notification.params)
    }
  }

  /**
   * Handle connection close
   */
  private handleClose(): void {
    const wasConnected = this._state !== 'disconnected'
    this._state = 'disconnected'
    this.emit('stateChange', this._state)

    // Reject all pending requests
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeout)
      pending.reject(new Error('Connection closed'))
    })
    this.pendingRequests.clear()

    if (wasConnected) {
      this.emit('disconnected', undefined)
      this.log('Connection closed')

      // Auto-reconnect if enabled
      if (this.options.reconnect) {
        this.scheduleReconnect()
      }
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (
      this.reconnectAttempts >= this.options.maxReconnectAttempts &&
      this.options.maxReconnectAttempts > 0
    ) {
      this.emit('error', new Error('Max reconnect attempts reached'))
      return
    }

    this.reconnectAttempts++
    this.emit('reconnecting', this.reconnectAttempts)
    this.log(`Reconnecting (attempt ${this.reconnectAttempts})...`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnect().catch((error) => {
        this.emit('error', error as Error)
      })
    }, this.options.reconnectInterval)
  }

  /**
   * Stop reconnection timer
   */
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.reconnectAttempts = 0
  }

  /**
   * Emit event to handlers
   */
  private emit<T = unknown>(event: string, data: T): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(data))
    }
  }

  /**
   * Debug logging
   */
  private log(message: string, ...args: unknown[]): void {
    if (this.options.debug) {
      console.log(`[MCPTransport] ${message}`, ...args)
    }
  }
}
