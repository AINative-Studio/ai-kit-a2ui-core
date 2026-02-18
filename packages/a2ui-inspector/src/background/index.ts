/**
 * Background service worker for the extension
 * Routes messages between content scripts and DevTools
 */

interface DevToolsConnection {
  tabId: number
  port: chrome.runtime.Port
}

const devToolsConnections = new Map<number, DevToolsConnection>()

// Handle DevTools panel connections
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'a2ui-devtools') return

  // Get tab ID from port
  const tabId = port.sender?.tab?.id
  if (!tabId) {
    console.warn('[A2UI Inspector] Cannot determine tab ID')
    return
  }

  // Store connection
  devToolsConnections.set(tabId, { tabId, port })

  console.log(`[A2UI Inspector] DevTools connected for tab ${tabId}`)

  // Handle messages from DevTools
  port.onMessage.addListener((message) => {
    // Forward to content script
    chrome.tabs
      .sendMessage(tabId, {
        type: 'FROM_DEVTOOLS',
        payload: message
      })
      .catch(() => {
        // Content script might not be injected yet
      })
  })

  // Clean up on disconnect
  port.onDisconnect.addListener(() => {
    devToolsConnections.delete(tabId)
    console.log(`[A2UI Inspector] DevTools disconnected for tab ${tabId}`)
  })
})

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FROM_PAGE') {
    const tabId = sender.tab?.id
    if (!tabId) return

    // Forward to DevTools if connected
    const connection = devToolsConnections.get(tabId)
    if (connection) {
      connection.port.postMessage({
        type: 'PAGE_MESSAGE',
        payload: message.payload,
        timestamp: Date.now()
      })
    }

    sendResponse({ success: true })
  }
})

// Initialize icon
chrome.action.setIcon({
  path: {
    '16': 'extension/icons/icon-16.png',
    '48': 'extension/icons/icon-48.png',
    '128': 'extension/icons/icon-128.png'
  }
})

console.log('[A2UI Inspector] Background service worker initialized')
