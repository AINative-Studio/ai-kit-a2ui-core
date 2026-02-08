/**
 * Video Call Message Types Tests
 * Tests for Issue #12: Video call message type definitions
 */

import { describe, it, expect } from 'vitest'
import type {
  InitiateVideoCallMessage,
  VideoCallJoinedMessage,
  VideoCallEndedMessage,
  VideoCallParticipant,
  VideoMessage,
} from '../../src/types/video-protocol.js'
import {
  isInitiateVideoCallMessage,
  isVideoCallJoinedMessage,
  isVideoCallEndedMessage,
} from '../../src/types/video-protocol.js'

describe('Video Call Message Types', () => {
  describe('InitiateVideoCallMessage', () => {
    describe('when creating an initiate video call message', () => {
      it('should have all required properties', () => {
        const message: InitiateVideoCallMessage = {
          type: 'initiateVideoCall',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          roomId: 'room-456',
        }

        expect(message.type).toBe('initiateVideoCall')
        expect(message.surfaceId).toBe('video-surface-1')
        expect(message.callId).toBe('call-123')
        expect(message.roomId).toBe('room-456')
      })

      it('should support optional participants array', () => {
        const message: InitiateVideoCallMessage = {
          type: 'initiateVideoCall',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          roomId: 'room-456',
          participants: ['user-1', 'user-2', 'user-3'],
        }

        expect(message.participants).toHaveLength(3)
        expect(message.participants).toContain('user-1')
      })

      it('should support optional message id', () => {
        const message: InitiateVideoCallMessage = {
          type: 'initiateVideoCall',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          roomId: 'room-456',
          id: 'msg-001',
        }

        expect(message.id).toBe('msg-001')
      })

      it('should support optional timestamp', () => {
        const timestamp = Date.now()
        const message: InitiateVideoCallMessage = {
          type: 'initiateVideoCall',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          roomId: 'room-456',
          timestamp,
        }

        expect(message.timestamp).toBe(timestamp)
      })
    })

    describe('when using type guard', () => {
      it('should identify initiateVideoCall messages', () => {
        const message: VideoMessage = {
          type: 'initiateVideoCall',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          roomId: 'room-456',
        }

        expect(isInitiateVideoCallMessage(message)).toBe(true)
      })

      it('should reject other message types', () => {
        const message: VideoMessage = {
          type: 'generateVideo',
          surfaceId: 'surface-1',
          videoId: 'video-1',
          prompt: 'test',
        }

        expect(isInitiateVideoCallMessage(message)).toBe(false)
      })

      it('should reject videoCallJoined messages', () => {
        const message: VideoMessage = {
          type: 'videoCallJoined',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          participantId: 'user-1',
          timestamp: '2026-02-08T10:00:00Z',
        }

        expect(isInitiateVideoCallMessage(message)).toBe(false)
      })
    })
  })

  describe('VideoCallJoinedMessage', () => {
    describe('when creating a video call joined message', () => {
      it('should have all required properties', () => {
        const message: VideoCallJoinedMessage = {
          type: 'videoCallJoined',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          participantId: 'user-1',
          timestamp: '2026-02-08T10:00:00Z',
        }

        expect(message.type).toBe('videoCallJoined')
        expect(message.surfaceId).toBe('video-surface-1')
        expect(message.callId).toBe('call-123')
        expect(message.participantId).toBe('user-1')
        expect(message.timestamp).toBe('2026-02-08T10:00:00Z')
      })

      it('should support optional participant details', () => {
        const participant: VideoCallParticipant = {
          id: 'user-1',
          name: 'Alice Johnson',
          role: 'host',
          isMuted: false,
          isVideoEnabled: true,
        }

        const message: VideoCallJoinedMessage = {
          type: 'videoCallJoined',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          participantId: 'user-1',
          timestamp: '2026-02-08T10:00:00Z',
          participant,
        }

        expect(message.participant).toBeDefined()
        expect(message.participant?.name).toBe('Alice Johnson')
        expect(message.participant?.role).toBe('host')
      })

      it('should support optional message id', () => {
        const message: VideoCallJoinedMessage = {
          type: 'videoCallJoined',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          participantId: 'user-1',
          timestamp: '2026-02-08T10:00:00Z',
          id: 'msg-002',
        }

        expect(message.id).toBe('msg-002')
      })
    })

    describe('when using type guard', () => {
      it('should identify videoCallJoined messages', () => {
        const message: VideoMessage = {
          type: 'videoCallJoined',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          participantId: 'user-1',
          timestamp: '2026-02-08T10:00:00Z',
        }

        expect(isVideoCallJoinedMessage(message)).toBe(true)
      })

      it('should reject other message types', () => {
        const message: VideoMessage = {
          type: 'generateVideo',
          surfaceId: 'surface-1',
          videoId: 'video-1',
          prompt: 'test',
        }

        expect(isVideoCallJoinedMessage(message)).toBe(false)
      })

      it('should reject initiateVideoCall messages', () => {
        const message: VideoMessage = {
          type: 'initiateVideoCall',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          roomId: 'room-456',
        }

        expect(isVideoCallJoinedMessage(message)).toBe(false)
      })
    })
  })

  describe('VideoCallEndedMessage', () => {
    describe('when creating a video call ended message', () => {
      it('should have all required properties', () => {
        const message: VideoCallEndedMessage = {
          type: 'videoCallEnded',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          duration: 1800,
        }

        expect(message.type).toBe('videoCallEnded')
        expect(message.surfaceId).toBe('video-surface-1')
        expect(message.callId).toBe('call-123')
        expect(message.duration).toBe(1800)
      })

      it('should support optional transcript', () => {
        const message: VideoCallEndedMessage = {
          type: 'videoCallEnded',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          duration: 1800,
          transcript: 'Full meeting transcript here...',
        }

        expect(message.transcript).toBeDefined()
        expect(message.transcript).toContain('meeting transcript')
      })

      it('should support optional summary', () => {
        const message: VideoCallEndedMessage = {
          type: 'videoCallEnded',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          duration: 1800,
          summary: 'Discussed Q1 goals and team roadmap',
        }

        expect(message.summary).toBeDefined()
        expect(message.summary).toContain('Q1 goals')
      })

      it('should support optional action items array', () => {
        const message: VideoCallEndedMessage = {
          type: 'videoCallEnded',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          duration: 1800,
          actionItems: [
            'Complete Q1 planning document',
            'Schedule follow-up meeting',
            'Send updated roadmap to stakeholders',
          ],
        }

        expect(message.actionItems).toHaveLength(3)
        expect(message.actionItems).toContain('Complete Q1 planning document')
      })

      it('should support optional participants list', () => {
        const participants: VideoCallParticipant[] = [
          {
            id: 'user-1',
            name: 'Alice Johnson',
            role: 'host',
            isMuted: false,
            isVideoEnabled: true,
          },
          {
            id: 'user-2',
            name: 'Bob Smith',
            role: 'participant',
            isMuted: true,
            isVideoEnabled: false,
          },
        ]

        const message: A2UIVideoCallEnded = {
          type: 'videoCallEnded',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          duration: 1800,
          participants,
        }

        expect(message.participants).toHaveLength(2)
        expect(message.participants?.[0].name).toBe('Alice Johnson')
        expect(message.participants?.[1].name).toBe('Bob Smith')
      })

      it('should support all optional fields together', () => {
        const message: A2UIVideoCallEnded = {
          type: 'videoCallEnded',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          duration: 1800,
          id: 'msg-003',
          timestamp: Date.now(),
          transcript: 'Full transcript...',
          summary: 'Meeting summary...',
          actionItems: ['Action 1', 'Action 2'],
          participants: [
            {
              id: 'user-1',
              name: 'Alice Johnson',
              role: 'host',
              isMuted: false,
              isVideoEnabled: true,
            },
          ],
        }

        expect(message.id).toBe('msg-003')
        expect(message.timestamp).toBeDefined()
        expect(message.transcript).toBeDefined()
        expect(message.summary).toBeDefined()
        expect(message.actionItems).toHaveLength(2)
        expect(message.participants).toHaveLength(1)
      })
    })

    describe('when using type guard', () => {
      it('should identify videoCallEnded messages', () => {
        const message: VideoMessage = {
          type: 'videoCallEnded',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          duration: 1800,
        }

        expect(isVideoCallEndedMessage(message)).toBe(true)
      })

      it('should reject other message types', () => {
        const message: VideoMessage = {
          type: 'generateVideo',
          surfaceId: 'surface-1',
          videoId: 'video-1',
          prompt: 'test',
        }

        expect(isVideoCallEndedMessage(message)).toBe(false)
      })

      it('should reject videoCallJoined messages', () => {
        const message: VideoMessage = {
          type: 'videoCallJoined',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          participantId: 'user-1',
          timestamp: '2026-02-08T10:00:00Z',
        }

        expect(isVideoCallEndedMessage(message)).toBe(false)
      })
    })
  })

  describe('VideoCallParticipant', () => {
    describe('when creating participant objects', () => {
      it('should support all required fields', () => {
        const participant: VideoCallParticipant = {
          id: 'user-1',
          name: 'Alice Johnson',
          role: 'host',
          isMuted: false,
          isVideoEnabled: true,
        }

        expect(participant.id).toBe('user-1')
        expect(participant.name).toBe('Alice Johnson')
        expect(participant.role).toBe('host')
        expect(participant.isMuted).toBe(false)
        expect(participant.isVideoEnabled).toBe(true)
      })

      it('should support participant role', () => {
        const participant: VideoCallParticipant = {
          id: 'user-2',
          name: 'Bob Smith',
          role: 'participant',
          isMuted: true,
          isVideoEnabled: false,
        }

        expect(participant.role).toBe('participant')
      })

      it('should support optional avatar URL', () => {
        const participant: VideoCallParticipant = {
          id: 'user-1',
          name: 'Alice Johnson',
          role: 'host',
          isMuted: false,
          isVideoEnabled: true,
          avatarUrl: 'https://example.com/avatar.jpg',
        }

        expect(participant.avatarUrl).toBe('https://example.com/avatar.jpg')
      })

      it('should support optional join timestamp', () => {
        const joinTime = '2026-02-08T10:00:00Z'
        const participant: VideoCallParticipant = {
          id: 'user-1',
          name: 'Alice Johnson',
          role: 'host',
          isMuted: false,
          isVideoEnabled: true,
          joinedAt: joinTime,
        }

        expect(participant.joinedAt).toBe(joinTime)
      })
    })
  })

  describe('Message Integration', () => {
    describe('when messages are part of VideoMessage union', () => {
      it('should allow initiateVideoCall in message union', () => {
        const message: VideoMessage = {
          type: 'initiateVideoCall',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          roomId: 'room-456',
        }

        expect(message.type).toBe('initiateVideoCall')
      })

      it('should allow videoCallJoined in message union', () => {
        const message: VideoMessage = {
          type: 'videoCallJoined',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          participantId: 'user-1',
          timestamp: '2026-02-08T10:00:00Z',
        }

        expect(message.type).toBe('videoCallJoined')
      })

      it('should allow videoCallEnded in message union', () => {
        const message: VideoMessage = {
          type: 'videoCallEnded',
          surfaceId: 'video-surface-1',
          callId: 'call-123',
          duration: 1800,
        }

        expect(message.type).toBe('videoCallEnded')
      })
    })
  })

  describe('Real-world Scenarios', () => {
    describe('complete video call flow', () => {
      it('should handle full call lifecycle', () => {
        // Agent initiates call
        const initiateMessage: InitiateVideoCallMessage = {
          type: 'initiateVideoCall',
          surfaceId: 'meeting-room',
          callId: 'call-001',
          roomId: 'room-abc123',
          participants: ['alice@example.com', 'bob@example.com'],
          id: 'msg-init-001',
          timestamp: 1707390000000,
        }

        expect(isInitiateVideoCallMessage(initiateMessage)).toBe(true)

        // User joins call
        const joinedMessage: VideoCallJoinedMessage = {
          type: 'videoCallJoined',
          surfaceId: 'meeting-room',
          callId: 'call-001',
          participantId: 'alice@example.com',
          timestamp: '2026-02-08T10:00:30Z',
          participant: {
            id: 'alice@example.com',
            name: 'Alice Johnson',
            role: 'host',
            isMuted: false,
            isVideoEnabled: true,
            avatarUrl: 'https://example.com/alice.jpg',
            joinedAt: '2026-02-08T10:00:30Z',
          },
          id: 'msg-join-001',
        }

        expect(isVideoCallJoinedMessage(joinedMessage)).toBe(true)

        // Call ends with metadata
        const endedMessage: VideoCallEndedMessage = {
          type: 'videoCallEnded',
          surfaceId: 'meeting-room',
          callId: 'call-001',
          duration: 1800,
          transcript: 'Alice: Hello everyone...\nBob: Hi Alice...',
          summary: 'Team discussed Q1 objectives and sprint planning',
          actionItems: [
            'Alice to finalize Q1 roadmap',
            'Bob to update sprint backlog',
            'Schedule follow-up next week',
          ],
          participants: [
            {
              id: 'alice@example.com',
              name: 'Alice Johnson',
              role: 'host',
              isMuted: false,
              isVideoEnabled: true,
            },
            {
              id: 'bob@example.com',
              name: 'Bob Smith',
              role: 'participant',
              isMuted: false,
              isVideoEnabled: true,
            },
          ],
          id: 'msg-end-001',
          timestamp: 1707391800000,
        }

        expect(isVideoCallEndedMessage(endedMessage)).toBe(true)
        expect(endedMessage.participants).toHaveLength(2)
        expect(endedMessage.actionItems).toHaveLength(3)
      })
    })

    describe('participant management scenarios', () => {
      it('should handle host with full permissions', () => {
        const host: VideoCallParticipant = {
          id: 'host-1',
          name: 'Meeting Host',
          role: 'host',
          isMuted: false,
          isVideoEnabled: true,
          avatarUrl: 'https://example.com/host.jpg',
          joinedAt: '2026-02-08T10:00:00Z',
        }

        expect(host.role).toBe('host')
        expect(host.isVideoEnabled).toBe(true)
      })

      it('should handle participant with restricted state', () => {
        const participant: VideoCallParticipant = {
          id: 'participant-1',
          name: 'Regular User',
          role: 'participant',
          isMuted: true,
          isVideoEnabled: false,
        }

        expect(participant.role).toBe('participant')
        expect(participant.isMuted).toBe(true)
        expect(participant.isVideoEnabled).toBe(false)
      })
    })
  })
})
