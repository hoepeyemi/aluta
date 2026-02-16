"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const failedPaymentTracker_1 = require("../services/failedPaymentTracker");
const router = express_1.default.Router();
/**
 * GET /api/failed-payments/subscription/:subscriptionId
 * Get failed payments for a subscription
 */
router.get('/subscription/:subscriptionId', async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const failedPayments = await failedPaymentTracker_1.failedPaymentTracker.getFailedPayments(subscriptionId, limit);
        res.json({
            success: true,
            data: {
                subscriptionId,
                failedPayments,
                count: failedPayments.length,
            },
        });
    }
    catch (error) {
        console.error('Error fetching failed payments:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch failed payments',
        });
    }
});
/**
 * GET /api/failed-payments/stats
 * Get failed payment statistics
 * Query params: userAddress, startDate, endDate
 */
router.get('/stats', async (req, res) => {
    try {
        const userAddress = req.query.userAddress;
        const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
        const stats = await failedPaymentTracker_1.failedPaymentTracker.getFailedPaymentStats(userAddress, startDate, endDate);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error('Error fetching failed payment stats:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch failed payment statistics',
        });
    }
});
exports.default = router;
