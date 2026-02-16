"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndQueueDuePayments = checkAndQueueDuePayments;
exports.startPaymentScheduler = startPaymentScheduler;
const prisma_1 = require("../lib/prisma");
const autoPayQueue_1 = require("../queue/autoPayQueue");
const subscriptionService_1 = require("./subscriptionService");
const subscriptionService = new subscriptionService_1.SubscriptionService();
/**
 * Check for subscriptions with due payments and queue them for auto-pay
 */
async function checkAndQueueDuePayments() {
    const now = new Date();
    const errors = [];
    let queued = 0;
    try {
        // Find all active subscriptions with auto-pay enabled and due payments
        const dueSubscriptions = await prisma_1.prisma.subscription.findMany({
            where: {
                isActive: true,
                autoPay: true,
                nextPaymentDate: {
                    lte: now,
                },
            },
            include: {
                service: true,
            },
        });
        console.log(`[PAYMENT_SCHEDULER] Found ${dueSubscriptions.length} subscriptions with due payments`);
        for (const subscription of dueSubscriptions) {
            try {
                // Check if there's already a pending job for this subscription
                // (to avoid duplicate payments)
                const existingJobs = await prisma_1.prisma.payment.findMany({
                    where: {
                        subscriptionId: subscription.id,
                        status: 'pending',
                        timestamp: {
                            gte: new Date(now.getTime() - 60000), // Within last minute
                        },
                    },
                });
                if (existingJobs.length > 0) {
                    console.log(`[PAYMENT_SCHEDULER] Skipping subscription ${subscription.id} - payment already in progress`);
                    continue;
                }
                // Queue the payment job
                await (0, autoPayQueue_1.addAutoPayJob)({
                    subscriptionId: subscription.id,
                    userAddress: subscription.userAddress,
                    amount: typeof subscription.cost === 'object' && 'toNumber' in subscription.cost
                        ? subscription.cost.toNumber()
                        : typeof subscription.cost === 'string'
                            ? parseFloat(subscription.cost)
                            : subscription.cost,
                    recipientAddress: subscription.recipientAddress,
                    serviceName: subscription.service?.name || 'Unknown Service',
                });
                queued++;
                console.log(`[PAYMENT_SCHEDULER] Queued payment for subscription ${subscription.id}`);
            }
            catch (error) {
                const errorMsg = `Failed to queue payment for subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                console.error(`[PAYMENT_SCHEDULER] ${errorMsg}`);
                errors.push(errorMsg);
            }
        }
        return {
            checked: dueSubscriptions.length,
            queued,
            errors,
        };
    }
    catch (error) {
        console.error('[PAYMENT_SCHEDULER] Error checking due payments:', error);
        throw error;
    }
}
/**
 * Start the payment scheduler (runs every 5 minutes)
 */
function startPaymentScheduler(intervalMinutes = 5) {
    console.log(`[PAYMENT_SCHEDULER] Starting payment scheduler (checking every ${intervalMinutes} minutes)`);
    // Run immediately on start
    checkAndQueueDuePayments().catch(error => {
        console.error('[PAYMENT_SCHEDULER] Error in initial payment check:', error);
    });
    // Then run at intervals
    const interval = setInterval(() => {
        checkAndQueueDuePayments().catch(error => {
            console.error('[PAYMENT_SCHEDULER] Error in scheduled payment check:', error);
        });
    }, intervalMinutes * 60 * 1000);
    return interval;
}
