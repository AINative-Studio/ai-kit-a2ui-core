import { A2UIChat } from '../components/A2UIChat'

export function ChatPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>A2UIChat Component</h1>
        <p>
          Full-featured chat interface with message history and real-time
          updates.
        </p>
      </div>

      <div className="demo-container">
        <div className="demo-chat">
          <A2UIChat
            title="AI Assistant"
            agentUrl="wss://api.ainative.studio/agents/chat"
            placeholder="Ask me anything..."
            onMessage={(msg) => console.log('Sent:', msg)}
            onError={(err) => console.error('Chat error:', err)}
          />
        </div>
      </div>

      <div className="features">
        <h2>Features</h2>
        <ul>
          <li>Message history with auto-scroll</li>
          <li>User and assistant message distinction</li>
          <li>Form validation (no empty messages)</li>
          <li>Keyboard shortcuts (Enter to send)</li>
          <li>Theme support (light/dark)</li>
          <li>Responsive design</li>
          <li>Accessibility compliant</li>
        </ul>
      </div>
    </div>
  )
}
