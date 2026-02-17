# Subscription System Documentation

**Part of [Aluta](README.md)** — DeFi & tokenization track. [Live demo](https://glittery-alpaca-76b271.netlify.app/) · [Demo video](https://youtu.be/xI_zSQ7vCgM) · [Pitch deck](https://drive.google.com/file/d/1jzgKP_kWKUegTJZzhZk9XcdK1WTU_ZtM/view?usp=sharing)

## Current implementation

- **Chain**: Hedera testnet (RPC: Hashio; explorer: HashScan).
- **Payments**: Native **HBAR** only. Payments are direct EOA-to-EOA value transfers (no facilitator or ERC-20 required). Optional x402/token path when `VITE_FACILITATOR_URL` and a token address are set.
- **UI**: All amounts and balance are in HBAR. Recipient must be a wallet (EOA) address; transfers to contract addresses are blocked with a clear error.

## Overview

The Aluta subscription system is a comprehensive crypto-based subscription management platform built on the Hedera blockchain. It enables users to create, manage, and automate payments for recurring services using HBAR (native Hedera token).

## Architecture

The subscription system consists of three main layers:

1. **Frontend (React/TypeScript)** - User interface for subscription management
2. **Backend (Node.js/Express/Prisma)** - API server and business logic
3. **Infrastructure (PostgreSQL/Redis/Bull Queue)** - Data persistence and job processing

## Core Components

### Database Schema

The system uses PostgreSQL with the following main entities:

#### Service Model
```prisma
model Service {
  id                String   @id @default(cuid())
  name              String
  description       String?
  cost              Decimal   @db.Decimal(18, 6) // Cost in HBAR (6 decimals)
  frequency         String   // monthly, weekly, yearly
  recipientAddress  String   // Service provider wallet address
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  subscriptions     Subscription[]
}
```

#### Subscription Model
```prisma
model Subscription {
  id                String   @id @default(cuid())
  serviceId         String
  userAddress       String   // User's wallet address
  cost              Decimal   @db.Decimal(18, 6) // Cost in HBAR
  frequency         String   // monthly, weekly, yearly
  recipientAddress  String   // Service provider wallet address
  lastPaymentDate   DateTime?
  nextPaymentDate   DateTime
  isActive          Boolean  @default(true)
  autoPay           Boolean  @default(false)
  usageData         Json?    // { lastUsed, usageCount, avgUsagePerMonth }
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  service           Service   @relation(fields: [serviceId], references: [id])
  payments          Payment[]
}
```

#### Payment Model
```prisma
model Payment {
  id                String   @id @default(cuid())
  subscriptionId   String
  amount            Decimal   @db.Decimal(18, 6) // Amount paid in HBAR
  transactionHash  String   @unique
  network           String   @default("hedera-testnet")
  status            String   @default("completed") // completed, failed, pending
  errorMessage      String?
  timestamp         DateTime @default(now())
  subscription      Subscription @relation(fields: [subscriptionId], references: [id])
}
```

## Backend Services

### 1. SubscriptionService (`backend/src/services/subscriptionService.ts`)

The main business logic service that handles:

- **CRUD Operations**: Create, read, update, delete subscriptions
- **Payment Processing**: Record successful/failed payments
- **Caching**: Redis-based caching for performance optimization
- **Statistics**: Revenue analytics and payment success rates

#### Key Methods:
- `getUserSubscriptions(userAddress)` - Get all user subscriptions
- `createSubscription(input)` - Create new subscription
- `recordPayment(subscriptionId, amount, txHash)` - Record payment
- `getRevenueByService(startDate, endDate)` - Revenue analytics
- `getPaymentSuccessRates(startDate, endDate)` - Success rate analytics

### 2. Payment Scheduler (`backend/src/services/paymentScheduler.ts`)

Automated system that:
- Scans for due subscriptions every 5 minutes
- Queues auto-pay jobs for processing
- Prevents duplicate payments

#### Key Methods:
- `checkAndQueueDuePayments()` - Find and queue due subscriptions
- `startPaymentScheduler(intervalMinutes)` - Start the scheduler

### 3. Auto-Pay Queue System (`backend/src/queue/`)

#### Queue Configuration (`autoPayQueue.ts`)
- Uses Bull queue with Redis backend
- Configurable retry logic (5 attempts with exponential backoff)
- Job timeout of 5 minutes
- Comprehensive error handling and logging

#### Worker (`autoPayWorker.ts`)
- Processes payment jobs from the queue
- Implements error categorization and retry logic
- Tracks failed payments for analysis
- Integrates with x402 payment protocol

#### Job Data Structure:
```typescript
interface AutoPayJobData {
  subscriptionId: string;
  userAddress: string;
  amount: number;
  recipientAddress: string;
  serviceName: string;
}
```

### 4. Failed Payment Tracker (`backend/src/services/failedPaymentTracker.ts`)

Tracks and analyzes payment failures:
- Categorizes errors (network, wallet, insufficient funds, etc.)
- Implements retry logic with exponential backoff
- Prevents infinite retry loops
- Provides analytics on failure patterns

## Frontend Components

### 1. SubscriptionAgent (`app/src/services/subscriptionService.ts`)

Main frontend service class that:
- Manages local subscription state
- Handles x402 payment protocol integration
- Provides AI-powered subscription suggestions
- Manages payment history tracking

#### Key Features:
- **Auto-Pay Management**: Automatic payment processing
- **AI Suggestions**: Identifies unused/low-usage subscriptions
- **Usage Analytics**: Tracks subscription usage patterns
- **Payment History**: Maintains local payment records

### 2. SubscriptionManager (`app/src/components/SubscriptionManager.tsx`)

Main UI component that:
- Displays subscription statistics
- Manages subscription CRUD operations
- Handles manual and automatic payments
- Shows AI-powered suggestions
- Displays payment history

#### Features:
- Real-time subscription status
- Auto-management toggle
- Payment history visualization
- Usage analytics display

### 3. SubscriptionCard (`app/src/components/SubscriptionCard.tsx`)

Individual subscription display component with:
- Payment due status indicators
- Usage information display
- Action buttons (pay, edit, cancel, toggle auto-pay)
- Cost and frequency information

### 4. API Integration (`app/src/services/subscriptionApi.ts`)

HTTP client for backend communication:
- RESTful API calls
- Statistics data fetching
- Payment history retrieval
- Failed payment tracking

## API Endpoints

### Subscription Routes (`/api/subscriptions`)

- `GET /user/:userAddress` - Get user subscriptions
- `GET /:id` - Get single subscription
- `POST /` - Create subscription
- `PUT /:id` - Update subscription
- `DELETE /:id` - Delete subscription
- `PATCH /:id/auto-pay` - Toggle auto-pay
- `POST /:id/payments` - Record payment
- `GET /:id/payments` - Get payment history
- `POST /:id/trigger-payment` - Manual payment trigger

### Statistics Routes (`/api/statistics`)

- `GET /summary` - Overall statistics
- `GET /revenue-by-service` - Revenue by service
- `GET /success-rates` - Payment success rates
- `GET /service-breakdown` - Detailed service analytics
- `GET /receipts/recent` - Recent receipts
- `GET /receipts/payer/:userAddress` - User-specific receipts

### Failed Payments Routes (`/api/failed-payments`)

- `GET /subscription/:subscriptionId` - Failed payments for subscription
- `GET /stats` - Failed payment statistics

## Payment Processing

### Native HBAR (default)

Payments use **native HBAR** on Hedera testnet:

1. **Payment requirements**: Amount (in HBAR, 18 decimals for EVM value), recipient EOA address, network.
2. **Transfer**: Frontend sends a simple value transfer (no token contract). Recipient must be a wallet (EOA); contracts are rejected with a clear error.
3. **Recording**: Transaction hash and status are stored via the backend API.
4. **Gas**: Simple transfers use a 21,000 gas limit.

### Optional x402 / token flow

When a facilitator URL and token asset are configured, the app can use the x402 protocol for token-based payments instead of native HBAR.

### Payment flow

1. **Manual payment**
   - User clicks "Pay Now"
   - Frontend builds payment requirements (recipient, amount in HBAR)
   - Native HBAR transfer is sent from the connected wallet
   - Backend records the transaction

2. **Auto-payment**
   - Scheduler finds due subscriptions
   - Jobs are queued (Bull/Redis)
   - Worker processes payments (backend records success/failure)

### Error Handling

Payment errors are categorized and handled:

- **Network Errors**: Retry with exponential backoff
- **Insufficient Funds**: User notification required
- **Wallet Errors**: Manual intervention needed
- **Service Errors**: Temporary retry with limits

## Caching Strategy

Redis-based caching implementation:

- **User Subscriptions**: 5-minute TTL
- **Individual Subscriptions**: 10-minute TTL
- **Payment History**: 15-minute TTL
- **Statistics**: 30-minute TTL
- **Services List**: 1-hour TTL

Cache invalidation occurs on:
- Subscription creation/update/deletion
- Payment recording
- Service modifications

## AI-Powered Features

### Subscription Suggestions

The system provides intelligent suggestions:

1. **Unused Subscriptions**: Identifies subscriptions not used in 30 days
2. **Low Usage**: Flags subscriptions with <5 uses per month
3. **Cost Savings**: Calculates potential savings from cancellations

### Usage Analytics

Tracks subscription usage patterns:
- Last used date
- Usage frequency
- Monthly averages
- Cost optimization opportunities

## Configuration

### Environment Variables

#### Backend
```env
# Database
DATABASE_URL=postgresql://...

# Redis (for queue and caching)
REDIS_URL=redis://username:password@host:port
# or
REDIS_USERNAME=username
REDIS_PASSWORD=password
REDIS_HOST=host
REDIS_PORT=port

# x402 Configuration
FACILITATOR_URL=<your-hedera-x402-facilitator-url-if-applicable>
# Payment asset (optional; native HBAR used on Hedera)
# PAYMENT_ASSET_TESTNET=0x...
```

#### Frontend
```env
VITE_API_URL=http://localhost:5000/api
```

## Security Considerations

1. **Wallet Security**: Private keys never stored on backend
2. **Transaction Validation**: All transactions validated on-chain
3. **Rate Limiting**: API endpoints rate-limited
4. **Input Validation**: All inputs sanitized and validated
5. **Error Sanitization**: Sensitive information excluded from error messages

## Monitoring and Logging

### Log Categories
- `[SUBSCRIPTION_SERVICE]` - Subscription operations
- `[PAYMENT_SCHEDULER]` - Scheduled payment processing
- `[AUTO_PAY_QUEUE]` - Queue operations
- `[AUTO_PAY_WORKER]` - Payment job processing

### Metrics Tracked
- Payment success/failure rates
- Queue processing times
- Cache hit/miss ratios
- API response times
- Error frequencies

## Deployment

### Prerequisites
- PostgreSQL database
- Redis server
- Node.js 18+
- Hedera testnet access

### Setup Steps
1. Configure environment variables
2. Run database migrations: `npx prisma migrate deploy`
3. Start backend: `npm start`
4. Start frontend: `npm run dev`
5. Monitor queue processing in logs

## Future Enhancements

1. **Multi-Asset Support**: Support for multiple cryptocurrencies
2. **Advanced Analytics**: Machine learning for usage prediction
3. **Mobile App**: React Native mobile application
4. **Service Marketplace**: Public service discovery platform
5. **Subscription Templates**: Pre-configured subscription types

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Verify Redis configuration
   - Check network connectivity
   - Validate credentials

2. **Payment Failures**
   - Check HBAR balance
   - Verify wallet connection
   - Review transaction logs

3. **Queue Not Processing**
   - Ensure Redis is running
   - Check worker logs
   - Verify job data integrity

### Debug Commands

```bash
# Check queue status
curl http://localhost:5000/api/queue/status

# View failed payments
curl http://localhost:5000/api/failed-payments/stats

# Test subscription creation
curl -X POST http://localhost:5000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"serviceName":"Test","cost":0.01,"frequency":"monthly","recipientAddress":"0x...","userAddress":"0x..."}'
```

## Contributing

When contributing to the subscription system:

1. Follow existing code patterns and TypeScript conventions
2. Add comprehensive error handling
3. Update documentation for new features
4. Include unit tests for new functionality
5. Test payment flows thoroughly

## License

This subscription system is part of the Aluta project and follows the project's licensing terms.
