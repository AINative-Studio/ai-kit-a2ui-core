// Export headless hooks
export * from './hooks'

// Export components (to be implemented)
// export { A2UIChat } from './components/A2UIChat'
// export { A2UIPopup } from './components/A2UIPopup'
// export { A2UISidebar } from './components/A2UISidebar'

// Export types from hooks
export type { UseA2UIAgentOptions, UseA2UIAgentReturn, Surface, DataModel } from './hooks/useA2UIAgent'
export type { UseHumanInTheLoopReturn, PendingApproval } from './hooks/useHumanInTheLoop'

// Export CoAgent types
export type {
  CoAgentOptions,
  CoAgentHook,
  CoAgentError,
  StateConflict,
  CoAgentTransport,
} from './types/coagent'
