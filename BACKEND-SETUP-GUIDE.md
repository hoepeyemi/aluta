# Backend Setup & Troubleshooting Guide

Backend for **Aluta**: subscription and payment API on Hedera testnet. Uses Express, Prisma (PostgreSQL), Redis, and Bull for the auto-pay queue.

## How to Run Backend

### Step 1: Install Dependencies

```bash
cd backend
yarn install
```

### Step 2: Environment Variables

Create a `.env` file in `backend/` with at least:

```env
# Required
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://localhost:6379
# Or: REDIS_USERNAME, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT

# Optional
PORT=5000
RPC_PROVIDER_URL=https://testnet.hashio.io/api
WALLET_PRIVATE_KEY=0x...
```

See **backend/ENVIRONMENT_SETUP.md** for full list (DB, Redis, wallet, RPC, Yakoa, etc.).

### Step 3: Database

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### Step 4: Build (optional, for production)

```bash
cd backend
yarn build
```

Build uses `tsc -p src/tsconfig.json` and outputs to `backend/src/dist`. Script-only files under `utils/functions` (e.g. createSpgNftCollection, uploadToIpfs) are excluded.

### Step 5: Start Backend

```bash
cd backend
yarn dev
# Or: yarn start
```

**Expected output:**

```
✅ Database connected successfully
🚀 Backend server running at http://localhost:5000
✅ Payment scheduler started
```

## API Endpoints

| Path | Description |
|------|-------------|
| `GET /` | Service info and list of endpoints |
| `GET /health` | Health check (DB + Redis) |
| `GET/POST /api/subscriptions/*` | Subscriptions CRUD, payments |
| `GET/POST /api/services` | Services list and create |
| `GET /api/jobs/:jobId` | Auto-pay job status |
| `GET /api/statistics/*` | Summary, revenue, success rates, receipts |
| `GET /api/failed-payments/*` | Failed payment stats and list |

Root response example:

```json
{
  "message": "✅ Smart Subscription Manager backend is running!",
  "version": "1.0.0",
  "endpoints": {
    "subscriptions": "/api/subscriptions",
    "services": "/api/services",
    "jobs": "/api/jobs",
    "statistics": "/api/statistics",
    "failedPayments": "/api/failed-payments",
    "health": "/health"
  }
}
```

## Frontend Configuration

The app calls the backend via **app/src/services/subscriptionApi.ts**:

- Base URL: `import.meta.env.VITE_API_URL || 'http://localhost:5000/api'`
- For local dev, default is `http://localhost:5000/api` (no env needed).
- For a deployed backend, set in **app/.env**:  
  `VITE_API_URL=https://your-backend.example.com/api`

Restart the Vite dev server after changing env.

## Troubleshooting

### Backend won’t start

- **Database:** Ensure `DATABASE_URL` is correct and PostgreSQL is reachable. Run `npx prisma migrate deploy` and `npx prisma generate`.
- **Redis:** Queue and scheduler need Redis. Set `REDIS_URL` (or REDIS_USERNAME, PASSWORD, HOST, PORT). Without it, startup may fail when the worker initializes.

### Build errors

- Run from `backend/`: `yarn build` uses `tsc -p src/tsconfig.json`. Do not run `tsc` from repo root.
- If you see “would overwrite input file”, ensure `backend/src/tsconfig.json` has `"exclude": ["node_modules", "dist", ...]` and that `dist` is not under `include`.

### CORS

Backend uses `cors({ origin: '*' })`. If the frontend is on another host/port, CORS is already allowed.

### 404 / HTML instead of JSON

- Confirm backend is running on the port in `VITE_API_URL` (or 5000).
- Call `GET http://localhost:5000/health` and `GET http://localhost:5000/` to verify.

## Quick commands

```bash
# Terminal 1: Backend
cd backend && yarn dev

# Terminal 2: Frontend
cd app && yarn dev --host
```

Then open: **http://localhost:5173**

## Network

- **Hedera Testnet** – Chain ID 296, RPC `https://testnet.hashio.io/api`, explorer https://hashscan.io/testnet.
- Payments are in **HBAR** (native). Recipient must be a wallet (EOA) address.
