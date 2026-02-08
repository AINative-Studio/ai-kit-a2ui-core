/**
 * Video State JSON Pointer Utilities
 * Provides JSON Pointer paths for accessing and updating video state
 */

import { JSONPointer } from './json-pointer.js'

/**
 * Create JSON Pointer path for recording state
 *
 * @param recordingId - Unique recording identifier
 * @param field - Optional field path (e.g., 'mode', 'options/audio')
 * @returns JSON Pointer string
 *
 * @example
 * createRecordingStatePath('rec-123')  // '/recordings/rec-123/state'
 * createRecordingStatePath('rec-123', 'mode')  // '/recordings/rec-123/mode'
 * createRecordingStatePath('rec-123', 'options/audio')  // '/recordings/rec-123/options/audio'
 */
export function createRecordingStatePath(recordingId: string, field: string = 'state'): string {
  return `/recordings/${recordingId}/${field}`
}

/**
 * Create JSON Pointer path for video call state
 *
 * @param callId - Unique call identifier
 * @param field - Optional field path (e.g., 'participants', 'participants/0/isMuted')
 * @returns JSON Pointer string
 *
 * @example
 * createVideoCallStatePath('call-456')  // '/videoCalls/call-456/state'
 * createVideoCallStatePath('call-456', 'participants')  // '/videoCalls/call-456/participants'
 * createVideoCallStatePath('call-456', 'participants/0/isMuted')  // '/videoCalls/call-456/participants/0/isMuted'
 */
export function createVideoCallStatePath(callId: string, field: string = 'state'): string {
  return `/videoCalls/${callId}/${field}`
}

/**
 * Create JSON Pointer path for video generation state
 *
 * @param videoId - Unique video identifier
 * @param field - Optional field path (e.g., 'progress', 'composition/fps')
 * @returns JSON Pointer string
 *
 * @example
 * createVideoGenerationStatePath('vid-789')  // '/videoGenerations/vid-789/state'
 * createVideoGenerationStatePath('vid-789', 'progress')  // '/videoGenerations/vid-789/progress'
 * createVideoGenerationStatePath('vid-789', 'composition/fps')  // '/videoGenerations/vid-789/composition/fps'
 */
export function createVideoGenerationStatePath(videoId: string, field: string = 'state'): string {
  return `/videoGenerations/${videoId}/${field}`
}

/**
 * Resolve a video state value using JSON Pointer
 *
 * @param state - The video state object
 * @param pointer - JSON Pointer path
 * @returns Resolved value or undefined if not found
 *
 * @example
 * const state = { recordings: { 'rec-123': { state: 'recording' } } }
 * resolveVideoState(state, '/recordings/rec-123/state')  // 'recording'
 */
export function resolveVideoState<T = unknown>(state: unknown, pointer: string): T | undefined {
  return JSONPointer.resolve<T>(state, pointer)
}

/**
 * Update a video state value using JSON Pointer
 *
 * @param state - The video state object to modify
 * @param pointer - JSON Pointer path
 * @param value - Value to set
 *
 * @example
 * const state = { recordings: { 'rec-123': { state: 'recording' } } }
 * updateVideoState(state, '/recordings/rec-123/state', 'complete')
 * // state.recordings['rec-123'].state is now 'complete'
 */
export function updateVideoState(state: unknown, pointer: string, value: unknown): void {
  JSONPointer.set(state, pointer, value)
}

/**
 * Video State Pointer Builder
 * Provides a fluent API for building JSON Pointer paths for video state
 */
export class VideoStatePointer {
  /**
   * Create a recording state pointer builder
   *
   * @param recordingId - Unique recording identifier
   * @returns RecordingStatePointer instance
   *
   * @example
   * const pointer = VideoStatePointer.recording('rec-123')
   * pointer.state()  // '/recordings/rec-123/state'
   * pointer.mode()  // '/recordings/rec-123/mode'
   */
  static recording(recordingId: string): RecordingStatePointer {
    return new RecordingStatePointer(recordingId)
  }

  /**
   * Create a video call state pointer builder
   *
   * @param callId - Unique call identifier
   * @returns VideoCallStatePointer instance
   *
   * @example
   * const pointer = VideoStatePointer.videoCall('call-456')
   * pointer.state()  // '/videoCalls/call-456/state'
   * pointer.participants()  // '/videoCalls/call-456/participants'
   */
  static videoCall(callId: string): VideoCallStatePointer {
    return new VideoCallStatePointer(callId)
  }

  /**
   * Create a video generation state pointer builder
   *
   * @param videoId - Unique video identifier
   * @returns VideoGenerationStatePointer instance
   *
   * @example
   * const pointer = VideoStatePointer.videoGeneration('vid-789')
   * pointer.state()  // '/videoGenerations/vid-789/state'
   * pointer.progress()  // '/videoGenerations/vid-789/progress'
   */
  static videoGeneration(videoId: string): VideoGenerationStatePointer {
    return new VideoGenerationStatePointer(videoId)
  }
}

/**
 * Recording State Pointer Builder
 */
export class RecordingStatePointer {
  constructor(private readonly recordingId: string) {}

  /** Get pointer to recording state */
  state(): string {
    return createRecordingStatePath(this.recordingId, 'state')
  }

  /** Get pointer to recording mode */
  mode(): string {
    return createRecordingStatePath(this.recordingId, 'mode')
  }

  /** Get pointer to recording options */
  options(): string {
    return createRecordingStatePath(this.recordingId, 'options')
  }

  /** Get pointer to audio option */
  optionAudio(): string {
    return createRecordingStatePath(this.recordingId, 'options/audio')
  }

  /** Get pointer to quality option */
  optionQuality(): string {
    return createRecordingStatePath(this.recordingId, 'options/quality')
  }

  /** Get pointer to duration option */
  optionDuration(): string {
    return createRecordingStatePath(this.recordingId, 'options/duration')
  }

  /** Get pointer to video URL */
  videoUrl(): string {
    return createRecordingStatePath(this.recordingId, 'videoUrl')
  }

  /** Get pointer to recording duration */
  duration(): string {
    return createRecordingStatePath(this.recordingId, 'duration')
  }

  /** Get pointer to transcript */
  transcript(): string {
    return createRecordingStatePath(this.recordingId, 'transcript')
  }

  /** Get pointer to highlights */
  highlights(): string {
    return createRecordingStatePath(this.recordingId, 'highlights')
  }
}

/**
 * Video Call State Pointer Builder
 */
export class VideoCallStatePointer {
  constructor(private readonly callId: string) {}

  /** Get pointer to video call state */
  state(): string {
    return createVideoCallStatePath(this.callId, 'state')
  }

  /** Get pointer to room ID */
  roomId(): string {
    return createVideoCallStatePath(this.callId, 'roomId')
  }

  /** Get pointer to participants array */
  participants(): string {
    return createVideoCallStatePath(this.callId, 'participants')
  }

  /** Get pointer to specific participant by index */
  participant(index: number): string {
    return createVideoCallStatePath(this.callId, `participants/${index}`)
  }

  /** Get pointer to specific participant property */
  participantProperty(index: number, property: string): string {
    return createVideoCallStatePath(this.callId, `participants/${index}/${property}`)
  }

  /** Get pointer to call duration */
  duration(): string {
    return createVideoCallStatePath(this.callId, 'duration')
  }

  /** Get pointer to transcript */
  transcript(): string {
    return createVideoCallStatePath(this.callId, 'transcript')
  }

  /** Get pointer to summary */
  summary(): string {
    return createVideoCallStatePath(this.callId, 'summary')
  }

  /** Get pointer to action items */
  actionItems(): string {
    return createVideoCallStatePath(this.callId, 'actionItems')
  }
}

/**
 * Video Generation State Pointer Builder
 */
export class VideoGenerationStatePointer {
  constructor(private readonly videoId: string) {}

  /** Get pointer to video generation state */
  state(): string {
    return createVideoGenerationStatePath(this.videoId, 'state')
  }

  /** Get pointer to generation progress */
  progress(): string {
    return createVideoGenerationStatePath(this.videoId, 'progress')
  }

  /** Get pointer to video URL */
  videoUrl(): string {
    return createVideoGenerationStatePath(this.videoId, 'videoUrl')
  }

  /** Get pointer to composition metadata */
  composition(): string {
    return createVideoGenerationStatePath(this.videoId, 'composition')
  }

  /** Get pointer to preview frame */
  frame(): string {
    return createVideoGenerationStatePath(this.videoId, 'frame')
  }
}
