/**
 * StateTree utility for managing hierarchical state
 */

import type { StateNode, StateChange, StateTree as StateTreeType } from '../types/index.js'

export class StateTree {
  private root: StateTreeType = {}

  /**
   * Update state at a specific path
   */
  updateState(
    path: string,
    value: unknown,
    operation: 'add' | 'replace' | 'remove'
  ): void {
    if (operation === 'remove') {
      this.removeNode(path)
      return
    }

    const segments = this.pathToSegments(path)
    let current = this.root

    // Create parent nodes if they don't exist
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i]!
      if (!current[segment]) {
        current[segment] = {
          value: {},
          timestamp: Date.now(),
          path: '/' + segments.slice(0, i + 1).join('/'),
          changes: [],
          children: {}
        }
      }
      current = current[segment]!.children ?? {}
    }

    // Update or create the target node
    const lastSegment = segments[segments.length - 1]!
    const existingNode = current[lastSegment]
    const timestamp = Date.now()

    const change: StateChange = {
      timestamp,
      oldValue: existingNode?.value,
      newValue: value,
      operation
    }

    if (existingNode) {
      existingNode.value = value
      existingNode.timestamp = timestamp
      existingNode.changes.push(change)
    } else {
      current[lastSegment] = {
        value,
        timestamp,
        path,
        changes: [change],
        children: {}
      }
    }
  }

  /**
   * Get node at specific path
   */
  getNode(path: string): StateNode | undefined {
    if (path === '/' || path === '') {
      return {
        value: this.root,
        timestamp: Date.now(),
        path: '/',
        changes: [],
        children: this.root
      }
    }

    const segments = this.pathToSegments(path)
    let current = this.root

    for (const segment of segments) {
      const node = current[segment]
      if (!node) return undefined
      current = node.children ?? {}
    }

    const lastSegment = segments[segments.length - 1]!
    return this.root[lastSegment] ?? this.findNodeRecursive(this.root, segments)
  }

  /**
   * Get entire state tree
   */
  getTree(): StateTreeType {
    return { ...this.root }
  }

  /**
   * Get state changes since timestamp
   */
  getDiff(sinceTimestamp: number): StateChange[] {
    const allChanges: StateChange[] = []
    this.collectChanges(this.root, sinceTimestamp, allChanges)
    return allChanges
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.root = {}
  }

  /**
   * Get change history for a specific path
   */
  getChangesForPath(path: string): StateChange[] {
    const node = this.getNode(path)
    return node ? [...node.changes] : []
  }

  /**
   * Get all paths in the tree
   */
  getAllPaths(): string[] {
    const paths: string[] = []
    this.collectPaths(this.root, '', paths)
    return paths
  }

  /**
   * Export state as JSON
   */
  exportState(): string {
    const serializable = this.makeSerializable(this.root)
    return JSON.stringify(serializable, null, 2)
  }

  /**
   * Remove node at path
   */
  private removeNode(path: string): void {
    const segments = this.pathToSegments(path)
    let current = this.root

    // Navigate to parent
    for (let i = 0; i < segments.length - 1; i++) {
      const node = current[segments[i]!]
      if (!node) return
      current = node.children ?? {}
    }

    // Remove the node
    const lastSegment = segments[segments.length - 1]!
    delete current[lastSegment]
  }

  /**
   * Find node recursively in tree
   */
  private findNodeRecursive(tree: StateTreeType, segments: string[]): StateNode | undefined {
    if (segments.length === 0) return undefined

    const [first, ...rest] = segments
    const node = tree[first!]

    if (!node) return undefined
    if (rest.length === 0) return node

    return this.findNodeRecursive(node.children ?? {}, rest)
  }

  /**
   * Convert path to segments
   */
  private pathToSegments(path: string): string[] {
    return path
      .split('/')
      .filter(segment => segment.length > 0)
  }

  /**
   * Collect all changes since timestamp
   */
  private collectChanges(
    tree: StateTreeType,
    sinceTimestamp: number,
    result: StateChange[]
  ): void {
    for (const node of Object.values(tree)) {
      const recentChanges = node.changes.filter(
        change => change.timestamp > sinceTimestamp
      )
      result.push(...recentChanges)

      if (node.children) {
        this.collectChanges(node.children, sinceTimestamp, result)
      }
    }
  }

  /**
   * Collect all paths in tree
   */
  private collectPaths(tree: StateTreeType, prefix: string, result: string[]): void {
    for (const [key, node] of Object.entries(tree)) {
      const path = prefix + '/' + key
      result.push(path)

      if (node.children) {
        this.collectPaths(node.children, path, result)
      }
    }
  }

  /**
   * Make tree serializable by removing circular references
   */
  private makeSerializable(tree: StateTreeType): Record<string, unknown> {
    const seen = new WeakSet()
    const result: Record<string, unknown> = {}

    for (const [key, node] of Object.entries(tree)) {
      if (typeof node.value === 'object' && node.value !== null) {
        if (seen.has(node.value)) {
          result[key] = '[Circular]'
        } else {
          seen.add(node.value)
          result[key] = node.value
        }
      } else {
        result[key] = node.value
      }
    }

    return result
  }
}
