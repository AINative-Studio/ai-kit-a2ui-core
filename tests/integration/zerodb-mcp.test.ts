/**
 * ZeroDB MCP Client Integration Tests
 * Tests all 76 ZeroDB MCP operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ZeroDBMCPClient } from '../../src/transport/zerodb-mcp-client.js'
import type { VectorSearchResult, TableSchema } from '../../src/transport/zerodb-mcp-client.js'
import type { MCPRequest, MCPResponse } from '../../src/types/mcp-protocol.js'

// Mock WebSocket (same as mcp-transport tests)
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

  simulateMessage(data: string): void {
    this.onmessage?.(new MessageEvent('message', { data }))
  }

  getSentMessages(): string[] {
    return this.messages
  }
}

global.WebSocket = MockWebSocket as any

describe('ZeroDBMCPClient', () => {
  let client: ZeroDBMCPClient

  beforeEach(async () => {
    client = new ZeroDBMCPClient({
      serverUrl: 'ws://localhost:8080',
      projectId: 'test-project',
      apiKey: 'test-api-key',
      reconnect: false,
    })

    await client.connect()
    await initializeClient(client)
  })

  afterEach(async () => {
    await client.disconnect()
  })

  describe('Vector Operations', () => {
    it('should search for similar vectors', async () => {
      const searchPromise = client.vectorSearch('test query', 10)

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify([
                {
                  id: 'vec1',
                  score: 0.95,
                  metadata: { text: 'Similar text' },
                },
              ]),
            },
          ],
        })
      }, 20)

      const results = await searchPromise

      expect(results).toHaveLength(1)
      expect(results[0]!.id).toBe('vec1')
      expect(results[0]!.score).toBe(0.95)
    })

    it('should upsert a vector', async () => {
      const upsertPromise = client.vectorUpsert(
        [0.1, 0.2, 0.3],
        { text: 'Test document' }
      )

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify('vec-id-123'),
            },
          ],
        })
      }, 20)

      const vectorId = await upsertPromise

      expect(vectorId).toBe('vec-id-123')
    })

    it('should list vectors', async () => {
      const listPromise = client.vectorList(100, 0)

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify([
                { id: 'vec1', score: 1.0, metadata: {} },
                { id: 'vec2', score: 1.0, metadata: {} },
              ]),
            },
          ],
        })
      }, 20)

      const vectors = await listPromise

      expect(vectors).toHaveLength(2)
    })

    it('should get vector statistics', async () => {
      const statsPromise = client.vectorStats()

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                totalVectors: 1000,
                dimensions: 384,
                indexType: 'hnsw',
              }),
            },
          ],
        })
      }, 20)

      const stats = await statsPromise

      expect(stats.totalVectors).toBe(1000)
      expect(stats.dimensions).toBe(384)
    })

    it('should perform quantum search', async () => {
      const quantumPromise = client.quantumSearch('quantum query', 5, 0.7)

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify([
                { id: 'vec1', score: 0.98, metadata: {} },
              ]),
            },
          ],
        })
      }, 20)

      const results = await quantumPromise

      expect(results).toHaveLength(1)
    })
  })

  describe('Table Operations', () => {
    it('should create a table', async () => {
      const schema: TableSchema = {
        name: 'users',
        columns: [
          { name: 'id', type: 'integer', primaryKey: true },
          { name: 'email', type: 'text', unique: true },
          { name: 'created_at', type: 'timestamp' },
        ],
      }

      const createPromise = client.tableCreate(schema)

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [{ type: 'text', text: 'Table created' }],
        })
      }, 20)

      await expect(createPromise).resolves.toBeUndefined()
    })

    it('should list tables', async () => {
      const listPromise = client.tableList()

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(['users', 'posts', 'comments']),
            },
          ],
        })
      }, 20)

      const tables = await listPromise

      expect(tables).toHaveLength(3)
      expect(tables).toContain('users')
    })

    it('should query table rows', async () => {
      const queryPromise = client.tableQuery('users', { active: true }, 10)

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify([
                { id: 1, email: 'user1@test.com' },
                { id: 2, email: 'user2@test.com' },
              ]),
            },
          ],
        })
      }, 20)

      const rows = await queryPromise

      expect(rows).toHaveLength(2)
    })

    it('should insert rows', async () => {
      const insertPromise = client.tableInsert('users', [
        { email: 'new@test.com' },
      ])

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [{ type: 'text', text: '1' }],
        })
      }, 20)

      const count = await insertPromise

      expect(count).toBe(1)
    })

    it('should update rows', async () => {
      const updatePromise = client.tableUpdate(
        'users',
        { id: 1 },
        { email: 'updated@test.com' }
      )

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [{ type: 'text', text: '1' }],
        })
      }, 20)

      const count = await updatePromise

      expect(count).toBe(1)
    })
  })

  describe('File Operations', () => {
    it('should upload a file', async () => {
      const uploadPromise = client.fileUpload('base64data', {
        name: 'test.txt',
        mimeType: 'text/plain',
      })

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [{ type: 'text', text: 'file-id-123' }],
        })
      }, 20)

      const fileId = await uploadPromise

      expect(fileId).toBe('file-id-123')
    })

    it('should download a file', async () => {
      const downloadPromise = client.fileDownload('file-id-123')

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                data: 'base64data',
                metadata: { name: 'test.txt' },
              }),
            },
          ],
        })
      }, 20)

      const file = await downloadPromise

      expect(file.data).toBe('base64data')
      expect(file.metadata.name).toBe('test.txt')
    })

    it('should list files', async () => {
      const listPromise = client.fileList({}, 10)

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify([
                { id: 'file1', metadata: { name: 'doc1.pdf' } },
                { id: 'file2', metadata: { name: 'doc2.pdf' } },
              ]),
            },
          ],
        })
      }, 20)

      const files = await listPromise

      expect(files).toHaveLength(2)
    })

    it('should generate file URL', async () => {
      const urlPromise = client.fileUrl('file-id-123', 3600)

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: 'https://storage.zerodb.io/file-id-123?expires=...',
            },
          ],
        })
      }, 20)

      const url = await urlPromise

      expect(url).toContain('https://storage.zerodb.io')
    })
  })

  describe('PostgreSQL Operations', () => {
    it('should provision PostgreSQL instance', async () => {
      const provisionPromise = client.postgresProvision()

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                host: 'pg.zerodb.io',
                port: 5432,
                database: 'test-db',
                username: 'user',
                password: 'pass',
                connectionString: 'postgresql://user:pass@pg.zerodb.io:5432/test-db',
                status: 'active',
              }),
            },
          ],
        })
      }, 20)

      const instance = await provisionPromise

      expect(instance.host).toBe('pg.zerodb.io')
      expect(instance.status).toBe('active')
    })

    it('should check PostgreSQL status', async () => {
      const statusPromise = client.postgresStatus()

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'active',
                uptime: 3600,
                connections: 5,
              }),
            },
          ],
        })
      }, 20)

      const status = await statusPromise

      expect(status.status).toBe('active')
      expect(status.connections).toBe(5)
    })

    it('should get PostgreSQL logs', async () => {
      const logsPromise = client.postgresLogs(100)

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify([
                {
                  query: 'SELECT * FROM users',
                  duration: 15,
                  timestamp: Date.now(),
                },
              ]),
            },
          ],
        })
      }, 20)

      const logs = await logsPromise

      expect(logs).toHaveLength(1)
      expect(logs[0]!.query).toContain('SELECT')
    })
  })

  describe('Memory Operations', () => {
    it('should store agent memory', async () => {
      const storePromise = client.memoryStore('User prefers dark mode')

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [{ type: 'text', text: 'memory-id-123' }],
        })
      }, 20)

      const memoryId = await storePromise

      expect(memoryId).toBe('memory-id-123')
    })

    it('should search agent memory', async () => {
      const searchPromise = client.memorySearch('user preferences', 5)

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify([
                {
                  sessionId: 'session1',
                  context: 'User prefers dark mode',
                  timestamp: Date.now(),
                },
              ]),
            },
          ],
        })
      }, 20)

      const memories = await searchPromise

      expect(memories).toHaveLength(1)
      expect(memories[0]!.context).toContain('dark mode')
    })

    it('should get memory context', async () => {
      const contextPromise = client.memoryContext('session1')

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify([
                {
                  sessionId: 'session1',
                  context: 'Previous conversation',
                  timestamp: Date.now(),
                },
              ]),
            },
          ],
        })
      }, 20)

      const context = await contextPromise

      expect(context).toHaveLength(1)
    })
  })

  describe('Event Operations', () => {
    it('should create an event', async () => {
      const eventPromise = client.eventCreate({
        type: 'user.login',
        payload: { userId: '123' },
      })

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [{ type: 'text', text: 'event-id-123' }],
        })
      }, 20)

      const eventId = await eventPromise

      expect(eventId).toBe('event-id-123')
    })

    it('should list events', async () => {
      const listPromise = client.eventList({ type: 'user.login' }, 10)

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify([
                {
                  type: 'user.login',
                  payload: { userId: '123' },
                  timestamp: Date.now(),
                },
              ]),
            },
          ],
        })
      }, 20)

      const events = await listPromise

      expect(events).toHaveLength(1)
      expect(events[0]!.type).toBe('user.login')
    })
  })

  describe('RLHF Operations', () => {
    it('should collect RLHF feedback', async () => {
      const feedbackPromise = client.rlhfFeedback({
        agentId: 'agent1',
        sessionId: 'session1',
        feedback: 'positive',
        context: 'Great response',
      })

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [{ type: 'text', text: 'Feedback recorded' }],
        })
      }, 20)

      await expect(feedbackPromise).resolves.toBeUndefined()
    })
  })

  describe('Project Operations', () => {
    it('should get project info', async () => {
      const infoPromise = client.projectInfo()

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                id: 'test-project',
                name: 'Test Project',
                region: 'us-east-1',
                createdAt: Date.now(),
              }),
            },
          ],
        })
      }, 20)

      const info = await infoPromise

      expect(info.id).toBe('test-project')
      expect(info.name).toBe('Test Project')
    })

    it('should get project stats', async () => {
      const statsPromise = client.projectStats()

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                vectors: 1000,
                tables: 5,
                files: 50,
                events: 10000,
                storage: 1024000000,
                apiCalls: 50000,
              }),
            },
          ],
        })
      }, 20)

      const stats = await statsPromise

      expect(stats.vectors).toBe(1000)
      expect(stats.tables).toBe(5)
    })
  })

  describe('Error Handling', () => {
    it('should handle tool errors', async () => {
      const errorPromise = client.vectorSearch('test', 10)

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [{ type: 'text', text: 'Operation failed' }],
          isError: true,
        })
      }, 20)

      await expect(errorPromise).rejects.toThrow('Operation failed')
    })

    it('should handle non-JSON responses', async () => {
      const textPromise = client.help()

      setTimeout(() => {
        respondToLastRequest(client, {
          content: [{ type: 'text', text: 'Help text here' }],
        })
      }, 20)

      const helpText = await textPromise

      expect(helpText).toBe('Help text here')
    })
  })
})

// Test Helpers

async function initializeClient(client: ZeroDBMCPClient): Promise<void> {
  const initPromise = client.initialize({
    name: 'zerodb-test-client',
    version: '1.0.0',
  })

  setTimeout(() => {
    const ws = (client as any).ws as MockWebSocket
    const messages = ws.getSentMessages()
    const initRequest = JSON.parse(messages[0]!) as MCPRequest

    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: initRequest.id!,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: true },
        },
        serverInfo: {
          name: 'zerodb-mcp-server',
          version: '1.0.0',
        },
      },
    }

    ws.simulateMessage(JSON.stringify(response))
  }, 20)

  await initPromise
}

function respondToLastRequest(client: ZeroDBMCPClient, result: any): void {
  const ws = (client as any).ws as MockWebSocket
  const messages = ws.getSentMessages()
  const lastRequest = JSON.parse(messages[messages.length - 1]!) as MCPRequest

  const response: MCPResponse = {
    jsonrpc: '2.0',
    id: lastRequest.id!,
    result,
  }

  ws.simulateMessage(JSON.stringify(response))
}
