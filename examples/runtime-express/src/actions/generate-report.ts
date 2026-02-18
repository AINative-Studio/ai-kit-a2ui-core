import { z } from 'zod'
import { pdfGenerator } from '../lib/pdf-generator'

import type { Action } from '@ainative/a2ui-runtime'
import { ActionExecutionError } from '@ainative/a2ui-runtime'

function defineAction<T extends z.ZodType>(config: {
  name: string
  description: string
  parameters: T
  handler: (params: z.infer<T>, context?: unknown) => Promise<unknown>
}): Action {
  return config as Action
}

/**
 * Generate report action using PDF generation service
 */
export const generateReportAction = defineAction({
  name: 'generateReport',
  description: 'Generate a PDF report from a template using Puppeteer',

  parameters: z.object({
    template: z.string().min(1).describe('Report template name'),
    data: z.record(z.unknown()).describe('Data to inject into the template'),
    filename: z.string().optional().describe('Optional custom filename'),
    format: z.enum(['pdf', 'html']).optional().default('pdf').describe('Output format'),
  }),

  handler: async (params: { template: string; data: Record<string, unknown>; filename?: string; format?: 'pdf' | 'html' }) => {
    try {
      const result = await pdfGenerator.generate(params)

      return {
        success: true,
        url: result.url,
        size: result.size,
      }
    } catch (error) {
      throw new ActionExecutionError(
        `Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'generateReport'
      )
    }
  },
})
