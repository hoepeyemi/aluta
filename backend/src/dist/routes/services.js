"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const subscriptionService_1 = require("../services/subscriptionService");
const router = express_1.default.Router();
const subscriptionService = new subscriptionService_1.SubscriptionService();
// Get all services
router.get('/', async (req, res) => {
    try {
        const services = await subscriptionService.getAllServices();
        res.json({ success: true, data: services });
    }
    catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch services',
        });
    }
});
// Create a new service
router.post('/', async (req, res) => {
    try {
        const service = await subscriptionService.createService(req.body);
        res.status(201).json({ success: true, data: service });
    }
    catch (error) {
        console.error('Error creating service:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to create service',
        });
    }
});
exports.default = router;
