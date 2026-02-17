export interface PendingApproval<T = unknown> {
    id: string;
    action: string;
    data: T;
    timestamp: number;
    timeout?: number;
}
export interface UseHumanInTheLoopReturn<T = unknown> {
    pendingApprovals: PendingApproval<T>[];
    requestApproval: (action: string, data: T, timeout?: number) => Promise<boolean>;
    approve: (id: string) => void;
    reject: (id: string) => void;
    clear: (id: string) => void;
}
export declare function useHumanInTheLoop<T = unknown>(): UseHumanInTheLoopReturn<T>;
//# sourceMappingURL=useHumanInTheLoop.d.ts.map