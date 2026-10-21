/**
 * I18n helper utilities: locale normalization/validation, RTL detection,
 * display names, and plain-object translation tree manipulation.
 */

const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur', 'yi', 'ps', 'sd'])

const DISPLAY_NAME_FALLBACK: Record<string, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  ar: 'Arabic',
  he: 'Hebrew',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
}

type TranslationTree = Record<string, unknown>

export class I18nHelper {
  /**
   * Normalize a locale tag to BCP 47 form, e.g. "en_US" -> "en-US".
   */
  static normalizeLocale(locale: string): string {
    const parts = locale.split(/[-_]/)
    if (parts.length === 1) return parts[0]!.toLowerCase()

    const [language, ...rest] = parts
    const region = rest[rest.length - 1]
    return `${language!.toLowerCase()}-${region!.toUpperCase()}`
  }

  /**
   * Check whether a string is a structurally valid, recognized locale tag.
   */
  static isValidLocale(locale: string): boolean {
    try {
      const normalized = I18nHelper.normalizeLocale(locale)
      // Intl throws RangeError on structurally invalid tags.
      new Intl.Locale(normalized)
      return /^[a-z]{2,3}(-[A-Z]{2}|-[0-9]{3})?$/.test(normalized)
    } catch {
      return false
    }
  }

  /**
   * Whether a locale's script is right-to-left.
   */
  static isRTL(locale: string): boolean {
    return RTL_LOCALES.has(I18nHelper.getBaseLocale(locale))
  }

  /**
   * Text direction for a locale.
   */
  static getLocaleDirection(locale: string): 'ltr' | 'rtl' {
    return I18nHelper.isRTL(locale) ? 'rtl' : 'ltr'
  }

  /**
   * Human-readable display name for a locale, in English.
   */
  static getLocaleDisplayName(locale: string): string {
    const base = I18nHelper.getBaseLocale(locale)
    try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'language' })
      return displayNames.of(base) ?? DISPLAY_NAME_FALLBACK[base] ?? locale
    } catch {
      return DISPLAY_NAME_FALLBACK[base] ?? locale
    }
  }

  /**
   * Extract the base language subtag, e.g. "en-US" -> "en".
   */
  static getBaseLocale(locale: string): string {
    return I18nHelper.normalizeLocale(locale).split('-')[0]!
  }

  /**
   * Flatten a nested translation tree into dot-delimited keys.
   */
  static flattenKeys(obj: TranslationTree, prefix = ''): string[] {
    const keys: string[] = []

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        keys.push(...I18nHelper.flattenKeys(value as TranslationTree, fullKey))
      } else {
        keys.push(fullKey)
      }
    }

    return keys
  }

  /**
   * Shallow-merge two translation trees, override taking precedence.
   */
  static mergeTranslations(
    base: TranslationTree,
    override: TranslationTree
  ): TranslationTree {
    return { ...base, ...override }
  }
}
