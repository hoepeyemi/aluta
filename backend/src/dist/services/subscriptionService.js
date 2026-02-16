"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const prisma_1 = require("../lib/prisma");
const library_1 = require("@prisma/client/runtime/library");
const cache_1 = require("../utils/cache");
class SubscriptionService {
    /**
     * Get all subscriptions for a user (with caching)
     */
    async getUserSubscriptions(userAddress) {
        const cacheKey = cache_1.CacheKeys.userSubscriptions(userAddress);
        return cache_1.cacheService.getOrSet(cacheKey, async () => {
            const subscriptions = await prisma_1.prisma.subscription.findMany({
                where: {
                    userAddress: userAddress.toLowerCase(),
                    isActive: true,
                },
                include: {
                    service: true,
                    payments: {
                        orderBy: {
                            timestamp: 'desc',
                        },
                        take: 10, // Last 10 payments
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            // Convert Decimal to number for JSON serialization
            return subscriptions.map(sub => ({
                ...sub,
                cost: this.decimalToNumber(sub.cost),
                service: sub.service ? {
                    ...sub.service,
                    cost: this.decimalToNumber(sub.service.cost),
                } : null,
                payments: sub.payments?.map(payment => ({
                    ...payment,
                    amount: this.decimalToNumber(payment.amount),
                })),
            }));
        }, cache_1.CacheTTL.USER_SUBSCRIPTIONS);
    }
    /**
     * Get a single subscription by ID (with caching)
     */
    async getSubscription(id) {
        const cacheKey = cache_1.CacheKeys.subscription(id);
        return cache_1.cacheService.getOrSet(cacheKey, async () => {
            const subscription = await prisma_1.prisma.subscription.findUnique({
                where: { id },
                include: {
                    service: true,
                    payments: {
                        orderBy: {
                            timestamp: 'desc',
                        },
                    },
                },
            });
            if (!subscription) {
                return null;
            }
            // Convert Decimal to number for JSON serialization
            return {
                ...subscription,
                cost: this.decimalToNumber(subscription.cost),
                service: subscription.service ? {
                    ...subscription.service,
                    cost: this.decimalToNumber(subscription.service.cost),
                } : null,
                payments: subscription.payments?.map(payment => ({
                    ...payment,
                    amount: this.decimalToNumber(payment.amount),
                })),
            };
        }, cache_1.CacheTTL.SUBSCRIPTION);
    }
    /**
     * Create a new subscription (with cache invalidation)
     */
    async createSubscription(input) {
        const { serviceId, serviceName, cost, frequency, recipientAddress, userAddress, autoPay, usageData } = input;
        // Calculate next payment date
        const nextPaymentDate = this.calculateNextPaymentDate(frequency);
        // If serviceId is provided, use it; otherwise create a new service
        let finalServiceId = serviceId;
        if (!finalServiceId && serviceName) {
            const service = await prisma_1.prisma.service.create({
                data: {
                    name: serviceName,
                    cost: new library_1.Decimal(cost),
                    frequency,
                    recipientAddress,
                },
            });
            finalServiceId = service.id;
            // Invalidate services cache
            await cache_1.cacheService.invalidate(cache_1.CacheKeys.allServices());
        }
        if (!finalServiceId) {
            throw new Error('Either serviceId or serviceName must be provided');
        }
        const subscription = await prisma_1.prisma.subscription.create({
            data: {
                serviceId: finalServiceId,
                userAddress: userAddress.toLowerCase(),
                cost: new library_1.Decimal(cost),
                frequency,
                recipientAddress,
                nextPaymentDate,
                autoPay: autoPay ?? false,
                usageData: usageData ? JSON.parse(JSON.stringify(usageData)) : null,
            },
            include: {
                service: true,
            },
        });
        // Invalidate caches
        await Promise.all([
            cache_1.cacheService.invalidate(cache_1.CacheKeys.userSubscriptions(userAddress)),
            cache_1.cacheService.invalidatePattern('stats:*'), // Invalidate all statistics
        ]);
        return subscription;
    }
    /**
     * Update a subscription (with cache invalidation)
     */
    async updateSubscription(id, input) {
        // Get subscription first to get userAddress for cache invalidation
        const existingSubscription = await prisma_1.prisma.subscription.findUnique({
            where: { id },
            select: { userAddress: true },
        });
        if (!existingSubscription) {
            throw new Error('Subscription not found');
        }
        const updateData = {};
        if (input.cost !== undefined) {
            updateData.cost = new library_1.Decimal(input.cost);
        }
        if (input.frequency !== undefined) {
            updateData.frequency = input.frequency;
            // Recalculate next payment date if frequency changed
            updateData.nextPaymentDate = this.calculateNextPaymentDate(input.frequency);
        }
        if (input.recipientAddress !== undefined) {
            updateData.recipientAddress = input.recipientAddress;
        }
        if (input.autoPay !== undefined) {
            updateData.autoPay = input.autoPay;
        }
        if (input.usageData !== undefined) {
            updateData.usageData = JSON.parse(JSON.stringify(input.usageData));
        }
        const subscription = await prisma_1.prisma.subscription.update({
            where: { id },
            data: updateData,
            include: {
                service: true,
            },
        });
        // Invalidate caches
        await Promise.all([
            cache_1.cacheService.invalidate(cache_1.CacheKeys.subscription(id)),
            cache_1.cacheService.invalidate(cache_1.CacheKeys.userSubscriptions(existingSubscription.userAddress)),
            cache_1.cacheService.invalidatePattern('stats:*'), // Invalidate all statistics
        ]);
        return subscription;
    }
    /**
     * Delete (deactivate) a subscription (with cache invalidation)
     */
    async deleteSubscription(id) {
        // Get subscription first to get userAddress for cache invalidation
        const existingSubscription = await prisma_1.prisma.subscription.findUnique({
            where: { id },
            select: { userAddress: true },
        });
        if (!existingSubscription) {
            throw new Error('Subscription not found');
        }
        const subscription = await prisma_1.prisma.subscription.update({
            where: { id },
            data: { isActive: false },
        });
        // Invalidate caches
        await Promise.all([
            cache_1.cacheService.invalidate(cache_1.CacheKeys.subscription(id)),
            cache_1.cacheService.invalidate(cache_1.CacheKeys.userSubscriptions(existingSubscription.userAddress)),
            cache_1.cacheService.invalidatePattern('stats:*'), // Invalidate all statistics
        ]);
        return subscription;
    }
    /**
     * Toggle auto-pay for a subscription (with cache invalidation)
     */
    async toggleAutoPay(id) {
        const subscription = await prisma_1.prisma.subscription.findUnique({
            where: { id },
        });
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        const updated = await prisma_1.prisma.subscription.update({
            where: { id },
            data: { autoPay: !subscription.autoPay },
        });
        // Invalidate caches
        await Promise.all([
            cache_1.cacheService.invalidate(cache_1.CacheKeys.subscription(id)),
            cache_1.cacheService.invalidate(cache_1.CacheKeys.userSubscriptions(subscription.userAddress)),
        ]);
        return updated;
    }
    /**
     * Record a payment (with cache invalidation)
     */
    async recordPayment(subscriptionId, amount, transactionHash, network = 'hedera-testnet', status = 'completed', errorMessage) {
        // Update subscription's last payment date and next payment date
        const subscription = await prisma_1.prisma.subscription.findUnique({
            where: { id: subscriptionId },
        });
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        const nextPaymentDate = this.calculateNextPaymentDate(subscription.frequency);
        // Use a transaction to ensure both operations succeed
        const result = await prisma_1.prisma.$transaction([
            prisma_1.prisma.payment.create({
                data: {
                    subscriptionId,
                    amount: new library_1.Decimal(amount),
                    transactionHash,
                    network,
                    status,
                    errorMessage,
                },
            }),
            prisma_1.prisma.subscription.update({
                where: { id: subscriptionId },
                data: {
                    lastPaymentDate: new Date(),
                    nextPaymentDate,
                },
            }),
        ]);
        // Invalidate caches
        await Promise.all([
            cache_1.cacheService.invalidate(cache_1.CacheKeys.subscription(subscriptionId)),
            cache_1.cacheService.invalidate(cache_1.CacheKeys.userSubscriptions(subscription.userAddress)),
            cache_1.cacheService.invalidatePattern(`payments:subscription:${subscriptionId}*`), // Payment history
            cache_1.cacheService.invalidatePattern('stats:*'), // All statistics
        ]);
        return result;
    }
    /**
     * Get payment history for a subscription (with caching)
     */
    async getPaymentHistory(subscriptionId, limit = 50) {
        const cacheKey = cache_1.CacheKeys.paymentHistory(subscriptionId, limit);
        return cache_1.cacheService.getOrSet(cacheKey, async () => {
            const payments = await prisma_1.prisma.payment.findMany({
                where: { subscriptionId },
                orderBy: { timestamp: 'desc' },
                take: limit,
            });
            // Convert Decimal amounts to numbers for JSON serialization
            return payments.map(payment => ({
                ...payment,
                amount: this.decimalToNumber(payment.amount),
            }));
        }, cache_1.CacheTTL.PAYMENT_HISTORY);
    }
    /**
     * Get all services (with caching)
     */
    async getAllServices() {
        const cacheKey = cache_1.CacheKeys.allServices();
        return cache_1.cacheService.getOrSet(cacheKey, async () => {
            const services = await prisma_1.prisma.service.findMany({
                where: { isActive: true },
                orderBy: { createdAt: 'desc' },
            });
            // Convert Decimal to number for JSON serialization
            return services.map(service => ({
                ...service,
                cost: this.decimalToNumber(service.cost),
            }));
        }, cache_1.CacheTTL.ALL_SERVICES);
    }
    /**
     * Create a new service (with cache invalidation)
     */
    async createService(data) {
        const service = await prisma_1.prisma.service.create({
            data: {
                name: data.name,
                description: data.description,
                cost: new library_1.Decimal(data.cost),
                frequency: data.frequency,
                recipientAddress: data.recipientAddress,
            },
        });
        // Invalidate services cache
        await cache_1.cacheService.invalidate(cache_1.CacheKeys.allServices());
        return service;
    }
    /**
     * Calculate next payment date based on frequency
     */
    calculateNextPaymentDate(frequency) {
        const now = new Date();
        const nextDate = new Date(now);
        switch (frequency) {
            case 'weekly':
                nextDate.setDate(now.getDate() + 7);
                break;
            case 'monthly':
                nextDate.setMonth(now.getMonth() + 1);
                break;
            case 'yearly':
                nextDate.setFullYear(now.getFullYear() + 1);
                break;
            default:
                nextDate.setMonth(now.getMonth() + 1); // Default to monthly
        }
        return nextDate;
    }
    /**
     * Convert Decimal to number helper
     */
    decimalToNumber(value) {
        if (typeof value === 'object' && 'toNumber' in value) {
            return value.toNumber();
        }
        if (typeof value === 'string') {
            return parseFloat(value);
        }
        return value;
    }
    // ==================== STATISTICS METHODS ====================
    /**
     * Get revenue statistics by service (with caching)
     */
    async getRevenueByService(startDate, endDate) {
        const cacheKey = cache_1.CacheKeys.revenueByService(startDate?.toISOString(), endDate?.toISOString());
        return cache_1.cacheService.getOrSet(cacheKey, async () => {
            return this.fetchRevenueByServiceInternal(startDate, endDate);
        }, cache_1.CacheTTL.STATISTICS);
    }
    /**
     * Internal method to fetch revenue by service (without cache)
     */
    async fetchRevenueByServiceInternal(startDate, endDate) {
        const whereClause = {
            status: 'completed',
        };
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
            include: {
                subscription: {
                    include: {
                        service: true,
                    },
                },
            },
        });
        // Group by service
        const serviceRevenue = {};
        payments.forEach((payment) => {
            const serviceId = payment.subscription.serviceId;
            const serviceName = payment.subscription.service?.name || 'Unknown Service';
            const amount = this.decimalToNumber(payment.amount);
            if (!serviceRevenue[serviceId]) {
                serviceRevenue[serviceId] = {
                    serviceId,
                    serviceName,
                    totalRevenue: 0,
                    paymentCount: 0,
                    averageAmount: 0,
                };
            }
            serviceRevenue[serviceId].totalRevenue += amount;
            serviceRevenue[serviceId].paymentCount += 1;
        });
        // Calculate averages
        Object.values(serviceRevenue).forEach((service) => {
            service.averageAmount = service.totalRevenue / service.paymentCount;
        });
        return Object.values(serviceRevenue).sort((a, b) => b.totalRevenue - a.totalRevenue);
    }
    /**
     * Get payment success/failure rates (with caching)
     */
    async getPaymentSuccessRates(startDate, endDate) {
        const cacheKey = cache_1.CacheKeys.successRates(startDate?.toISOString(), endDate?.toISOString());
        return cache_1.cacheService.getOrSet(cacheKey, async () => {
            return this.fetchPaymentSuccessRatesInternal(startDate, endDate);
        }, cache_1.CacheTTL.STATISTICS);
    }
    /**
     * Internal method to fetch payment success rates (without cache)
     */
    async fetchPaymentSuccessRatesInternal(startDate, endDate) {
        const whereClause = {};
        if (startDate || endDate) {
            whereClause.timestamp = {};
            if (startDate) {
                whereClause.timestamp.gte = startDate;
            }
            if (endDate) {
                whereClause.timestamp.lte = endDate;
            }
        }
        const payments = await prisma_1.prisma.payment.groupBy({
            by: ['status'],
            where: whereClause,
            _count: {
                id: true,
            },
        });
        const totalPayments = payments.reduce((sum, p) => sum + p._count.id, 0);
        const completed = payments.find((p) => p.status === 'completed')?._count.id || 0;
        const failed = payments.find((p) => p.status === 'failed')?._count.id || 0;
        const pending = payments.find((p) => p.status === 'pending')?._count.id || 0;
        return {
            total: totalPayments,
            completed,
            failed,
            pending,
            successRate: totalPayments > 0 ? (completed / totalPayments) * 100 : 0,
            failureRate: totalPayments > 0 ? (failed / totalPayments) * 100 : 0,
            breakdown: payments.map((p) => ({
                status: p.status,
                count: p._count.id,
                percentage: totalPayments > 0 ? (p._count.id / totalPayments) * 100 : 0,
            })),
        };
    }
    /**
     * Get service breakdown analytics (with caching)
     */
    async getServiceBreakdown(startDate, endDate) {
        const cacheKey = cache_1.CacheKeys.serviceBreakdown(startDate?.toISOString(), endDate?.toISOString());
        return cache_1.cacheService.getOrSet(cacheKey, async () => {
            return this.fetchServiceBreakdownInternal(startDate, endDate);
        }, cache_1.CacheTTL.STATISTICS);
    }
    /**
     * Internal method to fetch service breakdown (without cache)
     */
    async fetchServiceBreakdownInternal(startDate, endDate) {
        const whereClause = {
            status: 'completed',
        };
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
            include: {
                subscription: {
                    include: {
                        service: true,
                    },
                },
            },
        });
        // Group by service with detailed analytics
        const serviceStats = {};
        payments.forEach((payment) => {
            const serviceId = payment.subscription.serviceId;
            const serviceName = payment.subscription.service?.name || 'Unknown Service';
            const amount = this.decimalToNumber(payment.amount);
            const frequency = payment.subscription.frequency;
            const userAddress = payment.subscription.userAddress;
            if (!serviceStats[serviceId]) {
                serviceStats[serviceId] = {
                    serviceId,
                    serviceName,
                    totalRevenue: 0,
                    paymentCount: 0,
                    averageAmount: 0,
                    minAmount: Infinity,
                    maxAmount: 0,
                    uniquePayers: new Set(),
                    frequencyBreakdown: {},
                };
            }
            const stats = serviceStats[serviceId];
            stats.totalRevenue += amount;
            stats.paymentCount += 1;
            stats.minAmount = Math.min(stats.minAmount, amount);
            stats.maxAmount = Math.max(stats.maxAmount, amount);
            stats.uniquePayers.add(userAddress);
            stats.frequencyBreakdown[frequency] = (stats.frequencyBreakdown[frequency] || 0) + 1;
        });
        // Calculate averages and format
        return Object.values(serviceStats).map((stats) => ({
            serviceId: stats.serviceId,
            serviceName: stats.serviceName,
            totalRevenue: stats.totalRevenue,
            paymentCount: stats.paymentCount,
            averageAmount: stats.totalRevenue / stats.paymentCount,
            minAmount: stats.minAmount === Infinity ? 0 : stats.minAmount,
            maxAmount: stats.maxAmount,
            uniquePayers: stats.uniquePayers.size,
            frequencyBreakdown: stats.frequencyBreakdown,
        })).sort((a, b) => b.totalRevenue - a.totalRevenue);
    }
    /**
     * Get payer-specific receipt queries
     */
    async getPayerReceipts(userAddress, options) {
        const whereClause = {
            subscription: {
                userAddress: userAddress.toLowerCase(),
            },
        };
        if (options?.startDate || options?.endDate) {
            whereClause.timestamp = {};
            if (options.startDate) {
                whereClause.timestamp.gte = options.startDate;
            }
            if (options.endDate) {
                whereClause.timestamp.lte = options.endDate;
            }
        }
        if (options?.status) {
            whereClause.status = options.status;
        }
        if (options?.serviceId) {
            whereClause.subscription = {
                ...whereClause.subscription,
                serviceId: options.serviceId,
            };
        }
        const payments = await prisma_1.prisma.payment.findMany({
            where: whereClause,
            include: {
                subscription: {
                    include: {
                        service: true,
                    },
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
            take: options?.limit || 100,
        });
        // Calculate summary statistics
        const totalAmount = payments.reduce((sum, p) => sum + this.decimalToNumber(p.amount), 0);
        const completedPayments = payments.filter((p) => p.status === 'completed');
        const failedPayments = payments.filter((p) => p.status === 'failed');
        return {
            payer: userAddress,
            totalReceipts: payments.length,
            totalAmount,
            completedCount: completedPayments.length,
            failedCount: failedPayments.length,
            receipts: payments.map((payment) => ({
                id: payment.id,
                amount: this.decimalToNumber(payment.amount),
                transactionHash: payment.transactionHash,
                network: payment.network,
                status: payment.status,
                errorMessage: payment.errorMessage,
                timestamp: payment.timestamp,
                service: {
                    id: payment.subscription.serviceId,
                    name: payment.subscription.service?.name || 'Unknown Service',
                },
                subscription: {
                    id: payment.subscriptionId,
                    frequency: payment.subscription.frequency,
                },
            })),
        };
    }
    /**
     * Get recent receipts across all subscriptions
     */
    async getRecentReceipts(limit = 50, options) {
        const whereClause = {};
        if (options?.startDate || options?.endDate) {
            whereClause.timestamp = {};
            if (options.startDate) {
                whereClause.timestamp.gte = options.startDate;
            }
            if (options.endDate) {
                whereClause.timestamp.lte = options.endDate;
            }
        }
        if (options?.status) {
            whereClause.status = options.status;
        }
        if (options?.serviceId) {
            whereClause.subscription = {
                serviceId: options.serviceId,
            };
        }
        if (options?.userAddress) {
            whereClause.subscription = {
                ...whereClause.subscription,
                userAddress: options.userAddress.toLowerCase(),
            };
        }
        const payments = await prisma_1.prisma.payment.findMany({
            where: whereClause,
            include: {
                subscription: {
                    include: {
                        service: true,
                    },
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
            take: limit,
        });
        return payments.map((payment) => ({
            id: payment.id,
            amount: this.decimalToNumber(payment.amount),
            transactionHash: payment.transactionHash,
            network: payment.network,
            status: payment.status,
            errorMessage: payment.errorMessage,
            timestamp: payment.timestamp,
            payer: {
                address: payment.subscription.userAddress,
            },
            service: {
                id: payment.subscription.serviceId,
                name: payment.subscription.service?.name || 'Unknown Service',
            },
            subscription: {
                id: payment.subscriptionId,
                frequency: payment.subscription.frequency,
            },
        }));
    }
    /**
     * Get overall statistics summary (with caching)
     */
    async getStatisticsSummary(startDate, endDate) {
        const cacheKey = cache_1.CacheKeys.statisticsSummary(startDate?.toISOString(), endDate?.toISOString());
        return cache_1.cacheService.getOrSet(cacheKey, async () => {
            return this.fetchStatisticsSummaryInternal(startDate, endDate);
        }, cache_1.CacheTTL.STATISTICS);
    }
    /**
     * Internal method to fetch statistics summary (without cache)
     */
    async fetchStatisticsSummaryInternal(startDate, endDate) {
        const whereClause = {};
        if (startDate || endDate) {
            whereClause.timestamp = {};
            if (startDate) {
                whereClause.timestamp.gte = startDate;
            }
            if (endDate) {
                whereClause.timestamp.lte = endDate;
            }
        }
        const [totalPayments, completedPayments, totalRevenue, serviceCount, uniquePayers] = await Promise.all([
            prisma_1.prisma.payment.count({ where: whereClause }),
            prisma_1.prisma.payment.count({ where: { ...whereClause, status: 'completed' } }),
            prisma_1.prisma.payment.aggregate({
                where: { ...whereClause, status: 'completed' },
                _sum: { amount: true },
            }),
            prisma_1.prisma.service.count({ where: { isActive: true } }),
            prisma_1.prisma.payment.findMany({
                where: { ...whereClause, status: 'completed' },
                select: { subscription: { select: { userAddress: true } } },
                distinct: ['subscriptionId'],
            }),
        ]);
        const revenue = this.decimalToNumber(totalRevenue._sum.amount || 0);
        return {
            totalPayments,
            completedPayments,
            failedPayments: totalPayments - completedPayments,
            successRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0,
            totalRevenue: revenue,
            averagePaymentAmount: completedPayments > 0 ? revenue / completedPayments : 0,
            activeServices: serviceCount,
            uniquePayers: uniquePayers.length,
            period: {
                startDate: startDate || null,
                endDate: endDate || null,
            },
        };
    }
}
exports.SubscriptionService = SubscriptionService;
