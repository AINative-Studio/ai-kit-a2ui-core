import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateReportAction } from '../../src/actions/generate-report'
import { ActionExecutionError } from '@ainative/a2ui-runtime'

vi.mock('../../src/lib/pdf-generator', () => ({
  pdfGenerator: {
    generate: vi.fn(),
  },
}))

import { pdfGenerator as mockPDFGenerator } from '../../src/lib/pdf-generator'

describe('generateReportAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Action Definition', () => {
    it('should have correct name', () => {
      expect(generateReportAction.name).toBe('generateReport')
    })

    it('should have description', () => {
      expect(generateReportAction.description).toBeTruthy()
    })
  })

  describe('Parameter Validation', () => {
    it('should require template parameter', () => {
      const result = generateReportAction.parameters.safeParse({ data: {} })
      expect(result.success).toBe(false)
    })

    it('should require data parameter', () => {
      const result = generateReportAction.parameters.safeParse({ template: 'sales' })
      expect(result.success).toBe(false)
    })

    it('should accept valid parameters', () => {
      const result = generateReportAction.parameters.safeParse({
        template: 'sales',
        data: { month: 'January' },
      })
      expect(result.success).toBe(true)
    })

    it('should accept optional filename', () => {
      const result = generateReportAction.parameters.safeParse({
        template: 'sales',
        data: {},
        filename: 'report.pdf',
      })
      expect(result.success).toBe(true)
    })

    it('should accept optional format', () => {
      const result = generateReportAction.parameters.safeParse({
        template: 'sales',
        data: {},
        format: 'html',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Report Generation', () => {
    it('should generate PDF report', async () => {
      mockPDFGenerator.generate.mockResolvedValue({
        url: 'https://example.com/report.pdf',
        size: 12345,
      })

      const result = await generateReportAction.handler({
        template: 'sales',
        data: { month: 'January', revenue: 50000 },
      })

      expect(result.success).toBe(true)
      expect(result.url).toBe('https://example.com/report.pdf')
    })

    it('should pass template to generator', async () => {
      mockPDFGenerator.generate.mockResolvedValue({ url: 'test.pdf', size: 100 })

      await generateReportAction.handler({
        template: 'analytics',
        data: {},
      })

      expect(mockPDFGenerator.generate).toHaveBeenCalledWith(
        expect.objectContaining({ template: 'analytics' })
      )
    })

    it('should pass data to generator', async () => {
      mockPDFGenerator.generate.mockResolvedValue({ url: 'test.pdf', size: 100 })
      const data = { users: 100, revenue: 50000 }

      await generateReportAction.handler({
        template: 'sales',
        data,
      })

      expect(mockPDFGenerator.generate).toHaveBeenCalledWith(
        expect.objectContaining({ data })
      )
    })

    it('should return file size in response', async () => {
      mockPDFGenerator.generate.mockResolvedValue({
        url: 'https://example.com/report.pdf',
        size: 54321,
      })

      const result = await generateReportAction.handler({
        template: 'sales',
        data: {},
      })

      expect(result.size).toBe(54321)
    })
  })

  describe('Error Handling', () => {
    it('should throw ActionExecutionError on generation failure', async () => {
      mockPDFGenerator.generate.mockRejectedValue(new Error('Puppeteer timeout'))

      await expect(
        generateReportAction.handler({
          template: 'sales',
          data: {},
        })
      ).rejects.toThrow(ActionExecutionError)
    })

    it('should include error message', async () => {
      mockPDFGenerator.generate.mockRejectedValue(new Error('Template not found'))

      await expect(
        generateReportAction.handler({
          template: 'invalid',
          data: {},
        })
      ).rejects.toThrow(/Template not found/)
    })
  })
})
