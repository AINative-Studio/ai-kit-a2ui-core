/**
 * Streaming JSON Parser for Progressive Rendering
 *
 * Handles incremental JSON parsing for real-time LLM UI generation.
 * Parses incomplete JSON streams, handles partial objects/arrays,
 * and provides auto-repair capabilities.
 *
 * @example
 * ```typescript
 * const parser = new StreamingJSONParser()
 *
 * // Feed chunks as they arrive from LLM
 * parser.feed('{"type":"createSurfa')
 * parser.feed('ce","id":"main","compo')
 * parser.feed('nents":[{"type":"text"')
 *
 * // Get current partial state
 * const partial = parser.getCurrentState()
 *
 * // Finalize and auto-repair
 * const complete = parser.finalize()
 * ```
 */

import type { A2UIMessage } from '../types/protocol.js'

/**
 * Parse state machine states
 */
export type ParseState =
  | 'idle'           // No parsing in progress
  | 'object'         // Inside an object
  | 'array'          // Inside an array
  | 'string'         // Inside a string
  | 'number'         // Parsing a number
  | 'boolean'        // Parsing a boolean
  | 'null'           // Parsing null
  | 'key'            // Parsing object key
  | 'value'          // Parsing object value
  | 'error'          // Error state

/**
 * Parse error details
 */
export interface ParseError {
  /** Error code */
  code: string
  /** Error message */
  message: string
  /** Position in buffer where error occurred */
  position: number
  /** Context around error */
  context?: string
}

/**
 * Partial parse result with confidence score
 */
export interface PartialParseResult {
  /** Whether the partial parse is valid */
  valid: boolean
  /** Partially parsed message */
  partial: Partial<A2UIMessage>
  /** Parse error if any */
  error?: ParseError
  /** Confidence score (0-1) indicating completeness */
  confidence: number
  /** Number of complete top-level properties */
  completeProperties: number
  /** Total expected properties (estimated) */
  expectedProperties: number
}

/**
 * Token type for lexer
 */
type TokenType =
  | 'lbrace'      // {
  | 'rbrace'      // }
  | 'lbracket'    // [
  | 'rbracket'    // ]
  | 'colon'       // :
  | 'comma'       // ,
  | 'string'      // "..."
  | 'number'      // 123, 1.23
  | 'boolean'     // true, false
  | 'null'        // null
  | 'incomplete'  // Incomplete token

/**
 * Lexer token
 */
interface Token {
  type: TokenType
  value: unknown
  position: number
  complete: boolean
}

/**
 * Streaming JSON Parser
 *
 * Incrementally parses JSON as it arrives in chunks.
 * Handles malformed/incomplete JSON with auto-repair.
 */
export class StreamingJSONParser {
  private buffer: string = ''
  private state: ParseState = 'idle'
  private stateStack: ParseState[] = []
  private currentObject: Record<string, unknown> | null = null
  private objectStack: Array<Record<string, unknown> | unknown[]> = []
  private currentKey: string | null = null
  private escapeNext = false
  private inString = false
  private stringBuffer = ''
  private tokens: Token[] = []

  /**
   * Feed a chunk of JSON to the parser
   *
   * @param chunk - JSON chunk to parse
   * @returns Partial parse result with confidence score
   */
  feed(chunk: string): PartialParseResult {
    this.buffer += chunk

    try {
      // Try to parse complete JSON first
      const parsed = this.tryCompleteParse()
      if (parsed) {
        return {
          valid: true,
          partial: parsed,
          confidence: 1.0,
          completeProperties: this.countProperties(parsed),
          expectedProperties: this.countProperties(parsed)
        }
      }

      // Fall back to incremental parsing
      return this.incrementalParse()
    } catch (error) {
      return {
        valid: false,
        partial: {},
        error: this.createError('PARSE_ERROR', error instanceof Error ? error.message : 'Unknown error', this.buffer.length),
        confidence: 0,
        completeProperties: 0,
        expectedProperties: 1
      }
    }
  }

  /**
   * Get current partially parsed state
   *
   * @returns Partial A2UI message
   */
  getCurrentState(): Partial<A2UIMessage> {
    if (this.currentObject) {
      return this.currentObject as Partial<A2UIMessage>
    }

    // Try to extract what we can from buffer
    const partial = this.extractPartialObject()
    return partial as Partial<A2UIMessage>
  }

  /**
   * Finalize parsing and auto-repair if needed
   *
   * @returns Complete A2UI message (repaired if necessary)
   * @throws ParseError if unable to repair
   */
  finalize(): A2UIMessage {
    // Try complete parse first
    const parsed = this.tryCompleteParse()
    if (parsed && this.isValidMessage(parsed)) {
      return parsed as A2UIMessage
    }

    // Attempt auto-repair
    const repaired = this.autoRepair()
    if (this.isValidMessage(repaired)) {
      return repaired as A2UIMessage
    }

    throw new Error(`Unable to finalize JSON: ${this.buffer.slice(0, 100)}...`)
  }

  /**
   * Reset parser state
   */
  reset(): void {
    this.buffer = ''
    this.state = 'idle'
    this.stateStack = []
    this.currentObject = null
    this.objectStack = []
    this.currentKey = null
    this.escapeNext = false
    this.inString = false
    this.stringBuffer = ''
    this.tokens = []
  }

  /**
   * Get current buffer for debugging
   */
  getBuffer(): string {
    return this.buffer
  }

  /**
   * Try to parse complete JSON
   */
  private tryCompleteParse(): Partial<A2UIMessage> | null {
    try {
      const parsed = JSON.parse(this.buffer)
      return parsed
    } catch {
      return null
    }
  }

  /**
   * Perform incremental parsing
   */
  private incrementalParse(): PartialParseResult {
    const partial = this.extractPartialObject()
    const completeProps = this.countProperties(partial)
    const expectedProps = this.estimateExpectedProperties(partial)
    const confidence = expectedProps > 0 ? completeProps / expectedProps : 0

    return {
      valid: true,
      partial: partial as Partial<A2UIMessage>,
      confidence: Math.min(confidence, 0.99), // Never 1.0 for partial
      completeProperties: completeProps,
      expectedProperties: expectedProps
    }
  }

  /**
   * Extract partial object from incomplete JSON
   */
  private extractPartialObject(): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    // Use regex to extract complete key-value pairs
    const keyValueRegex = /"([^"]+)"\s*:\s*("(?:[^"\\]|\\.)*"|true|false|null|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\{[^}]*\}|\[[^\]]*\])/g

    let match
    while ((match = keyValueRegex.exec(this.buffer)) !== null) {
      const key = match[1]
      const valueStr = match[2]

      try {
        // Try to parse the value
        let value: unknown
        if (valueStr) {
          if (valueStr.startsWith('"')) {
            value = JSON.parse(valueStr)
          } else if (valueStr === 'true') {
            value = true
          } else if (valueStr === 'false') {
            value = false
          } else if (valueStr === 'null') {
            value = null
          } else if (/^\d/.test(valueStr)) {
            value = parseFloat(valueStr)
          } else if (valueStr.startsWith('{')) {
            // Try to parse nested object
            try {
              value = JSON.parse(valueStr)
            } catch {
              value = valueStr
            }
          } else if (valueStr.startsWith('[')) {
            // Try to parse array
            try {
              value = JSON.parse(valueStr)
            } catch {
              // Extract partial array
              value = this.extractPartialArray(valueStr)
            }
          }

          if (value !== undefined) {
            result[key] = value
          }
        }
      } catch {
        // Skip invalid values
        continue
      }
    }

    // Extract incomplete string at the end
    const incompleteMatch = this.buffer.match(/"([^"]+)"\s*:\s*"([^"]*)$/)
    if (incompleteMatch) {
      result[incompleteMatch[1]] = incompleteMatch[2]
    }

    return result
  }

  /**
   * Extract partial array from incomplete JSON
   */
  private extractPartialArray(arrayStr: string): unknown[] {
    const result: unknown[] = []

    // Remove leading [ and any whitespace
    let content = arrayStr.slice(1).trim()

    // Try to extract complete array elements
    const elementRegex = /(?:"(?:[^"\\]|\\.)*"|\{[^}]*\}|true|false|null|\d+(?:\.\d+)?)/g

    let match
    while ((match = elementRegex.exec(content)) !== null) {
      try {
        const element = JSON.parse(match[0])
        result.push(element)
      } catch {
        // Skip invalid elements
      }
    }

    return result
  }

  /**
   * Auto-repair incomplete JSON
   */
  private autoRepair(): Record<string, unknown> {
    let repaired = this.buffer.trim()

    // Count opening and closing braces/brackets
    const openBraces = (repaired.match(/\{/g) || []).length
    const closeBraces = (repaired.match(/\}/g) || []).length
    const openBrackets = (repaired.match(/\[/g) || []).length
    const closeBrackets = (repaired.match(/\]/g) || []).length

    // Close incomplete strings
    const quotes = (repaired.match(/"/g) || []).length
    if (quotes % 2 !== 0) {
      repaired += '"'
    }

    // Close arrays
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      repaired += ']'
    }

    // Close objects
    for (let i = 0; i < openBraces - closeBraces; i++) {
      repaired += '}'
    }

    // Remove trailing commas
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1')

    try {
      return JSON.parse(repaired)
    } catch {
      // Last resort: extract what we can
      return this.extractPartialObject()
    }
  }

  /**
   * Count complete properties in object
   */
  private countProperties(obj: Record<string, unknown>): number {
    return Object.keys(obj).length
  }

  /**
   * Estimate expected properties based on message type
   */
  private estimateExpectedProperties(partial: Record<string, unknown>): number {
    const type = partial['type']

    switch (type) {
      case 'createSurface':
        return 4 // type, surfaceId, components, dataModel
      case 'updateComponents':
        return 3 // type, surfaceId, updates
      case 'updateDataModel':
        return 3 // type, surfaceId, updates
      case 'deleteSurface':
        return 2 // type, surfaceId
      case 'userAction':
        return 5 // type, surfaceId, action, componentId, context
      case 'error':
        return 3 // type, code, message
      default:
        return 2 // Minimum: type + one property
    }
  }

  /**
   * Check if parsed object is a valid A2UI message
   */
  private isValidMessage(obj: Record<string, unknown>): boolean {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof obj['type'] === 'string' &&
      obj['type'].length > 0
    )
  }

  /**
   * Create parse error
   */
  private createError(code: string, message: string, position: number): ParseError {
    const start = Math.max(0, position - 20)
    const end = Math.min(this.buffer.length, position + 20)
    const context = this.buffer.slice(start, end)

    return {
      code,
      message,
      position,
      context
    }
  }
}

/**
 * Create a new streaming JSON parser instance
 *
 * @returns New parser instance
 */
export function createStreamingParser(): StreamingJSONParser {
  return new StreamingJSONParser()
}
