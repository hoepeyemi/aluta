"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const autoPayQueue_1 = require("../queue/autoPayQueue");
const router = express_1.default.Router();
/**
 * GET /api/jobs/:jobId
 * Get job status and results
 */
router.get('/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const status = await (0, autoPayQueue_1.getAutoPayJobStatus)(jobId);
        res.json({ success: true, data: status });
    }
    catch (error) {
        console.error('Error fetching job status:', error);
        res.status(404).json({
            success: false,
            error: error.message || 'Job not found',
        });
    }
});
/**
 * GET /api/jobs/subscription/:subscriptionId
 * Get all jobs for a subscription
 */
router.get('/subscription/:subscriptionId', async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const jobs = await (0, autoPayQueue_1.getJobsForSubscription)(subscriptionId);
        const jobStatuses = await Promise.all(jobs.map(async (job) => {
            const status = await (0, autoPayQueue_1.getAutoPayJobStatus)(job.id.toString());
            return {
                jobId: job.id.toString(),
                ...status,
                createdAt: new Date(job.timestamp),
            };
        }));
        res.json({ success: true, data: jobStatuses });
    }
    catch (error) {
        console.error('Error fetching subscription jobs:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch jobs',
        });
    }
});
exports.default = router;
