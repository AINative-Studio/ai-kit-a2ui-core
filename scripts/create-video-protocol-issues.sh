#!/bin/bash
# Create all 32 GitHub issues for video protocol implementation

REPO="AINative-Studio/ai-kit-a2ui-core"

echo "Creating Epic 1: Video Protocol Extension issues..."

# Issue 1: Video component types (5 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Define video component types" \
  --label "epic:video-protocol,phase:type-definitions,P0,type:feature" \
  --body "## Epic 1: Video Protocol Extension
## Story: Video Component Type Definitions

### Description
As an A2UI agent developer, I want video component type definitions so I can include video in surfaces.

### Acceptance Criteria
- [ ] TypeScript definitions for all 4 video component types
- [ ] Extends existing ComponentType union
- [ ] Complete property schemas for each type
- [ ] Validation schemas included
- [ ] All types exported

### Story Points: 5

### Dependencies
- Core package v0.1.0 ✅

See: docs/planning/AIKIT_VIDEO_INTEGRATION_REQUIREMENTS.md"

# Issue 2: Component validation schemas (3 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Create component validation schemas" \
  --label "epic:video-protocol,phase:type-definitions,P0,type:feature" \
  --body "## Epic 1: Video Protocol Extension
## Story: Component Validation Schemas

### Description
As an A2UI renderer developer, I want component schemas so I can validate video components.

### Acceptance Criteria
- [ ] JSON Schema for each video component type
- [ ] Property validation rules
- [ ] Default values defined
- [ ] Comprehensive test coverage

### Story Points: 3

### Dependencies
- Issue #1"

# Issue 3: Documentation examples (3 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Add video component documentation examples" \
  --label "epic:video-protocol,phase:type-definitions,P1,type:docs" \
  --body "## Epic 1: Video Protocol Extension
## Story: Video Component Documentation

### Description
As an A2UI developer, I want video examples in docs so I understand the API.

### Acceptance Criteria
- [ ] Code examples for each component type
- [ ] Common use case examples
- [ ] Integration patterns documented
- [ ] API reference complete

### Story Points: 3

### Dependencies
- Issue #1"

# Issue 4: Recording message types (3 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Define recording message types" \
  --label "epic:video-protocol,phase:type-definitions,P0,type:feature" \
  --body "## Epic 1: Video Protocol Extension
## Story: Recording Message Types

### Description
As an A2UI protocol implementer, I want recording message types so agents can request recordings.

### Acceptance Criteria
- [ ] A2UIRequestRecording message type defined
- [ ] A2UIRecordingStarted message type defined
- [ ] A2UIRecordingComplete message type defined
- [ ] TypeScript types exported

### Story Points: 3"

# Issue 5: Video call message types (3 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Define video call message types" \
  --label "epic:video-protocol,phase:type-definitions,P0,type:feature" \
  --body "## Epic 1: Video Protocol Extension
## Story: Video Call Message Types

### Description
As an A2UI protocol implementer, I want video call message types so agents can initiate calls.

### Acceptance Criteria
- [ ] A2UIInitiateVideoCall message type defined
- [ ] A2UIVideoCallJoined message type defined
- [ ] A2UIVideoCallEnded message type defined
- [ ] Participant management included

### Story Points: 3"

# Issue 6: Generation message types (3 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Define video generation message types" \
  --label "epic:video-protocol,phase:type-definitions,P0,type:feature" \
  --body "## Epic 1: Video Protocol Extension
## Story: Video Generation Message Types

### Description
As an A2UI protocol implementer, I want video generation message types so agents can create videos.

### Acceptance Criteria
- [ ] A2UIGenerateVideo message type defined
- [ ] A2UIVideoGenerationProgress message type defined
- [ ] A2UIVideoGenerationComplete message type defined
- [ ] Streaming progress support

### Story Points: 3"

# Issue 7: WebSocket message handlers (5 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Implement WebSocket video message handlers" \
  --label "epic:video-protocol,phase:protocol-impl,P0,type:feature" \
  --body "## Epic 1: Video Protocol Extension
## Story: WebSocket Message Handlers

### Description
As an A2UI transport developer, I want message handlers so protocol messages are processed.

### Acceptance Criteria
- [ ] Event emitters for all video message types
- [ ] Type-safe event handlers
- [ ] Error handling for invalid messages
- [ ] Works with existing A2UITransport

### Story Points: 5

### Dependencies
- Issues #4, #5, #6"

# Issue 8: Protocol flow diagrams (3 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Create protocol flow diagrams" \
  --label "epic:video-protocol,phase:protocol-impl,P1,type:docs" \
  --body "## Epic 1: Video Protocol Extension
## Story: Protocol Flow Diagrams

### Description
As an A2UI developer, I want protocol flow diagrams so I understand message sequences.

### Acceptance Criteria
- [ ] Sequence diagrams for recording flow
- [ ] Sequence diagrams for call flow
- [ ] Sequence diagrams for generation flow
- [ ] Error handling flows documented

### Story Points: 3"

# Issue 9: Registry video components (3 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Add video components to standard catalog" \
  --label "epic:video-protocol,phase:protocol-impl,P0,type:feature" \
  --body "## Epic 1: Video Protocol Extension
## Story: Component Registry Extensions

### Description
As an A2UI renderer, I want video components in standard catalog so they're registered automatically.

### Acceptance Criteria
- [ ] Add videoRecorder to standard catalog
- [ ] Add videoCall to standard catalog
- [ ] Add aiVideo to standard catalog
- [ ] Add aiVideoPlayer to standard catalog

### Story Points: 3

### Dependencies
- Issue #1"

# Issue 10: Component definitions (3 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Create video component definitions" \
  --label "epic:video-protocol,phase:protocol-impl,P1,type:feature" \
  --body "## Epic 1: Video Protocol Extension
## Story: Component Definitions

### Description
As an A2UI developer, I want component definitions so I can extend the catalog.

### Acceptance Criteria
- [ ] ComponentDefinition for each video type
- [ ] Category assignments (media, communication, generation)
- [ ] Description and metadata
- [ ] Default props defined

### Story Points: 3

### Dependencies
- Issue #1"

# Issue 11: Video state types (3 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Define video state types" \
  --label "epic:video-protocol,phase:type-definitions,P0,type:feature" \
  --body "## Epic 1: Video Protocol Extension
## Story: Video State Types

### Description
As an A2UI agent developer, I want video state types so I can model video data.

### Acceptance Criteria
- [ ] A2UIVideoState interface defined
- [ ] Recording state structure
- [ ] Call state structure
- [ ] Generated video state structure

### Story Points: 3"

# Issue 12: JSON Pointer video state support (2 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Add JSON Pointer support for video state" \
  --label "epic:video-protocol,phase:type-definitions,P1,type:feature" \
  --body "## Epic 1: Video Protocol Extension
## Story: JSON Pointer Video State

### Description
As an A2UI developer, I want JSON Pointer support for video state so I can access nested data.

### Acceptance Criteria
- [ ] Video state accessible via JSON Pointer
- [ ] Examples in documentation
- [ ] Validation for pointer paths
- [ ] Works with existing JSONPointer implementation

### Story Points: 2

### Dependencies
- Issue #11"

# Issue 13: Integration tests with AIKit Video (8 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Integration tests with AIKit Video" \
  --label "epic:video-protocol,phase:testing-docs,P0,type:testing" \
  --body "## Epic 1: Video Protocol Extension
## Story: Integration Tests

### Description
As a maintainer, I want integration tests with AIKit Video so compatibility is verified.

### Acceptance Criteria
- [ ] Tests for all component types
- [ ] Tests for all message types
- [ ] Tests with actual AIKit Video components
- [ ] Mocked WebSocket transport tests

### Story Points: 8

### Dependencies
- Issues #1-#10
- AIKit Video Epic 13 completion"

# Issue 14: Protocol compliance tests (5 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Protocol compliance tests" \
  --label "epic:video-protocol,phase:testing-docs,P0,type:testing" \
  --body "## Epic 1: Video Protocol Extension
## Story: Protocol Compliance Tests

### Description
As a maintainer, I want protocol compliance tests so messages are validated.

### Acceptance Criteria
- [ ] Schema validation for all message types
- [ ] Component property validation
- [ ] Error case testing
- [ ] Backward compatibility tests

### Story Points: 5"

# Issue 15: Performance benchmarks (3 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Performance benchmarks" \
  --label "epic:video-protocol,phase:testing-docs,P1,type:testing" \
  --body "## Epic 1: Video Protocol Extension
## Story: Performance Benchmarks

### Description
As a maintainer, I want performance benchmarks so overhead is measured.

### Acceptance Criteria
- [ ] Message parsing benchmarks
- [ ] Component validation benchmarks
- [ ] Compared to non-video messages
- [ ] Results documented

### Story Points: 3"

# Issue 16: Protocol specification docs (8 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Write protocol specification" \
  --label "epic:video-protocol,phase:testing-docs,P0,type:docs" \
  --body "## Epic 1: Video Protocol Extension
## Story: Protocol Specification

### Description
As an A2UI agent developer, I want protocol specification docs so I know how to use video.

### Acceptance Criteria
- [ ] Complete protocol specification
- [ ] Message type reference
- [ ] Component type reference
- [ ] Integration examples

### Story Points: 8"

# Issue 17: Implementation guide (8 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Write implementation guide" \
  --label "epic:video-protocol,phase:testing-docs,P0,type:docs" \
  --body "## Epic 1: Video Protocol Extension
## Story: Implementation Guide

### Description
As an A2UI renderer developer, I want implementation guide so I can add video support.

### Acceptance Criteria
- [ ] Step-by-step integration guide
- [ ] Framework-specific examples (React, Vue, Svelte)
- [ ] AIKit Video integration patterns
- [ ] Troubleshooting section

### Story Points: 8"

# Issue 18: Migration guide (5 pts)
gh issue create --repo $REPO \
  --title "[Video Protocol] Write migration guide" \
  --label "epic:video-protocol,phase:testing-docs,P1,type:docs" \
  --body "## Epic 1: Video Protocol Extension
## Story: Migration Guide

### Description
As a developer, I want migration guide so I can upgrade existing agents.

### Acceptance Criteria
- [ ] v0.9 to v0.10 migration steps
- [ ] Breaking changes documented (none expected)
- [ ] Backward compatibility notes
- [ ] Example migrations

### Story Points: 5"

echo "Epic 1 issues created! (18 issues, 76 story points)"

echo ""
echo "Creating Epic 2: AI Intelligence Protocol issues..."

# Issue 19: Semantic search message types (5 pts)
gh issue create --repo $REPO \
  --title "[AI Intelligence] Define semantic search message types" \
  --label "epic:ai-intelligence,phase:ai-protocol,P0,type:feature" \
  --body "## Epic 2: AI Intelligence Protocol
## Story: Semantic Search Messages

### Description
As an A2UI agent developer, I want video search message types so agents can search videos semantically.

### Acceptance Criteria
- [ ] A2UISearchVideos message type defined with query and filters
- [ ] A2UISearchResults message type with relevance scores
- [ ] Support for semantic search (not just title matching)
- [ ] Result includes video metadata and relevant timestamps
- [ ] TypeScript types exported and documented

### Story Points: 5

### Dependencies
- Epic 1 complete
- AIKit Video Epic 14"

# Issue 20: Search message handlers (5 pts)
gh issue create --repo $REPO \
  --title "[AI Intelligence] Implement search message handlers" \
  --label "epic:ai-intelligence,phase:ai-protocol,P0,type:feature" \
  --body "## Epic 2: AI Intelligence Protocol
## Story: Search Message Handlers

### Description
As an A2UI renderer developer, I want search message handlers so video search works via WebSocket.

### Acceptance Criteria
- [ ] Event emitter for searchVideos message
- [ ] Event emitter for searchResults message
- [ ] Integration with AIKit Video search APIs
- [ ] Error handling for search failures
- [ ] Works with existing A2UITransport

### Story Points: 5

### Dependencies
- Issue #19"

# Issue 21: AI metadata state types (5 pts)
gh issue create --repo $REPO \
  --title "[AI Intelligence] Define AI metadata state types" \
  --label "epic:ai-intelligence,phase:ai-protocol,P0,type:feature" \
  --body "## Epic 2: AI Intelligence Protocol
## Story: AI Metadata State Types

### Description
As an A2UI agent developer, I want extended video state types so I can access AI metadata.

### Acceptance Criteria
- [ ] Extend A2UIVideoState with transcript structure
- [ ] Add summary, topics, tags, sentiment fields
- [ ] Add highlights, chapters, speakers fields
- [ ] Add AI-selected thumbnail references
- [ ] TypeScript interfaces fully typed

### Story Points: 5"

# Issue 22: Metadata message types (3 pts)
gh issue create --repo $REPO \
  --title "[AI Intelligence] Define metadata message types" \
  --label "epic:ai-intelligence,phase:ai-protocol,P0,type:feature" \
  --body "## Epic 2: AI Intelligence Protocol
## Story: Metadata Message Types

### Description
As an A2UI developer, I want AI metadata message types so agents receive AI insights.

### Acceptance Criteria
- [ ] A2UIVideoMetadataReady message type for async AI processing
- [ ] A2UIRequestMetadata message type for on-demand requests
- [ ] Includes all AI-generated metadata fields
- [ ] Progress updates for long-running AI processing
- [ ] TypeScript types exported

### Story Points: 3

### Dependencies
- Issue #21"

# Issue 23: Progress tracking messages (3 pts)
gh issue create --repo $REPO \
  --title "[AI Intelligence] Define progress tracking message types" \
  --label "epic:ai-intelligence,phase:ai-protocol,P0,type:feature" \
  --body "## Epic 2: AI Intelligence Protocol
## Story: Progress Tracking Messages

### Description
As an A2UI agent developer, I want progress tracking message types so agents can sync playback state.

### Acceptance Criteria
- [ ] A2UIUpdateProgress message type (renderer → agent)
- [ ] A2UIProgressSync message type (agent → renderer, cross-device)
- [ ] Include position, completion rate, device info
- [ ] Support for scene-aware resume metadata
- [ ] TypeScript types exported

### Story Points: 3"

# Issue 24: Progress message handlers (5 pts)
gh issue create --repo $REPO \
  --title "[AI Intelligence] Implement progress message handlers" \
  --label "epic:ai-intelligence,phase:ai-protocol,P0,type:feature" \
  --body "## Epic 2: AI Intelligence Protocol
## Story: Progress Message Handlers

### Description
As an A2UI renderer developer, I want progress message handlers so cross-device sync works.

### Acceptance Criteria
- [ ] Event emitter for progress update messages
- [ ] Event emitter for progress sync messages
- [ ] Integration with AIKit Video progress APIs
- [ ] Automatic sync across user devices
- [ ] Works with existing A2UITransport

### Story Points: 5

### Dependencies
- Issue #23"

# Issue 25: Recommendation message types (3 pts)
gh issue create --repo $REPO \
  --title "[AI Intelligence] Define recommendation message types" \
  --label "epic:ai-intelligence,phase:ai-protocol,P0,type:feature" \
  --body "## Epic 2: AI Intelligence Protocol
## Story: Recommendation Message Types

### Description
As an A2UI agent developer, I want recommendation message types so agents can suggest videos.

### Acceptance Criteria
- [ ] A2UIRequestRecommendations message type with user context
- [ ] A2UIRecommendations message type with ranked results
- [ ] Include recommendation reason and confidence
- [ ] Support for content-based and collaborative filtering
- [ ] TypeScript types exported

### Story Points: 3"

# Issue 26: Recommendation handlers (5 pts)
gh issue create --repo $REPO \
  --title "[AI Intelligence] Implement recommendation handlers" \
  --label "epic:ai-intelligence,phase:ai-protocol,P0,type:feature" \
  --body "## Epic 2: AI Intelligence Protocol
## Story: Recommendation Handlers

### Description
As an A2UI renderer developer, I want recommendation handlers so agents can serve personalized videos.

### Acceptance Criteria
- [ ] Event emitter for recommendation request
- [ ] Event emitter for recommendation results
- [ ] Integration with AIKit Video recommendation engine
- [ ] Support for strategy selection (hybrid, content, collaborative)
- [ ] Works with existing A2UITransport

### Story Points: 5

### Dependencies
- Issue #25"

# Issue 27: AI component property schemas (5 pts)
gh issue create --repo $REPO \
  --title "[AI Intelligence] Define AI component property schemas" \
  --label "epic:ai-intelligence,phase:ai-protocol,P0,type:feature" \
  --body "## Epic 2: AI Intelligence Protocol
## Story: AI Component Properties

### Description
As an A2UI agent developer, I want AI property schemas so I can configure AI features in components.

### Acceptance Criteria
- [ ] Extend VideoRecorderComponent with AI options (transcribe, highlights, summary)
- [ ] Extend VideoCallComponent with AI options (live transcription, captions, translation)
- [ ] Extend AIVideoComponent with AI generation options
- [ ] Extend AIVideoPlayerComponent with interactive AI options (Q&A, search)
- [ ] All AI properties fully typed with defaults

### Story Points: 5"

# Issue 28: AI configuration examples (3 pts)
gh issue create --repo $REPO \
  --title "[AI Intelligence] Add AI configuration examples" \
  --label "epic:ai-intelligence,phase:ai-protocol,P1,type:docs" \
  --body "## Epic 2: AI Intelligence Protocol
## Story: AI Configuration Examples

### Description
As an A2UI developer, I want AI configuration examples so I understand how to enable features.

### Acceptance Criteria
- [ ] Code examples for AI recording configuration
- [ ] Code examples for AI video call features
- [ ] Code examples for interactive AI player
- [ ] Common patterns documented
- [ ] Integration with ZeroDB documented

### Story Points: 3

### Dependencies
- Issue #27"

# Issue 29: AI protocol integration tests (8 pts)
gh issue create --repo $REPO \
  --title "[AI Intelligence] AI protocol integration tests" \
  --label "epic:ai-intelligence,phase:ai-protocol,P0,type:testing" \
  --body "## Epic 2: AI Intelligence Protocol
## Story: AI Integration Tests

### Description
As a maintainer, I want AI protocol integration tests so AI features work end-to-end.

### Acceptance Criteria
- [ ] Tests for semantic video search flow
- [ ] Tests for AI metadata message flow
- [ ] Tests for progress tracking and sync
- [ ] Tests for recommendations flow
- [ ] Mocked AIKit Video AI APIs

### Story Points: 8

### Dependencies
- Issues #19-#28
- AIKit Video Epic 14"

# Issue 30: AI protocol compliance tests (5 pts)
gh issue create --repo $REPO \
  --title "[AI Intelligence] AI protocol compliance tests" \
  --label "epic:ai-intelligence,phase:ai-protocol,P0,type:testing" \
  --body "## Epic 2: AI Intelligence Protocol
## Story: AI Protocol Compliance Tests

### Description
As a maintainer, I want AI protocol compliance tests so messages validate correctly.

### Acceptance Criteria
- [ ] Schema validation for all AI message types
- [ ] AI property validation in components
- [ ] Error case testing for AI features
- [ ] Backward compatibility (agents without AI support)

### Story Points: 5"

# Issue 31: AI protocol specification (8 pts)
gh issue create --repo $REPO \
  --title "[AI Intelligence] Write AI protocol specification" \
  --label "epic:ai-intelligence,phase:ai-protocol,P0,type:docs" \
  --body "## Epic 2: AI Intelligence Protocol
## Story: AI Protocol Specification

### Description
As an A2UI agent developer, I want AI protocol specification so I know how to use AI features.

### Acceptance Criteria
- [ ] Complete AI message type reference
- [ ] AI property schema reference
- [ ] Semantic search protocol specification
- [ ] Progress tracking protocol specification
- [ ] Recommendations protocol specification

### Story Points: 8"

# Issue 32: AI implementation guide (8 pts)
gh issue create --repo $REPO \
  --title "[AI Intelligence] Write AI implementation guide" \
  --label "epic:ai-intelligence,phase:ai-protocol,P0,type:docs" \
  --body "## Epic 2: AI Intelligence Protocol
## Story: AI Implementation Guide

### Description
As an A2UI renderer developer, I want AI implementation guide so I can integrate AI features.

### Acceptance Criteria
- [ ] Step-by-step guide for semantic search integration
- [ ] Guide for AI metadata handling
- [ ] Guide for progress tracking implementation
- [ ] Guide for recommendations engine integration
- [ ] AIKit Video + ZeroDB integration patterns

### Story Points: 8"

echo "Epic 2 issues created! (14 issues, 71 story points)"
echo ""
echo "✅ All 32 issues created successfully!"
echo ""
echo "📊 Summary:"
echo "  - Epic 1: 18 issues, 76 story points"
echo "  - Epic 2: 14 issues, 71 story points"
echo "  - Total: 32 issues, 147 story points"
