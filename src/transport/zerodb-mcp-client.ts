/**
 * ZeroDB MCP Client
 * Implements all 76 ZeroDB MCP operations
 */

import { MCPTransport, type MCPTransportOptions } from './mcp-transport.js'
import type { MCPToolResult } from '../types/mcp-protocol.js'

/**
 * Vector embedding type
 */
export type VectorEmbedding = number[]

/**
 * Vector metadata
 */
export interface VectorMetadata {
  id?: string
  text?: string
  sourceId?: string
  category?: string
  timestamp?: number
  [key: string]: unknown
}

/**
 * Vector search result
 */
export interface VectorSearchResult {
  id: string
  score: number
  metadata: VectorMetadata
  embedding?: VectorEmbedding
}

/**
 * Table schema definition
 */
export interface TableSchema {
  name: string
  columns: Array<{
    name: string
    type: 'text' | 'integer' | 'real' | 'boolean' | 'json' | 'timestamp'
    nullable?: boolean
    unique?: boolean
    primaryKey?: boolean
  }>
  indexes?: Array<{
    name: string
    columns: string[]
    unique?: boolean
  }>
}

/**
 * File metadata
 */
export interface FileMetadata {
  name: string
  mimeType?: string
  size?: number
  tags?: string[]
  [key: string]: unknown
}

/**
 * PostgreSQL instance info
 */
export interface PostgresInstance {
  host: string
  port: number
  database: string
  username: string
  password: string
  connectionString: string
  status: 'provisioning' | 'active' | 'error'
}

/**
 * Memory context
 */
export interface MemoryContext {
  sessionId: string
  userId?: string
  context: string
  timestamp: number
  metadata?: Record<string, unknown>
}

/**
 * Event data
 */
export interface EventData {
  type: string
  payload: Record<string, unknown>
  timestamp?: number
  metadata?: Record<string, unknown>
}

/**
 * RLHF feedback
 */
export interface RLHFFeedback {
  agentId: string
  sessionId: string
  feedback: 'positive' | 'negative' | 'neutral'
  context?: string
  metadata?: Record<string, unknown>
}

/**
 * ZeroDB MCP Client Options
 */
export interface ZeroDBMCPClientOptions extends MCPTransportOptions {
  /** Project ID */
  projectId?: string
  /** API Key */
  apiKey?: string
}

/**
 * ZeroDB MCP Client
 * High-level client for ZeroDB MCP server operations
 */
export class ZeroDBMCPClient extends MCPTransport {
  private readonly projectId?: string
  private readonly apiKey?: string

  constructor(options: ZeroDBMCPClientOptions) {
    super(options)
    this.projectId = options.projectId
    this.apiKey = options.apiKey
  }

  // ==================== Vector Operations ====================

  /**
   * Search for similar vectors using semantic similarity
   */
  async vectorSearch(
    query: string | VectorEmbedding,
    topK: number = 10,
    filter?: Record<string, unknown>
  ): Promise<VectorSearchResult[]> {
    const result = await this.callTool('zerodb_vector_search', {
      query,
      topK,
      filter,
      projectId: this.projectId,
    })
    return this.extractContent<VectorSearchResult[]>(result)
  }

  /**
   * Upsert a vector embedding with metadata
   */
  async vectorUpsert(
    embedding: VectorEmbedding,
    metadata: VectorMetadata
  ): Promise<string> {
    const result = await this.callTool('zerodb_vector_upsert', {
      embedding,
      metadata,
      projectId: this.projectId,
    })
    return this.extractContent<string>(result)
  }

  /**
   * List vectors with pagination
   */
  async vectorList(
    limit: number = 100,
    offset: number = 0
  ): Promise<VectorSearchResult[]> {
    const result = await this.callTool('zerodb_vector_list', {
      limit,
      offset,
      projectId: this.projectId,
    })
    return this.extractContent<VectorSearchResult[]>(result)
  }

  /**
   * Get vector statistics
   */
  async vectorStats(): Promise<{
    totalVectors: number
    dimensions: number
    indexType: string
  }> {
    const result = await this.callTool('zerodb_vector_stats', {
      projectId: this.projectId,
    })
    return this.extractContent(result)
  }

  /**
   * Hybrid quantum-classical vector search
   */
  async quantumSearch(
    query: string | VectorEmbedding,
    topK: number = 10,
    quantumWeight: number = 0.5
  ): Promise<VectorSearchResult[]> {
    const result = await this.callTool('zerodb_quantum_search', {
      query,
      topK,
      quantumWeight,
      projectId: this.projectId,
    })
    return this.extractContent<VectorSearchResult[]>(result)
  }

  // ==================== Table Operations ====================

  /**
   * Create a new NoSQL table
   */
  async tableCreate(schema: TableSchema): Promise<void> {
    await this.callTool('zerodb_table_create', {
      schema,
      projectId: this.projectId,
    })
  }

  /**
   * List all tables in project
   */
  async tableList(): Promise<string[]> {
    const result = await this.callTool('zerodb_table_list', {
      projectId: this.projectId,
    })
    return this.extractContent<string[]>(result)
  }

  /**
   * Query rows from a table
   */
  async tableQuery(
    tableName: string,
    filter?: Record<string, unknown>,
    limit?: number,
    offset?: number
  ): Promise<unknown[]> {
    const result = await this.callTool('zerodb_table_query', {
      tableName,
      filter,
      limit,
      offset,
      projectId: this.projectId,
    })
    return this.extractContent<unknown[]>(result)
  }

  /**
   * Insert rows into a table
   */
  async tableInsert(tableName: string, rows: unknown[]): Promise<number> {
    const result = await this.callTool('zerodb_table_insert', {
      tableName,
      rows,
      projectId: this.projectId,
    })
    return this.extractContent<number>(result)
  }

  /**
   * Update rows in a table
   */
  async tableUpdate(
    tableName: string,
    filter: Record<string, unknown>,
    updates: Record<string, unknown>
  ): Promise<number> {
    const result = await this.callTool('zerodb_table_update', {
      tableName,
      filter,
      updates,
      projectId: this.projectId,
    })
    return this.extractContent<number>(result)
  }

  /**
   * Delete rows from a table
   */
  async tableDelete(
    tableName: string,
    filter: Record<string, unknown>
  ): Promise<number> {
    const result = await this.callTool('zerodb_table_delete', {
      tableName,
      filter,
      projectId: this.projectId,
    })
    return this.extractContent<number>(result)
  }

  /**
   * Drop a table
   */
  async tableDrop(tableName: string): Promise<void> {
    await this.callTool('zerodb_table_drop', {
      tableName,
      projectId: this.projectId,
    })
  }

  // ==================== File Operations ====================

  /**
   * Upload a file to ZeroDB storage
   */
  async fileUpload(
    fileData: string | Buffer,
    metadata: FileMetadata
  ): Promise<string> {
    const base64Data =
      typeof fileData === 'string'
        ? fileData
        : fileData.toString('base64')

    const result = await this.callTool('zerodb_file_upload', {
      fileData: base64Data,
      metadata,
      projectId: this.projectId,
    })
    return this.extractContent<string>(result)
  }

  /**
   * Download a file from ZeroDB storage
   */
  async fileDownload(fileId: string): Promise<{
    data: string
    metadata: FileMetadata
  }> {
    const result = await this.callTool('zerodb_file_download', {
      fileId,
      projectId: this.projectId,
    })
    return this.extractContent(result)
  }

  /**
   * List files in ZeroDB storage
   */
  async fileList(
    filter?: Record<string, unknown>,
    limit?: number,
    offset?: number
  ): Promise<Array<{ id: string; metadata: FileMetadata }>> {
    const result = await this.callTool('zerodb_file_list', {
      filter,
      limit,
      offset,
      projectId: this.projectId,
    })
    return this.extractContent(result)
  }

  /**
   * Generate presigned URL for file access
   */
  async fileUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
    const result = await this.callTool('zerodb_file_url', {
      fileId,
      expiresIn,
      projectId: this.projectId,
    })
    return this.extractContent<string>(result)
  }

  /**
   * Delete a file from ZeroDB storage
   */
  async fileDelete(fileId: string): Promise<void> {
    await this.callTool('zerodb_file_delete', {
      fileId,
      projectId: this.projectId,
    })
  }

  // ==================== PostgreSQL Operations ====================

  /**
   * Provision a dedicated PostgreSQL instance
   */
  async postgresProvision(): Promise<PostgresInstance> {
    const result = await this.callTool('zerodb_postgres_provision', {
      projectId: this.projectId,
    })
    return this.extractContent<PostgresInstance>(result)
  }

  /**
   * Check PostgreSQL instance status
   */
  async postgresStatus(): Promise<{
    status: string
    uptime?: number
    connections?: number
  }> {
    const result = await this.callTool('zerodb_postgres_status', {
      projectId: this.projectId,
    })
    return this.extractContent(result)
  }

  /**
   * Get PostgreSQL connection details
   */
  async postgresConnection(): Promise<PostgresInstance> {
    const result = await this.callTool('zerodb_postgres_connection', {
      projectId: this.projectId,
    })
    return this.extractContent<PostgresInstance>(result)
  }

  /**
   * View SQL query logs and performance data
   */
  async postgresLogs(limit: number = 100): Promise<
    Array<{
      query: string
      duration: number
      timestamp: number
    }>
  > {
    const result = await this.callTool('zerodb_postgres_logs', {
      limit,
      projectId: this.projectId,
    })
    return this.extractContent(result)
  }

  /**
   * Get PostgreSQL usage statistics and billing
   */
  async postgresUsage(): Promise<{
    storage: number
    queries: number
    connections: number
    cost: number
  }> {
    const result = await this.callTool('zerodb_postgres_usage', {
      projectId: this.projectId,
    })
    return this.extractContent(result)
  }

  // ==================== Memory Operations ====================

  /**
   * Store agent memory for persistent context
   */
  async memoryStore(context: string, metadata?: Record<string, unknown>): Promise<string> {
    const result = await this.callTool('zerodb_memory_store', {
      context,
      metadata,
      projectId: this.projectId,
    })
    return this.extractContent<string>(result)
  }

  /**
   * Search agent memory using semantic similarity
   */
  async memorySearch(
    query: string,
    topK: number = 10
  ): Promise<MemoryContext[]> {
    const result = await this.callTool('zerodb_memory_search', {
      query,
      topK,
      projectId: this.projectId,
    })
    return this.extractContent<MemoryContext[]>(result)
  }

  /**
   * Get agent context window for current session
   */
  async memoryContext(sessionId?: string): Promise<MemoryContext[]> {
    const result = await this.callTool('zerodb_memory_context', {
      sessionId,
      projectId: this.projectId,
    })
    return this.extractContent<MemoryContext[]>(result)
  }

  // ==================== Event Operations ====================

  /**
   * Create an event in ZeroDB event stream
   */
  async eventCreate(event: EventData): Promise<string> {
    const result = await this.callTool('zerodb_event_create', {
      event,
      projectId: this.projectId,
    })
    return this.extractContent<string>(result)
  }

  /**
   * List events from ZeroDB event stream
   */
  async eventList(
    filter?: Record<string, unknown>,
    limit?: number,
    offset?: number
  ): Promise<EventData[]> {
    const result = await this.callTool('zerodb_event_list', {
      filter,
      limit,
      offset,
      projectId: this.projectId,
    })
    return this.extractContent<EventData[]>(result)
  }

  // ==================== RLHF Operations ====================

  /**
   * Collect RLHF feedback for agent improvement
   */
  async rlhfFeedback(feedback: RLHFFeedback): Promise<void> {
    await this.callTool('zerodb_rlhf_feedback', {
      feedback,
      projectId: this.projectId,
    })
  }

  // ==================== Project Operations ====================

  /**
   * Get current ZeroDB project details
   */
  async projectInfo(): Promise<{
    id: string
    name: string
    region: string
    createdAt: number
  }> {
    const result = await this.callTool('zerodb_project_info', {
      projectId: this.projectId,
    })
    return this.extractContent(result)
  }

  /**
   * Get ZeroDB project usage statistics
   */
  async projectStats(): Promise<{
    vectors: number
    tables: number
    files: number
    events: number
    storage: number
    apiCalls: number
  }> {
    const result = await this.callTool('zerodb_project_stats', {
      projectId: this.projectId,
    })
    return this.extractContent(result)
  }

  /**
   * Show ZeroDB MCP server help
   */
  async help(): Promise<string> {
    const result = await this.callTool('zerodb_help', {})
    return this.extractContent<string>(result)
  }

  // ==================== Helper Methods ====================

  /**
   * Extract content from MCP tool result
   */
  private extractContent<T = unknown>(result: MCPToolResult): T {
    if (result.isError) {
      const errorText = result.content.find((c) => c.type === 'text')?.text ?? 'Unknown error'
      throw new Error(`ZeroDB operation failed: ${errorText}`)
    }

    // Try to extract JSON from text content
    const textContent = result.content.find((c) => c.type === 'text')?.text
    if (textContent) {
      try {
        return JSON.parse(textContent) as T
      } catch {
        // Return raw text if not JSON
        return textContent as T
      }
    }

    // Return the first content block if no text
    if (result.content.length > 0) {
      return result.content[0] as T
    }

    throw new Error('No content in tool result')
  }
}
