/**
 * File Upload Component Tests
 * Comprehensive tests for fileUpload component type and validation
 */

import { describe, it, expect } from 'vitest'
import type {
  ComponentType,
  A2UIComponent,
  TypedA2UIComponent,
  FileUploadProperties,
  FileMetadata,
  FileValidationResult,
} from '../../src/types/index.js'
import {
  validateFile,
  validateFiles,
  sanitizeFileName,
  isValidFileName,
  formatFileSize,
  DEFAULT_FILE_UPLOAD_PROPERTIES,
} from '../../src/types/file-upload-components.js'

describe('File Upload Component Types', () => {
  describe('ComponentType Union', () => {
    it('includes fileUpload in ComponentType union', () => {
      const type: ComponentType = 'fileUpload'
      expect(type).toBe('fileUpload')
    })
  })

  describe('FileUpload Component', () => {
    it('creates valid fileUpload component with minimal properties', () => {
      const component: TypedA2UIComponent<'fileUpload'> = {
        id: 'upload-1',
        type: 'fileUpload',
        properties: {},
      }

      expect(component.type).toBe('fileUpload')
      expect(component.id).toBe('upload-1')
    })

    it('creates valid fileUpload component with all properties', () => {
      const component: TypedA2UIComponent<'fileUpload'> = {
        id: 'upload-2',
        type: 'fileUpload',
        properties: {
          accept: ['image/*', '.pdf', '.doc'],
          multiple: true,
          maxFileSize: 5 * 1024 * 1024, // 5MB
          maxFiles: 10,
          dragAndDrop: true,
          showProgress: true,
          showPreview: true,
          uploadEndpoint: '/api/upload',
          metadata: { userId: '123', projectId: '456' },
          label: 'Upload Files',
          helperText: 'Maximum 5MB per file',
          disabled: false,
          error: '',
          onUploadStart: '/handlers/uploadStart',
          onUploadProgress: '/handlers/uploadProgress',
          onUploadComplete: '/handlers/uploadComplete',
          onUploadError: '/handlers/uploadError',
        },
      }

      expect(component.type).toBe('fileUpload')
      expect(component.properties?.accept).toEqual(['image/*', '.pdf', '.doc'])
      expect(component.properties?.multiple).toBe(true)
      expect(component.properties?.maxFileSize).toBe(5 * 1024 * 1024)
      expect(component.properties?.maxFiles).toBe(10)
      expect(component.properties?.dragAndDrop).toBe(true)
      expect(component.properties?.showProgress).toBe(true)
      expect(component.properties?.showPreview).toBe(true)
      expect(component.properties?.uploadEndpoint).toBe('/api/upload')
      expect(component.properties?.metadata).toEqual({ userId: '123', projectId: '456' })
      expect(component.properties?.label).toBe('Upload Files')
      expect(component.properties?.helperText).toBe('Maximum 5MB per file')
      expect(component.properties?.disabled).toBe(false)
    })

    it('supports single file upload mode', () => {
      const component: TypedA2UIComponent<'fileUpload'> = {
        id: 'upload-single',
        type: 'fileUpload',
        properties: {
          multiple: false,
          maxFiles: 1,
        },
      }

      expect(component.properties?.multiple).toBe(false)
      expect(component.properties?.maxFiles).toBe(1)
    })

    it('supports multiple file upload mode', () => {
      const component: TypedA2UIComponent<'fileUpload'> = {
        id: 'upload-multiple',
        type: 'fileUpload',
        properties: {
          multiple: true,
          maxFiles: 5,
        },
      }

      expect(component.properties?.multiple).toBe(true)
      expect(component.properties?.maxFiles).toBe(5)
    })

    it('supports custom upload endpoint', () => {
      const component: TypedA2UIComponent<'fileUpload'> = {
        id: 'upload-custom',
        type: 'fileUpload',
        properties: {
          uploadEndpoint: 'https://api.example.com/files/upload',
        },
      }

      expect(component.properties?.uploadEndpoint).toBe('https://api.example.com/files/upload')
    })

    it('supports metadata attachment', () => {
      const component: TypedA2UIComponent<'fileUpload'> = {
        id: 'upload-metadata',
        type: 'fileUpload',
        properties: {
          metadata: {
            category: 'documents',
            tags: ['invoice', 'important'],
            createdBy: 'user-123',
          },
        },
      }

      expect(component.properties?.metadata).toBeDefined()
      expect(component.properties?.metadata?.category).toBe('documents')
      expect(component.properties?.metadata?.tags).toEqual(['invoice', 'important'])
    })

    it('supports event handlers', () => {
      const component: TypedA2UIComponent<'fileUpload'> = {
        id: 'upload-events',
        type: 'fileUpload',
        properties: {
          onUploadStart: '/events/upload/start',
          onUploadProgress: '/events/upload/progress',
          onUploadComplete: '/events/upload/complete',
          onUploadError: '/events/upload/error',
        },
      }

      expect(component.properties?.onUploadStart).toBe('/events/upload/start')
      expect(component.properties?.onUploadProgress).toBe('/events/upload/progress')
      expect(component.properties?.onUploadComplete).toBe('/events/upload/complete')
      expect(component.properties?.onUploadError).toBe('/events/upload/error')
    })
  })

  describe('File Validation', () => {
    it('validates file size correctly', () => {
      const properties: FileUploadProperties = {
        maxFileSize: 1024 * 1024, // 1MB
      }

      const smallFile: FileMetadata = {
        name: 'small.txt',
        size: 500 * 1024, // 500KB
        type: 'text/plain',
        lastModified: Date.now(),
      }

      const result = validateFile(smallFile, properties)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('rejects file exceeding size limit', () => {
      const properties: FileUploadProperties = {
        maxFileSize: 1024 * 1024, // 1MB
      }

      const largeFile: FileMetadata = {
        name: 'large.pdf',
        size: 2 * 1024 * 1024, // 2MB
        type: 'application/pdf',
        lastModified: Date.now(),
      }

      const result = validateFile(largeFile, properties)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceeds maximum allowed size')
      expect(result.errorCode).toBe('FILE_SIZE')
    })

    it('validates file type by MIME type pattern', () => {
      const properties: FileUploadProperties = {
        accept: ['image/*'],
      }

      const imageFile: FileMetadata = {
        name: 'photo.jpg',
        size: 1024,
        type: 'image/jpeg',
        lastModified: Date.now(),
      }

      const result = validateFile(imageFile, properties)
      expect(result.valid).toBe(true)
    })

    it('rejects invalid MIME type', () => {
      const properties: FileUploadProperties = {
        accept: ['image/*'],
      }

      const pdfFile: FileMetadata = {
        name: 'document.pdf',
        size: 1024,
        type: 'application/pdf',
        lastModified: Date.now(),
      }

      const result = validateFile(pdfFile, properties)
      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('FILE_TYPE')
    })

    it('validates file type by extension', () => {
      const properties: FileUploadProperties = {
        accept: ['.pdf', '.doc', '.docx'],
      }

      const pdfFile: FileMetadata = {
        name: 'document.pdf',
        size: 1024,
        type: 'application/pdf',
        lastModified: Date.now(),
      }

      const result = validateFile(pdfFile, properties)
      expect(result.valid).toBe(true)
    })

    it('rejects invalid file extension', () => {
      const properties: FileUploadProperties = {
        accept: ['.pdf'],
      }

      const textFile: FileMetadata = {
        name: 'file.txt',
        size: 1024,
        type: 'text/plain',
        lastModified: Date.now(),
      }

      const result = validateFile(textFile, properties)
      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('FILE_TYPE')
    })

    it('validates mixed MIME types and extensions', () => {
      const properties: FileUploadProperties = {
        accept: ['image/*', '.pdf', '.doc'],
      }

      const testFiles: FileMetadata[] = [
        { name: 'photo.jpg', size: 1024, type: 'image/jpeg', lastModified: Date.now() },
        { name: 'document.pdf', size: 1024, type: 'application/pdf', lastModified: Date.now() },
        { name: 'report.doc', size: 1024, type: 'application/msword', lastModified: Date.now() },
      ]

      testFiles.forEach(file => {
        const result = validateFile(file, properties)
        expect(result.valid).toBe(true)
      })
    })

    it('validates file name security', () => {
      const properties: FileUploadProperties = {}

      const invalidNames = [
        '../../../etc/passwd',
        'file<script>.js',
        'file:name.txt',
        'file|name.txt',
        'file*name.txt',
      ]

      invalidNames.forEach(name => {
        const file: FileMetadata = {
          name,
          size: 1024,
          type: 'text/plain',
          lastModified: Date.now(),
        }
        const result = validateFile(file, properties)
        expect(result.valid).toBe(false)
        expect(result.errorCode).toBe('FILE_NAME')
      })
    })
  })

  describe('Multiple File Validation', () => {
    it('validates multiple files correctly', () => {
      const properties: FileUploadProperties = {
        multiple: true,
        maxFiles: 3,
        maxFileSize: 1024 * 1024,
      }

      const files: FileMetadata[] = [
        { name: 'file1.txt', size: 500 * 1024, type: 'text/plain', lastModified: Date.now() },
        { name: 'file2.txt', size: 500 * 1024, type: 'text/plain', lastModified: Date.now() },
        { name: 'file3.txt', size: 500 * 1024, type: 'text/plain', lastModified: Date.now() },
      ]

      const result = validateFiles(files, properties)
      expect(result.valid).toBe(true)
    })

    it('rejects exceeding max file count', () => {
      const properties: FileUploadProperties = {
        multiple: true,
        maxFiles: 2,
      }

      const files: FileMetadata[] = [
        { name: 'file1.txt', size: 1024, type: 'text/plain', lastModified: Date.now() },
        { name: 'file2.txt', size: 1024, type: 'text/plain', lastModified: Date.now() },
        { name: 'file3.txt', size: 1024, type: 'text/plain', lastModified: Date.now() },
      ]

      const result = validateFiles(files, properties)
      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('FILE_COUNT')
      expect(result.error).toContain('exceeds maximum allowed')
    })

    it('rejects any invalid file in batch', () => {
      const properties: FileUploadProperties = {
        multiple: true,
        maxFileSize: 1024 * 1024,
      }

      const files: FileMetadata[] = [
        { name: 'small.txt', size: 500 * 1024, type: 'text/plain', lastModified: Date.now() },
        { name: 'large.pdf', size: 2 * 1024 * 1024, type: 'application/pdf', lastModified: Date.now() },
      ]

      const result = validateFiles(files, properties)
      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('FILE_SIZE')
    })
  })

  describe('File Name Utilities', () => {
    it('sanitizes dangerous file names', () => {
      const dangerousNames = [
        { input: '../../../etc/passwd', expected: '......etcpasswd' },
        { input: 'file<script>.js', expected: 'filescript.js' },
        { input: 'file:name.txt', expected: 'filename.txt' },
        { input: 'file|name.txt', expected: 'filename.txt' },
      ]

      dangerousNames.forEach(({ input, expected }) => {
        const sanitized = sanitizeFileName(input)
        expect(sanitized).toBe(expected)
      })
    })

    it('removes leading and trailing spaces', () => {
      expect(sanitizeFileName('  file.txt  ')).toBe('file.txt')
    })

    it('handles file names with spaces', () => {
      const result = sanitizeFileName('file with spaces.txt')
      expect(result).toBe('file with spaces.txt')
    })

    it('validates file names correctly', () => {
      expect(isValidFileName('document.pdf')).toBe(true)
      expect(isValidFileName('my-file_2024.txt')).toBe(true)
      expect(isValidFileName('file with spaces.doc')).toBe(true)

      expect(isValidFileName('')).toBe(false)
      expect(isValidFileName('../file.txt')).toBe(false)
      expect(isValidFileName('file<>.txt')).toBe(false)
      expect(isValidFileName('a'.repeat(300))).toBe(false)
    })

    it('handles empty file names', () => {
      const sanitized = sanitizeFileName('')
      expect(sanitized).toBe('unnamed_file')
    })

    it('truncates long file names while preserving extension', () => {
      const longName = 'a'.repeat(300) + '.pdf'
      const sanitized = sanitizeFileName(longName)

      expect(sanitized.length).toBeLessThanOrEqual(255)
      expect(sanitized.endsWith('.pdf')).toBe(true)
    })
  })

  describe('File Size Formatting', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatFileSize(1536 * 1024)).toBe('1.5 MB')
      expect(formatFileSize(500)).toBe('500 Bytes')
    })

    it('handles large file sizes', () => {
      const terabyte = 1024 * 1024 * 1024 * 1024
      expect(formatFileSize(terabyte)).toBe('1 TB')
      expect(formatFileSize(1.5 * terabyte)).toBe('1.5 TB')
    })
  })

  describe('Default Properties', () => {
    it('provides sensible default properties', () => {
      expect(DEFAULT_FILE_UPLOAD_PROPERTIES.multiple).toBe(false)
      expect(DEFAULT_FILE_UPLOAD_PROPERTIES.maxFileSize).toBe(10 * 1024 * 1024)
      expect(DEFAULT_FILE_UPLOAD_PROPERTIES.maxFiles).toBe(5)
      expect(DEFAULT_FILE_UPLOAD_PROPERTIES.dragAndDrop).toBe(true)
      expect(DEFAULT_FILE_UPLOAD_PROPERTIES.showProgress).toBe(true)
      expect(DEFAULT_FILE_UPLOAD_PROPERTIES.showPreview).toBe(true)
      expect(DEFAULT_FILE_UPLOAD_PROPERTIES.disabled).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('handles case-insensitive file extensions', () => {
      const properties: FileUploadProperties = {
        accept: ['.PDF'],
      }

      const file: FileMetadata = {
        name: 'document.pdf',
        size: 1024,
        type: 'application/pdf',
        lastModified: Date.now(),
      }

      const result = validateFile(file, properties)
      expect(result.valid).toBe(true)
    })

    it('handles wildcard MIME types correctly', () => {
      const properties: FileUploadProperties = {
        accept: ['video/*'],
      }

      const videoFile: FileMetadata = {
        name: 'movie.mp4',
        size: 1024,
        type: 'video/mp4',
        lastModified: Date.now(),
      }

      const result = validateFile(videoFile, properties)
      expect(result.valid).toBe(true)
    })

    it('validates files with no extension', () => {
      const properties: FileUploadProperties = {
        accept: ['text/plain'],
      }

      const file: FileMetadata = {
        name: 'README',
        size: 1024,
        type: 'text/plain',
        lastModified: Date.now(),
      }

      const result = validateFile(file, properties)
      expect(result.valid).toBe(true)
    })

    it('handles files with multiple dots in name', () => {
      const fileName = 'my.file.name.with.dots.txt'
      expect(isValidFileName(fileName)).toBe(true)
      expect(sanitizeFileName(fileName)).toBe(fileName)
    })
  })

  describe('Type Safety', () => {
    it('enforces type safety for fileUpload component properties', () => {
      const component: A2UIComponent = {
        id: 'upload-type-safe',
        type: 'fileUpload',
        properties: {
          accept: ['image/*'],
          multiple: true,
          maxFileSize: 5242880,
        },
      }

      expect(component.type).toBe('fileUpload')
      expect(component.properties).toBeDefined()
    })

    it('allows fileUpload in component arrays', () => {
      const components: A2UIComponent[] = [
        {
          id: 'upload-1',
          type: 'fileUpload',
          properties: { multiple: false },
        },
        {
          id: 'text-1',
          type: 'text',
          properties: { value: 'Upload your files' },
        },
      ]

      expect(components).toHaveLength(2)
      expect(components[0].type).toBe('fileUpload')
    })

    it('supports children for layout composition', () => {
      const component: TypedA2UIComponent<'fileUpload'> = {
        id: 'upload-with-children',
        type: 'fileUpload',
        properties: { multiple: true },
        children: ['preview-1', 'progress-1'],
      }

      expect(component.children).toEqual(['preview-1', 'progress-1'])
    })
  })
})
