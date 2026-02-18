import { describe, it, expect } from 'vitest'
import { pdfGenerator } from '../../src/lib/pdf-generator'

describe('PDFGenerator', () => {
  describe('generate', () => {
    it('should generate PDF successfully', async () => {
      const result = await pdfGenerator.generate({
        template: 'sales',
        data: { revenue: 50000 },
      })

      expect(result).toHaveProperty('url')
      expect(result).toHaveProperty('size')
      expect(typeof result.url).toBe('string')
      expect(typeof result.size).toBe('number')
    })

    it('should return valid URL', async () => {
      const result = await pdfGenerator.generate({
        template: 'analytics',
        data: {},
      })

      expect(result.url).toMatch(/^https?:\/\//)
      expect(result.url).toContain('.pdf')
    })

    it('should return file size', async () => {
      const result = await pdfGenerator.generate({
        template: 'report',
        data: {},
      })

      expect(result.size).toBeGreaterThan(0)
    })

    it('should accept custom filename', async () => {
      const result = await pdfGenerator.generate({
        template: 'sales',
        data: {},
        filename: 'custom-report.pdf',
      })

      expect(result.url).toContain('custom-report.pdf')
    })

    it('should support HTML format', async () => {
      const result = await pdfGenerator.generate({
        template: 'report',
        data: {},
        format: 'html',
      })

      expect(result).toHaveProperty('url')
    })

    it('should support PDF format', async () => {
      const result = await pdfGenerator.generate({
        template: 'report',
        data: {},
        format: 'pdf',
      })

      expect(result).toHaveProperty('url')
    })
  })
})
