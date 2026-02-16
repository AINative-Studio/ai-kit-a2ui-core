/**
 * Tests for Analytics Client Integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AnalyticsClient } from '../../src/integrations/analytics-client.js'
import type { TimeRange, AnalyticsFilter } from '../../src/types/analytics-components.js'

describe('AnalyticsClient', () => {
  let client: AnalyticsClient
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock

    client = new AnalyticsClient({
      apiUrl: 'https://api.example.com/analytics',
      apiKey: 'test-api-key',
    })
  })

  describe('query', () => {
    it('should execute analytics query', async () => {
      const mockResponse = {
        data: [
          {
            timestamp: '2024-01-01T00:00:00Z',
            values: { users: 100, revenue: 5000 },
          },
        ],
        metadata: {
          totalRecords: 1,
          executionTime: 150,
          cached: false,
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const timeRange: TimeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        preset: 'last_30_days',
      }

      const result = await client.query({
        timeRange,
        metrics: ['users', 'revenue'],
      })

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/query'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          }),
        })
      )

      expect(result.data).toHaveLength(1)
      expect(result.metadata.totalRecords).toBe(1)
    })

    it('should handle query with filters', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], metadata: {} }),
      })

      const filters: AnalyticsFilter[] = [
        {
          field: 'category',
          operator: 'equals',
          value: 'premium',
        },
      ]

      await client.query({
        timeRange: {
          start: new Date(),
          end: new Date(),
        },
        metrics: ['count'],
        filters,
      })

      expect(fetchMock).toHaveBeenCalled()
      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(callBody.filters).toEqual(filters)
    })

    it('should handle query errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(
        client.query({
          timeRange: {
            start: new Date(),
            end: new Date(),
          },
          metrics: ['users'],
        })
      ).rejects.toThrow('Query failed: 500 Internal Server Error')
    })
  })

  describe('export', () => {
    it('should export data to CSV', async () => {
      const mockResponse = {
        downloadUrl: 'https://example.com/export.csv',
        filename: 'analytics_export.csv',
        fileSize: 1024000,
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.export({
        format: 'csv',
        filename: 'analytics_export.csv',
        includeHeaders: true,
      })

      expect(result.downloadUrl).toBe('https://example.com/export.csv')
      expect(result.fileSize).toBe(1024000)
    })

    it('should export with filters and time range', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          downloadUrl: 'https://example.com/export.json',
          filename: 'data.json',
        }),
      })

      const filters: AnalyticsFilter[] = [
        { field: 'status', operator: 'equals', value: 'active' },
      ]

      const timeRange: TimeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
      }

      await client.export({
        format: 'json',
        filters,
        timeRange,
      })

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(callBody.filters).toEqual(filters)
      expect(callBody.timeRange).toBeDefined()
    })
  })

  describe('streamStart', () => {
    it('should start WebSocket streaming', async () => {
      const mockWebSocket = {
        addEventListener: vi.fn((event, handler) => {
          if (event === 'open') {
            // Immediately trigger open event
            setTimeout(() => handler(), 0)
          }
        }),
        send: vi.fn(),
        close: vi.fn(),
        readyState: 1,
      }

      global.WebSocket = vi.fn(() => mockWebSocket) as unknown as typeof WebSocket

      await client.streamStart({
        metrics: ['active_users'],
        interval: 5,
      })

      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('/stream')
      )
    })

    it('should handle stream configuration', async () => {
      const mockWebSocket = {
        addEventListener: vi.fn((event, handler) => {
          if (event === 'open') {
            setTimeout(() => handler(), 0)
          }
        }),
        send: vi.fn(),
        close: vi.fn(),
        readyState: 1,
      }

      global.WebSocket = vi.fn(() => mockWebSocket) as unknown as typeof WebSocket

      const filters: AnalyticsFilter[] = [
        { field: 'type', operator: 'equals', value: 'premium' },
      ]

      await client.streamStart({
        metrics: ['revenue', 'conversions'],
        interval: 10,
        filters,
      })

      expect(mockWebSocket.send).toHaveBeenCalled()
    })
  })

  describe('streamStop', () => {
    it('should stop WebSocket streaming', async () => {
      const mockWebSocket = {
        addEventListener: vi.fn((event, handler) => {
          if (event === 'open') {
            setTimeout(() => handler(), 0)
          }
        }),
        send: vi.fn(),
        close: vi.fn(),
        readyState: 1,
      }

      global.WebSocket = vi.fn(() => mockWebSocket) as unknown as typeof WebSocket

      await client.streamStart({
        metrics: ['active_users'],
        interval: 5,
      })

      await client.streamStop()

      expect(mockWebSocket.close).toHaveBeenCalled()
    })
  })

  describe('onStreamData', () => {
    it('should register stream data callback', async () => {
      const callback = vi.fn()
      const mockWebSocket = {
        addEventListener: vi.fn((event, handler) => {
          if (event === 'open') {
            setTimeout(() => handler(), 0)
          } else if (event === 'message') {
            // Simulate incoming message after connection
            setTimeout(() => {
              handler({
                data: JSON.stringify({
                  timestamp: new Date().toISOString(),
                  values: { active_users: 523 },
                }),
              })
            }, 10)
          }
        }),
        send: vi.fn(),
        close: vi.fn(),
        readyState: 1,
      }

      global.WebSocket = vi.fn(() => mockWebSocket) as unknown as typeof WebSocket

      client.onStreamData(callback)

      await client.streamStart({
        metrics: ['active_users'],
        interval: 5,
      })

      // Wait for simulated message
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(callback).toHaveBeenCalled()
    })
  })

  describe('Authentication', () => {
    it('should include API key in requests', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], metadata: {} }),
      })

      await client.query({
        timeRange: {
          start: new Date(),
          end: new Date(),
        },
        metrics: ['users'],
      })

      const headers = fetchMock.mock.calls[0][1].headers
      expect(headers.Authorization).toBe('Bearer test-api-key')
    })

    it('should support custom headers', async () => {
      const customClient = new AnalyticsClient({
        apiUrl: 'https://api.example.com/analytics',
        apiKey: 'test-key',
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      })

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], metadata: {} }),
      })

      await customClient.query({
        timeRange: {
          start: new Date(),
          end: new Date(),
        },
        metrics: ['users'],
      })

      const headers = fetchMock.mock.calls[0][1].headers
      expect(headers['X-Custom-Header']).toBe('custom-value')
    })
  })

  describe('Timeout handling', () => {
    it('should timeout long requests', async () => {
      const timeoutClient = new AnalyticsClient({
        apiUrl: 'https://api.example.com/analytics',
        apiKey: 'test-key',
        timeout: 100,
      })

      fetchMock.mockImplementationOnce(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            // Listen for abort signal
            options?.signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted', 'AbortError'))
            })

            // This will never resolve, timeout will trigger abort
            setTimeout(() => {
              // Should have been aborted by now
            }, 200)
          })
      )

      await expect(
        timeoutClient.query({
          timeRange: {
            start: new Date(),
            end: new Date(),
          },
          metrics: ['users'],
        })
      ).rejects.toThrow('Request timeout')
    })
  })

  describe('Retry logic', () => {
    it('should retry failed requests', async () => {
      const retryClient = new AnalyticsClient({
        apiUrl: 'https://api.example.com/analytics',
        apiKey: 'test-key',
        maxRetries: 2,
      })

      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [], metadata: {} }),
        })

      const result = await retryClient.query({
        timeRange: {
          start: new Date(),
          end: new Date(),
        },
        metrics: ['users'],
      })

      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(result).toBeDefined()
    })

    it('should fail after max retries', async () => {
      const retryClient = new AnalyticsClient({
        apiUrl: 'https://api.example.com/analytics',
        apiKey: 'test-key',
        maxRetries: 2,
      })

      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(
        retryClient.query({
          timeRange: {
            start: new Date(),
            end: new Date(),
          },
          metrics: ['users'],
        })
      ).rejects.toThrow()

      expect(fetchMock).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })
  })
})
