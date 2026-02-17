/**
 * File Upload Component Type Definitions for A2UI v0.9
 * Provides file upload capabilities with ZeroDB integration
 */

/**
 * File metadata structure
 */
export interface FileMetadata {
  /** File name */
  name: string
  /** File size in bytes */
  size: number
  /** MIME type */
  type: string
  /** Last modified timestamp */
  lastModified: number
  /** Optional custom metadata */
  [key: string]: unknown
}

/**
 * Upload state for tracking file uploads
 */
export type UploadState = 'pending' | 'uploading' | 'completed' | 'error'

/**
 * File upload component properties
 */
export interface FileUploadProperties {
  /** Accepted file types (MIME types or extensions) */
  accept?: string[]
  /** Allow multiple file selection */
  multiple?: boolean
  /** Maximum file size in bytes (default: 10MB) */
  maxFileSize?: number
  /** Maximum number of files */
  maxFiles?: number
  /** Enable drag-and-drop upload */
  dragAndDrop?: boolean
  /** Show upload progress indicator */
  showProgress?: boolean
  /** Show file previews for images */
  showPreview?: boolean
  /** Custom upload endpoint (default: uses ZeroDB) */
  uploadEndpoint?: string
  /** Additional metadata to attach to uploaded files */
  metadata?: Record<string, unknown>
  /** Label text for the upload button */
  label?: string
  /** Helper text displayed below the upload area */
  helperText?: string
  /** Disabled state */
  disabled?: boolean
  /** Error message */
  error?: string
  /** Event handler for upload start */
  onUploadStart?: string
  /** Event handler for upload progress */
  onUploadProgress?: string
  /** Event handler for upload complete */
  onUploadComplete?: string
  /** Event handler for upload error */
  onUploadError?: string
}

/**
 * File validation result
 */
export interface FileValidationResult {
  /** Whether the file is valid */
  valid: boolean
  /** Error message if invalid */
  error?: string
  /** Error code for programmatic handling */
  errorCode?: 'FILE_TYPE' | 'FILE_SIZE' | 'FILE_COUNT' | 'FILE_NAME'
}

/**
 * File upload component type (extends ComponentProperties)
 */
export interface FileUploadComponent {
  /** Component type */
  type: 'fileUpload'
  /** Unique component identifier */
  id: string
  /** Component properties */
  properties?: FileUploadProperties
  /** Child component IDs */
  children?: string[]
}

/**
 * Validates file against component constraints
 */
export function validateFile(
  file: FileMetadata,
  properties: FileUploadProperties
): FileValidationResult {
  // Validate file size
  if (properties.maxFileSize && file.size > properties.maxFileSize) {
    return {
      valid: false,
      error: `File size ${formatFileSize(file.size)} exceeds maximum allowed size ${formatFileSize(properties.maxFileSize)}`,
      errorCode: 'FILE_SIZE',
    }
  }

  // Validate file type
  if (properties.accept && properties.accept.length > 0) {
    const isAccepted = properties.accept.some((acceptedType) => {
      // Handle MIME type patterns (e.g., 'image/*')
      if (acceptedType.includes('*')) {
        const pattern = acceptedType.replace('*', '.*')
        const regex = new RegExp(`^${pattern}$`)
        return regex.test(file.type)
      }
      // Handle exact MIME types
      if (acceptedType.includes('/')) {
        return file.type === acceptedType
      }
      // Handle file extensions (e.g., '.pdf')
      return file.name.toLowerCase().endsWith(acceptedType.toLowerCase())
    })

    if (!isAccepted) {
      return {
        valid: false,
        error: `File type '${file.type}' is not accepted. Allowed types: ${properties.accept.join(', ')}`,
        errorCode: 'FILE_TYPE',
      }
    }
  }

  // Validate file name (sanitization check)
  if (!isValidFileName(file.name)) {
    return {
      valid: false,
      error: 'File name contains invalid characters',
      errorCode: 'FILE_NAME',
    }
  }

  return { valid: true }
}

/**
 * Validates multiple files against component constraints
 */
export function validateFiles(
  files: FileMetadata[],
  properties: FileUploadProperties
): FileValidationResult {
  // Validate file count
  if (properties.maxFiles && files.length > properties.maxFiles) {
    return {
      valid: false,
      error: `Number of files (${files.length}) exceeds maximum allowed (${properties.maxFiles})`,
      errorCode: 'FILE_COUNT',
    }
  }

  // Validate each file
  for (const file of files) {
    const result = validateFile(file, properties)
    if (!result.valid) {
      return result
    }
  }

  return { valid: true }
}

/**
 * Sanitizes file name by removing special characters
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path separators
  let sanitized = fileName.replace(/[/\\]/g, '')

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1F]/g, '')

  // Trim whitespace
  sanitized = sanitized.trim()

  // Ensure not empty
  if (sanitized.length === 0) {
    sanitized = 'unnamed_file'
  }

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'))
    const name = sanitized.substring(0, 255 - ext.length)
    sanitized = name + ext
  }

  return sanitized
}

/**
 * Checks if file name is valid
 */
export function isValidFileName(fileName: string): boolean {
  // Check for empty name
  if (!fileName || fileName.trim().length === 0) {
    return false
  }

  // Check for path separators
  if (fileName.includes('/') || fileName.includes('\\')) {
    return false
  }

  // Check for dangerous characters
  if (/[<>:"|?*\x00-\x1F]/.test(fileName)) {
    return false
  }

  // Check length
  if (fileName.length > 255) {
    return false
  }

  return true
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Default file upload properties
 */
export const DEFAULT_FILE_UPLOAD_PROPERTIES: Partial<FileUploadProperties> = {
  multiple: false,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  dragAndDrop: true,
  showProgress: true,
  showPreview: true,
  disabled: false,
}
