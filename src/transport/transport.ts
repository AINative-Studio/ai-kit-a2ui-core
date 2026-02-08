/**
 * A2UI WebSocket Transport Layer
 * Framework-agnostic agent communication
 */

import type {
  A2UIMessage,
  CreateSurfaceMessage,
  UpdateComponentsMessage,
  UpdateDataModelMessage,
  DeleteSurfaceMessage,
  UserActionMessage,
  ErrorMessage,
  SearchVideosMessage,
  SearchResultsMessage,
} from '../types/index.js'

/**
 * Transport connection status
 */
export type TransportStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

/**
 * Transport options
 */
export interface TransportOptions {
  /** Auto-reconnect on connection loss */
  autoReconnect?: boolean
  /** Reconnect delay in ms */
  reconnectDelay?: number
  /** Max reconnect attempts (0 = infinite) */
  maxReconnectAttempts?: number
  /** Ping interval in ms (0 = disabled) */
  pingInterval?: number
  /** Pong timeout in ms */
  pongTimeout?: number
}

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (data: T) => void

/**
 * A2UI Transport class
 * Manages WebSocket connection and message routing
 */
export class A2UITransport {
  private ws: WebSocket | null = null
  private _status: TransportStatus = 'disconnected'
  private readonly url: string
  private readonly options: Required<TransportOptions>
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private pongTimer: ReturnType<typeof setTimeout> | null = null

  // Event handlers
  private readonly handlers = new Map<string, Set<EventHandler>>()

  constructor(url: string, options: TransportOptions = {}) {
    this.url = url
    this.options = {
      autoReconnect: options.autoReconnect ?? true,
      reconnectDelay: options.reconnectDelay ?? 3000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
      pingInterval: options.pingInterval ?? 30000,
      pongTimeout: options.pongTimeout ?? 5000,
    }
  }

  /**
   * Connect to the agent
   */
  async connect(): Promise<void> {
    if (this._status === 'connected' || this._status === 'connecting') {
      return
    }

    this._status = 'connecting'
    this.emit('statusChange', this._status)

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          this._status = 'connected'
          this.reconnectAttempts = 0
          this.emit('statusChange', this._status)
          this.emit('connect', undefined)
          this.startPing()
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data as string)
        }

        this.ws.onerror = () => {
          this._status = 'error'
          this.emit('statusChange', this._status)
          this.emit('error', new Error('WebSocket error'))
          reject(new Error('WebSocket connection failed'))
        }

        this.ws.onclose = () => {
          this.handleClose()
        }
      } catch (error) {
        this._status = 'error'
        this.emit('statusChange', this._status)
        reject(error)
      }
    })
  }

  /**
   * Disconnect from the agent
   */
  disconnect(): void {
    this.stopPing()
    this.stopReconnect()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this._status = 'disconnected'
    this.emit('statusChange', this._status)
    this.emit('disconnect', undefined)
  }

  /**
   * Send a message to the agent
   */
  send(message: A2UIMessage): void {
    if (!this.isConnected) {
      throw new Error('Cannot send message: not connected')
    }

    const json = JSON.stringify(message)
    this.ws!.send(json)
  }

  /**
   * Register an event handler
   */
  on(event: 'statusChange', handler: EventHandler<TransportStatus>): void
  on(event: 'connect', handler: EventHandler<undefined>): void
  on(event: 'disconnect', handler: EventHandler<undefined>): void
  on(event: 'reconnecting', handler: EventHandler<number>): void
  on(event: 'error', handler: EventHandler<Error>): void
  on(event: 'message', handler: EventHandler<A2UIMessage>): void
  on(event: 'createSurface', handler: EventHandler<CreateSurfaceMessage>): void
  on(event: 'updateComponents', handler: EventHandler<UpdateComponentsMessage>): void
  on(event: 'updateDataModel', handler: EventHandler<UpdateDataModelMessage>): void
  on(event: 'deleteSurface', handler: EventHandler<DeleteSurfaceMessage>): void
  on(event: 'userAction', handler: EventHandler<UserActionMessage>): void
  on(event: 'searchVideos', handler: EventHandler<SearchVideosMessage>): void
  on(event: 'searchResults', handler: EventHandler<SearchResultsMessage>): void
  on<T = unknown>(event: string, handler: EventHandler<T>): void
  on<T = unknown>(event: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler as EventHandler)
  }

  /**
   * Unregister an event handler
   */
  off(event: 'statusChange', handler: EventHandler<TransportStatus>): void
  off(event: 'connect', handler: EventHandler<undefined>): void
  off(event: 'disconnect', handler: EventHandler<undefined>): void
  off(event: 'reconnecting', handler: EventHandler<number>): void
  off(event: 'error', handler: EventHandler<Error>): void
  off(event: 'message', handler: EventHandler<A2UIMessage>): void
  off(event: 'createSurface', handler: EventHandler<CreateSurfaceMessage>): void
  off(event: 'updateComponents', handler: EventHandler<UpdateComponentsMessage>): void
  off(event: 'updateDataModel', handler: EventHandler<UpdateDataModelMessage>): void
  off(event: 'deleteSurface', handler: EventHandler<DeleteSurfaceMessage>): void
  off(event: 'userAction', handler: EventHandler<UserActionMessage>): void
  off(event: 'searchVideos', handler: EventHandler<SearchVideosMessage>): void
  off(event: 'searchResults', handler: EventHandler<SearchResultsMessage>): void
  off<T = unknown>(event: string, handler: EventHandler<T>): void
  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.delete(handler as EventHandler)
    }
  }

  /**
   * Get current status
   */
  get status(): TransportStatus {
    return this._status
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this._status === 'connected' && this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as A2UIMessage

      // Handle pong response
      if (message.type === 'pong') {
        this.handlePong()
        return
      }

      // Emit message to specific type handlers
      this.emit(message.type, message)

      // Emit to generic message handler
      this.emit('message', message)
    } catch (error) {
      this.emit('error', new Error(`Failed to parse message: ${String(error)}`))
    }
  }

  /**
   * Handle connection close
   */
  private handleClose(): void {
    this.stopPing()

    const wasConnected = this._status === 'connected'
    this._status = 'disconnected'
    this.emit('statusChange', this._status)

    if (wasConnected) {
      this.emit('disconnect', undefined)

      // Auto-reconnect if enabled
      if (this.options.autoReconnect) {
        this.scheduleReconnect()
      }
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts && this.options.maxReconnectAttempts > 0) {
      this.emit('error', new Error('Max reconnect attempts reached'))
      return
    }

    this.reconnectAttempts++
    this.emit('reconnecting', this.reconnectAttempts)

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.emit('error', error as Error)
      })
    }, this.options.reconnectDelay)
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
   * Start ping/pong keep-alive
   */
  private startPing(): void {
    if (this.options.pingInterval === 0) {
      return
    }

    this.pingTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' })
        this.schedulePongTimeout()
      }
    }, this.options.pingInterval)
  }

  /**
   * Stop ping/pong
   */
  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer)
      this.pongTimer = null
    }
  }

  /**
   * Schedule pong timeout
   */
  private schedulePongTimeout(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer)
    }

    this.pongTimer = setTimeout(() => {
      this.emit('error', new Error('Pong timeout: connection may be dead'))
      this.ws?.close()
    }, this.options.pongTimeout)
  }

  /**
   * Handle pong response
   */
  private handlePong(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer)
      this.pongTimer = null
    }
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
}
