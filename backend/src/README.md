# Backend Source (Aluta)

This directory contains the **Aluta** subscription backend and, in the same tree, legacy **Story Protocol** TypeScript examples (scripts and utilities).

## Aluta subscription backend

**Entry:** `index.ts` – Express server, subscription/services/jobs/statistics/failed-payments APIs, health check.

**Run from repo root `backend/`:**

```bash
yarn dev
# or
yarn start
```

**Build (from `backend/`):**

```bash
yarn build
```

Uses `tsc -p src/tsconfig.json`. Output: `src/dist/`.  
Excluded from build: `node_modules`, `dist`, and script-only files that depend on optional packages (`utils/functions/createSpgNftCollection.ts`, `utils/functions/uploadToIpfs.ts`).

### Main modules

| Path | Purpose |
|------|---------|
| `index.ts` | Express app, routes, payment scheduler |
| `routes/` | subscriptions, services, jobs, statistics, failedPayments |
| `services/` | subscriptionService, paymentScheduler, failedPaymentTracker |
| `queue/` | autoPayQueue (Bull), autoPayWorker |
| `lib/prisma.ts` | Prisma client (PostgreSQL) |
| `utils/config.ts` | Hedera testnet chain config (RPC, explorer) |
| `utils/utils.ts` | Hedera explorer URLs, licensing helpers, etc. |
| `utils/cache.ts` | Caching for subscriptions/stats |

### Network

- **Hedera Testnet** – Chain ID 296, RPC `https://testnet.hashio.io/api`.  
- Payments are in **HBAR**. Config and explorer URLs are in `utils/config.ts`.

---

## Story Protocol SDK examples (optional)

Scripts and utilities under this directory also include **Story Protocol** TypeScript SDK examples (registration, licenses, derivatives, disputes, royalty, etc.). They are driven by **backend/src/package.json** (e.g. `npm run register`, `npm run mint-license`).

**Note:** The main Aluta app is run and built from **backend/package.json** (parent directory). The Story scripts use their own dependencies and are not required for the subscription backend. Some of their utilities (e.g. `utils/functions/createSpgNftCollection.ts`, `utils/functions/uploadToIpfs.ts`) rely on `client` from config or `pinata-web3` and are excluded from the Aluta backend build.

For Aluta-only development, use `backend/` as the working directory and the commands in the root **README.md** and **BACKEND-SETUP-GUIDE.md**.
