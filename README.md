# Aluta

**DeFi & Tokenization** — Crypto subscription management on Hedera with native HBAR payments.

---

## Project Description

Aluta is a crypto-based subscription management platform built on the **Hedera** blockchain. Users create and manage recurring subscriptions to services and pay in **native HBAR** (no stablecoin required). The app supports manual “Pay Now” and optional auto-pay, with payments sent as direct HBAR transfers on Hedera testnet. A Node.js/Express backend stores subscriptions and payment history, runs a Redis/Bull queue for scheduled payments, and exposes REST APIs for the React frontend. The frontend uses Thirdweb and ethers for wallet connection and transaction signing on Hedera EVM.

---

## Hackathon Track

**DeFi & Tokenization**

---

## Demo

| | |
|---|---|
| **Live demo** | [https://glittery-alpaca-76b271.netlify.app/](https://glittery-alpaca-76b271.netlify.app/) |
| **Demo video** | [https://youtu.be/xI_zSQ7vCgM](https://youtu.be/xI_zSQ7vCgM) |

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** (build tooling)
- **Thirdweb** (wallet connection, Hedera chain)
- **ethers.js** (transactions, EIP-712, native HBAR transfer)
- **Tailwind CSS** (styling)
- **Axios** (API client)

### Backend
- **Node.js** + **Express**
- **Prisma** (ORM)
- **PostgreSQL** (database)
- **Redis** (caching + job queue)
- **Bull** (payment job queue, retries)
- **TypeScript**

### Blockchain & infra
- **Hedera Testnet** (chain ID 296)
- **Hashio RPC** (`https://testnet.hashio.io/api`)
- **HashScan** (block explorer)
- **Native HBAR** (payments; optional x402/facilitator for token flows)

### Services & tooling
- **Vercel / Netlify** (frontend hosting)
- **Yarn** (package manager)

---

## Implementation Overview

- **Chain**: Hedera testnet only (config and UI use Hedera RPC, explorer, and HBAR).
- **Payments**: Native HBAR sent via simple value transfer (EOA → EOA). No facilitator required; optional x402/token path when a facilitator URL and token address are set.
- **Subscriptions**: Stored in PostgreSQL; cost and amounts are in HBAR. Frontend shows HBAR balance (native) and subscription costs in HBAR.
- **Backend**: REST API for subscriptions, services, payments, statistics, and failed-payment tracking. Payment scheduler enqueues due subscriptions; Bull worker processes jobs (recording success/failure).
- **Frontend**: Connect wallet (e.g. MetaMask) on Hedera testnet, create/manage subscriptions, pay with HBAR, view payment history and analytics.

See [SUBSCRIPTION-SYSTEM-README.md](./SUBSCRIPTION-SYSTEM-README.md) for full subscription and payment flow documentation, and [BACKEND-SETUP-GUIDE.md](./BACKEND-SETUP-GUIDE.md) for running the backend.

---

## Quick Start

### Backend
```bash
cd backend
yarn install
cp .env.example .env   # set DATABASE_URL, REDIS_URL, etc.
npx prisma migrate deploy
yarn dev
```

### Frontend
```bash
cd app
yarn install
echo "VITE_API_URL=http://localhost:5000/api" > .env
yarn dev
```

---

## License

Part of the Aluta project; see repository license terms.
