import { Decimal } from '@prisma/client/runtime/library';
export interface CreateSubscriptionInput {
    serviceId?: string;
    serviceName?: string;
    cost: number;
    frequency: 'monthly' | 'weekly' | 'yearly';
    recipientAddress: string;
    userAddress: string;
    autoPay?: boolean;
    usageData?: {
        lastUsed?: Date;
        usageCount?: number;
        avgUsagePerMonth?: number;
    };
}
export interface UpdateSubscriptionInput {
    serviceId?: string;
    serviceName?: string;
    cost?: number;
    frequency?: 'monthly' | 'weekly' | 'yearly';
    recipientAddress?: string;
    autoPay?: boolean;
    usageData?: {
        lastUsed?: Date;
        usageCount?: number;
        avgUsagePerMonth?: number;
    };
}
export declare class SubscriptionService {
    /**
     * Get all subscriptions for a user (with caching)
     */
    getUserSubscriptions(userAddress: string): Promise<{
        cost: number;
        service: {
            cost: number;
            id: string;
            frequency: string;
            recipientAddress: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        } | null;
        payments: {
            amount: number;
            status: string;
            id: string;
            timestamp: Date;
            subscriptionId: string;
            transactionHash: string;
            network: string;
            errorMessage: string | null;
        }[];
        id: string;
        serviceId: string;
        userAddress: string;
        frequency: string;
        recipientAddress: string;
        lastPaymentDate: Date | null;
        nextPaymentDate: Date;
        isActive: boolean;
        autoPay: boolean;
        usageData: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    /**
     * Get a single subscription by ID (with caching)
     */
    getSubscription(id: string): Promise<{
        cost: number;
        service: {
            cost: number;
            id: string;
            frequency: string;
            recipientAddress: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        } | null;
        payments: {
            amount: number;
            status: string;
            id: string;
            timestamp: Date;
            subscriptionId: string;
            transactionHash: string;
            network: string;
            errorMessage: string | null;
        }[];
        id: string;
        serviceId: string;
        userAddress: string;
        frequency: string;
        recipientAddress: string;
        lastPaymentDate: Date | null;
        nextPaymentDate: Date;
        isActive: boolean;
        autoPay: boolean;
        usageData: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    /**
     * Create a new subscription (with cache invalidation)
     */
    createSubscription(input: CreateSubscriptionInput): Promise<{
        service: {
            id: string;
            cost: Decimal;
            frequency: string;
            recipientAddress: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
    } & {
        id: string;
        serviceId: string;
        userAddress: string;
        cost: Decimal;
        frequency: string;
        recipientAddress: string;
        lastPaymentDate: Date | null;
        nextPaymentDate: Date;
        isActive: boolean;
        autoPay: boolean;
        usageData: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Update a subscription (with cache invalidation)
     */
    updateSubscription(id: string, input: UpdateSubscriptionInput): Promise<{
        service: {
            id: string;
            cost: Decimal;
            frequency: string;
            recipientAddress: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
    } & {
        id: string;
        serviceId: string;
        userAddress: string;
        cost: Decimal;
        frequency: string;
        recipientAddress: string;
        lastPaymentDate: Date | null;
        nextPaymentDate: Date;
        isActive: boolean;
        autoPay: boolean;
        usageData: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Delete (deactivate) a subscription (with cache invalidation)
     */
    deleteSubscription(id: string): Promise<{
        id: string;
        serviceId: string;
        userAddress: string;
        cost: Decimal;
        frequency: string;
        recipientAddress: string;
        lastPaymentDate: Date | null;
        nextPaymentDate: Date;
        isActive: boolean;
        autoPay: boolean;
        usageData: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Toggle auto-pay for a subscription (with cache invalidation)
     */
    toggleAutoPay(id: string): Promise<{
        id: string;
        serviceId: string;
        userAddress: string;
        cost: Decimal;
        frequency: string;
        recipientAddress: string;
        lastPaymentDate: Date | null;
        nextPaymentDate: Date;
        isActive: boolean;
        autoPay: boolean;
        usageData: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Record a payment (with cache invalidation)
     */
    recordPayment(subscriptionId: string, amount: number, transactionHash: string, network?: string, status?: string, errorMessage?: string): Promise<[{
        status: string;
        id: string;
        timestamp: Date;
        subscriptionId: string;
        amount: Decimal;
        transactionHash: string;
        network: string;
        errorMessage: string | null;
    }, {
        id: string;
        serviceId: string;
        userAddress: string;
        cost: Decimal;
        frequency: string;
        recipientAddress: string;
        lastPaymentDate: Date | null;
        nextPaymentDate: Date;
        isActive: boolean;
        autoPay: boolean;
        usageData: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }]>;
    /**
     * Get payment history for a subscription (with caching)
     */
    getPaymentHistory(subscriptionId: string, limit?: number): Promise<{
        amount: number;
        status: string;
        id: string;
        timestamp: Date;
        subscriptionId: string;
        transactionHash: string;
        network: string;
        errorMessage: string | null;
    }[]>;
    /**
     * Get all services (with caching)
     */
    getAllServices(): Promise<{
        cost: number;
        id: string;
        frequency: string;
        recipientAddress: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }[]>;
    /**
     * Create a new service (with cache invalidation)
     */
    createService(data: {
        name: string;
        description?: string;
        cost: number;
        frequency: string;
        recipientAddress: string;
    }): Promise<{
        id: string;
        cost: Decimal;
        frequency: string;
        recipientAddress: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }>;
    /**
     * Calculate next payment date based on frequency
     */
    private calculateNextPaymentDate;
    /**
     * Convert Decimal to number helper
     */
    private decimalToNumber;
    /**
     * Get revenue statistics by service (with caching)
     */
    getRevenueByService(startDate?: Date, endDate?: Date): Promise<{
        serviceId: string;
        serviceName: string;
        totalRevenue: number;
        paymentCount: number;
        averageAmount: number;
    }[]>;
    /**
     * Internal method to fetch revenue by service (without cache)
     */
    private fetchRevenueByServiceInternal;
    /**
     * Get payment success/failure rates (with caching)
     */
    getPaymentSuccessRates(startDate?: Date, endDate?: Date): Promise<{
        total: number;
        completed: number;
        failed: number;
        pending: number;
        successRate: number;
        failureRate: number;
        breakdown: {
            status: string;
            count: number;
            percentage: number;
        }[];
    }>;
    /**
     * Internal method to fetch payment success rates (without cache)
     */
    private fetchPaymentSuccessRatesInternal;
    /**
     * Get service breakdown analytics (with caching)
     */
    getServiceBreakdown(startDate?: Date, endDate?: Date): Promise<{
        serviceId: string;
        serviceName: string;
        totalRevenue: number;
        paymentCount: number;
        averageAmount: number;
        minAmount: number;
        maxAmount: number;
        uniquePayers: number;
        frequencyBreakdown: Record<string, number>;
    }[]>;
    /**
     * Internal method to fetch service breakdown (without cache)
     */
    private fetchServiceBreakdownInternal;
    /**
     * Get payer-specific receipt queries
     */
    getPayerReceipts(userAddress: string, options?: {
        startDate?: Date;
        endDate?: Date;
        status?: string;
        serviceId?: string;
        limit?: number;
    }): Promise<{
        payer: string;
        totalReceipts: number;
        totalAmount: number;
        completedCount: number;
        failedCount: number;
        receipts: {
            id: string;
            amount: number;
            transactionHash: string;
            network: string;
            status: string;
            errorMessage: string | null;
            timestamp: Date;
            service: {
                id: string;
                name: string;
            };
            subscription: {
                id: string;
                frequency: string;
            };
        }[];
    }>;
    /**
     * Get recent receipts across all subscriptions
     */
    getRecentReceipts(limit?: number, options?: {
        startDate?: Date;
        endDate?: Date;
        status?: string;
        serviceId?: string;
        userAddress?: string;
    }): Promise<{
        id: string;
        amount: number;
        transactionHash: string;
        network: string;
        status: string;
        errorMessage: string | null;
        timestamp: Date;
        payer: {
            address: string;
        };
        service: {
            id: string;
            name: string;
        };
        subscription: {
            id: string;
            frequency: string;
        };
    }[]>;
    /**
     * Get overall statistics summary (with caching)
     */
    getStatisticsSummary(startDate?: Date, endDate?: Date): Promise<{
        totalPayments: number;
        completedPayments: number;
        failedPayments: number;
        successRate: number;
        totalRevenue: number;
        averagePaymentAmount: number;
        activeServices: number;
        uniquePayers: number;
        period: {
            startDate: Date | null;
            endDate: Date | null;
        };
    }>;
    /**
     * Internal method to fetch statistics summary (without cache)
     */
    private fetchStatisticsSummaryInternal;
}
//# sourceMappingURL=subscriptionService.d.ts.map