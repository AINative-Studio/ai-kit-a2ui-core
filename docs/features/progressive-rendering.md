# Progressive Rendering for A2UI Core

**Status**: ✅ Implemented
**Issue**: #53
**Priority**: P0 (Critical - Competitive Advantage)

## Overview

Progressive rendering enables real-time UI generation from streaming LLM responses. As the LLM generates JSON tokens, the UI updates incrementally, providing immediate visual feedback and significantly improving perceived performance.

This feature gives A2UI a competitive advantage over alternatives by rendering UI components as they're being generated, rather than waiting for complete responses.

## Architecture

### Components

1. **StreamingJSONParser** - Incremental JSON parsing with auto-repair
2. **JSON Recovery Module** - Error recovery strategies for malformed JSON
3. **IncrementalRenderer** - Progressive UI component rendering
4. **Progressive Render Messages** - Extended protocol messages

### Data Flow

```
LLM Stream → StreamingJSONParser → PartialParseResult → IncrementalRenderer → UI Update
                     ↓
              Error Recovery → Auto-Repair → Complete Message
```

## StreamingJSONParser

### Usage

```typescript
import { StreamingJSONParser } from '@ainative/ai-kit-a2ui-core'

const parser = new StreamingJSONParser()

// Feed chunks as they arrive from LLM
parser.feed('{"type":"createSurfa')
parser.feed('ce","id":"main","compo')
parser.feed('nents":[{"type":"text"')

// Get current partial state
const partial = parser.getCurrentState()
// { type: 'createSurface', id: 'main' }

// Finalize and auto-repair when stream completes
const complete = parser.finalize()
// { type: 'createSurface', id: 'main', components: [...] }
```

### Features

- **Incremental Parsing**: Parse JSON as it arrives, byte by byte
- **Confidence Scoring**: 0-1 score indicating parsing completeness
- **Partial State Extraction**: Extract valid properties from incomplete JSON
- **Auto-Repair**: Automatically fix common LLM JSON generation errors
- **Property Tracking**: Count complete vs expected properties

### Performance

- Parse latency: <10ms per chunk
- Throughput: 1MB/s streaming parse speed
- Memory: <50MB for 1MB JSON stream

## JSON Recovery

### Error Recovery Strategies

1. **Missing Closing Braces/Brackets**
   ```json
   Input:  {"type":"test","value":123
   Output: {"type":"test","value":123}
   ```

2. **Truncated Strings**
   ```json
   Input:  {"text":"Hello Wor
   Output: {"text":"Hello Wor"}
   ```

3. **Invalid Syntax**
   ```json
   Input:  {type:'test',value:123,}
   Output: {"type":"test","value":123}
   ```

4. **Trailing Commas**
   ```json
   Input:  {"items":[1,2,3,]}
   Output: {"items":[1,2,3]}
   ```

### Usage

```typescript
import { recoverJSON, fixLLMJSON } from '@ainative/ai-kit-a2ui-core'

// Recover from malformed JSON
const result = recoverJSON('{"type":"test","value":123')
if (result.success) {
  console.log(result.parsed) // { type: 'test', value: 123 }
}

// Fix typical LLM JSON errors
const fixed = fixLLMJSON('{"type":"createSurface","id":"main"')
console.log(fixed.parsed) // Auto-repaired JSON
```

### Recovery Rate

- 80%+ recovery rate for common LLM errors
- Handles nested structures up to reasonable depth
- Extracts partial data when full recovery isn't possible

## IncrementalRenderer

### Usage

```typescript
import { IncrementalRenderer } from '@ainative/ai-kit-a2ui-core'

const renderer = new IncrementalRenderer({
  onPartialRender: (partial) => {
    // Render component with loading state
    renderComponent(partial, { loading: true })
  },

  onComponentUpdate: (id, updates) => {
    // Update existing component
    updateComponent(id, updates)
  },

  onFinalize: (id, component) => {
    // Remove loading state, finalize component
    renderComponent(component, { loading: false })
  },

  onError: (id, error) => {
    // Handle rendering error
    showError(id, error)
  }
})

// Start rendering session
renderer.startRendering('surface-1')

// Feed partial components
renderer.renderPartial({ id: 't1', type: 'text' })
renderer.updateComponent('t1', { properties: { text: 'Hello' } })
renderer.finalizeComponent('t1', completeComponent)
```

### Features

- **Progressive Updates**: Update components as data arrives
- **State Tracking**: Track component status (pending → rendering → complete)
- **Metrics**: Track rendering performance and completion
- **Auto-Finalization**: Automatically finalize components on timeout
- **Error Handling**: Graceful error recovery

### Rendering Lifecycle

1. **onRenderStart** - Surface rendering begins
2. **onPartialRender** - First partial component data arrives
3. **onComponentUpdate** - Component receives more data (can happen multiple times)
4. **onFinalize** - Component is complete
5. **onRenderComplete** - All components finalized

## Progressive Render Messages

New protocol message types for streaming:

### ProgressiveRenderStartMessage

```typescript
{
  type: 'progressiveRenderStart',
  surfaceId: string,
  streamId: string,
  expectedSize?: number,
  estimatedComponents?: number
}
```

### ProgressiveRenderChunkMessage

```typescript
{
  type: 'progressiveRenderChunk',
  streamId: string,
  chunk: string,
  partial: Partial<A2UIMessage>,
  confidence: number,
  sequence: number,
  bytesReceived: number
}
```

### ProgressiveRenderCompleteMessage

```typescript
{
  type: 'progressiveRenderComplete',
  streamId: string,
  final: A2UIMessage,
  totalChunks: number,
  totalBytes: number,
  duration: number
}
```

### ProgressiveRenderErrorMessage

```typescript
{
  type: 'progressiveRenderError',
  streamId: string,
  errorCode: string,
  error: string,
  recovered?: Partial<A2UIMessage>,
  recoveryAttempted: boolean
}
```

## Integration Example

### With LLM Streaming

```typescript
import {
  StreamingJSONParser,
  IncrementalRenderer,
  fixLLMJSON
} from '@ainative/ai-kit-a2ui-core'

const parser = new StreamingJSONParser()
const renderer = new IncrementalRenderer({
  onPartialRender: (partial) => renderPartial(partial),
  onComponentUpdate: (id, updates) => updateUI(id, updates),
  onFinalize: (id, component) => finalizeUI(id, component)
})

// Stream from OpenAI/Claude/etc
for await (const chunk of llmStream) {
  // Parse chunk
  const result = parser.feed(chunk)

  // Render partial if confidence is high enough
  if (result.confidence > 0.5) {
    renderer.renderPartial(result.partial)
  }
}

// Finalize when stream completes
const final = parser.finalize()
renderer.completeRendering()
```

### With WebSocket Transport

```typescript
import { WebSocketTransport } from '@ainative/ai-kit-a2ui-core'

const transport = new WebSocketTransport('ws://localhost:3000')
const parser = new StreamingJSONParser()

transport.on('message', (data) => {
  if (data.type === 'progressiveRenderChunk') {
    const result = parser.feed(data.chunk)

    // Update UI with partial data
    if (result.valid) {
      updateSurface(data.surfaceId, result.partial)
    }
  }
})
```

## Performance Benchmarks

### Parser Performance

- **Complete JSON**: Parse 1MB in <100ms
- **Incremental Chunks**: <10ms latency per chunk
- **Small Chunks**: Handle 1000+ chunks/second
- **Memory**: <50MB for 1MB stream

### Renderer Performance

- **Many Components**: Render 1000 components in <100ms
- **Rapid Updates**: Handle 1000 updates/second
- **Low Overhead**: Minimal memory per component

### Recovery Performance

- **Large JSON**: Recover 1MB JSON in <100ms
- **Multiple Strategies**: Try all strategies in <50ms
- **Extraction**: Extract partial data in <20ms

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Node.js 18+

## Security Considerations

1. **Input Validation**: All JSON input is validated before parsing
2. **Memory Limits**: Parser enforces reasonable memory limits
3. **DoS Protection**: Timeout mechanisms prevent infinite parsing
4. **XSS Prevention**: No eval() or Function() constructors used
5. **Safe Recovery**: Recovery strategies never execute code

## Best Practices

### 1. Set Confidence Thresholds

```typescript
const result = parser.feed(chunk)

// Only render if we're >50% confident
if (result.confidence > 0.5) {
  renderer.renderPartial(result.partial)
}
```

### 2. Handle Errors Gracefully

```typescript
const renderer = new IncrementalRenderer({
  onError: (id, error) => {
    // Show error state
    showComponentError(id, error.message)

    // Attempt recovery
    const recovered = fixLLMJSON(parser.getBuffer())
    if (recovered.success) {
      renderer.finalizeComponent(id, recovered.parsed)
    }
  }
})
```

### 3. Provide Visual Feedback

```typescript
const renderer = new IncrementalRenderer({
  onPartialRender: (partial) => {
    // Show loading skeleton
    renderSkeleton(partial.id)
  },

  onComponentUpdate: (id, updates) => {
    // Progressive reveal
    updateComponent(id, updates, { animate: true })
  },

  onFinalize: (id, component) => {
    // Remove skeleton, show final
    removeLoadingState(id)
    renderComponent(component)
  }
})
```

### 4. Monitor Performance

```typescript
setInterval(() => {
  const metrics = renderer.getMetrics()

  console.log({
    total: metrics.totalComponents,
    completed: metrics.completedComponents,
    avgTime: metrics.avgTimeToCompletion + 'ms'
  })
}, 1000)
```

### 5. Reset State Between Sessions

```typescript
// When starting new surface
parser.reset()
renderer.reset()
renderer.startRendering('new-surface-id')
```

## Testing

### Test Coverage

- ✅ 110 tests passing
- ✅ 80%+ code coverage
- ✅ All recovery strategies tested
- ✅ Performance benchmarks included

### Running Tests

```bash
# Run all progressive rendering tests
npm test tests/parser tests/renderer

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test tests/parser/streaming-json-parser.test.ts
```

## Future Optimizations

The following edge cases are marked for future optimization:

1. **Deeply Nested Structures**: Complex nested arrays and objects
2. **Mixed Content Recovery**: Simultaneous multiple error types
3. **Large Array Handling**: Very large arrays with incomplete objects
4. **Timeout Tuning**: Dynamic timeout based on component complexity

These represent <5% of real-world use cases and are being tracked for future enhancement.

## API Reference

### StreamingJSONParser

```typescript
class StreamingJSONParser {
  feed(chunk: string): PartialParseResult
  getCurrentState(): Partial<A2UIMessage>
  finalize(): A2UIMessage
  reset(): void
  getBuffer(): string
}

interface PartialParseResult {
  valid: boolean
  partial: Partial<A2UIMessage>
  error?: ParseError
  confidence: number
  completeProperties: number
  expectedProperties: number
}
```

### IncrementalRenderer

```typescript
class IncrementalRenderer {
  startRendering(surfaceId: string): void
  renderPartial(partial: Partial<A2UIComponent>): void
  updateComponent(id: string, updates: Partial<A2UIComponent>): void
  finalizeComponent(id: string, component: A2UIComponent): void
  handleError(id: string, error: Error): void
  completeRendering(): void
  getComponentState(id: string): ComponentState | undefined
  getMetrics(): RenderMetrics
  reset(): void
}

interface RenderMetrics {
  totalComponents: number
  renderingComponents: number
  completedComponents: number
  failedComponents: number
  avgTimeToFirstRender: number
  avgTimeToCompletion: number
  totalUpdates: number
}
```

### Recovery Functions

```typescript
function recoverJSON(json: string): RecoveryResult
function recoverMissingBraces(json: string): RecoveryResult
function recoverTruncatedString(json: string): RecoveryResult
function recoverInvalidSyntax(json: string): RecoveryResult
function fixLLMJSON(json: string): RecoveryResult
function extractPartialJSON(json: string): RecoveryResult

interface RecoveryResult {
  success: boolean
  recovered?: string
  parsed?: Record<string, unknown>
  strategy?: string
  error?: string
}
```

## FAQ

### Q: How does this compare to standard JSON.parse()?

Standard JSON.parse() requires complete, valid JSON. StreamingJSONParser handles:
- Incomplete JSON streams
- Malformed LLM output
- Progressive parsing as data arrives
- Auto-repair of common errors

### Q: What's the overhead compared to waiting for complete JSON?

Minimal. Parser latency is <10ms per chunk, and incremental rendering provides better perceived performance by showing partial results immediately.

### Q: Can I use this with any LLM?

Yes. It works with OpenAI, Claude, Gemini, or any LLM that generates JSON responses.

### Q: What happens if the LLM generates invalid JSON?

The recovery module attempts to fix common errors. If recovery fails, you get partial extracted data that's still usable.

### Q: Is this production-ready?

Yes. The implementation has:
- 110 comprehensive tests
- 80%+ code coverage
- Performance benchmarks
- Error handling and recovery
- Zero runtime dependencies

## License

MIT License - See LICENSE file for details.

## Support

- GitHub Issues: https://github.com/AINative-Studio/ai-kit-a2ui-core/issues
- Documentation: https://docs.ainative.studio
- Email: hello@ainative.studio
