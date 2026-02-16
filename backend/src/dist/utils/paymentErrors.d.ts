/**
 * Payment Error Categorization and Handling
 */
export declare enum ErrorCategory {
    RETRYABLE = "retryable",// Can be retried (network, temporary issues)
    NON_RETRYABLE = "non_retryable",// Should not be retried (invalid data, auth)
    INSUFFICIENT_FUNDS = "insufficient_funds",// User needs to add funds
    NETWORK_ERROR = "network_error",// Network/connection issues
    TIMEOUT = "timeout",// Request timeout
    RATE_LIMIT = "rate_limit",// Rate limiting
    INVALID_SUBSCRIPTION = "invalid_subscription",// Subscription issues
    WALLET_ERROR = "wallet_error"
}
export interface CategorizedError {
    category: ErrorCategory;
    message: string;
    originalError: Error;
    retryable: boolean;
    maxRetries?: number;
    retryDelay?: number;
}
/**
 * Categorize payment errors for appropriate handling
 */
export declare function categorizePaymentError(error: Error | string): CategorizedError;
/**
 * Check if error should be retried
 */
export declare function shouldRetry(error: CategorizedError, attemptNumber: number): boolean;
/**
 * Calculate retry delay with exponential backoff
 */
export declare function calculateRetryDelay(error: CategorizedError, attemptNumber: number, baseDelay?: number): number;
/**
 * Get user-friendly error message
 */
export declare function getUserFriendlyMessage(error: CategorizedError): string;
//# sourceMappingURL=paymentErrors.d.ts.map