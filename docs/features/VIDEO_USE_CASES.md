# Video Use Cases

Real-world examples and complete implementations for common video scenarios using A2UI video components.

## Table of Contents

- [Screen Recording Use Cases](#screen-recording-use-cases)
- [Video Call Use Cases](#video-call-use-cases)
- [Video Generation Use Cases](#video-generation-use-cases)
- [Interactive Player Use Cases](#interactive-player-use-cases)
- [Multi-Component Workflows](#multi-component-workflows)
- [Advanced Scenarios](#advanced-scenarios)

---

## Screen Recording Use Cases

### Use Case 1: Bug Report Recording

**Scenario:** Users record their screen to demonstrate bugs with automatic AI analysis.

```typescript
import { A2UITransport } from '@ainative/ai-kit-a2ui-core/transport'
import type { VideoRecorderComponent } from '@ainative/ai-kit-a2ui-core/types'

class BugReportAgent {
  private transport: A2UITransport

  async createBugReportSession(issueId: string) {
    await this.transport.send({
      type: 'createSurface',
      surfaceId: `bug-${issueId}`,
      components: [
        // Header
        {
          id: 'header',
          type: 'card',
          properties: {
            title: 'Report a Bug',
            subtitle: 'Record your screen to show us what happened'
          }
        },

        // Bug description field
        {
          id: 'description',
          type: 'textField',
          properties: {
            label: 'Bug Description',
            placeholder: 'Describe what went wrong...',
            dataBinding: '/bugReport/description',
            required: true
          }
        },

        // Screen recorder with AI analysis
        {
          id: 'recorder',
          type: 'videoRecorder',
          properties: {
            mode: 'screen',
            audio: true,
            quality: 'medium',
            ai: {
              transcribe: true,      // Capture narration
              highlights: true,      // Detect error moments
              summary: false
            }
          }
        } as VideoRecorderComponent,

        // Instructions
        {
          id: 'instructions',
          type: 'text',
          properties: {
            value: '1. Click record\n2. Reproduce the bug\n3. Explain what you expected\n4. Stop recording',
            fontSize: 14,
            color: '#6b7280'
          }
        },

        // Submit button
        {
          id: 'submit',
          type: 'button',
          properties: {
            label: 'Submit Bug Report',
            action: 'submitBugReport',
            variant: 'primary',
            disabled: true,
            dataBinding: '/submitEnabled'
          }
        }
      ],
      dataModel: {
        issueId,
        bugReport: {
          description: '',
          videoUrl: null,
          transcript: null,
          highlights: []
        },
        submitEnabled: false
      }
    })

    // Handle recording completion
    this.transport.on('recordingComplete', async ({
      recordingId,
      videoUrl,
      transcript,
      highlights
    }) => {
      // Store recording data
      await this.transport.send({
        type: 'updateDataModel',
        surfaceId: `bug-${issueId}`,
        updates: [
          {
            path: '/bugReport/videoUrl',
            operation: 'set',
            value: videoUrl
          },
          {
            path: '/bugReport/transcript',
            operation: 'set',
            value: transcript
          },
          {
            path: '/bugReport/highlights',
            operation: 'set',
            value: highlights
          },
          {
            path: '/submitEnabled',
            operation: 'set',
            value: true
          }
        ]
      })

      // Show preview
      await this.transport.send({
        type: 'updateComponents',
        surfaceId: `bug-${issueId}`,
        updates: [{
          id: 'preview',
          operation: 'add',
          component: {
            id: 'preview',
            type: 'card',
            properties: {
              title: 'Recording Preview',
              subtitle: `${highlights?.length || 0} potential issues detected`
            },
            children: ['preview-player']
          }
        }, {
          id: 'preview-player',
          operation: 'add',
          component: {
            id: 'preview-player',
            type: 'video',
            properties: {
              src: videoUrl,
              controls: true
            }
          }
        }]
      })

      console.log(`Bug recording captured: ${highlights?.length} issues detected`)
    })
  }

  private async handleUserAction({ action, dataModel }: any) {
    if (action === 'submitBugReport') {
      const { issueId, bugReport } = dataModel

      // Submit to bug tracking system
      await this.submitBugReport(issueId, bugReport)

      // Show success message
      await this.transport.send({
        type: 'updateComponents',
        surfaceId: `bug-${issueId}`,
        updates: [{
          id: 'success',
          operation: 'add',
          component: {
            id: 'success',
            type: 'card',
            properties: {
              title: 'Bug Report Submitted',
              subtitle: 'Thank you for helping us improve!',
              backgroundColor: '#dcfce7'
            }
          }
        }]
      })
    }
  }

  private async submitBugReport(issueId: string, report: any) {
    // Implementation: Save to database, notify team, etc.
    console.log('Bug report submitted:', { issueId, report })
  }
}
```

### Use Case 2: Tutorial Creation

**Scenario:** Create tutorial videos with automatic transcription and chapter detection.

```typescript
class TutorialCreationAgent {
  async createTutorialRecorder(topicId: string) {
    await this.transport.send({
      type: 'createSurface',
      surfaceId: `tutorial-${topicId}`,
      components: [
        // Tutorial setup
        {
          id: 'setup-card',
          type: 'card',
          properties: {
            title: 'Create Tutorial',
            subtitle: 'Record your screen and we\'ll add chapters automatically'
          }
        },

        // Topic selection
        {
          id: 'topic',
          type: 'textField',
          properties: {
            label: 'Tutorial Topic',
            placeholder: 'e.g., "How to deploy a Next.js app"',
            dataBinding: '/tutorial/topic',
            required: true
          }
        },

        // Recording mode selector
        {
          id: 'mode-selector',
          type: 'choicePicker',
          properties: {
            label: 'Recording Mode',
            options: [
              { value: 'screen', label: 'Screen Only' },
              { value: 'camera', label: 'Camera Only' },
              { value: 'pip', label: 'Picture-in-Picture' }
            ],
            dataBinding: '/tutorial/mode',
            value: 'pip'
          }
        },

        // Recorder with full AI features
        {
          id: 'recorder',
          type: 'videoRecorder',
          properties: {
            mode: '{{/tutorial/mode}}',
            audio: true,
            quality: 'high',
            ai: {
              transcribe: true,
              highlights: true,
              summary: true
            }
          }
        } as VideoRecorderComponent
      ],
      dataModel: {
        topicId,
        tutorial: {
          topic: '',
          mode: 'pip',
          videoUrl: null,
          chapters: []
        }
      }
    })

    this.transport.on('recordingComplete', async ({
      videoUrl,
      duration,
      transcript,
      highlights
    }) => {
      // Generate chapters from highlights
      const chapters = this.generateChapters(highlights, duration)

      // Update data model
      await this.transport.send({
        type: 'updateDataModel',
        surfaceId: `tutorial-${topicId}`,
        updates: [
          {
            path: '/tutorial/videoUrl',
            operation: 'set',
            value: videoUrl
          },
          {
            path: '/tutorial/chapters',
            operation: 'set',
            value: chapters
          }
        ]
      })

      // Show editor
      await this.showTutorialEditor(topicId, videoUrl, chapters, transcript)
    })
  }

  private generateChapters(highlights: any[], duration: number) {
    // AI-based chapter detection from highlights
    return highlights
      .filter(h => h.confidence > 0.7)
      .map((h, i) => ({
        title: `Chapter ${i + 1}`,
        timestamp: h.timestamp,
        duration: highlights[i + 1]?.timestamp - h.timestamp || duration - h.timestamp
      }))
  }

  private async showTutorialEditor(
    topicId: string,
    videoUrl: string,
    chapters: any[],
    transcript: string
  ) {
    await this.transport.send({
      type: 'updateComponents',
      surfaceId: `tutorial-${topicId}`,
      updates: [
        {
          id: 'editor-card',
          operation: 'add',
          component: {
            id: 'editor-card',
            type: 'card',
            properties: {
              title: 'Edit Tutorial',
              subtitle: `${chapters.length} chapters detected`
            },
            children: ['player', 'chapters-list', 'transcript-view', 'publish-btn']
          }
        },
        {
          id: 'player',
          operation: 'add',
          component: {
            id: 'player',
            type: 'aiVideoPlayer',
            properties: {
              videoUrl,
              transcript,
              interactive: {
                smartChapters: true
              }
            }
          }
        },
        {
          id: 'chapters-list',
          operation: 'add',
          component: {
            id: 'chapters-list',
            type: 'list',
            properties: {
              items: chapters,
              itemTemplate: '{{title}} - {{timestamp}}s'
            }
          }
        },
        {
          id: 'transcript-view',
          operation: 'add',
          component: {
            id: 'transcript-view',
            type: 'text',
            properties: {
              value: transcript,
              fontSize: 14
            }
          }
        },
        {
          id: 'publish-btn',
          operation: 'add',
          component: {
            id: 'publish-btn',
            type: 'button',
            properties: {
              label: 'Publish Tutorial',
              action: 'publishTutorial',
              variant: 'primary'
            }
          }
        }
      ]
    })
  }
}
```

### Use Case 3: Demo Recording for Sales

**Scenario:** Sales team records product demos with automatic highlight detection.

```typescript
class SalesDemoAgent {
  async createDemoRecorder(prospectId: string, productId: string) {
    await this.transport.send({
      type: 'createSurface',
      surfaceId: `demo-${prospectId}`,
      components: [
        // Demo info
        {
          id: 'info',
          type: 'card',
          properties: {
            title: 'Record Product Demo',
            subtitle: 'Show your prospect the best features'
          }
        },

        // Feature checklist
        {
          id: 'features-label',
          type: 'text',
          properties: {
            value: 'Features to cover:',
            fontWeight: 'bold'
          }
        },
        {
          id: 'feature-1',
          type: 'checkBox',
          properties: {
            label: 'Dashboard overview',
            dataBinding: '/demo/features/dashboard'
          }
        },
        {
          id: 'feature-2',
          type: 'checkBox',
          properties: {
            label: 'Analytics & Reports',
            dataBinding: '/demo/features/analytics'
          }
        },
        {
          id: 'feature-3',
          type: 'checkBox',
          properties: {
            label: 'Integrations',
            dataBinding: '/demo/features/integrations'
          }
        },

        // Recorder
        {
          id: 'recorder',
          type: 'videoRecorder',
          properties: {
            mode: 'pip',
            audio: true,
            quality: 'high',
            ai: {
              transcribe: true,
              highlights: true,      // Detect feature demonstrations
              summary: true          // Auto-generate demo summary
            }
          }
        } as VideoRecorderComponent,

        // Recording tips
        {
          id: 'tips',
          type: 'text',
          properties: {
            value: 'Tips:\n• Smile and be enthusiastic\n• Speak clearly\n• Show real use cases\n• Keep it under 5 minutes',
            fontSize: 12,
            color: '#6b7280'
          }
        }
      ],
      dataModel: {
        prospectId,
        productId,
        demo: {
          features: {
            dashboard: false,
            analytics: false,
            integrations: false
          },
          videoUrl: null,
          highlights: [],
          summary: null
        }
      }
    })

    this.transport.on('recordingComplete', async ({
      videoUrl,
      duration,
      transcript,
      highlights,
      summary
    }) => {
      // Analyze which features were covered
      const featuresCovered = this.analyzeFeatureCoverage(transcript)

      // Update demo data
      await this.transport.send({
        type: 'updateDataModel',
        surfaceId: `demo-${prospectId}`,
        updates: [
          {
            path: '/demo/videoUrl',
            operation: 'set',
            value: videoUrl
          },
          {
            path: '/demo/highlights',
            operation: 'set',
            value: highlights
          },
          {
            path: '/demo/summary',
            operation: 'set',
            value: summary
          },
          {
            path: '/demo/featuresCovered',
            operation: 'set',
            value: featuresCovered
          }
        ]
      })

      // Show review screen
      await this.showDemoReview(prospectId, videoUrl, summary, featuresCovered)

      // Automatically send to prospect
      await this.sendDemoToProspect(prospectId, videoUrl, summary)
    })
  }

  private analyzeFeatureCoverage(transcript: string): string[] {
    // Simple keyword detection (could use AI for better analysis)
    const features = []
    if (transcript.toLowerCase().includes('dashboard')) features.push('dashboard')
    if (transcript.toLowerCase().includes('analytics')) features.push('analytics')
    if (transcript.toLowerCase().includes('integration')) features.push('integrations')
    return features
  }

  private async showDemoReview(
    prospectId: string,
    videoUrl: string,
    summary: string,
    featuresCovered: string[]
  ) {
    await this.transport.send({
      type: 'updateComponents',
      surfaceId: `demo-${prospectId}`,
      updates: [{
        id: 'review',
        operation: 'add',
        component: {
          id: 'review',
          type: 'card',
          properties: {
            title: 'Demo Recording Complete',
            subtitle: `Covered ${featuresCovered.length} features`
          },
          children: ['summary-text', 'features-covered', 'actions']
        }
      }, {
        id: 'summary-text',
        operation: 'add',
        component: {
          id: 'summary-text',
          type: 'text',
          properties: {
            value: summary,
            fontSize: 14
          }
        }
      }, {
        id: 'features-covered',
        operation: 'add',
        component: {
          id: 'features-covered',
          type: 'list',
          properties: {
            items: featuresCovered.map(f => ({ name: f })),
            itemTemplate: '✓ {{name}}'
          }
        }
      }, {
        id: 'actions',
        operation: 'add',
        component: {
          id: 'actions',
          type: 'row',
          properties: {
            gap: 8
          },
          children: ['re-record-btn', 'send-btn']
        }
      }, {
        id: 're-record-btn',
        operation: 'add',
        component: {
          id: 're-record-btn',
          type: 'button',
          properties: {
            label: 'Re-record',
            action: 'reRecord',
            variant: 'outline'
          }
        }
      }, {
        id: 'send-btn',
        operation: 'add',
        component: {
          id: 'send-btn',
          type: 'button',
          properties: {
            label: 'Send to Prospect',
            action: 'sendDemo',
            variant: 'primary'
          }
        }
      }]
    })
  }

  private async sendDemoToProspect(
    prospectId: string,
    videoUrl: string,
    summary: string
  ) {
    // Implementation: Send email, update CRM, etc.
    console.log(`Demo sent to prospect ${prospectId}:`, { videoUrl, summary })
  }
}
```

---

## Video Call Use Cases

### Use Case 4: Team Standup Meeting

**Scenario:** Daily team standup with AI-generated notes and action items.

```typescript
class StandupAgent {
  async startStandup(teamId: string, participants: string[]) {
    const callId = `standup-${Date.now()}`

    await this.transport.send({
      type: 'createSurface',
      surfaceId: `standup-${teamId}`,
      components: [
        // Meeting header
        {
          id: 'header',
          type: 'card',
          properties: {
            title: 'Daily Standup',
            subtitle: new Date().toLocaleDateString()
          }
        },

        // Video call with AI features
        {
          id: 'call',
          type: 'videoCall',
          properties: {
            roomId: `standup-${teamId}`,
            layout: 'grid',
            features: {
              chat: true,
              screenShare: true,
              recording: true
            },
            ai: {
              liveTranscription: true,
              liveCaptions: true,
              noiseCancellation: true
            }
          }
        },

        // Standup agenda
        {
          id: 'agenda',
          type: 'card',
          properties: {
            title: 'Standup Questions',
            subtitle: 'Cover these points'
          },
          children: ['q1', 'q2', 'q3']
        },
        {
          id: 'q1',
          type: 'text',
          properties: {
            value: '1. What did you complete yesterday?'
          }
        },
        {
          id: 'q2',
          type: 'text',
          properties: {
            value: '2. What are you working on today?'
          }
        },
        {
          id: 'q3',
          type: 'text',
          properties: {
            value: '3. Any blockers or help needed?'
          }
        },

        // Participant status
        {
          id: 'status',
          type: 'text',
          properties: {
            value: 'Waiting for participants...',
            dataBinding: '/call/status'
          }
        }
      ],
      dataModel: {
        teamId,
        callId,
        call: {
          status: 'Waiting for participants...',
          participants: [],
          transcript: '',
          actionItems: []
        }
      }
    })

    // Initiate call
    await this.transport.send({
      type: 'initiateVideoCall',
      surfaceId: `standup-${teamId}`,
      callId,
      roomId: `standup-${teamId}`,
      participants
    })

    // Track participants
    this.transport.on('videoCallJoined', async ({ participantId }) => {
      const participants = [...this.getParticipants(teamId), participantId]

      await this.transport.send({
        type: 'updateDataModel',
        surfaceId: `standup-${teamId}`,
        updates: [{
          path: '/call/status',
          operation: 'set',
          value: `${participants.length}/${participants.length} participants joined`
        }]
      })
    })

    // Process call end
    this.transport.on('videoCallEnded', async ({
      duration,
      transcript,
      summary,
      actionItems
    }) => {
      await this.createStandupSummary(teamId, {
        duration,
        transcript,
        summary,
        actionItems
      })
    })
  }

  private async createStandupSummary(
    teamId: string,
    data: {
      duration: number
      transcript: string
      summary: string
      actionItems: string[]
    }
  ) {
    await this.transport.send({
      type: 'updateComponents',
      surfaceId: `standup-${teamId}`,
      updates: [
        {
          id: 'call',
          operation: 'remove'
        },
        {
          id: 'summary-card',
          operation: 'add',
          component: {
            id: 'summary-card',
            type: 'card',
            properties: {
              title: 'Standup Summary',
              subtitle: `Duration: ${Math.floor(data.duration / 60)}m`
            },
            children: ['summary', 'actions', 'transcript-section']
          }
        },
        {
          id: 'summary',
          operation: 'add',
          component: {
            id: 'summary',
            type: 'text',
            properties: {
              value: data.summary,
              fontSize: 14
            }
          }
        },
        {
          id: 'actions',
          operation: 'add',
          component: {
            id: 'actions',
            type: 'card',
            properties: {
              title: 'Action Items',
              subtitle: `${data.actionItems.length} items`
            },
            children: ['actions-list']
          }
        },
        {
          id: 'actions-list',
          operation: 'add',
          component: {
            id: 'actions-list',
            type: 'list',
            properties: {
              items: data.actionItems.map(item => ({ text: item })),
              itemTemplate: '☐ {{text}}'
            }
          }
        },
        {
          id: 'transcript-section',
          operation: 'add',
          component: {
            id: 'transcript-section',
            type: 'card',
            properties: {
              title: 'Full Transcript',
              subtitle: 'Click to expand'
            },
            children: ['transcript']
          }
        },
        {
          id: 'transcript',
          operation: 'add',
          component: {
            id: 'transcript',
            type: 'text',
            properties: {
              value: data.transcript,
              fontSize: 12,
              color: '#6b7280'
            }
          }
        }
      ]
    })

    // Save to database, send to team, update project management tool, etc.
    await this.saveStandupNotes(teamId, data)
  }

  private async saveStandupNotes(teamId: string, data: any) {
    console.log('Standup notes saved:', { teamId, data })
  }

  private getParticipants(teamId: string): string[] {
    // Implementation
    return []
  }
}
```

### Use Case 5: Customer Support Video Call

**Scenario:** Support agent helps customer via video with screen sharing.

```typescript
class SupportCallAgent {
  async startSupportCall(ticketId: string, customerId: string, agentId: string) {
    const callId = `support-${ticketId}`

    await this.transport.send({
      type: 'createSurface',
      surfaceId: `support-${ticketId}`,
      components: [
        // Ticket info
        {
          id: 'ticket-info',
          type: 'card',
          properties: {
            title: `Support Call - Ticket #${ticketId}`,
            subtitle: 'Video call with customer'
          }
        },

        // Video call
        {
          id: 'call',
          type: 'videoCall',
          properties: {
            roomId: callId,
            layout: 'sidebar',  // Show screen share prominently
            features: {
              chat: true,
              screenShare: true,
              recording: true
            },
            ai: {
              liveTranscription: true,
              noiseCancellation: true
            }
          }
        },

        // Quick actions
        {
          id: 'actions',
          type: 'row',
          properties: {
            gap: 8
          },
          children: ['share-screen-btn', 'send-link-btn', 'escalate-btn']
        },
        {
          id: 'share-screen-btn',
          type: 'button',
          properties: {
            label: 'Share Screen',
            action: 'shareScreen',
            variant: 'outline'
          }
        },
        {
          id: 'send-link-btn',
          type: 'button',
          properties: {
            label: 'Send Link',
            action: 'sendLink',
            variant: 'outline'
          }
        },
        {
          id: 'escalate-btn',
          type: 'button',
          properties: {
            label: 'Escalate',
            action: 'escalate',
            variant: 'outline'
          }
        },

        // Notes field
        {
          id: 'notes',
          type: 'textField',
          properties: {
            label: 'Call Notes',
            placeholder: 'Take notes during the call...',
            dataBinding: '/call/notes'
          }
        }
      ],
      dataModel: {
        ticketId,
        customerId,
        agentId,
        call: {
          notes: '',
          duration: 0,
          resolution: null
        }
      }
    })

    this.transport.on('videoCallEnded', async ({
      duration,
      transcript,
      summary
    }) => {
      await this.closeSupportTicket(ticketId, {
        duration,
        transcript,
        summary,
        resolution: 'resolved'  // Could be set by agent
      })
    })
  }

  private async closeSupportTicket(ticketId: string, data: any) {
    // Update ticket in support system
    console.log(`Ticket ${ticketId} closed:`, data)

    // Show completion message
    await this.transport.send({
      type: 'updateComponents',
      surfaceId: `support-${ticketId}`,
      updates: [{
        id: 'completion',
        operation: 'add',
        component: {
          id: 'completion',
          type: 'card',
          properties: {
            title: 'Call Complete',
            subtitle: 'Ticket has been updated',
            backgroundColor: '#dcfce7'
          }
        }
      }]
    })
  }
}
```

---

## Video Generation Use Cases

### Use Case 6: Automated Product Video

**Scenario:** Generate product announcement videos from structured data.

```typescript
class ProductVideoAgent {
  async generateProductVideo(productData: {
    name: string
    tagline: string
    features: string[]
    price: string
    launchDate: string
  }) {
    const videoId = `product-${Date.now()}`

    await this.transport.send({
      type: 'createSurface',
      surfaceId: `video-gen-${videoId}`,
      components: [
        {
          id: 'header',
          type: 'card',
          properties: {
            title: 'Generate Product Video',
            subtitle: productData.name
          }
        },

        // AI video generator
        {
          id: 'generator',
          type: 'aiVideo',
          properties: {
            template: 'product-announcement',
            data: {
              productName: productData.name,
              tagline: productData.tagline,
              features: productData.features,
              price: productData.price,
              launchDate: productData.launchDate,
              style: 'modern-tech',
              duration: 30  // 30 second video
            },
            voice: 'professional-female',
            streaming: true
          }
        },

        // Progress indicator
        {
          id: 'progress-card',
          type: 'card',
          properties: {
            title: 'Generating Video',
            subtitle: 'This may take a few minutes...'
          },
          children: ['progress-text', 'preview']
        },
        {
          id: 'progress-text',
          type: 'text',
          properties: {
            value: '0% complete',
            dataBinding: '/generation/progressText',
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        {
          id: 'preview',
          type: 'image',
          properties: {
            src: '',
            dataBinding: '/generation/previewFrame',
            alt: 'Video preview',
            width: '100%'
          }
        }
      ],
      dataModel: {
        videoId,
        generation: {
          progress: 0,
          progressText: '0% complete',
          previewFrame: '',
          status: 'generating'
        }
      }
    })

    // Request generation
    await this.transport.send({
      type: 'generateVideo',
      surfaceId: `video-gen-${videoId}`,
      videoId,
      prompt: `Create a product announcement video for ${productData.name}`,
      data: productData,
      template: 'product-announcement'
    })

    // Handle progress
    this.transport.on('videoGenerationProgress', async ({
      videoId: vid,
      progress,
      frame
    }) => {
      if (vid !== videoId) return

      await this.transport.send({
        type: 'updateDataModel',
        surfaceId: `video-gen-${videoId}`,
        updates: [
          {
            path: '/generation/progress',
            operation: 'set',
            value: progress
          },
          {
            path: '/generation/progressText',
            operation: 'set',
            value: `${progress}% complete`
          },
          {
            path: '/generation/previewFrame',
            operation: 'set',
            value: frame || ''
          }
        ]
      })
    })

    // Handle completion
    this.transport.on('videoGenerationComplete', async ({
      videoId: vid,
      videoUrl,
      composition
    }) => {
      if (vid !== videoId) return

      await this.showGeneratedVideo(videoId, videoUrl, composition)
    })
  }

  private async showGeneratedVideo(
    videoId: string,
    videoUrl: string,
    composition: any
  ) {
    await this.transport.send({
      type: 'updateComponents',
      surfaceId: `video-gen-${videoId}`,
      updates: [
        {
          id: 'generator',
          operation: 'remove'
        },
        {
          id: 'progress-card',
          operation: 'remove'
        },
        {
          id: 'result-card',
          operation: 'add',
          component: {
            id: 'result-card',
            type: 'card',
            properties: {
              title: 'Video Generated Successfully!',
              subtitle: 'Your product video is ready'
            },
            children: ['player', 'actions']
          }
        },
        {
          id: 'player',
          operation: 'add',
          component: {
            id: 'player',
            type: 'aiVideoPlayer',
            properties: {
              videoUrl
            }
          }
        },
        {
          id: 'actions',
          operation: 'add',
          component: {
            id: 'actions',
            type: 'row',
            properties: {
              gap: 8
            },
            children: ['download-btn', 'regenerate-btn', 'share-btn']
          }
        },
        {
          id: 'download-btn',
          operation: 'add',
          component: {
            id: 'download-btn',
            type: 'button',
            properties: {
              label: 'Download',
              action: 'download',
              variant: 'primary'
            }
          }
        },
        {
          id: 'regenerate-btn',
          operation: 'add',
          component: {
            id: 'regenerate-btn',
            type: 'button',
            properties: {
              label: 'Regenerate',
              action: 'regenerate',
              variant: 'outline'
            }
          }
        },
        {
          id: 'share-btn',
          operation: 'add',
          component: {
            id: 'share-btn',
            type: 'button',
            properties: {
              label: 'Share',
              action: 'share',
              variant: 'outline'
            }
          }
        }
      ]
    })

    console.log('Video generated:', { videoId, videoUrl })
  }
}
```

---

## Interactive Player Use Cases

### Use Case 7: Educational Video Platform

**Scenario:** Interactive learning videos with AI Q&A.

```typescript
class EducationAgent {
  async createLessonPlayer(lessonId: string, videoUrl: string, transcript: string) {
    await this.transport.send({
      type: 'createSurface',
      surfaceId: `lesson-${lessonId}`,
      components: [
        // Lesson header
        {
          id: 'header',
          type: 'card',
          properties: {
            title: 'Lesson: Introduction to React',
            subtitle: 'Interactive video lesson'
          }
        },

        // Interactive player
        {
          id: 'player',
          type: 'aiVideoPlayer',
          properties: {
            videoUrl,
            transcript,
            interactive: {
              allowQuestions: true,           // Students can ask questions
              conversationalControl: true,     // "Skip to hooks section"
              smartChapters: true             // AI-generated chapters
            }
          }
        },

        // Question input
        {
          id: 'question-card',
          type: 'card',
          properties: {
            title: 'Ask a Question',
            subtitle: 'Ask about anything in this lesson'
          },
          children: ['question-input', 'ask-btn']
        },
        {
          id: 'question-input',
          type: 'textField',
          properties: {
            placeholder: 'What would you like to know?',
            dataBinding: '/lesson/question'
          }
        },
        {
          id: 'ask-btn',
          type: 'button',
          properties: {
            label: 'Ask',
            action: 'askQuestion',
            variant: 'primary'
          }
        },

        // Notes section
        {
          id: 'notes-card',
          type: 'card',
          properties: {
            title: 'Your Notes',
            subtitle: 'Take notes as you learn'
          },
          children: ['notes-input']
        },
        {
          id: 'notes-input',
          type: 'textField',
          properties: {
            placeholder: 'Write your notes here...',
            dataBinding: '/lesson/notes'
          }
        }
      ],
      dataModel: {
        lessonId,
        lesson: {
          question: '',
          notes: '',
          completionRate: 0
        }
      }
    })

    // Handle questions
    this.transport.on('userAction', async ({ action, dataModel }) => {
      if (action === 'askQuestion') {
        const { question } = dataModel.lesson

        // Get AI answer based on transcript
        const answer = await this.answerQuestion(question, transcript)

        // Show answer
        await this.transport.send({
          type: 'updateComponents',
          surfaceId: `lesson-${lessonId}`,
          updates: [{
            id: 'answer',
            operation: 'add',
            component: {
              id: 'answer',
              type: 'card',
              properties: {
                title: 'Answer',
                subtitle: question,
                backgroundColor: '#dbeafe'
              },
              children: ['answer-text']
            }
          }, {
            id: 'answer-text',
            operation: 'add',
            component: {
              id: 'answer-text',
              type: 'text',
              properties: {
                value: answer,
                fontSize: 14
              }
            }
          }]
        })

        // Clear question
        await this.transport.send({
          type: 'updateDataModel',
          surfaceId: `lesson-${lessonId}`,
          updates: [{
            path: '/lesson/question',
            operation: 'set',
            value: ''
          }]
        })
      }
    })
  }

  private async answerQuestion(question: string, transcript: string): Promise<string> {
    // Use AI to answer based on video content
    // This is a simplified example
    return `Based on the lesson, ${question.toLowerCase()} is covered in the video...`
  }
}
```

---

## Multi-Component Workflows

### Use Case 8: Complete Video Production Pipeline

**Scenario:** Record, edit, generate variations, and publish videos.

```typescript
class VideoProductionAgent {
  async startProductionPipeline(projectId: string) {
    await this.transport.send({
      type: 'createSurface',
      surfaceId: `production-${projectId}`,
      components: [
        // Pipeline stages
        {
          id: 'pipeline',
          type: 'tabs',
          properties: {
            tabs: [
              { id: 'record', label: 'Record' },
              { id: 'edit', label: 'Edit' },
              { id: 'generate', label: 'Generate Variations' },
              { id: 'publish', label: 'Publish' }
            ],
            activeTab: 'record'
          }
        },

        // Record tab
        {
          id: 'record-tab',
          type: 'column',
          properties: {},
          children: ['recorder', 'record-btn']
        },
        {
          id: 'recorder',
          type: 'videoRecorder',
          properties: {
            mode: 'pip',
            audio: true,
            quality: 'high',
            ai: {
              transcribe: true,
              highlights: true,
              summary: true
            }
          }
        },
        {
          id: 'record-btn',
          type: 'button',
          properties: {
            label: 'Start Recording',
            action: 'startRecording',
            variant: 'primary'
          }
        }
      ],
      dataModel: {
        projectId,
        pipeline: {
          stage: 'record',
          originalVideo: null,
          editedVideo: null,
          variations: [],
          published: false
        }
      }
    })

    // Handle recording complete
    this.transport.on('recordingComplete', async ({ videoUrl, transcript }) => {
      await this.transport.send({
        type: 'updateDataModel',
        surfaceId: `production-${projectId}`,
        updates: [
          {
            path: '/pipeline/originalVideo',
            operation: 'set',
            value: videoUrl
          },
          {
            path: '/pipeline/transcript',
            operation: 'set',
            value: transcript
          },
          {
            path: '/pipeline/stage',
            operation: 'set',
            value: 'edit'
          }
        ]
      })

      // Switch to edit tab
      await this.showEditTab(projectId, videoUrl, transcript)
    })
  }

  private async showEditTab(projectId: string, videoUrl: string, transcript: string) {
    await this.transport.send({
      type: 'updateComponents',
      surfaceId: `production-${projectId}`,
      updates: [
        {
          id: 'pipeline',
          operation: 'update',
          component: {
            id: 'pipeline',
            type: 'tabs',
            properties: {
              tabs: [
                { id: 'record', label: 'Record' },
                { id: 'edit', label: 'Edit' },
                { id: 'generate', label: 'Generate Variations' },
                { id: 'publish', label: 'Publish' }
              ],
              activeTab: 'edit'
            }
          }
        },
        // Add edit UI components...
      ]
    })
  }
}
```

---

## Advanced Scenarios

### Use Case 9: AI-Powered Video Analytics Dashboard

**Scenario:** Dashboard showing video metrics with AI insights.

```typescript
class VideoAnalyticsAgent {
  async createAnalyticsDashboard(userId: string) {
    await this.transport.send({
      type: 'createSurface',
      surfaceId: `analytics-${userId}`,
      components: [
        // Dashboard header
        {
          id: 'header',
          type: 'card',
          properties: {
            title: 'Video Analytics',
            subtitle: 'AI-powered insights'
          }
        },

        // Metrics row
        {
          id: 'metrics',
          type: 'row',
          properties: {
            gap: 16
          },
          children: ['metric-1', 'metric-2', 'metric-3', 'metric-4']
        },
        {
          id: 'metric-1',
          type: 'card',
          properties: {
            title: 'Total Videos',
            subtitle: '{{/analytics/totalVideos}}'
          }
        },
        {
          id: 'metric-2',
          type: 'card',
          properties: {
            title: 'Total Duration',
            subtitle: '{{/analytics/totalDuration}}h'
          }
        },
        {
          id: 'metric-3',
          type: 'card',
          properties: {
            title: 'Avg Engagement',
            subtitle: '{{/analytics/avgEngagement}}%'
          }
        },
        {
          id: 'metric-4',
          type: 'card',
          properties: {
            title: 'AI Insights',
            subtitle: '{{/analytics/insightsCount}}'
          }
        },

        // Recent videos
        {
          id: 'recent-card',
          type: 'card',
          properties: {
            title: 'Recent Videos',
            subtitle: 'Your latest recordings'
          },
          children: ['recent-list']
        },
        {
          id: 'recent-list',
          type: 'list',
          properties: {
            items: [],
            dataBinding: '/analytics/recentVideos',
            itemTemplate: '{{title}} - {{duration}}s'
          }
        }
      ],
      dataModel: {
        userId,
        analytics: {
          totalVideos: 0,
          totalDuration: 0,
          avgEngagement: 0,
          insightsCount: 0,
          recentVideos: []
        }
      }
    })

    // Load analytics data
    await this.loadAnalytics(userId)
  }

  private async loadAnalytics(userId: string) {
    // Fetch from database
    const data = await this.fetchAnalyticsData(userId)

    await this.transport.send({
      type: 'updateDataModel',
      surfaceId: `analytics-${userId}`,
      updates: [
        {
          path: '/analytics',
          operation: 'set',
          value: data
        }
      ]
    })
  }

  private async fetchAnalyticsData(userId: string): Promise<any> {
    // Implementation
    return {
      totalVideos: 42,
      totalDuration: 12.5,
      avgEngagement: 78,
      insightsCount: 156,
      recentVideos: [
        { title: 'Product Demo', duration: 180 },
        { title: 'Team Meeting', duration: 1200 },
        { title: 'Tutorial', duration: 420 }
      ]
    }
  }
}
```

---

## See Also

- [Video Components API](../api/VIDEO_COMPONENTS.md) - Complete API reference
- [Integration Patterns](../api/VIDEO_INTEGRATION_PATTERNS.md) - Implementation patterns
- [Video Protocol PRD](../planning/video-protocol-prd.md) - Technical specification
