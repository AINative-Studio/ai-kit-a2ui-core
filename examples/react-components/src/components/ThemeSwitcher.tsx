import { useTheme } from '../hooks/useTheme'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="theme-switcher">
      <button
        onClick={() => setTheme('light')}
        className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
        aria-label="Light theme"
        aria-pressed={theme === 'light'}
      >
        ☀️
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
        aria-label="Dark theme"
        aria-pressed={theme === 'dark'}
      >
        🌙
      </button>
      <button
        onClick={() => setTheme('auto')}
        className={`theme-btn ${theme === 'auto' ? 'active' : ''}`}
        aria-label="Auto theme"
        aria-pressed={theme === 'auto'}
      >
        🔄
      </button>
    </div>
  )
}
