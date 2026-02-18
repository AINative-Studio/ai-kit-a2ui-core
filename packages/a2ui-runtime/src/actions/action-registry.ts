import { z } from 'zod'

/**
 * Action definition for LLM function calling
 */
export interface Action {
  /** Unique action name */
  name: string
  /** Action description for LLM */
  description: string
  /** Zod schema for parameters */
  parameters: z.ZodType<any>
  /** Action handler function */
  handler: (params: any) => Promise<{ success: boolean; data?: unknown; error?: string }>
}

/**
 * Registry for managing available actions
 */
export class ActionRegistry {
  private actions = new Map<string, Action>()

  /**
   * Register a new action
   */
  register(action: Action): void {
    if (this.actions.has(action.name)) {
      throw new Error(`Action "${action.name}" already registered`)
    }
    this.actions.set(action.name, action)
  }

  /**
   * Register multiple actions at once
   */
  registerMany(actions: Action[]): void {
    for (const action of actions) {
      this.register(action)
    }
  }

  /**
   * Unregister an action
   */
  unregister(name: string): boolean {
    return this.actions.delete(name)
  }

  /**
   * Get an action by name
   */
  get(name: string): Action | undefined {
    return this.actions.get(name)
  }

  /**
   * Get all registered actions as array
   */
  list(): Action[] {
    return Array.from(this.actions.values())
  }

  /**
   * Get all registered actions
   */
  getAll(): Map<string, Action> {
    return new Map(this.actions)
  }

  /**
   * Check if action exists
   */
  has(name: string): boolean {
    return this.actions.has(name)
  }

  /**
   * Clear all actions
   */
  clear(): void {
    this.actions.clear()
  }

  /**
   * Execute an action by name
   */
  async execute(name: string, parameters: Record<string, unknown>): Promise<any> {
    const action = this.actions.get(name)

    if (!action) {
      throw new Error(`Action "${name}" not found`)
    }

    // Validate parameters using Zod schema
    const parseResult = action.parameters.safeParse(parameters)

    if (!parseResult.success) {
      const errors = parseResult.error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ')
      throw new Error(`Invalid parameters for action "${name}": ${errors}`)
    }

    try {
      return await action.handler(parseResult.data)
    } catch (error) {
      throw new Error(
        `Failed to execute action "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}
