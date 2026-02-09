/**
 * Search Message Handlers Tests
 * Tests for semantic video search protocol (Issue #27)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { A2UITransport } from '../../src/transport/transport.js'
import type {
  SearchVideosMessage,
  SearchResultsMessage,
  VideoSearchResult,
  VideoSearchFilters,
} from '../../src/types/index.js'
import {
  isSearchVideosMessage,
  isSearchResultsMessage,
} from '../../src/types/index.js'

// Mock CloseEvent for Node.js environment
class MockCloseEvent extends Event {
  constructor(type: string) {
    super(type)
  }
}
global.CloseEvent = MockCloseEvent as any

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(public url: string) {
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open')
    }
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'))
    }
  }

  // Helper to simulate incoming message
  simulateMessage(message: any): void {
    if (this.onmessage) {
      const event = {
        data: JSON.stringify(message),
      } as MessageEvent
      this.onmessage(event)
    }
  }
}

// Replace global WebSocket with mock
global.WebSocket = MockWebSocket as any

describe('Search Message Handlers', () => {
  let transport: A2UITransport
  let mockWs: MockWebSocket

  beforeEach(async () => {
    transport = new A2UITransport('wss://test.example.com')
    await transport.connect()
    // Access the mock WebSocket instance
    mockWs = (transport as any).ws as MockWebSocket
  })

  afterEach(() => {
    transport.disconnect()
  })

  describe('Type Guards', () => {
    it('identifies searchVideos messages correctly', () => {
      const searchMsg: SearchVideosMessage = {
        type: 'searchVideos',
        query: 'test query',
      }

      expect(isSearchVideosMessage(searchMsg)).toBe(true)
      expect(isSearchResultsMessage(searchMsg)).toBe(false)
    })

    it('identifies searchResults messages correctly', () => {
      const resultsMsg: SearchResultsMessage = {
        type: 'searchResults',
        query: 'test query',
        results: [],
        totalResults: 0,
      }

      expect(isSearchResultsMessage(resultsMsg)).toBe(true)
      expect(isSearchVideosMessage(resultsMsg)).toBe(false)
    })

    it('rejects non-search messages', () => {
      const otherMsg = {
        type: 'createSurface',
        surfaceId: 'test',
        components: [],
      } as any

      expect(isSearchVideosMessage(otherMsg)).toBe(false)
      expect(isSearchResultsMessage(otherMsg)).toBe(false)
    })
  })

  describe('SearchVideosMessage Handler', () => {
    it('handles basic search request', async () => {
      const searchQuery = 'machine learning tutorial'
      let received = false

      transport.on('searchVideos', (message) => {
        expect(message.type).toBe('searchVideos')
        expect(message.query).toBe(searchQuery)
        expect(message.filters).toBeUndefined()
        expect(message.context).toBeUndefined()
        received = true
      })

      const searchMessage: SearchVideosMessage = {
        type: 'searchVideos',
        query: searchQuery,
      }

      mockWs.simulateMessage(searchMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(received).toBe(true)
    })

    it('handles search request with filters', async () => {
      const filters: VideoSearchFilters = {
        durationRange: { min: 60, max: 600 },
        tags: ['tutorial', 'ai'],
        limit: 10,
        offset: 0,
      }
      let received = false

      transport.on('searchVideos', (message) => {
        expect(message.query).toBe('deep learning')
        expect(message.filters).toEqual(filters)
        received = true
      })

      const searchMessage: SearchVideosMessage = {
        type: 'searchVideos',
        query: 'deep learning',
        filters,
      }

      mockWs.simulateMessage(searchMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(received).toBe(true)
    })

    it('can unregister search handler', async () => {
      const handler = vi.fn()

      transport.on('searchVideos', handler)
      transport.off('searchVideos', handler)

      mockWs.simulateMessage({
        type: 'searchVideos',
        query: 'test',
      })

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('SearchResultsMessage Handler', () => {
    it('handles empty search results', async () => {
      let received = false

      transport.on('searchResults', (message) => {
        expect(message.type).toBe('searchResults')
        expect(message.query).toBe('nonexistent query')
        expect(message.results).toEqual([])
        expect(message.totalResults).toBe(0)
        received = true
      })

      const resultsMessage: SearchResultsMessage = {
        type: 'searchResults',
        query: 'nonexistent query',
        results: [],
        totalResults: 0,
      }

      mockWs.simulateMessage(resultsMessage)
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(received).toBe(true)
    })

    it('handles search results with basic video data', async () => {
      const results: VideoSearchResult[] = [
        {
          videoId: 'video-1',
          title: 'Introduction to Machine Learning',
          relevanceScore: 0.95,
        },
        {
          videoId: 'video-2',
          title: 'Deep Learning Fundamentals',
          relevanceScore: 0.87,
        },
      ]
      let received = false

      transport.on('searchResults', (message) => {
        expect(message.results).toHaveLength(2)
        expect(message.totalResults).toBe(2)
        expect(message.results[0].videoId).toBe('video-1')
        expect(message.results[0].relevanceScore).toBe(0.95)
        expect(message.results[1].videoId).toBe('video-2')
        received = true
      })

      mockWs.simulateMessage({
        type: 'searchResults',
        query: 'machine learning',
        results,
        totalResults: 2,
      })

      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(received).toBe(true)
    })

    it('handles search results with full video metadata', async () => {
      const results: VideoSearchResult[] = [
        {
          videoId: 'video-123',
          title: 'Advanced Neural Networks',
          description: 'Comprehensive guide to neural network architectures',
          relevanceScore: 0.92,
          duration: 3600,
          thumbnailUrl: 'https://example.com/thumbnail.jpg',
          uploadedAt: '2024-01-15T10:00:00Z',
          author: 'AI Expert',
          tags: ['ai', 'neural-networks', 'deep-learning'],
          relevantTimestamps: [
            {
              time: 120,
              context: 'Introduction to CNNs',
              score: 0.95,
            },
            {
              time: 480,
              context: 'RNN architectures',
              score: 0.88,
            },
          ],
          metadata: {
            transcript: 'Full video transcript...',
            summary: 'This video covers neural network fundamentals',
            topics: ['CNN', 'RNN', 'LSTM'],
            sentiment: 'positive',
          },
        },
      ]
      let received = false

      transport.on('searchResults', (message) => {
        expect(message.results).toHaveLength(1)
        const result = message.results[0]
        expect(result.videoId).toBe('video-123')
        expect(result.description).toBe('Comprehensive guide to neural network architectures')
        expect(result.duration).toBe(3600)
        expect(result.relevantTimestamps).toHaveLength(2)
        expect(result.metadata?.topics).toEqual(['CNN', 'RNN', 'LSTM'])
        expect(result.metadata?.sentiment).toBe('positive')
        received = true
      })

      mockWs.simulateMessage({
        type: 'searchResults',
        query: 'neural networks',
        results,
        totalResults: 1,
      })

      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(received).toBe(true)
    })
  })

  describe('Sending Search Messages', () => {
    it('sends search request message', () => {
      const sendSpy = vi.spyOn(mockWs, 'send')

      const searchMessage: SearchVideosMessage = {
        type: 'searchVideos',
        query: 'machine learning',
        filters: {
          limit: 10,
          tags: ['tutorial'],
        },
      }

      transport.send(searchMessage)

      expect(sendSpy).toHaveBeenCalledOnce()
      const sentData = JSON.parse(sendSpy.mock.calls[0][0])
      expect(sentData.type).toBe('searchVideos')
      expect(sentData.query).toBe('machine learning')
      expect(sentData.filters.limit).toBe(10)
    })

    it('throws error when sending while disconnected', () => {
      transport.disconnect()

      expect(() => {
        transport.send({
          type: 'searchVideos',
          query: 'test',
        })
      }).toThrow('Cannot send message: not connected')
    })
  })
})
