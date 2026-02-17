/**
 * File Upload Message Types for A2UI v0.9
 * Messages for file upload operations with ZeroDB integration
 */

import type { BaseMessage } from './protocol.js'

/**
 * File information structure for upload messages
 */
export interface FileInfo {
  /** Unique file identifier */
  fileId: string
  /** File name */
  name: string
  /** File size in bytes */
  size: number
  /** MIME type */
  type: string
  /** Last modified timestamp */
  lastModified: number
  /** Optional custom metadata */
  metadata?: Record<string, unknown>
}

/**
 * File Upload Start Message (UI → Agent)
 * Sent when user initiates file upload
 */
export interface FileUploadStartMessage extends BaseMessage {
  type: 'fileUploadStart'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** Files to be uploaded */
  files: FileInfo[]
}

/**
 * File Upload Progress Message (Agent → UI or UI → Agent)
 * Sent to update upload progress
 */
export interface FileUploadProgressMessage extends BaseMessage {
  type: 'fileUploadProgress'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** File identifier */
  fileId: string
  /** Bytes uploaded so far */
  bytesUploaded: number
  /** Total bytes to upload */
  totalBytes: number
  /** Upload percentage (0-100) */
  percentage: number
  /** Optional status message */
  statusMessage?: string
}

/**
 * File Upload Complete Message (Agent → UI)
 * Sent when file upload successfully completes
 */
export interface FileUploadCompleteMessage extends BaseMessage {
  type: 'fileUploadComplete'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** File identifier */
  fileId: string
  /** URL to access the uploaded file */
  url: string
  /** Presigned URL with expiration (for secure access) */
  presignedUrl?: string
  /** URL expiration timestamp (if presigned) */
  expiresAt?: number
  /** File metadata */
  metadata: Record<string, unknown>
  /** ZeroDB file path */
  zerodbPath?: string
}

/**
 * File Upload Error Message (Agent → UI or UI → Agent)
 * Sent when file upload fails
 */
export interface FileUploadErrorMessage extends BaseMessage {
  type: 'fileUploadError'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** File identifier */
  fileId: string
  /** Error message */
  error: string
  /** Error code for programmatic handling */
  errorCode: 'FILE_TYPE' | 'FILE_SIZE' | 'FILE_COUNT' | 'FILE_NAME' | 'UPLOAD_FAILED' | 'NETWORK_ERROR' | 'VALIDATION_ERROR'
  /** Optional error details */
  details?: unknown
}

/**
 * File Upload Cancel Message (UI → Agent)
 * Sent when user cancels an ongoing upload
 */
export interface FileUploadCancelMessage extends BaseMessage {
  type: 'fileUploadCancel'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** File identifier */
  fileId: string
  /** Reason for cancellation (optional) */
  reason?: string
}

/**
 * File Delete Message (UI → Agent)
 * Sent when user requests file deletion
 */
export interface FileDeleteMessage extends BaseMessage {
  type: 'fileDelete'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** File identifier or URL */
  fileId: string
  /** ZeroDB file path */
  zerodbPath?: string
}

/**
 * File Delete Complete Message (Agent → UI)
 * Sent when file deletion completes
 */
export interface FileDeleteCompleteMessage extends BaseMessage {
  type: 'fileDeleteComplete'
  /** Surface identifier */
  surfaceId: string
  /** Component identifier */
  componentId: string
  /** File identifier */
  fileId: string
  /** Success status */
  success: boolean
}

/**
 * Union of all file upload message types
 */
export type FileUploadMessage =
  | FileUploadStartMessage
  | FileUploadProgressMessage
  | FileUploadCompleteMessage
  | FileUploadErrorMessage
  | FileUploadCancelMessage
  | FileDeleteMessage
  | FileDeleteCompleteMessage

/**
 * Type guards for message discrimination
 */
export function isFileUploadStartMessage(msg: unknown): msg is FileUploadStartMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'fileUploadStart'
}

export function isFileUploadProgressMessage(msg: unknown): msg is FileUploadProgressMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'fileUploadProgress'
}

export function isFileUploadCompleteMessage(msg: unknown): msg is FileUploadCompleteMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'fileUploadComplete'
}

export function isFileUploadErrorMessage(msg: unknown): msg is FileUploadErrorMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'fileUploadError'
}

export function isFileUploadCancelMessage(msg: unknown): msg is FileUploadCancelMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'fileUploadCancel'
}

export function isFileDeleteMessage(msg: unknown): msg is FileDeleteMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'fileDelete'
}

export function isFileDeleteCompleteMessage(msg: unknown): msg is FileDeleteCompleteMessage {
  return typeof msg === 'object' && msg !== null && (msg as BaseMessage).type === 'fileDeleteComplete'
}

/**
 * Helper function to create file upload start message
 */
export function createFileUploadStartMessage(
  surfaceId: string,
  componentId: string,
  files: FileInfo[]
): FileUploadStartMessage {
  return {
    type: 'fileUploadStart',
    surfaceId,
    componentId,
    files,
    timestamp: Date.now(),
  }
}

/**
 * Helper function to create file upload progress message
 */
export function createFileUploadProgressMessage(
  surfaceId: string,
  componentId: string,
  fileId: string,
  bytesUploaded: number,
  totalBytes: number
): FileUploadProgressMessage {
  const percentage = totalBytes > 0 ? Math.round((bytesUploaded / totalBytes) * 100) : 0
  return {
    type: 'fileUploadProgress',
    surfaceId,
    componentId,
    fileId,
    bytesUploaded,
    totalBytes,
    percentage,
    timestamp: Date.now(),
  }
}

/**
 * Helper function to create file upload complete message
 */
export function createFileUploadCompleteMessage(
  surfaceId: string,
  componentId: string,
  fileId: string,
  url: string,
  metadata: Record<string, unknown>
): FileUploadCompleteMessage {
  return {
    type: 'fileUploadComplete',
    surfaceId,
    componentId,
    fileId,
    url,
    metadata,
    timestamp: Date.now(),
  }
}

/**
 * Helper function to create file upload error message
 */
export function createFileUploadErrorMessage(
  surfaceId: string,
  componentId: string,
  fileId: string,
  error: string,
  errorCode: FileUploadErrorMessage['errorCode']
): FileUploadErrorMessage {
  return {
    type: 'fileUploadError',
    surfaceId,
    componentId,
    fileId,
    error,
    errorCode,
    timestamp: Date.now(),
  }
}
