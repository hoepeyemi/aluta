/**
 * Check for subscriptions with due payments and queue them for auto-pay
 */
export declare function checkAndQueueDuePayments(): Promise<{
    checked: number;
    queued: number;
    errors: string[];
}>;
/**
 * Start the payment scheduler (runs every 5 minutes)
 */
export declare function startPaymentScheduler(intervalMinutes?: number): NodeJS.Timeout;
//# sourceMappingURL=paymentScheduler.d.ts.map