# Aluta Frontend

React + Vite + thirdweb app for **Aluta** – subscription management on Hedera testnet with **HBAR** payments.

## Run

```bash
yarn install
yarn dev --host
```

App: **http://localhost:5173**. Backend should be at **http://localhost:5000** (see root **README.md**).

## Environment

Optional **app/.env**:

- `VITE_API_URL` – Backend API base URL (default: `http://localhost:5000/api`)

## Features

- Connect wallet (MetaMask, in-app wallet, etc.) on **Hedera testnet** (Chain ID 296).
- **HBAR balance** in header (native balance via thirdweb).
- Create and manage subscriptions; **Pay** sends native HBAR to the subscription recipient (EOA only).
- Revenue/analytics view; payment history.

## Key files

- **src/App.tsx** – Shell, header (HBARBalance, ConnectButton), tabs (subscriptions / analytics).
- **src/services/subscriptionApi.ts** – API client (base URL from `VITE_API_URL`).
- **src/services/subscriptionService.ts** – Subscription agent, payment flow (calls x402PaymentService).
- **src/services/x402PaymentService.ts** – Hedera config, **native HBAR transfer** (direct send when no facilitator), optional x402 token flow.
- **src/components/** – SubscriptionManager, SubscriptionCard, HBARBalance, PaymentHistoryItem, etc.

Payments use **native HBAR** by default (no facilitator). Recipient must be a **wallet (EOA)** address; see root **SUBSCRIPTION-SYSTEM-README.md**.
