"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.failedPaymentTracker = exports.FailedPaymentTracker = void 0;
const prisma_1 = require("../lib/prisma");
const paymentErrors_1 = require("../utils/paymentErrors");
/**
 * Track and manage failed payment attempts
 */
class FailedPaymentTracker {
    /**
     * Record a failed payment attempt
     */
    async recordFailure(subscriptionId, userAddress, amount, error, attemptNumber, nextRetryAt) {
        const categorized = (0, paymentErrors_1.categorizePaymentError)(error);
        // Store in database (using Payment table with failed status)
        // Also track in a separate table or add metadata
        try {
            await prisma_1.prisma.payment.create({
                data: {
                    subscriptionId,
                    amount: amount,
                    transactionHash: '', // No transaction hash for failed payments
                    network: 'hedera-testnet',
                    status: 'failed',
                    errorMessage: `${categorized.category}: ${categorized.message}`,
                    // Store metadata in errorMessage for now
                    // In production, you might want a separate FailedPaymentAttempt table
                },
            });
            console.log(`[FAILED_PAYMENT_TRACKER] Recorded failure for subscription ${subscriptionId}:`, {
                category: categorized.category,
                attempt: attemptNumber,
                retryable: categorized.retryable,
                nextRetryAt,
            });
        }
        catch (dbError) {
            console.error('[FAILED_PAYMENT_TRACKER] Failed to record failure in database:', dbError);
            // Don't throw - logging is sufficient
        }
    }
    /**
     * Get failed payments for a subscription
     */
    async getFailedPayments(subscriptionId, limit = 10) {
        const payments = await prisma_1.prisma.payment.findMany({
            where: {
                subscriptionId,
                status: 'failed',
            },
            orderBy: {
                timestamp: 'desc',
            },
            take: limit,
        });
        return payments.map((payment) => {
            // Parse error message to extract category
            const errorParts = payment.errorMessage?.split(': ') || [];
            const category = errorParts[0] || paymentErrors_1.ErrorCategory.NON_RETRYABLE;
            const message = errorParts.slice(1).join(': ') || payment.errorMessage || 'Unknown error';
            return {
                id: payment.id,
                subscriptionId: payment.subscriptionId,
                userAddress: '', // Would need to join with subscription
                amount: typeof payment.amount === 'object' && 'toNumber' in payment.amount
                    ? payment.amount.toNumber()
                    : typeof payment.amount === 'string'
                        ? parseFloat(payment.amount)
                        : payment.amount,
                errorCategory: category,
                errorMessage: message,
                attemptNumber: 1, // Would need to track this separately
                timestamp: payment.timestamp,
                retryable: category !== paymentErrors_1.ErrorCategory.NON_RETRYABLE &&
                    category !== paymentErrors_1.ErrorCategory.INSUFFICIENT_FUNDS &&
                    category !== paymentErrors_1.ErrorCategory.WALLET_ERROR &&
                    category !== paymentErrors_1.ErrorCategory.INVALID_SUBSCRIPTION,
            };
        });
    }
    /**
     * Get failed payment statistics
     */
    async getFailedPaymentStats(userAddress, startDate, endDate) {
        const whereClause = {
            status: 'failed',
        };
        if (userAddress) {
            // Would need to join with subscription table
            // For now, get all failed payments
        }
        if (startDate || endDate) {
            whereClause.timestamp = {};
            if (startDate) {
                whereClause.timestamp.gte = startDate;
            }
            if (endDate) {
                whereClause.timestamp.lte = endDate;
            }
        }
        const payments = await prisma_1.prisma.payment.findMany({
            where: whereClause,
            orderBy: {
                timestamp: 'desc',
            },
            take: 100, // Limit for stats
        });
        const stats = {
            total: payments.length,
            byCategory: {},
            retryable: 0,
            nonRetryable: 0,
            recentFailures: [],
        };
        // Initialize category counts
        Object.values(paymentErrors_1.ErrorCategory).forEach((category) => {
            stats.byCategory[category] = 0;
        });
        payments.forEach((payment) => {
            const errorParts = payment.errorMessage?.split(': ') || [];
            const category = errorParts[0] || paymentErrors_1.ErrorCategory.NON_RETRYABLE;
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
            const categorized = (0, paymentErrors_1.categorizePaymentError)(payment.errorMessage || 'Unknown error');
            if (categorized.retryable) {
                stats.retryable++;
            }
            else {
                stats.nonRetryable++;
            }
            // Add to recent failures
            if (stats.recentFailures.length < 10) {
                stats.recentFailures.push({
                    id: payment.id,
                    subscriptionId: payment.subscriptionId,
                    userAddress: '',
                    amount: typeof payment.amount === 'object' && 'toNumber' in payment.amount
                        ? payment.amount.toNumber()
                        : typeof payment.amount === 'string'
                            ? parseFloat(payment.amount)
                            : payment.amount,
                    errorCategory: category,
                    errorMessage: errorParts.slice(1).join(': ') || payment.errorMessage || 'Unknown error',
                    attemptNumber: 1,
                    timestamp: payment.timestamp,
                    retryable: categorized.retryable,
                });
            }
        });
        return stats;
    }
    /**
     * Check if subscription has too many consecutive failures
     */
    async hasTooManyFailures(subscriptionId, maxFailures = 3) {
        const recentFailures = await prisma_1.prisma.payment.findMany({
            where: {
                subscriptionId,
                status: 'failed',
            },
            orderBy: {
                timestamp: 'desc',
            },
            take: maxFailures,
        });
        // Check if all recent payments are failures
        if (recentFailures.length < maxFailures) {
            return false;
        }
        // Check if there's a successful payment after the failures
        const lastFailure = recentFailures[0];
        const successAfterFailure = await prisma_1.prisma.payment.findFirst({
            where: {
                subscriptionId,
                status: 'completed',
                timestamp: {
                    gt: lastFailure.timestamp,
                },
            },
        });
        return !successAfterFailure;
    }
}
exports.FailedPaymentTracker = FailedPaymentTracker;
exports.failedPaymentTracker = new FailedPaymentTracker();
