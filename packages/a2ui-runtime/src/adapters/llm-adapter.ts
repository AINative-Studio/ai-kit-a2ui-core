import type { RuntimeContext, GenerationOptions, StreamOptions, ChatMessage, ActionResult } from '../types/runtime-types'
import type { Action } from '../actions/action-registry'

/**
 * Base class for LLM adapters
 */
export abstract class LLMAdapter {
  /** Provider identifier */
  abstract readonly provider: string

  /**
   * Generate UI from a prompt
   */
  abstract generateUI(
    prompt: string,
    context: RuntimeContext,
    options?: GenerationOptions
  ): AsyncIterator<string>

  /**
   * Execute an action
   */
  abstract executeAction(
    action: Action,
    parameters: Record<string, unknown>
  ): Promise<ActionResult>

  /**
   * Stream a chat response
   */
  abstract streamResponse(
    messages: ChatMessage[],
    options?: StreamOptions
  ): AsyncIterator<string>

  /**
   * Convert actions to provider-specific tool format
   */
  abstract convertActionsToTools(actions: Map<string, Action>): unknown[]

  /**
   * Parse LLM response (can be overridden)
   */
  protected parseResponse(content: string): string {
    return content
  }
}
