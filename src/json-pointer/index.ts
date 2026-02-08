/**
 * JSON Pointer (RFC 6901)
 */

export { JSONPointer, JSONPointerError } from './json-pointer.js'
export {
  VideoStatePointer,
  RecordingStatePointer,
  VideoCallStatePointer,
  VideoGenerationStatePointer,
  createRecordingStatePath,
  createVideoCallStatePath,
  createVideoGenerationStatePath,
  resolveVideoState,
  updateVideoState,
} from './video-state-pointer.js'
