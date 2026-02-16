import { ErrorCategory } from '../utils/paymentErrors';
export interface FailedPaymentRecord {
    id: string;
    subscriptionId: string;
    userAddress: string;
    amount: number;
    errorCategory: ErrorCategory;
    errorMessage: string;
    attemptNumber: number;
    timestamp: Date;
    retryable: boolean;
    nextRetryAt?: Date;
}
export interface FailedPaymentStats {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    retryable: number;
    nonRetryable: number;
    recentFailures: FailedPaymentRecord[];
}
/**
 * Track and manage failed payment attempts
 */
export declare class FailedPaymentTracker {
    /**
     * Record a failed payment attempt
     */
    recordFailure(subscriptionId: string, userAddress: string, amount: number, error: Error | string, attemptNumber: number, nextRetryAt?: Date): Promise<void>;
    /**
     * Get failed payments for a subscription
     */
    getFailedPayments(subscriptionId: string, limit?: number): Promise<FailedPaymentRecord[]>;
    /**
     * Get failed payment statistics
     */
    getFailedPaymentStats(userAddress?: string, startDate?: Date, endDate?: Date): Promise<FailedPaymentStats>;
    /**
     * Check if subscription has too many consecutive failures
     */
    hasTooManyFailures(subscriptionId: string, maxFailures?: number): Promise<boolean>;
}
export declare const failedPaymentTracker: FailedPaymentTracker;
//# sourceMappingURL=failedPaymentTracker.d.ts.map