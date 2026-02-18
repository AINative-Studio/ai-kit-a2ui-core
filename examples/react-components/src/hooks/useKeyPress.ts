import { useEffect } from 'react'

export function useKeyPress(
  keys: string | string[],
  callback: (event: KeyboardEvent) => void
): void {
  useEffect(() => {
    const targetKeys = Array.isArray(keys) ? keys : [keys]

    const handleKeyPress = (event: KeyboardEvent) => {
      if (targetKeys.includes(event.key)) {
        callback(event)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [keys, callback])
}
