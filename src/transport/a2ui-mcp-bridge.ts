/**
 * A2UI to MCP Bridge
 * Connects A2UI protocol to MCP server operations
 */

import { A2UITransport } from './transport.js'
import { MCPTransport } from './mcp-transport.js'
import type {
  A2UIMessage,
  UserActionMessage,
  CreateSurfaceMessage,
  UpdateDataModelMessage,
} from '../types/protocol.js'
import type { MCPToolResult } from '../types/mcp-protocol.js'

/**
 * Bridge configuration
 */
export interface A2UIToMCPBridgeOptions {
  /** A2UI transport instance */
  a2uiTransport: A2UITransport
  /** MCP transport instance */
  mcpTransport: MCPTransport
  /** Action to MCP tool mapping */
  actionMapping?: Map<string, string>
  /** Auto-sync data model with MCP resources */
  autoSync?: boolean
  /** Debug logging */
  debug?: boolean
}

/**
 * Action handler function
 */
export type ActionHandler = (
  action: UserActionMessage,
  mcpTransport: MCPTransport
) => Promise<void>

/**
 * A2UI to MCP Bridge
 * Translates between A2UI protocol and MCP operations
 */
export class A2UIToMCPBridge {
  private readonly a2uiTransport: A2UITransport
  private readonly mcpTransport: MCPTransport
  private readonly actionMapping: Map<string, string>
  private readonly actionHandlers: Map<string, ActionHandler> = new Map()
  private readonly autoSync: boolean
  private readonly debug: boolean
  private isRunning = false
  private dataModelCache = new Map<string, Record<string, unknown>>()

  constructor(options: A2UIToMCPBridgeOptions) {
    this.a2uiTransport = options.a2uiTransport
    this.mcpTransport = options.mcpTransport
    this.actionMapping = options.actionMapping ?? new Map()
    this.autoSync = options.autoSync ?? true
    this.debug = options.debug ?? false

    this.setupDefaultHandlers()
  }

  /**
   * Start the bridge
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return
    }

    // Set up event handlers
    this.a2uiTransport.on('message', this.handleA2UIMessage.bind(this))
    this.mcpTransport.on('notification', this.handleMCPNotification.bind(this))
    this.mcpTransport.on('resourceUpdated', this.handleResourceUpdate.bind(this))

    // Connect both transports if not already connected
    if (!this.a2uiTransport.isConnected) {
      await this.a2uiTransport.connect()
    }

    if (!this.mcpTransport.isConnected) {
      await this.mcpTransport.connect()
    }

    this.isRunning = true
    this.log('Bridge started')
  }

  /**
   * Stop the bridge
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    this.dataModelCache.clear()
    this.log('Bridge stopped')
  }

  /**
   * Register a custom action handler
   */
  registerActionHandler(action: string, handler: ActionHandler): void {
    this.actionHandlers.set(action, handler)
    this.log(`Registered handler for action: ${action}`)
  }

  /**
   * Map an A2UI action to an MCP tool
   */
  mapActionToTool(action: string, toolName: string): void {
    this.actionMapping.set(action, toolName)
    this.log(`Mapped action '${action}' to tool '${toolName}'`)
  }

  /**
   * Handle A2UI messages
   */
  private async handleA2UIMessage(message: A2UIMessage): Promise<void> {
    try {
      if (message.type === 'userAction') {
        await this.handleUserAction(message as UserActionMessage)
      } else if (message.type === 'createSurface') {
        await this.handleCreateSurface(message as CreateSurfaceMessage)
      } else if (message.type === 'updateDataModel') {
        await this.handleDataModelUpdate(message as UpdateDataModelMessage)
      }
    } catch (error) {
      this.log(`Error handling A2UI message: ${String(error)}`)
      this.a2uiTransport.send({
        type: 'error',
        code: 'BRIDGE_ERROR',
        message: String(error),
      })
    }
  }

  /**
   * Handle user actions from A2UI
   */
  private async handleUserAction(action: UserActionMessage): Promise<void> {
    this.log(`Handling user action: ${action.action}`)

    // Check for custom handler
    const handler = this.actionHandlers.get(action.action)
    if (handler) {
      await handler(action, this.mcpTransport)
      return
    }

    // Check for tool mapping
    const toolName = this.actionMapping.get(action.action)
    if (toolName) {
      const result = await this.mcpTransport.callTool(
        toolName,
        action.context ?? {}
      )
      await this.handleMCPResult(action.surfaceId, result)
      return
    }

    // Default behavior: log action
    this.log(`No handler for action: ${action.action}`)
  }

  /**
   * Handle surface creation
   */
  private async handleCreateSurface(message: CreateSurfaceMessage): Promise<void> {
    this.log(`Surface created: ${message.surfaceId}`)

    // Cache data model
    if (message.dataModel) {
      this.dataModelCache.set(message.surfaceId, message.dataModel)
    }

    // Auto-sync with MCP resources if enabled
    if (this.autoSync && message.metadata?.mcpResourceUri) {
      await this.syncDataModel(
        message.surfaceId,
        message.metadata.mcpResourceUri as string
      )
    }
  }

  /**
   * Handle data model updates
   */
  private async handleDataModelUpdate(message: UpdateDataModelMessage): Promise<void> {
    // Update cached data model
    const cachedModel = this.dataModelCache.get(message.surfaceId)
    if (cachedModel) {
      message.updates.forEach((update) => {
        if (update.operation === 'set') {
          this.setNestedValue(cachedModel, update.path, update.value)
        } else if (update.operation === 'remove') {
          this.deleteNestedValue(cachedModel, update.path)
        }
      })
    }
  }

  /**
   * Handle MCP tool results
   */
  private async handleMCPResult(surfaceId: string, result: MCPToolResult): Promise<void> {
    if (result.isError) {
      this.a2uiTransport.send({
        type: 'error',
        code: 'MCP_TOOL_ERROR',
        message: result.content.find((c) => c.type === 'text')?.text ?? 'Tool execution failed',
      })
      return
    }

    // Extract data from result and update A2UI data model
    const updates = result.content
      .filter((c) => c.type === 'text' && c.text)
      .map((c) => {
        try {
          const data = JSON.parse(c.text!)
          return {
            path: '/mcpResult',
            operation: 'set' as const,
            value: data,
          }
        } catch {
          return {
            path: '/mcpResult',
            operation: 'set' as const,
            value: c.text,
          }
        }
      })

    if (updates.length > 0) {
      this.a2uiTransport.send({
        type: 'updateDataModel',
        surfaceId,
        updates,
      })
    }
  }

  /**
   * Handle MCP notifications
   */
  private handleMCPNotification(notification: unknown): void {
    this.log('Received MCP notification:', notification)
    // Could emit events or update UI based on notifications
  }

  /**
   * Handle MCP resource updates
   */
  private async handleResourceUpdate(params: unknown): Promise<void> {
    this.log('Resource updated:', params)

    // If auto-sync enabled, refresh data models
    if (this.autoSync) {
      for (const [surfaceId] of this.dataModelCache) {
        // Could fetch updated resource and sync with UI
        this.log(`Auto-sync for surface: ${surfaceId}`)
      }
    }
  }

  /**
   * Sync data model with MCP resource
   */
  private async syncDataModel(surfaceId: string, resourceUri: string): Promise<void> {
    try {
      const resource = await this.mcpTransport.readResource(resourceUri)

      let data: Record<string, unknown>
      if (resource.text) {
        data = JSON.parse(resource.text)
      } else {
        this.log(`Cannot sync binary resource: ${resourceUri}`)
        return
      }

      // Update A2UI data model
      this.a2uiTransport.send({
        type: 'updateDataModel',
        surfaceId,
        updates: [
          {
            path: '/',
            operation: 'set',
            value: data,
          },
        ],
      })

      // Update cache
      this.dataModelCache.set(surfaceId, data)
      this.log(`Synced data model for surface: ${surfaceId}`)
    } catch (error) {
      this.log(`Failed to sync data model: ${String(error)}`)
    }
  }

  /**
   * Set nested value using JSON Pointer path
   */
  private setNestedValue(
    obj: Record<string, unknown>,
    path: string,
    value: unknown
  ): void {
    const keys = path.split('/').filter((k) => k !== '')
    let current: any = obj

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]!
      if (!(key in current)) {
        current[key] = {}
      }
      current = current[key]
    }

    const lastKey = keys[keys.length - 1]
    if (lastKey) {
      current[lastKey] = value
    }
  }

  /**
   * Delete nested value using JSON Pointer path
   */
  private deleteNestedValue(obj: Record<string, unknown>, path: string): void {
    const keys = path.split('/').filter((k) => k !== '')
    let current: any = obj

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]!
      if (!(key in current)) {
        return
      }
      current = current[key]
    }

    const lastKey = keys[keys.length - 1]
    if (lastKey && lastKey in current) {
      delete current[lastKey]
    }
  }

  /**
   * Set up default action handlers
   */
  private setupDefaultHandlers(): void {
    // Example: Search action
    this.registerActionHandler('search', async (action, mcp) => {
      const query = action.context?.query as string | undefined
      if (!query) return

      // Could call MCP vector search or other tools
      this.log(`Search query: ${query}`)
    })

    // Example: Save action
    this.registerActionHandler('save', async (action, mcp) => {
      const data = action.dataModel
      if (!data) return

      this.log(`Saving data model:`, data)
      // Could persist to MCP resources or database
    })
  }

  /**
   * Debug logging
   */
  private log(message: string, ...args: unknown[]): void {
    if (this.debug) {
      console.log(`[A2UIToMCPBridge] ${message}`, ...args)
    }
  }
}
