/**
 * ActionTracer component - displays and filters action execution traces
 */

import { useState, useMemo } from 'react'
import type { ActionTrace } from '@/shared/types'
import styles from './ActionTracer.module.css'

interface ActionTracerProps {
  actions: ActionTrace[]
  onClear?: () => void
  onExport?: () => void
}

export function ActionTracer({ actions, onClear, onExport }: ActionTracerProps): JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredActions = useMemo(() => {
    let result = actions

    if (statusFilter) {
      result = result.filter(action => action.status === statusFilter)
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(action =>
        action.actionType.toLowerCase().includes(search)
      )
    }

    // Sort by timestamp in reverse chronological order (newest first)
    return [...result].sort((a, b) => b.timestamp - a.timestamp)
  }, [actions, statusFilter, searchTerm])

  const selectedAction = useMemo(
    () => actions.find(action => action.actionId === selectedId),
    [actions, selectedId]
  )

  const handleCopy = async (): Promise<void> => {
    if (selectedAction) {
      await navigator.clipboard.writeText(
        JSON.stringify(selectedAction, null, 2)
      )
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, actionId: string): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setSelectedId(actionId)
    }
  }

  const formatDuration = (duration: number): string => {
    return `${duration}ms`
  }

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'completed':
        return styles.completed ?? ''
      case 'failed':
        return styles.failed ?? ''
      case 'started':
        return styles.started ?? ''
      default:
        return ''
    }
  }

  if (actions.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No actions traced yet</p>
        <p className={styles.hint}>
          Actions will appear here when your application executes them
        </p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search actions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.search}
          aria-label="Search actions"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className={styles.filter}
        >
          <option value="">All Status</option>
          <option value="completed">Success</option>
          <option value="failed">Failed</option>
          <option value="started">Pending</option>
        </select>

        <button onClick={onClear} className={styles.button}>
          Clear
        </button>
        <button onClick={onExport} className={styles.button}>
          Export
        </button>

        <div role="status" aria-live="polite" className={styles.count}>
          {filteredActions.length} {filteredActions.length === 1 ? 'action' : 'actions'}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.timeline}>
          <ul role="list" aria-label="Action list" className={styles.actions}>
            {filteredActions.map((action) => (
              <li
                key={action.actionId}
                role="listitem"
                tabIndex={0}
                className={`${styles.action} ${action.actionId === selectedId ? styles.selected : ''}`}
                data-status={action.status}
                onClick={() => setSelectedId(action.actionId)}
                onKeyDown={(e) => handleKeyDown(e, action.actionId)}
              >
                <div className={styles.actionHeader}>
                  <span
                    className={`${styles.status} ${getStatusClass(action.status)}`}
                  >
                    {action.status}
                  </span>
                  <span className={styles.actionType}>{action.actionType}</span>
                  {action.duration !== undefined && (
                    <span className={styles.duration}>
                      {formatDuration(action.duration)}
                    </span>
                  )}
                  <span className={styles.time}>
                    {formatTimestamp(action.timestamp)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {selectedAction && (
          <div className={styles.details}>
            <div className={styles.detailsHeader}>
              <h3>Action Details</h3>
              <button onClick={handleCopy} className={styles.button}>
                Copy
              </button>
            </div>

            <div className={styles.detailsContent}>
              <div className={styles.section}>
                <h4>Action ID</h4>
                <pre className={styles.code}>{selectedAction.actionId}</pre>
              </div>

              <div className={styles.section}>
                <h4>Type</h4>
                <pre className={styles.code}>{selectedAction.actionType}</pre>
              </div>

              <div className={styles.section}>
                <h4>Status</h4>
                <pre className={styles.code}>{selectedAction.status}</pre>
              </div>

              {selectedAction.duration !== undefined && (
                <div className={styles.section}>
                  <h4>Duration</h4>
                  <pre className={styles.code}>
                    {formatDuration(selectedAction.duration)}
                  </pre>
                </div>
              )}

              {selectedAction.params && (
                <div className={styles.section}>
                  <h4>Parameters</h4>
                  <pre className={styles.code}>
                    {JSON.stringify(selectedAction.params, null, 2)}
                  </pre>
                </div>
              )}

              {selectedAction.result !== undefined && (
                <div className={styles.section}>
                  <h4>Result</h4>
                  <pre className={styles.code}>
                    {typeof selectedAction.result === 'string'
                      ? selectedAction.result
                      : JSON.stringify(selectedAction.result, null, 2)}
                  </pre>
                </div>
              )}

              {selectedAction.error && (
                <div className={styles.section}>
                  <h4>Error</h4>
                  <pre className={`${styles.code} ${styles.error}`}>
                    {selectedAction.error.message || 'Unknown error'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
