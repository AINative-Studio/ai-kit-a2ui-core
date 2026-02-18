/**
 * Content script that runs in the page context
 * Bridges communication between injected script and background script
 */

// Inject the script into page context
const script = document.createElement('script')
script.src = chrome.runtime.getURL('dist/injected.js')
script.onload = function () {
  script.remove()
}
;(document.head || document.documentElement).appendChild(script)

// Listen for messages from injected script
window.addEventListener('message', (event) => {
  // Only accept messages from same window
  if (event.source !== window) return

  // Only accept messages from our injected script
  const data = event.data as { source?: string }
  if (data.source !== 'a2ui-inspector-injected') return

  // Forward to background script
  chrome.runtime.sendMessage({
    type: 'FROM_PAGE',
    payload: data
  }).catch(() => {
    // Background script might not be ready, ignore
  })
})

// Listen for messages from DevTools
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'FROM_DEVTOOLS') {
    // Forward to page context
    window.postMessage({
      source: 'a2ui-inspector-content',
      ...message.payload
    }, '*')

    sendResponse({ success: true })
  }
})

console.log('[A2UI Inspector] Content script loaded')
