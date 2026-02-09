/**
 * Video State JSON Pointer Tests
 * Tests for JSON Pointer paths for accessing and updating video state
 */

import { describe, it, expect } from 'vitest'
import {
  VideoStatePointer,
  resolveVideoState,
  updateVideoState,
  createRecordingStatePath,
  createVideoCallStatePath,
  createVideoGenerationStatePath,
} from '../../src/json-pointer/video-state-pointer.js'
import type {
  RecordingState,
  VideoCallState,
  VideoGenerationState,
  VideoCallParticipant,
} from '../../src/types/video-protocol.js'

describe('VideoStatePointer', () => {
  describe('createRecordingStatePath', () => {
    it('should create path for recording state', () => {
      const path = createRecordingStatePath('rec-123')
      expect(path).toBe('/recordings/rec-123/state')
    })

    it('should create path for recording mode', () => {
      const path = createRecordingStatePath('rec-123', 'mode')
      expect(path).toBe('/recordings/rec-123/mode')
    })

    it('should create path for recording options', () => {
      const path = createRecordingStatePath('rec-123', 'options/audio')
      expect(path).toBe('/recordings/rec-123/options/audio')
    })

    it('should handle nested paths', () => {
      const path = createRecordingStatePath('rec-123', 'options/quality')
      expect(path).toBe('/recordings/rec-123/options/quality')
    })
  })

  describe('createVideoCallStatePath', () => {
    it('should create path for video call state', () => {
      const path = createVideoCallStatePath('call-456')
      expect(path).toBe('/videoCalls/call-456/state')
    })

    it('should create path for call participants', () => {
      const path = createVideoCallStatePath('call-456', 'participants')
      expect(path).toBe('/videoCalls/call-456/participants')
    })

    it('should create path for specific participant', () => {
      const path = createVideoCallStatePath('call-456', 'participants/0')
      expect(path).toBe('/videoCalls/call-456/participants/0')
    })

    it('should create path for participant property', () => {
      const path = createVideoCallStatePath('call-456', 'participants/0/isMuted')
      expect(path).toBe('/videoCalls/call-456/participants/0/isMuted')
    })

    it('should create path for room ID', () => {
      const path = createVideoCallStatePath('call-456', 'roomId')
      expect(path).toBe('/videoCalls/call-456/roomId')
    })
  })

  describe('createVideoGenerationStatePath', () => {
    it('should create path for video generation state', () => {
      const path = createVideoGenerationStatePath('vid-789')
      expect(path).toBe('/videoGenerations/vid-789/state')
    })

    it('should create path for generation progress', () => {
      const path = createVideoGenerationStatePath('vid-789', 'progress')
      expect(path).toBe('/videoGenerations/vid-789/progress')
    })

    it('should create path for video URL', () => {
      const path = createVideoGenerationStatePath('vid-789', 'videoUrl')
      expect(path).toBe('/videoGenerations/vid-789/videoUrl')
    })

    it('should create path for composition metadata', () => {
      const path = createVideoGenerationStatePath('vid-789', 'composition/fps')
      expect(path).toBe('/videoGenerations/vid-789/composition/fps')
    })
  })

  describe('resolveVideoState', () => {
    it('should resolve recording state', () => {
      const state = {
        recordings: {
          'rec-123': {
            state: 'recording' as RecordingState,
            mode: 'screen',
            startedAt: '2024-01-01T00:00:00Z',
          },
        },
      }

      const result = resolveVideoState<RecordingState>(
        state,
        createRecordingStatePath('rec-123')
      )
      expect(result).toBe('recording')
    })

    it('should resolve recording mode', () => {
      const state = {
        recordings: {
          'rec-123': {
            state: 'recording' as RecordingState,
            mode: 'screen',
          },
        },
      }

      const result = resolveVideoState<string>(
        state,
        createRecordingStatePath('rec-123', 'mode')
      )
      expect(result).toBe('screen')
    })

    it('should resolve recording options', () => {
      const state = {
        recordings: {
          'rec-123': {
            state: 'recording' as RecordingState,
            options: {
              audio: true,
              quality: 'high',
              duration: 300,
            },
          },
        },
      }

      const result = resolveVideoState<boolean>(
        state,
        createRecordingStatePath('rec-123', 'options/audio')
      )
      expect(result).toBe(true)
    })

    it('should resolve video call state', () => {
      const state = {
        videoCalls: {
          'call-456': {
            state: 'active' as VideoCallState,
            roomId: 'room-1',
            participants: [],
          },
        },
      }

      const result = resolveVideoState<VideoCallState>(
        state,
        createVideoCallStatePath('call-456')
      )
      expect(result).toBe('active')
    })

    it('should resolve participant array', () => {
      const participants: VideoCallParticipant[] = [
        {
          id: 'user-1',
          name: 'Alice',
          role: 'host',
          isMuted: false,
          isVideoEnabled: true,
        },
      ]

      const state = {
        videoCalls: {
          'call-456': {
            state: 'active' as VideoCallState,
            participants,
          },
        },
      }

      const result = resolveVideoState<VideoCallParticipant[]>(
        state,
        createVideoCallStatePath('call-456', 'participants')
      )
      expect(result).toEqual(participants)
    })

    it('should resolve specific participant', () => {
      const participants: VideoCallParticipant[] = [
        {
          id: 'user-1',
          name: 'Alice',
          role: 'host',
          isMuted: false,
          isVideoEnabled: true,
        },
        {
          id: 'user-2',
          name: 'Bob',
          role: 'participant',
          isMuted: true,
          isVideoEnabled: false,
        },
      ]

      const state = {
        videoCalls: {
          'call-456': {
            state: 'active' as VideoCallState,
            participants,
          },
        },
      }

      const result = resolveVideoState<VideoCallParticipant>(
        state,
        createVideoCallStatePath('call-456', 'participants/1')
      )
      expect(result).toEqual(participants[1])
    })

    it('should resolve participant property', () => {
      const participants: VideoCallParticipant[] = [
        {
          id: 'user-1',
          name: 'Alice',
          role: 'host',
          isMuted: false,
          isVideoEnabled: true,
        },
      ]

      const state = {
        videoCalls: {
          'call-456': {
            state: 'active' as VideoCallState,
            participants,
          },
        },
      }

      const result = resolveVideoState<boolean>(
        state,
        createVideoCallStatePath('call-456', 'participants/0/isMuted')
      )
      expect(result).toBe(false)
    })

    it('should resolve video generation state', () => {
      const state = {
        videoGenerations: {
          'vid-789': {
            state: 'generating' as VideoGenerationState,
            progress: 45,
          },
        },
      }

      const result = resolveVideoState<VideoGenerationState>(
        state,
        createVideoGenerationStatePath('vid-789')
      )
      expect(result).toBe('generating')
    })

    it('should resolve generation progress', () => {
      const state = {
        videoGenerations: {
          'vid-789': {
            state: 'generating' as VideoGenerationState,
            progress: 45,
          },
        },
      }

      const result = resolveVideoState<number>(
        state,
        createVideoGenerationStatePath('vid-789', 'progress')
      )
      expect(result).toBe(45)
    })

    it('should return undefined for non-existent path', () => {
      const state = { recordings: {} }

      const result = resolveVideoState(
        state,
        createRecordingStatePath('non-existent')
      )
      expect(result).toBeUndefined()
    })

    it('should return undefined for invalid nested path', () => {
      const state = {
        recordings: {
          'rec-123': {
            state: 'recording' as RecordingState,
          },
        },
      }

      const result = resolveVideoState(
        state,
        createRecordingStatePath('rec-123', 'invalid/path')
      )
      expect(result).toBeUndefined()
    })
  })

  describe('updateVideoState', () => {
    it('should update recording state', () => {
      const state = {
        recordings: {
          'rec-123': {
            state: 'recording' as RecordingState,
            mode: 'screen',
          },
        },
      }

      updateVideoState(state, createRecordingStatePath('rec-123'), 'complete')
      expect(state.recordings['rec-123'].state).toBe('complete')
    })

    it('should update recording options', () => {
      const state = {
        recordings: {
          'rec-123': {
            state: 'recording' as RecordingState,
            options: {
              audio: true,
            },
          },
        },
      }

      updateVideoState(
        state,
        createRecordingStatePath('rec-123', 'options/audio'),
        false
      )
      expect(state.recordings['rec-123'].options.audio).toBe(false)
    })

    it('should create intermediate objects when updating', () => {
      const state = {
        recordings: {},
      }

      updateVideoState(
        state,
        createRecordingStatePath('rec-new', 'options/audio'),
        true
      )
      expect(state.recordings['rec-new']?.options?.audio).toBe(true)
    })

    it('should update video call state', () => {
      const state = {
        videoCalls: {
          'call-456': {
            state: 'connecting' as VideoCallState,
          },
        },
      }

      updateVideoState(
        state,
        createVideoCallStatePath('call-456'),
        'active' as VideoCallState
      )
      expect(state.videoCalls['call-456'].state).toBe('active')
    })

    it('should update participant property', () => {
      const participants: VideoCallParticipant[] = [
        {
          id: 'user-1',
          name: 'Alice',
          role: 'host',
          isMuted: false,
          isVideoEnabled: true,
        },
      ]

      const state = {
        videoCalls: {
          'call-456': {
            state: 'active' as VideoCallState,
            participants,
          },
        },
      }

      updateVideoState(
        state,
        createVideoCallStatePath('call-456', 'participants/0/isMuted'),
        true
      )
      expect(state.videoCalls['call-456'].participants[0].isMuted).toBe(true)
    })

    it('should update video generation progress', () => {
      const state = {
        videoGenerations: {
          'vid-789': {
            state: 'generating' as VideoGenerationState,
            progress: 0,
          },
        },
      }

      updateVideoState(
        state,
        createVideoGenerationStatePath('vid-789', 'progress'),
        75
      )
      expect(state.videoGenerations['vid-789'].progress).toBe(75)
    })

    it('should update nested composition metadata', () => {
      const state = {
        videoGenerations: {
          'vid-789': {
            state: 'generating' as VideoGenerationState,
            composition: {},
          },
        },
      }

      updateVideoState(
        state,
        createVideoGenerationStatePath('vid-789', 'composition/fps'),
        60
      )
      expect(state.videoGenerations['vid-789'].composition.fps).toBe(60)
    })

    it('should throw error when updating non-object parent', () => {
      const state = {
        recordings: {
          'rec-123': {
            state: 'recording' as RecordingState,
            mode: 'screen',
          },
        },
      }

      expect(() => {
        updateVideoState(
          state,
          createRecordingStatePath('rec-123', 'mode/invalid'),
          'value'
        )
      }).toThrow()
    })
  })

  describe('VideoStatePointer class', () => {
    it('should create recording state pointer', () => {
      const pointer = VideoStatePointer.recording('rec-123')
      expect(pointer.state()).toBe('/recordings/rec-123/state')
      expect(pointer.mode()).toBe('/recordings/rec-123/mode')
      expect(pointer.options()).toBe('/recordings/rec-123/options')
      expect(pointer.videoUrl()).toBe('/recordings/rec-123/videoUrl')
      expect(pointer.duration()).toBe('/recordings/rec-123/duration')
      expect(pointer.transcript()).toBe('/recordings/rec-123/transcript')
      expect(pointer.highlights()).toBe('/recordings/rec-123/highlights')
    })

    it('should create video call state pointer', () => {
      const pointer = VideoStatePointer.videoCall('call-456')
      expect(pointer.state()).toBe('/videoCalls/call-456/state')
      expect(pointer.roomId()).toBe('/videoCalls/call-456/roomId')
      expect(pointer.participants()).toBe('/videoCalls/call-456/participants')
      expect(pointer.participant(0)).toBe('/videoCalls/call-456/participants/0')
      expect(pointer.duration()).toBe('/videoCalls/call-456/duration')
      expect(pointer.transcript()).toBe('/videoCalls/call-456/transcript')
      expect(pointer.summary()).toBe('/videoCalls/call-456/summary')
      expect(pointer.actionItems()).toBe('/videoCalls/call-456/actionItems')
    })

    it('should create video generation state pointer', () => {
      const pointer = VideoStatePointer.videoGeneration('vid-789')
      expect(pointer.state()).toBe('/videoGenerations/vid-789/state')
      expect(pointer.progress()).toBe('/videoGenerations/vid-789/progress')
      expect(pointer.videoUrl()).toBe('/videoGenerations/vid-789/videoUrl')
      expect(pointer.composition()).toBe('/videoGenerations/vid-789/composition')
      expect(pointer.frame()).toBe('/videoGenerations/vid-789/frame')
    })

    it('should create participant property pointers', () => {
      const pointer = VideoStatePointer.videoCall('call-456')
      expect(pointer.participantProperty(0, 'isMuted')).toBe(
        '/videoCalls/call-456/participants/0/isMuted'
      )
      expect(pointer.participantProperty(1, 'isVideoEnabled')).toBe(
        '/videoCalls/call-456/participants/1/isVideoEnabled'
      )
      expect(pointer.participantProperty(0, 'name')).toBe(
        '/videoCalls/call-456/participants/0/name'
      )
    })

    it('should create recording options pointers', () => {
      const pointer = VideoStatePointer.recording('rec-123')
      expect(pointer.optionAudio()).toBe('/recordings/rec-123/options/audio')
      expect(pointer.optionQuality()).toBe('/recordings/rec-123/options/quality')
      expect(pointer.optionDuration()).toBe('/recordings/rec-123/options/duration')
    })
  })
})
