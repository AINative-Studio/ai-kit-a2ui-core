/**
 * I18n: translation, pluralization, and locale-aware formatting
 */

export { I18n } from './i18n.js'
export type { I18nOptions } from './i18n.js'
export { I18nHelper } from './helper.js'
export { TranslationManager } from './manager.js'
export type {
  TranslationValidationReport,
  TranslationStats,
  TranslationDiff,
} from './manager.js'
export { getPluralForm, getSupportedLocales, isLocaleSupported } from './plural-rules.js'
export type { PluralCategory } from './plural-rules.js'
