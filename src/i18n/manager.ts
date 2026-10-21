/**
 * Translation management utilities: template generation, coverage
 * validation/stats, flatten/unflatten, and diffing between translation
 * trees.
 */

type TranslationTree = Record<string, unknown>

export interface TranslationValidationReport {
  valid: boolean
  missing: Record<string, string[]>
  extra: Record<string, string[]>
}

export interface TranslationStats {
  totalKeys: number
  translatedKeys: number
  coverage: number
}

export interface TranslationDiff {
  added: string[]
  removed: string[]
  changed: string[]
}

function flatten(obj: TranslationTree, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flatten(value as TranslationTree, fullKey))
    } else {
      result[fullKey] = value
    }
  }

  return result
}

function unflatten(flat: Record<string, unknown>): TranslationTree {
  const result: TranslationTree = {}

  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.')
    let node = result

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!
      if (typeof node[part] !== 'object' || node[part] === null) {
        node[part] = {}
      }
      node = node[part] as TranslationTree
    }

    node[parts[parts.length - 1]!] = value
  }

  return result
}

export class TranslationManager {
  /**
   * Generate a translation template from a list of keys, optionally
   * nesting dot-delimited keys into a tree.
   */
  generateTemplate(
    keys: string[],
    locale: string,
    nested = false
  ): TranslationTree {
    const flat: Record<string, string> = {}
    for (const key of keys) {
      flat[key] = `[${locale}] ${key}`
    }
    return nested ? unflatten(flat) : flat
  }

  /**
   * Compare a base translation tree against one or more target locale
   * trees, reporting missing/extra keys per locale.
   */
  validateTranslations(
    base: TranslationTree,
    targets: Record<string, TranslationTree>
  ): TranslationValidationReport {
    const baseKeys = new Set(Object.keys(flatten(base)))
    const missing: Record<string, string[]> = {}
    const extra: Record<string, string[]> = {}
    let valid = true

    for (const [locale, tree] of Object.entries(targets)) {
      const targetKeys = new Set(Object.keys(flatten(tree)))

      const missingKeys = [...baseKeys].filter((key) => !targetKeys.has(key))
      const extraKeys = [...targetKeys].filter((key) => !baseKeys.has(key))

      if (missingKeys.length > 0) {
        missing[locale] = missingKeys
        valid = false
      }
      if (extraKeys.length > 0) {
        extra[locale] = extraKeys
      }
    }

    return { valid, missing, extra }
  }

  /**
   * Compute translation coverage of a target tree against a base tree.
   */
  getTranslationStats(
    base: TranslationTree,
    target: TranslationTree
  ): TranslationStats {
    const baseKeys = Object.keys(flatten(base))
    const targetKeys = new Set(Object.keys(flatten(target)))

    const totalKeys = baseKeys.length
    const translatedKeys = baseKeys.filter((key) => targetKeys.has(key)).length
    const coverage = totalKeys === 0 ? 100 : Math.round((translatedKeys / totalKeys) * 100)

    return { totalKeys, translatedKeys, coverage }
  }

  /**
   * List base keys absent from a target tree.
   */
  findMissingTranslations(base: TranslationTree, target: TranslationTree): string[] {
    const baseKeys = Object.keys(flatten(base))
    const targetKeys = new Set(Object.keys(flatten(target)))
    return baseKeys.filter((key) => !targetKeys.has(key))
  }

  /**
   * Shallow-merge two translation trees, override taking precedence.
   */
  mergeTranslations(base: TranslationTree, override: TranslationTree): TranslationTree {
    return { ...base, ...override }
  }

  /**
   * Flatten a nested translation tree into dot-delimited keys.
   */
  flattenTranslations(tree: TranslationTree): Record<string, unknown> {
    return flatten(tree)
  }

  /**
   * Rebuild a nested translation tree from dot-delimited keys.
   */
  unflattenTranslations(flat: Record<string, unknown>): TranslationTree {
    return unflatten(flat)
  }

  /**
   * Diff two translation trees, reporting added/removed/changed keys.
   */
  diffTranslations(oldTree: TranslationTree, newTree: TranslationTree): TranslationDiff {
    const oldFlat = flatten(oldTree)
    const newFlat = flatten(newTree)
    const oldKeys = new Set(Object.keys(oldFlat))
    const newKeys = new Set(Object.keys(newFlat))

    const added = [...newKeys].filter((key) => !oldKeys.has(key))
    const removed = [...oldKeys].filter((key) => !newKeys.has(key))
    const changed = [...oldKeys].filter(
      (key) => newKeys.has(key) && oldFlat[key] !== newFlat[key]
    )

    return { added, removed, changed }
  }
}
