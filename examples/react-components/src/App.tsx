import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { ThemeSwitcher } from './components/ThemeSwitcher'
import { ChatPage } from './pages/ChatPage'
import { PopupPage } from './pages/PopupPage'
import { SidebarPage } from './pages/SidebarPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="app-nav">
          <div className="app-nav-content">
            <div className="app-logo">
              <h1>A2UI React Components</h1>
            </div>
            <div className="app-nav-links">
              <Link to="/chat" className="nav-link">
                Chat
              </Link>
              <Link to="/popup" className="nav-link">
                Popup
              </Link>
              <Link to="/sidebar" className="nav-link">
                Sidebar
              </Link>
            </div>
            <ThemeSwitcher />
          </div>
        </nav>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/popup" element={<PopupPage />} />
            <Route path="/sidebar" element={<SidebarPage />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>
            Built with A2UI Core |{' '}
            <a
              href="https://github.com/AINative-Studio/ai-kit-a2ui-core"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
