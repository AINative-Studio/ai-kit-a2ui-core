import { CoAgentOptions, CoAgentHook } from '../types/coagent';

/**
 * useCoAgent Hook
 * Enables bidirectional state synchronization between React UI and AI agents
 *
 * @template T - The state type (must be serializable)
 * @param name - Agent name for routing messages
 * @param initialState - Initial state value
 * @param options - Configuration options
 * @returns CoAgentHook interface with state and control functions
 *
 * @example
 * ```tsx
 * const { state, setState } = useCoAgent('my-agent', { count: 0 }, {
 *   transport: myTransport,
 *   optimistic: true,
 *   onSync: (direction, state) => console.log('Synced:', direction, state)
 * })
 * ```
 */
export declare function useCoAgent<T = Record<string, unknown>>(name: string, initialState: T, options: CoAgentOptions<T>): CoAgentHook<T>;
//# sourceMappingURL=useCoAgent.d.ts.map