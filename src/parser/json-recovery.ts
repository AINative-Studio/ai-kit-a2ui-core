/**
 * JSON Recovery Strategies
 *
 * Advanced error recovery for malformed JSON from LLM streams.
 * Handles missing braces, truncated strings, invalid syntax, etc.
 */

/**
 * Recovery result
 */
export interface RecoveryResult {
  /** Successfully recovered */
  success: boolean
  /** Recovered JSON string */
  recovered?: string
  /** Parsed object if successful */
  parsed?: Record<string, unknown>
  /** Recovery strategy used */
  strategy?: string
  /** Error if recovery failed */
  error?: string
}

/**
 * Recovery statistics
 */
export interface RecoveryStats {
  /** Number of closing braces added */
  bracesAdded: number
  /** Number of closing brackets added */
  bracketsAdded: number
  /** Number of quotes added */
  quotesAdded: number
  /** Number of commas removed */
  commasRemoved: number
  /** Number of quotes fixed */
  quotesFixed: number
  /** Recovery strategy used */
  strategy: string
}

/**
 * Recover malformed JSON using multiple strategies
 *
 * @param json - Malformed JSON string
 * @returns Recovery result
 */
export function recoverJSON(json: string): RecoveryResult {
  const strategies = [
    recoverMissingBraces,
    recoverTruncatedString,
    recoverInvalidSyntax,
    recoverMissingQuotes,
    recoverTrailingComma,
    recoverIncompleteArray
  ]

  for (const strategy of strategies) {
    const result = strategy(json)
    if (result.success) {
      return result
    }
  }

  return {
    success: false,
    error: 'All recovery strategies failed'
  }
}

/**
 * Recover missing closing braces/brackets
 *
 * @param json - Malformed JSON
 * @returns Recovery result
 */
export function recoverMissingBraces(json: string): RecoveryResult {
  let recovered = json.trim()

  // Count opening and closing delimiters
  const openBraces = (recovered.match(/\{/g) || []).length
  const closeBraces = (recovered.match(/\}/g) || []).length
  const openBrackets = (recovered.match(/\[/g) || []).length
  const closeBrackets = (recovered.match(/\]/g) || []).length

  let bracesAdded = 0
  let bracketsAdded = 0

  // Close incomplete strings first by counting unescaped quotes
  let quoteCount = 0
  let escaped = false
  for (const char of recovered) {
    if (char === '\\' && !escaped) {
      escaped = true
      continue
    }
    if (char === '"' && !escaped) {
      quoteCount++
    }
    escaped = false
  }

  let quotesAdded = 0
  if (quoteCount % 2 !== 0) {
    recovered += '"'
    quotesAdded = 1
  }

  // Remove trailing commas before closing
  recovered = recovered.replace(/,\s*$/, '')

  // Close arrays (they're typically inside objects)
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    recovered += ']'
    bracketsAdded++
  }

  // Close objects
  for (let i = 0; i < openBraces - closeBraces; i++) {
    recovered += '}'
    bracesAdded++
  }

  try {
    const parsed = JSON.parse(recovered)
    return {
      success: true,
      recovered,
      parsed,
      strategy: `missing_braces (added ${bracesAdded} }, ${bracketsAdded} ], ${quotesAdded} ")`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Parse failed'
    }
  }
}

/**
 * Recover truncated string values
 *
 * @param json - Malformed JSON
 * @returns Recovery result
 */
export function recoverTruncatedString(json: string): RecoveryResult {
  let recovered = json.trim()

  // Check if we're in the middle of a string value
  const lastQuoteIndex = recovered.lastIndexOf('"')
  if (lastQuoteIndex === -1) {
    return { success: false, error: 'No quotes found' }
  }

  // Check if the quote is part of a key or value
  const beforeQuote = recovered.slice(0, lastQuoteIndex)
  const colonAfterQuote = beforeQuote.lastIndexOf(':')
  const openBraceAfterQuote = beforeQuote.lastIndexOf('{')

  // If colon is after last open brace, we're in a value
  if (colonAfterQuote > openBraceAfterQuote) {
    recovered += '"'

    // Try to close the structure
    const result = recoverMissingBraces(recovered)
    if (result.success) {
      return {
        ...result,
        strategy: 'truncated_string'
      }
    }
  }

  return { success: false, error: 'Not a truncated string' }
}

/**
 * Recover invalid JSON syntax
 *
 * @param json - Malformed JSON
 * @returns Recovery result
 */
export function recoverInvalidSyntax(json: string): RecoveryResult {
  let recovered = json.trim()
  let fixesApplied = []

  // Fix missing quotes around property names
  // Match: word characters followed by colon (without quotes)
  const unquotedKeys = recovered.match(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g)
  if (unquotedKeys) {
    recovered = recovered.replace(
      /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g,
      '$1"$2":'
    )
    fixesApplied.push('quoted_keys')
  }

  // Fix single quotes (convert to double quotes)
  const singleQuotes = recovered.match(/'/g)
  if (singleQuotes) {
    recovered = recovered.replace(/'/g, '"')
    fixesApplied.push('single_quotes')
  }

  // Remove trailing commas before closing braces/brackets
  recovered = recovered.replace(/,(\s*[}\]])/g, '$1')
  if (recovered !== json) {
    fixesApplied.push('trailing_commas')
  }

  try {
    const parsed = JSON.parse(recovered)
    return {
      success: true,
      recovered,
      parsed,
      strategy: `invalid_syntax (${fixesApplied.join(', ')})`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Parse failed'
    }
  }
}

/**
 * Recover missing quotes around values
 *
 * @param json - Malformed JSON
 * @returns Recovery result
 */
export function recoverMissingQuotes(json: string): RecoveryResult {
  let recovered = json.trim()

  // This is complex and risky, so we'll try a simple case:
  // Unquoted string values that aren't true/false/null/numbers
  const unquotedValueRegex = /:\s*([a-zA-Z][a-zA-Z0-9_]*)\s*([,}])/g

  const matches = Array.from(recovered.matchAll(unquotedValueRegex))
  for (const match of matches) {
    const value = match[1]
    // Don't quote true, false, null
    if (value === 'true' || value === 'false' || value === 'null') {
      continue
    }
    recovered = recovered.replace(match[0], `: "${value}"${match[2]}`)
  }

  try {
    const parsed = JSON.parse(recovered)
    return {
      success: true,
      recovered,
      parsed,
      strategy: 'missing_quotes'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Parse failed'
    }
  }
}

/**
 * Recover trailing commas
 *
 * @param json - Malformed JSON
 * @returns Recovery result
 */
export function recoverTrailingComma(json: string): RecoveryResult {
  let recovered = json.trim()

  // Remove trailing commas before } or ]
  recovered = recovered.replace(/,(\s*[}\]])/g, '$1')

  // Remove trailing comma at the end
  recovered = recovered.replace(/,\s*$/, '')

  try {
    const parsed = JSON.parse(recovered)
    return {
      success: true,
      recovered,
      parsed,
      strategy: 'trailing_comma'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Parse failed'
    }
  }
}

/**
 * Recover incomplete array
 *
 * @param json - Malformed JSON
 * @returns Recovery result
 */
export function recoverIncompleteArray(json: string): RecoveryResult {
  let recovered = json.trim()

  // If we have an incomplete object inside an array, try to close it
  const lastOpenBrace = recovered.lastIndexOf('{')
  const lastCloseBrace = recovered.lastIndexOf('}')

  if (lastOpenBrace > lastCloseBrace) {
    // We have an unclosed object, likely in an array
    // Try to close it
    recovered = recoverMissingBraces(recovered).recovered || recovered
  }

  // Remove trailing comma if it exists
  recovered = recovered.replace(/,\s*$/, '')

  // Try to parse
  try {
    const parsed = JSON.parse(recovered)
    return {
      success: true,
      recovered,
      parsed,
      strategy: 'incomplete_array'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Parse failed'
    }
  }
}

/**
 * Get recovery statistics
 *
 * @param original - Original JSON
 * @param recovered - Recovered JSON
 * @returns Recovery statistics
 */
export function getRecoveryStats(original: string, recovered: string): RecoveryStats {
  const origBraces = (original.match(/\}/g) || []).length
  const recBraces = (recovered.match(/\}/g) || []).length

  const origBrackets = (original.match(/\]/g) || []).length
  const recBrackets = (recovered.match(/\]/g) || []).length

  const origQuotes = (original.match(/"/g) || []).length
  const recQuotes = (recovered.match(/"/g) || []).length

  const origCommas = (original.match(/,/g) || []).length
  const recCommas = (recovered.match(/,/g) || []).length

  return {
    bracesAdded: recBraces - origBraces,
    bracketsAdded: recBrackets - origBrackets,
    quotesAdded: recQuotes - origQuotes,
    commasRemoved: origCommas - recCommas,
    quotesFixed: 0, // Would need more sophisticated tracking
    strategy: 'combined'
  }
}

/**
 * Attempt to fix common LLM JSON generation errors
 *
 * @param json - Potentially malformed JSON from LLM
 * @returns Recovery result
 */
export function fixLLMJSON(json: string): RecoveryResult {
  // LLMs often generate JSON with these issues:
  // 1. Incomplete generation (cut off mid-stream)
  // 2. Missing closing braces
  // 3. Trailing commas
  // 4. Occasionally single quotes

  // Try strategies in order of likelihood
  let result = recoverMissingBraces(json)
  if (result.success) return result

  result = recoverTrailingComma(json)
  if (result.success) return result

  result = recoverInvalidSyntax(json)
  if (result.success) return result

  result = recoverTruncatedString(json)
  if (result.success) return result

  // If all else fails, try to extract what we can
  return extractPartialJSON(json)
}

/**
 * Extract any valid JSON fragments from malformed input
 *
 * @param json - Malformed JSON
 * @returns Recovery result with partial data
 */
export function extractPartialJSON(json: string): RecoveryResult {
  const partial: Record<string, unknown> = {}

  // Extract complete key-value pairs
  const keyValueRegex = /"([^"]+)"\s*:\s*("(?:[^"\\]|\\.)*"|true|false|null|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g

  let match
  let extractedCount = 0
  while ((match = keyValueRegex.exec(json)) !== null) {
    const key = match[1]
    const valueStr = match[2]

    try {
      if (valueStr) {
        let value: unknown
        if (valueStr.startsWith('"')) {
          value = JSON.parse(valueStr)
        } else if (valueStr === 'true') {
          value = true
        } else if (valueStr === 'false') {
          value = false
        } else if (valueStr === 'null') {
          value = null
        } else {
          value = parseFloat(valueStr)
        }

        if (value !== undefined) {
          partial[key] = value
          extractedCount++
        }
      }
    } catch {
      // Skip invalid values
    }
  }

  if (extractedCount > 0) {
    return {
      success: true,
      parsed: partial,
      strategy: `partial_extraction (${extractedCount} properties)`
    }
  }

  return {
    success: false,
    error: 'No valid JSON fragments found'
  }
}
