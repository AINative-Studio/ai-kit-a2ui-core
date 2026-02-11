# Accessibility Testing for A2UI Core

## Overview

A2UI Core includes comprehensive WCAG 2.1 AA compliance testing tools to ensure all UI components meet accessibility standards. The testing suite validates color contrast, text alternatives, keyboard navigation, ARIA labels, semantic structure, form labels, heading hierarchy, and focus order.

## Test Results

**Test Coverage: 93.33% (Statement Coverage)**
- **101 Tests Passing**
- **8 Accessibility Rules Implemented**
- **WCAG 2.1 Level AA Compliance**

### Coverage Details

```
File               | % Stmts | % Branch | % Funcs | % Lines
-------------------|---------|----------|---------|--------
a11y/              |   93.33 |    80.35 |    97.5 |   93.33
  validator.ts     |   99.69 |    92.15 |     100 |   99.69
  helper.ts        |   94.73 |    73.77 |   91.66 |   94.73
  report-generator |   99.25 |    86.36 |     100 |   99.25
  test-runner.ts   |   78.03 |    70.58 |     100 |   78.03
a11y/utils/        |     100 |    97.61 |     100 |     100
  color-utils.ts   |     100 |    97.61 |     100 |     100
a11y/rules/        |      62 |    71.16 |    92.3 |      62
  text-altern...   |     100 |    94.73 |     100 |     100
  color-contrast   |    91.5 |       80 |     100 |    91.5
  aria-labels.ts   |   75.62 |       85 |     100 |   75.62
```

## Quick Start

### Basic Usage

```typescript
import { A11yValidator } from '@ainative/ai-kit-a2ui-core/a11y'

// Create validator (default WCAG AA)
const validator = new A11yValidator()

// Validate a component
const button = {
  id: 'btn-1',
  type: 'button',
  properties: { label: 'Click me' }
}

const result = validator.validateComponent(button)
console.log(`Score: ${result.score}/100`)
console.log(`Valid: ${result.valid}`)
console.log(`Violations: ${result.violations.length}`)
```

### Validate Entire Surface

```typescript
import { A11yValidator } from '@ainative/ai-kit-a2ui-core/a11y'

const validator = new A11yValidator({ level: 'AA' })

const surface = {
  type: 'createSurface',
  surfaceId: 'my-surface',
  components: [
    { id: 'header', type: 'text', properties: { value: 'Hello' } },
    { id: 'btn', type: 'button', properties: { label: 'Submit' } },
    { id: 'img', type: 'image', properties: { src: 'pic.jpg', alt: 'Description' } }
  ]
}

const result = validator.validateSurface(surface)

if (!result.valid) {
  result.violations.forEach(violation => {
    console.error(`[${violation.severity}] ${violation.description}`)
    console.error(`Fix: ${violation.fix}`)
  })
}
```

## WCAG 2.1 Rules Covered

### 1. Color Contrast (WCAG 1.4.3, 1.4.6)

Validates sufficient contrast between text and background colors.

**Requirements:**
- Normal text: 4.5:1 contrast ratio (AA), 7:1 (AAA)
- Large text (18pt+ or 14pt+ bold): 3:1 (AA), 4.5:1 (AAA)

**Example Violations:**

```typescript
// Bad: Low contrast
{
  id: 'text-1',
  type: 'text',
  properties: {
    value: 'Low contrast',
    color: '#cccccc',  // Too light on white background
  }
}

// Good: High contrast
{
  id: 'text-2',
  type: 'text',
  properties: {
    value: 'High contrast',
    color: '#000000',  // Black on white = 21:1 ratio
  }
}
```

### 2. Text Alternatives (WCAG 1.1.1)

All non-text content must have text alternatives.

**Requirements:**
- Images: `alt` attribute or `ariaLabel`
- Videos: `captions` or `transcript`
- Audio: `transcript`
- Icons: `label`, `ariaLabel`, or `title`

**Example:**

```typescript
// Bad: No alt text
{
  id: 'img-1',
  type: 'image',
  properties: { src: 'photo.jpg' }
}

// Good: Alt text provided
{
  id: 'img-2',
  type: 'image',
  properties: {
    src: 'photo.jpg',
    alt: 'Team photo from company retreat'
  }
}
```

### 3. Keyboard Navigation (WCAG 2.1.1, 2.1.2)

All interactive elements must be keyboard accessible.

**Requirements:**
- Interactive elements must have keyboard handlers
- No keyboard traps
- Logical tab order

**Example:**

```typescript
// Bad: onClick without keyboard support
{
  id: 'div-1',
  type: 'row',
  properties: {
    onClick: 'handleClick'  // Missing keyboard handler
  }
}

// Good: Proper button with keyboard support
{
  id: 'btn-1',
  type: 'button',
  properties: {
    label: 'Submit',
    onKeyPress: 'handleKeyPress',
    tabIndex: 0
  }
}
```

### 4. ARIA Labels (WCAG 4.1.2)

Interactive elements must have accessible names.

**Requirements:**
- Form controls: `label` or `ariaLabel`
- Buttons: `label` or `ariaLabel`
- Custom components: proper ARIA attributes

**Example:**

```typescript
// Bad: No label
{
  id: 'field-1',
  type: 'textField',
  properties: {
    placeholder: 'Enter email'  // Placeholder is not a label
  }
}

// Good: Proper label
{
  id: 'field-2',
  type: 'textField',
  properties: {
    label: 'Email Address',
    placeholder: 'you@example.com'
  }
}
```

### 5. Semantic Structure (WCAG 1.3.1)

Content must use proper semantic structure.

**Requirements:**
- Use appropriate component types
- Lists use list components
- Tables have captions
- Proper roles

**Example:**

```typescript
// Bad: Using layout for interactive element
{
  id: 'div-btn',
  type: 'column',
  properties: { onClick: 'submit' }
}

// Good: Use button component
{
  id: 'btn',
  type: 'button',
  properties: { label: 'Submit', action: 'submit' }
}
```

### 6. Form Labels (WCAG 3.3.2)

Form controls must have labels and instructions.

**Requirements:**
- All inputs have labels
- Required fields are indicated
- Error messages are associated with fields
- Format instructions for date/time/file inputs

**Example:**

```typescript
// Good: Complete form field
{
  id: 'email-field',
  type: 'textField',
  properties: {
    label: 'Email Address *',
    required: true,
    error: 'Invalid email format',
    ariaDescribedBy: 'email-error',
    helperText: 'We will never share your email'
  }
}
```

### 7. Heading Hierarchy (WCAG 1.3.1, 2.4.6)

Headings must follow logical hierarchy without skipping levels.

**Requirements:**
- Start with h1 or h2
- Don't skip levels (h1 → h3)
- One h1 per page (recommended)

**Example:**

```typescript
// Bad: Skipped heading level
[
  { id: 'h1', type: 'text', properties: { role: 'heading', headingLevel: 1 } },
  { id: 'h3', type: 'text', properties: { role: 'heading', headingLevel: 3 } }  // Skipped h2
]

// Good: Proper hierarchy
[
  { id: 'h1', type: 'text', properties: { role: 'heading', headingLevel: 1 } },
  { id: 'h2', type: 'text', properties: { role: 'heading', headingLevel: 2 } }
]
```

### 8. Focus Order (WCAG 2.4.3)

Focus order must be logical and meaningful.

**Requirements:**
- No positive `tabIndex` values
- Modals manage focus properly
- Focus returns after dialogs close

**Example:**

```typescript
// Bad: Positive tabIndex
{
  id: 'btn-1',
  type: 'button',
  properties: {
    label: 'First',
    tabIndex: 2  // Don't use positive values
  }
}

// Good: Use 0 or rely on DOM order
{
  id: 'btn-1',
  type: 'button',
  properties: {
    label: 'First',
    tabIndex: 0  // Or omit tabIndex entirely
  }
}
```

## Validation Options

### WCAG Levels

```typescript
// Level A (minimum)
const validatorA = new A11yValidator({ level: 'A' })

// Level AA (recommended - default)
const validatorAA = new A11yValidator({ level: 'AA' })

// Level AAA (enhanced)
const validatorAAA = new A11yValidator({ level: 'AAA' })
```

### Selective Rule Testing

```typescript
// Only test specific rules
const validator = new A11yValidator({
  rules: ['color-contrast', 'text-alternatives']
})

// Ignore specific rules
const validator2 = new A11yValidator({
  ignoreRules: ['keyboard-navigation']
})
```

### Custom Context

```typescript
const validator = new A11yValidator({
  context: {
    backgroundColor: '#ffffff',  // Default background
    foregroundColor: '#000000'   // Default text color
  }
})
```

## Helper Utilities

### A11yHelper

Utilities to automatically fix accessibility issues:

```typescript
import { A11yHelper } from '@ainative/ai-kit-a2ui-core/a11y'

const helper = new A11yHelper()

// Generate ARIA label
const label = helper.generateAriaLabel(component)

// Check color contrast
const ratio = helper.calculateContrast('#000000', '#ffffff')

// Suggest accessible colors
const suggestions = helper.suggestAccessibleColors('#cccccc', '#ffffff', 4.5)

// Fix heading hierarchy
const fixed = helper.fixHeadingHierarchy(components)

// Add keyboard navigation
const enhanced = helper.addKeyboardNavigation(component)

// Add ARIA labels
const labeled = helper.addAriaLabels(component)

// Fix form labels
const complete = helper.addFormLabels(component)
```

## Report Generation

### HTML Report

```typescript
import { A11yReportGenerator } from '@ainative/ai-kit-a2ui-core/a11y'

const generator = new A11yReportGenerator()
const result = validator.validateSurface(surface)

// Generate styled HTML report
const html = generator.generateHTML(result)
fs.writeFileSync('accessibility-report.html', html)
```

### JSON Report

```typescript
const json = generator.generateJSON(result)
fs.writeFileSync('accessibility-report.json', JSON.stringify(json, null, 2))
```

### Markdown Report

```typescript
const markdown = generator.generateMarkdown(result)
fs.writeFileSync('accessibility-report.md', markdown)
```

### Summary

```typescript
const summary = generator.generateSummary(result)
console.log(`Score: ${summary.score}/100`)
console.log(`Total Issues: ${summary.totalIssues}`)
console.log(`Critical: ${summary.criticalIssues}`)
console.log(`Serious: ${summary.seriousIssues}`)
```

## Automated Testing

### Test Runner

```typescript
import { A11yTestRunner, A11yValidator } from '@ainative/ai-kit-a2ui-core/a11y'

const validator = new A11yValidator()
const runner = new A11yTestRunner(validator)

// Test single message
const testResult = await runner.testMessage(message)
console.log(`Passed: ${testResult.passed}`)
console.log(`Duration: ${testResult.duration}ms`)

// Test component library
const libraryResult = await runner.testComponentLibrary({
  'button-primary': buttonComponent,
  'input-text': inputComponent,
  'card-default': cardComponent
})

console.log(`Total: ${libraryResult.totalComponents}`)
console.log(`Passed: ${libraryResult.passedComponents}`)
console.log(`Failed: ${libraryResult.failedComponents}`)
console.log(`Score: ${libraryResult.overallScore}/100`)

// Run regression tests
const baseline = [/* previous results */]
const current = [/* current messages */]
const regression = await runner.runRegressionTests(baseline, current)

console.log(`Regression Detected: ${regression.regressionDetected}`)
console.log(`New Violations: ${regression.newViolations.length}`)
console.log(`Fixed Violations: ${regression.fixedViolations.length}`)
```

### Generate Test Reports

```typescript
// Test report
const testReport = runner.generateTestReport(testResults)
fs.writeFileSync('test-report.md', testReport)

// Library report
const libraryReport = runner.generateLibraryReport(libraryResult)
fs.writeFileSync('library-report.md', libraryReport)

// Regression report
const regressionReport = runner.generateRegressionReport(regressionResult)
fs.writeFileSync('regression-report.md', regressionReport)
```

## CI/CD Integration

### Example GitHub Actions Workflow

```yaml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run accessibility tests
        run: npm test tests/a11y

      - name: Generate report
        run: |
          node -e "
          import { A11yValidator, A11yReportGenerator } from './dist/a11y/index.js';
          const validator = new A11yValidator();
          const generator = new A11yReportGenerator();
          // Validate components...
          const html = generator.generateHTML(result);
          require('fs').writeFileSync('a11y-report.html', html);
          "

      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: accessibility-report
          path: a11y-report.html

      - name: Check for violations
        run: |
          # Fail CI if critical violations found
          npm run a11y:check || exit 1
```

## Best Practices

### 1. Test Early and Often

Run accessibility tests during development, not just before release:

```typescript
// In your development workflow
import { A11yValidator } from '@ainative/ai-kit-a2ui-core/a11y'

const validator = new A11yValidator()

function createComponent(config) {
  const component = { ...config }

  // Validate immediately
  const result = validator.validateComponent(component)

  if (!result.valid) {
    console.warn('Accessibility issues detected:', result.violations)
  }

  return component
}
```

### 2. Fix Critical Issues First

Prioritize violations by severity:

```typescript
const criticalViolations = result.violations.filter(v => v.severity === 'critical')
const seriousViolations = result.violations.filter(v => v.severity === 'serious')

// Fix critical first
criticalViolations.forEach(v => {
  console.error(`CRITICAL: ${v.description}`)
  console.error(`Fix: ${v.fix}`)
})
```

### 3. Use Helper Utilities

Leverage A11yHelper to automatically fix common issues:

```typescript
import { A11yHelper } from '@ainative/ai-kit-a2ui-core/a11y'

const helper = new A11yHelper()

// Automatically add missing labels
components = components.map(c => helper.addAriaLabels(c))

// Automatically add keyboard support
components = components.map(c => helper.addKeyboardNavigation(c))

// Fix heading hierarchy
components = helper.fixHeadingHierarchy(components)
```

### 4. Maintain Baselines

Track accessibility over time with regression tests:

```typescript
// Save baseline on release
const baseline = messages.map(m => validator.validateMessage(m))
fs.writeFileSync('a11y-baseline.json', JSON.stringify(baseline))

// Check for regressions
const baseline = JSON.parse(fs.readFileSync('a11y-baseline.json'))
const regression = await runner.runRegressionTests(baseline, currentMessages)

if (regression.regressionDetected) {
  console.error('Accessibility regression detected!')
  process.exit(1)
}
```

### 5. Document Exceptions

If you must ignore a rule, document why:

```typescript
const validator = new A11yValidator({
  ignoreRules: ['color-contrast'], // Using custom high-contrast theme
  context: {
    // Document your accessibility strategy
    backgroundColor: '#1a1a1a', // Dark theme
    foregroundColor: '#ffffff'
  }
})
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [A11y Project](https://www.a11yproject.com/)

## Support

For issues or questions about accessibility testing:

1. Check the [GitHub Issues](https://github.com/AINative-Studio/ai-kit-a2ui-core/issues)
2. Review the test files in `tests/a11y/` for examples
3. Consult WCAG 2.1 documentation for specific criteria

## Summary

The A2UI Core accessibility testing suite provides:

- **8 WCAG 2.1 rules** covering critical accessibility criteria
- **93.33% test coverage** ensuring reliability
- **Automated testing** with comprehensive reporting
- **Helper utilities** to fix common issues
- **CI/CD integration** for continuous validation

By integrating these tools into your development workflow, you can ensure all A2UI components meet WCAG 2.1 AA accessibility standards.
