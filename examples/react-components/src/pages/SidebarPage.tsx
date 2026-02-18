import { useState } from 'react'
import { A2UISidebar } from '../components/A2UISidebar'

export function SidebarPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<'left' | 'right'>('left')
  const [mode, setMode] = useState<'overlay' | 'push'>('overlay')

  return (
    <div className="page">
      <div className="page-header">
        <h1>A2UISidebar Component</h1>
        <p>Slide-out panel for navigation or contextual content.</p>
      </div>

      <div className="demo-container">
        <div className="demo-controls">
          <div className="control-group">
            <label>Position:</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as 'left' | 'right')}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div className="control-group">
            <label>Mode:</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'overlay' | 'push')}
            >
              <option value="overlay">Overlay</option>
              <option value="push">Push</option>
            </select>
          </div>

          <button className="demo-button" onClick={() => setIsOpen(true)}>
            Open Sidebar
          </button>
        </div>
      </div>

      <A2UISidebar
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        position={position}
        mode={mode}
        width={280}
        header={
          <div className="sidebar-header">
            <h3>Navigation</h3>
          </div>
        }
        footer={
          <div className="sidebar-footer">
            <p>© 2026 AINative Studio</p>
          </div>
        }
      >
        <nav className="sidebar-nav">
          <a href="#" className="sidebar-link">
            Dashboard
          </a>
          <a href="#" className="sidebar-link">
            Projects
          </a>
          <a href="#" className="sidebar-link">
            Team
          </a>
          <a href="#" className="sidebar-link">
            Settings
          </a>
        </nav>
      </A2UISidebar>

      <div className="features">
        <h2>Features</h2>
        <ul>
          <li>Left/right positioning</li>
          <li>Overlay and push modes</li>
          <li>Customizable width</li>
          <li>Header and footer slots</li>
          <li>Close on Escape key</li>
          <li>Backdrop overlay</li>
          <li>Smooth slide animations</li>
          <li>Responsive (mobile-optimized)</li>
        </ul>
      </div>
    </div>
  )
}
