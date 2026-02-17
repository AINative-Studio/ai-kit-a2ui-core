import { A2UIComponent, A2UIUserAction, DataModel, SurfaceId } from '../../../../src/types/index.ts';

export interface UseA2UIAgentOptions {
    url: string;
    autoConnect?: boolean;
    reconnect?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}
export interface Surface {
    id: SurfaceId;
    components: A2UIComponent[];
    dataModel?: DataModel;
}
export interface UseA2UIAgentReturn {
    surfaces: Map<SurfaceId, Surface>;
    send: (action: Omit<A2UIUserAction, 'type'>) => void;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    isConnected: boolean;
    isConnecting: boolean;
    error: Error | null;
}
/**
 * Hook for managing A2UI agent connections and surfaces
 *
 * @example
 * ```tsx
 * const agent = useA2UIAgent({
 *   url: 'wss://api.example.com/agent',
 *   autoConnect: true
 * })
 *
 * // Access surfaces
 * const chatSurface = agent.surfaces.get('chat-1')
 *
 * // Send user action
 * agent.send({
 *   surfaceId: 'chat-1',
 *   action: 'send-message',
 *   context: { message: 'Hello!' }
 * })
 * ```
 */
export declare function useA2UIAgent(options: UseA2UIAgentOptions): UseA2UIAgentReturn;
//# sourceMappingURL=useA2UIAgent.d.ts.map