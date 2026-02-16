# Aluta

Crypto-based subscription management platform on **Hedera testnet**. Create services, subscribe with your wallet, and pay in **HBAR** (native Hedera token).

## Overview

- **Frontend (React + Vite + thirdweb)** – Connect wallet (MetaMask, in-app wallet, etc.), view HBAR balance, manage subscriptions, pay with native HBAR.
- **Backend (Node.js + Express + Prisma)** – REST API for subscriptions, services, payments, statistics, and auto-pay queue (Redis + Bull).
- **Chain** – Hedera Testnet (Chain ID 296, RPC: Hashio).

All amounts and costs are in **HBAR**. Payments use **native HBAR transfer** (no facilitator required); recipient must be a wallet (EOA) address.

## Quick Start

### 1. Backend

```bash
cd backend
yarn install
cp .env.example .env   # or create .env (see backend/ENVIRONMENT_SETUP.md)
# Set DATABASE_URL and REDIS_URL (or REDIS_* vars) in .env
npx prisma migrate deploy
yarn dev
```

Backend runs at `http://localhost:5000`.

### 2. Frontend

```bash
cd app
yarn install
# Optional: create app/.env with VITE_API_URL=http://localhost:5000/api
yarn dev --host
```

App runs at `http://localhost:5173`. Connect a Hedera testnet wallet and use the subscription manager.

### 3. Environment summary

| Where   | Variable           | Purpose                          |
|---------|--------------------|----------------------------------|
| Backend | `DATABASE_URL`     | PostgreSQL (required)            |
| Backend | `REDIS_URL`        | Redis for queue (required)       |
| Backend | `PORT`             | Server port (default 5000)       |
| App     | `VITE_API_URL`     | Backend API base (default local) |

See **backend/ENVIRONMENT_SETUP.md** and **SUBSCRIPTION-SYSTEM-README.md** for full env and configuration.

## Project structure

```
aluta/
├── app/                    # Frontend (React, Vite, thirdweb)
│   ├── src/
│   │   ├── components/     # HBARBalance, SubscriptionManager, etc.
│   │   ├── services/       # subscriptionApi, subscriptionService, x402PaymentService
│   │   └── pages/
│   └── package.json
├── backend/                # API and workers
│   ├── src/
│   │   ├── index.ts        # Express app, subscription/services/jobs/statistics routes
│   │   ├── routes/         # subscriptions, services, jobs, statistics, failedPayments
│   │   ├── services/       # subscriptionService, paymentScheduler, failedPaymentTracker
│   │   ├── queue/          # autoPayQueue, autoPayWorker
│   │   └── utils/          # config (Hedera), utils, cache
│   ├── prisma/             # schema, migrations
│   └── package.json
├── BACKEND-SETUP-GUIDE.md
├── SUBSCRIPTION-SYSTEM-README.md
└── README.md               # This file
```

## Key documentation

- **BACKEND-SETUP-GUIDE.md** – Run backend, endpoints, troubleshooting.
- **backend/ENVIRONMENT_SETUP.md** – Backend env vars (DB, Redis, optional wallet/RPC).
- **SUBSCRIPTION-SYSTEM-README.md** – Subscription system, payment flow, HBAR, API details.
- **DATABASE_SETUP.md** – PostgreSQL and Prisma migrations.

## Network (Hedera testnet)

- **Chain ID:** 296  
- **RPC:** https://testnet.hashio.io/api  
- **Explorer:** https://hashscan.io/testnet  
- **Native token:** HBAR (18 decimals in EVM `value`)

Recipient addresses for subscriptions must be **wallet (EOA)** addresses; direct HBAR transfers to contracts may revert on Hedera.
