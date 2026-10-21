/**
 * I18n: translation lookup, interpolation, pluralization, and
 * locale-aware number/currency/date formatting.
 */

import { getPluralForm } from './plural-rules.js'

type TranslationTree = Record<string, unknown>

export interface I18nOptions {
  defaultLocale: string
  locales: string[]
  translations: Record<string, TranslationTree>
}

function getByPath(tree: TranslationTree, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    if (node !== null && typeof node === 'object') {
      return (node as TranslationTree)[key]
    }
    return undefined
  }, tree)
}

function setByPath(tree: TranslationTree, path: string, value: unknown): void {
  const parts = path.split('.')
  let node = tree

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!
    if (typeof node[part] !== 'object' || node[part] === null) {
      node[part] = {}
    }
    node = node[part] as TranslationTree
  }

  node[parts[parts.length - 1]!] = value
}

function interpolate(template: string, params?: Record<string, unknown>): string {
  if (!params) return template
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    const value = params[key]
    return value === undefined ? match : String(value)
  })
}

export class I18n {
  private locale: string
  private readonly defaultLocale: string
  private readonly locales: string[]
  private readonly translations: Record<string, TranslationTree>

  constructor(options: I18nOptions) {
    this.defaultLocale = options.defaultLocale
    this.locale = options.defaultLocale
    this.locales = options.locales
    this.translations = options.translations
  }

  /**
   * Current active locale.
   */
  getLocale(): string {
    return this.locale
  }

  /**
   * Switch the active locale. Resolves once the locale is applied.
   */
  async setLocale(locale: string): Promise<void> {
    if (!this.locales.includes(locale)) {
      throw new Error(`Locale "${locale}" is not configured`)
    }
    this.locale = locale
  }

  /**
   * Translate a key, with optional interpolation params. Falls back to the
   * default locale, then returns the key itself if no translation exists.
   */
  t(key: string, params?: Record<string, unknown>): string {
    const value =
      getByPath(this.translations[this.locale] ?? {}, key) ??
      getByPath(this.translations[this.defaultLocale] ?? {}, key)

    if (typeof value !== 'string') return key
    return interpolate(value, params)
  }

  /**
   * Translate a pluralizable key, selecting the CLDR plural category for
   * `count` and interpolating `{{count}}` plus any extra params.
   */
  tp(key: string, count: number, params?: Record<string, unknown>): string {
    const category = getPluralForm(count, this.locale)
    const node = getByPath(this.translations[this.locale] ?? {}, key)

    let template: unknown
    if (node !== null && typeof node === 'object') {
      const forms = node as Record<string, string>
      template = forms[category] ?? forms['other']
    } else {
      template = node
    }

    if (typeof template !== 'string') return key
    return interpolate(template, { count, ...params })
  }

  /**
   * Whether a translation exists for a key in the active (or default) locale.
   */
  has(key: string): boolean {
    const value =
      getByPath(this.translations[this.locale] ?? {}, key) ??
      getByPath(this.translations[this.defaultLocale] ?? {}, key)
    return value !== undefined
  }

  /**
   * Merge additional translations into a locale at runtime.
   */
  addTranslations(locale: string, translations: TranslationTree): void {
    const existing = this.translations[locale] ?? {}
    for (const [key, value] of Object.entries(translations)) {
      setByPath(existing, key, value)
    }
    this.translations[locale] = existing
  }

  /**
   * Locale-aware number formatting.
   */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.locale, options).format(value)
  }

  /**
   * Locale-aware currency formatting.
   */
  formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat(this.locale, { style: 'currency', currency }).format(value)
  }

  /**
   * Locale-aware date formatting.
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.locale, options).format(date)
  }
}
