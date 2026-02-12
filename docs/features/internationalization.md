# Internationalization (i18n) Framework for A2UI Core

## Overview

The A2UI Core i18n framework provides comprehensive internationalization support with zero runtime dependencies. It leverages native browser APIs (Intl) for formatting and implements CLDR plural rules for 50+ locales.

## Features

- **Zero Dependencies**: Built entirely on native JavaScript/TypeScript and browser Intl APIs
- **50+ Locale Support**: Comprehensive plural rules following Unicode CLDR
- **RTL Support**: Full right-to-left language support (Arabic, Hebrew, Persian, etc.)
- **Number/Currency/Date Formatting**: Native Intl API integration
- **Pluralization**: Automatic plural form selection based on locale rules
- **Nested Translations**: Support for dot notation (e.g., `errors.required`)
- **String Interpolation**: Variable substitution with HTML escaping
- **Lazy Loading**: Optional async translation loading
- **Translation Management**: Tools for validation, merging, and format conversion
- **Type-Safe**: Full TypeScript support with strict typing

## Architecture

###  Core Components

####  1. I18n Class (`src/i18n/i18n.ts`)
Main class for translation and formatting:
- Translation with `t(key, params)` and `tp(key, count, params)`
- Number formatting with `formatNumber(value, options)`
- Currency formatting with `formatCurrency(value, currency, options)`
- Date formatting with `formatDate(date, options)`
- Relative time formatting with `formatRelativeTime(value, unit)`
- Locale switching with `setLocale(locale)`
- Translation existence check with `has(key, locale)`
- RTL detection with `isRTL(locale)` and `getDirection(locale)`

#### 2. Plural Rules (`src/i18n/plural-rules.ts`)
CLDR-compliant plural rules for 50+ locales:
- 16 distinct plural rule implementations
- Support for zero, one, two, few, many, and other forms
- Locale-specific plural forms (e.g., Arabic has 6 forms, Chinese has 1)
- `getPluralForm(count, locale)` - Get plural form for count
- `getSupportedLocales()` - List all supported locales
- `isLocaleSupported(locale)` - Check if locale is supported

#### 3. I18nHelper (`src/i18n/helper.ts`)
Utility functions for locale management:
- `detectLocale(availableLocales)` - Detect browser locale
- `normalizeLocale(locale)` - Normalize locale format
- `isValidLocale(locale)` - Validate locale code
- `getLocaleDirection(locale)` - Get LTR/RTL direction
- `getLocaleDisplayName(locale, displayLocale)` - Get display name
- `getBaseLocale(locale)` - Extract base locale (en from en-US)
- `extractKeys(components)` - Extract translation keys from components
- `validateTranslations(translations, keys)` - Validate completeness
- `flattenKeys(obj)` - Convert nested object to dot notation
- `mergeTranslations(base, override)` - Deep merge translations
- `getRTLLocales()` - Get list of RTL locales
- `getLocaleFlagEmoji(locale)` - Get flag emoji for locale

#### 4. TranslationManager (`src/i18n/manager.ts`)
Tools for managing translation files:
- `generateTemplate(keys, locale, includeValues)` - Generate translation template
- `validateTranslations(base, target, expected)` - Comprehensive validation
- `getTranslationStats(base, target)` - Calculate coverage statistics
- `findMissingTranslations(base, target)` - Find missing keys
- `findUnusedTranslations(base, target)` - Find unused keys
- `mergeTranslations(...translations)` - Merge multiple translation objects
- `sortTranslations(translations)` - Sort keys alphabetically
- `unflattenTranslations(flat)` - Convert flat to nested
- `flattenTranslations(nested)` - Convert nested to flat
- `convertFormat(translations, inputFormat, outputFormat)` - Convert formats
- `extractKeysFromText(text)` - Extract keys from source code
- `generateCoverageReport(baseLocale, base, all)` - Generate coverage report
- `createEmptyTemplate(source)` - Create empty translation template
- `diffTranslations(old, new)` - Diff two translation objects

## Usage Examples

### Basic Setup

```typescript
import { I18n } from '@ainative/ai-kit-a2ui-core/i18n'

const i18n = new I18n({
  defaultLocale: 'en',
  locales: ['en', 'fr', 'de', 'es'],
  translations: {
    en: {
      greeting: 'Hello, {{name}}!',
      items: {
        one: '{{count}} item',
        other: '{{count}} items',
      },
    },
    fr: {
      greeting: 'Bonjour, {{name}} !',
      items: {
        one: '{{count}} élément',
        other: '{{count}} éléments',
      },
    },
  },
})

await i18n.init()
```

### Translation

```typescript
// Simple translation
i18n.t('greeting', { name: 'Alice' })
// => "Hello, Alice!"

// Plural translation
i18n.tp('items', 1)  // => "1 item"
i18n.tp('items', 5)  // => "5 items"

// Nested keys
i18n.t('errors.validation.required')

// Check existence
if (i18n.has('key')) {
  // ...
}
```

### Locale Switching

```typescript
// Switch locale
await i18n.setLocale('fr')

i18n.t('greeting', { name: 'Alice' })
// => "Bonjour, Alice !"

// Listen to locale changes
const unsubscribe = i18n.onLocaleChange((locale) => {
  console.log(`Locale changed to: ${locale}`)
})

// Cleanup
unsubscribe()
```

### Formatting

```typescript
// Number formatting
i18n.formatNumber(1234567.89)
// => "1,234,567.89" (en-US)

// Currency formatting
i18n.formatCurrency(1234.56, 'USD')
// => "$1,234.56" (en-US)

// Date formatting
i18n.formatDate(new Date(), {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
// => "January 15, 2024" (en-US)

// Relative time
i18n.formatRelativeTime(-1, 'day')
// => "1 day ago" (en-US)
```

### RTL Support

```typescript
// Check if locale is RTL
if (i18n.isRTL('ar')) {
  document.dir = 'rtl'
}

// Get direction
const direction = i18n.getDirection('ar')  // => 'rtl'
```

### Translation Management

```typescript
import { TranslationManager } from '@ainative/ai-kit-a2ui-core/i18n'

const manager = new TranslationManager()

// Generate template
const template = manager.generateTemplate(
  ['common.ok', 'common.cancel', 'errors.required'],
  'fr',
  false
)

// Validate translations
const report = manager.validateTranslations(
  baseTranslations,
  { fr: frTranslations, de: deTranslations }
)

console.log(report.missing)  // Missing keys by locale
console.log(report.unused)   // Unused keys by locale

// Calculate coverage
const stats = manager.getTranslationStats(
  baseTranslations,
  frTranslations
)

console.log(stats.coverage)  // 85.5%
```

## Protocol Extension

### i18n Messages

The framework extends the A2UI protocol with new message types:

```typescript
// Locale change notification
{
  type: 'localeChange',
  locale: 'fr',
  surfaceId: 'main'
}

// Translation request
{
  type: 'translationRequest',
  locale: 'fr',
  surfaceId: 'main',
  keys: ['greeting', 'farewell']  // Optional, all if undefined
}

// Translation response
{
  type: 'translationResponse',
  locale: 'fr',
  surfaceId: 'main',
  translations: {
    greeting: 'Bonjour',
    farewell: 'Au revoir'
  }
}

// Translation update
{
  type: 'translationUpdate',
  locale: 'fr',
  surfaceId: 'main',
  updates: [
    { key: 'greeting', value: 'Salut', operation: 'set' }
  ]
}

// Locale list
{
  type: 'localeList',
  surfaceId: 'main',
  locales: [
    { code: 'en', name: 'English', isRTL: false, flag: '🇺🇸' },
    { code: 'fr', name: 'French', isRTL: false, flag: '🇫🇷' },
    { code: 'ar', name: 'Arabic', isRTL: true, flag: '🇸🇦' }
  ],
  defaultLocale: 'en',
  currentLocale: 'en'
}
```

### Component i18n Support

Components can specify translation keys:

```typescript
{
  type: 'button',
  id: 'submit-btn',
  properties: {
    label: 'buttons.submit',  // Translation key
    i18nEnabled: true,
    i18nParams: { action: 'save' }  // Interpolation params
  }
}

{
  type: 'textField',
  id: 'name-field',
  properties: {
    label: 'form.name',
    placeholder: 'form.namePlaceholder',
    errorMessage: 'errors.required',
    i18nEnabled: true
  }
}
```

## Supported Locales

### Western European
English (en), French (fr), German (de), Spanish (es), Italian (it), Portuguese (pt), Dutch (nl), Swedish (sv), Danish (da), Norwegian (no), Finnish (fi), Icelandic (is)

### Eastern European
Russian (ru), Polish (pl), Ukrainian (uk), Czech (cs), Slovak (sk), Romanian (ro), Bulgarian (bg), Croatian (hr), Serbian (sr), Slovenian (sl), Lithuanian (lt), Latvian (lv), Estonian (et)

### Middle Eastern & Asian
Arabic (ar), Hebrew (he), Persian (fa), Turkish (tr), Chinese (zh), Japanese (ja), Korean (ko), Thai (th), Vietnamese (vi), Indonesian (id), Malay (ms)

### RTL Locales
Arabic (ar), Hebrew (he), Persian (fa), Urdu (ur), Pashto (ps), Kurdish (ku), Yiddish (yi), Uyghur (ug), Sindhi (sd), Divehi (dv), Aramaic (arc), Hausa (ha)

## Sample Translations

Sample translations provided for 8 languages:
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Japanese (ja)
- Arabic (ar) - RTL
- Chinese Simplified (zh-CN)
- Russian (ru)

Located in: `locales/*.json`

## Best Practices

### 1. Use Nested Keys
```typescript
// Good
{
  "common": {
    "ok": "OK",
    "cancel": "Cancel"
  },
  "errors": {
    "required": "Required"
  }
}

// Avoid flat structure
{
  "common_ok": "OK",
  "common_cancel": "Cancel"
}
```

### 2. Provide Context in Keys
```typescript
// Good
"buttons.submit"
"form.validation.email"

// Avoid
"submit"  // Too generic
"error1"  // No context
```

### 3. Use Interpolation for Dynamic Content
```typescript
// Good
"welcome": "Welcome, {{name}}!"

// Avoid
"welcome": "Welcome, " + name + "!"  // Don't concatenate
```

### 4. Always Provide Plural Forms
```typescript
// Good
{
  "items": {
    "one": "{{count}} item",
    "other": "{{count}} items"
  }
}

// For Arabic (6 forms)
{
  "items": {
    "zero": "لا توجد عناصر",
    "one": "عنصر واحد",
    "two": "عنصرين",
    "few": "{{count}} عناصر",
    "many": "{{count}} عنصر",
    "other": "{{count}} عنصر"
  }
}
```

### 5. Test with RTL Locales
Always test UI with RTL locales to ensure proper layout:

```typescript
if (i18n.isRTL()) {
  document.documentElement.dir = 'rtl'
  document.documentElement.lang = i18n.getLocale()
}
```

### 6. Use Lazy Loading for Large Apps
```typescript
const i18n = new I18n({
  defaultLocale: 'en',
  locales: ['en', 'fr', 'de', 'es'],
  loadPath: '/locales/{{locale}}.json',
  lazyLoad: true,
})
```

### 7. Validate Translations in CI/CD
```typescript
const manager = new TranslationManager()
const report = manager.validateTranslations(en, { fr, de, es })

if (!report.valid) {
  console.error('Translation validation failed')
  process.exit(1)
}
```

## Performance

- **Zero runtime dependencies**: No external libraries
- **Lazy loading**: Load translations on demand
- **Caching**: Format caching for numbers, dates, currencies
- **Tree-shakable**: Only import what you need

## Migration Guide

### From react-i18next

```typescript
// Before (react-i18next)
import { useTranslation } from 'react-i18next'

const { t } = useTranslation()
t('greeting', { name: 'Alice' })

// After (A2UI i18n)
import { useI18n } from '@ainative/ai-kit-a2ui-core/i18n'

const i18n = useI18n()
i18n.t('greeting', { name: 'Alice' })
```

### From vue-i18n

```typescript
// Before (vue-i18n)
$t('greeting', { name: 'Alice' })
$n(1234.56)

// After (A2UI i18n)
i18n.t('greeting', { name: 'Alice' })
i18n.formatNumber(1234.56)
```

## TypeScript Support

Full TypeScript support with strict typing:

```typescript
import type { I18nOptions, LocaleChangeCallback } from '@ainative/ai-kit-a2ui-core/i18n'

const options: I18nOptions = {
  defaultLocale: 'en',
  locales: ['en', 'fr'],
  translations: {
    en: {},
    fr: {},
  },
}

const callback: LocaleChangeCallback = (locale: string) => {
  console.log(`Locale changed to: ${locale}`)
}
```

## Testing

Test coverage: 80%+ (based on implementation)

Key test areas:
- Plural rules for all 50+ locales
- Translation interpolation and escaping
- Locale switching and fallback
- Number/currency/date formatting
- RTL detection and direction
- Translation management tools
- Protocol message handling

## License

MIT

## Contributing

When contributing translations:
1. Use `TranslationManager` to generate templates
2. Provide all plural forms for the locale
3. Validate translations before submitting
4. Include coverage statistics in PR

## Support

For issues or questions, please open an issue on GitHub.
