# File Upload Component

The `fileUpload` component provides comprehensive file upload capabilities for A2UI applications with built-in ZeroDB integration, validation, progress tracking, and security features.

## Table of Contents

- [Component Properties](#component-properties)
- [Usage Examples](#usage-examples)
- [ZeroDB Integration](#zerodb-integration)
- [Message Types](#message-types)
- [Validation](#validation)
- [Security Considerations](#security-considerations)
- [Browser Compatibility](#browser-compatibility)
- [Best Practices](#best-practices)

## Component Properties

### Basic Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `accept` | `string[]` | `undefined` | Accepted file types (MIME types or extensions) |
| `multiple` | `boolean` | `false` | Allow multiple file selection |
| `maxFileSize` | `number` | `10485760` (10MB) | Maximum file size in bytes |
| `maxFiles` | `number` | `5` | Maximum number of files |
| `dragAndDrop` | `boolean` | `true` | Enable drag-and-drop upload |
| `showProgress` | `boolean` | `true` | Show upload progress indicator |
| `showPreview` | `boolean` | `true` | Show file previews for images |
| `disabled` | `boolean` | `false` | Disable the upload component |

### Advanced Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `uploadEndpoint` | `string` | `undefined` | Custom upload endpoint (uses ZeroDB if not set) |
| `metadata` | `Record<string, unknown>` | `undefined` | Additional metadata to attach to uploads |
| `label` | `string` | `undefined` | Label text for the upload button |
| `helperText` | `string` | `undefined` | Helper text displayed below upload area |
| `error` | `string` | `undefined` | Error message to display |

### Event Handlers

| Property | Type | Description |
|----------|------|-------------|
| `onUploadStart` | `string` | JSON Pointer to handler for upload start |
| `onUploadProgress` | `string` | JSON Pointer to handler for progress updates |
| `onUploadComplete` | `string` | JSON Pointer to handler for successful upload |
| `onUploadError` | `string` | JSON Pointer to handler for upload errors |

## Usage Examples

### Basic Single File Upload

```typescript
import type { TypedA2UIComponent } from '@ainative/ai-kit-a2ui-core'

const uploadComponent: TypedA2UIComponent<'fileUpload'> = {
  id: 'profile-photo',
  type: 'fileUpload',
  properties: {
    accept: ['image/*'],
    multiple: false,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    label: 'Upload Profile Photo',
    helperText: 'JPG, PNG, or GIF. Maximum 5MB.',
    showPreview: true,
    onUploadComplete: '/handlers/profilePhotoUploaded'
  }
}
```

### Multiple Document Upload

```typescript
const documentUpload: TypedA2UIComponent<'fileUpload'> = {
  id: 'document-upload',
  type: 'fileUpload',
  properties: {
    accept: ['.pdf', '.doc', '.docx', '.txt'],
    multiple: true,
    maxFiles: 10,
    maxFileSize: 10 * 1024 * 1024, // 10MB per file
    label: 'Upload Documents',
    helperText: 'PDF, DOC, DOCX, or TXT. Maximum 10 files, 10MB each.',
    dragAndDrop: true,
    showProgress: true,
    onUploadStart: '/handlers/documentUploadStart',
    onUploadProgress: '/handlers/documentUploadProgress',
    onUploadComplete: '/handlers/documentUploadComplete',
    onUploadError: '/handlers/documentUploadError'
  }
}
```

### Upload with Custom Metadata

```typescript
const attachmentUpload: TypedA2UIComponent<'fileUpload'> = {
  id: 'ticket-attachment',
  type: 'fileUpload',
  properties: {
    accept: ['image/*', '.pdf', '.zip'],
    multiple: true,
    maxFiles: 5,
    metadata: {
      ticketId: 'TKT-12345',
      userId: 'user-789',
      category: 'support-attachment',
      visibility: 'internal'
    },
    label: 'Attach Files',
    helperText: 'Images, PDFs, or ZIP files. Maximum 5 files.',
    onUploadComplete: '/handlers/attachmentUploaded'
  }
}
```

### Image Gallery Upload

```typescript
const galleryUpload: TypedA2UIComponent<'fileUpload'> = {
  id: 'gallery-upload',
  type: 'fileUpload',
  properties: {
    accept: ['image/jpeg', 'image/png', 'image/webp'],
    multiple: true,
    maxFiles: 20,
    maxFileSize: 5 * 1024 * 1024,
    showPreview: true,
    dragAndDrop: true,
    label: 'Add Photos',
    helperText: 'JPEG, PNG, or WebP. Maximum 20 photos, 5MB each.',
    metadata: {
      albumId: 'album-456',
      autoOptimize: true
    },
    onUploadComplete: '/handlers/photoAdded'
  }
}
```

## ZeroDB Integration

The file upload component integrates seamlessly with ZeroDB for secure, scalable file storage.

### Default Behavior

When no `uploadEndpoint` is specified, files are automatically uploaded to ZeroDB:

```typescript
const upload: TypedA2UIComponent<'fileUpload'> = {
  id: 'zerodb-upload',
  type: 'fileUpload',
  properties: {
    accept: ['image/*', '.pdf'],
    multiple: true,
    // No uploadEndpoint = uses ZeroDB automatically
    onUploadComplete: '/handlers/fileUploaded'
  }
}
```

### Upload Flow

1. **User selects files** → `fileUploadStart` message sent
2. **Agent validates files** → Uses ZeroDB MCP `/zerodb-file-upload` command
3. **Upload progresses** → `fileUploadProgress` messages sent
4. **Upload completes** → `fileUploadComplete` message with URL and metadata
5. **Access files** → Use `/zerodb-file-url` to generate presigned URLs

### Handler Implementation

```typescript
// Upload complete handler
{
  "/handlers/fileUploaded": async (context) => {
    const { fileId, url, metadata, zerodbPath } = context.data

    // Store file reference in application database
    await db.files.create({
      id: fileId,
      url: url,
      path: zerodbPath,
      metadata: metadata,
      uploadedAt: new Date()
    })

    // Generate presigned URL for secure access (expires in 1 hour)
    const presignedUrl = await zerodb.generatePresignedUrl(zerodbPath, 3600)

    return {
      success: true,
      accessUrl: presignedUrl
    }
  }
}
```

### Retrieving Uploaded Files

```typescript
// Generate presigned URL for file access
const presignedUrl = await zerodb.fileUrl({
  path: '/project-123/uploads/document.pdf',
  expiresIn: 3600 // 1 hour
})

// Download file
const response = await fetch(presignedUrl)
const blob = await response.blob()
```

## Message Types

### fileUploadStart

Sent when user initiates file upload.

```typescript
{
  type: 'fileUploadStart',
  surfaceId: 'surface-1',
  componentId: 'upload-1',
  files: [
    {
      fileId: 'file-abc123',
      name: 'document.pdf',
      size: 1048576,
      type: 'application/pdf',
      lastModified: 1707580800000,
      metadata: { category: 'invoice' }
    }
  ],
  timestamp: 1707580800000
}
```

### fileUploadProgress

Sent to update upload progress (can be bidirectional).

```typescript
{
  type: 'fileUploadProgress',
  surfaceId: 'surface-1',
  componentId: 'upload-1',
  fileId: 'file-abc123',
  bytesUploaded: 524288,
  totalBytes: 1048576,
  percentage: 50,
  statusMessage: 'Uploading to ZeroDB...',
  timestamp: 1707580800000
}
```

### fileUploadComplete

Sent when upload successfully completes.

```typescript
{
  type: 'fileUploadComplete',
  surfaceId: 'surface-1',
  componentId: 'upload-1',
  fileId: 'file-abc123',
  url: 'https://storage.zerodb.io/files/document.pdf',
  presignedUrl: 'https://storage.zerodb.io/files/document.pdf?signature=xyz',
  expiresAt: 1707584400000,
  metadata: {
    size: 1048576,
    uploadedAt: 1707580800000,
    contentType: 'application/pdf'
  },
  zerodbPath: '/project-123/uploads/document.pdf',
  timestamp: 1707580800000
}
```

### fileUploadError

Sent when upload fails.

```typescript
{
  type: 'fileUploadError',
  surfaceId: 'surface-1',
  componentId: 'upload-1',
  fileId: 'file-abc123',
  error: 'File size exceeds maximum allowed size',
  errorCode: 'FILE_SIZE',
  details: {
    fileSize: 20971520,
    maxFileSize: 10485760
  },
  timestamp: 1707580800000
}
```

**Error Codes:**
- `FILE_TYPE` - Invalid file type
- `FILE_SIZE` - File too large
- `FILE_COUNT` - Too many files
- `FILE_NAME` - Invalid file name
- `UPLOAD_FAILED` - Upload operation failed
- `NETWORK_ERROR` - Network connection issue
- `VALIDATION_ERROR` - Validation failed

### fileUploadCancel

Sent when user cancels upload.

```typescript
{
  type: 'fileUploadCancel',
  surfaceId: 'surface-1',
  componentId: 'upload-1',
  fileId: 'file-abc123',
  reason: 'User cancelled upload',
  timestamp: 1707580800000
}
```

### fileDelete

Sent to delete uploaded file.

```typescript
{
  type: 'fileDelete',
  surfaceId: 'surface-1',
  componentId: 'upload-1',
  fileId: 'file-abc123',
  zerodbPath: '/project-123/uploads/document.pdf',
  timestamp: 1707580800000
}
```

### fileDeleteComplete

Sent when file deletion completes.

```typescript
{
  type: 'fileDeleteComplete',
  surfaceId: 'surface-1',
  componentId: 'upload-1',
  fileId: 'file-abc123',
  success: true,
  timestamp: 1707580800000
}
```

## Validation

### Client-Side Validation

The component performs comprehensive client-side validation before upload:

```typescript
import { validateFiles } from '@ainative/ai-kit-a2ui-core'

const properties = {
  accept: ['image/*', '.pdf'],
  maxFileSize: 5 * 1024 * 1024,
  maxFiles: 10,
  multiple: true
}

const files = [
  { name: 'photo.jpg', size: 2097152, type: 'image/jpeg', lastModified: Date.now() },
  { name: 'document.pdf', size: 1048576, type: 'application/pdf', lastModified: Date.now() }
]

const result = validateFiles(files, properties)
if (!result.valid) {
  console.error(result.error, result.errorCode)
}
```

### Validation Rules

1. **File Type Validation**
   - Supports MIME type patterns (`image/*`, `video/*`)
   - Supports exact MIME types (`image/png`, `application/pdf`)
   - Supports file extensions (`.pdf`, `.docx`)
   - Case-insensitive matching

2. **File Size Validation**
   - Validates individual file sizes
   - Configurable maximum size per file
   - Human-readable error messages

3. **File Count Validation**
   - Enforces `maxFiles` limit
   - Checks `multiple` property
   - Clear error messages

4. **File Name Validation**
   - Removes path separators (`/`, `\`)
   - Removes dangerous characters (`<`, `>`, `|`, etc.)
   - Prevents reserved system names
   - Maximum length: 255 characters

### File Name Sanitization

```typescript
import { sanitizeFileName } from '@ainative/ai-kit-a2ui-core'

const dangerous = '../../../etc/passwd'
const safe = sanitizeFileName(dangerous) // Returns: 'etcpasswd'

const withSpaces = '  my file  name.txt  '
const clean = sanitizeFileName(withSpaces) // Returns: 'my file name.txt'
```

## Security Considerations

### 1. File Type Restrictions

Always restrict file types to prevent malicious uploads:

```typescript
// Good: Explicit whitelist
properties: {
  accept: ['image/jpeg', 'image/png', '.pdf']
}

// Bad: Too permissive
properties: {
  accept: ['*/*'] // Allows any file type
}
```

### 2. File Size Limits

Set appropriate size limits to prevent DoS attacks:

```typescript
properties: {
  maxFileSize: 10 * 1024 * 1024, // 10MB max
  maxFiles: 5 // Limit total files
}
```

### 3. File Name Sanitization

File names are automatically sanitized to prevent:
- Path traversal attacks (`../../../`)
- Command injection (`file; rm -rf /`)
- Cross-site scripting (`file<script>.js`)

### 4. Presigned URLs

Use presigned URLs with expiration for secure file access:

```typescript
// Generate presigned URL with 1-hour expiration
const presignedUrl = await zerodb.generatePresignedUrl(
  '/project-123/uploads/document.pdf',
  3600 // expires in 1 hour
)
```

### 5. Content-Type Verification

Always verify MIME types on the server:

```typescript
// Server-side verification
const actualType = await detectMimeType(fileBuffer)
if (actualType !== declaredType) {
  throw new Error('MIME type mismatch')
}
```

### 6. Virus Scanning

Integrate virus scanning for uploaded files:

```typescript
// Agent-side scanning
const scanResult = await virusScanner.scan(filePath)
if (!scanResult.clean) {
  return {
    type: 'fileUploadError',
    error: 'File contains malware',
    errorCode: 'VALIDATION_ERROR'
  }
}
```

## Browser Compatibility

### Core Features

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| File Input | ✅ All | ✅ All | ✅ All | ✅ All |
| Multiple Files | ✅ 6+ | ✅ 3.6+ | ✅ 4+ | ✅ All |
| Drag & Drop | ✅ 7+ | ✅ 3.6+ | ✅ 6+ | ✅ All |
| Progress Events | ✅ 7+ | ✅ 3.6+ | ✅ 5+ | ✅ All |
| File API | ✅ 13+ | ✅ 7+ | ✅ 6+ | ✅ All |

### MIME Type Support

- Use both MIME types and extensions for maximum compatibility
- Some browsers may not correctly detect MIME types
- Always include fallback extension-based validation

### Mobile Considerations

```typescript
// Mobile-optimized configuration
properties: {
  accept: ['image/*'], // Opens camera on mobile
  multiple: true, // Allow multiple photos
  maxFileSize: 3 * 1024 * 1024, // Lower limit for mobile (3MB)
  showPreview: true, // Preview before upload
  dragAndDrop: false // Not needed on mobile
}
```

## Best Practices

### 1. Progressive Enhancement

Start with basic file input and enhance with features:

```typescript
// Basic (works everywhere)
properties: {
  accept: ['.pdf'],
  maxFileSize: 5 * 1024 * 1024
}

// Enhanced (if drag-drop supported)
properties: {
  accept: ['.pdf'],
  maxFileSize: 5 * 1024 * 1024,
  dragAndDrop: true,
  showProgress: true,
  showPreview: true
}
```

### 2. User Feedback

Always provide clear feedback during upload:

```typescript
properties: {
  showProgress: true,
  helperText: 'Uploading... Please wait.',
  onUploadProgress: '/handlers/updateProgress',
  onUploadComplete: '/handlers/showSuccess',
  onUploadError: '/handlers/showError'
}
```

### 3. Error Handling

Handle all error cases gracefully:

```typescript
{
  "/handlers/uploadError": (context) => {
    const { error, errorCode } = context.data

    let userMessage = ''
    switch (errorCode) {
      case 'FILE_SIZE':
        userMessage = 'File is too large. Please select a smaller file.'
        break
      case 'FILE_TYPE':
        userMessage = 'File type not supported. Please select a different file.'
        break
      case 'NETWORK_ERROR':
        userMessage = 'Upload failed due to network issue. Please try again.'
        break
      default:
        userMessage = 'Upload failed. Please try again.'
    }

    return {
      type: 'updateComponents',
      updates: [{
        id: 'upload-1',
        operation: 'update',
        component: {
          id: 'upload-1',
          type: 'fileUpload',
          properties: { error: userMessage }
        }
      }]
    }
  }
}
```

### 4. Accessibility

Ensure upload component is accessible:

- Provide clear labels and helper text
- Use semantic HTML (if implementing UI)
- Support keyboard navigation
- Announce upload progress to screen readers
- Provide alternative text for previews

### 5. Performance

Optimize for large file uploads:

```typescript
// Chunked upload for large files
properties: {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  metadata: {
    chunkSize: 5 * 1024 * 1024, // 5MB chunks
    enableResume: true // Resume interrupted uploads
  }
}
```

### 6. Testing

Test upload functionality thoroughly:

```typescript
import { describe, it, expect } from 'vitest'
import { validateFile } from '@ainative/ai-kit-a2ui-core'

describe('File Upload', () => {
  it('validates file types correctly', () => {
    const properties = { accept: ['image/*'] }
    const file = {
      name: 'photo.jpg',
      size: 1024,
      type: 'image/jpeg',
      lastModified: Date.now()
    }

    const result = validateFile(file, properties)
    expect(result.valid).toBe(true)
  })
})
```

## Complete Example

```typescript
import type { CreateSurfaceMessage } from '@ainative/ai-kit-a2ui-core'

const uploadSurface: CreateSurfaceMessage = {
  type: 'createSurface',
  surfaceId: 'file-upload-demo',
  components: [
    {
      id: 'upload-container',
      type: 'card',
      properties: {
        title: 'File Upload Demo',
        padding: 20
      },
      children: ['upload-component', 'status-text']
    },
    {
      id: 'upload-component',
      type: 'fileUpload',
      properties: {
        accept: ['image/*', '.pdf', '.doc', '.docx'],
        multiple: true,
        maxFiles: 10,
        maxFileSize: 10 * 1024 * 1024,
        label: 'Upload Files',
        helperText: 'Images, PDFs, or Word documents. Maximum 10 files, 10MB each.',
        dragAndDrop: true,
        showProgress: true,
        showPreview: true,
        metadata: {
          userId: 'user-123',
          projectId: 'project-456'
        },
        onUploadStart: '/handlers/uploadStart',
        onUploadProgress: '/handlers/uploadProgress',
        onUploadComplete: '/handlers/uploadComplete',
        onUploadError: '/handlers/uploadError'
      }
    },
    {
      id: 'status-text',
      type: 'text',
      properties: {
        value: 'Ready to upload',
        fontSize: 14,
        color: '#666'
      }
    }
  ],
  dataModel: {
    uploadedFiles: [],
    totalProgress: 0
  }
}
```

---

**Version:** 0.9
**Last Updated:** 2025-02-10
**Status:** Stable
