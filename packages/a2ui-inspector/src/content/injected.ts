/**
 * Injected script that runs in page context to intercept A2UI messages
 * This script has access to the page's JavaScript context
 */

(function () {
  // Check if already injected
  if ((window as Window & { __A2UI_INSPECTOR_INJECTED__?: boolean }).__A2UI_INSPECTOR_INJECTED__) {
    return
  }
  (window as Window & { __A2UI_INSPECTOR_INJECTED__?: boolean }).__A2UI_INSPECTOR_INJECTED__ = true

  // Store original WebSocket
  const OriginalWebSocket = window.WebSocket

  // Intercept WebSocket constructor
  window.WebSocket = class extends OriginalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols)

      // Notify inspector of new WebSocket connection
      window.postMessage({
        source: 'a2ui-inspector-injected',
        type: 'websocket-created',
        url: url.toString()
      }, '*')

      // Intercept send method
      const originalSend = this.send.bind(this)
      this.send = function (data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        try {
          if (typeof data === 'string') {
            const parsed = JSON.parse(data) as unknown
            window.postMessage({
              source: 'a2ui-inspector-injected',
              type: 'a2ui-message-sent',
              message: parsed,
              timestamp: Date.now()
            }, '*')
          }
        } catch (error) {
          // Ignore parse errors
        }

        return originalSend(data)
      }

      // Intercept message events
      this.addEventListener('message', (event: MessageEvent) => {
        try {
          if (typeof event.data === 'string') {
            const parsed = JSON.parse(event.data) as unknown
            window.postMessage({
              source: 'a2ui-inspector-injected',
              type: 'a2ui-message-received',
              message: parsed,
              timestamp: Date.now()
            }, '*')
          }
        } catch (error) {
          // Ignore parse errors
        }
      })

      // Track connection state
      this.addEventListener('open', () => {
        window.postMessage({
          source: 'a2ui-inspector-injected',
          type: 'websocket-connected',
          timestamp: Date.now()
        }, '*')
      })

      this.addEventListener('close', () => {
        window.postMessage({
          source: 'a2ui-inspector-injected',
          type: 'websocket-disconnected',
          timestamp: Date.now()
        }, '*')
      })

      this.addEventListener('error', () => {
        window.postMessage({
          source: 'a2ui-inspector-injected',
          type: 'websocket-error',
          timestamp: Date.now()
        }, '*')
      })
    }
  }

  // Intercept fetch API for HTTP-based transports
  const originalFetch = window.fetch
  window.fetch = function (...args: Parameters<typeof fetch>) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url

    // Only intercept A2UI-related requests
    if (!url.includes('a2ui') && !url.includes('/api/')) {
      return originalFetch.apply(this, args)
    }

    const startTime = Date.now()

    return originalFetch.apply(this, args).then(response => {
      const duration = Date.now() - startTime

      // Clone response to read body
      const clonedResponse = response.clone()

      // Try to read and parse response
      clonedResponse.text().then(text => {
        try {
          const data = JSON.parse(text) as unknown
          window.postMessage({
            source: 'a2ui-inspector-injected',
            type: 'fetch-response',
            url,
            data,
            duration,
            timestamp: Date.now()
          }, '*')
        } catch (error) {
          // Not JSON, ignore
        }
      }).catch(() => {
        // Ignore errors
      })

      return response
    })
  }

  console.log('[A2UI Inspector] Injected successfully')
})()
