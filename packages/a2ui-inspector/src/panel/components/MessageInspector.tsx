/**
 * MessageInspector component - displays and filters A2UI protocol messages
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { FixedSizeList as List } from 'react-window'
import type { CapturedMessage, MessageFilter } from '@/shared/types'
import styles from './MessageInspector.module.css'

interface MessageInspectorProps {
  messages: CapturedMessage[]
  onClear?: () => void
  onExport?: () => void
}

interface MessageRowProps {
  index: number
  style: React.CSSProperties
  data: {
    messages: CapturedMessage[]
    selectedId: string | null
    onSelect: (id: string) => void
  }
}

const MessageRow = ({ index, style, data }: MessageRowProps): JSX.Element => {
  const { messages, selectedId, onSelect } = data
  const msg = messages[index]

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(msg.id)
    }
  }

  return (
    <div
      style={style}
      role="listitem"
      tabIndex={0}
      className={`${styles.message} ${msg.id === selectedId ? styles.selected : ''}`}
      onClick={() => onSelect(msg.id)}
      onKeyDown={handleKeyDown}
    >
      <span className={`${styles.direction} ${styles[msg.direction]}`}>
        {msg.direction}
      </span>
      <span className={styles.type}>{msg.messageType}</span>
      <span className={styles.time}>
        {new Date(msg.timestamp).toLocaleTimeString()}
      </span>
    </div>
  )
}

export function MessageInspector({ messages, onClear, onExport }: MessageInspectorProps): JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<MessageFilter>({})
  const [searchTerm, setSearchTerm] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const [listHeight, setListHeight] = useState(600)

  // Update list height based on container size
  useEffect(() => {
    if (!listRef.current) return

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setListHeight(entry.contentRect.height)
      }
    })

    resizeObserver.observe(listRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  const filteredMessages = useMemo(() => {
    let result = messages

    if (filter.messageTypes && filter.messageTypes.length > 0) {
      result = result.filter(msg => filter.messageTypes!.includes(msg.messageType))
    }

    if (filter.direction) {
      result = result.filter(msg => msg.direction === filter.direction)
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(msg =>
        JSON.stringify(msg.message).toLowerCase().includes(search)
      )
    }

    return result
  }, [messages, filter, searchTerm])

  const selectedMessage = useMemo(
    () => messages.find(msg => msg.id === selectedId),
    [messages, selectedId]
  )

  const handleCopy = async (): Promise<void> => {
    if (selectedMessage) {
      await navigator.clipboard.writeText(
        JSON.stringify(selectedMessage.message, null, 2)
      )
    }
  }

  // Use virtualization for lists with more than 50 messages
  const shouldVirtualize = filteredMessages.length > 50
  const ITEM_HEIGHT = 40 // Height of each message row in pixels

  if (messages.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No messages captured yet</p>
        <p className={styles.hint}>
          A2UI messages will appear here when your application sends them
        </p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.search}
          aria-label="Search messages"
        />

        <select
          value={filter.messageTypes?.[0] ?? ''}
          onChange={(e) => setFilter(prev => ({
            ...prev,
            messageTypes: e.target.value ? [e.target.value] : undefined
          }))}
          aria-label="Filter by type"
          className={styles.filter}
        >
          <option value="">All Types</option>
          <option value="createSurface">Create Surface</option>
          <option value="updateComponents">Update Components</option>
          <option value="userAction">User Action</option>
          <option value="ping">Ping</option>
          <option value="pong">Pong</option>
        </select>

        <select
          value={filter.direction ?? ''}
          onChange={(e) => setFilter(prev => ({
            ...prev,
            direction: e.target.value as 'sent' | 'received' | undefined
          }))}
          aria-label="Filter by direction"
          className={styles.filter}
        >
          <option value="">All Directions</option>
          <option value="sent">Sent</option>
          <option value="received">Received</option>
        </select>

        <button onClick={onClear} className={styles.button}>
          Clear
        </button>
        <button onClick={onExport} className={styles.button}>
          Export
        </button>

        <div role="status" aria-live="polite" className={styles.count}>
          {filteredMessages.length} messages
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.list} ref={listRef}>
          {shouldVirtualize ? (
            <List
              height={listHeight}
              itemCount={filteredMessages.length}
              itemSize={ITEM_HEIGHT}
              width="100%"
              itemData={{
                messages: filteredMessages,
                selectedId,
                onSelect: setSelectedId
              }}
              role="list"
              aria-label="Message list"
            >
              {MessageRow}
            </List>
          ) : (
            <div role="list" aria-label="Message list" className={styles.messages}>
              {filteredMessages.map((msg, index) => (
                <MessageRow
                  key={msg.id}
                  index={index}
                  style={{}}
                  data={{
                    messages: filteredMessages,
                    selectedId,
                    onSelect: setSelectedId
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {selectedMessage && (
          <div className={styles.details}>
            <div className={styles.detailsHeader}>
              <h3>Message Details</h3>
              <button onClick={handleCopy} className={styles.button}>
                Copy
              </button>
            </div>
            <pre role="code" className={styles.json}>
              {JSON.stringify(selectedMessage.message, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
