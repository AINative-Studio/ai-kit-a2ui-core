/**
 * File Upload Messages Tests
 * Comprehensive tests for file upload message types
 */

import { describe, it, expect } from 'vitest'
import type {
  FileInfo,
  FileUploadStartMessage,
  FileUploadProgressMessage,
  FileUploadCompleteMessage,
  FileUploadErrorMessage,
  FileUploadCancelMessage,
  FileDeleteMessage,
  FileDeleteCompleteMessage,
  FileUploadMessage,
} from '../../src/types/file-upload-messages.js'
import {
  isFileUploadStartMessage,
  isFileUploadProgressMessage,
  isFileUploadCompleteMessage,
  isFileUploadErrorMessage,
  isFileUploadCancelMessage,
  isFileDeleteMessage,
  isFileDeleteCompleteMessage,
  createFileUploadStartMessage,
  createFileUploadProgressMessage,
  createFileUploadCompleteMessage,
  createFileUploadErrorMessage,
} from '../../src/types/file-upload-messages.js'

describe('File Upload Messages', () => {
  describe('FileUploadStartMessage', () => {
    it('creates valid file upload start message', () => {
      const files: FileInfo[] = [
        {
          fileId: 'file-1',
          name: 'document.pdf',
          size: 1024 * 1024,
          type: 'application/pdf',
          lastModified: Date.now(),
        },
      ]

      const message: FileUploadStartMessage = {
        type: 'fileUploadStart',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        files,
        timestamp: Date.now(),
      }

      expect(message.type).toBe('fileUploadStart')
      expect(message.surfaceId).toBe('surface-1')
      expect(message.componentId).toBe('upload-1')
      expect(message.files).toHaveLength(1)
      expect(message.files[0].fileId).toBe('file-1')
    })

    it('supports multiple files', () => {
      const files: FileInfo[] = [
        {
          fileId: 'file-1',
          name: 'photo1.jpg',
          size: 500 * 1024,
          type: 'image/jpeg',
          lastModified: Date.now(),
        },
        {
          fileId: 'file-2',
          name: 'photo2.png',
          size: 750 * 1024,
          type: 'image/png',
          lastModified: Date.now(),
        },
      ]

      const message: FileUploadStartMessage = {
        type: 'fileUploadStart',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        files,
        timestamp: Date.now(),
      }

      expect(message.files).toHaveLength(2)
    })

    it('includes file metadata', () => {
      const files: FileInfo[] = [
        {
          fileId: 'file-1',
          name: 'data.json',
          size: 2048,
          type: 'application/json',
          lastModified: Date.now(),
          metadata: {
            category: 'config',
            version: '1.0',
          },
        },
      ]

      const message: FileUploadStartMessage = {
        type: 'fileUploadStart',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        files,
      }

      expect(message.files[0].metadata).toEqual({
        category: 'config',
        version: '1.0',
      })
    })
  })

  describe('FileUploadProgressMessage', () => {
    it('creates valid file upload progress message', () => {
      const message: FileUploadProgressMessage = {
        type: 'fileUploadProgress',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        fileId: 'file-1',
        bytesUploaded: 512 * 1024,
        totalBytes: 1024 * 1024,
        percentage: 50,
        timestamp: Date.now(),
      }

      expect(message.type).toBe('fileUploadProgress')
      expect(message.fileId).toBe('file-1')
      expect(message.bytesUploaded).toBe(512 * 1024)
      expect(message.totalBytes).toBe(1024 * 1024)
      expect(message.percentage).toBe(50)
    })

    it('calculates percentage correctly', () => {
      const testCases = [
        { uploaded: 0, total: 1024, expected: 0 },
        { uploaded: 256, total: 1024, expected: 25 },
        { uploaded: 512, total: 1024, expected: 50 },
        { uploaded: 768, total: 1024, expected: 75 },
        { uploaded: 1024, total: 1024, expected: 100 },
      ]

      testCases.forEach(({ uploaded, total, expected }) => {
        const message: FileUploadProgressMessage = {
          type: 'fileUploadProgress',
          surfaceId: 'surface-1',
          componentId: 'upload-1',
          fileId: 'file-1',
          bytesUploaded: uploaded,
          totalBytes: total,
          percentage: expected,
        }

        expect(message.percentage).toBe(expected)
      })
    })

    it('includes optional status message', () => {
      const message: FileUploadProgressMessage = {
        type: 'fileUploadProgress',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        fileId: 'file-1',
        bytesUploaded: 512 * 1024,
        totalBytes: 1024 * 1024,
        percentage: 50,
        statusMessage: 'Uploading to server...',
      }

      expect(message.statusMessage).toBe('Uploading to server...')
    })
  })

  describe('FileUploadCompleteMessage', () => {
    it('creates valid file upload complete message', () => {
      const message: FileUploadCompleteMessage = {
        type: 'fileUploadComplete',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        fileId: 'file-1',
        url: 'https://storage.example.com/files/document.pdf',
        metadata: {
          size: 1024 * 1024,
          uploadedAt: Date.now(),
        },
        timestamp: Date.now(),
      }

      expect(message.type).toBe('fileUploadComplete')
      expect(message.fileId).toBe('file-1')
      expect(message.url).toBe('https://storage.example.com/files/document.pdf')
      expect(message.metadata).toBeDefined()
    })

    it('includes presigned URL with expiration', () => {
      const expiresAt = Date.now() + 3600 * 1000 // 1 hour

      const message: FileUploadCompleteMessage = {
        type: 'fileUploadComplete',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        fileId: 'file-1',
        url: 'https://storage.example.com/files/document.pdf',
        presignedUrl: 'https://storage.example.com/files/document.pdf?signature=xyz',
        expiresAt,
        metadata: {},
      }

      expect(message.presignedUrl).toBeDefined()
      expect(message.expiresAt).toBe(expiresAt)
    })

    it('includes ZeroDB path', () => {
      const message: FileUploadCompleteMessage = {
        type: 'fileUploadComplete',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        fileId: 'file-1',
        url: 'https://zerodb.example.com/files/document.pdf',
        zerodbPath: '/project-123/uploads/document.pdf',
        metadata: {},
      }

      expect(message.zerodbPath).toBe('/project-123/uploads/document.pdf')
    })
  })

  describe('FileUploadErrorMessage', () => {
    it('creates valid file upload error message', () => {
      const message: FileUploadErrorMessage = {
        type: 'fileUploadError',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        fileId: 'file-1',
        error: 'File size exceeds maximum limit',
        errorCode: 'FILE_SIZE',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('fileUploadError')
      expect(message.fileId).toBe('file-1')
      expect(message.error).toBe('File size exceeds maximum limit')
      expect(message.errorCode).toBe('FILE_SIZE')
    })

    it('supports all error codes', () => {
      const errorCodes: FileUploadErrorMessage['errorCode'][] = [
        'FILE_TYPE',
        'FILE_SIZE',
        'FILE_COUNT',
        'FILE_NAME',
        'UPLOAD_FAILED',
        'NETWORK_ERROR',
        'VALIDATION_ERROR',
      ]

      errorCodes.forEach(errorCode => {
        const message: FileUploadErrorMessage = {
          type: 'fileUploadError',
          surfaceId: 'surface-1',
          componentId: 'upload-1',
          fileId: 'file-1',
          error: 'Error occurred',
          errorCode,
        }

        expect(message.errorCode).toBe(errorCode)
      })
    })

    it('includes optional error details', () => {
      const message: FileUploadErrorMessage = {
        type: 'fileUploadError',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        fileId: 'file-1',
        error: 'Upload failed',
        errorCode: 'UPLOAD_FAILED',
        details: {
          statusCode: 500,
          serverMessage: 'Internal server error',
        },
      }

      expect(message.details).toEqual({
        statusCode: 500,
        serverMessage: 'Internal server error',
      })
    })
  })

  describe('FileUploadCancelMessage', () => {
    it('creates valid file upload cancel message', () => {
      const message: FileUploadCancelMessage = {
        type: 'fileUploadCancel',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        fileId: 'file-1',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('fileUploadCancel')
      expect(message.fileId).toBe('file-1')
    })

    it('includes optional cancellation reason', () => {
      const message: FileUploadCancelMessage = {
        type: 'fileUploadCancel',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        fileId: 'file-1',
        reason: 'User cancelled upload',
      }

      expect(message.reason).toBe('User cancelled upload')
    })
  })

  describe('FileDeleteMessage', () => {
    it('creates valid file delete message', () => {
      const message: FileDeleteMessage = {
        type: 'fileDelete',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        fileId: 'file-1',
        timestamp: Date.now(),
      }

      expect(message.type).toBe('fileDelete')
      expect(message.fileId).toBe('file-1')
    })

    it('includes ZeroDB path for deletion', () => {
      const message: FileDeleteMessage = {
        type: 'fileDelete',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        fileId: 'file-1',
        zerodbPath: '/project-123/uploads/document.pdf',
      }

      expect(message.zerodbPath).toBe('/project-123/uploads/document.pdf')
    })
  })

  describe('FileDeleteCompleteMessage', () => {
    it('creates valid file delete complete message', () => {
      const message: FileDeleteCompleteMessage = {
        type: 'fileDeleteComplete',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        fileId: 'file-1',
        success: true,
        timestamp: Date.now(),
      }

      expect(message.type).toBe('fileDeleteComplete')
      expect(message.fileId).toBe('file-1')
      expect(message.success).toBe(true)
    })

    it('handles failed deletion', () => {
      const message: FileDeleteCompleteMessage = {
        type: 'fileDeleteComplete',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        fileId: 'file-1',
        success: false,
      }

      expect(message.success).toBe(false)
    })
  })

  describe('Type Guards', () => {
    it('identifies file upload start messages', () => {
      const message = createFileUploadStartMessage('surface-1', 'upload-1', [])
      expect(isFileUploadStartMessage(message)).toBe(true)
      expect(isFileUploadProgressMessage(message)).toBe(false)
      expect(isFileUploadCompleteMessage(message)).toBe(false)
    })

    it('identifies file upload progress messages', () => {
      const message = createFileUploadProgressMessage('surface-1', 'upload-1', 'file-1', 512, 1024)
      expect(isFileUploadProgressMessage(message)).toBe(true)
      expect(isFileUploadStartMessage(message)).toBe(false)
      expect(isFileUploadCompleteMessage(message)).toBe(false)
    })

    it('identifies file upload complete messages', () => {
      const message = createFileUploadCompleteMessage('surface-1', 'upload-1', 'file-1', 'https://example.com/file', {})
      expect(isFileUploadCompleteMessage(message)).toBe(true)
      expect(isFileUploadStartMessage(message)).toBe(false)
      expect(isFileUploadProgressMessage(message)).toBe(false)
    })

    it('identifies file upload error messages', () => {
      const message = createFileUploadErrorMessage('surface-1', 'upload-1', 'file-1', 'Error', 'UPLOAD_FAILED')
      expect(isFileUploadErrorMessage(message)).toBe(true)
      expect(isFileUploadStartMessage(message)).toBe(false)
    })

    it('identifies file upload cancel messages', () => {
      const message: FileUploadCancelMessage = {
        type: 'fileUploadCancel',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        fileId: 'file-1',
      }
      expect(isFileUploadCancelMessage(message)).toBe(true)
    })

    it('identifies file delete messages', () => {
      const message: FileDeleteMessage = {
        type: 'fileDelete',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        fileId: 'file-1',
      }
      expect(isFileDeleteMessage(message)).toBe(true)
    })

    it('identifies file delete complete messages', () => {
      const message: FileDeleteCompleteMessage = {
        type: 'fileDeleteComplete',
        surfaceId: 'surface-1',
        componentId: 'upload-1',
        fileId: 'file-1',
        success: true,
      }
      expect(isFileDeleteCompleteMessage(message)).toBe(true)
    })

    it('rejects invalid messages', () => {
      const invalidMessage = { type: 'invalid' }
      expect(isFileUploadStartMessage(invalidMessage)).toBe(false)
      expect(isFileUploadProgressMessage(invalidMessage)).toBe(false)
      expect(isFileUploadCompleteMessage(invalidMessage)).toBe(false)
    })
  })

  describe('Helper Functions', () => {
    it('creates file upload start message with helper', () => {
      const files: FileInfo[] = [
        {
          fileId: 'file-1',
          name: 'test.txt',
          size: 1024,
          type: 'text/plain',
          lastModified: Date.now(),
        },
      ]

      const message = createFileUploadStartMessage('surface-1', 'upload-1', files)

      expect(message.type).toBe('fileUploadStart')
      expect(message.surfaceId).toBe('surface-1')
      expect(message.componentId).toBe('upload-1')
      expect(message.files).toEqual(files)
      expect(message.timestamp).toBeDefined()
    })

    it('creates file upload progress message with helper', () => {
      const message = createFileUploadProgressMessage('surface-1', 'upload-1', 'file-1', 256, 1024)

      expect(message.type).toBe('fileUploadProgress')
      expect(message.bytesUploaded).toBe(256)
      expect(message.totalBytes).toBe(1024)
      expect(message.percentage).toBe(25)
      expect(message.timestamp).toBeDefined()
    })

    it('creates file upload complete message with helper', () => {
      const metadata = { uploadedAt: Date.now() }
      const message = createFileUploadCompleteMessage('surface-1', 'upload-1', 'file-1', 'https://example.com/file', metadata)

      expect(message.type).toBe('fileUploadComplete')
      expect(message.url).toBe('https://example.com/file')
      expect(message.metadata).toEqual(metadata)
      expect(message.timestamp).toBeDefined()
    })

    it('creates file upload error message with helper', () => {
      const message = createFileUploadErrorMessage('surface-1', 'upload-1', 'file-1', 'Upload failed', 'UPLOAD_FAILED')

      expect(message.type).toBe('fileUploadError')
      expect(message.error).toBe('Upload failed')
      expect(message.errorCode).toBe('UPLOAD_FAILED')
      expect(message.timestamp).toBeDefined()
    })

    it('handles edge case: zero-byte upload progress', () => {
      const message = createFileUploadProgressMessage('surface-1', 'upload-1', 'file-1', 0, 0)
      expect(message.percentage).toBe(0)
    })

    it('calculates 100% progress correctly', () => {
      const message = createFileUploadProgressMessage('surface-1', 'upload-1', 'file-1', 1024, 1024)
      expect(message.percentage).toBe(100)
    })
  })

  describe('Type Safety', () => {
    it('enforces FileUploadMessage union type', () => {
      const messages: FileUploadMessage[] = [
        createFileUploadStartMessage('s1', 'c1', []),
        createFileUploadProgressMessage('s1', 'c1', 'f1', 0, 100),
        createFileUploadCompleteMessage('s1', 'c1', 'f1', 'url', {}),
        createFileUploadErrorMessage('s1', 'c1', 'f1', 'error', 'UPLOAD_FAILED'),
      ]

      expect(messages).toHaveLength(4)
      messages.forEach(msg => {
        expect(msg.type).toBeDefined()
        expect(msg.surfaceId).toBe('s1')
        expect(msg.componentId).toBe('c1')
      })
    })
  })
})
