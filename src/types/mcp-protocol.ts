/**
 * Model Context Protocol (MCP) Type Definitions
 * Based on MCP Specification for Claude Desktop and MCP Servers
 *
 * MCP is a JSON-RPC 2.0 based protocol for agent-server communication
 */

/**
 * JSON-RPC 2.0 version identifier
 */
export type JsonRpcVersion = '2.0'

/**
 * JSON Schema type for tool input validation
 */
export interface JSONSchema {
  type?: string
  properties?: Record<string, JSONSchema>
  required?: string[]
  items?: JSONSchema
  description?: string
  enum?: unknown[]
  additionalProperties?: boolean | JSONSchema
  [key: string]: unknown
}

/**
 * MCP Client Information
 * Provided during initialization
 */
export interface MCPClientInfo {
  /** Client name (e.g., "claude-desktop") */
  name: string
  /** Client version (e.g., "1.0.0") */
  version: string
  /** Client capabilities */
  capabilities?: {
    /** Supports workspace roots */
    roots?: boolean
    /** Supports sampling */
    sampling?: boolean
    /** Experimental features */
    experimental?: Record<string, unknown>
  }
}

/**
 * MCP Server Information
 * Returned during initialization
 */
export interface MCPServerInfo {
  /** Server name (e.g., "zerodb-mcp-server") */
  name: string
  /** Server version (e.g., "1.0.0") */
  version: string
}

/**
 * MCP Server Capabilities
 * Defines what the server can do
 */
export interface MCPCapabilities {
  /** Tool capabilities */
  tools?: {
    /** List of available tools */
    listChanged?: boolean
  }
  /** Resource capabilities */
  resources?: {
    /** Support for resource subscriptions */
    subscribe?: boolean
    /** List of available resources */
    listChanged?: boolean
  }
  /** Prompt capabilities */
  prompts?: {
    /** List of available prompts */
    listChanged?: boolean
  }
  /** Logging capabilities */
  logging?: Record<string, unknown>
  /** Experimental capabilities */
  experimental?: Record<string, unknown>
}

/**
 * MCP Initialize Result
 * Response to initialization request
 */
export interface MCPInitializeResult {
  /** Protocol version (e.g., "2024-11-05") */
  protocolVersion: string
  /** Server capabilities */
  capabilities: MCPCapabilities
  /** Server information */
  serverInfo: MCPServerInfo
  /** Additional instructions for the client */
  instructions?: string
}

/**
 * MCP Tool Definition
 * Describes a callable tool/function
 */
export interface MCPTool {
  /** Unique tool name */
  name: string
  /** Human-readable description */
  description: string
  /** JSON Schema for input validation */
  inputSchema: JSONSchema
}

/**
 * MCP Tool Content Block
 * Result content from tool execution
 */
export interface MCPToolContentBlock {
  /** Content type */
  type: 'text' | 'image' | 'resource'
  /** Text content (for type=text) */
  text?: string
  /** Base64 encoded data (for type=image) */
  data?: string
  /** MIME type (for type=image) */
  mimeType?: string
  /** Resource URI (for type=resource) */
  uri?: string
}

/**
 * MCP Tool Call Result
 * Response from tool execution
 */
export interface MCPToolResult {
  /** Result content blocks */
  content: MCPToolContentBlock[]
  /** Whether this is an error result */
  isError?: boolean
  /** Additional metadata */
  [key: string]: unknown
}

/**
 * MCP Resource Definition
 * Describes an accessible resource
 */
export interface MCPResource {
  /** Resource URI (e.g., "file:///path/to/file") */
  uri: string
  /** Human-readable name */
  name: string
  /** Optional description */
  description?: string
  /** MIME type (e.g., "text/plain") */
  mimeType?: string
  /** Optional metadata */
  metadata?: Record<string, unknown>
}

/**
 * MCP Resource Contents
 * The actual content of a resource
 */
export interface MCPResourceContents {
  /** Resource URI */
  uri: string
  /** MIME type */
  mimeType?: string
  /** Text content */
  text?: string
  /** Binary content (base64) */
  blob?: string
}

/**
 * MCP Prompt Definition
 * Describes a prompt template
 */
export interface MCPPrompt {
  /** Prompt name */
  name: string
  /** Description */
  description?: string
  /** Prompt arguments */
  arguments?: Array<{
    name: string
    description?: string
    required?: boolean
  }>
}

/**
 * MCP Prompt Message
 * A message in a prompt
 */
export interface MCPPromptMessage {
  /** Role (user, assistant, system) */
  role: 'user' | 'assistant' | 'system'
  /** Message content */
  content: {
    type: 'text' | 'image' | 'resource'
    text?: string
    data?: string
    mimeType?: string
    uri?: string
  }
}

/**
 * MCP Prompt Result
 * Response to a prompt request
 */
export interface MCPPromptResult {
  /** Description of the prompt */
  description?: string
  /** Messages in the prompt */
  messages: MCPPromptMessage[]
}

/**
 * MCP JSON-RPC Request
 * Base request structure
 */
export interface MCPRequest {
  /** JSON-RPC version */
  jsonrpc: JsonRpcVersion
  /** Request ID (for responses) */
  id?: string | number
  /** Method name */
  method: string
  /** Method parameters */
  params?: Record<string, unknown> | unknown[]
}

/**
 * MCP JSON-RPC Response
 * Base response structure
 */
export interface MCPResponse {
  /** JSON-RPC version */
  jsonrpc: JsonRpcVersion
  /** Request ID (matching request) */
  id: string | number
  /** Result (success) */
  result?: unknown
  /** Error (failure) */
  error?: MCPError
}

/**
 * MCP JSON-RPC Error
 * Error response structure
 */
export interface MCPError {
  /** Error code */
  code: number
  /** Error message */
  message: string
  /** Additional error data */
  data?: unknown
}

/**
 * MCP JSON-RPC Notification
 * One-way message (no response expected)
 */
export interface MCPNotification {
  /** JSON-RPC version */
  jsonrpc: JsonRpcVersion
  /** Method name */
  method: string
  /** Method parameters */
  params?: Record<string, unknown> | unknown[]
}

/**
 * Union type for all MCP messages
 */
export type MCPMessage = MCPRequest | MCPResponse | MCPNotification

/**
 * MCP Standard Error Codes (JSON-RPC 2.0)
 */
export const MCPErrorCode = {
  /** Invalid JSON was received */
  PARSE_ERROR: -32700,
  /** Invalid request object */
  INVALID_REQUEST: -32600,
  /** Method not found */
  METHOD_NOT_FOUND: -32601,
  /** Invalid method parameters */
  INVALID_PARAMS: -32602,
  /** Internal server error */
  INTERNAL_ERROR: -32603,
} as const

/**
 * MCP Standard Methods
 */
export const MCPMethod = {
  // Initialization
  INITIALIZE: 'initialize',
  INITIALIZED: 'initialized',
  SHUTDOWN: 'shutdown',

  // Tools
  TOOLS_LIST: 'tools/list',
  TOOLS_CALL: 'tools/call',

  // Resources
  RESOURCES_LIST: 'resources/list',
  RESOURCES_READ: 'resources/read',
  RESOURCES_SUBSCRIBE: 'resources/subscribe',
  RESOURCES_UNSUBSCRIBE: 'resources/unsubscribe',

  // Prompts
  PROMPTS_LIST: 'prompts/list',
  PROMPTS_GET: 'prompts/get',

  // Logging
  LOGGING_SET_LEVEL: 'logging/setLevel',

  // Notifications
  NOTIFICATION_CANCELLED: 'notifications/cancelled',
  NOTIFICATION_PROGRESS: 'notifications/progress',
  NOTIFICATION_MESSAGE: 'notifications/message',
  NOTIFICATION_RESOURCES_UPDATED: 'notifications/resources/updated',
  NOTIFICATION_RESOURCES_LIST_CHANGED: 'notifications/resources/list_changed',
  NOTIFICATION_TOOLS_LIST_CHANGED: 'notifications/tools/list_changed',
  NOTIFICATION_PROMPTS_LIST_CHANGED: 'notifications/prompts/list_changed',
} as const

/**
 * Type guards for MCP messages
 */
export function isMCPRequest(message: MCPMessage): message is MCPRequest {
  return 'method' in message && ('id' in message || !('result' in message) && !('error' in message))
}

export function isMCPResponse(message: MCPMessage): message is MCPResponse {
  return 'id' in message && ('result' in message || 'error' in message)
}

export function isMCPNotification(message: MCPMessage): message is MCPNotification {
  return 'method' in message && !('id' in message)
}

export function isMCPError(response: MCPResponse): response is MCPResponse & { error: MCPError } {
  return 'error' in response && response.error !== undefined
}

/**
 * MCP Transport Protocol Type
 */
export type MCPTransportProtocol = 'ws' | 'wss' | 'stdio' | 'http' | 'https'

/**
 * MCP Connection State
 */
export type MCPConnectionState = 'disconnected' | 'connecting' | 'connected' | 'initializing' | 'ready' | 'error'
