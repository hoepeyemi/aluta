/**
 * Cache service using Redis
 * Reuses the Redis connection from Bull queue
 */
declare class CacheService {
    private client;
    private initialized;
    private maxRetries;
    private retryDelay;
    /**
     * Initialize cache service with Redis client from Bull queue
     */
    private initialize;
    /**
     * Get Redis client with retry logic
     */
    private getClient;
    /**
     * Execute Redis operation with retry logic
     */
    private executeWithRetry;
    /**
     * Get value from cache
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set value in cache
     */
    set(key: string, value: any, ttlSeconds?: number): Promise<boolean>;
    /**
     * Delete key from cache
     */
    delete(key: string): Promise<boolean>;
    /**
     * Delete multiple keys matching a pattern
     */
    deletePattern(pattern: string): Promise<number>;
    /**
     * Check if key exists
     */
    exists(key: string): Promise<boolean>;
    /**
     * Get or set with cache (cache-aside pattern)
     */
    getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds?: number): Promise<T>;
    /**
     * Invalidate cache for a key
     */
    invalidate(key: string): Promise<void>;
    /**
     * Invalidate cache for multiple keys matching a pattern
     */
    invalidatePattern(pattern: string): Promise<void>;
    /**
     * Clear all cache (use with caution)
     */
    clear(): Promise<void>;
}
export declare const cacheService: CacheService;
export declare const CacheKeys: {
    userSubscriptions: (userAddress: string) => string;
    subscription: (id: string) => string;
    service: (id: string) => string;
    allServices: () => string;
    paymentHistory: (subscriptionId: string, limit?: number) => string;
    statisticsSummary: (startDate?: string, endDate?: string) => string;
    revenueByService: (startDate?: string, endDate?: string) => string;
    successRates: (startDate?: string, endDate?: string) => string;
    serviceBreakdown: (startDate?: string, endDate?: string) => string;
};
export declare const CacheTTL: {
    USER_SUBSCRIPTIONS: number;
    SUBSCRIPTION: number;
    SERVICE: number;
    ALL_SERVICES: number;
    PAYMENT_HISTORY: number;
    STATISTICS: number;
};
export {};
//# sourceMappingURL=cache.d.ts.map