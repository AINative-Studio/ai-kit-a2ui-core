import { describe, it, expect, vi } from 'vitest'
import { I18n } from '../../src/i18n/i18n.js'
import { I18nHelper } from '../../src/i18n/helper.js'
import { TranslationManager } from '../../src/i18n/manager.js'
import { getPluralForm, getSupportedLocales, isLocaleSupported } from '../../src/i18n/plural-rules.js'

describe('I18n Framework Comprehensive Tests', () => {
  // Test data
  const enTranslations = {
    greeting: 'Hello',
    welcome: 'Welcome, {{name}}!',
    items: {
      one: '{{count}} item',
      other: '{{count}} items',
    },
    nested: {
      deep: {
        value: 'Nested value',
      },
    },
  }

  const frTranslations = {
    greeting: 'Bonjour',
    welcome: 'Bienvenue, {{name}} !',
  }

  describe('Plural Rules', () => {
    it('should work for English', () => {
      expect(getPluralForm(1, 'en')).toBe('one')
      expect(getPluralForm(2, 'en')).toBe('other')
    })

    it('should work for Russian', () => {
      expect(getPluralForm(1, 'ru')).toBe('one')
      expect(getPluralForm(2, 'ru')).toBe('few')
      expect(getPluralForm(5, 'ru')).toBe('many')
    })

    it('should work for Arabic', () => {
      expect(getPluralForm(0, 'ar')).toBe('zero')
      expect(getPluralForm(1, 'ar')).toBe('one')
      expect(getPluralForm(2, 'ar')).toBe('two')
    })

    it('should return supported locales', () => {
      const locales = getSupportedLocales()
      expect(locales.length).toBeGreaterThan(50)
      expect(locales).toContain('en')
      expect(locales).toContain('ar')
      expect(locales).toContain('ru')
    })

    it('should check locale support', () => {
      expect(isLocaleSupported('en')).toBe(true)
      expect(isLocaleSupported('xyz')).toBe(false)
    })
  })

  describe('I18nHelper', () => {
    it('should normalize locales', () => {
      expect(I18nHelper.normalizeLocale('en_US')).toBe('en-US')
      expect(I18nHelper.normalizeLocale('fr_FR')).toBe('fr-FR')
    })

    it('should validate locales', () => {
      expect(I18nHelper.isValidLocale('en')).toBe(true)
      expect(I18nHelper.isValidLocale('en-US')).toBe(true)
      expect(I18nHelper.isValidLocale('invalid')).toBe(false)
    })

    it('should detect RTL', () => {
      expect(I18nHelper.isRTL('ar')).toBe(true)
      expect(I18nHelper.isRTL('he')).toBe(true)
      expect(I18nHelper.isRTL('en')).toBe(false)
    })

    it('should get locale direction', () => {
      expect(I18nHelper.getLocaleDirection('ar')).toBe('rtl')
      expect(I18nHelper.getLocaleDirection('en')).toBe('ltr')
    })

    it('should get display names', () => {
      expect(I18nHelper.getLocaleDisplayName('en')).toBe('English')
      expect(I18nHelper.getLocaleDisplayName('fr')).toBe('French')
    })

    it('should extract base locale', () => {
      expect(I18nHelper.getBaseLocale('en-US')).toBe('en')
      expect(I18nHelper.getBaseLocale('fr-FR')).toBe('fr')
    })

    it('should flatten keys', () => {
      const obj = { a: { b: 'value' } }
      const keys = I18nHelper.flattenKeys(obj)
      expect(keys).toContain('a.b')
    })

    it('should merge translations', () => {
      const base = { a: 'A' }
      const override = { b: 'B' }
      const merged = I18nHelper.mergeTranslations(base, override)
      expect(merged).toEqual({ a: 'A', b: 'B' })
    })
  })

  describe('I18n Core', () => {
    it('should create instance', () => {
      const i18n = new I18n({
        defaultLocale: 'en',
        locales: ['en', 'fr'],
        translations: { en: enTranslations, fr: frTranslations },
      })
      expect(i18n.getLocale()).toBe('en')
    })

    it('should translate keys', () => {
      const i18n = new I18n({
        defaultLocale: 'en',
        locales: ['en'],
        translations: { en: enTranslations },
      })
      expect(i18n.t('greeting')).toBe('Hello')
    })

    it('should interpolate params', () => {
      const i18n = new I18n({
        defaultLocale: 'en',
        locales: ['en'],
        translations: { en: enTranslations },
      })
      expect(i18n.t('welcome', { name: 'Alice' })).toBe('Welcome, Alice!')
    })

    it('should handle plurals', () => {
      const i18n = new I18n({
        defaultLocale: 'en',
        locales: ['en'],
        translations: { en: enTranslations },
      })
      expect(i18n.tp('items', 1)).toBe('1 item')
      expect(i18n.tp('items', 5)).toBe('5 items')
    })

    it('should switch locales', async () => {
      const i18n = new I18n({
        defaultLocale: 'en',
        locales: ['en', 'fr'],
        translations: { en: enTranslations, fr: frTranslations },
      })
      expect(i18n.t('greeting')).toBe('Hello')
      await i18n.setLocale('fr')
      expect(i18n.t('greeting')).toBe('Bonjour')
    })

    it('should format numbers', () => {
      const i18n = new I18n({
        defaultLocale: 'en-US',
        locales: ['en-US'],
        translations: { 'en-US': {} },
      })
      expect(i18n.formatNumber(1234.56)).toContain('1,234')
    })

    it('should format currency', () => {
      const i18n = new I18n({
        defaultLocale: 'en-US',
        locales: ['en-US'],
        translations: { 'en-US': {} },
      })
      const result = i18n.formatCurrency(100, 'USD')
      expect(result).toContain('100')
    })

    it('should format dates', () => {
      const i18n = new I18n({
        defaultLocale: 'en-US',
        locales: ['en-US'],
        translations: { 'en-US': {} },
      })
      const result = i18n.formatDate(new Date('2024-01-01'))
      expect(result).toBeDefined()
    })

    it('should check key existence', () => {
      const i18n = new I18n({
        defaultLocale: 'en',
        locales: ['en'],
        translations: { en: enTranslations },
      })
      expect(i18n.has('greeting')).toBe(true)
      expect(i18n.has('missing')).toBe(false)
    })

    it('should add translations', () => {
      const i18n = new I18n({
        defaultLocale: 'en',
        locales: ['en'],
        translations: { en: { a: 'A' } },
      })
      i18n.addTranslations('en', { b: 'B' })
      expect(i18n.t('a')).toBe('A')
      expect(i18n.t('b')).toBe('B')
    })
  })

  describe('TranslationManager', () => {
    const manager = new TranslationManager()

    it('should generate template', () => {
      const template = manager.generateTemplate(['key1', 'key2'], 'en', false)
      expect(template).toHaveProperty('key1')
      expect(template).toHaveProperty('key2')
    })

    it('should validate translations', () => {
      const base = { greeting: 'Hello' }
      const target = { en: { greeting: 'Hello' } }
      const report = manager.validateTranslations(base, target)
      expect(report.valid).toBe(true)
    })

    it('should detect missing keys', () => {
      const base = { greeting: 'Hello', farewell: 'Goodbye' }
      const target = { en: { greeting: 'Hello' } }
      const report = manager.validateTranslations(base, target)
      expect(report.valid).toBe(false)
      expect(report.missing.en).toContain('farewell')
    })

    it('should calculate stats', () => {
      const base = { a: 'A', b: 'B' }
      const target = { a: 'A' }
      const stats = manager.getTranslationStats(base, target)
      expect(stats.totalKeys).toBe(2)
      expect(stats.translatedKeys).toBe(1)
      expect(stats.coverage).toBe(50)
    })

    it('should find missing translations', () => {
      const base = { a: 'A', b: 'B' }
      const target = { a: 'A' }
      const missing = manager.findMissingTranslations(base, target)
      expect(missing).toContain('b')
    })

    it('should merge translations', () => {
      const result = manager.mergeTranslations({ a: 'A' }, { b: 'B' })
      expect(result).toEqual({ a: 'A', b: 'B' })
    })

    it('should flatten/unflatten translations', () => {
      const nested = { a: { b: 'value' } }
      const flat = manager.flattenTranslations(nested)
      expect(flat['a.b']).toBe('value')

      const unflattened = manager.unflattenTranslations(flat)
      expect((unflattened.a as Record<string, unknown>).b).toBe('value')
    })

    it('should diff translations', () => {
      const old = { a: 'A' }
      const updated = { a: 'A', b: 'B' }
      const diff = manager.diffTranslations(old, updated)
      expect(diff.added).toContain('b')
    })
  })
})
