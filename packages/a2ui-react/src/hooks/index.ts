/**
 * A2UI React Hooks exports
 */

export { useA2UIAgent } from './useA2UIAgent.js'
export { useA2UIState } from './useA2UIState.js'
export { useA2UIAction } from './useA2UIAction.js'
export { useCoAgent } from './useCoAgent.js'
export { useHumanInTheLoop } from './useHumanInTheLoop.js'

export type {
  UseA2UIAgentReturn,
  UseA2UIAgentOptions,
  Surface,
} from './useA2UIAgent.js'

export type {
  UseA2UIStateReturn,
} from '../types/index.js'

export type {
  UseA2UIActionReturn,
} from '../types/index.js'

export type {
  CoAgentOptions,
  CoAgentHook,
  CoAgentError,
  StateConflict,
} from '../types/coagent.js'

export type {
  PendingApproval,
  UseHumanInTheLoopReturn,
} from './useHumanInTheLoop.js'
