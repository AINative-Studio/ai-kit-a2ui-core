/**
 * File Upload Validation Utilities for A2UI v0.9
 * Provides comprehensive validation for file uploads
 */

import type { FileUploadProperties } from '../types/file-upload-components.js'

/**
 * File metadata for validation
 */
export interface ValidatableFile {
  name: string
  size: number
  type: string
  lastModified?: number
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  error?: string
  errorCode?: ValidationErrorCode
  details?: Record<string, unknown>
}

/**
 * Validation error codes
 */
export type ValidationErrorCode =
  | 'FILE_TYPE'
  | 'FILE_SIZE'
  | 'FILE_COUNT'
  | 'FILE_NAME'
  | 'MIME_TYPE'
  | 'EXTENSION'
  | 'EMPTY_FILE'

/**
 * Validates a single file against component properties
 */
export function validateFile(
  file: ValidatableFile,
  properties: FileUploadProperties
): ValidationResult {
  // Check for empty file
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
      errorCode: 'EMPTY_FILE',
    }
  }

  // Validate file size
  if (properties.maxFileSize && file.size > properties.maxFileSize) {
    return {
      valid: false,
      error: `File size ${formatFileSize(file.size)} exceeds maximum allowed size ${formatFileSize(properties.maxFileSize)}`,
      errorCode: 'FILE_SIZE',
      details: {
        fileSize: file.size,
        maxFileSize: properties.maxFileSize,
      },
    }
  }

  // Validate file type if accept list is provided
  if (properties.accept && properties.accept.length > 0) {
    const typeValidation = validateFileType(file, properties.accept)
    if (!typeValidation.valid) {
      return typeValidation
    }
  }

  // Validate file name
  const nameValidation = validateFileName(file.name)
  if (!nameValidation.valid) {
    return nameValidation
  }

  return { valid: true }
}

/**
 * Validates multiple files against component properties
 */
export function validateFiles(
  files: ValidatableFile[],
  properties: FileUploadProperties
): ValidationResult {
  // Check if multiple files are allowed
  if (!properties.multiple && files.length > 1) {
    return {
      valid: false,
      error: 'Multiple file selection is not allowed',
      errorCode: 'FILE_COUNT',
      details: {
        fileCount: files.length,
        maxFiles: 1,
      },
    }
  }

  // Validate file count
  if (properties.maxFiles && files.length > properties.maxFiles) {
    return {
      valid: false,
      error: `Number of files (${files.length}) exceeds maximum allowed (${properties.maxFiles})`,
      errorCode: 'FILE_COUNT',
      details: {
        fileCount: files.length,
        maxFiles: properties.maxFiles,
      },
    }
  }

  // Validate each file individually
  for (const file of files) {
    const result = validateFile(file, properties)
    if (!result.valid) {
      return {
        ...result,
        details: {
          ...result.details,
          fileName: file.name,
        },
      }
    }
  }

  return { valid: true }
}

/**
 * Validates file type against accept list
 */
export function validateFileType(
  file: ValidatableFile,
  accept: string[]
): ValidationResult {
  const isAccepted = accept.some((acceptedType) => {
    // Handle MIME type patterns (e.g., 'image/*', 'video/*')
    if (acceptedType.includes('*')) {
      const pattern = acceptedType.replace('*', '.*')
      const regex = new RegExp(`^${pattern}$`, 'i')
      return regex.test(file.type)
    }

    // Handle exact MIME types (e.g., 'image/png')
    if (acceptedType.includes('/')) {
      return file.type.toLowerCase() === acceptedType.toLowerCase()
    }

    // Handle file extensions (e.g., '.pdf', '.docx')
    if (acceptedType.startsWith('.')) {
      return file.name.toLowerCase().endsWith(acceptedType.toLowerCase())
    }

    // Handle extensions without dot (e.g., 'pdf', 'docx')
    return file.name.toLowerCase().endsWith(`.${acceptedType.toLowerCase()}`)
  })

  if (!isAccepted) {
    return {
      valid: false,
      error: `File type '${file.type}' or extension is not accepted. Allowed: ${accept.join(', ')}`,
      errorCode: 'FILE_TYPE',
      details: {
        fileType: file.type,
        fileName: file.name,
        acceptedTypes: accept,
      },
    }
  }

  return { valid: true }
}

/**
 * Validates file name for security and compatibility
 */
export function validateFileName(fileName: string): ValidationResult {
  // Check for empty name
  if (!fileName || fileName.trim().length === 0) {
    return {
      valid: false,
      error: 'File name is empty',
      errorCode: 'FILE_NAME',
    }
  }

  // Check for path separators (security risk)
  if (fileName.includes('/') || fileName.includes('\\')) {
    return {
      valid: false,
      error: 'File name cannot contain path separators (/ or \\)',
      errorCode: 'FILE_NAME',
      details: { fileName },
    }
  }

  // Check for dangerous characters
  const dangerousChars = /[<>:"|?*\x00-\x1F]/
  if (dangerousChars.test(fileName)) {
    return {
      valid: false,
      error: 'File name contains invalid characters',
      errorCode: 'FILE_NAME',
      details: { fileName },
    }
  }

  // Check length
  if (fileName.length > 255) {
    return {
      valid: false,
      error: 'File name is too long (maximum 255 characters)',
      errorCode: 'FILE_NAME',
      details: {
        fileName,
        length: fileName.length,
        maxLength: 255,
      },
    }
  }

  // Check for reserved names (Windows)
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
  const nameWithoutExt = fileName.split('.')[0].toUpperCase()
  if (reservedNames.includes(nameWithoutExt)) {
    return {
      valid: false,
      error: 'File name uses a reserved system name',
      errorCode: 'FILE_NAME',
      details: { fileName },
    }
  }

  return { valid: true }
}

/**
 * Sanitizes file name by removing or replacing invalid characters
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path separators
  let sanitized = fileName.replace(/[/\\]/g, '')

  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1F]/g, '')

  // Trim whitespace
  sanitized = sanitized.trim()

  // Replace multiple spaces with single space
  sanitized = sanitized.replace(/\s+/g, ' ')

  // Ensure not empty
  if (sanitized.length === 0) {
    sanitized = 'unnamed_file'
  }

  // Handle reserved names by adding prefix
  const nameWithoutExt = sanitized.split('.')[0].toUpperCase()
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
  if (reservedNames.includes(nameWithoutExt)) {
    sanitized = `file_${sanitized}`
  }

  // Limit length while preserving extension
  if (sanitized.length > 255) {
    const lastDotIndex = sanitized.lastIndexOf('.')
    if (lastDotIndex > 0) {
      const ext = sanitized.substring(lastDotIndex)
      const name = sanitized.substring(0, 255 - ext.length)
      sanitized = name + ext
    } else {
      sanitized = sanitized.substring(0, 255)
    }
  }

  return sanitized
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  // Prevent array out of bounds
  const sizeIndex = Math.min(i, sizes.length - 1)

  const value = bytes / Math.pow(k, sizeIndex)
  const rounded = Math.round(value * 100) / 100

  return `${rounded} ${sizes[sizeIndex]}`
}

/**
 * Parses file size string to bytes (e.g., "10MB" -> 10485760)
 */
export function parseFileSize(sizeString: string): number {
  const units: Record<string, number> = {
    'B': 1,
    'BYTES': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024,
    'PB': 1024 * 1024 * 1024 * 1024 * 1024,
  }

  const match = sizeString.trim().match(/^(\d+(?:\.\d+)?)\s*([A-Za-z]+)$/)
  if (!match) {
    throw new Error(`Invalid file size format: ${sizeString}`)
  }

  const value = parseFloat(match[1])
  const unit = match[2].toUpperCase()

  if (!units[unit]) {
    throw new Error(`Unknown file size unit: ${unit}`)
  }

  return Math.floor(value * units[unit])
}

/**
 * Gets file extension from file name
 */
export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.')
  if (lastDotIndex < 0 || lastDotIndex === fileName.length - 1) {
    return ''
  }
  return fileName.substring(lastDotIndex + 1).toLowerCase()
}

/**
 * Gets MIME type category (e.g., 'image', 'video', 'document')
 */
export function getMimeTypeCategory(mimeType: string): string {
  const parts = mimeType.split('/')
  return parts[0] || 'unknown'
}

/**
 * Checks if file is an image based on MIME type
 */
export function isImageFile(file: ValidatableFile): boolean {
  return file.type.startsWith('image/')
}

/**
 * Checks if file is a video based on MIME type
 */
export function isVideoFile(file: ValidatableFile): boolean {
  return file.type.startsWith('video/')
}

/**
 * Checks if file is a document based on MIME type
 */
export function isDocumentFile(file: ValidatableFile): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ]
  return documentTypes.includes(file.type)
}

/**
 * Default validation properties
 */
export const DEFAULT_VALIDATION_PROPERTIES: FileUploadProperties = {
  multiple: false,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  dragAndDrop: true,
  showProgress: true,
  showPreview: true,
  disabled: false,
}
