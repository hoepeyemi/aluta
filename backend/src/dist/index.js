"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const services_1 = __importDefault(require("./routes/services"));
require("./queue/autoPayWorker"); // Initialize auto-pay worker
const paymentScheduler_1 = require("./services/paymentScheduler");
// Load environment variables
dotenv_1.default.config();
// Test database connection on startup
const prisma_1 = require("./lib/prisma");
async function testDatabaseConnection() {
    try {
        // Test connection with a simple query
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        console.log('✅ Database connected successfully');
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        if (error.code === 'P1001') {
            console.error('\n📋 Troubleshooting steps:');
            console.error('1. Check if your Aiven database is running (not paused)');
            console.error('2. Verify the DATABASE_URL in your .env file');
            console.error('3. Check if your IP is whitelisted in Aiven firewall settings');
            console.error('4. Try using the connection pooler URL (port 10189) instead of direct connection');
            console.error('5. Verify network connectivity to the database host');
            if (process.env.DATABASE_URL) {
                try {
                    const url = new URL(process.env.DATABASE_URL);
                    console.error(`\nCurrent connection: ${url.hostname}:${url.port}`);
                }
                catch {
                    console.error('\nDATABASE_URL format might be incorrect');
                }
            }
        }
        else if (error.code === 'P1017') {
            console.error('\n📋 Server closed the connection. Possible causes:');
            console.error('1. Database server is overloaded');
            console.error('2. Connection timeout - try using connection pooler');
            console.error('3. Too many connections - check connection limits');
        }
        return false;
    }
}
// Test connection asynchronously (don't block server startup)
testDatabaseConnection();
const app = (0, express_1.default)();
// Parse command-line arguments for port
function getPortFromArgs() {
    const args = process.argv.slice(2);
    const portIndex = args.findIndex(arg => arg === '-p' || arg === '--port');
    if (portIndex !== -1 && args[portIndex + 1]) {
        return parseInt(args[portIndex + 1], 10);
    }
    return null;
}
const PORT = getPortFromArgs() || parseInt(process.env.PORT || '5000', 10);
// Middleware
app.use((0, cors_1.default)({ origin: '*' }));
app.use(body_parser_1.default.json());
// API Routes
app.use('/api/subscriptions', subscriptions_1.default);
app.use('/api/services', services_1.default);
// Import and use jobs routes
const jobs_1 = __importDefault(require("./routes/jobs"));
app.use('/api/jobs', jobs_1.default);
// Import and use statistics routes
const statistics_1 = __importDefault(require("./routes/statistics"));
app.use('/api/statistics', statistics_1.default);
// Import and use failed payments routes
const failedPayments_1 = __importDefault(require("./routes/failedPayments"));
app.use('/api/failed-payments', failedPayments_1.default);
// Health check endpoint
app.get('/health', async (_req, res) => {
    try {
        // Test database connection
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        // Test Redis connection (hardcoded in autoPayQueue.ts)
        let redisStatus = 'unknown';
        try {
            const { autoPayQueue } = await Promise.resolve().then(() => __importStar(require('./queue/autoPayQueue')));
            const queue = autoPayQueue(); // Call the getter function
            const client = queue.client;
            await client.ping();
            redisStatus = 'connected';
        }
        catch (redisError) {
            redisStatus = `disconnected: ${redisError.message}`;
        }
        res.json({
            status: 'healthy',
            database: 'connected',
            redis: redisStatus,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
// Default route (optional)
app.get('/', (_req, res) => {
    res.json({
        message: '✅ Smart Subscription Manager backend is running!',
        version: '1.0.0',
        endpoints: {
            subscriptions: '/api/subscriptions',
            services: '/api/services',
            jobs: '/api/jobs',
            statistics: '/api/statistics',
            failedPayments: '/api/failed-payments',
            health: '/health',
        }
    });
});
// 404 handler - return JSON instead of HTML
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: 'The requested endpoint does not exist. Check the root path for available endpoints.'
    });
});
// Error handler
app.use((err, _req, res, _next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message || 'An unexpected error occurred'
    });
});
// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running at http://localhost:${PORT}`);
    // Start payment scheduler (checks every 5 minutes)
    // Requires Redis configuration in .env file
    const redisUrl = process.env.REDIS_URL ||
        (process.env.REDIS_USERNAME && process.env.REDIS_PASSWORD && process.env.REDIS_HOST && process.env.REDIS_PORT);
    if (redisUrl) {
        try {
            const schedulerInterval = (0, paymentScheduler_1.startPaymentScheduler)(5);
            console.log('✅ Payment scheduler started');
            // Clean up on shutdown
            process.on('SIGTERM', () => {
                clearInterval(schedulerInterval);
                console.log('Payment scheduler stopped');
            });
            process.on('SIGINT', () => {
                clearInterval(schedulerInterval);
                console.log('Payment scheduler stopped');
            });
        }
        catch (error) {
            console.error('❌ Failed to start payment scheduler:', error.message);
            console.warn('⚠️  Payment scheduler disabled - check Redis configuration');
        }
    }
    else {
        console.warn('⚠️  Redis configuration not found - payment scheduler disabled');
        console.warn('   Please set REDIS_URL or REDIS_USERNAME, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT in .env file');
    }
});
