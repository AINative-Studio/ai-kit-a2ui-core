/**
 * StateTreeViewer component - displays hierarchical state with time travel debugging
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { StateTree, StateNode, StateChange } from '@/shared/types'
import styles from './StateTreeViewer.module.css'

export interface StateTreeViewerProps {
  stateTree: StateTree
  highlightSince?: number
  viewTimestamp?: number
  enableTimeTravel?: boolean
  onNodeSelect?: (path: string) => void
}

interface TreeNodeProps {
  nodeKey: string
  node: StateNode
  level: number
  expanded: boolean
  highlighted: boolean
  searchMatch: boolean
  onToggle: () => void
  onSelect: () => void
  selected: boolean
}

type ValueFilter = 'all' | 'string' | 'number' | 'boolean' | 'object' | 'array'

export function StateTreeViewer({
  stateTree,
  highlightSince,
  viewTimestamp,
  enableTimeTravel = false,
  onNodeSelect
}: StateTreeViewerProps): JSX.Element {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [valueFilter, setValueFilter] = useState<ValueFilter>('all')
  const [copyNotification, setCopyNotification] = useState(false)
  const [currentTimelineIndex, setCurrentTimelineIndex] = useState<number>(0)
  const [focusedIndex, setFocusedIndex] = useState<number>(0)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  // Get all changes sorted by timestamp
  const timeline = useMemo(() => {
    const allChanges: Array<{ timestamp: number; path: string; change: StateChange }> = []

    const collectChanges = (tree: StateTree, currentPath = ''): void => {
      Object.entries(tree).forEach(([key, node]) => {
        const nodePath = currentPath + '/' + key
        node.changes.forEach(change => {
          allChanges.push({ timestamp: change.timestamp, path: nodePath, change })
        })
        if (node.children) {
          collectChanges(node.children, nodePath)
        }
      })
    }

    collectChanges(stateTree)
    return allChanges.sort((a, b) => a.timestamp - b.timestamp)
  }, [stateTree])

  // Get state at specific timestamp for time travel
  const stateAtTimestamp = useMemo(() => {
    if (!enableTimeTravel || !viewTimestamp) return stateTree

    // Reconstruct state up to viewTimestamp
    const reconstructedState: StateTree = {}
    timeline.forEach(({ timestamp, path, change }) => {
      if (timestamp <= viewTimestamp) {
        // Apply change to reconstructed state
        // This is a simplified version - full implementation would reconstruct entire tree
      }
    })

    return stateTree // For now, return current state
  }, [stateTree, viewTimestamp, enableTimeTravel, timeline])

  // Filter and search logic
  const { filteredTree, matchedPaths } = useMemo(() => {
    const matches = new Set<string>()
    const filtered: StateTree = {}

    const matchesSearch = (node: StateNode, key: string): boolean => {
      if (!debouncedSearch) return true

      const searchLower = debouncedSearch.toLowerCase()
      const keyMatches = key.toLowerCase().includes(searchLower)
      const valueMatches = JSON.stringify(node.value).toLowerCase().includes(searchLower)

      return keyMatches || valueMatches
    }

    const matchesFilter = (node: StateNode): boolean => {
      if (valueFilter === 'all') return true

      const valueType = Array.isArray(node.value)
        ? 'array'
        : node.value === null
        ? 'null'
        : typeof node.value

      return valueType === valueFilter
    }

    const filterTree = (tree: StateTree, parentPath = ''): StateTree => {
      const result: StateTree = {}

      Object.entries(tree).forEach(([key, node]) => {
        const nodePath = parentPath + '/' + key
        const searchMatch = matchesSearch(node, key)

        // Check if this node or any children match the filter
        const nodeFilterMatch = matchesFilter(node)
        let childrenMatch = false
        let filteredChildren: StateTree = {}

        if (node.children) {
          filteredChildren = filterTree(node.children, nodePath)
          childrenMatch = Object.keys(filteredChildren).length > 0
        }

        if (searchMatch && (nodeFilterMatch || childrenMatch || valueFilter === 'all')) {
          matches.add(nodePath)
          result[key] = childrenMatch
            ? { ...node, children: filteredChildren }
            : node

          // Auto-expand matching nodes
          if (debouncedSearch && searchMatch) {
            setExpandedPaths(prev => new Set(prev).add(nodePath))
          }
        }
      })

      return result
    }

    return {
      filteredTree: filterTree(stateAtTimestamp),
      matchedPaths: matches
    }
  }, [stateAtTimestamp, debouncedSearch, valueFilter])

  // Flatten tree for keyboard navigation and virtualization
  const flattenedTree = useMemo(() => {
    const items: Array<{ path: string; node: StateNode; level: number; key: string }> = []

    const flatten = (tree: StateTree, level = 0, currentPath = ''): void => {
      Object.entries(tree).forEach(([key, node]) => {
        const nodePath = currentPath + '/' + key
        items.push({ path: nodePath, node, level, key })

        if (expandedPaths.has(nodePath) && node.children) {
          flatten(node.children, level + 1, nodePath)
        }
      })
    }

    flatten(filteredTree)
    return items
  }, [filteredTree, expandedPaths])

  // Virtualization parameters
  const ITEM_HEIGHT = 28
  const VISIBLE_ITEMS = 50
  const shouldVirtualize = flattenedTree.length > 100

  const [scrollTop, setScrollTop] = useState(0)
  const visibleRange = useMemo(() => {
    if (!shouldVirtualize) {
      return { start: 0, end: flattenedTree.length }
    }

    const start = Math.floor(scrollTop / ITEM_HEIGHT)
    const end = Math.min(start + VISIBLE_ITEMS, flattenedTree.length)
    return { start, end }
  }, [scrollTop, flattenedTree.length, shouldVirtualize])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    const allPaths = new Set<string>()

    const collectPaths = (tree: StateTree, currentPath = ''): void => {
      Object.entries(tree).forEach(([key, node]) => {
        const nodePath = currentPath + '/' + key
        allPaths.add(nodePath)
        if (node.children) {
          collectPaths(node.children, nodePath)
        }
      })
    }

    collectPaths(filteredTree)
    setExpandedPaths(allPaths)
  }, [filteredTree])

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set())
  }, [])

  const handleNodeSelect = useCallback((path: string) => {
    setSelectedPath(path)
    onNodeSelect?.(path)
  }, [onNodeSelect])

  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopyNotification(true)
      setTimeout(() => setCopyNotification(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [])

  const handleCopyAll = useCallback(async () => {
    const content = JSON.stringify(stateTree, null, 2)
    await copyToClipboard(content)
  }, [stateTree, copyToClipboard])

  const handleCopySelected = useCallback(async () => {
    if (!selectedPath) return

    const node = getNodeByPath(stateTree, selectedPath)
    if (node) {
      await copyToClipboard(JSON.stringify(node.value, null, 2))
    }
  }, [selectedPath, stateTree, copyToClipboard])

  const handleCopyPath = useCallback(async () => {
    if (selectedPath) {
      await copyToClipboard(selectedPath)
    }
  }, [selectedPath, copyToClipboard])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentItem = flattenedTree[focusedIndex]
    if (!currentItem) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, flattenedTree.length - 1))
        break

      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
        break

      case 'ArrowRight':
        e.preventDefault()
        if (currentItem.node.children && Object.keys(currentItem.node.children).length > 0) {
          toggleExpand(currentItem.path)
        }
        break

      case 'ArrowLeft':
        e.preventDefault()
        if (expandedPaths.has(currentItem.path)) {
          toggleExpand(currentItem.path)
        }
        break

      case 'Enter':
      case ' ':
        e.preventDefault()
        handleNodeSelect(currentItem.path)
        break
    }
  }, [flattenedTree, focusedIndex, expandedPaths, toggleExpand, handleNodeSelect])

  const handleTimelineChange = useCallback((index: number) => {
    setCurrentTimelineIndex(index)
  }, [])

  const handlePrevChange = useCallback(() => {
    setCurrentTimelineIndex(prev => Math.max(0, prev - 1))
  }, [])

  const handleNextChange = useCallback(() => {
    setCurrentTimelineIndex(prev => Math.min(timeline.length - 1, prev + 1))
  }, [timeline.length])

  if (Object.keys(stateTree).length === 0) {
    return (
      <div className={styles.empty}>
        <p>No state data available</p>
        <p className={styles.hint}>
          State changes will appear here when your application updates state
        </p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search state..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.search}
          aria-label="Search state"
        />

        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className={styles.clearButton}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}

        <select
          value={valueFilter}
          onChange={(e) => setValueFilter(e.target.value as ValueFilter)}
          className={styles.filter}
          aria-label="Filter by type"
        >
          <option value="all">All Types</option>
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="boolean">Boolean</option>
          <option value="object">Object</option>
          <option value="array">Array</option>
        </select>

        <div className={styles.buttonGroup}>
          <button onClick={expandAll} className={styles.button} aria-label="Expand all">
            Expand All
          </button>
          <button onClick={collapseAll} className={styles.button} aria-label="Collapse all">
            Collapse All
          </button>
        </div>

        <div className={styles.buttonGroup}>
          <button onClick={handleCopyAll} className={styles.button} aria-label="Copy all">
            Copy All
          </button>
          {selectedPath && (
            <>
              <button onClick={handleCopySelected} className={styles.button} aria-label="Copy selected">
                Copy Selected
              </button>
              <button onClick={handleCopyPath} className={styles.button} aria-label="Copy path">
                Copy Path
              </button>
            </>
          )}
        </div>

        {matchedPaths.size > 0 && (
          <div className={styles.searchResults}>
            {matchedPaths.size} result{matchedPaths.size !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {enableTimeTravel && (
        <div className={styles.timeline}>
          <button
            onClick={handlePrevChange}
            disabled={currentTimelineIndex === 0}
            className={styles.timelineButton}
            aria-label="Previous change"
          >
            ◀ Prev
          </button>

          <input
            type="range"
            min={0}
            max={timeline.length - 1}
            value={currentTimelineIndex}
            onChange={(e) => handleTimelineChange(parseInt(e.target.value))}
            className={styles.timelineSlider}
            aria-label="Timeline"
          />

          <button
            onClick={handleNextChange}
            disabled={currentTimelineIndex === timeline.length - 1}
            className={styles.timelineButton}
            aria-label="Next change"
          >
            Next ▶
          </button>

          <div className={styles.timelineInfo}>
            {timeline.length > 0 && (
              <>
                <span>
                  {new Date(timeline[currentTimelineIndex]?.timestamp ?? Date.now()).toLocaleTimeString()}
                </span>
                <span className={styles.changeCount}>
                  {timeline.length} change{timeline.length !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <div
        className={styles.tree}
        role="tree"
        aria-label="State tree"
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        tabIndex={0}
      >
        {shouldVirtualize && (
          <div style={{ height: `${flattenedTree.length * ITEM_HEIGHT}px`, position: 'relative' }}>
            {flattenedTree.slice(visibleRange.start, visibleRange.end).map((item, relativeIndex) => {
              const index = visibleRange.start + relativeIndex
              const isExpanded = expandedPaths.has(item.path)
              const isSelected = selectedPath === item.path
              const isHighlighted = highlightSince
                ? item.node.changes.some(change => change.timestamp > highlightSince)
                : false
              const isSearchMatch = matchedPaths.has(item.path)
              const hasChildren = item.node.children && Object.keys(item.node.children).length > 0

              return (
                <div
                  key={item.path}
                  style={{
                    position: 'absolute',
                    top: `${index * ITEM_HEIGHT}px`,
                    width: '100%',
                    height: `${ITEM_HEIGHT}px`
                  }}
                >
                  <TreeNodeView
                    nodeKey={item.key}
                    node={item.node}
                    level={item.level}
                    expanded={isExpanded}
                    highlighted={isHighlighted}
                    searchMatch={isSearchMatch}
                    selected={isSelected}
                    hasChildren={hasChildren ?? false}
                    onToggle={() => toggleExpand(item.path)}
                    onSelect={() => handleNodeSelect(item.path)}
                    isFocused={index === focusedIndex}
                  />
                </div>
              )
            })}
          </div>
        )}

        {!shouldVirtualize && flattenedTree.map((item, index) => {
          const isExpanded = expandedPaths.has(item.path)
          const isSelected = selectedPath === item.path
          const isHighlighted = highlightSince
            ? item.node.changes.some(change => change.timestamp > highlightSince)
            : false
          const isSearchMatch = matchedPaths.has(item.path)
          const hasChildren = item.node.children && Object.keys(item.node.children).length > 0

          return (
            <TreeNodeView
              key={item.path}
              nodeKey={item.key}
              node={item.node}
              level={item.level}
              expanded={isExpanded}
              highlighted={isHighlighted}
              searchMatch={isSearchMatch}
              selected={isSelected}
              hasChildren={hasChildren ?? false}
              onToggle={() => toggleExpand(item.path)}
              onSelect={() => handleNodeSelect(item.path)}
              isFocused={index === focusedIndex}
            />
          )
        })}
      </div>

      <div role="status" aria-live="polite" className={styles.srOnly}>
        {copyNotification && 'Copied to clipboard'}
      </div>

      {copyNotification && (
        <div className={styles.notification}>
          Copied to clipboard!
        </div>
      )}
    </div>
  )
}

interface TreeNodeViewProps {
  nodeKey: string
  node: StateNode
  level: number
  expanded: boolean
  highlighted: boolean
  searchMatch: boolean
  selected: boolean
  hasChildren: boolean
  onToggle: () => void
  onSelect: () => void
  isFocused: boolean
}

function TreeNodeView({
  nodeKey,
  node,
  level,
  expanded,
  highlighted,
  searchMatch,
  selected,
  hasChildren,
  onToggle,
  onSelect,
  isFocused
}: TreeNodeViewProps): JSX.Element {
  const nodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isFocused && nodeRef.current) {
      nodeRef.current.focus()
    }
  }, [isFocused])

  const formatValue = (value: unknown): string => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return `"${value}"`
    if (typeof value === 'object') {
      return Array.isArray(value) ? 'Array' : 'Object'
    }
    return String(value)
  }

  const getValueType = (value: unknown): string => {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    return typeof value
  }

  const changeCount = node.changes.length
  const hasRecentChanges = changeCount > 1
  const lastChange = node.changes[node.changes.length - 1]

  return (
    <div
      ref={nodeRef}
      role="treeitem"
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={selected}
      tabIndex={isFocused ? 0 : -1}
      className={`${styles.treeNode} ${selected ? styles.selected : ''} ${
        highlighted ? styles.highlighted : ''
      } ${searchMatch ? styles.searchMatch : ''}`}
      style={{ paddingLeft: `${level * 20 + 8}px` }}
      onClick={onSelect}
      data-testid={highlighted ? 'highlighted-node' : undefined}
    >
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className={styles.expandButton}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▼' : '▶'}
        </button>
      ) : (
        <span className={styles.expandPlaceholder} />
      )}

      <span className={styles.key} data-testid={searchMatch ? 'search-match' : undefined}>
        {nodeKey}
      </span>

      <span className={styles.separator}>:</span>

      <span className={`${styles.value} ${styles[getValueType(node.value)]}`}>
        {formatValue(node.value)}
      </span>

      {hasRecentChanges && (
        <span className={styles.changeBadge} data-testid="change-count">
          {changeCount}
        </span>
      )}

      {lastChange && (
        <span className={styles.operation}>
          {lastChange.operation}
        </span>
      )}

      <span className={styles.timestamp}>
        {formatTimestamp(node.timestamp)}
      </span>
    </div>
  )
}

function getNodeByPath(tree: StateTree, path: string): StateNode | null {
  const segments = path.split('/').filter(s => s)
  let current = tree

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!
    const node = current[segment]

    if (!node) return null
    if (i === segments.length - 1) return node

    current = node.children ?? {}
  }

  return null
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`

  return new Date(timestamp).toLocaleTimeString()
}
