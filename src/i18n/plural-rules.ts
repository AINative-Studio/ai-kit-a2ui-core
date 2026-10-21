/**
 * CLDR-style plural rule categories
 * https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html
 *
 * Delegates to the runtime's Intl.PluralRules (available in Node 18+ and all
 * modern browsers) rather than reimplementing CLDR plural math per locale.
 */

export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'

/**
 * Locales with documented CLDR plural rule support, used as the supported-
 * locale list surfaced to callers (not an exhaustive list of every locale
 * Intl.PluralRules can handle, but the set this library commits to).
 */
const SUPPORTED_LOCALES = [
  'af', 'am', 'ar', 'az', 'be', 'bg', 'bn', 'bs', 'ca', 'cs',
  'cy', 'da', 'de', 'el', 'en', 'es', 'et', 'eu', 'fa', 'fi',
  'fil', 'fr', 'ga', 'gl', 'gu', 'he', 'hi', 'hr', 'hu', 'hy',
  'id', 'is', 'it', 'ja', 'ka', 'kk', 'km', 'kn', 'ko', 'ky',
  'lo', 'lt', 'lv', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my',
  'nb', 'ne', 'nl', 'pa', 'pl', 'pt', 'ro', 'ru', 'si', 'sk',
  'sl', 'sq', 'sr', 'sv', 'sw', 'ta', 'te', 'th', 'tr', 'uk',
  'ur', 'uz', 'vi', 'zh', 'zu',
]

const SUPPORTED_LOCALE_SET = new Set(SUPPORTED_LOCALES)

/**
 * Get the CLDR plural category for a count in a given locale.
 */
export function getPluralForm(count: number, locale: string): PluralCategory {
  try {
    const rules = new Intl.PluralRules(locale)
    return rules.select(count) as PluralCategory
  } catch {
    // Unknown/invalid locale: fall back to English-style binary pluralization.
    return count === 1 ? 'one' : 'other'
  }
}

/**
 * List of locales this library commits to supporting.
 */
export function getSupportedLocales(): string[] {
  return [...SUPPORTED_LOCALES]
}

/**
 * Check whether a locale is in the supported list.
 */
export function isLocaleSupported(locale: string): boolean {
  return SUPPORTED_LOCALE_SET.has(locale)
}
